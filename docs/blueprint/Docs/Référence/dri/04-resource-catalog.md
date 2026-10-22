# DRI 04 — RESOURCE CATALOG
### Catalogue normalisé des ressources individuelles (packages, bibliothèques, SDK, CLI, templates, assets, outils)
**5 octobre 2026** · Natures N01–N30 (doc 02) · Tiers A/B/C · Colonnes : Récup. = méthode (doc 02 §6) · AI = AI-readiness 0–5 (justification inline)

> **Preuves** : `[API-npm]` = téléchargements du mois écoulé, api.npmjs.org, période 2026-09-05 → 2026-10-04 · `[API-gh]` = métadonnées GitHub lues le 2026-10-05 · `[V]` URL 200 · `[S]` phase 1 · `[W]` source Web 2026 · `[?]` à vérifier.
> **Rappel** : les fiches plateformes (sites-hôtes, registries, catalogues) sont dans le doc 03 ; ici ce sont les **ressources elles-mêmes**.

---

## C1. Moteurs d'animation & motion

| Ressource | Nature | Périmètre | Techno | Récup. | AI | Licence | Preuves | Relations |
|---|---|---|---|---|---|---|---|---|
| **GSAP** | N14 | timeline, easing, SVG morphing (MorphSVG), texte (SplitText), scroll (ScrollTrigger/ScrollSmoother) | JS vanilla, plugins | R3/R4 | **3** (API impérative très documentée, Skill officiel `greensock/gsap-skills` 15 960★ [API-gh]) | **free commercial** — gratuit, y compris ex-plugins Club depuis 3.13 ; **pas open source** (interdiction de fork/concurrence) [W] ; dépôt 28 826★ sans licence SPDX [API-gh] | 21 777 946 dl/mois [API-npm] | alternative à Motion (choregraphie vs composants) · complément de Lenis · remplace ScrollMagic [W] |
| **Motion** (ex-Framer Motion) | N14 | animations React (layout, exit, gestes), scroll, spring ; noyau ~8 KB annoncé | React/Vue/JS | R3 | **3** (API déclarative, `motion/react`) | **MIT** [API-gh, 33 842★] ; Motion+ 399 $ Solo [S] | `motion` 92 475 308 + `framer-motion` 197 270 419 dl/mois [API-npm] | alternative à GSAP + React Spring · complément de shadcn registries |
| **Anime.js** | N14 | micro-animations, SVG, stagger, timeline légère (~6–7 KB) | JS | R3/CDN | 2 | **MIT** (seed phase 1 : v4.5.0) [S] | dépôt 73 369★ [API-gh] | alternative légère à GSAP |
| **React Spring** | N14 | physique, gestes, suivi d'input continu, 3D | React | R3 | 2 | MIT | 21 781 864 (`@react-spring/web`) [API-npm] | dépôt pmndrs |
| **Lenis** | N14 | smooth scroll inertiel, synchro ScrollTrigger, ~3 KB | JS | R3 | 2 | **MIT** [API-gh, 16 173★] | [API-gh] | complément de GSAP/Motion · alternative à ScrollSmoother [W] |
| **Auto-Animate** | N14 | transitions de listes/layout en une ligne | JS | R3 | 2 | MIT | [W] | C |
| **Theatre.js** | N14/N30 | éditeur de timeline + runtime | TS | R3 | 2 | Apache-2.0 | [API-gh 12 k★ via phase 1] ; maintenance jugée incertaine [W] | complément three.js |
| **Lottie-web / dotLottie-web** | N14 | lecture d'animations After Effects (JSON / .lottie v2, theming, WASM) | JS/WASM | R3 | 2 | MIT | lottie-web 31 964 111 dl/mois [API-npm] ; dep. 32 145★ (poussée 2025-09-01 → **activité ralentie**) [API-gh] ; dotlottie-web 892★ [API-gh] | alternative à Rive (pré-enregistré vs state machine) [W] |
| **Rive WASM / Rive Editor** | N14/N30 | animations **interactives** par state machines | WASM + éditeur | R3 + R11 | 2 | MIT (runtime) + plateforme freemium [W] | rive-wasm 971★ [API-gh] | alternative à Lottie |
| **Vivus / SVG.js / Snap.svg** | N14 | dessin progressif SVG, manipulation SVG | JS | R3 | 2 | MIT | [W] | C |
| **Icon animations** : `pqoqubbw/icons`, `animateicons`, `heroicons-animated`, `loadercn`, `soonish` | N17/N14 | icônes animées et loaders, installables fichier par fichier | React/Motion/CSS | R5 | 3 (registry CLI) | MIT/OSS [W] | [V] | **Tier C fort** |

**Fiches approfondies**
- **GSAP** — *Purpose* : moteur de chorégraphie ; *ce n'est pas* un système de composants. *Value* : plafond de contrôle le plus haut (timelines, pinning, morphing) ; coût : ~27–30 KB, hors React par défaut, piège classique = animer des propriétés de layout [W]. *Access* : `npm i gsap` ; plugins gratuits ; `@gsap/react` pour `useGSAP` (cleanup auto) [W]. *Discovery* : Impl. 3 · Design 3 · Learn 3 · Prod. 3 · AI 2 · Inspi. 2.
- **Lenis + ScrollTrigger** — pattern de production 2026 documenté : brancher `lenis.on('scroll', ScrollTrigger.update)` et piloter Lenis via `gsap.ticker.add(t => lenis.raf(t*1000))` avec `lagSmoothing(0)` ; sinon les triggers tirent une frame trop tard et les sections épinglées saccadent [W]. Impact direct sur la qualité perçue d'un site narratif.

**Resource Intelligence Layer — C1**
- *What exists* : 3 moteurs complets (GSAP, Motion, Anime.js), 2 systèmes de physique (React Spring, popmotion déprécié), 2 smooth scroll (Lenis, ScrollSmoother), 2 pipelines designeur (Lottie, Rive), 1 éditeur-timeline (Theatre).
- *Best* : Motion (React/UI) · GSAP (séquences complexes, désormais gratuit) · Lenis (scroll) · Rive (interactif) · Lottie (illustratif).
- *Free / OSS* : OSS = Motion, Anime.js, React Spring, Lenis, Theatre, Lottie, Rive runtime ; GSAP = gratuit mais propriétaire.
- *AI-ready* : 2–3 ; **le Skill officiel GSAP existe** (`greensock/gsap-skills`) [API-gh].
- *Production-ready* : tous, avec un budget perf (voir C15).
- *Learn* : respecter `prefers-reduced-motion` est non négociable [W].
- *Bookmark* : motion.dev, gsap.com, lenis.darkroom.engineering.

---

## C2. Composants UI & design systems (packages)

| Ressource | Nature | Écosystème | Récup. | AI | Licence | Preuves | Note d'usage |
|---|---|---|---|---|---|---|---|
| **MUI Material** | N05 | React | R3 | 3 | MIT | GitHub 99 130★ [API-gh] | le plus installé ; MUI X pour grilles/pickers (payant [W]) |
| **Ant Design** | N05 | React | R3 | 3 | MIT | 15 539 584 dl/mois [API-npm] | densité data, écosystème pro |
| **Mantine** | N05 | React | R3 | 3 | MIT | [W] | DX, hooks, form, dates intégrés |
| **Chakra UI** | N05 | React | R3 | 3 | MIT | 40 677★ [API-gh] | stylage par props |
| **HeroUI** | N05 | React + Tailwind | R3 | 3 | Apache-2.0 | 30 869★ [API-gh] | Tailwind natif, Next |
| **daisyUI** | N07 | CSS/Tailwind | R3/CDN | 3 | MIT | 42 542★ [API-gh] | classes sémantiques, thèmes |
| **Nuxt UI** | N05 | Nuxt | R4 | 3 | MIT | 6 985★ [API-gh] ; 125+ composants [W] | officiel Nuxt |
| **PrimeVue / PrimeReact / PrimeNG** | N07 | Vue/React/Angular | R3 | 3 | MIT | 90+ composants [W] | DataTable entreprise ; templates 99 $/an [W] |
| **Vuetify / Quasar / Element Plus / Naive UI** | N07 | Vue | R3 | 3 | MIT | 41 K★ (Vuetify) [API-gh] ; ~700 K dl/sem [W] | Quasar = multi-plateforme |
| **shadcn-vue / shadcn-svelte / spartan / Basecoat** | N10 | Vue/Svelte/Angular/HTML | R5 | 4 | MIT | [W] | mêmes garanties que shadcn |
| **Skeleton / Flowbite-Svelte / NG-ZORRO / Taiga UI / Ionic** | N07 | Svelte/Angular/Web | R3 | 3 | MIT | [API-gh] | Ionic 52 K★ |

## C3. Primitives headless & accessibilité

| Ressource | Nature | Récup. | AI | Licence | Preuves | Relations |
|---|---|---|---|---|---|---|
| **Radix Primitives** | N06 | R3 | 3 | MIT | [W] maintenance ralentie (rachat WorkOS mentionné) | remplacé progressivement par Base UI [W] |
| **Base UI** | N06 | R3 | 3 | MIT | [W] porté par l'équipe MUI, activement maintenu | alternative à Radix |
| **Ark UI / Zag.js** | N06 | R3 | 3 | MIT | 5 K★ chacun [API-gh] | machine à états indépendante du framework |
| **React Aria Components** | N06 | R3 | 3 | Apache-2.0 | [W] | référence a11y ; utilisé par Intent UI |
| **Bits UI / Reka UI / Melt UI** | N06 | R3 | 3 | MIT | [W] | bases de shadcn-svelte / shadcn-vue |
| **Headless UI** | N06 | R3 | 3 | MIT | 28 768★ [API-gh] | équipe Tailwind |

**RIL — C2/C3** : *What exists* : ~10 systèmes stylés + 6 familles de primitives + 5 ports shadcn. *Best* : shadcn (propriété du code) · MUI/Ant (entreprise) · Base UI (headless moderne 2026) · PrimeVue (Vue). *Free commercial* : MIT/Apache partout sauf MUI X et templates Prime. *AI-ready* : 3–4 (MCP shadcn). *Piège* : mélanger 2 design systems dans un projet coûte plus cher que d'en choisir un.

---

## C5. Page building, templates, starters

| Ressource | Nature | Périmètre | Récup. | AI | Licence | Preuves |
|---|---|---|---|---|---|---|
| **shadcn blocks + registries de blocs** (shadcn Space, shadcnstore, shadcnmaps, bundles) | N09 | headers, héros, pricing, footers, sections marketing | R5 | 4 | MIT/OSS selon registry [W] | [V] |
| **Tailwind Plus** | N09/N28 | blocs officiels Tailwind | R7 | 1 | **commercial** (149 $+ rapportés) [W] | — |
| **Tabler / AdminLTE / Core UI / TailAdmin / Preline Admin / Gentelella** | N11 | admin dashboards complets | R6/R7 | 2 | MIT (sauf exceptions Mosaic = GPL) [W] | [V] [W] |
| **create-t3-app** | N12 | Next + tRPC + Prisma + Tailwind, typé de bout en bout | R4 | 3 | MIT | 29 154★, poussée 2025-12-13 [API-gh] |
| **ixartz/SaaS-Boilerplate** | N12 | multi-tenant, i18n, auth, Stripe, tests | R6 | 3 | MIT [W] | 7 K★ [API-gh] |
| **BoxyHQ / Nextacular / CMSaasStarter / Blitz / Wasp / Redwood** | N12 | SaaS et full-stack opinés | R6 | 2 | MIT/Apache [W] | [API-gh] |
| **Supastarter / ShipFast-type** | N12 | SaaS premium prêts à vendre | R7 | 1 | **commercial** (69–299 $+) [W] | — |
| **Astro themes / HugoBlox / NextJSTemplates / Cruip / Salvia-kit / Horizon UI** | N11 | sites marketing, landings, dashboards | R6 | 2 | MIT/GPL selon [W] | [API-gh] |
| **Vercel Templates / Cloudflare Templates / Netlify examples** | N11/N04 | starters officiels par framework | R6 | 3 | MIT selon modèle | [V] |
| **Tailwind Play / StackBlitz / CodeSandbox / CodePen / Glitch** | N13/N26 | bacs à sable immédiats (0 installation) | R10 | 2 | freemium | [W] |
| **20+ AI starter templates** : Vercel Chatbot (20 990★ [API-gh], Apache-2.0 [W]), LangChain+Next, OpenAI RAG starter, shadcn Next Boilerplate | N12 | bases de produits IA complets | R6 | 4 | OSS [W] | [API-gh] |

**Fiche — Vercel Chatbot (chatbot template)** : *Identity* vercel/chatbot 20 990★, licence rapportée **Apache-2.0** [W] (dépôt NOASSERTION [API-gh] → **vérifier la licence du dépôt lui-même**) · *Purpose* : application de chat complète (Next.js 16 + AI SDK + shadcn, Auth.js, Postgres, stockage, multi-fournisseurs via AI Gateway) [W] · *Access* : R6 fork · *AI* 4 (conçu pour agents) · *Discovery* : Impl. 3 · Design 2 · Learn 3 · Prod. 3 · AI 3 · Inspi. 1.

**RIL — C5** : *What exists* : ~40 dashboards, ~15 starters SaaS, 6 bacs à sable, des centaines de templates de thèmes. *Best* : Tabler (admin design) · create-t3-app (full-stack typé) · Vercel Chatbot (IA) · Astro theme (contenu). *Free* : oui sauf premium ; **surveiller GPL**. *AI-ready* : 2–3. *Production-ready* : dépend de la santé du mainteneur — vérifier la dernière poussée [API-gh] avant de bâtir dessus. *Learn* : lire un starter = cours de conventions. *Bookmark* : tabler.io, create.t3.gg, vercel.com/templates, registry.directory.

---

## C6. Data & dataviz (packages)

| Ressource | Nature | Périmètre | Récup. | AI | Licence | Preuves | Relations |
|---|---|---|---|---|---|---|---|
| **D3** | N16 | primitives de visualisation (échelles, formes, transitions) | R3 | 2 | ISC | 113 806★, 88 035 686 dl/mois [API-gh/npm] | construit avec : tout l'écosystème charts |
| **Recharts** | N16 | charts React composables (SVG) | R3 | 3 | MIT | **243 360 582 dl/mois** [API-npm] ; 27 K★+ rapportés [W] | base des **charts shadcn/ui** [W] |
| **ECharts** | N16 | charts Canvas/SVG, cartes, 3D, gros volumes | R3 | 3 | Apache-2.0 | 67 453★ [API-gh] ; 21 923 328 dl/mois [API-npm] | alternative « gros volumes » |
| **Nivo** | N16 | 25+ types, SVG/Canvas/HTML, SSR | R3 | 3 | MIT | 14 106★ [API-gh] | idem |
| **visx** | N16 | primitives D3 en React, bundle minimal | R3 | 3 | MIT | 21 075★ [API-gh], 2,2 M dl/sem [W] | complément shadcn (bklit l'utilise [V]) |
| **Chart.js (+ react-chartjs-2)** | N16 | Canvas simple, plugins, wrappers officiels multi-framework | R3 | 3 | MIT | 52 456 924 dl/mois [API-npm] | alternative à Recharts |
| **ApexCharts / Highcharts** | N16 | charts riches ; Highcharts = commercial | R3 | 3 | propriétaire / commercial | highcharts 10 244 413 dl/mois [API-npm] | alternative entreprise |
| **uPlot / Chart.ts** | N16 | ultra-léger / rendu auto SVG→Canvas→WebGL | R3 | 2 | MIT/OSS | [W] | **Tier C** |
| **Tremor / bklit** | N16/N10 | dashboards React ; bklit = registry de charts shadcn | R5 | 4 | Apache-2.0 (Tremor 3 646★, poussée 2025-10-10) [API-gh] ; bklit MIT + Studio [S] | [S] [V] | bklit — alternative à — Tremor |
| **Observable Plot / Vega-Lite** | N16 | grammaires déclaratives | R3 | 3 | ISC/BSD | [W] | apprentissage rapide |
| **ExcelJS / SheetJS / PapaParse / docx / jsPDF / pdf-lib** | N18 | fichiers : Excel, CSV, Word, PDF | R3 | 3 | MIT/Apache (SheetJS 36 354★, poussée 2024-04) [API-gh] | 65–65 M dl/mois [API-npm] | chaîne « export » |
| **Datawrapper / Flourish / RAWGraphs / Observable** | N13 | outils éditoriaux (no-code/notebook) | Web | 1 | freemium | [W] | complément libs de charts |

**RIL — C6** : *Best* : Recharts (React par défaut) · ECharts (volume + cartes) · D3/visx (contrôle) · Datawrapper (éditorial rapide). *Piège technique* : SVG (Recharts/Nivo) ralentit au-delà de ~1 000–5 000 points ; Canvas/WebGL requis au-delà (ECharts, Chart.js) [W]. *AI-ready* : 2–3. *Learn* : choisir le bon graphique (Data Viz Project), puis l'implémenter.

---

## C7. Cartes & géo · C8. Tables & grilles

| Ressource | Nature | Récup. | AI | Licence | Preuves | Note |
|---|---|---|---|---|---|---|
| **MapLibre GL JS** | N16 | R3 | 3 | BSD-3 | [V] | fork OSS de Mapbox GL, pas de clé obligatoire |
| **Leaflet** | N16 | R3 | 3 | BSD-2 | 31 184 423 dl/mois [API-npm] · 45 K★ [API-gh] | référence raster/simple |
| **Mapbox GL** | N16 | R3 | 3 | propriétaire | 17 030 619 dl/mois [API-npm] | qualité + coût/quota |
| **deck.gl** | N16 | R3 | 3 | MIT | 14 627★ [API-gh] | couches de données massives |
| **Cesium** | N16 | R3 | 2 | Apache-2.0 | 15 K★ [API-gh] | globe 3D/géospatial |
| **Protomaps** | N29/N16 | R8/R12 | 3 | OSS | [V] | tuiles auto-hébergeables (souveraineté données) |
| **Turf.js** | N16 | R3 | 3 | MIT | 10 K★ [API-gh] | géométrie côté client |
| **shadcnmaps / mapcn** | N08 | R5 | 4 | OSS | [W] | **Tier C** : cartes en SVG pur, sans dépendance lourde |
| **AG Grid** | N16 | R3 | 3 | MIT (Community) + commercial (Enterprise) | 13 821 647 dl/mois [API-npm] | grille entreprise |
| **TanStack Table** | N16 | R3 | 4 | MIT | 28 473★ [API-gh] | headless, logique seule |
| **Glide Data Grid** | N16 | R3 | 3 | MIT | 5 358★ (poussée 2026-01) [API-gh] | canvas, très rapide |
| **Handsontable** | N16 | R3 | 3 | **source-available** (NOASSERTION [API-gh]) → vérifier [W] | 22 057★ [API-gh] | feuille de calcul |
| **Univer** | N16 | R3 | 3 | Apache-2.0 | 22 380★ [API-gh] | suite tableur complète |

---

## C9. 3D, WebGL, immersif (packages)

| Ressource | Récup. | AI | Licence | Preuves | Usage |
|---|---|---|---|---|---|
| **three.js** | R3 | 3 | MIT | 116 255★ [API-gh] ; 74 634 230 dl/mois [API-npm] | socle 3D |
| **@react-three/fiber** | R3 | 3 | MIT | 32 738★ [API-gh] ; 23 251 572 dl/mois [API-npm] | React renderer |
| **@react-three/drei** | R3 | 3 | MIT | 9 915★ [API-gh] ; 16 829 291 dl/mois [API-npm] | helpers (caméras, environnements, loaders) |
| **postprocessing / @pmndrs/postprocessing** | R3 | 2 | MIT/Zlib | [API-gh] | bloom, DOF, effets |
| **gltfjsx / gltf-transform** | R4 | 3 | MIT | [API-gh] | pipeline GLB (compression, inspection) |
| **leva** | R3 | 2 | MIT | phase 1 [S] | panneau de réglages de scène |
| **three-stdlib / troika-three-text** | R3 | 2 | MIT | 17 M dl/mois chacun [API-npm] | compat & texte 3D |
| **Babylon.js** | R3 | 3 | Apache-2.0 | 26 128★ [API-gh] | moteur complet + inspector |
| **PixiJS** | R3 | 3 | MIT | 48 291★ [API-gh] | 2D WebGL performant |
| **PlayCanvas engine** | R3 | 2 | MIT | 16 986★ [API-gh] | moteur + éditeur cloud |
| **model-viewer** | R10/R3 | 3 | Apache-2.0 | 8 261★ [API-gh] | embed produit en 1 balise |
| **A-Frame** | R3 | 2 | MIT | 17 K★ [API-gh] | VR déclaratif |
| **cannon-es / rapier / matter-js** | R3 | 2 | MIT/Apache | rapier3d-compat [API-npm] | physique |
| **Spline (export React/Webflow)** | R11 | 1 | freemium | [W] | designer-first |
| **HDR/GLB assets** : Poly Haven, ambientCG, Kenney, Quaternius, Sketchfab, Fab, Mixamo | R12/R8 | 3 (PolyHaven/ambientCG API sans clé) | CC0 → commercial | [W] | matière première 3D |

**RIL — C9** : *Best* : three.js/R3F (code) · Spline (design) · Babylon (ingénierie) · model-viewer (produit). *Anti-pattern documenté* : 3D « pour la 3D » (mobile, batterie, conversion) ; prévoir fallback statique, état de chargement, qualité réduite sur mobile [W]. *AI-ready* : 2–3. *Learn* : Book of Shaders → Three.js Journey.

---

## C10. Assets : packages et canaux d'intégration

| Ressource | Nature | Récup. | AI | Licence | Preuves | Note |
|---|---|---|---|---|---|---|
| **lucide-react** | N17 | R3 | 3 | ISC | **446 126 204 dl/mois** [API-npm] ; 24 867★ [API-gh] | défaut shadcn/ui [W] |
| **react-icons** | N17 | R3 | 3 | MIT | 37 042 685 dl/mois [API-npm] | agrège plusieurs sets |
| **@iconify/react + iconify API** | N17 | R8/R3 | **4** (API HTTP d'icônes = adressable par machine) | MIT | 150+ sets [W] | solution « plusieurs familles » |
| **simple-icons** | N17 | R3 | 3 | CC0 | 25 968★ [API-gh] | logos de marques |
| **tabler-icons** | N17 | R3 | 3 | MIT | 21 910★ [API-gh] | couverture large |
| **Fontsource / Google Fonts API / Fontshare** | N17 | R3/R8 | 3 | OFL/propre | [W] | variable fonts + self-host |
| **DiceBear-type generators (avatars)** | N17/N13 | R8 | 3 | OSS | [V] | avatars déterministes |
| **Satori** | N13 | R3 | 4 | MPL-2.0 | 14 014★ [API-gh] | OG images depuis JSX (attention MPL) |
| **SVGO** | N19 | R3/R4 | 3 | MIT | 162 788 279 dl/mois [API-npm] | optimisation SVG |
| **sharp** | N19 | R3 | 3 | Apache-2.0 | 433 804 332 dl/mois [API-npm] | images serveur |

---

## C11. Dev tools & DX (packages, CLI)

| Ressource | Nature | Périmètre | Récup. | AI | Licence | Preuves |
|---|---|---|---|---|---|---|
| **Vite** | N19 | bundler/dev server HMR | R3/R4 | 3 | MIT | 83 175★ [API-gh] ; 773 371 097 dl/mois [API-npm] |
| **esbuild / Rspack / Turbopack** | N19 | bundlers rapides | R3 | 3 | MIT/Apache | esbuild 1,19 Md dl/mois [API-npm] |
| **TypeScript** | N19 | typage statique | R3 | 3 | Apache-2.0 | **1,21 Md dl/mois** [API-npm] |
| **Biome** | N19 | lint + format (Rust, remplace ESLint+Prettier) | R4 | 3 | Apache-2.0 | 25 900★ [API-gh] ; 66 412 664 dl/mois [API-npm] |
| **ESLint / Prettier** | N19 | standards historiques | R3 | 3 | MIT | 672 M / 560 M dl/mois [API-npm] |
| **Vitest** | N19 | tests unitaires Vite | R3/R4 | 3 | MIT | 17 183★ [API-gh] ; 454 419 379 dl/mois [API-npm] |
| **Playwright** | N19 | E2E multi-navigateurs, trace viewer, **MCP officiel** | R3 + R13 | **5** (server MCP Microsoft, 37 836★ [API-gh]) | Apache-2.0 | 97 130★ [API-gh] ; 418 M dl/mois [API-npm] |
| **Cypress / Testing Library / MSW** | N19 | E2E alternative / tests composants / mocks réseau | R3 | 3 | MIT | 26 M dl/mois (cypress) [API-npm] |
| **Storybook** | N19/N26 | atelier de composants + docs | R4 | 3 | MIT | 91 201★ [API-gh] ; 94 406 239 dl/mois [API-npm] |
| **TanStack Query / SWR** | N18 | cache et synchro serveur | R3 | 3 | MIT | 50 400★ (Query) [API-gh] |
| **Zustand / Jotai / Valtio / Redux Toolkit** | N18 | état client | R3 | 3 | MIT | zustand 58 789★ [API-gh] |
| **React Hook Form / TanStack Form / Formisch / Formik** | N18 | formulaires | R3 | 3 | MIT | RHF 240 901 027 dl/mois [API-npm] |
| **Zod / Valibot / ArkType / Yup** | N18 | validation de schémas | R3 | **4** (schémas = contrats lisibles par IA et par API) | MIT | zod **1,26 Md dl/mois** [API-npm] ; valibot 82 M ; yup 49 M |
| **tRPC / GraphQL (Apollo) / OpenAPI-TS** | N18 | contrats client-serveur typés | R3 | 4 | MIT | tRPC 40 692★ [API-gh] ; graphql 200 M dl/mois ; openapi-typescript 32 M |
| **Hono / Fastify / Express / NestJS** | N18 | serveurs HTTP | R3 | 3 | MIT | hono 32 415★ + 278 M dl/mois [API-gh/npm] ; express 572 M ; fastify 57 M |
| **Drizzle / Prisma / Kysely / TypeORM / Mongoose / Sequelize** | N18 | accès données (SQL typé) | R3 | 4 | Apache/MIT | drizzle 35 959★ + 100 M dl/mois [API-gh/npm] ; prisma 47 696★ + 72 M |
| **React Email + Resend** | N18 | e-mails en composants | R3/R9 | 4 | MIT | 19 808★ [API-gh] |
| **Fumadocs / Nextra / Starlight / Docusaurus / Mintlify** | N11 | sites de documentation | R4/R6 | 4 | MIT | Starlight 9 366★ [API-gh] |
| **pnpm / Bun / npm / yarn** | N19 | gestionnaires de paquets | R3 | 3 | MIT | Bun = runtime + gestionnaire [W] |
| **Chrome DevTools MCP** | N22 | inspection runtime par un agent | R13 | **5** | Apache-2.0 | 53 002★ [API-gh] |

**RIL — C11** : *What exists* : une chaîne standard de fait (Vite + TS + Biome/ESLint + Vitest + Playwright + Zod) et des alternatives matures. *Best* : la chaîne ci-dessus ; Storybook pour la doc vivante ; Zod comme **contrat unique** UI/API/IA. *Free OSS* : quasi tout. *AI-ready* : 3–5 — c'est ici que les **MCP** (Playwright, Chrome DevTools, Context7) changent la donne : l'agent peut *vérifier* au lieu de supposer [W]. *Production-ready* : oui, standards. *Learn* : Playwright et Vitest valent l'investissement d'apprentissage le plus rentable en 2026.

---

## C12. Backend, infra, services (fiches condensées)

| Ressource | Nature | Point clé de décision | Récup. | AI | Licence | Preuves |
|---|---|---|---|---|---|---|
| **Supabase** | N18 | Postgres managé + auth + storage + realtime ; **pause des projets gratuits après ~7 jours** ; Pro 25 $ | R9/R14 | 4 (MCP officiel Supabase cité [W]) | Apache-2.0 (cœur) | 111 128★ [API-gh] [W] |
| **PocketBase** | N18 | 1 binaire, SQLite, SSE ; **pas d'offre hébergée** ; pré-1.0 | R14 | 3 | MIT | 61 287★ [API-gh] [W] |
| **Appwrite** | N18 | 75 K MAU gratuits, pause 1 semaine, Pro 25 $ ; Postgres/MySQL désormais | R9/R14 | 3 | BSD-3 | 57 575★ [API-gh] [W] |
| **Convex** | N18 | réactif TypeScript ; **base propriétaire** (sortie = réécriture) | R9 | 3 | propriétaire (backend OSS) | [W] |
| **Neon / Turso / Nhost** | N18 | Postgres serverless / SQLite edge / Postgres+GraphQL ; gratuits 0,5 Go / 5 Go / 1 Go [W] | R9 | 3 | Apache/MIT selon | [W] |
| **Better Auth** | N18 | auth OSS complète, indépendante du fournisseur | R3 | 3 | MIT | 30 172★ [API-gh] |
| **Clerk / Auth0 / WorkOS** | N18 | auth managée, quotas MAU ; prix [?] | R9 | 3 | propriétaire | [W] |
| **Stripe / Lemon Squeezy / Polar / Paddle** | N18 | paiement ; **disponibilité et frais varient par pays → vérifier** | R9 | 3 | propriétaire | [W] |
| **Resend / Postmark / Loops** | N18 | e-mail transactionnel | R9 | 3 | propriétaire | [V] |
| **Meilisearch / Typesense / Orama / Pagefind / Algolia** | N18 | recherche ; Pagefind = statique sans serveur | R3/R14 | 3 | MIT/Apache / propriétaire | [V] |
| **Pusher / Ably / Liveblocks / Yjs / PartyKit** | N18 | temps réel et collaboration CRDT | R3/R9 | 3 | MIT/OMS | [V] |
| **PostHog / Umami / Plausible / OpenPanel** | N18 | analytics produit et web | R3/R14 | 3 | MIT (PostHog OSS, Umami) | [V] |
| **Sentry / GlitchTip** | N18 | erreurs et traces ; GlitchTip = self-host OSS | R3/R14 | 3 | MIT/BSD | [V] |
| **Trigger.dev / Inngest / Windmill** | N18 | jobs durables, workflows | R3/R14 | 4 | Apache/MIT | [V] |
| **Coolify / Dokploy / CapRover / Dokku** | N19 | PaaS auto-hébergé ; Dokploy = cœur Apache-2.0, features entreprise sous licence séparée | R14 | 3 | Apache/MIT | [V] [W] |
| **Vercel / Netlify / Cloudflare / Render / Railway / Fly.io / Koyeb / GitHub Pages** | N18 | hébergement ; **Hobby Vercel = non commercial**, Netlify 300 crédits/mois, CF Pages 500 builds/mois | R9/R6 | 3 | propriétaire | [W] |
| **Mux / Cloudflare Stream / hls.js / Vidstack / Video.js** | N18 | vidéo (stockage, transcodage, lecteur) | R3/R9 | 3 | Apache/MIT | hls.js 16 961★ [API-gh], 38 M dl/mois [API-npm] |
| **Tone.js / Howler / Wavesurfer** | N18 | audio web (synthèse, lecture, formes d'onde) | R3 | 2 | MIT | [V] |

**RIL — C12** : *What exists* : 4 BaaS crédibles, 6 bases/ORM majeurs, 4 services d'auth, 4 de paiement, 5 de recherche, 3 de temps réel, 3 d'observabilité, 4 PaaS auto-hébergés, 8 hébergeurs. *Best par critère* : souveraineté → PocketBase/Coolify/Dokploy · vitesse de produit → Supabase/Convex · typage strict → Drizzle + Better Auth + Hono · gratuit durable → Cloudflare Pages + PocketBase sur VPS. *Piège n°1 en 2026* : confondre « gratuit » et « durable » — les pauses de projets et coupures au dépassement sont les vraies lignes de coût [W]. *AI-ready* : 3–4 (MCP Supabase/Stripe/Vercel/Netlify cités [W]).

---

## C13. Contenu & commerce · C14. Mobile, PWA, desktop

| Ressource | Nature | Récup. | AI | Licence | Preuves | Note |
|---|---|---|---|---|---|---|
| **Payload CMS** | N18 | R6/R3 | 4 | MIT | 45 096★ [API-gh] | CMS code-first + admin généré |
| **Directus / Strapi / Sanity / Tina / Keystatic / Decap** | N18 | R6/R9 | 3 | OSS/propriétaire | 38 025★ / 73 281★ NOASSERTION [API-gh] | Strapi = licence à vérifier |
| **Medusa / Saleor / Vendure / Bagisto / Spree** | N18 | R6 | 3 | MIT/BSD | Medusa 36 604★, Saleor 23 410★ [API-gh] | Saleor = Python/GraphQL |
| **Astro / Starlight** | N19/N11 | R6 | 4 | MIT (Astro NOASSERTION [API-gh]) | 63 064★ / 9 366★ [API-gh] | contenu statique + îlots |
| **Expo (React Native)** | N18 | R3 | 3 | MIT | expo 39 836 454 dl/mois [API-npm] | mobile cross-platform |
| **Flutter** | N18 | R3 | 3 | BSD-3 | 179 K★ [API-gh] | mobile + desktop + web |
| **Capacitor / Ionic** | N18 | R3 | 3 | MIT | Ionic 52 K★ [API-gh] | web → natif |
| **Tauri** | N18 | R3/R4 | 3 | MIT/Apache | [API-gh] | desktop léger (Rust) |
| **Electron / electron-react-boilerplate** | N18 | R3/R6 | 3 | MIT | 123 K★ / 24 K★ [API-gh] | desktop lourd mais mature |
| **vite-plugin-pwa / Workbox** | N19 | R3 | 3 | MIT | 19 995 889 / 39 685 741 dl/mois [API-npm] | PWA : offline, install |
| **Expo Router / React Navigation** | N18 | R3 | 3 | MIT | [V] | navigation mobile |

---

## C15. Perf, accessibilité, SEO, sécurité

| Ressource | Nature | Périmètre | Récup. | AI | Licence | Preuves |
|---|---|---|---|---|---|---|
| **Lighthouse CI** | N19 | budgets perf/a11y/SEO en CI | R3/R4 | 4 | Apache-2.0 | 7 105★ [API-gh] |
| **axe-core** | N19 | moteur de tests d'accessibilité | R3 | 4 | MPL-2.0 | 7 600★ [API-gh] ; **301 016 598 dl/mois** [API-npm] |
| **Pa11y** | N19 | CLI d'audit a11y | R4/R3 | 4 | LGPL/MIT | [V] |
| **WAVE / Deque / W3C WAI (WCAG)** | N26 | référentiels et audits | Web | 2 | référence | [V⚠ W3C] |
| **next-sitemap / schema-dts / sitemap générés** | N19 | SEO technique | R3 | 3 | MIT | 3 744★ [API-gh] ; schema-dts 11,5 M dl/mois [API-npm] |
| **Unlighthouse / PageSpeed / Web Vitals** | N19 | mesure de performance | R4/Web | 3 | MIT | [W] |
| **Zod/Valibot + OWASP + audits doc** | N18/N26 | validation et hygiène sécurité | R3 | 3 | MIT | [W] |
| **Snyk / Dependabot / Renovate / Trivy** | N19 | vulnérabilités et mises à jour | R3/R9 | 4 | OSS/propriétaire | [V] |
| **Semgrep / CodeQL / gitleaks** | N19 | analyse statique et secrets | R4 | 4 | OSS/propriétaire | [V] |

**RIL — C15** : *What exists* : la chaîne la plus automatisable du Web : c'est **le terrain naturel des agents** (audit → correctif → vérification). *Best* : Lighthouse CI + axe-core (obligatoires), Playwright pour la vérification, Pagefind/next-sitemap pour le statique. *AI-ready* : 4 — **Chrome DevTools MCP + Playwright MCP** permettent à un agent de diagnostiquer LCP ou erreurs console [W]. *Piège* : un score Lighthouse n'est pas une conformité WCAG.

---

## C16. Apprentissage (ressources individuelles)

| Ressource | Nature | Périmètre | Récup. | AI | Licence | Preuves |
|---|---|---|---|---|---|---|
| **roadmap.sh** | N26 | feuilles de route front/back/devops/IA | Web | 3 | OSS (NOASSERTION [API-gh]) | 368 957★ [API-gh] |
| **MDN Web Docs / MDN Curriculum** | N26 | référence HTML/CSS/JS | Web | 3 | CC-BY-SA (contenu) | [W] |
| **javascript.info** | N26 | cours JS de référence progressif | Web | 3 | libre | [W] |
| **freeCodeCamp / The Odin Project** | N26 | cursus complets gratuits, projets | Web | 3 | free | [W] |
| **Frontend Masters** | N26 | ateliers experts | Payant | 2 | commercial | **39 $/mois** [W] ; 6 mois offerts via GitHub Student Pack [W] |
| **Scrimba** | N26 | parcours interactif aligné MDN | freemium | 2 | commercial | **24,50 $/mois** (annuel) [W] |
| **Three.js Journey** | N26 | 3D/shaders en profondeur | Payant | 2 | commercial | **95 $, 93 h**, Discord actif [W] |
| **The Book of Shaders / Generative Design / Shadertoy** | N26/N02 | shaders et art génératif par la pratique | Web | 2 | libre | [V] |
| **patterns.dev / web.dev / Josh Comeau / Kent C. Dodds / Total TypeScript** | N26 | articles et cours ciblés de haute qualité | Web | 2–3 | libre/payant | [V] |
| **openai-cookbook / anthropic cookbook / generative-ai-for-beginners** | N26/N21 | recettes IA | R6 | 4 | MIT | 76 357★ [API-gh] |
| **dair-ai Prompt Engineering Guide / learnprompting.org / prompts.chat** | N21/N26 | guides et bibliothèques de prompts | Web/R6 | 4 | OSS | [V] |
| **State of JS / State of CSS / Stack Overflow Survey** | N26/N29 | données d'écosystème (décider avec des faits) | Web | 3 | libre | [V] |
| **Exercism / Frontend Mentor / Codewars-type** | N26/N27 | exercices et défis | R3/Web | 3 | libre/freemium | [V] |
| **DevDocs / Devhints / Can I Use** | N26 | référence condensée | Web | 3 | MIT/CC | [V] |

**RIL — C16** : *What exists* : deux voies concurrentes — **cursus longs gratuits** (Odin, freeCodeCamp) et **ciblage expert payant** (Frontend Masters, Three.js Journey, Scrimba). *Best* : roadmap.sh (orientation) → MDN/javascript.info (fond) → un cours payant sur le domaine rare (3D, shaders, perf). *AI-ready* : 3–4 ; `Context7` (MCP) sert exactement à éviter la documentation périmée [W]. *Learn* : la meilleure ressource d'apprentissage d'une techno est souvent **le code d'un registry** : petits fichiers, dépendances explicites, licence lisible.

---

## C17. IA & agents — renvoi
Les fiches détaillées (MCP, Skills, kits UI IA, orchestrateurs, observabilité, agents de code) sont dans **06-AI-resource-map.md**, avec les champs spécifiques imposés : outils exposés, installation, clients compatibles, permissions, risques, licence, maintenance, popularité, dernière activité.


---

## Voir aussi

- [[dri/12-student-plans|Plans étudiants — ressources gratuites et réduites pour étudiants]]
