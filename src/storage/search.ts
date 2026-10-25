import type { Database } from 'better-sqlite3';

import type { AnalysisDimension, Priority } from '../analysis/types.js';
import { RRF_K, reciprocalRank } from '../business/rrf.js';
import { SearchError, ValidationError } from '../shared/errors.js';

import type { AuditRepository } from './audit-repository.js';
import type { Audit, AuditEmbeddingStore, AuditSearchOptions, AuditSearchResult } from './types.js';

/** Résumé d'un constat fréquent (regroupement SQL). */
export interface TopIssueSummary {
  /** Titre regroupé. */
  title: string;
  /** Dimension du constat. */
  dimension: AnalysisDimension;
  /** Sévérité du constat. */
  severity: number;
  /** Priorité du constat. */
  priority: Priority;
  /** Nombre d'audits touchés. */
  count: number;
}

/** Candidat FTS : audit et rang BM25 (négatif, croissant = meilleur). */
interface FtsCandidate {
  auditId: number;
  rank: number;
}

/**
 * Recherche d'audits (Sprint 10-2).
 *
 * Deux familles de requêtes :
 * - **hybride** (`query` présente) : classement lexical FTS5 (BM25), classement
 *   sémantique du magasin d'embeddings injecté, fusion **Reciprocal Rank
 *   Fusion** avec la constante maison `RRF_K = 60` et `reciprocalRank()` de
 *   `src/business/rrf.ts` — les échelles BM25/cosinus ne sont pas comparables,
 *   seuls les rangs comptent. Sans magasin injecté : classement lexical seul
 *   (jamais un score sémantique simulé).
 * - **filtrée** (sans `query`) : énumération paginée des audits, score `1`.
 *
 * Suivent les filtres (score, dimension, priorité) puis la pagination.
 */
export class AuditSearch {
  /**
   * @param db - Connexion ouverte sur le schéma d'audits.
   * @param repo - Repository servant à hydrater les audits.
   * @param embeddings - Magasin d'embeddings optionnel.
   */
  constructor(
    private readonly db: Database,
    private readonly repo: AuditRepository,
    private readonly embeddings?: AuditEmbeddingStore,
  ) {}

  /**
   * Recherche des audits (hybride ou filtrée) avec pagination.
   *
   * @param options - Requête, filtres et pagination.
   * @returns Audits triés par pertinence décroissante.
   * @throws {ValidationError} Pagination invalide.
   * @throws {SearchError} Requête FTS5 malformée ou échec du magasin.
   */
  async search(options: AuditSearchOptions = {}): Promise<AuditSearchResult[]> {
    const {
      query,
      scoreMin,
      scoreMax,
      dimension,
      priority,
      projectId,
      offset = 0,
      limit = 100,
    } = options;

    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError([`offset invalide (${String(offset)})`]);
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationError([`limit invalide (${String(limit)})`]);
    }

    const trimmed = query?.trim() ?? '';
    let results: AuditSearchResult[];

    if (trimmed.length > 0) {
      const candidateLimit = (offset + limit) * 2;
      const fts = this.searchFTS(trimmed, candidateLimit);

      if (this.embeddings === undefined) {
        results = fts.map((candidate, index) => ({
          audit: this.requireAudit(candidate.auditId),
          score: reciprocalRank(index + 1, RRF_K),
        }));
      } else {
        results = await this.hybridMerge(trimmed, fts, candidateLimit);
      }

      const filtered = results.filter((result) => {
        const { audit } = result;
        if (projectId !== undefined && audit.metadata.projectId !== projectId) {
          return false;
        }
        if (scoreMin !== undefined && audit.metadata.overallScore < scoreMin) {
          return false;
        }
        if (scoreMax !== undefined && audit.metadata.overallScore > scoreMax) {
          return false;
        }
        if (
          dimension !== undefined &&
          !audit.dimensions.some((d) => d.dimension === dimension && d.findingsCount > 0)
        ) {
          return false;
        }
        if (priority !== undefined && !audit.findings.some((f) => f.priority === priority)) {
          return false;
        }
        return true;
      });

      return filtered.slice(offset, offset + limit);
    }

    // Sans requête : filtres et pagination poussés en SQL (une seule
    // pagination, pas de ré-ajustement mémoire sur une page déjà tronquée).
    return this.listFiltered({ scoreMin, scoreMax, dimension, priority, projectId }, offset, limit);
  }

  /**
   * Audits dont le score global est compris dans un intervalle.
   *
   * @param min - Score minimal (compris).
   * @param max - Score maximal (compris).
   * @returns Audits correspondants, du plus récent au plus ancien.
   */
  findByScoreRange(min: number, max: number): Audit[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM audit_metadata
          WHERE overall_score BETWEEN ? AND ?
          ORDER BY timestamp DESC`,
      )
      .all(min, max) as Array<{ id: number }>;

    return rows
      .map(({ id }) => this.repo.findById(id))
      .filter((audit): audit is Audit => audit !== null);
  }

  /**
   * Audits possédant au moins un constat d'une dimension donnée.
   *
   * @param dimension - Dimension recherchée.
   * @returns Audits correspondants, du plus récent au plus ancien.
   */
  findByDimension(dimension: AnalysisDimension): Audit[] {
    const rows = this.db
      .prepare(
        `SELECT m.id FROM audit_dimensions d
           JOIN audit_metadata m ON m.id = d.audit_id
          WHERE d.dimension = ? AND d.findings_count > 0
          ORDER BY m.timestamp DESC, m.id DESC`,
      )
      .all(dimension) as Array<{ id: number }>;

    return rows
      .map(({ id }) => this.repo.findById(id))
      .filter((audit): audit is Audit => audit !== null);
  }

  /**
   * Audits possédant au moins un constat d'une priorité donnée.
   *
   * @param priority - Priorité recherchée.
   * @returns Audits correspondants, du plus récent au plus ancien.
   */
  findByPriority(priority: Priority): Audit[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT m.id FROM audit_findings f
           JOIN audit_metadata m ON m.id = f.audit_id
          WHERE f.priority = ?
          ORDER BY m.timestamp DESC, m.id DESC`,
      )
      .all(priority) as Array<{ id: number }>;

    return rows
      .map(({ id }) => this.repo.findById(id))
      .filter((audit): audit is Audit => audit !== null);
  }

  /**
   * Constats les plus répartis (regroupés par titre, dimension et priorité).
   *
   * @param limit - Nombre maximal de regroupements (défaut : 10).
   * @returns Regroupements triés par nombre d'audits touchés décroissant.
   * @throws {ValidationError} Limite invalide.
   */
  findTopIssues(limit = 10): TopIssueSummary[] {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationError([`limit invalide (${String(limit)})`]);
    }

    const rows = this.db
      .prepare(
        `SELECT title, dimension, severity, priority,
                COUNT(DISTINCT audit_id) AS count
           FROM audit_findings
          GROUP BY title, dimension, severity, priority
          ORDER BY count DESC, severity DESC, title ASC
          LIMIT ?`,
      )
      .all(limit) as Array<{
      title: string;
      dimension: AnalysisDimension;
      severity: number;
      priority: Priority;
      count: number;
    }>;

    return rows.map((row) => ({
      title: row.title,
      dimension: row.dimension,
      severity: row.severity,
      priority: row.priority,
      count: row.count,
    }));
  }

  /** Énumération filtrée (sans requête) : filtres en SQL, page unique. */
  private listFiltered(
    filters: {
      scoreMin?: number;
      scoreMax?: number;
      dimension?: AnalysisDimension;
      priority?: Priority;
      projectId?: string;
    },
    offset: number,
    limit: number,
  ): AuditSearchResult[] {
    const rows = this.db
      .prepare(
        `SELECT m.id AS id FROM audit_metadata m
          WHERE (@projectId IS NULL OR m.project_id = @projectId)
            AND (@scoreMin IS NULL OR m.overall_score >= @scoreMin)
            AND (@scoreMax IS NULL OR m.overall_score <= @scoreMax)
            AND (
              @dimension IS NULL
              OR EXISTS (
                SELECT 1 FROM audit_dimensions d
                 WHERE d.audit_id = m.id
                   AND d.dimension = @dimension
                   AND d.findings_count > 0
              )
            )
            AND (
              @priority IS NULL
              OR EXISTS (
                SELECT 1 FROM audit_findings f
                 WHERE f.audit_id = m.id AND f.priority = @priority
              )
            )
          ORDER BY m.timestamp DESC, m.id DESC
          LIMIT @limit OFFSET @offset`,
      )
      .all({
        projectId: filters.projectId ?? null,
        scoreMin: filters.scoreMin ?? null,
        scoreMax: filters.scoreMax ?? null,
        dimension: filters.dimension ?? null,
        priority: filters.priority ?? null,
        limit,
        offset,
      }) as Array<{ id: number }>;

    const results: AuditSearchResult[] = [];
    for (const { id } of rows) {
      const audit = this.repo.findById(id);
      if (audit !== null) {
        results.push({ audit, score: 1 });
      }
    }
    return results;
  }

  /** Classement lexical BM25, agrégé par audit (meilleur rang par audit). */
  private searchFTS(query: string, limit: number): FtsCandidate[] {
    try {
      // `bm25()` n'est accepté par SQLite qu'en colonne d'une requête simple
      // (ni dans MIN(), ni dans GROUP BY, ni dans une sous-requête) : les
      // lignes de constats reviennent triées, l'agrégation par audit se fait
      // ensuite en mémoire — la première apparition porte le meilleur rang.
      const rows = this.db
        .prepare(
          `SELECT f.audit_id AS auditId, bm25(audit_fts) AS rank
             FROM audit_fts
             JOIN audit_findings f ON f.id = audit_fts.rowid
            WHERE audit_fts MATCH ?
            ORDER BY rank ASC
            LIMIT ?`,
        )
        .all(query, limit) as Array<FtsCandidate>;

      const seen = new Set<number>();
      const aggregated: FtsCandidate[] = [];
      for (const row of rows) {
        if (!seen.has(row.auditId)) {
          seen.add(row.auditId);
          aggregated.push(row);
        }
      }
      return aggregated;
    } catch (error) {
      throw new SearchError(`requête FTS invalide (${query})`, { cause: error });
    }
  }

  /** Fusionne classement lexical et sémantique par RRF (k = 60). */
  private async hybridMerge(
    query: string,
    fts: readonly FtsCandidate[],
    limit: number,
  ): Promise<AuditSearchResult[]> {
    const store = this.embeddings;
    if (store === undefined) {
      // Jamais atteint : appelé uniquement avec un magasin injecté.
      throw new SearchError('magasin d’embeddings absent');
    }

    const matches = await store.search(query, limit);

    const scores = new Map<number, number>();

    const accumulate = (auditId: number, rank: number): void => {
      scores.set(auditId, (scores.get(auditId) ?? 0) + reciprocalRank(rank, RRF_K));
    };

    fts.forEach((candidate, index) => accumulate(candidate.auditId, index + 1));
    matches.forEach((match, index) => accumulate(match.auditId, index + 1));

    // Tri total : score décroissant, puis identifiant — ordre reproductible.
    const ordered = [...scores.entries()].sort(([idA, scoreA], [idB, scoreB]) => {
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return idA - idB;
    });

    return ordered.map(([auditId, score]) => ({
      audit: this.requireAudit(auditId),
      score,
    }));
  }

  /** Hydrate un audit issu d'un classement, en ignorant les lignes orphelines. */
  private requireAudit(auditId: number): Audit {
    const audit = this.repo.findById(auditId);
    if (audit === null) {
      throw new SearchError(`audit orphelin dans l'index (id ${String(auditId)})`);
    }
    return audit;
  }
}
