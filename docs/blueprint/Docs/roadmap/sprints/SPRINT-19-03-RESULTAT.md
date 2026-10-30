# Rapport Sprint 19-03 — Mesures indisponibles, axe et score global

**Date :** 30/10/2026 — **Statut :** ✅ TERMINÉ (`npm run verify` = 0 ; 1 732 tests
réussis, 38 ignorés ; couverture 96,03 %)

## Objectif

Exigences **W02** et **W03** — critères **C-W05**, **C-W06** et **C-W07**.

- **C-W05** : une métrique absente (LCP, INP, CLS, TTFB) ne doit **jamais**
  devenir `0`. Un zéro de remplacement se lit comme une excellente mesure et
  devient indistinguable d'une mesure réellement nulle.
- **C-W06** : quatre états d'accessibilité distincts — outil indisponible,
  violations absentes, score absent, mesure réelle. `violations: undefined` ne
  signifie pas « aucune violation ».
- **C-W07** : le score global est soit mesuré, soit **indisponible avec sa
  raison**. Aucune renormalisation silencieuse, aucun `0` de remplacement, et
  l'indisponibilité doit être persistable et restituée comme telle.

## État relevé avant travaux

| Constat | Preuve |
| ------- | ------ |
| `numericValue()` de `src/browser/lighthouse.ts` retournait `0` si la mesure manquait | lecture du code, `return typeof value === 'number' … : 0` |
| `categoryScore()` retournait `0` sans catégorie | idem |
| `AxeResults.violations` obligatoire, `nodes` obligatoire, `score` numérique | `src/analysis/types.ts` avant travaux |
| `overallScore` numérique partout (analyse, stockage, rapports, timeline) | `grep overallScore` : 30 occurrences |
| `audit_metadata.overall_score INTEGER NOT NULL` | `src/storage/schema.ts` |
| Aucun contrat ne distinguait « mesuré » de « non mesuré » | aucun type d'union dans le dépôt |

## Décisions prises et validations

Validées par le propriétaire le **30/10/2026**, avant implémentation :

1. **Élargissement du contrat** : `DimensionScore.score: number | null` +
   `status` + `unavailableReason` + `measurements` ; `OverallScore` en union
   discriminée ; `Measurement` pour les métriques ; `AxeResults.violations` et
   `nodes` optionnels.
2. **Migration 010 par `ALTER`**, pas par reconstruction de table. La sonde
   exécutée sur la version embarquée (`SQLite 3.53.4`, `better-sqlite3 13.0.3`)
   montre que `ALTER COLUMN … DROP NOT NULL` est accepté et que le `CHECK` de
   bornes est conservé (`NULL` accepté, `150` refusé).
3. **Deux commits** : contrat (A), puis migration + persistance (B).

**Contradiction déclarée en cours de sprint** (30/10/2026) : le périmètre
initial de la migration 010 (`overall_score` seul) est **inatteignable** — un
score global indisponible implique toujours une dimension indisponible (aucune
renormalisation), et `audit_dimensions.score` était encore `NOT NULL`. `store()`
refusait donc tout audit que C-W07 produit. Le propriétaire a validé
l'**extension de 010 aux scores de dimension** (mêmes colonnes, mêmes règles).
Preuve du blocage : `Validation échouée : dimension accessibility sans score :
non persistable en l'état (score-absent)`.

## Livrables

### Commit A — `b48c175` (contrat)

- `src/analysis/measurement.ts` — `Measurement`, `toMeasurement`,
  `measuredValueOf`, `overallScoreValue`, `overallScoreReason`. Cinq cas
  d'indisponibilité distingués : `absent`, `null`, `nan`, `infinite-positive`,
  `infinite-negative`. Un `0` réellement mesuré reste mesuré.
- `src/analysis/types.ts` — `DimensionScore` (score nullable + `status` +
  `unavailableReason` + `measurements`), `OverallScore` (union discriminée :
  `measured.value` / `unavailable` avec `code`, `reason`, `missingDimensions`),
  `LighthouseResults` et `AxeResults` adaptés, `Finding.nodesCount?`.
- `src/analysis/{accessibility,performance,seo,content,ux}.ts` — aucun constat
  dérivé d'une mesure absente ; quatre états d'accessibilité ; les constats sont
  conservés quand seul le score manque.
- `src/analysis/pipeline.ts` — `calculateOverallScore` refuse de calculer si une
  seule dimension manque (codes `aucune-dimension` / `dimensions-indisponibles`).
- `src/browser/lighthouse.ts` — `numericValue` et `categoryScore` retournent
  `null` au lieu de `0` : le défaut disparaît **à la source**.
- `src/analysis/adapter.ts` — chaque métrique traverse `toMeasurement`.
- `src/storage/{types,audit-repository,search}.ts` — `overallScore` nullable,
  `scoreStatus`/`scoreReason`, filtres de score excluant `NULL`.
- `src/reports/{types,comparator}.ts`, `src/reports/templates/*` — évolution
  `unavailable` sans écart, « indisponible — raison » en Markdown et HTML.
- `src/cli/commands/{audit,inspect}.ts`, `src/mcp/tools/{audit-history,inspect-site}.ts`
  — scores nullable exposés sans `String(null)`.
- `src/timeline/trend-detector.ts` — une paire non mesurée est ignorée, jamais
  comparée à `0`.

### Commit B — `2e24cb5` (migration 010 + persistance)

- `src/data/migrations/010_score_availability.ts` — `ALTER` idempotents sur
  `audit_metadata.overall_score` **et** `audit_dimensions.score` :
  `DROP NOT NULL`, `score_status` (`measured` par défaut, `unavailable`),
  `score_reason`. Lignes historiques conservées et marquées `measured`.
- `src/data/migrations/index.ts` — enregistrement (`version: 10`).
- `src/storage/schema.ts` — schéma neuf aligné (colonnes nullables + état).
- `src/storage/audit-repository.ts` — `store()` écrit `NULL` + raison (jamais
  `0`), relit `scoreStatus`/`scoreReason`, `AuditDimension.score` nullable.
- `src/storage/statistics.ts` — une période sans score mesuré n'apparaît plus
  dans `getTrend` (plus de `NaN` ni de moyenne `0` inventée).
- `src/timeline/{timeline.types,timeline-analyzer,chart-generator}.ts` — un
  point non mesuré n'est ni tracé, ni moyenné, ni utilisé par la régression.
- Types de lecture alignés sur la base (`overall_score`/`score` `number | null`) :
  `src/storage/audit-diagnostics.ts`, `src/best-practices/best-practice-extractor.ts`,
  `src/mcp/tools/get-timeline.ts`. Sans cela, une ligne `NULL` traversait un
  type `number` — exactement le mensonge que ce sprint supprime.
- `src/reports/templates/{markdown,html}.ts` — dimension indisponible affichée
  « ⚪ indisponible — raison ».

### Tests

| Fichier | Niveau | Cas |
| ------- | ------ | --- |
| `tests/analysis/measurement-availability.test.ts` | U | 14 |
| `tests/analysis/axe-availability.test.ts` | U | 7 |
| `tests/reports/score-unavailable.test.ts` | U/I | 12 |
| `tests/integration/audit-migration-010.test.ts` | I | 9 |
| `tests/timeline/timeline-analyzer.test.ts` (ajout) | I | 1 |
| `tests/timeline/chart-generator.test.ts` (ajout) | U | 1 |
| 60 fichiers existants adaptés | U/I/E2E | fixtures et assertions |

Volumes réels : commit A = **64 fichiers** (1 477 insertions), commit B =
**17 fichiers** (693 insertions).

## RED, GREEN et écarts — déclaration honnête

- **RED observé sur le comportement remplacé** : les deux tests
  `tests/browser/lighthouse.test.ts` qui **exigeaient** le `0` de remplacement
  (`ramène les métriques manquantes à zéro`, `vaut zéro sans catégorie
  déclarée`) ont échoué au premier `vitest run` après la correction, puis ont
  été réécrits pour décrire le contrat (absence ≠ zéro). C'est une preuve
  directe que le comportement a changé.
- **Adaptation des 60 fichiers existants** : 132 échecs de comportement
  observés après le changement de contrat (fixtures numériques, assertions
  comparant un objet d'union à un nombre, `RangeError: Too few parameter
  values` dû à un paramètre objet lié à SQLite). Tous corrigés ; aucun test
  ignoré pour faire passer la suite.
- **Écart consigné** : les trois nouveaux fichiers de contrat (C-W05, C-W06,
  C-W07) ont été **écrits après** l'implémentation, faute d'avoir conservé les
  versions rédigées au tour précédent. Ils ne constituent donc pas un RED
  initial ; leur valeur est de verrouiller le contrat. Trois défauts réels ont
  toutefois été révélés par leur écriture et corrigés :
  1. `assertAudit()` des générateurs et du comparateur **refusait** un score
     `null` — les rapports n'auraient jamais pu afficher l'indisponibilité ;
  2. `generateRecommendations()` parlait de « scores stagnants » pour des
     audits sans score — conclusion inventée, remplacée par une recommandation
     explicite ;
  3. ma propre erreur de calcul dans une attente (`84` au lieu de `85`) —
     corrigée après vérification à la main de la pondération.
- **Rectification de message** : le message du commit `2e24cb5` annonce « 7
  cas » pour `audit-migration-010` ; le fichier en contient **9**. Le compte
  exact est celui ci-dessus ; le message n'est pas réécrit (historique poussé).

## Mesures (sorties réelles, 30/10/2026)

| Contrôle | Résultat |
| -------- | -------- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run format:check` | 0 |
| `npm run build` | 0 |
| `npm run coverage` | 139 fichiers verts, 6 ignorés (145) ; **1 732 tests réussis, 38 ignorés** (1 770) |
| Couverture globale | 96,03 % instructions, 89,21 % branches, 97,35 % fonctions, 96,21 % lignes |
| `npm run verify` | **EXIT 0** |
| Sonde SQLite | `ALTER … DROP NOT NULL` accepté, `NULL` inséré, `150` refusé (CHECK conservé) |
| Migration 010 sur base héritée | `overall_score` et `score` nullables, colonnes d'état présentes, ligne historique `71`/`64` inchangée et `measured` |

## Points de vigilance

- **Aucun binaire Chromium dans cette session.** Les 38 cas ignorés
  correspondent aux navigateurs et aux rendus PDF (`browser/integration`,
  `e2e/*`, `reports/pdf-*`), dont 6 fichiers entièrement ignorés. Les suites PDF
  sont **sautées explicitement**, jamais comptées comme réussies. Aucun budget
  PDF n'est engagé par ce rapport.
- **Pas de preuve CI distante** : facturation toujours en échec, aucun job
  exécuté.
- **Convention de statistiques conservée** : `getStatistics()` retourne `0`
  pour un agrégat `NULL` (ensemble vide **ou** aucun score mesuré). La tendance,
  elle, omet les périodes sans mesure. Cette convention est documentée dans le
  code ; elle reste une **dette assumée**, hors du périmètre validé de 19-03.
- **Base antérieure à 010** : la lecture déduit `scoreStatus` de la présence
  d'un score (migration non appliquée) ; la migration est requise avant toute
  écriture d'indisponibilité.

## Checklist de clôture

| Critère | État | Preuve |
| ------- | ---- | ------ |
| C-W05 — une mesure absente n'est jamais `0` | ✅ | `measurement-availability.test.ts` (14), `lighthouse.test.ts` (réécrit) |
| C-W05 — un `0` réellement mesuré reste mesuré | ✅ | `toMeasurement(0)`, adaptateur et extracteur Lighthouse |
| C-W06 — quatre états distincts | ✅ | `axe-availability.test.ts` (7) |
| C-W06 — décompte `nodes` absent non inventé | ✅ | `axe-availability.test.ts` (3 cas dédiés) |
| C-W07 — aucune renormalisation | ✅ | `score-unavailable.test.ts` (`missingDimensions`, `code`) |
| C-W07 — aucune comparaison chiffrée sans score | ✅ | comparateur : `status: 'unavailable'`, `delta: null` |
| C-W07 — indisponibilité persistable avec sa raison | ✅ | migration 010 + `store()`/`findById` |
| C-W07 — aucun `0` écrit en base | ✅ | `audit-migration-010.test.ts` |
| Migration 010 idempotente, sans reconstruction | ✅ | 3 cas d'idempotence, base héritée et base neuve |
| `verify` = 0 | ✅ | sortie du 30/10/2026 |

## Hashes réels

| Livrable | Commit |
| -------- | ------ |
| Contrat (C-W05/C-W06/C-W07) | `b48c175` |
| Migration 010 + persistance | `2e24cb5` |
| Ce rapport | `5253332` |
| Alignement des types de lecture SQL | à renseigner après commit |

## Prochaine étape

`SPRINT-19-RESULTAT.md` (bilan de la série 19), mise à jour du registre avec les
hashes réels, puis **accord distinct du propriétaire avant tout travail du
sprint 20**. Aucune donnée de ce rapport n'autorise le sprint 20.
