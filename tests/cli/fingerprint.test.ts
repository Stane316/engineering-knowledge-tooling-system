/**
 * Empreinte vue par l'opérateur (Sprint 22-02, C-R04).
 *
 * Le critère demande de « qualifier la version non reconstructible » quand la
 * copie manque : une empreinte sans contenu conservé ne prouve rien. Ce cas
 * vérifie que l'information est **visible** dans le parcours réellement livré,
 * et non seulement dans le module.
 *
 * Aucun contenu réel : les textes sont synthétiques et les bases temporaires.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDataDir, removeDataDir } from './helpers.js';

const ROOT = process.cwd();
const CLI = join(ROOT, 'dist', 'cli', 'index.js');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

const CONTENT = 'Contenu de référence conservé en base.\n';

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

let dataDir: string;
let provenanceDir: string;

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

function provenanceFile(name: string, fingerprint: { sha256: string } | null): string {
  const path = join(provenanceDir, `${name}.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        source: 'test://fingerprint',
        sourceVersion: null,
        rights: { read: 'granted', redistribute: 'unknown', execute: 'unknown' },
        sensitivity: 'synthetic',
        fingerprint,
        review: { status: 'authorized', decidedAt: null, decidedBy: null },
      },
      null,
      2,
    ),
    'utf8',
  );

  return path;
}

interface GetOutput {
  id: string;
  content?: string;
  verification: 'verified' | 'mismatch' | 'unverifiable' | 'absent';
}

describe('CLI — état de vérification de l’empreinte (C-R03/C-R04)', () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(CLI)).toBe(true);
    dataDir = createDataDir();
    provenanceDir = mkdtempSync(join(tmpdir(), 'ekts-fingerprint-'));
  });

  afterAll(() => {
    removeDataDir(dataDir);
    removeDataDir(provenanceDir);
  });

  it('déclare « verified » une empreinte qui décrit le contenu conservé', () => {
    const sha = createHash('sha256').update(Buffer.from(CONTENT, 'utf8')).digest('hex');
    const added = cli(
      'add',
      '--type',
      'other',
      '--title',
      'Empreinte vérifiée',
      '--content',
      CONTENT,
      '--provenance',
      provenanceFile('verifiee', { sha256: sha }),
      '--json',
    );

    expect(added.status).toBe(0);
    const { id } = JSON.parse(added.stdout) as { id: string };
    const output = JSON.parse(cli('get', id, '--json').stdout) as GetOutput;

    expect(output.verification).toBe('verified');
    expect(output.content).toBe(CONTENT);
  });

  it('qualifie « unverifiable » une empreinte sans copie (version non reconstructible)', () => {
    // Empreinte déclarée, aucun contenu : rien ne permet de la vérifier.
    const added = cli(
      'add',
      '--type',
      'other',
      '--title',
      'Sans copie',
      '--provenance',
      provenanceFile('sans-copie', { sha256: 'a'.repeat(64) }),
      '--json',
    );

    expect(added.status).toBe(0);
    const { id } = JSON.parse(added.stdout) as { id: string };

    const output = JSON.parse(cli('get', id, '--json').stdout) as GetOutput;
    expect(output.verification).toBe('unverifiable');

    const human = cli('get', id);
    expect(human.status).toBe(0);
    expect(human.stdout).toMatch(/non reconstructible/i);
  });

  it('déclare « absent » une ressource sans empreinte', () => {
    const added = cli(
      'add',
      '--type',
      'other',
      '--title',
      'Sans empreinte',
      '--content',
      'Texte libre.',
      '--provenance',
      provenanceFile('sans-empreinte', null),
      '--json',
    );

    expect(added.status).toBe(0);
    const { id } = JSON.parse(added.stdout) as { id: string };
    const output = JSON.parse(cli('get', id, '--json').stdout) as GetOutput;

    expect(output.verification).toBe('absent');
  });

  it('refuse un ajout dont l’empreinte ne décrit pas le contenu (code 4)', () => {
    const added = cli(
      'add',
      '--type',
      'other',
      '--title',
      'Empreinte fausse',
      '--content',
      'Un autre contenu.',
      '--provenance',
      provenanceFile('fausse', { sha256: 'b'.repeat(64) }),
      '--json',
    );

    expect(added.status).toBe(4);
    expect(added.stderr).toMatch(/empreinte/i);
  });
});
