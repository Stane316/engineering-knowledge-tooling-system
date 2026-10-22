---
title: "MOC — HarnAI (Harness IA)"
subtitle: "Map of Content — Écosystèmes harness IA et MCP custom"
date: 2026-10-20
project: HarnAI
tags:
  - moc
  - harnai
  - harness-ia
  - mcp
  - map-of-content
aliases:
  - HarnAI MOC
  - Harness IA MOC
---

# MOC — HarnAI (Harness IA)

> **Projet HarnAI** : Cartographie des écosystèmes open source d'orchestration d'agents IA avec support MCP, et guide pour créer un MCP custom qui centralise les conventions et apprend des réalisations passées.

---

## 📚 Documents HarnAI

### Vue d'ensemble et cartographie

| Doc | Fichier | Contenu | Lignes |
|-----|---------|---------|--------|
| **13** | [[13-harnai/13-harnai-overview\|13-harnai-overview.md]] | Vue d'ensemble, méthodologie, carte des 7 familles, 28 outils | 118 |
| **13a** | [[13-harnai/13a-harnai-catalog\|13a-harnai-catalog.md]] | Catalogue complet des 28 outils (fiches courtes) | 706 |
| **13d** | [[13-harnai/13d-harnai-comparisons\|13d-harnai-comparisons.md]] | Comparaisons par catégorie, Top 10, benchmarks | 144 |

### Focus spécialisés

| Doc | Fichier | Contenu | Lignes |
|-----|---------|---------|--------|
| **13b** | [[13-harnai/13b-harnai-mcp\|13b-harnai-mcp.md]] | Focus MCP : compatibilité, création, registries | 98 |
| **13c** | [[13-harnai/13c-harnai-asia\|13c-harnai-asia.md]] | Focus écosystèmes asiatiques (Chine, Japon, Corée, Inde) | 215 |

### Recommandations et implémentation

| Doc | Fichier | Contenu | Lignes |
|-----|---------|---------|--------|
| **14** | [[14-harnai-recommendations\|14-harnai-recommendations.md]] | Recommandations pour votre cas d'usage (MCP custom) | 86 |
| **15** | [[15-harnai-custom-mcp\|15-harnai-custom-mcp.md]] | Guide complet de création de votre MCP custom | 242 |

### Annexes

| Doc | Fichier | Contenu |
|-----|---------|---------|
| **CSV** | [[catalogue-harnai\|catalogue-harnai.csv]] | Catalogue filtrable des 28 outils (toutes métriques) |
| **Données** | `data/harnai/` | Données JSON brutes (fiches, MCP, asiatiques) |

---

## 🔗 Connexions avec les DRI existants

### → DRI 06 — AI Resource Map

- Section [[06-ai-resource-map#6.2 Couche 2 — MCP (Model Context Protocol)\|6.2 MCP]] : fiches détaillées des MCP existants (GitHub, Playwright, Chrome DevTools, Filesystem, Context7, Figma, etc.)
- Section [[06-ai-resource-map#6.3 Couche 3 — Skills (Agent Skills)\|6.3 Skills]] : format SKILL.md, distribution, catalogues
- Section [[06-ai-resource-map#6.1 Couche 1 — Kits et composants UI pour produits IA\|6.1 Kits UI]] : composants IA pour produits
- **Utilisation** : complément au [[13b-harnai-mcp]] pour les MCP déjà documentés dans le DRI

### → DRI 09 — Resource Stack

- Stacks recommandées (Essential, Strong, Specialized, AI-native)
- [[09-resource-stack\|09-resource-stack.md]] : protocoles de maintenance
- **Utilisation** : base pour la [[14-harnai-recommendations#14.2 Stack optimale recommandée\|stack HarnAI]]

### → DRI 12 — Plans étudiants

- [[12-student-plans\|12-student-plans.md]] : 54 services avec éligibilité
- Certains outils HarnAI peuvent bénéficier de plans étudiants (GitHub Copilot, JetBrains AI, etc.)
- **Utilisation** : si vous êtes étudiant, vérifiez les réductions sur les outils utilisés

### → DRI 01 — Global Resource Map

- [[01-global-resource-map\|01-global-resource-map.md]] : méthodologie générale, labels de confiance
- Les labels [API-gh], [V], [W], [?] sont repris dans HarnAI
- **Utilisation** : référence méthodologique

---

## 📊 Données brutes (workspace)

| Fichier | Description | Taille |
|---------|-------------|--------|
| `data/harnai/sources_map.json` | Carte des sources (91 repos, 8 sites, 8 docs, 6 registries) | 7.3 KB |
| `data/harnai/github/gh_repos.json` | Données GitHub de 28 repos | enrichi |
| `data/harnai/detailed_fiches.json` | 28 fiches détaillées (35+ champs) avec scores | 42 KB |
| `data/harnai/mcp_compatibility.json` | 10 analyses MCP + guide création | 25 KB |
| `data/harnai/asian_ecosystems.json` | 7 outils asiatiques + 4 régions | 18 KB |
| `data/harnai/13c-final-report.md` | Rapport final avec guide d'implémentation | 21 KB |
| `data/harnai/mcp_detection.json` | Détection MCP par outil | 10 KB |
| `data/harnai/url_status.json` | Vérification URLs (25/28 accessibles) | 5 KB |

---

## 🎯 Cas d'usage

### Vous découvrez le projet →
→ Commencez par [[13-harnai/13-harnai-overview|**13-harnai-overview**]] (vue d'ensemble)

### Vous cherchez un outil spécifique →
→ Consultez [[13-harnai/13a-harnai-catalog|**13a-harnai-catalog**]] (28 fiches)

### Vous voulez comparer des outils →
→ Lisez [[13-harnai/13d-harnai-comparisons|**13d-harnai-comparisons**]] (tableaux)

### Vous vous intéressez aux MCP →
→ Lisez [[13-harnai/13b-harnai-mcp|**13b-harnai-mcp**]] + [[06-ai-resource-map#6.2 Couche 2 — MCP (Model Context Protocol)|**06 §6.2**]]

### Vous explorez l'écosystème asiatique →
→ Consultez [[13-harnai/13c-harnai-asia|**13c-harnai-asia**]]

### Vous voulez des recommandations →
→ Lisez [[14-harnai-recommendations|**14-harnai-recommendations**]]

### Vous voulez créer votre MCP custom →
→ Suivez [[15-harnai-custom-mcp|**15-harnai-custom-mcp**]] (guide pas à pas)

---

## 📈 Chiffres clés

| Indicateur | Valeur |
|------------|--------|
| Outils analysés | 28 |
| Familles couvertes | 7 |
| Support MCP | ~45% des outils |
| Régions asiatiques | 4 (Chine, Japon, Corée, Inde) |
| Outils asiatiques | 7 |
| Documents DRI | 7 + 1 CSV |
| Pages totales | ~1 638 lignes |

---

*MOC HarnAI — 2026-10-20*
