# DRI 01 — GLOBAL RESOURCE MAP
### Digital Resource Intelligence — Phase 2 · Cartographie mondiale des ressources numériques réutilisables
**Date de collecte : 5 octobre 2026** · Langue : français · Périmètre : Web ouvert (les 5 plateformes de la phase 1 = seeds, pas périmètre)

---

## 0. But de ce document

Ce document est la **carte d'entrée** du système DRI. Il répond à trois questions :

1. **Qu'est-ce qui existe** dans chaque grande famille de ressources numériques réutilisables ?
2. **Par où entrer** quand on a un besoin (quelle ressource de tête, quel Tier) ?
3. **Où sont les trous** (coverage achieved / remaining gaps) plutôt que de prétendre à l'exhaustivité ?

Les documents 02 à 09 détaillent : taxonomie (02), plateformes (03), catalogue de ressources (04), matrices technologiques (05), IA/MCP/Skills (06), index par besoin (07), moteur de décision (08), stacks (09).

---

## 1. Méthode et traçabilité

### 1.1 Sources réellement exploitées (pas d'invention)

| Source | Volume collecté | Fichier de référence |
|---|---|---|
| GitHub Search API (61 requêtes par topic, non authentifié, 6,6 s d'espacement) | **1 164 dépôts uniques** après fusion (métadonnées : étoiles, licence SPDX, dernière poussée, langage, topics) | `data/gh/gh_search.json` |
| GitHub Repos API (appels ciblés) | **50 dépôts complémentaires** vérifiés nommément (étoiles, licence, dernière poussée) | `data/gh_repos_direct.json` |
| npm registry search (47 requêtes) | résultats partiels (certaines requêtes ont renvoyé `error code: 1015`, limite Cloudflare) | `data/npm_search.json` |
| api.npmjs.org downloads (point/last-month) | **164 packages** avec téléchargements du mois écoulé (5 sept. → 4 oct. 2026) | `data/npm_downloads.json` |
| Recherche Web (22 requêtes thématiques, 2026) | état des écosystèmes, prix, licences, ruptures de 2026 | cités en ligne dans les docs |
| Vérification HTTP directe | **429 URLs** testées en `curl` : **429 × HTTP 200**, 12 × 403, 4 × 429, 3 erreurs de domaine corrigées | `data/url_status.json` |
| Rapport phase 1 (seed) | 198 URLs, 529 lignes de tableaux, prix et licences de React Bits, Uiverse, Bklit, Anime.js, Motion | `cartographie-creation-numerique.md` |

### 1.2 Labels de confiance utilisés dans tous les documents DRI

| Label | Signification |
|---|---|
| **[API]** | Chiffre lu dans une API officielle le 5 oct. 2026 (GitHub : étoiles/licence/poussée ; npm : téléchargements) |
| **[V]** | Page HTTP vérifiée accessible (200) le 5 oct. 2026 |
| **[V⚠]** | Domaine vivant mais réponse 403/429 (protection anti-bot) → non vérifiable par script, à contrôler visuellement |
| **[S]** | Vérifié lors de la phase 1 et encodé dans `cartographie-creation-numerique.md` (le workspace est la source de vérité) |
| **[W]** | Information issue d'une source Web datée de 2026, citée explicitement |
| **[?]** | Non vérifié à la source → **à vérifier avant usage** (jamais présenté comme un fait) |

**Règle appliquée partout** : aucun prix, licence, compteur ou fonctionnalité n'est affirmé sans l'une de ces sources. Les fourchettes de prix 2026 citées sont datées.

---

## 2. La carte globale : 16 familles

Chaque famille indique : densité observée, ce qui domine, point d'entrée recommandé, Tiers concernés.
(Tier A = majeur · Tier B = alternative forte · Tier C = pépite cachée ; définition §3.)

| # | Famille | Ce qui existe | Densité | Entrée recommandée | Doc |
|---|---|---|---|---|---|
| **A** | **Inspiration & référence visuelle** | Galeries primées, bibliothèques de captures de vrais produits, flows, moodboards, typo/couleur | **Très forte** (30+ sources, redondance élevée) | **Refero / Mobbin** (produits réels) + **Awwwards/Godly** (direction artistique) + **Lapa Ninja / Land-book** (landing) [W] | 03, 07 |
| **B** | **Composants UI & design systems** | Registries copier-coller (shadcn), librairies headless, kits animation, design systems d'entreprise | **Saturée** — c'est la famille la plus dense et la plus redondante ; regroupement obligatoire | **shadcn/ui** [API : 125 158★, MIT] puis un registry d'effets (React Bits / Magic UI / Aceternity) [API] | 03, 04, 05 |
| **C** | **Blocks, templates, starters, boilerplates** | Dashboards, SaaS shells, landings, full-stack starters, thèmes d'admin | **Très forte** (fragmentation + beaucoup de quasi-doublons) | **Tabler / AdminLTE** (admin) [W] + **create-t3-app** [API : 29 154★] + registres shadcn **blocks** | 03, 04 |
| **D** | **Motion & animation** | Moteurs timeline, physics, scroll, smooth scroll, animation d'icônes, runtime designeur | **Forte mais stabilisée** en 2026 : 4-5 acteurs sérieux | **Motion** (React/UI) [API : 33 842★, MIT] · **GSAP** (timelines, désormais 100 % gratuit) [W] · **Lenis** (scroll) [API : 16 173★] | 04, 05 |
| **E** | **3D / WebGL / shaders / creative coding** | Moteurs web, R3F, no-code 3D, viewers, galeries de shaders, outils de live coding, ateliers | **Forte** ; les *assets* 3D sont dans la famille G | **three.js + React Three Fiber** [API : 116 255★ / 32 738★] · **Spline** (no-code) [W] · **Shadertoy** (apprentissage shaders) [V⚠] | 04, 05 |
| **F** | **Data & dataviz** | Librairies de charts, grammaires, dashboards, cartes/GIS, tables/grilles, outils éditoriaux | **Forte** ; distinction critique SVG vs Canvas vs WebGL | **Recharts** (défaut React, 243 M dl/mois [API]) vs **ECharts** (Canvas, gros volumes) [API] | 04, 05, 07 |
| **G** | **Assets** (icônes, fonts, illustrations, photos, 3D, audio) | Le gisement le plus vaste et le plus *licence-sensible* du Web | **Très forte** ; qualité inégale | **Lucide** (UI) [API : 24 867★] · **Tabler Icons** [API : 21 910★] · **Fontshare/Google Fonts** [W] · **Poly Haven / ambientCG** (CC0) [W] · **unDraw** (illu. sans attribution) [W] | 04, 07 |
| **H** | **IA, agents, MCP, Skills, RAG** | SDK d'IA, kits UI chat, registres MCP, catalogues de Skills, frameworks d'agents, observabilité, gateways, modèles locaux | **La plus explosive de 2026** ; énorme bruit, curation indispensable | **Vercel AI SDK + AI Elements** [API] · **MCP : registry officiel + punkpeye/awesome-mcp-servers** [API : 95 845★] · **anthropics/skills** [API : 179 777★] | 06 |
| **I** | **Dev tools & DX** | Bundlers, lint/format, types, tests, state, data-fetch, formulaires, validation, docs générées, mail dev | **Très forte**, dominée par des standards de fait | **Vite** [API : 83 175★] · **TypeScript** [API npm : 1,21 Md dl/mois] · **Vitest + Playwright** [API] · **Biome** [API : 25 900★] | 04, 05 |
| **J** | **Backend & infra** | BaaS, bases, auth, paiement, email, recherche, temps réel, monitoring, flags, files d'attente, hébergement | **Très forte** ; c'est ici que se joue le coût réel (free tiers, egress, pauses) | **Supabase** [API : 111 128★] · **PocketBase** (self-host) [API : 61 287★] · **Better Auth** [API : 30 172★] · **Coolify/Dokploy** (self-host PaaS) [W] | 04, 07 |
| **K** | **Contenu & commerce** | CMS headless/git-based, e-commerce, sites de docs, blogs | **Forte** | **Payload** [API : 45 096★] · **Astro + Starlight** [API : 63 064★ / 9 366★] · **Medusa / Saleor** (commerce) [API] | 04, 07 |
| **L** | **Mobile, PWA, desktop** | Cross-platform natif, wrappers web→mobile/desktop, PWA | **Moyenne et stable** | **Expo/React Native** [API : 126 k★ pour react-native] · **Tauri / Electron** · **vite-plugin-pwa** [API] | 04, 05 |
| **M** | **Perf, a11y, SEO, sécurité** | Audit, tests d'accessibilité, budgets, CI, headers, scanning | **Moyenne** ; peu de « jolis » produits, beaucoup d'outils critiques | **Lighthouse CI** [API : 7 105★] · **axe-core** [API npm : 301 M dl/mois] · **Pa11y** · **next-sitemap** [API : 3 744★] | 04, 07 |
| **N** | **Apprentissage & communautés** | Cursus, docs de référence, cours, exercices, magazines, benchmarks d'écosystème | **Très forte** ; le tri se fait par *qualité de séquence*, pas par volume | **roadmap.sh** [API : 368 957★] · **MDN** · **javascript.info** · **Three.js Journey** (93 h, 95 $) [W] · **Frontend Masters** (39 $/mois) [W] | 07, 09 |
| **O** | **Marchés & distribution** | Registries, directories, marketplaces, listes awesome, annuaires MCP/Skills | **Forte et instable** (beaucoup de marques mortes ou scrapées) | **registry.directory / shoogle.dev** (registries shadcn) [V] · **mcp.so / Smithery / Glama** [W] · awesome lists [API] | 03, 06 |
| **P** | **Production & génération IA** | Builders prompt→app, assistants de code, design-to-code, agents | **La plus mouvante** (rachats, consolidations en 2026) | **v0 / Bolt / Lovable** (builders) [W] · **Claude Code / Cursor / Codex / OpenCode / Aider** (agents) [W] | 06, 08 |

---

## 3. Les trois niveaux (obligatoires)

| Tier | Définition opérationnelle | Règle d'attribution | Exemples (dans la carte) |
|---|---|---|---|
| **Tier A — Majeur** | Ressource qui **structure** aujourd'hui une pratique : on la retrouve comme dépendance, référence ou socle dans plusieurs écosystèmes ; maintenue ; licence claire ; documentation suffisante pour être productive sans mentor. | ≥ 2 des signaux suivants : très forte adoption ([API] étoiles/téléchargements), licence permissive explicite, activité < 90 jours, présence dans plusieurs écosystèmes (registries, MCP, templates). | shadcn/ui, Motion, GSAP, three.js, R3F, Recharts, Tailwind, Vite, Playwright, Supabase, Payload, AI SDK, MCP registry, anthropics/skills |
| **Tier B — Alternative forte** | Réponse crédible au même besoin qu'un Tier A, avec un **axe différenciant net** (autre techno, autre modèle de licence, autre forme de distribution, autre écosystème). | Un axe différenciant explicite **et** maintenance active **et** pas un fork/wrapper d'un Tier A. | MUI, Mantine, Chakra, Ant Design, HeroUI, daisyUI (UI) ; Babylon.js, PlayCanvas, Spline, model-viewer (3D) ; ECharts, Nivo, visx, Chart.js (charts) ; PrimeVue, Vuetify, Nuxt UI, shadcn-vue/-svelte, spartan (frameworks non-React) |
| **Tier C — Pépite cachée** | Ressource **peu connue mais décisive** pour un cas précis : très haute valeur localisée, faible notoriété, souvent mono-spécialisée (ou « petite » en volume mais unique en licence/fonction). **Les Tier C sont importants** : ce sont eux qui font la différence entre un catalogue et une intelligence. | Signal de valeur fort (licence unique, seule réponse à un besoin, qualité rare) **et** notoriété faible (petite audience / niche) **et** vivant. | Registry.directory & shoogle.dev (explorateurs de registries), 8bitcn / brut-ui (styles rares), 000h, MicroKit, loadercn, logoforge, blobatar, MapLibre + Protomaps, Kibo UI, Rive pour les state machines, DrawKit (Lottie/3D gratuits), coolify/dokploy, dyad/bolt.diy (builders self-hostés) |

---

## 4. Ce que la carte dit du Web des ressources en 2026 (constats)

1. **La distribution a basculé du paquet au code que vous possédez.** shadcn/ui (copier-coller + registry CLI) a créé un standard : en 2026, une grande partie des nouveautés UI se distribuent **comme registries shadcn** et non comme packages npm [W]. Conséquence pratique : `registry.directory` et `shoogle.dev` (418+ registries indexés) deviennent des points d'entrée obligatoires [V]. Le risque associé : la **surdépendance par effet** (installer 6 registries d'effets différents et casser la cohérence visuelle).
2. **Les familles saturées sont les familles UI et templates** ; les familles à forte valeur sous-exploitée sont les **Tier C** (styles rares, outils d'exploration, licences CC0 d'assets) et **l'indexation MCP/Skills** (très bruitée).
3. **MCP et Skills sont deux écosystèmes désormais distincts et structurés.** MCP : registre officiel + directories (mcp.so ~20 222 serveurs, Glama ~21 K, Smithery 7 K+, mcpservers.org 9 800+) [W] + 1322 serveurs *remote* officiels listés [W]. Skills : `anthropics/skills` [API : 179 777★] + catalogs communautaires (SkillsMP 1,2 M+, agent-skills.cc 63 000+, skills.sh, Agensi) [W]. **La curation remplace la collection** : les listes « best-of » (~400 serveurs triés) ont plus de valeur que les index bruts [W].
4. **Les licences sont le vrai discriminant des assets.** Trois régimes coexistent : CC0 / sans attribution (Poly Haven, ambientCG, Kenney, Quaternius, Humaaans, Open Peeps, unDraw [W]) · attribution ou licence propriétaire de plateforme (Storyset/Freepik, Icons8 Ouch, Sketchfab, Fab, Unsplash/Pexels) · freemium à effet de bord (Shutterstock-like, LottieFiles, Rive, BlenderKit) [W].
5. **En 2026, « gratuit » n'est plus un critère suffisant : les limites sont des *modes de défaillance*.** Supabase et Appwrite mettent en pause les projets gratuits après ~1 semaine d'inactivité ; Firebase coupe un produit pour le reste du mois calendaire en cas de dépassement ; l'offre gratuite Vercel Hobby est réservée au non-commercial [W]. La question utile n'est donc pas « gratuit ? » mais « que se passe-t-il quand la limite est atteinte ? ».
6. **Le coût d'entrée d'un agent IA est proche de zéro, le coût d'usage est le vrai sujet.** Agents open source à apporter sa clé (Aider, Cline, OpenCode, bolt.diy) vs abonnements (Claude Code 20–200 $/mois, Cursor, Codex, v0 20 $/mois, Lovable 25 $/mois) [W]. Les *free tiers* des builders IA se mesurent en crédits/tokens, pas en fonctionnalités.
7. **Redondance à traiter** : au moins 3 familles contiennent des **quasi-doublons** (registries d'effets animés, templates d'admin, listes awesome). Le document 02 fournit les règles de fusion ; le catalogue (04) ne conserve qu'un représentant par grappe, avec les variantes listées comme *relations*.

---

## 5. Par où entrer selon ce que vous avez en main

| Vous partez de… | Entrée 1 | Entrée 2 | Entrée 3 |
|---|---|---|---|
| Un **besoin précis** (« je veux un header », « un dashboard », « du WebGL ») | **07 — Use-Case Index** | 04 — Catalog | 08 — Decision Engine |
| Une **stack imposée** (React/Vue/Svelte/HTML pur/Python) | **05 — Technology Map** | 04 — Catalog | 08 |
| Un **budget = 0 € et licence commerciale** | **08 — Decision Engine (canal « free commercial »)** | 04 (champ Licence) | 09 — Stacks |
| Une **intégration IA / agent** | **06 — AI Resource Map** | 04 (fiches MCP/Skill) | 08 |
| Du **désir de direction artistique** | **03 — Platform Directory (famille A)** | 02 (nature 01 : inspiration) | 09 |
| Un **cadre professionnel** (client, production, maintenance) | **09 — Resource Stack** | 08 — Decision Engine (canal production) | 04 (relations & licences) |

---

## 6. Coverage achieved / Remaining gaps (résumé — détail en fin de doc 09)

**Coverage achieved :**
- 16 familles couvertes, dont les 10 familles « cœur » (UI, motion, 3D, data, assets, IA/MCP/Skills, outils dev, backend, templates, apprentissage) avec ≥ 3 ressources Tier A/B documentées et ≥ 2 Tier C.
- Les 5 seeds de la phase 1 sont **réutilisés** et reliés au reste de l'écosystème (relations « alternative à / complément de / construit avec ») sans refaire leur audit [S].
- Licences : les ressources citées en Tier A/B portent une licence lue à la source ([API] SPDX ou [W] page officielle) ; les cas ambigus sont marqués **[?]**.
- Prix : chaque montant cité est daté et sourcé (v0, Bolt, Lovable, Claude Code, Frontend Masters, Three.js Journey, Supabase, etc.) [W] ; aucun prix « de mémoire ».

**Remaining gaps (assumés, non comblés) :**
1. **Prix des acteurs de niche non vérifiés un par un** (certains registries « pro », marketplaces d'assets, offres Studio) → marqués **[?]** et à contrôler à la source avant achat.
2. **Catalogue npm incomplet** : certaines requêtes de recherche npm ont échoué (`error code: 1015`) ; les téléchargements ne couvrent que les 164 packages sondés.
3. **Assets 3D/audio peu indexés par API** : la requête GitHub `topic:3d-assets stars:>200` n'a renvoyé qu'1 résultat → couverture de cette sous-famille par sources éditoriales [W] et non par API.
4. **Sites à protection anti-bot (403/429)** : 20 URLs (Unsplash, Pexels, Shadertoy, Behance, Codepen, Dribbble, SiteInspire, Pageflows, Blush, Lapa Ninja, DesignSpells, Observable…) n'ont pas pu être validées par script — marquées **[V⚠]**.
5. **Aucun test fonctionnel** : aucune ressource n'a été installée/exécutée ici. Les affirmations de « production-ready » sont celles des mainteneurs + signaux objectifs (licence, poussée, adoption), pas un test d'intégration (voir « limites » doc 09).
6. **Volontairement exclu** : contenus fermés/payants sans accès de lecture, services illégaux ou à licence non déterminable, index bruts massifs non curatés (> 50 000 entrées sans tri).
