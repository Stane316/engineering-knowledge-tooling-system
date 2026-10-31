# Registre d'avancement — EKTS

**Statut :** ✅ Actif  
**Date de création :** 21 octobre 2026  
**Dernière mise à jour :** 30 octobre 2026 — Série 19 terminée (19-01 → 19-03), bilan soumis  
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

### 1.2 Décomposition documentaire MVP-4 validée — 30/10/2026

La [roadmap](../../../ROADMAP.md) et la décomposition en sprints 19–24 ont été validées par le propriétaire. Le contenu opérationnel doit être vérifié avant chaque sprint ; **aucun lancement ni développement n'est autorisé par cette validation**. Aucun statut historique n'est remplacé ; aucun commit n'est inventé. Ces fichiers ont été commités (`5dd02a7`, fusion d'alignement du 30/10/2026). Un développement a depuis été autorisé par feu vert distinct : voir le sprint 19 ci-dessous et le journal §4.

| Sprint planifié | Documentation | Implémentation | Référence |
|---|---|---|---|
| 19 — Priorités et scores web | 📄 Décomposition lue et prérequis vérifiés | ✅ **19-01, 19-02 et 19-03 terminés** (`ad5cd35` + `693fced` ; `696e165` ; `b48c175` + `2e24cb5`) — bilan soumis, accord attendu | [SPRINT-19](sprints/SPRINT-19.md) · [bilan 19](sprints/SPRINT-19-RESULTAT.md) · [19-01](sprints/SPRINT-19-01-RESULTAT.md) · [19-02](sprints/SPRINT-19-02-RESULTAT.md) · [19-03](sprints/SPRINT-19-03-RESULTAT.md) |
| 20 — Métriques, preuves et sécurité web | 📄 Décomposition validée ; détails à vérifier avant lancement | ⏳ Non commencée | [SPRINT-20](sprints/SPRINT-20.md) |
| 21 — Profil de lecture et confinement | 📄 Décomposition validée ; détails à vérifier avant lancement | ⏳ Non commencée | [SPRINT-21](sprints/SPRINT-21.md) |
| 22 — Provenance et FTS | 📄 Décomposition validée ; détails à vérifier avant lancement | ⏳ Non commencée | [SPRINT-22](sprints/SPRINT-22.md) |
| 23 — Preuves et exploitation | 📄 Décomposition validée ; détails à vérifier avant lancement | ⏳ Non commencée | [SPRINT-23](sprints/SPRINT-23.md) |
| 24 — Validation et décision pilote | 📄 Décomposition validée ; détails à vérifier avant lancement | ⏳ Non commencée | [SPRINT-24](sprints/SPRINT-24.md) |

Les rapports `*-RESULTAT.md` ne seront créés qu'après des travaux réellement effectués. Aucun test, scénario agent, commit, push ou PR n'est autorisé par la rédaction. Les observations de phase 1 ne sont pas les résultats de ces sprints.

---

## 2. Vue d'ensemble

| Périmètre | Sprints | Documentation | Implémentation | Tests |
|-----------|---------|---------------|----------------|-------|
| **MVP-1** — Bibliothèque, recherche, CLI, MCP | 1 à 6 | ✅ 24 dossiers | ✅ Sprints 1 à 6 terminés | ✅ 1 260 tests, couverture 97,06 % |
| **MVP-2** — Inspection navigateur, analyse, rapports | 7 à 12 | ✅ 24 dossiers | ✅ Sprints 7 à 12 terminés | ✅ 88/88 critères validés |
| **MVP-3** — Multi-projets, capitalisation, recommandations | 13 à 18 | ✅ 26 dossiers | ✅ Sprints 13 à 18 terminés | ✅ 1 656 tests, couverture 96,40 %, **97/97 critères** |
| **MVP-4** — Priorités et intégrité des scores (démarrage) | 19 | 📄 Dossiers 19-01 à 19-03 | ✅ Série 19 terminée le 30/10/2026 | ✅ 1 732 tests, couverture 96,03 % |

**Total documenté :** 52 dossiers de sprint ; **implémenté :** Sprints 1 à 18 au 26 octobre 2026 (1 656 tests, couverture 96,40 %, **MVP-2 validé 88/88, MVP-3 validé 97/97**).

> **Note (25/10/2026) :** Le périmètre du MVP-3 a été redéfini (ADR-031). Il ne s'agit plus du workflow 8 étapes initial, mais de : Multi-Projets (S13), Suivi Temporel (S14), Capitalisation Connaissances (S15), Recommandations (S16), Templates (S17), Tests+Docs (S18). Voir `docs/ROADMAP.md`.

> **Sprint 4.5** est un sprint hors plan, ajouté à la demande de l'utilisateur
> (multiplication des clés d'API disponibles). Il ne décale aucun sprint
> documenté : il complète le Sprint 4 en rendant la couche d'accès aux modèles
> indépendante du fournisseur.

---

## 3. Détail par sprint

> **Note de révision documentaire — 30/10/2026 :** les quatre entrées du Sprint 17 (17-1, 17-2, 17-3 et parent) apparaissent deux fois ci-dessous avec des statuts incompatibles : une série « livré/validé », une série « non commencé ». Elles sont conservées telles quelles ; leur réconciliation officielle reste ouverte. Le [résultat S17](sprints/SPRINT-17-RESULTAT.md) déclare les trois sous-sprints terminés ; le [résultat S18](sprints/SPRINT-18-RESULTAT.md) et la [validation MVP-3](../../../MVP3_VALIDATION.md) documentent la clôture et ses réserves. Ces documents sont des sources historiques, pas une nouvelle vérification indépendante de toutes les capacités. La [roadmap révisée](../../../ROADMAP.md) recense aussi la réserve de rapports C16.6/C16.7, les décalages documentaires MCP, de version et de calendrier. Cette note ne modifie aucun statut de sprint ni ne lui invente un commit.

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
| Sprint 6 | 6-1 | Setup MCP Server + stdio transport | ✅ Rédigée | ✅ `31a117d` | ✅ 99 tests MCP, 100 % |
| Sprint 6 | 6-2 | Implémentation des 4 outils MCP | ✅ Rédigée | ✅ `31a117d` | ✅ outils en lecture seule |
| Sprint 6 | 6-3 | Tests compatibilité agents + documentation | ✅ Rédigée | ✅ `12e94cc` | ✅ 8 tests sur le binaire |
| Sprint 6 | Dossier parent | MCP Server | ✅ Rédigée | ✅ Livré le 23/10/2026 | ✅ C6.1–C6.x tracés |
| Sprint 7 | 7-1 | Installation Playwright + Configuration | ✅ Rédigée | ✅ `f012499` | ✅ 3 moteurs, `playwright.config.ts` |
| Sprint 7 | 7-2 | Playwright MCP + Navigation basique | ✅ Rédigée | ✅ `d104c57` | ✅ 84 tests Navigator |
| Sprint 7 | 7-3 | Accessibility Tree + Tests + Documentation | ✅ Rédigée | ✅ `d104c57` | ✅ 45 tests accessibilité, 12 e2e |
| Sprint 7 | Dossier parent | Playwright Setup (Semaine 13-14) | ✅ Rédigée | ✅ Validé le 23/10/2026 | ✅ e2e 12/12 sur le poste |
| Sprint 8 | 8-1 | Types + Inspection L1 (Semaine 15) | ✅ Rédigée | ✅ `58d333e` | ✅ 19 tests |
| Sprint 8 | 8-2 | Lighthouse + Inspection L2 (Semaine 15-16) | ✅ Rédigée | ✅ `58d333e` | ✅ 41 tests |
| Sprint 8 | 8-3 | axe-core + Inspection L3 + Tests + Documentation (Semaine 16) | ✅ Rédigée | ✅ `58d333e` | ✅ 62 tests, couverture 98,9 % |
| Sprint 8 | Dossier parent | 4 Niveaux d'Inspection (Semaine 15-16) | ✅ Rédigée | ✅ Livré le 23/10/2026 | ✅ C8.1–C8.18 tracés |
| Sprint 9 | 9-1 | Analyse Performance + Accessibilité (Semaine 17) | ✅ Rédigée | ✅ `9468dac` | ✅ 15 tests |
| Sprint 9 | 9-2 | Analyse SEO + UX + Contenu (Semaine 17-18) | ✅ Rédigée | ✅ `a94760a` | ✅ 23 tests |
| Sprint 9 | 9-3 | Matrice Sévérité + Priorisation + Tests + Documentation (Semaine 18) | ✅ Rédigée | ✅ `5195efe` | ✅ 39 tests, couverture 97,9 % |
| Sprint 9 | Dossier parent | Analyse 5 Dimensions (Semaine 17-18) | ✅ Rédigée | ✅ Livré le 24/10/2026 | ✅ C9.1–C9.17 tracés |
| Sprint 10 | 10-1 | Schema + Repository (Semaine 19) | ✅ Rédigée | ✅ `9ee57e6` | ✅ 30 tests |
| Sprint 10 | 10-2 | Indexation + Recherche (Semaine 19) | ✅ Rédigée | ✅ `a32b971` | ✅ 33 tests |
| Sprint 10 | 10-3 | Statistiques + Tests + Documentation (Semaine 20) | ✅ Rédigée | ✅ `d4940a9` | ✅ 38 tests, couverture 95,9 % |
| Sprint 10 | Dossier parent | Stockage + Indexation MVP-2 (Semaine 19-20) | ✅ Rédigée | ✅ Livré le 24/10/2026 | ✅ C10.1–C10.18 tracés |
| Sprint 11 | 11-1 | Rapports Markdown + PDF (Semaine 21, Jours 1-4) | ✅ Rédigée | ✅ `d741c32` | ✅ 17 tests (4 PDF skipIf hors CI) |
| Sprint 11 | 11-2 | Comparaison d'audits (Semaine 21, Jours 5-7) | ✅ Rédigée | ✅ `56bfbdd` | ✅ 17 tests |
| Sprint 11 | 11-3 | CLI + MCP + Tests + Documentation (Semaine 22, Jours 8-10) | ✅ Rédigée | ✅ `1acf0ac` | ✅ 27 tests nouveaux, verify 1208 ✅, couverture 95,95 % |
| Sprint 11 | Dossier parent | Rapport Inspection MVP-2 (Semaine 21-22) | ✅ Rédigée | ✅ Livré le 24/10/2026 | ✅ C11.1–C11.18 tracés |
| Sprint 12 | 12-1 | Tests E2E (Semaine 23, Jours 1-4) | ✅ Rédigée | ✅ Livré le 25/10/2026 | ✅ 5 flux E2E, 16 tests |
| Sprint 12 | 12-2 | Documentation (Semaine 23, Jours 5-7) | ✅ Rédigée | ✅ Livré le 25/10/2026 | ✅ 5 guides (USER, DEV, API, TROUBLE, CONTRIB) |
| Sprint 12 | 12-3 | Validation MVP-2 + Préparation MVP-3 (Semaine 24, Jours 8-10) | ✅ Rédigée | ✅ Livré le 25/10/2026 | ✅ 88/88 critères, MVP2_VALIDATION.md |
| Sprint 12 | Dossier parent | Tests + Documentation MVP-2 | ✅ Rédigée | ✅ Validé le 25/10/2026 | ✅ 88/88 critères, couverture 97,06 % |
| Sprint 13 | 13-1 | Migration 003 + ProjectRepository + ProjectManager (Semaine 25, Jours 1-3) | ✅ Rédigée | ✅ Livré le 25/10/2026 | ✅ CI `40201804122` |
| Sprint 13 | 13-2 | CLI `ekts project` + filtre `--project` (Semaine 25-26, Jours 4-6) | ✅ Rédigée | ✅ Livré le 25/10/2026 | ✅ CI `40208441240` |
| Sprint 13 | 13-3 | MCP projets + tests + documentation (Semaine 26, Jours 7-10) | ✅ Rédigée | ✅ Validé le 25/10/2026 | ✅ `SPRINT-13-RESULTAT.md`, 13 écarts P3 |
| Sprint 13 | Dossier parent | Gestion Multi-Projets (MVP-3, ADR-031) | ✅ Rédigée le 25/10/2026 | ✅ Validé le 25/10/2026 | ✅ fusionné sur develop (`ede70fc`) |
| Sprint 14 | 14-1 | TimelineAnalyzer + TrendDetector (Semaine 27, Jours 1-3) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 20 tests, cov 98,14 % |
| Sprint 14 | 14-2 | AlertManager + ChartGenerator (Semaine 27, Jours 4-6) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 36 tests timeline, migration 004 |
| Sprint 14 | 14-3 | CLI `ekts timeline` + MCP `get_timeline` + Tests + Documentation (Semaine 28, Jours 7-9) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 17 CLI + 7 MCP + 3 intégration, guide TIMELINE.md |
| Sprint 14 | Dossier parent | Suivi Temporel (MVP-3, ADR-031, ADR-032) | ✅ Rédigée le 25/10/2026 | ✅ Validé le 25/10/2026 | ✅ verify 0 (1 342 tests), couverture 96,83 % |
| Sprint 15 | 15-1 | Types + Migration + BestPracticeRepository + BestPracticeSearch (Semaine 29, Jours 1-3) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ CI `40232463236` |
| Sprint 15 | 15-2 | BestPracticeExtractor + BestPracticeService + associations (Semaine 29, Jours 4-6) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 66 tests module, verify 0 |
| Sprint 15 | 15-3 | CLI `ekts bestpractice` + MCP `search/add_best_practice` + Tests + Documentation (Semaine 30, Jours 7-9) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ guide BEST_PRACTICES.md, catalogue 14 outils |
| Sprint 15 | Dossier parent | Capitalisation Connaissances (MVP-3, ADR-033 à ADR-035) | ✅ Rédigée le 25/10/2026 | ✅ Validé le 25/10/2026 | ✅ `SPRINT-15-RESULTAT.md` (12 écarts P3) |
| Sprint 16 | 16-1 | Types + Migration + RecommendationRules + Repository + Engine (Semaine 31, Jours 1-3) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 47 tests, migration 006 (schéma v6) |
| Sprint 16 | 16-2 | RecommendationContext + Scoring contextuel + Intégration rapports Markdown/PDF (Semaine 31, Jours 4-6) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 20 tests, sections C16.6/C16.7 |
| Sprint 16 | 16-3 | CLI `ekts recommend` + MCP `get_recommendations` + Tests intégration + Documentation (Semaine 32, Jours 7-9) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ guide RECOMMENDATIONS.md, catalogue 15 outils |
| Sprint 16 | Dossier parent | Recommandations Contextuelles (MVP-3, ADR-036 à ADR-038) | ✅ Rédigée le 25/10/2026 | ✅ Validé le 25/10/2026 | ✅ `SPRINT-16-RESULTAT.md` (écarts P3) |
| Sprint 17 | 17-1 | Types + Migration + TemplateRepository + TemplateService (Semaine 33, Jours 1-3) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 33 tests, migration 007 (schéma v7) |
| Sprint 17 | 17-2 | 10 templates prédéfinis + TemplateApplier + seed idempotent (Semaine 33, Jours 4-6) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ 60 tests module, migration 008 (schéma v8) |
| Sprint 17 | 17-3 | CLI `ekts template` + MCP `list/apply_template` + docs (Semaine 34, Jours 7-9) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 25/10/2026 | ✅ guide TEMPLATES.md, catalogue 17 outils |
| Sprint 17 | Dossier parent | Templates Projets (MVP-3, ADR-039 à ADR-041) | ✅ Rédigée le 25/10/2026 | ✅ Validé le 25/10/2026 | ✅ `SPRINT-17-RESULTAT.md` (écarts P3) |
| Sprint 17 | 17-1 | Types + Migration + TemplateRepository + TemplateService (Semaine 33, Jours 1-3) | ✅ Rédigée le 25/10/2026 | ⏳ Non commencé | — |
| Sprint 17 | 17-2 | 10 templates prédéfinis + TemplateApplier + Personnalisation (Semaine 33, Jours 4-6) | ✅ Rédigée le 25/10/2026 | ⏳ Non commencé | — |
| Sprint 17 | 17-3 | CLI `ekts template` (7 cmd) + MCP (2 outils) + Export/Import + Tests + Documentation (Semaine 34, Jours 7-9) | ✅ Rédigée le 25/10/2026 | ⏳ Non commencé | — |
| Sprint 17 | Dossier parent | Templates Projets (MVP-3, ADR-039 à ADR-041) | ✅ Rédigée le 25/10/2026 | ⏳ Non commencé | — |
| Sprint 18 | 18-1 | Tests E2E MVP-3 (6 flux, 93 tests, CI) (Semaine 35, Jours 1-4) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 26/10/2026 | ✅ 6 fichiers, 26 tests, 29,8 s ; script `test:e2e:mvp3` + job CI (ADR-042) |
| Sprint 18 | 18-2 | Documentation MVP-3 (Guide utilisateur + Architecture + Extension) (Semaine 35, Jours 5-7) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 26/10/2026 | ✅ 3 guides `docs/MVP3_*.md` (ADR-043) + API_REFERENCE +6 outils MCP |
| Sprint 18 | 18-3 | Validation critères + README/CHANGELOG + Préparation MVP-4 (Semaine 36, Jours 8-10) | ✅ Rédigée le 25/10/2026 | ✅ Livré le 26/10/2026 | ✅ `MVP3_VALIDATION.md` (97/97), CHANGELOG 0.2.0, MVP4 (ADR-044) |
| Sprint 18 | Dossier parent | Tests + Documentation MVP-3 (ADR-042 à ADR-044) | ✅ Rédigée le 25/10/2026 | ✅ Validé le 26/10/2026 | ✅ `SPRINT-18-RESULTAT.md` (clôture MVP-3, checklist 10/10) |
| Sprint 19 | 19-1 | Priorité canonique et comptage (C-W01, C-W02, C-W04) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 | ✅ `ad5cd35` + `693fced`, `SPRINT-19-01-RESULTAT.md` |
| Sprint 19 | 19-2 | Cohérence stockage et rendus (C-W03, C-W12) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 | ✅ `696e165`, `SPRINT-19-02-RESULTAT.md` |
| Sprint 19 | 19-3 | Mesures absentes et score global (C-W05, C-W06, C-W07) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 | ✅ `b48c175` + `2e24cb5`, `SPRINT-19-03-RESULTAT.md` |
| Sprint 19 | Dossier parent | Fiabilité des priorités et intégrité des scores web | ✅ Rédigée le 30/10/2026 | ✅ Terminé le 30/10/2026 — bilan soumis | ✅ `SPRINT-19-RESULTAT.md` (checklist : 5 ✅, 2 partielles déclarées, 1 en attente d'accord) |
| Sprint 20 | 20-1 | Identité des métriques et interprétation (C-W08, C-W10) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 — C-W08 ✅, C-W10 **validé « préparé » le 30/10** | ✅ `SPRINT-20-01-RESULTAT.md`, commit `ff31dc3` |
| Sprint 20 | 20-2 | Preuves minimales et reprise partielle (C-W09, C-W11, C-W12) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 | ✅ `SPRINT-20-02-RESULTAT.md`, commit `c850ff8` |
| Sprint 20 | 20-3 | Politique de cible et rendu sûr (C-W13, C-W14) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 | ✅ `SPRINT-20-03-RESULTAT.md`, commit `e2ee455` |
| Sprint 21 | 21-1 | Inventaire et exposition du profil (C-P01, C-P04) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 | ✅ `SPRINT-21-01-RESULTAT.md`, commit `3370912` |
| Sprint 21 | 21-2 | Contrôle direct des noms et arguments (C-P02, C-P03, C-P08) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 — écart E21-1 déclaré (code protocole) | ✅ `SPRINT-21-02-RESULTAT.md`, commit `28df509` |
| Sprint 21 | 21-3 | Effets, isolation et attaque contrôlée (C-P05, C-P06, C-P07, C-O01) | ✅ Rédigée le 30/10/2026 | ⚠️ Livré le 30/10/2026 — C-P05 ✅, C-O01 partiel (applicatif), **C-P06/C-P07 bloqués** (report Sprint 24) | ✅ `SPRINT-21-03-RESULTAT.md`, commit `8fd6fce` |
| Sprint 21 | Dossier parent | Profil d'exposition MCP et échec fermé | ✅ Rédigée le 30/10/2026 | ⚠️ **Série non clôturable** — 6 critères satisfaits, 1 partiel, 2 bloqués ; G1 inaccessible | ✅ `SPRINT-21-RESULTAT.md` (checklist 5 ✅, 1 en attente d'accord) || Sprint 20 | Dossier parent | Fiabilité des mesures, preuves et cibles | ✅ Rédigée le 30/10/2026 | ✅ **Série close et validée le 30/10/2026** — 7/7 critères couverts | ✅ `SPRINT-20-RESULTAT.md` (checklist 7/7 ; C-W10 « préparé » validé, C-W14 accepté sur 2 formats sur 3, preuve PDF non bloquante) |
| Sprint 22 | 22-1 | Provenance et autorisation des ressources (C-R01, C-R02, C-R05) | ✅ Rédigée le 30/10/2026 | ✅ Livré le 30/10/2026 — contrat validé par le propriétaire (metadata, sans migration) | ✅ `SPRINT-22-01-RESULTAT.md`, commit `70c6971` |
| Sprint 22 | 22-2 | Identité et conservation des versions (C-R03, C-R04) | ✅ Rédigée le 30/10/2026 | ⚠️ Livré le 30/10/2026 — C-R03 ✅ (I+P) ; C-R04 volet I ✅ 2/2 états, volet H (revue humaine) à conduire | ✅ `SPRINT-22-02-RESULTAT.md`, commit `0bdc1ce` |
| Sprint 22 | 22-3 | FTS et statuts d'erreur (C-R06, C-R07, C-R08, C-O07) | ✅ Rédigée le 30/10/2026 | ⚠️ Livré le 30/10/2026 — C-R06 ✅ 7/7 + 1/1, C-R07 ✅ 5/5, C-R08 ✅ 2/2 ; C-O07 mesuré (p95 3,21 ms) mais **exploratoire** (machine de validation non choisie) | ✅ `SPRINT-22-03-RESULTAT.md`, commit `4d6e120` |
| Sprint 22 | Dossier parent | Corpus gouverné, provenance et recherche FTS | ✅ Rédigée le 30/10/2026 | ⚠️ **Série exécutée, non clôturable en l'état** — 8 critères mesurés, 4 points en attente de décision humaine (C-O07 machine, volets H, E22-9/E22-10, sort des commits locaux) | ✅ `SPRINT-22-RESULTAT.md` (checklist § 9) |

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
| 24/10/2026 | **Correctif `npm ci` demandé** : `lighthouse` **12.8.2 → 13.5.0**, plancher Node **22.12 → 22.19** (`engines`, `check:env`, README/AGENTS/guides) → `npm audit` = **0 vulnérabilité** (les 29 avis de la chaîne 12.8.2 supprimés) ; audit CI élargi à `npm run audit:ci` (complet, seuil `high`) ; API validée (`desktopConfig`, export par défaut, `maxWaitForLoad`, audits CWV/SEO identiques), connexion CDP franchie, `npm run verify` vert ; E8-2 résolu, R-8.10 clôturé, ADR-026 addendum 2 | `deps/lighthouse-13` |
| 24/10/2026 | Clôture Sprint 8 sur le poste : `npm run verify` vert (**989 cas, 988 verts, 1 saut conditionnel** — les 15 tests d'intégration navigateur s'exécutent désormais sur le poste, 3 moteurs), budgets tenus (L1 4,38 s / L2 14,30 s / L3 13,65 s), Lighthouse opérationnel (perf 100/100, SEO 80/100), axe-core 73/100 ; **triage d'audit par accessibilité** (29 avis, tous dans la chaîne Lighthouse de développement, `audit:prod` à 0) et **job CI « Vulnérabilités des dépendances de production »** ; délais explicites sur les tests chargeant le vrai module Lighthouse | `fix/audit-triage` |
| 23/10/2026 | Validation Sprint 8 sur le poste : **L1 4,38 s / L2 14,30 s / L3 13,65 s** (budgets 10/30/60 s tenus), Lighthouse opérationnel (perf 100/100, SEO 80/100, LCP 227 ms, INP 39 ms, CLS 0,004, TTFB 83 ms), axe-core 73/100, e2e 12/12 ; **retrait d'un test non hermétique** (attente d'un refus CDP mesurant la latence système : 1,5 s sous Linux, > 28 s sous Windows) remplacé par deux invariants hors I/O comparant le préréglage réel du paquet à notre repli | `fix/tests-hermetiques-lighthouse` |
| 23/10/2026 | Correctif poste Sprint 8 : **Lighthouse desktop** (le préréglage `desktopConfig` remplace `formFactor` seul — échec « Screen emulation mobile setting does not match formFactor »), **test stdio MCP** (délai 5 s → 20 s réglable par `EKTS_MCP_TIMEOUT_MS`, diagnostic du processus, fermeture bornée), scripts `npm run audit` / `audit:prod` ; écarts E8-13, risque R-8.10 | `fix/post-validation` |
| 30/10/2026 | **Alignement** : fusion de `origin/develop` (`398df3e`) dans la branche de session ; contenu identique à `develop`, aucun fichier de code modifié ; `npm run verify` = 0 | `5dd02a7` |
| 30/10/2026 | **Arbitrages du propriétaire** consignés (option A d'alignement, portée 19, trois formats pour C-W03, contrat `null` + raison pour C-W07, compteur `info` à `0` mesuré, `DEC-04` tranchée pour MVP-4, commits autorisés, push groupé après 19-03) | `f0a5464` |
| 30/10/2026 | **Sprint 19-01** : priorité canonique (C-W01) et cinquième compteur `info` (C-W02), ordre de recommandation nommé (C-W04) ; migration 009 additive et idempotente ; 13 tests U/I ; `verify` = 0, 1 669 tests, couverture 96,41 % | `ad5cd35` |
| 30/10/2026 | **Sprint 19-02** : trois formats réellement produits (Markdown, HTML, PDF) et décompte vérifié dans le texte extrait du PDF (C-W03) ; diagnostic en lecture seule des données historiques, anomalies signalées sans réécriture (C-W12) ; `pdfjs-dist` en devDependency ; `verify` = 0, 1 695 tests, couverture 96,65 % | `696e165` |
| 30/10/2026 | **Sprint 19-01 — niveau E2E** : parcours d'audit local synthétique via la CLI compilée ; discrimination prouvée sur `861a07d` (3 échecs sur les défauts visés) ; `verify` = 0, 132 fichiers verts | `693fced` |
| 30/10/2026 | **Sprint 19-03** : mesures indisponibles (C-W05), quatre états axe-core (C-W06), score global nullable avec raison (C-W07) ; migration 010 par `ALTER` sur `audit_metadata` **et** `audit_dimensions` (extension validée le 30/10) ; `verify` = 0, 1 732 tests, couverture 96,03 % | `b48c175` + `2e24cb5` |
| 30/10/2026 | **Sprint 20-01** : identité INP/FID/max-potential-fid/TBT avec unité et origine (`MetricReading`), suppression du repli et de l'alias (W04/C-W08) ; seuils par métrique (INP 200/500, TBT 200/600) ; limites d'interprétation axe/UX générées dans les rendus (C-W10 préparé, revue humaine due) ; `verify` = 0, 1 742 tests, couverture 95,99 % | `ff31dc3` |
| 30/10/2026 | **Sprint 20-02** : preuve des constats reliée à sa source (règle, sélecteurs, nœuds, version axe) et migration 011 additive sur `audit_findings` (C-W09) ; échec PDF après stockage désormais signalé avec les artefacts réellement créés, code de sortie non nul et reprise par `audit report <id>` sans nouvel audit (C-W11) ; C-W12 re-vérifié ; `verify` = 0, 1 753 tests, couverture 95,99 % | `c850ff8` |
| 30/10/2026 | **Sprint 20-03** : politique de cible appliquée à la CLI et au MCP — schéma, identifiants, hôte privé/loopback refusés par défaut, résolution DNS avant refus avec erreur dédiée, exception explicite (`--allow-private-hosts`, `allow_private_hosts`), verrou dans l'inspecteur et refus d'une redirection interne (C-W13) ; Markdown généré neutralisant `<`/`>` des textes issus du site (C-W14) ; `verify` = 0, 1 767 tests, couverture 96,01 % | `e2ee455` |
| 30/10/2026 | **Série 20 — bilan** : `SPRINT-20-RESULTAT.md` (3 sous-sprints, critères C-W08 à C-W14, les six décisions de C-W13 une par une, écarts E20-1 à E20-16, risques résiduels, commandes poste) ; 21 commits d'avance sur `develop`, 67 fichiers pour la série, +35 tests (1 732 → 1 767) ; accord du propriétaire attendu avant le sprint 21 | `0defccb` |
| 30/10/2026 | **Bilan 20 — mode opératoire** : `SPRINT-20-RESULTAT.md` § 8 complété (récupération, fusion fast-forward répétée sans effet de bord par `git merge-tree`, tests, vérifications) et **exécution réelle du programme** consignée (init schéma v11, add/list/search/status/audit list, quatre refus de politique de cible avec code 1) | `f3284fc` |
| 30/10/2026 | **Série 20 clôturée par décision du propriétaire** : C-W10 validé à l'état « préparé » ; C-W14 accepté sur 2 formats sur 3 (preuve PDF couplée à la suite, non bloquante) ; fusion `develop` réalisée par le propriétaire (`develop` = `854ecb4`, 3 commits de documentation restent à avancer en `--ff-only`) ; § 8.7 ajouté : bloc unique de commandes de récupération/fusion/tests/exécution à rejouer au poste ; sprint 21 **non engagé** (aucun feu vert) | `b5c8652` |
| 30/10/2026 | **Sprint 21-01** : profil MCP déclaratif (`src/mcp/profiles.ts`) appliqué à la découverte **et** à l'exécution ; profil `read` limité à `search_knowledge`, `get_resource`, `list_resources`, sélection par `EKTS_MCP_PROFILE` (absence = `full`, compatibilité historique décidée le 30/10) ; échec fermé sur profil inconnu, valeur vide/malformée et politique vide (`-32601`) ; `docs/MCP.md` corrigé (17 outils, 12 annotations) et `AGENTS.md` remis à jour ; `verify` = 0, 1 789 tests, couverture 96,05 % | `3370912` |
| 30/10/2026 | **Sprint 21-02** : sous profil `read`, `search_knowledge` exige `mode: "fts"` lu dans les arguments bruts (avant le défaut Zod `hybrid`) ; modes omis/`hybrid`/`vector` refusés en `-32602` avec `requiredMode`, 0 appel d'embeddings, 0 réseau ; C-P02 14/14 refusés avec arguments valides et état métier inchangé, C-P03 3/3 outils fonctionnels, C-P08 1/1 permis et 3/3 refusés ; profil complet non régressé ; `verify` = 0, 1 813 tests, couverture 96,04 % ; écart E21-1 mesuré (protocole = `-32602` du SDK) | `28df509` |
| 30/10/2026 | **Sprint 21-03** : effets au démarrage mesurés (11 migrations une fois, 10 templates, 9 fichiers confinés, 0 ligne métier modifiée par 3 appels permis + 15 refus, WAL replié à la fermeture, réouverture idempotente) ; C-O01 en preuve applicative avec test positif de blocage et canari ; **C-P06/C-P07 bloqués** (ni hôte isolé ni sandbox) et reportés au Sprint 24 par décision du 30/10 ; aucun code de production modifié, sensibilité des GREEN initiaux prouvée par mutation ; `verify` = 0, 1 823 tests | `8fd6fce` |
| 30/10/2026 | **Sprint 22-01** : provenance dans `metadata.provenance` (aucune migration) — source/version connues ou `null` explicite, trois axes de droits indépendants, sensibilité, empreinte SHA-256, revue ; admission ⇔ `authorized` + `read: granted`, exclusion sans suppression sinon ; interface `ekts add --provenance <fichier.json>` ; ressource historique lisible et non admise ; sauvegarde/restauration vérifiée ; `verify` = 0, 1 865 tests, couverture 95,93 % | `70c6971` |
| 30/10/2026 | **Sprint 22-02** : empreinte SHA-256 vérifiée sur les **octets UTF-8 exacts** (aucune normalisation CRLF/BOM), refus à l'ajout d'une empreinte qui ne décrit pas le contenu écrit, `update` refusant de conserver l'ancienne empreinte sur un nouveau texte (C-R04 : 2/2 états, même UUID avec la nouvelle empreinte accepté) ; manifeste 6/6 conforme et mapping ID↔UUID↔SHA-256 complet (C-R03) ; `ekts get` qualifie l'état `verified`/`unverifiable`/`absent` et nomme la version **non reconstructible** ; écart E22-8 déclaré (`git checkout` avait effacé du travail non commité, réappliqué et revérifié) ; `verify` = 0, 1 898 tests, couverture 95,87 % | `0bdc1ce` |
| 30/10/2026 | **Sprint 22-03** : `collectSearch` refuse une requête vide **avant** toute ouverture de base (code 4) — une entrée invalide n'est plus un succès « Aucun résultat » ; 8 requêtes figées du document 22 §3.1 en FTS limite 5 : **rappel@5 = 1 sur 7/7**, Q08 vide, unique extra Q06→R04 documenté et asserté ; **5/5 états d'échec distincts** (validation, ID absent, index inaccessible, fournisseur absent, zéro correspondance) et **2/2 événements** de repli explicite (erreur hybride puis FTS étiqueté), 0 repli caché ; latence stdio 20+100 appels, **p95 = 3,21 ms** (seuil 500 ms) consignée mais **exploratoire** (machine non choisie, E22-12) ; écarts E22-10 à E22-13 ; `verify` = 0, 1 918 tests, couverture 95,87 % | `4d6e120` |
| 31/10/2026 | **Déblocage S21 (C-P06/C-P07)** : cause identifiée (aucune preuve d'absence de sortie réseau, aucun banc d'essai) ; solution retenue après recherche : isolation par **network namespace** Linux réelle (`unshare -rn`, seule `lo` existe). 6 cas verts : DNS bloqué dans le bac à sable, 3 outils sous `read`, contraste 17 sous `full`, **14/14 refusés sans mutation**, V02 restituée comme donnée, canari aléatoire absent des réponses et des traces. `docs/ISOLATION.md` ; **C-P07 au sens strict de G1 reste bloqué** (exige un hôte agent réel) | `741664b` |
| 31/10/2026 | **Déblocage S22 (C-O07 + volets H)** : `npm run bench:latency` applique le protocole exact et consigne machine/OS/charge/runtime/commit ; deux configurations retenues — O7-A (Linux, référence, **p95 = 0,77 ms**) et O7-B (Windows 11 du propriétaire, protocole fourni) ; `docs/revue/REVUE-H-2026-10-31.md` fournit la feuille de revue des volets H de C-R01 (5 constats) et C-R04 (6 constats) | `0226436` + `39dbbfa` |
| 31/10/2026 | **Décisions instruites** : option E de lecture ciblée (**note 28**, verdict E recommandée, 9 contrôles de sécurité, LC-01→LC-10 proposés, placement S25) ; **mémoire de récupération** des 90 dépôts à ref figée avec protocole P0–P6 ; **révision MVP-4 instruite** — décision de **ne pas renuméroter** (S23/S24 inchangés, S25→S28 ajoutés, décision de valeur déplacée de S24 à S28) | `e450058` + `38aabb9` + _ce commit_ |
| 31/10/2026 | **S23-01 exécuté** : `dispatchTool` devient le point d'enregistrement unique ; cinq événements observables (FTS, lecture, zéro résultat, erreur, refus) avec session, outil/mode, statut et version, sur `stderr`, couche déclarée `server->client` ; qualification des citations en quatre verdicts par **empreintes de fenêtres de cinq mots** (aucun texte recopié) ; troncature déclarée ⇒ `indéterminée`. 28 cas ajoutés (22 U, 5 I, 1 binaire). `npm run verify` EXIT 0, 1 952 passed. Limites déclarées : couche limitée au serveur, journal en mémoire, citation < 5 mots indéterminée | [SPRINT-23-01-RESULTAT](sprints/SPRINT-23-01-RESULTAT.md) |
| 31/10/2026 | **S23-02 exécuté (partiel)** : caviardage des traces (valeurs sensibles d'environnement + formes `sk-`/`ghp_`/`xoxb-`/`AIza`/`Bearer`, marqueur **fixe** jamais une empreinte) appliqué au message, aux erreurs et aux données ; **0 canari** exposé sur trois points d'injection ; garde statique d'export (aucun `writeFile` dans `src/mcp`) ; modes **0700/0600** vérifiés sur POSIX. **Accès non autorisé non mesuré** (aucun second compte) et **C-O02/C-O03 bloqués** : Windows non mesuré, protocole `scripts/windows-check.ps1` fourni (12 étapes, verdicts PASS/FAIL/BLOCKED) | [SPRINT-23-02-RESULTAT](sprints/SPRINT-23-02-RESULTAT.md) |
| 31/10/2026 | **S23-03 exécuté** : sauvegarde `VACUUM INTO` + manifeste (`nonAtomic` déclaré, empreintes, `user_version`, compteurs), vérification et restauration gardée (refus d'écrasement, refus si incohérence) ; procédure `docs/BACKUP.md` et `npm run db:backup|db:verify|db:restore` ; inventaire des 17 outils confronté à `tools/list` et `readOnlyHint` ; 8 cas ajoutés. Interruption mesurée : après `SIGKILL`, **1 ressource / 0 entrée FTS**, cohérence `false`, restauration refusée — cause non établie, écart **P3-23-01**. `npm run verify` EXIT 0, 1 975 passed. Commit : **`fc97b64`** | [SPRINT-23-03-RESULTAT](sprints/SPRINT-23-03-RESULTAT.md) |
| 31/10/2026 | **Incident E22-15 et récupération** : clone de travail recréé, branche locale reposée sur `main` (`c46cc18`) ; les 4 commits non poussés de 22-02/22-03 ont été détruits avec l'ancien `.git`. Arbre de travail intact : contenu validé (`typecheck` 0, `build` 0, 42/42 tests ciblés) puis **re-commité à l'identique** en `0bdc1ce` (22-02) et `4d6e120` (22-03), **poussés**. Hashs périmés corrigés dans les rapports et le registre | `0bdc1ce` + `4d6e120` |
| 31/10/2026 | **Conventions permanentes** : `docs/blueprint/Docs/07-CONVENTIONS-PERMANENTES.md` (commit + push couplés, rapports A–M, protocole de vérification utilisateur, stratégie d'intégration open source, direction MVP-4, gouvernance) ; `AGENTS.md` v1.1 (règles 6 et 7, définition de « terminé » durcie) ; la clause « aucun push sans autorisation distincte » des sprints 20–22 est **remplacée** | `d0cd30e` |
| 31/10/2026 | **Révision MVP-4 proposée** : `REVISION-MVP4-2026-10-31.md` — diagnostic D1–D5 (aucun chemin d'ingestion, corpus synthétique, recherche open source hors plan, validation prématurée, identités TierFlow/Quen/Paperclip/Voice Studio non confirmées), définition explicite de la cible, sprints 23 conservé / 24 ingestion / 25 OpenCode / 26 Hermes / 27 validation décalée, critères proposés C-R09–C-R11 et C-T07–C-T08, 5 décisions demandées ; `docs/ROADMAP.md` : bandeau d'arbitrage, renvoi § 2.1, **contradiction E22-1 traitée** (ligne historique annotée) | `2c6efd8` |

| 30/10/2026 | **Série 22 — bilan** : `SPRINT-22-RESULTAT.md` (3 sous-sprints, critères C-R01 à C-R08 et C-O07, écarts E22-1 à E22-14, risques résiduels, commandes de reproduction) ; **23 fichiers, +3 665 / −3**, 6 commits, **+53 tests** (1 865 → 1 918), aucune migration ; couverture 95,87 % ; **4 points en attente de décision du propriétaire** (machine de validation C-O07, volets H de C-R01/C-R04, arbitrage E22-9/E22-10, sort des commits locaux) ; sprint 23 **non engagé**, accord attendu | _hash du commit de bilan_ |
| 30/10/2026 | **Série 19 — bilan** : `SPRINT-19-RESULTAT.md` (3 sous-sprints, critères C-W01 à C-W07 et C-W12, écarts E19-1 à E19-5, commandes de fusion/test/exécution) ; 12 commits d'avance sur `develop`, 102 fichiers ; accord du propriétaire attendu avant le sprint 20 | `8db411d` |
| 23/10/2026 | Sprint 8 : inspecteur multi-niveaux `src/browser/inspection/` (L1 capture + arbre ARIA + photographie du DOM, L2 + Lighthouse, L3 + axe-core + UX + contenu), `src/browser/lighthouse.ts` (port CDP réservé, conversion du rapport), `src/browser/axe.ts` (WCAG 2.2 AA, score pondéré `100 − Σ poids × nœuds`), `InspectionError` (`INSPECTION_FAILED`) ; 122 tests unitaires sans navigateur, `src/browser/` à 99,2 %, suite à 989 cas ; ADR-026 (Lighthouse 12.8.2), ADR-027 (axe-core), risques R-8.1 à R-8.9, `docs/INSPECTOR.md` (écarts E8-1 à E8-12) | `sprint-8` |
| 23/10/2026 | Sprint 6 : serveur MCP `src/mcp/` (SDK 1.32.1, transport stdio), 4 outils en lecture seule (`search_knowledge`, `get_resource`, `list_resources`, `validate_resource`), journal JSON sur stderr, codes `-32000`/`-32001`/`-32602`/`-32603` ; 99 tests MCP dont 8 sur le binaire, `src/mcp/**` à 100 %, suite à 649 tests ; ADR-022, risques R-6.1 à R-6.7, `docs/MCP.md`, `docs/MCP-EXAMPLES.md`, `.mcp.json`, `MCP-COMPATIBILITY.md` | `sprint-6` |
| 25/10/2026 | Sprint 17 : module templates `src/templates/` (types, repository CRUD + protection builtin ADR-040, service orchestrateur), migration 007 `project_templates` (v7) | `797c110` |
| 25/10/2026 | Sprint 17 : 10 templates prédéfinis + leurs 37 règles (seed idempotent au démarrage), `TemplateApplier` (merge profond ADR-041, `project_config`), migration 008 (v8) | `ddaedad` |
| 25/10/2026 | Sprint 17 : CLI `ekts template` (7 sous-commandes, alias `tpl`), MCP `list_templates`/`apply_template` (catalogue 17 outils), guide `TEMPLATES.md`, CLI.md §16, MCP.md §20 | `sprint-17` |
| 26/10/2026 | Sprint 18-01 : tests E2E MVP-3 (`tests/e2e/mvp3/` : helper execFile + 6 fichiers, 26 tests, 29,8 s < 120 s), script `test:e2e:mvp3`, job CI `e2e-mvp3` (timeout 5 min, ADR-042) ; `SPRINT-18-01-RESULTAT.md` (9 écarts P3, dont section Recommandations non injectée en produit) | `sprint-18-01` |
| 26/10/2026 | Sprint 18-02 : documentation MVP-3 — `docs/MVP3_GUIDE.md`, `MVP3_ARCHITECTURE.md`, `MVP3_EXTENSION.md` (synthèse ADR-043, liens vers les 5 guides S13-S17) ; `API_REFERENCE.md` : +6 outils MCP (catalogue 17) ; `SPRINT-18-02-RESULTAT.md` (7 écarts P3) | `sprint-18-02` |
| 26/10/2026 | Sprint 18-03 : validation `docs/MVP3_VALIDATION.md` (97/97 lignes-critères, comptage réel ≠ 87 du spec), README section MVP-3, CHANGELOG **0.2.0**, ROADMAP MVP-3 ✅, API_REFERENCE §CLI ×4, `MVP4_PREPARATION.md` (ADR-044), `SPRINT-18-RESULTAT.md` + checklist 10/10 ; **MVP-3 clôturé** | `sprint-18-03` |
---

## 5. Prochaines étapes

> **Note du 30/10/2026 — série 19 terminée :** 19-01, 19-02 et 19-03 sont livrés
> et leurs bilans sont écrits. Le bilan de série est soumis au propriétaire ; il
> n'autorise ni le sprint 20, ni une fusion, ni un pilote. Les points ci-dessous
> restent l'instantané du 26/10 pour l'historique.
>
> **Note de révision documentaire — 30/10/2026 :** la liste ci-dessous est l'instantané du 26/10. Sa demande de décision avant toute spécification au point 2 est désormais historiquement dépassée : le propriétaire a validé vision, architecture, spécification et seuils, et autorisé la révision de la [roadmap](../../../ROADMAP.md). La collaboration est reportée ; aucun feu vert pour développement, pilote, publication ou nouveau sprint n'en découle. Les vérifications manuelles du point 3 restent des actions historiques à réévaluer selon leur objet ; elles ne sont pas réputées exécutées ici.

1. **Sprints 1 à 18 terminés** — **MVP-3 validé (97/97)** le 26/10/2026 ;
   1 656 tests, couverture 96,40 %, E2E MVP-3 29,8 s, catalogues CLI 15
   commandes / MCP 17 outils.
2. **MVP-4** — 4 options documentées (`docs/MVP4_PREPARATION.md`,
   ADR-044) : décision et **feu vert explicite** de l'utilisateur requis
   avant toute spec ; la branche `develop` reste la cible d'intégration.
3. Validation manuelle restante (poste Windows connecté) : `npm run test:e2e`
   (12 tests, 3 moteurs), `npm test` pour activer les 15 tests d'intégration, puis
   une inspection réelle L1/L2/L3 sur une page publique pour confirmer les budgets.
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
