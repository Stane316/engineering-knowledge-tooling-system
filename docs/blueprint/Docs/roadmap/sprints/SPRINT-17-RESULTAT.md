# Rapport Sprint 17 — Templates Projets (dossier parent)

**Date :** 25/10/2026 — **Statut :** ✅ TERMINÉ (3/3 sous-sprints)

## Objectif

Sprint 17 « Templates Projets » (MVP-3, ADR-039 à ADR-041) : permettre
de créer, partager (export/import JSON) et appliquer des **templates de
projets** — dont 10 prédéfinis — avec configuration fusionnée, bonnes
pratiques associées et règles de recommandation, via CLI et MCP.

## Synthèse des sous-sprints

| Sous-sprint | Commit | Livrable | Tests |
| --- | --- | --- | --- |
| 17-01 | `797c110` | `template.types.ts`, migration **007** `project_templates` (v7), `TemplateRepository` (CRUD + protection builtin + export/import), `TemplateService` | 33 ✅ · couv. `src/templates/` 91.22 % |
| 17-02 | `ddaedad` | `builtin-templates.ts` (10 définitions, 37 règles), `TemplateApplier` (apply/merge/validate), seed idempotent au constructeur du service, migration **008** `project_config` (v8) | 60 ✅ · couv. 94.30 % |
| 17-03 | `sprint-17` | CLI `ekts template`/`tpl` (7 sous-commandes), MCP `list_templates` + `apply_template` (catalogue **17**), guide `TEMPLATES.md`, CLI.md §16, MCP.md §20, API §templates | 32 nouveaux ✅ · couv. ciblée 95.10 % |

## Critères C17 — état

| # | Critère | État |
| --- | --- | --- |
| C17.1 | CRUD template manuel | ✅ |
| C17.2 | 10 builtins disponibles au démarrage (seed idempotent) | ✅ |
| C17.3 | Création projet depuis template | ✅ |
| C17.4 | Overrides partiels (merge profond, ADR-041) | ✅ |
| C17.5 | Export/import JSON | ✅ |
| C17.6 | CLI `ekts template` 7 sous-commandes + alias `tpl` | ✅ |
| C17.7 | MCP `list_templates` | ✅ |
| C17.8 | MCP `apply_template` (catalogue 15 → 17) | ✅ |
| C17.9 | Erreur template inexistant | ✅ (code 4 / `VALIDATION_FAILED`) |
| C17.10 | — (voir C17.9) | ✅ |
| C17.11 | JSON invalide (import) | ✅ code 4 |
| C17.12 | Projet dupliqué | ⚠️ P3 : pas de contrainte d'unicité dans `ProjectRepository` (comportement historique conservé, cf. 17-03 §5) |
| C17.13 | Apply < 10 s | ✅ tests (< 10 ms mesurés) |
| C17.14 | 100 templates gérés | ✅ test création/pagination/filtres |
| C17.15-19 | Tests + docs (CLI, MCP, intégration, `TEMPLATES.md`, référence) | ✅ |
| C17.20 | Gestion erreurs (template absent, JSON, entrées) | ✅ |

## Écarts P3 agrégés (détaillés dans les rapports de sous-sprints)

**Migrations/schéma** : 007 maison `src/data/migrations/` (≠ 008
`src/storage/migrations/` du spec) ; seed des builtins **au code** et non
dans la migration (ordre 17-01 → 17-02 imposé, migration committée
inmodifiable) ; migration **008 `project_config` ajoutée** (table
supposée existante par le spec, absente du dépôt) ; `projects.url`
absent → `metadata.url`.

**Interfaces** : méthodes synchrones (≠ `Promise` du spec parent) ;
`rulesCreated` compte les règles actives présentes (spec laissait `0`) ;
overrides `additional*` gérés (spec les ignorait à l'apply) ; filtre
`tags` post-filtre application (ADR-039).

**Erreurs/codes** : `ValidationError` maison (`VALIDATION_FAILED` →
code CLI 4) pour absents/builtins immuables/entrées, ≠ `Error` générique
du spec (→ 1) ; ordre maison UUID → options → ressource.

**Points d'ancrage** : `program.ts` (≠ `cli/index.ts`), `handlers/tools.ts`
(≠ `mcp/tools/index.ts`), guide `guides/TEMPLATES.md` (≠ `docs/user/`),
`CLI.md`/`MCP.md` (≠ `CLI_REFERENCE.md`/`MCP_REFERENCE.md`), rapports
dans `roadmap/sprints/`.

**Règles maison respectées** : branche `arena/079e2f26-engineering-knowledge-tooling`,
1 commit par sous-sprint, verify 0 avant chaque push, aucune PR, doc
française, aucune modification des sprints 1-13.

## Vérifications

- `npm run verify` → **EXIT 0** (1 630 tests, 34 skipped — chiffres du
  compte-rendu de séance) ; couverture globale ≥ 96 %
- CI : `40242419180` (17-01) ✓, suivantes en cours de suivi
- Worktree propre à la clôture

## Prochaine étape : **Sprint 18** — en attente du feu vert explicite de l'utilisateur
