import type { McpToolContext } from '../context.js';
import type { ListTemplatesParams } from '../schemas/tool-schemas.js';

import type { TemplateCategory } from '../../templates/template.types.js';

/** Ligne de template du résultat `list_templates`. */
export interface TemplateListItem {
  readonly id: string;
  readonly name: string;
  readonly category: TemplateCategory;
  readonly description: string;
  readonly isBuiltin: boolean;
  readonly bestPracticeCount: number;
  readonly ruleCount: number;
}

/** Résultat de `list_templates`. */
export interface ListTemplatesResult {
  readonly count: number;
  readonly templates: readonly TemplateListItem[];
  /** Résumé Markdown (imprimé par les agents avant le JSON). */
  readonly summary: string;
}

/**
 * Outil `list_templates` (Sprint 17, C17.7).
 *
 * Liste les templates de projets (10 prédéfinis semés au démarrage +
 * personnalisés) avec filtres catégorie / builtin / limite. Lecture seule
 * (`readOnlyHint: true`).
 *
 * @param context - Services partagés (`templates` construit à l'ouverture).
 * @param params - Entrée validée par Zod (défauts déjà appliqués).
 * @returns Liste structurée + résumé Markdown.
 */
export function executeListTemplates(
  context: McpToolContext,
  params: ListTemplatesParams,
): ListTemplatesResult {
  const templates = context.templates.listTemplates({
    ...(params.category === undefined ? {} : { category: params.category }),
    ...(params.builtin_only ? { isBuiltin: true } : {}),
    limit: params.limit,
  });

  const items: TemplateListItem[] = templates.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    isBuiltin: template.isBuiltin,
    bestPracticeCount: template.bestPracticeIds.length,
    ruleCount: template.recommendationRuleIds.length,
  }));

  return {
    count: items.length,
    templates: items,
    summary: buildSummary(items, params),
  };
}

/** Résumé Markdown de la liste de templates. */
function buildSummary(items: readonly TemplateListItem[], params: ListTemplatesParams): string {
  const lines: string[] = ['## Templates de projets disponibles'];

  if (items.length === 0) {
    lines.push(
      '_Aucun template trouvé_',
      params.category === undefined ? '' : `_Filtre : catégorie \`${params.category}\`_`,
    );
    return lines.filter((line) => line !== '').join('\n');
  }

  const builtins = items.filter((item) => item.isBuiltin).length;
  lines.push(
    `**${String(items.length)} template(s)** — ${String(builtins)} prédéfini(s), ${String(
      items.length - builtins,
    )} personnalisé(s)`,
    '',
  );

  for (const item of items) {
    const type = item.isBuiltin ? '📦' : '✏️';
    const description =
      item.description.length > 100 ? `${item.description.slice(0, 100)}…` : item.description;
    lines.push(
      `${type} **${item.name}** (\`${item.category}\`) — \`${item.id.slice(0, 8)}\``,
      `   ${description}`,
      `   BP : ${String(item.bestPracticeCount)} · Règles : ${String(item.ruleCount)}`,
      '',
    );
  }

  return lines.join('\n').trimEnd();
}
