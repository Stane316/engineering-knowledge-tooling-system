# Sprint 7 — Playwright Setup (Semaine 13-14)

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 2 semaines (10 jours ouvrables)  
**Objectif :** Intégrer Playwright et Playwright MCP pour l'inspection navigateur  
**MVP :** MVP-2 (Inspection Navigateur)

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

Le **MVP-1 (Sprints 1-6)** a livré le Knowledge Management Tool :
- ✅ Data Layer (3 bases SQLite)
- ✅ Knowledge Manager (CRUD + indexation FTS + Vector)
- ✅ Search Engine (recherche hybride FTS + Vector + RRF)
- ✅ CLI (7 commandes)
- ✅ MCP Server (4 outils, compatible Claude Code, Cursor)

Le **MVP-2 (Sprints 7-12)** va ajouter l'**inspection navigateur** :
- 🎯 Inspection automatisée de sites web
- 🎯 Analyse 5 dimensions (performance, accessibilité, SEO, UX, contenu)
- 🎯 Calcul matrice sévérité
- 🎯 Stockage audits + indexation RAG
- 🎯 Rapport d'inspection

Le **Sprint 7 (Playwright Setup)** est le premier sprint du MVP-2. Il pose les fondations :
- 🎯 Intégrer Playwright (browser automation)
- 🎯 Configurer Playwright MCP (Model Context Protocol)
- 🎯 Implémenter la navigation basique (goto, screenshot, trace)
- 🎯 Extraire l'accessibility tree
- 🎯 Préparer le terrain pour les Sprints 8-12

### 1.2 Objectifs du Sprint 7

**Objectif principal :** Avoir un environnement Playwright fonctionnel avec navigation basique et extraction accessibility tree.

**Objectifs secondaires :**
- 🎯 Playwright installé avec tous les browsers (Chromium, Firefox, WebKit)
- 🎯 Playwright MCP configuré et fonctionnel
- 🎯 Navigation basique (goto, screenshot, trace, PDF)
- 🎯 Extraction accessibility tree (DOM + ARIA)
- 🎯 Tests d'intégration Playwright
- 🎯 Documentation Playwright complète

### 1.3 Pourquoi ce sprint est critique

Playwright est le **moteur d'inspection** du MVP-2. C'est lui qui :
- 🎯 Permet la navigation automatisée dans les sites web
- 🎯 Capture les screenshots, traces, PDFs
- 🎯 Extrait l'accessibility tree (nécessaire pour l'analyse accessibilité)
- 🎯 Fournit les données brutes pour l'analyse 5 dimensions (Sprint 9)

**Si Playwright échoue, tout le MVP-2 échoue.**

---

## 2. Périmètre du sprint

### 2.1 Ce qui est inclus

| # | Composant | Description | Fichier |
|---|-----------|-------------|---------|
| 1 | Installation Playwright | Playwright + browsers (Chromium, Firefox, WebKit) | `package.json` |
| 2 | Configuration Playwright | Config fichier (browsers, timeouts, etc.) | `playwright.config.ts` |
| 3 | Playwright MCP | Intégration MCP (Model Context Protocol) | `src/browser/playwright-mcp.ts` |
| 4 | Navigation basique | goto, screenshot, trace, PDF | `src/browser/navigator.ts` |
| 5 | Accessibility tree | Extraction DOM + ARIA | `src/browser/accessibility.ts` |
| 6 | Tests Playwright | Tests d'intégration | `tests/browser/` |
| 7 | Documentation | Documentation Playwright | `docs/PLAYWRIGHT.md` |

### 2.2 Ce qui est exclu

| Exclu | Raison | Reporté à |
|-------|--------|-----------|
| ❌ Inspection L1-L3 | 4 niveaux d'inspection | Sprint 8 |
| ❌ Analyse 5 dimensions | Performance, a11y, SEO, UX, contenu | Sprint 9 |
| ❌ Stockage audits | Base de données audits | Sprint 10 |
| ❌ Rapport inspection | Génération rapport | Sprint 11 |
| ❌ Lighthouse integration | Analyse performance | Sprint 8-9 |
| ❌ axe-core integration | Analyse accessibilité | Sprint 8-9 |

### 2.3 Dépendances

**Ce que le Sprint 7 utilise depuis les Sprints précédents :**
- ✅ Infrastructure TypeScript (Sprint 1)
- ✅ Configuration ESLint, Prettier, Vitest (Sprint 1)
- ✅ MCP Server (Sprint 6) — pour Playwright MCP

**Ce que le Sprint 7 prépare pour les Sprints suivants :**
- 🎯 Playwright fonctionnel (pour Sprint 8 : Inspection L1-L3)
- 🎯 Accessibility tree (pour Sprint 9 : Analyse accessibilité)
- 🎯 Screenshots, traces (pour Sprint 11 : Rapport inspection)

---

## 3. État initial et prérequis

### 3.1 État initial (fin Sprint 6)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   └── (vide — à créer Sprint 7)
│   ├── business/
│   │   ├── knowledge-manager.ts        ✅ (Sprint 3)
│   │   ├── search-engine.ts            ✅ (Sprint 4)
│   │   └── ...
│   ├── cli/
│   │   ├── index.ts                    ✅ (Sprint 5)
│   │   └── commands/                   ✅ (7 commandes)
│   ├── data/
│   │   ├── database.ts                 ✅ (Sprint 2)
│   │   └── ...
│   ├── mcp/
│   │   ├── server.ts                   ✅ (Sprint 6)
│   │   └── tools/                      ✅ (4 outils MCP)
│   └── ...
├── tests/
│   ├── browser/
│   │   └── (vide — à créer Sprint 7)
│   ├── business/                       ✅ (Sprints 3-4)
│   ├── cli/                            ✅ (Sprint 5)
│   └── mcp/                            ✅ (Sprint 6)
├── docs/
│   ├── DATA_LAYER.md                   ✅ (Sprint 2)
│   ├── KNOWLEDGE_MANAGER.md            ✅ (Sprint 3)
│   ├── SEARCH_ENGINE.md                ✅ (Sprint 4)
│   ├── CLI.md                          ✅ (Sprint 5)
│   └── MCP.md                          ✅ (Sprint 6)
└── package.json                        ✅ (dépendances MVP-1)
```

### 3.2 Prérequis obligatoires

**Avant de commencer Sprint 7, vérifier :**

```bash
# 1. Sprint 6 terminé avec succès
ls -la src/mcp/server.ts
ls -la src/mcp/tools/
# ✅ MCP Server fonctionnel

# 2. Tests MVP-1
npm test
# ✅ Tous les tests passent

# 3. Node.js version
node --version
# ✅ v18.x ou supérieur

# 4. Espace disque
df -h
# ✅ Au moins 2 GB libre (pour les browsers Playwright)

# 5. Compilation TypeScript
npm run build
# ✅ Aucune erreur
```

### 3.3 Prérequis compétences

**L'agent de développement doit maîtriser :**
- ✅ TypeScript intermédiaire
- 🟡 Playwright (bases) — peut apprendre
- 🟡 Browser automation (bases) — peut apprendre
- 🟡 Accessibility tree (DOM, ARIA) — peut apprendre
- 🟡 MCP (Model Context Protocol) — déjà vu au Sprint 6

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif | Tâches |
|-------------|-------|----------|--------|
| **Sprint 7-1** | 3 jours | Installation Playwright + configuration | 7.1, 7.2 |
| **Sprint 7-2** | 4 jours | Playwright MCP + navigation basique | 7.3, 7.4 |
| **Sprint 7-3** | 3 jours | Accessibility tree + tests + documentation | 7.5, 7.6 |

### 4.2 Sprint 7-1 — Installation Playwright + configuration

**Durée :** 3 jours  
**Objectif :** Installer Playwright et configurer l'environnement

**Tâches :**
- ✅ 7.1 Installer Playwright + browsers (Chromium, Firefox, WebKit) — 8h
- ✅ 7.2 Configuration Playwright (playwright.config.ts) — 4h

**Détail :** Voir document `SPRINT-07-01.md`

**Critères de validation :**
- ✅ Playwright installé
- ✅ 3 browsers disponibles (Chromium, Firefox, WebKit)
- ✅ Configuration fonctionnelle
- ✅ Test basique (lancer un browser, naviguer vers une URL)

### 4.3 Sprint 7-2 — Playwright MCP + navigation basique

**Durée :** 4 jours  
**Objectif :** Intégrer Playwright MCP et implémenter la navigation basique

**Tâches :**
- ✅ 7.3 Playwright MCP setup (intégration MCP) — 8h
- ✅ 7.4 Navigation basique (goto, screenshot, trace, PDF) — 8h

**Détail :** Voir document `SPRINT-07-02.md`

**Critères de validation :**
- ✅ Playwright MCP fonctionne (via MCP Server)
- ✅ Navigation basique fonctionnelle
- ✅ Screenshots capturés
- ✅ Traces enregistrées
- ✅ PDFs générés

### 4.4 Sprint 7-3 — Accessibility tree + tests + documentation

**Durée :** 3 jours  
**Objectif :** Extraire l'accessibility tree, tester et documenter

**Tâches :**
- ✅ 7.5 Accessibility tree extraction (DOM + ARIA) — 8h
- ✅ 7.6 Tests Playwright (integration) — 4h
- ✅ 7.7 Documentation Playwright — 4h

**Détail :** Voir document `SPRINT-07-03.md`

**Critères de validation :**
- ✅ Accessibility tree extrait (structure DOM + ARIA)
- ✅ Tests d'intégration passent
- ✅ Documentation complète

---

## 5. Choix techniques et références

### 5.1 Playwright

**Décision :** Utiliser Playwright pour l'automatisation navigateur.

**Référence :** Architecture technique §4.2.3

**Pourquoi Playwright ?**
- ✅ Support multi-browsers (Chromium, Firefox, WebKit)
- ✅ API TypeScript native
- ✅ Performance supérieure à Puppeteer
- ✅ Support accessibility tree natif
- ✅ Traces, screenshots, PDFs intégrés
- ✅ Maintenu par Microsoft (stable, bien documenté)
- ✅ Licence Apache 2.0 (open source)

**Alternatives considérées :**
- ❌ Puppeteer : Chromium uniquement, pas d'accessibility tree natif
- ❌ Selenium : plus lent, API moins moderne
- ✅ Playwright : multi-browsers, API moderne, accessibility tree

**Version :** Playwright v1.40+ (octobre 2026)

### 5.2 Playwright MCP

**Décision :** Utiliser Playwright MCP pour intégrer Playwright au MCP Server.

**Référence :** MCP 2026-07-28 (Linux Foundation)

**Pourquoi Playwright MCP ?**
- ✅ Intégration native avec MCP (Model Context Protocol)
- ✅ Permet aux agents IA de contrôler le navigateur
- ✅ Compatible Claude Code, Cursor, GitHub Copilot
- ✅ Standard ouvert (Linux Foundation)

**Fonctionnalités Playwright MCP :**
- Navigation (goto, back, forward)
- Screenshots
- Traces
- PDFs
- Extraction accessibility tree
- Exécution JavaScript

### 5.3 Accessibility Tree

**Décision :** Extraire l'accessibility tree via Playwright.

**Référence :** WCAG 2.2, ARIA 1.2

**Qu'est-ce que l'accessibility tree ?**
- Représentation sémantique de la page web
- Utilisée par les technologies d'assistance (lecteurs d'écran)
- Contient les rôles ARIA, noms, descriptions, états
- Nécessaire pour l'analyse accessibilité (Sprint 9)

**Comment l'extraire avec Playwright ?**
```typescript
const accessibilityTree = await page.accessibility.snapshot();
```

**Structure de l'accessibility tree :**
```json
{
  "role": "WebArea",
  "name": "Page Title",
  "children": [
    {
      "role": "heading",
      "name": "Main Title",
      "level": 1
    },
    {
      "role": "link",
      "name": "Click here",
      "url": "https://example.com"
    }
  ]
}
```

### 5.4 Browsers

**Décision :** Installer les 3 browsers (Chromium, Firefox, WebKit).

**Pourquoi les 3 ?**
- ✅ Couverture maximale (99% des utilisateurs)
- ✅ Tests cross-browser
- ✅ Détection problèmes spécifiques à un browser

**Espace disque requis :**
- Chromium : ~280 MB
- Firefox : ~260 MB
- WebKit : ~220 MB
- **Total : ~760 MB**

### 5.5 Configuration

**Décision :** Créer un fichier `playwright.config.ts` centralisé.

**Paramètres de configuration :**
- `browsers` : Chromium, Firefox, WebKit
- `timeout` : 30 secondes (navigation)
- `screenshot` : ON (pour chaque inspection)
- `trace` : ON (pour debugging)
- `video` : OFF (trop volumineux pour MVP-2)
- `headless` : true (mode headless par défaut)

### 5.6 Tests

**Décision :** Utiliser Vitest + Playwright Test pour les tests d'intégration.

**Stratégie de test :**
- ✅ Tests unitaires (mock Playwright)
- ✅ Tests d'intégration (vrai browser)
- ✅ Tests cross-browser (Chromium, Firefox, WebKit)
- ✅ Tests sur sites réels (example.com, wikipedia.org)

**Sites de test :**
- `https://example.com` — Simple, stable
- `https://wikipedia.org` — Complexe, multilingue
- `https://github.com` — Dynamique, JavaScript

### 5.7 Performance

**Décision :** Optimiser pour la performance (latence < 5s pour navigation).

**Cibles performance :**
- Navigation (goto) : < 3s
- Screenshot : < 1s
- Trace : < 2s
- Accessibility tree : < 1s
- PDF : < 3s

**Optimisations :**
- Mode headless (plus rapide)
- Désactiver images (optionnel)
- Cache browser (réutiliser les instances)

---

## 6. Organisation des fichiers

### 6.1 Structure après Sprint 7

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── playwright-mcp.ts           🆕 (Sprint 7 — Playwright MCP)
│   │   ├── navigator.ts                🆕 (Sprint 7 — navigation basique)
│   │   ├── accessibility.ts            🆕 (Sprint 7 — accessibility tree)
│   │   └── types.ts                    🆕 (Sprint 7 — types)
│   ├── business/                       ✅ (Sprints 3-4)
│   ├── cli/                            ✅ (Sprint 5)
│   ├── data/                           ✅ (Sprint 2)
│   ├── mcp/                            ✅ (Sprint 6)
│   └── ...
├── tests/
│   ├── browser/
│   │   ├── playwright-mcp.test.ts      🆕 (Sprint 7)
│   │   ├── navigator.test.ts           🆕 (Sprint 7)
│   │   └── accessibility.test.ts       🆕 (Sprint 7)
│   ├── business/                       ✅ (Sprints 3-4)
│   ├── cli/                            ✅ (Sprint 5)
│   └── mcp/                            ✅ (Sprint 6)
├── docs/
│   ├── PLAYWRIGHT.md                   🆕 (Sprint 7 — documentation)
│   ├── DATA_LAYER.md                   ✅ (Sprint 2)
│   ├── KNOWLEDGE_MANAGER.md            ✅ (Sprint 3)
│   ├── SEARCH_ENGINE.md                ✅ (Sprint 4)
│   ├── CLI.md                          ✅ (Sprint 5)
│   └── MCP.md                          ✅ (Sprint 6)
├── playwright.config.ts                🆕 (Sprint 7 — configuration)
└── package.json                        ✅ (ajouter playwright)
```

### 6.2 Fichiers à créer

| Fichier | Lignes estimées | Description |
|---------|-----------------|-------------|
| `src/browser/playwright-mcp.ts` | ~150 | Playwright MCP (intégration MCP) |
| `src/browser/navigator.ts` | ~200 | Navigation basique (goto, screenshot, trace, PDF) |
| `src/browser/accessibility.ts` | ~120 | Extraction accessibility tree |
| `src/browser/types.ts` | ~80 | Types TypeScript |
| `tests/browser/playwright-mcp.test.ts` | ~150 | Tests Playwright MCP |
| `tests/browser/navigator.test.ts` | ~200 | Tests navigation |
| `tests/browser/accessibility.test.ts` | ~150 | Tests accessibility tree |
| `docs/PLAYWRIGHT.md` | ~300 | Documentation Playwright |
| `playwright.config.ts` | ~50 | Configuration Playwright |

**Total :** ~1 400 lignes de code + documentation

---

## 7. Tests et validation

### 7.1 Stratégie de test

**Niveaux de test :**
- ✅ Tests unitaires (mock Playwright)
- ✅ Tests d'intégration (vrai browser)
- ✅ Tests cross-browser (Chromium, Firefox, WebKit)

**Outils :**
- Vitest (test runner)
- Playwright Test (tests browser)
- Mocks Vitest (vi.fn(), vi.mock())

### 7.2 Couverture cible

**Objectif :** > 80% couverture sur `src/browser/`

**Mesure :**
```bash
npm run test:coverage -- tests/browser/
# ✅ Statements > 80%
# ✅ Branches > 80%
# ✅ Functions > 80%
# ✅ Lines > 80%
```

### 7.3 Scénarios à tester

**Tests unitaires Playwright MCP :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Initialisation Playwright MCP | `initialize` | Playwright MCP démarré |
| Navigation vers URL | `goto` | Page chargée |
| Capture screenshot | `screenshot` | Image PNG créée |
| Extraction accessibility tree | `accessibility.snapshot` | Arbre JSON retourné |

**Tests d'intégration navigation :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Navigation example.com | `goto("https://example.com")` | Page chargée < 3s |
| Screenshot example.com | `screenshot()` | PNG créé |
| Trace example.com | `trace.start()` + `trace.stop()` | Trace ZIP créée |
| PDF example.com | `pdf()` | PDF créé |

**Tests cross-browser :**

| Browser | Scénario | Résultat attendu |
|---------|----------|------------------|
| Chromium | Navigation example.com | ✅ OK |
| Firefox | Navigation example.com | ✅ OK |
| WebKit | Navigation example.com | ✅ OK |

### 7.4 Critères de validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

---

## 8. Critères d'acceptation du sprint

### 8.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C7.1 | Playwright installé avec 3 browsers | Test basique passe |
| C7.2 | Configuration Playwright fonctionnelle | `playwright.config.ts` valide |
| C7.3 | Playwright MCP fonctionne | Test intégration passe |
| C7.4 | Navigation basique (goto) fonctionne | Test exemple.com passe |
| C7.5 | Screenshots capturés | PNG créé |
| C7.6 | Traces enregistrées | ZIP créé |
| C7.7 | PDFs générés | PDF créé |
| C7.8 | Accessibility tree extrait | Arbre JSON retourné |

### 8.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C7.9 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C7.10 | Tests d'intégration passent | `npm test tests/browser/` |
| C7.11 | Compilation TypeScript OK | `npm run build` |
| C7.12 | Linting OK | `npm run lint` |
| C7.13 | Documentation Playwright complète | `docs/PLAYWRIGHT.md` existe |

### 8.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C7.14 | Performance navigation < 3s | Test performance passe |
| C7.15 | Performance screenshot < 1s | Test performance passe |
| C7.16 | Code lisible (JSDoc, commentaires) | Revue code |
| C7.17 | Gestion erreurs robuste | Tests erreurs passent |

---

## 9. Livrables attendus

### 9.1 Code

| Fichier | Description | Validation |
|---------|-------------|------------|
| `src/browser/playwright-mcp.ts` | Playwright MCP (intégration MCP) | Test unitaire passe |
| `src/browser/navigator.ts` | Navigation basique (goto, screenshot, trace, PDF) | Test unitaire passe |
| `src/browser/accessibility.ts` | Extraction accessibility tree | Test unitaire passe |
| `src/browser/types.ts` | Types TypeScript | Compilation OK |
| `playwright.config.ts` | Configuration Playwright | Configuration valide |

### 9.2 Tests

| Fichier | Description | Validation |
|---------|-------------|------------|
| `tests/browser/playwright-mcp.test.ts` | Tests Playwright MCP | > 80% couverture |
| `tests/browser/navigator.test.ts` | Tests navigation | > 80% couverture |
| `tests/browser/accessibility.test.ts` | Tests accessibility tree | > 80% couverture |

### 9.3 Documentation

| Fichier | Description | Validation |
|---------|-------------|------------|
| `docs/PLAYWRIGHT.md` | Documentation Playwright | Complète + exemples |

### 9.4 Configuration

| Fichier | Description | Validation |
|---------|-------------|------------|
| `package.json` | Ajouter `@playwright/test` | Installation OK |
| `playwright.config.ts` | Configuration Playwright | Configuration valide |

### 9.5 Commits Git

```bash
# Sprint 7-1
git commit -m "chore: install Playwright and browsers"
git commit -m "feat(browser): add Playwright configuration"
git push origin feat/sprint-7-1

# Sprint 7-2
git commit -m "feat(browser): implement Playwright MCP integration"
git commit -m "feat(browser): implement basic navigation (goto, screenshot, trace, PDF)"
git push origin feat/sprint-7-2

# Sprint 7-3
git commit -m "feat(browser): implement accessibility tree extraction"
git commit -m "test(browser): add integration tests for Playwright"
git commit -m "docs: add Playwright documentation"
git push origin feat/sprint-7-3
```

---

## 10. Procédure de fin de sprint

### 10.1 Vérifications finales

**Avant de clôturer le Sprint 7 :**

```bash
# 1. Tests unitaires
npm test tests/browser/
# ✅ Tous les tests passent

# 2. Couverture
npm run test:coverage -- tests/browser/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur TypeScript

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/browser/
# ✅ playwright-mcp.ts, navigator.ts, accessibility.ts, types.ts

ls -la tests/browser/
# ✅ playwright-mcp.test.ts, navigator.test.ts, accessibility.test.ts

ls -la docs/PLAYWRIGHT.md
# ✅ Documentation existe

ls -la playwright.config.ts
# ✅ Configuration existe

# 6. Test manuel Playwright
npx playwright test
# ✅ Tests Playwright passent

# 7. Test manuel navigation
node dist/browser/navigator.js
# ✅ Navigation basique fonctionne

# 8. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques (1 tâche = 1 commit)
```

### 10.2 Point de contrôle

**Vérifier les 17 critères :**
- ✅ C7.1 à C7.8 (critères fonctionnels)
- ✅ C7.9 à C7.13 (critères techniques)
- ✅ C7.14 à C7.17 (critères qualité)

**Si tous les critères sont validés :**
```bash
# Merge dans main
git checkout main
git merge feat/sprint-7-3
git push origin main
```

**Si des critères ne sont pas validés :**
- Identifier les problèmes
- Corriger dans une nouvelle branche `fix/sprint-7-xxx`
- Re-tester

### 10.3 Transition vers Sprint 8

**Une fois Sprint 7 terminé avec succès :**
- ✅ Playwright fonctionnel (3 browsers)
- ✅ Playwright MCP configuré
- ✅ Navigation basique opérationnelle
- ✅ Accessibility tree extractible
- ✅ Tests d'intégration passent
- ✅ Documentation complète

**Préparer Sprint 8 (4 Niveaux d'Inspection) :**
- 🎯 Lire `SPRINT-08.md` (quand disponible)
- 🎯 Vérifier prérequis Sprint 8
- 🎯 Créer branche `feat/sprint-8-1`

---

## 11. Prompt de lancement pour agent

**Copier ce prompt pour lancer un agent de développement :**

````markdown
## Mission

Implémenter le Sprint 7 — Playwright Setup (Semaine 13-14) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-07.md` — Dossier complet Sprint 7
2. `Docs/roadmap/sprints/SPRINT-07-01.md` — Sprint 7-1 (Installation + configuration)
3. `Docs/roadmap/sprints/SPRINT-07-02.md` — Sprint 7-2 (Playwright MCP + navigation)
4. `Docs/roadmap/sprints/SPRINT-07-03.md` — Sprint 7-3 (Accessibility tree + tests + docs)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (section 4.2.3)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-011 Playwright)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 6 terminé (MVP-1)
ls -la src/mcp/server.ts
ls -la src/mcp/tools/
# ✅ MCP Server fonctionnel

# 2. Tests MVP-1
npm test
# ✅ Tous les tests passent

# 3. Node.js version
node --version
# ✅ v18.x ou supérieur

# 4. Espace disque
df -h
# ✅ Au moins 2 GB libre
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 6 terminé avec succès (MVP-1 complet)
- ✅ MCP Server fonctionnel (4 outils)
- ✅ Node.js v18+ installé
- ✅ Espace disque suffisant (2 GB)
- ✅ Connexion Internet (pour télécharger les browsers)

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer des fichiers dans `src/browser/`
- ✅ Créer des fichiers dans `tests/browser/`
- ✅ Créer `docs/PLAYWRIGHT.md`
- ✅ Créer `playwright.config.ts`
- ✅ Installer `@playwright/test` (dépendance npm)
- ✅ Installer les browsers Playwright (Chromium, Firefox, WebKit)

**Vous ne pouvez pas :**
- ❌ Modifier `src/business/` (sauf si bug critique)
- ❌ Modifier `src/mcp/` (sauf si bug critique)
- ❌ Modifier `src/cli/` (sauf si bug critique)
- ❌ Créer de fichiers hors périmètre
- ❌ Installer d'autres dépendances (sauf approbation préalable)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Playwright v1.40+ (octobre 2026)
- ✅ 3 browsers (Chromium, Firefox, WebKit)
- ✅ Mode headless par défaut
- ✅ Performance : navigation < 3s, screenshot < 1s

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

**Tests Playwright :**
- ✅ Tests unitaires (mock Playwright)
- ✅ Tests d'intégration (vrai browser)
- ✅ Tests cross-browser (Chromium, Firefox, WebKit)

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Tâche 7.1 : Playwright installé
- [x] Tâche 7.2 : Configuration Playwright créée

### Tâches en cours
- [ ] Tâche 7.3 : Playwright MCP setup (50% terminé)

### Tâches à venir
- [ ] Tâche 7.4 : Navigation basique
- [ ] Tâche 7.5 : Accessibility tree extraction
- [ ] Tâche 7.6 : Tests Playwright

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 7 est terminé quand :**
- ✅ Les 17 critères d'acceptation sont validés (C7.1 à C7.17)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Playwright MCP fonctionne
- ✅ Navigation basique opérationnelle
- ✅ Accessibility tree extractible
- ✅ Documentation complète
- ✅ Commits pushés sur `feat/sprint-7-3`

## Livrables

**À la fin du Sprint 7, fournir :**
- ✅ `src/browser/playwright-mcp.ts` — Playwright MCP
- ✅ `src/browser/navigator.ts` — Navigation basique
- ✅ `src/browser/accessibility.ts` — Accessibility tree
- ✅ `src/browser/types.ts` — Types TypeScript
- ✅ `tests/browser/playwright-mcp.test.ts` — Tests Playwright MCP
- ✅ `tests/browser/navigator.test.ts` — Tests navigation
- ✅ `tests/browser/accessibility.test.ts` — Tests accessibility tree
- ✅ `docs/PLAYWRIGHT.md` — Documentation Playwright
- ✅ `playwright.config.ts` — Configuration Playwright

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-011 Playwright)
- ✅ Consulter la documentation Playwright (https://playwright.dev)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 7-1 : 3 jours (Installation + configuration)
- Sprint 7-2 : 4 jours (Playwright MCP + navigation)
- Sprint 7-3 : 3 jours (Accessibility tree + tests + docs)

## Notes importantes

**Espace disque :**
- ⚠️ Playwright + 3 browsers = ~760 MB
- ⚠️ Vérifier l'espace disque avant installation

**Performance :**
- ⚠️ Mode headless par défaut (plus rapide)
- ⚠️ Navigation < 3s, screenshot < 1s (cibles)

**Tests cross-browser :**
- ⚠️ Tester sur les 3 browsers (Chromium, Firefox, WebKit)
- ⚠️ Certains sites peuvent avoir des comportements différents

**Accessibility tree :**
- ⚠️ Nécessaire pour l'analyse accessibilité (Sprint 9)
- ⚠️ Structure JSON (rôles ARIA, noms, descriptions)
````

---

## 12. Résumé

### 12.1 Sprint 7 — Playwright Setup (2 semaines)

**Objectif :** Intégrer Playwright et Playwright MCP pour l'inspection navigateur

**3 sous-sprints :**
- **Sprint 7-1** (3 jours) : Installation Playwright + configuration
- **Sprint 7-2** (4 jours) : Playwright MCP + navigation basique
- **Sprint 7-3** (3 jours) : Accessibility tree + tests + documentation

**Livrables principaux :**
- ✅ Playwright installé (3 browsers : Chromium, Firefox, WebKit)
- ✅ Playwright MCP configuré
- ✅ Navigation basique (goto, screenshot, trace, PDF)
- ✅ Extraction accessibility tree (DOM + ARIA)
- ✅ Tests d'intégration Playwright
- ✅ Documentation Playwright complète

**17 critères de validation :**
- ✅ C7.1 à C7.8 (fonctionnels)
- ✅ C7.9 à C7.13 (techniques)
- ✅ C7.14 à C7.17 (qualité)

**Dépendances :**
- ✅ Sprint 6 (MCP Server) — Terminé
- ✅ MVP-1 terminé (Knowledge Management Tool)
- 🎯 Sprint 8 (4 Niveaux d'Inspection) — Utilisera Playwright

### 12.2 Transition

**Après Sprint 7 :**
- ✅ Playwright fonctionnel (3 browsers)
- ✅ Playwright MCP configuré
- ✅ Navigation basique opérationnelle
- ✅ Prêt pour Sprint 8 (4 Niveaux d'Inspection)

**Sprint 8 — 4 Niveaux d'Inspection (Semaine 15-16) :**
- 🎯 Inspection L1 (rapide) : Screenshot + accessibility tree
- 🎯 Inspection L2 (standard) : L1 + Lighthouse + SEO
- 🎯 Inspection L3 (approfondie) : L2 + UX + contenu
- 🎯 Lighthouse integration (performance)
- 🎯 axe-core integration (accessibilité)

---

**Fin du dossier Sprint 7 — Playwright Setup**
