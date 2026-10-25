import type Database from 'better-sqlite3';

import { ProjectRepository } from '../data/repositories/project-repository.js';
import { ProjectNotFoundError } from '../shared/errors.js';
import {
  CreateProjectSchema,
  ProjectFiltersSchema,
  UpdateProjectSchema,
  type CreateProjectInput,
  type Project,
  type ProjectFilters,
} from '../shared/validators.js';
import { parseInput } from './knowledge-manager.js';
import type { IProjectManager, UpdateProjectData } from './project-manager.types.js';

/**
 * Project Manager — logique métier des projets (Sprint 13).
 *
 * Rôle : opérations typées et validées au-dessus de `ProjectRepository`,
 * avec les mêmes erreurs métier que le domaine ressources
 * (`ProjectNotFoundError` → code CLI 3, `ValidationError` → code 4).
 */
export class ProjectManager implements IProjectManager {
  constructor(private readonly repository: ProjectRepository) {}

  /** Crée un projet validé (name obligatoire, status active par défaut). */
  async createProject(input: CreateProjectInput): Promise<Project> {
    return this.repository.create(parseInput(CreateProjectSchema, input));
  }

  /** Projet par identifiant, ou `null`. */
  async getProject(id: string): Promise<Project | null> {
    return this.repository.getById(id);
  }

  /** Variante stricte : lève `ProjectNotFoundError` si absent. */
  async getProjectOrThrow(id: string): Promise<Project> {
    const project = this.repository.getById(id);

    if (project === null) {
      throw new ProjectNotFoundError(id);
    }

    return project;
  }

  /** Liste filtrée (status, pagination). */
  async listProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    return this.repository.list(parseInput(ProjectFiltersSchema, filters));
  }

  /** Mise à jour partielle ; `ProjectNotFoundError` si absent. */
  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const values = parseInput(UpdateProjectSchema, data);
    const updated = this.repository.update(id, values);

    if (updated === null) {
      throw new ProjectNotFoundError(id);
    }

    return updated;
  }

  /**
   * Supprime un projet (`ProjectNotFoundError` si absent).
   *
   * Les audits et ressources associés sont conservés : la clé étrangère
   * `ON DELETE SET NULL` repasse leur `project_id` à `NULL`.
   */
  async deleteProject(id: string): Promise<void> {
    await this.getProjectOrThrow(id);
    this.repository.delete(id);
  }

  /** Nombre de projets correspondant aux filtres. */
  async countProjects(filters: ProjectFilters = {}): Promise<number> {
    return this.repository.count(parseInput(ProjectFiltersSchema, filters));
  }
}

/** Construit le manager sur une connexion existante (CLI, MCP, tests). */
export function createProjectManager(connection: Database.Database): {
  manager: ProjectManager;
  repository: ProjectRepository;
} {
  const repository = new ProjectRepository(connection);
  return { manager: new ProjectManager(repository), repository };
}
