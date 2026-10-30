import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisDimension, AnalysisReport } from '../../src/analysis/types.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ValidationError } from '../../src/shared/errors.js';
import { AlertRepository } from '../../src/storage/alert-repository.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AlertManager } from '../../src/timeline/alert-manager.js';
import { TrendDetector } from '../../src/timeline/trend-detector.js';
import { TimelineAnalyzer } from '../../src/timeline/timeline-analyzer.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Rapport homogène (scores identiques sur les dimensions). */
function makeReport(score: number, timestamp: string, url = 'https://example.com'): AnalysisReport {
  return {
    url,
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
      overallScore: { status: 'measured', value: score },
    },
  };
}

describe('AlertManager', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let alertRepo: AlertRepository;
  let alertManager: AlertManager;
  let auditRepo: AuditRepository;
  let projectId: string;
  let auditIdFrom: number;
  let auditIdTo: number;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-alert-manager-'));
    database = openDatabase({ dataDir }); // migrations 001 → 004 (alerts)
    new AuditSchema(database.connection).createSchema();

    alertRepo = new AlertRepository(database.connection);
    alertManager = new AlertManager(alertRepo);
    auditRepo = new AuditRepository(database.connection);
    projectId = new ProjectRepository(database.connection).create({ name: 'Projet alertes' }).id;

    // Deux audits réels (FK alertes → audit_metadata respectées).
    const base = Date.parse('2026-10-01T12:00:00.000Z');
    auditIdFrom =
      auditRepo.store(makeReport(85, new Date(base).toISOString()), { projectId }).metadata.id ?? 0;
    auditIdTo =
      auditRepo.store(makeReport(70, new Date(base + 86_400_000).toISOString()), { projectId })
        .metadata.id ?? 0;
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('crée une alerte avec UUID, scores et resolvedAt null', async () => {
    const alert = alertRepo.create({
      projectId,
      auditIdFrom,
      auditIdTo,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    expect(alert.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(alert.projectId).toBe(projectId);
    expect(alert.dimension).toBe('performance');
    expect(alert.regressionPoints).toBe(15);
    expect(alert.resolvedAt).toBeNull();
    expect(alertRepo.getById(alert.id)).toEqual(alert);
  });

  it('refuse une création invalide (dimension, scores, entiers)', () => {
    const base = { projectId, auditIdFrom, auditIdTo, scoreBefore: 90, scoreAfter: 75 };
    expect(() =>
      alertRepo.create({ ...base, dimension: 'bogus' as never, regressionPoints: 15 }),
    ).toThrow(ValidationError);
    expect(() =>
      alertRepo.create({ ...base, dimension: 'overall', scoreBefore: 101, regressionPoints: 15 }),
    ).toThrow(ValidationError);
    expect(() => alertRepo.create({ ...base, dimension: 'seo', regressionPoints: 0 })).toThrow(
      ValidationError,
    );
    expect(() =>
      alertRepo.create({ ...base, dimension: 'seo', regressionPoints: 15, auditIdFrom: 0 }),
    ).toThrow(ValidationError);
  });

  it('récupère les alertes actives (et ignore les résolues)', async () => {
    const first = alertRepo.create({
      projectId,
      auditIdFrom,
      auditIdTo,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });
    alertRepo.create({
      projectId,
      auditIdFrom,
      auditIdTo,
      dimension: 'seo',
      scoreBefore: 85,
      scoreAfter: 70,
      regressionPoints: 15,
    });

    expect(await alertManager.getActiveAlerts()).toHaveLength(2);

    await alertManager.resolveAlert(first.id);
    expect(await alertManager.getActiveAlerts()).toHaveLength(1);
    expect(await alertManager.getAllAlerts({ resolved: true })).toHaveLength(1);
    expect(alertRepo.getById(first.id)?.resolvedAt).not.toBeNull();
  });

  it('marque une alerte résolue (une seule fois) et signale les erreurs', async () => {
    const alert = alertRepo.create({
      projectId,
      auditIdFrom,
      auditIdTo,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    await alertManager.resolveAlert(alert.id);
    await expect(alertManager.resolveAlert(alert.id)).rejects.toThrow(ValidationError);
    await expect(alertManager.resolveAlert('00000000-0000-4000-8000-000000000000')).rejects.toThrow(
      ValidationError,
    );
  });

  it('filtre les alertes par projet, dimension et limite', async () => {
    const other = new ProjectRepository(database.connection).create({ name: 'Autre' });
    const otherAudit = auditRepo.store(makeReport(80, new Date().toISOString()), {
      projectId: other.id,
    });
    alertRepo.create({
      projectId,
      auditIdFrom,
      auditIdTo,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });
    alertRepo.create({
      projectId: other.id,
      auditIdFrom: otherAudit.metadata.id ?? 1,
      auditIdTo: otherAudit.metadata.id ?? 1,
      dimension: 'seo',
      scoreBefore: 85,
      scoreAfter: 70,
      regressionPoints: 15,
    });

    const mine = await alertManager.getActiveAlerts(projectId);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.projectId).toBe(projectId);

    expect(alertRepo.list({ dimension: 'seo' })).toHaveLength(1);
    expect(alertRepo.list({ limit: 1 })).toHaveLength(1);
    expect(() => alertRepo.list({ limit: 0 })).toThrow(ValidationError);
    expect(() => alertRepo.list({ dimension: 'nope' as never })).toThrow(ValidationError);
  });

  it('supprime une alerte (et retourne false si absente)', async () => {
    const alert = alertRepo.create({
      projectId,
      auditIdFrom,
      auditIdTo,
      dimension: 'ux',
      scoreBefore: 80,
      scoreAfter: 60,
      regressionPoints: 20,
    });
    expect(await alertManager.deleteAlert(alert.id)).toBe(true);
    expect(await alertManager.deleteAlert(alert.id)).toBe(false);
    expect(alertRepo.getById(alert.id)).toBeNull();
  });

  it('refuse un seuil invalide à la construction', () => {
    expect(() => new AlertManager(alertRepo, { regressionThreshold: 0 })).toThrow(RangeError);
    expect(() => new AlertManager(alertRepo, { regressionThreshold: 2.5 })).toThrow(RangeError);
  });

  it('crée les alertes des régressions (détection complète, C14.4) et reste idempotent', async () => {
    // Baisse de 15 points : régression + tendance declining.
    const analyzer = new TimelineAnalyzer(database.connection);
    const detector = new TrendDetector();
    const timeline = await analyzer.analyze(projectId);
    const report = detector.detectTrends(timeline);
    const regressions = detector.detectRegressions(timeline, 10);

    expect(regressions.length).toBeGreaterThan(0);

    const created = await alertManager.checkAndCreateAlerts(report, regressions);
    expect(created.length).toBe(regressions.length);
    expect((await alertManager.getActiveAlerts(projectId)).length).toBe(created.length);

    // Idempotence : un second appel ne crée rien (doublons actifs ignorés).
    const again = await alertManager.checkAndCreateAlerts(report, regressions);
    expect(again).toHaveLength(0);
  });

  it('ignore les régressions sous le seuil du manager et hors tendance declining', async () => {
    const analyzer = new TimelineAnalyzer(database.connection);
    const detector = new TrendDetector();
    const timeline = await analyzer.analyze(projectId);
    const report = detector.detectTrends(timeline);
    const regressions = detector.detectRegressions(timeline, 10);

    const strict = new AlertManager(alertRepo, { regressionThreshold: 1000 });
    expect(await strict.checkAndCreateAlerts(report, regressions)).toHaveLength(0);
    expect(alertRepo.list()).toHaveLength(0);
  });
});
