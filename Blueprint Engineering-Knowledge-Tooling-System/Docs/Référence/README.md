# Espace de Référence — Engineering Knowledge Tooling System (EKTS)

**Date de création :** 21 octobre 2026  
**Dernière vérification :** 21 octobre 2026  
**Statut :** ✅ Référence consolidée

---

## Rôle du dossier

Cet espace contient toutes les recherches, ressources et documents de référence du projet EKTS, organisés de manière consultable et exploitable par les agents IA et les développeurs.

Il sert de **source de vérité documentaire** pour :
- Les décisions techniques
- Les ressources identifiées (gratuites, étudiantes, MCP)
- Les recherches effectuées
- Les audits et validations
- L'architecture et la roadmap

---

## Périmètre

Ce dossier contient :
- ✅ Les recherches initiales (DRI, HarnAI, plans étudiants)
- ✅ Les documents de cadrage (blueprint, architecture)
- ✅ Les ressources gratuites et plans étudiants
- ✅ Les recherches sur les outils MCP
- ✅ Les audits techniques (écosystème agentique)
- ✅ Les cartographies et matrices de décision
- ✅ Les ressources Human Brilliance (PDF outils IA)

Ce dossier ne contient pas :
- ❌ Le code source du projet (dans `Engineering-Knowledge-Tooling-System/src/`)
- ❌ Les données brutes temporaires (supprimées lors de la purge)
- ❌ Les scripts de scraping (supprimés lors de la purge)

---

## Organisation

### Structure principale

```
Référence/
├── README.md                          ← Ce fichier (index)
├── 00-README.md                       ← Index original des recherches
├── SYNTHESE.md                        ← Synthèse globale des recherches
├── VERIFICATION.md                    ← Vérifications effectuées
│
├── dri/                               ← Digital Resources Inventory (version complète)
│   ├── 00-README.md                   ← Index DRI complet (avec extensions)
│   ├── 01-global-resource-map.md
│   ├── 02-taxonomy.md
│   ├── 03-platform-directory.md
│   ├── 04-resource-catalog.md
│   ├── 05-technology-map.md
│   ├── 06-ai-resource-map.md          ← Version complète avec MCP
│   ├── 07-use-case-index.md
│   ├── 08-decision-matrix.md
│   ├── 09-resource-stack.md           ← Version complète avec coverage
│   ├── 10-verticals.md
│   └── 11-cost-at-scale.md
│   └── catalogue-dri.csv
│
├── harnai/                            ← Recherche HarnAI (MCP + outils)
│   ├── 13-harnai/                     ← Version alternative (depuis dri/)
│   │   ├── 13-harnai-overview.md
│   │   ├── 13a-harnai-catalog.md
│   │   ├── 13b-harnai-mcp.md
│   │   ├── 13c-harnai-asia.md
│   │   └── 13d-harnai-comparisons.md
│   ├── 15-harnai-overview.md
│   ├── 16-harnai-moc.md
│   ├── 17-harnai-ecosystems.md
│   ├── 18-harnai-catalog.md
│   ├── 19-harnai-recommendations.md
│   ├── 20-harnai-custom-mcp.md
│   ├── 21-harnai-mcp.md
│   ├── 22-harnai-asia.md
│   ├── 23-harnai-comparisons.md
│   ├── harnai-moc.md                  ← Map of Content
│   ├── catalogue-harnai.csv
│   └── README.md
│
├── students/                          ← Plans étudiants (version complète)
│   ├── 00-README.md
│   ├── 12-student-plans.md            ← 54 services catalogués
│   ├── 12a-student-catalog.md         ← Fiches détaillées
│   ├── 12b-student-africa.md          ← Focus Afrique
│   ├── 13-student-catalog.md
│   ├── 14-student-africa.md
│   └── catalogue-student.csv
│
├── Human-Brilliance/                  ← Ressources Human Brilliance
│   ├── README.md                      ← Index Human Brilliance
│   └── Outils-IA-par-domaine.pdf      ← PDF ~9.8 MB
│
├── Blueprint_Systeme_Ingenierie_IA.md ← Document de cadrage initial
├── cartographie-creation-numerique.md ← Cartographie création numérique
├── matrice-decision.csv               ← Matrice de décision technique
└── AUDIT-ECOSYSTEME-AGENTIQUE.md      ← Audit de l'écosystème agentique
```

---

## Principaux documents

### Cadrage et architecture

| Document | Rôle | À lire si... |
|----------|------|--------------|
| `Blueprint_Systeme_Ingenierie_IA.md` | Vision et cadrage initial du projet | Vous découvrez le projet |
| `SYNTHESE.md` | Synthèse globale des recherches | Vous voulez une vue d'ensemble rapide |
| `VERIFICATION.md` | Vérifications effectuées | Vous voulez comprendre la méthode |
| `AUDIT-ECOSYSTEME-AGENTIQUE.md` | Audit des capacités agentiques | Vous évaluez les outils disponibles |

### Ressources numériques (DRI)

| Document | Contenu | À lire si... |
|----------|---------|--------------|
| `dri/01-global-resource-map.md` | Carte mondiale des ressources | Vous cherchez des ressources par domaine |
| `dri/02-taxonomy.md` | Taxonomie des ressources | Vous comprenez la classification |
| `dri/03-platform-directory.md` | Répertoire des plateformes | Vous cherchez une plateforme spécifique |
| `dri/04-resource-catalog.md` | Catalogue des ressources | Vous cherchez un type de ressource |
| `dri/05-technology-map.md` | Carte technologique | Vous comparez les technologies |
| `dri/06-ai-resource-map.md` | Carte des ressources IA | Vous cherchez des outils IA |
| `dri/07-use-case-index.md` | Index des cas d'usage | Vous avez un cas d'usage spécifique |
| `dri/08-decision-matrix.md` | Matrice de décision | Vous devez choisir entre plusieurs options |
| `dri/09-resource-stack.md` | Stacks recommandées | Vous construisez une stack |
| `dri/10-verticals.md` | Verticales métier | Vous ciblez un secteur spécifique |
| `dri/11-cost-at-scale.md` | Coûts à l'échelle | Vous planifiez un budget |

### Plans étudiants

| Document | Contenu | À lire si... |
|----------|---------|--------------|
| `students/12-student-plans.md` | 54 services avec réductions étudiantes | Vous êtes étudiant ou formez des étudiants |
| `students/13-student-catalog.md` | Catalogue détaillé des 54 services | Vous voulez les détails d'un service |
| `students/14-student-africa.md` | Focus Afrique (éligibilité par pays) | Vous êtes dans un pays africain |
| `catalogue-student.csv` | Données structurées (CSV) | Vous voulez filtrer/trier les données |

### HarnAI — Outils MCP et IA

| Document | Contenu | À lire si... |
|----------|---------|--------------|
| `harnai/15-harnai-overview.md` | Vue d'ensemble : méthodologie, 7 familles, 28 outils | Vous découvrez HarnAI |
| `harnai/16-harnai-moc.md` | Map of Content HarnAI | Vous voulez naviguer dans HarnAI |
| `harnai/17-harnai-ecosystems.md` | Écosystèmes d'outils | Vous comparez les écosystèmes |
| `harnai/18-harnai-catalog.md` | Catalogue complet des 28 outils | Vous cherchez un outil spécifique |
| `harnai/19-harnai-recommendations.md` | Recommandations | Vous voulez des conseils |
| `harnai/20-harnai-custom-mcp.md` | Guide création MCP custom | Vous implémentez votre MCP |
| `harnai/21-harnai-mcp.md` | Focus MCP : compatibilité, registries | Vous automatisez avec MCP |
| `harnai/22-harnai-asia.md` | Focus écosystèmes asiatiques | Vous explorez l'Asie |
| `harnai/23-harnai-comparisons.md` | Comparaisons, Top 10, benchmarks | Vous comparez des outils |
| `catalogue-harnai.csv` | Données structurées (CSV) | Vous voulez filtrer/trier les données |

### Cartographies et matrices

| Document | Contenu | À lire si... |
|----------|---------|--------------|
| `cartographie-creation-numerique.md` | Cartographie complète de la création numérique | Vous explorez la création numérique |
| `matrice-decision.csv` | Matrice de décision technique | Vous devez prendre une décision technique |

### Human Brilliance — Ressources IA

| Document | Contenu | À lire si... |
|----------|---------|--------------|
| `Human-Brilliance/Outils-IA-par-domaine.pdf` | Outils IA par domaine de création | Vous explorez les outils IA pour la création |
| `Human-Brilliance/README.md` | Index et guide d'utilisation | Vous voulez comprendre le contenu |

---

## Ressources gratuites identifiées

### Services avec plans gratuits

- **GitHub** : Pack étudiant (GitHub Pro gratuit)
- **JetBrains** : Licences gratuites pour étudiants
- **Google AI** : Crédits gratuits (Google Cloud, AI Platform)
- **Azure** : Crédits gratuits (Azure for Students)
- **Mistral** : Accès gratuit à certains modèles
- **Notion** : Plan gratuit pour étudiants
- **Figma** : Plan gratuit pour étudiants
- **Adobe** : Réductions étudiantes
- **Kaggle** : Accès gratuit aux notebooks et datasets

### Plateformes UI gratuites

- **shadcn/ui** : Composants React gratuits
- **Magic UI** : Composants animés gratuits
- **Aceternity UI** : Composants gratuits
- **ReactBits** : Composants React gratuits
- **KokonutUI** : Composants gratuits
- **Cult UI** : Composants gratuits
- **Motion Primitives** : Primitives d'animation gratuites
- **Animate UI** : Composants animés gratuits

**Voir :** `dri/04-resource-catalog.md` pour le catalogue complet

---

## Plans étudiants détaillés

**54 services catalogués** avec :
- Prix standard vs prix étudiant
- Durée de l'offre
- Éligibilité par pays (Bénin, Afrique)
- Liens directs
- Vérification des conditions

**Voir :** `students/12-student-plans.md` et `students/14-student-africa.md`

---

## Recherches MCP

**28 outils MCP catalogués** avec :
- Noms, repos, familles
- Scores, stars GitHub
- Compatibilité MCP
- Capacités de scraping
- Memory, skills
- Écosystèmes (Asie, etc.)

**Voir :** `harnai/18-harnai-catalog.md` et `catalogue-harnai.csv`

---

## Architecture et roadmap

L'architecture technique et la roadmap détaillée se trouvent dans :

- `Engineering-Knowledge-Tooling-System/Docs/02-ARCHITECTURE-TECHNIQUE.md`
- `Engineering-Knowledge-Tooling-System/Docs/roadmap/`

---

## Distinction entre ressources externes et décisions du projet

### Ressources externes (références)

Ce dossier contient des **références externes** :
- Listes de services (gratuits, étudiants)
- Catalogues d'outils (MCP, IA)
- Cartographies technologiques
- Matrices de décision

Ces ressources sont **descriptive**s : elles décrivent ce qui existe.

### Décisions du projet (prescriptives)

Les décisions du projet se trouvent dans :
- `Engineering-Knowledge-Tooling-System/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`
- `Engineering-Knowledge-Tooling-System/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`

Ces décisions sont **prescriptives** : elles définissent ce que le projet utilise.

**Règle :** Les ressources externes informent les décisions, mais ne les remplacent pas.

---

## Éléments à actualiser ou à vérifier

### À vérifier

- [ ] Plans étudiants : éligibilité toujours valide (vérifier les sites officiels)
- [ ] Outils MCP : compatibilité avec les dernières versions des clients
- [ ] Services gratuits : quotas et limites actuels
- [ ] URLs : accessibilité des liens (certains peuvent avoir changé)

### À actualiser

- [ ] Catalogue DRI : ajouter de nouvelles ressources identifiées
- [ ] Catalogue HarnAI : ajouter de nouveaux outils MCP
- [ ] Plans étudiants : mettre à jour les prix et conditions
- [ ] Cartographies : intégrer de nouvelles technologies

---

## Liens vers les sources originales

### DRI (Digital Resources Inventory)

- Source originale : `recherche/dri/`
- Copie de référence : `Référence/dri/`
- Données structurées : `catalogue-dri.csv`

### HarnAI

- Source originale : `recherche/harnai/`
- Copie de référence : `Référence/harnai/`
- Données structurées : `catalogue-harnai.csv`

### Plans étudiants

- Source originale : `recherche/students/`
- Copie de référence : `Référence/students/`
- Données structurées : `catalogue-student.csv`

---

## Utilisation par les agents IA

Ce dossier est conçu pour être consultable par les agents IA :

1. **Démarrage rapide** : Lire `SYNTHESE.md` pour une vue d'ensemble
2. **Recherche ciblée** : Consulter les fichiers spécifiques par domaine
3. **Données structurées** : Utiliser les fichiers CSV pour filtrer/trier
4. **Décisions** : Croiser les ressources avec les décisions du projet

---

## Contributions

Pour ajouter une nouvelle ressource :

1. Identifier la catégorie (DRI, HarnAI, étudiants)
2. Créer ou mettre à jour le fichier correspondant
3. Mettre à jour le CSV si applicable
4. Mettre à jour ce README si nécessaire
5. Documenter la source et la date de vérification

---

## Historique

- **21 octobre 2026** : Création de l'espace de référence, consolidation depuis `recherche/`
- **21 octobre 2026** : Ajout des blueprints et documents de cadrage
- **21 octobre 2026** : Ajout de l'audit de l'écosystème agentique

---

**Ce document est la source de vérité pour l'organisation des références du projet EKTS.**
