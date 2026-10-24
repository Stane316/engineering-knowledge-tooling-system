import type { Audit, AuditFinding } from '../storage/types.js';

import type { ComparisonReport, DimensionDelta, FindingsDelta, ScoreEvolution } from './types.js';

/** Seuil d'écart (points) au-delà duquel la tendance n'est plus « stable ». */
const TREND_THRESHOLD = 5;

/**
 * Comparaison de deux audits (Sprint 11-2).
 *
 * Méthode publique unique : {@link AuditComparator.compare}. Les trois
 * calculs (`deltaScores`, `deltaFindings`, `evolution`) restent exposés
 * publiquement, leurs résultats sont invariants par permutation des entrées
 * (aucune mutation des audits, déterminisme total).
 *
 * Clé d'appariement d'un constat : `dimension:title:severity` en minuscules,
 * espaces normalisés (`AuditComparator.buildFindingKey`). Un constat dont la
 * sévérité change entre A et B n'est donc **pas** « le même » : il apparaît à
 * la fois résolu (ancienne clé) et nouveau (nouvelle clé), sa version améliorée
 * étant signalée par `improvedFindings`.
 *
 * @example
 * ```ts
 * const comparator = new AuditComparator();
 * const report = comparator.compare(auditA, auditB);
 * console.log(report.evolution.trend);
 * ```
 */
export class AuditComparator {
  /**
   * Compare deux audits et produit le rapport complet.
   *
   * @param auditA - Audit ancien (jamais modifié).
   * @param auditB - Audit récent (jamais modifié).
   * @returns Deltas de scores, deltas de constats, évolution et recommandations.
   * @throws {Error} Audit absent, métadonnées invalides ou scores hors bornes.
   */
  compare(auditA: Audit, auditB: Audit): ComparisonReport {
    this.assertAudit(auditA, 'A');
    this.assertAudit(auditB, 'B');

    const deltaScores = this.calculateDeltaScores(auditA, auditB);
    const deltaFindings = this.calculateDeltaFindings(auditA, auditB);
    const evolution = this.calculateEvolution(auditA, auditB);
    const recommendations = this.generateRecommendations(evolution, deltaFindings);

    return { auditA, auditB, deltaScores, deltaFindings, evolution, recommendations };
  }

  /**
   * Écart de score par dimension (`B − A`, relatif en % arrondi à 0,1).
   *
   * @param auditA - Audit ancien.
   * @param auditB - Audit récent.
   * @returns Une entrée par dimension présente dans l'un des deux audits
   *          (score manquant traité comme 0).
   */
  calculateDeltaScores(auditA: Audit, auditB: Audit): DimensionDelta[] {
    const byDimension = (audit: Audit): Map<string, number> =>
      new Map(audit.dimensions.map((dim) => [dim.dimension, dim.score]));

    const scoresA = byDimension(auditA);
    const scoresB = byDimension(auditB);
    const dimensions = new Set<string>([...scoresA.keys(), ...scoresB.keys()]);
    const order: readonly string[] = ['performance', 'accessibility', 'seo', 'ux', 'content'];

    return [...dimensions]
      .sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        return (indexA === -1 ? order.length : indexA) - (indexB === -1 ? order.length : indexB);
      })
      .map((dimension) => {
        const scoreA = scoresA.get(dimension) ?? 0;
        const scoreB = scoresB.get(dimension) ?? 0;
        const delta = scoreB - scoreA;
        return {
          dimension: dimension as DimensionDelta['dimension'],
          scoreA,
          scoreB,
          delta,
          percentage: this.toPercentage(delta, scoreA),
        };
      });
  }

  /**
   * Constats nouveaux, résolus, persistants et améliorés.
   *
   * @param auditA - Audit ancien.
   * @param auditB - Audit récent.
   * @returns Regroupement des constats par clé `dimension:title:severity`.
   */
  calculateDeltaFindings(auditA: Audit, auditB: Audit): FindingsDelta {
    const keyToFinding = (findings: readonly AuditFinding[]): Map<string, AuditFinding> => {
      const map = new Map<string, AuditFinding>();
      for (const finding of findings) {
        map.set(this.buildFindingKey(finding), finding);
      }
      return map;
    };

    const keysA = keyToFinding(auditA.findings);
    const keysB = keyToFinding(auditB.findings);

    const newFindings: AuditFinding[] = [];
    const resolvedFindings: AuditFinding[] = [];
    const persistentFindings: AuditFinding[] = [];
    const improvedFindings: AuditFinding[] = [];

    for (const [key, finding] of keysB) {
      if (!keysA.has(key)) newFindings.push(finding);
      else persistentFindings.push(finding);
    }
    for (const [key, finding] of keysA) {
      if (!keysB.has(key)) resolvedFindings.push(finding);
    }

    // Améliorations : même `dimension:title` (sévérité modifiée), B < A.
    const baseKey = (finding: AuditFinding): string =>
      `${finding.dimension.trim().toLowerCase()}:${finding.title.trim().toLowerCase()}`;
    const severitiesA = new Map(
      auditA.findings.map((finding) => [baseKey(finding), finding.severity]),
    );
    for (const finding of auditB.findings) {
      const previous = severitiesA.get(baseKey(finding));
      if (previous !== undefined && finding.severity < previous) {
        improvedFindings.push(finding);
      }
    }

    return { newFindings, resolvedFindings, persistentFindings, improvedFindings };
  }

  /**
   * Évolution du score global (deltas en points et pourcentage).
   *
   * @param auditA - Audit ancien.
   * @param auditB - Audit récent.
   * @returns Score A/B, écart, pourcentage et tendance (±5 points).
   */
  calculateEvolution(auditA: Audit, auditB: Audit): ScoreEvolution {
    const scoreA = auditA.metadata.overallScore;
    const scoreB = auditB.metadata.overallScore;
    const delta = scoreB - scoreA;

    return {
      scoreA,
      scoreB,
      delta,
      percentage: this.toPercentage(delta, scoreA),
      trend:
        delta > TREND_THRESHOLD ? 'improving' : delta < -TREND_THRESHOLD ? 'degrading' : 'stable',
    };
  }

  /**
   * Recommandations actionnables déduites de l'évolution (logique en escalier) :
   * régression + nouveaux critiques / critiques résolus / stabilité
   * avec critiques persistants / amélioration à consolider / statu quo.
   *
   * @param evolution - Évolution du score global.
   * @param deltaFindings - Deltas de constats.
   * @returns Liste ordonnée (jamais vide).
   */
  generateRecommendations(evolution: ScoreEvolution, deltaFindings: FindingsDelta): string[] {
    const recommendations: string[] = [];

    if (evolution.trend === 'degrading') {
      recommendations.push(
        'Traiter en priorité les nouveaux constats critiques apparus depuis le dernier audit.',
      );
      if (deltaFindings.newFindings.length > 0) {
        recommendations.push(
          `Revue ciblée des ${String(deltaFindings.newFindings.length)} nouveau(x) constat(s) avant toute nouvelle fonctionnalité.`,
        );
      }
    }

    const criticalsResolved = deltaFindings.resolvedFindings.filter(
      (finding) => finding.priority === 'critical',
    ).length;
    if (criticalsResolved > 0) {
      recommendations.push(
        `Capitaliser sur les ${String(criticalsResolved)} constat(s) critique(s) résolus : vérifier les correctifs en préproduction.`,
      );
    }

    const criticalsPersistent = deltaFindings.persistentFindings.filter(
      (finding) => finding.priority === 'critical',
    ).length;
    if (evolution.trend === 'stable' && criticalsPersistent > 0) {
      recommendations.push(
        `Plan d'action dédié aux ${String(criticalsPersistent)} constat(s) critique(s) toujours présents.`,
      );
    }

    if (evolution.trend === 'improving') {
      recommendations.push(
        'Amélioration confirmée : maintenir les correctifs et étendre les bonnes pratiques aux autres dimensions.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Scores stagnants : lancer un audit approfondi (L3) pour identifier les blocages non couverts.',
      );
    }

    return recommendations;
  }

  /**
   * Clé d'appariement d'un constat : `dimension:title:severity`, minuscules,
   * espaces réduits.
   *
   * @param finding - Constat à cléifier.
   * @returns Clé normalisée.
   */
  private buildFindingKey(finding: AuditFinding): string {
    const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${normalize(finding.dimension)}:${normalize(finding.title)}:${String(finding.severity)}`;
  }

  /**
   * Écart relatif en pourcent arrondi à 0,1 (0 si le score de base vaut 0).
   *
   * @param delta - Écart en points.
   * @param base - Score de référence (audit A).
   * @returns Pourcentage arrondi à une décimale.
   */
  private toPercentage(delta: number, base: number): number {
    if (base === 0) return 0;
    return Math.round((delta / base) * 1000) / 10;
  }

  /**
   * Contrôle d'intégrité d'un audit comparé.
   *
   * @param audit - Audit à contrôler.
   * @param label - Libellé dans le message (`A` ou `B`).
   * @throws {Error} Métadonnées absentes ou score hors bornes.
   */
  private assertAudit(audit: Audit, label: string): void {
    if (!audit?.metadata || typeof audit.metadata.overallScore !== 'number') {
      throw new Error(`Audit ${label} invalide : métadonnées ou score global manquant.`);
    }
    if (audit.metadata.overallScore < 0 || audit.metadata.overallScore > 100) {
      throw new Error(
        `Audit ${label} invalide : score global ${String(audit.metadata.overallScore)} hors [0, 100].`,
      );
    }
  }
}
