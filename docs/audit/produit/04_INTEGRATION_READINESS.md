# 04 — État d'intégrabilité (autonome, CLI, MCP, agents)

> Verdicts utilisés : **OUI** (disponible + preuve d'exécution) ·
> **PARTIEL** (marche sous conditions, morceaux prouvés) · **NON** (absent ou
> invocable). Chaque verdict cite ses preuves (`EV-xx`, `09`).

---

## A. Utilisation autonome (humain seul, sans agent) — ✅ OUI

**Verdict : disponible**, sous réserve des prérequis documentés.

| Élément | État | Preuve |
|---|---|---|
| Prérequis connus et vérifiables | `check:env`, `doctor`, `doctor:browsers`, `browsers:install` | EV-25, EV-32 |
| Parcours clone → build → init | documenté (`docs/guides/SETUP.md`, USER_GUIDE §Installation) et **exécuté** dans l'audit (`npm ci`→`build`→`init` isolé) | EV-08 |
| Entrée fournie | `ekts inspect <url>` / `ekts add …` / `ekts search …` | EV-07, EV-08 |
| Récupération des sorties | tables lisibles, `--json`, fichiers rapports MD/PDF | EV-08, CAP-16/17 |
| Compréhension de ce qui s'est passé | codes 0–4 documentés, messages d'erreur FR structurés (`VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`) | EV-09 |
| **Résidu** | Aucun « runbook premier projet » unique validé comme tel (voir `05`) ; doc d'entrée périmée (LIM-07) | `06` GAP-04 |

**Ce qui manque pour un NON→OUI définitif** : rien de technique — un
parcours consolidé exécuté proprement (CH-P0-1) et la réconciliation README
(CH-P0-2).

---

## B. CLI — ✅ OUI (verdict le plus solide du produit)

**Verdict : utilisable comme véritable interface en ligne de commande.**

| Critère | Constat | Preuve |
|---|---|---|
| Commande exécutable | `bin: ekts` → `dist/cli/index.js` ; `npm run cli` | EV-07 |
| Installation/lancement | clone + `npm ci` + `build` **uniquement** (pas de `-g`) | EV-14 |
| Commandes/options réelles | **15 commandes racine**, alias `bp/rec/tpl`, sous-commandes (`audit list\|show\|report\|compare`, `timeline analyze\|trends\|alerts\|chart`…) | EV-07 |
| Aide intégrée | `--help` par commande, messages d'erreur avec suggestion `(ajoutez --help…)` | EV-09 |
| Sorties lisibles | tables colorées (chalk) **et** `--json` global (contrats JSON stables : `query/mode/count/elapsedMs/results`, enveloppe `error.code`) | EV-08, EV-09 |
| Codes de sortie | **0** succès · **2** usage invalide · **3** ressource introuvable · **4** validation — **vérifiés en exécution** (le 1 = refus utilisateur est testé en tests maison, non rejoué ici) | EV-09 |
| Config et secrets | `.env` (ignoré), `EKTS_DATA_DIR` pour bases isolées | EV-16, EV-08 |
| Comportement automatisable | `--json` + codes = scriptable ; `jq` cité dans l'aide | EV-07 |
| Compatibilité agents/scripts | utilisable comme outil shell par un agent (spawn) — c'est d'ailleurs ce que font les E2E (10 spawns CLI/run) | EV-21, EV-24 |
| Stabilité interface | contrat versionné par semver (0.2.0) + 14 fichiers de tests CLI + E2E | EV-21 |
| Installation/mise à jour | **lacune** : `git pull` + rebuild ; pas de canal de version installable | LIM-01 |

**Réserves** : LIM-01 (distribution), LIM-07 (doc d'entrée).
**Conclusion** : **CLI = OUI**, c'est la porte d'entrée la plus fiable pour
un premier usage.

---

## C. MCP — Model Context Protocol

### C.1 EKTS comme serveur MCP (émission) — ✅ OUI pour la surface « connaissance » · 🟠 PARTIEL pour la surface « navigateur »

**Preuves d'exécution pendant l'audit (pas seulement de la documentation) :**

| Étape | Résultat | Preuve |
|---|---|---|
| Démarrage serveur stdio | OK — log `Serveur MCP EKTS démarré`, transport stdio, dataDir local | EV-04 |
| `initialize` | `serverInfo {name: ekts, version: 0.2.0}`, `protocolVersion 2025-11-25` | EV-04, EV-19 |
| `tools/list` | **17 outils** avec `name` + `inputSchema` (props typées) | EV-04 |
| `tools/call` succès | `list_templates` → JSON `{count, templates[…], …}` | EV-05 |
| `tools/call` erreur | `get_resource` invalide → `isError:true`, `code -32000`, `data` contextualisé | EV-06 |
| Sorties `stderr`/`stdout` | journal sur stderr, protocole sur stdout (pratique conforme) | EV-04 |
| Transport/arrêt | stdio = arrêt par fermeture du pipe (exécution propre, EXIT 0) | EV-04 |
| Permissions/origine | bases locales ; aucune auth serveur (outil solo local) — choix cohérent avec le périmètre | `[CODE]` |
| Installation côté client | `.mcp.json` prêt (commande + args) | EV-13 |
| **Validation client réel (hôte)** | **NON faite** : aucun Claude Code/VSCode/Cursor instrumenté pendant l'audit ; `MCP-EXAMPLES.md` = documentation de sorties réelles, pas test d'hôte | EV-15, NV-3 |
| Surface navigateur `browser_*` | **NON lançable** : pas de point d'entrée (LIM-03) | EV-27 |

**Écarts/blocages exacts (C.1)** :
1. Câblage du serveur navigateur (LIM-03) — si la capacité est désirée.
2. Test d'un hôte réel (LIM-03b) — condition du verdict « produit intégrable »
   pour un agent.
3. Veille `protocolVersion` (LIM-08) — léger.

### C.2 EKTS consommant des MCP externes — ❌ NON (non pertinent aujourd'hui)

- **Constat** : aucun client MCP sortant dans `src/` (EV-26b). EKTS
  n'appelle ni `npx @playwright/mcp`, ni aucun serveur tiers.
- **Lecture produit** : **ce n'est pas un manque** pour le périmètre actuel
  (EKTS porte lui-même son navigateur et ses outils). Ce serait pertinent
  seulement si l'on décidait de **réutiliser un MCP externe** plutôt que la
  surface maison (option étudiée dans `06` GAP-03 et DEC-03).

### C.3 EKTS piloté par agent via sa CLI — ✅ OUI (de fait)

- Spawn de `node dist/cli` avec `--json` = pattern **prouvé** par les E2E
  eux-mêmes (les tests exécutent la CLI compilée comme le ferait un agent :
  spawns réels, codes de sortie vérifiés) — EV-21, EV-24.
- Aucune dépendance à MCP pour ce mode : un agent avec un shell suffit.

### C.4 Fonctions internes « exposables » — 🟡 OUI, partiellement déjà exposées

- Exposées : CLI (15) + MCP connaissance (17) — recouvrement volontaire des
  deux surfaces.
- Non exposées mais existantes : serveur navigateur (LIM-03), internals
  `src/business/*` sans contrat public (LIM-02).

---

## D. API / bibliothèque / intégration programmatique — ❌ NON (choix non tranché)

- Pas d'`exports` npm, paquet non publié (EV-14, LIM-02).
- Contrats d'entrée/sortie **documentés côté CLI/MCP** (API_REFERENCE : 17
  outils MCP) mais **pas côté librairie TypeScript**.
- **Conséquence** : l'intégration « encastrer EKTS dans un logiciel tiers »
  n'est pas possible aujourd'hui ; l'intégration « piloter EKTS » l'est
  (CLI/MCP). Décision DEC-02.

---

## E. Agents et écosystèmes d'agents — 🟡 PARTIEL (matrice détaillée)

| Capacité d'agent | État aujourd'hui | Preuve / manque |
|---|---|---|
| Découvrir les capacités | ✅ `tools/list` 17/17 documenté + instructions handshake | EV-04 |
| Choisir un outil pertinent | ✅ descriptions FR + schémas Zod par outil | EV-04 |
| Fournir les paramètres | ✅ validation à l'appel (erreur structurée si invalide) | EV-06 |
| Exécuter une opération | ✅ appel réel `list_templates` | EV-05 |
| Récupérer/interpréter le résultat | ✅ JSON stable + erreurs typées (`error.code`) | EV-05, EV-06 |
| Enchaîner plusieurs opérations | 🟡 au protocole oui (stateless côté serveur, bases persistantes) ; **non démontré en chaîne multi-appels pilotée par un vrai hôte** | NV-3 |
| Détecter un échec | ✅ `isError` + codes métier + codes CLI | EV-06, EV-09 |
| Reprendre/corriger | 🟡 partiel : ré-exécution sûre sur bases persistantes (`init` idempotent, suppressions confirmées) ; **pas de reprise guidée** (pas de journal d'opération à rejouer) | `[CODE]` — pas de mécanisme de workflow |
| Vérifier la qualité du résultat | 🟡 l'agent reçoit des scores/constats mais **aucun signal de justesse** (LIM-12) ; un humain doit juger | EV-31 |
| Sécurité pour agent | ✅ garde-fous URL/chemins testés sur la surface navigateur (CAP-47) ; secrets hors portée MCP (env serveur) | EV-27, EV-29 |

**Verdict E** : **un agent MCP peut aujourd'hui piloter EKTS de bout en
bout au protocole** ; ce qui manque pour « écosystème d'agents fiable » =
(1) validation sur hôte réel (CH-P1-3), (2) chaînage démontré (3 appels
liés dans le scénario `05`), (3) si besoin, surface navigateur câblée.

---

## F. Déploiement et exécution en environnement cible — 🟡 PARTIEL

| Dimension | État |
|---|---|
| Cible réelle | poste dev Windows/macOS/Linux, Node ≥ 22.19, **local only** (aucun conteneur/service) |
| Installation | clone + `npm ci` + build (LIM-01) ; `.npmrc ignore-scripts=true` (install sans natives — point bien pensé, à vérifier au premier `npm ci` — fait avec succès ici et chez l'utilisateur : EV-08, EV-25) |
| Configuration | `.env` + `EKTS_DATA_DIR` + `.mcp.json` — documentés |
| Exécution | processus éphémère CLI ou serveur stdio adossé à un hôte |
| Diagnostic | `doctor*`, `check:env`, logs pino JSON |
| Sauvegarde des données | **non documentée** = copier `data/*.db` (hors périmètre actuel — note opérationnelle, P2 doc) |
| Versionnement | semver + changelog, pas de canal d'upgrade (LIM-01) |

---

## Scénario minimal d'intégration (acceptation de bout en bout)

> **Objectif** : prouver « un agent pilote EKTS depuis zéro ».

1. Prérequis : Node ≥ 22.19 ; `npm ci && npm run build` → EXIT 0.
2. Client MCP (hôte réel) configuré avec `.mcp.json` **ou** `npx
   @modelcontextprotocol/inspector node dist/mcp/server.js`.
3. Handshake : `tools/list` affiche **17** outils.
4. Appel 1 `create_project {"name":"essai"}` → `project_id` UUID.
5. Appel 2 `list_templates {"limit":3}` → `count ≥ 1`.
6. Appel 3 `search_knowledge {"query":"…","mode":"fts"}` → `count ≥ 0`, JSON
   conforme (schéma `query/mode/count/results`).
7. Appel volontaire invalide → `isError: true` + `code` présent.
8. Hôte affiche les résultats à l'utilisateur sans erreur de protocole.

**Critères de validation** : étapes 1–7 = 0 erreur de protocole ; 8 = obtenu
**sur au moins un hôte réel** (Claude Code ou équivalent) avec capture
d'écran/log conservés comme preuve.
**Temps estimé** : 1 h si l'hôte est déjà installé côté utilisateur.
**Blocage actuel** : aucun technique ; **organisationnel** (exécution à faire
— CH-P1-3).
