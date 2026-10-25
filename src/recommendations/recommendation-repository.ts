import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import type { AnalysisDimension, Priority, Severity } from '../analysis/types.js';
import { ValidationError } from '../shared/errors.js';

import type {
  CreateRecommendationRuleInput,
  Recommendation,
  RecommendationRule,
  RecommendationRuleFilters,
  UpdateRecommendationRuleInput,
} from './recommendation.types.js';

/** Ligne brute `recommendation_rules`. */
type RuleRow = Record<string, unknown>;

/** Ligne brute `generated_recommendations`. */
type RecommendationRow = Record<string, unknown>;

/**
 * Repository des règles de recommandation et des recommandations générées
 * (Sprint 16-01).
 *
 * Fournit (SPRINT-16-01.md §3.3) :
 * - CRUD complet des règles (`recommendation_rules`) avec filtres et
 *   pagination ;
 * - sauvegarde, lecture, comptage et purge (`clearRecommendations`) des
 *   recommandations générées (`generated_recommendations`).
 *
 * Méthodes **synchrones** (better-sqlite3, convention du dépôt — écart P3
 * avec les `Promise` du spec signalé dans les types).
 *
 * @throws {ValidationError} Règle introuvable (update/delete) ou illisible.
 */
export class RecommendationRepository {
  constructor(private readonly db: Database.Database) {}

  // --- Règles ---

  /**
   * Créer une règle de recommandation (`isActive` forcé à `true`,
   * défauts effort/impact/priority : 3 / 3 / `medium`).
   */
  createRule(input: CreateRecommendationRuleInput): RecommendationRule {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO recommendation_rules (
           id, name, description, dimension, severity_threshold,
           pattern, recommendation_title, recommendation_description,
           effort, impact, priority, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      )
      .run(
        id,
        input.name,
        input.description,
        input.dimension,
        input.severityThreshold,
        input.pattern,
        input.recommendationTitle,
        input.recommendationDescription,
        input.effort ?? 3,
        input.impact ?? 3,
        input.priority ?? 'medium',
        now,
        now,
      );

    const created = this.getRuleById(id);
    if (created === null) {
      throw new ValidationError([`règle ${id} illisible après création`]);
    }
    return created;
  }

  /**
   * Récupérer une règle par ID (`null` si absente).
   */
  getRuleById(id: string): RecommendationRule | null {
    const row = this.db.prepare('SELECT * FROM recommendation_rules WHERE id = ?').get(id) as
      RuleRow | undefined;
    return row === undefined ? null : mapRuleRow(row);
  }

  /**
   * Lister les règles avec filtres (dimension, actif, priorité) et
   * pagination (`limit` défaut 100, `offset` défaut 0), tri
   * `created_at DESC`.
   */
  listRules(filters: RecommendationRuleFilters = {}): RecommendationRule[] {
    const clauses: string[] = ['1 = 1'];
    const params: unknown[] = [];

    if (filters.dimension !== undefined) {
      clauses.push('dimension = ?');
      params.push(filters.dimension);
    }
    if (filters.isActive !== undefined) {
      clauses.push('is_active = ?');
      params.push(filters.isActive ? 1 : 0);
    }
    if (filters.priority !== undefined) {
      clauses.push('priority = ?');
      params.push(filters.priority);
    }

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;
    const query = `SELECT * FROM recommendation_rules WHERE ${clauses.join(' AND ')}
      ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = this.db.prepare(query).all(...params) as RuleRow[];
    return rows.map((row) => mapRuleRow(row));
  }

  /**
   * Mettre à jour une règle (patch partiel, `updated_at` rafraîchi).
   *
   * @throws {ValidationError} Règle absente.
   */
  updateRule(id: string, input: UpdateRecommendationRuleInput): RecommendationRule {
    const existing = this.getRuleById(id);
    if (existing === null) {
      throw new ValidationError([`règle ${id} introuvable`]);
    }

    const assignments: string[] = [];
    const params: unknown[] = [];

    const patch = (column: string, value: unknown): void => {
      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        params.push(value);
      }
    };

    patch('name', input.name);
    patch('description', input.description);
    patch('dimension', input.dimension);
    patch('severity_threshold', input.severityThreshold);
    patch('pattern', input.pattern);
    patch('recommendation_title', input.recommendationTitle);
    patch('recommendation_description', input.recommendationDescription);
    patch('effort', input.effort);
    patch('impact', input.impact);
    patch('priority', input.priority);
    if (input.isActive !== undefined) {
      patch('is_active', input.isActive ? 1 : 0);
    }

    if (assignments.length === 0) {
      return existing;
    }

    assignments.push('updated_at = ?');
    params.push(new Date().toISOString(), id);
    this.db
      .prepare(`UPDATE recommendation_rules SET ${assignments.join(', ')} WHERE id = ?`)
      .run(...params);

    const updated = this.getRuleById(id);
    if (updated === null) {
      throw new ValidationError([`règle ${id} illisible après mise à jour`]);
    }
    return updated;
  }

  /**
   * Supprimer une règle. Les recommandations produites sont conservées
   * (`rule_id` passe à `NULL` via `ON DELETE SET NULL`, migration 006).
   *
   * @throws {ValidationError} Règle absente.
   */
  deleteRule(id: string): void {
    const result = this.db.prepare('DELETE FROM recommendation_rules WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new ValidationError([`règle ${id} introuvable`]);
    }
  }

  /**
   * Compter les règles (filtres dimension/actif).
   */
  countRules(filters: RecommendationRuleFilters = {}): number {
    const clauses: string[] = ['1 = 1'];
    const params: unknown[] = [];

    if (filters.dimension !== undefined) {
      clauses.push('dimension = ?');
      params.push(filters.dimension);
    }
    if (filters.isActive !== undefined) {
      clauses.push('is_active = ?');
      params.push(filters.isActive ? 1 : 0);
    }

    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM recommendation_rules WHERE ${clauses.join(' AND ')}`)
      .get(...params) as { count: number };
    return row.count;
  }

  // --- Recommandations générées ---

  /**
   * Sauvegarder une recommandation générée (l'ID est généré ici).
   */
  saveRecommendation(recommendation: Omit<Recommendation, 'id'>): Recommendation {
    const id = randomUUID();

    this.db
      .prepare(
        `INSERT INTO generated_recommendations (
           id, project_id, rule_id, finding_title,
           recommendation_title, recommendation_description,
           dimension, relevance_score, effort, impact, priority, generated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        recommendation.projectId,
        recommendation.ruleId,
        recommendation.findingTitle,
        recommendation.recommendationTitle,
        recommendation.recommendationDescription,
        recommendation.dimension,
        recommendation.relevanceScore,
        recommendation.effort,
        recommendation.impact,
        recommendation.priority,
        recommendation.generatedAt,
      );

    return { id, ...recommendation };
  }

  /**
   * Récupérer les recommandations d'un projet, triées par pertinence
   * décroissante puis `generated_at DESC` (défaut 20).
   */
  getRecommendations(projectId: string, limit = 20): Recommendation[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM generated_recommendations
         WHERE project_id = ?
         ORDER BY relevance_score DESC, generated_at DESC
         LIMIT ?`,
      )
      .all(projectId, limit) as RecommendationRow[];
    return rows.map((row) => mapRecommendationRow(row));
  }

  /**
   * Purger les recommandations d'un projet (avant régénération — le moteur
   * régénère à chaque appel, critère d'idempotence).
   */
  clearRecommendations(projectId: string): void {
    this.db.prepare('DELETE FROM generated_recommendations WHERE project_id = ?').run(projectId);
  }

  /**
   * Compter les recommandations stockées d'un projet.
   */
  countRecommendations(projectId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS count FROM generated_recommendations WHERE project_id = ?')
      .get(projectId) as { count: number };
    return row.count;
  }
}

// --- Mapping snake_case BD → camelCase domaine ---

function mapRuleRow(row: RuleRow): RecommendationRule {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    dimension: row.dimension as RecommendationRule['dimension'],
    severityThreshold: row.severity_threshold as Severity,
    pattern: row.pattern as string,
    recommendationTitle: row.recommendation_title as string,
    recommendationDescription: row.recommendation_description as string,
    effort: row.effort as number,
    impact: row.impact as number,
    priority: row.priority as Priority,
    isActive: (row.is_active as number) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRecommendationRow(row: RecommendationRow): Recommendation {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    ruleId: (row.rule_id as string | null) ?? null,
    findingTitle: (row.finding_title as string | null) ?? null,
    recommendationTitle: row.recommendation_title as string,
    recommendationDescription: row.recommendation_description as string,
    dimension: row.dimension as AnalysisDimension | 'general',
    relevanceScore: row.relevance_score as number,
    effort: row.effort as number,
    impact: row.impact as number,
    priority: row.priority as Priority,
    generatedAt: row.generated_at as string,
  };
}
