# DRI 08 — DECISION MATRIX
### Le Resource Decision Engine : passer d'un besoin à une décision justifiée, chiffrée et réversible
**5 octobre 2026** · Complète 07 (index par besoin) : ici on **arbitre** entre des options viables.

---

## 8.1 Principe : on ne choisit pas une ressource, on choisit un compromis

Toute décision DRI se prend sur **sept critères**, toujours les mêmes. Un « meilleur choix » absolu n'existe pas : il n'existe que des pondérations différentes.

| Critère | Question | Seuils typiques |
|---|---|---|
| **Licence** | Puis-je l'utiliser dans mon modèle économique ? | permissive ✓ · copyleft ⚠ · commercial/unknown ✕ (sauf achat/vérification) |
| **Coût total** | Installation + exploitation + montée en charge + sortie | « 0 aujourd'hui » n'est pas « 0 à 100 K utilisateurs » |
| **Effort d'intégration** | Combien de jours jusqu'à la première version utilisable ? | < 1 j = composant · 1–5 j = template/starter · > 5 j = framework/migration |
| **Autonomie / lock-in** | Que se passe-t-il si je veux partir ? | données exportables ? format ouvert ? spec vs implémentation ? |
| **AI-readiness** | Une IA peut-elle installer, vérifier, faire évoluer ? | 0–5 (doc 02 §4.1) |
| **Maintenance** | Qui répare si ça casse dans 18 mois ? | dernière poussée [API-gh], taille de l'équipe, bus factor |
| **Adéquation au contexte** | La mauvaise ressource bien notée reste un mauvais choix | stack imposée, équipe, client, juridiction |

**Règle des trois questions avant tout choix** (elle élimine 80 % des erreurs) :
1. **Est-ce que je remplace quelque chose que j'ai déjà ?** (sinon j'ajoute de la dette)
2. **Puis-je le retirer en une journée ?** (sinon c'est un engagement long)
3. **Que se passe-t-il au pire moment, quand la limite/le quota est atteint ?** (c'est là que se joue la production)

---

## 8.2 Le Decision Engine : huit canaux de réponse

Chaque canal donne **la réponse courte**, la justification, et **quand changer**.

### Canal 1 — « BEST OVERALL » (si je ne dois choisir qu'une chose)
| Famille | Réponse | Pourquoi | Changer si… |
|---|---|---|---|
| UI React | **shadcn/ui** | propriété du code, écosystème massif, MCP, MIT [API-gh 125 158★] | équipe non-React (PrimeVue/Nuxt UI/Vuetify) ou besoin d'entreprise clé en main (MUI, Ant Design) |
| UI Vue / Svelte / Angular | **PrimeVue / shadcn-svelte / spartan** | profondeur de composants et modèle copier-coller [W] | Nuxt → Nuxt UI ; Angular entreprise → NG-ZORRO/Taiga |
| Motion | **Motion** (React) + **GSAP** (séquences) + **Lenis** (scroll) | partage net des rôles [W] | animation designeur → Rive/Lottie |
| 3D | **three.js + R3F** | écosystème, maintenus, MIT [API-gh] | produit simple → model-viewer ; designer → Spline |
| Charts | **Recharts** (standard) · **ECharts** (volume/cartes) | 243 M dl/mois vs capacités Canvas [API-npm] | design system interne → visx/bklit |
| Cartes | **MapLibre + Protomaps** | pas de clé, tuiles auto-hébergeables | besoin de qualité/outils managés → Mapbox |
| Templates admin | **Tabler** | design + MIT + communauté [W] | Next+shadcn → shadcn-admin |
| Starter SaaS | **create-t3-app** (typé) | conventions solides, MIT [API-gh] | Python/Go → starter équivalent de la stack |
| Backend | **Supabase** (vitesse) · **PocketBase** (souveraineté) | compromis les plus nets [W] | besoin réactif TS → Convex ; entreprise → Postgres managé + ORM |
| Auth | **Better Auth** | OSS, MIT, indépendant du fournisseur [API-gh 30 172★] | besoin managé/conformité → Clerk/WorkOS |
| Paiement | **Stripe** | écosystème et documentation | pays/réglementation → alternatives locales |
| E-mail | **Resend + React Email** | composants React, MIT côté client [API-gh] | volume/entreprise → Postmark-type |
| Déploiement | **Vercel** (produit web) · **Cloudflare** (statique/edge) · **Coolify/Dokploy** (souveraineté) | trois régimes de coût distincts [W] | trafic élevé à coût fixe → VPS + self-host |
| IA UI | **AI Elements + AI SDK** | officiel, intégré shadcn [W] | hors Next → assistant-ui |
| Capacités d'agent | **registre MCP officiel** + 3 serveurs ciblés | réseau + norme [W] | besoin entreprise → MCPJungle (proxy auto-hébergé) |
| Compétences d'agent | **Skill maison** + `anthropics/skills` | format ouvert, contrôle [W] | besoin de catalogue → SkillsMP/agent-skills.cc (avec audit) |

### Canal 2 — « FREE COMMERCIAL, SANS PIÈGE » (produit vendu, budget 0)
**Règle** : n'accepter que **permissive** (MIT/ISC/Apache/BSD/CC0) ou « free commercial » explicite.
- **UI** : shadcn/ui + registries MIT · daisyUI · Base UI/Ark · PrimeVue (MIT) · HeroUI (Apache-2.0).
- **Motion** : Motion, Anime.js, Lenis, React Spring (MIT) — **GSAP** accepté (gratuit commercial, mais propriétaire : pas de fork).
- **3D** : three.js, R3F, Babylon (Apache), PixiJS ; assets **CC0** (Poly Haven, ambientCG, Kenney, Quaternius, Humaaans, Open Peeps, unDraw).
- **Data** : Recharts, ECharts, D3, Nivo, visx, Chart.js, TanStack Table, deck.gl, MapLibre, Leaflet, Univer.
- **Backend/infra** : Supabase (cœur Apache), PocketBase (MIT), Better Auth (MIT), Drizzle/Prisma (Apache), Hono (MIT), Meilisearch, Pagefind, PostHog/Umami, GlitchTip, Coolify/Dokploy.
- **Exclus du canal** : Firecrawl (AGPL), Grafana/Superset (AGPL), Mosaic Lite (GPL), p5.js en produit fermé **sans respecter la LGPL**, Vercel Hobby (non commercial), offres « free personal only », tout dépôt **NOASSERTION** non vérifié.

### Canal 3 — « OPEN SOURCE D'ABORD » (souveraineté, audit, contribution)
PocketBase · Supabase (self-host) · Appwrite · Payload · Directus · Medusa · Saleor · n8n · Dify · Flowise · Langfuse · Ollama · llama.cpp · vLLM · MCPJungle · Coolify · Dokploy · CapRover · Dokku · Penpot · Plausible/Umami · GlitchTip · Meilisearch/Typesense.
**Vérification obligatoire** : les dépôts GitHub en **NOASSERTION** (Medusa, Strapi, Astro, n8n, Dify, handsontable [API-gh]) exigent une lecture de licence — « open source » n'est pas une licence.

### Canal 4 — « AI-READY » (je veux qu'un agent travaille proprement)
| Rang | Ressource | Ce qui la rend prête | Score |
|---|---|---|---|
| 1 | **Registre MCP officiel + serveur ciblé** | norme, permissions, remote HTTP | 5 |
| 2 | **shadcn/ui + registries + shadcn MCP** | le code s'installe par commande, l'agent ne devine plus | 4–5 |
| 3 | **anthropics/skills** | procédures encodées et versionnées | 5 |
| 4 | **Context7** | documentation à jour par MCP | 5 |
| 5 | **Playwright MCP + Chrome DevTools MCP** | l'agent **vérifie** au lieu de supposer | 5 |
| 6 | **Vercel AI SDK / AI Elements** | primitives IA sur shadcn | 4 |
| 7 | **Zod/Pydantic/tRPC/OpenAPI** | contrats machine-lisibles | 4 |
| 8 | **Ollama / OpenRouter** | modèles accessibles par API locale | 4 |

### Canal 5 — « LEARN » (je veux comprendre, pas juste brancher)
roadmap.sh (orientation) → MDN + javascript.info (fond) → freeCodeCamp/Odin (pratique) → Frontend Masters ou Three.js Journey (spécialisation payante) → **copier un registry et le lire** (Tailwind/ARIA) → openai-cookbook / anthropics cookbook (IA) → State of JS/CSS (décider avec des faits) [W/API-gh].
**Mesure de progrès** : pouvez-vous **réécrire la ressource de mémoire en 30 lignes** ? Sinon, vous ne l'avez pas apprise.

### Canal 6 — « PRODUCTION » (ça doit tenir, être surveillé, être repris par un autre)
- Socle : **TypeScript + Vite/Next + Tailwind + shadcn/ui + Zod + React Hook Form + TanStack Query + Drizzle/Prisma**.
- Qualité : **Vitest + Playwright + Storybook + Lighthouse CI + axe-core**.
- Exploitation : **Sentry/GlitchTip + Plausible/Umami + Coolify/Dokploy ou Vercel Pro**.
- Données : **Postgres managé + sauvegardes vérifiées**.
- Documentation : **Starlight/Fumadocs + règles d'agent (`AGENTS.md`)**.
**Critère éliminatoire** : toute ressource dont la **dernière poussée** [API-gh] dépasse 12 mois, ou dont la licence n'est pas déterminée, sort de ce canal.

### Canal 7 — « VISUAL IMPACT » (effet mémorable, sans casser la performance)
Aceternity (héros spectaculaires) · React Bits (textes/arrière-plans) · Magic UI (polish marketing) · Kokonut UI (SVG animés) · Spline (3D) · Rive (interactif) · Shadertoy (shaders) · bklit (data « signature ») · brut-ui/8bitcn/RetroUI (styles rares) [W/V/S].
**Règle de sobriété** : **un** effet signature par page, animé en `transform`/`opacity`, désactivable par `prefers-reduced-motion` [W].

### Canal 8 — « LIGHTWEIGHT / PERFORMANCE » (chaque kilo-octet compte)
visx (8–20 KB gz) · uPlot · Lenis (3 KB) · Motion (noyau ~8 KB) · Anime.js (~6 KB) · daisyUI · Icônes en SVG individuel (Lucide tree-shaké) · CSS natif/WAAPI avant toute bibliothèque [W].
**Test** : si l'effet est un `hover` ou une `opacity`, **écrivez-le en CSS** — la bibliothèque n'est justifiée qu'à partir de la 3ᵉ interaction complexe.

---

## 8.3 Arbres de décision (six questions qui tranchent)

**1) Êtes-vous en React ?**
Oui → shadcn/ui + Motion + Recharts + R3F si 3D + AI Elements si IA.
Non → Vue : PrimeVue/Nuxt UI/Shadcn-vue · Svelte : shadcn-svelte/Bits UI · Angular : spartan/NG-ZORRO · HTML pur : daisyUI/Preline + Alpine + GSAP/anime.js.

**2) Budget = 0 € et usage commercial ?** → Canal 2 (liste ci-dessus) + hébergement Cloudflare Pages + Supabase/PocketBase.

**3) Avez-vous besoin de 3D ?**
Produit à montrer → **model-viewer**. Scène sur mesure en React → **R3F**. Designer aux commandes → **Spline**. Jeu/simulation → **Babylon.js/PlayCanvas**. Effet visuel seulement → **shader ou image + parallax** (souvent suffisant et 10× moins cher) [W].

**4) Avez-vous besoin d'IA ?**
Chat → AI Elements/assistant-ui. L'IA doit agir dans votre app → CopilotKit. Capacités externes → MCP ciblés (3 max). Connaissance d'équipe → Skill + `AGENTS.md`. Données sensibles → Ollama local. Sinon → **ne pas ajouter d'IA**.

**5) Cloud managé ou auto-hébergé ?**
Vitesse de mise sur le marché → managé (Vercel/Supabase/Resend). Coût fixe et souveraineté → VPS + Coolify/Dokploy + PocketBase/Postgres + Caddy. Conformité/données sensibles → self-host ou juridiction adaptée.

**6) Solo ou équipe ?**
Solo → privilégier **une seule** brique par couche, éviter les frameworks exigeants, capitaliser sur les starters. Équipe → investir dans les **contrats** (TypeScript, Zod, OpenAPI), la CI (Playwright + Lighthouse CI) et la **documentation** (Starlight + règles d'agent).

---

## 8.4 Matrices de décision par phase (seuils pratiques)

| Phase | Critère décisif | Seuil de passage | Ressources « go » | Ressources « no-go » |
|---|---|---|---|---|
| 1 Inspiration | pertinence au secteur | 3 références convergentes | Refero, Mobbin, Awwwards | copier une DA sans principe |
| 2 Structure | cohérence des blocs | 1 seule famille de blocs | blocs shadcn, Tabler | mélange de 3 registries |
| 3 Tokens | conformité DTCG | tokens exportables | Style Dictionary + Tokens Studio | tokens saisis à la main dans le code |
| 4 Composants | a11y + propriété | audit clavier OK | shadcn/ui + Base UI/Radix | composants sans style de focus |
| 5 Motion | utilité + perf | 1 effet signature/page | Motion, GSAP, Lenis, Rive | animation de layout systématique |
| 6 Data | volume de points | < 5 K → SVG ; > 5 K → Canvas | Recharts, ECharts, Datawrapper | SVG sur 50 K points |
| 7 3D | utilité mobile | fallback + LOD prêts | model-viewer, R3F, Spline | 3D sans plan mobile |
| 8 IA | capacités + périmètre | 3 MCP max, permissions écrites | MCP officiels, AI SDK, Skills | 10 MCP installés « pour voir » |
| 9 Backend | mode de défaillance | plan payant ou self-host prêt | Supabase/PocketBase/Better Auth/Stripe/Resend | free tiers en production |
| 10 Production | budgets + observabilité | budget perf + erreurs suivies | Lighthouse CI, Playwright, Sentry, Coolify | mise en prod sans tests ni traces |

---

## 8.5 Règles d'arbitrage et anti-patterns

1. **Une couche, une brique** : un design system, un moteur d'animation principal, un système de charts dominant, une base de données, un fournisseur d'e-mail.
2. **Le second choix doit avoir un axe différenciant**, sinon c'est un doublon (doc 02 §5).
3. **Ne remplacez pas une dépendance pour des raisons esthétiques** si elle fonctionne : le coût de migration dépasse la plupart des gains de « propreté ».
4. **Les licences se lisent avant l'installation**, pas avant la mise en ligne.
5. **Toute IA doit avoir un mode sans IA** : si le fournisseur tombe, le produit reste utilisable.
6. **Toute donnée d'agent doit être révocable** : clés courtes, OAuth, périmètre minimal (doc 06 §6.2.3).
7. **Ce qui n'est pas mesuré n'est pas décidé** : pas de choix de perf sans budget, pas de choix IA sans traces de coût.
8. **Six mois = une revue** : relire la dernière poussée [API-gh], les licences et les prix des briques Tier A de votre stack.

**Anti-patterns documentés (2026)** : installer > 6 serveurs MCP [W] · 3D sur mobile sans fallback [W] · animer des propriétés de layout [W] · utiliser un free tier comme environnement de production (pauses/coupures : Supabase, Appwrite, Firebase, Vercel Hobby non commercial) [W] · empiler des registries d'effets jusqu'à perdre toute identité [W] · traiter le code généré par IA comme testé (consigne permanente).

---

## 8.6 Réponse complète type (démonstration du pipeline)
**Demande** : « Dashboard SaaS : comptes, abonnement, graphiques, un assistant IA, en français, budget minimal. »

| Couche | Décision | Obtention | Licence / coût | Alternative | Adaptation |
|---|---|---|---|---|---|
| Structure | shadcn-admin (fork) ou Tabler | R6 | MIT / 0 | Core UI | retirer les pages inutiles |
| Tokens | tweakcn + Style Dictionary | R5/R3 | MIT / 0 | Figma Variables | contraste AA revu |
| Composants | shadcn/ui + charts shadcn (Recharts) | R5 | MIT / 0 | MUI X (payant) | brancher vos données |
| Charts denses | ECharts (import modulaire) | R3 | Apache / 0 | Chart.js | plafonner les points |
| Motion | Motion (+ Lenis si landing) | R3 | MIT / 0 | Anime.js | 1 effet signature |
| Auth | Better Auth (self-host) | R3 | MIT / 0 | Clerk (managé) | e-mails de vérification + rate limit |
| Multi-tenant | Postgres + RLS | — | 0 | schéma dédié | isolation testée avant données réelles |
| Paiement | Stripe (+ composants de facturation shadcn) | R9 | frais/txn | Lemon Squeezy (pays) | webhooks testés en local |
| E-mail | Resend + React Email | R3/R9 | freemium | Postmark | SPF/DKIM/DMARC |
| Base | Supabase (Pro si production) | R9 | 25 $/mois | PocketBase + VPS (5 $) | ne pas rester sur le plan gratuit [W] |
| Assistant IA | AI Elements + AI SDK, Context7 en MCP | R5/R13 | Apache/MIT / coût tokens | assistant-ui | garder un mode sans IA |
| Docs | Starlight | R6 | MIT / 0 | Fumadocs | recherche Pagefind |
| Qualité | Vitest + Playwright + Lighthouse CI + axe-core | R3/R4 | OSS / 0 | Cypress | budgets par page |
| Exploitation | Vercel Pro (commercial) ou Coolify sur VPS | R9/R14 | 20 $/mois ou ~5–10 $ VPS | Netlify, Render | sauvegardes vérifiées |
| Observabilité | Sentry + Plausible/Umami | R9/R14 | freemium/MIT | GlitchTip | pas de données personnelles en clair |

**Coût réel de départ estimé** : 25–45 $/mois d'infrastructure pour un produit en ligne (hors coûts de modèles IA), plus le temps d'intégration. **Ce qui n'est pas inclus** : support juridique (CGU, RGPD), design sur mesure, contenu.

---

## 8.7 Tableau de synthèse — « si vous ne retenez qu'un choix par famille »
| Famille | Choix unique | Justification en une ligne |
|---|---|---|
| Composants | **shadcn/ui** | propriété du code + écosystème + AI-ready [API-gh] |
| Design system entreprise | **MUI** ou **Ant Design** | profondeur et support [API-gh] |
| Motion | **Motion** (+ GSAP si timelines) | simplicité vs puissance, les deux gratuits |
| Scroll | **Lenis** | 3 KB, standard de fait [W] |
| 3D | **three.js/R3F** | socle de l'écosystème [API-gh] |
| Charts | **Recharts** puis **ECharts** | 90 % des cas puis les cas lourds |
| Cartes | **MapLibre + Protomaps** | sans clé, auto-hébergeable |
| Table | **TanStack Table** | headless, MIT, portable |
| Templates | **Tabler** | design + licence + communauté |
| Starter | **create-t3-app** | conventions typées [API-gh] |
| Auth | **Better Auth** | OSS, MIT [API-gh] |
| Base | **Postgres** (Supabase ou VPS) | compétence transférable, pas de lock-in |
| Paiement | **Stripe** | écosystème |
| E-mail | **Resend + React Email** | composants, DX |
| Hébergement | **Cloudflare** (statique) / **Vercel Pro** (produit) / **Coolify** (souverain) | trois régimes de coût |
| IA UI | **AI Elements** | officiel, shadcn [W] |
| Capacités agent | **MCP ciblés + Context7 + Playwright** | installer, comprendre, vérifier [W] |
| Assets | **CC0** (Poly Haven, Kenney, unDraw, Lucide) | usage commercial sans négociation |
| Apprentissage | **roadmap.sh → MDN → projet** | gratuit et séquencé [W] |
| Qualité | **Playwright + Lighthouse CI + axe-core** | les trois portes de la production |


---

## Voir aussi

- [[dri/12-student-plans|Plans étudiants — décisions de coût pour étudiants]]
