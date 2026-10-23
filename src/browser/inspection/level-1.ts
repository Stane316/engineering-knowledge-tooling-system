/**
 * Niveau 1 — inspection rapide (budget : 10 s).
 *
 * Contenu : capture d'écran, arbre d'accessibilité ARIA, métadonnées de la page
 * et photographie du DOM. Tout est obtenu depuis le navigateur déjà ouvert,
 * sans requête supplémentaire : c'est ce qui tient dans le budget.
 *
 * **Un seul passage dans la page.** L'arbre ARIA est extrait une fois, puis
 * analysé hors navigateur (`collectViolations`) : appeler `getViolations()`
 * après `extract()` redemanderait un instantané complet du DOM pour rien.
 *
 * **Dégradation plutôt qu'échec.** Une capture ratée (page géante, disque
 * plein) n'empêche pas de livrer l'accessibilité et les métadonnées : l'outil
 * concerné est noté dans `warnings`, le reste du rapport reste valable. En mode
 * `strict`, l'échec est propagé — utile en CI, où une dégradation silencieuse
 * masquerait une régression.
 */

import { join } from 'node:path';

import { Accessibility, collectViolations } from '../accessibility.js';
import type { AccessibilityViolation } from '../types.js';
import { InspectionError } from '../errors.js';
import { EMPTY_SNAPSHOT } from './snapshot.js';
import { extractPageSnapshot } from './snapshot.js';
import { INSPECTION_BUDGETS } from './types.js';
import type {
  AccessibilitySummary,
  AccessibilitySummaryViolation,
  InspectionContext,
  L1InspectionResult,
  PageSnapshot,
} from './types.js';

/** Nom de fichier de la capture, stable pour être écrasé à chaque passage. */
export const SCREENSHOT_FILENAME = 'screenshot.png';

/** Somme des violations par gravité. */
export function countViolations(
  violations: readonly AccessibilitySummaryViolation[],
): AccessibilitySummary['counts'] {
  const counts = { minor: 0, moderate: 0, serious: 0, critical: 0 };

  for (const violation of violations) {
    counts[violation.impact] += 1;
  }

  return counts;
}

/**
 * Convertit des violations en résumé sérialisable.
 *
 * L'arbre complet peut compter des milliers de nœuds : le rapport L1 ne garde
 * que les compteurs et les violations, ce qui suffit à décider de la suite.
 *
 * @param nodeCount - Nœuds parcourus.
 * @param maxDepth - Profondeur atteinte.
 * @param violations - Violations calculées sur l'arbre.
 */
export function summariseAccessibility(
  nodeCount: number,
  maxDepth: number,
  violations: readonly AccessibilityViolation[],
): AccessibilitySummary {
  const summaryViolations: AccessibilitySummaryViolation[] = violations.map((violation) => ({
    rule: violation.rule,
    impact: violation.impact,
    message: violation.message,
  }));

  return {
    nodeCount,
    maxDepth,
    violations: summaryViolations,
    counts: countViolations(summaryViolations),
  };
}

/**
 * Résultat intermédiaire du niveau 1, réutilisé par les niveaux 2 et 3.
 *
 * Il porte la photographie du DOM : les analyses SEO, UX et contenu des niveaux
 * supérieurs s'exécutent dessus, sans second passage dans la page.
 */
export interface LevelOneOutput {
  readonly result: L1InspectionResult;
  readonly snapshot: PageSnapshot;
}

/**
 * Exécute le niveau 1.
 *
 * @param context - Session ouverte, page chargée, options résolues.
 * @throws {InspectionError} En mode strict, si une étape échoue.
 */
export async function inspectLevelOne(context: InspectionContext): Promise<LevelOneOutput> {
  const { session, options, navigation, startedAt, now } = context;
  const warnings: string[] = [];
  const artifacts: { screenshot?: string; trace?: string; pdf?: string } = {};

  if (options.screenshot) {
    const screenshotPath = join(options.outputDir, SCREENSHOT_FILENAME);

    try {
      await session.screenshot({ path: screenshotPath, fullPage: true });
      artifacts.screenshot = screenshotPath;
    } catch (error) {
      if (options.strict) {
        throw new InspectionError('screenshot', describe(error), { cause: error });
      }

      warnings.push(`Capture d'écran indisponible : ${describe(error)}`);
    }
  }

  const page = session.getPage();
  const accessibility = new Accessibility({ getPage: () => page });

  let summary: AccessibilitySummary;

  try {
    const tree = await accessibility.extract();
    const violations = collectViolations(tree.root);

    summary = summariseAccessibility(tree.nodeCount, tree.maxDepth, violations);
  } catch (error) {
    if (options.strict) {
      throw new InspectionError('accessibility', describe(error), { cause: error });
    }

    warnings.push(`Arbre d'accessibilité indisponible : ${describe(error)}`);
    summary = summariseAccessibility(0, 0, []);
  }

  let snapshot: PageSnapshot;

  try {
    snapshot = await extractPageSnapshot(page);
  } catch (error) {
    if (options.strict) {
      throw new InspectionError('snapshot', describe(error), { cause: error });
    }

    warnings.push(`Photographie du DOM indisponible : ${describe(error)}`);
    snapshot = EMPTY_SNAPSHOT;
  }

  const title = snapshot.title === '' ? navigation.title : snapshot.title;
  const duration = now() - startedAt;
  const budget = INSPECTION_BUDGETS.L1;
  const timestamp = new Date(startedAt).toISOString();

  const result: L1InspectionResult = {
    level: 'L1',
    url: options.url,
    timestamp,
    duration,
    budget,
    withinBudget: duration <= budget,
    metadata: {
      url: navigation.url,
      requestedUrl: options.url,
      title,
      description: snapshot.description,
      language: snapshot.language,
      viewport: options.viewport,
      userAgent: snapshot.userAgent === '' ? (options.userAgent ?? '') : snapshot.userAgent,
      loadTime: navigation.loadTime,
      httpStatus: navigation.status,
      redirected: navigation.redirected,
      timestamp,
    },
    accessibility: summary,
    artifacts,
    warnings,
  };

  return { result, snapshot };
}

/** Première ligne d'une erreur, sans trace. */
export function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const newline = message.indexOf('\n');

  return (newline === -1 ? message : message.slice(0, newline)).trim();
}
