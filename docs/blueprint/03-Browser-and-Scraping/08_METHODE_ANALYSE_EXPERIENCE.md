# Phase 08 — Méthode d'Analyse de l'Expérience

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Définir une méthodologie structurée pour analyser les inspections de sites web capturées via Playwright (Phase 04) et en extraire des insights actionnables. Cette méthode s'intègre avec le système RAG (Phase 07) pour permettre la recherche sémantique dans les analyses passées.

---

## 2. Contexte et périmètre

### 2.1 Données disponibles

Les inspections Playwright (Phase 04) capturent :

- **Niveau L1** : Métadonnées de base (URL, titre, description, viewport, screenshot)
- **Niveau L2** : Structure DOM, textes, liens, images, formulaires
- **Niveau L3** : Performance (Core Web Vitals, temps de chargement, requêtes réseau)
- **Niveau L4** : Accessibilité (WCAG 2.2), SEO (métadonnées, schema markup)

### 2.2 Périmètre de l'analyse

Cette méthode couvre :

1. **Analyse technique** : Performance, accessibilité, SEO
2. **Analyse UX** : Heuristiques de Nielsen, parcours utilisateur, friction points
3. **Analyse comparative** : Benchmarking vs concurrents, évolution temporelle
4. **Génération d'insights** : Recommandations actionnables, priorisation

### 2.3 Intégration avec EKTS

- **Stockage** : Rapports structurés en JSON (Phase 06)
- **Recherche** : Indexation sémantique des insights (Phase 07)
- **Capitalisation** : Patterns récurrents, leçons apprises (Phase 10)

---

## 3. Framework d'analyse

### 3.1 Approche en 5 dimensions

L'analyse d'expérience EKTS évalue 5 dimensions complémentaires :

| Dimension | Objectif | Métriques clés | Poids |
|-----------|----------|----------------|-------|
| **Performance** | Vitesse et réactivité | LCP, INP, CLS, TTFB | 25% |
| **Accessibilité** | Usage par tous | WCAG 2.2 AA, contrastes, navigation clavier | 20% |
| **SEO technique** | Visibilité search | Core Web Vitals, schema markup, métadonnées | 20% |
| **UX heuristique** | Facilité d'usage | 10 heuristiques de Nielsen | 20% |
| **Contenu** | Qualité informationnelle | EEAT, structure, clarté | 15% |

### 3.2 Matrice de sévérité

Chaque issue trouvée est classée selon une matrice à 3 axes :

```
Sévérité technique (0-4) × Fréquence utilisateur (1-5) × Impact business (1-3) = Score priorité
```

| Score | Priorité | Action |
|-------|----------|--------|
| 40-60 | **Critique** | Correction immédiate |
| 20-39 | **Haute** | Prochain sprint |
| 5-19 | **Moyenne** | Backlog |
| 1-4 | **Basse** | Amélioration continue |

### 3.3 Processus d'analyse

```
┌─────────────────────────────────────────────────────────────┐
│ 1. COLLECTE                                                  │
│    - Charger inspection Playwright (JSON + assets)          │
│    - Extraire données brutes (DOM, metrics, screenshots)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ANALYSE AUTOMATIQUE                                       │
│    - Performance : Core Web Vitals, ressources              │
│    - Accessibilité : WCAG 2.2 checker                       │
│    - SEO : Métadonnées, schema, robots.txt                  │
│    - Structure : Liens, navigation, formulaires             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ANALYSE HEURISTIQUE                                       │
│    - Évaluation des 10 heuristiques de Nielsen              │
│    - Identification des friction points                     │
│    - Attribution scores de sévérité                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SYNTHÈSE ET INSIGHTS                                      │
│    - Agrégation des findings                                │
│    - Priorisation par score                                 │
│    - Génération recommandations (LLM)                       │
│    - Comparaison avec inspections similaires (RAG)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. RAPPORT                                                   │
│    - Génération rapport structuré (JSON + Markdown)         │
│    - Indexation dans EKTS                                   │
│    - Stockage assets (screenshots, traces)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Analyse technique détaillée

### 4.1 Performance

#### 4.1.1 Core Web Vitals

**Métriques mesurées :**

| Métrique | Description | Seuil "Bon" | Seuil "À améliorer" | Seuil "Poor" |
|----------|-------------|-------------|---------------------|--------------|
| **LCP** (Largest Contentful Paint) | Temps de chargement du contenu principal | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | Réactivité aux interactions | ≤ 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | Stabilité visuelle | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **TTFB** (Time to First Byte) | Temps de réponse serveur | ≤ 800ms | 800ms - 1.8s | > 1.8s |

**Méthode de collecte :**

```typescript
import { chromium } from 'playwright';

async function collectPerformanceMetrics(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Activer la collecte de performance
  await page.goto(url, { waitUntil: 'networkidle' });
  
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      ttfb: navigation.responseStart - navigation.requestStart,
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      lcp: new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1].startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      }),
      cls: 0, // Calculé via PerformanceObserver
      inp: 0  // Nécessite interaction utilisateur
    };
  });
  
  await browser.close();
  return metrics;
}
```

**Analyse des ressources :**

- **Poids total** : Objectif < 3MB pour la page complète
- **Requêtes HTTP** : Objectif < 50 requêtes
- **JavaScript** : Objectif < 300KB (après compression)
- **CSS** : Objectif < 100KB (après compression)
- **Images** : Objectif < 500KB par image, formats modernes (WebP, AVIF)

**Recommandations automatiques :**

```typescript
function generatePerformanceRecommendations(metrics: PerformanceMetrics) {
  const recommendations = [];
  
  if (metrics.lcp > 2500) {
    recommendations.push({
      category: 'performance',
      severity: metrics.lcp > 4000 ? 4 : 3,
      issue: 'LCP trop élevé',
      impact: 'Temps de chargement perçu trop long',
      solution: 'Optimiser l\'image/élément LCP (compression, lazy loading, preloading)',
      effort: 'moyen'
    });
  }
  
  if (metrics.totalWeight > 3 * 1024 * 1024) {
    recommendations.push({
      category: 'performance',
      severity: 2,
      issue: 'Poids total de la page trop élevé',
      impact: 'Consommation bande passante, chargement lent sur mobile',
      solution: 'Compresser images, minifier CSS/JS, supprimer ressources inutilisées',
      effort: 'faible'
    });
  }
  
  // ... autres checks
  
  return recommendations;
}
```

### 4.2 Accessibilité

#### 4.2.1 Standard WCAG 2.2 AA

**Vérifications automatisées :**

| Critère | Description | Méthode de test |
|---------|-------------|-----------------|
| **1.1.1** | Textes alternatifs pour images non-textuelles | Vérifier attribut `alt` |
| **1.3.1** | Information et relations (structure sémantique) | Vérifier headings, landmarks ARIA |
| **1.3.4** | Orientation (responsive) | Tester en portrait/paysage |
| **1.3.5** | Identification de l'objectif de saisie | Vérifier attributs `autocomplete` |
| **1.4.1** | Utilisation de la couleur | Vérifier contrastes, alternatives |
| **1.4.3** | Contraste minimum (4.5:1) | Analyse couleur texte/fond |
| **1.4.4** | Redimensionnement du texte | Zoom 200% |
| **1.4.10** | Reflow (responsive 320px) | Test viewport mobile |
| **1.4.11** | Contraste des éléments non-textuels (3:1) | Bordures, icônes, champs |
| **1.4.12** | Espacement du texte (line-height 1.5) | Vérifier CSS |
| **1.4.13** | Contenu au survol/focus | Vérifier tooltips, popups |
| **2.1.1** | Clavier (toutes fonctionnalités) | Test navigation clavier |
| **2.1.2** | Pas de piège au clavier | Vérifier focus traps |
| **2.4.1** | Contourner des blocs (skip links) | Vérifier presence |
| **2.4.2** | Titres de page descriptifs | Vérifier `<title>` |
| **2.4.3** | Ordre du focus cohérent | Test tabulation |
| **2.4.4** | Objectif des liens (descriptif) | Vérifier texte des liens |
| **2.4.6** | En-têtes et étiquettes descriptifs | Vérifier headings, labels |
| **2.4.7** | Visibilité du focus | Vérifier styles `:focus` |
| **2.5.7** | Mouvement de glissement (alternatives) | Vérifier drag & drop |
| **2.5.8** | Cibles de pointage (24x24px minimum) | Mesurer tailles boutons |
| **3.1.1** | Langue de la page | Vérifier attribut `lang` |
| **3.1.2** | Langue de sections | Vérifier attributs `lang` imbriqués |
| **3.2.1** | Au focus (pas de changement de contexte) | Test navigation |
| **3.2.2** | À la saisie (pas de changement automatique) | Test formulaires |
| **3.2.6** | Aide (instructions cohérentes) | Vérifier icônes, messages |
| **3.3.1** | Identification des erreurs | Vérifier messages d'erreur |
| **3.3.2** | Étiquettes ou instructions | Vérifier labels formulaires |
| **3.3.7** | Saisie redondante (évitable) | Vérifier autocomplétion |
| **4.1.1** | Parsing (HTML valide) | Validateur W3C |
| **4.1.2** | Nom, rôle, valeur | Vérifier ARIA |
| **4.1.3** | Messages de statut | Vérifier `aria-live` |

**Outil d'analyse :**

```typescript
import AxeBuilder from '@axe-core/playwright';

async function analyzeAccessibility(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  
  return {
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact, // 'minor' | 'moderate' | 'serious' | 'critical'
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      elements: v.nodes.map(n => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary
      }))
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    score: Math.round((results.passes.length / (results.passes.length + results.violations.length)) * 100)
  };
}
```

**Score d'accessibilité :**

```
Score = (Critères conformes / Critères applicables) × 100

Interprétation :
- 95-100% : Excellent (A)
- 85-94% : Bon (B)
- 70-84% : Acceptable (C)
- 50-69% : Insuffisant (D)
- < 50% : Critique (F)
```

### 4.3 SEO technique

#### 4.3.1 Vérifications automatiques

**Métadonnées :**

```typescript
interface SEOCheck {
  element: string;
  status: 'pass' | 'warning' | 'fail';
  value?: string;
  recommendation?: string;
}

function analyzeSEOMetadata(page: Page): SEOCheck[] {
  return [
    {
      element: 'title',
      status: title.length >= 30 && title.length <= 60 ? 'pass' : 'warning',
      value: title,
      recommendation: title.length < 30 ? 'Titre trop court (minimum 30 caractères)' : undefined
    },
    {
      element: 'meta_description',
      status: description.length >= 120 && description.length <= 160 ? 'pass' : 'warning',
      value: description,
      recommendation: description.length < 120 ? 'Description trop courte' : undefined
    },
    {
      element: 'canonical',
      status: canonical ? 'pass' : 'warning',
      value: canonical,
      recommendation: !canonical ? 'URL canonique manquante' : undefined
    },
    {
      element: 'robots',
      status: robots?.includes('noindex') ? 'fail' : 'pass',
      value: robots,
      recommendation: robots?.includes('noindex') ? 'Page exclue de l\'indexation' : undefined
    }
  ];
}
```

**Schema.org / JSON-LD :**

```typescript
async function analyzeSchemaMarkup(page: Page) {
  const schemas = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.map(s => {
      try {
        return JSON.parse(s.textContent);
      } catch {
        return null;
      }
    }).filter(Boolean);
  });
  
  return {
    hasSchema: schemas.length > 0,
    types: schemas.map(s => s['@type']),
    valid: schemas.every(s => s['@type'] && s['@context'] === 'https://schema.org'),
    recommendation: schemas.length === 0 
      ? 'Ajouter des données structurées Schema.org pour améliorer la visibilité dans les résultats de recherche'
      : undefined
  };
}
```

**Structure du contenu :**

```typescript
async function analyzeContentStructure(page: Page) {
  const structure = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const h1Count = headings.filter(h => h.tagName === 'H1').length;
    const hierarchy = headings.map(h => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent?.trim()
    }));
    
    return {
      h1Count,
      hasMultipleH1: h1Count > 1,
      hierarchyValid: validateHeadingHierarchy(hierarchy),
      totalHeadings: headings.length
    };
  });
  
  return {
    ...structure,
    recommendation: structure.hasMultipleH1 
      ? 'Un seul H1 par page recommandé'
      : structure.h1Count === 0
        ? 'Ajouter un titre H1 descriptif'
        : undefined
  };
}
```

**Préparation pour l'IA (GEO/AEO) :**

Checks spécifiques pour optimiser la visibilité dans les réponses IA :

```typescript
const aiReadinessChecks = [
  {
    name: 'robots.txt AI bots',
    check: async (page) => {
      const robotsTxt = await fetchRobotsTxt(page);
      return !robotsTxt.includes('Disallow: /') && 
             !robotsTxt.match(/Disallow:.*(?:GPTBot|ClaudeBot|PerplexityBot)/);
    },
    recommendation: 'Autoriser les bots IA dans robots.txt pour apparaître dans les réponses IA'
  },
  {
    name: 'llms.txt',
    check: async (page) => {
      const response = await page.goto('/llms.txt');
      return response.status() === 200;
    },
    recommendation: 'Créer un fichier llms.txt pour guider les modèles IA'
  },
  {
    name: 'Schema markup complet',
    check: async (page) => {
      const schemas = await getSchemaMarkup(page);
      return schemas.length > 0 && schemas.every(s => isValidSchema(s));
    },
    recommendation: 'Ajouter des données structurées complètes pour aider les IA à comprendre le contenu'
  },
  {
    name: 'Contenu FAQ structuré',
    check: async (page) => {
      const faqSchema = await getFAQSchema(page);
      return faqSchema !== null;
    },
    recommendation: 'Structurer les FAQ avec Schema.org FAQPage pour les réponses IA'
  }
];
```

### 4.4 Analyse heuristique (UX)

#### 4.4.1 Les 10 heuristiques de Nielsen

| # | Heuristique | Description | Indicateurs automatisables |
|---|-------------|-------------|----------------------------|
| 1 | **Visibilité de l'état du système** | L'utilisateur doit toujours savoir ce qui se passe | Loading states, progress indicators, feedback visuel |
| 2 | **Adéquation avec le monde réel** | Langage naturel, pas de jargon interne | Analyse sémantique du texte, détecteur de jargon |
| 3 | **Contrôle et liberté utilisateur** | Boutons "annuler", "retour", "quitter" | Détection boutons navigation, historique |
| 4 | **Cohérence et standards** | Respect des conventions plateforme | Analyse patterns UI, composants récurrents |
| 5 | **Prévention des erreurs** | Empêcher les problèmes avant qu'ils n'arrivent | Validation formulaires, confirmations |
| 6 | **Reconnaissance plutôt que rappel** | Éléments visibles, pas de mémoire requise | Menus, breadcrumbs, historique |
| 7 | **Flexibilité et efficacité d'utilisation** | Raccourcis pour experts, simplicité pour novices | Détection raccourcis clavier, personnalisation |
| 8 | **Design esthétique et minimaliste** | Pas d'informations inutiles | Analyse densité visuelle, whitespace |
| 9 | **Aider les utilisateurs à reconnaître et récupérer des erreurs** | Messages clairs, solutions proposées | Analyse messages d'erreur, suggestions |
| 10 | **Aide et documentation** | Aide accessible, facile à chercher | Détection FAQ, help center, search |

#### 4.4.2 Méthode d'évaluation

**Score par heuristique :**

```typescript
interface HeuristicScore {
  heuristic: number;
  name: string;
  score: 0 | 1 | 2 | 3 | 4; // 0=non évalué, 1=problème cosmétique, 4=catastrophique
  findings: Finding[];
  recommendations: string[];
}

function evaluateHeuristics(inspection: Inspection): HeuristicScore[] {
  return [
    {
      heuristic: 1,
      name: 'Visibilité de l\'état du système',
      score: evaluateLoadingStates(inspection),
      findings: findLoadingIssues(inspection),
      recommendations: generateLoadingRecommendations(inspection)
    },
    // ... autres heuristiques
  ];
}
```

**Score UX global :**

```
Score UX = 100 - (Σ (score_heuristique × poids_heuristique) / 40) × 100

Poids heuristiques (selon impact utilisateur) :
- H1 (État système) : 1.5
- H3 (Contrôle) : 1.4
- H5 (Prévention erreurs) : 1.4
- H8 (Minimalisme) : 1.3
- H9 (Récupération erreurs) : 1.3
- Autres : 1.0
```

### 4.5 Analyse de contenu

#### 4.5.1 Critères EEAT

**Expertise, Authoritativeness, Trustworthiness :**

```typescript
interface EEATScore {
  expertise: {
    authorCredentials: boolean;      // Auteur identifié avec credentials
    contentDepth: number;            // Profondeur analyse (0-10)
    citations: number;               // Nombre de sources citées
    score: number;                   // 0-100
  };
  authoritativeness: {
    domainAuthority: number;         // DA du site
    backlinks: number;               // Nombre de backlinks
    mentions: number;                // Mentions externes
    score: number;                   // 0-100
  };
  trustworthiness: {
    https: boolean;                  // Site en HTTPS
    contactInfo: boolean;            // Informations de contact
    privacyPolicy: boolean;          // Politique de confidentialité
    lastUpdated: Date;               // Date dernière mise à jour
    score: number;                   // 0-100
  };
  overallScore: number;              // Moyenne pondérée
}
```

#### 4.5.2 Qualité rédactionnelle

**Métriques analysées :**

- **Lisibilité** : Score Flesch-Kincaid (objectif : 60-70 pour grand public)
- **Longueur** : Nombre de mots (objectif : 300-2000 selon type de contenu)
- **Structure** : Paragraphes courts (2-4 phrases), listes à puces, sous-titres
- **Mots-clés** : Densité (1-3%), variations sémantiques, LSI keywords
- **Originalité** : Détection de contenu dupliqué (via empreintes)

```typescript
function analyzeContentQuality(text: string) {
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: words.length / sentences.length,
    avgSentencesPerParagraph: sentences.length / paragraphs.length,
    fleschKincaidScore: calculateFleschKincaid(text),
    readingTime: Math.ceil(words.length / 200), // 200 mots/minute
    hasSubheadings: /<h[2-6]>/.test(text),
    hasLists: /<[ou]l>/.test(text),
    hasImages: /<img/.test(text)
  };
}
```

---

## 5. Analyse comparative

### 5.1 Benchmarking vs concurrents

**Méthode :**

1. **Identification concurrents** : Liste manuelle ou extraction via recherche
2. **Inspection parallèle** : Playwright sur tous les sites (mêmes critères)
3. **Normalisation scores** : Same scoring grid pour tous
4. **Visualisation** : Radar chart, tableau comparatif

**Exemple de rapport comparatif :**

```json
{
  "type": "comparative_analysis",
  "subject": "example.com",
  "competitors": ["competitor1.com", "competitor2.com", "competitor3.com"],
  "dimensions": {
    "performance": {
      "subject": { "score": 82, "rank": 2 },
      "competitors": [
        { "site": "competitor1.com", "score": 91, "rank": 1 },
        { "site": "competitor2.com", "score": 75, "rank": 3 },
        { "site": "competitor3.com", "score": 68, "rank": 4 }
      ],
      "insight": "example.com est 2ème en performance, 9 points derrière le leader"
    },
    "accessibility": {
      "subject": { "score": 74, "rank": 3 },
      "competitors": [
        { "site": "competitor1.com", "score": 88, "rank": 1 },
        { "site": "competitor2.com", "score": 82, "rank": 2 },
        { "site": "competitor3.com", "score": 65, "rank": 4 }
      ],
      "insight": "example.com est 3ème en accessibilité, des efforts nécessaires sur les contrastes et la navigation clavier"
    }
  },
  "recommendations": [
    "Prioriser l'accessibilité (écart de 14 points avec le leader)",
    "Maintenir la performance (déjà dans le top 2)"
  ]
}
```

### 5.2 Évolution temporelle

**Suivi dans le temps :**

```typescript
interface TemporalAnalysis {
  site: string;
  period: { start: Date; end: Date };
  metrics: {
    performance: {
      dates: Date[];
      scores: number[];
      trend: 'improving' | 'stable' | 'declining';
      change: number; // Pourcentage
    };
    accessibility: { /* ... */ };
    seo: { /* ... */ };
    ux: { /* ... */ };
  };
  insights: string[];
}

function analyzeTemporalEvolution(inspections: Inspection[]) {
  const sorted = inspections.sort((a, b) => a.date.localeCompare(b.date));
  
  const performanceScores = sorted.map(i => i.scores.performance);
  const trend = calculateTrend(performanceScores);
  
  return {
    trend,
    change: ((performanceScores[performanceScores.length - 1] - performanceScores[0]) / performanceScores[0]) * 100,
    insight: trend === 'improving' 
      ? `Performance en amélioration (+${change.toFixed(1)}% sur la période)`
      : trend === 'declining'
        ? `Performance en déclin (${change.toFixed(1)}% sur la période), investigation recommandée`
        : 'Performance stable'
  };
}
```

---

## 6. Intégration RAG

### 6.1 Indexation des analyses

**Structure pour recherche sémantique :**

```typescript
interface AnalysisChunk {
  id: string;
  inspectionId: string;
  site: string;
  date: Date;
  category: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  finding: string;
  recommendation: string;
  severity: number;
  context: string; // Extrait de page, screenshot path, etc.
  embedding: number[]; // Vecteur pour recherche sémantique
}

async function indexAnalysisForRAG(analysis: AnalysisReport) {
  const chunks = [];
  
  // Chunker par finding
  for (const finding of analysis.findings) {
    chunks.push({
      id: generateChunkId(),
      inspectionId: analysis.inspectionId,
      site: analysis.site,
      date: analysis.date,
      category: finding.category,
      finding: finding.description,
      recommendation: finding.recommendation,
      severity: finding.severity,
      context: finding.context,
      embedding: await generateEmbedding(`${finding.description} ${finding.recommendation}`)
    });
  }
  
  // Stocker dans EKTS
  await db.analysisChunks.insertMany(chunks);
}
```

### 6.2 Recherche de patterns similaires

**Cas d'usage :**

1. **"Comment ai-je résolu un problème similaire avant ?"**
   - Recherche sémantique dans les findings passés
   - Retrieval des recommandations appliquées
   - Feedback sur efficacité (si disponible)

2. **"Quels sites ont le même problème ?"**
   - Agrégation par type d'issue
   - Identification patterns récurrents
   - Benchmarking solutions

3. **"Recommandations pour ce type de site ?"**
   - Analyse du secteur/industrie
   - Patterns spécifiques au domaine
   - Best practices contextualisées

**Implémentation :**

```typescript
async function findSimilarIssues(finding: string, topK: number = 5) {
  const queryEmbedding = await generateEmbedding(finding);
  
  const similarChunks = await db.analysisChunks.find({
    embedding: { $near: queryEmbedding }
  }).limit(topK);
  
  return similarChunks.map(chunk => ({
    finding: chunk.finding,
    recommendation: chunk.recommendation,
    site: chunk.site,
    date: chunk.date,
    severity: chunk.severity,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
}
```

### 6.3 Génération de insights avec LLM

**Prompt template :**

```typescript
async function generateInsights(analysis: AnalysisReport) {
  const prompt = `
Tu es un expert en analyse de sites web. À partir de cette analyse détaillée, 
génère 3-5 insights actionnables qui prioritise les actions à mener.

Site analysé : ${analysis.site}
Date : ${analysis.date}

Scores globaux :
- Performance : ${analysis.scores.performance}/100
- Accessibilité : ${analysis.scores.accessibility}/100
- SEO : ${analysis.scores.seo}/100
- UX : ${analysis.scores.ux}/100

Findings critiques (sévérité ≥ 3) :
${analysis.findings.filter(f => f.severity >= 3).map(f => `- [${f.category}] ${f.description}`).join('\n')}

Contexte business (si disponible) :
${analysis.businessContext || 'Non spécifié'}

Génère les insights au format JSON :
[
  {
    "insight": "Description courte de l'insight",
    "priority": "critical|high|medium|low",
    "action": "Action concrète à mener",
    "expectedImpact": "Impact attendu (ex: +20% conversion, -50% temps chargement)",
    "effort": "faible|moyen|élevé",
    "rationale": "Pourquoi cette action est prioritaire"
  }
]
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 7. Outils et automatisation

### 7.1 Stack technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| **Inspection** | Playwright | Défini en Phase 04 |
| **Performance** | Lighthouse CI | Standard Google, intégration Playwright |
| **Accessibilité** | axe-core | Défacto standard WCAG, API riche |
| **SEO** | Custom rules | Flexibilité, pas de dépendance externe |
| **Analyse heuristique** | Custom + LLM | Automatisation partielle, jugement humain pour le reste |
| **Embeddings** | OpenAI text-embedding-3-small | Cohérence Phase 07 |
| **Stockage** | SQLite + sqlite-vec | Cohérence Phase 06 |

### 7.2 Pipeline d'analyse

```bash
# Script EKTS : analyse complète d'un site
$ ekts analyze https://example.com --level=L4 --output=json

# Étapes exécutées :
# 1. Inspection Playwright (L1 → L4)
# 2. Analyse performance (Lighthouse)
# 3. Analyse accessibilité (axe-core)
# 4. Analyse SEO (custom rules)
# 5. Analyse heuristique (automatique + LLM)
# 6. Analyse contenu (EEAT, qualité)
# 7. Génération insights (LLM)
# 8. Stockage rapport (JSON + SQLite)
# 9. Indexation RAG (embeddings)
# 10. Affichage résumé (terminal)
```

### 7.3 Intégration MCP

**Exposition via MCP pour agents IA :**

```typescript
// Tool MCP : analyze_website
{
  name: 'analyze_website',
  description: 'Analyse complète d\'un site web (performance, accessibilité, SEO, UX)',
  parameters: {
    url: { type: 'string', description: 'URL du site à analyser' },
    level: { type: 'string', enum: ['L1', 'L2', 'L3', 'L4'], default: 'L3' },
    focus: { 
      type: 'array', 
      items: { type: 'string', enum: ['performance', 'accessibility', 'seo', 'ux', 'content'] },
      default: ['performance', 'accessibility', 'seo']
    }
  },
  handler: async (params) => {
    const analysis = await runFullAnalysis(params.url, params.level, params.focus);
    return {
      scores: analysis.scores,
      findings: analysis.findings.slice(0, 10), // Top 10 findings
      insights: analysis.insights,
      reportPath: analysis.reportPath
    };
  }
}
```

---

## 8. Limites et considérations

### 8.1 Limites de l'analyse automatique

- **Heuristiques UX** : Évaluation partielle (30-40% automatisable), jugement humain nécessaire pour le reste
- **Contenu** : Analyse quantitative (lisibilité, structure) mais pas qualitative (pertinence, originalité profonde)
- **Accessibilité** : Tests automatisés couvrent ~30% des critères WCAG, tests manuels nécessaires pour le reste
- **Performance** : Mesures lab (simulation) ≠ field data (utilisateurs réels)

### 8.2 Considérations éthiques

- **Respect vie privée** : Ne pas capturer de données utilisateur (cookies, localStorage)
- **Conformité Phase 05** : Uniquement données publiques, respect robots.txt
- **Transparence** : Identifier clairement l'outil d'analyse (User-Agent)
- **Rate limiting** : Pas d'inspection répétitive abusive

### 8.3 Évolution et maintenance

- **Mise à jour standards** : WCAG 2.2 → 3.0 (prévu 2027), Core Web Vitals (INP ajouté 2024)
- **Nouveaux outils** : Veille sur axe-core, Lighthouse, Playwright
- **Modèles LLM** : Ajustement prompts selon performances (GPT-4o-mini → GPT-4o si nécessaire)

---

## 9. Exemples d'application

### 9.1 Cas d'usage 1 : Audit technique complet

**Scénario :** Audit d'un site e-commerce avant refonte

**Méthode :**
1. Inspection L4 complète
2. Analyse comparative vs 3 concurrents
3. Identification top 10 issues critiques
4. Recommandations priorisées (effort vs impact)

**Livrable :** Rapport JSON + Markdown, 45 pages, 127 findings

### 9.2 Cas d'usage 2 : Suivi performance

**Scénario :** Monitoring hebdomadaire Core Web Vitals

**Méthode :**
1. Inspection L3 hebdomadaire (automatisée)
2. Comparaison temporelle (4 semaines)
3. Détection régressions
4. Alertes si scores < seuils

**Livrable :** Dashboard + rapport hebdomadaire

### 9.3 Cas d'usage 3 : Recherche de patterns

**Scénario :** "Quels sites ont des problèmes de contraste similaires ?"

**Méthode :**
1. Recherche sémantique dans EKTS (RAG)
2. Retrieval inspections passées
3. Agrégation par type d'issue
4. Recommandations génériques

**Livrable :** Liste sites + solutions appliquées

---

## 10. Décisions et compromis

### 10.1 Décisions prises

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **5 dimensions d'analyse** | Couverture complète sans redondance | Approche plus fine (8 dimensions) → trop complexe |
| **Matrice sévérité 3 axes** | Priorisation objective | Sévérité simple (0-4) → pas assez nuancé |
| **axe-core pour accessibilité** | Standard industrie, bien maintenu | WAVE → API moins riche |
| **LLM pour insights** | Qualité analyse, contextualisation | Templates statiques → pas assez flexibles |
| **Indexation RAG** | Réutilisation connaissances passées | Stockage simple → pas de recherche sémantique |

### 10.2 Compromis acceptés

- **Automatisation partielle heuristiques** : ~40% automatisable, reste manuel (temps vs exhaustivité)
- **GPT-4o-mini pour insights** : Moins cher que GPT-4o, qualité suffisante (coût vs qualité)
- **Lighthouse lab** : Pas de field data (simplicité vs réalisme)
- **WCAG 2.2 AA** : Pas AAA (couverture vs complexité)

---

## 11. Questions ouvertes

1. **Intégration field data** : Comment combiner lab (Lighthouse) et field (CrUX) pour analyse plus réaliste ?
2. **Tests utilisateur** : Comment intégrer des tests utilisateur légers dans le pipeline ?
3. **Analyse concurrentielle** : Comment automatiser l'identification des concurrents pertinents ?
4. **Feedback loop** : Comment capturer l'efficacité des recommandations appliquées ?

---

## 12. Relations avec autres phases

| Phase | Relation | Dépendance |
|-------|----------|------------|
| **Phase 04** (Automatisation navigateur) | Source données (inspections Playwright) | Dépendance forte |
| **Phase 05** (Scraping responsable) | Contraintes éthiques et légales | Dépendance forte |
| **Phase 06** (Stockage) | Stockage rapports (SQLite) | Dépendance forte |
| **Phase 07** (RAG) | Recherche sémantique insights | Dépendance forte |
| **Phase 10** (Capitalisation) | Patterns récurrents, leçons apprises | Dépendance moyenne |

---

## 13. Critères de validation

### 13.1 Critères techniques

- ✅ Pipeline d'analyse fonctionnel (L1 → L4)
- ✅ Scores calculés pour 5 dimensions
- ✅ Matrice sévérité implémentée
- ✅ Recommandations générées (LLM)
- ✅ Indexation RAG fonctionnelle

### 13.2 Critères fonctionnels

- ✅ Rapports JSON + Markdown générés
- ✅ Recherche sémantique dans analyses passées
- ✅ Insights actionnables (priorité, effort, impact)
- ✅ Comparaison temporelle et benchmarking

### 13.3 Critères de qualité

- ✅ Couverture WCAG 2.2 AA (critères automatisables)
- ✅ Core Web Vitals mesurés (LCP, INP, CLS, TTFB)
- ✅ SEO technique complet (métadonnées, schema, structure)
- ✅ Analyse heuristique (10 heuristiques Nielsen)

---

## 14. Conclusion

Cette méthode d'analyse d'expérience fournit un framework complet pour évaluer les sites web sur 5 dimensions clés. L'intégration avec Playwright (Phase 04), le stockage EKTS (Phase 06) et le RAG (Phase 07) permet une capitalisation continue des connaissances et une recherche sémantique dans les analyses passées.

Les insights générés par LLM, combinés aux patterns historiques, offrent des recommandations contextuelles et actionnables, priorisées selon une matrice objective (sévérité × fréquence × impact).

---

**Document rédigé le 21 octobre 2026 — Phase 08 du projet EKTS**
