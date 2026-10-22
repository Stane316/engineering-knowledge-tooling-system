# DRI 02 — TAXONOMY
### Grille de classement, de notation et de fusion des ressources numériques
**Version 1.0 — 5 octobre 2026** · Socle commun aux documents 03 à 09

---

## 1. Pourquoi une taxonomie stricte

Le défaut le plus fréquent des « listes de ressources » est de **mélanger les natures** : on y trouve côte à côte une galerie d'inspiration, un package npm, un template payant et un serveur MCP, comparés comme s'ils étaient interchangeables. Ils ne le sont pas : on ne *récupère* pas, on ne *paie* pas et on ne *score* pas de la même façon.

Cette taxonomie impose trois choses à chaque entrée :
1. **une nature unique et principale** (une ressource peut avoir des *dimensions* secondaires — une plateforme qui vend des templates **et** fournit un MCP est *plateforme* avec dimensions `commercial` + `mcp`),
2. **une méthode de récupération dominante** (§6),
3. **des scores justifiés** (§4), jamais « 4/5 parce que c'est bien ».

**Règle anti-fourre-tout** : si une entrée ne peut pas être classée sans ambiguïté, c'est le signe qu'elle est en réalité **plusieurs ressources** (ex. : un site qui est à la fois galerie d'inspiration et marketplace) → on crée une fiche par nature et on les relie (`relation: même éditeur / complément de`).

---

## 2. Les 24 natures (N01 → N24)

Chaque nature : définition opérationnelle, ce qui la distingue du voisin le plus proche, exemple de référence.

### Groupe I — Découverte et stimulation

| Code | Nature | Définition opérationnelle | Distinction | Exemples |
|---|---|---|---|---|
| **N01** | **Inspiration** | Flux ou galerie de références **non récupérables comme code** : on regarde pour décider (structure, ton, interaction), on ne copie pas. | vs N02 : ce qu'on en sort est une *idée*, pas un fichier. | Awwwards, Godly, SiteInspire [V⚠/V], Mobbin, Refero [W] |
| **N02** | **Galerie** | Collection de contenus **récupérables** ou inspectables unité par unité (screenshots annotés, shaders, compositions, mockups). | vs N01 : entrée → artefact consultable ; vs N11 : la galerie n'est pas un *fonds d'assets* classé par usage. | Shadertoy (shaders), p5 sketch gallery, Refero (screens taggés), Pttrns [W] |
| **N03** | **Awesome list / index curaté** | Meta-ressource : liste maintenue qui **pointe** vers d'autres ressources (README GitHub ou site). | vs N15 : ne fournit aucune API ; la valeur = tri humain. | sindresorhus/awesome [API : 515 116★, CC0], birobirobiro/awesome-shadcn-ui [API : 20 609★], punkpeye/awesome-mcp-servers [API : 95 845★] |
| **N04** | **Annuaire / moteur de recherche** | Outil qui **indexe automatiquement** un écosystème et le rend interrogeable (filtres, stats). | vs N03 : alimenté par crawler/API, pas par PR humaine ; vs N10 : ne distribue pas. | registry.directory, shoogle.dev (418 registries) [V], mcp.so, Glama, Smithery [W] |

### Groupe II — Code réutilisable (UI)

| Code | Nature | Définition opérationnelle | Distinction | Exemples |
|---|---|---|---|---|
| **N05** | **Design system** | Ensemble **cohérent et gouverné** : tokens + composants + règles + documentation + versionnage. | vs N07 : englobe tokens, thème et gouvernance. | MUI, Mantine, Chakra, HeroUI, Ant Design, Radix Themes, shadcn/ui comme *système de tokens* [API/W] |
| **N06** | **UI primitives / headless** | Comportement accessible et logique (focus, clavier, ARIA) **sans style** ; vous apportez le visuel. | vs N05 : aucune DA imposée ; vs N07 : quasi pas de style. | Radix Primitives, Base UI, Ark UI, Bits UI, Reka UI, Headless UI [W] |
| **N07** | **Librairie de composants** | Composants stylés **installables en package** (versionnés, dépendances gérées). | vs N08 : distribution par paquet ; vs N05 : pas de gouvernance/tokens complète. | MUI, Mantine, PrimeVue, Vuetify, daisyUI, Nuxt UI [API] |
| **N08** | **Snippet / code library (copier-coller)** | Blocs de code **copiables** dans le projet (vous possédez le fichier) — sans CLI ni package. | vs N07 : pas de mise à jour automatique ; vs N10 : pas de distribution outillée. | Uiverse [S], React Bits (selon variante), MicroKit, loadercn [V/W] |
| **N09** | **Block library** | Sections **assemblables** (hero, header, pricing, footer, tableau de bord) plutôt que composants atomiques. | vs N07/N08 : granularité = section/page. | shadcn blocks, Tailwind UI blocks, shadcn Space, shadcnstore [W] |
| **N10** | **Registry / canal de distribution** | Index doté d'un **protocole d'installation** (CLI, JSON schema) : `npx shadcn@latest add`, `npm`, `docker`. | vs N04 : distribue, ne se contente pas d'indexer ; vs N07 : l'artefact atterrit dans *votre* dépôt. | shadcn/ui + sa CLI, registry.directory, bklit registry [S/V] |
| **N11** | **Template** | Page ou projet **préconstruit** livré tel quel (HTML/JSX/Figma), à modifier. | vs N12 : usage ponctuel (site, page) ; vs N09 : échelle du projet. | Templates AdminLTE/Tabler/TailAdmin, HugoBlox, Astro themes [W/API] |
| **N12** | **Boilerplate / starter** | Base de **projet complet** avec choix techniques posés (auth, DB, i18n, CI) à cloner/forker. | vs N11 : contient de l'infrastructure et des conventions. | create-t3-app [API : 29 154★], ixartz/SaaS-Boilerplate, BoxyHQ, Supastarter, create-next-app [W/API] |
| **N13** | **Générateur / outil visuel** | Application web qui **produit** un artefact (thème, palette, OG image, favicon, courbe, mesh) à exporter. | vs N10 : produit un livrable, pas une installation projet. | tweakcn, StyleGlide, Realtime Colors, Huemint, Satori (OG), Haikei-type [V/W] |

### Groupe III — Moteurs, données, 3D, assets

| Code | Nature | Définition opérationnelle | Distinction | Exemples |
|---|---|---|---|---|
| **N14** | **Moteur / runtime d'animation** | Bibliothèque qui **exécute** du mouvement dans le navigateur (timeline, spring, scroll). | vs N11 : c'est du comportement, pas un livrable visuel préfait. | Motion, GSAP, Anime.js, React Spring, Lenis (scroll), Theatre.js [API/S] |
| **N15** | **Moteur 3D / WebGL / viewer** | Rendu et scène 3D, ou lecteur de modèle intégré. | vs N14 : espace 3D et pipeline de rendu. | three.js, R3F, Babylon.js, PlayCanvas, Spline, model-viewer, PixiJS (2D WebGL) [API/W] |
| **N16** | **Librairie de dataviz** | Graphiques, grammaires de visualisation, cartes, grilles de données. | vs N17 : composants de rendu spécialisés données. | Recharts, ECharts, Nivo, visx, D3, Chart.js, AG Grid, TanStack Table, deck.gl, MapLibre [API/W] |
| **N17** | **Fonds d'assets** | Contenus graphiques/sonores réutilisables : icônes, fonts, illustrations, photos, modèles 3D, HDRIs, audios, avatars. | vs N02 : classé par usage, prêt à intégrer, avec licence explicite. | Lucide, Tabler Icons, Iconify, Fontshare, unDraw, Poly Haven, ambientCG, Mixamo, Freesound-type [API/W] |
| **N18** | **Package / SDK / API / plateforme** | Brique logicielle ou service hébergé avec quotas, comptes, documentation et clés. | Subdivisé : `package` (npm), `SDK` (client officiel), `API` (HTTP), `plateforme` (service hébergé : Supabase, Resend, Clerk…). | Supabase, Resend, Stripe, Clerk, Better Auth, Hono, Drizzle [API/W] |
| **N19** | **CLI / outil de développement** | Programme en ligne de commande qui outille le cycle de dev (build, lint, test, migration, déploiement). | vs N18 : s'installe localement et n'a pas de compte par défaut. | Vite, Biome, Vitest, Playwright, Coolify CLI, Supabase CLI [API] |

### Groupe IV — IA, agents et distribution IA

| Code | Nature | Définition opérationnelle | Distinction | Exemples |
|---|---|---|---|---|
| **N20** | **Kit / composants IA** | UI et primitives pour produits IA (chat, streaming, citations, raisonnement, outils, voix). | vs N07 : périmètre IA (états de streaming, tool calls). | AI Elements (Vercel), assistant-ui, CopilotKit, prompt-kit, Ant Design X [W/API] |
| **N21** | **Bibliothèque de prompts / contexte** | Prompts, règles d'agent (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`), cookbooks, guides de prompting. | vs N22/N23 : du **contenu** d'instruction, pas un exécutable. | prompts.chat, dair-ai/Prompt-Engineering-Guide, openai-cookbook [API : 76 357★], awesome-cursor-rules-type [API] |
| **N22** | **Serveur MCP** | Serveur Model Context Protocol exposant **outils/ressources** à un client IA (stdio ou HTTP). | vs N20 : l'IA consomme des capacités, pas une UI. | registry officiel, Context7, Playwright MCP, Chrome DevTools MCP, Figma Dev Mode MCP, shadcn MCP [API/W] |
| **N23** | **Skill (Agent Skill)** | Dossier `SKILL.md` + fichiers annexes décrivant une procédure pour un agent. | vs N22 : compétence documentaire, pas de canal de données. | anthropics/skills [API : 179 777★], awesome-claude-skills, gsap-skills [API : 15 960★], LottieFiles/motion-design-skill [API] |
| **N24** | **Agent / assistant de code / builder IA** | Outil qui **agit** sur du code ou génère une application à partir d'un prompt (CLI, IDE, plateforme cloud). | vs N13 : produit du code de projet, pas un artefact unique ; vs N19 : l'IA est le cœur. | Claude Code, Cursor, Codex CLI, OpenCode, Aider, Cline, Gemini CLI, v0, Bolt, Lovable, dyad [W] |
| **N25** | **Observabilité / infra IA** | Traces, évals, coûts, RAG vectoriel, gateways de modèles, exécution locale. | vs N18 : périmètre IA lifecycle. | Langfuse, LangChain/LangGraph, Ollama, OpenRouter, Firecrawl, pgvector/Qdrant-type [W/API] |

> Numérotation étendue à 25 : la recherche a révélé que **N24 (agents) et N25 (infra IA) ne se réduisent pas à N18** — les quotas, la licence et les risques y sont différents (données envoyées, coût par token, dépendance à un fournisseur de modèle).

### Groupe V — Compagnonnage et marché

| Code | Nature | Définition opérationnelle | Distinction | Exemples |
|---|---|---|---|---|
| **N26** | **Ressource d'apprentissage** | Cursus, cours, référence, exercices, magazine, benchmark d'écosystème. | vs N03 : structure pédagogique, pas une liste. | roadmap.sh [API : 368 957★], MDN, javascript.info, freeCodeCamp, The Odin Project, Frontend Masters, Three.js Journey, State of JS [W] |
| **N27** | **Communauté** | Espace d'échange : Discord, subreddit, forum, challenges, conférences. | vs N26 : valeur = interaction, pas un contenu séquencé. | Frontend Mentor, r/webdev, Discords d'écosystème, CodePen challenges [W] |
| **N28** | **Marketplace** | Vente ou licence commerciale d'artefacts (thèmes, kits, templates, sounds, modèles). | vs N11/N12 : paywall et conditions de licence commerciales. | Tailwind Plus, Motion+, ThèmeForest-type, Envato-type, Fab, Sketchfab, CGTrader, Streamline [W] |
| **N29** | **Source de données ouverte** | Jeux de données, APIs publiques, registres ouverts exploités comme matière première. | vs N18 : la donnée est le produit. | Smithsonian Open Access, NASA 3D, Open Data portals, listes d'API publiques [W] |
| **N30** | **Outil de design / éditeur** | Éditeur graphique ou temporel qui produit des artefacts intégrables (design, animation, scène 3D, timeline). | vs N13 : environnement de création, pas un générateur one-shot. | Figma, Penpot, Rive Editor, Spline, Theatre.js Studio, Blender [V/W] |

---

## 3. Règles de distinction (les 6 confusions les plus fréquentes)

| Question piège | Réponse taxonomique |
|---|---|
| « shadcn/ui, c'est une librairie de composants ? » | **Non** : c'est un **registry (N10)** + un ensemble d'artefacts « snippet » (N08) + un système de tokens (N05). On ne l'installe pas comme dépendance : on copie du code dans son dépôt. |
| « Un site qui vend des templates **et** donne un MCP : marketplace ou registry ? » | Fiche **N28 marketplace** (nature économique) avec dimension `mcp` ; les templates gratuits qu'il distribue sont des entrées N11 séparées s'ils sont autonomes. |
| « Magic UI / Aceternity / React Bits : même nature ? » | Oui pour **N08/N10** (composants-à-copier distribués par registry), mais ce sont des **concurrents directs** → à traiter comme une **grappe** (§5) avec un représentant par usage. |
| « Mollie/Stripe/Resend : SDK ou plateforme ? » | **N18 plateforme** (compte, quotas, conformité) + dimension `SDK`. La fiche porte la partie *coût et défaillance* (obligatoire pour N18). |
| « Un blog technique : apprentissage ou inspiration ? » | Si l'article sert à **apprendre un mécanisme** → N26. Si c'est une vitrine à imiter → N01. Le même site peut avoir deux fiches reliées. |
| « Une liste awesome : ressource ou index ? » | **N03** : sa valeur est le tri humain ; on n'y « installe » rien et on ne la note pas sur sa techno mais sur sa **fraîcheur** et son **inclusion**. |

---

## 4. Notation : trois échelles, jamais une note unique

### 4.1 AI-readiness (0 – 5) — « à quel point une IA peut agir avec cette ressource sans deviner »

| Score | Définition | Preuves typiques |
|---|---|---|
| **0** | Aucun support IA : il faut un humain. | pas de doc structurée, pas de CLI, pas d'API |
| **1** | Consommable passivement par une IA (le modèle lit la doc). | documentation web lisible, exemples HTML |
| **2** | Intégrable par copier-coller assisté. | snippets courts, JSX prêt, schémas exposés |
| **3** | Installable par une commande stable et prévisible. | `npx shadcn@latest add …`, `npm i`, `docker run` |
| **4** | Adressable par API/registre lisible par machine. | registry JSON public, API HTTP documentée, schéma de tokens |
| **5** | **Agent-natif** : conçu pour être piloté par un agent (MCP, CLI conçue pour agent, Skills officiels). | serveur MCP officiel, `SKILL.md`, sortie JSON stable, permissions explicites |

> Un 5 n'est **pas** un gage de qualité : c'est un gage d'**automatisabilité**. Exemple : Context7 est 5 (MCP officiel, [API : 62 716★]) alors qu'il ne produit aucun design.

### 4.2 Réutilisabilité (1 – 5) — « coût réel de réemploi dans un projet »

| Score | Critère |
|---|---|
| **1** | Inspiration seule : tout est à réécrire. |
| **2** | Réemploi partiel : il faut extraire, adapter, recâbler (galerie, code sans licence claire, template à découdre). |
| **3** | Réemploi direct avec adaptation normale : copier/adapter un composant, un bloc, un asset ; licence claire. |
| **4** | Réemploi industrialisé : CLI/paquet, versionné, mis à jour, documenté, **et** licence permissive explicite. |
| **5** | Réemploi industrialisé **sans friction d'intégration** : zéro style à défaire, tokens respectés, thémable, tree-shakable, **et** canal de mise à jour ou de distribution stable. |

### 4.3 Qualité — justifiée par preuves, jamais arbitraire

Une qualité n'est écrite que si **au moins deux** preuves de familles différentes sont disponibles :

| Famille de preuve | Exemples de signal exploité |
|---|---|
| **Adoption** | étoiles GitHub [API], téléchargements npm du mois [API], nombre de registries qui l'embarquent [W] |
| **Maintenance** | date de dernière poussée [API], cadence de commits, issues traitées, releases |
| **Droits** | licence SPDX lue à la source [API] ou page officielle [W], absence de clause cachée (Commons Clause, restriction IA) |
| **Documentation** | existence d'une doc de référence, d'exemples exécutables, de guides de migration |
| **Ingénierie** | TypeScript, tests, versionnage sémantique, tree-shaking, SSR-compatibilité, accessibilité documentée |
| **Transparence de coût** | quotas publics, page de tarifs datée, comportement à la limite connu [W] |
| **Portabilité** | pas de lock-in (données exportables, auto-hébergeable, spec ouverte) |

La mention **« Qualité : non évaluée au-delà des signaux »** est obligatoire si moins de deux familles sont disponibles.

### 4.4 Discovery Value (0 – 3 sur 6 axes) — « en quoi cette ressource fait progresser un projet »

| Axe | Question |
|---|---|
| **Implementation** | Réduit-elle le temps de code ? (blocs prêts, CLI, SDK) |
| **Design** | Améliore-t-elle la qualité visuelle/UX (DA, tokens, micro-interactions) ? |
| **Learning** | Enseigne-t-elle un mécanisme transférable ? |
| **Production** | Fiabilise-t-elle mise en ligne, perf, a11y, sécurité, observabilité ? |
| **AI** | Augmente-t-elle la capacité d'un agent (MCP, Skills, contexte, API machine) ? |
| **Inspiration** | Ouvre-t-elle des directions créatives inédites ? |

> Une ressource à forte valeur peut avoir 0 sur un axe : **c'est l'information utile**. Ex. : axe-core = Production 3 / Design 0 ; Mobbin = Design 3 / Implementation 1 / Inspiration 3.

---

## 5. Grappes, doublons et règles de fusion

### 5.1 Détection
Deux entrées sont **la même ressource** si : (a) même dépôt amont, (b) ou fork/renommage direct avec le même code, (c) ou wrapper d'une même brique, (d) ou index recopiant un autre index.
Deux entrées sont **une grappe** (famille redondante, pas doublon) si elles résolvent le même besoin avec un code et une marque distincts.

### 5.2 Règles
1. **Fusion** dès qu'il y a (a), (b) ou (c) : un seul enregistrement, avec `relation: fork de / wrapper de` et la mention du sort de la variante (maintenue, dormant, rachetée).
2. **Pas de fusion** pour les grappes : on garde **1 représentant principal** + **2 alternatives maximum** + la règle de choix. Ex. grappe « registries d'effets animés React » → représentants : Magic UI (cohérence marketing), Aceternity (impact visuel), React Bits (variété textuelle) [S/W].
3. **Une plateforme = une entrée**, même si elle vend plusieurs choses ; ses **dimensions** (commercial, MCP, Figma, API, CLI) sont déclarées dans la fiche.
4. **Aucune duplication d'audit** : les 5 plateformes de la phase 1 restent documentées dans `cartographie-creation-numerique.md` ; ici elles apparaissent comme **seeds** avec leurs relations, pas re-auditées [S].

### 5.3 Grappes identifiées dans cette phase (à traiter comme telles)

| Grappe | Représentant principal | Alternatives fortes | Pépite (Tier C) |
|---|---|---|---|
| Registries d'effets animés React | Magic UI | Aceternity, React Bits [S] | 000h, MicroKit, scrollxui, loadercn [W/V] |
| Libs de composants React | shadcn/ui | MUI, Mantine, Chakra, HeroUI, Ant Design | Intent UI (react-aria), JollyUI, HextaUI, ReUI [V] |
| Templates d'admin | Tabler | AdminLTE, Core UI, TailAdmin | Gentelella (Vite + vanilla), Metis (Alpine), Preline Admin [W] |
| Charts React | Recharts | ECharts, Nivo, visx, Chart.js | uPlot (ultra-léger), Chart.ts (rendu auto SVG→Canvas→WebGL) [W] |
| Cartes | MapLibre (+ Protomaps) | Mapbox, Leaflet, deck.gl, Cesium | shadcnmaps (cartes SVG pures) [W] |
| Annuaires MCP | registre officiel + punkpeye | mcp.so, Smithery, Glama | ClaudePluginHub (65 K plugins), PulseMCP, Agent Nexus [W] |
| Catalogues de Skills | anthropics/skills | SkillsMP, awesome-claude-skills, skills.sh | agent-skills.cc (63 K indexés / 1 000 curatés), Agensi (scan sécurité 8 points) [W] |
| Kits UI IA | AI Elements | assistant-ui, CopilotKit, prompt-kit | scrimui (68 items IA), ElevenLabs UI (voix/audio) [W] |
| Listes awesome | sindresorhus/awesome | awesome-selfhosted | terkelg/awesome-creative-coding (niche créative) [API] |
| Assets CC0 3D | Poly Haven | ambientCG, Kenney, Quaternius | KayKit, Icosa Gallery, Smithsonian/NASA 3D [W] |

---

## 6. Méthodes de récupération (nomenclature imposée)

| Code | Méthode | Exemple d'usage | Précautions |
|---|---|---|---|
| **R1** | Copier le code | snippet Uiverse, composant React Bits [S] | vérifier la licence du composant, pas seulement du site |
| **R2** | Copier pour une IA (« copier comme contexte ») | documentation + exemple injectés dans le prompt | ne jamais présenter le code généré comme testé |
| **R3** | `npm/pnpm/yarn/bun install` | librairies, SDK | vérifier taille, tree-shaking, doublons de dépendances |
| **R4** | `npx` (exécution ponctuelle) | gsap-skills, create-t3-app | `npx` exécute du code distant : vérifier le paquet |
| **R5** | CLI de registry (`npx shadcn@latest add …`) | composants shadcn/registry | le code atterrit chez vous → **il est désormais votre dette** |
| **R6** | `git clone` / fork | starters, boilerplates | lire la licence, vérifier l'activité amont |
| **R7** | ZIP / download | templates, kits | pas de mise à jour automatique |
| **R8** | API HTTP | dataviz data, assets via API | quotas, clés, conditions d'usage |
| **R9** | SDK | Supabase, Stripe, Sentry | lock-in progressif |
| **R10** | CDN (`script`/CSS) | prototypes, démos | dépendance réseau, CSP, perf |
| **R11** | Figma / Blender / éditeur | kits UI, scènes 3D, animations | vérifier la licence des fichiers sources |
| **R12** | Téléchargement direct d'asset | HDRIs, fonts, modèles | garder la preuve de licence (page + date) |
| **R13** | Configuration MCP | `claude mcp add …`, JSON client | permissions, accès fichiers/réseau, données envoyées |
| **R14** | `docker run` / compose | self-host (Coolify, PocketBase, n8n) | maintenance et sauvegardes à votre charge |
| **R15** | Skills : dépôt `~/.claude/skills/` ou marketplace | Skills agents | auditer avant installation (pas de scan automatique) |

---

## 7. Classification des licences (nomenclature imposée)

| Classe | Ce que cela veut dire en pratique | Exemples observés |
|---|---|---|
| **permissive** | Usage commercial libre, modification, redistribution ; attribution souvent optionnelle. | MIT (shadcn/ui [API], Motion [API], Payload [API]), ISC (D3 [API], next-auth [API]), Apache-2.0 (HeroUI, Babylon.js, ECharts, Supabase [API]), BSD-3 (Appwrite, Saleor [API]), CC0 (simple-icons, Poly Haven, ambientCG [API/W]), Unlicense |
| **copyleft** | Libertés garanties mais **contamination** : le dérivé doit rester libre (GPL/AGPL), ou obligations par fichier (MPL/LGPL). | AGPL-3.0 : Firecrawl, Grafana, Superset [API] ; GPL-3.0 : Caddy [API] ; MPL-2.0 : axe-core, Satori [API] ; LGPL-2.1 : p5.js [API] |
| **free commercial (avec conditions)** | Gratuit en usage commercial mais **source disponible ≠ open source** ou clause additionnelle. | GSAP : gratuit, y compris ex-plugins Club, mais **pas open source** (interdiction de fork/concurrence) [W] ; React Bits : MIT + **Commons Clause** (pas de revente) [S] |
| **free personal only** | Gratuit pour usage personnel/éducatif, payant dès que commercial. | Vercel Hobby (non-commercial) [W] ; certains kits Figma « free for personal use » |
| **freemium** | Noyau gratuit, capacités clés payantes. | Spline (schémas gratuits + payants) [W] ; LottieFiles ; Rive ; BlenderKit ; ressource freemium type DesignRevision MCP (browse/install gratuit) [W] |
| **premium / commercial** | Payant, avec licence d'usage. | Tailwind Plus, Motion+ (399 $ Solo), Aceternity premium (199 $), thèmes premium (69 $+), Three.js Journey (95 $) [W/S] |
| **unknown / à vérifier** | Licence non déterminée ou mal parsée. | Dépôts GitHub en **NOASSERTION** (React Bits, Astro, Medusa, Strapi, handsontable [API]) → **« Licence non suffisamment déterminée — vérifier la licence de la ressource individuelle »** ; Font Awesome (NOASSERTION : free tiers + Pro) [API/W] ; gsap (None) [API] mais lire la FAQ officielle. |

**Règle absolue** : « accessible gratuitement » ≠ « libre d'usage commercial ». Toute ressource sans licence explicite est marquée `unknown` et n'entre pas dans le canal « production commerciale » du Decision Engine (08).

---

## 8. Relations typées (graphe de connaissances)

| Relation | Sens | Exemple |
|---|---|---|
| `alternative à` | même besoin, autre solution | Base UI — alternative à — Radix [W] |
| `complément de` | s'utilise avec, sans se substituer | Lenis — complément de — GSAP ScrollTrigger [W] |
| `construit avec` | dépendance déclarée à la création | shadcn blocks — construit avec — shadcn/ui [W] |
| `dépend de` | dépendance d'exécution | React Bits — dépend de — Motion [S] |
| `wrapper de` | enveloppe un moteur tiers | react-chartjs-2 — wrapper de — Chart.js [W] |
| `fork de` | dérive d'un projet amont | Lucide — fork de — Feather [W] |
| `remplace` | succède et déprécie | Motion — remplace — Framer Motion (même paquet `motion`) [W] ; Base UI — remplace (progressivement) — Radix, dont la maintenance ralentit [W] |
| `agrège` | indexe d'autres ressources | shoogle.dev — agrège — 418 registries [V] |
| `distribué via` | canal d'installation | Magic UI — distribué via — shadcn CLI [W] |
| `inspiré par` | filiation créative non technique | les registries « neo-brutalist » — inspirés par — shadcn/ui [W] |

Ces relations alimentent l'index par besoin (07) et le Decision Engine (08) : un choix se valide en vérifiant qu'on n'a pas déjà, dans sa stack, un `dépendant` concurrent.

---

## 9. Phases d'usage (10 phases) — socle de la matrice « par phase »

| # | Phase | Question à laquelle répond la phase | Familles/natures typiques |
|---|---|---|---|
| 1 | **Inspiration** | Vers quoi je tends visuellement et fonctionnellement ? | N01, N02, N26 |
| 2 | **Cadrage & structure** | Quelles pages, quels blocs, quels parcours ? | N09, N11, N02 |
| 3 | **Design system & tokens** | Quelle échelle de couleur/typo/espace ? | N05, N13, N17 (fonts) |
| 4 | **Composants UI** | Quels composants accessibles et thématisables ? | N06, N07, N08, N10 |
| 5 | **Motion** | Quels mouvements, avec quelle performance ? | N14, N30 (éditeurs) |
| 6 | **Data** | Comment représenter des données justes ? | N16, N29 |
| 7 | **3D / immersif** | Ai-je besoin de 3D, et à quel coût ? | N15, N17 (assets 3D) |
| 8 | **IA & agents** | Où l'IA apporte-t-elle de la capacité (et pas du bruit) ? | N20–N25 |
| 9 | **Backend & intégrations** | Comptes, paiements, emails, temps réel, recherche | N18, N19 |
| 10 | **Production** | Perf, a11y, SEO, sécurité, déploiement, monitoring | N19, N26, N18 |

---

## 10. Convention de fiche normalisée (utilisée dans 03, 04, 06)

```
### [Nom de la ressource] — [Nature Nxx] · Tier [A|B|C]
Identity      : éditeur/auteur, URL directe de la ressource, dépôt, homepage, statut
Purpose       : problème résolu, périmètre exact, ce que ce n'est PAS
Technology    : langage, framework, dépendances, moteur, format de sortie, compatibilités
Access        : méthode de récupération (R1–R15), prérequis, compte requis ?, CLI ?, API ?
AI            : AI-readiness 0–5 + justification ; MCP/Skill/API machine si existe
License       : classe (§7) + licence exacte + conditions + source de vérification
Practical value: mise en œuvre (temps), qualité de sortie, apprentissage, limites
Discovery     : Implementation / Design / Learning / Production / AI / Inspiration (0–3)
Relations     : alternative à · complément de · construit avec · dépend de · wrapper de · fork de · remplace
Confiance     : [API] / [V] / [S] / [W] / [?]
```

Ce gabarit est **obligatoire pour les Tier A et B**, condensé (une ligne de tableau) pour les Tier C, et adapté pour les fiches MCP/Skills du document 06 (champs : outils exposés, installation, clients compatibles, permissions, risques, maintenance, popularité, dernière activité).
