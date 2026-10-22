import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createDataDir, removeDataDir } from './helpers.js';

/**
 * Tests d'intégration : exécution réelle du binaire compilé (`dist/cli/index.js`).
 *
 * `dist` est reconstruit s'il est absent (ex. `npm test` seul), puis réutilisé
 * tel quel : `npm run verify` compile déjà avant la couverture.
 */

// Chaque test lance un processus Node complet : sous Windows, le démarrage
// d'un processus et la compilation conditionnelle de `dist` dépassent le délai
// par défaut de 5 s (CI windows-latest, Node 22).
vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

const ROOT = process.cwd();
const CLI = join(ROOT, 'dist', 'cli', 'index.js');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

let dataDir: string;

/** Exécute la CLI compilée et renvoie code + sorties. */
function cli(...args: string[]): RunResult {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
      // `EKTS_OFFLINE` rend le test déterministe et gratuit : sans lui, une clé
      // présente dans le `.env` du poste déclencherait un appel réel (et un
      // échec si le compte n'a plus de crédits).
      env: { ...process.env, EKTS_DATA_DIR: dataDir, EKTS_OFFLINE: '1' },
    });

    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };

    return {
      status: failure.status ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    };
  }
}

/** Ouvre une base SQLite compilée pour préparer un scénario. */
function scalar(relativeFile: string, sql: string): unknown {
  const script = [
    "const Database = require('better-sqlite3');",
    `const db = new Database(${JSON.stringify(join(dataDir, relativeFile))}, { readonly: true });`,
    `process.stdout.write(String(db.prepare(${JSON.stringify(sql)}).pluck().get()));`,
    'db.close();',
  ].join('\n');

  return execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
}

describe('CLI compilée (intégration)', () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(CLI)).toBe(true);
    dataDir = createDataDir();
  });

  afterAll(() => {
    removeDataDir(dataDir);
  });

  it('affiche l’aide', () => {
    const result = cli('--help');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage: ekts');
  });

  it('initialise les bases', () => {
    const result = cli('init');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Bases créées.');
    expect(existsSync(join(dataDir, 'ekts.db'))).toBe(true);
    expect(existsSync(join(dataDir, 'ekts-fts.db'))).toBe(true);
    expect(existsSync(join(dataDir, 'ekts-vectors.db'))).toBe(true);
  });

  it('ajoute, lit et liste une ressource', () => {
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'SQLite en pratique',
      '--tags',
      'sqlite',
      '--content',
      'SQLite est une base légère.',
      '--json',
    );

    expect(added.status).toBe(0);

    const resource = JSON.parse(added.stdout) as { id: string; vectorIndexed: boolean };

    // Hors ligne : la ressource est créée et indexée en plein texte seulement.
    expect(resource.vectorIndexed).toBe(false);

    const read = cli('get', resource.id, '--json');

    expect(read.status).toBe(0);
    expect((JSON.parse(read.stdout) as { id: string }).id).toBe(resource.id);

    const list = cli('list', '--json');

    expect(list.status).toBe(0);
    expect((JSON.parse(list.stdout) as { count: number }).count).toBe(1);
  });

  it('cherche en plein texte sans clé OpenAI', () => {
    const result = cli('search', 'sqlite', '--mode', 'fts');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('SQLite en pratique');
  });

  it('décrit l’état du système', () => {
    const result = cli('status', '--json');

    expect(result.status).toBe(0);

    const status = JSON.parse(result.stdout) as {
      databases: { exists: boolean }[];
      resources: { total: number };
    };

    expect(status.databases.every((database) => database.exists)).toBe(true);
    expect(status.resources.total).toBe(1);
  });

  it('renvoie 3 pour une ressource inconnue', () => {
    const result = cli('get', '00000000-0000-4000-8000-000000000000');

    expect(result.status).toBe(3);
    expect(result.stderr).toContain('Ressource introuvable');
  });

  it('supprime avec --yes puis confirme l’absence', () => {
    const list = cli('list', '--json');
    const resource = (JSON.parse(list.stdout) as { resources: { id: string }[] }).resources[0];

    expect(resource).toBeDefined();

    const id = resource?.id as string;
    const deleted = cli('delete', id, '--yes', '--json');

    expect(deleted.status).toBe(0);
    expect(JSON.parse(deleted.stdout)).toEqual({ deleted: true, cancelled: false, id });
    expect(cli('list').stdout).toContain('Aucune ressource.');
    expect(cli('delete', id, '--yes').status).toBe(3);
  });

  it('persiste les données dans les trois bases', () => {
    expect(readFileSync(join(dataDir, 'ekts.db')).byteLength).toBeGreaterThan(0);
    expect(Number(scalar('ekts.db', 'PRAGMA user_version'))).toBe(2);
  });
});
