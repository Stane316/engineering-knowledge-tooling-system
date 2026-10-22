# Phase 08 — Schéma de Rapport d'Inspection

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Définir la structure standardisée des rapports d'inspection générés par EKTS. Ce schéma garantit la cohérence entre toutes les inspections et permet le stockage structuré (Phase 06) ainsi que la recherche sémantique (Phase 07).

---

## 2. Structure du rapport

### 2.1 Vue d'ensemble

Un rapport d'inspection EKTS contient :

```
InspectionReport/
├── metadata              # Informations sur l'inspection
├── scores                # Scores globaux par dimension
├── performance           # Analyse performance détaillée
├── accessibility         # Analyse accessibilité détaillée
├── seo                   # Analyse SEO détaillée
├── ux                    # Analyse heuristique UX
├── content               # Analyse contenu
├── findings              # Liste de tous les problèmes trouvés
├── insights              # Insights générés par LLM
├── comparisons           # Comparaisons (temporelles, concurrentielles)
├── assets                # Références aux assets (screenshots, traces)
└── rag                   # Données pour indexation RAG
```

### 2.2 Schéma TypeScript complet

```typescript
interface InspectionReport {
  // === MÉTADONNÉES ===
  metadata: {
    id: string;                          // UUID unique
    url: string;                         // URL inspectée
    domain: string;                      // Domaine extrait
    date: string;                        // ISO 8601
    duration: number;                    // Durée inspection (ms)
    level: 'L1' | 'L2' | 'L3' | 'L4';   // Niveau d'inspection
    playwrightVersion: string;           // Version Playwright utilisée
    ektsVersion: string;                 // Version EKTS
    
    // Contexte optionnel
    project?: string;                    // Nom du projet
    environment?: 'production' | 'staging' | 'development';
    userAgent?: string;                  // User-Agent utilisé
    viewport?: { width: number; height: number };
  };
  
  // === SCORES GLOBAUX ===
  scores: {
    performance: number;      // 0-100
    accessibility: number;    // 0-100
    seo: number;              // 0-100
    ux: number;               // 0-100
    content: number;          // 0-100 (si niveau L4)
    overall: number;          // Moyenne pondérée
  };
  
  // === ANALYSE PERFORMANCE ===
  performance: {
    coreWebVitals: {
      lcp: {
        value: number;         // ms
        status: 'good' | 'needs-improvement' | 'poor';
        element?: string;      // Sélecteur CSS de l'élément LCP
      };
      inp: {
        value: number;         // ms
        status: 'good' | 'needs-improvement' | 'poor';
      };
      cls: {
        value: number;         // score 0-1
        status: 'good' | 'needs-improvement' | 'poor';
      };
      ttfb: {
        value: number;         // ms
        status: 'good' | 'needs-improvement' | 'poor';
      };
    };
    
    resources: {
      totalWeight: number;     // bytes
      totalRequests: number;
      byType: {
        javascript: { weight: number; requests: number };
        css: { weight: number; requests: number };
        images: { weight: number; requests: number };
        fonts: { weight: number; requests: number };
        other: { weight: number; requests: number };
      };
    };
    
    issues: PerformanceIssue[];
    recommendations: Recommendation[];
  };
  
  // === ANALYSE ACCESSIBILITÉ ===
  accessibility: {
    standard: 'WCAG 2.2 AA';
    score: number;             // 0-100
    totalCriteria: number;     // Critères applicables
    passedCriteria: number;
    
    violations: AccessibilityViolation[];
    
    summary: {
      critical: number;        // Impact 'critical'
      serious: number;         // Impact 'serious'
      moderate: number;        // Impact 'moderate'
      minor: number;           // Impact 'minor'
    };
    
    recommendations: Recommendation[];
  };
  
  // === ANALYSE SEO ===
  seo: {
    metadata: {
      title: {
        value: string;
        length: number;
        status: 'good' | 'too-short' | 'too-long';
      };
      description: {
        value: string;
        length: number;
        status: 'good' | 'too-short' | 'too-long';
      };
      canonical: string | null;
      robots: string | null;
    };
    
    headings: {
      h1: { count: number; texts: string[] };
      hierarchy: { level: number; text: string }[];
      valid: boolean;
    };
    
    schema: {
      hasSchema: boolean;
      types: string[];
      valid: boolean;
    };
    
    aiReadiness: {
      robotsTxtAllowsAI: boolean;
      hasLlmsTxt: boolean;
      faqSchemaPresent: boolean;
      score: number;           // 0-100
    };
    
    issues: SEIIssue[];
    recommendations: Recommendation[];
  };
  
  // === ANALYSE UX (HEURISTIQUE) ===
  ux: {
    heuristics: HeuristicEvaluation[];
    overallScore: number;      // 0-100
    
    frictionPoints: {
      description: string;
      location: string;        // Sélecteur CSS ou URL
      severity: number;        // 1-4
      heuristic: number;       // Numéro heuristique Nielsen
    }[];
    
    recommendations: Recommendation[];
  };
  
  // === ANALYSE CONTENU (si L4) ===
  content?: {
    eeat: {
      expertise: number;       // 0-100
      authoritativeness: number;
      trustworthiness: number;
      overall: number;
    };
    
    quality: {
      readability: number;     // Flesch-Kincaid 0-100
      wordCount: number;
      readingTime: number;     // minutes
      hasSubheadings: boolean;
      hasLists: boolean;
      hasImages: boolean;
    };
    
    issues: ContentIssue[];
    recommendations: Recommendation[];
  };
  
  // === FINDINGS (TOUS PROBLÈMES) ===
  findings: Finding[];
  
  // === INSIGHTS GÉNÉRÉS PAR LLM ===
  insights: Insight[];
  
  // === COMPARAISONS ===
  comparisons?: {
    temporal?: {
      previousInspection?: string;  // ID inspection précédente
      evolution: {
        performance: number;   // Pourcentage changement
        accessibility: number;
        seo: number;
        ux: number;
      };
      trend: 'improving' | 'stable' | 'declining';
    };
    
    competitive?: {
      competitors: {
        url: string;
        scores: {
          performance: number;
          accessibility: number;
          seo: number;
          ux: number;
        };
        rank: number;          // Position (1 = meilleur)
      }[];
      subjectRank: number;
    };
  };
  
  // === ASSETS ===
  assets: {
    screenshots: {
      viewport: string;        // Chemin fichier screenshot viewport
      fullPage: string;        // Chemin fichier screenshot full page
      elements?: {             // Screenshots d'éléments spécifiques
        selector: string;
        path: string;
        description: string;
      }[];
    };
    
    traces?: {
      performanceTrace: string;    // Chemin fichier trace performance
      networkTrace: string;        // Chemin fichier trace réseau
    };
    
    logs?: {
      consoleLogs: string;         // Chemin fichier logs console
      networkRequests: string;     // Chemin fichier requêtes réseau
    };
  };
  
  // === DONNÉES POUR RAG ===
  rag: {
    indexedChunks: number;     // Nombre de chunks indexés
    embeddingModel: string;    // Modèle d'embedding utilisé
    searchable: boolean;       // Si indexé dans EKTS
  };
}
```

### 2.3 Types de données

```typescript
// === ISSUE TYPES ===

interface Finding {
  id: string;                          // UUID
  category: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  severity: number;                    // 0-4 (matrice Nielsen)
  priority: number;                    // 1-60 (sévérité × fréquence × impact)
  
  title: string;                       // Titre court
  description: string;                 // Description détaillée
  location: string;                    // URL ou sélecteur CSS
  evidence: string;                    // Preuve (extrait code, métrique, etc.)
  
  recommendation: string;              // Recommandation actionnable
  effort: 'low' | 'medium' | 'high';   // Effort estimé
  impact: string;                      // Impact attendu
  
  // Références
  heuristique?: number;                // Numéro heuristique Nielsen (si UX)
  wcagCriterion?: string;              // Critère WCAG (si accessibilité)
  schemaType?: string;                 // Type Schema.org (si SEO)
  
  // Métadonnées
  automated: boolean;                  // Détecté automatiquement vs manuel
  confidence: number;                  // 0-1 (confiance détection)
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  expectedImpact: string;
  rationale: string;
  
  // Actions concrètes
  actions: string[];
  
  // Références
  relatedFindings: string[];           // IDs des findings liés
  resources?: string[];                // Liens vers documentation
}

interface Insight {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'quick-win' | 'strategic' | 'long-term';
  
  // Analyse
  data: {
    metric: string;                    // Métrique concernée
 currentValue: number | string;
    targetValue: number | string;
    gap: number;                       // Écart à combler
  };
  
  // Action
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;                    // Ex: "2 semaines", "1 sprint"
  
  // Justification
  rationale: string;
  relatedFindings: string[];
  
  // Suivi
  status?: 'pending' | 'in-progress' | 'completed' | 'deferred';
  completionDate?: string;
}

// === ISSUE TYPES SPÉCIFIQUES ===

interface PerformanceIssue {
  type: 'slow-loading' | 'large-resources' | 'too-many-requests' | 'render-blocking';
  metric: string;
  value: number;
  threshold: number;
  severity: number;
  description: string;
  recommendation: string;
}

interface AccessibilityViolation {
  id: string;                          // ID règle axe-core
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  wcagCriteria: string[];              // Ex: ['wcag2aa', 'wcag143']
  description: string;
  help: string;
  helpUrl: string;
  
  nodes: {
    html: string;                      // Extrait HTML
    target: string[];                  // Sélecteurs CSS
    failureSummary: string;
  }[];
  
  count: number;                       // Nombre d'occurrences
}

interface SEOIssue {
  type: 'metadata' | 'structure' | 'schema' | 'technical';
  element: string;
  issue: string;
  severity: number;
  recommendation: string;
}

interface ContentIssue {
  type: 'readability' | 'structure' | 'eeat' | 'quality';
  metric: string;
  value: number | string;
  target: number | string;
  severity: number;
  recommendation: string;
}

interface HeuristicEvaluation {
  heuristic: number;                   // 1-10 (Nielsen)
  name: string;
  score: number;                       // 0-4
  findings: string[];                  // Descriptions des problèmes
  recommendations: string[];
}
```

---

## 3. Exemple de rapport complet

### 3.1 Exemple minimal (L1)

```json
{
  "metadata": {
    "id": "insp_20261021_example_com",
    "url": "https://example.com",
    "domain": "example.com",
    "date": "2026-10-21T14:30:00Z",
    "duration": 4523,
    "level": "L1",
    "playwrightVersion": "1.64.1",
    "ektsVersion": "1.0.0"
  },
  "scores": {
    "performance": 78,
    "accessibility": 82,
    "seo": 85,
    "ux": 74,
    "overall": 80
  },
  "performance": {
    "coreWebVitals": {
      "lcp": { "value": 2800, "status": "needs-improvement" },
      "inp": { "value": 180, "status": "good" },
      "cls": { "value": 0.08, "status": "good" },
      "ttfb": { "value": 650, "status": "good" }
    },
    "resources": {
      "totalWeight": 2450000,
      "totalRequests": 42,
      "byType": {
        "javascript": { "weight": 850000, "requests": 12 },
        "css": { "weight": 180000, "requests": 5 },
        "images": { "weight": 1200000, "requests": 18 },
        "fonts": { "weight": 120000, "requests": 4 },
        "other": { "weight": 100000, "requests": 3 }
      }
    },
    "issues": [
      {
        "type": "slow-loading",
        "metric": "LCP",
        "value": 2800,
        "threshold": 2500,
        "severity": 3,
        "description": "LCP de 2.8s dépasse le seuil de 2.5s",
        "recommendation": "Optimiser l'image héro (principal élément LCP)"
      }
    ],
    "recommendations": [
      {
        "title": "Optimiser l'image héro",
        "description": "L'image héro (1.2MB) est le principal élément LCP",
        "priority": "high",
        "effort": "low",
        "expectedImpact": "Réduction LCP de ~800ms",
        "rationale": "Image non optimisée, format JPEG au lieu de WebP",
        "actions": [
          "Convertir en WebP",
          "Ajouter attribut loading='eager'",
          "Ajouter preload hint"
        ]
      }
    ]
  },
  "assets": {
    "screenshots": {
      "viewport": "ekts-data/inspections/example_com/20261021_viewport.png",
      "fullPage": "ekts-data/inspections/example_com/20261021_fullpage.png"
    }
  },
  "findings": [
    {
      "id": "find_perf_001",
      "category": "performance",
      "severity": 3,
      "priority": 36,
      "title": "LCP trop élevé",
      "description": "Le Largest Contentful Paint est de 2.8s, dépassant le seuil de 2.5s",
      "location": "https://example.com",
      "evidence": "LCP: 2800ms (élément: img.hero)",
      "recommendation": "Optimiser l'image héro (conversion WebP, preload)",
      "effort": "low",
      "impact": "Réduction LCP de ~800ms, amélioration UX mobile",
      "automated": true,
      "confidence": 0.95
    }
  ],
  "insights": [
    {
      "id": "ins_001",
      "title": "Optimisation images prioritaire",
      "description": "Les images représentent 49% du poids total de la page",
      "priority": "high",
      "category": "quick-win",
      "data": {
        "metric": "Poids images",
        "currentValue": "1.2MB",
        "targetValue": "<500KB",
        "gap": 700000
      },
      "action": "Convertir toutes les images en WebP et ajouter lazy loading",
      "expectedImpact": "Réduction poids page de 40%, amélioration LCP",
      "effort": "low",
      "timeline": "1 jour",
      "rationale": "Impact rapide sur performance perçue et SEO",
      "relatedFindings": ["find_perf_001", "find_perf_002"]
    }
  ],
  "rag": {
    "indexedChunks": 12,
    "embeddingModel": "text-embedding-3-small",
    "searchable": true
  }
}
```

---

## 4. Génération de rapports

### 4.1 Générateur de rapport

```typescript
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class ReportGenerator {
  private inspection: Inspection;
  private report: Partial<InspectionReport>;
  
  constructor(inspection: Inspection) {
    this.inspection = inspection;
    this.report = this.initializeReport();
  }
  
  private initializeReport(): Partial<InspectionReport> {
    return {
      metadata: {
        id: uuidv4(),
        url: this.inspection.url,
        domain: new URL(this.inspection.url).hostname,
        date: new Date().toISOString(),
        duration: this.inspection.duration,
        level: this.inspection.level,
        playwrightVersion: this.inspection.playwrightVersion,
        ektsVersion: '1.0.0'
      },
      scores: {},
      performance: { coreWebVitals: {}, resources: {}, issues: [], recommendations: [] },
      accessibility: { standard: 'WCAG 2.2 AA', violations: [], summary: {}, recommendations: [] },
      seo: { metadata: {}, headings: {}, schema: {}, aiReadiness: {}, issues: [], recommendations: [] },
      ux: { heuristics: [], frictionPoints: [], recommendations: [] },
      findings: [],
      insights: [],
      assets: { screenshots: {} },
      rag: { indexedChunks: 0, embeddingModel: 'text-embedding-3-small', searchable: false }
    };
  }
  
  async generate(): Promise<InspectionReport> {
    // 1. Calculer scores
    this.report.scores = await this.calculateScores();
    
    // 2. Analyser performance
    if (this.inspection.level >= 'L3') {
      this.report.performance = await this.analyzePerformance();
    }
    
    // 3. Analyser accessibilité
    if (this.inspection.level >= 'L4') {
      this.report.accessibility = await this.analyzeAccessibility();
    }
    
    // 4. Analyser SEO
    if (this.inspection.level >= 'L4') {
      this.report.seo = await this.analyzeSEO();
    }
    
    // 5. Analyser UX
    this.report.ux = await this.analyzeUX();
    
    // 6. Analyser contenu (si L4)
    if (this.inspection.level === 'L4') {
      this.report.content = await this.analyzeContent();
    }
    
    // 7. Agréger findings
    this.report.findings = this.aggregateFindings();
    
    // 8. Générer insights (LLM)
    this.report.insights = await this.generateInsights();
    
    // 9. Sauvegarder assets
    this.report.assets = await this.saveAssets();
    
    // 10. Préparer pour RAG
    this.report.rag = await this.prepareForRAG();
    
    return this.report as InspectionReport;
  }
  
  private async calculateScores() {
    // Calculer scores par dimension
    const perfScore = this.calculatePerformanceScore();
    const a11yScore = this.calculateAccessibilityScore();
    const seoScore = this.calculateSEOScore();
    const uxScore = this.calculateUXScore();
    
    // Score global (moyenne pondérée)
    const weights = { performance: 0.25, accessibility: 0.20, seo: 0.20, ux: 0.20, content: 0.15 };
    const overall = (
      perfScore * weights.performance +
      a11yScore * weights.accessibility +
      seoScore * weights.seo +
      uxScore * weights.ux
    );
    
    return {
      performance: Math.round(perfScore),
      accessibility: Math.round(a11yScore),
      seo: Math.round(seoScore),
      ux: Math.round(uxScore),
      content: this.inspection.level === 'L4' ? Math.round(this.calculateContentScore()) : 0,
      overall: Math.round(overall)
    };
  }
  
  async save(path: string) {
    // Créer répertoire
    const dir = join(path, this.report.metadata.domain, this.report.metadata.date.split('T')[0]);
    mkdirSync(dir, { recursive: true });
    
    // Sauvegarder JSON
    const jsonPath = join(dir, `${this.report.metadata.id}.json`);
    writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
    
    // Sauvegarder Markdown
    const mdPath = join(dir, `${this.report.metadata.id}.md`);
    writeFileSync(mdPath, this.generateMarkdown());
    
    return { jsonPath, mdPath };
  }
  
  private generateMarkdown(): string {
    return `# Rapport d'inspection : ${this.report.metadata.domain}

**Date :** ${new Date(this.report.metadata.date).toLocaleDateString('fr-FR')}  
**Niveau :** ${this.report.metadata.level}  
**Durée :** ${(this.report.metadata.duration / 1000).toFixed(1)}s

---

## Scores globaux

| Dimension | Score | Interprétation |
|-----------|-------|----------------|
| Performance | ${this.report.scores.performance}/100 | ${this.interpretScore(this.report.scores.performance)} |
| Accessibilité | ${this.report.scores.accessibility}/100 | ${this.interpretScore(this.report.scores.accessibility)} |
| SEO | ${this.report.scores.seo}/100 | ${this.interpretScore(this.report.scores.seo)} |
| UX | ${this.report.scores.ux}/100 | ${this.interpretScore(this.report.scores.ux)} |
| **Global** | **${this.report.scores.overall}/100** | ${this.interpretScore(this.report.scores.overall)} |

---

## Insights prioritaires

${this.report.insights.map((insight, i) => `
### ${i + 1}. ${insight.title}

**Priorité :** ${insight.priority.toUpperCase()}  
**Effort :** ${insight.effort}  
**Timeline :** ${insight.timeline}

${insight.description}

**Action :** ${insight.action}  
**Impact attendu :** ${insight.expectedImpact}
`).join('\n')}

---

## Findings critiques (sévérité ≥ 3)

${this.report.findings
  .filter(f => f.severity >= 3)
  .sort((a, b) => b.priority - a.priority)
  .map(finding => `
### ${finding.title}

**Catégorie :** ${finding.category}  
**Sévérité :** ${finding.severity}/4  
**Priorité :** ${finding.priority}/60

${finding.description}

**Localisation :** \`${finding.location}\`  
**Preuve :** ${finding.evidence}

**Recommandation :** ${finding.recommendation}  
**Effort :** ${finding.effort}  
**Impact :** ${finding.impact}
`).join('\n')}

---

## Performance

### Core Web Vitals

| Métrique | Valeur | Seuil | Statut |
|----------|--------|-------|--------|
| LCP | ${this.report.performance.coreWebVitals.lcp.value}ms | 2500ms | ${this.report.performance.coreWebVitals.lcp.status} |
| INP | ${this.report.performance.coreWebVitals.inp.value}ms | 200ms | ${this.report.performance.coreWebVitals.inp.status} |
| CLS | ${this.report.performance.coreWebVitals.cls.value} | 0.1 | ${this.report.performance.coreWebVitals.cls.status} |
| TTFB | ${this.report.performance.coreWebVitals.ttfb.value}ms | 800ms | ${this.report.performance.coreWebVitals.ttfb.status} |

### Ressources

- **Poids total :** ${(this.report.performance.resources.totalWeight / 1024 / 1024).toFixed(2)} MB
- **Requêtes HTTP :** ${this.report.performance.resources.totalRequests}

---

## Assets

- **Screenshot viewport :** \`${this.report.assets.screenshots.viewport}\`
- **Screenshot full page :** \`${this.report.assets.screenshots.fullPage}\`

---

*Rapport généré par EKTS v${this.report.metadata.ektsVersion} le ${new Date().toISOString()}*
`;
  }
  
  private interpretScore(score: number): string {
    if (score >= 90) return '🟢 Excellent';
    if (score >= 75) return '🟡 Bon';
    if (score >= 60) return '🟠 Acceptable';
    if (score >= 40) return '🔴 Insuffisant';
    return '⚫ Critique';
  }
}
```

---

## 5. Stockage et indexation

### 5.1 Structure de stockage

```
ekts-data/
└── inspections/
    └── example.com/
        └── 2026-10-21/
            ├── insp_20261021_example_com.json    # Rapport JSON
            ├── insp_20261021_example_com.md      # Rapport Markdown
            ├── viewport.png                       # Screenshot viewport
            ├── fullpage.png                       # Screenshot full page
            └── performance.trace                  # Trace performance
```

### 5.2 Indexation RAG

```typescript
async function indexReportForRAG(report: InspectionReport) {
  const chunks = [];
  
  // Chunker par insight
  for (const insight of report.insights) {
    chunks.push({
      id: `insight_${report.metadata.id}_${insight.id}`,
      type: 'insight',
      site: report.metadata.domain,
      date: report.metadata.date,
      category: insight.category,
      content: `${insight.title}\n\n${insight.description}\n\nAction: ${insight.action}\n\nImpact: ${insight.expectedImpact}`,
      metadata: {
        priority: insight.priority,
        effort: insight.effort,
        timeline: insight.timeline
      },
      embedding: await generateEmbedding(insight.title + ' ' + insight.description + ' ' + insight.action)
    });
  }
  
  // Chunker par finding critique
  for (const finding of report.findings.filter(f => f.severity >= 3)) {
    chunks.push({
      id: `finding_${report.metadata.id}_${finding.id}`,
      type: 'finding',
      site: report.metadata.domain,
      date: report.metadata.date,
      category: finding.category,
      content: `${finding.title}\n\n${finding.description}\n\nRecommandation: ${finding.recommendation}`,
      metadata: {
        severity: finding.severity,
        priority: finding.priority,
        effort: finding.effort
      },
      embedding: await generateEmbedding(finding.title + ' ' + finding.description + ' ' + finding.recommendation)
      });
  }
  
  // Stocker dans EKTS
  await db.ragChunks.insertMany(chunks);
  
  return chunks.length;
}
```

---

## 6. Validation du schéma

### 6.1 Schéma de validation (Zod)

```typescript
import { z } from 'zod';

const InspectionReportSchema = z.object({
  metadata: z.object({
    id: z.string().uuid(),
    url: z.string().url(),
    domain: z.string(),
    date: z.string().datetime(),
    duration: z.number().positive(),
    level: z.enum(['L1', 'L2', 'L3', 'L4']),
    playwrightVersion: z.string(),
    ektsVersion: z.string()
  }),
  
  scores: z.object({
    performance: z.number().min(0).max(100),
    accessibility: z.number().min(0).max(100),
    seo: z.number().min(0).max(100),
    ux: z.number().min(0).max(100),
    content: z.number().min(0).max(100).optional(),
    overall: z.number().min(0).max(100)
  }),
  
  // ... autres sections
  
  findings: z.array(z.object({
    id: z.string().uuid(),
    category: z.enum(['performance', 'accessibility', 'seo', 'ux', 'content']),
    severity: z.number().min(0).max(4),
    priority: z.number().min(1).max(60),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    evidence: z.string(),
    recommendation: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    impact: z.string(),
    automated: z.boolean(),
    confidence: z.number().min(0).max(1)
  })),
  
  insights: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.enum(['quick-win', 'strategic', 'long-term']),
    action: z.string(),
    expectedImpact: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    timeline: z.string(),
    rationale: z.string(),
    relatedFindings: z.array(z.string())
  }))
});

// Validation
function validateReport(report: unknown): InspectionReport {
  return InspectionReportSchema.parse(report);
}
```

---

## 7. Limites et évolutions

### 7.1 Limites actuelles

- **Taille rapport** : Peut atteindre 50-100 KB pour inspection L4 complète
- **Assets** : Screenshots non inclus dans JSON (références uniquement)
- **Historique** : Pas de versioning des rapports (écrasement si même URL)

### 7.2 Évolutions prévues

- **Rapports comparatifs** : Template spécifique pour benchmarking
- **Export PDF** : Génération PDF pour partage client
- **Dashboard** : Interface web pour visualisation rapports
- **Notifications** : Alertes automatiques si scores < seuils

---

## 8. Conclusion

Ce schéma de rapport d'inspection fournit une structure complète et standardisée pour capturer toutes les dimensions de l'analyse de sites web. L'intégration avec le stockage EKTS (Phase 06) et le RAG (Phase 07) permet une capitalisation continue des connaissances et une recherche sémantique dans les analyses passées.

Le format JSON garantit la flexibilité et l'interopérabilité, tandis que la génération Markdown facilite la lecture humaine. Les insights générés par LLM, combinés aux findings automatisés, offrent une vue d'ensemble actionnable pour améliorer les sites inspectés.

---

**Document rédigé le 21 octobre 2026 — Phase 08 du projet EKTS**
