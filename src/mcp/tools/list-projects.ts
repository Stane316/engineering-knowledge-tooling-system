import type { Project } from '../../shared/validators.js';
import type { McpToolContext } from '../context.js';
import type { ListProjectsParams } from '../schemas/tool-schemas.js';

/** Résultat de `list_projects`. */
export interface ListProjectsResult {
  readonly count: number;
  readonly projects: readonly Project[];
}

/**
 * Outil `list_projects` — liste les projets avec filtres facultatifs.
 *
 * Les filtres (statut, limite, décalage) sont transmis tels quels au manager :
 * la base applique le tri `created_at DESC` en une seule requête.
 *
 * @param context - Services partagés.
 * @param params - Filtres déjà validés par Zod.
 */
export async function executeListProjects(
  context: McpToolContext,
  params: ListProjectsParams,
): Promise<ListProjectsResult> {
  const projects = await context.projects.listProjects({
    ...(params.status === undefined ? {} : { status: params.status }),
    limit: params.limit,
    offset: params.offset,
  });

  return { count: projects.length, projects };
}
