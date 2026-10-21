# DRI 07 — USE-CASE INDEX
### De « j'ai besoin de quelque chose » à une réponse complète : ressources, choix, obtention, intégration, coût, licence, alternatives, adaptation
**5 octobre 2026** · Lecture : chaque besoin est traité en **1er choix / alternative / pépite (Tier C) / piège à éviter / USE → UNDERSTAND → ADAPT**

> Récup. = méthode d'obtention (doc 02 §6) · Coût : « 0 » signifie gratuit à l'usage sans plafond bloquant connu ; les fourchettes sont datées du 5 oct. 2026 et **doivent être revérifiées à la source** avant achat.

---

## Bloc 1 — Structure d'interface et contenu

| Besoin | 1er choix (récup.) | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Header / navigation** | blocs shadcn (R5) | Tailwind Plus (R7) | cult-ui (panneau flottant), hextaui | MIT / commercial | nav mobile oubliée ; prévoir focus visible et `aria-current` |
| **Hero animé** | React Bits ou Magic UI (R5/R1) | Aceternity (impact) | Kokonut UI, 000h | MIT + conditions / freemium | effet qui écrase le message ; prévoir `prefers-reduced-motion` et version statique |
| **Grille de fonctionnalités / bento** | blocs shadcn (R5) | Magic UI (R5) | shadcnstore, shadcn Space | MIT/OSS | bento surchargé sur mobile → prévoir 1 colonne |
| **Tarifs / pricing** | blocs shadcn (R5) | Tailwind Plus | Refero (structure à copier) [W] | MIT | incohérence prix/CTA ; vérifier devise et TVA |
| **Témoignages & logos** | blocs shadcn | logoforge (900+ logos typés) [W] | logo cloud sections | OSS | **droits sur les marques** ≠ licence du composant |
| **Footer** | blocs shadcn | template (Tabler) | 21st.dev | MIT | liens sociaux obsolètes / mentions légales |
| **Carte produit / article** | composants shadcn | daisyUI, Preline | MicroKit | MIT | image responsive et `aspect-ratio` oubliés |
| **Page « à propos » / storytelling** | Astro + Starlight/theme (R6) | Next static | HugoBlox | MIT/OSS | animations lourdes sur page peu visitée |
| **404 / états vides** | blocs shadcn (empty states) | elsecase (workflows loading/empty/error) [W] | shadcn loaders | OSS | états d'erreur non stylés = produit qui paraît cassé |

**USE → UNDERSTAND → ADAPT (exemple « hero animé »)** — *Use* : `npx shadcn@latest add` puis coller la variante choisie. *Understand* : le composant repose sur des animations de **transform** et une couche de dégradés ; le coût réel est la composition des couches (`overflow`, `z-index`, GPU). *Adapt* : remplacer la couleur par un token de votre échelle, supprimer 50 % des effets au premier chargement, fournir un fallback sans animation et un test `prefers-reduced-motion`.

---

## Bloc 2 — Données et visualisation

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Charts standard (ligne, barre, aire)** | **Recharts** (R3/R5) — 243 M dl/mois [API-npm] | Chart.js, Nivo | uPlot (ultra-léger) | MIT, 0 | > 5 000 points = SVG étouffé → basculer Canvas [W] |
| **Charts denses / temps réel / cartes 3D** | **ECharts** (R3) | Highcharts (commercial) | deck.gl | Apache-2.0, 0 | bundle 100–300 KB gz → import modulaire [W] |
| **Charts « dans la charte » (design system)** | visx (R3) | bklit / Tremor (R5) | Chart.ts (rendu auto) | MIT / Apache | visx = vous écrivez les axes : prévoir du temps |
| **Dashboard analytique complet** | Tabler (R6) | shadcn-admin (R6), Core UI | Gentelella (Vite vanilla) | MIT, 0 | données factices à remplacer ; dette de design |
| **Table de données (tri, filtre, pagination)** | **TanStack Table** (R3) | AG Grid Community (R3) | Glide Data Grid (canvas) | MIT / MIT+commercial | virtualisation obligatoire au-delà de ~500 lignes |
| **Feuille de calcul type Excel** | Univer (R3) | Handsontable (**licence à vérifier**) | Glide Data Grid | Apache / source-available | formule + historique = complexité réelle |
| **Carte géographique** | MapLibre + Protomaps (R3/R12) | Leaflet, Mapbox (qualité, coût) | shadcnmaps (SVG pur) | BSD/OSS, Mapbox payant | tuiles = coût récurrent ; auto-hébergez si volume |
| **Carte de données massives** | deck.gl (R3) | Cesium (globe 3D) | Kepler.gl | MIT/Apache | GPU requise ; fallback liste/tabulaire |
| **Graphique éditorial rapide (sans code)** | Datawrapper [W] | Flourish, RAWGraphs | Observable notebooks | freemium, 0 | export = image/iframe, pas de composant |
| **Données ouvertes comme matière première** | portails open data | APIs publiques (listes d'API) | Smithsonian/NASA 3D | variable | licence + fraîcheur des données à tracer |

**USE → UNDERSTAND → ADAPT (exemple « dashboard »)** — *Use* : forker un template MIT, remplacer les données par vos endpoints. *Understand* : distinguer **rendu** (charts), **structure** (layout/sidebar), **état** (filtres, période) : trois problèmes différents, souvent confondus. *Adapt* : brancher vos tokens (couleurs, rayons, typo), supprimer les pages non utilisées, ajouter les états vide/chargement/erreur, et **plafonner le nombre de points** avant d'afficher.

---

## Bloc 3 — Formulaires, identité, argent

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Formulaires + validation** | React Hook Form + **Zod** (R3) | TanStack Form, Formisch | conform (action-based, TS) | MIT, 0 | valider **côté serveur** aussi ; messages d'erreur localisés |
| **Validation partagée UI/API/IA** | Zod / Valibot (R3) | Pydantic (Python) | ArkType | MIT, 0 | un seul schéma = source de vérité : ne pas en écrire trois |
| **Authentification** | **Better Auth** (R3) [API-gh 30 172★] | Supabase Auth (R9), Clerk (managé) | PocketBase auth (self-host) | MIT / propriétaire | sessions, rotation de clés, e-mails de vérif : tout est à tester |
| **SSO / entreprises** | WorkOS-type (R9) | Clerk Business | — | propriétaire [?] | exigences clients (SAML) imposent souvent le passage au payant |
| **Multi-tenant / équipes** | starter multi-tenant (R6) | logique maison sur Postgres (RLS Supabase) | — | MIT / 0 | l'isolation des données est **un choix d'architecture**, pas un composant |
| **Paiement / abonnement** | **Stripe** (R9) | Lemon Squeezy, Polar, Paddle (selon pays) | composants de facturation shadcn (corr, PumpGTM) | frais par transaction | **disponibilité par pays** et fiscalité ; tester les webhooks en local |
| **E-mail transactionnel** | **Resend + React Email** (R3/R9) | Postmark / Loops | templates e-mail shadcn (emailcn) | freemium / payant | délivrabilité : SPF/DKIM/DMARC obligatoires |
| **Upload / médias** | S3 + URL signées, ou Supabase Storage | UploadThing-type | sharp + SVGO côté serveur | variable | taille, type MIME, virus, EXIF : à traiter côté serveur |
| **Facturation / PDF** | pdf-lib / jsPDF (R3) | react-pdf | docx + ExcelJS pour les exports | MIT, 0 | polices et accents dans les PDF (piège classique) |
| **Import/export CSV-Excel** | PapaParse + ExcelJS (R3) | SheetJS (**activité ralentie**, vérifier) | Univer | MIT/Apache | dates, décimales, encodage : normaliser avant import |

---

## Bloc 4 — Communication, recherche, temps réel

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Recherche interne** | Meilisearch (self-host) | Typesense, Algolia | **Pagefind** (statique, sans serveur) | MIT / propriétaire | tolérance aux fautes, synonymes, facettes à configurer |
| **Temps réel (présence, curseurs)** | Supabase Realtime | Liveblocks, Pusher, Ably | Yjs + PartyKit | Apache/MIT / payant | coût à l'échelle ; reconnexions à gérer |
| **Édition collaborative** | Liveblocks / Yjs | — | PartyKit | MIT/payant | conflits CRDT non triviaux |
| **Notifications (in-app + e-mail)** | votre modèle + Resend | Novu-type [?] | — | variable | ne pas mélanger notification et message marketing (RGPD) |
| **i18n / multilingue** | format de messages ICU + votre runtime (next-intl-type) [?] | solutions de traduction managées | — | MIT / variable | pluriels, genres, dates, RTL : tester les cas limites |
| **Commentaires / modération** | composants shadcn + votre modèle | services managés | — | 0 | modération = obligation légale potentielle |
| **Chat support** | Crisp/Intercom-type [?] | Deep Chat (web-component OSS) | — | freemium | RGPD : où vont les transcriptions ? |

---

## Bloc 5 — Design system, assets, identité

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Design tokens** | **Style Dictionary** (R3) + Tokens Studio (R11) | Figma Variables natif | Terrazzo ; Penpot (DTCG) | MIT / freemium | format **DTCG** ($value/$type) = portabilité entre outils [W] |
| **Thème shadcn en 2 minutes** | tweakcn / StyleGlide (web) | ruixen/styleglide-type | éditeur de thème shadcn (hextaui) | OSS/freemium | contraste AA à revérifier après génération |
| **Palette accessible** | Realtime Colors / Coolors [W] | Color Hunt (tendances) | Huemint (IA) | 0/freemium | vérifier les contrastes, pas seulement l'harmonie |
| **Typographie** | Fontshare + Google Fonts (R12/R3) [W] | Font Squirrel (sécurité commerciale) | The League of Moveable Type, Velvetyne, Collletttivo, Nohemi | OFL / libre | sous-ensembles (subsetting) + `font-display: swap` |
| **Paires typographiques** | Fontpair, Typewolf | — | — | 0 | lisibilité du corps de texte d'abord |
| **Icônes UI** | **Lucide** (R3, 446 M dl/mois [API-npm]) | Tabler Icons, Phosphor (6 graisses) | Iconify (150+ sets en une API) | ISC/MIT | ne pas mélanger 2 familles stylistiques |
| **Logos de marques** | Simple Icons (CC0) | Font Awesome (Pro 99 $/an) | logoforge | CC0 / commercial | droits de marque ≠ licence d'icône |
| **Icônes animées** | pqoqubbw/icons, animateicons (R5) | heroicons-animated | loadercn (CSS pur, 0 dépendance) | MIT | trop d'animation = bruit |
| **Illustrations** | unDraw (sans attribution) | Storyset (5 styles, attribution), DrawKit (Lottie + 3D gratuits) | Open Peeps / Humaaans / Open Doodles (CC0) | libre/CC0 | unDraw est partout : différencier par la couleur et la composition |
| **Photos** | Pexels / Unsplash (R12) | Pixabay, StockSnap | Smithsonian / NASA (domaine public) | CC0/propre | modèles identifiables, lieux, logos : droits à l'image |
| **Avatars / identités générées** | DiceBear-type, blobatar (registry) | GitHub avatars | — | OSS | génération déterministe = pas de stockage |
| **Images sociales (OG)** | **Satori** (R3) + template | services d'OG managés | générateurs de cartes | MPL-2.0 (attention) | cache/CDN nécessaire ; polices embarquées |
| **Favicons & icônes PWA** | générateurs d'icônes (web) | — | — | 0 | masque `maskable`, contraste sur fonds clairs/sombres |
| **3D : modèles & HDR** | Poly Haven, ambientCG (CC0, API sans clé) [W] | Kenney/Quaternius (jeu), Mixamo (animations) | Icosa Gallery, Smithsonian/NASA | CC0 | compression (Draco/KTX2) et polycount avant publication |
| **Audio** | Freesound-type / Pixabay Audio | Uppbeat, Jamendo (synchro payante) | Tone.js / Howler (lecture) | variable | licences audio = régime séparé ; tracer |

---

## Bloc 6 — Plateformes cibles

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **PWA (offline, install)** | vite-plugin-pwa + Workbox (R3) | next-pwa | Pagefind (offline search) | MIT, 0 | stratégies de cache à écrire ; mises à jour bloquantes |
| **Mobile natif depuis du web** | Expo (React Native) | Capacitor + Ionic | Flutter (autre langage) | MIT/BSD | deux bases de code ≠ un seul produit : tester les gestes natifs |
| **Desktop** | Tauri (Rust, léger) | Electron (mature, lourd) | electron-react-boilerplate | MIT | signature/notarisation = passage obligé |
| **Extension navigateur** | Manifest V3 + bundler | — | — | 0 | règles de publication par store |

---

## Bloc 7 — Motion, 3D, immersif

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Animation d'interface React** | Motion (R3) | Auto-Animate (listes) | Anime.js (léger) | MIT | animer transform/opacity, pas layout [W] |
| **Séquences & scroll narratif** | GSAP + ScrollTrigger + **Lenis** (R3) | Motion `useScroll` | ScrollSmoother (si GSAP-only) | gratuit/OSS | sync obligatoire Lenis↔ScrollTrigger, sinon déclencheurs en retard [W] |
| **Micro-interactions** | MicroKit / 000h (R5) | Uiverse (R1) [S] | loadercn, soonish | OSS | 30 micro-interactions = aucune n'est perçue |
| **Animation designeur (illustrative)** | Lottie / dotLottie (R3) | GIF/vidéo (fallback) | DrawKit (Lottie gratuits) | MIT/freemium | poids du runtime ; préférer `.lottie` compressé |
| **Animation interactive (états)** | **Rive** (state machines) | CSS/JS maison | — | freemium | éditeur propriétaire : prévoir l'export |
| **Effet WebGL de fond** | three.js + R3F (R3) | Curtains.js / ogl (léger) | shader « preset » de React Bits [S] | MIT | GPU mobile ; prévoir fallback image |
| **Produit 3D configurable** | model-viewer (embed) | Spline (designer), R3F (sur mesure) | gltfjsx + Poly Haven | Apache/freemium/CC0 | KTX2/Draco + LOD ; état de chargement obligatoire [W] |
| **Shaders / art génératif** | Shadertoy (apprendre) → intégration | p5.js, Hydra, Shader Park | thi.ng, Dwitter | OSS | recopier un shader auteur = vérifier la licence individuelle |
| **Cours 3D structuré** | Three.js Journey (95 $, 93 h) [W] | Frontend Masters (39 $/mois), Wawa Sensei (70 €) [W] | The Book of Shaders (gratuit) | payant/gratuit | commencer par le gratuit pour valider le style d'apprentissage [W] |

---

## Bloc 8 — IA, agents, automatisation

| Besoin | 1er choix | Alternative | Pépite Tier C | Récup. | Piège & adaptation |
|---|---|---|---|---|---|
| **Chat IA dans un produit** | AI Elements (R5) | assistant-ui, prompt-kit, CopilotKit | scrimui, ElevenLabs UI | R5/R3 | streaming, erreurs partielles, citations : à traiter dès le début |
| **Agent qui installe de vrais composants** | **shadcn MCP** (R13) | Magic UI MCP, DesignRevision MCP | registry.directory (exploration) | R13 | le code installé est **votre** dette : relire |
| **Agent qui vérifie ce qu'il produit** | Playwright MCP + Chrome DevTools MCP (R13) | tests Vitest/Playwright classiques | — | R13 | permissions navigateur à borner |
| **Contexte de documentation à jour** | Context7 (R13) | lire la doc à la main | DevDocs | R13 | évite les API périmées, ne remplace pas la revue |
| **Design → code** | Figma Dev Mode MCP (**siège payant**) [W] | Framelink (gratuit), Penpot (OSS) | v0 avec import Figma | R13/R11 | la qualité dépend de **variables et composants nommés** dans le design |
| **Compétence d'équipe encodée** | Skill maison (`SKILL.md`) + règles dans le dépôt | anthropics/skills, awesome-claude-skills | gsap-skills (officielle) | R15 | écrire des règles courtes et testables ; auditer les Skills tierces |
| **Base documentaire interrogeable (RAG)** | pgvector dans Postgres | Qdrant / Chroma (self-host) | LlamaIndex / Dify | R3/R14 | qualité = découpage + évaluation, pas la base vectorielle |
| **Automatisation de tâches** | n8n (self-host) | Dify, Flowise, Trigger.dev | Windmill | R14 | credentials centralisés = risque majeur |
| **Modèle en local (données sensibles)** | Ollama (R14) | llama.cpp, LM Studio, vLLM | — | R14 | matériel requis ; qualité ≠ modèles frontière |
| **Observabilité des coûts et traces IA** | Langfuse (R14/R9) | logs maison | — | R14 | sans traces, les coûts IA sont invisibles |
| **Prototype d'app complet au prompt** | v0 (UI) / Bolt (full-stack) | Lovable (design-first), dyad/bolt.diy (self-host) | Base44/Glide (interne) | R7 | **code non garanti** : revue, tests, secrets, licences |
| **Agent de code quotidien** | un BYOK (OpenCode/Aider/Cline) + un abonnement lourd | Copilot Business (19 $/siège) | Gemini CLI (gratuit) [?] | R4 | écrire `AGENTS.md` : sinon chaque outil réinvente vos conventions |

---

## Bloc 9 — Contenu, commerce, documentation

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Blog / site de contenu** | Astro + contenu Markdown (R6) | Next statique, Hugo | HugoBlox | MIT, 0 | images non optimisées = LCP dégradé |
| **Documentation produit** | Astro Starlight (R6) | Fumadocs, Nextra, Docusaurus | Pagefind pour la recherche | MIT, 0 | versionner la doc avec le code |
| **CMS pour équipe non technique** | Payload (R6/R3) | Sanity, Directus, Keystatic (git) | TinaCMS (édition sur repo) | MIT/variable | verrouillage éditorial : exporter régulièrement |
| **E-commerce** | Medusa (R6) | Saleor, Vendure | Bagisto, Spree | MIT/BSD | TVA, transport, remboursements : le vrai travail |
| **E-mails marketing / cycle de vie** | Loops-type [?] | Brevo-type régional [?] | — | variable | séparer transactionnel et marketing |
| **Newsletter / changelog** | markdown + service d'e-mail | — | — | variable | consentement (RGPD) |

---

## Bloc 10 — Qualité, production, exploitation

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence / coût | Piège & adaptation |
|---|---|---|---|---|---|
| **Tests unitaires** | Vitest (R3, 454 M dl/mois) | Jest | — | MIT, 0 | tester le comportement, pas l'implémentation |
| **Tests de bout en bout** | Playwright (R3) + MCP pour l'agent | Cypress | Testing Library (tests composants) | Apache/MIT | sélecteurs stables (`role`) pour ne pas casser |
| **Accessibilité** | **axe-core + Lighthouse CI** (R3/R4) | Pa11y, WAVE | W3C WAI (référentiel) | MPL/LGPL, 0 | score ≠ conformité ; tester au clavier et au lecteur d'écran |
| **Performance** | Lighthouse CI + budgets (R4) | Web Vitals + Unlighthouse | sharp/SVGO/next-image | Apache/MIT | budget par page, pas global |
| **SEO technique** | next-sitemap + schema-dts | natif Astro | Pagefind (contenu indexable) | MIT, 0 | contenu utile > balises |
| **Sécurité applicative** | validation Zod + OWASP + Dependabot/Renovate | Semgrep, CodeQL | gitleaks (secrets) | OSS | rotation des clés et périmètre des tokens |
| **CI/CD** | GitHub Actions (R6) | GitLab CI, Coolify pipelines | Dokploy (self-host) | variable | builds lents = friction ; cache obligatoire |
| **Monitoring d'erreurs** | Sentry (R9) | GlitchTip (self-host OSS) | — | freemium/OSS | ne pas logguer de données personnelles |
| **Analytics** | Plausible / Umami (R14) | PostHog (produit complet) | OpenPanel | MIT/freemium | consentement et rétention |
| **Hébergement gratuit** | Cloudflare Pages/Workers | GitHub Pages, Netlify 300 crédits | Surge | 0 | quotas de builds et egress |
| **Hébergement souverain / coût fixe** | **Coolify** ou **Dokploy** sur VPS (R14) | CapRover, Dokku | PocketBase + Caddy | Apache/MIT + VPS | vous exploitez : sauvegardes, TLS, mises à jour |
| **Déploiement standard produit** | Vercel (Hobby non commercial) / Netlify | Render, Railway, Fly.io | Koyeb | 0 → 20 $/dev | lire les conditions d'usage commercial |

---

## Bloc 11 — Apprentissage et progression (par objectif)

| Objectif | Parcours recommandé | Ressources | Coût |
|---|---|---|---|
| **Débuter proprement le web** | roadmap.sh → MDN → freeCodeCamp/Odin → 3 projets | roadmap.sh [API-gh 368 957★], MDN, freeCodeCamp, The Odin Project [W] | 0 |
| **Monter en niveau pro** | Frontend Masters (39 $/mois) + articles ciblés | Josh Comeau, Total TypeScript, web.dev, patterns.dev [W] | 0–39 $/mois |
| **Maîtriser 3D/shaders** | Book of Shaders → Shadertoy → Three.js Journey | 95 $, 93 h, Discord actif [W] | 0–95 $ |
| **Vendre une compétence « design engineer »** | Figma + tokens + registry shadcn + motion | Tokens Studio, Style Dictionary, Motion, AI Elements [W] | 0–12 $/mois |
| **Basculer vers l'IA appliquée** | AI SDK + cookbooks + un MCP + un Skill maison | ai-sdk.dev, openai-cookbook [API-gh], anthropics/skills [API-gh] | 0–20 $/mois |
| **Décider avec des faits** | State of JS/CSS, Stack Overflow Survey, npm trends | [W] | 0 |

**Règle pédagogique DRI** : pour **chaque** ressource utilisée en production, garder 30 minutes de « UNDERSTAND » — lire le code installé, comprendre la dépendance, savoir la retirer. C'est ce qui distingue un stack qui vieillit bien d'un stack qui pourrit.
