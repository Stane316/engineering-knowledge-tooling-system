# EKTS — REGISTRE DES ÉCARTS ET DÉCISIONS OUVERTES

**Date :** 25 octobre 2026  
**Audit :** Phase 1 — Sprints 1 à 12  
**Statut :** ⏸️ En attente d'arbitrage

---

## Écarts bloquants (résolution requise avant Sprint 13)

### EKTS-AUDIT-001 — Redéfinition du périmètre MVP-3

| Champ | Valeur |
|-------|--------|
| **Sprint** | 13-18 (MVP-3) |
| **Exigence initiale** | Workflow 8 étapes capitalisation, post-mortems 10 sections, root cause analysis, dette technique |
| **Source** | `docs/blueprint/07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` §4, `10_WORKFLOW_CAPITALISATION.md`, `10_TEMPLATE_POSTMORTEM_PROJET.md` |
| **État réel** | `docs/ROADMAP.md` définit un MVP-3 différent : Multi-Projets, Suivi Temporel, BestPractice, Recommandations, Templates |
| **Preuve** | Comparaison littérale des deux documents |
| **Type** | Changement de périmètre non tracé dans ADR |
| **Gravité** | 🔴 Bloquant — impossible de documenter Sprint 13 sans savoir quel périmètre suivre |
| **Impact fonctionnel** | Les sprints 13-18 seront entièrement différents selon le périmètre choisi |
| **Impact architectural** | Aucun impact sur le code existant (les deux périmètres réutilisent l'existant) |
| **Options** | 1) Adopter nouvelle roadmap, 2) Retour blueprint original, 3) Combinaison |
| **Décision** | ⚠️ Arbitrage utilisateur requis |

### EKTS-AUDIT-010 — Firebase absent du dépôt

| Champ | Valeur |
|-------|--------|
| **Sprint** | Non identifié |
| **Élément** | "Les éléments liés à Firebase ont également été créés" (directive utilisateur) |
| **État réel** | Aucun fichier Firebase dans le dépôt — 0 import, 0 dépendance, 0 config, 0 doc, 0 test |
| **Preuve** | `grep -ri "firebase" --include="*.ts" --include="*.json"` → 4 résultats dans docs/blueprint/Docs/Référence/dri/ (catalogues de ressources, pas code) |
| **Type** | Élément attendu non trouvé |
| **Gravité** | 🟡 Important — attente potentielle non satisfaite |
| **Options** | 1) Firebase non pertinent pour EKTS, 2) Firebase reporté, 3) Firebase remplacé par SQLite |
| **Décision** | ⚠️ Clarification utilisateur requise |

---

## Écarts importants (décisions validées, documentées)

### EKTS-AUDIT-002 — Node.js 22.19+ au lieu de 20+

| Champ | Valeur |
|-------|--------|
| **Sprint** | 1 (baseline) |
| **Spécification initiale** | Node.js 20+ (SPRINT-01.md) |
| **État réel** | Node.js ≥ 22.19.0 (package.json engines, ADR-011) |
| **Justification** | Vitest 5 requiert Node 22+, toolchain plus récente, ADR-011 |
| **Statut** | ✅ Décision validée et documentée |
| **Action** | Aucune — mise à jour du blueprint recommandée pour aligner |

### EKTS-AUDIT-003 — SDK MCP 1.32.x au lieu de "v2"

| Champ | Valeur |
|-------|--------|
| **Sprint** | 6 |
| **Spécification initiale** | "@modelcontextprotocol/sdk v2" (blueprint, ADR-002) |
| **État réel** | @modelcontextprotocol/sdk@1.32.1 (aucune v2 publiée) |
| **Justification** | La v2 n'existe pas, la v1.32.x est la version stable |
| **Statut** | ✅ Correction documentée dans AGENTS.md §4 |
| **Action** | Aucune — mise à jour de l'ADR-002 recommandée |

### EKTS-AUDIT-004 — Sprint 4.5 hors plan

| Champ | Valeur |
|-------|--------|
| **Sprint** | 4.5 (ajouté entre Sprint 4 et Sprint 5) |
| **Spécification initiale** | Non prévu dans la roadmap Phase 13 |
| **État réel** | Système multi-fournisseurs complet (14 fournisseurs, rotation clés, politiques quality/free/cost, providers.custom.json) |
| **Justification** | Ajout à la demande de l'utilisateur pour multiplication des clés API |
| **Statut** | ✅ Validé, documenté dans REGISTRE-AVANCEMENT.md |
| **Impact** | 391 tests ajoutés, ADR-015 à ADR-018, guide PROVIDERS.md |
| **Action** | Documenter dans ADR formel recommandé |

---

## Écarts mineurs (extensions documentées)

### EKTS-AUDIT-005 — CLI 10 commandes (au lieu de 7)

| Champ | Valeur |
|-------|--------|
| **Sprint** | 5, 11 |
| **Spécification** | 7 commandes (init, add, search, get, list, delete, status) |
| **État réel** | 10 commandes (+reindex, +inspect, +audit avec sous-commandes) |
| **Statut** | ✅ Extension documentée, validée |
| **Action** | Aucune |

### EKTS-AUDIT-006 — MCP 7 outils (au lieu de 4)

| Champ | Valeur |
|-------|--------|
| **Sprint** | 6, 11 |
| **Spécification** | 4 outils (search_knowledge, get_resource, list_resources, validate_resource) |
| **État réel** | 7 outils (+inspect_site, +audit_history, +audit_report) |
| **Statut** | ✅ Extension documentée, validée |
| **Action** | Aucune |

### EKTS-AUDIT-007 — L4 (crawling) hors périmètre

| Champ | Valeur |
|-------|--------|
| **Sprint** | 8 |
| **Spécification** | 4 niveaux d'inspection L1-L4 |
| **État réel** | 3 niveaux L1-L3, L4 reporté (décision explicite, `types.ts:33`) |
| **Statut** | ✅ Report documenté dans MVP2_VALIDATION.md |
| **Action** | Aucune |

### EKTS-AUDIT-008 — Puppeteer pour génération PDF

| Champ | Valeur |
|-------|--------|
| **Sprint** | 11 |
| **Spécification** | Pas de génération PDF prévue initialement |
| **État réel** | Puppeteer 25 ajouté pour génération PDF |
| **Statut** | ✅ Décision technique documentée dans CHANGELOG.md |
| **Action** | Aucune |

### EKTS-AUDIT-009 — Table `projects` anticipée dans migration 001

| Champ | Valeur |
|-------|--------|
| **Sprint** | 2 (anticipation Sprint 13) |
| **Spécification** | Table projects non prévue dans migration 001 |
| **État réel** | Table `projects` (id, name, description, status, started_at, completed_at, metadata, timestamps) créée dans migration 001 |
| **Statut** | ✅ Anticipation cohérente avec le Sprint 13 de la nouvelle roadmap |
| **Action** | Aucune |

### EKTS-AUDIT-011 — Doublons REGISTRE-AVANCEMENT.md

| Champ | Valeur |
|-------|--------|
| **Fichier** | `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` |
| **Constat** | Sprints 9-12 listés deux fois dans §3 (une fois ✅, une fois ⏳) |
| **Statut** | 🟢 Problème documentaire mineur |
| **Correction** | Supprimer les doublons (deuxième occurrence ⏳) |
| **Action** | Prompt de correction fourni |

---

## Résumé par priorité

| Priorité | Nombre | IDs | Action requise |
|----------|--------|-----|----------------|
| 🔴 Bloquant | 2 | 001, 010 | Arbitrage utilisateur |
| 🟡 Important (validé) | 3 | 002, 003, 004 | Mise à jour documentaire recommandée |
| 🟢 Mineur | 6 | 005-009, 011 | Aucune ou nettoyage |

---

*Registre créé le 25 octobre 2026 — Phase 1 de l'audit*
