import type { Command } from 'commander';

import type { BestPracticeCategory } from '../../best-practices/best-practice.types.js';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import { openDatabase } from '../../data/database.js';
import { ProjectRepository } from '../../data/repositories/project-repository.js';
import { ResourceNotFoundError, ValidationError } from '../../shared/errors.js';
import { AuditSchema } from '../../storage/schema.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import type { CliRuntime } from '../runtime.js';

/** Catégories acceptées (5 dimensions + général). */
const VALID_CATEGORIES: readonly BestPracticeCategory[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
  'general',
];

/** Champs de tri autorisés (liste blanche). */
const SORT_FIELDS = ['created_at', 'updated_at', 'occurrence_count', 'title'] as const;

interface BestPracticeServices {
  readonly service: BestPracticeService;
  readonly projectRepo: ProjectRepository;
  close(): void;
}

/**
 * Ouvre les services `bestpractice` sur les bases locales du runtime.
 *
 * `AuditSchema.createSchema()` est appelé (idempotent) car `extract` lit
 * `audit_*` — les autres sous-commandes n'y touchent pas.
 */
function openBestPracticeServices(
  runtime: CliRuntime,
  criteria?: { minOccurrences?: number; minAudits?: number },
): BestPracticeServices {
  const database = openDatabase({ dataDir: runtime.dataDir });
  new AuditSchema(database.connection).createSchema();
  return {
    service: new BestPracticeService(database.connection, criteria),
    projectRepo: new ProjectRepository(database.connection),
    close: () => database.close(),
  };
}

/** Valide une catégorie (code 4 si hors liste). */
function parseCategory(raw: string): BestPracticeCategory {
  if (!VALID_CATEGORIES.includes(raw as BestPracticeCategory)) {
    throw new ValidationError([
      `catégorie invalide « ${raw} » (valeurs acceptées : ${VALID_CATEGORIES.join(', ')})`,
    ]);
  }
  return raw as BestPracticeCategory;
}

/** Parse un entier borné (code 4 sinon). */
function parseIntOption(raw: string, label: string, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError([
      `${label} invalide « ${raw} » (entier entre ${String(min)} et ${String(max)} attendu)`,
    ]);
  }
  return value;
}

/** Valide un identifiant UUID (code 4 sinon). */
function requireUuid(raw: string, label: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(raw)) {
    throw new ValidationError([`${label} invalide « ${raw} » (UUID attendu)`]);
  }
  return raw;
}

/** Transforme `a, b ,c` en tags nettoyés (vide ignoré). */
function parseTags(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/** Rendu humain compact d'une pratique (blocs `list`/`search`/`show`). */
function lineFor(practice: {
  id: string;
  title: string;
  category: string;
  occurrenceCount: number;
  isManual: boolean;
  tags: string[];
}): string {
  const mark = practice.isManual ? '📝' : '🤖';
  const tags = practice.tags.length > 0 ? ` — ${practice.tags.join(', ')}` : '';
  return `${mark} ${practice.id.slice(0, 8)}  ${practice.title} [${practice.category}] ×${practice.occurrenceCount}${tags}`;
}

/**
 * Commandes `ekts bestpractice|bp list|search|add|show|delete|extract`
 * (Sprint 15-3, C15.7 → C15.10).
 *
 * Codes retour (contrat maison S13/S14) :
 * - `0` succès (y compris liste/extraction vides — non bloquant, C15.20) ;
 * - `1` refus de `delete` sans `--yes`, erreur d'exécution ;
 * - `2` usage (argument manquant — Commander) ;
 * - `3` ressource introuvable (`ResourceNotFoundError`) ;
 * - `4` entrée invalide (catégorie, entier borné, UUID, titre/description).
 *
 * @param program - Programme Commander racine.
 * @param runtime - Sorties, `dataDir`, horloge du runtime CLI.
 */
export function registerBestPracticeCommands(program: Command, runtime: CliRuntime): void {
  const bp = program
    .command('bestpractice')
    .alias('bp')
    .description('gérer les bonnes pratiques (capitalisation des connaissances)');

  // --- bestpractice list ---
  withOutputFlags(
    bp
      .command('list')
      .description('lister les bonnes pratiques avec filtres')
      .option('-c, --category <category>', `catégorie (${VALID_CATEGORIES.join(', ')})`)
      .option('-t, --tag <tag>', 'filtrer par tag')
      .option('-p, --project <id>', 'filtrer par projet source (UUID)')
      .option('--manual', 'uniquement les pratiques manuelles')
      .option('--auto', 'uniquement les pratiques automatiques')
      .option('--sort <field>', `tri (${SORT_FIELDS.join(', ')})`, 'created_at')
      .option('--order <dir>', 'ordre (asc, desc)', 'desc')
      .option('-l, --limit <n>', 'nombre maximum de résultats', '20'),
  ).action(async (options: Record<string, string | boolean>) => {
    await execute(
      commandOf(program, 'bestpractice', 'list'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openBestPracticeServices(runtime);
        try {
          if (options.category !== undefined) {
            parseCategory(String(options.category));
          }
          if (options.manual === true && options.auto === true) {
            throw new ValidationError(['options --manual et --auto mutuellement exclusives']);
          }
          const limit = parseIntOption(String(options.limit ?? '20'), '--limit', 1, 500);
          const orderDir = String(options.order);
          if (orderDir !== 'asc' && orderDir !== 'desc') {
            throw new ValidationError(['--order invalide (asc ou desc attendu)']);
          }
          const orderBy = String(options.sort) as 'created_at';
          if (!(SORT_FIELDS as readonly string[]).includes(String(options.sort))) {
            throw new ValidationError([
              `--sort invalide « ${String(options.sort)} » (${SORT_FIELDS.join(', ')})`,
            ]);
          }
          if (options.project !== undefined) {
            requireUuid(String(options.project), '--project');
          }

          const practices = services.service.list({
            category:
              options.category === undefined ? undefined : parseCategory(String(options.category)),
            tag: options.tag === undefined ? undefined : String(options.tag),
            projectId: options.project === undefined ? undefined : String(options.project),
            isManual: options.manual === true ? true : options.auto === true ? false : undefined,
            limit,
            orderBy,
            orderDir,
          });

          const total = services.service.count();
          const human =
            practices.length === 0
              ? palette.warning('Aucune bonne pratique trouvée.')
              : `${practices.map(lineFor).join('\n')}\n\n${String(practices.length)} bonne(s) pratique(s) sur ${String(total)}`;

          return {
            human,
            json: { count: practices.length, total, practices },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- bestpractice search <query> ---
  withOutputFlags(
    bp
      .command('search <query>')
      .description('rechercher des bonnes pratiques (recherche hybride FTS5)')
      .option('-c, --category <category>', 'filtrer par catégorie')
      .option('-l, --limit <n>', 'nombre maximum de résultats', '10'),
  ).action(async (query: string, options: Record<string, string>) => {
    await execute(
      commandOf(program, 'bestpractice', 'search'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openBestPracticeServices(runtime);
        try {
          const limit = parseIntOption(options.limit ?? '10', '--limit', 1, 500);
          const category =
            options.category === undefined ? undefined : parseCategory(options.category);

          const results = services.service.searchPractices({ query, category, limit });
          const count = services.service.count();

          const human =
            results.length === 0
              ? palette.warning('Aucun résultat pour cette recherche.')
              : `${results
                  .map((result) => {
                    const practice = result.practice;
                    const score = `[${(result.score * 100).toFixed(0)}%] `;
                    const tags =
                      practice.tags.length > 0 ? `\n   Tags : ${practice.tags.join(', ')}` : '';
                    const mode = practice.isManual ? 'Manuelle' : 'Automatique';
                    return `${score}${practice.title} (${practice.category})\n   ${practice.description}${tags}\n   Occurrences : ${String(practice.occurrenceCount)} | ${mode}`;
                  })
                  .join(
                    '\n',
                  )}\n\n${String(results.length)} résultat(s) / ${String(count)} pratique(s)`;

          return {
            human,
            json: {
              query,
              count: results.length,
              total: count,
              results: results.map((result) => ({
                id: result.practice.id,
                title: result.practice.title,
                category: result.practice.category,
                score: result.score,
                matchType: result.matchType,
                practice: result.practice,
              })),
            },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- bestpractice add ---
  withOutputFlags(
    bp
      .command('add')
      .description('ajouter manuellement une bonne pratique')
      .requiredOption('-t, --title <title>', 'titre de la bonne pratique')
      .requiredOption('-d, --description <desc>', 'description détaillée')
      .requiredOption('-c, --category <category>', `catégorie (${VALID_CATEGORIES.join(', ')})`)
      .option('--tags <tags>', 'tags séparés par des virgules'),
  ).action(async (options: Record<string, string>) => {
    await execute(
      commandOf(program, 'bestpractice', 'add'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openBestPracticeServices(runtime);
        try {
          const title = String(options.title ?? '').trim();
          const description = String(options.description ?? '').trim();
          if (title.length < 3) {
            throw new ValidationError(['titre trop court (3 caractères minimum)']);
          }
          if (description.length < 10) {
            throw new ValidationError(['description trop courte (10 caractères minimum)']);
          }
          const category = parseCategory(String(options.category ?? ''));

          const practice = services.service.create({
            title,
            description,
            category,
            tags: parseTags(options.tags),
          });

          const human = [
            palette.success('✅ Bonne pratique créée.'),
            `   ID : ${practice.id}`,
            `   Titre : ${practice.title}`,
            `   Catégorie : ${practice.category}`,
            `   Tags : ${practice.tags.join(', ') || '(aucun)'}`,
          ].join('\n');

          return { human, json: practice };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- bestpractice show <id> ---
  withOutputFlags(
    bp.command('show <id>').description("afficher le détail d'une bonne pratique"),
  ).action(async (id: string) => {
    await execute(
      commandOf(program, 'bestpractice', 'show'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openBestPracticeServices(runtime);
        try {
          const practice = services.service.getById(requireUuid(id, '<id>'));
          if (practice === null) {
            throw new ResourceNotFoundError(id);
          }

          const links = services.service.findLinkedFindings(practice.id);
          const lines = [
            `${palette.accent('===')} ${practice.title} ${palette.accent('===')}`,
            `ID : ${practice.id}`,
            `Catégorie : ${practice.category}`,
            `Description : ${practice.description}`,
            `Tags : ${practice.tags.join(', ') || '(aucun)'}`,
            `Occurrences : ${String(practice.occurrenceCount)}`,
            `Type : ${practice.isManual ? 'Manuelle' : 'Automatique'}`,
            `Créée : ${practice.createdAt}`,
            `Modifiée : ${practice.updatedAt}`,
          ];
          if (practice.sourceProjectIds.length > 0) {
            lines.push(`Projets source : ${practice.sourceProjectIds.join(', ')}`);
          }
          if (links.length > 0) {
            lines.push('', `Findings associés (${String(links.length)}) :`);
            for (const link of links) {
              lines.push(
                `  - [${link.dimension}] ${link.findingTitle} (confiance : ${(link.confidence * 100).toFixed(0)} %)`,
              );
            }
          }

          return {
            human: lines.join('\n'),
            json: { practice, linkedFindings: links },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- bestpractice delete <id> ---
  withOutputFlags(
    bp
      .command('delete <id>')
      .description('supprimer une bonne pratique')
      .option('-y, --yes', 'confirmer la suppression'),
  ).action(async (id: string, options: Record<string, boolean>) => {
    await execute(
      commandOf(program, 'bestpractice', 'delete'),
      runtime,
      async (): Promise<CommandResult> => {
        const services = openBestPracticeServices(runtime);
        try {
          const practice = services.service.getById(requireUuid(id, '<id>'));
          if (practice === null) {
            throw new ResourceNotFoundError(id);
          }
          if (options.yes !== true) {
            // Confirmation non interactive refusée (aligné `project delete --force`).
            throw new Error(
              `confirmation requise pour supprimer « ${practice.title} » — ajoutez --yes`,
            );
          }

          services.service.delete(practice.id);
          return {
            human: `✅ Bonne pratique supprimée : ${practice.title}`,
            json: { deleted: true, id: practice.id, title: practice.title },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- bestpractice extract <projectId> ---
  withOutputFlags(
    bp
      .command('extract <projectId>')
      .description("extraire automatiquement les bonnes pratiques depuis les audits d'un projet")
      .option('--min-occurrences <n>', 'occurrences minimum pour extraction', '2')
      .option('--min-audits <n>', 'audits minimum du projet', '2')
      .option('--min-confidence <n>', 'confiance minimum des associations (0-1)', '0.5'),
  ).action(async (projectId: string, options: Record<string, string>) => {
    await execute(
      commandOf(program, 'bestpractice', 'extract'),
      runtime,
      async (): Promise<CommandResult> => {
        const minOccurrences = parseIntOption(
          options.minOccurrences ?? '2',
          '--min-occurrences',
          1,
          100,
        );
        const minAudits = parseIntOption(options.minAudits ?? '2', '--min-audits', 1, 1000);
        const confidenceRaw = Number(options.minConfidence ?? '0.5');
        if (Number.isNaN(confidenceRaw) || confidenceRaw < 0 || confidenceRaw > 1) {
          throw new ValidationError(['--min-confidence invalide (nombre entre 0 et 1)']);
        }

        const services = openBestPracticeServices(runtime, {
          minOccurrences,
          minAudits,
        });
        try {
          const project = services.projectRepo.getById(projectId);
          if (project === null) {
            throw new ResourceNotFoundError(projectId);
          }

          const report = services.service.extractFromProject(projectId);

          const human = [
            `=== Rapport d'extraction — ${project.name} ===`,
            `Audits analysés : ${String(report.auditsAnalyzed)}`,
            `Bonnes pratiques extraites : ${String(report.practicesExtracted)}`,
            `Bonnes pratiques fusionnées : ${String(report.practicesMerged)}`,
            `Associations créées : ${String(report.linksCreated)}`,
            `Durée : ${String(report.durationMs)} ms`,
          ].join('\n');

          return { human, json: { projectId, ...report } };
        } finally {
          services.close();
        }
      },
    );
  });
}

/**
 * Récupère la sous-commande courante par chemin (pour `resolveOutputFlags` :
 * les options `--json`/`--colors` sont héritées du programme racine).
 */
function commandOf(program: Command, ...path: string[]): Command {
  let current: Command = program;
  for (const name of path) {
    const next = current.commands.find((candidate) => candidate.name() === name);
    if (next === undefined) {
      throw new Error(`commande introuvable : ${path.join(' ')}`);
    }
    current = next;
  }
  return current;
}
