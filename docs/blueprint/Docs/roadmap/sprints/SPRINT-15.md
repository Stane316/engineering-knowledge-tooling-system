# SPRINT-15 — Capitalisation Connaissances

**Sprint :** 15 sur 18  
**MVP :** MVP-3 (Capitalisation de Projets)  
**Durée estimée :** 2 semaines (9 jours ouvrables)  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le Sprint 13 a mis en place la gestion multi-projets et le Sprint 14 le suivi temporel. EKTS dispose maintenant d'une base d'audits organisée par projets avec historique complet : constats (findings), scores par dimension, recommandations.

Le problème : ces connaissances restent **passives**. Un constat résolu avec succès sur un projet A n'est pas automatiquement proposé comme référence pour un projet B qui rencontre le même problème. Les équipes répètent les mêmes analyses sans capitaliser sur l'existant.

Le Sprint 15 transforme cette base d'audits en **capital actif** : les bonnes pratiques extraites des audits réussis deviennent réutilisables, recherchables et associables aux constats courants.

### 1.2 Objectifs du Sprint 15

Le Sprint 15 doit fournir :

1. **Modèle BestPractice** — Structure de données pour les bonnes pratiques (titre, description, catégorie, tags, projets source)
2. **Extraction automatique** — Détection des patterns de constats résolus et transformation en bonnes pratiques
3. **Recherche hybride** — Recherche sémantique dans les bonnes pratiques (réutilisation FTS5 + vecteurs + RRF)
4. **Associations findings ↔ bonnes pratiques** — Lien explicite entre un constat récurrent et la bonne pratique qui le résout
5. **CLI `ekts bestpractice`** — Commandes `list`, `search`, `add`, `show`, `delete`
6. **MCP `search_best_practices`, `add_best_practice`** — Outils MCP pour les agents IA
7. **Tests complets** — Couverture > 80%
8. **Documentation** — Guide utilisateur et référence API

### 1.3 Périmètre

**Inclus :**
- Modèle de données `BestPractice` avec table dédiée SQLite
- Module `BestPracticeRepository` (CRUD, filtres, pagination)
- Module `BestPracticeExtractor` (extraction automatique depuis audits)
- Module `BestPracticeSearch` (recherche hybride FTS5 + RRF)
- Table d'association `finding_best_practice` (finding_id ↔ best_practice_id)
- Commande CLI `ekts bestpractice` (5 sous-commandes)
- 2 outils MCP (`search_best_practices`, `add_best_practice`)
- Tests unitaires et d'intégration
- Documentation utilisateur et technique

**Exclu :**
- Moteur de recommandations contextuelles (Sprint 16)
- Templates de projets (Sprint 17)
- Partage entre instances (MVP-4)
- Validation collaborative des bonnes pratiques (post-MVP)
- Export/import de bonnes pratiques (post-MVP)

### 1.4 Critères d'acceptation

**Fonctionnels :**
- C15.1 : Une bonne pratique peut être créée manuellement (titre, description, catégorie, tags)
- C15.2 : L'extracteur automatique détecte les patterns de constats résolus (> 2 occurrences, score amélioré)
- C15.3 : Les bonnes pratiques sont recherchables par texte plein (FTS5)
- C15.4 : Les bonnes practices sont recherchables par similarité sémantique (embeddings si disponibles)
- C15.5 : Fusion RRF des résultats FTS5 + sémantique (k=60, réutilisation du moteur existant)
- C15.6 : Association explicite finding ↔ bonne pratique (lien bidirectionnel)
- C15.7 : Commande CLI `ekts bestpractice list` affiche les bonnes pratiques avec filtres
- C15.8 : Commande CLI `ekts bestpractice search` effectue une recherche hybride
- C15.9 : Commande CLI `ekts bestpractice add` crée manuellement une bonne pratique
- C15.10 : Commande CLI `ekts bestpractice show` affiche le détail d'une bonne pratique
- C15.11 : Outil MCP `search_best_practices` retourne les résultats de recherche
- C15.12 : Outil MCP `add_best_practice` crée une bonne pratique

**Techniques :**
- C15.13 : Extraction automatique < 5s pour 100 audits
- C15.14 : Recherche hybride < 100ms pour 1 000 bonnes pratiques
- C15.15 : Couverture de tests > 80%
- C15.16 : Code linté sans erreur (`npm run lint`)
- C15.17 : Documentation complète (guide utilisateur + référence API)

**Qualité :**
- C15.18 : Bonne pratique liée aux projets source (traçabilité)
- C15.19 : Déduplication des bonnes pratiques extraites (même pattern = fusion)
- C15.20 : Gestion des cas limites (0 audit, 1 audit, audits sans findings résolus)

### 1.5 Dépendances

**Prérequis :**
- Sprint 10 : Stockage des audits (table `audit_metadata`, `audit_findings`)
- Sprint 13 : Gestion multi-projets (table `projects`, `project_id` dans `audit_metadata`)
- Sprint 4 : Moteur de recherche hybride (FTS5 + vecteurs + RRF) — réutilisation

**Dépendances futures :**
- Sprint 16 : Le moteur de recommandations utilisera les bonnes pratiques
- Sprint 18 : Tests E2E MVP-3 intégreront le flux de capitalisation

---

## 2. Architecture et conception

### 2.1 Composants à créer

```
src/best-practices/
├── best-practice.types.ts       # Types partagés
├── best-practice-repository.ts  # CRUD + filtres + pagination
├── best-practice-extractor.ts   # Extraction automatique depuis audits
├── best-practice-search.ts      # Recherche hybride (FTS5 + RRF)
└── best-practice-service.ts     # Orchestrateur (facade)

src/cli/commands/
└── best-practice.ts             # Commande ekts bestpractice

src/mcp/tools/
├── search-best-practices.ts     # Outil MCP search_best_practices
└── add-best-practice.ts         # Outil MCP add_best_practice
```

### 2.2 Interfaces principales

**BestPracticeRepository :**
```typescript
interface BestPracticeRepository {
  create(input: CreateBestPracticeInput): Promise<BestPractice>;
  getById(id: string): Promise<BestPractice | null>;
  list(filters?: BestPracticeFilters): Promise<BestPractice[]>;
  update(id: string, input: UpdateBestPracticeInput): Promise<BestPractice>;
  delete(id: string): Promise<void>;
  findByFindingId(findingId: string): Promise<BestPractice[]>;
  linkToFinding(bestPracticeId: string, findingId: string): Promise<void>;
  unlinkFromFinding(bestPracticeId: string, findingId: string): Promise<void>;
}
```

**BestPracticeExtractor :**
```typescript
interface BestPracticeExtractor {
  extractFromProject(projectId: string): Promise<ExtractionReport>;
  extractFromAudit(auditId: number): Promise<BestPractice[]>;
  deduplicate(practices: BestPractice[]): Promise<BestPractice[]>;
}
```

**BestPracticeSearch :**
```typescript
interface BestPracticeSearch {
  search(options: BestPracticeSearchOptions): Promise<BestPracticeSearchResult[]>;
}
```

### 2.3 Modèle de données

**Nouvelles tables :**

**Table `best_practices` :**
```sql
CREATE TABLE best_practices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,          -- 'performance' | 'accessibility' | 'seo' | 'ux' | 'content' | 'general'
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array de tags
  source_project_ids TEXT NOT NULL DEFAULT '[]', -- JSON array des projets source
  source_audit_ids TEXT NOT NULL DEFAULT '[]',   -- JSON array des audits source
  occurrence_count INTEGER NOT NULL DEFAULT 1,   -- Nombre de fois détecté
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_manual INTEGER NOT NULL DEFAULT 0  -- 1 si créée manuellement
);

CREATE INDEX idx_best_practices_category ON best_practices(category);
CREATE INDEX idx_best_practices_created_at ON best_practices(created_at DESC);
```

**Table `best_practices_fts` (FTS5) :**
```sql
CREATE VIRTUAL TABLE best_practices_fts USING fts5(
  title,
  description,
  tags,
  content='best_practices',
  content_rowid='rowid'
);
```

**Table `finding_best_practice` (association) :**
```sql
CREATE TABLE finding_best_practice (
  finding_title TEXT NOT NULL,    -- Titre normalisé du finding
  dimension TEXT NOT NULL,        -- Dimension du finding
  best_practice_id TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1.0,  -- Confiance de l'association
  created_at TEXT NOT NULL,
  PRIMARY KEY (finding_title, dimension, best_practice_id),
  FOREIGN KEY (best_practice_id) REFERENCES best_practices(id) ON DELETE CASCADE
);

CREATE INDEX idx_finding_bp_finding ON finding_best_practice(finding_title, dimension);
CREATE INDEX idx_finding_bp_practice ON finding_best_practice(best_practice_id);
```

### 2.4 Algorithme d'extraction automatique

**Principe :** Détecter les patterns de constats récurrents qui ont été résolus (amélioration de score entre 2 audits consécutifs d'un même projet).

**Étapes :**

1. **Collecte des constats récurrents** — Regrouper les findings par `(titre, dimension)` et compter les occurrences
2. **Détection de résolution** — Pour chaque projet, comparer les audits consécutifs : si un finding présent dans l'audit N n'est plus dans l'audit N+1 ET que le score de la dimension a augmenté, le finding est considéré "résolu"
3. **Extraction** — Pour chaque finding résolu récurrent (≥ 2 occurrences) :
   - Créer une bonne pratique avec le titre, la recommandation du finding, la dimension
   - Lier aux projets/audits source
   - Compter les occurrences
4. **Déduplication** — Fusionner les bonnes pratiques avec le même titre normalisé (levenshtein < 3)
5. **Association** — Lier les findings courants aux bonnes pratiques correspondantes

### 2.5 Réutilisation du capital MVP-2

| Capital existant | Réutilisation Sprint 15 |
|-----------------|------------------------|
| `AuditRepository` | Lecture des findings pour extraction |
| `AuditSearch` (FTS5 + RRF) | Pattern de recherche hybride à reproduire |
| `RRF_K = 60`, `reciprocalRank()` | Fusion des résultats FTS + sémantique |
| `ProjectRepository` | Filtrage par projet pour extraction |
| `severity`, `priority` | Tri des findings à extraire (priorité haute d'abord) |
| `AuditStatisticsManager` | Détection des améliorations de score |
| CLI Commander (`program`, `registerCommand`) | Extension naturelle pour `ekts bestpractice` |
| Schémas Zod + handlers MCP | Nouveaux outils `search_best_practices`, `add_best_practice` |

---

## 3. Décomposition en sous-sprints

### 3.1 Vue d'ensemble

**3 sous-sprints :**

| Sous-sprint | Durée | Objectif |
|-------------|-------|----------|
| **Sprint 15-01** | 3 jours | Types + Migration + BestPracticeRepository + BestPracticeSearch |
| **Sprint 15-02** | 3 jours | BestPracticeExtractor + BestPracticeService + associations |
| **Sprint 15-03** | 3 jours | CLI + MCP + Tests intégration + Documentation |

### 3.2 Dépendances entre sous-sprints

```
Sprint 15-01 (Repository + Search)
    ↓
Sprint 15-02 (Extractor + Service + associations)
    ↓
Sprint 15-03 (CLI + MCP + Docs)
```

**Dépendances critiques :**
- 15-02 dépend de 15-01 (besoin de `BestPracticeRepository` pour créer les bonnes pratiques extraites)
- 15-03 dépend de 15-01 et 15-02 (besoin du service complet pour CLI/MCP)

---

## 4. Livrables

### 4.1 Code source

**Sprint 15-01 :**
- `src/best-practices/best-practice.types.ts`
- `src/best-practices/best-practice-repository.ts`
- `src/best-practices/best-practice-search.ts`
- `src/storage/migrations/006_create_best_practices.ts`

**Sprint 15-02 :**
- `src/best-practices/best-practice-extractor.ts`
- `src/best-practices/best-practice-service.ts`

**Sprint 15-03 :**
- `src/cli/commands/best-practice.ts`
- `src/mcp/tools/search-best-practices.ts`
- `src/mcp/tools/add-best-practice.ts`

### 4.2 Tests

- `tests/best-practices/best-practice-repository.test.ts`
- `tests/best-practices/best-practice-search.test.ts`
- `tests/best-practices/best-practice-extractor.test.ts`
- `tests/best-practices/best-practice-service.test.ts`
- `tests/cli/best-practice.test.ts`
- `tests/mcp/tools/search-best-practices.test.ts`
- `tests/mcp/tools/add-best-practice.test.ts`
- `tests/integration/best-practices-integration.test.ts`

### 4.3 Documentation

- `docs/user/BEST_PRACTICES.md` — Guide utilisateur
- Mise à jour de `docs/reference/CLI_REFERENCE.md`
- Mise à jour de `docs/reference/MCP_REFERENCE.md`

### 4.4 Modifications de fichiers existants

- `src/storage/migrations/migration-registry.ts` — Ajout migration 006
- `src/storage/types.ts` — Ajout types BestPractice, BestPracticeFilters, etc.
- `src/cli/index.ts` — Enregistrement commande bestpractice
- `src/mcp/tools/index.ts` — Enregistrement nouveaux outils

### 4.5 Rapport de sprint

- `SPRINT-15-RESULTAT.md` — Rapport final du sprint

---

## 5. Décisions techniques

### ADR-033 : Réutilisation du pattern FTS5 + RRF

**Décision :** Reproduire le pattern de recherche hybride du Sprint 4 (FTS5 + vecteurs + RRF k=60) pour la recherche de bonnes pratiques.

**Justification :**
- Pattern éprouvé (Sprint 4 : Recall@5 = 1.000, benchmark 100k documents)
- Pas de nouvelle dépendance
- Cohérence avec la recherche d'audits existante
- Les agents IA connaissent déjà ce pattern via MCP

**Conséquences :**
- Créer `best_practices_fts` (table virtuelle FTS5 synchronisée)
- Réutiliser `reciprocalRank()` et `RRF_K = 60` de `src/business/rrf.ts`
- Sans embeddings : recherche FTS5 seule (comme pour les audits)

### ADR-034 : Extraction basée sur les constats résolus

**Décision :** Extraire les bonnes pratiques depuis les constats (findings) qui ont été résolus avec succès (disparition entre 2 audits consécutifs + amélioration du score).

**Justification :**
- Preuve empirique que la recommandation du finding fonctionne
- Pas de ML requis (règles explicites)
- Traçabilité : chaque bonne pratique est liée aux audits source

**Conséquences :**
- Nécessite au minimum 2 audits d'un même projet pour détecter une résolution
- Un finding doit apparaître ≥ 2 fois dans l'historique pour être extrait
- La bonne pratique hérite du titre et de la recommandation du finding

### ADR-035 : Table d'association finding ↔ bonne pratique

**Décision :** Utiliser une table de jointure `finding_best_practice` avec clé composite `(finding_title, dimension, best_practice_id)` plutôt qu'un simple champ JSON.

**Justification :**
- Requêtes SQL efficaces (index sur finding_title + dimension)
- Permet de retrouver toutes les bonnes pratiques liées à un finding donné
- Permet de retrouver tous les findings liés à une bonne pratique
- Normalisation relationnelle correcte

**Conséquences :**
- Clé primaire composite (pas d'auto-incrément)
- Cascade sur DELETE de la bonne pratique
- Champ `confidence` pour pondérer la pertinence de l'association

---

## 6. Risques et mitigations

| ID | Risque | Prob. | Impact | Mitigation |
|----|--------|-------|--------|------------|
| R15.1 | Faux positifs dans l'extraction (finding disparu ≠ résolu) | Moyen | Moyen | Exiger ≥ 2 audits consécutifs + amélioration du score de la dimension |
| R15.2 | Prolifération de bonnes pratiques dupliquées | Moyen | Faible | Déduplication par titre normalisé (levenshtein < 3) + fusion des occurrences |
| R15.3 | Associations finding ↔ BP inexactes | Faible | Moyen | Score de confiance, ajustement manuel possible via CLI |
| R15.4 | Performance extraction sur gros volumes | Faible | Moyen | Traitement batch par projet, index sur project_id + timestamp |

---

## 7. Prompt d'exécution pour l'agent de développement

**CONTEXTE :**
- Projet : EKTS (Engineering Knowledge Tooling System)
- Sprint : 15 — Capitalisation Connaissances
- Branche : `develop`
- Prérequis : Sprint 13 (multi-projets) + Sprint 14 (suivi temporel) terminés

**INSTRUCTIONS :**

1. Lire `SPRINT-15.md` (ce document) pour comprendre les objectifs et l'architecture
2. Lire `SPRINT-15-01.md` pour le sous-sprint 1
3. Implémenter les tâches du sous-sprint 15-01 dans l'ordre :
   - Types → Migration → Repository → Search
4. Rédiger `SPRINT-15-01-RESULTAT.md` avec les fichiers créés/modifiés
5. Exécuter `npm run verify` et corriger les erreurs
6. Lire `SPRINT-15-02.md` pour le sous-sprint 2
7. Implémenter les tâches du sous-sprint 15-02 dans l'ordre :
   - Extractor → Service
8. Rédiger `SPRINT-15-02-RESULTAT.md`
9. Exécuter `npm run verify` et corriger les erreurs
10. Lire `SPRINT-15-03.md` pour le sous-sprint 3
11. Implémenter les tâches du sous-sprint 15-03 dans l'ordre :
    - CLI → MCP → Tests intégration → Documentation
12. Rédiger `SPRINT-15-RESULTAT.md` (rapport final)
13. Exécuter `npm run verify` et corriger les erreurs

**CONTRAINTES :**
- Respecter les conventions du projet (ESLint, Prettier, TypeScript strict)
- Tests unitaires pour chaque module
- Couverture > 80% pour les nouveaux modules
- Documentation utilisateur (BEST_PRACTICES.md)
- Pas de breaking changes sur l'API existante
- Fournir les emplacements exacts des fichiers créés/modifiés/supprimés

**LIVRABLES ATTENDUS :**
- Code source fonctionnel (`src/best-practices/`, `src/cli/`, `src/mcp/`)
- Tests unitaires et d'intégration
- Documentation utilisateur et référence
- Rapport de sprint (`SPRINT-15-RESULTAT.md`)
- `npm run verify` passe sans erreur

---

**Document rédigé le 25 octobre 2026 — Sprint 15 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 15 prêt pour implémentation**
