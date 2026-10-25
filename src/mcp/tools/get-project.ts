import type { Project } from '../../shared/validators.js';
import type { McpToolContext } from '../context.js';
import type { GetProjectParams } from '../schemas/tool-schemas.js';

/** Résultat de `get_project`. */
export interface GetProjectResult {
  readonly project: Project;
}

/**
 * Outil `get_project` — renvoie un projet par son identifiant UUID.
 *
 * Comme `get_resource`, un projet absent est signalé en **erreur** (-32000)
 * et non par `null` : un agent doit pouvoir corriger son identifiant.
 *
 * @param context - Services partagés.
 * @param params - Identifiant déjà validé par Zod.
 * @throws {ProjectNotFoundError} Aucun projet pour cet identifiant.
 */
export async function executeGetProject(
  context: McpToolContext,
  params: GetProjectParams,
): Promise<GetProjectResult> {
  const project = await context.projects.getProjectOrThrow(params.project_id);

  return { project };
}
