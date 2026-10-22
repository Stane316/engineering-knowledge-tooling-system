# Sprint 4-2 — Génération embeddings (OpenAI) + indexation vectorielle

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 3 jours  
**Objectif :** Générer embeddings via OpenAI et les indexer dans sqlite-vec  
**Dépendance :** Sprint 4-1 ✅

---

## 1. Contexte

Le Sprint 4-1 a implémenté les 2 moteurs de recherche (FTS + Vector).  
Le Sprint 4-2 va :
- 🎯 Créer l'EmbeddingsService (appel API OpenAI)
- 🎯 Indexer automatiquement les embeddings (à chaque add/update/delete)
- 🎯 Intégrer l'indexation vectorielle dans le Knowledge Manager

---

## 2. État initial (fin Sprint 4-1)

```
src/
├── business/
│   ├── search-engine.types.ts      🆕 (interfaces + types)
│   ├── knowledge-manager.ts        ✅ (5 méthodes)
│   └── indexer.ts                  ✅ (FTSIndexer)
├── data/
│   ├── fts-repository.ts           🆕 (search BM25)
│   ├── vector-repository.ts        🆕 (search cosine)
│   └── ...
└── types/
    └── resource.ts                 ✅
```

**TODO dans le code :**
```typescript
// TODO: Indexation vectorielle (Sprint 4-2)
// await this.vectorIndexer.indexVector(resource);
```

---

## 3. Tâches atomiques

### 3.1 Configurer les variables d'environnement (jour 1, matin — 1h)

**Fichier :** `.env.example`

```bash
# OpenAI API Key (obligatoire pour embeddings)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Modèle d'embedding (optionnel, défaut: text-embedding-3-small)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Dimension embeddings (1536 pour text-embedding-3-small)
EMBEDDING_DIMENSION=1536
```

**Fichier :** `.env` (ne PAS commiter)

```bash
OPENAI_API_KEY=sk-votre-cle-ici
```

**Modifier `.gitignore` :**
```bash
# Ajouter à la fin
.env
```

**Installer dépendance :**
```bash
npm install openai
```

**Validation :**
```bash
cat .env | grep OPENAI_API_KEY
# ✅ Variable configurée

grep ".env" .gitignore
# ✅ .env dans .gitignore
```

**Commit :**
```bash
git add .env.example .gitignore package.json package-lock.json
git commit -m "chore: add .env.example and install openai dependency"
```

### 3.2 Créer l'EmbeddingsService (jour 1-2 — 8h)

**Fichier :** `src/business/embeddings.ts`

**Implémentation :**

```typescript
import OpenAI from 'openai';

/**
 * Erreur de génération d'embeddings
 */
export class EmbeddingsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'EmbeddingsError';
  }
}

/**
 * Interface de l'Embeddings Service
 */
export interface IEmbeddingsService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Service de génération d'embeddings via OpenAI API
 */
export class OpenAIEmbeddingsService implements IEmbeddingsService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new EmbeddingsError('OPENAI_API_KEY environment variable is not set');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
  }

  /**
   * Génère un embedding pour un texte
   * 
   * @param text - Le texte à encoder
   * @returns Embedding (1536 dimensions pour text-embedding-3-small)
   * @throws EmbeddingsError si l'appel API échoue
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new EmbeddingsError(
        `Failed to generate embedding: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Génère des embeddings pour plusieurs textes (batch)
   * 
   * @param texts - Liste de textes à encoder
   * @returns Liste d'embeddings
   * @throws EmbeddingsError si l'appel API échoue
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map(d => d.embedding);
    } catch (error) {
      throw new EmbeddingsError(
        `Failed to generate batch embeddings: ${(error as Error).message}`,
        error
      );
    }
  }
}
```

**Tests :**

**Fichier :** `tests/business/embeddings.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIEmbeddingsService, EmbeddingsError } from '../../src/business/embeddings';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn(),
      },
    })),
  };
});

describe('OpenAIEmbeddingsService', () => {
  let service: OpenAIEmbeddingsService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    service = new OpenAIEmbeddingsService();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.clearAllMocks();
  });

  describe('embed', () => {
    it('should generate an embedding for a text', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });
      vi.mocked(OpenAI).mockImplementation(() => ({
        embeddings: { create: mockCreate },
      } as any));

      const service = new OpenAIEmbeddingsService();
      const result = await service.embed('test text');

      expect(result).toEqual(mockEmbedding);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text',
      });
    });

    it('should throw EmbeddingsError if API fails', async () => {
      const OpenAI = (await import('openai')).default;
      vi.mocked(OpenAI).mockImplementation(() => ({
        embeddings: {
          create: vi.fn().mockRejectedValue(new Error('API error')),
        },
      } as any));

      const service = new OpenAIEmbeddingsService();

      await expect(service.embed('test')).rejects.toThrow(EmbeddingsError);
    });
  });

  describe('embedBatch', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ];

      const OpenAI = (await import('openai')).default;
      vi.mocked(OpenAI).mockImplementation(() => ({
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: mockEmbeddings.map(e => ({ embedding: e })),
          }),
        },
      } as any));

      const service = new OpenAIEmbeddingsService();
      const result = await service.embedBatch(['text 1', 'text 2']);

      expect(result).toEqual(mockEmbeddings);
    });
  });

  describe('constructor', () => {
    it('should throw if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => new OpenAIEmbeddingsService()).toThrow(EmbeddingsError);
    });
  });
});
```

**Validation :**
```bash
npm test tests/business/embeddings.test.ts
# ✅ Tests passent

npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/embeddings.ts
git add tests/business/embeddings.test.ts
git commit -m "feat(business): implement embeddings service (OpenAI)"
```

### 3.3 Créer le VectorIndexer (jour 2, matin — 4h)

**Fichier :** `src/business/vector-indexer.ts`

**Implémentation :**

```typescript
import { Resource } from '../types/resource';
import { IEmbeddingsService } from './embeddings';
import { VectorRepository } from '../data/vector-repository';

/**
 * Interface du Vector Indexer
 */
export interface IVectorIndexer {
  indexVector(resource: Resource): Promise<void>;
  removeVector(resourceId: string): Promise<void>;
}

/**
 * Indexer vectoriel — Génère et stocke les embeddings
 */
export class VectorIndexer implements IVectorIndexer {
  constructor(
    private embeddingsService: IEmbeddingsService,
    private vectorRepository: VectorRepository
  ) {}

  /**
   * Génère un embedding pour une ressource et le stocke
   * 
   * @param resource - La ressource à indexer
   */
  async indexVector(resource: Resource): Promise<void> {
    // Construire le texte à encoder
    const text = this.buildText(resource);

    // Générer l'embedding
    const embedding = await this.embeddingsService.embed(text);

    // Stocker dans ekts-vectors.db
    await this.vectorRepository.insertEmbedding(resource.id, embedding);
  }

  /**
   * Supprime l'embedding d'une ressource
   * 
   * @param resourceId - ID de la ressource
   */
  async removeVector(resourceId: string): Promise<void> {
    await this.vectorRepository.deleteEmbedding(resourceId);
  }

  /**
   * Construit le texte à encoder à partir de la ressource
   */
  private buildText(resource: Resource): string {
    const parts = [
      resource.title,
      resource.content ?? '',
      (resource.tags ?? []).join(' '),
    ];
    return parts.filter(p => p.length > 0).join(' ');
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
git add src/business/vector-indexer.ts
git commit -m "feat(business): implement vector indexer"
```

### 3.4 Intégrer le VectorIndexer dans le Knowledge Manager (jour 2, après-midi — 4h)

**Modifier :** `src/business/knowledge-manager.types.ts`

```typescript
import { IVectorIndexer } from './vector-indexer';

export interface IKnowledgeManager {
  // ... méthodes existantes
}

// Ajouter le VectorIndexer dans le constructeur
```

**Modifier :** `src/business/knowledge-manager.ts`

```typescript
import { IVectorIndexer } from './vector-indexer';

export class KnowledgeManager implements IKnowledgeManager {
  constructor(
    private repository: ResourceRepository,
    private ftsIndexer: IIndexer,
    private vectorIndexer: IVectorIndexer  // NOUVEAU
  ) {}

  async addResource(input: AddResourceInput): Promise<Resource> {
    // ... validation et création existantes

    const created = await this.repository.create(resource);

    // Indexation FTS
    await this.ftsIndexer.indexFTS(created);

    // Indexation vectorielle (NOUVEAU)
    await this.vectorIndexer.indexVector(created);

    return created;
  }

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
    // ... vérification et validation existantes

    const result = await this.repository.update(id, updated);

    // Réindexation FTS
    await this.ftsIndexer.removeFTS(id);
    await this.ftsIndexer.indexFTS(result);

    // Réindexation vectorielle (NOUVEAU)
    await this.vectorIndexer.removeVector(id);
    await this.vectorIndexer.indexVector(result);

    return result;
  }

  async deleteResource(id: string): Promise<void> {
    // ... vérification existence

    await this.repository.delete(id);

    // Suppression FTS
    await this.ftsIndexer.removeFTS(id);

    // Suppression vectorielle (NOUVEAU)
    await this.vectorIndexer.removeVector(id);
  }
}
```

**Tests :**

**Modifier :** `tests/business/knowledge-manager.test.ts`

```typescript
import { VectorIndexer } from '../../src/business/vector-indexer';

describe('KnowledgeManager', () => {
  let mockVectorIndexer: Partial<VectorIndexer>;

  beforeEach(() => {
    // ... mocks existants
    
    mockVectorIndexer = {
      indexVector: vi.fn().mockResolvedValue(undefined),
      removeVector: vi.fn().mockResolvedValue(undefined),
    };
    
    manager = new KnowledgeManager(
      mockRepository as ResourceRepository,
      mockIndexer as FTSIndexer,
      mockVectorIndexer as VectorIndexer
    );
  });

  describe('addResource', () => {
    it('should create, index FTS, and index vector', async () => {
      const input = { type: 'article' as const, title: 'Test' };
      const resource = expect.objectContaining({ title: 'Test' });

      (mockRepository.create as any).mockResolvedValue(resource);

      await manager.addResource(input);

      expect(mockIndexer.indexFTS).toHaveBeenCalledWith(resource);
      expect(mockVectorIndexer.indexVector).toHaveBeenCalledWith(resource);
    });
  });

  describe('updateResource', () => {
    it('should update, re-index FTS, and re-index vector', async () => {
      const existing = { id: '123', title: 'Old', type: 'article' as const };
      const updated = { ...existing, title: 'New' };

      (mockRepository.getById as any).mockResolvedValue(existing);
      (mockRepository.update as any).mockResolvedValue(updated);

      await manager.updateResource('123', { title: 'New' });

      expect(mockIndexer.removeFTS).toHaveBeenCalledWith('123');
      expect(mockIndexer.indexFTS).toHaveBeenCalledWith(updated);
      expect(mockVectorIndexer.removeVector).toHaveBeenCalledWith('123');
      expect(mockVectorIndexer.indexVector).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteResource', () => {
    it('should delete, remove FTS, and remove vector', async () => {
      const existing = { id: '123', title: 'Test', type: 'article' as const };

      (mockRepository.getById as any).mockResolvedValue(existing);

      await manager.deleteResource('123');

      expect(mockRepository.delete).toHaveBeenCalledWith('123');
      expect(mockIndexer.removeFTS).toHaveBeenCalledWith('123');
      expect(mockVectorIndexer.removeVector).toHaveBeenCalledWith('123');
    });
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ Tous les tests passent (avec les 3 indexers)

npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git add src/business/knowledge-manager.types.ts
git add tests/business/knowledge-manager.test.ts
git commit -m "feat(business): integrate vector indexer into Knowledge Manager"
```

### 3.5 Tests d'intégration (jour 3)

**Vérifications finales :**

```bash
# 1. Tests embeddings
npm test tests/business/embeddings.test.ts
# ✅ Tests passent

# 2. Tests Knowledge Manager (avec VectorIndexer)
npm test tests/business/knowledge-manager.test.ts
# ✅ Tous les tests passent

# 3. Couverture
npm run test:coverage -- tests/business/
# ✅ > 80% couverture

# 4. Compilation
npm run build
# ✅ Aucune erreur

# 5. Linting
npm run lint
# ✅ Aucune erreur

# 6. Vérification .env
cat .env | grep OPENAI_API_KEY
# ✅ Variable configurée

# 7. Push
git push origin feat/sprint-4-2
```

**Point de contrôle Sprint 4-2 :**
- ✅ EmbeddingsService implémenté (OpenAI API)
- ✅ VectorIndexer implémenté (indexVector, removeVector)
- ✅ Intégration dans Knowledge Manager (add/update/delete)
- ✅ Variables d'environnement configurées (.env)
- ✅ Tests unitaires > 80% couverture
- ✅ Gestion erreurs (EmbeddingsError)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/business/embeddings.ts` | ~80 | OpenAIEmbeddingsService |
| `src/business/vector-indexer.ts` | ~60 | VectorIndexer |
| `tests/business/embeddings.test.ts` | ~100 | Tests embeddings |
| `.env.example` | ~10 | Template variables |
| `.env` | ~5 | Variables locales (non commité) |

**Total Sprint 4-2 :** ~255 lignes

---

## 5. Commits

```bash
git commit -m "chore: add .env.example and install openai dependency"
git commit -m "feat(business): implement embeddings service (OpenAI)"
git commit -m "feat(business): implement vector indexer"
git commit -m "feat(business): integrate vector indexer into Knowledge Manager"
```

---

## 6. Transition vers Sprint 4-3

**Prérequis pour Sprint 4-3 :**
- ✅ Sprint 4-2 terminé avec succès
- ✅ EmbeddingsService et VectorIndexer implémentés
- ✅ Intégration dans Knowledge Manager
- ✅ Tests > 80% couverture

**Sprint 4-3 va implémenter :**
- Fusion RRF (Reciprocal Rank Fusion)
- Search Engine complet (hybrid search)
- Benchmarks (Recall@5, Faithfulness)
- Documentation API

---

**Fin du document Sprint 4-2**
