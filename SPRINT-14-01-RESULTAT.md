# Rapport de Sprint 14-1 — Timeline + Trend Detection

**Statut :** ✅ TERMINÉ
**Date :** 25 octobre 2026
**Branche :** `arena/079e2f26-engineering-knowledge-tooling`

---

## 1. Fichiers créés / modifiés

| Fichier                                    | Action  | Contenu                                                                                                                     |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/timeline/timeline.types.ts`           | créé    | Types : `TimelineAnalysis`, `DimensionTimeline`, `DimensionScorePoint`, `Trend`, `TrendReport`, `TrendConfig`, `Regression` |
| `src/timeline/timeline-analyzer.ts`        | créé    | `TimelineAnalyzer.analyze()`, `getAuditsByDateRange()`, séries par dimension, stats (moyenne/min/max)                       |
| `src/timeline/trend-detector.ts`           | créé    | `TrendDetector.detectTrends()` (régression linéaire + R², seuils configurables), `detectRegressions()` (seuil 10 pts)       |
| `src/storage/audit-repository.ts`          | modifié | + `listByProject(projectId, limit)` : audits d'un projet en ordre chronologique (index migration 003)                       |
| `tests/timeline/timeline-analyzer.test.ts` | créé    | 9 tests (base SQLite réelle + `AuditSchema`)                                                                                |
| `tests/timeline/trend-detector.test.ts`    | créé    | 11 tests (timelines synthétiques)                                                                                           |

## 2. Tests exécutés et résultats

- `npx vitest run tests/timeline/` : **20/20 ✅** (2 fichiers).
- `npm run typecheck` : **0** · `npm run lint` : **0**.
- Couverture du module (run ciblé) : `src/timeline/` =
  **98,14 % lignes / 83,56 % branches / 100 % fonctions** (> 80 % ✅).

## 3. Décisions prises (P3, soumises)

1. **`Regression.dimension : AnalysisDimension | 'overall'`** — la spec §3.1
   typait `Dimension` seul alors que la §2.4 du parent exige « alertes par
   dimension **et sur le score global** » : le type a été élargi.
2. **0 audit → analyse vide** (jamais d'exception) — le snippet §3.2 lançait
   `Aucun audit trouvé` alors que C14.15 impose une gestion non bloquante des
   cas limites ; C14.15 prime, décision documentée.
3. **`ProjectNotFoundError`** au lieu d'`Error('Projet … introuvable')` —
   alignement sur le code de sortie 3 de la CLI (matrice existante).
4. **`AuditMetadata.scores` / `findingsCounts` n'existent pas** dans le code
   réel : les séries sont construites depuis `Audit.dimensions` hydratés, et
   `TimelineAnalysis.audits` est typé `Audit[]` (pas `AuditMetadata[]`).
5. **Nouvelle méthode `AuditRepository.listByProject`** (la spec supposait un
   `list({ projectId })` inexistant) : SQL dédié `ORDER BY timestamp ASC`,
   s'appuyant sur l'index `idx_audit_metadata_project_id` (003).
6. **Fixtures adaptées au schéma réel** : la §3.4 testait un faux schéma
   (`projects.url`, `audit_metadata.scores` JSON, `projectRepo.create({url})`)
   → tests réécrits avec `openDatabase` + `AuditSchema.createSchema()` +
   `AuditRepository.store(report, { projectId })`, le pattern CLI réel.
7. **`analyze()` reste `async`** (interface spec) malgré des repos synchrones.
8. **`getTrend` (ROADMAP) non réutilisé** : `AuditStatisticsManager.getTrend`
   produit des séries globales par période, sans notion de projet ni de
   dimension — pas de recouvrement avec `TimelineAnalyzer` (pas de duplication).

## 4. Problèmes rencontrés et solutions

| Problème                                                                          | Solution                                                                                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Restauration inter-tours : HEAD sur `c46cc18`, 191 entrées, `node_modules` absent | `git reset --hard origin/arena` (perte zéro : aucun travail nouveau), `npm ci`, verify 0 rétabli                             |
| Specs S14 absentes de la branche                                                  | Récupérées depuis `develop` (`138a550` : sprints 14-18 + registre) — 26 fichiers intégrés à l'identique (merge sans conflit) |
| `noUncheckedIndexedAccess` (TS2532 ×10)                                           | Guards `?.` / `??` sur accès indexés                                                                                         |
| `Database` type-only importé mais utilisé en namespace                            | `import type Database from 'better-sqlite3'`                                                                                 |
| Tests `no such table: audit_metadata`                                             | Ajout de `new AuditSchema(...).createSchema()` dans `beforeEach` (bootstrap CLI réel)                                        |
| 3 assertions fausses (moyennes globales : +5 et −5 s'annulent ; overall dilué)    | Assertions corrigées vers le comportement mathématique réel                                                                  |

## 5. Vérifications finales 14-1

- typecheck 0 · lint 0 · tests timeline 20/20 · couverture timeline 98,14 %.
- `npm run verify` complet : code 0 (voir CI).

## Prochaine étape

**Sprint 14-2** — Alert Manager (table `alerts`, migration 004) +
Chart Generator (export PNG/SVG sans dépendance).
