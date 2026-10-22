import type {
  CreateResourceInput,
  Resource,
  ResourceFilters,
  ResourceType,
  UpdateResourceInput,
} from '../shared/validators.js';
import type { ReindexReport } from './indexer.js';

/** Entrée de `addResource`. */
export type AddResourceInput = CreateResourceInput;

/** Entrée de `updateResource` : mise à jour partielle. */
export type UpdateResourceData = UpdateResourceInput;

/** Statistiques d'ensemble du Knowledge Manager. */
export interface KnowledgeStats {
  total: number;
  byType: Record<ResourceType, number>;
  /** Ressources présentes dans l'index FTS5. */
  indexed: number;
  /** Index cohérent avec la base principale. */
  consistent: boolean;
}

/**
 * Contrat du Knowledge Manager.
 *
 * Toutes les méthodes sont asynchrones alors que better-sqlite3 est synchrone :
 * le Sprint 4 ajoutera la génération d'embeddings (appel réseau), qui impose
 * une signature `Promise`. Le contrat est donc stable pour la CLI (Sprint 5) et
 * le serveur MCP (Sprint 6).
 */
export interface IKnowledgeManager {
  addResource(input: AddResourceInput): Promise<Resource>;
  getResource(id: string): Promise<Resource | null>;
  getResourceOrThrow(id: string): Promise<Resource>;
  listResources(filters?: ResourceFilters): Promise<Resource[]>;
  updateResource(id: string, data: UpdateResourceData): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
  listTags(): Promise<string[]>;
  stats(): Promise<KnowledgeStats>;
  reindex(): Promise<ReindexReport>;
}
