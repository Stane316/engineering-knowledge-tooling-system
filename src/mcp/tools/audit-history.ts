import type { McpToolContext } from '../context.js';
import type { AuditHistoryParams } from '../schemas/tool-schemas.js';

/** Résultat de `audit_history`. */
export interface AuditHistoryResult {
  readonly audits: readonly {
    readonly id: number;
    readonly url: string;
    readonly timestamp: string;
    /** Score global, `null` si indisponible (Sprint 19-03). */
    readonly overall_score: number | null;
    readonly total_findings: number;
    readonly critical_findings: number;
    readonly high_findings: number;
    readonly medium_findings: number;
    readonly low_findings: number;
    readonly dimensions: readonly {
      readonly dimension: string;
      /** Score de la dimension, `null` si indisponible (Sprint 19-03). */
      readonly score: number | null;
      readonly findings_count: number;
    }[];
  }[];
  readonly statistics: {
    readonly total_audits: number;
    readonly average_score: number;
    readonly min_score: number;
    readonly max_score: number;
    readonly total_findings: number;
  };
  readonly count: number;
}

/**
 * Outil `audit_history` — historique des audits avec statistiques
 * (Sprint 11-3).
 *
 * Recherche **sans réseau** (énumération paginée FTS) ; le filtre `url`
 * s'applique sur le lot retourné, les statistiques couvrent l'ensemble
 * (globales ou restreintes à `url` via `getStatisticsForUrl`).
 *
 * @param context - Services partagés.
 * @param params - Paramètres déjà validés par Zod.
 * @returns Audits listés + statistiques agrégées.
 */
export async function executeAuditHistory(
  context: McpToolContext,
  params: AuditHistoryParams,
): Promise<AuditHistoryResult> {
  const results = await context.audits.search.search({
    ...(params.score_min === undefined ? {} : { scoreMin: params.score_min }),
    ...(params.score_max === undefined ? {} : { scoreMax: params.score_max }),
    offset: 0,
    limit: params.limit,
  });

  const audits = (
    params.url === undefined
      ? results
      : results.filter((result) => result.audit.metadata.url === params.url)
  ).map((result) => {
    const { metadata, dimensions } = result.audit;
    return {
      id: metadata.id ?? 0,
      url: metadata.url,
      timestamp: metadata.timestamp,
      overall_score: metadata.overallScore,
      total_findings: metadata.totalFindings,
      critical_findings: metadata.criticalFindings,
      high_findings: metadata.highFindings,
      medium_findings: metadata.mediumFindings,
      low_findings: metadata.lowFindings,
      info_findings: metadata.infoFindings,
      dimensions: dimensions.map((dim) => ({
        dimension: dim.dimension,
        score: dim.score,
        findings_count: dim.findingsCount,
      })),
    };
  });

  const statistics =
    params.url === undefined
      ? context.audits.statistics.getStatistics()
      : context.audits.statistics.getStatisticsForUrl(params.url);

  return {
    audits,
    statistics: {
      total_audits: statistics.totalAudits,
      average_score: statistics.averageScore,
      min_score: statistics.minScore,
      max_score: statistics.maxScore,
      total_findings: statistics.totalFindings,
    },
    count: audits.length,
  };
}
