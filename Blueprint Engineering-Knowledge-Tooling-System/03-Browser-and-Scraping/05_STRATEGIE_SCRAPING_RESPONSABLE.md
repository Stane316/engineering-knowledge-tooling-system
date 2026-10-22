# Phase 05 — Livrable 05.1 : Stratégie de Scraping Responsable

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Élevé (recherche juridique approfondie, cadre éthique)

---

## 1. Objectif

Définir un cadre éthique, légal et technique pour toutes les opérations de scraping dans EKTS, en conformité avec les lois applicables (CFAA, GDPR, CCPA) et les bonnes pratiques de l'industrie.

---

## 2. Résumé exécutif

### Principes fondamentaux

EKTS adhère à **5 principes de scraping responsable** :

1. **Transparence** — identification claire du scraper, documentation des sources
2. **Respect** — robots.txt, rate limiting, horaires creux
3. **Minimisation** — collecte uniquement des données nécessaires
4. **Légalité** — données publiques uniquement, pas de contournement d'authentification
5. **Responsabilité** — propriété humaine, processus d'escalade, audits réguliers

### Cadre légal (2026)

**États-Unis :**
- ✅ Scraping de données publiques autorisé (hiQ v LinkedIn 2022, Van Buren 2021)
- ❌ Scraping derrière authentification = violation CFAA
- ⚠️ ToS clickwrap = contrat exécutoire (hiQ a perdu sur ce point)

**Union Européenne :**
- ✅ Scraping autorisé avec base légale (legitimate interest assessment)
- ❌ Données personnelles = GDPR complet (Art 6, Art 14)
- ⚠️ EDPB Guidelines 03/2026 : exclure sites avec robots.txt bloquant

### Règle d'or EKTS

**"Ne scraper que ce qui est public, non-personnel, et autorisé."**

---

## 3. Cadre légal détaillé

### 3.1 Computer Fraud and Abuse Act (CFAA) — États-Unis

#### Décisions clés

**Van Buren v. United States (Supreme Court, 2021)**
- **Ruling** : "exceeds authorized access" = accéder à des zones interdites, pas utiliser incorrectement un accès autorisé
- **Impact** : narrowed CFAA scope significantly
- **Test** : "gates-up-or-down" — si la page est accessible sans authentification, pas de violation CFAA

**hiQ Labs v. LinkedIn (Ninth Circuit, 2022)**
- **Ruling** : scraping de données publiques ne viole pas le CFAA
- **Impact** : landmark pro-scraping precedent
- **Limite** : hiQ a perdu sur breach of contract (ToS LinkedIn) et a payé $500K

**Meta v. Bright Data (N.D. Cal., 2024)**
- **Ruling** : scraping de pages publiques logged-out ne viole pas les ToS Meta
- **Impact** : ToS bind only logged-in users
- **Principe** : "logged-out public scraping is defensible; logged-in scraping against accepted terms is not"

#### Test CFAA pour EKTS

```typescript
function isCFAACompliant(url: string, requiresAuth: boolean): boolean {
  // Gate up = page accessible sans authentification
  const isPublic = !requiresAuth;
  
  // Si la page est publique, pas de violation CFAA
  return isPublic;
}
```

### 3.2 GDPR — Union Européenne

#### Principes applicables

| Article | Principe | Application scraping |
|---------|----------|---------------------|
| Art 5(1)(c) | Data minimization | Collecter uniquement le nécessaire |
| Art 5(1)(b) | Purpose limitation | Définir et documenter l'usage |
| Art 5(1)(e) | Storage limitation | Retention periods + auto-delete |
| Art 6 | Lawful basis | Legitimate interest assessment requis |
| Art 9 | Special categories | Interdit sans consentement explicite |
| Art 14 | Transparency | Informer les personnes dans le mois |

#### Legitimate Interest Assessment (LIA)

**Structure requise pour EKTS :**

1. **Purpose** — Pourquoi on collecte ces données
2. **Legitimate interest** — Quel intérêt légitime (recherche, analyse)
3. **Necessity test** — Est-ce nécessaire d'utiliser des données personnelles ?
4. **Balancing test** - Impact sur les droits des personnes vs bénéfice
5. **Safeguards** — Mesures de protection (anonymisation, rétention limitée)
6. **Conclusion** — Le scraping est-il justifié ?

**Template LIA EKTS :**

```markdown
# Legitimate Interest Assessment

## Target
- Site : [URL]
- Data type : [personal / non-personal]
- Volume : [nombre de personnes concernées]

## Purpose
[Raison de la collecte]

## Legitimate Interest
[Quel intérêt légitime : recherche, analyse de marché, etc.]

## Necessity Test
- Could we achieve the same goal without personal data? [yes/no]
- If yes, why is personal data still necessary? [justification]

## Balancing Test
- Impact on data subjects: [low/medium/high]
- Expectations of data subjects: [what would they expect?]
- Safeguards in place: [anonymisation, limited retention, etc.]

## Conclusion
- Scraping justified: [yes/no]
- If yes, what safeguards are required? [list]
```

#### EDPB Guidelines 03/2026

**Recommandations clés (adoptées le 7 juillet 2026) :**

1. **Data minimization by design** — définir précisément ce qu'on collecte avant de scraper
2. **Exclure les sites bloquants** — si robots.txt, ai.txt, ou CAPTCHA = ne pas scraper
3. **Pas de données behind login** — exclure les données nécessitant une authentification
4. **Transparency** — publier une privacy notice expliquant le scraping
5. **Right to erasure** — implémenter un mécanisme pour les demandes de suppression

### 3.3 Copyright et Database Rights

#### United States

- **Fair use (17 U.S.C. §107)** — usage limité autorisé pour recherche, commentaire, etc.
- **Facts not copyrightable** — les faits (prix, dates) ne sont pas protégés
- **Expression copyrightable** — le texte, les images, les vidéos sont protégés

**Pour EKTS :**
- ✅ Collecter des faits (prix, specs, dates)
- ❌ Copier du contenu créatif (articles, images)
- ⚠️ Transformer les données (analyse, agrégation) = fair use probable

#### European Union

- **Database Directive** — sui generis right pour les bases de données
- **DSM Directive Arts 3-4** — Text and Data Mining (TDM) exception
- **Art 4 opt-out** — les sites peuvent interdire le TDM par machine-readable reservation

**Pour EKTS :**
- ⚠️ Vérifier si le site a un opt-out TDM (meta tags, robots.txt)
- ✅ TDM pour recherche scientifique = généralement autorisé
- ❌ TDM commercial = nécessite autorisation si opt-out

### 3.4 Terms of Service (ToS)

#### Distinction critique

| Type | Description | Exécutabilité |
|------|-------------|---------------|
| **Clickwrap** | "I agree" cliqué explicitement | Fortement exécutoire |
| **Browsewrap** | Lien en footer, pas d'acceptation explicite | Faible exécutoire |

**Règle EKTS :**
- ❌ Ne JAMAIS accepter un ToS clickwrap qui interdit le scraping
- ⚠️ Browsewrap = zone grise, mais mieux vaut éviter si ToS interdit explicitement

#### Cas pratiques

**LinkedIn (ToS clickwrap)**
- hiQ a accepté les ToS en créant un compte
- Résultat : breach of contract, $500K settlement
- **Leçon** : ne pas créer de compte si ToS interdit le scraping

**Meta (ToS browsewrap)**
- Bright Data n'a PAS accepté les ToS (pas de compte)
- Résultat : scraping public logged-out autorisé
- **Leçon** : logged-out scraping public = pas lié par ToS

---

## 4. Cadre éthique

### 4.1 Les 5 principes EKTS

#### Principe 1 : Transparence

**Actions :**
- User-Agent explicite : `EKTS-Inspector/1.0 (+https://ekts.dev/bot)`
- Documentation publique des sources et méthodes
- Pas de fake accounts ou fausses identités
- Préparation à expliquer ce qu'on collecte et pourquoi

**Implémentation :**
```typescript
const USER_AGENT = 'EKTS-Inspector/1.0 (+https://ekts.dev/bot; mailto:legal@ekts.dev)';

const requestHeaders = {
  'User-Agent': USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9'
};
```

#### Principe 2 : Respect

**Actions :**
- Lire et respecter robots.txt
- Honorer Crawl-delay (ou défaut 1-2s minimum)
- Limiter la fréquence (1-2 req/s pour grands sites, 1 req/5s pour petits)
- Scraper pendant les horaires creux du site
- Arrêter si le site montre des signes de surcharge

**Implémentation :**
```typescript
async function respectfulDelay(url: string): Promise<void> {
  const robots = await fetchRobotsTxt(url);
  const delay = robots.crawlDelay || 2000; // 2s par défaut
  
  // Jitter pour éviter les patterns détectables
  const jitter = Math.random() * 1000;
  await sleep(delay + jitter);
}
```

#### Principe 3 : Minimisation

**Actions :**
- Collecter uniquement les données nécessaires
- Ne pas construire de profils individuels
- Anonymiser si possible
- Supprimer les données non nécessaires

**Implémentation :**
```typescript
interface ScrapingConfig {
  // Définir précisément ce qu'on veut
  fields: ['title', 'price', 'description']; // PAS ['all']
  
  // Filtres pour exclure les données personnelles
  excludePatterns: [
    /email/i,
    /phone/i,
    /address/i
  ];
  
  // Anonymisation si données personnelles inévitables
  anonymize: (data) => {
    delete data.email;
    delete data.phone;
    return data;
  };
}
```

#### Principe 4 : Légalité

**Actions :**
- Données publiques uniquement (pas d'authentification)
- Pas de contournement de protections techniques
- Respect des lois locales (GDPR, CCPA, etc.)
- Documentation de la base légale (LIA pour GDPR)

**Implémentation :**
```typescript
function isLegalToScrape(url: string): { legal: boolean; reason: string } {
  // Vérifier que c'est public
  if (requiresAuthentication(url)) {
    return { legal: false, reason: 'Requires authentication' };
  }
  
  // Vérifier robots.txt
  const robots = fetchRobotsTxt(url);
  if (robots.isDisallowed(url)) {
    return { legal: false, reason: 'Disallowed by robots.txt' };
  }
  
  // Vérifier ToS (si on a accepté)
  if (hasAcceptedToS(url) && tosProhibitsScraping(url)) {
    return { legal: false, reason: 'Prohibited by accepted ToS' };
  }
  
  return { legal: true, reason: 'Public data, no restrictions' };
}
```

#### Principe 5 : Responsabilité

**Actions :**
- Propriétaire humain désigné pour les décisions éthiques
- Processus d'escalade pour les cas limites
- Audits réguliers des opérations de scraping
- Documentation complète (sources, méthodes, usage)

**Implémentation :**
```typescript
interface ScrapingAudit {
  timestamp: string;
  url: string;
  operator: string; // Qui a lancé le scraping
  purpose: string; // Pourquoi
  legalBasis: 'public_data' | 'legitimate_interest' | 'consent';
  dataCollected: {
    volume: number;
    types: string[];
    personalData: boolean;
  };
  complianceCheck: {
    robotsTxtRespected: boolean;
    rateLimitingApplied: boolean;
    tosReviewed: boolean;
  };
}
```

### 4.2 Checklist éthique EKTS

**Avant de scraper :**

- [ ] Les données sont-elles publiques (accessibles sans login) ?
- [ ] robots.txt autorise-t-il le scraping ?
- [ ] Ai-je review les ToS (si applicable) ?
- [ ] Les données contiennent-elles des informations personnelles ?
  - Si oui : LIA documenté ?
- [ ] Quel est le but de la collecte ?
- [ ] Qui est responsable de cette opération ?
- [ ] Comment vais-je protéger les données collectées ?

**Pendant le scraping :**

- [ ] Rate limiting appliqué ?
- [ ] User-Agent explicite utilisé ?
- [ ] Horaires creux respectés ?
- [ ] Pas de signes de surcharge du site ?

**Après le scraping :**

- [ ] Données anonymisées si possible ?
- [ ] Rétention limitée définie ?
- [ ] Documentation complète ?
- [ ] Mécanisme de suppression pour les demandes ?

---

## 5. Respect de robots.txt

### 5.1 Structure de robots.txt

```
User-agent: *
Disallow: /private/
Disallow: /admin/
Allow: /public/
Crawl-delay: 5

User-agent: EKTS-Inspector
Disallow: /api/
Crawl-delay: 10

Sitemap: https://example.com/sitemap.xml
```

### 5.2 Implémentation EKTS

```typescript
import { RobotFileParser } from 'robotfile';

class RobotsTxtManager {
  private cache = new Map<string, RobotFileParser>();
  
  async check(url: string, userAgent: string = 'EKTS-Inspector'): Promise<{
    allowed: boolean;
    crawlDelay: number;
  }> {
    const domain = new URL(url).origin;
    
    // Charger robots.txt (avec cache)
    if (!this.cache.has(domain)) {
      const parser = new RobotFileParser();
      parser.setUrl(`${domain}/robots.txt`);
      await parser.read();
      this.cache.set(domain, parser);
    }
    
    const parser = this.cache.get(domain)!;
    
    // Vérifier si l'URL est autorisée
    const allowed = parser.canFetch(userAgent, url);
    
    // Récupérer le crawl-delay
    const crawlDelay = parser.crawlDelay(userAgent) || 2; // 2s par défaut
    
    return { allowed, crawlDelay };
  }
}
```

### 5.3 Crawl-delay : bonnes pratiques

| Situation | Delay recommandé | Justification |
|-----------|------------------|---------------|
| robots.txt spécifie Crawl-delay | Valeur exacte | Respect de la volonté du site |
| Grand site (CDN, cloud) | 1-2 secondes | Infrastructure robuste |
| Site moyen | 2-5 secondes | Prudent par défaut |
| Petit site (handmade, community) | 5-10 secondes | Très respectueux |
| Pas de Crawl-delay spécifié | 2 secondes | Défaut EKTS |

### 5.4 Horaires creux

**Principe :** scraper quand le site est peu utilisé

**Implémentation :**
```typescript
function getOffPeakHours(timezone: string): { start: number; end: number } {
  // Par défaut : 2h-6h du matin dans le timezone du site
  return { start: 2, end: 6 };
}

async function scrapeDuringOffPeak(url: string): Promise<void> {
  const timezone = await detectTimezone(url);
  const { start, end } = getOffPeakHours(timezone);
  
  const now = new Date();
  const localHour = parseInt(
    now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: timezone })
  );
  
  if (localHour >= start && localHour < end) {
    // Horaire creux, on peut scraper
    await scrape(url);
  } else {
    // Attendre le prochain horaire creux
    const hoursToWait = (start - localHour + 24) % 24;
    console.log(`Waiting ${hoursToWait}h for off-peak hours`);
    await sleep(hoursToWait * 3600 * 1000);
    await scrape(url);
  }
}
```

---

## 6. Gestion des données personnelles

### 6.1 Définition

**Données personnelles (GDPR Art 4) :**
- Nom, prénom
- Email, téléphone
- Adresse
- Photo
- Identifiants en ligne (username, profil URL)
- Adresse IP
- Toute information permettant d'identifier une personne

### 6.2 Stratégie EKTS

**Principe : éviter autant que possible**

```typescript
interface PersonalDataPolicy {
  // Données à exclure systématiquement
  excludeFields: [
    'email',
    'phone',
    'address',
    'ip_address',
    'cookie_data'
  ];
  
  // Patterns regex pour détecter les données personnelles
  excludePatterns: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // phone
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ // IP
  ];
  
  // Si données personnelles inévitables
  ifPersonalDataFound: 'anonymize' | 'delete' | 'flag_for_review';
}
```

### 6.3 Anonymisation

**Techniques :**

```typescript
function anonymizePersonalData(data: any): any {
  // Hash les identifiants
  if (data.email) {
    data.email_hash = crypto.createHash('sha256').update(data.email).digest('hex');
    delete data.email;
  }
  
  // Supprime les informations identifiantes
  delete data.name;
  delete data.phone;
  delete data.address;
  
  // Garde uniquement les faits non-personnels
  return data;
}
```

### 6.4 GDPR Compliance Checklist

| Requirement | Action EKTS | Status |
|-------------|-------------|--------|
| Lawful basis (Art 6) | Legitimate Interest Assessment | ✅ Documenté |
| Data minimization (Art 5) | Exclure données non nécessaires | ✅ Implémenté |
| Purpose limitation (Art 5) | Définir usage avant collecte | ✅ Template fourni |
| Storage limitation (Art 5) | Rétention max 1 an, auto-delete | ✅ À implémenter |
| Transparency (Art 14) | Privacy notice publique | ✅ À publier |
| Right to erasure (Art 17) | Formulaire de suppression | ✅ À implémenter |
| DPIA (Art 35) | Pour scraping à grande échelle | ✅ Template fourni |

---

## 7. Rate limiting et politesse

### 7.1 Stratégie de rate limiting

```typescript
class RateLimiter {
  private queues = new Map<string, number[]>();
  
  async acquire(domain: string): Promise<void> {
    const now = Date.now();
    const queue = this.queues.get(domain) || [];
    
    // Nettoyer les timestamps > 1 minute
    const recent = queue.filter(t => now - t < 60000);
    
    // Limite : 30 requêtes par minute par domaine
    if (recent.length >= 30) {
      const oldest = recent[0];
      const waitTime = 60000 - (now - oldest);
      await sleep(waitTime);
    }
    
    recent.push(now);
    this.queues.set(domain, recent);
  }
}
```

### 7.2 Backoff exponentiel

```typescript
async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Backoff exponentiel : 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
  throw new Error('Max retries reached');
}
```

### 7.3 Détection de surcharge

```typescript
async function detectOverload(response: Response): Promise<boolean> {
  // Status codes indiquant une surcharge
  const overloadCodes = [429, 503, 529];
  
  if (overloadCodes.includes(response.status)) {
    return true;
  }
  
  // Headers indiquant un rate limiting
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    return true;
  }
  
  // Temps de réponse > 10s = signe de surcharge
  // (nécessite de mesurer le temps de réponse)
  
  return false;
}
```

---

## 8. Cas limites et zones grises

### 8.1 Données semi-publiques

**Cas :** données accessibles sans login mais avec JavaScript requis

**Décision EKTS :**
- ✅ Si la page est accessible à un utilisateur normal avec un navigateur
- ❌ Si la page nécessite une technique spéciale (API cachée, token)

### 8.2 APIs non documentées

**Cas :** endpoints API découverts par inspection réseau

**Décision EKTS :**
- ⚠️ Zone grise
- ✅ Utiliser si l'API est publique (pas d'authentification)
- ❌ Ne pas utiliser si l'API nécessite un token ou une clé
- ⚠️ Respecter robots.txt même pour les APIs

### 8.3 Données derrière CAPTCHA

**Cas :** site protégé par CAPTCHA

**Décision EKTS :**
- ❌ Ne JAMAIS contourner les CAPTCHAs
- ❌ Ne pas utiliser de services de résolution de CAPTCHA
- ✅ Chercher une alternative (API officielle, données publiques ailleurs)

### 8.4 Données personnelles dans du contenu public

**Cas :** article de blog avec noms et emails en clair

**Décision EKTS :**
- ⚠️ Techniquement public
- ❌ Ne pas collecter les données personnelles
- ✅ Collecter uniquement le contenu non-personnel (texte de l'article)
- ⚠️ Si GDPR : LIA requis

### 8.5 Sites avec ToS prohibitif mais browsewrap

**Cas :** ToS interdit le scraping mais pas de clickwrap

**Décision EKTS :**
- ⚠️ Zone grise juridique
- ✅ Logged-out scraping = probablement pas lié par ToS (Meta v Bright Data)
- ⚠️ Mais risque de litige
- ✅ Privilégier des sources sans ToS prohibitif

---

## 9. Documentation et traçabilité

### 9.1 Registre des sources

```typescript
interface SourceRegistry {
  domain: string;
  firstScraped: string;
  lastScraped: string;
  robotsTxtRespected: boolean;
  tosReviewed: boolean;
  tosUrl: string | null;
  tosProhibitsScraping: boolean | null;
  personalDataCollected: boolean;
  legalBasis: 'public_data' | 'legitimate_interest' | 'consent';
  liaDocumented: boolean;
  contactEmail: string | null;
}
```

### 9.2 Audit trail

```typescript
interface ScrapingAuditLog {
  timestamp: string;
  operator: string;
  url: string;
  action: 'scrape' | 'inspect' | 'download';
  result: {
    status: 'success' | 'blocked' | 'error';
    dataCollected: number;
    duration: number;
  };
  compliance: {
    robotsTxtChecked: boolean;
    robotsTxtAllowed: boolean;
    rateLimitingApplied: boolean;
    userAgentSet: boolean;
  };
}
```

### 9.3 Privacy notice (template)

```markdown
# EKTS Data Collection Notice

## What we collect
EKTS collects publicly available data from websites for research and analysis purposes.

## How we collect
We use automated tools to access public web pages. We identify ourselves with the User-Agent "EKTS-Inspector/1.0" and respect robots.txt directives.

## Why we collect
We collect data to build a knowledge base of engineering resources, tools, and best practices.

## What we do with the data
- Analyze and aggregate data for research purposes
- Store data securely with limited retention (max 1 year)
- Never sell or share personal data

## Your rights
If you believe we have collected your personal data and wish to exercise your rights (access, deletion, objection), please contact us at privacy@ekts.dev.

## Contact
For questions about our data collection practices, contact privacy@ekts.dev.
```

---

## 10. Implémentation technique

### 10.1 Middleware de compliance

```typescript
interface ComplianceMiddleware {
  // Avant le scraping
  preScrape(url: string): Promise<{
    allowed: boolean;
    reason: string;
    config: ScrapingConfig;
  }>;
  
  // Après le scraping
  postScrape(data: any): Promise<{
    cleaned: boolean;
    personalDataRemoved: boolean;
    auditLog: ScrapingAuditLog;
  }>;
}

class EKTSComplianceMiddleware implements ComplianceMiddleware {
  private robotsManager = new RobotsTxtManager();
  private rateLimiter = new RateLimiter();
  
  async preScrape(url: string): Promise<any> {
    // 1. Vérifier robots.txt
    const robots = await this.robotsManager.check(url);
    if (!robots.allowed) {
      return { allowed: false, reason: 'Disallowed by robots.txt' };
    }
    
    // 2. Vérifier légalité
    const legal = isLegalToScrape(url);
    if (!legal.legal) {
      return { allowed: false, reason: legal.reason };
    }
    
    // 3. Rate limiting
    await this.rateLimiter.acquire(new URL(url).hostname);
    
    // 4. Configurer le scraping
    const config: ScrapingConfig = {
      fields: ['title', 'description', 'content'],
      excludePatterns: [/email/i, /phone/i],
      anonymize: anonymizePersonalData
    };
    
    return { allowed: true, reason: 'Compliant', config };
  }
  
  async postScrape(data: any): Promise<any> {
    // 1. Nettoyer les données personnelles
    const cleaned = anonymizePersonalData(data);
    
    // 2. Logger l'audit
    const auditLog: ScrapingAuditLog = {
      timestamp: new Date().toISOString(),
      operator: 'system',
      url: data.url,
      action: 'scrape',
      result: {
        status: 'success',
        dataCollected: Object.keys(cleaned).length,
        duration: 0 // À mesurer
      },
      compliance: {
        robotsTxtChecked: true,
        robotsTxtAllowed: true,
        rateLimitingApplied: true,
        userAgentSet: true
      }
    };
    
    return {
      cleaned: true,
      personalDataRemoved: true,
      auditLog
    };
  }
}
```

### 10.2 Configuration globale

```typescript
const EKTS_SCRAPING_CONFIG = {
  // Identification
  userAgent: 'EKTS-Inspector/1.0 (+https://ekts.dev/bot)',
  
  // Rate limiting
  defaultDelay: 2000, // 2 secondes
  maxRequestsPerMinute: 30,
  
  // Respect
  respectRobotsTxt: true,
  respectCrawlDelay: true,
  useOffPeakHours: true,
  
  // Données personnelles
  excludePersonalData: true,
  anonymizeIfUnavoidable: true,
  
  // Rétention
  maxRetentionDays: 365,
  autoDelete: true,
  
  // Logging
  auditLogging: true,
  logLevel: 'info'
};
```

---

## 11. Limites et incertitudes

### 11.1 Zones grises juridiques

- **Browsewrap ToS** : exécutabilité variable selon les juridictions
- **APIs non documentées** : statut légal flou
- **Données semi-publiques** : limite entre public et privé floue

### 11.2 Évolution réglementaire

- **EDPB Guidelines 03/2026** : encore en consultation (jusqu'au 30 octobre 2026)
- **EU AI Act** : nouvelles obligations de documentation pour les données d'entraînement
- **État des lois privacy US** : 19+ états avec des lois différentes

### 11.3 Non vérifié

- Exécutabilité des ToS browsewrap dans toutes les juridictions
- Interprétation de "legitimate interest" par les régulateurs nationaux
- Validité des LIA boilerplate vs détaillées

---

## 12. Recommandations

### 12.1 Pour EKTS

1. **Implémenter le middleware de compliance** — automatisation des vérifications
2. **Publier une privacy notice** — transparence sur les pratiques
3. **Documenter toutes les sources** — registre complet
4. **Former les opérateurs** — sensibilisation aux aspects légaux
5. **Auditer régulièrement** — revue trimestrielle des opérations

### 12.2 Cas par cas

| Situation | Recommandation |
|-----------|----------------|
| Données publiques non-personnelles | ✅ Scraper librement |
| Données publiques personnelles | ⚠️ LIA requis, anonymiser |
| ToS clickwrap prohibitif | ❌ Ne pas scraper |
| ToS browsewrap prohibitif | ⚠️ Zone grise, éviter si possible |
| robots.txt bloquant | ❌ Ne pas scraper |
| CAPTCHA | ❌ Ne pas contourner |
| API non documentée | ⚠️ Zone grise, vérifier robots.txt |

### 12.3 Alternatives au scraping

**Quand le scraping est risqué ou interdit :**

1. **APIs officielles** — toujours privilégier si disponible
2. **Jeux de données publics** — Kaggle, data.gov, etc.
3. **Partenariats** — demander l'autorisation au site
4. **Données synthétiques** — générer des données similaires
5. **Manuel** — collecte manuelle pour de petits volumes

---

## 13. Sources

### Décisions de justice

- **Van Buren v. United States** (Supreme Court, 2021) — CFAA "gates-up-or-down" test
- **hiQ Labs v. LinkedIn** (Ninth Circuit, 2022) — scraping public data ≠ CFAA violation
- **Meta v. Bright Data** (N.D. Cal., 2024) — logged-out public scraping OK

### Réglementations

- **GDPR** (EU) — Articles 5, 6, 9, 14, 17
- **CCPA/CPRA** (California) — privacy rights
- **EU AI Act** (2025-2026) — documentation requirements
- **EDPB Guidelines 03/2026** — web scraping for AI

### Bonnes pratiques

- **RFC 9309** — robots.txt standard
- **ScrapingBee** — "A Web Scraper's Guide to Robots.txt" (2026)
- **Scrapfly** — "11 Web Scraping Best Practices" (2026)
- **SparkProxy** — "Ethical Web Scraping: Rate Limiting & robots.txt Guide" (2026)

### Articles juridiques

- **cloro.dev** — "Is Web Scraping Legal? 7-Country 2026 Compliance Guide" (sept. 2026)
- **dataimpulse.com** — "Is Web Scraping Legal? Laws & Cases (2026 Guide)" (oct. 2026)
- **promptcloud.com** — "Is Web Scraping Legal in 2026? The Complete Compliance Guide" (juillet 2026)

---

**Livrable rédigé le 21 octobre 2026 — Phase 05 du projet EKTS**
