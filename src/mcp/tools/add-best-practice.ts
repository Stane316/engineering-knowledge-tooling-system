import type { BestPractice } from '../../best-practices/best-practice.types.js';
import type { McpToolContext } from '../context.js';
import type { AddBestPracticeParams } from '../schemas/tool-schemas.js';

/** Résultat de `add_best_practice`. */
export interface AddBestPracticeResult {
  readonly practice: BestPractice;
  readonly summary: string;
}

/**
 * Outil `add_best_practice` (Sprint 15, C15.12).
 *
 * Crée manuellement une bonne pratique (`isManual` forcé par la façade).
 * Seul outil d'écriture du module (annotations `readOnlyHint: false`).
 *
 * @param context - Services partagés.
 * @param params - Entrée validée par Zod (title ≥ 3, description ≥ 10, catégorie).
 * @returns La pratique créée + résumé Markdown.
 */
export function executeAddBestPractice(
  context: McpToolContext,
  params: AddBestPracticeParams,
): AddBestPracticeResult {
  const practice = context.bestPractices.create({
    title: params.title,
    description: params.description,
    category: params.category,
    tags: params.tags,
  });

  const summary = [
    '✅ Bonne pratique créée avec succès.',
    '',
    `**${practice.title}** (ID : \`${practice.id}\`)`,
    `Catégorie : \`${practice.category}\` · Tags : ${practice.tags.join(', ') || '(aucun)'}`,
    practice.description,
  ].join('\n');

  return { practice, summary };
}
