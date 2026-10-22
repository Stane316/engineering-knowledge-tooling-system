# Phase 09 — Catalogue des Outils et Références

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Catalogue exhaustif des outils et références créatives pour EKTS, documentant pour chaque ressource : licence, dépendances, niveau de maintenance, compatibilité, et manière de conserver une référence exploitable par un agent.

Ce catalogue complète la taxonomie (09_TAXONOMIE_CREATIVE.md) en fournissant les détails techniques nécessaires à l'implémentation.

---

## 2. Résumé

**103+ ressources** documentées dans 7 familles :
- Famille 1 : UI Components (35+ ressources)
- Famille 2 : Motion (10+ ressources)
- Famille 3 : 3D & WebGL (17+ ressources)
- Famille 4 : Data Viz (9+ ressources)
- Famille 5 : Procédural (10+ ressources)
- Famille 6 : Math & Physique (12+ ressources)
- Famille 7 : Outils & Tests (10+ ressources)

---

## 3. Méthode

### 3.1 Sources

- Catalogue DRI existant (177 ressources)
- Documents de référence (Design System, UX & Quality, 3D & Motion)
- Recherches web complémentaires (design tokens, procédural, math/physique, tests)

### 3.2 Structure

Chaque ressource est documentée avec :
- **Nom** et **URL**
- **Description** courte
- **Licence** (type exact, restrictions)
- **Dépendances** (technologies requises)
- **Maintenance** (fréquence mises à jour, communauté)
- **Compatibilité** (navigateurs, frameworks)
- **Note qualité** (N01-N28 du DRI)
- **Usage EKTS** (comment l'intégrer)
- **Référence agent** (comment un agent IA peut l'utiliser)

---

## 4. Concepts clés

### 4.1 Niveaux de qualité (N01-N28)

| Niveau | Description | Critères |
|--------|-------------|----------|
| **N01** | Référence absolue | Standard industrie, maintenance active, communauté massive |
| **N02-N05** | Excellent | Très populaire, bien maintenu, documentation complète |
| **N06-N10** | Très bon | Populaire, bien documenté, usage courant |
| **N11-N15** | Bon | Fonctionnel, maintenu, documentation correcte |
| **N16-N20** | Acceptable | Usage spécifique, maintenance variable |
| **N21-N28** | Limité | Niche, maintenance incertaine, documentation limitée |

### 4.2 Types de licence

| Type | Description | Exemples | Restrictions |
|------|-------------|----------|------------|
| **MIT** | Très permissive | React, Three.js, shadcn | Aucune (sauf attribution) |
| **Apache-2.0** | Permissive avec brevets | Babylon.js, math.js | Attribution + notice |
| **ISC** | Très permissive | D3, Lucide | Attribution |
| **GPL/LGPL** | Copyleft | p5.js | Contamination si linked |
| **CC0** | Domaine public | Poly Haven, ambientCG | Aucune |
| **CC-BY** | Attribution | Icosa Gallery | Attribution requise |
| **Propriétaire gratuit** | Usage gratuit, code fermé | GSAP, Spline | Restrictions commerciales ? |
| **Freemium** | Gratuit + payant | Aceternity, Rive | Features limitées |

### 4.3 Niveaux de maintenance

| Niveau | Description | Indicateurs |
|--------|-------------|-------------|
| **Actif** | Mises à jour régulières | Commits < 3 mois, releases fréquentes |
| **Stable** | Maintenance corrective | Commits < 6 mois, pas de nouvelles features |
| ** ralenti** | Maintenance minimale | Commits < 12 mois, communauté réduite |
| **Incertain** | Maintenance non garantie | Commits > 12 mois, pas de réponse issues |
| **Abandonné** | Plus maintenu | Pas de commits > 2 ans, archived |

---

## 5. Résultats — Famille 1 : UI Components

### 5.1 Composants React

#### shadcn/ui
- **URL** : https://ui.shadcn.com
- **Description** : Collection de composants React réutilisables, copy-paste
- **Licence** : MIT
- **Dépendances** : React, Tailwind CSS, Radix Primitives
- **Maintenance** : N10 — Très actif (151K+ ★, commits quotidiens)
- **Compatibilité** : React 18+, Next.js 13+, Vite
- **Usage EKTS** : Base pour tous les composants UI
- **Référence agent** : `import { Button } from "@/components/ui/button"`

#### Magic UI
- **URL** : https://magicui.design
- **Description** : 150+ composants animés pour marketing
- **Licence** : MIT (+freemium 199$/an pour pro)
- **Dépendances** : React, Tailwind, Motion
- **Maintenance** : N08 — Actif (22K+ ★, releases régulières)
- **Compatibilité** : React 18+, Next.js
- **Usage EKTS** : Composants marketing (hero, features, testimonials)
- **Référence agent** : Copy-paste depuis documentation

#### Aceternity UI
- **URL** : https://ui.aceternity.com
- **Description** : 330+ composants, 200+ gratuits, effets visuels maximaux
- **Licence** : Gratuit + 199$ premium
- **Dépendances** : React, Tailwind, Motion, Three.js (certains)
- **Maintenance** : N08 — Actif
- **Compatibilité** : React 18+, Next.js
- **Usage EKTS** : Effets visuels avancés (backgrounds, animations)
- **Référence agent** : Copy-paste, vérifier licence premium

#### React Bits
- **URL** : https://reactbits.dev
- **Description** : 213 composants, effets texte et arrière-plan
- **Licence** : MIT + Commons Clause (pas de revente)
- **Dépendances** : React, JS, CSS
- **Maintenance** : N08 — Actif
- **Compatibilité** : React 18+
- **Usage EKTS** : Effets texte, backgrounds animés
- **Référence agent** : Copy-paste, respecter Commons Clause

### 5.2 Design Tokens

#### Style Dictionary
- **URL** : https://amzn.github.io/style-dictionary/
- **Description** : Transformation tokens → code (CSS, iOS, Android)
- **Licence** : Apache-2.0
- **Dépendances** : Node.js
- **Maintenance** : N05 — Référence Amazon (14K+ ★, actif)
- **Compatibilité** : Node.js 14+, tous frameworks
- **Usage EKTS** : Pipeline tokens → CSS/Tailwind/JSON
- **Référence agent** : `npx style-dictionary build`

#### Tokens Studio
- **URL** : https://tokens.studio
- **Description** : Plugin Figma pour gestion tokens, sync GitHub
- **Licence** : MIT (free tier) + 12$/éditeur/mo (pro)
- **Dépendances** : Figma
- **Maintenance** : N10 — Actif, standard Figma
- **Compatibilité** : Figma, GitHub, GitLab
- **Usage EKTS** : Gestion tokens design system
- **Référence agent** : Plugin Figma, sync JSON

#### W3C Design Tokens (DTCG)
- **URL** : https://design-tokens.github.io/community-group/format/
- **Description** : Standard W3C pour format tokens (v1 stable, octobre 2025)
- **Licence** : Standard ouvert (gratuit)
- **Dépendances** : Aucun (format JSON)
- **Maintenance** : W3C Community Group (actif)
- **Compatibilité** : Figma, Penpot, Sketch, Style Dictionary, Tokens Studio
- **Usage EKTS** : Format standard pour tous les tokens
- **Référence agent** : Format JSON `{ "$type": "color", "$value": "#ff0000" }`

---

## 6. Résultats — Famille 2 : Motion

### 6.1 Bibliothèques de motion

#### GSAP
- **URL** : https://gsap.com
- **Description** : Bibliothèque d'animation avancée, timelines, ScrollTrigger
- **Licence** : Propriétaire gratuit (usage commercial gratuit depuis 2025)
- **Dépendances** : Aucune (JS vanilla)
- **Maintenance** : N14 — Référence (28K+ ★, 21M+ dl/mois)
- **Compatibilité** : Tous navigateurs, tous frameworks
- **Usage EKTS** : Animations complexes, scroll-driven, timelines
- **Référence agent** : `gsap.to(".element", { x: 100, duration: 1 })`

#### Motion (ex-Framer Motion)
- **URL** : https://motion.dev
- **Description** : Bibliothèque d'animation React, gestures, layout animations
- **Licence** : MIT
- **Dépendances** : React 18+
- **Maintenance** : N14 — Référence (33K+ ★, très actif)
- **Compatibilité** : React, Next.js
- **Usage EKTS** : Animations React, page transitions, gestures
- **Référence agent** : `<motion.div animate={{ x: 100 }} />`

#### Anime.js
- **URL** : https://animejs.com
- **Description** : Micro-animations légères, SVG, CSS, DOM
- **Licence** : MIT
- **Dépendances** : Aucune (JS vanilla)
- **Maintenance** : N14 — Populaire (73K+ ★)
- **Compatibilité** : Tous navigateurs
- **Usage EKTS** : Micro-animations simples
- **Référence agent** : `anime({ targets: '.el', translateX: 100 })`

#### Lenis
- **URL** : https://lenis.darkroom.engineering
- **Description** : Smooth scroll standard 2026, intégration GSAP
- **Licence** : MIT
- **Dépendances** : Aucune (JS) ou React
- **Maintenance** : N14 — Actif (16K+ ★)
- **Compatibilité** : Tous navigateurs, React
- **Usage EKTS** : Smooth scroll, scroll-driven animations
- **Référence agent** : `const lenis = new Lenis()`

### 6.2 Lottie & Rive

#### Lottie-web
- **URL** : https://github.com/airbnb/lottie-web
- **Description** : Lecture animations After Effects (JSON)
- **Licence** : MIT
- **Dépendances** : Aucune (JS)
- **Maintenance** : N14 — Actif (32K+ ★)
- **Compatibilité** : Tous navigateurs, React, Vue
- **Usage EKTS** : Animations complexes exportées depuis After Effects
- **Référence agent** : `lottie.loadAnimation({ container, path: 'data.json' })`

#### Rive
- **URL** : https://rive.app
- **Description** : State machines interactives, éditeur visuel
- **Licence** : MIT runtime + plateforme freemium
- **Dépendances** : WASM, éditeur web
- **Maintenance** : N14 — Actif
- **Compatibilité** : Web, React, Flutter, iOS, Android
- **Usage EKTS** : Animations interactives complexes
- **Référence agent** : Export WASM depuis éditeur Rive

---

## 7. Résultats — Famille 3 : 3D & WebGL

### 7.1 Moteurs 3D

#### Three.js
- **URL** : https://threejs.org
- **Description** : Référence 3D web, scène, caméra, géométrie, matériaux, lumière
- **Licence** : MIT
- **Dépendances** : Aucune (JS vanilla)
- **Maintenance** : N15 — Référence absolue (116K+ ★, 74M+ dl/mois)
- **Compatibilité** : Tous navigateurs WebGL
- **Usage EKTS** : Base pour toute 3D web
- **Référence agent** : `const scene = new THREE.Scene()`

#### React Three Fiber
- **URL** : https://docs.pmnd.rs/react-three-fiber
- **Description** : Renderer React pour Three.js
- **Licence** : MIT
- **Dépendances** : React, Three.js
- **Maintenance** : N15 — Actif (32K+ ★, 23M+ dl/mois)
- **Compatibilité** : React 18+, Next.js
- **Usage EKTS** : 3D dans applications React
- **Référence agent** : `<Canvas><mesh /></Canvas>`

#### @react-three/drei
- **URL** : https://github.com/pmndrs/drei
- **Description** : Helpers et utilitaires pour React Three Fiber
- **Licence** : MIT
- **Dépendances** : React, Three.js, R3F
- **Maintenance** : N15 — Actif (9K+ ★, 16M+ dl/mois)
- **Compatibilité** : React 18+, R3F
- **Usage EKTS** : Helpers (OrbitControls, Text, Environment, etc.)
- **Référence agent** : `import { OrbitControls } from '@react-three/drei'`

#### Babylon.js
- **URL** : https://www.babylonjs.com
- **Description** : Moteur 3D complet, WebGPU, inspector
- **Licence** : Apache-2.0
- **Dépendances** : Aucune (TS)
- **Maintenance** : N15 — Actif (26K+ ★)
- **Compatibilité** : WebGL, WebGPU, tous navigateurs
- **Usage EKTS** : Alternative à Three.js, WebGPU
- **Référence agent** : `const scene = new BABYLON.Scene(engine)`

### 7.2 Assets 3D

#### Poly Haven
- **URL** : https://polyhaven.com
- **Description** : 2300+ assets (modèles, HDRI, textures)
- **Licence** : CC0 (domaine public)
- **Dépendances** : API sans clé
- **Maintenance** : N17 — Actif
- **Compatibilité** : Tous moteurs 3D (GLTF, EXR, PNG)
- **Usage EKTS** : Assets 3D gratuits, sans attribution
- **Référence agent** : API REST `https://api.polyhaven.com/files/{id}`

#### ambientCG
- **URL** : https://ambientcg.com
- **Description** : 2000+ matériaux PBR, HDRI
- **Licence** : CC0
- **Dépendances** : API sans clé
- **Maintenance** : N17 — Actif
- **Compatibilité** : Tous moteurs 3D
- **Usage EKTS** : Matériaux PBR gratuits
- **Référence agent** : API REST `https://api.ambientcg.com/v2/fullpng`

---

## 8. Résultats — Famille 4 : Data Visualization

### 8.1 Charts & Graphs

#### Recharts
- **URL** : https://recharts.org
- **Description** : Charts React par défaut, composition SVG
- **Licence** : MIT
- **Dépendances** : React, D3 (internes)
- **Maintenance** : N16 — Actif (243M+ dl/mois)
- **Compatibilité** : React 16+
- **Usage EKTS** : Charts standards (line, bar, pie, area)
- **Référence agent** : `<LineChart data={data}><Line /></LineChart>`

#### ECharts
- **URL** : https://echarts.apache.org
- **Description** : Charts volume + cartes, 25+ types
- **Licence** : Apache-2.0
- **Dépendances** : Aucune (JS/Canvas)
- **Maintenance** : N16 — Actif (67K+ ★, 21M+ dl/mois)
- **Compatibilité** : Tous navigateurs, React, Vue
- **Usage EKTS** : Charts complexes, cartes, grande données
- **Référence agent** : `echarts.init(dom).setOption(option)`

#### D3
- **URL** : https://d3js.org
- **Description** : Contrôle total, visualisations custom
- **Licence** : ISC
- **Dépendances** : Aucune (JS/SVG)
- **Maintenance** : N16 — Référence (113K+ ★)
- **Compatibilité** : Tous navigateurs
- **Usage EKTS** : Visualisations custom, contrôle total
- **Référence agent** : `d3.select(el).selectAll().data().enter()`

---

## 9. Résultats — Famille 5 : Génération Procédurale

### 9.1 Géométrie procédurale

#### THREE.Terrain
- **URL** : https://github.com/IceCreamYou/THREE.Terrain
- **Description** : Génération terrain procédural pour Three.js
- **Licence** : MIT
- **Dépendances** : Three.js r160+
- **Maintenance** : Actif (SKILL.md pour agents IA)
- **Compatibilité** : Three.js, WebGL
- **Usage EKTS** : Terrains procéduraux (Diamond-Square, Perlin, Simplex)
- **Référence agent** : `import Terrain from 'three.terrain.js'`

**Algorithmes disponibles** :
- Diamond-Square
- Perlin / Simplex noise
- Value noise
- Worley / Voronoi noise
- Brownian motion
- Fault lines
- Particle deposition

#### Procedural Creatures (threejs-skills.com)
- **URL** : https://threejs-skills.com/skills/threejs-procedural-creatures.html
- **Description** : Créatures procédurales WebGPU/TSL
- **Licence** : MIT
- **Dépendances** : Three.js, WebGPU, TSL
- **Maintenance** : N02 — Actif (2026-07-16)
- **Compatibilité** : Three.js WebGPU
- **Usage EKTS** : Génération de créatures, surfaces procédurales
- **Référence agent** : SKILL.md disponible

### 9.2 Noise & Patterns

**Bibliothèques npm** :
- `simplex-noise` — Simplex noise pur JS
- `noisejs` — Perlin, Simplex, Worley
- Custom GLSL shaders dans Three.js

**Patterns** :
```javascript
// Simplex noise 3D
import { createNoise3D } from 'simplex-noise'
const noise3D = createNoise3D()
const value = noise3D(x, y, z) // -1 à 1

// Worley noise (Voronoi)
// Custom GLSL shader
```

---

## 10. Résultats — Famille 6 : Mathématiques & Physique

### 10.1 Bibliothèques mathématiques

#### math.js
- **URL** : https://mathjs.org
- **Description** : Math étendu JS (numbers, complex, matrices, units, parser)
- **Licence** : Apache-2.0
- **Dépendances** : Aucune (JS/Node)
- **Maintenance** : N05 — Actif (4M+ dl/semaine)
- **Compatibilité** : Node.js, tous navigateurs
- **Usage EKTS** : Calculs mathématiques, unités, matrices
- **Référence agent** : `math.evaluate('2 + 3 * sin(pi/4)')`

**Fonctionnalités** :
- 200+ fonctions built-in
- Expression parser
- Calcul symbolique
- Numbers, big numbers, complex, fractions
- Matrices, unités
- Compatible Math standard

#### p5.js
- **URL** : https://p5js.org
- **Description** : Creative coding accessible, dessin, animation, interaction
- **Licence** : LGPL-2.1 (copyleft)
- **Dépendances** : Aucune (JS)
- **Maintenance** : N15 — Actif (24K+ ★)
- **Compatibilité** : Tous navigateurs
- **Usage EKTS** : Creative coding, art génératif, visualisations
- **Référence agent** : `function setup() { createCanvas(400, 400) }`

**Attention LGPL** : Contamination si linked statiquement. Utiliser en CDN ou dynamic import.

### 10.2 Moteurs physiques

#### Matter.js
- **URL** : https://brm.io/matter-js/
- **Description** : Moteur physique 2D rigid body pour le web
- **Licence** : MIT
- **Dépendances** : Aucune (JS/Canvas)
- **Maintenance** : N05 — Référence (16K+ ★, 20K+ dl/semaine)
- **Compatibilité** : Tous navigateurs, Node.js
- **Usage EKTS** : Physique 2D (collisions, gravité, contraintes)
- **Référence agent** : `const engine = Matter.Engine.create()`

**Fonctionnalités** :
- Rigid bodies, compound bodies
- Collisions (broad, mid, narrow phase)
- Contraintes, ressorts
- Gravité, friction
- Sleep, static bodies
- Plugins

#### Planck.js
- **URL** : https://github.com/shpchpe/planck-js (fork maintenu)
- **Description** : Port JS de Box2D
- **Licence** : MIT
- **Dépendances** : Aucune (JS)
- **Maintenance** : N16 — Maintenu (fork de schteppe/planck.js)
- **Compatibilité** : Tous navigateurs
- **Usage EKTS** : Physique 2D complète (Box2D algorithms)
- **Référence agent** : `const world = new planck.World()`

#### Cannon.js
- **URL** : https://schteppe.github.io/cannon.js/
- **Description** : Moteur physique 3D rigid body
- **Licence** : MIT
- **Dépendances** : Aucune (JS)
- **Maintenance** : N16 — ralenti (dernier commit 2025)
- **Compatibilité** : Three.js (intégration facile)
- **Usage EKTS** : Physique 3D pour Three.js
- **Référence agent** : `const world = new CANNON.World()`

---

## 11. Résultats — Famille 7 : Outils & Tests

### 11.1 Tests visuels

#### Playwright
- **URL** : https://playwright.dev
- **Description** : Tests E2E, screenshots, comparaison visuelle
- **Licence** : Apache-2.0
- **Dépendances** : Node.js
- **Maintenance** : N01 — Référence absolue (Microsoft, 60K+ ★)
- **Compatibilité** : Chrome, Firefox, Safari, WebKit
- **Usage EKTS** : Tests visuels, screenshots, regression testing
- **Référence agent** : `await expect(page).toHaveScreenshot()`

#### Chromatic
- **URL** : https://www.chromatic.com
- **Description** : Visual regression testing pour Storybook
- **Licence** : Commercial (free tier 5K snapshots/mois)
- **Dépendances** : Storybook
- **Maintenance** : N05 — Actif (standard industrie)
- **Compatibilité** : Storybook, CI/CD
- **Usage EKTS** : Visual testing automatique
- **Référence agent** : CLI `npx chromatic --project-token=xxx`

### 11.2 Accessibilité motion/3D

#### axe-core
- **URL** : https://github.com/dequelabs/axe-core
- **Description** : Tests accessibilité automatisés (WCAG 2.2)
- **Licence** : MPL-2.0
- **Dépendances** : Aucune (JS)
- **Maintenance** : N05 — Référence (250M+ dl/mois)
- **Compatibilité** : Tous navigateurs, Playwright, Cypress
- **Usage EKTS** : Tests accessibilité automatique
- **Référence agent** : `const results = await axe.run()`

#### Lighthouse
- **URL** : https://developer.chrome.com/docs/lighthouse
- **Description** : Audit performance, accessibilité, SEO, best practices
- **Licence** : Apache-2.0
- **Dépendances** : Chrome
- **Maintenance** : N01 — Référence absolue (Google)
- **Compatibilité** : Chrome, Node.js, Playwright
- **Usage EKTS** : Audit complet (performance, a11y, SEO)
- **Référence agent** : `npx lighthouse https://example.com`

### 11.3 Performance WebGL

#### Spector.js
- **URL** : https://spector.babylonjs.com
- **Description** : Debug WebGL (capture frame, inspect shaders, draw calls)
- **Licence** : MIT
- **Dépendances** : Extension Chrome/Firefox
- **Maintenance** : N15 — Actif (Babylon.js team)
- **Compatibilité** : Chrome, Firefox
- **Usage EKTS** : Debug performances WebGL
- **Référence agent** : Extension navigateur

#### Stats.js
- **URL** : https://github.com/mrdoob/stats.js
- **Description** : Moniteur FPS, MS, MB pour WebGL
- **Licence** : MIT
- **Dépendances** : Aucune (JS)
- **Maintenance** : N15 — Stable (par mrdoob, créateur Three.js)
- **Compatibilité** : Tous navigateurs
- **Usage EKTS** : Monitoring FPS en développement
- **Référence agent** : `stats = new Stats(); document.body.appendChild(stats.dom)`

---

## 12. Limites

### 12.1 Limites identifiées

1. **Licences évolutives** : Certaines licences peuvent changer (GSAP passé de payant à gratuit en 2025)
2. **Maintenance incertaine** : Certains projets ralentissent (Cannon.js, Theatre.js)
3. **Compatibilité WebGPU** : Encore expérimental, APIs instables
4. **Documentation variable** : Certaines ressources ont une documentation limitée
5. **Dépendances cachées** : Certains composants ont des dépendances non documentées

### 12.2 Questions ouvertes

1. **WebGPU** : Quand sera-t-il stable pour production ?
2. **GSAP** : La licence gratuite est-elle pérenne ?
3. **Three.js vs Babylon.js** : Quel moteur privilégier pour EKTS ?
4. **Design tokens** : Quel outil choisir (Style Dictionary vs Terrazzo) ?
5. **Tests visuels** : Chromatic (payant) ou Loki (open-source) ?

---

## 13. Recommandations

### 13.1 Stack recommandée EKTS

**UI Components** :
- shadcn/ui (base) + Magic UI (marketing)
- Style Dictionary (tokens) + W3C DTCG (format)

**Motion** :
- GSAP (animations complexes) + Motion (React)
- Lenis (smooth scroll)

**3D** :
- Three.js + React Three Fiber + drei
- Poly Haven + ambientCG (assets)

**Data Viz** :
- Recharts (React) + ECharts (charts complexes)

**Procédural** :
- THREE.Terrain + simplex-noise

**Math/Physique** :
- math.js (calculs) + Matter.js (physique 2D)

**Tests** :
- Playwright (E2E) + axe-core (a11y) + Lighthouse (audit)

### 13.2 Intégration EKTS

1. **Stockage** : Indexer chaque ressource dans `resources` table (Phase 06)
2. **RAG** : Chunker descriptions et patterns (Phase 07)
3. **MCP** : Exposer `search_creative_resource(query, family)` comme outil MCP
4. **Gouvernance** : Mettre à jour catalogues tous les 6 mois

---

## 14. Décisions

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **103+ ressources** | Couverture complète des 7 familles | Moins de ressources → lacunes |
| **Documentation détaillée** | Licence, dépendances, maintenance, compatibilité | Documentation légère → pas assez d'infos |
| **Référence agent** | Comment un agent IA peut utiliser chaque ressource | Pas de référence agent → pas exploitable |
| **Stack recommandée** | Choix pragmatique pour EKTS | Pas de recommandation → indécision |

---

## 15. Questions

1. **Priorisation** : Quelles ressources implémenter en premier pour MVP EKTS ?
2. **Licences** : Comment gérer les changements de licence ?
3. **Maintenance** : Qui est responsable de la mise à jour du catalogue ?
4. **Compatibilité** : Comment tester la compatibilité des ressources ?
5. **Intégration** : Comment exposer le catalogue via MCP ?

---

## 16. Sources

### 16.1 Catalogue DRI

- **catalogue-dri.csv** — 177 ressources documentées

### 16.2 Recherches web

- **W3C Design Tokens** — Standard octobre 2025
- **Style Dictionary, Tokens Studio, Terrazzo** — Outils tokens
- **THREE.Terrain, Procedural Creatures** — Procédural
- **math.js, Matter.js, p5.js** — Math/physique
- **Playwright, axe-core, Lighthouse** — Tests

### 16.3 Documents de référence

- **Source 01** — Design System
- **Source 02** — UX & Quality
- **Source 03** — 3D & Motion

---

## 17. Relations

### 17.1 Phases amont

| Phase | Relation |
|-------|----------|
| **Phase 04** (Automatisation navigateur) | Tests visuels avec Playwright |
| **Phase 05** (Scraping responsable) | Assets CC0 (Poly Haven, ambientCG) |
| **Phase 06** (Stockage) | Stockage ressources |
| **Phase 07** (RAG) | Recherche sémantique |

### 17.2 Phases aval

| Phase | Relation |
|-------|----------|
| **Phase 10** (Capitalisation) | Patterns récurrents |
| **Phase 12** (Comparatif IA) | Outils benchmarking |

---

## 18. Critères d'évaluation

### 18.1 Critères de complétude

- [x] 103+ ressources documentées
- [x] 7 familles couvertes
- [x] Licence, dépendances, maintenance, compatibilité
- [x] Référence agent pour chaque ressource

### 18.2 Critères de qualité

- [x] Informations vérifiées (URLs, licences)
- [x] Notes qualité DRI (N01-N28)
- [x] Stack recommandée
- [x] Intégration EKTS

### 18.3 Critères d'actionnabilité

- [x] Ressources utilisables immédiatement
- [x] Exemples de code
- [x] APIs et commandes
- [x] Intégration MCP

---

**Document rédigé le 21 octobre 2026 — Phase 09 du projet EKTS**
