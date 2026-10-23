import type { Resource, ResourceFilters } from '../../shared/validators.js';
import type { McpToolContext } from '../context.js';
import type { ListResourcesParams } from '../schemas/tool-schemas.js';

/** Résultat de `list_resources`. */
export interface ListResourcesResult {
  readonly count: number;
  readonly resources: readonly Resource[];
}

/**
 * Outil `list_resources` — liste les ressources avec filtres facultatifs.
 *
 * Les filtres sont transmis tels quels au repository, sans post-filtrage :
 * la base applique `type`, `tags` (tous requis) et `limit` en une requête.
 *
 * @param context - Services partagés.
 * @param params - Filtres déjà validés par Zod.
 */
export async function executeListResources(
  context: McpToolContext,
  params: ListResourcesParams,
): Promise<ListResourcesResult> {
  const filters: ResourceFilters = {
    ...(params.type === undefined ? {} : { type: params.type }),
    ...(params.tags === undefined ? {} : { tags: params.tags }),
    ...(params.limit === undefined ? {} : { limit: params.limit }),
  };
  const resources = await context.manager.listResources(filters);

  return { count: resources.length, resources };
}
