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

    expect(service.listTemplates()).toHaveLength(2);
    expect(service.listTemplates({ category: 'saas' }).map((t) => t.name)).toEqual(['B']);
    expect(service.countTemplates()).toBe(2);
    expect(service.countTemplates({ category: 'saas' })).toBe(1);
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
    expect(service.countTemplates()).toBe(0);
  });

  it('devrait protéger les builtins via le service (ADR-040)', () => {
    const t = service.createTemplate({
      name: 'Futur builtin',
      description: '',
      category: 'custom',
    });
    db.connection.prepare('UPDATE project_templates SET is_builtin = 1 WHERE id = ?').run(t.id);

    expect(() => service.updateTemplate(t.id, { name: 'x' })).toThrow(/immuable/);
    expect(() => service.deleteTemplate(t.id)).toThrow(/immuable/);
    expect(service.getTemplate(t.id)).not.toBeNull();
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
    expect(service.countTemplates()).toBe(2);
  });

  it('devrait refuser un export/ import invalides (C17.20)', () => {
    expect(() => service.exportTemplate('absent')).toThrow(/introuvable/);
    expect(() => service.importTemplate('pas-json')).toThrow(/JSON invalide/);
  });
});

describe('TemplateService — accès connexion (prérequis 17-02)', () => {
  it("devrait exposer la connexion pour l'applier futur", () => {
    expect(service.connection).toBe(db.connection);
  });
});
