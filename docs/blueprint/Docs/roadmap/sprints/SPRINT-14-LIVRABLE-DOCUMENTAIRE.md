# LIVRABLE DOCUMENTAIRE — SPRINT 14 (Suivi Temporel)

**Date :** 25 octobre 2026  
**Auteur :** Agent documentaire (Arena.ai)  
**Statut :** ✅ TERMINÉ — Dossier documentaire complet prêt pour implémentation

---

## 1. Récapitulatif des livrables

### 1.1 Documents créés

| # | Fichier | Lignes | Taille | Contenu |
|---|---------|--------|--------|---------|
| 1 | `SPRINT-14.md` | ~350 | ~12 KB | Document principal : contexte, objectifs, décomposition, dépendances, ADR, risques, prompt exécution |
| 2 | `SPRINT-14-01.md` | ~400 | ~14 KB | Sous-sprint 1 : Types + TimelineAnalyzer + TrendDetector + tests |
| 3 | `SPRINT-14-02.md` | ~420 | ~15 KB | Sous-sprint 2 : Migration alerts + AlertRepository + AlertManager + ChartGenerator + tests |
| 4 | `SPRINT-14-03.md` | ~430 | ~15 KB | Sous-sprint 3 : CLI (4 sous-commandes) + MCP (get_timeline) + Tests intégration + Documentation |

**Total : 4 documents, ~1 600 lignes, ~56 KB**

### 1.2 Emplacement

Tous les fichiers sont dans :
```
docs/blueprint/Docs/roadmap/sprints/
├── SPRINT-14.md              (document principal)
├── SPRINT-14-01.md           (sous-sprint 1 : Timeline + Trends)
├── SPRINT-14-02.md           (sous-sprint 2 : Alerts + Charts)
└── SPRINT-14-03.md           (sous-sprint 3 : CLI + MCP + Tests + Docs)
```

---

## 2. Structure du Sprint 14

### 2.1 Décomposition en sous-sprints

| Sous-sprint | Durée | Composants | Fichiers à créer |
|-------------|-------|-----------|-----------------|
| **14-01** | 3 jours | Types, TimelineAnalyzer, TrendDetector | `timeline.types.ts`, `timeline-analyzer.ts`, `trend-detector.ts`, tests |
| **14-02** | 3 jours | Migration, AlertRepository, AlertManager, ChartGenerator | `005_create_alerts_table.ts`, `alert-repository.ts`, `alert-manager.ts`, `chart-generator.ts`, tests |
| **14-03** | 3 jours | CLI, MCP, Tests intégration, Documentation | `timeline.ts` (CLI), `get-timeline.ts` (MCP), `TIMELINE.md`, docs références |

### 2.2 Dépendances

```
SPRINT-13 (Project Manager)
  │
  ▼
SPRINT-14-01 (Timeline + Trends)
  │
  ▼
SPRINT-14-02 (Alerts + Charts)
  │
  ▼
SPRINT-14-03 (CLI + MCP + Docs)
  │
  ▼
SPRINT-15 (Capitalisation)
```

### 2.3 Architecture cible

```
src/timeline/
├── timeline.types.ts        (14-01)
├── timeline-analyzer.ts     (14-01)
├── trend-detector.ts        (14-01)
├── alert-manager.ts         (14-02)
└── chart-generator.ts       (14-02)

src/storage/
├── migrations/
│   └── 005_create_alerts_table.ts  (14-02)
└── alert-repository.ts             (14-02)

src/cli/commands/
└── timeline.ts              (14-03)

src/mcp/tools/
└── get-timeline.ts          (14-03)

docs/user/
└── TIMELINE.md              (14-03)
```

---

## 3. Fichiers à créer par sous-sprint

### 3.1 Sprint 14-01 (Timeline + Trends)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/timeline/timeline.types.ts` | Nouveau | Types partagés (Dimension, ScorePoint, TrendDirection, etc.) |
| `src/timeline/timeline-analyzer.ts` | Nouveau | Classe TimelineAnalyzer (analyse par projet) |
| `src/timeline/trend-detector.ts` | Nouveau | Classe TrendDetector (régression linéaire) |
| `tests/timeline/timeline-analyzer.test.ts` | Nouveau | Tests unitaires TimelineAnalyzer |
| `tests/timeline/trend-detector.test.ts` | Nouveau | Tests unitaires TrendDetector |

### 3.2 Sprint 14-02 (Alerts + Charts)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/storage/migrations/005_create_alerts_table.ts` | Nouveau | Migration table alerts |
| `src/storage/alert-repository.ts` | Nouveau | Repository alertes (CRUD) |
| `src/timeline/alert-manager.ts` | Nouveau | Gestion des alertes (détection, résolution) |
| `src/timeline/chart-generator.ts` | Nouveau | Génération graphiques SVG |
| `tests/timeline/alert-manager.test.ts` | Nouveau | Tests unitaires AlertManager |
| `tests/timeline/chart-generator.test.ts` | Nouveau | Tests unitaires ChartGenerator |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/storage/migrations/migration-registry.ts` | Ajout migration 005 |
| `src/storage/types.ts` | Ajout types Alert, CreateAlertInput, AlertFilters |

### 3.3 Sprint 14-03 (CLI + MCP + Docs)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/cli/commands/timeline.ts` | Nouveau | Commande `ekts timeline` (4 sous-commandes) |
| `src/mcp/tools/get-timeline.ts` | Nouveau | Outil MCP `get_timeline` |
| `tests/integration/timeline-integration.test.ts` | Nouveau | Tests d'intégration |
| `docs/user/TIMELINE.md` | Nouveau | Guide utilisateur |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/cli/index.ts` | Enregistrement commande timeline |
| `src/mcp/tools/index.ts` | Enregistrement outil get_timeline |
| `docs/reference/CLI_REFERENCE.md` | Section `ekts timeline` |
| `docs/reference/MCP_REFERENCE.md` | Section `get_timeline` |

**Rapport final :**
| Fichier | Type | Description |
|---------|------|-------------|
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-RESULTAT.md` | Nouveau | Rapport de clôture |

---

## 4. Plan de présentation à l'agent de développement

### 4.1 Ordre de lecture

L'agent de développement doit lire les documents dans cet ordre :

1. **`SPRINT-14.md`** — Vue d'ensemble du sprint
   - §1-3 : Contexte, objectifs, décomposition
   - §4 : Dépendances et prérequis
   - §5 : ADR (si applicable)
   - §6 : Risques et mitigations
   - §7 : Prompt d'exécution

2. **`SPRINT-14-01.md`** — Implémentation des modules core
   - §1 : Objectif du sous-sprint
   - §2 : Prérequis
   - §3 : Tâches détaillées (avec code)
   - §4 : Vérifications finales
   - §5 : Rapport de sous-sprint
   - §6 : Critères de validation

3. **`SPRINT-14-01-RESULTAT.md`** — Résultats du sous-sprint 1
   - Fichiers créés
   - Tests exécutés
   - Décisions prises

4. **`SPRINT-14-02.md`** — Implémentation des alertes et graphiques
   - Même structure que 14-01

5. **`SPRINT-14-02-RESULTAT.md`** — Résultats du sous-sprint 2

6. **`SPRINT-14-03.md`** — CLI, MCP, tests et documentation
   - Même structure que 14-01

7. **`SPRINT-14-RESULTAT.md`** — Rapport final du sprint

### 4.2 Prompt d'exécution (extrait de SPRINT-14.md §7)

```markdown
## 7. Prompt d'exécution pour l'agent de développement

**CONTEXTE :**
- Projet : EKTS (Audit Web)
- Sprint : 14 — Suivi Temporel
- Branche : `develop`
- Prérequis : Sprint 13 terminé (Project Manager)

**INSTRUCTIONS :**
1. Lire `SPRINT-14.md` pour comprendre les objectifs
2. Lire `SPRINT-14-01.md` pour le sous-sprint 1
3. Implémenter les tâches du sous-sprint 14-01 dans l'ordre
4. Rédiger `SPRINT-14-01-RESULTAT.md` avec les fichiers créés/modifiés
5. Exécuter `npm run verify` et corriger les erreurs
6. Lire `SPRINT-14-02.md` pour le sous-sprint 2
7. Implémenter les tâches du sous-sprint 14-02 dans l'ordre
8. Rédiger `SPRINT-14-02-RESULTAT.md`
9. Exécuter `npm run verify` et corriger les erreurs
10. Lire `SPRINT-14-03.md` pour le sous-sprint 3
11. Implémenter les tâches du sous-sprint 14-03 dans l'ordre
12. Rédiger `SPRINT-14-RESULTAT.md` (rapport final)
13. Exécuter `npm run verify` et corriger les erreurs

**CONTRAINTES :**
- Respecter les conventions du projet (ESLint, Prettier)
- Tests unitaires pour chaque module
- Couverture > 80% pour les nouveaux modules
- Documentation utilisateur (TIMELINE.md)
- Pas de breaking changes sur l'API existante

**LIVRABLES ATTENDUS :**
- Code source fonctionnel (src/timeline/, src/cli/, src/mcp/)
- Tests unitaires et d'intégration
- Documentation utilisateur et référence
- Rapport de sprint (SPRINT-14-RESULTAT.md)
- `npm run verify` passe sans erreur
```

---

## 5. Récapitulatif des ADR

### ADR-031 : Régression linéaire pour la détection de tendances

**Décision :** Utiliser une régression linéaire simple pour détecter les tendances d'évolution des scores.

**Justification :**
- Algorithme simple et efficace
- Pente = vitesse d'évolution (positive = amélioration, négative = régression)
- Coefficient de détermination (R²) = confiance dans la tendance
- Implémentation facile en TypeScript pur (pas de dépendance externe)

**Conséquences :**
- Implémenter `linearRegression()` dans `TrendDetector`
- Seuils configurables : amélioration > 0.1, régression < -0.1
- R² minimum pour considérer la tendance comme significative

### ADR-032 : Graphiques SVG (pas de PNG natif)

**Décision :** Générer des graphiques au format SVG uniquement dans un premier temps.

**Justification :**
- SVG natif en TypeScript (pas de dépendance lourde comme canvas/sharp)
- Vectoriel = zoom sans perte de qualité
- Compatible navigateurs et éditeurs
- Conversion PNG possible plus tard via outils externes

**Conséquences :**
- `ChartGenerator` produit uniquement du SVG
- Option PNG laissée en placeholder (erreur "requires additional dependencies")
- Documentation utilisateur explique comment convertir SVG → PNG si nécessaire

---

## 6. Récapitulatif des risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Performance sur gros volumes (> 1000 audits) | Moyenne | Moyen | Pagination, index SQLite, optimisation queries |
| Précision des tendances sur peu d'audits | Élevée | Faible | Exiger min. 2 audits, avertissement si < 5 |
| Complexité des graphiques SVG | Faible | Faible | SVG simple (lignes + points), pas de bibliothèques externes |
| Compatibilité MCP avec outils existants | Faible | Moyen | Tests d'intégration, respect des guardrails MCP |

---

## 7. Chemins complets des fichiers

### 7.1 Documents de spécification (à lire)

```
docs/blueprint/Docs/roadmap/sprints/SPRINT-14.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-14-01.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-14-02.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-14-03.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-14-LIVRABLE-DOCUMENTAIRE.md  (ce document)
```

### 7.2 Documents de référence (à consulter)

```
docs/ROADMAP.md                                                          (MVP-3 : Suivi temporel)
docs/blueprint/Docs/04-Knowledge/06_ARCHITECTURE_STOCKAGE.md             (schémas SQLite)
docs/blueprint/Docs/06-Security/06_MCP_SECURITY_GUARDRAILS.md            (sécurité MCP)
docs/blueprint/Docs/05-Creative-Engineering/13_CLI_GUIDE.md              (conventions CLI)
```

### 7.3 Fichiers à créer (code source)

**Sprint 14-01 :**
```
src/timeline/timeline.types.ts
src/timeline/timeline-analyzer.ts
src/timeline/trend-detector.ts
tests/timeline/timeline-analyzer.test.ts
tests/timeline/trend-detector.test.ts
```

**Sprint 14-02 :**
```
src/storage/migrations/005_create_alerts_table.ts
src/storage/alert-repository.ts
src/timeline/alert-manager.ts
src/timeline/chart-generator.ts
tests/timeline/alert-manager.test.ts
tests/timeline/chart-generator.test.ts
```

**Sprint 14-03 :**
```
src/cli/commands/timeline.ts
src/mcp/tools/get-timeline.ts
tests/integration/timeline-integration.test.ts
docs/user/TIMELINE.md
```

### 7.4 Fichiers à modifier (code source)

```
src/storage/migrations/migration-registry.ts    (14-02 : ajout migration 005)
src/storage/types.ts                             (14-02 : ajout types Alert)
src/cli/index.ts                                 (14-03 : enregistrement commande)
src/mcp/tools/index.ts                           (14-03 : enregistrement outil)
docs/reference/CLI_REFERENCE.md                  (14-03 : section timeline)
docs/reference/MCP_REFERENCE.md                  (14-03 : section get_timeline)
```

### 7.5 Fichiers à créer (rapports)

```
SPRINT-14-01-RESULTAT.md                         (après sous-sprint 1)
SPRINT-14-02-RESULTAT.md                         (après sous-sprint 2)
SPRINT-14-RESULTAT.md                            (rapport final)
```

---

## 8. Checklist de validation

### 8.1 Validation documentaire (ce livrable)

- ✅ Document principal `SPRINT-14.md` rédigé
- ✅ Sous-sprint `SPRINT-14-01.md` rédigé
- ✅ Sous-sprint `SPRINT-14-02.md` rédigé
- ✅ Sous-sprint `SPRINT-14-03.md` rédigé
- ✅ Rapport de livraison rédigé (ce document)
- ✅ Prompt d'exécution fourni (dans SPRINT-14.md §7)
- ✅ Chemins complets des fichiers listés
- ✅ ADR rédigés (ADR-031, ADR-032)
- ✅ Risques identifiés et mitigations proposées

### 8.2 Validation technique (après implémentation)

- 🔲 `npm run typecheck` passe
- 🔲 `npm run lint` passe
- 🔲 `npm test` passe (tous les tests)
- 🔲 `npm run coverage` > 96%
- 🔲 `npm run verify` passe
- 🔲 Commande `ekts timeline analyze` fonctionnelle
- 🔲 Commande `ekts timeline trends` fonctionnelle
- 🔲 Commande `ekts timeline alerts` fonctionnelle
- 🔲 Commande `ekts timeline chart` fonctionnelle
- 🔲 Outil MCP `get_timeline` fonctionnel
- 🔲 Documentation utilisateur `TIMELINE.md` complète
- 🔲 Rapport `SPRINT-14-RESULTAT.md` rédigé

---

## 9. Résumé pour l'agent de développement

**Objectif du Sprint 14 :** Ajouter le suivi temporel des audits EKTS.

**Ce que vous devez faire :**

1. **Lire** les 4 documents de spécification (SPRINT-14.md, SPRINT-14-01.md, SPRINT-14-02.md, SPRINT-14-03.md)

2. **Implémenter** dans l'ordre :
   - Sous-sprint 14-01 : Types + TimelineAnalyzer + TrendDetector
   - Sous-sprint 14-02 : Migration alerts + AlertManager + ChartGenerator
   - Sous-sprint 14-03 : CLI + MCP + Tests + Documentation

3. **Tester** à chaque sous-sprint avec `npm run verify`

4. **Documenter** les résultats (SPRINT-14-XX-RESULTAT.md après chaque sous-sprint)

5. **Livrer** un rapport final (SPRINT-14-RESULTAT.md)

**Contraintes :**
- Respecter les conventions du projet
- Tests unitaires pour chaque module
- Couverture > 80% pour les nouveaux modules
- Pas de breaking changes

**Livrables attendus :**
- Code source fonctionnel
- Tests complets
- Documentation utilisateur
- Rapport de sprint
- `npm run verify` passe

---

## 10. Contact et support

En cas de question ou de blocage :
1. Relire les documents de spécification
2. Consulter les documents de référence (architecture, sécurité, CLI)
3. Vérifier les ADR (ADR-031, ADR-032)
4. Consulter les risques et mitigations (§6)

---

**Document rédigé le 25 octobre 2026**  
**Sprint 14 — Dossier documentaire complet**  
**Statut : ✅ PRÊT POUR IMPLÉMENTATION**

---

*Fin du livrable documentaire Sprint 14*
