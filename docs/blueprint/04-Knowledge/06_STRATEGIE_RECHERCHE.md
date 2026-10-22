# Phase 06 — Livrable 06.3 : Stratégie de Recherche et Indexation EKTS

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Élevé (recherche FTS5, vector search, hybrid search)

---

## 1. Objectif

Définir la stratégie de recherche et d'indexation pour EKTS, couvrant la recherche full-text (FTS5), la recherche vectorielle (sqlite-vec), et la recherche hybride pour préparer la Phase 07 (RAG).

---

## 2. Résumé exécutif

### 3 niveaux de recherche

1. **Recherche structurée** — SQL standard (WHERE, JOIN, ORDER BY)
2. **Recherche full-text** — FTS5 (mots-clés, stemming, ranking)
3. **Recherche vectorielle** — sqlite-vec (embeddings, similarité sémantique)

### Recherche hybride (FTS + Vector)

**Combinaison des deux approches pour :**
- Précision (mots-clés exacts via FTS5)
- Rappel (similarité sémantique via vectors)
- Ranking unifié (RRF — Reciprocal Rank Fusion)

### Performance attendue

| Type de recherche | Latence (10K docs) | Latence (100K docs) |
|-------------------|-------------------|---------------------|
| **Structurée (SQL)** | <5ms | <20ms |
| **Full-text (FTS5)** | <5ms | <15ms |
| **Vectorielle (sqlite-vec)** | 5-15ms | 50-150ms |
| **Hybride (FTS + Vector)** | 10-20ms | 60-170ms |

---

## 3. Recherche structurée (SQL)

### 3.1 Cas d'usage

**Quand utiliser :**
- Filtrage par métadonnées (domaine, type, date)
- Relations entre entités (inspections → ressources)
- Agrégations (comptages, statistiques)
- Requêtes précises avec critères définis

**Exemples :**

```sql
-- Ressources par domaine
SELECT domain, COUNT(*) as count
FROM resources
GROUP BY domain;

-- Inspections récentes avec erreurs
SELECT * FROM inspections
WHERE error_count > 0
  AND timestamp > datetime('now', '-7 days')
ORDER BY timestamp DESC;

-- Ressources avec tags spécifiques
SELECT r.*
FROM resources r
JOIN resource_tags rt ON r.id = rt.resource_id
JOIN tags t ON rt.tag_id = t.id
WHERE t.name IN ('playwright', 'scraping')
GROUP BY r.id
HAVING COUNT(DISTINCT t.name) = 2;
```

### 3.2 Optimisation

**Index stratégiques :**

```sql
-- Composite pour requêtes fréquentes
CREATE INDEX idx_resources_domain_type ON resources(domain, type);
CREATE INDEX idx_inspections_domain_ts ON inspections(domain, timestamp DESC);

-- Partial index pour ressources vérifiées
CREATE INDEX idx_resources_verified ON resources(added_at DESC)
WHERE verified = 1;
```

---

## 4. Recherche full-text (FTS5)

### 4.1 Configuration FTS5

**Table FTS5 pour inspections :**

```sql
CREATE VIRTUAL TABLE inspections_fts USING fts5(
  inspection_id,
  title,
  description,
  content,
  tokenize='porter unicode61'
);
```

**Table FTS5 pour ressources :**

```sql
CREATE VIRTUAL TABLE resources_fts USING fts5(
  resource_id,
  title,
  description,
  content,
  tokenize='porter unicode61'
);
```

**Tokenizers :**
- `porter` — stemming anglais (running → run)
- `unicode61` — support Unicode complet

### 4.2 Synchronisation FTS

**Triggers pour synchroniser FTS avec tables principales :**

```sql
-- Trigger INSERT pour inspections
CREATE TRIGGER inspections_ai AFTER INSERT ON inspections BEGIN
  INSERT INTO inspections_fts (inspection_id, title, description, content)
  VALUES (
    new.id,
    new.title,
    new.description,
    '' -- contenu ajouté séparément
  );
END;

-- Trigger UPDATE pour inspections
CREATE TRIGGER inspections_au AFTER UPDATE ON inspections BEGIN
  UPDATE inspections_fts
  SET title = new.title,
      description = new.description
  WHERE inspection_id = new.id;
END;

-- Trigger DELETE pour inspections
CREATE TRIGGER inspections_ad AFTER DELETE ON inspections BEGIN
  DELETE FROM inspections_fts WHERE inspection_id = old.id;
END;

-- Mêmes triggers pour resources
```

### 4.3 Requêtes FTS5

**Recherche simple :**

```sql
-- Recherche "playwright automation"
SELECT inspection_id, title, 
       rank
FROM inspections_fts
WHERE inspections_fts MATCH 'playwright automation'
ORDER BY rank
LIMIT 20;
```

**Recherche avec opérateurs :**

```sql
-- ET : "playwright" ET "automation"
SELECT * FROM inspections_fts
WHERE inspections_fts MATCH 'playwright AND automation';

-- OU : "playwright" OU "puppeteer"
SELECT * FROM inspections_fts
WHERE inspections_fts MATCH 'playwright OR puppeteer';

-- NOT : "playwright" NOT "selenium"
SELECT * FROM inspections_fts
WHERE inspections_fts MATCH 'playwright NOT selenium';

-- Phrase exacte
SELECT * FROM inspections_fts
WHERE inspections_fts MATCH '"browser automation"';

-- Prefix
SELECT * FROM inspections_fts
WHERE inspections_fts MATCH 'auto*';  -- automation, automatic, etc.
```

**Recherche avec ranking :**

```sql
-- BM25 ranking (par défaut)
SELECT inspection_id, title, rank
FROM inspections_fts
WHERE inspections_fts MATCH 'playwright'
ORDER BY rank
LIMIT 10;

-- BM25 avec poids par colonne
SELECT inspection_id, title, 
       bm25(inspections_fts, 10.0, 5.0, 1.0) as rank
FROM inspections_fts
WHERE inspections_fts MATCH 'playwright'
ORDER BY rank
LIMIT 10;
-- Poids : title=10, description=5, content=1
```

**Recherche avec snippets :**

```sql
-- Extraire des snippets contextuels
SELECT inspection_id,
       snippet(inspections_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
FROM inspections_fts
WHERE inspections_fts MATCH 'playwright'
ORDER BY rank
LIMIT 10;
```

### 4.4 Performance FTS5

**Benchmarks (2026) :**

| Dataset | P50 Latency | P99 Latency | Index Size |
|---------|-------------|-------------|------------|
| **10K docs** | 1.8ms | 4.2ms | 42 MB |
| **100K docs** | 3.5ms | 8.1ms | 180 MB |
| **1M docs** | 8.2ms | 18ms | 1.2 GB |

**Comparaison avec PostgreSQL tsvector :**

| Métrique | SQLite FTS5 | PostgreSQL tsvector |
|----------|-------------|---------------------|
| P50 latency (10K) | 1.8ms | 2.4ms |
| P99 latency (10K) | 4.2ms | 8.0ms |
| nDCG@10 (BEIR) | 0.682 | 0.560 |
| Recall@100 (BEIR) | 0.925 | 0.847 |

**Conclusion :** SQLite FTS5 est compétitif, voire supérieur à PostgreSQL tsvector pour les datasets <1M docs.

---

## 5. Recherche vectorielle (sqlite-vec)

### 5.1 Configuration sqlite-vec

**Installation :**

```bash
npm install sqlite-vec
```

**Tables vectorielles :**

```sql
-- Extension sqlite-vec
-- Tables virtuelles vec0 pour embeddings

-- Embeddings d'inspections
CREATE VIRTUAL TABLE inspection_embeddings USING vec0(
  inspection_id TEXT PRIMARY KEY,
  embedding FLOAT[1536]  -- OpenAI text-embedding-3-small
);

-- Embeddings de ressources
CREATE VIRTUAL TABLE resource_embeddings USING vec0(
  resource_id TEXT PRIMARY KEY,
  embedding FLOAT[1536]
);
```

### 5.2 Génération d'embeddings

**Avec OpenAI :**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536
  });
  
  return response.data[0].embedding;
}

async function indexInspection(inspectionId: string, content: string): Promise<void> {
  const embedding = await generateEmbedding(content);
  
  db.prepare(`
    INSERT OR REPLACE INTO inspection_embeddings (inspection_id, embedding)
    VALUES (?, ?)
  `).run(inspectionId, Buffer.from(new Float32Array(embedding).buffer));
}
```

**Avec modèle local (optionnel) :**

```typescript
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function generateLocalEmbedding(text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```

### 5.3 Requêtes vectorielles

**Recherche par similarité (KNN) :**

```sql
-- Trouver les 10 inspections les plus similaires
SELECT inspection_id, distance
FROM inspection_embeddings
WHERE embedding MATCH ?  -- embedding de la requête
ORDER BY distance
LIMIT 10;
```

**Implémentation TypeScript :**

```typescript
async function searchSimilarInspections(queryText: string, limit: number = 10): Promise<any[]> {
  // 1. Générer embedding de la requête
  const queryEmbedding = await generateEmbedding(queryText);
  const queryBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);
  
  // 2. Recherche KNN
  const results = db.prepare(`
    SELECT inspection_id, distance
    FROM inspection_embeddings
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `).all(queryBuffer, limit);
  
  // 3. Récupérer les inspections complètes
  return results.map(r => {
    const inspection = db.prepare(`
      SELECT * FROM inspections WHERE id = ?
    `).get(r.inspection_id);
    
    return { ...inspection, similarity: 1 - r.distance };
  });
}
```

### 5.4 Performance sqlite-vec

**Benchmarks estimés :**

| Dataset | Latence P50 | Latence P99 | Mémoire |
|---------|-------------|-------------|---------|
| **10K vectors** | 5ms | 10ms | ~50 MB |
| **100K vectors** | 15ms | 30ms | ~500 MB |
| **1M vectors** | 150ms | 300ms | ~5 GB |

**Limites :**
- sqlite-vec utilise brute-force (pas de HNSW)
- Pour >100K vectors, considérer pgvector ou Qdrant
- Pour EKTS (<100K vectors), sqlite-vec est suffisant

---

## 6. Recherche hybride (FTS + Vector)

### 6.1 Principe

**Combiner les deux approches :**
- **FTS5** — précision (mots-clés exacts)
- **Vector** — rappel (similarité sémantique)
- **RRF** — Reciprocal Rank Fusion pour unifier les rankings

### 6.2 Algorithme RRF

```typescript
interface SearchResult {
  id: string;
  fts_rank?: number;      // Position dans résultats FTS
  vector_rank?: number;   // Position dans résultats vector
  score: number;          // Score RRF final
}

function reciprocalRankFusion(
  ftsResults: { id: string }[],
  vectorResults: { id: string }[],
  k: number = 60  // Constante RRF (typiquement 60)
): SearchResult[] {
  const scores = new Map<string, { fts_rank?: number; vector_rank?: number; score: number }>();
  
  // Score FTS
  ftsResults.forEach((r, i) => {
    const fts_score = 1 / (k + i + 1);
    scores.set(r.id, { fts_rank: i + 1, score: fts_score });
  });
  
  // Score Vector
  vectorResults.forEach((r, i) => {
    const vector_score = 1 / (k + i + 1);
    const existing = scores.get(r.id) || { score: 0 };
    scores.set(r.id, {
      ...existing,
      vector_rank: i + 1,
      score: existing.score + vector_score
    });
  });
  
  // Tri par score RRF
  return Array.from(scores.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.score - a.score);
}
```

### 6.3 Implémentation complète

```typescript
async function hybridSearch(
  query: string,
  options: {
    fts_weight?: number;      // Poids FTS (défaut: 0.5)
    vector_weight?: number;   // Poids vector (défaut: 0.5)
    limit?: number;           // Nombre de résultats (défaut: 20)
  } = {}
): Promise<any[]> {
  const { fts_weight = 0.5, vector_weight = 0.5, limit = 20 } = options;
  
  // 1. Recherche FTS
  const ftsResults = db.prepare(`
    SELECT inspection_id, rank
    FROM inspections_fts
    WHERE inspections_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit * 2);  // Sur-échantillonnage
  
  // 2. Recherche vectorielle
  const queryEmbedding = await generateEmbedding(query);
  const queryBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);
  
  const vectorResults = db.prepare(`
    SELECT inspection_id, distance
    FROM inspection_embeddings
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `).all(queryBuffer, limit * 2);
  
  // 3. Fusion RRF
  const fused = reciprocalRankFusion(
    ftsResults.map(r => ({ id: r.inspection_id })),
    vectorResults.map(r => ({ id: r.inspection_id }))
  );
  
  // 4. Récupérer les résultats complets
  const results = fused.slice(0, limit).map(f => {
    const inspection = db.prepare(`
      SELECT * FROM inspections WHERE id = ?
    `).get(f.id);
    
    return {
      ...inspection,
      rrf_score: f.score,
      fts_rank: f.fts_rank,
      vector_rank: f.vector_rank
    };
  });
  
  return results;
}
```

### 6.4 Cas d'usage

**Quand utiliser la recherche hybride :**

| Requête | FTS seul | Vector seul | Hybride |
|---------|----------|-------------|---------|
| "playwright automation" | ✅ Exact match | ⚠️ Approximatif | ✅ Les deux |
| "comment automatiser un navigateur" | ❌ Pas de match exact | ✅ Sémantique | ✅ Les deux |
| "error code 502" | ✅ Exact | ⚠️ Approximatif | ✅ Priorité FTS |
| "feeling stuck on a bug" | ❌ Pas de match | ✅ Sémantique | ✅ Vector |

**Recommandation :** Utiliser hybride par défaut, avec ajustement des poids selon le cas.

---

## 7. API de recherche unifiée

### 7.1 Interface

```typescript
interface SearchOptions {
  query: string;
  type?: 'structured' | 'fulltext' | 'vector' | 'hybrid';
  filters?: {
    domain?: string[];
    type?: string[];
    date_from?: string;
    date_to?: string;
    verified?: boolean;
  };
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'date' | 'title';
}

interface SearchResult {
  id: string;
  type: 'inspection' | 'scrape' | 'resource';
  title: string;
  description?: string;
  url?: string;
  score?: number;
  snippet?: string;
  metadata: Record<string, any>;
}

async function search(options: SearchOptions): Promise<{
  results: SearchResult[];
  total: number;
  took_ms: number;
}> {
  const start = Date.now();
  
  // 1. Déterminer le type de recherche
  const searchType = options.type || inferSearchType(options.query);
  
  // 2. Exécuter la recherche
  let results: SearchResult[];
  
  switch (searchType) {
    case 'structured':
      results = await structuredSearch(options);
      break;
    case 'fulltext':
      results = await fulltextSearch(options);
      break;
    case 'vector':
      results = await vectorSearch(options);
      break;
    case 'hybrid':
      results = await hybridSearchUnified(options);
      break;
  }
  
  // 3. Appliquer les filtres
  if (options.filters) {
    results = applyFilters(results, options.filters);
  }
  
  // 4. Pagination
  const total = results.length;
  results = results.slice(options.offset || 0, (options.offset || 0) + (options.limit || 20));
  
  return {
    results,
    total,
    took_ms: Date.now() - start
  };
}
```

### 7.2 Inférence du type de recherche

```typescript
function inferSearchType(query: string): 'structured' | 'fulltext' | 'vector' | 'hybrid' {
  // Requêtes avec opérateurs SQL → structured
  if (query.includes(':') || query.includes('=') || query.includes('>')) {
    return 'structured';
  }
  
  // Requêtes très courtes ou techniques → fulltext
  if (query.split(' ').length <= 2 || /[\d\.]+/.test(query)) {
    return 'fulltext';
  }
  
  // Questions longues ou langage naturel → hybrid
  if (query.startsWith('how') || query.startsWith('what') || query.startsWith('why') || query.split(' ').length > 5) {
    return 'hybrid';
  }
  
  // Défaut → hybrid
  return 'hybrid';
}
```

---

## 8. Outils MCP pour la recherche

### 8.1 Tool : `search_resources`

**Description :** Recherche unifiée dans EKTS

**Entrées :**

```typescript
{
  query: string;
  type?: 'auto' | 'structured' | 'fulltext' | 'vector' | 'hybrid';
  filters?: {
    domain?: string[];
    resource_type?: string[];
    date_from?: string;
    date_to?: string;
    verified?: boolean;
    tags?: string[];
  };
  limit?: number;
  offset?: number;
}
```

**Sorties :**

```typescript
{
  success: boolean;
  results?: SearchResult[];
  total?: number;
  took_ms?: number;
  error?: string;
}
```

### 8.2 Tool : `get_resource`

**Description :** Récupère une ressource spécifique

**Entrées :**

```typescript
{
  id: string;
  include_content?: boolean;
}
```

**Sorties :**

```typescript
{
  success: boolean;
  resource?: Resource;
  error?: string;
}
```

### 8.3 Tool : `list_inspections`

**Description :** Liste les inspections avec filtres

**Entrées :**

```typescript
{
  domain?: string;
  level?: 'L1' | 'L2' | 'L3' | 'L4';
  status?: 'success' | 'partial' | 'error';
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
```

**Sorties :**

```typescript
{
  success: boolean;
  inspections?: Inspection[];
  total?: number;
  error?: string;
}
```

---

## 9. Performance et optimisation

### 9.1 Cache de recherche

```typescript
const searchCache = new Map<string, { results: any[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedSearch(options: SearchOptions): Promise<any> {
  const cacheKey = JSON.stringify(options);
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }
  
  const results = await search(options);
  searchCache.set(cacheKey, { results, timestamp: Date.now() });
  
  return results;
}
```

### 9.2 Optimisation FTS5

```sql
-- Optimiser l'index FTS5
INSERT INTO inspections_fts(inspections_fts) VALUES('optimize');

-- Vacuum la table FTS
INSERT INTO inspections_fts(inspections_fts) VALUES('rebuild');
```

### 9.3 Batch indexing

```typescript
async function batchIndexEmbeddings(items: { id: string; content: string }[]): Promise<void> {
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    // Générer embeddings en parallèle
    const embeddings = await Promise.all(
      batch.map(item => generateEmbedding(item.content))
    );
    
    // Insérer en batch
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO resource_embeddings (resource_id, embedding)
      VALUES (?, ?)
    `);
    
    const transaction = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.id, Buffer.from(new Float32Array(item.embedding).buffer));
      }
    });
    
    transaction(batch.map((item, i) => ({ id: item.id, embedding: embeddings[i] })));
  }
}
```

---

## 10. Limites et incertitudes

### 10.1 Limites FTS5

- **Pas de fuzzy matching** natif (nécessite extension)
- **Pas de spell checking** (à implémenter côté application)
- **Langues limitées** — stemming principalement anglais

### 10.2 Limites sqlite-vec

- **Brute-force only** — pas de HNSW ou IVF
- **>100K vectors** — performance dégrade
- **Pas de quantization** — embeddings full precision

### 10.3 Non vérifié

- Performance hybride sur >100K documents
- Qualité du ranking RRF vs cross-encoders
- Latence embedding generation pour requêtes temps réel

---

## 11. Décisions

### Décisions prises

1. **3 niveaux de recherche** — structurée, full-text, vectorielle
2. **FTS5 pour full-text** — compétitif avec PostgreSQL tsvector
3. **sqlite-vec pour vectors** — suffisant pour <100K vectors
4. **Recherche hybride par défaut** — RRF pour unifier FTS + vector
5. **API unifiée** — interface commune pour tous les types de recherche

### Décisions reportées

- Migration vers pgvector si >100K vectors
- Cross-encoders pour re-ranking (Phase 07)
- Spell checking et fuzzy matching

---

## 12. Sources

### Documentation
- **SQLite FTS5** : https://www.sqlite.org/fts5.html
- **sqlite-vec** : https://github.com/asg017/sqlite-vec
- **Reciprocal Rank Fusion** : Cormack et al., "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods"

### Benchmarks
- **getoyma.com** — "SQLite FTS5 Full-Text Search in Notes" (oct. 2026)
- **github.com/nazmul284** — "search-without-elasticsearch" (benchmarks BEIR)
- **hkfi.dev** — "From Keyword Search to Vector Search: A Practical Guide with SQLite"

---

**Livrable rédigé le 21 octobre 2026 — Phase 06 du projet EKTS**
