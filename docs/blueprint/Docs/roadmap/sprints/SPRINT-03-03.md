# Sprint 3-3 — Indexation FTS automatique + documentation

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 2 jours  
**Objectif :** Orchestrer l'indexation FTS automatique + documenter l'API  
**Dépendance :** Sprint 3-2 ✅

---

## 1. Contexte

Les Sprints 3-1 et 3-2 ont implémenté les 5 méthodes CRUD du Knowledge Manager.  
Le Sprint 3-3 va :
- 🎯 Créer l'Indexer (orchestration FTS)
- 🎯 Intégrer l'Indexer dans le Knowledge Manager
- 🎯 Documenter l'API complète

**Problème résolu :**
Actuellement, le Knowledge Manager ajoute/modifie/supprime des ressources dans `ekts.db`, mais ne synchronise pas l'index FTS dans `ekts-fts.db`. Sans indexation FTS, la recherche full-text (Sprint 4) ne fonctionnera pas.

---

## 2. État initial (fin Sprint 3-2)

```
src/
├── business/
│   ├── knowledge-manager.types.ts  ✅ (interfaces)
│   └── knowledge-manager.ts        ✅ (5 méthodes CRUD)
├── data/
│   ├── database.ts                 ✅ (ekts.db connexion)
│   ├── fts.ts                      ✅ (ekts-fts.db connexion)
│   ├── resource-repository.ts      ✅ (CRUD)
│   └── schema.sql                  ✅ (FTS5 virtual table)
├── schemas/
│   └── resource.ts                 ✅ (Zod schemas)
└── utils/
    └── errors.ts                   ✅ (erreurs)

tests/
└── business/
    └── knowledge-manager.test.ts   ✅ (~22 tests, > 80% couverture)
```

**TODO dans le code :**
```typescript
// TODO: Indexation FTS (Sprint 3-3)
// await this.indexer.indexFTS(created);
```

---

## 3. Tâches atomiques

### 3.1 Créer l'Indexer FTS (jour 1, matin — 4h)

**Fichier :** `src/business/indexer.ts`

**Architecture :**
L'Indexer est un service séparé qui :
- Reçoit une Resource
- Synchronise l'index FTS dans `ekts-fts.db`
- Gère les erreurs d'indexation

**Implémentation :**

```typescript
import { Resource } from '../types/resource';

/**
 * Interface de l'Indexer FTS
 */
export interface IIndexer {
  indexFTS(resource: Resource): Promise<void>;
  removeFTS(resourceId: string): Promise<void>;
}

/**
 * Erreur d'indexation
 */
export class IndexingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'IndexingError';
  }
}

/**
 * Indexer FTS — Synchronise l'index full-text search
 * 
 * Cet indexer synchronise la table resources_fts dans ekts-fts.db
 * à chaque opération CRUD sur les ressources.
 */
export class FTSIndexer implements IIndexer {
  /**
   * @param ftsDb - Connexion à ekts-fts.db (better-sqlite3 instance)
   */
  constructor(private ftsDb: any) {}

  /**
   * Indexe une ressource dans FTS
   * 
   * @param resource - La ressource à indexer
   * @throws IndexingError si l'indexation échoue
   */
  async indexFTS(resource: Resource): Promise<void> {
    try {
      // Construire le texte de recherche
      const tagsText = Array.isArray(resource.tags) 
        ? resource.tags.join(' ') 
        : '';
      
      const content = resource.content ?? '';

      // Insérer dans la table FTS5
      // La table resources_fts a été créée au Sprint 2 avec :
      // CREATE VIRTUAL TABLE resources_fts USING fts5(
      //   title, content, tags,
      //   content='resources',
      //   content_rowid='rowid',
      //   tokenize='porter unicode61'
      // );
      this.ftsDb.prepare(
        `INSERT INTO resources_fts (rowid, title, content, tags) 
         VALUES (?, ?, ?, ?)`
      ).run(
        resource.id,
        resource.title,
        content,
        tagsText
      );
    } catch (error) {
      throw new IndexingError(
        `Failed to index resource ${resource.id} in FTS: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Supprime une ressource de l'index FTS
   * 
   * @param resourceId - L'ID de la ressource à supprimer
   * @throws IndexingError si la suppression échoue
   */
  async removeFTS(resourceId: string): Promise<void> {
    try {
      this.ftsDb.prepare(
        `DELETE FROM resources_fts WHERE rowid = ?`
      ).run(resourceId);
    } catch (error) {
      throw new IndexingError(
        `Failed to remove resource ${resourceId} from FTS: ${(error as Error).message}`,
        error
      );
    }
  }
}
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/indexer.ts
git commit -m "feat(business): implement FTS indexer"
```

### 3.2 Tests unitaires Indexer (jour 1, après-midi — 4h)

**Fichier :** `tests/business/indexer.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FTSIndexer, IndexingError } from '../../src/business/indexer';
import { Resource } from '../../src/types/resource';

describe('FTSIndexer', () => {
  let indexer: FTSIndexer;
  let mockFtsDb: any;

  beforeEach(() => {
    mockFtsDb = {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn(),
      }),
    };
    indexer = new FTSIndexer(mockFtsDb);
  });

  const mockResource: Resource = {
    id: '123',
    type: 'article',
    title: 'Test Article',
    url: 'https://example.com',
    tags: ['test', 'demo'],
    metadata: {},
    content: 'This is the content of the article',
    embedding_model: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  describe('indexFTS', () => {
    it('should insert resource into FTS table', async () => {
      await indexer.indexFTS(mockResource);

      expect(mockFtsDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO resources_fts')
      );
    });

    it('should include title, content, and tags in FTS index', async () => {
      const mockRun = vi.fn();
      mockFtsDb.prepare.mockReturnValue({ run: mockRun });

      await indexer.indexFTS(mockResource);

      expect(mockRun).toHaveBeenCalledWith(
        '123',
        'Test Article',
        'This is the content of the article',
        'test demo'
      );
    });

    it('should handle resource without content', async () => {
      const resourceWithoutContent = { ...mockResource, content: null };
      const mockRun = vi.fn();
      mockFtsDb.prepare.mockReturnValue({ run: mockRun });

      await indexer.indexFTS(resourceWithoutContent);

      expect(mockRun).toHaveBeenCalledWith(
        '123',
        'Test Article',
        '',
        'test demo'
      );
    });

    it('should handle resource without tags', async () => {
      const resourceWithoutTags = { ...mockResource, tags: [] };
      const mockRun = vi.fn();
      mockFtsDb.prepare.mockReturnValue({ run: mockRun });

      await indexer.indexFTS(resourceWithoutTags);

      expect(mockRun).toHaveBeenCalledWith(
        '123',
        'Test Article',
        'This is the content of the article',
        ''
      );
    });

    it('should throw IndexingError if database operation fails', async () => {
      mockFtsDb.prepare.mockReturnValue({
        run: () => { throw new Error('DB error'); },
      });

      await expect(indexer.indexFTS(mockResource)).rejects.toThrow(IndexingError);
    });
  });

  describe('removeFTS', () => {
    it('should delete resource from FTS table', async () => {
      await indexer.removeFTS('123');

      expect(mockFtsDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM resources_fts')
      );
    });

    it('should use correct resource ID', async () => {
      const mockRun = vi.fn();
      mockFtsDb.prepare.mockReturnValue({ run: mockRun });

      await indexer.removeFTS('abc-456');

      expect(mockRun).toHaveBeenCalledWith('abc-456');
    });

    it('should throw IndexingError if database operation fails', async () => {
      mockFtsDb.prepare.mockReturnValue({
        run: () => { throw new Error('DB error'); },
      });

      await expect(indexer.removeFTS('123')).rejects.toThrow(IndexingError);
    });
  });
});
```

**Validation :**
```bash
npm test tests/business/indexer.test.ts
# ✅ ~10 tests passent

npm run test:coverage -- tests/business/indexer.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add tests/business/indexer.test.ts
git commit -m "test(business): add unit tests for FTS indexer"
```

### 3.3 Intégrer l'Indexer dans le Knowledge Manager (jour 2, matin — 4h)

**Fichier :** `src/business/knowledge-manager.ts`

**Modifications :**

1. Ajouter le constructeur avec injection de l'Indexer :

```typescript
export class KnowledgeManager implements IKnowledgeManager {
  constructor(
    private repository: ResourceRepository,
    private indexer: IIndexer
  ) {}
  
  // ...
}
```

2. Ajouter l'indexation dans `addResource` :

```typescript
async addResource(input: AddResourceInput): Promise<Resource> {
  // ... validation et création existantes

  const created = await this.repository.create(resource);

  // Indexation FTS
  await this.indexer.indexFTS(created);

  return created;
}
```

3. Ajouter la réindexation dans `updateResource` :

```typescript
async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
  // ... vérification et validation existantes

  const result = await this.repository.update(id, updated);

  // Réindexation FTS (supprimer + réinsérer)
  await this.indexer.removeFTS(id);
  await this.indexer.indexFTS(result);

  return result;
}
```

4. Ajouter la suppression FTS dans `deleteResource` :

```typescript
async deleteResource(id: string): Promise<void> {
  const existing = await this.repository.getById(id);
  if (!existing) {
    throw new ResourceNotFoundError(id);
  }

  await this.repository.delete(id);

  // Suppression FTS
  await this.indexer.removeFTS(id);
}
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git commit -m "feat(business): integrate FTS indexer into Knowledge Manager"
```

### 3.4 Mettre à jour les tests Knowledge Manager (jour 2, après-midi — 2h)

**Fichier :** `tests/business/knowledge-manager.test.ts`

**Modifications :** Ajouter le mock de l'Indexer dans tous les tests existants.

```typescript
import { FTSIndexer } from '../../src/business/indexer';

describe('KnowledgeManager', () => {
  let manager: KnowledgeManager;
  let mockRepository: Partial<ResourceRepository>;
  let mockIndexer: Partial<FTSIndexer>;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      getById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockIndexer = {
      indexFTS: vi.fn().mockResolvedValue(undefined),
      removeFTS: vi.fn().mockResolvedValue(undefined),
    };
    manager = new KnowledgeManager(
      mockRepository as ResourceRepository,
      mockIndexer as FTSIndexer
    );
  });

  describe('addResource', () => {
    it('should create a resource and index FTS', async () => {
      const input = { type: 'article' as const, title: 'Test' };
      const resource = expect.objectContaining({ title: 'Test' });
      
      (mockRepository.create as any).mockResolvedValue(resource);
      (mockIndexer.indexFTS as any).mockResolvedValue(undefined);

      const result = await manager.addResource(input);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockIndexer.indexFTS).toHaveBeenCalledWith(resource);
    });

    it('should throw if FTS indexing fails', async () => {
      const input = { type: 'article' as const, title: 'Test' };
      const resource = expect.objectContaining({ title: 'Test' });
      
      (mockRepository.create as any).mockResolvedValue(resource);
      (mockIndexer.indexFTS as any).mockRejectedValue(new Error('FTS error'));

      await expect(manager.addResource(input)).rejects.toThrow('FTS error');
    });
  });

  describe('updateResource', () => {
    it('should update resource and re-index FTS', async () => {
      const existing = { id: '123', title: 'Old', type: 'article' as const };
      const updated = { ...existing, title: 'New' };
      
      (mockRepository.getById as any).mockResolvedValue(existing);
      (mockRepository.update as any).mockResolvedValue(updated);

      await manager.updateResource('123', { title: 'New' });

      expect(mockIndexer.removeFTS).toHaveBeenCalledWith('123');
      expect(mockIndexer.indexFTS).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteResource', () => {
    it('should delete resource and remove from FTS', async () => {
      const existing = { id: '123', title: 'Test', type: 'article' as const };
      
      (mockRepository.getById as any).mockResolvedValue(existing);

      await manager.deleteResource('123');

      expect(mockRepository.delete).toHaveBeenCalledWith('123');
      expect(mockIndexer.removeFTS).toHaveBeenCalledWith('123');
    });
  });
});
```

**Validation :**
```bash
npm test tests/business/
# ✅ Tous les tests passent

npm run test:coverage -- tests/business/
# ✅ > 80% couverture sur les 2 fichiers
```

**Commit :**
```bash
git add tests/business/knowledge-manager.test.ts
git commit -m "test(business): update Knowledge Manager tests with FTS indexer"
```

### 3.5 Documentation API Knowledge Manager (jour 2, fin — 4h)

**Fichier :** `docs/KNOWLEDGE_MANAGER.md`

```markdown
# Knowledge Manager — API Documentation

## Overview

Le Knowledge Manager est le service central qui orchestre la gestion des ressources 
dans EKTS. Il assure la cohérence entre la base de données structurée (ekts.db) 
et l'index full-text search (ekts-fts.db).

## Installation

```typescript
import { KnowledgeManager } from './business/knowledge-manager';
import { ResourceRepository } from './data/resource-repository';
import { FTSIndexer } from './business/indexer';

const repository = new ResourceRepository(db);
const indexer = new FTSIndexer(ftsDb);
const knowledgeManager = new KnowledgeManager(repository, indexer);
```

## API

### addResource

Ajoute une nouvelle ressource et l'indexe automatiquement dans FTS.

```typescript
async addResource(input: AddResourceInput): Promise<Resource>
```

**Paramètres :**
- `input.type` — Type de ressource ('article' | 'video' | 'tutorial' | 'tool' | 'other')
- `input.title` — Titre (obligatoire)
- `input.url?` — URL (optionnel)
- `input.tags?` — Tags (défaut: [])
- `input.metadata?` — Métadonnées JSON (défaut: {})
- `input.content?` — Contenu texte pour indexation (optionnel)

**Retourne :** La ressource créée avec ID généré et timestamps

**Erreurs :**
- `ValidationError` — Si les données ne passent pas la validation Zod
- `IndexingError` — Si l'indexation FTS échoue

**Exemple :**
```typescript
const resource = await knowledgeManager.addResource({
  type: 'article',
  title: 'Introduction to SQLite',
  url: 'https://example.com/sqlite-intro',
  tags: ['sqlite', 'database', 'tutorial'],
  content: 'SQLite is a lightweight relational database...',
});

console.log(resource.id); // 'uuid-generated'
```

---

### getResource

Obtient une ressource par son ID.

```typescript
async getResource(id: string): Promise<Resource>
```

**Paramètres :**
- `id` — ID de la ressource

**Retourne :** La ressource trouvée

**Erreurs :**
- `ResourceNotFoundError` — Si la ressource n'existe pas

**Exemple :**
```typescript
const resource = await knowledgeManager.getResource('abc-123');
console.log(resource.title); // 'Introduction to SQLite'
```

---

### listResources

Liste les ressources avec filtres optionnels.

```typescript
async listResources(filters?: ResourceFilters): Promise<Resource[]>
```

**Paramètres :**
- `filters?` — Filtres optionnels
  - `type?` — Filtrer par type
  - `tags?` — Filtrer par tags (OR)
  - `limit?` — Limiter le nombre de résultats

**Retourne :** Liste des ressources correspondant aux filtres

**Exemple :**
```typescript
// Toutes les ressources
const all = await knowledgeManager.listResources();

// Filtrer par type
const articles = await knowledgeManager.listResources({ type: 'article' });

// Filtrer par tags
const tagged = await knowledgeManager.listResources({ 
  tags: ['sqlite', 'tutorial'] 
});

// Limiter les résultats
const top5 = await knowledgeManager.listResources({ limit: 5 });
```

---

### updateResource

Met à jour une ressource existante et réindexe FTS.

```typescript
async updateResource(id: string, data: Partial<Resource>): Promise<Resource>
```

**Paramètres :**
- `id` — ID de la ressource à mettre à jour
- `data` — Données à mettre à jour (partielles)

**Retourne :** La ressource mise à jour

**Erreurs :**
- `ResourceNotFoundError` — Si la ressource n'existe pas
- `ValidationError` — Si les données ne passent pas la validation Zod
- `IndexingError` — Si la réindexation FTS échoue

**Note :** Les champs `id` et `created_at` ne peuvent pas être modifiés.

**Exemple :**
```typescript
const updated = await knowledgeManager.updateResource('abc-123', {
  title: 'Updated Title',
  tags: ['sqlite', 'updated'],
});

console.log(updated.title); // 'Updated Title'
```

---

### deleteResource

Supprime une ressource et la retire de l'index FTS.

```typescript
async deleteResource(id: string): Promise<void>
```

**Paramètres :**
- `id` — ID de la ressource à supprimer

**Erreurs :**
- `ResourceNotFoundError` — Si la ressource n'existe pas

**Exemple :**
```typescript
await knowledgeManager.deleteResource('abc-123');
// Ressource supprimée de ekts.db et de ekts-fts.db
```

---

## Architecture

```
Knowledge Manager
    ├── Repository (ekts.db)
    │   ├── create()
    │   ├── getById()
    │   ├── list()
    │   ├── update()
    │   └── delete()
    └── Indexer (ekts-fts.db)
        ├── indexFTS()
        └── removeFTS()
```

**Flux de données :**
1. Validation Zod des entrées
2. Opération sur ekts.db (via Repository)
3. Synchronisation FTS sur ekts-fts.db (via Indexer)

## Types

```typescript
interface Resource {
  id: string;
  type: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  title: string;
  url: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  content: string | null;
  embedding_model: string | null;
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}

interface AddResourceInput {
  type: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  title: string;
  url?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  content?: string;
}

interface ResourceFilters {
  type?: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  tags?: string[];
  limit?: number;
}
```

## Erreurs

| Erreur | Description |
|--------|-------------|
| `ResourceNotFoundError` | Ressource introuvable |
| `ValidationError` | Validation Zod échoue |
| `IndexingError` | Erreur d'indexation FTS |

## Tests

```bash
# Tests unitaires
npm test tests/business/knowledge-manager.test.ts
npm test tests/business/indexer.test.ts

# Couverture
npm run test:coverage -- tests/business/
# Objectif: > 80%
```

## Références

- [ADR-001](../Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md#adr-001) — SQLite WAL + FTS5 + sqlite-vec
- [ADR-005](../Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md#adr-005) — Architecture C Hybride
- [Architecture technique](../Docs/02-ARCHITECTURE-TECHNIQUE.md#421-knowledge-manager) — Section 4.2.1
```

**Validation :**
```bash
ls -la docs/KNOWLEDGE_MANAGER.md
# ✅ Documentation existe

cat docs/KNOWLEDGE_MANAGER.md | wc -l
# ✅ ~200 lignes
```

**Commit :**
```bash
git add docs/KNOWLEDGE_MANAGER.md
git commit -m "docs: add Knowledge Manager API documentation"
```

### 3.6 Vérification finale Sprint 3-3 (jour 2, fin)

**Vérifications :**

```bash
# 1. Tous les tests
npm test tests/business/
# ✅ ~32 tests passent (22 Knowledge Manager + 10 Indexer)

# 2. Couverture
npm run test:coverage -- tests/business/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/business/
# ✅ knowledge-manager.ts, knowledge-manager.types.ts, indexer.ts

ls -la tests/business/
# ✅ knowledge-manager.test.ts, indexer.test.ts

ls -la docs/KNOWLEDGE_MANAGER.md
# ✅ Documentation existe

# 6. Vérification intégration FTS
grep -n "indexer" src/business/knowledge-manager.ts
# ✅ L'indexer est bien injecté et appelé

# 7. Push
git push origin feat/sprint-3-3
```

**Point de contrôle Sprint 3-3 :**
- ✅ Indexer FTS implémenté (indexFTS, removeFTS)
- ✅ Indexer intégré dans Knowledge Manager (addResource, updateResource, deleteResource)
- ✅ Tests unitaires complets (> 80% couverture sur les 2 fichiers)
- ✅ Documentation API complète
- ✅ Orchestration FTS automatique à chaque add/update/delete

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/business/indexer.ts` | ~80 | FTSIndexer (indexFTS, removeFTS) |
| `src/business/knowledge-manager.ts` | ~150 | 5 méthodes + intégration Indexer |
| `src/business/knowledge-manager.types.ts` | ~30 | Interfaces |
| `tests/business/indexer.test.ts` | ~100 | 10 tests |
| `tests/business/knowledge-manager.test.ts` | ~300 | 22+ tests |
| `docs/KNOWLEDGE_MANAGER.md` | ~200 | Documentation API |

**Total Sprint 3 :** ~860 lignes

---

## 5. Commits

```bash
git commit -m "feat(business): implement FTS indexer"
git commit -m "test(business): add unit tests for FTS indexer"
git commit -m "feat(business): integrate FTS indexer into Knowledge Manager"
git commit -m "test(business): update Knowledge Manager tests with FTS indexer"
git commit -m "docs: add Knowledge Manager API documentation"
```

---

## 6. Transition vers Sprint 4

**Prérequis pour Sprint 4 :**
- ✅ Sprint 3 terminé avec succès
- ✅ Knowledge Manager fonctionnel (5 méthodes + FTS)
- ✅ Tests > 80% couverture
- ✅ Documentation complète

**Sprint 4 — Search Engine (Semaine 7-8) :**
- 🎯 Recherche FTS5 (BM25)
- 🎯 Génération embeddings (OpenAI)
- 🎯 Recherche vectorielle (sqlite-vec)
- 🎯 Fusion RRF (k=60)
- 🎯 Benchmark Recall@5 ≥ 0.75

---

**Fin du document Sprint 3-3**
