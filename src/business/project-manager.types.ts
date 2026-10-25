import type {
  CreateProjectInput,
  Project,
  ProjectFilters,
  UpdateProjectInput,
} from '../shared/validators.js';

/** Entrée de `updateProject` : mise à jour partielle. */
export type UpdateProjectData = UpdateProjectInput;

/**
 * Contrat du Project Manager (Sprint 13 — multi-projets).
 *
 * Signatures asynchrones, comme `IKnowledgeManager`, pour rester stable si
 * une dépendance I/O apparaît ; l'implémentation actuelle est entièrement
 * synchrone (better-sqlite3) et validée par Zod.
 */
export interface IProjectManager {
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  getProjectOrThrow(id: string): Promise<Project>;
  listProjects(filters?: ProjectFilters): Promise<Project[]>;
  updateProject(id: string, data: UpdateProjectData): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  countProjects(filters?: ProjectFilters): Promise<number>;
}
