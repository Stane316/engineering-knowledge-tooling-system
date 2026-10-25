import { Option, type Command } from 'commander';

import {
  ResourceTypeSchema,
  type Resource,
  type ResourceFilters,
  type ResourceType,
} from '../../shared/validators.js';
import { execute, withOutputFlags } from '../command.js';
import { parseLimit, parseOffset, parseProjectId, parseTags } from '../options.js';
import { plural, renderTable, truncate, type Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

interface ListCliOptions {
  limit?: number;
  offset?: number;
  type?: ResourceType;
  tags?: string;
  project?: string;
}

/** Liste les ressources, filtres appliqués côté base. */
export async function collectList(
  runtime: CliRuntime,
  options: ListCliOptions,
): Promise<Resource[]> {
  const services = runtime.openServices({ dataDir: runtime.dataDir, embeddingsMode: 'disabled' });

  try {
    const tags = parseTags(options.tags);
    const filters: ResourceFilters = {
      ...(options.type === undefined ? {} : { type: options.type }),
      ...(tags.length === 0 ? {} : { tags }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
      ...(options.offset === undefined ? {} : { offset: options.offset }),
      ...(options.project === undefined ? {} : { projectId: options.project }),
    };

    return await services.manager.listResources(filters);
  } finally {
    services.close();
  }
}

function renderList(resources: readonly Resource[], palette: Palette): string {
  if (resources.length === 0) {
    return palette.warning('Aucune ressource.');
  }

  const table = renderTable({
    columns: [
      { header: '#', align: 'right' },
      { header: 'ID' },
      { header: 'TYPE' },
      { header: 'TITRE' },
      { header: 'TAGS' },
      { header: 'MAJ' },
    ],
    rows: resources.map((resource, index) => [
      String(index + 1),
      resource.id.slice(0, 8),
      resource.type,
      truncate(resource.title, 44),
      truncate(resource.tags.join(', '), 28),
      resource.updatedAt.slice(0, 10),
    ]),
  });

  return [palette.bold(plural(resources.length, 'ressource')), table].join('\n');
}

/** Enregistre `ekts list`. */
export function registerList(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('list')
      .description('liste les ressources (filtres optionnels)')
      .option('-l, --limit <number>', 'nombre maximum de ressources', parseLimit)
      .option('--offset <number>', 'décalage de pagination', parseOffset)
      .addOption(
        new Option('-t, --type <type>', 'filtre sur le type de ressource').choices([
          ...ResourceTypeSchema.options,
        ]),
      )
      .option('--tags <tags>', 'filtre : la ressource doit porter tous les tags (CSV)')
      .addOption(
        new Option('-p, --project <id>', 'filtrer par projet (UUID)').argParser(parseProjectId),
      ),
  ).action(async (options: ListCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const resources = await collectList(runtime, options);

      return {
        human: renderList(resources, palette),
        json: { count: resources.length, resources },
      };
    });
  });
}
