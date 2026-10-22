import type { Resource } from './validators.js';

export type {
  CreateResourceInput,
  Resource,
  ResourceFilters,
  ResourceType,
  UpdateResourceInput,
} from './validators.js';

/** Origine d'un résultat de recherche (Sprint 4). */
export type SearchSource = 'fts' | 'vector' | 'hybrid';

export interface SearchResult {
  resource: Resource;
  score: number;
  highlight?: string;
  source: SearchSource;
}
