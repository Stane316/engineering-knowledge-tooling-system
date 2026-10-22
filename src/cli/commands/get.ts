import type { Command } from 'commander';

import { ResourceNotFoundError } from '../../shared/errors.js';
import type { Resource } from '../../shared/validators.js';
import { execute, withOutputFlags } from '../command.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

/**
 * Récupère une ressource par identifiant.
 *
 * @throws {ResourceNotFoundError} Identifiant inconnu (code de sortie 3).
 */
export async function collectGet(runtime: CliRuntime, id: string): Promise<Resource> {
  const services = runtime.openServices({ dataDir: runtime.dataDir, embeddingsMode: 'disabled' });

  try {
    const resource = await services.manager.getResource(id);

    if (resource === null) {
      throw new ResourceNotFoundError(id);
    }

    return resource;
  } finally {
    services.close();
  }
}

function renderResource(resource: Resource, palette: Palette): string {
  const lines = [
    palette.bold('Ressource'),
    `  id          ${resource.id}`,
    `  titre       ${resource.title}`,
    `  type        ${resource.type}`,
  ];

  if (resource.url !== undefined) {
    lines.push(`  url         ${resource.url}`);
  }

  lines.push(`  tags        ${resource.tags.length > 0 ? resource.tags.join(', ') : '(aucun)'}`);

  if (resource.content !== undefined) {
    lines.push(`  contenu     ${String(resource.content.length)} caractères`);
  }

  lines.push(`  créée       ${resource.createdAt}`, `  modifiée    ${resource.updatedAt}`);

  return lines.join('\n');
}

/** Enregistre `ekts get <id>`. */
export function registerGet(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program.command('get <id>').description('affiche une ressource par son identifiant (UUID)'),
  ).action(async (id: string, _options: unknown, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const resource = await collectGet(runtime, id);

      return { human: renderResource(resource, palette), json: resource };
    });
  });
}
