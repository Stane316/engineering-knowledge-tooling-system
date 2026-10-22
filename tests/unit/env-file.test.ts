import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadEnvFile } from '../../src/shared/env-file.js';

/**
 * `process.loadEnvFile` écrit dans `process.env` global : les tests sauvegardent
 * et restaurent les variables touchées pour ne pas contaminer les autres
 * fichiers de test exécutés en parallèle dans le même worker.
 */
describe('loadEnvFile', () => {
  let directory: string;
  const touched = ['EKTS_TEST_VARIABLE', 'EKTS_TEST_SECOND'];

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'ekts-envfile-'));

    for (const name of touched) {
      delete process.env[name];
    }
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });

    for (const name of touched) {
      delete process.env[name];
    }
  });

  it('charge un fichier existant dans process.env', () => {
    const file = join(directory, '.env');
    writeFileSync(
      file,
      'EKTS_TEST_VARIABLE=chargee\n# commentaire\nEKTS_TEST_SECOND="deux"\n',
      'utf8',
    );

    expect(loadEnvFile(file)).toBe(true);
    expect(process.env.EKTS_TEST_VARIABLE).toBe('chargee');
    expect(process.env.EKTS_TEST_SECOND).toBe('deux');
  });

  it('renvoie false quand le fichier est absent', () => {
    expect(loadEnvFile(join(directory, 'absent.env'))).toBe(false);
  });

  it('ignore les lignes malformées sans interrompre le chargement', () => {
    const file = join(directory, 'invalide.env');
    writeFileSync(file, 'CLE_SANS_EGAL\nEKTS_TEST_VARIABLE=valide\n', 'utf8');

    // `process.loadEnvFile` saute la ligne invalide : les clés valides du même
    // fichier restent exploitables, ce qui évite de bloquer le démarrage pour
    // une ligne de commentaire mal recopiée.
    expect(() => loadEnvFile(file)).not.toThrow();
    expect(loadEnvFile(file)).toBe(true);
    expect(process.env.EKTS_TEST_VARIABLE).toBe('valide');
  });

  it('renvoie false si la plateforme ne fournit pas loadEnvFile', () => {
    const file = join(directory, '.env');
    writeFileSync(file, 'EKTS_TEST_VARIABLE=ignoree\n', 'utf8');

    const original = process.loadEnvFile;
    // Node < 20.12 ne fournit pas cette fonction.
    Object.defineProperty(process, 'loadEnvFile', { value: undefined, configurable: true });

    try {
      expect(loadEnvFile(file)).toBe(false);
      expect(process.env.EKTS_TEST_VARIABLE).toBeUndefined();
    } finally {
      Object.defineProperty(process, 'loadEnvFile', { value: original, configurable: true });
    }
  });

  it('renvoie false si le chargement échoue', () => {
    const file = join(directory, '.env');
    writeFileSync(file, 'EKTS_TEST_VARIABLE=x\n', 'utf8');

    const original = process.loadEnvFile;
    Object.defineProperty(process, 'loadEnvFile', {
      value: () => {
        throw new Error('illisible');
      },
      configurable: true,
    });

    try {
      expect(loadEnvFile(file)).toBe(false);
    } finally {
      Object.defineProperty(process, 'loadEnvFile', { value: original, configurable: true });
    }
  });

  it('utilise .env du répertoire courant par défaut', () => {
    const file = join(directory, '.env');
    writeFileSync(file, 'EKTS_TEST_VARIABLE=defaut\n', 'utf8');

    const previous = process.cwd();
    process.chdir(directory);

    try {
      expect(loadEnvFile()).toBe(true);
      expect(process.env.EKTS_TEST_VARIABLE).toBe('defaut');
    } finally {
      process.chdir(previous);
    }
  });
});
