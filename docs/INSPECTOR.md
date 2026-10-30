# Inspecteur — 4 niveaux d'inspection

**Version :** 1.0
**Date :** 23 octobre 2026
**Sprint :** 8 (4 Niveaux d'Inspection)
**Bibliothèques :** `lighthouse` 13.5.0, `@axe-core/playwright` 4.14.0, Playwright 1.64.1
**Point d'entrée :** `src/browser/inspection/inspector.ts`

---

## 1. Objectif

L'inspecteur produit, pour une URL, un **rapport sérialisable** qui décrit la
page selon trois profondeurs emboîtées :

| Niveau | Nom | Budget | Contenu |
| --- | --- | --- | --- |
| **L1** | Rapide | < 10 s | Capture, arbre ARIA, métadonnées, photographie du DOM |
| **L2** | Standard | < 30 s | L1 + Lighthouse (Core Web Vitals) + SEO |
| **L3** | Approfondie | < 60 s | L2 + axe-core (WCAG 2.2 AA) + UX (Nielsen) + contenu |

`L3 ⊃ L2 ⊃ L1` : chaque niveau contient intégralement le précédent. Le niveau
L4 (crawling multi-pages) est **hors périmètre** (reporté après MVP-2).

### 1.1 Ce que l'inspecteur fait

- ouvre une session Playwright, navigue, referme tout (y compris en erreur) ;
- mesure et **signale** le dépassement de budget (`withinBudget`) ;
- écrit capture, trace, PDF et rapport JSON dans un dossier de sortie ;
- dégrade une analyse secondaire en la consignant dans `warnings` ;
- produit des notes expliquées (SEO, axe, UX, contenu) et non un score unique.

### 1.2 Ce que l'inspecteur ne fait pas

- il **n'écrit pas en base** : l'indexation est le travail du Sprint 10 ;
- il **ne crawle pas** : une URL, une page (L4 exclu) ;
- il **ne juge pas la pertinence** du propos : le contenu est mesuré, pas évalué ;
- il **ne contourne pas** les protections d'un site (CSP, anti-bot) : l'échec est
  rapporté, pas forcé.

---

## 2. Prérequis

| Élément | Exigence | Vérification |
| --- | --- | --- |
| Node.js | ≥ 22.19.0 (`engines`) | `node --version` |
| npm | ≥ 10.9.0 | `npm --version` |
| Dépendances | `npm ci` | `npm ls lighthouse @axe-core/playwright` |
| Binaires Playwright | Chromium obligatoire pour L2/L3 | `npx playwright install --list` |
| Réseau | accès à l'URL inspectée | `Invoke-WebRequest https://exemple.fr -Method Head` |

**Lighthouse fonctionne sans Chrome système** : il se connecte au Chromium de
Playwright par le protocole de débogage. Aucun Chrome Stable n'a besoin d'être
installé.

**Firefox et WebKit ne peuvent pas exécuter L2/L3** : Lighthouse exige Chromium.
L'analyse est alors ignorée et signalée (`warnings`), sauf en mode `strict` où
elle lève.

---

## 3. Installation

```powershell
cd C:\dev\engineering-knowledge-tooling-system
npm ci
npm run browsers:install
npm ls lighthouse @axe-core/playwright
```

Résultat attendu :

```text
ekts@0.1.0
├── @axe-core/playwright@4.14.0
└── lighthouse@13.5.0
```

Vérification :

```powershell
npm run typecheck
npm run test:browser
```

---

## 4. Architecture

### 4.1 Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/browser/inspection/types.ts` | Contrats, budgets, niveaux |
| `src/browser/inspection/snapshot.ts` | Photographie du DOM en une évaluation |
| `src/browser/inspection/level-1.ts` | Capture, accessibilité ARIA, métadonnées |
| `src/browser/inspection/level-2.ts` | L1 + Lighthouse + SEO |
| `src/browser/inspection/level-3.ts` | L2 + axe-core + UX + contenu |
| `src/browser/inspection/inspector.ts` | Orchestrateur, cycle de vie, artefacts, rapport |
| `src/browser/inspection/seo.ts` | Règles SEO, score expliqué |
| `src/browser/inspection/ux.ts` | Heuristiques de Nielsen observables |
| `src/browser/inspection/content.ts` | Volume, lecture, lisibilité Flesch |
| `src/browser/lighthouse.ts` | Analyseur Lighthouse, port CDP, conversion du rapport |
| `src/browser/axe.ts` | Analyseur axe-core, score pondéré |
| `src/browser/lighthouse-module.d.ts` | Déclaration de types minimale de Lighthouse |

### 4.2 Enchaînement

```text
Inspector.inspect({ url, level })
        │
        ├─ resolveOptions()        défauts, validation, niveau
        ├─ findFreePort()          port CDP (L2/L3, Chromium seulement)
        ├─ Navigator.start()       moteur + contexte (viewport, user-agent)
        ├─ Navigator.goto()        navigation mesurée
        │
        ├─ L1  screenshot → arbre ARIA → photographie du DOM
        ├─ L2  L1 → Lighthouse(port) → analyse SEO sur la photographie
        └─ L3  L2 → axe-core(page)  → UX + contenu sur la photographie
        │
        ├─ rapport JSON (+ capture, trace, PDF)
        └─ Navigator.stop()        toujours, y compris en erreur
```

### 4.3 Trois décisions de conception

**Une seule photographie du DOM.** La page est traversée **une fois** par une
expression JavaScript sérialisée (`PAGE_SNAPSHOT_EXPRESSION`), dont le résultat
est normalisé champ par champ en TypeScript. Les analyses SEO, UX et contenu
sont ensuite **pures** : testables sans réseau, comparables entre moteurs.

**Des analyseurs injectables.** `LighthouseAnalyzer` et `AxeAnalyzer` reçoivent
un exécutant (`LighthouseRunner`, `AxeRunner`). Les tests fournissent des
doublures ; la production charge le paquet réel à la demande, si bien qu'une
inspection L1 ne paie pas 24 Mo de dépendances.

**Dégradation plutôt qu'échec silencieux.** Un outil indisponible produit un
`warning` explicite et un champ `null`, jamais un score inventé. En mode
`strict`, l'échec est propagé — utile en CI pour ne pas laisser passer une
régression déguisée en dégradation.

---

## 5. Utilisation

### 5.1 API

```ts
import { Inspector } from './src/browser/inspection/inspector.js';

const inspector = new Inspector();

// Niveau 1 : rapide, sans Lighthouse.
const l1 = await inspector.inspect({ url: 'https://exemple.fr' });

// Niveau 3 : complet, avec rapport JSON sur disque.
const { result, reportPath } = await inspector.inspectAndSave({
  url: 'https://exemple.fr',
  level: 'L3',
  outputDir: 'artifacts/inspections/exemple',
  trace: true,
  pdf: true,
});

console.log(result.level, result.duration, result.withinBudget);
console.log(reportPath);
```

### 5.2 Options

| Option | Défaut | Effet |
| --- | --- | --- |
| `url` | — (requis) | URL absolue `http`/`https` |
| `level` | `'L1'` | `'L1'`, `'L2'` ou `'L3'` |
| `viewport` | `1920 × 1080` | Taille du contexte |
| `userAgent` | celui du moteur | User-agent du contexte |
| `timeout` | `30 000` ms | Délai de navigation et de chargement Lighthouse |
| `browserKind` | `'chromium'` | `'chromium'`, `'firefox'`, `'webkit'` |
| `outputDir` | `artifacts/inspections` | Dossier des artefacts |
| `screenshot` | `true` | Capture PNG pleine page |
| `trace` | `false` | Trace Playwright (ZIP) |
| `pdf` | `false` | Impression PDF (Chromium seulement) |
| `strict` | `false` | Échoue au premier outil indisponible |

### 5.3 Ligne de commande

Le script `scripts/inspect.mjs` (script npm `inspect`) sert à **mesurer les
budgets sur le poste réel**, là où les binaires sont installés.

```powershell
npm run build                      # le script consomme dist/
npm run inspect -- https://exemple.fr          # L1 par défaut
npm run inspect -- https://exemple.fr L2
npm run inspect -- https://exemple.fr L3 --save --dir artifacts/inspections/demo
```

Sortie attendue (extrait) :

```text
Inspection L2 — https://exemple.fr
Durée          : 11.82 s (budget 30 s) ✅
Accessibilité  : arbre ARIA 412 nœuds, 3 violation(s)
Lighthouse     : performance 92/100, SEO 80/100
Core Web Vitals: LCP 1832 ms · INP 121 ms · CLS 0.054 · TTFB 211 ms
```

Codes de sortie : `0` succès, `1` inspection impossible, `2` usage incorrect.
Le script n'ajoute aucune logique : il traduit les arguments et appelle
`Inspector`.

### 5.4 Rapport

```jsonc
{
  "level": "L3",
  "url": "https://exemple.fr",
  "timestamp": "2026-10-23T15:40:00.000Z",
  "duration": 18234,
  "budget": 60000,
  "withinBudget": true,
  "metadata": {
    "title": "…",
    "description": "…",
    "language": "fr",
    "httpStatus": 200,
    "loadTime": 412,
    "viewport": { "width": 1920, "height": 1080 }
  },
  "accessibility": {
    "nodeCount": 412,
    "violations": [{ "rule": "image-alt", "impact": "serious", "message": "…" }],
    "counts": { "minor": 0, "moderate": 1, "serious": 2, "critical": 0 }
  },
  "lighthouse": { "performance": { "score": 92, "metrics": { "lcp": 1832.4 } }, "seo": { "score": 80 } },
  "seo": { "score": 100, "issues": [], "summary": { "headingLevels": [1, 2] } },
  "axe": { "score": 84, "violations": [{ "id": "color-contrast", "impact": "serious", "nodes": 3 }] },
  "ux": { "score": 80, "heuristics": [{ "id": "status", "score": 75, "issues": ["…"] }] },
  "content": { "score": 85, "wordCount": 480, "readingTime": 3, "readabilityScore": 62 },
  "artifacts": { "screenshot": "…/screenshot.png", "report": null },
  "warnings": []
}
```

Le rapport contient uniquement des valeurs **sérialisables** : la photographie
du DOM reste en mémoire, elle ne pollue pas le JSON.

---

## 6. Niveaux en détail

### 6.1 L1 — rapide (< 10 s)

1. **Capture** PNG pleine page (`screenshot.png`).
2. **Arbre ARIA** via `ariaSnapshotJSON()`, analysé hors navigateur :
   images sans alternative, boutons et liens sans nom, titres sautés, champs
   sans étiquette.
3. **Photographie du DOM** : titres, liens, images, repères, formulaires,
   métadonnées, nombre de blocs JSON-LD, texte visible (20 000 caractères max).
4. **Métadonnées** : URL finale, titre, description, langue, statut HTTP, durée
   de chargement.

Aucune requête supplémentaire, aucun outil externe : c'est ce qui tient en
moins de dix secondes sur une page ordinaire.

### 6.2 L2 — standard (< 30 s)

L2 ajoute :

- **Lighthouse** (`performance`, `seo`) avec `output: 'json'`,
  `logLevel: 'error'`, `onlyCategories: ['performance', 'seo']`, sur le port CDP
  du Chromium de la session. Le mode desktop passe le préréglage officiel
  `desktopConfig` du paquet (qui aligne `formFactor`, `screenEmulation`,
  user-agent émulé et limitation réseau) ; Lighthouse **refuse** un
  `formFactor` desktop avec l'émulation mobile par défaut ;
- **SEO dérivée du DOM** : règles listées au §7.1.

> **Pourquoi deux mesures SEO ?** Lighthouse juge un chargement à froid, dans
> son propre navigateur. L'analyse DOM juge la page **telle qu'elle est dans la
> session**, scripts exécutés. Les deux peuvent diverger : c'est une
> information, pas un défaut.

### 6.3 L3 — approfondie (< 60 s)

L3 ajoute :

- **axe-core** avec les tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
  `wcag22a`, `wcag22aa`, `best-practice` ;
- **UX** : cinq heuristiques de Nielsen observables sur un DOM statique ;
- **contenu** : nombre de mots, temps de lecture (200 mots/min), indice de
  lisibilité de Flesch adapté au français.

---

## 7. Notes et formules

### 7.1 Score SEO (DOM)

Le score part de 100 et soustrait une pénalité par constat :

| Constat | Sévérité | Pénalité |
| --- | --- | --- |
| Titre absent | erreur | 25 |
| Titre hors de 15-60 caractères | avertissement | 8 |
| Description absente | erreur | 20 |
| Description hors de 50-160 caractères | avertissement | 5 |
| Aucun `h1` | erreur | 15 |
| Plusieurs `h1` | avertissement | 8 |
| Niveaux de titres sautés | avertissement | 5 |
| Image sans texte alternatif | avertissement | 10 |
| Canonique absente | info | 3 |
| `noindex` | avertissement | 12 |
| Langue non déclarée | avertissement | 5 |
| Viewport absent | avertissement | 5 |
| Open Graph incomplet | info | 3 |
| Aucune donnée structurée | info | 3 |

Le score est plafonné à zéro ; les constats sont triés du plus grave au moins
grave. Une page vide obtient 21/100 — le détail des constats explique le
chiffre, ce qui est le but.

### 7.2 Score d'accessibilité (axe-core)

```text
score = max(0, 100 − Σ (poids(gravité) × nœuds fautifs))
poids : minor 1 · moderate 3 · serious 5 · critical 10
```

Une violation sans gravité déclarée compte comme `minor` ; une violation sans
nœud compte pour un. Une page sans violation vaut 100.

### 7.3 Heuristiques UX

| Identifiant | Heuristique | Signaux observés |
| --- | --- | --- |
| `status` | Visibilité de l'état | zone principale, cadres intégrés, volume de texte |
| `match` | Correspondance au monde réel | langue déclarée, titre |
| `control` | Contrôle et liberté | navigation, liens sortants |
| `consistency` | Cohérence et standards | unicité du `h1`, continuité des niveaux |
| `error-prevention` | Prévention des erreurs | champs étiquetés, action de validation |

Chaque constat coûte 25 points **dans son heuristique** ; le score global est la
moyenne des cinq. Une capacité non testable sur un DOM statique (annulation,
aide en ligne) n'est **pas** notée : elle serait inventée.

### 7.4 Contenu

| Mesure | Règle |
| --- | --- |
| Nombre de mots | texte visible normalisé (espaces compactés) |
| Temps de lecture | `ceil(mots / 200)` minutes |
| Flesch (Kandel-Moles) | `207 − 1,015 × (mots / phrases) − 73,6 × (syllabes / mots)`, borné à 0-100 |
| Score de contenu | −30 si < 300 mots, −25 si lisibilité < 30, −15 si > 25 mots/phrase, −15 sans paragraphe, −15 sans titre |

L'estimation syllabique compte les groupes de voyelles et retire le `e` final
muet : approximation assumée, stable et documentée.

---

## 8. Budgets et mesure

| Niveau | Budget | Mesure |
| --- | --- | --- |
| L1 | 10 000 ms | de `resolveOptions()` à la fin du niveau |
| L2 | 30 000 ms | idem, Lighthouse inclus |
| L3 | 60 000 ms | idem, axe-core inclus |

Le dépassement **n'interrompt pas** l'inspection : `withinBudget: false` le
signale pour que l'appelant décide (réduire le niveau, augmenter le délai,
optimiser). Un site lent n'est pas une erreur ; le taire en serait une.

Mesures relevées sur le poste de validation (Windows 11, Node 24.14.0,
Chromium 1248, réseau domestique, page `https://example.com`) :

| Niveau | Durée mesurée | Budget | Reste |
| --- | --- | --- | --- |
| L1 | **4,38 s** | 10 s | 56 % |
| L2 | **14,30 s** | 30 s | 52 % |
| L3 | **13,65 s** | 60 s | 77 % |

L3 est parfois plus rapide que L2 : Lighthouse domine les deux et sa durée varie
d'un passage à l'autre. Les budgets restent largement tenus ; ils ne sont pas
des coupures, et un dépassement s'affiche sans interrompre l'inspection.

---

## 9. Tests

| Fichier | Cas | Portée |
| --- | --- | --- |
| `tests/browser/inspection/level-1.test.ts` | 19 | métadonnées, capture, ARIA, normalisation |
| `tests/browser/inspection/level-2.test.ts` | 21 | héritage, Lighthouse, SEO |
| `tests/browser/inspection/level-3.test.ts` | 23 | axe, UX, contenu, lisibilité |
| `tests/browser/inspection/inspector.test.ts` | 20 | cycle de vie, artefacts, erreurs |
| `tests/browser/lighthouse.test.ts` | 20 | conversion du rapport, port, options, émulation |
| `tests/browser/axe.test.ts` | 19 | score, tri, tags, erreurs |
| **Total Sprint 8** | **122** | |

Aucun test n'ouvre de navigateur : les doublures (`tests/browser/helpers.ts`,
`tests/browser/inspection/fixtures.ts`) reproduisent les méthodes appelées. Les
tests e2e réels restent ceux du Sprint 7 (`tests/browser/e2e/basic.spec.ts`).

**Règle : aucun test unitaire ne touche le réseau.** Un premier essai vérifiait
qu'un port CDP fermé produisait un refus rapide ; il mesurait en réalité la
latence d'échec du système — 1,5 s sous Linux, plus de 28 s sous Windows avec
antivirus — et échouait alors que le code était correct. Les invariants
d'émulation se vérifient désormais hors I/O, en comparant le préréglage réel du
paquet à notre repli. Seuls les tests explicitement conditionnels
(`EKTS_BROWSER_ONLINE=1`) sortent sur le réseau.

```powershell
npm run test:browser
npx vitest run tests/browser/inspection
npm run coverage
```

Couverture mesurée : **98,9 %** des lignes de `src/browser/` (seuil du projet :
80 %).

---

## 10. Dépannage

| Symptôme | Cause probable | Remède |
| --- | --- | --- |
| `Inspection (lighthouse) : ECONNREFUSED` | port CDP non ouvert | vérifier que `browserKind` vaut `chromium` et que le moteur accepte `--remote-debugging-port` |
| `Screen emulation mobile setting … does not match formFactor` | émulation incohérente | corrigé : le mode desktop passe `desktopConfig` ; ne jamais fixer `formFactor` seul |
| `Inspection (lighthouse) : …` avec `NODE_MODULE_VERSION` | Node trop ancien | `node --version` ≥ 22.19 (exigence de Lighthouse 13.5) puis `npm ci` |
| `lighthouse` absent | `npm ci` incomplet | `npm ls lighthouse` puis `npm ci` |
| `Analyse axe-core indisponible : …` | CSP bloquant l'injection | inspecter avec `strict: true` pour voir l'erreur exacte |
| `Lighthouse exige Chromium` | `browserKind` = `firefox`/`webkit` | relancer en Chromium |
| `Firefox a démarré sans bac à sable` | mode compatibilité | voir `docs/PLAYWRIGHT.md` §14.1 |
| Capture absente mais rapport présent | page trop grande ou disque plein | lire `warnings`, libérer de l'espace |

Le mode `strict: true` transforme chaque dégradation en exception : c'est le
mode à utiliser pour diagnostiquer, pas pour produire un rapport.

---

## 11. Sécurité

- **Aucun secret** n'est lu ni écrit : les analyses ne demandent aucune clé.
- Les URL sont passées telles quelles à Playwright ; les schémas non HTTP(S)
  doivent être filtrés **en amont** par l'appelant (CLI, MCP).
- Les artefacts sont écrits **uniquement** sous `outputDir` (créé au besoin).
- Un rapport peut contenir le texte visible d'une page : ne pas inspecter de
  page authentifiée sans conscience de ce que le JSON conserve.
- `warnings` ne contient que des messages techniques, jamais d'en-tête
  d'authentification.

### 11.1 Dépendances et audit

`lighthouse` et `@axe-core/playwright` sont des dépendances **de développement**.
Conséquence à connaître : une installation `npm ci --omit=dev` les omet, et les
niveaux **L2 et L3 se dégradent proprement** (`lighthouse: null` / `axe: null`
plus un avertissement) au lieu d'échouer. Le socle L1 et la CLI fonctionnent
toujours.

```powershell
npm run audit          # chaîne complète
npm run audit:prod     # dépendances de production uniquement
npm run audit:ci       # échoue si sévérité high ou plus — exécuté en CI
npm run audit:prod:ci  # identique, restreint à la production
```

**État au 24/10/2026 : `npm audit` répond 0 vulnérabilité**, développement
inclus. C'est ce que le CI vérifie à chaque push.

**Historique (conservé pour la trace).** Jusqu'au 24/10/2026, le projet
embarquait `lighthouse` **12.8.2**, dont la chaîne de développement comptait
27 puis **29 avis** (19 modérées, 10 élevées) sans aucun correctif applicable :
`extract-zip` est vulnérable sur toutes ses versions, `chromium-bidi`
exigerait un saut de version majeur, forcer `@opentelemetry/core` 2.x
casserait l'API attendue par `@sentry/node` 7, et le seul correctif global
(Lighthouse 13.5) relevait le plancher Node du projet. Le triage par
**accessibilité du code** — ce qui était *chargé* n'était pas *exécuté* —
est conservé ci-dessous comme méthode.

**Décision d'appliquer le correctif.** La demande explicite de supprimer ces
29 erreurs a fait basculer ADR-026 : **`lighthouse` 13.5.0** (24/10/2026) remplace
12.8.2 et le plancher Node suit (`engines` ≥ 22.19, `.nvmrc` 22, `check:env`).
Vérifications faites avant validation : `npm audit` → **0** ; API inchangée
(`desktopConfig`, export par défaut, `maxWaitForLoad`) ; mêmes audits Core Web
Vitals et SEO présents ; connexion CDP franchie après contrôle des réglages ;
`npm run verify` vert sur les 989 cas.

**Si un avis réapparaît un jour** (la base du registre évolue sans que le code
change — le passage de 27 à 29 le 24/10 en est la preuve) :

1. `npm run audit:ci` bloque la CI sur `high` — lire l'arbre `npm ls <paquet>`.
2. Trier par accessibilité du code avant toute panique : un paquet n'est
   dangereux que s'il est exécuté sur un chemin atteint.
3. Remonter Lighthouse si le correctif vient de là, avant d'envisager des
   `overrides` manuels.

**Triage de référence, appliqué à la chaîne 12.8.2 :**

| Paquet signalé | Chemin dans Lighthouse | Exécuté par l'inspecteur ? |
| --- | --- | --- |
| `extract-zip`, `@puppeteer/browsers` | décompression de l'archive du Chrome téléchargé | **Non** : on passe `port`, Lighthouse se connecte au Chromium déjà lancé par `Navigator` |
| `basic-ftp`, `get-uri`, `pac-proxy-agent`, `proxy-agent` | résolution du proxy système lors du lancement d'un Chrome | **Non** : connexion directe à `127.0.0.1`, sans proxy |
| `chromium-bidi`, `zod` 3.25 | protocole BiDi de `puppeteer-core` | **Chargé, jamais emprunté** : Lighthouse pilote en CDP |
| `@opentelemetry/*`, `@sentry/node` | télémétrie d'erreurs | **Non** : sortie immédiate sans `flags.enableErrorReporting` — cas présent |
| `puppeteer-core` (avis agrégé) | somme des précédents | **Chargé pour ses types d'exécution, sans les chemins vulnérables** |

> L'avertissement `npm warn deprecated @opentelemetry/sdk-trace-base` qui suit
> l'installation n'est **pas** une vulnérabilité : c'est un avis de dépréciation
> npm sur un sous-paquet de `@sentry/node`. `npm audit` reste à 0.

Risque suivi en **R-8.10** (clôturé le 24/10/2026).

---

## 12. Écarts au plan

Le plan (`SPRINT-08*.md`) prévoyait certains choix qui n'ont pas pu être suivis
tels quels. Ils sont consignés ici et dans le registre des décisions.

| # | Plan | Réalisation | Raison |
| --- | --- | --- | --- |
| **E8-1** | ADR-012 (Lighthouse), ADR-013 (axe-core) | **ADR-026**, **ADR-027** | ces numéros sont déjà pris dans le registre (`docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`) |
| **E8-2** | `lighthouse` 11+ / 13.x | `lighthouse` **13.5.0** | Écart **résolu** le 24/10/2026 : montée de Lighthouse pour supprimer les 29 avis de la chaîne 12.8.2, plancher Node porté à 22.19 (ADR-026 addendum) |
| **E8-3** | Types Lighthouse disponibles | déclaration locale `lighthouse-module.d.ts` | le paquet ne publie ni `types` ni `exports` ; `import('lighthouse')` échoue en TS2307 |
| **E8-4** | audit `max-potential-fid` | **INP** en priorité, `max-potential-fid` en repli — **repli supprimé au Sprint 20-01** : INP, FID et `max-potential-fid` sont exposés séparément | Lighthouse mesure INP ; FID n'existe plus comme audit principal ; un repli fabriquait une mesure d'INP jamais observée |
| **E8-5** | TTFB via `time-to-first-byte` | `server-response-time` | c'est le nom réel de l'audit |
| **E8-6** | analyse L2/L3 sur les 3 moteurs | L2/L3 en **Chromium** uniquement | Lighthouse exige CDP ; l'absence est signalée, pas contournée |
| **E8-7** | viewport non spécifié | option `viewport` (défaut 1920 × 1080) + `LaunchOptions.context` | permet de fixer viewport et user-agent sans second navigateur |
| **E8-8** | score SEO Lighthouse | **deux** scores : Lighthouse et DOM | un rapport doit distinguer ce qui a été mesuré par qui |
| **E8-9** | heuristiques Nielsen 1-5 | cinq heuristiques **observables** seulement | les autres exigent une interaction, non mesurable sur un DOM statique |
| **E8-10** | lisibilité Flesch-Kincaid | **Flesch Kandel-Moles** (français) | la variante anglaise pénalise toute phrase française |
| **E8-11** | e2e des niveaux | non exécutés dans le bac à sable | binaires Playwright indisponibles ; couverture unitaire 98,9 % |
| **E8-12** | — | ajout de `InspectionError` (`INSPECTION_FAILED`) | situer l'étape en échec sans multiplier les codes |
| **E8-13** | `formFactor: 'desktop'` seul (déduit du plan) | préréglage `desktopConfig` + repli cohérent | Lighthouse 13 refuse un `formFactor` desktop avec l'émulation mobile par défaut : bug constaté sur le poste le 23/10/2026, corrigé avant livraison |

---

## 13. Références

- `docs/blueprint/Docs/roadmap/sprints/SPRINT-08.md` — plan du sprint
- `docs/PLAYWRIGHT.md` — socle navigateur, bac à sable, dépannage moteur
- `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` — ADR-026, ADR-027, R-8.x
- Lighthouse : <https://github.com/GoogleChrome/lighthouse>
- axe-core : <https://github.com/dequelabs/axe-core>
- Heuristiques de Nielsen : <https://www.nngroup.com/articles/ten-usability-heuristics/>

---

**Fin du document Inspecteur**
