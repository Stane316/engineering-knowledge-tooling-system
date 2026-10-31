# Moteur de recherche — Sprint 4

> Recherche hybride **BM25 + embeddings OpenAI**, fusionnée par **RRF (k = 60)**.
> Index lexical et index vectoriel vivent dans les deux bases attachées du
> Data Layer ; la clé API n'est jamais journalisée ni versionnée.

| Élément | Valeur |
| --- | --- |
| Sprint | 4 — semaines 7-8 |
| Critères | C4.1 à C4.16 (voir `docs/blueprint/Docs/roadmap/sprints/SPRINT-04.md`) |
| Tests | 240 tests, **couverture 100 %** (lignes / branches / fonctions) |
| Latence mesurée | p95 **308 ms** sur 100 000 documents + 100 000 vecteurs |
| Recall@5 mesuré | **1.000** (seuil 0.75) |
| Faithfulness mesurée | **1.000** (seuil 0.80) |

---

## 1. Objectif et périmètre

Le moteur répond à une question simple : *« retrouve-moi la ressource qui parle
de ça »*, en combinant deux signaux complémentaires.

- **Lexical (BM25)** : excellent sur les termes exacts, les identifiants, les
  sigles (`RRF`, `C++`, `sqlite-vec`). Aucun appel réseau, latence
  sous-milliseconde.
- **Sémantique (embeddings)** : retrouve un document qui parle du même sujet
  sans partager les mots exacts. Coûte un appel OpenAI par requête
  (~50-150 ms) et un par ressource indexée.
- **Fusion RRF** : combine les deux classements sans comparer des scores
  incommensurables (BM25 est négatif, la similarité cosinus va de -1 à 1).

**Dans le périmètre** : les trois modes de recherche, l'indexation vectorielle
automatique, le benchmark et la configuration par variables d'environnement.

**Hors périmètre** (sprints suivants) : CLI (Sprint 5), serveur MCP (Sprint 6),
filtres avancés (date, métadonnées), cache de requêtes, pagination, reranking
par LLM.

---

## 2. Architecture

```text
                       ┌─────────────────────────────────────┐
   requête utilisateur │            SearchEngine             │
  ────────────────────►│  search() / searchFTS() / searchVector()
                       └───────┬─────────────────────┬───────┘
                               │                     │
             ┌─────────────────▼──────┐   ┌──────────▼─────────────┐
             │     FTSRepository      │   │  EmbeddingsService     │
             │  bm25(0,10,5,1) ASC    │   │  batches + validation  │
             └───────────┬────────────┘   └──────────┬─────────────┘
                         │                           │ EmbeddingProvider
                         │                    ┌──────▼──────────────┐
                         │                    │ OpenAI (prod)       │
                         │                    │ FakeEmbedding (CI)  │
                         │                    └──────┬──────────────┘
                         │                           │ 1536 dims
             ┌───────────▼────────────┐   ┌──────────▼─────────────┐
             │ fts.resources_fts      │   │   VectorRepository     │
             │ (ekts-fts.db)          │   │ vectors.resources_vectors
             └────────────────────────┘   └──────────┬─────────────┘
                                                     │ KNN
                                            ┌────────▼─────────┐
                                            │  fuseResults()   │
                                            │  RRF k = 60      │
                                            └──────────────────┘
```

Le moteur ne connaît **ni HTTP ni SQLite** : il reçoit les repositories et le
service d'embeddings par injection de constructeur (C4.14). Les tests
remplacent OpenAI par un fournisseur déterministe local, sans réseau ni coût.

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/business/search-engine.types.ts` | Types purs : `SearchOptions`, `ISearchEngine` |
| `src/business/search-engine.ts` | Orchestration, filtres, modes, limite |
| `src/business/rrf.ts` | `reciprocalRank()`, `fuseResults()` |
| `src/business/embeddings.ts` | `EmbeddingProvider`, `EmbeddingsService`, `OpenAIEmbeddingProvider` |
| `src/business/vector-indexer.ts` | `VectorIndexer`, `withVectorIndexing()` (décorateur) |
| `src/data/fts-repository.ts` | BM25, assainissement de requête, `toFtsQuery()` |
| `src/data/vector-repository.ts` | KNN, normalisation L2, `cosineSimilarity()` |
| `src/shared/errors.ts` | `SearchError`, `EmbeddingsError`, `FusionError` |
| `tests/benchmark/search-benchmark.ts` | Benchmark 100K documents |

---

## 3. API

### 3.1 `SearchEngine`

```ts
import { openDatabase } from './src/data/database.js';
import { createKnowledgeManager } from './src/business/knowledge-manager.js';
import { createEmbeddingsService } from './src/business/embeddings.js';
import { FTSRepository } from './src/data/fts-repository.js';
import { VectorRepository } from './src/data/vector-repository.js';
import { SearchEngine } from './src/business/search-engine.js';

const { connection } = openDatabase();
const embeddings = createEmbeddingsService(); // lit OPENAI_API_KEY

const engine = new SearchEngine({
  fts: new FTSRepository(connection),
  vectors: new VectorRepository(connection),
  embeddings,
});

const results = await engine.search('fusion rrf', {
  limit: 10,
  mode: 'hybrid',      // 'hybrid' | 'fts' | 'vector'
  type: 'article',     // filtre optionnel
  tags: ['recherche'], // ET, insensible à la casse
});
// [{ resource, score, source: 'hybrid' }, ...]
```

| Méthode | Réseau | Description |
| --- | --- | --- |
| `search(query, options)` | hybride/vector → oui | Point d'entrée complet |
| `searchFTS(query, limit)` | non | BM25 seul |
| `searchVector(query, limit)` | oui | Embedding + KNN seul |

**Règles de comportement**

| Situation | Comportement |
| --- | --- |
| Requête vide ou blanche (primitive `SearchEngine`) | `[]`, sans aucun appel réseau — contrat historique conservé |
| Requête vide ou blanche (CLI, MCP) | `ValidationError` / `-32602` : une entrée invalide n'est **pas** un succès à zéro résultat |
| Requête sans terme exploitable (`!!!`) | `[]` (FTS), pas d'erreur |
| `limit` absent | 10 |
| `limit` ≤ 0 ou non entier | `SearchError` |
| `mode` inconnu | `SearchError` |
| Filtres demandés | Suréchantillonnage `limit × 5` (plafond 500) avant filtrage |
| Échec FTS ou embeddings en hybride | L'erreur remonte (pas de dégradation silencieuse) |

### 3.2 `FTSRepository`

```ts
const fts = new FTSRepository(connection);
await fts.search('sqlite bm25', 10); // SearchResult[] triés par pertinence
fts.count();                         // nombre d'entrées indexées
```

SQL exécuté :

```sql
SELECT r.id, r.type, r.title, r.url, r.tags, r.metadata, r.content,
       r.embedding_model, r.created_at, r.updated_at,
       bm25(resources_fts, 0.0, 10.0, 5.0, 1.0) AS score
  FROM fts.resources_fts
  JOIN resources r ON r.id = fts.resources_fts.resource_id
 WHERE resources_fts MATCH ?
 ORDER BY score ASC
 LIMIT ?
```

**Assainissement de la requête** — `toFtsQuery()` transforme la saisie libre en
expression FTS5 sûre :

| Saisie | Expression | Pourquoi |
| --- | --- | --- |
| `sqlite bm25` | `"sqlite" AND "bm25"` | AND explicite, comportement par défaut de FTS5 |
| `C++ (pointeurs)` | `"C" AND "pointeurs"` | `++` et `(` sont des opérateurs FTS5 → `fts5: syntax error` |
| `NEAR/3 OR NOT` | `"NEAR" AND "3" AND "OR" AND "NOT"` | Neutralise les opérateurs |
| `!!! ???` | `null` → `[]` | Aucun terme exploitable |
| 40 termes | 32 premiers termes | Borne `MAX_QUERY_TOKENS` |

### 3.3 `VectorRepository`

```ts
const vectors = new VectorRepository(connection);
vectors.insertEmbedding(resourceId, embedding); // upsert (DELETE + INSERT)
await vectors.search(embedding, 10);            // KNN cosinus
vectors.deleteEmbedding(resourceId);            // idempotent
vectors.getEmbedding(resourceId);               // number[] | null
vectors.count();                                // nombre de vecteurs
```

### 3.4 `EmbeddingsService`

```ts
const embeddings = createEmbeddingsService();          // OpenAI, .env
await embeddings.embed('texte');                       // number[1536]
await embeddings.embedBatch(['a', 'b']);               // lots de 64
```

Le service **valide** chaque réponse : nombre de vecteurs, dimension 1536,
valeurs finies, textes non vides. Une réponse incohérente devient une
`EmbeddingsError` explicite plutôt qu'une erreur native de `sqlite-vec`.

Pour les tests et le benchmark, `EmbeddingProvider` est remplaçable :

```ts
const service = new EmbeddingsService({
  provider: new FakeEmbeddingProvider(), // tests/helpers/fake-embeddings.ts
});
```

### 3.5 Indexation automatique (C4.5)

La mission du Sprint 4 interdit de modifier `knowledge-manager.ts`. Le câblage
passe donc par un **décorateur** :

```ts
import { createKnowledgeManager } from './src/business/knowledge-manager.js';
import { VectorIndexer, withVectorIndexing } from './src/business/vector-indexer.js';

const inner = createKnowledgeManager(connection);
const vectorIndexer = new VectorIndexer(embeddings, new VectorRepository(connection));

const manager = withVectorIndexing(inner.manager, vectorIndexer);

await manager.addResource({ ... });          // FTS (manager) + vecteur (décorateur)
await manager.updateResource(id, { ... });   // réindexe le vecteur
await manager.deleteResource(id);            // supprime le vecteur
await manager.reindex();                     // FTS + vecteurs
// → { resources, indexed, durationMs, vectors: { indexed, skipped, failed } }
```

**Limite assumée** : l'écriture SQLite et l'appel OpenAI ne partagent pas de
transaction. Si l'embedding échoue après la création, la ressource existe sans
vecteur et l'`EmbeddingsError` remonte à l'appelant. C'est le même compromis
que pour l'index FTS (fichier séparé) ; la réparation passe par `reindex()`.

---

## 4. Algorithmes

### 4.1 BM25 pondéré

```text
score(d, q) = Σ_{t∈q} IDF(t) · (tf · (k1+1)) / (tf + k1 · (1 - b + b · |d|/avgdl))
```

Poids des colonnes **dans l'ordre du schéma**
`resources_fts(resource_id UNINDEXED, title, content, tags)` :

| Colonne | Poids | Justification |
| --- | --- | --- |
| `resource_id` | `0.0` | `UNINDEXED` : aucun terme, poids neutre |
| `title` | `10.0` | Signal le plus fort |
| `content` | `5.0` | Corps du document |
| `tags` | `1.0` | Bruit utile |

Le score FTS5 est **négatif** : plus il est proche de 0, plus le document est
pertinent. D'où `ORDER BY score ASC`.

### 4.2 Similarité cosinus sans migration

La table `vectors.resources_vectors` a été créée avec `embedding float[1536]`,
sans option `distance_metric` : `sqlite-vec` applique donc la distance **L2**.
Pour retrouver un classement cosinus sans recréer la table, chaque vecteur est
**normalisé à la norme 1** à l'écriture *et* à la lecture :

```text
||a - b||² = 2 - 2·cos(a, b)   ⟹   cos(a, b) = 1 - distance² / 2
```

Le classement L2 entre vecteurs unitaires est strictement identique au
classement cosinus ; `cosineSimilarity()` expose la valeur dans `[-1, 1]`.

### 4.3 Reciprocal Rank Fusion

```text
score_rrf(d) = Σ_i 1 / (k + rang_i(d))        avec k = 60, rang à partir de 1
```

- Un document premier d'un classement apporte `1/61 ≈ 0.0164`.
- Un document présent dans les **deux** classements cumule les deux
  contributions : il remonte naturellement.
- Les scores d'origine sont ignorés : seuls les rangs comptent, ce qui rend la
  fusion insensible aux échelles (BM25 négatif vs cosinus).
- Le tri est **total** (score puis identifiant) : ordre reproductible.
- La même ressource rencontrée dans les deux classements avec un `updatedAt`
  différent lève une `FusionError` (index désynchronisé).

---

## 5. Configuration

`.env` (copié depuis `.env.example`, **jamais versionné**) :

```dotenv
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

| Variable | Défaut | Contrainte |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Obligatoire dès qu'un embedding réel est demandé |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Doit produire 1536 dimensions |
| `EMBEDDING_DIMENSION` | `1536` | **Doit** valoir 1536 (schéma `float[1536]`) |
| `EKTS_DATA_DIR` | `./data` | Répertoire des trois bases |

`EMBEDDING_DIMENSION ≠ 1536` lève une `EmbeddingsError` au démarrage plutôt
que de corrompre l'index : changer de dimension exige une migration du schéma.

### Sécurité

- `.env` est ignoré par git **et** par Gitleaks (`.gitleaks.toml`, hook
  pre-commit et job CI `secrets`).
- La clé n'apparaît dans aucun log : `EmbeddingsError` ne sérialise que le
  message de l'API, jamais les en-têtes.
- En cas de fuite : révoquer la clé sur `platform.openai.com`, en générer une
  nouvelle, vérifier l'historique avec `npm run security:secrets`.

---

## 6. Benchmark

```powershell
npm run test:benchmark                                  # 100 000 docs, 10 000 vecteurs
npm run test:benchmark -- --vectors=100000              # index vectoriel complet
npm run test:benchmark -- --documents=20000 --vectors=5000 --queries=100
npm run test:benchmark -- --keep                        # conserve la base générée
```

Le script compile `tests/benchmark/search-benchmark.ts` via
`tsconfig.benchmark.json` (sortie `dist-benchmark/`, ignorée par git) puis
l'exécute : aucun `tsx`, aucune dépendance supplémentaire.

### Protocole

- Corpus **déterministe** (PRNG mulberry32, graine fixe) : 30 sujets × 16
  qualifiants + un identifiant `noteXXXXXX` par document.
- Requêtes construites à partir de 3 termes du titre cible, dont l'identifiant
  — l'équivalent d'une recherche par identifiant partiel, cas d'usage
  dominant d'un système de connaissances personnel.
- Cibles tirées parmi les documents **indexés vectoriellement**, sinon
  `Recall@5` mesurerait la couverture de l'index, pas le classement.
- Les requêtes purement thématiques (« sqlite guide ») sont hors périmètre :
  sur 100 000 documents, des milliers de documents sont équivalents et aucun
  moteur ne peut désigner un gagnant.
- 20 requêtes d'échauffement (cache disque + JIT) avant les mesures.
- Aucun réseau : `FakeEmbeddingProvider`.

### Définitions des métriques

| Métrique | Définition opérationnelle |
| --- | --- |
| `Recall@5` | Part des requêtes dont le document cible figure dans les 5 premiers résultats |
| `Faithfulness` | Part des résultats retournés contenant au moins un terme de la requête (proxy **lexicale** déterministe — voir écart E4-9) |
| Latence p95 | 95ᵉ centile des durées de `search()`, en millisecondes |

### Résultats mesurés (sandbox Linux, Node 22)

| Corpus | Mode | p50 | p95 | Recall@5 | Faithfulness |
| --- | --- | --- | --- | --- | --- |
| 100 000 docs / 10 000 vecteurs | FTS | 0.9 ms | 1.3 ms | 1.000 | 1.000 |
| | Vector | 30.6 ms | 31.5 ms | 0.995 | 1.000 |
| | **Hybride** | 31.6 ms | **32.4 ms** | **1.000** | **1.000** |
| 100 000 docs / **100 000 vecteurs** | FTS | 0.9 ms | 1.1 ms | 1.000 | 1.000 |
| | Vector | 306.3 ms | 310.3 ms | 0.900 | 1.000 |
| | **Hybride** | 302.1 ms | **308.1 ms** | **1.000** | **1.000** |

Interprétation : `sqlite-vec` 0.1.9 fait un **scan exact** (pas d'index ANN) ;
la latence vectorielle croît donc linéairement avec le nombre de vecteurs
(~3 µs par vecteur). À 100 000 vecteurs, l'hybride reste sous le seuil de
500 ms. Au-delà, l'index ANN (`vec0` partitions) ou un pré-filtrage par FTS
deviendra nécessaire.

---

## 7. Écarts entre le blueprint et le code livré

Chaque écart a été **vérifié empiriquement** contre SQLite 3.53.4 /
`sqlite-vec` 0.1.9 avant d'être tranché.

| # | Blueprint | Réalité | Décision |
| --- | --- | --- | --- |
| **E4-1** | `JOIN resources r ON r.id = resources_fts.rowid` | `resources.id` est un UUID `TEXT` ; la comparaison à un `rowid` entier ne renvoie **rien** | Jointure sur `resources_fts.resource_id` (colonne `UNINDEXED` recopiée) |
| **E4-2** | `bm25(..., 10.0, 5.0, 1.0)` | `bm25()` attend **un poids par colonne** ; avec 3 poids, `resource_id` recevait 10.0 et `tags` restait à 1.0 | `bm25(..., 0.0, 10.0, 5.0, 1.0)` |
| **E4-3** | `ORDER BY score DESC` | BM25 est **négatif** ; `DESC` place le moins pertinent en tête | `ORDER BY score ASC` |
| **E4-4** | `embedding <=> ?` dans un `SELECT` | `near ">": syntax error` — l'opérateur n'existe pas | `WHERE v.embedding MATCH ? AND k = ?` |
| **E4-5** | `INSERT OR REPLACE` sur `vec0` | `UNIQUE constraint failed` sur la clé primaire | `DELETE` + `INSERT` dans une transaction |
| **E4-6** | Recherche « cosine » | Table créée sans `distance_metric` → L2 | Normalisation L2 à l'écriture et à la lecture ; `cos = 1 - d²/2` |
| **E4-7** | `new OpenAI({ apiKey })` figé | Impossible à tester sans réseau | `EmbeddingProvider` + `fetch`/`client` injectables |
| **E4-8** | Indexation vectorielle dans `KnowledgeManager` | Modification interdite par la mission | Décorateur `withVectorIndexing()` |
| **E4-9** | Faithfulness « LLM-as-judge » | Aucun LLM hors ligne dans le sandbox | Proxy lexicale déterministe, documentée et mesurée ; la définition RAGAS sera applicable au Sprint 6 |
| **E4-10** | `tests/business/*`, `docs/SEARCH_ENGINE.md` | Le dépôt utilise `tests/{unit,integration}` et `docs/guides/` | Chemins réels : `tests/unit`, `tests/integration`, `docs/guides/SEARCH_ENGINE.md` |

Autres divergences mineures : `src/types/resource.ts` → `src/shared/validators.ts` ;
`src/utils/errors.ts` → `src/shared/errors.ts` ; `SearchResult` réutilise celui
de `src/shared/types.ts` au lieu d'être redéfini.

---

## 8. Dépannage

| Symptôme | Cause | Correction |
| --- | --- | --- |
| `OPENAI_API_KEY absente` | `.env` absent ou vide | `Copy-Item .env.example .env`, renseigner la clé |
| `EMBEDDING_DIMENSION=... incompatible avec le schéma` | Dimension ≠ 1536 | Revenir à 1536 ou écrire une migration |
| `Recherche échouée : recherche FTS sur ...` | Table FTS absente / erreur SQLite | `npm run db:reindex` |
| `Recherche échouée : index vectoriel indisponible` | Base ouverte avec `loadVectors: false` | Ouvrir avec `openDatabase()` par défaut |
| `Embeddings échoués : ... 401` | Clé invalide ou révoquée | Régénérer la clé |
| `Embeddings échoués : ... 429` | Quota / débit dépassé | Réduire `batchSize`, réessayer, vérifier le plan |
| Résultats sémantiques vides | Aucune ressource indexée vectoriellement | `manager.reindex()` (décorateur) |
| `A LIMIT or 'k = ?' constraint is required` | Requête KNN sans `k` | Toujours passer `AND k = ?` |

---

## 9. Limites connues

1. **Pas d'index ANN** : `sqlite-vec` 0.1.9 fait un scan exact. Au-delà de
   ~150 000 vecteurs, la latence dépassera 500 ms (voir §6).
2. **Coût d'indexation** : un appel OpenAI par ressource créée ou modifiée.
   `reindex()` sur un gros corpus consomme du quota ; le mode batch (64 textes
   par appel) est utilisé par `embedBatch`, mais le décorateur indexe
   ressource par ressource.
3. **Pas de transaction distribuée** entre l'écriture SQLite et l'appel réseau
   (voir §3.5).
4. **`db:reindex` ne réindexe pas les vecteurs** : le script existant
   (Sprint 3) ne connaît pas les embeddings. Utiliser `manager.reindex()` du
   décorateur.
5. **`embedding_model` n'est pas renseigné** sur la ligne `resources` : la
   colonne existe (réservée), mais le décorateur ne la met pas à jour pour
   éviter une boucle d'écriture. Le modèle est porté par la configuration.
6. **Faithfulness** : proxy lexicale, pas une évaluation RAG par LLM (écart E4-9).

---

## 10. Vérifications

```powershell
npm run verify           # typecheck + lint + format + build + 240 tests, couverture 100 %
npm run test:benchmark   # seuils C4.6, C4.7, C4.8
npm run db:inspect       # état des trois bases
```

Résultat attendu de `npm run verify` : `Test Files 20 passed`, `Tests 240 passed`,
`All files | 100 | 100 | 100 | 100`.
