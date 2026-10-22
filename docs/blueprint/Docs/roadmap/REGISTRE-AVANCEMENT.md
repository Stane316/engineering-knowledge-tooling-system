# Registre d'avancement — EKTS

**Statut :** ✅ Actif  
**Date de création :** 21 octobre 2026  
**Dernière mise à jour :** 22 octobre 2026 — Sprint 1 (setup projet)  
**Emplacement :** `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`  
**Source de vérité :** ce registre + les dossiers `Docs/roadmap/sprints/`

---

## 1. Rôle du registre

Ce registre est la **source de vérité unique** de l'avancement. Il remplace les statuts dispersés dans les 48 dossiers de sprint.

**Règles :**

1. Un dossier de sprint ne peut pas être « ✅ Validé » sans ligne correspondante mise à jour ici.
2. Toute mise à jour de statut doit citer le commit et la date.
3. La documentation et l'implémentation sont suivies **séparément** : un sprint peut être documenté sans être implémenté.
4. Les statuts autorisés sont ceux du prompt de transfert (§Workflow) : ⏳, 🔄, 🚫, ✅, 🧪, ❌, ⏸️, 📄.

### 1.1 Légende

| Symbole | Signification |
|---------|---------------|
| ⏳ | Non commencé |
| 🔄 | En cours |
| 🚫 | Bloqué |
| 🧪 | Tests en cours |
| ❌ | Tests échoués |
| ⏸️ | En attente de validation utilisateur |
| ✅ | Implémentation réalisée / validée |
| 📄 | Documentation uniquement |

---

## 2. Vue d'ensemble

| Périmètre | Sprints | Documentation | Implémentation | Tests |
|-----------|---------|---------------|----------------|-------|
| **MVP-1** — Bibliothèque, recherche, CLI, MCP | 1 à 6 | ✅ 24 dossiers | 🟡 Sprint 1 terminé | ✅ |
| **MVP-2** — Inspection navigateur | 7 à 12 | ✅ 24 dossiers | ⏳ | — |
| **MVP-3** — Capitalisation projets | 13 à 18 | ⏳ non documentés | ⏳ | — |

**Total documenté :** 48 dossiers de sprint (43 369 lignes) ; **implémenté :** Sprint 1 (2 400+ lignes de code, tests et documentation) au 22 octobre 2026.

---

## 3. Détail par sprint

| Sprint | Sous-sprint | Sujet | Documentation | Implémentation | Tests |
|--------|-------------|-------|---------------|----------------|-------|
| Sprint 1 | 1-1 | Initialisation TypeScript + outils qualité | ✅ Rédigée | ✅ `363b7b8` | ✅ 3 tests, 100 % |
| Sprint 1 | 1-2 | Structure dossiers + dépendances | ✅ Rédigée | ✅ `9c96f2a` | ✅ 8 tests, 100 % |
| Sprint 1 | 1-3 | Gitleaks + README + CI | ✅ Rédigée | ✅ `Sprint 1-3` | ✅ CI + hook |
| Sprint 1 | Dossier parent | Setup projet | ✅ Rédigée | ⏸️ En attente de validation | ✅ |
| Sprint 2 | 2-1 | Schémas SQLite (3 bases) | ✅ Rédigée | ⏳ | — |
| Sprint 2 | 2-2 | Repository Resource + tests | ✅ Rédigée | ⏳ | — |
| Sprint 2 | 2-3 | Validation Zod + documentation | ✅ Rédigée | ⏳ | — |
| Sprint 2 | Dossier parent | Data Layer (SQLite) | ✅ Rédigée | ⏳ | — |
| Sprint 3 | 3-1 | Knowledge Manager CRUD (add, get, list) | ✅ Rédigée | ⏳ | — |
| Sprint 3 | 3-2 | Knowledge Manager CRUD suite (update, delete) + tests complets | ✅ Rédigée | ⏳ | — |
| Sprint 3 | 3-3 | Indexation FTS automatique + documentation | ✅ Rédigée | ⏳ | — |
| Sprint 3 | Dossier parent | Knowledge Manager (Semaine 5-6) | ✅ Rédigée | ⏳ | — |
| Sprint 4 | 4-1 | Recherche FTS5 (BM25) + Vectorielle (sqlite-vec) | ✅ Rédigée | ⏳ | — |
| Sprint 4 | 4-2 | Génération embeddings (OpenAI) + indexation vectorielle | ✅ Rédigée | ⏳ | — |
| Sprint 4 | 4-3 | Fusion RRF + benchmarks + documentation | ✅ Rédigée | ⏳ | — |
| Sprint 4 | Dossier parent | Search Engine (Semaine 7-8) | ✅ Rédigée | ⏳ | — |
| Sprint 5 | 5-1 | Commandes de base (init, add, get) | ✅ Rédigée | ⏳ | — |
| Sprint 5 | 5-2 | Commandes de recherche et gestion (search, list, delete) | ✅ Rédigée | ⏳ | — |
| Sprint 5 | 5-3 | Commande status + tests intégration + documentation | ✅ Rédigée | ⏳ | — |
| Sprint 5 | Dossier parent | CLI (Semaine 9-10) | ✅ Rédigée | ⏳ | — |
| Sprint 6 | 6-1 | Setup MCP Server + stdio transport | ✅ Rédigée | ⏳ | — |
| Sprint 6 | 6-2 | Implémentation des 4 outils MCP | ✅ Rédigée | ⏳ | — |
| Sprint 6 | 6-3 | Tests compatibilité agents + documentation | ✅ Rédigée | ⏳ | — |
| Sprint 6 | Dossier parent | MCP Server | ✅ Rédigée | ⏳ | — |
| Sprint 7 | 7-1 | Installation Playwright + Configuration | ✅ Rédigée | ⏳ | — |
| Sprint 7 | 7-2 | Playwright MCP + Navigation basique | ✅ Rédigée | ⏳ | — |
| Sprint 7 | 7-3 | Accessibility Tree + Tests + Documentation | ✅ Rédigée | ⏳ | — |
| Sprint 7 | Dossier parent | Playwright Setup (Semaine 13-14) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | 8-1 | Types + Inspection L1 (Semaine 15) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | 8-2 | Lighthouse + Inspection L2 (Semaine 15-16) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | 8-3 | axe-core + Inspection L3 + Tests + Documentation (Semaine 16) | ✅ Rédigée | ⏳ | — |
| Sprint 8 | Dossier parent | 4 Niveaux d'Inspection (Semaine 15-16) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | 9-1 | Analyse Performance + Accessibilité (Semaine 17) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | 9-2 | Analyse SEO + UX + Contenu (Semaine 17-18) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | 9-3 | Matrice Sévérité + Priorisation + Tests + Documentation (Semaine 18) | ✅ Rédigée | ⏳ | — |
| Sprint 9 | Dossier parent | Analyse 5 Dimensions (Semaine 17-18) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | 10-1 | Schema + Repository (Semaine 19, Jours 1-4) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | 10-2 | Indexation + Recherche (Semaine 19, Jours 5-7) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | 10-3 | Statistiques + Tests + Documentation (Semaine 20, Jours 8-10) | ✅ Rédigée | ⏳ | — |
| Sprint 10 | Dossier parent | Stockage + Indexation (MVP-2) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | 11-1 | Rapports Markdown + PDF (Semaine 21, Jours 1-4) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | 11-2 | Comparaison d'audits (Semaine 21, Jours 5-7) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | 11-3 | CLI + MCP + Tests + Documentation (Semaine 22, Jours 8-10) | ✅ Rédigée | ⏳ | — |
| Sprint 11 | Dossier parent | Rapport Inspection (MVP-2) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | 12-1 | Tests E2E (Semaine 23, Jours 1-4) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | 12-2 | Documentation (Semaine 23, Jours 5-7) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | 12-3 | Validation MVP-2 + Préparation MVP-3 (Semaine 24, Jours 8-10) | ✅ Rédigée | ⏳ | — |
| Sprint 12 | Dossier parent | Tests + Documentation MVP-2 | ✅ Rédigée | ⏳ | — |

---

## 4. Journal des mises à jour

| Date | Événement | Commit |
|------|-----------|--------|
| 21/10/2026 | Création du registre ; 48 dossiers normalisés en `⏳ NON COMMENCÉ` (documentation ✅) | `Sprint 0` |
| 22/10/2026 | Sprint 1-1 : TypeScript 5.9, ESLint 10 (flat config), Prettier 3, Vitest 5 + couverture v8 | `363b7b8` |
| 22/10/2026 | Sprint 1-2 : arborescence `src/`, dépendances runtime (better-sqlite3, commander, zod, pino), configuration et logger typés | `9c96f2a` |
| 22/10/2026 | Sprint 1-3 : Gitleaks + hook pre-commit, CI GitHub Actions, `SETUP.md`, README définitif | `Sprint 1-3` |

---

## 5. Prochaines étapes

1. **Sprint 1 terminé** — en attente de validation utilisateur (⏸️) avant le Sprint 2.
2. **Sprint 2** — Data Layer SQLite : schémas des 3 bases, repository `Resource`, validation Zod.
3. Mise à jour de ce registre à la fin de chaque sous-sprint (statut + commit).
4. Validation utilisateur avant passage au Sprint 3.
