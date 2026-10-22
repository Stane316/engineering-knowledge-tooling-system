import { resolve } from 'node:path';

export type Environment = 'development' | 'test' | 'production';

export interface DatabasePaths {
  main: string;
  fts: string;
  vectors: string;
}

export interface EktsConfig {
  env: Environment;
  logLevel: string;
  dataDir: string;
  db: DatabasePaths;
}

function resolveEnvironment(raw: string | undefined): Environment {
  if (raw === 'production' || raw === 'test') {
    return raw;
  }

  return 'development';
}

/**
 * Construit la configuration à partir de l'environnement.
 *
 * Variables reconnues :
 * - `NODE_ENV`      : development | test | production
 * - `EKTS_DATA_DIR` : répertoire des bases (relatif au CWD ou absolu)
 * - `LOG_LEVEL`     : niveau Pino (trace, debug, info, warn, error, fatal, silent)
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): EktsConfig {
  const dataDir = resolve(env.EKTS_DATA_DIR ?? 'data');

  return {
    env: resolveEnvironment(env.NODE_ENV),
    logLevel: env.LOG_LEVEL ?? 'info',
    dataDir,
    db: {
      main: resolve(dataDir, 'ekts.db'),
      fts: resolve(dataDir, 'ekts-fts.db'),
      vectors: resolve(dataDir, 'ekts-vectors.db'),
    },
  };
}

export const config: EktsConfig = loadConfig();
