import type Database from 'better-sqlite3';

/**
 * Migration 010 — scores indisponibles (`overall_score` et `score` nullables).
 *
 * Sprint 19-03 (C-W05 → C-W07) : une analyse dont une dimension requise n'a pas
 * fourni de score ne produit **pas** de score global. Refuser de persister cet
 * audit reviendrait à jeter le rapport ; écrire `0` serait exactement la valeur
 * de remplacement interdite. Les deux niveaux de score doivent donc accepter
 * `NULL`, et l'état être explicite, avec sa raison.
 *
 * Forme retenue par le propriétaire (30 octobre 2026) : `ALTER`, **pas** de
 * reconstruction de table. Une sonde exécutée sur la version embarquée
 * (`SQLite 3.53.4`, `better-sqlite3 13.0.3`) a montré que
 * `ALTER COLUMN … DROP NOT NULL` est accepté et que le `CHECK` de bornes est
 * conservé (`NULL` accepté, `150` refusé). La reconstruction, plus risquée pour
 * les clés étrangères et les index, est donc inutile.
 *
 * Périmètre étendu aux dimensions (même décision, 30 octobre 2026) : sans
 * `audit_dimensions.score` nullable, aucun audit porteur d'une dimension
 * indisponible n'est persistable — et un score global indisponible implique
 * toujours une dimension indisponible (aucune renormalisation). La migration
 * 010 couvre donc les deux tables.
 *
 * Contenu, par table :
 * - `overall_score` / `score` : `NOT NULL` retiré (`NULL` = indisponible) ;
 * - `score_status` : `measured` (défaut, y compris lignes historiques) ou
 *   `unavailable` ;
 * - `score_reason` : raison lisible de l'indisponibilité.
 *
 * Idempotent : chaque `ALTER` est conditionné par `PRAGMA table_info`. Une base
 * neuve reçoit les trois propriétés par les `CREATE TABLE` de `AuditSchema` ;
 * la migration ne fait alors rien. Les lignes historiques restent `measured`
 * (elles portaient un score réel), sans réécriture de leur valeur.
 */

/** Description d'une colonne telle que lue par `PRAGMA table_info`. */
interface ColumnInfo {
  name: string;
  notnull: number;
}

/** Colonnes actuellement déclarées sur une table. */
function columns(connection: Database.Database, table: string): Map<string, ColumnInfo> {
  const rows = connection.pragma(`table_info(${table})`) as ColumnInfo[];
  return new Map(rows.map((row) => [row.name, row]));
}

/** La table existe-t-elle dans le schéma courant ? */
function tableExists(connection: Database.Database, table: string): boolean {
  const row = connection
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(table) as { name: string } | undefined;
  return row !== undefined;
}

/**
 * Rend une colonne de score nullable et ajoute son état (`score_status`).
 *
 * @param connection - Connexion ouverte.
 * @param table - Table portant la colonne.
 * @param scoreColumn - Colonne de score à rendre nullable.
 */
function allowUnavailableScore(
  connection: Database.Database,
  table: string,
  scoreColumn: string,
): void {
  let declared = columns(connection, table);

  if (!declared.has('score_status')) {
    // `DEFAULT 'measured'` renseigne les lignes historiques — qui portaient
    // toutes un score réel — sans réécrire la colonne de score.
    connection.exec(`
      ALTER TABLE ${table}
        ADD COLUMN score_status TEXT NOT NULL DEFAULT 'measured'
          CHECK (score_status IN ('measured', 'unavailable'));
    `);
  }

  if (!declared.has('score_reason')) {
    connection.exec(`
      ALTER TABLE ${table}
        ADD COLUMN score_reason TEXT;
    `);
  }

  declared = columns(connection, table);
  const score = declared.get(scoreColumn);

  // `notnull === 1` : la contrainte est encore là. Sinon la colonne accepte
  // déjà `NULL` (base neuve ou migration déjà appliquée).
  if (score !== undefined && score.notnull === 1) {
    connection.exec(`
      ALTER TABLE ${table}
        ALTER COLUMN ${scoreColumn} DROP NOT NULL;
    `);
  }
}

/** Migration 010 — disponibilité des scores sur `audit_metadata` et `audit_dimensions`. */
export function migration010ScoreAvailability(connection: Database.Database): void {
  if (tableExists(connection, 'audit_metadata')) {
    allowUnavailableScore(connection, 'audit_metadata', 'overall_score');
  }

  if (tableExists(connection, 'audit_dimensions')) {
    allowUnavailableScore(connection, 'audit_dimensions', 'score');
  }
}
