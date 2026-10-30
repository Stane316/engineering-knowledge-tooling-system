import type { Database } from 'better-sqlite3';

/**
 * Schéma SQLite du stockage d'audits (Sprint 10-1).
 *
 * Quatre objets :
 * - `audit_metadata` — une ligne par rapport d'analyse stocké ; porte
 *   `project_id` (nullable, Sprint 13) pour l'association audits ↔ projets ;
 * - `audit_dimensions` — 5 lignes par audit (scores par dimension) ;
 * - `audit_findings` — une ligne par constat ;
 * - `audit_fts` — index plein texte **autonome** (FM25 sur titre/description/URL).
 *
 * La table FTS5 est volontairement **autonome** (pas de `content=` externe),
 * exactement comme `resources_fts` (migration `001_init`) : une table de
 * contenu référencée par FTS5 impose ses propres cycles de vie — les `INSERT`
 * directs utilisés par `AuditIndexer` seraient refusés, et la table vit dans
 * le schéma `main` alors que les index FTS du projet habitent le schéma
 * attaché `fts`. Le désindexage explicite (`DELETE` + `INSERT`) reste sous
 * contrôle applicatif.
 */
export class AuditSchema {
  /**
   * @param db - Connexion ouverte (base principale `ekts.db` ou `:memory:`).
   */
  constructor(private readonly db: Database) {}

  /**
   * Crée les tables et index des audits (idempotent).
   *
   * Active aussi `foreign_keys` sur la connexion : le `ON DELETE CASCADE`
   * des tables enfants n'existe que sous ce pragma (il est actif par défaut
   * via `openDatabase()`, mais pas sur une connexion nue `:memory:`).
   */
  createSchema(): void {
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
        total_findings INTEGER NOT NULL CHECK (total_findings >= 0),
        critical_findings INTEGER NOT NULL CHECK (critical_findings >= 0),
        high_findings INTEGER NOT NULL CHECK (high_findings >= 0),
        medium_findings INTEGER NOT NULL CHECK (medium_findings >= 0),
        low_findings INTEGER NOT NULL CHECK (low_findings >= 0),
        info_findings INTEGER NOT NULL DEFAULT 0 CHECK (info_findings >= 0),
        score_status TEXT NOT NULL DEFAULT 'measured'
          CHECK (score_status IN ('measured', 'unavailable')),
        score_reason TEXT,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL CHECK (
          dimension IN ('performance', 'accessibility', 'seo', 'ux', 'content')
        ),
        score INTEGER CHECK (score BETWEEN 0 AND 100),
        score_status TEXT NOT NULL DEFAULT 'measured'
          CHECK (score_status IN ('measured', 'unavailable')),
        score_reason TEXT,
        findings_count INTEGER NOT NULL CHECK (findings_count >= 0),
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL CHECK (
          dimension IN ('performance', 'accessibility', 'seo', 'ux', 'content')
        ),
        title TEXT NOT NULL,
        description TEXT,
        severity INTEGER NOT NULL CHECK (severity BETWEEN 0 AND 4),
        effort INTEGER NOT NULL CHECK (effort BETWEEN 1 AND 5),
        impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
        priority TEXT NOT NULL CHECK (
          priority IN ('critical', 'high', 'medium', 'low', 'info')
        ),
        recommendation TEXT,
        rule TEXT,
        elements_json TEXT,
        nodes_count INTEGER,
        engine_version TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS audit_fts USING fts5(
        url,
        title,
        description,
        tokenize = 'porter unicode61 remove_diacritics 2'
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_dimensions_audit_id
      ON audit_dimensions(audit_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_findings_audit_id
      ON audit_findings(audit_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_metadata_url
      ON audit_metadata(url)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_metadata_timestamp
      ON audit_metadata(timestamp DESC)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_metadata_project_id
      ON audit_metadata(project_id)
    `);
  }

  /**
   * Supprime le schéma d'audits (ordre des enfants vers le parent).
   *
   * Sans effet si les tables n'existent pas.
   */
  dropSchema(): void {
    this.db.exec('DROP TABLE IF EXISTS audit_fts');
    this.db.exec('DROP TABLE IF EXISTS audit_findings');
    this.db.exec('DROP TABLE IF EXISTS audit_dimensions');
    this.db.exec('DROP TABLE IF EXISTS audit_metadata');
  }

  /**
   * Vérifie que les trois tables de données existent.
   *
   * @returns `true` si `audit_metadata`, `audit_dimensions` et
   *   `audit_findings` sont présentes.
   */
  schemaExists(): boolean {
    const rows = this.db
      .prepare(
        `SELECT name FROM sqlite_master
          WHERE type = 'table'
            AND name IN ('audit_metadata', 'audit_dimensions', 'audit_findings')`,
      )
      .all() as Array<{ name: string }>;

    return rows.length === 3;
  }

  /**
   * Vérifie que l'index plein texte d'audits existe.
   *
   * @returns `true` si la table virtuelle `audit_fts` est présente.
   */
  ftsExists(): boolean {
    const row = this.db
      .prepare(
        `SELECT name FROM sqlite_master
          WHERE type = 'table' AND name = 'audit_fts'`,
      )
      .get() as { name: string } | undefined;

    return row !== undefined;
  }
}
