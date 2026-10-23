import { ResourceNotFoundError } from '../../shared/errors.js';
import type { Resource } from '../../shared/validators.js';
import type { McpToolContext } from '../context.js';
import type { GetResourceParams } from '../schemas/tool-schemas.js';

/** Résultat de `get_resource`. */
export interface GetResourceResult {
  readonly resource: Resource;
}

/**
 * Outil `get_resource` — renvoie une ressource par son identifiant.
 *
 * Contrairement au contrat initial du dossier (« `resource: Resource | null` »),
 * une ressource absente est signalée comme **erreur** (`-32000`) : un agent qui
 * reçoit `null` conclut souvent à un bug d'affichage, alors qu'un code d'erreur
 * explicite lui permet de corriger son identifiant.
 *
 * @param context - Services partagés.
 * @param params - Identifiant déjà validé par Zod.
 * @throws {ResourceNotFoundError} Aucune ressource pour cet identifiant.
 */
export async function executeGetResource(
  context: McpToolContext,
  params: GetResourceParams,
): Promise<GetResourceResult> {
  const resource = await context.manager.getResource(params.id);

  if (resource === null) {
    throw new ResourceNotFoundError(params.id);
  }

  return { resource };
}
