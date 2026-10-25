import type { AnalysisDimension } from '../../analysis/types.js';
import type { McpToolContext } from '../context.js';
import type { InspectSiteParams } from '../schemas/tool-schemas.js';

/** Résultat de `inspect_site`. */
export interface InspectSiteResult {
  readonly inspection_url: string;
  readonly level: string;
  readonly score: number;
  readonly total_findings: number;
  readonly critical_findings: number;
  readonly high_findings: number;
  readonly audit_id: number;
  readonly timestamp: string;
  readonly dimensions: Record<AnalysisDimension, number>;
}

/**
 * Outil `inspect_site` — inspection complète d'un site (Sprint 11-3).
 *
 * Délègue toute la chaîne navigation → analyse → stockage à
 * `context.audits.inspectAndAudit` (remplaçable en test, aucune navigation
 * réseau dans les tests unitaires).
 *
 * @param context - Services partagés.
 * @param params - Paramètres déjà validés par Zod (`level` défaut `L3`).
 * @returns Résumé de l'audit créé (scores, constats, dimensions).
 * @throws {ValidationError} Niveau `L1`/`L2` : entrées d'analyse incomplètes.
 */
export async function executeInspectSite(
  context: McpToolContext,
  params: InspectSiteParams,
): Promise<InspectSiteResult> {
  const { audit, report } = await context.audits.inspectAndAudit({
    url: params.url,
    level: params.level,
    // Assignation optionnelle (Sprint 13) : omis → audit sans projet.
    ...(params.project_id === undefined ? {} : { projectId: params.project_id }),
  });

  return {
    inspection_url: params.url,
    level: params.level,
    score: report.summary.overallScore,
    total_findings: report.summary.totalFindings,
    critical_findings: report.summary.criticalFindings,
    high_findings: report.summary.highFindings,
    audit_id: audit.metadata.id ?? 0,
    timestamp: report.timestamp,
    dimensions: {
      performance: report.dimensions.performance.score,
      accessibility: report.dimensions.accessibility.score,
      seo: report.dimensions.seo.score,
      ux: report.dimensions.ux.score,
      content: report.dimensions.content.score,
    },
  };
}
