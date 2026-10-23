import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Transport stdio du serveur MCP.
 *
 * `stdin` porte les requêtes JSON-RPC, `stdout` les réponses. Toute écriture
 * parasite sur `stdout` (un `console.log` oublié) casse le protocole : les
 * journaux passent par `stderr` (voir `utils/logger.ts`).
 *
 * Ce module isole la dépendance au SDK : le reste du code manipule le contrat
 * `Transport`, ce qui permet de brancher un transport mémoire dans les tests.
 */
export function createStdioTransport(): Transport {
  return new StdioServerTransport();
}
