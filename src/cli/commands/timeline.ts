import { writeFile } from 'node:fs/promises';
import { Option, type Command } from 'commander';

import { openDatabase } from '../../data/database.js';
import { ProjectRepository } from '../../data/repositories/project-repository.js';
import { EktsError, ValidationError } from '../../shared/errors.js';
import { AlertRepository } from '../../storage/alert-repository.js';
import { AuditRepository } from '../../storage/audit-repository.js';
import { AuditSchema } from '../../storage/schema.js';
import { AlertManager } from '../../timeline/alert-manager.js';
import { ChartGenerator, type ChartFormat } from '../../timeline/chart-generator.js';
import { TimelineAnalyzer } from '../../timeline/timeline-analyzer.js';
import { TrendDetector } from '../../timeline/trend-detector.js';
import type { TimelineAnalysis, TrendReport } from '../../timeline/timeline.types.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import { renderTable, type Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

const DIMENSIONS = ['performance', 'accessibility', 'seo', 'ux', 'content'] as const;

/** Services ouverts localement (mêmes bases que la commande `audit`). */
interface TimelineServices {
  readonly analyzer: TimelineAnalyzer;
  readonly detector: TrendDetector;
  readonly alertRepo: AlertRepository;
  readonly alertManager: AlertManager;
  readonly projectRepo: ProjectRepository;
  readonly auditRepo: AuditRepository;
  close(): void;
}

/**
 * Ouvre les services de timeline sur le répertoire de données du runtime.
 *
 * Schéma d'audit créé à la volée (`AuditSchema`), migrations 001 → 004
 * appliquées par `openDatabase` (table `alerts` incluse).
 *
 * @param runtime - Runtime CLI (répertoire de données).
 * @param threshold - Seuil de régression pour le manager (défaut 10).
 */
function openTimelineServices(runtime: CliRuntime, threshold = 10): TimelineServices {
  const database = openDatabase({ dataDir: runtime.dataDir });
  new AuditSchema(database.connection).createSchema();

  const alertRepo = new AlertRepository(database.connection);
  return {
    analyzer: new TimelineAnalyzer(database.connection),
    detector: new TrendDetector(),
    alertRepo,
    alertManager: new AlertManager(alertRepo, { regressionThreshold: threshold }),
    projectRepo: new ProjectRepository(database.connection),
    auditRepo: new AuditRepository(database.connection),
    close: (): void => {
      database.close();
    },
  };
}

/** Valide un identifiant de projet positionnel (code 4 si invalide). */
function requireProjectId(raw: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    throw new ValidationError([`identifiant de projet invalide : ${raw} (UUID attendu)`]);
  }
  return raw;
}

/** Valide un identifiant UUID générique (alertes, projets). */
function requireUuid(raw: string, label: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    throw new ValidationError([`${label} invalide : ${raw} (UUID attendu)`]);
  }
  return raw;
}

/**
 * Parse une date `YYYY-MM-DD` (code 4 si invalide).
 *
 * @param raw - Date calendrier.
 * @param label - Libellé d'option pour l'erreur.
 * @param endOfDay - `true` pour `--end` : borne inclusive en fin de journée
 *   (23:59:59.999), sinon minuit UTC (début de journée).
 */
function parseDate(raw: string, label: string, endOfDay = false): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new ValidationError([`${label} invalide « ${raw} » (format YYYY-MM-DD attendu)`]);
  }
  const date = new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError([`${label} invalide « ${raw} » (format YYYY-MM-DD attendu)`]);
  }
  return date;
}

/** Parse un entier positif d'option (code 4 si invalide). */
function parseIntOption(raw: string, label: string, min: number, max?: number): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || (max !== undefined && value > max)) {
    const bounds = max === undefined ? `≥ ${String(min)}` : `${String(min)}-${String(max)}`;
    throw new ValidationError([`${label} invalide « ${raw} » (entier ${bounds} attendu)`]);
  }
  return value;
}

/**
 * Projets à parcourir : le projet demandé (erreur 3 levée par `analyze`
 * s'il est absent), ou tous les projets dans l'ordre du repo.
 */
function resolveProjects(services: TimelineServices, projectId?: string): string[] {
  if (projectId !== undefined) {
    return [projectId];
  }
  return services.projectRepo.list().map((project) => project.id);
}

/** Bloc humain d'une analyse. */
function renderAnalysis(analysis: TimelineAnalysis, palette: Palette): string {
  if (analysis.totalAudits === 0) {
    return [
      palette.bold(`📈 ${analysis.projectName}`),
      palette.warning('  ⚠️ Aucun audit dans la période (timeline vide).'),
    ].join('\n');
  }

  return [
    palette.bold(`📈 ${analysis.projectName}`),
    `  Période  ${analysis.startDate.toISOString().slice(0, 10)} → ${analysis.endDate.toISOString().slice(0, 10)}`,
    `  Audits   ${String(analysis.totalAudits)}`,
    '',
    renderTable({
      columns: [
        { header: 'DIMENSION' },
        { header: 'MOYENNE', align: 'right' },
        { header: 'MIN → MAX', align: 'right' },
        { header: 'TENDANCE' },
      ],
      rows: analysis.dimensionScores.map((entry) => [
        entry.dimension,
        entry.averageScore.toFixed(1),
        `${String(entry.minScore)} → ${String(entry.maxScore)}`,
        entry.trend.description,
      ]),
    }),
  ].join('\n');
}

/** Bloc humain d'un rapport de tendances. */
function renderTrends(report: TrendReport, palette: Palette): string {
  const lines = [
    palette.bold(
      `🧭 Tendances — ${report.projectId.slice(0, 8)} (fenêtre ${String(report.windowSize)} audits)`,
    ),
    '',
    renderTable({
      columns: [
        { header: 'DIMENSION' },
        { header: 'DIRECTION' },
        { header: 'PENTE', align: 'right' },
        { header: 'CONFIANCE', align: 'right' },
      ],
      rows: Array.from(report.trends.entries(), ([dimension, trend]) => [
        dimension,
        trend.direction === 'improving'
          ? 'amélioration'
          : trend.direction === 'declining'
            ? 'régression'
            : 'stable',
        trend.slope.toFixed(2),
        `${(trend.confidence * 100).toFixed(0)} %`,
      ]),
    }),
    '',
    ...report.recommendations.map((line) => `  ${line}`),
  ];
  if (report.overallTrend.direction === 'declining') {
    lines.push('', palette.warning('  ⚠️ Tendance globale en régression.'));
  }
  return lines.join('\n');
}

/** Bloc humain des alertes. */
function renderAlerts(
  alerts: Awaited<ReturnType<AlertManager['getAllAlerts']>>,
  palette: Palette,
): string {
  if (alerts.length === 0) {
    return palette.warning('🔕 Aucune alerte.');
  }
  return [
    palette.bold(`🔔 Alertes (${String(alerts.length)})`),
    '',
    renderTable({
      columns: [
        { header: 'ID' },
        { header: 'PROJET' },
        { header: 'DIMENSION' },
        { header: 'SCORE' },
        { header: 'PERTE', align: 'right' },
        { header: 'DATE' },
        { header: 'STATUT' },
      ],
      rows: alerts.map((alert) => [
        alert.id.slice(0, 8),
        alert.projectId.slice(0, 8),
        alert.dimension,
        `${String(alert.scoreBefore)} → ${String(alert.scoreAfter)}`,
        `-${String(alert.regressionPoints)}`,
        alert.createdAt.slice(0, 10),
        alert.resolvedAt === null ? 'active' : 'résolue',
      ]),
    }),
  ].join('\n');
}

/**
 * Commandes `ekts timeline analyze|trends|alerts|chart` (Sprint 14).
 *
 * Codes de sortie (matrice `exitCodeFor`) :
 * - `0` succès (timeline vide et alertes vides incluses — non bloquant) ;
 * - `1` erreur d'exécution (I/O graphique, base) ;
 * - `2` argument Commander manquant ;
 * - `3` projet introuvable (`ProjectNotFoundError`) ;
 * - `4` validation (dates, seuils, UUID, format, dimension, taille).
 *
 * @param program - Programme Commander racine.
 * @param runtime - Sorties, répertoire de données et horloge.
 */
export function registerTimelineCommands(program: Command, runtime: CliRuntime): void {
  const timeline = program
    .command('timeline')
    .description('suivi temporel des projets : timeline, tendances, alertes, graphiques');

  // --- timeline analyze [projectId] ---
  withOutputFlags(
    timeline
      .command('analyze [projectId]')
      .description("analyser la timeline d'un projet (tous les projets si omis)")
      .option('--start <date>', 'date de début (YYYY-MM-DD)')
      .option('--end <date>', 'date de fin (YYYY-MM-DD)')
      .option('--min-audits <n>', "minimum d'audits attendus pour un affichage complet", '2'),
  ).action(
    async (
      projectId: string | undefined,
      options: { start?: string; end?: string; minAudits: string },
      command: Command,
    ) => {
      await execute(command, runtime, async (palette): Promise<CommandResult> => {
        const services = openTimelineServices(runtime);
        try {
          const start =
            options.start === undefined ? undefined : parseDate(options.start, '--start');
          const end = options.end === undefined ? undefined : parseDate(options.end, '--end', true);
          const minAudits = parseIntOption(options.minAudits, '--min-audits', 0);
          const targets = resolveProjects(services, projectId);

          const analyses: TimelineAnalysis[] = [];
          for (const target of targets) {
            analyses.push(await services.analyzer.analyze(target, { start, end }));
          }

          const single = projectId !== undefined ? analyses[0] : undefined;
          const human =
            single !== undefined
              ? single.totalAudits < minAudits
                ? [
                    palette.warning(
                      `⚠️ ${String(single.totalAudits)} audit(s) — minimum ${String(minAudits)} demandé.`,
                    ),
                    renderAnalysis(single, palette),
                  ].join('\n')
                : renderAnalysis(single, palette)
              : analyses
                  .map((entry) =>
                    entry.totalAudits < minAudits
                      ? palette.warning(
                          `⚠️ ${entry.projectName} : ${String(entry.totalAudits)} audit(s) < minimum ${String(minAudits)}.`,
                        )
                      : renderAnalysis(entry, palette),
                  )
                  .join('\n\n');

          return {
            human,
            json:
              single !== undefined
                ? { ...single, minAudits }
                : { count: analyses.length, minAudits, timelines: analyses },
          };
        } finally {
          services.close();
        }
      });
    },
  );

  // --- timeline trends [projectId] ---
  withOutputFlags(
    timeline
      .command('trends [projectId]')
      .description("détecter les tendances d'évolution (régression linéaire)")
      .option('--lookback <days>', 'période de référence en jours (fenêtre glissante)', '90')
      .option('--threshold <n>', 'seuil de régression en points (régressions affichées)', '10'),
  ).action(
    async (
      projectId: string | undefined,
      options: { lookback: string; threshold: string },
      command: Command,
    ) => {
      await execute(command, runtime, async (palette): Promise<CommandResult> => {
        const threshold = parseIntOption(options.threshold, '--threshold', 1, 100);
        const services = openTimelineServices(runtime, threshold);
        try {
          const lookback = parseIntOption(options.lookback, '--lookback', 1);
          const end = new Date();
          const start = new Date(end.getTime() - lookback * 86_400_000);
          const targets = resolveProjects(services, projectId);

          const reports: Array<{
            analysis: TimelineAnalysis;
            report: TrendReport;
            regressions: ReturnType<TrendDetector['detectRegressions']>;
          }> = [];
          for (const target of targets) {
            const analysis = await services.analyzer.analyze(target, { start, end });
            const report = services.detector.detectTrends(analysis);
            const regressions = services.detector.detectRegressions(analysis, threshold);
            reports.push({ analysis, report, regressions });
          }

          const human = reports
            .map(({ analysis, report, regressions }) =>
              [
                renderTrends(report, palette),
                analysis.totalAudits === 0
                  ? ''
                  : regressions.length === 0
                    ? palette.success('  ✅ Aucune régression au-dessus du seuil.')
                    : [
                        palette.warning(
                          `  ⚠️ Régressions (${String(regressions.length)}) au-dessus de ${String(threshold)} points :`,
                        ),
                        ...regressions.map(
                          (entry) =>
                            `    - ${entry.dimension} : ${String(entry.scoreBefore)} → ${String(entry.scoreAfter)} (-${String(entry.regressionPoints)})`,
                        ),
                      ].join('\n'),
              ].join('\n'),
            )
            .join('\n\n');

          const singleReport = projectId === undefined ? undefined : reports[0];
          const json =
            singleReport !== undefined
              ? {
                  projectId: singleReport.analysis.projectId,
                  projectName: singleReport.analysis.projectName,
                  totalAudits: singleReport.analysis.totalAudits,
                  trends: Array.from(singleReport.report.trends, ([dimension, trend]) => ({
                    dimension,
                    ...trend,
                  })),
                  overallTrend: singleReport.report.overallTrend,
                  recommendations: singleReport.report.recommendations,
                  regressions: singleReport.regressions,
                  threshold,
                  lookbackDays: lookback,
                }
              : {
                  count: reports.length,
                  threshold,
                  lookbackDays: lookback,
                  timelines: reports.map(({ analysis, report, regressions }) => ({
                    projectId: analysis.projectId,
                    projectName: analysis.projectName,
                    totalAudits: analysis.totalAudits,
                    trends: Array.from(report.trends.entries(), ([dimension, trend]) => ({
                      dimension,
                      ...trend,
                    })),
                    overallTrend: report.overallTrend,
                    recommendations: report.recommendations,
                    regressions,
                  })),
                };

          return { human, json };
        } finally {
          services.close();
        }
      });
    },
  );

  // --- timeline alerts [projectId] ---
  withOutputFlags(
    timeline
      .command('alerts [projectId]')
      .description('consulter et créer les alertes de régression')
      .option('--all', 'inclure les alertes résolues')
      .option('--resolve <id>', "marquer l'alerte comme résolue")
      .option('--threshold <n>', 'seuil de régression en points (création)', '10')
      .option('--check', 'détecter les régressions et créer les alertes manquantes'),
  ).action(
    async (
      projectId: string | undefined,
      options: { all?: boolean; resolve?: string; threshold: string; check?: boolean },
      command: Command,
    ) => {
      await execute(command, runtime, async (palette): Promise<CommandResult> => {
        const threshold = parseIntOption(options.threshold, '--threshold', 1, 100);
        const services = openTimelineServices(runtime, threshold);
        try {
          if (options.resolve !== undefined) {
            const alertId = requireUuid(options.resolve, '--resolve');
            await services.alertManager.resolveAlert(alertId);
            return {
              human: palette.success(`✅ Alerte ${alertId.slice(0, 8)} résolue.`),
              json: { resolved: true, alertId },
            };
          }

          let created: Awaited<ReturnType<AlertManager['checkAndCreateAlerts']>> = [];
          if (options.check === true) {
            const targets = resolveProjects(services, projectId);
            for (const target of targets) {
              const analysis = await services.analyzer.analyze(target);
              const report = services.detector.detectTrends(analysis);
              const regressions = services.detector.detectRegressions(analysis, threshold);
              created = created.concat(
                await services.alertManager.checkAndCreateAlerts(report, regressions),
              );
            }
          }

          const alerts = options.all
            ? await services.alertManager.getAllAlerts({
                ...(projectId === undefined ? {} : { projectId }),
              })
            : await services.alertManager.getActiveAlerts(projectId);

          const json = {
            created: created.length,
            count: alerts.length,
            alerts,
          };
          const human = [
            options.check === true
              ? created.length === 0
                ? palette.success('✅ Aucune nouvelle alerte (idempotent ou aucun déclin).')
                : palette.warning(`🔔 ${String(created.length)} alerte(s) créée(s).`)
              : '',
            renderAlerts(alerts, palette),
          ]
            .filter((block) => block !== '')
            .join('\n\n');

          return { human, json };
        } finally {
          services.close();
        }
      });
    },
  );

  // --- timeline chart <projectId> ---
  withOutputFlags(
    timeline
      .command('chart <projectId>')
      .description('générer un graphique de timeline (SVG ou PNG)')
      .addOption(
        new Option('-f, --format <format>', 'format de sortie')
          .choices(['svg', 'png'])
          .default('svg'),
      )
      .option('-o, --output <path>', 'fichier de sortie', 'timeline.svg')
      .addOption(
        new Option('-d, --dimension <dimension>', 'dimension unique à tracer').choices([
          ...DIMENSIONS,
        ]),
      )
      .option('--width <n>', 'largeur en pixels (50-4000)', '800')
      .option('--height <n>', 'hauteur en pixels (50-4000)', '400'),
  ).action(
    async (
      projectId: string,
      options: {
        format: ChartFormat;
        output: string;
        dimension?: (typeof DIMENSIONS)[number];
        width: string;
        height: string;
      },
      command: Command,
    ) => {
      await execute(command, runtime, async (palette): Promise<CommandResult> => {
        requireProjectId(projectId);
        const width = parseIntOption(options.width, '--width', 50, 4000);
        const height = parseIntOption(options.height, '--height', 50, 4000);
        const services = openTimelineServices(runtime);
        try {
          const analysis = await services.analyzer.analyze(projectId);
          const generator = new ChartGenerator();
          const chartOptions = { width, height };
          const payload =
            options.dimension === undefined
              ? generator.generateTimelineChart(analysis, options.format, chartOptions)
              : generator.generateDimensionChart(
                  analysis,
                  options.dimension,
                  options.format,
                  chartOptions,
                );

          await writeFile(options.output, payload);
          return {
            human: palette.success(`✅ Graphique généré : ${options.output}`),
            json: {
              path: options.output,
              format: options.format,
              projectId: analysis.projectId,
              projectName: analysis.projectName,
              totalAudits: analysis.totalAudits,
              width,
              height,
              dimension: options.dimension ?? 'all',
            },
          };
        } catch (error) {
          if (error instanceof EktsError) {
            throw error;
          }
          throw new ValidationError([
            `écriture impossible « ${options.output} » : ${error instanceof Error ? error.message : String(error)}`,
          ]);
        } finally {
          services.close();
        }
      });
    },
  );
}
