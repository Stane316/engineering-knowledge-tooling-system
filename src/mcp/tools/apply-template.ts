import type { McpToolContext } from '../context.js';
import type { ApplyTemplateParams } from '../schemas/tool-schemas.js';

import type { TemplateOverrides } from '../../templates/template.types.js';

/** Résultat de `apply_template`. */
export interface ApplyTemplateToolResult {
  readonly projectId: string;
  readonly projectName: string;
  readonly templateId: string;
  readonly bestPracticesAssociated: number;
  readonly rulesCreated: number;
  readonly durationMs: number;
  /** Résumé Markdown (imprimé par les agents avant le JSON). */
  readonly summary: string;
}

/**
 * Outil `apply_template` (Sprint 17, C17.3/C17.4).
 *
 * Crée un projet en appliquant un template : config fusionnée (merge
 * profond des sous-objets, ADR-041), bonnes pratiques associées, règles
 * actives comptées. Écriture côté BD mais sans effet de bord externe :
 * annotations `readOnlyHint: false, openWorldHint: false`.
 *
 * @param context - Services partagés (`templates` construit à l'ouverture).
 * @param params - Entrée validée par Zod.
 * @returns Projet créé, compteurs, durée + résumé Markdown.
 * @throws {ValidationError} Template introuvable ou entrée invalide (-32602).
 */
export function executeApplyTemplate(
  context: McpToolContext,
  params: ApplyTemplateParams,
): ApplyTemplateToolResult {
  const overrides: TemplateOverrides | undefined =
    params.overrides === undefined
      ? undefined
      : {
          ...(params.overrides.config === undefined
            ? {}
            : { config: params.overrides.config as TemplateOverrides['config'] }),
          ...(params.overrides.additional_best_practice_ids === undefined
            ? {}
            : { additionalBestPracticeIds: params.overrides.additional_best_practice_ids }),
          ...(params.overrides.additional_rule_ids === undefined
            ? {}
            : { additionalRuleIds: params.overrides.additional_rule_ids }),
        };

  const result = context.templates.applyTemplate({
    templateId: params.template_id,
    projectName: params.project_name,
    projectUrl: params.project_url,
    ...(params.project_description === undefined
      ? {}
      : { projectDescription: params.project_description }),
    ...(overrides === undefined ? {} : { overrides }),
  });

  return {
    projectId: result.projectId,
    projectName: result.projectName,
    templateId: result.templateId,
    bestPracticesAssociated: result.bestPracticesAssociated,
    rulesCreated: result.rulesCreated,
    durationMs: result.durationMs,
    summary: buildSummary(result),
  };
}

/** Résumé Markdown de l'application de template. */
function buildSummary(result: {
  projectId: string;
  projectName: string;
  bestPracticesAssociated: number;
  rulesCreated: number;
  durationMs: number;
}): string {
  return [
    '✅ **Projet créé depuis le template**',
    '',
    `**${result.projectName}** — \`${result.projectId}\``,
    `Bonnes pratiques associées : ${String(result.bestPracticesAssociated)}`,
    `Règles actives : ${String(result.rulesCreated)}`,
    `Durée : ${String(result.durationMs)} ms`,
  ].join('\n');
}
