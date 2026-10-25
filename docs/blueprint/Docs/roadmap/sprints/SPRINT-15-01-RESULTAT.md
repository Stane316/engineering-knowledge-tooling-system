# Rapport Sprint 15-01 — Types, Migration, BestPracticeRepository, BestPracticeSearch

**Date :** 25/10/2026  
**Statut :** ✅ TERMINÉ  
**Branche :** `arena/079e2f26-engineering-knowledge-tooling`  
**Écart de consigne P3 :** le prompt SPRINT-15.md indique « Branche : `develop` » → règle permanente de la session : travail sur la branche arena uniquement, merge develop fait par l'utilisateur (non suivie).

---

## 1. Fichiers créés

- `src/best-practices/best-practice.types.ts` — types du module (`BestPractice`, entrées, filtres, options/resultats de recherche, `FindingBestPracticeLink`, `ExtractionReport`, `BestPracticeSemanticRanker`)
- `src/data/migrations/005_best_practices.ts` — migration 005 (tables `best_practices`, `best_practices_fts`, `finding_best_practice` + index + triggers FTS5)
- `src/best-practices/best-practice-repository.ts` — CRUD, filtres, pagination, tri borné, `incrementOccurrence`, associations bidirectionnelles, `count`
- `src/best-practices/best-practice-search.ts` — recherche FTS5 (BM25 normalisé), énumération filtrée, fusion **RRF** (k=60, `reciprocalRank`) quand un ranker sémantique est injecté
- `tests/best-practices/best-practice-repository.test.ts` — 27 tests
- `tests/best-practices/best-practice-search.test.ts` — 18 tests

## 2. Fichiers modifiés

- `src/data/migrations/index.ts` — import + `{ version: 5, name: 'best-practices' }`

## 3. Tests exécutés

```
tests/best-practices/ : 45/45 ✅ (repository 27, search 18)
Couverture module best-practices : 92,02 % stmts | 86,48 % branch | 100 % funcs | 91,77 % lines
typecheck 0 · lint 0 · npm run verify : voir rapport de séance (EXIT 0 requis avant push)
```

## 4. Décisions prises (P3)

1. **Numérotation/chemin migration** : spec `src/storage/migrations/006_create_best_practices.ts` + `migration-registry.ts` → réels `src/data/migrations/005_best_practices.ts` + `index.ts` (dernier = 004). Écart soumis.
2. **API synchrone** : interfaces parentes (`SPRINT-15.md` §2.2) annonçaient `Promise` → repositories **synchrones** (better-sqlite3), convention du dépôt. Écart soumis.
3. **FTS5 external content + triggers canoniques** : désindexation par commande spéciale `'delete'` (anciennes valeurs) — un simple `DELETE ... WHERE rowid` dans un trigger sur contenu externe laisse des tokens orphelins (vu : `'original'` encore trouvé après reindex) voire corrompt (`SQLITE_CORRUPT_VTAB`).
4. **Normalisation BM25 corrigée** : `rank` FTS5 est négatif, **plus négatif = meilleur** → score = `|rank| / max|rank|` (le pseudocode spec `1 - |rank|/max` inversait le classement — écart soumis, test spec `score > 0` requalifié en bornes [0;1] + meilleur > 0).
5. **Ranker sémantique optionnel** (`BestPracticeSemanticRanker`) : le service (15-02) branchera les embeddings ; dès 15-01, la fusion RRF est testable et C15.5 préparé (score borné 0-1 via `2/(k+1)`).
6. **Introuvable → `ValidationError`** (message « introuvable ») plutôt qu'`Error('not found')` générique : code 4 CLI / `-32602` MCP réutilisables en 15-03. Écart au test spec, tests adaptés.
7. **Listes blanches de tri** (`ORDER_COLUMNS`) : jamais d'interpolation libre de colonnes/requêtes.
8. **Types uniquement dans `src/best-practices/`** : pas de duplication dans `src/storage/types.ts` (éviter double source de vérité).

## 5. Problèmes rencontrés

1. `SQLITE_CORRUPT_VTAB` sur trigger FTS external content → commande `'delete'` canonique (décision 3).
2. Score BM25 inversé → normalisation corrigée (décision 4).
3. Requête `'images OR (alt'` → après sanitization l'AND implicite excluait tout → test reformulé (termes tous existants) ; la sanitization neutralise bien l'injection.
4. ESLint `no-useless-escape` sur `\[` en classe → regex corrigée.

## 6. Prochaine étape

Sprint 15-02 : `BestPracticeExtractor` + `BestPracticeService` + associations (rapport `SPRINT-15-02-RESULTAT.md`).
