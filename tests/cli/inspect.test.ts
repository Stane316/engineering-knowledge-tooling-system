import { rm } from 'node:fs/promises';
import path from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { labVitals } from '../../src/analysis/measurement.js';

import { runCli } from '../../src/cli/program.js';
import type {
  AxeAnalysis,
  ContentAnalysis,
  LighthouseAnalysis,
  UxAnalysis,
} from '../../src/browser/inspection/types.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

/**
 * Les tests de flux remplacent la seule étape réseau (l'inspecteur navigateur)
 * par une fixture L3 et le générateur PDF par un double : analyse, stockage,
 * indexation et Markdown restent réels, sans connexion externe.
 */
const { inspectMock, generatePdfMock } = vi.hoisted(() => ({
  inspectMock: vi.fn(),
  generatePdfMock: vi.fn(),
}));

vi.mock('../../src/browser/inspection/inspector.js', () => ({
  Inspector: class {
    readonly inspect = inspectMock;
  },
}));

vi.mock('../../src/reports/pdf-generator.js', () => ({
  PDFReportGenerator: class {
    readonly generate = generatePdfMock;
    readonly generateComparison = vi.fn();
  },
}));

/** Analyse Lighthouse de référence (formes exactes du Sprint 8). */
const lighthouseFixture: LighthouseAnalysis = {
  performance: {
    score: 100,
    metrics: labVitals({ lcp: 220, inp: 36, cls: 0.004, ttfb: 92, fcp: 180, 'speed-index': 260 }),
  },
  seo: { score: 80, issues: [] },
  url: 'https://example.com/',
  version: '13.5.0',
  duration: 4200,
};

/** Analyse axe-core de référence. */
const axeFixture: AxeAnalysis = {
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must have sufficient color contrast',
      help: 'Ensure contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
      nodes: 3,
      tags: ['wcag2aa'],
    },
  ],
  score: 73,
  passCount: 11,
  inapplicableCount: 40,
  duration: 300,
};

/** Analyse UX de référence. */
const uxFixture: UxAnalysis = {
  score: 85,
  heuristics: [
    {
      id: 'status',
      name: 'Visibility of system status',
      score: 60,
      issues: ['Pas de progression'],
    },
  ],
};

/** Analyse de contenu de référence. */
const contentFixture: ContentAnalysis = {
  score: 55,
  wordCount: 133,
  readingTime: 1,
  readabilityScore: 77,
  structure: { paragraphs: 4, lists: 0, tables: 0, headings: 2 },
};

/** Inspection L3 complète renvoyée par le double de l'inspecteur. */
function l3Inspection(url: string): Record<string, unknown> {
  return {
    url,
    timestamp: '2026-10-25T00:00:00.000Z',
    duration: 420,
    budget: 3000,
    level: 'L3',
    lighthouse: lighthouseFixture,
    axe: axeFixture,
    ux: uxFixture,
    content: contentFixture,
  };
}

/** Lance une commande en réinitialisant les sorties (un seul run observé à la fois). */
const run = async (runtime: TestRuntime, ...argv: string[]): Promise<number> => {
  runtime.output.stdout = '';
  runtime.output.stderr = '';
  return runCli(argv, runtime);
};
const allOutput = (runtime: TestRuntime): string => runtime.output.stdout + runtime.output.stderr;
const json = <T>(runtime: TestRuntime): T => JSON.parse(runtime.output.stdout) as T;

interface InspectPayload {
  readonly url: string;
  readonly level: string;
  readonly auditId: number;
  readonly score: number;
  readonly reports: readonly { readonly format: string; readonly filePath: string }[];
}

describe('CLI inspect', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
    inspectMock.mockReset();
    generatePdfMock.mockReset();
  });

  afterEach(async () => {
    removeDataDir(dataDir);
    await rm(dataDir, { recursive: true, force: true });
  });

  it('enregistre la commande avec ses options', async () => {
    expect(await run(runtime, 'inspect', '--help')).toBe(0);
    const output = allOutput(runtime);
    expect(output).toContain('inspect [options] <url>');
    expect(output).toContain('--level');
    expect(output).toContain('--output');
    expect(output).toContain('--format');
    expect(output).toContain('L3');
  });

  it("refuse un niveau sans entrées d'analyse (L2 → L3 requis) sans aucun réseau", async () => {
    const started = Date.now();
    const code = await run(runtime, 'inspect', 'https://example.com', '--level', 'L2');
    const elapsed = Date.now() - started;

    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/L3/);
    expect(elapsed).toBeLessThan(500);
    expect(inspectMock).not.toHaveBeenCalled();
  });

  it('refuse un niveau inconnu', async () => {
    const code = await run(runtime, 'inspect', 'https://example.com', '--level', 'L4');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/niveau invalide/);
  });

  it('refuse un format inconnu', async () => {
    const code = await run(runtime, 'inspect', 'https://example.com', '--format', 'docx');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/format invalide/);
  });

  it("délègue l'URL manquante à Commander (usage affiché)", async () => {
    const code = await run(runtime, 'inspect');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/url/i);
  });

  it('exécute le flux complet (inspecter → analyser → stocker → Markdown) sans réseau', async () => {
    inspectMock.mockResolvedValue(l3Inspection('https://example.com'));
    const output = path.join(dataDir, 'reports-md');

    const code = await run(
      runtime,
      'inspect',
      'https://example.com',
      '--format',
      'md',
      '--output',
      output,
      '--json',
    );
    expect(code).toBe(0);

    const payload = json<InspectPayload>(runtime);
    expect(payload.url).toBe('https://example.com');
    expect(payload.level).toBe('L3');
    expect(payload.auditId).toBeGreaterThan(0);
    expect(payload.score).toBeGreaterThanOrEqual(0);
    expect(payload.reports).toHaveLength(1);
    expect(payload.reports[0]?.format).toBe('markdown');
    expect(payload.reports[0]?.filePath).toContain(output);
    expect(inspectMock).toHaveBeenCalledWith({ url: 'https://example.com', level: 'L3' });
    expect(allOutput(runtime)).not.toContain('Erreur');
  });

  it('génère Markdown et PDF en --format both (double du générateur PDF)', async () => {
    inspectMock.mockResolvedValue(l3Inspection('https://example.org'));
    generatePdfMock.mockResolvedValue({
      format: 'pdf',
      filePath: '/tmp/inspect-fake.pdf',
      content: '%PDF-1.4 fake',
      generatedAt: '2026-10-25T00:00:00.000Z',
    });
    const output = path.join(dataDir, 'reports-both');

    const code = await run(
      runtime,
      'inspect',
      'https://example.org',
      '--format',
      'both',
      '--output',
      output,
      '--json',
    );
    expect(code).toBe(0);

    const payload = json<InspectPayload>(runtime);
    expect(payload.reports.map((entry) => entry.format)).toEqual(['markdown', 'pdf']);
    expect(generatePdfMock).toHaveBeenCalledTimes(1);
  });

  it("signale une inspection retournée d'un niveau inattendu", async () => {
    inspectMock.mockResolvedValue({
      url: 'https://example.com',
      timestamp: '2026-10-25T00:00:00.000Z',
      duration: 90,
      budget: 2000,
      level: 'L1',
    });

    const code = await run(runtime, 'inspect', 'https://example.com', '--format', 'md');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/inspection inattendue/);
  });

  it('applique les défauts de niveau et de format (L3, both, PDF en mémoire)', async () => {
    inspectMock.mockResolvedValue(l3Inspection('https://defauts.example'));
    generatePdfMock.mockResolvedValue({
      format: 'pdf',
      generatedAt: '2026-10-25T00:00:00.000Z',
    });
    const output = path.join(dataDir, 'reports-defaults');

    const code = await run(
      runtime,
      'inspect',
      'https://defauts.example',
      '--output',
      output,
      '--json',
    );
    expect(code).toBe(0);

    const payload = json<InspectPayload>(runtime);
    expect(payload.level).toBe('L3');
    expect(payload.reports.map((entry) => entry.format)).toEqual(['markdown', 'pdf']);
    expect(payload.reports[1]?.filePath).toBe('(mémoire)');
  });

  it('signale les artefacts créés quand le PDF échoue après le Markdown (C-W11)', async () => {
    inspectMock.mockResolvedValue(l3Inspection('https://partiel.example'));
    generatePdfMock.mockRejectedValue(new Error('Chromium introuvable'));
    const output = path.join(dataDir, 'reports-partiels');

    const code = await run(
      runtime,
      'inspect',
      'https://partiel.example',
      '--output',
      output,
      '--format',
      'both',
    );

    // Échec partiel : la commande ne prétend jamais que rien n'a été créé.
    expect(code).not.toBe(0);
    const text = allOutput(runtime);
    expect(text).toMatch(/Audit #\d+ (stocké|enregistré)/);
    expect(text).toContain('MARKDOWN');
    expect(text).toContain(output);
    expect(text).toMatch(/PDF[^\n]*(échou|échec)/i);
    expect(text).toContain('Chromium introuvable');
    expect(text).toContain('ekts audit report');
  });

  it("régénère un rapport depuis l'ID sans créer d'audit (C-W11)", async () => {
    inspectMock.mockResolvedValue(l3Inspection('https://reprise.example'));
    generatePdfMock.mockRejectedValue(new Error('Chromium introuvable'));
    const output = path.join(dataDir, 'reports-reprise');

    await run(
      runtime,
      'inspect',
      'https://reprise.example',
      '--output',
      output,
      '--format',
      'both',
    );

    const countAudits = (): number => {
      const database = new Database(path.join(dataDir, 'ekts.db'), { readonly: true });
      try {
        const row = database.prepare('SELECT COUNT(*) AS n FROM audit_metadata').get() as {
          n: number;
        };
        return row.n;
      } finally {
        database.close();
      }
    };
    const lastId = (): number => {
      const database = new Database(path.join(dataDir, 'ekts.db'), { readonly: true });
      try {
        const row = database.prepare('SELECT MAX(id) AS id FROM audit_metadata').get() as {
          id: number;
        };
        return row.id;
      } finally {
        database.close();
      }
    };

    const before = countAudits();
    const id = lastId();

    const code = await run(
      runtime,
      'audit',
      'report',
      String(id),
      '--format',
      'md',
      '--output',
      path.join(dataDir, 'reports-regeneres'),
    );

    expect(code).toBe(0);
    expect(allOutput(runtime)).toContain(`Rapports pour l'audit #${String(id)}`);
    expect(countAudits()).toBe(before);
  });
});
