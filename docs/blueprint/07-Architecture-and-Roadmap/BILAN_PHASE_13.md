# Bilan Phase 13 — Architecture Cible, MVP et Roadmap

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS

---

## 1. Synthèse exécutive

**Phase 13 complétée avec succès.** Nous avons défini l'architecture cible EKTS, validé la séquence des 3 MVPs, et produit une roadmap détaillée avec critères d'acceptation mesurables.

**Livrables produits (112 KB total) :**
- ✅ `13_ARCHITECTURES_CIBLES_COMPAREES.md` (24 KB) — 3 architectures comparées, choix justifié
- ✅ `13_SPECIFICATION_MVP.md` (32 KB) — Périmètre MVP, contrats, ce qui est reporté
- ✅ `13_ROADMAP_IMPLEMENTATION.md` (36 KB) — 18 sprints, compétences, points de contrôle
- ✅ `13_CRITERES_ACCEPTATION.md` (20 KB) — Critères fonctionnels/non-fonctionnels, stratégie tests

**Décisions clés :**
1. **Architecture C (Hybride)** choisie : Monolithe modulaire SQLite + services optionnels
2. **Séquence MVP validée** : MVP-1 (Bibliothèque + Recherche + CLI + MCP) → MVP-2 (Inspection) → MVP-3 (Capitalisation)
3. **Timeline 9 mois** : 3 mois par MVP, 18 sprints de 2 semaines
4. **Critères mesurables** : Recall@5 ≥ 0.75, Faithfulness ≥ 0.80, latence < 500ms, couverture > 80%

---

## 2. Architecture cible

### 2.1 Architecture choisie : Architecture C (Hybride)

**Description :** Monolithe modulaire TypeScript/Node.js avec SQLite WAL + services optionnels activés par feature flags.

**Justification :**
- ✅ **Pragmatique** : Commence simple (Architecture A), évolue vers distribution si besoin
- ✅ **Coût maîtrisé** : $0 pour MVP, scale up uniquement si nécessaire
- ✅ **Progressive** : Migration graduelle, pas de big bang
- ✅ **Flexible** : Feature flags pour activer services externes (browser, search, DB)
- ✅ **Rétrocompatible** : Mode standalone toujours disponible

**Score comparatif :**
- Architecture A (Monolithe) : 8.5/10
- Architecture B (Microservices) : 4.8/10
- **Architecture C (Hybride) : 8.0/10** ← Choix

### 2.2 Composants principaux

```
EKTS Core (Monolithe TypeScript)
├── Interface Layer
│   ├── CLI (Commander.js) — 7 commandes
│   └── MCP Server (stdio) — 4 outils prioritaires
├── Business Logic Layer
│   ├── Knowledge Manager (CRUD)
│   ├── Search Engine (hybride FTS + Vector + RRF)
│   ├── Browser Inspector (Playwright, 4 niveaux)
│   ├── Creative Library (103+ ressources)
│   └── Project Capitalizer (workflow 8 étapes)
├── Data Layer (SQLite WAL)
│   ├── ekts.db (structuré)
│   ├── ekts-fts.db (FTS5)
│   └── ekts-vectors.db (sqlite-vec)
└── Services Optionnels (Docker, feature flags)
    ├── browser-service (Playwright)
    ├── search-service (Python)
    └── external-db (PostgreSQL)
```

### 2.3 Phases d'implémentation

**Phase 1 — MVP (Mois 1-3) : Architecture A (Monolithe SQLite)**
- Monolithe modulaire Node.js/TypeScript
- SQLite WAL + FTS5 + sqlite-vec
- CLI + MCP Server (stdio)
- 4 outils MCP prioritaires

**Phase 2 — Extension (Mois 4-6) : Ajout services optionnels**
- browser-service (Playwright) si inspection lourde
- search-service (Python) si volume > 100K documents

**Phase 3 — Production (Mois 7-12) : Distribution si requis**
- Externalisation DB (PostgreSQL + pgvector) si multi-users
- Docker Compose pour orchestration

---

## 3. Séquence MVP validée

### 3.1 MVP-1 — Bibliothèque, Recherche, CLI, MCP (Mois 1-3)

**Périmètre inclus :**
- ✅ Stockage structuré (SQLite WAL, 3 bases)
- ✅ Recherche hybride (FTS + Vector + RRF)
- ✅ CLI (7 commandes : init, add, search, get, list, delete, status)
- ✅ MCP Server (4 outils : search_knowledge, get_resource, list_resources, validate_resource)
- ✅ Indexation automatique (FTS + Vector)

**Périmètre reporté :**
- ❌ Creative Library (Phase 09) — MVP-1.5 optionnel
- ❌ Browser Inspector (Phase 04) — MVP-2
- ❌ Project Capitalizer (Phase 10) — MVP-3
- ❌ Authentification / RBAC — Production
- ❌ Monitoring / Alertes — Production

**Critères d'acceptation :**
- Recall@5 ≥ 0.75
- Faithfulness ≥ 0.80
- Latence < 500ms (100K documents)
- Compatible Claude Code, Cursor, Copilot
- Tests > 80% couverture

### 3.2 MVP-2 — Inspection Navigateur (Mois 4-6)

**Périmètre inclus :**
- ✅ Browser Inspector (Playwright MCP, 70+ tools)
- ✅ 4 niveaux d'inspection (L1-L3 pour MVP)
- ✅ Analyse 5 dimensions (performance, accessibilité, SEO, UX, contenu)
- ✅ Matrice sévérité (0-4 × 1-5 × 1-3)
- ✅ Stockage + indexation audits

**Critères d'acceptation :**
- L1 < 10s, L2 < 30s, L3 < 60s
- 5 dimensions analysées
- Audits stockés + indexés
- Tests > 80% couverture

### 3.3 MVP-3 — Capitalisation Projets (Mois 7-9)

**Périmètre inclus :**
- ✅ Workflow 8 étapes (collecte → dépréciation)
- ✅ Sécurité secrets (Gitleaks + TruffleHog)
- ✅ Post-mortem template (10 sections)
- ✅ Root cause analysis (5 pourquoi + Ishikawa)
- ✅ Dette technique tracée
- ✅ Publication Git + indexation RAG

**Critères d'acceptation :**
- Secrets détectés avant publication
- Post-mortems générés (10 sections)
- Release v1.0.0 publiée
- Tests > 80% couverture

### 3.4 Validation de la séquence

**Décision :** ✅ **Séquence validée avec ajustements mineurs**

**Arguments :**
- ✅ **MVP-1** : Fondation essentielle, valeur immédiate, risques faibles
- ✅ **MVP-2** : Dépend de MVP-1, valeur ajoutée, complexité maîtrisée
- ✅ **MVP-3** : Dépend de MVP-1 + MVP-2, valeur long terme, proposition de valeur EKTS

**Ajustement mineur :**
- ⚠️ **MVP-1.5** (optionnel) : Creative Library (Phase 09) entre MVP-1 et MVP-2

---

## 4. Roadmap détaillée

### 4.1 Timeline

**Mois 1-3 : MVP-1 (6 sprints)**
- Sprint 1 (S1-2) : Setup projet
- Sprint 2 (S3-4) : Data Layer
- Sprint 3 (S5-6) : Knowledge Manager
- Sprint 4 (S7-8) : Search Engine
- Sprint 5 (S9-10) : CLI
- Sprint 6 (S11-12) : MCP Server

**Mois 4-6 : MVP-2 (6 sprints)**
- Sprint 7 (S13-14) : Playwright Setup
- Sprint 8 (S15-16) : 4 Niveaux Inspection
- Sprint 9 (S17-18) : Analyse 5 Dimensions
- Sprint 10 (S19-20) : Stockage Audits
- Sprint 11-12 (S21-24) : CLI + MCP Inspection

**Mois 7-9 : MVP-3 (6 sprints)**
- Sprint 13-14 (S25-28) : Workflow 8 Étapes
- Sprint 15-16 (S29-32) : Post-Mortem Template
- Sprint 17-18 (S33-36) : CLI + MCP Capitalization

### 4.2 Jalons

| Jalon | Date | Critères |
|-------|------|----------|
| **MVP-1** | Fin Mois 3 | CLI 7 commandes, Recall@5 ≥ 0.75, MCP 4 outils, tests > 80% |
| **MVP-2** | Fin Mois 6 | Inspection L1-L3, 5 dimensions, audits stockés, tests > 80% |
| **MVP-3** | Fin Mois 9 | Workflow 8 étapes, secrets détectés, post-mortems, release v1.0.0 |

### 4.3 Points de contrôle humain

**Après chaque Sprint :**
- ✅ Code review (PR)
- ✅ Tests passent (CI)
- ✅ Documentation mise à jour
- ✅ Validation humaine (product owner)

**Après chaque MVP :**
- ✅ Demo (stakeholders)
- ✅ Retrospective (équipe)
- ✅ Validation critères d'acceptation
- ✅ Go/No-Go pour MVP suivant

**Reviews intermédiaires :**
- Fin Mois 1, 2, 4, 5, 7, 8 : Points d'avancement

---

## 5. Contrats entre composants

### 5.1 Contrat CLI ↔ Business Logic

```typescript
interface CLICommand {
  name: string;
  args: Record<string, any>;
  options: Record<string, any>;
}

interface CLIResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

### 5.2 Contrat MCP ↔ Business Logic

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (input: any) => Promise<any>;
}
```

### 5.3 Contrat Business Logic ↔ Data Layer

```typescript
interface Repository<T> {
  create(entity: T): Promise<T>;
  getById(id: string): Promise<T | null>;
  list(filters?: Partial<T>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

---

## 6. Critères d'acceptation

### 6.1 MVP-1

**Fonctionnels :**
- ✅ CLI fonctionne (7 commandes)
- ✅ Recherche hybride (Recall@5 ≥ 0.75, Faithfulness ≥ 0.80)
- ✅ MCP Server (4 outils, compatible Tier 1 agents)
- ✅ Données persistées (SQLite WAL, 3 bases)

**Non-fonctionnels :**
- ✅ Performance (latence < 500ms)
- ✅ Sécurité (chmod 600, pas d'exposition réseau)
- ✅ Maintenabilité (tests > 80% couverture)
- ✅ Portabilité (Linux, macOS, Windows)

### 6.2 MVP-2

**Fonctionnels :**
- ✅ Inspection L1-L3 fonctionne
- ✅ 5 dimensions analysées
- ✅ MCP tool `inspect_site`
- ✅ Audits stockés + indexés

**Non-fonctionnels :**
- ✅ Performance (L1 < 10s, L2 < 30s, L3 < 60s)
- ✅ Fiabilité (Playwright stable, retry mechanism)

### 6.3 MVP-3

**Fonctionnels :**
- ✅ Workflow 8 étapes
- ✅ Secrets détectés (Gitleaks + TruffleHog)
- ✅ Post-mortems générés (10 sections)

**Non-fonctionnels :**
- ✅ Fiabilité (workflow résilient, rollback)

---

## 7. Stratégie de tests

### 7.1 Pyramide de tests

```
        /  E2E  \          ← 5% (tests manuels MCP)
       /----------\
      / Integration \      ← 25% (CLI, MCP, workflows)
     /----------------\
    /   Unit Tests     \   ← 70% (> 80% couverture)
   /----------------------\
```

### 7.2 Benchmarks

| Benchmark | Métrique | Objectif |
|-----------|----------|----------|
| Recall@5 | Recall@5 | ≥ 0.75 |
| Faithfulness | Faithfulness | ≥ 0.80 |
| Latence recherche | Latence (ms) | < 500ms (100K docs) |
| Latence CLI | Latence (ms) | < 200ms |
| Indexation | Temps (s) | < 1s par ressource |
| Inspection L1 | Temps (s) | < 10s |
| Inspection L2 | Temps (s) | < 30s |
| Inspection L3 | Temps (s) | < 60s |

### 7.3 Tests de sécurité

- Gitleaks (secrets dans code)
- TruffleHog (secrets actifs)
- npm audit (vulnérabilités dépendances)
- Permissions fichiers (chmod 600)

---

## 8. Compétences requises

### 8.1 MVP-1

- TypeScript (intermédiaire)
- Node.js (intermédiaire)
- SQLite (intermédiaire)
- FTS5 (bases)
- Vector embeddings (bases)
- MCP SDK (bases)
- Commander.js (bases)
- Tests unitaires (intermédiaire)

### 8.2 MVP-2

- Playwright (intermédiaire)
- Lighthouse (intermédiaire)
- axe-core (intermédiaire)
- WCAG 2.2 (bases)
- SEO (bases)
- UX heuristiques (bases)

### 8.3 MVP-3

- Git (intermédiaire)
- Gitleaks + TruffleHog (bases)
- git-filter-repo (bases)
- Post-mortem (bases)
- Root cause analysis (bases)

---

## 9. Risques et mitigations

### 9.1 Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| SQLite performance | Faible | Élevé | WAL mode, benchmark, migration PostgreSQL si besoin |
| Embeddings coût | Moyen | Moyen | OpenAI API ($0.02/1M tokens) ou local Ollama |
| Playwright stabilité | Moyen | Élevé | Retry mechanism, timeout handling |
| MCP compatibility | Faible | Élevé | Tester avec Claude Code, Cursor, Copilot |

### 9.2 Risques organisationnels

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Scope creep | Moyen | Moyen | Stick to périmètre défini |
| Retard planning | Moyen | Moyen | Buffer 2 semaines par MVP |
| Compétences manquantes | Faible | Élevé | Formation continue, documentation |
| Burnout | Faible | Élevé | Rythme soutenable (40h/semaine) |

---

## 10. Intégration avec phases précédentes

### 10.1 Phases connexes

**Phase 02-03 — MCP et intégration agentique :**
- ✅ MCP spec 2026-07-28 intégrée
- ✅ 4 outils MCP prioritaires définis
- ✅ Transport stdio choisi

**Phase 04-05 — Automatisation navigateur :**
- ✅ Playwright choisi (score 96/100)
- ✅ 4 niveaux d'inspection (L1-L4)
- ✅ Analyse 5 dimensions

**Phase 06 — Stockage :**
- ✅ SQLite WAL + FTS5 + sqlite-vec
- ✅ Architecture 3 bases

**Phase 07 — RAG :**
- ✅ Recherche hybride (FTS + Vector + RRF)
- ✅ Recall@5 ≥ 0.75, Faithfulness ≥ 0.80

**Phase 10 — Capitalisation :**
- ✅ Workflow 8 étapes
- ✅ Post-mortem template 10 sections
- ✅ Gitleaks + TruffleHog

**Phase 11 — Sécurité :**
- ✅ 4 niveaux sécurité (MVP → Production)
- ✅ STRIDE adapté MCP
- ✅ Default-deny network

**Phase 12 — Outils IA :**
- ✅ Claude Code + Copilot + Cline recommandés
- ✅ MCP Tier 1 agents confirmés

### 10.2 Contributions aux phases futures

**Phase 14 — Audit final :**
- ✅ Architecture cible définie
- ✅ MVPs spécifiés
- ✅ Roadmap détaillée
- ✅ Critères d'acceptation mesurables

---

## 11. Questions résolues

### 11.1 Questions initiales

**Q1 : Quelle architecture choisir ?**
✅ **Réponse :** Architecture C (Hybride) — Monolithe modulaire SQLite + services optionnels

**Q2 : Quelle séquence MVP ?**
✅ **Réponse :** MVP-1 (Bibliothèque + Recherche + CLI + MCP) → MVP-2 (Inspection) → MVP-3 (Capitalisation)

**Q3 : Quel périmètre pour chaque MVP ?**
✅ **Réponse :** Défini avec précision (fonctionnalités incluses/reportées)

**Q4 : Quels contrats entre composants ?**
✅ **Réponse :** CLI ↔ Business Logic ↔ Data Layer ↔ MCP (interfaces TypeScript)

**Q5 : Quels critères d'acceptation ?**
✅ **Réponse :** Recall@5 ≥ 0.75, Faithfulness ≥ 0.80, latence < 500ms, couverture > 80%

**Q6 : Quelle roadmap ?**
✅ **Réponse :** 18 sprints (9 mois), 3 MVPs, jalons clairs, points de contrôle humains

### 11.2 Questions ouvertes

**À explorer en Phase 14 :**
- ❓ Cohérence globale du projet
- ❓ Stratégie de maintenance long terme
- ❓ Veille technologique continue

---

## 12. Recommandations finales

### 12.1 Pour EKTS

**Architecture :** Architecture C (Hybride) — Monolithe modulaire SQLite + services optionnels

**Timeline :** 9 mois (3 MVPs, 18 sprints)

**Budget :** $0 (MVP-1) → $0-20/mois (MVP-2-3, embeddings OpenAI optionnels)

**Stack technique :**
- Node.js 20+ (TypeScript)
- SQLite WAL + FTS5 + sqlite-vec
- Commander.js (CLI)
- MCP SDK TypeScript v2
- Playwright (MVP-2)
- Gitleaks + TruffleHog (MVP-3)
- Vitest (tests)

### 12.2 Actions immédiates

**Démarrer MVP-1 (Semaine 1-2) :**
1. Initialiser projet Node.js + TypeScript
2. Configurer ESLint + Prettier + Vitest
3. Créer structure dossiers
4. Installer dépendances (better-sqlite3, commander, zod, pino)
5. Configurer Gitleaks pre-commit
6. Créer README + documentation setup
7. CI GitHub Actions (lint + test)

**Point de contrôle Sprint 1 :**
- ✅ `npm run build` fonctionne
- ✅ `npm test` passe
- ✅ `npm run lint` passe
- ✅ CI GitHub Actions verte

---

## 13. Conclusion

### 13.1 Synthèse

**Phase 13 réussie :**
- ✅ Architecture cible définie (Architecture C Hybride)
- ✅ Séquence MVP validée (3 MVPs, 9 mois)
- ✅ Périmètre MVP spécifié (inclus/reporté)
- ✅ Contrats entre composants définis
- ✅ Roadmap détaillée (18 sprints)
- ✅ Critères d'acceptation mesurables
- ✅ Stratégie de tests définie
- ✅ Compétences requises identifiées
- ✅ Risques et mitigations documentés

**Principales décisions :**
1. **Architecture C (Hybride)** : Pragmatique, progressive, coût maîtrisé
2. **MVP-1 → MVP-2 → MVP-3** : Séquence logique, dépendances respectées
3. **SQLite WAL + FTS5 + sqlite-vec** : Simple, performant, portable
4. **MCP stdio** : Local, sécurisé, compatible Tier 1 agents
5. **Recherche hybride** : FTS + Vector + RRF (Recall@5 ≥ 0.75)

### 13.2 Prochaines étapes

**Phase 14 — Audit final :**
- Cohérence globale du projet
- Maintenance et veille
- Documentation complète
- Recommandations finales

**Implémentation MVP-1 :**
- Démarrer Sprint 1 (setup projet)
- Suivre roadmap (18 sprints)
- Points de contrôle humains réguliers

---

**Document rédigé le 21 octobre 2026 — Phase 13 du projet EKTS**
