# Recherche — Ressources Numériques
### Cartographie et documentation des ressources numériques : gratuites, étudiantes, et écosystèmes IA
**Mise à jour : 20 octobre 2026** · Langue : français

---

## Bienvenue

Ce dossier contient **3 projets de recherche** complémentaires sur les ressources numériques :

| Projet | Description | Documents | Outils/Services |
|--------|-------------|-----------|-----------------|
| **DRI** | Ressources numériques **gratuites** réutilisables | 12 documents (00-11) | 177 ressources |
| **Students** | Plans **étudiants** et réductions | 3 documents (12-14) | 54 services |
| **HarnAI** | Écosystèmes **harness IA** avec support MCP | 9 documents (15-23) | 28 outils |

---

## 1. DRI — Ressources Gratuites (00-11)

### 📚 [→ Accéder au dossier DRI](dri/00-README.md)

**Objectif** : Cartographier exhaustivement les ressources numériques gratuites (open source, freemium, gratuits) pour le développement web, le design, l'IA, la 3D, etc.

**Documents** :
- **00** : [[dri/00-README|README]] — Point d'entrée
- **01** : [[dri/01-global-resource-map|Carte globale]] — Vue d'ensemble des 16 familles
- **02** : [[dri/02-taxonomy|Taxonomie]] — 30 natures de ressources
- **03** : [[dri/03-platform-directory|Plateformes]] — Fiches des plateformes Tier A/B/C
- **04** : [[dri/04-resource-catalog|Catalogue]] — Ressources individuelles
- **05** : [[dri/05-technology-map|Technologies]] — Matrices tech
- **06** : [[dri/06-ai-resource-map|IA & MCP]] — Kits IA, MCP, Skills, orchestrateurs
- **07** : [[dri/07-use-case-index|Cas d'usage]] — 11 blocs de besoins
- **08** : [[dri/08-decision-matrix|Décision]] — Decision Engine à 8 canaux
- **09** : [[dri/09-resource-stack|Stacks]] — Stacks Essential/Strong/Specialized
- **10** : [[dri/10-verticals|Verticaux]] — 6 métiers (e-commerce, éducation, SaaS, etc.)
- **11** : [[dri/11-cost-at-scale|Coûts]] — Coût à l'échelle (10K/100K/1M utilisateurs)

**Annexe** : [[dri/catalogue-dri|catalogue-dri.csv]] (177 ressources)

**Statistiques** :
- Ressources analysées : 177
- URLs vérifiées : 464 (en 200)
- Familles couvertes : 16
- Pages de documentation : 3 328 lignes

---

## 2. Students — Plans Étudiants (12-14)

### 🎓 [→ Accéder au dossier Students](students/00-README.md)

**Objectif** : Cataloguer les réductions et offres étudiantes pour les outils numériques (développement, design, IA, productivité, etc.)

**Documents** :
- **12** : [[students/12-student-plans|Plans étudiants]] — 54 services avec éligibilité Bénin
- **13** : [[students/13-student-catalog|Catalogue détaillé]] — Fiches complètes des 54 services
- **14** : [[students/14-student-africa|Focus Afrique]] — Éligibilité par pays (10 pays africains)

**Annexe** : [[students/catalogue-student|catalogue-student.csv]] (54 services)

**Statistiques** :
- Services catalogués : 54
- Éligibilité Bénin : 42/54 (78%)
- Réduction moyenne : 50-100%
- Durée moyenne : 1-2 ans
- Pages de documentation : 2 438 lignes

---

## 3. HarnAI — Harness IA (15-23)

### 🤖 [→ Accéder au dossier HarnAI](harnai/15-harnai-overview.md)

**Objectif** : Documenter les écosystèmes harness IA open source pour créer un MCP custom qui centralise les conventions et apprend des réalisations passées.

**Documents** :
- **15** : [[harnai/15-harnai-overview|Vue d'ensemble]] — Méthodologie, 7 familles, 28 outils
- **16** : [[harnai/16-harnai-moc|Map of Content]] — Navigation par cas d'usage
- **17** : [[harnai/17-harnai-ecosystems|7 familles]] — Fiches détaillées avec scores
- **18** : [[harnai/18-harnai-catalog|Catalogue]] — 28 outils (fiches courtes)
- **19** : [[harnai/19-harnai-recommendations|Recommandations]] — Stack optimale, cas d'usage
- **20** : [[harnai/20-harnai-custom-mcp|MCP Custom]] — Guide de création pas à pas
- **21** : [[harnai/21-harnai-mcp|Focus MCP]] — Compatibilité, création, registries
- **22** : [[harnai/22-harnai-asia|Focus Asie]] — Chine, Japon, Corée, Inde
- **23** : [[harnai/23-harnai-comparisons|Comparaisons]] — Top 10, benchmarks

**Annexe** : [[harnai/catalogue-harnai|catalogue-harnai.csv]] (28 outils)

**Statistiques** :
- Outils analysés : 28
- Support MCP : ~45% des outils
- Familles couvertes : 7
- Score moyen : 47/100
- Pages de documentation : 2 355 lignes

---

## Connexions entre les projets

### DRI ↔ Students
- Certains services du DRI sont aussi disponibles avec des plans étudiants
- Les plans étudiants complètent les offres gratuites du DRI
- Exemple : GitHub Copilot est gratuit via GitHub Student Developer Pack

### DRI ↔ HarnAI
- Section [[dri/06-ai-resource-map|06-ai-resource-map]] §6.2 : fiches détaillées des MCP existants
- Section [[dri/06-ai-resource-map|06-ai-resource-map]] §6.3 : format Skills et catalogues
- Les outils HarnAI complètent les ressources gratuites du DRI

### Students ↔ HarnAI
- Certains outils HarnAI bénéficient de plans étudiants (GitHub Copilot, JetBrains AI, etc.)
- Vérifiez l'éligibilité dans le catalogue Students avant de souscrire

---

## Structure du workspace

```
recherche/
├── 00-README.md              ← Vous êtes ici
├── SYNTHESE.md               ← Document de synthèse
│
├── dri/                      # Ressources gratuites (00-11)
│   ├── 00-README.md
│   ├── 01-global-resource-map.md
│   ├── ...
│   ├── 11-cost-at-scale.md
│   └── catalogue-dri.csv
│
├── students/                 # Plans étudiants (12-14)
│   ├── 00-README.md
│   ├── 12-student-plans.md
│   ├── 13-student-catalog.md
│   ├── 14-student-africa.md
│   └── catalogue-student.csv
│
└── harnai/                   # Harness IA (15-23)
    ├── 15-harnai-overview.md
    ├── 16-harnai-moc.md
    ├── 17-harnai-ecosystems.md
    ├── 18-harnai-catalog.md
    ├── 19-harnai-recommendations.md
    ├── 20-harnai-custom-mcp.md
    ├── 21-harnai-mcp.md
    ├── 22-harnai-asia.md
    ├── 23-harnai-comparisons.md
    └── catalogue-harnai.csv
```

---

## Labels de confiance

Tous les projets utilisent les mêmes labels :

| Label | Sens |
|-------|------|
| **[V]** | URL vérifiée HTTP 200 |
| **[V⚠]** | Site vivant mais protégé anti-bot |
| **[W]** | Source Web citée |
| **[?]** | À vérifier à la source |
| **[API-gh]** | Métadonnée GitHub (HarnAI et DRI) |

---

## Règles permanentes

1. **Aucune information inventée** — tout est sourcé et vérifié
2. **"Gratuit" ≠ "libre d'usage commercial"** — vérifier les licences
3. **Aucune exhaustivité revendiquée** — catalogues partiels mais structurés
4. **Les offres évoluent** — toujours vérifier sur les sites officiels
5. **Code IA ≠ garanti fonctionnel** — toujours tester avant utilisation

---

## Statistiques globales

| Projet | Documents | Ressources/Pages | Lignes | CSV |
|--------|-----------|------------------|--------|-----|
| **DRI** | 12 | 177 ressources | 3 328 | 178 lignes |
| **Students** | 3 | 54 services | 2 438 | 55 lignes |
| **HarnAI** | 9 | 28 outils | 2 355 | 29 lignes |
| **TOTAL** | **24** | **259 entrées** | **8 121** | **3 CSV** |

---

## Comment utiliser ce workspace

### Vous découvrez les ressources numériques →
→ Commencez par [[dri/00-README|DRI]] — ressources gratuites complètes

### Vous êtes étudiant et cherchez des réductions →
→ Consultez [[students/00-README|Students]] — 54 services avec éligibilité

### Vous travaillez avec des agents IA et MCP →
→ Explorez [[harnai/15-harnai-overview|HarnAI]] — écosystèmes harness IA

### Vous voulez tout comprendre →
→ Lisez les 3 READMEs dans l'ordre : DRI → Students → HarnAI

---

## Crédits et méthodologie

### DRI
- **Méthodologie** : 5 plateformes seeds, vérification HTTP, métadonnées GitHub/npm
- **Outils** : Python, scripts de scraping, vérification URLs
- **Données** : `data/gh/`, `data/npm_*.json`, `data/url_status.json`

### Students
- **Méthodologie** : Scraping des pages d'offres étudiantes, vérification éligibilité
- **Outils** : Python, scripts de scraping
- **Données** : `data/students/services_scraped.json`

### HarnAI
- **Méthodologie** : 11 phases d'analyse (cartographie, GitHub, URLs, fiches, MCP, Asie)
- **Outils** : Python, GitHub API, scripts d'analyse
- **Données** : `data/harnai/detailed_fiches.json`, `mcp_compatibility.json`, `asian_ecosystems.json`

---

*Mise à jour : 20 octobre 2026 · Projet Recherche*
