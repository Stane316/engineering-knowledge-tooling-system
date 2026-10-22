import type Database from 'better-sqlite3';
import { ZodError, type ZodType } from 'zod';

import { ResourceRepository } from '../data/repositories/resource-repository.js';
import { ResourceNotFoundError, ValidationError } from '../shared/errors.js';
import {
  CreateResourceSchema,
  ResourceFiltersSchema,
  UpdateResourceSchema,
  type Resource,
  type ResourceFilters,
  type ResourceType,
} from '../shared/validators.js';
import { Indexer } from './indexer.js';
import type {
  AddResourceInput,
  IKnowledgeManager,
  KnowledgeStats,
  UpdateResourceData,
} from './knowledge-manager.types.js';
import type { ReindexReport } from './indexer.js';

const RESOURCE_TYPES: readonly ResourceType[] = ['article', 'video', 'tutorial', 'tool', 'other'];

/**
 * Knowledge Manager — logique métier des ressources.
 *
 * Rôle : exposer des opérations **typées et validées** au-dessus de la couche
 * données, avec des erreurs métier stables (`ResourceNotFoundError`,
 * `ValidationError`). L'indexation plein texte reste assurée par
 * `ResourceRepository`, dans la même transaction que l'écriture : le manager ne
 * peut donc pas laisser une ressource non indexée.
 */
export class KnowledgeManager implements IKnowledgeManager {
  constructor(
    private readonly repository: ResourceRepository,
    private readonly indexer: Indexer,
  ) {}

  /** Crée une ressource validée et normalisée (tags dédupliqués). */
  async addResource(input: AddResourceInput): Promise<Resource> {
    const values = parseInput(CreateResourceSchema, input);

    return this.repository.create({
      ...values,
      tags: normalizeTags(values.tags),
    });
  }

  /** Retourne la ressource ou `null` — ne lève pas d'exception. */
  async getResource(id: string): Promise<Resource | null> {
    return this.repository.getById(id);
  }

  /** Variante stricte de `getResource`, pour les appelants qui exigent la présence. */
  async getResourceOrThrow(id: string): Promise<Resource> {
    const resource = this.repository.getById(id);

    if (!resource) {
      throw new ResourceNotFoundError(id);
    }

    return resource;
  }

  /** Liste filtrée et paginée. */
  async listResources(filters: ResourceFilters = {}): Promise<Resource[]> {
    return this.repository.list(parseInput(ResourceFiltersSchema, filters));
  }

  /**
   * Met à jour partiellement une ressource existante.
   * Le type d'une ressource est immuable : il n'est pas modifiable après création.
   */
  async updateResource(id: string, data: UpdateResourceData): Promise<Resource> {
    // Validation avant toute lecture : une entrée invalide ne doit pas coûter d'accès disque.
    const values = parseInput(UpdateResourceSchema, data);

    const updated = this.repository.update(id, {
      ...values,
      ...(values.tags !== undefined ? { tags: normalizeTags(values.tags) } : {}),
    });

    if (!updated) {
      throw new ResourceNotFoundError(id);
    }

    return updated;
  }

  /** Supprime une ressource et ses entrées d'index. */
  async deleteResource(id: string): Promise<void> {
    if (!this.repository.delete(id)) {
      throw new ResourceNotFoundError(id);
    }
  }

  /**
   * Tags distincts de la base, triés alphabétiquement.
   *
   * Le tri est **total** : à casse égale, la collation française place la
   * graphie minuscule en premier, et c'est elle qui est conservée. Le résultat
   * ne dépend donc pas de l'ordre d'insertion des ressources.
   */
  async listTags(): Promise<string[]> {
    const collected = this.repository.list().flatMap((resource) => resource.tags);

    const sorted = [...collected].sort((left, right) => {
      const comparison = left.toLowerCase().localeCompare(right.toLowerCase(), 'fr');

      return comparison !== 0 ? comparison : left.localeCompare(right, 'fr');
    });

    const unique = new Map<string, string>();

    for (const tag of sorted) {
      const key = tag.toLowerCase();

      if (!unique.has(key)) {
        unique.set(key, tag);
      }
    }

    return [...unique.values()];
  }

  /** Volumétrie et état de l'index. */
  async stats(): Promise<KnowledgeStats> {
    const resources = this.repository.list();
    const byType = Object.fromEntries(RESOURCE_TYPES.map((type) => [type, 0])) as Record<
      ResourceType,
      number
    >;

    for (const resource of resources) {
      byType[resource.type] += 1;
    }

    const integrity = this.indexer.checkIntegrity();

    return {
      total: resources.length,
      byType,
      indexed: integrity.indexed,
      consistent: integrity.consistent,
    };
  }

  /** Reconstruit l'index plein texte (maintenance après incident). */
  async reindex(): Promise<ReindexReport> {
    return this.indexer.reindexAll();
  }
}

/**
 * Valide une entrée et convertit un `ZodError` en `ValidationError` métier.
 * Les messages sont préfixés du chemin du champ concerné.
 *
 * Exporté pour être réutilisé par la CLI (Sprint 5) et le serveur MCP (Sprint 6).
 */
export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        error.issues.map((issue) => {
          const path = issue.path.join('.');

          return path ? `${path} : ${issue.message}` : issue.message;
        }),
        { cause: error },
      );
    }

    throw error;
  }
}

/**
 * Normalise une liste de tags : suppression des doublons (insensible à la casse,
 * première graphie conservée) et des espaces superflus.
 * La validation Zod a déjà écarté les chaînes vides et limité la longueur.
 */
export function normalizeTags(tags: readonly string[]): string[] {
  const unique = new Map<string, string>();

  for (const raw of tags) {
    const tag = raw.trim();
    const key = tag.toLowerCase();

    if (tag !== '' && !unique.has(key)) {
      unique.set(key, tag);
    }
  }

  return [...unique.values()];
}

/**
 * Câblage par défaut : ouvre les services sur une connexion existante.
 * Utilisé par la CLI (Sprint 5), le serveur MCP (Sprint 6) et les tests.
 */
export function createKnowledgeManager(connection: Database.Database): {
  manager: KnowledgeManager;
  repository: ResourceRepository;
  indexer: Indexer;
} {
  const repository = new ResourceRepository(connection);
  const indexer = new Indexer(connection);

  return { manager: new KnowledgeManager(repository, indexer), repository, indexer };
}
