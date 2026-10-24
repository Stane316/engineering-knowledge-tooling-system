# Documentation EKTS

**Registre des documents du projet** — chaque sujet a son document dédié ;
celui-ci indexe l'ensemble et documente en détail le module d'audits
(Sprint 10). Dernière mise à jour : 24 octobre 2026.

---

## 1. Index des documents

| Document | Sujet | Sprint |
| --- | --- | --- |
| `README.md` | Vision, installation, commandes, configuration | 1+ |
| `docs/INSPECTOR.md` | Inspection web 4 niveaux (Playwright, Lighthouse, axe-core, UX, contenu) | 7-8 |
| `docs/ANALYSIS.md` | Analyse 5 dimensions, matrice de sévérité, priorisation | 9 |
| `docs/STORAGE.md` | **Stockage et indexation des audits (ce document)** | 10 |
| `docs/CLI.md` | Interface en ligne de commande | 5-6 |
| `docs/MCP.md` · `docs/MCP-EXAMPLES.md` | Serveur et outils MCP | 6 |
| `docs/PLAYWRIGHT.md` | Navigation Playwright, diagnostics navigateur | 7 |
| `docs/guides/SETUP.md` | Installation et prérequis | 1-2 |
| `docs/guides/DATA_LAYER.md` | SQLite, migrations, dépôts de ressources | 2-3 |
| `docs/guides/SEARCH_ENGINE.md` | Recherche hybride ressources (FTS5 + vecteurs + RRF) | 4 |
| `docs/guides/KNOWLEDGE_MANAGER.md` | Gestion des connaissances | 3 |
| `docs/guides/PROVIDERS.md` | Fournisseurs IA (clés, routage, embeddings) | 4.5 |
| `docs/blueprint/` | Plans, roadmap de sprints, registres de décisions | — |

## 2. Module Audit (Sprint 10)

Le module `src/storage/` stocke les `AnalysisReport` du Sprint 9, les indexe
(FTS5 + embeddings sous injection), les recherche de façon hybride et agrège
les statistiques. Schéma, contrats, écarts et dépannage :
**`docs/STORAGE.md`**.

### 2.1 AuditRepository — stockage CRUD

```typescript
import { AuditRepository } from '../storage/audit-repository.js';

const repo = new AuditRepository(db);
const audit = repo.store(report);                 // transaction, validation
const found = repo.findById(audit.metadata.id!);  // audit complet ou null
const byUrl = repo.findByUrl(url);                // timestamp DESC, id DESC
const page = repo.list(0, 100);                   // pagination stricte
repo.delete(audit.metadata.id!);                  // CASCADE + nettoyage FTS
```

### 2.2 AuditIndexer — indexation FTS5 + embeddings

```typescript
import { AuditIndexer } from '../storage/indexing.js';

const indexer = new AuditIndexer(db, embeddings); // embeddings optionnel
await indexer.indexAudit(audit);                  // { ftsRows, vectorized }
await indexer.deindexAudit(audit.metadata.id!);   // avant toute suppression
indexer.rebuildFTSIndex();                        // reconstruction globale
```

### 2.3 AuditSearch — recherche hybride

```typescript
import { AuditSearch } from '../storage/search.js';

const search = new AuditSearch(db, repo, embeddings);
const results = await search.search({
  query: 'performance',      // FTS5 (BM25) + embeddings, fusion RRF k=60
  scoreMin: 60,
  dimension: 'performance',  // constats présents dans la dimension
  priority: 'critical',
  offset: 0,
  limit: 20,
});
search.findByScoreRange(60, 80);
search.findByDimension('seo');
search.findByPriority('high');
search.findTopIssues(10);
```

### 2.4 AuditStatisticsManager — statistiques

```typescript
import { AuditStatisticsManager } from '../storage/statistics.js';

const stats = new AuditStatisticsManager(db);
stats.getStatistics();                 // AVG, COUNT, MIN, MAX, sommes
stats.getStatisticsForUrl(url);        // agrégats par URL
stats.getTrend('week', 30);            // day | week | month
stats.getDimensionStatistics();        // 5 dimensions
stats.getTopIssues(10);                // + percentage
stats.getScoreDistribution();          // tranches 0-20 … 81-100
```

### 2.5 Mise en route

```typescript
import { openDatabase } from '../data/database.js';
import { AuditSchema } from '../storage/schema.js';

const { connection, close } = openDatabase();  // ekts.db + fts + vectors attachés
new AuditSchema(connection).createSchema();    // idempotent, active foreign_keys
// … store / index / search / statistics …
close();
```

## 3. Règles du module

1. **Validation avant écriture** — un rapport invalide ne produit aucune ligne
   partielle (`ValidationError` avec la liste des anomalies).
2. **Une transaction par audit** — métadonnées, dimensions, constats.
3. **Désindexer avant de supprimer** — les embeddings vivent dans le magasin
   injecté, pas dans SQLite.
4. **Jamais de réseau en test** — les magasins d'embeddings de test sont
   locaux et déterministes ; sans magasin, la recherche reste plein texte.
5. **Aucune nouvelle dépendance** — `better-sqlite3` et la RRF maison
   (`src/business/rrf.ts`) suffisent.
