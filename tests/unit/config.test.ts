import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/shared/config.js';

describe('loadConfig', () => {
  it('applique les valeurs par défaut', () => {
    const config = loadConfig({});

    expect(config.env).toBe('development');
    expect(config.logLevel).toBe('info');
    expect(config.dataDir).toBe(resolve('data'));
    expect(config.db.main).toBe(resolve('data', 'ekts.db'));
    expect(config.db.fts).toBe(resolve('data', 'ekts-fts.db'));
    expect(config.db.vectors).toBe(resolve('data', 'ekts-vectors.db'));
  });

  it('respecte EKTS_DATA_DIR et LOG_LEVEL', () => {
    // Chemin fourni par l'OS : le test doit passer sous Windows comme sous Linux/macOS.
    const customDir = join(tmpdir(), 'ekts-data');
    const expectedDir = resolve(customDir);

    const config = loadConfig({
      EKTS_DATA_DIR: customDir,
      LOG_LEVEL: 'debug',
    });

    expect(config.dataDir).toBe(expectedDir);
    expect(config.db.main).toBe(join(expectedDir, 'ekts.db'));
    expect(config.db.fts).toBe(join(expectedDir, 'ekts-fts.db'));
    expect(config.db.vectors).toBe(join(expectedDir, 'ekts-vectors.db'));
    expect(config.logLevel).toBe('debug');
  });

  it('résout un chemin relatif depuis le répertoire courant', () => {
    const config = loadConfig({ EKTS_DATA_DIR: 'donnees-locales' });

    expect(config.dataDir).toBe(resolve('donnees-locales'));
    expect(config.db.main).toBe(resolve('donnees-locales', 'ekts.db'));
  });

  it('reconnaît les environnements test et production', () => {
    expect(loadConfig({ NODE_ENV: 'test' }).env).toBe('test');
    expect(loadConfig({ NODE_ENV: 'production' }).env).toBe('production');
  });

  it('retombe sur development pour une valeur inconnue', () => {
    expect(loadConfig({ NODE_ENV: 'staging' }).env).toBe('development');
  });
});
