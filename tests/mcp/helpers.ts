import type { IEmbeddingsService } from '../../src/business/embeddings.js';
import type { CreateResourceInput, Resource } from '../../src/shared/validators.js';
import { openMcpServices, type McpServices } from '../../src/mcp/context.js';
import { createDataDir, fakeEmbeddings, removeDataDir } from '../cli/helpers.js';

/**
 * Fixtures du serveur MCP.
 *
 * Les tests utilisent une base SQLite **réelle** dans un répertoire temporaire :
 * un mock du manager ne prouverait rien sur les requêtes FTS, les filtres de
 * tags ou la sérialisation des ressources. Aucun appel réseau n'est possible :
 * `env` est injecté vide et les embeddings sont soit absents, soit simulés.
 */

export interface TestServices {
  readonly services: McpServices;
  readonly dataDir: string;
  cleanup(): void;
}

export interface OpenTestServicesOptions {
  /**
   * Fournit un service d'embeddings déterministe (aucun réseau).
   *
   * `true` branche le fournisseur factice standard ; passer une instance
   * permet d'**observer** les appels (Sprint 21-02, C-P08).
   */
  readonly embeddings?: boolean | IEmbeddingsService;
}

/**
 * Ouvre des services MCP sur une base temporaire.
 *
 * @param options - `embeddings: true` branche un fournisseur factice.
 */
export function openTestServices(options: OpenTestServicesOptions = {}): TestServices {
  const dataDir = createDataDir();
  const embeddings =
    options.embeddings === undefined || options.embeddings === false
      ? undefined
      : options.embeddings === true
        ? fakeEmbeddings()
        : options.embeddings;

  const services = openMcpServices({
    dataDir,
    env: {},
    ...(embeddings === undefined ? {} : { embeddings }),
  });

  return {
    services,
    dataDir,
    cleanup: () => {
      services.close();
      removeDataDir(dataDir);
    },
  };
}

/** Ressources de démonstration : trois types, des tags distincts. */
export const SEED: readonly CreateResourceInput[] = [
  {
    type: 'article',
    title: 'SQLite en pratique',
    tags: ['sqlite', 'base'],
    content: 'SQLite est une base de données embarquée, sans serveur.',
  },
  {
    type: 'video',
    title: 'Recherche hybride expliquée',
    tags: ['search', 'sqlite'],
    content: 'Fusion RRF entre BM25 et vecteurs.',
  },
  {
    type: 'tutorial',
    title: 'Indexer avec FTS5',
    tags: ['search', 'fts'],
    content: 'Créer une table virtuelle FTS5 et interroger bm25.',
  },
];

/**
 * Ajoute les ressources de démonstration.
 *
 * @param services - Services ouverts.
 * @returns Ressources créées, dans l'ordre de `SEED`.
 */
export async function seedResources(services: McpServices): Promise<Resource[]> {
  const created: Resource[] = [];

  for (const entry of SEED) {
    created.push(await services.manager.addResource(entry));
  }

  return created;
}
