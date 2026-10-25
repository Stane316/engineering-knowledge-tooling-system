import type { Command } from 'commander';

import type { AnalysisDimension, Priority, Severity } from '../../analysis/types.js';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import { openDatabase } from '../../data/database.js';
import { ProjectRepository } from '../../data/repositories/project-repository.js';
import { RecommendationContext } from '../../recommendations/recommendation-context.js';
import { RecommendationEngine } from '../../recommendations/recommendation-engine.js';
import { RecommendationRepository } from '../../recommendations/recommendation-repository.js';
import { ResourceNotFoundError, ValidationError } from '../../shared/errors.js';
import { AuditSchema } from '../../storage/schema.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import type { CliRuntime } from '../runtime.js';

/** Dimensions acceptées (5 dimensions d'analyse + général). */
const VALID_DIMENSIONS: readonly string[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
  'general',
];

/** Priorités acceptées (type maison Priority, inclut `info`). */
const VALID_PRIORITIES: readonly Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

interface RecommendServices {
  readonly engine: RecommendationEngine;
  readonly repository: RecommendationRepository;
  readonly projectRepo: ProjectRepository;
  close(): void;
}

/**
 * Ouvre les services `recommend` sur les bases locales du runtime.
 *
 * `AuditSchema.createSchema()` est appelé (idempotent) : `generate` lit les
 * tables `audit_*` via `RecommendationContext`.
 */
function openRecommendServices(runtime: CliRuntime): RecommendServices {
  const database = openDatabase({ dataDir: runtime.dataDir });
  new AuditSchema(database.connection).createSchema();
  const bestPractices = new BestPracticeService(database.connection);
  return {
    engine: new RecommendationEngine(
      database.connection,
      new RecommendationContext(database.connection, bestPractices),
      bestPractices,
    ),
    repository: new RecommendationRepository(database.connection),
    projectRepo: new ProjectRepository(database.connection),
    close: () => database.close(),
  };
}

/** Valide une dimension (code 4 si hors liste). */
function parseDimension(raw: string): AnalysisDimension | 'general' {
  if (!VALID_DIMENSIONS.includes(raw)) {
    throw new ValidationError([
      `dimension invalide « ${raw} » (valeurs acceptées : ${VALID_DIMENSIONS.join(', ')})`,
    ]);
  }
  return raw as AnalysisDimension | 'general';
}

/** Valide une priorité (code 4 si hors liste). */
function parsePriority(raw: string): Priority {
  if (!VALID_PRIORITIES.includes(raw as Priority)) {
    throw new ValidationError([
      `priorité invalide « ${raw} » (valeurs acceptées : ${VALID_PRIORITIES.join(', ')})`,
    ]);
  }
  return raw as Priority;
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

/** Parse un décimal borné (code 4 sinon). */
function parseFloatOption(raw: string, label: string, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError([
      `${label} invalide « ${raw} » (nombre entre ${String(min)} et ${String(max)} attendu)`,
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

/** Parse une liste CSV de dimensions (vides ignorées, validation unitaire). */
function parseDimensions(raw: string | undefined): AnalysisDimension[] | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    throw new ValidationError(['--dimensions vide (liste de dimensions attendue)']);
  }
  return parts.map((part) => {
    const dimension = parseDimension(part);
    if (dimension === 'general') {
      throw new ValidationError(["--dimensions n'accepte pas 'general' (filtre des 5 dimensions)"]);
    }
    return dimension;
  });
}

/** Rendu humain d'une recommandation (bloc generate/list). */
function lineFor(recommendation: {
  recommendationTitle: string;
  recommendationDescription: string;
  dimension: string;
  relevanceScore: number;
  priority: string;
  effort: number;
  impact: number;
  findingTitle: string | null;
  ruleId: string | null;
}): string {
  const source = recommendation.ruleId === null ? '📊 statistique' : '📏 règle';
  const finding =
    recommendation.findingTitle === null ? '' : `\n   Constat : ${recommendation.findingTitle}`;
  return (
    `${(recommendation.relevanceScore * 100).toFixed(0)}% ${recommendation.recommendationTitle} ` +
    `[${recommendation.dimension}] · priorité ${recommendation.priority} · ` +
    `effort ${String(recommendation.effort)}/5 · impact ${String(recommendation.impact)}/5 · ${source}` +
    `\n   ${recommendation.recommendationDescription}${finding}`
  );
}

/** Rendu humain d'une règle (bloc rules list). */
function ruleLine(rule: {
  id: string;
  name: string;
  dimension: string;
  severityThreshold: number;
  isActive: boolean;
  priority: string;
}): string {
  const status = rule.isActive ? '✅ active' : '❌ inactive';
  return `${rule.id.slice(0, 8)}  ${rule.name} [${rule.dimension}] ≥ sévérité ${String(rule.severityThreshold)} · ${status} · ${rule.priority}`;
}

/**
 * Commandes `ekts recommend|rec generate|list|rules {list,add,delete,toggle}`
 * (Sprint 16-3, C16.8 → C16.11).
 *
 * Codes retour (contrat maison S13-S15) :
 * - `0` succès (y compris rapport vide — non bloquant, C16.20) ;
 * - `1` refus de `rules delete` sans `--yes`, erreur d'exécution ;
 * - `2` usage (Commander) ;
 * - `3` ressource introuvable (`ResourceNotFoundError` : projet absent) ;
 * - `4` entrée invalide (dimension, priorité, entier/décimal borné, UUID,
 *   `list` sans projet, règle absente via `ValidationError`).
 *
 * Écart P3 : le spec utilise `getDatabase()`/`renderTable`/`process.exit`
 * (inexistants) et des codes uniques `1` — patterns maison appliqués.
 *
 * @param program - Programme Commander racine.
 * @param runtime - Sorties, `dataDir`, horloge du runtime CLI.
 */
export function registerRecommendCommands(program: Command, runtime: CliRuntime): void {
  const rec = program
    .command('recommend')
    .alias('rec')
    .description('générer et gérer les recommandations contextuelles');

  // --- recommend generate <projectId> ---
  withOutputFlags(
    rec
      .command('generate <projectId>')
      .description('générer les recommandations pour un projet')
      .option('-n, --max <n>', 'nombre maximum de recommandations', '10')
      .option('--min-score <score>', 'score de pertinence minimum (0-1)', '0.3')
      .option('--dimensions <dims>', 'dimensions à inclure (séparées par virgules)')
      .option('--no-rules', 'désactiver les règles explicites')
      .option('--no-statistical', 'désactiver le scoring statistique'),
  ).action(async (projectId: string, options: Record<string, string | boolean>) => {
    await execute(
      commandOf(program, 'recommend', 'generate'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openRecommendServices(runtime);
        try {
          requireUuid(projectId, 'projectId');
          // Options validées AVANT la ressource : entrée invalide = code 4 même
          // si le projet est absent (ordre maison des validateurs).
          const max = parseIntOption(String(options.max ?? '10'), '--max', 1, 500);
          const minScore = parseFloatOption(String(options.minScore ?? '0.3'), '--min-score', 0, 1);
          const dimensions = parseDimensions(
            options.dimensions === undefined ? undefined : String(options.dimensions),
          );
          const project = services.projectRepo.getById(projectId);
          if (project === null) {
            throw new ResourceNotFoundError(`projet ${projectId} introuvable`);
          }

          const report = services.engine.generateRecommendations(projectId, {
            maxRecommendations: max,
            minRelevanceScore: minScore,
            includeRules: options.rules !== false,
            includeStatistical: options.statistical !== false,
            ...(dimensions === undefined ? {} : { dimensions }),
          });

          const human =
            report.recommendations.length === 0
              ? palette.warning('Aucune recommandation générée pour ce projet.')
              : [
                  `Recommandations générées : ${String(report.totalRecommendations)}`,
                  `Règles appliquées : ${String(report.rulesApplied)}`,
                  `Scoring statistique : ${String(report.statisticalRecommendations)}`,
                  `Durée : ${String(report.durationMs)} ms`,
                  '',
                  ...report.recommendations.map(
                    (recommendation, index) => `${String(index + 1)}. ${lineFor(recommendation)}`,
                  ),
                ].join('\n');

          return {
            human,
            json: {
              projectId: report.projectId,
              totalRecommendations: report.totalRecommendations,
              rulesApplied: report.rulesApplied,
              statisticalRecommendations: report.statisticalRecommendations,
              durationMs: report.durationMs,
              recommendations: report.recommendations,
            },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- recommend list [projectId] ---
  withOutputFlags(
    rec
      .command('list [projectId]')
      .description('lister les recommandations générées pour un projet')
      .option('-n, --limit <n>', 'nombre maximum de recommandations', '20'),
  ).action(async (projectId: string | undefined, options: Record<string, string>) => {
    await execute(
      commandOf(program, 'recommend', 'list'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openRecommendServices(runtime);
        try {
          if (projectId === undefined || projectId.trim() === '') {
            throw new ValidationError(['projectId requis (ex. ekts recommend list <projectId>)']);
          }
          requireUuid(projectId, 'projectId');
          const limit = parseIntOption(String(options.limit ?? '20'), '--limit', 1, 500);
          if (services.projectRepo.getById(projectId) === null) {
            throw new ResourceNotFoundError(`projet ${projectId} introuvable`);
          }

          const recommendations = services.repository.getRecommendations(projectId, limit);
          const human =
            recommendations.length === 0
              ? palette.warning('Aucune recommandation pour ce projet (lancer generate).')
              : `${recommendations
                  .map((recommendation, index) =>
                    lineFor({
                      ...recommendation,
                      recommendationTitle: `${String(index + 1)}. ${recommendation.recommendationTitle}`,
                    }),
                  )
                  .join('\n\n')}\n\n${String(recommendations.length)} recommandation(s)`;

          return {
            human,
            json: {
              projectId,
              count: recommendations.length,
              recommendations,
            },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- recommend rules (gestion) ---
  const rules = rec.command('rules').description('gérer les règles de recommandation');

  // rules list
  withOutputFlags(
    rules
      .command('list')
      .description('lister les règles de recommandation')
      .option('-d, --dimension <dim>', `dimension (${VALID_DIMENSIONS.join(', ')})`)
      .option('--active', 'uniquement les règles actives')
      .option('-n, --limit <n>', 'nombre maximum de règles', '50'),
  ).action(async (options: Record<string, string | boolean>) => {
    await execute(
      commandOf(program, 'recommend', 'rules', 'list'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openRecommendServices(runtime);
        try {
          const limit = parseIntOption(String(options.limit ?? '50'), '--limit', 1, 500);
          const dimension =
            options.dimension === undefined ? undefined : parseDimension(String(options.dimension));

          const list = services.engine.listRules({
            ...(dimension === undefined ? {} : { dimension }),
            ...(options.active === true ? { isActive: true } : {}),
            limit,
          });

          const human =
            list.length === 0
              ? palette.warning('Aucune règle configurée.')
              : `${list.map((rule) => ruleLine(rule)).join('\n')}\n\n${String(list.length)} règle(s)`;

          return {
            human,
            json: {
              count: list.length,
              rules: list,
            },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // rules add
  withOutputFlags(
    rules
      .command('add')
      .description('ajouter une règle de recommandation')
      .requiredOption('-n, --name <name>', 'nom de la règle')
      .requiredOption('--dimension <dim>', `dimension (${VALID_DIMENSIONS.join(', ')})`)
      .requiredOption('--severity <n>', 'sévérité minimum (0-4)')
      .requiredOption('--pattern <pattern>', 'pattern de finding (titre normalisé)')
      .requiredOption('--rec-title <title>', 'titre de la recommandation générée')
      .requiredOption('--rec-desc <desc>', 'description de la recommandation générée')
      .option('--effort <n>', 'effort estimé (1-5)', '3')
      .option('--impact <n>', 'impact estimé (1-5)', '3')
      .option('--priority <p>', `priorité (${VALID_PRIORITIES.join(', ')})`, 'medium')
      .option('-d, --description <desc>', 'description de la règle', ''),
  ).action(async (options: Record<string, string>) => {
    await execute(
      commandOf(program, 'recommend', 'rules', 'add'),
      runtime,
      async (): Promise<CommandResult> => {
        const services = openRecommendServices(runtime);
        try {
          const dimension = parseDimension(String(options.dimension));
          const priority = parsePriority(String(options.priority));
          const severity = parseIntOption(String(options.severity), '--severity', 0, 4);
          const effort = parseIntOption(String(options.effort ?? '3'), '--effort', 1, 5);
          const impact = parseIntOption(String(options.impact ?? '3'), '--impact', 1, 5);

          const rule = services.engine.addRule({
            name: String(options.name),
            description: String(options.description ?? ''),
            dimension,
            severityThreshold: severity as Severity,
            pattern: String(options.pattern),
            recommendationTitle: String(options.recTitle),
            recommendationDescription: String(options.recDesc),
            effort,
            impact,
            priority,
          });

          return {
            human: `✅ Règle créée : ${rule.id}\n   Nom : ${rule.name}\n   Dimension : ${rule.dimension}\n   Pattern : ${rule.pattern}\n   Sévérité ≥ ${String(rule.severityThreshold)} · priorité ${rule.priority}`,
            json: { rule },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // rules delete <id>
  withOutputFlags(
    rules
      .command('delete <id>')
      .description('supprimer une règle')
      .option('--yes', 'confirmer la suppression'),
  ).action(async (id: string, options: Record<string, boolean>) => {
    await execute(
      commandOf(program, 'recommend', 'rules', 'delete'),
      runtime,
      async (): Promise<CommandResult> => {
        const services = openRecommendServices(runtime);
        try {
          requireUuid(id, 'ruleId');
          const rule = services.repository.getRuleById(id);
          if (rule === null) {
            throw new ValidationError([`règle ${id} introuvable`]);
          }
          if (options.yes !== true) {
            // Confirmation non interactive refusée (aligné `project delete
            // --force` / `bestpractice delete --yes`) — code 1 via Error
            // générique (écart P3 : le spec supprime sans confirmation).
            throw new Error(
              `confirmation requise pour supprimer la règle « ${rule.name} » — ajoutez --yes`,
            );
          }
          services.engine.deleteRule(id);
          return {
            human: `✅ Règle ${id} supprimée.`,
            json: { deleted: true, ruleId: id },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // rules toggle <id>
  withOutputFlags(rules.command('toggle <id>').description('activer/désactiver une règle')).action(
    async (id: string) => {
      await execute(
        commandOf(program, 'recommend', 'rules', 'toggle'),
        runtime,
        async (): Promise<CommandResult> => {
          const services = openRecommendServices(runtime);
          try {
            requireUuid(id, 'ruleId');
            const rule = services.repository.getRuleById(id);
            if (rule === null) {
              throw new ValidationError([`règle ${id} introuvable`]);
            }
            const updated = services.repository.updateRule(id, { isActive: !rule.isActive });
            return {
              human: `✅ Règle ${rule.name} ${updated.isActive ? 'activée' : 'désactivée'}.`,
              json: { rule: updated },
            };
          } finally {
            services.close();
          }
        },
      );
    },
  );
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
