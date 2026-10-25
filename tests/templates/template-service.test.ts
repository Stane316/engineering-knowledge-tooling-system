import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase } from '../../src/data/database.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { exitCodeFor } from '../../src/cli/program.js';
import { TemplateService } from '../../src/templates/template-service.js';

/** Service orchestrateur. */
let service: TemplateService;
/** Dossier de données isolé (`:memory:` interdit — reset des métriques). */
let dataDir: string;
/** Connexion ouverte. */
let db: ReturnType<typeof openDatabase>;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-templates-service-'));
  db = openDatabase({ dataDir });
  new AuditSchema(db.connection).createSchema();
  service = new TemplateService(db.connection);
});

afterEach(async () => {
  db.close();
  await rm(dataDir, { recursive: true, force: true });
});

describe('TemplateService — orchestration CRUD (17-01)', () => {
  it("devrait créer et récupérer un template (façade sur l'ID)", () => {
    const t = service.createTemplate({
      name: 'Service template',
      description: 'Via le service',
      category: 'blog',
      config: { priorityDimensions: ['content'] },
    });

    const loaded = service.getTemplate(t.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('Service template');
    expect(loaded!.category).toBe('blog');
    expect(loaded!.config.priorityDimensions).toEqual(['content']);
  });

  it('devrait retourner null pour un template absent (C17.20)', () => {
    expect(service.getTemplate('absent')).toBeNull();
  });

  it('devrait lister, filtrer et compter', () => {
    service.createTemplate({ name: 'A', description: '', category: 'custom' });
    service.createTemplate({ name: 'B', description: '', category: 'saas' });

    // Hors builtin : le constructeur a semé les 10 prédéfinis (C17.2).
    expect(service.listTemplates({ isBuiltin: false })).toHaveLength(2);
    expect(
      service.listTemplates({ category: 'saas', isBuiltin: false }).map((t) => t.name),
    ).toEqual(['B']);
    expect(service.countTemplates({ isBuiltin: false })).toBe(2);
    expect(service.countTemplates({ category: 'saas', isBuiltin: false })).toBe(1);
    expect(service.listTemplates({ isBuiltin: true })).toHaveLength(10);
  });

  it('devrait mettre à jour un template (patch partiel)', () => {
    const t = service.createTemplate({ name: 'Avant', description: 'd', category: 'custom' });
    const updated = service.updateTemplate(t.id, { name: 'Après' });

    expect(updated.name).toBe('Après');
    expect(updated.description).toBe('d');
    expect(updated.category).toBe('custom');
  });

  it('devrait propager les erreurs maison (code 4) pour ressource absente', () => {
    try {
      service.updateTemplate('absent', { name: 'x' });
      expect.unreachable('update aurait dû échouer');
    } catch (error) {
      expect((error as Error).message).toMatch(/introuvable/);
      expect(exitCodeFor(error)).toBe(4);
    }
    try {
      service.deleteTemplate('absent');
      expect.unreachable('delete aurait dû échouer');
    } catch (error) {
      expect(exitCodeFor(error)).toBe(4);
    }
  });

  it('devrait supprimer un template (CRUD complet)', () => {
    const t = service.createTemplate({ name: 'À supprimer', description: '', category: 'custom' });
    service.deleteTemplate(t.id);
    expect(service.getTemplate(t.id)).toBeNull();
    expect(service.countTemplates({ isBuiltin: false })).toBe(0);
  });

  it('devrait protéger les builtins du seed via le service (ADR-040)', () => {
    const builtin = service.listTemplates({ isBuiltin: true })[0]!;
    expect(builtin.isBuiltin).toBe(true);

    expect(() => service.updateTemplate(builtin.id, { name: 'x' })).toThrow(/immuable/);
    expect(() => service.deleteTemplate(builtin.id)).toThrow(/immuable/);
    expect(service.getTemplate(builtin.id)).not.toBeNull();
  });
});

describe('TemplateService — export/import (C17.5)', () => {
  it('devrait exporter puis réimporter (round-trip)', () => {
    const t = service.createTemplate({
      name: 'À exporter',
      description: 'aller-retour',
      category: 'agency',
      bestPracticeIds: ['bp-9'],
      recommendationRuleIds: ['rule-9'],
    });

    const json = service.exportTemplate(t.id);
    const imported = service.importTemplate(json);

    expect(imported.id).not.toBe(t.id);
    expect(imported.name).toBe('À exporter');
    expect(imported.category).toBe('agency');
    expect(imported.bestPracticeIds).toEqual(['bp-9']);
    expect(imported.recommendationRuleIds).toEqual(['rule-9']);
    expect(service.countTemplates({ isBuiltin: false })).toBe(2);
  });

  it('devrait refuser un export/ import invalides (C17.20)', () => {
    expect(() => service.exportTemplate('absent')).toThrow(/introuvable/);
    expect(() => service.importTemplate('pas-json')).toThrow(/JSON invalide/);
  });
});

describe('TemplateService — seed des builtins (17-02, C17.2)', () => {
  it('devrait disposer des 10 prédéfinis immuables au démarrage', () => {
    const builtins = service.listTemplates({ isBuiltin: true });
    expect(builtins).toHaveLength(10);
    expect(builtins.every((t) => t.isBuiltin)).toBe(true);
    expect(builtins.every((t) => t.recommendationRuleIds.length >= 3)).toBe(true);
    // Règles réellement créées dans recommendation_rules (seed conjoint).
    const rules = db.connection
      .prepare('SELECT COUNT(*) AS count FROM recommendation_rules')
      .get() as { count: number };
    expect(rules.count).toBe(builtins.reduce((acc, t) => acc + t.recommendationRuleIds.length, 0));
  });

  it('devrait être idempotent (deuxième service = mêmes 10, pas de doublon)', () => {
    const before = service.countTemplates({ isBuiltin: true });
    const rulesBefore = (
      db.connection.prepare('SELECT COUNT(*) AS count FROM recommendation_rules').get() as {
        count: number;
      }
    ).count;

    const second = new TemplateService(db.connection);
    expect(second.countTemplates({ isBuiltin: true })).toBe(before);
    const rulesAfter = (
      db.connection.prepare('SELECT COUNT(*) AS count FROM recommendation_rules').get() as {
        count: number;
      }
    ).count;
    expect(rulesAfter).toBe(rulesBefore);
  });

  it("l'application rapide d'un builtin devrait rester sous 10 s (C17.13)", () => {
    const start = Date.now();
    const builtin = service.listTemplates({ isBuiltin: true })[0]!;
    service.applyTemplate({
      templateId: builtin.id,
      projectName: 'Perf builtins',
      projectUrl: 'https://perf.example',
    });
    expect(Date.now() - start).toBeLessThan(10_000);
  });
});

describe('TemplateService — applyTemplate (17-02, C17.3/C17.4)', () => {
  it('devrait créer un projet depuis un template builtin avec ses règles actives', () => {
    const builtin = service.listTemplates({ isBuiltin: true })[0]!;
    const result = service.applyTemplate({
      templateId: builtin.id,
      projectName: 'Site e-commerce client',
      projectUrl: 'https://client.example',
      overrides: { config: { alertThresholds: { minScore: 90 } } },
    });

    expect(result.projectName).toBe('Site e-commerce client');
    expect(result.templateId).toBe(builtin.id);
    expect(result.rulesCreated).toBe(builtin.recommendationRuleIds.length);
    expect(result.durationMs).toBeLessThan(10_000);

    // Config persistée avec override fusionné (ADR-041).
    const row = db.connection
      .prepare('SELECT config FROM project_config WHERE project_id = ?')
      .get(result.projectId) as { config: string };
    const config = JSON.parse(row.config) as { alertThresholds: Record<string, number> };
    expect(config.alertThresholds.minScore).toBe(90);
    expect(config.alertThresholds.regressionPoints).toEqual(
      builtin.config.alertThresholds?.regressionPoints,
    );
  });

  it('devrait échouer avec code 4 sur un template inexistant (C17.20)', () => {
    try {
      service.applyTemplate({ templateId: 'absent', projectName: 'X', projectUrl: 'https://x.co' });
      expect.unreachable('apply aurait dû échouer');
    } catch (error) {
      expect((error as Error).message).toMatch(/introuvable/);
      expect(exitCodeFor(error)).toBe(4);
    }
  });
});

describe('TemplateService — validateTemplate (17-02, C17.20)', () => {
  it('devrait valider un builtin du seed', () => {
    const builtin = service.listTemplates({ isBuiltin: true })[0]!;
    const result = service.validateTemplate(builtin.id);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('devrait retourner invalide pour un template absent', () => {
    const result = service.validateTemplate('absent');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/introuvable/);
  });
});

describe('TemplateService — accès connexion (prérequis 17-02)', () => {
  it("devrait exposer la connexion pour l'applier futur", () => {
    expect(service.connection).toBe(db.connection);
  });
});
