import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AuditSchema } from '../../src/storage/schema.js';

describe('AuditSchema', () => {
  let db: Database.Database;
  let schema: AuditSchema;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  /** Compte les objets du type demandé dans sqlite_master. */
  function countMaster(type: string, name: string): number {
    const rows = db
      .prepare(
        `SELECT COUNT(*) AS n FROM sqlite_master
          WHERE type = ? AND name = ?`,
      )
      .get(type, name) as { n: number };

    return rows.n;
  }

  describe('createSchema', () => {
    it('crée la table audit_metadata', () => {
      schema.createSchema();

      expect(countMaster('table', 'audit_metadata')).toBe(1);
    });

    it('crée la table audit_dimensions', () => {
      schema.createSchema();

      expect(countMaster('table', 'audit_dimensions')).toBe(1);
    });

    it('crée la table audit_findings', () => {
      schema.createSchema();

      expect(countMaster('table', 'audit_findings')).toBe(1);
    });

    it("crée l'index plein texte audit_fts", () => {
      schema.createSchema();

      expect(countMaster('table', 'audit_fts')).toBe(1);
      expect(schema.ftsExists()).toBe(true);
    });

    it('crée les index sur audit_id et url', () => {
      schema.createSchema();

      const indexes = db
        .prepare(
          `SELECT name FROM sqlite_master
            WHERE type = 'index' AND name LIKE 'idx_audit_%'`,
        )
        .all() as Array<{ name: string }>;
      const names = indexes.map((i) => i.name);

      expect(names).toContain('idx_audit_dimensions_audit_id');
      expect(names).toContain('idx_audit_findings_audit_id');
      expect(names).toContain('idx_audit_metadata_url');
    });

    it("active l'intégrité référentielle (foreign_keys) sur la connexion", () => {
      schema.createSchema();

      const rows = db.pragma('foreign_keys') as Array<{ foreign_keys: number }>;
      expect(rows[0]?.foreign_keys).toBe(1);
    });

    it('est idempotent (appels multiples sans erreur)', () => {
      schema.createSchema();
      schema.createSchema();

      expect(schema.schemaExists()).toBe(true);
      expect(schema.ftsExists()).toBe(true);
    });

    it('rejette une sévérité hors 0-4 par la contrainte SQL', () => {
      schema.createSchema();
      db.prepare(
        'INSERT INTO audit_metadata (url, timestamp, overall_score, total_findings, critical_findings, high_findings, medium_findings, low_findings) VALUES (?, ?, ?, 0, 0, 0, 0, 0)',
      ).run('https://example.com', new Date().toISOString(), 70);

      expect(() =>
        db
          .prepare(
            `INSERT INTO audit_findings
               (audit_id, dimension, title, severity, effort, impact, priority)
             VALUES (1, 'performance', 'X', 5, 2, 4, 'high')`,
          )
          .run(),
      ).toThrow(/CHECK constraint/i);
    });
  });

  describe('dropSchema', () => {
    it('supprime toutes les tables du schéma', () => {
      schema.createSchema();
      schema.dropSchema();

      expect(schema.schemaExists()).toBe(false);
      expect(schema.ftsExists()).toBe(false);
      expect(countMaster('table', 'audit_metadata')).toBe(0);
    });

    it("n'échoue pas si le schéma n'existe pas", () => {
      expect(() => {
        schema.dropSchema();
      }).not.toThrow();
    });
  });

  describe('schemaExists', () => {
    it('retourne false avant création', () => {
      expect(schema.schemaExists()).toBe(false);
    });

    it('retourne true après création', () => {
      schema.createSchema();

      expect(schema.schemaExists()).toBe(true);
    });
  });
});
