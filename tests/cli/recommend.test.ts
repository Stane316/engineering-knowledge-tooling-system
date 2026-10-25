import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runCli } from '../../src/cli/program.js';
import { openDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

/** UUID canonique pour les tests (source stable). */
const PROJECT_ID = '00000000-0000-4000-8000-000000000001';

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

describe('CLI ekts recommend (Sprint 16-03, C16.8→C16.11)', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  /** Projets + audits seedés dans les bases du runtime. */
  function seedAudits(): void {
    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const project = new ProjectRepository(database.connection).create({ name: 'Site recos' });
      database.connection
        .prepare('UPDATE projects SET id = ? WHERE name = ?')
        .run(PROJECT_ID, 'Site recos');
      expect(project.name).toBe('Site recos');

      const insert = database.connection.prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings, project_id)
         VALUES (?, ?, 70, 1, 0, 0, 1, 0, ?)`,
      );
      const finding = database.connection.prepare(
        `INSERT INTO audit_findings
           (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
         VALUES (?, 'performance', 'Images non optimisées', 3, 2, 2, 'medium', 'WebP')`,
      );
      const dimension = database.connection.prepare(
        `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
         VALUES (?, 'performance', 70, 1)`,
      );
      for (const timestamp of ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']) {
        const result = insert.run('https://example.com', timestamp, PROJECT_ID);
        const auditId = Number(result.lastInsertRowid);
        dimension.run(auditId);
        finding.run(auditId);
      }
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

  /** Ajoute une règle via la CLI et retourne son id. */
  async function addRule(extra: string[] = []): Promise<string> {
    const code = await run(
      runtime,
      'recommend',
      'rules',
      'add',
      '-n',
      'Images',
      '--dimension',
      'performance',
      '--severity',
      '2',
      '--pattern',
      'images non optimisées',
      '--rec-title',
      'Optimiser les images',
      '--rec-desc',
      'Convertir en WebP',
      ...extra,
      '--json',
    );
    expect(code).toBe(0);
    return json<{ rule: { id: string } }>(runtime).rule.id;
  }

  // --- rules add / list (C16.11) ---
  describe('rules add', () => {
    it('crée une règle avec défauts (code 0, JSON)', async () => {
      const id = await addRule();
      expect(id).toMatch(/^[0-9a-f-]{36}$/iu);

      const payload = json<{ rule: { isActive: boolean; priority: string; effort: number } }>(
        runtime,
      );
      expect(payload.rule.isActive).toBe(true);
      expect(payload.rule.priority).toBe('medium');
      expect(payload.rule.effort).toBe(3);
    });

    it('accepte effort/impact/priority explicites', async () => {
      await addRule(['--effort', '2', '--impact', '5', '--priority', 'critical']);
      const payload = json<{ rule: { effort: number; impact: number; priority: string } }>(runtime);
      expect(payload.rule).toMatchObject({ effort: 2, impact: 5, priority: 'critical' });
    });

    it('rejoue les entrées invalides (code 4) et l usage (code 2)', async () => {
      expect(
        await run(
          runtime,
          'rec',
          'rules',
          'add',
          '-n',
          'X',
          '--dimension',
          'bogus',
          '--severity',
          '1',
          '--pattern',
          'p',
          '--rec-title',
          't',
          '--rec-desc',
          'd',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'rec',
          'rules',
          'add',
          '-n',
          'X',
          '--dimension',
          'seo',
          '--severity',
          '9',
          '--pattern',
          'p',
          '--rec-title',
          't',
          '--rec-desc',
          'd',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'rec',
          'rules',
          'add',
          '-n',
          'X',
          '--dimension',
          'seo',
          '--severity',
          '1',
          '--pattern',
          'p',
          '--rec-title',
          't',
          '--rec-desc',
          'd',
          '--priority',
          'urgent',
        ),
      ).toBe(4);
      expect(await run(runtime, 'rec', 'rules', 'add', '-n', 'seul')).toBe(2);
    });
  });

  describe('rules list / toggle / delete', () => {
    it('liste les règles avec compte (code 0) et message vide', async () => {
      expect(await run(runtime, 'recommend', 'rules', 'list')).toBe(0);
      expect(runtime.output.stdout).toContain('Aucune règle');

      await addRule();
      const code = await run(runtime, 'recommend', 'rules', 'list', '--json');
      expect(code).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(1);
    });

    it('filtre par dimension et --active (code 0/4)', async () => {
      await addRule();
      expect(await run(runtime, 'rec', 'rules', 'list', '-d', 'performance')).toBe(0);
      expect(await run(runtime, 'rec', 'rules', 'list', '--active', '--json')).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(1);
      expect(await run(runtime, 'rec', 'rules', 'list', '-d', 'bogus')).toBe(4);
      expect(await run(runtime, 'rec', 'rules', 'list', '-n', '0')).toBe(4);
    });

    it('toggle active/désactive (code 0, 4 absent, 4 UUID)', async () => {
      const id = await addRule();

      expect(await run(runtime, 'rec', 'rules', 'toggle', id, '--json')).toBe(0);
      expect(json<{ rule: { isActive: boolean } }>(runtime).rule.isActive).toBe(false);

      expect(await run(runtime, 'rec', 'rules', 'toggle', 'pas-uuid')).toBe(4);
      expect(
        await run(runtime, 'rec', 'rules', 'toggle', '00000000-0000-4000-8000-000000000099'),
      ).toBe(4);
    });

    it('delete exige --yes (code 1) puis supprime (code 0)', async () => {
      const id = await addRule();

      expect(await run(runtime, 'rec', 'rules', 'delete', id)).toBe(1);
      expect(await run(runtime, 'rec', 'rules', 'delete', id, '--yes', '--json')).toBe(0);
      expect(json<{ deleted: boolean }>(runtime).deleted).toBe(true);

      expect(await run(runtime, 'rec', 'rules', 'delete', 'pas-uuid', '--yes')).toBe(4);
      expect(
        await run(
          runtime,
          'rec',
          'rules',
          'delete',
          '00000000-0000-4000-8000-000000000099',
          '--yes',
        ),
      ).toBe(4);
    });
  });

  // --- generate (C16.8) ---
  describe('generate', () => {
    it('génère des recommandations depuis règles + audits (code 0)', async () => {
      seedAudits();
      await addRule();

      const code = await run(runtime, 'recommend', 'generate', PROJECT_ID, '--json');
      expect(code).toBe(0);
      const report = json<{
        totalRecommendations: number;
        rulesApplied: number;
        recommendations: Array<{ relevanceScore: number }>;
      }>(runtime);
      expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
      expect(report.rulesApplied).toBeGreaterThanOrEqual(1);
      expect(report.recommendations[0]?.relevanceScore).toBeGreaterThan(0.5);
    });

    it('affiche le rendu humain (%, source, constat)', async () => {
      seedAudits();
      await addRule();

      const code = await run(runtime, 'rec', 'generate', PROJECT_ID);
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('Recommandations générées');
      expect(runtime.output.stdout).toContain('Optimiser les images');
      expect(runtime.output.stdout).toContain('%');
      expect(runtime.output.stdout).toContain('📏 règle');
    });

    it('projet absent : message non bloquant (code 0, 0 reco)', async () => {
      const database = openDatabase({ dataDir });
      new ProjectRepository(database.connection).create({ name: 'Vide' });
      database.connection
        .prepare('UPDATE projects SET id = ? WHERE name = ?')
        .run(PROJECT_ID, 'Vide');
      database.close();

      const code = await run(runtime, 'rec', 'generate', PROJECT_ID);
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('Aucune recommandation');
    });

    it('UUID invalide (4) et projet introuvable (3)', async () => {
      expect(await run(runtime, 'rec', 'generate', 'pas-uuid')).toBe(4);
      expect(await run(runtime, 'rec', 'generate', '00000000-0000-4000-8000-000000000042')).toBe(3);
    });

    it('valide les options (code 4)', async () => {
      expect(await run(runtime, 'rec', 'generate', PROJECT_ID, '-n', '0')).toBe(4);
      expect(await run(runtime, 'rec', 'generate', PROJECT_ID, '--min-score', '2')).toBe(4);
      expect(await run(runtime, 'rec', 'generate', PROJECT_ID, '--dimensions', 'bogus')).toBe(4);
      expect(await run(runtime, 'rec', 'generate', PROJECT_ID, '--dimensions', ' ')).toBe(4);
    });

    it('options --no-rules/--no-statistical respectées', async () => {
      seedAudits();
      await addRule();

      const code = await run(runtime, 'rec', 'generate', PROJECT_ID, '--no-rules', '--json');
      expect(code).toBe(0);
      expect(json<{ rulesApplied: number }>(runtime).rulesApplied).toBe(0);
    });
  });

  // --- list (C16.9) ---
  describe('list', () => {
    it('liste les recommandations persistées (code 0)', async () => {
      seedAudits();
      await addRule();
      await run(runtime, 'rec', 'generate', PROJECT_ID);

      const code = await run(runtime, 'recommend', 'list', PROJECT_ID, '--json');
      expect(code).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBeGreaterThanOrEqual(1);
    });

    it('projet sans génération : message vide (code 0)', async () => {
      seedAudits();
      const code = await run(runtime, 'rec', 'list', PROJECT_ID);
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('Aucune recommandation');
    });

    it('projectId requis (4), UUID invalide (4), projet absent (3)', async () => {
      expect(await run(runtime, 'rec', 'list')).toBe(4);
      expect(await run(runtime, 'rec', 'list', 'pas-uuid')).toBe(4);
      expect(await run(runtime, 'rec', 'list', '00000000-0000-4000-8000-000000000042')).toBe(3);
      expect(await run(runtime, 'rec', 'list', PROJECT_ID, '-n', 'x')).toBe(4);
    });
  });

  it("l'alias rec fonctionne (rules list vide)", async () => {
    const code = await run(runtime, 'rec', 'rules', 'list');
    expect(code).toBe(0);
    expect(runtime.output.stdout).toContain('Aucune règle');
  });
});
