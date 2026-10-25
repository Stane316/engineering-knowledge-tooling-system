# Rapport Sprint 17-03 — CLI, MCP, Export/Import, Tests, Documentation

**Date :** 25/10/2026 — **Statut :** ✅ TERMINÉ (après `npm run verify`)

## Objectif

Livrer la couche utilisateur du module templates : commande CLI
`ekts template` (7 sous-commandes, C17.6/C17.7), outils MCP
`list_templates`/`apply_template` (catalogue 15 → **17**, C17.7/C17.8),
tests CLI/MCP/intégration (C17.9 à C17.14) et documentation
(`guides/TEMPLATES.md` + références).

## Fichiers créés

- `src/cli/commands/template.ts` — `registerTemplateCommands(program,
  runtime)` : `list` (`-c`, `--builtin`/`--custom` exclusifs, `-n` 1-500),
  `show`, `apply` (`--name`/`--url` requis, `--config` JSON), `create`
  (`-n/-d/-c`, `--config`, `--bp-ids`, `--rule-ids`), `delete`, `export`,
  `import` + **alias `tpl`** ; patterns maison (`execute`,
  `CommandResult`, `openTemplateServices` avec seed au démarrage)
- `src/mcp/tools/list-templates.ts` — `executeListTemplates` (filtres
  category/builtin_only/limit, résumé Markdown 📦/✏️)
- `src/mcp/tools/apply-template.ts` — `executeApplyTemplate` (overrides
  snake_case → camelCase, résumé ✅)
- `tests/cli/template.test.ts` — 13 tests (codes 0/1/2/4, alias, JSON)
- `tests/mcp/tools/list-templates.test.ts` — 4 tests
- `tests/mcp/tools/apply-template.test.ts` — 5 tests
- `tests/integration/templates-integration.test.ts` — 10 tests (flux
  complet C17.5, overrides C17.4, protection builtin, 100 templates
  C17.14, 10 applications < 10 s C17.13, idempotence seed, erreurs
  C17.9/C17.11/C17.20)
- `docs/guides/TEMPLATES.md` — guide utilisateur complet (10 prédéfinis,
  7 commandes, 2 outils MCP, table de config, exemples)

## Modifications

- `src/cli/program.ts` — inscription `registerTemplateCommands`
- `src/mcp/schemas/tool-schemas.ts` — `TOOL_DESCRIPTIONS` (+2),
  `TOOL_NAMES` (+2 → **17**), `ListTemplatesInput`/`ApplyTemplateInput`
  (Zod), `TemplateIdInput`, types params
- `src/mcp/context.ts` — membre `templates: TemplateService` (seed au
  constructeur de l'ouverture MCP)
- `src/mcp/handlers/tools.ts` — dispatch ×2, `TOOL_DEFINITIONS` ×2,
  `registerTool` ×2 (`list_templates` lecture seule, `apply_template`
  écriture), doc « dix-sept outils »
- Catalogue 15 → 17 dans `tool-schemas.test.ts`, `server.test.ts`
  (+`apply_template` dans `WRITING_TOOLS`), `handlers/tools.test.ts`,
  `stdio.test.ts`, `add-best-practice.test.ts`
- `tests/mcp/tools/get-recommendations.test.ts` — fixtures adaptées au
  seed builtin (titre/pattern « widget de démonstration » : le titre
  d'origine « Images non optimisées » matchait la règle builtin
  E-commerce, comportement désormais correct)
- Docs : `CLI.md` §16, `MCP.md` §20, `API_REFERENCE.md` §templates
- Statuts `SPRINT-17{,-01,-02,-03}.md` → ✅ ; `REGISTRE-AVANCEMENT.md`
  (4 lignes + 3 entrées journal + prochaines étapes Sprint 18)
- Rapports 17-01/17-02 déplacés dans `roadmap/sprints/` (cohérence S15/S16)

## Tests : 32 tests ✅ nouveaux (13 CLI + 9 MCP + 10 intégration) | Couverture ciblée : 95.10 | 85.28 | 100 | 95.00

(CLI template 95.57 %, outils MCP 100 % statements, `src/templates/`
94.30 | 87.34 | 100 | 94.21)

## Écarts P3 (spec vs implémentation)

1. **Patterns CLI** — spec : `getDatabase()`, `renderTable` importé de
   `../utils/table.js`, `process.exit(1)` unique, `TemplateService(db,
   projectRepo)` ; maison : `openTemplateServices(runtime)`,
   `renderTable` de `src/cli/output.ts`, `execute`/`CommandResult` avec
   codes 0/1/2/4 (`ValidationError` → 4 partout, y compris ressource
   absente, aligné S16 rules).
2. **Patterns MCP** — spec : `registerTool` direct avec entrées
   camelCase (`builtinOnly`, `templateId`) ; maison : découpes
   schemas/dispatch/handlers + entrées snake_case (cohérentes au
   catalogue), `getDatabase()` → `context.templates`.
3. **`src/cli/index.ts` / `src/mcp/tools/index.ts`** (spécifiés) n'existent
   pas : `program.ts` et `handlers/tools.ts` sont les points d'ancrage
   réels.
4. **`--rule-ids`** ajouté à `template create` (le spec ne prévoyait que
   `--bp-ids` alors que `CreateTemplateInput.recommendationRuleIds`
   existe) ; option `show --json` etc. via `withOutputFlags`.
5. **« Projet dupliqué » (C17.20)** : le spec citait une erreur de
   doublon, mais `ProjectRepository` (Sprint 13) n'a **aucune contrainte
   d'unicité** sur `projects.name` — comportement inchangé (audit avant
   modification) et documenté dans le test d'intégration.
6. **Doc** : `docs/user/TEMPLATES.md` → `docs/guides/TEMPLATES.md` ;
   `CLI_REFERENCE.md` → `docs/CLI.md` §16 ; `MCP_REFERENCE.md` →
   `docs/MCP.md` §20 ; exemples MCP convertis en snake_case.
7. **Fixtures S16 adaptées** (voir modifications) : les 37 règles
   builtin sont désormais présentes dans toute base ouverte via le
   contexte MCP — titre/pattern de test isolés pour préserver l'intention
   « rapport vide ».

## Vérifications finales

- `npx tsc --noEmit` → 0
- `npx eslint src/ tests/` → 0
- `npx prettier --check src/ tests/ docs/` → OK
- Tests ciblés : CLI 13/13, MCP 163/163, intégration templates 10/10
- `npm run verify` → EXIT 0 (voir compte-rendu de séance)

## Prochaine étape : `SPRINT-17-RESULTAT.md` (clôture du Sprint 17) → Sprint 18 sous feu vert
