import type Database from 'better-sqlite3';

/**
 * Migration 004 (Sprint 14) : table des alertes de régression.
 *
 * - `project_id` : `ON DELETE CASCADE` (supprimer le projet retire ses
 *   alertes) — conformément aux politiques S13 où `project delete --force`
 *   est libre.
 * - **Pas de FK sur `audit_metadata`** (écart à la spec SQL, soumis) :
 *   même si SQLite accepte une FK vers une table absente au CREATE, elle est
 *   résolue en cascade à chaque `prepare` des statements affectant `projects`
 *   ou `alerts` → `no such table: main.audit_metadata` sur toute base sans
 *   table d'audit (fixtures CLI/MCP, bases neuves avant la 1re inspection).
 *   Les alertes sont des **données dérivées régénérables** (`AlertManager
 *   .checkAndCreateAlerts`) : l'intégrité référentielle audit↔alerte est
 *   assurée à la création par la logique métier, pas par le schéma.
 * - `CREATE ... IF NOT EXISTS` : migration idempotente.
 *
 * @param db - Connexion principale (migrations journalisées par `runMigrations`).
 */
export function migration004Alerts(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id                TEXT PRIMARY KEY,
      project_id        TEXT NOT NULL,
      audit_id_from     INTEGER NOT NULL,
      audit_id_to       INTEGER NOT NULL,
      dimension         TEXT NOT NULL,
      score_before      INTEGER NOT NULL,
      score_after       INTEGER NOT NULL,
      regression_points INTEGER NOT NULL,
      created_at        TEXT NOT NULL,
      resolved_at       TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved_at);
  `);
}
