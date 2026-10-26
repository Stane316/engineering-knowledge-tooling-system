# Rapport Sprint 18-02 — Documentation MVP-3

**Date :** 26/10/2026 — **Statut :** ✅ TERMINÉ (liens vérifiés, lint 0)

## Objectif

Rédiger la documentation complète MVP-3 en **synthèse** (ADR-043 : pas
de duplication — référencer les guides détaillés S13-S17) : guide
utilisateur, guide architecture, guide d'extension, et mise à jour de
`API_REFERENCE.md`.

## Fichiers créés

- `docs/MVP3_GUIDE.md` — guide utilisateur synthétique : 5
  fonctionnalités (table + exemples de commandes **réelles**), flux de
  travail complet, table MCP des **17 outils**, configuration
  (environnement maison), liens vers les 5 guides détaillés
  `docs/guides/` + CLI/MCP/API_REFERENCE
- `docs/MVP3_ARCHITECTURE.md` — diagramme (CLI 15 commandes, MCP 17
  outils, 3 bases `ekts.db`/`ekts-fts.db`/`ekts-vectors.db`), les 5
  modules avec fichiers **réels** (`src/business/project-manager*`,
  `src/timeline/*`, `src/best-practices/*`, `src/recommendations/*`,
  `src/templates/*`), schéma des migrations maison 001→008, flux
  (TemplateApplier, extraction résolue, engine de scores), budgets
  **mesurés** (E2E 29,8 s ; extraction/génération ~ ms), extensions
- `docs/MVP3_EXTENSION.md` — pas-à-pas maison : structure module,
  repository synchrone better-sqlite3, migration `src/data/migrations/`
  + registre + `user_version` (tests), contrat de codes CLI 0/1/2/3/4,
  enregistrement MCP (`WRITING_TOOLS`), E2E helper, 7 bonnes pratiques,
  table des patterns avec sources d'exemple réelles

## Fichiers modifiés

- `docs/API_REFERENCE.md` — **+6 outils MCP** documentés avec leurs
  schémas Zod réels (`get_timeline`, `search_best_practices`,
  `add_best_practice`, `get_recommendations`, `list_templates`,
  `apply_template`), compteur « 15 outils » → **17**, pied de page
  « MVP-3 : Sprints 13-18 documentés » (26/10/2026)

## Écarts P3 (spec vs maison)

1. **Chemins des guides** — spec : `docs/user/MVP3_GUIDE.md`,
   `docs/dev/MVP3_ARCHITECTURE.md`, `docs/dev/MVP3_EXTENSION.md` ;
   maison : **racine `docs/`** (convention `USER_GUIDE.md`,
   `MVP2_VALIDATION.md`) — dossiers `user/`/`dev/` non créés.
2. **Commandes du spec refaites** — le gabarit imposait
   `project create --name --url`, `audit <url> --project`,
   `template apply e-commerce`, `recommend rules add --recommendation`,
   `bestpractice add --title/--description`… : toutes réécrites avec les
   signatures réelles établies en 18-01.
3. **MCP « 9 outils » (spec) → 17** (catalogue maison réel) ;
   schémas d'entrée repris de `src/mcp/schemas/tool-schemas.ts`.
4. **Configuration `.ekts/config.json` (spec) inexistante** — maison :
   variables d'environnement (`EKTS_DATA_DIR`…) + options par commande ;
   aucun nouveau mécanisme de config créé.
5. **`npm run docs:check-links` / `docs:lint` (spec) inexistants** —
   vérification maison des liens par script jetable (1 fichier en attente
   livrable 18-03 : `MVP3_VALIDATION.md`) ; `npm run lint` = 0.
6. **Modules** — spec : `src/projects/project.types.ts` ; maison :
   `src/business/project-manager.ts` + `project-manager.types.ts` +
   `src/data/repositories/project-repository.ts` (S13).
7. **Schéma** — `projects.url` n'existe pas (→ `metadata.url`, écart S17) ;
   tables réelles ajoutées (`project_config` 008, `audit_fts`,
   `best_practices_fts` external content).

## Vérifications finales

- Liens des 4 fichiers : **1 seul en attente** (`MVP3_VALIDATION.md`,
  livré 18-03) — les autres résolus ✅
- `npm run lint` → 0 ; `npm run typecheck` → 0
- `npm run test:e2e:mvp3` → 26/26 (prérequis du spec, inchangé)

## Prochaine étape : Sprint 18-03 — Validation C13.1→C17.20, README/CHANGELOG, MVP4_PREPARATION
