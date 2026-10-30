import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { RecommendationEngine } from '../recommendations/recommendation-engine.js';
import type { Audit } from '../storage/types.js';

import { HtmlTemplate } from './templates/html.js';
import type { AuditDiagnostic } from '../storage/audit-diagnostics.js';
import type { GeneratedReport, ReportOptions } from './types.js';

/** Format des rapports produits par ce générateur. */
const FORMAT = 'html' as const;

/**
 * Générateur de rapports HTML (Sprint 19-02, C-W03).
 *
 * `HtmlTemplate` existait déjà mais ne servait qu'à alimenter le PDF : aucun
 * rapport HTML n'était produit. Le critère C-W03 exige les **trois** formats
 * (Markdown, HTML, PDF) réellement produits pour un même audit, avec un
 * décompte par priorité contrôlable dans chacun.
 *
 * Le générateur ne réimplémente aucun rendu : il réutilise `HtmlTemplate`,
 * donc le HTML et le PDF ne peuvent pas diverger sur les compteurs.
 *
 * @example
 * ```ts
 * const generator = new HtmlReportGenerator();
 * const report = await generator.generate(audit, { outputPath: './reports' });
 * console.log(report.filePath); // ./reports/audit-7-....html
 * ```
 */
export class HtmlReportGenerator {
  private readonly template = new HtmlTemplate();

  /**
   * @param recommendationEngine - Moteur de recommandations (Sprint 16).
   *   Absent (défaut) = comportement identique aux autres générateurs.
   */
  constructor(private readonly recommendationEngine?: RecommendationEngine) {}

  /**
   * Rend le document HTML complet **sans écrire de fichier**.
   *
   * @param audit - Audit à représenter (jamais modifié).
   * @param options - Options (titre, sections, réserves de données).
   * @returns Document HTML autonome.
   * @throws {Error} Audit invalide.
   */
  generateSync(audit: Audit, options?: Partial<ReportOptions>): string {
    this.assertAudit(audit);

    let html = this.template.generateReport(audit);

    const reservations = this.buildReservationsSection(options?.diagnostics ?? []);
    if (reservations !== '') {
      html = html.replace('</body>', `${reservations}\n</body>`);
    }

    return html;
  }

  /**
   * Génère le rapport HTML et l'écrit si `outputPath` est fourni.
   *
   * @param audit - Audit à représenter (jamais modifié).
   * @param options - Options de génération (sortie, titre, réserves).
   * @returns Rapport généré (`content` HTML, `filePath` si écrit).
   * @throws {Error} Audit invalide ou échec d'écriture.
   */
  async generate(audit: Audit, options?: Partial<ReportOptions>): Promise<GeneratedReport> {
    const content = this.generateSync(audit, options);
    const auditId = audit.metadata.id ?? 0;

    let filePath: string | undefined;
    if (options?.outputPath !== undefined) {
      await mkdir(options.outputPath, { recursive: true });
      const timestamp = audit.metadata.timestamp.replace(/[:.]/gu, '-');
      filePath = path.join(options.outputPath, `audit-${String(auditId)}-${timestamp}.html`);
      await writeFile(filePath, content, 'utf8');
    }

    const report: GeneratedReport = {
      auditId,
      format: FORMAT,
      content,
      generatedAt: new Date().toISOString(),
    };

    return filePath === undefined ? report : { ...report, filePath };
  }

  /**
   * Bloc « Réserves sur les données » (C-W12).
   *
   * Les anomalies historiques sont **signalées**, jamais corrigées : le
   * rapport ne doit ni masquer une incohérence ni la réparer silencieusement.
   *
   * @param diagnostics - Anomalies détectées par `AuditDiagnostics`.
   * @returns Bloc HTML, ou chaîne vide si aucune réserve.
   */
  private buildReservationsSection(diagnostics: readonly AuditDiagnostic[]): string {
    if (diagnostics.length === 0) {
      return '';
    }

    const items = diagnostics
      .map(
        (diagnostic) =>
          `<li><strong>${this.escape(diagnostic.code)}</strong> — ${this.escape(diagnostic.message)}</li>`,
      )
      .join('\n');

    return `
      <section class="reservations">
        <h2>⚠️ Réserves sur les données</h2>
        <p>Ces anomalies sont constatées sur des données existantes. Elles ne sont
          ni corrigées ni réécrites par la génération du rapport.</p>
        <ul>${items}</ul>
      </section>`;
  }

  /** Échappement HTML minimal pour les champs libres. */
  private escape(value: string): string {
    return value
      .replace(/&/gu, '&amp;')
      .replace(/</gu, '&lt;')
      .replace(/>/gu, '&gt;')
      .replace(/"/gu, '&quot;')
      .replace(/'/gu, '&#39;');
  }

  /**
   * Valide la forme minimale de l'audit.
   *
   * @param audit - Audit à vérifier.
   * @throws {Error} Métadonnées absentes ou score global non numérique.
   */
  private assertAudit(audit: Audit): void {
    // Sprint 19-03 (C-W07) : un score `null` est valide — le rapport affiche
    // « indisponible » et sa raison.
    if (!audit?.metadata || audit.metadata.overallScore === undefined) {
      throw new Error('Audit invalide : métadonnées ou score global manquant.');
    }
  }
}
