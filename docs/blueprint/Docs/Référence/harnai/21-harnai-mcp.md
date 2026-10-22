---
title: "DRI 13b — HarnAI MCP"
subtitle: "Focus MCP : compatibilité, création, registries"
date: 2026-10-20
project: HarnAI
tags:
  - harnai
  - mcp
  - model-context-protocol
  - sdk
  - registries
mcp_tools_count: 12
sdks: 2
related:
  - "dri/06-ai-resource-map"
  - "harnai/20-harnai-custom-mcp"
---

# DRI 13b — HARNAI MCP
### Focus MCP : compatibilité, création, registries
**2026-10-20** · Écosystème MCP analysé

---

# 13b.1 État de l'écosystème MCP (2026)

### Chiffres clés

| Élément | Donnée |
|---------|--------|
| Registre officiel | `registry.modelcontextprotocol.io` — gratuit, sans revue [W] |
| Directories | mcp.so ≈ 20 K+ · Glama ≈ 21 K · Smithery 7 K+ · PulseMCP 11 K+ [W] |
| Transport dominant | 59% Streamable HTTP vs 34% stdio [W] |
| Liste curatée | punkpeye/awesome-mcp-servers — 96 664★, MIT [API-gh] |

### Protocole MCP

**Model Context Protocol (MCP)** est un protocole ouvert pour connecter des agents IA à des outils externes. Il permet :
- **Tools** : fonctions appelables par l'agent
- **Resources** : données exposées en lecture
- **Prompts** : templates de prompts réutilisables
- **Transport** : stdio (local) ou Streamable HTTP (remote)

### Outils MCP dans HarnAI

### Outils avec support MCP (10 outils)

| Outil | Famille | Score | Stars | Rôle |
|-------|---------|-------|-------|------|
| [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | F6_mcp_ecosystem | 100/100 | 96,664 | Server/Registry |
| [mcp-cli](https://github.com/IBM/mcp-cli) | F6_mcp_ecosystem | 100/100 | 2,024 | Server/Registry |
| [servers](https://github.com/modelcontextprotocol/servers) | F6_mcp_ecosystem | 85/100 | 25,000 | Server/Registry |
| [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | F5_asian_ecosystems | 80/100 | 17,198 | Client compatible |
| [opencode](https://github.com/opencode-ai/opencode) | F1_harness_cli | 80/100 | 25,000 | Client compatible |
| [crewAI](https://github.com/crewAIInc/crewAI) | F4_orchestration | 80/100 | 75,000 | Client compatible |
| [inspector](https://github.com/modelcontextprotocol/inspector) | F6_mcp_ecosystem | 70/100 | 11,109 | Server/Registry |
| [cline](https://github.com/cline/cline) | F1_harness_cli | 60/100 | 65,000 | Client compatible |
| [python-sdk](https://github.com/modelcontextprotocol/python-sdk) | F7_mcp_creation | 30/100 | 24,623 | SDK/Tool |
| [typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | F7_mcp_creation | 30/100 | 13,627 | SDK/Tool |

---

# 13b.2 Création de MCP custom

### SDKs officiels

| SDK | Langage | Stars | Licence | Usage |
|-----|---------|-------|---------|-------|
| **modelcontextprotocol/python-sdk** | Python | 24 623★ [API-gh] | MIT | Créer serveur MCP en Python |
| **modelcontextprotocol/typescript-sdk** | TypeScript | 13 627★ [API-gh] | MIT | Créer serveur MCP en TypeScript |

### Outils de test et prototypage

| Outil | Description | Stars | Usage |
|-------|-------------|-------|-------|
| **MCP Inspector** | Interface web pour tester/debugger MCP | 11 109★ [API-gh] | Tester des tools, resources, prompts |
| **IBM/mcp-cli** | CLI pour prototypage rapide | 2 024★ [API-gh] | Prototyper sans coder |

### Exemple de serveur MCP (Python)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-custom-server")

# Tool : fonction appelable
@mcp.tool()
def my_tool(param: str) -> str:
    """Description du tool"""
    return f"Result: {param}"

# Resource : donnée exposée
@mcp.resource("my-resource://data")
def my_resource() -> str:
    """Description de la resource"""
    return "Resource data"

# Prompt : template réutilisable
@mcp.prompt()
def my_prompt(topic: str) -> str:
    """Template de prompt"""
    return f"Analyse approfondie de {topic}"

mcp.run()
```

### Exemple de serveur MCP (TypeScript)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-custom-server",
  version: "1.0.0",
});

// Tool
server.tool(
  "my_tool",
  "Description du tool",
  { param: z.string() },
  async ({ param }) => ({
    content: [{ type: "text", text: `Result: ${param}` }],
  })
);

// Resource
server.resource("my-resource", "my-resource://data", async () => ({
  contents: [{ uri: "my-resource://data", text: "Resource data" }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

# 13b.3 Registries MCP

### Principaux registries

| Registry | URL | Nombre serveurs | Notes |
|----------|-----|-----------------|-------|
| **mcp.so** | https://mcp.so | 20 000+ | Un des plus grands [W] |
| **Smithery** | https://smithery.ai | 7 000+ | Curaté [W] |
| **Glama** | https://glama.ai | 21 000+ | [W] |
| **PulseMCP** | https://pulsemcp.com | 11 000+ | [W] |
| **mcpservers.org** | https://mcpservers.org | 9 800+ | [W] |
| **ClaudePluginHub** | https://claudepluginhub.com | 65 000+ | Plugins [W] |

### Publication dans le registre officiel

1. Créer `server.json` avec métadonnées (nom, description, version, tools, resources)
2. Utiliser CLI `mcp-publisher` pour publier
3. Vérification DNS pour espaces de noms vérifiés
4. Apparaît automatiquement sur Glama, mcp.directory, PulseMCP [W]

### Exemple de server.json

```json
{
  "name": "my-custom-server",
  "version": "1.0.0",
  "description": "Mon serveur MCP custom",
  "tools": [
    {
      "name": "my_tool",
      "description": "Description du tool",
      "inputSchema": {
        "type": "object",
        "properties": {
          "param": { "type": "string" }
        },
        "required": ["param"]
      }
    }
  ],
  "resources": [
    {
      "uri": "my-resource://data",
      "name": "My Resource",
      "description": "Description de la resource"
    }
  ]
}
```

---

# 13b.4 Clients MCP compatibles

### Harness compatibles MCP

| Client | Type | Configuration MCP |
|--------|------|-------------------|
| **Claude Code** | CLI | `claude mcp add --transport http <name> <url>` |
| **Cline** | VS Code Extension | JSON dans settings |
| **OpenCode** | IDE | JSON dans config |
| **Cursor** | IDE | JSON dans settings |
| **Windsurf** | IDE | JSON dans settings |
| **Continue** | IDE Extension | JSON dans config |
| **Qwen-Agent** | Framework | Python API |

### Exemple de configuration (Claude Code)

```bash
# Ajouter un serveur MCP local (stdio)
claude mcp add my-server -- python /path/to/server.py

# Ajouter un serveur MCP remote (HTTP)
claude mcp add --transport http my-server https://my-server.example.com/mcp
```

### Exemple de configuration (Cline VS Code)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["/path/to/server.py"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

---

# 13b.5 Liens vers docs connexes

- [[06-ai-resource-map]] — Section MCP du DRI principal (fiches détaillées des MCP existants)
- [[harnai/20-harnai-custom-mcp]] — Guide complet de création de votre MCP custom
- [[harnai/19-harnai-recommendations]] — Recommandations d'utilisation
- [[harnai/16-harnai-moc]] — MOC HarnAI (point d'entrée)

*Document généré le 2026-10-20 — Focus MCP*
