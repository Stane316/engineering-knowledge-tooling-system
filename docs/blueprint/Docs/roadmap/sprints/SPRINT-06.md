# SPRINT-06 — MCP Server

**Version :** 1.0  
**Date création :** 2026-10-21  
**Statut :** ✅ LIVRÉ (23 octobre 2026)  
**Addendum du 21 octobre 2026 :** le SDK MCP n'existe qu'en ligne 1.x (dernière version : **1.32.1**) ; la cible « v2 » est remplacée par `^1.32` et suivie en veille (ADR-011, ADR-V04).
**Bilan de livraison :** 4 outils exposés via `McpServer` + `StdioServerTransport`, protocole négocié `2025-11-25` (la version « 2026-07-28 » du dossier n'existe pas), 99 tests MCP, écarts E6-1 à E6-7 documentés dans `docs/MCP.md` §12 (ADR-022).

---

## 1. Contexte

Le **Sprint 5** a livré une CLI complète avec 7 commandes (init, add, search, get, list, delete, status). L'interface en ligne de commande permet aux utilisateurs humains d'interagir avec EKTS.

Le **Sprint 6** va étendre cette capacité aux **agents IA** via le protocole MCP (Model Context Protocol). MCP est un standard ouvert (Linux Foundation) qui permet aux agents IA (Claude Code, Cursor, GitHub Copilot, etc.) d'accéder à des outils externes de manière sécurisée et standardisée.

**Problème actuel :** Les agents IA ne peuvent pas accéder directement aux ressources EKTS. Ils doivent passer par la CLI ou lire les fichiers de base de données directement, ce qui n'est pas standardisé et pose des problèmes de sécurité.

**Solution :** Implémenter un serveur MCP qui expose 4 outils prioritaires via transport stdio, permettant aux agents Tier 1 d'interagir avec EKTS de manière native.

---

## 2. Objectifs

### 2.1 Objectif principal

Implémenter un serveur MCP conforme à la spécification **MCP 2026-07-28** (stateless) utilisant le SDK **@modelcontextprotocol/sdk 1.32.x** avec transport **stdio**.

### 2.2 Objectifs fonctionnels

Exposer 4 outils MCP MVP-1 :

| Outil | Rôle | Entrées | Sorties |
|-------|------|---------|---------|
| `search_knowledge` | Recherche hybride (FTS + Vector + RRF) | `query: string`, `limit?: number`, `mode?: 'hybrid'\|'fts'\|'vector'` | `results: SearchResult[]` |
| `get_resource` | Obtenir une ressource par ID | `id: string` | `resource: Resource \| null` |
| `list_resources` | Lister les ressources avec filtres | `filters?: { type?, tags?, limit? }` | `resources: Resource[]` |
| `validate_resource` | Valider un schéma de ressource | `data: unknown` | `{ valid: boolean, errors?: string[] }` |

### 2.3 Objectifs techniques

- ✅ Transport stdio (local, sécurisé, pas de serveur HTTP)
- ✅ Spécification MCP 2026-07-28 (stateless, pas de session tracking)
- ✅ Compatible Tier 1 agents : Claude Code, Cursor, GitHub Copilot
- ✅ Tests d'intégration avec au moins 2 agents Tier 1
- ✅ Documentation complète (configuration agents, exemples d'utilisation)
- ✅ Gestion erreurs robuste (codes erreur MCP standardisés)
- ✅ Logging structuré (niveau debug/info/error)

### 2.4 Objectifs qualité

- ✅ Couverture tests > 80%
- ✅ TypeScript strict mode
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Pas de dépendances non nécessaires
- ✅ Code review par utilisateur avant merge

---

## 3. Périmètre

### 3.1 Inclus (In-Scope)

| Élément | Description |
|---------|-------------|
| MCP Server | Serveur MCP avec transport stdio |
| 4 outils MCP | search_knowledge, get_resource, list_resources, validate_resource |
| Transport stdio | Communication via stdin/stdout (JSON-RPC 2.0) |
| Tests unitaires | Tests pour chaque outil et le serveur |
| Tests d'intégration | Tests avec agents IA réels (Claude Code, Cursor) |
| Documentation | Configuration agents, exemples, troubleshooting |
| Gestion erreurs | Codes erreur MCP standardisés |
| Logging | Logs structurés (debug/info/error) |

### 3.2 Exclu (Out-of-Scope)

| Élément | Raison |
|---------|--------|
| Transport HTTP/SSE | MVP-1 utilise uniquement stdio (plus simple, plus sécurisé) |
| Authentification OAuth | MCP stateless n'utilise pas d'authentification (transport stdio local) |
| Outils MVP-2 (inspect_site) | Reporté au Sprint 7 (MVP-2) |
| Outils MVP-3 (capitalize_project) | Reporté au Sprint 13 (MVP-3) |
| Resources MCP (lecture/écriture fichiers) | Non nécessaire pour MVP-1 |
| Prompts MCP (templates) | Optionnel, reporté si temps |
| Interface graphique | EKTS n'a pas d'interface graphique |

### 3.3 Hypothèses

- ✅ Les agents Tier 1 (Claude Code, Cursor, GitHub Copilot) supportent MCP 2026-07-28
- ✅ Le SDK @modelcontextprotocol/sdk 1.32.x est stable et bien documenté
- ✅ Le transport stdio est suffisant pour MVP-1 (pas besoin de HTTP/SSE)
- ✅ Les utilisateurs ont accès à au moins un agent Tier 1 pour les tests
- ✅ Les bases de données SQLite sont déjà créées (Sprint 2)

### 3.4 Contraintes

- ✅ Pas de serveur HTTP (transport stdio uniquement)
- ✅ Pas de session tracking (MCP stateless)
- ✅ Pas d'authentification (transport local sécurisé)
- ✅ Compatible avec MCP 2026-07-28 (pas de fonctionnalités obsolètes)
- ✅ Tests avec au moins 2 agents Tier 1 différents

---

## 4. Prérequis

### 4.1 Prérequis techniques

| Prérequis | Version | Vérification |
|-----------|---------|--------------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 9.x | `npm --version` |
| TypeScript | ≥ 5.0 | `npx tsc --version` |
| Git | ≥ 2.30 | `git --version` |
| Sprint 5 terminé | ✅ | CLI fonctionnelle avec 7 commandes |

### 4.2 Prérequis fonctionnels

| Prérequis | Vérification |
|-----------|--------------|
| Bases de données créées | `data/ekts.db`, `data/ekts-fts.db`, `data/ekts-vectors.db` existent |
| Ressources indexées | Au moins 10 ressources avec embeddings générés |
| Search Engine fonctionnel | `ekts search "test"` retourne des résultats |
| Knowledge Manager fonctionnel | `ekts get <id>` retourne une ressource |

### 4.3 Prérequis agents IA

| Agent | Version | Installation |
|-------|---------|--------------|
| Claude Code | ≥ 1.0 | `npm install -g @anthropic-ai/claude-code` |
| Cursor | ≥ 0.40 | Télécharger depuis cursor.com |
| GitHub Copilot | ≥ 1.0 | Extension VS Code |

**Note :** Au moins 2 agents doivent être disponibles pour les tests d'intégration.

### 4.4 Prérequis connaissances

| Compétence | Niveau |
|------------|--------|
| TypeScript | Intermédiaire |
| MCP (Model Context Protocol) | Basique (documentation à lire) |
| JSON-RPC 2.0 | Basique |
| Stdio transport | Basique |
| Agents IA (Claude Code, Cursor) | Basique |

---

## 5. Décomposition en sous-sprints

### 5.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif | Livrables |
|-------------|-------|----------|-----------|
| **Sprint 6-1** | 4 jours | Setup MCP Server + stdio transport | Serveur MCP démarrable |
| **Sprint 6-2** | 3 jours | Implémentation des 4 outils MCP | 4 outils fonctionnels |
| **Sprint 6-3** | 3 jours | Tests compatibilité agents + documentation | Tests passent + docs |

**Durée totale :** 10 jours ouvrables (2 semaines)

### 5.2 Sprint 6-1 — Setup MCP Server + stdio transport

**Durée :** 4 jours  
**Objectif :** Configurer le serveur MCP avec transport stdio et vérifier qu'il démarre correctement.

**Livrables :**
- ✅ Configuration `@modelcontextprotocol/sdk 1.32.x`
- ✅ Serveur MCP démarre via stdio
- ✅ Handler `initialize` implémenté (conforme MCP 2026-07-28)
- ✅ Handler `tools/list` implémenté (retourne liste vide)
- ✅ Tests unitaires (setup, initialize, tools/list)
- ✅ Logging structuré (debug/info/error)

**Critères d'acceptation :**
- ✅ Le serveur démarre sans erreur
- ✅ Le serveur répond aux requêtes JSON-RPC 2.0 via stdin/stdout
- ✅ Les handlers `initialize` et `tools/list` fonctionnent
- ✅ Les logs sont structurés et informatifs
- ✅ Couverture tests > 80%

**Détail :** Voir document `SPRINT-06-01.md`

### 5.3 Sprint 6-2 — Implémentation des 4 outils MCP

**Durée :** 3 jours  
**Objectif :** Implémenter les 4 outils MCP (search_knowledge, get_resource, list_resources, validate_resource) avec gestion erreurs.

**Livrables :**
- ✅ Outil `search_knowledge` (recherche hybride)
- ✅ Outil `get_resource` (obtention par ID)
- ✅ Outil `list_resources` (liste avec filtres)
- ✅ Outil `validate_resource` (validation schéma)
- ✅ Gestion erreurs (codes erreur MCP standardisés)
- ✅ Tests unitaires pour chaque outil
- ✅ Tests d'intégration (via MCP Server)

**Critères d'acceptation :**
- ✅ Les 4 outils sont implémentés et fonctionnels
- ✅ Les outils retournent les résultats attendus
- ✅ Les erreurs sont gérées avec des codes MCP standardisés
- ✅ Couverture tests > 80%
- ✅ Les outils sont documentés (JSDoc)

**Détail :** Voir document `SPRINT-06-02.md`

### 5.4 Sprint 6-3 — Tests compatibilité agents + documentation

**Durée :** 3 jours  
**Objectif :** Tester la compatibilité avec les agents Tier 1 et documenter l'utilisation.

**Livrables :**
- ✅ Tests d'intégration avec Claude Code
- ✅ Tests d'intégration avec Cursor (ou GitHub Copilot)
- ✅ Configuration agents (fichiers `.mcp.json` ou équivalent)
- ✅ Documentation MCP (configuration, exemples, troubleshooting)
- ✅ Exemples d'utilisation (scénarios réels)
- ✅ Rapport de compatibilité (agents testés, résultats)

**Critères d'acceptation :**
- ✅ Tests passent avec au moins 2 agents Tier 1
- ✅ La documentation est complète et claire
- ✅ Les exemples d'utilisation sont fonctionnels
- ✅ Le rapport de compatibilité est livré

**Détail :** Voir document `SPRINT-06-03.md`

---

## 6. Architecture technique

### 6.1 Composants MCP Server

```
src/
├── mcp/
│   ├── server.ts              # Point d'entrée MCP Server
│   ├── transport.ts           # Configuration transport stdio
│   ├── handlers/
│   │   ├── initialize.ts      # Handler initialize (MCP handshake)
│   │   └── tools.ts           # Handler tools/list et tools/call
│   ├── tools/
│   │   ├── search-knowledge.ts    # Outil search_knowledge
│   │   ├── get-resource.ts        # Outil get_resource
│   │   ├── list-resources.ts      # Outil list_resources
│   │   └── validate-resource.ts   # Outil validate_resource
│   ├── schemas/
│   │   └── tool-schemas.ts    # Schémas JSON pour outils
│   └── utils/
│       ├── errors.ts          # Gestion erreurs MCP
│       └── logger.ts          # Logging structuré
```

### 6.2 Flux de communication

```
Agent IA (Claude Code, Cursor)
    ↓
    ↓ JSON-RPC 2.0 via stdin
    ↓
MCP Server (stdio transport)
    ↓
    ↓ Parse JSON-RPC
    ↓
Router (initialize, tools/list, tools/call)
    ↓
    ↓ Dispatch vers handler
    ↓
Tool Handler (search_knowledge, get_resource, etc.)
    ↓
    ↓ Appel service métier (Knowledge Manager, Search Engine)
    ↓
Service Métier (Sprint 3, 4)
    ↓
    ↓ Retour résultat
    ↓
Tool Handler
    ↓
    ↓ Formate réponse JSON-RPC
    ↓
MCP Server
    ↓
    ↓ Écrit réponse via stdout
    ↓
Agent IA
```

### 6.3 Spécification MCP 2026-07-28 (stateless)

**Caractéristiques clés :**

| Caractéristique | Description |
|-----------------|-------------|
| **Stateless** | Pas de session tracking, chaque requête est indépendante |
| **Transport stdio** | Communication via stdin/stdout (JSON-RPC 2.0) |
| **JSON-RPC 2.0** | Protocole de communication standardisé |
| **Handshake** | `initialize` → `initialized` → prêt à recevoir des requêtes |
| **Outils** | `tools/list` (liste outils) + `tools/call` (appel outil) |
| **Pas d'authentification** | Transport local sécurisé (pas besoin OAuth) |

**Méthodes JSON-RPC supportées :**

| Méthode | Direction | Description |
|---------|-----------|-------------|
| `initialize` | Client → Server | Handshake initial |
| `initialized` | Server → Client | Confirmation handshake |
| `tools/list` | Client → Server | Liste des outils disponibles |
| `tools/call` | Client → Server | Appel d'un outil |

### 6.4 Intégration avec services existants

**Outils MCP → Services existants :**

| Outil MCP | Service utilisé | Méthode |
|-----------|----------------|---------|
| `search_knowledge` | Search Engine | `search(query, options)` |
| `get_resource` | Knowledge Manager | `getResource(id)` |
| `list_resources` | Knowledge Manager | `listResources(filters)` |
| `validate_resource` | Zod schemas | `CreateResourceSchema.safeParse(data)` |

**Aucun nouveau service à implémenter** — les outils MCP sont des wrappers autour des services existants (Sprint 3, 4).

### 6.5 Gestion erreurs

**Codes erreur MCP standardisés :**

| Code | Signification | Exemple |
|------|---------------|---------|
| `-32700` | Parse error | JSON invalide |
| `-32600` | Invalid request | Méthode inconnue |
| `-32601` | Method not found | Handler non implémenté |
| `-32602` | Invalid params | Paramètres invalides |
| `-32603` | Internal error | Erreur interne serveur |
| `-32000` | Resource not found | Ressource inexistante |
| `-32001` | Validation error | Validation Zod échouée |

**Format réponse erreur :**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Resource not found",
    "data": {
      "resourceId": "abc-123"
    }
  }
}
```

---

## 7. Choix techniques

### 7.1 SDK MCP

**Choix :** `@modelcontextprotocol/sdk 1.32.x`

**Justification :**
- ✅ SDK officiel (Linux Foundation)
- ✅ Support TypeScript natif
- ✅ Compatible MCP 2026-07-28
- ✅ Transport stdio inclus
- ✅ Bien documenté
- ✅ Utilisé par Claude Code, Cursor, GitHub Copilot

**Alternatives considérées :**
- ❌ Implémentation manuelle JSON-RPC : trop complexe, risque d'erreurs
- ❌ SDK MCP v1 : obsolète (MCP 2025-03-26)

### 7.2 Transport

**Choix :** stdio (stdin/stdout)

**Justification :**
- ✅ Plus simple que HTTP/SSE
- ✅ Plus sécurisé (pas d'exposition réseau)
- ✅ Suffisant pour MVP-1 (usage local)
- ✅ Supporté par tous les agents Tier 1
- ✅ Pas besoin de gérer CORS, authentification, etc.

**Alternatives considérées :**
- ❌ HTTP/SSE : plus complexe, pas nécessaire pour usage local
- ❌ WebSocket : overkill pour MVP-1

### 7.3 Logging

**Choix :** Logging structuré (JSON) avec niveaux debug/info/error

**Justification :**
- ✅ Facilite le debugging
- ✅ Compatible avec les outils de logging (jq, grep)
- ✅ Pas de dépendance externe (console.log avec formatage)

**Format :**

```json
{"level":"info","message":"MCP Server started","timestamp":"2026-10-21T10:30:00Z"}
{"level":"debug","message":"Received request","method":"tools/call","id":1}
{"level":"error","message":"Tool execution failed","tool":"search_knowledge","error":"..."}
```

### 7.4 Tests

**Choix :** Vitest (tests unitaires) + tests manuels avec agents réels

**Justification :**
- ✅ Vitest déjà utilisé (Sprint 1)
- ✅ Tests unitaires rapides et isolés
- ✅ Tests manuels avec agents réels (nécessaire pour compatibilité)

**Stratégie :**
- ✅ Tests unitaires : mocker les services, tester la logique MCP
- ✅ Tests d'intégration : appeler le serveur via stdio, vérifier réponses
- ✅ Tests manuels : utiliser Claude Code, Cursor pour vérifier compatibilité

---

## 8. Organisation des fichiers

### 8.1 Structure finale

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── mcp/
│   │   ├── server.ts                    # Point d'entrée MCP Server
│   │   ├── transport.ts                 # Configuration transport stdio
│   │   ├── handlers/
│   │   │   ├── initialize.ts            # Handler initialize
│   │   │   └── tools.ts                 # Handler tools/list, tools/call
│   │   ├── tools/
│   │   │   ├── search-knowledge.ts      # Outil search_knowledge
│   │   │   ├── get-resource.ts          # Outil get_resource
│   │   │   ├── list-resources.ts        # Outil list_resources
│   │   │   └── validate-resource.ts     # Outil validate_resource
│   │   ├── schemas/
│   │   │   └── tool-schemas.ts          # Schémas JSON pour outils
│   │   └── utils/
│   │       ├── errors.ts                # Gestion erreurs MCP
│   │       └── logger.ts                # Logging structuré
│   ├── business/                        # (existant Sprint 3, 4)
│   │   ├── knowledge-manager.ts
│   │   └── search-engine.ts
│   └── ...
├── tests/
│   └── mcp/
│       ├── server.test.ts               # Tests serveur MCP
│       ├── tools/
│       │   ├── search-knowledge.test.ts
│       │   ├── get-resource.test.ts
│       │   ├── list-resources.test.ts
│       │   └── validate-resource.test.ts
│       └── integration/
│           └── agents.test.ts           # Tests avec agents réels
├── docs/
│   └── MCP.md                           # Documentation MCP
├── .mcp.json                            # Configuration MCP (exemple)
└── package.json
```

### 8.2 Fichiers à créer

| Fichier | Description | Lignes estimées |
|---------|-------------|-----------------|
| `src/mcp/server.ts` | Point d'entrée MCP Server | ~100 |
| `src/mcp/transport.ts` | Configuration transport stdio | ~50 |
| `src/mcp/handlers/initialize.ts` | Handler initialize | ~40 |
| `src/mcp/handlers/tools.ts` | Handler tools/list, tools/call | ~80 |
| `src/mcp/tools/search-knowledge.ts` | Outil search_knowledge | ~60 |
| `src/mcp/tools/get-resource.ts` | Outil get_resource | ~40 |
| `src/mcp/tools/list-resources.ts` | Outil list_resources | ~50 |
| `src/mcp/tools/validate-resource.ts` | Outil validate_resource | ~40 |
| `src/mcp/schemas/tool-schemas.ts` | Schémas JSON pour outils | ~100 |
| `src/mcp/utils/errors.ts` | Gestion erreurs MCP | ~60 |
| `src/mcp/utils/logger.ts` | Logging structuré | ~40 |
| `tests/mcp/server.test.ts` | Tests serveur MCP | ~100 |
| `tests/mcp/tools/*.test.ts` | Tests outils (4 fichiers) | ~300 |
| `tests/mcp/integration/agents.test.ts` | Tests avec agents réels | ~150 |
| `docs/MCP.md` | Documentation MCP | ~400 |
| `.mcp.json` | Configuration MCP (exemple) | ~20 |
| **Total** | | **~1 630 lignes** |

---

## 9. Tests et validation

### 9.1 Tests unitaires

**Couverture cible :** > 80%

**Fichiers à tester :**

| Fichier | Scénarios à tester |
|---------|-------------------|
| `server.ts` | Démarrage, arrêt, gestion signaux |
| `transport.ts` | Lecture/écriture stdin/stdout, parsing JSON-RPC |
| `handlers/initialize.ts` | Handshake, validation version MCP |
| `handlers/tools.ts` | Dispatch outils, validation paramètres |
| `tools/search-knowledge.ts` | Recherche valide, paramètres invalides, erreurs |
| `tools/get-resource.ts` | Ressource trouvée, ressource inexistante, ID invalide |
| `tools/list-resources.ts` | Liste vide, filtres valides, filtres invalides |
| `tools/validate-resource.ts` | Données valides, données invalides, erreurs |
| `utils/errors.ts` | Codes erreur, formatage messages |
| `utils/logger.ts` | Niveaux log, formatage JSON |

### 9.2 Tests d'intégration

**Tests avec agents réels :**

| Agent | Test | Critère de succès |
|-------|------|-------------------|
| Claude Code | Connexion au serveur MCP | Agent se connecte sans erreur |
| Claude Code | Appel `search_knowledge` | Résultats retournés correctement |
| Claude Code | Appel `get_resource` | Ressource retournée correctement |
| Cursor | Connexion au serveur MCP | Agent se connecte sans erreur |
| Cursor | Appel `list_resources` | Liste retournée correctement |
| Cursor | Appel `validate_resource` | Validation retournée correctement |

**Configuration agents :**

```json
// .mcp.json (exemple pour Claude Code)
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "cwd": "/path/to/Engineering-Knowledge-Tooling-System"
    }
  }
}
```

### 9.3 Tests manuels

**Scénarios à tester manuellement :**

1. **Démarrage serveur**
   ```bash
   node dist/mcp/server.js
   # Vérifier logs de démarrage
   ```

2. **Handshake initialize**
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2026-07-28","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/mcp/server.js
   # Vérifier réponse initialize
   ```

3. **Liste outils**
   ```bash
   echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/mcp/server.js
   # Vérifier liste des 4 outils
   ```

4. **Appel outil search_knowledge**
   ```bash
   echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_knowledge","arguments":{"query":"SQLite"}}}' | node dist/mcp/server.js
   # Vérifier résultats recherche
   ```

### 9.4 Critères de validation

| Critère | Métrique | Cible |
|---------|----------|-------|
| Couverture tests | Statements, branches, functions, lines | > 80% |
| Tests unitaires | Nombre de tests | > 30 tests |
| Tests d'intégration | Agents testés | ≥ 2 agents |
| Compatibilité | Agents Tier 1 compatibles | Claude Code, Cursor |
| Performance | Latence outil | < 100ms (overhead MCP) |
| Erreurs | Codes erreur MCP | 100% standardisés |
| Documentation | Sections complètes | Configuration, exemples, troubleshooting |

---

## 10. Livrables

### 10.1 Code

| Fichier | Description | Validation |
|---------|-------------|------------|
| `src/mcp/server.ts` | Point d'entrée MCP Server | Compilation OK |
| `src/mcp/transport.ts` | Configuration transport stdio | Compilation OK |
| `src/mcp/handlers/initialize.ts` | Handler initialize | Test unitaire passe |
| `src/mcp/handlers/tools.ts` | Handler tools/list, tools/call | Test unitaire passe |
| `src/mcp/tools/search-knowledge.ts` | Outil search_knowledge | Test unitaire passe |
| `src/mcp/tools/get-resource.ts` | Outil get_resource | Test unitaire passe |
| `src/mcp/tools/list-resources.ts` | Outil list_resources | Test unitaire passe |
| `src/mcp/tools/validate-resource.ts` | Outil validate_resource | Test unitaire passe |
| `src/mcp/schemas/tool-schemas.ts` | Schémas JSON pour outils | Compilation OK |
| `src/mcp/utils/errors.ts` | Gestion erreurs MCP | Test unitaire passe |
| `src/mcp/utils/logger.ts` | Logging structuré | Test unitaire passe |

### 10.2 Tests

| Fichier | Description | Validation |
|---------|-------------|------------|
| `tests/mcp/server.test.ts` | Tests serveur MCP | > 80% couverture |
| `tests/mcp/tools/*.test.ts` | Tests outils (4 fichiers) | > 80% couverture |
| `tests/mcp/integration/agents.test.ts` | Tests avec agents réels | ≥ 2 agents testés |

### 10.3 Documentation

| Fichier | Description | Validation |
|---------|-------------|------------|
| `docs/MCP.md` | Documentation MCP | Complète et claire |
| `.mcp.json` | Configuration MCP (exemple) | Fonctionnel |
| `MCP-COMPATIBILITY.md` | Rapport de compatibilité | ≥ 2 agents testés |

### 10.4 Configuration

| Fichier | Description | Validation |
|---------|-------------|------------|
| `package.json` | Dépendance `@modelcontextprotocol/sdk` | Installation OK |
| `tsconfig.json` | Configuration TypeScript | Compilation OK |

---

## 11. Critères d'acceptation du sprint

### 11.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C6.1 | Serveur MCP démarre via stdio | Test manuel passe |
| C6.2 | Handshake `initialize` fonctionne | Test unitaire passe |
| C6.3 | Handler `tools/list` retourne 4 outils | Test unitaire passe |
| C6.4 | Outil `search_knowledge` fonctionne | Test unitaire + intégration |
| C6.5 | Outil `get_resource` fonctionne | Test unitaire + intégration |
| C6.6 | Outil `list_resources` fonctionne | Test unitaire + intégration |
| C6.7 | Outil `validate_resource` fonctionne | Test unitaire + intégration |
| C6.8 | Gestion erreurs (codes MCP standardisés) | Test unitaire passe |

### 11.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C6.9 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C6.10 | Compilation TypeScript OK | `npm run build` |
| C6.11 | Linting OK | `npm run lint` |
| C6.12 | Compatible Claude Code | Test d'intégration passe |
| C6.13 | Compatible Cursor (ou GitHub Copilot) | Test d'intégration passe |

### 11.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C6.14 | Code lisible (JSDoc, commentaires) | Revue code |
| C6.15 | Logging structuré (JSON) | Vérification logs |
| C6.16 | Documentation complète | Revue documentation |

### 11.4 Critères de livraison

| # | Critère | Validation |
|---|---------|------------|
| C6.17 | Tous les fichiers créés | Vérification structure |
| C6.18 | Tous les tests passent | `npm test` |
| C6.19 | Documentation livrée | `docs/MCP.md` existe |
| C6.20 | Rapport de compatibilité livré | `MCP-COMPATIBILITY.md` existe |

---

## 12. Procédure de fin de sprint

### 12.1 Vérifications finales

**Avant de clôturer le Sprint 6 :**

```bash
# 1. Compilation
npm run build
# ✅ Aucune erreur

# 2. Linting
npm run lint
# ✅ Aucune erreur

# 3. Tests unitaires
npm test
# ✅ Tous les tests passent

# 4. Couverture
npm run test:coverage
# ✅ > 80% couverture

# 5. Tests d'intégration
npm run test:integration
# ✅ Tests avec agents réels passent

# 6. Démarrage serveur
node dist/mcp/server.js
# ✅ Serveur démarre sans erreur

# 7. Vérification fichiers
ls -la src/mcp/
ls -la tests/mcp/
ls -la docs/MCP.md
ls -la .mcp.json
# ✅ Tous les fichiers existent

# 8. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques (1 tâche = 1 commit)
```

### 12.2 Point de contrôle

**Vérifier les 20 critères :**
- ✅ C6.1 à C6.8 (critères fonctionnels)
- ✅ C6.9 à C6.13 (critères techniques)
- ✅ C6.14 à C6.16 (critères qualité)
- ✅ C6.17 à C6.20 (critères de livraison)

**Si tous les critères sont validés :**
```bash
# Merge dans main
git checkout main
git merge feat/sprint-6
git push origin main
```

**Si des critères ne sont pas validés :**
- Identifier les problèmes
- Corriger dans une nouvelle branche `fix/sprint-6-xxx`
- Re-tester

### 12.3 Transition vers MVP-2

**Une fois Sprint 6 terminé avec succès :**
- ✅ MCP Server fonctionnel (4 outils)
- ✅ Compatible Tier 1 agents (Claude Code, Cursor)
- ✅ Tests d'intégration passent
- ✅ Documentation complète

**MVP-1 terminé — Passage à MVP-2 (Sprint 7-12) :**
- 🎯 Sprint 7 : Playwright Setup (inspection navigateur)
- 🎯 Sprint 8 : 4 Niveaux d'Inspection
- 🎯 Sprint 9 : Analyse 5 Dimensions
- 🎯 Sprint 10 : Stockage + Indexation Audits
- 🎯 Sprint 11 : Rapport Inspection
- 🎯 Sprint 12 : Tests + Documentation

---

## 13. Prompt de lancement pour agent

**Copier ce prompt pour lancer un agent de développement :**

```markdown
## Mission

Implémenter le Sprint 6 — MCP Server (Semaine 11-12) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-06.md` — Dossier complet Sprint 6
2. `Docs/roadmap/sprints/SPRINT-06-01.md` — Sprint 6-1 (Setup MCP Server)
3. `Docs/roadmap/sprints/SPRINT-06-02.md` — Sprint 6-2 (4 outils MCP)
4. `Docs/roadmap/sprints/SPRINT-06-03.md` — Sprint 6-3 (Tests + Documentation)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (section 4.1.2)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-004 MCP SDK)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 5 terminé
ls -la src/cli/
# ✅ CLI fonctionnelle (7 commandes)

# 2. Tests Sprint 5
npm test
# ✅ Tests passent

# 3. Bases de données
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent

# 4. Ressources indexées
ekts list --json | jq '.count'
# ✅ Au moins 10 ressources

# 5. Search Engine fonctionnel
ekts search "test"
# ✅ Résultats retournés
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 5 terminé avec succès
- ✅ Bases de données créées
- ✅ Ressources indexées (≥ 10)
- ✅ Search Engine fonctionnel
- ✅ Knowledge Manager fonctionnel
- ✅ Au moins 2 agents Tier 1 disponibles (Claude Code, Cursor)

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer des fichiers dans `src/mcp/`
- ✅ Créer des fichiers dans `tests/mcp/`
- ✅ Créer `docs/MCP.md`
- ✅ Créer `.mcp.json` (configuration exemple)
- ✅ Créer `MCP-COMPATIBILITY.md` (rapport de compatibilité)
- ✅ Installer `@modelcontextprotocol/sdk` (dépendance npm)

**Vous ne pouvez pas :**
- ❌ Modifier `src/business/` (sauf si bug critique)
- ❌ Modifier `src/data/` (sauf si bug critique)
- ❌ Modifier `src/cli/` (sauf si bug critique)
- ❌ Créer de fichiers hors périmètre
- ❌ Installer d'autres dépendances (sauf approbation préalable)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Transport stdio uniquement (pas HTTP/SSE)
- ✅ Spécification MCP 2026-07-28 (stateless)
- ✅ JSON-RPC 2.0 pour communication
- ✅ Codes erreur MCP standardisés
- ✅ Logging structuré (JSON)

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

**Tests d'intégration :**
- ✅ Tests avec au moins 2 agents Tier 1
- ✅ Tests handshake initialize
- ✅ Tests tools/list
- ✅ Tests tools/call (4 outils)

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Tâche 6.1 : SDK MCP installé
- [x] Tâche 6.2 : Transport stdio configuré

### Tâches en cours
- [ ] Tâche 6.3 : Handler initialize (50% terminé)

### Tâches à venir
- [ ] Tâche 6.4 : Handler tools/list
- [ ] Tâche 6.5 : Outil search_knowledge
- [ ] Tâche 6.6 : Outil get_resource
- [ ] Tâche 6.7 : Outil list_resources
- [ ] Tâche 6.8 : Outil validate_resource

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 6 est terminé quand :**
- ✅ Les 20 critères d'acceptation sont validés (C6.1 à C6.20)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Tests d'intégration avec agents réels passent
- ✅ Documentation complète
- ✅ Rapport de compatibilité livré
- ✅ Commits pushés sur `feat/sprint-6`

## Livrables

**À la fin du Sprint 6, fournir :**
- ✅ `src/mcp/server.ts` — Point d'entrée MCP Server
- ✅ `src/mcp/transport.ts` — Configuration transport stdio
- ✅ `src/mcp/handlers/initialize.ts` — Handler initialize
- ✅ `src/mcp/handlers/tools.ts` — Handler tools/list, tools/call
- ✅ `src/mcp/tools/search-knowledge.ts` — Outil search_knowledge
- ✅ `src/mcp/tools/get-resource.ts` — Outil get_resource
- ✅ `src/mcp/tools/list-resources.ts` — Outil list_resources
- ✅ `src/mcp/tools/validate-resource.ts` — Outil validate_resource
- ✅ `src/mcp/schemas/tool-schemas.ts` — Schémas JSON pour outils
- ✅ `src/mcp/utils/errors.ts` — Gestion erreurs MCP
- ✅ `src/mcp/utils/logger.ts` — Logging structuré
- ✅ `tests/mcp/server.test.ts` — Tests serveur MCP
- ✅ `tests/mcp/tools/*.test.ts` — Tests outils (4 fichiers)
- ✅ `tests/mcp/integration/agents.test.ts` — Tests avec agents réels
- ✅ `docs/MCP.md` — Documentation MCP
- ✅ `.mcp.json` — Configuration MCP (exemple)
- ✅ `MCP-COMPATIBILITY.md` — Rapport de compatibilité

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-004 MCP SDK)
- ✅ Consulter la documentation MCP SDK (https://modelcontextprotocol.io)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 6-1 : 4 jours (Setup MCP Server + stdio transport)
- Sprint 6-2 : 3 jours (Implémentation des 4 outils MCP)
- Sprint 6-3 : 3 jours (Tests compatibilité agents + documentation)

## Notes importantes

**MCP 2026-07-28 (stateless) :**
- ✅ Pas de session tracking
- ✅ Chaque requête est indépendante
- ✅ Transport stdio (pas HTTP/SSE)
- ✅ Pas d'authentification (transport local sécurisé)

**Compatibilité agents :**
- ✅ Claude Code : Support MCP natif
- ✅ Cursor : Support MCP natif
- ✅ GitHub Copilot : Support MCP natif
- ⚠️ Vérifier la version minimale requise pour chaque agent

**Tests avec agents réels :**
- ⚠️ Nécessite accès à Claude Code et/ou Cursor
- ⚠️ Nécessite configuration `.mcp.json`
- ⚠️ Tests manuels obligatoires (pas automatisables)
```

---

## 14. Résumé

### 14.1 Sprint 6 — MCP Server (2 semaines)

**Objectif :** Implémenter un serveur MCP avec 4 outils, compatible Tier 1 agents

**3 sous-sprints :**
- **Sprint 6-1** (4 jours) : Setup MCP Server + stdio transport
- **Sprint 6-2** (3 jours) : Implémentation des 4 outils MCP
- **Sprint 6-3** (3 jours) : Tests compatibilité agents + documentation

**Livrables principaux :**
- ✅ MCP Server (transport stdio, MCP 2026-07-28 stateless)
- ✅ 4 outils MCP (search_knowledge, get_resource, list_resources, validate_resource)
- ✅ Tests unitaires + tests d'intégration
- ✅ Documentation MCP complète
- ✅ Rapport de compatibilité (≥ 2 agents Tier 1 testés)

**20 critères de validation :**
- ✅ C6.1 à C6.8 (fonctionnels)
- ✅ C6.9 à C6.13 (techniques)
- ✅ C6.14 à C6.16 (qualité)
- ✅ C6.17 à C6.20 (livraison)

**Dépendances :**
- ✅ Sprint 2 (Data Layer) — Terminé
- ✅ Sprint 3 (Knowledge Manager) — Terminé
- ✅ Sprint 4 (Search Engine) — Terminé
- ✅ Sprint 5 (CLI) — Terminé
- 🎯 MVP-1 terminé — Passage à MVP-2 (Sprint 7)

### 14.2 Transition

**Après Sprint 6 :**
- ✅ MCP Server fonctionnel (4 outils)
- ✅ Compatible Tier 1 agents
- ✅ MVP-1 terminé (Knowledge Management Tool)

**MVP-2 — Inspection Navigateur (Semaine 13-24) :**
- 🎯 Sprint 7 : Playwright Setup
- 🎯 Sprint 8 : 4 Niveaux d'Inspection (L1-L3)
- 🎯 Sprint 9 : Analyse 5 Dimensions
- 🎯 Sprint 10 : Stockage + Indexation Audits
- 🎯 Sprint 11 : Rapport Inspection
- 🎯 Sprint 12 : Tests + Documentation

**MVP-3 — Capitalisation Projets (Semaine 25-36) :**
- 🎯 Sprint 13-18 : Workflow de capitalisation

---

**Fin du dossier Sprint 6 — MCP Server**
