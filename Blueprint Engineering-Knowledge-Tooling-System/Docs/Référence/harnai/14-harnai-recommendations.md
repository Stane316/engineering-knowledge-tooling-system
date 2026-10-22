---
title: "DRI 14 — HarnAI Recommendations"
subtitle: "Recommandations pour créer votre MCP custom"
date: 2026-10-20
project: HarnAI
tags:
  - harnai
  - recommendations
  - architecture
  - stack
recommended_stack:
  - "Qwen-Agent"
  - "MCP Python SDK"
  - "Qdrant"
implementation_weeks: 6
related:
  - "dri/15-harnai-custom-mcp"
  - "dri/09-resource-stack"
  - "dri/06-ai-resource-map"
---

# DRI 14 — HARNAI RECOMMENDATIONS
### Recommandations pour votre cas d'usage
**2026-10-20** · MCP custom + scraping + mémoire

---

# 14.1 Votre cas d'usage

**Objectif** : Créer un MCP custom qui :
1. Centralise vos conventions (code, design, sécurité, motion, 3D, web créatif)
2. Apprend de vos réalisations passées (mémoire persistante)
3. Se connecte à tout harness via MCP (Claude Code, Cline, OpenCode, etc.)
4. Expose des skills réutilisables sans re-coder
5. Produit du contenu non-générique basé sur vos standards

### Contraintes identifiées

- **MCP obligatoire** : pour compatibilité avec tous les harness
- **Open source** : pour personnalisation et contrôle
- **Mémoire persistante** : pour apprentissage des réalisations
- **Scraping web** : pour collecte de données externes
- **Skills réutilisables** : pour éviter de re-coder

---

# 14.2 Stack optimale recommandée

| Composant | Choix | Justification | Score/Stars |
|-----------|-------|---------------|-------------|
| **Framework IA** | QwenLM/Qwen-Agent | Meilleur support MCP natif des frameworks | 80/100, 17.2K★ |
| **MCP SDK** | modelcontextprotocol/python-sdk | SDK officiel Python, le plus complet | 100/100, 24.6K★ |
| **MCP Inspector** | modelcontextprotocol/inspector | Tests et debug, interface web | 70/100, 11.1K★ |
| **Base vectorielle** | Qdrant | Mémoire persistante, open source, performant | Open source |
| **Embedding** | sentence-transformers | all-MiniLM-L6-v2 (rapide, léger, multilingue) | Open source |
| **Scraping** | jina-ai/reader | Extraction web simple, API REST | 12.2K★ |
| **Multi-agent (backup)** | CrewAIInc/crewAI | Alternative orchestration si besoin | 80/100, 75K★ |

### Alternatives selon cas d'usage

| Cas d'usage | Alternative | Justification |
|-------------|-------------|---------------|
| **Besoin IDE complet** | opencode-ai/opencode | IDE open source avec MCP (80/100) |
| **Besoin CLI rapide** | IBM/mcp-cli | Prototypage MCP sans coder (100/100) |
| **Besoin TypeScript** | modelcontextprotocol/typescript-sdk | SDK officiel TypeScript |
| **Besoin multi-agent avancé** | microsoft/autogen | Orchestration complexe (50/100) |

---

# 14.3 Architecture recommandée

```
┌─────────────────────────────────────────────────────────┐
│         VOTRE MCP CUSTOM (harnai-conventions)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tools MCP :                                            │
│  ├── get_code_conventions(language)                     │
│  ├── get_design_conventions(type)                       │
│  ├── search_memories(query, top_k)                      │
│  ├── save_realization(title, code, conventions)         │
│  ├── execute_skill(skill_name, params)                  │
│  └── web_scrape_custom(url, rules)                      │
│                                                         │
│  Resources MCP :                                        │
│  ├── conventions://code/{language}                      │
│  └── skills://registry                                  │
│                                                         │
│  Stockage :                                             │
│  ├── YAML files → Conventions (Git)                     │
│  ├── Qdrant → Mémoire vectorielle                       │
│  └── JSON → Skills registry                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    ↕ MCP Protocol (stdio/SSE)
┌─────────────────────────────────────────────────────────┐
│         HARNESS COMPATIBLES (Clients MCP)              │
├─────────────────────────────────────────────────────────┤
│  Claude Code · Cline · OpenCode · Cursor · Qwen-Agent  │
└─────────────────────────────────────────────────────────┘
```

### Flux de données

1. **Utilisateur** → demande à un harness (Claude Code, Cline, etc.)
2. **Harness** → appelle votre MCP custom via protocole MCP
3. **MCP custom** → exécute le tool (get_conventions, search_memories, etc.)
4. **MCP custom** → retourne le résultat au harness
5. **Harness** → utilise le résultat pour répondre à l'utilisateur

---

# 14.4 Plan d'implémentation

| Semaine | Actions | Livrables | Temps estimé |
|---------|---------|-----------|--------------|
| **S1** | Setup : installer MCP SDK, Qdrant, créer structure | `mcp_server.py` de base | 1-2 jours |
| **S2** | Implémenter 3 tools : conventions (code, design, security) | 3 YAML de conventions | 2-3 jours |
| **S3** | Implémenter mémoire RAG (search_memories, save_realization) | Qdrant opérationnel | 2-3 jours |
| **S4** | Créer 5 skills de base + registry.json | Skills testés | 3-4 jours |
| **S5** | Intégrer avec 2 harness (Claude Code + Cline) | Config MCP clients | 2-3 jours |
| **S6+** | Itérer, ajouter conventions, améliorer skills | Améliorations continues | Continu |

### Checklist de démarrage

- [ ] Installer Python 3.10+
- [ ] Installer Docker (pour Qdrant)
- [ ] Créer projet `harnai-mcp/`
- [ ] Installer dépendances : `pip install mcp[cli] qdrant-client sentence-transformers pyyaml`
- [ ] Lancer Qdrant : `docker run -d -p 6333:6333 qdrant/qdrant`
- [ ] Créer `mcp_server.py` avec FastMCP
- [ ] Tester avec MCP Inspector : `npx @modelcontextprotocol/inspector`

---

# 14.5 Cas d'usage concrets

### Cas 1 : Créer un composant web avec vos conventions

```
Vous : "Crée un composant Button avec animation fade-in"

Harness IA → MCP harnai-conventions :
  1. get_code_conventions("javascript")
     → Retourne vos règles de naming, style, etc.
  2. get_design_conventions("web")
     → Retourne vos conventions de design web
  3. search_memories("button animation fade")
     → Trouve vos réalisations passées similaires
  4. execute_skill("create-web-component", {name: "Button", animation: "fade"})
     → Génère le code avec VOS conventions appliquées
  5. save_realization("Button fade-in", code, ["code/js", "design/web"])
     → Sauvegarde pour apprentissage futur
```

### Cas 2 : Recherche dans les réalisations passées

```
Vous : "Comment j'ai fait l'animation 3D du projet X ?"

Harness IA → MCP harnai-conventions :
  1. search_memories("animation 3D projet X", top_k=3)
     → Retourne les réalisations similaires avec code
  2. get_design_conventions("3d")
     → Rappel des conventions 3D
```

---

# 14.6 Liens

- [[15-harnai-custom-mcp]] — Guide complet de création MCP custom
- [[13b-harnai-mcp]] — Focus MCP et registries
- [[06-ai-resource-map]] — Section MCP du DRI principal
- [[09-resource-stack]] — Stacks recommandées
- [[harnai-moc]] — MOC HarnAI

*Document généré le 2026-10-20 — Recommandations*
