# LIVRABLE DOCUMENTAIRE — SPRINT 16 (Recommandations Contextuelles)

**Date :** 25 octobre 2026  
**Auteur :** Agent documentaire (Arena.ai)  
**Statut :** ✅ TERMINÉ — Dossier documentaire complet prêt pour implémentation

---

## 1. Récapitulatif des livrables

### 1.1 Documents créés

| # | Fichier | Lignes | Taille | Contenu |
|---|---------|--------|--------|---------|
| 1 | `SPRINT-16.md` | ~430 | ~15 KB | Document principal : contexte, objectifs, architecture hybride, décomposition, ADR, risques, prompt exécution |
| 2 | `SPRINT-16-01.md` | ~660 | ~24 KB | Sous-sprint 1 : Types + Migration + RecommendationRules + Repository + Engine + tests |
| 3 | `SPRINT-16-02.md` | ~460 | ~16 KB | Sous-sprint 2 : RecommendationContext + Scoring contextuel + Intégration rapports Markdown/PDF |
| 4 | `SPRINT-16-03.md` | ~570 | ~20 KB | Sous-sprint 3 : CLI (4 sous-commandes) + MCP + Tests intégration + Documentation |

**Total : 4 documents, ~2 120 lignes, ~75 KB**

### 1.2 Emplacement

```
docs/blueprint/Docs/roadmap/sprints/
├── SPRINT-16.md              (document principal)
├── SPRINT-16-01.md           (sous-sprint 1 : Rules + Repository + Engine)
├── SPRINT-16-02.md           (sous-sprint 2 : Context + Scoring + Rapports)
└── SPRINT-16-03.md           (sous-sprint 3 : CLI + MCP + Docs)
```

---

## 2. Structure du Sprint 16

### 2.1 Décomposition en sous-sprints

| Sous-sprint | Durée | Composants | Fichiers à créer |
|-------------|-------|-----------|-----------------|
| **16-01** | 3 jours | Types, Migration, Rules, Repository, Engine | 7 fichiers (types, migration, 3 modules, 2 tests) |
| **16-02** | 3 jours | Context, Scoring, Intégration rapports | 3 fichiers (context, test context, test rapports) |
| **16-03** | 3 jours | CLI, MCP, Tests intégration, Documentation | 4 fichiers code + 1 doc + 3 tests + 1 rapport |

### 2.2 Dépendances

```
SPRINT-15 (Capitalisation Connaissances)
  │
  ▼
SPRINT-16-01 (Rules + Repository + Engine)
  │
  ├─── RecommendationEngine (règles + scoring statistique)
  │
  ▼
SPRINT-16-02 (Context + Scoring + Rapports)
  │
  ├─── RecommendationContext (tendances, résolutions, BP)
  ├─── Intégration Markdown/PDF
  │
  ▼
SPRINT-16-03 (CLI + MCP + Docs)
  │
  ▼
SPRINT-17 (Templates Projets)
```

### 2.3 Architecture cible

```
src/recommendations/
├── recommendation.types.ts         (16-01)
├── recommendation-rules.ts         (16-01)
├── recommendation-repository.ts    (16-01)
├── recommendation-engine.ts        (16-01)
└── recommendation-context.ts       (16-02)

src/storage/
└── migrations/
    └── 007_create_recommendations.ts  (16-01)

src/reports/
├── markdown-generator.ts           (16-02, modifié)
└── pdf-generator.ts                (16-02, modifié)

src/cli/commands/
└── recommend.ts                    (16-03)

src/mcp/tools/
└── get-recommendations.ts          (16-03)

docs/user/
└── RECOMMENDATIONS.md              (16-03)
```

---

## 3. Fichiers à créer par sous-sprint

### 3.1 Sprint 16-01 (Rules + Repository + Engine)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/recommendations/recommendation.types.ts` | Nouveau | Types partagés (Rule, Recommendation, Context, etc.) |
| `src/recommendations/recommendation-rules.ts` | Nouveau | Modèle de règles explicites |
| `src/recommendations/recommendation-repository.ts` | Nouveau | CRUD règles + recommandations générées |
| `src/recommendations/recommendation-engine.ts` | Nouveau | Moteur hybride (règles + scoring statistique) |
| `src/storage/migrations/007_create_recommendations.ts` | Nouveau | Migration tables |
| `tests/recommendations/recommendation-repository.test.ts` | Nouveau | Tests Repository |
| `tests/recommendations/recommendation-engine.test.ts` | Nouveau | Tests Engine |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/storage/migrations/migration-registry.ts` | Ajout migration 007 |

### 3.2 Sprint 16-02 (Context + Scoring + Rapports)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/recommendations/recommendation-context.ts` | Nouveau | Contexte projet (tendances, fréquences, résolutions) |
| `tests/recommendations/recommendation-context.test.ts` | Nouveau | Tests Context |
| `tests/reports/recommendations-integration.test.ts` | Nouveau | Tests intégration rapports |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/reports/markdown-generator.ts` | Ajout section recommandations |
| `src/reports/pdf-generator.ts` | Ajout section recommandations |

### 3.3 Sprint 16-03 (CLI + MCP + Docs)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/cli/commands/recommend.ts` | Nouveau | Commande `ekts recommend` (4 sous-commandes) |
| `src/mcp/tools/get-recommendations.ts` | Nouveau | Outil MCP get_recommendations |
| `tests/cli/recommend.test.ts` | Nouveau | Tests CLI |
| `tests/mcp/tools/get-recommendations.test.ts` | Nouveau | Tests MCP |
| `tests/integration/recommendations-integration.test.ts` | Nouveau | Tests d'intégration |
| `docs/user/RECOMMENDATIONS.md` | Nouveau | Guide utilisateur |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/cli/index.ts` | Enregistrement commande recommend |
| `src/mcp/tools/index.ts` | Enregistrement outil get_recommendations |
| `docs/reference/CLI_REFERENCE.md` | Section `ekts recommend` |
| `docs/reference/MCP_REFERENCE.md` | Section `get_recommendations` |
| `docs/REPORTS.md` | Section recommandations |

**Rapport final :**
| Fichier | Type | Description |
|---------|------|-------------|
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-16-RESULTAT.md` | Nouveau | Rapport de clôture |

---

## 4. Plan de présentation à l'agent de développement

### 4.1 Ordre de lecture

1. **`SPRINT-16.md`** — Vue d'ensemble, architecture, ADR
2. **`SPRINT-16-01.md`** — Cœur du moteur (rules + engine)
3. **`SPRINT-16-01-RESULTAT.md`** — Résultats sous-sprint 1
4. **`SPRINT-16-02.md`** — Contexte + intégration rapports
5. **`SPRINT-16-02-RESULTAT.md`** — Résultats sous-sprint 2
6. **`SPRINT-16-03.md`** — CLI + MCP + Documentation
7. **`SPRINT-16-RESULTAT.md`** — Rapport final

### 4.2 Prompt d'exécution (extrait de SPRINT-16.md §7)

```markdown
**CONTEXTE :**
- Projet : EKTS
- Sprint : 16 — Recommandations Contextuelles
- Branche : `develop`
- Prérequis : Sprints 13-15 terminés

**INSTRUCTIONS :**
1. Lire SPRINT-16.md pour comprendre les objectifs
2. Implémenter 16-01 (Rules + Repository + Engine)
3. Tester avec `npm run verify`
4. Implémenter 16-02 (Context + Rapports)
5. Tester avec `npm run verify`
6. Implémenter 16-03 (CLI + MCP + Docs)
7. Rédiger SPRINT-16-RESULTAT.md
8. `npm run verify` doit passer

**CONTRAINTES :**
- Approche hybride : règles explicites + scoring statistique
- Pas de ML requis
- Couverture > 80% pour les nouveaux modules
- Recommandations = section optionnelle dans les rapports (ne pas casser)
- Fournir les emplacements exacts des fichiers

**LIVRABLES :**
- Code fonctionnel (src/recommendations/)
- Tests complets
- Intégration rapports Markdown/PDF
- Documentation utilisateur
- Rapport de sprint
- `npm run verify` passe
```

---

## 5. Récapitulatif des ADR

### ADR-036 : Approche hybride (règles + scoring statistique)

**Décision :** Combiner règles explicites et scoring statistique.

**Justification :**
- Règles = testables, explicables, maintenables
- Scoring = capture les patterns non couverts par les règles
- Pas de ML requis (cohérent avec roadmap)

### ADR-037 : Scoring de pertinence contextuel

**Décision :** Score (0-1) basé sur : base + sévérité + tendances + historique.

**Justification :**
- Priorisation transparente et explicable
- Prend en compte le contexte spécifique du projet

### ADR-038 : Intégration dans les rapports existants

**Décision :** Étendre MarkdownReportGenerator et PdfReportGenerator.

**Justification :**
- Réutilisation du capital existant
- Section optionnelle, non-bloquante

---

## 6. Récapitulatif des risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Complexité du moteur | Élevée | Élevé | Prototype obligatoire (règles + scoring) |
| Recommandations non pertinentes | Moyenne | Moyen | Validation humaine (20 projets), ajustement seuils |
| Performance 10 000 règles | Faible | Moyen | Index SQLite, pagination, cache contextes |
| Intégration rapports invasive | Faible | Faible | Section optionnelle, activable par flag |

---

## 7. Chemins complets des fichiers

### 7.1 Documents de spécification

```
docs/blueprint/Docs/roadmap/sprints/SPRINT-16.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-16-01.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-16-02.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-16-03.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-16-LIVRABLE-DOCUMENTAIRE.md  (ce document)
```

### 7.2 Documents de référence

```
docs/ROADMAP.md                                                          (MVP-3 : Recommandations)
docs/blueprint/Docs/06-Security/06_MCP_SECURITY_GUARDRAILS.md            (sécurité MCP)
docs/blueprint/Docs/05-Creative-Engineering/13_CLI_GUIDE.md              (conventions CLI)
src/analysis/types.ts                                                    (Finding, Severity, Priority)
src/best-practices/best-practice-service.ts                              (réutilisation Sprint 15)
src/reports/markdown-generator.ts                                        (extension rapports)
src/reports/pdf-generator.ts                                             (extension rapports)
```

### 7.3 Fichiers à créer (code source)

**Sprint 16-01 :**
```
src/recommendations/recommendation.types.ts
src/recommendations/recommendation-rules.ts
src/recommendations/recommendation-repository.ts
src/recommendations/recommendation-engine.ts
src/storage/migrations/007_create_recommendations.ts
tests/recommendations/recommendation-repository.test.ts
tests/recommendations/recommendation-engine.test.ts
```

**Sprint 16-02 :**
```
src/recommendations/recommendation-context.ts
tests/recommendations/recommendation-context.test.ts
tests/reports/recommendations-integration.test.ts
```

**Sprint 16-03 :**
```
src/cli/commands/recommend.ts
src/mcp/tools/get-recommendations.ts
tests/cli/recommend.test.ts
tests/mcp/tools/get-recommendations.test.ts
tests/integration/recommendations-integration.test.ts
docs/user/RECOMMENDATIONS.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-16-RESULTAT.md
```

### 7.4 Fichiers à modifier (code source)

```
src/storage/migrations/migration-registry.ts    (16-01 : ajout migration 007)
src/reports/markdown-generator.ts               (16-02 : section recommandations)
src/reports/pdf-generator.ts                    (16-02 : section recommandations)
src/cli/index.ts                                (16-03 : enregistrement commande)
src/mcp/tools/index.ts                          (16-03 : enregistrement outil)
docs/reference/CLI_REFERENCE.md                 (16-03 : section recommend)
docs/reference/MCP_REFERENCE.md                 (16-03 : section get_recommendations)
docs/REPORTS.md                                 (16-03 : section recommandations)
```

---

## 8. Checklist de validation

### 8.1 Validation documentaire (ce livrable)

- ✅ Document principal `SPRINT-16.md` rédigé
- ✅ Sous-sprint `SPRINT-16-01.md` rédigé
- ✅ Sous-sprint `SPRINT-16-02.md` rédigé
- ✅ Sous-sprint `SPRINT-16-03.md` rédigé
- ✅ Rapport de livraison rédigé
- ✅ Prompt d'exécution fourni
- ✅ Chemins complets listés
- ✅ ADR rédigés (ADR-036, ADR-037, ADR-038)
- ✅ Risques identifiés et mitigations

### 8.2 Validation technique (après implémentation)

- 🔲 `npm run typecheck` passe
- 🔲 `npm run lint` passe
- 🔲 `npm test` passe
- 🔲 `npm run coverage` > 96%
- 🔲 `npm run verify` passe
- 🔲 Moteur hybride (règles + scoring) fonctionne
- 🔲 Contexte projet construit (tendances, fréquences, résolutions, BP)
- 🔲 Recommandations triées par pertinence
- 🔲 Recommandations intégrées dans les rapports Markdown
- 🔲 Recommandations intégrées dans les rapports PDF
- 🔲 Commande `ekts recommend generate` fonctionnelle
- 🔲 Commande `ekts recommend rules` (list, add, delete, toggle)
- 🔲 Outil MCP `get_recommendations` fonctionnel
- 🔲 Documentation utilisateur `RECOMMENDATIONS.md` complète
- 🔲 Rapport `SPRINT-16-RESULTAT.md` rédigé

---

## 9. Résumé pour l'agent de développement

**Objectif du Sprint 16 :** Implémenter un moteur de recommandations contextuelles combinant règles explicites et scoring statistique, intégré dans les rapports.

**Ce que vous devez faire :**

1. **Lire** les 4 documents de spécification
2. **Implémenter** dans l'ordre :
   - 16-01 : Types + Migration 007 + Rules + Repository + Engine (cœur du moteur)
   - 16-02 : Context (tendances, fréquences, résolutions, BP) + Intégration rapports Markdown/PDF
   - 16-03 : CLI `ekts recommend` (4 sous-commandes) + MCP `get_recommendations` + Tests + Docs
3. **Tester** à chaque sous-sprint avec `npm run verify`
4. **Documenter** les résultats (SPRINT-16-XX-RESULTAT.md)
5. **Livrer** un rapport final (SPRINT-16-RESULTAT.md)

**Points d'attention :**
- Le matching de pattern doit être flexible (exact, inclusion, mots-clés)
- Le scoring contextuel utilise les données du Sprint 14 (tendances) et Sprint 15 (bonnes practices)
- L'intégration rapports doit être optionnelle et non-bloquante (try/catch silencieux)
- Les règles sont gérables via CLI (ajout, suppression, activation/désactivation)
- La déduplication par titre normalisé est essentielle

**Livrables attendus :**
- Code source fonctionnel (src/recommendations/)
- Tests complets
- Intégration rapports Markdown/PDF
- Documentation utilisateur
- Rapport de sprint
- `npm run verify` passe

---

## 10. Statistiques du dossier documentaire

| Métrique | Valeur |
|----------|--------|
| Documents créés | 4 |
| Lignes totales | ~2 120 |
| Taille totale | ~75 KB |
| Fichiers code source à créer | 17 |
| Fichiers code source à modifier | 8 |
| ADR rédigés | 3 (ADR-036, ADR-037, ADR-038) |
| Risques identifiés | 4 (R16.1 à R16.4) |
| Critères d'acceptation | 20 (C16.1 à C16.20) |
| Sous-commandes CLI | 4 (generate, list, rules) + 4 rules (list, add, delete, toggle) |
| Outils MCP | 1 (get_recommendations) |
| Tables SQLite | 2 (recommendation_rules, generated_recommendations) |

---

**Document rédigé le 25 octobre 2026**  
**Sprint 16 — Dossier documentaire complet**  
**Statut : ✅ PRÊT POUR IMPLÉMENTATION**

---

*Fin du livrable documentaire Sprint 16*
