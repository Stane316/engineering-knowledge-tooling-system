import type { Project } from '../../shared/validators.js';
import type { McpToolContext } from '../context.js';
import type { CreateProjectParams } from '../schemas/tool-schemas.js';

/** Résultat de `create_project`. */
export interface CreateProjectResult {
  readonly project: Project;
}

/**
 * Outil `create_project` — crée un projet et renvoie le projet persisté.
 *
 * La validation Zod (nom non vide, statut dans l'énumération, métadonnées
 * objet) est appliquée par `ProjectManager` : une entrée refusée produit une
 * erreur `-32001`, jamais un enregistrement partiel.
 *
 * @param context - Services partagés.
 * @param params - Entrée déjà validée par Zod.
 * @returns Projet créé, avec son UUID et ses horodatages.
 */
export async function executeCreateProject(
  context: McpToolContext,
  params: CreateProjectParams,
): Promise<CreateProjectResult> {
  const project = await context.projects.createProject({
    name: params.name,
    ...(params.description === undefined ? {} : { description: params.description }),
    status: params.status,
    ...(params.metadata === undefined ? {} : { metadata: params.metadata }),
  });

  return { project };
}
