# Phase 09 — Taxonomie Créative

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Établir une taxonomie structurée des ressources créatives pour EKTS, permettant de retrouver, tester et réutiliser des composants, patterns, design tokens, interactions, animations 3D et visualisations mathématiques.

Cette taxonomie s'appuie sur :
- Les documents de référence (Design System, UX & Quality, 3D & Motion)
- Le catalogue DRI existant (177 ressources)
- Les recherches complémentaires (design tokens, procédural, math/physique)

---

## 2. Méthode

### 2.1 Approche

1. **Analyse des documents de référence** : extraction des concepts et catégories mentionnés
2. **Inventaire des ressources DRI** : classification des 177 ressources existantes
3. **Recherches complémentaires** : identification des lacunes (design tokens, procédural, math/physique)
4. **Synthèse** : création d'une taxonomie en 7 familles cohérentes

### 2.2 Principes

- **Complétude** : couvrir tous les aspects créatifs (design, motion, 3D, math)
- **Actionnabilité** : chaque catégorie doit permettre de retrouver des ressources concrètes
- **Évolutivité** : structure extensible pour nouvelles ressources
- **Interopérabilité** : compatible avec le stockage EKTS (Phase 06) et le RAG (Phase 07)

---

## 3. Concepts clés

### 3.1 Définitions

**Taxonomie créative** : Classification hiérarchique des ressources créatives permettant leur organisation, recherche et réutilisation.

**Famille** : Catégorie principale regroupant des ressources similaires par fonction ou technologie.

**Niveau de granularité** : Degré de détail dans la classification (général → spécifique).

**Métadonnée** : Information descriptive d'une ressource (licence, dépendances, maintenance).

### 3.2 Principes de classification

- **Fonctionnel** : organisation par usage (UI, motion, 3D, data viz)
- **Technologique** : organisation par stack (React, Three.js, WebGL)
- **Licence** : organisation par type de licence (MIT, Apache, CC0)
- **Qualité** : organisation par niveau de maintenance et compatibilité

---

## 4. Taxonomie en 7 familles

### 4.1 Vue d'ensemble

```
RESSOURCES CRÉATIVES EKTS
│
├── FAMILLE 1 : UI Components & Design System
│   ├── Composants UI
│   ├── Design Tokens
│   ├── Templates
│   └── Icônes & Assets
│
├── FAMILLE 2 : Motion & Animation
│   ├── Bibliothèques de motion
│   ├── Scroll-driven
│   ├── Micro-interactions
│   └── Lottie & Rive
│
├── FAMILLE 3 : 3D & WebGL
│   ├── Moteurs 3D
│   ├── Helpers & Utils
│   ├── Assets 3D
│   └── Shaders
│
├── FAMILLE 4 : Data Visualization
│   ├── Charts & Graphs
│   ├── Maps & Geo
│   └── Visualisations scientifiques
│
├── FAMILLE 5 : Génération Procédurale
│   ├── Géométrie procédurale
│   ├── Noise & Patterns
│   └── Systèmes de particules
│
├── FAMILLE 6 : Mathématiques & Physique
│   ├── Bibliothèques mathématiques
│   ├── Moteurs physiques
│   └── Visualisations mathématiques
│
└── FAMILLE 7 : Outils & Tests
    ├── Tests visuels
    ├── Accessibilité motion/3D
    ├── Performance WebGL
    └── Debugging
```

---

## 5. Résultats

### 5.1 Famille 1 : UI Components & Design System

**Objectif** : Composants d'interface, design tokens, templates et assets visuels.

#### 5.1.1 Composants UI

| Catégorie | Exemples | Technologies | Licence |
|-----------|----------|--------------|---------|
| **Composants React** | shadcn/ui, Magic UI, Aceternity UI, React Bits | React, Tailwind, Motion | MIT |
| **Composants multi-framework** | MUI, Ant Design, Mantine, Chakra | React/Vue/Svelte | MIT |
| **Composants headless** | Radix Primitives, React Aria, Ark UI | React/Vue/Svelte | MIT |
| **Composants animés** | Animate UI, Motion Primitives, Kokonut UI | React, Motion | MIT |

**Ressources DRI** : 30+ composants UI (N08-N10)

#### 5.1.2 Design Tokens

| Outil | Fonction | Licence | Usage |
|-------|----------|---------|-------|
| **Style Dictionary** | Transformation tokens → code | MIT | Amazon, référence industrie |
| **Tokens Studio** | Gestion tokens Figma | MIT (free tier) | Plugin Figma standard |
| **Terrazzo** | Gestion et génération tokens | MIT | Suite complète open-source |
| **Design Token Kit** | Validation, conversion, showcase | Apache-2.0 | Toolkit DTCG |
| **Superposition** | Extraction tokens depuis sites | Gratuit | Reverse engineering design systems |

**Standard** : W3C Design Tokens Community Group (v1 stable, octobre 2025)

**Formats** :
- DTCG JSON (standard W3C)
- CSS Custom Properties
- Tailwind config
- Figma Tokens / Variables

#### 5.1.3 Templates

| Template | Type | Technologie | Licence |
|----------|------|-------------|---------|
| **Tabler** | Admin dashboard | Bootstrap 5 | MIT |
| **shadcn-admin** | Admin Next.js | Next/shadcn | MIT |
| **create-t3-app** | SaaS starter | Next/tRPC/Prisma | MIT |
| **Vercel Templates** | Variété | Next/varies | MIT |

**Ressources DRI** : 10+ templates (N11-N12)

#### 5.1.4 Icônes & Assets

| Catégorie | Exemples | Licence | Usage |
|-----------|----------|---------|-------|
| **Icônes SVG** | Lucide, Tabler Icons, Phosphor | MIT/ISC | UI, design systems |
| **Icon sets** | Iconify, Simple Icons | MIT/CC0 | 150+ sets, logos marques |
| **Fonts** | Fontshare, Google Fonts | OFL/Free | Typographie |
| **Illustrations** | unDraw, Open Peeps, Storyset | CC0/Free | visuels marketing |
| **Photos** | Pexels, Unsplash | CC0/Unsplash License | backgrounds, hero |

**Ressources DRI** : 15+ ressources assets (N17)

---

### 5.2 Famille 2 : Motion & Animation

**Objectif** : Bibliothèques d'animation, scroll-driven, micro-interactions, Lottie/Rive.

#### 5.2.1 Bibliothèques de motion

| Bibliothèque | Usage | Technologie | Licence |
|--------------|-------|-------------|---------|
| **GSAP** | Animation avancée, timelines | JS vanilla | Gratuit commercial |
| **Motion** (ex-Framer Motion) | Animation React | React | MIT |
| **Anime.js** | Micro-animations légères | JS vanilla | MIT |
| **React Spring** | Animation physique | React | MIT |
| **Theatre.js** | Éditeur timeline | TS, Three.js | Apache-2.0 |

**Ressources DRI** : 7 bibliothèques motion (N14)

#### 5.2.2 Scroll-driven

| Bibliothèque | Fonction | Technologie | Licence |
|--------------|----------|-------------|---------|
| **Lenis** | Smooth scroll standard | JS/React | MIT |
| **GSAP ScrollTrigger** | Scroll animations | GSAP plugin | Gratuit |
| **Framer Motion scroll** | Scroll-linked animations | React/Motion | MIT |

**Patterns** :
- Scroll normalization (0 → 1)
- Scroll storytelling (scènes)
- Scroll pinning
- Scroll progress indicators

#### 5.2.3 Micro-interactions

| Catégorie | Exemples | Technologies |
|-----------|----------|--------------|
| **Hover effects** | Magnetic buttons, cursor effects | React, Motion |
| **Text animations** | Reveal, stagger, split text | GSAP, Motion |
| **Page transitions** | Shared elements, router integration | React Router, Motion |
| **Loading states** | Skeletons, spinners, progress | React, CSS |

**Ressources DRI** :
- MicroKit : 49 micro-interactions Tailwind + CSS
- loadercn : Loaders CSS sans dépendance
- pqoqubbw/icons : Icônes animées React

#### 5.2.4 Lottie & Rive

| Outil | Usage | Technologie | Licence |
|-------|-------|-------------|---------|
| **Lottie-web** | Lecture animations After Effects | JS | MIT |
| **Rive** | State machines interactives | WASM/éditeur | MIT runtime + plateforme |
| **DrawKit** | Illustrations Lottie + 3D | Lottie | Packs gratuits |

---

### 5.3 Famille 3 : 3D & WebGL

**Objectif** : Moteurs 3D, helpers, assets 3D, shaders.

#### 5.3.1 Moteurs 3D

| Moteur | Usage | Technologie | Licence |
|--------|-------|-------------|---------|
| **Three.js** | Référence 3D web | JS/WebGL | MIT |
| **React Three Fiber** | Three.js pour React | React | MIT |
| **Babylon.js** | Moteur complet | TS/WebGL/WebGPU | Apache-2.0 |
| **PlayCanvas** | Éditeur collaboratif | JS | MIT |
| **PixiJS** | 2D haute performance | JS/WebGL | MIT |

**Ressources DRI** : 6 moteurs 3D (N15)

#### 5.3.2 Helpers & Utils

| Bibliothèque | Fonction | Technologie | Licence |
|--------------|----------|-------------|---------|
| **@react-three/drei** | Helpers de scène React Three Fiber | React/Three.js | MIT |
| **Spline** | 3D no-code designer | Web/React export | Gratuit + payant |
| **model-viewer** | Embed produit GLB | Web Component | Apache-2.0 |

#### 5.3.3 Assets 3D

| Source | Type | Licence | Usage |
|--------|------|---------|-------|
| **Poly Haven** | Modèles, HDRI, textures | CC0 | Sans attribution, commercial |
| **ambientCG** | Matériaux PBR, HDRI | CC0 | Plus grande banque CC0 |
| **Kenney** | Assets jeu 2D/3D | CC0 | Style cohérent |
| **Quaternius** | 3D low-poly | CC0 | Personnages stylisés |
| **Mixamo** | Rigs, animations | Gratuit [?] | Adobe |
| **Sketchfab** | Modèles variés | Mixte par modèle | Variété maximale |
| **BlenderKit** | Assets Blender | CC0/Royalty-Free | 45000+ gratuits |
| **Icosa Gallery** | 3D low-poly | CC-BY/CC0 | Archive Google Poly |

**Ressources DRI** : 8 sources assets 3D (N17, N28)

#### 5.3.4 Shaders

| Ressource | Type | Technologie | Licence |
|-----------|------|-------------|---------|
| **Shadertoy** | Apprentissage shaders | GLSL | Licences par auteur |
| **The Book of Shaders** | Référence pédagogique | GLSL | Libre |
| **three/tsl** | Three.js Shading Language | Three.js/WebGPU | MIT |

**Patterns** :
- Noise (Perlin, Simplex, Worley)
- Distorsion, displacement
- Gradient dynamique
- Post-processing (bloom, blur, vignette)
- Particules GPU

---

### 5.4 Famille 4 : Data Visualization

**Objectif** : Charts, graphs, cartes, visualisations scientifiques.

#### 5.4.1 Charts & Graphs

| Bibliothèque | Usage | Technologie | Licence |
|--------------|-------|-------------|---------|
| **Recharts** | Charts React par défaut | React/SVG | MIT |
| **ECharts** | Charts volume + cartes | JS/Canvas | Apache-2.0 |
| **D3** | Contrôle total | JS/SVG | ISC |
| **Nivo** | 25+ types charts | React | MIT |
| **visx** | Primitives custom | React/D3 | MIT |
| **Chart.js** | Simple, performant | Canvas | MIT |
| **bklit** | Charts shadcn signature | React/visx/Motion | MIT + Studio |

**Ressources DRI** : 7 bibliothèques data viz (N16)

#### 5.4.2 Maps & Geo

| Bibliothèque | Usage | Technologie | Licence |
|--------------|-------|-------------|---------|
| **ECharts maps** | Cartes interactives | ECharts | Apache-2.0 |
| **D3 geo** | Projections, topologie | D3 | ISC |
| **Plotly.js** | 40+ types dont 3D, maps | JS/WebGL | MIT |

#### 5.4.3 Visualisations scientifiques

| Outil | Usage | Technologie | Licence |
|-------|-------|-------------|---------|
| **Plotly.js** | Graphs scientifiques | JS/D3/WebGL | MIT |
| **visx** | Visualisations custom | React/D3 | MIT |
| **three.js** | Visualisations 3D | Three.js/WebGL | MIT |

---

### 5.5 Famille 5 : Génération Procédurale

**Objectif** : Géométrie procédurale, noise, patterns, systèmes de particules.

#### 5.5.1 Géométrie procédurale

| Ressource | Fonction | Technologie | Licence |
|-----------|----------|-------------|---------|
| **THREE.Terrain** | Génération terrain procédural | Three.js | MIT |
| **three.js Geometry Painter** | Peinture géométrie WebGPU | Three.js/TSL | MIT |
| **Procedural Creatures** | Créatures procédurales | Three.js/WebGPU | MIT |

**Patterns** :
- IcosahedronGeometry + Simplex noise → planètes low-poly
- Cubic Bézier curves + steering behaviors → courbes organiques
- Parallel transport frames → tubes orientés
- Instanced meshes + matrices → milliers d'instances
- Diamond-Square, Perlin, Simplex, Worley noise

#### 5.5.2 Noise & Patterns

| Type | Usage | Technologie |
|------|-------|-------------|
| **Perlin noise** | Terrains, textures | Custom ou libraries |
| **Simplex noise** | Moins d'artefacts que Perlin | Custom ou libraries |
| **Worley noise** | Cellules, Voronoi | Custom |
| **Value noise** | Simple, rapide | Custom |
| **Brownian motion** | Mouvement aléatoire | Custom |

**Bibliothèques** :
- `simplex-noise` (npm)
- `noisejs` (npm)
- Custom GLSL shaders

#### 5.5.3 Systèmes de particules

| Ressource | Fonction | Technologie | Licence |
|-----------|----------|-------------|---------|
| **three.js particles** | Particules WebGL | Three.js | MIT |
| **gpu-physics.js** | Physique GPU pour Three.js | Three.js | MIT |
| **Custom shaders** | Particules custom | GLSL | - |

**Patterns** :
- Instanced meshes (sphères, quads)
- GPU-driven (compute shaders WebGPU)
- Behavior rules (seek, orbit, coil, wander)
- Lifetime, velocity, size

---

### 5.6 Famille 6 : Mathématiques & Physique

**Objectif** : Bibliothèques mathématiques, moteurs physiques, visualisations mathématiques.

#### 5.6.1 Bibliothèques mathématiques

| Bibliothèque | Usage | Technologie | Licence |
|--------------|-------|-------------|---------|
| **math.js** | Math étendu JS | JS/Node | Apache-2.0 |
| **p5.js** | Creative coding accessible | JS | LGPL-2.1 |
| **Plotly.js** | Graphs mathématiques | JS/WebGL | MIT |

**Fonctionnalités math.js** :
- Numbers, big numbers, complex, fractions, units, matrices
- Expression parser flexible
- Calcul symbolique
- 200+ fonctions built-in
- Compatible Math standard

#### 5.6.2 Moteurs physiques

| Moteur | Type | Technologie | Licence |
|--------|------|-------------|---------|
| **Matter.js** | 2D rigid body | JS/Canvas | MIT |
| **Planck.js** | 2D Box2D port | JS | MIT |
| **p2-es** | 2D rigid body maintenu | JS | MIT |
| **Cannon.js** | 3D rigid body | JS/WebGL | MIT |
| **Oimo.js** | 3D léger | JS | MIT |
| **Verly.js** | Verlet integration | JS | MIT |

**Ressources DRI** : 6 moteurs physiques (recherches complémentaires)

**Comparaison** :
- **Matter.js** : Le plus populaire, web-friendly, 16K+ ★
- **Planck.js** : Port Box2D, complet mais moins performant
- **Cannon.js** : 3D, intégré avec Three.js
- **p2-es** : Fork maintenu de p2.js, type-safe

#### 5.6.3 Visualisations mathématiques

| Outil | Usage | Technologie | Licence |
|-------|-------|-------------|---------|
| **myPhysicsLab** | 50 simulations physiques | JS/Canvas | Apache-2.0 |
| **Physics Simulation Engine** | Simulations physiques | p5.js/MathJax | Open-source |
| **visualize-it** | Concepts scientifiques | JS | Open-source |
| **PhysicsHub** | Formules physiques | React/Next | Open-source |
| **p5.js** | Creative coding, art génératif | JS | LGPL-2.1 |

**Patterns** :
- Pendules, ressorts, collisions
- Champs vectoriels
- Fractales (Mandelbrot, Julia)
- Systèmes de particules physiques
- Graphes de fonctions

---

### 5.7 Famille 7 : Outils & Tests

**Objectif** : Tests visuels, accessibilité motion/3D, performance WebGL, debugging.

#### 5.7.1 Tests visuels

| Outil | Fonction | Technologie | Licence |
|-------|----------|-------------|---------|
| **Playwright** | Tests E2E, screenshots | Node.js | Apache-2.0 |
| **Chromatic** | Visual regression testing | Storybook/CI | Commercial (free tier) |
| **Percy** | Visual testing | CI/CD | Commercial |
| **Loki** | Visual regression | Storybook | MIT |

**Patterns** :
- Screenshot comparison (baseline vs current)
- Pixel diff threshold
- Multi-browser testing
- Responsive testing

#### 5.7.2 Accessibilité motion/3D

| Outil | Fonction | Technologie | Licence |
|-------|----------|-------------|---------|
| **axe-core** | Tests accessibilité | JS | MPL-2.0 |
| **Lighthouse** | Audit performance/a11y | Chrome | Apache-2.0 |
| **Playwright accessibility tree** | Arbre accessibilité | Playwright | Apache-2.0 |

**Checklists** :
- `prefers-reduced-motion` respecté
- Navigation clavier préservée
- Focus visible
- Contraste suffisant
- Alternative textuelle pour 3D
- Contenu accessible sans animation

**Ressources** :
- Document de référence : Source 02 (UX & Quality) sections 25-33
- WCAG 2.2 AA : 86 critères
- Document de référence : Source 03 (3D & Motion) sections 61-62

#### 5.7.3 Performance WebGL

| Outil | Fonction | Technologie | Licence |
|-------|----------|-------------|---------|
| **Spector.js** | Debug WebGL | Extension Chrome | MIT |
| **Three.js Stats.js** | FPS, performance | Three.js | MIT |
| **Chrome DevTools Performance** | Profiling | Chrome | - |
| **WebGPU Inspector** | Debug WebGPU | Extension | - |

**Métriques** :
- FPS (60 FPS cible)
- Draw calls
- Triangle count
- Texture memory
- Shader compilation time
- Frame time

**Ressources** :
- Document de référence : Source 03 sections 70-73, 95
- Document de référence : Source 04 (Performance)

#### 5.7.4 Debugging

| Outil | Fonction | Technologie | Licence |
|-------|----------|-------------|---------|
| **Three.js Inspector** | Inspection scène | Chrome Extension | MIT |
| **React DevTools** | Debug React | Extension | MIT |
| **React Three Fiber DevTools** | Debug R3F | Extension | MIT |

**Patterns** :
- Mode debug (FPS, state, camera)
- Wireframe rendering
- Bounding boxes
- Grid helpers
- Axes helpers

---

## 6. Tableau récapitulatif

### 6.1 Vue d'ensemble des 7 familles

| Famille | Catégories | Ressources DRI | Nouvelles ressources | Total |
|---------|------------|----------------|----------------------|-------|
| **1. UI Components** | 4 | 30+ | 5 (design tokens) | 35+ |
| **2. Motion** | 4 | 7 | 3 (scroll, micro, Lottie) | 10+ |
| **3. 3D & WebGL** | 4 | 14 | 3 (helpers, shaders) | 17+ |
| **4. Data Viz** | 3 | 7 | 2 (maps, scientifique) | 9+ |
| **5. Procédural** | 3 | 0 | 10+ (terrain, noise, particules) | 10+ |
| **6. Math & Physique** | 3 | 0 | 12+ (math.js, moteurs, viz) | 12+ |
| **7. Outils & Tests** | 4 | 0 | 10+ (tests, a11y, perf, debug) | 10+ |

**Total** : 103+ ressources créatives documentées

### 6.2 Couverture des documents de référence

| Document | Couverture | Ressources associées |
|----------|------------|----------------------|
| **Design System** | Design tokens, composants, patterns | Famille 1 (UI, tokens) |
| **UX & Quality** | Accessibilité, feedback, états | Famille 7 (tests, a11y) |
| **3D & Motion** | Motion, 3D, shaders, procédural | Familles 2, 3, 5 |

### 6.3 Lacunes identifiées et comblées

| Lacune | Solution | Ressources ajoutées |
|--------|----------|---------------------|
| Design tokens | Outils et standards | Style Dictionary, Tokens Studio, W3C DTCG |
| Génération procédurale | Bibliothèques et patterns | THREE.Terrain, noise libraries |
| Math/physique | Bibliothèques et moteurs | math.js, Matter.js, p5.js |
| Tests visuels | Outils de testing | Playwright, Chromatic, Loki |
| Accessibilité motion | Checklists et outils | axe-core, Lighthouse, reduced-motion |
| Performance WebGL | Profiling et debugging | Spector.js, Stats.js, DevTools |

---

## 7. Limites

### 7.1 Limites identifiées

1. **Évolutivité** : Taxonomie figée, nécessite maintenance pour nouvelles ressources
2. **Subjectivité** : Classification parfois arbitraire (une ressource peut appartenir à plusieurs familles)
3. **Couverture incomplète** : Certaines niches non couvertes (audio, VR/AR, etc.)
4. **Qualité variable** : Toutes les ressources n'ont pas le même niveau de maintenance
5. **Licences complexes** : Certaines licences sont ambiguës ou conditionnelles

### 7.2 Questions ouvertes

1. **Audio** : Où classer les bibliothèques audio (Tone.js, Howler.js) ?
2. **VR/AR** : Où classer WebXR, A-Frame, React XR ?
3. **Génération IA** : Où classer les outils de génération d'images/vidéos ?
4. **No-code** : Où classer les outils no-code (Spline, Rive) ?
5. **Maintenance** : Comment suivre l'évolution des licences et compatibilités ?

---

## 8. Recommandations

### 8.1 Utilisation de la taxonomie

1. **Recherche** : Utiliser la taxonomie pour retrouver des ressources par famille/catégorie
2. **Ajout** : Suivre la structure pour ajouter de nouvelles ressources
3. **Capitalisation** : Indexer les ressources dans EKTS (Phase 06) pour recherche sémantique (Phase 07)
4. **Réutilisation** : Documenter les patterns et cas d'usage dans chaque ressource

### 8.2 Priorités

1. **MVP** : Commencer avec les familles 1-3 (UI, Motion, 3D)
2. **Extension** : Ajouter familles 4-6 (Data Viz, Procédural, Math) selon besoins
3. **Qualité** : Utiliser famille 7 (Outils & Tests) pour valider les implémentations

### 8.3 Intégration EKTS

1. **Stockage** : Indexer chaque ressource dans `resources` table (Phase 06)
2. **RAG** : Chunker les descriptions et patterns pour recherche sémantique (Phase 07)
3. **MCP** : Exposer `search_creative_resource(query, family)` comme outil MCP

---

## 9. Décisions

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **7 familles** | Couverture complète sans redondance | 5 familles → pas assez granulaire |
| **Classification fonctionnelle** | Orientée usage plutôt que technologie | Classification technique → moins intuitive |
| **Inclusion design tokens** | Standard W3C 2025, essentiel pour design systems | Exclusion → manque crucial |
| **Inclusion procédural** | Couvre un besoin spécifique (géométrie, noise) | Exclusion → lacune importante |
| **Inclusion math/physique** | Supporte visualisations scientifiques | Exclusion → pas de support math |
| **Inclusion tests** | Essentiel pour qualité production | Exclusion → pas de validation |

---

## 10. Questions

1. **Priorisation** : Quelles familles sont prioritaires pour le MVP EKTS ?
2. **Granularité** : Faut-il sous-catégories supplémentaires dans certaines familles ?
3. **Licences** : Comment gérer les ressources avec licences ambiguës ?
4. **Maintenance** : Qui est responsable de la mise à jour de la taxonomie ?
5. **Intégration** : Comment exposer la taxonomie via MCP pour les agents IA ?

---

## 11. Sources

### 11.1 Documents de référence

1. **DIGITAL EXPERIENCE DESIGN SYSTEM** (Source 01) — Design System complet
2. **DIGITAL EXPERIENCE UX & QUALITY SYSTEM** (Source 02) — UX et qualité
3. **DIGITAL EXPERIENCE 3D & MOTION ENGINEERING SYSTEM** (Source 03) — 3D et motion

### 11.2 Catalogue DRI

- **catalogue-dri.csv** — 177 ressources gratuites documentées

### 11.3 Recherches complémentaires

4. **W3C Design Tokens Community Group** — Standard W3C (octobre 2025)
5. **Style Dictionary, Tokens Studio, Terrazzo** — Outils design tokens
6. **THREE.Terrain, Procedural Creatures** — Génération procédurale
7. **math.js, Matter.js, p5.js** — Mathématiques et physique
8. **Playwright, axe-core, Lighthouse** — Tests et accessibilité

---

## 12. Relations

### 12.1 Phases amont

| Phase | Relation | Type |
|-------|----------|------|
| **Phase 04** (Automatisation navigateur) | Source données pour tests visuels | Dépendance |
| **Phase 05** (Scraping responsable) | Contraintes éthiques pour assets | Dépendance |
| **Phase 06** (Stockage) | Stockage des ressources | Dépendance |
| **Phase 07** (RAG) | Recherche sémantique dans ressources | Dépendance |

### 12.2 Phases aval

| Phase | Relation | Type |
|-------|----------|------|
| **Phase 10** (Capitalisation) | Patterns récurrents à capitaliser | Dépendance |
| **Phase 12** (Comparatif IA) | Outils pour benchmarking | Support |

---

## 13. Critères d'évaluation

### 13.1 Critères de complétude

- [x] 7 familles définies
- [x] 103+ ressources documentées
- [x] Couverture Design System, UX, 3D & Motion
- [x] Lacunes identifiées et comblées

### 13.2 Critères de qualité

- [x] Taxonomie structurée et hiérarchique
- [x] Ressources classées par fonction et technologie
- [x] Métadonnées (licence, dépendances, maintenance)
- [x] Intégration EKTS (stockage, RAG, MCP)

### 13.3 Critères d'actionnabilité

- [x] Ressources retrouvables par famille/catégorie
- [x] Patterns et cas d'usage documentés
- [x] Outils de tests et validation inclus
- [x] Recommandations d'utilisation

---

**Document rédigé le 21 octobre 2026 — Phase 09 du projet EKTS**
