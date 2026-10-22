# Phase 05 — Livrable 05.2 : Matrice des Méthodes de Scraping par Cas d'Usage

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Moyen (analyse des méthodes et cas d'usage)

---

## 1. Objectif

Fournir un guide de décision pour choisir la méthode de scraping appropriée selon le type de site, les données à collecter, et les contraintes techniques/éthiques.

---

## 2. Résumé exécutif

### Méthodes de scraping disponibles

1. **HTTP simple (fetch/axios)** — pour sites statiques sans JavaScript requis
2. **Browser automation (Playwright)** — pour sites avec JavaScript/SPA
3. **API officielle** — toujours privilégier si disponible
4. **Patchright (stealth)** — pour sites protégés avec anti-bot
5. **Jeux de données publics** — alternative au scraping direct

### Règle de décision

```
1. API officielle disponible ? → Utiliser l'API
2. Site statique (HTML pur) ? → HTTP simple
3. Site dynamique (JavaScript requis) ? → Playwright
4. Site protégé (anti-bot) ? → Patchright
5. Aucune option viable ? → Jeux de données publics ou abandon
```

---

## 3. Classification des sites

### 3.1 Par type de rendu

| Type | Description | Exemples | Méthode recommandée |
|------|-------------|----------|---------------------|
| **Statique** | HTML servi directement, pas de JS requis | Wikipedia, documentation, blogs simples | HTTP simple |
| **Dynamique (SPA)** | Contenu généré par JavaScript | React/Vue/Angular apps, sites modernes | Playwright |
| **Hybride** | HTML initial + JS pour contenu additionnel | Sites avec lazy loading, infinite scroll | Playwright |
| **Protégé** | Anti-bot, CAPTCHA, fingerprinting | Sites avec Cloudflare, DataDome | Patchright |

### 3.2 Par accessibilité

| Niveau | Description | Exemples | Scraping autorisé |
|--------|-------------|----------|-------------------|
| **Public ouvert** | Accessible sans restriction | Wikipedia, docs publiques | ✅ Oui |
| **Public avec ToS** | Accessible mais ToS à reviewer | La plupart des sites commerciaux | ⚠️ Vérifier ToS |
| **Authentification requise** | Login nécessaire | Réseaux sociaux, SaaS | ❌ Non (sauf autorisation) |
| **Paywall** | Contenu payant | Journaux, académique | ❌ Non |
| **CAPTCHA** | Protection anti-bot | Sites protégés | ❌ Non contourner |

### 3.3 Par structure de données

| Structure | Description | Exemples | Méthode d'extraction |
|-----------|-------------|----------|----------------------|
| **HTML structuré** | Balises sémantiques claires | Documentation, articles | Selecteurs CSS/XPath |
| **HTML non structuré** | Divs imbriqués, pas de sémantique | Sites legacy, sites mal codés | Analyse DOM complexe |
| **JSON dans HTML** | Données dans `<script>` ou attributes | Sites modernes | Regex ou JSON.parse |
| **API cachée** | Données chargées via XHR/Fetch | SPAs | Network inspection |

---

## 4. Méthodes de scraping détaillées

### 4.1 HTTP simple (fetch/axios)

**Description :** Requêtes HTTP directes pour télécharger le HTML

**Quand utiliser :**
- Site statique (HTML pur)
- Pas de JavaScript requis pour le contenu
- Performance critique
- Volume important

**Avantages :**
- Très rapide (<1s par page)
- Faible consommation mémoire
- Simple à implémenter
- Facile à paralléliser

**Limites :**
- Ne fonctionne pas avec JavaScript
- Ne peut pas interagir avec la page
- Contournement anti-bot limité

**Implémentation EKTS :**

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

async function simpleScrape(url: string): Promise<any> {
  // 1. Vérifier compliance
  const compliance = await complianceMiddleware.preScrape(url);
  if (!compliance.allowed) {
    throw new Error(`Scraping not allowed: ${compliance.reason}`);
  }
  
  // 2. Fetch HTML
  const response = await axios.get(url, {
    headers: {
      'User-Agent': EKTS_CONFIG.userAgent,
      'Accept': 'text/html,application/xhtml+xml'
    },
    timeout: 30000
  });
  
  // 3. Parse HTML
  const $ = cheerio.load(response.data);
  
  // 4. Extraire les données
  const data = {
    title: $('title').text(),
    description: $('meta[name="description"]').attr('content'),
    headings: $('h1, h2, h3').map((i, el) => $(el).text()).get(),
    links: $('a[href]').map((i, el) => ({
      href: $(el).attr('href'),
      text: $(el).text()
    })).get()
  };
  
  // 5. Nettoyer
  const cleaned = await complianceMiddleware.postScrape(data);
  
  return cleaned;
}
```

**Cas d'usage EKTS :**
- Documentation technique (MDN, docs officielles)
- Articles de blog
- Pages de produits simples
- Sites de news

### 4.2 Browser automation (Playwright)

**Description :** Contrôle d'un navigateur headless pour interagir avec la page

**Quand utiliser :**
- Site avec JavaScript (SPA)
- Contenu chargé dynamiquement
- Interaction requise (scroll, click)
- Besoin de screenshots

**Avantages :**
- Fonctionne avec JavaScript
- Peut interagir avec la page
- Supporte les sites complexes
- Screenshot et capture visuelle

**Limites :**
- Plus lent (2-5s par page)
- Consomme plus de mémoire
- Plus complexe à implémenter
- Détectable comme bot

**Implémentation EKTS :**

```typescript
import { chromium } from 'playwright';

async function browserScrape(url: string): Promise<any> {
  // 1. Vérifier compliance
  const compliance = await complianceMiddleware.preScrape(url);
  if (!compliance.allowed) {
    throw new Error(`Scraping not allowed: ${compliance.reason}`);
  }
  
  // 2. Lancer navigateur
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    userAgent: EKTS_CONFIG.userAgent
  });
  
  const page = await context.newPage();
  
  // 3. Naviguer
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // 4. Attendre contenu
  await page.waitForSelector('main, article, #content', {
    timeout: 10000
  });
  
  // 5. Extraire les données
  const data = await page.evaluate(() => {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.textContent),
      content: document.querySelector('main, article')?.textContent
    };
  });
  
  // 6. Screenshot (optionnel)
  const screenshot = await page.screenshot({ fullPage: true });
  
  await browser.close();
  
  // 7. Nettoyer
  const cleaned = await complianceMiddleware.postScrape(data);
  
  return { ...cleaned, screenshot };
}
```

**Cas d'usage EKTS :**
- Sites modernes (React, Vue, Angular)
- Sites avec infinite scroll
- Sites avec contenu lazy-loaded
- Besoin de screenshots

### 4.3 API officielle

**Description :** Utilisation d'une API publique documentée

**Quand utiliser :**
- API officielle disponible
- Données structurées (JSON/XML)
- Accès autorisé
- Volume important

**Avantages :**
- Données structurées
- Accès autorisé
- Stable et fiable
- Pas de parsing HTML

**Limites :**
- Pas toujours disponible
- Peut avoir des limites (rate, quota)
- Parfois payant
- Peut nécessiter authentification

**Implémentation EKTS :**

```typescript
async function apiScrape(
  apiUrl: string,
  apiKey?: string
): Promise<any> {
  // 1. Vérifier compliance
  const compliance = await complianceMiddleware.preScrape(apiUrl);
  if (!compliance.allowed) {
    throw new Error(`API access not allowed: ${compliance.reason}`);
  }
  
  // 2. Préparer headers
  const headers: Record<string, string> = {
    'User-Agent': EKTS_CONFIG.userAgent,
    'Accept': 'application/json'
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  // 3. Fetch data
  const response = await axios.get(apiUrl, { headers });
  
  // 4. Nettoyer
  const cleaned = await complianceMiddleware.postScrape(response.data);
  
  return cleaned;
}
```

**Cas d'usage EKTS :**
- GitHub API (repositories, issues)
- npm API (packages)
- Stack Exchange API (questions, answers)
- APIs publiques (data.gov, etc.)

### 4.4 Patchright (stealth)

**Description :** Fork de Playwright avec patches anti-détection

**Quand utiliser :**
- Site avec anti-bot (Cloudflare, DataDome)
- Playwright standard bloqué
- Données publiques mais protégées
- Pas d'alternative viable

**Avantages :**
- Passe les protections anti-bot
- Drop-in replacement pour Playwright
- API identique

**Limites :**
- Plus lent que Playwright standard
- Maintenance à suivre les releases
- Zone grise éthique
- Chromium uniquement

**Implémentation EKTS :**

```typescript
import { chromium } from 'patchright'; // Drop-in replacement

async function stealthScrape(url: string): Promise<any> {
  // 1. Vérifier compliance (plus strict pour stealth)
  const compliance = await complianceMiddleware.preScrape(url);
  if (!compliance.allowed) {
    throw new Error(`Stealth scraping not allowed: ${compliance.reason}`);
  }
  
  // 2. Vérifier que c'est justifié
  if (!isStealthJustified(url)) {
    throw new Error('Stealth mode not justified for this site');
  }
  
  // 3. Lancer navigateur stealth
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome' // Utilise Chrome system pour TLS fingerprint
  });
  
  const context = await browser.newContext({
    userAgent: EKTS_CONFIG.userAgent
  });
  
  const page = await context.newPage();
  
  // 4. Naviguer (Patchright gère l'anti-détection)
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // 5. Extraire
  const data = await page.evaluate(() => {
    return {
      title: document.title,
      content: document.body.textContent
    };
  });
  
  await browser.close();
  
  // 6. Logger l'usage de stealth
  await auditLogger.log({
    type: 'stealth_scrape',
    url,
    justification: 'Anti-bot protection detected, public data'
  });
  
  return data;
}
```

**Cas d'usage EKTS :**
- Sites avec Cloudflare (si données publiques)
- Sites avec DataDome (si données publiques)
- Sites bloquant Playwright standard
- **Uniquement si données publiques et légitimes**

### 4.5 Jeux de données publics

**Description :** Utilisation de datasets pré-existants

**Quand utiliser :**
- Scraping risqué ou interdit
- Données déjà disponibles
- Volume important nécessaire
- Pas besoin de données en temps réel

**Avantages :**
- Pas de scraping requis
- Données nettoyées et structurées
- Légalement sûr
- Rapide

**Limites :**
- Pas toujours disponible
- Peut être obsolète
- Pas de données spécifiques
- Licence à vérifier

**Sources EKTS :**
- **Kaggle** — datasets variés
- **data.gov** — données publiques US
- **EU Open Data** — données publiques EU
- **GitHub Datasets** — repositories de datasets
- **Hugging Face Datasets** — pour ML/NLP

---

## 5. Matrice de décision

### 5.1 Arbre de décision

```
START
  │
  ├─→ API officielle disponible ?
  │     ├─→ OUI → Utiliser API ✅
  │     └─→ NON ↓
  │
  ├─→ Site statique (HTML pur) ?
  │     ├─→ OUI → HTTP simple ✅
  │     └─→ NON ↓
  │
  ├─→ Site dynamique (JS requis) ?
  │     ├─→ OUI ↓
  │     │     ├─→ Site protégé (anti-bot) ?
  │     │     │     ├─→ OUI → Patchright ⚠️ (justifier)
  │     │     │     └─→ NON → Playwright ✅
  │     │     └─→ Site protégé ?
  │     │           ├─→ OUI → Patchright ⚠️ (justifier)
  │     │           └─→ NON → Playwright ✅
  │     └─→ NON ↓
  │
  ├─→ Jeu de données public disponible ?
  │     ├─→ OUI → Utiliser dataset ✅
  │     └─→ NON ↓
  │
  └─→ Abandonner ou chercher alternative ❌
```

### 5.2 Matrice complète

| Type de site | HTTP | Playwright | Patchright | API | Dataset |
|--------------|------|------------|------------|-----|---------|
| **Statique public** | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| **Dynamique public** | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| **Protégé public** | ❌ | ❌ | ⚠️ | ❌ | ⚠️ |
| **Authentification** | ❌ | ❌ | ❌ | ⚠️ | ❌ |
| **Paywall** | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| **CAPTCHA** | ❌ | ❌ | ❌ | ❌ | ❌ |

**Légende :**
- ✅ = Recommandé
- ⚠️ = Possible avec précautions
- ❌ = Déconseillé ou interdit

### 5.3 Matrice par volume

| Volume | Méthode recommandée | Justification |
|--------|---------------------|---------------|
| **< 100 pages** | Playwright | Simple, rapide à implémenter |
| **100-1000 pages** | HTTP ou Playwright | Dépend du type de site |
| **1000-10000 pages** | HTTP + parallélisme | Performance critique |
| **> 10000 pages** | API ou Dataset | Scaling requis |

### 5.4 Matrice par fréquence

| Fréquence | Méthode recommandée | Justification |
|-----------|---------------------|---------------|
| **One-shot** | Playwright | Simple, pas d'optimisation |
| **Quotidienne** | HTTP + cache | Performance, respect du site |
| **Temps réel** | API ou WebSocket | Données live |
| **Hebdomadaire** | HTTP +增量 | Mise à jour incrémentale |

---

## 6. Exemples concrets

### 6.1 Cas 1 : Documentation MDN

**Site :** developer.mozilla.org  
**Type :** Statique (HTML pur)  
**Données :** Tutoriels, références API  
**Volume :** ~5000 pages  
**Fréquence :** One-shot

**Méthode recommandée :** HTTP simple

```typescript
async function scrapeMDN(): Promise<void> {
  const urls = await getSitemapUrls('https://developer.mozilla.org/sitemap.xml');
  
  for (const url of urls) {
    const data = await simpleScrape(url);
    await saveToDatabase(data);
    await sleep(2000); // Respect
  }
}
```

### 6.2 Cas 2 : Produits e-commerce

**Site :** example-shop.com  
**Type :** Dynamique (React SPA)  
**Données :** Produits, prix, descriptions  
**Volume :** ~10000 produits  
**Fréquence :** Quotidienne

**Méthode recommandée :** API (si disponible) ou Playwright

```typescript
async function scrapeProducts(): Promise<void> {
  // Option 1 : API (si disponible)
  if (hasOfficialAPI('example-shop.com')) {
    const products = await apiScrape('https://api.example-shop.com/products');
    return products;
  }
  
  // Option 2 : Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let page_num = 1;
  let hasMore = true;
  
  while (hasMore) {
    await page.goto(`https://example-shop.com/products?page=${page_num}`);
    await page.waitForSelector('.product-card');
    
    const products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-card')).map(card => ({
        name: card.querySelector('.name').textContent,
        price: card.querySelector('.price').textContent,
        url: card.querySelector('a').href
      }));
    });
    
    await saveToDatabase(products);
    
    hasMore = await page.$('.next-page') !== null;
    page_num++;
    
    await sleep(3000); // Respect
  }
  
  await browser.close();
}
```

### 6.3 Cas 3 : Articles de news protégés

**Site :** news-site.com  
**Type :** Dynamique + Cloudflare  
**Données :** Titres, résumés, dates  
**Volume :** ~100 articles/jour  
**Fréquence :** Quotidienne

**Méthode recommandée :** RSS ou API (si disponible), sinon abandon

```typescript
async function scrapeNews(): Promise<void> {
  // Option 1 : RSS (toujours préférer)
  if (hasRSS('news-site.com')) {
    const articles = await parseRSS('https://news-site.com/rss');
    return articles;
  }
  
  // Option 2 : API officielle
  if (hasOfficialAPI('news-site.com')) {
    const articles = await apiScrape('https://api.news-site.com/articles');
    return articles;
  }
  
  // Option 3 : Abandonner (site protégé, pas d'alternative)
  console.log('No viable method for news-site.com, skipping');
  return [];
}
```

**Note :** Ne pas utiliser Patchright pour des articles de news protégés. Le risque légal et éthique est trop élevé. Privilégier les alternatives (RSS, API, datasets).

### 6.4 Cas 4 : Profils GitHub

**Site :** github.com  
**Type :** Dynamique  
**Données :** Repos, stars, contributions  
**Volume :** ~1000 profils  
**Fréquence :** Hebdomadaire

**Méthode recommandée :** GitHub API

```typescript
async function scrapeGitHubProfiles(usernames: string[]): Promise<void> {
  for (const username of usernames) {
    // Utiliser l'API officielle
    const profile = await apiScrape(
      `https://api.github.com/users/${username}`,
      process.env.GITHUB_TOKEN
    );
    
    const repos = await apiScrape(
      `https://api.github.com/users/${username}/repos`,
      process.env.GITHUB_TOKEN
    );
    
    await saveToDatabase({ profile, repos });
    
    await sleep(1000); // Respect rate limits
  }
}
```

### 6.5 Cas 5 : Forum Stack Overflow

**Site :** stackoverflow.com  
**Type :** Dynamique  
**Données :** Questions, réponses, tags  
**Volume :** ~100000 questions  
**Fréquence :** One-shot

**Méthode recommandée :** Stack Exchange API ou dataset public

```typescript
async function scrapeStackOverflow(): Promise<void> {
  // Option 1 : API officielle (rate limited mais fiable)
  const questions = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await apiScrape(
      `https://api.stackexchange.com/2.3/questions?page=${page}&pagesize=100&site=stackoverflow`
    );
    
    questions.push(...batch.items);
    hasMore = batch.has_more;
    page++;
    
    await sleep(1000); // Respect rate limits
  }
  
  // Option 2 : Dataset public (plus rapide)
  // https://archive.org/details/stackexchange
  const dataset = await loadDataset('stackexchange-dump.zip');
  
  await saveToDatabase(dataset);
}
```

---

## 7. Bonnes pratiques par méthode

### 7.1 HTTP simple

**Do :**
- ✅ Vérifier robots.txt
- ✅ Respecter Crawl-delay
- ✅ User-Agent explicite
- ✅ Rate limiting (1-2 req/s)
- ✅ Cache les réponses

**Don't :**
- ❌ Scraper trop rapidement
- ❌ Ignorer les erreurs 429/503
- ❌ Scraper sans vérifier compliance

### 7.2 Playwright

**Do :**
- ✅ Réutiliser le navigateur
- ✅ BrowserContexts isolés
- ✅ Wait for selectors (auto-wait)
- ✅ Screenshot pour debug
- ✅ Rate limiting (2-5 req/s)

**Don't :**
- ❌ Lancer un nouveau navigateur par page
- ❌ Ignorer les timeouts
- ❌ Scraper sans headless=false pour debug

### 7.3 API officielle

**Do :**
- ✅ Lire la documentation
- ✅ Respecter rate limits
- ✅ Utiliser authentification si requise
- ✅ Gérer les erreurs (401, 403, 429)
- ✅ Cache les réponses

**Don't :**
- ❌ Dépasser les quotas
- ❌ Partager les API keys
- ❌ Ignorer les limites d'usage

### 7.4 Patchright

**Do :**
- ✅ Justifier l'usage (site protégé, données publiques)
- ✅ Logger toutes les opérations
- ✅ Tester d'abord avec Playwright standard
- ✅ Respecter robots.txt même avec stealth
- ✅ Limiter l'usage aux cas nécessaires

**Don't :**
- ❌ Utiliser pour des données non-publiques
- ❌ Contourner CAPTCHAs
- ❌ Scraper massivement
- ❌ Utiliser sans justification

---

## 8. Performance et scaling

### 8.1 Parallélisation

```typescript
import pLimit from 'p-limit';

async function parallelScrape(urls: string[], concurrency: number = 5): Promise<any[]> {
  const limit = pLimit(concurrency);
  
  const results = await Promise.all(
    urls.map(url => limit(async () => {
      try {
        return await scrapeUrl(url);
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return null;
      }
    }))
  );
  
  return results.filter(r => r !== null);
}
```

### 8.2 Cache

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function scrapeWithCache(url: string): Promise<any> {
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }
  
  const data = await scrapeUrl(url);
  cache.set(url, data);
  
  return data;
}
```

### 8.3 Incrémental

```typescript
async function incrementalScrape(url: string): Promise<any> {
  const lastScraped = await getLastScrapedTimestamp(url);
  
  // Vérifier si le contenu a changé
  const response = await axios.head(url, {
    headers: { 'If-Modified-Since': lastScraped.toISOString() }
  });
  
  if (response.status === 304) {
    console.log('Content not modified');
    return null;
  }
  
  // Contenu modifié, scraper
  const data = await scrapeUrl(url);
  await updateLastScrapedTimestamp(url, new Date());
  
  return data;
}
```

---

## 9. Gestion des erreurs

### 9.1 Types d'erreurs

| Erreur | Cause | Action |
|--------|-------|--------|
| **403 Forbidden** | Bloqué par le site | Arrêter, vérifier robots.txt/ToS |
| **429 Too Many Requests** | Rate limited | Attendre (Retry-After header) |
| **503 Service Unavailable** | Surcharge | Attendre, retry avec backoff |
| **Timeout** | Site lent | Retry avec timeout plus long |
| **CAPTCHA** | Protection anti-bot | Abandonner, chercher alternative |
| **Login required** | Authentification requise | Abandonner (sauf autorisation) |

### 9.2 Retry策略

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Ne pas retry sur 403, 401, CAPTCHA
      if (error.status === 403 || error.status === 401) {
        throw error;
      }
      
      // Backoff exponentiel
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
  throw new Error('Max retries reached');
}
```

---

## 10. Checklist de décision

### Avant de scraper

- [ ] API officielle disponible ? → Utiliser l'API
- [ ] Dataset public disponible ? → Utiliser le dataset
- [ ] Site statique ? → HTTP simple
- [ ] Site dynamique ? → Playwright
- [ ] Site protégé ? → Patchright (justifier)
- [ ] robots.txt respecté ?
- [ ] ToS reviewés ?
- [ ] Données personnelles ? → LIA si oui
- [ ] Rate limiting configuré ?
- [ ] User-Agent explicite ?

### Pendant le scraping

- [ ] Pas de signes de surcharge ?
- [ ] Erreurs gérées correctement ?
- [ ] Logging actif ?
- [ ] Compliance vérifiée ?

### Après le scraping

- [ ] Données nettoyées ?
- [ ] Données personnelles anonymisées ?
- [ ] Audit log complété ?
- [ ] Rétention définie ?

---

## 11. Limites et incertitudes

### 11.1 Zones grises

- **Sites hybrides** : limite entre statique et dynamique floue
- **APIs cachées** : statut légal flou
- **Anti-bot léger** : quand utiliser Patchright ?

### 11.2 Évolution

- **Sites qui changent** : structure HTML, protections
- **Nouvelles protections** : fingerprinting avancé
- **Réglementation** : lois privacy évolutives

### 11.3 Non vérifié

- Efficacité de Patchright sur toutes les protections
- Performance de Playwright sur sites très complexes
- Viabilité long terme des APIs gratuites

---

## 12. Recommandations

### 12.1 Pour EKTS

1. **Privilégier les APIs et datasets** — toujours la première option
2. **HTTP simple par défaut** — pour sites statiques
3. **Playwright pour dynamique** — cas standard
4. **Patchright avec modération** — uniquement si justifié
5. **Documenter toutes les décisions** — traçabilité

### 12.2 Priorités

| Priorité | Méthode | Quand |
|----------|---------|-------|
| **1** | API officielle | Toujours si disponible |
| **2** | Dataset public | Si données suffisantes |
| **3** | HTTP simple | Sites statiques |
| **4** | Playwright | Sites dynamiques |
| **5** | Patchright | Sites protégés (justifié) |

### 12.3 À éviter

- ❌ Scraping de données non-publiques
- ❌ Contournement de CAPTCHAs
- ❌ Scraping massif sans respect
- ❌ Ignorer robots.txt ou ToS
- ❌ Collecte de données personnelles sans LIA

---

## 13. Sources

### Documentation

- **Playwright** : https://playwright.dev/docs
- **Patchright** : https://github.com/Kaliiiiiiiiii-Vinyzu/patchright
- **robots.txt RFC 9309** : https://www.rfc-editor.org/rfc/rfc9309

### APIs publiques

- **GitHub API** : https://docs.github.com/en/rest
- **Stack Exchange API** : https://api.stackexchange.com/
- **npm API** : https://github.com/npm/registry

### Datasets

- **Kaggle** : https://www.kaggle.com/datasets
- **data.gov** : https://data.gov
- **EU Open Data** : https://data.europa.eu
- **Hugging Face Datasets** : https://huggingface.co/datasets

### Articles

- **ScrapingBee** : "A Web Scraper's Guide to Robots.txt" (2026)
- **Scrapfly** : "11 Web Scraping Best Practices" (2026)
- **Bright Data** : "Ethical Web Scraping Best Practices" (2026)

---

**Livrable rédigé le 21 octobre 2026 — Phase 05 du projet EKTS**
