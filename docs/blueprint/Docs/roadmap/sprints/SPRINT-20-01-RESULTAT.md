# SPRINT-20-01 — Identité des métriques et interprétation — résultat

**Sprint parent :** [SPRINT-20](SPRINT-20.md) · **Sous-sprint :** [SPRINT-20-01](SPRINT-20-01.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `556611c` · **Contrat amont :** [SPRINT-20-01-CONTRAT-PROPOSITION.md](SPRINT-20-01-CONTRAT-PROPOSITION.md)
**Statut :** ✅ critères C-W08 satisfaits et testés ; ⚠️ C-W10 **préparé mais non certifié** — la revue humaine reste due.

## 1. Décisions humaines reçues avant code

| # | Question | Réponse retenue |
| --- | --- | --- |
| D1 | Forme du contrat | `MetricReading` enveloppe `Measurement` du 19-03 (contrat clos non rouvert) |
| D2 | Repli `INP → max-potential-fid` et alias `inp → fid` | **Supprimés** |
| D3 | Seuils | INP 200/500 ms, TBT 200/600 ms, FID 100/300 ms, `max-potential-fid` sans seuil |
| D4 | Constats | `Finding.metric.unit` obligatoire, `origin` ajouté |

## 2. Pré-vol et état Git réel

```text
origin/develop = 398df3e     (30/10 12:00)
git log HEAD..origin/develop → vide (develop est un ancêtre de la branche)
ad5cd35 / fc6bfa4 / 556611c  → ABSENTS de develop
```

**Contradiction déclarée au propriétaire :** le merge effectué « à son niveau » couvre l'état antérieur au Sprint 19 (`c0610ae`, 29/10). Aucun des neuf commits du Sprint 19 n'est dans `develop`. Le propriétaire a néanmoins considéré le prérequis satisfait pour engager le Sprint 20.

## 3. Tests écrits **avant** le code (protocole)

### 3.1 Baseline avant modification

```text
npx vitest run tests/browser/lighthouse.test.ts tests/analysis/performance.test.ts \
                tests/analysis/adapter.test.ts tests/analysis/measurement-availability.test.ts
→ Test Files  4 passed (4)
  Tests       50 passed (50)
```

### 3.2 RED comportemental (verbatim)

```text
npx vitest run tests/analysis/metric-identity.test.ts
→ FAIL U1 — expected 120 to match object { id: 'inp', unit: 'ms', …(2) }
  FAIL U2 — expected undefined to deeply equal { status: 'unavailable', …(1) }
  FAIL U3 — expected undefined to deeply equal { status: 'unavailable', …(1) }
  FAIL U4 — expected undefined to match object { id: 'tbt', unit: 'ms', …(2) }
  FAIL U5 — expected undefined to deeply equal { status: 'unavailable', …(1) }
  FAIL I1 — expected [] to include 'perf-inp-warning'
  FAIL I2 — expected [] to include 'perf-tbt-critical'
  Tests  7 failed (7)
```

Aucune de ces sept erreurs n'est une erreur d'import ou de type : toutes sont des
**assertions de comportement** (valeur observée ≠ valeur attendue), conformément
à l'exigence du dossier.

### 3.3 GREEN après correction minimale

```text
npx vitest run tests/analysis/metric-identity.test.ts
→ Test Files  1 passed (1)
  Tests       7 passed (7)
```

## 4. Mesures finales (exécutées, non estimées)

```text
npm run verify → EXIT=0
  typecheck  : tsc --noEmit (0 erreur)
  lint       : eslint (0 erreur)
  format     : prettier --check (conforme)
  build      : succès
  tests      : 1742 passed | 38 skipped (1780)
  couverture : statements 95,99 % · branches 89,17 % · fonctions 97,37 % · lignes 96,17 %
```

Suite complète isolée, avant le dernier ajout de test :

```text
npx vitest run → Test Files 140 passed | 6 skipped (146) · Tests 1739 passed | 38 skipped (1777)
```

Les **38 cas ignorés** sont ceux du Sprint 19-03 (navigateur/PDF indisponibles dans
ce bac à sable) : ils ne sont ni exécutés ni comptés comme réussites.

## 5. Contrat livré

```ts
export type WebVitalId = 'lcp' | 'inp' | 'fid' | 'max-potential-fid' | 'tbt' | 'cls' | 'ttfb' | 'fcp' | 'speed-index';
export type MetricUnit = 'ms' | 'unitless';
export type MetricOrigin = 'lab' | 'field' | 'unknown';
export interface MetricReading { id; unit; origin; measurement: Measurement }
export interface WebVitals { lcp; inp; fid; maxPotentialFid; tbt; cls; ttfb; fcp; speedIndex }
```

- Les **neuf** lectures existent toujours : une métrique absente porte
  `measurement: { status: 'unavailable', reason: … }`, jamais `0`.
- `extractCoreWebVitals` ne renomme plus et **ne replie plus** INP vers
  `max-potential-fid` ; `fid` n'est alimenté que par un audit
  `first-input-delay` réellement présent.
- `PerformanceAnalyzer` applique **les seuils de la métrique concernée** et
  produit `perf-inp-*` et `perf-tbt-*` en plus de `perf-fid-*`.

## 6. Critères

| Critère | Statut | Preuve |
| --- | --- | --- |
| **C-W08 / W04** (5/5) | ✅ | `tests/analysis/metric-identity.test.ts` : U1 (INP seul), U2 (FID absent + max-potential-fid), U3 (max-potential-fid seul), U4 (TBT seul), U5 (les quatre absentes) — 5/5 verts |
| **C-W10 / W05** (3/3, revue humaine) | ⚠️ **préparé** | `tests/e2e/score-limitations.test.ts` : 3 rapports synthétiques (axe 0, UX 100, axe indisponible) ; les rendus signalent la limite. La **certification humaine** des 3 rendus reste due |

## 7. Fichiers modifiés (31)

**Source (10)** : `src/analysis/{measurement,types,adapter,performance,content}.ts`,
`src/browser/{lighthouse}.ts`, `src/browser/inspection/types.ts`,
`src/reports/templates/{markdown,html}.ts`, `src/reports/templates/limitations.ts` (nouveau).

**Documentation (2)** : `docs/ANALYSIS.md`, `docs/INSPECTOR.md`.

**Tests (17)** : `tests/analysis/{metric-identity(nouveau),performance,adapter,measurement-availability,integration,pipeline,seo,canonical-priority}.test.ts`,
`tests/browser/lighthouse.test.ts`, `tests/cli/inspect.test.ts`,
`tests/e2e/{score-limitations(nouveau),comparison-flow,report-formats,audit-canonical-flow}.test.ts`,
`tests/mcp/context.test.ts`, `tests/reports/score-unavailable.test.ts`,
`tests/storage/integration.test.ts`, `tests/integration/audit-migration-010.test.ts`.

**Documents (2)** : ce rapport, `SPRINT-20-01-CONTRAT-PROPOSITION.md`.

## 8. Écarts déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E20-1** | Les fixtures I1/I2 du nouveau test ont été complétées (`fcp`, `speedIndex`) après le RED : le contrat exige neuf lectures, une fixture à sept clés n'est pas une entrée valide | Déclaré ; **les assertions sont identiques** entre RED et GREEN |
| **E20-2** | `tests/analysis/integration.test.ts` attendait un constat `perf-fid-warning` dérivé d'une valeur d'INP (150 ms). Ce constat disparaît : le FID n'est pas mesuré et l'INP à 150 ms est sous son seuil « bon » | Assertion remplacée par la vérité nouvelle (aucun constat FID substitué ; INP conservé en lecture). Comportement **voulu** par D2 |
| **E20-3** | `numericValue()` de `lighthouse.ts` est devenu inutilisé et a été remplacé par `rawValue()`, qui distingue `undefined` (audit absent) de `null` (valeur explicitement nulle) | Suppression, gain de précision sur la raison d'indisponibilité |
| **E20-4** | `MetricOrigin` réserve `field`, mais **aucune source de terrain n'est branchée** | Déclaré : le type ne fabrique aucune donnée |
| **E20-5** | `Finding.metric.unit` devenu obligatoire : `content.ts` fournit désormais `points Flesch` | Aucun changement de valeur, seule l'unité manquait |

## 9. Bloqué / non prouvé

- **C-W10** : les trois rapports sont générés et vérifiés automatiquement, mais
  la revue humaine demandée par le critère (« H ») **n'est pas faite**.
- **Mesure terrain** : aucune. Aucun test E2E navigateur ou PDF n'a pu être
  exécuté dans ce bac à sable (38 cas ignorés, inchangés depuis 19-03).
- **CI distante** : non observée ; `npm run verify` local uniquement.

## 10. Commandes exactes de reproduction

```powershell
npx vitest run tests/analysis/metric-identity.test.ts tests/e2e/score-limitations.test.ts
npm run verify
```

## 11. Suite

20-02 (preuves minimales et reprise partielle) ne démarre qu'après ce rapport et
les validations éventuelles. Aucun push, aucune PR, aucune fusion n'a été effectué
par l'agent pour ce sous-sprint : les commits sont **locaux** sur la branche Arena.
