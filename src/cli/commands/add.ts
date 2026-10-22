import type { Command } from 'commander';

import type { AddResourceInput } from '../../business/knowledge-manager.types.js';
import type { Resource, ResourceType } from '../../shared/validators.js';
import { execute, withOutputFlags } from '../command.js';
import { truncate } from '../output.js';
import { parseTags } from '../options.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

interface AddCliOptions {
  type: string;
  title: string;
  url?: string;
  tags?: string;
  content?: string;
}

/** Rapport d'ajout : la ressource et l'état de son indexation. */
export interface AddReport {
  resource: Resource;
  /** Un vecteur a-t-il été calculé et stocké ? */
  vectorIndexed: boolean;
  /** Raison de l'absence de vecteur (quota, réseau, embeddings absents). */
  vectorWarning?: string;
}

/**
 * Ajoute une ressource.
 *
 * L'indexation plein texte est systématique (elle ne dépend d'aucun service
 * réseau) et **fait foi** : si elle échoue, l'ajout échoue.
 *
 * L'indexation vectorielle est réellement **best-effort** : un quota épuisé
 * (HTTP 429), une panne réseau ou l'absence de fournisseur ne détruisent pas
 * l'ajout. La ressource reste créée et cherchable en plein texte, et le rapport
 * expose `vectorIndexed: false` avec la raison (`vectorWarning`) — jamais un
 * échec silencieux ni une perte de données.
 */
export async function collectAdd(runtime: CliRuntime, options: AddCliOptions): Promise<AddReport> {
  const services = runtime.openServices({ dataDir: runtime.dataDir, embeddingsMode: 'auto' });

  try {
    const input: AddResourceInput = {
      // `type` est validé par Zod dans le manager : le transtypage ne sert
      // qu'à respecter la signature, aucune donnée n'est acceptée sans contrôle.
      type: options.type as ResourceType,
      title: options.title,
      tags: parseTags(options.tags),
      ...(options.url === undefined ? {} : { url: options.url }),
      ...(options.content === undefined ? {} : { content: options.content }),
    };

    const resource = await services.manager.addResource(input);
    const outcome = services.vectorIndexer?.outcome(resource.id);

    return {
      resource,
      vectorIndexed: outcome?.indexed ?? false,
      ...(outcome?.message === undefined ? {} : { vectorWarning: outcome.message }),
    };
  } finally {
    services.close();
  }
}

function renderAdd(report: AddReport, palette: Palette): string {
  const { resource } = report;
  const lines = [
    palette.bold('Ressource créée'),
    `  id          ${resource.id}`,
    `  titre       ${resource.title}`,
    `  type        ${resource.type}`,
  ];

  if (resource.url !== undefined) {
    lines.push(`  url         ${resource.url}`);
  }

  if (resource.tags.length > 0) {
    lines.push(`  tags        ${resource.tags.join(', ')}`);
  }

  if (resource.content !== undefined) {
    lines.push(`  contenu     ${String(resource.content.length)} caractères`);
  }

  lines.push(
    `  indexation  ${report.vectorIndexed ? 'plein texte + vecteurs' : 'plein texte seul'}`,
  );

  if (!report.vectorIndexed) {
    lines.push(
      report.vectorWarning === undefined
        ? palette.dim('              aucun fournisseur d’embeddings configuré')
        : palette.warning(
            `              vecteurs indisponibles : ${truncate(report.vectorWarning, 160)}`,
          ),
    );
  }

  return lines.join('\n');
}

/** Enregistre `ekts add`. */
export function registerAdd(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('add')
      .description('ajoute une ressource et l’indexe (plein texte, puis vecteurs si configurés)')
      .requiredOption('--type <type>', 'type de ressource (article|video|tutorial|tool|other)')
      .requiredOption('--title <title>', 'titre de la ressource')
      .option('--url <url>', 'URL de la ressource')
      .option('--tags <tags>', 'tags séparés par des virgules')
      .option('--content <content>', 'contenu textuel (indexé)'),
  ).action(async (options: AddCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectAdd(runtime, options);

      return {
        human: renderAdd(report, palette),
        json: {
          ...report.resource,
          vectorIndexed: report.vectorIndexed,
          ...(report.vectorWarning === undefined ? {} : { vectorWarning: report.vectorWarning }),
        },
      };
    });
  });
}
