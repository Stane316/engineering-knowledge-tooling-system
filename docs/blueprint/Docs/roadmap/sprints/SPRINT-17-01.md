# SPRINT-17-01 — Types, Migration, TemplateRepository et TemplateService

**Sprint :** 17-01 sur 17 (Sous-sprint 1/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ

---

## 1. Objectif du sous-sprint

Implémenter la couche de stockage et le service d'orchestration des templates :
- **Types** : Définir les interfaces TypeScript partagées
- **Migration** : Créer la table `project_templates`
- **TemplateRepository** : CRUD complet des templates
- **TemplateService** : Orchestrateur (création, listing, validation)

---

## 2. Prérequis

### 2.1 État du dépôt

```bash
# Vérifier que Sprint 16 est terminé
npm run verify

# Vérifier les modules requis
ls src/recommendations/ src/best-practices/
```

### 2.2 Documents à lire

- `SPRINT-17.md` (document parent)
- `src/storage/types.ts` (types existants)
- `src/storage/project-repository.ts` (pattern de repository)

---

## 3. Tâches détaillées

### 3.1 Définir les types partagés (2h)

**Fichier :** `src/templates/template.types.ts`

```typescript
/**
 * Types du module de templates de projets (Sprint 17).
 *
 * Les templates permettent d'initialiser rapidement des projets
 * avec une configuration prédéfinie (dimensions, bonnes practices, règles).
 */

import type { AnalysisDimension } from '../analysis/types.js';

/**
 * Catégories de templates prédéfinis.
 */
export type TemplateCategory =
  | 'e-commerce'
  | 'saas'
  | 'blog'
  | 'portfolio'
  | 'corporate'
  | 'landing'
  | 'documentation'
  | 'marketplace'
  | 'news'
  | 'agency'
  | 'custom';

/**
 * Configuration d'un template (JSON).
 */
export interface TemplateConfig {
  /** Dimensions prioritaires (ordre d'importance). */
  priorityDimensions?: AnalysisDimension[];
  /** Seuils d'alerte. */
  alertThresholds?: {
    regressionPoints?: number;
    minScore?: number;
  };
  /** Configuration de l'extracteur de bonnes practices. */
  extractionCriteria?: {
    minOccurrences?: number;
    minAudits?: number;
    minConfidence?: number;
  };
  /** Configuration du moteur de recommandations. */
  recommendationOptions?: {
    maxRecommendations?: number;
    minRelevanceScore?: number;
  };
  /** Tags pour le filtrage. */
  tags?: string[];
  /** Auteur du template. */
  author?: string;
  /** Version du template. */
  version?: string;
}

/**
 * Template de projet.
 */
export interface ProjectTemplate {
  /** Identifiant UUID. */
  id: string;
  /** Nom du template. */
  name: string;
  /** Description détaillée. */
  description: string;
  /** Catégorie du template. */
  category: TemplateCategory;
  /** Configuration du projet (JSON). */
  config: TemplateConfig;
  /** IDs des bonnes practices associées. */
  bestPracticeIds: string[];
  /** IDs des règles de recommandation associées. */
  recommendationRuleIds: string[];
  /** true si template prédéfini (immuable). */
  isBuiltin: boolean;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de dernière mise à jour (ISO 8601). */
  updatedAt: string;
}

/**
 * Entrée pour créer un template.
 */
export interface CreateTemplateInput {
  name: string;
  description: string;
  category: TemplateCategory;
  config?: TemplateConfig;
  bestPracticeIds?: string[];
  recommendationRuleIds?: string[];
}

/**
 * Entrée pour mettre à jour un template.
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  config?: TemplateConfig;
  bestPracticeIds?: string[];
  recommendationRuleIds?: string[];
}

/**
 * Filtres pour lister les templates.
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  isBuiltin?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Overrides pour personnaliser l'application d'un template.
 */
export interface TemplateOverrides {
  /** Nom du projet (remplace le nom du template). */
  projectName?: string;
  /** URL du projet. */
  projectUrl?: string;
  /** Description du projet. */
  projectDescription?: string;
  /** Configuration à merger. */
  config?: Partial<TemplateConfig>;
  /** IDs de bonnes practices à ajouter. */
  additionalBestPracticeIds?: string[];
  /** IDs de règles à ajouter. */
  additionalRuleIds?: string[];
}

/**
 * Entrée pour créer un projet depuis un template.
 */
export interface ApplyTemplateInput {
  /** ID du template à appliquer. */
  templateId: string;
  /** Nom du projet. */
  projectName: string;
  /** URL du projet. */
  projectUrl: string;
  /** Description du projet. */
  projectDescription?: string;
  /** Overrides optionnels. */
  overrides?: TemplateOverrides;
}

/**
 * Résultat de l'application d'un template.
 */
export interface ApplyTemplateResult {
  /** ID du projet créé. */
  projectId: string;
  /** Nom du projet. */
  projectName: string;
  /** ID du template appliqué. */
  templateId: string;
  /** Nombre de bonnes practices associées. */
  bestPracticesAssociated: number;
  /** Nombre de règles créées. */
  rulesCreated: number;
  /** Durée d'application (ms). */
  durationMs: number;
}

/**
 * Format d'export JSON d'un template.
 */
export interface TemplateExport {
  version: string;
  exportedAt: string;
  template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>;
}

/**
 * Résultat de validation d'un template.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Critères d'acceptation :**
- Tous les types exportés et documentés
- Cohérence avec `AnalysisDimension` existant
- Types pour CRUD, application, export/import, validation

---

### 3.2 Créer la migration 008 (2h)

**Fichier :** `src/storage/migrations/008_create_templates.ts`

```typescript
import type { Database } from 'better-sqlite3';

/**
 * Migration 008 : Table des templates de projets (Sprint 17).
 */
export function migration008CreateTemplates(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      best_practice_ids TEXT NOT NULL DEFAULT '[]',
      recommendation_rule_ids TEXT NOT NULL DEFAULT '[]',
      is_builtin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_project_templates_category
    ON project_templates(category)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_project_templates_builtin
    ON project_templates(is_builtin)
  `);
}
```

**Mettre à jour `src/storage/migrations/migration-registry.ts`** :
```typescript
import { migration008CreateTemplates } from './008_create_templates.js';
// Ajouter : { version: 8, name: 'create_templates', up: migration008CreateTemplates }
```

---

### 3.3 Implémenter TemplateRepository (5h)

**Fichier :** `src/templates/template-repository.ts`

```typescript
import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import type {
  CreateTemplateInput,
  ProjectTemplate,
  TemplateExport,
  TemplateFilters,
  UpdateTemplateInput,
} from './template.types.js';

/**
 * Repository pour les templates de projets (Sprint 17).
 */
export class TemplateRepository {
  constructor(private readonly db: Database.Database) {}

  create(input: CreateTemplateInput, isBuiltin = false): ProjectTemplate {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO project_templates (
        id, name, description, category, config,
        best_practice_ids, recommendation_rule_ids,
        is_builtin, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.description,
      input.category,
      JSON.stringify(input.config ?? {}),
      JSON.stringify(input.bestPracticeIds ?? []),
      JSON.stringify(input.recommendationRuleIds ?? []),
      isBuiltin ? 1 : 0,
      now,
      now,
    );

    return this.getById(id)!;
  }

  getById(id: string): ProjectTemplate | null {
    const row = this.db.prepare('SELECT * FROM project_templates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : null;
  }

  list(filters: TemplateFilters = {}): ProjectTemplate[] {
    let query = 'SELECT * FROM project_templates WHERE 1=1';
    const params: unknown[] = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.isBuiltin !== undefined) {
      query += ' AND is_builtin = ?';
      params.push(filters.isBuiltin ? 1 : 0);
    }

    query += ' ORDER BY is_builtin DESC, name ASC';

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return (this.db.prepare(query).all(...params) as Record<string, unknown>[]).map(r => this.mapRow(r));
  }

  update(id: string, input: UpdateTemplateInput): ProjectTemplate {
    const existing = this.getById(id);
    if (!existing) throw new Error(`Template ${id} not found`);
    if (existing.isBuiltin) throw new Error(`Cannot modify builtin template: ${existing.name}`);

    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); params.push(input.name); }
    if (input.description !== undefined) { fields.push('description = ?'); params.push(input.description); }
    if (input.category !== undefined) { fields.push('category = ?'); params.push(input.category); }
    if (input.config !== undefined) { fields.push('config = ?'); params.push(JSON.stringify(input.config)); }
    if (input.bestPracticeIds !== undefined) { fields.push('best_practice_ids = ?'); params.push(JSON.stringify(input.bestPracticeIds)); }
    if (input.recommendationRuleIds !== undefined) { fields.push('recommendation_rule_ids = ?'); params.push(JSON.stringify(input.recommendationRuleIds)); }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id);

    this.db.prepare(`UPDATE project_templates SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.getById(id)!;
  }

  delete(id: string): void {
    const existing = this.getById(id);
    if (!existing) throw new Error(`Template ${id} not found`);
    if (existing.isBuiltin) throw new Error(`Cannot delete builtin template: ${existing.name}`);
    this.db.prepare('DELETE FROM project_templates WHERE id = ?').run(id);
  }

  exportToJson(id: string): string {
    const template = this.getById(id);
    if (!template) throw new Error(`Template ${id} not found`);

    const exportData: TemplateExport = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      template: {
        name: template.name,
        description: template.description,
        category: template.category,
        config: template.config,
        bestPracticeIds: template.bestPracticeIds,
        recommendationRuleIds: template.recommendationRuleIds,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  importFromJson(json: string): ProjectTemplate {
    const data = JSON.parse(json) as TemplateExport;

    if (!data.version || !data.template) {
      throw new Error('Invalid template export format');
    }

    return this.create({
      name: data.template.name,
      description: data.template.description,
      category: data.template.category,
      config: data.template.config,
      bestPracticeIds: data.template.bestPracticeIds,
      recommendationRuleIds: data.template.recommendationRuleIds,
    });
  }

  count(filters?: TemplateFilters): number {
    let query = 'SELECT COUNT(*) as count FROM project_templates WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.category) { query += ' AND category = ?'; params.push(filters.category); }
    if (filters?.isBuiltin !== undefined) { query += ' AND is_builtin = ?'; params.push(filters.isBuiltin ? 1 : 0); }

    return (this.db.prepare(query).get(...params) as { count: number }).count;
  }

  private mapRow(row: Record<string, unknown>): ProjectTemplate {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      category: row.category as ProjectTemplate['category'],
      config: JSON.parse(row.config as string),
      bestPracticeIds: JSON.parse(row.best_practice_ids as string) as string[],
      recommendationRuleIds: JSON.parse(row.recommendation_rule_ids as string) as string[],
      isBuiltin: (row.is_builtin as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
```

**Critères d'acceptation :**
- CRUD complet
- Protection des templates builtin (update/delete throw)
- Export/Import JSON fonctionnel
- Filtres (category, isBuiltin)

---

### 3.4 Implémenter TemplateService (4h)

**Fichier :** `src/templates/template-service.ts`

```typescript
import type { Database } from 'better-sqlite3';
import type { ProjectRepository } from '../storage/project-repository.js';

import type {
  ApplyTemplateInput,
  ApplyTemplateResult,
  CreateTemplateInput,
  ProjectTemplate,
  TemplateFilters,
  UpdateTemplateInput,
  ValidationResult,
} from './template.types.js';
import { TemplateApplier } from './template-applier.js';
import { TemplateRepository } from './template-repository.js';

/**
 * Orchestrateur des templates (Sprint 17).
 */
export class TemplateService {
  private repo: TemplateRepository;
  private applier: TemplateApplier;

  constructor(
    private readonly db: Database.Database,
    projectRepo: ProjectRepository,
  ) {
    this.repo = new TemplateRepository(db);
    this.applier = new TemplateApplier(db, projectRepo);
  }

  createTemplate(input: CreateTemplateInput): ProjectTemplate {
    return this.repo.create(input);
  }

  getTemplate(id: string): ProjectTemplate | null {
    return this.repo.getById(id);
  }

  listTemplates(filters?: TemplateFilters): ProjectTemplate[] {
    return this.repo.list(filters);
  }

  updateTemplate(id: string, input: UpdateTemplateInput): ProjectTemplate {
    return this.repo.update(id, input);
  }

  deleteTemplate(id: string): void {
    this.repo.delete(id);
  }

  applyTemplate(input: ApplyTemplateInput): ApplyTemplateResult {
    const template = this.repo.getById(input.templateId);
    if (!template) {
      throw new Error(`Template not found: ${input.templateId}`);
    }

    return this.applier.apply(template, input);
  }

  validateTemplate(id: string): ValidationResult {
    const template = this.repo.getById(id);
    if (!template) {
      return { valid: false, errors: ['Template not found'], warnings: [] };
    }

    return this.applier.validate(template);
  }

  exportTemplate(id: string): string {
    return this.repo.exportToJson(id);
  }

  importTemplate(json: string): ProjectTemplate {
    return this.repo.importFromJson(json);
  }

  countTemplates(filters?: TemplateFilters): number {
    return this.repo.count(filters);
  }
}
```

---

### 3.5 Tests unitaires TemplateRepository (4h)

**Fichier :** `tests/templates/template-repository.test.ts`

Tests CRUD, protection builtin, export/import, filtres, pagination.

---

### 3.6 Tests unitaires TemplateService (3h)

**Fichier :** `tests/templates/template-service.test.ts`

Tests orchestration, validation, application.

---

## 4. Vérifications finales

```bash
npm run typecheck
npm run lint
npm test -- tests/templates/
npm run coverage -- tests/templates/
npm run verify
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-17-01-RESULTAT.md` :

```markdown
# Rapport Sprint 17-01

**Date :** [DATE] | **Statut :** ✅ TERMINÉ

## Fichiers créés
- `src/templates/template.types.ts`
- `src/templates/template-repository.ts`
- `src/templates/template-service.ts`
- `src/storage/migrations/008_create_templates.ts`
- `tests/templates/template-repository.test.ts`
- `tests/templates/template-service.test.ts`

## Modifications
- `src/storage/migrations/migration-registry.ts`

## Tests : X tests ✅ | Couverture : Z%
## Prochaine étape : Sprint 17-02 (Templates prédéfinis + Applier)
```

---

## 6. Critères de validation

- ✅ Types définis dans `template.types.ts`
- ✅ Migration 008 créée
- ✅ Registre de migrations mis à jour
- ✅ `TemplateRepository` implémenté (CRUD + protection builtin + export/import)
- ✅ `TemplateService` implémenté (orchestrateur)
- ✅ Tests unitaires complets
- ✅ Couverture > 80%
- ✅ `npm run verify` passe
- ✅ Rapport rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 17-01 du projet EKTS**  
**Statut : ✅ Sprint 17-01 implémenté et validé**
