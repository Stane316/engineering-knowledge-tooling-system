/**
 * Types du moteur de recherche (Sprint 4).
 *
 * Fichier volontairement **sans code exécutable** : il ne contient que des
 * types, ce qui permet de l'exclure de la mesure de couverture (même traitement
 * que `knowledge-manager.types.ts`) sans créer d'angle mort.
 *
 * `SearchResult` est défini dans `src/shared/types.ts` (Sprint 1) et ré-exporté
 * ici : une seule définition partagée par le Data Layer, le Business et les
 * futurs clients (CLI Sprint 5, MCP Sprint 6).
 */

import type { Resource, ResourceType } from '../shared/validators.js';
import type { SearchResult, SearchSource } from '../shared/types.js';

export type { SearchResult, SearchSource };

/** Mode de recherche demandé par l'appelant. */
export type SearchMode = 'hybrid' | 'fts' | 'vector';

/** Options de `ISearchEngine.search`. */
export interface SearchOptions {
  /** Nombre maximum de résultats (défaut : 10, doit être un entier > 0). */
  limit?: number;
  /** Stratégie de recherche (défaut : `hybrid`). */
  mode?: SearchMode;
  /** Filtre sur le type de ressource (appliqué après fusion). */
  type?: ResourceType;
  /** Filtre sur les tags : la ressource doit porter **tous** les tags listés. */
  tags?: readonly string[];
}

/**
 * Contrat du moteur de recherche.
 *
 * `searchFTS` et `searchVector` exposent les stratégies unitaires (utiles pour
 * le diagnostic et le benchmark) ; `search` les compose selon `SearchOptions`.
 */
export interface ISearchEngine {
  /**
   * Recherche complète (hybride par défaut).
   *
   * @param query - Texte libre de l'utilisateur.
   * @param options - Mode, limite et filtres.
   * @returns Résultats triés par pertinence décroissante.
   * @throws {SearchError} Requête invalide ou index illisible.
   * @throws {EmbeddingsError} Mode vectoriel/hybride et échec de l'API.
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Recherche lexicale seule (BM25), sans appel réseau.
   *
   * @param query - Texte libre.
   * @param limit - Nombre maximum de résultats (défaut : 10).
   */
  searchFTS(query: string, limit?: number): Promise<SearchResult[]>;

  /**
   * Recherche sémantique seule (embedding de la requête + KNN cosine).
   *
   * @param query - Texte libre.
   * @param limit - Nombre maximum de résultats (défaut : 10).
   */
  searchVector(query: string, limit?: number): Promise<SearchResult[]>;
}

/** Ressource minimale attendue par l'indexation vectorielle. */
export type IndexableResource = Pick<Resource, 'id' | 'title' | 'content' | 'tags'>;
