# DRI 05 — TECHNOLOGY MAP
### Matrices de compatibilité : frameworks, rendu, runtimes, cibles, licences, besoins, phases
**5 octobre 2026** · Légende : **✓** support officiel documenté · **~** support communautaire/port tiers · **✕** non applicable ou non supporté · **?** non vérifié dans cette collecte (à contrôler à la source)

> Les matrices servent à **éliminer vite**, pas à classer. Une cellule `~` signifie « ça marche, mais c'est vous qui maintenez le pont ».

---

## 5.1 Matrice frameworks & langages

| Ressource (nature) | React | Vue | Angular | Svelte | HTML/CSS pur | Tailwind | JS/TS | Python | C#/.NET | 3D | IA |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **shadcn/ui** (N10) | ✓ | ~ shadcn-vue | ~ spartan | ~ shadcn-svelte | ~ Basecoat | ✓ requis | ✓ | ✕ | ✕ | ✕ | ✓ (MCP) |
| **MUI Material** (N05) | ✓ | ✕ | ✕ | ✕ | ✕ | ? | ✓ | ✕ | ✕ | ✕ | ~ |
| **Mantine / Chakra / Ant Design / HeroUI** (N05) | ✓ | ✕ | ✕ | ✕ | ✕ | ~ (HeroUI ✓) | ✓ | ✕ | ✕ | ✕ | ~ |
| **daisyUI / Flowbite / Preline** (N07) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ requis | ✓ | ~ | ~ | ✕ | ~ |
| **Radix / Base UI / React Aria** (N06) | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ~ |
| **Ark UI / Zag** (N06) | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ~ |
| **Bits UI (Svelte) / Reka UI (Vue) / Melt UI (Svelte)** (N06) | ✕ | ✓ (Reka) | ✕ | ✓ | ✕ | ~ | ✓ | ✕ | ✕ | ✕ | ~ |
| **PrimeVue / PrimeReact / PrimeNG** (N07) | ✓ | ✓ | ✓ | ✕ | ✕ | ~ (unstyled) | ✓ | ✕ | ✕ | ✕ | ~ |
| **Vuetify / Quasar / Element Plus / Naive UI** (N07) | ✕ | ✓ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ✕ |
| **Nuxt UI** (N05) | ✕ | ✓ (Nuxt) | ✕ | ✕ | ✕ | ✓ | ✓ | ✕ | ✕ | ✕ | ~ |
| **Ionic** (N07) | ✓ | ✓ | ✓ | ✕ | ~ (web components) | ✕ | ✓ | ✕ | ✕ | ✕ | ✕ |
| **Motion** (N14) | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ~ | ~ |
| **GSAP / Anime.js / Lenis / Theatre.js** (N14) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✓ (GSAP+three) | ~ |
| **Lottie-web / dotLottie** (N14) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ✓ | ✓ | ✕ | ✕ |
| **Rive runtime** (N14) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ? | ? | ✕ | ✕ |
| **three.js** (N15) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✓ | ~ |
| **React Three Fiber / drei** (N15) | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✓ | ~ |
| **Babylon.js / PlayCanvas / PixiJS** (N15) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✓ | ✕ |
| **model-viewer / A-Frame** (N15) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✓ | ✕ |
| **Recharts / Nivo / visx** (N16) | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ~ |
| **ECharts (+ wrappers)** (N16) | ✓ | ✓ | ✓ | ~ | ✓ | ✕ | ✓ | ? | ~ | ~ (GL) | ✕ |
| **D3** (N16) | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✓ | ~ (port) | ~ | ~ | ✕ |
| **Chart.js / ApexCharts / Highcharts** (N16) | ✓ | ✓ | ✓ | ~ | ✓ | ✕ | ✓ | ~ | ✓ (Highcharts/.NET) | ✕ | ✕ |
| **deck.gl / MapLibre / Leaflet / Cesium** (N16) | ✓ | ✓ | ✓ | ~ | ✓ | ✕ | ✓ | ~ | ? | ✓ (deck/Cesium) | ✕ |
| **TanStack Table / Query** (N16/N18) | ✓ | ✓ | ~ (Query) | ✓ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ~ |
| **AG Grid / Handsontable** (N16) | ✓ | ✓ | ✓ | ✕ | ✓ | ✕ | ✓ | ~ | ? | ✕ | ✕ |
| **Zod / Valibot** (N18) | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ✓ schémas |
| **Pydantic** (N18) | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✓ schémas |
| **tRPC / GraphQL / OpenAPI-TS** (N18) | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✓ | ~ | ✓ (.NET GraphQL) | ✕ | ✓ contrats |
| **Hono / Fastify / Express / NestJS** (N18) | ~ client | ~ | ✕ | ~ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ~ MCP |
| **FastAPI / Django / Flask** (N18) | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✓ |
| **ASP.NET Core / Blazor** (N18/N07) | ✕ | ✕ | ✕ | ✕ | ~ | ~ (Blazor+TW) | ✕ | ✕ | ✓ | ✕ | ~ |
| **Drizzle / Prisma / Kysely** (N18) | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ✓ |
| **LangChain / LlamaIndex (JS+Python)** | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✓ | ✕ | ✕ | ✓ |
| **Vercel AI SDK** (N20) | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✓ | ✕ | ✕ | ✕ | ✓ |
| **assistant-ui / CopilotKit / AI Elements** (N20) | ✓ | ✕ | ✕ | ✕ (svelte-ai-elements ~) | ✕ | ✓ | ✓ | ✕ | ✕ | ✕ | ✓ |
| **Chainlit** (N20) | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ | ✕ | ✕ | ✓ |

**Lecture** : trois blocs se dégagent — (1) **React-first** (registries shadcn, MUI, Mantine, R3F, Recharts) ; (2) **framework-agnostique** (GSAP, three.js, Tailwind, ECharts, Iconify, Supabase SDK) ; (3) **Python/C#** quasi absents de la couche UI web moderne, présents sur le **backend et l'IA**. Un projet Python qui veut une UI web riche a aujourd'hui deux ponts : servir une SPA JS, ou utiliser un framework Python dédié (Streamlit/Gradio/Reflex/Chainlit) avec un plafond de personnalisation [?].

---

## 5.2 Matrice de rendu, performance et compatibilité

| Ressource / approche | Rendu | Poids typique annoncé | SSR/SSG | Arbre de dépendances | Perf à l'échelle | AI-ready |
|---|---|---|---|---|---|---|
| Recharts | SVG | ~45 KB gz [W] | ✓ (SVG) | moyen | 1 000–5 000 points puis dégradation [W] | 3 |
| Chart.js | Canvas | ~25–35 KB gz [W] | ✕ (client only) | faible | ✓ jusqu'à ~10 K [W] | 3 |
| ECharts | Canvas/SVG | ~100–300 KB gz [W] | ✕ (client) | lourd | ✓ 100 K+ points [W] | 3 |
| Nivo | SVG/Canvas/HTML | ~60–80 KB gz [W] | ✓ (SVG) | moyen | moyen | 3 |
| visx | SVG (+Canvas manuel) | ~8–20 KB gz [W] | ✓ | minimal | dépend de l'implémentation | 3 |
| D3 | SVG/Canvas | modulaire | ✓ (SSG) | minimal | à optimiser (quadtree…) | 2 |
| three.js | WebGL/WebGPU | ~155 KB gz [W] | ✕ | moyen | excellent si assets optimisés | 3 |
| Lottie-web | Canvas/SVG (WASM pour dotLottie) | ~40 KB gz [W] | ✕ | faible | dépend de la complexité | 2 |
| Motion | DOM/WAAPI | ~8–30 KB gz selon [W] | ✕ (client) | faible | excellent | 3 |
| GSAP | DOM/SVG/Canvas | ~23–30 KB gz [W] | ✕ | faible (plugins séparés) | excellent si on anime transform/opacity | 3 |
| Lenis | scroll natif | ~3 KB [W] | ✕ | nul | excellent | 2 |
| Tailwind CSS | CSS généré | variable (purge) | ✓ | nul à l'exécution | excellent | 4 |
| shadcn/ui (code copié) | DOM | seules vos dépendances | ✓ (RSC partiel) | **la vôtre** | excellent (zéro runtime de lib) | 4 |

**Règle de choix** : SVG tant qu'on reste sous ~5 000 points et qu'on veut du style net à toute échelle ; Canvas au-delà ou pour du temps réel ; WebGL pour > 100 K points ou pour de la 3D [W].

---

## 5.3 Matrice runtimes, hébergement et cibles

| Ressource | Node | Edge/Workers | Serverless | Static | Self-host | Mobile natif | Desktop | PWA | Licence |
|---|---|---|---|---|---|---|---|---|---|
| Next.js | ✓ | ✓ (adaptateurs) | ✓ | ~ | ✓ | ~ (Expo séparé) | ~ | ✓ | MIT |
| Astro | ✓ | ✓ | ✓ | ✓✓ | ✓ | ✕ | ✕ | ✓ | NOASSERTION [API-gh] |
| Nuxt | ✓ | ✓ | ✓ | ~ | ✓ | ✕ | ✕ | ✓ | MIT |
| SvelteKit | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✓ | MIT |
| React Router / Remix | ✓ | ✓ | ✓ | ~ | ✓ | ✕ | ✕ | ✓ | MIT |
| Hono | ✓ | ✓✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✕ | MIT |
| Supabase (cœur) | ✓ | ✕ | ✕ | ✕ | ✓ | SDK ✓ | ✕ | ✕ | Apache-2.0 |
| PocketBase | ✕ (binaire Go) | ✕ | ✕ | ✕ | ✓✓ | SDK ✓ | ✕ | ✕ | MIT |
| Convex | ✓ | ✕ | ✓ | ✕ | ~ (backend OSS) | SDK ✓ | ✕ | ✕ | propriétaire |
| Coolify / Dokploy / CapRover / Dokku | ✓ | ✕ | ✕ | ✓ | ✓✓ | ✕ | ✕ | ✕ | Apache/MIT |
| Cloudflare Pages/Workers | ~ | ✓✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✓ | propriétaire |
| Vercel / Netlify | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✓ | propriétaire |
| Expo / React Native | ✕ | ✕ | ✕ | ✕ | ✓ (EAS cloud) | ✓✓ | ~ | ✕ | MIT |
| Flutter | ✕ | ✕ | ✕ | ✕ | ✓ | ✓✓ | ✓ | ~ | BSD-3 |
| Tauri | ✕ (Rust) | ✕ | ✕ | ✕ | ✓ | ~ | ✓✓ | ✕ | MIT/Apache |
| Electron | ✓ | ✕ | ✕ | ✕ | ✓ | ✕ | ✓✓ | ✕ | MIT |
| vite-plugin-pwa / Workbox | ✕ | ✕ | ✕ | ✓ | ✓ | ✕ | ✕ | ✓✓ | MIT |

---

## 5.4 Matrice IA : ce qui est réellement « agent-natif »

| Ressource | AI-readiness | Canal machine | Installation agent | Permissions / risques |
|---|---|---|---|---|
| **shadcn/ui + registry** | 4 | registry JSON + CLI | `npx shadcn@latest add` | écrit dans votre dépôt (relire le code installé) |
| **shadcn MCP / Magic UI MCP** | 5 | MCP HTTP/stdio | `claude mcp add …` | accès réseau au registre |
| **Context7** | 5 | MCP | idem | lectures de docs (risque faible) |
| **Figma Dev Mode MCP** | 4 | MCP local (app desktop) | activation dans Figma | **siège payant requis** [W] ; accès aux fichiers de design |
| **Playwright MCP** | 5 | MCP | `npx @playwright/mcp` | **pilote un navigateur réel** : sessions, cookies |
| **Chrome DevTools MCP** | 5 | MCP | idem | console, réseau, profiler : données de page |
| **GitHub MCP** | 5 | MCP HTTP OAuth | — | dépôts, CI : **élevé** (droits de repo) |
| **Supabase / Vercel / Netlify / Sentry MCP** | 4–5 | MCP remote OAuth | — | accès infra (clés, déploiements) : **élevé** |
| **anthropics/skills** | 5 | dossier `SKILL.md` | `~/.claude/skills/` ou marketplace | exécution de procédures : auditer avant |
| **SkillsMP / agent-skills.cc / skills.sh** | 3 | index Git | clone/CLI | **aucun scan automatique** : audit manuel obligatoire [W] |
| **Agensi** | 3 | marketplace | achat/téléchargement | **scan sécurité 8 points** revendiqué [W] |
| **Vercel AI SDK / AI Elements** | 4 | packages + registry | `npm i ai` / `npx shadcn add` | clés API côté serveur |
| **assistant-ui / CopilotKit / prompt-kit** | 3–4 | packages | `npm i` | flux de streaming, état |
| **Ollama / llama.cpp / LM Studio** | 4 | API locale | `docker run` / install | **données locales** (avantage souveraineté) |
| **OpenRouter / Replicate / fal** | 4 | API HTTP | SDK | coût par token/appel ; données envoyées |
| **Langfuse** | 5 | SDK + API | self-host ou cloud | traces = contenu utilisateur (RGPD) |
| **v0 / Bolt / Lovable / dyad** | 4–5 | plateforme / auto-host | prompt | **code généré non garanti** ; crédits/tokens |
| **Claude Code / Cursor / Codex / OpenCode / Aider / Cline** | 5 | CLI/IDE + Skills + MCP | install locale | accès au dépôt et au shell : **le risque le plus élevé de toute la carte** |

**Règle de sécurité DRI** : avant de connecter un serveur MCP à un agent, écrire noir sur blanc (a) quelles données il lit, (b) quelles actions il peut déclencher, (c) si un identifiant révocable l'autorise, (d) ce que coûte un appel en boucle. Trois serveurs bien choisis valent mieux que douze installés par curiosité [W].

---

## 5.5 Matrice par besoin (Header, Footer, Dashboard, WebGL, 3D, PWA, Charts, AI Chat, MCP, …)

| Besoin | 1er choix | 2e choix (autre nature) | Tier C utile | Récup. | Licence | AI-ready |
|---|---|---|---|---|---|---|
| **Header / nav** | blocs shadcn (shadcn Space, Kibo) | Tailwind Plus (commercial) | cult-ui (panneau flottant), hextaui | R5 | MIT/OSS | 4 |
| **Hero animé** | React Bits / Magic UI / Aceternity [S/W] | Akella/Aurora CSS pur (Uiverse) [S] | Kokonut UI (SVG animé), 000h | R5/R1 | MIT + conditions | 3–4 |
| **Footer** | blocs shadcn / Tailwind Plus | templates (Tabler) | 21st.dev | R5/R7 | MIT | 3 |
| **Dashboard** | Tabler (design) | shadcn-admin (Next) / Core UI / TailAdmin | Gentelella (Vite vanilla), Metis (Alpine) | R6/R7 | MIT | 2–3 |
| **Charts simples** | Recharts | Chart.js / Nivo | uPlot, shadcnmaps (cartes SVG) | R3/R5 | MIT | 3–4 |
| **Charts volumineux / cartes 3D** | ECharts | deck.gl + MapLibre | Cesium (globe), kepler.gl | R3 | Apache/BSD/propriétaire | 2–3 |
| **Cartes 2D légères** | MapLibre + Protomaps | Leaflet | shadcnmaps (SVG pur) | R3/R12 | BSD/OSS | 3 |
| **Tables / grilles** | TanStack Table | AG Grid (entreprise) | Glide Data Grid, Univer | R3 | MIT / commercial | 3–4 |
| **WebGL / effets 2D** | three.js + R3F | PixiJS / Curtains.js | ogl (minimal) | R3 | MIT | 2–3 |
| **3D produit** | model-viewer (embed) | Spline (no-code) ; R3F (custom) | Poly Haven + gltfjsx | R10/R3 | Apache/OSS/CC0 | 3 |
| **Shaders / art génératif** | Shadertoy (apprendre) | p5.js / Hydra / Shader Park | Dwitter (défi), thi.ng | Web | OSS | 2 |
| **Animation UI React** | Motion | GSAP (+ @gsap/react) | Auto-Animate | R3 | MIT / free-commercial | 3 |
| **Séquence scroll narratif** | GSAP + ScrollTrigger + Lenis | Motion useScroll | ScrollSmoother (si GSAP-only) | R3 | free-commercial / MIT | 2–3 |
| **Animation designeur** | Lottie (illustratif) | Rive (interactif) | DrawKit (Lottie + 3D gratuits) | R3/R12 | MIT/freemium | 2 |
| **PWA / offline** | vite-plugin-pwa + Workbox | Next PWA (next-pwa) | Expo (si mobile natif voulu) | R3 | MIT | 3 |
| **AI Chat UI** | AI Elements (Vercel) | assistant-ui ; prompt-kit ; CopilotKit | scrimui, ElevenLabs UI | R5/R3 | Apache/MIT | 4 |
| **MCP (capacités d'agent)** | registre officiel MCP | punkpeye/awesome-mcp-servers | ClaudePluginHub, PulseMCP, Agent Nexus | R13 | variable | 5 |
| **Skills d'agent** | anthropics/skills | awesome-claude-skills ; SkillsMP | agent-skills.cc, Agensi (scanné) | R15 | variable | 5 |
| **Auth** | Better Auth (OSS) | Supabase Auth ; Clerk (managé) | PocketBase auth (self-host) | R3/R9 | MIT / propriétaire | 3–4 |
| **Paiement** | Stripe | Lemon Squeezy / Polar / Paddle (selon pays) | composants shadcn + webhooks | R9 | propriétaire | 3 |
| **E-mail** | Resend + React Email | Postmark / Loops | Brevo-type régional [?] | R3/R9 | propriétaire (client MIT) | 4 |
| **Recherche** | Meilisearch (self-host) | Typesense / Algolia | Pagefind (statique) | R3/R14 | MIT / propriétaire | 3 |
| **Temps réel / collab** | Supabase Realtime | Liveblocks / Pusher / Ably | Yjs + PartyKit | R9/R3 | Apache/MIT | 3 |
| **Formulaires** | React Hook Form + Zod | TanStack Form + Zod | Formisch | R3 | MIT | 4 |
| **Upload / médias** | UploadThing-type / S3 + presigned | Supabase Storage ; Cloudinary-type | sharp + SVGO côté serveur | R3/R9 | variable | 3 |
| **i18n** | (voir doc 07 §i18n — formats de traduction + ICU) | — | — | R3 | MIT | 3 |
| **SEO technique** | next-sitemap + schema-dts | Astro/Starlight natif | Pagefind | R3 | MIT | 3 |
| **Accessibilité** | axe-core + Lighthouse CI | Pa11y | W3C WAI (référentiel) | R3/R4 | MPL/LGPL | 4 |
| **Perf** | Lighthouse CI + budgets | Web Vitals + Unlighthouse | sharp/SVGO/next-image | R4 | Apache/MIT | 4 |
| **Docs produit** | Astro Starlight | Fumadocs / Nextra / Docusaurus | Mintlify (managé) | R6 | MIT | 4 |
| **Contenu / blog** | Astro + CMS git (Keystatic/Decap) | Payload (CMS complet) | Sanity (managé) | R6/R9 | MIT/variable | 4 |
| **E-commerce** | Medusa | Saleor / Vendure | Bagisto / Spree | R6 | MIT/BSD | 3 |
| **Déploiement gratuit durable** | Cloudflare Pages/Workers | GitHub Pages (statique) | Coolify/Dokploy sur VPS | R6/R14 | propriétaire / Apache | 3 |
| **Déploiement sans lock-in** | Coolify ou Dokploy | Dokku / CapRover | PocketBase + Caddy | R14 | Apache/MIT | 3 |

---

## 5.6 Matrice par phase (10 phases → ressources)

| Phase | Objectif | Ressources de tête | Alternatives | Piège à éviter |
|---|---|---|---|---|
| 1. **Inspiration** | direction visuelle et fonctionnelle | Refero, Mobbin, Awwwards/Recent, Lapa Ninja, Figma Community | Dribbble, Behance, Savee, Designspells | copier une identité au lieu d'en extraire un principe |
| 2. **Cadrage & structure** | pages, blocs, parcours | blocs shadcn, Refero (par type de page), templates Tabler | Tailwind Plus, 21st.dev | empiler des blocs de sources différentes → incohérence |
| 3. **Tokens & typo** | échelle couleur/espace/typo | tweakcn, Style Dictionary + Tokens Studio (voir 07), Fontshare/Google Fonts, Coolors/Realtime Colors | Huemint, Radix Colors-type | tokens Figma non exportés → double maintenance |
| 4. **Composants** | UI accessible et thémable | shadcn/ui + Base UI/Radix/React Aria | MUI, Mantine, PrimeVue, daisyUI, Headless UI | installer 3 registries d'effets → dette visuelle |
| 5. **Motion** | mouvement utile | Motion, GSAP + Lenis, Rive/Lottie | Anime.js, Auto-Animate, Theatre.js | animer le layout, ignorer `prefers-reduced-motion` |
| 6. **Data** | exactitude et lisibilité | Recharts, ECharts, Observable, Datawrapper | Nivo, visx, D3, bklit/Tremor | SVG au-delà de ~5 K points [W] |
| 7. **3D / immersif** | profondeur utile | three.js + R3F, Spline, model-viewer | Babylon.js, PixiJS, PlayCanvas | 3D sans fallback mobile ni état de chargement [W] |
| 8. **IA & agents** | capacité réelle, pas décor | AI SDK + AI Elements, Context7, MCP officiel, anthropics/skills | assistant-ui, CopilotKit, Ollama (local) | connecter des MCP à haut privilège sans périmètre |
| 9. **Backend & intégrations** | comptes, argent, e-mail, données | Supabase/Better Auth, Stripe, Resend, Drizzle | PocketBase, Convex, Appwrite, Hono | free tier de production (pauses/coupures) [W] |
| 10. **Production** | perf, a11y, SEO, sécurité, exploitation | Lighthouse CI + axe-core, Playwright, Sentry, Coolify/Vercel | GlitchTip, Umami/Plausible, Pa11y | déployer sans budget perf ni tests de bout en bout |

---

## 5.7 Matrice licences → usage (synthèse opérationnelle)

| Classe | Utilisable en produit commercial fermé | Modification | Redistribution | Exemples vérifiés |
|---|---|---|---|---|
| **MIT / ISC / BSD / Apache-2.0** | ✓ | ✓ | ✓ (garder la notice) | shadcn/ui, Motion, three.js, Supabase (cœur), Payload, Better Auth [API-gh] |
| **CC0 / domaine public** | ✓ | ✓ | ✓ | Poly Haven, ambientCG, Kenney, Humaaans, Simple Icons [W/API-gh] |
| **OFL (fonts)** | ✓ | ✓ (renommage si modifiée) | ✓ | Google Fonts, IBM Plex, Public Sans [W] |
| **MPL-2.0 / LGPL** | ✓ (obligations par fichier / liaison dynamique) | ✓ | ✓ | axe-core, Satori (MPL) ; p5.js (LGPL) [API-gh] |
| **GPL / AGPL** | **risqué** : obligations de divulgation | ✓ | ✓ | Firecrawl (AGPL), Grafana, Mosaic Lite (GPL) [API-gh/W] |
| **free commercial avec conditions** | ✓ sous conditions | limité | souvent interdit | GSAP (gratuit, non forkable) [W] ; React Bits (MIT + Commons Clause) [S] |
| **free personal only** | ✕ (payant requis) | ✕ | ✕ | Vercel Hobby (non commercial) [W] |
| **freemium** | selon plan | selon plan | ✕ | Spline, Rive, BlenderKit, LottieFiles [W] |
| **commercial / premium** | ✓ après achat | selon licence | ✕ | Tailwind Plus, Motion+, thèmes premium [W/S] |
| **unknown / NOASSERTION** | **✕ tant que non vérifié** | ? | ? | dépôts NOASSERTION : React Bits, Astro, Medusa, Strapi, handsontable, Font Awesome [API-gh] |

> Rappel de la phase 1, toujours en vigueur : **« Licence non suffisamment déterminée — vérifier la licence de la ressource individuelle. »**

---

## 5.8 Matrice « ce que je peux faire sans écrire de code » (no-code / low-code)

| Besoin | Outil sans code | Niveau de contrôle | Limite connue |
|---|---|---|---|
| Design d'interface | Figma, Penpot | total (mais pas du code) | la main-d'œuvre de conversion |
| Design → code | v0, Bolt, Lovable, dyad | moyen | sortie non garantie ; crédits/tokens [W] |
| 3D dans une page | Spline, model-viewer | moyen | personnalisation avancée = code |
| Animation interactive | Rive Editor, Theatre.js Studio | élevé | intégration runtime = code |
| Assets | Poly Haven/ambientCG/Kenney/unDraw | élevé | licence à tracer |
| Graphiques | Datawrapper, Flourish, Observable | moyen | cas très spécifiques = code |
| Site | Webflow/Framer-type | élevé | écosystème propriétaire, migration coûteuse [?] |
| Application interne | Base44, Glide, Bubble | moyen | sortie peu portable [W] |

**Constat 2026** : le no-code a progressé sur **la vitesse de première version**, pas sur **la portabilité**. Toute décision no-code doit être évaluée avec la question : « comment je sors de cet outil ? »


---

## Voir aussi

- [[dri/12-student-plans|Plans étudiants — outils gratuits par technologie]]
