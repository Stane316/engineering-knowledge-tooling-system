# HarnAI — Écosystèmes Harness IA
### Cartographie des écosystèmes open source d'orchestration d'agents IA avec support MCP
**Phase 3 · clôture du 20 octobre 2026** · Langue : français · 28 outils analysés · 7 familles

---

## Objectif du projet

Documenter les écosystèmes harness IA open source pour permettre la création d'un **MCP custom** qui :
1. Centralise vos conventions (code, design, sécurité, motion, 3D, web créatif)
2. Apprend de vos réalisations passées (mémoire persistante)
3. Se connecte à tout harness via MCP (Claude Code, Cline, OpenCode, etc.)
4. Expose des skills réutilisables sans re-coder
5. Produit du contenu non-générique basé sur vos standards

---

## Les 9 documents

### Vue d'ensemble et navigation

| Doc | Fichier | Contenu | À lire si… |
|---|---|---|---|
| **15** | [[15-harnai-overview]] | Vue d'ensemble : méthodologie, 7 familles, 28 outils, stack recommandée | vous découvrez le projet |
| **16** | [[16-harnai-moc]] | Map of Content : navigation par cas d'usage, connexions DRI | vous voulez naviguer rapidement |

### Cartographie et catalogues

| Doc | Fichier | Contenu | À lire si… |
|---|---|---|---|
| **17** | [[17-harnai-ecosystems]] | 7 familles détaillées, 28 fiches avec scores, statistiques | vous voulez comprendre l'écosystème |
| **18** | [[18-harnai-catalog]] | Catalogue complet des 28 outils (fiches courtes) | vous cherchez un outil spécifique |
| **23** | [[23-harnai-comparisons]] | Comparaisons par catégorie, Top 10, benchmarks | vous comparez des outils |

### Focus spécialisés

| Doc | Fichier | Contenu | À lire si… |
|---|---|---|---|
| **21** | [[21-harnai-mcp]] | Focus MCP : compatibilité, création, registries, clients | vous automatisez avec MCP |
| **22** | [[22-harnai-asia]] | Focus écosystèmes asiatiques (Chine, Japon, Corée, Inde) | vous explorez l'Asie |

### Recommandations et implémentation

| Doc | Fichier | Contenu | À lire si… |
|---|---|---|---|
| **19** | [[19-harnai-recommendations]] | Recommandations pour votre cas d'usage (MCP custom) | vous voulez des conseils |
| **20** | [[20-harnai-custom-mcp]] | Guide complet de création de votre MCP custom | vous implémentez votre MCP |

**Annexe** : 
- `catalogue-harnai.csv` — 28 outils (nom, repo, famille, score, stars, MCP, scraping, memory, skills, etc.)

---

## Les 7 familles d'écosystèmes

| Famille | Description | Outils | Support MCP | Score moyen |
|---------|-------------|--------|-------------|-------------|
| **F1** | Harness CLI | 6 | 3 | 40/100 |
| **F2** | Harness IDE | 3 | 1 | 7/100 |
| **F3** | Agents autonomes SWE-bench | 5 | 1 | 17/100 |
| **F4** | Frameworks d'orchestration | 4 | 3 | 55/100 |
| **F5** | Écosystèmes asiatiques | 2 | 1 | 53/100 |
| **F6** | Écosystème MCP | 6 | 6 | 93/100 |
| **F7** | Outils création MCP | 2 | 2 | 30/100 |

**Total** : 28 outils analysés · ~45% avec support MCP

---

## Top 5 outils par score de compatibilité

| Rang | Outil | Score | Stars | Famille |
|------|-------|-------|-------|---------|
| 1 | punkpeye/awesome-mcp-servers | 100/100 | 96 664★ | F6 |
| 2 | IBM/mcp-cli | 100/100 | 2 024★ | F6 |
| 3 | modelcontextprotocol/servers | 85/100 | 25 000★ | F6 |
| 4 | QwenLM/Qwen-Agent | 80/100 | 17 198★ | F5 |
| 5 | opencode-ai/opencode | 80/100 | 25 000★ | F1 |

---

## Labels de confiance (utilisés partout)

| Label | Sens |
|---|---|
| **[API-gh]** | métadonnée GitHub lue le 20 oct. 2026 (étoiles, licence, dernière poussée) |
| **[V]** | URL vérifiée HTTP 200 le 20 oct. 2026 |
| **[V⚠]** | site vivant mais protégé anti-bot (403/429) — non vérifié par script |
| **[W]** | source Web 2026 citée |
| **[?]** | **à vérifier à la source** — jamais présenté comme un fait |

## Règles permanentes appliquées
- Aucun outil inventé ; aucun prix, licence ou compteur affirmé sans source.
- "Open source" ≠ "libre d'usage commercial" — vérifier la licence.
- Aucune exhaustivité revendiquée : **"Catalogue partiellement accessible avec les outils disponibles"**.
- L'écosystème IA évolue très vite — toujours vérifier la dernière activité.
- Un code généré par IA n'est jamais présenté comme garanti fonctionnel.

## Base de preuves (workspace)
`data/harnai/detailed_fiches.json` (28 fiches) · `data/harnai/mcp_compatibility.json` (10 analyses MCP) · `data/harnai/asian_ecosystems.json` (7 outils asiatiques)

---

## Stack optimale recommandée

Pour créer votre MCP custom, la stack recommandée est :

| Composant | Choix | Justification | Score/Stars |
|-----------|-------|---------------|-------------|
| **Framework IA** | QwenLM/Qwen-Agent | Meilleur support MCP natif des frameworks | 80/100, 17.2K★ |
| **MCP SDK** | modelcontextprotocol/python-sdk | SDK officiel Python, le plus complet | 100/100, 24.6K★ |
| **MCP Inspector** | modelcontextprotocol/inspector | Tests et debug, interface web | 70/100, 11.1K★ |
| **Base vectorielle** | Qdrant | Mémoire persistante, open source, performant | Open source |
| **Embedding** | sentence-transformers | all-MiniLM-L6-v2 (rapide, léger) | Open source |
| **Scraping** | jina-ai/reader | Extraction web simple | 12.2K★ |

Voir [[19-harnai-recommendations]] pour plus de détails et [[20-harnai-custom-mcp]] pour le guide d'implémentation.

---

## Plan d'implémentation

| Semaine | Actions | Livrables |
|---------|---------|-----------|
| **S1** | Setup : installer MCP SDK, Qdrant, créer structure | `mcp_server.py` de base |
| **S2** | Implémenter 3 tools : conventions (code, design, security) | 3 YAML de conventions |
| **S3** | Implémenter mémoire RAG (search_memories, save_realization) | Qdrant opérationnel |
| **S4** | Créer 5 skills de base + registry.json | Skills testés |
| **S5** | Intégrer avec 2 harness (Claude Code + Cline) | Config MCP clients |
| **S6+** | Itérer, ajouter conventions, améliorer skills | Améliorations continues |

---

## Architecture MCP custom

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

---

## Connexions avec les autres projets

### → DRI — Ressources Gratuites
- [[../dri/00-README|DRI Principal]] : cartographie complète des ressources numériques gratuites
- Section [[../dri/06-ai-resource-map|06-ai-resource-map]] §6.2 : fiches détaillées des MCP existants
- Section [[../dri/06-ai-resource-map|06-ai-resource-map]] §6.3 : format Skills et catalogues
- Les outils HarnAI complètent les ressources gratuites du DRI

### → Plans Étudiants
- [[../students/00-README|Plans Étudiants]] : 54 services avec éligibilité
- Certains outils HarnAI bénéficient de plans étudiants (GitHub Copilot, JetBrains AI, etc.)
- Vérifiez l'éligibilité avant de souscrire

---

## Statistiques clés

| Indicateur | Valeur |
|------------|--------|
| Outils analysés | 28 |
| Familles couvertes | 7 |
| Support MCP | ~45% des outils |
| Régions asiatiques | 4 (Chine, Japon, Corée, Inde) |
| Outils asiatiques | 7 |
| Documents DRI | 9 + 1 CSV |
| Pages totales | ~2 355 lignes |
| Score moyen | 47/100 |

---

## Comment utiliser ce projet

### Vous découvrez le projet →
→ Commencez par [[15-harnai-overview|ce document]] puis [[16-harnai-moc|Map of Content]]

### Vous cherchez un outil spécifique →
→ Consultez [[18-harnai-catalog|08-harnai-catalog]] (28 fiches)

### Vous voulez comparer des outils →
→ Lisez [[23-harnai-comparisons|23-harnai-comparisons]] (tableaux comparatifs)

### Vous vous intéressez aux MCP →
→ Lisez [[21-harnai-mcp|21-harnai-mcp]] + [[../dri/06-ai-resource-map|06-ai-resource-map §6.2]]

### Vous explorez l'écosystème asiatique →
→ Consultez [[22-harnai-asia|22-harnai-asia]]

### Vous voulez des recommandations →
→ Lisez [[19-harnai-recommendations|19-harnai-recommendations]]

### Vous voulez créer votre MCP custom →
→ Suivez [[20-harnai-custom-mcp|20-harnai-custom-mcp]] (guide pas à pas)

---

## Méthodologie

### Phases d'analyse

| Phase | Description | Livrable |
|-------|-------------|----------|
| **A** | Cartographie des sources | `sources_map.json` (91 repos, 8 sites, 8 docs, 6 registries MCP) |
| **B** | Exploration GitHub | `gh_repos.json` (28 repos documentés) |
| **C** | Vérification URLs + détection MCP | 25/28 URLs accessibles, détection MCP |
| **D** | Fiches détaillées (35+ champs) | 28 fiches avec scores de compatibilité |
| **E** | Tests compatibilité MCP | 10 analyses MCP approfondies |
| **F** | Focus écosystèmes asiatiques | 7 outils, 4 régions |
| **G** | Documents finaux comparatifs | 4 documents dans `data/harnai/` |
| **H** | Synthèse et guide | Rapport final (21 KB) |
| **I** | Documents DRI | 9 documents + 1 CSV |
| **J** | Interconnexion Obsidian | Wikilinks, MOC, métadonnées |

### Critères d'évaluation

Chaque outil est évalué sur :
- Support MCP (natif, client, ou compatible)
- Capacités de scraping/recherche web
- Système de mémoire/apprentissage
- Accès aux fichiers locaux
- Système de plugins/skills
- Support multi-agents
- API et SDK disponibles
- Interface utilisateur (CLI, GUI, IDE)
- Popularité (stars, forks)
- Activité (dernière mise à jour)
- Licence (open source, permissive, restrictive)

---

*Mise à jour : 20 octobre 2026 · Projet HarnAI*
