import type {
  DimensionScore,
  Effort,
  Finding,
  Impact,
  LighthouseResults,
  Severity,
} from './types.js';

/**
 * Mapping sévérité Lighthouse → sévérité EKTS.
 */
const SEVERITY_MAP: Record<string, Severity> = {
  error: 3,
  warning: 2,
  info: 1,
};

/**
 * Analyseur SEO.
 *
 * Convertit les audits SEO en échec de Lighthouse en constats gradués : la
 * sévérité vient du niveau remonté par Lighthouse (`error`/`warning`/`info`),
 * l'effort dépend du type d'élément à corriger (un meta tag se change en
 * quelques minutes, une refonte de structure de liens demande davantage) et la
 * priorité suit la matrice canonique `severity × (6 − effort)`.
 *
 * @example
 * ```ts
 * const analyzer = new SEOAnalyzer();
 * const score = analyzer.analyze(lighthouseResults);
 * ```
 */
export class SEOAnalyzer {
  /**
   * Analyse les résultats SEO de Lighthouse.
   *
   * @param results - Score et audits SEO en échec.
   * @returns Score, constats et résumé de la dimension SEO.
   */
  analyze(results: LighthouseResults): DimensionScore {
    const findings: Finding[] = [];

    for (const issue of results.seo.issues) {
      findings.push(this.analyzeIssue(issue));
    }

    const score = results.seo.score;
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'seo',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse un audit SEO individuel.
   *
   * @param issue - Audit en échec.
   * @returns Constat gradué.
   */
  private analyzeIssue(issue: LighthouseResults['seo']['issues'][number]): Finding {
    const severity = SEVERITY_MAP[issue.severity] ?? 2;
    const effort = this.estimateEffort(issue);
    const impact = this.calculateImpact(severity);
    const priority = this.calculatePriority(severity, effort);

    return {
      id: `seo-${issue.title.toLowerCase().replace(/\s+/g, '-')}`,
      dimension: 'seo',
      title: issue.title,
      description: issue.description,
      severity,
      effort,
      impact,
      priority,
      recommendation: this.generateRecommendation(issue),
      references: ['https://developers.google.com/search/docs'],
    };
  }

  /**
   * Estime l'effort de correction d'après le type d'audit.
   *
   * @param issue - Audit en échec.
   * @returns Effort de 1 (meta tag) à 3 (liens, images).
   */
  private estimateEffort(issue: LighthouseResults['seo']['issues'][number]): Effort {
    const title = issue.title.toLowerCase();

    if (title.includes('meta') || title.includes('title')) {
      return 1;
    }

    if (title.includes('heading') || title.includes('structure')) {
      return 2;
    }

    if (title.includes('link') || title.includes('image')) {
      return 3;
    }

    return 2;
  }

  /**
   * Calcule l'impact utilisateur : le SEO porte directement sur le trafic.
   *
   * @param severity - Sévérité de l'audit.
   * @returns Impact de 1 à 5.
   */
  private calculateImpact(severity: Severity): Impact {
    return Math.min(5, severity + 1) as Impact;
  }

  /**
   * Calcule la priorité avec la matrice canonique.
   *
   * @param severity - Sévérité (0-4).
   * @param effort - Effort (1-5).
   * @returns Priorité correspondant au score `severity × (6 − effort)`.
   */
  private calculatePriority(severity: Severity, effort: Effort): Finding['priority'] {
    const score = severity * (6 - effort);

    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 2) return 'low';

    return 'info';
  }

  /**
   * Génère une recommandation ciblée à partir du titre de l'audit.
   *
   * @param issue - Audit en échec.
   * @returns Recommandation actionnable en français.
   */
  private generateRecommendation(issue: LighthouseResults['seo']['issues'][number]): string {
    const title = issue.title.toLowerCase();

    if (title.includes('meta description')) {
      return 'Ajouter ou améliorer la meta description (150-160 caractères, mots-clés pertinents).';
    }

    if (title.includes('title')) {
      return 'Améliorer le titre de la page (50-60 caractères, mots-clés principaux au début).';
    }

    if (title.includes('heading')) {
      return 'Structurer correctement les headings (un seul h1, hiérarchie logique h1-h6).';
    }

    if (title.includes('link')) {
      return 'Améliorer les liens (texte descriptif, liens internes, éviter les liens cassés).';
    }

    if (title.includes('image')) {
      return 'Optimiser les images (attribut alt descriptif, format approprié, compression).';
    }

    return `Corriger le problème : ${issue.description}`;
  }

  /**
   * Génère un résumé de l'analyse.
   *
   * Les comptes suivent la sévérité des constats (3 = erreur, 2 = avertissement,
   * 1 = information).
   *
   * @param findings - Constats de la dimension.
   * @param score - Score SEO (0-100).
   * @returns Résumé en une phrase.
   */
  private generateSummary(findings: Finding[], score: number): string {
    const errorCount = findings.filter((f) => f.severity === 3).length;
    const warningCount = findings.filter((f) => f.severity === 2).length;
    const infoCount = findings.filter((f) => f.severity === 1).length;

    let summary = `Score SEO : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Excellente optimisation SEO !';

      return summary;
    }

    const parts: string[] = [];

    if (errorCount > 0) parts.push(`${errorCount} erreur(s)`);
    if (warningCount > 0) parts.push(`${warningCount} avertissement(s)`);
    if (infoCount > 0) parts.push(`${infoCount} information(s)`);

    summary += `${findings.length} problème(s) SEO identifié(s) : ${parts.join(', ')}.`;

    return summary;
  }
}
