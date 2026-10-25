import type Database from 'better-sqlite3';

/**
 * Migration 006 (Sprint 16) : tables du moteur de recommandations
 * contextuelles.
 *
 * Crée les 2 tables du modèle (SPRINT-16.md §2.3) :
 * 1. `recommendation_rules` — règles explicites (dimension, sévérité,
 *    pattern → recommandation) avec index (dimension, actif, priorité) ;
 * 2. `generated_recommendations` — recommandations générées par projet,
 *    `rule_id` nullable (`ON DELETE SET NULL` : supprimer une règle ne
 *    supprime pas les recommandations historiques qu'elle a produites) et
 *    FK `project_id` (traçabilité projet, critère C15.18 étendu).
 *
 * **Écart P3 (spec vs code)** : la spec nommait
 * `src/storage/migrations/007_create_recommendations.ts` +
 * `migration-registry.ts` — répertoires inexistants, et le dernier numéro
 * réel est 005 (Sprint 15), donc **006** ici ; le registre réel est
 * `src/data/migrations/index.ts` (v5 → v6).
 *
 * - FK `generated_recommendations.project_id` : `projects` existe depuis la
 *   migration 003, toujours présente sur le même schéma (leçon 14-2).
 * - `CREATE … IF NOT EXISTS` : migration idempotente.
 * - SQLite `TEXT` pour les horodatages ISO 8601 (convention du dépôt).
 *
 * @param db - Connexion principale (migrations journalisées par `runMigrations`).
 */
export function migration006Recommendations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendation_rules (
      id                          TEXT PRIMARY KEY,
      name                        TEXT NOT NULL,
      description                 TEXT NOT NULL,
      dimension                   TEXT NOT NULL,
      severity_threshold          INTEGER NOT NULL,
      pattern                     TEXT NOT NULL,
      recommendation_title        TEXT NOT NULL,
      recommendation_description  TEXT NOT NULL,
      effort                      INTEGER NOT NULL DEFAULT 3,
      impact                      INTEGER NOT NULL DEFAULT 3,
      priority                    TEXT NOT NULL DEFAULT 'medium',
      is_active                   INTEGER NOT NULL DEFAULT 1,
      created_at                  TEXT NOT NULL,
      updated_at                  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_recommendation_rules_dimension
      ON recommendation_rules(dimension);
    CREATE INDEX IF NOT EXISTS idx_recommendation_rules_active
      ON recommendation_rules(is_active);
    CREATE INDEX IF NOT EXISTS idx_recommendation_rules_priority
      ON recommendation_rules(priority);

    CREATE TABLE IF NOT EXISTS generated_recommendations (
      id                          TEXT PRIMARY KEY,
      project_id                  TEXT NOT NULL,
      rule_id                     TEXT,
      finding_title               TEXT,
      recommendation_title        TEXT NOT NULL,
      recommendation_description  TEXT NOT NULL,
      dimension                   TEXT NOT NULL,
      relevance_score             REAL NOT NULL,
      effort                      INTEGER NOT NULL,
      impact                      INTEGER NOT NULL,
      priority                    TEXT NOT NULL,
      generated_at                TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (rule_id) REFERENCES recommendation_rules(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_generated_recommendations_project
      ON generated_recommendations(project_id);
    CREATE INDEX IF NOT EXISTS idx_generated_recommendations_score
      ON generated_recommendations(relevance_score DESC);
    CREATE INDEX IF NOT EXISTS idx_generated_recommendations_generated_at
      ON generated_recommendations(generated_at DESC);
  `);
}
