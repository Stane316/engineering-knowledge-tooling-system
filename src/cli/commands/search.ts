import { Option, type Command } from 'commander';

import { DEFAULT_SEARCH_LIMIT } from '../../business/search-engine.js';
import type { SearchMode } from '../../business/search-engine.types.js';
import type { SearchResult } from '../../shared/types.js';
import { ResourceTypeSchema, type ResourceType } from '../../shared/validators.js';
import { execute, withOutputFlags } from '../command.js';
import { parseLimit, parseProjectId, parseTags } from '../options.js';
import { renderTable, truncate, type Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';
import { createSearchEngine } from '../services.js';

const SEARCH_MODES: readonly SearchMode[] = ['hybrid', 'fts', 'vector'];

interface SearchCliOptions {
  limit: number;
  mode: SearchMode;
  type?: ResourceType;
  tags?: string;
  project?: string;
}

export interface SearchReport {
  query: string;
  mode: SearchMode;
  limit: number;
  elapsedMs: number;
  results: SearchResult[];
}

/**
 * Exécute une recherche.
 *
 * En mode `fts`, aucun service d'embeddings n'est requis (ni clé, ni appel
 * réseau). En modes `hybrid` et `vector`, l'absence de configuration est une
 * erreur explicite : renvoyer un classement purement lexical ferait croire à
 * une recherche sémantique.
 */
export async function collectSearch(
  runtime: CliRuntime,
  query: string,
  options: SearchCliOptions,
): Promise<SearchReport> {
  const tags = parseTags(options.tags);
  const services = runtime.openServices({
    dataDir: runtime.dataDir,
    embeddingsMode: options.mode === 'fts' ? 'disabled' : 'required',
  });

  try {
    const engine = createSearchEngine(services.database.connection, services.embeddings);
    const started = runtime.now();
    const results = await engine.search(query, {
      limit: options.limit,
      mode: options.mode,
      ...(options.type === undefined ? {} : { type: options.type }),
      ...(tags.length === 0 ? {} : { tags }),
      ...(options.project === undefined ? {} : { projectId: options.project }),
    });

    return {
      query,
      mode: options.mode,
      limit: options.limit,
      elapsedMs: runtime.now() - started,
      results,
    };
  } finally {
    services.close();
  }
}

function renderSearch(report: SearchReport, palette: Palette): string {
  if (report.results.length === 0) {
    return palette.warning(`Aucun résultat pour « ${report.query} » (mode ${report.mode}).`);
  }

  const table = renderTable({
    columns: [
      { header: '#', align: 'right' },
      { header: 'TITRE' },
      { header: 'TYPE' },
      { header: 'SCORE', align: 'right' },
      { header: 'SOURCE' },
    ],
    rows: report.results.map((result, index) => [
      String(index + 1),
      truncate(result.resource.title, 48),
      result.resource.type,
      result.score.toFixed(4),
      result.source,
    ]),
  });

  return [
    palette.bold(
      `${String(report.results.length)} résultat(s) pour « ${report.query} » — mode ${report.mode}, ${String(report.elapsedMs)} ms`,
    ),
    table,
  ].join('\n');
}

/** Enregistre `ekts search <query>`. */
export function registerSearch(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('search <query>')
      .description('recherche hybride (BM25 + vecteurs + RRF) dans les ressources')
      .option(
        '-l, --limit <number>',
        'nombre maximum de résultats',
        parseLimit,
        DEFAULT_SEARCH_LIMIT,
      )
      .addOption(
        new Option('-m, --mode <mode>', 'stratégie de recherche')
          .choices([...SEARCH_MODES])
          .default('hybrid'),
      )
      .addOption(
        new Option('-t, --type <type>', 'filtre sur le type de ressource').choices([
          ...ResourceTypeSchema.options,
        ]),
      )
      .option('--tags <tags>', 'filtre : la ressource doit porter tous les tags (CSV)')
      .addOption(
        new Option('-p, --project <id>', 'filtrer par projet (UUID)').argParser(parseProjectId),
      ),
  ).action(async (query: string, options: SearchCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectSearch(runtime, query, options);

      return {
        human: renderSearch(report, palette),
        json: {
          query: report.query,
          mode: report.mode,
          limit: report.limit,
          count: report.results.length,
          elapsedMs: report.elapsedMs,
          results: report.results,
        },
      };
    });
  });
}
