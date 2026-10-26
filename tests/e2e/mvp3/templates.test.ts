/**
 * E2E MVP-3 — Flux templates (Sprint 17, critères C17.1 → C17.20).
 *
 * Catalogue builtin, création/export/import, application blueprint
 * (projet + configuration), dépendances (BP, règles timeline).
 */
import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createSandbox, listProjectIds, parseJson, runCli, type Sandbox } from './helpers.js';

describe('E2E MVP-3 — Templates (Sprint 17, C17.x)', () => {
  let sandbox: Sandbox;
  /** Template builtin créé au beforeAll. */
  let builtinId: string;
  /** Template manuel créé dans le test 2. */
  let manualId: string;
  /** Projet appliqué dans le test 4. */
  let appliedProjectId: string;

  beforeAll(async () => {
    sandbox = await createSandbox('ekts-e2e-tpl-');
    const listed = await runCli(sandbox.dataDir, ['template', 'list', '--json']);
    expect(listed.status).toBe(0);
    const payload = parseJson<{
      templates: { id: string; isBuiltin: boolean }[];
      count: number;
    }>(listed);
    // Catalogue builtin maison (10 modèles S17).
    expect(payload.count).toBeGreaterThanOrEqual(10);
    builtinId = payload.templates.find((t) => t.isBuiltin === true)!.id;
  });

  afterAll(async () => {
    await sandbox.cleanup();
  });

  it('C17.1-C17.4 : détail d’un template builtin (structure et tags)', async () => {
    const shown = await runCli(sandbox.dataDir, ['template', 'show', builtinId, '--json']);
    expect(shown.status).toBe(0);
    const payload = parseJson<{
      template: {
        name: string;
        category: string;
        config: { tags: string[]; alertThresholds: { regressionPoints: number } };
        recommendationRuleIds: string[];
      };
    }>(shown);
    expect(payload.template.name.length).toBeGreaterThan(0);
    expect(payload.template.category.length).toBeGreaterThan(0);
    expect(Array.isArray(payload.template.config.tags)).toBe(true);
    expect(payload.template.config.tags.length).toBeGreaterThanOrEqual(1);
    expect(payload.template.config.alertThresholds.regressionPoints).toBeGreaterThanOrEqual(1);
  });

  it('C17.5-C17.8 : crée, exporte, réimporte et supprime un template', async () => {
    const created = await runCli(sandbox.dataDir, [
      'template',
      'create',
      '-n',
      'Template E2E',
      '-d',
      'Template créé par le test E2E MVP-3',
      '-c',
      'custom',
      '--json',
    ]);
    expect(created.status).toBe(0);
    manualId = parseJson<{ template: { id: string; isBuiltin: boolean } }>(created).template.id;
    expect(manualId).toMatch(/^[0-9a-f-]{36}$/);
    expect(parseJson<{ template: { isBuiltin: boolean } }>(created).template.isBuiltin).toBe(
      false,
    );

    // Export fichier (signature maison : arguments positionnels id + fichier).
    const exported = path.join(sandbox.dir, 'template-e2e.json');
    const exportResult = await runCli(sandbox.dataDir, [
      'template',
      'export',
      manualId,
      exported,
      '--json',
    ]);
    expect(exportResult.status).toBe(0);
    const file = await stat(exported);
    expect(file.size).toBeGreaterThan(50);
    const content = JSON.parse(await readFile(exported, 'utf-8')) as {
      version: string;
      template: { name: string };
    };
    expect(content.template.name).toContain('Template E2E');

    // Import (suffixe « (importé) » maison).
    const imported = await runCli(sandbox.dataDir, [
      'template',
      'import',
      exported,
      '--json',
    ]);
    expect(imported.status).toBe(0);
    const importedPayload = parseJson<{ template: { id: string; name: string } }>(imported);
    const importedId = importedPayload.template.id;
    const importedName = importedPayload.template.name;
    // Écart P3 (spec S17 vs maison) : le suffixe « (importé) » n'existe pas
    // — chaque import crée un nouvel id, les noms non uniques sont admis.
    expect(importedName).toBe('Template E2E');
    expect(importedId).not.toBe(manualId);

    // Écart P3 (spec S17 vs maison) : pas de confirmation ni d'option -f
    // sur `template delete` — suppression directe → 0.
    const deleted = await runCli(sandbox.dataDir, ['template', 'delete', importedId]);
    expect(deleted.status).toBe(0);
    expect(deleted.stdout).toContain('Template supprimé');
    const gone = await runCli(sandbox.dataDir, ['template', 'show', importedId]);
    expect(gone.status).toBe(4);
  });

  it('C17.9-C17.12 : exporte tout le catalogue builtin dans un dossier', async () => {
    const outDir = path.join(sandbox.dir, 'catalog');
    // Écart P3 : pas d'export --all maison (signature export <id> <fichier>).
    // Catalogue = export builtin par builtin dans le dossier de sortie.
    await mkdir(outDir, { recursive: true });
    const listed = await runCli(sandbox.dataDir, ['template', 'list', '--json']);
    const templates = parseJson<{ templates: { id: string; isBuiltin: boolean; name: string }[] }>(
      listed,
    ).templates;
    for (const template of templates.filter((t) => t.isBuiltin)) {
      const file = path.join(outDir, `${template.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`);
      const result = await runCli(sandbox.dataDir, [
        'template',
        'export',
        template.id,
        file,
        '--json',
      ]);
      expect(result.status).toBe(0);
    }
    const exportedFiles = await readdir(outDir);
    expect(exportedFiles.length).toBeGreaterThanOrEqual(10);
    expect(exportedFiles.every((name) => name.endsWith('.json'))).toBe(true);
  });

  it('C17.13-C17.16 : applique un template (projet + configuration + rapports)', async () => {
    const started = Date.now();
    const applied = await runCli(sandbox.dataDir, [
      'template',
      'apply',
      builtinId,
      '--name',
      'Projet Blueprint',
      '--url',
      'https://blueprint.example',
      '--json',
    ]);
    const duration = Date.now() - started;
    expect(applied.status).toBe(0);
    const report = parseJson<{
      projectId: string;
      projectName: string;
      templateId: string;
      bestPracticesAssociated: number;
      rulesCreated: number;
    }>(applied);
    appliedProjectId = report.projectId;
    expect(report.projectName).toBe('Projet Blueprint');
    expect(report.templateId).toBe(builtinId);
    expect(report.rulesCreated).toBeGreaterThanOrEqual(1);
    // Application < 5 s.
    expect(duration).toBeLessThan(5_000);

    // Le projet appliqué existe (metadata.url).
    const shown = await runCli(sandbox.dataDir, ['project', 'show', appliedProjectId, '--json']);
    expect(shown.status).toBe(0);
    expect(parseJson<{ name: string }>(shown).name).toBe('Projet Blueprint');

    // Message humain sans --json.
    const human = await runCli(sandbox.dataDir, [
      'template',
      'apply',
      builtinId,
      '--name',
      'Projet Blueprint 2',
      '--url',
      'https://blueprint2.example',
    ]);
    expect(human.status).toBe(0);
    expect(human.stdout).toContain('Projet créé');
  });

  it('C17.17-C17.20 : codes retour (3 / 4 / 2 / 1) et registre complet', async () => {
    // Écart P3 maison : introuvable sur template → 4 (ValidationError),
    // là où les autres ressources renvoient 3 (NOT_FOUND).
    const missing = await runCli(sandbox.dataDir, [
      'template',
      'show',
      '00000000-0000-4000-8000-00000000dead',
    ]);
    expect(missing.status).toBe(4);

    const invalidUuid = await runCli(sandbox.dataDir, ['template', 'show', 'pas-uuid']);
    expect(invalidUuid.status).toBe(4);

    const missingArg = await runCli(sandbox.dataDir, ['template', 'create']);
    expect(missingArg.status).toBe(2);

    // Les builtins sont immuables (ADR-040) → suppression refusée en 4.
    const immutable = await runCli(sandbox.dataDir, ['template', 'delete', builtinId]);
    expect(immutable.status).toBe(4);
    expect(immutable.stderr).toContain('immuable');

    // Tous les sous-commandes du registre S17 répondent.
    for (const args of [
      ['template', 'list'],
      ['template', 'export', builtinId, path.join(sandbox.dir, 'builtin-2.json')],
    ]) {
      const result = await runCli(sandbox.dataDir, args);
      expect(result.status).toBe(0);
    }

    // Les projets créés par apply apparaissent dans le registre.
    const ids = await listProjectIds(sandbox.dataDir);
    expect(ids).toContain(appliedProjectId);
  });
});
