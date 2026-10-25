import type Database from 'better-sqlite3';

/**
 * Migration 007 (Sprint 17) : table des templates de projets.
 *
 * Crée `project_templates` (SPRINT-17.md §2.3) avec index catégorie et
 * builtin :
 * - `config`, `best_practice_ids`, `recommendation_rule_ids` en **JSON TEXT**
 *   (ADR-039 : flexibilité sans migration, export/import natif) ;
 * - `is_builtin` (ADR-040) : les 10 prédéfinis sont **semés par le code**
 *   (`TemplateService.seedBuiltins`, idempotent) et non par la migration —
 *   écart P3 : le spec voulait l'insertion « lors de la migration 008 » mais
 *   son découpage (migration en 17-01, fichiers builtins en 17-02) et la
 *   règle « ne jamais modifier une migration appliquée » l'interdisent ;
 * - **Écart P3** : la spec nommait `008_create_templates.ts` dans
 *   `src/storage/migrations/` — répertoire réel `src/data/migrations/` et
 *   dernier numéro 006 (Sprint 16), donc **007** ici (v7).
 *
 * - Aucune FK : `project_templates` ne référence que des IDs JSON
 *   (best practices / règles) — les liens sont guidés côté application.
 * - `CREATE … IF NOT EXISTS` : migration idempotente.
 *
 * @param db - Connexion principale (migrations journalisées par `runMigrations`).
 */
export function migration007Templates(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_templates (
      id                      TEXT PRIMARY KEY,
      name                    TEXT NOT NULL,
      description             TEXT NOT NULL,
      category                TEXT NOT NULL,
      config                  TEXT NOT NULL DEFAULT '{}',
      best_practice_ids       TEXT NOT NULL DEFAULT '[]',
      recommendation_rule_ids TEXT NOT NULL DEFAULT '[]',
      is_builtin              INTEGER NOT NULL DEFAULT 0,
      created_at              TEXT NOT NULL,
      updated_at              TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_project_templates_category
      ON project_templates(category);
    CREATE INDEX IF NOT EXISTS idx_project_templates_builtin
      ON project_templates(is_builtin);
    CREATE INDEX IF NOT EXISTS idx_project_templates_created_at
      ON project_templates(created_at DESC);
  `);
}
