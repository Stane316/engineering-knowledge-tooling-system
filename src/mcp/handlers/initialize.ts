import type { Implementation } from '@modelcontextprotocol/sdk/types.js';

import { VERSION } from '../../shared/version.js';

/**
 * Identité et instructions du serveur MCP EKTS.
 *
 * Le SDK négocie lui-même `initialize` (versions supportées, capacités,
 * handshake). Ce module fixe ce que le serveur **déclare** : nom, version,
 * capacités vides (aucune ressource ni prompt MCP) et instructions destinées à
 * l'agent.
 *
 * **Écart documenté (E6-1)** : le dossier Sprint 6 cite la version de
 * protocole « 2026-07-28 ». Le SDK 1.32.1 ne connaît que `2025-11-25` et les
 * versions antérieures ; annoncer une version inconnue ferait échouer le
 * handshake. Le serveur laisse donc le SDK négocier, c'est-à-dire retomber sur
 * la version la plus récente qu'il sait servir.
 */

/** Nom déclaré du serveur (visible dans `initialize`). */
export const SERVER_NAME = 'ekts';

/** Version déclarée, lue depuis `package.json`. */
export const SERVER_VERSION = VERSION;

/** Description courte affichée par certains clients. */
export const SERVER_TITLE = 'EKTS — base de connaissances technique';

/** Capacités exposées : uniquement des outils. */
export const SERVER_CAPABILITIES = { tools: {} } as const;

/**
 * Instructions remises à l'agent au handshake.
 *
 * Elles sont volontairement concises : un agent les relit à chaque session, et
 * les schémas d'outils portent déjà le détail des paramètres.
 */
export const SERVER_INSTRUCTIONS = [
  'Serveur EKTS : base de connaissances technique locale (SQLite + FTS5 + vecteurs).',
  'Utilisez search_knowledge pour trouver des ressources, get_resource pour en lire une,',
  'list_resources pour parcourir le catalogue, validate_resource avant de proposer une création.',
  'Les modes « fts » fonctionnent hors ligne ; « hybrid » et « vector » exigent un fournisseur',
  "d'embeddings configuré côté serveur.",
].join(' ');

/** Objet `serverInfo` du handshake MCP. */
export function serverImplementation(): Implementation {
  return { name: SERVER_NAME, version: SERVER_VERSION, title: SERVER_TITLE };
}
