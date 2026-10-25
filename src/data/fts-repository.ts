import type Database from 'better-sqlite3';

import { FTS_SCHEMA, TABLES } from '../shared/constants.js';
import { SearchError } from '../shared/errors.js';
import type { Resource } from '../shared/validators.js';
import type { SearchResult } from '../shared/types.js';

/** Limite appliquée quand l'appelant n'en fournit pas. */
export const DEFAULT_LIMIT = 10;

/**
 * Nombre maximal de termes conservés dans une requête FTS.
 *
 * Au-delà, la requête n'apporte plus de précision mais coûte du CPU à FTS5 :
 * on borne volontairement pour protéger la latence.
 */
export const MAX_QUERY_TOKENS = 32;

/** Colonnes de `resources` communes aux jointures FTS et vectorielles. */
export interface ResourceRow {
  id: string;
  type: string;
  title: string;
  url: string | null;
  tags: string;
  metadata: string;
  content: string | null;
  embedding_model: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Ligne de la jointure FTS, enrichie du score BM25. */
interface FtsRow extends ResourceRow {
  score: number;
}

const SELECT_COLUMNS = [
  'r.id',
  'r.type',
  'r.title',
  'r.url',
  'r.tags',
  'r.metadata',
  'r.content',
  'r.embedding_model',
  'r.project_id',
  'r.created_at',
  'r.updated_at',
].join(', ');

/**
 * Convertit une requête utilisateur en expression FTS5 sûre.
 *
 * FTS5 interprète `AND`, `OR`, `NOT`, `NEAR`, `*`, `"`, `-` et les parenthèses :
 * une saisie libre comme `C++ (pointeurs)` provoque une `SqliteError`
 * (`fts5: syntax error`). On découpe donc la saisie en mots, on élimine la
 * ponctuation et on cite chaque terme, ce qui neutralise tout opérateur :
 *
 * - `sqlite bm25`   → `"sqlite" AND "bm25"`
 * - `C++ pointeurs` → `"C" AND "pointeurs"`
 * - `!!!`           → `null` (aucun terme exploitable, pas d'appel FTS)
 *
 * Les termes sont joints par `AND` (sémantique par défaut de FTS5, rendue
 * explicite) : une ressource doit contenir **tous** les mots de la requête.
 *
 * @param raw - Saisie libre de l'utilisateur.
 * @returns Expression FTS5 valide, ou `null` si aucun terme exploitable.
 */
export function toFtsQuery(raw: string): string | null {
  const tokens = raw
    .split(/[^\p{L}\p{N}_]+/u)
    .filter((token) => token.length > 0)
    .slice(0, MAX_QUERY_TOKENS);

  if (tokens.length === 0) {
    return null;
  }

  return tokens.map((token) => `"${token}"`).join(' AND ');
}

/**
 * Repository de recherche full-text (FTS5 + BM25).
 *
 * Le schéma `fts` est attaché par `openDatabase()` : la table
 * `fts.resources_fts` vit dans `ekts-fts.db`, la table `resources` dans
 * `ekts.db`. La jointure s'appuie sur `resources_fts.resource_id` (colonne
 * `UNINDEXED` recopiée à l'insertion) et **non** sur `rowid` :
 *
 * - `resources.id` est un UUID `TEXT`, jamais comparable à un `rowid` entier
 *   (le `JOIN ON r.id = resources_fts.rowid` du blueprint ne renvoie rien) ;
 * - SQLite peut réutiliser un `rowid` après suppression, `resource_id` non.
 */
export class FTSRepository {
  private readonly searchStatement;
  private readonly countStatement;

  constructor(private readonly connection: Database.Database) {
    this.searchStatement = connection.prepare(`
      SELECT ${SELECT_COLUMNS},
             bm25(${TABLES.resourcesFts}, 0.0, 10.0, 5.0, 1.0) AS score
        FROM ${FTS_SCHEMA}.${TABLES.resourcesFts}
        JOIN ${TABLES.resources} r ON r.id = ${FTS_SCHEMA}.${TABLES.resourcesFts}.resource_id
       WHERE ${TABLES.resourcesFts} MATCH ?
       ORDER BY score ASC
       LIMIT ?
    `);
    this.countStatement = connection.prepare(
      `SELECT count(*) AS n FROM ${FTS_SCHEMA}.${TABLES.resourcesFts}`,
    );
  }

  /**
   * Recherche lexicale classée par BM25.
   *
   * Poids passés à `bm25()` **dans l'ordre des colonnes** de
   * `resources_fts (resource_id, title, content, tags)` : `0.0` pour
   * l'identifiant (colonne `UNINDEXED`, sans influence), `10.0` pour le titre,
   * `5.0` pour le contenu, `1.0` pour les tags. Le blueprint n'en passait que
   * trois : les poids glissaient d'une colonne (`resource_id` recevait 10.0) et
   * `tags` gardait son poids par défaut.
   *
   * BM25 renvoie un score **négatif** (plus proche de 0 = plus pertinent) :
   * le tri doit donc être `ORDER BY score ASC`. Le `DESC` du blueprint
   * inversait le classement.
   *
   * @param query - Saisie libre (assainie par {@link toFtsQuery}).
   * @param limit - Nombre maximum de résultats (entier > 0).
   * @returns Résultats classés du plus pertinent au moins pertinent.
   * @throws {SearchError} Limite invalide ou erreur SQLite/FTS5.
   */
  async search(query: string, limit: number = DEFAULT_LIMIT): Promise<SearchResult[]> {
    assertLimit(limit);

    const expression = toFtsQuery(query);
    if (expression === null) {
      return [];
    }

    try {
      const rows = this.searchStatement.all(expression, limit) as FtsRow[];
      return rows.map((row) => ({ resource: toResource(row), score: row.score, source: 'fts' }));
    } catch (error) {
      throw new SearchError(`recherche FTS sur « ${query} »`, { cause: error });
    }
  }

  /** Nombre d'entrées présentes dans l'index FTS5. */
  count(): number {
    const row = this.countStatement.get() as { n: number };
    return row.n;
  }
}

/**
 * Vérifie qu'une limite est un entier strictement positif.
 *
 * @throws {SearchError} Limite non entière ou ≤ 0.
 */
export function assertLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new SearchError(`limite invalide (${String(limit)}) : entier > 0 attendu`);
  }
}

/** Convertit une ligne SQL (snake_case) en `Resource` (camelCase). */
export function toResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    type: row.type as Resource['type'],
    title: row.title,
    tags: JSON.parse(row.tags) as string[],
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.url !== null ? { url: row.url } : {}),
    ...(row.content !== null ? { content: row.content } : {}),
    ...(row.embedding_model !== null ? { embeddingModel: row.embedding_model } : {}),
    ...(row.project_id !== null ? { projectId: row.project_id } : {}),
  };
}
