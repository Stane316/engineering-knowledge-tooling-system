# Analyse 5 Dimensions — Documentation

**Module :** `src/analysis/` — Sprint 9 (24 octobre 2026)
**Entrées :** résultats de l'inspection L3 (Sprint 8) · **Sortie :** `AnalysisReport` (consommé par le Sprint 10)
**Dépendances :** aucune — module pur, sans navigateur, sans réseau, sans base.

---

## 1. Vue d'ensemble

Le module transforme les données brutes d'inspection en **analyse structurée** :

- **5 analyseurs** (performance, accessibilité, SEO, UX, contenu) produisant des `Finding` gradués ;
- une **matrice de sévérité** `severity × (6 − effort)` qui attribue la priorité ;
- un **priorisateur** qui recalcule, trie, groupe et résume les constats ;
- un **pipeline** qui orchestre le tout et calcule le score global pondéré.

```
Inspection L3 (Sprint 8)             src/browser/inspection/
    │
    ▼  adapter (inp→fid, contenu plat→metrics)
AnalysisInputs                       src/analysis/adapter.ts
    │
    ├── PerformanceAnalyzer ──► findings performance
    ├── AccessibilityAnalyzer ──► findings accessibilité
    ├── SEOAnalyzer ──► findings SEO
    ├── UXAnalyzer ──► findings UX
    ├── ContentAnalyzer ──► findings contenu
    │
    ▼  SeverityMatrix : priority = severity × (6 − effort)
    │
    ▼  FindingPrioritizer : recalcul + tri + groupements + résumé
    │
AnalysisReport                       { dimensions, findings, priorityFindings, summary }
```

## 2. Types contractuels

`src/analysis/types.ts` — le module est **délibérément découplé** des types du
navigateur : une évolution de Lighthouse ou d'axe-core ne touche que le pont
(`adapter.ts`).

| Type | Rôle |
| --- | --- |
| `Finding` | Constat unitaire : `id`, `dimension`, `title`, `description`, `severity` (0-4), `effort` (1-5), `impact` (1-5), `priority`, `recommendation`, `references`, `elements?`, `metric?` |
| `DimensionScore` | Score 0-100 + constats + résumé d'une dimension |
| `AnalysisReport` | Rapport complet : 5 dimensions, `findings`, `priorityFindings`, `summary` agrégé |
| `LighthouseResults` / `AxeResults` / `UXResults` / `ContentResults` | Entrées des analyseurs (contrats purs, testables sans navigateur) |

## 3. Matrice de sévérité

**Formule :** `priority_score = severity × (6 − effort)`

| Sévérité | Effort | Score | Priorité |
| --- | --- | --- | --- |
| 4 (Critique) | 1 (Faible) | 20 | `critical` |
| 3 (Sérieux) | 2 (Moyen) | 12 | `high` |
| 2 (Modéré) | 3 (Moyen) | 6 | `medium` |
| 1 (Mineur) | 4 (Élevé) | 2 | `low` |
| 0 (Info) | 5 (Très élevé) | 0 | `info` |

**Seuils :** ≥ 20 `critical` · ≥ 12 `high` · ≥ 6 `medium` · ≥ 2 `low` · sinon `info`.

- **Sévérité (0-4)** : gravité — 4 bloque l'utilisateur, 0 est une information.
- **Effort (1-5)** : complexité de correction — 1 < 1 h, 5 > 3 j.
- **Impact (1-5)** : effet utilisateur — porté par le constat, affiché mais
  n'entraîne pas le score (la formule ne retient que sévérité et effort).

`SeverityMatrix` expose aussi `validateSeverity/validateEffort/validateImpact`
et `getExamples()` (six cas documentés, utiles au débogage et à la doc).

## 4. Analyseurs

### 4.1 PerformanceAnalyzer — `src/analysis/performance.ts`

Source : Lighthouse (Sprint 8). Chaque métrique hors du « bon » produit un constat.

| Métrique | Bon | À améliorer | Mauvais | Constats |
| --- | --- | --- | --- | --- |
| LCP | < 2 500 ms | 2 500-4 000 ms | > 4 000 ms | `perf-lcp-warning` / `perf-lcp-critical` |
| FID | < 100 ms | 100-300 ms | > 300 ms | `perf-fid-warning` / `perf-fid-critical` |
| CLS | < 0,1 | 0,1-0,25 | > 0,25 | `perf-cls-warning` / `perf-cls-critical` |
| TTFB | < 800 ms | 800-1 800 ms | > 1 800 ms | `perf-ttfb-warning` / `perf-ttfb-critical` |

> **FID et INP.** Le Sprint 8 mesure **INP**, successeur du FID (voir
> `CoreWebVitals.inp`). Le contrat d'analyse conserve le nom historique `fid`
> (critère C9.1) : le pont `adapter` y reporte la valeur INP. Les seuils
> 100/300 ms sont ceux de la spécification du Sprint 9.

### 4.2 AccessibilityAnalyzer — `src/analysis/accessibility.ts`

Source : axe-core (Sprint 8), WCAG 2.2 AA.

| Axe | Règle |
| --- | --- |
| Sévérité | `critical→4`, `serious→3`, `moderate→2`, `minor→1` (impact déclaré par axe) |
| Effort | 1 nœud → 1 · ≤ 5 → 2 · ≤ 20 → 3 · au-delà → 4 |
| Impact | `min(5, sévérité × min(2, ⌈nœuds/10⌉))` |
| Priorité | matrice canonique (`a11y-<règle>`) |

### 4.3 SEOAnalyzer — `src/analysis/seo.ts`

Source : audits SEO en échec de Lighthouse.

- **Sévérité** : `error→3`, `warning→2`, `info→1`.
- **Effort** : `meta`/`title` → 1 · `heading`/`structure` → 2 · `link`/`image` → 3 · sinon 2.
- **Impact** : `sévérité + 1` (le SEO porte directement sur le trafic).
- **Recommandations** ciblées par type d'audit (meta description 150-160 caractères, titre 50-60, hiérarchie de headings, texte des liens, `alt` des images), repli générique `Corriger le problème : …`.
- `id` : `seo-<titre en kebab-case>`.

### 4.4 UXAnalyzer — `src/analysis/ux.ts`

Source : heuristiques de Nielsen évaluées par le Sprint 8.

- Seules les heuristiques **score < 100** produisent un constat.
- **Sévérité** : ≥ 80 → 1 · ≥ 60 → 2 · ≥ 40 → 3 · sinon 4.
- **Effort** : 0 constat → 1 · ≤ 2 → 2 · ≤ 5 → 3 · au-delà → 4.
- **Impact** : `sévérité + 1`.
- **Recommandation** : table des 10 heuristiques (`HEURISTIC_RECOMMENDATIONS`),
  repli `Améliorer l'heuristique : <nom>`.

### 4.5 ContentAnalyzer — `src/analysis/content.ts`

Source : métriques de contenu du Sprint 8.

| Métrique | Seuils | Constats |
| --- | --- | --- |
| Mots | < 300 insuffisant (sev 3) · 300-599 à enrichir (sev 2) | `content-word-count-low` / `-medium` |
| Lisibilité (Flesch) | < 30 très faible (sev 4) · < 50 faible (sev 3) · < 60 moyenne (sev 2) | `content-readability-poor` / `-low` / `-medium` |
| Temps de lecture | < 1 min trop court (sev 2) · > 15 min très long (sev 1) | `content-reading-time-short` / `-long` |

Chaque constat porte un `metric` (valeur, seuil, unité) directement affichable.

## 5. Priorisation

`FindingPrioritizer` :

- **`prioritize`** : recalcule chaque priorité avec la matrice (les priorités
  déclarées par les analyseurs sont indicatives — le rapport ne retient que le
  recalcul uniforme) et trie décroissant, **sans muter** le tableau d'entrée ;
- **`groupByPriority`** / **`groupByDimension`** : répartitions pour le rapport ;
- **`generateExecutiveSummary`** : une phrase par priorité non nulle ;
- **`findQuickWins`** : sévérité ≥ 3 et effort ≤ 2 (fort gain, petit chantier) ;
- **`findBigBets`** : sévérité ≥ 3 et effort ≥ 4 (chantiers structurants).

### Score global

`AnalysisPipeline` calcule une moyenne pondérée arrondie :

| Dimension | Poids |
| --- | --- |
| Performance | 25 % |
| Accessibilité | 25 % |
| SEO | 20 % |
| UX | 15 % |
| Contenu | 15 % |

## 6. Pont inspection → analyse — `src/analysis/adapter.ts`

Les types des deux côtés ont évolué séparément ; **trois écarts sont traduits
uniquement ici** :

| Écart | Traduction |
| --- | --- |
| `CoreWebVitals.inp` (Sprint 8) | → `metrics.fid` (contrat C9.1) |
| `ContentAnalysis` plat | → `metrics.{wordCount, readingTime, readabilityScore}` |
| Tableaux `readonly` | recopiés dans des tableaux modifiables |

API : `toLighthouseResults`, `toAxeResults`, `toUxResults`, `toContentResults`,
et `fromInspection(result)` qui regroupe les quatre à partir des champs
`lighthouse`/`axe`/`ux`/`content` d'un résultat L3.

**Inspection dégradée** : si `lighthouse` ou `axe` est `null` (outil indisponible,
voir `warnings`), `fromInspection` **lève une erreur explicite** — jamais un
score inventé, conformément à la règle du projet.

## 7. Utilisation

### Analyse complète (après inspection)

```ts
import { Inspector } from './browser/inspection/inspector.js';
import { AnalysisPipeline } from './analysis/pipeline.js';
import { fromInspection } from './analysis/adapter.js';

const inspection = await new Inspector().inspect({ url: 'https://example.com', level: 'L3' });
const inputs = fromInspection(inspection);
const report = await new AnalysisPipeline().analyze(
  inspection.url,
  inputs.lighthouse,
  inputs.axe,
  inputs.ux,
  inputs.content,
);

console.log('Score global :', report.summary.overallScore);
console.log('Constats :', report.summary.totalFindings);
console.log(report.priorityFindings[0]?.recommendation);
```

### Analyse individuelle

```ts
import { PerformanceAnalyzer } from './analysis/performance.js';

const score = new PerformanceAnalyzer().analyze(lighthouseResults);
console.log(score.summary); // « Score performance : 100/100. Aucun problème… »
```

## 8. Performance

- **C9.14** : analyse de 100+ constats en **< 5 s** — test automatisé
  (`pipeline.test.ts`, « analyse 100 constats en moins de 5 secondes »).
- Le pipeline est synchrone en interne (promesse résolue sans I/O) : aucun
  réseau, aucune navigation, aucune base — le coût réel est le microcalcul.

## 9. Tests et validation

```powershell
npm test tests/analysis/
npm run verify
```

| Jeu | Fichiers | Cas |
| --- | --- | --- |
| Sprint 9-1 | performance, accessibility | 15 |
| Sprint 9-2 | seo, ux, content | 23 |
| Sprint 9-3 | severity, prioritizer, pipeline, adapter, integration | 39 |
| **Total** | **10** | **76 + 1 conditionnel** |

- Couverture `src/analysis/` : **97,9 % instructions / 94,6 % branches / 100 % fonctions**.
- Le test d'intégration **en ligne** (inspection réelle d'example.com) est
  conditionnel au motif établi du dépôt :

```powershell
$env:EKTS_BROWSER_ONLINE = "1"; npm test tests/analysis/
```

```bash
EKTS_BROWSER_ONLINE=1 npx vitest run tests/analysis/
```

## 10. Dépannage

| Symptôme | Cause probable | Remède |
| --- | --- | --- |
| `Lighthouse est indisponible pour cette inspection` | inspection dégradée (outil null) | lire `inspection.warnings`, relancer l'inspection ; l'analyse refuse de deviner |
| `fid` vaut 0 alors que la page est rapide | pont non utilisé : entrées construites à la main | passer par `fromInspection` ou renseigner `fid` (INP) explicitement |
| Priorités du rapport ≠ priorités des analyseurs | **normal** : le rapport recalcule via la matrice | voir §5 |
| `AssertionError` sur un tri | constat ajouté sans passer par `prioritize` | le tri n'est garanti que sur `priorityFindings` |
| Test d'intégration absent du décompte | `EKTS_BROWSER_ONLINE` non défini | voir §9 |

## 11. Écarts au plan

| # | Écart | Arbitrage |
| --- | --- | --- |
| E9-1 | Pont explicite `adapter.ts` (non listé au plan mais nécessaire : `inp`→`fid`, contenu plat→`metrics`, `readonly`) | Un seul point de traduction, testé à 100 % |
| E9-2 | Test d'intégration réseau conditionnel (`EKTS_BROWSER_ONLINE=1`) au lieu d'un test permanent | Pattern établi du dépôt (§9) ; un test d'intégration sur fixtures réelles tourne en permanence |
| E9-3 | `analyze()` non-`async` (promesse résolue sans I/O) | API identique (`Promise`), zéro dépendance à `require-await` |
| E9-4 | Résumés : comptes assemblés en liste (pas de virgule finale) ; UX/contenu complétés par `mineur(s)` | Bug cosmétique de la spécification, corrigé en Sprint 9-2 |
| E9-5 | Comptes du `summary` calculés sur `priorityFindings` (priorités recalculées) | Le résumé doit refléter le rapport trié, pas les priorités indicatives |
| E9-6 | Tests supplémentaires hors comptes de la fiche (+ couverture des paliers et recommandations) | Exigé par C9.9 (> 80 %) |

## 12. Références

- [Core Web Vitals](https://web.dev/vitals/) — seuils LCP/INP/CLS
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — règles axe-core
- [Nielsen heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Flesch Reading Ease](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
- [Search Central](https://developers.google.com/search/docs) — recommandations SEO
- `docs/INSPECTOR.md` — collecte des données en amont (Sprint 8)
