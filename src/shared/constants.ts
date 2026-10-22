/** Constantes partagées du Data Layer et de la recherche. */

/** Dimensions des embeddings OpenAI (`text-embedding-3-small`). */
export const EMBEDDING_DIMENSIONS = 1536;

/** Modèle d'embedding par défaut (Sprint 4). */
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/** Nom du schéma attaché pour la base FTS5. */
export const FTS_SCHEMA = 'fts';

/** Nom du schéma attaché pour la base vectorielle. */
export const VECTOR_SCHEMA = 'vectors';

/** Noms de tables du Data Layer. */
export const TABLES = {
  resources: 'resources',
  projects: 'projects',
  audits: 'audits',
  resourcesFts: 'resources_fts',
  resourcesVectors: 'resources_vectors',
  migrations: 'schema_migrations',
} as const;
