# Stockage et Indexation — Documentation

**Module :** `src/storage/` — Sprint 10 (octobre 2026)
**Entrée :** `AnalysisReport` du Sprint 9 · **Sortie :** audits persistés, indexés, recherchables, statistiques agrégées (alimentation du Sprint 11)
**Dépendances :** `better-sqlite3` (déjà présent), `src/business/rrf.ts` (RRF), `src/shared/errors.ts` — aucune nouvelle dépendance, aucun réseau.

---

## 1. Vue d'ensemble

Le module transforme un rapport d'analyse en données **requêtables** :

- **3 tables relationnelles** : métadonnées, scores par dimension, constats ;
- **un index plein texte FTS5 autonome** sur URL/titre/description des constats ;
- **un contrat d'embeddings injectable** pour la recherche sémantique ;
- **une recherche hybride** FTS5 + vecteurs fusionnés par RRF (k = 60) ;
- **des statistiques** globales, par dimension, par URL, tendance et distribution.

```
AnalysisReport (Sprint 9)
    │
    ▼  AuditRepository.store()  — transaction unique, validation préalable
    │
audit_metadata (1) ── audit_dimensions (5) ── audit_findings (N)
    │
    ▼  AuditIndexer.indexAudit()
    │
audit_fts (N lignes, rowid = id du constat) + AuditEmbeddingStore? (injecté)
    │
    ├── AuditSearch.search()      → RRF(FTS5, embeddings) + filtres + pagination
    ├── AuditSearch.findBy…()     → score / dimension / priorité
    └── AuditStatisticsManager.*  → AVG, COUNT, TOP, tendance, distribution
```

## 2. Schéma SQLite

### 2.1 Tables

```sql
CREATE TABLE audit_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  timestamp TEXT NOT NULL,                       -- ISO 8601 de l'analyse
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  total_findings  INTEGER NOT NULL CHECK (total_findings >= 0),
  critical_findings INTEGER NOT NULL CHECK (critical_findings >= 0),
  high_findings     INTEGER NOT NULL CHECK (high_findings >= 0),
  medium_findings   INTEGER NOT NULL CHECK (medium_findings >= 0),
  low_findings      INTEGER NOT NULL CHECK (low_findings >= 0),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL REFERENCES audit_metadata(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN
    ('performance', 'accessibility', 'seo', 'ux', 'content')),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  findings_count INTEGER NOT NULL CHECK (findings_count >= 0)
);

CREATE TABLE audit_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL REFERENCES audit_metadata(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN
    ('performance', 'accessibility', 'seo', 'ux', 'content')),
  title TEXT NOT NULL,
  description TEXT,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 0 AND 4),
  effort   INTEGER NOT NULL CHECK (effort   BETWEEN 1 AND 5),
  impact   INTEGER NOT NULL CHECK (impact   BETWEEN 1 AND 5),
  priority TEXT NOT NULL CHECK (priority IN
    ('critical', 'high', 'medium', 'low', 'info')),
  recommendation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE audit_fts USING fts5(
  url, title, description,
  tokenize = 'porter unicode61 remove_diacritics 2'
);
```

Index : `idx_audit_dimensions_audit_id`, `idx_audit_findings_audit_id`,
`idx_audit_metadata_url`, `idx_audit_metadata_timestamp` (`timestamp DESC`).

### 2.2 Pourquoi une table FTS5 **autonome** ?

La spécification proposait `content='audit_findings'` (content externe) —
référence interdite hors du schéma FTS, et incompatible avec les `INSERT`
directs de l'indexeur. Le dépôt a déjà tranché pour `resources_fts`
(migration `001_init`) : table autonome, contenu copié, cycle de vie
applicatif (`DELETE` + `INSERT`). Les `rowid` d'`audit_fts` **sont** les
identifiants des constats — un `DELETE` de constat s'accompagne du `DELETE`
correspondant (fait par `AuditRepository.delete`).

### 2.3 Dimensions d'attachement

Tout vit dans le schéma **`main`** (`ekts.db`, connexion `openDatabase()`),
avec les tables du projet. Les schémas attachés `fts` et `vectors` restent
réservés aux ressources (`resources_fts`, `resources_vectors`) : les audits
n'y touchent pas.

## 3. Contrats de types — `src/storage/types.ts`

| Type | Rôle |
| --- | --- |
| `AuditMetadata` | Métadonnées persistées (URL, horodatage, score, comptes) |
| `AuditDimension` | Score d'une dimension (0-100) + nombre de constats |
| `AuditFinding` | Constat persisté (sévérité, effort, impact, priorité, recommandation) |
| `Audit` | { metadata, dimensions (5), findings (N) } — retour du repository |
| `AuditSearchOptions` / `AuditSearchResult` | Options et résultats de recherche |
| `AuditEmbeddingStore` | **Contrat injectable** d'indexation vectorielle |
| `AuditStatistics`, `ScoreTrend`, `DimensionStatistics`, `TopIssue` | Statistiques |

Les dimensions et priorités **réutilisent** `AnalysisDimension` et `Priority`
de `src/analysis/types.ts` : une union locale divergente ferait mentir le
rapport.

## 4. AuditRepository — `audit-repository.ts`

```typescript
const repo = new AuditRepository(db);

const audit = repo.store(report);        // transaction atomique
const one   = repo.findById(audit.metadata.id!);
const byUrl = repo.findByUrl('https://example.com');   // timestamp DESC, id DESC
const page  = repo.list(0, 100);                      // pagination stricte
repo.delete(audit.metadata.id!);                      // CASCADE + nettoyage FTS
```

- **Validation avant transaction** (`ValidationError`, liste d'anomalies en
  français) : URL/timestamp non vides, scores 0-100, sévérité 0-4, effort et
  impact 1-5, dimensions et priorités connues — un rapport invalide n'écrit
  **jamais** de ligne partielle (les `CHECK` SQL font redondance de sécurité).
- **Ordre total** `timestamp DESC, id DESC` : la pagination est déterministe
  même à horodatages identiques.
- **Suppression** : `ON DELETE CASCADE` pour dimensions et constats (le pragma
  `foreign_keys` est activé par `AuditSchema.createSchema()`), nettoyage des
  lignes FTS de l'audit. Les embeddings, eux, vivent dans le magasin injecté :
  **désindexer avant de supprimer** (`indexer.deindexAudit(id)`).

## 5. AuditIndexer — `indexing.ts`

```typescript
const indexer = new AuditIndexer(db, embeddings);   // embeddings optionnel

const outcome = await indexer.indexAudit(audit);
// { ftsRows: 3, vectorized: true }

await indexer.deindexAudit(audit.metadata.id!);
indexer.rebuildFTSIndex();                          // reconstruction globale
```

| Méthode | Effet |
| --- | --- |
| `rebuildFTSIndex()` | `audit_fts` vidé puis rempli depuis `audit_findings` ⋈ `audit_metadata` |
| `indexAuditFTS(id)` | (ré)indexation des constats d'un audit, idempotente |
| `addEmbeddings(audit)` | délègue au magasin injecté ; `false` sans magasin |
| `removeEmbeddings(id)` | retire les clés `audit-{id}-finding-{fid}` |
| `indexAudit(audit)` | FTS puis embeddings, renvoie l'issue |
| `deindexAudit(id)` | retrait FTS + embeddings |

**Sans magasin injecté** : l'indexation reste plein texte et `vectorized: false`
le signale — jamais de vecteur simulé dans le module. Les tests injectent un
magasin local déterministe ; la production injectera un magasin adossé à
`EmbeddingsService` (Sprint 11 hors périmètre ici).

## 6. AuditSearch — `search.ts`

### 6.1 Recherche hybride

1. **FTS5 (BM25)** : constats matchés, agrégés par audit (meilleur rang par
   audit — `bm25()` n'étant autorisé par SQLite qu'en colonne d'une requête
   simple, l'agrégation se fait en mémoire).
2. **Embeddings** : voisins du magasin injecté (optionnel).
3. **RRF** : `score(audit) = Σ 1 / (k + rangᵢ)` avec `k = 60` — constante et
   fonction `reciprocalRank()` **réutilisées depuis `src/business/rrf.ts`**.
   Tri total (score desc, puis identifiant) pour un ordre reproductible.

Sans magasin : classement lexical seul (score ≤ 1/61). Sans requête :
énumération **filtrée en SQL** (score, dimension `findings_count > 0`,
priorité) avec pagination unique.

```typescript
const search = new AuditSearch(db, repo, embeddings);

const results = await search.search({
  query: 'contraste',       // hybride
  scoreMin: 0, scoreMax: 100,
  dimension: 'accessibility',
  priority: 'critical',
  offset: 0, limit: 20,
});
```

### 6.2 Filtres structurés

```typescript
search.findByScoreRange(60, 80);
search.findByDimension('performance');   // constats présents dans la dimension
search.findByPriority('critical');
search.findTopIssues(10);                // regroupements SQL, COUNT DISTINCT audits
```

> `findByDimension` teste `findings_count > 0` : les cinq dimensions existent
> sur **chaque** audit, un simple `dimension = …` ne filtrerait rien (écrit
> comme tel dans la spécification — voir §9).

## 7. AuditStatisticsManager — `statistics.ts`

```typescript
const stats = new AuditStatisticsManager(db);

stats.getStatistics();                     // AVG, COUNT, MIN, MAX, sommes
stats.getStatisticsForUrl(url);            // même agrégats, par URL
stats.getTrend('week', 30);                // day | week | month (ISO SQL)
stats.getDimensionStatistics();            // 5 lignes dès le premier audit
stats.getTopIssues(10);                    // + percentage (part d'audits touchés)
stats.getScoreDistribution();              // tranches 0-20 … 81-100
```

Toutes les valeurs `NULL` (table vide) retournent `0` ; les moyennes sont
arrondies. Aucune écriture.

## 8. Performance

| Opération | Budget | Mesure du test 10 000 audits |
| --- | --- | --- |
| Stockage / audit | < 100 ms | **~0,1-0,2 ms** |
| Indexation / audit | < 500 ms | **~0,01 ms** (rebuild global) |
| Recherche | < 100 ms | **~0,5-2 ms** |
| Statistiques | < 1 s | **~2 ms** |

Optimisations : transactions par audit, statements préparés réutilisés,
index sur `audit_id`/`url`/`timestamp`, pagination SQL, FTS5 (BM25).
Le scénario complet vit dans `tests/storage/integration.test.ts`
(« performance (10 000 audits) », budget CI 120 s).

## 9. Écarts au plan

| # | Écart | Arbitrage |
| --- | --- | --- |
| E10-1 | FTS5 **autonome** au lieu de `content='audit_findings'` | La formule de la spécification est auto-contradictoire (INSERT directs refusés sur table à content externe) ; aligné sur `resources_fts` |
| E10-2 | Noms de fichiers `types/schema/indexing/search/statistics.ts` (livrables) vs `audit-*.ts` (tâches) | Livrables officiels du dossier Sprint 10 |
| E10-3 | `AuditConverter` absent : conversion intégrée à `AuditRepository` | Périmètre de 6 fichiers code ; un seul consommateur |
| E10-4 | `VectorStore` introuvable (Sprint 4 décrit un état qui n'existe pas) : **contrat injectable** `AuditEmbeddingStore` | Règle « aucun test unitaire au réseau » + `VectorRepository` réel est lié aux ressources |
| E10-5 | Filtre `dimension` : `findings_count > 0` au lieu de `dimension IN (…)` (toujours vrai) | Sens actionnable, testé des deux côtés |
| E10-6 | Test de performance intégré à `integration.test.ts` (pas de `scripts/test-storage-performance.ts`) | Livrables = 6 tests + 2 docs ; budgets mesurés dans le même test |
| E10-7 | `bm25()` : agrégation par audit en TypeScript (SQLite refuse `MIN(bm25())`/`GROUP BY`/sous-requête) | Comportement identique, ligne SQL documentée |
| E10-8 | Suppression : nettoyage `audit_fts` ajouté au `delete()` (la spécification laisse des orphelins) | Même transaction que le `CASCADE` |

## 10. Dépannage

| Symptôme | Cause | Remède |
| --- | --- | --- |
| `Recherche échouée : requête FTS invalide (…)` | Syntaxe FTS5 (guillemet, opérateur orphelin) | Échapper ou reformuler la requête utilisateur |
| `Recherche échouée : audit orphelin dans l'index (id …)` | Embeddings non retirés avant suppression | `await indexer.deindexAudit(id)` **avant** `repo.delete(id)` |
| `Validation échouée : …` | Rapport hors bornes (sévérité, score…) | Lire la liste `issues` ; rien n'a été écrit |
| `vectorized: false` | Aucun magasin injecté au constructeur | Passer un `AuditEmbeddingStore` si la sémantique est voulue |
| Recherche ne « sent » rien de sémantique | Même cause : fallback lexical assumé | Voir §5 |
| Tests : `foreign_keys` sans CASCADE | Connexion nue sans pragma | Passer par `AuditSchema.createSchema()` (active le pragma) |
| `indexation` ne retrouve pas un libellé | Tokenizer porter : les radicaux sont fondus | Chercher le radical (`optimis` pour « optimiser/optimisation ») |

## 11. Tests

```powershell
npm test tests/storage/
```

| Fichier | Cas |
| --- | --- |
| `schema.test.ts` | Tables, FTS5, index, idempotence, CASCADE/pragma, CHECK SQL |
| `audit-repository.test.ts` | Store/validation/pagination/suppression (18) |
| `indexing.test.ts` | Reconstruction, indexation unitaire, embeddings, désindexation (14) |
| `search.test.ts` | Hybride RRF, filtres, pagination, erreurs (16) |
| `statistics.test.ts` | Agrégats, tendances, top issues, distribution (14) |
| `integration.test.ts` | Pipeline Sprint 9 → stockage → index → recherche → stats + **10 000 audits** (3) |

**Couverture `src/storage/`** : mesurée par `npm run coverage` (objectif > 80 %).
Les magasins d'embeddings de test sont **locaux et déterministes** : le module
ne charge jamais de réseau.

## 12. Références

- [SQLite FTS5](https://www.sqlite.org/fts5.html) — index plein texte
- [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) — Cormack et al., 2009
- [BM25](https://en.wikipedia.org/wiki/Okapi_BM25)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — API synchrones, transactions
- `docs/ANALYSIS.md` — production des rapports en amont (Sprint 9)
