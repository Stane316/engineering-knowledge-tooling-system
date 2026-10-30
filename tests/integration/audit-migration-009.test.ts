import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { migrations, runMigrations } from '../../src/data/migrations/index.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';

/**
 * Migration 009 — cinquième compteur `info_findings` (Sprint 19-01, C-W02).
 *
 * Décision du propriétaire (30 octobre 2026) : sur une base historique, le
 * compteur `info` vaut **`0` mesuré**, jamais « non mesuré » et jamais `NULL`.
 * La migration est additive et idempotente : elle ne réécrit aucune autre
 * colonne et ne supprime aucune ligne.
 */

/** Colonnes déclarées sur une table. */
function columnNames(connection: Database.Database, table: string): string[] {
  return (connection.pragma(`table_info(${table})`) as { name: string }[]).map((row) => row.name);
}

describe('Migration 009 — info_findings (C-W02)', () => {
  let dataDir: string;
  let database: EktsDatabase;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-mig009-'));
    database = openDatabase({ dataDir, migrate: false });
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('ajoute la colonne à une base existante sans info_findings', () => {
    // 1. État « avant Sprint 19 » : schéma d'audits créé avec les 4 compteurs.
    database.connection.exec(`
      CREATE TABLE audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        overall_score INTEGER NOT NULL,
        total_findings INTEGER NOT NULL,
        critical_findings INTEGER NOT NULL,
        high_findings INTEGER NOT NULL,
        medium_findings INTEGER NOT NULL,
        low_findings INTEGER NOT NULL,
        project_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    database.connection
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('https://historique.example', '2026-10-01T08:00:00.000Z', 71, 3, 0, 1, 1, 1);

    expect(columnNames(database.connection, 'audit_metadata')).not.toContain('info_findings');

    // 2. Migration appliquée seule.
    const executed = runMigrations(
      database.connection,
      migrations.filter((m) => m.version === 9),
    );

    expect(executed).toEqual([9]);
    expect(columnNames(database.connection, 'audit_metadata')).toContain('info_findings');

    // 3. La ligne historique reste lisible et le compteur vaut 0 mesuré.
    const row = database.connection
      .prepare('SELECT url, total_findings, info_findings FROM audit_metadata')
      .get() as { url: string; total_findings: number; info_findings: number };

    expect(row.url).toBe('https://historique.example');
    expect(row.total_findings).toBe(3);
    expect(row.info_findings).toBe(0);
  });

  it('est idempotente : une seconde application ne change rien', () => {
    new AuditSchema(database.connection).createSchema();
    runMigrations(
      database.connection,
      migrations.filter((m) => m.version === 9),
    );

    const before = columnNames(database.connection, 'audit_metadata');
    const executed = runMigrations(
      database.connection,
      migrations.filter((m) => m.version === 9),
    );

    expect(executed).toEqual([]);
    expect(columnNames(database.connection, 'audit_metadata')).toEqual(before);
  });

  it('ne réécrit aucune autre colonne des audits historiques', () => {
    // Table `projects` (migration 001) : requise par la clé étrangère
    // `ON DELETE SET NULL` de `audit_metadata.project_id`.
    database.connection.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    new AuditSchema(database.connection).createSchema();
    const repository = new AuditRepository(database.connection);

    // Audit historique inséré sans colonne info (valeur par défaut 0).
    database.connection
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('https://historique.example', '2026-10-02T08:00:00.000Z', 88, 2, 0, 0, 1, 1);

    runMigrations(
      database.connection,
      migrations.filter((m) => m.version === 9),
    );

    const audit = repository.findById(1);
    expect(audit?.metadata.overallScore).toBe(88);
    expect(audit?.metadata.totalFindings).toBe(2);
    expect(audit?.metadata.mediumFindings).toBe(1);
    expect(audit?.metadata.lowFindings).toBe(1);
    expect(audit?.metadata.infoFindings).toBe(0);
  });
});
