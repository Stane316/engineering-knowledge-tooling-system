import type { McpToolContext } from '../context.js';
import type { DeleteProjectParams } from '../schemas/tool-schemas.js';

/** Résultat de `delete_project`. */
export interface DeleteProjectResult {
  readonly deleted: boolean;
  readonly project_id: string;
}

/**
 * Outil `delete_project` — supprime un projet.
 *
 * Aucune confirmation interactive : l'appelant MCP formule explicitement la
 * demande. Les audits et ressources du projet sont **conservés**
 * (`project_id` passe à `NULL` via `ON DELETE SET NULL`) — aucun purge en
 * cascade n'est possible.
 *
 * @param context - Services partagés.
 * @param params - Identifiant déjà validé par Zod.
 * @throws {ProjectNotFoundError} Aucun projet pour cet identifiant.
 */
export async function executeDeleteProject(
  context: McpToolContext,
  params: DeleteProjectParams,
): Promise<DeleteProjectResult> {
  await context.projects.deleteProject(params.project_id);

  return { deleted: true, project_id: params.project_id };
}
