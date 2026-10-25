import type { RecommendationEngine } from '../../recommendations/recommendation-engine.js';
import type {
  Recommendation,
  RecommendationReport,
} from '../../recommendations/recommendation.types.js';
import type { McpToolContext } from '../context.js';
import type { GetRecommendationsParams } from '../schemas/tool-schemas.js';

/** Résultat de `get_recommendations`. */
export interface GetRecommendationsResult {
  readonly projectId: string;
  readonly totalRecommendations: number;
  readonly rulesApplied: number;
  readonly statisticalRecommendations: number;
  readonly durationMs: number;
  readonly recommendations: readonly Recommendation[];
  /** Résumé Markdown (imprimé par les agents avant le JSON). */
  readonly summary: string;
}

/**
 * Outil `get_recommendations` (Sprint 16, C16.10).
 *
 * Génère les recommandations contextuelles d'un projet (règles explicites +
 * scoring statistique + ajustements) et les **persiste** (régénération
 * idempotente, purge préalable). Lecture des règles + écriture des
 * recommandations générées côté BD, mais traitement **sans effet de bord
 * externe** : annotations `readOnlyHint: true` (les générations restent
 * reproductibles), cohérent avec `inspect_site` côté annotation.
 *
 * @param context - Services partagés (`recommendations` construit à l'ouverture).
 * @param params - Entrée validée par Zod (défauts déjà appliqués).
 * @returns Rapport structuré + résumé Markdown.
 * @throws {ValidationError} Projet/UUID invalide ou projet inconnu (moteur).
 */
export function executeGetRecommendations(
  context: McpToolContext,
  params: GetRecommendationsParams,
): GetRecommendationsResult {
  const engine: RecommendationEngine = context.recommendations;

  const report: RecommendationReport = engine.generateRecommendations(params.project_id, {
    maxRecommendations: params.max_recommendations,
    minRelevanceScore: params.min_relevance_score,
    includeRules: params.include_rules,
    includeStatistical: params.include_statistical,
    ...(params.dimensions === undefined ? {} : { dimensions: params.dimensions }),
  });

  return {
    projectId: report.projectId,
    totalRecommendations: report.totalRecommendations,
    rulesApplied: report.rulesApplied,
    statisticalRecommendations: report.statisticalRecommendations,
    durationMs: report.durationMs,
    recommendations: report.recommendations,
    summary: buildSummary(report),
  };
}

/** Résumé Markdown du rapport de recommandations. */
function buildSummary(report: RecommendationReport): string {
  const lines: string[] = ['## Recommandations contextuelles', `**Projet :** ${report.projectId}`];

  if (report.recommendations.length === 0) {
    lines.push('_Aucune recommandation générée (projet sans audit, aucune règle applicable)._');
    return lines.join('\n');
  }

  lines.push(
    `**Générées :** ${String(report.totalRecommendations)} ` +
      `(${String(report.rulesApplied)} par règles, ` +
      `${String(report.statisticalRecommendations)} par scoring) en ${String(report.durationMs)} ms`,
    '',
  );

  report.recommendations.forEach((recommendation, index) => {
    const score = (recommendation.relevanceScore * 100).toFixed(0);
    const source = recommendation.ruleId === null ? '📊' : '📏';
    lines.push(
      `${source} **${String(index + 1)}. ${recommendation.recommendationTitle}**`,
      `   Pertinence : ${score} % | Priorité : \`${recommendation.priority}\` | ` +
        `Effort : ${String(recommendation.effort)}/5 | Impact : ${String(recommendation.impact)}/5`,
      `   ${recommendation.recommendationDescription}`,
    );
    if (recommendation.findingTitle !== null) {
      lines.push(`   Constat : ${recommendation.findingTitle}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}
