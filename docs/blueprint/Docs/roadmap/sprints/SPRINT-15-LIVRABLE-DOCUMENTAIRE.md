# LIVRABLE DOCUMENTAIRE — SPRINT 15 (Capitalisation Connaissances)

**Date :** 25 octobre 2026  
**Auteur :** Agent documentaire (Arena.ai)  
**Statut :** ✅ TERMINÉ — Dossier documentaire complet prêt pour implémentation

---

## 1. Récapitulatif des livrables

### 1.1 Documents créés

| # | Fichier | Lignes | Taille | Contenu |
|---|---------|--------|--------|---------|
| 1 | `SPRINT-15.md` | ~370 | ~13 KB | Document principal : contexte, objectifs, architecture, décomposition, ADR, risques, prompt exécution |
| 2 | `SPRINT-15-01.md` | ~530 | ~18 KB | Sous-sprint 1 : Types + Migration + BestPracticeRepository + BestPracticeSearch + tests |
| 3 | `SPRINT-15-02.md` | ~490 | ~17 KB | Sous-sprint 2 : BestPracticeExtractor + BestPracticeService + tests |
| 4 | `SPRINT-15-03.md` | ~600 | ~22 KB | Sous-sprint 3 : CLI (6 sous-commandes) + MCP (2 outils) + Tests intégration + Documentation |

**Total : 4 documents, ~1 990 lignes, ~70 KB**

### 1.2 Emplacement

Tous les fichiers sont dans :
```
docs/blueprint/Docs/roadmap/sprints/
├── SPRINT-15.md              (document principal)
├── SPRINT-15-01.md           (sous-sprint 1 : Repository + Search)
├── SPRINT-15-02.md           (sous-sprint 2 : Extractor + Service)
└── SPRINT-15-03.md           (sous-sprint 3 : CLI + MCP + Docs)
```

---

## 2. Structure du Sprint 15

### 2.1 Décomposition en sous-sprints

| Sous-sprint | Durée | Composants | Fichiers à créer |
|-------------|-------|-----------|-----------------|
| **15-01** | 3 jours | Types, Migration, BestPracticeRepository, BestPracticeSearch | 6 fichiers (types, migration, 2 modules, 2 tests) |
| **15-02** | 3 jours | BestPracticeExtractor, BestPracticeService | 4 fichiers (2 modules, 2 tests) |
| **15-03** | 3 jours | CLI, MCP, Tests intégration, Documentation | 5 fichiers code + 1 doc + 7 tests + 1 rapport final |

### 2.2 Dépendances

```
SPRINT-13 (Project Manager)
  │
  ├── SPRINT-14 (Suivi Temporel)
  │
  ▼
SPRINT-15-01 (Repository + Search)
  │
  ▼
SPRINT-15-02 (Extractor + Service)
  │
  ▼
SPRINT-15-03 (CLI + MCP + Docs)
  │
  ▼
SPRINT-16 (Recommandations Contextuelles)
```

### 2.3 Architecture cible

```
src/best-practices/
├── best-practice.types.ts        (15-01)
├── best-practice-repository.ts   (15-01)
├── best-practice-search.ts       (15-01)
├── best-practice-extractor.ts    (15-02)
└── best-practice-service.ts      (15-02)

src/storage/
├── migrations/
│   └── 006_create_best_practices.ts  (15-01)

src/cli/commands/
└── best-practice.ts              (15-03)

src/mcp/tools/
├── search-best-practices.ts      (15-03)
└── add-best-practice.ts          (15-03)

docs/user/
└── BEST_PRACTICES.md             (15-03)
```

---

## 3. Fichiers à créer par sous-sprint

### 3.1 Sprint 15-01 (Repository + Search)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/best-practices/best-practice.types.ts` | Nouveau | Types partagés (BestPractice, Filters, SearchOptions, etc.) |
| `src/storage/migrations/006_create_best_practices.ts` | Nouveau | Migration : tables best_practices, FTS5, finding_best_practice + triggers |
| `src/best-practices/best-practice-repository.ts` | Nouveau | Repository CRUD + filtres + associations |
| `src/best-practices/best-practice-search.ts` | Nouveau | Recherche hybride FTS5 + normalisation scores |
| `tests/best-practices/best-practice-repository.test.ts` | Nouveau | Tests Repository |
| `tests/best-practices/best-practice-search.test.ts` | Nouveau | Tests Search |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/storage/migrations/migration-registry.ts` | Ajout migration 006 |

### 3.2 Sprint 15-02 (Extractor + Service)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/best-practices/best-practice-extractor.ts` | Nouveau | Extracteur automatique (détection constats résolus) |
| `src/best-practices/best-practice-service.ts` | Nouveau | Orchestrateur (facade) |
| `tests/best-practices/best-practice-extractor.test.ts` | Nouveau | Tests Extractor |
| `tests/best-practices/best-practice-service.test.ts` | Nouveau | Tests Service |

### 3.3 Sprint 15-03 (CLI + MCP + Docs)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/cli/commands/best-practice.ts` | Nouveau | Commande `ekts bestpractice` (6 sous-commandes) |
| `src/mcp/tools/search-best-practices.ts` | Nouveau | Outil MCP search_best_practices |
| `src/mcp/tools/add-best-practice.ts` | Nouveau | Outil MCP add_best_practice |
| `tests/cli/best-practice.test.ts` | Nouveau | Tests CLI |
| `tests/mcp/tools/search-best-practices.test.ts` | Nouveau | Tests MCP search |
| `tests/mcp/tools/add-best-practice.test.ts` | Nouveau | Tests MCP add |
| `tests/integration/best-practices-integration.test.ts` | Nouveau | Tests d'intégration (flux complet) |
| `docs/user/BEST_PRACTICES.md` | Nouveau | Guide utilisateur |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/cli/index.ts` | Enregistrement commande bestpractice |
| `src/mcp/tools/index.ts` | Enregistrement 2 nouveaux outils MCP |
| `docs/reference/CLI_REFERENCE.md` | Section `ekts bestpractice` |
| `docs/reference/MCP_REFERENCE.md` | Sections `search_best_practices`, `add_best_practice` |

**Rapport final :**
| Fichier | Type | Description |
|---------|------|-------------|
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-15-RESULTAT.md` | Nouveau | Rapport de clôture |

---

## 4. Plan de présentation à l'agent de développement

### 4.1 Ordre de lecture

L'agent de développement doit lire les documents dans cet ordre :

1. **`SPRINT-15.md`** — Vue d'ensemble du sprint
   - §1-2 : Contexte, objectifs, architecture, critères
   - §3 : Décomposition en sous-sprints
   - §4 : Livrables
   - §5 : ADR (ADR-033, ADR-034, ADR-035)
   - §6 : Risques et mitigations
   - §7 : Prompt d'exécution

2. **`SPRINT-15-01.md`** — Implémentation Repository + Search
   - §1 : Objectif
   - §2 : Prérequis
   - §3 : Tâches détaillées (code complet)
   - §4-6 : Vérifications, rapport, critères

3. **`SPRINT-15-01-RESULTAT.md`** — Résultats du sous-sprint 1

4. **`SPRINT-15-02.md`** — Implémentation Extractor + Service

5. **`SPRINT-15-02-RESULTAT.md`** — Résultats du sous-sprint 2

6. **`SPRINT-15-03.md`** — CLI + MCP + Tests + Documentation

7. **`SPRINT-15-RESULTAT.md`** — Rapport final

### 4.2 Prompt d'exécution (extrait de SPRINT-15.md §7)

```markdown
**CONTEXTE :**
- Projet : EKTS (Audit Web)
- Sprint : 15 — Capitalisation Connaissances
- Branche : `develop`
- Prérequis : Sprint 13 (multi-projets) + Sprint 14 (suivi temporel) terminés

**INSTRUCTIONS :**
1. Lire `SPRINT-15.md` pour comprendre les objectifs
2. Lire `SPRINT-15-01.md` pour le sous-sprint 1
3. Implémenter les tâches du sous-sprint 15-01 dans l'ordre
4. Rédiger `SPRINT-15-01-RESULTAT.md` avec les fichiers créés/modifiés
5. Exécuter `npm run verify` et corriger les erreurs
6. Lire `SPRINT-15-02.md` pour le sous-sprint 2
7. Implémenter les tâches du sous-sprint 15-02 dans l'ordre
8. Rédiger `SPRINT-15-02-RESULTAT.md`
9. Exécuter `npm run verify` et corriger les erreurs
10. Lire `SPRINT-15-03.md` pour le sous-sprint 3
11. Implémenter les tâches du sous-sprint 15-03 dans l'ordre
12. Rédiger `SPRINT-15-RESULTAT.md` (rapport final)
13. Exécuter `npm run verify` et corriger les erreurs

**CONTRAINTES :**
- Respecter les conventions du projet (ESLint, Prettier, TypeScript strict)
- Tests unitaires pour chaque module
- Couverture > 80% pour les nouveaux modules
- Documentation utilisateur (BEST_PRACTICES.md)
- Pas de breaking changes sur l'API existante
- Fournir les emplacements exacts des fichiers créés/modifiés/supprimés

**LIVRABLES ATTENDUS :**
- Code source fonctionnel (src/best-practices/, src/cli/, src/mcp/)
- Tests unitaires et d'intégration
- Documentation utilisateur et référence
- Rapport de sprint (SPRINT-15-RESULTAT.md)
- `npm run verify` passe sans erreur
```

---

## 5. Récapitulatif des ADR

### ADR-033 : Réutilisation du pattern FTS5 + RRF

**Décision :** Reproduire le pattern de recherche hybride du Sprint 4 (FTS5 + vecteurs + RRF k=60) pour la recherche de bonnes pratiques.

**Justification :**
- Pattern éprouvé (Sprint 4 : Recall@5 = 1.000, benchmark 100k documents)
- Pas de nouvelle dépendance
- Cohérence avec la recherche d'audits existante
- Les agents IA connaissent déjà ce pattern via MCP

### ADR-034 : Extraction basée sur les constats résolus

**Décision :** Extraire les bonnes pratiques depuis les constats (findings) qui ont été résolus avec succès (disparition entre 2 audits consécutifs + amélioration du score).

**Justification :**
- Preuve empirique que la recommandation fonctionne
- Pas de ML requis (règles explicites)
- Traçabilité : chaque bonne pratique est liée aux audits source

### ADR-035 : Table d'association finding ↔ bonne pratique

**Décision :** Utiliser une table de jointure `finding_best_practice` avec clé composite `(finding_title, dimension, best_practice_id)` plutôt qu'un simple champ JSON.

**Justification :**
- Requêtes SQL efficaces (index sur finding_title + dimension)
- Bidirectionnel : retrouver les BP par finding ET les findings par BP
- Normalisation relationnelle correcte

---

## 6. Récapitulatif des risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Faux positifs dans l'extraction (finding disparu ≠ résolu) | Moyenne | Moyen | Exiger ≥ 2 audits consécutifs + amélioration du score |
| Prolifération de bonnes pratiques dupliquées | Moyenne | Faible | Déduplication par titre normalisé + fusion |
| Associations finding ↔ BP inexactes | Faible | Moyen | Score de confiance, ajustement manuel via CLI |
| Performance extraction sur gros volumes | Faible | Moyen | Traitement batch par projet, index sur project_id |

---

## 7. Chemins complets des fichiers

### 7.1 Documents de spécification (à lire)

```
docs/blueprint/Docs/roadmap/sprints/SPRINT-15.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-15-01.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-15-02.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-15-03.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-15-LIVRABLE-DOCUMENTAIRE.md  (ce document)
```

### 7.2 Documents de référence (à consulter)

```
docs/ROADMAP.md                                                          (MVP-3 : Capitalisation)
docs/blueprint/Docs/04-Knowledge/06_ARCHITECTURE_STOCKAGE.md             (schémas SQLite)
docs/blueprint/Docs/06-Security/06_MCP_SECURITY_GUARDRAILS.md            (sécurité MCP)
docs/blueprint/Docs/05-Creative-Engineering/13_CLI_GUIDE.md              (conventions CLI)
src/storage/search.ts                                                    (pattern recherche hybride)
src/business/rrf.ts                                                      (RRF_K, reciprocalRank)
```

### 7.3 Fichiers à créer (code source)

**Sprint 15-01 :**
```
src/best-practices/best-practice.types.ts
src/best-practices/best-practice-repository.ts
src/best-practices/best-practice-search.ts
src/storage/migrations/006_create_best_practices.ts
tests/best-practices/best-practice-repository.test.ts
tests/best-practices/best-practice-search.test.ts
```

**Sprint 15-02 :**
```
src/best-practices/best-practice-extractor.ts
src/best-practices/best-practice-service.ts
tests/best-practices/best-practice-extractor.test.ts
tests/best-practices/best-practice-service.test.ts
```

**Sprint 15-03 :**
```
src/cli/commands/best-practice.ts
src/mcp/tools/search-best-practices.ts
src/mcp/tools/add-best-practice.ts
tests/cli/best-practice.test.ts
tests/mcp/tools/search-best-practices.test.ts
tests/mcp/tools/add-best-practice.test.ts
tests/integration/best-practices-integration.test.ts
docs/user/BEST_PRACTICES.md
```

### 7.4 Fichiers à modifier (code source)

```
src/storage/migrations/migration-registry.ts    (15-01 : ajout migration 006)
src/cli/index.ts                                (15-03 : enregistrement commande)
src/mcp/tools/index.ts                          (15-03 : enregistrement 2 outils)
docs/reference/CLI_REFERENCE.md                 (15-03 : section bestpractice)
docs/reference/MCP_REFERENCE.md                 (15-03 : sections search/add_best_practice)
```

### 7.5 Fichiers à créer (rapports)

```
SPRINT-15-01-RESULTAT.md                        (après sous-sprint 1)
SPRINT-15-02-RESULTAT.md                        (après sous-sprint 2)
SPRINT-15-RESULTAT.md                           (rapport final)
```

---

## 8. Checklist de validation

### 8.1 Validation documentaire (ce livrable)

- ✅ Document principal `SPRINT-15.md` rédigé
- ✅ Sous-sprint `SPRINT-15-01.md` rédigé
- ✅ Sous-sprint `SPRINT-15-02.md` rédigé
- ✅ Sous-sprint `SPRINT-15-03.md` rédigé
- ✅ Rapport de livraison rédigé (ce document)
- ✅ Prompt d'exécution fourni (dans SPRINT-15.md §7)
- ✅ Chemins complets des fichiers listés
- ✅ ADR rédigés (ADR-033, ADR-034, ADR-035)
- ✅ Risques identifiés et mitigations proposées

### 8.2 Validation technique (après implémentation)

- 🔲 `npm run typecheck` passe
- 🔲 `npm run lint` passe
- 🔲 `npm test` passe (tous les tests)
- 🔲 `npm run coverage` > 96%
- 🔲 `npm run verify` passe
- 🔲 Commande `ekts bestpractice list` fonctionnelle
- 🔲 Commande `ekts bestpractice search` fonctionnelle
- 🔲 Commande `ekts bestpractice add` fonctionnelle
- 🔲 Commande `ekts bestpractice show` fonctionnelle
- 🔲 Commande `ekts bestpractice delete` fonctionnelle
- 🔲 Commande `ekts bestpractice extract` fonctionnelle
- 🔲 Outil MCP `search_best_practices` fonctionnel
- 🔲 Outil MCP `add_best_practice` fonctionnel
- 🔲 Extraction automatique détecte les constats résolus
- 🔲 Recherche hybride FTS5 fonctionne
- 🔲 Associations findings ↔ bonnes pratiques fonctionnelles
- 🔲 Documentation utilisateur `BEST_PRACTICES.md` complète
- 🔲 Rapport `SPRINT-15-RESULTAT.md` rédigé

---

## 9. Résumé pour l'agent de développement

**Objectif du Sprint 15 :** Capitaliser les connaissances extraites des audits en bonnes pratiques réutilisables.

**Ce que vous devez faire :**

1. **Lire** les 4 documents de spécification (SPRINT-15.md, SPRINT-15-01.md, SPRINT-15-02.md, SPRINT-15-03.md)

2. **Implémenter** dans l'ordre :
   - Sous-sprint 15-01 : Types + Migration + Repository + Search (3 tables SQLite dont FTS5 + triggers)
   - Sous-sprint 15-02 : Extractor (détection constats résolus) + Service (facade)
   - Sous-sprint 15-03 : CLI (6 sous-commandes) + MCP (2 outils) + Tests + Documentation

3. **Tester** à chaque sous-sprint avec `npm run verify`

4. **Documenter** les résultats (SPRINT-15-XX-RESULTAT.md après chaque sous-sprint)

5. **Livrer** un rapport final (SPRINT-15-RESULTAT.md)

**Contraintes :**
- Respecter les conventions du projet
- Tests unitaires pour chaque module
- Couverture > 80% pour les nouveaux modules
- Pas de breaking changes

**Points d'attention :**
- La migration 006 crée 3 tables + 3 triggers FTS5 — bien vérifier les triggers
- L'extracteur nécessite au minimum 2 audits avec des findings pour détecter des résolutions
- La table `finding_best_practice` utilise une clé composite (titre normalisé + dimension + BP ID)
- La recherche FTS5 réutilise le pattern du Sprint 4 (BM25 + normalisation scores)

**Livrables attendus :**
- Code source fonctionnel
- Tests complets
- Documentation utilisateur
- Rapport de sprint
- `npm run verify` passe

---

## 10. Statistiques du dossier documentaire

| Métrique | Valeur |
|----------|--------|
| Documents créés | 4 |
| Lignes totales | ~1 990 |
| Taille totale | ~70 KB |
| Fichiers code source à créer | 18 |
| Fichiers code source à modifier | 5 |
| ADR rédigés | 3 (ADR-033, ADR-034, ADR-035) |
| Risques identifiés | 4 (R15.1 à R15.4) |
| Critères d'acceptation | 20 (C15.1 à C15.20) |
| Sous-commandes CLI | 6 (list, search, add, show, delete, extract) |
| Outils MCP | 2 (search_best_practices, add_best_practice) |

---

**Document rédigé le 25 octobre 2026**  
**Sprint 15 — Dossier documentaire complet**  
**Statut : ✅ PRÊT POUR IMPLÉMENTATION**

---

*Fin du livrable documentaire Sprint 15*
