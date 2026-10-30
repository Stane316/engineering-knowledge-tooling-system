import { inflateSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import type { AnalysisDimension } from '../../src/analysis/types.js';
import type { Audit, AuditDimension, AuditMetadata } from '../../src/storage/types.js';
import { ChartGenerator } from '../../src/timeline/chart-generator.js';
import type { DimensionTimeline, TimelineAnalysis } from '../../src/timeline/timeline.types.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Timeline synthétique légère (sans base). */
function makeTimeline(
  seriesByDimension: Partial<Record<AnalysisDimension, number[]>>,
): TimelineAnalysis {
  const count = Object.values(seriesByDimension)[0]?.length ?? 0;
  const base = Date.parse('2026-10-01T12:00:00.000Z');

  const audits: Audit[] = Array.from({ length: count }, (_, index) => {
    const dimensions: AuditDimension[] = DIMENSIONS.map((dimension) => ({
      auditId: index + 1,
      dimension,
      score: seriesByDimension[dimension]?.[index] ?? 50,
      findingsCount: 1,
    }));
    const metadata: AuditMetadata = {
      id: index + 1,
      url: 'https://example.com',
      timestamp: new Date(base + index * 86_400_000).toISOString(),
      overallScore: 70,
      totalFindings: 5,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 2,
      lowFindings: 2,
      infoFindings: 2,
      projectId: 'chart-project',
    };
    return { metadata, dimensions, findings: [] };
  });

  const dimensionScores: DimensionTimeline[] = DIMENSIONS.map((dimension) => {
    const scores = seriesByDimension[dimension] ?? [];
    return {
      dimension,
      scores: audits.map((audit, index) => ({
        auditId: audit.metadata.id ?? 0,
        date: new Date(audit.metadata.timestamp),
        score: scores[index] ?? 50,
        findingsCount: 1,
      })),
      trend: { direction: 'stable', slope: 0, confidence: 0, description: 'stable' },
      averageScore: scores.length === 0 ? 0 : scores.reduce((sum, s) => sum + s, 0) / scores.length,
      minScore: scores.length === 0 ? 0 : Math.min(...scores),
      maxScore: scores.length === 0 ? 0 : Math.max(...scores),
    };
  });

  return {
    projectId: 'chart-project',
    projectName: 'Site & <exemple>',
    audits,
    startDate: new Date(audits[0]?.metadata.timestamp ?? 0),
    endDate: new Date(audits[audits.length - 1]?.metadata.timestamp ?? 0),
    totalAudits: count,
    dimensionScores,
  };
}

const SAMPLE = makeTimeline({
  performance: [60, 70, 75, 80, 90],
  accessibility: [70, 72, 71, 74, 76],
  seo: [55, 60, 65, 62, 70],
  ux: [80, 79, 81, 82, 84],
  content: [65, 66, 68, 67, 70],
});

describe('ChartGenerator', () => {
  const generator = new ChartGenerator();

  it('génère un SVG valide pour la timeline complète (C14.5)', () => {
    const svg = generator.generateTimelineChart(SAMPLE, 'svg') as string;

    expect(typeof svg).toBe('string');
    expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
    expect(svg).toContain('<svg width="800" height="400"');
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);

    // Les 5 dimensions tracées avec leurs couleurs.
    for (const color of ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']) {
      expect(svg).toContain(color);
    }
    expect(svg).toContain('path d="M');
    // Échappement XML du titre utilisateur (& → &amp;).
    expect(svg).toContain('Site &amp; &lt;exemple&gt;');
  });

  it('génère un SVG pour une dimension spécifique', () => {
    const svg = generator.generateDimensionChart(SAMPLE, 'performance', 'svg') as string;

    expect(svg).toContain('performance');
    expect(svg).toContain('#3b82f6');
    // Les autres dimensions ne sont pas tracées (légende limitée à performance).
    expect(svg).not.toContain('#ec4899');
  });

  it('lance une erreur pour une dimension inexistante', () => {
    expect(() =>
      generator.generateDimensionChart(SAMPLE, 'unknown' as AnalysisDimension, 'svg'),
    ).toThrow(/absente de l'analyse/);
  });

  it('respecte les options de personnalisation', () => {
    const svg = generator.generateTimelineChart(SAMPLE, 'svg', {
      width: 640,
      height: 320,
      title: 'Mon titre',
      showGrid: false,
      showLegend: false,
    }) as string;

    expect(svg).toContain('<svg width="640" height="320"');
    expect(svg).toContain('Mon titre');
    expect(svg).not.toContain('class="grid"');
    expect(svg).not.toContain('<rect x="70"');

    expect(() => generator.generateTimelineChart(SAMPLE, 'svg', { width: 10 })).toThrow(RangeError);
    expect(() => generator.generateTimelineChart(SAMPLE, 'svg', { height: 9999 })).toThrow(
      RangeError,
    );
  });

  it('génère un PNG conforme (signature, IHDR, IDAT, IEND) — C14.5', () => {
    const png = generator.generateTimelineChart(SAMPLE, 'png') as Buffer;

    expect(Buffer.isBuffer(png)).toBe(true);
    // Signature PNG.
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );

    // IHDR : dimensions 800×400, RGBA 8 bits.
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(800);
    expect(png.readUInt32BE(20)).toBe(400);
    expect(png[24]).toBe(8);
    expect(png[25]).toBe(6);

    // IDAT décompressible, taille de scanline conforme (filtre 1 octet + RGBA).
    const idatOffset = findChunk(png, 'IDAT');
    expect(idatOffset).toBeGreaterThan(0);
    const length = png.readUInt32BE(idatOffset);
    const raw = inflateSync(png.subarray(idatOffset + 8, idatOffset + 8 + length));
    expect(raw.length).toBe((800 * 4 + 1) * 400);

    expect(findChunk(png, 'IEND')).toBeGreaterThan(idatOffset);
  });

  it('génère un PNG de dimension spécifique avec dimensions surchargées', () => {
    const png = generator.generateDimensionChart(SAMPLE, 'performance', 'png', {
      width: 300,
      height: 200,
      showLegend: false,
    }) as Buffer;

    expect(png.readUInt32BE(16)).toBe(300);
    expect(png.readUInt32BE(20)).toBe(200);
  });

  it('gère une timeline vide sans erreur (SVG et PNG)', () => {
    const empty = makeTimeline({});
    const svg = generator.generateTimelineChart(empty, 'svg') as string;
    expect(svg).toContain('</svg>');
    expect(svg).not.toContain('path d="M');

    const png = generator.generateTimelineChart(empty, 'png', { width: 120, height: 80 }) as Buffer;
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.readUInt32BE(16)).toBe(120);
    expect(png.readUInt32BE(20)).toBe(80);
  });
});

/** Offset du premier chunk de type donné (skip signature 8 octets). */
function findChunk(png: Buffer, type: string): number {
  let offset = 8;
  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const chunkType = png.toString('ascii', offset + 4, offset + 8);
    if (chunkType === type) return offset;
    offset += 12 + length;
  }
  return -1;
}
