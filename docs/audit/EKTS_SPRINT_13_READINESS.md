# EKTS — ÉTAT DE PRÉPARATION DU SPRINT 13

**Date :** 25 octobre 2026  
**Audit :** Phase 1 — Sprints 1 à 12  
**Statut :** ⏸️ En attente d'arbitrage sur EKTS-AUDIT-001 et EKTS-AUDIT-010

---

## 1. Prérequis satisfaits

| Prérequis | Statut | Preuve |
|-----------|--------|--------|
| MVP-1 complet (Sprints 1-6) | ✅ | Code source + 700+ tests + CI verte |
| MVP-2 complet (Sprints 7-12) | ✅ | 88/88 critères validés, preuves réelles |
| Architecture SQLite opérationnelle | ✅ | 3 bases, WAL, migrations, FTS5, sqlite-vec |
| Table `projects` existante | ✅ | Migration 001 (id, name, description, status, timestamps) |
| CLI Commander.js opérationnelle | ✅ | 10 commandes, codes de sortie, --json |
| MCP Server opérationnel | ✅ | 7 outils, Zod schemas, stdio transport |
| Recherche hybride (FTS5 + Vector + RRF) | ✅ | Recall@5 ≥ 0.75, latence < 500ms |
| Infrastructure de test | ✅ | Vitest 5, couverture 97,06%, CI multi-plateforme |
| Documentation technique | ✅ | 183 fichiers, guides utilisateur/développeur/API |
| Sécurité | ✅ | Gitleaks, npm audit 0 vuln, aucun secret |

## 2. Corrections requises avant Sprint 13

### 🔴 Bloquantes

| ID | Correction | Pourquoi bloquant |
|----|-----------|-------------------|
| EKTS-AUDIT-001 | Clarifier le périmètre MVP-3 | Impossible de documenter Sprint 13 sans savoir quel périmètre suivre |
| EKTS-AUDIT-010 | Clarifier le statut de Firebase | Pourrait influencer l'architecture si Firebase est attendu |

### 🟡 Recommandées (non bloquantes)

| ID | Correction | Priorité |
|----|-----------|----------|
| EKTS-AUDIT-002 | Mettre à jour le blueprint (Node 22+) | Basse |
| EKTS-AUDIT-003 | Mettre à jour l'ADR-002 (SDK MCP 1.32.x) | Basse |
| EKTS-AUDIT-011 | Nettoyer les doublons REGISTRE-AVANCEMENT.md | Moyenne |

## 3. Écarts isolables (peuvent rester ouverts)

Les écarts EKTS-AUDIT-002 à EKTS-AUDIT-009 sont des extensions de périmètre validées et documentées. Ils ne bloquent pas le Sprint 13 car :
- Ils concernent les sprints 1-12 (terminés)
- Le code correspondant est fonctionnel et testé
- Ils n'introduisent pas d'incompatibilité avec le Sprint 13

## 4. Dépendances techniques du Sprint 13

### Si périmètre = nouvelle roadmap (ROADMAP.md)

**Sprint 13 — Gestion Multi-Projets :**
- ✅ Table `projects` (migration 001)
- ✅ CLI runtime Commander (program.ts, runtime.ts)
- ✅ MCP schemas Zod (tool-schemas.ts)
- ✅ AuditRepository (association via clé étrangère)
- ✅ Recherche hybride (filtre `--project` sur search_knowledge)

**Aucun prérequis technique manquant.**

### Si périmètre = blueprint original (workflow 8 étapes)

**Sprint 13 — Workflow 8 étapes (partie 1) :**
- ✅ Git (prérequis système)
- ✅ Gitleaks (déjà configuré)
- ❓ TruffleHog (à installer — non présent dans le dépôt)
- ✅ Système de fichiers (pour artefacts)
- ✅ CLI runtime (pour commande `ekts capitalize`)
- ✅ MCP Server (pour outil `capitalize_project`)
- ✅ Indexation FTS + Vector (pour capitalisation)

**Prérequis supplémentaire :** Installation de TruffleHog comme dépendance ou outil système.

## 5. Incohérences à résoudre

### Incohérence 1 — Périmètre MVP-3

| Document | Périmètre MVP-3 |
|----------|-----------------|
| `docs/blueprint/07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` | Workflow 8 étapes + post-mortems + sécurité secrets |
| `docs/blueprint/05-Creative-Engineering/10_WORKFLOW_CAPITALISATION.md` | Workflow 8 étapes détaillé |
| `docs/blueprint/05-Creative-Engineering/10_TEMPLATE_POSTMORTEM_PROJET.md` | Template post-mortem 10 sections |
| `docs/blueprint/07-Architecture-and-Roadmap/13_ROADMAP_IMPLEMENTATION.md` | Sprints 13-14 (workflow), 15-16 (post-mortem), 17-18 (CLI+MCP) |
| `docs/ROADMAP.md` | Sprint 13 (Multi-Projets), 14 (Timeline), 15 (BestPractice), 16 (Recommandations), 17 (Templates), 18 (Tests) |

**Deux visions contradictoires. Une seule doit être la source de vérité.**

### Incohérence 2 — Nombre de sprints MVP-3

| Source | Nombre | Groupement |
|--------|--------|------------|
| Blueprint Phase 13 | 6 sprints | Groupés par paires (13-14, 15-16, 17-18) |
| ROADMAP.md | 6 sprints | Individuels (13, 14, 15, 16, 17, 18) |

→ Même nombre (6), mais périmètre totalement différent.

## 6. Recommandation

### Option recommandée : Adopter la nouvelle roadmap (ROADMAP.md)

**Arguments :**
1. `docs/ROADMAP.md` est le document le PLUS RÉCENT (25 octobre 2026)
2. Il a été rédigé APRÈS l'implémentation des sprints 1-12, en connaissance de l'état réel
3. Le Sprint 13 "Multi-Projets" est directement supporté par la table `projects` déjà en migration 001
4. La progression Multi-Projets → Timeline → BestPractice → Recommandations → Templates est logique et incrémentale
5. Le blueprint original décrivait un MVP-3 théorique ; la nouvelle roadmap décrit un MVP-3 ancré dans le code existant

**Actions si cette option est choisie :**
1. Créer un ADR actant la redéfinition du MVP-3
2. Mettre à jour `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`
3. Annoter les documents du blueprint comme "périmètre initial, remplacé par ROADMAP.md"
4. Documenter le Sprint 13 selon ROADMAP.md

### Option alternative : Blueprint original

**Arguments :**
1. Cohérence avec les 14 phases de recherche
2. Le workflow 8 étapes est déjà documenté en détail (10_WORKFLOW_CAPITALISATION.md)
3. Le template post-mortem est prêt (10_TEMPLATE_POSTMORTEM_PROJET.md)
4. La capitalisation de projets est la proposition de valeur centrale d'EKTS

**Inconvénient :** La table `projects` en migration 001 serait sous-utilisée (seulement status, dates, metadata — pas le workflow complet).

### Option hybride : Combiner

Intégrer Multi-Projets (Sprint 13) + Suivi Temporel (Sprint 14) du nouveau plan, PUIS reintroduire le workflow de capitalisation dans les sprints 15-18.

## 7. Prochaine étape

**En attente de votre décision sur :**
1. Quel périmètre pour le MVP-3 ?
2. Firebase : attendu, reporté ou abandonné ?

Une fois ces décisions prises, je procèderai à la Phase 2 : préparation documentaire du Sprint 13.

---

*Document créé le 25 octobre 2026 — Phase 1 de l'audit*  
**Statut : ⏸️ EN ATTENTE D'ARBITRAGE**
