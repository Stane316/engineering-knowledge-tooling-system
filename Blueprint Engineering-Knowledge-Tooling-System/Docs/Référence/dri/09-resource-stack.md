# DRI 09 — RESOURCE STACK
### Essential · Strong · Specialized · Experimental · AI-native — et déclaration de couverture
**5 octobre 2026** · Dernier document du système DRI (01→09)

---

## 9.0 Comment lire ce document
Les documents 01–08 **décrivent** l'espace des ressources. Celui-ci **tranche** : quelles ressources méritent une place permanente dans une bibliothèque personnelle ou d'équipe, à quel niveau de confiance, et **à quelles conditions on les retire**.

Cinq niveaux :

| Niveau | Définition | Engagement | Nombre cible |
|---|---|---|---|
| **Essential** | Socle : la ressource est utilisée ou immédiatement disponible dans presque tous les projets. Retirer = perte de capacité. | fort (apprentissage, intégration) | ~25 |
| **Strong** | Alternative de même niveau, choisie selon le **contexte** (stack, licence, écosystème). | moyen | ~35 |
| **Specialized** | Réponse unique à un besoin précis (3D, e-commerce, audio, mobile…). Sort du placard quand le besoin apparaît. | faible tant que le besoin n'existe pas | ~45 |
| **Experimental** | Pari : prometteur, jeune, ou en recomposition. À tester sur un projet jetable avant adoption. | aucun jusqu'à validation | ~20 |
| **AI-native** | Brique dont la valeur **est** l'automatisation par un agent (MCP, Skills, contrats machine). | fort si vous automatisez | ~18 |

**Critère d'inclusion** : licence déterminée **et** activité < 12 mois **et** (adoption mesurée [API] **ou** valeur unique démontrée). Toute exception est signalée.

---

## 9.1 STACK ESSENTIAL (le socle)

| Couche | Ressource | Nature | Licence | Récup. | AI | Pourquoi c'est essentiel | Preuve |
|---|---|---|---|---|---|---|---|
| Langage | **TypeScript** | N19 | Apache-2.0 | R3 | 3 | contrat unique entre humains, IDE, agents | 1,21 Md dl/mois [API-npm] |
| Build | **Vite** | N19 | MIT | R3/R4 | 3 | démarrage instantané, standard de fait | 83 175★ [API-gh] ; 773 M dl/mois [API-npm] |
| UI (React) | **shadcn/ui + Base UI/Radix/React Aria** | N10/N06 | MIT | R5 | 4–5 | propriété du code, accessibilité, écosystème | 125 158★ [API-gh] |
| CSS | **Tailwind CSS** | N19 | MIT | R3 | 4 | tokens, purge, standard | 97 775★ [API-gh] ; 548 M dl/mois [API-npm] |
| Primitives de styles | **clsx + tailwind-merge + CVA** | N18 | MIT | R3 | 3 | composition de classes sans conflit | 520 M / 358 M / 278 M dl/mois [API-npm] |
| Motion | **Motion** | N14 | MIT | R3 | 3 | animations React/UI, gestes, exit | 33 842★ [API-gh] |
| Motion (séquences) | **GSAP + ScrollTrigger** | N14 | free commercial | R3 | 3 | timelines complexes, désormais gratuit | 28 826★ [API-gh] ; 21,8 M dl/mois [API-npm] |
| Scroll | **Lenis** | N14 | MIT | R3 | 2 | le « feel » premium, 3 KB | 16 173★ [API-gh] |
| Icônes | **Lucide** | N17 | ISC | R3 | 3 | défaut shadcn, 1 780 icônes | 446 M dl/mois [API-npm] |
| Charts | **Recharts** | N16 | MIT | R3 | 3 | 90 % des besoins, base des charts shadcn | 243 M dl/mois [API-npm] |
| Charts lourds | **ECharts** | N16 | Apache-2.0 | R3 | 3 | Canvas, cartes, gros volumes | 67 453★ [API-gh] |
| Tables | **TanStack Table** | N16 | MIT | R3 | 4 | headless, portable, virtuel | 28 473★ [API-gh] |
| Données distantes | **TanStack Query** | N18 | MIT | R3 | 3 | cache, revalidation, états | 50 400★ [API-gh] |
| État client | **Zustand** | N18 | MIT | R3 | 3 | simple, petit, suffisant | 58 789★ [API-gh] |
| Formulaires | **React Hook Form** | N18 | MIT | R3 | 3 | performance, intégration Zod | 240 M dl/mois [API-npm] |
| Validation | **Zod** | N18 | MIT | R3 | 4 | schémas = contrats UI/API/IA | 1,26 Md dl/mois [API-npm] |
| Requêtes serveur | **tRPC** ou **OpenAPI-TS** | N18 | MIT | R3 | 4 | type-safety de bout en bout | 40 692★ [API-gh] |
| Tests unitaires | **Vitest** | N19 | MIT | R3 | 3 | rapide, compatible Vite | 17 183★ [API-gh] ; 454 M dl/mois [API-npm] |
| Tests E2E | **Playwright** | N19 | Apache-2.0 | R3 | 5 | multi-navigateurs **+ MCP officiel** | 97 130★ [API-gh] ; 418 M dl/mois [API-npm] |
| Qualité de code | **Biome** (ou ESLint+Prettier) | N19 | Apache-2.0 | R4 | 3 | lint+format unifiés, rapides | 25 900★ [API-gh] |
| A11y | **axe-core + Lighthouse CI** | N19 | MPL/Apache | R3/R4 | 4 | deux portes obligatoires | 301 M / 7 105★ [API-npm/gh] |
| Docs | **Astro Starlight** | N11 | MIT | R6 | 4 | docs versionnées et rapides | 9 366★ [API-gh] |
| Backend | **Postgres** (+ Drizzle) | N18 | Apache-2.0 | R3/R9 | 4 | compétence transférable, zéro lock-in | 35 959★ [API-gh] ; 100 M dl/mois [API-npm] |
| Auth | **Better Auth** | N18 | MIT | R3 | 3 | OSS, indépendant du fournisseur | 30 172★ [API-gh] |
| Déploiement | **Cloudflare Pages/Workers** (statique/edge) ou **Coolify** (souverain) | N19 | OSS/propriétaire | R6/R14 | 3 | coût fixe, pas de pause de projet | [W] |
| Assets | **Poly Haven + Kenney + unDraw + Fontshare** | N17 | CC0/libre | R12 | 1–3 | usage commercial sans négociation | [W] |

**Règle Essential** : si un projet ne peut pas démarrer sans, la ressource est essentielle. Si elle peut être remplacée en une heure, elle est *Strong*.

---

## 9.2 STACK STRONG (alternatives contextuelles)

| Couche | Si votre contexte est… | Remplacez Essential par | Licence | Pourquoi |
|---|---|---|---|---|
| UI React | entreprise, support long, besoins larges | **MUI** ou **Ant Design** | MIT | composants, thèmes, MUI X |
| UI React | DX dense, hooks inclus | **Mantine** | MIT | batteries incluses |
| UI Vue | entreprise / Nuxt | **PrimeVue** / **Nuxt UI** | MIT | profondeur / intégration officielle |
| UI Svelte | Tailwind + Svelte 5 | **shadcn-svelte + Bits UI** | MIT | même modèle que shadcn |
| UI HTML/Alpine | pas de framework | **daisyUI** ou **Preline** | MIT | classes sémantiques / composants |
| UI Angular | a11y + esthétique shadcn | **spartan/ui** | MIT | primitives Angular |
| Charts | design système maison | **visx** ou **bklit** | MIT | contrôle total / charts « signature » |
| Charts | canvas, gros volumes + cartes | **ECharts** (déjà essentiel) → alternative **Chart.js/Highcharts** | MIT/commercial | selon licence et volumétrie |
| Cartes | qualité managée | **Mapbox** | propriétaire | tuiles et outils |
| Cartes | volume massif / 3D géo | **deck.gl** / **Cesium** | MIT/Apache | GPU, globe |
| 3D | jeu/simulation/ingénierie | **Babylon.js** | Apache-2.0 | outillage intégré |
| 3D | designer, no-code | **Spline** | freemium | livraison rapide |
| 3D | produit simple | **model-viewer** | Apache-2.0 | une balise |
| Animation | designer (After Effects) | **Lottie** | MIT | pipeline designeur |
| Animation | interactive (états) | **Rive** | freemium | state machines |
| Backend | vitesse produit, auth+storage+DB | **Supabase** | Apache-2.0 (cœur) | tout-en-un managé |
| Backend | souveraineté, coût fixe | **PocketBase** | MIT | 1 binaire |
| Backend | réactif TypeScript | **Convex** | propriétaire | synchro temps réel (attention au lock-in) |
| Backend | Python | **FastAPI + Pydantic** | MIT | standard Python |
| Backend | C#/.NET | **ASP.NET Core + Blazor** | MIT | écosystème Microsoft [?] |
| Paiement | contraintes pays | **Lemon Squeezy / Polar / Paddle** | propriétaire | alternatives à Stripe |
| E-mail | volume/entreprise | **Postmark**-type | propriétaire | délivrabilité |
| Recherche | sans serveur (statique) | **Pagefind** | MIT | index en fichier |
| Recherche | typo-tolérance managée | **Algolia** | propriétaire | qualité + coût |
| Temps réel | collaboration riche | **Liveblocks / Yjs** | MIT/payant | CRDT, présence |
| Analytics | produit complet | **PostHog** | MIT/OSS | funnels, flags, replay |
| Monitoring | self-host | **GlitchTip** | OSS | alternative à Sentry |
| Hébergement | Next.js produit | **Vercel Pro** (obligatoire si commercial) | propriétaire | DX et edge |
| Hébergement | Heroku-like self-host | **Dokploy / CapRover / Dokku** | OSS | simplicité |
| Mobile | natif cross-platform | **Expo/React Native** | MIT | écosystème JS |
| Mobile | performance/UI natives | **Flutter** | BSD-3 | rendu propre |
| Desktop | léger | **Tauri** | MIT/Apache | binaire réduit |
| Desktop | mature/écosystème | **Electron** | MIT | compatibilité |
| CMS | code-first complet | **Payload** | MIT | admin généré, TS |
| CMS | git-based | **Keystatic / Decap / Tina** | MIT/Apache | contenu dans le repo |
| E-commerce | JS moderne | **Medusa** | NOASSERTION → vérifier | composable |
| E-commerce | Python/GraphQL | **Saleor** | BSD-3 | headless |

---

## 9.3 STACK SPECIALIZED (à sortir quand le besoin apparaît)

| Domaine | Ressources | Pourquoi elles sont les seules réponses viables |
|---|---|---|
| **WebGL décorrélé de three.js** | PixiJS (2D haute perf), Curtains.js / ogl (effets légers), Shader Park (JS→GLSL), thi.ng (190+ libs TS) | ambiances, jeux 2D, effets d'images |
| **Shaders & art génératif** | Shadertoy, The Book of Shaders, Hydra (live), Dwitter (140 octets), p5.js, Cables.gl, Nannou, openFrameworks | apprentissage, performance live, installations |
| **Dataviz éditoriale** | Datawrapper, Flourish, RAWGraphs, Observable | publier vite sans développement |
| **Cartographie** | MapLibre + Protomaps + Turf + shadcnmaps | sans clé, auto-hébergé |
| **Grilles & tableurs** | AG Grid, Glide Data Grid, Univer, Handsontable (licence à vérifier) | cas « Excel dans le navigateur » |
| **Fichiers & exports** | ExcelJS, SheetJS (activité ralentie), PapaParse, jsPDF, pdf-lib, docx | livrables clients |
| **Médias** | hls.js, Vidstack, Mux/Cloudflare Stream, Tone.js, Howler, Wavesurfer | vidéo et audio en production |
| **3D assets** | Poly Haven, ambientCG, Kenney, Quaternius, KayKit, Mixamo, BlenderKit, Sketchfab, Fab, Smithsonian/NASA, Icosa Gallery | matière première 3D sans négociation de licence |
| **Typographie** | Fontshare, Google Fonts, Font Squirrel, Velvetyne, Collletttivo, League of Moveable Type, Uncut, Open Foundry, Fontesk | identité sans coût de licence |
| **Illustration & photo** | unDraw, Storyset, DrawKit, Blush, Open Peeps, Humaaans, Open Doodles, Pexels, Unsplash, StockSnap, Smithsonian | contenus visuels |
| **Icônes (spécialisées)** | Phosphor (6 graisses), Tabler (volume), Simple Icons (marques), Iconify (150+ sets), Material Symbols, Fluent (17 269 icônes) | couverture et cohérence |
| **Motion design éditeur** | Rive, Lottie/dotLottie, Theatre.js, DRAWKIT (Lottie gratuits) | animations livrées par des designers |
| **Accessibilité avancée** | axe-core, Pa11y, W3C WAI/WCAG, tests lecteur d'écran, Inclusive Sans (typo accessible) | conformité réelle |
| **Performance** | Lighthouse CI, Unlighthouse, Web Vitals, sharp, SVGO, budgets par page | LCP/INP/CLS |
| **Sécurité** | Semgrep, CodeQL, gitleaks, Dependabot/Renovate, Trivy, Snyk | dette et secrets |
| **PWA/offline** | vite-plugin-pwa, Workbox, Pagefind, Workbox-window | installable, hors-ligne |
| **Extensions & plugins** | Manifest V3, bundlers, stores | distribution hors site |
| **Tests d'API** | Hoppscotch, Bruno-type [?], MSW | contrats et mocks |
| **Internationalisation** | formats ICU + solutions managées [?] | pluriels, RTL, dates |
| **Données publiques** | portails open data, listes d'API publiques, Smithsonian/NASA | matière première |
| **Apprentissage spécialisé** | Three.js Journey, Book of Shaders, Wawa Sensei, Frontend Masters (shaders), Exercism, Frontend Mentor | progression par domaine |
| **Communautés** | Discord d'écosystèmes, r/webdev, Frontend Mentor, conférences (State of JS/CSS) | soutien et veille |

---

## 9.4 STACK EXPERIMENTAL (à tester avant d'adopter)

| Ressource | Ce qu'elle promet | Pourquoi c'est expérimental | Protocole de test recommandé |
|---|---|---|---|
| Registries shadcn de niche (000h, MicroKit, scrollxui, soonish, loadercn, brut-ui, 8bitcn) | effets et styles rares, qualité parfois supérieure aux « gros » | petite équipe, maintenance non garantie [W/V] | installer 1 composant, vérifier licence + dépendances, prévoir le remplacement |
| **Chart.ts** | rendu auto SVG→Canvas→WebGL, 50+ types, < 15 KB | projet jeune [W] | comparer sur 10 K points contre ECharts |
| **Animate UI / Motion Primitives / Cult UI** | primitives animées composables | périmètre mouvant [W] | 1 composant en production mineure |
| **Base UI** | successeur headless de Radix | écosystème encore en transition [W] | migrer un seul composant critique, mesurer l'effort |
| **MCP émergents** (DesignRevision, Magic UI, shadcn MCP, Penpot MCP) | agents qui installent de vrais composants | sécurité, permissions, freemium [W] | les connecter à un projet jetable, relire **tout** le code installé |
| **Skills tierces** (catalogues non scannés) | procédures prêtes | aucun audit automatique [W] | lire le `SKILL.md`, tester sur branche isolée |
| **Builders self-hostés** (dyad, bolt.diy) | génération d'app sans abonnement | qualité variable, exploitation à votre charge [W] | un prototype jetable, jamais un client |
| **Agents de code BYOK récents** (OpenCode, Cline, Aider) | liberté de modèle, coût contrôlé | marché en recomposition (rachats, dormance) [W] | usage quotidien 2 semaines sur un dépôt non critique |
| **Antigravity / Trae / Windsurf** | alternatives aux IDE établis | consolidation en cours [W] | ne pas standardiser l'équipe dessus |
| **Cloudflare Workers comme primitive unique** | edge-first | bascule Pages → Workers documentée [W] | valider le support de votre framework |
| **Penpot** | design + DTCG open source | écosystème plus jeune que Figma [W] | un flux complet design→tokens→code |
| **Frameworks Python UI (Streamlit/Gradio/Chainlit/Reflex)** | UI web sans JS | plafonds de personnalisation [?] | un outil interne, jamais le produit phare |

**Règle d'adoption** : rien ne passe d'Experimental à Strong sans **un projet réel terminé** avec la brique dedans, et une réponse écrite à : licence ? plan de sortie ? qui maintient ? coût à l'échelle ?

---

## 9.5 STACK AI-NATIVE (automatisation)

| Brique | Rôle dans la boucle | Ressource | Licence | Statut |
|---|---|---|---|---|
| **Composants** | l'agent installe du code réel, pas de l'approximation | shadcn/ui + registries + **shadcn MCP** | MIT / OSS | production [W] |
| **Documentation** | éviter les API périmées | **Context7** (MCP) | MIT | production [API-gh 62 716★] |
| **Vérification** | l'agent prouve au lieu de supposer | **Playwright MCP + Chrome DevTools MCP** | Apache-2.0 | production [API-gh] |
| **Design → code** | structure réelle, tokens | **Figma Dev Mode MCP** (siège payant) / Framelink (gratuit) / Penpot (OSS) | propriétaire/OSS | production [W] |
| **Capacités externes** | fichiers, base, recherche, dépôt, paiement | MCP ciblés (3 max) + registre officiel | variable | à périmètre borné [W] |
| **Procédures** | conventions d'équipe encodées | Skill maison (`SKILL.md`) + `AGENTS.md` + `anthropics/skills` | variable | production [API-gh 179 777★] |
| **UI IA** | chat, streaming, citations, outils | **AI Elements + AI SDK** | Apache/MIT [?] | production [W] |
| **Agents de code** | production quotidienne | un BYOK (OpenCode/Cline/Aider) + un abonnement lourd | OSS/propriétaire | à réévaluer tous les 6 mois [W] |
| **Automatisation** | tâches métier | n8n / Dify / Trigger.dev | OSS/variable | production [API-gh] |
| **RAG** | connaissance interrogeable | pgvector + LlamaIndex/Dify | OSS | production (qualité = évaluation) |
| **Observabilité** | coûts et traces | Langfuse | OSS/propriétaire | indispensable [V] |
| **Modèles** | coût, latence, souveraineté | OpenRouter (multi), Ollama (local), Replicate/fal (média) | propriétaire/OSS | production |
| **Builders** | prototype ultra-rapide | v0 / Bolt / Lovable / dyad | freemium/OSS | **prototype seulement** [W] |

**Règle AI-native** : chaque brique doit répondre à « **que se passe-t-il si on la débranche ?** ». Si la réponse est « on ne peut plus travailler », ce n'est plus un outil, c'est une dépendance critique — à traiter avec le même sérieux qu'une base de données.

---

## 9.6 Trois stacks complètes selon le profil

### A. Solo / lanceur (budget serré, produit vendu)
`TypeScript + Next (ou Astro si contenu) + Tailwind + shadcn/ui + Recharts + TanStack Query + Zod + Better Auth + Postgres (Supabase Pro ou VPS) + Stripe + Resend + Vitest/Playwright + Cloudflare Pages ou Vercel Pro + Plausible + Sentry + AI Elements (optionnel)`
**Coût de départ estimé** : 25–45 $/mois (hors IA). **Licences** : MIT/Apache/CC0 dominants. **Risque principal** : rester sur un free tier [W].

### B. Studio design engineer (qualité visuelle, identité forte)
`Figma/Penpot + Tokens Studio + Style Dictionary + Fontshare + shadcn/ui + Base UI + Motion + GSAP + Lenis + Rive/Lottie + Spline ou R3F (si 3D) + bklit/visx (data signature) + brut-ui/000h (style rare) + Storybook + Chromatic-type + Vercel Pro`
**Coût** : 0–60 $/mois selon outils design. **Risque principal** : empiler des registries et perdre la cohérence [W].

### C. Équipe produit / entreprise
`TypeScript + MUI ou PrimeVue (selon framework) + TanStack Query/Table + Zod + tRPC/OpenAPI + NestJS/FastAPI + Postgres + Prisma/Drizzle + Clerk/WorkOS (SSO) + Stripe + Playwright + Lighthouse CI + axe-core + Sentry + PostHog + Starlight + Coolify/Dokploy ou Vercel Enterprise`
**Coût** : sièges + infra. **Priorités** : contrats, CI, documentation, observabilité. **Risque principal** : dette de design system et multiplication des outils d'agent.

---

## 9.7 Protocole de maintenance de la bibliothèque (pour que ces documents ne pourrissent pas)

| Fréquence | Action | Comment |
|---|---|---|
| **Mensuel** | Vérifier les **Tier A** de votre stack active : dernière poussée [API-gh], releases, CVE | 15 min : GitHub + npm + advisories |
| **Trimestriel** | Rejouer la vérification HTTP des URLs utilisées ; relire les **licences** des ressources intégrées | `data/url_status.json` + pages officielles |
| **Trimestriel** | Vérifier les **prix** des services payants (agents IA, hébergement, base) | pages de tarifs datées |
| **Semestriel** | Revue des **canaux** du Decision Engine (08) : votre contexte a-t-il changé (équipe, budget, pays, conformité) ? | 1 h de révision |
| **Semestriel** | Nettoyer : tout ce qui n'a pas servi en 6 mois passe en *Experimental* ou sort | discipline anti-collection |
| **Annuel** | Rejouer une collecte automatisée (GitHub + npm + URLs) et comparer | scripts en annexe 9.9 |

**Signaux de mort d'une ressource** (à surveiller) : dernière poussée > 12 mois sans release [API-gh] · dépôt archivé · licence changée (ex. passage à un modèle propriétaire) · rachat avec archivage de l'outil amont (cas documentés en 2026 : Continue.dev archivé après acquisition, Gemini CLI fusionné) [W] · documentation disparue · dépendance non mise à jour qui bloque vos montées de version.

---

## 9.8 Limites méthodologiques (à énoncer, pas à cacher)

1. **Aucune ressource n'a été installée ni exécutée** dans cette collecte : les jugements de « production-ready » reposent sur des signaux objectifs (licence, activité, adoption, documentation) et sur les déclarations des mainteneurs — **pas** sur un test d'intégration.
2. **Les prix sont datés du 5 octobre 2026** et proviennent de sources publiques 2026 ; plusieurs sources se contredisaient (Mobbin, Awwwards) → marqués **[?]**.
3. **Le comptage npm est partiel** : 164 packages sondés ; certaines requêtes de recherche npm ont échoué (`error code: 1015`).
4. **Les étoiles GitHub mesurent l'attention, pas la qualité** — une source 2026 le rappelle explicitement pour OpenCode (étoiles élevées ≠ usage quotidien) [W]. Nous les utilisons comme **signal**, jamais comme verdict.
5. **20 sites n'ont pas pu être validés** (403/429 anti-bot) : leur contenu n'a pas été lu dans cette phase.
6. **Les affirmations de performance des agents IA** (SWE-bench, Terminal-Bench) sont **rapportées**, non reproduites.
7. **Le Web des ressources change vite** : la couche IA (agents, builders, MCP) peut être obsolète en quelques mois ; la couche assets (CC0, fonts) est stable par nature.
8. **Aucune exhaustivité n'est revendiquée** : « Catalogue partiellement accessible avec les outils disponibles » (règle de la phase 1, toujours en vigueur).

---

## 9.9 Coverage achieved / Remaining gaps (déclaration finale)

### ✅ Coverage achieved
- **16 familles** couvertes, **25 natures** distinguées, **10 grappes de doublons** identifiées et traitées par règles de fusion (02 §5).
- **1 214 dépôts GitHub** documentés (1 164 via 61 requêtes + 50 appels ciblés) avec étoiles, licence SPDX et dernière poussée ; **164 packages npm** avec téléchargements du mois.
- **429 URLs vérifiées en HTTP 200** ; 20 sites à protection anti-bot identifiés et signalés.
- **Trois niveaux peuplés** : Tier A (socle, ~35 ressources), Tier B (alternatives contextuelles, ~45), **Tier C (pépites, ~60)** — les Tier C sont explicitement traités comme livrable (registry.directory, shoogle.dev, 000h, MicroKit, loadercn, logoforge, blobatar, shadcnmaps, 8bitcn/brut-ui, uPlot, Chart.ts, Gentelella, Metis, GlitchTip, dyad/bolt.diy, agent-skills.cc, Agensi, ClaudePluginHub, Icosa Gallery, Smithsonian/NASA 3D, DrawKit, Inclusive Sans…).
- **Licences classées** (permissive / copyleft / free commercial / free personal only / freemium / premium / commercial / unknown) avec la règle « accessible ≠ libre » et le rappel des dépôts NOASSERTION.
- **Prix sourcés et datés** pour les décisions coûteuses : hébergement, BaaS, builders IA, agents, cours, outils design.
- **Matrices** : frameworks/langages (34 lignes), rendu/perf, runtimes/cibles, IA, 48 besoins, 10 phases, licences, no-code.
- **MCP et Skills indexés** avec les champs imposés (outils exposés, installation, clients, permissions, risques, licence, maintenance, popularité, dernière activité) + **checklist de sécurité en 8 points**.
- **Decision Engine à 8 canaux** + arbres de décision + réponse complète type chiffrée + protocole de maintenance.

### ⚠️ Remaining gaps (assumés)
1. **Index MCP/Skills non exhaustifs** (20 K+ serveurs, 1,2 M+ skills revendiqués) : nous documentons les catégories et les serveurs à enjeu, pas les longues traînes.
2. **Qualité des Skills tierces non vérifiable à distance** (aucun scan automatique généralisé) → recommandation procédurale.
3. **Sous-famille « assets 3D/audio » incomplètement indexée par API** (requête GitHub `topic:3d-assets` quasi vide) → couverture éditoriale seulement.
4. **Sites anti-bot non lus** (20) → contenu non évalué.
5. **Prix de niches non vérifiés un à un** (registries « pro », marketplaces d'assets, offres studio) → `[?]`.
6. **Pas de test d'intégration réel** : le DRI dit *quoi choisir et pourquoi*, pas *que ça marche chez vous* — la validation reste un travail de projet.
7. **Couverture linguistique/documentaire** : la collecte est majoritairement anglophone ; les écosystèmes non anglophones (chinois, japonais, coréens) sont sous-représentés, à l'exception des projets déjà mondialisés.

### 🎯 Prochaines extensions possibles (si l'on continue)
- **Verticaliser par métier** : e-commerce, éducation, santé, finance (contraintes réglementaires et ressources conformes).
- **Cartographier les écosystèmes non anglophones** (CN/JP/KR) avec les mêmes fiches.
- **Ajouter un volet « coût total à l'échelle »** : simulations de facture à 10 K / 100 K / 1 M utilisateurs pour les 6 services structurants (hébergement, base, e-mail, recherche, IA, observabilité).
- **Bancs d'essai reproductibles** : projets-tests minimaux pour valider 3 briques concurrentes (ex. ECharts vs Chart.ts vs Recharts sur 50 K points).

### 🧰 Annexes techniques (workspace)
| Fichier | Contenu |
|---|---|
| `data/gh/gh_search.json` | 1 164 dépôts (61 requêtes topic GitHub) |
| `data/gh_repos_direct.json` | 50 dépôts vérifiés nommément |
| `data/npm_downloads.json` | 164 packages, téléchargements du mois |
| `data/npm_search.json` | résultats de recherche npm (partiels) |
| `data/url_status.json` | 429 URLs testées (code HTTP) |
| `data/urls_to_check.txt` · `urls_to_check2.txt` | listes vérifiables / rejouables |
| `gh_search.py` · `npm_probe.py` | scripts de collecte (relançables) |
| `dri/catalogue-dri.csv` | catalogue consolidé (ressource, nature, tier, licence, récup., scores, URL) |
| `cartographie-creation-numerique.md` | rapport de phase 1 (seed, 5 plateformes) |
| `matrice-decision.csv` | matrice de décision de la phase 1 |


---

## Voir aussi

- [[dri/12-student-plans|Plans étudiants — stacks gratuites pour étudiants]]


---

> **Projet connexe** : [[14-harnai-recommendations|HarnAI Recommendations]] — stack optimale pour MCP custom (Qwen-Agent + MCP SDK + Qdrant). Voir [[harnai-moc|MOC HarnAI]].
