import path from 'node:path';

import type { Command } from 'commander';

import { AuditComparator } from '../../reports/comparator.js';
import { MarkdownReportGenerator } from '../../reports/markdown-generator.js';
import { PDFReportGenerator } from '../../reports/pdf-generator.js';
import type { ComparisonReport, GeneratedReport } from '../../reports/types.js';
import { ResourceNotFoundError, ValidationError } from '../../shared/errors.js';
import { openDatabase, type EktsDatabase } from '../../data/database.js';
import type { Audit } from '../../storage/types.js';
import { AuditRepository } from '../../storage/audit-repository.js';
import { AuditSchema } from '../../storage/schema.js';
import { AuditSearch } from '../../storage/search.js';
import { AuditStatisticsManager } from '../../storage/statistics.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import { parseProjectId } from '../options.js';
import { renderTable } from '../output.js';
import type { CliRuntime } from '../runtime.js';

/** Formats de rapport acceptés. */
const FORMATS = ['md', 'pdf', 'both'] as const;

/** Poids de tri des priorités (décroissant). */
const PRIORITY_ORDER: Record<string, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

/** Services audits ouverts sur la connexion de la commande. */
interface AuditServices {
  readonly database: EktsDatabase;
  readonly repository: AuditRepository;
  readonly search: AuditSearch;
  readonly statistics: AuditStatisticsManager;
}

/**
 * Ouvre la connexion + le schéma audits (idempotent) pour une commande.
 *
 * @param runtime - Runtime donnant le répertoire de données.
 * @returns Services prêts à l'emploi ; `close()` obligatoire en `finally`.
 */
function openAuditServices(runtime: CliRuntime): AuditServices {
  const database = openDatabase({ dataDir: runtime.dataDir });
  new AuditSchema(database.connection).createSchema();
  const repository = new AuditRepository(database.connection);

  return {
    database,
    repository,
    search: new AuditSearch(database.connection, repository),
    statistics: new AuditStatisticsManager(database.connection),
  };
}

/**
 * Charge un audit ou échoue avec une erreur métier explicite.
 *
 * @param services - Services ouverts.
 * @param id - Identifiant demandé.
 * @returns Audit trouvé.
 * @throws {ResourceNotFoundError} Identifiant inconnu.
 */
function requireAudit(services: AuditServices, id: number): Audit {
  const audit = services.repository.findById(id);
  if (audit === null) {
    throw new ResourceNotFoundError(`audit #${String(id)} introuvable`);
  }
  return audit;
}

/**
 * Valide un identifiant numérique.
 *
 * @param raw - Valeur d'argument brute.
 * @param label - Libellé dans le message d'erreur.
 * @returns Identifiant entier strictement positif.
 * @throws {ValidationError} Nombre invalide.
 */
function parseId(raw: string, label: string): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0 || String(value) !== raw.trim()) {
    throw new ValidationError([`${label} invalide « ${raw} » (entier positif attendu)`]);
  }
  return value;
}

/**
 * Valide le format du rapport.
 *
 * @param value - Valeur brute (`--format`).
 * @returns Format normalisé.
 * @throws {ValidationError} Valeur hors `md|pdf|both`.
 */
function parseFormat(value: string): 'md' | 'pdf' | 'both' {
  if ((FORMATS as readonly string[]).includes(value)) return value as 'md' | 'pdf' | 'both';
  throw new ValidationError([`format invalide « ${value} » (valeurs : md, pdf, both)`]);
}

/**
 * Génère les rapports demandés pour un audit.
 *
 * @param audit - Audit source.
 * @param format - `md`, `pdf` ou `both`.
 * @param outputDir - Dossier de sortie résolu.
 * @returns Rapports produits.
 */
async function generateReports(
  audit: Audit,
  format: 'md' | 'pdf' | 'both',
  outputDir: string,
): Promise<GeneratedReport[]> {
  const reports: GeneratedReport[] = [];
  if (format === 'md' || format === 'both') {
    reports.push(await new MarkdownReportGenerator().generate(audit, { outputPath: outputDir }));
  }
  if (format === 'pdf' || format === 'both') {
    reports.push(await new PDFReportGenerator().generate(audit, { outputPath: outputDir }));
  }
  return reports;
}

/**
 * Génère les rapports d'une comparaison.
 *
 * @param comparison - Comparaison produite par `AuditComparator`.
 * @param format - `md`, `pdf` ou `both`.
 * @param outputDir - Dossier de sortie résolu.
 * @returns Rapports produits.
 */
async function generateComparisonReports(
  comparison: ComparisonReport,
  format: 'md' | 'pdf' | 'both',
  outputDir: string,
): Promise<GeneratedReport[]> {
  const reports: GeneratedReport[] = [];
  if (format === 'md' || format === 'both') {
    reports.push(
      await new MarkdownReportGenerator().generateComparison(comparison, { outputPath: outputDir }),
    );
  }
  if (format === 'pdf' || format === 'both') {
    reports.push(
      await new PDFReportGenerator().generateComparison(comparison, { outputPath: outputDir }),
    );
  }
  return reports;
}

/**
 * Commandes `ekts audit list|show|report|compare` (Sprint 11-3).
 *
 * Toutes les sorties passent par `execute` : `--json` renvoie des objets
 * machine, le mode humain un tableau (C11.5).
 *
 * @param program - Programme Commander racine.
 * @param runtime - Sorties, répertoire de données et horloge.
 */
export function registerAudit(program: Command, runtime: CliRuntime): void {
  const audit = program
    .command('audit')
    .description('consulter les audits et générer rapports/comparaisons');

  // --- audit list ---
  withOutputFlags(
    audit
      .command('list')
      .description('lister les audits stockés')
      .option('-n, --limit <n>', "nombre maximum d'audits", '20')
      .option('--url <url>', 'filtrer par URL')
      .option('-p, --project <id>', 'filtrer par projet (UUID)', parseProjectId)
      .option('--score-min <n>', 'score minimum (0-100)')
      .option('--score-max <n>', 'score maximum (0-100)'),
  ).action(async (options: Record<string, string | undefined>, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = openAuditServices(runtime);
      try {
        const limit = options.limit === undefined ? 20 : Number.parseInt(options.limit, 10);
        if (!Number.isInteger(limit) || limit <= 0) {
          throw new ValidationError([
            `--limit invalide « ${String(options.limit)} » (entier positif attendu)`,
          ]);
        }
        const scoreMin =
          options.scoreMin === undefined ? undefined : Number.parseInt(options.scoreMin, 10);
        const scoreMax =
          options.scoreMax === undefined ? undefined : Number.parseInt(options.scoreMax, 10);

        const results = await services.search.search({
          ...(options.project === undefined ? {} : { projectId: options.project }),
          ...(scoreMin === undefined || Number.isNaN(scoreMin) ? {} : { scoreMin }),
          ...(scoreMax === undefined || Number.isNaN(scoreMax) ? {} : { scoreMax }),
          offset: 0,
          limit,
        });
        const statistics = services.statistics.getStatistics();
        const audits = options.url
          ? results.filter((result) => result.audit.metadata.url === options.url)
          : results;

        const rows = audits.map((result) => [
          String(result.audit.metadata.id ?? ''),
          result.audit.metadata.url,
          String(result.audit.metadata.overallScore),
          String(result.audit.metadata.totalFindings),
          new Date(result.audit.metadata.timestamp).toISOString().substring(0, 10),
        ]);

        const human =
          rows.length === 0
            ? `${palette.warning('📭')} Aucun audit trouvé.`
            : [
                palette.bold(`📋 Audits (${String(rows.length)} résultat(s))`),
                '',
                renderTable({
                  columns: [
                    { header: 'ID', align: 'right' },
                    { header: 'URL' },
                    { header: 'Score', align: 'right' },
                    { header: 'Constats', align: 'right' },
                    { header: 'Date' },
                  ],
                  rows,
                }),
                '',
                palette.dim(
                  `Total : ${String(statistics.totalAudits)} audit(s), score moyen ${String(statistics.averageScore)}/100.`,
                ),
              ].join('\n');

        return {
          human,
          json: {
            count: audits.length,
            statistics,
            audits: audits.map((result) => result.audit.metadata),
          },
        };
      } finally {
        services.database.close();
      }
    });
  });

  // --- audit show ---
  withOutputFlags(
    audit
      .command('show <id>')
      .description("afficher les détails d'un audit")
      .option(
        '-p, --project <id>',
        "n'afficher l'audit que s'il appartient au projet",
        parseProjectId,
      ),
  ).action(async (id: string, options: Record<string, string | undefined>, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = openAuditServices(runtime);
      try {
        const found = requireAudit(services, parseId(id, 'id'));
        // Filtre `--project` : l'audit existe mais n'appartient pas au projet
        // demandé → traité comme introuvable (code 3), comme `requireAudit`.
        if (options.project !== undefined && found.metadata.projectId !== options.project) {
          throw new ResourceNotFoundError(
            `audit #${String(found.metadata.id)} introuvable dans le projet ${options.project}`,
          );
        }
        const { metadata, dimensions, findings } = found;

        const sorted = [...findings].sort(
          (a, b) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0),
        );

        const human = [
          palette.bold(`📋 Audit #${String(metadata.id)}`),
          '',
          `  URL            : ${metadata.url}`,
          `  Date           : ${new Date(metadata.timestamp).toISOString().substring(0, 10)}`,
          `  Score global   : ${palette.accent(`${String(metadata.overallScore)}/100`)}`,
          '',
          palette.bold('  Scores par dimension'),
          renderTable({
            columns: [
              { header: 'Dimension' },
              { header: 'Score', align: 'right' },
              { header: 'Constats', align: 'right' },
            ],
            rows: dimensions.map((dim) => [
              dim.dimension,
              String(dim.score),
              String(dim.findingsCount),
            ]),
          }),
          '',
          palette.bold('  Répartition des constats'),
          `    🔴 Critical : ${String(metadata.criticalFindings)}`,
          `    🟠 High     : ${String(metadata.highFindings)}`,
          `    🟡 Medium   : ${String(metadata.mediumFindings)}`,
          `    🟢 Low      : ${String(metadata.lowFindings)}`,
          `    ⚪ Info     : ${String(metadata.infoFindings)}`,
          '',
          palette.bold('  Top 5 des constats'),
          ...sorted.slice(0, 5).map((finding, index) => {
            const rec = finding.recommendation === undefined ? '' : ` → ${finding.recommendation}`;
            return `    ${String(index + 1)}. [${finding.priority}] ${finding.title} (${finding.dimension})${rec}`;
          }),
        ].join('\n');

        return { human, json: found };
      } finally {
        services.database.close();
      }
    });
  });

  // --- audit report ---
  withOutputFlags(
    audit
      .command('report <id>')
      .description("générer les rapports Markdown/PDF d'un audit")
      .option('-f, --format <format>', 'format (md, pdf, both)', 'both')
      .option('-o, --output <path>', 'dossier de sortie', './reports'),
  ).action(async (id: string, options: Record<string, string | undefined>, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const services = openAuditServices(runtime);
      try {
        const found = requireAudit(services, parseId(id, 'id'));
        const format = parseFormat(options.format ?? 'both');
        const outputDir = path.resolve(options.output ?? './reports');
        const reports = await generateReports(found, format, outputDir);

        const human = [
          `${palette.success('✔')} Rapports pour l'audit #${String(found.metadata.id)} (${format})`,
          ...reports.map(
            (entry) =>
              `  ${palette.bold(entry.format.toUpperCase())} : ${entry.filePath ?? '(contenu en mémoire)'}`,
          ),
        ].join('\n');

        return {
          human,
          json: {
            auditId: found.metadata.id,
            reports: reports.map((entry) => ({
              format: entry.format,
              filePath: entry.filePath ?? null,
            })),
          },
        };
      } finally {
        services.database.close();
      }
    });
  });

  // --- audit compare ---
  withOutputFlags(
    audit
      .command('compare <id1> <id2>')
      .description('comparer 2 audits (deltas, évolution, recommandations)')
      .option('-f, --format <format>', 'format (md, pdf, both)', 'both')
      .option('-o, --output <path>', 'dossier de sortie', './reports'),
  ).action(
    async (
      id1: string,
      id2: string,
      options: Record<string, string | undefined>,
      command: Command,
    ) => {
      await execute(command, runtime, async (palette): Promise<CommandResult> => {
        const services = openAuditServices(runtime);
        try {
          const auditA = requireAudit(services, parseId(id1, 'id1'));
          const auditB = requireAudit(services, parseId(id2, 'id2'));
          const format = parseFormat(options.format ?? 'both');
          const outputDir = path.resolve(options.output ?? './reports');

          const comparison = new AuditComparator().compare(auditA, auditB);
          const reports = await generateComparisonReports(comparison, format, outputDir);
          const { evolution } = comparison;

          const human = [
            `${palette.success('🔄')} Comparaison #${String(auditA.metadata.id)} → #${String(auditB.metadata.id)}`,
            `  Score : ${String(evolution.scoreA)} → ${String(evolution.scoreB)} (${evolution.delta > 0 ? '+' : ''}${String(evolution.delta)} pts, ${evolution.percentage > 0 ? '+' : ''}${evolution.percentage.toFixed(1)}%)`,
            `  Tendance : ${evolution.trend}`,
            `  Nouveaux : ${String(comparison.deltaFindings.newFindings.length)} — Résolus : ${String(comparison.deltaFindings.resolvedFindings.length)} — Persistants : ${String(comparison.deltaFindings.persistentFindings.length)}`,
            '',
            palette.bold('  Recommandations'),
            ...comparison.recommendations.map(
              (recommendation, index) => `    ${String(index + 1)}. ${recommendation}`,
            ),
            '',
            ...reports.map(
              (entry) =>
                `  ${palette.success('✔')} ${palette.bold(entry.format.toUpperCase())} : ${entry.filePath ?? '(contenu en mémoire)'}`,
            ),
          ].join('\n');

          return {
            human,
            json: {
              evolution,
              deltaScores: comparison.deltaScores,
              deltaCounts: {
                new: comparison.deltaFindings.newFindings.length,
                resolved: comparison.deltaFindings.resolvedFindings.length,
                persistent: comparison.deltaFindings.persistentFindings.length,
                improved: comparison.deltaFindings.improvedFindings.length,
              },
              recommendations: comparison.recommendations,
              reports: reports.map((entry) => ({
                format: entry.format,
                filePath: entry.filePath ?? null,
              })),
            },
          };
        } finally {
          services.database.close();
        }
      });
    },
  );
}
