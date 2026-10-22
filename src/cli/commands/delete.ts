import type { Command } from 'commander';

import { ResourceNotFoundError } from '../../shared/errors.js';
import { execute, withOutputFlags } from '../command.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

interface DeleteCliOptions {
  yes?: boolean;
}

export interface DeleteReport {
  deleted: boolean;
  cancelled: boolean;
  id: string;
  title: string;
}

/**
 * Supprime une ressource après confirmation.
 *
 * Sans terminal interactif, la confirmation renvoie `false` (voir
 * `confirmWithReadline`) : un script doit passer `--yes`, jamais supprimer par
 * accident parce que l'entrée standard était fermée.
 *
 * @throws {ResourceNotFoundError} Identifiant inconnu (code de sortie 3).
 */
export async function collectDelete(
  runtime: CliRuntime,
  id: string,
  options: DeleteCliOptions,
): Promise<DeleteReport> {
  const services = runtime.openServices({ dataDir: runtime.dataDir, embeddingsMode: 'disabled' });

  try {
    const resource = await services.manager.getResource(id);

    if (resource === null) {
      throw new ResourceNotFoundError(id);
    }

    if (options.yes !== true) {
      const confirmed = await runtime.confirm(`Supprimer « ${resource.title} » (${resource.id}) ?`);

      if (!confirmed) {
        return { deleted: false, cancelled: true, id: resource.id, title: resource.title };
      }
    }

    await services.manager.deleteResource(id);

    return { deleted: true, cancelled: false, id: resource.id, title: resource.title };
  } finally {
    services.close();
  }
}

function renderDelete(report: DeleteReport, palette: Palette): string {
  return report.deleted
    ? palette.success(`Ressource supprimée : ${report.id} (${report.title})`)
    : palette.warning(`Suppression annulée : ${report.id}`);
}

/** Enregistre `ekts delete <id>`. */
export function registerDelete(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('delete <id>')
      .description('supprime une ressource (confirmation demandée)')
      .option('-y, --yes', 'supprime sans demander de confirmation'),
  ).action(async (id: string, options: DeleteCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectDelete(runtime, id, options);

      return {
        human: renderDelete(report, palette),
        json: { deleted: report.deleted, cancelled: report.cancelled, id: report.id },
      };
    });
  });
}
