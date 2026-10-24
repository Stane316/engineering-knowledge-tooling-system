import type { DimensionScore, Effort, Finding, Impact, Severity, UXResults } from './types.js';

/**
 * Recommandations par heuristique de Nielsen.
 */
const HEURISTIC_RECOMMENDATIONS: Record<string, string> = {
  'visibility-status':
    "Ajouter des indicateurs de progression et des feedbacks visuels pour informer l'utilisateur de l'état du système.",
  'real-world':
    'Utiliser un langage naturel et des concepts familiers aux utilisateurs. Éviter le jargon technique.',
  'user-control':
    "Permettre aux utilisateurs d'annuler et refaire les actions. Fournir des sorties d'urgence claires.",
  consistency:
    "Maintenir la cohérence dans l'interface et suivre les conventions de la plateforme.",
  'error-prevention':
    'Concevoir pour prévenir les erreurs : validations, confirmations, suggestions.',
  recognition:
    'Rendre les objets et actions visibles. Éviter de demander à un utilisateur de mémoriser des informations.',
  flexibility:
    "Fournir des raccourcis pour les utilisateurs experts. Adapter l'interface aux différents niveaux d'expérience.",
  aesthetic: 'Minimiser les éléments visuels non essentiels. Mettre en avant le contenu important.',
  'error-recovery':
    "Fournir des messages d'erreur clairs et des solutions pour récupérer des erreurs.",
  help: 'Fournir une documentation et une aide contextuelle facile à trouver et à comprendre.',
};

/**
 * Analyseur UX (heuristiques de Nielsen).
 *
 * Chaque heuristique dont le score reste sous 100 produit un `Finding` : la
 * sévérité dérive du score de l'heuristique, l'effort du nombre de constats à
 * traiter et la recommandation est celle de l'heuristique correspondante.
 *
 * @example
 * ```ts
 * const analyzer = new UXAnalyzer();
 * const score = analyzer.analyze(uxResults);
 * ```
 */
export class UXAnalyzer {
  /**
   * Analyse les résultats UX.
   *
   * @param results - Score global et heuristiques évaluées.
   * @returns Score, constats et résumé de la dimension UX.
   */
  analyze(results: UXResults): DimensionScore {
    const findings: Finding[] = [];

    for (const heuristic of results.heuristics) {
      if (heuristic.score < 100) {
        findings.push(this.analyzeHeuristic(heuristic));
      }
    }

    const score = results.score;
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'ux',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse une heuristique individuelle.
   *
   * @param heuristic - Heuristique évaluée.
   * @returns Constat gradué.
   */
  private analyzeHeuristic(heuristic: UXResults['heuristics'][number]): Finding {
    const severity = this.calculateSeverity(heuristic.score);
    const effort = this.estimateEffort(heuristic);
    const impact = this.calculateImpact(severity);
    const priority = this.calculatePriority(severity, effort);

    return {
      id: `ux-${heuristic.id}`,
      dimension: 'ux',
      title: heuristic.name,
      description: heuristic.issues.join('. '),
      severity,
      effort,
      impact,
      priority,
      recommendation: this.generateRecommendation(heuristic),
      references: ['https://www.nngroup.com/articles/ten-usability-heuristics/'],
    };
  }

  /**
   * Calcule la sévérité d'après le score de l'heuristique.
   *
   * @param score - Score de 0 à 100.
   * @returns Sévérité de 1 (score ≥ 80) à 4 (< 40).
   */
  private calculateSeverity(score: number): Severity {
    if (score >= 80) return 1;
    if (score >= 60) return 2;
    if (score >= 40) return 3;

    return 4;
  }

  /**
   * Estime l'effort d'après le nombre de constats.
   *
   * @param heuristic - Heuristique évaluée.
   * @returns Effort de 1 (aucun constat) à 4 (plus de 5 constats).
   */
  private estimateEffort(heuristic: UXResults['heuristics'][number]): Effort {
    const issueCount = heuristic.issues.length;

    if (issueCount === 0) return 1;
    if (issueCount <= 2) return 2;
    if (issueCount <= 5) return 3;

    return 4;
  }

  /**
   * Calcule l'impact utilisateur : l'UX porte directement sur le parcours.
   *
   * @param severity - Sévérité de l'heuristique.
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
   * Génère la recommandation propre à l'heuristique.
   *
   * @param heuristic - Heuristique évaluée.
   * @returns Recommandation actionnable en français.
   */
  private generateRecommendation(heuristic: UXResults['heuristics'][number]): string {
    return HEURISTIC_RECOMMENDATIONS[heuristic.id] ?? `Améliorer l'heuristique : ${heuristic.name}`;
  }

  /**
   * Génère un résumé de l'analyse.
   *
   * Les comptes suivent la sévérité des constats (4 = critique, 3 = sérieux,
   * 2 = modéré, 1 = mineur).
   *
   * @param findings - Constats de la dimension.
   * @param score - Score UX (0-100).
   * @returns Résumé en une phrase.
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter((f) => f.severity === 4).length;
    const seriousCount = findings.filter((f) => f.severity === 3).length;
    const moderateCount = findings.filter((f) => f.severity === 2).length;
    const minorCount = findings.filter((f) => f.severity === 1).length;

    let summary = `Score UX : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Excellente expérience utilisateur !';

      return summary;
    }

    const parts: string[] = [];

    if (criticalCount > 0) parts.push(`${criticalCount} critique(s)`);
    if (seriousCount > 0) parts.push(`${seriousCount} sérieux`);
    if (moderateCount > 0) parts.push(`${moderateCount} modéré(s)`);
    if (minorCount > 0) parts.push(`${minorCount} mineur(s)`);

    summary += `${findings.length} problème(s) UX identifié(s) : ${parts.join(', ')}.`;

    return summary;
  }
}
