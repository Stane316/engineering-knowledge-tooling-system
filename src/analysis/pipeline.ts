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
  DimensionScore,
  Finding,
  LighthouseResults,
  Priority,
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
