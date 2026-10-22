# Sprint 4-1 — Recherche FTS5 (BM25) + Vectorielle (sqlite-vec)

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 4 jours  
**Objectif :** Implémenter les 2 moteurs de recherche séparément  
**Dépendance :** Sprint 3 (Knowledge Manager) ✅

---

## 1. Contexte

Le Sprint 3 a mis en place le Knowledge Manager avec indexation FTS automatique.  
Le Sprint 4-1 va implémenter les 2 moteurs de recherche séparément :
- Recherche full-text via FTS5 (BM25)
- Recherche vectorielle via sqlite-vec (cosine similarity)

---

## 2. État initial

```
src/
├── business/
│   ├── knowledge-manager.ts        ✅ (5 méthodes CRUD)
│   └── indexer.ts                  ✅ (FTSIndexer)
├── data/
│   ├── database.ts                 ✅ (ekts.db)
│   ├── fts.ts                      ✅ (ekts-fts.db)
│   ├── vectors.ts                  ✅ (ekts-vectors.db)
│   ├── resource-repository.ts      ✅ (CRUD)
│   └── schema.sql                  ✅ (FTS5 + sqlite-vec)
└── types/
    └── resource.ts                 ✅ (Resource)

data/
├── ekts.db                         ✅ (resources)
├── ekts-fts.db                     ✅ (resources_fts)
└── ekts-vectors.db                 ✅ (resources_vectors)
```

---

## 3. Tâches atomiques

### 3.1 Créer les types de recherche (jour 1, matin)

**Fichier :** `src/business/search-engine.types.ts`

```typescript
import { Resource } from '../types/resource';

/**
 * Options de recherche
 */
export interface SearchOptions {
  limit?: number;           // Nombre max de résultats (défaut: 10)
  mode?: 'hybrid' | 'fts' | 'vector';  // Mode de recherche (défaut: hybrid)
  type?: Resource['type'];  // Filtrer par type
  tags?: string[];          // Filtrer par tags
}

/**
 * Résultat de recherche
 */
export interface SearchResult {
  resource: Resource;       // La ressource trouvée
  score: number;            // Score de pertinence
  source: 'fts' | 'vector' | 'hybrid';  // Source du résultat
}

/**
 * Interface du Search Engine
 */
export interface ISearchEngine {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  searchFTS(query: string, limit?: number): Promise<SearchResult[]>;
  searchVector(query: string, limit?: number): Promise<SearchResult[]>;
}
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/search-engine.types.ts
git commit -m "feat(business): add search engine interfaces and types"
```

### 3.2 Créer le FTSRepository (jour 1-2 — 8h)

**Fichier :** `src/data/fts-repository.ts`

**Implémentation :**

```typescript
import Database from 'better-sqlite3';
import { Resource } from '../types/resource';
import { SearchResult } from '../business/search-engine.types';
import { SearchError } from '../utils/errors';

/**
 * Repository pour la recherche full-text (FTS5 BM25)
 */
export class FTSRepository {
  constructor(private db: Database.Database) {}

  /**
   * Recherche full-text avec scoring BM25
   * 
   * @param query - La requête de recherche
   * @param limit - Nombre max de résultats (défaut: 10)
   * @returns Liste de résultats triés par score BM25
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      // Préparer la requête FTS5
      // BM25 weights: title=10.0, content=5.0, tags=1.0
      const sql = `
        SELECT 
          r.id,
          r.type,
          r.title,
          r.url,
          r.tags,
          r.metadata,
          r.content,
          r.embedding_model,
          r.created_at,
          r.updated_at,
          bm25(resources_fts, 10.0, 5.0, 1.0) as score
        FROM resources_fts
        JOIN resources r ON r.id = resources_fts.rowid
        WHERE resources_fts MATCH ?
        ORDER BY score DESC
        LIMIT ?
      `;

      const rows = this.db.prepare(sql).all(query, limit) as any[];

      return rows.map(row => ({
        resource: {
          id: row.id,
          type: row.type,
          title: row.title,
          url: row.url,
          tags: JSON.parse(row.tags),
          metadata: JSON.parse(row.metadata),
          content: row.content,
          embedding_model: row.embedding_model,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        score: row.score,
        source: 'fts' as const,
      }));
    } catch (error) {
      throw new SearchError(
        `FTS search failed for query "${query}": ${(error as Error).message}`,
        error
      );
    }
  }
}
```

**Note sur BM25 :**
- Le score BM25 est **négatif** (plus le score est élevé, plus c'est pertinent)
- `bm25(table, w1, w2, w3)` applique des poids aux colonnes
- Poids : title=10.0 (très important), content=5.0 (important), tags=1.0 (moins important)

**Tests :**

**Fichier :** `tests/data/fts-repository.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { FTSRepository } from '../../src/data/fts-repository';

describe('FTSRepository', () => {
  let db: Database.Database;
  let ftsDb: Database.Database;
  let repository: FTSRepository;

  beforeAll(() => {
    // Créer bases de test
    db = new Database('test-fts.db');
    ftsDb = new Database('test-fts-search.db');

    // Créer tables
    db.exec(`
      CREATE TABLE resources (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        content TEXT,
        embedding_model TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    ftsDb.exec(`
      CREATE VIRTUAL TABLE resources_fts USING fts5(
        title, content, tags,
        content='resources',
        content_rowid='rowid',
        tokenize='porter unicode61'
      )
    `);

    // Insérer données test
    const resources = [
      {
        id: '1',
        type: 'article',
        title: 'Introduction to SQLite',
        content: 'SQLite is a lightweight relational database management system',
        tags: '["sqlite", "database", "tutorial"]',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        type: 'video',
        title: 'Advanced SQLite Techniques',
        content: 'Learn advanced features of SQLite including FTS5 and json1',
        tags: '["sqlite", "advanced", "video"]',
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ];

    resources.forEach(r => {
      db.prepare(`
        INSERT INTO resources (id, type, title, url, tags, metadata, content, embedding_model, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, '{}', ?, ?, ?, ?)
      `).run(r.id, r.type, r.title, null, r.tags, r.content, null, r.created_at, r.updated_at);

      ftsDb.prepare(`
        INSERT INTO resources_fts (rowid, title, content, tags)
        VALUES (?, ?, ?, ?)
      `).run(r.id, r.title, r.content, JSON.parse(r.tags).join(' '));
    });

    repository = new FTSRepository(ftsDb);
  });

  afterAll(() => {
    db.close();
    ftsDb.close();
  });

  describe('search', () => {
    it('should return results matching the query', async () => {
      const results = await repository.search('SQLite');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].resource.title).toContain('SQLite');
    });

    it('should rank results by BM25 score', async () => {
      const results = await repository.search('SQLite');

      // Le premier résultat doit avoir un score plus élevé (moins négatif)
      expect(results[0].score).toBeLessThanOrEqual(results[1]?.score ?? results[0].score);
    });

    it('should respect limit parameter', async () => {
      const results = await repository.search('SQLite', 1);

      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await repository.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('should throw SearchError on invalid query', async () => {
      await expect(repository.search('')).rejects.toThrow(SearchError);
    });
  });
});
```

**Validation :**
```bash
npm test tests/data/fts-repository.test.ts
# ✅ 5 tests passent

npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/data/fts-repository.ts
git add tests/data/fts-repository.test.ts
git commit -m "feat(data): implement FTS repository with BM25 scoring"
```

### 3.3 Créer le VectorRepository (jour 2-3 — 8h)

**Fichier :** `src/data/vector-repository.ts`

**Implémentation :**

```typescript
import Database from 'better-sqlite3';
import { Resource } from '../types/resource';
import { SearchResult } from '../business/search-engine.types';
import { SearchError } from '../utils/errors';

/**
 * Repository pour la recherche vectorielle (sqlite-vec cosine similarity)
 */
export class VectorRepository {
  constructor(private db: Database.Database) {}

  /**
   * Recherche vectorielle par cosine similarity
   * 
   * @param queryEmbedding - Embedding de la requête (1536 dimensions)
   * @param limit - Nombre max de résultats (défaut: 10)
   * @returns Liste de résultats triés par similarity
   */
  async search(queryEmbedding: number[], limit: number = 10): Promise<SearchResult[]> {
    try {
      // Convertir embedding en buffer pour sqlite-vec
      const embeddingBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);

      // Recherche vectorielle avec cosine similarity
      // sqlite-vec utilise l'opérateur <=> pour la distance cosine
      const sql = `
        SELECT 
          rv.resource_id,
          r.type,
          r.title,
          r.url,
          r.tags,
          r.metadata,
          r.content,
          r.embedding_model,
          r.created_at,
          r.updated_at,
          1 - (rv.embedding <=> ?) as similarity
        FROM resources_vectors rv
        JOIN resources r ON r.id = rv.resource_id
        ORDER BY similarity DESC
        LIMIT ?
      `;

      const rows = this.db.prepare(sql).all(embeddingBuffer, limit) as any[];

      return rows.map(row => ({
        resource: {
          id: row.resource_id,
          type: row.type,
          title: row.title,
          url: row.url,
          tags: JSON.parse(row.tags),
          metadata: JSON.parse(row.metadata),
          content: row.content,
          embedding_model: row.embedding_model,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        score: row.similarity,
        source: 'vector' as const,
      }));
    } catch (error) {
      throw new SearchError(
        `Vector search failed: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Insère ou met à jour un embedding vectoriel
   * 
   * @param resourceId - ID de la ressource
   * @param embedding - Embedding (1536 dimensions)
   */
  async insertEmbedding(resourceId: string, embedding: number[]): Promise<void> {
    try {
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

      this.db.prepare(`
        INSERT OR REPLACE INTO resources_vectors (resource_id, embedding)
        VALUES (?, ?)
      `).run(resourceId, embeddingBuffer);
    } catch (error) {
      throw new SearchError(
        `Failed to insert embedding for resource ${resourceId}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Supprime un embedding vectoriel
   * 
   * @param resourceId - ID de la ressource
   */
  async deleteEmbedding(resourceId: string): Promise<void> {
    try {
      this.db.prepare(`
        DELETE FROM resources_vectors WHERE resource_id = ?
      `).run(resourceId);
    } catch (error) {
      throw new SearchError(
        `Failed to delete embedding for resource ${resourceId}: ${(error as Error).message}`,
        error
      );
    }
  }
}
```

**Note sur sqlite-vec :**
- sqlite-vec utilise l'opérateur `<=>` pour la distance cosine
- `1 - distance` = similarity (plus proche de 1 = plus similaire)
- Embeddings stockés en `float[1536]` (1536 dimensions pour text-embedding-3-small)

**Tests :**

**Fichier :** `tests/data/vector-repository.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { VectorRepository } from '../../src/data/vector-repository';

describe('VectorRepository', () => {
  let db: Database.Database;
  let repository: VectorRepository;

  beforeAll(() => {
    // Créer base de test avec sqlite-vec
    db = new Database('test-vectors.db');
    
    // Charger extension sqlite-vec (mock pour tests)
    // En production: db.loadExtension('/path/to/vec0');
    
    // Créer tables
    db.exec(`
      CREATE TABLE resources (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        content TEXT,
        embedding_model TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Note: sqlite-vec virtual table nécessite l'extension chargée
    // Pour les tests unitaires, on mocke les opérations
    db.exec(`
      CREATE TABLE resources_vectors (
        resource_id TEXT PRIMARY KEY,
        embedding BLOB
      )
    `);

    repository = new VectorRepository(db);
  });

  afterAll(() => {
    db.close();
  });

  describe('insertEmbedding', () => {
    it('should insert an embedding', async () => {
      const embedding = new Array(1536).fill(0.1);
      
      await expect(repository.insertEmbedding('1', embedding)).resolves.not.toThrow();
    });
  });

  describe('deleteEmbedding', () => {
    it('should delete an embedding', async () => {
      await expect(repository.deleteEmbedding('1')).resolves.not.toThrow();
    });
  });
});
```

**Validation :**
```bash
npm test tests/data/vector-repository.test.ts
# ✅ Tests passent

npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/data/vector-repository.ts
git add tests/data/vector-repository.test.ts
git commit -m "feat(data): implement vector repository with cosine similarity"
```

### 3.4 Tests d'intégration (jour 4)

**Vérifications finales :**

```bash
# 1. Tests FTSRepository
npm test tests/data/fts-repository.test.ts
# ✅ 5 tests passent

# 2. Tests VectorRepository
npm test tests/data/vector-repository.test.ts
# ✅ Tests passent

# 3. Couverture
npm run test:coverage -- tests/data/
# ✅ > 80% couverture

# 4. Compilation
npm run build
# ✅ Aucune erreur

# 5. Linting
npm run lint
# ✅ Aucune erreur

# 6. Push
git push origin feat/sprint-4-1
```

**Point de contrôle Sprint 4-1 :**
- ✅ FTSRepository implémenté (search BM25)
- ✅ VectorRepository implémenté (search cosine similarity)
- ✅ Types de recherche définis (SearchOptions, SearchResult, ISearchEngine)
- ✅ Tests unitaires > 80% couverture
- ✅ Gestion erreurs (SearchError)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/business/search-engine.types.ts` | ~40 | Interfaces et types |
| `src/data/fts-repository.ts` | ~80 | FTSRepository (BM25) |
| `src/data/vector-repository.ts` | ~100 | VectorRepository (cosine) |
| `tests/data/fts-repository.test.ts` | ~100 | Tests FTS |
| `tests/data/vector-repository.test.ts` | ~80 | Tests Vector |

**Total Sprint 4-1 :** ~400 lignes

---

## 5. Commits

```bash
git commit -m "feat(business): add search engine interfaces and types"
git commit -m "feat(data): implement FTS repository with BM25 scoring"
git commit -m "feat(data): implement vector repository with cosine similarity"
```

---

## 6. Transition vers Sprint 4-2

**Prérequis pour Sprint 4-2 :**
- ✅ Sprint 4-1 terminé avec succès
- ✅ FTSRepository et VectorRepository implémentés
- ✅ Tests unitaires > 80%

**Sprint 4-2 va implémenter :**
- EmbeddingsService (OpenAI API)
- Indexation vectorielle automatique
- Intégration avec Knowledge Manager

---

**Fin du document Sprint 4-1**
