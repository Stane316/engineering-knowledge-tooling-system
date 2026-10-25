# SPRINT-16-03 — RAPPORT DE SÉANCE

**Statut :** ✅ TERMINÉ  
**Date :** 25 octobre 2026  
**Période :** Semaine 32, Jours 7-9 — CLI → MCP → Tests intégration → Documentation  
**Branche :** `arena/079e2f26-engineering-knowledge-tooling` (écart P3 « develop »)  
**Prérequis :** 16-01 `0e712cb`, 16-02 `d670996`.

---

## Objectif

Bout en bout : commande `ekts recommend|rec` (6 sous-commandes), outil MCP
`get_recommendations` (catalogue 14 → **15**), tests d'intégration du flux
complet et documentation utilisateur/référence — sans breaking change.

## Fichiers créés (6)

| Fichier | Contenu |
| --- | --- |
| `src/cli/commands/recommend.ts` | `registerRecommendCommands` : `generate`, `list`, `rules {list,add,delete,toggle}`, alias `rec` |
| `src/mcp/tools/get-recommendations.ts` | `GetRecommendationsInput` exécutant, résumé Markdown + JSON |
| `tests/cli/recommend.test.ts` | 14 tests (codes 0/1/2/3/4, alias, JSON) |
| `tests/mcp/tools/get-recommendations.test.ts` | 5 tests (vide, règles, options, filtres, Zod -32602) |
| `tests/integration/recommendations-integration.test.ts` | 6 tests (flux complet, bonus BP, statistique, perfs C16.13/14, cas limites) |
| `docs/guides/RECOMMENDATIONS.md` | Guide utilisateur complet |

## Fichiers modifiés (12)

| Fichier | Modification |
| --- | --- |
| `src/cli/program.ts` | enregistrement `registerRecommendCommands` (11ᵉ commande) |
| `src/mcp/context.ts` | membre `recommendations` (engine + contexte + BP) |
| `src/mcp/schemas/tool-schemas.ts` | `GetRecommendationsInput` (`project_id`, bornes), `TOOL_NAMES` 14→15, description |
| `src/mcp/handlers/tools.ts` | définition + dispatch + `registerTools` (`readOnlyHint: true`) |
| 4 tests MCP | catalogue 14→15 (schemas, server, handlers, stdio) + 15 dans `add-best-practice.test` |
| `docs/CLI.md` §15, `docs/MCP.md` §19 (+ vérif 15), `docs/API_REFERENCE.md` (API recommendations), `docs/REPORTS.md` §4 (section 7) |
| Statuts | `SPRINT-16{,-01,-02,-03}.md` → ✅, registre 4 lignes |

## Procédure et commandes exactes

```powershell
npm run typecheck
npm run lint
npm run build          # stdio + tests binaire lisent dist/
npx vitest run tests/cli/recommend.test.ts tests/mcp/ tests/integration/recommendations-integration.test.ts
npm run verify         # 0 avant commit
git add <périmètre> && git commit
git push origin arena/079e2f26-engineering-knowledge-tooling
```

## Résultats attendus → constatés

- 6 sous-commandes avec codes maison 0/1/2/3/4 (validation AVANT ressource) ✅ ;
- `delete --yes` : code 1 sans confirmation (aligné maison, écart P3) ✅ ;
- MCP : 15 outils, entrée `project_id` snake_case, bornes Zod, régénération
  idempotente, `summary` Markdown 📏/📊 ✅ ;
- Tests 16-03 : **14 CLI + 5 MCP + 6 intégration = 25** ; MCP global
  **154/154** ; couverture module > 80 % ✅ ;
- Docs : guide + CLI §15 + MCP §19 + API + rapports §4 ✅.

## Vérifications

1. `npm run typecheck` → 0 ; `npm run lint` → 0 ; prettier 0 ;
2. `npx vitest run tests/mcp/` → 154/154 (après `npm run build`) ;
3. `npm run verify` → EXIT 0 ;
4. catalogue : 15 noms / 15 descriptions distinctes (tests schemas+handlers).

## Écarts P3 signalés

1. **Branche** : spec develop → règle arena.
2. **Champs MCP snake_case** (`project_id`, `max_recommendations`,
   `min_relevance_score`, `include_*`) vs camelCase du spec — cohérence avec
   `search_best_practices` et les autres outils maison.
3. **`renderTable`/`getDatabase`/`process.exit`** du spec inexistants →
   patterns maison (`execute`, palette, rendu en lignes) ;
   `registerRecommendCommand(program)` → `registerRecommendCommands(program, runtime)`.
4. **`--yes` sur `rules delete`** : le spec supprime sans confirmation →
   code 1 (cohérent `bestpractice delete`, 15-03).
5. **Ordre des validateurs** : options invalides = 4 avant contrôle du projet
   (3) — le spec validait dans l'ordre inverse (test échouant avec projet
   absent).
6. **Annotation MCP** : `readOnlyHint: true` (génération reproductible,
   écriture BD idempotente) — le spec n'en précise pas.
7. **Tests du spec** = faux tests (appels service directs) → réécrits maison
   (`runCli`, `dispatchTool`, `openDatabase`).

## Dépannage

- Tests binaire (stdio, catalogue) : `npm run build` obligatoire après ajout
  d'outil (sinon `tools: 14`) ;
- `delete` sans `--yes` = **`throw new Error`** (→ code 1) et non un
  `CommandResult` (sinon code 0) ;
- Scoring statistique : fréquence ≥ 3 requise — fixture 2 audits = 0.

## Prochaine étape

Clôture S16 : `SPRINT-16-RESULTAT.md` + verify global + commit unique.
