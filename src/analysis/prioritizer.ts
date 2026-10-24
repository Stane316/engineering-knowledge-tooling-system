import type { AnalysisDimension, Finding, Priority } from './types.js';
import { SeverityMatrix } from './severity.js';

/**
 * Poids des priorités pour le tri décroissant.
 */
const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

/**
 * Priorisateur automatique des constats.
 *
 * Recalcule la priorité de chaque `Finding` avec la `SeverityMatrix` — les
 * analyseurs déclarent une priorité indicative, le rapport final n'en retient
 * que le recalcul uniforme — puis trie, groupe et résume l'ensemble.
 *
 * @example
 * ```ts
 * const prioritizer = new FindingPrioritizer();
 * const sorted = prioritizer.prioritize(findings);
 * const quickWins = prioritizer.findQuickWins(findings);
 * ```
 */
export class FindingPrioritizer {
  private readonly severityMatrix = new SeverityMatrix();

  /**
   * Priorise une liste de constats.
   *
   * La priorité de chaque constat est recalculée puis le tableau est trié par
   * priorité décroissante (`critical` en tête). Le tableau d'entrée n'est pas
   * modifié.
   *
   * @param findings - Constats à trier.
   * @returns Nouveau tableau trié par priorité décroissante.
   */
  prioritize(findings: Finding[]): Finding[] {
    const withPriority = findings.map((finding) => ({
      ...finding,
      priority: this.severityMatrix.calculatePriority(finding),
    }));

    return withPriority.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
  }

  /**
   * Groupe les constats par priorité.
   *
   * @param findings - Constats (priorités déjà fixées).
   * @returns Cinq listes, une par priorité.
   */
  groupByPriority(findings: Finding[]): Record<Priority, Finding[]> {
    return {
      critical: findings.filter((f) => f.priority === 'critical'),
      high: findings.filter((f) => f.priority === 'high'),
      medium: findings.filter((f) => f.priority === 'medium'),
      low: findings.filter((f) => f.priority === 'low'),
      info: findings.filter((f) => f.priority === 'info'),
    };
  }

  /**
   * Groupe les constats par dimension d'analyse.
   *
   * @param findings - Constats à répartir.
   * @returns Cinq listes, une par dimension.
   */
  groupByDimension(findings: Finding[]): Record<AnalysisDimension, Finding[]> {
    return {
      performance: findings.filter((f) => f.dimension === 'performance'),
      accessibility: findings.filter((f) => f.dimension === 'accessibility'),
      seo: findings.filter((f) => f.dimension === 'seo'),
      ux: findings.filter((f) => f.dimension === 'ux'),
      content: findings.filter((f) => f.dimension === 'content'),
    };
  }

  /**
   * Génère un résumé exécutif, une phrase par priorité non vide.
   *
   * @param findings - Constats à résumer.
   * @returns Résumé en français.
   */
  generateExecutiveSummary(findings: Finding[]): string {
    const grouped = this.groupByPriority(findings);
    const parts: string[] = [];

    if (grouped.critical.length > 0) {
      parts.push(
        `${grouped.critical.length} problème(s) critique(s) nécessitant une action immédiate`,
      );
    }

    if (grouped.high.length > 0) {
      parts.push(`${grouped.high.length} problème(s) important(s) à traiter en priorité`);
    }

    if (grouped.medium.length > 0) {
      parts.push(`${grouped.medium.length} problème(s) moyen(s) à planifier`);
    }

    if (grouped.low.length > 0) {
      parts.push(`${grouped.low.length} problème(s) mineur(s) à considérer`);
    }

    if (grouped.info.length > 0) {
      parts.push(`${grouped.info.length} information(s) à prendre en compte`);
    }

    if (parts.length === 0) {
      return 'Aucun problème identifié. Excellente qualité !';
    }

    return parts.join('. ') + '.';
  }

  /**
   * Identifie les « quick wins » : forte sévérité, faible effort.
   *
   * @param findings - Constats à filtrer.
   * @returns Constats de sévérité ≥ 3 avec un effort ≤ 2.
   */
  findQuickWins(findings: Finding[]): Finding[] {
    return findings.filter((f) => f.severity >= 3 && f.effort <= 2);
  }

  /**
   * Identifie les « big bets » : forte sévérité, fort effort.
   *
   * @param findings - Constats à filtrer.
   * @returns Constats de sévérité ≥ 3 avec un effort ≥ 4.
   */
  findBigBets(findings: Finding[]): Finding[] {
    return findings.filter((f) => f.severity >= 3 && f.effort >= 4);
  }
}
