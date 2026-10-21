# DRI 03 — PLATFORM DIRECTORY
### Fiches des plateformes, écosystèmes et services — Tier A / B / C
**5 octobre 2026** · Natures : voir doc 02 · Tier : A = majeur · B = alternative forte · C = pépite cachée

> Convention de confiance : **[API]** = métadonnée lue via API GitHub/npm le 5 oct. 2026 · **[V]** = URL vérifiée HTTP 200 · **[V⚠]** = site vivant mais protégé anti-bot (403/429) · **[S]** = vérifié en phase 1 (`cartographie-creation-numerique.md`) · **[W]** = source Web 2026 citée · **[?]** = à vérifier avant décision.

---

# Famille A — Inspiration & référence

## A.1 Refero — N02 Galerie · **Tier A**
- **Identity** : Refero (refero.design) [V]. Base de captures de **produits réels** organisées par type de page (pricing, about, carrières, docs) et par composant (headers, footers, CTA, témoignages) ; **112 000+ pages et écrans iOS** annoncés, taggés manuellement [W].
- **Purpose** : répondre à « à quoi ressemble un pricing crédible ? » avec du **réel expédié**, pas du concept. Ce n'est **pas** un livre de composants : on n'en sort pas de code.
- **Technology** : site (captures), pas de SDK.
- **Access** : consultation web (R1 n/a) ; offre gratuite + version premium pour l'archive complète [W].
- **AI** : **1/5** — contenu lisible par un humain, aucun canal machine ; utile comme **entrée de moodboard** qu'un humain convertit en prompt.
- **License** : propriétaire (contenu de tiers) — vérifier les conditions d'usage des captures avant publication [?].
- **Practical value** : gain de temps de cadrage majeur en phase 1–2 ; risque de mimétisme si on s'arrête aux captures.
- **Discovery** : Impl. 1 · Design 3 · Learn 1 · Prod. 0 · AI 0 · Inspi. 3.
- **Relations** : alternative à Mobbin (web vs mobile) · complément de Lapa Ninja/Land-book (structure de page).
- **Confiance** : [V] [W].

## A.2 Mobbin — N02 Galerie · **Tier A**
- **Identity** : Mobbin (mobbin.com) [V]. Écrans et **flows** réels d'applications iOS/Android/web, filtrables par type d'écran et par pattern [W].
- **Purpose** : recherche d'UX (« comment Spotify gère l'onboarding »), niveau « research-grade » [W].
- **Access** : offre gratuite + abonnement ; les tarifs rapportés varient selon les sources (≈ 25 $/mois Pro, ≈ 2,50 $/semaine selon une autre) → **[?]** vérifier sur place.
- **AI** : **1/5** (aucun canal machine documenté).
- **License** : propriétaire.
- **Discovery** : Impl. 1 · Design 3 · Learn 2 · Prod. 0 · AI 0 · Inspi. 3.
- **Relations** : alternative à Refero · complément de Pageflows (vidéos de flows).
- **Confiance** : [V] [W] · prix [?].

## A.3 Awwwards — N01 Inspiration · **Tier A**
- **Identity** : Awwwards [V]. Galerie primée, jury quotidien, filtres type/technologie/couleur/secteur [W].
- **Purpose** : benchmark visuel haut de gamme ; détection de techniques (WebGL, scroll storytelling).
- **Access** : navigation gratuite ; offre Pro ; **frais de soumission ≈ 65 €** rapportés pour un site [W] · tarifs Pro divergents selon sources → **[?]**.
- **AI** : **0/5**.
- **License** : propriétaire (œuvres des studios).
- **Discovery** : Impl. 0 · Design 3 · Learn 1 · Prod. 0 · AI 0 · Inspi. 3.
- **Relations** : alternative à Godly/Recent, SiteInspire, CSS Design Awards · complément de Dribbble (concepts).
- **Confiance** : [V] [W].

## A.4 Autres Tier B/C (famille A)
| Plateforme | Nature | Ce qu'elle apporte | Accès | Tier | Confiance |
|---|---|---|---|---|---|
| Godly → **Recent** | N01 | Sélection expressive/commerciale, aperçus animés [W] | gratuit | A | [V] [W] |
| **SiteInspire** | N01 | Curaté depuis 2010, filtres style/type/sujet, biais minimaliste [W] | gratuit | A | [V] [W] |
| **Lapa Ninja** | N01 | 7 300+ captures de landing pages [W] | gratuit | B | [V⚠] [W] |
| **Land-book** | N01 | Landing pages strictement curatées [W] | gratuit | B | [V] [W] |
| **One Page Love** | N01 | Sites mono-page [W] | gratuit | C | [V] [W] |
| **Pageflows** | N02 | **Vidéos** de flows produits réels [W] | freemium | B | [V⚠] [W] |
| **Savee.it** | N01/N02 | Galerie + bookmarking visuel (Pinterest pro) [W] | gratuit | C | [V] [W] |
| **Httpster / Minimal Gallery / Dark Mode Design** | N01 | Niches : minimal, typographique, dark [W] | gratuit | C | [V] [W] |
| **Dribbble / Behance** | N27 | Concepts (Dribbble) et études de cas (Behance) [W] | freemium | B | [V⚠] [W] |
| **Figma Community** | N30/N02 | Fichiers source éditables (dupliqués → design) [W] | freemium | A | [V] |
| **Muzli** | N01 | Flux passif d'inspiration [W] | gratuit | C | [W] |
| **Typewolf / Fontpair** | N26/N13 | Choix et appariements typographiques [W] | gratuit | C | [V] [W] |
| **Coolors / Color Hunt / Realtime Colors / Huemint** | N13 | Palettes : génération, tendances, application temps réel, IA [W] | freemium | B | [V] [W] |

**Resource Intelligence Layer — famille A**
- *What exists* : ~30 sources, dont beaucoup se recouvrent ; deux usages distincts : **référence produit** (Refero/Mobbin/Pageflows/Screenlane) et **direction artistique** (Awwwards/Recent/Dribbble/Behance).
- *Best* : Refero + Mobbin (produit) · Awwwards/Recent (DA) · Figma Community (source éditable).
- *Free* : toutes les sources DA ; Mobbin/Refero en tiers gratuits limités.
- *Open source* : quasi aucune (contenu propriétaire) → **cette famille ne fournit pas de code**.
- *AI-ready* : 0–1 ; c'est la famille la **moins automatisable** : elle alimente l'humain qui écrit le prompt.
- *Production-ready* : sans objet.
- *Learn* : Pageflows (interaction), Designspells (micro-interactions) [W].
- *Bookmark* : Refero, Awwwards, Lapa Ninja, Figma Community.

---

# Famille B — Composants UI, registries et design systems

## B.1 shadcn/ui — N10 Registry + N08 snippets + N05 tokens · **Tier A**
- **Identity** : shadcn-ui/ui, dépôt **125 158★, MIT, dernière poussée 2026-10-05** [API] ; site ui.shadcn.com [V].
- **Purpose** : composants accessibles **copiés dans votre dépôt** (vous possédez le code), thémables par variables CSS, distribuables via registries. Ce n'est **pas** une dépendance à installer ; ce n'est **pas** une DA clé en main.
- **Technology** : React + TypeScript + Tailwind ; primitives au choix selon l'époque (Radix **ou** Base UI **ou** React Aria) [W].
- **Access** : CLI registry (**R5**) `npx shadcn@latest add …` ; variantes Vue/Svelte/Angular via ports communautaires ; MCP shadcn (voir 06) pour l'installation pilotée par agent [W].
- **AI** : **4–5/5** — registre lisible machine (JSON de registry), CLI stable, **MCP officiel communautaire documenté** (`claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp`) [W]. C'est **le canal par lequel une IA installe de vrais composants** plutôt que d'improviser du JSX.
- **License** : **MIT** [API] (le code copié reste MIT ; le thème que vous en faites est à vous).
- **Practical value** : socle par défaut de la majorité des nouveaux projets Tailwind en 2026 [W] ; dette : vous maintenez le code copié.
- **Discovery** : Impl. 3 · Design 2 · Learn 2 · Prod. 3 · AI 3 · Inspi. 1.
- **Relations** : alternative à MUI/Mantine (approche propriété du code) · construit avec Radix/Base UI/React Aria · distribué via CLI + registries tiers · **4 ports officieux** (shadcn-vue, shadcn-svelte, spartan/ui, Basecoat HTML, RN Reusables) [W].
- **Confiance** : [API] [V] [W].

## B.2 Registries d'effets et de composants — grappe majeure · **Tier A/B/C**
| Plateforme | Nature | Volume annoncé | Distribution | Licence | Tier | Confiance |
|---|---|---|---|---|---|---|
| **Magic UI** (magicui.design) | N08/N10 | 150+ composants animés [W] | shadcn CLI | **MIT** (dépôt 22 475★ [API]) ; freemium marketing [W] | **A** | [API] [V] [W] |
| **Aceternity UI** | N08/N10 | 330+ composants, **200+ gratuits**, templates premium **199 $** [W] | copie + CLI | gratuit + premium | **B** | [V] [W] |
| **React Bits** (seed phase 1) | N08 | **213 composants** [S] ; index général ~664 items [W] | copie (JS/CSS/Tailwind/TS) | **MIT + Commons Clause** (pas de revente) [S] ; Pro 129/249/349 $ [S] | **A** | [S] [W] |
| **Animate UI** | N10 | composants animés open source (dépôt indexé 580 items) [W] | shadcn CLI | open source | B | [W] |
| **Motion Primitives** | N08 | primitives de texte/hover/transition à composer [W] | copie/CLI | gratuit | B | [W] |
| **Cult UI** | N08 | effets « déjà en forme de contrôle » (carrousel 3D, panneau flottant) [W] | copie/CLI | gratuit/OSS | B | [W] |
| **Kokonut UI** | N08 | 100+ composants (SVG animés, surfaces IA) [W] | copie/CLI | gratuit | B | [V] [W] |
| **Kibo UI** | N10 | composants « applicatifs » avancés, MIT [W] | shadcn CLI | MIT | B | [V] [W] |
| **Origin UI** | N10 | très large couverture de composants, animations minimales [W] | shadcn CLI | gratuit | B | [W] |
| **Eldora UI / Animata** | N08 | micro-interactions et composants animés [W] | copie/CLI | gratuit | C | [W] |
| **000h, MicroKit, loadercn, scrollxui, soonish** | N08 | micro-interactions, loaders CSS purs, specs rares [W/V] | copie/CLI | OSS | **C** | [V] [W] |
| **HextaUI / ReUI / Intent UI / JollyUI / Skiper UI / Shadix / Tweakcn** | N07–N13 | extensions, variantes react-aria, éditeur de thème shadcn [V/W] | CLI + web | MIT/OSS | C | [V] [W] |
| **pqoqubbw/icons, animateicons** | N17 | icônes animées (motion + lucide), installables fichier par fichier [W] | CLI | MIT | C | [W] |
| **8bitcn, brut-ui, RetroUI, neobrutalism** | N07/N08 | **styles rares** : pixel 8-bit, neo-brutaliste paramétrable [V/W] | CLI | OSS | **C** | [V] [W] |

- **Distinction à conserver** (règle anti-doublon) : Magic UI = **cohérence marketing** ; Aceternity = **impact visuel fort** ; React Bits = **variété de textes/arrière-plans** ; CultUI/Motion Primitives = **contrôles composables** [W].
- **AI** : 3–4/5 pour tous les registries shadcn (installables par CLI/agent) ; 2/5 pour les sites à copie manuelle.
- **Pépite stratégique** : **registry.directory** [V] et **shoogle.dev/directory** (**418 registries** indexés, tri par fraîcheur et étoiles) [V/W] — ce sont les **cartes de la galaxie shadcn** : sans elles on ne voit que 5 % de l'écosystème.
- **Risque documenté** : « installer depuis des registries communautaires ajoute une **dépendance de maintenance** : le code est chez vous et plus personne ne le met à jour » [W] → à mettre en balance avec le bénéfice.

## B.3 Librairies établies et primitives headless
| Ressource | Nature | Écosystème | Licence | Signaux [API] | Tier |
|---|---|---|---|---|---|
| **MUI (Material UI)** | N05/N07 | React | MIT | 99 130★, poussée 2026-10-05 | **A** (entreprise) |
| **Mantine** | N05/N07 | React | MIT | [W] DX forte, dense en fonctionnalités | **A** |
| **Chakra UI** | N05 | React | MIT | 40 677★ | B |
| **Ant Design** | N05 | React | MIT | [W] data-heavy | B |
| **HeroUI** | N05 | React/Tailwind | Apache-2.0 | 30 869★ | B |
| **daisyUI** | N07 | CSS/Tailwind | MIT | 42 542★, classless-friendly | B |
| **Flowbite / Preline** | N09/N10 | HTML/Tailwind + Alpine | MIT | 640+ composants Preline [W] | B |
| **Tailwind Plus (ex-Tailwind UI)** | N09/N28 | HTML/React/Vue | **commercial** (149 $+ rapportés [W]) | — | B |
| **Headless UI** | N06 | React/Vue | MIT | 28 768★ | B |
| **Radix Primitives** | N06 | React | MIT | **maintenance ralentie**, rachat WorkOS mentionné [W] | A (historique) |
| **Base UI** | N06 | React | MIT | présenté comme successeur headless actif [W] | **A** (2026) |
| **Ark UI / Zag** | N06 | React/Vue/Svelte/Solid | MIT | 5 K★ chacun [API] | B |
| **React Aria (Adobe)** | N06 | React | Apache-2.0 | accessibilité de référence [W] | A (a11y) |
| **PrimeVue / PrimeReact / PrimeNG** | N07 | Vue/React/Angular | MIT (+ templates 99 $/an [W]) | 90+ composants, meilleure DataTable revendiquée [W] | **A** (non-React) |
| **Vuetify / Quasar** | N07 | Vue | MIT | 41 K★ / 27 K★ [API/W] | A / B |
| **Nuxt UI** | N05 | Nuxt | MIT | 6 985★, 125+ composants [API/W] | A (Nuxt) |
| **shadcn-vue / shadcn-svelte / spartan (Angular) / Basecoat (HTML) / RN Reusables** | N10 | Vue/Svelte/Angular/HTML/RN | MIT | ports communautaires [W] | A/B |
| **Bits UI / Reka UI** | N06 | Svelte / Vue | MIT | bases de shadcn-svelte / shadcn-vue [W] | B |
| **Skeleton / Flowbite-Svelte / Element Plus / Naive UI / NG-ZORRO / Taiga UI** | N07 | Svelte/Vue/Angular | MIT | [API] | B/C |

**Resource Intelligence Layer — famille B**
- *What exists* : ~10 systèmes complets + **7 familles de registries** (effets, blocs, apps, style rare, loaders, icônes animées, thèmes) + primitives headless pour 6 frameworks.
- *Best* : shadcn/ui (React + Tailwind) · PrimeVue (Vue entreprise) · Nuxt UI (Nuxt) · shadcn-svelte (Svelte) · MUI (React entreprise établie).
- *Free commercial* : tout le groupe MIT/Apache ; attention Magic UI/React Bits : MIT mais **conditions commerciales propres** ([S]).
- *Open source* : ≈ 90 % de la famille.
- *AI-ready* : 3–5 — le champ de bataille 2026 : registries + **MCP shadcn/Magic UI/Figma** [W].
- *Production-ready* : MUI, Mantine, Ant Design, PrimeVue, Vuetify (cycles de release et support long).
- *Learn* : lire le code d'un registry (petits fichiers, dépendances explicites) = le meilleur exercice d'apprentissage Tailwind/ARIA.
- *Bookmark* : registry.directory, shoogle.dev, ui.shadcn.com, magicui.design, reactbits.dev.

---

# Famille C — Blocks, templates, starters, boilerplates

## C.1 Tabler — N11 Template + N07 composants · **Tier A**
- **Identity** : tabler.io / tabler/tabler [V]. Admin dashboard open source le mieux noté et cité comme référence de design ; **4 590 icônes SVG**, mode sombre, 200+ composants rapportés [W] ; ~40 800★ rapportés [W].
- **Purpose** : base d'admin complète (pages, tables, charts, pricing) prête à connecter à n'importe quel backend.
- **Technology** : Bootstrap 5 + HTML5 ; variantes/forks pour React/Vue/Laravel [W].
- **Access** : clone/ZIP (**R6/R7**) ; paquet d'icônes (tabler/tabler-icons **21 910★, MIT** [API]).
- **AI** : **2/5** (HTML/classes prévisibles → bon contexte pour agent, pas de MCP).
- **License** : **MIT** ([API] pour les icônes ; à confirmer pour le template sur sa page — [?]).
- **Discovery** : Impl. 3 · Design 2 · Learn 2 · Prod. 3 · AI 1 · Inspi. 1.
- **Relations** : alternative à AdminLTE, Core UI, TailAdmin.
- **Confiance** : [V] [W] [API].

## C.2 Grappe « admin dashboards 2026 » (extrait vérifié [W])
| Template | Stack | Licence revendiquée | Pour qui |
|---|---|---|---|
| **AdminLTE 4** | Bootstrap 5 + vanilla | MIT, 45 K★ | plus grande communauté, réponses Stack Overflow |
| **Gentelella** | Vite + vanilla + Sass | MIT, 21 K★ | sans Bootstrap/jQuery, palette ⌘K |
| **Core UI** | Bootstrap 5 + React/Vue/Angular | MIT (+ versions payantes) | parité multi-framework |
| **TailAdmin** | Tailwind (Next/Laravel/HTML) | MIT/OSS revendiqué | Tailwind + Laravel |
| **Preline Admin** | Tailwind + Alpine | MIT | dépendance minimale |
| **CoolAdmin / Mazer / Metis (Alpine) / Notika** | Bootstrap 5 / Alpine | MIT | alternatives légères, no-jQuery |
| **Mosaic Lite (Cruip)** | React + Tailwind + Chart.js | **GPL** pour la version gratuite | attention copyleft en produit fermé |
| **SaaS dashboards** : shadcn-admin (15 593★, MIT [API]), Horizon UI (Chakra), NextAdmin, Salvia-kit | Next/React | MIT/OSS | bases modernes shadcn |

## C.3 Starters full-stack et SaaS
| Ressource | Nature | Signaux | Licence | Tier | Confiance |
|---|---|---|---|---|---|
| **create-t3-app** | N12 | 29 154★ | MIT | A | [API] |
| **ixartz/SaaS-Boilerplate** | N12 | 7 K★·, listing [API] | MIT | A | [API] [W] |
| **Supastarter** | N12 | premium cité (jusqu'à 299 $+) [W] | commercial | B | [W] |
| **BoxyHQ, Nextacular, CMSaasStarter (SvelteKit), Vercel starters** | N12 | cités [W] | OSS/MIT selon dépôt | B | [W] |
| **vercel/templates, create-next-app, Astro themes, HugoBlox** | N11/N12 | écosystèmes officiels | MIT/varies | A | [V] |
| **kriasoft/react-starter-kit, hackathon-starter, electron-react-boilerplate** | N12 | 23–35 K★ [API] | MIT | B | [API] |

**Resource Intelligence Layer — famille C**
- *What exists* : la famille la plus **redondante** : ~40 templates d'admin sérieux et des centaines de starters ; le discriminant n'est plus le design mais **le backend attendu et la licence**.
- *Best* : Tabler (design) · AdminLTE (communauté) · TailAdmin (Tailwind) · shadcn-admin (Next + shadcn).
- *Free commercial* : MIT partout — **exceptions GPL à surveiller** (Mosaic Lite).
- *Open source* : oui, sauf les offres premium (Apex, Haze, TailPanel, Metronic, Supastarter).
- *AI-ready* : 2/5 (le starter est un excellent **contexte structuré**, mais rien n'est exposé en machine).
- *Production-ready* : Tabler, Core UI, AdminLTE (support et communauté) ; les starters SaaS dépendent du mainteneur.
- *Learn* : décortiquer un starter = apprendre les conventions de production (auth, env, CI).
- *Bookmark* : tabler.io, adminlte.io, create.t3.gg, vercel.com/templates.

---

# Famille E — 3D, WebGL, shaders, creative coding

## E.1 three.js + React Three Fiber — N15 · **Tier A**
- **Identity** : mrdoob/three.js **116 255★, MIT, poussée 2026-10-05** [API] ; pmndrs/react-three-fiber **32 738★, MIT** · pmndrs/drei **9 915★** [API] ; sites threejs.org, docs.pmnd.rs [V].
- **Purpose** : scènes 3D web : produits, héros immersifs, configurateurs, data 3D. Ce n'est **pas** un éditeur : pas d'interface visuelle.
- **Technology** : WebGL/WebGPU, scene graph ; écosystème pmndrs (drei, postprocessing, rapier, gltfjsx, leva) [API/W].
- **Access** : npm (**R3**) ; exemples et docs ; glTF/GLB comme format pivot [W].
- **AI** : **3/5** — API texte stable, très représentée dans les corpus → les agents produisent du R3F plausible, mais nécessitent revue (états, cleanup, perf).
- **License** : **MIT** [API].
- **Practical value** : plafond créatif maximal ; coût : poids (~155 KB gzip annoncés pour three.js [W]), mobile, accessibilité, `prefers-reduced-motion`, fallback statique obligatoire [W].
- **Discovery** : Impl. 3 · Design 3 · Learn 3 · Prod. 2 · AI 2 · Inspi. 3.
- **Relations** : alternative à Babylon.js/PlayCanvas (bibliothèque vs moteur) · complément de Lenis (scroll), Theatre.js (timeline), Poly Haven (HDRI/GLB).
- **Confiance** : [API] [V].

## E.2 Autres Tier A/B/C de la famille E
| Plateforme | Nature | Rôle | Signaux / faits 2026 | Tier |
|---|---|---|---|---|
| **Babylon.js** | N15 | moteur complet (physique, WebXR, inspector, node material editor) | 26 128★, Apache-2.0 [API] ; jeux/CAO/simulations [W] | **A** |
| **PlayCanvas** | N15 | moteur + **éditeur collaboratif navigateur** | 16 986★, MIT pour le moteur [API] ; plateforme propriétaire [W] | B |
| **Spline** | N30/N15 | 3D **no-code**, collaboration type Figma, export React/Webflow | gratuit + payant [W] | **A** (accessibilité) |
| **model-viewer** | N15 | web-component pour **embed** d'un GLB en 1 balise | 8 261★, Apache-2.0 [API] | B |
| **Shadertoy** | N02/N26 | galerie + atelier de shaders GLSL (raymarching, procédural) [W] | [V⚠ 403] | **A** (apprentissage) |
| **The Book of Shaders** | N26 | référence pédagogique shaders, étape par étape | [V] | **A** |
| **p5.js** | N15/N26 | creative coding accessible, éditeur web | 24 083★, **LGPL-2.1** [API] | A |
| **Hydra / Cables.gl / Dwitter / Shader Park / thi.ng / Nannou / openFrameworks / Processing** | N15/N26 | live coding, nœuds, défi 140 octets, JS→shaders, 190+ libs TS, Rust, C++ | [W] | B/C |
| **PixiJS** | N15 | rendu 2D WebGL très performant (jeux, effets) | 48 291★, MIT [API] | B |
| **Curtains.js / ogl** | N15 | WebGL léger orienté effets (images, plans) | [W] | C |
| **Theatre.js** | N14/N30 | éditeur de timeline + runtime, intégration three | Apache-2.0, maintenance jugée incertaine [W] | B |
| **LottieFiles / dotLottie** | N14/N17 | lecture d'animations After Effects (JSON/.lottie), theming, wrappers | runtime WASM, LottieFiles/motion-design-skill (Skill) [API] | **A** |
| **Rive** | N14/N30 | animations **à state machine** (interactives) via éditeur + runtime | distinction Lottie vs Rive [W] | **A** |

**Resource Intelligence Layer — famille E**
- *What exists* : 3 moteurs généralistes, 1 no-code, 4 approches « effet », 3 ateliers d'apprentissage, 2 pipelines d'animation designeur.
- *Best* : three.js/R3F (code) · Spline (designer) · Babylon.js (jeu/ingénierie) · model-viewer (produit simple).
- *Free* : tout, sauf offres cloud de PlayCanvas/Spline.
- *Open source* : three.js, Babylon, PlayCanvas (moteur), PixiJS, Theatre.js — **attention p5.js = LGPL** [API].
- *AI-ready* : 2–3 (pas de MCP officiel ; Skill GSAP/Lottie présents pour la motion) [API].
- *Production-ready* : three.js et Babylon (documentation, cycles, support entreprise côté Babylon).
- *Learn* : The Book of Shaders → Shadertoy → Three.js Journey (93 h, 95 $) [W].
- *Bookmark* : threejs.org, shadertoy.com, polyhaven.com, spline.design.

---

# Famille F — Data & dataviz

| Plateforme | Nature | Faits vérifiés | Licence | Tier |
|---|---|---|---|---|
| **Observable** | N02/N26/N16 | atelier **notebooks** + galerie + Plot/D3 dans le navigateur [W] | gratuit/payant selon plan [?] | **A** |
| **Datawrapper** | N13 | outil éditorial (cartes, graphs, tables) sans code, exports embarquables | freemium [W] | **A** |
| **Flourish** | N13 | stories data, animations, templates | freemium [W] | B |
| **RAWGraphs** | N13/N16 | graphiques non conventionnels depuis un CSV | OSS [V] | B |
| **Information is Beautiful / Data Viz Project / FlowingData** | N01/N26 | références d'inspiration et de taxonomie visuelle | gratuit [W] | B |
| **ECharts / D3 / Recharts / Nivo / visx / Chart.js / ApexCharts / Highcharts** | N16 | voir matrices doc 05 ; signaux : 67 453★ Apache [API] (ECharts), 113 806★ ISC (D3), 14 106★ MIT (Nivo), 21 075★ MIT (visx), Apex/Highcharts propriétaires | variées | A/B |
| **AG Grid / TanStack Table / Glide Data Grid / Handsontable / Univer** | N16 | grilles et feuilles ; 28 473★ MIT (TanStack Table), 22 380★ Apache (Univer), 22 057★ NOASSERTION (Handsontable) [API] | variées | A/B/C |
| **deck.gl / MapLibre / Leaflet / Mapbox / Cesium / Protomaps / Turf** | N16 | 14 627★ MIT (deck.gl) [API] ; Leaflet BSD-2 [W] ; MapLibre OSS fork de Mapbox GL (voir doc 04) | variées | A/B |

**Resource Intelligence Layer — famille F**
- *What exists* : 8 librairies de charts crédibles, 3 ateliers éditoriaux, 7 piles cartographiques, 5 grilles de données.
- *Best* : Recharts (défaut React, 243 M dl/mois [API]) · ECharts (grands volumes, cartes, 3D) · D3 (contrôle total) · Observable (exploration) · AG Grid (grille entreprise).
- *Free* : toutes les OSS ; ECharts/Highcharts : Highcharts = commercial, ApexCharts propriétaire [V].
- *AI-ready* : 2/5 (les specs de graphiques sont un excellent objet pour un agent, mais aucun MCP de dataviz courant recensé ici).
- *Production-ready* : ECharts, D3, Highcharts, AG Grid (support).
- *Learn* : Dataviz Project (choisir le bon type), Information is Beautiful (culture), Observable (D3 moderne).
- *Bookmark* : echarts.apache.org, recharts.org, observablehq.com, maplibre.org.

---

# Famille G — Assets

| Plateforme | Sous-famille | Faits vérifiés 2026 | Licence | Tier |
|---|---|---|---|---|
| **Poly Haven** | 3D/HDR/Textures | 2 300+ assets (520+ modèles, 850+ textures, 990+ HDRIs), API **sans clé**, téléchargement direct | **CC0** | **A** |
| **ambientCG** | Textures/HDRIs | 2 000+ matériaux PBR, 420+ HDRIs, API documentée | **CC0** | **A** |
| **Kenney / Quaternius / KayKit** | 3D jeu | modèles « game-ready », style cohérent, sans compte | **CC0** | **A** |
| **Poly Pizza / Icosa Gallery** | 3D low-poly | archive Google Poly, API, majoritairement CC-BY | CC-BY/CC0 | B |
| **BlenderKit** | 3D/Fabrics | 45 000+ assets gratuits, add-on Blender, filtre licence | Royalty-Free/CC0 | B |
| **Sketchfab / Fab / CGTrader / TurboSquid** | Marchés 3D | licence mixte, compte requis ; Fab inclut Megascans gratuits | standard/commercial | B |
| **Mixamo** | Animations | animations de personnages gratuites, sans intégration software | gratuit [?] | **A** |
| **OpenGameArt / Smithsonian / NASA 3D** | Divers | CC0/CC-BY ; scans musée et espace | variées | C |
| **Lucide** | Icônes | 24 867★ [API], 1 780 icônes, **ISC**, packages React/Vue/Svelte [W] | ISC | **A** |
| **Tabler Icons** | Icônes | 21 910★ MIT [API], ~5 800–6 000 icônes [W] | MIT | **A** |
| **Phosphor / Heroicons / Material Symbols / Remix / Iconoir / Fluent / Bootstrap Icons** | Icônes | 6 graisses (Phosphor), 1 288 SVG (Heroicons), variable (Material) [W] | MIT/Apache/OFL | A/B |
| **Simple Icons / Font Awesome** | Logos/brands | 25 968★ CC0 [API] (Simple Icons) ; 76 955★ + Pro 99 $/an [API/W] (FA) | CC0 / CC-BY + Pro | A/C |
| **Iconify** | Infrastructure | 150+ sets derrière une API/un composant, MIT [W] | MIT | **A** |
| **Google Fonts / Fontshare / Font Squirrel / League of Moveable Type / Velvetyne / Collletttivo / Uncut / Open Foundry / Fontesk** | Fonts | Fontshare = qualité « premium feel » gratuite commerciale ; Font Squirrel = certitude commerciale ; OFL majoritaire [W] | OFL / libre / propres | A/B/C |
| **unDraw / Open Peeps / Open Doodles / Humaaans** | Illustrations | sans attribution, recolorables (unDraw) ; CC0 (Peeps, Humaaans, Doodles) [W] | libre/CC0 | **A** |
| **Storyset (Freepik) / Icons8 Ouch / DrawKit / Blush / ManyPixels** | Illustrations | attribution ou caps quotidiens (Storyset), Lottie + 3D gratuits (DrawKit) [W] | freemium/attribution | B |
| **Unsplash / Pexels / Pixabay / StockSnap** | Photos | Unsplash License, CC0 (Pexels/Pixabay/StockSnap) [W] | propres/CC0 | **A** |
| **SALY, Niku, Glaze, Handz, Absurd Design, ManyPixels, Illustrations.co, Lukasz Adam** | Illustrations | styles 3D/peint/absurde, majoritairement libres [W] | variées | C |
| **Freesound / Pixabay Audio / Uppbeat / Jamendo** | Audio | licences variables (Jamendo : perso gratuit / synchro payante) [W] | variables | B |

**Resource Intelligence Layer — famille G**
- *What exists* : le plus grand gisement du Web ; 4 régimes de licence cohabitent (CC0, attribution, freemium, commercial).
- *Best* : Lucide/Tabler (icônes) · Poly Haven + ambientCG (3D/PBR/HDR) · Kenney/Quaternius (jeu) · unDraw (illustration rapide) · Fontshare + Google Fonts (typo) · Unsplash/Pexels (photo).
- *Free sans attribution (usage commercial)* : Poly Haven, ambientCG, Kenney, Quaternius, KayKit, Humaaans, Open Peeps, Open Doodles, unDraw, Simple Icons, Pexels/Pixabay/StockSnap.
- *AI-ready* : 1–3 (Poly Haven et ambientCG ont des **API sans clé** → 3 ; les galeries sans API → 1–2).
- *Production-ready* : vérifier **la licence de chaque asset individuellement** — beaucoup de sites mélangent les régimes (Sketchfab, Fab, BlenderKit).
- *Learn* : la discipline « tracer la licence » est ici plus importante que le choix esthétique.
- *Bookmark* : polyhaven.com, ambientcg.com, lucide.dev, undraw.co, fontshare.com.

---

# Famille H — IA, MCP, Skills (synthèse ; détail complet en doc 06)

| Plateforme | Nature | Faits vérifiés 2026 | Tier |
|---|---|---|---|
| **Registre MCP officiel** (registry.modelcontextprotocol.io) | N04/N22 | gratuit, **non revu** (c'est un registre, pas un store) ; publication via `mcp-publisher` + `server.json` ; espaces de noms vérifiés par DNS ; supporte les serveurs **remote** (`remotes`) [W] | **A** |
| **Glama / Smithery / mcp.so / mcpservers.org / PulseMCP** | N04 | ~21 K / 7 K+ / 20 222 (avril 2026) / 9 800+ / 11 K+ serveurs ; **PulseMCP en pause jusqu'à mi-août 2026** ; 1 322 serveurs **remote officiels** listés [W] | A/B |
| **punkpeye/awesome-mcp-servers** | N03 | 95 845★ MIT [API] ; PR « fast-track » pour agents [W] | **A** |
| **anthropics/skills** | N23 | 179 777★ [API] ; Skills documentaires officielles (docx/pdf/pptx/xlsx, brand, slack-formatter, skill-creator) [W] | **A** |
| **SkillsMP / agent-skills.cc / skills.sh / ClaudeSkills.info / claudemarketplaces.com / Agensi** | N04/N28 | 1,2 M+ / 63 000+ (1 000 curatés) / ~2 000 / 658 / curaté / 200+ avec **scan sécurité 8 points** et Pro 9 $/mois [W] | B/C |
| **Vercel AI SDK + AI Elements** | N20/N18 | ai-sdk.dev [V] ; AI Elements = primitives shadcn-installables (conversation, message, reasoning, sources, tool calls) [W] | **A** |
| **assistant-ui / CopilotKit / prompt-kit / Ant Design X** | N20 | 12 410★ et 37 765★ MIT [API] ; adaptateurs LangGraph/Mastra, copilotes in-app [W] | A/B |
| **Context7 / Firecrawl / Playwright MCP / Chrome DevTools MCP / Figma Dev Mode MCP / shadcn MCP / Magic UI MCP** | N22 | 62 716★ (Context7) [API], 188 876★ AGPL (Firecrawl) [API], 53 002★ Apache (Chrome DevTools MCP) [API], 37 836★ Apache (Playwright MCP) [API] ; Figma = siège payant requis [W] | **A** |
| **LangChain/LangGraph, CrewAI, Mastra, Pydantic AI, n8n, Dify, Flowise** | N25 | 147 475★ MIT (LangChain) [API], 206 724★ (n8n) [API], 157 894★ (Dify) [API] | A/B |
| **Ollama, LM Studio, llama.cpp, vLLM** | N25 | 182 254★ MIT (Ollama) [API] | A/B |
| **OpenRouter, Replicate, fal, Hugging Face, Groq** | N18/N25 | gateways et hébergement de modèles [W] | A/B |
| **v0 / Bolt / Lovable / dyad / bolt.diy / Replit** | N24 | v0 : ~5 $ crédits/mois gratuit, 20 $/mois premium [W] ; Bolt : 1 M tokens/mois gratuit, 25 $/mois Pro [W] ; Lovable : 5 crédits/jour, 25 $/mois Pro, 50 $ Business [W] ; dyad/bolt.diy auto-hébergeables [W] | A/B/C |
| **Claude Code / Cursor / Codex CLI / OpenCode / Aider / Cline / Gemini CLI / Antigravity** | N24 | Claude Code 20–200 $/mois ; Cursor 20 $ ; Codex CLI gratuit→100 $+ ; OpenCode/Aider/Cline = BYOK open source ; Gemini CLI 1 000 requêtes gratuites/jour rapportées ; consolidation du marché en 2026 (rachats, archivages) [W] | **A/B** |

**Resource Intelligence Layer — famille H**
- *What exists* : 6 couches distinctes — (1) SDK/kits UI IA, (2) MCP, (3) Skills, (4) orchestrateurs/RAG, (5) observabilité/gateways/local, (6) agents de code et builders.
- *Best* : AI SDK + AI Elements (UI IA) · MCP officiel + punkpeye (capacités) · anthropics/skills (compétences) · Langfuse (observabilité) · Ollama (local).
- *Free* : MCP registre officiel, skills open source, Ollama, agents BYOK (coût = tokens).
- *Open source* : large, avec des licences à surveiller (**Firecrawl AGPL-3.0** [API]).
- *AI-ready* : 5 par nature.
- *Production-ready* : n8n, Dify, LangChain/LangGraph, OpenAI/Anthropic cookbooks ; **risque principal = sécurité et permissions** (voir doc 06 §risques).
- *Learn* : openai-cookbook (76 357★ [API]), dair-ai Prompt Engineering Guide, microsoft/generative-ai-for-beginners.
- *Bookmark* : registry.modelcontextprotocol.io, mcpservers.org, github.com/anthropics/skills, agent-skills.cc, ai-sdk.dev.

---

# Famille J/N/P — Infra, apprentissage, production (fiches condensées)

| Plateforme | Nature | Faits clés vérifiés 2026 | Tier |
|---|---|---|---|
| **Supabase** | N18 | 111 128★ Apache-2.0 [API] ; gratuit : 500 Mo DB, 5 Go egress, 1 Go storage, 50 000 MAU, 2 projets, **pause après ~7 jours d'inactivité** ; Pro 25 $/org ; Team 599 $ [W] | **A** |
| **PocketBase** | N18 | 61 287★ MIT [API] ; **pas d'offre hébergée** : vous payez le serveur ; SQLite, temps réel SSE ; pré-1.0 et « pas d'entreprise derrière » (dixit l'auteur) [W] | **A** (self-host) |
| **Appwrite** | N18 | 57 575★ BSD-3 [API] ; gratuit 75 000 MAU, 2 Go storage, 5 Go bande passante, pause après 1 semaine ; Pro dès 25 $ [W] | A |
| **Convex** | N18 | réactif TypeScript, **base propriétaire** (pas de SQL brut) ; gratuit puis Professional par siège ; ~10 000 équipes payantes (avril 2026) [W] | B |
| **Neon / Turso / Nhost / Firebase** | N18 | Neon gratuit 0,5 Go + 100 CU-h ; Turso 5 Go + 100 bases ; Nhost 1 Go ; Firebase : **coupe pour le reste du mois** en cas de dépassement [W] | B |
| **Better Auth** | N18 | 30 172★ MIT [API] ; alternative open source à NextAuth (28 367★ ISC) [API] | **A** |
| **Clerk / WorkOS / Auth0** | N18 | services d'auth managés (prix par MAU) [?] | B |
| **Resend + React Email** | N18 | react.email 19 808★ MIT [API] ; e-mails en composants React | **A** |
| **Stripe / Lemon Squeezy / Polar / Paddle** | N18 | paiement ; conditions et frais à vérifier par pays → [?] | A/B |
| **Coolify / Dokploy / CapRover / Dokku** | N19 | Coolify : 35 000★+, 280+ services one-click, self-host gratuit, cloud 89,99 $/mois [W] ; Dokploy : **cœur Apache-2.0**, SSO/audit sous licence séparée, ≥ 2 Go RAM [W] | **A** (souveraineté) |
| **Vercel / Netlify / Cloudflare Pages-Workers / Render / Railway / Fly.io / Koyeb / GitHub Pages** | N18/N19 | Vercel Hobby **non commercial**, Pro 20 $/dev [W] ; Netlify 300 crédits/mois gratuits, Personal 9 $, Pro 20 $ [W] ; Cloudflare Pages : requêtes statiques illimitées, 500 builds/mois, **bascule documentée vers Workers** [W] | **A** |
| **Payload / Directus / Strapi / Sanity / Tina / Keystatic / Decap** | N18 | Payload 45 096★ MIT [API] ; Directus 38 025★ ; Strapi 73 281★ NOASSERTION [API] | A/B |
| **Medusa / Saleor / Vendure** | N18 | Medusa 36 604★, Saleor 23 410★ BSD-3 [API] | B |
| **Astro + Starlight / Nextra / Fumadocs / Docusaurus / Mintlify** | N11/N12 | Astro 63 064★, Starlight 9 366★ MIT [API] | **A** |
| **Algolia / Meilisearch / Typesense / Orama / Pagefind** | N18 | recherche ; Meilisearch/Typesense self-host OSS ; Pagefind = recherche statique [V] | A/B |
| **Plausible / Umami / PostHog / OpenPanel** | N18 | analytics respectueux de la vie privée ; Umami 39 K★ rapporté [API] | A/B |
| **Sentry / GlitchTip / Highlight** | N18 | monitoring d'erreurs ; GlitchTip = OSS self-host | A/B |
| **roadmap.sh / MDN / javascript.info / freeCodeCamp / The Odin Project** | N26 | roadmap.sh 368 957★ [API] ; cursus complets gratuits [W] | **A** |
| **Frontend Masters (39 $/mois) / Scrimba (24,50 $/mois annuel) / Three.js Journey (95 $, 93 h) / Exercism / Frontend Mentor** | N26/N27 | qualité de séquence et mentorat [W] | A/B |
| **Claude Code / Cursor / Codex / OpenCode / Aider / Cline** | N24 | voir famille H ; consolidation 2026 [W] | A |

---

## Annexe — 20 URLs sensibles (protection anti-bot) à vérifier visuellement
`[V⚠]` : Unsplash, Pexels, Pixabay, Shadertoy, Behance, Codepen, Dribbble, SiteInspire, Pageflows, Blush, Lapa Ninja, DesignSpells, Observable, W3C WAI, Fab, Poly Pizza, Uncut.wtf, Horizon UI, Lovable, hls.js/wavesurfer (anciens domaines → utiliser GitHub). Aucune n'a été invalidée : ce sont des réponses de **protection**, pas des 404.
