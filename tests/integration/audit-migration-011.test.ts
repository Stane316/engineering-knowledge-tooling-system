/**
 * Migration 011 — preuve des constats (Sprint 20-02, C-W09).
 *
 * Décision du propriétaire (30 octobre 2026) : quatre colonnes additives et
 * nullables sur `audit_findings`, par `ALTER … ADD COLUMN`. Aucune
 * reconstruction, aucune écriture sur les lignes existantes : un constat
 * historique reste lisible et son absence de preuve est signalée par `NULL`.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { migration011FindingEvidence } from '../../src/data/migrations/011_finding_evidence.js';
import { migrations } from '../../src/data/migrations/index.js';
import { AuditSchema } from '../../src/storage/schema.js';

/** Colonnes déclarées sur une table. */
function columnNames(connection: Database.Database, table: string): Set<string> {
  const rows = connection.pragma(`table_info(${table})`) as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

/** Base « avant Sprint 20-02 » : aucune colonne de preuve. */
function createLegacyFindingsTable(connection: Database.Database): void {
  connection.exec(`
    CREATE TABLE audit_findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id INTEGER NOT NULL,
      dimension TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity INTEGER NOT NULL,
      effort INTEGER NOT NULL,
      impact INTEGER NOT NULL,
      priority TEXT NOT NULL,
      recommendation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  connection
    .prepare(
      `INSERT INTO audit_findings
         (audit_id, dimension, title, severity, effort, impact, priority)
       VALUES (7, 'accessibility', 'Contraste insuffisant', 3, 2, 4, 'high')`,
    )
    .run();
}

describe('Migration 011 — colonnes de preuve', () => {
  const expected = ['rule', 'elements_json', 'nodes_count', 'engine_version'];

  it('ajoute les quatre colonnes à une base historique', () => {
    const database = new Database(':memory:');
    try {
      createLegacyFindingsTable(database);
      expect([...columnNames(database, 'audit_findings')]).not.toContain('rule');

      migration011FindingEvidence(database);

      const columns = columnNames(database, 'audit_findings');
      for (const name of expected) {
        expect(columns.has(name)).toBe(true);
      }
    } finally {
      database.close();
    }
  });

  it('laisse le constat historique intact et sa preuve explicitement nulle', () => {
    const database = new Database(':memory:');
    try {
      createLegacyFindingsTable(database);
      migration011FindingEvidence(database);

      const row = database
        .prepare(
          'SELECT title, severity, rule, elements_json, nodes_count, engine_version FROM audit_findings WHERE audit_id = 7',
        )
        .get() as {
        title: string;
        severity: number;
        rule: string | null;
        elements_json: string | null;
        nodes_count: number | null;
        engine_version: string | null;
      };

      expect(row.title).toBe('Contraste insuffisant');
      expect(row.severity).toBe(3);
      expect(row.rule).toBeNull();
      expect(row.elements_json).toBeNull();
      expect(row.nodes_count).toBeNull();
      expect(row.engine_version).toBeNull();
    } finally {
      database.close();
    }
  });

  it('est idempotente : deux passages ne dupliquent aucune colonne', () => {
    const database = new Database(':memory:');
    try {
      createLegacyFindingsTable(database);
      migration011FindingEvidence(database);
      const first = columnNames(database, 'audit_findings');

      migration011FindingEvidence(database);
      const second = columnNames(database, 'audit_findings');

      expect([...second].sort()).toEqual([...first].sort());
    } finally {
      database.close();
    }
  });

  it('ne fait rien sur une base neuve, déjà pourvue par le schéma', () => {
    const database = new Database(':memory:');
    try {
      database.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
      new AuditSchema(database).createSchema();
      const before = columnNames(database, 'audit_findings');

      migration011FindingEvidence(database);

      expect([...columnNames(database, 'audit_findings')].sort()).toEqual([...before].sort());
      for (const name of expected) {
        expect(before.has(name)).toBe(true);
      }
    } finally {
      database.close();
    }
  });

  it('est enregistrée en version 11 dans le registre des migrations', () => {
    const last = migrations[migrations.length - 1];

    expect(last?.version).toBe(11);
    expect(last?.name).toBe('finding-evidence');
  });
});
