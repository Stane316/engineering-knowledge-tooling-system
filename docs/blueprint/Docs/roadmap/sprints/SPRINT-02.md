# Sprint 2 — Data Layer (SQLite)

**Identifiant :** SPRINT-02  
**Nom :** Implémentation de la couche données SQLite  
**Position dans la roadmap :** Sprint 2 de MVP-1  
**Durée prévue :** 2 semaines (Semaine 3-4)  
**Date de documentation :** 21 octobre 2026  
**Statut :** ✅ TERMINÉ (22/10/2026)  
**Dépend de :** SPRINT-01 (Setup projet) ✅

---

## 1. Contexte et objectifs

### 1.1 Contexte indispensable

EKTS nécessite une couche de persistance pour stocker ressources, projets et audits. L'architecture cible (ADR-005) prévoit 3 bases SQLite séparées pour isoler les préoccupations :
- `ekts.db` — Données structurées
- `ekts-fts.db` — Index full-text (FTS5)
- `ekts-vectors.db` — Index vectoriel (sqlite-vec)

**Documents de référence obligatoires :**
- `Docs/02-ARCHITECTURE-TECHNIQUE.md` §4.3 — Data Layer
- `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — ADR-001 (SQLite WAL)
- `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` — Architecture détaillée
- `04-Knowledge/06_MODELE_DONNEES.md` — Modèle de données

**Décisions à respecter :**
- ADR-001 : SQLite WAL + FTS5 + sqlite-vec (3 bases séparées)
- ADR-005 : Architecture C Hybride

### 1.2 Objectif principal

**Implémenter la couche données complète :**
- 3 bases SQLite avec schémas appropriés
- FTS5 pour recherche full-text
- sqlite-vec pour recherche vectorielle
- Repository pattern (CRUD)
- Validation Zod
- Tests unitaires > 80% couverture

### 1.3 Problème traité

**Avant ce sprint :** Pas de persistance, données en mémoire seulement  
**Après ce sprint :** Données persistées dans SQLite, requêtables via Repository

### 1.4 Résultat attendu

**Livrables :**
- ✅ 3 bases SQLite créées et configurées
- ✅ Schémas de données implémentés
- ✅ FTS5 opérationnel
- ✅ sqlite-vec opérationnel
- ✅ Repository Resource (CRUD complet)
- ✅ Validation Zod fonctionnelle
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation Data Layer

### 1.5 Rapport avec les objectifs du MVP

**MVP-1 :** Bibliothèque + Recherche + CLI + MCP  
**Contribution Sprint 2 :** Fournit la couche de persistance pour tous les sprints suivants (Knowledge Manager, Search Engine, CLI, MCP)

### 1.6 Dépendances avec les sprints précédents

**Dépend de SPRINT-01 :**
- ✅ Projet TypeScript initialisé
- ✅ Structure dossiers créée
- ✅ Dépendances installées (better-sqlite3, zod)
- ✅ Outils qualité configurés (ESLint, Prettier, Vitest)

### 1.7 Contraintes connues

- **SQLite WAL** : Performant pour lectures, écritures séquentielles
- **FTS5** : Intégré à SQLite, pas de dépendance externe
- **sqlite-vec** : Extension SQLite, doit être chargée
- **better-sqlite3** : Driver synchrone, rapide
- **Zod** : Validation runtime, type-safe

### 1.8 Hypothèses restantes

- SQLite 3.45+ disponible (FTS5, sqlite-vec compatibles)
- Extension sqlite-vec installable (npm ou système)
- Espace disque suffisant pour 3 bases (~10 MB pour MVP)

---

## 2. Périmètre du sprint

### 2.1 Ce qui doit être fait

**Tâches incluses :**
1. Schéma ekts.db (resources, projects, audits)
2. Schéma ekts-fts.db (FTS5 virtual tables)
3. Schéma ekts-vectors.db (sqlite-vec)
4. Repository Resource (CRUD complet)
5. Tests unitaires Repository
6. Validation Zod (Resource schema)
7. Documentation Data Layer

### 2.2 Ce qui doit être documenté

- Schémas SQL (commentaires)
- Repository API (JSDoc)
- Validation Zod (types)
- docs/DATA_LAYER.md (guide complet)

### 2.3 Ce qui doit être testé

- CRUD Resource (create, read, update, delete)
- FTS5 (insertion, recherche)
- sqlite-vec (insertion, recherche)
- Validation Zod (valide, invalide)
- Transactions (rollback)

### 2.4 Ce qui doit être configuré

- SQLite WAL mode
- FTS5 tokenizer
- sqlite-vec extension
- Permissions fichiers (chmod 600)

### 2.5 Ce qui doit être réalisé manuellement

**Aucun** — Tout est automatisable par l'agent.

### 2.6 Ce qui est explicitement exclu

- ❌ Knowledge Manager (Sprint 3)
- ❌ Search Engine (Sprint 4)
- ❌ CLI (Sprint 5)
- ❌ MCP Server (Sprint 6)
- ❌ Migrations (reporté, schéma initial directement)

### 2.7 Ce qui sera traité dans un sprint ultérieur

- Sprint 3 : Knowledge Manager (utilise Repository)
- Sprint 4 : Search Engine (utilise FTS5 + sqlite-vec)

---

## 3. État initial et prérequis

### 3.1 État initial

**Avant ce sprint :**
- ✅ Projet TypeScript initialisé (Sprint 1)
- ✅ Structure dossiers créée (src/data/, src/shared/)
- ✅ better-sqlite3 installé
- ✅ zod installé
- ✅ Vitest configuré

### 3.2 Prérequis obligatoires

| Prérequis | Vérification | Action si manquant | Responsable |
|-----------|--------------|-------------------|-------------|
| **Sprint 1 terminé** | `npm run build` fonctionne | Retourner Sprint 1 | Agent |
| **better-sqlite3 installé** | `npm ls better-sqlite3` | `npm install better-sqlite3` | Agent |
| **zod installé** | `npm ls zod` | `npm install zod` | Agent |
| **SQLite 3.45+** | `sqlite3 --version` | Installer SQLite récent | Agent ou utilisateur |
| **sqlite-vec disponible** | `npm ls sqlite-vec` ou extension système | Installer via npm ou système | Agent ou utilisateur |

### 3.3 Prérequis environnement

**Agent IA :**
- ✅ Peut créer fichiers dans `src/data/`
- ✅ Peut exécuter commandes Node.js
- ✅ Peut créer bases SQLite dans `data/`
- ✅ Peut exécuter tests Vitest

### 3.4 Variables d'environnement nécessaires

**Aucune pour ce sprint** — SQLite est local, pas de secrets.

### 3.5 Configurations préalables attendues

- ✅ TypeScript configuré (tsconfig.json)
- ✅ Vitest configuré (vitest.config.ts)
- ✅ Structure dossiers (src/data/, tests/)

### 3.6 Tests ou livrables des sprints précédents

- ✅ Sprint 1 validé (build, lint, test fonctionnent)

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

**3 sous-sprints** pour une durée totale de 2 semaines :

| Sous-sprint | Durée | Tâches | Objectif |
|-------------|-------|--------|----------|
| **Sprint 2-1** | 4 jours | 2.1, 2.2, 2.3 | Schémas SQLite (3 bases) |
| **Sprint 2-2** | 4 jours | 2.4, 2.5 | Repository Resource + tests |
| **Sprint 2-3** | 2 jours | 2.6, 2.7 | Validation Zod + documentation |

### 4.2 Ordre d'exécution

```
Sprint 2-1 (Jours 1-4)
├── 2.1 Schéma ekts.db
├── 2.2 Schéma ekts-fts.db
└── 2.3 Schéma ekts-vectors.db

↓

Sprint 2-2 (Jours 5-8)
├── 2.4 Repository Resource (CRUD)
└── 2.5 Tests unitaires Repository

↓

Sprint 2-3 (Jours 9-10)
├── 2.6 Validation Zod
└── 2.7 Documentation Data Layer
```

### 4.3 Dépendances entre sous-sprints

- **Sprint 2-1** : Indépendant (crée schémas)
- **Sprint 2-2** : Dépend de Sprint 2-1 (utilise schémas)
- **Sprint 2-3** : Dépend de Sprint 2-2 (valide Repository)

### 4.4 Documents de sous-sprints

- `SPRINT-02-01.md` — Schémas SQLite
- `SPRINT-02-02.md` — Repository Resource
- `SPRINT-02-03.md` — Validation Zod + documentation

---

## 5. Choix techniques à appliquer

### 5.1 SQLite WAL

**Décision de référence :** ADR-001  
**Configuration :**
```sql
PRAGMA journal_mode = WAL;        -- Write-Ahead Logging
PRAGMA synchronous = NORMAL;       -- Équilibre perf/sécurité
PRAGMA foreign_keys = ON;          -- Intégrité référentielle
PRAGMA cache_size = -64000;        -- 64 MB cache
PRAGMA temp_store = MEMORY;        -- Temp en mémoire
```

**Justification :**
- ✅ Performance 80x supérieure aux lectures simples
- ✅ Zéro overhead opérationnel
- ✅ Portabilité maximale

### 5.2 FTS5

**Décision de référence :** Phase 06  
**Configuration :**
```sql
CREATE VIRTUAL TABLE resources_fts USING fts5(
  title, content, tags,
  content='resources',
  content_rowid='rowid',
  tokenize='porter unicode61'
);
```

**Justification :**
- ✅ Intégré SQLite (pas de dépendance)
- ✅ BM25 scoring (pertinent)
- ✅ Compétitif avec PostgreSQL tsvector

### 5.3 sqlite-vec

**Décision de référence :** Phase 06  
**Configuration :**
```sql
-- Extension sqlite-vec
CREATE VIRTUAL TABLE resources_vectors USING vec0(
  resource_id TEXT PRIMARY KEY,
  embedding float[1536]  -- OpenAI text-embedding-3-small
);
```

**Justification :**
- ✅ Extension SQLite (léger)
- ✅ Cosine similarity (standard)
- ✅ Suffisant pour <100K vecteurs

### 5.4 Repository Pattern

**Décision de référence :** Phase 03 (Conception outils)  
**Interface :**
```typescript
interface Repository<T> {
  create(entity: T): Promise<T>;
  getById(id: string): Promise<T | null>;
  list(filters?: Partial<T>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

**Justification :**
- ✅ Séparation préoccupations
- ✅ Testable (mockable)
- ✅ Réutilisable

### 5.5 better-sqlite3

**Décision de référence :** Phase 06  
**Utilisation :**
```typescript
import Database from 'better-sqlite3';

const db = new Database('data/ekts.db');
db.pragma('journal_mode = WAL');
```

**Justification :**
- ✅ Synchrone (rapide, simple)
- ✅ Bien typé (@types/better-sqlite3)
- ✅ Performant

---

## 6. Organisation des fichiers

### 6.1 Fichiers à créer

| Fichier | Rôle | Sprint |
|---------|------|--------|
| `src/data/database.ts` | Connexion SQLite + configuration | 2-1 |
| `src/data/migrations/001_init.ts` | Migration initiale (schémas) | 2-1 |
| `src/data/repositories/resource-repository.ts` | Repository Resource | 2-2 |
| `src/data/schemas/resource-schema.ts` | Schéma SQL resources | 2-1 |
| `src/data/schemas/fts-schema.ts` | Schéma SQL FTS5 | 2-1 |
| `src/data/schemas/vector-schema.ts` | Schéma SQL sqlite-vec | 2-1 |
| `src/shared/types.ts` | Types TypeScript (Resource, etc.) | 2-2 |
| `src/shared/validators.ts` | Schémas Zod | 2-3 |
| `data/.gitkeep` | Dossier données (ignoré) | 2-1 |
| `tests/data/resource-repository.test.ts` | Tests Repository | 2-2 |
| `tests/data/database.test.ts` | Tests connexion | 2-1 |
| `docs/DATA_LAYER.md` | Documentation Data Layer | 2-3 |

### 6.2 Dossiers à créer

| Dossier | Rôle | Sprint |
|---------|------|--------|
| `data/` | Bases SQLite (ignoré Git) | 2-1 |

### 6.3 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/shared/types.ts` | Ajouter interfaces Resource, Audit, Project |
| `.gitignore` | Ajouter `data/` si absent |

---

## 7. Tests et validation

### 7.1 Tests unitaires

**Tests requis :**

**Database (database.test.ts) :**
- Connexion SQLite fonctionne
- WAL mode activé
- Foreign keys activées
- Création bases (3 fichiers)

**Repository (resource-repository.test.ts) :**
- create() : ajoute ressource, retourne avec ID
- getById() : retourne ressource existante, null si inexistante
- list() : retourne toutes ressources, ou filtrées
- update() : modifie ressource, retourne mise à jour
- delete() : supprime ressource
- Transactions : rollback en cas d'erreur

**FTS5 :**
- Insertion ressource → indexée dans FTS
- Recherche full-text retourne résultats
- BM25 scoring fonctionne

**sqlite-vec :**
- Insertion embedding → stocké
- Recherche vectorielle retourne résultats
- Cosine similarity fonctionne

**Zod :**
- Validation ressource valide → succès
- Validation ressource invalide → erreur
- Types inférés correctement

### 7.2 Tests d'intégration

**Aucun pour ce sprint** (pas d'interaction entre composants).

### 7.3 Tests fonctionnels

**Vérifications manuelles :**
- [ ] 3 bases SQLite créées (data/ekts.db, ekts-fts.db, ekts-vectors.db)
- [ ] Permissions fichiers (chmod 600)
- [ ] WAL mode activé (`PRAGMA journal_mode`)
- [ ] FTS5 fonctionne (insertion + recherche)
- [ ] sqlite-vec fonctionne (insertion + recherche)
- [ ] CRUD Resource fonctionne
- [ ] Validation Zod fonctionne

### 7.4 Vérifications de sécurité

- [ ] Fichiers SQLite `chmod 600`
- [ ] `data/` dans `.gitignore`
- [ ] Pas de secrets dans code
- [ ] Foreign keys activées

### 7.5 Vérifications de configuration

- [ ] SQLite WAL mode
- [ ] FTS5 tokenizer (porter unicode61)
- [ ] sqlite-vec extension chargée
- [ ] Foreign keys ON

### 7.6 Preuves à conserver

**Logs :**
```bash
npm test > test.log 2>&1
npm run coverage > coverage.log 2>&1
```

**Captures :**
- Liste bases SQLite (`ls -la data/`)
- Couverture tests (> 80%)
- Schémas SQL (fichiers migration)

### 7.7 Résultats qui constituent un échec

- ❌ Bases SQLite non créées
- ❌ FTS5 ne fonctionne pas
- ❌ sqlite-vec ne fonctionne pas
- ❌ CRUD Repository échoue
- ❌ Tests couverture < 80%
- ❌ Validation Zod échoue

---

## 8. Critères de validation du sprint

### 8.1 Checklist de validation

**Obligatoires (tous requis) :**

- [ ] **C2.1** — 3 bases SQLite créées (ekts.db, ekts-fts.db, ekts-vectors.db)
- [ ] **C2.2** — WAL mode activé sur les 3 bases
- [ ] **C2.3** — FTS5 opérationnel (insertion + recherche)
- [ ] **C2.4** — sqlite-vec opérationnel (insertion + recherche)
- [ ] **C2.5** — Repository Resource CRUD complet (create, read, update, delete)
- [ ] **C2.6** — Validation Zod fonctionnelle (Resource schema)
- [ ] **C2.7** — Tests unitaires > 80% couverture
- [ ] **C2.8** — Documentation DATA_LAYER.md complète
- [ ] **C2.9** — Permissions fichiers (chmod 600)
- [ ] **C2.10** — `data/` dans `.gitignore`

### 8.2 Méthodes de vérification

| Critère | Méthode | Commande |
|---------|---------|----------|
| C2.1 | Inspection | `ls -la data/` |
| C2.2 | SQL | `sqlite3 data/ekts.db "PRAGMA journal_mode;"` |
| C2.3 | Test | `npm test -- tests/data/fts.test.ts` |
| C2.4 | Test | `npm test -- tests/data/vector.test.ts` |
| C2.5 | Test | `npm test -- tests/data/resource-repository.test.ts` |
| C2.6 | Test | `npm test -- tests/shared/validators.test.ts` |
| C2.7 | Exécution | `npm run coverage` |
| C2.8 | Inspection | `cat docs/DATA_LAYER.md` |
| C2.9 | Inspection | `ls -la data/*.db` |
| C2.10 | Inspection | `cat .gitignore` |

### 8.3 Résultats attendus

**Tous les critères obligatoires doivent être satisfaits.**

**Statut final :** `VALIDÉ` si tous critères OK, `BLOQUÉ` sinon

### 8.4 Conditions interdisant passage au sprint suivant

- ❌ Bases SQLite non créées
- ❌ FTS5 ou sqlite-vec non fonctionnel
- ❌ Repository CRUD incomplet
- ❌ Tests couverture < 80%
- ❌ Documentation manquante

---

## 9. Livrables

### 9.1 Artefacts attendus

**Code :**
- ✅ `src/data/database.ts` — Connexion SQLite
- ✅ `src/data/migrations/001_init.ts` — Migration initiale
- ✅ `src/data/repositories/resource-repository.ts` — Repository Resource
- ✅ `src/data/schemas/*.ts` — Schémas SQL
- ✅ `src/shared/types.ts` — Types TypeScript
- ✅ `src/shared/validators.ts` — Schémas Zod

**Tests :**
- ✅ `tests/data/database.test.ts` — Tests connexion
- ✅ `tests/data/resource-repository.test.ts` — Tests Repository
- ✅ `tests/data/fts.test.ts` — Tests FTS5
- ✅ `tests/data/vector.test.ts` — Tests sqlite-vec
- ✅ `tests/shared/validators.test.ts` — Tests Zod

**Documentation :**
- ✅ `docs/DATA_LAYER.md` — Guide Data Layer

**Bases de données :**
- ✅ `data/ekts.db` — Base structurée
- ✅ `data/ekts-fts.db` — Base FTS5
- ✅ `data/ekts-vectors.db` — Base vectorielle

### 9.2 Commits Git

**Commits attendus :**

```
feat(data): add SQLite database connection with WAL mode
feat(data): create initial migration with 3 databases
feat(data): implement FTS5 virtual tables
feat(data): implement sqlite-vec extension
feat(data): implement Resource repository (CRUD)
test(data): add unit tests for repository
feat(shared): add Zod validators for Resource
docs(data): add DATA_LAYER.md documentation
```

### 9.3 Éléments à valider manuellement

- [ ] Permissions fichiers SQLite (chmod 600)
- [ ] WAL mode activé
- [ ] FTS5 fonctionne (test manuel)
- [ ] sqlite-vec fonctionne (test manuel)

---

## 10. Procédure de fin de sprint

### 10.1 Vérification tâches terminées

**Checklist :**
- [ ] Toutes tâches Sprint 2-1 terminées
- [ ] Toutes tâches Sprint 2-2 terminées
- [ ] Toutes tâches Sprint 2-3 terminées
- [ ] Documentation mise à jour
- [ ] Tests exécutés

### 10.2 Exécution des tests

**Commandes :**
```bash
npm test
npm run coverage
npm run lint
npm run build
```

**Résultats attendus :**
- Tests : ✅ Tous passent
- Coverage : ✅ > 80%
- Lint : ✅ 0 erreurs
- Build : ✅ Succès

### 10.3 Production du rapport de validation

**Template :**

```markdown
# Rapport de validation — Sprint 2

**Date :** YYYY-MM-DD
**Statut :** VALIDÉ | BLOQUÉ

## Résultats attendus vs obtenus

| Critère | Attendu | Obtenu | Statut |
|---------|---------|--------|--------|
| C2.1 | 3 bases créées | ✅ OK | ✅ |
| ... | ... | ... | ... |

## Tests exécutés

- [x] npm test — ✅ 25 tests passent
- [x] npm run coverage — ✅ 85% couverture
- [x] npm run lint — ✅ 0 erreurs
- [x] npm run build — ✅ Succès

## Fichiers modifiés

- src/data/database.ts (créé)
- src/data/repositories/resource-repository.ts (créé)
- ...

## Commits

- abc1234 feat(data): add SQLite connection
- def5678 feat(data): implement repository
- ...

## Limites connues

- sqlite-vec limité à ~100K vecteurs
- WAL mode : écritures séquentielles

## Blocages

- Aucun

## Actions requises

- Aucune

## Statut final

**VALIDÉ** — Prêt pour Sprint 3
```

### 10.4 Vérification modifications Git

**Commandes :**
```bash
git status
git log --oneline
git diff --stat
```

**Vérifications :**
- [ ] Tous fichiers commités
- [ ] Pas de fichiers non suivis (sauf data/*.db)
- [ ] Messages commits conventionnels
- [ ] Branche poussée vers GitHub

### 10.5 Présentation des résultats

**Format :**

```markdown
## Sprint 2 terminé ✅

**Branche :** `sprint/02/data-layer`
**Commits :** 8 commits
**Durée :** 2 semaines

### Livrables
- 3 bases SQLite créées (WAL mode)
- FTS5 opérationnel
- sqlite-vec opérationnel
- Repository Resource (CRUD)
- Validation Zod
- Tests > 80% couverture
- Documentation DATA_LAYER.md

### Validation
- [x] 3 bases créées
- [x] WAL mode activé
- [x] FTS5 fonctionne
- [x] sqlite-vec fonctionne
- [x] CRUD complet
- [x] Tests > 80%
- [x] Documentation complète

### Prochaine étape
Sprint 3 — Knowledge Manager
```

### 10.6 Déclaration critère bloqué

**Si un critère échoue :**

1. Documenter l'échec (quoi, pourquoi)
2. Identifier cause racine (SQLite version, extension manquante, etc.)
3. Proposer solution (mise à jour, installation, workaround)
4. Si solution nécessite autorisation → demander à utilisateur
5. Si solution impossible → déclarer sprint `BLOQUÉ`
6. Attendre instructions utilisateur

### 10.7 Enregistrement décision nouvelle

**Si décision nouvelle nécessaire :**

1. Rédiger ADR (format `Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`)
2. Soumettre à utilisateur pour validation
3. Si validé → ajouter au registre
4. Mettre à jour documents liés

**Décisions possibles :**
- Migration vers PostgreSQL si sqlite-vec insuffisant
- Changement driver SQLite si better-sqlite3 problématique

### 10.8 Demande approbation

**Message à utilisateur :**

```markdown
## Sprint 2 terminé — Approbation requise

**Branche :** `sprint/02/data-layer`
**Statut :** À VALIDER

### Livrables
- [Liste livrables]

### Validation
- [x] Tous critères satisfaits
- [x] Tests passent (> 80% couverture)
- [x] CI verte

### Actions requises
- [ ] Revue code
- [ ] Merge dans main
- [ ] Validation Sprint 2

**Autorisation requise pour passer au Sprint 3**
```

### 10.9 Préparation passage sprint suivant

**Avant approbation Sprint 3 :**

1. Vérifier tous critères Sprint 2 satisfaits
2. S'assurer documentation à jour
3. Préparer résumé Sprint 2
4. **NE PAS commencer Sprint 3** avant approbation explicite

---

## 11. Prompt de lancement du sprint

**Texte copiable pour un agent de développement :**

```markdown
# PROMPT DE LANCEMENT — SPRINT 02

## Contexte

Tu vas effectuer le Sprint 2 du projet EKTS : Data Layer (SQLite).

## Documents à lire

**Obligatoires (avant de commencer) :**
1. `Docs/roadmap/sprints/SPRINT-02.md` — Dossier complet
2. `Docs/roadmap/sprints/SPRINT-02-01.md` — Sous-sprint 1
3. `Docs/roadmap/sprints/SPRINT-02-02.md` — Sous-sprint 2
4. `Docs/roadmap/sprints/SPRINT-02-03.md` — Sous-sprint 3
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` §4.3 — Data Layer
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — ADR-001
7. `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` — Architecture SQLite
8. `04-Knowledge/06_MODELE_DONNEES.md` — Modèle de données

## Audit de l'état actuel

**Avant de commencer, vérifie :**
1. Sprint 1 terminé : `npm run build` fonctionne
2. better-sqlite3 installé : `npm ls better-sqlite3`
3. zod installé : `npm ls zod`
4. Structure dossiers : `ls src/data/`
5. SQLite version : `sqlite3 --version` (3.45+ requis)

## Vérification des prérequis

**Prérequis obligatoires :**
- [ ] Sprint 1 terminé
- [ ] better-sqlite3 installé
- [ ] zod installé
- [ ] SQLite 3.45+ disponible
- [ ] sqlite-vec disponible (extension ou npm)

**Si prérequis manquant :**
- Documenter le manque
- Proposer solution (installation)
- Attendre résolution avant de continuer

## Périmètre autorisé

**Tu dois réaliser :**
- 3 bases SQLite (ekts.db, ekts-fts.db, ekts-vectors.db)
- WAL mode activé
- FTS5 pour full-text search
- sqlite-vec pour recherche vectorielle
- Repository Resource (CRUD complet)
- Validation Zod (Resource schema)
- Tests unitaires > 80% couverture
- Documentation DATA_LAYER.md

**Tu ne dois PAS réaliser :**
- Knowledge Manager (Sprint 3)
- Search Engine (Sprint 4)
- CLI (Sprint 5)
- MCP Server (Sprint 6)

## Contraintes et interdictions

**Interdictions absolues :**
- ❌ Créer une pull request
- ❌ Push vers branche main
- ❌ Merge ou rebase
- ❌ Modifier fichiers hors périmètre
- ❌ Passer au Sprint 3 sans autorisation

**Obligations :**
- ✅ Respecter ADR-001 (SQLite WAL + FTS5 + sqlite-vec)
- ✅ 3 bases séparées
- ✅ Repository pattern
- ✅ Validation Zod
- ✅ Tests > 80% couverture
- ✅ Documentation complète

## Tests et critères d'acceptation

**Tests à exécuter :**
```bash
npm test
npm run coverage
npm run lint
npm run build
```

**Critères d'acceptation (tous obligatoires) :**
- C2.1 : 3 bases SQLite créées
- C2.2 : WAL mode activé
- C2.3 : FTS5 opérationnel
- C2.4 : sqlite-vec opérationnel
- C2.5 : Repository CRUD complet
- C2.6 : Validation Zod fonctionnelle
- C2.7 : Tests > 80% couverture
- C2.8 : Documentation DATA_LAYER.md
- C2.9 : Permissions fichiers (chmod 600)
- C2.10 : data/ dans .gitignore

## Procédure de compte rendu

**À la fin du sprint, tu dois :**
1. Exécuter tous tests
2. Vérifier tous critères
3. Créer rapport validation
4. Lister fichiers modifiés
5. Lister commits créés
6. Documenter limites connues
7. Documenter blocages (si any)
8. Lister actions requises utilisateur
9. Déclarer statut final

## Actions nécessitant autorisation

**Tu dois demander autorisation pour :**
- Modifier ADR-001
- Changer driver SQLite
- Modifier schémas de données
- Passer au Sprint 3

## Interdiction de passer au sprint suivant

**Tu ne dois PAS :**
- ❌ Commencer Sprint 3 sans autorisation
- ❌ Implémenter Knowledge Manager
- ❌ Implémenter Search Engine

**Tu dois :**
- ✅ Terminer Sprint 2 complètement
- ✅ Présenter rapport validation
- ✅ Attendre approbation utilisateur

## Démarrage

**Première action :**
1. Lire documents listés
2. Auditer état workspace
3. Vérifier prérequis
4. Commencer Sous-sprint 2-1

**Bonne chance !**
```

---

## 12. Résumé exécutif

### 12.1 Objectif

Implémenter couche données SQLite (3 bases, FTS5, sqlite-vec, Repository, Zod).

### 12.2 Durée

2 semaines (10 jours ouvrables)

### 12.3 Sous-sprints

- **Sprint 2-1** (4 jours) : Schémas SQLite (3 bases)
- **Sprint 2-2** (4 jours) : Repository Resource + tests
- **Sprint 2-3** (2 jours) : Validation Zod + documentation

### 12.4 Livrables principaux

- 3 bases SQLite (WAL mode)
- FTS5 opérationnel
- sqlite-vec opérationnel
- Repository Resource (CRUD)
- Validation Zod
- Tests > 80% couverture
- Documentation DATA_LAYER.md

### 12.5 Critères de validation

10 critères obligatoires (tous requis pour validation)

### 12.6 Prochaine étape

**Sprint 3 — Knowledge Manager** (après approbation Sprint 2)

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ✅ Sprint 2 terminé — en attente de validation utilisateur**

---

## Addendum d'implémentation — 22 octobre 2026

**Sprint 2 terminé.** Les trois sous-sprints (2-1 schémas, 2-2 repository, 2-3 validation et
documentation) sont implémentés, testés et documentés.

| Livrable | État |
|----------|------|
| 3 bases SQLite (WAL, permissions 600) | ✅ |
| Migrations versionnées (`schema_migrations`, `user_version`) | ✅ |
| FTS5 (`resources_fts`) | ✅ autonome, synchronisée par le repository |
| `sqlite-vec` 0.1.9 (`resources_vectors`, `float[1536]`) | ✅ |
| `ResourceRepository` (CRUD + filtres + pagination) | ✅ |
| Validation Zod 4 | ✅ |
| `docs/guides/DATA_LAYER.md` | ✅ |
| Tests | 66 tests, couverture 100 % |

Deux corrections de conception ont été nécessaires (détaillées dans l'addendum de SPRINT-02-01) :
FTS5 **autonome** au lieu d'une table de contenu externe (impossible entre fichiers), et
**une connexion unique** avec bases attachées au lieu d'un trigger multi-base (interdit par SQLite).
