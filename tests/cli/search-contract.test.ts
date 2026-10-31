/**
 * Statuts de recherche vus par l'opérateur (Sprint 22-03, C-R07 et C-R08).
 *
 * Les tests d'intégration vérifient les classes d'erreur ; celui-ci vérifie ce
 * que l'interface effectivement livrée en fait : le code de sortie et le
 * message. Un échec ne doit jamais sortir en succès avec « Aucun résultat ».
 *
 * Codes de sortie du contrat : 3 = ressource inconnue, 4 = validation,
 * 1 = autre erreur, 2 = usage (Commander), 0 = succès.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDataDir, removeDataDir } from './helpers.js';

const ROOT = process.cwd();
const CLI = join(ROOT, 'dist', 'cli', 'index.js');

const UUID_INCONNU = '00000000-0000-4000-8000-000000000000';
const CONTENT = 'Le blog du projet décrit le cadrage synthétique.';

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

let dataDir: string;

function cli(...args: string[]): RunResult {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
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

beforeEach(() => {
  dataDir = createDataDir();

  expect(cli('init').status).toBe(0);
  expect(
    cli('add', '--type', 'article', '--title', 'Note de cadrage', '--content', CONTENT).status,
  ).toBe(0);
});

afterEach(() => {
  removeDataDir(dataDir);
});

describe('C-R07 — une erreur n’est jamais un « Aucun résultat »', () => {
  it('refuse une requête vide en code 4, sans message de zéro résultat', () => {
    const run = cli('search', '   ', '--mode', 'fts');

    expect(run.status).toBe(4);
    expect(run.stderr).toMatch(/requête/i);
    expect(run.stderr).not.toMatch(/aucun résultat/i);
    expect(run.stderr).not.toMatch(/unknown option/i);
  });

  it('accepte une requête sans correspondance en code 0 (succès vide)', () => {
    const run = cli('search', 'licornequartz', '--mode', 'fts', '--json');

    expect(run.status).toBe(0);

    const output = JSON.parse(run.stdout) as { count: number; mode: string; results: unknown[] };

    expect(output.count).toBe(0);
    expect(output.mode).toBe('fts');
    expect(output.results).toEqual([]);
  });

  it('distingue un identifiant absent par le code 3', () => {
    const run = cli('get', UUID_INCONNU);

    expect(run.status).toBe(3);
    expect(run.stderr).toMatch(/introuvable/i);
  });

  it('échoue en code 1 quand l’index est inaccessible', () => {
    const corrupted = cli('status');
    expect(corrupted.status).toBe(0);

    writeFileSync(join(dataDir, 'ekts-fts.db'), 'index corrompu');

    const run = cli('search', 'blog', '--mode', 'fts');

    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/not a database|malformed|index/i);
    expect(run.stdout).not.toMatch(/aucun résultat/i);
    expect(run.stderr).not.toMatch(/unknown option/i);
  });
});

describe('C-R08 — erreur hybride puis FTS explicite', () => {
  it('expose l’erreur hybride en code 1, sans repli caché', () => {
    const run = cli('search', 'blog', '--mode', 'hybrid');

    expect(run.status).toBe(1);
    // `EKTS_OFFLINE=1` est le mode hermétique des tests : l'absence de
    // fournisseur y est encore plus explicite et aucune requête réseau n'est
    // possible. Ce qui est mesuré est le contrat : erreur explicite, pas de
    // résultat fabriqué sous une étiquette hybride.
    expect(run.stderr).toMatch(/embeddings|fournisseur/i);
    expect(run.stderr).toMatch(/hors ligne|offline|aucun fournisseur/i);
    expect(run.stdout).not.toMatch(/résultat/i);
  });

  it('sert un FTS étiqueté après un second appel explicite', () => {
    const hybrid = cli('search', 'blog', '--mode', 'hybrid');
    expect(hybrid.status).toBe(1);

    const fts = cli('search', 'blog', '--mode', 'fts', '--json');
    expect(fts.status).toBe(0);

    const output = JSON.parse(fts.stdout) as {
      mode: string;
      count: number;
      results: { source: string; resource: { title: string } }[];
    };

    expect(output.mode).toBe('fts');
    expect(output.count).toBe(1);
    expect(output.results[0]?.source).toBe('fts');
    expect(output.results[0]?.resource.title).toBe('Note de cadrage');
  });
});
