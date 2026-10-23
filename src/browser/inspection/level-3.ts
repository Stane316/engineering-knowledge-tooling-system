/**
 * Niveau 3 — inspection approfondie (budget : 60 s).
 *
 * Ajoute au niveau 2 trois analyses qualitatives :
 *
 * - **axe-core** (WCAG 2.2 AA) sur la page réellement chargée ;
 * - **UX** selon les heuristiques de Nielsen observables ;
 * - **contenu** : volume, temps de lecture, lisibilité de Flesch.
 *
 * **Pourquoi axe-core en plus de l'arbre ARIA.** L'arbre dit si un bouton a un
 * nom ; axe-core dit si son contraste est suffisant, si les `aria-*` sont
 * valides et si l'ordre de tabulation tient. Ce sont deux mesures distinctes,
 * et un rapport d'accessibilité sérieux les présente séparément.
 */

import { AxeAnalyzer } from '../axe.js';
import { InspectionError } from '../errors.js';
import { analyseContent } from './content.js';
import { inspectLevelTwo } from './level-2.js';
import { analyseUx } from './ux.js';
import { INSPECTION_BUDGETS } from './types.js';
import type { LevelTwoDependencies } from './level-2.js';
import type { AxeAnalysis, InspectionContext, L3InspectionResult } from './types.js';

/** Ce que le niveau 3 reçoit en plus du niveau 2. */
export interface LevelThreeDependencies extends LevelTwoDependencies {
  /** Analyseur axe-core (injecté pour les tests). */
  readonly axe?: AxeAnalyzer;
}

/**
 * Exécute le niveau 3.
 *
 * @param context - Session ouverte, page chargée, options résolues.
 * @param dependencies - Analyseurs Lighthouse et axe-core, port CDP.
 * @throws {InspectionError} En mode strict, si axe-core échoue.
 */
export async function inspectLevelThree(
  context: InspectionContext,
  dependencies: LevelThreeDependencies = {},
): Promise<L3InspectionResult> {
  const { options } = context;
  const { result: levelTwo, snapshot } = await inspectLevelTwo(context, dependencies);
  const warnings = [...levelTwo.warnings];

  let axe: AxeAnalysis | null = null;
  const analyzer = dependencies.axe ?? new AxeAnalyzer();

  try {
    axe = await analyzer.analyze(context.session.getPage());
  } catch (error) {
    if (options.strict) {
      throw error instanceof InspectionError
        ? error
        : new InspectionError('axe', describe(error), { cause: error });
    }

    warnings.push(`Analyse axe-core indisponible : ${describe(error)}`);
  }

  const duration = context.now() - context.startedAt;
  const budget = INSPECTION_BUDGETS.L3;

  return {
    ...levelTwo,
    level: 'L3',
    duration,
    budget,
    withinBudget: duration <= budget,
    warnings,
    axe,
    ux: analyseUx(snapshot),
    content: analyseContent(snapshot),
  };
}

/** Première ligne d'une erreur, sans trace. */
function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const newline = message.indexOf('\n');

  return (newline === -1 ? message : message.slice(0, newline)).trim();
}
