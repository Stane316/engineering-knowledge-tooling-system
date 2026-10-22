import type Database from 'better-sqlite3';

import { EMBEDDING_DIMENSIONS, TABLES, VECTOR_SCHEMA } from '../shared/constants.js';
import { EmbeddingsError, IndexingError, SearchError } from '../shared/errors.js';
import type { SearchResult } from '../shared/types.js';
import { DEFAULT_LIMIT, assertLimit, toResource, type ResourceRow } from './fts-repository.js';

/** Ligne de la jointure KNN, enrichie de la distance brute. */
interface VectorRow extends ResourceRow {
  distance: number;
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
  'r.created_at',
  'r.updated_at',
].join(', ');

/**
 * Normalise un vecteur à la norme euclidienne 1 et le convertit en `Float32Array`.
 *
 * **Pourquoi normaliser ?** La table `vectors.resources_vectors` a été créée par
 * la migration 001 sans option `distance_metric`, donc `sqlite-vec` applique la
 * distance L2 par défaut. Or la spécification demande une similarité
 * **cosinus**. Pour deux vecteurs unitaires :
 *
 * ```text
 * ||a - b||² = 2 - 2·cos(a, b)   ⟹   cos(a, b) = 1 - distance² / 2
 * ```
 *
 * Normaliser à l'écriture **et** à la lecture rend le classement L2 de vec0
 * strictement équivalent au classement cosinus, sans migration destructive.
 * (vec0 0.1.9 sait faire `distance_metric=cosine`, mais l'activer imposerait de
 * recréer la table — voir `docs/guides/SEARCH_ENGINE.md`, écart E4-6.)
 *
 * @param vector - Vecteur brut (sortie du modèle d'embedding).
 * @returns Vecteur unitaire encodé en float32 (format attendu par vec0).
 * @throws {EmbeddingsError} Dimension incorrecte, valeur non finie ou vecteur nul.
 */
export function encodeEmbedding(vector: readonly number[]): Buffer {
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new EmbeddingsError(
      `dimension ${vector.length} au lieu de ${EMBEDDING_DIMENSIONS} (le schéma est figé sur float[${EMBEDDING_DIMENSIONS}])`,
    );
  }

  let sumOfSquares = 0;
  for (const value of vector) {
    if (!Number.isFinite(value)) {
      throw new EmbeddingsError('le vecteur contient une valeur non finie (NaN/Infinity)');
    }
    sumOfSquares += value * value;
  }

  const norm = Math.sqrt(sumOfSquares);
  if (norm === 0) {
    throw new EmbeddingsError('le vecteur est nul : impossible de le normaliser');
  }

  const normalized = new Float32Array(EMBEDDING_DIMENSIONS);
  for (let index = 0; index < vector.length; index += 1) {
    normalized[index] = (vector[index] as number) / norm;
  }

  return Buffer.from(normalized.buffer, normalized.byteOffset, normalized.byteLength);
}

/**
 * Décode un blob float32 en tableau de nombres.
 *
 * @param blob - Valeur `BLOB` renvoyée par SQLite.
 */
export function decodeEmbedding(blob: Buffer): number[] {
  const bytes = blob.buffer.slice(
    blob.byteOffset,
    blob.byteOffset + blob.byteLength,
  ) as ArrayBuffer;
  return Array.from(new Float32Array(bytes));
}

/**
 * Repository de l'index vectoriel (`ekts-vectors.db`, extension `sqlite-vec`).
 *
 * Trois contraintes structurantes vérifiées empiriquement sur sqlite-vec 0.1.9 :
 *
 * 1. la recherche KNN **exige** `WHERE embedding MATCH ? AND k = ?` : l'opérateur
 *    `<=>` du blueprint n'existe pas (`near ">": syntax error`) et une requête
 *    `MATCH` sans `k` échoue (`A LIMIT or 'k = ?' constraint is required`) ;
 * 2. `INSERT OR REPLACE` est **refusé** sur la clé primaire d'une table `vec0`
 *    (`UNIQUE constraint failed`) : le remplacement se fait par `DELETE` + `INSERT`
 *    dans une transaction ;
 * 3. un vecteur de dimension incorrecte lève une erreur native peu lisible
 *    (`Dimension mismatch…`) : on valide avant l'appel SQL.
 */
export class VectorRepository {
  private readonly searchStatement: Database.Statement | undefined;
  private readonly insertStatement: Database.Statement | undefined;
  private readonly deleteStatement: Database.Statement | undefined;
  private readonly getStatement: Database.Statement | undefined;
  private readonly countStatement: Database.Statement | undefined;

  constructor(private readonly connection: Database.Database) {
    if (!this.hasTable()) {
      return;
    }

    const table = `${VECTOR_SCHEMA}.${TABLES.resourcesVectors}`;
    this.searchStatement = connection.prepare(`
      SELECT ${SELECT_COLUMNS}, v.distance AS distance
        FROM ${table} v
        JOIN ${TABLES.resources} r ON r.id = v.resource_id
       WHERE v.embedding MATCH ? AND k = ?
       ORDER BY v.distance ASC
    `);
    this.insertStatement = connection.prepare(
      `INSERT INTO ${table} (resource_id, embedding) VALUES (?, ?)`,
    );
    this.deleteStatement = connection.prepare(`DELETE FROM ${table} WHERE resource_id = ?`);
    this.getStatement = connection.prepare(`SELECT embedding FROM ${table} WHERE resource_id = ?`);
    this.countStatement = connection.prepare(`SELECT count(*) AS n FROM ${table}`);
  }

  /** L'index vectoriel est-il disponible (extension chargée, table créée) ? */
  isAvailable(): boolean {
    return this.hasTable();
  }

  /**
   * Recherche des plus proches voisins par similarité cosinus.
   *
   * @param embedding - Vecteur de requête (1536 dimensions).
   * @param limit - Nombre de voisins demandés (entier > 0, sert de `k`).
   * @returns Résultats triés du plus similaire au moins similaire.
   * @throws {SearchError} Limite invalide, index absent ou erreur SQLite.
   * @throws {EmbeddingsError} Vecteur de requête invalide.
   */
  async search(
    embedding: readonly number[],
    limit: number = DEFAULT_LIMIT,
  ): Promise<SearchResult[]> {
    assertLimit(limit);

    if (this.searchStatement === undefined) {
      throw new SearchError('index vectoriel indisponible (table absente)');
    }

    const query = encodeEmbedding(embedding);
    const statement = this.searchStatement;

    try {
      const rows = statement.all(query, limit) as VectorRow[];
      return rows.map((row) => ({
        resource: toResource(row),
        score: cosineSimilarity(row.distance),
        source: 'vector',
      }));
    } catch (error) {
      throw new SearchError('recherche vectorielle KNN', { cause: error });
    }
  }

  /**
   * Insère ou remplace l'embedding d'une ressource.
   *
   * @param resourceId - Identifiant de la ressource.
   * @param embedding - Vecteur (1536 dimensions), normalisé avant stockage.
   * @throws {IndexingError} Index absent ou écriture refusée par SQLite.
   * @throws {EmbeddingsError} Vecteur invalide.
   */
  insertEmbedding(resourceId: string, embedding: readonly number[]): void {
    if (this.insertStatement === undefined || this.deleteStatement === undefined) {
      throw new IndexingError('index vectoriel indisponible (table absente)');
    }

    const blob = encodeEmbedding(embedding);
    const insert = this.insertStatement;
    const remove = this.deleteStatement;

    const replace = this.connection.transaction(() => {
      remove.run(resourceId);
      insert.run(resourceId, blob);
    });

    try {
      replace();
    } catch (error) {
      throw new IndexingError(`écriture du vecteur de ${resourceId}`, { cause: error });
    }
  }

  /**
   * Supprime l'embedding d'une ressource.
   *
   * @returns `true` si une ligne a été supprimée, `false` sinon (idempotent).
   */
  deleteEmbedding(resourceId: string): boolean {
    if (this.deleteStatement === undefined) {
      return false;
    }

    try {
      return this.deleteStatement.run(resourceId).changes > 0;
    } catch (error) {
      throw new IndexingError(`suppression du vecteur de ${resourceId}`, { cause: error });
    }
  }

  /** Vecteur stocké pour une ressource, ou `null`. */
  getEmbedding(resourceId: string): number[] | null {
    if (this.getStatement === undefined) {
      return null;
    }

    const row = this.getStatement.get(resourceId) as { embedding: Buffer } | undefined;
    return row === undefined ? null : decodeEmbedding(row.embedding);
  }

  /** Nombre de vecteurs indexés. */
  count(): number {
    if (this.countStatement === undefined) {
      return 0;
    }

    const row = this.countStatement.get() as { n: number };
    return row.n;
  }

  private hasTable(): boolean {
    const row = this.connection
      .prepare(
        `SELECT 1 AS found FROM ${VECTOR_SCHEMA}.sqlite_master WHERE type = 'table' AND name = ?`,
      )
      .get(TABLES.resourcesVectors);

    return row !== undefined;
  }
}

/**
 * Convertit une distance L2 entre vecteurs unitaires en similarité cosinus.
 *
 * @param distance - Distance renvoyée par vec0 (`||a - b||`).
 * @returns Similarité dans `[-1, 1]` (1 = identique, 0 = orthogonal, -1 = opposé).
 */
export function cosineSimilarity(distance: number): number {
  // `1 - d²/2 <= 1` par construction : seule la borne basse peut être franchie.
  return Math.max(-1, 1 - (distance * distance) / 2);
}
