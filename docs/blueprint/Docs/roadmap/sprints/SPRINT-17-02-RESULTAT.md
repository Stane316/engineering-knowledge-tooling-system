# Rapport Sprint 17-02 — 10 templates prédéfinis, TemplateApplier, application

**Date :** 25/10/2026 — **Statut :** ✅ TERMINÉ (après `npm run verify`)

## Objectif

Définir les 10 templates prédéfinis (C17.2), implémenter le moteur
d'application avec overrides partiels (C17.3/C17.4, ADR-041) et valider
l'ensemble (C17.13, C17.20).

## Fichiers créés

- `src/templates/builtin-templates.ts` — `BUILTIN_TEMPLATES` : les **10
  templates** (e-commerce, saas, blog, portfolio, corporate, landing,
  documentation, marketplace, news, agency) avec configs réalistes et
  **3-5 règles** chacun (37 au total) — types `BuiltinTemplateDefinition`
  / `BuiltinRuleDefinition` conformes à `CreateRecommendationRuleInput`
- `src/templates/template-applier.ts` — `TemplateApplier` :
  `apply` (projet → config persistée → BP associées → règles actives
  comptées), `mergeConfig` (merge profond des sous-objets, tags
  concaténés, tableaux remplacés), `validate` (erreurs + warnings)
- `src/data/migrations/008_project_config.ts` — table `project_config`
  (config JSON de projet, FK `projects` ON DELETE CASCADE) — **v8**
- `tests/templates/builtin-templates.test.ts` — 7 tests
- `tests/templates/template-applier.test.ts` — 13 tests

## Modifications

- `src/data/migrations/index.ts` — registre v8 (`project-config`)
- `src/templates/template-repository.ts` — `createBuiltin` (insert
  `is_builtin = 1`, usage réservé au seed) + `insertRow` commun
- `src/templates/template-service.ts` — enrichi 17-02 : `seedBuiltins()`
  (idempotent, transaction, insère 10 builtins + leurs règles),
  `applyTemplate` (C17.3/C17.4, introuvable → `ValidationError` code 4),
  `validateTemplate` (C17.20) ; le constructeur appelle le seed
- `tests/templates/template-service.test.ts` — 17 tests (10 filtres
  adaptés au seed + 7 nouveaux : seed/idempotence/perf C17.13,
  apply/overrides, validate) ; tests 17-01 filtrés `isBuiltin: false`
- `tests/templates/template-repository.test.ts` — user_version 8
- Tests existants : `cli.test` (8), `program.test` (v8/schemaVersion 8),
  `database.test` (liste +`{8,'project-config'}`, test-only 7→9),
  `project-migration-003.test.ts` (`[3..8]`)

## Tests : 60 tests ✅ (templates) | Couverture `src/templates/` : 94.30 | 87.34 | 100 | 94.21

## Écarts P3 (spec vs implémentation)

1. **Seed des builtins au code, pas en migration** — spec : INSERT des 10
   « lors de la migration 008 » ; ici `TemplateService.seedBuiltins()`
   idempotent au constructeur (ordre du prompt 17-01 → 17-02 + règle «
   jamais modifier une migration committée »). Le service expose les 10
   dès sa construction (C17.2 « au démarrage »).
2. **Migration `008_project_config` ajoutée** — la spec exécutait
   `INSERT OR REPLACE INTO project_config` mais **ne créait pas cette
   table** (absente du dépôt) : migration maison en v8 (007 = schéma
   templates, 17-01) ; user_version 7 → 8 (tests adaptés).
3. **`projects.url` absent** — le spec faisait `projectRepo.create({url})`
   ; maison le projet n'a pas de colonne `url` → stockée dans
   `metadata.url`.
4. **`rulesCreated`** — spec laissait `0` (« créé via le TemplateService
   avec l'engine », non implémenté) ; ici = nombre de règles du template
   **réellement présentes et actives** dans `recommendation_rules`
   (créées au seed, jamais recréées à chaque apply).
5. **Overrides `additionalBestPracticeIds`/`additionalRuleIds`** gérés à
   l'application (le spec les déclarait dans les types mais `apply` les
   ignorait).
6. **`RecommendationEngine` non injecté** dans l'applier (import inutilisé
   du spec, supprimé), `ProjectRepository` au chemin maison
   `src/data/repositories/`.
7. **Erreurs maison** — template introuvable à l'apply → `ValidationError`
   (code CLI 4) au lieu d'`Error` brut.

## Vérifications finales

- `npx tsc --noEmit` → 0 erreur
- `npx eslint src/ tests/` → 0
- `npx prettier` → OK
- `npx vitest run tests/templates/` → **60/60**
- `npm run build` + tests impactés (cli/program/database/003) → 77/77
- `npm run verify` → EXIT 0 (voir compte-rendu de séance)

## Prochaine étape : Sprint 17-03 — CLI + MCP + Export/Import + Documentation
