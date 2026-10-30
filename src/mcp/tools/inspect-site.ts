import { overallScoreValue } from '../../analysis/measurement.js';
import { assertNavigableTarget, type HostResolver } from '../../browser/url-policy.js';
import type { AnalysisDimension } from '../../analysis/types.js';
import type { McpToolContext } from '../context.js';
import type { InspectSiteParams } from '../schemas/tool-schemas.js';

/** Résultat de `inspect_site`. */
export interface InspectSiteResult {
  readonly inspection_url: string;
  readonly level: string;
  /** Score global pondéré, `null` si une dimension requise est indisponible. */
  readonly score: number | null;
  readonly total_findings: number;
  readonly critical_findings: number;
  readonly high_findings: number;
  readonly audit_id: number;
  readonly timestamp: string;
  /** Scores par dimension, `null` pour une dimension indisponible. */
  readonly dimensions: Record<AnalysisDimension, number | null>;
}

/**
 * Dépendances remplaçables de l'outil.
 *
 * La résolution DNS est injectable : un test unitaire prouve la décision de
 * politique sans dépendre du réseau du poste.
 */
export interface InspectSiteDependencies {
  /** Résolveur de remplacement (tests). */
  readonly resolveHost?: HostResolver;
}

/**
 * Outil `inspect_site` — inspection complète d'un site (Sprint 11-3).
 *
 * Délègue toute la chaîne navigation → analyse → stockage à
 * `context.audits.inspectAndAudit` (remplaçable en test, aucune navigation
 * réseau dans les tests unitaires).
 *
 * Depuis le sprint 20-03 (C-W13), la cible passe d'abord la politique de
 * sécurité : schéma http/https, identifiants refusés, hôte privé ou loopback
 * refusé **par défaut**, adresse résolue privée refusée, échec DNS explicite.
 * `allow_private_hosts` est l'exception, volontairement explicite.
 *
 * @param context - Services partagés.
 * @param params - Paramètres déjà validés par Zod (`level` défaut `L3`).
 * @param dependencies - Résolveur explicite (tests) ; défaut : DNS système.
 * @returns Résumé de l'audit créé (scores, constats, dimensions).
 * @throws {UrlNotAllowedError} Cible refusée par la politique.
 * @throws {ValidationError} Niveau `L1`/`L2` : entrées d'analyse incomplètes.
 */
export async function executeInspectSite(
  context: McpToolContext,
  params: InspectSiteParams,
  dependencies: InspectSiteDependencies = {},
): Promise<InspectSiteResult> {
  const target = await assertNavigableTarget(params.url, {
    allowPrivateHosts: params.allow_private_hosts ?? false,
    ...(dependencies.resolveHost === undefined ? {} : { resolveHost: dependencies.resolveHost }),
  });

  const { audit, report } = await context.audits.inspectAndAudit({
    url: target,
    level: params.level,
    // Assignation optionnelle (Sprint 13) : omis → audit sans projet.
    ...(params.project_id === undefined ? {} : { projectId: params.project_id }),
  });

  return {
    inspection_url: target,
    level: params.level,
    score: overallScoreValue(report.summary.overallScore),
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
