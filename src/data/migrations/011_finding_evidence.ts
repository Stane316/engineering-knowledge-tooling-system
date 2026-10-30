import type Database from 'better-sqlite3';

/**
 * Migration 011 — preuve des constats (Sprint 20-02, W05 / C-W09).
 *
 * Le défaut visé : un constat ne conservait rien de sa source au-delà de son
 * texte. Ni la règle déclenchée, ni les sélecteurs fournis par axe-core, ni le
 * nombre de nœuds, ni la version du moteur n'étaient persistés ; une preuve
 * affichée ne pouvait donc pas être rejouée ni vérifiée après coup.
 *
 * Forme retenue par le propriétaire (30 octobre 2026) : quatre colonnes
 * **additives et nullables** sur `audit_findings`, par `ALTER … ADD COLUMN` —
 * aucune reconstruction de table, aucune écriture sur les lignes existantes.
 *
 * - `rule` : identifiant de la règle d'origine (`color-contrast`…) ;
 * - `elements_json` : sélecteurs fournis, sérialisés en JSON ;
 * - `nodes_count` : nombre de nœuds réellement fourni (`NULL` = non fourni) ;
 * - `engine_version` : version du moteur ayant produit la preuve.
 *
 * Idempotent : chaque ajout est conditionné par `PRAGMA table_info`. Une base
 * neuve reçoit déjà ces colonnes par le `CREATE TABLE` de `AuditSchema` ; la
 * migration ne fait alors rien. Les constats historiques restent lisibles et
 * gardent `NULL` — leur absence de preuve est **signalée**, jamais comblée par
 * une valeur inventée.
 */

/** Colonnes actuellement déclarées sur une table. */
function existingColumns(connection: Database.Database, table: string): Set<string> {
  const rows = connection.pragma(`table_info(${table})`) as Array<{ name: string }>;
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
 * Ajoute les colonnes de preuve à `audit_findings`.
 *
 * @param connection - Connexion ouverte (base principale ou `:memory:`).
 */
export function migration011FindingEvidence(connection: Database.Database): void {
  if (!tableExists(connection, 'audit_findings')) {
    return;
  }

  const columns = existingColumns(connection, 'audit_findings');
  const additions: ReadonlyArray<readonly [string, string]> = [
    ['rule', 'TEXT'],
    ['elements_json', 'TEXT'],
    ['nodes_count', 'INTEGER'],
    ['engine_version', 'TEXT'],
  ];

  for (const [name, type] of additions) {
    if (columns.has(name)) {
      continue;
    }

    connection.exec(`ALTER TABLE audit_findings ADD COLUMN ${name} ${type}`);
  }
}
