import path from 'node:path';

import { Option, type Command } from 'commander';

import { AnalysisPipeline } from '../../analysis/pipeline.js';
import { fromInspection } from '../../analysis/adapter.js';
import { overallScoreReason, overallScoreValue } from '../../analysis/measurement.js';
import { Inspector } from '../../browser/inspection/inspector.js';
import type { InspectionLevel, L3InspectionResult } from '../../browser/inspection/types.js';
import { MarkdownReportGenerator } from '../../reports/markdown-generator.js';
import { PDFReportGenerator } from '../../reports/pdf-generator.js';
import type { GeneratedReport } from '../../reports/types.js';
import { ValidationError } from '../../shared/errors.js';
import { openDatabase } from '../../data/database.js';
import { createProjectManager } from '../../business/project-manager.js';
import { AuditIndexer } from '../../storage/indexing.js';
import { AuditRepository } from '../../storage/audit-repository.js';
import { AuditSchema } from '../../storage/schema.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import { parseProjectId } from '../options.js';
import type { CliRuntime } from '../runtime.js';

/** Formats de rapport acceptés. */
const FORMATS = ['md', 'pdf', 'both'] as const;

/** Niveaux acceptés par la commande. */
const LEVELS = ['L1', 'L2', 'L3'] as const;

/**
 * Niveau exigé pour la chaîne analyse → audit.
 *
 * Seul l'inspection **L3** renvoie les quatre blocs (`lighthouse`, `axe`,
 * `ux`, `content`) que consomme `AnalysisPipeline` : L1/L2 n'existent pas
 * comme entrées d'audit dans le dépôt (cf. `src/browser/inspection/types.ts`).
 */
const AUDIT_LEVEL: InspectionLevel = 'L3';

/** Résumé JSON de la commande `inspect`. */
export interface InspectReportJson {
  readonly url: string;
  readonly level: InspectionLevel;
  readonly auditId: number;
  /** Score global pondéré, `null` si une dimension requise est indisponible. */
  readonly score: number | null;
  readonly totalFindings: number;
  readonly reports: readonly { readonly format: string; readonly filePath: string }[];
  /**
   * Formats demandés qui ont échoué **après** le stockage de l'audit
   * (Sprint 20-02, C-W11). Un tableau vide ne signifie pas « tout a réussi »
   * si le format n'a jamais été demandé : voir `reports`.
   */
  readonly failures: readonly { readonly format: string; readonly message: string }[];
  readonly durationMs: number;
}

/**
 * Commande `ekts inspect <url>` : inspection complète, analyse, stockage de
 * l'audit puis génération des rapports Markdown/PDF (Sprint 11-3).
 *
 * @param program - Programme Commander racine (`ekts`).
 * @param runtime - Sorties, répertoire de données et horloge.
 */
export function registerInspect(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('inspect <url>')
      .description('inspecter un site (L3 complet) et générer un audit + rapports')
      .option('-l, --level <level>', "niveau d'inspection (L1, L2, L3)", 'L3')
      .option('-o, --output <path>', 'dossier de sortie des rapports', './reports')
      .option('-f, --format <format>', 'format du rapport (md, pdf, both)', 'both')
      .addOption(
        new Option('-p, --project <id>', 'assigner l’audit à un projet (UUID)').argParser(
          parseProjectId,
        ),
      ),
  ).action(async (url: string, options: Record<string, string | undefined>, command: Command) => {
    await execute(command, runtime, async (palette): Promise<CommandResult> => {
      const started = runtime.now();
      const level = parseLevel(options.level ?? AUDIT_LEVEL);
      const format = parseFormat(options.format ?? 'both');

      if (level !== AUDIT_LEVEL) {
        throw new ValidationError([
          `le niveau ${level} ne produit pas les entrées d'analyse complètes ; rejouez avec --level ${AUDIT_LEVEL}`,
        ]);
      }

      // 0. Projet assigné : existence vérifiée avant la navigation (code 3 si
      //    inconnu) — éviter une inspection réseau complète pour un id fautif.
      if (options.project !== undefined) {
        const probe = openDatabase({ dataDir: runtime.dataDir });
        try {
          await createProjectManager(probe.connection).manager.getProjectOrThrow(options.project);
        } finally {
          probe.close();
        }
      }

      // 1. Inspection (navigateur, réseau autorisé par l'utilisateur).
      const inspector = new Inspector();
      const inspection = await inspector.inspect({ url, level });

      // 2. Analyse (conversion Sprint 8 → Sprint 9, erreurs de dégradation
      //    portées par `fromInspection`). Le garde de niveau ci-dessus est
      //    confirmé ici pour le compilateur (union discriminée `level`).
      if (inspection.level !== AUDIT_LEVEL) {
        throw new ValidationError([`inspection inattendue de niveau ${inspection.level}`]);
      }
      const inputs = fromInspection(inspection as L3InspectionResult);
      const report = await new AnalysisPipeline().analyze(
        url,
        inputs.lighthouse,
        inputs.axe,
        inputs.ux,
        inputs.content,
      );

      // 3. Stockage + indexation (schéma audits idempotent).
      const database = openDatabase({ dataDir: runtime.dataDir });
      try {
        new AuditSchema(database.connection).createSchema();
        const repository = new AuditRepository(database.connection);
        // `--project` assigne l'audit au projet ; sans option : sans projet.
        const audit = repository.store(report, { projectId: options.project ?? null });
        const outcome = await new AuditIndexer(database.connection).indexAudit(audit);

        // 4. Rapports.
        const outputDir = path.resolve(options.output ?? './reports');
        const reports: GeneratedReport[] = [];
        // C-W11 : l'audit est déjà stocké. Un échec de rendu ne doit donc
        // jamais faire croire que rien n'a été créé : chaque format est tenté
        // séparément et son échec est conservé avec sa raison.
        const failures: Array<{ format: string; message: string }> = [];

        if (format === 'md' || format === 'both') {
          try {
            reports.push(
              await new MarkdownReportGenerator().generate(audit, { outputPath: outputDir }),
            );
          } catch (error) {
            failures.push({ format: 'markdown', message: messageOf(error) });
          }
        }
        if (format === 'pdf' || format === 'both') {
          try {
            reports.push(await new PDFReportGenerator().generate(audit, { outputPath: outputDir }));
          } catch (error) {
            failures.push({ format: 'pdf', message: messageOf(error) });
          }
        }

        const durationMs = runtime.now() - started;
        const json: InspectReportJson = {
          url,
          level,
          auditId: audit.metadata.id ?? 0,
          score: overallScoreValue(report.summary.overallScore),
          totalFindings: report.summary.totalFindings,
          reports: reports.map((entry) => ({
            format: entry.format,
            filePath: entry.filePath ?? '(mémoire)',
          })),
          failures,
          durationMs,
        };

        const lines = [
          `${palette.success('✔')} ${palette.bold('Inspection')} ${url} (${level}) en ${String(durationMs)} ms`,
          `${palette.success('✔')} ${palette.bold('Score global')} : ${
            overallScoreValue(report.summary.overallScore) === null
              ? `indisponible — ${overallScoreReason(report.summary.overallScore) ?? 'raison non fournie'}`
              : `${String(overallScoreValue(report.summary.overallScore))}/100`
          } — ${String(report.summary.totalFindings)} constat(s)`,
          `${palette.success('✔')} ${palette.bold('Audit')} #${String(audit.metadata.id)} stocké (index FTS : ${outcome.ftsRows > 0 ? `${String(outcome.ftsRows)} ligne(s)` : 'à jour'})`,
          ...reports.map(
            (entry) =>
              `${palette.success('✔')} ${palette.bold(entry.format.toUpperCase())} : ${entry.filePath ?? '(contenu en mémoire)'}`,
          ),
          ...failures.map(
            (failure) =>
              `${palette.warning('⚠')} ${palette.bold(failure.format.toUpperCase())} : échec — ${failure.message}`,
          ),
          ...(failures.length === 0
            ? []
            : [
                '',
                `${palette.bold('Reprise possible')} : ekts audit report ${String(audit.metadata.id)} --format md`,
                "L'audit et les rapports produits ci-dessus restent valides.",
              ]),
        ];

        // Issue partielle : les artefacts existent, mais tous les formats
        // demandés ne sont pas produits — le code de sortie doit le dire.
        return { human: lines.join('\n'), json, exitCode: failures.length === 0 ? 0 : 1 };
      } finally {
        database.close();
      }
    });
  });
}

/** Message lisible d'une erreur inconnue. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Valide le niveau d'inspection.
 *
 * @param value - Valeur brute (`--level`).
 * @returns Niveau normalisé.
 * @throws {ValidationError} Valeur hors `L1|L2|L3`.
 */
function parseLevel(value: string): InspectionLevel {
  if ((LEVELS as readonly string[]).includes(value)) return value as InspectionLevel;
  throw new ValidationError([`niveau invalide « ${value} » (valeurs : L1, L2, L3)`]);
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
