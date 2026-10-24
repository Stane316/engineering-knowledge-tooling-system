import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Audit } from '../storage/types.js';

import { MarkdownTemplate } from './templates/markdown.js';
import type { ComparisonReport, GeneratedReport, ReportOptions } from './types.js';

/** Format des rapports produits par ce générateur. */
const FORMAT = 'markdown' as const;

/**
 * Générateur de rapports Markdown (Sprint 11-1).
 *
 * Combine les sections pures de {@link MarkdownTemplate} et gère l'écriture
 * fichier. Sans `outputPath`, le rapport reste en mémoire (`content`
 * renseigné, `filePath` absent) — mode utilisé par le MCP `audit_report`.
 *
 * @example
 * ```ts
 * const generator = new MarkdownReportGenerator();
 * const report = await generator.generate(audit, { outputPath: './reports' });
 * console.log(report.filePath);
 * ```
 */
export class MarkdownReportGenerator {
  private readonly template = new MarkdownTemplate();

  /**
   * Génère le rapport Markdown complet d'un audit.
   *
   * @param audit - Audit à représenter (jamais modifié).
   * @param options - Options de génération (sections, titre, sortie).
   * @returns Rapport généré (contenu + chemin si écrit).
   * @throws {Error} Audit invalide, options invalides ou échec d'écriture.
   */
  async generate(audit: Audit, options?: Partial<ReportOptions>): Promise<GeneratedReport> {
    this.assertAudit(audit);
    const includeSections = options?.includeSections;

    const content = this.template.generateReport(
      audit,
      includeSections ? { includeSections } : undefined,
    );

    return this.finish(audit, content, options);
  }

  /**
   * Génère le rapport Markdown d'une comparaison d'audits.
   *
   * @param comparison - Comparaison issue de `AuditComparator.compare`.
   * @param options - Options de génération (sortie uniquement).
   * @returns Rapport généré (contenu + chemin si écrit).
   * @throws {Error} Comparaison invalide ou échec d'écriture.
   */
  async generateComparison(
    comparison: ComparisonReport,
    options?: Partial<ReportOptions>,
  ): Promise<GeneratedReport> {
    if (!comparison || !comparison.auditA || !comparison.auditB) {
      throw new Error('Comparaison invalide : audits A et B requis.');
    }

    const content = this.template.generateComparisonReport(comparison);
    return this.finish(comparison.auditB, content, options, 'comparison');
  }

  /**
   * Valide l'audit puis écrit le fichier si un dossier de sortie est fourni.
   *
   * @param audit - Audit source (pour l'identifiant du nom de fichier).
   * @param content - Contenu Markdown.
   * @param options - Options de l'appelant.
   * @param prefix - Préfixe du fichier (`audit` par défaut, `comparison` pour
   *                 les comparaisons).
   * @returns Rapport généré.
   * @throws {Error} Chemin de sortie vide ou échec d'écriture.
   */
  private async finish(
    audit: Audit,
    content: string,
    options: Partial<ReportOptions> | undefined,
    prefix: 'audit' | 'comparison' = 'audit',
  ): Promise<GeneratedReport> {
    const generatedAt = new Date().toISOString();
    const filePath = await this.write(content, audit, options, generatedAt, prefix);

    return {
      auditId: audit.metadata.id ?? 0,
      format: FORMAT,
      content,
      ...(filePath === undefined ? {} : { filePath }),
      generatedAt,
    };
  }

  /**
   * Écrit le contenu dans `outputPath` (créé si nécessaire).
   *
   * @param content - Contenu Markdown.
   * @param audit - Audit source.
   * @param options - Options de l'appelant.
   * @param generatedAt - Horodatage ISO (suffixe du nom de fichier).
   * @param prefix - Préfixe du nom de fichier.
   * @returns Chemin écrit, ou `undefined` si aucun `outputPath`.
   * @throws {Error} Chemin vide ou refus du système de fichiers.
   */
  private async write(
    content: string,
    audit: Audit,
    options: Partial<ReportOptions> | undefined,
    generatedAt: string,
    prefix: 'audit' | 'comparison',
  ): Promise<string | undefined> {
    const outputPath = options?.outputPath;
    if (outputPath === undefined || outputPath.trim().length === 0) {
      if (options?.outputPath !== undefined) {
        throw new Error('outputPath : le chemin de sortie ne peut pas être vide.');
      }
      return undefined;
    }

    try {
      await mkdir(outputPath, { recursive: true });
      const stamp = generatedAt.replace(/[:.]/g, '-');
      const filePath = path.join(outputPath, `${prefix}-${String(audit.metadata.id)}-${stamp}.md`);
      await writeFile(filePath, content, { encoding: 'utf8', flag: 'w' });
      return filePath;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Écriture du rapport Markdown impossible dans « ${outputPath} » : ${reason}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Contrôle d'intégrité minimal de l'audit.
   *
   * @param audit - Audit à contrôler.
   * @throws {Error} Audit absent, métadonnées absentes ou scores invalides.
   */
  private assertAudit(audit: Audit): void {
    if (!audit?.metadata || typeof audit.metadata.overallScore !== 'number') {
      throw new Error('Audit invalide : métadonnées ou score global manquant.');
    }
    if (audit.metadata.overallScore < 0 || audit.metadata.overallScore > 100) {
      throw new Error(
        `Audit invalide : score global ${String(audit.metadata.overallScore)} hors [0, 100].`,
      );
    }
    if (!Array.isArray(audit.dimensions) || audit.dimensions.length === 0) {
      throw new Error('Audit invalide : aucune dimension renseignée.');
    }
  }
}
