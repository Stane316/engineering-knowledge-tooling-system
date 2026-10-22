# 11 — COÛT TOTAL À L'ÉCHELLE (10 K / 100 K / 1 M utilisateurs)
### Cartographie du coût réel des 6 services structurants · 5 octobre 2026

---

## 11.0 Objet et méthode

**Objectif** : rendre lisible ce que coûtent réellement les briques techniques d'un produit numérique à trois paliers de croissance, en dollars par mois et par utilisateur. Ce document complète les docs 07–09 en répondant à la question : *« mon produit viable à 10 000 utilisateurs tiendra-t-il encore à 100 000, puis à 1 million ? Et combien ? »*

**Les 6 services structurants retenus** (un par couche, ceux qui concentrent l'essentiel du coût variable une fois le produit lancé) :

| # | Couche | Service Tier A | Service Tier B | Service Tier C |
|---|---|---|---|---|
| 1 | **Hébergement / CDN** | Vercel Pro | Cloudflare Workers + Pages | Coolify / Dokploy (self-host) |
| 2 | **Base de données** | Supabase Pro | Neon Postgres | Postgres VPS (self-host) |
| 3 | **Authentification** | Clerk Pro | Better Auth (self-host) | Auth0 (Entreprise) |
| 4 | **Email transactionnel** | Resend Pro | Postmark | Brevo (ex-Sendinblue) |
| 5 | **Stockage médias / CDN objets** | Cloudflare R2 | AWS S3 | Backblaze B2 |
| 6 | **API IA (LLM)** | Claude Sonnet 5.5 | Claude Haiku 5.5 | OpenAI GPT-4o-mini |

**Hypothèses communes aux trois paliers** :
- **10 K utilisateurs** : produit en traction, équipe 1–3 devs, usage modéré (~5 pages/sessions par utilisateur, ~20 requêtes API/session, ~100 ko de données stockées/utilisateur, ~1 e-mail transactionnel/semaine/utilisateur).
- **100 K utilisateurs** : produit établi, équipe 5–10, usage régulier (~8 pages/session, ~30 requêtes API, ~250 ko stockés, ~3 e-mails/semaine).
- **1 M utilisateurs** : produit à grande échelle, usage intensif (~10 pages/session, ~50 requêtes API, ~500 ko stockés, ~5 e-mails/semaine), cache CDN actif.
- Tous les prix sont en **dollars US, octobre 2026**, sources officielles vérifiées.
- Les coûts de développement (salaires, agents IA, outils) sont exclus : seul le coût **d'exploitation mensuel récurrent** est modélisé.
- Les modèles self-host incluent le coût d'un VPS dédié ; la main-d'œuvre de maintenance est exclue (signalée).

**Formule** : `Coût total mensuel = coût fixe du plan + surcoûts liés à l'usage (dépassements)`. Le coût par utilisateur = `coût total / nombre d'utilisateurs`.

---

## 11.1 SERVICE 1 — HÉBERGEMENT / CDN

### Données de prix vérifiées [W]

| Fournisseur | Plan | Inclus | Au-delà |
|---|---|---|---|
| **Vercel Pro** | 20 $/mois (siège) | 1 TB transfert, 10 M requêtes edge, Flat Rate CDN niveau 1 | CDN : 20 $/10 M req + 50 TB (niveau 2), 100 $/50 M + 50 TB (niveau 3), 300 $/150 M + 50 TB. Fonctions : 0,128 $/CPU-h, 0,60 $/M invocations |
| **Cloudflare Workers Paid** | 5 $/mois (compte) | 10 M requêtes, 30 M CPU-ms, bande passante illimitée | 0,30 $/M requêtes, 0,02 $/M CPU-ms |
| **Coolify** (self-host) | 0 $ (OSS) + VPS | illimité (lié au matériel) | VPS 10–50 $/mois selon charge |

### Modèle de coût

| Palier | Vercel | Cloudflare | Coolify |
|---|---|---|---|
| **10 K users** — ~3 M pages/mois = ~3 M requêtes, ~30 GB transfert, ~500 K fonctions | 20 $ (tout inclus dans le crédit siège) | 5 $ (tout dans le gratuit payant) | 20 $ (VPS 2 vCPU/4 GB) |
| **100 K users** — ~24 M pages/mois, ~240 GB, ~10 M fonctions | 20 $ + CDN niveau 2 (20 $) = **40 $** | 5 $ + 14 M × 0,30 = **9,20 $** | 40 $ (VPS 4 vCPU/8 GB) |
| **1 M users** — ~300 M pages/mois, ~3 TB, ~150 M fonctions | 20 $ + CDN niveau 3 (300 $) + fonctions ~60 $ = **380 $** | 5 $ + 290 M × 0,30 = **92 $** | 120 $ (VPS 8 vCPU/32 GB ou cluster) |

**Coût par utilisateur (hébergement)** :

| Palier | Vercel | Cloudflare | Coolify |
|---|---|---|---|
| 10 K | 2,00 $ | 0,50 $ | 2,00 $ |
| 100 K | 0,40 ¢ | 0,09 ¢ | 0,40 ¢ |
| 1 M | 0,38 ¢ | 0,09 ¢ | 0,12 ¢ |

**Leçon** : Cloudflare est structurellement **4× moins cher** que Vercel à l'échelle, et la bande passante y est illimitée (pas de surprise lors d'un pic). Vercel reste pertinent pour la DX Next.js et l'edge computing avancé, mais son modèle Flat Rate CDN (septembre 2026) a déplacé le risque vers les paliers fixes. Coolify est compétitif jusqu'à ~100 K, puis exige de l'ingénierie de scaling.

---

## 11.2 SERVICE 2 — BASE DE DONNÉES

### Données de prix vérifiées [W]

| Fournisseur | Plan | Inclus | Au-delà |
|---|---|---|---|
| **Supabase Pro** | 25 $/mois | 8 GB disque, 250 GB egress, 100 GB stockage fichiers, 100 K MAU, $10 compute | Disque 0,125 $/GB, egress 0,09 $/GB, MAU 0,00325 $/MAU, stockage 0,0213 $/GB |
| **Neon** | Launcher gratuit → Scale 25 $/mois | 0,5 GB stockage (free), 100 CU-h (free) | Stockage 0,17 $/GB, compute 0,16 $/CU-h |
| **Postgres VPS** | 0 $ (OSS) | illimité (lié au matériel) | VPS 10–80 $/mois |

### Modèle de coût

**Hypothèses de charge** :
- 10 K : ~1 GB données, 10 GB egress/mois
- 100 K : ~8 GB données, 100 GB egress/mois
- 1 M : ~50 GB données, 1 TB egress/mois

| Palier | Supabase Pro | Neon Scale | Postgres VPS |
|---|---|---|---|
| **10 K** | 25 $ (8 GB inclus, tout dans quota) | 25 $ (0,5 GB → overage ~1,45 $) = **~27 $** | 15 $ (VPS 2 GB) |
| **100 K** | 25 $ + 50 K MAU × 0,00325 = **~27 $** | 25 $ + 7,5 GB × 0,17 = ~26 $ + compute = **~40 $** | 30 $ (VPS 8 GB) |
| **1 M** | 25 $ + 900 K × 0,00325 + 42 GB × 0,125 + 750 GB × 0,09 = **~326 $** | 25 $ + compute scaling + stockage = **~350 $** | 80 $ (VPS 32 GB + réplication) |

**Coût par utilisateur (base de données)** :

| Palier | Supabase | Neon | VPS |
|---|---|---|---|
| 10 K | 2,50 $ | 2,70 $ | 1,50 $ |
| 100 K | 0,27 ¢ | 0,40 ¢ | 0,30 ¢ |
| 1 M | 0,33 ¢ | 0,35 ¢ | 0,08 ¢ |

**Leçon** : à 10 K, les trois options se valent (~25 $/mois). À 1 M, le coût **explose** chez les hébergés managés (Supabase ~326 $, Neon ~350 $) à cause de l'egress et du compute. Le self-host Postgres reste à ~80 $ mais exige un DBA. **Le vrai coût caché** de Supabase : les MAU (0,00325 $/au-delà de 100 K) qui transforment 1 M d'utilisateurs actifs en 2 925 $/an de supplément.

---

## 11.3 SERVICE 3 — AUTHENTIFICATION

### Données de prix vérifiées [W]

| Fournisseur | Plan | Inclus | Au-delà |
|---|---|---|---|
| **Clerk Pro** | 25 $/mois | 50 K MRU, MFA, passkeys, 1 Enterprise SSO | 0,02 $/MRU (50 K–100 K), 0,018 $ (100 K–1 M), 0,015 $ (1 M–10 M) |
| **Better Auth** (self-host) | 0 $ (OSS MIT) | illimité | Coût VPS marginal (inclus dans hébergement) |
| **Auth0** | Essentials from 35 $/mois | 500 MAU (B2C), puis $0,013–$0,036/MAU | Prix personnalisés Entreprise |

### Modèle de coût

**Hypothèses** : MRU ≈ 70 % des MAU (Clerk compte les utilisateurs *retenus*, i.e. qui reviennent 24 h après inscription).

| Palier | Clerk Pro | Better Auth | Auth0 |
|---|---|---|---|
| **10 K** — ~7 K MRU | 25 $ (50 K inclus) | 0 $ (self-host) | 35 $ (500 MAU inclus) + ~9 500 × 0,013 = **~159 $** |
| **100 K** — ~70 K MRU | 25 $ + 20 K × 0,02 = **29 $** | 0 $ | ~35 $ + 99 500 × 0,013 = **~1 329 $** |
| **1 M** — ~700 K MRU | 25 $ + 50 K × 0,02 + 550 K × 0,018 + 100 K × 0,015 = **~1 141 $** | 0 $ | personnalisé, estimé **~10 000+ $** |

**Coût par utilisateur (auth)** :

| Palier | Clerk | Better Auth | Auth0 |
|---|---|---|---|
| 10 K | 2,50 $ | 0,00 ¢ | 15,90 $ |
| 100 K | 0,29 ¢ | 0,00 ¢ | 13,29 $ |
| 1 M | 1,14 ¢ | 0,00 ¢ | ~10,00 $+ |

**Leçon** : Clerk est **le choix rationnel jusqu'à 100 K** (29 $/mois tout compris). Au-delà, le coût monte vite : 1 141 $/mois à 1 M. **Better Auth (OSS, MIT, 30 K★) est gratuit quelle que soit l'échelle** — la contrepartie est la responsabilité opérationnelle (sessions, tokens, refresh, CVE, SSO custom). Auth0 est prohibitif hors contrat entreprise négocié. **Règle du doc 08** : Better Auth si vous pouvez assumer l'ops auth, Clerk sinon.

---

## 11.4 SERVICE 4 — EMAIL TRANSACTIONNEL

### Données de prix vérifiées [W]

| Fournisseur | Plan | Inclus | Au-delà |
|---|---|---|---|
| **Resend** | Pro 20 $/mois | 50 000 e-mails | 0,90 $/1 000 e-mails |
| **Resend** Pro 100 K | 35 $/mois | 100 000 e-mails | 0,90 $/1 000 |
| **Postmark** | 15 $/mois | 10 000 e-mails | 1,25 $/1 000 |
| **Brevo** (ex-Sendinblue) | Free | 300/jour (9 000/mois) | Starter 25 $/mois (20 K), Business 69 $/mois (20 K + advanced) |

### Modèle de coût

**Hypothèses d'envoi** (e-mails transactionnels : bienvenue, réinitialisation, notification, reçu) :
- 10 K : ~30 000 e-mails/mois (1/user/semaine)
- 100 K : ~300 000 e-mails/mois (3/user/semaine)
- 1 M : ~1,5 M e-mails/mois (5/user/semaine, ~375 K/semaine)

| Palier | Resend | Postmark | Brevo |
|---|---|---|---|
| **10 K** — 30 K e-mails | 20 $ (50 K inclus) | 15 $ + 20 K × 1,25 $ = **40 $** | 25 $ (Starter 20 K + overage) |
| **100 K** — 300 K e-mails | 35 $ + 200 K × 0,90 $ = **215 $** | 15 $ + 290 K × 1,25 $ = **378 $** | ~200 $ (Business + overage estimé) |
| **1 M** — 1,5 M e-mails | 650 $ (Scale) + ~0,46 × 1,4 M overage = **~1 294 $** | ~1 890 $ | ~1 000 $+ (estimé) |

**Coût par utilisateur (e-mail)** :

| Palier | Resend | Postmark | Brevo |
|---|---|---|---|
| 10 K | 2,00 $ | 4,00 $ | 2,50 $ |
| 100 K | 0,22 ¢ | 0,38 ¢ | ~0,20 ¢ |
| 1 M | 0,13 ¢ | 0,19 ¢ | ~0,10 ¢ |

**Leçon** : Resend est le meilleur rapport DX/coût jusqu'à ~100 K. Postmark excelle en délivrabilité (le choix média/presse). **À 1 M, le coût e-mail devient significatif** (~1 300 $/mois Resend) — c'est le signal pour négocier un contrat Enterprise ou migrer vers un self-host (ex. Moxa/Postal OSS).

---

## 11.5 SERVICE 5 — STOCKAGE MÉDIAS / CDN OBJETS

### Données de prix vérifiées [W]

| Fournisseur | Plan | Inclus | Au-delà |
|---|---|---|---|
| **Cloudflare R2** | Gratuit (10 GB/mois) | 10 GB stockage, 1 M Class A ops, 10 M Class B ops, **egress gratuit** | Stockage 0,015 $/GB, Class A 4,50 $/M, Class B 0,36 $/M |
| **AWS S3 Standard** | Pas de free tier permanent | — | Stockage 0,023 $/GB, GET 0,0004 $/1K, PUT 0,005 $/1K, **egress 0,09 $/GB** (après 100 GB free 1er mois) |
| **Backblaze B2** | 10 GB free | — | Stockage 0,00695 $/GB (6,95 $/TB), egress gratuit jusqu'à 3× stockage, puis 0,01 $/GB |

### Modèle de coût

**Hypothèses** (images, vidéos, uploads utilisateurs) :
- 10 K : 10 GB stockés, ~100 GB egress/mois, ~500 K requêtes lecture
- 100 K : 25 GB stockés, ~1 TB egress/mois, ~5 M requêtes
- 1 M : 500 GB stockés, ~15 TB egress/mois, ~50 M requêtes

| Palier | R2 | AWS S3 | B2 |
|---|---|---|---|
| **10 K** | 0 $ (tout dans le free tier) | 10 GB × 0,023 = 0,23 $ + 100 GB × 0,09 = **~9,23 $** | 0 $ (dans 10 GB free) |
| **100 K** | 25 × 0,015 + 5 M × 0,36 = **~1,84 $** | 25 × 0,023 + 1 000 GB × 0,09 + requêtes = **~90,58 $** | 25 × 0,007 + ~0 = **~0,18 $** (egress gratuit 3×25 = 75 GB < 1 TB → overage ~925 GB × 0,01) = **~9,43 $** |
| **1 M** | 500 × 0,015 + 50 M × 0,36 = **~18 753 $** | 500 × 0,023 + 15 000 × 0,09 + req = **~1 378 $** | 500 × 0,007 + (15 TB - 1,5 TB) × 0,01 + req = **~138 $** |

**Attention** : le calcul R2 à 1 M est dominé par les **requêtes de lecture** (50 M × 0,36 $/M = 18 000 $). En pratique, un **CDN en cache** (Cloudflare) absorbe 95 %+ des requêtes → coût réel ramené à ~500 $.

| Palier | R2 réel (CDN cache 95 %) | AWS S3 + CloudFront | B2 + CDN |
|---|---|---|---|
| **10 K** | 0 $ | ~9 $ | 0 $ |
| **100 K** | ~2 $ | ~91 $ | ~10 $ |
| **1 M** | ~100 $ | ~1 378 $ + CDN | ~138 $ + CDN |

**Leçon** : **R2 avec CDN Cloudflare est imbattable** à grande échelle grâce à l'egress gratuit et au cache. AWS S3 est le choix par défaut en entreprise (outillage, IAM, compliance) mais l'egress tue le budget. B2 est une alternative maline si vous n'êtes pas déjà dans le Cloudflare-verse.

---

## 11.6 SERVICE 6 — API IA (LLM)

### Données de prix vérifiées [W]

| Modèle | Entrée ($/M tokens) | Sortie ($/M tokens) | Cache hit | Batch (E/S) |
|---|---|---|---|---|
| **Claude Haiku 5.5** | 0,10 | 0,50 | 0,01 | 0,05 / 0,25 |
| **Claude Sonnet 5.5** | 2,00 | 10,00 | 0,10 | 1,00 / 5,00 |
| **OpenAI GPT-4o-mini** | 0,15 | 0,60 | 0,075 | — |

### Modèle de coût

**Hypothèses** (appels LLM par utilisateur et par session) :
- **Usage léger** (résumés, suggestions, auto-complétion) : ~2 K tokens input + 500 tokens output par session
- **Usage moyen** (chat, classification, extraction) : ~5 K tokens input + 1,5 K output
- **Usage intensif** (agents, RAG, rédaction) : ~20 K tokens input + 5 K output

| Palier & usage | Haiku 5.5 | Sonnet 5.5 | GPT-4o-mini |
|---|---|---|---|
| **10 K léger** (2K/500 tok × 10 K) | 10 K × (0,0002 + 0,00025) = **~4,50 $** | 10 K × (0,004 + 0,005) = **~90 $** | 10 K × (0,0003 + 0,0003) = **~6 $** |
| **100 K moyen** (5K/1,5K × 100 K) | 100 K × (0,0005 + 0,00075) = **~125 $** | 100 K × (0,01 + 0,015) = **~2 500 $** | 100 K × (0,00075 + 0,0009) = **~165 $** |
| **1 M intensif** (20K/5K × 1 M) | 1 M × (0,002 + 0,0025) = **~4 500 $** | 1 M × (0,04 + 0,05) = **~90 000 $** | 1 M × (0,003 + 0,003) = **~6 000 $** |

**Avec cache (hit rate 60 %)** :

| Palier & usage | Haiku 5.5 (cache) | Sonnet 5.5 (cache) |
|---|---|---|
| **10 K léger** | ~3 $ | ~55 $ |
| **100 K moyen** | ~75 $ | ~1 550 $ |
| **1 M intensif** | ~2 700 $ | ~55 000 $ |

**Coût par utilisateur (IA)** :

| Palier | Haiku | Sonnet | GPT-4o-mini |
|---|---|---|---|
| 10 K léger | 0,45 $ | 9,00 $ | 0,60 $ |
| 100 K moyen | 0,13 ¢ | 2,50 ¢ | 0,17 ¢ |
| 1 M intensif | 0,45 ¢ | 9,00 ¢ | 0,60 ¢ |

**Leçon** : l'IA est le **premier poste de coût variable** dès que l'usage est intensif. Sonnet à 1 M utilisateurs intensifs = 90 000 $/mois sans optimisation. **Stratégies de réduction** :
1. **Router** : Haiku pour 80 % des requêtes, Sonnet pour les 20 % complexes (règle du doc 08, canal AI-READY).
2. **Cache** : prompt caching (60 % de hit rate) divise par ~1,6×.
3. **Batch API** : pour les traitements non temps réel, le Batch API Sonnet coûte 50 % moins cher.
4. **Modèle local** : Ollama + Haiku-like (Llama, Qwen) pour les tâches simples → coût marginal (électricité).

---

## 11.7 SYNTHESE — COÛT TOTAL PAR PALIER ET PAR UTILISATEUR

### 10 000 utilisateurs

| Service | Choix économique | Choix DX | Coût total DX |
|---|---|---|---|
| Hébergement | Cloudflare **5 $** | Vercel **20 $** | |
| Base de données | VPS **15 $** | Supabase **25 $** | |
| Auth | Better Auth **0 $** | Clerk **25 $** | |
| E-mail | Brevo **~0 $** (300/j free) | Resend **20 $** | |
| Stockage | R2 **0 $** | R2 **0 $** | |
| IA (léger) | Haiku **~5 $** | Sonnet **~90 $** | |
| **TOTAL** | **~25 $/mois** | **~180 $/mois** | |
| **Par user** | **0,25 ¢** | **1,80 ¢** | |

### 100 000 utilisateurs

| Service | Choix économique | Choix DX |
|---|---|---|
| Hébergement | Cloudflare **~9 $** | Vercel **40 $** |
| Base de données | VPS **~30 $** | Supabase **~27 $** |
| Auth | Better Auth **0 $** | Clerk **29 $** |
| E-mail | Brevo **~200 $** | Resend **~215 $** |
| Stockage | B2 **~10 $** | R2 **~2 $** |
| IA (moyen) | Haiku **~125 $** | Sonnet **~2 500 $** |
| **TOTAL** | **~374 $/mois** | **~2 813 $/mois** |
| **Par user** | **0,37 ¢** | **2,81 ¢** |

### 1 000 000 utilisateurs

| Service | Choix économique | Choix DX (optimisé) |
|---|---|---|
| Hébergement | Cloudflare **~92 $** | Vercel **~380 $** |
| Base de données | VPS **~80 $** | Supabase **~326 $** |
| Auth | Better Auth **0 $** | Clerk **~1 141 $** |
| E-mail | Resend **~1 294 $** | Resend Enterprise négocié |
| Stockage | R2 + CDN **~100 $** | R2 + CDN **~100 $** |
| IA (intensif, routé) | Haiku 80 %+Sonnet 20 % **~5 400 $** | Sonnet + cache **~55 000 $** |
| **TOTAL** | **~6 966 $/mois** | **~56 947 $/mois** |
| **Par user** | **0,70 ¢** | **5,69 ¢** |

---

## 11.8 COURBES DE COÛT — CE QUI EXPLOSE ET CE QUI RESTE PLAT

| Service | Évolution 10 K → 1 M | Dynamique |
|---|---|---|
| Hébergement | ×18 (Cloudflare) ou ×19 (Vercel) | **linéaire** : proportionnel au trafic |
| Base de données | ×5 (VPS) à ×13 (Supabase) | **sous-linéaire** si bien indexé ; egress = piège |
| Auth | 0→0 (Better Auth) ou ×46 (Clerk) | **linéaire** : par utilisateur |
| E-mail | ×3 à ×65 | **linéaire** : par envoi |
| Stockage | ×50 (R2) à ×150 (S3) | **super-linéaire** si pas de cache CDN |
| **IA** | **×1 200×** (Haiku léger → intensif) | **explosif** : fonction du nombre d'appels × tokens × complexité |

**La seule ligne qui peut ruiner un produit à grande échelle est l'IA.** Tous les autres services restent gérables avec une architecture correcte. C'est la raison pour laquelle le doc 08 recommande :
- Un **routeur de modèles** (Haiku par défaut, Sonnet sur signal de complexité).
- Un **cache de prompts** agressif (60 %+ de hit rate).
- Le **Batch API** pour tout traitement non-interactif.
- Un **budget IA par utilisateur** (limite de tokens/semaine).

---

## 11.9 STRATÉGIES DE RÉDUCTION DU COÛT TOTAL

| Levier | Économie attendue | Effort | Quand l'activer |
|---|---|---|---|
| **Cloudflare au lieu de Vercel** | −60 à −75 % hébergement | moyen (adapter le pipeline CI) | dès 100 K users |
| **Better Auth au lieu de Clerk** | −100 % auth | élevé (implémenter SSO, MFA) | si l'équipe a un profil sécurité |
| **Self-host Postgres** | −75 % base de données | élevé (DBA, backups, réplication) | dès que Supabase > 100 $/mois |
| **R2 + cache CDN agressif** | −95 % stockage vs S3 | faible | immédiatement |
| **Router Haiku/Sonnet** | −80 % coût IA | moyen (logique de routage) | dès le premier appel LLM |
| **Batch API pour non-interactif** | −50 % coût LLM batch | faible | dès qu'un traitement n'est pas temps réel |
| **Prompt caching 60 %+** | −40 % coût LLM | faible (headers API) | immédiatement |
| **E-mails groupés / digest** | −50 % e-mail | faible (modifier la logique d'envoi) | avant 100 K users |
| **Négocier Enterprise** | −30 à −50 % au-delà de 1 M | relation commerciale | à partir de 500 K users |

---

## 11.10 LIMITES DU MODÈLE

1. **Les calculs sont des ordres de grandeur**, pas des factures prédictives. L'usage réel varie énormément selon le produit.
2. **Les prix sont ceux d'octobre 2026** ; ils changent (cf. baisse continue des coûts LLM, bascule Vercel vers Flat Rate CDN en septembre 2026).
3. **Le self-host exclut le coût humain** : un DBA temps plein pour Postgres à 1 M users = 5 000–8 000 $/mois.
4. **L'IA n'inclut pas le coût des embeddings, du vector store, ou de l'inférence locale** (GPU).
5. **Les réductions négociées (Enterprise, volume) ne sont pas modélisées** — en pratique, à 1 M users, tout se négocie.
6. **Les coûts de conformité** (SOC 2, HIPAA, RGPD, data residency) ne sont pas inclus.
7. **La facture réelle est presque toujours > au modèle** : monitoring, logs, backups, tests, CI/CD, domaines DNS, certificats, etc. ajoutent 20–50 %.

---

## 11.11 TABLEAU DE BORD — À SURVEILLER CHAQUE MOIS

| Signal | Seuil d'alerte | Action |
|---|---|---|
| Facture IA > 30 % du budget infra | dépassé | activer le routage Haiku + cache |
| Egress Supabase > 80 % du quota inclus | dépassé | ajouter un cache CDN ou passer à R2 |
| MAU Clerk > 80 % du quota Pro | dépassé | budgéter l'overage ou migrer Better Auth |
| Coût e-mail > 200 $/mois | dépassé | négocier tarif Enterprise ou regrouper les envois |
| Requêtes R2 Class B > 10 M/mois | dépassé | vérifier le cache CDN, ajouter des en-têtes Cache-Control |
| Facture totale > 0,50 ¢/utilisateur | dépassé | revoir l'architecture ; probablement l'IA ou l'egress |

---

*Document construit le 5 octobre 2026. Prix vérifiés à la source. Les calculs sont reproductibles avec les formules de chaque section. Mise à jour recommandée : trimestrielle (les prix LLM changent mensuellement).*


---

## Voir aussi

- [[dri/12-student-plans|Plans étudiants — alternatives gratuites pour réduire les coûts]]
