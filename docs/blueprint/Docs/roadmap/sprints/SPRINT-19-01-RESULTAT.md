# Rapport Sprint 19-01 — Priorité canonique et comptage

**Date :** 30/10/2026 — **Statut :** ✅ TERMINÉ (suite verte : 1 669 tests, 34 ignorés,
`npm run verify` = 0, couverture 96,41 %)

## Objectif

Exigence **W01** — critères **C-W01**, **C-W02**, **C-W04** : un même constat doit
porter la même priorité dans la liste générale, le détail par dimension, le
classement prioritaire et le stockage ; le résumé doit exposer **cinq** compteurs
dont la somme égale le total ; le classement des recommandations doit être
identifié comme un ordre distinct, sans incohérence de compteur.

## État relevé avant travaux

Trois défauts mesurés dans le code, chacun reproduit par un test écrit **avant**
toute modification :

| Défaut | Localisation d'origine | Effet |
| ------ | ---------------------- | ----- |
| Priorités divergentes | `src/analysis/pipeline.ts` publiait `findings` avec les priorités **déclarées par les analyseurs** alors que `summary` et `priorityFindings` utilisaient la matrice | Le détail affichait `high` là où le compteur comptait `medium` |
| 5ᵉ compteur absent | `AnalysisReport.summary` n'avait que 4 compteurs ; `audit_metadata` ne persistait que 4 colonnes | Un constat `info` n'était compté nulle part : la somme des catégories ne pouvait pas égaler le total |
| Classement non nommé | `templates/markdown.ts` triait par `severity × impact × 10 − effort` sans le dire | Un `medium` en tête pouvait passer pour une incohérence de priorité |

**Preuve de discrimination de la fixture** : `ContentAnalyzer` déclare
`content-word-count-low` en `high` avec `severity: 3`, `effort: 3` ; la matrice
donne `3 × (6 − 3) = 9` → `medium`. Le test échouait avec
`AssertionError: expected 'high' to be 'medium'` avant correction.

## Livrables

### Code

- `src/analysis/prioritizer.ts` — nouvelle méthode `applyCanonicalPriority()`
  (requalifie **sans réordonner**) ; `prioritize()` la réutilise puis trie.
  Aucune déduplication : deux constats de même titre restent deux constats.
- `src/analysis/pipeline.ts` — `canonicalize()` applique la matrice à chaque
  dimension avant agrégation ; la liste générale, les dimensions et le
  classement partagent donc une seule vérité ; `countByPriority()` alimente les
  cinq compteurs.
- `src/analysis/types.ts` — `infoFindings` dans `AnalysisReport.summary`
  (champ obligatoire) et contrat de `Finding.priority` documenté comme canonique.
- `src/storage/schema.ts` + `src/data/migrations/009_info_findings.ts` +
  `src/data/migrations/index.ts` — colonne `info_findings NOT NULL DEFAULT 0
  CHECK (info_findings >= 0)`, migration **idempotente** et **additive**.
- `src/storage/audit-repository.ts` — insertion, validation et relecture du
  5ᵉ compteur ; une base antérieure à la migration lit `0` (jamais `undefined`).
- `src/storage/types.ts`, `src/storage/statistics.ts` — agrégat et `SUM` du
  cinquième compteur.
- `src/reports/templates/markdown.ts` et `html.ts` — ligne de compteur `⚪ Info`
  et mention explicite « Ordre de recommandation : sévérité × impact × 10 −
  effort », distinguée de la priorité canonique.
- `src/cli/commands/audit.ts`, `src/mcp/tools/audit-history.ts` —
  `info_findings` exposé par la CLI et par l'outil MCP d'historique.
- `src/best-practices/best-practice-extractor.ts` — métadonnées synthétiques
  complétées du cinquième compteur.

### Tests (écrits avant le code)

- `tests/analysis/canonical-priority.test.ts` — **8 tests** couvrant C-W01
  (requalification, cohérence liste/dimensions/classement, titres dupliqués),
  C-W02 (cinq compteurs, somme = total, zéro constat) et C-W04 (classement
  nommé, priorités et compteurs inchangés, génération pure).
- `tests/storage/audit-repository.test.ts` — **2 tests** (I) : persistance des
  cinq compteurs avec un constat `info`, relecture après cycle, et zéro mesuré.
- `tests/integration/audit-migration-009.test.ts` — **3 tests** : migration
  d'une base historique à quatre colonnes, idempotence, absence de réécriture
  des autres colonnes (`0` mesuré, décision du propriétaire du 30/10).

### Mise en cohérence des tests existants

- 27 fichiers de tests complétés de `infoFindings` (champ désormais obligatoire).
- 5 tests figeaient `user_version = 8` : la version attendue est désormais
  **dérivée de la liste des migrations**, ce qui empêche la récidive sans
  affaiblir l'assertion (une migration manquante ou renommée casse le test).

## Mesures (sorties réelles)

| Contrôle | Résultat |
| -------- | -------- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run format:check` | 0 |
| `npm run build` | 0 |
| `npm run coverage` | 131 fichiers verts, 4 ignorés ; 1 669 tests réussis, 34 ignorés (1 703) |
| Couverture globale | 96,41 % instructions, 90,91 % branches, 97,71 % fonctions, 96,63 % lignes |

## Écarts et limites assumés

- **Aucun analyseur ne produit aujourd'hui de constat `info`** : le cinquième
  compteur est donc `0` sur les audits réels actuels. Le critère C-W02 reste
  vérifié par des fixtures explicites (pipeline : zéro constat ; stockage :
  un constat `info` persisté puis relu). Ce n'est pas un défaut de comptage
  mais une conséquence de la matrice : les seuils des analyseurs n'atteignent
  jamais `< 2`.
- **`C-W03` (trois formats) n'est pas traité ici** : il relève du sous-sprint
  19-02. L'environnement de génération PDF a été préparé en amont (voir
  ci-dessous) pour ne pas clore 19-02 sur un `bloqué` évitable.
- **Pas de preuve CI distante** : les jobs GitHub échouent pour facturation
  (aucun test exécuté) ; seul `npm run verify` local fait foi.

## Préparation de l'environnement PDF (pour 19-02)

Le CDN Playwright et le CDN Puppeteer sont **inaccessibles** depuis ce bac à
sable (seul `registry.npmjs.org` répond) : Chromium ne peut pas être téléchargé
par les canaux habituels. Solution vérifiée :

1. `npm install --no-save --no-package-lock @sparticuz/chromium` (paquet npm
   contenant Chromium et les bibliothèques AL2023 manquantes) ;
2. extraction du binaire vers `/tmp/chromium` et des bibliothèques vers
   `/tmp/al2023/lib` ;
3. exécution avec `LD_LIBRARY_PATH=/tmp/al2023/lib` et
   `EKTS_CHROME_PATH=/tmp/chromium` (variables déjà honorées par
   `PDFReportGenerator`).

**Résultat mesuré** : `Chromium 153.0.8010.0` démarre, et
`PDFReportGenerator.generate()` produit un PDF réel de 49,6 Ko (`%PDF-`).
Aucun secret, aucune dépendance ajoutée au manifeste produit : la procédure est
une provisioning de bac à sable, non une dépendance d'exécution.

## Checklist de clôture

| Critère | État | Preuve |
| ------- | ---- | ------ |
| C-W01 — priorité canonique partout | ✅ | `canonical-priority.test.ts` (3 tests), 100 % des constats vérifiés |
| C-W02 — cinq compteurs = total | ✅ | `canonical-priority.test.ts` (2), `audit-repository.test.ts` (2), migration 009 (3) |
| C-W04 — ordre de recommandation distinct | ✅ | `canonical-priority.test.ts` (2) |
| Tests écrits avant le code | ✅ | RED comportemental conservé (`expected 'high' to be 'medium'`) |
| Aucun test ignoré compté comme réussite | ✅ | 34 ignorés comptés séparément |
| `npm run verify` = 0 | ✅ | sortie du 30/10 |
| Documentation à jour | ✅ | ce rapport + note 24 |

## Prochaine étape

**Sprint 19-02** — C-W03 (Markdown, HTML et PDF effectivement produits sur un
audit synthétique, décompte par priorité vérifié dans les trois rendus et dans
le texte extrait du PDF) et C-W12 (audits historiques lisibles, incohérence
signalée, aucune réécriture silencieuse). L'environnement PDF est prêt ;
l'extracteur de texte PDF reste à choisir et à justifier avant écriture du code.
