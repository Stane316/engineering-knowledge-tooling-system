/**
 * Niveau 2 — inspection standard (budget : 30 s).
 *
 * Ajoute au niveau 1 deux analyses complémentaires :
 *
 * - **Lighthouse** mesure la performance réelle (Core Web Vitals) dans un
 *   Chromium piloté en CDP ;
 * - **SEO** dérivée du DOM, instantanée et sans réseau.
 *
 * **Pourquoi les deux.** Lighthouse note le référencement à partir de son
 * propre chargement ; l'analyse DOM juge la page telle qu'elle est dans la
 * session, y compris après exécution des scripts. Croiser les deux évite de
 * prendre un score unique pour une vérité.
 *
 * **Lighthouse exige Chromium.** Sur un autre moteur, l'analyse est ignorée et
 * consignée dans `warnings` (ou lève en mode strict) : le rapport reste honnête
 * sur ce qu'il n'a pas mesuré.
 */

import { InspectionError } from '../errors.js';
import { analyseSeo } from './seo.js';
import { inspectLevelOne } from './level-1.js';
import { INSPECTION_BUDGETS } from './types.js';
import type { LighthouseAnalyzer } from '../lighthouse.js';
import type {
  InspectionContext,
  L2InspectionResult,
  LighthouseAnalysis,
  PageSnapshot,
} from './types.js';

/** Ce que le niveau 2 reçoit en plus. */
export interface LevelTwoDependencies {
  /** Analyseur Lighthouse (injecté pour les tests). */
  readonly lighthouse?: LighthouseAnalyzer;
  /** Port CDP sur lequel le Chromium de la session écoute. */
  readonly debugPort?: number;
}

/**
 * Résultat intermédiaire du niveau 2 : il porte la photographie du DOM pour
 * que le niveau 3 n'ait pas à retraverser la page.
 */
export interface LevelTwoOutput {
  readonly result: L2InspectionResult;
  readonly snapshot: PageSnapshot;
}

/**
 * Exécute le niveau 2.
 *
 * @param context - Session ouverte, page chargée, options résolues.
 * @param dependencies - Analyseur Lighthouse et port de débogage.
 * @throws {InspectionError} En mode strict, si Lighthouse échoue.
 */
export async function inspectLevelTwo(
  context: InspectionContext,
  dependencies: LevelTwoDependencies = {},
): Promise<LevelTwoOutput> {
  const { options } = context;
  const { result, snapshot } = await inspectLevelOne(context);
  const warnings = [...result.warnings];
  const seo = analyseSeo(snapshot, result.metadata.title);

  let lighthouse: LighthouseAnalysis | null = null;

  if (options.browserKind !== 'chromium') {
    const reason = `Lighthouse exige Chromium (moteur : ${options.browserKind}) : analyse de performance ignorée.`;

    if (options.strict) {
      throw new InspectionError('lighthouse', reason);
    }

    warnings.push(reason);
  } else if (dependencies.lighthouse === undefined || dependencies.debugPort === undefined) {
    warnings.push(
      'Lighthouse non configuré (analyseur ou port CDP absent) : analyse de performance ignorée.',
    );
  } else {
    try {
      lighthouse = await dependencies.lighthouse.analyze(
        { url: result.metadata.url, port: dependencies.debugPort },
        { timeoutMs: options.timeout },
      );
    } catch (error) {
      if (options.strict) {
        throw error instanceof InspectionError
          ? error
          : new InspectionError('lighthouse', describe(error), { cause: error });
      }

      warnings.push(`Analyse Lighthouse indisponible : ${describe(error)}`);
    }
  }

  const duration = context.now() - context.startedAt;
  const budget = INSPECTION_BUDGETS.L2;

  return {
    result: {
      ...result,
      level: 'L2',
      duration,
      budget,
      withinBudget: duration <= budget,
      warnings,
      lighthouse,
      seo,
    },
    snapshot,
  };
}

/** Première ligne d'une erreur, sans trace. */
function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const newline = message.indexOf('\n');

  return (newline === -1 ? message : message.slice(0, newline)).trim();
}
