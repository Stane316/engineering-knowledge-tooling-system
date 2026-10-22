# Phase 04 — Livrable 04.2 : Spécification d'un Workflow d'Inspection de Site EKTS

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Élevé (conception architecturale)

---

## 1. Objectif

Définir un workflow d'inspection de site reproductible, fiable et intégrable avec les agents IA via MCP pour EKTS.

---

## 2. Résumé exécutif

### Qu'est-ce qu'une inspection EKTS ?

Une inspection est une **analyse structurée d'un site web** qui capture :
- **Structure** — DOM, éléments, liens, formulaires
- **Contenu** — texte, images, métadonnées
- **Comportement** — interactions, performances, erreurs
- **Visuel** — screenshots, rendus, responsive

### Workflow en 5 étapes

1. **Préparation** — validation de l'URL, configuration
2. **Navigation** — chargement, attente stabilité
3. **Capture** — extraction des données structurées
4. **Analyse** — traitement et validation
5. **Stockage** — sauvegarde des résultats

### Outils MCP exposés

- `inspect_website` — inspection complète d'un site
- `capture_screenshot` — capture visuelle d'une page
- `extract_structure` — extraction de la structure DOM
- `analyze_performance` — analyse des performances

---

## 3. Concepts clés

### 3.1 Types d'inspection

#### Inspection structurelle

**Objectif :** Comprendre l'organisation de la page

**Données capturées :**
- Arborescence DOM (éléments, attributs, hiérarchie)
- Liens internes et externes
- Formulaires et champs
- Éléments interactifs (boutons, menus, modals)
- Métadonnées (title, meta, og:*, structured data)

**Cas d'usage EKTS :**
- Cartographie d'un site pour navigation
- Identification des ressources pertinentes
- Extraction de liens pour crawling

#### Inspection de contenu

**Objectif :** Extraire le contenu textuel et multimédia

**Données capturées :**
- Texte structuré (titres, paragraphes, listes)
- Images (URL, alt, dimensions)
- Vidéos (URL, durée, sous-titres)
- Documents (PDF, DOC, liens de téléchargement)
- Tableaux et données structurées

**Cas d'usage EKTS :**
- Extraction de tutoriels et documentations
- Capture de ressources pour la bibliothèque
- Indexation de contenu pour recherche

#### Inspection visuelle

**Objectif :** Capturer le rendu visuel

**Données capturées :**
- Screenshots (full page, viewport, éléments)
- Responsive (mobile, tablet, desktop)
- Comparaison visuelle (avant/après)
- Accessibilité (contrastes, tailles de police)

**Cas d'usage EKTS :**
- Documentation visuelle de sites
- Analyse UX/UI
- Vérification de rendu

#### Inspection comportementale

**Objectif :** Analyser les interactions et performances

**Données capturées :**
- Temps de chargement (FCP, LCP, TTI)
- Requêtes réseau (API calls, assets)
- Erreurs JavaScript (console errors)
- Interactions utilisateur (clicks, scrolls, forms)
- Animations et transitions

**Cas d'usage EKTS :**
- Évaluation de la qualité technique
- Identification des problèmes de performance
- Test de fonctionnalités

### 3.2 Niveaux d'inspection

| Niveau | Profondeur | Durée | Usage |
|--------|------------|-------|-------|
| **L1 — Rapide** | Surface (titre, meta, screenshot) | <5s | Preview, validation rapide |
| **L2 — Standard** | Structure + contenu principal | 10-30s | Inspection courante |
| **L3 — Complète** | Structure + contenu + comportement | 30-60s | Analyse approfondie |
| **L4 — Exhaustive** | Toutes les pages liées (crawling) | 2-10min | Cartographie complète |

### 3.3 Patterns de capture

#### Pattern 1 : Snapshot Accessibility Tree

**Description :** Capture de l'arbre d'accessibilité (utilisé par Playwright MCP)

**Avantages :**
- Léger en tokens (~1-5K tokens par page)
- Structuré et exploitable par les LLMs
- Pas de vision models nécessaires

**Limites :**
- Pas de rendu visuel
- Dépend de la qualité du markup HTML

**Usage EKTS :** Inspection L1 et L2, extraction de contenu

#### Pattern 2 : Screenshot + OCR

**Description :** Capture visuelle + extraction de texte par OCR

**Avantages :**
- Capture le rendu exact
- Fonctionne même avec du contenu dynamique

**Limites :**
- Lourde en tokens (~1-5K tokens par image)
- Nécessite vision models ou OCR
- Moins structuré

**Usage EKTS :** Inspection visuelle, analyse UX/UI

#### Pattern 3 : DOM Extraction

**Description :** Extraction directe du DOM via JavaScript

**Avantages :**
- Données structurées
- Pas de perte d'information
- Rapide

**Limites :**
- Nécessite d'exécuter du JavaScript
- Peut être bloqué par CSP

**Usage EKTS :** Inspection structurelle, extraction de données

#### Pattern 4 : Network Interception

**Description :** Capture des requêtes/réponses réseau

**Avantages :**
- Accès aux APIs cachées
- Données brutes (JSON, XML)
- Performance metrics

**Limites :**
- Volume de données important
- Nécessite filtrage

**Usage EKTS :** Inspection comportementale, analyse des APIs

---

## 4. Spécification du workflow

### 4.1 Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│                    EKTS Inspector                         │
├─────────────────────────────────────────────────────────┤
│  Input: URL + Configuration                              │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. PRÉPARATION                                    │   │
│  │    - Validation URL                               │   │
│  │    - Chargement configuration                     │   │
│  │    - Initialisation navigateur                    │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 2. NAVIGATION                                     │   │
│  │    - Chargement page                              │   │
│  │    - Attente stabilité (auto-wait)                │   │
│  │    - Gestion redirections                         │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 3. CAPTURE                                        │   │
│  │    - Snapshot accessibility tree                  │   │
│  │    - Extraction DOM                               │   │
│  │    - Screenshots                                  │   │
│  │    - Network requests                             │   │
│  │    - Console messages                             │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 4. ANALYSE                                        │   │
│  │    - Validation données                           │   │
│  │    - Extraction contenu structuré                 │   │
│  │    - Calcul métriques performance                 │   │
│  │    - Détection erreurs                            │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 5. STOCKAGE                                       │   │
│  │    - Sauvegarde résultats JSON                    │   │
│  │    - Indexation métadonnées                       │   │
│  │    - Génération résumé                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Output: InspectionResult                                  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Entrées

#### Configuration d'inspection

```typescript
interface InspectionConfig {
  // Obligatoire
  url: string;
  
  // Niveau d'inspection
  level: 'L1' | 'L2' | 'L3' | 'L4';
  
  // Options de capture
  capture: {
    screenshot?: boolean;           // Défaut: true pour L1+, false sinon
    fullPage?: boolean;             // Défaut: false (viewport seulement)
    dom?: boolean;                  // Défaut: true pour L2+
    network?: boolean;              // Défaut: true pour L3+
    console?: boolean;              // Défaut: true pour L3+
    performance?: boolean;          // Défaut: true pour L3+
    accessibility?: boolean;        // Défaut: true
  };
  
  // Options navigateur
  browser: {
    type: 'chromium' | 'firefox' | 'webkit';  // Défaut: chromium
    headless?: boolean;             // Défaut: true
    viewport?: { width: number; height: number };  // Défaut: 1280x720
    userAgent?: string;             // Défaut: Playwright standard
    stealth?: boolean;              // Défaut: false (utilise Patchright si true)
  };
  
  // Options de comportement
  behavior: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';  // Défaut: networkidle
    timeout?: number;               // Défaut: 30000ms
    retryCount?: number;            // Défaut: 3
    retryDelay?: number;            // Défaut: 1000ms
    scrollDepth?: number;           // Défaut: 0 (pas de scroll)
    delay?: number;                 // Défaut: 0 (respect site)
  };
  
  // Filtres
  filters?: {
    includePatterns?: string[];     // URLs à inclure (regex)
    excludePatterns?: string[];     // URLs à exclure (regex)
    maxDepth?: number;              // Profondeur max pour L4 (défaut: 2)
    maxPages?: number;              // Nombre max de pages pour L4 (défaut: 100)
  };
}
```

### 4.3 Sorties

#### Résultat d'inspection

```typescript
interface InspectionResult {
  // Métadonnées
  id: string;                       // UUID
  url: string;
  timestamp: string;                // ISO 8601
  duration: number;                 // ms
  level: 'L1' | 'L2' | 'L3' | 'L4';
  
  // Statut
  status: 'success' | 'partial' | 'error';
  errors: InspectionError[];
  warnings: string[];
  
  // Informations page
  page: {
    title: string;
    description?: string;
    language?: string;
    canonical?: string;
    robots?: string;
  };
  
  // Captures (selon niveau)
  captures?: {
    accessibility?: AccessibilitySnapshot;
    dom?: DOMStructure;
    screenshot?: ScreenshotData;
    network?: NetworkData;
    console?: ConsoleData;
    performance?: PerformanceData;
  };
  
  // Contenu extrait
  content?: {
    headings: Heading[];
    paragraphs: string[];
    links: Link[];
    images: Image[];
    forms: Form[];
    tables: Table[];
    metadata: Record<string, any>;
  };
  
  // Métriques
  metrics: {
    loadTime: number;               // ms
    pageSize: number;               // bytes
    requestCount: number;
    errorCount: number;
    accessibilityScore?: number;    // 0-100
    performanceScore?: number;      // 0-100
  };
  
  // Crawling (L4 seulement)
  crawledPages?: InspectionResult[];
  
  // Résumé pour LLM
  summary: string;
}
```

### 4.4 Étapes détaillées

#### Étape 1 : Préparation

**Actions :**
1. Validation de l'URL (format, accessibilité)
2. Vérification robots.txt
3. Chargement de la configuration
4. Initialisation du navigateur (Playwright ou Patchright)
5. Création d'un BrowserContext isolé

**Validation :**
- URL valide (format http/https)
- Domaine accessible (DNS resolution)
- robots.txt autorisé
- Pas dans la blacklist EKTS

**Erreurs possibles :**
- `InvalidUrlError` — URL mal formée
- `DomainNotAccessibleError` — DNS failure
- `RobotsTxtBlockedError` — interdit par robots.txt
- `BlacklistedDomainError` — domaine dans la blacklist

#### Étape 2 : Navigation

**Actions :**
1. Navigation vers l'URL
2. Attente de la stabilité (auto-wait Playwright)
3. Gestion des redirections
4. Détection des erreurs de chargement
5. Retry si échec (avec backoff exponentiel)

**Stratégie d'attente :**
```typescript
// Attendre que la page soit stable
await page.goto(url, {
  waitUntil: 'networkidle',  // Pas de requêtes réseau pendant 500ms
  timeout: 30000             // Timeout après 30s
});

// Attendre que le contenu principal soit visible
await page.waitForSelector('main, article, #content, .content', {
  state: 'visible',
  timeout: 10000
});
```

**Erreurs possibles :**
- `TimeoutError` — page ne charge pas dans le temps imparti
- `NavigationError` — erreur de navigation (5xx, réseau)
- `RedirectLoopError` — boucle de redirections

#### Étape 3 : Capture

**Actions selon le niveau :**

**L1 — Rapide :**
- Snapshot accessibility tree
- Screenshot viewport
- Métadonnées (title, description)

**L2 — Standard :**
- Tout L1 +
- Extraction DOM (structure)
- Extraction contenu (headings, paragraphs, links, images)
- Screenshot full page (optionnel)

**L3 — Complète :**
- Tout L2 +
- Network requests capture
- Console messages capture
- Performance metrics
- Scroll et capture de contenu dynamique

**L4 — Exhaustive :**
- Tout L3 +
- Crawling des pages liées (respectant filters)
- Récursion jusqu'à maxDepth ou maxPages

**Capture DOM :**
```typescript
const domStructure = await page.evaluate(() => {
  const extractStructure = (element) => {
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList),
      attributes: Object.fromEntries(
        Array.from(element.attributes)
          .filter(attr => !['style', 'class'].includes(attr.name))
          .map(attr => [attr.name, attr.value])
      ),
      text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3
        ? element.textContent.trim()
        : null,
      children: Array.from(element.children).map(extractStructure)
    };
  };
  
  return extractStructure(document.body);
});
```

**Capture network :**
```typescript
const networkRequests: NetworkRequest[] = [];

page.on('request', request => {
  networkRequests.push({
    url: request.url(),
    method: request.method(),
    resourceType: request.resourceType(),
    timestamp: Date.now()
  });
});

page.on('response', response => {
  const request = networkRequests.find(r => r.url === response.url());
  if (request) {
    request.status = response.status();
    request.duration = Date.now() - request.timestamp;
  }
});
```

**Capture screenshot :**
```typescript
const screenshot = await page.screenshot({
  fullPage: config.capture.fullPage,
  type: 'png',
  omitBackground: false
});
```

#### Étape 4 : Analyse

**Actions :**
1. Validation des données capturées
2. Extraction de contenu structuré
3. Calcul des métriques
4. Détection d'erreurs et warnings
5. Génération de résumé

**Validation :**
- Données non vides
- URLs valides
- Encode correct (UTF-8)
- Pas de données sensibles (mots de passe, tokens)

**Extraction de contenu :**
```typescript
const content = {
  headings: await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
    elements.map(el => ({
      level: parseInt(el.tagName[1]),
      text: el.textContent.trim(),
      id: el.id || null
    }))
  ),
  
  paragraphs: await page.$$eval('p', elements =>
    elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
  ),
  
  links: await page.$$eval('a[href]', elements =>
    elements.map(el => ({
      href: el.href,
      text: el.textContent.trim(),
      isExternal: !el.href.startsWith(window.location.origin)
    }))
  ),
  
  images: await page.$$eval('img[src]', elements =>
    elements.map(el => ({
      src: el.src,
      alt: el.alt || null,
      width: el.naturalWidth,
      height: el.naturalHeight
    }))
  )
};
```

**Calcul des métriques :**
```typescript
const metrics = {
  loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  pageSize: await page.evaluate(() => performance.getEntriesByType('resource')
    .reduce((sum, r) => sum + r.transferSize, 0)),
  requestCount: networkRequests.length,
  errorCount: consoleMessages.filter(m => m.type === 'error').length,
  accessibilityScore: calculateAccessibilityScore(accessibilitySnapshot),
  performanceScore: calculatePerformanceScore(performanceMetrics)
};
```

**Génération de résumé :**
```typescript
const summary = `
Page: ${page.title}
URL: ${url}
Niveau: ${level}
Durée: ${duration}ms

Contenu:
- ${content.headings.length} titres
- ${content.paragraphs.length} paragraphes
- ${content.links.length} liens (${content.links.filter(l => l.isExternal).length} externes)
- ${content.images.length} images

Performance:
- Temps de chargement: ${metrics.loadTime}ms
- Taille: ${(metrics.pageSize / 1024).toFixed(2)} KB
- Requêtes: ${metrics.requestCount}
- Erreurs: ${metrics.errorCount}

${metrics.accessibilityScore ? `Accessibilité: ${metrics.accessibilityScore}/100` : ''}
${metrics.performanceScore ? `Performance: ${metrics.performanceScore}/100` : ''}
`.trim();
```

#### Étape 5 : Stockage

**Actions :**
1. Sérialisation du résultat en JSON
2. Sauvegarde dans le stockage EKTS
3. Indexation des métadonnées
4. Génération d'un ID unique
5. Retour du résultat

**Structure de stockage :**
```
ekts-data/
└── inspections/
    └── {domain}/
        ├── {timestamp}_{url-hash}_L1.json
        ├── {timestamp}_{url-hash}_L2.json
        ├── {timestamp}_{url-hash}_L3.json
        └── screenshots/
            ├── {timestamp}_{url-hash}_viewport.png
            └── {timestamp}_{url-hash}_fullpage.png
```

**Indexation :**
```typescript
const indexEntry = {
  id: result.id,
  url: result.url,
  domain: new URL(result.url).hostname,
  timestamp: result.timestamp,
  level: result.level,
  title: result.page.title,
  status: result.status,
  metrics: result.metrics
};

await indexStore.add(indexEntry);
```

---

## 5. Outils MCP

### 5.1 Tool : `inspect_website`

**Description :** Inspection complète d'un site web

**Entrées :**
```typescript
{
  url: string;                    // URL à inspecter
  level?: 'L1' | 'L2' | 'L3' | 'L4';  // Niveau (défaut: L2)
  capture?: {
    screenshot?: boolean;
    dom?: boolean;
    network?: boolean;
    performance?: boolean;
  };
  browser?: {
    type?: 'chromium' | 'firefox' | 'webkit';
    stealth?: boolean;
  };
}
```

**Sorties :**
```typescript
{
  success: boolean;
  result?: InspectionResult;
  error?: string;
}
```

**Exemple d'utilisation :**
```typescript
// Via MCP
const result = await mcp.call('inspect_website', {
  url: 'https://example.com',
  level: 'L2',
  capture: { screenshot: true, dom: true }
});
```

### 5.2 Tool : `capture_screenshot`

**Description :** Capture d'un screenshot d'une page

**Entrées :**
```typescript
{
  url: string;
  fullPage?: boolean;             // Défaut: false
  viewport?: { width: number; height: number };
  selector?: string;              // Sélecteur CSS pour capturer un élément spécifique
}
```

**Sorties :**
```typescript
{
  success: boolean;
  screenshot?: string;            // Base64 encoded PNG
  path?: string;                  // Chemin du fichier sauvegardé
  error?: string;
}
```

### 5.3 Tool : `extract_structure`

**Description :** Extraction de la structure DOM

**Entrées :**
```typescript
{
  url: string;
  depth?: number;                 // Profondeur d'extraction (défaut: 3)
  selector?: string;              // Sélecteur CSS pour limiter l'extraction
}
```

**Sorties :**
```typescript
{
  success: boolean;
  structure?: DOMStructure;
  error?: string;
}
```

### 5.4 Tool : `analyze_performance`

**Description :** Analyse des performances d'une page

**Entrées :**
```typescript
{
  url: string;
  metrics?: ('load' | 'network' | 'console')[];  // Métriques à capturer
}
```

**Sorties :**
```typescript
{
  success: boolean;
  metrics?: {
    loadTime: number;
    pageSize: number;
    requestCount: number;
    errors: string[];
    score: number;
  };
  error?: string;
}
```

---

## 6. Bonnes pratiques

### 6.1 Respect des sites

**robots.txt :**
```typescript
async function checkRobotsTxt(url: string): Promise<boolean> {
  const robotsUrl = new URL('/robots.txt', url).href;
  const response = await fetch(robotsUrl);
  
  if (!response.ok) return true;  // Pas de robots.txt = autorisé
  
  const content = await response.text();
  const isAllowed = !content.includes('Disallow: /');
  
  return isAllowed;
}
```

**Rate limiting :**
```typescript
// Respecter les délais entre requêtes
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

await delay(1000);  // 1 seconde entre chaque page
```

**User-Agent :**
```typescript
// User-Agent explicite
const userAgent = 'EKTS-Inspector/1.0 (+https://ekts.dev/bot)';
```

### 6.2 Gestion des erreurs

**Retry avec backoff exponentiel :**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}
```

**Timeout :**
```typescript
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}
```

### 6.3 Performance

**Réutilisation du navigateur :**
```typescript
// Réutiliser le navigateur pour plusieurs inspections
const browser = await chromium.launch();

for (const url of urls) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Inspection...
  
  await context.close();
}

await browser.close();
```

**Parallelisme contrôlé :**
```typescript
// Limiter le nombre de navigations parallèles
const pLimit = require('p-limit');
const limit = pLimit(3);  // Max 3 navigations simultanées

const results = await Promise.all(
  urls.map(url => limit(() => inspectWebsite(url)))
);
```

---

## 7. Limites et contraintes

### 7.1 Limites techniques

- **Mémoire** : chaque contexte navigateur consomme ~50-80 MB
- **CPU** : le rendu JavaScript est coûteux
- **Temps** : une inspection L3 complète prend 30-60s
- **Stockage** : les screenshots peuvent être volumineux

### 7.2 Limites légales et éthiques

- **robots.txt** : doit être respecté
- **Terms of Service** : certains sites interdisent le scraping
- **Données personnelles** : ne pas capturer de données sensibles
- **Rate limiting** : ne pas surcharger les serveurs

### 7.3 Limites de détection

- **Anti-bot** : certains sites détectent et bloquent l'automation
- **CAPTCHA** : ne peut pas être résolu automatiquement
- **JavaScript challenges** : certains sites nécessitent une exécution JS complexe

**Solutions :**
- Utiliser Patchright pour les sites protégés
- Respecter les robots.txt et TOS
- Limiter la fréquence des inspections
- Ne pas contourner les CAPTCHAs

---

## 8. Implémentation MVP

### 8.1 Phase 1 : Inspection de base

**Objectif :** Inspection L1 et L2 fonctionnelle

**Fonctionnalités :**
- Navigation vers une URL
- Snapshot accessibility tree
- Screenshot viewport
- Extraction des métadonnées
- Stockage JSON

**Outils MCP :**
- `inspect_website` (L1 et L2 seulement)
- `capture_screenshot`

**Durée estimée :** 1 semaine

### 8.2 Phase 2 : Inspection avancée

**Objectif :** Inspection L3 et L4

**Fonctionnalités :**
- Capture DOM complète
- Network interception
- Performance metrics
- Crawling multi-pages (L4)

**Outils MCP :**
- `extract_structure`
- `analyze_performance`

**Durée estimée :** 1-2 semaines

### 8.3 Phase 3 : Intégration stealth

**Objectif :** Support des sites protégés

**Fonctionnalités :**
- Intégration Patchright
- Détection anti-bot
- Fallback automatique

**Durée estimée :** 1 semaine

---

## 9. Décisions

### Décisions prises

1. **Playwright comme base** — performance, MCP, fiabilité
2. **4 niveaux d'inspection** — L1 (rapide) à L4 (exhaustive)
3. **4 patterns de capture** — accessibility tree, screenshot, DOM, network
4. **5 outils MCP** — inspect_website, capture_screenshot, extract_structure, analyze_performance, list_inspections
5. **Architecture modulaire** — préparation, navigation, capture, analyse, stockage

### Décisions reportées

- Format de stockage exact (JSON vs SQLite) — à définir lors de l'implémentation
- Stratégie de caching — à évaluer après les premiers usages
- Intégration avec RAG (Phase 07) — dépend du choix de stockage

---

## 10. Questions ouvertes

### Questions importantes

1. **Quelle est la taille moyenne d'un résultat d'inspection L3 ?**
   - Impact : stratégie de stockage
   - Action : benchmarker lors de l'implémentation

2. **Faut-il implémenter un système de caching ?**
   - Impact : performance, coût
   - Action : évaluer après les premiers usages

3. **Comment gérer les sites nécessitant une authentification ?**
   - Impact : complexité ajoutée
   - Action : définir un pattern d'authentification

### Questions exploratoires

1. **Faut-il créer un langage de requête pour les inspections ?**
   - Impact : facilité d'utilisation
   - Action : évaluer après les premiers usages

2. **Comment visualiser les résultats d'inspection ?**
   - Impact : UX
   - Action : explorer des outils de visualisation

---

## 11. Sources

### Documentation

- Playwright API : https://playwright.dev/docs/api/class-playwright
- Playwright MCP : https://playwright.dev/docs/getting-started-mcp
- Chrome DevTools Protocol : https://chromedevtools.github.io/devtools-protocol/
- robots.txt : https://developers.google.com/search/docs/crawling-indexing/robots/intro

### Bonnes pratiques

- Scraping responsable : https://www.scrapingbee.com/blog/web-scraping-without-getting-blocked/
- Rate limiting : https://oxylabs.io/blog/web-scraping-best-practices
- Anti-détection : https://scrapfly.io/blog/posts/best-stealth-browsers

---

## 12. Relations avec les autres livrables

### Dépendances

- **Phase 04.1 (Comparatif)** — Playwright est la solution retenue
- **Phase 03 (Conception outils)** — les outils d'inspection suivent les principes de conception

### Impact sur

- **Phase 05 (Scraping responsable)** — le workflow d'inspection est la base du scraping
- **Phase 08 (Analyse expérience)** — les inspections fournissent les données pour l'analyse
- **Phase 06 (Stockage)** — les résultats d'inspection doivent être stockés

### Cohérence avec le blueprint

- **Couche 3 (Automation)** — le workflow d'inspection est un cas d'usage majeur
- **Principe 7 (Automation First)** — l'inspection automatisée est au cœur d'EKTS
- **MVP-2 (Inspection navigateur reproductible)** — ce workflow est le MVP-2

---

## 13. Critères de validation

### Critères techniques

- ✅ Playwright MCP supporte 70+ tools
- ✅ 4 niveaux d'inspection définis (L1 à L4)
- ✅ 4 patterns de capture identifiés
- ✅ 5 outils MCP spécifiés
- ✅ Architecture en 5 étapes définie

### Critères fonctionnels

- ✅ Inspection structurelle, contenu, visuelle, comportementale
- ✅ Configuration flexible (niveau, capture, navigateur, comportement)
- ✅ Gestion des erreurs (retry, timeout)
- ✅ Respect des sites (robots.txt, rate limiting)

### Critères de qualité

- ✅ Workflow reproductible
- ✅ Données structurées et validées
- ✅ Intégration MCP native
- ✅ Performance optimisée (parallelisme, réutilisation navigateur)

---

**Livrable rédigé le 21 octobre 2026 — Phase 04 du projet EKTS**
