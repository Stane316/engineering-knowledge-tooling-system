import type Database from 'better-sqlite3';

import { TABLES } from '../../shared/constants.js';
import { migration001Init } from './001_init.js';
import { migration002EmbeddingSpace } from './002_embedding_space.js';
import { migration003ProjectAudits } from './003_project_audits.js';
import { migration004Alerts } from './004_alerts.js';

export interface Migration {
  version: number;
  name: string;
  up(connection: Database.Database): void;
}

/**
 * Liste ordonnée des migrations. Une migration appliquée ne doit jamais être
 * modifiée : en ajouter une nouvelle à la suite.
 */
export const migrations: readonly Migration[] = [
  { version: 1, name: 'init', up: migration001Init },
  { version: 2, name: 'embedding-space', up: migration002EmbeddingSpace },
  { version: 3, name: 'project-audits', up: migration003ProjectAudits },
  { version: 4, name: 'alerts', up: migration004Alerts },
];

interface MigrationRow {
  version: number;
}

/**
 * Applique les migrations manquantes dans une transaction par migration et
 * journalise leur exécution dans `schema_migrations`.
 *
 * @returns les versions effectivement appliquées (vide si tout était à jour).
 */
export function runMigrations(
  connection: Database.Database,
  list: readonly Migration[] = migrations,
): number[] {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLES.migrations} (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    connection
      .prepare(`SELECT version FROM ${TABLES.migrations}`)
      .all()
      .map((row) => (row as MigrationRow).version),
  );

  const executed: number[] = [];

  for (const migration of list) {
    if (applied.has(migration.version)) {
      continue;
    }

    const applyMigration = connection.transaction(() => {
      migration.up(connection);
      connection
        .prepare(`INSERT INTO ${TABLES.migrations} (version, name, applied_at) VALUES (?, ?, ?)`)
        .run(migration.version, migration.name, new Date().toISOString());
    });

    applyMigration();
    executed.push(migration.version);
  }

  const highest = list.reduce((max, migration) => Math.max(max, migration.version), 0);
  connection.pragma(`user_version = ${highest}`);

  return executed;
}
