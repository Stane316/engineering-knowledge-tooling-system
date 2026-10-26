# Rapport Sprint 18-01 — Tests E2E MVP-3

**Date :** 26/10/2026 — **Statut :** ✅ TERMINÉ (suite vert : 26/26, budget tenu)

## Objectif

Implémenter les 6 fichiers de tests de bout en bout MVP-3 sous
`tests/e2e/mvp3/`, les exécuter en **< 120 s**, ajouter le script
`test:e2e:mvp3` et le job CI dédié (ADR-042), puis consigner les écarts.

## Livrables

- `tests/e2e/mvp3/helpers.ts` — helper partagé (7ᵉ fichier, hors spec :
  `runCli` async `execFile` sur `dist/cli/index.js`, sandbox `EKTS_DATA_DIR`,
  `EKTS_OFFLINE=1`, `seedAudit` SQL brut via `openDatabase` + `AuditSchema`)
- `tests/e2e/mvp3/multi-projects.test.ts` — 5 tests (C13.1→C13.15)
- `tests/e2e/mvp3/timeline.test.ts` — 5 tests (C14.1→C14.17)
- `tests/e2e/mvp3/best-practices.test.ts` — 4 tests (C15.1→C15.20)
- `tests/e2e/mvp3/recommendations.test.ts` — 4 tests (C16.1→C16.15)
- `tests/e2e/mvp3/templates.test.ts` — 5 tests (C17.1→C17.20)
- `tests/e2e/mvp3/mvp3-integration.test.ts` — 3 tests (flux intégral +
  codes transverses 0/3/4/2 + isolation des bacs à sable)
- `package.json` — script `test:e2e:mvp3` = `vitest run tests/e2e/mvp3/`
  (distinct de `test:e2e` = playwright, conservé tel quel)
- `.github/workflows/ci.yml` — job `e2e-mvp3` (ubuntu, Node 22, `npm ci`,
  `npm run build`, `npm run test:e2e:mvp3`, **`timeout-minutes: 5`**
  ADR-042), inséré avant `benchmark`

## Mesures (sur sorties réelles)

| Mesure | Résultat | Cible |
|---|---|---|
| Suite E2E MVP-3 (`npm run test:e2e:mvp3`) | **29,8 s** — 6 fichiers, **26/26** | < 120 s ✅ |
| Suite complète `npm test` (mvp3 inclus par `tests/**`) | **96,3 s** — 129 fichiers, **1 656 tests** vert (34 skip) | vert ✅ |
| `npm run lint` / `npm run typecheck` | 0 / 0 | 0 ✅ |
| CI (job `e2e-mvp3`, ADR-042) | soumis en fin de séance | — |

## Décisions E2E (pattern maison, P3)

1. **CLI compilée** : `execFile(process.execPath, ['dist/cli/index.js', …])`
   async (pattern `tests/e2e/cli-flow.test.ts` du Sprint 12), bac à sable
   `mkdtemp` + `EKTS_DATA_DIR` + `EKTS_OFFLINE=1`, retour
   `{status, stdout, stderr}` — `execFile` ne lève pas `error.status` sur
   tous les cas, il est lu sur `error.code`.
2. **Audits seedés en SQL** (inserts bruts `audit_metadata`,
   `audit_dimensions`, `audit_findings` — tables réelles du
   `AuditSchema`) : la spécification imposait `npx ekts audit <url>
   --findings …` qui n'existe pas (`audit` consulte, `inspect` crée) et
   une inspection navigateur hors ligne lourde. L'inspection navigateur
   reste couverte par `tests/e2e/cli-flow.test.ts` (Sprint 12).
3. **Pattern `npm init` + `npm install file:../..` abandonné** avant même
   écriture (reconnaissance) : plusieurs minutes + réseau npm, incompatible
   avec le budget 120 s.
4. **Fixtures croisées extraction/recommandations** : l'extraction (S15)
   exige des constats **résolus** (présents en N, absents en N+1 avec
   hausse du score) alors que l'engine de recommandations (S16) doit voir
   le constat **actuel** → la fixture d'intégration utilise **4 audits**
   (présents 1-2, résolus 3, réapparus 4).

## Écarts P3 (spec vs maison, constatés sur sorties réelles)

1. **Commandes du spec fausses** (cf. reconnaissance) : `project create
   --url`, `audit <url> --findings/--date`, `report generate`,
   `template apply e-commerce`, `recommend generate "<nom>"`,
   `project delete --yes` (vrai `-f` sur project), `timeline analyze
   "<nom>"` (`resolveProjects` = UUID brut).
2. **`recommend rules add --severity` = entier 0-4** (pas
   `critical`/`high`) ; réponse imbriquée `{rule: {id, …}}`.
3. **`recommend generate`** : pas d'option `--force`, pas de code 1
   d'idempotence (régénération implicite, toujours 0), JSON
   `{totalRecommendations, rulesApplied, statisticalRecommendations,
   recommendations[]}` (clés du spec `templates/total` inexistantes) ;
   option maison : `-n/--max`, `--min-score`, `--dimensions`,
   `--no-rules`, `--no-statistical`.
4. **Section « Recommandations contextuelles » non branchée en produit** :
   `MarkdownReportGenerator.buildContextRecommendationsSection` exige un
   `recommendationEngine` injecté, or `audit report` (CLI), `inspect` et
   l'outil MCP `audit-report` construisent le générateur **sans moteur** →
   la section n'apparaît jamais dans les rapports CLI/MCP (testée
   unitairement au Sprint 16 avec injection). **À soumettre.**
5. **`audit report`** : pas d'option `--with-recommendations` ; JSON
   `{auditId, reports:[{format, filePath}]}` ; message humain
   « ✔ Rapports pour l'audit #N (md) ».
6. **Best practices** : clé JSON `practices` (pas `bestPractices`) ;
   `show` = `{practice: {…}, linkedFindings}` ; `add` exige description ≥
   10 caractères (sinon 4) ; extraction maison = constats **résolus** ≥ 2
   occurrences + score en hausse (et non « titres identiques sur N
   audits »).
7. **Timeline** : `trends` = fenêtre glissante `--lookback <jours>`
   (défaut **90**, absent de `alerts`) ; `trends --json` expose
   `trends[]`, `regressions[]`, `overallTrend` (`analyze` n'a **pas** de
   `regressions`) ; régression = chute inter-audits consécutifs
   **strictement > 10** points ; `analyze --json` =
   `{totalAudits, startDate, endDate, dimensionScores, …}` ;
   `uuid-invalide` → **3** (UUID brut) là où `recommend` → **4**.
8. **Templates** : `show --json` = `{template}` avec `config.tags`
   (pas `tags` top-level) ; `create` sans `--tags`/`--init-empty`
   (`-n -d -c --config --bp-ids --rule-ids`) → `{template:{id,…}}` ;
   `export <id> <fichier>` **positionnel** (pas `-o`), pas d'export
   `--all` (catalogue exporté fichier par fichier) ; `import` crée un
   nouvel id, **sans suffixe « (importé) »** (noms non uniques admis) ;
   `delete` sans confirmation ni `-f` (suppression directe → 0) ;
   NOT_FOUND template → **4** (et non 3) ; builtin immuable → **4**
   (ADR-040) ; `apply --json` = `{projectId, projectName, templateId,
   bestPracticesAssociated, rulesCreated, durationMs}`.
9. **Node du job CI** : le snippet spec utilisait Node `20` ; maison
   `22.x` (coherent avec la matrice qualité et `engines`).

## Vérifications finales

- `npm run test:e2e:mvp3` → 6/6 fichiers, 26/26, **29,8 s**
- `npm test` → 1 656 tests verts (1 630 + 26)
- `npm run lint` → 0 ; `npm run typecheck` → 0
- `npm run build` → 0 (dist/ fraîche avant E2E)
- CI : job `e2e-mvp3` (5 min max) soumis avec le commit 18-01

## Prochaine étape : Sprint 18-02 — Documentation MVP-3 (3 guides)
