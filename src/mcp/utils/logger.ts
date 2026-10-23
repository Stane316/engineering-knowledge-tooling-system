import { EktsError } from '../../shared/errors.js';

/**
 * Journalisation structurée du serveur MCP.
 *
 * **Contrainte absolue** : le transport stdio utilise `stdout` comme canal
 * JSON-RPC. Écrire une seule ligne de log sur `stdout` corromprait le protocole
 * et ferait rejeter le serveur par l'agent. Tous les journaux passent donc par
 * `stderr`, au format JSON Lines : une ligne = un objet, analysable par `jq`,
 * `grep` ou un collecteur.
 */

/** Niveaux acceptés (`silent` coupe toute sortie). */
export type McpLogLevel = 'debug' | 'info' | 'error' | 'silent';

/** Journalise un message, avec un contexte facultatif. */
export interface McpLogger {
  readonly level: McpLogLevel;
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: unknown, data?: Record<string, unknown>): void;
}

/** Niveau appliqué quand `MCP_LOG_LEVEL` est absent ou inconnu. */
export const DEFAULT_LOG_LEVEL: McpLogLevel = 'info';

/** Rang de verbosité : un niveau n'émet que si son rang est atteint. */
const SEVERITY: Record<Exclude<McpLogLevel, 'silent'>, number> = {
  debug: 10,
  info: 20,
  error: 30,
};

/**
 * Traduit une valeur d'environnement en niveau.
 *
 * Accepte `off`/`none` comme synonymes de `silent` : un exploitant qui coupe
 * les logs ne devrait pas avoir à connaître le vocabulaire exact.
 *
 * @param raw - Valeur de `MCP_LOG_LEVEL`.
 */
export function resolveLogLevel(raw: string | undefined): McpLogLevel {
  const value = raw?.trim().toLowerCase();

  if (value === 'debug' || value === 'info' || value === 'error' || value === 'silent') {
    return value;
  }

  if (value === 'off' || value === 'none') {
    return 'silent';
  }

  return DEFAULT_LOG_LEVEL;
}

/** Décrit une erreur sans exposer de trace ni de secret. */
function describeError(error: unknown): Record<string, unknown> | undefined {
  if (error === undefined) {
    return undefined;
  }

  if (error instanceof EktsError) {
    return { name: error.name, message: error.message, code: error.code };
  }

  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}

export interface LoggerOptions {
  /** Niveau minimal émis (défaut : `info`). */
  readonly level?: McpLogLevel;
  /** Destination d'une ligne complète (défaut : `stderr`). */
  readonly sink?: (line: string) => void;
  /** Horloge injectable (tests déterministes). */
  readonly now?: () => Date;
}

/**
 * Construit un journal JSON Lines.
 *
 * @param options - Niveau, destination et horloge.
 */
export function createLogger(options: LoggerOptions = {}): McpLogger {
  const level = options.level ?? DEFAULT_LOG_LEVEL;
  const sink =
    options.sink ??
    ((line: string): void => {
      process.stderr.write(line);
    });
  const now = options.now ?? ((): Date => new Date());

  const enabled = (candidate: Exclude<McpLogLevel, 'silent'>): boolean =>
    level !== 'silent' && SEVERITY[candidate] >= SEVERITY[level];

  const emit = (
    candidate: Exclude<McpLogLevel, 'silent'>,
    message: string,
    data: Record<string, unknown> | undefined,
    error: unknown,
  ): void => {
    if (!enabled(candidate)) {
      return;
    }

    const record: Record<string, unknown> = {
      level: candidate,
      message,
      timestamp: now().toISOString(),
    };
    const described = describeError(error);

    if (described !== undefined) {
      record.error = described;
    }

    if (data !== undefined) {
      record.data = data;
    }

    sink(`${JSON.stringify(record)}\n`);
  };

  return {
    level,
    debug: (message, data) => {
      emit('debug', message, data, undefined);
    },
    info: (message, data) => {
      emit('info', message, data, undefined);
    },
    error: (message, error, data) => {
      emit('error', message, data, error);
    },
  };
}

/**
 * Journal silencieux : utilisé par les tests et par `MCP_LOG_LEVEL=silent`.
 * Il conserve la même interface, ce qui évite les branches conditionnelles
 * dans le code appelant.
 */
export const SILENT_LOGGER: McpLogger = {
  level: 'silent',
  debug: () => undefined,
  info: () => undefined,
  error: () => undefined,
};
