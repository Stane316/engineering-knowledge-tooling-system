import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import type { AnalysisDimension } from '../analysis/types.js';
import { ValidationError } from '../shared/errors.js';

import type {
  BestPractice,
  BestPracticeFilters,
  CreateBestPracticeInput,
  FindingBestPracticeLink,
  UpdateBestPracticeInput,
} from './best-practice.types.js';

/** Colonnes autorisées pour le tri (liste blanche, jamais interpolée librement). */
const ORDER_COLUMNS = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  occurrence_count: 'occurrence_count',
  title: 'title',
} as const;

/**
 * Repository des bonnes pratiques (Sprint 15).
 *
 * CRUD complet, filtres (catégorie, tag, projet source, manuel/automatique),
 * pagination, tri borné et opérations d'association `finding ↔ bonne pratique`
 * (ADR-035). API **synchrone** (better-sqlite3), comme tous les repositories
 * du dépôt.
 *
 * Le stockage JSON (`tags`, `source_project_ids`, `source_audit_ids`) est
 * sérialisé/désérialisé ici : les appelsants ne voient que des tableaux TS.
 */
export class BestPracticeRepository {
  /** @param db - Connexion SQLite (tables créées par la migration 005). */
  constructor(private readonly db: Database.Database) {}

  /**
   * Crée une bonne pratique (occurrence initiale = 1).
   *
   * @param input - Données de la pratique (tags/projets/audits optionnels).
   * @returns La pratique persistée.
   */
  create(input: CreateBestPracticeInput): BestPractice {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO best_practices (
           id, title, description, category, tags,
           source_project_ids, source_audit_ids,
           occurrence_count, created_at, updated_at, is_manual
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.title,
        input.description,
        input.category,
        JSON.stringify(input.tags ?? []),
        JSON.stringify(input.sourceProjectIds ?? []),
        JSON.stringify(input.sourceAuditIds ?? []),
        1,
        now,
        now,
        input.isManual === true ? 1 : 0,
      );

    const created = this.getById(id);
    if (created === null) {
      // Insertion puis lecture immédiate : ne peut échouer que sur corruption.
      throw new ValidationError([`bonne pratique ${id} illisible après création`]);
    }
    return created;
  }

  /**
   * Récupère une bonne pratique par son identifiant UUID.
   *
   * @param id - Identifiant UUID.
   * @returns La pratique, ou `null` si absente.
   */
  getById(id: string): BestPractice | null {
    const row = this.db.prepare('SELECT * FROM best_practices WHERE id = ?').get(id) as
      Record<string, unknown> | undefined;
    return row === undefined ? null : this.mapRow(row);
  }

  /**
   * Liste les bonnes pratiques avec filtres et pagination.
   *
   * @param filters - Filtres optionnels (défaut : tout, 50 lignes, `created_at DESC`).
   * @returns Pratiques triées (jamais `null`).
   */
  list(filters: BestPracticeFilters = {}): BestPractice[] {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters.category !== undefined) {
      clauses.push('category = ?');
      params.push(filters.category);
    }

    if (filters.tag !== undefined) {
      // Tag JSON sérialisé : correspondance sur `"tag"` entier (pas de prefix).
      clauses.push('tags LIKE ?');
      params.push(`%"${filters.tag}"%`);
    }

    if (filters.projectId !== undefined) {
      clauses.push('source_project_ids LIKE ?');
      params.push(`%"${filters.projectId}"%`);
    }

    if (filters.isManual !== undefined) {
      clauses.push('is_manual = ?');
      params.push(filters.isManual ? 1 : 0);
    }

    const column = ORDER_COLUMNS[filters.orderBy ?? 'created_at'];
    const direction = filters.orderDir === 'asc' ? 'ASC' : 'DESC';
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const query = `SELECT * FROM best_practices${
      clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : ''
    } ORDER BY ${column} ${direction} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = this.db.prepare(query).all(...params) as Record<string, unknown>[];
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Met à jour les champs fournis d'une bonne pratique.
   *
   * @param id - Identifiant de la pratique.
   * @param input - Champs partiels (`tags` remplace la liste complète).
   * @returns La pratique mise à jour (inchangée si aucun champ fourni).
   * @throws {ValidationError} Pratique absente.
   */
  update(id: string, input: UpdateBestPracticeInput): BestPractice {
    const existing = this.getById(id);
    if (existing === null) {
      throw new ValidationError([`bonne pratique ${id} introuvable`]);
    }

    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.title !== undefined) {
      fields.push('title = ?');
      params.push(input.title);
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description);
    }
    if (input.category !== undefined) {
      fields.push('category = ?');
      params.push(input.category);
    }
    if (input.tags !== undefined) {
      fields.push('tags = ?');
      params.push(JSON.stringify(input.tags));
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE best_practices SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    const updated = this.getById(id);
    if (updated === null) {
      throw new ValidationError([`bonne pratique ${id} illisible après mise à jour`]);
    }
    return updated;
  }

  /**
   * Supprime une bonne pratique.
   *
   * Les associations `finding_best_practice` suivent en cascade (FK 005).
   * La suppression d'une pratique absente est un no-op silencieux (idempotent).
   *
   * @param id - Identifiant de la pratique.
   */
  delete(id: string): void {
    this.db.prepare('DELETE FROM best_practices WHERE id = ?').run(id);
  }

  /**
   * Incrémente le compteur d'occurrences et étend la traçabilité source
   * (projet/audit ajoutés s'ils ne sont pas encore référencés).
   *
   * @param id - Identifiant de la pratique.
   * @param projectId - Projet source optionnel.
   * @param auditId - Audit source optionnel.
   */
  incrementOccurrence(id: string, projectId?: string, auditId?: number): void {
    const existing = this.getById(id);
    if (existing === null) {
      return;
    }

    const sourceProjectIds =
      projectId !== undefined && !existing.sourceProjectIds.includes(projectId)
        ? [...existing.sourceProjectIds, projectId]
        : existing.sourceProjectIds;
    const sourceAuditIds =
      auditId !== undefined && !existing.sourceAuditIds.includes(auditId)
        ? [...existing.sourceAuditIds, auditId]
        : existing.sourceAuditIds;

    this.db
      .prepare(
        `UPDATE best_practices
         SET occurrence_count = occurrence_count + 1,
             source_project_ids = ?,
             source_audit_ids = ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .run(
        JSON.stringify(sourceProjectIds),
        JSON.stringify(sourceAuditIds),
        new Date().toISOString(),
        id,
      );
  }

  /**
   * Lie une bonne pratique à un finding (titre normalisé + dimension).
   *
   * Idempotent : un doublon sur la clé composite est ignoré (`INSERT OR IGNORE`).
   *
   * @param bestPracticeId - Identifiant de la pratique.
   * @param findingTitle - Titre normalisé du finding.
   * @param dimension - Dimension du finding.
   * @param confidence - Confiance de l'association (défaut : 1).
   */
  linkToFinding(
    bestPracticeId: string,
    findingTitle: string,
    dimension: AnalysisDimension,
    confidence = 1.0,
  ): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO finding_best_practice
           (finding_title, dimension, best_practice_id, confidence, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(findingTitle, dimension, bestPracticeId, confidence, new Date().toISOString());
  }

  /**
   * Retire l'association finding ↔ bonne pratique.
   *
   * @param bestPracticeId - Identifiant de la pratique.
   * @param findingTitle - Titre normalisé du finding.
   * @param dimension - Dimension du finding.
   */
  unlinkFromFinding(
    bestPracticeId: string,
    findingTitle: string,
    dimension: AnalysisDimension,
  ): void {
    this.db
      .prepare(
        `DELETE FROM finding_best_practice
         WHERE best_practice_id = ? AND finding_title = ? AND dimension = ?`,
      )
      .run(bestPracticeId, findingTitle, dimension);
  }

  /**
   * Retrouve les bonnes pratiques liées à un finding, par confiance
   * décroissante (bidirectionnel ADR-035).
   *
   * @param findingTitle - Titre normalisé du finding.
   * @param dimension - Dimension du finding.
   * @returns Pratiques liées (liste vide si aucune).
   */
  findByFinding(findingTitle: string, dimension: AnalysisDimension): BestPractice[] {
    const rows = this.db
      .prepare(
        `SELECT bp.*
         FROM best_practices bp
         JOIN finding_best_practice fbp ON bp.id = fbp.best_practice_id
         WHERE fbp.finding_title = ? AND fbp.dimension = ?
         ORDER BY fbp.confidence DESC`,
      )
      .all(findingTitle, dimension) as Record<string, unknown>[];
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Retrouve les findings associés à une bonne pratique (sens inverse).
   *
   * @param bestPracticeId - Identifiant de la pratique.
   * @returns Liens trouvés (liste vide si aucun).
   */
  findLinkedFindings(bestPracticeId: string): FindingBestPracticeLink[] {
    const rows = this.db
      .prepare('SELECT * FROM finding_best_practice WHERE best_practice_id = ?')
      .all(bestPracticeId) as Record<string, unknown>[];
    return rows.map((row) => ({
      findingTitle: row.finding_title as string,
      dimension: row.dimension as AnalysisDimension,
      bestPracticeId: row.best_practice_id as string,
      confidence: row.confidence as number,
      createdAt: row.created_at as string,
    }));
  }

  /**
   * Compte les bonnes pratiques correspondant aux filtres (sans pagination).
   *
   * @param filters - Filtres optionnels.
   * @returns Nombre de pratiques.
   */
  count(filters: BestPracticeFilters = {}): number {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters.category !== undefined) {
      clauses.push('category = ?');
      params.push(filters.category);
    }
    if (filters.tag !== undefined) {
      clauses.push('tags LIKE ?');
      params.push(`%"${filters.tag}"%`);
    }
    if (filters.projectId !== undefined) {
      clauses.push('source_project_ids LIKE ?');
      params.push(`%"${filters.projectId}"%`);
    }
    if (filters.isManual !== undefined) {
      clauses.push('is_manual = ?');
      params.push(filters.isManual ? 1 : 0);
    }

    const query = `SELECT COUNT(*) AS count FROM best_practices${
      clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : ''
    }`;
    const row = this.db.prepare(query).get(...params) as { count: number };
    return row.count;
  }

  /** Mappe une ligne SQL vers le type {@link BestPractice} (JSON parsé). */
  private mapRow(row: Record<string, unknown>): BestPractice {
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      category: row.category as BestPractice['category'],
      tags: this.parseArray<string>(row.tags),
      sourceProjectIds: this.parseArray<string>(row.source_project_ids),
      sourceAuditIds: this.parseArray<number>(row.source_audit_ids),
      occurrenceCount: row.occurrence_count as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      isManual: (row.is_manual as number) === 1,
    };
  }

  /** Parse une colonne JSON en tableau, tolérant une valeur vide/corrompue. */
  private parseArray<T>(value: unknown): T[] {
    if (typeof value !== 'string' || value.length === 0) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
}
