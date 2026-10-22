import { resolve } from 'node:path';

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
    const config = loadConfig({
      EKTS_DATA_DIR: '/tmp/ekts-data',
      LOG_LEVEL: 'debug',
    });

    expect(config.dataDir).toBe('/tmp/ekts-data');
    expect(config.db.main).toBe('/tmp/ekts-data/ekts.db');
    expect(config.logLevel).toBe('debug');
  });

  it('reconnaît les environnements test et production', () => {
    expect(loadConfig({ NODE_ENV: 'test' }).env).toBe('test');
    expect(loadConfig({ NODE_ENV: 'production' }).env).toBe('production');
  });

  it('retombe sur development pour une valeur inconnue', () => {
    expect(loadConfig({ NODE_ENV: 'staging' }).env).toBe('development');
  });
});
