import OpenAI from 'openai';

import { DEFAULT_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '../shared/constants.js';
import { EmbeddingsError } from '../shared/errors.js';

/** Nombre de textes envoyés par appel API (limite OpenAI : 2048). */
export const DEFAULT_BATCH_SIZE = 64;

/**
 * Fournisseur d'embeddings : unique point d'entrée réseau.
 *
 * L'abstraction permet d'injecter :
 * - `OpenAIEmbeddingProvider` en production ;
 * - un fournisseur déterministe local dans les tests et le benchmark (aucun
 *   appel réseau, aucun coût).
 */
export interface EmbeddingProvider {
  /** Modèle utilisé (journalisé, comparé d'une exécution à l'autre). */
  readonly model: string;
  /** Dimension produite, contrôlée contre le schéma `float[1536]`. */
  readonly dimensions: number;
  /**
   * Calcule les embeddings d'un lot de textes.
   *
   * @param texts - Textes non vides (au moins un).
   * @returns Un vecteur par texte, **dans l'ordre d'entrée**.
   */
  embed(texts: readonly string[]): Promise<number[][]>;
}

/** Contrat du service d'embeddings (découpage en lots + validation). */
export interface IEmbeddingsService {
  /**
   * Embedding d'un texte.
   *
   * @throws {EmbeddingsError} Texte vide, appel en échec ou réponse invalide.
   */
  embed(text: string): Promise<number[]>;

  /**
   * Embeddings de plusieurs textes, découpés en lots.
   *
   * @param texts - Textes à encoder (`[]` renvoie `[]` sans appel réseau).
   * @throws {EmbeddingsError} Au moins un texte vide, appel en échec ou réponse invalide.
   */
  embedBatch(texts: readonly string[]): Promise<number[][]>;
}

export interface EmbeddingsServiceOptions {
  provider: EmbeddingProvider;
  /** Taille des lots (défaut : {@link DEFAULT_BATCH_SIZE}). */
  batchSize?: number;
}

/**
 * Service d'embeddings : segmentation en lots et **validation stricte** des
 * réponses du fournisseur.
 *
 * Toute réponse incohérente (nombre de vecteurs, dimension, valeur non finie)
 * est rejetée ici plutôt que propagée jusqu'à `sqlite-vec`, qui produirait une
 * erreur native illisible (`Dimension mismatch…`).
 */
export class EmbeddingsService implements IEmbeddingsService {
  private readonly provider: EmbeddingProvider;
  private readonly batchSize: number;

  constructor(options: EmbeddingsServiceOptions) {
    const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
      throw new EmbeddingsError(
        `taille de lot invalide (${String(batchSize)}) : entier > 0 attendu`,
      );
    }

    this.provider = options.provider;
    this.batchSize = batchSize;
  }

  /** Modèle utilisé par le fournisseur sous-jacent. */
  get model(): string {
    return this.provider.model;
  }

  async embed(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text]);
    // `embedBatch` garantit un résultat par entrée : l'assertion est sûre.
    return embedding as number[];
  }

  async embedBatch(texts: readonly string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    texts.forEach((text, index) => {
      if (text.trim().length === 0) {
        throw new EmbeddingsError(`texte vide à l'indice ${index} : refusé par l'API`);
      }
    });

    const embeddings: number[][] = [];

    for (let start = 0; start < texts.length; start += this.batchSize) {
      const batch = texts.slice(start, start + this.batchSize);
      embeddings.push(...(await this.invoke(batch)));
    }

    return embeddings;
  }

  private async invoke(batch: readonly string[]): Promise<number[][]> {
    let vectors: number[][];
    try {
      vectors = await this.provider.embed(batch);
    } catch (error) {
      if (error instanceof EmbeddingsError) {
        throw error;
      }
      const detail = error instanceof Error ? error.message : String(error);
      throw new EmbeddingsError(`appel au fournisseur d\u2019embeddings : ${detail}`, {
        cause: error,
      });
    }

    if (vectors.length !== batch.length) {
      throw new EmbeddingsError(
        `${vectors.length} vecteur(s) reçu(s) pour ${batch.length} texte(s)`,
      );
    }

    vectors.forEach((vector, index) => {
      if (vector.length !== this.provider.dimensions) {
        throw new EmbeddingsError(
          `vecteur ${index} de dimension ${vector.length} au lieu de ${this.provider.dimensions}`,
        );
      }

      if (!vector.every((value) => Number.isFinite(value))) {
        throw new EmbeddingsError(`vecteur ${index} contient une valeur non finie`);
      }
    });

    return vectors;
  }
}

export interface OpenAIEmbeddingProviderOptions {
  /** Clé API (jamais journalisée ni sérialisée). */
  apiKey: string;
  model?: string;
  dimensions?: number;
  /** Client pré-construit (injection de test). */
  client?: OpenAI;
  /** `fetch` de substitution pour les tests HTTP (aucune socket ouverte). */
  fetch?: typeof globalThis.fetch;
}

/** Fournisseur d'embeddings adossé à l'API OpenAI (`/v1/embeddings`). */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  private readonly client: OpenAI;

  constructor(options: OpenAIEmbeddingProviderOptions) {
    if (options.apiKey.trim().length === 0) {
      throw new EmbeddingsError('OPENAI_API_KEY vide');
    }

    this.model = options.model ?? DEFAULT_EMBEDDING_MODEL;
    this.dimensions = options.dimensions ?? EMBEDDING_DIMENSIONS;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      });
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: [...texts],
      dimensions: this.dimensions,
    });

    return [...response.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding as number[]);
  }
}

/** Options de {@link createEmbeddingsService}. */
export interface CreateEmbeddingsServiceOptions {
  /** Variables d'environnement (défaut : `process.env`). */
  env?: NodeJS.ProcessEnv;
  /** `fetch` de substitution (tests HTTP). */
  fetch?: typeof globalThis.fetch;
  /** Client pré-construit (tests). */
  client?: OpenAI;
}

/**
 * Construit le service d'embeddings à partir de l'environnement.
 *
 * Variables lues :
 * - `OPENAI_API_KEY` (obligatoire) ;
 * - `OPENAI_EMBEDDING_MODEL` (défaut : `text-embedding-3-small`) ;
 * - `EMBEDDING_DIMENSION` (défaut : 1536 — **doit** correspondre au schéma).
 *
 * @throws {EmbeddingsError} Clé absente ou dimension incompatible avec le schéma.
 */
export function createEmbeddingsService(
  options: CreateEmbeddingsServiceOptions = {},
): EmbeddingsService {
  const env = options.env ?? process.env;
  const apiKey = env.OPENAI_API_KEY?.trim();

  if (apiKey === undefined || apiKey.length === 0) {
    throw new EmbeddingsError(
      'OPENAI_API_KEY absente : renseignez-la dans .env (voir .env.example)',
    );
  }

  const model = env.OPENAI_EMBEDDING_MODEL?.trim();
  const dimensions = parseDimension(env.EMBEDDING_DIMENSION);

  const provider = new OpenAIEmbeddingProvider({
    apiKey,
    dimensions,
    ...(model === undefined || model.length === 0 ? {} : { model }),
    ...(options.client === undefined ? {} : { client: options.client }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
  });

  return new EmbeddingsService({ provider });
}

/** Lit `EMBEDDING_DIMENSION` et vérifie la cohérence avec le schéma. */
function parseDimension(raw: string | undefined): number {
  if (raw === undefined || raw.trim().length === 0) {
    return EMBEDDING_DIMENSIONS;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new EmbeddingsError(`EMBEDDING_DIMENSION invalide (${raw}) : entier > 0 attendu`);
  }

  if (parsed !== EMBEDDING_DIMENSIONS) {
    throw new EmbeddingsError(
      `EMBEDDING_DIMENSION=${parsed} incompatible avec le schéma (float[${EMBEDDING_DIMENSIONS}]) : migration requise`,
    );
  }

  return parsed;
}
