import type { VectorRepository } from '../data/vector-repository.js';
import type { Resource } from '../shared/validators.js';
import type { IEmbeddingsService } from './embeddings.js';
import type {
  AddResourceInput,
  IKnowledgeManager,
  KnowledgeStats,
  UpdateResourceData,
} from './knowledge-manager.types.js';
import type { ReindexReport } from './indexer.js';
import type { ResourceFilters } from '../shared/validators.js';

/** Bilan d'une réindexation vectorielle. */
export interface VectorReindexReport {
  /** Vecteurs écrits ou réécrits. */
  indexed: number;
  /** Ressources sans texte exploitable : vecteur supprimé s'il existait. */
  skipped: number;
  /** Ressources dont l'embedding a échoué (le reste du lot continue). */
  failed: number;
  durationMs: number;
}

/** Espace d'embedding auquel l'index est lié. */
export interface EmbeddingSpace {
  space: string;
  provider: string;
  model: string;
  dimensions: number;
}

export interface VectorIndexerOptions {
  /**
   * Espace servi par le fournisseur d'embeddings.
   *
   * S'il est fourni, l'index est **lié** à cet espace à la première écriture et
   * toute écriture ultérieure dans un autre espace est refusée : deux modèles
   * produisent des vecteurs incomparables, les mélanger dégraderait le rappel
   * sans provoquer d'erreur.
   */
  space?: EmbeddingSpace;
}

/** Contrat de l'indexation vectorielle. */
export interface IVectorIndexer {
  /** Calcule et stocke l'embedding d'une ressource (remplace l'existant). */
  indexResource(resource: Resource): Promise<void>;
  /** Supprime l'embedding d'une ressource (idempotent). */
  removeResource(resourceId: string): void;
  /** Réindexe un ensemble de ressources, sans interrompre le lot en cas d'échec. */
  reindexAll(resources: readonly Resource[]): Promise<VectorReindexReport>;
}

/**
 * Construit le texte envoyé au modèle d'embedding.
 *
 * Le titre, le contenu et les tags sont concaténés (séparés par un saut de
 * ligne) : le titre pèse ainsi naturellement sur la similarité sans écraser le
 * contenu, contrairement à une répétition artificielle du titre.
 *
 * @param resource - Champs textuels de la ressource.
 * @returns Texte non vide, ou `''` si la ressource n'a aucun texte.
 */
export function buildEmbeddingText(resource: Pick<Resource, 'title' | 'content' | 'tags'>): string {
  return [resource.title, resource.content ?? '', resource.tags.join(' ')]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join('\n');
}

/**
 * Indexer vectoriel : transforme une ressource en vecteur et le stocke.
 *
 * Il ne connaît ni SQLite ni HTTP directement : il compose
 * `IEmbeddingsService` (réseau) et `VectorRepository` (stockage), ce qui rend
 * l'indexation testable sans clé API.
 */
export class VectorIndexer implements IVectorIndexer {
  private readonly space: EmbeddingSpace | undefined;
  private bound = false;

  constructor(
    private readonly embeddings: IEmbeddingsService,
    private readonly vectors: VectorRepository,
    options: VectorIndexerOptions = {},
  ) {
    this.space = options.space;
  }

  /**
   * Espace d'embedding servi, source unique de vérité pour la maintenance.
   * Absent quand l'indexer a été construit sans espace (tests unitaires).
   */
  get embeddingSpace(): EmbeddingSpace | undefined {
    return this.space;
  }

  async indexResource(resource: Resource): Promise<void> {
    const text = buildEmbeddingText(resource);

    if (text.length === 0) {
      this.vectors.deleteEmbedding(resource.id);
      return;
    }

    const embedding = await this.embeddings.embed(text);
    this.ensureSpace();
    this.vectors.insertEmbedding(resource.id, embedding);
  }

  /**
   * Lie l'index à l'espace configuré, une seule fois par instance.
   *
   * @throws {EmbeddingSpaceMismatchError} Index déjà rempli par un autre espace.
   */
  private ensureSpace(): void {
    if (this.space === undefined || this.bound) {
      return;
    }

    this.vectors.assertSpace(this.space.space);
    this.vectors.bindSpace({
      space: this.space.space,
      provider: this.space.provider,
      model: this.space.model,
      dimensions: this.space.dimensions,
    });
    this.bound = true;
  }

  /**
   * Purge l'index et le lie à un nouvel espace d'embedding.
   *
   * Seule façon propre de changer de modèle : les vecteurs de l'ancien espace
   * n'ont plus de sens pour le nouveau.
   *
   * @returns Nombre de vecteurs supprimés.
   */
  switchSpace(space: EmbeddingSpace): number {
    const removed = this.vectors.clearAll();
    this.vectors.bindSpace(space);
    this.bound = true;
    return removed;
  }

  removeResource(resourceId: string): void {
    this.vectors.deleteEmbedding(resourceId);
  }

  /**
   * Réindexe un lot de ressources.
   *
   * Un échec individuel (quota API, texte refusé) n'interrompt pas le lot : il
   * est compté dans `failed` et signalé à l'appelant, qui peut relancer
   * `npm run db:reindex -- --vectors`.
   */
  async reindexAll(resources: readonly Resource[]): Promise<VectorReindexReport> {
    const startedAt = Date.now();
    let indexed = 0;
    let skipped = 0;
    let failed = 0;

    for (const resource of resources) {
      try {
        await this.indexResource(resource);
        if (buildEmbeddingText(resource).length === 0) {
          skipped += 1;
        } else {
          indexed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    return { indexed, skipped, failed, durationMs: Date.now() - startedAt };
  }
}

/** Bilan de `reindex()` lorsque l'indexation vectorielle est branchée. */
export type KnowledgeReindexReport = ReindexReport & { vectors: VectorReindexReport };

/**
 * Décorateur qui branche l'indexation vectorielle sur un `IKnowledgeManager`.
 *
 * **Pourquoi un décorateur ?** La mission du Sprint 4 interdit de modifier
 * `KnowledgeManager` (`src/business/knowledge-manager.ts`). Le décorateur
 * respecte cette contrainte tout en satisfaisant C4.5 (indexation automatique à
 * chaque création, mise à jour et suppression) :
 *
 * ```ts
 * const { manager } = createKnowledgeManager(connection);
 * const searchable = withVectorIndexing(manager, vectorIndexer);
 * await searchable.addResource({ ... }); // FTS (manager) + vecteur (décorateur)
 * ```
 *
 * **Limite assumée** : l'écriture SQLite et l'appel OpenAI ne partagent pas de
 * transaction. Si l'embedding échoue après la création, la ressource existe
 * sans vecteur et l'erreur (`EmbeddingsError`) remonte à l'appelant. C'est le
 * même compromis que pour l'index FTS dans un fichier séparé ; la réparation
 * passe par `reindex()`. Un mode « best-effort » masquerait une incohérence
 * silencieuse, ce qui a été écarté.
 */
export class VectorIndexedKnowledgeManager implements IKnowledgeManager {
  constructor(
    private readonly inner: IKnowledgeManager,
    private readonly indexer: IVectorIndexer,
  ) {}

  async addResource(input: AddResourceInput): Promise<Resource> {
    const resource = await this.inner.addResource(input);
    await this.indexer.indexResource(resource);
    return resource;
  }

  getResource(id: string): Promise<Resource | null> {
    return this.inner.getResource(id);
  }

  getResourceOrThrow(id: string): Promise<Resource> {
    return this.inner.getResourceOrThrow(id);
  }

  listResources(filters?: ResourceFilters): Promise<Resource[]> {
    return this.inner.listResources(filters);
  }

  async updateResource(id: string, data: UpdateResourceData): Promise<Resource> {
    const resource = await this.inner.updateResource(id, data);
    await this.indexer.indexResource(resource);
    return resource;
  }

  async deleteResource(id: string): Promise<void> {
    await this.inner.deleteResource(id);
    this.indexer.removeResource(id);
  }

  listTags(): Promise<string[]> {
    return this.inner.listTags();
  }

  stats(): Promise<KnowledgeStats> {
    return this.inner.stats();
  }

  async reindex(): Promise<KnowledgeReindexReport> {
    const report = await this.inner.reindex();
    const vectors = await this.indexer.reindexAll(await this.inner.listResources());

    return { ...report, vectors };
  }
}

/**
 * Branche l'indexation vectorielle sur un Knowledge Manager existant.
 *
 * @param manager - Manager « nu » (FTS uniquement).
 * @param indexer - Indexer vectoriel configuré.
 * @returns Manager enrichi : mêmes méthodes, plus l'indexation vectorielle.
 */
export function withVectorIndexing(
  manager: IKnowledgeManager,
  indexer: IVectorIndexer,
): VectorIndexedKnowledgeManager {
  return new VectorIndexedKnowledgeManager(manager, indexer);
}
