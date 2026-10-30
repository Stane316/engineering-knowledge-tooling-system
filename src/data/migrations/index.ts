import type Database from 'better-sqlite3';

import { TABLES } from '../../shared/constants.js';
import { migration001Init } from './001_init.js';
import { migration002EmbeddingSpace } from './002_embedding_space.js';
import { migration003ProjectAudits } from './003_project_audits.js';
import { migration004Alerts } from './004_alerts.js';
import { migration005BestPractices } from './005_best_practices.js';
import { migration006Recommendations } from './006_recommendations.js';
import { migration007Templates } from './007_templates.js';
import { migration008ProjectConfig } from './008_project_config.js';
import { migration009InfoFindings } from './009_info_findings.js';
import { migration010ScoreAvailability } from './010_score_availability.js';

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
  { version: 5, name: 'best-practices', up: migration005BestPractices },
  { version: 6, name: 'recommendations', up: migration006Recommendations },
  { version: 7, name: 'templates', up: migration007Templates },
  { version: 8, name: 'project-config', up: migration008ProjectConfig },
  { version: 9, name: 'info-findings', up: migration009InfoFindings },
  { version: 10, name: 'score-availability', up: migration010ScoreAvailability },
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
