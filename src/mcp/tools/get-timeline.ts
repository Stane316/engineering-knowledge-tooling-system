import type { AnalysisDimension } from '../../analysis/types.js';
import { TrendDetector } from '../../timeline/trend-detector.js';
import type { TimelineAnalysis } from '../../timeline/timeline.types.js';
import type { McpToolContext } from '../context.js';
import type { GetTimelineParams } from '../schemas/tool-schemas.js';

/** Série de scores d'une dimension. */
export interface TimelineDimensionSeries {
  readonly averageScore: number;
  readonly minScore: number;
  readonly maxScore: number;
  readonly scores: ReadonlyArray<{
    readonly auditId: number;
    readonly date: string;
    readonly score: number;
    readonly findingsCount: number;
  }>;
}

/** Tendance sérialisée. */
export interface TimelineTrend {
  readonly direction: 'improving' | 'declining' | 'stable';
  readonly slope: number;
  readonly confidence: number;
  readonly description: string;
}

/** Résultat de `get_timeline`. */
export interface GetTimelineResult {
  readonly projectId: string;
  readonly projectName: string;
  readonly period: { readonly start: string; readonly end: string };
  readonly totalAudits: number;
  readonly dimensions: Record<AnalysisDimension, TimelineDimensionSeries>;
  readonly trends: Record<AnalysisDimension, TimelineTrend>;
  readonly overallTrend: TimelineTrend;
  readonly recommendations: readonly string[];
  readonly regressions: ReadonlyArray<{
    readonly dimension: AnalysisDimension | 'overall';
    readonly scoreBefore: number;
    readonly scoreAfter: number;
    readonly regressionPoints: number;
    readonly dateFrom: string;
    readonly dateTo: string;
  }>;
  readonly alerts?: {
    readonly active: number;
    readonly list: ReadonlyArray<{
      readonly id: string;
      readonly dimension: string;
      readonly scoreBefore: number;
      readonly scoreAfter: number;
      readonly regressionPoints: number;
      readonly createdAt: string;
    }>;
  };
  readonly charts?: { readonly svg: string };
  readonly summary: string;
}

/**
 * Outil `get_timeline` — analyse temporelle complète d'un projet (Sprint 14).
 *
 * Combine `TimelineAnalyzer` (séries), `TrendDetector` (régression linéaire,
 * régressions > seuil) et, sur option, les alertes actives (`AlertManager`)
 * et le graphique SVG (`ChartGenerator`). Lecture seule : aucun écrit.
 *
 * @param context - Services partagés.
 * @param params - Entrée déjà validée par Zod.
 * @throws {ProjectNotFoundError} Projet absent (code MCP `-32000`).
 * @throws {ValidationError} Fenêtre de dates incohérente (`-32602` via parse).
 */
export async function executeGetTimeline(
  context: McpToolContext,
  params: GetTimelineParams,
): Promise<GetTimelineResult> {
  const { analyzer, detector } = context.timeline;

  const start =
    params.start_date !== undefined
      ? new Date(`${params.start_date}T00:00:00.000Z`)
      : new Date(Date.now() - params.lookback_days * 86_400_000);
  // `end_date` est inclusive : borne en fin de journée (23:59:59.999).
  const end =
    params.end_date !== undefined ? new Date(`${params.end_date}T23:59:59.999Z`) : undefined;

  const analysis = await analyzer.analyze(params.project_id, { start, end });
  const report = detector.detectTrends(analysis);
  const regressions = detector.detectRegressions(analysis, params.threshold);

  const dimensions = Object.fromEntries(
    analysis.dimensionScores.map((entry) => [
      entry.dimension,
      {
        averageScore: entry.averageScore,
        minScore: entry.minScore,
        maxScore: entry.maxScore,
        scores: entry.scores.map((point) => ({
          auditId: point.auditId,
          date: point.date.toISOString(),
          score: point.score,
          findingsCount: point.findingsCount,
        })),
      },
    ]),
  ) as unknown as Record<AnalysisDimension, TimelineDimensionSeries>;

  const trends = Object.fromEntries(
    Array.from(report.trends.entries(), ([dimension, trend]) => [dimension, { ...trend }]),
  ) as unknown as Record<AnalysisDimension, TimelineTrend>;

  const result: GetTimelineResult = {
    projectId: analysis.projectId,
    projectName: analysis.projectName,
    period: {
      start: analysis.startDate.toISOString(),
      end: analysis.endDate.toISOString(),
    },
    totalAudits: analysis.totalAudits,
    dimensions,
    trends,
    overallTrend: { ...report.overallTrend },
    recommendations: report.recommendations,
    regressions: regressions.map((entry) => ({
      dimension: entry.dimension,
      scoreBefore: entry.scoreBefore,
      scoreAfter: entry.scoreAfter,
      regressionPoints: entry.regressionPoints,
      dateFrom: entry.dateFrom.toISOString(),
      dateTo: entry.dateTo.toISOString(),
    })),
    summary: buildSummary(analysis, report, regressions, params.threshold),
    ...(params.include_alerts ? { alerts: await activeAlerts(context, params.project_id) } : {}),
    ...(params.include_charts
      ? {
          charts: {
            svg: String(context.timeline.chartGenerator.generateTimelineChart(analysis, 'svg')),
          },
        }
      : {}),
  };

  return result;
}

/** Charge les alertes actives du projet. */
async function activeAlerts(
  context: McpToolContext,
  projectId: string,
): Promise<NonNullable<GetTimelineResult['alerts']>> {
  const alerts = await context.timeline.alertManager.getActiveAlerts(projectId);
  return {
    active: alerts.length,
    list: alerts.map((alert) => ({
      id: alert.id,
      dimension: alert.dimension,
      scoreBefore: alert.scoreBefore,
      scoreAfter: alert.scoreAfter,
      regressionPoints: alert.regressionPoints,
      createdAt: alert.createdAt,
    })),
  };
}

/** Résumé Markdown (période, tendances, régressions, alertes). */
function buildSummary(
  analysis: TimelineAnalysis,
  report: ReturnType<TrendDetector['detectTrends']>,
  regressions: ReturnType<TrendDetector['detectRegressions']>,
  threshold: number,
): string {
  const counts = { improving: 0, declining: 0, stable: 0 };
  for (const trend of report.trends.values()) {
    counts[trend.direction] += 1;
  }

  const lines = [
    `## Timeline : ${analysis.projectName}`,
    `**Période :** ${analysis.startDate.toISOString().slice(0, 10)} → ${analysis.endDate.toISOString().slice(0, 10)}`,
    `**Audits :** ${String(analysis.totalAudits)}`,
    '',
    `**Tendances :** ${String(counts.improving)} en amélioration, ${String(counts.declining)} en régression, ${String(counts.stable)} stables`,
  ];

  if (regressions.length > 0) {
    lines.push('', `### Régressions (> ${String(threshold)} points) :`);
    for (const regression of regressions) {
      lines.push(
        `- ${regression.dimension} : ${String(regression.scoreBefore)} → ${String(regression.scoreAfter)} (-${String(regression.regressionPoints)})`,
      );
    }
  }

  return lines.join('\n');
}
