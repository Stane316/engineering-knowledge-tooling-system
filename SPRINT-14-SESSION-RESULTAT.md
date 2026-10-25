# Rapport de séance — Clôture Sprint 14 (Suivi Temporel)

**Date :** 25/10/2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Statut : ✅ SPRINT 14 TERMINÉ — rapport final · STOP en fin de message (feu vert S15 attendu)**

---

## 1. Résumé des trois sous-sprints (tout poussé, CI vertes)

| Sous-sprint                       | Commit        | CI                | Verdict            |
| --------------------------------- | ------------- | ----------------- | ------------------ |
| **14-1** Timeline + tendances     | `d903f9e`     | `40225568160`     | ✅ success         |
| **14-2** Alertes + graphiques     | `11370d4`     | `40226898426`     | ✅ success         |
| **14-3** CLI + MCP + tests + docs | **`efa6bc7`** | **`40229199131`** | ✅ **success 7/7** |

> Conformément à la règle **« 1 commit / sous-sprint » + « verify 0 avant chaque
> push »** : 14-3 n'a été poussé **qu'après** validation de la CI 14-2 et
> `npm run verify` EXIT 0 local.

## 2. `npm run verify` — résultat final

```
Test Files   99 passed | 4 skipped (103)
Tests     1 342 passed | 34 skipped (1 376)
All files  cov 96,83 % stmts | 92,51 % branch | 98,01 % funcs | 97,07 % lines
EXIT = 0   (typecheck 0, lint 0, prettier 0)
```

Couverture **> 96 %** (exigence §3.6) et **> 80 %** (C14.10) : ✅

## 3. Livrables 14-3

- **CLI** `src/cli/commands/timeline.ts` : `ekts timeline analyze|trends|alerts|chart`
  — codes retour 0/1/2/3/4 maîtrisés, fenêtres `--start/--end` **inclusives**,
  `alerts --check` idempotent, `--all`, `--resolve`, chart SVG/PNG borné
  (80×80 → 4000×3000), sorties humaines/`--json` via `execute`.
- **MCP** `src/mcp/tools/get-timeline.ts` : **12ᵉ outil** `get_timeline`,
  lecture seule (`readOnlyHint: true`), défauts Zod (`lookback_days 90`,
  `threshold 10`, `include_alerts true`, `include_charts false`), réponse =
  `period/dimensions/trends/overallTrend/regressions/summary` (+ `alerts`,
  `charts.svg`), erreurs `-32602` / `-32000` (projet absent).
- **Câblage** : `context.timeline` (analyzer, detector, alertRepository,
  alertManager, chartGenerator) construit dans `openMcpServices` ;
  `GetTimelineInput` + `TOOL_DESCRIPTIONS` + `TOOL_NAMES`→12 + dispatch +
  `registerTools` ; `TimelineAnalyzer.analyze` enrichi de `start`/`end`
  (`start > end` → `ValidationError`).
- **Tests** : `tests/cli/timeline.test.ts` (**17**),
  `tests/mcp/tools/get-timeline.test.ts` (**7**),
  `tests/integration/timeline-integration.test.ts` (**3** : 50 audits < 2 s,
  détection < 1 s, cas 0/1/erroné) + migration catalogue **11 → 12** dans
  4 fichiers de tests existants.
- **Docs (français)** : `docs/guides/TIMELINE.md` (guide complet : objectif,
  prérequis, commandes exactes, codes, dépannage, récupération, sécurité),
  `docs/CLI.md` **§13**, `docs/MCP.md` **§17** (+ « Vérification (12 outils) »),
  `docs/API_REFERENCE.md` (« 12 outils » + section **« API timeline »**).
- **Statuts** : `SPRINT-14{,-01,-02,-03}.md` → ✅ TERMINÉ ; registre
  d'avancement : lignes **S14** complétées (+ rattrapage statuts S13 conformes au
  VALIDÉ déjà notifié) ; **`SPRINT-14-RESULTAT.md`** rédigé (synthèse, fichiers,
  **C14.1→C14.15 tracés**, 9 décisions P3, 7 problèmes, **7 recommandations S15**).

## 4. Critères d'acceptation

**C14.1 → C14.15 : tous ✅** (détail en tableau dans `SPRINT-14-RESULTAT.md` §4).
Points de vigilance couverts explicitement : chronologie (C14.1), 5 dimensions
(C14.2), tendances (C14.3), alertes > 10 pts idempotentes (C14.4), export
PNG/SVG (C14.5), CLI (C14.6), MCP (C14.7), perf mesurées (C14.8/C14.9), couverture
(C14.10), lint (C14.11), graphiques lisibles (C14.12), alertes non bloquantes
(C14.13), doc (C14.14), cas limites (C14.15).

## 5. Écarts / contradictions signalés (P3 — non résolus silencieusement)

1. **Branche** : la spec S14 imposait `git push origin agent/sprint-14` →
   **non suivie** (règle permanente : `arena/079e2f26-engineering-knowledge-tooling`).
2. **APIs spec 14-3 inexistantes** (`getDatabase`, `analyzeProject`,
   `analyzeTrends(lookbackDays)`, `trendReport.regressions`) → réécrites en
   (`openDatabase`/`context`, `analyze(projectId,{start,end})`,
   `detectTrends`, `detectRegressions`).
3. **Guide** : spec `docs/user/TIMELINE.md` (dossier absent) → `docs/guides/TIMELINE.md`
   (prompt + structure réelle).
4. **`timeline alerts --check`** ajouté (spec MCP = lecture seule ; la CLI devait
   pouvoir créer les alertes de C14.4).
5. **Paramètres MCP** : snake_case réels (`project_id`, `start_date`,
   `lookback_days`) vs camelCase spec (`projectId`, `lookbackDays`).
6. Registre stageé : lignes S13 affichaient « Non commencé » malgré S13 VALIDÉ →
   statuts rattrapés.

## 6. Séquence de fusion sur `develop` (PowerShell — à exécuter vous-même)

```powershell
git fetch origin
git checkout develop
git pull origin develop
git merge origin/arena/079e2f26-engineering-knowledge-tooling
git push origin develop
git log --oneline -5
```

Puis vérification :

```powershell
npm ci
npm run build
npx ekts init
npx ekts timeline analyze --json
```

## 7. Recommandations S15 (extraites pour la préparation)

1. Lire `SPRINT-15{,-01}.md` intégralement avant toute écriture.
2. Continuer sur la branche arena (le prompt S15 nommera `agent/sprint-15` →
   même contradiction à signaler, ne pas suivre).
3. Réutiliser les contrats S14 (fixtures DB, `execute`, registre MCP en 5 points,
   FK non testées au CREATE — leçon 14-2).
4. Migration `005` dans la grammaire `004_alerts` ; tests catalogue si 13ᵉ outil.
5. Docs : `docs/guides/` + références + tests de perf bornés ×2 marge CI.
6. Vérifier après merge develop qu'aucun statut S13/S14 n'a régressé.

---

# STOP

**Sprint 14 livré et poussé (3/3 sous-sprints, 3 CI vertes, verify 0).**
**Je m'arrête ici : en attente de votre feu vert explicite pour Sprint 15
(Capitalisation — transverses et templates).** Aucune ligne de code S15 n'a été
touchée.
