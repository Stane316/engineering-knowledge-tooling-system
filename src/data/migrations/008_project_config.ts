import type Database from 'better-sqlite3';

/**
 * Migration 008 (Sprint 17-02) : configuration de projet persistée.
 *
 * Crée `project_config` — table **non prévue par la spec S17** qui la
 * supposait déjà existante (`TemplateApplier.applyConfig` faisait un
 * `INSERT OR REPLACE INTO project_config`) ; chez EKTS elle n'existe pas,
 * d'où cette migration (écart P3) :
 * - `project_id` PK + **FK `projects.id` ON DELETE CASCADE** (supprimer le
 *   projet nettoie sa configuration, aligné sur `generated_recommendations`
 *   de la migration 006) ;
 * - `config` : JSON TEXT (ADR-039) avec l'application du template
 *   (merge des overrides, ADR-041) ;
 * - `updated_at` : horodatage ISO 8601 (convention du dépôt).
 *
 * **Écart P3** : spec nommait cette table sans la créer ; ici migration
 * `008_project_config.ts` en **v8** (007 = schéma templates, Sprint 17-01).
 * `CREATE … IF NOT EXISTS` : migration idempotente.
 *
 * @param db - Connexion principale (migrations journalisées par `runMigrations`).
 */
export function migration008ProjectConfig(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_config (
      project_id TEXT PRIMARY KEY,
      config     TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_project_config_updated_at
      ON project_config(updated_at DESC);
  `);
}
