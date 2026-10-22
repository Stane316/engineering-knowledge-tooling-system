---
title: "DRI 13 — Harness IA Overview"
subtitle: "Cartographie des écosystèmes open source d'orchestration d'agents IA avec support MCP"
date: "2026-10-20"
project: "HarnAI"
tags:
  - "harnai"
  - "harness-ia"
  - "mcp"
  - "agents"
  - "overview"
  - "cartographie"
family_count: "7"
tools_analyzed: "28"
related:
  - "dri/06-ai-resource-map"
  - "dri/09-resource-stack"
---
# DRI 13 — HARNESS IA OVERVIEW
### Cartographie des écosystèmes open source d'orchestration d'agents IA avec support MCP
**2026-10-20** · Projet HarnAI · 7 familles · 28 outils analysés

> **Objectif** : Documenter les écosystèmes harness IA pour permettre la création d'un **MCP custom** qui centralise les conventions (code, design, sécurité, motion, 3D, web créatif), apprend des réalisations passées, et se connecte à n'importe quel harness via MCP.

---

# 13.1 Méthodologie

### Phases d'analyse

| Phase | Description | Livrable |
|-------|-------------|----------|
| **A** | Cartographie des sources | `sources_map.json` (91 repos, 8 sites, 8 docs, 6 registries MCP) |
| **B** | Exploration GitHub | `gh_repos.json` (28 repos documentés) |
| **C** | Vérification URLs + détection MCP | `url_status.json` (25/28 accessibles), `mcp_detection.json` |
| **D** | Fiches détaillées (35+ champs) | `detailed_fiches.json` (28 fiches avec scores) |
| **E** | Tests compatibilité MCP | `mcp_compatibility.json` (10 analyses approfondies) |
| **F** | Focus écosystèmes asiatiques | `asian_ecosystems.json` (7 outils, 4 régions) |
| **G** | Documents finaux comparatifs | 4 documents dans `data/harnai/` |
| **H** | Synthèse et guide | `13c-final-report.md` (21 KB) |
| **I** | Documents DRI (ce document) | 7 documents + 1 CSV |
| **J** | Interconnexion Obsidian | Wikilinks, MOC, métadonnées |

### Labels de confiance

| Label | Sens |
|-------|------|
| **[API-gh]** | Métadonnée GitHub lue le 20 oct. 2026 (étoiles, licence, dernière poussée) |
| **[V]** | URL vérifiée HTTP 200 le 20 oct. 2026 |
| **[V⚠]** | Site vivant mais protégé anti-bot (403/429) |
| **[W]** | Source Web 2026 citée |
| **[?]** | À vérifier à la source |

---

# 13.2 Carte des 7 familles

| Famille | Description | Outils | Support MCP | Score moyen |
|---------|-------------|--------|-------------|-------------|
| **F1** | Harness CLI | 7 | 2 | 27/100 |
| **F2** | Harness IDE | 3 | 0 | 3/100 |
| **F3** | Agents autonomes SWE-bench | 3 | 0 | 17/100 |
| **F4** | Frameworks d'orchestration | 6 | 1 | 42/100 |
| **F5** | Écosystèmes asiatiques | 3 | 1 | 35/100 |
| **F6** | Écosystème MCP | 4 | 4 | 89/100 |
| **F7** | Outils création MCP | 2 | 2 | 30/100 |

**Total** : 28 outils analysés

### Détail des familles

**F1 — Harness CLI**
- Outils en ligne de commande pour développement assisté par IA. Inclut Claude Code, Codex CLI, OpenCode, Aider, Cline CLI, Browser-use.
- *Note* : Permettent d'automatiser des tâches de développement via des commandes textuelles. Support MCP variable selon l'outil.

**F2 — Harness IDE**
- Environnements de développement intégrés avec IA. Inclut Cursor, Windsurf, Continue.
- *Note* : IDE complets avec intégration IA native. Cursor et Windsurf sont propriétaires, Continue est open source.

**F3 — Agents autonomes SWE-bench**
- Agents autonomes pour résolution de bugs et développement logiciel. Inclut OpenHands, SWE-agent, AutoCodeRover.
- *Note* : Focus sur la résolution automatique de problèmes complexes (SWE-bench). Pas de MCP natif généralement.

**F4 — Frameworks d'orchestration**
- Frameworks pour orchestrer plusieurs agents IA. Inclut LangGraph, CrewAI, AutoGen, Qwen-Agent, smolagents.
- *Note* : Permettent de créer des workflows multi-agents. Qwen-Agent et CrewAI ont le meilleur support MCP.

**F5 — Écosystèmes asiatiques**
- Outils IA développés en Chine, Japon, Corée, Inde. Inclut Qwen-Agent, CodeGeeX, Trae, MarsCode.
- *Note* : Écosystème dominé par la Chine. Qwen-Agent est le seul avec support MCP complet et open source.

**F6 — Écosystème MCP**
- Spécifications MCP, serveurs de référence, registries. Inclut awesome-mcp-servers, modelcontextprotocol/servers, MCP Inspector, MCP CLI.
- *Note* : Écosystème mature avec SDKs Python/TypeScript, registries (mcp.so, Smithery, Glama), et outils de test.

**F7 — Outils création MCP**
- SDKs et outils pour créer des serveurs MCP custom. Inclut python-sdk, typescript-sdk.
- *Note* : Base incontournable pour créer votre propre serveur MCP. SDKs officiels bien documentés.

---

# 13.3 Statistiques globales

| Indicateur | Valeur | Pourcentage |
|------------|--------|-------------|
| Outils analysés | 28 | 100% |
| Support MCP | 10 | 35% |
| Web Browsing | 12 | 42% |
| File Access | 3 | 10% |
| Plugin System | 12 | 42% |
| Skills réutilisables | 7 | 25% |
| API Support | 19 | 67% |

### Répartition par langage

| Langage | Nombre |
|---------|--------|
| Python | 14 |
| TypeScript | 12 |
| None | 2 |

---

# 13.4 Liens vers les autres documents

| Document | Description |
|----------|-------------|
| [[13a-harnai-catalog]] | Catalogue complet des 28 outils |
| [[13b-harnai-mcp]] | Focus MCP : compatibilité, création, registries |
| [[13c-harnai-asia]] | Focus écosystèmes asiatiques |
| [[13d-harnai-comparisons]] | Comparaisons par catégorie |
| [[14-harnai-recommendations]] | Recommandations pour votre cas d'usage |
| [[15-harnai-custom-mcp]] | Guide de création de votre MCP custom |

---

*Document généré le 2026-10-20 — Projet HarnAI*