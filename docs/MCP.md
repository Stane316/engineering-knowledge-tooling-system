# Serveur MCP EKTS

**Version :** 1.0
**Date :** 23 octobre 2026
**Sprint :** 6 (MCP Server)
**Transport :** stdio (JSON-RPC 2.0)
**SDK :** `@modelcontextprotocol/sdk` 1.32.1

---

## 1. Objectif

Le serveur MCP expose la base de connaissances EKTS aux agents IA (Claude Code,
Cursor, GitHub Copilot) via le **Model Context Protocol**. Quatre outils en
lecture seule sont disponibles :

| Outil | Rôle |
| --- | --- |
| `search_knowledge` | Recherche plein texte, vectorielle ou hybride (FTS5 + RRF) |
| `get_resource` | Lecture d'une ressource par identifiant |
| `list_resources` | Parcours du catalogue avec filtres |
| `validate_resource` | Validation d'une ressource avant création (aucune écriture) |

Le serveur ne modifie jamais la base : aucune création, mise à jour ni
suppression n'est exposée. Les écritures restent le fait de la CLI (`ekts add`,
`ekts delete`).

---

## 2. Prérequis

| Élément | Version | Vérification |
| --- | --- | --- |
| Node.js | ≥ 22.19 | `node --version` |
| Dépendances | — | `npm ci` |
| Build | — | `npm run build` |
| Base | 3 fichiers | `data/ekts.db`, `data/ekts-fts.db`, `data/ekts-vectors.db` |
| Agent | Claude Code ≥ 1.0, Cursor ≥ 0.40 ou Copilot | voir §4 |

Le serveur démarre même si aucune ressource n'existe : les outils renvoient
alors des listes vides. `search_knowledge` en mode `hybrid` exige en revanche un
fournisseur d'embeddings configuré (§7).

---

## 3. Installation

```powershell
cd C:\dev\engineering-knowledge-tooling-system
npm ci
npm run build
Test-Path dist\mcp\server.js      # True
```

Le binaire est `dist/mcp/server.js`. Le script npm `npm run mcp` le lance.

---

## 4. Configuration des agents

### 4.1 Claude Code

Le fichier `.mcp.json` livré à la racine du dépôt est détecté automatiquement
lorsque Claude Code est lancé dans le projet :

```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

Vérification :

```powershell
claude mcp list
```

Le serveur `ekts` doit apparaître avec un statut connecté. Dans une session,
« liste les outils MCP » doit afficher les quatre outils.

### 4.2 Cursor

Fichier `%USERPROFILE%\.cursor\mcp.json` (Windows) ou `~/.cursor/mcp.json` :

```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["C:/dev/engineering-knowledge-tooling-system/dist/mcp/server.js"],
      "env": {
        "EKTS_DATA_DIR": "C:/dev/engineering-knowledge-tooling-system/data",
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

> Cursor ne garantit pas le répertoire courant : utiliser des **chemins
> absolus** et `EKTS_DATA_DIR` évite de créer une base vide ailleurs.

### 4.3 GitHub Copilot (VS Code)

Fichier `.vscode/mcp.json` :

```json
{
  "servers": {
    "ekts": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": { "MCP_LOG_LEVEL": "info" }
    }
  }
}
```

Puis « MCP: List Servers » dans la palette de commandes.

---

## 5. Les quatre outils

### 5.1 `search_knowledge`

| Paramètre | Type | Obligatoire | Défaut |
| --- | --- | --- | --- |
| `query` | chaîne (1–2000) | oui | — |
| `limit` | entier (1–100) | non | 10 |
| `mode` | `hybrid` \| `fts` \| `vector` | non | `hybrid` |
| `type` | `article` \| `video` \| `tutorial` \| `tool` \| `other` | non | — |
| `tags` | tableau de chaînes (≤ 50) | non | — |

Réponse : `{ query, mode, count, results: [{ resource, score, source, highlight? }] }`.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_knowledge",
    "arguments": { "query": "SQLite", "mode": "fts", "limit": 5 }
  }
}
```

### 5.2 `get_resource`

| Paramètre | Type | Obligatoire |
| --- | --- | --- |
| `id` | chaîne (1–100) | oui |

Réponse : `{ resource }`, avec `createdAt`, `updatedAt`, `embeddingModel`
(camelCase, comme toute l'API EKTS). Un identifiant inconnu produit une erreur
`-32000` (voir §8).

### 5.3 `list_resources`

| Paramètre | Type | Obligatoire |
| --- | --- | --- |
| `type` | type de ressource | non |
| `tags` | tableau de chaînes (≤ 50) | non |
| `limit` | entier (1–1000) | non |

Réponse : `{ count, resources }`. Les tags sont **tous** requis (ET logique).

### 5.4 `validate_resource`

| Paramètre | Type | Obligatoire |
| --- | --- | --- |
| `data` | objet libre | oui |

Réponse : `{ valid: true }` ou `{ valid: false, errors: ["title : …", …] }`.
La validation réutilise `CreateResourceSchema` : une donnée acceptée ici le sera
par `ekts add`.

---

## 6. Démarrage manuel et test du protocole

```powershell
$env:EKTS_DATA_DIR = "C:\dev\engineering-knowledge-tooling-system\data"
$env:EKTS_OFFLINE = "1"
$env:MCP_LOG_LEVEL = "info"
node dist\mcp\server.js
```

Le serveur attend des lignes JSON-RPC sur `stdin`. Pour un test non interactif :

```powershell
$init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
$ready = '{"jsonrpc":"2.0","method":"notifications/initialized"}'
$list = '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
$init, $ready, $list | node dist\mcp\server.js
```

Attendu : deux lignes JSON sur `stdout` (`initialize`, puis `tools/list`) et des
lignes de journal JSON sur `stderr`.

---

## 7. Embeddings et modes de recherche

| Mode | Fournisseur requis | Hors ligne |
| --- | --- | --- |
| `fts` | non | oui |
| `vector` | oui | non |
| `hybrid` | oui | non |

Le serveur ouvre les services en mode `auto` : il démarre sans clé, et les
modes vectoriels échouent avec un message explicite (`-32603`) rappelant que
`fts` reste utilisable. Les clés sont lues dans `.env`, chargé au démarrage
(même contrat que la CLI). `EKTS_OFFLINE=1` coupe tout appel réseau.

En cas de changement de fournisseur d'embeddings, réindexer **avant** de
relancer le serveur :

```powershell
npm run cli -- reindex --vectors --force
```

---

## 8. Codes d'erreur

JSON-RPC 2.0 réserve `-32700`…`-32603` au protocole et `-32000`…`-32099` au
serveur.

| Code | Signification | Émis par |
| --- | --- | --- |
| `-32700` | JSON illisible | SDK |
| `-32600` | Requête JSON-RPC invalide | SDK |
| `-32601` | Méthode inconnue | SDK |
| `-32602` | Paramètres invalides, outil inconnu | SDK |
| `-32603` | Erreur interne, embeddings indisponibles | EKTS |
| `-32000` | Ressource introuvable | EKTS |
| `-32001` | Validation métier échouée | EKTS |

**Forme de la réponse.** Le SDK MCP convertit toute erreur d'outil en résultat
`isError: true`. Les codes EKTS sont donc dans le texte JSON :

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":{\"code\":-32000,\"message\":\"Ressource introuvable : abc\",\"data\":{\"resourceId\":\"abc\"}}}"
    }
  ],
  "isError": true
}
```

Les erreurs de validation du protocole sont préfixées par le SDK :
`MCP error -32602: Input validation error: …`.

---

## 9. Journalisation

Les journaux sont écrits **exclusivement sur `stderr`**, en JSON Lines. `stdout`
est réservé au protocole : un `console.log` dans un outil casserait la session.

| Variable | Valeurs | Défaut |
| --- | --- | --- |
| `MCP_LOG_LEVEL` | `debug`, `info`, `error`, `silent` (ou `off`) | `info` |

```json
{"level":"info","message":"Serveur MCP EKTS démarré","timestamp":"2026-10-23T10:00:00.000Z","data":{"transport":"StdioServerTransport","protocolVersion":"2025-11-25","dataDir":"C:/dev/.../data","tools":4,"embeddings":true}}
```

Filtrer avec `jq` (Git Bash) ou `ConvertFrom-Json` (PowerShell) :

```powershell
node dist\mcp\server.js 2> mcp.log
Get-Content mcp.log | ForEach-Object { $_ | ConvertFrom-Json } | Where-Object level -eq 'error'
```

Sous Claude Code, les logs du serveur sont visibles via `claude mcp logs ekts`
(ou dans `~/.claude/logs`).

---

## 10. Sécurité

- **Aucun port réseau** : le transport est stdio, le serveur n'écoute rien.
- **Aucune authentification** : le contrôle d'accès est celui du système de
  fichiers ; quiconque peut lancer le processus peut lire la base.
- **Lecture seule** : les quatre outils ne modifient pas les données.
- **Clés** : lues dans `.env` (ignoré par Git) ; jamais journalisées ni
  renvoyées à l'agent. Les erreurs de fournisseur sont filtrées par
  `redactKeys` en amont.
- **Chemins** : `EKTS_DATA_DIR` doit pointer vers un répertoire de données
  maîtrisé ; ne pas exposer un répertoire partagé en écriture.

---

## 11. Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| L'agent ne voit pas le serveur | `.mcp.json` absent ou JSON invalide | Valider le JSON, relancer l'agent, `claude mcp list` |
| `Cannot find module dist/mcp/server.js` | Build absent | `npm run build` |
| Le serveur démarre puis se ferme | `stdin` fermé | Lancer depuis un agent ou un pipe |
| `EADDRINUSE` / sortie suspecte | Un `console.log` a pollué `stdout` | Journaliser via `logger` (stderr) uniquement |
| `Resource not found` sur un ID valide | Mauvaise base | Vérifier `EKTS_DATA_DIR` |
| `hybrid` échoue, `fts` fonctionne | Aucun fournisseur d'embeddings | Renseigner `.env` ou utiliser `--mode fts` |
| `Espace d'embedding incompatible` | Index vectoriel d'un autre modèle | `npm run cli -- reindex --vectors --force` |
| Caractères illisibles (Windows) | Console non UTF-8 | `chcp 65001` ; les logs JSON restent ASCII |

---

## 12. Écarts entre le dossier Sprint 6 et le code livré

| # | Dossier | Livré | Raison |
| --- | --- | --- | --- |
| E6-1 | Protocole « 2026-07-28 » | `2025-11-25` (négocié par le SDK) | Cette version n'existe pas dans le SDK 1.32.1 ; l'annoncer ferait échouer le handshake |
| E6-2 | Champs `created_at`, `updated_at`, `embedding_model` | `createdAt`, `updatedAt`, `embeddingModel` | Le domaine utilise le camelCase depuis le Sprint 2 |
| E6-3 | `get_resource` → `resource: null` | Erreur `-32000` | Un agent traite `null` comme un bug d'affichage |
| E6-4 | `createKnowledgeManager()` / `createSearchEngine()` sans argument | `openMcpServices` (services partagés, ADR-022) | Une seule connexion SQLite, pas de duplication du câblage |
| E6-5 | `StdioTransport` maison | `McpServer` + `StdioServerTransport` du SDK | Le SDK officiel gère le handshake et le JSON-RPC |
| E6-6 | Erreurs JSON-RPC au niveau `tools/call` | `isError: true` + code dans le texte | Comportement du SDK et recommandation MCP : un agent affiche le contenu d'erreur |
| E6-7 | `z.url()` acceptait `ftp://` | http/https imposés | Le message promettait déjà ce contrôle (correctif annexe) |

---

## 13. Vérifications

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run build
npx vitest run tests/mcp
npx vitest run --coverage tests/mcp
```

Attendu : 99 tests MCP, `src/mcp/**` à 100 %, suite complète à 649 tests.

Tests couverts :

- schémas Zod et JSON Schema ;
- quatre outils sur une base SQLite réelle ;
- dispatch, erreurs `-32602`/`-32000`/`-32001`/`-32603` ;
- serveur complet via transport mémoire (handshake, `tools/list`, `tools/call`) ;
- **binaire compilé** via stdio (JSON-RPC sur `stdout`, logs JSON sur `stderr`,
  sortie propre, démarrage impossible) ;
- compatibilité protocolaire avec un client SDK 1.32.1.

La validation manuelle avec Claude Code et Cursor est décrite dans
[`MCP-COMPATIBILITY.md`](../MCP-COMPATIBILITY.md) ; elle doit être exécutée sur
le poste, aucun agent n'étant installable dans l'environnement de CI.

---

## 14. Références

- Spécification MCP : <https://modelcontextprotocol.io>
- SDK TypeScript : <https://github.com/modelcontextprotocol/typescript-sdk>
- ADR-022 : serveur MCP sur SDK officiel, transport stdio
- `docs/guide` voisin : [`MCP-EXAMPLES.md`](./MCP-EXAMPLES.md)
