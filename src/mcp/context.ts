import type { IEmbeddingsService } from '../business/embeddings.js';
import type { IKnowledgeManager } from '../business/knowledge-manager.types.js';
import type { ISearchEngine } from '../business/search-engine.types.js';
import { createSearchEngine, openCliServices, type CliServices } from '../cli/services.js';
import { loadConfig } from '../shared/config.js';

/**
 * Contexte d'exécution des outils MCP.
 *
 * Les outils ignorent **comment** les services sont construits : ils reçoivent
 * ce contrat minimal, ce qui permet de les tester sur une base SQLite réelle
 * temporaire, sans maquette ni variable globale.
 */
export interface McpToolContext {
  /** Lecture des ressources (Sprint 3). */
  readonly manager: IKnowledgeManager;
  /** Recherche lexicale, vectorielle et hybride (Sprint 4). */
  readonly search: ISearchEngine;
}

/** Contexte complet, avec la fermeture des ressources ouvertes. */
export interface McpServices extends McpToolContext {
  /** Répertoire des trois bases (journalisé au démarrage). */
  readonly dataDir: string;
  /** Un fournisseur d'embeddings est-il disponible ? */
  readonly embeddingsAvailable: boolean;
  /** Ferme la connexion SQLite (idempotent). */
  close(): void;
}

export interface OpenMcpOptions {
  /** Répertoire des bases (défaut : `EKTS_DATA_DIR` ou `./data`). */
  readonly dataDir?: string;
  /** Environnement (tests : objet explicite, jamais le `.env` du poste). */
  readonly env?: NodeJS.ProcessEnv;
  /** Service d'embeddings injecté (tests). */
  readonly embeddings?: IEmbeddingsService;
}

/**
 * Ouvre les services partagés par les quatre outils.
 *
 * Réutilise `openCliServices` (ADR-019) : MCP et CLI voient donc les mêmes
 * bases et les mêmes fournisseurs, sans duplication de câblage. Le mode
 * `auto` est volontaire — un serveur MCP doit démarrer sans clé d'API, les
 * outils `fts` restant utilisables.
 *
 * @param options - Répertoire, environnement et service d'embeddings.
 */
export function openMcpServices(options: OpenMcpOptions = {}): McpServices {
  const dataDir = options.dataDir ?? loadConfig(options.env).dataDir;
  const services: CliServices = openCliServices({
    dataDir,
    embeddingsMode: 'auto',
    // `undefined` conserve le comportement de production : la passerelle lit
    // `.env` et `providers.custom.json`. Un objet explicite coupe ces lectures.
    env: options.env,
    embeddings: options.embeddings,
  });

  return {
    manager: services.manager,
    search: createSearchEngine(services.database.connection, services.embeddings),
    dataDir,
    embeddingsAvailable: services.embeddings !== undefined,
    close: services.close,
  };
}
