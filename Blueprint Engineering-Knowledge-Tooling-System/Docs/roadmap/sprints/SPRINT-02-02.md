# Sprint 2-2 — Repository Resource + tests

**Identifiant :** SPRINT-02-02  
**Parent :** SPRINT-02 (Data Layer)  
**Durée prévue :** 4 jours  
**Date de documentation :** 21 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ  
**Dépend de :** SPRINT-02-01 (Schémas SQLite) ⏳

---

## 1. Objectif précis

**Implémenter le Repository Resource avec CRUD complet et tests unitaires.**

**Résultat concret attendu :**
- `ResourceRepository` implémenté (create, read, update, delete, list)
- Tests unitaires complets (> 80% couverture)
- Gestion erreurs (transactions, rollback)
- Validation entrées (types)
- Documentation JSDoc

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Sprint 2-1 terminé | 3 bases créées | Retourner Sprint 2-1 |
| Schémas SQL exécutés | Tables existent | Exécuter migrations |
| Types TypeScript définis | `src/shared/types.ts` | Créer interfaces |

**Si prérequis manquant :** Documenter et compléter avant de continuer.

---

## 3. Tâches atomiques

### Tâche 2.4 — Repository Resource (CRUD)

**Objectif :** Implémenter CRUD complet pour ressources  
**Durée :** 8h  
**Fichiers concernés :** `src/data/repositories/resource-repository.ts`, `src/shared/types.ts`

**Actions :**

```typescript
// src/shared/types.ts (compléter)
export interface Resource {
  id: string;
  type: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  title: string;
  url?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  content?: string;
  embeddingModel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceFilters {
  type?: Resource['type'];
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateResourceInput {
  type: Resource['type'];
  title: string;
  url?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  content?: string;
}

export interface UpdateResourceInput {
  title?: string;
  url?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  content?: string;
  embeddingModel?: string;
}
```

```typescript
// src/data/repositories/resource-repository.ts
import { db } from '../database';
import { Resource, ResourceFilters, CreateResourceInput, UpdateResourceInput } from '../../shared/types';
import { randomUUID } from 'crypto';

export class ResourceRepository {
  /**
   * Créer une nouvelle ressource
   */
  create(input: CreateResourceInput): Resource {
    const id = randomUUID();
    const now = new Date().toISOString();
    const resource: Resource = {
      id,
      type: input.type,
      title: input.title,
      url: input.url,
      tags: input.tags || [],
      metadata: input.metadata || {},
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };

    const stmt = db.prepare(`
      INSERT INTO resources (id, type, title, url, tags, metadata, content, created_at, updated_at)
      VALUES (@id, @type, @title, @url, @tags, @metadata, @content, @createdAt, @updatedAt)
    `);

    stmt.run({
      id: resource.id,
      type: resource.type,
      title: resource.title,
      url: resource.url || null,
      tags: JSON.stringify(resource.tags),
      metadata: JSON.stringify(resource.metadata),
      content: resource.content || null,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    });

    return resource;
  }

  /**
   * Obtenir une ressource par ID
   */
  getById(id: string): Resource | null {
    const stmt = db.prepare('SELECT * FROM resources WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToResource(row);
  }

  /**
   * Lister les ressources avec filtres optionnels
   */
  list(filters?: ResourceFilters): Resource[] {
    let query = 'SELECT * FROM resources';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Recherche dans JSON tags
      conditions.push('json_extract(tags, \'$\') LIKE ?');
      params.push(`%${filters.tags[0]}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.mapRowToResource(row));
  }

  /**
   * Mettre à jour une ressource
   */
  update(id: string, input: UpdateResourceInput): Resource | null {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    const updated: Resource = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const stmt = db.prepare(`
      UPDATE resources
      SET title = @title,
          url = @url,
          tags = @tags,
          metadata = @metadata,
          content = @content,
          embedding_model = @embeddingModel,
          updated_at = @updatedAt
      WHERE id = @id
    `);

    stmt.run({
      id: updated.id,
      title: updated.title,
      url: updated.url || null,
      tags: JSON.stringify(updated.tags),
      metadata: JSON.stringify(updated.metadata || {}),
      content: updated.content || null,
      embeddingModel: updated.embeddingModel || null,
      updatedAt: updated.updatedAt,
    });

    return updated;
  }

  /**
   * Supprimer une ressource
   */
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM resources WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mapper une ligne SQL vers un objet Resource
   */
  private mapRowToResource(row: any): Resource {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      url: row.url || undefined,
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}'),
      content: row.content || undefined,
      embeddingModel: row.embedding_model || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export instance singleton
export const resourceRepository = new ResourceRepository();
```

**Résultat attendu :**
- CRUD complet implémenté
- Gestion JSON (tags, metadata)
- Filtres fonctionnels (type, tags, limit, offset)
- Transactions implicites (better-sqlite3)

**Vérification :**
```typescript
// Test rapide
import { resourceRepository } from './src/data/repositories/resource-repository';

const resource = resourceRepository.create({
  type: 'article',
  title: 'Test Article',
  tags: ['test', 'example'],
});

console.log(resource);
```

**Critères d'acceptation :**
- ✅ create() fonctionne
- ✅ getById() fonctionne
- ✅ list() fonctionne (avec filtres)
- ✅ update() fonctionne
- ✅ delete() fonctionne
- ✅ JSON parsing correct
- ✅ Gestion null/undefined

---

### Tâche 2.5 — Tests unitaires Repository

**Objectif :** Tester CRUD complet avec couverture > 80%  
**Durée :** 8h  
**Fichiers concernés :** `tests/data/resource-repository.test.ts`

**Actions :**

```typescript
// tests/data/resource-repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ResourceRepository } from '../../src/data/repositories/resource-repository';
import { db } from '../../src/data/database';

describe('ResourceRepository', () => {
  let repository: ResourceRepository;

  beforeAll(() => {
    // Exécuter migrations
    import('../../src/data/migrations/001_init');
  });

  beforeEach(() => {
    repository = new ResourceRepository();
    // Nettoyer base avant chaque test
    db.exec('DELETE FROM resources');
  });

  afterAll(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a resource with all fields', () => {
      const input = {
        type: 'article' as const,
        title: 'Test Article',
        url: 'https://example.com',
        tags: ['test', 'example'],
        metadata: { author: 'John Doe' },
        content: 'This is a test article',
      };

      const resource = repository.create(input);

      expect(resource).toBeDefined();
      expect(resource.id).toBeDefined();
      expect(resource.type).toBe('article');
      expect(resource.title).toBe('Test Article');
      expect(resource.url).toBe('https://example.com');
      expect(resource.tags).toEqual(['test', 'example']);
      expect(resource.metadata).toEqual({ author: 'John Doe' });
      expect(resource.content).toBe('This is a test article');
      expect(resource.createdAt).toBeDefined();
      expect(resource.updatedAt).toBeDefined();
    });

    it('should create a resource with minimal fields', () => {
      const input = {
        type: 'tool' as const,
        title: 'Test Tool',
      };

      const resource = repository.create(input);

      expect(resource).toBeDefined();
      expect(resource.type).toBe('tool');
      expect(resource.title).toBe('Test Tool');
      expect(resource.tags).toEqual([]);
      expect(resource.metadata).toEqual({});
    });

    it('should generate unique IDs', () => {
      const resource1 = repository.create({ type: 'article', title: 'Article 1' });
      const resource2 = repository.create({ type: 'article', title: 'Article 2' });

      expect(resource1.id).not.toBe(resource2.id);
    });
  });

  describe('getById', () => {
    it('should return resource by ID', () => {
      const created = repository.create({ type: 'article', title: 'Test' });
      const retrieved = repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test');
    });

    it('should return null for non-existent ID', () => {
      const retrieved = repository.getById('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('list', () => {
    it('should return all resources', () => {
      repository.create({ type: 'article', title: 'Article 1' });
      repository.create({ type: 'tool', title: 'Tool 1' });

      const resources = repository.list();

      expect(resources).toHaveLength(2);
    });

    it('should filter by type', () => {
      repository.create({ type: 'article', title: 'Article 1' });
      repository.create({ type: 'tool', title: 'Tool 1' });

      const articles = repository.list({ type: 'article' });

      expect(articles).toHaveLength(1);
      expect(articles[0].type).toBe('article');
    });

    it('should limit results', () => {
      repository.create({ type: 'article', title: 'Article 1' });
      repository.create({ type: 'article', title: 'Article 2' });
      repository.create({ type: 'article', title: 'Article 3' });

      const limited = repository.list({ limit: 2 });

      expect(limited).toHaveLength(2);
    });

    it('should order by created_at DESC', () => {
      const resource1 = repository.create({ type: 'article', title: 'First' });
      const resource2 = repository.create({ type: 'article', title: 'Second' });

      const resources = repository.list();

      expect(resources[0].id).toBe(resource2.id);
      expect(resources[1].id).toBe(resource1.id);
    });
  });

  describe('update', () => {
    it('should update resource fields', () => {
      const created = repository.create({ type: 'article', title: 'Original' });
      const updated = repository.update(created.id, { title: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should return null for non-existent ID', () => {
      const updated = repository.update('non-existent-id', { title: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should update multiple fields', () => {
      const created = repository.create({ type: 'article', title: 'Original' });
      const updated = repository.update(created.id, {
        title: 'Updated',
        tags: ['new', 'tags'],
        metadata: { updated: true },
      });

      expect(updated?.title).toBe('Updated');
      expect(updated?.tags).toEqual(['new', 'tags']);
      expect(updated?.metadata).toEqual({ updated: true });
    });
  });

  describe('delete', () => {
    it('should delete resource', () => {
      const created = repository.create({ type: 'article', title: 'Test' });
      const deleted = repository.delete(created.id);

      expect(deleted).toBe(true);

      const retrieved = repository.getById(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const deleted = repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});
```

**Résultat attendu :**
- 15+ tests passent
- Couverture > 80%
- CRUD complet testé
- Gestion erreurs testée

**Vérification :**
```bash
npm test -- tests/data/resource-repository.test.ts
npm run coverage
```

**Critères d'acceptation :**
- ✅ Tous tests passent
- ✅ Couverture > 80%
- ✅ CRUD complet testé
- ✅ Filtres testés
- ✅ Gestion null testée

---

## 4. Fichiers concernés

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/data/repositories/resource-repository.ts` | Repository Resource |
| `tests/data/resource-repository.test.ts` | Tests Repository |

### 4.2 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/shared/types.ts` | Ajouter interfaces Resource, ResourceFilters, etc. |

---

## 5. Configurations externes nécessaires

**Aucune** — Pas de services externes pour ce sous-sprint.

---

## 6. Responsabilités

### 6.1 Agent IA

- ✅ Implémenter ResourceRepository
- ✅ Créer tests unitaires
- ✅ Vérifier couverture > 80%
- ✅ Documenter JSDoc

### 6.2 Utilisateur

- ✅ Valider sous-sprint terminé

---

## 7. Tests

### 7.1 Tests à exécuter

```bash
npm test -- tests/data/resource-repository.test.ts
npm run coverage
```

### 7.2 Résultats attendus

- ✅ 15+ tests passent
- ✅ Couverture > 80%

---

## 8. Critères d'acceptation

| ID | Critère | Méthode |
|----|---------|---------|
| C2.2.1 | create() fonctionne | Test unitaire |
| C2.2.2 | getById() fonctionne | Test unitaire |
| C2.2.3 | list() fonctionne | Test unitaire |
| C2.2.4 | update() fonctionne | Test unitaire |
| C2.2.5 | delete() fonctionne | Test unitaire |
| C2.2.6 | Filtres fonctionnent | Test unitaire |
| C2.2.7 | JSON parsing correct | Test unitaire |
| C2.2.8 | Tests > 80% couverture | `npm run coverage` |

**Tous critères obligatoires.**

---

## 9. Preuves de réussite

**Logs à conserver :**
```bash
npm test -- tests/data/resource-repository.test.ts > test-repository.log 2>&1
npm run coverage > coverage-repository.log 2>&1
```

**Captures à conserver :**
- Résultat tests
- Rapport couverture

---

## 10. Conditions d'échec

**Échec si :**
- ❌ CRUD incomplet
- ❌ Tests échouent
- ❌ Couverture < 80%

**Action si échec :**
1. Documenter erreur
2. Corriger code
3. Ré-exécuter tests

---

## 11. Dépendances

**Dépend de :**
- ✅ Sprint 2-1 terminé (schémas créés)

---

## 12. Conditions de passage au sous-sprint suivant

**Pour passer à Sprint 2-3 :**
- ✅ Tous critères C2.2.x satisfaits
- ✅ CRUD complet
- ✅ Tests > 80%
- ✅ Approbation utilisateur

---

## 13. Éléments à reporter

**Aucun** — Tout doit être terminé dans ce sous-sprint.

---

## 14. Décisions à faire valider

**Aucune** — Repository pattern déjà validé (Phase 03).

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Sous-sprint 2-2 prêt pour exécution**
