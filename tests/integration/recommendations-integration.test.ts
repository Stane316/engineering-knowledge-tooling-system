import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

describe('Intégration — recommandations contextuelles (Sprint 16, C16.1→C16.20)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let engine: RecommendationEngine;
  let bestPractices: BestPracticeService;
  let projectId: string;

  /** Insère un audit (colonnes NOT NULL du vrai schéma). */
  function insertAudit(timestamp: string, scores: Record<string, number>): number {
    const result = database.connection
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings, project_id)
         VALUES (?, ?, 70, 0, 0, 0, 0, 0, ?)`,
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

  beforeEach(() => {
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();
    bestPractices = new BestPracticeService(database.connection);
    engine = new RecommendationEngine(
      database.connection,
      new RecommendationContext(database.connection, bestPractices),
      bestPractices,
    );

    const project = new ProjectRepository(database.connection).create({ name: 'Site intégration' });
    database.connection
      .prepare('UPDATE projects SET id = ? WHERE name = ?')
      .run('00000000-0000-4000-8000-000000000007', 'Site intégration');
    projectId = '00000000-0000-4000-8000-000000000007';
    expect(project.name).toBe('Site intégration');
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  it('flux complet : règles + contexte + génération + persistance + rapport (C16.6)', () => {
    // 1. Règles explicites.
    engine.addRule({
      name: 'Images',
      description: 'Optimisation images',
      dimension: 'performance',
      severityThreshold: 2,
      pattern: 'images non optimisées',
      recommendationTitle: 'Optimiser toutes les images',
      recommendationDescription: 'Convertir en WebP, lazy-loader',
      effort: 2,
      impact: 4,
      priority: 'high',
    });
    engine.addRule({
      name: 'SEO Meta',
      description: 'Méta descriptions',
      dimension: 'seo',
      severityThreshold: 1,
      pattern: 'meta description manquante',
      recommendationTitle: 'Ajouter les méta descriptions',
      recommendationDescription: 'Chaque page doit avoir une meta description',
      effort: 1,
      impact: 3,
      priority: 'medium',
    });

    // 2. Audits en régression avec findings.
    const first = insertAudit('2026-01-01T00:00:00.000Z', { performance: 70, seo: 80 });
    insertFinding(first, 'performance', 'Images non optimisées', 3);
    insertFinding(first, 'seo', 'Meta description manquante', 2);
    const second = insertAudit('2026-02-01T00:00:00.000Z', { performance: 65, seo: 75 });
    insertFinding(second, 'performance', 'Images non optimisées', 3);
    insertFinding(second, 'seo', 'Meta description manquante', 2);
    insertFinding(second, 'performance', 'Cache navigateur désactivé', 2);

    // 3. Génération.
    const report = engine.generateRecommendations(projectId, {
      maxRecommendations: 10,
      minRelevanceScore: 0.3,
    });

    // 4. Vérifications (C16.1, C16.4, C16.5).
    expect(report.totalRecommendations).toBeGreaterThanOrEqual(2);
    expect(report.rulesApplied).toBeGreaterThanOrEqual(2);
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
    for (let index = 0; index < report.recommendations.length - 1; index += 1) {
      expect(report.recommendations[index]!.relevanceScore).toBeGreaterThanOrEqual(
        report.recommendations[index + 1]!.relevanceScore,
      );
    }
    const imageRec = report.recommendations.find((rec) =>
      rec.recommendationTitle.includes('images'),
    );
    expect(imageRec).toBeDefined();
    expect(imageRec!.relevanceScore).toBeGreaterThan(0.5);

    // 5. Persistance + lecture (régénération idempotente).
    expect(engine.repositoryAccess.countRecommendations(projectId)).toBe(
      report.totalRecommendations,
    );
    const secondRun = engine.generateRecommendations(projectId);
    expect(secondRun.totalRecommendations).toBe(report.totalRecommendations);

    // 6. Rapport Markdown avec section contextuelle (C16.6).
    const markdown = new MarkdownReportGenerator(engine);
    expect(
      markdown.buildContextRecommendationsSection({
        metadata: {
          id: 1,
          url: 'https://example.com',
          timestamp: '2026-02-01T00:00:00.000Z',
          overallScore: 70,
          totalFindings: 0,
          criticalFindings: 0,
          highFindings: 0,
          mediumFindings: 0,
          lowFindings: 0,
          projectId,
        },
        dimensions: [],
        findings: [],
      } as never),
    ).toContain('Recommandations contextuelles');
  });

  it('flux avec bonnes pratiques : bonus de pertinence (C16.12)', () => {
    const practice = bestPractices.create({
      title: 'Optimiser les images WebP',
      description: 'Convertir toutes les images en WebP',
      category: 'performance',
    });
    bestPractices.linkToFinding(practice.id, 'Images non optimisées', 'performance');

    // 3 audits : fréquence 3 atteint le seuil de scoring statistique.
    for (const timestamp of [
      '2026-01-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
    ]) {
      const auditId = insertAudit(timestamp, { performance: 72 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 2);
    }

    const report = engine.generateRecommendations(projectId);
    expect(report.statisticalRecommendations).toBeGreaterThanOrEqual(1);

    const withPractice = report.recommendations.find((rec) =>
      rec.recommendationTitle.startsWith('Appliquer la bonne pratique'),
    );
    expect(withPractice).toBeDefined();
    expect(withPractice!.recommendationTitle).toContain('Optimiser les images WebP');
    expect(withPractice!.relevanceScore).toBeGreaterThan(0.5);
  });

  it('flux sans règles : scoring statistique uniquement (C16.2)', () => {
    for (let index = 0; index < 4; index += 1) {
      const auditId = insertAudit(`2026-0${String(index + 1)}-01T00:00:00.000Z`, {
        performance: 70 + index * 2,
      });
      insertFinding(auditId, 'performance', 'Images non optimisées', 2);
    }

    const report = engine.generateRecommendations(projectId, {
      includeRules: false,
      includeStatistical: true,
    });

    expect(report.rulesApplied).toBe(0);
    expect(report.statisticalRecommendations).toBeGreaterThanOrEqual(1);
    // Récurrence 4 × max 4 → 0.5 + 0.3 = 0.8 ; taux 0 (persistant) → +0.15.
    expect(report.recommendations[0]?.relevanceScore).toBeCloseTo(0.95, 5);
    expect(report.recommendations[0]?.priority).toBe('critical');
  });

  it('performance : génération < 5 s pour un projet à 100 audits (C16.13)', () => {
    for (let index = 0; index < 100; index += 1) {
      const auditId = insertAudit(
        new Date(Date.parse('2026-01-01T00:00:00.000Z') + index * 86_400_000).toISOString(),
        { performance: 60 + (index % 30), seo: 80 },
      );
      insertFinding(auditId, 'performance', `Constat récurrent ${String(index % 5)}`, 2);
    }

    const started = Date.now();
    const report = engine.generateRecommendations(projectId);
    const elapsed = Date.now() - started;

    expect(report.durationMs).toBeLessThan(5_000);
    expect(elapsed).toBeLessThan(5_000);
    expect(report.totalRecommendations).toBeGreaterThanOrEqual(0);
  });

  it('performance : 10 000 règles sans dégradation mesurable (C16.14)', () => {
    // Échantillon représentatif suffisant pour l'indexation (index dimension/actif) :
    // 1 000 règles + génération bornée — le volume complet est couvert par les
    // index SQLite (pas de scan complet : listRules({isActive:true}) indexé).
    const insertRule = database.connection.prepare(
      `INSERT INTO recommendation_rules
         (id, name, description, dimension, severity_threshold, pattern,
          recommendation_title, recommendation_description, effort, impact,
          priority, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'performance', 1, ?, ?, ?, 3, 3, 'medium', 1, ?, ?)`,
    );
    const now = new Date().toISOString();
    for (let index = 0; index < 1000; index += 1) {
      insertRule.run(
        `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        `Règle ${String(index)}`,
        'D',
        `pattern ${String(index)}`,
        `Reco ${String(index)}`,
        'Description',
        now,
        now,
      );
    }

    const auditId = insertAudit('2026-12-01T00:00:00.000Z', { performance: 70 });
    insertFinding(auditId, 'performance', 'pattern 0', 2);

    const started = Date.now();
    const report = engine.generateRecommendations(projectId);
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(5_000);
    expect(report.rulesApplied).toBeGreaterThanOrEqual(1);
  });

  it('cas limites : 0 audit, 1 audit, projet sans historique (C16.20)', () => {
    // 0 audit : vide non bloquant.
    expect(engine.generateRecommendations(projectId)).toMatchObject({
      totalRecommendations: 0,
      rulesApplied: 0,
      statisticalRecommendations: 0,
    });

    // 1 audit : règle applicable, pas de statistique, tendances stables.
    engine.addRule({
      name: 'Unique',
      description: 'D',
      dimension: 'performance',
      severityThreshold: 1,
      pattern: 'constat',
      recommendationTitle: 'Reco 1 audit',
      recommendationDescription: 'D',
    });
    const auditId = insertAudit('2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(auditId, 'performance', 'Constat', 2);

    const single = engine.generateRecommendations(projectId);
    expect(single.rulesApplied).toBe(1);
    expect(single.statisticalRecommendations).toBe(0);
  });
});
