import type Database from 'better-sqlite3';

import { EMBEDDING_DIMENSIONS, TABLES, VECTOR_SCHEMA } from '../shared/constants.js';
import {
  EmbeddingSpaceMismatchError,
  EmbeddingsError,
  IndexingError,
  SearchError,
} from '../shared/errors.js';
import type { SearchResult } from '../shared/types.js';
import { DEFAULT_LIMIT, assertLimit, toResource, type ResourceRow } from './fts-repository.js';

/** Ligne de la jointure KNN, enrichie de la distance brute. */
interface VectorRow extends ResourceRow {
  distance: number;
}

/**
 * Ligne de la table `embedding_spaces`.
 *
 * Une seule ligne est active à la fois : `bindSpace()` supprime les autres.
 */
interface EmbeddingSpaceRow {
  space: string;
  provider: string;
  model: string;
  dimensions: number;
  updated_at: string;
}

/** Liaison de l'index à un espace d'embedding. */
export interface EmbeddingSpaceBinding {
  space: string;
  provider: string;
  model: string;
  dimensions: number;
  updatedAt: string;
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
  private readonly bindSpaceStatement: Database.Statement | undefined;
  private readonly clearSpacesStatement: Database.Statement | undefined;
  private readonly readSpaceStatement: Database.Statement | undefined;

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
    this.bindSpaceStatement = connection.prepare(`
      INSERT INTO ${TABLES.embeddingSpaces} (space, provider, model, dimensions, created_at, updated_at)
      VALUES (@space, @provider, @model, @dimensions, @now, @now)
      ON CONFLICT(space) DO UPDATE
        SET provider = excluded.provider,
            model = excluded.model,
            dimensions = excluded.dimensions,
            updated_at = excluded.updated_at
    `);
    this.clearSpacesStatement = connection.prepare(
      `DELETE FROM ${TABLES.embeddingSpaces} WHERE space <> ?`,
    );
    this.readSpaceStatement = connection.prepare(`
      SELECT space, provider, model, dimensions, updated_at
        FROM ${TABLES.embeddingSpaces}
       ORDER BY updated_at DESC, space ASC
       LIMIT 1
    `);
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

  /**
   * Lie l'index à un espace d'embedding.
   *
   * Remplace la liaison précédente : un index ne peut être comparé qu'à un seul
   * repère à la fois. Appelé par l'indexer avant la première écriture.
   *
   * @param binding - Espace, fournisseur, modèle et dimensions.
   * @throws {IndexingError} Table `embedding_spaces` absente ou écriture refusée.
   */
  bindSpace(binding: Omit<EmbeddingSpaceBinding, 'updatedAt'>): void {
    if (this.bindSpaceStatement === undefined) {
      return;
    }

    const now = new Date().toISOString();
    const apply = this.connection.transaction(() => {
      this.bindSpaceStatement?.run({
        space: binding.space,
        provider: binding.provider,
        model: binding.model,
        dimensions: binding.dimensions,
        now,
      });
      this.clearSpacesStatement?.run(binding.space);
    });

    try {
      apply();
    } catch (error) {
      throw new IndexingError('liaison de l’espace d’embedding', { cause: error });
    }
  }

  /** Espace actuellement lié à l'index, ou `null` si aucun. */
  activeSpace(): EmbeddingSpaceBinding | null {
    if (this.readSpaceStatement === undefined) {
      return null;
    }

    const row = this.readSpaceStatement.get() as EmbeddingSpaceRow | undefined;

    if (row === undefined) {
      return null;
    }

    return {
      space: row.space,
      provider: row.provider,
      model: row.model,
      dimensions: row.dimensions,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Refuse d'écrire dans un index construit avec un autre espace.
   *
   * Sans ce garde-fou, une bascule de fournisseur remplirait l'index de
   * vecteurs issus de deux modèles : aucune erreur, mais un rappel
   * silencieusement dégradé. La sortie est explicite
   * (`EmbeddingSpaceMismatchError`) et indique comment repartir proprement.
   *
   * @throws {EmbeddingSpaceMismatchError} Index non vide d'un autre espace.
   */
  assertSpace(space: string): void {
    const active = this.activeSpace();

    if (active === null || active.space === space || this.count() === 0) {
      return;
    }

    throw new EmbeddingSpaceMismatchError(active.space, space);
  }

  /**
   * Vide l'index vectoriel et oublie l'espace lié.
   *
   * @returns Nombre de vecteurs supprimés.
   * @throws {IndexingError} Purge refusée par SQLite.
   */
  clearAll(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    const removed = this.count();
    const clear = this.connection.transaction(() => {
      this.connection.prepare(`DELETE FROM ${VECTOR_SCHEMA}.${TABLES.resourcesVectors}`).run();
      this.connection.prepare(`DELETE FROM ${TABLES.embeddingSpaces}`).run();
    });

    try {
      clear();
    } catch (error) {
      throw new IndexingError('purge de l’index vectoriel', { cause: error });
    }

    return removed;
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
