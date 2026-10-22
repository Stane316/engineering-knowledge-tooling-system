import type { FTSRepository } from '../data/fts-repository.js';
import type { VectorRepository } from '../data/vector-repository.js';
import { SearchError } from '../shared/errors.js';
import type { SearchResult } from '../shared/types.js';
import type { Resource } from '../shared/validators.js';
import type { IEmbeddingsService } from './embeddings.js';
import { RRF_K, fuseResults } from './rrf.js';
import type { ISearchEngine, SearchMode, SearchOptions } from './search-engine.types.js';

/** Limite par défaut d'une recherche. */
export const DEFAULT_SEARCH_LIMIT = 10;

/**
 * Facteur de suréchantillonnage appliqué quand des filtres sont demandés.
 *
 * Les filtres (`type`, `tags`) s'appliquent **après** la fusion : sans marge,
 * demander 10 résultats filtrés sur un type rare pourrait n'en renvoyer que 2
 * alors que l'index en contient 40. On interroge donc `limit × 5` candidats
 * avant de filtrer. Valeur arbitraire mais documentée et bornée par
 * {@link MAX_CANDIDATE_LIMIT}.
 */
export const FILTER_OVERSAMPLE = 5;

/** Plafond de candidats, pour protéger la latence et la mémoire. */
export const MAX_CANDIDATE_LIMIT = 500;

/** Dépendances injectées dans le moteur. */
export interface SearchEngineDependencies {
  fts: FTSRepository;
  vectors: VectorRepository;
  embeddings: IEmbeddingsService;
}

export interface SearchEngineOptions {
  /** Constante RRF (défaut : {@link RRF_K}). */
  rrfK?: number;
}

/**
 * Moteur de recherche hybride (BM25 + similarité cosinus, fusion RRF).
 *
 * Le moteur ne connaît ni HTTP ni SQLite : il compose les repositories et le
 * service d'embeddings injectés, ce qui permet de le tester avec un fournisseur
 * déterministe (aucun appel réseau).
 */
export class SearchEngine implements ISearchEngine {
  private readonly rrfK: number;

  constructor(
    private readonly dependencies: SearchEngineDependencies,
    options: SearchEngineOptions = {},
  ) {
    this.rrfK = options.rrfK ?? RRF_K;
  }

  /**
   * Recherche selon le mode demandé, puis application des filtres.
   *
   * @throws {SearchError} Limite ou mode invalide, index illisible.
   * @throws {EmbeddingsError} Échec de calcul de l'embedding de requête.
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const limit = resolveLimit(options.limit);
    const mode = options.mode ?? 'hybrid';
    const filtered = options.type !== undefined || (options.tags?.length ?? 0) > 0;
    const candidates = filtered ? candidateLimit(limit) : limit;

    if (query.trim().length === 0) {
      return [];
    }

    const results = await this.run(query, mode, candidates);

    return results.filter((result) => matchesFilters(result.resource, options)).slice(0, limit);
  }

  /** Recherche lexicale seule (aucun appel réseau). */
  async searchFTS(query: string, limit: number = DEFAULT_SEARCH_LIMIT): Promise<SearchResult[]> {
    return this.dependencies.fts.search(query, resolveLimit(limit));
  }

  /** Recherche sémantique seule (un appel d'embedding, puis KNN). */
  async searchVector(query: string, limit: number = DEFAULT_SEARCH_LIMIT): Promise<SearchResult[]> {
    const resolved = resolveLimit(limit);

    if (query.trim().length === 0) {
      return [];
    }

    const embedding = await this.dependencies.embeddings.embed(query);
    return this.dependencies.vectors.search(embedding, resolved);
  }

  private async run(query: string, mode: SearchMode, limit: number): Promise<SearchResult[]> {
    switch (mode) {
      case 'fts':
        return this.dependencies.fts.search(query, limit);
      case 'vector':
        return this.searchVector(query, limit);
      case 'hybrid':
        return this.searchHybrid(query, limit);
      default:
        throw new SearchError(`mode de recherche inconnu : ${String(mode)}`);
    }
  }

  /**
   * Fusionne les deux classements par RRF.
   *
   * Les deux recherches sont lancées en parallèle : la latence de l'hybride
   * est celle du plus lent des deux moteurs (l'appel d'embedding), et non la
   * somme des deux. Une erreur d'un seul côté fait échouer l'ensemble —
   * dégradation silencieuse refusée, car elle changerait le classement sans
   * que l'appelant le sache.
   */
  private async searchHybrid(query: string, limit: number): Promise<SearchResult[]> {
    const [ftsResults, vectorResults] = await Promise.all([
      this.dependencies.fts.search(query, limit),
      this.searchVector(query, limit),
    ]);

    return fuseResults(ftsResults, vectorResults, this.rrfK);
  }
}

/**
 * Valide et normalise une limite.
 *
 * @throws {SearchError} Limite non entière ou ≤ 0.
 */
export function resolveLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_SEARCH_LIMIT;
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new SearchError(`limite invalide (${String(limit)}) : entier > 0 attendu`);
  }

  return limit;
}

/** Applique le suréchantillonnage, borné par {@link MAX_CANDIDATE_LIMIT}. */
export function candidateLimit(limit: number): number {
  return Math.min(limit * FILTER_OVERSAMPLE, MAX_CANDIDATE_LIMIT);
}

/**
 * Un résultat satisfait-il les filtres ?
 *
 * - `type` : égalité stricte ;
 * - `tags` : la ressource doit porter **tous** les tags demandés (ET), la
 *   comparaison étant insensible à la casse pour rester alignée sur
 *   `normalizeTags()` qui conserve la casse d'origine mais déduplique sur la
 *   forme minuscule.
 */
export function matchesFilters(resource: Resource, options: SearchOptions): boolean {
  if (options.type !== undefined && resource.type !== options.type) {
    return false;
  }

  const requested = options.tags;
  if (requested === undefined || requested.length === 0) {
    return true;
  }

  const owned = new Set(resource.tags.map((tag) => tag.toLowerCase()));

  return requested.every((tag) => owned.has(tag.trim().toLowerCase()));
}
