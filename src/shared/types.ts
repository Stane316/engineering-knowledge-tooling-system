/** Types partagés EKTS — Sprint 1. */

export type ResourceType = 'article' | 'video' | 'tutorial' | 'tool' | 'other';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type SearchSource = 'fts' | 'vector' | 'hybrid';

export interface SearchResult {
  resource: Resource;
  score: number;
  highlight?: string;
  source: SearchSource;
}
