import type { AnalysisDimension } from '../analysis/types.js';
import type {
  DimensionScorePoint,
  DimensionTimeline,
  Regression,
  Trend,
  TrendConfig,
  TrendReport,
  TimelineAnalysis,
} from './timeline.types.js';

/** Valeurs par défaut de la détection (Sprint 14). */
const DEFAULTS = {
  windowSize: 5,
  improvementThreshold: 2,
  regressionThreshold: -2,
} as const;

/**
 * Détecte les tendances d'une timeline (Sprint 14).
 *
 * Algorithme : régression linéaire (moindres carrés) sur les `windowSize`
 * derniers points de chaque dimension, classification par pente
 * (amélioration > +2, régression < −2, sinon stable) et recommandations
 * par dimension. Purement calculatoire : aucun accès réseau ni base.
 */
export class TrendDetector {
  private readonly config: TrendConfig;

  /**
   * @param config - Surcharge partielle (`windowSize` ≥ 2, seuils).
   * @throws {RangeError} `windowSize` < 2.
   */
  constructor(config?: Partial<TrendConfig>) {
    const windowSize = config?.windowSize ?? DEFAULTS.windowSize;
    if (!Number.isInteger(windowSize) || windowSize < 2) {
      throw new RangeError(`windowSize invalide : ${String(windowSize)} (entier ≥ 2 attendu)`);
    }
    this.config = {
      windowSize,
      improvementThreshold: config?.improvementThreshold ?? DEFAULTS.improvementThreshold,
      regressionThreshold: config?.regressionThreshold ?? DEFAULTS.regressionThreshold,
    };
  }

  /**
   * Tendances de toutes les dimensions + tendance globale et recommandations.
   *
   * @param timeline - Analyse fournie par `TimelineAnalyzer`.
   * @returns Rapport de tendances (`Map` par dimension).
   */
  detectTrends(timeline: TimelineAnalysis): TrendReport {
    const trends = new Map<AnalysisDimension, Trend>();

    for (const dimensionTimeline of timeline.dimensionScores) {
      trends.set(dimensionTimeline.dimension, this.calculateTrend(dimensionTimeline));
    }

    const slopes = Array.from(trends.values(), (trend) => trend.slope);
    const averageSlope =
      slopes.length === 0 ? 0 : slopes.reduce((sum, s) => sum + s, 0) / slopes.length;
    const overallTrend = this.classifyTrend(averageSlope, 0.5);

    return {
      projectId: timeline.projectId,
      windowSize: this.config.windowSize,
      trends,
      overallTrend,
      recommendations: this.generateRecommendations(trends),
    };
  }

  /**
   * Régressions (pertes > `threshold` points) entre audits consécutifs.
   *
   * Compare chaque audit au précédent, pour chaque dimension et pour le
   * score global. Utile en entrée d'`AlertManager` (C14.4).
   *
   * @param timeline - Analyse fournie par `TimelineAnalyzer`.
   * @param threshold - Seuil de points perdus strictement supérieur (défaut 10).
   * @returns Régressions classées chronologiquement.
   */
  detectRegressions(timeline: TimelineAnalysis, threshold = 10): Regression[] {
    if (!Number.isFinite(threshold) || threshold <= 0) {
      throw new RangeError(`threshold invalide : ${String(threshold)} (> 0 attendu)`);
    }

    const regressions: Regression[] = [];
    const { audits } = timeline;

    for (let index = 1; index < audits.length; index++) {
      const previous = audits[index - 1];
      const current = audits[index];
      if (
        previous?.metadata.id === undefined ||
        current?.metadata.id === undefined ||
        current.metadata.id === undefined
      ) {
        continue;
      }

      const pairs: Array<{
        dimension: AnalysisDimension | 'overall';
        before: number;
        after: number;
      }> = [
        {
          dimension: 'overall',
          before: previous.metadata.overallScore,
          after: current.metadata.overallScore,
        },
        ...timeline.dimensionScores.map((dimensionTimeline) => ({
          dimension: dimensionTimeline.dimension,
          before: dimensionTimeline.scores[index - 1]?.score ?? 0,
          after: dimensionTimeline.scores[index]?.score ?? 0,
        })),
      ];

      for (const pair of pairs) {
        const lost = pair.before - pair.after;
        if (lost > threshold) {
          regressions.push({
            projectId: timeline.projectId,
            auditIdFrom: previous.metadata.id,
            auditIdTo: current.metadata.id,
            dateFrom: new Date(previous.metadata.timestamp),
            dateTo: new Date(current.metadata.timestamp),
            dimension: pair.dimension,
            scoreBefore: pair.before,
            scoreAfter: pair.after,
            regressionPoints: lost,
          });
        }
      }
    }

    return regressions;
  }

  /**
   * Tendance d'une dimension (fenêtre glissante des `windowSize` derniers points).
   *
   * @param dimensionTimeline - Série d'une dimension.
   * @returns Tendance classée (stable si < 2 points).
   */
  private calculateTrend(dimensionTimeline: DimensionTimeline): Trend {
    const recentScores = dimensionTimeline.scores.slice(-this.config.windowSize);
    if (recentScores.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        confidence: 0,
        description: 'Pas assez de données pour détecter une tendance',
      };
    }

    const { slope, rSquared } = linearRegression(recentScores);
    return this.classifyTrend(slope, rSquared);
  }

  /**
   * Classification d'une pente selon les seuils de configuration.
   *
   * @param slope - Pente de régression.
   * @param confidence - R² de la régression (0-1).
   * @returns Tendance classée et décrite.
   */
  private classifyTrend(slope: number, confidence: number): Trend {
    if (slope > this.config.improvementThreshold) {
      return {
        direction: 'improving',
        slope,
        confidence,
        description: `Amélioration détectée (pente : ${slope.toFixed(2)})`,
      };
    }
    if (slope < this.config.regressionThreshold) {
      return {
        direction: 'declining',
        slope,
        confidence,
        description: `Régression détectée (pente : ${slope.toFixed(2)})`,
      };
    }
    return {
      direction: 'stable',
      slope,
      confidence,
      description: `Stable (pente : ${slope.toFixed(2)})`,
    };
  }

  /**
   * Recommandations : une par dimension en régression/amélioration.
   *
   * @param trends - Tendances par dimension.
   * @returns Liste de messages (une phrase stable par défaut).
   */
  private generateRecommendations(trends: Map<AnalysisDimension, Trend>): string[] {
    const recommendations: string[] = [];

    for (const [dimension, trend] of trends) {
      if (trend.direction === 'declining') {
        recommendations.push(
          `⚠️ ${dimension} : régression détectée. Investiguer les changements récents.`,
        );
      } else if (trend.direction === 'improving') {
        recommendations.push(
          `✅ ${dimension} : amélioration continue. Maintenir les bonnes pratiques.`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('📊 Toutes les dimensions sont stables.');
    }

    return recommendations;
  }
}

/**
 * Régression linéaire simple (moindres carrés).
 *
 * @param points - Points `{ score }` indexés par position (x = index).
 * @returns Pente (`slope`) et coefficient de détermination (`rSquared`).
 */
function linearRegression(points: readonly DimensionScorePoint[]): {
  slope: number;
  rSquared: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, rSquared: 0 };

  const xValues = points.map((_, index) => index);
  const yValues = points.map((point) => point.score);
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const x = xValues[i] ?? 0;
    const y = yValues[i] ?? yMean;
    numerator += (x - xMean) * (y - yMean);
    denominator += (x - xMean) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;

  const yPredicted = xValues.map((x) => yMean + slope * (x - xMean));
  const ssRes = yValues.reduce((sum, y, i) => sum + (y - (yPredicted[i] ?? yMean)) ** 2, 0);
  const ssTot = yValues.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, rSquared };
}
