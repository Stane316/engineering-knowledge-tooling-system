# 08 — Critères d'acceptation (produit « réellement utilisable »)

> Chaque critère est **testable**, a un **résultat attendu explicite** et une
> **preuve** (exécution ou document). §A = obligatoire pour la première
> utilisation (« Version d'usage ») · §B = obligatoire pour une diffusion
> plus large. Les 12 conditions générales de la mission (§6) sont couvertes
> par C1→C12 ci-dessous.

## A. Critères obligatoires — première utilisation réelle

| ID | Domaine | Critère | Résultat attendu | Preuve / mode de test | État au 26/10 |
|---|---|---|---|---|---|
| **C1** | Objectif & scénario | Le scénario principal est écrit et accepté | Runbook `05` exists, propriétaire lu | `05` | ✅ (document) / ⏳ validation humaine |
| **C2** | Prérequis | Prérequis connus, vérifiables en 1 commande | `check:env` = 0 sur poste cible | EV-25, EV-32 | ✅ |
| **C3** | Lancement | Le produit démarre dans un environnement identifié | `init` + `--help` = 0 (Node ≥ 22.19) | EV-07, EV-08 | ✅ |
| **C4** | Entrées | L'utilisateur/agent fournit les entrées attendues (URL, requête, projet) | types validés, erreurs 4 actionnables | EV-06, EV-09 | ✅ |
| **C5** | Parcours | Le parcours prévu s'exécute sans manipulation cachée | 11/11 étapes `05` | PV CH-P0-1 **à produire** | ❌ **à faire (P0)** |
| **C6** | Sorties | Sorties récupérables et interprétables | MD/PDF présents non vides, JSON conforme | EV-08 (JSON), CAP-16/17 | 🟡 (morceaux prouvés, réuni au PV) |
| **C7** | Qualité | Le résultat respecte Q1–Q7 (`05` §5) | ≥ seuils : 5/5 sections, score 0–100, ≥2/3 constats utiles, delta cohérent | Q3 = jugement humain ; le reste mesurable | ❌ **à mesurer (P0)** |
| **C8** | Erreurs | Erreurs principales détectables et compréhensibles | codes 1/2/3/4 + messages FR + enveloppe JSON | EV-09 (2/3/4 ✅ ; 1 à rejouer — GAP-09) | 🟡 |
| **C9** | Interventions humaines | Listées explicitement | `05` §2 (choix URL, corrections, jugement) | `05` | ✅ (documenté) |
| **C10** | Intégration requise | L'intégration choisie (CLI **ou** MCP) testée de bout en bout | CLI : EV-08 ✅ · MCP : scénario `04` PV **à produire** (hôte réel) | EV-08 ✅ / CH-P1-2 ❌ | 🟡 CLI ✅ · MCP ❌ (P1) |
| **C11** | Limites connues | Limites restantes listées et acceptées pour le scénario | `03` relu et assumé (aucune 🔴 active sur le scénario) | `03` + CH-P0-2 (LIM-07 levée) | ⏳ (P0) |
| **C12** | Aucun blocage critique | Aucune 🔴 non traitée | LIM-07 clôturée ; autres 🔴 = aucune constatée | `03` | ❌ → P0 |

**Lecture honnête de la colonne « État »** : **sur 12, 7 sont ✅/🟡 solides
(produit), 4 dépendent de P0 (runbook + docs) et 1 de P1 (hôte réel MCP).
Aucun critère n'est irréalisable avec l'existant** — c'est ce qui justifie
le classement « MVP utilisable sur un premier projet = à confirmer par
exécution » (00 §6), ni plus ni moins.

## B. Critères — diffusion plus large (au-delà de la version d'usage)

| ID | Domaine | Critère | Résultat attendu |
|---|---|---|---|
| **B1** | Installation | `npm install -g ekts` (ou alternative tranchée DEC-01) | `ekts --version` = dernière release |
| **B2** | Mise à jour | Passage d'une version à l'autre sans perte de données | migrations 001→00n automatiques sur copie de backup |
| **B3** | Justesse | Jeu d'or 5–10 pages en CI | 100 % attentes (CH-P2-1) |
| **B4** | Fiabilité longue durée | 3 exécutions consécutives du runbook sans flaky | 3/3 verts |
| **B5** | Concurrence | Comportement mult-processus défini | test vert OU doc « non supporté » (GAP-11) |
| **B6** | Sauvegarde | Procédure restore testée à froid | GAP-10 clôturé |
| **B7** | Sécurité | Gitleaks CI + audit deps + garde-fous MCP | maintien des verts actuels (EV-29) + revue des URL autorisées |
| **B8** | Documentation | Aucune version/statut périmé | grep de cohérence vide (README, USER_GUIDE, ROADMAP, CHANGELOG) |
| **B9** | Observabilité | Diagnostic d'incident réalisable | `doctor*` + logs suffisants (LIM-09 traité) |
| **B10** | Écosystème agent | ≥ 2 hœtes validés (ex. Claude Code + inspector) | 2 PV |

## C. Critères spécifiques par intégration

| Intégration | Critère minimal | État |
|---|---|---|
| **CLI** | 15 commandes listées ; `--json` + codes 0/2/3/4 vus ; aide FR | ✅ EV-07/08/09 |
| **MCP connaissance** | handshake + 17 tools + 1 call succès + 1 call erreur sur **hôte** | 🟡 audit ✅ / hôte ❌ (NV-3) |
| **MCP navigateur** | commande de lancement + 5 outils ou abandon écrit | ❌ LIM-03 (DEC-03) |
| **API/librairie** | `exports` + contrat versionné OU refus assumé (DEC-02) | ❌ à décider |
| **Agent via CLI** | spawn shell + `--json` = pattern E2E | ✅ EV-21/24 |

## D. Comment vérifier (ordre recommandé)

1. `npm run check:env` → 0 · 2. `npm run doctor` → 0 ·
3. `npm run doctor:browsers` → 0 (repli Firefox accepté) ·
4. `npm run verify` → 0 (5 sections) ·
5. Exécution `05` §4 → PV · 6. Scénario `04` (MCP) → PV ·
7. Relectures humaines Q3 + C11.
