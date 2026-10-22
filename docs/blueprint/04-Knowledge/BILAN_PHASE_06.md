# Bilan Phase 06 — Stockage et Connaissances

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Durée estimée :** 1-2 semaines  
**Durée réelle :** ~1 jour

---

## 1. Résumé

La Phase 06 a établi l'architecture de stockage complète pour EKTS, avec une recommandation claire : **SQLite en mode WAL** comme solution principale, complété par FTS5 pour la recherche full-text et sqlite-vec pour la recherche vectorielle (préparation RAG Phase 07).

### Décisions clés

- ✅ **SQLite en mode WAL** — stockage principal (performance, simplicité)
- ✅ **FTS5** — recherche full-text (compétitif avec PostgreSQL tsvector)
- ✅ **sqlite-vec** — recherche vectorielle (RAG, <100K vectors)
- ✅ **Recherche hybride** — combinaison FTS + Vector avec RRF
- ✅ **Compliance intégrée** — anonymisation, rétention, audit logging

---

## 2. Livrables produits

| # | Fichier | Taille | Description |
|---|---------|--------|-------------|
| 1 | `06_ARCHITECTURE_STOCKAGE.md` | ~20 KB | Comparatif SQLite/PostgreSQL/JSON, architecture recommandée |
| 2 | `06_MODELE_DONNEES.md` | ~18 KB | Schéma SQL complet, entités, relations, compliance |
| 3 | `06_STRATEGIE_RECHERCHE.md` | ~22 KB | FTS5, sqlite-vec, recherche hybride RRF |
| 4 | `BILAN_PHASE_06.md` | ~12 KB | Ce document |

---

## 3. Ce qui est établi

### 3.1 Architecture de stockage

**Stack technique :**
- **SQLite WAL** — données relationnelles (inspections, scrapes, ressources)
- **FTS5** — index full-text (1.8ms P50 sur 10K docs)
- **sqlite-vec** — embeddings vectoriels (15ms P50 sur 100K vectors)
- **JSON** — configurations, logs d'audit, exports

**Structure :**
```
ekts-data/
├── db/
│   ├── ekts.db           # Données structurées
│   ├── ekts-fts.db       # Index FTS5
│   └── ekts-vectors.db   # Embeddings
├── configs/              # JSON
├── logs/                 # Audit JSON
└── backups/              # Snapshots
```

### 3.2 Modèle de données

**4 entités principales :**
1. **Inspections** — analyses de sites (L1-L4)
2. **Scrapes** — collectes de données
3. **Ressources** — bibliothèque de connaissances
4. **Tags** — classification (N:M)

**Entités support :**
- **Audit Logs** — traçabilité complète
- **Schema Version** — gestion des migrations

**Relations :**
- Inspection → Scrape (1:0..1)
- Scrape → Ressources (1:N)
- Ressources ↔ Tags (N:M via resource_tags)

### 3.3 Stratégie de recherche

**3 niveaux :**
1. **Structurée (SQL)** — WHERE, JOIN, filtres (<5ms)
2. **Full-text (FTS5)** — mots-clés, stemming, ranking (<5ms)
3. **Vectorielle (sqlite-vec)** — embeddings, similarité (5-15ms)

**Recherche hybride :**
- Combinaison FTS + Vector
- RRF (Reciprocal Rank Fusion) pour unifier les rankings
- Précision (FTS) + Rappel (Vector)

**Performance :**
- FTS5 : 1.8ms P50 sur 10K docs (meilleur que PostgreSQL tsvector)
- sqlite-vec : 15ms P50 sur 100K vectors (suffisant pour EKTS)
- Hybride : 10-20ms P50

### 3.4 Compliance intégrée (Phase 05)

**Anonymisation :**
- Hash SHA-256 pour emails
- Suppression données identifiantes
- Implémentation au niveau application

**Rétention :**
- Colonne `retention_until` sur toutes les tables
- Job quotidien de suppression automatique
- Max 1 an conformément à GDPR

**Audit :**
- Table `audit_logs` pour toutes les opérations
- Traçabilité complète (qui, quoi, quand, résultat)
- Export JSON possible

---

## 4. Ce qui est rejeté

- ❌ **PostgreSQL** — overhead opérationnel inutile pour usage personnel
- ❌ **Fichiers JSON purs** — insuffisants pour requêtes complexes
- ❌ **Base vectorielle dédiée** (Qdrant, Pinecone) — overkill pour <100K vectors
- ❌ **Elasticsearch** — complexité excessive pour EKTS

---

## 5. Questions résolues

| Question | Réponse |
|----------|---------|
| SQLite vs PostgreSQL ? | SQLite WAL (performance, simplicité, read-heavy) |
| Comment stocker les embeddings ? | sqlite-vec (brute-force, <100K vectors) |
| Full-text search ? | FTS5 (compétitif avec tsvector) |
| Recherche hybride ? | RRF pour combiner FTS + Vector |
| Comment gérer la rétention ? | Colonne retention_until + job quotidien |
| Comment auditer ? | Table audit_logs avec traçabilité complète |

---

## 6. Questions ouvertes

1. **Performance sqlite-vec sur >100K vectors ?** — À benchmarker lors de l'implémentation
2. **Qualité du ranking RRF vs cross-encoders ?** — À évaluer en Phase 07 (RAG)
3. **Migration vers pgvector si >1M vectors ?** — Decision reportée

---

## 7. Incertitudes

### Zones techniques

- **sqlite-vec >100K** — pas de HNSW, performance dégrade
- **FTS5 fuzzy matching** — pas natif, nécessite extension
- **Hybride ranking** — RRF simple vs cross-encoders (qualité)

### Évolution

- **Dataset >1M rows** — migration PostgreSQL nécessaire
- **Multi-utilisateurs** — SQLite single-writer devient limitant
- **Réplication** — Litestream/LiteFS nécessaires

---

## 8. Progression globale

| Lot | Phases | Statut |
|-----|--------|--------|
| Lot 1 | 01-03 | ✅ Terminé (Fondations, MCP, Conception) |
| Lot 2 | 04-05, 08 | 🔄 En cours (04 ✅, 05 ✅, 08 ⏳) |
| Lot 3 | 06-07, 09 | 🔄 En cours (06 ✅, 07 ⏳, 09 ⏳) |
| Lot 4 | 10-12 | ⏳ À venir |
| Lot 5 | 13-14 | ⏳ À venir |

**Total livrables :** 20 terminés sur 37 (54%)

---

## 9. Phase suivante recommandée

**Phase 07 — RAG et Recherche Sémantique**

### Objectif
Implémenter un système RAG (Retrieval-Augmented Generation) pour EKTS en utilisant les embeddings stockés en Phase 06.

### Questions clés
- Quels modèles d'embedding utiliser ? (OpenAI, local)
- Comment chunker le contenu ? (stratégie de découpage)
- Comment intégrer avec les LLMs ? (prompt engineering)
- Comment évaluer la qualité du retrieval ?

### Livrables attendus
1. `07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md` — Étude des approches RAG
2. `07_JEU_TEST_RECUPERATION.md` — Benchmark de qualité

### Durée estimée
1-2 semaines

### Dépendances
- ✅ Phase 06 terminée — architecture de stockage définie
- ⏳ Phase 08 (Analyse) — peut commencer en parallèle

---

## 10. Décisions architecturales pour la suite

### Impact sur Phase 07 (RAG)

Les décisions de Phase 06 impactent directement le RAG :

- **sqlite-vec** — stockage des embeddings, recherche KNN
- **FTS5** — recherche full-text pour hybrid search
- **Recherche hybride** — RRF pour combiner FTS + Vector
- **Chunking** — stratégie de découpage à définir (contenu texte)

### Impact sur Phase 08 (Analyse)

- **Inspections** — données structurées prêtes pour analyse
- **Métriques** — load_time, error_count, etc. disponibles
- **Audit logs** — traçabilité des opérations

### Impact sur Phase 09 (Créatif)

- **Ressources** — bibliothèque de connaissances indexée
- **Tags** — classification par domaine (A-G)
- **Recherche** — accès rapide aux ressources créatives

---

## 11. Annexes

### A. Configuration SQLite recommandée

```typescript
import Database from 'better-sqlite3';

const db = new Database('ekts-data/db/ekts.db');

// Performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');  // 64MB
db.pragma('foreign_keys = ON');
db.pragma('temp_store = MEMORY');
```

### B. Schéma SQL résumé

```sql
-- Tables principales
CREATE TABLE inspections (...);
CREATE TABLE scrapes (...);
CREATE TABLE resources (...);
CREATE TABLE tags (...);
CREATE TABLE resource_tags (...);
CREATE TABLE audit_logs (...);

-- FTS5
CREATE VIRTUAL TABLE inspections_fts USING fts5(...);
CREATE VIRTUAL TABLE resources_fts USING fts5(...);

-- sqlite-vec
CREATE VIRTUAL TABLE inspection_embeddings USING vec0(...);
CREATE VIRTUAL TABLE resource_embeddings USING vec0(...);
```

### C. API de recherche

```typescript
interface SearchOptions {
  query: string;
  type?: 'structured' | 'fulltext' | 'vector' | 'hybrid';
  filters?: { domain?: string[]; type?: string[]; ... };
  limit?: number;
  offset?: number;
}

async function search(options: SearchOptions): Promise<{
  results: SearchResult[];
  total: number;
  took_ms: number;
}>
```

---

## 12. Sources

### Benchmarks
- **intuitem.com** — "PostgreSQL vs SQLite, 2026 edition"
- **leaper.dev** — "PostgreSQL vs MySQL vs SQLite in 2026"
- **getoyma.com** — "SQLite FTS5 Full-Text Search in Notes"

### Vector databases
- **firecrawl.dev** — "Best Vector Databases in 2026"
- **sqlite.ai** — "Building a RAG on SQLite"

### Documentation
- **SQLite FTS5** : https://www.sqlite.org/fts5.html
- **sqlite-vec** : https://github.com/asg017/sqlite-vec

---

**Bilan rédigé le 21 octobre 2026 — Phase 06 du projet EKTS**
