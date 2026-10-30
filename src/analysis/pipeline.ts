import { AccessibilityAnalyzer } from './accessibility.js';
import { ContentAnalyzer } from './content.js';
import { PerformanceAnalyzer } from './performance.js';
import { FindingPrioritizer } from './prioritizer.js';
import { SEOAnalyzer } from './seo.js';
import { UXAnalyzer } from './ux.js';
import type {
  AnalysisDimension,
  AnalysisReport,
  AxeResults,
  ContentResults,
  DimensionScore,
  Finding,
  LighthouseResults,
  OverallScore,
  Priority,
  UXResults,
} from './types.js';

/** Les cinq dimensions requises, dans l'ordre de la pondération. */
const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
];

/**
 * Pondération du score global (somme = 1).
 *
 * Performance et accessibilité pèsent davantage : ce sont les deux dimensions
 * qui conditionnent l'accès au contenu.
 */
const OVERALL_WEIGHTS = {
  performance: 0.25,
  accessibility: 0.25,
  seo: 0.2,
  ux: 0.15,
  content: 0.15,
} as const;

/**
 * Pipeline d'analyse complet.
 *
 * Orchestre les cinq analyseurs, agrège leurs constats, les priorise avec la
 * `SeverityMatrix` et produit l'`AnalysisReport` du Sprint 10.
 *
 * @example
 * ```ts
 * const pipeline = new AnalysisPipeline();
 * const report = await pipeline.analyze(url, lighthouse, axe, ux, content);
 * console.log(report.summary.overallScore);
 * ```
 */
export class AnalysisPipeline {
  private readonly performanceAnalyzer = new PerformanceAnalyzer();
  private readonly accessibilityAnalyzer = new AccessibilityAnalyzer();
  private readonly seoAnalyzer = new SEOAnalyzer();
  private readonly uxAnalyzer = new UXAnalyzer();
  private readonly contentAnalyzer = new ContentAnalyzer();
  private readonly prioritizer = new FindingPrioritizer();

  /**
   * Effectue une analyse complète des cinq dimensions.
   *
   * @param url - URL analysée.
   * @param lighthouseResults - Résultats Lighthouse (performance + SEO).
   * @param axeResults - Violations axe-core.
   * @param uxResults - Heuristiques de Nielsen.
   * @param contentResults - Métriques de contenu.
   * @returns Rapport complet : dimensions, constats triés et agrégats.
   */
  analyze(
    url: string,
    lighthouseResults: LighthouseResults,
    axeResults: AxeResults,
    uxResults: UXResults,
    contentResults: ContentResults,
  ): Promise<AnalysisReport> {
    const performance = this.canonicalize(this.performanceAnalyzer.analyze(lighthouseResults));
    const accessibility = this.canonicalize(this.accessibilityAnalyzer.analyze(axeResults));
    const seo = this.canonicalize(this.seoAnalyzer.analyze(lighthouseResults));
    const ux = this.canonicalize(this.uxAnalyzer.analyze(uxResults));
    const content = this.canonicalize(this.contentAnalyzer.analyze(contentResults));

    // Liste générale : les mêmes constats canoniques que ceux portés par les
    // dimensions, dans l'ordre de collecte (C-W01).
    const allFindings: Finding[] = [
      ...performance.findings,
      ...accessibility.findings,
      ...seo.findings,
      ...ux.findings,
      ...content.findings,
    ];

    // Classement prioritaire : mêmes priorités, triées (C-W01).
    const priorityFindings = this.prioritizer.prioritize(allFindings);

    const overallScore = this.calculateOverallScore({
      performance: performance.score,
      accessibility: accessibility.score,
      seo: seo.score,
      ux: ux.score,
      content: content.score,
    });

    return Promise.resolve({
      url,
      timestamp: new Date().toISOString(),
      dimensions: {
        performance,
        accessibility,
        seo,
        ux,
        content,
      },
      findings: allFindings,
      priorityFindings,
      summary: {
        totalFindings: allFindings.length,
        criticalFindings: this.countByPriority(allFindings, 'critical'),
        highFindings: this.countByPriority(allFindings, 'high'),
        mediumFindings: this.countByPriority(allFindings, 'medium'),
        lowFindings: this.countByPriority(allFindings, 'low'),
        infoFindings: this.countByPriority(allFindings, 'info'),
        overallScore,
      },
    });
  }

  /**
   * Requalifie les constats d'une dimension avec la priorité canonique
   * (Sprint 19-01, C-W01).
   *
   * Les analyseurs déclarent une priorité indicative ; seule la matrice
   * `severity × (6 − effort)` fait foi. Sans cette étape, le détail par
   * dimension et la liste générale pouvaient afficher deux priorités
   * différentes pour le même constat.
   *
   * @param dimension - Score et constats d'une dimension.
   * @returns Copie de la dimension dont les constats portent la priorité canonique.
   */
  private canonicalize(dimension: DimensionScore): DimensionScore {
    return { ...dimension, findings: this.prioritizer.applyCanonicalPriority(dimension.findings) };
  }

  /**
   * Compte les constats d'une priorité donnée (C-W02).
   *
   * @param findings - Constats canoniques.
   * @param priority - Priorité recherchée.
   * @returns Nombre de constats de cette priorité.
   */
  private countByPriority(findings: Finding[], priority: Priority): number {
    return findings.filter((finding) => finding.priority === priority).length;
  }

  /**
   * Calcule le score global (Sprint 19-03, C-W07).
   *
   * Formule pour des données complètes : moyenne pondérée des cinq dimensions
   * — performance 0,25, accessibilité 0,25, SEO 0,20, UX 0,15, contenu 0,15 —
   * arrondie à l'entier.
   *
   * Si **une seule** dimension requise n'a pas de score, aucun score global
   * n'est produit : pas de renormalisation sur les dimensions restantes, pas de
   * zéro de remplacement. Le rapport expose une indisponibilité motivée et la
   * liste des dimensions manquantes.
   *
   * @param scores - Scores par dimension (`null` = non mesuré).
   * @returns Score global mesuré, ou indisponible avec sa raison.
   */
  private calculateOverallScore(scores: Record<AnalysisDimension, number | null>): OverallScore {
    const missingDimensions = DIMENSIONS.filter((dimension) => scores[dimension] === null);

    if (missingDimensions.length === DIMENSIONS.length) {
      return {
        status: 'unavailable',
        code: 'aucune-dimension',
        reason:
          'Aucune des cinq dimensions requises n’a fourni de score : le score global ne peut ' +
          'pas être calculé.',
        missingDimensions,
      };
    }

    if (missingDimensions.length > 0) {
      return {
        status: 'unavailable',
        code: 'dimensions-indisponibles',
        reason:
          `${String(missingDimensions.length)} dimension(s) requise(s) sans score ` +
          `(${missingDimensions.join(', ')}) : le score global n’est pas calculé et n’est pas ` +
          'renormalisé sur les dimensions restantes.',
        missingDimensions,
      };
    }

    const score =
      (scores.performance as number) * OVERALL_WEIGHTS.performance +
      (scores.accessibility as number) * OVERALL_WEIGHTS.accessibility +
      (scores.seo as number) * OVERALL_WEIGHTS.seo +
      (scores.ux as number) * OVERALL_WEIGHTS.ux +
      (scores.content as number) * OVERALL_WEIGHTS.content;

    return { status: 'measured', value: Math.round(score) };
  }
}
