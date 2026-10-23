# Serveur MCP EKTS — exemples d'utilisation

Ces exemples utilisent les **vraies** réponses du serveur (`dist/mcp/server.js`,
SDK 1.32.1). Les ressources citées proviennent d'une base de démonstration de
trois entrées.

---

## Exemple 1 — Chercher puis lire une ressource (Claude Code)

**Vous :** « Je travaille sur SQLite. Cherche ce que la base contient là-dessus. »

L'agent appelle :

```json
{
  "name": "search_knowledge",
  "arguments": { "query": "SQLite", "mode": "fts", "limit": 5 }
}
```

Réponse (contenu textuel analysé) :

```json
{
  "query": "SQLite",
  "mode": "fts",
  "count": 1,
  "results": [
    {
      "resource": {
        "id": "89814232-bbf5-4874-aff5-711cc6ba8af0",
        "type": "article",
        "title": "SQLite en pratique",
        "tags": ["sqlite", "base"],
        "content": "SQLite est une base de données embarquée, sans serveur.",
        "createdAt": "2026-10-23T00:25:35.475Z",
        "updatedAt": "2026-10-23T00:25:35.475Z"
      },
      "score": 0.0328,
      "source": "fts"
    }
  ]
}
```

L'agent enchaîne avec `get_resource` et l'identifiant obtenu.

**Pourquoi deux outils ?** `search_knowledge` renvoie déjà la ressource complète
dans les résultats ; `get_resource` sert lorsqu'un identifiant est connu par
ailleurs (lien, conversation précédente, sortie de `list_resources`).

---

## Exemple 2 — Parcourir le catalogue (Cursor)

**Vous :** « Montre-moi les tutoriels tagués `search`. »

```json
{
  "name": "list_resources",
  "arguments": { "type": "tutorial", "tags": ["search"] }
}
```

Réponse :

```json
{ "count": 0, "resources": [] }
```

Le filtrage est un **ET** : la seule ressource taguée `search` est une vidéo.
L'agent corrige de lui-même :

```json
{ "name": "list_resources", "arguments": { "tags": ["search"] } }
```

```json
{
  "count": 2,
  "resources": [
    { "id": "…", "type": "video", "title": "Recherche hybride expliquée", "tags": ["search", "sqlite"], "…": "…" },
    { "id": "…", "type": "tutorial", "title": "Indexer avec FTS5", "tags": ["search", "fts"], "…": "…" }
  ]
}
```

---

## Exemple 3 — Valider avant d'écrire

Un agent ne peut pas créer de ressource via MCP (outils en lecture seule). Il
peut néanmoins vérifier qu'une proposition sera acceptée par `ekts add` :

```json
{ "name": "validate_resource", "arguments": { "data": { "type": "article" } } }
```

```json
{
  "valid": false,
  "errors": ["title : Invalid input: expected string, received undefined"]
}
```

Avec un titre :

```json
{ "name": "validate_resource", "arguments": { "data": { "type": "article", "title": "Mon article" } } }
```

```json
{ "valid": true }
```

L'agent peut alors proposer la commande exacte :

```powershell
npm run cli -- add --type article --title "Mon article"
```

---

## Exemple 4 — Recherche hybride avec filtres

```json
{
  "name": "search_knowledge",
  "arguments": {
    "query": "recherche vectorielle",
    "mode": "hybrid",
    "type": "video",
    "limit": 3
  }
}
```

Si aucun fournisseur d'embeddings n'est configuré, la réponse est une erreur
explicite :

```json
{
  "error": {
    "code": -32603,
    "message": "Embeddings échoués : embeddings non configurés : cette opération en exige un. Le mode « fts » reste utilisable sans fournisseur d'embeddings.",
    "data": { "reason": "EMBEDDINGS_FAILED" }
  }
}
```

L'agent peut relancer en `fts` — la base reste consultable hors ligne.

---

## Exemple 5 — Conversation complète (enchaînement)

```
Vous : Quelles ressources parlent de FTS ?

Agent : [search_knowledge { query: "FTS", mode: "fts" }]
        → « Indexer avec FTS5 » (tutorial)

Vous : Donne-moi son contenu complet.

Agent : [get_resource { id: "<uuid>" }]
        → { resource: { title: "Indexer avec FTS5", content: "Créer une table virtuelle FTS5…" } }

Vous : Je veux ajouter un article sur bm25, est-ce valide ?

Agent : [validate_resource { data: { type: "article", title: "bm25 expliqué" } }]
        → { valid: true }
        « Vous pouvez l'ajouter avec : ekts add --type article --title "bm25 expliqué" »
```

---

## Vérifier ces exemples chez vous

```powershell
cd C:\dev\engineering-knowledge-tooling-system
npm run build
$env:EKTS_DATA_DIR = "C:\dev\engineering-knowledge-tooling-system\data"
$env:MCP_LOG_LEVEL = "silent"

$init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"exemple","version":"1.0"}}}'
$ready = '{"jsonrpc":"2.0","method":"notifications/initialized"}'
$call = '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_resources","arguments":{"limit":3}}}'
$init, $ready, $call | node dist\mcp\server.js
```

La dernière ligne de `stdout` contient le résultat de `list_resources`.
