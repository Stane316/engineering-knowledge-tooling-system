# Serveur MCP EKTS

**Version :** 1.0
**Date :** 23 octobre 2026
**Sprint :** 6 (MCP Server)
**Transport :** stdio (JSON-RPC 2.0)
**SDK :** `@modelcontextprotocol/sdk` 1.32.1

---

## 1. Objectif

Le serveur MCP expose la base de connaissances EKTS aux agents IA (Claude Code,
Cursor, GitHub Copilot) via le **Model Context Protocol**. **Onze outils** sont
disponibles (Sprints 6, 11-3 et 13) :

| Outil | Rôle |
| --- | --- |
| `search_knowledge` | Recherche plein texte, vectorielle ou hybride (FTS5 + RRF) |
| `get_resource` | Lecture d'une ressource par identifiant |
| `list_resources` | Parcours du catalogue avec filtres |
| `validate_resource` | Validation d'une ressource avant création (aucune écriture) |
| `inspect_site` | Inspection complète d'un site (L3) → audit stocké (**action**, `project_id` optionnel) |
| `audit_history` | Historique des audits avec filtres et statistiques |
| `audit_report` | Rapport Markdown d'un audit, renvoyé en mémoire |
| `create_project` | Création d'un projet (**action**, Sprint 13) |
| `list_projects` | Projets avec filtres `status`/pagination (Sprint 13) |
| `get_project` | Lecture d'un projet par UUID (Sprint 13) |
| `delete_project` | Suppression d'un projet, audits conservés (**action**, Sprint 13) |

Huit outils sont en lecture seule (`readOnlyHint: true`). Les trois actions —
`inspect_site`, `create_project`, `delete_project` — écrivent via la CLI part
mêmes interfaces : le serveur ne modifie ni ressource de connaissance (ajouts/
suppressions restent `ekts add` / `ekts delete`) ; `inspect_site` ajoute un
audit (réseau requis) et `delete_project` repose sur `ON DELETE SET NULL`
(audits et ressources conservés avec `project_id` à `NULL`).

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

## 5. Outils de connaissance (Sprint 6, détaillés)

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

---

## 15. Outils d'inspection et d'audits (Sprint 11-3)

> Voir aussi [`REPORTS.md`](./REPORTS.md) pour le module de rapports et
> [`CLI.md`](./CLI.md) (§ 11) pour les commandes homologues.

### `inspect_site`

Inspecte un site (navigation réelle), analyse performance / accessibilité /
SEO / UX / contenu, **stocke un audit** et renvoie son résumé.

**Input :**

```json
{ "url": "https://example.com", "level": "L3" }
```

| Champ | Type | Défaut | Notes |
| --- | --- | --- | --- |
| `url` | string (URL) | obligatoire | http/https |
| `level` | `L1` \| `L2` \| `L3` | `L3` | `L1`/`L2` refusés (entrées d'analyse incomplètes) |
| `allow_private_hosts` | boolean | `false` | Exception explicite : autorise une cible privée/loopback (Sprint 20-03) |

**Politique de cible (Sprint 20-03, C-W13).** `inspect_site` applique la même
règle que la CLI `ekts inspect` : schéma `http`/`https` seulement, identifiants
embarqués refusés, hôte privé ou loopback refusé **par défaut**. L'hôte est
ensuite résolu : une adresse privée (`10/8`, `172.16/12`, `192.168/16`,
`127/8`, `::1`, lien-local) fait échouer l'appel, et un échec DNS produit une
erreur explicite (`DNS`) — aucune navigation n'est tentée. Un serveur MCP peut
donc exposer `inspect_site` à un agent sans lui ouvrir le réseau interne ;
`allow_private_hosts: true` est la seule façon d'inspecter un poste local, et
elle doit rester un choix conscient de l'appelant.

Limite déclarée : la résolution précède la navigation ; un rebinding DNS entre
les deux n'est pas couvert.

**Output :**

```json
{
  "inspection_url": "https://example.com",
  "level": "L3",
  "score": 75,
  "total_findings": 5,
  "critical_findings": 0,
  "high_findings": 2,
  "audit_id": 1,
  "timestamp": "2026-10-24T10:00:00.000Z",
  "dimensions": { "performance": 80, "accessibility": 70, "seo": 85, "ux": 65, "content": 75 }
}
```

Annotations : `readOnlyHint: false`, `openWorldHint: true` (navigation
réelle). Budget : < 2 s hors temps de navigation.

### `audit_history`

Historique des audits avec statistiques (aucun réseau : énumération FTS).

**Input :**

```json
{ "url": "https://example.com", "limit": 20, "score_min": 70, "score_max": 100 }
```

| Champ | Type | Défaut |
| --- | --- | --- |
| `url` | string (URL) optionnelle | — |
| `limit` | entier 1-100 | `20` |
| `score_min` | entier 0-100 | — |
| `score_max` | entier 0-100 | — |

**Output :** `{ audits[], statistics, count }` — chaque audit expose
`id`, `url`, `timestamp`, `overall_score`, `total_findings`, les compteurs
par priorité et `dimensions[]` ; `statistics` couvre `total_audits`,
`average_score`, `min_score`, `max_score`, `total_findings` (globales, ou
restreintes à `url` quand le filtre est fourni).

### `audit_report`

Rapport Markdown complet d'un audit, **généré en mémoire** (aucun fichier
écrit côté serveur).

**Input :**

```json
{ "audit_id": 1, "format": "markdown" }
```

| Champ | Type | Défaut |
| --- | --- | --- |
| `audit_id` | entier positif | obligatoire |
| `format` | `markdown` \| `text` | `markdown` |

**Output :**

```json
{
  "audit_id": 1,
  "format": "markdown",
  "url": "https://example.com",
  "report_content": "# 📊 Rapport d'audit — …",
  "generated_at": "2026-10-24T12:00:00.000Z"
}
```

Code d'erreur `-32000` (`RESOURCE_NOT_FOUND`) si `audit_id` est inconnu.

### Validation

Les trois entrées sont déclarées en Zod dans
`src/mcp/schemas/tool-schemas.ts` (source unique pour `tools/list` et pour
`dispatchTool`) : une entrée invalide échoue avec `-32602` avant toute
exécution.

---

## 16. Outils projets (Sprint 13 — multi-projets)

> Voir aussi [`CLI.md`](./CLI.md) (§ 12) pour les commandes homologues et
> [`guides/PROJECTS.md`](./guides/PROJECTS.md) pour le guide complet.
> Schémas Zod : `src/mcp/schemas/tool-schemas.ts`.

### `create_project`

Crée un projet et renvoie l'objet persisté.

**Input :**

```json
{ "name": "Mon Site Web", "description": "Audit example.com", "status": "active" }
```

| Champ | Type | Défaut |
| --- | --- | --- |
| `name` | string 1-200 (obligatoire) | — |
| `description` | string ≤ 2000 | — |
| `status` | `active` \| `completed` \| `archived` | `active` |
| `metadata` | objet (clés/valeurs libres) | `{}` |

**Output :** `{ "project": { "id": "<uuid>", "name": …, "status": …, … } }`

Erreur `-32602` si le nom est vide ou le statut hors enum (Zod, messages
français).

### `list_projects`

**Input :**

```json
{ "status": "active", "limit": 50, "offset": 0 }
```

| Champ | Type | Défaut |
| --- | --- | --- |
| `status` | enum des statuts | tous |
| `limit` | entier 1-1000 | `50` |
| `offset` | entier ≥ 0 | `0` |

**Output :** `{ "count": 2, "projects": [ … ] }` (tri `created_at DESC`).

### `get_project`

**Input :**

```json
{ "project_id": "550e8400-e29b-41d4-a716-446655440000" }
```

**Output :** `{ "project": { … } }`

Code d'erreur **`-32000`** (`PROJECT_NOT_FOUND`) si l'UUID est absent de la
base ; `-32602` si `project_id` n'est pas un UUIDv4.

### `delete_project`

**Input :**

```json
{ "project_id": "550e8400-e29b-41d4-a716-446655440000" }
```

**Output :** `{ "deleted": true, "project_id": "…" }`

Aucune confirmation interactive (l'appel formule explicitement la demande).
Les audits et ressources du projet sont **conservés** (`project_id` → `NULL`).
Code d'erreur **`-32000`** si le projet n'existe pas.

### `inspect_site` avec assignation (Sprint 13)

L'entrée de `inspect_site` accepte un `project_id` optionnel (UUID) : l'audit
créé est alors rattaché au projet. Omis → audit sans projet.

```json
{ "url": "https://example.com", "level": "L3", "project_id": "550e8400-…" }
```

### Vérification (15 outils)

```bash
# Après npm run build, avec le serveur configuré (voir § 4) :
# tools/list doit retourner les 15 noms de TOOL_NAMES dans l'ordre :
# search_knowledge, get_resource, list_resources, validate_resource,
# inspect_site, audit_history, audit_report, create_project, list_projects,
# get_project, delete_project, get_timeline, search_best_practices,
# add_best_practice, get_recommendations
```

Les tests `tests/mcp/**` vérifient le catalogue (15 noms, 15 descriptions
distinctes), les entrées Zod et les codes d'erreur sur une base SQLite réelle.

## 19. Outil recommandations (Sprint 16-03)

> Guide complet : [`guides/RECOMMENDATIONS.md`](guides/RECOMMENDATIONS.md).

### `get_recommendations` — génération contextuelle (C16.10)

Génère les recommandations d'un projet (règles + scoring statistique +
ajustements), les **persiste** (régénération idempotente) et renvoie résumé
Markdown + JSON.

**Entrée** (`project_id` obligatoire) :

```json
{ "project_id": "550e8400-…", "max_recommendations": 10,
  "min_relevance_score": 0.3, "dimensions": ["performance"],
  "include_rules": true, "include_statistical": true }
```

| Champ | Type | Défaut | Rejet (`-32602`) |
| --- | --- | --- | --- |
| `project_id` | UUID | — (requis) | format/absent |
| `max_recommendations` | entier 1-500 | `10` | 0, décimal, > 500 |
| `min_relevance_score` | nombre 0-1 | `0.3` | hors bornes |
| `dimensions` | enum 5 dimensions[] | toutes | valeur hors liste |
| `include_rules` / `include_statistical` | bool | `true` | non booléen |

**Réponse** : `{ projectId, totalRecommendations, rulesApplied,
statisticalRecommendations, durationMs, recommendations[{id, projectId,
ruleId, findingTitle, recommendationTitle, recommendationDescription,
dimension, relevanceScore, effort, impact, priority, generatedAt}],
summary }` — `ruleId: null` = source statistique (📊), sinon règle (📏).

**Références** : `GetRecommendationsInput` (`tool-schemas.ts`),
`TOOL_NAMES` (15), dispatch `handlers/tools.ts`, `executeGetRecommendations`,
`McpToolContext.recommendations` (engine + contexte + BestPracticeService
construits dans `openMcpServices`), annotation `readOnlyHint: true`
(générations reproductibles).

## 18. Outils bonnes pratiques (Sprint 15-03)

> Guide complet : [`guides/BEST_PRACTICES.md`](guides/BEST_PRACTICES.md).

### `search_best_practices` — lecture seule

Recherche hybride (FTS5 + filtres) dans les bonnes pratiques capitalisées
(C15.11).

**Entrée** (tout optionnel, défauts Zod) :

```json
{ "query": "optimiser images", "category": "performance", "tag": "images",
  "project_id": "550e8400-…", "limit": 10 }
```

| Champ | Type | Défaut | Rejet (`-32602`) |
| --- | --- | --- | --- |
| `query` | string ≥ 1 | — (énumération `list`) | vide |
| `category` | enum 6 valeurs | — | hors liste |
| `tag` | string ≥ 1 | — | vide |
| `project_id` | UUID | — | format |
| `limit` | entier 0-500 | `10` | négatif, non entier, > 500 |

**Réponse** : `{ query?, count, total, results[{id,title,description,category,
tags,occurrenceCount,isManual,score,matchType}], summary }`.

### `add_best_practice` — écriture

Seul outil du module avec `readOnlyHint: false` (C15.12).

**Entrée** :

```json
{ "title": "Utiliser le lazy loading",
  "description": "Ajouter loading=lazy aux images hors viewport",
  "category": "performance", "tags": ["lazy-loading"] }
```

`title` 3-200 caractères, `description` 10-4000, `category` obligatoire,
`tags` 0-30 éléments non vides ; `isManual: true` forcé.

**Réponse** : `{ practice, summary }` ; violations → `-32602` (champs fautifs).

**Références** : `SearchBestPracticesInput`/`AddBestPracticeInput`
(`tool-schemas.ts`), `TOOL_NAMES` (14), dispatch `handlers/tools.ts`,
`executeSearchBestPractices`/`executeAddBestPractice`, service
`context.bestPractices` (construit dans `openMcpServices`).

## 17. Outil timeline (Sprint 14-3)

> Guide complet : [`guides/TIMELINE.md`](guides/TIMELINE.md). Contrat détaillé
> : [`API_REFERENCE.md`](API_REFERENCE.md), section « Sorties MCP ».

### `get_timeline`

Analyse temporelle complète d'un projet (C14.7) : séries de scores, tendances,
régressions au-dessus du seuil, alertes actives et résumé Markdown. **Lecture
seule** (`readOnlyHint: true`) — aucune alerte n'est créée par l'outil.

**Entrée** (défauts appliqués par Zod, champs omis plutôt qu'à `undefined`) :

```json
{
  "project_id": "550e8400-…",
  "start_date": "2026-10-01",
  "end_date": "2026-10-15",
  "lookback_days": 90,
  "threshold": 10,
  "include_alerts": true,
  "include_charts": false
}
```

| Champ | Type | Défaut | Rejet (`-32602`) |
| --- | --- | --- | --- |
| `project_id` | UUID | requis | format, projet absent → `-32000` |
| `start_date` / `end_date` | `YYYY-MM-DD` | glissant 90 j / ∞ | regex ; `start_date > end_date` → `ValidationError` |
| `lookback_days` | entier | `90` | `< 1` |
| `threshold` | entier | `10` | `< 1` ou `> 100` |
| `include_alerts` | booléen | `true` | type |
| `include_charts` | booléen | `false` | type |

**Réponse** (un seul content JSON, `run()`) : `period{start,end}`,
`dimensions[dim]{averageScore,min,max,scores[]}`, `trends[dim]{direction,slope,
confidence,description}`, `overallTrend`, `recommendations[]`,
`regressions[]`, `summary` (Markdown), `alerts{active,list}` (optionnel),
`charts.svg` (optionnel).

**Références** : entrée `GetTimelineInput` (`tool-schemas.ts`),
`TOOL_NAMES`/`TOOL_DESCRIPTIONS`, dispatch `case 'get_timeline'`,
`executeGetTimeline` (`tools/get-timeline.ts`), services `context.timeline`
(analyzer, detector, alertRepository, alertManager, chartGenerator).

---

## 20. Outils templates (Sprint 17-03)

Catalogue : **17 outils**. Deux outils ajoutés (C17.7/C17.8).

### `list_templates`

Liste les templates de projets (10 prédéfinis semés au démarrage +
personnalisés), résumé Markdown + JSON. Lecture seule
(`readOnlyHint: true`).

| Champ | Type | Défaut | Rejet (`-32602`) |
| --- | --- | --- | --- |
| `category` | enum (11) | tous | valeur hors liste |
| `builtin_only` | booléen | `false` | type |
| `limit` | entier | `20` | `< 1`, `> 500`, non entier |

**Réponse** : `{count, templates[{id,name,category,description,isBuiltin,
bestPracticeCount,ruleCount}], summary}`.

### `apply_template`

Crée un projet en appliquant un template (C17.3/C17.4) : config fusionnée
(merge profond, ADR-041), bonnes pratiques associées, règles actives
comptées. Écriture (`readOnlyHint: false`).

| Champ | Type | Défaut | Rejet |
| --- | --- | --- | --- |
| `template_id` | UUID | requis | format ; absent → `ValidationError` (`VALIDATION_FAILED`) |
| `project_name` | string ≥ 1 | requis | vide |
| `project_url` | URL | requis | format |
| `project_description` | string | optionnel | type |
| `overrides.config` | object | — | type |
| `overrides.additional_best_practice_ids` | string[] | — | type |
| `overrides.additional_rule_ids` | string[] | — | type |

**Réponse** : `{projectId, projectName, templateId,
bestPracticesAssociated, rulesCreated, durationMs, summary}`.

**Références** : entrées `ListTemplatesInput`/`ApplyTemplateInput`
(`tool-schemas.ts`), dispatch `case 'list_templates'`/`case 'apply_template'`,
`executeListTemplates` (`tools/list-templates.ts`), `executeApplyTemplate`
(`tools/apply-template.ts`), service `context.templates`
(`TemplateService`, seed idempotent au constructeur).
