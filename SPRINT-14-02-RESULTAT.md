# Rapport de Sprint 14-2 — Alert Manager + Chart Generator

**Statut :** ✅ TERMINÉ
**Date :** 25 octobre 2026
**Branche :** `arena/079e2f26-engineering-knowledge-tooling`

---

## 1. Fichiers créés / modifiés

| Fichier                                  | Action  | Contenu                                                                                                                                                                              |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/migrations/004_alerts.ts`      | créé    | Table `alerts` (10 colonnes, FK `projects ON DELETE CASCADE`, 3 index, idempotente)                                                                                                  |
| `src/data/migrations/index.ts`           | modifié | Inscription `{ version: 4, name: 'alerts' }`                                                                                                                                         |
| `src/storage/types.ts`                   | modifié | Types `Alert`, `CreateAlertInput`, `AlertFilters` (dimension : 5 dims + `overall`)                                                                                                   |
| `src/storage/alert-repository.ts`        | créé    | CRUD synchrone : `create`, `getById`, `list` (filtres projet/résolues/dimension/limite), `markAsResolved` (une seule fois), `delete`, `countActive` + validations Zod-like maisonnes |
| `src/timeline/alert-manager.ts`          | créé    | `checkAndCreateAlerts(report, régressions)` idempotent, `getActiveAlerts`, `getAllAlerts`, `resolveAlert`, `deleteAlert`, seuil configurable (défaut 10, C14.4)                      |
| `src/timeline/chart-generator.ts`        | créé    | **SVG** complet (5 courbes, légende, grille, titres échappés) + **PNG maison** (raster RGBA + micro-fonte 5×7 + `node:zlib`, **zéro dépendance**)                                    |
| `tests/timeline/alert-manager.test.ts`   | créé    | 9 tests (FK réelles : projet + audits + migrations 001→004)                                                                                                                          |
| `tests/timeline/chart-generator.test.ts` | créé    | 7 tests (SVG + PNG : signature, IHDR 800×400, IDAT décompressible, cas vides)                                                                                                        |
| 4 fichiers de tests existants            | adaptés | Attestations « schéma v3 » → v4 (voir §3.3)                                                                                                                                          |

## 2. Tests exécutés et résultats

- `npx vitest run tests/timeline/` : **36/36 ✅** (4 fichiers, cumul 14-1+14-2).
- Couverture ciblée : `src/timeline/` **98,92 % lignes / 85,24 branches**,
  `alert-repository.ts` + `004_alerts.ts` inclus dans **98,37 % / 87,87 %**
  (migration **100 %**).
- `npm run verify` : **code 0** — 1 315 tests ✅ / 34 ⏭ · couverture globale
  **96,84 % lignes / 92,51 % fonctions / 98,40 % branches / 97,10 % instructions**.

## 3. Décisions prises (P3, soumises)

1. **Emplacement/numéro migration** : `src/data/migrations/004_alerts.ts`
   (réel registre `data/migrations/index.ts`), pas
   `src/storage/migrations/005_…` ni `migration-registry.ts` de la spec —
   ceux-ci n'existent pas.
2. **Pas de FK `audit_metadata` dans `alerts`** (écart au SQL de la spec) :
   SQLite résout les dépendances FK en cascade **à chaque `prepare`** des
   statements touchant `projects`/`alerts` → `no such table:
main.audit_metadata` sur toute base sans table d'audit (fixtures CLI/MCP,
   base neuve avant la 1re inspection). **151 tests échouaient** avec les FK ;
   les alertes sont des données dérivées régénérables
   (`checkAndCreateAlerts`), l'intégrité est assurée à la création. FK
   `projects ON DELETE CASCADE` conservée.
3. **Tests existants adaptés v3 → v4** (4 fichiers : `cli.test.ts`,
   `program.test.ts`, `database.test.ts`, `project-migration-003.test.ts`) :
   les attentes codées en dur sur `user_version 3` / `[001,002,003]`
   rendaient l'ajout obligatoire de toute nouvelle migration impossible
   sans cet ajustement ; migration factice `version 4 → 5` dans le test
   d'extension. **Aucun livrable de sprints 1-13 modifié** — seulement des
   attentes de version.
4. **PNG sans dépendance** (C14.5 vs spec) : la spec lançait
   `Error('PNG requires sharp/canvas')` alors que C14.5 impose l'export
   PNG/SVG → rasterisation maison (Bresenham, disques, micro-fonte 5×7
   ASCII avec normalisation NFD des accents) + encodage PNG complet
   (IHDR/IDAT/IEND, CRC32, `node:zlib`) — 0 dépendance ajoutée,
   `npm audit` inchangé.
5. **`AlertManager.checkAndCreateAlerts(report, régressions)`** :
   signature modifiée par rapport à `checkAndCreateAlerts(report, projectId)`
   de la spec — la détection est déléguée à `TrendDetector.detectRegressions`
   (réutilise 14-1) au lieu d'un accès private `alertRepo['db']` avec requête
   SQL brute. + **idempotence** : un doublon actif (même paire d'audits +
   dimension) n'est pas recréé. + filtre `declining`/`overall`.
6. **Repo synchrone, manager async** (pattern maison S13) là où la spec
   annonçait des repos async.
7. **`markAsResolved`** lève `ValidationError` (alerte absente ou déjà
   résolue) au lieu d'un `UPDATE` silencieux ; `deleteAlert` retourne
   `boolean`.

## 4. Problèmes rencontrés et solutions

| Problème                                                 | Solution                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| 151 tests en échec après ajout de 004                    | Chaîne FK résolue au `prepare` (voir §3.2) → suppression des FK audits |
| 6 tests résiduels « schéma v3 »                          | Adaptation des attentes v3 → v4 (§3.3)                                 |
| TS2345 Map.get avec clé `AnalysisDimension \| 'overall'` | Guard `!== 'overall'` pour narrow la clé                               |
| TS18048 `glyph` possibly undefined                       | Glyphe `FALLBACK_GLYPH` explicite                                      |
| `string \| Buffer` non rétréci dans les tests            | Casts `as string` / `as Buffer` après contrôle du format               |

## Prochaine étape

**Sprint 14-3** — CLI `ekts timeline`, MCP `get_timeline`, guide
`TIMELINE.md`, mises à jour CLI/MCP/API_REFERENCE, statuts et rapport final.
