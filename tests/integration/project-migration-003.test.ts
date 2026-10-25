import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { migration003ProjectAudits } from '../../src/data/migrations/003_project_audits.js';
import { migrations, runMigrations } from '../../src/data/migrations/index.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';

/**
 * Point d'arrêt Sprint 13-1 : la migration 003 s'applique sur une base
 * existante, sans erreur ni perte, et reste idempotente.
 */

function columnNames(connection: Database.Database, table: string): string[] {
  return (connection.pragma(`table_info(${table})`) as { name: string }[]).map((row) => row.name);
}

describe('Migration 003 — project_id (C13.1.1, C13.1.2)', () => {
  let dataDir: string;
  let database: EktsDatabase;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-mig003-'));
    database = openDatabase({ dataDir, migrate: false });
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('crée la colonne project_id sur une base existante sans project_id', () => {
    // 1. État « avant Sprint 13 » : schéma v2 + audit stocké sans projet.
    runMigrations(database.connection, migrations.slice(0, 2));

    const legacy = database.connection;
    legacy.exec(`
      CREATE TABLE audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
        total_findings INTEGER NOT NULL CHECK (total_findings >= 0),
        critical_findings INTEGER NOT NULL CHECK (critical_findings >= 0),
        high_findings INTEGER NOT NULL CHECK (high_findings >= 0),
        medium_findings INTEGER NOT NULL CHECK (medium_findings >= 0),
        low_findings INTEGER NOT NULL CHECK (low_findings >= 0),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    legacy
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('https://legacy.example', '2026-10-01T00:00:00.000Z', 75, 1, 0, 1, 0, 0);

    expect(columnNames(legacy, 'audit_metadata')).not.toContain('project_id');
    expect(columnNames(legacy, 'resources')).not.toContain('project_id');

    // 2. Migration 003 sur cette base existante.
    const executed = runMigrations(database.connection);
    expect(executed).toEqual([3, 4, 5]);

    // 3. Colonnes et index présents, ligne historique intacte.
    expect(columnNames(legacy, 'audit_metadata')).toContain('project_id');
    expect(columnNames(legacy, 'resources')).toContain('project_id');

    const row = legacy
      .prepare('SELECT url, overall_score, project_id FROM audit_metadata')
      .get() as {
      url: string;
      overall_score: number;
      project_id: string | null;
    };
    expect(row.url).toBe('https://legacy.example');
    expect(row.overall_score).toBe(75);
    expect(row.project_id).toBeNull();

    const indexes = (
      legacy.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as {
        name: string;
      }[]
    ).map((index) => index.name);
    expect(indexes).toContain('idx_audit_metadata_project_id');
    expect(indexes).toContain('idx_resources_project_id');
  });

  it('est idempotente : une seconde application ne change rien', () => {
    // Base complète : migrations (001 → 003) puis schéma d'audits.
    runMigrations(database.connection);
    new AuditSchema(database.connection).createSchema();

    expect(columnNames(database.connection, 'resources')).toContain('project_id');
    expect(columnNames(database.connection, 'audit_metadata')).toContain('project_id');

    // Relance directe : aucun ALTER, aucune erreur.
    expect(() => {
      migration003ProjectAudits(database.connection);
    }).not.toThrow();

    // Relance via le mécanisme : déjà appliquée, rien à exécuter.
    expect(runMigrations(database.connection)).toEqual([]);
  });

  it('une base neuve porte la colonne (schéma créé puis migrations)', () => {
    database.close();
    database = openDatabase({ dataDir });

    // `resources` porte la colonne dès les migrations (001 puis ALTER 003).
    expect(columnNames(database.connection, 'resources')).toContain('project_id');

    // `audit_metadata` est créé par `AuditSchema` : le CREATE porte la colonne.
    expect(columnNames(database.connection, 'audit_metadata')).toEqual([]);
    new AuditSchema(database.connection).createSchema();
    expect(columnNames(database.connection, 'audit_metadata')).toContain('project_id');

    // AuditStockable immédiatement avec association projet.
    const repository = new AuditRepository(database.connection);
    expect(repository.list(0, 10)).toEqual([]);
  });
});
