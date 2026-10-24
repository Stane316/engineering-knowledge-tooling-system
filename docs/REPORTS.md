# Rapports d'inspection — Documentation

**Sprint :** 11 (MVP-2)
**Modules :** `src/reports/**`
**Critères :** C11.1 à C11.18 (voir `docs/blueprint/Docs/roadmap/sprints/SPRINT-11.md`)

---

## 1. Vue d'ensemble

Le module de rapports EKTS génère des documents à partir des audits
(Sprint 10) :

- **Rapports Markdown** : lisibles, structurés, générés en moins de 2 s
  (même avec 100 constats) ;
- **Rapports PDF** : imprimables, professionnels, rendus par **Puppeteer**
  (Chrome headless, A4, fonds imprimés) en moins de 10 s ;
- **Comparaisons** : deltas de scores, deltas de constats, évolution et
  recommandations entre deux audits (< 1 s).

---

## 2. Architecture

```
Audit (Sprint 10)
    │
    ├─ MarkdownTemplate (sections pures) ──► MarkdownReportGenerator ──► .md
    │                                              │
    │                                              └─ generateComparison() ──► comparaison .md
    │
    ├─ HtmlTemplate (HTML autonome, CSS inline)
    │        └─► PDFReportGenerator (Puppeteer : setContent → page.pdf) ──► .pdf
    │
    └─ AuditComparator.compare(auditA, auditB) ──► ComparisonReport
             └─► ComparisonMarkdownTemplate (detailed + summary)
```

| Fichier | Rôle |
| --- | --- |
| `src/reports/types.ts` | `ReportOptions`, `ReportSection`, `GeneratedReport`, `ComparisonReport`, `DimensionDelta`, `FindingsDelta`, `ScoreEvolution` |
| `src/reports/templates/markdown.ts` | Sections Markdown (header, résumé, dimensions, constats, recommandations, comparaison) |
| `src/reports/templates/html.ts` | Document HTML autonome (classes `score-good` / `score-medium` / `score-poor`) |
| `src/reports/templates/comparison-markdown.ts` | Vue détaillée + résumé de comparaison |
| `src/reports/markdown-generator.ts` | Écriture fichier `.md` (ou contenu mémoire) |
| `src/reports/pdf-generator.ts` | Chaîne HTML → PDF via Puppeteer |
| `src/reports/comparator.ts` | Deltas et recommandations entre deux audits |

---

## 3. Utilisation

### 3.1 Rapport Markdown

```typescript
import { MarkdownReportGenerator } from './reports/markdown-generator.js';

const generator = new MarkdownReportGenerator();
const report = await generator.generate(audit, { outputPath: './reports' });

console.log('Fichier :', report.filePath);
console.log('Généré le :', report.generatedAt);
```

Sans `outputPath`, le contenu reste en mémoire (`report.content`) : c'est le
mode utilisé par l'outil MCP `audit_report`.

### 3.2 Rapport PDF

```typescript
import { PDFReportGenerator } from './reports/pdf-generator.js';

const generator = new PDFReportGenerator();
const report = await generator.generate(audit, { outputPath: './reports' });

// report.content : chaîne base64 du PDF (jamais de texte UTF-8)
```

**Résolution du binaire Chrome**, dans l'ordre :

1. variable `PUPPETEER_EXECUTABLE_PATH` (ou `EKTS_CHROME_PATH`) ;
2. Chrome embarqué de Puppeteer (`puppeteer.executablePath()`), s'il a été
   téléchargé ;
3. Chromium de Playwright (`PLAYWRIGHT_BROWSERS_PATH`,
   `~/.cache/ms-playwright`, `%LOCALAPPDATA%\ms-playwright`) — poste
   développeur EKTS (`npm run browsers:install`) ;
4. Chrome système (`/usr/bin/google-chrome`, `/opt/google/chrome/chrome`,
   installation Windows « Program Files ») — images CI ubuntu.

Aucun téléchargement n'est déclenché à l'exécution ; sans Chrome résolvable,
la génération échoue avec un message explicite (jamais un fichier vide).
Le lancement utilise `--no-sandbox --disable-setuid-sandbox
--disable-dev-shm-usage --disable-gpu` (compatibles CI/sandbox).

> **Note API (Puppeteer 25)** : `page.pdf()` renvoie un `Uint8Array`
> (l'encodage base64 est fait par le générateur) et `page.setContent()` n'accepte
> plus `networkidle0` : le document étant autonome (CSS inline, aucune ressource
> externe), l'attente `load` suffit.

### 3.3 Comparaison de deux audits

```typescript
import { AuditComparator } from './reports/comparator.js';

const comparator = new AuditComparator();
const comparison = comparator.compare(auditA, auditB);

console.log('Évolution :', comparison.evolution.trend); // improving | stable | degrading
console.log('Nouveaux :', comparison.deltaFindings.newFindings.length);
console.log('Résolus  :', comparison.deltaFindings.resolvedFindings.length);

const report = await new MarkdownReportGenerator().generateComparison(comparison, {
  outputPath: './reports',
});
```

**Méthode** :

- delta par dimension : `B − A` en points, relatif en % arrondi à 0,1
  (base = score A ; 0 si A = 0) ;
- clé d'appariement d'un constat : `dimension:title:severity` (minuscules,
  espaces normalisés) — une sévérité corrigée apparaît à la fois en
  « résolu » (ancienne clé) et « nouveau » (nouvelle clé), l'amélioration
  étant signalée par `improvedFindings` ;
- évolution : écart > +5 → `improving`, < −5 → `degrading`, sinon `stable` ;
- recommandations (escalier) : régression + nouveaux constats critiques ;
  capitalisation des critiques résolus ; plan d'action si critiques
  persistants en stable ; consolidation en amélioration ; sinon audit
  approfondi.

---

## 4. Sections d'un rapport standard

1. **Header** : URL, date, score global (emoji 🟢 ≥ 90, 🟡 ≥ 70, 🟠 ≥ 50, 🔴 sinon)
2. **Résumé** : répartition des constats par priorité (tableau)
3. **Scores par dimension** : tableau des 5 dimensions
4. **Détail par dimension** : score + recommandations associées (top 5)
5. **Constats** : regroupés par priorité décroissante
6. **Top 5 recommandations** : actions prioritaires (sévérité × impact)

---

## 5. Matrice de sévérité et d'évolution

### Seuils de priorité

| Sévérité | Effort | Score | Priorité |
|----------|--------|-------|----------|
| 4 (Critique) | 1 (Faible) | 20 | 🔴 Critical |
| 3 (Sérieux) | 2 (Moyen) | 12 | 🟠 High |
| 2 (Modéré) | 3 (Moyen) | 6 | 🟡 Medium |
| 1 (Mineur) | 4 (Élevé) | 2 | 🟢 Low |
| 0 (Info) | 5 (Très élevé) | 0 | ⚪ Info |

### Tendance d'évolution

| Δ (points) | Tendance |
|------------|----------|
| > +5 | 📈 improving |
| −5 à +5 | ➡️ stable |
| < −5 | 📉 degrading |

---

## 6. Performance (budgets)

| Opération | Budget | Vérifié par |
| --- | --- | --- |
| Rapport Markdown (100 constats) | < 2 s | `tests/reports/markdown-generator.test.ts` |
| Rapport PDF (100 constats) | < 10 s | `tests/reports/pdf-generator.test.ts` (timeout 15 s) |
| Comparaison (100 constats) | < 1 s | `tests/reports/comparator.test.ts` |
| Commandes CLI audit | < 500 ms | `tests/cli/audit.test.ts` |
| Outil MCP `audit_history` | < 2 s | `tests/mcp/tools/audit-history.test.ts` |

> Les tests de rendu PDF utilisent `skipIf` : sans Chrome résolvable sur la
> machine (poste nu), ils sont sautés — les contrôles d'erreur, eux, restent
> toujours actifs. CI ubuntu et postes EKTS disposent d'un Chrome.

---

## 7. CLI et MCP

### `ekts inspect <url>`

```bash
ekts inspect https://example.com
ekts inspect https://example.com --level L3
ekts inspect https://example.com --format md --output ./reports
```

### `ekts audit list | show | report | compare`

```bash
ekts audit list --limit 10 --score-min 70
ekts audit show 1
ekts audit report 1 --format both --output ./reports
ekts audit compare 1 2 --format md
```

### Outils MCP

```json
{ "url": "https://example.com", "level": "L3" }
{ "url": "https://example.com", "limit": 20, "score_min": 70 }
{ "audit_id": 1, "format": "markdown" }
```

Le détail (options, sorties JSON, codes) est dans
[`CLI.md`](./CLI.md) (§ 11) et [`MCP.md`](./MCP.md) (§ 15).

---

## 8. Écarts notables

1. **Niveau d'audit : L3 obligatoire.** La spécification Sprint 11 retenait
   L2 par défaut ; dans le code, seules les inspections **L3** fournissent
   les quatre blocs (`lighthouse`, `axe`, `ux`, `content`) que consomme
   `AnalysisPipeline` (L1/L2 n'existent pas comme entrées d'analyse).
   `--level L1|L2` reste accepté mais échoue avec un message explicite.
2. **Puppeteer 25** : `pdf()` → `Uint8Array`, `setContent` sans
   `networkidle0` (voir § 3.2). Chrome n'est pas téléchargé à l'exécution —
   résolution locale ou `npm run browsers:install`.
3. **`../storage/audit-types`** des spécifications : remplacé par
   `../storage/types.js` (fichier réel du dépôt). Idem `audit-search` →
   `search.js`, `audit-statistics` → `statistics.js`, `audit-indexing` →
   `indexing.js`, `audit-schema` → `schema.js`.
4. **Imports en ESM** : toutes les extensions sont `.js` (contrat TypeScript
   du dépôt).

---

## 9. Références

- [Puppeteer](https://pptr.dev/)
- [Core Web Vitals](https://web.dev/vitals/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Documentation inspection : [`INSPECTOR.md`](./INSPECTOR.md)
- Documentation analyse : [`ANALYSIS.md`](./ANALYSIS.md)
- Documentation stockage d'audits : [`STORAGE.md`](./STORAGE.md)
