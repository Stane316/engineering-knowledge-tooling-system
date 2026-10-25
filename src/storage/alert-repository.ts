import type Database from 'better-sqlite3';

import { ValidationError } from '../shared/errors.js';
import type { Alert, AlertFilters, CreateAlertInput } from './types.js';

/** Dimensions acceptées dans les alertes (score global inclus). */
const ALERT_DIMENSIONS: ReadonlySet<string> = new Set([
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
  'overall',
]);

/** Projection SQL colonnes → champs `Alert` (ordre explicite, `SELECT *` évité). */
interface AlertRow {
  id: string;
  project_id: string;
  audit_id_from: number;
  audit_id_to: number;
  dimension: string;
  score_before: number;
  score_after: number;
  regression_points: number;
  created_at: string;
  resolved_at: string | null;
}

/**
 * Repository des alertes de régression (Sprint 14, table `alerts`).
 *
 * API synchrone (better-sqlite3), comme les autres repositories du projet.
 */
export class AlertRepository {
  /**
   * @param db - Connexion ouverte, schéma `alerts` créé par la migration 004.
   */
  constructor(private readonly db: Database.Database) {}

  /**
   * Crée une alerte (UUIDv4, horodatage courant).
   *
   * @param input - Champs hors `id`/`createdAt`/`resolvedAt`.
   * @returns L'alerte persistée.
   * @throws {ValidationError} Dimensions/scores invalides.
   */
  create(input: CreateAlertInput): Alert {
    this.validate(input);

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO alerts (
           id, project_id, audit_id_from, audit_id_to, dimension,
           score_before, score_after, regression_points, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.projectId,
        input.auditIdFrom,
        input.auditIdTo,
        input.dimension,
        input.scoreBefore,
        input.scoreAfter,
        input.regressionPoints,
        createdAt,
      );

    return {
      id,
      projectId: input.projectId,
      auditIdFrom: input.auditIdFrom,
      auditIdTo: input.auditIdTo,
      dimension: input.dimension,
      scoreBefore: input.scoreBefore,
      scoreAfter: input.scoreAfter,
      regressionPoints: input.regressionPoints,
      createdAt,
      resolvedAt: null,
    };
  }

  /**
   * Lit une alerte par identifiant.
   *
   * @param id - Identifiant UUID.
   * @returns L'alerte, ou `null` si absente.
   */
  getById(id: string): Alert | null {
    const row = this.db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as
      AlertRow | undefined;
    return row === undefined ? null : mapRow(row);
  }

  /**
   * Liste les alertes filtrées (créées d'abord, `created_at DESC`).
   *
   * @param filters - `projectId`, `resolved`, `dimension`, `limit` (≥ 1).
   * @returns Alertes correspondantes.
   * @throws {ValidationError} `limit` ou `dimension` invalide.
   */
  list(filters: AlertFilters = {}): Alert[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    if (filters.projectId !== undefined) {
      clauses.push('project_id = ?');
      params.push(filters.projectId);
    }
    if (filters.resolved === true) {
      clauses.push('resolved_at IS NOT NULL');
    } else if (filters.resolved === false) {
      clauses.push('resolved_at IS NULL');
    }
    if (filters.dimension !== undefined) {
      if (!ALERT_DIMENSIONS.has(filters.dimension)) {
        throw new ValidationError([`dimension d'alerte invalide : ${filters.dimension}`]);
      }
      clauses.push('dimension = ?');
      params.push(filters.dimension);
    }
    if (filters.limit !== undefined) {
      if (!Number.isInteger(filters.limit) || filters.limit < 1) {
        throw new ValidationError([`limit invalide (${String(filters.limit)})`]);
      }
      clauses.push('LIMIT ?');
      params.push(filters.limit);
    }

    const where = clauses.filter((clause) => !clause.startsWith('LIMIT')).join(' AND ');
    const limitClause = clauses.find((clause) => clause.startsWith('LIMIT')) ?? '';
    const sql = `SELECT * FROM alerts${where === '' ? '' : ` WHERE ${where}`}
      ORDER BY created_at DESC, rowid DESC ${limitClause}`;

    return (this.db.prepare(sql).all(...params) as AlertRow[]).map(mapRow);
  }

  /**
   * Signale une alerte résolue (horodatage courant).
   *
   * @param id - Identifiant de l'alerte.
   * @throws {ValidationError} Alerte déjà résolue.
   */
  markAsResolved(id: string): void {
    const existing = this.getById(id);
    if (existing === null) {
      throw new ValidationError([`alerte introuvable : ${id}`]);
    }
    if (existing.resolvedAt !== null) {
      throw new ValidationError([`alerte déjà résolue : ${id}`]);
    }
    this.db
      .prepare('UPDATE alerts SET resolved_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id);
  }

  /**
   * Supprime définitivement une alerte.
   *
   * @param id - Identifiant de l'alerte.
   * @returns `true` si une ligne a été supprimée.
   */
  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Compte les alertes actives d'un projet (utilisé en contrôles).
   *
   * @param projectId - Projet (UUID).
   * @returns Nombre d'alertes non résolues.
   */
  countActive(projectId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS total FROM alerts WHERE project_id = ? AND resolved_at IS NULL')
      .get(projectId) as { total: number };
    return row.total;
  }

  /** Valide une entrée de création (dimension, scores, entiers). */
  private validate(input: CreateAlertInput): void {
    const issues: string[] = [];
    if (!ALERT_DIMENSIONS.has(input.dimension)) {
      issues.push(`dimension invalide : ${String(input.dimension)}`);
    }
    for (const [name, value] of [
      ['scoreBefore', input.scoreBefore],
      ['scoreAfter', input.scoreAfter],
    ] as const) {
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        issues.push(`${name} hors 0-100 (${String(value)})`);
      }
    }
    if (!Number.isInteger(input.regressionPoints) || input.regressionPoints <= 0) {
      issues.push(`regressionPoints invalide (${String(input.regressionPoints)})`);
    }
    if (!Number.isInteger(input.auditIdFrom) || input.auditIdFrom < 1) {
      issues.push(`auditIdFrom invalide (${String(input.auditIdFrom)})`);
    }
    if (!Number.isInteger(input.auditIdTo) || input.auditIdTo < 1) {
      issues.push(`auditIdTo invalide (${String(input.auditIdTo)})`);
    }
    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
  }
}

/** Convertit une ligne SQL en `Alert`. */
function mapRow(row: AlertRow): Alert {
  return {
    id: row.id,
    projectId: row.project_id,
    auditIdFrom: row.audit_id_from,
    auditIdTo: row.audit_id_to,
    dimension: row.dimension as Alert['dimension'],
    scoreBefore: row.score_before,
    scoreAfter: row.score_after,
    regressionPoints: row.regression_points,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}
