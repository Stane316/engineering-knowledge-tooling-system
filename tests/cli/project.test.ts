import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase } from '../../src/data/database.js';
import type { Project } from '../../src/shared/validators.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import type { AnalysisReport } from '../../src/analysis/types.js';
import { runCli } from '../../src/cli/program.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

/** Exécute la CLI après avoir vidé les sorties du runtime (runs multiples). */
const run = async (runtime: TestRuntime, ...argv: string[]): Promise<number> => {
  runtime.output.stdout = '';
  runtime.output.stderr = '';
  return runCli(argv, runtime);
};

/** Analyse la sortie standard comme JSON. */
function json<T = Record<string, unknown>>(runtime: TestRuntime): T {
  return JSON.parse(runtime.output.stdout) as T;
}

/** UUID v4 valide mais jamais créé (attends le code 3). */
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

/** Rapport d'audit minimal valide pour `AuditRepository.store`. */
function sampleReport(url: string): AnalysisReport {
  return {
    url,
    timestamp: new Date().toISOString(),
    dimensions: Object.fromEntries(
      (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map((dimension) => [
        dimension,
        {
          dimension,
          score: 80,
          status: 'measured' as const,
          findings: [],
          summary: `Score ${dimension} : 80/100.`,
        },
      ]),
    ),
    findings: [],
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: { status: 'measured', value: 80 },
    },
  } as unknown as AnalysisReport;
}

describe('CLI — projets (Sprint 13-2)', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  /** Crée un projet via la CLI et renvoie son UUID. */
  async function createProject(name: string): Promise<string> {
    const code = await run(runtime, 'project', 'create', name, '--json');
    expect(code).toBe(0);
    return json<Project>(runtime).id;
  }

  /** Stocke un audit directement dans la base (bypass CLI, fixture). */
  function storeAudit(url: string, projectId: string | null): void {
    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      repository.store(sampleReport(url), { projectId });
    } finally {
      database.close();
    }
  }

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  // --- C13.2.1 : create ---
  it('project create crée un projet et affiche son ID (code 0)', async () => {
    const code = await run(runtime, 'project', 'create', 'Mon Projet', '--description', 'Test');
    expect(code).toBe(0);
    expect(runtime.output.stdout).toContain('Projet créé');
    expect(runtime.output.stdout).toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/iu,
    );
  });

  it('project create --json produit un objet JSON valide (C13.2.8)', async () => {
    const id = await createProject('Projet JSON');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu);
    const project = json<Project>(runtime);
    expect(project.name).toBe('Projet JSON');
    expect(project.status).toBe('active');
  });

  // --- C13.2.2 : list ---
  it('project list liste les projets (C13.2.2)', async () => {
    await createProject('Alpha');
    await createProject('Beta');

    expect(await run(runtime, 'project', 'list')).toBe(0);
    expect(runtime.output.stdout).toContain('Alpha');
    expect(runtime.output.stdout).toContain('Beta');
  });

  it('project list --status filtre par statut', async () => {
    await createProject('Actif');
    const archived = await createProject('Archivé');
    expect(await run(runtime, 'project', 'delete', archived, '--force')).toBe(0);
    expect(await run(runtime, 'project', 'create', 'Ancien', '--status', 'archived')).toBe(0);

    expect(await run(runtime, 'project', 'list', '--status', 'archived', '--json')).toBe(0);
    const listed = json<{ count: number; projects: Project[] }>(runtime);
    expect(listed.count).toBe(1);
    expect(listed.projects[0]?.name).toBe('Ancien');
    expect(listed.projects[0]?.status).toBe('archived');
  });

  // --- C13.2.3 : show ---
  it('project show <id> affiche les détails (code 0)', async () => {
    const id = await createProject('Détails');

    expect(await run(runtime, 'project', 'show', id)).toBe(0);
    expect(runtime.output.stdout).toContain('Détails');
    expect(runtime.output.stdout).toContain(id);
  });

  it('project show sur un id inexistant renvoie le code 3 (matrice réelle)', async () => {
    expect(await run(runtime, 'project', 'show', MISSING_ID)).toBe(3);
    expect(runtime.output.stderr).toContain('Projet introuvable');
  });

  // --- C13.2.4 : delete ---
  it('project delete sans --force demande confirmation (code 1)', async () => {
    const id = await createProject('À supprimer');

    expect(await run(runtime, 'project', 'delete', id)).toBe(1);
    expect(runtime.output.stderr).toContain('confirmation requise');

    // Le projet existe toujours.
    expect(await run(runtime, 'project', 'show', id, '--json')).toBe(0);
    expect(json<Project>(runtime).id).toBe(id);
  });

  it('project delete --force supprime le projet (code 0)', async () => {
    const id = await createProject('Supprimé');

    expect(await run(runtime, 'project', 'delete', id, '--force', '--json')).toBe(0);
    expect(json<{ deleted: boolean }>(runtime).deleted).toBe(true);

    expect(await run(runtime, 'project', 'show', id)).toBe(3);
  });

  it('project delete d un id inexistant renvoie le code 3', async () => {
    expect(await run(runtime, 'project', 'delete', MISSING_ID, '--force')).toBe(3);
  });

  // --- C13.2.7 : validation ---
  it('project create avec un statut hors enum échoue en usage (code 2, choices Commander)', async () => {
    expect(await run(runtime, 'project', 'create', 'Bad', '--status', 'paused')).toBe(2);
  });

  it('project show avec un id non UUID échoue en validation (code 4)', async () => {
    expect(await run(runtime, 'project', 'show', 'nimporte-quoi')).toBe(4);
  });

  // --- C13.2.5 : filtre --project sur audit list ---
  it('audit list --project ne montre que les audits du projet', async () => {
    const projectId = await createProject('Site A');
    storeAudit('https://a.example', projectId);
    storeAudit('https://b.example', null);

    expect(await run(runtime, 'audit', 'list', '--project', projectId, '--json')).toBe(0);
    const page = json<{ count: number; audits: { url: string }[] }>(runtime);
    expect(page.count).toBe(1);
    expect(page.audits[0]?.url).toBe('https://a.example');

    // Sans filtre : les deux audits.
    expect(await run(runtime, 'audit', 'list', '--json')).toBe(0);
    expect(json<{ count: number }>(runtime).count).toBe(2);
  });

  it('audit show --project refuse un audit dun autre projet (code 3)', async () => {
    const projectId = await createProject('Site B');
    const database = openDatabase({ dataDir });
    let auditId: number;
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      auditId = repository.store(sampleReport('https://b.example'), { projectId: null }).metadata
        .id!;
    } finally {
      database.close();
    }

    expect(await run(runtime, 'audit', 'show', String(auditId), '--project', projectId)).toBe(3);
    expect(await run(runtime, 'audit', 'show', String(auditId))).toBe(0);
  });

  // --- C13.2.6 : filtre --project sur search / list ---
  it('search --project filtre les résultats (C13.2.6)', async () => {
    const projectId = await createProject('Recherche');
    expect(
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Doc interne',
        '--content',
        'contenu specialise recherche',
        '--project',
        projectId,
      ),
    ).toBe(0);
    expect(
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Doc externe',
        '--content',
        'contenu specialise recherche',
      ),
    ).toBe(0);

    expect(
      await run(runtime, 'search', 'specialise', '--mode', 'fts', '--project', projectId, '--json'),
    ).toBe(0);
    const found = json<{ count: number; results: { resource: { title: string } }[] }>(runtime);
    expect(found.count).toBe(1);
    expect(found.results[0]?.resource.title).toBe('Doc interne');
  });

  it('list --project filtre les ressources', async () => {
    const projectId = await createProject('Liste');
    expect(
      await run(runtime, 'add', '--type', 'tool', '--title', 'Outil A', '--project', projectId),
    ).toBe(0);
    expect(await run(runtime, 'add', '--type', 'tool', '--title', 'Outil B')).toBe(0);

    expect(await run(runtime, 'list', '--project', projectId, '--json')).toBe(0);
    const listed = json<{ count: number; resources: { title: string }[] }>(runtime);
    expect(listed.count).toBe(1);
    expect(listed.resources[0]?.title).toBe('Outil A');
  });

  it('add --project assigne la ressource au projet (visible via list)', async () => {
    const projectId = await createProject('Assignation');
    expect(
      await run(runtime, 'add', '--type', 'other', '--title', 'Assignée', '--project', projectId),
    ).toBe(0);

    expect(await run(runtime, 'list', '--project', projectId, '--json')).toBe(0);
    const listed = json<{ resources: { projectId?: string }[] }>(runtime);
    expect(listed.resources[0]?.projectId).toBe(projectId);
  });

  // --- C13.2.7 : option --project invalide → code 2 ---
  it('une option --project non UUID est refusée (code 2)', async () => {
    expect(await run(runtime, 'audit', 'list', '--project', 'pas-un-uuid')).toBe(2);
  });

  it('add --project sur un projet inexistant renvoie le code 3', async () => {
    expect(
      await run(runtime, 'add', '--type', 'other', '--title', 'Orpheline', '--project', MISSING_ID),
    ).toBe(3);
  });
});
