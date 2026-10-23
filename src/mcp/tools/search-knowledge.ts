import type { SearchResult } from '../../shared/types.js';
import type { McpToolContext } from '../context.js';
import type { SearchKnowledgeParams } from '../schemas/tool-schemas.js';

/** Résultat de `search_knowledge`. */
export interface SearchKnowledgeResult {
  readonly query: string;
  readonly mode: SearchKnowledgeParams['mode'];
  readonly count: number;
  readonly results: readonly SearchResult[];
}

/**
 * Outil `search_knowledge` — recherche dans la base de connaissances.
 *
 * En mode `fts`, aucun fournisseur d'embeddings n'est sollicité : la recherche
 * fonctionne hors ligne. En modes `hybrid` et `vector`, une configuration
 * absente produit une erreur explicite (code `-32603`) plutôt qu'un classement
 * lexical présenté comme sémantique.
 *
 * @param context - Services partagés (manager, moteur de recherche).
 * @param params - Paramètres déjà validés par Zod.
 * @throws {EmbeddingsError} Fournisseur absent ou appel en échec.
 * @throws {SearchError} Requête refusée par le moteur.
 */
export async function executeSearchKnowledge(
  context: McpToolContext,
  params: SearchKnowledgeParams,
): Promise<SearchKnowledgeResult> {
  const results = await context.search.search(params.query, {
    limit: params.limit,
    mode: params.mode,
    ...(params.type === undefined ? {} : { type: params.type }),
    ...(params.tags === undefined ? {} : { tags: params.tags }),
  });

  return {
    query: params.query,
    mode: params.mode,
    count: results.length,
    results,
  };
}
