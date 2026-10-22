# Sprint 3-1 — Knowledge Manager CRUD (add, get, list)

**Statut :** 🟡 Documenté — En attente approbation  
**Durée :** 4 jours  
**Objectif :** Implémenter les 3 premières méthodes du Knowledge Manager  
**Dépendance :** Sprint 2 (Data Layer) ✅

---

## 1. Contexte

Le Sprint 2 a mis en place le Repository Resource avec CRUD complet et la validation Zod.  
Le Sprint 3-1 va implémenter les 3 premières méthodes du Knowledge Manager qui orchestrent le Repository.

**Méthodes à implémenter :**
- ✅ `addResource(input: AddResourceInput): Promise<Resource>`
- ✅ `getResource(id: string): Promise<Resource | null>`
- ✅ `listResources(filters?: ResourceFilters): Promise<Resource[]>`

---

## 2. État initial

```
src/
├── business/
│   └── (vide — à créer Sprint 3)
├── data/
│   ├── resource-repository.ts    ✅ (CRUD complet)
│   └── schema.sql                ✅ (tables créées)
├── schemas/
│   └── resource.ts               ✅ (CreateResourceSchema)
├── types/
│   └── resource.ts               ✅ (Resource, ResourceFilters)
└── utils/
    ├── id.ts                     ✅ (generateId)
    ├── timestamp.ts              ✅ (getTimestamp)
    └── errors.ts                 ✅ (ResourceNotFoundError)
```

---

## 3. Tâches atomiques

### 3.1 Créer les interfaces (jour 1, matin)

**Fichier :** `src/business/knowledge-manager.types.ts`

```typescript
import { Resource, ResourceFilters } from '../types/resource';

/**
 * Input pour créer une ressource
 */
export interface AddResourceInput {
  type: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  title: string;
  url?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  content?: string;
}

/**
 * Interface du Knowledge Manager
 */
export interface IKnowledgeManager {
  addResource(input: AddResourceInput): Promise<Resource>;
  getResource(id: string): Promise<Resource | null>;
  listResources(filters?: ResourceFilters): Promise<Resource[]>;
  updateResource(id: string, data: Partial<Resource>): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
}
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/knowledge-manager.types.ts
git commit -m "feat(business): add Knowledge Manager interfaces"
```

### 3.2 Créer le squelette Knowledge Manager (jour 1, après-midi)

**Fichier :** `src/business/knowledge-manager.ts`

```typescript
import { IKnowledgeManager, AddResourceInput } from './knowledge-manager.types';
import { ResourceRepository } from '../data/resource-repository';
import { Resource, ResourceFilters } from '../types/resource';
import { CreateResourceSchema } from '../schemas/resource';
import { ResourceNotFoundError, ValidationError } from '../utils/errors';
import { generateId } from '../utils/id';
import { getTimestamp } from '../utils/timestamp';

/**
 * Knowledge Manager — Orchestre la gestion des ressources
 */
export class KnowledgeManager implements IKnowledgeManager {
  constructor(private repository: ResourceRepository) {}

  /**
   * Ajoute une nouvelle ressource
   */
  async addResource(input: AddResourceInput): Promise<Resource> {
    // TODO: Implémenter
    throw new Error('Not implemented');
  }

  /**
   * Obtient une ressource par son ID
   */
  async getResource(id: string): Promise<Resource | null> {
    // TODO: Implémenter
    throw new Error('Not implemented');
  }

  /**
   * Liste les ressources avec filtres optionnels
   */
  async listResources(filters?: ResourceFilters): Promise<Resource[]> {
    // TODO: Implémenter
    throw new Error('Not implemented');
  }

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
    // TODO: Implémenter Sprint 3-2
    throw new Error('Not implemented');
  }

  async deleteResource(id: string): Promise<void> {
    // TODO: Implémenter Sprint 3-2
    throw new Error('Not implemented');
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
git add src/business/knowledge-manager.ts
git commit -m "feat(business): add Knowledge Manager skeleton"
```

### 3.3 Implémenter addResource (jour 2, matin — 8h)

**Fichier :** `src/business/knowledge-manager.ts`

**Implémentation :**

```typescript
async addResource(input: AddResourceInput): Promise<Resource> {
  // 1. Validation Zod
  const parseResult = CreateResourceSchema.safeParse(input);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(e => e.message).join(', ');
    throw new ValidationError(`Invalid input: ${errors}`);
  }

  // 2. Construire la ressource
  const now = getTimestamp();
  const resource: Resource = {
    id: generateId(),
    type: parseResult.data.type,
    title: parseResult.data.title,
    url: parseResult.data.url ?? null,
    tags: parseResult.data.tags ?? [],
    metadata: parseResult.data.metadata ?? {},
    content: parseResult.data.content ?? null,
    embedding_model: null,
    created_at: now,
    updated_at: now,
  };

  // 3. Sauvegarder dans ekts.db
  const created = await this.repository.create(resource);

  // 4. TODO: Indexation FTS (Sprint 3-3)
  // await this.indexer.indexFTS(created);

  return created;
}
```

**Test :**

**Fichier :** `tests/business/knowledge-manager.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeManager } from '../../src/business/knowledge-manager';
import { ResourceRepository } from '../../src/data/resource-repository';
import { ValidationError } from '../../src/utils/errors';

describe('KnowledgeManager', () => {
  let manager: KnowledgeManager;
  let mockRepository: Partial<ResourceRepository>;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      getById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    manager = new KnowledgeManager(mockRepository as ResourceRepository);
  });

  describe('addResource', () => {
    it('should create a resource with valid input', async () => {
      const input = {
        type: 'article' as const,
        title: 'Test Article',
        url: 'https://example.com',
        tags: ['test', 'demo'],
      };

      const expectedResource = expect.objectContaining({
        type: 'article',
        title: 'Test Article',
        url: 'https://example.com',
        tags: ['test', 'demo'],
      });

      (mockRepository.create as any).mockResolvedValue(expectedResource);

      const result = await manager.addResource(input);

      expect(mockRepository.create).toHaveBeenCalledWith(expectedResource);
      expect(result).toEqual(expectedResource);
    });

    it('should throw ValidationError with invalid input', async () => {
      const input = {
        type: 'invalid' as any,
        title: '',
      };

      await expect(manager.addResource(input)).rejects.toThrow(ValidationError);
    });

    it('should set default values for optional fields', async () => {
      const input = {
        type: 'article' as const,
        title: 'Test',
      };

      (mockRepository.create as any).mockImplementation((r) => Promise.resolve(r));

      const result = await manager.addResource(input);

      expect(result.tags).toEqual([]);
      expect(result.metadata).toEqual({});
      expect(result.url).toBeNull();
      expect(result.content).toBeNull();
    });
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ 3 tests passent

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git add tests/business/knowledge-manager.test.ts
git commit -m "feat(business): implement Knowledge Manager addResource"
```

### 3.4 Implémenter getResource (jour 2, après-midi — 4h)

**Fichier :** `src/business/knowledge-manager.ts`

```typescript
async getResource(id: string): Promise<Resource | null> {
  const resource = await this.repository.getById(id);
  
  if (!resource) {
    throw new ResourceNotFoundError(id);
  }

  return resource;
}
```

**Test :**

```typescript
describe('getResource', () => {
  it('should return a resource when it exists', async () => {
    const resource = { id: '123', title: 'Test', type: 'article' };
    (mockRepository.getById as any).mockResolvedValue(resource);

    const result = await manager.getResource('123');

    expect(mockRepository.getById).toHaveBeenCalledWith('123');
    expect(result).toEqual(resource);
  });

  it('should throw ResourceNotFoundError when resource does not exist', async () => {
    (mockRepository.getById as any).mockResolvedValue(null);

    await expect(manager.getResource('999')).rejects.toThrow(ResourceNotFoundError);
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ 5 tests passent (3 addResource + 2 getResource)
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git add tests/business/knowledge-manager.test.ts
git commit -m "feat(business): implement Knowledge Manager getResource"
```

### 3.5 Implémenter listResources (jour 3, matin — 4h)

**Fichier :** `src/business/knowledge-manager.ts`

```typescript
async listResources(filters?: ResourceFilters): Promise<Resource[]> {
  return await this.repository.list(filters);
}
```

**Note :** `listResources` délègue simplement au Repository. La complexité des filtres est gérée au niveau Repository.

**Test :**

```typescript
describe('listResources', () => {
  it('should return all resources when no filters', async () => {
    const resources = [
      { id: '1', title: 'Test 1' },
      { id: '2', title: 'Test 2' },
    ];
    (mockRepository.list as any).mockResolvedValue(resources);

    const result = await manager.listResources();

    expect(mockRepository.list).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(resources);
  });

  it('should return filtered resources', async () => {
    const filters = { type: 'article' };
    const resources = [{ id: '1', title: 'Article', type: 'article' }];
    (mockRepository.list as any).mockResolvedValue(resources);

    const result = await manager.listResources(filters);

    expect(mockRepository.list).toHaveBeenCalledWith(filters);
    expect(result).toEqual(resources);
  });

  it('should return empty array when no resources match', async () => {
    (mockRepository.list as any).mockResolvedValue([]);

    const result = await manager.listResources({ type: 'video' });

    expect(result).toEqual([]);
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ 8 tests passent (3 addResource + 2 getResource + 3 listResources)

npm run test:coverage -- tests/business/knowledge-manager.test.ts
# ✅ Couverture > 80%
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git add tests/business/knowledge-manager.test.ts
git commit -m "feat(business): implement Knowledge Manager listResources"
```

### 3.6 Vérification finale Sprint 3-1 (jour 3-4)

**Vérifications :**
```bash
# 1. Compilation
npm run build
# ✅ Aucune erreur

# 2. Linting
npm run lint
# ✅ Aucune erreur

# 3. Tests
npm test tests/business/knowledge-manager.test.ts
# ✅ 8 tests passent

# 4. Couverture
npm run test:coverage -- tests/business/knowledge-manager.test.ts
# ✅ > 80% couverture

# 5. Push
git push origin feat/sprint-3-1
```

**Point de contrôle Sprint 3-1 :**
- ✅ Interfaces créées (IKnowledgeManager, AddResourceInput)
- ✅ `addResource` fonctionnel (validation + création + defaults)
- ✅ `getResource` fonctionnel (recherche + ResourceNotFoundError)
- ✅ `listResources` fonctionnel (liste + filtres)
- ✅ 8 tests unitaires passent
- ✅ Couverture > 80%

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/business/knowledge-manager.types.ts` | ~30 | Interfaces |
| `src/business/knowledge-manager.ts` | ~80 | 3 méthodes (add, get, list) |
| `tests/business/knowledge-manager.test.ts` | ~100 | 8 tests |

**Total :** ~210 lignes

---

## 5. Commits

```bash
git commit -m "feat(business): add Knowledge Manager interfaces"
git commit -m "feat(business): add Knowledge Manager skeleton"
git commit -m "feat(business): implement Knowledge Manager addResource"
git commit -m "feat(business): implement Knowledge Manager getResource"
git commit -m "feat(business): implement Knowledge Manager listResources"
```

---

## 6. Transition vers Sprint 3-2

**Prérequis pour Sprint 3-2 :**
- ✅ Sprint 3-1 terminé avec succès
- ✅ 3 méthodes implémentées (add, get, list)
- ✅ Tests unitaires > 80%
- ✅ Code pushé sur `feat/sprint-3-1`

**Sprint 3-2 va implémenter :**
- `updateResource` (mise à jour)
- `deleteResource` (suppression)
- Tests complets Knowledge Manager

---

**Fin du document Sprint 3-1**
