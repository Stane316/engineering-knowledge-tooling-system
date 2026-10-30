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
  analyze(results: AxeResults | null): DimensionScore {
    // État 3 (C-W06) : outil indisponible = état explicite, pas « 0 violation ».
    if (results === null) {
      return {
        dimension: 'accessibility',
        score: null,
        status: 'unavailable',
        unavailableReason: 'outil-indisponible',
        findings: [],
        summary:
          "Analyse d'accessibilité indisponible : axe-core n'a pas fourni de résultat. " +
          'Aucune conclusion sur la conformité ne peut être tirée.',
      };
    }

    // État 2 (C-W06) : propriété absente ≠ liste vide.
    if (results.violations === undefined) {
      return {
        dimension: 'accessibility',
        score: null,
        status: 'unavailable',
        unavailableReason: 'violations-absentes',
        findings: [],
        summary:
          "Analyse d'accessibilité incomplète : la liste des violations n'a pas été fournie. " +
          'Son absence ne signifie pas « aucune violation ».',
      };
    }

    // État 1 (C-W06) : une liste vide explicite signifie réellement « aucune violation ».
    const findings: Finding[] = [];
    for (const violation of results.violations) {
      findings.push(this.analyzeViolation(violation, results.engineVersion));
    }

    const score = results.score;

    // Score absent : les constats restent publiés, le score devient indisponible.
    if (score === null) {
      return {
        dimension: 'accessibility',
        score: null,
        status: 'unavailable',
        unavailableReason: 'score-absent',
        findings,
        summary:
          `${String(findings.length)} violation(s) relevée(s), mais aucun score d'accessibilité ` +
          "n'a été fourni : le score n'est pas estimé et reste indisponible.",
      };
    }

    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'accessibility',
      score,
      status: 'measured',
      findings,
      summary,
    };
  }

  /**
   * Analyse une violation individuelle.
   *
   * @param violation - Violation WCAG.
   * @param engineVersion - Version du moteur axe-core, quand elle est connue.
   * @returns Constat gradué, porteur de la preuve réellement fournie.
   */
  private analyzeViolation(
    violation: NonNullable<AxeResults['violations']>[number],
    engineVersion?: string,
  ): Finding {
    const severity = IMPACT_TO_SEVERITY[violation.impact] ?? 2;
    const effort = this.estimateEffort(violation);
    // Le nombre de nœuds peut être absent (C-W06) : l'impact est alors estimé
    // sur la seule sévérité, et le décompte n'est pas présenté comme observé.
    const impact = this.calculateImpact(severity, violation.nodes);

    const nodesDescription =
      violation.nodes === undefined
        ? `${violation.help} (nombre d'éléments affectés non fourni par axe-core)`
        : `${violation.help} (${String(violation.nodes)} élément(s) affecté(s))`;

    return {
      id: `a11y-${violation.id}`,
      dimension: 'accessibility',
      title: violation.description,
      description: nodesDescription,
      ...(violation.nodes === undefined ? {} : { nodesCount: violation.nodes }),
      // C-W09 : règle, sélecteurs et version suivent le constat ; ce qui n'est
      // pas fourni reste absent plutôt que d'être inventé.
      rule: violation.id,
      ...(violation.targets === undefined || violation.targets.length === 0
        ? {}
        : { elements: [...violation.targets] }),
      ...(engineVersion === undefined ? {} : { engineVersion }),
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
  private estimateEffort(violation: NonNullable<AxeResults['violations']>[number]): Effort {
    // Sans décompte fourni (C-W06), l'effort n'est pas extrapolé : effort moyen,
    // ni minimisé ni maximisé.
    if (violation.nodes === undefined) {
      return 3;
    }

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
  private calculateImpact(severity: Severity, nodes: number | undefined): Impact {
    // Sans décompte (C-W06), l'impact se fonde sur la seule sévérité.
    const nodeFactor = nodes === undefined ? 1 : Math.min(2, Math.ceil(nodes / 10));
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

    const parts: string[] = [];

    if (criticalCount > 0) parts.push(`${criticalCount} critique(s)`);
    if (seriousCount > 0) parts.push(`${seriousCount} sérieuse(s)`);
    if (moderateCount > 0) parts.push(`${moderateCount} modérée(s)`);
    if (minorCount > 0) parts.push(`${minorCount} mineure(s)`);

    summary += `${parts.join(', ')}.`;

    return summary;
  }
}
