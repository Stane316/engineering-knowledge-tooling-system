# Sprint 2-3 — Validation Zod + documentation

**Identifiant :** SPRINT-02-03  
**Parent :** SPRINT-02 (Data Layer)  
**Durée prévue :** 2 jours  
**Date de documentation :** 21 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ  
**Dépend de :** SPRINT-02-02 (Repository Resource) ⏳

---

## 1. Objectif précis

**Implémenter la validation Zod pour les ressources et créer la documentation Data Layer complète.**

**Résultat concret attendu :**
- Schémas Zod pour Resource (create, update)
- Validation runtime intégrée au Repository
- Tests validation Zod
- Documentation DATA_LAYER.md complète
- Tous tests Sprint 2 passent

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Sprint 2-1 terminé | 3 bases créées | Retourner Sprint 2-1 |
| Sprint 2-2 terminé | Repository CRUD | Retourner Sprint 2-2 |
| zod installé | `npm ls zod` | `npm install zod` |

**Si prérequis manquant :** Documenter et compléter avant de continuer.

---

## 3. Tâches atomiques

### Tâche 2.6 — Validation Zod (Resource schema)

**Objectif :** Créer schémas Zod et intégrer validation au Repository  
**Durée :** 4h  
**Fichiers concernés :** `src/shared/validators.ts`, `src/data/repositories/resource-repository.ts`, `tests/shared/validators.test.ts`

**Actions :**

```typescript
// src/shared/validators.ts
import { z } from 'zod';

/**
 * Schéma Zod pour le type de ressource
 */
export const ResourceTypeSchema = z.enum(['article', 'video', 'tutorial', 'tool', 'other']);

/**
 * Schéma Zod pour créer une ressource
 */
export const CreateResourceSchema = z.object({
  type: ResourceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL').optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  content: z.string().optional(),
});

/**
 * Schéma Zod pour mettre à jour une ressource
 */
export const UpdateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  content: z.string().optional(),
  embeddingModel: z.string().optional(),
});

/**
 * Schéma Zod pour une ressource complète
 */
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  type: ResourceTypeSchema,
  title: z.string().min(1),
  url: z.string().url().optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()),
  content: z.string().optional(),
  embeddingModel: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schéma Zod pour les filtres de liste
 */
export const ResourceFiltersSchema = z.object({
  type: ResourceTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Types inférés
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
export type UpdateResourceInput = z.infer<typeof UpdateResourceSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type ResourceFilters = z.infer<typeof ResourceFiltersSchema>;
```

```typescript
// Modifier src/data/repositories/resource-repository.ts
import { CreateResourceSchema, UpdateResourceSchema } from '../../shared/validators';

export class ResourceRepository {
  create(input: unknown): Resource {
    // Validation Zod
    const validated = CreateResourceSchema.parse(input);

    const id = randomUUID();
    const now = new Date().toISOString();
    const resource: Resource = {
      id,
      type: validated.type,
      title: validated.title,
      url: validated.url,
      tags: validated.tags,
      metadata: validated.metadata,
      content: validated.content,
      createdAt: now,
      updatedAt: now,
    };

    // ... reste du code inchangé
  }

  update(id: string, input: unknown): Resource | null {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    // Validation Zod
    const validated = UpdateResourceSchema.parse(input);

    const updated: Resource = {
      ...existing,
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    // ... reste du code inchangé
  }
}
```

```typescript
// tests/shared/validators.test.ts
import { describe, it, expect } from 'vitest';
import { CreateResourceSchema, UpdateResourceSchema, ResourceSchema } from '../../src/shared/validators';

describe('Validators', () => {
  describe('CreateResourceSchema', () => {
    it('should validate valid input', () => {
      const input = {
        type: 'article',
        title: 'Test Article',
        url: 'https://example.com',
        tags: ['test'],
        metadata: { author: 'John' },
      };

      const result = CreateResourceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const input = {
        type: 'invalid',
        title: 'Test',
      };

      const result = CreateResourceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const input = {
        type: 'article',
        title: '',
      };

      const result = CreateResourceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const input = {
        type: 'article',
        title: 'Test',
        url: 'not-a-url',
      };

      const result = CreateResourceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should use defaults for optional fields', () => {
      const input = {
        type: 'article',
        title: 'Test',
      };

      const result = CreateResourceSchema.parse(input);
      expect(result.tags).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('UpdateResourceSchema', () => {
    it('should validate partial update', () => {
      const input = {
        title: 'Updated Title',
      };

      const result = UpdateResourceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const input = {};

      const result = UpdateResourceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('ResourceSchema', () => {
    it('should validate complete resource', () => {
      const resource = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'article',
        title: 'Test',
        tags: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ResourceSchema.safeParse(resource);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const resource = {
        id: 'not-a-uuid',
        type: 'article',
        title: 'Test',
        tags: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = ResourceSchema.safeParse(resource);
      expect(result.success).toBe(false);
    });
  });
});
```

**Résultat attendu :**
- Schémas Zod créés
- Validation intégrée au Repository
- Tests validation passent
- Types inférés correctement

**Vérification :**
```bash
npm test -- tests/shared/validators.test.ts
```

**Critères d'acceptation :**
- ✅ CreateResourceSchema valide correctly
- ✅ UpdateResourceSchema valide correctly
- ✅ ResourceSchema valide correctly
- ✅ Validation intégrée au Repository
- ✅ Tests validation passent

---

### Tâche 2.7 — Documentation Data Layer

**Objectif :** Créer documentation complète du Data Layer  
**Durée :** 4h  
**Fichiers concernés :** `docs/DATA_LAYER.md`

**Actions :**

```markdown
# Data Layer — Documentation

## Architecture

EKTS utilise 3 bases SQLite séparées pour isoler les préoccupations :

1. **ekts.db** — Données structurées (resources, projects, audits)
2. **ekts-fts.db** — Index full-text (FTS5)
3. **ekts-vectors.db** — Index vectoriel (sqlite-vec)

## Configuration

### SQLite WAL Mode

Toutes les bases sont configurées en Write-Ahead Logging (WAL) pour améliorer les performances en lecture :

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -64000;  -- 64 MB
PRAGMA temp_store = MEMORY;
```

### Permissions

Les fichiers SQLite ont des permissions restrictives (chmod 600) pour protéger les données.

## Schémas

### ekts.db

#### Table `resources`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT PRIMARY KEY | UUID unique |
| type | TEXT | Type de ressource (article, video, tutorial, tool, other) |
| title | TEXT | Titre de la ressource |
| url | TEXT | URL optionnelle |
| tags | TEXT | Tags JSON (array) |
| metadata | TEXT | Métadonnées JSON (object) |
| content | TEXT | Contenu texte (pour FTS) |
| embedding_model | TEXT | Modèle d'embedding utilisé |
| created_at | TEXT | Date création (ISO 8601) |
| updated_at | TEXT | Date modification (ISO 8601) |

#### Table `projects`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT PRIMARY KEY | UUID unique |
| name | TEXT | Nom du projet |
| description | TEXT | Description |
| status | TEXT | Statut (active, completed, archived) |
| started_at | TEXT | Date début |
| completed_at | TEXT | Date fin |
| metadata | TEXT | Métadonnées JSON |
| created_at | TEXT | Date création |
| updated_at | TEXT | Date modification |

#### Table `audits`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT PRIMARY KEY | UUID unique |
| url | TEXT | URL auditée |
| level | TEXT | Niveau inspection (L1, L2, L3, L4) |
| findings | TEXT | Résultats JSON (array) |
| metadata | TEXT | Métadonnées JSON |
| created_at | TEXT | Date création |

### ekts-fts.db

#### Virtual Table `resources_fts` (FTS5)

Table virtuelle pour recherche full-text avec tokenizer `porter unicode61`.

**Synchronisation automatique** via triggers (INSERT, UPDATE, DELETE).

### ekts-vectors.db

#### Virtual Table `resources_vectors` (sqlite-vec)

Table virtuelle pour embeddings vectoriels (1536 dimensions pour OpenAI text-embedding-3-small).

## Repository Pattern

### ResourceRepository

Interface CRUD pour les ressources :

```typescript
interface ResourceRepository {
  create(input: CreateResourceInput): Resource;
  getById(id: string): Resource | null;
  list(filters?: ResourceFilters): Resource[];
  update(id: string, input: UpdateResourceInput): Resource | null;
  delete(id: string): boolean;
}
```

### Validation Zod

Toutes les entrées sont validées avec Zod avant insertion :

- `CreateResourceSchema` — Validation création
- `UpdateResourceSchema` — Validation mise à jour
- `ResourceSchema` — Validation ressource complète

## Fichiers

```
src/data/
├── database.ts                    # Connexion SQLite + configuration
├── migrations/
│   └── 001_init.ts               # Migration initiale
└── repositories/
    └── resource-repository.ts    # Repository Resource

src/shared/
├── types.ts                       # Types TypeScript
└── validators.ts                  # Schémas Zod

data/
├── ekts.db                        # Base structurée
├── ekts-fts.db                    # Base FTS5
└── ekts-vectors.db                # Base vectorielle
```

## Tests

```bash
# Tests connexion
npm test -- tests/data/database.test.ts

# Tests Repository
npm test -- tests/data/resource-repository.test.ts

# Tests validation
npm test -- tests/shared/validators.test.ts

# Couverture
npm run coverage
```

## Limites connues

- **SQLite WAL** : Écritures séquentielles (lectures parallèles)
- **sqlite-vec** : Limité à ~100K vecteurs
- **FTS5** : Performant jusqu'à plusieurs millions de documents

## Évolution

Si les limites sont atteintes :
- Migration vers PostgreSQL + pgvector (feature flag `EKTS_DB_MODE=postgres`)
- Service de recherche dédié (feature flag `EKTS_SEARCH_MODE=service`)

## Références

- ADR-001 : SQLite WAL + FTS5 + sqlite-vec
- `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` — Architecture détaillée
- `04-Knowledge/06_MODELE_DONNEES.md` — Modèle de données
```

**Résultat attendu :**
- Documentation complète créée
- Architecture expliquée
- Schémas documentés
- Repository documenté
- Limites documentées

**Vérification :**
```bash
cat docs/DATA_LAYER.md
```

**Critères d'acceptation :**
- ✅ Documentation complète
- ✅ Architecture expliquée
- ✅ Schémas documentés
- ✅ Repository documenté
- ✅ Limites documentées

---

## 4. Fichiers concernés

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/shared/validators.ts` | Schémas Zod |
| `tests/shared/validators.test.ts` | Tests validation |
| `docs/DATA_LAYER.md` | Documentation Data Layer |

### 4.2 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/data/repositories/resource-repository.ts` | Intégrer validation Zod |
| `src/shared/types.ts` | Utiliser types inférés Zod |

---

## 5. Configurations externes nécessaires

**Aucune** — Pas de services externes pour ce sous-sprint.

---

## 6. Responsabilités

### 6.1 Agent IA

- ✅ Créer schémas Zod
- ✅ Intégrer validation au Repository
- ✅ Créer tests validation
- ✅ Créer documentation

### 6.2 Utilisateur

- ✅ Valider sous-sprint terminé

---

## 7. Tests

### 7.1 Tests à exécuter

```bash
npm test
npm run coverage
npm run lint
npm run build
```

### 7.2 Résultats attendus

- ✅ Tous tests passent (Sprint 2 complet)
- ✅ Couverture > 80%
- ✅ Lint passe
- ✅ Build réussit

---

## 8. Critères d'acceptation

| ID | Critère | Méthode |
|----|---------|---------|
| C2.3.1 | CreateResourceSchema valide correctly | Test unitaire |
| C2.3.2 | UpdateResourceSchema valide correctly | Test unitaire |
| C2.3.3 | Validation intégrée au Repository | Test unitaire |
| C2.3.4 | Documentation DATA_LAYER.md complète | Inspection |
| C2.3.5 | Tous tests Sprint 2 passent | `npm test` |
| C2.3.6 | Couverture > 80% | `npm run coverage` |

**Tous critères obligatoires.**

---

## 9. Preuves de réussite

**Logs à conserver :**
```bash
npm test > test-all.log 2>&1
npm run coverage > coverage-all.log 2>&1
```

**Captures à conserver :**
- Rapport couverture final
- Documentation DATA_LAYER.md

---

## 10. Conditions d'échec

**Échec si :**
- ❌ Validation Zod échoue
- ❌ Tests échouent
- ❌ Couverture < 80%
- ❌ Documentation manquante

**Action si échec :**
1. Documenter erreur
2. Corriger code
3. Ré-exécuter tests

---

## 11. Dépendances

**Dépend de :**
- ✅ Sprint 2-1 terminé (schémas créés)
- ✅ Sprint 2-2 terminé (Repository CRUD)

---

## 12. Conditions de passage au sprint suivant

**Pour passer à Sprint 3 :**
- ✅ Tous critères C2.3.x satisfaits
- ✅ Validation Zod intégrée
- ✅ Documentation complète
- ✅ Tous tests Sprint 2 passent
- ✅ Approbation utilisateur Sprint 2 complet

---

## 13. Éléments à reporter

**Aucun** — Tout doit être terminé dans ce sous-sprint.

---

## 14. Décisions à faire valider

**Aucune** — ADR-010 (Validation Zod) déjà validé.

---

## 15. Procédure fin Sprint 2

**Après ce sous-sprint :**

1. Vérifier tous critères Sprint 2 (C2.1 à C2.10)
2. Créer rapport validation Sprint 2
3. Commit tous fichiers
4. Push branche `sprint/02/data-layer`
5. Présenter résultats utilisateur
6. **Attendre approbation avant Sprint 3**

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Sous-sprint 2-3 prêt pour exécution**
