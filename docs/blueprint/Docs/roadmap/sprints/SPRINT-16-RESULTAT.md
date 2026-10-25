# SPRINT-16 — RAPPORT FINAL DE SÉANCE (Recommandations contextuelles)

**Statut :** ✅ TERMINÉ (16-01 ✅, 16-02 ✅, 16-03 ✅)  
**Date :** 25 octobre 2026  
**Période :** Semaines 31-32 — Types → Migration → Rules → Repository → Engine
→ Context → Scoring → Rapports → CLI → MCP → Tests → Documentation  
**Branche :** `arena/079e2f26-engineering-knowledge-tooling` (écart P3
« develop » signalé)  
**Feu vert :** reçu le 25/10 pour S16 (S17 exigera le sien).

---

## Objectif

Transformer le capital S13-S15 en **moteur proactif** : règles explicites +
scoring statistique personnalisé par le contexte projet (historique,
tendances, bonnes pratiques), intégré aux rapports, exposé en CLI et MCP,
sans breaking change (ADR-036/037/038).

## Fichiers livrés

### `src/recommendations/` (5 fichiers)

`recommendation.types.ts`, `recommendation-rules.ts` (matching pur),
`recommendation-repository.ts`, `recommendation-context.ts` (anticipé en
16-01), `recommendation-engine.ts`.

### Migration (16-01)

`src/data/migrations/006_recommendations.ts` (**v6**) : `recommendation_rules`
(3 index), `generated_recommendations` (3 index, FK projects + `rule_id ON
DELETE SET NULL`).

### Entrées exposées

- **CLI** : `ekts recommend|rec` — `generate`, `list`, `rules {list, add,
  delete, toggle}` (C16.8-C16.11) ;
- **MCP** : `get_recommendations` — catalogue **15 outils** (C16.10) ;
- **Rapports** : section « 🧭 Recommandations contextuelles » Markdown (C16.6)
  + PDF (C16.7), `ReportSection 'context-recommendations'` + `ReportOptions.projectId`.

### Tests (9 fichiers)

`tests/recommendations/` ×4 (rules, repository, context, engine — 57 tests),
`tests/cli/recommend.test.ts` (14), `tests/mcp/tools/get-recommendations.test.ts`
(5), `tests/integration/recommendations-integration.test.ts` (6),
`tests/reports/recommendations-integration.test.ts` (10) + catalogue 14→15 (5).

### Documentation

`docs/guides/RECOMMENDATIONS.md`, `docs/CLI.md` §15, `docs/MCP.md` §19,
`docs/API_REFERENCE.md` (API recommendations + 15 outils), `docs/REPORTS.md` §4.7,
rapports de sprint, statuts + registre.

## Critères de succès

| # | Critère | État |
| --- | --- | --- |
| C16.1 | Recommandations issues des règles explicites | ✅ engine + tests |
| C16.2 | Combinaison règles + scoring (fréquence × impact × contexte) | ✅ |
| C16.3 | Personnalisation (historique, tendances) | ✅ ajustements ±0.1/−0.2/+0.15 |
| C16.4/5 | Score 0-1, tri décroissant | ✅ clamp + sort testé |
| C16.6/7 | Sections Markdown + PDF | ✅ optionnelles, HTML échappé |
| C16.8-10 | CLI generate/list + MCP get_recommendations | ✅ |
| C16.11 | Règles gérables en CLI (add/toggle/delete) | ✅ |
| C16.12 | Bonnes pratiques proposées en bonus | ✅ (+0.05, titre dédié) |
| C16.13 | < 5 s / 100 audits | ✅ intégration |
| C16.14 | 10 000 règles sans dégradation | ✅ indexés (1 000 testés, P3) |
| C16.15/16 | Couverture > 80 % + lint 0 | ✅ |
| C16.17 | Documentation complète | ✅ guide + 4 références |
| C16.19/20 | Recos actionnables + cas limites | ✅ (titre, desc, priorité, effort/impact ; 0/1 audit) |

## Vérifications

- 16-01 : verify EXIT 0 — 110 fichiers, cov 96,42/91,34/97,87/96,61 ;
  couverture module 94,77 % ; commits `0e712cb` ;
- 16-02 : verify EXIT 0 — 112 fichiers, cov 96,50/91,32/97,96/96,69 ;
  commit `d670996` ;
- 16-03 : verify EXIT 0 (complet, dernier) ; MCP 154/154 ; catalogue 15.
- typecheck 0, lint 0, prettier 0 à chaque sous-sprint.

## Dépannage centralisé

- Migration **006** (schéma v6) : adapter tests `user_version`/listes +
  `npm run build` pour les tests binaire (dist périmé = `user_version 5`) ;
- Normalisation **conserve les accents** (clés `'cache non configuré'`) ;
- Scoring statistique : fréquence ≥ 3 ; taux 0 = bonus persistant +0.15 ;
- `delete --yes` = `throw new Error` (code 1), jamais un `CommandResult` ;
- validateurs : options **avant** ressource (4 avant 3) ;
- `assertAudit` Markdown exige `dimensions` non vide en fixture ;
- injection de moteur dans les générateurs = constructeur optionnel.

## Écarts P3 consignés (récapitulatif)

1. Branche arena vs develop ;
2. `recommendation-context.ts` livré 16-01 (contradiction d'ordre) ;
3. `recommendation-rules.ts` sans section spec → module de matching pur ;
4. Migration `006` maison vs `007`/`storage/migrations` du spec ;
5. API **synchrone** vs `Promise` du spec ;
6. Snake_case MCP vs camelCase ; annotation `readOnlyHint: true` ;
7. `--yes` sur `rules delete` (spec : suppression muette) ;
8. Ordre validateurs (4 avant 3) ;
9. Classe `PDFReportGenerator` vs `PdfReportGenerator` ; méthodes de section
   **publiques** vs privées (testabilité sans Chrome) ;
10. Section additive `'context-recommendations'` (la `'recommendations'`
    existante = Top 5 S11) ;
11. Faux tests du spec (service directs) → patterns maison ;
12. Test fréquences du spec sans accents (incohérent avec sa propre regex) ;
13. C16.14 : 1 000 règles testées (volume 10 000 = index SQLite, pas de
    scan) ; `renderTable`/`getDatabase`/`src/cli/utils/` inexistants.

## En attente côté user

- Exécution des commandes de merge arena→develop (fournies à la clôture) ;
- Confirmation des CI `0e712cb`, `d670996` et de la clôture 16-03.

## Prochaine étape

Sprint 17 : uniquement sur feu vert explicite.
