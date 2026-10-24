# Sprint 11 — Rapport Inspection (MVP-2)

**Durée estimée :** 2 semaines (10 jours ouvrables)  
**Prérequis :** Sprint 8 (Inspection L1-L3), Sprint 9 (Analyse 5 Dimensions), Sprint 10 (Stockage + Indexation)  
**Objectif :** Générer des rapports d'inspection, comparer les audits, exposer via CLI et MCP
**Statut :** ✅ LIVRÉ (24 octobre 2026)  

---

## 1. Contexte et objectifs

### Contexte

Les **Sprints 8, 9, 10** ont implémenté :
- ✅ Inspection 4 niveaux (L1-L3) avec Playwright, Lighthouse, axe-core
- ✅ Analyse 5 dimensions (performance, accessibilité, SEO, UX, contenu)
- ✅ Stockage SQLite (3 tables + FTS5 + Vector)
- ✅ Recherche hybride (BM25 + cosine + RRF k=60)
- ✅ Statistiques (AVG, COUNT, TOP, Trend)

Le **Sprint 11** finalise le MVP-2 avec :
- 🎯 Génération de rapports (Markdown + PDF)
- 🎯 Comparaison d'audits (avant/après)
- 🎯 CLI `ekts inspect` + `ekts audit`
- 🎯 MCP `inspect_site` + `audit_history`

### Objectifs

**Fonctionnels :**
1. Générer rapport Markdown (lisible, structuré)
2. Générer rapport PDF (imprimable, professionnel)
3. Comparer 2 audits (delta scores, delta findings)
4. CLI `ekts inspect <url>` (lancer inspection + analyse)
5. CLI `ekts audit list` (lister audits)
6. CLI `ekts audit show <id>` (détail audit)
7. CLI `ekts audit report <id>` (générer rapport)
8. CLI `ekts audit compare <id1> <id2>` (comparer)
9. MCP `inspect_site` (inspection via MCP)
10. MCP `audit_history` (historique audits via MCP)
11. MCP `audit_report` (rapport via MCP)

**Techniques :**
1. Rapport Markdown < 2s (100 findings)
2. Rapport PDF < 10s (100 findings)
3. Comparaison < 1s
4. CLI temps de réponse < 500ms
5. MCP temps de réponse < 2s

**Qualité :**
1. Tests > 80% couverture
2. Code lisible (JSDoc)
3. Gestion erreurs robuste
4. Documentation complète

---

## 2. Périmètre

### Inclus

| Élément | Description |
|---------|-------------|
| ✅ Rapport Markdown | Générateur structuré |
| ✅ Rapport PDF | Via Puppeteer (HTML → PDF) |
| ✅ Templates | Templates Markdown + HTML |
| ✅ Comparaison audits | Delta scores, delta findings |
| ✅ CLI inspect | ekts inspect <url> [--level L1\|L2\|L3] |
| ✅ CLI audit | ekts audit list/show/report/compare |
| ✅ MCP inspect_site | Outil MCP pour inspection |
| ✅ MCP audit_history | Outil MCP pour historique |
| ✅ MCP audit_report | Outil MCP pour rapport |
| ✅ Tests unitaires | > 80% couverture |
| ✅ Tests intégration | Flux complets |
| ✅ Documentation | REPORTS.md + mise à jour CLI.md + MCP.md |

### Exclu

| Élément | Description |
|---------|-------------|
| ❌ Export HTML | Pas de rapport HTML autonome |
| ❌ Export JSON | Pas d'export brut JSON |
| ❌ Comparaison multi-audits | Comparaison 2 à 2 uniquement |
| ❌ Graphiques/Charts | Pas de visualisations graphiques |
| ❌ Templates personnalisables | Templates fixes pour MVP-2 |
| ❌ Envoi par email | Hors périmètre |
| ❌ Planification | Pas de cron/scheduler |

---

## 3. Architecture

### 3.1 Flux de données

```
CLI ekts inspect <url>
    ↓
[Inspector.inspect()] (Sprint 8)
    ↓
L1/L2/L3 Results
    ↓
[AnalysisPipeline.analyze()] (Sprint 9)
    ↓
AnalysisReport
    ↓
[AuditRepository.store()] (Sprint 10)
    ↓
Audit stocké
    ↓
[ReportGenerator.generate()] (Sprint 11)
    ↓
Rapport Markdown/PDF
```

### 3.2 Architecture rapports

```
Audit (Sprint 10)
    ↓
[MarkdownReportGenerator]
    ↓
Template Markdown
    ↓
Rapport .md
    ↓
[PDFReportGenerator]
    ↓
HTML (via template)
    ↓
Puppeteer (HTML → PDF)
    ↓
Rapport .pdf
```

### 3.3 Comparaison

```
Audit A (ancien)
Audit B (récent)
    ↓
[AuditComparator.compare()]
    ↓
ComparisonReport
    ├── Delta scores (par dimension)
    ├── Delta findings (nouveaux, résolus, persistants)
    ├── Évolution score global
    └── Recommandations
```

### 3.4 CLI

```
ekts inspect <url>
  --level L1|L2|L3 (défaut: L2)
  --output ./reports (défaut: ./reports)
  --format md|pdf|both (défaut: both)

ekts audit list
  --limit N (défaut: 20)
  --url <url>
  --score-min N
  --score-max N

ekts audit show <id>

ekts audit report <id>
  --format md|pdf|both (défaut: both)
  --output ./reports

ekts audit compare <id1> <id2>
  --format md|pdf|both (défaut: both)
```

### 3.5 MCP

```
inspect_site
  Input: { url, level }
  Output: { inspection, analysis, audit_id }

audit_history
  Input: { url?, limit?, score_min?, score_max? }
  Output: { audits[], statistics }

audit_report
  Input: { audit_id, format }
  Output: { report_content, file_path }
```

---

## 4. Décomposition en sous-sprints

### Sprint 11-1 — Rapports Markdown + PDF (Semaine 21, Jours 1-4)

**Durée :** 4 jours  
**Objectif :** Implémenter les générateurs de rapports

**Livrables :**
- `src/reports/types.ts` — Types (ReportOptions, ComparisonReport)
- `src/reports/templates/markdown.ts` — Template Markdown
- `src/reports/templates/html.ts` — Template HTML
- `src/reports/markdown-generator.ts` — Générateur Markdown
- `src/reports/pdf-generator.ts` — Générateur PDF (Puppeteer)
- `tests/reports/markdown-generator.test.ts` — Tests Markdown
- `tests/reports/pdf-generator.test.ts` — Tests PDF

**Tâches atomiques :**
1. Définir les types (ReportOptions, ReportSection, ComparisonReport)
2. Implémenter template Markdown (header, summary, dimensions, findings)
3. Implémenter MarkdownReportGenerator (generate, formatSections)
4. Implémenter template HTML (style inline, sections)
5. Implémenter PDFReportGenerator (HTML → PDF via Puppeteer)
6. Tests unitaires (Markdown + PDF)

**Critères d'acceptation :**
- ✅ Rapport Markdown généré < 2s
- ✅ Rapport PDF généré < 10s
- ✅ Sections : header, summary, 5 dimensions, findings, recommandations
- ✅ Markdown lisible (headings, tables, code blocks)
- ✅ PDF imprimable (A4, marges, pagination)
- ✅ Tests > 80% couverture

---

### Sprint 11-2 — Comparaison d'audits (Semaine 21, Jours 5-7)

**Durée :** 3 jours  
**Objectif :** Implémenter la comparaison d'audits (avant/après)

**Livrables :**
- `src/reports/comparator.ts` — AuditComparator
- `src/reports/templates/comparison-markdown.ts` — Template comparaison
- `tests/reports/comparator.test.ts` — Tests comparateur

**Tâches atomiques :**
1. Implémenter AuditComparator.compare(auditA, auditB)
2. Calculer delta scores (par dimension)
3. Identifier findings nouveaux, résolus, persistants
4. Calculer évolution score global
5. Générer recommandations (améliorations, régressions)
6. Implémenter template comparaison Markdown
7. Tests unitaires (comparateur + template)

**Critères d'acceptation :**
- ✅ Comparaison < 1s
- ✅ Delta scores calculés (par dimension)
- ✅ Findings classés (nouveaux, résolus, persistants)
- ✅ Évolution score global (pourcentage)
- ✅ Recommandations générées
- ✅ Template Markdown lisible
- ✅ Tests > 80% couverture

---

### Sprint 11-3 — CLI + MCP + Tests + Docs (Semaine 22, Jours 8-10)

**Durée :** 3 jours  
**Objectif :** Implémenter les commandes CLI, les outils MCP, tests et documentation

**Livrables :**
- `src/cli/commands/inspect.ts` — Commande `ekts inspect`
- `src/cli/commands/audit.ts` — Commandes `ekts audit` (list/show/report/compare)
- `src/mcp/tools/inspect-site.ts` — Outil MCP `inspect_site`
- `src/mcp/tools/audit-history.ts` — Outil MCP `audit_history`
- `src/mcp/tools/audit-report.ts` — Outil MCP `audit_report`
- `tests/cli/inspect.test.ts` — Tests CLI inspect
- `tests/cli/audit.test.ts` — Tests CLI audit
- `tests/mcp/inspect-site.test.ts` — Tests MCP inspect_site
- `tests/mcp/audit-history.test.ts` — Tests MCP audit_history
- `tests/mcp/audit-report.test.ts` — Tests MCP audit_report
- `docs/REPORTS.md` — Documentation rapports
- `docs/CLI.md` — Mise à jour documentation CLI
- `docs/MCP.md` — Mise à jour documentation MCP

**Tâches atomiques :**
1. Implémenter `ekts inspect <url>` (options : level, output, format)
2. Implémenter `ekts audit list` (options : limit, url, score-min, score-max)
3. Implémenter `ekts audit show <id>`
4. Implémenter `ekts audit report <id>` (options : format, output)
5. Implémenter `ekts audit compare <id1> <id2>` (options : format)
6. Implémenter MCP `inspect_site` (input : url, level → output : audit)
7. Implémenter MCP `audit_history` (input : url?, limit? → output : audits[])
8. Implémenter MCP `audit_report` (input : audit_id, format → output : report)
9. Tests unitaires (CLI + MCP)
10. Tests d'intégration complets
11. Documentation REPORTS.md
12. Mise à jour CLI.md + MCP.md

**Critères d'acceptation :**
- ✅ CLI `ekts inspect` fonctionne
- ✅ CLI `ekts audit list/show/report/compare` fonctionnent
- ✅ MCP `inspect_site` fonctionne
- ✅ MCP `audit_history` fonctionne
- ✅ MCP `audit_report` fonctionne
- ✅ CLI temps de réponse < 500ms
- ✅ MCP temps de réponse < 2s
- ✅ Tests > 80% couverture
- ✅ Documentation complète

---

## 5. Choix techniques

### 5.1 Génération PDF

**Pourquoi Puppeteer ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| Puppeteer | HTML → PDF fidèle, CSS complet | Dépendance Chromium | ✅ |
| jsPDF | Léger, pas de navigateur | Pas de CSS, layout complexe | ❌ |
| wkhtmltopdf | Rapide, CSS OK | Binaire externe, maintenance | ❌ |

**Décision :** Puppeteer (HTML → PDF via Chromium headless)

### 5.2 Templates

**Pourquoi templates séparés ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| Templates séparés (MD + HTML) | Flexibilité, réutilisation | Duplication partielle | ✅ |
| Template unique (MD → HTML) | Pas de duplication | Conversion fragile | ❌ |

**Décision :** Templates séparés (markdown.ts + html.ts)

### 5.3 Comparaison

**Pourquoi comparaison 2 à 2 ?**

| Option | Avantages | Inconvénients | Choix |
|--------|-----------|---------------|-------|
| 2 à 2 | Simple, lisible, MVP-2 | Pas de multi-comparaison | ✅ |
| Multi-audits | Comparaison N audits | Complexe, illisible | ❌ |

**Décision :** Comparaison 2 à 2 (audit A vs audit B)

### 5.4 CLI vs MCP

**Pourquoi les deux ?**

| Interface | Usage | Avantages |
|-----------|-------|-----------|
| CLI | Humain (développeur) | Interactive, scriptable |
| MCP | IA (Claude, GPT) | Intégration directe |

**Décision :** Les deux (CLI pour humain, MCP pour IA)

---

## 6. Organisation des fichiers

```
src/
├── reports/
│   ├── types.ts                    (Sprint 11-1) livré
│   ├── templates/
│   │   ├── markdown.ts             (Sprint 11-1) livré
│   │   ├── html.ts                 (Sprint 11-1) livré
│   │   └── comparison-markdown.ts  (Sprint 11-2) livré
│   ├── markdown-generator.ts       (Sprint 11-1) livré
│   ├── pdf-generator.ts            (Sprint 11-1) livré
│   └── comparator.ts               (Sprint 11-2) livré
│
├── cli/
│   └── commands/
│       ├── inspect.ts              (Sprint 11-3) livré
│       └── audit.ts                (Sprint 11-3) livré
│
└── mcp/
    └── tools/
        ├── inspect-site.ts         (Sprint 11-3) livré
        ├── audit-history.ts        (Sprint 11-3) livré
        └── audit-report.ts         (Sprint 11-3) livré

tests/
├── reports/
│   ├── markdown-generator.test.ts  (Sprint 11-1) livré
│   ├── pdf-generator.test.ts       (Sprint 11-1) livré
│   └── comparator.test.ts          (Sprint 11-2) livré
│
├── cli/
│   ├── inspect.test.ts             (Sprint 11-3) livré
│   └── audit.test.ts               (Sprint 11-3) livré
│
└── mcp/
    ├── inspect-site.test.ts        (Sprint 11-3) livré
    ├── audit-history.test.ts       (Sprint 11-3) livré
    └── audit-report.test.ts        (Sprint 11-3) livré

docs/
├── REPORTS.md                      (Sprint 11-3) livré
├── CLI.md                          (mise à jour)
└── MCP.md                          (mise à jour)
```

**Total livré :**
- **23 fichiers** (12 code + 8 tests + 3 docs) — le 13ᵉ fichier code annoncé
  (`scripts/test-reports-performance.ts`) reste hors livrables nombrés :
  les budgets de performance sont mesurés dans les tests (écart E11-6)
- **3 697 lignes** de code + tests (2 306 code, 1 391 tests)
- **240 lignes** pour `REPORTS.md` + extensions `CLI.md`/`MCP.md`
- **19 commits** atomiques (16 code/tests/docs + 3 de clôture documentaire)

---

### 6.1 Écarts au plan (24/10/2026)

| # | Écart | Arbitrage |
|---|-------|-----------|
| E11-1 | Imports de la spécification `../storage/audit-types`, `audit-search`, `audit-statistics`, `audit-indexing`, `audit-schema` **inexistants** | Fichiers réels du dépôt : `types.js`, `search.js`, `statistics.js`, `indexing.js`, `schema.js` (liste des livrables = référence) |
| E11-2 | `getDatabase()` (CLI/MCP) et `VectorStore` inexistants | `openDatabase({ dataDir: runtime.dataDir })` + `AuditSchema.createSchema()` idempotent côté CLI ; `openCliServices` (ADR-019) côté MCP ; `AuditIndexer(db)` sans embeddings (FTS seul, aucun réseau en test) |
| E11-3 | Niveau par défaut **L2** de la spécification impossible : seules les inspections **L3** fournissent `lighthouse`/`axe`/`ux`/`content` à `AnalysisPipeline` | Défaut `L3` ; `L1`/`L2` acceptés par l'interface mais refusés avec message réparateur (code 4) |
| E11-4 | Puppeteer 25 : `page.pdf()` → `Uint8Array` ; `setContent` sans `networkidle0` ; Chrome non téléchargé (`PUPPETEER_SKIP_DOWNLOAD=1`, CDN bloqués) | Encodage base64 maison ; attente `load` (HTML autonome) ; résolution Chrome en 4 niveaux (env → embarqué → Playwright → système) |
| E11-5 | Registration : `program.ts`, `mcp/{context,handlers/tools,server}.ts`, `schemas/tool-schemas.ts` + 4 tests existants hors périmètre « fichiers listés » | Modification **minimale** indispensable au branchement (critères C11.4-C11.8) : 2 registration d'import, compteurs 4 → 7 outils, `readOnlyHint` faux pour `inspect_site` seul |
| E11-6 | `scripts/test-reports-performance.ts` annoncé dans les « 13 fichiers code » mais non listé dans la mission (12 fichiers énumérés) | Même arbitrage que Sprint 10 : budgets mesurés dans les tests dédiés (MD/PDF/comparaison/CLI/MCP) |
| E11-7 | `tests/reports/comparison-markdown.test.ts` prévu par SPRINT-11-02 mais absent des 8 fichiers tests de la mission | Tests du template intégrés à `tests/reports/comparator.test.ts` (11 cas spec + 5 cas template) |
| E11-8 | Motif MCP de la fiche (`server.tool()`, tests « export défini ») différent du dépôt (`executeX` + `dispatchTool` + `server.registerTool`, tests sur base réelle) | Motif du dépôt conservé ; tests réels (fixtures SQLite, aucun réseau) pour la couverture |
| E11-9 | Motif CLI de la fiche (`console.log` + `process.exit(1)`) différent du dépôt (`execute()` → `CommandResult`, codes 0/2/3/4) | Motif du dépôt conservé (C11.5 sorties humaines + `--json` standardisées) |
| E11-10 | `audit compare --format both` : la fiche ne générait que le Markdown | Génération symétrique md **et** pdf (le PDF de comparaison existe dans `pdf-generator.ts`) |
| E11-11 | Mission citant « architecture §4.5 (Reports) » alors que la doc saute de §4.4 à §5 ; « ADR-014 (Puppeteer) » alors que l'ADR-014 réel est l'assainissement FTS (le §2.4 écarte Puppeteer pour l'*automation navigateur*, rôle distinct de HTML → PDF) | Sections **§4.4 + §4.5** créées dans `02-ARCHITECTURE-TECHNIQUE.md` ; décision Puppeteer consignée en **ADR-030** |
| E11-12 | Poste de développement sans Chrome (CDN bloqués) : tests de rendu PDF inéxecutables ici | `skipIf` gracieux (4 tests sautés) ; contrôles d'erreur toujours actifs ; tests PDF actifs sur CI ubuntu (Chrome système) et poste EKTS |

## 7. Tests et validation

### 7.1 Tests unitaires

**MarkdownGenerator :**
- ✅ generate() (rapport complet)
- ✅ formatHeader() (URL, date, score)
- ✅ formatSummary() (stats globales)
- ✅ formatDimensions() (5 dimensions)
- ✅ formatFindings() (liste findings)
- ✅ formatRecommendations() (recommandations)

**PDFGenerator :**
- ✅ generate() (HTML → PDF)
- ✅ Puppeteer launch (headless)
- ✅ PDF créé (fichier)
- ✅ PDF < 10s

**Comparator :**
- ✅ compare() (2 audits)
- ✅ Delta scores (par dimension)
- ✅ Findings nouveaux, résolus, persistants
- ✅ Évolution score global
- ✅ Recommandations générées

**CLI :**
- ✅ `ekts inspect` (options : level, output, format)
- ✅ `ekts audit list` (options : limit, url, score)
- ✅ `ekts audit show <id>`
- ✅ `ekts audit report <id>`
- ✅ `ekts audit compare <id1> <id2>`

**MCP :**
- ✅ `inspect_site` (input : url, level → output : audit)
- ✅ `audit_history` (input : url?, limit? → output : audits[])
- ✅ `audit_report` (input : audit_id, format → output : report)

### 7.2 Tests d'intégration

**Flux complet :**
```typescript
// 1. Inspecter un site
const inspection = await inspector.inspect({ level: 'L2', url: 'https://example.com' });

// 2. Analyser l'inspection
const report = await pipeline.analyze(url, inspection.lighthouse, inspection.axe, inspection.ux, inspection.content);

// 3. Stocker l'audit
const audit = await auditRepo.store(report);
await indexer.indexAudit(audit);

// 4. Générer rapport
const mdReport = await markdownGen.generate(audit);
const pdfReport = await pdfGen.generate(audit);

// 5. Comparer avec audit précédent
const previousAudit = audits[1];
const comparison = comparator.compare(previousAudit, audit);
const comparisonReport = await markdownGen.generateComparison(comparison);
```

### 7.3 Tests performance

**Scénario : Rapport 100 findings**
- Rapport Markdown : < 2s
- Rapport PDF : < 10s
- Comparaison : < 1s
- CLI : < 500ms
- MCP : < 2s

### 7.4 Critères de validation

**Fonctionnels :**
1. ✅ Rapport Markdown généré
2. ✅ Rapport PDF généré
3. ✅ Comparaison 2 audits
4. ✅ CLI `ekts inspect`
5. ✅ CLI `ekts audit list/show/report/compare`
6. ✅ MCP `inspect_site`
7. ✅ MCP `audit_history`
8. ✅ MCP `audit_report`

**Techniques :**
9. ✅ Rapport Markdown < 2s
10. ✅ Rapport PDF < 10s
11. ✅ Comparaison < 1s
12. ✅ CLI < 500ms
13. ✅ MCP < 2s

**Qualité :**
14. ✅ Tests > 80% couverture
15. ✅ Code lisible (JSDoc)
16. ✅ Gestion erreurs robuste
17. ✅ Documentation REPORTS.md complète
18. ✅ CLI.md + MCP.md mise à jour

---

## 8. Livrables

### 8.1 Code source

**13 fichiers :**
- `src/reports/types.ts` — Types rapports
- `src/reports/templates/markdown.ts` — Template Markdown
- `src/reports/templates/html.ts` — Template HTML
- `src/reports/templates/comparison-markdown.ts` — Template comparaison
- `src/reports/markdown-generator.ts` — Générateur Markdown
- `src/reports/pdf-generator.ts` — Générateur PDF
- `src/reports/comparator.ts` — Comparateur d'audits
- `src/cli/commands/inspect.ts` — CLI inspect
- `src/cli/commands/audit.ts` — CLI audit
- `src/mcp/tools/inspect-site.ts` — MCP inspect_site
- `src/mcp/tools/audit-history.ts` — MCP audit_history
- `src/mcp/tools/audit-report.ts` — MCP audit_report
- `scripts/test-reports-performance.ts` — Tests performance

### 8.2 Tests

**8 fichiers :**
- `tests/reports/markdown-generator.test.ts`
- `tests/reports/pdf-generator.test.ts`
- `tests/reports/comparator.test.ts`
- `tests/cli/inspect.test.ts`
- `tests/cli/audit.test.ts`
- `tests/mcp/inspect-site.test.ts`
- `tests/mcp/audit-history.test.ts`
- `tests/mcp/audit-report.test.ts`

### 8.3 Documentation

**3 fichiers :**
- `docs/REPORTS.md` — Documentation rapports (400 lignes)
- `docs/CLI.md` — Mise à jour documentation CLI
- `docs/MCP.md` — Mise à jour documentation MCP

### 8.4 Résumé

| Métrique | Valeur |
|----------|--------|
| Fichiers code | 13 |
| Fichiers tests | 8 |
| Fichiers docs | 3 |
| Lignes code | ~1 920 |
| Lignes tests | ~1 010 |
| Lignes docs | ~400 |
| **Total lignes** | **~3 330** |

---

## 9. Critères d'acceptation

### 9.1 Fonctionnels

1. ✅ **Rapport Markdown** — Généré avec sections (header, summary, dimensions, findings)
2. ✅ **Rapport PDF** — Généré via Puppeteer (HTML → PDF)
3. ✅ **Comparaison audits** — Delta scores, delta findings, évolution
4. ✅ **CLI inspect** — `ekts inspect <url>` avec options
5. ✅ **CLI audit** — `ekts audit list/show/report/compare`
6. ✅ **MCP inspect_site** — Inspection via MCP
7. ✅ **MCP audit_history** — Historique via MCP
8. ✅ **MCP audit_report** — Rapport via MCP

### 9.2 Techniques

9. ✅ **Rapport Markdown < 2s** — Pour 100 findings
10. ✅ **Rapport PDF < 10s** — Pour 100 findings
11. ✅ **Comparaison < 1s** — Pour 2 audits
12. ✅ **CLI < 500ms** — Temps de réponse
13. ✅ **MCP < 2s** — Temps de réponse

### 9.3 Qualité

14. ✅ **Tests > 80%** — Couverture unitaires
15. ✅ **Code lisible** — JSDoc complet
16. ✅ **Gestion erreurs** — Try/catch, validation
17. ✅ **Documentation complète** — REPORTS.md (400 lignes)
18. ✅ **CLI.md + MCP.md** — Mise à jour

---

## 10. Procédure de fin de sprint

### 10.1 Checklist finale

- [ ] Tous les fichiers créés (23 fichiers code + tests + docs)
- [ ] Tests unitaires passent (> 80% couverture)
- [ ] Tests d'intégration passent
- [ ] Tests performance passent
- [ ] Compilation TypeScript OK
- [ ] Linting OK
- [ ] Documentation complète (REPORTS.md)
- [ ] CLI.md + MCP.md mise à jour
- [ ] Tous les commits faits (commits atomiques)
- [ ] Push sur branche feature

### 10.2 Commandes de validation

```bash
# Tests unitaires
npm test tests/reports/
npm test tests/cli/
npm test tests/mcp/

# Couverture
npm run test:coverage -- tests/reports/ tests/cli/ tests/mcp/
# ✅ > 80%

# Compilation
npm run build
# ✅ Aucune erreur

# Linting
npm run lint
# ✅ Aucune erreur

# Tests performance
node dist/scripts/test-reports-performance.js
# ✅ Rapport Markdown < 2s, PDF < 10s, Comparaison < 1s

# Vérification fichiers
ls -la src/reports/
# ✅ types.ts, markdown-generator.ts, pdf-generator.ts, comparator.ts, templates/

ls -la src/cli/commands/
# ✅ inspect.ts, audit.ts

ls -la src/mcp/tools/
# ✅ inspect-site.ts, audit-history.ts, audit-report.ts

ls -la docs/REPORTS.md
# ✅ Documentation existe

# Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# Push
git push origin feat/sprint-11
```

---

## 11. Prompt de lancement agent

**Copier ce prompt pour lancer un agent de développement :**

---

**PROMPT DE LANCEMENT — Sprint 11 : Rapport Inspection**

Tu vas implémenter le Sprint 11 du projet Engineering Knowledge Tooling System (EKTS).

**📋 Documents à lire avant de commencer :**
1. `Docs/roadmap/sprints/SPRINT-11.md` — Dossier complet (ce document)
2. `Docs/roadmap/sprints/SPRINT-11-01.md` — Rapports Markdown + PDF (4 jours)
3. `Docs/roadmap/sprints/SPRINT-11-02.md` — Comparaison d'audits (3 jours)
4. `Docs/roadmap/sprints/SPRINT-11-03.md` — CLI + MCP + Tests + Docs (3 jours)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Section 4.5 (Reports)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — ADR-014 (Puppeteer)

**🔍 Audit de l'état actuel :**
Avant de commencer, vérifie :
```bash
# Vérifier que les Sprints 8, 9, 10 sont implémentés
ls -la src/browser/inspection/
# ✅ inspector.ts, level-1.ts, level-2.ts, level-3.ts

ls -la src/analysis/
# ✅ pipeline.ts, performance.ts, accessibility.ts, seo.ts, ux.ts, content.ts

ls -la src/storage/
# ✅ audit-repository.ts, audit-search.ts, audit-statistics.ts

# Vérifier que les tests passent
npm test tests/browser/
npm test tests/analysis/
npm test tests/storage/
# ✅ Tous les tests passent
```

**✅ Vérification des prérequis :**
- [ ] Sprint 8 implémenté (Inspector, 4 niveaux)
- [ ] Sprint 9 implémenté (AnalysisPipeline, 5 analyseurs)
- [ ] Sprint 10 implémenté (AuditRepository, AuditSearch, AuditStatistics)
- [ ] Tests unitaires > 80% couverture (Sprints 8, 9, 10)
- [ ] Documentation à jour (DOCS.md)

**🎯 Périmètre autorisé :**
- Créer/modifier uniquement les fichiers listés dans SPRINT-11-01/02/03.md
- NE PAS toucher aux fichiers existants (Sprint 8, 9, 10) sauf pour import
- NE PAS créer de fichiers hors périmètre
- RÉUTILISER le code existant (Inspector, AnalysisPipeline, AuditRepository)

**⚠️ Contraintes et interdictions :**
- PAS de pull requests
- Commits atomiques (1 commit par tâche logique)
- Français dans les commentaires
- JSDoc sur toutes les fonctions publiques
- Tests > 80% couverture
- Code TypeScript strict
- Gestion erreurs (try/catch, validation)
- Puppeteer pour PDF (pas jsPDF, pas wkhtmltopdf)

**🧪 Tests et critères :**
- Tests unitaires : > 80% couverture
- Tests d'intégration : Flux complets
- Tests performance : Rapport Markdown < 2s, PDF < 10s
- CLI : < 500ms
- MCP : < 2s

**📦 Livrables attendus :**
- 13 fichiers code (reports, CLI, MCP)
- 8 fichiers tests
- 3 fichiers docs (REPORTS.md, CLI.md, MCP.md)
- Total : ~3 330 lignes

**⏱️ Durée estimée :**
- Sprint 11-1 : 4 jours
- Sprint 11-2 : 3 jours
- Sprint 11-3 : 3 jours
- Total : 10 jours

**📝 Procédure de compte rendu :**
À la fin de chaque sous-sprint, crée un fichier `SPRINT-11-XX-RESULTAT.md` avec :
- Liste des fichiers créés
- Nombre de lignes de code
- Couverture de tests
- Performance mesurée
- Problèmes rencontrés
- Temps réel passé

Commence par lire les 4 documents SPRINT-11*.md, puis implémente le Sprint 11-1, 11-2, 11-3 dans l'ordre.

---

## 12. Résumé et transition

### Résumé Sprint 11

**Objectif :** Générer des rapports d'inspection, comparer les audits, exposer via CLI et MCP

**Livrables :**
- Générateur de rapports Markdown (structuré, lisible)
- Générateur de rapports PDF (via Puppeteer, imprimable)
- Comparateur d'audits (delta scores, delta findings)
- CLI `ekts inspect` + `ekts audit` (5 commandes)
- MCP `inspect_site` + `audit_history` + `audit_report` (3 outils)
- Tests > 80% couverture
- Documentation complète (REPORTS.md, CLI.md, MCP.md)

**Performance :**
- Rapport Markdown < 2s (100 findings)
- Rapport PDF < 10s (100 findings)
- Comparaison < 1s (2 audits)
- CLI < 500ms
- MCP < 2s

**Durée :** 2 semaines (10 jours ouvrables)

### Transition vers Sprint 12

**Sprint 12 — Tests + Documentation MVP-2 :**
- Tests E2E complets (MVP-2)
- Documentation utilisateur complète
- Documentation développeur complète
- Validation MVP-2 (critères fonctionnels, techniques, qualité)
- Préparation MVP-3 (Capitalisation projets)

**Prérequis Sprint 12 :**
- ✅ Sprint 11 terminé avec succès
- ✅ Rapports générés (Markdown + PDF)
- ✅ CLI fonctionnelle
- ✅ MCP fonctionnel

---

**Fin du document Sprint 11**
