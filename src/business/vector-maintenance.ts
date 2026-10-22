import { EmbeddingSpaceMismatchError, IndexingError } from '../shared/errors.js';
import type { VectorRepository } from '../data/vector-repository.js';
import type { IKnowledgeManager } from './knowledge-manager.types.js';
import type { VectorIndexer, VectorReindexReport } from './vector-indexer.js';

/**
 * Maintenance de l'index vectoriel.
 *
 * Changer de fournisseur d'embeddings (par exemple OpenAI → Gemini) change
 * l'**espace** : les vecteurs de deux modèles ne sont pas comparables. Le
 * `VectorRepository` refuse donc la bascule tant que l'index contient des
 * vecteurs de l'ancien espace (`EmbeddingSpaceMismatchError`).
 *
 * Ce module rend la bascule **explicite et reproductible** : elle n'a lieu que
 * sur demande (`force`), purge l'ancien index, puis réindexe toutes les
 * ressources avec le fournisseur courant. Aucune perte de donnée : les
 * ressources et l'index plein texte ne sont pas touchés, seuls les vecteurs —
 * dérivés — sont recalculés.
 *
 * **Source unique de vérité :** l'espace cible est celui de l'indexer fourni
 * (`indexer.embeddingSpace`). Il ne peut donc pas y avoir de divergence entre
 * l'espace purgé et celui dans lequel les vecteurs sont réécrits.
 */
export interface VectorReindexRequest {
  manager: IKnowledgeManager;
  indexer: VectorIndexer;
  vectors: VectorRepository;
  /** Autorise la purge d'un index lié à un autre espace. */
  force?: boolean;
}

export interface VectorReindexOutcome {
  /** Ressources examinées. */
  resources: number;
  /** Espace dans lequel les vecteurs ont été écrits. */
  space: string;
  /** L'index a été purgé et relié au nouvel espace. */
  switched: boolean;
  /** Vecteurs de l'ancien espace supprimés. */
  removed: number;
  report: VectorReindexReport;
}

/**
 * Réindexe tous les vecteurs, en basculant d'espace si nécessaire.
 *
 * @throws {IndexingError} L'indexer ne déclare aucun espace.
 * @throws {EmbeddingSpaceMismatchError} Espace différent et `force` absent.
 */
export async function reindexVectors(request: VectorReindexRequest): Promise<VectorReindexOutcome> {
  const space = request.indexer.embeddingSpace;

  if (space === undefined) {
    throw new IndexingError(
      'indexer sans espace d’embedding : la réindexation exige un fournisseur configuré',
    );
  }

  const active = request.vectors.activeSpace();
  const changed = active !== null && active.space !== space.space;

  if (changed && request.force !== true) {
    throw new EmbeddingSpaceMismatchError(active.space, space.space);
  }

  const removed = changed ? request.indexer.switchSpace(space) : 0;
  const resources = await request.manager.listResources();
  const report = await request.indexer.reindexAll(resources);

  return { resources: resources.length, space: space.space, switched: changed, removed, report };
}
