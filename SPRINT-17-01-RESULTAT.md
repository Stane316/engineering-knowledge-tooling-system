# Rapport Sprint 17-01 — Types, Migration, Repository, Service

**Date :** 25/10/2026 — **Statut :** ✅ TERMINÉ (après `npm run verify`)

## Objectif

Créer le socle du module de templates : `template.types.ts`, migration
`project_templates`, `TemplateRepository` (CRUD + protection builtins +
export/import) et `TemplateService` (orchestrateur), avec tests unitaires
couvrant le module à > 80 %.

## Fichiers créés

- `src/templates/template.types.ts` — `ProjectTemplate`, `TemplateConfig`
  (ADR-039), `TemplateCategory` (10 catégories + `custom`), entrées
  CRUD, filtres, overrides, `TemplateExport` (C17.5), `ValidationResult`
- `src/templates/template-repository.ts` — CRUD complet, protection
  builtins (ADR-040), export/import JSON, filtres (category, isBuiltin,
  tags, pagination, tri builtins→nom), `count`
- `src/templates/template-service.ts` — façade orchestrateur (CRUD,
  export/import, count) — voir écart 4
- `src/data/migrations/007_templates.ts` — table `project_templates`
  (config/JSON, best_practice_ids, recommendation_rule_ids, is_builtin,
  horodatages) + 3 index — **v7**
- `tests/templates/template-repository.test.ts` — 23 tests
- `tests/templates/template-service.test.ts` — 10 tests

## Modifications

- `src/data/migrations/index.ts` — registre : `{ version: 7, name:
'templates', up: migration007Templates }`
- `tests/integration/database.test.ts` — liste migrations appliquées
  `{7, 'templates'}` + user_version 7 ; migration test-only 7 → 8
- `tests/integration/project-migration-003.test.ts` — `[3,4,5,6,7]`
- `tests/cli/cli.test.ts` — user_version attendue 7
- `tests/cli/program.test.ts` — sortie `schéma v7` + `schemaVersion: 7`

## Tests : 33 tests ✅ (templates) | Couverture `src/templates/` : 91.22 | 90.78 | 100 | 91.15

## Écarts P3 (spec vs implémentation)

1. **Migration 007 maison** — spec : `src/storage/migrations/008_create_templates.ts`
   - `migration-registry.ts` ; maison : `src/data/migrations/007_templates.ts`
     (répertoire réel, dernier numéro 006 au Sprint 16).
2. **Seed builtins hors migration** — spec §2.4 : INSERT des 10 prédéfinis
   « lors de la migration » ; ici **idempotent au code** (`seedBuiltins`,
   Sprint 17-02) car le prompt impose l'ordre Types→Migration→Repository→Service
   (17-01) puis Builtins (17-02), et une migration appliquée ne se modifie pas.
3. **Service partiel en 17-01** — spec §3.4 montrait déjà `applyTemplate`/
   `validateTemplate`/`TemplateApplier` (implémenté au 17-02 par le prompt) :
   en 17-01 CRUD/export/import/count seulement, enrichissement en 17-02
   (évitement du stub, leçon Sprint 16 — jamais de code « presque marchant »).
4. **Interfaces synchrones** — spec parente annonçait `Promise` ; convention
   maison : synchrone (better-sqlite3), conformes aux dépôts existants.
5. **Erreurs maison** — spec lève `Error` générique (→ code CLI 1) ; ici
   `ValidationError` (code maison `VALIDATION_FAILED` → `exitCodeFor` = **4**)
   pour ressource absente, builtin immuable et entrées invalides ; JSON invalide
   import → 4 (C17.20 sans code imposé).
6. **Validation d'entrées ajoutée** — nom non vide + catégorie dans liste
   blanche (le repo spec ne validait rien ; Zod n'arrive qu'en MCP/CLI 17-03).
7. **Filtre `tags` de l'interface non géré par la spec SQL** — post-filtre
   application (ADR-039 : pas de requête sur JSON) avec pagination appliquée
   après filtrage (cas tests dédiés).

## Vérifications finales

- `npx tsc --noEmit` → 0 erreur
- `npx eslint src/templates/ tests/templates/` → 0
- `npx prettier --write` → OK
- `npx vitest run tests/templates/` → 33/33
- `npx vitest run` complet → vert (y compris adaptations user_version 7,
  rebuild `dist/` inclus)
- `npm run verify` → EXIT 0 (voir compte-rendu de séance)

## Prochaine étape : Sprint 17-02 — 10 templates prédéfinis + TemplateApplier
