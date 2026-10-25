# SPRINT-15 — RAPPORT FINAL DE SÉANCE (Capitalisation des connaissances)

**Statut :** ✅ TERMINÉ (15-01 ✅, 15-02 ✅, 15-03 ✅)  
**Date :** 25 octobre 2026  
**Période :** Semaines 29-30 — Types → Repository → Search → Extractor →
Service → CLI → MCP → Tests → Documentation  
**Branche :** `arena/079e2f26-engineering-knowledge-tooling` (écart P3
« develop » signalé)  
**Feu vert :** reçu le 25/10 pour S15 (S16 exigera le sien).

---

## Objectif

Capitaliser les pratiques éprouvées des audits dans une base interrogeable :
CRUD validé, recherche hybride FTS5+RRF, extraction des constats résolus,
association finding↔pratique, CLI + MCP, traçabilité et perfs, sans breaking
change.

## Fichiers livrés

### `src/best-practices/` (5 fichiers, 15-01/02)

`best-practice.types.ts`, `best-practice-repository.ts`,
`best-practice-search.ts`, `best-practice-extractor.ts`,
`best-practice-service.ts`.

### Migration (15-01)

`src/data/migrations/005_best_practices.ts` (**v5**, écart n°1) :
`best_practices`, `best_practices_fts` (triggers `delete`-command), relations
`finding_best_practice` (2 FK + `confidence`), index.

### Tests (8 fichiers)

`tests/best-practices/` (repository, search, extractor, service),
`tests/cli/best-practice.test.ts`, `tests/mcp/tools/{search,add}-best-practices.test.ts`,
`tests/integration/best-practices-integration.test.ts` + catalogue 12→14 (4).

### Documentation

`docs/guides/BEST_PRACTICES.md`, `docs/CLI.md` §14, `docs/MCP.md` §18,
`docs/API_REFERENCE.md` (API best-practices + 14 outils), rapports de sprint.

### Entrées exposées

- **CLI** : `ekts bestpractice|bp` (`list/search/add/show/delete/extract`) ;
- **MCP** : `search_best_practices` (lecture), `add_best_practice` (écriture) —
  catalogue **14**.

## Critères de succès

| # | Critère | État |
| --- | --- | --- |
| C15.1 | Création manuelle validée | ✅ repository/CLI/MCP |
| C15.2 | Extraction résolu+récurent+score amélioré | ✅ extractor |
| C15.8 | Recherche FTS5 exploitable | ✅ |
| C15.12 | Outil MCP d'ajout avec validation Zod | ✅ |
| C15.13 | Extraction < 5 s / 100 audits | ✅ intégration |
| C15.14 | Recherche < 100 ms / 1 000 BP | ✅ intégration |
| C15.19 | Idempotence extraction | ✅ |
| C15.20 | Cas limites 0/1 audit | ✅ |
| — | Couverture > 80 % nouveaux modules | ✅ (vérif 15-01/02, 15-03 en clôture) |
| — | Pas de breaking changes | ✅ (ajouts purs, migrations non destructives) |

## Vérifications

- 15-01 : verify EXIT 0 — **101 fichiers**, couverture 96,66/92,29/98,07/96,88 ; CI `40232463236` ✓ ;
- 15-02 : verify EXIT 0 — **103 passés + 4 skipped**, couverture 96,59/91,87/98,13/96,8 ;
- 15-03 : verify EXIT 0 + CI (à confirmer) ;
- typecheck/lint/prettier 0 à chaque sous-sprint.

## Dépannage centralisé

- FTS5 trigger = commande **`'delete'`** (jamais `DELETE FROM`) ;
- Score BM25 = `|rank|/max|rank|` (l'assertion « proche de 0 » du spec est
  inversée) ;
- Fixtures de test : `openDatabase({dataDir})` + `AuditSchema` (FTS attachée),
  pas `runMigrations(isolated memory)` ;
- Migration **005** (pas 006 : 001-004 existent) ;
- Catalogue MCP en test = le **build réel** (rebuild après ajout d'outil).

## Écarts P3 consignés (récapitulatif)

1. Branche : spec develop → règle arena ;
2. Migration `005` au lieu de `006` ;
3. Types `best-practice.types.ts` au lieu de `index.ts` ;
4. Score : `|rank|/maxBm25` (inversion spec) ;
5. Dédup : égalité titre normalisé (levenshtein non implémenté) ;
6. `delete` CLI sans `--yes` → code 1 (pas de suppression muette) ;
7. Champ MCP `project_id` snake_case ;
8. Tests CLI/MCP du spec non réutilisables → patterns maison ;
9. `renderTable`/`src/cli/utils/` inexistants → rendu maison ;
10. Chemins docs (guides/), templates de rapports (chemins réels maison) ;
11. Spec « 42 caractères » de titre absente des validateurs réels (tests réécrits) ;
12. Rename pattern (spec) vs replace-fold (réel) sur affichage titre.

## En attente côté user

- Exécution des commandes de merge arena→develop (fournies à la clôture) ;
- Confirmation CI de `045c71b` (15-02) et de la clôture 15-03.

## Prochaine étape

Sprint 16 : uniquement sur feu vert explicite.
