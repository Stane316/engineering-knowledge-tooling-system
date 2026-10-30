import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisDimension, AnalysisReport } from '../../src/analysis/types.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { ValidationError } from '../../src/shared/errors.js';
import { AlertRepository } from '../../src/storage/alert-repository.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AlertManager } from '../../src/timeline/alert-manager.js';
import { ChartGenerator } from '../../src/timeline/chart-generator.js';
import { TimelineAnalyzer } from '../../src/timeline/timeline-analyzer.js';
import { TrendDetector } from '../../src/timeline/trend-detector.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Rapport homogène pour les fixtures. */
function makeReport(score: number, timestamp: string): AnalysisReport {
  return {
    url: 'https://example.com',
    timestamp,
    dimensions: Object.fromEntries(
      DIMENSIONS.map((name) => [
        name,
        { dimension: name, score, findings: [], summary: `${name} ${score}` },
      ]),
    ) as unknown as AnalysisReport['dimensions'],
    findings: [],
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: score,
    },
  };
}

describe('Intégration — pipeline suivi temporel (Sprint 14, C14.1→C14.15)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let projectId: string;
  let analyzer: TimelineAnalyzer;
  let detector: TrendDetector;
  let manager: AlertManager;
  let charts: ChartGenerator;

  /** Insère une série d'audits quotidiens (base : 01/10/2026). */
  function seed(series: readonly number[]): void {
    const repository = new AuditRepository(database.connection);
    const base = Date.parse('2026-10-01T12:00:00.000Z');
    series.forEach((score, index) => {
      repository.store(makeReport(score, new Date(base + index * 86_400_000).toISOString()), {
        projectId,
      });
    });
  }

  beforeEach(() => {
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();
    projectId = new ProjectRepository(database.connection).create({ name: 'Site intégration' }).id;
    analyzer = new TimelineAnalyzer(database.connection);
    detector = new TrendDetector();
    manager = new AlertManager(new AlertRepository(database.connection));
    charts = new ChartGenerator();
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  it('enchaîne analyse → tendances → alertes → graphiques sur 50 audits (C14.8, C14.9)', async () => {
    // 50 audits : 40 en hausse puis chute brutale (régression + alertes).
    // Montée régulière puis chute brutale (> 10 pts) entre les audits 39 et 40.
    const series = Array.from({ length: 50 }, (_, index) => (index < 40 ? 50 + index : 45));
    seed(series);

    const started = Date.now();
    const analysis = await analyzer.analyze(projectId);
    const analyzeMs = Date.now() - started;
    expect(analysis.totalAudits).toBe(50);
    expect(analysis.dimensionScores).toHaveLength(5);
    // C14.8 : analyse de 50 audits en moins de 2 s (marge CI).
    expect(analyzeMs).toBeLessThan(2_000);

    const detectStarted = Date.now();
    const report = detector.detectTrends(analysis);
    const regressions = detector.detectRegressions(analysis, 10);
    const detectMs = Date.now() - detectStarted;
    // C14.9 : détection en moins de 1 s.
    expect(detectMs).toBeLessThan(1_000);
    expect(report.trends.size).toBe(5);
    expect(regressions.length).toBeGreaterThan(0);

    // C14.4 : alertes créées puis idempotentes.
    const first = await manager.checkAndCreateAlerts(report, regressions);
    expect(first.length).toBeGreaterThan(0);
    const second = await manager.checkAndCreateAlerts(report, regressions);
    expect(second).toHaveLength(0);
    const active = await manager.getActiveAlerts(projectId);
    expect(active.length).toBe(first.length);

    // C14.5 : export SVG + PNG.
    const svg = String(charts.generateTimelineChart(analysis, 'svg'));
    expect(svg).toContain('<svg');
    const png = charts.generateTimelineChart(analysis, 'png') as Buffer;
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it('gère les cas limites 0, 1 et erroné sans bloquer (C14.15)', async () => {
    // 0 audit : structure vide, tendances stables, pas de régression.
    const empty = await analyzer.analyze(projectId);
    expect(empty.totalAudits).toBe(0);
    expect(empty.audits).toHaveLength(0);
    expect(empty.dimensionScores.every((series) => series.scores.length === 0)).toBe(true);
    const emptyReport = detector.detectTrends(empty);
    expect(emptyReport.overallTrend.direction).toBe('stable');
    expect(detector.detectRegressions(empty, 10)).toHaveLength(0);
    expect(await manager.checkAndCreateAlerts(emptyReport, [])).toHaveLength(0);

    // 1 audit : une seule série suffisante pour un graphique, tendance stable.
    seed([72]);
    const single = await analyzer.analyze(projectId);
    expect(single.totalAudits).toBe(1);
    expect(detector.detectTrends(single).overallTrend.direction).toBe('stable');
    expect(() => charts.generateTimelineChart(single, 'svg')).not.toThrow();

    // Erroné : fenêtre inversée et ID absent.
    await expect(
      analyzer.analyze(projectId, {
        start: new Date('2026-10-10T00:00:00.000Z'),
        end: new Date('2026-10-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(analyzer.analyze('00000000-0000-4000-8000-000000000000')).rejects.toThrowError(
      /introuvable|absent|not/iu,
    );
  });

  it('fenêtres de dates inclusives et alertes non bloquantes (C14.13, C14.4)', async () => {
    seed([60, 70, 80, 90, 100]);

    // Bornes inclusives : journée entière côté CLI/MCP converties en 23:59:59.999.
    const windowed = await analyzer.analyze(projectId, {
      start: new Date('2026-10-02T00:00:00.000Z'),
      end: new Date('2026-10-03T23:59:59.999Z'),
    });
    expect(windowed.totalAudits).toBe(2);

    // Désactivation des alertes : simple lecture, aucune écriture requise.
    const report = detector.detectTrends(windowed);
    expect(report.trends.size).toBe(5);
    expect(await manager.getActiveAlerts(projectId)).toHaveLength(0);
  });
});
