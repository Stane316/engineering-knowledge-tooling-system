# Changelog

Tous les changements notables sont documentés dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) ·
versioning : [Semantic Versioning](https://semver.org/lang/fr/spec/v2.0.0.html).

Les versions suivent `package.json` (la libellé de phase « MVP » est
informatif). Dates vérifiées dans l'historique git du dépôt.

## [0.2.0] - 2026-10-26

### MVP-3 — Capitalisation de Projets (Sprints 13–18)

#### Ajouté — Sprint 13 : multi-projets

- Module projets (`src/business/project-manager*`,
  `src/data/repositories/project-repository.ts`), migration 003
  (`projects`, `audit_metadata.project_id` nullable)
- CLI `ekts project` (create, list, show, delete `-f`) + filtre `-p` transversal
- Outils MCP `create_project`, `list_projects`, `get_project`, `delete_project`
- Documentation `docs/guides/PROJECTS.md`

#### Ajouté — Sprint 14 : suivi temporel

- Module `src/timeline/` (analyse, tendances, alertes, graphiques),
  migration 004 (`alerts`)
- CLI `ekts timeline` (analyze, trends `--lookback`, alerts `--check`,
  chart `-f svg|png`)
- Outil MCP `get_timeline` · guide `docs/guides/TIMELINE.md`

#### Ajouté — Sprint 15 : capitalisation des connaissances

- Module `src/best-practices/` (extractor de constats **résolus**,
  recherche hybride FTS5 + RRF), migration 005 (+ `best_practices_fts`
  external content par triggers)
- CLI `ekts bestpractice` (list, search, add, show, delete, extract)
- Outils MCP `search_best_practices`, `add_best_practice`
- Guide `docs/guides/BEST_PRACTICES.md`

#### Ajouté — Sprint 16 : recommandations contextuelles

- Module `src/recommendations/` (engine hybride règles 0,8 + scoring
  statistique, contexte projet), migration 006
  (`recommendation_rules`, `generated_recommendations`)
- CLI `ekts recommend` (generate, list, rules add|toggle|delete)
- Outil MCP `get_recommendations` · sections optionnelles Markdown/PDF
- Guide `docs/guides/RECOMMENDATIONS.md`

#### Ajouté — Sprint 17 : templates de projets

- Module `src/templates/` (repository, applier merge profond ADR-041,
  service), migrations 007 `project_templates` + 008 `project_config`
- 10 templates prédéfinis (seed idempotent, builtins immuables ADR-040)
- CLI `ekts template` (list, show, apply, create, delete, export, import)
- Outils MCP `list_templates`, `apply_template` (catalogue **17** outils)
- Guide `docs/guides/TEMPLATES.md`

#### Ajouté — Sprint 18 : tests et documentation

- Tests E2E MVP-3 : `tests/e2e/mvp3/` (7 fichiers, **26 tests, 29,8 s**),
  script `npm run test:e2e:mvp3`, job CI `e2e-mvp3` (timeout 5 min, ADR-042)
- Guides : `docs/MVP3_GUIDE.md`, `docs/MVP3_ARCHITECTURE.md`,
  `docs/MVP3_EXTENSION.md` (synthèse ADR-043, sans duplication)
- Validation : `docs/MVP3_VALIDATION.md` — **97/97** lignes-critères
  (94 avec preuve, 3 P3 tranchés, 0 rejet)
- Préparation MVP-4 : `docs/MVP4_PREPARATION.md` (4 options, ADR-044 —
  documenté, non implémenté)
- API_REFERENCE : +6 outils MCP, catalogue 17 ; README, ROADMAP à jour

### Changed

- Version `0.1.0` → `0.2.0` (MVP-3 livré)
- Catalogue MCP : 11 → **17 outils** ; CLI : 8 → **15 commandes** racine
- Couverture mesurée au 26/10/2026 : **96,40 %** lignes, 90,92 %
  branches, 97,70 % fonctions (1 656 tests, 34 skips)
- Espace de stockage : `ekts.db` + `ekts-fts.db` + `ekts-vectors.db`
  (migrations 001→008, `user_version` 8)

### Limites documentées (P3 — `docs/MVP3_VALIDATION.md`)

- Section « Recommandations contextuelles » non injectée dans les
  rapports CLI/MCP (C16.6/7) ; unicité des noms de projet non contrainte
  (C17.12) ; 1 000 règles de charge testée au lieu de 10 000 (C16.14)

---

## [0.1.0] - 2026-10-25

### MVP-2 — Inspection, analyse et rapports (Sprints 7–12)

#### Ajouté — Sprint 7 : socle navigateur

- Playwright (`@playwright/test 1.64`) : ouverture de page, screenshot,
  capture, impression PDF, extraction du DOM et de l'accessibility tree
- Gestion des erreurs typées et du bac à sable Windows
  (`EKTS_BROWSER_SANDBOX`, relance automatique hors sandbox)
- Budgets de navigation et tests des 3 moteurs (Chromium, Firefox, WebKit)
- Documentation `docs/PLAYWRIGHT.md`

#### Ajouté — Sprint 8 : inspecteur L1–L3

- Trois niveaux emboîtés : **L1** (capture, ARIA, métadonnées) · **L2** (+
  Lighthouse, SEO DOM) · **L3** (+ axe-core, heuristiques Nielsen, contenu) —
  L4 (crawling) hors périmètre MVP-2 (décision explicite)
- Résultats structurés + `warnings[]` pour toute dégradation (zéro score
  inventé) et budgets mesurés (`withinBudget`)
- Documentation `docs/INSPECTOR.md`

#### Ajouté — Sprint 9 : analyse 5 dimensions

- Analyseurs performance (Core Web Vitals), accessibilité (WCAG 2.2 AA),
  SEO, UX, contenu ; poids globaux 25/25/20/15/15
- Matrice sévérité × effort × impact, priorisation des constats,
  `Finding.recommendation` obligatoire
- Pont d'adaptation inspection → analyse (`fromInspection`)
- Documentation `docs/ANALYSIS.md`

#### Ajouté — Sprint 10 : stockage et indexation

- Schéma SQLite audits (`audit_metadata`, `audit_dimensions`,
  `audit_findings`) + `AuditRepository` (CRUD, pagination, transactions)
- Index FTS5 (BM25) et vecteurs (sqlite-vec), `AuditIndexer`,
  maintenance d'espace d'embedding
- Recherche hybride **RRF (k = 60)**, statistiques (moyenne, tendances,
  top problèmes) — mesures : stockage 0,89 ms/audit, recherche 2,7 ms sur
  10 000 audits
- Documentation `docs/STORAGE.md`

#### Ajouté — Sprint 11 : rapports, CLI et MCP

- Rapports **Markdown** et **PDF** (Puppeteer 25, résolution Chrome
  multi-chemins, rendus 2–4 s) + **comparaison** d'audits (évolution,
  deltas, recommandations)
- CLI élargie à **10 commandes** : `init`, `add`, `get`, `search`, `list`,
  `delete`, `status`, `reindex`, `inspect`, `audit
  list|show|report|compare` — codes de sortie 0/1/2/3/4, `--json` global
- Serveur MCP élargi à **7 outils** : `search_knowledge`, `get_resource`,
  `list_resources`, `validate_resource`, `inspect_site`, `audit_history`,
  `audit_report` (validation Zod, erreurs structurées)
- Documentation `docs/REPORTS.md`, `docs/CLI.md`, `docs/MCP.md`

#### Ajouté — Sprint 12 : tests E2E, documentation et validation

- 5 fichiers E2E (`tests/e2e/`) : inspection, CLI, MCP, comparaison,
  workflow complet — page locale, zéro réseau externe, binaire compilé
  réel ; correctifs d'isolation et d'exécution asynchrone de la CLI
- Documentation : `USER_GUIDE.md`, `DEVELOPER_GUIDE.md`,
  `API_REFERENCE.md`, `TROUBLESHOOTING.md` (23 cas), `CONTRIBUTING.md`
- **Validation MVP-2 : `MVP2_VALIDATION.md` — 88/88 critères**
- Feuille de route `ROADMAP.md` (MVP-3 : 6 sprints), README à jour,
  ce changelog

#### Métriques MVP-2

- Code source : 19 776 lignes · tests : 1 260 · couverture **97,06 %**
- Documentation `docs/` : 5 081 lignes
- `npm run verify` code 0 · CI 7/7 jobs verts par push
- Sécurité : Gitleaks (pre-commit + CI), `npm audit` 0 vuln, aucun secret

#### Correctifs et hardening (fin de cycle MVP-2)

- Rotation des clés exposées et verrouillage `.env` (23/10/2026), scans
  Gitleaks en pré-commit et en CI, `npm audit` sans vulnérabilité.
- Fins de ligne unifiées (CRLF/LF), sauvegarde d'une `.env.example` en
  exemple à la place du secret réel.
- Rendus PDF stabilisés (warm-up, budgets de test 30 s, résolution Chrome
  multi-chemins : chemin imposé → variables → Chrome embarqué → Chromium
  Playwright → chemins système).
- Boucle S12-1 : exécution CLI **asynchrone** dans les E2E (le serveur
  fixture reste servable pendant l'attente), bases de test isolées par cas,
  messages d'échec explicites (stderr complet, timeout signalé).
- Couverture portée à **97,06 %** lignes (seuil maison 80 %).

### Hors périmètre MVP-2 (porté en suite de roadmap)

- **L4 (crawling multi-pages)** — décision explicite, reporté post-MVP-2.
- Collaboration, comptes et partage (MVP-4).
- Intégrations tierces, IA générative de rapports, marketplace (MVP-5 à 7).
- Fichiers `.env` réels, secrets et sorties `providers` ne sont jamais
  livrés (choix de sécurité structurel).

### Écosystème et outillage (Sprints 1–6 et continu)

- Scripts maison : `verify`, `doctor`, `check:env`, `setup`,
  `browsers:install`, `db:inspect`, `db:reindex`, `providers`,
  `test:benchmark`, `security:secrets`
- CI GitHub Actions (7 jobs) : qualité ×4 (Ubuntu/Windows × Node 22/24),
  détection de secrets, audit de dépendances, benchmark de recherche
- Hooks Husky + Gitleaks · `.npmrc` `ignore-scripts=true` (installation
  sans compilation native)
- Catalogue de 14+ fournisseurs embeddings/chat/search avec rotation de
  clés `_2…_8` et politique `quality|free|cost`

## [0.0.1] - 2026-10-23

### MVP-1 — Connaissances, recherche, CLI et MCP (Sprints 1–6)

#### Ajouté

- **Sprint 1** — initialisation TypeScript strict (ESM), ESLint flat,
  Prettier, Vitest (seuils 80 %), structure `src/` et `tests/`
- **Sprint 2** — SQLite (`better-sqlite3`, WAL), schéma et migrations,
  repositories de base
- **Sprint 3** — `KnowledgeManager` : validation, tags, cycle de vie des
  ressources
- **Sprint 4 / 4.5** — moteur de recherche hybride (FTS5 BM25 + vecteurs +
  RRF k=60), catalogue de fournisseurs embeddings/chat/search
  (OpenAI, Gemini, OpenRouter, Novita, Sofya, MiniMax, …), rotation de
  clés et politique qualité/gratuit/coût
- **Sprint 5** — CLI Commander.js (`add`, `search`, `get`, `list`,
  `delete`, `init`, `status`), sorties humaines/JSON, codes de sortie
- **Sprint 6** — serveur MCP stdio (`@modelcontextprotocol/sdk`),
  outils initiaux `search_knowledge`, `get_resource`, `list_resources`,
  `validate_resource`, `.mcp.json` pour les clients
- Qualité continue : hooks Gitleaks, CI GitHub Actions, `npm run verify`

#### Sécurité

- Rotation des clés exposées (23/10/2026), `.env` ignoré en permanence,
  aucune sortie `providers`/keyring en dépôt ou en log

---

## Versions

- **[0.1.0]** — MVP-2 validé (88/88 critères) — 2026-10-25
- **[0.0.1]** — MVP-1 livré — 2026-10-23 (premier état fonctionnel du dépôt)

---

**Format :** [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) ·
**Versioning :** [Semantic Versioning](https://semver.org/lang/fr/spec/v2.0.0.html)
