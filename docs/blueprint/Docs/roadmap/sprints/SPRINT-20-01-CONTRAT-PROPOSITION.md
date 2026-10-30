# SPRINT-20-01 — Proposition de contrat des métriques (W04 / C-W08)

**Sprint parent :** [SPRINT-20](SPRINT-20.md) · **Sous-sprint :** [SPRINT-20-01](SPRINT-20-01.md) · **Date :** 30 octobre 2026
**Statut :** 📝 **proposition soumise à validation — aucun code, aucun test et aucun commit de ce sous-sprint n'existe encore.**
**Révision de référence :** `556611c` (branche `arena/079e2f26-engineering-knowledge-tooling`).

> Ce document remplit l'étape 2 de la séquence opérationnelle du sous-sprint (« formaliser les cas et l'oracle avant tout changement fonctionnel ») pour la partie **contrat**. Le protocole impose une validation humaine avant mise en œuvre : les décisions D1 à D4 ci-dessous attendent un accord explicite.

## 1. Faits observés dans le code (relevés, non déduits)

| # | Fait | Preuve |
| --- | --- | --- |
| F1 | Le repli `INP → max-potential-fid` existe dans le collecteur Lighthouse | `src/browser/lighthouse.ts` : `extractCoreWebVitals()` lit `interaction-to-next-paint`, sinon `max-potential-fid`, et range le résultat sous la clé `inp` |
| F2 | La valeur d'INP est **réétiquetée `fid`** lors de l'adaptation | `src/analysis/adapter.ts` : `fid: toMeasurement(analysis.performance.metrics.inp)` |
| F3 | Le type le documente comme un choix assumé, pas comme une erreur de typage | `src/analysis/types.ts`, champ `fid` : « Depuis le Sprint 8, la valeur provient d'INP — successeur du FID — avec repli sur `max-potential-fid` » |
| F4 | **Aucune trace de TBT** (`total-blocking-time`) dans le dépôt | `grep -rn "tbt\|total-blocking" src/` → 0 résultat avant recherche de cette proposition |
| F5 | Ni unité, ni origine (laboratoire / terrain / inconnue) ne sont portées par le contrat actuel | `src/analysis/types.ts` : `metrics: { lcp, fid, cls, ttfb: Measurement }` |
| F6 | Les métriques ne sont **pas persistées** : aucune colonne, aucune table | `grep -rn "metrics" src/storage/schema.ts` → 0 résultat |
| F7 | Les métriques ne sont **pas rendues** dans les rapports : seul le texte des constats les mentionne | `src/reports/templates/markdown.ts` n'affiche que titres / recommandations ; `grep -rn "\.metric\b" src/` ne trouve que des producteurs (`performance.ts`, `content.ts`), aucun consommateur |
| F8 | Les seuils appliqués à la valeur INP sont ceux du FID | `src/analysis/performance.ts` : `PERFORMANCE_THRESHOLDS.fid = { good: 100, needsImprovement: 300 }` consommés par `analyzeFID()` |
| F9 | `Finding.metric.unit` est **optionnel** et `Finding.metric` n'a pas d'origine | `src/analysis/types.ts`, `metric?: { name; value; threshold?; unit? }` |
| F10 | Les mesures d'une dimension sont un dictionnaire libre, **sans unité ni origine** | `src/analysis/types.ts` : `measurements?: Record<string, Measurement>` |

**Conséquence directe de F6 et F7 :** C-W08 ne peut pas être satisfait par une correction de rendu, puisqu'il n'y a aucun rendu. Le critère porte sur les **sorties réelles** : l'objet de résultat d'inspection, les constats produits, et ce qu'un utilisateur peut lire. Il faut donc soit exposer les métriques, soit démontrer que les sorties existantes portent bien identité, unité et contexte. La proposition ci-dessous choisit la première voie, la seule qui rende C-W08 observable.

## 2. Ce que C-W08 exige (22, ligne 119)

- **5 jeux de métriques et contextes** : INP seul, FID seul, max-potential-fid seul, TBT seul, les quatre absents.
- **5/5** sorties conservent identité, unité et contexte connu ; **aucune** équivalence ni étiquette de substitution ; **absence non numérique**.
- W04 (21, ligne 154) ajoute : TBT reste distinct, origine laboratoire / terrain / inconnue si connue, sinon `inconnu`, et « absence ≠ zéro ».
- C-W10 (interprétation) est un critère de **revue humaine** : il sera traité dans le rapport, pas auto-certifié.

## 3. Contrat proposé

### 3.1 Principe de compatibilité avec le Sprint 19-03

Le type `Measurement` validé en 19-03 (`{status:'measured',value}` | `{status:'unavailable',reason}`) **n'est pas modifié** : le contrat 19-03 est clos et n'est pas rouvert. L'unité et l'origine sont portées **à côté** de la mesure, par un type enveloppant.

### 3.2 Types proposés (`src/analysis/measurement.ts`)

```ts
/** Identité d'une métrique — une métrique ne change jamais de nom en sortie. */
export type WebVitalId =
  'lcp' | 'inp' | 'fid' | 'max-potential-fid' | 'tbt' | 'cls' | 'ttfb';

/** Unité explicite. `unitless` pour CLS (score sans dimension). */
export type MetricUnit = 'ms' | 'unitless';

/** Origine de la mesure (W04). `unknown` quand la source ne l'établit pas. */
export type MetricOrigin = 'lab' | 'field' | 'unknown';

/** Lecture complète : identité + unité + origine + mesure (19-03 inchangée). */
export interface MetricReading {
  readonly id: WebVitalId;
  readonly unit: MetricUnit;
  readonly origin: MetricOrigin;
  readonly measurement: Measurement;
}

/** Les sept métriques suivies, chacune toujours présente comme lecture. */
export interface WebVitals {
  readonly lcp: MetricReading;
  readonly inp: MetricReading;
  readonly fid: MetricReading;
  readonly maxPotentialFid: MetricReading;
  readonly tbt: MetricReading;
  readonly cls: MetricReading;
  readonly ttfb: MetricReading;
}
```

Une métrique non fournie n'est **pas** omise : elle est présente avec `measurement: { status: 'unavailable', reason: 'absent' }`. C'est ce qui rend le dénominateur 5/5 vérifiable — une clé manquante serait indiscernable d'un oubli d'implémentation.

### 3.3 Effet sur les producteurs

- `extractCoreWebVitals()` (`src/browser/lighthouse.ts`) : construit les sept lectures avec `origin: 'lab'`, unité par métrique (`cls` → `unitless`, les six autres → `ms`).
  - `inp` ← audit `interaction-to-next-paint` **uniquement** ;
  - `maxPotentialFid` ← audit `max-potential-fid` **uniquement** ;
  - `fid` ← audit `first-input-delay` **s'il est présent** dans le rapport, sinon `unavailable`. Aucun autre audit n'alimente `fid` (voir D2) : aucune source n'est inventée ;
  - `tbt` ← audit `total-blocking-time`.
- `LighthouseResults.performance.metrics: WebVitals` (remplace les quatre champs).
- `PerformanceAnalyzer.analyze()` : un constat n'est produit que depuis une lecture mesurée, et le constat porte **l'identité réelle** de la métrique (`INP`, `FID`, `TBT`…), son unité et son origine.

### 3.4 Effet sur les consommateurs (compatibilité interne)

| Consommateur | Aujourd'hui | Après |
| --- | --- | --- |
| `src/analysis/adapter.ts` | `fid: toMeasurement(metrics.inp)` | `fid`, `inp`, `tbt`, `maxPotentialFid` recopiés **sans renommage** |
| `src/browser/lighthouse.ts` (doc + test) | clés `lcp/inp/cls/ttfb/fcp/speedIndex` | sept lectures + `fcp`/`speedIndex` inchangés |
| `tests/analysis/performance.test.ts`, `adapter.test.ts`, `measurement-availability.test.ts` | fixtures à quatre métriques | fixtures à sept lectures |
| `DimensionScore.measurements` | `Record<string, Measurement>` (F10), clés `lcp/fid/cls/ttfb` | mêmes clés **plus** `inp`, `maxPotentialFid`, `tbt` ; l'unité et l'origine restent portées par `MetricReading` |
| Surface publique `src/index.ts` | n'exporte **rien** de Lighthouse | inchangé : aucune rupture d'API publiée |

### 3.5 Migration et données historiques

- **Aucune migration n'est nécessaire** : les métriques ne sont pas persistées (F6). Aucune base existante n'est lue différemment.
- **Aucun audit historique n'est réécrit** : les rapports déjà stockés ne contiennent que des constats ; ceux qui affichent « FID » pour une valeur INP restent inchangés (W06 : pas de réécriture silencieuse). L'écart est **déclaré** au rapport de sous-sprint, pas corrigé rétroactivement.

## 4. Décisions soumises à validation

| # | Décision | Recommandation | Alternative |
| --- | --- | --- | --- |
| **D1** | Où placer unité et origine | **`MetricReading` enveloppant** `Measurement` (19-03 intact) | Étendre `Measurement` ⇒ rouvre un contrat clos : déconseillé |
| **D2** | Sort du repli `INP → max-potential-fid` et de l'alias `inp → fid` | **Suppression des deux.** `fid` devient `unavailable` en laboratoire : c'est la vérité, et cela supprime des constats « FID » fondés sur INP | Conserver le repli ⇒ C-W08 échoue (équivalence interdite) |
| **D3** | Seuils des nouvelles métriques | INP : 200 / 500 ms ; TBT : 200 / 600 ms ; FID : 100 / 300 ms (inchangé) ; max-potential-fid : **pas de seuil**, lecture seule | Ne produire aucun constat pour INP/TBT ⇒ régression fonctionnelle inutile |
| **D4** | Enrichissement de `Finding.metric` | `unit` **obligatoire** + `origin` ajouté | Laisser optionnel ⇒ C-W08 non démontrable sur les constats |

**D3 est le seul point qui crée des constats nouveaux** (TBT) et déplace des seuils (INP). Il relève d'une décision produit : je ne l'applique pas sans accord.

## 5. Plan de tests à écrire **avant** le code

### 5.1 Unitaires — dénominateur 5/5 (C-W08)

| Cas | Fixture | Assertion attendue (échec aujourd'hui) |
| --- | --- | --- |
| U1 INP seul | rapport Lighthouse avec `interaction-to-next-paint` seul | `inp` mesuré (ms, lab) ; `fid`, `maxPotentialFid`, `tbt` indisponibles ; **aucun** constat libellé « FID » |
| U2 FID seul | rapport sans `first-input-delay` ni INP, avec `max-potential-fid` | `fid` **indisponible** ; `maxPotentialFid` mesuré et **nommé** `max-potential-fid` (aucune substitution) |
| U3 max-potential-fid seul | audit `max-potential-fid` seul | lecture `maxPotentialFid` mesurée ; `inp` indisponible ; pas de constat INP |
| U4 TBT seul | audit `total-blocking-time` seul | `tbt` mesuré (ms, lab) ; constat TBT si seuil franchi |
| U5 les quatre absents | rapport sans aucune de ces clés | sept lectures `unavailable`, raisons explicites, **aucune valeur `0`**, aucun constat |

### 5.2 Intégration — du résultat navigateur au rendu

- I1 : `extractCoreWebVitals` → `PerformanceAnalyzer` → `AuditReport` ⇒ identité conservée de bout en bout (aucune clé renommée).
- I2 : constat issu d'INP ⇒ `metric.name === 'INP'`, `unit === 'ms'`, `origin === 'lab'`.

### 5.3 E2E — trois situations d'interprétation (C-W10, préparation)

Rapport synthétique généré depuis une base temporaire contenant : axe = 0 par saturation, UX = 100 sur règles limitées, axe indisponible. **Ces trois rapports seront produits pour revue humaine ; ils ne sont pas auto-certifiés.**

### 5.4 CI

Aucune fixture réseau, aucun site tiers, aucune dépendance nouvelle. Le raccordement se limite à `npm run verify`, déjà en place.

## 6. Ce que cette proposition ne promet pas

- Aucune mesure **terrain** réelle : `origin: 'field'` existera dans le type mais **aucune source terrain n'est branchée**. Le rapport le déclarera.
- Aucune garantie SSRF, WCAG ou UX parfaite (hors périmètre, respectivement 20-03 et C-W10).
- Aucune réécriture d'audit historique.
- Aucune publication, aucun push, aucune PR.

## 7. Estimation d'impact (indicative, non engagée)

| Zone | Fichiers | Nature |
| --- | --- | --- |
| Contrat | `src/analysis/measurement.ts`, `src/analysis/types.ts`, `src/browser/inspection/types.ts` | ajout de types, retrait de quatre champs |
| Producteur | `src/browser/lighthouse.ts` | sept lectures, `origin`/`unit` |
| Analyse | `src/analysis/adapter.ts`, `src/analysis/performance.ts` | suppression du renommage, seuils par métrique |
| Constats | `src/analysis/types.ts` (`Finding.metric`) | `unit` obligatoire, `origin` |
| Tests | `tests/browser/lighthouse.test.ts`, `tests/analysis/{performance,adapter,measurement-availability}.test.ts` | fixtures + 5 cas U |
| Documentation | ce dossier, `SPRINT-20-01-RESULTAT.md`, registre | faits et écarts |

**Aucun de ces changements n'a été effectué.** Le dépôt est propre à `556611c` ; seul ce document est nouveau.
