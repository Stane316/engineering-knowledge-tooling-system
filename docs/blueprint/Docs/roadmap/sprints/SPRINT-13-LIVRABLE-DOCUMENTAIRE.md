# Rapport de Livraison Documentaire — Sprint 13

**Date :** 25 octobre 2026  
**Statut :** ✅ Documentation prête pour implémentation  
**Sprint :** Sprint 13 — Gestion Multi-Projets  
**Durée de préparation :** Phase 2 de l'audit

---

## 1. Documents créés

### 1.1 Documents principaux du Sprint 13

| Fichier | Lignes | Taille | Rôle |
|---------|--------|--------|------|
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-13.md` | 570 | 20.5 KB | Document principal du sprint |
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-13-01.md` | 457 | 13.0 KB | Sous-sprint 1 : Migration + Repository + Manager |
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-13-02.md` | 392 | 11.2 KB | Sous-sprint 2 : CLI + filtre --project |
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-13-03.md` | 726 | 17.7 KB | Sous-sprint 3 : MCP + tests + documentation |
| **TOTAL** | **2 145** | **62.4 KB** | **4 documents** |

### 1.2 Corrections documentaires appliquées

| Fichier | Modification | Raison |
|---------|--------------|--------|
| `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` | Ajout ADR-031 (redéfinition MVP-3) | Décision utilisateur |
| `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` | Ajout ADR-032 (Firebase abandonné) | Décision utilisateur |
| `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` | Ajout risques R-13.1 à R-13.3 | Risques identifiés |
| `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` | Mise à jour matrice couverture §4.1 | Nouveaux ADR |
| `docs/blueprint/07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` | Note "MVP-3 redéfini" | Cohérence ADR-031 |
| `docs/blueprint/07-Architecture-and-Roadmap/13_ROADMAP_IMPLEMENTATION.md` | Note "MVP-3 redéfini" | Cohérence ADR-031 |
| `docs/blueprint/05-Creative-Engineering/10_WORKFLOW_CAPITALISATION.md` | Note "référence historique" | Cohérence ADR-031 |
| `docs/blueprint/05-Creative-Engineering/10_TEMPLATE_POSTMORTEM_PROJET.md` | Note "référence historique" | Cohérence ADR-031 |
| `docs/ROADMAP.md` | Note Firebase abandonné | Cohérence ADR-032 |
| `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` | Suppression doublons sprints 9-12 | Correction EKTS-AUDIT-011 |
| `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` | Mise à jour statut Sprint 12 | Cohérence avec réalité |
| `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` | Note périmètre MVP-3 redéfini | Cohérence ADR-031 |

### 1.3 Fichiers d'audit créés (Phase 1)

| Fichier | Rôle |
|---------|------|
| `EKTS_AUDIT_SPRINTS_01_12.md` | Rapport d'audit complet (Phase 1) |
| `docs/audit/EKTS_AUDIT_DEVIATIONS_REGISTER.md` | Registre des écarts |
| `docs/audit/EKTS_SPRINT_13_READINESS.md` | État de préparation Sprint 13 |
| `docs/audit/EKTS_CORRECTION_PROMPTS.md` | Prompts de correction |

---

## 2. Sources utilisées

### 2.1 Documents de référence consultés

1. `docs/ROADMAP.md` — Périmètre MVP-3 validé (ADR-031)
2. `docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture cible
3. `docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack technique
4. `docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md` — Workflow Git
5. `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` — ADR existants
6. `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` — Avancement
7. `docs/blueprint/07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` — Spec MVP (ancien périmètre)
8. `docs/blueprint/07-Architecture-and-Roadmap/13_ROADMAP_IMPLEMENTATION.md` — Roadmap (ancien périmètre)
9. `AGENTS.md` — Règles de travail pour les agents IA

### 2.2 Code existant examiné

- `src/data/migrations/001_init.ts` — Table `projects` existante
- `src/data/migrations/002_embedding_space.ts` — Migration 002 (référence)
- `src/storage/schema.ts` — Schéma `audit_metadata`
- `src/storage/audit-repository.ts` — Repository audits (référence)
- `src/cli/commands/*.ts` — Commandes CLI existantes (référence)
- `src/mcp/tools/*.ts` — Outils MCP existants (référence)
- `src/mcp/schemas/tool-schemas.ts` — Schémas Zod MCP (référence)
- `src/shared/validators.ts` — Schémas Zod partagés (référence)
- `src/shared/constants.ts` — Constantes TABLES

### 2.3 Décisions intégrées

- **ADR-031** : MVP-3 suit `docs/ROADMAP.md` (Multi-Projets, Timeline, BestPractice, Recommandations, Templates, Tests)
- **ADR-032** : Firebase abandonné, Supabase envisagé pour MVP futur
- **ADR-001** : SQLite WAL + FTS5 + sqlite-vec (inchangé)
- **Architecture C Hybride** : Monolithe TypeScript/Node.js (inchangé)

---

## 3. Décomposition du Sprint 13

### 3.1 Structure choisie

**3 sous-sprints** (convention cohérente avec les sprints 1-12) :

| Sous-sprint | Durée | Objectif |
|-------------|-------|----------|
| **13-1** | 3 jours | Migration 003 + ProjectRepository + ProjectManager |
| **13-2** | 3 jours | CLI `ekts project` + filtre `--project` |
| **13-3** | 4 jours | MCP 4 outils + tests + documentation |
| **TOTAL** | **10 jours** | **2 semaines** |

### 3.2 Justification de la décomposition

1. **13-1 (Infrastructure)** : Pose les fondations (migration, repository, manager). Indépendant des interfaces.
2. **13-2 (CLI)** : Interface utilisateur. Dépend de 13-1 mais peut être parallélisé avec 13-3.
3. **13-3 (MCP + Docs)** : Exposition agentique + documentation finale. Dépend de 13-1.

**Dépendances :**
- 13-2 et 13-3 dépendent de 13-1
- 13-2 et 13-3 sont indépendants entre eux

### 3.3 Alternatives considérées

- **2 sous-sprints** : Trop dense (MCP + docs dans le même sous-sprint que CLI)
- **4 sous-sprints** : Trop fragmenté (séparer MCP et docs n'apporte rien)
- **3 sous-sprints** : ✅ Équilibre optimal (infrastructure / CLI / MCP+docs)

---

## 4. Critères d'acceptation du Sprint 13

### 4.1 Critères globaux

- C13.1 : Migration 003 exécutable sans erreur sur base existante
- C13.2 : `project_id` nullable sur `audit_metadata` (rétrocompatible)
- C13.3 : CRUD ProjectRepository fonctionnel (create, getById, list, update, delete)
- C13.4 : Validation Zod (name requis, status ∈ active/completed/archived)
- C13.5 : ProjectManager orchestre CRUD + validation
- C13.6 : CLI `ekts project` (4 sous-commandes) fonctionnelle
- C13.7 : Filtre `--project` opérationnel sur 5 commandes existantes
- C13.8 : MCP 4 outils projets fonctionnels (total 11 outils)
- C13.9 : `npm run verify` code 0
- C13.10 : CI verte (7/7 jobs)
- C13.11 : Couverture globale > 80%
- C13.12 : Documentation mise à jour (CLI.md, MCP.md, API_REFERENCE.md, PROJECTS.md)

### 4.2 Critères par sous-sprint

**Sprint 13-1 (6 critères) :**
- C13.1.1 : Migration 003 exécutable
- C13.1.2 : Idempotente
- C13.1.3 : CRUD ProjectRepository fonctionnel
- C13.1.4 : Validation Zod
- C13.1.5 : ProjectManager orchestre
- C13.1.6 : Tests > 80% couverture

**Sprint 13-2 (8 critères) :**
- C13.2.1 : `ekts project create` fonctionne
- C13.2.2 : `ekts project list` fonctionne
- C13.2.3 : `ekts project show` fonctionne
- C13.2.4 : `ekts project delete` fonctionne
- C13.2.5 : Filtre `--project` sur audit list/show
- C13.2.6 : Filtre `--project` sur search/list
- C13.2.7 : Codes de sortie cohérents
- C13.2.8 : Sortie `--json` valide

**Sprint 13-3 (8 critères) :**
- C13.3.1 : 4 outils MCP fonctionnent
- C13.3.2 : Schémas Zod validés
- C13.3.3 : Tests MCP > 80% couverture
- C13.3.4 : Documentation CLI.md mise à jour
- C13.3.5 : Documentation MCP.md mise à jour
- C13.3.6 : `npm run verify` code 0
- C13.3.7 : CI verte
- C13.3.8 : Couverture globale > 80%

---

## 5. Prompts d'exécution

Chaque sous-sprint contient un prompt d'exécution complet (section §11 du document principal) qui impose à l'agent de développement :

1. Lire les documents de référence
2. Vérifier l'état initial
3. Respecter les règles absolues (pas de PR, pas de push sur main, pas de secrets)
4. Exécuter les sous-sprints dans l'ordre
5. Produire un rapport de séance
6. S'arrêter aux points de validation

---

## 6. Risques identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Migration 003 casse les audits existants | Élevé | Faible | `project_id` nullable + `ON DELETE SET NULL` |
| Filtre `--project` ralentit les requêtes | Moyen | Faible | Index sur `project_id`, test benchmark |
| Incohérence CLI ↔ MCP | Moyen | Faible | Même ProjectManager, mêmes schémas Zod |

---

## 7. Décisions ouvertes

**Aucune décision bloquante.** Toutes les informations nécessaires sont dans :
- La roadmap validée (ADR-031)
- Les documents d'architecture
- Le code existant

---

## 8. Écarts documentaires détectés

### 8.1 Écarts corrigés

- ✅ Doublons dans REGISTRE-AVANCEMENT.md (Sprint 9-12 listés 2×)
- ✅ Statut MVP-2 sous-estimé dans REGISTRE-AVANCEMENT.md (indiquait "Sprints 7-8" au lieu de "7-12")
- ✅ Absence de note sur la redéfinition du MVP-3 dans les documents du blueprint

### 8.2 Écarts restants (non bloquants)

- ⚠️ La table `projects` n'a pas de colonne `url` (mentionnée dans ROADMAP.md mais absente de la migration 001)
  - **Solution proposée** : Utiliser `metadata` (JSON) pour stocker l'URL, ou ajouter une migration 004 si nécessaire
  - **Impact** : Mineur — le champ `url` n'est pas critique pour le Sprint 13

---

## 9. Éléments restant à valider

- [ ] L'implémentation respecte les spécifications documentées
- [ ] Les tests couvrent tous les cas critiques
- [ ] La documentation est claire et complète
- [ ] La CI passe sur tous les environnements (Ubuntu, Windows, Node 22, 24)
- [ ] La couverture reste > 80%

---

## 10. Dépendances avec le Sprint 14

Le Sprint 14 (Suivi Temporel) dépend du Sprint 13 :

- **Dépendance directe** : Le modèle `Project` doit exister pour créer une timeline
- **Dépendance indirecte** : Les audits doivent pouvoir être associés à un projet (`project_id`)

**Prérequis Sprint 14 :**
- ✅ Modèle `Project` complet (CRUD)
- ✅ Association audits ↔ projets (`project_id`)
- ✅ Filtre `--project` opérationnel

Le Sprint 14 devra :
- Créer une timeline des audits par projet
- Détecter les tendances (amélioration/régression)
- Générer des graphiques d'évolution
- Envoyer des alertes automatiques (régression > 10 points)

---

## 11. Recommandations avant exécution

### 11.1 Pour l'agent de développement

1. **Lire tous les documents** avant de commencer (SPRINT-13.md, 13-01, 13-02, 13-03)
2. **Vérifier l'état initial** (`npm run verify` code 0, CI verte)
3. **Respecter l'ordre des sous-sprints** (13-1 → 13-2 → 13-3)
4. **Tester à chaque étape** (ne pas attendre la fin du sprint)
5. **Documenter au fur et à mesure** (ne pas retarder la documentation)
6. **Produire un rapport de séance** après chaque sous-sprint
7. **S'arrêter aux points de validation** (ne pas enchaîner automatiquement)

### 11.2 Pour le validateur

1. **Vérifier les 12 critères d'acceptation** (C13.1 à C13.12)
2. **Exécuter `npm run verify`** (doit retourner code 0)
3. **Vérifier la CI** (7/7 jobs verts)
4. **Tester manuellement** les commandes CLI et outils MCP
5. **Relire la documentation** (clarté, complétude, exactitude)
6. **Vérifier la couverture** (> 80%)

---

## 12. Conclusion

La documentation du Sprint 13 est **complète et prête pour implémentation**.

**Points forts :**
- ✅ Décomposition claire en 3 sous-sprints
- ✅ Critères d'acceptation mesurables
- ✅ Prompts d'exécution détaillés
- ✅ Corrections documentaires appliquées (ADR-031, ADR-032, doublons)
- ✅ Cohérence avec les sprints 1-12

**Points d'attention :**
- ⚠️ La table `projects` n'a pas de colonne `url` (utilisable via `metadata`)
- ⚠️ Les documents du blueprint original sont annotés comme "références historiques"

**Prochaine étape :**
- 🔄 Implémentation du Sprint 13 par l'agent de développement
- ⏳ Validation du Sprint 13 par le validateur
- ⏳ Préparation du Sprint 14 (après validation du Sprint 13)

---

**Rapport rédigé le 25 octobre 2026 — Phase 2 de l'audit**  
**Statut : ✅ Documentation Sprint 13 prête pour implémentation**
