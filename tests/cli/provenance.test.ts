/**
 * Provenance — parcours opérateur réel (Sprint 22-01, C-R01/C-R02).
 *
 * Exécution du **binaire compilé** : c'est l'interface que l'opérateur utilise
 * réellement, et la seule qui prouve qu'aucune édition manuelle de SQLite n'est
 * nécessaire. Aucune donnée réelle : les fichiers de provenance sont
 * synthétiques et écrits dans un répertoire temporaire.
 *
 * L'admission au corpus gouverné suit la règle arrêtée le 30/10/2026 :
 * `review.status === "authorized"` **et** `rights.read === "granted"`. Les deux
 * autres axes (`redistribute`, `execute`) sont enregistrés séparément et ne
 * sont jamais déduits de la lecture.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDataDir, removeDataDir } from './helpers.js';

const ROOT = process.cwd();
const CLI = join(ROOT, 'dist', 'cli', 'index.js');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

const SHA256 = 'a3f1c8d9e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0';

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

let dataDir: string;
let provenanceDir: string;

/** Exécute la CLI compilée et renvoie code + sorties. */
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

/** Écrit un fichier de provenance et rend son chemin. */
function provenanceFile(name: string, value: unknown): string {
  const path = join(provenanceDir, `${name}.json`);
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');

  return path;
}

/** Provenance complète, dont les valeurs sont paramétrables. */
function provenance(overrides: {
  read?: string;
  redistribute?: string;
  execute?: string;
  review?: string;
  sensitivity?: string;
}): Record<string, unknown> {
  return {
    source: 'depot://corpus-synthetique/r01.md',
    sourceVersion: 'commit-abc123',
    rights: {
      read: overrides.read ?? 'granted',
      redistribute: overrides.redistribute ?? 'refused',
      execute: overrides.execute ?? 'unknown',
    },
    sensitivity: overrides.sensitivity ?? 'synthetic',
    fingerprint: { sha256: SHA256 },
    review: {
      status: overrides.review ?? 'authorized',
      decidedAt: '2026-10-30T10:00:00.000Z',
      decidedBy: 'operateur-test',
    },
  };
}

interface AddOutput {
  id: string;
  title: string;
  metadata: Record<string, unknown>;
  admission?: { admitted: boolean; reason: string };
}

interface GetOutput extends AddOutput {
  admission: { admitted: boolean; reason: string };
}

describe('CLI — provenance à l’ajout et à la lecture (C-R01)', () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(CLI)).toBe(true);
    dataDir = createDataDir();
    provenanceDir = mkdtempSync(join(tmpdir(), 'ekts-provenance-'));
  });

  afterAll(() => {
    removeDataDir(dataDir);
    removeDataDir(provenanceDir);
  });

  it('enregistre une provenance autorisée et l’annonce admise', () => {
    const file = provenanceFile('admise', provenance({}));
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Ressource gouvernée',
      '--content',
      'Contenu synthétique.',
      '--provenance',
      file,
      '--json',
    );

    expect(added.stderr).toBe('');
    expect(added.status).toBe(0);

    const output = JSON.parse(added.stdout) as AddOutput;

    expect(output.metadata['provenance']).toEqual(provenance({}));
    expect(output.admission?.admitted).toBe(true);
    expect(output.admission?.reason.length).toBeGreaterThan(0);
  });

  it('relit la provenance complète et le statut d’admission par `ekts get`', () => {
    const file = provenanceFile('relue', provenance({ redistribute: 'granted' }));
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Ressource relue',
      '--provenance',
      file,
      '--json',
    );

    expect(added.status).toBe(0);
    const { id } = JSON.parse(added.stdout) as AddOutput;

    const read = cli('get', id, '--json');

    expect(read.status).toBe(0);
    const output = JSON.parse(read.stdout) as GetOutput;

    expect(output.metadata['provenance']).toEqual(provenance({ redistribute: 'granted' }));
    expect(output.admission.admitted).toBe(true);

    const human = cli('get', id);

    expect(human.status).toBe(0);
    expect(human.stdout).toMatch(/provenance/i);
    expect(human.stdout).toMatch(/admise|admis/i);
  });

  it('affiche les trois axes de droits séparément, sans les confondre', () => {
    const file = provenanceFile(
      'axes',
      provenance({ read: 'granted', redistribute: 'refused', execute: 'unknown' }),
    );
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Ressource aux droits distincts',
      '--provenance',
      file,
      '--json',
    );

    expect(added.status).toBe(0);
    const { id } = JSON.parse(added.stdout) as AddOutput;
    const output = JSON.parse(cli('get', id, '--json').stdout) as GetOutput;
    const rights = (output.metadata['provenance'] as { rights: Record<string, string> }).rights;

    expect(rights).toEqual({ read: 'granted', redistribute: 'refused', execute: 'unknown' });
    // La lecture accordée autorise l'admission ; le refus de redistribution
    // reste enregistré sans être interprété comme un refus global.
    expect(output.admission.admitted).toBe(true);
  });
});

describe('CLI — trois décisions de droits (C-R02)', () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(CLI)).toBe(true);
    dataDir = createDataDir();
    provenanceDir = mkdtempSync(join(tmpdir(), 'ekts-provenance-'));
  });

  afterAll(() => {
    removeDataDir(dataDir);
    removeDataDir(provenanceDir);
  });

  it('exclut une ressource dont la lecture est explicitement refusée', () => {
    const file = provenanceFile('refus', provenance({ read: 'refused' }));
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Lecture refusée',
      '--provenance',
      file,
      '--json',
    );

    // La ressource existe — « exclue du corpus gouverné » n'est pas « supprimée ».
    expect(added.status).toBe(0);
    const output = JSON.parse(added.stdout) as AddOutput;

    expect(output.admission?.admitted).toBe(false);
    expect(output.admission?.reason).toMatch(/refus/i);
  });

  it('exclut une ressource dont le droit de lecture reste inconnu', () => {
    const file = provenanceFile('inconnu', provenance({ read: 'unknown' }));
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Droit inconnu',
      '--provenance',
      file,
      '--json',
    );

    expect(added.status).toBe(0);
    const output = JSON.parse(added.stdout) as AddOutput;

    expect(output.admission?.admitted).toBe(false);
    expect(output.admission?.reason).toMatch(/inconnu/i);
  });

  it('exclut une ressource dont la revue n’est pas autorisée', () => {
    const file = provenanceFile('revue', provenance({ review: 'pending' }));
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Revue en attente',
      '--provenance',
      file,
      '--json',
    );

    expect(added.status).toBe(0);
    const output = JSON.parse(added.stdout) as AddOutput;

    expect(output.admission?.admitted).toBe(false);
    expect(output.admission?.reason).toMatch(/revue|autoris/i);
  });

  it('refuse un fichier de provenance invalide sans créer de ressource', () => {
    const file = provenanceFile('invalide', {
      ...provenance({}),
      rights: { read: 'granted' },
    });
    const before = cli('list', '--json');
    const failed = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Ressource invalide',
      '--provenance',
      file,
      '--json',
    );

    expect(failed.status).not.toBe(0);
    // Le refus doit venir du **contenu** de la provenance, pas d'une option
    // inconnue : sans cette garde, l'ancien binaire passait ce cas pour la
    // mauvaise raison (« unknown option '--provenance' » contient le mot).
    expect(failed.stderr).not.toMatch(/unknown option/i);
    expect(failed.stderr).toMatch(/provenance/i);

    const after = cli('list', '--json');
    expect(JSON.parse(after.stdout)).toEqual(JSON.parse(before.stdout));
  });

  it('refuse un fichier de provenance illisible', () => {
    const path = join(provenanceDir, 'illisible.json');
    writeFileSync(path, '{ ceci n’est pas du JSON', 'utf8');

    const failed = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Fichier illisible',
      '--provenance',
      path,
      '--json',
    );

    expect(failed.status).not.toBe(0);
    expect(failed.stderr).not.toMatch(/unknown option/i);
    expect(failed.stderr).toMatch(/provenance|json/i);
  });
});

describe('CLI — ressource historique sans provenance (C-R05)', () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(CLI)).toBe(true);
    dataDir = createDataDir();
    provenanceDir = mkdtempSync(join(tmpdir(), 'ekts-provenance-'));
  });

  afterAll(() => {
    removeDataDir(dataDir);
    removeDataDir(provenanceDir);
  });

  it('reste lisible, affichée comme non admise, sans provenance inventée', () => {
    const added = cli(
      'add',
      '--type',
      'article',
      '--title',
      'Ressource historique',
      '--content',
      'Créée sans provenance, comme avant le sprint 22.',
      '--json',
    );

    expect(added.status).toBe(0);
    const { id } = JSON.parse(added.stdout) as AddOutput;

    const read = cli('get', id, '--json');

    expect(read.status).toBe(0);
    const output = JSON.parse(read.stdout) as GetOutput;

    expect(output.metadata['provenance']).toBeUndefined();
    expect(output.admission.admitted).toBe(false);
    expect(output.admission.reason).toMatch(/absente|inconnue/i);

    const human = cli('get', id);

    expect(human.status).toBe(0);
    expect(human.stdout).toMatch(/historique|provenance/i);
  });
});
