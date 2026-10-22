# 10 — VERTICALISATION PAR MÉTIER
### E-commerce · Éducation · SaaS B2B · Agence web · Studio créatif · Média / presse
### 5 octobre 2026

---

## 10.0 Objet et méthode

Chaque métier a des **contraintes structurelles** (réglementaires, techniques, économiques) qui rendent certains choix du DRI (07–09) quasi obligatoires et d'autres dangereux. Ce document applique la méthode DRI à 6 verticaux en suivant le même canevas :

1. **Contraintes spécifiques** du métier (ce qui n'est pas négociable)
2. **Stack recommandé** (Essential + Strong + Specialized, adapté)
3. **Ressources Tier A / B / C** du vertical
4. **Besoins fonctionnels** (tableau type doc 07)
5. **Coût type** (démarrage + palier 10 K / 100 K)
6. **Pièges spécifiques** (ce qui casse dans ce métier)
7. **USE → UNDERSTAND → ADAPT** (un cas concret)

**Rappel méthodologique** (doc 02) : les ressources ci-dessous sont celles du catalogue DRI (04), du CSV (`catalogue-dri.csv`), et des docs 05–09. Aucune ressource n'est inventée. Les prix sont datés octobre 2026. Les licences sont vérifiées quand l'API a répondu ; sinon `[?]`.

---

## 10.1 E-COMMERCE (DTC + marketplace)

### 10.1.1 Contraintes spécifiques

| Contrainte | Implication sur la stack |
|---|---|
| **Paiement** : Stripe / Lemon Squeezy / Paddle (selon pays) | intégration server-side obligatoire, webhook signés, gestion des échecs |
| **RGPD + données clients** : consentement, droit à l'oubli, portabilité | cookie banner, suppression effective (pas soft-delete), export JSON |
| **Performance** : LCP < 2,5 s, CLS < 0,1 = impact SEO direct | SSR/SSG, images optimisées (AVIF, sharp), CDN edge |
| **Inventaire / stock temps réel** | base relationnelle, transactions, pas de cache agressif sur les prix |
| **Emails transactionnels** (commande, expédition, relance) | service d'envoi fiable, templates, tracking d'ouverture |
| **Multi-devises, multi-langues** | i18n robuste, ICU formats, arrondis locaux |
| **SEO produit** : structured data (Schema.org Product), sitemap dynamique | intégration SEO dans le CMS ou la couche produit |

### 10.1.2 Stack recommandé

| Couche | Choix | Alternatives | Pourquoi |
|---|---|---|---|
| Framework | **Next.js (App Router)** | Astro (catalogue), Remix | SSR + ISR + edge, écosystème e-commerce riche |
| UI | **shadcn/ui** + Tailwind | daisyUI (rapidité) | propriété du code, personnalisation totale |
| CMS produit | **Payload** ou **Medusa** | Saleor (Python), Shopify Hydrogen | Payload : code-first, admin généré. Medusa : composable, headless |
| Paiement | **Stripe** (+ Lemon Squeezy pour MoR) | Paddle, Polar | couverture mondiale, webhooks, idempotence |
| Recherche | **Algolia** (managé) ou **Meilisearch** (self-host) | Pagefind (statique) | recherche typo-tolérante, filtres facettes |
| Images | **Cloudflare R2 + Images** ou **Imgix** | sharp + Vercel Image Optimization | transformation edge, formats adaptatifs |
| Email | **Resend** (transactionnel) + **Brevo** (marketing) | Postmark (délivrabilité) | deux flux séparés |
| Analytics | **PostHog** (funnels, A/B) | Plausible (privacy) | e-commerce = besoin de funnels + replay |
| Hébergement | **Vercel** (DX) ou **Cloudflare** (coût) | Coolify (souverain) | cf. doc 11 |

### 10.1.3 Ressources Tier A / B / C e-commerce

| Tier | Ressource | Rôle |
|---|---|---|
| **A** | **Medusa.js** | moteur e-commerce headless composable, TypeScript |
| **A** | **Stripe** | paiement, abonnements, facturation |
| **A** | **Payload CMS** | admin produit, TypeScript-first |
| **B** | **Saleor** | GraphQL, Python, headless, BSD-3 |
| **B** | **Shopify Hydrogen** | framework Remix pour storefronts Shopify |
| **B** | **Meilisearch** | recherche typo-tolérante, self-host |
| **B** | **Vendure** | TypeScript, GraphQL, plugin-based |
| **C** | **Swell** | headless, API-first, pricing simple [?] |
| **C** | **WooCommerce** (legacy) | si migration depuis WordPress |
| **C** | **Snipcart** | e-commerce en 1 script, pas de backend |

### 10.1.4 Besoins fonctionnels (extrait)

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence | Piège |
|---|---|---|---|---|---|
| Catalogue produit | Payload + Drizzle | Medusa modules | Sanity (headless) | MIT/Apache | ne pas stocker les prix en cache CDN |
| Panier + checkout | Stripe Checkout | Lemon Squeezy (MoR) | Snipcart | propriétaire | webhook idempotence, gestion 3DS |
| Gestion stock | Postgres transactions | Redis + Lua (temps réel) | Turso (edge) | MIT | race conditions en flash sale |
| Recherche + filtres | Meilisearch | Algolia | Pagefind | MIT/propriétaire | indexation asynchrone, latence 1–3 s |
| Email commande | Resend | Postmark | Brevo | propriétaire | template versioning, BCC légal |
| Avis clients | système maison + Zod | Judge.me (Shopify) | — | variable | modération anti-spam, Schema.org |
| Multi-devises | format.js ICU | Dinero.js | — | MIT/ISC | arrondis, conversion temps réel |

### 10.1.5 Coût type e-commerce

| Palier | Stack | Coût mensuel |
|---|---|---|
| **Démarrage** (MVP, < 1 K commandes/mois) | Next.js + Payload + Stripe + Resend + Vercel + Supabase | **~45 $/mois** |
| **10 K visiteurs/jour** | + Meilisearch + R2 Images + PostHog | **~120 $/mois** |
| **100 K visiteurs/jour** | + Algolia + CDN avancé + email scaling + DB scale | **~600–900 $/mois** |
| **Marketplace multi-vendeurs** | + Stripe Connect + Medusa + infra scaling | **~2 000 $+/mois** |

### 10.1.6 Pièges spécifiques e-commerce

1. **Ne jamais cache-side les prix ou le stock** sans invalidation en < 5 s. Un client qui voit un prix périmé = litige + perte de confiance.
2. **Stripe webhook** : traiter chaque événement une seule fois (idempotence key), sinon double-expédition.
3. **RGPD** : soft-delete interdit pour les données personnelles sur demande explicite. Implémenter la suppression effective + export.
4. **SEO** : pas de JavaScript-only rendering pour les pages produit. SSR ou SSG + ISR obligatoire.
5. **Performance mobile** : 70 %+ du trafic e-commerce est mobile. Tester en 3G throttling, pas en Wi-Fi.
6. **Medusa** : licence NOASSERTION sur l'API GitHub — **vérifier la page de licence officielle** avant adoption.

### 10.1.7 USE → UNDERSTAND → ADAPT

**USE** : « Je veux un shop DTC de 50 produits, paiement Stripe, livraison Colissimo, email de confirmation, pas de marketplace. »

**UNDERSTAND** (30 min par brique) :
- **Next.js App Router** : comprendre SSR vs ISR vs client, le cache de route, le streaming.
- **Payload** : modèle de données, hooks beforeChange/afterChange, admin UI générée.
- **Stripe Checkout** : session de checkout, mode `payment`, webhook `checkout.session.completed`.
- **Resend** : template React Email, envoi transactionnel, domaines SPF/DKIM.

**ADAPT** :
- Remplacer Medusa (complexe) par Payload (suffisant pour 50 produits).
- Pas de Meilisearch : Pagefind (index statique) suffit pour 50 produits.
- Supabase Pro (25 $) au lieu d'un VPS (simplicité).
- Vercel Pro (20 $) pour le déploiement, ISR natif.

---

## 10.2 ÉDUCATION / LMS

### 10.2.1 Contraintes spécifiques

| Contrainte | Implication |
|---|---|
| **Vidéo pédagogique** (streaming, chapitrage, vitesse variable) | CDN vidéo ou HLS adaptatif, sous-titres |
| **Progression apprenant** (quizzes, certificats, XP) | base relationnelle + état session persistant |
| **Accessibilité** (sous-titres, transcription, contraste) | WCAG AA obligatoire, lecteur d'écran testé |
| **SCORM / xAPI** (interopérabilité avec LMS institutionnels) | conformité aux normes si vente B2B |
| **Communauté / forum / Q&R** | système de discussion, modération |
| **Paiement par cours / abonnement** | Stripe subscriptions, accès conditionnel |
| **Mode hors-ligne** (apprenants en zone peu connectée) | PWA + cache agressif |

### 10.2.2 Stack recommandé

| Couche | Choix | Alternatives |
|---|---|---|
| Framework | **Next.js** ou **Astro** (contenu) | Nuxt (Vue) |
| Vidéo | **Mux** ou **Cloudflare Stream** | Vidstack + HLS.js + S3 |
| LMS (si complexe) | **Moodle** (legacy) ou **Teable/Custom** | LearnDash (WordPress) |
| CMS cours | **Keystatic** ou **Decap CMS** | Sanity, Contentlayer |
| Quiz + progression | système maison + Postgres | — |
| Communauté | **Discourse** (self-host) ou Giscus (GitHub) | — |
| PWA | vite-plugin-pwa + Workbox | — |
| Paiement | Stripe (abonnements) | Paddle (MoR international) |
| Email | Resend (transactionnel) | — |
| Analytics | PostHog (progression) | — |

### 10.2.3 Ressources Tier A / B / C éducation

| Tier | Ressource | Rôle |
|---|---|---|
| **A** | **Mux Video** | streaming vidéo adaptatif, sous-titres auto, analytics |
| **A** | **Cloudflare Stream** | alternative à Mux, pricing simple |
| **A** | **Stripe Subscriptions** | paiement récurrent, trials, upgrades |
| **B** | **Vidstack** | lecteur vidéo custom, HLS, WebVTT |
| **B** | **hls.js** | HLS en JS, fallback, contrôle total |
| **B** | **Keystatic** | CMS git-based, cours en Markdown/MDX |
| **C** | **Tone.js** | audio interactif (cours de musique) |
| **C** | **Excalidraw** | schémas interactifs intégrables |
| **C** | **MathJax / KaTeX** | rendu mathématique (cours STEM) |

### 10.2.4 Besoins fonctionnels (extrait)

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence | Piège |
|---|---|---|---|---|---|
| Streaming vidéo | Mux | Cloudflare Stream | Vidstack + HLS | propriétaire/MIT | sous-titres obligatoires, coût à l'heure encodée |
| Progression | Postgres + Drizzle | Supabase Realtime | — | MIT | transactions, pas de cache sur les scores |
| Quiz | système maison + Zod | Typeform embed | — | MIT | anti-triche (timer, randomisation) |
| Certificats | pdf-lib + serveur | Accredible (SaaS) | — | MIT | vérification par lien public |
| PWA / offline | vite-plugin-pwa | Workbox | — | MIT | cache strategy: stale-while-revalidate |
| Forum / Q&R | Discourse | Giscus | — | GPL/MIT | modération, spam |
| Sous-titres | Whisper (auto) | Rev.com (humain) | — | MIT | coût, qualité, langue |
| Rendu maths | KaTeX | MathJax | — | MIT | vitesse de rendu |

### 10.2.5 Coût type éducation

| Palier | Stack | Coût mensuel |
|---|---|---|
| **Solo** (1 formateur, 10 cours, 500 apprenants) | Astro + Mux + Stripe + Resend + Cloudflare | **~40 $/mois** |
| **Petit LMS** (10 K apprenants actifs) | Next.js + Mux + Supabase + Stripe + Discourse | **~250 $/mois** |
| **LMS établi** (100 K apprenants, vidéo intensive) | + Cloudflare Stream + PostHog + scaling | **~1 500 $/mois** (vidéo = 60 % de la facture) |
| **B2B institutionnel** (SCORM, SSO, multi-tenant) | + Auth0/WorkOS + infra enterprise | **~5 000 $+/mois** |

### 10.2.6 Pièges spécifiques éducation

1. **Le coût vidéo explose** : 100 K apprenants × 2 h/semaine × bitrate adaptatif = plusieurs TB d'egress. **Cloudflare Stream ou Mux** (pricing par minute, pas par GB) est préférable à S3+CloudFront.
2. **Accessibilité** : les sous-titres ne sont pas optionnels. Whisper (auto) à 0,06 $/min ou Rev (humain) à 1,25 $/min. Budget à prévoir.
3. **SCORM/xAPI** : si vous vendez à des institutions, la conformité est obligatoire et lourde. Ne pas l'anticiper = refus de contrat.
4. **Anti-triche** : un quiz sans timer ni randomisation = 0 valeur de certificat.
5. **PWA offline** : attention aux quotas de stockage navigateur (50 MB en Safari). Stratégie de cache fine.
6. **RGPD mineurs** : si apprenants < 16 ans, consentement parental obligatoire en UE.

### 10.2.7 USE → UNDERSTAND → ADAPT

**USE** : « Je lance un cours en ligne de 30 vidéos, 10 modules, quiz par module, certificat PDF à la fin, paiement Stripe 49 $ one-shot. »

**UNDERSTAND** :
- **Mux** : upload, encodage auto (720p/1080p/adaptive), sous-titres auto, player intégré.
- **Stripe Payment Links** : paiement one-shot, webhook `checkout.session.completed`, accès conditionnel en base.
- **pdf-lib** : génération serveur du certificat (nom, date, QR code de vérification).

**ADAPT** :
- Astro (SSG) pour les pages cours → ultra-rapide, SEO.
- Mux au lieu de Vidstack + S3 (gain de temps énorme).
- Pas de Discourse au démarrage : un canal Discord suffit.
- Supabase (25 $) pour la progression + auth.

---

## 10.3 SAAS B2B

### 10.3.1 Contraintes spécifiques

| Contrainte | Implication |
|---|---|
| **Multi-tenant** : isolation des données par organisation | schéma Postgres par tenant ou RLS (Row Level Security) |
| **SSO / SAML / OIDC** (entreprises clientes) | Clerk Enterprise, WorkOS, Auth0 |
| **RBAC** (rôles, permissions, équipes) | système d'authorization robuste (CASL, Open Policy Agent) |
| **Audit log** : traçabilité des actions | table d'audit, immuable, exportable |
| **Facturation récurrente** : abonnements, usage-based, seats | Stripe Billing, Customer Portal |
| **API publique** (pour intégrations clients) | versioning, rate limiting, OpenAPI spec |
| **SLA / uptime** | monitoring, status page, on-call |
| **Sécurité** : SOC 2, HIPAA (selon vertical client) | audits,encryption at rest, key rotation |

### 10.3.2 Stack recommandé

| Couche | Choix | Alternatives |
|---|---|---|
| Framework | **Next.js** ou **Remix** | SvelteKit |
| UI | **shadcn/ui** + MUI X (data grids) | TanStack Table + custom |
| Backend | **tRPC** ou **OpenAPI** | NestJS (si équipe grande) |
| Auth | **Clerk Business** (SSO) ou **WorkOS** | Better Auth + custom SAML |
| DB | **Supabase** (RLS) ou **Neon** | Postgres self-host |
| Queue | **Trigger.dev** ou **Inngest** | BullMQ (Redis) |
| API publique | **Hono** + OpenAPI | Fastify |
| Facturation | **Stripe Billing** + Customer Portal | Paddle, Lemon Squeezy |
| Monitoring | **GlitchTip** + **PostHog** | Sentry + Plausible |
| Status page | **Instatus** ou maison | — |
| Hébergement | **Vercel** (DX) ou **Coolify** (souverain) | — |

### 10.3.3 Ressources Tier A / B / C SaaS B2B

| Tier | Ressource | Rôle |
|---|---|---|
| **A** | **Clerk** (SSO, RBAC, organizations) | auth enterprise-ready |
| **A** | **Stripe Billing** | abonnements, usage-based metering, portal |
| **A** | **Supabase** (RLS, multi-tenant) | base + auth + temps réel |
| **B** | **WorkOS** | SSO/SAML/Directory, complément auth |
| **B** | **Trigger.dev** | background jobs, retries, observabilité |
| **B** | **CASL** | authorization déclarative (can/cannot) |
| **B** | **Hono** | API edge, OpenAPI, ultra-léger |
| **C** | **Open Policy Agent** | policy engine (règles complexes) |
| **C** | **Inngest** | event-driven functions, alternative à Trigger |
| **C** | **shadcn-admin** | template admin dashboard, 15 K★ |

### 10.3.4 Besoins fonctionnels (extrait)

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence | Piège |
|---|---|---|---|---|---|
| Multi-tenant | RLS Postgres | schéma par tenant | — | MIT | fuite de données si mal configuré |
| SSO/SAML | Clerk Business | WorkOS | — | propriétaire | coût par connexion Enterprise |
| RBAC | CASL + Postgres | Open Policy Agent | — | MIT/ Apache | complexité à grande échelle |
| Audit log | table immuable + Drizzle | PaperTrail gem | — | MIT | volume, rétention, export |
| API publique | Hono + OpenAPI spec | NestJS + Swagger | — | MIT | versioning, breaking changes, rate limit |
| Facturation | Stripe Billing | Paddle (MoR) | Lemon Squeezy | propriétaire | proration, credits, usage-based |
| Background jobs | Trigger.dev | Inngest, BullMQ | — | Apache | retries, timeout, observabilité |
| Status page | Instatus | maison (Astro + webhook) | — | propriétaire | transparence = confiance |

### 10.3.5 Coût type SaaS B2B

| Palier | Stack | Coût mensuel |
|---|---|---|
| **Solo / MVP** (1 K utilisateurs, 10 organisations) | Next.js + shadcn + Supabase + Stripe + Resend + Vercel | **~50 $/mois** |
| **Établi** (10 K utilisateurs, 100 orgs, SSO) | + Clerk Business + Trigger.dev + GlitchTip | **~400 $/mois** |
| **Croissance** (100 K utilisateurs, 1 K orgs, API publique) | + WorkOS + scaling + monitoring avancé | **~2 000 $/mois** |
| **Enterprise** (SOC 2, HIPAA, multi-region) | + infra dédiée, audits, support 24/7 | **~10 000 $+/mois** |

### 10.3.6 Pièges spécifiques SaaS B2B

1. **Multi-tenant** : une fuite RLS = données d'un client vues par un autre. **Audit de sécurité obligatoire** avant mise en prod. Utiliser `SET LOCAL row_level_security` + tests automatisés.
2. **Stripe proration** : upgrade/downgrade mid-cycle = calcul complexe. Utiliser Stripe Billing natif, pas de calcul maison.
3. **API publique** : ne jamais exposer une table directement. Toujours une couche de service + validation Zod + rate limiting.
4. **SOC 2** : si vos clients enterprise l'exigent, c'est 6–12 mois de préparation et 20–50 K $/an d'audit.
5. **SLA 99,9 %** : chaque déploiement doit être zero-downtime. Vercel/Coolify + health checks + blue-green.
6. **Clerk** : à 100 K MAU, la facture atteint ~1 000 $/mois. Mieux vaut migrer vers Better Auth avant.

### 10.3.7 USE → UNDERSTAND → ADAPT

**USE** : « SaaS B2B de gestion de projet pour équipes de 5–50 personnes, 20 $/seat/mois, SSO Google + Microsoft, facturation Stripe, API publique pour intégrations. »

**UNDERSTAND** :
- **Clerk Organizations** : multi-tenant natif, invitations, rôles, SSO.
- **Stripe Billing** : per-seat pricing, proration, Customer Portal (self-serve).
- **RLS Postgres** : `policy` par `org_id`, testé avec des fixtures.
- **Hono + OpenAPI** : API publique versionnée (`/v1/`), rate limiting par API key.

**ADAPT** :
- shadcn/ui + shadcn-admin pour le dashboard (gain de temps).
- CASL pour la RBAC (déclaratif, testable).
- Pas de WorkOS au démarrage : Clerk SSO suffit pour Google/Microsoft.
- Trigger.dev pour les jobs asynchrones (invitations, exports, webhooks).

---

## 10.4 AGENCE WEB

### 10.4.1 Contraintes spécifiques

| Contrainte | Implication |
|---|---|
| **Multi-projets** : chaque client a sa stack, son hébergement | outillage de gestion de projets, templates réutilisables |
| **Design system par client** | tokens, Style Dictionary, Storybook par projet |
| **CMS pour clients non-techniques** | interface d'admin simple, champs typés |
| **Performance SEO** : Core Web Vitals pour chaque site livré | audit Lighthouse systématique, budgets perf |
| **Maintenance** : sites à maintenir après livraison | documentation, runbooks, contrats |
| **Temps de production** : optimiser le time-to-market | templates, scaffolding, générateurs |
| **Propriété intellectuelle** : code livré au client, pas de dépendance agence | licences claires, pas de SaaS lock-in côté client |

### 10.4.2 Stack recommandé

| Couche | Choix | Alternatives |
|---|---|---|
| Framework | **Astro** (contenu/SEO) ou **Next.js** (apps) | 11ty, Nuxt |
| CMS | **Keystatic** (git-based) ou **Payload** (admin) | Decap, Tina, Sanity |
| Design tokens | **Style Dictionary** + **Tokens Studio** | — |
| Documentation | **Storybook** + **Chromatic** | — |
| SEO | **Astro Starlight** (docs) + sitemaps + Schema.org | — |
| Templates | **create-dri-app** (maison) | Turborepo (mono-repo) |
| Performance | **Lighthouse CI** + budgets | Unlighthouse (multi-pages) |
| Hébergement client | **Cloudflare Pages** (coût 0) ou **Vercel** (facturation client) | Netlify |
| Animations | **Motion** + **GSAP** + **Lenis** | Rive (si designer) |
| Assets | **Poly Haven** + **unDraw** + **Fontshare** | CC0 uniquement |

### 10.4.3 Ressources Tier A / B / C agence

| Tier | Ressource | Rôle |
|---|---|---|
| **A** | **Astro** | sites contenu, performance, SEO, multi-framework |
| **A** | **Keystatic** | CMS git-based, clients non-techniques |
| **A** | **Storybook** | documentation composants par client |
| **A** | **Lighthouse CI** | audit perf systématique |
| **B** | **Payload** | CMS admin custom (clients complexes) |
| **B** | **Style Dictionary** | design tokens → CSS/iOS/Android |
| **B** | **shadcn/ui** | base de composants personnalisable |
| **C** | **loadercn** | loaders animation prêts à l'emploi |
| **C** | **8bitcn** | composants style pixel/rétro |
| **C** | **brut-ui** | composants brutalistes |
| **C** | **logoforge** | logos génératifs |
| **C** | **blobatar** | formes blob SVG |

### 10.4.4 Besoins fonctionnels (extrait)

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence | Piège |
|---|---|---|---|---|---|
| Site vitrine client | Astro + Keystatic | Next.js + Decap | — | MIT | CMS : vérifier que le client sait l'utiliser |
| Blog / actualités | Astro Content Collections | MDX + Next | — | MIT | pagination, RSS, sitemap |
| Design system | shadcn/ui + Tokens Studio | MUI + custom theme | — | MIT | documenter les tokens, pas juste les composants |
| Animations signature | Motion + GSAP + Lenis | Rive | loadercn, 8bitcn | MIT/free | **un seul effet signature par page**, `prefers-reduced-motion` |
| Performance | Lighthouse CI + budgets | Unlighthouse | — | Apache | tester en 4G throttling, pas en Wi-Fi |
| Multi-langue | Astro i18n | next-intl | — | MIT | RTL, pluriels ICU |
| SEO technique | sitemap + Schema.org + robots.txt | — | — | — | test Rich Results (Google Search Console) |
| Maintenance | documentation + runbook | — | — | — | sans doc, le client revient pour chaque modif |

### 10.4.5 Coût type agence

| Palier | Stack | Coût mensuel |
|---|---|---|
| **Solo** (3–5 sites/mois, Astro + Keystatic) | Cloudflare Pages (0 $) + outils dev | **~20 $/mois** (domaines + outils) |
| **Petite agence** (10–20 sites, Storybook, CI) | + Storybook + Chromatic + Vercel Team | **~100 $/mois** |
| **Agence établie** (50+ sites, multi-équipes) | + Turborepo + Lighthouse CI + monitoring | **~400 $/mois** |
| **Avec apps complexes** (SaaS client, dashboards) | + Supabase + Clerk + scaling | **variable par client** |

### 10.4.6 Pièges spécifiques agence

1. **Lock-in SaaS** : ne jamais livrer un site qui dépend d'un service que le client ne peut pas payer après. Prévoir un plan de sortie (self-host, alternative).
2. **CMS** : le client doit pouvoir modifier le contenu **sans vous appeler**. Tester avec le client avant livraison.
3. **Design system** : documenter les tokens **et** les décisions. Sinon, le prochain dev ne comprendra pas pourquoi `--color-brand` est ce bleu.
4. **Animations** : GSAP était payant jusqu'en 2025. **Désormais gratuit** mais **pas open source** — lire la licence avant utilisation commerciale.
5. **Performance** : ne jamais livrer sans Lighthouse CI passing. Instaurer un budget perf par projet (LCP < 2,5 s, CLS < 0,1).
6. **Licences assets** : ne JAMAIS utiliser d'image trouvée sur Google. Sources CC0 uniquement (Poly Haven, unDraw, Pexels). Vérifier chaque licence.

### 10.4.7 USE → UNDERSTAND → ADAPT

**USE** : « Site vitrine pour un architecte : 15 projets avec galerie, bio, contact, blog. Le client veut modifier les projets lui-même. »

**UNDERSTAND** :
- **Astro Content Collections** : Markdown/MDX pour les projets, typés, validés.
- **Keystatic** : interface d'édition pour le client, commits git automatiques.
- **Motion** : transitions de page, hover sur les projets.

**ADAPT** :
- Astro (pas Next.js) : site contenu, pas d'auth, performance maximale.
- Cloudflare Pages : 0 $/mois, bande passante illimitée.
- Lenis pour le scroll premium (un architecte = sensibilité au détail).
- Lighthouse CI en pré-commit : aucun rendu livré sans perf validée.

---

## 10.5 STUDIO CRÉATIF / MOTION / 3D

### 10.5.1 Contraintes spécifiques

| Contrainte | Implication |
|---|---|
| **WebGL / 3D** : performances GPU, compatibilité navigateurs | three.js / R3F / Babylon.js, tests multi-device |
| **Shaders** : GLSL, post-processing, effets | The Book of Shaders, Shadertoy, Shader Park |
| **Animation** : timelines complexes, scroll-sync, interactions | GSAP + ScrollTrigger, Motion, Lenis, Rive |
| **Assets 3D** : modèles, textures, PBR | Poly Haven, ambientCG, Kenney, Icosa Gallery |
| **Typographie** : identité forte, licences | Fontshare, Velvetyne, Collletttivo |
| **Motion design** : export After Effects → web | Lottie, dotLottie, Rive |
| **Créative coding** : installations, génératif | p5.js, Hydra, Nannou, openFrameworks |
| **Performance** : 60 fps, pas de drops | profiling GPU, lazy loading, LOD |

### 10.5.2 Stack recommandé

| Couche | Choix | Alternatives |
|---|---|---|
| 3D (scènes) | **React Three Fiber** (React) ou **three.js** (vanilla) | Babylon.js (ingénierie) |
| 3D (embed simple) | **model-viewer** | Spline viewer |
| 3D (no-code) | **Spline** | Vectary |
| Shaders | **Three.js Journey** (apprentissage) | The Book of Shaders |
| Animation | **GSAP + ScrollTrigger** | Motion (React), Anime.js |
| Scroll | **Lenis** | Locomotive Scroll (legacy) |
| State machines | **Rive** | Lottie (lecture seule) |
| 2D haute perf | **PixiJS** | — |
| Typographie | **Fontshare** + **Velvetyne** | Google Fonts |
| Assets 3D | **Poly Haven** + **Kenney** + **ambientCG** | Icosa Gallery |
| Post-processing | **postprocessing** (vanthree) | EffectComposer three.js |
| Build | **Vite** + **vite-plugin-glsl** | — |

### 10.5.3 Ressources Tier A / B / C studio créatif

| Tier | Ressource | Rôle |
|---|---|---|
| **A** | **React Three Fiber** | React + three.js, 32 K★ |
| **A** | **GSAP + ScrollTrigger** | timelines, scroll-sync, gratuit |
| **A** | **Lenis** | scroll premium, 3 KB |
| **A** | **Rive** | state machines interactives |
| **A** | **Poly Haven** | assets 3D CC0 (HDRi, textures, modèles) |
| **B** | **Babylon.js** | 3D ingénierie, physique, WebXR |
| **B** | **PixiJS** | 2D Canvas/WebGL haute perf |
| **B** | **Spline** | 3D no-code, export viewer |
| **B** | **model-viewer** | embed 3D en 1 balise |
| **C** | **Shader Park** | JS → GLSL, créative coding |
| **C** | **Hydra** | live coding vidéo |
| **C** | **thi.ng** | 190+ libs TS (géométrie, couleurs) |
| **C** | **Velvetyne** | typo libre expérimentale |
| **C** | **Icosa Gallery** | assets 3D curatorés |

### 10.5.4 Besoins fonctionnels (extrait)

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence | Piège |
|---|---|---|---|---|---|
| Scène 3D produit | R3F + drei | three.js vanilla | — | MIT | performance mobile, LOD, lazy loading |
| Animation scroll | GSAP ScrollTrigger | Motion + Lenis | — | free/MIT | `prefers-reduced-motion`, 1 effet/page max |
| Shader custom | Three.js Journey + GLSL | Shader Park | thi.ng | MIT/propriétaire | debugging GPU difficile |
| Asset 3D | Poly Haven (CC0) | Sketchfab (licences variées) | Icosa Gallery | CC0 | toujours vérifier la licence individuelle |
| Typo identité | Fontshare | Velvetyne (expérimental) | Collletttivo | libre | tester les caractères spéciaux (accents, ligatures) |
| Export designer | Rive | Lottie/dotLottie | — | freemium/MIT | Rive state machines > Lottie linéaire |
| 2D haute perf | PixiJS | Canvas 2D | — | MIT | WebGL context loss, fallback |
| Performance | profiling GPU + LOD | — | — | — | tester sur mobile bas de gamme |

### 10.5.5 Coût type studio créatif

| Palier | Stack | Coût mensuel |
|---|---|---|
| **Solo** (projets portfolio, 3D light) | R3F + GSAP + Lenis + Cloudflare Pages | **~0 $** (CC0 assets) |
| **Studio** (10 projets/an, 3D produit, Rive) | + Spline Pro + Rive + Storybook | **~50 $/mois** |
| **Studio établi** (installations, WebGL intensif) | + Babylon.js + outils profiling | **~150 $/mois** |
| **Agence créative** (équipes, assets custom) | + Font licences + modèles 3D custom | **~500 $+/mois** |

### 10.5.6 Pièges spécifiques studio créatif

1. **Performance mobile** : 40 %+ du trafic est sur mobile. Tester un R3F avec 100 K triangles sur un téléphone à 200 $. Ça ne passe pas.
2. **`prefers-reduced-motion`** : obligatoire légalement (WCAG). Tout effet de scroll/parallaxe doit avoir une version statique.
3. **Licence GSAP** : gratuit depuis 2025, **mais pas open source** (licence propriétaire gratuite). Lire les termes.
4. **WebGL context loss** : le GPU peut lâcher le contexte (mobile, onglets inactifs). Gérer l'événement `webglcontextlost`.
5. **Assets 3D** : Poly Haven = CC0 (aucune restriction). Sketchfab = **chaque modèle a sa propre licence**. Ne jamais supposer CC0.
6. **Shaders** : ne pas copier un shader de Shadertoy sans vérifier la licence de l'auteur. Beaucoup sont CC-BY-NC.

### 10.5.7 USE → UNDERSTAND → ADAPT

**USE** : « Page produit pour une sneaker : scène 3D rotative au scroll, textures PBR, effet parallaxe, transition de couleur au clic. »

**UNDERSTAND** :
- **R3F + drei** : `<OrbitControls>`, `<Environment>`, `useGLTF` pour charger le modèle.
- **GSAP ScrollTrigger** : rotation Y proportionnelle au scroll, translation Z.
- **postprocessing** : bloom, SSAO pour le rendu premium.

**ADAPT** :
- Poly Haven pour les HDRi d'environnement (CC0).
- LOD (Level of Detail) : modèle haute réso au centre, basse réso en périphérie.
- `prefers-reduced-motion` : désactiver la rotation auto, garder le contrôle utilisateur.
- Tester sur iPhone SE (GPU limité) et adapter le nombre de polygones.

---

## 10.6 MÉDIA / PRESSE / CONTENU

### 10.6.1 Contraintes spécifiques

| Contrainte | Implication |
|---|---|
| **Volume de contenu** : articles, vidéos, podcasts, newsletters | CMS robuste, workflow éditorial |
| **SEO éditorial** : structured data Article, AMP, sitemap | Astro/Next SSR, Schema.org |
| **Performance** : LCP < 2,5 s même avec publicités | lazy loading, critical CSS, font display |
| **Newsletter** : envois massifs, segmentation | service email marketing |
| **Paywall / abonnements** | Stripe, accès conditionnel, metered paywall |
| **Commentaires** | modération, anti-spam, conformité |
| **Accessibilité** : contrastes, alt textes, lecture écran | WCAG AA, audit régulier |
| **Analytics éditoriaux** : temps de lecture, engagement | PostHog, Plausible |
| **Archivage** : pérennité des URLs, redirections | slug stables, pas de suppression |

### 10.6.2 Stack recommandé

| Couche | Choix | Alternatives |
|---|---|---|
| Framework | **Astro** (performance) ou **Next.js** (interactivité) | 11ty |
| CMS | **Keystatic** (solo) ou **Payload** (équipe) | Sanity, Ghost |
| Newsletter | **Buttondown** ou **Ghost** (intégré) | Resend + Brevo (custom) |
| Commentaires | **Giscus** (GitHub) ou **Discourse** | Hyvor [?] |
| Search | **Pagefind** (statique) | Algolia DocSearch |
| Paywall | Stripe + middleware | — |
| SEO | Astro SEO plugin + Schema.org | next-seo |
| Performance | Lighthouse CI + Unlighthouse | — |
| Analytics | **Plausible** (privacy) | PostHog |
| Hébergement | **Cloudflare Pages** (0 $) | Vercel |
| Podcast | **RSS + hébergement fichier** (R2) | Podigee [?] |
| Typographie | **Fontshare** + **Inclusive Sans** | Google Fonts |

### 10.6.3 Ressources Tier A / B / C média

| Tier | Ressource | Rôle |
|---|---|---|
| **A** | **Astro** | performance éditoriale, Content Collections, SSR/SSG |
| **A** | **Ghost** | CMS + newsletter intégrés, open source |
| **A** | **Pagefind** | recherche statique, 0 serveur |
| **A** | **Plausible** | analytics privacy-first, lightweight |
| **B** | **Payload** | CMS équipe, workflow éditorial |
| **B** | **Buttondown** | newsletter minimaliste, API |
| **B** | **Giscus** | commentaires GitHub, modération native |
| **C** | **Datawrapper** | dataviz éditoriale embed |
| **C** | **Flourish** | visualisations interactives (free tier) |
| **C** | **Observable** | notebooks dataviz, embed |
| **C** | **Inclusive Sans** | typo accessible (dyslexie) |

### 10.6.4 Besoins fonctionnels (extrait)

| Besoin | 1er choix | Alternative | Pépite Tier C | Licence | Piège |
|---|---|---|---|---|---|
| Publication articles | Astro Content Collections | Ghost | Payload CMS | MIT | slug stables, pas de suppression d'URL |
| Newsletter | Buttondown | Ghost intégré | Resend + custom | MIT/propriétaire | double opt-in, désabonnement 1 clic (loi) |
| Commentaires | Giscus | Discourse | — | MIT | compte GitHub requis (friction) |
| Recherche | Pagefind | Algolia | — | MIT | indexation post-build, pas temps réel |
| Paywall | Stripe + middleware | — | — | propriétaire | metered paywall (3 articles gratuits) |
| Dataviz éditoriale | Datawrapper | Flourish | Observable | propriétaire | pas de JS custom, templates limités |
| Podcast | RSS + R2 | Podigee | — | — | iTunes/Spotify specs, artwork 3000×3000 |
| Analytics | Plausible | PostHog | — | AGPL/MIT | pas de cookie banner nécessaire |

### 10.6.5 Coût type média

| Palier | Stack | Coût mensuel |
|---|---|---|
| **Blog solo** (Astro + Keystatic) | Cloudflare Pages + Plausible | **~9 $/mois** (domaine + Plausible) |
| **Média indépendant** (5 auteurs, newsletter) | Ghost + Buttondown + Cloudflare | **~50 $/mois** |
| **Média établi** (50 auteurs, paywall, dataviz) | Payload + Stripe + Datawrapper + PostHog | **~500 $/mois** |
| **Groupe média** (multi-titres, IA, vidéo) | + API IA (résumés, transcription) + vidéo CDN | **~3 000 $+/mois** |

### 10.6.6 Pièges spécifiques média

1. **Stabilité des URLs** : une fois qu'un article est indexé par Google, **ne jamais changer son URL**. Redirections 301 si restructuration.
2. **Newsletter** : double opt-in **obligatoire** en UE (RGPD). Désabonnement en 1 clic.
3. **Paywall** : Google pénalise les paywalls qui bloquent le crawler. Implémenter un metered paywall ou Schema.org `isAccessibleForFree`.
4. **Accessibilité** : les images éditoriales doivent avoir des alt descriptifs (pas `image.jpg`). Les vidéos, des sous-titres.
5. **Performance publicités** : les ad scripts tierces tuent le LCP. Charger en async, après le DOMContentLoaded.
6. **Archivage** : prévoir la pérennité des contenus. Wayback Machine-friendly, pas de JS-only rendering.

### 10.6.7 USE → UNDERSTAND → ADAPT

**USE** : « Magazine en ligne indépendant : 20 articles/mois, 5 auteurs, newsletter hebdo, paywall (5 articles gratuits/mois), pas de publicité. »

**UNDERSTAND** :
- **Astro Content Collections** : articles en MDX, typés, validés.
- **Ghost** : CMS + newsletter intégrés, workflow éditorial.
- **Stripe** : metered paywall (compteur d'articles gratuits), abonnement 5 $/mois.
- **Plausible** : analytics sans cookie, temps de lecture moyen.

**ADAPT** :
- Ghost (tout-en-un) au lieu de Payload + Buttondown séparés (simplification).
- Cloudflare Pages (0 $) + domaine (9 $/an).
- Pas de Datawrapper au démarrage : graphiques en SVG statique.
- Pagefind pour la recherche (gratuit, statique).

---

## 10.7 TABLEAU SYNTHÉTIQUE CROSS-VERTICAUX

| Vertical | Stack cœur | Coût démarrage | Coût 100 K | Piège n°1 |
|---|---|---|---|---|
| **E-commerce** | Next.js + Payload + Stripe + Supabase | ~45 $/mois | ~700 $/mois | Race conditions stock, prix en cache |
| **Éducation** | Astro + Mux + Stripe + Supabase | ~40 $/mois | ~1 500 $/mois | Coût vidéo, sous-titres obligatoires |
| **SaaS B2B** | Next.js + shadcn + Clerk + Supabase | ~50 $/mois | ~2 000 $/mois | Fuite multi-tenant, SOC 2 |
| **Agence web** | Astro + Keystatic + Cloudflare | ~20 $/mois | ~400 $/mois | Lock-in SaaS, CMS inutilisable |
| **Studio créatif** | R3F + GSAP + Lenis + Cloudflare | ~0 $/mois | ~150 $/mois | Perf mobile, `prefers-reduced-motion` |
| **Média / presse** | Ghost + Cloudflare + Plausible | ~9 $/mois | ~500 $/mois | URLs cassées, paywall bloquant Google |

---

## 10.8 RÈGLES TRANSVERSALES

1. **Chaque vertical a un coût dominant** : e-commerce = paiement/stock, éducation = vidéo, SaaS = auth, agence = temps humain, studio = GPU, média = newsletter/paiement.
2. **Cloudflare est le choix par défaut** pour tous les verticaux dont le coût n'est pas dominé par le compute serveur. Vercel reste pertinent pour la DX Next.js.
3. **Better Auth plutôt que Clerk** dès que le vertical a > 100 K utilisateurs attendus.
4. **La licence doit être vérifiée avant adoption** : Medusa (NOASSERTION), GSAP (propriétaire gratuit), Firecrawl (AGPL).
5. **L'IA est le premier poste de coût variable** (doc 11). Chaque vertical doit définir un budget IA par utilisateur avant de brancher un LLM.
6. **Le USE → UNDERSTAND → ADAPT** (30 min par brique) est la règle pédagogique du DRI (doc 07). Ne jamais déployer une ressource sans l'avoir comprise.

---

*Document construit le 5 octobre 2026. Ressources issues du catalogue DRI (04, CSV), prix vérifiés, licences contrôlées sauf mention `[?]`. Les stacks recommandées sont des points de départ — chaque projet réel nécessite une validation de la licence et du coût à l'échelle cible.*
