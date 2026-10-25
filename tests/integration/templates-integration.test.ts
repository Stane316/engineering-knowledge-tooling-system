import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { TemplateRepository } from '../../src/templates/template-repository.js';
import { TemplateService } from '../../src/templates/template-service.js';

/** Base ouverte (wrapper maison, migrations 001-008). */
let db: EktsDatabase;
/** Dossier de données isolé (`:memory:` interdit — reset des métriques). */
let dataDir: string;
/** Service (seed des builtins au constructeur). */
let service: TemplateService;
/** Dépôt (sans seed — lectures CRUD pures). */
let repo: TemplateRepository;
/** Dossier d'échange export/import. */
let workDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-tpl-int-'));
  db = openDatabase({ dataDir });
  new AuditSchema(db.connection).createSchema();
  service = new TemplateService(db.connection);
  repo = new TemplateRepository(db.connection);
  workDir = await mkdtemp(path.join(tmpdir(), 'ekts-tpl-files-'));
});

afterEach(async () => {
  db.close();
  await rm(dataDir, { recursive: true, force: true });
  await rm(workDir, { recursive: true, force: true });
});

describe('Templates — flux complet (C17.3/C17.5)', () => {
  it('créer → lister → appliquer → exporter → importer', () => {
    // 1. Création manuelle (C17.1).
    const template = service.createTemplate({
      name: 'Mon Template',
      description: 'Template de test intégral',
      category: 'custom',
      config: { priorityDimensions: ['performance', 'seo'], tags: ['test'] },
    });
    expect(template.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(template.isBuiltin).toBe(false);

    // 2. Listage (builtins + custom).
    expect(service.listTemplates({ isBuiltin: false })).toHaveLength(1);
    expect(service.listTemplates({ isBuiltin: true })).toHaveLength(10);
    expect(service.listTemplates({ category: 'custom', isBuiltin: false })[0]?.name).toBe(
      'Mon Template',
    );

    // 3. Application (C17.3).
    const result = service.applyTemplate({
      templateId: template.id,
      projectName: 'Mon Projet',
      projectUrl: 'https://example.com',
    });
    expect(result.projectName).toBe('Mon Projet');
    expect(result.templateId).toBe(template.id);
    expect(result.durationMs).toBeLessThan(10_000);

    // La config est persistée (migration 008).
    const row = db.connection
      .prepare('SELECT config FROM project_config WHERE project_id = ?')
      .get(result.projectId) as { config: string };
    expect(JSON.parse(row.config).priorityDimensions).toEqual(['performance', 'seo']);

    // 4. Export (C17.5).
    const json = service.exportTemplate(template.id);
    expect(json).toContain('Mon Template');

    // 5. Import → nouvel identifiant.
    const imported = service.importTemplate(json);
    expect(imported.name).toBe('Mon Template');
    expect(imported.id).not.toBe(template.id);
    expect(service.listTemplates({ isBuiltin: false })).toHaveLength(2);
  });

  it('flux avec overrides partiels (C17.4, ADR-041)', () => {
    const template = service.createTemplate({
      name: 'Base',
      description: 'Template de base',
      category: 'custom',
      config: {
        priorityDimensions: ['performance'],
        alertThresholds: { regressionPoints: 10, minScore: 50 },
        tags: ['base'],
      },
    });

    const result = service.applyTemplate({
      templateId: template.id,
      projectName: 'Projet Custom',
      projectUrl: 'https://custom.com',
      overrides: {
        projectName: 'Projet Renommé',
        config: {
          alertThresholds: { minScore: 75 },
          tags: ['override'],
        },
      },
    });

    expect(result.projectName).toBe('Projet Renommé');

    const row = db.connection
      .prepare('SELECT config FROM project_config WHERE project_id = ?')
      .get(result.projectId) as { config: string };
    const config = JSON.parse(row.config) as Record<string, unknown>;
    expect(config.alertThresholds).toEqual({ regressionPoints: 10, minScore: 75 });
    expect(config.tags).toEqual(['base', 'override']);
  });
});

describe('Templates — protection des builtins (C17.2, ADR-040)', () => {
  it('ne permet ni update ni delete sur un builtin du seed', () => {
    const builtin = service.listTemplates({ isBuiltin: true })[0]!;

    expect(() => service.updateTemplate(builtin.id, { name: 'Modified' })).toThrow(/immuable/);
    expect(() => service.deleteTemplate(builtin.id)).toThrow(/immuable/);
    expect(repo.getById(builtin.id)).not.toBeNull();
  });

  it('rejette un builtin à la mise à jour comme à la suppression via le dépôt', () => {
    const builtin = repo.list({ isBuiltin: true })[0]!;
    expect(() => repo.update(builtin.id, {})).toThrow(/immuable/);
    expect(() => repo.delete(builtin.id)).toThrow(/immuable/);
  });
});

describe('Templates — volume et performance (C17.13/C17.14)', () => {
  it('gère 100 templates : création, listage paginé et export < 10 s', () => {
    const started = Date.now();

    for (let index = 0; index < 100; index += 1) {
      repo.create({
        name: `Template ${String(index).padStart(3, '0')}`,
        description: `Template numéro ${String(index)}`,
        category: 'custom',
        config: { tags: index % 2 === 0 ? ['pair'] : ['impair'] },
      });
    }

    expect(repo.count({ isBuiltin: false })).toBe(100);
    const page = repo.list({ isBuiltin: false, limit: 25, offset: 50 });
    expect(page).toHaveLength(25);
    expect(page[0]?.name).toBe('Template 050');

    // Filtre tags sur les 100 (post-filtre ADR-039).
    expect(repo.list({ isBuiltin: false, tags: ['pair'], limit: 100 })).toHaveLength(50);

    const first = repo.list({ isBuiltin: false, limit: 1 })[0]!;
    service.exportTemplate(first.id);

    expect(Date.now() - started).toBeLessThan(10_000);
  });

  it('applique 10 templates en moins de 10 s (C17.13)', () => {
    const builtins = service.listTemplates({ isBuiltin: true });
    expect(builtins).toHaveLength(10);

    const started = Date.now();
    for (const builtin of builtins) {
      const result = service.applyTemplate({
        templateId: builtin.id,
        projectName: `Projet ${builtin.name}`,
        projectUrl: `https://${builtin.category}.example`,
      });
      expect(result.durationMs).toBeLessThan(10_000);
    }
    expect(Date.now() - started).toBeLessThan(10_000);
  });

  it('reste idempotent sur une seconde ouverture (seed non dupliqué)', () => {
    const builtinsBefore = service.countTemplates({ isBuiltin: true });
    const rulesBefore = (
      db.connection.prepare('SELECT COUNT(*) AS count FROM recommendation_rules').get() as {
        count: number;
      }
    ).count;
    expect(builtinsBefore).toBe(10);

    const second = new TemplateService(db.connection);
    expect(second.countTemplates({ isBuiltin: true })).toBe(10);
    const rulesAfter = (
      db.connection.prepare('SELECT COUNT(*) AS count FROM recommendation_rules').get() as {
        count: number;
      }
    ).count;
    expect(rulesAfter).toBe(rulesBefore);
  });
});

describe('Templates — erreurs (C17.9/C17.11/C17.20)', () => {
  it('échoue proprement sur un template inexistant (C17.9, code 4)', () => {
    expect(() =>
      service.applyTemplate({
        templateId: '00000000-0000-4000-8000-00000000dead',
        projectName: 'X',
        projectUrl: 'https://x.example',
      }),
    ).toThrow(/introuvable/);
    expect(() =>
      service.updateTemplate('00000000-0000-4000-8000-00000000dead', { name: 'x' }),
    ).toThrow(/introuvable/);
    expect(service.validateTemplate('00000000-0000-4000-8000-00000000dead').valid).toBe(false);
  });

  it('échoue proprement sur un export/import JSON invalide (C17.11, code 4)', async () => {
    const broken = path.join(workDir, 'broken.json');
    await writeFile(broken, '{"version":', 'utf-8');
    const raw = await readFile(broken, 'utf-8');
    expect(() => service.importTemplate(raw)).toThrow(/JSON invalide/);
    expect(() => service.importTemplate('{"version":"1.0.0"}')).toThrow(/format d'export/);
  });

  it('crée des projets aux noms identiques sans contrainte de doublon (comportement dépôt maison)', () => {
    // Écart P3 : le spec S17.20 citait « projet dupliqué » en erreur, mais
    // `ProjectRepository` (Sprint 13) n'a aucune contrainte d'unicité sur
    // `projects.name` — comportement inchangé (audit avant modification).
    const template = service.createTemplate({
      name: 'Base doublons',
      description: 'D',
      category: 'custom',
    });

    const first = service.applyTemplate({
      templateId: template.id,
      projectName: 'Site client',
      projectUrl: 'https://a.example',
    });
    const second = service.applyTemplate({
      templateId: template.id,
      projectName: 'Site client',
      projectUrl: 'https://a.example',
    });

    expect(first.projectId).not.toBe(second.projectId);
    expect(first.projectName).toBe(second.projectName);
  });
});
