---
title: "DRI 15 — HarnAI Custom MCP"
subtitle: "Guide complet de création de votre MCP custom"
date: "2026-10-20"
project: "HarnAI"
tags:
  - "harnai"
  - "mcp-custom"
  - "guide"
  - "implementation"
  - "tutorial"
mcp_tools: "6"
mcp_resources: "2"
clients_supported:
  - "Claude Code"
  - "Cline"
  - "OpenCode"
  - "Qwen-Agent"
related:
  - "dri/14-harnai-recommendations"
  - "dri/13b-harnai-mcp"
  - "dri/06-ai-resource-map"
---
# DRI 15 — HARNAI CUSTOM MCP
### Guide de création de votre MCP custom
**2026-10-20** · Implémentation pas à pas

---

# 15.1 Prérequis

### Installation

```bash
# 1. Créer le projet
mkdir harnai-mcp && cd harnai-mcp
python -m venv venv && source venv/bin/activate

# 2. Installer les dépendances
pip install mcp[cli] qdrant-client sentence-transformers pyyaml

# 3. Installer Qdrant (base vectorielle)
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant

# 4. Installer MCP Inspector (pour tester)
npx @modelcontextprotocol/inspector
```

### Structure du projet

```
harnai-mcp/
├── mcp_server.py              # Serveur MCP principal
├── conventions/               # Vos conventions (YAML)
│   ├── code/
│   ├── design/
│   └── security/
├── skills/                    # Skills réutilisables
│   ├── registry.json
│   └── templates/
└── memory/                    # Scripts mémoire
    └── indexer.py
```

---

# 15.2 Serveur MCP complet

```python
# mcp_server.py
import yaml
import json
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

# Initialisation
mcp = FastMCP("harnai-conventions")
qdrant = QdrantClient(host='localhost', port=6333)
encoder = SentenceTransformer("all-MiniLM-L6-v2")
CONVENTIONS_DIR = Path('./conventions')

# ═══════════════════════════════════════════
# TOOLS
# ═══════════════════════════════════════════

@mcp.tool()
def get_code_conventions(language: str = "javascript") -> str:
    """Retourne les conventions de code pour un langage donné."""
    path = CONVENTIONS_DIR / 'code' / f'{language}.yaml'
    if path.exists():
        data = yaml.safe_load(path.read_text())
        return json.dumps(data, indent=2, ensure_ascii=False)
    return f"Conventions pour {language} non trouvées"

@mcp.tool()
def get_design_conventions(conv_type: str = "web") -> str:
    """Retourne les conventions de design (web, motion, ui-ux)."""
    path = CONVENTIONS_DIR / 'design' / f'{conv_type}.yaml'
    if path.exists():
        data = yaml.safe_load(path.read_text())
        return json.dumps(data, indent=2, ensure_ascii=False)
    return f"Conventions {conv_type} non trouvées"

@mcp.tool()
def search_memories(query: str, top_k: int = 5) -> str:
    """Recherche sémantique dans les réalisations passées."""
    embedding = encoder.encode(query).tolist()
    results = qdrant.search(
        collection_name="realizations",
        query_vector=embedding,
        limit=top_k
    )
    return json.dumps([{
        "title": r.payload.get("title"),
        "code": r.payload.get("code", "")[:500],
        "conventions": r.payload.get("conventions", []),
        "score": round(r.score, 3)
    } for r in results], indent=2, ensure_ascii=False)

@mcp.tool()
def save_realization(title: str, code: str, conventions: list) -> str:
    """Sauvegarde une réalisation dans la mémoire."""
    embedding = encoder.encode(f'{title} {code[:200]}').tolist()
    qdrant.upsert(
        collection_name="realizations",
        points=[{
            "id": hash(title) % 10**9,
            "vector": embedding,
            "payload": {
                "title": title,
                "code": code,
                "conventions": conventions
            }
        }]
    )
    return f"Réalisation \"{title}\" sauvegardée"

@mcp.tool()
def execute_skill(skill_name: str, params: str = "{}") -> str:
    """Exécute un skill réutilisable."""
    registry_path = Path('./skills/registry.json')
    registry = json.loads(registry_path.read_text())
    skill = next((s for s in registry if s['name'] == skill_name), None)
    if not skill:
        return f"Skill \"{skill_name}\" non trouvé"
    template_path = Path('./skills/templates') / skill['template']
    if template_path.exists():
        template = template_path.read_text()
        parsed = json.loads(params)
        for key, val in parsed.items():
            template = template.replace(f'{{{{{key}}}}}', str(val))
        return template
    return f"Template {skill['template']} non trouvé"

# ═══════════════════════════════════════════
# RESOURCES
# ═══════════════════════════════════════════

@mcp.resource('conventions://code/{language}')
def get_code_resource(language: str) -> str:
    path = CONVENTIONS_DIR / 'code' / f'{language}.yaml'
    if path.exists():
        return path.read_text()
    return f"# Pas de conventions pour {language}"

@mcp.resource('skills://registry')
def skills_registry() -> str:
    path = Path('./skills/registry.json')
    if path.exists():
        return path.read_text()
    return "[]"

# ═══════════════════════════════════════════
# LANCEMENT
# ═══════════════════════════════════════════
if __name__ == "__main__":
    mcp.run()
```

---

# 15.3 Exemple de convention YAML

```yaml
# conventions/code/javascript.yaml
name: Conventions JavaScript
version: 1.0.0
last_updated: 2026-10-20

rules:
  - name: Naming
    description: camelCase pour variables et fonctions
    examples:
      - good: "const userName = 'John'"
        bad: "const user_name = 'John'"

  - name: Functions
    description: Arrow functions, pas de var
    examples:
      - good: "const add = (a, b) => a + b"

style:
  indent: 2
  quotes: single
  semi: true
```

---

# 15.4 Configuration clients MCP

### Claude Code
```json
{
  "mcpServers": {
    "harnai-conventions": {
      "command": "python",
      "args": ["~/harnai-mcp/mcp_server.py"]
    }
  }
}
```

### Cline (VS Code)
```json
{
  "mcpServers": {
    "harnai-conventions": {
      "command": "python",
      "args": ["~/harnai-mcp/mcp_server.py"]
    }
  }
}
```

### OpenCode
```json
{
  "mcp": {
    "harnai-conventions": {
      "command": "python",
      "args": ["~/harnai-mcp/mcp_server.py"]
    }
  }
}
```

---

# 15.5 Liens

- [[14-harnai-recommendations]] — Recommandations globales
- [[13b-harnai-mcp]] — Focus MCP et registries
- [[06-ai-resource-map]] — Section MCP du DRI principal
- [[13-harnai-overview]] — Vue d'ensemble HarnAI

### Ressources externes

- MCP Python SDK : https://github.com/modelcontextprotocol/python-sdk
- MCP Docs : https://modelcontextprotocol.io/
- Qdrant : https://qdrant.tech/
- Qwen-Agent : https://github.com/QwenLM/Qwen-Agent

*Document généré le 2026-10-20 — Guide MCP custom*