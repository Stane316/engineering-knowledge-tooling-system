# Critères d'Acceptation et Tests — Phase 13

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Objectif :** Définir les critères d'acceptation et stratégies de test pour chaque MVP

---

## 1. Introduction

### 1.1 Contexte

**Architecture cible :** Architecture C (Hybride) — Monolithe modulaire SQLite + services optionnels  
**MVPs définis :** MVP-1, MVP-2, MVP-3  
**Roadmap :** 18 sprints (9 mois)

### 1.2 Objectif des critères d'acceptation

**Garantir :**
- ✅ Fonctionnalités conformes aux spécifications
- ✅ Performance mesurable et reproductible
- ✅ Sécurité validée (Phase 11)
- ✅ Maintenabilité (tests > 80% couverture)
- ✅ Portabilité (multi-plateforme)
- ✅ Évolutivité (benchmarks réguliers)

### 1.3 Méthodologie de test

**Pyramide de tests :**
```
        /  E2E  \          ← Tests manuels (compatibilité MCP)
       /----------\
      / Integration \      ← Tests CLI, MCP, workflows
     /----------------\
    /   Unit Tests     \   ← Tests unitaires (> 80% couverture)
   /----------------------\
```

**Outils :**
- **Tests unitaires** : Vitest
- **Tests d'intégration** : Vitest + supertest
- **Tests E2E** : Manuels (Claude Code, Cursor, Copilot)
- **Benchmarks** : Scripts custom (Recall@5, Faithfulness, latence)
- **Couverture** : c8 (Istanbul)
- **Lint** : ESLint + Prettier

---

## 2. MVP-1 — Critères d'Acceptation

### 2.1 Critères fonctionnels

#### CF1.1 — CLI fonctionne

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF1.1.1 | `ekts init` crée les 3 bases SQLite | `npm test -- init` | Fichiers ekts.db, ekts-fts.db, ekts-vectors.db créés |
| CF1.1.2 | `ekts add` ajoute une ressource | `npm test -- add` | Ressource créée, retourne resourceId |
| CF1.1.3 | `ekts search <query>` retourne résultats | `npm test -- search` | Résultats hybrides (FTS + Vector) affichés |
| CF1.1.4 | `ekts get <id>` retourne ressource | `npm test -- get` | Ressource affichée (JSON) |
| CF1.1.5 | `ekts list [filters]` liste ressources | `npm test -- list` | Liste filtrée affichée |
| CF1.1.6 | `ekts delete <id>` supprime ressource | `npm test -- delete` | Ressource supprimée, retourne success |
| CF1.1.7 | `ekts status` affiche statut | `npm test -- status` | Nb ressources, taille DB affichées |

**Tests associés :** `tests/cli/cli.test.ts`

#### CF1.2 — Recherche hybride performante

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF1.2.1 | Recall@5 ≥ 0.75 | `npm run benchmark -- recall` | Recall@5 = 0.75+ sur jeu test |
| CF1.2.2 | Faithfulness ≥ 0.80 | `npm run benchmark -- faithfulness` | Faithfulness = 0.80+ sur jeu test |
| CF1.2.3 | Latence < 500ms (100K docs) | `npm run benchmark -- latency` | Latence moyenne < 500ms |
| CF1.2.4 | FTS5 fonctionne | `npm test -- fts` | Résultats BM25 retournés |
| CF1.2.5 | sqlite-vec fonctionne | `npm test -- vector` | Résultats cosine retournés |
| CF1.2.6 | RRF fusion fonctionne | `npm test -- rrf` | Fusion FTS + Vector correcte |

**Tests associés :** `tests/benchmark/search-benchmark.ts`, `tests/business/search-engine.test.ts`

#### CF1.3 — MCP Server opérationnel

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF1.3.1 | 4 outils MCP exposés | `npm test -- mcp-tools` | search_knowledge, get_resource, list_resources, validate_resource |
| CF1.3.2 | Transport stdio fonctionne | Manuel | Serveur démarre, accepte input/output JSON |
| CF1.3.3 | Compatible Claude Code | Manuel | Claude Code se connecte, appelle tools |
| CF1.3.4 | Compatible Cursor | Manuel | Cursor se connecte, appelle tools |
| CF1.3.5 | Compatible GitHub Copilot | Manuel | Copilot se connecte, appelle tools |
| CF1.3.6 | Spec MCP 2026-07-28 respectée | `npm test -- mcp-spec` | Stateless, pas de session tracking |

**Tests associés :** `tests/mcp/mcp.test.ts`

#### CF1.4 — Données persistées

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF1.4.1 | SQLite WAL activé | `npm test -- wal` | PRAGMA journal_mode = WAL |
| CF1.4.2 | 3 bases séparées | `npm test -- databases` | ekts.db, ekts-fts.db, ekts-vectors.db existent |
| CF1.4.3 | Backup trivial | Manuel | `cp *.db backup/` fonctionne |
| CF1.4.4 | Intégrité (transactions) | `npm test -- transactions` | Rollback fonctionne en cas d'erreur |
| CF1.4.5 | Foreign keys respectées | `npm test -- foreign-keys` | PRAGMA foreign_keys = ON |

**Tests associés :** `tests/data/databases.test.ts`

### 2.2 Critères non-fonctionnels

#### CNF1.1 — Performance

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF1.1.1 | CLI répond < 200ms | `npm run benchmark -- cli` | Latence moyenne < 200ms |
| CNF1.1.2 | Recherche < 500ms (100K docs) | `npm run benchmark -- search-latency` | Latence < 500ms |
| CNF1.1.3 | Indexation < 1s (par ressource) | `npm run benchmark -- indexing` | Temps < 1s |

#### CNF1.2 — Sécurité

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF1.2.1 | Fichiers SQLite chmod 600 | `npm test -- permissions` | Permissions 600 sur *.db |
| CNF1.2.2 | Pas d'exposition réseau | `npm test -- network` | Pas de ports ouverts |
| CNF1.2.3 | Secrets dans .env | `npm test -- secrets` | .env dans .gitignore |
| CNF1.2.4 | Gitleaks pre-commit | Manuel | Hook détecte secrets |

#### CNF1.3 — Maintenabilité

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF1.3.1 | Tests > 80% couverture | `npm run coverage` | Couverture > 80% |
| CNF1.3.2 | Documentation API (JSDoc) | `npm run docs` | Documentation générée |
| CNF1.3.3 | Logs structurés (Pino) | `npm test -- logging` | Logs JSON valides |
| CNF1.3.4 | TypeScript strict mode | `npm run lint` | Pas d'erreurs |

#### CNF1.4 — Portabilité

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF1.4.1 | Fonctionne Linux | CI GitHub Actions | Tests passent sur Ubuntu |
| CNF1.4.2 | Fonctionne macOS | Manuel | Tests passent sur macOS |
| CNF1.4.3 | Fonctionne Windows | CI GitHub Actions | Tests passent sur Windows |
| CNF1.4.4 | Node.js 20+ (LTS) | `npm test -- node-version` | Compatible Node 20, 22 |
| CNF1.4.5 | Pas de dépendances système | Manuel | SQLite embedded, pas d'install requise |

---

## 3. MVP-2 — Critères d'Acceptation

### 3.1 Critères fonctionnels

#### CF2.1 — Inspection fonctionne

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF2.1.1 | `ekts inspect <url> --level L1` | `npm test -- inspect-l1` | Inspection L1 complète |
| CF2.1.2 | `ekts inspect <url> --level L2` | `npm test -- inspect-l2` | Inspection L2 complète |
| CF2.1.3 | `ekts inspect <url> --level L3` | `npm test -- inspect-l3` | Inspection L3 complète |
| CF2.1.4 | 5 dimensions analysées | `npm test -- dimensions` | Performance, accessibilité, SEO, UX, contenu |
| CF2.1.5 | Matrice sévérité calculée | `npm test -- severity` | Sévérité × Fréquence × Impact |

**Tests associés :** `tests/browser/inspector.test.ts`, `tests/analysis/analysis.test.ts`

#### CF2.2 — MCP tool expose

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF2.2.1 | `inspect_site` (MCP tool) | `npm test -- mcp-inspect` | Tool fonctionne |
| CF2.2.2 | Retourne auditId + findings | `npm test -- mcp-inspect-result` | auditId + findings[] retournés |
| CF2.2.3 | Compatible Tier 1 agents | Manuel | Claude Code, Cursor, Copilot |

**Tests associés :** `tests/mcp/inspect.test.ts`

#### CF2.3 — Stockage + indexation

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF2.3.1 | Audits stockés (ekts.db) | `npm test -- audit-storage` | Audits dans ekts.db |
| CF2.3.2 | Findings indexés (FTS + Vector) | `npm test -- audit-indexing` | Findings dans FTS + Vector |
| CF2.3.3 | Recherche inclut audits | `npm test -- audit-search` | `search_knowledge` retourne audits |

**Tests associés :** `tests/business/audit-manager.test.ts`

### 3.2 Critères non-fonctionnels

#### CNF2.1 — Performance

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF2.1.1 | L1 < 10s | `npm run benchmark -- inspect-l1` | Temps < 10s |
| CNF2.1.2 | L2 < 30s | `npm run benchmark -- inspect-l2` | Temps < 30s |
| CNF2.1.3 | L3 < 60s | `npm run benchmark -- inspect-l3` | Temps < 60s |

#### CNF2.2 — Fiabilité

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF2.2.1 | Playwright stable | `npm test -- playwright-stability` | Pas de crash sur 100 inspections |
| CNF2.2.2 | Retry mechanism | `npm test -- retry` | Retry sur network errors |
| CNF2.2.3 | Timeout handling | `npm test -- timeout` | Timeout géré proprement |

---

## 4. MVP-3 — Critères d'Acceptation

### 4.1 Critères fonctionnels

#### CF3.1 — Workflow fonctionne

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF3.1.1 | `ekts capitalize <path>` lance workflow | `npm test -- capitalize` | Workflow 8 étapes exécuté |
| CF3.1.2 | Secrets détectés (Gitleaks) | `npm test -- gitleaks` | Secrets trouvés |
| CF3.1.3 | Secrets vérifiés (TruffleHog) | `npm test -- trufflehog` | Secrets vérifiés actifs/inactifs |
| CF3.1.4 | Post-mortem généré (10 sections) | `npm test -- postmortem` | Post-mortem complet |
| CF3.1.5 | Projet publié (Git) | `npm test -- publish` | Commit + tag créés |
| CF3.1.6 | Projet indexé (FTS + Vector) | `npm test -- capitalize-index` | Projet dans FTS + Vector |

**Tests associés :** `tests/capitalization/workflow.test.ts`, `tests/capitalization/postmortem.test.ts`

#### CF3.2 — Sécurité

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CF3.2.1 | Secrets détectés avant publication | `npm test -- secrets-before-publish` | Bloquant si secrets trouvés |
| CF3.2.2 | Nettoyage historique (git-filter-repo) | `npm test -- history-cleanup` | Historique nettoyé |
| CF3.2.3 | Validation humaine (approval gates) | Manuel | Confirmation requise avant publication |

**Tests associés :** `tests/capitalization/secrets.test.ts`

### 4.2 Critères non-fonctionnels

#### CNF3.1 — Fiabilité

| ID | Critère | Test | Résultat attendu |
|----|---------|------|------------------|
| CNF3.1.1 | Gitleaks + TruffleHog complémentaires | `npm test -- secrets-complementary` | Détection max |
| CNF3.1.2 | Workflow résilient (erreurs gérées) | `npm test -- workflow-resilience` | Erreurs gérées proprement |
| CNF3.1.3 | Rollback en cas d'échec | `npm test -- rollback` | Rollback automatique |

---

## 5. Stratégie de tests

### 5.1 Pyramide de tests

```
        /  E2E  \          ← 5% (tests manuels MCP)
       /----------\
      / Integration \      ← 25% (CLI, MCP, workflows)
     /----------------\
    /   Unit Tests     \   ← 70% (> 80% couverture)
   /----------------------\
```

### 5.2 Tests unitaires

**Couverture cible :** > 80%

**Fichiers testés :**
- `src/data/resource-repository.ts` → `tests/data/resource-repository.test.ts`
- `src/business/knowledge-manager.ts` → `tests/business/knowledge-manager.test.ts`
- `src/business/search-engine.ts` → `tests/business/search-engine.test.ts`
- `src/business/audit-manager.ts` → `tests/business/audit-manager.test.ts`
- `src/capitalization/workflow.ts` → `tests/capitalization/workflow.test.ts`

**Outils :** Vitest, c8 (couverture)

**Commande :** `npm run coverage`

### 5.3 Tests d'intégration

**Scénarios testés :**
- CLI → Knowledge Manager → Data Layer
- CLI → Search Engine → Data Layer
- CLI → Browser Inspector → Playwright
- CLI → Project Capitalizer → Git
- MCP Server → Business Logic

**Outils :** Vitest, supertest

**Commande :** `npm test -- integration`

### 5.4 Tests E2E (manuels)

**Scénarios testés :**
- Claude Code se connecte au MCP Server
- Cursor se connecte au MCP Server
- GitHub Copilot se connecte au MCP Server
- Workflow complet : add → search → inspect → capitalize

**Outils :** Manuels

**Commande :** Documentation dans `docs/E2E_TESTS.md`

### 5.5 Benchmarks

**Benchmarks exécutés :**

| Benchmark | Commande | Métrique | Objectif |
|-----------|----------|----------|----------|
| Recall@5 | `npm run benchmark -- recall` | Recall@5 | ≥ 0.75 |
| Faithfulness | `npm run benchmark -- faithfulness` | Faithfulness | ≥ 0.80 |
| Latence recherche | `npm run benchmark -- search-latency` | Latence (ms) | < 500ms (100K docs) |
| Latence CLI | `npm run benchmark -- cli-latency` | Latence (ms) | < 200ms |
| Indexation | `npm run benchmark -- indexing` | Temps (s) | < 1s par ressource |
| Inspection L1 | `npm run benchmark -- inspect-l1` | Temps (s) | < 10s |
| Inspection L2 | `npm run benchmark -- inspect-l2` | Temps (s) | < 30s |
| Inspection L3 | `npm run benchmark -- inspect-l3` | Temps (s) | < 60s |

**Jeux de données :**
- **Recall@5** : 1000 documents, 100 requêtes annotées
- **Faithfulness** : 100 documents, 50 requêtes annotées
- **Latence** : 100K documents, 100 requêtes aléatoires

**Commande :** `npm run benchmark`

### 5.6 Tests de sécurité

**Tests exécutés :**

| Test | Outil | Commande | Objectif |
|------|-------|----------|----------|
| Secrets dans code | Gitleaks | `gitleaks detect` | 0 secrets trouvés |
| Secrets actifs | TruffleHog | `trufflehog filesystem .` | Secrets vérifiés |
| Permissions fichiers | Script custom | `npm test -- permissions` | chmod 600 sur *.db |
| Exposition réseau | netstat | `npm test -- network` | Pas de ports ouverts |
| Dépendances vulnérables | npm audit | `npm audit` | 0 vulnérabilités critiques |

**Commande :** `npm run security`

---

## 6. Matrice de traçabilité

### 6.1 MVP-1

| Exigence | Critère | Test | Sprint |
|----------|---------|------|--------|
| **CLI fonctionne** | CF1.1 | `tests/cli/cli.test.ts` | Sprint 5 |
| **Recherche hybride** | CF1.2 | `tests/benchmark/search-benchmark.ts` | Sprint 4 |
| **MCP Server** | CF1.3 | `tests/mcp/mcp.test.ts` | Sprint 6 |
| **Données persistées** | CF1.4 | `tests/data/databases.test.ts` | Sprint 2 |
| **Performance** | CNF1.1 | `npm run benchmark` | Sprint 4 |
| **Sécurité** | CNF1.2 | `npm run security` | Sprint 1 |
| **Maintenabilité** | CNF1.3 | `npm run coverage` | Continu |
| **Portabilité** | CNF1.4 | CI GitHub Actions | Sprint 1 |

### 6.2 MVP-2

| Exigence | Critère | Test | Sprint |
|----------|---------|------|--------|
| **Inspection L1-L3** | CF2.1 | `tests/browser/inspector.test.ts` | Sprint 8 |
| **MCP tool inspect** | CF2.2 | `tests/mcp/inspect.test.ts` | Sprint 11-12 |
| **Stockage audits** | CF2.3 | `tests/business/audit-manager.test.ts` | Sprint 10 |
| **Performance inspection** | CNF2.1 | `npm run benchmark -- inspect` | Sprint 8 |
| **Fiabilité Playwright** | CNF2.2 | `tests/browser/playwright-stability.test.ts` | Sprint 7 |

### 6.3 MVP-3

| Exigence | Critère | Test | Sprint |
|----------|---------|------|--------|
| **Workflow 8 étapes** | CF3.1 | `tests/capitalization/workflow.test.ts` | Sprint 13-14 |
| **Sécurité secrets** | CF3.2 | `tests/capitalization/secrets.test.ts` | Sprint 13 |
| **Fiabilité workflow** | CNF3.1 | `tests/capitalization/workflow-resilience.test.ts` | Sprint 14 |

---

## 7. Définition of Done (DoD)

### 7.1 DoD par Sprint

**Un Sprint est terminé si :**
- ✅ Toutes les tâches du Sprint sont complétées
- ✅ Tests unitaires passent (couverture > 80%)
- ✅ Tests d'intégration passent
- ✅ Documentation mise à jour
- ✅ Code review effectué (PR approuvée)
- ✅ CI GitHub Actions verte
- ✅ Point de contrôle humain validé

### 7.2 DoD par MVP

**Un MVP est terminé si :**
- ✅ Tous les Sprints du MVP sont complétés
- ✅ Tous les critères fonctionnels validés (CF)
- ✅ Tous les critères non-fonctionnels validés (CNF)
- ✅ Benchmarks objectifs atteints
- ✅ Tests de sécurité passent
- ✅ Demo effectuée (stakeholders)
- ✅ Retrospective effectuée (équipe)
- ✅ Documentation complète
- ✅ Release taguée (Git)
- ✅ Go/No-Go validé pour MVP suivant

### 7.3 DoD global (fin Phase 13)

**La Phase 13 est terminée si :**
- ✅ MVP-1 validé (Fin Mois 3)
- ✅ MVP-2 validé (Fin Mois 6)
- ✅ MVP-3 validé (Fin Mois 9)
- ✅ Release v1.0.0 publiée
- ✅ Documentation complète
- ✅ Audit Phase 14 lancé

---

## 8. Monitoring continu

### 8.1 Métriques suivies

**Performance :**
- Latence CLI (ms)
- Latence recherche (ms)
- Temps indexation (s)
- Temps inspection (s)

**Qualité :**
- Recall@5
- Faithfulness
- Couverture tests (%)
- Nombre de bugs ouverts

**Sécurité :**
- Secrets détectés
- Vulnérabilités dépendances
- Permissions fichiers

**Usage :**
- Nombre de ressources
- Nombre d'audits
- Nombre de projets capitalisés
- Nombre de requêtes MCP

### 8.2 Alertes

**Seuils d'alerte :**

| Métrique | Seuil | Action |
|----------|-------|--------|
| Latence recherche | > 1000ms | Optimiser requêtes SQL |
| Recall@5 | < 0.70 | Réviser stratégie RRF |
| Couverture tests | < 75% | Ajouter tests manquants |
| Secrets détectés | > 0 | Bloquer, nettoyer |
| Vulnérabilités | > 0 critiques | Updater dépendances |

### 8.3 Reviews

**Fréquence :**
- **Hebdomadaire** : Point d'avancement Sprint (30 min)
- **Bi-mensuel** : Review code (1h)
- **Mensuel** : Review métriques (1h)
- **Par MVP** : Demo + Retrospective (2h)

---

## 9. Conclusion

### 9.1 Synthèse

**Critères d'acceptation définis :**
- ✅ **MVP-1** : 7 critères fonctionnels (CLI, recherche, MCP, données) + 4 non-fonctionnels (performance, sécurité, maintenabilité, portabilité)
- ✅ **MVP-2** : 3 critères fonctionnels (inspection, MCP, stockage) + 2 non-fonctionnels (performance, fiabilité)
- ✅ **MVP-3** : 2 critères fonctionnels (workflow, sécurité) + 1 non-fonctionnel (fiabilité)

**Stratégie de tests :**
- ✅ Pyramide de tests (70% unitaires, 25% intégration, 5% E2E)
- ✅ Couverture > 80%
- ✅ Benchmarks réguliers (Recall@5, Faithfulness, latence)
- ✅ Tests de sécurité (Gitleaks, TruffleHog, npm audit)

**Monitoring continu :**
- ✅ Métriques suivies (performance, qualité, sécurité, usage)
- ✅ Alertes configurées (seuils)
- ✅ Reviews régulières (hebdomadaire, mensuel, par MVP)

### 9.2 Prochaines étapes

**Phase 13 — Fin :**
- ✅ `13_ARCHITECTURES_CIBLES_COMPAREES.md`
- ✅ `13_SPECIFICATION_MVP.md`
- ✅ `13_ROADMAP_IMPLEMENTATION.md`
- ✅ `13_CRITERES_ACCEPTATION.md` (ce document)
- Mettre à jour INDEX.md (43/45 livrables)
- Créer `BILAN_PHASE_13.md`

**Phase 14 — Audit final :**
- Cohérence globale
- Maintenance et veille
- Documentation complète
- Recommandations finales

---

**Document rédigé le 21 octobre 2026 — Phase 13 du projet EKTS**
