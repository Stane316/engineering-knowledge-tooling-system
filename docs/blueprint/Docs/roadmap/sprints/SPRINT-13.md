# Sprint 13 — Gestion Multi-Projets

**Identifiant :** SPRINT-13  
**Nom :** Gestion Multi-Projets  
**Position dans la roadmap :** Premier sprint du MVP-3 (nouveau périmètre, ADR-031)  
**Durée prévue :** 2 semaines (Semaine 25-26)  
**Date de documentation :** 25 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Contexte et objectifs

### 1.1 Contexte indispensable

EKTS fonctionne actuellement en mode mono-projet implicite : tous les audits, ressources et recherches partagent le même espace. Le MVP-3 introduit la notion de **projet** comme unité d'organisation principale.

**Périmètre MVP-3 validé (ADR-031) :**

| Sprint | Objectif |
|--------|----------|
| **13** | **Gestion Multi-Projets (ce sprint)** |
| 14 | Suivi Temporel (timeline, tendances) |
| 15 | Capitalisation Connaissances (BestPractice) |
| 16 | Recommandations Contextuelles |
| 17 | Templates Projets |
| 18 | Tests E2E + Documentation MVP-3 |

**Documents de référence obligatoires :**
- `docs/ROADMAP.md` — Périmètre MVP-3 validé
- `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` — ADR-031 (redéfinition MVP-3), ADR-032 (Firebase abandonné)
- `docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture cible
- `docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack technique
- `docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md` — Workflow Git (interdiction PR)
- `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` — Avancement

**Décisions à respecter :**
- ADR-001 : SQLite WAL + FTS5 + sqlite-vec
- ADR-031 : MVP-3 suit `docs/ROADMAP.md`
- ADR-032 : Firebase abandonné, local-first
- Architecture C Hybride (monolithe TypeScript/Node.js)

### 1.2 Objectif principal

**Permettre la coexistence de plusieurs projets dans une même instance EKTS :**

- Modèle `Project` exploité (table déjà créée en migration 001)
- Association audits ↔ projets (clé étrangère nullable)
- CLI `ekts project create|list|show|delete`
- MCP `create_project`, `list_projects`, `get_project`, `delete_project`
- Filtre `--project` transversal aux commandes existantes

### 1.3 Problème traité

**Avant ce sprint :** Tous les audits et ressources partagent le même espace. Impossible de distinguer les audits de deux sites web différents, de suivre l'évolution d'un projet spécifique, ou de capitaliser sur les bonnes pratiques d'un projet.

**Après ce sprint :** Chaque audit, ressource ou bonne pratique peut être associé à un projet. Les commandes CLI et MCP supportent un filtre `--project` pour isoler le contexte.

### 1.4 Résultat attendu

**Livrables :**
- ✅ Migration 003 : colonne `project_id` sur `audit_metadata` (nullable)
- ✅ `ProjectRepository` (CRUD complet, pagination, filtre par statut)
- ✅ `ProjectManager` (business logic, validation Zod)
- ✅ CLI `ekts project create|list|show|delete` (4 sous-commandes)
- ✅ MCP 4 nouveaux outils (`create_project`, `list_projects`, `get_project`, `delete_project`)
- ✅ Filtre `--project` sur `ekts audit list|show|search` et `ekts list|search`
- ✅ Tests unitaires + intégration (couverture > 80%)
- ✅ Documentation mise à jour (CLI.md, MCP.md, API_REFERENCE.md)

### 1.5 Rapport avec les objectifs du MVP

**MVP-3 :** Capitalisation projets (nouveau périmètre ADR-031)  
**Contribution Sprint 13 :** Fournit la brique fondamentale "projet" sur laquelle tous les sprints suivants s'appuient.

### 1.6 Dépendances avec les sprints précédents

| Dépendance | Sprint source | État |
|------------|--------------|------|
| Table `projects` (migration 001) | Sprint 2 | ✅ Existe déjà |
| `AuditRepository` + `audit_metadata` | Sprint 10 | ✅ Opérationnel |
| CLI Commander.js runtime | Sprint 5 | ✅ Opérationnel |
| MCP Server + Zod schemas | Sprint 6 | ✅ Opérationnel |
| Recherche hybride (FTS + Vector) | Sprint 4 | ✅ Opérationnel |

### 1.7 Contraintes connues

- La table `projects` a déjà `id`, `name`, `description`, `status`, `started_at`, `completed_at`, `metadata`, `created_at`, `updated_at`
- La colonne `url` mentionnée dans ROADMAP.md n'existe pas dans la table — elle sera ajoutée via `metadata` (JSON) ou migration 003
- Les audits existants (sans projet) doivent rester fonctionnels → `project_id` nullable
- Aucune modification destructive sur les tables existantes

### 1.8 Hypothèses restantes

- Node.js 22+ disponible dans l'environnement de développement
- Les tests E2E Playwright nécessitent les navigateurs installés
- Le dépôt GitHub est accessible en poussée sur une branche dédiée

---

## 2. Périmètre du sprint

### 2.1 Ce qui doit être fait

**Tâches incluses :**
1. Migration 003 : ajouter `project_id` nullable sur `audit_metadata`
2. `ProjectRepository` : CRUD projects (create, getById, list, update, delete)
3. `ProjectManager` : validation Zod, logique métier, associations
4. Schéma Zod `ProjectSchema` (validation entrées)
5. CLI `ekts project` (create, list, show, delete)
6. MCP 4 outils (create_project, list_projects, get_project, delete_project)
7. Filtre `--project` sur commandes existantes (audit list, audit show, search, list, search)
8. Tests unitaires + intégration
9. Documentation mise à jour

### 2.2 Ce qui doit être documenté

- `docs/CLI.md` — Nouvelles commandes `ekts project`
- `docs/MCP.md` — Nouveaux outils MCP
- `docs/API_REFERENCE.md` — Endpoints mis à jour
- Guide `docs/guides/PROJECTS.md` — Guide utilisateur Multi-Projets

### 2.3 Ce qui doit être testé

- CRUD ProjectRepository (create, read, update, delete)
- Validation Zod (name requis, status valide, metadata JSON)
- CLI `ekts project` (4 sous-commandes)
- MCP 4 outils (validation, erreurs, résultats)
- Filtre `--project` sur commandes existantes
- Rétrocompatibilité : audits sans projet restent fonctionnels
- Couverture > 80%

### 2.4 Ce qui est explicitement exclu

- ❌ Timeline / Suivi temporel (Sprint 14)
- ❌ BestPractice / Capitalisation connaissances (Sprint 15)
- ❌ Recommandations (Sprint 16)
- ❌ Templates (Sprint 17)
- ❌ Tests E2E MVP-3 (Sprint 18)

---

## 3. État initial et prérequis

### 3.1 État initial

**Avant ce sprint :**
- ✅ Table `projects` existe (migration 001) mais n'est exploitée par aucun module
- ✅ `AuditRepository` fonctionne (Sprint 10)
- ✅ CLI Commander.js opérationnelle (10 commandes)
- ✅ MCP Server opérationnel (7 outils)
- ❌ Aucun `ProjectRepository`
- ❌ Aucune commande CLI `ekts project`
- ❌ Aucun outil MCP pour les projets
- ❌ Aucun filtre `--project` sur les commandes existantes

### 3.2 Prérequis obligatoires

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Node.js ≥ 22.19 | `node --version` | Installer Node.js 22 LTS |
| npm ≥ 10.9 | `npm --version` | Installer npm 10+ |
| Git | `git --version` | Installer Git |
| `npm run verify` code 0 | `npm run verify` | Corriger les erreurs avant de commencer |
| CI verte | GitHub Actions | Vérifier dernier run |

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

**3 sous-sprints** pour une durée totale de 2 semaines :

| Sous-sprint | Durée | Tâches | Objectif |
|-------------|-------|--------|----------|
| **Sprint 13-1** | 3 jours | 1.1, 1.2, 1.3 | Migration + ProjectRepository + ProjectManager |
| **Sprint 13-2** | 3 jours | 2.1, 2.2, 2.3 | CLI `ekts project` + filtre `--project` |
| **Sprint 13-3** | 4 jours | 3.1, 3.2, 3.3 | MCP projets + tests + documentation |

### 4.2 Ordre d'exécution

```
Sprint 13-1 (Migration + Repository + Manager)
    │
    ├──→ Sprint 13-2 (CLI + filtre --project)
    │
    └──→ Sprint 13-3 (MCP + tests + docs)
              │
              └──→ Validation Sprint 13
```

**Dépendances :**
- 13-2 dépend de 13-1 (ProjectRepository doit exister)
- 13-3 dépend de 13-1 (ProjectManager doit exister)
- 13-2 et 13-3 sont indépendants entre eux (peuvent être parallélisés)

---

## 5. Détails des sous-sprints

### 5.1 Sprint 13-1 — Migration + ProjectRepository + ProjectManager

**Durée :** 3 jours  
**Objectif :** Infrastructure de données pour les projets

**Tâches :**
1. Migration 003 : ajouter `project_id` nullable sur `audit_metadata`
2. `ProjectRepository` (src/data/repositories/project-repository.ts)
3. `ProjectManager` (src/business/project-manager.ts)
4. Schéma Zod `ProjectSchema` (src/shared/validators.ts)
5. Tests unitaires

**Livrables :**
- `src/data/migrations/003_project_audits.ts`
- `src/data/repositories/project-repository.ts`
- `src/business/project-manager.ts`
- `src/business/project-manager.types.ts`
- Tests : `tests/data/project-repository.test.ts`, `tests/integration/project-manager.test.ts`

**Critères d'acceptation :**
- C13.1.1 : Migration 003 exécutable sans erreur sur base existante
- C13.1.2 : `project_id` nullable sur `audit_metadata` (rétrocompatible)
- C13.1.3 : CRUD ProjectRepository fonctionnel (create, getById, list, update, delete)
- C13.1.4 : Validation Zod (name requis, status ∈ active/completed/archived)
- C13.1.5 : ProjectManager orchestre CRUD + validation + associations
- C13.1.6 : Tests > 80% couverture

**Références :**
- `SPRINT-13-01.md` pour le détail des tâches

### 5.2 Sprint 13-2 — CLI `ekts project` + filtre `--project`

**Durée :** 3 jours  
**Objectif :** Interface CLI pour les projets

**Tâches :**
1. Commande `ekts project create <name> [--description] [--status]`
2. Commande `ekts project list [--status <status>] [--json]`
3. Commande `ekts project show <id> [--json]`
4. Commande `ekts project delete <id> [--force]`
5. Option `--project <id>` sur `ekts audit list`
6. Option `--project <id>` sur `ekts audit show`
7. Option `--project <id>` sur `ekts search`
8. Option `--project <id>` sur `ekts list`
9. Tests intégration CLI

**Livrables :**
- `src/cli/commands/project.ts`
- Modifications : `src/cli/commands/audit.ts`, `src/cli/commands/search.ts`, `src/cli/commands/list.ts`
- Tests : `tests/cli/project.test.ts`

**Critères d'acceptation :**
- C13.2.1 : `ekts project create` crée un projet et affiche l'ID
- C13.2.2 : `ekts project list` liste tous les projets (filtrable par statut)
- C13.2.3 : `ekts project show <id>` affiche les détails d'un projet
- C13.2.4 : `ekts project delete <id>` supprime un projet (confirmation requise)
- C13.2.5 : `--project <id>` filtre les audits listés
- C13.2.6 : `--project <id>` filtre les résultats de recherche
- C13.2.7 : Codes de sortie cohérents (0 succès, 1 erreur, 2 non trouvé)
- C13.2.8 : Sortie `--json` valide pour toutes les commandes

**Références :**
- `SPRINT-13-02.md` pour le détail des tâches

### 5.3 Sprint 13-3 — MCP projets + tests + documentation

**Durée :** 4 jours  
**Objectif :** Exposition MCP + validation finale

**Tâches :**
1. MCP tool `create_project`
2. MCP tool `list_projects`
3. MCP tool `get_project`
4. MCP tool `delete_project`
5. Schémas Zod pour les outils MCP
6. Tests MCP
7. Documentation CLI.md, MCP.md, API_REFERENCE.md
8. Guide PROJECTS.md

**Livrables :**
- `src/mcp/tools/create-project.ts`
- `src/mcp/tools/list-projects.ts`
- `src/mcp/tools/get-project.ts`
- `src/mcp/tools/delete-project.ts`
- Modifications : `src/mcp/schemas/tool-schemas.ts`, `src/mcp/handlers/tools.ts`
- Tests : `tests/mcp/tools/create-project.test.ts`, `tests/mcp/tools/list-projects.test.ts`, etc.
- Docs : `docs/CLI.md` (mise à jour), `docs/MCP.md` (mise à jour), `docs/API_REFERENCE.md` (mise à jour), `docs/guides/PROJECTS.md`

**Critères d'acceptation :**
- C13.3.1 : 4 outils MCP fonctionnent via stdio
- C13.3.2 : Schémas Zod validés (entrées/sorties)
- C13.3.3 : Tests MCP > 80% couverture
- C13.3.4 : Documentation CLI.md mise à jour (4 nouvelles commandes)
- C13.3.5 : Documentation MCP.md mise à jour (4 nouveaux outils = 11 total)
- C13.3.6 : `npm run verify` code 0
- C13.3.7 : CI verte (7/7 jobs)
- C13.3.8 : Couverture globale > 80%

**Références :**
- `SPRINT-13-03.md` pour le détail des tâches

---

## 6. Architecture concernée

### 6.1 Composants新增

```
src/
├── data/
│   ├── migrations/
│   │   └── 003_project_audits.ts      ← NOUVEAU
│   └── repositories/
│       └── project-repository.ts       ← NOUVEAU
├── business/
│   ├── project-manager.ts             ← NOUVEAU
│   └── project-manager.types.ts       ← NOUVEAU
├── cli/
│   └── commands/
│       └── project.ts                 ← NOUVEAU
└── mcp/
    └── tools/
        ├── create-project.ts          ← NOUVEAU
        ├── list-projects.ts           ← NOUVEAU
        ├── get-project.ts             ← NOUVEAU
        └── delete-project.ts          ← NOUVEAU
```

### 6.2 Modifications

```
src/
├── cli/
│   └── commands/
│       ├── audit.ts                   ← MODIFIÉ (filtre --project)
│       ├── search.ts                  ← MODIFIÉ (filtre --project)
│       └── list.ts                    ← MODIFIÉ (filtre --project)
├── mcp/
│   ├── schemas/
│   │   └── tool-schemas.ts           ← MODIFIÉ (4 nouveaux outils)
│   └── handlers/
│       └── tools.ts                   ← MODIFIÉ (enregistrement)
├── storage/
│   ├── schema.ts                      ← MODIFIÉ (project_id sur audit_metadata)
│   └── audit-repository.ts           ← MODIFIÉ (filtre project_id)
└── shared/
    └── constants.ts                   ← MODIFIÉ (TABLES si besoin)
```

### 6.3 Schéma de données

**Migration 003 :**
```sql
ALTER TABLE audit_metadata ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audit_metadata_project_id ON audit_metadata(project_id);
```

**Note :** `ON DELETE SET NULL` — si un projet est supprimé, ses audits ne sont pas perdus.

---

## 7. Stratégie de tests

### 7.1 Tests unitaires

| Module | Fichier test | Couverture cible |
|--------|-------------|-----------------|
| ProjectRepository | `tests/data/project-repository.test.ts` | > 90% |
| ProjectManager | `tests/integration/project-manager.test.ts` | > 85% |
| CLI project | `tests/cli/project.test.ts` | > 85% |
| MCP tools | `tests/mcp/tools/*-project*.test.ts` | > 85% |

### 7.2 Tests d'intégration

- CRUD complet : create → list → show → update → delete
- Association audit ↔ projet : inspect → stocker avec project_id → list filtré
- Rétrocompatibilité : audits sans projet_id restent accessibles
- Filtre `--project` sur toutes les commandes concernées

### 7.3 Commandes de vérification

```bash
npm run typecheck      # Vérification TypeScript
npm run lint           # ESLint
npm run format:check   # Prettier
npm run build          # Compilation
npm test               # Tests unitaires + intégration
npm run coverage       # Couverture (seuil 80%)
npm run verify         # Ensemble complet
```

---

## 8. Risques et inconnues

### 8.1 Risques identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Migration 003 casse les audits existants | Élevé | Faible | `project_id` nullable + `ON DELETE SET NULL` |
| Filtre `--project` ralentit les requêtes | Moyen | Faible | Index sur `project_id`, test benchmark |
| Incohérence CLI ↔ MCP | Moyen | Faible | Même ProjectManager, mêmes schémas Zod |

### 8.2 Décisions ouvertes

Aucune décision bloquante. Toutes les informations nécessaires sont dans la roadmap et les documents d'architecture.

---

## 9. Critères de clôture du sprint

Le Sprint 13 est terminé lorsque :

- [ ] Migration 003 exécutée sans erreur
- [ ] CRUD ProjectRepository fonctionnel
- [ ] CLI `ekts project` (4 sous-commandes) fonctionnelle
- [ ] MCP 4 outils projets fonctionnels
- [ ] Filtre `--project` opérationnel sur audit list/show/search/list/search
- [ ] `npm run verify` code 0
- [ ] CI verte (7/7 jobs)
- [ ] Couverture > 80%
- [ ] Documentation mise à jour
- [ ] Rapport de sprint rédigé

---

## 10. Protocole de compte rendu

À la fin du sprint, produire un rapport (`SPRINT-13-RESULTAT.md`) contenant :

1. Les fichiers créés/modifiés
2. Les tests exécutés et leurs résultats
3. Les critères d'acceptation vérifiés
4. Les écarts constatés
5. Les décisions prises
6. Les commandes pour vérifier le travail
7. Le statut final (VALIDÉ ou BLOQUÉ)

---

## 11. Prompt d'exécution

```markdown
# PROMPT D'EXÉCUTION — SPRINT 13 (Gestion Multi-Projets)

Tu es l'agent de développement EKTS. Tu vas implémenter le Sprint 13.

## Documents à lire AVANT toute action

1. `docs/ROADMAP.md` — Périmètre MVP-3 (section "Sprint 13")
2. `docs/blueprint/Docs/roadmap/sprints/SPRINT-13.md` (ce document)
3. `docs/blueprint/Docs/roadmap/sprints/SPRINT-13-01.md` — Sous-sprint 13-1
4. `docs/blueprint/Docs/roadmap/sprints/SPRINT-13-02.md` — Sous-sprint 13-2
5. `docs/blueprint/Docs/roadmap/sprints/SPRINT-13-03.md` — Sous-sprint 13-3
6. `docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture cible
7. `docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack
8. `docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md` — Workflow Git
9. `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` — ADR-031, ADR-032
10. `AGENTS.md` — Règles de travail pour les agents IA

## État initial à vérifier

Avant de commencer, exécute :

```bash
git fetch origin
git status
git branch
node --version   # Doit être ≥ 22.19
npm --version    # Doit être ≥ 10.9
npm run verify   # Doit être code 0
```

## Règles absolues

- ❌ **Aucune pull request.** Jamais.
- ❌ **Aucun push sur `main`.** Travaille sur une branche dédiée.
- ❌ **Aucun secret** dans le code, les commits, la documentation.
- ❌ **Aucune modification destructive** sans validation.
- ✅ Branche de travail : `agent/sprint-13` ou `sprint/13/multi-projets`
- ✅ Commits atomiques : un commit par sous-sprint
- ✅ `npm run verify` code 0 avant chaque push

## Ordre d'exécution

1. **Sous-sprint 13-1** : Migration + ProjectRepository + ProjectManager
2. **Sous-sprint 13-2** : CLI `ekts project` + filtre `--project`
3. **Sous-sprint 13-3** : MCP projets + tests + documentation

## Vérifications à chaque sous-sprint

Après chaque sous-sprint :
```bash
npm run typecheck
npm run lint
npm test
npm run coverage
```

## Rapport de séance

À la fin de chaque sous-sprint, produis un rapport :
- Fichiers créés/modifiés
- Tests exécutés et résultats
- Critères d'acceptation vérifiés
- Écarts constatés
- Commandes pour vérifier

## Points d'arrêt

- **Après 13-1** : Vérifier que la migration 003 fonctionne sur une base existante
- **Après 13-2** : Vérifier que les commandes CLI fonctionnent manuellement
- **Après 13-3** : Vérifier `npm run verify` code 0 + CI verte

## Fin du sprint

Quand les 3 sous-sprints sont terminés :
1. Exécute `npm run verify` → code 0 attendu
2. Vérifie la CI → 7/7 jobs verts
3. Rédige `SPRINT-13-RESULTAT.md`
4. **Arrête-toi et attends le feu vert pour le Sprint 14**

## Important

- Ne résous pas silencieusement les contradictions entre code et documentation
- Si un blocage survient, isole-le et signale-le
- Ne modifie pas les sprints 1-12
- Ne commence pas le Sprint 14 sans autorisation
```

---

## 12. Résumé exécutif

### 12.1 Objectif

Permettre la gestion de plusieurs projets dans EKTS : modèle Project, association audits ↔ projets, CLI + MCP projets, filtre `--project` transversal.

### 12.2 Durée

2 semaines (10 jours ouvrables)

### 12.3 Sous-sprints

- **Sprint 13-1** (3 jours) : Migration 003 + ProjectRepository + ProjectManager
- **Sprint 13-2** (3 jours) : CLI `ekts project` + filtre `--project`
- **Sprint 13-3** (4 jours) : MCP 4 outils + tests + documentation

### 12.4 Livrables principaux

- Migration 003 (project_id sur audit_metadata)
- ProjectRepository + ProjectManager
- CLI `ekts project` (4 sous-commandes)
- MCP 4 outils projets (total 11 outils)
- Filtre `--project` sur 5 commandes existantes
- Documentation mise à jour

### 12.5 Critères de validation

8 critères obligatoires (migration, CRUD, CLI, MCP, filtre, verify, CI, couverture)

### 12.6 Prochaine étape

**Sprint 14 — Suivi Temporel** (après approbation Sprint 13)

---

**Document rédigé le 25 octobre 2026 — Sprint 13 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 13 prêt pour approbation**
