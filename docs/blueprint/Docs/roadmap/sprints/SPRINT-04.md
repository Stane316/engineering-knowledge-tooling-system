# Sprint 4 — Search Engine (Semaine 7-8)

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 2 semaines (10 jours ouvrables)  
**Objectif :** Implémenter la recherche hybride (FTS + Vector + RRF)  
**MVP :** MVP-1 (Knowledge Management Tool)

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Périmètre du sprint](#2-périmètre-du-sprint)
3. [État initial et prérequis](#3-état-initial-et-prérequis)
4. [Décomposition en sous-sprints](#4-décomposition-en-sous-sprints)
5. [Choix techniques et références](#5-choix-techniques-et-références)
6. [Organisation des fichiers](#6-organisation-des-fichiers)
7. [Tests et validation](#7-tests-et-validation)
8. [Critères d'acceptation du sprint](#8-critères-dacceptation-du-sprint)
9. [Livrables attendus](#9-livrables-attendus)
10. [Procédure de fin de sprint](#10-procédure-de-fin-de-sprint)
11. [Prompt de lancement pour agent](#11-prompt-de-lancement-pour-agent)
12. [Résumé](#12-résumé)

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le **Sprint 3 (Knowledge Manager)** a mis en place :
- ✅ Knowledge Manager CRUD (5 méthodes)
- ✅ Indexation FTS automatique (FTS5)
- ✅ Tests > 80% couverture
- ✅ Documentation API

Le **Sprint 4 (Search Engine)** va :
- 🎯 Implémenter la recherche full-text via FTS5 (BM25)
- 🎯 Générer des embeddings vectoriels (OpenAI)
- 🎯 Implémenter la recherche vectorielle (sqlite-vec)
- 🎯 Fusionner les résultats via RRF (Reciprocal Rank Fusion)
- 🎯 Valider les benchmarks (Recall@5 ≥ 0.75, Faithfulness ≥ 0.80)

### 1.2 Objectifs du Sprint 4

**Objectif principal :** Implémenter un moteur de recherche hybride qui combine recherche textuelle (FTS5 BM25) et recherche sémantique (vecteurs + cosine similarity), avec fusion via RRF.

**Objectifs secondaires :**
- 🎯 Atteindre Recall@5 ≥ 0.75 (rappel à 5 résultats)
- 🎯 Atteindre Faithfulness ≥ 0.80 (fidélité aux résultats pertinents)
- 🎯 Latence < 500ms pour 100K documents
- 🎯 Tests unitaires > 80% couverture
- 🎯 Documentation API complète

### 1.3 Pourquoi ce sprint est critique

Le Search Engine est le **cœur de la valeur** du MVP-1. C'est lui qui :
- Permet aux utilisateurs de retrouver leurs ressources rapidement
- Combine recherche textuelle (mots-clés) et sémantique (sens)
- Garantit la qualité des résultats (Recall@5 ≥ 0.75)
- Prépare le terrain pour la CLI (Sprint 5) et le MCP Server (Sprint 6)

**Si le Search Engine échoue, le MVP-1 ne délivre pas sa promesse principale.**

---

## 2. Périmètre du sprint

### 2.1 Ce qui est inclus

| # | Composant | Description | Fichier |
|---|-----------|-------------|---------|
| 1 | Recherche FTS5 (BM25) | Recherche full-text avec scoring BM25 | `src/business/search-engine.ts` |
| 2 | Génération embeddings | Appel API OpenAI pour embeddings | `src/business/embeddings.ts` |
| 3 | Recherche vectorielle | Recherche cosine similarity via sqlite-vec | `src/business/search-engine.ts` |
| 4 | Fusion RRF | Reciprocal Rank Fusion (k=60) | `src/business/search-engine.ts` |
| 5 | Indexation vectorielle | Stocker embeddings dans ekts-vectors.db | `src/business/embeddings.ts` |
| 6 | Tests unitaires | Tests Search Engine + Embeddings | `tests/business/` |
| 7 | Benchmarks | Recall@5, Faithfulness | `tests/benchmark/` |
| 8 | Documentation | API Search Engine | `docs/SEARCH_ENGINE.md` |

### 2.2 Ce qui est exclu

| Exclu | Raison | Reporté à |
|-------|--------|-----------|
| ❌ CLI | Interface ligne de commande | Sprint 5 |
| ❌ MCP Server | Exposition aux agents IA | Sprint 6 |
| ❌ Recherche avancée | Filtres complexes, facets | Optionnel |
| ❌ Cache | Redis, cache résultats | Optimisation future |
| ❌ Pagination | LIMIT/OFFSET avancé | CLI (Sprint 5) |

### 2.3 Dépendances

**Ce que le Sprint 4 utilise depuis les Sprints précédents :**
- ✅ Data Layer (3 bases SQLite) — Sprint 2
- ✅ Knowledge Manager (CRUD + FTS) — Sprint 3
- ✅ Repository Resource — Sprint 2
- ✅ Indexer FTS — Sprint 3
- ✅ Validation Zod — Sprint 2

**Ce que le Sprint 4 prépare pour les Sprints suivants :**
- 🎯 Interface `ISearchEngine` (pour CLI et MCP Server)
- 🎯 Méthode `search(query, options)` (utilisée par CLI)
- 🎯 Benchmarks validés (Recall@5 ≥ 0.75)

---

## 3. État initial et prérequis

### 3.1 État initial (fin Sprint 3)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── business/
│   │   ├── knowledge-manager.ts        ✅ (5 méthodes CRUD)
│   │   ├── knowledge-manager.types.ts  ✅ (interfaces)
│   │   └── indexer.ts                  ✅ (FTSIndexer)
│   ├── data/
│   │   ├── database.ts                 ✅ (ekts.db)
│   │   ├── fts.ts                      ✅ (ekts-fts.db)
│   │   ├── vectors.ts                  ✅ (ekts-vectors.db)
│   │   ├── resource-repository.ts      ✅ (CRUD)
│   │   └── schema.sql                  ✅ (FTS5 + sqlite-vec)
│   ├── schemas/
│   │   └── resource.ts                 ✅ (Zod)
│   └── types/
│       └── resource.ts                 ✅ (Resource, ResourceFilters)
├── tests/
│   └── business/
│       ├── knowledge-manager.test.ts   ✅ (> 80% couverture)
│       └── indexer.test.ts             ✅ (> 80% couverture)
└── docs/
    └── KNOWLEDGE_MANAGER.md            ✅
```

### 3.2 Prérequis obligatoires

**Avant de commencer Sprint 4, vérifier :**

```bash
# 1. Sprint 3 terminé avec succès
ls -la src/business/knowledge-manager.ts
ls -la src/business/indexer.ts
# ✅ Fichiers existent

# 2. Tests Sprint 3
npm test tests/business/
# ✅ Tests passent

# 3. 3 bases SQLite créées
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent

# 4. FTS5 opérationnel
sqlite3 data/ekts-fts.db ".tables"
# ✅ resources_fts existe

# 5. sqlite-vec opérationnel
sqlite3 data/ekts-vectors.db ".tables"
# ✅ resources_vectors existe

# 6. Compilation TypeScript
npm run build
# ✅ Aucune erreur
```

### 3.3 Prérequis compétences

**L'agent de développement doit maîtriser :**
- ✅ TypeScript intermédiaire (interfaces, classes, async/await)
- ✅ SQLite FTS5 (requêtes full-text, BM25)
- ✅ SQLite sqlite-vec (recherche vectorielle, cosine similarity)
- 🟡 OpenAI API (génération embeddings) — peut apprendre
- 🟡 Information retrieval (RRF, Recall, Faithfulness) — peut apprendre

### 3.4 Variables d'environnement requises

**Créer `.env` à la racine du projet :**

```bash
# OpenAI API Key (obligatoire pour embeddings)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Modèle d'embedding (optionnel, défaut: text-embedding-3-small)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Dimension embeddings (1536 pour text-embedding-3-small)
EMBEDDING_DIMENSION=1536
```

**Note :** L'API OpenAI est **payante** (~$0.02 pour 1M tokens). Prévoir un budget minimum.

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif | Tâches |
|-------------|-------|----------|--------|
| **Sprint 4-1** | 4 jours | Recherche FTS5 + Vectorielle | 4.1, 4.3 |
| **Sprint 4-2** | 3 jours | Génération embeddings + indexation vectorielle | 4.2 |
| **Sprint 4-3** | 3 jours | Fusion RRF + benchmarks + documentation | 4.4, 4.5, 4.6, 4.7 |

### 4.2 Sprint 4-1 — Recherche FTS5 + Vectorielle

**Durée :** 4 jours  
**Objectif :** Implémenter les 2 moteurs de recherche séparément

**Tâches :**
- ✅ 4.1 Recherche FTS5 (BM25) — 8h
- ✅ 4.3 Recherche vectorielle (sqlite-vec) — 8h

**Détail :** Voir document `SPRINT-04-01.md`

**Critères de validation :**
- ✅ FTS5 search retourne résultats triés par BM25
- ✅ Vector search retourne résultats triés par cosine similarity
- ✅ Tests unitaires pour chaque moteur
- ✅ Couverture > 80%

### 4.3 Sprint 4-2 — Génération embeddings + indexation vectorielle

**Durée :** 3 jours  
**Objectif :** Générer embeddings via OpenAI et les indexer dans sqlite-vec

**Tâches :**
- ✅ 4.2 Génération embeddings (OpenAI) — 8h
- ✅ Indexation vectorielle automatique (à chaque add/update) — 4h

**Détail :** Voir document `SPRINT-04-02.md`

**Critères de validation :**
- ✅ Embeddings générés via OpenAI API
- ✅ Embeddings stockés dans ekts-vectors.db
- ✅ Indexation vectorielle automatique à chaque add/update/delete
- ✅ Tests unitaires > 80%

### 4.4 Sprint 4-3 — Fusion RRF + benchmarks + documentation

**Durée :** 3 jours  
**Objectif :** Fusionner les 2 moteurs via RRF et valider les benchmarks

**Tâches :**
- ✅ 4.4 Fusion RRF (k=60) — 8h
- ✅ 4.5 Tests unitaires Search Engine — 4h
- ✅ 4.6 Benchmark Recall@5, Faithfulness — 8h
- ✅ 4.7 Documentation Search Engine — 4h

**Détail :** Voir document `SPRINT-04-03.md`

**Critères de validation :**
- ✅ RRF fusion fonctionne correctement
- ✅ Recall@5 ≥ 0.75
- ✅ Faithfulness ≥ 0.80
- ✅ Latence < 500ms (100K documents)
- ✅ Documentation API complète

---

## 5. Choix techniques et références

### 5.1 Architecture Search Engine

**Décision :** Implémenter le Search Engine comme un service qui orchestre FTS, Vector et RRF.

**Référence :** Architecture C Hybride (ADR-005)

**Pattern :**
```typescript
class SearchEngine implements ISearchEngine {
  constructor(
    private ftsRepository: FTSRepository,
    private vectorRepository: VectorRepository,
    private embeddingsService: EmbeddingsService
  ) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // 1. Recherche FTS (BM25)
    const ftsResults = await this.ftsRepository.search(query);
    
    // 2. Génération embedding requête
    const queryEmbedding = await this.embeddingsService.embed(query);
    
    // 3. Recherche vectorielle (cosine similarity)
    const vectorResults = await this.vectorRepository.search(queryEmbedding);
    
    // 4. Fusion RRF
    const mergedResults = this.fuseResults(ftsResults, vectorResults);
    
    return mergedResults;
  }
}
```

**Avantages :**
- ✅ Couplage faible (injection dépendances)
- ✅ Testabilité (mock FTS, Vector, Embeddings)
- ✅ Extensibilité (ajouter d'autres moteurs)

### 5.2 Recherche FTS5 (BM25)

**Décision :** Utiliser FTS5 avec scoring BM25 pour la recherche textuelle.

**Référence :** ADR-001 (SQLite WAL + FTS5 + sqlite-vec)

**Implémentation :**
```sql
SELECT 
  r.id,
  r.title,
  r.url,
  r.tags,
  bm25(resources_fts, 10.0, 5.0, 1.0) as score
FROM resources_fts
JOIN resources r ON r.id = resources_fts.rowid
WHERE resources_fts MATCH ?
ORDER BY score DESC
LIMIT 10;
```

**Pondération BM25 :**
- `title` : poids 10.0 (titre très important)
- `content` : poids 5.0 (contenu important)
- `tags` : poids 1.0 (tags moins importants)

**Alternatives considérées :**
- ❌ PostgreSQL + pgvector : plus complexe, nécessite serveur
- ❌ Elasticsearch : overkill pour usage local
- ✅ SQLite FTS5 : simple, rapide, embedded

### 5.3 Génération embeddings (OpenAI)

**Décision :** Utiliser l'API OpenAI pour générer des embeddings vectoriels.

**Référence :** ADR-001 (embeddings OpenAI text-embedding-3-small)

**Modèle :** `text-embedding-3-small`
- Dimension : 1536
- Coût : ~$0.02 / 1M tokens
- Performance : bonne qualité, rapide

**Implémentation :**
```typescript
import OpenAI from 'openai';

class EmbeddingsService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }
}
```

**Alternatives considérées :**
- ❌ Ollama (local) : nécessite GPU, plus lent
- ❌ HuggingFace Transformers : complexe à intégrer
- ✅ OpenAI API : simple, rapide, bonne qualité

**Note :** Le choix d'OpenAI est **réversible** (feature flag `EKTS_EMBEDDINGS_PROVIDER=openai|ollama`).

### 5.4 Recherche vectorielle (sqlite-vec)

**Décision :** Utiliser sqlite-vec pour la recherche vectorielle (cosine similarity).

**Référence :** ADR-001 (sqlite-vec)

**Implémentation :**
```sql
SELECT 
  resource_id,
  1 - (embedding <=> ?) as similarity  -- cosine similarity
FROM resources_vectors
ORDER BY similarity DESC
LIMIT 10;
```

**Note :** sqlite-vec utilise l'opérateur `<=>` pour la distance cosine.

**Alternatives considérées :**
- ❌ PostgreSQL + pgvector : plus complexe
- ❌ FAISS : nécessite installation native
- ✅ sqlite-vec : simple, embedded, rapide

### 5.5 Fusion RRF (Reciprocal Rank Fusion)

**Décision :** Utiliser RRF pour fusionner les résultats FTS et Vector.

**Référence :** ADR-001 (recherche hybride)

**Algorithme :**
```
score_rrf(d) = Σ 1/(k + rank_i(d))
  où k = 60 (constante de lissage)
  et rank_i(d) = rang du document d dans la liste i
```

**Implémentation :**
```typescript
function fuseResults(
  ftsResults: SearchResult[],
  vectorResults: SearchResult[],
  k: number = 60
): SearchResult[] {
  const scores = new Map<string, number>();

  // FTS results
  ftsResults.forEach((result, index) => {
    const rank = index + 1;
    const score = 1 / (k + rank);
    scores.set(result.id, (scores.get(result.id) ?? 0) + score);
  });

  // Vector results
  vectorResults.forEach((result, index) => {
    const rank = index + 1;
    const score = 1 / (k + rank);
    scores.set(result.id, (scores.get(result.id) ?? 0) + score);
  });

  // Tri par score RRF
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id, score }));
}
```

**Pourquoi RRF ?**
- ✅ Simple à implémenter
- ✅ Robuste (ne nécessite pas de normalisation des scores)
- ✅ Performant (state-of-the-art pour fusion hybride)
- ✅ Paramètre unique (k=60)

**Alternatives considérées :**
- ❌ Moyenne pondérée : nécessite normalisation
- ❌ Apprentissage (Learning to Rank) : trop complexe
- ✅ RRF : simple, efficace

### 5.6 Benchmarks

**Décision :** Valider Recall@5 ≥ 0.75 et Faithfulness ≥ 0.80.

**Référence :** Architecture technique §4.2.2

**Métriques :**

**Recall@5 :**
```
Recall@5 = |documents pertinents dans top 5| / |total documents pertinents|
Objectif : ≥ 0.75
```

**Faithfulness :**
```
Faithfulness = |documents pertinents dans résultats| / |total résultats|
Objectif : ≥ 0.80
```

**Dataset de test :**
- Créer un dataset de ~100 ressources avec labels de pertinence
- Tester 20 requêtes avecground truth
- Calculer Recall@5 et Faithfulness

### 5.7 Gestion des erreurs

**Décision :** Utiliser des erreurs personnalisées.

**Erreurs à gérer :**
- `SearchError` — Erreur de recherche (FTS ou Vector)
- `EmbeddingsError` — Erreur génération embeddings (API OpenAI)
- `FusionError` — Erreur fusion RRF

**Implémentation :**
```typescript
async search(query: string): Promise<SearchResult[]> {
  try {
    // Recherche
  } catch (error) {
    throw new SearchError(`Search failed: ${error.message}`, error);
  }
}
```

---

## 6. Organisation des fichiers

### 6.1 Structure après Sprint 4

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── business/
│   │   ├── knowledge-manager.ts        ✅ (Sprint 3)
│   │   ├── knowledge-manager.types.ts  ✅ (Sprint 3)
│   │   ├── indexer.ts                  ✅ (Sprint 3)
│   │   ├── search-engine.ts            🆕 (Sprint 4 — recherche hybride)
│   │   ├── search-engine.types.ts      🆕 (Sprint 4 — interfaces)
│   │   ├── embeddings.ts               🆕 (Sprint 4 — OpenAI embeddings)
│   │   └── rrf.ts                      🆕 (Sprint 4 — fusion RRF)
│   ├── data/
│   │   ├── database.ts                 ✅ (Sprint 2)
│   │   ├── fts.ts                      ✅ (Sprint 2)
│   │   ├── vectors.ts                  ✅ (Sprint 2)
│   │   ├── resource-repository.ts      ✅ (Sprint 2)
│   │   ├── fts-repository.ts           🆕 (Sprint 4 — recherche FTS)
│   │   └── vector-repository.ts        🆕 (Sprint 4 — recherche vectorielle)
│   ├── schemas/
│   │   └── resource.ts                 ✅ (Sprint 2)
│   ├── types/
│   │   └── resource.ts                 ✅ (Sprint 2)
│   └── utils/
│       ├── id.ts                       ✅ (Sprint 1)
│       ├── timestamp.ts                ✅ (Sprint 1)
│       └── errors.ts                   ✅ (Sprint 2)
├── tests/
│   ├── business/
│   │   ├── knowledge-manager.test.ts   ✅ (Sprint 3)
│   │   ├── indexer.test.ts             ✅ (Sprint 3)
│   │   ├── search-engine.test.ts       🆕 (Sprint 4)
│   │   ├── embeddings.test.ts          🆕 (Sprint 4)
│   │   └── rrf.test.ts                 🆕 (Sprint 4)
│   └── benchmark/
│       └── search-benchmark.ts         🆕 (Sprint 4 — Recall@5, Faithfulness)
├── docs/
│   ├── DATA_LAYER.md                   ✅ (Sprint 2)
│   ├── KNOWLEDGE_MANAGER.md            ✅ (Sprint 3)
│   └── SEARCH_ENGINE.md                🆕 (Sprint 4)
└── .env                                🆕 (Sprint 4 — OPENAI_API_KEY)
```

### 6.2 Fichiers à créer

| Fichier | Lignes estimées | Description |
|---------|-----------------|-------------|
| `src/business/search-engine.ts` | ~120 | Search Engine (search, fuse) |
| `src/business/search-engine.types.ts` | ~40 | Interfaces (ISearchEngine, SearchResult) |
| `src/business/embeddings.ts` | ~60 | EmbeddingsService (embed, embedBatch) |
| `src/business/rrf.ts` | ~50 | Fonction fusion RRF |
| `src/data/fts-repository.ts` | ~80 | FTSRepository (search FTS) |
| `src/data/vector-repository.ts` | ~80 | VectorRepository (search vectorielle) |
| `tests/business/search-engine.test.ts` | ~200 | Tests Search Engine |
| `tests/business/embeddings.test.ts` | ~100 | Tests Embeddings |
| `tests/business/rrf.test.ts` | ~100 | Tests RRF |
| `tests/benchmark/search-benchmark.ts` | ~150 | Benchmarks Recall@5, Faithfulness |
| `docs/SEARCH_ENGINE.md` | ~250 | Documentation API |
| `.env.example` | ~10 | Template variables d'environnement |

**Total :** ~1 240 lignes de code + documentation

---

## 7. Tests et validation

### 7.1 Stratégie de test

**Niveaux de test :**
- ✅ Tests unitaires Search Engine (mock FTS, Vector, Embeddings)
- ✅ Tests unitaires Embeddings (mock OpenAI API)
- ✅ Tests unitaires RRF (fusion algorithm)
- ✅ Benchmarks (Recall@5, Faithfulness)

**Outils :**
- Vitest (test runner)
- Mocks Vitest (vi.fn(), vi.mock())
- Dataset de test (100 ressources + ground truth)

### 7.2 Couverture cible

**Objectif :** > 80% couverture sur `src/business/` et `src/data/`

**Mesure :**
```bash
npm run test:coverage -- tests/business/ tests/data/
# ✅ Statements > 80%
# ✅ Branches > 80%
# ✅ Functions > 80%
# ✅ Lines > 80%
```

### 7.3 Scénarios à tester

**Tests unitaires Search Engine :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Recherche hybride | `search` | Résultats fusionnés (FTS + Vector) |
| Recherche FTS uniquement | `searchFTS` | Résultats FTS triés par BM25 |
| Recherche vectorielle uniquement | `searchVector` | Résultats vectoriels triés par similarity |
| Fusion RRF | `fuseResults` | Résultats triés par score RRF |
| Erreur FTS | `search` | SearchError thrown |
| Erreur embeddings | `search` | EmbeddingsError thrown |

**Tests unitaires RRF :**

| Scénario | Fonction | Résultat attendu |
|----------|----------|------------------|
| Fusion 2 listes | `fuseResults` | Scores RRF calculés |
| Liste vide | `fuseResults` | Résultats vides |
| Chevauchement documents | `fuseResults` | Scores cumulés |
| k=60 | `fuseResults` |_scores corrects |

**Benchmarks :**

| Métrique | Cible | Validation |
|----------|-------|------------|
| Recall@5 | ≥ 0.75 | Test sur 20 requêtes |
| Faithfulness | ≥ 0.80 | Test sur 20 requêtes |
| Latence | < 500ms | Test sur 100K documents |

---

## 8. Critères d'acceptation du sprint

### 8.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C4.1 | Recherche FTS5 (BM25) fonctionne | Test unitaire passe |
| C4.2 | Génération embeddings (OpenAI) fonctionne | Test unitaire passe |
| C4.3 | Recherche vectorielle (sqlite-vec) fonctionne | Test unitaire passe |
| C4.4 | Fusion RRF (k=60) fonctionne | Test unitaire passe |
| C4.5 | Indexation vectorielle automatique | Test intégration passe |
| C4.6 | Recall@5 ≥ 0.75 | Benchmark passe |
| C4.7 | Faithfulness ≥ 0.80 | Benchmark passe |
| C4.8 | Latence < 500ms (100K documents) | Benchmark passe |

### 8.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C4.9 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C4.10 | Compilation TypeScript OK | `npm run build` |
| C4.11 | Linting OK | `npm run lint` |
| C4.12 | Documentation API complète | `docs/SEARCH_ENGINE.md` existe |

### 8.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C4.13 | Code lisible (JSDoc, commentaires) | Revue code |
| C4.14 | Couplage faible (injection dépendances) | Revue architecture |
| C4.15 | Gestion erreurs robuste | Revue code |
| C4.16 | Configuration via variables d'environnement | `.env` utilisé |

### 8.4 Traçabilité de l'implémentation (état au 22/10/2026)

Commits : `246638a` (moteur + tests), `4a8915d` (benchmark, `.env`, CI),
`55663fa` (documentation). CI verte sur 6 jobs : qualité Ubuntu/Windows ×
Node 22/24, benchmark, détection de secrets.

| # | Critère | État | Preuve |
|---|---------|------|--------|
| C4.1 | Recherche FTS5 (BM25) | ✅ | `src/data/fts-repository.ts` ; `tests/integration/fts-repository.test.ts` (13 tests : pondération, AND, ponctuation, accents, tri) |
| C4.2 | Embeddings OpenAI | ✅ | `src/business/embeddings.ts` ; `tests/unit/embeddings.test.ts` + `tests/integration/embeddings-openai.test.ts` (SDK réel, `fetch` intercepté, aucun réseau) |
| C4.3 | Recherche vectorielle | ✅ | `src/data/vector-repository.ts` ; `tests/integration/vector-repository.test.ts` (11 tests : KNN, normalisation, upsert, orphelins) |
| C4.4 | Fusion RRF (k = 60) | ✅ | `src/business/rrf.ts` ; `tests/unit/rrf.test.ts` (15 tests) |
| C4.5 | Indexation vectorielle automatique | ✅ | `src/business/vector-indexer.ts` (`withVectorIndexing`) ; `tests/integration/vector-indexer.test.ts` (11 tests : add/update/delete/reindex) |
| C4.6 | Recall@5 ≥ 0.75 | ✅ **1.000** | `npm run test:benchmark` — 100 000 docs / 100 000 vecteurs |
| C4.7 | Faithfulness ≥ 0.80 | ✅ **1.000** | Idem (proxy lexicale déterministe, voir écart E4-9) |
| C4.8 | Latence < 500 ms sur 100K docs | ✅ **p95 308 ms** | Idem (hybride, 100 000 documents + 100 000 vecteurs) |
| C4.9 | Couverture > 80 % | ✅ **100 %** | `npm run test:coverage` — 240 tests, lignes/branches/fonctions à 100 % |
| C4.10 | Compilation TypeScript | ✅ | `npm run build` (NodeNext, strict, `noUncheckedIndexedAccess`) |
| C4.11 | Linting | ✅ | `npm run lint` (ESLint 10 flat config) + `npm run format:check` |
| C4.12 | Documentation API | ✅ | `docs/guides/SEARCH_ENGINE.md` |
| C4.13 | Code lisible (JSDoc) | ✅ | JSDoc sur toutes les fonctions et classes publiques ; commentaires des décisions non évidentes |
| C4.14 | Couplage faible (DI) | ✅ | `SearchEngine(dependencies)`, `EmbeddingsService({ provider })`, `VectorIndexer(embeddings, vectors)`, `createEmbeddingsService({ env, fetch, client })` |
| C4.15 | Gestion d'erreurs robuste | ✅ | `SearchError` / `EmbeddingsError` / `FusionError` ; tout `SqliteError` est encapsulé (`tests/integration/search-errors.test.ts`) |
| C4.16 | Configuration par environnement | ✅ | `.env.example` versionné, `.env` ignoré (git + Gitleaks) |

### 8.5 Écarts assumés par rapport au dossier de sprint

Le dossier de spécification a été écrit avant l'étude de `sqlite-vec` 0.1.9 et
de FTS5 ; dix énoncés se sont révélés inexacts ou inapplicables. Ils ont été
vérifiés empiriquement (SQL exécuté, erreur reproduite) avant d'être tranchés.
Le détail, la preuve et la décision pour chacun figurent dans
`docs/guides/SEARCH_ENGINE.md` §7 (E4-1 à E4-10). Les cinq plus structurants :

| Écart | Énoncé du dossier | Réalité vérifiée | Décision |
|-------|-------------------|------------------|----------|
| E4-1 | `JOIN ... ON r.id = resources_fts.rowid` | `id` est un UUID `TEXT`, `rowid` un entier : 0 résultat | Jointure sur `resource_id` |
| E4-2 | `bm25(..., 10, 5, 1)` | Un poids **par colonne** : `resource_id` recevait 10.0 | `bm25(..., 0.0, 10.0, 5.0, 1.0)` |
| E4-3 | `ORDER BY score DESC` | BM25 est négatif → `DESC` inverse le classement | `ORDER BY score ASC` |
| E4-4/5 | `<=>` et `INSERT OR REPLACE` | Opérateur inexistant ; contrainte d'unicité sur `vec0` | `MATCH ? AND k = ?` ; `DELETE` + `INSERT` |
| E4-8 | Modifier `KnowledgeManager` | Interdit par la mission | Décorateur `withVectorIndexing()` |

Deux écarts concernent le **protocole de mesure** : E4-9 (Faithfulness évaluée
par une proxy lexicale, faute de LLM hors ligne) et le corpus du benchmark
(requêtes construites à partir du titre cible) — protocole complet dans
`docs/guides/SEARCH_ENGINE.md` §6.

---

## 9. Livrables attendus

### 9.1 Code

| Fichier | Description | Validation |
|---------|-------------|------------|
| `src/business/search-engine.ts` | Search Engine (search, fuse) | Test unitaire passe |
| `src/business/search-engine.types.ts` | Interfaces (ISearchEngine) | Compilation OK |
| `src/business/embeddings.ts` | EmbeddingsService (OpenAI) | Test unitaire passe |
| `src/business/rrf.ts` | Fonction fusion RRF | Test unitaire passe |
| `src/data/fts-repository.ts` | FTSRepository (search FTS) | Test unitaire passe |
| `src/data/vector-repository.ts` | VectorRepository (search vectorielle) | Test unitaire passe |

### 9.2 Tests

| Fichier | Description | Validation |
|---------|-------------|------------|
| `tests/business/search-engine.test.ts` | Tests unitaires Search Engine | > 80% couverture |
| `tests/business/embeddings.test.ts` | Tests unitaires Embeddings | > 80% couverture |
| `tests/business/rrf.test.ts` | Tests unitaires RRF | > 80% couverture |
| `tests/benchmark/search-benchmark.ts` | Benchmarks Recall@5, Faithfulness | Recall@5 ≥ 0.75 |

### 9.3 Documentation

| Fichier | Description | Validation |
|---------|-------------|------------|
| `docs/SEARCH_ENGINE.md` | Documentation API | Complète + exemples |
| `.env.example` | Template variables d'environnement | OPENAI_API_KEY documenté |

### 9.4 Configuration

| Fichier | Description | Validation |
|---------|-------------|------------|
| `.env` | Variables d'environnement locales | OPENAI_API_KEY configuré |
| `.gitignore` | Exclure `.env` | `.env` dans .gitignore |

### 9.5 Commits Git

```bash
# Sprint 4-1
git commit -m "feat(data): implement FTS repository with BM25 scoring"
git commit -m "feat(data): implement vector repository with cosine similarity"
git commit -m "test(data): add tests for FTS and vector repositories"
git push origin feat/sprint-4-1

# Sprint 4-2
git commit -m "feat(business): implement embeddings service (OpenAI)"
git commit -m "feat(business): integrate vector indexing in Knowledge Manager"
git commit -m "test(business): add tests for embeddings service"
git commit -m "chore: add .env.example with OPENAI_API_KEY"
git push origin feat/sprint-4-2

# Sprint 4-3
git commit -m "feat(business): implement RRF fusion algorithm"
git commit -m "feat(business): implement search engine (hybrid search)"
git commit -m "test(business): add tests for search engine and RRF"
git commit -m "perf(benchmark): validate Recall@5 and Faithfulness"
git commit -m "docs: add Search Engine API documentation"
git push origin feat/sprint-4-3
```

---

## 10. Procédure de fin de sprint

### 10.1 Vérifications finales

**Avant de clôturer le Sprint 4 :**

```bash
# 1. Tests unitaires
npm test
# ✅ Tous les tests passent

# 2. Couverture
npm run test:coverage
# ✅ > 80% couverture sur src/business/ et src/data/

# 3. Benchmarks
npm run test:benchmark
# ✅ Recall@5 ≥ 0.75
# ✅ Faithfulness ≥ 0.80

# 4. Compilation
npm run build
# ✅ Aucune erreur TypeScript

# 5. Linting
npm run lint
# ✅ Aucune erreur

# 6. Vérification fichiers
ls -la src/business/search-engine.ts
ls -la src/business/embeddings.ts
ls -la src/business/rrf.ts
ls -la src/data/fts-repository.ts
ls -la src/data/vector-repository.ts
# ✅ Tous les fichiers existent

ls -la tests/benchmark/search-benchmark.ts
# ✅ Benchmark existe

ls -la docs/SEARCH_ENGINE.md
# ✅ Documentation existe

# 7. Vérification .env
cat .env
# ✅ OPENAI_API_KEY configuré

grep ".env" .gitignore
# ✅ .env dans .gitignore

# 8. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques (1 tâche = 1 commit)
```

### 10.2 Point de contrôle

**Vérifier les 16 critères :**
- ✅ C4.1 à C4.8 (critères fonctionnels)
- ✅ C4.9 à C4.12 (critères techniques)
- ✅ C4.13 à C4.16 (critères qualité)

**Si tous les critères sont validés :**
```bash
# Merge dans main
git checkout main
git merge feat/sprint-4-3
git push origin main
```

**Si des critères ne sont pas validés :**
- Identifier les problèmes
- Corriger dans une nouvelle branche `fix/sprint-4-xxx`
- Re-tester

### 10.3 Transition vers Sprint 5

**Une fois Sprint 4 terminé avec succès :**
- ✅ Search Engine fonctionnel (recherche hybride)
- ✅ Benchmarks validés (Recall@5 ≥ 0.75)
- ✅ Tests > 80% couverture
- ✅ Documentation complète

**Préparer Sprint 5 (CLI) :**
- 🎯 Lire `SPRINT-05.md` (quand disponible)
- 🎯 Vérifier prérequis Sprint 5
- 🎯 Créer branche `feat/sprint-5-1`

---

## 11. Prompt de lancement pour agent

**Copier ce prompt pour lancer un agent de développement :**

```markdown
## Mission

Implémenter le Sprint 4 — Search Engine (Semaine 7-8) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-04.md` — Dossier complet Sprint 4
2. `Docs/roadmap/sprints/SPRINT-04-01.md` — Sprint 4-1 (FTS + Vector)
3. `Docs/roadmap/sprints/SPRINT-04-02.md` — Sprint 4-2 (Embeddings + indexation)
4. `Docs/roadmap/sprints/SPRINT-04-03.md` — Sprint 4-3 (RRF + benchmarks + docs)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (section 4.2.2)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-001)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 3 terminé
ls -la src/business/knowledge-manager.ts
ls -la src/business/indexer.ts
# ✅ Fichiers existent

# 2. Tests Sprint 3
npm test tests/business/
# ✅ Tests passent

# 3. 3 bases SQLite
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent

# 4. FTS5 opérationnel
sqlite3 data/ekts-fts.db ".tables"
# ✅ resources_fts existe

# 5. sqlite-vec opérationnel
sqlite3 data/ekts-vectors.db ".tables"
# ✅ resources_vectors existe
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 3 terminé avec succès
- ✅ Knowledge Manager fonctionnel (5 méthodes + FTS)
- ✅ 3 bases SQLite créées (ekts.db, ekts-fts.db, ekts-vectors.db)
- ✅ FTS5 opérationnel
- ✅ sqlite-vec opérationnel
- ✅ Variable d'environnement OPENAI_API_KEY configurée

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer des fichiers dans `src/business/` (search-engine, embeddings, rrf)
- ✅ Créer des fichiers dans `src/data/` (fts-repository, vector-repository)
- ✅ Créer des fichiers dans `tests/business/` et `tests/benchmark/`
- ✅ Créer `docs/SEARCH_ENGINE.md`
- ✅ Créer `.env` et `.env.example`
- ✅ Modifier `.gitignore` (ajouter .env)
- ✅ Installer `openai` (dépendance npm)

**Vous ne pouvez pas :**
- ❌ Modifier `src/business/knowledge-manager.ts` (sauf si bug critique)
- ❌ Modifier `src/business/indexer.ts` (sauf si bug critique)
- ❌ Modifier `src/data/resource-repository.ts` (sauf si bug critique)
- ❌ Créer de fichiers hors périmètre
- ❌ Installer d'autres dépendances (sauf approbation préalable)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Injection dépendances (pas de framework DI)
- ✅ Erreurs personnalisées (extends Error)
- ✅ Pas de `any` (utiliser `unknown` + type guards)
- ✅ Configuration via variables d'environnement (.env)
- ✅ OPENAI_API_KEY jamais commité (.gitignore)

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

**Benchmarks :**
- ✅ Recall@5 ≥ 0.75
- ✅ Faithfulness ≥ 0.80
- ✅ Latence < 500ms (100K documents)

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Tâche 4.1 : FTS repository implémenté
- [x] Tâche 4.3 : Vector repository implémenté

### Tâches en cours
- [ ] Tâche 4.2 : Embeddings service (50% terminé)

### Tâches à venir
- [ ] Tâche 4.4 : RRF fusion
- [ ] Tâche 4.6 : Benchmarks

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 4 est terminé quand :**
- ✅ Les 16 critères d'acceptation sont validés (C4.1 à C4.16)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Benchmarks validés (Recall@5 ≥ 0.75, Faithfulness ≥ 0.80)
- ✅ Documentation complète
- ✅ Commits pushés sur `feat/sprint-4-3`

## Livrables

**À la fin du Sprint 4, fournir :**
- ✅ `src/business/search-engine.ts` — Search Engine (search hybride)
- ✅ `src/business/search-engine.types.ts` — Interfaces
- ✅ `src/business/embeddings.ts` — EmbeddingsService (OpenAI)
- ✅ `src/business/rrf.ts` — Fonction fusion RRF
- ✅ `src/data/fts-repository.ts` — FTSRepository
- ✅ `src/data/vector-repository.ts` — VectorRepository
- ✅ `tests/business/search-engine.test.ts` — Tests unitaires
- ✅ `tests/business/embeddings.test.ts` — Tests unitaires
- ✅ `tests/business/rrf.test.ts` — Tests unitaires
- ✅ `tests/benchmark/search-benchmark.ts` — Benchmarks
- ✅ `docs/SEARCH_ENGINE.md` — Documentation API
- ✅ `.env.example` — Template variables d'environnement

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-001)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 4-1 : 4 jours
- Sprint 4-2 : 3 jours
- Sprint 4-3 : 3 jours

## Budget API

**OpenAI API (embeddings) :**
- Modèle : text-embedding-3-small
- Coût : ~$0.02 / 1M tokens
- Budget prévu : $5 (250M tokens)
- Utilisation estimée Sprint 4 : ~$0.50 (25M tokens)

**Note :** Prévoir un budget minimum pour les benchmarks.
```

---

## 12. Résumé

### 12.1 Sprint 4 — Search Engine (2 semaines)

**Objectif :** Implémenter la recherche hybride (FTS + Vector + RRF)

**3 sous-sprints :**
- **Sprint 4-1** (4 jours) : Recherche FTS5 (BM25) + Recherche vectorielle (sqlite-vec)
- **Sprint 4-2** (3 jours) : Génération embeddings (OpenAI) + Indexation vectorielle
- **Sprint 4-3** (3 jours) : Fusion RRF (k=60) + Benchmarks + Documentation

**Livrables principaux :**
- ✅ Search Engine (recherche hybride)
- ✅ EmbeddingsService (OpenAI text-embedding-3-small)
- ✅ FTSRepository (BM25)
- ✅ VectorRepository (cosine similarity)
- ✅ Fonction RRF (fusion)
- ✅ Benchmarks (Recall@5 ≥ 0.75, Faithfulness ≥ 0.80)
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation API

**16 critères de validation :**
- ✅ C4.1 à C4.8 (fonctionnels)
- ✅ C4.9 à C4.12 (techniques)
- ✅ C4.13 à C4.16 (qualité)

**Dépendances :**
- ✅ Sprint 2 (Data Layer) — Terminé
- ✅ Sprint 3 (Knowledge Manager) — Terminé
- 🎯 Sprint 5 (CLI) — Utilisera le Search Engine

### 12.2 Transition

**Après Sprint 4 :**
- ✅ Search Engine fonctionnel (recherche hybride)
- ✅ Benchmarks validés (Recall@5 ≥ 0.75)
- ✅ Prêt pour Sprint 5 (CLI)

**Sprint 5 — CLI (Semaine 9-10) :**
- 🎯 Interface ligne de commande (Commander.js)
- 🎯 7 commandes (init, add, search, get, list, delete, status)
- 🎯 Tests d'intégration
- 🎯 Documentation CLI

---

---

## 13. Addendum — Sprint 4.5 (hors plan) : couche fournisseurs

**Ajouté le 22 octobre 2026, à la demande de l'utilisateur.** Ce sprint ne figure
pas dans le plan initial ; il répond à un besoin apparu à l'usage : treize clés
d'API (OpenAI, Gemini, DeepSeek, Z.ai, OpenRouter, NVIDIA, Novita, StepFun,
Tavily, Serper, SerpApi, E2B, Sofya) étaient disponibles et le Sprint 4 n'en
exploitait qu'une.

### 13.1 Pourquoi le Sprint 4 seul ne suffisait pas

`EmbeddingsService` construisait un client OpenAI à partir d'une clé unique. Le
projet fonctionnait, mais :

- une seule clé pour tout le projet : quota épuisé = indexation arrêtée ;
- aucune capacité extérieure à l'embedding (chat, recherche web, bac à sable) ;
- aucun moyen de constater, sans lire le code, quelles clés étaient réellement
  exploitées.

### 13.2 Livrables

| Livrable | Fichier | Rôle |
|---|---|---|
| Catalogue | `src/shared/providers/catalog.ts` | 13 fournisseurs, capacités, protocoles, paliers |
| Trousseau | `src/shared/providers/env.ts` | Clés `_2`…`_8`, masquage, rédaction |
| Client HTTP | `src/business/providers/http.ts` | Timeout, reprises, `Retry-After`, erreurs typées |
| Disjoncteur | `src/business/providers/health.ts` | 3 échecs → 60 s, doublé jusqu'à 10 min |
| Routage | `src/business/providers/routing.ts` | Capacité → espace → politique → santé |
| Adaptateurs | `src/business/providers/adapters.ts` | 6 protocoles, alignement 1536 |
| Passerelle | `src/business/providers/gateway.ts` | Rotation, repli, trace |
| Embedding | `src/business/providers/embedding-provider.ts` | `EmbeddingProvider` adossé à la passerelle |
| Migration | `src/data/migrations/002_embedding_space.ts` | Liaison de l'index à un espace |
| Diagnostic | `scripts/providers.mjs` | État des clés et chaîne d'appel, sans réseau |
| Guide | `docs/guides/PROVIDERS.md` | Mode d'emploi complet |

### 13.3 Décisions structurantes

- **ADR-015** — registre déclaratif, routage par capacité : ajouter un
  fournisseur compatible OpenAI ne demande aucun code exécutable.
- **ADR-016** — l'espace d'embedding est l'identité de bascule : jamais de repli
  entre deux modèles produisant des vecteurs incomparables.
- **ADR-017** — `.env` chargé par `process.loadEnvFile` : aucune dépendance
  ajoutée, et `npm run providers` voit les clés comme le reste du projet.

### 13.4 Ce que le Sprint 4.5 ne fait pas

- Pas de streaming ni de sortie structurée pour le chat (Sprint 6 en aura besoin).
- Pas de comptage de tokens ni de coût.
- Pas de fournisseur local (Ollama) : sans clé d'API, il demande une entrée
  `local` dans le catalogue (ADR-T01, différé au Sprint 5).
- **Sofya** reste déclarée `unknown` : la clé est collectée, jamais utilisée.

### 13.5 Impact sur les sprints suivants

| Sprint | Impact |
|---|---|
| Sprint 5 (CLI) | `status` peut afficher les fournisseurs configurés et l'espace actif sans nouveau code |
| Sprint 6 (MCP) | Le chat multi-fournisseurs est disponible pour la synthèse RAG |
| Sprint 7-8 (navigateur) | E2B est déjà déclaré pour le bac à sable |
| Sprint 13+ (veille) | Tavily/Serper/SerpApi sont déjà déclarés pour la collecte |

---

**Fin du dossier Sprint 4 — Search Engine**
