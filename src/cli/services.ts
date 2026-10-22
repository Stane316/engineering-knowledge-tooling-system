import type Database from 'better-sqlite3';

import { EmbeddingsService, type IEmbeddingsService } from '../business/embeddings.js';
import { createKnowledgeManager } from '../business/knowledge-manager.js';
import {
  GatewayEmbeddingProvider,
  resolveEmbeddingSpace,
} from '../business/providers/embedding-provider.js';
import { createProviderGateway } from '../business/providers/gateway.js';
import { SearchEngine } from '../business/search-engine.js';
import type { ISearchEngine } from '../business/search-engine.types.js';
import {
  VectorIndexer,
  withVectorIndexing,
  type EmbeddingSpace,
  type IVectorIndexer,
  type VectorReindexReport,
} from '../business/vector-indexer.js';
import type { IKnowledgeManager } from '../business/knowledge-manager.types.js';
import { openDatabase, type DatabasePaths, type EktsDatabase } from '../data/database.js';
import { FTSRepository } from '../data/fts-repository.js';
import { VectorRepository } from '../data/vector-repository.js';
import { DEFAULT_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '../shared/constants.js';
import { EmbeddingsError, NoProviderAvailableError } from '../shared/errors.js';
import { usableProviders } from '../shared/providers/catalog.js';
import type { Resource } from '../shared/validators.js';

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
  /** Espace de l'index lorsque `embeddings` est injecté (défaut : déduit du modèle). */
  readonly embeddingSpace?: EmbeddingSpace;
  /** Défaut : `auto`. */
  readonly embeddingsMode?: EmbeddingsMode;
  /** Applique les migrations à l'ouverture (défaut : `true`). */
  readonly migrate?: boolean;
  /**
   * Environnement à consulter pour résoudre les fournisseurs.
   *
   * Omis, la production s'applique : `process.env`, complété par `.env` et par
   * `providers.custom.json`, comme le fait la CLI au démarrage. Fourni — même
   * vide — la résolution devient **hermétique** : aucun fichier du disque n'est
   * lu, seules les variables de cet objet comptent. C'est le mode des tests :
   * le `.env` du poste ne doit jamais décider du résultat d'une suite.
   */
  readonly env?: NodeJS.ProcessEnv;
}

/** Services ouverts pendant la durée d'une commande. */
export interface CliServices {
  readonly database: EktsDatabase;
  readonly manager: IKnowledgeManager;
  readonly paths: DatabasePaths;
  /** Absent quand les embeddings sont désactivés, hors ligne ou non configurés. */
  readonly embeddings: IEmbeddingsService | undefined;
  /** Espace servi par le fournisseur courant (absent sans embeddings). */
  readonly embeddingSpace: EmbeddingSpace | undefined;
  /**
   * Indexer tolérant aux pannes, présent uniquement en mode `auto`.
   * Il permet à `add` de connaître l'issue réelle de l'indexation vectorielle.
   */
  readonly vectorIndexer: BestEffortVectorIndexer | undefined;
  close(): void;
}

/** Résultat d'une tentative d'indexation vectorielle. */
export interface VectorOutcome {
  indexed: boolean;
  /** Message d'erreur du fournisseur, présent seulement en cas d'échec. */
  message?: string;
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
 * Indexer qui **n'échoue jamais** sur `indexResource`.
 *
 * L'ajout d'une ressource ne doit pas être perdu parce que le fournisseur
 * d'embeddings est momentanément indisponible (quota épuisé, 429, réseau). La
 * ressource reste créée et indexée en plein texte ; l'échec est conservé pour
 * être **rapporté** à l'utilisateur, jamais silencieux.
 *
 * `removeResource` et `reindexAll` délèguent sans intercepter : une suppression
 * ou une réindexation complète doit signaler ses propres erreurs.
 */
export class BestEffortVectorIndexer implements IVectorIndexer {
  private last: { id: string; outcome: VectorOutcome } = {
    id: '',
    outcome: { indexed: false },
  };

  constructor(private readonly inner: IVectorIndexer) {}

  async indexResource(resource: Resource): Promise<void> {
    try {
      await this.inner.indexResource(resource);
      this.last = { id: resource.id, outcome: { indexed: true } };
    } catch (error) {
      this.last = {
        id: resource.id,
        outcome: {
          indexed: false,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  removeResource(resourceId: string): void {
    this.inner.removeResource(resourceId);
  }

  reindexAll(resources: readonly Resource[]): Promise<VectorReindexReport> {
    return this.inner.reindexAll(resources);
  }

  /** Issue de la dernière indexation pour cette ressource. */
  outcome(resourceId: string): VectorOutcome {
    return this.last.id === resourceId ? this.last.outcome : { indexed: false };
  }
}

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
 * Mode hors ligne : aucune résolution de fournisseur, aucun appel réseau.
 *
 * Utile aux tests et aux environnements sans crédits. Reconnu : `1`, `true`,
 * `yes` (insensible à la casse).
 */
export function isOffline(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.EKTS_OFFLINE?.trim().toLowerCase();

  return raw === '1' || raw === 'true' || raw === 'yes';
}

/**
 * Ouvre les services CLI.
 *
 * Les embeddings sont résolus selon `embeddingsMode` :
 * - `disabled` : aucun appel, aucun accès au fichier `.env` ;
 * - `auto` : tentative, absence tolérée (l'ajout reste possible en FTS seul) ;
 * - `required` : l'erreur d'origine est propagée (aucun fournisseur configuré,
 *   `EKTS_OFFLINE`, registre de fournisseurs invalide).
 *
 * La résolution passe par la **passerelle multi-fournisseurs** : la première
 * clé disponible parmi OpenAI, Gemini, OpenRouter et Novita suffit, avec
 * rotation et repli. Un seul espace d'embedding est servi par index.
 *
 * Quand `options.env` est fourni, **aucun fichier n'est lu** : ni `.env`, ni
 * `providers.custom.json`. C'est ce qui rend les tests indépendants du poste
 * de développement ; la CLI réelle n'injecte rien et conserve donc le
 * chargement de `.env` au démarrage.
 *
 * @throws {NoProviderAvailableError} Mode `required` et aucun fournisseur.
 * @throws {EmbeddingsError} Mode `required` et `EKTS_OFFLINE`.
 */
export function openCliServices(options: OpenServicesOptions): CliServices {
  const database = openDatabase({
    dataDir: options.dataDir,
    ...(options.migrate === undefined ? {} : { migrate: options.migrate }),
  });

  try {
    const { manager: plain } = createKnowledgeManager(database.connection);
    const resolved = resolveEmbeddings(options);

    if (resolved === undefined) {
      return {
        database,
        manager: plain,
        paths: database.paths,
        embeddings: undefined,
        embeddingSpace: undefined,
        vectorIndexer: undefined,
        close: once(database),
      };
    }

    const indexer = new VectorIndexer(resolved.service, new VectorRepository(database.connection), {
      space: resolved.space,
    });
    const needsTolerance = (options.embeddingsMode ?? 'auto') === 'auto';
    const tolerant = needsTolerance ? new BestEffortVectorIndexer(indexer) : undefined;

    return {
      database,
      manager: withVectorIndexing(plain, tolerant ?? indexer),
      paths: database.paths,
      embeddings: resolved.service,
      embeddingSpace: resolved.space,
      vectorIndexer: tolerant,
      close: once(database),
    };
  } catch (error) {
    database.close();
    throw error;
  }
}

/** Fermeture idempotente : `close()` deux fois ne lève pas. */
function once(database: EktsDatabase): () => void {
  let closed = false;

  return () => {
    if (!closed) {
      closed = true;
      database.close();
    }
  };
}

/**
 * Espace d'embedding associé à un service injecté.
 *
 * Le nom suit la convention `fournisseur/modèle` du registre (`openai/…`). Un
 * service sans propriété `model` (tests, doublures) retombe sur la
 * configuration d'environnement.
 *
 * @param service - Service d'embeddings (injecté ou résolu).
 * @param env - Environnement consulté pour `OPENAI_EMBEDDING_MODEL`.
 */
export function embeddingSpace(
  service: IEmbeddingsService,
  env: NodeJS.ProcessEnv = process.env,
): EmbeddingSpace {
  const model = modelOf(service, env);

  return {
    space: `openai/${model}`,
    provider: 'openai',
    model,
    dimensions: EMBEDDING_DIMENSIONS,
  };
}

function modelOf(service: IEmbeddingsService, env: NodeJS.ProcessEnv): string {
  const candidate = (service as Partial<EmbeddingsService>).model;

  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }

  const fromEnv = env.OPENAI_EMBEDDING_MODEL?.trim();

  return fromEnv === undefined || fromEnv.length === 0 ? DEFAULT_EMBEDDING_MODEL : fromEnv;
}

interface ResolvedEmbeddings {
  service: IEmbeddingsService;
  space: EmbeddingSpace;
}

function resolveEmbeddings(options: OpenServicesOptions): ResolvedEmbeddings | undefined {
  if (options.embeddings !== undefined) {
    return {
      service: options.embeddings,
      space:
        options.embeddingSpace ?? embeddingSpace(options.embeddings, options.env ?? process.env),
    };
  }

  const mode = options.embeddingsMode ?? 'auto';

  if (mode === 'disabled') {
    return undefined;
  }

  if (isOffline(options.env)) {
    if (mode === 'required') {
      throw new EmbeddingsError(
        'EKTS_OFFLINE est actif : les embeddings sont désactivés. Retirez EKTS_OFFLINE du .env ou utilisez --mode fts.',
      );
    }

    return undefined;
  }

  try {
    const resolved = createGatewayEmbeddings(options.env);

    if (resolved === undefined && mode === 'required') {
      throw new NoProviderAvailableError(
        'embedding',
        usableProviders('embedding').map(
          (provider) => `${provider.id}: clé absente (${provider.envKeys.join(' ou ')})`,
        ),
      );
    }

    return resolved;
  } catch (error) {
    if (mode === 'required') {
      throw error;
    }

    return undefined;
  }
}

/**
 * Résout les embeddings via la passerelle (rotation de clés, repli ordonné).
 *
 * @param env - Environnement injecté (tests) ; omis, la passerelle charge
 *   elle-même `.env` et `providers.custom.json`.
 * @returns `undefined` si aucun fournisseur d'embedding n'a de clé.
 */
function createGatewayEmbeddings(
  env: NodeJS.ProcessEnv | undefined,
): ResolvedEmbeddings | undefined {
  const gateway = createProviderGateway(env === undefined ? {} : { env });
  const routes = gateway.plan('embedding');

  if (routes.length === 0) {
    return undefined;
  }

  const space = resolveEmbeddingSpace(gateway);
  const provider = new GatewayEmbeddingProvider(gateway, { space: space.space });

  return {
    service: new EmbeddingsService({ provider }),
    // `alignToSchema` ramène tout vecteur à 1536 dimensions : la largeur
    // stockée est celle du schéma, pas la dimension native du modèle.
    space: { ...space, dimensions: EMBEDDING_DIMENSIONS },
  };
}
