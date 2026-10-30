import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase } from '../../src/data/database.js';
import { migrations } from '../../src/data/migrations/index.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { exitCodeFor } from '../../src/cli/program.js';
import { TemplateRepository } from '../../src/templates/template-repository.js';

import type { CreateTemplateInput, TemplateConfig } from '../../src/templates/template.types.js';

/** Version de schéma courante, dérivée de la liste des migrations. */
const SCHEMA_VERSION = migrations.reduce((max, migration) => Math.max(max, migration.version), 0);

/** Base ouverte (wrapper maison, migration 007 auto-appliquée). */
let db: ReturnType<typeof openDatabase>;
/** Dossier de données isolé (`:memory:` interdit — reset des métriques). */
let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-templates-repo-'));
  db = openDatabase({ dataDir });
  new AuditSchema(db.connection).createSchema();
});

afterEach(async () => {
  db.close();
  await rm(dataDir, { recursive: true, force: true });
});

/**
 * Entrée de test complète.
 *
 * @param over - Champs à remplacer.
 * @returns Données de création valides.
 */
function input(over: Partial<CreateTemplateInput> = {}): CreateTemplateInput {
  return {
    name: 'Template de test',
    description: 'Template créé par les tests',
    category: 'custom',
    config: { priorityDimensions: ['performance'] },
    bestPracticeIds: ['bp-1'],
    recommendationRuleIds: ['rule-1'],
    ...over,
  };
}

describe('TemplateRepository — migration (17-01)', () => {
  it('devrait créer la table project_templates avec la version de schéma courante', () => {
    const tables = db.connection
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_templates'")
      .all();
    expect(tables).toHaveLength(1);

    const uv = db.connection.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(uv.user_version).toBe(SCHEMA_VERSION);
  });
});

describe('TemplateRepository — create', () => {
  it('devrait créer un template avec UUID, config et listes', () => {
    const t = new TemplateRepository(db.connection).create(input());

    expect(t.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(t.name).toBe('Template de test');
    expect(t.category).toBe('custom');
    expect(t.config.priorityDimensions).toEqual(['performance']);
    expect(t.bestPracticeIds).toEqual(['bp-1']);
    expect(t.recommendationRuleIds).toEqual(['rule-1']);
    expect(t.isBuiltin).toBe(false);
    expect(t.createdAt).toBe(t.updatedAt);
  });

  it('devrait retourner exactement les champs insertés (round-trip JSON)', () => {
    const repo = new TemplateRepository(db.connection);
    const config: TemplateConfig = {
      priorityDimensions: ['seo', 'accessibility'],
      alertThresholds: { regressionPoints: 15 },
      tags: ['node', 'api'],
    };
    const t = repo.create(
      input({
        config,
        bestPracticeIds: ['bp-1', 'bp-2'],
        recommendationRuleIds: ['r-1'],
      }),
    );

    const loaded = repo.getById(t.id)!;
    expect(loaded.config).toEqual(config);
    expect(loaded.bestPracticeIds).toEqual(['bp-1', 'bp-2']);
    expect(loaded.recommendationRuleIds).toEqual(['r-1']);
  });

  it('devrait créer un template minimal sans config ni listes', () => {
    const t = new TemplateRepository(db.connection).create({
      name: 'Minimal',
      description: '',
      category: 'custom',
    });

    expect(t.config).toEqual({});
    expect(t.bestPracticeIds).toEqual([]);
    expect(t.recommendationRuleIds).toEqual([]);
  });

  it('devrait appliquer la catégorie inconnue en erreur 4 (ValidationError)', () => {
    const repo = new TemplateRepository(db.connection);
    expect(() => repo.create(input({ category: 'autre' as never }))).toThrow(/Catégorie inconnue/);
    try {
      repo.create(input({ category: 'autre' as never }));
    } catch (error) {
      expect(exitCodeFor(error)).toBe(4);
    }
  });

  it('devrait refuser un nom vide (ValidationError 4)', () => {
    const repo = new TemplateRepository(db.connection);
    expect(() => repo.create(input({ name: '   ' }))).toThrow(/ne peut pas être vide/);
  });
});

describe('TemplateRepository — getById', () => {
  it('devrait retourner null pour un template absent', () => {
    expect(new TemplateRepository(db.connection).getById('absent')).toBeNull();
  });
});

describe('TemplateRepository — list/filters/count', () => {
  /** Crée quelques templates variés pour les tests de filtres. */
  function seed(): TemplateRepository {
    const repo = new TemplateRepository(db.connection);
    repo.create(input({ name: 'AAA blog', category: 'blog' }));
    repo.create(input({ name: 'bbb saas', category: 'saas' }));
    repo.create(
      input({ name: 'CCC custom', category: 'custom', config: { tags: ['node', 'api'] } }),
    );
    repo.create(input({ name: 'DDD custom', category: 'custom', config: { tags: ['node'] } }));
    return repo;
  }

  it('devrait retourner tous les templates par défaut', () => {
    const repo = seed();
    expect(repo.list()).toHaveLength(4);
    expect(repo.count()).toBe(4);
  });

  it('devrait filtrer par catégorie et par isBuiltin', () => {
    const repo = seed();
    expect(repo.list({ category: 'custom' })).toHaveLength(2);
    expect(repo.list({ category: 'blog' })).toHaveLength(1);
    expect(repo.list({ isBuiltin: true })).toHaveLength(0);
    expect(repo.list({ isBuiltin: false })).toHaveLength(4);
    expect(repo.count({ category: 'blog' })).toBe(1);
    expect(repo.count({ isBuiltin: true })).toBe(0);
  });

  it('devrait trier par nom (ASC) sur des templates non builtin', () => {
    const repo = seed();
    const names = repo.list().map((t) => t.name);
    expect(names).toEqual(['AAA blog', 'CCC custom', 'DDD custom', 'bbb saas']);
  });

  it('devrait paginer (limit/offset)', () => {
    const repo = seed();
    const page1 = repo.list({ limit: 3, offset: 0 });
    const page2 = repo.list({ limit: 3, offset: 3 });
    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(1);
  });

  it('devrait filtrer par tags côté application (ADR-039)', () => {
    const repo = seed();
    const tagged = repo.list({ tags: ['node'] });
    expect(tagged.map((t) => t.name)).toEqual(['CCC custom', 'DDD custom']);

    const both = repo.list({ tags: ['node', 'api'] });
    expect(both.map((t) => t.name)).toEqual(['CCC custom']);
  });

  it('devrait limiter APRÈS le filtre tags (cohérence pagination+tags)', () => {
    const repo = seed();
    const page = repo.list({ tags: ['node'], limit: 1, offset: 1 });
    expect(page.map((t) => t.name)).toEqual(['DDD custom']);
  });
});

describe('TemplateRepository — update/delete + protection builtin', () => {
  it('devrait mettre à jour les champs fournis (patch)', () => {
    const repo = new TemplateRepository(db.connection);
    const t = repo.create(input());

    const updated = repo.update(t.id, { name: 'Renommé', config: { tags: ['x'] } });
    expect(updated.name).toBe('Renommé');
    expect(updated.config).toEqual({ tags: ['x'] });
    expect(updated.description).toBe('Template créé par les tests');
    expect(updated.updatedAt >= updated.createdAt).toBe(true);
  });

  it('devrait retourner tel quel pour un update sans champ', () => {
    const repo = new TemplateRepository(db.connection);
    const t = repo.create(input());
    expect(repo.update(t.id, {})).toEqual(t);
  });

  it('devrait refuser un update d’un template absent (4)', () => {
    const repo = new TemplateRepository(db.connection);
    expect(() => repo.update('absent', { name: 'x' })).toThrow(/introuvable/);
  });

  it('devrait supprimer un template (puis getById → null)', () => {
    const repo = new TemplateRepository(db.connection);
    const t = repo.create(input());
    repo.delete(t.id);
    expect(repo.getById(t.id)).toBeNull();
  });

  it('devrait refuser la suppression d’un template absent (4)', () => {
    const repo = new TemplateRepository(db.connection);
    expect(() => repo.delete('absent')).toThrow(/introuvable/);
  });

  it('devrait rendre un builtin immuable (ADR-040) : update/delete refusés', () => {
    const repo = new TemplateRepository(db.connection);
    const t = repo.create(input());
    // Bascule en builtin comme le fera le seed 17-02.
    db.connection.prepare('UPDATE project_templates SET is_builtin = 1 WHERE id = ?').run(t.id);
    const builtin = repo.getById(t.id)!;
    expect(builtin.isBuiltin).toBe(true);

    try {
      repo.update(t.id, { name: 'x' });
      expect.unreachable('update builtin aurait dû échouer');
    } catch (error) {
      expect((error as Error).message).toMatch(/immuable/);
      expect(exitCodeFor(error)).toBe(4);
    }
    try {
      repo.delete(t.id);
      expect.unreachable('delete builtin aurait dû échouer');
    } catch (error) {
      expect((error as Error).message).toMatch(/immuable/);
      expect(exitCodeFor(error)).toBe(4);
    }
    expect(repo.getById(t.id)).not.toBeNull();
  });
});

describe('TemplateRepository — export/import (C17.5)', () => {
  it('devrait exporter un template en JSON sans id/dates/builtin', () => {
    const repo = new TemplateRepository(db.connection);
    const t = repo.create(input());
    const json = repo.exportToJson(t.id);

    const data = JSON.parse(json) as Record<string, unknown>;
    expect(data.version).toBe('1.0.0');
    expect(data.exportedAt).toEqual(expect.any(String));
    const template = data.template as Record<string, unknown>;
    expect(template.name).toBe('Template de test');
    expect(template).not.toHaveProperty('id');
    expect(template).not.toHaveProperty('isBuiltin');
    expect(template).not.toHaveProperty('createdAt');
  });

  it('devrait importer un export en créant un NOUVEAU template', () => {
    const repo = new TemplateRepository(db.connection);
    const original = repo.create(input());
    const json = repo.exportToJson(original.id);

    const imported = repo.importFromJson(json);
    expect(imported.id).not.toBe(original.id);
    expect(imported.isBuiltin).toBe(false);
    expect(imported.name).toBe(original.name);
    expect(imported.config).toEqual(original.config);
    expect(imported.bestPracticeIds).toEqual(original.bestPracticeIds);
    expect(repo.count()).toBe(2);
  });

  it('devrait refuser un JSON invalide (C17.20)', () => {
    const repo = new TemplateRepository(db.connection);
    expect(() => repo.importFromJson('{pas du json')).toThrow(/JSON invalide/);
    try {
      repo.importFromJson('{"foo": 1}');
    } catch (error) {
      expect((error as Error).message).toMatch(/format d'export invalide/);
      expect(exitCodeFor(error)).toBe(4);
    }
  });

  it("devrait refuser l'export d'un template absent", () => {
    const repo = new TemplateRepository(db.connection);
    expect(() => repo.exportToJson('absent')).toThrow(/introuvable/);
  });
});
