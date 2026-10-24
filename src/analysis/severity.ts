import type { Effort, Finding, Priority, Severity } from './types.js';

/**
 * Matrice de sévérité.
 *
 * Calcule la priorité d'un constat d'après trois axes :
 * - **Sévérité (0-4)** : gravité du problème ;
 * - **Effort (1-5)** : complexité de la correction — plus l'effort est faible,
 *   plus l'action mérite d'être menée tôt ;
 * - **Impact (1-5)** : effet sur l'expérience utilisateur (porté par le constat,
 *   affiché mais n'entraîtant pas le score).
 *
 * Formule : `priority_score = severity × (6 − effort)`
 *
 * Seuils : ≥ 20 `critical`, ≥ 12 `high`, ≥ 6 `medium`, ≥ 2 `low`, sinon `info`.
 *
 * @example
 * ```ts
 * const matrix = new SeverityMatrix();
 * matrix.calculateScore(4, 1); // 20 → critical
 * ```
 */
export class SeverityMatrix {
  /**
   * Calcule la priorité d'un constat.
   *
   * @param finding - Constat sans priorité (recalculée).
   * @returns Priorité correspondant à sa sévérité et à son effort.
   */
  calculatePriority(finding: Omit<Finding, 'priority'>): Priority {
    const score = this.calculateScore(finding.severity, finding.effort);

    return this.scoreToPriority(score);
  }

  /**
   * Calcule le score de priorité.
   *
   * @param severity - Sévérité (0-4).
   * @param effort - Effort (1-5).
   * @returns Score `severity × (6 − effort)`.
   */
  calculateScore(severity: Severity, effort: Effort): number {
    return severity * (6 - effort);
  }

  /**
   * Convertit un score en priorité.
   *
   * @param score - Score de priorité.
   * @returns Priorité du seuil atteint (20/12/6/2).
   */
  scoreToPriority(score: number): Priority {
    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 2) return 'low';

    return 'info';
  }

  /**
   * Vérifie qu'une sévérité est un entier de 0 à 4.
   *
   * @param severity - Valeur à valider.
   * @returns `true` si la valeur est admissible.
   */
  validateSeverity(severity: number): boolean {
    return Number.isInteger(severity) && severity >= 0 && severity <= 4;
  }

  /**
   * Vérifie qu'un effort est un entier de 1 à 5.
   *
   * @param effort - Valeur à valider.
   * @returns `true` si la valeur est admissible.
   */
  validateEffort(effort: number): boolean {
    return Number.isInteger(effort) && effort >= 1 && effort <= 5;
  }

  /**
   * Vérifie qu'un impact est un entier de 1 à 5.
   *
   * @param impact - Valeur à valider.
   * @returns `true` si la valeur est admissible.
   */
  validateImpact(impact: number): boolean {
    return Number.isInteger(impact) && impact >= 1 && impact <= 5;
  }

  /**
   * Exemples de calculs de priorité, pour la documentation et le débogage.
   *
   * @returns Six cas couvrant toute la matrice.
   */
  static getExamples(): Array<{
    severity: Severity;
    effort: Effort;
    score: number;
    priority: Priority;
    description: string;
  }> {
    return [
      {
        severity: 4,
        effort: 1,
        score: 20,
        priority: 'critical',
        description: 'Problème critique, facile à corriger',
      },
      {
        severity: 4,
        effort: 5,
        score: 4,
        priority: 'low',
        description: 'Problème critique, très difficile à corriger',
      },
      {
        severity: 3,
        effort: 2,
        score: 12,
        priority: 'high',
        description: 'Problème sérieux, effort moyen',
      },
      {
        severity: 2,
        effort: 3,
        score: 6,
        priority: 'medium',
        description: 'Problème modéré, effort moyen',
      },
      {
        severity: 1,
        effort: 4,
        score: 2,
        priority: 'low',
        description: 'Problème mineur, effort élevé',
      },
      {
        severity: 0,
        effort: 5,
        score: 0,
        priority: 'info',
        description: 'Information, très difficile à corriger',
      },
    ];
  }
}
