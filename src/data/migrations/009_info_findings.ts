import type Database from 'better-sqlite3';

/**
 * Migration 009 — Cinquième compteur de constats (`info_findings`).
 *
 * Sprint 19-01 (C-W02) : le résumé d'un audit doit exposer **cinq** compteurs
 * — `critical`, `high`, `medium`, `low`, `info` — dont la somme égale
 * `total_findings`. La colonne manquait : les constats `info` étaient comptés
 * par les analyseurs puis perdus à la persistance.
 *
 * Choix sémantique arrêté par le propriétaire (30 octobre 2026) :
 * **lignes historiques = `0` mesuré**, pas « non mesuré ». La colonne est donc
 * `NOT NULL DEFAULT 0` : SQLite renseigne `0` sur les lignes existantes sans
 * qu'aucune autre colonne ne soit réécrite, et la lecture reste numérique.
 *
 * Idempotent : la présence de la colonne est vérifiée avant chaque `ALTER`
 * (base existante, base neuve ou relance). Une base neuve reçoit la colonne
 * par le `CREATE TABLE` de `AuditSchema` ; la migration ne fait alors rien.
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

/** Migration 009 — colonne `info_findings` sur `audit_metadata`. */
export function migration009InfoFindings(connection: Database.Database): void {
  if (!tableExists(connection, 'audit_metadata')) {
    return;
  }

  if (columnNames(connection, 'audit_metadata').has('info_findings')) {
    return;
  }

  connection.exec(`
    ALTER TABLE audit_metadata
      ADD COLUMN info_findings INTEGER NOT NULL DEFAULT 0 CHECK (info_findings >= 0);
  `);
}
