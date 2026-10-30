import type {
  AxeAnalysis,
  ContentAnalysis,
  L3InspectionResult,
  LighthouseAnalysis,
  UxAnalysis,
} from '../browser/inspection/types.js';
import type { AxeResults, ContentResults, LighthouseResults, UXResults } from './types.js';

/**
 * Pont entre les résultats d'inspection du Sprint 8 et les entrées du module
 * d'analyse.
 *
 * Les deux côtés ont volontairement évolué séparément (voir `./types.ts`) :
 * trois écarts structurels doivent être traduits ici, et **uniquement** ici :
 *
 * 1. `CoreWebVitals.inp` → `LighthouseResults.performance.metrics.fid` —
 *    INP est le successeur du FID ; le contrat d'analyse (C9.1) conserve le nom
 *    historique `fid` ;
 * 2. `ContentAnalysis` est plat (`wordCount` au niveau racine) alors que
 *    `ContentResults` les regroupe sous `metrics` ;
 * 3. les tableaux d'inspection sont `readonly` : les entrées d'analyse sont
 *    recopiées, jamais partagées.
 *
 * Une inspection **dégradée** (Lighthouse ou axe-core `null`, voir les
 * `warnings` de l'inspection) ne produit pas d'entrées inventées : le pont lève
 * une erreur explicite, conformément à la règle du projet « dégradation plutôt
 * qu'échec silencieux — jamais un score inventé ».
 *
 * @example
 * ```ts
 * const inputs = fromInspection(inspection);
 * const report = await new AnalysisPipeline().analyze(inspection.url, ...inputs);
 * ```
 */

/**
 * Les quatre entrées du pipeline, regroupées.
 */
export interface AnalysisInputs {
  /** Résultats Lighthouse convertis. */
  lighthouse: LighthouseResults;
  /** Violations axe-core converties. */
  axe: AxeResults;
  /** Heuristiques UX converties. */
  ux: UXResults;
  /** Métriques de contenu converties. */
  content: ContentResults;
}

/**
 * Traduit l'analyse Lighthouse du Sprint 8 en entrée d'analyse.
 *
 * @param analysis - Analyse Lighthouse (jamais `null` ici).
 * @returns Entrée `LighthouseResults`, `inp` reporté dans `fid`.
 * @throws {Error} Si les métriques sont absentes.
 */
export function toLighthouseResults(analysis: LighthouseAnalysis): LighthouseResults {
  return {
    performance: {
      score: analysis.performance.score,
      // Sprint 20-01 (W04 / C-W08) : les lectures traversent le pont telles
      // quelles. L'ancien `fid: toMeasurement(metrics.inp)` étiquetait une
      // valeur d'INP en FID ; identité, unité et origine sont désormais
      // conservées de bout en bout.
      metrics: analysis.performance.metrics,
    },
    seo: {
      score: analysis.seo.score,
      issues: analysis.seo.issues.map((issue) => ({
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
      })),
    },
  };
}

/**
 * Traduit l'analyse axe-core du Sprint 8 en entrée d'analyse.
 *
 * Les champs supplémentaires (`tags`, `passCount`, `duration`) sont ignorés.
 *
 * @param analysis - Analyse axe-core (jamais `null` ici).
 * @returns Entrée `AxeResults`.
 */
export function toAxeResults(analysis: AxeAnalysis): AxeResults {
  return {
    violations: analysis.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes,
      ...(violation.targets === undefined ? {} : { targets: [...violation.targets] }),
    })),
    score: analysis.score,
    ...(analysis.engineVersion === undefined ? {} : { engineVersion: analysis.engineVersion }),
  };
}

/**
 * Traduit l'analyse UX du Sprint 8 en entrée d'analyse.
 *
 * @param analysis - Analyse UX.
 * @returns Entrée `UXResults`.
 */
export function toUxResults(analysis: UxAnalysis): UXResults {
  return {
    score: analysis.score,
    heuristics: analysis.heuristics.map((heuristic) => ({
      id: heuristic.id,
      name: heuristic.name,
      score: heuristic.score,
      issues: [...heuristic.issues],
    })),
  };
}

/**
 * Traduit l'analyse de contenu du Sprint 8 en entrée d'analyse.
 *
 * Les métriques plates sont regroupées sous `metrics` ; `structure` reste du
 * côté inspection (non consommé par l'analyse de contenu).
 *
 * @param analysis - Analyse de contenu.
 * @returns Entrée `ContentResults`.
 */
export function toContentResults(analysis: ContentAnalysis): ContentResults {
  return {
    score: analysis.score,
    metrics: {
      wordCount: analysis.wordCount,
      readingTime: analysis.readingTime,
      readabilityScore: analysis.readabilityScore,
    },
  };
}

/**
 * Convertit les champs d'analyse d'un résultat L3 en entrées de pipeline.
 *
 * @param result - Champs d'analyse d'une inspection L3 (`lighthouse` et `axe`
 * peuvent être `null` si l'outil a été dégradé — voir `warnings`).
 * @returns Les quatre entrées du pipeline.
 * @throws {Error} Si Lighthouse ou axe-core ont été dégradés, avec la raison.
 */
export function fromInspection(
  result: Pick<L3InspectionResult, 'lighthouse' | 'axe' | 'ux' | 'content'>,
): AnalysisInputs {
  if (result.lighthouse === null) {
    throw new Error(
      'Lighthouse est indisponible pour cette inspection : analyse de la performance impossible.',
    );
  }

  if (result.axe === null) {
    throw new Error(
      'axe-core est indisponible pour cette inspection : analyse de l’accessibilité impossible.',
    );
  }

  return {
    lighthouse: toLighthouseResults(result.lighthouse),
    axe: toAxeResults(result.axe),
    ux: toUxResults(result.ux),
    content: toContentResults(result.content),
  };
}
