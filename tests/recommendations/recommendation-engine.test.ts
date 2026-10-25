import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

describe('RecommendationEngine (Sprint 16-01, C16.1→C16.5)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let engine: RecommendationEngine;

  beforeEach(() => {
    // Migrations 001-006 : vraie base ouverte (leçon S14), jamais :memory:
    // isolé (la migration 001 écrit dans la FTS attachée).
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();

    const project = new ProjectRepository(database.connection).create({ name: 'Projet Recos' });
    database.connection
      .prepare('UPDATE projects SET id = ? WHERE name = ?')
      .run('proj-1', 'Projet Recos');
    expect(project.name).toBe('Projet Recos');

    engine = new RecommendationEngine(
      database.connection,
      new RecommendationContext(database.connection),
    );
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  /** Insère un audit (colonnes NOT NULL du vrai schéma). */
  function insertAudit(
    projectId: string,
    timestamp: string,
    scores: Record<string, number>,
  ): number {
    const result = database.connection
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings, project_id)
         VALUES (?, ?, 50, 0, 0, 0, 0, 0, ?)`,
      )
      .run('https://example.com', timestamp, projectId);
    const auditId = Number(result.lastInsertRowid);

    for (const [dimension, score] of Object.entries(scores)) {
      database.connection
        .prepare(
          `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
           VALUES (?, ?, ?, 0)`,
        )
        .run(auditId, dimension, score);
    }
    return auditId;
  }

  /** Insère un finding (colonnes NOT NULL). */
  function insertFinding(
    auditId: number,
    dimension: string,
    title: string,
    severity: number,
  ): void {
    database.connection
      .prepare(
        `INSERT INTO audit_findings
           (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
         VALUES (?, ?, ?, ?, 2, 2, 'medium', ?)`,
      )
      .run(auditId, dimension, title, severity, `Corriger : ${title}`);
  }

  describe('gestion des règles', () => {
    it('ajoute, liste, compte, met à jour et supprime des règles', () => {
      const rule = engine.addRule({
        name: 'Images',
        description: 'Images non optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images',
        recommendationDescription: 'Convertir en WebP',
      });

      expect(engine.listRules()).toHaveLength(1);
      expect(engine.countRules({ dimension: 'performance' })).toBe(1);
      expect(engine.updateRule(rule.id, { isActive: false }).isActive).toBe(false);
      expect(engine.listRules({ isActive: true })).toHaveLength(0);
      engine.deleteRule(rule.id);
      expect(engine.countRules()).toBe(0);
    });
  });

  describe('génération depuis les règles explicites (C16.1)', () => {
    it('génère une recommandation depuis une règle (score > 0.5)', () => {
      engine.addRule({
        name: 'Images',
        description: 'Images non optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images en WebP',
        recommendationDescription: 'Convertir toutes les images en WebP',
        effort: 2,
        impact: 4,
        priority: 'high',
      });

      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 3);

      const report = engine.generateRecommendations('proj-1');

      expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
      expect(report.rulesApplied).toBeGreaterThanOrEqual(1);
      const [first] = report.recommendations;
      expect(first?.recommendationTitle).toContain('WebP');
      expect(first?.relevanceScore).toBeGreaterThan(0.5);
      expect(first?.relevanceScore).toBeLessThanOrEqual(1);
      expect(first?.ruleId).not.toBeNull();
    });

    it('respecte le seuil de sévérité de la règle', () => {
      engine.addRule({
        name: 'Critical Images',
        description: 'Images critiques',
        dimension: 'performance',
        severityThreshold: 4,
        pattern: 'images non optimisées',
        recommendationTitle: 'Urgent : optimiser',
        recommendationDescription: 'Action immédiate',
      });

      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 2); // 2 < 4

      const report = engine.generateRecommendations('proj-1');
      expect(report.recommendations.filter((rec) => rec.ruleId !== null)).toHaveLength(0);
      expect(report.rulesApplied).toBe(0);
    });

    it('ignore les règles inactives et les autres dimensions', () => {
      engine.addRule({
        name: 'Inactive',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images non optimisées',
        recommendationTitle: 'Rec inactive',
        recommendationDescription: 'D',
      });
      engine.updateRule(engine.listRules()[0]!.id, { isActive: false });

      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 3);
      expect(engine.generateRecommendations('proj-1').totalRecommendations).toBe(0);
    });
  });

  describe('scoring statistique (C16.2, C16.12)', () => {
    it('génère une reco statistique pour un finding récurrent (≥ 3)', () => {
      for (const [index, score] of [60, 62, 64].entries()) {
        const auditId = insertAudit('proj-1', `2026-0${String(index + 1)}-01T00:00:00.000Z`, {
          performance: score,
        });
        insertFinding(auditId, 'performance', 'Images non optimisées', 2);
      }

      const report = engine.generateRecommendations('proj-1');

      expect(report.statisticalRecommendations).toBeGreaterThanOrEqual(1);
      const [first] = report.recommendations;
      expect(first?.ruleId).toBeNull();
      expect(first?.findingTitle).toBe('Images non optimisées');
      // 0.5 + (3/3)×0.3 = 0.8 ; taux de résolution 0 (présent dans les 3
      // audits) → +0.15 « persistant » (ADR-037) → 0.95.
      expect(first?.relevanceScore).toBeCloseTo(0.95, 5);
      expect(first?.priority).toBe('critical');
    });

    it('pas de scoring statistique sous 3 occurrences (config)', () => {
      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 60 });
      insertFinding(auditId, 'performance', 'Finding unique', 2);
      expect(engine.generateRecommendations('proj-1').statisticalRecommendations).toBe(0);
    });
  });

  describe('personnalisation contextuelle (C16.3)', () => {
    it('augmente le score si dimension en régression (2 derniers audits)', () => {
      engine.addRule({
        name: 'SEO',
        description: 'SEO',
        dimension: 'seo',
        severityThreshold: 1,
        pattern: 'meta description manquante',
        recommendationTitle: 'Ajouter les meta descriptions',
        recommendationDescription: 'Une meta description par page',
      });

      const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { seo: 80 });
      insertFinding(first, 'seo', 'Meta description manquante', 2);
      const second = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { seo: 70 }); // -10
      insertFinding(second, 'seo', 'Meta description manquante', 2);

      const report = engine.generateRecommendations('proj-1');
      // Base 0.8 + sévérité 0.075 + régression 0.1 → 0.975 borné 1.
      expect(report.recommendations[0]?.relevanceScore).toBeGreaterThan(0.85);
      expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
    });

    it('baisse le score si dimension en amélioration', () => {
      engine.addRule({
        name: 'SEO',
        description: 'D',
        dimension: 'seo',
        severityThreshold: 1,
        pattern: 'meta description manquante',
        recommendationTitle: 'Reco amélioration',
        recommendationDescription: 'D',
      });

      const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { seo: 70 });
      insertFinding(first, 'seo', 'Meta description manquante', 2);
      const second = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { seo: 85 }); // +15
      insertFinding(second, 'seo', 'Meta description manquante', 2);

      // Base 0.8 + sévérité 0.075 - amélioration 0.1 + persistant 0.15
      // (taux 0 : présent dans les 2 audits) = 0.925.
      const report = engine.generateRecommendations('proj-1');
      expect(report.recommendations[0]?.relevanceScore).toBeCloseTo(0.925, 5);
    });

    it('ajuste selon le taux de résolution (résolu -0.2, persistant +0.15)', () => {
      // Finding résolu dans 1 des 2 paires (taux 0.5 → aucun ajustement),
      // puis un finding toujours présent sur les paires successives (taux 0 → +0.15).
      const a1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { seo: 75 });
      insertFinding(a1, 'seo', 'Bug résolu', 1);
      const a2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { seo: 75 });
      insertFinding(a2, 'seo', 'Bug persistant', 1);
      const a3 = insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { seo: 75 });
      insertFinding(a3, 'seo', 'Bug persistant', 1);

      engine.addRule({
        name: 'Persistant',
        description: 'D',
        dimension: 'seo',
        severityThreshold: 0,
        pattern: 'bug persistant',
        recommendationTitle: 'Reco persistante',
        recommendationDescription: 'D',
      });

      const report = engine.generateRecommendations('proj-1');
      // base 0.8 + sévérité 0.0375 (sév 1) + 0.15 (taux 0) = 0.9875.
      const persistent = report.recommendations.find(
        (rec) => rec.recommendationTitle === 'Reco persistante',
      );
      expect(persistent?.relevanceScore).toBeCloseTo(0.9875, 5);
    });
  });

  describe('fusion, déduplication et options (C16.4, C16.5)', () => {
    it('déduplique deux règles au même titre de recommandation', () => {
      engine.addRule({
        name: 'R1',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images',
        recommendationTitle: 'Optimiser les images',
        recommendationDescription: 'WebP',
      });
      engine.addRule({
        name: 'R2',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images', // titre identique
        recommendationDescription: 'Lazy loading',
      });

      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 3);

      const report = engine.generateRecommendations('proj-1');
      const imageRecs = report.recommendations.filter((rec) =>
        rec.recommendationTitle.includes('images'),
      );
      expect(imageRecs).toHaveLength(1);
    });

    it('les recommandations sont triées par pertinence décroissante', () => {
      engine.addRule({
        name: 'Faible',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 0,
        pattern: 'constat mineur',
        recommendationTitle: 'Reco faible',
        recommendationDescription: 'D',
      });
      engine.addRule({
        name: 'Forte',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 4,
        pattern: 'constat critique',
        recommendationTitle: 'Reco forte',
        recommendationDescription: 'D',
      });

      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Constat mineur', 0); // 0.8
      insertFinding(auditId, 'performance', 'Constat critique', 4); // 0.95

      const scores = engine
        .generateRecommendations('proj-1')
        .recommendations.map((rec) => rec.relevanceScore);
      expect(scores.length).toBeGreaterThanOrEqual(2);
      expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    });

    it('respecte maxRecommendations', () => {
      for (let index = 0; index < 5; index += 1) {
        engine.addRule({
          name: `Rule ${index}`,
          description: 'D',
          dimension: 'performance',
          severityThreshold: 1,
          pattern: `finding ${index}`,
          recommendationTitle: `Recommendation ${index}`,
          recommendationDescription: `Description ${index}`,
        });
      }
      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      for (let index = 0; index < 5; index += 1) {
        insertFinding(auditId, 'performance', `Finding ${index}`, 2);
      }

      const report = engine.generateRecommendations('proj-1', { maxRecommendations: 2 });
      expect(report.recommendations.length).toBeLessThanOrEqual(2);
    });

    it('respecte minRelevanceScore', () => {
      engine.addRule({
        name: 'Low',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 0,
        pattern: 'minor issue',
        recommendationTitle: 'Fix minor issue',
        recommendationDescription: 'Low priority fix',
      });
      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 90 });
      insertFinding(auditId, 'performance', 'Minor issue', 0);

      // Score max : 0.8 + 0 + tendance améliorée ? un seul audit → stable → 0.8.
      const report = engine.generateRecommendations('proj-1', { minRelevanceScore: 0.95 });
      expect(report.totalRecommendations).toBe(0);
    });

    it('options includeRules / includeStatistical / dimensions', () => {
      engine.addRule({
        name: 'Rule',
        description: 'D',
        dimension: 'seo',
        severityThreshold: 1,
        pattern: 'meta manquante',
        recommendationTitle: 'Reco SEO',
        recommendationDescription: 'D',
      });
      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { seo: 70 });
      insertFinding(auditId, 'seo', 'Meta manquante', 2);

      expect(
        engine.generateRecommendations('proj-1', { includeRules: false, includeStatistical: false })
          .totalRecommendations,
      ).toBe(0);
      expect(
        engine.generateRecommendations('proj-1', { dimensions: ['performance'] })
          .totalRecommendations,
      ).toBe(0);
      expect(
        engine.generateRecommendations('proj-1', { includeStatistical: false }).rulesApplied,
      ).toBe(1);
    });
  });

  describe('persistance et cas limites (C16.20)', () => {
    it('purge puis persiste : régénération idempotente', () => {
      engine.addRule({
        name: 'Rule',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images',
        recommendationTitle: 'Reco stable',
        recommendationDescription: 'D',
      });
      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images', 2);

      const first = engine.generateRecommendations('proj-1');
      const second = engine.generateRecommendations('proj-1');

      expect(first.totalRecommendations).toBe(second.totalRecommendations);
      expect(engine.repositoryAccess.countRecommendations('proj-1')).toBe(
        second.totalRecommendations,
      );
      // Persistance lue via le repository.
      expect(engine.repositoryAccess.getRecommendations('proj-1')).toHaveLength(
        second.totalRecommendations,
      );
    });

    it('projet sans audit : rapport vide non bloquant', () => {
      const report = engine.generateRecommendations('proj-1');
      expect(report).toMatchObject({
        projectId: 'proj-1',
        totalRecommendations: 0,
        rulesApplied: 0,
        statisticalRecommendations: 0,
      });
      expect(report.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('1 audit : règles applicables, tendances stables, pas de statistique', () => {
      engine.addRule({
        name: 'Rule',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images',
        recommendationTitle: 'Reco 1 audit',
        recommendationDescription: 'D',
      });
      const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images', 2);

      const report = engine.generateRecommendations('proj-1');
      expect(report.rulesApplied).toBe(1);
      expect(report.statisticalRecommendations).toBe(0);
    });
  });
});
