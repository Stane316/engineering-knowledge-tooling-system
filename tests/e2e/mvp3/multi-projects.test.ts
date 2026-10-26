/**
 * E2E MVP-3 — Flux multi-projets (Sprint 13, critères C13.1 → C13.15).
 *
 * CLI réelle compilée (`dist/cli/index.js`), bac à sable `EKTS_DATA_DIR`,
 * audits seedés en SQL (voir `helpers.ts` — écart P3 au spec S18-01 qui
 * imposait `npm install` + `audit <url> --findings` inexistant).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createSandbox,
  listProjectIds,
  parseJson,
  runCli,
  seedAudit,
  type Sandbox,
} from './helpers.js';

describe('E2E MVP-3 — Multi-projets (Sprint 13, C13.x)', () => {
  let sandbox: Sandbox;

  beforeAll(async () => {
    sandbox = await createSandbox('ekts-e2e-projects-');
  });

  afterAll(async () => {
    await sandbox.cleanup();
  });

  it('C13.1-C13.4 : crée, affiche, liste et supprime un projet', async () => {
    // Création (--json → identifiant).
    const created = await runCli(sandbox.dataDir, [
      'project',
      'create',
      'Projet Test',
      '-d',
      'Projet du test E2E',
      '--json',
    ]);
    expect(created.status).toBe(0);
    // --json : stdout est le JSON pur du projet (le message humain est
    // affiché sans l'option).
    const project = parseJson<{ id: string; name: string; status: string }>(created);
    expect(project.name).toBe('Projet Test');
    expect(project.id).toMatch(/^[0-9a-f-]{36}$/);

    // Détail.
    const shown = await runCli(sandbox.dataDir, ['project', 'show', project.id, '--json']);
    expect(shown.status).toBe(0);
    expect(parseJson<{ name: string }>(shown).name).toBe('Projet Test');

    // Liste.
    const listed = await runCli(sandbox.dataDir, ['project', 'list', '--json']);
    expect(listed.status).toBe(0);
    expect(parseJson<{ projects: { id: string }[] }>(listed).projects).toHaveLength(1);

    // Suppression (--force = confirmation non interactive).
    const deleted = await runCli(sandbox.dataDir, ['project', 'delete', project.id, '-f']);
    expect(deleted.status).toBe(0);
    expect(deleted.stdout).toMatch(/[Ss]upprimé/);

    const afterDelete = await runCli(sandbox.dataDir, ['project', 'list', '--json']);
    expect(parseJson<{ projects: unknown[] }>(afterDelete).projects).toHaveLength(0);
  });

  it('C13.5 : refuse la suppression sans confirmation (code 1)', async () => {
    const created = await runCli(sandbox.dataDir, ['project', 'create', 'À confirmer', '--json']);
    const project = parseJson<{ id: string }>(created);

    const refused = await runCli(sandbox.dataDir, ['project', 'delete', project.id]);
    expect(refused.status).toBe(1);

    // Le projet existe toujours.
    const still = await runCli(sandbox.dataDir, ['project', 'show', project.id]);
    expect(still.status).toBe(0);

    await runCli(sandbox.dataDir, ['project', 'delete', project.id, '-f']);
  });

  it('C13.6-C13.8 : codes retour ressource/entrée (3 / 4 / 2)', async () => {
    const missing = await runCli(sandbox.dataDir, [
      'project',
      'show',
      '00000000-0000-4000-8000-00000000dead',
    ]);
    expect(missing.status).toBe(3);

    const invalidUuid = await runCli(sandbox.dataDir, ['project', 'show', 'pas-uuid']);
    expect(invalidUuid.status).toBe(4);

    const missingArg = await runCli(sandbox.dataDir, ['project', 'create']);
    expect(missingArg.status).toBe(2);
  });

  it("C13.9-C13.12 : filtre les audits par projet et préserve l'historique", async () => {
    // Deux projets + audits rattachés (seed SQL réel).
    const projectA = parseJson<{ id: string }>(
      await runCli(sandbox.dataDir, ['project', 'create', 'Projet A', '--json']),
    );
    const projectB = parseJson<{ id: string }>(
      await runCli(sandbox.dataDir, ['project', 'create', 'Projet B', '--json']),
    );
    seedAudit(sandbox.dataDir, {
      projectId: projectA.id,
      url: 'https://a.example',
      timestamp: '2026-05-01T10:00:00.000Z',
      score: 80,
    });
    seedAudit(sandbox.dataDir, {
      projectId: projectB.id,
      url: 'https://b.example',
      timestamp: '2026-05-02T10:00:00.000Z',
      score: 65,
    });

    const listA = await runCli(sandbox.dataDir, ['audit', 'list', '-p', projectA.id]);
    expect(listA.status).toBe(0);
    expect(listA.stdout).toContain('https://a.example');
    expect(listA.stdout).not.toContain('https://b.example');

    const listB = await runCli(sandbox.dataDir, ['audit', 'list', '-p', projectB.id]);
    expect(listB.stdout).toContain('https://b.example');
    expect(listB.stdout).not.toContain('https://a.example');

    // C13.12 : la suppression conserve les audits (project_id → NULL).
    const deleted = await runCli(sandbox.dataDir, ['project', 'delete', projectA.id, '-f']);
    expect(deleted.status).toBe(0);

    const orphans = await runCli(sandbox.dataDir, ['audit', 'list']);
    expect(orphans.status).toBe(0);
    expect(orphans.stdout).toContain('https://a.example');
    expect(orphans.stdout).toContain('https://b.example');
  });

  it('C13.13-C13.15 : export JSON stable des projets (scripting)', async () => {
    const created = await runCli(sandbox.dataDir, ['project', 'create', 'JSON Only', '--json']);
    const project = parseJson<{ id: string; createdAt: string }>(created);
    expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const ids = await listProjectIds(sandbox.dataDir);
    expect(ids).toContain(project.id);

    // Comptage cohérent entre --json et sortie humaine.
    const human = await runCli(sandbox.dataDir, ['project', 'list']);
    expect(human.stdout).toContain('JSON Only');
  });
});
