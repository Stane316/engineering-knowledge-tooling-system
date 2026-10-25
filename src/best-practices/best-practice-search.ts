import type Database from 'better-sqlite3';

import { RRF_K, reciprocalRank } from '../business/rrf.js';

import type {
  BestPracticeSearchOptions,
  BestPracticeSearchResult,
  BestPracticeSemanticRanker,
} from './best-practice.types.js';
import type { BestPracticeRepository } from './best-practice-repository.js';

/** Score maximum obtenu par RRF à deux classements (rangs 1 et 1). */
const MAX_RRF_TWO_SOURCES = 2 / (RRF_K + 1);

/**
 * Recherche hybride de bonnes pratiques (Sprint 15, ADR-033).
 *
 * - **Sans requête** : énumération filtrée héritée de
 *   {@link BestPracticeRepository.list} (`matchType: 'list'`).
 * - **Avec requête, sans ranker sémantique** : plein texte FTS5 (BM25,
 *   rang plus négatif = meilleur) normalisé en 0-1 (`matchType: 'fts'`).
 * - **Avec requête + ranker sémantique injecté** : fusion **RRF** des deux
 *   classements via `reciprocalRank`/`RRF_K` du Sprint 4
 *   (`matchType: 'hybrid'`) — C15.5. Le service (Sprint 15-02) injecte le
 *   ranker branché sur les embeddings du moteur existant ; sans fournisseur,
 *   il reste absent et la recherche reste FTS seule (comme les audits).
 *
 * La table FTS5 `best_practices_fts` (external content) est synchronisée par
 * les triggers de la migration 005.
 */
export class BestPracticeSearch {
  /**
   * @param db - Connexion SQLite.
   * @param repo - Repository des bonnes pratiques (lecture des lignes).
   * @param semanticRanker - Ranker sémantique optionnel (ids triés).
   */
  constructor(
    private readonly db: Database.Database,
    private readonly repo: BestPracticeRepository,
    private readonly semanticRanker?: BestPracticeSemanticRanker,
  ) {}

  /**
   * Recherche des bonnes pratiques (hybride ou énumération filtrée).
   *
   * @param options - Requête optionnelle + filtres + limite.
   * @returns Résultats triés par pertinence décroissante.
   */
  search(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    if (options.query === undefined || options.query.trim().length === 0) {
      return this.listFiltered(options);
    }
    return this.hybridSearch(options);
  }

  /** Recherche avec requête : FTS5, fusion RRF si un ranker est injecté. */
  private hybridSearch(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    const query = options.query ?? '';
    const limit = options.limit ?? 20;

    const ftsResults = this.searchFts(query, Math.max(limit * 2, 20));
    if (ftsResults.length === 0) {
      return [];
    }

    if (this.semanticRanker !== undefined) {
      return this.mergeWithSemantic(query, ftsResults, limit);
    }
    return this.normalizeFts(ftsResults, limit);
  }

  /** Fusion RRF (k = 60) des classements FTS5 et sémantique. */
  private mergeWithSemantic(
    query: string,
    ftsResults: ReadonlyArray<{ id: string; rank: number }>,
    limit: number,
  ): BestPracticeSearchResult[] {
    const semanticIds = this.semanticRanker?.(query, limit * 2) ?? [];

    // Somme des contributions RRF par identifiant (rang = position + 1).
    const scores = new Map<string, { ftsRank: number; semRank: number }>();
    const ensure = (id: string): { ftsRank: number; semRank: number } => {
      const existing = scores.get(id);
      if (existing !== undefined) {
        return existing;
      }
      const created = { ftsRank: Number.POSITIVE_INFINITY, semRank: Number.POSITIVE_INFINITY };
      scores.set(id, created);
      return created;
    };

    ftsResults.forEach((result, index) => {
      ensure(result.id).ftsRank = index + 1;
    });
    semanticIds.forEach((id, index) => {
      ensure(id).semRank = index + 1;
    });

    const results: BestPracticeSearchResult[] = [];
    for (const [id, ranks] of scores) {
      const practice = this.repo.getById(id);
      if (practice === null) {
        continue;
      }
      let score = 0;
      if (Number.isFinite(ranks.ftsRank)) {
        score += reciprocalRank(ranks.ftsRank);
      }
      if (Number.isFinite(ranks.semRank)) {
        score += reciprocalRank(ranks.semRank);
      }
      results.push({
        practice,
        score: Math.max(0, Math.min(1, score / MAX_RRF_TWO_SOURCES)),
        matchType: 'hybrid',
      });
    }

    return results
      .sort(
        (left, right) =>
          right.score - left.score || left.practice.id.localeCompare(right.practice.id),
      )
      .slice(0, limit);
  }

  /**
   * Classement FTS seul : scores BM25 normalisés en 0-1.
   *
   * `rank` FTS5 est **négatif** (BM25) : plus il est négatif, meilleur est
   * le match — le meilleur rang absolu vaut donc 1 après normalisation
   * `|rank| / max|rank|` (une lecture « proche de 0 = meilleur » inverserait
   * le classement : écart au pseudocode spec, corrigé).
   */
  private normalizeFts(
    ftsResults: ReadonlyArray<{ id: string; rank: number }>,
    limit: number,
  ): BestPracticeSearchResult[] {
    const maxBm25 = Math.max(...ftsResults.map((result) => Math.abs(result.rank)));

    const results: BestPracticeSearchResult[] = [];
    ftsResults.forEach((result, index) => {
      const practice = this.repo.getById(result.id);
      if (practice === null) {
        return;
      }
      const normalizedScore =
        maxBm25 > 0 ? Math.abs(result.rank) / maxBm25 : 1 - index / Math.max(ftsResults.length, 1);
      results.push({
        practice,
        score: Math.max(0, Math.min(1, normalizedScore)),
        matchType: 'fts',
      });
    });

    return results.slice(0, limit);
  }

  /** Requête FTS5 avec BM25 (`rank` négatif, plus négatif = meilleur). */
  private searchFts(query: string, limit: number): Array<{ id: string; rank: number }> {
    const sanitizedQuery = this.sanitizeFtsQuery(query);
    if (sanitizedQuery.length === 0) {
      return [];
    }

    try {
      return this.db
        .prepare(
          `SELECT bp.id, fts.rank
           FROM best_practices_fts fts
           JOIN best_practices bp ON bp.rowid = fts.rowid
           WHERE best_practices_fts MATCH ?
           ORDER BY fts.rank
           LIMIT ?`,
        )
        .all(sanitizedQuery, limit) as Array<{ id: string; rank: number }>;
    } catch {
      // Requête FTS invalide malgré l'assainissement → aucun résultat (non bloquant).
      return [];
    }
  }

  /** Énumération filtrée quand aucune requête textuelle n'est fournie. */
  private listFiltered(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    const practices = this.repo.list({
      category: options.category,
      tag: options.tag,
      projectId: options.projectId,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
      orderBy: 'occurrence_count',
      orderDir: 'desc',
    });

    return practices.map((practice) => ({ practice, score: 1, matchType: 'list' as const }));
  }

  /**
   * Assainit une requête pour FTS5 : retire les caractères de syntaxe,
   * puis clone chaque terme entre guillemets (phrase) — aucun opérateur
   * utilisateur n'atteint l'interpréteur FTS.
   */
  private sanitizeFtsQuery(query: string): string {
    return query
      .replace(/["'`(){}[\]^~*:\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter((term) => term.length > 0)
      .map((term) => `"${term}"`)
      .join(' ');
  }
}
