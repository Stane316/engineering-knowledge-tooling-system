import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  openDatabase,
  resolveDatabasePaths,
  secureDatabaseFiles,
} from '../../src/data/database.js';
import { migrations, runMigrations } from '../../src/data/migrations/index.js';

const isWindows = process.platform === 'win32';

function tableNames(connection: ReturnType<typeof openDatabase>['connection'], schema?: string) {
  const prefix = schema ? `${schema}.` : '';

  return connection
    .prepare(`SELECT name FROM ${prefix}sqlite_master WHERE type = 'table'`)
    .all()
    .map((row) => (row as { name: string }).name);
}

describe('Data Layer — ouverture des bases', () => {
  let dataDir: string;
  let database: ReturnType<typeof openDatabase> | undefined;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-db-'));
  });

  afterEach(() => {
    database?.close();
    database = undefined;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('crée les trois fichiers de base', () => {
    database = openDatabase({ dataDir });
    const { paths } = database;

    expect(existsSync(paths.main)).toBe(true);
    expect(existsSync(paths.fts)).toBe(true);
    expect(existsSync(paths.vectors)).toBe(true);
    expect(paths.main.endsWith('ekts.db')).toBe(true);
    expect(paths.fts.endsWith('ekts-fts.db')).toBe(true);
    expect(paths.vectors.endsWith('ekts-vectors.db')).toBe(true);
  });

  it('active le mode WAL sur les trois bases', () => {
    database = openDatabase({ dataDir });
    const { connection } = database;

    expect(connection.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(connection.pragma('fts.journal_mode', { simple: true })).toBe('wal');
    expect(connection.pragma('vectors.journal_mode', { simple: true })).toBe('wal');
  });

  it('active les clés étrangères et les PRAGMA de performance', () => {
    database = openDatabase({ dataDir });
    const { connection } = database;

    expect(connection.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(connection.pragma('synchronous', { simple: true })).toBe(1);
    expect(connection.pragma('busy_timeout', { simple: true })).toBe(5000);
  });

  it('crée les tables structurées et leurs index', () => {
    database = openDatabase({ dataDir });
    const tables = tableNames(database.connection);

    expect(tables).toEqual(expect.arrayContaining(['resources', 'projects', 'audits']));

    const indexes = database.connection
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(indexes).toEqual(
      expect.arrayContaining([
        'idx_resources_type',
        'idx_resources_created_at',
        'idx_projects_status',
        'idx_audits_url',
        'idx_audits_created_at',
      ]),
    );
  });

  it('crée la table virtuelle FTS5', () => {
    database = openDatabase({ dataDir });
    const { connection } = database;

    expect(tableNames(connection, 'fts')).toContain('resources_fts');

    const definition = connection
      .prepare("SELECT sql FROM fts.sqlite_master WHERE name = 'resources_fts'")
      .get() as { sql: string };

    expect(definition.sql).toContain('VIRTUAL TABLE');
    expect(definition.sql).toContain('fts5');
    expect(definition.sql).toContain('porter unicode61');
  });

  it('crée la table virtuelle vectorielle et charge sqlite-vec', () => {
    database = openDatabase({ dataDir });
    const { connection } = database;

    expect(tableNames(connection, 'vectors')).toContain('resources_vectors');

    const version = connection.prepare('SELECT vec_version() AS version').get() as {
      version: string;
    };
    expect(version.version).toMatch(/^v\d+\.\d+\.\d+/);

    const definition = connection
      .prepare("SELECT sql FROM vectors.sqlite_master WHERE name = 'resources_vectors'")
      .get() as { sql: string };

    expect(definition.sql).toContain('float[1536]');
  });

  it('accepte et interroge un vecteur de dimension 1536', () => {
    database = openDatabase({ dataDir });
    const { connection } = database;
    const embedding = JSON.stringify(new Array(1536).fill(0.01));

    connection
      .prepare('INSERT INTO vectors.resources_vectors (resource_id, embedding) VALUES (?, ?)')
      .run('resource-1', embedding);

    const rows = connection
      .prepare(
        'SELECT resource_id, distance FROM vectors.resources_vectors WHERE embedding MATCH ? AND k = 1',
      )
      .all(embedding) as { resource_id: string; distance: number }[];

    expect(rows).toHaveLength(1);
    expect(rows[0]?.resource_id).toBe('resource-1');
    expect(rows[0]?.distance).toBeCloseTo(0, 4);
  });

  it('enregistre la migration et la version du schéma', () => {
    database = openDatabase({ dataDir });
    const { connection } = database;

    const applied = connection
      .prepare('SELECT version, name FROM schema_migrations ORDER BY version')
      .all() as { version: number; name: string }[];

    expect(applied).toEqual([
      { version: 1, name: 'init' },
      { version: 2, name: 'embedding-space' },
      { version: 3, name: 'project-audits' },
      { version: 4, name: 'alerts' },
      { version: 5, name: 'best-practices' },
    ]);
    expect(connection.pragma('user_version', { simple: true })).toBe(5);
  });

  it('est idempotent : une seconde ouverture ne rejoue pas les migrations', () => {
    database = openDatabase({ dataDir });
    const executed = runMigrations(database.connection);

    expect(executed).toEqual([]);
  });

  it('applique une migration supplémentaire une seule fois', () => {
    database = openDatabase({ dataDir });
    const extra = [
      ...migrations,
      {
        version: 6,
        name: 'test-only',
        up: (connection: Database.Database) => {
          connection.exec('CREATE TABLE IF NOT EXISTS test_marker (id INTEGER PRIMARY KEY)');
        },
      },
    ];

    expect(runMigrations(database.connection, extra)).toEqual([6]);
    expect(runMigrations(database.connection, extra)).toEqual([]);
    expect(tableNames(database.connection)).toContain('test_marker');
    expect(database.connection.pragma('user_version', { simple: true })).toBe(6);
  });

  it('restreint les permissions des fichiers à 600', () => {
    database = openDatabase({ dataDir });

    if (isWindows) {
      return;
    }

    const { paths } = database;
    expect(statSync(paths.main).mode & 0o777).toBe(0o600);
    expect(statSync(paths.fts).mode & 0o777).toBe(0o600);
    expect(statSync(paths.vectors).mode & 0o777).toBe(0o600);
  });

  it('peut être ouvert sans migration', () => {
    database = openDatabase({ dataDir, migrate: false });

    expect(tableNames(database.connection)).not.toContain('resources');
    expect(tableNames(database.connection, 'fts')).toEqual([]);
  });

  it('échoue proprement si l’extension vectorielle est absente', () => {
    expect(() => openDatabase({ dataDir, loadVectors: false })).toThrow();
    expect(existsSync(resolveDatabasePaths(dataDir).main)).toBe(true);
  });

  it('ignore les permissions POSIX sur Windows', () => {
    const paths = resolveDatabasePaths(dataDir);
    const spy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');

    try {
      expect(() => secureDatabaseFiles(paths)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });

  it('tolère un fichier de permissions absent', () => {
    const paths = resolveDatabasePaths(dataDir);

    expect(() => secureDatabaseFiles(paths)).not.toThrow();
  });
});
