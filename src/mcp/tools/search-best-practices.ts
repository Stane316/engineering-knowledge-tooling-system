import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import type { BestPracticeCategory } from '../../best-practices/best-practice.types.js';
import type { McpToolContext } from '../context.js';
import type { SearchBestPracticesParams } from '../schemas/tool-schemas.js';

/** Ligne de résultat de recherche (champs résumés). */
export interface SearchBestPracticeEntry {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: BestPracticeCategory;
  readonly tags: readonly string[];
  readonly occurrenceCount: number;
  readonly isManual: boolean;
  readonly score: number;
  readonly matchType: 'fts' | 'semantic' | 'hybrid' | 'list';
}

/** Résultat de `search_best_practices`. */
export interface SearchBestPracticesResult {
  readonly query?: string;
  readonly count: number;
  readonly total: number;
  readonly results: readonly SearchBestPracticeEntry[];
  /** Résumé Markdown (imprimé par les agents avant le JSON). */
  readonly summary: string;
}

/**
 * Outil `search_best_practices` (Sprint 15, C15.11).
 *
 * Recherche hybride FTS5 (+ RRF si ranker injecté côté service) et filtres
 * (catégorie, tag, projet source). Lecture seule.
 *
 * @param context - Services partagés (`bestPractices` construit à l'ouverture).
 * @param params - Entrée validée par Zod (défauts déjà appliqués).
 * @returns Résultats triés + résumé Markdown.
 */
export function executeSearchBestPractices(
  context: McpToolContext,
  params: SearchBestPracticesParams,
): SearchBestPracticesResult {
  const service: BestPracticeService = context.bestPractices;

  const results = service.searchPractices({
    query: params.query,
    category: params.category,
    tag: params.tag,
    projectId: params.project_id,
    limit: params.limit,
  });

  const entries: SearchBestPracticeEntry[] = results.map((result) => ({
    id: result.practice.id,
    title: result.practice.title,
    description: result.practice.description,
    category: result.practice.category,
    tags: result.practice.tags,
    occurrenceCount: result.practice.occurrenceCount,
    isManual: result.practice.isManual,
    score: result.score,
    matchType: result.matchType,
  }));

  return {
    ...(params.query !== undefined && params.query.length > 0 ? { query: params.query } : {}),
    count: entries.length,
    total: service.count(),
    results: entries,
    summary: buildSummary(entries, params.query, params),
  };
}

/** Résumé Markdown des résultats. */
function buildSummary(
  entries: readonly SearchBestPracticeEntry[],
  query: string | undefined,
  params: SearchBestPracticesParams,
): string {
  const lines: string[] = [];

  if (query !== undefined && query.length > 0) {
    lines.push(`## Recherche : « ${query} »`);
  } else {
    lines.push('## Bonnes pratiques');
  }
  lines.push(`${String(entries.length)} résultat(s)`);

  const filters: string[] = [];
  if (params.category !== undefined) {
    filters.push(`catégorie=${params.category}`);
  }
  if (params.tag !== undefined) {
    filters.push(`tag=${params.tag}`);
  }
  if (params.project_id !== undefined) {
    filters.push(`projet=${params.project_id.slice(0, 8)}…`);
  }
  if (filters.length > 0) {
    lines.push(`**Filtres :** ${filters.join(' · ')}`);
  }
  lines.push('');

  if (entries.length === 0) {
    lines.push('_Aucune bonne pratique ne correspond._');
    return lines.join('\n');
  }

  for (const entry of entries) {
    const score = `[${(entry.score * 100).toFixed(0)} %] `;
    lines.push(
      `**${entry.title}** ${score}— \`${entry.category}\` ×${String(entry.occurrenceCount)}`,
    );
    const description =
      entry.description.length > 120 ? `${entry.description.slice(0, 120)}…` : entry.description;
    lines.push(`  ${description}`);
    lines.push('');
  }

  return lines.join('\n');
}
