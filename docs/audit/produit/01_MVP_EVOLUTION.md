# 01 — Évolution des MVP (MVP-1 → MVP-2 → MVP-3)

> **Méthode** : reconstitution à partir du `docs/CHANGELOG.md` (source
> versionnée, EV-10), des specs et résultats de sprints
> (`docs/blueprint/Docs/roadmap/sprints/SPRINT-01…18*.md`, EV-30), des
> validations (`MVP2_VALIDATION.md`, `MVP3_VALIDATION.md`, EV-11/12) et du
> registre d'avancement (EV-23). Les trois MVP sont **cumulatives** sur un
> même produit unique (pas trois produits autonomes) — confirmé par
> `package.json` (`ekts` 0.2.0, un seul `bin`) et le CHANGELOG à trois
> sections sur un même paquet.
> **Niveau de fiabilité** : MVP-2 et MVP-3 = élevé (validations datées,
> critères et preuves). MVP-1 = bon (CHANGELOG daté + specs sprints 1–6
> complètes dans le blueprint), **mais aucune fiche de validation dédiée de
> type « 60/60 critères » n'a été retrouvée pour MVP-1** — reconstitution
> signalée comme partielle sur ce point.

---

## 1. MVP-1 — Connaissances, recherche, CLI et MCP (0.0.1, livré le 23/10/2026)

| Axe | Contenu |
|---|---|
| **Objectif initial** | Poser le socle « base de connaissances interrogeable », du code TypeScript de qualité, et les deux surfaces d'accès (CLI, MCP) |
| **Problème visé** | Ne plus stocker les notes/fichiers en vrac : les valider, les retrouver par recherche |
| **Fonctionnalités prévues (specs S1–S6)** | S1 socle toolchain · S2 SQLite+migrations · S3 KnowledgeManager · S4/4.5 recherche hybride+catalogue fournisseurs · S5 CLI · S6 MCP |
| **Fonctionnalités livrées** | Identiques (CHANGELOG 0.0.1) : TypeScript strict ESM, ESLint flat, Vitest seuil 80 % ; SQLite WAL + migrations ; gestionnaire de ressources validées (Zod) ; recherche **FTS5 BM25 + vecteurs + RRF k=60** ; catalogue **14+ fournisseurs** (OpenAI, Gemini, OpenRouter, Novita, Sofya, MiniMax…) avec rotation de clés et politiques qualité/gratuit/coût ; CLI **7 commandes** (`add search get list delete init status`) ; serveur MCP stdio **4 outils** (`search_knowledge`, `get_resource`, `list_resources`, `validate_resource`) + `.mcp.json` ; Gitleaks + CI |
| **Validé** | Livraison + CI à l'époque ; **pas de fiche de validation MVP-1 avec critères chiffrés** dans le dépôt (lacune d'historique — ne pas confondre « livré » et « validé à N critères ») |
| **Héritage** | N/A (première version) |
| **Ajouts** | Tout le socle ci-dessus |
| **Améliorations** | — |
| **Abandonné/reporté** | Rien de spécifié n'est marqué abandonné dans le CHANGELOG 0.0.1 |
| **Limites fin de version** | Pas d'audit web, pas de rapports, pas de projet, recherche vectorielle conditionnée aux clés API, distribution npm déjà absente |
| **Dépendances d'usage** | Node ≥ 22.19, clés API pour le mode vectoriel (FTS sans clé) |
| **Maturité** | Socle fonctionnel (premier état fonctionnel du dépôt — libellé CHANGELOG) |

## 2. MVP-2 — Inspection, analyse et rapports (0.1.0, validée 25/10/2026 — 88/88)

| Axe | Contenu |
|---|---|
| **Objectif** | Transformer la base de notes en **outil de contrôle qualité web** : inspecter, analyser, stocker des audits, reporter |
| **Problème visé** | Avoir un audit de page reproductible en local, sans SaaS, avec comparaison dans le temps |
| **Prévues (S7–S12)** | Socle navigateur, inspecteur 3 niveaux, analyse 5 dimensions, stockage audits, rapports, E2E + docs |
| **Livrées** | Playwright (ouverture, screenshot, PDF, accessibility tree, bac à sable Windows) · inspection **L1/L2/L3** (L4 **hors périmètre par décision explicite**) avec `warnings[]` et budgets · analyse **5 dimensions** (poids 25/25/20/15/15, matrice sévérité × effort × impact, `recommendation` obligatoire) · stockage SQLite audits + FTS5 + vecteurs (**0,89 ms/audit**, recherche 2,7 ms/10 k) · rapports **Markdown + PDF** (Puppeteer 25, 2–4 s) + **comparaison** (deltas, recommandations) · CLI → **10 commandes** avec `audit list|show|report|compare`, codes 0/1/2/3/4, `--json` global · MCP → **7 outils** (+`inspect_site`, `audit_history`, `audit_report`) · 5 fichiers E2E · docs USER/DEVELOPER/API/TROUBLESHOOTING |
| **Validé** | **88/88 critères** le 25/10 (`MVP2_VALIDATION.md`) : méthode = relecture de chaque preuve (fichier, test, mesure réelle) ; écarts des modèles de spec corrigés (L4, « 7 commandes », couverture…) — validation **par lecture de preuves**, pas seulement exécution |
| **Héritage MVP-1** | Toolchain, SQLite, knowledge, recherche, fournisseurs, CLI 7, MCP 4, CI |
| **Ajouts** | Navigateur, inspection, analyse, audits, rapports, comparaison, E2E |
| **Améliorations** | CLI 7→10 · MCP 4→7 · recherche réutilisée pour les audits (indexation dédiée) |
| **Reporté** | **L4 crawling** (décision explicite) · collaboration/comptes · intégrations tierces · IA générative de rapports · marketplace (portés « MVP-4 à 7 ») |
| **Limites fin** | Mono-URL (pas de site entier), pas de multi-projet, pas de suivi temporel, PDF = Chrome à installer |
| **Dépendances** | Playwright (navigateurs optionnels selon parcours), Chrome pour Puppeteer, clés pour embeddings |
| **Maturité** | MVP validée documentairement (88/88) |

## 3. MVP-3 — Capitalisation de projets (0.2.0, validée 26/10/2026 — 97/97)

| Axe | Contenu |
|---|---|
| **Objectif** | Faire passer EKTS d'un outil d'audit **unitaire** à un système de **capitalisation entre projets** (ADR-031) |
| **Problème visé** | Ce qu'on apprend d'un projet doit nourrir le suivant (bonnes pratiques, règles, templates, historique) |
| **Prévues (S13–S18)** | Multi-projets, suivi temporel, bonnes pratiques, recommandations, templates, clôture doc/validation |
| **Livrées** | **S13** projets (module, migration 003, CLI `project`, 4 outils MCP, filtre `-p`) · **S14** timeline (analyse, tendances, alertes, graphiques SVG/PNG, migration 004, `get_timeline`) · **S15** bonnes pratiques (extractor de constats résolus, recherche hybride maison, migration 005, `bestpractice`, 2 outils MCP) · **S16** recommandations (règles 0,8 + scoring statistique, migration 006, `recommend`, `get_recommendations`, rapports) · **S17** templates (10 builtins, `template`, apply/export/import, migration 007→008) · **S18** documentation (guides MVP-3, API_REFERENCE 17 outils, CHANGELOG 0.2.0, README/ROADMAP) |
| **Validé** | **97/97 lignes-critères** (91 ✅ + 3 ✅ avec réserve + 3 ⚠️ P3 tranchés, 0 rejet) le 26/10, **sur sorties réelles** (tests maison, CLI compilée, lcov) — note de comptage : la spec annonçait « 87 », le décompte réel des specs maison était 97 (écart documenté) |
| **Héritage** | Intégralité MVP-1 + MVP-2 (10 CLI, 7 MCP devenus la base) |
| **Ajouts** | 5 modules, 5 commandes racine (→15), 10 outils MCP (→17), migrations 003→008 (v8), 5 guides |
| **Améliorations** | Recherche réutilisée (bp, recommandations) ; audits rattachés à des projets ; comparaison enrichie par la timeline |
| **Abandonné** | Aucun ; **3 réserves P3** ouvertes (C16.6/C16.7 réserves mineures, C17.12 unicité — état dans `MVP3_VALIDATION.md`) |
| **Limites fin (= état actuel)** | Identiques aux limites globales de `03` : npm absent, MCP navigateur non câblé, doc d'entrée périmée, L4 absent, pas d'hôte MCP réel instrumenté |
| **Dépendances** | idem MVP-2 |
| **Maturité** | MVP validée (97/97) + CI 8/8 dont job E2E dédié |

---

## 4. Matrice comparative transversale

| Dimension | MVP-1 (0.0.1) | MVP-2 (0.1.0) | MVP-3 (0.2.0) |
|---|---|---|---|
| **Objectif produit** | Base de connaissances interrogeable | Contrôle qualité web local + rapports | Capitalisation multi-projets |
| **Capacités principales** | Ressources, recherche hybride, fournisseurs | Inspection L1–L3, analyse 5D, audits, MD/PDF, comparaison | Projets, timeline, bonnes pratiques, recommandations, templates |
| **Nouvelles fonctionnalités** | Socle complet (tout est neuf) | 6 briques majeures (navigateur→E2E) | 5 briques (S13→S17) |
| **Capacités améliorées** | — | CLI 7→10, MCP 4→7, indexation audits | CLI 10→15, MCP 7→17, migrations 002→008 |
| **Interfaces utilisables** | CLI 7 cmd + MCP 4 outils | CLI 10 + MCP 7 + rapports fichiers | **CLI 15 + MCP 17** + `.mcp.json` |
| **Intégrations** | Fournisseurs IA (sortants HTTP), `.mcp.json` | + Playwright/Lighthouse/axe/Puppeteer | idem (aucune intégration tierce type Slack/Jira — reporté) |
| **Scénarios validés** | Non documenté (voir réserve) | 88/88 critères (relecture preuves) | 97/97 critères (sorties réelles) + E2E 26/26 |
| **Limitations restantes** | Tout ce qui est audit/rapport/projet | L4, multi-projet, suivi temporel, npm | **celles de l'état actuel** (`03`) |
| **Valeur utilisateur** | « Retrouver mes notes » | « Auditer et corriger un site » | « Capitaliser d'un projet à l'autre » |

---

## 5. Éléments d'historique incertains (signalés, pas comblés)

| Réserve | Nature | Impact sur l'audit |
|---|---|---|
| **H-01** | Aucune fiche « validation MVP-1 » (nombre de critères, date, méthode) dans le dépôt | On ne peut pas dire que MVP-1 fut « validée à N critères » — seulement « livrée » (EV-10) |
| **H-02** | Le README (EV-17) affiche encore le statut MVP-2 / 0.1.0 | Désormais classé en limitation documentaire (LIM-07), pas en histoire |
| **H-03** | « 2 semaines » annoncées par sprint dans la ROADMAP vs dates git réelles (sprints 13–18 tous sur 25–26/10) | Le planning initial n'a pas été suivi en durée réelle ; sans impact sur les livrables |
| **H-04** | 3 réserves P3 de la validation MVP-3 (C16.6, C16.7, C17.12) | Ouvertes et documentées, non clôturées — à suivre dans `06` |
| **H-05** | Le blueprint (43 k lignes, 48 dossiers de sprint) décrit un produit antérieur au code (audit de démarrage EV-a : « documentation seule » au 21/10) | Les specs ne sont **jamais** des preuves de fonctionnement — règle appliquée dans tout l'audit |
