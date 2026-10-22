# Roadmap d'Implémentation — Phase 13

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Objectif :** Roadmap par étapes petites et vérifiables, compétences, points de contrôle

---

## 1. Introduction

### 1.1 Contexte

**Architecture cible :** Architecture C (Hybride) — Monolithe modulaire SQLite + services optionnels  
**MVPs définis :** MVP-1 (Bibliothèque + Recherche + CLI + MCP), MVP-2 (Inspection), MVP-3 (Capitalisation)  
**Timeline :** 9 mois (Mois 1-3, 4-6, 7-9)

### 1.2 Principes de la roadmap

1. **Étapes petites** : Chaque étape < 1 semaine de travail
2. **Vérifiable** : Chaque étape a des critères de succès mesurables
3. **Progressive** : Chaque étape construit sur la précédente
4. **Testable** : Tests unitaires + intégration à chaque étape
5. **Documentée** : Documentation à chaque étape (pas de retard)

---

## 2. MVP-1 — Bibliothèque, Recherche, CLI, MCP (Mois 1-3)

### 2.1 Sprint 1 — Setup projet (Semaine 1-2)

**Objectif :** Initialiser le projet TypeScript avec structure de base

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 1.1 | Initialiser projet Node.js + TypeScript | 2h | `package.json`, `tsconfig.json` | `npm run build` fonctionne |
| 1.2 | Configurer ESLint + Prettier | 2h | `.eslintrc`, `.prettierrc` | `npm run lint` passe |
| 1.3 | Configurer Vitest (tests) | 2h | `vitest.config.ts` | `npm test` passe |
| 1.4 | Créer structure dossiers | 2h | `src/`, `tests/`, `docs/` | Structure respectée |
| 1.5 | Installer dépendances de base | 2h | `better-sqlite3`, `commander`, `zod`, `pino` | Dependencies installées |
| 1.6 | Configurer Gitleaks pre-commit | 2h | `.gitleaks.toml`, pre-commit hook | Hook fonctionne |
| 1.7 | Créer README + documentation setup | 4h | `README.md`, `docs/SETUP.md` | Setup documenté |
| 1.8 | CI GitHub Actions (lint + test) | 4h | `.github/workflows/ci.yml` | CI passe |

**Compétences requises :**
- Node.js (intermédiaire)
- TypeScript (intermédiaire)
- Git (bases)

**Point de contrôle :**
- ✅ `npm run build` fonctionne
- ✅ `npm test` passe
- ✅ `npm run lint` passe
- ✅ CI GitHub Actions verte

**Livrable Sprint 1 :** Projet TypeScript initialisé, CI verte, structure de base.

---

### 2.2 Sprint 2 — Data Layer (Semaine 3-4)

**Objectif :** Implémenter la couche données SQLite (3 bases)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 2.1 | Schéma ekts.db (resources, projects) | 4h | `src/data/schema.ts` | Tables créées |
| 2.2 | Schéma ekts-fts.db (FTS5) | 4h | `src/data/fts-schema.ts` | FTS5 virtual table créée |
| 2.3 | Schéma ekts-vectors.db (sqlite-vec) | 4h | `src/data/vector-schema.ts` | Extension sqlite-vec chargée |
| 2.4 | Repository Resource (CRUD) | 8h | `src/data/resource-repository.ts` | CRUD fonctionne |
| 2.5 | Tests unitaires Repository | 8h | `tests/data/resource-repository.test.ts` | Couverture > 80% |
| 2.6 | Validation Zod (Resource schema) | 4h | `src/schemas/resource.ts` | Validation fonctionne |
| 2.7 | Documentation Data Layer | 4h | `docs/DATA_LAYER.md` | API documentée |

**Compétences requises :**
- SQLite (intermédiaire)
- TypeScript (intermédiaire)
- Zod (bases)

**Point de contrôle :**
- ✅ CRUD Resource fonctionne (create, read, update, delete)
- ✅ FTS5 virtual table créée
- ✅ sqlite-vec extension chargée
- ✅ Tests > 80% couverture

**Livrable Sprint 2 :** Data Layer fonctionnel (3 bases SQLite), Repository CRUD, validation Zod.

---

### 2.3 Sprint 3 — Knowledge Manager (Semaine 5-6)

**Objectif :** Implémenter la logique métier (Knowledge Manager)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 3.1 | Knowledge Manager (addResource) | 8h | `src/business/knowledge-manager.ts` | addResource fonctionne |
| 3.2 | Knowledge Manager (getResource) | 4h | Idem | getResource fonctionne |
| 3.3 | Knowledge Manager (listResources) | 4h | Idem | listResources fonctionne |
| 3.4 | Knowledge Manager (updateResource) | 4h | Idem | updateResource fonctionne |
| 3.5 | Knowledge Manager (deleteResource) | 4h | Idem | deleteResource fonctionne |
| 3.6 | Indexation FTS automatique | 8h | `src/business/indexer.ts` | FTS indexé à chaque add/update |
| 3.7 | Tests unitaires Knowledge Manager | 8h | `tests/business/knowledge-manager.test.ts` | Couverture > 80% |
| 3.8 | Documentation Knowledge Manager | 4h | `docs/KNOWLEDGE_MANAGER.md` | API documentée |

**Compétences requises :**
- TypeScript (intermédiaire)
- Design patterns (Repository)
- Tests unitaires

**Point de contrôle :**
- ✅ CRUD Knowledge Manager fonctionne
- ✅ Indexation FTS automatique
- ✅ Tests > 80% couverture
- ✅ API documentée

**Livrable Sprint 3 :** Knowledge Manager fonctionnel, indexation FTS automatique.

---

### 2.4 Sprint 4 — Search Engine (Semaine 7-8)

**Objectif :** Implémenter la recherche hybride (FTS + Vector + RRF)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 4.1 | Recherche FTS5 (BM25) | 8h | `src/business/search-engine.ts` | FTS search fonctionne |
| 4.2 | Génération embeddings (OpenAI) | 8h | `src/business/embeddings.ts` | Embeddings générés |
| 4.3 | Recherche vectorielle (sqlite-vec) | 8h | `src/business/search-engine.ts` | Vector search fonctionne |
| 4.4 | Fusion RRF (k=60) | 8h | Idem | RRF fusion fonctionne |
| 4.5 | Tests unitaires Search Engine | 8h | `tests/business/search-engine.test.ts` | Couverture > 80% |
| 4.6 | Benchmark Recall@5, Faithfulness | 8h | `tests/benchmark/search-benchmark.ts` | Recall@5 ≥ 0.75 |
| 4.7 | Documentation Search Engine | 4h | `docs/SEARCH_ENGINE.md` | API documentée |

**Compétences requises :**
- FTS5 (full-text search)
- Vector embeddings (bases)
- Information retrieval (RRF)
- OpenAI API

**Point de contrôle :**
- ✅ FTS5 search fonctionne (BM25)
- ✅ Vector search fonctionne (cosine similarity)
- ✅ RRF fusion fonctionne
- ✅ Recall@5 ≥ 0.75
- ✅ Faithfulness ≥ 0.80

**Livrable Sprint 4 :** Search Engine hybride (FTS + Vector + RRF), benchmarks validés.

---

### 2.5 Sprint 5 — CLI (Semaine 9-10)

**Objectif :** Implémenter l'interface CLI (Commander.js)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 5.1 | CLI `ekts init` | 4h | `src/cli/index.ts` | Bases SQLite créées |
| 5.2 | CLI `ekts add` | 8h | Idem | Ressource ajoutée |
| 5.3 | CLI `ekts search` | 8h | Idem | Résultats affichés |
| 5.4 | CLI `ekts get` | 4h | Idem | Ressource affichée |
| 5.5 | CLI `ekts list` | 4h | Idem | Liste affichée |
| 5.6 | CLI `ekts delete` | 4h | Idem | Ressource supprimée |
| 5.7 | CLI `ekts status` | 4h | Idem | Statut affiché |
| 5.8 | Tests CLI (integration) | 8h | `tests/cli/cli.test.ts` | Toutes commandes testées |
| 5.9 | Documentation CLI | 4h | `docs/CLI.md` | Commandes documentées |

**Compétences requises :**
- Commander.js (bases)
- CLI design
- Tests d'intégration

**Point de contrôle :**
- ✅ 7 commandes CLI fonctionnent
- ✅ Tests d'intégration passent
- ✅ Documentation CLI complète

**Livrable Sprint 5 :** CLI complète (7 commandes), tests d'intégration, documentation.

---

### 2.6 Sprint 6 — MCP Server (Semaine 11-12)

**Objectif :** Implémenter le serveur MCP (4 outils)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 6.1 | MCP SDK setup (stdio transport) | 8h | `src/mcp/server.ts` | Serveur MCP démarre |
| 6.2 | MCP tool `search_knowledge` | 8h | `src/mcp/tools/search.ts` | Tool fonctionne |
| 6.3 | MCP tool `get_resource` | 4h | `src/mcp/tools/get.ts` | Tool fonctionne |
| 6.4 | MCP tool `list_resources` | 4h | `src/mcp/tools/list.ts` | Tool fonctionne |
| 6.5 | MCP tool `validate_resource` | 4h | `src/mcp/tools/validate.ts` | Tool fonctionne |
| 6.6 | Tests MCP (integration) | 8h | `tests/mcp/mcp.test.ts` | 4 tools testés |
| 6.7 | Test compatibilité Claude Code | 4h | Manuel | Claude Code se connecte |
| 6.8 | Test compatibilité Cursor | 4h | Manuel | Cursor se connecte |
| 6.9 | Documentation MCP | 4h | `docs/MCP.md` | API documentée |

**Compétences requises :**
- MCP SDK TypeScript 1.32.x
- stdio transport
- Tests d'intégration

**Point de contrôle :**
- ✅ MCP Server démarre (stdio)
- ✅ 4 outils MCP fonctionnent
- ✅ Compatible Claude Code
- ✅ Compatible Cursor
- ✅ Tests d'intégration passent

**Livrable Sprint 6 :** MCP Server complet (4 outils), compatible Tier 1 agents, documentation.

---

### 2.7 Synthèse MVP-1

**Timeline :** 12 semaines (3 mois)  
**Compétences totales :** TypeScript, Node.js, SQLite, FTS5, embeddings, MCP, CLI design  
**Livrables finaux :**
- ✅ Data Layer (3 bases SQLite)
- ✅ Knowledge Manager (CRUD)
- ✅ Search Engine (hybride FTS + Vector + RRF)
- ✅ CLI (7 commandes)
- ✅ MCP Server (4 outils)
- ✅ Documentation complète
- ✅ Tests > 80% couverture

**Jalon MVP-1 (Fin Mois 3) :**
- ✅ CLI fonctionne (7 commandes)
- ✅ Recherche hybride (Recall@5 ≥ 0.75)
- ✅ MCP Server (4 outils)
- ✅ Compatible Claude Code, Cursor
- ✅ Tests > 80% couverture

---

## 3. MVP-2 — Inspection Navigateur (Mois 4-6)

### 3.1 Sprint 7 — Playwright Setup (Semaine 13-14)

**Objectif :** Intégrer Playwright et Playwright MCP

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 7.1 | Installer Playwright + browsers | 4h | `package.json` | Playwright installé |
| 7.2 | Playwright MCP setup | 8h | `src/browser/playwright-mcp.ts` | Playwright MCP fonctionne |
| 7.3 | Navigation basique (goto, screenshot) | 8h | `src/browser/navigator.ts` | Navigation fonctionne |
| 7.4 | Accessibility tree extraction | 8h | `src/browser/accessibility.ts` | Arbre extrait |
| 7.5 | Tests Playwright (integration) | 8h | `tests/browser/playwright.test.ts` | Tests passent |
| 7.6 | Documentation Playwright | 4h | `docs/PLAYWRIGHT.md` | API documentée |

**Compétences requises :**
- Playwright (browser automation)
- Accessibility tree
- Tests d'intégration

**Point de contrôle :**
- ✅ Playwright installé + browsers
- ✅ Playwright MCP fonctionne
- ✅ Navigation + screenshot fonctionnent
- ✅ Accessibility tree extrait

**Livrable Sprint 7 :** Playwright intégré, Playwright MCP fonctionnel.

---

### 3.2 Sprint 8 — 4 Niveaux d'Inspection (Semaine 15-16)

**Objectif :** Implémenter les 4 niveaux d'inspection (L1-L3)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 8.1 | Inspection L1 (rapide) | 8h | `src/browser/inspector.ts` | L1 fonctionne |
| 8.2 | Inspection L2 (standard) | 8h | Idem | L2 fonctionne |
| 8.3 | Inspection L3 (approfondie) | 8h | Idem | L3 fonctionne |
| 8.4 | Lighthouse integration (performance) | 8h | `src/browser/lighthouse.ts` | Lighthouse fonctionne |
| 8.5 | axe-core integration (accessibilité) | 8h | `src/browser/axe.ts` | axe-core fonctionne |
| 8.6 | Tests inspection (L1-L3) | 8h | `tests/browser/inspector.test.ts` | Tests passent |

**Compétences requises :**
- Playwright (intermédiaire)
- Lighthouse (performance)
- axe-core (accessibilité)
- WCAG 2.2 (bases)

**Point de contrôle :**
- ✅ L1 fonctionne (< 10s)
- ✅ L2 fonctionne (< 30s)
- ✅ L3 fonctionne (< 60s)
- ✅ Lighthouse + axe-core intégrés

**Livrable Sprint 8 :** 3 niveaux d'inspection (L1-L3), Lighthouse + axe-core intégrés.

---

### 3.3 Sprint 9 — Analyse 5 Dimensions (Semaine 17-18)

**Objectif :** Implémenter l'analyse 5 dimensions + matrice sévérité

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 9.1 | Analyse performance (Lighthouse) | 8h | `src/analysis/performance.ts` | Performance analysée |
| 9.2 | Analyse accessibilité (axe-core) | 8h | `src/analysis/accessibility.ts` | Accessibilité analysée |
| 9.3 | Analyse SEO (meta tags, structured data) | 8h | `src/analysis/seo.ts` | SEO analysé |
| 9.4 | Analyse UX (heuristiques Nielsen) | 8h | `src/analysis/ux.ts` | UX analysée |
| 9.5 | Analyse contenu (qualité, pertinence) | 8h | `src/analysis/content.ts` | Contenu analysé |
| 9.6 | Matrice sévérité (0-4 × 1-5 × 1-3) | 8h | `src/analysis/severity.ts` | Sévérité calculée |
| 9.7 | Tests analyse (5 dimensions) | 8h | `tests/analysis/analysis.test.ts` | Tests passent |

**Compétences requises :**
- Lighthouse (intermédiaire)
- axe-core (intermédiaire)
- SEO best practices
- UX heuristiques
- Analyse contenu

**Point de contrôle :**
- ✅ 5 dimensions analysées
- ✅ Matrice sévérité calculée
- ✅ Priorisation automatique des findings
- ✅ Tests passent

**Livrable Sprint 9 :** Analyse 5 dimensions, matrice sévérité, priorisation findings.

---

### 3.4 Sprint 10 — Stockage + Indexation Audits (Semaine 19-20)

**Objectif :** Stocker audits et findings, indexer pour recherche

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 10.1 | Schéma audits (ekts.db) | 4h | `src/data/audit-schema.ts` | Tables créées |
| 10.2 | Audit Repository (CRUD) | 8h | `src/data/audit-repository.ts` | CRUD fonctionne |
| 10.3 | Stockage findings | 8h | `src/business/audit-manager.ts` | Findings stockés |
| 10.4 | Indexation FTS findings | 8h | `src/business/indexer.ts` | FTS indexé |
| 10.5 | Indexation Vector findings | 8h | Idem | Vector indexé |
| 10.6 | Tests stockage audits | 8h | `tests/business/audit-manager.test.ts` | Tests passent |

**Compétences requises :**
- SQLite (intermédiaire)
- FTS5 (intermédiaire)
- Vector embeddings (bases)

**Point de contrôle :**
- ✅ Audits stockés (ekts.db)
- ✅ Findings indexés (FTS + Vector)
- ✅ Recherche `search_knowledge` inclut audits
- ✅ Tests passent

**Livrable Sprint 10 :** Audits stockés + indexés, recherche inclut audits.

---

### 3.5 Sprint 11-12 — CLI + MCP Inspection (Semaine 21-24)

**Objectif :** Exposer inspection via CLI et MCP

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 11.1 | CLI `ekts inspect <url> --level L1` | 8h | `src/cli/index.ts` | L1 fonctionne |
| 11.2 | CLI `ekts inspect <url> --level L2` | 8h | Idem | L2 fonctionne |
| 11.3 | CLI `ekts inspect <url> --level L3` | 8h | Idem | L3 fonctionne |
| 11.4 | MCP tool `inspect_site` | 8h | `src/mcp/tools/inspect.ts` | Tool fonctionne |
| 11.5 | Tests CLI inspection | 8h | `tests/cli/inspect.test.ts` | Tests passent |
| 11.6 | Tests MCP inspection | 8h | `tests/mcp/inspect.test.ts` | Tests passent |
| 11.7 | Documentation inspection | 4h | `docs/INSPECTION.md` | API documentée |

**Compétences requises :**
- CLI design
- MCP SDK
- Tests d'intégration

**Point de contrôle :**
- ✅ CLI `ekts inspect` fonctionne (L1-L3)
- ✅ MCP tool `inspect_site` fonctionne
- ✅ Tests CLI + MCP passent
- ✅ Documentation complète

**Livrable Sprint 11-12 :** Inspection via CLI + MCP, tests, documentation.

---

### 3.6 Synthèse MVP-2

**Timeline :** 12 semaines (3 mois)  
**Compétences totales :** Playwright, Lighthouse, axe-core, WCAG 2.2, SEO, UX  
**Livrables finaux :**
- ✅ Playwright MCP intégré
- ✅ 3 niveaux d'inspection (L1-L3)
- ✅ Analyse 5 dimensions
- ✅ Matrice sévérité
- ✅ Audits stockés + indexés
- ✅ CLI + MCP inspection
- ✅ Documentation complète

**Jalon MVP-2 (Fin Mois 6) :**
- ✅ Inspection L1-L3 fonctionne
- ✅ 5 dimensions analysées
- ✅ Audits stockés + indexés
- ✅ Tests > 80% couverture

---

## 4. MVP-3 — Capitalisation Projets (Mois 7-9)

### 4.1 Sprint 13-14 — Workflow 8 Étapes (Semaine 25-28)

**Objectif :** Implémenter le workflow de capitalisation (8 étapes)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 13.1 | Étape 1 : Collecte artefacts | 8h | `src/capitalization/collector.ts` | Artefacts collectés |
| 13.2 | Étape 2 : Nettoyage secrets (Gitleaks) | 8h | `src/capitalization/secrets.ts` | Secrets détectés |
| 13.3 | Étape 2 : Vérification (TruffleHog) | 8h | Idem | Secrets vérifiés |
| 13.4 | Étape 3 : Documentation | 8h | `src/capitalization/documenter.ts` | Documenté |
| 13.5 | Étape 4 : Vérification | 4h | `src/capitalization/validator.ts` | Validé |
| 13.6 | Étape 5 : Validation (humaine) | 4h | Idem | Approval gate |
| 13.7 | Étape 6 : Publication (Git) | 8h | `src/capitalization/publisher.ts` | Publié |
| 13.8 | Étape 7 : Indexation (FTS + Vector) | 8h | `src/capitalization/indexer.ts` | Indexé |
| 13.9 | Étape 8 : Dépréciation (si besoin) | 4h | `src/capitalization/deprecator.ts` | Déprécié |
| 13.10 | Tests workflow | 8h | `tests/capitalization/workflow.test.ts` | Tests passent |

**Compétences requises :**
- Git (intermédiaire)
- Gitleaks + TruffleHog
- Workflow design

**Point de contrôle :**
- ✅ 8 étapes fonctionnent
- ✅ Secrets détectés (Gitleaks + TruffleHog)
- ✅ Publication Git fonctionne
- ✅ Indexation FTS + Vector
- ✅ Tests passent

**Livrable Sprint 13-14 :** Workflow 8 étapes fonctionnel, sécurité secrets.

---

### 4.2 Sprint 15-16 — Post-Mortem Template (Semaine 29-32)

**Objectif :** Générer post-mortems structurés (10 sections)

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 15.1 | Template post-mortem (10 sections) | 8h | `src/capitalization/postmortem.ts` | Template créé |
| 15.2 | Génération automatique | 8h | Idem | Post-mortem généré |
| 15.3 | Root cause analysis (5 pourquoi) | 8h | `src/capitalization/root-cause.ts` | Analyse fonctionne |
| 15.4 | Dette technique (inventaire) | 8h | `src/capitalization/debt.ts` | Dette tracée |
| 15.5 | Recommandations (temporelles) | 8h | `src/capitalization/recommendations.ts` | Recommandations générées |
| 15.6 | Tests post-mortem | 8h | `tests/capitalization/postmortem.test.ts` | Tests passent |
| 15.7 | Documentation post-mortem | 4h | `docs/POSTMORTEM.md` | Template documenté |

**Compétences requises :**
- Post-mortem facilitation
- Root cause analysis (5 pourquoi, Ishikawa)
- Dette technique

**Point de contrôle :**
- ✅ Template 10 sections créé
- ✅ Post-mortem généré automatiquement
- ✅ Root cause analysis fonctionne
- ✅ Dette technique tracée
- ✅ Recommandations temporelles

**Livrable Sprint 15-16 :** Post-mortem template (10 sections), root cause analysis, dette technique.

---

### 4.3 Sprint 17-18 — CLI + MCP Capitalization (Semaine 33-36)

**Objectif :** Exposer capitalisation via CLI et MCP

**Étapes :**

| # | Tâche | Durée | Livrable | Critère de succès |
|---|-------|-------|----------|-------------------|
| 17.1 | CLI `ekts capitalize <path>` | 8h | `src/cli/index.ts` | Capitalization fonctionne |
| 17.2 | MCP tool `capitalize_project` | 8h | `src/mcp/tools/capitalize.ts` | Tool fonctionne |
| 17.3 | Tests CLI capitalization | 8h | `tests/cli/capitalize.test.ts` | Tests passent |
| 17.4 | Tests MCP capitalization | 8h | `tests/mcp/capitalize.test.ts` | Tests passent |
| 17.5 | Documentation capitalization | 4h | `docs/CAPITALIZATION.md` | API documentée |
| 17.6 | Validation finale MVP-3 | 8h | Manuel | Tous critères validés |
| 17.7 | Release MVP-3 | 4h | Git tag v1.0.0 | Release publiée |

**Compétences requises :**
- CLI design
- MCP SDK
- Tests d'intégration
- Release management

**Point de contrôle :**
- ✅ CLI `ekts capitalize` fonctionne
- ✅ MCP tool `capitalize_project` fonctionne
- ✅ Tests CLI + MCP passent
- ✅ Documentation complète
- ✅ Release v1.0.0 publiée

**Livrable Sprint 17-18 :** Capitalisation via CLI + MCP, release MVP-3.

---

### 4.4 Synthèse MVP-3

**Timeline :** 12 semaines (3 mois)  
**Compétences totales :** Git, Gitleaks, TruffleHog, post-mortem, root cause analysis  
**Livrables finaux :**
- ✅ Workflow 8 étapes
- ✅ Sécurité secrets (Gitleaks + TruffleHog)
- ✅ Post-mortem template (10 sections)
- ✅ Root cause analysis
- ✅ Dette technique tracée
- ✅ CLI + MCP capitalization
- ✅ Release v1.0.0

**Jalon MVP-3 (Fin Mois 9) :**
- ✅ Workflow 8 étapes fonctionne
- ✅ Secrets détectés
- ✅ Post-mortems générés
- ✅ Release v1.0.0 publiée

---

## 5. Vue d'ensemble de la roadmap

### 5.1 Timeline globale

```
Mois 1-3 : MVP-1 (Bibliothèque + Recherche + CLI + MCP)
├── Sprint 1 (S1-2) : Setup projet
├── Sprint 2 (S3-4) : Data Layer
├── Sprint 3 (S5-6) : Knowledge Manager
├── Sprint 4 (S7-8) : Search Engine
├── Sprint 5 (S9-10) : CLI
└── Sprint 6 (S11-12) : MCP Server

Mois 4-6 : MVP-2 (Inspection Navigateur)
├── Sprint 7 (S13-14) : Playwright Setup
├── Sprint 8 (S15-16) : 4 Niveaux Inspection
├── Sprint 9 (S17-18) : Analyse 5 Dimensions
├── Sprint 10 (S19-20) : Stockage Audits
└── Sprint 11-12 (S21-24) : CLI + MCP Inspection

Mois 7-9 : MVP-3 (Capitalisation Projets)
├── Sprint 13-14 (S25-28) : Workflow 8 Étapes
├── Sprint 15-16 (S29-32) : Post-Mortem Template
└── Sprint 17-18 (S33-36) : CLI + MCP Capitalization
```

### 5.2 Jalons

| Jalon | Date | Critères |
|-------|------|----------|
| **MVP-1** | Fin Mois 3 | CLI 7 commandes, Recall@5 ≥ 0.75, MCP 4 outils, tests > 80% |
| **MVP-2** | Fin Mois 6 | Inspection L1-L3, 5 dimensions, audits stockés, tests > 80% |
| **MVP-3** | Fin Mois 9 | Workflow 8 étapes, secrets détectés, post-mortems, release v1.0.0 |

### 5.3 Points de contrôle humain

**Après chaque Sprint :**
- ✅ Code review (PR)
- ✅ Tests passent (CI)
- ✅ Documentation mise à jour
- ✅ Validation humaine (product owner)

**Après chaque MVP :**
- ✅ Demo (stakeholders)
- ✅ Retrospective (équipe)
- ✅ Validation critères d'acceptation
- ✅ Go/No-Go pour MVP suivant

**Reviews intermédiaires :**
- **Fin Mois 1** : Point d'avancement Sprint 1-2
- **Fin Mois 2** : Point d'avancement Sprint 3-4
- **Fin Mois 4** : Point d'avancement Sprint 7-8
- **Fin Mois 5** : Point d'avancement Sprint 9-10
- **Fin Mois 7** : Point d'avancement Sprint 13-14
- **Fin Mois 8** : Point d'avancement Sprint 15-16

---

## 6. Compétences requises par MVP

### 6.1 MVP-1

| Compétence | Niveau | Acquisition |
|------------|--------|-------------|
| TypeScript | Intermédiaire | Pré-requis |
| Node.js | Intermédiaire | Pré-requis |
| SQLite | Intermédiaire | Sprint 2 (4h) |
| FTS5 | Bases | Sprint 4 (4h) |
| Vector embeddings | Bases | Sprint 4 (4h) |
| MCP SDK | Bases | Sprint 6 (4h) |
| Commander.js | Bases | Sprint 5 (4h) |
| Zod | Bases | Sprint 2 (2h) |
| Tests unitaires | Intermédiaire | Pré-requis |

### 6.2 MVP-2

| Compétence | Niveau | Acquisition |
|------------|--------|-------------|
| Playwright | Intermédiaire | Sprint 7 (8h) |
| Lighthouse | Intermédiaire | Sprint 8 (8h) |
| axe-core | Intermédiaire | Sprint 8 (8h) |
| WCAG 2.2 | Bases | Sprint 8 (4h) |
| SEO | Bases | Sprint 9 (4h) |
| UX heuristiques | Bases | Sprint 9 (4h) |

### 6.3 MVP-3

| Compétence | Niveau | Acquisition |
|------------|--------|-------------|
| Git | Intermédiaire | Pré-requis |
| Gitleaks | Bases | Sprint 13 (4h) |
| TruffleHog | Bases | Sprint 13 (4h) |
| git-filter-repo | Bases | Sprint 13 (4h) |
| Post-mortem | Bases | Sprint 15 (4h) |
| Root cause analysis | Bases | Sprint 15 (4h) |

---

## 7. Risques et mitigations

### 7.1 Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **SQLite performance** | Faible | Élevé | WAL mode, benchmark régulier, migration PostgreSQL si besoin |
| **Embeddings coût** | Moyen | Moyen | OpenAI API ($0.02/1M tokens), ou local Ollama (gratuit) |
| **Playwright stabilité** | Moyen | Élevé | Retry mechanism, timeout handling, fallback Patchright |
| **MCP compatibility** | Faible | Élevé | Tester avec Claude Code, Cursor, Copilot (Tier 1 agents) |

### 7.2 Risques organisationnels

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Scope creep** | Moyen | Moyen | Stick to périmètre défini, feature flags pour options |
| **Retard planning** | Moyen | Moyen | Buffer 2 semaines par MVP, priorisation stricte |
| **Compétences manquantes** | Faible | Élevé | Formation continue, documentation, pair programming |
| **Burnout** | Faible | Élevé | Rythme soutenable (40h/semaine), pauses régulières |

### 7.3 Plan de contingence

**Si retard MVP-1 :**
- Reporter MVP-2 de 2 semaines
- Réduire périmètre MVP-1 (exclure RRF, garder FTS uniquement)

**Si retard MVP-2 :**
- Reporter MVP-3 de 2 semaines
- Réduire périmètre MVP-2 (exclure L3, garder L1-L2)

**Si problème technique bloquant :**
- Escalade immédiate (product owner)
- Decision : fix, workaround, ou reporter

---

## 8. Conclusion

### 8.1 Synthèse

**Roadmap définie :**
- ✅ **18 sprints** (2 semaines chacun)
- ✅ **3 MVPs** (Mois 1-3, 4-6, 7-9)
- ✅ **Étapes petites** (< 1 semaine par tâche)
- ✅ **Vérifiable** (critères de succès mesurables)
- ✅ **Progressive** (chaque étape construit sur la précédente)

**Compétences requises :**
- ✅ MVP-1 : TypeScript, Node.js, SQLite, FTS5, embeddings, MCP, CLI
- ✅ MVP-2 : Playwright, Lighthouse, axe-core, WCAG 2.2, SEO, UX
- ✅ MVP-3 : Git, Gitleaks, TruffleHog, post-mortem, root cause analysis

**Points de contrôle :**
- ✅ Après chaque Sprint : code review, tests, documentation
- ✅ Après chaque MVP : demo, retrospective, validation
- ✅ Reviews intermédiaires : tous les 2 mois

### 8.2 Prochaines étapes

**Phase 13 — Suite :**
- ✅ `13_ARCHITECTURES_CIBLES_COMPAREES.md` — Architectures comparées
- ✅ `13_SPECIFICATION_MVP.md` — Périmètre MVP, contrats
- ✅ `13_ROADMAP_IMPLEMENTATION.md` — Roadmap détaillée (ce document)
- `13_CRITERES_ACCEPTATION.md` — Critères d'acceptation, tests

**Phase 14 — Audit final :**
- Cohérence globale
- Maintenance et veille
- Documentation complète

---

**Document rédigé le 21 octobre 2026 — Phase 13 du projet EKTS**
