# SPRINT-16-01 — RAPPORT DE SÉANCE

**Statut :** ✅ TERMINÉ  
**Date :** 25 octobre 2026  
**Période :** Semaine 31, Jours 1-3 — Types → Migration → Rules → Repository → Engine  
**Branche :** `arena/079e2f26-engineering-knowledge-tooling` (règle arena, écart P3
« develop » signalé)  
**Prérequis :** Sprint 15 terminé (`844b150`, CI `40234801916` ✓).

---

## Objectif

Cœur du moteur de recommandations contextuelles : types partagés, migration
des 2 tables (`recommendation_rules`, `generated_recommendations`), module de
matching des règles, repository CRUD et **moteur hybride** (règles explicites +
scoring statistique + ajustements contextuels — ADR-036/037).

## Fichiers créés (7)

| Fichier | Contenu |
| --- | --- |
| `src/recommendations/recommendation.types.ts` | Types du module (rule, recommendation, report, context, options, matches) |
| `src/recommendations/recommendation-rules.ts` | Matching pur (normalize/match/scoreToPriority/clamp), `DEFAULT_ENGINE_CONFIG`, helpers statistiques |
| `src/recommendations/recommendation-repository.ts` | CRUD règles (filtres/pagination) + recommandations (save/list/clear/count), `ValidationError` |
| `src/recommendations/recommendation-context.ts` | `buildContext` : audits, findings courants, fréquences, tendances ±5, taux de résolution, BP associées (**anticipé**, voir écart 2) |
| `src/recommendations/recommendation-engine.ts` | `generateRecommendations` : règles (base 0.8 + sévérité) + statistique (0.5+freq×0.3) + ajustements (+0.1/-0.1/-0.2/+0.15) + fusion/dédup/tri/persistance |
| `tests/recommendations/recommendation-rules.test.ts` | 15 tests (helpers purs) |
| `tests/recommendations/recommendation-repository.test.ts` | 14 tests (CRUD, filtres, FK ON DELETE SET NULL) |
| `tests/recommendations/recommendation-engine.test.ts` | 18 tests (C16.1→C16.5, C16.12, C16.20) |

## Fichiers modifiés (4)

| Fichier | Modification |
| --- | --- |
| `src/data/migrations/006_recommendations.ts` | **créé** (2 tables + 7 index) |
| `src/data/migrations/index.ts` | `{ version: 6, name: 'recommendations' }` (v5 → v6) |
| `tests/integration/database.test.ts` | liste `schema_migrations` + `user_version` 5→6 ; migration « test-only » factice 6→7 |
| `tests/cli/cli.test.ts`, `tests/cli/program.test.ts` | `PRAGMA user_version`/`schemaVersion` 5→6 |

## Procédure et commandes exactes

```powershell
npm run typecheck
npm run lint
npx vitest run tests/recommendations/
npm run verify    # 0 avant commit
git add <périmètre> && git commit   # 1 commit / sous-sprint
git push origin arena/079e2f26-engineering-knowledge-tooling
```

## Résultats attendus → constatés

- 2 tables + index + FK (projects, rule_id `ON DELETE SET NULL`) ✅ ;
- Repository CRUD complet, filtres dimension/actif/priorité, pagination ✅ ;
- Moteur : matching exact/inclusion/mots-clés, seuil sévérité, bonus sévérité,
  ajustements tendance/résolution, dédup titre, tri décroissant, clamp 0-1 ✅ ;
- **47/47 tests** ; couverture module **94.77 | 86.50 | 98.27 | 94.57** ✅ ;
- typecheck 0, lint 0, prettier 0.

## Vérifications

1. `npm run typecheck` → **0 erreur** ;
2. `npm run lint` → **0 problème** ;
3. `npx vitest run tests/recommendations/` → **47/47** ;
4. couverture `src/recommendations/**` → **94,77 %** (> 80 %) ;
5. `npm run verify` → EXIT 0 (complet, avant commit) ;
6. `npm run build` régénéré avant les tests binaire (CLI compilée lit
   `user_version` depuis `dist/`).

## Écarts P3 signalés (non résolus silencieusement)

1. **Branche** : spec « develop » → règle arena (récurrence S13-S16).
2. **`recommendation-context.ts` livré en 16-01** alors que le prompt
   l'affecte au sous-sprint 16-02 : l'engine de 16-01 l'importe déjà
   (contradiction d'ordre du spec) → implémenté dès 16-01 d'après la
   spécification 16-02 §3.1 complète pour éviter un stub jetable ; 16-02 se
   chargera de ses tests dédiés + rapports.
3. **`recommendation-rules.ts`** listé en livrables sans section de spec →
   implémenté comme module de matching pur exporté (helpers enlinés dans
   l'engine du spec).
4. **Migration** `006` dans `src/data/migrations/` au lieu de `007` dans
   `src/storage/migrations/` + `migration-registry.ts` (répertoires réels).
5. **API synchrone** : `generateRecommendations`/`buildContext` synchrones au
   lieu des `Promise` du spec (convention maison comme S15).
6. **Erreurs** : `ValidationError` maison (code CLI 4) au lieu d'`Error`
   générique du spec.
7. Le spec « 12 outils »/tests fictifs : tests réécrits maison (`openDatabase`
   + `AuditSchema` + fixtures colonnes NOT NULL, jamais `:memory:` isolé).

## Dépannage

- **Tests binaire** (`cli.test`, `program.test`?) : lit `dist/` → `npm run
  build` obligatoire après ajout de migration (`user_version` 5 = build
  périmé) ;
- `api.import` : `Omit<Recommendation, 'id'>` pour les reco en construction
  (`id` généré au `saveRecommendation`) ;
- Attentes de score : ne pas oublier `severityBonus` (sév1 = +0.0375) ni
  l'ajustement « persistant » (taux 0) dans les calculs de test.

## Prochaine étape

Sprint 16-02 : `RecommendationContext` (tests dédiés) + scoring + intégration
rapports Markdown/PDF.
