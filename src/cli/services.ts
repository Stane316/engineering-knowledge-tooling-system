import type Database from 'better-sqlite3';

import {
  createEmbeddingsService,
  type EmbeddingsService,
  type IEmbeddingsService,
} from '../business/embeddings.js';
import { createKnowledgeManager } from '../business/knowledge-manager.js';
import { SearchEngine } from '../business/search-engine.js';
import type { ISearchEngine } from '../business/search-engine.types.js';
import { VectorIndexer, withVectorIndexing } from '../business/vector-indexer.js';
import { openDatabase, type DatabasePaths, type EktsDatabase } from '../data/database.js';
import { FTSRepository } from '../data/fts-repository.js';
import { VectorRepository } from '../data/vector-repository.js';
import { DEFAULT_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '../shared/constants.js';
import { EmbeddingsError } from '../shared/errors.js';
import type { IKnowledgeManager } from '../business/knowledge-manager.types.js';

/**
 * Câblage des services utilisés par la CLI.
 *
 * Une seule connexion better-sqlite3 porte les trois schémas (`main`, `fts`,
 * `vectors`), conformément au Data Layer : la CLI ne doit jamais ouvrir trois
 * connexions séparées, sous peine de ne plus voir les mêmes transactions.
 */

/** Politique de résolution du service d'embeddings. */
export type EmbeddingsMode =
  /** Tente de créer le service ; son absence n'est pas une erreur. */
  | 'auto'
  /** N'utilise jamais d'embeddings (commandes de lecture seule). */
  | 'disabled'
  /** Exige le service (recherche hybride/vectorielle). */
  | 'required';

export interface OpenServicesOptions {
  /** Répertoire des trois bases SQLite. */
  readonly dataDir: string;
  /** Service injecté (tests) ; prioritaire sur `embeddingsMode`. */
  readonly embeddings?: IEmbeddingsService;
  /** Défaut : `auto`. */
  readonly embeddingsMode?: EmbeddingsMode;
  /** Applique les migrations à l'ouverture (défaut : `true`). */
  readonly migrate?: boolean;
}

/** Services ouverts pendant la durée d'une commande. */
export interface CliServices {
  readonly database: EktsDatabase;
  readonly manager: IKnowledgeManager;
  readonly paths: DatabasePaths;
  /** Absent quand les embeddings sont désactivés ou non configurés. */
  readonly embeddings: IEmbeddingsService | undefined;
  close(): void;
}

/**
 * Service d'embeddings de secours, utilisé uniquement par `--mode fts`.
 * Toute tentative d'appel révèle l'incohérence au lieu de renvoyer un vecteur
 * vide, qui fausserait silencieusement le classement.
 */
export const UNAVAILABLE_EMBEDDINGS: IEmbeddingsService = {
  embed: () =>
    Promise.reject(new EmbeddingsError('embeddings non configurés : cette opération en exige un')),
  embedBatch: () =>
    Promise.reject(new EmbeddingsError('embeddings non configurés : cette opération en exige un')),
};

/**
 * Construit le moteur de recherche sur une connexion existante.
 *
 * @param connection - Connexion à la base principale (schémas attachés).
 * @param embeddings - Service d'embeddings ; à défaut, un service qui échoue.
 */
export function createSearchEngine(
  connection: Database.Database,
  embeddings: IEmbeddingsService = UNAVAILABLE_EMBEDDINGS,
): ISearchEngine {
  return new SearchEngine({
    fts: new FTSRepository(connection),
    vectors: new VectorRepository(connection),
    embeddings,
  });
}

/**
 * Ouvre les services CLI.
 *
 * Les embeddings sont résolus selon `embeddingsMode` :
 * - `disabled` : aucun appel, aucun accès au fichier `.env` ;
 * - `auto` : tentative, absence tolérée (l'ajout reste possible en FTS seul) ;
 * - `required` : l'erreur d'origine est propagée (clé absente, dimension
 *   incompatible).
 *
 * @throws {EmbeddingsError} Mode `required` et service indisponible.
 */
export function openCliServices(options: OpenServicesOptions): CliServices {
  const database = openDatabase({
    dataDir: options.dataDir,
    ...(options.migrate === undefined ? {} : { migrate: options.migrate }),
  });

  try {
    const { manager: plain } = createKnowledgeManager(database.connection);
    const embeddings = resolveEmbeddings(options);
    const manager =
      embeddings === undefined
        ? plain
        : withVectorIndexing(
            plain,
            new VectorIndexer(embeddings, new VectorRepository(database.connection), {
              space: embeddingSpace(embeddings),
            }),
          );

    let closed = false;

    return {
      database,
      manager,
      paths: database.paths,
      embeddings,
      close: () => {
        if (!closed) {
          closed = true;
          database.close();
        }
      },
    };
  } catch (error) {
    database.close();
    throw error;
  }
}

/**
 * Espace d'embedding associé au service.
 *
 * Le nom suit la convention `fournisseur/modèle` du registre (`openai/…`). Un
 * service injecté sans propriété `model` (tests) retombe sur la configuration
 * d'environnement.
 */
export function embeddingSpace(service: IEmbeddingsService): {
  space: string;
  provider: string;
  model: string;
  dimensions: number;
} {
  const model = modelOf(service);

  return {
    space: `openai/${model}`,
    provider: 'openai',
    model,
    dimensions: EMBEDDING_DIMENSIONS,
  };
}

function modelOf(service: IEmbeddingsService): string {
  const candidate = (service as Partial<EmbeddingsService>).model;

  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }

  const fromEnv = process.env.OPENAI_EMBEDDING_MODEL?.trim();

  return fromEnv === undefined || fromEnv.length === 0 ? DEFAULT_EMBEDDING_MODEL : fromEnv;
}

function resolveEmbeddings(options: OpenServicesOptions): IEmbeddingsService | undefined {
  if (options.embeddings !== undefined) {
    return options.embeddings;
  }

  if (options.embeddingsMode === 'disabled') {
    return undefined;
  }

  try {
    return createEmbeddingsService();
  } catch (error) {
    if (options.embeddingsMode === 'required') {
      throw error;
    }

    return undefined;
  }
}
