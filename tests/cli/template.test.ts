import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runCli } from '../../src/cli/program.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

/** UUID absent mais canonique (validation OK, ressource introuvable). */
const ABSENT_ID = '00000000-0000-4000-8000-00000000dead';

/** Exécute la CLI après avoir vidé les sorties. */
const run = async (runtime: TestRuntime, ...argv: string[]): Promise<number> => {
  runtime.output.stdout = '';
  runtime.output.stderr = '';
  return runCli(argv, runtime);
};

/** Analyse la sortie standard comme JSON. */
function json<T = Record<string, unknown>>(runtime: TestRuntime): T {
  return JSON.parse(runtime.output.stdout) as T;
}

describe('CLI ekts template (Sprint 17-03, C17.6/C17.7)', () => {
  let dataDir: string;
  let runtime: TestRuntime;
  /** Dossier d'échange pour export/import. */
  let workDir: string;

  beforeEach(async () => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
    workDir = await mkdtemp(path.join(tmpdir(), 'ekts-tpl-files-'));
  });

  afterEach(async () => {
    removeDataDir(dataDir);
    await rm(workDir, { recursive: true, force: true });
  });

  /** Crée un template custom via la CLI et retourne son identifiant. */
  async function createTemplate(extra: string[] = []): Promise<string> {
    const status = await run(
      runtime,
      'template',
      'create',
      '-n',
      'Template CLI',
      '-d',
      'Créé par les tests',
      '-c',
      'custom',
      '--json',
      ...extra,
    );
    expect(status).toBe(0);
    return json<{ template: { id: string } }>(runtime).template.id;
  }

  describe('template list', () => {
    it('affiche les 10 prédéfinis dès la première commande (C17.2)', async () => {
      const status = await run(runtime, 'template', 'list', '--json');
      expect(status).toBe(0);

      const payload = json<{ count: number; templates: { isBuiltin: boolean }[] }>(runtime);
      expect(payload.count).toBe(10);
      expect(payload.templates.every((template) => template.isBuiltin)).toBe(true);
      expect(runtime.output.stdout).not.toContain('template(s)');
    });

    it('filtre builtin/custom/catégorie et borne le limit (codes 0/4)', async () => {
      await createTemplate();

      expect(await run(runtime, 'template', 'list', '--builtin', '--json')).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(10);

      expect(await run(runtime, 'template', 'list', '--custom', '--json')).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(1);

      expect(await run(runtime, 'template', 'list', '-c', 'saas', '--json')).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(1);

      expect(await run(runtime, 'template', 'list', '-c', 'bogus')).toBe(4);
      expect(await run(runtime, 'template', 'list', '-n', '0')).toBe(4);
      expect(await run(runtime, 'template', 'list', '--builtin', '--custom')).toBe(4);
    });

    it("retourne un message d'information si le filtre ne matche rien", async () => {
      const status = await run(runtime, 'template', 'list', '-c', 'custom');
      expect(status).toBe(0);
      expect(runtime.output.stdout).toContain('Aucun template trouvé.');
    });

    it("fonctionne avec l'alias tpl", async () => {
      const status = await run(runtime, 'tpl', 'list', '--json');
      expect(status).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(10);
    });
  });

  describe('template create/show', () => {
    it('crée un template custom avec config et listes (C17.1)', async () => {
      const status = await run(
        runtime,
        'template',
        'create',
        '-n',
        'Perso',
        '-d',
        'Description',
        '-c',
        'custom',
        '--config',
        '{"priorityDimensions":["seo"],"tags":["x"]}',
        '--bp-ids',
        'bp-1,bp-2',
        '--rule-ids',
        'rule-1',
        '--json',
      );
      expect(status).toBe(0);

      const template = json<{
        template: { id: string; bestPracticeIds: string[]; recommendationRuleIds: string[] };
      }>(runtime).template;
      expect(template.bestPracticeIds).toEqual(['bp-1', 'bp-2']);
      expect(template.recommendationRuleIds).toEqual(['rule-1']);
    });

    it('refuse une catégorie invalide, un JSON invalide et des options manquantes (4/2)', async () => {
      expect(await run(runtime, 'template', 'create', '-n', 'X', '-d', 'Y', '-c', 'bogus')).toBe(4);
      expect(
        await run(
          runtime,
          'template',
          'create',
          '-n',
          'X',
          '-d',
          'Y',
          '-c',
          'custom',
          '--config',
          '{nope',
        ),
      ).toBe(4);
      expect(await run(runtime, 'template', 'create', '-n', 'X')).toBe(2);
    });

    it('affiche le détail dun template (0) et refuse id absent/UUID invalide (4)', async () => {
      const id = await createTemplate();

      expect(await run(runtime, 'template', 'show', id, '--json')).toBe(0);
      const payload = json<{ template: { name: string } }>(runtime);
      expect(payload.template.name).toBe('Template CLI');

      expect(await run(runtime, 'template', 'show', ABSENT_ID)).toBe(4);
      expect(await run(runtime, 'template', 'show', 'pas-uuid')).toBe(4);
    });
  });

  describe('template apply (C17.3/C17.4)', () => {
    it('crée un projet depuis un template avec overrides de config', async () => {
      const id = await createTemplate();

      const status = await run(
        runtime,
        'template',
        'apply',
        id,
        '--name',
        'Site client',
        '--url',
        'https://client.example',
        '--description',
        'Projet de test',
        '--config',
        '{"priorityDimensions":["ux"]}',
        '--json',
      );
      expect(status).toBe(0);

      const result = json<{ projectId: string; projectName: string; durationMs: number }>(runtime);
      expect(result.projectName).toBe('Site client');
      expect(result.projectId).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.durationMs).toBeLessThan(10_000);
    });

    it('accepte un builtin du seed et refuse template/entrée invalides (0/4/2)', async () => {
      const list = await run(runtime, 'template', 'list', '--builtin', '--json');
      expect(list).toBe(0);
      const builtinId = json<{ templates: { id: string }[] }>(runtime).templates[0]!.id;

      expect(
        await run(
          runtime,
          'template',
          'apply',
          builtinId,
          '--name',
          'Depuis builtin',
          '--url',
          'https://b.example',
        ),
      ).toBe(0);

      expect(
        await run(
          runtime,
          'template',
          'apply',
          ABSENT_ID,
          '--name',
          'X',
          '--url',
          'https://x.example',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'template',
          'apply',
          'pas-uuid',
          '--name',
          'X',
          '--url',
          'https://x.example',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'template',
          'apply',
          builtinId,
          '--name',
          'X',
          '--url',
          'https://x.example',
          '--config',
          '{bad',
        ),
      ).toBe(4);
      expect(await run(runtime, 'template', 'apply', builtinId, '--url', 'https://x.example')).toBe(
        2,
      );
    });
  });

  describe('template delete (ADR-040)', () => {
    it('supprime un template custom (0) mais refuse builtin/absent (4)', async () => {
      const id = await createTemplate();
      expect(await run(runtime, 'template', 'delete', id, '--json')).toBe(0);
      expect(json<{ deleted: boolean }>(runtime).deleted).toBe(true);

      expect(await run(runtime, 'template', 'delete', id)).toBe(4);
      expect(await run(runtime, 'template', 'delete', ABSENT_ID)).toBe(4);
      expect(await run(runtime, 'template', 'delete', 'pas-uuid')).toBe(4);
    });

    it("refuse la suppression d'un builtin du seed (C17.2/ADR-040)", async () => {
      await run(runtime, 'template', 'list', '--builtin', '--json');
      const builtinId = json<{ templates: { id: string }[] }>(runtime).templates[0]!.id;

      const status = await run(runtime, 'template', 'delete', builtinId);
      expect(status).toBe(4);
      expect(runtime.output.stderr).toContain('immuable');
    });
  });

  describe('template export/import (C17.5)', () => {
    it('exporte puis réimporte un template (0/0, nouvel identifiant)', async () => {
      const id = await createTemplate();
      const file = path.join(workDir, 'export.json');

      expect(await run(runtime, 'template', 'export', id, file, '--json')).toBe(0);
      expect(json<{ exported: boolean }>(runtime).exported).toBe(true);
      const written = await readFile(file, 'utf-8');
      expect(written).toContain('Template CLI');

      expect(await run(runtime, 'template', 'import', file, '--json')).toBe(0);
      const imported = json<{ template: { id: string } }>(runtime).template;
      expect(imported.id).not.toBe(id);
    });

    it("refuse l'export/ import invalides (4) et le fichier absent (1)", async () => {
      expect(
        await run(runtime, 'template', 'export', ABSENT_ID, path.join(workDir, 'x.json')),
      ).toBe(4);

      const broken = path.join(workDir, 'broken.json');
      await writeFile(broken, '{pas json', 'utf-8');
      expect(await run(runtime, 'template', 'import', broken)).toBe(4);

      expect(await run(runtime, 'template', 'import', path.join(workDir, 'absent.json'))).toBe(1);
    });
  });
});
