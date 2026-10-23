# Registre d'avancement — EKTS

**Statut :** ✅ Actif  
**Date de création :** 21 octobre 2026  
**Dernière mise à jour :** 23 octobre 2026 — Sprint 7 (Playwright)  
**Emplacement :** `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`  
**Source de vérité :** ce registre + les dossiers `Docs/roadmap/sprints/`

---

## 1. Rôle du registre

Ce registre est la **source de vérité unique** de l'avancement. Il remplace les statuts dispersés dans les 48 dossiers de sprint.

**Règles :**

1. Un dossier de sprint ne peut pas être « ✅ Validé » sans ligne correspondante mise à jour ici.
2. Toute mise à jour de statut doit citer le commit et la date.
3. La documentation et l'implémentation sont suivies **séparément** : un sprint peut être documenté sans être implémenté.
4. Les statuts autorisés sont ceux du prompt de transfert (§Workflow) : ⏳, 🔄, 🚫, ✅, 🧪, ❌, ⏸️, 📄.

### 1.1 Légende

| Symbole | Signification |
|---------|---------------|
| ⏳ | Non commencé |
| 🔄 | En cours |
| 🚫 | Bloqué |
| 🧪 | Tests en cours |
| ❌ | Tests échoués |
| ⏸️ | En attente de validation utilisateur |
| ✅ | Implémentation réalisée / validée |
| 📄 | Documentation uniquement |

---

## 2. Vue d'ensemble

| Périmètre | Sprints | Documentation | Implémentation | Tests |
|-----------|---------|---------------|----------------|-------|
| **MVP-1** — Bibliothèque, recherche, CLI, MCP | 1 à 6 | ✅ 24 dossiers | 🟡 Sprints 1-3 terminés | ✅ Linux + Windows |
| **MVP-2** — Inspection navigateur | 7 à 12 | ✅ 24 dossiers | ⏳ | — |
| **MVP-3** — Capitalisation projets | 13 à 18 | ⏳ non documentés | ⏳ | — |

**Total documenté :** 48 dossiers de sprint (43 369 lignes) ; **implémenté :** Sprints 1 à 5 au 22 octobre 2026 (522 tests, couverture 100 %).

> **Sprint 4.5** est un sprint hors plan, ajouté à la demande de l'utilisateur
> (multiplication des clés d'API disponibles). Il ne décale aucun sprint
> documenté : il complète le Sprint 4 en rendant la couche d'accès aux modèles
> indépendante du fournisseur.

---

## 3. Détail par sprint

| Sprint | Sous-sprint | Sujet | Documentation | Implémentation | Tests |
|--------|-------------|-------|---------------|----------------|-------|
| Sprint 1 | 1-1 | Initialisation TypeScript + outils qualité | ✅ Rédigée | ✅ `363b7b8` | ✅ 3 tests, 100 % |
| Sprint 1 | 1-2 | Structure dossiers + dépendances | ✅ Rédigée | ✅ `9c96f2a` | ✅ 8 tests, 100 % |
| Sprint 1 | 1-3 | Gitleaks + README + CI | ✅ Rédigée | ✅ `d5b567c` | ✅ CI + hook |
| Sprint 1 | Dossier parent | Setup projet | ✅ Rédigée | ⏸️ En attente de validation | ✅ |
| Sprint 2 | 2-1 | Schémas SQLite (3 bases) | ✅ Rédigée | ✅ `e0ac3b3` | ✅ 15 tests, 100 % |
| Sprint 2 | 2-2 | Repository Resource + tests | ✅ Rédigée | ✅ `e0ac3b3` | ✅ 26 tests, 100 % |
| Sprint 2 | 2-3 | Validation Zod + documentation | ✅ Rédigée | ✅ `e0ac3b3` | ✅ 17 tests, 100 % |
| Sprint 2 | Dossier parent | Data Layer (SQLite) | ✅ Rédigée | ⏸️ En attente de validation | ✅ |
| Sprint 3 | 3-1 | Knowledge Manager CRUD (add, get, list) | ✅ Rédigée | ✅ `ce674d5` | ✅ 119 tests, 100 % |
| Sprint 3 | 3-2 | Knowledge Manager CRUD suite (update, delete) + tests complets | ✅ Rédigée | ✅ `ce674d5` | ✅ C3.1–C3.15 tracés |
| Sprint 3 | 3-3 | Indexation FTS automatique + documentation | ✅ Rédigée | ✅ `5df7e37` | ✅ 100 % |
| Sprint 3 | Dossier parent | Knowledge Manager (Semaine 5-6) | ✅ Rédigée | ✅ Validé le 22/10/2026 | ✅ C3.1–C3.15 tracés |
| Sprint 4 | 4-1 | Recherche FTS5 (BM25) + Vectorielle (sqlite-vec) | ✅ Rédigée | ✅ Livré | ✅ C4.1, C4.3 |
| Sprint 4 | 4-2 | Génération embeddings (OpenAI) + indexation vectorielle | ✅ Rédigée | ✅ Livré | ✅ C4.2, C4.5, C4.16 |
| Sprint 4 | 4-3 | Fusion RRF + benchmarks + documentation | ✅ Rédigée | ✅ Livré | ✅ C4.4, C4.6–C4.8 |
| Sprint 4 | Dossier parent | Search Engine (Semaine 7-8) | ✅ Rédigée | ⏸️ En attente de validation | ✅ C4.1–C4.16 tracés |
| Sprint 4.5 | 4.5-1 | Catalogue déclaratif (14 fournisseurs, 5 capacités) + trousseau multi-clés | ➕ Hors plan | ✅ `catalogue` | ✅ 27 tests |
| Sprint 4.5 | 4.5-2 | `HttpClient`, disjoncteur, routage par capacité et par espace | ➕ Hors plan | ✅ `routing` | ✅ 43 tests |
| Sprint 4.5 | 4.5-3 | Adaptateurs, `ProviderGateway` (rotation, repli, trace), espace d'embedding persistant | ➕ Hors plan | ✅ `gateway` | ✅ 65 tests |
| Sprint 4.5 | 4.5-4 | `npm run providers`, `.env.example` complet, guide `PROVIDERS.md` | ➕ Hors plan | ✅ `scripts` | ✅ 422 tests, 100 % |
| Sprint 4.5 | 4.5-5 | Sofya (recherche + lecture markdown), MiniMax (chat), registre extensible `providers.custom.json` | ➕ Hors plan | ✅ `registry` | ✅ 34 tests ajoutés |
| Sprint 5 | 5-1 | Commandes de base (init, add, get) | ✅ Rédigée | ✅ `src/cli/commands` | ✅ tests unitaires |
| Sprint 5 | 5-2 | Commandes de recherche et gestion (search, list, delete) | ✅ Rédigée | ✅ `src/cli/commands` | ✅ tests unitaires |
| Sprint 5 | 5-3 | Commande status + tests intégration + documentation | ✅ Rédigée | ✅ `src/cli`, `docs/CLI.md` | ✅ 97 tests CLI, 100 % |
| Sprint 5 | Dossier parent | CLI (Semaine 9-10) | ✅ Rédigée | ✅ Livré | ✅ C5.1–C5.19 |
| Sprint 6 | 6-1 | Setup MCP Server + stdio transport | ✅ Rédigée | ⏳ | — |
| Sprint 6 | 6-2 | Implémentation des 4 outils MCP | ✅ Rédigée | ⏳ | — |
| Sprint 6 | 6-3 | Tests compatibilité agents + documentation | ✅ Rédigée | ⏳ | — |
| Sprint 6 | Dossier parent | MCP Server | ✅ Rédigée | ⏳ | — |
| Sprint 7 | 7-1 | Installation Playwright + Configuration | ✅ Rédigée | ⏳ | — |
| Sprint 7 | 7-2 | Playwright MCP + Navigation basique | ✅ Rédigée | ⏳ | — |
| Sprint 7 | 7-3 | Accessibility Tree + Tests + Documentation | ✅ Rédigée | ⏳ | — |
| Sprint 7 | Dossier parent | Playwright Setup (Semaine 13-14) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | 8-1 | Types + Inspection L1 (Semaine 15) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | 8-2 | Lighthouse + Inspection L2 (Semaine 15-16) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | 8-3 | axe-core + Inspection L3 + Tests + Documentation (Semaine 16) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | Dossier parent | 4 Niveaux d'Inspection (Semaine 15-16) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | 9-1 | Analyse Performance + Accessibilité (Semaine 17) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | 9-2 | Analyse SEO + UX + Contenu (Semaine 17-18) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | 9-3 | Matrice Sévérité + Priorisation + Tests + Documentation (Semaine 18) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | Dossier parent | Analyse 5 Dimensions (Semaine 17-18) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | 10-1 | Schema + Repository (Semaine 19, Jours 1-4) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | 10-2 | Indexation + Recherche (Semaine 19, Jours 5-7) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | 10-3 | Statistiques + Tests + Documentation (Semaine 20, Jours 8-10) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | Dossier parent | Stockage + Indexation (MVP-2) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | 11-1 | Rapports Markdown + PDF (Semaine 21, Jours 1-4) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | 11-2 | Comparaison d'audits (Semaine 21, Jours 5-7) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | 11-3 | CLI + MCP + Tests + Documentation (Semaine 22, Jours 8-10) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | Dossier parent | Rapport Inspection (MVP-2) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | 12-1 | Tests E2E (Semaine 23, Jours 1-4) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | 12-2 | Documentation (Semaine 23, Jours 5-7) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | 12-3 | Validation MVP-2 + Préparation MVP-3 (Semaine 24, Jours 8-10) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | Dossier parent | Tests + Documentation MVP-2 | ✅ Rédigée | ⏳ | — |

---

## 4. Journal des mises à jour

| Date | Événement | Commit |
|------|-----------|--------|
| 21/10/2026 | Création du registre ; 48 dossiers normalisés en `⏳ NON COMMENCÉ` (documentation ✅) | `Sprint 0` |
| 22/10/2026 | Sprint 1-1 : TypeScript 5.9, ESLint 10 (flat config), Prettier 3, Vitest 5 + couverture v8 | `363b7b8` |
| 22/10/2026 | Sprint 1-2 : arborescence `src/`, dépendances runtime (better-sqlite3, commander, zod, pino), configuration et logger typés | `9c96f2a` |
| 22/10/2026 | Sprint 1-3 : Gitleaks + hook pre-commit, CI GitHub Actions, `SETUP.md`, README définitif | `d5b567c` |
| 22/10/2026 | CI verte (qualité Node 22.x et 24.x + détection de secrets) ; correction des chemins historiques dans l'allowlist Gitleaks | `896308e` |
| 22/10/2026 | Sprint 2-1 : 3 bases SQLite (WAL, permissions 600), migrations versionnées, FTS5 autonome, `sqlite-vec` 0.1.9 | `e0ac3b3` |
| 22/10/2026 | Sprint 2-2 : `ResourceRepository` (CRUD, filtres, pagination, indexation FTS transactionnelle) | `e0ac3b3` |
| 22/10/2026 | Sprint 2-3 : validation Zod 4, `docs/guides/DATA_LAYER.md`, 67 tests, couverture 100 % | `344c18e` |
| 22/10/2026 | Correctif installation : `.npmrc` (`ignore-scripts`), `npm run setup` / `check:env`, dépannage Windows | `721cbca` |
| 22/10/2026 | Portabilité Windows : test de configuration indépendant des chemins POSIX, journaux ASCII, `npm run db:inspect`, CI étendue à `windows-latest` | `3f7bc98` |
| 22/10/2026 | Sprint 3 : `KnowledgeManager` (CRUD validé, tags, stats), erreurs métier typées, `Indexer` de maintenance, `npm run db:reindex` | `ce674d5` |
| 22/10/2026 | Correctif d'un test instable (comparaison d'horodatages à la milliseconde), détecté par la CI | `7f2ff24` |
| 22/10/2026 | Audit de conformité Sprint 3 : contrat `IIndexer`, preuve du couplage faible, table de traçabilité C3.1–C3.15 | `5df7e37` |
| 22/10/2026 | Sprint 4 : `FTSRepository` (BM25 `0/10/5/1`, jointure `resource_id`, requête assainie), `VectorRepository` (KNN + normalisation cosinus), `EmbeddingsService` (OpenAI + validation), `VectorIndexer`/décorateur, `fuseResults` (RRF k=60), `SearchEngine` — 240 tests, couverture 100 % | `246638a` |
| 22/10/2026 | Sprint 4 : benchmark 100 000 documents / 100 000 vecteurs — Recall@5 1.000, Faithfulness 1.000, p95 308 ms ; job CI `benchmark` ajouté | `4a8915d` |
| 22/10/2026 | Documentation Sprint 4 : guide `SEARCH_ENGINE.md`, traçabilité C4.1–C4.16, ADR-012 à ADR-014, risques R-4.1 à R-4.4 ; CI verte 6 jobs | `55663fa` |
| 22/10/2026 | Sprint 4.5 : catalogue de 13 fournisseurs, trousseau multi-clés (`_2`…`_8`), `HttpClient` (timeout/reprises/`Retry-After`), disjoncteur, routage par capacité et par espace d'embedding | `sprint-4.5` |
| 22/10/2026 | Sprint 4.5 : `ProviderGateway` (rotation, repli, trace), `GatewayEmbeddingProvider`, migration 002 `embedding-space`, `npm run providers`, `.env.example` complet | `sprint-4.5` |
| 22/10/2026 | Sprint 4.5 : guide `PROVIDERS.md`, ADR-015 à ADR-017, risques R-4.5.1 à R-4.5.7 ; 391 tests, couverture 100 % | `sprint-4.5` |
| 22/10/2026 | Sprint 4.5 : Sofya (`/v1/search`, `/v1/fetch`) et MiniMax (chat) vérifiés ; capacité `web-fetch` ; fournisseurs déclarables sans code (`providers.custom.json`), ADR-018 et risques R-4.5.8–R-4.5.9 | `registry` |
| 22/10/2026 | Sprint 5 : `program`, `runtime`, `services`, `command`, `output`, `options` ; commandes `init`, `add`, `get`, `search`, `list`, `delete`, `status` ; binaire `ekts` (`bin`) | `78232db` |
| 22/10/2026 | Sprint 5 : 97 tests CLI (unités + intégration sur le binaire compilé), `src/cli/**` à 100 %, codes de sortie 0/1/2/3/4 vérifiés ; `docs/CLI.md`, ADR-019, risques R-5.1 à R-5.6 | `45db1ea` |
| 22/10/2026 | Correctif `429 no credits` : indexation vectorielle réellement best-effort (`vectorIndexed` + `vectorWarning`), embeddings résolus par la passerelle (OpenAI/Gemini/OpenRouter/Novita), `EKTS_OFFLINE`, commande `ekts reindex --vectors [--force]` ; ADR-020, risques R-5.9 à R-5.12 | `fix/embeddings` |
| 22/10/2026 | Correctif d'outillage après un merge sans effet : `.gitattributes` (`eol=lf`) contre les CRLF Windows, `npm run doctor`, procédures `SETUP.md` §6.11 (renormalisation) et §6.12 (merge par SHA, « Already up to date ») ; risques R-5.7 et R-5.8 | `fix/checkout` |

| 23/10/2026 | Correctif « `verify` rouge sur le poste » : `openCliServices` et `createRuntime` acceptent un environnement injecté, `createTestRuntime` hermétique (`{}`), `isOffline`/`embeddingSpace` alignés ; 549 tests, couverture 100 %, vert avec et sans `.env` ; ADR-021, risque R-5.13, dépannage `SETUP.md` §6.13 | `fix/tests-hermetiques` |
| 23/10/2026 | Correctif « Firefox Target crashed » : le diagnostic a prouvé que Firefox 157 ne s'ouvre que sans bac à sable sur le poste de validation. `Navigator.start('firefox')` rejoue une fois le lancement sans bac à sable et l'expose (`sandboxDisabled`), politique `EKTS_BROWSER_SANDBOX` (`auto`/`on`/`off`), même repli dans la sonde des tests et dans la fixture e2e, verdict unique dans `doctor:browsers` ; écart E7-13, risque R-7.10 | `fix/firefox-sandbox` |
| 23/10/2026 | Correctif « essai sur poste réel » : `Navigator.stop()` ne lève plus (fermeture ordonnée page → contexte → navigateur, arrêt forcé après délai), sonde d'état des moteurs (`tests/browser/engine-health.ts`) avec saut explicite et mode `EKTS_BROWSER_STRICT`, diagnostic `npm run doctor:browsers` (4 causes d'un `Target crashed`), `firefoxUserPrefs` exposées ; ADR-023 (addendum), risques R-7.8 et R-7.9, `docs/PLAYWRIGHT.md` §6.2, §11.1, §14.1 | `fix/browser-runtime` |
| 23/10/2026 | Sprint 7 : module navigateur `src/browser/` (Playwright 1.64, 3 moteurs), `Navigator` (goto, capture, trace, PDF), accessibility tree via `ariaSnapshotJSON` (l'API `accessibility.snapshot` a été supprimée), 6 règles de violation, serveur MCP navigateur (5 outils) avec politique http/https + confinement des artefacts ; `src/browser/**` à 100 %, 174 tests, suite à 823 tests ; ADR-023, risques R-7.1 à R-7.7, `docs/PLAYWRIGHT.md`, `playwright.config.ts` | `sprint-7` |
| 23/10/2026 | Sprint 6 : serveur MCP `src/mcp/` (SDK 1.32.1, transport stdio), 4 outils en lecture seule (`search_knowledge`, `get_resource`, `list_resources`, `validate_resource`), journal JSON sur stderr, codes `-32000`/`-32001`/`-32602`/`-32603` ; 99 tests MCP dont 8 sur le binaire, `src/mcp/**` à 100 %, suite à 649 tests ; ADR-022, risques R-6.1 à R-6.7, `docs/MCP.md`, `docs/MCP-EXAMPLES.md`, `.mcp.json`, `MCP-COMPATIBILITY.md` | `sprint-6` |
---

## 5. Prochaines étapes

1. **Sprint 7 terminé** — module navigateur livré (823 tests au total, `src/browser/**` à 100 %).
2. **Sprint 8** — 4 niveaux d'inspection : en attente du **feu vert explicite de
   l'utilisateur**. Aucun fichier du Sprint 8 n'est créé avant cet accord.
3. Validation manuelle restante (poste Windows connecté) :
   `npm run browsers:install` puis `npm run test:e2e` (12 tests, 3 moteurs) et
   `npm test` pour activer les 15 tests d'intégration ; Claude Code et Cursor
   pour `MCP-COMPATIBILITY.md` §3.
4. Mise à jour de ce registre à la fin de chaque sous-sprint (statut + commit).

> **Écart technique tranché au Sprint 2** : FTS5 autonome (pas de table de contenu externe) et
> connexion unique avec bases attachées — la conception initiale du blueprint était irréalisable.
> Voir l'addendum de `SPRINT-02-01.md` et `docs/guides/DATA_LAYER.md` §3.2.
>
> **Écart tranché au Sprint 3** : l'indexation FTS reste dans le repository (transaction unique) ;
> `Indexer` couvre la maintenance (`reindexAll`, `checkIntegrity`). Un indexeur appelé après coup
> casserait l'atomicité et créerait des doublons de `rowid`. Voir `SPRINT-03-03.md`.
>
> **Écarts tranchés au Sprint 4** : dix énoncés du dossier (jointure `rowid`, arité de `bm25`,
> sens du tri, opérateur `<=>`, `INSERT OR REPLACE`, etc.) étaient inapplicables et ont été
> corrigés après vérification empirique. L'indexation vectorielle automatique passe par un
> décorateur (`withVectorIndexing`) pour respecter l'interdiction de modifier `KnowledgeManager`.
> Voir `docs/guides/SEARCH_ENGINE.md` §7 (E4-1 à E4-10) et `SPRINT-04.md` §8.5.
>
> **Sprint 4.5 (hors plan)** : la demande utilisateur — exploiter treize clés d'API
> hétérogènes « à leur plein potentiel » — ne correspondait à aucun sprint documenté.
> La réponse architecturale est un catalogue déclaratif et un routage par capacité
> (ADR-015), avec l'espace d'embedding comme unité de bascule (ADR-016) : deux modèles
> produisant des vecteurs incomparables ne se remplacent jamais silencieusement.
> Voir `docs/guides/PROVIDERS.md`.
