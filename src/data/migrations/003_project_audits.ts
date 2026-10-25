import type Database from 'better-sqlite3';

/**
 * Migration 003 — Association projets ↔ audits et projets ↔ ressources.
 *
 * Ajoute une colonne `project_id` nullable :
 * - sur `audit_metadata` : chaque audit peut appartenir à un projet ;
 * - sur `resources` : chaque ressource peut appartenir à un projet.
 *
 * Colonnes **nullable** : les données existantes (sans projet) restent
 * valides. `ON DELETE SET NULL` : supprimer un projet conserve ses audits
 * et ses ressources (leur `project_id` repasse à `NULL`).
 *
 * Idempotent : la présence de la colonne est vérifiée avant chaque `ALTER`
 * (base existante ou relance).
 *
 * **Note de conception (écart assumé SPRINT-13-02) :** le modèle de la spec
 * ne déclarait `project_id` que sur `audit_metadata`, mais les critères
 * C13.2.5/C13.2.6 imposent `--project` sur `ekts list` et `ekts search`
 * (ressources) : la colonne est donc ajoutée aux deux tables.
 */

/** Colonnes actuellement déclarées sur une table. */
function columnNames(connection: Database.Database, table: string): Set<string> {
  const rows = connection.pragma(`table_info(${table})`) as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

/** La table existe-t-elle dans le schéma courant ? */
function tableExists(connection: Database.Database, table: string): boolean {
  const row = connection
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(table) as { name: string } | undefined;
  return row !== undefined;
}

/**
 * Ajoute `project_id` (+ index) si la table existe et manque de la colonne.
 *
 * Cas de figure :
 * - base existante (tables déjà créées) → `ALTER TABLE` ;
 * - table absente (audit initialisé plus tard par `AuditSchema`) → rien à
 *   faire, le `CREATE TABLE` porte déjà la colonne ;
 * - relance → aucun effet (idempotent).
 */
function addProjectId(connection: Database.Database, table: string): void {
  if (!tableExists(connection, table)) {
    return;
  }

  const columns = columnNames(connection, table);
  if (columns.has('project_id')) {
    return;
  }

  connection.exec(`
    ALTER TABLE ${table}
      ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
  `);
  connection.exec(`
    CREATE INDEX IF NOT EXISTS idx_${table}_project_id ON ${table}(project_id);
  `);
}

/** Migration 003 — colonne `project_id` sur `audit_metadata` et `resources`. */
export function migration003ProjectAudits(connection: Database.Database): void {
  addProjectId(connection, 'audit_metadata');
  addProjectId(connection, 'resources');
}
