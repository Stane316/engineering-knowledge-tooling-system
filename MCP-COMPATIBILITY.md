# Rapport de compatibilité MCP — EKTS

**Date :** 23 octobre 2026
**Serveur :** `ekts` 0.1.0
**SDK :** `@modelcontextprotocol/sdk` 1.32.1
**Protocole :** `2025-11-25` (négocié par le SDK)
**Transport :** stdio (JSON-RPC 2.0, une ligne = un message)

---

## 1. Résumé

| Vérification                                  | Méthode                              | Statut                    |
| --------------------------------------------- | ------------------------------------ | ------------------------- |
| Handshake `initialize`                        | Client SDK 1.32.1, transport mémoire | ✅ Vérifié                |
| `tools/list` (4 outils + JSON Schema)         | Client SDK 1.32.1                    | ✅ Vérifié                |
| `search_knowledge`                            | Client SDK + binaire stdio           | ✅ Vérifié                |
| `get_resource`                                | Client SDK + binaire stdio           | ✅ Vérifié                |
| `list_resources`                              | Client SDK + binaire stdio           | ✅ Vérifié                |
| `validate_resource`                           | Client SDK + binaire stdio           | ✅ Vérifié                |
| Codes d'erreur (`-32000`, `-32602`, `-32603`) | Client SDK + binaire                 | ✅ Vérifié                |
| `stdout` sans pollution, `stderr` en JSON     | Processus compilé réel               | ✅ Vérifié                |
| Arrêt propre à la fermeture de `stdin`        | Processus compilé réel               | ✅ Vérifié                |
| **Claude Code**                               | Session réelle                       | ⏳ À valider sur le poste |
| **Cursor**                                    | Session réelle                       | ⏳ À valider sur le poste |
| **GitHub Copilot**                            | Session réelle                       | ⏳ À valider (optionnel)  |

**Ce que cela signifie.** La compatibilité **protocolaire** est prouvée : un
client MCP officiel (le SDK 1.32.1) effectue le handshake, liste les outils et
appelle les quatre outils sur le binaire compilé. Les trois agents Tier 1
utilisent ce même SDK ou une implémentation équivalente. En revanche, aucune
session réelle de Claude Code, Cursor ou Copilot n'a été exécutée dans
l'environnement de développement automatisé : ces trois lignes doivent être
cochées par l'utilisateur (§3). Le rapport ne prétend pas le contraire.

---

## 2. Détail des vérifications automatiques

Exécutées par `npx vitest run tests/mcp` (99 tests) et la CI GitHub Actions
(ubuntu/windows × Node 22/24).

| #   | Scénario                                            | Résultat observé                                                                               |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A1  | `initialize` avec `protocolVersion: "2025-11-25"`   | `serverInfo.name = "ekts"`, version `0.1.0`, `capabilities.tools` présent, instructions reçues |
| A2  | Négociation d'une version antérieure (`2025-06-18`) | Le SDK répond avec une version qu'il sait servir, sans erreur                                  |
| A3  | `tools/list`                                        | 4 outils, `inputSchema.type = "object"`, `required` conformes                                  |
| A4  | `tools/call search_knowledge` (`fts`)               | Résultats avec `resource`, `score`, `source`                                                   |
| A5  | `tools/call get_resource` (ID existant)             | Ressource complète (camelCase)                                                                 |
| A6  | `tools/call get_resource` (ID absent)               | `isError: true`, code `-32000`, `resourceId` dans `data`                                       |
| A7  | `tools/call list_resources` avec filtres            | Filtrage type + tags (ET), limite respectée                                                    |
| A8  | `tools/call validate_resource`                      | `{valid:true}` ou `{valid:false, errors:[…]}`                                                  |
| A9  | Outil inconnu                                       | `isError: true`, texte contenant `-32602`                                                      |
| A10 | Paramètre manquant                                  | `isError: true`, texte contenant `-32602`                                                      |
| A11 | Mode `hybrid` sans fournisseur                      | `isError: true`, code `-32603`, message mentionnant `fts`                                      |
| A12 | `stdout` du binaire                                 | Toutes les lignes sont du JSON-RPC 2.0 valide                                                  |
| A13 | `stderr` du binaire                                 | Toutes les lignes commencent par `{` et portent `level`/`message`                              |
| A14 | Fermeture de `stdin`                                | Code de sortie `0`                                                                             |
| A15 | `EKTS_DATA_DIR` invalide                            | Code de sortie `1`, diagnostic JSON sur `stderr`                                               |

---

## 3. Validation manuelle à exécuter sur le poste

### 3.1 Claude Code

```powershell
cd C:\dev\engineering-knowledge-tooling-system
npm run build
claude
```

Dans la session :

1. `/mcp` (ou « liste les outils MCP ») → le serveur `ekts` doit apparaître.
2. « Cherche SQLite dans ma base de connaissances » → appel `search_knowledge`.
3. « Donne-moi la ressource <id> » → appel `get_resource`.
4. « Liste les articles » → appel `list_resources`.
5. « Est-ce que {type: article, title: Test} est valide ? » → `validate_resource`.

À cocher :

- [ ] Le serveur est détecté sans erreur.
- [ ] Les 4 outils sont listés.
- [ ] Les 4 appels renvoient des données cohérentes.
- [ ] Aucune écriture n'est proposée (outils en lecture seule).

### 3.2 Cursor

1. `Cursor Settings > MCP > Add server` (ou éditer `%USERPROFILE%\.cursor\mcp.json`, voir `docs/MCP.md` §4.2).
2. Redémarrer Cursor.
3. Dans le chat, activer les outils MCP puis rejouer les cinq demandes ci-dessus.

À cocher :

- [ ] Le serveur passe au vert dans les réglages MCP.
- [ ] Les 4 outils sont disponibles.
- [ ] Les réponses correspondent à celles de Claude Code.

### 3.3 Résultat à consigner

| Agent          | Version | Connexion | 4 outils | Problèmes |
| -------------- | ------- | --------- | -------- | --------- |
| Claude Code    |         | ⬜        | ⬜       |           |
| Cursor         |         | ⬜        | ⬜       |           |
| GitHub Copilot |         | ⬜        | ⬜       |           |

---

## 4. Écarts et limites connus

- Le protocole annoncé est `2025-11-25`, pas « 2026-07-28 » comme l'indique le
  dossier Sprint 6 : cette version n'existe pas dans le SDK 1.32.1. Un client qui
  demanderait une version inconnue obtient la plus récente servie (comportement
  standard de négociation MCP).
- Les messages de validation **du SDK** sont en anglais (`Input validation
error: …`) ; les erreurs métier EKTS sont en français.
- `get_resource` renvoie une erreur `-32000` plutôt que `resource: null`
  (voir `docs/MCP.md` §12).
- Le serveur est en **lecture seule** : aucun outil d'écriture en MVP-1.

---

## 5. Rejouer les vérifications automatiques

```powershell
npm run verify
npx vitest run tests/mcp
npx vitest run --coverage tests/mcp
```

Attendu : 649 tests au total, `src/mcp/**` à 100 % de couverture.
