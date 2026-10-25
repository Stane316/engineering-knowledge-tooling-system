import { McpError, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import {
  EktsError,
  EmbeddingSpaceMismatchError,
  EmbeddingsError,
  NoProviderAvailableError,
  ProjectNotFoundError,
  ResourceNotFoundError,
  SearchError,
  ValidationError,
} from '../../shared/errors.js';

/**
 * Correspondance entre les erreurs EKTS et les codes JSON-RPC.
 *
 * JSON-RPC 2.0 réserve :
 * - `-32700` à `-32603` aux erreurs de protocole (parsing, méthode, paramètres) ;
 * - `-32000` à `-32099` aux erreurs applicatives, définies par le serveur.
 *
 * Le dossier Sprint 6 fixe `-32000` = ressource introuvable et `-32001` =
 * validation échouée : ce sont bien des erreurs applicatives. Les constantes
 * sont donc locales, et non importées de `ErrorCode` du SDK, qui réutilise
 * `-32000`/`-32001` pour `ConnectionClosed` et `RequestTimeout` — un sens
 * interne au SDK, jamais renvoyé à un agent.
 */

/** Codes JSON-RPC utilisés par le serveur MCP EKTS. */
export const McpErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ResourceNotFound: -32000,
  ValidationError: -32001,
} as const;

/** Charge utile d'une erreur, sérialisable dans un résultat d'outil. */
export interface McpErrorPayload {
  readonly code: number;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

/** Reformate les erreurs Zod en une phrase courte et lisible. */
export function formatIssues(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): string {
  return issues
    .map((issue) => {
      const path = issue.path.map((segment) => String(segment)).join('.');

      return path.length === 0 ? issue.message : `${path} : ${issue.message}`;
    })
    .join(' ; ');
}

/**
 * Traduit n'importe quelle erreur en charge utile JSON-RPC.
 *
 * Les erreurs d'infrastructure (embeddings indisponibles, espace incompatible)
 * ne sont **pas** déguisées en erreurs de paramètres : elles sont signalées comme
 * erreurs internes, avec leur code métier, et le message rappelle le mode
 * `fts`, qui reste utilisable sans réseau.
 *
 * @param error - Erreur capturée.
 */
export function toErrorPayload(error: unknown): McpErrorPayload {
  if (error instanceof McpError) {
    const data = isRecord(error.data) ? error.data : undefined;

    return {
      code: error.code,
      message: error.message,
      ...(data === undefined ? {} : { data }),
    };
  }

  if (error instanceof ResourceNotFoundError) {
    return {
      code: McpErrorCode.ResourceNotFound,
      message: error.message,
      data: { resourceId: error.resourceId },
    };
  }

  if (error instanceof ProjectNotFoundError) {
    return {
      code: McpErrorCode.ResourceNotFound,
      message: error.message,
      data: { projectId: error.projectId },
    };
  }

  if (error instanceof ValidationError) {
    return {
      code: McpErrorCode.ValidationError,
      message: error.message,
      data: { issues: error.issues },
    };
  }

  if (error instanceof SearchError) {
    return {
      code: McpErrorCode.InvalidParams,
      message: error.message,
      data: { reason: error.code },
    };
  }

  if (
    error instanceof EmbeddingsError ||
    error instanceof NoProviderAvailableError ||
    error instanceof EmbeddingSpaceMismatchError
  ) {
    return {
      code: McpErrorCode.InternalError,
      message: `${asSentence(error.message)} Le mode « fts » reste utilisable sans fournisseur d'embeddings.`,
      data: { reason: error.code },
    };
  }

  if (error instanceof EktsError) {
    return {
      code: McpErrorCode.InternalError,
      message: error.message,
      data: { reason: error.code },
    };
  }

  if (error instanceof Error) {
    return { code: McpErrorCode.InternalError, message: error.message };
  }

  return { code: McpErrorCode.InternalError, message: String(error) };
}

/**
 * Convertit une erreur en exception JSON-RPC.
 *
 * Utilisée là où le protocole attend une réponse `error` (paramètres invalides,
 * méthode inconnue) plutôt qu'un résultat d'outil.
 *
 * @param error - Erreur capturée.
 */
export function toMcpError(error: unknown): McpError {
  if (error instanceof McpError) {
    return error;
  }

  const payload = toErrorPayload(error);

  return new McpError(payload.code, payload.message, payload.data);
}

/**
 * Convertit une erreur en **résultat d'outil** (`isError: true`).
 *
 * Constat de terrain : les agents affichent un `content` d'erreur à l'utilisateur,
 * alors qu'une erreur JSON-RPC au niveau `tools/call` est parfois avalée par le
 * client. Le code standardisé reste présent, dans le texte JSON.
 *
 * @param error - Erreur capturée.
 */
export function toToolErrorResult(error: unknown): CallToolResult {
  const payload = toErrorPayload(error);

  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ error: payload }, null, 2) }],
  };
}

/** Construit une erreur de paramètres invalides. */
export function invalidParams(message: string, data?: Record<string, unknown>): McpError {
  return new McpError(McpErrorCode.InvalidParams, message, data);
}

/** Termine une phrase sans doubler la ponctuation déjà présente. */
function asSentence(message: string): string {
  return /[.!?]$/u.test(message) ? message : `${message}.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
