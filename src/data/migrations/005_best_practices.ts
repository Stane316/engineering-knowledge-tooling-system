import type Database from 'better-sqlite3';

/**
 * Migration 005 (Sprint 15) : tables de la capitalisation des bonnes
 * pratiques.
 *
 * Crée les 3 tables du modèle (SPRINT-15.md §2.3) :
 * 1. `best_practices` — stockage principal (UUID, tags/JSON, traçabilité) ;
 * 2. `best_practices_fts` — index plein texte **external content** synchronisé
 *    par triggers (INSERT/UPDATE/DELETE) : contrairement aux FTS autonomes de
 *    `audit_fts`/`resources_fts` (remplissage explicite par le repository), la
 *    table `best_practices` est le seul producteur de lignes et les triggers
 *    garantissent zéro désynchronisation — critère d'acceptation C15.3.
 *    La désindexation utilise la commande spéciale `'delete'` (pattern
 *    canonique SQLite des FTS à contenu externe) : un simple
 *    `DELETE FROM fts WHERE rowid = …` dans un trigger laisse des tokens
 *    orphelins ou corrompt l'index (`SQLITE_CORRUPT_VTAB`) ;
 * 3. `finding_best_practice` — association finding ↔ bonne pratique, clé
 *    composite `(finding_title, dimension, best_practice_id)` (ADR-035).
 *
 * **Écart P3 (spec vs code)** : la spec nommait `006_create_best_practices.ts`
 * dans `src/storage/migrations/` + `migration-registry.ts` — répertoires et
 * numérotation inexistants : le registre réel est `src/data/migrations/index.ts`
 * et le dernier numéro est 004 (Sprint 14), donc **005** ici.
 *
 * - FK `best_practice_id … ON DELETE CASCADE` : conforme à la même migration
 *   (la table cible est créée juste avant, dans la même `exec`), contrairement
 *   à la leçon 14-2 (FK vers une table absente des fixtures).
 * - `CREATE … IF NOT EXISTS` : migration idempotente.
 *
 * @param db - Connexion principale (migrations journalisées par `runMigrations`).
 */
export function migration005BestPractices(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS best_practices (
      id                 TEXT PRIMARY KEY,
      title              TEXT NOT NULL,
      description        TEXT NOT NULL,
      category           TEXT NOT NULL,
      tags               TEXT NOT NULL DEFAULT '[]',
      source_project_ids TEXT NOT NULL DEFAULT '[]',
      source_audit_ids   TEXT NOT NULL DEFAULT '[]',
      occurrence_count   INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL,
      is_manual          INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_best_practices_category
      ON best_practices(category);
    CREATE INDEX IF NOT EXISTS idx_best_practices_created_at
      ON best_practices(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_best_practices_updated_at
      ON best_practices(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_best_practices_occurrence
      ON best_practices(occurrence_count DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS best_practices_fts USING fts5(
      title,
      description,
      tags,
      content='best_practices',
      content_rowid='rowid'
    );

    CREATE TABLE IF NOT EXISTS finding_best_practice (
      finding_title    TEXT NOT NULL,
      dimension        TEXT NOT NULL,
      best_practice_id TEXT NOT NULL,
      confidence       REAL NOT NULL DEFAULT 1.0,
      created_at       TEXT NOT NULL,
      PRIMARY KEY (finding_title, dimension, best_practice_id),
      FOREIGN KEY (best_practice_id) REFERENCES best_practices(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_finding_bp_finding
      ON finding_best_practice(finding_title, dimension);
    CREATE INDEX IF NOT EXISTS idx_finding_bp_practice
      ON finding_best_practice(best_practice_id);

    CREATE TRIGGER IF NOT EXISTS trg_bp_fts_insert
    AFTER INSERT ON best_practices
    BEGIN
      INSERT INTO best_practices_fts(rowid, title, description, tags)
      VALUES (new.rowid, new.title, new.description, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_bp_fts_update
    AFTER UPDATE OF title, description, tags ON best_practices
    BEGIN
      INSERT INTO best_practices_fts(best_practices_fts, rowid, title, description, tags)
      VALUES ('delete', old.rowid, old.title, old.description, old.tags);
      INSERT INTO best_practices_fts(rowid, title, description, tags)
      VALUES (new.rowid, new.title, new.description, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_bp_fts_delete
    AFTER DELETE ON best_practices
    BEGIN
      INSERT INTO best_practices_fts(best_practices_fts, rowid, title, description, tags)
      VALUES ('delete', old.rowid, old.title, old.description, old.tags);
    END;
  `);
}
