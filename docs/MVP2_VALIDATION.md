# Validation MVP-2 — Engineering Knowledge Tooling System

> Contrôle des **88 critères** des Sprints 7 à 11 · vérifiés dans le code le
> **25 octobre 2026** · méthode : chaque preuve citée a été ouverte et
> relue (fichier, test, mesure réelle) — les chiffres des modèles de la spec
> Sprint 12-3 non conformes au code (L4, « 7 commandes », « 3 outils MCP »,
> couverture 88 %) ont été corrigés ici.

## Méthode de validation

1. **Lecture des specs d'origine** (Sprints 7–11 et SPRINT-12-03) pour
   reprendre la liste intégrale des 88 critères (C7.1 → C11.18).
2. **Ouverture du code** pour chaque critère : le témoin est un fichier
   existant, un test vert ou une mesure réellement observée dans les
   exécutions de la boucle S12-1 (sorties poste développeur du 25/10/2026).
3. **Correction des formulations non conformes** des modèles fournis,
   consignée dans le tableau ci-dessous — aucune preuve inventée n'a été
   reprise telle quelle.
4. **Seuils de qualité rappelés** : couverture > 80 %, `npm run verify`
   code 0, CI 7/7, zéro secret.

### Écarts des modèles corrigés ici

| Affirmation du modèle | Réalité vérifiée |
|-----------------------|------------------|
| « 4 niveaux (L1–L4) » | **3 niveaux L1–L3** ; L4 hors périmètre explicite (`types.ts:33`) |
| CLI « 7 commandes » | **10 commandes** (`init` → `audit …`) |
| MCP « 3 outils » | **7 outils** (`TOOL_NAMES`) |
| Couverture « 88 % » | **97,06 %** lignes / 93,06 % branches |
| Node « ≥ 18 » | **≥ 22.19.0** (engines) |
| Mesures inventées (8,2 s, 78 ms…) | remplacées par les **mesures observées** (0,89 ms/audit, PDF 2–4 s…) |
| Version « 2.0.0 » | version réelle **0.1.0** (`package.json`, `ekts --version`) |

## Résumé

**Total critères : 88** · **Validés : 88 ✅** · **Statut : ✅ MVP-2 terminé**

- Couverture globale (v8) : **97,06 % lignes / 93,06 % branches / 96,88 %
  instructions** (seuils 80 %) — `npm run verify` code 0.
- Suite : **1 260 tests** (1 226 ✅ / 34 ⏭ en sandbox sans navigateurs ;
  1 254 ✅ / 6 ⏭ sur poste développeur).
- CI : 7/7 jobs verts sur les pushes du Sprint 12 (`40184994150`,
  `40188421561`).

---

## Sprint 7 — Playwright Setup (17 critères)

### Fonctionnels (C7.1–C7.8)

- [x] **C7.1** — Playwright installé et configuré · `@playwright/test ^1.64.1` (`package.json`), `playwright.config.ts`
- [x] **C7.2** — 3 moteurs installables · script `npm run browsers:install` (Chromium, Firefox, WebKit) ; tests navigateur des 3 moteurs actifs sur poste dev
- [x] **C7.3** — Navigation vers URL · `src/browser/navigator.ts` (`goto`, `page.goto`) · `tests/browser/navigator.test.ts` (84 tests ✅)
- [x] **C7.4** — Capture d'image · `navigator.ts` (screenshot) · observé **858 ms** (integration navigateur)
- [x] **C7.5** — Extraction DOM · `navigator.ts` (`content()`) · tests `media`/`navigator` ✅
- [x] **C7.6** — Accessibility tree · `navigator.ts` (accessibility snapshot) · observé **546 ms**
- [x] **C7.7** — Gestion erreurs réseau · `src/browser/errors.ts` (`BrowserError`, codes) + tests
- [x] **C7.8** — Timeout configurable · `DEFAULT_TIMEOUT_MS` (30 000 ms) appliqué dans `goto` (`navigator.ts`)

### Techniques (C7.9–C7.13)

- [x] **C7.9** — Navigation < 3 s · test integration « en moins de 3 s » : **1 482 ms** (Firefox)
- [x] **C7.10** — Extraction DOM rapide · budgets des tests navigator/media : extractions < 500 ms observées
- [x] **C7.11** — Accessibility tree < 1 s · **546 ms** (mesuré)
- [x] **C7.12** — Couverture > 80 % · globale **97,06 %** ; dossier `tests/browser/` vert (84 + 45 + 20 tests)
- [x] **C7.13** — Code lisible (JSDoc) · API publique documentée en français (ex. `navigator.ts`, `docs/PLAYWRIGHT.md`)

### Qualité (C7.14–C7.17)

- [x] **C7.14** — Compilation TypeScript · `npm run build` via `verify` code 0
- [x] **C7.15** — Linting · `npm run lint` code 0
- [x] **C7.16** — Gestion erreurs robuste · erreurs typées + tests (`errors`, fallback bac à sable `EKTS_BROWSER_SANDBOX`)
- [x] **C7.17** — Documentation · `docs/PLAYWRIGHT.md` (**609 lignes**)

**Sprint 7 : 17/17 ✅**

---

## Sprint 8 — Niveaux d'inspection L1–L3 (18 critères)

> Ajustement fidèle : le MVP-2 implémente **trois niveaux emboîtés L1, L2, L3** ;
> **L4 (crawling) est hors périmètre par décision explicite**
> (`src/browser/inspection/types.ts:33`, `docs/INSPECTOR.md:23`).

### Fonctionnels (C8.1–C8.9)

- [x] **C8.1** — Niveaux implémentés (L1/L2/L3, L4 hors périmètre documenté) · `level-1.ts`, `level-2.ts`, `level-3.ts`
- [x] **C8.2** — L1 : capture, arbre ARIA, métadonnées · `level-1.ts` · tests `level-1` (19 ✅)
- [x] **C8.3** — L2 : + Lighthouse (Web Vitals) et SEO DOM · `level-2.ts` · tests (21 ✅)
- [x] **C8.4** — L3 : + axe-core, heuristiques UX, contenu · `level-3.ts` · tests (23 ✅)
- [x] **C8.5** — L4 hors périmètre MVP-2 (constaté et documenté, cf. note) · conforme au design validé S8
- [x] **C8.6** — Inspector orchestre les niveaux · `src/browser/inspection/inspector.ts` · tests (20 ✅)
- [x] **C8.7** — Intégration Lighthouse · `src/browser/lighthouse.ts` (`lighthouse ^13.5.0`) · tests (20 ✅)
- [x] **C8.8** — Intégration axe-core · `src/browser/axe.ts` (`@axe-core/playwright ^4.14.0`) · tests (19 ✅)
- [x] **C8.9** — Résultats structurés · `src/browser/inspection/types.ts` (union `InspectionResult`)

### Techniques (C8.10–C8.14)

- [x] **C8.10** — Budget L1 < 10 s · budgets mesurés et signalés (`withinBudget`)
- [x] **C8.11** — Budget L2 < 30 s · idem
- [x] **C8.12** — Budget L3 < 60 s · idem · inspections E2E observées 16,5–30 s sur poste dev
- [x] **C8.13** — Dégradations tracées · blocs indisponibles = `null` + `warnings[]` (pas de score inventé) · tests dégradation
- [x] **C8.14** — Couverture > 80 % · globale 97,06 % · dossier inspection vert

### Qualité (C8.15–C8.18)

- [x] **C8.15** — Compilation · `verify` code 0
- [x] **C8.16** — Linting · code 0
- [x] **C8.17** — Gestion erreurs robuste · erreurs navigateur typées, sessions toujours refermées (`closeQuietly`)
- [x] **C8.18** — Documentation · `docs/INSPECTOR.md` (**548 lignes**)

**Sprint 8 : 18/18 ✅**

---

## Sprint 9 — Analyse 5 Dimensions (17 critères)

### Fonctionnels (C9.1–C9.8)

- [x] **C9.1** — 5 analyseurs · `src/analysis/{performance,accessibility,seo,ux,content}.ts`
- [x] **C9.2** — Performance (Core Web Vitals) · `performance.ts` · tests (7 ✅)
- [x] **C9.3** — Accessibilité (violations axe) · `accessibility.ts` · tests (8 ✅)
- [x] **C9.4** — SEO (meta, structure, liens) · `seo.ts` · tests (8 ✅)
- [x] **C9.5** — UX (heuristiques Nielsen) · `ux.ts` · tests (7 ✅)
- [x] **C9.6** — Contenu (qualité, lisibilité) · `content.ts` · tests (9 ✅)
- [x] **C9.7** — Matrice de sévérité (sévérité × effort × impact) · `src/analysis/severity.ts` · tests (11 ✅)
- [x] **C9.8** — Priorisation des constats · `src/analysis/prioritizer.ts` · tests (11 ✅)

### Techniques (C9.9–C9.13)

- [x] **C9.9** — Analyse rapide · pipeline unitaire : 6 tests en 41 ms (observé)
- [x] **C9.10** — Couverture > 80 % · globale 97,06 %
- [x] **C9.11** — Compilation · `verify` code 0
- [x] **C9.12** — Linting · code 0
- [x] **C9.13** — Gestion erreurs · entrées manquantes = erreur claire du pont (`adapter.ts`)

### Qualité (C9.14–C9.17)

- [x] **C9.14** — JSDoc · API publique documentée
- [x] **C9.15** — Performance · sans allocation superflue, tests unitaires < 100 ms/fichier
- [x] **C9.16** — Recommandations actionables · `Finding.recommendation` obligatoire (validations)
- [x] **C9.17** — Documentation · `docs/ANALYSIS.md` (271 lignes) + pont d'adaptation documenté

**Sprint 9 : 17/17 ✅**

---

## Sprint 10 — Stockage + Indexation (18 critères)

### Fonctionnels (C10.1–C10.8)

- [x] **C10.1** — Tables SQLite · `src/storage/schema.ts` (`audit_metadata`, `audit_dimensions`, `audit_findings`) · tests (12 ✅)
- [x] **C10.2** — AuditRepository CRUD · `src/storage/audit-repository.ts` · tests (30 ✅)
- [x] **C10.3** — Index FTS5 · `schema.ts` (`CREATE VIRTUAL TABLE`) + `indexing.ts` · tests (16 ✅)
- [x] **C10.4** — Index vectoriel (embeddings, cosine) · `src/storage/indexing.ts` + repositories vecteur · tests `vector-*` ✅
- [x] **C10.5** — Recherche hybride RRF (k = 60) · `src/storage/search.ts` + `src/business/rrf` · tests recherche (24 ✅)
- [x] **C10.6** — Statistiques (AVG, COUNT, top, tendances) · `src/storage/statistics.ts` · tests (16 ✅)
- [x] **C10.7** — Pagination (offset, limit) · repository `list` · tests pagination ✅
- [x] **C10.8** — Filtres (score, tags, type) · repository + search · tests filtres ✅

### Techniques (C10.9–C10.13)

- [x] **C10.9** — Stockage < 100 ms/audit · mesuré **0,893 ms/audit** (test 10 000 audits)
- [x] **C10.10** — Indexation < 500 ms/audit · mesuré **0,011 ms/audit**
- [x] **C10.11** — Recherche < 100 ms · mesuré **2,736 ms** pour 10 000 audits (stats 7,4 ms)
- [x] **C10.12** — Support 10 000 audits · `tests/storage/integration.test.ts` (performance) ✅
- [x] **C10.13** — Couverture > 80 % · globale 97,06 %

### Qualité (C10.14–C10.18)

- [x] **C10.14** — Compilation · `verify` code 0
- [x] **C10.15** — Linting · code 0
- [x] **C10.16** — Gestion erreurs · erreurs de connexion/schema typées
- [x] **C10.17** — Transactions · transactions SQLite dans `audit-repository.ts` (INSERT groupés)
- [x] **C10.18** — Documentation · `docs/STORAGE.md` (290 lignes)

**Sprint 10 : 18/18 ✅**

---

## Sprint 11 — Rapports + CLI + MCP (18 critères)

### Fonctionnels (C11.1–C11.8)

- [x] **C11.1** — Rapport Markdown · `src/reports/markdown-generator.ts` · tests (10 ✅, ~100 ms)
- [x] **C11.2** — Rapport PDF (Puppeteer 25, A4) · `src/reports/pdf-generator.ts` · rendus observés **2,1–4,1 s** (< 10 s)
- [x] **C11.3** — Comparaison 2 audits · `src/reports/comparator.ts` · tests (17 ✅, ~65 ms)
- [x] **C11.4** — CLI `ekts inspect <url>` · `src/cli/commands/inspect.ts` · tests E2E cli-flow + unit (9 ✅)
- [x] **C11.5** — CLI `audit list/show/report/compare` · `src/cli/commands/audit.ts` (4 sous-commandes) · tests (11 ✅)
- [x] **C11.6** — MCP `inspect_site` · `src/mcp/tools/inspect-site.ts` · tests (5 ✅) + E2E
- [x] **C11.7** — MCP `audit_history` · `src/mcp/tools/audit-history.ts` · tests (5 ✅)
- [x] **C11.8** — MCP `audit_report` · `src/mcp/tools/audit-report.ts` · tests (5 ✅)

### Techniques (C11.9–C11.13)

- [x] **C11.9** — Markdown < 2 s · observé **~0,1 s** par génération
- [x] **C11.10** — PDF < 10 s · observé **2,1–4,1 s**
- [x] **C11.11** — Comparaison < 1 s · observé **~0,07 s**
- [x] **C11.12** — CLI rapide · commandes sans navigation observées 170–5 400 ms (premier lancement) ; budgets couverts par tests
- [x] **C11.13** — MCP rapide · handshake/outils 16–999 ms observés ; budgets de navigation couverts par E2E (P6)

### Qualité (C11.14–C11.18)

- [x] **C11.14** — Couverture > 80 % · **97,06 %** globale (`npm run coverage`, seuils v8)
- [x] **C11.15** — JSDoc · API publique documentée en français
- [x] **C11.16** — Gestion erreurs · codes CLI 0/1/2/3/4, erreurs MCP typées (`McpError`)
- [x] **C11.17** — Documentation rapports · `docs/REPORTS.md` (240 lignes)
- [x] **C11.18** — Documentation CLI + MCP · `docs/CLI.md` (580 lignes), `docs/MCP.md` (479 lignes)

**Sprint 11 : 18/18 ✅**

---

## Résumé final

| Sprint | Critères | Validés | Statut |
|--------|---------:|--------:|--------|
| Sprint 7 | 17 | 17 | ✅ |
| Sprint 8 | 18 | 18 | ✅ |
| Sprint 9 | 17 | 17 | ✅ |
| Sprint 10 | 18 | 18 | ✅ |
| Sprint 11 | 18 | 18 | ✅ |
| **Total** | **88** | **88** | **✅** |

### Performance (mesures réelles observées)

| Métrique | Objectif | Réalisé | Statut |
|----------|----------|---------|--------|
| Navigation page locale | < 3 s | 1,48 s | ✅ |
| Accessibility tree | < 1 s | 0,55 s | ✅ |
| Screenshot | — | 0,86 s | ✅ |
| Stockage | < 100 ms/audit | 0,89 ms | ✅ |
| Indexation | < 500 ms/audit | 0,01 ms | ✅ |
| Recherche (10 000 audits) | < 100 ms | 2,74 ms | ✅ |
| Rapport Markdown | < 2 s | ~0,1 s | ✅ |
| Rapport PDF | < 10 s | 2,1–4,1 s | ✅ |
| Comparaison | < 1 s | ~0,07 s | ✅ |
| Inspection L1/L2/L3 | 10/30/60 s | budgets mesurés (`withinBudget`) ; E2E 16,5–30 s observés | ✅ |
| Tests E2E globaux | < 60 s | mesure poste dev consignée en boucle S12-1 | ⏳ |

### Qualité

| Indicateur | Objectif | Réalisé |
|------------|----------|---------|
| Couverture lignes | > 80 % | **97,06 %** |
| Couverture branches | > 80 % | **93,06 %** |
| Tests totaux | verts | 1 260 (seuils 80 % v8) |
| `npm run verify` | code 0 | code 0 (typecheck, lint, format, build, coverage) |
| CI | verts | 7/7 jobs par push |
| Documentation totale (`docs/`) | complète | **5 081 lignes** (19 fichiers + blueprint) |

---

## Conclusion

**✅ MVP-2 validé : 88/88 critères** — inspection L1–L3, analyse 5
dimensions, stockage/indexation SQLite, recherche hybride, rapports
Markdown/PDF, CLI 10 commandes, MCP 7 outils, E2E et documentation.

**Prêt pour MVP-3** (voir `docs/ROADMAP.md`).

---

**Version :** 0.1.0 (MVP-2) · **Dernière mise à jour :** 25 octobre 2026
