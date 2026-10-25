import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisReport, Finding, Priority } from '../../src/analysis/types.js';
import { ValidationError } from '../../src/shared/errors.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AuditStatisticsManager } from '../../src/storage/statistics.js';

/** Constat de test avec des valeurs valides par défaut. */
function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-test',
    dimension: 'performance',
    title: 'LCP trop élevé',
    description: 'Le LCP est de 4,5 s',
    severity: 3,
    effort: 2,
    impact: 4,
    priority: 'high',
    recommendation: 'Optimiser les images',
    references: [],
    ...overrides,
  };
}

/** Rapport conforme au contrat Sprint 9 (résumés de dimension en texte). */
function makeReport(
  url = 'https://example.com',
  score = 70,
  findings: Finding[] = [],
  timestamp = new Date().toISOString(),
): AnalysisReport {
  const count = (priority: Priority): number =>
    findings.filter((f) => f.priority === priority).length;

  const dimensionOf = (name: AnalysisReport['dimensions']['performance']['dimension']) => ({
    dimension: name,
    score,
    findings: findings.filter((f) => f.dimension === name),
    summary: `Score ${name} : ${String(score)}/100.`,
  });

  return {
    url,
    timestamp,
    dimensions: {
      performance: dimensionOf('performance'),
      accessibility: dimensionOf('accessibility'),
      seo: dimensionOf('seo'),
      ux: dimensionOf('ux'),
      content: dimensionOf('content'),
    },
    findings,
    priorityFindings: [...findings],
    summary: {
      totalFindings: findings.length,
      criticalFindings: count('critical'),
      highFindings: count('high'),
      mediumFindings: count('medium'),
      lowFindings: count('low'),
      overallScore: score,
    },
  };
}

describe('AuditStatisticsManager', () => {
  let db: Database.Database;
  let repo: AuditRepository;
  let stats: AuditStatisticsManager;

  beforeEach(() => {
    db = new Database(':memory:');
    // Table `projects` (migration 001) : requise par la FK `ON DELETE SET NULL` (Sprint 13).
    db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    new AuditSchema(db).createSchema();
    repo = new AuditRepository(db);
    stats = new AuditStatisticsManager(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('getStatistics', () => {
    it('agrège scores et constats sur tous les audits', () => {
      const finding = makeFinding();
      repo.store(makeReport('https://a.com', 70, [finding]));
      repo.store(makeReport('https://b.com', 80, [finding]));
      repo.store(makeReport('https://c.com', 90, [finding]));

      const statistics = stats.getStatistics();

      expect(statistics.totalAudits).toBe(3);
      expect(statistics.averageScore).toBe(80);
      expect(statistics.minScore).toBe(70);
      expect(statistics.maxScore).toBe(90);
      expect(statistics.totalFindings).toBe(3);
      expect(statistics.highFindings).toBe(3);
      expect(statistics.criticalFindings).toBe(0);
    });

    it('retourne des zéros sans audit', () => {
      const statistics = stats.getStatistics();

      expect(statistics.totalAudits).toBe(0);
      expect(statistics.averageScore).toBe(0);
      expect(statistics.totalFindings).toBe(0);
    });
  });

  describe('getTrend', () => {
    it('retourne la tendance hebdomadaire', () => {
      repo.store(makeReport('https://a.com', 70));
      repo.store(makeReport('https://b.com', 80));

      const trend = stats.getTrend('week', 10);

      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('averageScore');
      expect(trend[0]).toHaveProperty('auditCount');
      expect(trend[0]?.auditCount).toBeGreaterThanOrEqual(2);
    });

    it('retourne la tendance quotidienne', () => {
      repo.store(makeReport('https://a.com', 70));

      const trend = stats.getTrend('day', 10);

      expect(trend.length).toBe(1);
      expect(trend[0]?.auditCount).toBe(1);
    });

    it('retourne la tendance mensuelle', () => {
      repo.store(makeReport('https://a.com', 70));

      const trend = stats.getTrend('month', 10);

      expect(trend.length).toBe(1);
      expect(trend[0]?.date).toMatch(/^\d{4}-\d{2}$/);
    });

    it('retourne un tableau vide sans audit', () => {
      expect(stats.getTrend('week')).toHaveLength(0);
    });
  });

  describe('getDimensionStatistics', () => {
    it('retourne les statistiques des 5 dimensions', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding({ dimension: 'performance' })]));

      const dimensions = stats.getDimensionStatistics();

      expect(dimensions).toHaveLength(5);
      const perf = dimensions.find((d) => d.dimension === 'performance');
      expect(perf?.averageScore).toBe(70);
      expect(perf?.totalFindings).toBe(1);

      const seo = dimensions.find((d) => d.dimension === 'seo');
      expect(seo?.totalFindings).toBe(0);
    });

    it('retourne un tableau vide sans audit', () => {
      expect(stats.getDimensionStatistics()).toHaveLength(0);
    });
  });

  describe('getTopIssues', () => {
    it('classe les constats récurrents avec leur pourcentage', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding({ id: 'f1' })]));
      repo.store(makeReport('https://b.com', 70, [makeFinding({ id: 'f2' })]));
      repo.store(makeReport('https://c.com', 70, [makeFinding({ id: 'f3', title: 'Unique' })]));

      const top = stats.getTopIssues(10);

      expect(top[0]?.title).toBe('LCP trop élevé');
      expect(top[0]?.count).toBe(2);
      expect(top[0]?.percentage).toBe(67);
      expect(top).toHaveLength(2);
    });

    it('calcule 100 % quand tous les audits sont touchés', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding({ id: 'f1' })]));
      repo.store(makeReport('https://b.com', 70, [makeFinding({ id: 'f2' })]));

      expect(stats.getTopIssues(10)[0]?.percentage).toBe(100);
    });

    it('respecte la limite demandée', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding()]));

      expect(stats.getTopIssues(1)).toHaveLength(1);
    });

    it('rejette une limite nulle', () => {
      expect(() => stats.getTopIssues(0)).toThrow(ValidationError);
    });
  });

  describe('getStatisticsForUrl', () => {
    it("agrège les audits d'une URL précise", () => {
      repo.store(makeReport('https://a.com', 70));
      repo.store(makeReport('https://a.com', 80));
      repo.store(makeReport('https://b.com', 90));

      const statistics = stats.getStatisticsForUrl('https://a.com');

      expect(statistics.totalAudits).toBe(2);
      expect(statistics.averageScore).toBe(75);
      expect(statistics.minScore).toBe(70);
      expect(statistics.maxScore).toBe(80);
    });

    it('retourne des zéros pour une URL inconnue', () => {
      const statistics = stats.getStatisticsForUrl('https://unknown.com');

      expect(statistics.totalAudits).toBe(0);
      expect(statistics.averageScore).toBe(0);
    });
  });

  describe('getScoreDistribution', () => {
    it('répartit les audits sur les 5 tranches', () => {
      repo.store(makeReport('https://a.com', 15));
      repo.store(makeReport('https://b.com', 35));
      repo.store(makeReport('https://c.com', 55));
      repo.store(makeReport('https://d.com', 75));
      repo.store(makeReport('https://e.com', 95));

      const distribution = stats.getScoreDistribution();

      expect(distribution['0-20']).toBe(1);
      expect(distribution['21-40']).toBe(1);
      expect(distribution['41-60']).toBe(1);
      expect(distribution['61-80']).toBe(1);
      expect(distribution['81-100']).toBe(1);
    });

    it('retourne des tranches vides sans audit', () => {
      const distribution = stats.getScoreDistribution();

      expect(distribution['0-20']).toBe(0);
      expect(distribution['81-100']).toBe(0);
    });
  });
});
