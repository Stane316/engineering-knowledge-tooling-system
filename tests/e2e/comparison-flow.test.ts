/**
 * Sprint 12-1 — E2E : comparaison d'audits → rapport d'évolution.
 *
 * Flux sans navigation : deux rapports d'analyse réels (pipeline exécuté sur
 * des inspections de référence, avec écart de scores volontaire) sont stockés,
 * comparés par `AuditComparator`, puis rendus en Markdown. Exécutable partout,
 * y compris CI et environnements sans navigateur.
 */
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { labVitals } from '../../src/analysis/measurement.js';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import { fromInspection } from '../../src/analysis/adapter.js';
import type {
  AxeAnalysis,
  ContentAnalysis,
  LighthouseAnalysis,
  UxAnalysis,
} from '../../src/browser/inspection/types.js';
import type { Audit } from '../../src/storage/types.js';
import { openDatabase } from '../../src/data/database.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AuditComparator } from '../../src/reports/comparator.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';

/** Blocs Lighthouse performants (score 100 sur la performance). */
const fastLighthouse: LighthouseAnalysis = {
  performance: {
    score: 100,
    metrics: labVitals({ lcp: 900, inp: 40, cls: 0.002, ttfb: 60, fcp: 700, 'speed-index': 950 }),
  },
  seo: { score: 95, issues: [] },
  url: 'https://exemple-audit.test/',
  version: '13.5.0',
  duration: 2100,
};

/** Blocs Lighthouse lents (score 40) : l'écart crée la tendance « improving ». */
const slowLighthouse: LighthouseAnalysis = {
  performance: {
    score: 40,
    metrics: labVitals({
      lcp: 4800,
      inp: 480,
      cls: 0.24,
      ttfb: 900,
      fcp: 4200,
      'speed-index': 5100,
    }),
  },
  seo: { score: 60, issues: [] },
  url: 'https://exemple-audit.test/',
  version: '13.5.0',
  duration: 3400,
};

/** Violation d'accessibilité présente uniquement dans l'audit « avant ». */
const axeWithViolation: AxeAnalysis = {
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Contraste insuffisant',
      help: 'Augmenter le contraste',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
      nodes: 12,
      tags: ['wcag2aa'],
    },
  ],
  score: 55,
  passCount: 8,
  inapplicableCount: 40,
  duration: 240,
};

const axeClean: AxeAnalysis = {
  violations: [],
  score: 96,
  passCount: 30,
  inapplicableCount: 40,
  duration: 220,
};

const uxFixture: UxAnalysis = {
  score: 70,
  heuristics: [
    { id: 'status', name: 'Visibility of system status', score: 40, issues: ['Pas de retour'] },
  ],
};

const contentFixture: ContentAnalysis = {
  score: 60,
  wordCount: 240,
  readingTime: 2,
  readabilityScore: 58,
  structure: { paragraphs: 6, lists: 1, tables: 0, headings: 3 },
};

/** URL du scénario (hors ligne : aucune navigation). */
const URL_AUDIT = 'https://exemple-audit.test/';

/** Analyse deux inspections de référence avec le pipeline réel. */
async function analyze(
  pipeline: AnalysisPipeline,
  lighthouse: LighthouseAnalysis,
  axe: AxeAnalysis,
): ReturnType<AnalysisPipeline['analyze']> {
  const inputs = fromInspection({ lighthouse, axe, ux: uxFixture, content: contentFixture });

  return pipeline.analyze(URL_AUDIT, inputs.lighthouse, inputs.axe, inputs.ux, inputs.content);
}

describe('E2E — comparison-flow', () => {
  let dataDir: string;

  beforeAll(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-comparison-'));
  });

  afterAll(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('stocke deux audits, les compare et écrit le rapport Markdown', async () => {
    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      const pipeline = new AnalysisPipeline();

      // 1. Deux analyses réelles à partir d'inspections de référence.
      const reportBefore = await analyze(pipeline, slowLighthouse, axeWithViolation);
      const reportAfter = await analyze(pipeline, fastLighthouse, axeClean);

      const auditBefore: Audit = repository.store(reportBefore);
      const auditAfter: Audit = repository.store(reportAfter);
      expect(auditBefore.metadata.id).toBeGreaterThan(0);
      expect(auditAfter.metadata.id).toBeGreaterThan(0);
      const scoreBefore = auditBefore.metadata.overallScore;
      const scoreAfter = auditAfter.metadata.overallScore;
      expect(scoreBefore).not.toBeNull();
      expect(scoreAfter).not.toBeNull();
      expect(scoreAfter ?? 0).toBeGreaterThan(scoreBefore ?? 0);

      // 2. Comparaison.
      const comparison = new AuditComparator().compare(auditBefore, auditAfter);

      expect(comparison.evolution.scoreA).toBe(auditBefore.metadata.overallScore);
      expect(comparison.evolution.scoreB).toBe(auditAfter.metadata.overallScore);
      expect(comparison.evolution.status).toBe('measured');
      expect(comparison.evolution.delta).toBe((scoreAfter ?? 0) - (scoreBefore ?? 0));
      expect(comparison.evolution.trend).toBe('improving');
      expect(comparison.deltaFindings.newFindings).toEqual([]);
      expect(comparison.deltaFindings.resolvedFindings.length).toBeGreaterThan(0);
      expect(comparison.recommendations.length).toBeGreaterThan(0);

      // 3. Rapport de comparaison écrit sur disque.
      const generated = await new MarkdownReportGenerator().generateComparison(comparison, {
        outputPath: dataDir,
      });

      expect(generated.format).toBe('markdown');
      expect(generated.filePath).toBeDefined();
      expect((await stat(generated.filePath!)).size).toBeGreaterThan(100);

      const content = await readFile(generated.filePath!, 'utf8');
      expect(content).toContain("Comparaison d'audits");
      expect(content).toContain(URL_AUDIT);
      expect(content).toContain(String(auditBefore.metadata.overallScore));
      expect(content).toContain(String(auditAfter.metadata.overallScore));
    } finally {
      database.close();
    }
  });

  it('rejette une comparaison incomplète sans corrompre la base', async () => {
    const database = openDatabase({ dataDir });
    try {
      const repository = new AuditRepository(database.connection);
      const pipeline = new AnalysisPipeline();
      const report = await analyze(pipeline, slowLighthouse, axeWithViolation);
      const audit = repository.store(report);

      expect(() => new AuditComparator().compare(audit, undefined as unknown as Audit)).toThrow();

      // La base reste lisible après l'échec.
      expect(repository.findByUrl(URL_AUDIT).length).toBeGreaterThanOrEqual(2);
    } finally {
      database.close();
    }
  });
});
