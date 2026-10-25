# Sprint 13-1 — Migration + ProjectRepository + ProjectManager

**Identifiant :** SPRINT-13-01  
**Parent :** SPRINT-13 (Gestion Multi-Projets)  
**Durée prévue :** 3 jours  
**Date de documentation :** 25 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif précis

**Implémenter l'infrastructure de données pour les projets :**

- Migration 003 : ajouter `project_id` sur `audit_metadata`
- `ProjectRepository` : CRUD complet pour les projets
- `ProjectManager` : logique métier, validation, orchestration
- Schéma Zod `ProjectSchema` : validation des entrées
- Tests unitaires et d'intégration

**Résultat concret attendu :**
- Migration exécutable sans erreur sur base existante
- CRUD ProjectRepository fonctionnel (create, getById, list, update, delete)
- ProjectManager valide les entrées et orchestre le CRUD
- Couverture tests > 80%

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Node.js 22+ | `node --version` | Installer Node.js 22 LTS |
| npm 10+ | `npm --version` | Installer npm 10+ |
| Git | `git --version` | Installer Git |
| `npm run verify` code 0 | `npm run verify` | Corriger erreurs avant de commencer |
| Table `projects` existe | Inspection migration 001 | Déjà créée au Sprint 2 |

---

## 3. Tâches atomiques

### Tâche 1.1 — Migration 003 : project_id sur audit_metadata

**Objectif :** Permettre l'association audit ↔ projet  
**Durée :** 2h  
**Fichiers :** `src/data/migrations/003_project_audits.ts`

**Actions :**

```typescript
// src/data/migrations/003_project_audits.ts
import type Database from 'better-sqlite3';

/**
 * Migration 003 — Association audits ↔ projets.
 *
 * Ajoute une colonne `project_id` nullable sur `audit_metadata`.
 * nullable : les audits existants (sans projet) restent valides.
 * ON DELETE SET NULL : si un projet est supprimé, ses audits sont conservés.
 */
export function migration003ProjectAudits(connection: Database.Database): void {
  // Vérifier si la colonne existe déjà (idempotent)
  const columns = connection
    .pragma("table_info('audit_metadata')")
    .map((c: { name: string }) => c.name);

  if (!columns.includes('project_id')) {
    connection.exec(`
      ALTER TABLE audit_metadata
      ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
    `);

    connection.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_metadata_project_id
      ON audit_metadata(project_id);
    `);
  }
}
```

**Intégrer dans `src/data/migrations/index.ts` :**

```typescript
// Ajouter à la liste des migrations
import { migration003ProjectAudits } from './003_project_audits.js';

const MIGRATIONS = [
  { version: 1, name: '001_init', fn: migration001Init },
  { version: 2, name: '002_embedding_space', fn: migration002EmbeddingSpace },
  { version: 3, name: '003_project_audits', fn: migration003ProjectAudits },
];
```

**Vérification :**
```bash
npm run build
# Vérifier que la compilation passe
```

**Critère d'acceptation :**
- C13.1.1 : Migration 003 exécutable sans erreur
- C13.1.2 : Idempotente (peut être relancée sans erreur)
- C13.1.3 : Les audits existants (sans project_id) restent accessibles

---

### Tâche 1.2 — Schéma Zod ProjectSchema

**Objectif :** Valider les entrées pour les projets  
**Durée :** 1h  
**Fichiers :** `src/shared/validators.ts` (ajout)

**Actions :**

```typescript
// Ajouter dans src/shared/validators.ts
import { z } from 'zod';

export const ProjectStatusSchema = z.enum(['active', 'completed', 'archived']);

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: ProjectStatusSchema.default('active'),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateProjectInputSchema = ProjectSchema.pick({
  name: true,
  description: true,
  status: true,
  startedAt: true,
  metadata: true,
});

export const UpdateProjectInputSchema = CreateProjectInputSchema.partial();

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;
```

**Vérification :**
```bash
npm run typecheck
```

**Critère d'acceptation :**
- C13.1.4 : Validation Zod fonctionnelle (name requis, status valide)

---

### Tâche 1.3 — ProjectRepository

**Objectif :** CRUD pour les projets dans SQLite  
**Durée :** 4h  
**Fichiers :** `src/data/repositories/project-repository.ts`

**Actions :**

```typescript
// src/data/repositories/project-repository.ts
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import type { CreateProjectInput, Project, UpdateProjectInput } from '../../shared/validators.js';

export interface ProjectListFilters {
  readonly status?: 'active' | 'completed' | 'archived';
  readonly limit?: number;
  readonly offset?: number;
}

export class ProjectRepository {
  constructor(private readonly db: Database.Database) {}

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

    this.db.prepare(`
      INSERT INTO projects (id, name, description, status, started_at, completed_at, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project.id,
      project.name,
      project.description,
      project.status,
      project.startedAt,
      project.completedAt,
      JSON.stringify(project.metadata),
      project.createdAt,
      project.updatedAt,
    );

    return project;
  }

  getById(id: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  list(filters: ProjectListFilters = {}): Project[] {
    let sql = 'SELECT * FROM projects';
    const params: unknown[] = [];

    if (filters.status) {
      sql += ' WHERE status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  update(id: string, input: UpdateProjectInput): Project | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: Project = {
      ...existing,
      ...input,
      updatedAt: now,
    };

    this.db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, status = ?, started_at = ?, completed_at = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.description ?? null,
      updated.status,
      updated.startedAt ?? null,
      updated.completedAt ?? null,
      JSON.stringify(updated.metadata),
      updated.updatedAt,
      id,
    );

    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  }

  count(filters: ProjectListFilters = {}): number {
    let sql = 'SELECT COUNT(*) as count FROM projects';
    const params: unknown[] = [];

    if (filters.status) {
      sql += ' WHERE status = ?';
      params.push(filters.status);
    }

    const row = this.db.prepare(sql).get(...params) as { count: number };
    return row.count;
  }

  private mapRow(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

**Vérification :**
```bash
npm run typecheck
npm test -- tests/data/project-repository.test.ts
```

**Critère d'acceptation :**
- C13.1.3 : CRUD fonctionnel (create, getById, list, update, delete)
- C13.1.5 : Pagination et filtres fonctionnels

---

### Tâche 1.4 — ProjectManager

**Objectif :** Logique métier et orchestration  
**Durée :** 3h  
**Fichiers :** `src/business/project-manager.ts`, `src/business/project-manager.types.ts`

**Actions :**

```typescript
// src/business/project-manager.types.ts
export interface IProjectManager {
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  listProjects(filters?: ProjectListFilters): Promise<Project[]>;
  updateProject(id: string, input: UpdateProjectInput): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
  countProjects(filters?: ProjectListFilters): Promise<number>;
}
```

```typescript
// src/business/project-manager.ts
import { CreateProjectInputSchema, UpdateProjectInputSchema, type CreateProjectInput, type Project, type UpdateProjectInput } from '../shared/validators.js';
import { ProjectRepository, type ProjectListFilters } from '../data/repositories/project-repository.js';
import type { IProjectManager } from './project-manager.types.js';

export class ProjectManager implements IProjectManager {
  constructor(private readonly repository: ProjectRepository) {}

  async createProject(input: CreateProjectInput): Promise<Project> {
    const validated = CreateProjectInputSchema.parse(input);
    return this.repository.create(validated);
  }

  async getProject(id: string): Promise<Project | null> {
    return this.repository.getById(id);
  }

  async listProjects(filters?: ProjectListFilters): Promise<Project[]> {
    return this.repository.list(filters);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const validated = UpdateProjectInputSchema.parse(input);
    return this.repository.update(id, validated);
  }

  async deleteProject(id: string): Promise<boolean> {
    // Les audits associés auront project_id = NULL (ON DELETE SET NULL)
    return this.repository.delete(id);
  }

  async countProjects(filters?: ProjectListFilters): Promise<number> {
    return this.repository.count(filters);
  }
}
```

**Vérification :**
```bash
npm run typecheck
npm test -- tests/integration/project-manager.test.ts
```

**Critère d'acceptation :**
- C13.1.5 : ProjectManager orchestre CRUD + validation
- C13.1.6 : Tests > 80% couverture

---

### Tâche 1.5 — Tests unitaires

**Objectif :** Couverture > 80%  
**Durée :** 3h  
**Fichiers :** `tests/data/project-repository.test.ts`, `tests/integration/project-manager.test.ts`

**Cas de test à couvrir :**

1. **ProjectRepository :**
   - create → retourne un projet avec UUID
   - getById → retourne le projet ou null
   - list → retourne tous les projets
   - list avec filtre status
   - list avec pagination (limit, offset)
   - update → modifie les champs
   - delete → supprime le projet
   - count → retourne le nombre correct

2. **ProjectManager :**
   - createProject → validation Zod (name requis, status valide)
   - createProject → données invalides lèvent ZodError
   - CRUD complet via manager
   - Suppression projet → audits associés ont project_id NULL

**Vérification :**
```bash
npm test -- tests/data/project-repository.test.ts
npm test -- tests/integration/project-manager.test.ts
npm run coverage
```

---

## 4. Résultats attendus

- ✅ Migration 003 exécutable et idempotente
- ✅ ProjectRepository CRUD fonctionnel
- ✅ ProjectManager avec validation Zod
- ✅ Tests > 80% couverture
- ✅ `npm run typecheck` passe
- ✅ `npm test` passe

---

## 5. Critères d'acceptation

- C13.1.1 : Migration 003 exécutable sans erreur sur base existante
- C13.1.2 : `project_id` nullable sur `audit_metadata` (rétrocompatible)
- C13.1.3 : CRUD ProjectRepository fonctionnel
- C13.1.4 : Validation Zod (name requis, status ∈ active/completed/archived)
- C13.1.5 : ProjectManager orchestre CRUD + validation
- C13.1.6 : Tests > 80% couverture

---

## 6. Procédure de compte rendu

À la fin du sous-sprint, documenter :
1. Fichiers créés/modifiés
2. Tests exécutés et résultats
3. Couverture mesurée
4. Écarts constatés
5. Commandes pour vérifier le travail

---

**Document rédigé le 25 octobre 2026 — Sprint 13-1**  
**Statut : ⏳ Prêt pour implémentation**
