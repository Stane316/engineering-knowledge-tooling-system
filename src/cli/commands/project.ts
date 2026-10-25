import { Option, type Command } from 'commander';

import { EktsError, ValidationError } from '../../shared/errors.js';
import {
  ProjectIdSchema,
  ProjectStatusSchema,
  type Project,
  type ProjectStatus,
} from '../../shared/validators.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import { parseLimit } from '../options.js';
import { renderTable, type Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

interface ProjectCreateCliOptions {
  description?: string;
  status: ProjectStatus;
}

interface ProjectListCliOptions {
  status?: string;
  limit: number;
}

interface ProjectIdCliOptions {
  force?: boolean;
}

/**
 * Valide un identifiant de projet transmis par la ligne de commande.
 *
 * @param raw - Valeur brute de `--project <id>`.
 * @param label - Libellé dans le message d'erreur.
 * @returns Identifiant UUID validé.
 * @throws {ValidationError} Format invalide (code de sortie 4).
 */
function parseProjectIdParam(raw: string, label: string): string {
  const result = ProjectIdSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${label} : ${issue.message}`);
    throw new ValidationError(issues);
  }
  return result.data;
}

/** Valide `--status` contre l'énumération du schéma. */
function parseStatus(raw: string): ProjectStatus {
  const result = ProjectStatusSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError([
      `--status invalide « ${raw} » (valeurs : ${ProjectStatusSchema.options.join(', ')})`,
    ]);
  }
  return result.data;
}

/** Bloc humain d'un projet (create/show). */
function renderProject(project: Project, palette: Palette): string {
  return [
    palette.bold(`📁 ${project.name}`),
    `  ID       ${project.id}`,
    `  Statut   ${project.status}`,
    `  Desc.    ${project.description ?? '—'}`,
    `  Début    ${project.startedAt ?? '—'}`,
    `  Fin      ${project.completedAt ?? '—'}`,
    `  Créé     ${project.createdAt}`,
    `  MàJ      ${project.updatedAt}`,
    `  Meta     ${Object.keys(project.metadata).length > 0 ? JSON.stringify(project.metadata) : '—'}`,
  ].join('\n');
}

/** Tableau humain des projets. */
function renderProjectList(projects: readonly Project[], palette: Palette): string {
  if (projects.length === 0) {
    return palette.warning('📭 Aucun projet.');
  }

  return [
    palette.bold(`📁 Projets (${String(projects.length)} résultat(s))`),
    '',
    renderTable({
      columns: [
        { header: 'ID', align: 'left' },
        { header: 'NOM' },
        { header: 'STATUT' },
        { header: 'CRÉÉ' },
      ],
      rows: projects.map((project) => [
        project.id.slice(0, 8),
        project.name.length > 40 ? `${project.name.slice(0, 37)}...` : project.name,
        project.status,
        project.createdAt.slice(0, 10),
      ]),
    }),
  ].join('\n');
}

/**
 * Commandes `ekts project create|list|show|delete` (Sprint 13-2).
 *
 * Toutes les sorties passent par `execute` : `--json` renvoie l'objet projet
 * machine, le mode humain un bloc ou un tableau.
 *
 * Codes de sortie (matrice `exitCodeFor`) :
 * - `0` succès ;
 * - `1` refus de suppression sans `--force`, erreur d'exécution ;
 * - `3` projet introuvable (`ProjectNotFoundError`) ;
 * - `4` validation Zod (nom, statut, UUID).
 *
 * @param program - Programme Commander racine.
 * @param runtime - Sorties, répertoire de données et horloge.
 */
export function registerProjectCommands(program: Command, runtime: CliRuntime): void {
  const project = program
    .command('project')
    .description('gérer les projets EKTS (création, liste, détail, suppression)');

  // --- project create ---
  withOutputFlags(
    project
      .command('create <name>')
      .description('créer un nouveau projet')
      .option('-d, --description <text>', 'description du projet')
      .addOption(
        new Option('-s, --status <status>', 'statut du projet').choices([
          ...ProjectStatusSchema.options,
        ]),
      ),
  ).action(async (name: string, options: ProjectCreateCliOptions, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = runtime.openServices({
        dataDir: runtime.dataDir,
        embeddingsMode: 'disabled',
      });

      try {
        const created = await services.projects.createProject({
          name,
          ...(options.description === undefined ? {} : { description: options.description }),
          ...(options.status === undefined ? {} : { status: options.status }),
        });

        return {
          human: [palette.success('✅ Projet créé'), '', renderProject(created, palette)].join(
            '\n',
          ),
          json: created,
        };
      } finally {
        services.close();
      }
    });
  });

  // --- project list ---
  withOutputFlags(
    project
      .command('list')
      .description('lister les projets')
      .addOption(
        new Option('-s, --status <status>', 'filtrer par statut').choices([
          ...ProjectStatusSchema.options,
        ]),
      )
      .option('-n, --limit <n>', 'nombre maximum de projets', parseLimit, 50),
  ).action(async (options: ProjectListCliOptions, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = runtime.openServices({
        dataDir: runtime.dataDir,
        embeddingsMode: 'disabled',
      });

      try {
        const filters =
          options.status === undefined ? undefined : { status: parseStatus(options.status) };
        const projects = await services.projects.listProjects({
          ...(filters ?? {}),
          limit: options.limit,
        });

        return {
          human: renderProjectList(projects, palette),
          json: { count: projects.length, projects },
        };
      } finally {
        services.close();
      }
    });
  });

  // --- project show ---
  withOutputFlags(
    project.command('show <id>').description('afficher les détails d’un projet'),
  ).action(async (id: string, _options: unknown, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = runtime.openServices({
        dataDir: runtime.dataDir,
        embeddingsMode: 'disabled',
      });

      try {
        // `getProjectOrThrow` lève `ProjectNotFoundError` → code 3.
        const found = await services.projects.getProjectOrThrow(
          parseProjectIdParam(id, 'id de projet'),
        );

        return { human: renderProject(found, palette), json: found };
      } finally {
        services.close();
      }
    });
  });

  // --- project delete ---
  withOutputFlags(
    project
      .command('delete <id>')
      .description('supprimer un projet (les audits associés sont conservés, project_id à NULL)')
      .option('-f, --force', 'supprimer sans confirmation'),
  ).action(async (id: string, options: ProjectIdCliOptions, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = runtime.openServices({
        dataDir: runtime.dataDir,
        embeddingsMode: 'disabled',
      });

      try {
        const validId = parseProjectIdParam(id, 'id de projet');

        if (options.force !== true) {
          // Aucune entrée interactive ici : le refus est explicite et le code
          // de sortie vaut 1, conformément à la matrice de Sprint 13-2.
          throw new EktsError(
            `confirmation requise pour supprimer le projet ${validId} — ajoutez --force`,
            'CONFIRMATION_REQUIRED',
          );
        }

        // Conserve les audits et les ressources (ON DELETE SET NULL).
        await services.projects.deleteProject(validId);

        return {
          human: palette.success(
            `🗑️ Projet ${validId} supprimé (audits associés conservés avec project_id = NULL)`,
          ),
          json: { deleted: true, id: validId },
        };
      } finally {
        services.close();
      }
    });
  });
}
