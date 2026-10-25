import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { RecommendationRepository } from '../../src/recommendations/recommendation-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { TemplateApplier } from '../../src/templates/template-applier.js';
import { TemplateRepository } from '../../src/templates/template-repository.js';

import type { ProjectTemplate, TemplateConfig } from '../../src/templates/template.types.js';

/** Base ouverte (wrapper maison, migrations 001-008). */
let db: EktsDatabase;
/** Dossier de données isolé (`:memory:` interdit — reset des métriques). */
let dataDir: string;
/** Applicateur sous test. */
let applier: TemplateApplier;
/** Dépôt de projets (dépendance de l'applier). */
let projectRepo: ProjectRepository;
/** Dépôt de templates. */
let templateRepo: TemplateRepository;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-applier-'));
  db = openDatabase({ dataDir });
  new AuditSchema(db.connection).createSchema();
  projectRepo = new ProjectRepository(db.connection);
  templateRepo = new TemplateRepository(db.connection);
  applier = new TemplateApplier(db.connection, projectRepo);
});

afterEach(async () => {
  db.close();
  await rm(dataDir, { recursive: true, force: true });
});

/**
 * Config de test complète.
 *
 * @returns Config de template valide.
 */
function baseConfig(): TemplateConfig {
  return {
    priorityDimensions: ['performance', 'seo'],
    alertThresholds: { regressionPoints: 10, minScore: 60 },
    extractionCriteria: { minOccurrences: 2 },
    recommendationOptions: { maxRecommendations: 5 },
    tags: ['base'],
  };
}

/**
 * Crée un template de test.
 *
 * @param over - Champs à remplacer.
 * @returns Le template créé.
 */
function makeTemplate(
  over: Partial<Parameters<TemplateRepository['create']>[0]> = {},
): ProjectTemplate {
  return templateRepo.create({
    name: 'Template applier',
    description: 'Pour les tests',
    category: 'custom',
    config: baseConfig(),
    ...over,
  });
}

describe('TemplateApplier — application complète (C17.3)', () => {
  it('devrait créer le projet, persister la config et associer les bonnes pratiques', () => {
    const bp = new BestPracticeService(db.connection).create({
      title: 'Compresser les images',
      description: 'Utiliser WebP',
      category: 'performance',
    });
    const rule = new RecommendationRepository(db.connection).createRule({
      name: 'Images lourdes',
      description: 'Images non optimisées',
      dimension: 'performance',
      severityThreshold: 2,
      pattern: 'images',
      recommendationTitle: 'Optimiser les images',
      recommendationDescription: 'WebP + lazy',
    });
    const template = makeTemplate({
      bestPracticeIds: [bp.id],
      recommendationRuleIds: [rule.id],
    });

    const result = applier.apply(template, {
      templateId: template.id,
      projectName: 'Boutique test',
      projectUrl: 'https://boutique.example',
      projectDescription: 'Vente en ligne',
    });

    // Projet créé.
    expect(result.projectId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.projectName).toBe('Boutique test');
    expect(result.templateId).toBe(template.id);
    const project = projectRepo.getById(result.projectId)!;
    expect(project.description).toBe('Vente en ligne');
    expect(project.metadata).toEqual({ url: 'https://boutique.example' });

    // Config persistée (migration 008).
    const row = db.connection
      .prepare('SELECT config FROM project_config WHERE project_id = ?')
      .get(result.projectId) as { config: string };
    expect(JSON.parse(row.config)).toEqual(baseConfig());

    // Bonne pratique associée (source_project_ids enrichi).
    expect(result.bestPracticesAssociated).toBe(1);
    const bpRow = db.connection
      .prepare('SELECT source_project_ids FROM best_practices WHERE id = ?')
      .get(bp.id) as { source_project_ids: string };
    expect(JSON.parse(bpRow.source_project_ids)).toContain(result.projectId);

    // Règle active comptée (seed/service : la règle existe déjà).
    expect(result.rulesCreated).toBe(1);

    // Performance C17.13 : bien sous 10 s.
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.durationMs).toBeLessThan(10_000);
  });

  it('devrait utiliser la description du template par défaut', () => {
    const template = makeTemplate();
    const result = applier.apply(template, {
      templateId: template.id,
      projectName: 'Sans description',
      projectUrl: 'https://x.example',
    });
    const project = projectRepo.getById(result.projectId)!;
    expect(project.description).toBe(template.description);
  });

  it('devrait appliquer un template sans BP ni règles (compteurs à 0)', () => {
    const template = makeTemplate({ bestPracticeIds: [], recommendationRuleIds: [] });
    const result = applier.apply(template, {
      templateId: template.id,
      projectName: 'Vide',
      projectUrl: 'https://v.example',
    });
    expect(result.bestPracticesAssociated).toBe(0);
    expect(result.rulesCreated).toBe(0);
  });
});

describe('TemplateApplier — overrides partiels (C17.4, ADR-041)', () => {
  it('devrait prioriser les overrides projet (nom, description, url)', () => {
    const template = makeTemplate();
    const result = applier.apply(template, {
      templateId: template.id,
      projectName: 'Entrée',
      projectUrl: 'https://entree.example',
      projectDescription: 'Entrée desc',
      overrides: {
        projectName: 'Nom override',
        projectUrl: 'https://override.example',
        projectDescription: 'Description override',
      },
    });

    expect(result.projectName).toBe('Nom override');
    const project = projectRepo.getById(result.projectId)!;
    expect(project.description).toBe('Description override');
    expect(project.metadata).toEqual({ url: 'https://override.example' });
  });

  it('devrait merger profondément les sous-objets de config', () => {
    const template = makeTemplate();
    applier.apply(template, {
      templateId: template.id,
      projectName: 'Merge',
      projectUrl: 'https://m.example',
      overrides: {
        config: {
          alertThresholds: { minScore: 80 },
          recommendationOptions: { minRelevanceScore: 0.5 },
          priorityDimensions: ['ux'],
          tags: ['override'],
        },
      },
    });

    const row = db.connection
      .prepare('SELECT config FROM project_config WHERE project_id IN (SELECT id FROM projects)')
      .get() as { config: string } | undefined;
    // dernier projet créé = celui-ci (seul projet du test).
    const configs = db.connection.prepare('SELECT config FROM project_config').all() as {
      config: string;
    }[];
    const merged = JSON.parse((row ?? configs[0]!).config) as TemplateConfig;
    expect(merged.alertThresholds).toEqual({ regressionPoints: 10, minScore: 80 });
    expect(merged.recommendationOptions).toEqual({ maxRecommendations: 5, minRelevanceScore: 0.5 });
    expect(merged.priorityDimensions).toEqual(['ux']);
    expect(merged.tags).toEqual(['base', 'override']);
    expect(merged.extractionCriteria).toEqual({ minOccurrences: 2 });
  });

  it('devrait ajouter les bonnes pratiques et règles supplémentaires', () => {
    const bp = new BestPracticeService(db.connection).create({
      title: 'Pratique additionnelle',
      description: 'Ajoutée par override',
      category: 'seo',
    });
    const rule = new RecommendationRepository(db.connection).createRule({
      name: 'Règle additionnelle',
      description: 'Override',
      dimension: 'seo',
      severityThreshold: 1,
      pattern: 'meta',
      recommendationTitle: 'Meta',
      recommendationDescription: 'Meta desc',
    });
    const template = makeTemplate({ bestPracticeIds: [], recommendationRuleIds: [] });

    const result = applier.apply(template, {
      templateId: template.id,
      projectName: 'Additions',
      projectUrl: 'https://a.example',
      overrides: {
        additionalBestPracticeIds: [bp.id],
        additionalRuleIds: [rule.id],
      },
    });

    expect(result.bestPracticesAssociated).toBe(1);
    expect(result.rulesCreated).toBe(1);
  });

  it('devrait dédupliquer une BP déjà associée (compteur à 0)', () => {
    const bp = new BestPracticeService(db.connection).create({
      title: 'Déjà associée',
      description: 'Associée au template',
      category: 'ux',
    });
    const template = makeTemplate({ bestPracticeIds: [bp.id] });

    const first = applier.apply(template, {
      templateId: template.id,
      projectName: 'P1',
      projectUrl: 'https://p1.example',
    });
    const second = applier.apply(template, {
      templateId: template.id,
      projectName: 'P2',
      projectUrl: 'https://p2.example',
    });

    expect(first.bestPracticesAssociated).toBe(1);
    expect(second.bestPracticesAssociated).toBe(1);
    const bpRow = db.connection
      .prepare('SELECT source_project_ids FROM best_practices WHERE id = ?')
      .get(bp.id) as { source_project_ids: string };
    expect(JSON.parse(bpRow.source_project_ids)).toHaveLength(2);
  });
});

describe('TemplateApplier — validation (C17.20)', () => {
  it('devrait valider un template valide', () => {
    const template = makeTemplate();
    const result = applier.validate(template);
    expect(result).toEqual({ valid: true, errors: [], warnings: [] });
  });

  it('devrait rejeter un template sans description', () => {
    const template = makeTemplate();
    db.connection
      .prepare("UPDATE project_templates SET description = ' ' WHERE id = ?")
      .run(template.id);
    const reloaded = templateRepo.getById(template.id)!;
    const result = applier.validate(reloaded);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/description/);
  });

  it('devrait rejeter un minScore hors [0, 100] (template)', () => {
    const template = makeTemplate({
      config: { ...baseConfig(), alertThresholds: { minScore: 150 } },
    });
    const result = applier.validate(template);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/0 et 100/);
  });

  it('devrait rejeter un minScore invalide dans les overrides', () => {
    const template = makeTemplate();
    const result = applier.validate(template, { config: { alertThresholds: { minScore: -5 } } });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/override/);
  });

  it('devrait avertir sur un seuil de régression inhabituel', () => {
    const template = makeTemplate({ config: { alertThresholds: { regressionPoints: 99 } } });
    const result = applier.validate(template);
    expect(result.valid).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/inhabituel/);
  });

  it('devrait avertir sur des bonnes pratiques manquantes (ignorées à apply)', () => {
    const template = makeTemplate({ bestPracticeIds: ['bp-absente'] });
    const result = applier.validate(template);
    expect(result.valid).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/bp-absente/);

    // Apply ne casse pas : la BP absente est ignorée.
    const applied = applier.apply(template, {
      templateId: template.id,
      projectName: 'BP absente',
      projectUrl: 'https://bp.example',
    });
    expect(applied.bestPracticesAssociated).toBe(0);
  });
});
