# CARTOGRAPHIE INTELLIGENTE DES RESSOURCES DE CRÉATION NUMÉRIQUE

**Périmètre audité :** React Bits · Uiverse · Anime.js · Bklit UI · Motion
**Date de l'audit :** 5 octobre 2026
**Méthode :** exploration directe des sites (pages d'accueil, navigation, catalogues, fiches de ressources), documentation officielle, dépôts GitHub officiels (README, LICENSE, `registry.json`, arborescences `src/content`), registre npm, sitemaps officiels. Contrôle qualité : **toutes les URL d'inventaire React Bits (213) ont été testées par requête HTTP → 213/213 en HTTP 200** ; échantillons d'URL Motion/Bklit/Anime.js également testés.

**Fichiers livrés avec ce rapport**

| Fichier | Contenu |
| --- | --- |
| `cartographie-creation-numerique.md` | Ce rapport (fiches, matrices, synthèse) |
| `inventaire/react-bits-free.md` | Les **213 composants gratuits** avec URL directe (vérifiées) |
| `inventaire/bklit-ui-registry.md` | Les **56 entrées du registre shadcn `@bklit`** + dépendances |
| `inventaire/motion.md` | **30 sections Motion UI + 24 composants + 462 exemples** (URL directes) |
| `matrice-decision.csv` | Matrice « Besoin → Ressource » exploitable (tableur) |

---

## 0. STATUT DES INFORMATIONS, LÉGENDE ET HONNÊTETÉ DE L'AUDIT

**Légende des matrices**

| Symbole | Sens |
| --- | --- |
| ✅ | Disponible / vérifié |
| 🟡 | Partiel, conditionnel ou nécessite un compte/abonnement |
| ❌ | Absent |
| ❓ | Non déterminé — à vérifier sur la source |
| 💰 | Réservé à une offre payante |

**Règles appliquées**

1. **Aucune licence n'est supposée.** Chaque licence citée provient d'un fichier `LICENSE` officiel ou d'une mention explicite du site. Quand ce n'est pas le cas, c'est écrit noir sur blanc.
2. **Aucune catégorie n'a été présupposée** : chaque plateforme a d'abord été explorée page par page, puis classée (voir §2).
3. **Les prix sont datés** (5 octobre 2026) : ils évoluent vite sur ces plateformes.
4. **Les compteurs annoncés par les sites sont reproduits tels quels**, avec les incohérences signalées (elles existent : React Bits, Uiverse et Bklit affichent chacun des compteurs qui varient d'une page à l'autre).
5. **Ce qui n'a pas pu être vérifié est marqué ❓** et listé en annexe (§15).

**Ce que l'audit couvre réellement**

| Plateforme | Couverture | Statut |
| --- | --- | --- |
| React Bits (gratuit) | 213 composants inventoriés et URL testées | **Exhaustif** |
| React Bits Pro | 5 familles, 22 catégories de blocs, 38 catégories d'app UI, 15 templates nommés, 20 items Agent Kit | Exhaustif sur la structure ; contenus payants non ouverts (accès non acheté) |
| Uiverse | Statistiques officielles, formats d'export, licence, offres payantes, structure des dépôts | **Partiel assumé** : le catalogue compte des milliers d'éléments, non énumérables un par un sans crawler complet ; catégories et fichiers d'export identifiés |
| Anime.js | Documentation complète (16 sections), API, modules, install, licence | **Exhaustif sur la documentation** |
| Bklit UI | 56 entrées de registre + dépendances + licence + docs (sitemap 54 URL) | **Exhaustif** sur le registre public |
| Motion | 462 exemples, 30 sections, 24 composants UI, 135 pages de docs (sitemap) | **Exhaustif sur la structure publique** ; contenus Motion+ non ouverts (accès non acheté) |

> **Règle de transparence (§37/38)** : quand un contenu est réservé aux abonnés (React Bits Pro, Motion+, Uiverse Design), je décris ce qui est **publiquement affiché** (catalogues, titres, descriptions, prix, licences) sans prétendre avoir testé les fichiers payants eux-mêmes.

---

## 1. SYNTHÈSE EXÉCUTIVE

**Les cinq plateformes ne sont pas concurrentes — elles couvrent cinq fonctions différentes.**

| Plateforme | Nature réelle (après audit) | Rôle (§43) | Ce qu'elle apporte concrètement | Prix |
| --- | --- | --- | --- | --- |
| **React Bits** | Bibliothèque de composants animés React, prêts à copier/installer, **+ 3 outils créatifs + un MCP** | SOURCE + OUTIL + AI-READY | Le visuel « wow » (fonds, texte animé, curseurs, micro-interactions, UI) sans le construire | Gratuit (213 composants) · Pro 129–349 $ une fois |
| **Uiverse** | Plus grande galerie communautaire d'éléments UI open-source CSS/Tailwind, export HTML/CSS, Tailwind, React, Figma | SOURCE + INDEX + COMMUNAUTÉ | Le petit composant précis (loader, switch, bouton, tooltip, carte) en quelques secondes | Gratuit · Pro 4,99 $/mois · Pro+ 19,99 $/mois · Design Systems 9,99–14,99 $ |
| **Anime.js** | Moteur d'animation JavaScript installable (v4.5.0) | FRAMEWORK / LIBRARY | Contrôle total du motion en JS pur : timeline, scroll, SVG, texte, drag, spring, adaptateur Three.js | Gratuit, MIT, financé par sponsors |
| **Bklit UI** | Registre shadcn de composants de **data visualization** (17 types de charts + primitives) + un Studio visuel | SOURCE + OUTIL (DATA) | Des graphiques de dashboard cohérents avec shadcn, installés en source dans TON projet | Composants MIT gratuits · Studio propriétaire |
| **Motion** | Bibliothèque d'animation React/JS/Vue (+ Motion UI, Motion+, AI Kit) | FRAMEWORK / LIBRARY + TEMPLATES + AI-READY | Le standard de fait du motion d'interface (layout animations, gestes, springs) + son écosystème IA | Cœur MIT gratuit · Motion+ 399 $ une fois · Studio en abonnement |

**Trois conclusions immédiates**

1. **Pour « avoir un beau composant vite »** : React Bits (React) et Uiverse (HTML/CSS/Tailwind/React) sont les deux guichets. React Bits = animation et design avancé ; Uiverse = volume, variété, CSS pur, Figma.
2. **Pour « maîtriser l'animation »** : Anime.js (JS pur, MIT, un seul paquet) ou Motion (React/Vue/JS, declarative, layout + gestes). Ce sont des **bibliothèques**, pas des catalogues — on les installe, on ne les copie pas.
3. **Pour « des graphiques de dashboard »** : Bklit UI est aujourd'hui la réponse la plus « shadcn-native » (copie de source, pas de dépendance runtime verrouillée), avec une limite majeure : deux personnes, un Studio propriétaire, et pas de `npm update`.

**Le fait marquant de 2026 : les quatre plateformes « catalogue » ont basculé vers l'IA.**
React Bits fournit un serveur MCP + « Copy for AI » + un Agent Kit payant ; Motion vend un AI Kit (`/motion` skill + MCP + MotionScore) ; Uiverse vend des design systems « pour agents de code » ; Bklit expose un skill communautaire. **Le prompt est devenu un format de distribution.**

---

## 2. FICHES PLATEFORME PAR PLATEFORME

> Structure imposée (§32), complétée par les blocs « À retenir » (§30) et « Exemples d'utilisation » (§31). Les catégories (§8) et les types (§21) sont indiqués.

---

# 2.1 — REACT BITS (offre gratuite)

## 1. Identité
**React Bits** — « React components for creative developers ». Plus grande bibliothèque open-source de composants React animés, créée et maintenue par **David Haz** (@davidhaz). Le projet se double d'une offre commerciale, **React Bits Pro** (fiche 2.2).

## 2. URL
- Site : **https://www.reactbits.dev/**
- Catalogue complet : **https://www.reactbits.dev/get-started/index**
- Installation : **https://www.reactbits.dev/get-started/installation**
- MCP : **https://www.reactbits.dev/get-started/mcp**
- Outils : **https://www.reactbits.dev/tools**
- GitHub : **https://github.com/DavidHDev/react-bits** (48,5 k ⭐, 2,4 k forks, 1 635 commits, dernier commit 3 oct. 2026)
- Offre payante : **https://www.reactbits.dev/pro** / **https://pro.reactbits.dev/**

## 3. Fonction principale
Fournir des **composants React animés haut de gamme** (fonds, animations de texte, curseurs, effets, UI créative, micro-interactions) prêts à coller ou à installer, entièrement personnalisables via props.

## 4. Catégories (§8)
**Principale :** A. UI Component Library + F. Motion/Animation Library + I. React Library
**Secondaires :** B. Component Code Library · O. CLI / Developer Tool (shadcn + jsrepo) · N. AI-Ready Resource (MCP, Copy for AI) · L. 3D/WebGL partiel (fonds shader/WebGL) · P. Showcase (démos interactives)

## 5. Technologies
React (TS/JS), CSS ou Tailwind, GSAP / WebGL / Canvas / SVG selon le composant, shadcn CLI, jsrepo, MCP (Model Context Protocol), Next.js/React 19.

## 6. Types de ressources (inventaire complet — voir `inventaire/react-bits-free.md`)

```text
React Bits — offre gratuite (213 composants vérifiés)
│
├── Animations (40)
│   ├── Curseurs : Blob Cursor, Ghost Cursor, Glow Cursor, Splash Cursor,
│   │              Swarm Cursor, Target Cursor
│   ├── Scroll & reveal : Scroll Expand, Pixel Transition, Halftone Reveal,
│   │                    Image Trail, Ribbons, Strands
│   ├── Effets & bordures : Electric Border, Star Border, Metallic Paint,
│   │                      Meta Balls, Magnet Lines, Magic Rings, Laser Flow
│   └── Divers : Logo Loop, Orbit Images, Fade Content, Animated Content, Cubes…
│
├── Backgrounds (59)
│   ├── Aurores & dégradés : Aurora, Soft Aurora, Grainient, Gradient Waves,
│   │                        Color Bends, Silk, Iridescence, Prism
│   ├── Grilles & points : Dot Field, Dot Grid, Shape Grid, Ripple Grid,
│   │                      Grid Motion, Grid Scan, Pixel Snow, Pixel Blast
│   ├── Liquides & métaux : Liquid Chrome, Ferrofluid, Molten Metal, Plasma,
│   │                       Dark Veil, Waves
│   └── Rétro / technique : Balatro, CRTWarp, Dither, Faulty Terminal,
│                           Letter Glitch, Lightfall, Hyperspeed, Topography
│
├── Components (47) — UI réutilisable
│   ├── Navigation : Card Nav, Gooey Nav, Pill Nav, Bubble Menu, Flowing Menu,
│   │               Infinite Menu, Staggered Menu, Line Sidebar, Dock
│   ├── Carrousels & galeries : Carousel, Circular Carousel, Flex Carousel,
│   │                          Depth Carousel, Dome Gallery, Circular Gallery,
│   │                          Accordion Gallery, Flying Posters, Drift Wall
│   ├── Cartes & surfaces : Spotlight Card, Pixel Card, Tilted Card, Stack,
│   │                       Reflective Card, Glass Surface, Fluid Glass, Decay Card
│   └── Contrôles & structure : Counter, Stepper, Elastic Slider, Morph Slider,
│                               Option Wheel, Curved Input, Specular Button,
│                               Model Viewer, Masonry, Magic Bento
│
├── Micro (34) — micro-interactions
│   ├── Boutons : Fuse Button, Hold Button, Sling Button, Status Mark
│   ├── Contrôles : Squish Switch, Jelly Radio, Spring Check, Wake Slider,
│   │              Rubber Segment, Glide Select, Sling Slider (Scan/Swipe)
│   ├── Feedback : Pulse Heart, Peek Rating, Warm Tooltip, Swipe Toast, Thought Line
│   └── Détails d'interface : Flip Card, Folder Float, Paper Crumple, Shredder,
│                            Tear Ticket, Call Chip, Voice Pill, Code Slots, Comet Dial
│
└── Text Animations (33)
    ├── Reveal & entrée : Blur Text, Split Text, Scroll Reveal, Scroll Float,
    │                    Masked Heading, True Focus, Depth Text
    ├── Effets techniques : ASCIIText, Glitch Text, Scrambled Text, Decrypted Text,
    │                      Split Flap Text, Tech Text, Shuffle, Fuzzy Text
    └── Boucles & défilement : Count Up, Curved Loop, Text Loop, Scroll Velocity,
                              Rotating Text, Circular Text, Gradient Text, Shiny Text
```

## 7. Méthodes de récupération (§12)
| Méthode | Détail | Statut |
| --- | --- | --- |
| **Copier le code** | Onglet « Code » de chaque fiche ; le site mémorise ton choix JS/TS × CSS/Tailwind | ✅ |
| **CLI shadcn** | `npx shadcn@latest add @react-bits/BlurText-TS-TW` | ✅ officiel |
| **CLI jsrepo** | Supporté (voir installation) | ✅ |
| **Registre** | `{"registries":{"@react-bits":"https://reactbits.dev/r/{name}.json"}}` dans `components.json` | ✅ |
| **MCP** | `npx shadcn@latest mcp init --client claude` (Claude Code, Cursor, VS Code) puis prompts en langage naturel | ✅ officiel |
| **GitHub** | Code source complet du site + `src/content/<Catégorie>/<Composant>/` | ✅ |
| **npm** | ❌ pas de package global : chaque composant est copié dans le projet (les dépendances tierces, elles, sont npm) | ❌ |
| **Figma** | ❌ | ❌ |
| **Copy for AI** | Bouton présent sur les pages composants (voir §9) | ✅ |

## 8. Code
- **Disponible : ✅ total.** 4 variantes par composant : `JS-CSS`, `JS-TW`, `TS-CSS`, `TS-TW`.
- Chaque fiche liste ses **dépendances réelles** avec la commande d'installation. Exemple vérifié sur `BlobCursor` : **1 paquet requis, `npm install gsap`**.
- Chaque fiche liste ses **props documentées** (`BlobCursor` : **20 propriétés** — `blobType`, `fillColor`, `trailCount`, `sizes`, `opacities`, `shadowBlur`, `fastDuration`, `fastEase`, `zIndex`…).

## 9. Prompts IA / ressources agents (§13, §25)
| Élément | Contenu vérifié | Verdict |
| --- | --- | --- |
| **« Copy for AI » (gratuit)** | Bouton sur chaque fiche composant, à côté de Preview/Code. Il n'ouvre pas un « prompt » marketing : il expose la ressource pour un agent (code + contexte de la fiche) | ✅ utilisable, mais **le contenu exact du presse-papiers n'a pas pu être inspecté depuis l'extérieur** → à confirmer en local ❓ |
| **Serveur MCP (gratuit)** | Réutilise le **serveur MCP de shadcn**. Enregistre le registre `@react-bits`, puis : *« Show me all the available backgrounds from the React Bits registry »*, *« Add the Dither background from React Bits to the page, make it purple »* | ✅ **officiel et fonctionnel** — c'est la vraie capacité « IA » de React Bits |
| **Agent Kit (Pro, payant)** | 20 items : 1 skill d'intégration (installation/composition correctes du premier coup) + **8 design skills** (Apple Minimal, Corporate Trust, Editorial, Luxury Serif, Neobrutalism, Playful Motion, Swiss Grid, Terminal Dark) + **8 prompts de page** (Agency, Consumer Hardware, Developer Tool, Ecommerce Brand, Fintech, Fitness, Real Estate, SaaS Landing Page) + **3 recipes** (Agency Homepage, Product Launch, SaaS Homepage) | ✅ structure vérifiée ; qualité à juger après achat |
| **SKILL.md publié** | Revendiqué par l'éditeur pour **Cursor, Claude Code, v0, Bolt.new, Lovable, Replit** | 🟡 déclaratif (éditeur) |

**Peut-on le donner directement à une IA ?** **Oui pour le MCP** (support officiel shadcn). **Oui avec réserve pour « Copy for AI »** : le prompt transmet la fiche du composant ; sa capacité à *reconstruire* la ressource est **moyenne à élevée** pour les composants simples, **faible** pour les fonds shader/WebGL complexes — **ne jamais parier sur une reproduction parfaite sans vérifier le rendu.**

## 10. CLI / installation (ce que la commande fait réellement, §14)
```text
npx shadcn@latest add @react-bits/BlurText-TS-TW
        ↓ Pré-requis : projet React + shadcn initialisé, et le registre @react-bits déclaré dans components.json
        ↓ Ce qui est téléchargé : le fichier source du composant, dans la variante TS + Tailwind
        ↓ Ce qui est installé : les dépendances tierces déclarées par la fiche (ex. gsap, three…)
        ↓ Fichiers générés : le(s) fichier(s) du composant dans ton dossier components
        ↓ Résultat : tu es propriétaire du code ; aucune dépendance runtime à React Bits
        ↓ Coût : gratuit, sans compte, sans quota annoncé
```

## 11. Personnalisation (§15)
**Exceptionnellement bonne.** Trois niveaux :
1. **Props typées** documentées par fiche (couleurs, tailles, durées, easing, vitesse, comportement).
2. **Editeur visuel intégré** : panneau « Customize » avec contrôles (couleur, type, tailles, opacités, durées, easings) + bouton **Reset** — les valeurs correspondent aux props du code.
3. **Édition du source** : le code est à toi (thème, responsive, structure).
> Limite signalée par la fiche elle-même : *« SVG filters are not fully supported on Safari. Performance may vary. »* (Blob Cursor).

## 12. Gratuit / Premium
- **Gratuit : 213 composants**, « **Free forever** », aucune limite annoncée de projets ni d'usage commercial (sous réserve de la licence, §13).
- **3 outils créatifs gratuits** (voir §17) : Background Studio, Shape Magic, Texture Lab.
- **Pro (payant)** : voir fiche 2.2.

## 13. Licence — **MIT + Commons Clause (vérifié dans `LICENSE.md`)**
> « You may use this Software, **including for any commercial purpose**, so long as you **do not sell, sublicense, or redistribute the components themselves** — whether alone, in a bundle, or **as a ported version**. »

- **Usage personnel : ✅ · Usage commercial dans une application/site/produit : ✅ explicite.**
- **Interdit** : revendre les composants, les redistribuer seuls ou en bundle, **ou les porter** (ex. les convertir en librairie Vue et les publier).
- **Attribution** : la notice de copyright doit être incluse (MIT).
- **Ports officiels** : Vue → **https://vue-bits.dev/** · Svelte → **https://sveltebits.xyz/** (ce sont des projets officiels, pas des forks pirates : ils sont listés dans le README officiel).
- **Piège à éviter** : « open source » ≠ « domaine public ». La Commons Clause reste une restriction ; ne l'applique pas aux composants Pro (licence commerciale distincte).

## 14. Qualité des ressources
Très élevée : chaque composant est **démontré, documenté, typé, doté d'un panneau de personnalisation**, et les dépendances sont déclarées sans surprise. Le projet est activement maintenu (commits quotidiens, nouvelles catégories — **Micro** lancée en sept. 2026 avec 30+ composants). Le seul bémol est structurel : **les performances dépendent du composant** (shaders, SVG filters, canvas) et il faut tester sur mobile/Safari.

## 15. Cas d'utilisation
Sites vitrines créatifs · landing pages qui doivent « marquer » · portfolios · hero animés · fonds de sections · effets de texte · curseurs personnalisés · micro-interactions de produit · démos techniques · prototypes de direction artistique.

## 16. Limites
- **React uniquement** (les variantes sont JS/TS × CSS/Tailwind, pas de Vue/Svelte natif — passer par les ports officiels).
- Pas de package npm : **mise à jour = re-copie manuelle** (pas de `npm update`).
- Qualité de performance hétérogène selon les composants (WebGL/canvas : coûteux).
- Pas de composants « métier » (tables, formulaires complexes, dashboards) dans l'offre gratuite → c'est le rôle de Pro.
- « Copy for AI » : contenu exact non vérifiable depuis l'extérieur (❓).

## 17. Ressources remarquables (sélection vérifiée)
| Ressource | URL | Pourquoi |
| --- | --- | --- |
| Dot Field | https://www.reactbits.dev/backgrounds/dot-field | Fonds à grille animée, très réutilisable |
| Aurora / Soft Aurora | https://www.reactbits.dev/backgrounds/aurora | Fond « gradient vivant » universel |
| Beams | https://www.reactbits.dev/backgrounds/beams | Faisceaux lumineux animés |
| Ballpit | https://www.reactbits.dev/backgrounds/ballpit | Physique 3D → effet signature |
| Blob Cursor | https://www.reactbits.dev/animations/blob-cursor | Curseur signature (20 props, dépend de GSAP) |
| Blur Text | https://www.reactbits.dev/text-animations/blur-text | Reveal de titre à effet immédiat |
| Split Text | https://www.reactbits.dev/text-animations/split-text | Animation lettre par lettre |
| Glitch Text | https://www.reactbits.dev/text-animations/glitch-text | Effet cyber/tech |
| Card Nav / Gooey Nav / Pill Nav | https://www.reactbits.dev/components/card-nav | Navigation de landing page qui sort du lot |
| Spotlight Card | https://www.reactbits.dev/components/spotlight-card | Carte « lumière qui suit la souris » |
| Magic Bento | https://www.reactbits.dev/components/magic-bento | Grille bento animée (format 2026) |
| Scroll Stack | https://www.reactbits.dev/components/scroll-stack | Empilement au scroll |
| Lanyard | https://www.reactbits.dev/components/lanyard | Objet 3D manipulable (badge) |
| Micro : Flip Card, Squish Switch, Warm Tooltip | https://www.reactbits.dev/micro/flip-card | Micro-interactions à fort effet perçu |
| Outils : Background Studio / Shape Magic / Texture Lab | https://www.reactbits.dev/tools | Génèrent des **assets exportables** (vidéo, image, SVG, code, clip-path) |

## 18. Alternatives
**Pour du React animé prêt à l'emploi :** React Bits Pro (suite payante), Uiverse (versions HTML/CSS + React d'effets proches), Motion UI (sections animées), Aceternity/Magic UI (découvertes indirectes, §10), shadcn blocks commerciaux. **Pour le fond du sujet (moteur) :** Motion, Anime.js, GSAP.

## 19. Quand utiliser React Bits ?
- Quand tu es sur **React/Next.js** et que tu veux un résultat visuel fort **en minutes**, sans écrire de shader ni de timeline.
- Quand tu veux **voir les props et les ajuster visuellement** avant d'installer.
- Quand tu veux que **ton agent IA installe le composant via MCP** plutôt que de le générer de zéro.
- **Ne pas l'utiliser** si tu dois rester en JS vanilla/Vue (→ Uiverse, Anime.js), ou si tu ne peux pas assumer le coût GPU d'un fond WebGL.

## 20. Verdict
> **Tier S — ressource essentielle pour tout projet React à forte ambition visuelle.** Catalogue vaste, documenté, personnalisable, gratuit, licence permissive pour l'usage produit (avec une restriction claire sur la revente). La seule vraie friction est l'absence de package npm : la mise à jour est manuelle. **À intégrer immédiatement dans la stack, avec le MCP configuré.**

## À retenir (réactif par type de projet)
| Si je construis… | Utilité |
| --- | --- |
| **Un site vitrine** | ⭐⭐⭐⭐ — fonds, hero, sections animées, textes |
| **Une landing page** | ⭐⭐⭐⭐⭐ — le meilleur usage : hero, bento, CTA, navigation, témoignages |
| **Un SaaS** | ⭐⭐ (gratuit) / ⭐⭐⭐⭐⭐ (Pro : app UI, dashboards, auth, tables) |
| **Une PWA** | ⭐⭐ — attention au poids des effets WebGL sur mobile |
| **Un dashboard** | ⭐ (gratuit) → à Compléter par **Pro** (Dashboard, Data Table, Analytics) ou **Bklit UI** |
| **Une expérience 3D** | ⭐⭐⭐ — fonds shader, Ballpit, Model Viewer, Lanyard (pas un moteur 3D) |
| **Du motion design** | ⭐⭐⭐⭐ — 40 animations + 33 text animations ; pour le contrôle fin, descendre à Anime.js/Motion |
| **Avec une IA de développement** | ⭐⭐⭐⭐⭐ — MCP officiel + Copy for AI (+ Agent Kit en Pro) |

## Exemples d'utilisation (§31)
1. **« Je veux une landing page avec un hero animé »** → fond `Aurora` ou `Beams`, titre en `BlurText`/`SplitText`, CTA en `SpecularButton`, navigation `CardNav`, bento `MagicBento`.
2. **« Je veux un effet de curseur signature »** → `BlobCursor` (avec `gsap`), `GhostCursor`, `SplashCursor` ou `TargetCursor` selon l'ambiance.
3. **« Je veux créer un effet de texte interactif »** → `DecryptedText`, `ScrambledText`, `FallingText`, `TrueFocus`.
4. **« Je veux accélérer une interface produit »** → Pro : `App Shell`, `Navbar`, `Data Table`, `Dashboard`, `Settings Form`, `Authentication`.
5. **« Mon agent doit installer lui-même le composant »** → configurer le MCP shadcn avec le registre `@react-bits`, puis demander : *« Ajoute le fond Dot Field en violet à ma page d'accueil »*.

---

# 2.2 — REACT BITS PRO (offre payante)

## 1. Identité
**React Bits Pro** — suite commerciale de React Bits : composants + **blocs de pages** + **blocs d'app UI** + **templates complets** + **Agent Kit**. « React Bits stays free forever. Pro takes you from individual effects to complete pages, product UI, templates and an Agent Kit — all delivered as source you own. »

## 2. URL
- Présentation : **https://www.reactbits.dev/pro**
- Site + prix : **https://pro.reactbits.dev/**
- Catalogue composants : **https://pro.reactbits.dev/docs/components**
- Blocs : **https://pro.reactbits.dev/docs/blocks** · App UI : **https://pro.reactbits.dev/docs/app-ui**
- Templates : **https://pro.reactbits.dev/docs/templates** · Agent Kit : **https://pro.reactbits.dev/docs/agent-kit**
- Installation : **https://pro.reactbits.dev/docs/installation** · MCP : **https://pro.reactbits.dev/docs/mcp**
- Builder (bêta) : **https://pro.reactbits.dev/builder**

## 3. Fonction principale
Passer du **composant** à la **page complète** et au **produit complet**, en source livrée (pas de runtime), installable par un humain ou par un agent.

## 4. Catégories (§8)
C. Design Inspiration ❌ · **D. Template Library ✅** · **E. Page Block Library ✅** · A/I. UI + React ✅ · **N. AI-Ready ✅** · M. Design System 🟡 (thématisation globale accent/base/font/radius) · O. CLI ✅

## 5. Technologies
React 19 / Next.js 16 annoncés, **TypeScript**, **Tailwind ET CSS vanilla** (deux variantes par composant), shadcn CLI avec **registre protégé par clé de licence**, MCP, SKILL.md pour agents.

## 6. Types de ressources — structure complète (site, 5 oct. 2026)
```text
React Bits Pro — « 765 assets » annoncés
│
├── 150 composants animés  (le site affiche aussi un décompte par sous-catégorie :
│                           Animations 44 · Text 11 · Backgrounds 69 · 3D & Shaders 30 ·
│                           Cursor Effects 14 · UI & Cards 26 → ⚠️ incohérence interne, voir §16)
│
├── 280 Page blocks / 22 catégories
│   ├── Hero 24 · Features 13 · Bento 42 · Social Proof 16 · Contact 12 · Footer 12
│   ├── Comparison 8 · Navigation 15 · Auth 6 · CTA 14 · FAQ 9 · Pricing 15 · Stats 15
│   └── 404 8 · Profile 6 · About 12 · Waitlist 6 · Showcase 8 · How It Works 9
│       · Download 8 · Blog 11 · Ecommerce 11
│
├── 300 App UI blocks / 38 catégories
│   ├── Analytics 16 · Dashboard 14 · Navbar 14 · Authentication 14 · List 12 · Forms 12
│   ├── Cards 11 · Monitoring 10 · AI Chat 9 · App Shell 9 · Filtering 9 · Data Table 8
│   ├── AI Usage 8 · Billing 8 · Comments 6 · Kanban 6 · Support 5 · File Manager 4 …
│   └── (Prompt Input · Agent Activity · Tool Calls · Agent Approval · Agent Plan → UI dédiée aux agents IA)
│
├── 15 templates Next.js : Agentframe · Cloudlight · Imageworks · Sparkdesign · SaaS ·
│   Minimal · Agency · Finance · AI SaaS · Shader · Wireframe · Portfolio · 8 Bit ·
│   AI App · Security  (un template « Portfolio » est annoncé **gratuit**)
│
└── Agent Kit (20) : 1 skill d'intégration + 8 design skills + 8 prompts + 3 recipes
```

## 7. Méthodes de récupération
| Méthode | Détail |
| --- | --- |
| **CLI shadcn (officiel)** | Install d'une commande, registre **protégé par clé de licence** ; « no runtime, lock-in or project limits » |
| **Copie de code** | ✅ tu récupères la source |
| **One-command install pour agents** | Annoncé pour Claude Code et Cursor |
| **Agent Kit** | Prompts/skills/recipes copiables (bouton « Copy for AI » observé sur un skill) |
| **Builder (bêta)** | Compose et exporte des pages |
| npm / Figma | ❌ |

## 8. Code
✅ Source complète, TypeScript, variantes Tailwind **et** CSS vanilla, thématisation globale (accent, base, police, radius) sur tous les blocs d'app UI, light/dark inclus, « 320px → 4K ».

## 9. Prompts IA
Voir §9 de la fiche 2.1. Spécificité Pro : **l'Agent Kit est le produit**, avec la distinction explicite faite par l'éditeur :
- **React Bits Pro Skill** (tiers Starter) = *mécanique d'installation* dans le registre ;
- **Agent Kit** (tiers Pro) = *jugement de design* et contenu prêt à l'emploi.
La page « best for AI coding agents » recommande **Pro 249 $** comme « sweet spot » et cite Cursor, Claude Code, v0, Bolt.new, Lovable, Replit.

## 10. CLI / installation
```text
npx shadcn@latest add … (registre React Bits Pro + clé de licence)
        ↓ Pré-requis : achat d'une licence + clé ; projet React/Next ; shadcn configuré
        ↓ Ce qui est installé : le source du composant/bloc + ses dépendances
        ↓ Résultat : code propriétaire dans ton repo, modifiable
        ↓ Licence : commerciale, 1 développeur, projets illimités (voir §13)
```

## 11. Personnalisation
Niveau supérieur au gratuit : **thème global** (accent/base/font/radius) appliqué à tous les blocs d'app UI, props typées, light/dark, responsive 320px→4K.

## 12. Gratuit / Premium — **prix vérifiés le 5 octobre 2026** (paiement unique, mises à jour à vie, 1 développeur, projets illimités)
| Tier | Prix | Contenu |
| --- | --- | --- |
| **Starter** | **129 $** | 150 composants animés (Tailwind + CSS vanilla), TypeScript, install en une commande pour Claude Code/Cursor, futures versions incluses, licence commerciale projets illimités |
| **Pro** | **249 $** | + 280 blocs de pages (22 catégories) + 300 blocs d'app UI (38 catégories) + thématisation live + **Agent Kit 20 items** + Landing Builder (bêta) |
| **Ultimate** | **349 $** | + 15 templates Next.js complets + nouveaux templates dès leur sortie + support e-mail prioritaire |
| **Équipe / volume** | sur devis | `pro@reactbits.dev` |

**Ce qui reste gratuit :** les 213 composants React Bits, la documentation, les outils créatifs, le MCP.

## 13. Licence
- Composants gratuits : **MIT + Commons Clause** (voir 2.1 §13).
- Pro : **licence commerciale**, **1 licence = 1 développeur**, **projets commerciaux illimités y compris pour des clients**, pas d'abonnement ni de frais par siège. Le texte juridique complet n'est visible qu'après achat ❓ → **à lire avant d'acheter**, notamment la clause de mise à jour et l'interdiction de redistribution (structurellement, la Commons Clause de la partie gratuite suggère la même philosophie : usage dans ton produit ✅, revente ❌).

## 14. Qualité des ressources
Sélection cohérente et de haut niveau ; le vrai saut de valeur est **App UI + templates** (c'est ce qui manque au gratuit). Deux réserves factuelles : (1) le site affiche des compteurs internes incohérents (150 vs somme des sous-catégories ; version indexée par Google mentionnant 134 composants/238 blocs/11 templates → **les chiffres bougent**, vérifier la grille tarifaire du moment) ; (2) les contenus payants n'ont pas été ouverts pour cet audit.

## 15. Cas d'utilisation
SaaS à lancer vite · interface d'application (dashboard, settings, tables, facturation) · landing page « premium » complète · sites d'agence · produit IA (chat, prompt input, activité d'agent) · scaffolding de projet.

## 16. Limites
- **Pas d'aperçu exhaustif avant achat** (catalogues publics, code non public).
- Compteurs annoncés instables d'une page à l'autre ⚠️.
- 1 licence = 1 développeur (pas d'équipe sans plan dédié).
- Pas de npm → pas de gestion de version automatique.
- Dépendance à un auteur unique + écosystème shadcn/Next.js (React 19 / Next 16 annoncés).

## 17. Ressources remarquables (URL directes)
Hero section blocks → https://pro.reactbits.dev/docs/blocks/hero-section · Bento → https://pro.reactbits.dev/docs/blocks/bento · Pricing → https://pro.reactbits.dev/docs/blocks/pricing · Footer → https://pro.reactbits.dev/docs/blocks/footer · **AI Chat** → https://pro.reactbits.dev/docs/app-ui/ai-chat · **Prompt Input** → https://pro.reactbits.dev/docs/app-ui/prompt-input · **Agent Activity** → https://pro.reactbits.dev/docs/app-ui/agent-activity · **Dashboard** → https://pro.reactbits.dev/docs/app-ui/dashboard · **Data Table** → https://pro.reactbits.dev/docs/app-ui/data-table · **Analytics** → https://pro.reactbits.dev/docs/app-ui/analytics · **Authentication** → https://pro.reactbits.dev/docs/app-ui/authentication · Templates → https://pro.reactbits.dev/docs/templates

## 18. Alternatives
Motion UI (sections animées, via shadcn, incluse dans Motion+ 399 $) · shadcnblocks · shadcnstudio · shadcncraft · shadcn UI Kit · Tailwind Plus · Aceternity UI Pro · Tremor (data) — toutes ces pistes sont des **découvertes indirectes** (§10).

## 19. Quand l'utiliser ?
Quand tu veux **tout** (composants + blocs + app UI + templates) chez un seul fournisseur, avec un modèle **« payer une fois, posséder la source »**, et que tu construis en **Next.js/React + Tailwind ou CSS**. **Ne pas l'acheter** si tu es en JS vanilla/Vue, ou si tu n'as besoin que d'effets isolés (le gratuit suffit).

## 20. Verdict
> **Tier A (produit) / Tier S (si tu livres des SaaS en Next.js).** Le meilleur rapport « temps gagné / prix » de cet audit *si* les compteurs affichés correspondent à ton besoin. Achat à fort effet de levier, **à condition de vérifier la grille et la licence au moment de l'achat**.

## À retenir
| Si je construis… | Utilité |
| --- | --- |
| Site vitrine | ⭐⭐⭐ — blocs About, Contact, Showcase, Blog |
| Landing page | ⭐⭐⭐⭐⭐ — 22 catégories de blocs + 15 templates |
| SaaS | ⭐⭐⭐⭐⭐ — app UI : shell, auth, billing, dashboard, tables, settings |
| PWA | ⭐⭐⭐ — responsive annoncé 320px→4K |
| Dashboard | ⭐⭐⭐⭐⭐ — Dashboard, Analytics, Monitoring, Data Table, Filtering |
| Expérience 3D | ⭐⭐⭐ — 30 composants 3D & shaders + templates WebGL |
| Motion design | ⭐⭐⭐⭐ — composants animés + thèmes de motion |
| Avec une IA | ⭐⭐⭐⭐⭐ — Agent Kit + skill d'intégration + MCP |

## Exemples d'utilisation
1. **« Je veux accélérer une interface SaaS »** → app UI `App Shell` + `Navbar` + `Settings Form` + `Billing` + `Paywall`.
2. **« Je lance un produit IA »** → `AI Chat`, `Prompt Input`, `Agent Activity`, `Tool Calls`, `AI Usage`, template `Agentframe`.
3. **« Je veux un dashboard interne »** → `Dashboard`, `Analytics`, `Data Table`, `Monitoring`, `Filtering`.
4. **« Je dois livrer un site complet en 2 jours »** → template `SaaS` / `Finance` / `AI SaaS` puis remplacer les blocs nécessaires.
5. **« Je veux que mon agent assemble la page »** → installer le skill Pro, puis commander : *« Compose une landing SaaS avec hero, pricing et FAQ »*.

---

# 2.3 — UIVERSE

## 1. Identité
**Uiverse.io** — « The Largest Library of Open-Source UI ». Bibliothèque **communautaire** d'éléments d'interface en **CSS ou Tailwind**, avec export **HTML/CSS, Tailwind, React et Figma**. Autour du catalogue gratuit gravitent deux offres payantes : **Uiverse Pro/Pro+** (IA) et **Uiverse Design** (design systems).

## 2. URL
- Site : **https://uiverse.io/**
- Catalogue : **https://uiverse.io/elements**
- IA (Pro/Pro+) : **https://uiverse.io/ai/features**
- Design Systems (payant) : **https://uiverse.io/design/**
- GitHub (miroir communautaire) : **https://github.com/uiverse-io/galaxy** (13,4 k ⭐, 946 forks)

## 3. Fonction principale
Donner accès, en quelques secondes, à **un élément d'UI précis** (bouton, carte, loader, switch, input, tooltip, formulaire, motif) en CSS/Tailwind, copiable et adaptable.

## 4. Catégories (§8)
**Principale :** H. CSS/HTML Library + B. Component Code Library
**Secondaires :** A. UI Component Library · P. Showcase/Galerie (démos animées) · Q. Ressource communautaire (votes, commentaires, variations) · I. React (export) · M. Design System 🟡 (Uiverse Design, payant) · N. AI-Ready 🟡 (design systems « pour agents » + outils IA payants)

## 5. Technologies
CSS pur, Tailwind CSS, HTML, export React, intégration Figma (copie vers Figma), background custom, communautés GitHub/Discord.

## 6. Types de ressources — inventaire (chiffres officiels du site, 5 oct. 2026)
```text
Uiverse
│
├── Éléments UI communautaires
│   ├── Décomptes affichés par le site :  « 7 450 Community-made UI elements » (accueil)
│   │                                   « 4 489 UI elements : CSS & Tailwind » (page /elements)
│   │                                   ⚠️ deux compteurs différents sur le même site
│   ├── Dépôt galaxy (catégories d'export) : Buttons · Cards · Checkboxes · Forms · Inputs ·
│   │        Notifications · Patterns · Radio-buttons · Toggle-switches · Tooltips · loaders
│   └── Filtres du catalogue : All / Tailwind / CSS · tri « Randomized » · thème · catégories
│
├── Tags les plus visibles : button, card, loader, input, checkbox, switch, radio, form,
│   tooltip, notification, pattern, animation, hover, gradient, glass/neumorphism, 3D…
│
├── Formats d'export (fiche élément)
│   ├── HTML + CSS  (code complet affiché + bouton Copy)
│   ├── Tailwind
│   ├── React  (« Export React »)
│   └── Figma  (« Copy to Figma » — compte requis)
│
├── Fonctions communautaires : upvotes, commentaires, variations, profils d'auteurs,
│   « Hall of fame », recherche par tag
│
└── Offres payantes
    ├── Uiverse Pro 4,99 $/mois : Edit with AI (bêta), AI Variations (bêta),
    │   500 000 jetons IA/mois, fonds personnalisés, badge Pro
    ├── Uiverse Pro+ 19,99 $/mois : usage IA illimité + tout Pro
    └── Uiverse Design : 56 design systems « framework-agnostic » pour produits assistés
        par IA — 9,99 à 14,99 $ l'unité (ex. Nightdesk, Caliper, Transect, Headcount),
        compatible Claude Code, Cursor, Codex « +10 » ; remise early-adopter 50 %
```

## 7. Méthodes de récupération
| Méthode | Statut | Détail |
| --- | --- | --- |
| Copier le code | ✅ | HTML + CSS affichés sur la fiche, bouton de copie |
| Export Tailwind | ✅ | Sélecteur d'onglet sur la fiche |
| Export React | ✅ | Menu « Export » |
| Figma | ✅ (compte requis) | « Copy to Figma » → calques éditables (retour d'utilisateurs : l'animation n'est pas toujours conservée) |
| Package npm | ❌ | Aucun paquet officiel |
| CLI | ❌ | Aucune CLI officielle |
| Téléchargement de fichier | ❌ | Copie navigateur uniquement |
| GitHub | 🟡 | Le dépôt `galaxy` est un **miroir d'export** (organisé par catégories), pratique pour les scripts — voir §10 pour le MCP communautaire |
| Prompt IA officiel | ❌ | Pas de « Copy for AI » officiel ; en revanche Uiverse Design vend des design systems destinés aux agents |
| MCP | 🟡 communautaire | **`uiverse-mcp`** (projet tiers, Apache-2.0) : clone `galaxy`, indexe ~3 800 composants, 7 outils MCP, renvoie HTML+CSS à l'agent — voir §10 |

## 8. Code
✅ Code complet et lisible sur chaque fiche (HTML + CSS ou classes Tailwind). Code généralement court et pédagogique (animations `@keyframes`, ombres, `:hover`, pseudo-éléments). **Aucune installation : c'est du copier-coller.**

## 9. Prompts IA
Pas de prompt officiel par élément. La stratégie IA d'Uiverse est différente : **vendre le contexte de design** (Uiverse Design : palettes, typographies, composants, règles d'usage) à injecter dans un agent pour qu'il produise des interfaces cohérentes (« De-slop your AI websites »). Compatibilité annoncée : Claude Code, Cursor, Codex, « +10 ».

## 10. CLI / installation / agents
- **CLI officielle : aucune.** Aucun `npx uiverse add …`.
- **MCP communautaire (non officiel)** — utile et vérifiable :
```text
npx -y uiverse-mcp        (config MCP : command: npx, args: ["-y","uiverse-mcp"])
        ↓ Pré-requis : un client MCP (Claude Code, Cursor, Windsurf, Cline…)
        ↓ Ce qu'il fait : clone une fois le dépôt galaxy (~85 Mo), construit un index en mémoire
        ↓ Ce qu'il expose : 7 outils de recherche/lecture ; renvoie le HTML + CSS complet
        ↓ Licence : Apache-2.0 (serveur) / MIT (contenu) — projet tiers, pas Uiverse
        ↓ Résultat : ton agent peut chercher « neon button » et insérer le composant
```

## 11. Personnalisation
**Par le code** : couleurs, tailles, transitions, structure — tout est éditable puisque c'est du CSS. Pas de panneau de configuration, **sauf** les fonctions IA payantes (Edit with AI, AI Variations) qui modifient/dupliquent un élément à partir d'un prompt. Les éléments sont souvent **mono-composant et décoratifs** : la factorisation et le responsive restent à ta charge.

## 12. Gratuit / Premium
- **Gratuit** : l'intégralité des éléments communautaires, « **100 % free for personal and commercial use** », export HTML/CSS, Tailwind, React ; copie Figma (compte).
- **Payant** : Pro 4,99 $/mois · Pro+ 19,99 $/mois (IA) · Design Systems 9,99–14,99 $ pièce (remise 50 % early adopter).
- **Limites du gratuit** : pas d'IA, pas de bibliothèque de thèmes, qualité très variable selon l'auteur (voir §16), pas de garantie de maintenance.

## 13. Licence
- **Dépôt `galaxy` : MIT License** (fichier `LICENSE` vérifié, © 2023 Uiverse.io) → copie, modification, usage commercial, redistribution autorisés **avec conservation de la notice**.
- **Chaque fiche élément affiche « MIT License »** (vérifié sur une fiche représentative : `https://uiverse.io/alexruix/tame-fly-42`).
- **Réserve importante** : la licence MIT du dépôt/des fiches porte sur le **code**. Les **design systems Uiverse Design** et les **fonctions IA** relèvent d'un contrat commercial distinct → **ne pas supposer que « gratuit » vaut pour les assets payants**.
- **Bonne pratique** : comme le contenu est communautaire, créditer l'auteur (lien vers sa fiche) est à la fois courtois et traçable — plusieurs éléments sont repris de projets existants.

## 14. Qualité des ressources
**Très variable, et c'est la caractéristique principale.** Points forts : volume, diversité, effets visuels flatteurs, code court facile à apprendre. Points faibles documentés par les utilisateurs eux-mêmes dans les commentaires (Figma sans animation, « how to use? » fréquents) : absence de documentation, sémantique HTML inégale, accessibilité rarement traitée (focus, aria), responsive non testé, dépendance à des hacks CSS. **À traiter comme un matériau brut, pas comme un design system.**

## 15. Cas d'utilisation
Boutons/loaders « avec du caractère » · micro-interactions CSS · cartes produit · toggles/checkboxes stylés · tooltips · motifs de fond · prototypes rapides · projets non-React · inspiration CSS pour apprendre les `@keyframes` · alimentation d'un agent IA via MCP.

## 16. Limites
- **Compteurs incohérents** (7 450 vs 4 489) ⚠️.
- **Qualité non homogène** → toujours relire le code (performance, accessibilité, compatibilité).
- Pas d'API publique officielle ni de CLI → automatisation impossible hors scraping/MCP tiers.
- Pas de « Copy for AI » officiel.
- Fonctions IA = abonnement payant, pas d'essai gratuit identifié ❓.
- Figma : la copie perd souvent l'animation (limitation reconnue dans les commentaires).
- Absence de versionnage : un élément peut changer/disparaître (le miroir `galaxy` règle partiellement ce point).

## 17. Ressources remarquables (URL directes)
| Ressource | URL | Pourquoi |
| --- | --- | --- |
| Loader « tame-fly-42 » | https://uiverse.io/alexruix/tame-fly-42 | Loader CSS emblématique (114 k vues), code très pédagogique |
| Galerie complète | https://uiverse.io/elements | Le point d'entrée principal |
| Tag `loader` | https://uiverse.io/tags/loader | La catégorie la plus utile pour démarrer |
| Tag `button` | https://uiverse.io/tags/button | La plus fournie |
| Tag `card` | https://uiverse.io/tags/card | Cartes prêtes à adapter |
| Tag `animated` | https://uiverse.io/tags/animated | Effets animés CSS |
| Tag `hover effect` | https://uiverse.io/tags/hover%20effect | Micro-interactions |
| Profil `vinodjangid07` | https://uiverse.io/profile/vinodjangid07 | Auteur le plus consulté (157 posts, ~903 k vues) |
| Uiverse Design | https://uiverse.io/design/ | Design systems payants orientés agents IA |

## 18. Alternatives
- **React + animation avancée** → React Bits, Motion UI
- **CSS commercial + qualité garantie** → Tailwind Plus (Tailwind UI), HyperUI (gratuit), Flowbite, daisyUI (composants de framework)
- **Composants copy-paste shadcn** → shadcn/ui + registres (Bklit, React Bits, Motion UI)
- **Multi-framework, MIT** → shadcn-vue, Park UI, Ark UI, Radix

## 19. Quand utiliser Uiverse ?
- Quand tu veux **un petit composant CSS isolé** (loader, switch, bouton, tooltip) **maintenant**.
- Quand tu travailles **hors React** (HTML/CSS/Tailwind, PHP, WordPress, Astro, Vue…).
- Quand tu veux **apprendre** en lisant du CSS court et spectaculaire.
- **Ne pas l'utiliser** pour des composants critiques (formulaires accessibles, tableaux de données, navigation complexe) : la qualité n'est pas garantie.

## 20. Verdict
> **Tier A — très utile, à manier avec du discernement.** C'est la « quincaillerie » du design web : immense, gratuite, MIT, immédiate. Elle ne remplace ni un design system ni une vérification d'accessibilité. **À garder en onglet pour les besoins ponctuels, et à combiner avec le MCP communautaire si tu veux que ton agent pioche dedans.**

## À retenir
| Si je construis… | Utilité |
| --- | --- |
| Site vitrine | ⭐⭐⭐⭐ — boutons, cartes, loaders, motifs |
| Landing page | ⭐⭐⭐ — des accents, pas la structure (→ React Bits/Motion UI pour ça) |
| SaaS | ⭐⭐ — sauf pour des micro-composants isolés |
| PWA | ⭐⭐⭐ — CSS léger, adapté mobile |
| Dashboard | ⭐ — aucun composant de data viz |
| Expérience 3D | ⭐ — quelques cartes 3D/hover |
| Motion design | ⭐⭐⭐ — animations CSS pures, très pédagogiques |
| Avec une IA | ⭐⭐⭐ (via `uiverse-mcp` communautaire) ou ⭐⭐⭐⭐ si tu achètes Uiverse Design |

## Exemples d'utilisation (§31)
1. **« Il me faut un loader original en 2 minutes »** → `https://uiverse.io/tags/loader`, copier le CSS, changer les couleurs.
2. **« Je veux un toggle animé en CSS pur »** → tag `switch`, puis vérifier le focus clavier (à ajouter soi-même).
3. **« Je fais un site en Astro/PHP, sans React »** → chercher tag `button` / `card`, coller HTML+CSS.
4. **« Je veux que mon agent insère un composant Uiverse »** → brancher `uiverse-mcp`, demander « trouve une carte glass sombre ».
5. **« Je veux dé-‘sloper’ mes interfaces générées par IA »** → évaluer `Uiverse Design` (payant) comme contexte de design.

---

# 2.4 — ANIME.JS

## 1. Identité
**Anime.js** — « All-in-one animation engine ». Moteur d'animation **JavaScript** créé par **Julian Garnier**, v4, financé par ses sponsors. Ce n'est pas un catalogue de composants : c'est une **bibliothèque** que l'on installe.

## 2. URL
- Site : **https://animejs.com/**
- Documentation : **https://animejs.com/documentation**
- Installation : **https://animejs.com/documentation/getting-started/installation**
- GitHub : **https://github.com/juliangarnier/anime**
- npm : **https://www.npmjs.com/package/animejs**
- Migration v3 → v4 : https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4

## 3. Fonction principale
Animer **n'importe quoi** sur le web avec une seule API JS : éléments DOM, attributs, objets JS, SVG et — nouveauté v4.5 — **objets 3D non-DOM** via adaptateurs.

## 4. Catégories (§8)
**Principale :** G. JavaScript Animation Engine
**Secondaires :** F. Motion/Animation Library · L. 3D/WebGL 🟡 (adaptateur Three.js) · J. framework-agnostic (utilisable avec React/Vue/Svelte sans wrapper officiel)

## 5. Technologies
JavaScript ES2020+, **bundle ESM + UMD + CommonJS**, npm/CDN, WAAPI (Web Animation API), SVG, Three.js (via adaptateur), CSS transforms.

## 6. Types de ressources et périmètre fonctionnel (documentation complète)
```text
Anime.js v4 — boîte à outils
│
├── Timer            → boucle de temps personnalisée (fps, vitesse, callbacks)
├── Animation        → animate() : tween, keyframes, composition "blend", boucles
├── Timeline         → createTimeline() : séquences, positions temporelles, synchronisation
├── Animatable       → valeurs animables persistantes (objets/JSON)
├── Draggable        → createDraggable() : drag, snap, flick, throw, container, releaseEase
├── Layout           → createLayout() : animation entre deux états de layout (AutoLayout)
├── Scope            → createScope() : portée, root, media queries (responsive), méthodes
├── Events           → onScroll() : déclenchement et synchronisation au scroll, seuils, callbacks
├── SVG              → morphto, createDrawable (line drawing), createMotionPath
├── Text             → découpage/animation de texte (lignes, mots, caractères)
├── Utilities        → random(), round(), remap(), snap(), etc.
├── Easings          → easings intégrés, paramétriques "inOut(3)", fonctions personnalisées
├── WAAPI            → pont vers les Web Animations API natives
├── Engine           → réglages globaux (defaults, fps, moteur)
└── Adapters (4.5)   → adaptateur Three.js fourni + registerAdapter() pour tes propres cibles
```

## 7. Méthodes de récupération
| Méthode | Statut |
| --- | --- |
| **npm** | ✅ `npm install animejs` (dernière version : **4.5.0**, publiée le 22 juin 2026) |
| **CDN** | ✅ ESM : `https://esm.sh/animejs`, `https://cdn.jsdelivr.net/npm/animejs/+esm` ; UMD : `https://cdn.jsdelivr.net/npm/animejs/dist/bundles/anime.umd.min.js` |
| **Téléchargement direct** | ✅ fichiers `dist/` depuis le dépôt GitHub (bundles ESM/UMD, minifiés ou non) |
| **GitHub** | ✅ code source complet |
| Copie de code par composant | ❌ (il n'y a pas de catalogue) → mais la doc fournit des **snippets copiables** |
| CLI / MCP / prompt IA / Figma | ❌ |

## 8. Code
✅ API documentée et **exemples interactifs édités dans la page** (les valeurs se modifient en direct dans la doc). Exemples vérifiés d'API :
```js
import { animate, createTimeline, stagger, createDraggable, createSpring, onScroll, createDrawable } from 'animejs';

animate('.square', { rotate: 90, loop: true, ease: 'inOutExpo' });

animate(createDrawable('path'), {
  draw: ['0 0', '0 1', '1 1'],
  delay: stagger(40),
  ease: 'inOut(3)',
  autoplay: onScroll({ sync: true }),   // animation pilotée par le scroll
});

createDraggable('.circle', { releaseEase: createSpring({ stiffness: 120, damping: 6 }) });
```
**Module imports** : tout est importable à l'unité (`animejs/draggable`, `animejs/svg`, `animejs/adapters/three`…) → seuls les modules utilisés entrent dans le bundle.

## 9. Prompts IA
❌ Aucun prompt, skill, MCP ou documentation « pour agents ». **Anime.js n'est pas outillé pour l'IA** — un agent devra s'appuyer sur la documentation publique (et la connaître, car l'API v4 a cassé la v3 : plus d'export par défaut, plus de `anime({...})`). C'est un point de vigilance si ton workflow est agentique.

## 10. CLI / installation
```text
npm install animejs
        ↓ Pré-requis : un bundler (Vite, esbuild, webpack…) ou <script> UMD pour l'usage direct navigateur
        ↓ Dépendances : AUCUNE (bundle autonome) — l'adaptateur Three.js suppose que tu utilises déjà Three.js
        ↓ Import : import { animate } from 'animejs'
        ↓ Taille : 27,13 KB au total, modulaire —
             Timer 5,60 · Animation +5,20 · Draggable 6,41 · Scroll 4,30 · WAAPI 3,50 ·
             Timeline 0,55 · Spring 0,52 · Stagger 0,48 · Animatable 0,40 · SVG 0,35 · Scope 0,22
        ↓ Résultat : moteur d'animation disponible partout dans ton JS
        ↓ Coût : gratuit, sans compte, licence MIT
```

## 11. Personnalisation
**Maximale par nature** : chaque animation est du code. Tu contrôles durées, délais, easings (dont **spring** paramétrique), composition (`replace`/`blend`/`none`), boucles, `alternate`, `reversed`, `loopDelay`, seuils de scroll, **media queries via `createScope`** (responsive), et — via adaptateurs — **tes propres objets métier** (un mesh Three.js, un objet d'une lib tierce).

## 12. Gratuit / Premium
**100 % gratuit.** Le site l'affirme : « Anime.js is 100% free and is only made possible with the help of our sponsors. » Aucun tier payant, aucun quota, aucun compte. Un objectif de financement par sponsors est affiché (13 % atteint au moment de l'audit).

## 13. Licence
**MIT License** — vérifié dans `LICENSE.md` du dépôt : « Copyright (c) 2025 Julian Garnier » → usage commercial, modification, redistribution, sous-licence **autorisés**, avec conservation de la notice. **La licence la plus permissive de cet audit.**

## 14. Qualité des ressources
Excellente sur son terrain : l'API v4 est **modulaire et cohérente**, la documentation est dense avec démos interactives, le bundle est **petit**, et l'adoption est large (920+ paquets npm dépendants). Points de vigilance : **rupture d'API v3 → v4** (du code v3 est encore partout sur le web), pas de composants « prêts à l'emploi », et l'animation DOM à haute fréquence reste à toi de profiler (voir §10 pour MotionScore, qui audite aussi GSAP/anime.js côté performances).

## 15. Cas d'utilisation
Animations sur mesure de landing page · reveals au scroll synchronisés · animations SVG (morphing de logo, tracé de lignes, objets suivant un chemin) · compteurs et titres animés · interactions drag & drop ludiques · animations en site statique sans framework · animation de scènes Three.js (v4.5) · remplacement léger de GSAP quand on veut du MIT strict et du JS vanilla.

## 16. Limites
- **Pas de catalogue** : tout est à écrire → plus lent à démarrer que React Bits.
- **Pas d'intégration React/Vue officielle** : on passe par `useEffect` + `createScope` (documenté, mais verbeux).
- Pas d'animations de **layout** aussi magiques que Motion (`layout` prop) — le module `Layout` v4 existe mais ne s'applique pas aux transitions de composants React par état.
- Pas de ressources IA, pas de CLI, pas de Figma.
- Historique de migration : beaucoup d'exemples en ligne sont en v3 (obsolètes).

## 17. Ressources remarquables (URL directes)
- Getting started → https://animejs.com/documentation/getting-started
- Animation → https://animejs.com/documentation/animation
- Timeline → https://animejs.com/documentation/timeline
- Scroll → https://animejs.com/documentation/events/onscroll
- SVG (morphing, tracé, motion path) → https://animejs.com/documentation/svg
- Text → https://animejs.com/documentation/text
- Draggable & Spring → https://animejs.com/documentation/draggable
- Layout → https://animejs.com/documentation/layout
- Scope (responsive) → https://animejs.com/documentation/scope
- **Adapters (dont Three.js)** → https://animejs.com/documentation/adapters
- Using with React → https://animejs.com/documentation/getting-started/using-with-react
- Bundle/taille → https://animejs.com/documentation/engine

## 18. Alternatives
**Motion** (React/Vue/JS, declarative, MIT + Motion+), **GSAP** (le standard pro, gratuit dans sa version de base, mais licence commerciale pour certains plugins/usage), **Motion One** (aujourd'hui fondu dans Motion), **Popmotion** (précurseur), **Theatre.js**, **Lottie** (animations After Effects), **Rive** (animations state-machine). Voir les comparaisons détaillées §3.

## 19. Quand utiliser Anime.js ? (§23 — « quand utiliser cette bibliothèque ? »)
- **Site sans framework** (HTML/JS, Astro, PHP, WordPress) → meilleur choix.
- **SVG à animer finement** (morphing, line drawing, motion path) → excellent.
- **Besoin d'un bundle minimal** et d'une licence MIT stricte.
- **Animation d'objets 3D Three.js** avec une API d'animation générique (adaptateur v4.5).
- **À éviter** si : tu es en React et veux du déclaratif, tu as besoin de transitions de layout automatiques, de gestes natifs intégrés au DOM React, ou tu veux que ton agent IA écrive l'animation sans contexte (peu de ressources IA).

## 20. Verdict
> **Tier A — incontournable comme moteur JS vanilla, spécialement pour le SVG et le scroll synchronisé.** Gratuit, MIT, petit, sans dépendance. Ce n'est pas une source de composants : c'est un outil d'expression.

## À retenir
| Si je construis… | Utilité |
| --- | --- |
| Site vitrine | ⭐⭐⭐⭐ — animations sur mesure au scroll |
| Landing page | ⭐⭐⭐⭐ — reveals, compteurs, SVG |
| SaaS | ⭐⭐ — peu d'usage : l'UI produit préfère Motion/CSS |
| PWA | ⭐⭐⭐ — léger (bundle réduit au besoin) |
| Dashboard | ⭐⭐ — animations de chiffres/graphes manuelles |
| Expérience 3D | ⭐⭐⭐ — adaptateur Three.js, mais pas de moteur 3D |
| Motion design | ⭐⭐⭐⭐⭐ — contrôle total, easing, timeline, spring, draggable |
| Avec une IA | ⭐ — aucun support agentique officiel (l'agent perd du temps à deviner la v4) |

## Exemples d'utilisation (§31)
1. **« Je veux un reveal au scroll synchronisé »** → `onScroll({ sync: true })` + `stagger` sur les enfants : https://animejs.com/documentation/events/onscroll
2. **« Je veux un logo SVG qui se dessine / se transforme »** → `createDrawable` + `morphTo` : https://animejs.com/documentation/svg
3. **« Je veux un titre animé avec cascade »** → module Text + `stagger(40)`.
4. **« Je veux un objet 3D manipulable au drag »** → `createDraggable` + `createSpring` (et adaptateur Three.js pour animer la scène).
5. **« Je veux animer un site statique sans framework »** → import UMD/ESM depuis jsDelivr, zéro build.

---

# 2.5 — BKLIT UI

## 1. Identité
**Bklit UI** — « Design engineered data visualization components ». Bibliothèque de **composants de graphiques React**, distribuée comme **registre shadcn/ui** (`@bklit`), créée par **Matt / @uixmat**. Membre du **Vercel Open Source Software Program**, parrainée par UI Rules et shadcn studio. Le projet comprend aussi **Bklit Studio**, un studio visuel de charts (propriétaire).

## 2. URL
- Site : **https://bklit.com/**
- Installation : **https://bklit.com/docs/installation**
- Catalogue docs : **https://bklit.com/docs/components**
- Studio : **https://bklit.com/studio**
- Liste des charts (marketing) : **https://bklit.com/charts**
- GitHub : **https://github.com/bklit/bklit-ui** (~1,7 k ⭐, 114 forks)
- Registre brut : **https://ui.bklit.com/r/{name}.json**

## 3. Fonction principale
Intégrer **17 types de graphiques** + les **primitives de composition** (axes, grille, légende, tooltip, marqueurs, brush, projection, référence) **directement dans ton code source**, cohérents avec shadcn/ui, et les **régler visuellement** dans Studio.

## 4. Catégories (§8)
**Principale :** K. Data Visualization
**Secondaires :** B. Component Code Library · I. React Library · M. Design System 🟡 (tokens `--chart-*`, thèmes clair/sombre) · O. CLI ✅ (shadcn CLI) · OUTIL (Studio) · E. Page Block Library 🟡 (3 blocs « stat card »)

## 5. Technologies
React + **TypeScript**, **Tailwind**, **shadcn/ui** (prérequis), **visx / D3** (couche de rendu), **motion/react** (animations), CLI shadcn, thèmes CSS variables (`chartCssVars`). Node ≥ 18 pour le dépôt.

## 6. Types de ressources — inventaire exhaustif du registre (vérifié dans `registry.json`)
```text
Registre @bklit — 56 entrées
│
├── Composants (32)
│   ├── Charts (17) : Area · Bar · Candlestick · Choropleth · Composed · Funnel · Gauge ·
│   │                 Heatmap · Line · Live Line · Pie · Profit/Loss Line · Radar ·
│   │                 Ring · Sankey · Scatter · Sunburst
│   ├── Primitives de composition : X Axis · Y Axis · Grid · Legend · Chart Tooltip ·
│   │        Markers · Reference Area · Projection Line · Background · Bar Depth ·
│   │        Chart Context · Chart Series · Chart Animation · Chart Stat Flow
│   └── Utilitaires visuels : Shimmering Text (chargement)
│
├── Exemples installables (19) — un par chart + 3 stat cards
├── Blocs (3) : Stat Card Area · Stat Card Choropleth · Stat Card Line
└── Libs (2) : chart-utils · utils
```

**Détail des 17 charts** (docs → https://bklit.com/docs/components/&lt;nom&gt;)

| Chart | URL docs | Usage typique |
| --- | --- | --- |
| Area Chart | https://bklit.com/docs/components/area-chart | Séries temporelles avec volume |
| Bar Chart | https://bklit.com/docs/components/bar-chart | Comparaisons catégorielles (empilable/groupé) |
| Candlestick | https://bklit.com/docs/components/candlestick-chart | Finance, OHLC |
| Choropleth | https://bklit.com/docs/components/choropleth-chart | Cartes géographiques |
| Composed | https://bklit.com/docs/components/composed-chart | Barres + ligne/aire sur un même axe temps |
| Funnel | https://bklit.com/docs/components/funnel-chart | Conversion, entonnoir produit |
| Gauge | https://bklit.com/docs/components/gauge-chart | KPI « jauge » |
| Heatmap | https://bklit.com/docs/components/heatmap-chart | Densité, calendriers (helpers intégrés) |
| Line Chart | https://bklit.com/docs/components/line-chart | Tendance |
| Live Line Chart | https://bklit.com/docs/components/live-line-chart | **Streaming temps réel** |
| Pie Chart | https://bklit.com/docs/components/pie-chart | Répartition |
| Profit/Loss Line | https://bklit.com/docs/components/profit-loss-line | Séries positives/négatives |
| Radar Chart | https://bklit.com/docs/components/radar-chart | Profils multivariés |
| Ring Chart | https://bklit.com/docs/components/ring-chart | Anneau de progression |
| Sankey | https://bklit.com/docs/components/sankey-chart | Flux entre catégories |
| Scatter | https://bklit.com/docs/components/scatter-chart | Corrélations |
| Sunburst | https://bklit.com/docs/components/sunburst-chart | Hiérarchies |

## 7. Méthodes de récupération
| Méthode | Statut | Détail |
| --- | --- | --- |
| **CLI shadcn (officiel)** | ✅ | `npx shadcn@latest add @bklit/area-chart` — télécharge le source, installe les dépendances, place les fichiers |
| **Registre** | ✅ | Déclarer `{"registries":{"@bklit":"https://ui.bklit.com/r/{name}.json"}}` dans `components.json` |
| **Studio** | ✅ | Régler visuellement, puis copier le code React généré |
| **GitHub** | ✅ | Dépôt complet (LICENSE séparée pour Studio) |
| npm | ❌ | Le manifeste racine est privé : **aucun paquet installable** |
| Téléchargement de fichier / Figma / prompt IA officiel | ❌ / ❌ / 🟡 (skill communautaire) |

## 8. Code
✅ Source complète installé dans ton projet (`registry:component`), **composable** : un chart s'assemblе à partir de `Root → Grid → séries → axes → ChartTooltip`, avec **loading skeletons pour chaque chart majeur**, brush de sélection, lignes de projection, marqueurs, remplissages à motifs, thèmes clair/sombre et variables de thème (`chartCssVars`, `--chart-*`).

## 9. Prompts IA / ressources agents
- **Pas d'AI Kit officiel dans les docs**, mais un **skill « Bklit UI »** référencé par des annuaires d'agents (getclaudeskills) et **publié depuis le dépôt bklit** ; son `SKILL.md` est très explicite :
  - *Install before inventing* : `npx shadcn@latest add @bklit/<chart>` plutôt que de dessiner du SVG à la main ;
  - *Compose, don't flatten* ;
  - *Theme with tokens* (`chartCssVars`, jamais de couleur en dur).
  → **Utile et actionnable**, mais **à vérifier côté source officielle** avant de le présenter comme un produit Bklit ❓.
- Les **19 `registry:example`** jouent un rôle proche d'un « prompt vérifié » : ce sont des compositions complètes que l'agent peut installer comme référence.

## 10. CLI / installation (comportement exact)
```text
npx shadcn@latest init          # prérequis : projet shadcn/ui
+ components.json : "registries": { "@bklit": "https://ui.bklit.com/r/{name}.json" }
pnpm dlx shadcn@latest add @bklit/area-chart     # ou npx / yarn / bun
        ↓ Pré-requis : React + shadcn configuré ; Node ≥ 18 pour le dépôt
        ↓ Ce qui est téléchargé : le code source du composant
        ↓ Ce qui est installé : dépendances npm + registryDependencies (ex. chart-utils, tooltip, axes)
        ↓ Où : dans le dossier de composants configuré
        ↓ Note : le namespace @bklit est configuré automatiquement pour les nouveaux projets
        ↓ Résultat : tu possèdes et modifies le code ; aucun paquet versionné à mettre à jour
        ↓ Coût : gratuit, sans compte
```

## 11. Personnalisation
**Pensée pour ça** : chaque chart expose ses internes (axes, grille, tooltip parts, légende, marqueurs, motifs) → **modifier plutôt que forker**. Thématisation par **design tokens** (`chartCssVars`, `--chart-*`), thèmes clairs/sombres, composition multi-séries (`SeriesBar` + `Line`/`Area`), états de chargement inclus, animations via motion/react. Le **Studio** ajoute un réglage visuel (couleurs, dimensions, séries) et des liens partageables (`/studio?s=…`).

## 12. Gratuit / Premium
- **Gratuit : tous les composants de charts et utilitaires** (MIT), sans compte.
- **Studio (bklit.com/studio)** : accessible sur le site, **Studio 2 en bêta** ; l'auteur indique que *tout le code est open source et le restera*, mais que Studio est **propriétaire** (voir §13). **Aucune page de tarification publique trouvée** au 5 octobre 2026 → **modèle économique de Studio = ❓** (gratuit en bêta ou payant, non documenté publiquement). Une version « Pro » a été évoquée par l'auteur sans décision arrêtée.
- **Ne pas confondre** : composants MIT gratuits ≠ Studio réutilisable.

## 13. Licence — **double régime (vérifié dans le README du dépôt)**
> « **Chart components** (packages/ui, shadcn registry) are **MIT licensed**. **Bklit Studio** (packages/studio, hosted at ui.bklit.com/studio) is **proprietary**. See LICENSE-STUDIO.md. You may not reuse, resell, or redistribute Studio without written permission. »

- Composants : **MIT** → usage commercial ✅, modification ✅, redistribution ✅ (avec notice).
- Studio : **propriétaire** → ❌ pas de réutilisation, revente ni redistribution ; pas d'auto-hébergement/forck.
- **Point juridique à retenir** : si tu ajoutes un composant Bklit dans ton produit, tu es couvert par MIT. Si tu veux **exporter/automatiser le Studio** ou intégrer ses sorties dans un produit tiers, il faut une autorisation écrite.

## 14. Qualité des ressources
Très bonne sur le cœur technique : profondeur inhabituelle pour un registre (skeletons de chargement, brush, projection, streaming live, heatmap avec helpers calendrier, thèmes clair/sombre), base **visx/D3** qui évite le plafond de Recharts, et un modèle « tu possèdes le source ». Les réserves factuelles : **pas de paquet npm → pas de `npm update`** (chaque correctif = re-copie manuelle), **maintenance concentrée sur un auteur principal** (continuité = risque), **base contributive étroite** (114 forks), et **Studio fermé** alors que c'est lui qui rend la bibliothèque attractive à évaluer.

## 15. Cas d'utilisation
Dashboards analytiques · interfaces finance (candlestick, profit/loss) · produits data (Sankey, Sunburst, Choropleth) · KPI cards · monitoring temps réel (Live Line) · heatmaps d'engagement · portails open data · produits SaaS déjà en shadcn/ui qui refusent un deuxième langage visuel.

## 16. Ressources remarquables
- Installation : https://bklit.com/docs/installation
- Charts marketing (avec « Open in Studio ») : https://bklit.com/charts
- Exemples composés : https://bklit.com/docs/components/composed-chart
- Sankey : https://bklit.com/docs/components/sankey-chart · Sunburst : https://bklit.com/docs/components/sunburst-chart
- Choropleth : https://bklit.com/docs/components/choropleth-chart · Live Line : https://bklit.com/docs/components/live-line-chart
- Studio : https://bklit.com/studio · GitHub : https://github.com/bklit/bklit-ui · Discord : https://discord.gg/75s4frfE8X

## 17. Alternatives
**Tremor** (le plus proche : charts React/Tailwind, « copy-paste »), **Recharts** (pragmatique, mais plafond de personnalisation), **shadcn/ui charts** (fondation Recharts, gratuit), **Nivo** (large catalogue), **visx** (primitives D3, vous construisez tout), **ECharts / ApexCharts** (moteurs complets non-React-native), **Chart.js** (simple), **D3** (tout faire soi-même), **Observable Plot**, **Vega-Lite**. Comparaison détaillée §3 et §7.

## 18. Quand utiliser Bklit UI ?
- Projet **React + shadcn/ui + Tailwind** qui a besoin de **graphiques cohérents** sans second système visuel.
- Besoin de charts **rares** (Sankey, Sunburst, Choropleth, Candlestick, Live Line) sans payer une suite commerciale.
- Volonté de **posséder le code** des graphiques et de les modifier en profondeur.
- **À éviter** si : tu ne veux pas adopter shadcn, tu as besoin d'un paquet npm versionné mis à jour automatiquement, ou tu veux du support commercial garanti.

## 19. Verdict
> **Tier B (spécialisé data viz) — mais Tier A dès que tu construis un dashboard en React/shadcn.** La profondeur des primitives et l'absence de verrouillage runtime compensent largement l'absence d'`npm update`. Réserve à intégrer dès la décision : dépendance à un mainteneur unique et Studio propriétaire.

## À retenir
| Si je construis… | Utilité |
| --- | --- |
| Site vitrine | ⭐ — inutile sauf un mini-graphe |
| Landing page | ⭐⭐ — un « stats + courbe » de preuve |
| SaaS | ⭐⭐⭐⭐ — dashboards produit, analytics, facturation |
| PWA | ⭐⭐⭐ |
| Dashboard | ⭐⭐⭐⭐⭐ — c'est sa raison d'être |
| Expérience 3D | ⭐ |
| Motion design | ⭐⭐ — animations de données uniquement |
| Avec une IA | ⭐⭐⭐ — registry installable + skill communautaire (à vérifier) ; très bon terrain pour un agent shadcn |

## Exemples d'utilisation (§31)
1. **« Je développe un dashboard analytique en React/shadcn »** → `area-chart`, `bar-chart`, `chart-tooltip`, `x-axis`, `legend`, `stat-card-area-01`.
2. **« Je veux un graphe de flux (utilisateurs → étapes → sorties) »** → `sankey-chart` + `chart-stat-flow`.
3. **« Je veux afficher une métrique temps réel »** → `live-line-chart` (streaming) + `shimmering-text` pour le chargement.
4. **« Je veux une carte de répartition géographique »** → `choropleth-chart`.
5. **« Je veux régler le chart visuellement puis coller le code »** → ouvrir le composant dans Studio (lien `Open in Studio` présent sur la page d'accueil), ajuster, copier.

---

# 2.6 — MOTION

## 1. Identité
**Motion** (ex-**Framer Motion**) — la bibliothèque d'animation de référence de l'écosystème React, désormais multi-plateforme (**React, JavaScript, Vue**), maintenue par Matt Perry et l'équipe Motion. Autour du cœur open source : **Motion+** (offre payante), **Motion UI** (sections/composants animés), **AI Kit** (agents IA), **Motion Studio** (éditeur visuel), **MotionScore** (audit de performance), **CSS Studio** (produit associé), **vgpu** (rendu GPU).

## 2. URL
- Site : **https://motion.dev/**
- Docs : **https://motion.dev/docs** (React · JavaScript · Vue · Three.js · vgpu)
- AI Kit : **https://motion.dev/ai-kit** · installation : https://motion.dev/docs/ai-kit-install
- Motion UI : **https://motion.dev/ui** · Exemples : **https://motion.dev/examples** · Tutoriels : **https://motion.dev/tutorials**
- Motion+ : **https://motion.dev/plus** · Motion Studio : https://motion.dev/docs/studio · MotionScore : https://score.motion.dev/docs
- GitHub : https://github.com/motiondivision/motion · Skill IA : https://github.com/motiondivision/ai-kit

## 3. Fonction principale
Animer une interface **de façon déclarative et performante**, du micro-détail (hover, tap) aux transitions de page, en s'appuyant sur les API natives du navigateur (WAAPI + ScrollTimeline) avec repli JavaScript quand c'est nécessaire.

## 4. Catégories (§8)
**Principale :** F. Motion/Animation Library + G. JS Animation Engine + I. React Library
**Secondaires :** J. Vue (motion-v) · L. 3D/WebGL (docs Three.js + vgpu) · D/E. Templates & sections (Motion UI) · N. AI-Ready (skill + MCP + MotionScore) · O. CLI (`npx motion-ai`, `npm i motion-studio`) · M. Design System 🟡 (tokens `motion.theme.ts`)

## 5. Technologies
React 18/19, JavaScript, Vue 3, TypeScript, Web Animations API, ScrollTimeline, springs, gestures, layout animation, SVG, Three.js, **vgpu**, shadcn (installation de Motion UI), Base UI (mentionné pour certains composants), Next.js/Vite/Nuxt/Astro/Webpack (Motion Studio), MCP.

## 6. Types de ressources — inventaire public (sitemap officiel, 5 oct. 2026)
```text
Motion (motion.dev)
│
├── Bibliothèque cœur (open source, MIT)
│   ├── React : animate, motion component, scroll, layout, AnimatePresence,
│   │           transitions/springs, text animation, gestures, motion values
│   ├── JavaScript : animate, scroll, easing functions, springs, tween, SVG, 3D transforms
│   ├── Vue : motion-v (mêmes concepts)
│   └── Intégrations : Three.js, vgpu
│
├── Exemples : 462 pages  (React 206 · Vue 163 · JavaScript 93)
│   ex. Mega Menu · Parallax · Skeleton Shimmer · Confetti · Typewriter · Command Palette ·
│       Reorder grid · Three.js TSL particle morph · Three.js scroll-driven logo · vgpu scenes
│
├── Motion UI (Motion+) : 30 sections animées + 24 composants UI référencés
│   ├── Sections : Hero (editorial stagger, parallax layers, terminal) · Pricing (tiers morph,
│   │   usage slider) · Bento (staggered) · Testimonials · Stats (counters, live panel) ·
│   │   Navigation (mega menu, command palette) · CTA (magnetic, signup celebrate) ·
│   │   Footers · Page transitions (curtains, mask) · FAQ · Overlays (sheet, toasts) ·
│   │   Buttons (rolling text, hold to confirm, add to basket) · Lists, Loaders
│   └── Composants : Accordion · Add to basket · Border beam · Command palette · Confetti ·
│       Coverflow · Sheet · Carousel controls · Expand card · Magnetic pull · Mask wipe ·
│       Progress bar · Scramble reveal · Scroll spotlight / zoom reveal · Segmented toggle ·
│       Split reveal · Stagger reveal · Skeleton · Sparkline · Terminal session · …
│
├── Motion+ (payant) : 460+ exemples avec source · composants premium (Carousel, AnimateNumber,
│   Ticker, Cursor, Typewriter, ScrambleText, Curtains) · Motion UI · AI Kit complet ·
│   110+ tutoriels · Discord privé · accès anticipé · éditeur de transitions visuel
│
├── AI Kit : skill /motion · MCP · Context (docs + exemples) · MotionScore for Agents ·
│   génération de CSS springs (linear()) · éditeur de transitions dans l'IDE
│
└── Outils : Motion Studio (timeline sur ton site) · MotionScore (audit perf) · CSS Studio
```

## 7. Méthodes de récupération
| Méthode | Statut | Détail |
| --- | --- | --- |
| **npm** | ✅ | `npm install motion` (imports `motion/react`, `motion` pour JS, `motion-v` pour Vue) |
| **CDN** | ✅ | documenté dans le guide d'installation |
| **CLI / agents** | ✅ | `npx motion-ai` (installe le skill `/motion` MIT + câble le MCP dans Claude Code, Cursor, Amp, OpenCode, Gemini CLI, Copilot) ; `npm install -D motion-studio` |
| **shadcn (Motion UI)** | ✅ | installer une section/composant via shadcn et **garder la source** |
| **MCP** | ✅ | donne à l'agent l'accès au catalogue Motion UI + 460+ exemples |
| **Copie de code** | ✅ | pages d'exemples avec source (dont certaines gratuites), boutons « Copy code », et liens « Open in Cursor » avec prompt pré-rempli |
| **Prompt IA** | ✅ | **« Copy install prompt »**, prompts pré-remplis vers Cursor, Edit with AI sur les exemples |
| **GitHub** | ✅ | core open source + dépôt `ai-kit` |
| **Figma** | ❌ | |

## 8. Code
✅ Cœur TypeScript, tree-shakable, APIs « jusqu'à 90 % plus petites que leur équivalent GSAP » (revendiqué par l'éditeur). Exemple minimal vérifié :
```jsx
import { motion } from "motion/react"
<motion.button animate={{ opacity: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} />
```
Déclinaisons documentées : `initial`/`animate`, `whileInView` (scroll-triggered), `useScroll` (scroll-linked), `layout` (transitions de layout), `AnimatePresence` (sortie du DOM), `variants`/`stagger`, `useMotionValue`/`useTransform`, gestes (`hover`, `press`, `drag`), SVG, 3D.

## 9. Prompts IA — **le dispositif le plus complet de cet audit (§13, §25)**
| Élément | Gratuit | Motion+ |
| --- | --- | --- |
| Skill `/motion` (MIT) | ✅ | ✅ |
| Recherche dans la doc Motion | ✅ | ✅ |
| Installation en une commande (`npx motion-ai`) | ✅ | ✅ |
| Source de 460+ exemples premium + Motion UI | ❌ | ✅ |
| **Génération de courbes `linear()` (springs en CSS pur)** | ❌ | ✅ |
| **MotionScore for Agents** (audit code + profilage du site local) | ❌ | ✅ |
| **Éditeur de transitions** (dans le chat ou l'IDE, avec sauvegarde cloud) | ❌ | ✅ |

Agents ciblés nominativement : **Claude Code, Cursor, Amp, OpenCode, Gemini CLI, GitHub Copilot** (+ tout client MCP).
**Contenu typique d'un prompt fourni par Motion** (vérifié sur un exemple React) : consigne d'adapter à ton projet (*« Adapt according to project styles: e.g. if the project uses Tailwind, adapt styles to use Tailwind »*), installation des paquets manquants, mention de la dépendance `motion-plus` et lien vers la procédure d'accès, puis **le code source complet de l'exemple**.
**Peut-on le donner directement à une IA ? Oui — c'est conçu pour ça.** Capacité de reconstruction : **élevée**, puisque le prompt embarque le code.

## 10. CLI / installation (comportement réel)
```text
# 1) La bibliothèque
npm install motion            → import { motion } from "motion/react"

# 2) Le kit agent (gratuit)
npx motion-ai                 → installe le skill /motion (MIT) et câble le MCP
                              → dans Claude Code, Cursor, Amp, OpenCode, Gemini CLI, Copilot
                              → par projet ou globalement

# 3) L'éditeur visuel (Motion Studio)
npm install -D motion-studio  → plugin Vite/Next/Nuxt/Astro/Webpack (n'existe qu'en dev)
npx motion-studio serve       → serveur compagnon sur http://localhost:5200
        ↓ Pré-requis : Motion ≥ 13.3.0 et Node ≥ 22.13.0
        ↓ Gratuit : installation + édition visuelle
        ↓ Payant : agent « Ultramotion » et « Apply to code » (abonnement Motion Studio)
        ↓ Production : le code de Studio est exclu des builds de production

# 4) Motion UI (sections/composants)
installation via shadcn → tu conserves la source ; thème via motion.theme.ts (defineTheme :
   transitions snap/ui/gentle/lively/ambient, stagger tight/base/relaxed, travel hover/enter/section)
   + tokens shadcn existants (background, foreground, card, primary, radius, chart-1…5, sidebar…)
```

## 11. Personnalisation
- **APIs** : transitions, springs (y compris `bounce` négatif pour les ressorts sur-amortis, ajouté en 13.5.0), easing, durées, délais, stagger, variantes.
- **Motion UI** : thème central `motion.theme.ts` (transitions nommées, stagger, travel, **reducedMotion**), héritage des **design tokens** du projet (shadcn), adaptation aux CSS/Tailwind existants, **mode « reduced motion »** éditable dans Studio 2.2.
- **Avec un agent** : « Add a testimonial wall and match our brand » → l'agent cherche, installe, adapte aux tokens/typo/radius du projet.
- **Motion Studio** : timeline visuelle, édition par IA, application directe au code source.

## 12. Gratuit / Premium — **prix vérifiés le 5 octobre 2026**
| Offre | Prix | Contenu |
| --- | --- | --- |
| **Cœur Motion** | **Gratuit, MIT, open source** | React/Vue/JS, docs, exemples gratuits, skill `/motion` + MCP + recherche de doc |
| **Motion+ Solo** | **399 $ une fois** (licence Solo, mises à jour à vie) | 460+ exemples avec source, composants premium (Carousel, AnimateNumber, Ticker, Cursor, Typewriter, ScrambleText, Curtains), **Motion UI**, AI Kit complet, 110+ tutoriels, Discord privé, accès anticipé |
| **Motion+ Team** | **249 $ / siège / an** | Tout Motion+ + licence multi-utilisateurs + gestion des sièges + facture (ex. affiché : 5 sièges = 1 245 $/an HT) |
| **Motion Studio** | Gratuit à l'installation ; **abonnement Motion Studio** requis pour l'agent Ultramotion et « Apply to code » (prix non affiché sur la page docs ❓) | Éditeur visuel + agent d'édition |
| **CSS Studio** | Produit distinct (**https://cssstudio.ai/learn**) — tarification à vérifier ❓ | Édition visuelle du CSS du projet |
| **MotionScore** | Outil d'audit (**https://score.motion.dev/docs**) — offre gratuite/payante à vérifier ❓ | Détecte et corrige les problèmes de performance d'animation |

## 13. Licence
- **Cœur Motion : MIT, open source** — affirmé en page d'accueil : *« Free. Completely free to use, MIT licensed and open source. »* Usage commercial ✅.
- **Motion+ / Motion UI / Motion Studio / composants premium : licence commerciale** (Solo = 1 développeur ; Team = multi-utilisateurs, sièges transférables). Conditions détaillées = à lire dans les CGV du compte lors de l'achat ❓ (durée, transfert, usage client, revente).
- **Skill `/motion` : MIT** (mentionné explicitement sur la page AI Kit), source sur GitHub.
- **Attention** : « open source » chez Motion ne couvre **pas** les exemples premium ni les composants payants. Ne pas redistribuer le contenu Motion+.

## 14. Qualité des ressources
C'est le projet le plus **industrialisé** des cinq : moteur hybride (WAAPI + ScrollTimeline + repli JS), documentation structurée et versionnée, changelog public précis (**v14.0.0 le 1er octobre 2026**), écosystème d'outils (Studio, MotionScore, CSS Studio, vgpu), adoption massive (Framer, Figma ; **30 M+ téléchargements/mois** sur npm pour `framer-motion`). Réserves : une partie de la valeur (exemples, composants premium, options IA) est **derrière un paiement unique de 399 $**, et le rythme de publication (v13 → v14) implique de suivre les notes de version.

## 15. Cas d'utilisation
Micro-interactions de produit · transitions de page et de layout (listes qui se réordonnent, onglets, modales) · gestes (drag, swipe, hover, press) · scroll-triggered et scroll-linked · sections de landing page animées · carrousels et composants premium · interfaces réduites en motion (accessibilité) · animation de scènes Three.js/vgpu · génération de courbes CSS spring pur · audit de performance d'animation · workflows d'agents.

## 16. Limites
- **Verrouillage partiel** : les composants premium et Motion UI dépendent de Motion+ (399 $) — contrairement à React Bits/Shadcn où la source est à toi après achat, ici tu dépends du paquet `motion-plus` et d'un **token d'accès** (mentionné dans les prompts d'exemple).
- Paywall sur l'essentiel de la collection d'exemples (les plus complexes).
- Motion Studio : abonnement séparé, périmètre framework (Node ≥ 22.13, Next/Vite/Webpack/Nuxt/Astro).
- Écosystème dense = risque de confusion (Motion, Motion+, Motion UI, Motion Studio, MotionScore, CSS Studio, vgpu).
- Documentation majoritairement anglophone et technique ; la courbe est réelle pour les cas avancés (layout animations, motion values).

## 17. Ressources remarquables (URL directes)
| Ressource | URL | Pourquoi |
| --- | --- | --- |
| Docs React | https://motion.dev/docs/react | Point d'entrée principal |
| Docs JavaScript | https://motion.dev/docs/quick-start | Usage hors React |
| Docs Vue | https://motion.dev/docs/vue | motion-v |
| Scroll animations | https://motion.dev/docs/react-scroll-animations | Scroll-triggered + scroll-linked |
| Layout animations | https://motion.dev/docs/react-layout-animations | La fonctionnalité signature |
| AnimatePresence | https://motion.dev/docs/react-animate-presence | Sorties du DOM |
| Gestes | https://motion.dev/docs/react-gestures | hover, press, drag |
| Text animation | https://motion.dev/docs/text-animation | Split/scramble/typewriter |
| Three.js | https://motion.dev/docs/three · vgpu : https://motion.dev/docs/vgpu | 3D |
| AI Kit | https://motion.dev/ai-kit · install : https://motion.dev/docs/ai-kit-install | Agents |
| Motion UI (sections) | https://motion.dev/ui | 30 sections installables |
| Exemples | https://motion.dev/examples | 462 pages |
| MEGA MENU (exemple) | https://motion.dev/examples/react-mega-menu | Cas concret : navigation |
| Three.js TSL particle morph | https://motion.dev/examples/js-three-tsl | Cas 3D avancé (JS) |
| Vue Command Palette | https://motion.dev/examples/vue-command-palette | Cas Vue |
| MotionScore docs | https://score.motion.dev/docs | Performance |
| Comparaison GSAP vs Motion | https://motion.dev/docs/gsap-vs-motion | Aide au choix (parti pris éditeur) |

## 18. Alternatives
**Anime.js** (MIT, JS vanilla, plus léger, sans React), **GSAP** (moteur pro, timelines puissantes, licence à surveiller), **CSS natif** (`@keyframes`, transitions, `scroll-timeline`), **View Transitions API** (native, sans lib), **AutoAnimate** (transitions automatiques de listes), **react-spring**, **Lottie/Rive** (animations d'auteur), **Uiverse/React Bits** (composants, pas moteurs). Comparaisons détaillées §3.

## 19. Quand utiliser Motion ? (§23)
- Tu es en **React** (ou Vue) et tu veux des **transitions déclaratives** : c'est le meilleur compromis effort/qualité.
- Tu as besoin de **layout animations** (élément qui change de place/forme), de **gestes** natifs, ou de **sorties du DOM** élégantes.
- Tu veux **installer des sections animées** (Motion UI) plutôt que de les écrire.
- Tu veux que **ton agent écrive de bonnes animations** (AI Kit).
- **À éviter** si : tu veux zéro dépendance, tu es en JS vanilla sans build (→ Anime.js), ou tu ne veux rien payer alors que tu as besoin d'exemples complexes (Motion garde son cœur gratuit, mais l'essentiel des exemples avancés est payant).

## 20. Verdict
> **Tier S — le moteur d'animation de référence pour React/Vue.** Gratuit, MIT, production-ready, avec un écosystème d'outils et d'IA unique. Le paywall (399 $) concerne la **bibliothèque d'exemples/composants**, pas le moteur : décision à prendre en fonction de ton besoin d'accélération.

## À retenir
| Si je construis… | Utilité |
| --- | --- |
| Site vitrine | ⭐⭐⭐⭐ — reveals, parallax, transitions |
| Landing page | ⭐⭐⭐⭐⭐ — + Motion UI (30 sections) |
| SaaS | ⭐⭐⭐⭐⭐ — micro-interactions, layout animé, modales, toasts |
| PWA | ⭐⭐⭐⭐ — gestes natifs, `useReducedMotion` |
| Dashboard | ⭐⭐⭐ — transitions de listes/tables, sparkline |
| Expérience 3D | ⭐⭐⭐ — Three.js + vgpu documentés |
| Motion design | ⭐⭐⭐⭐⭐ — springs, layout, gestes, timeline, éditeur visuel |
| Avec une IA | ⭐⭐⭐⭐⭐ — AI Kit (skill + MCP + MotionScore + CSS springs) |

## Exemples d'utilisation (§31)
1. **« Je veux une landing page avec un hero animé »** → section `hero-editorial-stagger` ou `hero-parallax-layers` (Motion UI) + tokens du projet.
2. **« Je veux un menu méga-menu »** → https://motion.dev/examples/react-mega-menu ou section `nav-mega-menu`.
3. **« Je veux des toasts empilés »** → composant `overlay-toast-stack` / exemple `toast-stack`.
4. **« Je veux un carrousel performant »** → composant premium `Carousel` (Motion+) ou exemple `coverflow`.
5. **« Je veux que mon agent produise une animation correcte du premier coup »** → `npx motion-ai`, puis demander la transformation ; vérifier les dépendances (`motion-plus` nécessite un token) et les tokens de thème.

---

# 3. COMPARAISONS ET DUPLICATIONS (§46, §23, §24)

## 3.1 Motion vs Anime.js (les deux moteurs d'animation)

| Critère | **Motion** | **Anime.js** |
| --- | --- | --- |
| Environnement | React, Vue, JavaScript | JavaScript (frameworks via patterns manuels) |
| Installation | `npm install motion` | `npm install animejs` |
| API | Déclarative (composants/props) **+** impérative (JS) | Impérative uniquement |
| React | ✅ natif (`motion/react`) | 🟡 `useEffect` + `createScope` |
| Vue | ✅ (`motion-v`) | 🟡 manuel |
| Scroll | `useScroll` / `scroll()` — déclenché **et** lié, via ScrollTimeline | `onScroll()` — modes de synchronisation, seuils, callbacks |
| Layout animations | ✅ **point fort majeur** (`layout`, AnimatePresence) | 🟡 module `Layout` v4, pas de magie React |
| Gestes | ✅ hover, press, drag, focus intégrés | ✅ `createDraggable` (drag/snap/flick), pas de hover natif |
| Spring | ✅ (`bounce` y compris négatif) | ✅ `createSpring({stiffness, damping, bounce})` |
| Timeline | 🟡 via variants/stagger | ✅ **timeline de première classe** avec positions temporelles |
| SVG | ✅ animation SVG | ✅ **morphing, line drawing, motion path** (plus riche) |
| 3D | ✅ docs Three.js + vgpu | ✅ adaptateur Three.js + `registerAdapter()` |
| Performance | Moteur hybride WAAPI + ScrollTimeline, repli JS ; 120 fps revendiqué | Moteur JS propre, bundle 27 KB modulaire |
| Taille | APIs « jusqu'à 90 % plus petites que l'équivalent GSAP » (éditeur) | 27,13 KB au total, import par module |
| Simplicité | Très simple en React, conceptuel au-delà | Simple et homogène, verbeux en React |
| Licence | MIT (cœur) | **MIT (tout)** |
| Coût | Gratuit ; Motion+ 399 $ pour exemples/composants | **100 % gratuit** |
| Ressources IA | ✅ AI Kit (skill, MCP, MotionScore) | ❌ |
| Quand le choisir | Tu es en React/Vue, tu veux du layout animé et des gestes | Tu es en JS vanilla, tu veux du SVG/timeline fin et zéro dépendance |

> **Verdict de non-hiérarchie** : Motion gagne sur le confort en React/Vue et le layout ; Anime.js gagne sur l'indépendance, le poids, le SVG et le coût (tout est MIT). **Les deux peuvent cohabiter** (Anime.js pour un effet précis, Motion pour l'UI).

## 3.2 React Bits vs Motion UI vs Uiverse (les trois « catalogues » de composants animés)

| Critère | React Bits (gratuit) | Motion UI (Motion+) | Uiverse |
| --- | --- | --- | --- |
| Nature | Composants React animés | Sections + composants d'interface animés | Éléments CSS/Tailwind communautaires |
| Volume | **213 gratuits** (+194 en Pro) | 30 sections + 24 composants | Plusieurs milliers (compteurs fluctuants) |
| Framework | React uniquement | React (+ MCP pour adapter) | HTML/CSS, Tailwind, React (export) |
| Où ça vit | Ton projet (copie/CLI) | Ton projet (shadcn) | Ton projet (copie) |
| Thème | Props + éditeur visuel | `motion.theme.ts` + tokens shadcn | À la main |
| Qualité | Élevée, homogène | Très élevée, cohérente | Très variable |
| Accès | Gratuit (Pro 129–349 $) | Motion+ 399 $ | Gratuit (Pro/Pro+ pour l'IA) |
| IA | MCP + Copy for AI | AI Kit complet | MCP communautaire |
| Rôle | Effets visuels spectaculaires | Sections de pages complètes | Pièces détachées CSS |

## 3.3 Bklit UI vs alternatives data viz (duplications)

```text
Graphiques React
├── Bklit UI       → registre shadcn, source chez toi, 17 charts + primitives, Studio, MIT
├── Tremor         → copy-paste Tailwind, KPI/dashboards, orienté "produit"
├── shadcn charts  → base Recharts, officielle shadcn, simple mais limitée
├── Recharts       → package npm, très répandu, plafond de personnalisation
├── Nivo           → package npm, large variété, thème propre
├── visx           → primitives D3, tout à construire (le socle de Bklit)
├── ECharts        → moteur complet, non React-native
└── D3             → contrôle absolu, coût de développement maximal
```
**Différenciation de Bklit** : composition fine (axes/légende/tooltip/brush séparés), **charts rares** (Sankey, Sunburst, Choropleth, Candlestick, Live Line), loading states intégrés, rendu visx (pas le plafond de Recharts), **et** un Studio visuel. **Faiblesse** : pas de paquet npm, mainteneur unique, Studio propriétaire.

## 3.4 Anime.js ↔ React Bits (complémentarité involontaire)
React Bits s'appuie souvent sur GSAP ou WebGL pour ses composants ; Anime.js est l'alternative MIT si tu veux **réimplémenter** un effet sans GSAP. Inversement, React Bits te donne le **résultat** quand Anime.js te donne le **moyen**.

## 3.5 Ce qui est réellement dupliqué (à ne pas payer deux fois)
| Besoin | Doublons identifiés | Recommandation |
| --- | --- | --- |
| Hero animé de landing | React Bits (Pro hero blocks), Motion UI (4 hero sections), React Bits Pro templates | Choisir **un** système de thème dominant |
| Sections de landing (pricing, FAQ, footer) | React Bits Pro (22 catégories), Motion UI (sections) | Idem : éviter deux systèmes de tokens concurrents |
| Composant « command palette » | Motion (exemple + composant UI), React Bits Pro (Command Menu), shadcn (cmdk) | Le composant shadcn/cmdk natif reste la base la plus saine |
| Curseur personnalisé | React Bits (6 curseurs), Motion+ (Cursor) | React Bits en gratuit, Motion+ si déjà abonné |
| Spring/easing | Motion (spring natif), Anime.js (spring), CSS `linear()` (via AI Kit) | Utiliser les springs **CSS** quand c'est possible (zéro JS) |
| Graphiques | Bklit UI, Tremor, Recharts, shadcn charts | Bklit si composabilité, Tremor si vitesse, Recharts si standard |

---

# 4. RESSOURCES POUR AGENTS IA (§25)

| Nom | Plateforme | Agent ciblé | Format | Installation | Contenu | Intégrable à ton système d'agents ? | Conditions | Valeur pratique |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Serveur MCP React Bits** | React Bits | Claude Code, Cursor, VS Code (+ tout client MCP) | MCP via serveur shadcn | `npx shadcn@latest mcp init --client claude` + registre `@react-bits` | Recherche/installation de composants par langage naturel | ✅ oui | Gratuit | ⭐⭐⭐⭐⭐ |
| **Copy for AI** | React Bits | Toute IA (chat/IDE) | Copie presse-papiers | 1 clic sur la fiche | Contexte de la ressource (contenu exact à vérifier en local ❓) | ✅ oui | Gratuit | ⭐⭐⭐ |
| **React Bits Pro Skill** | React Bits Pro | Claude Code, Cursor, v0, Bolt.new, Lovable, Replit | SKILL.md | Avec la licence (tiers Starter inclus) | Mécanique d'installation/composition correctes | ✅ oui | Payant (dès 129 $) | ⭐⭐⭐⭐ |
| **Agent Kit** | React Bits Pro | Idem | 8 skills + 8 prompts + 3 recipes + 1 setup | Idem (tiers Pro) | **Jugement de design** + pages complètes | ✅ oui | Payant (dès 249 $) | ⭐⭐⭐⭐ |
| **Motion AI Kit — gratuit** | Motion | Claude Code, Cursor, Amp, OpenCode, Gemini CLI, Copilot | Skill `/motion` (MIT) + MCP | `npx motion-ai` | Bonnes pratiques + **recherche dans la doc Motion à jour** | ✅ oui | Gratuit, **MIT** | ⭐⭐⭐⭐⭐ |
| **Motion AI Kit — Motion+** | Motion | Idem | MCP + outils | Même install + compte Motion+ | Source de 460+ exemples, **MotionScore** (audit de perf), **génération de springs CSS**, éditeur de transitions | ✅ oui | Payant (399 $) | ⭐⭐⭐⭐⭐ |
| **MotionScore for Agents** | Motion | Idem | MCP/CLI | Via AI Kit | Analyse code + site local, notes et correctifs | ✅ oui | Motion+ | ⭐⭐⭐⭐ |
| **Skill Bklit UI** | Bklit (communautaire) | Claude Code et autres | SKILL.md | Référencé par annuaires d'agents | Règles : installer avant d'inventer, composer, thématiser par tokens | ✅ oui | Gratuit ❓ (source à vérifier) | ⭐⭐⭐ |
| **Uiverse Design Systems** | Uiverse | Claude Code, Cursor, Codex (+10) | Fichiers de design system à injecter | Achat + dépôt dans le codebase | Palettes, typo, composants, règles d'usage | ✅ oui | Payant 9,99–14,99 $ / système | ⭐⭐⭐ |
| **uiverse-mcp** | Uiverse (tiers) | Claude Code, Cursor, Windsurf, Cline | MCP serveur Node | `npx -y uiverse-mcp` | Clone `galaxy`, indexe ~3 800 composants, renvoie HTML+CSS | ✅ oui | Gratuit, Apache-2.0 | ⭐⭐⭐ |
| **Anime.js** | Anime.js | — | — | — | **Aucune ressource IA officielle** | ❌ | — | ⭐ |

**Lecture stratégique** : sur les 5 plateformes, **3 ont une stratégie agentique officielle** (React Bits, Motion, Uiverse via Design), **1 a un skill communautaire** (Bklit), **1 n'en a aucune** (Anime.js). Si ton workflow est agentique, anime.js doit être **encadré par toi** (ou précédé d'un extrait de doc collé dans le contexte).

---

# 5. MATRICES (§15 à §19)

## 5.1 Matrice de compatibilité technologique (§17)
| Ressource | HTML/CSS | Tailwind | React | Vue | JS | shadcn | 3D | Autre |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| React Bits (gratuit) | 🟡 (variante CSS) | ✅ | ✅ | ❌ (ports officiels : vue-bits.dev) | 🟡 | ✅ (CLI/registry) | ✅ (fonds shader/WebGL) | Svelte : sveltebits.xyz |
| React Bits Pro | ✅ (CSS vanilla) | ✅ | ✅ | ❌ | 🟡 | ✅ | ✅ (30 composants 3D/shaders) | Next.js 16 / React 19 |
| Uiverse | ✅ | ✅ | ✅ (export) | 🟡 (HTML/CSS portable) | 🟡 | ❌ | 🟡 | Figma |
| Anime.js | ✅ | n/a | 🟡 (manuel) | 🟡 (manuel) | ✅ natif | ❌ | ✅ (adaptateur Three.js) | SVG, WAAPI, Canvas via adaptateurs |
| Bklit UI | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ **requis** | 🟡 (choropleth/geo) | visx/D3, motion/react |
| Motion | ✅ | ✅ | ✅ | ✅ (motion-v) | ✅ | ✅ (Motion UI) | ✅ (Three.js, vgpu) | Next/Vite/Nuxt/Astro/Webpack (Studio) |

## 5.2 Matrice de récupération (§18)
| Plateforme | Code | Prompt IA | CLI | npm | GitHub | Download | Preview | Figma |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| React Bits (gratuit) | ✅ | ✅ (Copy for AI + MCP) | ✅ (shadcn, jsrepo) | ❌ | ✅ | 🟡 (fichiers via CLI) | ✅ live | ❌ |
| React Bits Pro | ✅ | ✅ (Agent Kit) | ✅ (shadcn, registry à clé) | ❌ | ❌ (payant) | 🟡 | ✅ live | ❌ |
| Uiverse | ✅ | ❌ officiel (🟡 MCP tiers) | ❌ | ❌ | ✅ (miroir `galaxy`) | ❌ | ✅ live | ✅ (compte) |
| Anime.js | ✅ (source) | ❌ | ❌ | ✅ | ✅ | ✅ (dist) | ✅ (démos doc) | ❌ |
| Bklit UI | ✅ (source) | 🟡 (skill communautaire) | ✅ (shadcn) | ❌ | ✅ | 🟡 | ✅ live + Studio | ❌ |
| Motion | ✅ | ✅ (AI Kit) | ✅ (`npx motion-ai`, `motion-studio`) | ✅ | ✅ | 🟡 | ✅ live | ❌ |

## 5.3 Matrice de tarification (§19)
| Plateforme | Gratuit | Freemium | Premium | Open Source | Limites du gratuit (précisées) |
| --- | --- | --- | --- | --- | --- |
| React Bits | ✅ | 🟡 | ✅ 129/249/349 $ | ✅ MIT + Commons Clause | Gratuit : **213 composants + outils + MCP + usage commercial**. Limite : effet isolé (pas de blocs/app UI/templates) ; pas de mises à jour automatiques ; interdiction de revendre les composants |
| Uiverse | ✅ | ✅ | ✅ 4,99 $/mois · 19,99 $/mois · 9,99–14,99 $/système | ✅ MIT (code) | Gratuit : **tous les éléments, export HTML/CSS/Tailwind/React, usage commercial**. Payant : IA (Edit/Variations), jetons, design systems, fonds personnalisés, badge |
| Anime.js | ✅ **tout** | ❌ | ❌ | ✅ MIT | Aucune limite : pas de compte, pas de quota, pas de version payante |
| Bklit UI | ✅ composants | 🟡 | ❓ Studio | ✅ MIT (charts) / ❌ (Studio propriétaire) | Gratuit : **17 charts + primitives + exemples + blocs + CLI**, usage commercial. Réserves : pas de paquet npm, Studio non réutilisable, modèle économique du Studio non publié |
| Motion | ✅ cœur + AI Kit gratuit | 🟡 | ✅ 399 $ une fois · 249 $/siège/an · Studio (abonnement) | ✅ MIT (cœur + skill) | Gratuit : **moteur complet, docs, skill `/motion`, MCP, recherche doc**. Payant : 460+ exemples, composants premium, Motion UI, MotionScore, springs CSS, éditeur de transitions, tutoriels, Discord |

## 5.4 Capacité « Copy Code » (§12)
| Plateforme | Ce qui est récupéré | Format | Framework | Dépendances | Étapes | Niveau de modification nécessaire | Licence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| React Bits | Composant complet (source) | JS ou TS + CSS ou Tailwind | React | Listées par fiche (ex. `gsap`) | 1) choisir stack 2) copier ou CLI 3) `npm install <deps>` | **Faible** (props) à moyen (intégration) | MIT + Commons Clause |
| Uiverse | HTML + CSS (ou classes Tailwind / export React) | CSS / Tailwind / JSX | Tout | Aucune | Copier-coller | **Moyen** (nettoyage, accessibilité, responsive) | MIT |
| Bklit UI | Source du chart + primitives | TS/TSX + Tailwind | React + shadcn | npm + registryDependencies | `shadcn add @bklit/<nom>` | **Faible à moyen** | MIT |
| Motion UI | Section/composant complet | TSX + thème | React + shadcn | `motion` (et `motion-plus` pour le premium) | Install shadcn + thème | **Faible** | Commerciale (Motion+) |
| Motion (exemples) | Exemple complet | JSX/JS/Vue | React/JS/Vue | `motion`, parfois `motion-plus` | copier ou « Open in Cursor » | **Faible** | MIT (gratuit) / Motion+ (payant) |
| Anime.js | Snippets de doc | JS | JS | Aucune | Copier puis adapter sélecteurs/valeurs | **Moyen** (tu écris la logique) | MIT |

## 5.5 Capacité « Copy for AI » (§13) — synthèse
| Question | React Bits | Motion | Bklit | Uiverse | Anime.js |
| --- | --- | --- | --- | --- | --- |
| Bouton/prompt IA officiel ? | ✅ « Copy for AI » + MCP | ✅ AI Kit + prompts pré-remplis | 🟡 skill communautaire | ❌ (MCP tiers) | ❌ |
| Le prompt contient-il le code source ? | 🟡 (la fiche expose le composant ; contenu exact à vérifier ❓) | ✅ **oui** (exemples avec source) | 🟡 (exemples installables = équivalent) | n/a | n/a |
| Reconstruire la ressource par l'IA ? | Moyen (simple) → Élevé (avec MCP, qui *installe*) | **Élevé** | Élevé (l'agent installe via registry) | Élevé (via MCP tiers) | **Faible** |
| Agents supportés | Claude Code, Cursor, VS Code, v0, Bolt/Lovable/Replit (Pro) | Claude Code, Cursor, Amp, OpenCode, Gemini CLI, Copilot | Claude Code & MCP-compatibles | Claude Code, Cursor, Windsurf, Cline | — |
| Contexte à ajouter après génération | props, dépendances, thème | tokens de thème, `motion-plus` | `chartCssVars`, composition | accessibilité, responsive | version v4 vs v3 |

## 5.6 Installation — résumé des commandes (§14, §40)
| Commande | Plateforme | Ce qu'elle fait | Pré-requis | Coût / compte |
| --- | --- | --- | --- | --- |
| `npx shadcn@latest add @react-bits/BlurText-TS-TW` | React Bits | télécharge le source, installe les deps, écrit dans `components/` | React + shadcn + registre `@react-bits` dans `components.json` | Gratuit, sans compte |
| `npx shadcn@latest mcp init --client claude` | React Bits (MCP) | installe le serveur MCP shadcn dans le client | un client MCP | Gratuit |
| `npx shadcn@latest add @bklit/area-chart` | Bklit UI | idem, avec `registryDependencies` (axes, tooltip…) | React + shadcn + registre `@bklit` | Gratuit, sans compte |
| `npm install motion` | Motion | installe le moteur | Node/npm | Gratuit, MIT |
| `npx motion-ai` | Motion AI Kit | installe le skill `/motion` + câble le MCP (Claude Code, Cursor, Amp, OpenCode, Gemini CLI, Copilot) | Node | Gratuit pour la partie skill/docs |
| `npm install -D motion-studio` + `npx motion-studio serve` | Motion Studio | timeline visuelle sur **ton** site en dev | Motion ≥ 13.3.0, Node ≥ 22.13.0 | Gratuit à l'install ; agent/Apply = abonnement |
| `npm install animejs` | Anime.js | installe le moteur (ESM/UMD) | bundler ou CDN | Gratuit, MIT, sans compte |
| *(Uiverse)* — | — | **aucune commande** : copier-coller seulement | — | — |

## 5.7 Customisation — qui permet quoi (§15)
| Capacité | React Bits | Pro | Uiverse | Anime.js | Bklit | Motion |
| --- | --- | --- | --- | --- | --- | --- |
| Props typées | ✅ | ✅ | ❌ | ✅ (objet de paramètres) | ✅ | ✅ |
| Éditeur/configurateur visuel | ✅ (panneau par composant) | ✅ (thème live) | 🟡 (IA payante) | ❌ (démo doc) | ✅ (Studio) | ✅ (Motion Studio) |
| Couleurs/thème global | 🟡 | ✅ (accent/base/font/radius) | ❌ | n/a | ✅ (`--chart-*`) | ✅ (`motion.theme.ts` + tokens) |
| Animation/vitesse/easing | ✅ | ✅ | 🟡 | ✅ complet | ✅ (animate) | ✅ complet |
| Responsive | ✅ (à tester) | ✅ (320px→4K) | ❌ | ✅ (`createScope` media queries) | ✅ | ✅ |
| Paramètres 3D | ✅ (composants 3D) | ✅ | ❌ | ✅ (adaptateur) | 🟡 | ✅ (Three.js/vgpu) |
| Données | 🟡 | 🟡 | ❌ | n/a | ✅ (data props, thème de données) | n/a |
| Données/`reduced motion` | 🟡 | 🟡 | ❌ | 🟡 (manuel) | 🟡 | ✅ (mode dédié dans Studio) |

---

# 6. CLASSIFICATION PAR BESOIN DE PROJET (§16) ET PAR PHASE (§27)

## 6.1 Par besoin fonctionnel
| Besoin | Réponses de l'audit (avec URL) |
| --- | --- |
| **LANDING / hero** | React Bits `Aurora`, `Beams`, `DotField`, `BlurText`, `SplitText` · Motion UI https://motion.dev/ui/sections/react-hero-editorial-stagger · React Bits Pro https://pro.reactbits.dev/docs/blocks/hero-section |
| **LANDING / CTA, pricing, FAQ, footer** | React Bits Pro (22 catégories) ; Motion UI (pricing-sections, faq-sections, footers, cta-sections) |
| **NAVIGATION** | React Bits `CardNav`, `GooeyNav`, `PillNav`, `BubbleMenu`, `LineSidebar`, `Dock` · Motion UI `nav-mega-menu` / `nav-command-palette` · Motion exemple mega-menu |
| **INTERACTION (hover, click, drag, cursor, gestures)** | React Bits (6 curseurs + Micro) · **Motion (gestes natifs)** · **Anime.js (`createDraggable`)** · Uiverse (tag `hover effect`) |
| **MOTION (reveal, scroll, parallax, texte, transitions, spring, stagger)** | Motion (layout + scroll + springs) · Anime.js (timeline + scroll + stagger) · React Bits (33 text animations + 40 animations) · Motion UI (split-reveal, scroll-spotlight) |
| **UI de base (buttons, cards, inputs, forms, modals, tooltips, loaders)** | Uiverse (volume) · React Bits `Components` + `Micro` · Motion UI components (accordion, sheet, overlay, progress) · React Bits Pro app UI |
| **DASHBOARD (KPI, charts, tables, filtres, analytics, maps)** | **Bklit UI** (stats cards, 17 charts) · React Bits Pro `Dashboard`, `Analytics`, `Data Table`, `Monitoring` |
| **DATA VIZ (line, bar, area, pie, radar, scatter, heatmap, sankey, funnel, gauge, choropleth)** | Bklit UI — **les 11 types demandés sont couverts** (voir §6 de la fiche 2.5) |
| **3D / CREATIVE WEB (WebGL, shaders, particules, objets, scènes, distorsion)** | React Bits (59 backgrounds + `Ballpit`, `Lanyard`, `ModelViewer`, `PixelTrail`) · React Bits Pro (30 composants 3D & shaders + templates WebGL) · Motion (Three.js, vgpu) · Anime.js (adaptateur Three.js) |
| **AI PRODUCTS (prompt input, chat, sélecteur de modèle, activité d'agent, command palette, dashboard IA)** | React Bits Pro app UI : `AI Chat`, `Prompt Input`, `Agent Activity`, `Agent Approval`, `Agent Plan`, `Tool Calls`, `AI Usage`, `Command Menu` · Motion UI `command-palette` |
| **FULL PRODUCT (SaaS, app shell, settings, auth, templates)** | React Bits Pro (15 templates, `App Shell`, `Authentication`, `Billing`, `Settings Form`) · React Bits gratuit ❌ (pas d'app UI) · Motion UI (sections, pas un shell) |

## 6.2 Par phase de projet
| Phase | Ressources de l'audit | Ressources associées (§10) |
| --- | --- | --- |
| **1. Inspiration** | React Bits (démos), Uiverse (galerie), Bklit (charts showcase), Motion (462 exemples) | Land-book, Awwwards, Godly, Mobbin, Dribbble, SiteInspire |
| **2. Design** | Uiverse (+ Uiverse Design payant), Bklit (tokens `--chart-*`), React Bits Pro (design skills) | shadcn/ui, Tailwind Plus, Figma, Uiverse Design |
| **3. Prototypage** | React Bits Pro (blocs + Builder bêta), Motion UI (sections), Bklit Studio | v0, Lovable, Bolt.new, Framer |
| **4. Développement** | React Bits (+ Pro), Uiverse, Bklit, Motion (moteur) | shadcn/ui, jsrepo, registres npm |
| **5. Motion** | **Motion**, **Anime.js**, React Bits (50+ animations), Motion UI | GSAP, View Transitions API, Rive, Lottie |
| **6. Data** | **Bklit UI**, Motion (sparkline) | Tremor, Recharts, Nivo, visx, ECharts |
| **7. 3D / Creative** | React Bits (backgrounds 3D), React Bits Pro (3D & Shaders), Motion (Three.js/vgpu), Anime.js (adaptateur) | Three.js, React Three Fiber, vgpu, Spline, post-processing (bloom) |
| **8. IA** | Motion AI Kit, React Bits MCP/Copy for AI/Pro Agent Kit, Uiverse Design, skill Bklit, uiverse-mcp | MCP (shadcn), Claude Code, Cursor, Copilot, Codex |
| **9. Production** | MotionScore (audit perf), `reducedMotion` (Motion), shadcn/a11y (à faire toi-même) | Lighthouse, WebPageTest, axe, Bundlephobia |

---

# 7. RESOURCE DECISION MATRIX (§28)

**Version lisible ici, version exploitable dans `matrice-decision.csv`.**

| Besoin | Ressource recommandée | Alternatives | Code | Gratuit | Framework | Niveau |
| --- | --- | --- | --- | --- | --- | --- |
| Hero animé | **React Bits** (`Aurora`/`Beams` + `BlurText`) | React Bits Pro hero blocks, Motion UI hero, Uiverse (fond CSS) | ✅ | ✅ | React | Débutant |
| Bouton avancé | **React Bits `Micro`** (`FuseButton`, `SpecularButton`) | Uiverse (tag button), Motion UI buttons, Motion `multi-state-button` | ✅ | ✅ | React / CSS | Débutant |
| Footer | **React Bits Pro** (`footer` blocks) | Motion UI `footer-newsletter`/`footer-sticky-reveal` | ✅ | 💰 | React/Next | Débutant |
| Dashboard | **Bklit UI** (`stat-card-*`, charts) + **React Bits Pro** (`Dashboard`, `Data Table`) | Tremor, shadcn charts, Recharts | ✅ | ✅ / 💰 | React + shadcn | Intermédiaire |
| Graphique (quelconque) | **Bklit UI** (17 types) | Tremor, Nivo, Recharts, ECharts, visx | ✅ | ✅ | React | Intermédiaire |
| Graphique rare (Sankey, Sunburst, Choropleth) | **Bklit UI** | Nivo, ECharts, D3 | ✅ | ✅ | React | Avancé |
| Animation de texte | **React Bits** (33 text animations) | React Bits Pro (11), Motion (typewriter/scramble/split), Anime.js (module Text) | ✅ | ✅ | React / JS | Débutant |
| Effet de curseur | **React Bits** (6 curseurs) | Motion+ `Cursor` | ✅ | ✅ / 💰 | React | Débutant |
| Scroll animation | **Motion** (`useScroll`, `whileInView`) | Anime.js `onScroll`, React Bits (scroll-*), GSAP ScrollTrigger | ✅ | ✅ | React/JS/Vue | Intermédiaire |
| Micro-interaction | **React Bits `Micro`** (34) | Uiverse, Motion (gestes), Motion UI buttons | ✅ | ✅ | React | Débutant |
| Composant 3D / scène WebGL | **React Bits** (backgrounds) → **Pro** (3D & Shaders) | Motion (Three.js/vgpu), Anime.js (adaptateur Three.js) | ✅ | ✅ / 💰 | React / JS | Avancé |
| SaaS shell (app UI) | **React Bits Pro** (`App Shell`) | shadcn/ui + Tailwind, Motion UI sections | ✅ | 💰 | Next/React | Intermédiaire |
| Interface IA (chat, prompt, agent) | **React Bits Pro** (`AI Chat`, `Prompt Input`, `Agent Activity`) | Vercel AI SDK + shadcn, Motion UI command palette | ✅ | 💰 | Next/React | Intermédiaire |
| Template complet | **React Bits Pro** (15 templates) | Tailwind Plus, shadcn templates, Framer templates | ✅ | 💰 | Next.js | Intermédiaire |
| Inspiration / référence visuelle | **React Bits + Motion examples + Uiverse** | Land-book, Awwwards, Mobbin, Godly, Dribbble | ❌ (inspiration) | ✅ | — | Débutant |
| Composant HTML/CSS pur | **Uiverse** | HyperUI, Flowbite, daisyUI | ✅ | ✅ | HTML/CSS/Tailwind | Débutant |
| Animation SVG (morphing, tracé) | **Anime.js** (module SVG) | GSAP, Motion (SVG), SVGator | ✅ | ✅ | JS | Avancé |
| Drag & drop interactif | **Anime.js `createDraggable`** | Motion (drag), dnd-kit (logique) | ✅ | ✅ | JS / React | Intermédiaire |
| Agent IA qui installe les composants | **Motion AI Kit** + **MCP shadcn (React Bits/Bklit)** | uiverse-mcp, React Bits Pro Agent Kit | ✅ | ✅ / 💰 | — | Intermédiaire |
| Audit de performance d'animation | **MotionScore** | Lighthouse, Chrome DevTools Performance | ✅ | 💰 (Motion+) | — | Avancé |

---

# 8. RAPPORT TRANSVERSAL (§33) ET TABLEAU DE SYNTHÈSE (§34)

## A. Les meilleures plateformes pour l'UI
1. **Uiverse** (volume, HTML/CSS/Tailwind, gratuit) — pour les pièces détachées.
2. **React Bits** (UI créative React, cohérence, props documentées).
3. **React Bits Pro** (app UI : shell, tables, settings, auth).

## B. Les meilleures plateformes pour les animations
1. **Motion** (déclaratif, layout, gestes, springs) — cœur gratuit.
2. **Anime.js** (MIT, JS pur, timeline, SVG) — tout gratuit.
3. **React Bits** (composants animés prêts à l'emploi).

## C. Les meilleures plateformes pour le motion design
1. **Motion** (+ Motion Studio pour éditer la timeline dans le navigateur, + MotionScore pour la perf).
2. **Anime.js** (contrôle total, easing, timeline, stagger, draggable).
3. **React Bits Pro** (effets prêts, mais tu *consommes* plus que tu ne *composes*).

## D. Les meilleures plateformes pour les dashboards
1. **Bklit UI** (charts composables, stats cards, loading states).
2. **React Bits Pro** (`Dashboard`, `Analytics`, `Monitoring`, `Data Table`, `Filtering`).
3. Motion (sparkline, transitions de listes) — complément, pas une réponse.

## E. Les meilleures plateformes pour la data visualization
1. **Bklit UI** (17 types dont Sankey, Sunburst, Choropleth, Candlestick, Live Line + primitives).
2. Tremor / Nivo / visx (hors périmètre, découvertes indirectes).
3. Uiverse/React Bits : **non pertinents** pour la data viz (à ne pas chercher là).

## F. Les meilleures plateformes pour les composants React
1. **React Bits** (213 gratuits + Pro 194/280/300).
2. **Bklit UI** (charts React/shadcn).
3. **Motion UI** (sections React animées).

## G. Les meilleures plateformes pour HTML/CSS
1. **Uiverse** — seule plateforme réellement HTML/CSS de l'audit.
2. React Bits (variante CSS **mais** pour React).
3. Anime.js (animations DOM sans framework).

## H. Les meilleures plateformes pour Tailwind
1. **React Bits** (variantes `-TW` officielles, CLI shadcn).
2. **Bklit UI** (Tailwind natif + tokens).
3. **Uiverse** (éléments Tailwind communautaires, qualité variable) et **Motion UI** (Tailwind/shadcn).

## I. Les meilleures plateformes pour 3D / WebGL
1. **React Bits / React Bits Pro** (fonds shader, 3D & shaders, ballpit, model viewer, templates WebGL).
2. **Motion** (Three.js + vgpu documentés).
3. **Anime.js** (adaptateur Three.js pour animer des objets 3D).

## J. Les meilleures plateformes pour les templates
1. **React Bits Pro** (15 templates Next.js nommés et décrits).
2. Motion UI (sections, pas de template complet) · shadcn blocks (indirect).
3. Uiverse/Anime.js/Bklit : **aucun template de produit**.

## K. Les meilleures plateformes pour l'inspiration
1. **Motion examples** (462 pages avec source → inspiration *exécutable*).
2. **React Bits** (démos très esthétiques) et **Uiverse** (volume d'idées CSS).
3. Bklit (showcases de charts « design engineered »).

## L. Les meilleures plateformes pour les agents IA
1. **Motion AI Kit** (skill MIT + MCP + MotionScore + springs CSS).
2. **React Bits** (MCP officiel + Copy for AI ; Agent Kit en Pro).
3. **Bklit UI** (structure registry idéale pour un agent shadcn) · **Uiverse** via MCP tiers.

## M. Les meilleures plateformes gratuites
1. **Anime.js** (100 % gratuit, MIT, aucune limite).
2. **Uiverse** (des milliers d'éléments, MIT).
3. **React Bits** (213 composants + outils + MCP, usage commercial autorisé) et **Bklit UI** (17 charts MIT) et **Motion** (moteur entier MIT).

## N. Les meilleures plateformes open source
1. **Anime.js** (MIT intégral) · **Uiverse/galaxy** (MIT) · **Motion** (cœur MIT, skill MIT) · **Bklit** (charts MIT).
2. **React Bits** : open source **avec Commons Clause** (open source « à restriction »).
3. Attention : Uiverse Design, React Bits Pro, Motion+, Motion UI, Bklit Studio = **propriétaires**.

## O. Les meilleures plateformes premium (si tu paies)
| Rang | Offre | Prix | Valeur |
| --- | --- | --- | --- |
| 1 | **React Bits Pro** (Pro/Ultimate) | 249 $ / 349 $ une fois | Blocs + app UI + templates + Agent Kit, source possédée à vie |
| 2 | **Motion+ Solo** | 399 $ une fois | 460+ exemples sourcés, composants premium, Motion UI, AI Kit complet |
| 3 | **Uiverse Design** | 9,99–14,99 $ / système | Contexte de design pour agents (achat à l'unité, peu risqué) |
| 4 | Motion Studio / Uiverse Pro+ | abonnement | Édition visuelle d'animation / IA illimitée — utilité plus étroite |

## 8.1 TABLEAU DE SYNTHÈSE FINAL (§34)
| Plateforme | Type | UI | Motion | 3D | Data | Templates | Code | Prompt IA | CLI | Gratuit | Premium |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **React Bits** | Composants React animés | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ (213) | ✅ 129–349 $ |
| **Uiverse** | Éléments UI open source CSS/Tailwind | ✅ | 🟡 | 🟡 | ❌ | ❌ | ✅ | ❌ (tiers) | ❌ | ✅ | ✅ 4,99–19,99 $/mois + 9,99–14,99 $ |
| **Anime.js** | Moteur d'animation JS | ❌ | ✅ | 🟡 | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ total | ❌ |
| **Bklit UI** | Charts & data viz (registre shadcn) | 🟡 | 🟡 | 🟡 | ✅✅ | ❌ | ✅ | 🟡 | ✅ | ✅ (MIT) | 🟡 Studio (propriétaire) |
| **Motion** | Bibliothèque d'animation + écosystème | 🟡 | ✅✅ | ✅ | 🟡 | 🟡 | ✅ | ✅✅ | ✅ | ✅ (MIT) | ✅ 399 $ / 249 $ |

---

# 9. CLASSEMENT PAR VALEUR POUR TON WORKFLOW (§29)

## Tier S — ressources essentielles (à installer/configurer aujourd'hui)
| Ressource | Justification (fondée sur les capacités vérifiées) |
| --- | --- |
| **React Bits (gratuit)** | 213 composants vérifiés, tous avec URL valides, props documentées, éditeur visuel, 4 variantes, CLI shadcn, MCP → effet visuel maximal pour un coût nul en React |
| **Motion (cœur)** | Moteur MIT, layout + gestes + scroll + springs, documentation de référence, **30 M+ téléchargements/mois** de `framer-motion` sur npm, et un AI Kit gratuit unique |
| **Bklit UI** *si projet dashboard* | 17 charts + primitives composables, installés en source, MIT — le chaînon manquant des SaaS shadcn |

## Tier A — très utiles (usage régulier)
| Ressource | Justification |
| --- | --- |
| **Uiverse** | Volume et gratuité pour tout besoin CSS/Tailwind hors React ; MIT ; MCP tiers ; mais qualité variable → usage ciblé |
| **Anime.js** | MIT strict, léger, SVG/scroll/timeline excellent, indispensable hors React |
| **Motion AI Kit (gratuit)** | `npx motion-ai` : skill MIT + MCP : gain direct sur la qualité des animations générées |
| **React Bits Pro (Pro/Ultimate)** | Si tu livres du Next.js/React : 280 blocs + 300 app UI + 15 templates + Agent Kit, paiement unique |

## Tier B — utiles selon projet (spécialisées)
| Ressource | Quand |
| --- | --- |
| **Bklit Studio** | Quand tu veux dessiner le chart avant de coder (mais propriétaire, pas de réutilisation) |
| **Motion+ (exemples/tutoriels)** | Quand tu veux apprendre en disséquant 460 exemples sourcés |
| **Uiverse Pro/Pro+ (IA)** | Quand tu génères beaucoup de variations d'éléments |
| **Uiverse Design** | Quand tu veux « dé-slopper » des interfaces générées par IA |
| **Motion Studio** | Quand tu veux éditer la timeline dans le navigateur et appliquer au code |

## Tier C — inspiration / niche (occasionnel)
| Ressource | Usage |
| --- | --- |
| **Exemples Motion « showcase »** (Ocarina watercolour, Majora's Mask, fractal topography…) | Inspiration 3D avancée, rarement transposable directement |
| **Uiverse éléments très stylisés** (neumorphisme, glass, 3D CSS) | Accents visuels ponctuels |
| **React Bits Pro templates « 8 Bit », « Shader », « Wireframe »** | Directions artistiques de niche |
| **Skill Bklit communautaire** | Si tu outilles ton agent sur les charts |

**Principe appliqué** : aucune plateforme n'est placée haut « parce qu'elle est populaire ». Le classement suit **trois critères vérifiables** : (1) ressources réellement récupérables, (2) licence utilisable en production, (3) polyvalence dans ton workflow.

---

# 10. ÉCOSYSTÈME ASSOCIÉ ET DÉCOUVERTES INDIRECTES (§45, §4)

## 10.1 Découvertes issues de React Bits
| Nom | Lien | Relation | Utilité | Pourquoi c'est intéressant |
| --- | --- | --- | --- | --- |
| **Vue Bits** (port officiel) | https://vue-bits.dev/ | Port officiel React Bits → Vue | Les mêmes effets en Vue | Évite de réimplémenter si tu passes à Vue |
| **Svelte Bits** (port officiel) | https://sveltebits.xyz/ | Port officiel → Svelte | Idem en Svelte | Idem |
| **shadcn/ui** | https://ui.shadcn.com/ | Socle CLI/registry | Standard de distribution des composants | Le « protocole » qui unifie React Bits, Bklit, Motion UI |
| **shadcn MCP** | https://ui.shadcn.com/docs/mcp | Serveur MCP | Fait installer des composants par un agent | Brique IA commune |
| **jsrepo** | https://jsrepo.dev | CLI alternative de distribution | Installation par registre | Utile pour tes propres registres |
| **shadcnblocks** | https://www.shadcnblocks.com/ | Sponsor Diamond de React Bits | Blocs comerciaux shadcn | Alternative à React Bits Pro pour les blocs |
| **shadcncraft** | https://shadcncraft.com/ | Sponsor | Composants/thèmes shadcn | Idem |
| **shadcn UI Kit** | https://shadcnuikit.com/ | Sponsor | Templates & blocs | Idem |
| **shadcn Studio** | https://shadcnstudio.com/ | Sponsor (et sponsor de Bklit) | Générateur/thèmes shadcn | Idem |
| **MCP (spec)** | https://modelcontextprotocol.io/ | Standard | Connexion IA ↔ outils | Socle de l'outillage agent |
| **GSAP** | (dépendance de composants) | Dépendance déclarée | Moteur d'animation | Choix alternatif à Anime.js/Motion |

## 10.2 Découvertes issues de Bklit UI
| Nom | Lien | Relation | Utilité |
| --- | --- | --- | --- |
| **visx** | https://airbnb.io/visx/ | Socle de rendu de Bklit (D3) | Composer tes propres charts si le catalogue ne suffit pas |
| **shadcn/ui** | https://ui.shadcn.com/ | **Prérequis obligatoire** | Sans shadcn, pas de Bklit |
| **motion/react** | https://motion.dev/ | Couche d'animation des charts | Cohérence avec la stack Motion |
| **Vercel OSS Program** | https://vercel.com/oss | Programme de soutien | Signal de qualité/maintenance |
| **Discord Bklit** | https://discord.gg/75s4frfE8X | Communauté | Support, feuille de route |
| **UI Rules** / **shadcn studio** | https://uirules.com · https://shadcnstudio.com | Sponsors | Ressources shadcn complémentaires |

## 10.3 Découvertes issues de Motion
| Nom | Lien | Relation | Utilité |
| --- | --- | --- | --- |
| **Motion AI Kit** | https://motion.dev/ai-kit | Produit officiel | Contexte + outils IA |
| **motion-ai (GitHub)** | https://github.com/motiondivision/ai-kit | Dépôt du skill/MCP | Audit du contenu, personnalisation |
| **Motion Studio** | https://motion.dev/docs/studio | Éditeur visuel | Timeline + IA sur ton site |
| **MotionScore** | https://score.motion.dev/docs | Audit de performance | Corrige les animations coûteuses |
| **CSS Studio** | https://cssstudio.ai/learn | Produit séparé | Édition visuelle du CSS |
| **vgpu** | https://motion.dev/docs/vgpu | Couche de rendu GPU | 3D/effets sans Three.js complet |
| **Base UI** | (cité pour des composants phares) | Dépendance de primitives | Base accessible pour composants |
| **GSAP vs Motion** | https://motion.dev/docs/gsap-vs-motion | Comparatif (parti pris éditeur) | Aide au choix — à lire de façon critique |
| **Three.js** | https://threejs.org/ | Intégration documentée | 3D |

## 10.4 Découvertes issues d'Uiverse
| Nom | Lien | Relation | Utilité |
| --- | --- | --- | --- |
| **galaxy (GitHub)** | https://github.com/uiverse-io/galaxy | Miroir MIT du catalogue | Base pour scripts/MCP, versionnage |
| **uiverse-mcp** | https://github.com/Fabi-SPL/uiverse-mcp | MCP tiers (Apache-2.0) | Rend le catalogue interrogeable par un agent |
| **Uiverse Design** | https://uiverse.io/design/ | Produit payant | Design systems pour agents |
| **Uiverse Pro/Pro+** | https://uiverse.io/ai/features | Abonnements IA | Edit with AI, AI Variations |

## 10.5 Découvertes issues d'Anime.js
| Nom | Lien | Relation | Utilité |
| --- | --- | --- | --- |
| **Trois.js adapter** | https://animejs.com/documentation/adapters/threejs-adapter | Module officiel | Animer des meshes 3D |
| **WAAPI** | https://animejs.com/documentation/web-animation-api | Module officiel | Utiliser les animations natives du navigateur |
| **GitHub Sponsors** | https://github.com/sponsors/juliangarnier | Financement | Soutenir un projet 100 % gratuit |
| **Migration v3→v4** | wiki officiel | Documentation | Indispensable : beaucoup de code v3 circule encore |

## 10.6 Découvertes générales (hors sources)
| Nom | Lien | Pourquoi le signaler |
| --- | --- | --- |
| **Aceternity UI** | https://ui.aceternity.com/ | Alternative directe à React Bits (effets React/Tailwind, freemium) |
| **Magic UI** | https://magicui.design/ | Idem, avec version gratuite open source |
| **Tremor** | https://tremor.so/ | Concurrent direct de Bklit pour les charts React |
| **HyperUI** | https://www.hyperui.dev/ | Alternative gratuite (MIT) à Uiverse pour Tailwind |
| **Flowbite** | https://flowbite.com/ | Composants Tailwind + Figma |
| **Tailwind Plus** (ex-Tailwind UI) | https://tailwindcss.com/plus | Payant, qualité/garantie industrielle |
| **Land-book** · **Awwwards** · **Mobbin** · **Godly** · **SiteInspire** | https://land-book.com/ · https://www.awwwards.com/ · https://mobbin.com/ · https://godly.website/ · https://www.siteinspire.com/ | Inspiration pure (PHASE 1) |
| **Spline** | https://spline.design/ | 3D web sans coder (complément aux fonds React Bits) |
| **Rive / Lottie** | https://rive.app/ · https://lottiefiles.com/ | Animations d'auteur (state machines / After Effects) |
| **dnd-kit** | https://dndkit.com/ | Logique de drag & drop (complément d'Anime.js/Motion) |

> **Rappel de la règle §4** : ces éléments sont classés comme **découvertes**, pas comme nouveaux sujets d'audit complet. Demande-moi une fiche dédiée si tu veux l'un d'eux en profondeur.

---

# 11. APPRENDRE À PARTIR DE CES RESSOURCES (§41)

| Ressource pédagogique | Concept appris | Technologie | Difficulté | Principe de fonctionnement | Exercice que tu peux te donner |
| --- | --- | --- | --- | --- | --- |
| Uiverse — `tame-fly-42` (loader) | `@keyframes`, pseudo-éléments, `box-shadow` animé, easing | CSS pur | Débutant | Deux pseudo-éléments animés en boucle + ombres qui se déplacent pour simuler le rebond | Refaire un loader avec **une seule** `@keyframes` et le paramétrer par variables CSS |
| React Bits — `BlobCursor` | Suivi de souris, interpolation (lerp), filtres SVG | React + GSAP + SVG filters | Intermédiaire | Blobs qui suivent le curseur avec des durées/easings différents ; `feGaussianBlur` + `feColorMatrix` pour le métaball | Remplacer GSAP par Anime.js ou des springs Motion et comparer le ressenti |
| React Bits — `DotField` / `Aurora` | Shaders, blending, uniformes | WebGL/Canvas | Avancé | Grille/rendu fragment avec paramètres de vitesse, bruit, intensité | Baisser les paramètres jusqu'à obtenir 60 fps sur mobile, mesurer l'impact |
| Anime.js — `Timeline` | Orchestration temporelle, positions relatives | JS | Intermédiaire | Une timeline additionne des animations avec positions (`'<'`, offsets) | Reconstruire un « logo reveal » de 3 s avec stagger + positions |
| Anime.js — `createDrawable` / `morphTo` | Animation de tracés SVG, morphing | SVG | Avancé | Interpolation des points/masques de dessin | Morpher deux icônes SVG au survol |
| Anime.js — `createDraggable` + `createSpring` | Physique ressorts, drag contraint | JS | Intermédiaire | Release avec easing spring, contraintes de conteneur | Créer un « swipe to delete » physique |
| Motion — `layout` / `AnimatePresence` | Transitions de layout, cycle de vie DOM | React | Avancé | FLIP + suivi de layout par mesure DOM, animation avant retrait | Onglets animés + liste filtrée qui se réorganise |
| Motion — `useScroll` + `useTransform` | Scroll-linked animation | React | Intermédiaire | MotionValue dérivée de la progression du scroll | Barre de progression + parallax de 3 couches |
| Bklit — `composed-chart` | Composition de graphiques, axes, tooltips | React + visx/D3 | Intermédiaire | Séries déclaratives, échelles D3, contexte React partagé | Ajouter une seconde série + un curseur de survol synchronisé |
| Bklit — `chartCssVars` | Design tokens appliqués aux données | CSS variables | Débutant | Thème par variables CSS plutôt que par props de couleur | Créer un thème « marque » sombre sans toucher au code du chart |
| Motion AI Kit | Génération de springs CSS `linear()` | CSS | Intermédiaire | Approximation polynomiale d'un ressort en courbe d'easing | Convertir tes transitions Java-Script en CSS pur et mesurer le gain |

---

# 12. MODE OPÉRATOIRE : UTILISER CES RESSOURCES AVEC UNE IA (§13, §42)

**Procédure standard, applicable aux 4 plateformes outillées**

| Étape | React Bits | Motion | Bklit | Uiverse |
| --- | --- | --- | --- | --- |
| **1. Ce que je copie** | Bouton « Copy for AI » de la fiche, ou rien (le MCP fait tout) | Le prompt d'exemple pré-rempli (`Open in Cursor`) / `motion.theme.ts` | Le `SKILL.md` + la commande d'install | Le composant HTML/CSS trouvé via MCP |
| **2. Où je le colle** | Chat Claude/Cursor, ou terminal (install) | Chat / IDE (MCP) | IDE avec MCP shadcn | IDE avec `uiverse-mcp` |
| **3. Quelles IA** | Claude Code, Cursor, VS Code ; v0/Bolt/Lovable/Replit (Pro) | Claude Code, Cursor, Amp, OpenCode, Gemini CLI, Copilot | Tout client MCP | Claude Code, Cursor, Windsurf, Cline |
| **4. Contenu du prompt** | Contexte du composant, props, dépendances (contenu exact à confirmer ❓) | Bonnes pratiques + doc à jour (+ source d'exemples en Motion+) | Règles Bklit (installer, composer, thématiser) | HTML+CSS indexés localement |
| **5. Ce que l'IA doit produire** | Le composant adapté (thème, props, page) | L'animation déclarative + transitions | Le chart composé + tokens | L'insertion du markup stylé |
| **6. À vérifier après génération** | props réellement utilisées, dépendances installées, rendu mobile, `reduced motion` | tokens de thème, dépendance `motion-plus`/token, perfs | `chartCssVars` respectés, données typées, responsive du chart | sémantique HTML, focus clavier, aria, responsive |
| **7. Dépendances à installer** | celles listées sur la fiche (ex. `gsap`) | `motion` (+ `motion-plus` si premium) | `shadcn` + deps du registry | aucune |
| **8. Modifications nécessaires** | props/couleurs/copie | thème + timings | données + thème | nettoyage CSS, accessibilité |

> ⚠️ **Règle d'or** : une génération IA **n'est jamais garantie fonctionnelle**. Les trois risques récurrents observés sur ces plateformes : (1) la dépendance manquante non installée, (2) la dépendance à une offre payante (`motion-plus` et son token d'accès) que l'agent ne peut pas résoudre seul, (3) l'adaptation cosmétique (l'agent met ses couleurs au lieu d'hériter des tokens du projet).

---

# 13. LIMITES TRANSVERSALES ET PIÈGES (§44)

| Type de limite | Détail vérifié | Impact |
| --- | --- | --- |
| **Aucune ressource n'est complète pour un projet** | Aucune des 5 plateformes ne couvre UI + data + 3D + templates + IA. Il faut **combiner** (ex. shadcn/ui + React Bits + Bklit + Motion) | Planifie une **stack**, pas une plateforme |
| **Pas de `npm update`** | React Bits, Bklit, Motion UI, Uiverse, React Bits Pro distribuent du **source copié** | Correctifs = re-copie manuelle ; à documenter dans ton repo (commit des composants, README d'origine) |
| **Maintenance concentrée** | React Bits (1 mainteneur principal), Bklit (1 auteur cité), Anime.js (1 auteur), Uiverse (communauté + plateforme) | Risque de continuité : privilégier les ressources très utilisées |
| **Compteurs annoncés instables** | React Bits Pro : « 150 composants » vs somme des sous-catégories (194) ; Uiverse : 7 450 vs 4 489 ; Motion UI : 24 composants dans le sitemap vs « 38 » affiché | **Ne jamais planifier sur un chiffre marketing** — vérifier le catalogue réel |
| **Zones payantes dans des outils « gratuits »** | Motion Studio (agent/Apply), Uiverse Pro (IA), Bklit Studio (propriétaire), React Bits Pro, Motion+ | Lire la frontière gratuit/payant **avant** de bâtir dessus |
| **Licences non triviales** | React Bits = MIT **+ Commons Clause** (interdiction de revente/portage) ; Bklit = MIT **sauf Studio** ; Motion = MIT **sauf Motion+** | Ne jamais conclure « open source donc je peux tout faire » |
| **Accessibilité rarement fournie** | Uiverse : focus/aria quasi absents ; React Bits/Bklit : à vérifier composant par composant | Prévoir une passe a11y systématique (axe, clavier, contrastes) |
| **Performance variable** | Fonds WebGL/shaders, filtres SVG (Safari), animations canvas | Tester mobile bas de gamme et activer un mode `prefers-reduced-motion` |
| **Dépendances tierces** | Bklit → visx/D3 ; React Bits → GSAP/three selon composant ; Motion UI → motion-plus pour le premium | Anticiper la taille du bundle et les mises à jour |
| **Verrouillage (lock-in) partiel** | shadcn/ui est devenu le « protocole » commun (React Bits, Bklit, Motion UI) ; Motion+ dépend d'un token | Le lock-in le plus faible : sources copiées. Le plus fort : Motion+ et Bklit Studio |
| **Ressources obsolètes** | Anime.js v3 → v4 : la majorité des exemples du web sont en v3 ; tutoriels React Bits antérieurs à la v4 | Vérifier la version avant de copier |
| **Aucune donnée « prompt IA » auditable publiquement** | React Bits « Copy for AI » : contenu exact du presse-papiers non vérifiable de l'extérieur ❓ | À valider en local si c'est critique pour ton workflow |

---

# 14. « MA STACK DE RESSOURCES » (§35)

```text
INSPIRATION
├── Motion examples ......... https://motion.dev/examples ......... 462 démos sourcées | Gratuit/💰 | React·Vue·JS | Preview + code
├── React Bits (démos) ...... https://www.reactbits.dev/get-started/index ... 213 composants | Gratuit | React | Preview + copie
├── Uiverse (galerie) ....... https://uiverse.io/elements ........ Des milliers d'éléments | Gratuit | CSS·Tailwind | Copie
└── Land-book / Awwwards / Mobbin ............................... Inspiration pure | Gratuit | — | Liens

UI (composants de base)
├── React Bits .............. https://www.reactbits.dev/ ......... UI créative animée | Gratuit | React | Copie / CLI / MCP
├── Uiverse ................. https://uiverse.io/ ................ Pièces CSS/Tailwind | Gratuit | HTML·CSS·TW·React | Copie / Figma
├── shadcn/ui ............... https://ui.shadcn.com/ .............. Socle de composants | Gratuit | React+TW | CLI
└── HyperUI / Flowbite ...... https://www.hyperui.dev/ ............ Alternatives Tailwind | Gratuit | HTML·TW | Copie

MOTION
├── Motion .................. https://motion.dev/docs/react ....... Moteur de référence | Gratuit (MIT) | React·Vue·JS | npm
├── Motion UI ............... https://motion.dev/ui ............... 30 sections animées | 💰 399 $ | React+shadcn | shadcn
├── Motion AI Kit ........... https://motion.dev/ai-kit ........... Skill + MCP + MotionScore | Gratuit/💰 | Agents | npx motion-ai
├── Anime.js ................ https://animejs.com/documentation ... Moteur JS vanilla | Gratuit (MIT) | JS·SVG | npm / CDN
└── React Bits (animations) . https://www.reactbits.dev/animations* … 40 animations + 33 text | Gratuit | React | Copie / CLI
   (* index par catégorie dans inventaire/react-bits-free.md)

3D / CREATIVE
├── React Bits Backgrounds .. https://www.reactbits.dev/backgrounds ............ 59 fonds | Gratuit | React·WebGL | Copie / CLI
├── React Bits Pro 3D ....... https://pro.reactbits.dev/docs/components ........ 30 composants 3D/shaders | 💰 249 $ | React | CLI+clé
├── Motion × Three.js ....... https://motion.dev/docs/three .................... Animation de scènes 3D | Gratuit | JS·React | npm
└── Anime.js adapter ........ https://animejs.com/documentation/adapters ....... Animer des objets 3D | Gratuit | JS | npm

DATA / DASHBOARD
├── Bklit UI ................ https://bklit.com/docs/components .............. 17 charts + primitives | Gratuit (MIT) | React+shadcn | CLI
├── Bklit Studio ............ https://bklit.com/studio ...................... Réglage visuel de charts | Propriétaire | — | Web
├── Tremor .................. https://tremor.so/ ............................ Alternative charts | Gratuit/💰 | React+TW | npm/copie
└── React Bits Pro App UI ... https://pro.reactbits.dev/docs/app-ui ......... Dashboard, tables, analytics | 💰 | Next/React | CLI+clé

TEMPLATES / PRODUIT
├── React Bits Pro Templates  https://pro.reactbits.dev/docs/templates ..... 15 templates Next.js | 💰 349 $ (Ultimate) | Next.js | Copie
└── shadcn blocks (indirect)  shadcnblocks · shadcncraft · shadcnstudio .... Blocs commerciaux | 💰 | React | CLI

AI DEVELOPMENT
├── Motion AI Kit ........... https://motion.dev/ai-kit .................... Skill /motion + MCP (MIT) | Gratuit | Agents | npx motion-ai
├── MCP shadcn + React Bits . https://www.reactbits.dev/get-started/mcp ... Installe les composants par prompt | Gratuit | Agents | npx shadcn mcp
├── React Bits Agent Kit .... https://pro.reactbits.dev/docs/agent-kit ..... 20 skills/prompts/recipes | 💰 249 $ | Agents | Copie
├── Bklit skill (communautaire)  (dépôt bklit) ........................... Règles d'installation charts | Gratuit ❓ | Agents | Fichier skill
└── uiverse-mcp ............. https://github.com/Fabi-SPL/uiverse-mcp .... Indexe le catalogue Uiverse | Gratuit (Apache-2.0) | Agents | npx

OUTILS DE FABRICATION
├── React Bits Tools ........ https://www.reactbits.dev/tools ............. Background Studio · Shape Magic · Texture Lab | Gratuit | Web | Exports (vidéo, image, SVG, React, clip-path)
└── MotionStudio ............ https://motion.dev/docs/studio .............. Timeline dans le navigateur | Gratuit/💰 | Next·Vite·Nuxt·Astro | npm
```

**Ordre de mise en place recommandé (30 minutes)**
1. `npx shadcn@latest init` + registres `@react-bits` et `@bklit` dans `components.json`.
2. `npx shadcn@latest mcp init --client claude` (ou autre client) → l'agent peut installer.
3. `npm install motion` + `npx motion-ai` → moteur + skill IA.
4. `npm install animejs` si tu as des besoins SVG/scroll fins ou du JS vanilla.
5. Créer un dossier `vendor/README.md` documentant **d'où vient chaque composant copié** (plateforme + URL + date + licence) → c'est ta seule protection contre les mises à jour manuelles.

---

# 15. ANNEXE — COUVERTURE, INCERTITUDES ET VÉRIFICATIONS RESTANTES

## 15.1 Ce qui a été vérifié directement
- **React Bits** : arborescence `src/content` du dépôt (213 composants), `LICENSE.md`, `README.md`, pages docs (installation, MCP, tools), fiche composant détaillée (`BlobCursor` : 20 props, dépendance `gsap`), prix et structure du catalogue Pro (recherches sur pages officielles), **213/213 URL en HTTP 200**.
- **Uiverse** : pages d'accueil/catalogue/élément (export, MIT affiché), dépôt `galaxy` + `LICENSE` MIT, page `/ai/features` (Pro 4,99 $, Pro+ 19,99 $), page `/design` (systèmes 9,99–14,99 $, compatibilités agents), `robots.txt`.
- **Anime.js** : documentation complète (16 sections), page installation (npm/CDN/dist), page Adapters (Three.js + `registerAdapter`), page « Using with React », `LICENSE.md` MIT, npm **4.5.0 (22 juin 2026)**.
- **Bklit** : installation (registry `@bklit`, CLI), liste des charts, `packages/ui/registry.json` (**56 entrées** et leurs dépendances), README + licence double (MIT charts / Studio propriétaire), sitemap (54 URL), contexte du Vercel OSS Program (post de l'auteur).
- **Motion** : page d'accueil (MIT, gratuit), docs React, docs AI Kit (gratuit vs Motion+), page Motion+ (**399 $ / 249 $ par siège/an**), page Motion UI, docs Motion Studio (prérequis, périmètre, gratuité partielle), sitemap (**462 exemples, 30 sections, 24 composants, 135 pages de docs**), version **14.0.0 (1er oct. 2026)**.

## 15.2 Ce qui reste incertain (à vérifier sur la source avant décision)
1. **Contenu exact du bouton « Copy for AI »** de React Bits ❓ — non inspectable sans exécuter le site dans un navigateur.
2. **Prix et conditions de Motion Studio / CSS Studio / MotionScore** ❓ (abonnements non affichés sur les pages consultées).
3. **Modèle économique de Bklit Studio** ❓ — aucune page de tarification publique ; Studio 2 annoncé « expérimental/bêta ».
4. **Licence commerciale complète de React Bits Pro et de Motion+** ❓ — textes visibles seulement après achat.
5. **Statut officiel du skill « Bklit UI »** ❓ — référencé par des annuaires d'agents, présenté comme publié depuis le dépôt bklit, non mentionné dans la documentation du site.
6. **Compteurs de catalogue** : React Bits « 150 » vs sous-catégories (194) ; Uiverse 7 450 vs 4 489 ; Motion UI « 38 composants » vs 24 dans le sitemap ❓.
7. **License des éléments Uiverse** : MIT affiché sur les fiches et dans le dépôt miroir, mais **Uiverse ne précise pas de mécanisme de licence par auteur** — en cas d'usage critique, conserver le lien vers la fiche d'origine comme preuve de provenance.
8. **Qualité des composants Pro/Motion+** : non auditée (accès payant non acheté) — seuls les catalogues et descriptions publiques ont été analysés.

## 15.3 Ce que je n'ai pas fait (et pourquoi)
- **Crawler exhaustif d'Uiverse** (des milliers d'éléments) : disproportionné et non nécessaire pour répondre à « où trouver X » ; les catégories, tags, formats d'export et licences sont, eux, entièrement documentés. **Catalogue partiellement inventorié, structure complètement analysée.**
- **Achat et test des offres payantes** : l'audit décrit ce qui est publiquement affiché (prix, périmètre, licences) ; il ne prétend pas avoir validé la qualité des fichiers payants.
- **Audit des découvertes indirectes** (§10) : volontairement laissées au stade « signalement » conformément à la règle §4 — une fiche complète peut être produite sur demande (ex. Aceternity UI, Tremor, Magic UI, GSAP, HyperUI).

## 15.4 Prochaine étape suggérée
Choisis **un axe** et je le traite en profondeur :
- **Axe 1 — Shadcn-first** : monter la stack shadcn + React Bits + Bklit + Motion UI (registres, MCP, tokens, conventions).
- **Axe 2 — Vanilla-first** : Anime.js + Uiverse + HTML/CSS/Tailwind, sans framework JS.
- **Axe 3 — Data** : audit comparatif complet Bklit vs Tremor vs Recharts vs Nivo vs shadcn charts (perfs, composabilité, licences, prix).
- **Axe 4 — IA** : dossier « agents » (MCP shadcn, Motion AI Kit, uiverse-mcp, Agent Kits) et procédure d'installation dans ton environnement.
