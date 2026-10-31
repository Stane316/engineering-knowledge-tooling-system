import { pathToFileURL } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import { loadEnvFile } from '../shared/env-file.js';
import { openMcpServices, type McpServices, type McpToolContext } from './context.js';
import {
  SERVER_CAPABILITIES,
  SERVER_INSTRUCTIONS,
  serverImplementation,
} from './handlers/initialize.js';
import { registerTools } from './handlers/tools.js';
import {
  assertValidPolicy,
  MCP_PROFILES,
  PROFILE_ENV_VAR,
  resolveProfile,
  type McpProfilePolicy,
} from './profiles.js';
import { TOOL_NAMES } from './schemas/tool-schemas.js';
import { createStdioTransport } from './transport.js';
import { createLogger, resolveLogLevel, SILENT_LOGGER, type McpLogger } from './utils/logger.js';
import { attachJournal, EventJournal } from './observability/event-journal.js';

/**
 * Serveur MCP EKTS — transport stdio.
 *
 * Le serveur est **sans état de session** : chaque requête est traitée avec la
 * même connexion SQLite, ouverte une fois au démarrage. MCP 2025-11-25 (dernière
 * version servie par le SDK 1.32.1) décrit exactement ce mode d'exploitation.
 */

export interface CreateEktsServerOptions {
  /** Services partagés par les outils. */
  readonly context: McpToolContext;
  /** Journal ; silencieux par défaut (les tests ne polluent pas `stderr`). */
  readonly logger?: McpLogger;
  /**
   * Politique d'exposition (Sprint 21-01).
   *
   * Défaut : profil `full`, identique à l'exposition historique. Le point
   * d'entrée, lui, résout la politique depuis `EKTS_MCP_PROFILE` avant
   * d'ouvrir la moindre base.
   */
  readonly profile?: McpProfilePolicy;
  /**
   * Journal d'événements (Sprint 23-01).
   *
   * Défaut : un journal est créé et recopié sur `stderr` via le journal
   * structuré, sauf si le journal est `silent` — un serveur muet ne doit pas
   * produire de trace. Les tests injectent le leur pour lire les événements.
   */
  readonly journal?: EventJournal;
}

/**
 * Construit le serveur MCP et enregistre les quatre outils.
 *
 * Fonction pure vis-à-vis du transport : les tests la branchent sur un
 * transport mémoire, la production sur stdio.
 *
 * @param options - Contexte de services et journal.
 */
export function createEktsServer(options: CreateEktsServerOptions): McpServer {
  const logger = options.logger ?? SILENT_LOGGER;
  const profile = options.profile ?? MCP_PROFILES.full;

  // Échec fermé avant toute construction : une politique vide ou portant un
  // nom inconnu ne produit ni serveur muet ni serveur complet.
  assertValidPolicy(profile);

  const server = new McpServer(serverImplementation(), {
    capabilities: SERVER_CAPABILITIES,
    instructions: SERVER_INSTRUCTIONS,
  });

  server.server.onerror = (error) => {
    logger.error('Erreur de protocole MCP', error);
  };

  const journal =
    options.journal ??
    options.context.observability?.journal ??
    (logger.level === 'silent'
      ? undefined
      : new EventJournal({ sink: (event) => logger.info('mcp.event', { ...event }) }));

  registerTools(
    server,
    journal === undefined ? options.context : attachJournal(options.context, journal),
    logger,
    profile,
  );

  return server;
}

export interface StartServerOptions {
  /** Environnement (défaut : `process.env`, `.env` chargé par le point d'entrée). */
  readonly env?: NodeJS.ProcessEnv;
  /** Répertoire des bases (défaut : `EKTS_DATA_DIR` ou `./data`). */
  readonly dataDir?: string;
  /** Journal injecté (tests). */
  readonly logger?: McpLogger;
  /** Transport injecté (tests) ; défaut : stdio. */
  readonly transport?: Transport;
  /** Installe les gestionnaires SIGINT/SIGTERM (défaut : `true`). */
  readonly handleSignals?: boolean;
  /** Délai maximal de fermeture du transport (défaut : 2 s). */
  readonly closeTimeoutMs?: number;
  /** Ancrage des signaux injecté (tests) ; défaut : `process`. */
  readonly signalHooks?: SignalHooks;
}

/** Serveur démarré, avec tout ce qu'il faut pour l'arrêter proprement. */
export interface McpServerHandle {
  readonly server: McpServer;
  readonly context: McpServices;
  readonly transport: Transport;
  /** Ferme le transport, le serveur et la connexion SQLite (idempotent). */
  close(): Promise<void>;
}

/** Nombre maximal de tentatives de fermeture (arrêt propre uniquement). */
const CLOSE_TIMEOUT_MS = 2_000;

/**
 * Démarre le serveur MCP sur un transport (stdio par défaut).
 *
 * @param options - Environnement, transport, journal, signaux.
 * @returns Le serveur et sa fonction de fermeture.
 */
export async function startStdioServer(options: StartServerOptions = {}): Promise<McpServerHandle> {
  const env = options.env ?? process.env;
  const logger = options.logger ?? createLogger({ level: resolveLogLevel(env.MCP_LOG_LEVEL) });

  // Politique résolue **avant** l'ouverture des bases : un profil refusé ne
  // doit produire aucune écriture, même technique (C-P05).
  const profile = resolveProfile(env[PROFILE_ENV_VAR]);

  const context = openMcpServices({ dataDir: options.dataDir, env: options.env });
  const transport = options.transport ?? createStdioTransport();
  const server = createEktsServer({ context, logger, profile });
  let closed = false;
  let removeSignals: (() => void) | undefined;

  const close = async (): Promise<void> => {
    if (closed) {
      return;
    }

    closed = true;
    removeSignals?.();
    await withTimeout(server.close(), options.closeTimeoutMs ?? CLOSE_TIMEOUT_MS, logger);
    context.close();
  };

  if (options.handleSignals !== false) {
    removeSignals = installSignalHandlers(
      close,
      logger,
      options.signalHooks ?? processSignalHooks(),
    );
  }

  await server.connect(transport);
  logger.info('Serveur MCP EKTS démarré', {
    transport: transport.constructor.name,
    protocolVersion: LATEST_PROTOCOL_VERSION,
    dataDir: context.dataDir,
    tools: TOOL_NAMES.length,
    embeddings: context.embeddingsAvailable,
  });

  return { server, context, transport, close };
}

/** Points d'ancrage des signaux, injectables pour les tests. */
export interface SignalHooks {
  once(signal: NodeJS.Signals, handler: (signal: NodeJS.Signals) => void): void;
  remove(signal: NodeJS.Signals, handler: (signal: NodeJS.Signals) => void): void;
  exit(code: number): void;
}

/**
 * Ancrage réel sur le processus.
 *
 * Le code de sortie est posé via `process.exitCode` plutôt que `process.exit` :
 * la boucle d'événements se vide naturellement (transport fermé, SQLite fermée)
 * et le test peut vérifier la valeur sans tuer son propre processus.
 */
export function processSignalHooks(): SignalHooks {
  return {
    once: (signal, handler) => {
      process.once(signal, handler);
    },
    remove: (signal, handler) => {
      process.removeListener(signal, handler);
    },
    exit: (code) => {
      process.exitCode = code;
    },
  };
}

/**
 * Arrête le serveur sur SIGINT/SIGTERM.
 *
 * Sans ce gestionnaire, un agent qui ferme le processus laisserait la
 * connexion SQLite ouverte (fichiers `-wal`/`-shm` non consolidés).
 *
 * @param close - Fermeture déjà idempotente du serveur.
 * @param logger - Journal.
 * @param hooks - Ancrage des signaux (tests).
 * @returns Fonction de désinstallation, appelée à la fermeture.
 */
export function installSignalHandlers(
  close: () => Promise<void>,
  logger: McpLogger,
  hooks: SignalHooks = processSignalHooks(),
): () => void {
  const onSignal = (signal: NodeJS.Signals): void => {
    logger.info('Arrêt demandé', { signal });
    void close().finally(() => {
      hooks.exit(0);
    });
  };

  hooks.once('SIGINT', onSignal);
  hooks.once('SIGTERM', onSignal);

  return () => {
    hooks.remove('SIGINT', onSignal);
    hooks.remove('SIGTERM', onSignal);
  };
}

/** Ferme sans bloquer indéfiniment si un transport ne répond plus. */
async function withTimeout(
  operation: Promise<void>,
  milliseconds: number,
  logger: McpLogger,
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  let expired = false;

  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      expired = true;
      resolve();
    }, milliseconds);
    timer.unref();
  });

  try {
    await Promise.race([operation, timeout]);

    if (expired) {
      logger.error('Fermeture du serveur MCP expirée', undefined, { timeoutMs: milliseconds });
    }
  } catch (error) {
    logger.error('Échec de la fermeture du serveur MCP', error);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Écrit une erreur fatale en JSON, sur `stderr`, avant de quitter.
 *
 * Exportée pour être testable : le point d'entrée l'appelle quand l'ouverture
 * des bases échoue (répertoire invalide, permissions).
 */
export function reportFatal(error: unknown): void {
  process.stderr.write(
    `${JSON.stringify({
      level: 'error',
      message: 'Le serveur MCP n’a pas pu démarrer',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    })}\n`,
  );
}

/** `true` quand le module est exécuté directement (`node dist/mcp/server.js`). */
export function isEntryPoint(): boolean {
  const entry = process.argv[1];

  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
}

/* v8 ignore start -- exécuté uniquement par `node dist/mcp/server.js`. */
if (isEntryPoint()) {
  // Même contrat que `src/cli/index.ts` : `.env` est chargé au point d'entrée,
  // jamais par une bibliothèque. `EKTS_DATA_DIR` et les clés de fournisseurs
  // sont ainsi visibles avant l'ouverture des services.
  loadEnvFile();

  startStdioServer().catch((error: unknown) => {
    reportFatal(error);
    process.exitCode = 1;
  });
}
/* v8 ignore stop */
