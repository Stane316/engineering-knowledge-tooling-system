import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import {
  ProjectFiltersSchema,
  type CreateProjectInput,
  type Project,
  type ProjectFilters,
  type UpdateProjectInput,
} from '../../shared/validators.js';

/**
 * Repository des projets (table `projects`, Sprint 13).
 *
 * Style aligné sur `ResourceRepository` : requêtes préparées, ligne typée,
 * résultats validés par les schémas Zod partagés. `metadata` est sérialisé
 * en JSON (colonne `TEXT … CHECK (json_valid(metadata))`).
 */

/** Ligne brute telle que stockée dans `projects`. */
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export class ProjectRepository {
  private readonly insert: Database.Statement;
  private readonly updateStatement: Database.Statement;
  private readonly deleteStatement: Database.Statement;

  constructor(private readonly connection: Database.Database) {
    this.insert = connection.prepare(`
      INSERT INTO projects
        (id, name, description, status, started_at, completed_at, metadata, created_at, updated_at)
      VALUES
        (@id, @name, @description, @status, @startedAt, @completedAt, @metadata, @createdAt, @updatedAt)
    `);
    this.updateStatement = connection.prepare(`
      UPDATE projects
         SET name = @name,
             description = @description,
             status = @status,
             started_at = @startedAt,
             completed_at = @completedAt,
             metadata = @metadata,
             updated_at = @updatedAt
       WHERE id = @id
    `);
    this.deleteStatement = connection.prepare('DELETE FROM projects WHERE id = ?');
  }

  /** Crée un projet (UUID généré, horodatage courant). */
  create(input: CreateProjectInput): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? 'active',
      startedAt: input.startedAt ?? null,
      completedAt: input.completedAt ?? null,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    const row = toProjectRow(project);
    this.insert.run(row);

    return project;
  }

  /** Projet par identifiant, ou `null`. */
  getById(id: string): Project | null {
    const row = this.connection.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      ProjectRow | undefined;
    return row === undefined ? null : toProject(row);
  }

  /** Liste filtrée et paginée (ordre : création décroissante, puis id). */
  list(filters: ProjectFilters = {}): Project[] {
    const values = ProjectFiltersSchema.parse(filters);
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (values.status !== undefined) {
      conditions.push('status = @status');
      params.status = values.status;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `SELECT * FROM projects ${where} ORDER BY created_at DESC, rowid DESC`;

    if (values.limit !== undefined) {
      params.limit = values.limit;
      sql += ' LIMIT @limit';
    }
    if (values.offset !== undefined) {
      params.offset = values.offset;
      sql += ' OFFSET @offset';
    }

    const rows = this.connection.prepare(sql).all(params) as ProjectRow[];
    return rows.map(toProject);
  }

  /** Met à jour les champs fournis ; `null` si le projet n'existe pas. */
  update(id: string, input: UpdateProjectInput): Project | null {
    const existing = this.getById(id);
    if (existing === null) {
      return null;
    }

    const merged: Project = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startedAt !== undefined ? { startedAt: input.startedAt ?? null } : {}),
      ...(input.completedAt !== undefined ? { completedAt: input.completedAt ?? null } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.updateStatement.run(toProjectRow(merged));
    return merged;
  }

  /** Supprime le projet ; `false` si l'identifiant est inconnu. */
  delete(id: string): boolean {
    return this.deleteStatement.run(id).changes > 0;
  }

  /** Nombre de projets correspondant aux filtres. */
  count(filters: ProjectFilters = {}): number {
    const values = ProjectFiltersSchema.parse(filters);
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (values.status !== undefined) {
      conditions.push('status = @status');
      params.status = values.status;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const row = this.connection
      .prepare(`SELECT COUNT(*) AS count FROM projects ${where}`)
      .get(params) as { count: number };
    return row.count;
  }
}

/** Paramètres nommés des statements (`@startedAt`, `@createdAt`, …). */
interface ProjectInsertParams {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  metadata: string;
  createdAt: string;
  updatedAt: string;
}

/** Sérialisation objet → paramètres SQL (metadata en JSON). */
function toProjectRow(project: Project): ProjectInsertParams {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startedAt: project.startedAt,
    completedAt: project.completedAt,
    metadata: JSON.stringify(project.metadata),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

/** Lecture ligne SQL → objet `Project` (metadata JSON → objet). */
function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as Project['status'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
