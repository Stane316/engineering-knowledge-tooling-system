import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

describe('RecommendationContext (Sprint 16-02, contexte projet)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let contextBuilder: RecommendationContext;

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

  beforeEach(() => {
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();

    new ProjectRepository(database.connection).create({ name: 'Projet Contexte' });
    database.connection
      .prepare('UPDATE projects SET id = ? WHERE name = ?')
      .run('proj-1', 'Projet Contexte');

    contextBuilder = new RecommendationContext(database.connection);
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  it('contexte vide pour 0 audit (C16.20)', () => {
    const context = contextBuilder.buildContext('proj-1');

    expect(context.totalAudits).toBe(0);
    expect(context.currentFindings).toHaveLength(0);
    expect(context.findingFrequencies.size).toBe(0);
    expect(context.resolutionRates.size).toBe(0);
    // Toutes les dimensions stables (5 dimensions de l'analyse).
    expect(context.dimensionTrends.size).toBe(5);
    expect([...context.dimensionTrends.values()].every((value) => value === 'stable')).toBe(true);
    expect(context.associatedBestPractices.size).toBe(0);
  });

  it('extrait les findings du dernier audit uniquement', () => {
    const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 80 });
    insertFinding(first, 'performance', 'Images lourdes', 2);

    const second = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 75 });
    insertFinding(second, 'performance', 'Cache non configuré', 3);
    insertFinding(second, 'seo', 'Meta manquante', 1);

    const context = contextBuilder.buildContext('proj-1');
    expect(context.totalAudits).toBe(2);
    expect(context.currentFindings).toHaveLength(2);
    expect(context.currentFindings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining(['Cache non configuré', 'Meta manquante']),
    );
    expect(context.currentFindings.some((finding) => finding.title === 'Images lourdes')).toBe(
      false,
    );
  });

  it("calcule les fréquences sur l'historique (clés normalisées accentuées)", () => {
    const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 80 });
    insertFinding(first, 'performance', 'Images non optimisées', 2);
    insertFinding(first, 'seo', 'Meta manquante', 1);

    const second = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 75 });
    insertFinding(second, 'performance', 'Images non optimisées', 2);
    insertFinding(second, 'seo', 'Meta manquante', 1);
    insertFinding(second, 'performance', 'Cache non configuré', 3);

    const context = contextBuilder.buildContext('proj-1');
    // Les accents sont conservés par la normalisation (regex maison) :
    // incohérence du spec de test (« optimisees » sans accent) signalée P3.
    expect(context.findingFrequencies.get('images non optimisées')).toBe(2);
    expect(context.findingFrequencies.get('meta manquante')).toBe(2);
    expect(context.findingFrequencies.get('cache non configuré')).toBe(1);
  });

  it('détecte les tendances régression / amélioration / stable (seuil ±5)', () => {
    insertAudit('proj-1', '2026-01-01T00:00:00.000Z', {
      performance: 80,
      seo: 90,
      ux: 70,
    });
    insertAudit('proj-1', '2026-02-01T00:00:00.000Z', {
      performance: 70, // -10 → declining
      seo: 86, // -4 → stable
      ux: 80, // +10 → improving
    });

    const context = contextBuilder.buildContext('proj-1');
    expect(context.dimensionTrends.get('performance')).toBe('declining');
    expect(context.dimensionTrends.get('seo')).toBe('stable');
    expect(context.dimensionTrends.get('ux')).toBe('improving');
  });

  it('une seule audit → toutes stables', () => {
    insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 80 });
    const context = contextBuilder.buildContext('proj-1');
    expect(context.dimensionTrends.get('performance')).toBe('stable');
    expect(context.resolutionRates.size).toBe(0); // < 2 audits
  });

  it('calcule les taux de résolution (disparition entre audits consécutifs)', () => {
    // a1 : présent → a2 : absent (résolu 1/1 = 1.0 pour ce cycle)
    const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(first, 'performance', 'Images non optimisées', 2);
    insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 85 });

    // a3 : revenu → a4 : toujours présent (0 résolution sur ce cycle).
    const third = insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 75 });
    insertFinding(third, 'performance', 'Images non optimisées', 2);
    const fourth = insertAudit('proj-1', '2026-04-01T00:00:00.000Z', { performance: 88 });
    insertFinding(fourth, 'performance', 'Images non optimisées', 2);

    const context = contextBuilder.buildContext('proj-1');
    // 1 résolution sur 2 apparitions = 0.5 (zone neutre, ni résolu ni persistant).
    expect(context.resolutionRates.get('images non optimisées')).toBeCloseTo(0.5, 5);
  });

  it('taux 0 pour un finding toujours présent (persistant)', () => {
    const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(first, 'performance', 'Toujours là', 2);
    const second = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 70 });
    insertFinding(second, 'performance', 'Toujours là', 2);

    const context = contextBuilder.buildContext('proj-1');
    expect(context.resolutionRates.get('toujours là')).toBe(0);
  });

  it('associe les bonnes pratiques via BestPracticeService (C16.12)', () => {
    const service = new BestPracticeService(database.connection);
    const practice = service.create({
      title: 'Convertir les images en WebP',
      description: 'Utiliser WebP pour réduire le poids des images',
      category: 'performance',
    });
    service.linkToFinding(practice.id, 'Images non optimisées', 'performance', 0.9);

    const builderWithBp = new RecommendationContext(database.connection, service);
    const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(auditId, 'performance', 'Images non optimisées', 2);

    const context = builderWithBp.buildContext('proj-1');
    expect(context.associatedBestPractices.get('Images non optimisées')).toEqual([
      'Convertir les images en WebP',
    ]);

    // Sans service : map vide (comportement dégradé).
    expect(contextBuilder.buildContext('proj-1').associatedBestPractices.size).toBe(0);
  });

  it('normalise les titres : casse et ponctuation absorbées', () => {
    const first = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { seo: 70 });
    insertFinding(first, 'seo', 'Meta description MANQUANTE!', 1);
    const second = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { seo: 70 });
    insertFinding(second, 'seo', 'meta description manquante', 1);

    const context = contextBuilder.buildContext('proj-1');
    expect(context.findingFrequencies.get('meta description manquante')).toBe(2);
  });
});
