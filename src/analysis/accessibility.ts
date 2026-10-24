import type { AxeResults, DimensionScore, Effort, Finding, Impact, Severity } from './types.js';

/**
 * Mapping impact axe-core → sévérité EKTS.
 */
const IMPACT_TO_SEVERITY: Record<string, Severity> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};

/**
 * Analyseur d'accessibilité.
 *
 * Chaque violation WCAG remontée par axe-core devient un `Finding` dont la
 * sévérité suit l'impact déclaré par axe-core, l'effort croît avec le nombre
 * d'éléments à corriger et l'impact combine les deux. La priorité suit la
 * matrice canonique `severity × (6 − effort)` (SPRINT-09 §5.6).
 *
 * @example
 * ```ts
 * const analyzer = new AccessibilityAnalyzer();
 * const score = analyzer.analyze(axeResults);
 * ```
 */
export class AccessibilityAnalyzer {
  /**
   * Analyse les résultats axe-core.
   *
   * @param results - Violations et score d'accessibilité.
   * @returns Score, constats et résumé de la dimension accessibilité.
   */
  analyze(results: AxeResults): DimensionScore {
    const findings: Finding[] = [];

    for (const violation of results.violations) {
      findings.push(this.analyzeViolation(violation));
    }

    const score = results.score;
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'accessibility',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse une violation individuelle.
   *
   * @param violation - Violation WCAG.
   * @returns Constat gradué.
   */
  private analyzeViolation(violation: AxeResults['violations'][number]): Finding {
    const severity = IMPACT_TO_SEVERITY[violation.impact] ?? 2;
    const effort = this.estimateEffort(violation);
    const impact = this.calculateImpact(severity, violation.nodes);

    return {
      id: `a11y-${violation.id}`,
      dimension: 'accessibility',
      title: violation.description,
      description: `${violation.help} (${violation.nodes} élément(s) affecté(s))`,
      severity,
      effort,
      impact,
      priority: this.calculatePriority(severity, effort),
      recommendation: violation.help,
      references: [violation.helpUrl],
    };
  }

  /**
   * Estime l'effort de correction selon le nombre d'éléments affectés.
   *
   * @param violation - Violation WCAG.
   * @returns Effort de 1 (un seul élément) à 4 (plus de 20).
   */
  private estimateEffort(violation: AxeResults['violations'][number]): Effort {
    if (violation.nodes === 1) {
      return 1;
    }

    if (violation.nodes <= 5) {
      return 2;
    }

    if (violation.nodes <= 20) {
      return 3;
    }

    return 4;
  }

  /**
   * Calcule l'impact utilisateur : sévérité amplifiée par l'étendue.
   *
   * @param severity - Sévérité de la violation.
   * @param nodes - Nombre d'éléments affectés.
   * @returns Impact de 1 à 5.
   */
  private calculateImpact(severity: Severity, nodes: number): Impact {
    const nodeFactor = Math.min(2, Math.ceil(nodes / 10));
    const impact = Math.min(5, severity * nodeFactor);

    return Math.max(1, impact) as Impact;
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
   * Génère un résumé de l'analyse.
   *
   * @param findings - Constats de la dimension.
   * @param score - Score accessibilité (0-100).
   * @returns Résumé en une phrase.
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter((f) => f.severity === 4).length;
    const seriousCount = findings.filter((f) => f.severity === 3).length;
    const moderateCount = findings.filter((f) => f.severity === 2).length;
    const minorCount = findings.filter((f) => f.severity === 1).length;

    let summary = `Score accessibilité : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Aucune violation WCAG détectée. Excellente accessibilité !';

      return summary;
    }

    summary += `${findings.length} violation(s) WCAG détectée(s) : `;

    if (criticalCount > 0) summary += `${criticalCount} critique(s), `;
    if (seriousCount > 0) summary += `${seriousCount} sérieuse(s), `;
    if (moderateCount > 0) summary += `${moderateCount} modérée(s), `;
    if (minorCount > 0) summary += `${minorCount} mineure(s).`;

    return summary;
  }
}
