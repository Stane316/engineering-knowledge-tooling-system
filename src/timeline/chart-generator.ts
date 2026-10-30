import { deflateSync } from 'node:zlib';

import type { AnalysisDimension } from '../analysis/types.js';
import type { DimensionScorePoint, DimensionTimeline, TimelineAnalysis } from './timeline.types.js';

/**
 * Points réellement mesurés d'une série.
 *
 * Sprint 19-03 : un score indisponible (`null`) n'est pas tracé — le dessiner à
 * `0` afficherait une chute de performance qui n'a pas eu lieu.
 *
 * @param scores - Série d'une dimension.
 * @returns Les points dont le score est un nombre.
 */
function measuredPoints(
  scores: readonly DimensionScorePoint[],
): Array<DimensionScorePoint & { score: number }> {
  return scores.filter(
    (point): point is DimensionScorePoint & { score: number } => point.score !== null,
  );
}

/** Formats d'export (C14.5 : PNG et SVG). */
export type ChartFormat = 'svg' | 'png';

/** Options de mise en page des graphiques. */
export interface ChartOptions {
  /** Largeur en pixels. */
  width: number;
  /** Hauteur en pixels. */
  height: number;
  /** Titre (défaut : nom du projet). */
  title?: string;
  /** Légende des dimensions (défaut : vraie). */
  showLegend: boolean;
  /** Grille horizontale (défaut : vraie). */
  showGrid: boolean;
}

/** Palette commune SVG/PNG (couleurs distinctes par dimension). */
const COLORS: Record<AnalysisDimension, string> = {
  performance: '#3b82f6',
  accessibility: '#10b981',
  seo: '#f59e0b',
  ux: '#8b5cf6',
  content: '#ec4899',
};

/** Dimensions dans l'ordre de légende. */
const LEGEND_ORDER: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
];

/** Options par défaut. */
const DEFAULTS: ChartOptions = {
  width: 800,
  height: 400,
  showLegend: true,
  showGrid: true,
};

/** Géométrie interne identique pour SVG et PNG. */
const PADDING = { top: 40, right: 20, bottom: 60, left: 60 } as const;

/**
 * Générateur de graphiques de timeline (Sprint 14).
 *
 * - **SVG** : sortie texte complète (titre, axes, légende, grille).
 * - **PNG** : rasterisation maison (lignes, points, texte via micro-fonte
 *   5×7) + encodage PNG par `node:zlib` — **aucune dépendance externe**
 *   (décision P3 : la spec prévoyait un `throw` pour PNG, C14.5 l'exige).
 */
export class ChartGenerator {
  /**
   * Graphique d'évolution de toutes les dimensions.
   *
   * @param analysis - Timeline du projet.
   * @param format - `svg` (défaut) ou `png`.
   * @param options - Surcharge des options.
   * @returns SVG (string) ou PNG (Buffer).
   * @throws {RangeError} Dimensions hors plage (50-4000 / 50-4000).
   */
  generateTimelineChart(
    analysis: TimelineAnalysis,
    format: ChartFormat = 'svg',
    options?: Partial<ChartOptions>,
  ): string | Buffer {
    const opts = resolveOptions(options);
    if (format === 'svg') {
      return this.timelineSvg(analysis, opts);
    }
    return this.renderPng(analysis, undefined, opts);
  }

  /**
   * Graphique d'une seule dimension.
   *
   * @param analysis - Timeline du projet.
   * @param dimension - Dimension à tracer.
   * @param format - `svg` (défaut) ou `png`.
   * @param options - Surcharge des options.
   * @returns SVG (string) ou PNG (Buffer).
   * @throws {Error} Dimension absente de l'analyse.
   * @throws {RangeError} Dimensions d'image hors plage.
   */
  generateDimensionChart(
    analysis: TimelineAnalysis,
    dimension: AnalysisDimension,
    format: ChartFormat = 'svg',
    options?: Partial<ChartOptions>,
  ): string | Buffer {
    const opts = resolveOptions(options);
    const series = analysis.dimensionScores.find((entry) => entry.dimension === dimension);
    if (series === undefined) {
      throw new Error(`Dimension ${dimension} absente de l'analyse`);
    }
    if (format === 'svg') {
      return this.dimensionSvg(series, opts);
    }
    return this.renderPng(analysis, dimension, opts);
  }

  // ───────────────────────────── SVG ─────────────────────────────

  /** SVG complet (toutes dimensions). */
  private timelineSvg(analysis: TimelineAnalysis, opts: ChartOptions): string {
    const { width, height } = opts;
    const chart = chartMetrics(opts);
    const title = escapeXml(opts.title ?? `Timeline — ${analysis.projectName}`);

    const parts: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
      '  <style>',
      '    .axis { stroke: #000; stroke-width: 1; }',
      '    .grid { stroke: #e5e7eb; stroke-width: 0.5; }',
      '    .line { fill: none; stroke-width: 2; }',
      '    .point { stroke-width: 2; }',
      '    .text { font-family: Arial, sans-serif; font-size: 12px; }',
      '    .title { font-size: 16px; font-weight: bold; }',
      '  </style>',
      `  <rect width="${width}" height="${height}" fill="#ffffff"/>`,
      `  <text x="${width / 2}" y="20" text-anchor="middle" class="text title">${title}</text>`,
    ];

    if (opts.showGrid) {
      for (let i = 0; i <= 10; i++) {
        const y = PADDING.top + (chart.innerHeight / 10) * i;
        parts.push(
          `  <line x1="${PADDING.left}" y1="${y}" x2="${PADDING.left + chart.innerWidth}" y2="${y}" class="grid"/>`,
        );
      }
    }

    parts.push(
      `  <line x1="${PADDING.left}" y1="${PADDING.top}" x2="${PADDING.left}" y2="${PADDING.top + chart.innerHeight}" class="axis"/>`,
      `  <line x1="${PADDING.left}" y1="${PADDING.top + chart.innerHeight}" x2="${PADDING.left + chart.innerWidth}" y2="${PADDING.top + chart.innerHeight}" class="axis"/>`,
    );

    for (let i = 0; i <= 10; i++) {
      const y = PADDING.top + (chart.innerHeight / 10) * i;
      parts.push(
        `  <text x="${PADDING.left - 10}" y="${y + 4}" text-anchor="end" class="text">${String(100 - i * 10)}</text>`,
      );
    }

    const seriesList = analysis.dimensionScores.length > 0 ? analysis.dimensionScores : [];
    for (const dimTimeline of seriesList) {
      const color = COLORS[dimTimeline.dimension];
      const points = measuredPoints(dimTimeline.scores);
      if (points.length === 0) continue;
      const pathPoints = points.map((point, index) => ({
        x: PADDING.left + (chart.innerWidth / Math.max(points.length - 1, 1)) * index,
        y: PADDING.top + chart.innerHeight - (point.score / 100) * chart.innerHeight,
      }));
      const path = pathPoints
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
      parts.push(`  <path d="${path}" class="line" stroke="${color}"/>`);
      for (const point of pathPoints) {
        parts.push(
          `  <circle cx="${point.x}" cy="${point.y}" r="3" fill="${color}" class="point" stroke="${color}"/>`,
        );
      }
    }

    parts.push(...this.legendSvg(opts, seriesList));
    parts.push('</svg>');
    return parts.join('\n');
  }

  /** SVG d'une dimension. */
  private dimensionSvg(dimTimeline: DimensionTimeline, opts: ChartOptions): string {
    const { width, height } = opts;
    const chart = chartMetrics(opts);
    const color = COLORS[dimTimeline.dimension];
    const title = escapeXml(
      opts.title ?? `${dimTimeline.dimension} — ${dimTimeline.trend.description}`,
    );

    const parts: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
      '  <style>',
      '    .axis { stroke: #000; stroke-width: 1; }',
      '    .grid { stroke: #e5e7eb; stroke-width: 0.5; }',
      '    .line { fill: none; stroke-width: 2; }',
      '    .point { stroke-width: 2; }',
      '    .text { font-family: Arial, sans-serif; font-size: 12px; }',
      '    .title { font-size: 16px; font-weight: bold; }',
      '  </style>',
      `  <rect width="${width}" height="${height}" fill="#ffffff"/>`,
      `  <text x="${width / 2}" y="20" text-anchor="middle" class="text title">${title}</text>`,
    ];

    if (opts.showGrid) {
      for (let i = 0; i <= 10; i++) {
        const y = PADDING.top + (chart.innerHeight / 10) * i;
        parts.push(
          `  <line x1="${PADDING.left}" y1="${y}" x2="${PADDING.left + chart.innerWidth}" y2="${y}" class="grid"/>`,
        );
      }
    }
    parts.push(
      `  <line x1="${PADDING.left}" y1="${PADDING.top}" x2="${PADDING.left}" y2="${PADDING.top + chart.innerHeight}" class="axis"/>`,
      `  <line x1="${PADDING.left}" y1="${PADDING.top + chart.innerHeight}" x2="${PADDING.left + chart.innerWidth}" y2="${PADDING.top + chart.innerHeight}" class="axis"/>`,
    );
    for (let i = 0; i <= 10; i++) {
      const y = PADDING.top + (chart.innerHeight / 10) * i;
      parts.push(
        `  <text x="${PADDING.left - 10}" y="${y + 4}" text-anchor="end" class="text">${String(100 - i * 10)}</text>`,
      );
    }

    const points = measuredPoints(dimTimeline.scores);
    if (points.length > 0) {
      const pathPoints = points.map((point, index) => ({
        x: PADDING.left + (chart.innerWidth / Math.max(points.length - 1, 1)) * index,
        y: PADDING.top + chart.innerHeight - (point.score / 100) * chart.innerHeight,
      }));
      const path = pathPoints
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
      parts.push(`  <path d="${path}" class="line" stroke="${color}"/>`);
      for (const point of pathPoints) {
        parts.push(
          `  <circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}" class="point" stroke="${color}"/>`,
        );
      }
    }

    parts.push(...this.legendSvg(opts, [dimTimeline]));
    parts.push('</svg>');
    return parts.join('\n');
  }

  /** Légende (SVG). */
  private legendSvg(opts: ChartOptions, seriesList: readonly DimensionTimeline[]): string[] {
    if (!opts.showLegend || seriesList.length === 0) return [];
    const shown = new Set(seriesList.map((entry) => entry.dimension));
    const parts: string[] = [];
    let legendY = PADDING.top + 10;
    for (const dimension of LEGEND_ORDER) {
      if (!shown.has(dimension)) continue;
      parts.push(
        `  <rect x="${PADDING.left + 10}" y="${legendY - 8}" width="16" height="16" fill="${COLORS[dimension]}"/>`,
        `  <text x="${PADDING.left + 34}" y="${legendY + 4}" class="text">${dimension}</text>`,
      );
      legendY += 24;
    }
    return parts;
  }

  // ───────────────────────────── PNG ─────────────────────────────

  /** Rastérise et encode le graphique en PNG (Buffer 8-bit RGBA). */
  private renderPng(
    analysis: TimelineAnalysis,
    onlyDimension: AnalysisDimension | undefined,
    opts: ChartOptions,
  ): Buffer {
    const canvas = new RgbaCanvas(opts.width, opts.height);
    const chart = chartMetrics(opts);
    const title = (opts.title ?? `Timeline - ${analysis.projectName}`)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    canvas.fillAll('#ffffff');
    canvas.text(8, 8, title, '#111111', 2);

    if (opts.showGrid) {
      for (let i = 0; i <= 10; i++) {
        const y = Math.round(PADDING.top + (chart.innerHeight / 10) * i);
        canvas.horizontalLine(PADDING.left, PADDING.left + chart.innerWidth, y, '#e5e7eb');
        canvas.text(PADDING.left - 30, y - 3, String(100 - i * 10), '#444444', 1);
      }
    }
    canvas.verticalLine(PADDING.top, PADDING.top + chart.innerHeight, PADDING.left, '#000000');
    canvas.horizontalLine(
      PADDING.left,
      PADDING.left + chart.innerWidth,
      PADDING.top + chart.innerHeight,
      '#000000',
    );

    const seriesList =
      onlyDimension === undefined
        ? analysis.dimensionScores
        : analysis.dimensionScores.filter((entry) => entry.dimension === onlyDimension);

    for (const dimTimeline of seriesList) {
      const color = COLORS[dimTimeline.dimension];
      const points = measuredPoints(dimTimeline.scores);
      const count = points.length;
      if (count === 0) continue;
      const xs: number[] = [];
      const ys: number[] = [];
      for (const [index, point] of points.entries()) {
        xs.push(Math.round(PADDING.left + (chart.innerWidth / Math.max(count - 1, 1)) * index));
        ys.push(
          Math.round(PADDING.top + chart.innerHeight - (point.score / 100) * chart.innerHeight),
        );
      }
      for (let i = 1; i < xs.length; i++) {
        canvas.line(xs[i - 1] ?? 0, ys[i - 1] ?? 0, xs[i] ?? 0, ys[i] ?? 0, color);
      }
      for (const [index, pointX] of xs.entries()) {
        canvas.disc(pointX, ys[index] ?? 0, 3, color);
      }
    }

    if (opts.showLegend && seriesList.length > 0) {
      const shown = new Set(seriesList.map((entry) => entry.dimension));
      let legendY = PADDING.top + 6;
      for (const dimension of LEGEND_ORDER) {
        if (!shown.has(dimension)) continue;
        canvas.fillRect(PADDING.left + 12, legendY, 14, 14, COLORS[dimension]);
        canvas.text(PADDING.left + 32, legendY + 3, dimension, '#111111', 1);
        legendY += 22;
      }
    }

    return encodePng(canvas.pixels, opts.width, opts.height);
  }
}

// ───────────────────────── helpers ─────────────────────────

/** Fusionne options et défauts avec validation des bornes. */
function resolveOptions(options?: Partial<ChartOptions>): ChartOptions {
  const opts = { ...DEFAULTS, ...options };
  for (const [name, value] of [
    ['width', opts.width],
    ['height', opts.height],
  ] as const) {
    if (!Number.isInteger(value) || value < 50 || value > 4000) {
      throw new RangeError(`${name} hors plage (50-4000) : ${String(value)}`);
    }
  }
  return opts;
}

/** Métriques du tracé (zone utile). */
function chartMetrics(opts: ChartOptions): { innerWidth: number; innerHeight: number } {
  return {
    innerWidth: opts.width - PADDING.left - PADDING.right,
    innerHeight: opts.height - PADDING.top - PADDING.bottom,
  };
}

/** Échappement XML minimal (titres utilisateur). */
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// ────────────────────── raster canvas (PNG) ──────────────────────

/** Canvas RGBA minimal (remplissage, lignes, disques, texte 5×7). */
class RgbaCanvas {
  readonly pixels: Uint8Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.pixels = new Uint8Array(width * height * 4);
  }

  /** Remplit tout le canvas d'une couleur hexadécimale. */
  fillAll(hex: string): void {
    const [r, g, b] = parseHex(hex);
    for (let i = 0; i < this.pixels.length; i += 4) {
      this.pixels[i] = r;
      this.pixels[i + 1] = g;
      this.pixels[i + 2] = b;
      this.pixels[i + 3] = 255;
    }
  }

  /** Positionne un pixel si dans les bornes. */
  private setPixel(x: number, y: number, hex: string): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const [r, g, b] = parseHex(hex);
    const offset = (y * this.width + x) * 4;
    this.pixels[offset] = r;
    this.pixels[offset + 1] = g;
    this.pixels[offset + 2] = b;
    this.pixels[offset + 3] = 255;
  }

  /** Ligne (algorithme de Bresenham). */
  line(x0: number, y0: number, x1: number, y1: number, hex: string): void {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.setPixel(x, y, hex);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** Segment horizontal (grille, axes). */
  horizontalLine(x0: number, x1: number, y: number, hex: string): void {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.setPixel(x, y, hex);
  }

  /** Segment vertical (axes). */
  verticalLine(y0: number, y1: number, x: number, hex: string): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.setPixel(x, y, hex);
  }

  /** Disque plein (point de courbe). */
  disc(cx: number, cy: number, radius: number, hex: string): void {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) this.setPixel(cx + x, cy + y, hex);
      }
    }
  }

  /** Rectangle plein (pastille de légende). */
  fillRect(x: number, y: number, w: number, h: number, hex: string): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) this.setPixel(x + dx, y + dy, hex);
    }
  }

  /** Texte micro-fonte 5×7 (échelle entière ≥ 1). */
  text(x: number, y: number, value: string, hex: string, scale = 1): void {
    let cursor = x;
    for (const rawChar of value) {
      const glyph = FONT_5X7[rawChar.toUpperCase()] ?? FALLBACK_GLYPH;
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row] ?? '00000';
        for (let col = 0; col < 5; col++) {
          if (bits[col] !== '1') continue;
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              this.setPixel(cursor + col * scale + sx, y + row * scale + sy, hex);
            }
          }
        }
      }
      cursor += 6 * scale;
    }
  }
}

/** Parse `#rrggbb` en composants. */
function parseHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

// ────────────────────── encodage PNG ──────────────────────

/** Table CRC32 (IEEE 802.3), initialisée à la volée. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC32 d'un buffer. */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Construit un chunk PNG (longueur + type + données + CRC). */
function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/**
 * Encode des pixels RGBA en PNG (signature, IHDR, IDAT zlib, IEND).
 *
 * @param pixels - `width * height * 4` octets RGBA.
 * @param width - Largeur.
 * @param height - Hauteur.
 * @returns Buffer PNG complet.
 */
function encodePng(pixels: Uint8Array, width: number, height: number): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filtre « none »
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(
      raw,
      rowStart + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Glyphe de repli (interrogatif) pour tout caractère hors table. */
const FALLBACK_GLYPH: readonly string[] = [
  '01110',
  '10001',
  '00001',
  '00010',
  '00100',
  '00000',
  '00100',
];

/**
 * Micro-fonte 5×7 (A-Z, 0-9, ponctuation ASCII).
 * Chaque glyphe = 7 rangées de 5 bits (`'0'`/`'1'`).
 */
const FONT_5X7: Record<string, readonly string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '01010', '00100', '00100', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '00110', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
};
