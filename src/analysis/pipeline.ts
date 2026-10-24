import { AccessibilityAnalyzer } from './accessibility.js';
import { ContentAnalyzer } from './content.js';
import { PerformanceAnalyzer } from './performance.js';
import { FindingPrioritizer } from './prioritizer.js';
import { SEOAnalyzer } from './seo.js';
import { UXAnalyzer } from './ux.js';
import type {
  AnalysisReport,
  AxeResults,
  ContentResults,
  Finding,
  LighthouseResults,
  UXResults,
} from './types.js';

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
    const performance = this.performanceAnalyzer.analyze(lighthouseResults);
    const accessibility = this.accessibilityAnalyzer.analyze(axeResults);
    const seo = this.seoAnalyzer.analyze(lighthouseResults);
    const ux = this.uxAnalyzer.analyze(uxResults);
    const content = this.contentAnalyzer.analyze(contentResults);

    const allFindings: Finding[] = [
      ...performance.findings,
      ...accessibility.findings,
      ...seo.findings,
      ...ux.findings,
      ...content.findings,
    ];

    // Priorités recalculées : le rapport ne retient que l'interprétation
    // uniforme de la matrice, pas les priorités indicatives des analyseurs.
    const priorityFindings = this.prioritizer.prioritize(allFindings);

    const overallScore = this.calculateOverallScore(
      performance.score,
      accessibility.score,
      seo.score,
      ux.score,
      content.score,
    );

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
        criticalFindings: priorityFindings.filter((f) => f.priority === 'critical').length,
        highFindings: priorityFindings.filter((f) => f.priority === 'high').length,
        mediumFindings: priorityFindings.filter((f) => f.priority === 'medium').length,
        lowFindings: priorityFindings.filter((f) => f.priority === 'low').length,
        overallScore,
      },
    });
  }

  /**
   * Calcule le score global : moyenne pondérée des cinq dimensions.
   *
   * @param performance - Score performance (0-100).
   * @param accessibility - Score accessibilité (0-100).
   * @param seo - Score SEO (0-100).
   * @param ux - Score UX (0-100).
   * @param content - Score contenu (0-100).
   * @returns Score global arrondi (0-100).
   */
  private calculateOverallScore(
    performance: number,
    accessibility: number,
    seo: number,
    ux: number,
    content: number,
  ): number {
    const score =
      performance * OVERALL_WEIGHTS.performance +
      accessibility * OVERALL_WEIGHTS.accessibility +
      seo * OVERALL_WEIGHTS.seo +
      ux * OVERALL_WEIGHTS.ux +
      content * OVERALL_WEIGHTS.content;

    return Math.round(score);
  }
}
