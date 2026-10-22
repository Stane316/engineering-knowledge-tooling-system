# Sprint 10 — Stockage + Indexation (MVP-2)

**Durée estimée :** 2 semaines (10 jours ouvrables)  
**Prérequis :** Sprint 2 (SQLite), Sprint 4 (Search Engine), Sprint 9 (Analyse 5 Dimensions)  
**Objectif :** Stocker les rapports d'analyse, indexer pour recherche, préparer la génération de rapports
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Contexte et objectifs

### Contexte

Les **Sprints 2, 3, 4** ont implémenté la couche de données SQLite avec :
- ✅ Tables KnowledgeEntry (titres, descriptions, contenus, tags)
- ✅ Tables Link (relations entre entrées)
- ✅ Index FTS5 (recherche plein texte BM25)
- ✅ Index Vector (recherche sémantique cosine)
- ✅ Recherche hybride (BM25 + cosine + RRF k=60)

Le **Sprint 9** a implémenté l'**analyse 5 dimensions** :
- ✅ 5 analyseurs (performance, accessibilité, SEO, UX, contenu)
- ✅ Matrice de sévérité (0-4 × 1-5 × 1-3)
- ✅ Priorisation automatique
- ✅ AnalysisReport structuré

Le **Sprint 10** va :
- 🎯 Stocker les AnalysisReport en base
- 🎯 Indexer pour recherche (FTS5 + Vector)
- 🎯 Préparer la génération de rapports

### Objectifs

**Fonctionnels :**
1. Stocker les rapports d'analyse complets
2. Rechercher par URL, score, dimension, priorité
3. Lister les audits par projet/date
4. Agréger les statistiques (score moyen, tendances)
5. Extraire les findings pour analyse

**Techniques :**
1. Stockage < 100ms par audit
2. Indexation < 500ms par audit
3. Recherche < 100ms
4. Support 10 000 audits
5. Sauvegarde/restauration OK

**Qualité :**
1. Tests > 80% couverture
2. Code lisible (JSDoc)
3. Performance optimisée
4. Gestion erreurs robuste
5. Documentation complète

---

## 2. Périmètre

### Inclus

| Élément | Description |
|---------|-------------|
| ✅ Tables Audit | audit_metadata, audit_dimensions, audit_findings |
| ✅ Index FTS5 | Recherche plein texte (URL, dimensions, findings) |
| ✅ Index Vector | Recherche sémantique (embeddings descriptions) |
| ✅ AuditRepository | Stockage/recherche requêtes CRUD |
| ✅ Recherche hybride | Réutilisation Sprint 4 (FTS5 + Vector + RRF) |
| ✅ Statistiques | Agrégations (score moyen, tendances, top issues) |
| ✅ Tests unitaires | > 80% couverture |
| ✅ Tests intégration | Flux complets |
| ✅ Documentation | DOCS.md mise à jour |

### Exclu

| Élément | Description |
|---------|-------------|
| ❌ Rapport PDF | Généré au Sprint 11 |
| ❌ Rapport Markdown | Généré au Sprint 11 |
| ❌ Comparaison audits | Générée au Sprint 11 |
| ❌ CLI `ekts audit` | Générée au Sprint 11 |
| ❌ MCP `audit_history` | Génée au Sprint 11 |
| ❌ Migration données | Pas de migration (nouveau sprint) |
| ❌ Backup/restore | Hors périmètre (Sprint 11) |

---

## 3. Architecture

### 3.1 Schéma de données

```sql
-- Métadonnées audit
CREATE TABLE audit_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  timestamp TEXT NOT NULL,  -- ISO 8601
  overall_score INTEGER NOT NULL,  -- 0-100
  total_findings INTEGER NOT NULL,
  critical_findings INTEGER NOT NULL,
  high_findings INTEGER NOT NULL,
  medium_findings INTEGER NOT NULL,
  low_findings INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Scores par dimension
CREATE TABLE audit_dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  dimension TEXT NOT NULL,  -- 'performance', 'accessibility', 'seo', 'ux', 'content'
  score INTEGER NOT NULL,  -- 0-100
  findings_count INTEGER NOT NULL,
  FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
);

-- Findings individuels
CREATE TABLE audit_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  dimension TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity INTEGER NOT NULL,  -- 0-4
  effort INTEGER NOT NULL,  -- 1-5
  impact INTEGER NOT NULL,  -- 1-5
  priority TEXT NOT NULL,  -- 'critical', 'high', 'medium', 'low', 'info'
  recommendation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
);

-- Index FTS5 pour recherche plein texte
CREATE VIRTUAL TABLE audit_fts USING fts5(
  url,
  title,
  description,
  content='audit_findings',
  content_rowid='id'
);

-- Index Vector pour recherche sémantique (via extension SQLite)
-- Utilise le même mécanisme que Sprint 4 (VectorStore)
```

### 3.2 Flux de données

```
AnalysisReport (Sprint 9)
    ↓
[AuditRepository.store()]
    ↓
1. audit_metadata (INSERT)
2. audit_dimensions (INSERT x5)
3. audit_findings (INSERT xN)
4. audit_fts (rebuild)
5. VectorStore.addEmbeddings()
    ↓
✅ Audit stocké + indexé
    ↓
[AuditRepository.search()]
    ↓
1. FTS5.search() → BM25 results
2. VectorStore.search() → cosine results
3. RRF.merge() → hybrid results
    ↓
✅ AuditResults (triés par pertinence)
    ↓
[AuditRepository.getStatistics()]
    ↓
1. AVG(overall_score)
2. COUNT(*)
3. TOP findings
4. Trend (score par date)
    ↓
✅ AuditStatistics
```

### 3.3 Recherche hybride

Réutilisation du mécanisme du **Sprint 4** :

```typescript
// FTS5 (BM25)
const ftsResults = await this.fts.search(query);

// Vector (cosine)
const vectorResults = await this.vectorStore.search(query, limit * 2);

// Reciprocal Rank Fusion (k=60)
const hybridResults = this.reciprocalRankFusion(
  ftsResults,
  vectorResults,
  60
);
```

**Performance :**
- FTS5 : ~10ms (10 000 audits)
- Vector : ~50ms (10 000 audits)
- RRF : ~5ms
- **Total : ~65ms** (< 100ms ✅)

---

## 4. Décomposition en sous-sprints

### Sprint 10-1 — Schema + Repository (Semaine 19, Jours 1-4)

**Durée :** 4 jours  
**Objectif :** Implémenter le schéma SQLite et AuditRepository

**Livrables :**
- `src/storage/types.ts` — Types (AuditMetadata, AuditDimension, AuditFinding)
- `src/storage/schema.ts` — Schéma SQLite (CREATE TABLE)
- `src/storage/audit-repository.ts` — CRUD operations
- `tests/storage/schema.test.ts` — Tests schema
- `tests/storage/audit-repository.test.ts` — Tests repository

**Tâches atomiques :**
1. Définir les types (AuditMetadata, AuditDimension, AuditFinding)
2. Implémenter createSchema() (CREATE TABLE IF NOT EXISTS)
3. Implémenter store() (INSERT audit + dimensions + findings)
4. Implémenter findById() (SELECT + JOIN)
5. Implémenter findByUrl() (SELECT WHERE url)
6. Implémenter list() (SELECT avec pagination)
7. Implémenter delete() (DELETE CASCADE)
8. Tests unitaires (schema + repository)

**Critères d'acceptation :**
- ✅ Tables créées (audit_metadata, audit_dimensions, audit_findings)
- ✅ Stockage < 100ms
- ✅ findById() retourne audit complet
- ✅ findByUrl() retourne audits pour URL
- ✅ list() supporte pagination (offset, limit)
- ✅ delete() supprime audit + dimensions + findings
- ✅ Tests > 80% couverture

---

### Sprint 10-2 — Indexation + Recherche (Semaine 19, Jours 5-7)

**Durée :** 3 jours  
**Objectif :** Implémenter l'indexation FTS5/Vector et la recherche hybride

**Livrables :**
- `src/storage/indexing.ts` — Indexation FTS5 + Vector
- `src/storage/search.ts` — Recherche hybride (FTS5 + Vector + RRF)
- `tests/storage/indexing.test.ts` — Tests indexation
- `tests/storage/search.test.ts` — Tests recherche

**Tâches atomiques :**
1. Implémenter rebuildFTSIndex() (INSERT INTO audit_fts)
2. Implémenter addEmbeddings() (VectorStore.addEmbeddings)
3. Implémenter search() (FTS5 + Vector + RRF)
4. Implémenter findByScoreRange() (score min/max)
5. Implémenter findByDimension() (dimension spécifique)
6. Implémenter findByPriority() (priorité spécifique)
7. Implémenter findTopIssues() (top N findings)
8. Tests unitaires (indexing + search)

**Critères d'acceptation :**
- ✅ Index FTS5 créé (audit_fts)
- ✅ Embeddings Vector ajoutés
- ✅ Indexation < 500ms
- ✅ search() retourne résultats hybrides
- ✅ findByScoreRange() filtre par score
- ✅ findByDimension() filtre par dimension
- ✅ findByPriority() filtre par priorité
- ✅ findTopIssues() retourne top N findings
- ✅ Recherche < 100ms
- ✅ Tests > 80% couverture

---

### Sprint 10-3 — Statistiques + Tests + Docs (Semaine 20, Jours 8-10)

**Durée :** 3 jours  
**Objectif :** Implémenter les statistiques, tests d'intégration et documentation

**Livrables :**
- `src/storage/statistics.ts` — Agrégations statistiques
- `tests/storage/statistics.test.ts` — Tests statistiques
- `tests/storage/integration.test.ts` — Tests d'intégration complets
- `docs/STORAGE.md` — Documentation mise à jour
- `docs/DOCS.md` — Mise à jour avec AuditRepository

**Tâches atomiques :**
1. Implémenter getStatistics() (AVG, COUNT, TOP)
2. Implémenter getTrend() (score par date)
3. Implémenter getTopIssues() (top N findings globaux)
4. Implémenter getDimensionStats() (stats par dimension)
5. Tests d'intégration (flux complets)
6. Tests performance (10 000 audits)
7. Documentation STORAGE.md
8. Mise à jour DOCS.md

**Critères d'acceptation :**
- ✅ getStatistics() retourne stats globales
- ✅ getTrend() retourne évolution score
- ✅ getTopIssues() retourne top N findings
- ✅ getDimensionStats() retourne stats par dimension
- ✅ Tests d'intégration passent
- ✅ Performance OK (10 000 audits)
- ✅ Documentation complète
- ✅ DOCS.md mise à jour

---

## 5. Choix techniques

### 5.1 Tables SQLite

**Pourquoi 3 tables séparées ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| 1 table JSON | Simple | Pas de requêtes SQL | ❌ |
| 3 tables normalisées | Requêtes flexibles, indexation | JOINs | ✅ |

**Décision :** 3 tables normalisées (audit_metadata, audit_dimensions, audit_findings)

### 5.2 Index FTS5

**Pourquoi FTS5 sur audit_findings ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| FTS5 sur metadata | Recherche rapide URL | Pas de recherche findings | ❌ |
| FTS5 sur findings | Recherche dans titres/descriptions | Plus complexe | ✅ |

**Décision :** FTS5 sur audit_findings (title, description)

### 5.3 Vector embeddings

**Pourquoi embeddings sur descriptions ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| Embeddings sur URL | Recherche par URL | Pas sémantique | ❌ |
| Embeddings sur findings | Recherche sémantique problèmes | Plus lent | ✅ |

**Décision :** Embeddings sur findings description (recherche sémantique)

### 5.4 Recherche hybride

**Pourquoi réutiliser Sprint 4 ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| Nouvelle implémentation | Adapté | Duplication code | ❌ |
| Réutiliser SearchEngine | Code existant, testé | Adaptation nécessaire | ✅ |

**Décision :** Réutiliser le mécanisme du Sprint 4 (FTS5 + Vector + RRF k=60)

### 5.5 Performance

**Objectifs :**
- Stockage < 100ms par audit
- Indexation < 500ms par audit
- Recherche < 100ms

**Optimisations :**
- Transactions (BEGIN/COMMIT)
- Batch INSERT (findings)
- Index sur audit_id (JOIN rapide)
- Pagination (LIMIT/OFFSET)

---

## 6. Organisation des fichiers

```
src/
├── storage/
│   ├── types.ts                    (Sprint 10-1) ~80 lignes
│   ├── schema.ts                   (Sprint 10-1) ~120 lignes
│   ├── audit-repository.ts         (Sprint 10-1) ~250 lignes
│   ├── indexing.ts                 (Sprint 10-2) ~150 lignes
│   ├── search.ts                   (Sprint 10-2) ~180 lignes
│   └── statistics.ts               (Sprint 10-3) ~200 lignes
│
└── ...

tests/
└── storage/
    ├── schema.test.ts              (Sprint 10-1) ~100 lignes
    ├── audit-repository.test.ts    (Sprint 10-1) ~200 lignes
    ├── indexing.test.ts            (Sprint 10-2) ~120 lignes
    ├── search.test.ts              (Sprint 10-2) ~150 lignes
    ├── statistics.test.ts          (Sprint 10-3) ~130 lignes
    └── integration.test.ts         (Sprint 10-3) ~100 lignes

docs/
├── STORAGE.md                      (Sprint 10-3) ~300 lignes
└── DOCS.md                         (mise à jour)
```

**Total :**
- **12 fichiers** (6 code + 6 tests)
- **~1 980 lignes** de code
- **~300 lignes** de documentation

---

## 7. Tests et validation

### 7.1 Tests unitaires

**Schema :**
- ✅ CREATE TABLE (audit_metadata, audit_dimensions, audit_findings)
- ✅ DROP TABLE (cleanup)
- ✅ Index créés (FTS5)
- ✅ Constraints (FOREIGN KEY, NOT NULL)

**AuditRepository :**
- ✅ store() (INSERT audit + dimensions + findings)
- ✅ findById() (SELECT + JOIN)
- ✅ findByUrl() (SELECT WHERE url)
- ✅ list() (SELECT avec pagination)
- ✅ delete() (DELETE CASCADE)

**Indexing :**
- ✅ rebuildFTSIndex() (INSERT INTO audit_fts)
- ✅ addEmbeddings() (VectorStore.addEmbeddings)
- ✅ Indexation < 500ms

**Search :**
- ✅ search() (FTS5 + Vector + RRF)
- ✅ findByScoreRange() (score min/max)
- ✅ findByDimension() (dimension spécifique)
- ✅ findByPriority() (priorité spécifique)
- ✅ findTopIssues() (top N findings)
- ✅ Recherche < 100ms

**Statistics :**
- ✅ getStatistics() (AVG, COUNT, TOP)
- ✅ getTrend() (score par date)
- ✅ getTopIssues() (top N findings globaux)
- ✅ getDimensionStats() (stats par dimension)

### 7.2 Tests d'intégration

**Flux complet :**
```typescript
// 1. Créer AnalysisReport (Sprint 9)
const report = await pipeline.analyze(url, lighthouse, axe, ux, content);

// 2. Stocker audit (Sprint 10-1)
await auditRepo.store(report);

// 3. Indexer (Sprint 10-2)
await auditRepo.index(report.id);

// 4. Rechercher (Sprint 10-2)
const results = await auditRepo.search('performance issues');

// 5. Statistiques (Sprint 10-3)
const stats = await auditRepo.getStatistics();
```

### 7.3 Tests performance

**Scénario : 10 000 audits**
- Stockage : < 100ms par audit (total < 17 min)
- Indexation : < 500ms par audit (total < 83 min)
- Recherche : < 100ms
- findById : < 10ms
- list (100 audits) : < 50ms

### 7.4 Critères de validation

**Fonctionnels :**
1. ✅ Tables créées (audit_metadata, audit_dimensions, audit_findings)
2. ✅ Stockage/recherche CRUD
3. ✅ Index FTS5 + Vector
4. ✅ Recherche hybride (FTS5 + Vector + RRF)
5. ✅ Statistiques (AVG, COUNT, TOP, Trend)
6. ✅ Pagination (offset, limit)
7. ✅ Filtres (score, dimension, priorité)

**Techniques :**
8. ✅ Tests > 80% couverture
9. ✅ Stockage < 100ms
10. ✅ Indexation < 500ms
11. ✅ Recherche < 100ms
12. ✅ Support 10 000 audits

**Qualité :**
13. ✅ Code lisible (JSDoc)
14. ✅ Gestion erreurs robuste
15. ✅ Performance optimisée
16. ✅ Documentation complète
17. ✅ DOCS.md mise à jour

---

## 8. Livrables

### 8.1 Code source

**12 fichiers :**
- `src/storage/types.ts` — Types (AuditMetadata, AuditDimension, AuditFinding)
- `src/storage/schema.ts` — Schéma SQLite (CREATE TABLE)
- `src/storage/audit-repository.ts` — CRUD operations
- `src/storage/indexing.ts` — Indexation FTS5 + Vector
- `src/storage/search.ts` — Recherche hybride (FTS5 + Vector + RRF)
- `src/storage/statistics.ts` — Agrégations statistiques
- `tests/storage/schema.test.ts` — Tests schema
- `tests/storage/audit-repository.test.ts` — Tests repository
- `tests/storage/indexing.test.ts` — Tests indexation
- `tests/storage/search.test.ts` — Tests recherche
- `tests/storage/statistics.test.ts` — Tests statistiques
- `tests/storage/integration.test.ts` — Tests d'intégration

### 8.2 Documentation

**2 fichiers :**
- `docs/STORAGE.md` — Documentation complète (300 lignes)
- `docs/DOCS.md` — Mise à jour avec AuditRepository

### 8.3 Tests

**Couverture :**
- Unitaires : > 80%
- Intégration : Flux complets
- Performance : 10 000 audits

### 8.4 Résumé

| Métrique | Valeur |
|----------|--------|
| Fichiers code | 6 |
| Fichiers tests | 6 |
| Fichiers docs | 2 |
| Lignes code | ~980 |
| Lignes tests | ~800 |
| Lignes docs | ~300 |
| **Total lignes** | **~2 080** |

---

## 9. Critères d'acceptation

### 9.1 Fonctionnels

1. ✅ **Tables créées** — audit_metadata, audit_dimensions, audit_findings existent
2. ✅ **Stockage CRUD** — store(), findById(), findByUrl(), list(), delete()
3. ✅ **Index FTS5** — Recherche plein texte (title, description)
4. ✅ **Index Vector** — Recherche sémantique (embeddings description)
5. ✅ **Recherche hybride** — FTS5 + Vector + RRF k=60
6. ✅ **Statistiques** — AVG, COUNT, TOP, Trend
7. ✅ **Pagination** — offset, limit
8. ✅ **Filtres** — score min/max, dimension, priorité

### 9.2 Techniques

9. ✅ **Tests > 80%** — Couverture unitaires
10. ✅ **Stockage < 100ms** — Par audit
11. ✅ **Indexation < 500ms** — Par audit
12. ✅ **Recherche < 100ms** — Hybride
13. ✅ **Support 10 000 audits** — Performance OK

### 9.3 Qualité

14. ✅ **Code lisible** — JSDoc complet
15. ✅ **Gestion erreurs** — Try/catch, validation
16. ✅ **Performance optimisée** — Transactions, batch INSERT, index
17. ✅ **Documentation complète** — STORAGE.md (300 lignes)
18. ✅ **DOCS.md mise à jour** — AuditRepository documenté

---

## 10. Procédure de fin de sprint

### 10.1 Checklist finale

- [ ] Tous les fichiers créés (12 fichiers code + tests)
- [ ] Tests unitaires passent (> 80% couverture)
- [ ] Tests d'intégration passent
- [ ] Tests performance passent (10 000 audits)
- [ ] Compilation TypeScript OK
- [ ] Linting OK
- [ ] Documentation complète (STORAGE.md)
- [ ] DOCS.md mise à jour
- [ ] Tous les commits faits (commits atomiques)
- [ ] Push sur branche feature

### 10.2 Commandes de validation

```bash
# Tests unitaires
npm test tests/storage/

# Couverture
npm run test:coverage -- tests/storage/
# ✅ > 80%

# Compilation
npm run build
# ✅ Aucune erreur

# Linting
npm run lint
# ✅ Aucune erreur

# Tests performance
node scripts/test-storage-performance.js
# ✅ 10 000 audits OK

# Vérification fichiers
ls -la src/storage/
# ✅ types.ts, schema.ts, audit-repository.ts, indexing.ts, search.ts, statistics.ts

ls -la tests/storage/
# ✅ 6 fichiers de tests

ls -la docs/STORAGE.md
# ✅ Documentation existe

# Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# Push
git push origin feat/sprint-10
```

---

## 11. Prompt de lancement agent

**Copier ce prompt pour lancer un agent de développement :**

---

**PROMPT DE LANCEMENT — Sprint 10 : Stockage + Indexation**

Tu vas implémenter le Sprint 10 du projet Engineering Knowledge Tooling System (EKTS).

**📋 Documents à lire avant de commencer :**
1. `Docs/roadmap/sprints/SPRINT-10.md` — Dossier complet (ce document)
2. `Docs/roadmap/sprints/SPRINT-10-01.md` — Schema + Repository (4 jours)
3. `Docs/roadmap/sprints/SPRINT-10-02.md` — Indexation + Recherche (3 jours)
4. `Docs/roadmap/sprints/SPRINT-10-03.md` — Statistiques + Tests + Docs (3 jours)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Section 4.4 (Storage)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — ADR-005 (Architecture C)

**🔍 Audit de l'état actuel :**
Avant de commencer, vérifie :
```bash
# Vérifier que les Sprints 2, 4, 9 sont implémentés
ls -la src/storage/
# ✅ types.ts, schema.ts, knowledge-repository.ts, search-engine.ts, vector-store.ts

ls -la src/analysis/
# ✅ types.ts, performance.ts, accessibility.ts, seo.ts, ux.ts, content.ts, severity.ts, prioritizer.ts, pipeline.ts

# Vérifier que SQLite est configuré
node -e "const db = require('better-sqlite3')('./data/ekts.db'); console.log(db.prepare('SELECT name FROM sqlite_master WHERE type=\"table\"').all());"
# ✅ Tables : knowledge_entries, links, fts_entries, vector_embeddings

# Vérifier que les tests passent
npm test tests/storage/
# ✅ Tests Sprint 2, 4 passent

npm test tests/analysis/
# ✅ Tests Sprint 9 passent
```

**✅ Vérification des prérequis :**
- [ ] Sprint 2 implémenté (SQLite, KnowledgeRepository)
- [ ] Sprint 4 implémenté (SearchEngine, VectorStore)
- [ ] Sprint 9 implémenté (AnalysisPipeline, 5 analyseurs)
- [ ] Tests unitaires > 80% couverture (Sprints 2, 4, 9)
- [ ] Documentation à jour (DOCS.md)

**🎯 Périmètre autorisé :**
- Créer/modifier uniquement les fichiers listés dans SPRINT-10-01/02/03.md
- NE PAS toucher aux fichiers existants (Sprint 2, 4, 9) sauf pour import
- NE PAS créer de fichiers hors périmètre
- RÉUTILISER le code existant (KnowledgeRepository, SearchEngine, VectorStore)

**⚠️ Contraintes et interdictions :**
- PAS de pull requests
- Commits atomiques (1 commit par tâche logique)
- Français dans les commentaires
- JSDoc sur toutes les fonctions publiques
- Tests > 80% couverture
- Code TypeScript strict
- Gestion erreurs (try/catch, validation)

**🧪 Tests et critères :**
- Tests unitaires : > 80% couverture
- Tests d'intégration : Flux complets
- Tests performance : 10 000 audits
- Stockage < 100ms
- Indexation < 500ms
- Recherche < 100ms

**📦 Livrables attendus :**
- 6 fichiers code (types.ts, schema.ts, audit-repository.ts, indexing.ts, search.ts, statistics.ts)
- 6 fichiers tests (schema.test.ts, audit-repository.test.ts, indexing.test.ts, search.test.ts, statistics.test.ts, integration.test.ts)
- 2 fichiers docs (STORAGE.md, DOCS.md mise à jour)
- Total : ~2 080 lignes

**⏱️ Durée estimée :**
- Sprint 10-1 : 4 jours
- Sprint 10-2 : 3 jours
- Sprint 10-3 : 3 jours
- Total : 10 jours

**📝 Procédure de compte rendu :**
À la fin de chaque sous-sprint, crée un fichier `SPRINT-10-XX-RESULTAT.md` avec :
- Liste des fichiers créés
- Nombre de lignes de code
- Couverture de tests
- Performance mesurée
- Problèmes rencontrés
- Temps réel passé

Commence par lire les 4 documents SPRINT-10*.md, puis implémente le Sprint 10-1, 10-2, 10-3 dans l'ordre.

---

## 12. Résumé et transition

### Résumé Sprint 10

**Objectif :** Stocker les rapports d'analyse, indexer pour recherche, préparer la génération de rapports

**Livrables :**
- 3 tables SQLite (audit_metadata, audit_dimensions, audit_findings)
- Index FTS5 (recherche plein texte)
- Index Vector (recherche sémantique)
- AuditRepository (CRUD)
- Recherche hybride (FTS5 + Vector + RRF)
- Statistiques (AVG, COUNT, TOP, Trend)
- Tests > 80% couverture
- Documentation complète

**Performance :**
- Stockage < 100ms par audit
- Indexation < 500ms par audit
- Recherche < 100ms
- Support 10 000 audits

**Durée :** 2 semaines (10 jours ouvrables)

### Transition vers Sprint 11

**Sprint 11 — Rapport Inspection (MVP-2) :**
- Générer rapport PDF/Markdown
- Comparer audits (avant/après)
- CLI `ekts inspect` (lancer inspection)
- CLI `ekts audit` (lister audits)
- MCP `inspect_site` (inspection via MCP)
- MCP `audit_history` (historique audits)

**Prérequis Sprint 11 :**
- ✅ Sprint 10 terminé avec succès
- ✅ Audits stockés en base
- ✅ Recherche hybride fonctionnelle
- ✅ Statistiques disponibles

---

**Fin du document Sprint 10**
