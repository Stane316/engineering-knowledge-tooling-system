import { readFileSync } from 'node:fs';

import { Option, type Command } from 'commander';

import type { AddResourceInput } from '../../business/knowledge-manager.types.js';
import { ValidationError } from '../../shared/errors.js';
import {
  assessAdmission,
  extractProvenance,
  parseProvenance,
  PROVENANCE_METADATA_KEY,
  type Admission,
  type Provenance,
} from '../../shared/provenance.js';
import type { Resource, ResourceType } from '../../shared/validators.js';
import { execute, withOutputFlags } from '../command.js';
import { truncate } from '../output.js';
import { parseProjectId, parseTags } from '../options.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

interface AddCliOptions {
  type: string;
  title: string;
  url?: string;
  tags?: string;
  content?: string;
  project?: string;
  /** Fichier JSON de provenance (Sprint 22-01). */
  provenance?: string;
}

/** Rapport d'ajout : la ressource et l'état de son indexation. */
export interface AddReport {
  resource: Resource;
  /** Un vecteur a-t-il été calculé et stocké ? */
  vectorIndexed: boolean;
  /** Raison de l'absence de vecteur (quota, réseau, embeddings absents). */
  vectorWarning?: string;
  /** Admission au corpus gouverné (Sprint 22-01). */
  admission: Admission;
}

/** Message d'erreur lisible, sans dépendre du type exact. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Lit et valide un fichier de provenance.
 *
 * Un fichier illisible, un JSON invalide et un bloc hors contrat sont trois
 * échecs distincts : le message le dit, et rien n'est écrit dans la base.
 *
 * @param path - Chemin du fichier fourni par l'opérateur.
 * @throws {ValidationError} Fichier illisible, JSON invalide ou provenance hors contrat.
 */
function loadProvenanceFile(path: string): Provenance {
  let raw: string;

  try {
    raw = readFileSync(path, 'utf8');
  } catch (error) {
    throw new ValidationError([`provenance : fichier illisible « ${path} » (${messageOf(error)})`]);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError([`provenance : JSON invalide dans « ${path} »`]);
  }

  return parseProvenance(parsed);
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
    // Provenance validée **avant** d'ouvrir la moindre écriture : un fichier
    // fautif ne doit pas laisser de ressource partielle.
    const provenance =
      options.provenance === undefined ? undefined : loadProvenanceFile(options.provenance);

    const input: AddResourceInput = {
      // `type` est validé par Zod dans le manager : le transtypage ne sert
      // qu'à respecter la signature, aucune donnée n'est acceptée sans contrôle.
      type: options.type as ResourceType,
      title: options.title,
      tags: parseTags(options.tags),
      ...(options.url === undefined ? {} : { url: options.url }),
      ...(options.content === undefined ? {} : { content: options.content }),
      ...(options.project === undefined ? {} : { projectId: options.project }),
      ...(provenance === undefined ? {} : { metadata: { [PROVENANCE_METADATA_KEY]: provenance } }),
    };

    // Projet assigné : existence vérifiée avant toute écriture (code 3 si
    // inconnu) — la FK SQL resterait le garde-fou, mais son message brut
    // serait illisible pour l'utilisateur.
    if (options.project !== undefined) {
      await services.projects.getProjectOrThrow(options.project);
    }

    const resource = await services.manager.addResource(input);
    const outcome = services.vectorIndexer?.outcome(resource.id);

    return {
      resource,
      vectorIndexed: outcome?.indexed ?? false,
      ...(outcome?.message === undefined ? {} : { vectorWarning: outcome.message }),
      admission: assessAdmission(extractProvenance(resource.metadata)),
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
    `  corpus      ${report.admission.admitted ? 'admise' : 'exclue'} — ${report.admission.reason}`,
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
      .option('--content <content>', 'contenu textuel (indexé)')
      .option(
        '--provenance <fichier>',
        'fichier JSON de provenance (source, version, droits, sensibilité, empreinte, revue)',
      )
      .addOption(
        new Option('-p, --project <id>', 'assigner la ressource à un projet (UUID)').argParser(
          parseProjectId,
        ),
      ),
  ).action(async (options: AddCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectAdd(runtime, options);

      return {
        human: renderAdd(report, palette),
        json: {
          ...report.resource,
          vectorIndexed: report.vectorIndexed,
          ...(report.vectorWarning === undefined ? {} : { vectorWarning: report.vectorWarning }),
          admission: report.admission,
        },
      };
    });
  });
}
