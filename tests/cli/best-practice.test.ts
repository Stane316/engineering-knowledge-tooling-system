import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runCli } from '../../src/cli/program.js';
import { openDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import type { AnalysisReport } from '../../src/analysis/types.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

const DIMENSIONS = ['performance', 'accessibility', 'seo', 'ux', 'content'] as const;

/** Rapport homogène pour les fixtures d'audit. */
function makeReport(score: number, timestamp: string): AnalysisReport {
  return {
    url: 'https://example.com',
    timestamp,
    dimensions: Object.fromEntries(
      DIMENSIONS.map((name) => [
        name,
        { dimension: name, score, findings: [], summary: `${name} ${score}` },
      ]),
    ) as unknown as AnalysisReport['dimensions'],
    findings: [],
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      overallScore: score,
    },
  };
}

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

describe('CLI ekts bestpractice (Sprint 15-03, C15.7→C15.10)', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  /** Crée une pratique via la CLI et retourne son ID. */
  async function add(
    title: string,
    description: string,
    category: string,
    tags?: string,
  ): Promise<string> {
    const code = await run(
      runtime,
      'bestpractice',
      'add',
      '--title',
      title,
      '--description',
      description,
      '--category',
      category,
      ...(tags === undefined ? [] : ['--tags', tags]),
      '--json',
    );
    expect(code).toBe(0);
    return json<{ id: string }>(runtime).id;
  }

  // --- C15.9 : add ---
  describe('add', () => {
    it('crée une pratique manuelle et retourne son id (code 0)', async () => {
      const id = await add(
        'Toujours lazy-loader les images',
        'Utiliser loading=lazy hors viewport',
        'performance',
        'images, lazy',
      );
      expect(id).toMatch(/^[0-9a-f-]{36}$/iu);

      const payload = json<{ isManual: boolean; tags: string[]; category: string }>(runtime);
      expect(payload.isManual).toBe(true);
      expect(payload.tags).toEqual(['images', 'lazy']);
      expect(payload.category).toBe('performance');
    });

    it('rejoue les entrées invalides (code 4) et l usage (code 2)', async () => {
      expect(
        await run(
          runtime,
          'bp',
          'add',
          '--title',
          'ok',
          '--description',
          'assez long',
          '--category',
          'bogus',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'bp',
          'add',
          '--title',
          'ab',
          '--description',
          'assez long ici',
          '--category',
          'seo',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'bp',
          'add',
          '--title',
          'assez long',
          '--description',
          'court',
          '--category',
          'seo',
        ),
      ).toBe(4);
      expect(await run(runtime, 'bp', 'add', '--title', 'sans le reste')).toBe(2);
    });
  });

  // --- C15.7 : list ---
  describe('list', () => {
    it('liste les pratiques avec compte total (code 0)', async () => {
      await add('Optimiser les images WebP', 'Convertir PNG/JPEG en WebP', 'performance', 'webp');
      await add('Méta description unique', 'Une méta description par page', 'seo');

      const code = await run(runtime, 'bestpractice', 'list', '--json');
      expect(code).toBe(0);
      const payload = json<{ count: number; total: number }>(runtime);
      expect(payload.count).toBe(2);
      expect(payload.total).toBe(2);
    });

    it('affiche un message vide sans pratique (code 0, non bloquant)', async () => {
      const code = await run(runtime, 'bestpractice', 'list');
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('Aucune bonne pratique');
    });

    it('filtre par catégorie, tag et type', async () => {
      await add('Pratique A', 'Description suffisante', 'performance', 'webp');
      await add('Pratique B', 'Description suffisante', 'seo', 'meta');

      const byCategory = await run(runtime, 'bestpractice', 'list', '-c', 'seo', '--json');
      expect(json<{ count: number }>(runtime).count).toBe(1);
      const byTag = await run(runtime, 'bestpractice', 'list', '-t', 'webp', '--json');
      expect(json<{ count: number }>(runtime).count).toBe(1);
      const manual = await run(runtime, 'bestpractice', 'list', '--manual', '--json');
      expect(json<{ count: number }>(runtime).count).toBe(2);
      expect(byCategory).toBe(0);
      expect(byTag).toBe(0);
      expect(manual).toBe(0);
    });

    it('valide options (code 4) : catégorie, tri, limite, projet, exclusivité', async () => {
      expect(await run(runtime, 'bestpractice', 'list', '-c', 'bogus')).toBe(4);
      expect(await run(runtime, 'bestpractice', 'list', '--sort', 'champ')).toBe(4);
      expect(await run(runtime, 'bestpractice', 'list', '-l', '0')).toBe(4);
      expect(await run(runtime, 'bestpractice', 'list', '-p', 'pas-uuid')).toBe(4);
      expect(await run(runtime, 'bestpractice', 'list', '--manual', '--auto')).toBe(4);
    });
  });

  // --- C15.8 : search ---
  describe('search', () => {
    beforeEach(async () => {
      await add(
        'Optimiser les images WebP',
        'Convertir les images en WebP',
        'performance',
        'images',
      );
      await add(
        'Ajouter les attributs alt',
        'Chaque image doit avoir un alt',
        'accessibility',
        'images',
      );
    });

    it('recherche par texte avec score (code 0)', async () => {
      const code = await run(runtime, 'bestpractice', 'search', 'images', '--json');
      expect(code).toBe(0);
      const payload = json<{
        count: number;
        results: Array<{ score: number; matchType: string }>;
      }>(runtime);
      expect(payload.count).toBeGreaterThanOrEqual(2);
      expect(payload.results[0]?.matchType).toBe('fts');
      expect(payload.results[0]?.score).toBeGreaterThan(0);
    });

    it('affiche le bloc humain avec pourcentages', async () => {
      const code = await run(runtime, 'bestpractice', 'search', 'WebP');
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('résultat(s)');
      expect(runtime.output.stdout).toContain('%]');
    });

    it('sans résultat : message et code 0', async () => {
      const code = await run(runtime, 'bestpractice', 'search', 'xyznonexistent');
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('Aucun résultat');
    });

    it('valide limit et catégorie (code 4)', async () => {
      expect(await run(runtime, 'bestpractice', 'search', 'images', '-l', 'x')).toBe(4);
      expect(await run(runtime, 'bestpractice', 'search', 'images', '-c', 'bogus')).toBe(4);
    });
  });

  // --- C15.10 : show ---
  describe('show', () => {
    it('affiche le détail complet d une pratique', async () => {
      const id = await add('Pratique à afficher', 'Description complète ici', 'general', 't1,t2');

      const code = await run(runtime, 'bestpractice', 'show', id, '--json');
      expect(code).toBe(0);
      const payload = json<{ practice: { title: string }; linkedFindings: unknown[] }>(runtime);
      expect(payload.practice.title).toBe('Pratique à afficher');
      expect(payload.linkedFindings).toEqual([]);

      const human = await run(runtime, 'bestpractice', 'show', id);
      expect(human).toBe(0);
      expect(runtime.output.stdout).toContain('Description complète ici');
      expect(runtime.output.stdout).toContain('Tags : t1, t2');
    });

    it('id absent (code 3) et id mal formé (code 4)', async () => {
      expect(
        await run(runtime, 'bestpractice', 'show', '00000000-0000-4000-8000-000000000000'),
      ).toBe(3);
      expect(await run(runtime, 'bestpractice', 'show', 'pas-uuid')).toBe(4);
    });
  });

  // --- delete ---
  describe('delete', () => {
    it('refuse sans --yes (code 1) puis supprime avec --yes (code 0)', async () => {
      const id = await add('À supprimer', 'Description suffisante', 'general');

      expect(await run(runtime, 'bestpractice', 'delete', id)).toBe(1);
      expect(await run(runtime, 'bestpractice', 'delete', id, '--yes')).toBe(0);

      const code = await run(runtime, 'bestpractice', 'show', id);
      expect(code).toBe(3);
    });

    it('id absent (code 3) et id mal formé (code 4)', async () => {
      expect(
        await run(
          runtime,
          'bestpractice',
          'delete',
          '00000000-0000-4000-8000-000000000000',
          '--yes',
        ),
      ).toBe(3);
      expect(await run(runtime, 'bestpractice', 'delete', 'abc', '--yes')).toBe(4);
    });
  });

  // --- extract ---
  describe('extract', () => {
    /** Projets + audits seedés dans les bases du runtime. */
    function seedAudits(series: readonly number[], projectId?: string): string {
      const database = openDatabase({ dataDir });
      try {
        new AuditSchema(database.connection).createSchema();
        const project =
          projectId === undefined
            ? new ProjectRepository(database.connection).create({ name: 'Site extraction' })
            : new ProjectRepository(database.connection).getById(projectId);
        if (project === null) {
          throw new Error('projet de fixture introuvable');
        }
        const repository = new AuditRepository(database.connection);
        const base = Date.parse('2026-10-01T12:00:00.000Z');
        series.forEach((score, index) => {
          repository.store(makeReport(score, new Date(base + index * 86_400_000).toISOString()), {
            projectId: project.id,
          });
        });
        return project.id;
      } finally {
        database.close();
      }
    }

    it('projet inexistant (code 3)', async () => {
      const code = await run(
        runtime,
        'bestpractice',
        'extract',
        '00000000-0000-4000-8000-000000000000',
      );
      expect(code).toBe(3);
    });

    it('projet sans audit : rapport vide non bloquant (code 0)', async () => {
      const database = openDatabase({ dataDir });
      const project = new ProjectRepository(database.connection).create({ name: 'Vide' });
      database.close();

      const code = await run(runtime, 'bestpractice', 'extract', project.id, '--json');
      expect(code).toBe(0);
      expect(json<{ auditsAnalyzed: number; practicesExtracted: number }>(runtime)).toMatchObject({
        auditsAnalyzed: 0,
        practicesExtracted: 0,
      });
    });

    it('extrait depuis les audits d un projet (rapport + code 0)', async () => {
      const projectId = seedAudits([70, 75, 85]);

      const code = await run(runtime, 'bestpractice', 'extract', projectId, '--json');
      expect(code).toBe(0);
      const report = json<{ auditsAnalyzed: number; durationMs: number }>(runtime);
      expect(report.auditsAnalyzed).toBe(3);
      expect(report.durationMs).toBeLessThan(5000);
    });

    it('valide les critères (code 4)', async () => {
      expect(
        await run(
          runtime,
          'bestpractice',
          'extract',
          '00000000-0000-4000-8000-000000000000',
          '--min-audits',
          '0',
        ),
      ).toBe(4);
      expect(
        await run(
          runtime,
          'bestpractice',
          'extract',
          '00000000-0000-4000-8000-000000000000',
          '--min-confidence',
          '2',
        ),
      ).toBe(4);
    });
  });

  it("l'alias bp fonctionne (list vide)", async () => {
    const code = await run(runtime, 'bp', 'list');
    expect(code).toBe(0);
    expect(runtime.output.stdout).toContain('Aucune bonne pratique');
  });
});
