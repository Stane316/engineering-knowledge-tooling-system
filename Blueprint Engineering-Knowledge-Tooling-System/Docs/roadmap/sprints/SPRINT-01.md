# Sprint 1 — Setup projet

**Identifiant :** SPRINT-01  
**Nom :** Initialisation du projet EKTS  
**Position dans la roadmap :** Premier sprint de MVP-1  
**Durée prévue :** 2 semaines (Semaine 1-2)  
**Date de documentation :** 21 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Contexte et objectifs

### 1.1 Contexte indispensable

EKTS (Engineering Knowledge & Tooling System) est un système personnel d'ingénierie augmenté par l'IA. Ce sprint initialise l'environnement de développement pour les 17 sprints suivants.

**Documents de référence obligatoires :**
- `Docs/00-REFERENCE-GLOBALE-PROJET.md` — Vision et architecture
- `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture cible
- `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack technique
- `Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md` — Sécurité
- `Docs/06-GUIDE-GIT-GITHUB.md` — Workflow Git
- `Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` — Décisions ADR

**Décisions à respecter :**
- ADR-001 : SQLite WAL + FTS5 + sqlite-vec
- ADR-010 : Validation Zod
- Architecture C Hybride (monolithe TypeScript/Node.js)

### 1.2 Objectif principal

**Initialiser un projet TypeScript/Node.js avec :**
- Structure de dossiers conforme à l'architecture
- Outils de qualité code (ESLint, Prettier)
- Framework de tests (Vitest)
- Détection de secrets (Gitleaks)
- CI/CD (GitHub Actions)
- Documentation de base (README, SETUP)

### 1.3 Problème traité

**Avant ce sprint :** Aucun code, aucune infrastructure  
**Après ce sprint :** Projet TypeScript fonctionnel, prêt pour développement

### 1.4 Résultat attendu

**Livrables :**
- ✅ Projet Node.js/TypeScript initialisé
- ✅ Structure de dossiers créée
- ✅ Outils qualité configurés (ESLint, Prettier, Vitest)
- ✅ Détection secrets active (Gitleaks)
- ✅ CI GitHub Actions fonctionnelle
- ✅ Documentation setup complète

### 1.5 Rapport avec les objectifs du MVP

**MVP-1 :** Bibliothèque + Recherche + CLI + MCP  
**Contribution Sprint 1 :** Fournit l'environnement de développement pour tous les sprints suivants

### 1.6 Dépendances avec les sprints précédents

**Aucune** — Premier sprint

### 1.7 Contraintes connues

- **Environnement :** Sandbox Arena (pas de Git initialisé)
- **OS :** Linux (compatible Node.js, npm)
- **Accès réseau :** Restreint (npm registry autorisé)
- **Permissions :** Écriture dans workspace uniquement

### 1.8 Hypothèses restantes

- Node.js 20+ disponible dans l'environnement
- npm 10+ disponible
- Git disponible (pour hooks pre-commit)
- GitHub repository créé par l'utilisateur (action manuelle)

---

## 2. Périmètre du sprint

### 2.1 Ce qui doit être fait

**Tâches incluses :**
1. Initialiser projet Node.js + TypeScript
2. Configurer ESLint + Prettier
3. Configurer Vitest (tests)
4. Créer structure dossiers
5. Installer dépendances de base
6. Configurer Gitleaks pre-commit
7. Créer README + documentation setup
8. Configurer CI GitHub Actions

### 2.2 Ce qui doit être documenté

- README.md (installation, usage)
- docs/SETUP.md (guide développeur)
- Structure dossiers expliquée

### 2.3 Ce qui doit être testé

- `npm run build` fonctionne
- `npm run lint` passe
- `npm test` passe
- CI GitHub Actions verte

### 2.4 Ce qui doit être configuré

- ESLint (règles TypeScript)
- Prettier (formatage)
- Vitest (tests unitaires)
- Gitleaks (détection secrets)
- GitHub Actions (CI)

### 2.5 Ce qui doit être réalisé manuellement

- Création repository GitHub (utilisateur)
- Configuration GitHub Secrets (utilisateur, si requis)

### 2.6 Ce qui est explicitement exclu

- ❌ Implémentation fonctionnalités EKTS (Sprint 2+)
- ❌ Configuration base de données (Sprint 2)
- ❌ Implémentation MCP (Sprint 6)
- ❌ Déploiement (Phase 3)

### 2.7 Ce qui sera traité dans un sprint ultérieur

- Sprint 2 : Data Layer (SQLite)
- Sprint 3 : Knowledge Manager
- Sprint 4 : Search Engine
- Sprint 5 : CLI
- Sprint 6 : MCP Server

---

## 3. État initial et prérequis

### 3.1 État initial

**Avant ce sprint :**
- ❌ Aucun fichier EKTS dans le workspace
- ❌ Pas de dépôt Git initialisé
- ❌ Pas de `package.json`
- ❌ Pas de structure dossiers

### 3.2 Prérequis obligatoires

| Prérequis | Vérification | Action si manquant | Responsable |
|-----------|--------------|-------------------|-------------|
| **Node.js 20+** | `node --version` | Installer Node.js 20 LTS | Agent ou utilisateur |
| **npm 10+** | `npm --version` | Installer npm 10+ | Agent ou utilisateur |
| **Git** | `git --version` | Installer Git | Agent ou utilisateur |
| **Workspace writable** | `touch test && rm test` | Vérifier permissions | Agent |
| **Accès npm registry** | `npm ping` | Vérifier réseau | Agent |

### 3.3 Prérequis environnement

**Agent IA (sandbox Arena) :**
- ✅ Peut lire/écrire fichiers dans workspace
- ✅ Peut exécuter commandes shell
- ✅ Peut installer packages npm
- ✅ Peut configurer Git hooks
- ❌ Ne peut pas créer repository GitHub (action utilisateur)

**Utilisateur (VS Code local) :**
- ✅ Peut créer repository GitHub
- ✅ Peut configurer GitHub Secrets
- ✅ Peut merger branches

### 3.4 Variables d'environnement nécessaires

**Aucune pour ce sprint** (pas de secrets, pas d'API externes)

### 3.5 Configurations préalables attendues

**Aucune** — Premier sprint

### 3.6 Tests ou livrables des sprints précédents

**Aucun** — Premier sprint

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

**3 sous-sprints** pour une durée totale de 2 semaines :

| Sous-sprint | Durée | Tâches | Objectif |
|-------------|-------|--------|----------|
| **Sprint 1-1** | 3 jours | 1.1, 1.2, 1.3 | Initialisation TypeScript + outils qualité |
| **Sprint 1-2** | 3 jours | 1.4, 1.5 | Structure dossiers + dépendances |
| **Sprint 1-3** | 4 jours | 1.6, 1.7, 1.8 | Gitleaks + README + CI |

### 4.2 Ordre d'exécution

```
Sprint 1-1 (Jours 1-3)
├── 1.1 Initialiser Node.js + TypeScript
├── 1.2 Configurer ESLint + Prettier
└── 1.3 Configurer Vitest

↓

Sprint 1-2 (Jours 4-6)
├── 1.4 Créer structure dossiers
└── 1.5 Installer dépendances de base

↓

Sprint 1-3 (Jours 7-10)
├── 1.6 Configurer Gitleaks pre-commit
├── 1.7 Créer README + documentation
└── 1.8 Configurer CI GitHub Actions
```

### 4.3 Dépendances entre sous-sprints

- **Sprint 1-1** : Indépendant (peut démarrer immédiatement)
- **Sprint 1-2** : Dépend de Sprint 1-1 (besoin de `package.json`)
- **Sprint 1-3** : Dépend de Sprint 1-2 (besoin de structure dossiers)

### 4.4 Documents de sous-sprints

- `SPRINT-01-01.md` — Initialisation TypeScript + outils qualité
- `SPRINT-01-02.md` — Structure dossiers + dépendances
- `SPRINT-01-03.md` — Gitleaks + README + CI

---

## 5. Choix techniques à appliquer

### 5.1 Node.js et TypeScript

**Décision de référence :** ADR-005 (Architecture C Hybride)  
**Version :** Node.js 20 LTS, TypeScript 5+  
**Configuration :** `tsconfig.json` avec `strict: true`

**Justification :**
- ✅ LTS stable (support long terme)
- ✅ Écosystème mature
- ✅ Compatible MCP SDK

### 5.2 ESLint et Prettier

**Décision de référence :** Phase 03 (Conception outils)  
**Configuration :** ESLint TypeScript + Prettier compatible

**Justification :**
- ✅ Qualité code consistente
- ✅ Formatage automatique
- ✅ Détection erreurs tôt

### 5.3 Vitest

**Décision de référence :** Phase 13 (Critères acceptation)  
**Configuration :** `vitest.config.ts` avec couverture > 80%

**Justification :**
- ✅ Natif TypeScript
- ✅ Rapide (Vite-based)
- ✅ Compatible coverage (c8)

### 5.4 Structure dossiers

**Décision de référence :** `Docs/02-ARCHITECTURE-TECHNIQUE.md` §6.3

```
ekts/
├── src/
│   ├── cli/                # Sprint 5
│   ├── mcp/                # Sprint 6
│   ├── business/           # Sprint 3-4
│   ├── data/               # Sprint 2
│   └── shared/             # Utils, types, config
├── tests/
│   ├── unit/
│   ├── integration/
│   └── benchmark/
├── docs/
├── migrations/
└── .github/workflows/
```

### 5.5 Dépendances de base

**Décision de référence :** `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`

**Production :**
- `better-sqlite3` — Driver SQLite
- `commander` — CLI framework
- `zod` — Validation
- `pino` — Logging

**Développement :**
- `typescript` — Compilateur
- `eslint` — Linting
- `prettier` — Formatage
- `vitest` — Tests
- `c8` — Couverture
- `gitleaks` — Détection secrets

### 5.6 Gitleaks

**Décision de référence :** `Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md` §4.3  
**Configuration :** Pre-commit hook + `.gitleaks.toml`

**Justification :**
- ✅ Détection secrets avant commit
- ✅ 700+ règles
- ✅ Rapide

### 5.7 GitHub Actions

**Décision de référence :** Phase 13 (Roadmap)  
**Configuration :** CI basique (lint + test + build)

**Justification :**
- ✅ Validation automatique
- ✅ Intégration continue
- ✅ Gratuit pour repos publics/privés

---

## 6. Organisation des fichiers

### 6.1 Fichiers à créer

| Fichier | Rôle | Sprint |
|---------|------|--------|
| `package.json` | Configuration npm | 1-1 |
| `tsconfig.json` | Configuration TypeScript | 1-1 |
| `.eslintrc.json` | Configuration ESLint | 1-1 |
| `.prettierrc` | Configuration Prettier | 1-1 |
| `vitest.config.ts` | Configuration Vitest | 1-1 |
| `src/index.ts` | Point d'entrée (vide) | 1-2 |
| `src/shared/types.ts` | Types partagés | 1-2 |
| `.gitleaks.toml` | Configuration Gitleaks | 1-3 |
| `.gitignore` | Fichiers ignorés Git | 1-3 |
| `README.md` | Documentation projet | 1-3 |
| `docs/SETUP.md` | Guide installation | 1-3 |
| `.github/workflows/ci.yml` | CI GitHub Actions | 1-3 |

### 6.2 Dossiers à créer

| Dossier | Rôle | Sprint |
|---------|------|--------|
| `src/` | Code source | 1-2 |
| `src/cli/` | CLI (Sprint 5) | 1-2 |
| `src/mcp/` | MCP Server (Sprint 6) | 1-2 |
| `src/business/` | Business Logic (Sprint 3-4) | 1-2 |
| `src/data/` | Data Layer (Sprint 2) | 1-2 |
| `src/shared/` | Utils, types | 1-2 |
| `tests/` | Tests | 1-2 |
| `tests/unit/` | Tests unitaires | 1-2 |
| `tests/integration/` | Tests intégration | 1-2 |
| `tests/benchmark/` | Benchmarks | 1-2 |
| `docs/` | Documentation | 1-2 |
| `.github/workflows/` | CI/CD | 1-3 |

### 6.3 Fichiers à modifier

**Aucun** — Premier sprint

### 6.4 Fichiers à conserver

**Aucun** — Premier sprint

---

## 7. Tests et validation

### 7.1 Tests unitaires

**Aucun pour ce sprint** (pas de code métier)

### 7.2 Tests d'intégration

**Vérifications automatisées :**

```bash
# Build TypeScript
npm run build

# Linting
npm run lint

# Formatage
npm run format

# Tests (aucun pour ce sprint, mais configuration prête)
npm test

# Couverture (aucun pour ce sprint)
npm run coverage
```

### 7.3 Tests fonctionnels

**Vérifications manuelles :**

- [ ] `npm install` fonctionne sans erreur
- [ ] `npm run build` compile sans erreur
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run format` formate correctement
- [ ] `npm test` exécute Vitest (0 tests)
- [ ] Structure dossiers conforme
- [ ] `.gitignore` exclut fichiers sensibles
- [ ] Gitleaks hook fonctionne (tester avec faux secret)
- [ ] README.md complet
- [ ] docs/SETUP.md détaillé

### 7.4 Vérifications de sécurité

- [ ] `.env` dans `.gitignore`
- [ ] `*.db` dans `.gitignore`
- [ ] `logs/` dans `.gitignore`
- [ ] `node_modules/` dans `.gitignore`
- [ ] Gitleaks pre-commit hook actif
- [ ] Pas de secrets dans code

### 7.5 Vérifications de configuration

- [ ] `tsconfig.json` avec `strict: true`
- [ ] ESLint règles TypeScript actives
- [ ] Prettier compatible ESLint
- [ ] Vitest configuration valide
- [ ] GitHub Actions workflow valide

### 7.6 Preuves à conserver

**Logs de commande :**
```bash
# Capturer sorties
npm install > install.log 2>&1
npm run build > build.log 2>&1
npm run lint > lint.log 2>&1
npm test > test.log 2>&1
```

**Captures écran :**
- Structure dossiers (tree)
- CI GitHub Actions verte

### 7.7 Résultats qui constituent un échec

- ❌ `npm install` échoue
- ❌ `npm run build` échoue
- ❌ `npm run lint` échoue
- ❌ Structure dossiers non conforme
- ❌ Gitleaks hook ne fonctionne pas
- ❌ CI GitHub Actions échoue

---

## 8. Critères de validation du sprint

### 8.1 Checklist de validation

**Obligatoires (tous requis) :**

- [ ] **C1.1** — `npm install` fonctionne sans erreur
- [ ] **C1.2** — `npm run build` compile TypeScript sans erreur
- [ ] **C1.3** — `npm run lint` passe sans erreur
- [ ] **C1.4** — `npm test` exécute Vitest (même 0 tests)
- [ ] **C1.5** — Structure dossiers conforme (src/, tests/, docs/)
- [ ] **C1.6** — `.gitignore` exclut fichiers sensibles (.env, *.db, logs/)
- [ ] **C1.7** — Gitleaks pre-commit hook configuré et fonctionnel
- [ ] **C1.8** — README.md complet (installation, usage, structure)
- [ ] **C1.9** — docs/SETUP.md détaillé (guide développeur)
- [ ] **C1.10** — CI GitHub Actions configurée et verte

### 8.2 Méthodes de vérification

| Critère | Méthode | Commande |
|---------|---------|----------|
| C1.1 | Exécution | `npm install` |
| C1.2 | Exécution | `npm run build` |
| C1.3 | Exécution | `npm run lint` |
| C1.4 | Exécution | `npm test` |
| C1.5 | Inspection | `tree -L 2` |
| C1.6 | Inspection | `cat .gitignore` |
| C1.7 | Test manuel | Commit avec faux secret → doit échouer |
| C1.8 | Inspection | `cat README.md` |
| C1.9 | Inspection | `cat docs/SETUP.md` |
| C1.10 | Inspection | GitHub UI → Actions → CI verte |

### 8.3 Résultats attendus

**Tous les critères obligatoires doivent être satisfaits.**

**Statut final :** `VALIDÉ` si tous critères OK, `BLOQUÉ` sinon

### 8.4 Conditions interdisant passage au sprint suivant

- ❌ Build TypeScript échoue
- ❌ Linting échoue
- ❌ Structure dossiers non conforme
- ❌ Gitleaks non configuré
- ❌ CI GitHub Actions échoue

---

## 9. Livrables

### 9.1 Artefacts attendus

**Code :**
- ✅ `package.json` — Configuration npm
- ✅ `tsconfig.json` — Configuration TypeScript
- ✅ `src/index.ts` — Point d'entrée (vide)
- ✅ `src/shared/types.ts` — Types partagés (vide)

**Configuration :**
- ✅ `.eslintrc.json` — ESLint
- ✅ `.prettierrc` — Prettier
- ✅ `vitest.config.ts` — Vitest
- ✅ `.gitleaks.toml` — Gitleaks
- ✅ `.gitignore` — Git ignore

**Documentation :**
- ✅ `README.md` — Documentation projet
- ✅ `docs/SETUP.md` — Guide installation

**CI/CD :**
- ✅ `.github/workflows/ci.yml` — GitHub Actions

**Structure :**
- ✅ Dossiers src/, tests/, docs/ créés

### 9.2 Commits Git

**Commits attendus :**

```
feat: initialize Node.js + TypeScript project
feat: configure ESLint + Prettier
feat: configure Vitest
feat: create project structure
feat: install base dependencies
feat: configure Gitleaks pre-commit hook
docs: add README and setup guide
ci: configure GitHub Actions
```

### 9.3 Éléments à valider manuellement

- [ ] Création repository GitHub (utilisateur)
- [ ] Push initial vers GitHub
- [ ] Vérification CI GitHub Actions

---

## 10. Procédure de fin de sprint

### 10.1 Vérification tâches terminées

**Checklist :**
- [ ] Toutes tâches Sprint 1-1 terminées
- [ ] Toutes tâches Sprint 1-2 terminées
- [ ] Toutes tâches Sprint 1-3 terminées
- [ ] Documentation mise à jour
- [ ] Tests exécutés

### 10.2 Exécution des tests

**Commandes :**
```bash
npm run build
npm run lint
npm test
npm run coverage
```

**Résultats attendus :**
- Build : ✅ Succès
- Lint : ✅ 0 erreurs
- Tests : ✅ 0 tests (configuration prête)
- Coverage : N/A (pas de tests)

### 10.3 Production du rapport de validation

**Template :**

```markdown
# Rapport de validation — Sprint 1

**Date :** YYYY-MM-DD
**Statut :** VALIDÉ | BLOQUÉ

## Résultats attendus vs obtenus

| Critère | Attendu | Obtenu | Statut |
|---------|---------|--------|--------|
| C1.1 | npm install OK | ✅ OK | ✅ |
| ... | ... | ... | ... |

## Tests exécutés

- [x] npm run build — ✅ Succès
- [x] npm run lint — ✅ 0 erreurs
- [x] npm test — ✅ 0 tests
- [ ] npm run coverage — ⏭️ Non applicable

## Fichiers modifiés

- package.json (créé)
- tsconfig.json (créé)
- ...

## Commits

- abc1234 feat: initialize project
- def5678 feat: configure ESLint
- ...

## Limites connues

- Aucune

## Blocages

- Aucun

## Actions requises

- Aucune

## Statut final

**VALIDÉ** — Prêt pour Sprint 2
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
- [ ] Pas de fichiers non suivis (sauf .env, logs/)
- [ ] Messages commits conventionnels
- [ ] Branche poussée vers GitHub

### 10.5 Présentation des résultats

**Format :**

```markdown
## Sprint 1 terminé ✅

**Branche :** `sprint/01/setup-project`
**Commits :** 8 commits
**Durée :** 2 semaines

### Livrables
- Projet TypeScript initialisé
- Structure dossiers créée
- Outils qualité configurés
- CI GitHub Actions fonctionnelle

### Validation
- [x] npm install OK
- [x] npm run build OK
- [x] npm run lint OK
- [x] npm test OK
- [x] Structure conforme
- [x] Gitleaks configuré
- [x] README complet
- [x] CI verte

### Prochaine étape
Sprint 2 — Data Layer (SQLite)
```

### 10.6 Déclaration critère bloqué

**Si un critère échoue :**

1. Documenter l'échec (quoi, pourquoi)
2. Identifier cause racine
3. Proposer solution
4. Si solution nécessite autorisation → demander à utilisateur
5. Si solution impossible → déclarer sprint `BLOQUÉ`
6. Attendre instructions utilisateur

### 10.7 Enregistrement décision nouvelle

**Si décision nouvelle nécessaire :**

1. Rédiger ADR (format `Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`)
2. Soumettre à utilisateur pour validation
3. Si validé → ajouter au registre
4. Mettre à jour documents liés

### 10.8 Demande approbation

**Message à utilisateur :**

```markdown
## Sprint 1 terminé — Approbation requise

**Branche :** `sprint/01/setup-project`
**Statut :** À VALIDER

### Livrables
- [Liste livrables]

### Validation
- [x] Tous critères satisfaits
- [x] Tests passent
- [x] CI verte

### Actions requises
- [ ] Revue code
- [ ] Merge dans main
- [ ] Validation Sprint 1

**Autorisation requise pour passer au Sprint 2**
```

### 10.9 Préparation passage sprint suivant

**Avant approbation Sprint 2 :**

1. Vérifier tous critères Sprint 1 satisfaits
2. S'assurer documentation à jour
3. Préparer résumé Sprint 1
4. **NE PAS commencer Sprint 2** avant approbation explicite

---

## 11. Prompt de lancement du sprint

**Texte copiable pour un agent de développement :**

```markdown
# PROMPT DE LANCEMENT — SPRINT 01

## Contexte

Tu vas effectuer le Sprint 1 du projet EKTS (Engineering Knowledge & Tooling System).

## Documents à lire

**Obligatoires (avant de commencer) :**
1. `Docs/roadmap/sprints/SPRINT-01.md` — Dossier complet du sprint
2. `Docs/roadmap/sprints/SPRINT-01-01.md` — Sous-sprint 1
3. `Docs/roadmap/sprints/SPRINT-01-02.md` — Sous-sprint 2
4. `Docs/roadmap/sprints/SPRINT-01-03.md` — Sous-sprint 3
5. `Docs/00-REFERENCE-GLOBALE-PROJET.md` — Vision projet
6. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture
7. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack technique
8. `Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md` — Sécurité
9. `Docs/06-GUIDE-GIT-GITHUB.md` — Workflow Git

## Audit de l'état actuel

**Avant de commencer, vérifie :**
1. État du workspace : `ls -la`
2. Node.js disponible : `node --version`
3. npm disponible : `npm --version`
4. Git disponible : `git --version`
5. Permissions écriture : `touch test && rm test`

## Vérification des prérequis

**Prérequis obligatoires :**
- [ ] Node.js 20+
- [ ] npm 10+
- [ ] Git
- [ ] Workspace writable
- [ ] Accès npm registry

**Si prérequis manquant :**
- Documenter le manque
- Proposer solution (installation ou action utilisateur)
- Attendre résolution avant de continuer

## Périmètre autorisé

**Tu dois réaliser :**
- Initialisation projet Node.js + TypeScript
- Configuration ESLint + Prettier
- Configuration Vitest
- Création structure dossiers
- Installation dépendances de base
- Configuration Gitleaks pre-commit
- Création README + documentation
- Configuration CI GitHub Actions

**Tu ne dois PAS réaliser :**
- Implémentation fonctionnalités EKTS (Sprint 2+)
- Configuration base de données (Sprint 2)
- Implémentation MCP (Sprint 6)

## Contraintes et interdictions

**Interdictions absolues :**
- ❌ Créer une pull request
- ❌ Push vers branche main
- ❌ Merge ou rebase
- ❌ Modifier fichiers hors périmètre
- ❌ Passer au Sprint 2 sans autorisation

**Obligations :**
- ✅ Respecter structure dossiers définie
- ✅ Utiliser versions spécifiées (Node.js 20+, TypeScript 5+)
- ✅ Configurer outils qualité (ESLint, Prettier, Vitest)
- ✅ Configurer détection secrets (Gitleaks)
- ✅ Documenter (README, SETUP)
- ✅ Créer commits atomiques avec messages conventionnels

## Tests et critères d'acceptation

**Tests à exécuter :**
```bash
npm install
npm run build
npm run lint
npm test
```

**Critères d'acceptation (tous obligatoires) :**
- C1.1 : npm install fonctionne
- C1.2 : npm run build compile sans erreur
- C1.3 : npm run lint passe sans erreur
- C1.4 : npm test exécute Vitest
- C1.5 : Structure dossiers conforme
- C1.6 : .gitignore exclut fichiers sensibles
- C1.7 : Gitleaks pre-commit hook configuré
- C1.8 : README.md complet
- C1.9 : docs/SETUP.md détaillé
- C1.10 : CI GitHub Actions configurée

## Procédure de compte rendu

**À la fin du sprint, tu dois :**
1. Exécuter tous tests
2. Vérifier tous critères
3. Créer rapport validation (template Sprint 1 §10.3)
4. Lister fichiers modifiés
5. Lister commits créés
6. Documenter limites connues
7. Documenter blocages (si any)
8. Lister actions requises utilisateur
9. Déclarer statut final (VALIDÉ ou BLOQUÉ)

## Actions nécessitant autorisation

**Tu dois demander autorisation pour :**
- Modifier une décision ADR
- Changer stack technique
- Ajouter dépendance non listée
- Modifier structure dossiers
- Passer au Sprint 2

## Interdiction de passer au sprint suivant

**Tu ne dois PAS :**
- ❌ Commencer Sprint 2 sans autorisation explicite
- ❌ Implémenter fonctionnalités Sprint 2+
- ❌ Configurer base de données

**Tu dois :**
- ✅ Terminer Sprint 1 complètement
- ✅ Présenter rapport validation
- ✅ Attendre approbation utilisateur
- ✅ Recevoir instruction explicite pour Sprint 2

## Démarrage

**Première action :**
1. Lire documents listés ci-dessus
2. Auditer état workspace
3. Vérifier prérequis
4. Commencer Sous-sprint 1-1

**Bonne chance !**
```

---

## 12. Résumé exécutif

### 12.1 Objectif

Initialiser projet TypeScript/Node.js avec outils qualité, détection secrets, et CI.

### 12.2 Durée

2 semaines (10 jours ouvrables)

### 12.3 Sous-sprints

- **Sprint 1-1** (3 jours) : Initialisation TypeScript + outils qualité
- **Sprint 1-2** (3 jours) : Structure dossiers + dépendances
- **Sprint 1-3** (4 jours) : Gitleaks + README + CI

### 12.4 Livrables principaux

- Projet Node.js/TypeScript initialisé
- Structure dossiers conforme
- Outils qualité configurés (ESLint, Prettier, Vitest)
- Gitleaks pre-commit hook
- README + documentation setup
- CI GitHub Actions

### 12.5 Critères de validation

10 critères obligatoires (tous requis pour validation)

### 12.6 Prochaine étape

**Sprint 2 — Data Layer (SQLite)** (après approbation Sprint 1)

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Dossier Sprint 1 prêt pour approbation**
