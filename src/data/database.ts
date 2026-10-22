import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

import { config } from '../shared/config.js';
import { FTS_SCHEMA, VECTOR_SCHEMA } from '../shared/constants.js';
import { runMigrations } from './migrations/index.js';

/** Chemins absolus des trois fichiers SQLite. */
export interface DatabasePaths {
  dataDir: string;
  main: string;
  fts: string;
  vectors: string;
}

export interface OpenDatabaseOptions {
  /** Répertoire des bases ; par défaut `EKTS_DATA_DIR` ou `./data`. */
  dataDir?: string;
  /** Exécute les migrations à l'ouverture (défaut : `true`). */
  migrate?: boolean;
  /** Charge l'extension `sqlite-vec` (défaut : `true`). */
  loadVectors?: boolean;
}

/** Poignée de connexion : une seule connexion, trois schémas (`main`, `fts`, `vectors`). */
export interface EktsDatabase {
  readonly connection: Database.Database;
  readonly paths: DatabasePaths;
  close(): void;
}

const DATABASE_FILES = {
  main: 'ekts.db',
  fts: 'ekts-fts.db',
  vectors: 'ekts-vectors.db',
} as const;

/** Résout les chemins des trois bases sans toucher au disque. */
export function resolveDatabasePaths(dataDir: string = config.dataDir): DatabasePaths {
  const absolute = resolve(dataDir);

  return {
    dataDir: absolute,
    main: join(absolute, DATABASE_FILES.main),
    fts: join(absolute, DATABASE_FILES.fts),
    vectors: join(absolute, DATABASE_FILES.vectors),
  };
}

/** Échappe une valeur pour un littéral SQL entre quotes simples. */
function quoteSqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/**
 * Applique les PRAGMA de performance et de sûreté.
 * `schema` cible une base attachée (`fts`, `vectors`).
 */
export function applyPragmas(connection: Database.Database, schema?: string): void {
  const prefix = schema ? `${schema}.` : '';

  connection.pragma(`${prefix}journal_mode = WAL`);
  connection.pragma(`${prefix}synchronous = NORMAL`);

  if (!schema) {
    connection.pragma('foreign_keys = ON');
    connection.pragma('busy_timeout = 5000');
    connection.pragma('cache_size = -64000'); // 64 Mo
    connection.pragma('temp_store = MEMORY');
  }
}

function attachDatabase(connection: Database.Database, schema: string, filePath: string): void {
  connection.exec(`ATTACH DATABASE ${quoteSqlLiteral(filePath)} AS ${schema}`);
  applyPragmas(connection, schema);
}

/**
 * Restreint les permissions des fichiers de base à `600` (lecture/écriture du propriétaire).
 * Sans effet sur Windows, où le modèle POSIX ne s'applique pas.
 */
export function secureDatabaseFiles(paths: DatabasePaths): void {
  if (process.platform === 'win32') {
    return;
  }

  const candidates = [
    paths.main,
    `${paths.main}-wal`,
    `${paths.main}-shm`,
    paths.fts,
    `${paths.fts}-wal`,
    `${paths.fts}-shm`,
    paths.vectors,
    `${paths.vectors}-wal`,
    `${paths.vectors}-shm`,
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      chmodSync(file, 0o600);
    }
  }
}

/**
 * Ouvre les trois bases sur **une seule connexion** :
 * - `main`   : `ekts.db` (données structurées)
 * - `fts`    : `ekts-fts.db` (index plein texte FTS5)
 * - `vectors`: `ekts-vectors.db` (index vectoriel `sqlite-vec`)
 *
 * Les deux dernières sont attachées à la connexion principale afin qu'un même
 * `db.transaction()` puisse écrire dans les trois fichiers.
 */
export function openDatabase(options: OpenDatabaseOptions = {}): EktsDatabase {
  const paths = resolveDatabasePaths(options.dataDir);
  mkdirSync(paths.dataDir, { recursive: true, mode: 0o700 });

  const connection = new Database(paths.main);

  try {
    applyPragmas(connection);
    attachDatabase(connection, FTS_SCHEMA, paths.fts);
    attachDatabase(connection, VECTOR_SCHEMA, paths.vectors);

    if (options.loadVectors !== false) {
      sqliteVec.load(connection);
    }

    if (options.migrate !== false) {
      runMigrations(connection);
    }

    secureDatabaseFiles(paths);
  } catch (error) {
    connection.close();
    throw error;
  }

  return {
    connection,
    paths,
    close(): void {
      connection.close();
    },
  };
}
