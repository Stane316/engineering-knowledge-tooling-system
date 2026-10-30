import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  AnalysisDimension,
  AnalysisReport,
  Finding,
  Priority,
} from '../../src/analysis/types.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectNotFoundError, ValidationError } from '../../src/shared/errors.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { TimelineAnalyzer } from '../../src/timeline/timeline-analyzer.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Rapport avec scores libres par dimension (fixtures timeline). */
function makeReport(
  scores: Record<AnalysisDimension, number>,
  url = 'https://example.com',
  timestamp = new Date().toISOString(),
): AnalysisReport {
  const findings: Finding[] = [];
  const count = (priority: Priority): number =>
    findings.filter((f) => f.priority === priority).length;

  return {
    url,
    timestamp,
    dimensions: Object.fromEntries(
      DIMENSIONS.map((name) => [
        name,
        {
          dimension: name,
          score: scores[name],
          findings: [],
          summary: `Score ${name} : ${String(scores[name])}/100.`,
        },
      ]),
    ) as unknown as AnalysisReport['dimensions'],
    findings,
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: count('critical'),
      highFindings: count('high'),
      mediumFindings: count('medium'),
      lowFindings: count('low'),
      infoFindings: count('info'),
      overallScore: {
        status: 'measured',
        value: Math.round(
          DIMENSIONS.reduce((sum, name) => sum + scores[name], 0) / DIMENSIONS.length,
        ),
      },
    },
  };
}

/** Scores homogènes sur les 5 dimensions. */
function uniformScores(score: number): Record<AnalysisDimension, number> {
  return { performance: score, accessibility: score, seo: score, ux: score, content: score };
}

describe('TimelineAnalyzer', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let analyzer: TimelineAnalyzer;
  let projectRepo: ProjectRepository;
  let auditRepo: AuditRepository;
  let projectId: string;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-timeline-analyzer-'));
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();
    analyzer = new TimelineAnalyzer(database.connection);
    projectRepo = new ProjectRepository(database.connection);
    auditRepo = new AuditRepository(database.connection);
    projectId = projectRepo.create({ name: 'Projet exemple' }).id;
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  /** Insère `count` audits quotidiens croissants avec la série donnée. */
  function seedAudits(series: Array<Record<AnalysisDimension, number>>): void {
    const base = Date.parse('2026-10-01T12:00:00.000Z');
    series.forEach((scores, index) => {
      auditRepo.store(
        makeReport(
          scores,
          'https://example.com',
          new Date(base + index * 86_400_000).toISOString(),
        ),
        {
          projectId,
        },
      );
    });
  }

  it('analyse une timeline avec plusieurs audits et calcule les statistiques', async () => {
    seedAudits([
      { performance: 70, accessibility: 80, seo: 75, ux: 85, content: 90 },
      { performance: 75, accessibility: 82, seo: 78, ux: 87, content: 92 },
      { performance: 80, accessibility: 85, seo: 80, ux: 90, content: 95 },
      { performance: 85, accessibility: 88, seo: 82, ux: 92, content: 97 },
      { performance: 90, accessibility: 90, seo: 85, ux: 95, content: 98 },
    ]);

    const analysis = await analyzer.analyze(projectId);

    expect(analysis.projectId).toBe(projectId);
    expect(analysis.projectName).toBe('Projet exemple');
    expect(analysis.totalAudits).toBe(5);
    expect(analysis.audits).toHaveLength(5);
    expect(analysis.dimensionScores).toHaveLength(5);

    // Ordre chronologique croissant (C14.1).
    const timestamps = analysis.audits.map((a) => Date.parse(a.metadata.timestamp));
    expect([...timestamps].sort((a, b) => a - b)).toEqual(timestamps);
    expect(analysis.startDate.getTime()).toBe(timestamps[0] ?? 0);
    expect(analysis.endDate.getTime()).toBe(timestamps[timestamps.length - 1] ?? 0);

    // Statistiques de la dimension performance.
    const perf = analysis.dimensionScores.find((d) => d.dimension === 'performance');
    expect(perf).toBeDefined();
    expect(perf?.scores).toHaveLength(5);
    expect(perf?.averageScore).toBe(80);
    expect(perf?.minScore).toBe(70);
    expect(perf?.maxScore).toBe(90);
    expect(perf?.trend.direction).toBe('stable');
    expect(perf?.scores[0]?.findingsCount).toBe(0);
  });

  it("lance ProjectNotFoundError si le projet n'existe pas", async () => {
    await expect(analyzer.analyze('00000000-0000-4000-8000-000000000000')).rejects.toThrow(
      ProjectNotFoundError,
    );
  });

  it('retourne une analyse vide sans erreur si aucun audit (C14.15)', async () => {
    const analysis = await analyzer.analyze(projectId);

    expect(analysis.totalAudits).toBe(0);
    expect(analysis.audits).toHaveLength(0);
    expect(analysis.startDate.getTime()).toBe(0);
    expect(analysis.endDate.getTime()).toBe(0);
    expect(analysis.dimensionScores).toHaveLength(5);
    for (const timeline of analysis.dimensionScores) {
      expect(timeline.scores).toHaveLength(0);
      expect(timeline.averageScore).toBe(0);
      expect(timeline.minScore).toBe(0);
      expect(timeline.maxScore).toBe(0);
    }
  });

  it('respecte la limite `limit` (50 audits, C14.8)', async () => {
    seedAudits(Array.from({ length: 12 }, (_, index) => uniformScores(60 + index)));

    const partial = await analyzer.analyze(projectId, { limit: 10 });
    expect(partial.totalAudits).toBe(10);

    const full = await analyzer.analyze(projectId);
    expect(full.totalAudits).toBe(12);
  });

  it('ne retient pas les audits sans projet ni ceux des autres projets', async () => {
    auditRepo.store(makeReport(uniformScores(50)));
    const other = projectRepo.create({ name: 'Autre projet' });
    auditRepo.store(makeReport(uniformScores(55), 'https://other.test'), { projectId: other.id });
    seedAudits([uniformScores(70)]);

    const analysis = await analyzer.analyze(projectId);
    expect(analysis.totalAudits).toBe(1);
    expect(analysis.audits[0]?.metadata.overallScore).toBe(70);
  });

  it('filtre les audits par plage de dates (bornes inclusives)', async () => {
    seedAudits([uniformScores(60), uniformScores(70), uniformScores(80)]);

    const start = new Date('2026-10-02T00:00:00.000Z');
    const end = new Date('2026-10-03T23:59:59.999Z');
    const filtered = await analyzer.getAuditsByDateRange(projectId, start, end);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((a) => a.metadata.overallScore)).toEqual([70, 80]);
  });

  it('filtre par plage vide (aucun audit dans la période)', async () => {
    seedAudits([uniformScores(60)]);

    const filtered = await analyzer.getAuditsByDateRange(
      projectId,
      new Date('2027-01-01T00:00:00.000Z'),
      new Date('2027-02-01T00:00:00.000Z'),
    );
    expect(filtered).toHaveLength(0);
  });

  it('lance ProjectNotFoundError sur getAuditsByDateRange si projet absent', async () => {
    await expect(
      analyzer.getAuditsByDateRange(
        '00000000-0000-4000-8000-000000000000',
        new Date(0),
        new Date(),
      ),
    ).rejects.toThrow(ProjectNotFoundError);
  });

  it('refuse une limite invalide dans listByProject', () => {
    expect(() => auditRepo.listByProject(projectId, 0)).toThrow(ValidationError);
    expect(() => auditRepo.listByProject(projectId, -1)).toThrow(ValidationError);
  });
});
