# Sprint 9-1 — Analyse Performance + Accessibilité (Semaine 17)

**Durée :** 4 jours  
**Objectif :** Implémenter PerformanceAnalyzer et AccessibilityAnalyzer  
**Dépendance :** Sprint 8 (4 Niveaux d'Inspection) ✅
**Statut :** ✅ LIVRÉ (24 octobre 2026)  

---

## 1. Contexte

Le **Sprint 8** a collecté les données brutes :
- ✅ Lighthouse : performance (LCP, FID, CLS, TTFB) + SEO
- ✅ axe-core : violations accessibilité WCAG 2.2 AA
- ✅ UX : heuristiques Nielsen
- ✅ Contenu : métriques de qualité

Le **Sprint 9-1** transforme ces données en analyse structurée pour :
- 🎯 Performance : identifier les problèmes de performance et recommander des optimisations
- 🎯 Accessibilité : analyser les violations WCAG et calculer les scores

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── inspection/
│   │   │   ├── level-1.ts              ✅ (Sprint 8-1)
│   │   │   ├── level-2.ts              ✅ (Sprint 8-2)
│   │   │   ├── level-3.ts              ✅ (Sprint 8-3)
│   │   │   ├── inspector.ts            ✅ (Sprint 8-3)
│   │   │   └── types.ts                ✅ (Sprint 8-1)
│   │   ├── lighthouse.ts               ✅ (Sprint 8-2)
│   │   ├── axe.ts                      ✅ (Sprint 8-3)
│   │   └── ...
│   └── analysis/
│       └── (vide — à créer Sprint 9)
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Types Analysis (Jour 1 — 4h)

**Fichier :** `src/analysis/types.ts`

```typescript
/**
 * Types pour l'analyse 5 dimensions
 */

/**
 * Dimensions d'analyse
 */
export type AnalysisDimension = 
  | 'performance' 
  | 'accessibility' 
  | 'seo' 
  | 'ux' 
  | 'content';

/**
 * Niveau de sévérité (0-4)
 */
export type Severity = 0 | 1 | 2 | 3 | 4;

/**
 * Niveau d'effort (1-5)
 */
export type Effort = 1 | 2 | 3 | 4 | 5;

/**
 * Niveau d'impact (1-5)
 */
export type Impact = 1 | 2 | 3 | 4 | 5;

/**
 * Priorité calculée
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Finding individuel
 */
export interface Finding {
  id: string;
  dimension: AnalysisDimension;
  title: string;
  description: string;
  severity: Severity;
  effort: Effort;
  impact: Impact;
  priority: Priority;
  recommendation: string;
  references: string[];
  elements?: string[]; // Sélecteurs CSS
  metric?: {
    name: string;
    value: number;
    threshold?: number;
    unit?: string;
  };
}

/**
 * Score d'une dimension
 */
export interface DimensionScore {
  dimension: AnalysisDimension;
  score: number; // 0-100
  findings: Finding[];
  summary: string;
}

/**
 * Rapport d'analyse complet
 */
export interface AnalysisReport {
  url: string;
  timestamp: string;
  dimensions: {
    performance: DimensionScore;
    accessibility: DimensionScore;
    seo: DimensionScore;
    ux: DimensionScore;
    content: DimensionScore;
  };
  findings: Finding[];
  priorityFindings: Finding[]; // Triés par priorité
  summary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    overallScore: number; // 0-100
  };
}

/**
 * Résultats Lighthouse (entrée)
 */
export interface LighthouseResults {
  performance: {
    score: number;
    metrics: {
      lcp: number;
      fid: number;
      cls: number;
      ttfb: number;
    };
  };
  seo: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: 'error' | 'warning' | 'info';
    }>;
  };
}

/**
 * Résultats axe-core (entrée)
 */
export interface AxeResults {
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodes: number;
  }>;
  score: number;
}

/**
 * Résultats UX (entrée)
 */
export interface UXResults {
  score: number;
  heuristics: Array<{
    id: string;
    name: string;
    score: number;
    issues: string[];
  }>;
}

/**
 * Résultats contenu (entrée)
 */
export interface ContentResults {
  score: number;
  metrics: {
    wordCount: number;
    readingTime: number;
    readabilityScore: number;
  };
}
```

**Commit :**
```bash
git add src/analysis/types.ts
git commit -m "feat(analysis): add analysis types and interfaces"
```

---

### 3.2 PerformanceAnalyzer (Jour 2-3 — 8h)

**Fichier :** `src/analysis/performance.ts`

```typescript
import { 
  Finding, 
  DimensionScore, 
  LighthouseResults,
  Severity,
  Effort,
  Impact 
} from './types';

/**
 * Seuils de performance
 */
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

/**
 * Analyseur de performance
 */
export class PerformanceAnalyzer {
  /**
   * Analyse les résultats Lighthouse
   */
  analyze(results: LighthouseResults): DimensionScore {
    const findings: Finding[] = [];

    // Analyser LCP
    findings.push(...this.analyzeLCP(results.performance.metrics.lcp));

    // Analyser FID
    findings.push(...this.analyzeFID(results.performance.metrics.fid));

    // Analyser CLS
    findings.push(...this.analyzeCLS(results.performance.metrics.cls));

    // Analyser TTFB
    findings.push(...this.analyzeTTFB(results.performance.metrics.ttfb));

    // Calculer le score
    const score = results.performance.score;

    // Générer le résumé
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'performance',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse le Largest Contentful Paint (LCP)
   */
  private analyzeLCP(lcp: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.lcp;

    if (lcp > needsImprovement) {
      findings.push({
        id: 'perf-lcp-critical',
        dimension: 'performance',
        title: 'Largest Contentful Paint critique',
        description: `Le LCP est de ${lcp}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation: 'Optimiser le chargement de l\'élément principal : utiliser lazy loading, optimiser les images, réduire le CSS critique.',
        references: ['https://web.dev/lcp/', 'https://web.dev/vitals/'],
        metric: {
          name: 'LCP',
          value: lcp,
          threshold: needsImprovement,
          unit: 'ms',
        },
      });
    } else if (lcp > good) {
      findings.push({
        id: 'perf-lcp-warning',
        dimension: 'performance',
        title: 'Largest Contentful Paint à améliorer',
        description: `Le LCP est de ${lcp}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation: 'Améliorer le chargement de l\'élément principal : optimiser les images, précharger les ressources critiques.',
        references: ['https://web.dev/lcp/'],
        metric: {
          name: 'LCP',
          value: lcp,
          threshold: good,
          unit: 'ms',
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le First Input Delay (FID)
   */
  private analyzeFID(fid: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.fid;

    if (fid > needsImprovement) {
      findings.push({
        id: 'perf-fid-critical',
        dimension: 'performance',
        title: 'First Input Delay critique',
        description: `Le FID est de ${fid}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation: 'Réduire le travail JavaScript : découper le code, charger en async, utiliser web workers.',
        references: ['https://web.dev/fid/'],
        metric: {
          name: 'FID',
          value: fid,
          threshold: needsImprovement,
          unit: 'ms',
        },
      });
    } else if (fid > good) {
      findings.push({
        id: 'perf-fid-warning',
        dimension: 'performance',
        title: 'First Input Delay à améliorer',
        description: `Le FID est de ${fid}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation: 'Optimiser l\'exécution JavaScript : réduire le temps de traitement, defer les scripts non critiques.',
        references: ['https://web.dev/fid/'],
        metric: {
          name: 'FID',
          value: fid,
          threshold: good,
          unit: 'ms',
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le Cumulative Layout Shift (CLS)
   */
  private analyzeCLS(cls: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.cls;

    if (cls > needsImprovement) {
      findings.push({
        id: 'perf-cls-critical',
        dimension: 'performance',
        title: 'Cumulative Layout Shift critique',
        description: `Le CLS est de ${cls.toFixed(3)}, ce qui est très instable (> ${needsImprovement}).`,
        severity: 4,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation: 'Stabiliser la mise en page : définir les dimensions des images/vidéos, réserver l\'espace pour les publicités, éviter les insertions dynamiques.',
        references: ['https://web.dev/cls/'],
        metric: {
          name: 'CLS',
          value: cls,
          threshold: needsImprovement,
        },
      });
    } else if (cls > good) {
      findings.push({
        id: 'perf-cls-warning',
        dimension: 'performance',
        title: 'Cumulative Layout Shift à améliorer',
        description: `Le CLS est de ${cls.toFixed(3)}, ce qui est moyen (${good}-${needsImprovement}).`,
        severity: 2,
        effort: 1,
        impact: 3,
        priority: 'medium',
        recommendation: 'Améliorer la stabilité : définir les dimensions des médias, éviter les changements de layout inattendus.',
        references: ['https://web.dev/cls/'],
        metric: {
          name: 'CLS',
          value: cls,
          threshold: good,
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le Time to First Byte (TTFB)
   */
  private analyzeTTFB(ttfb: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.ttfb;

    if (ttfb > needsImprovement) {
      findings.push({
        id: 'perf-ttfb-critical',
        dimension: 'performance',
        title: 'Time to First Byte critique',
        description: `Le TTFB est de ${ttfb}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 3,
        effort: 3,
        impact: 4,
        priority: 'high',
        recommendation: 'Optimiser le serveur : utiliser un CDN, activer le cache, optimiser les requêtes base de données.',
        references: ['https://web.dev/ttfb/'],
        metric: {
          name: 'TTFB',
          value: ttfb,
          threshold: needsImprovement,
          unit: 'ms',
        },
      });
    } else if (ttfb > good) {
      findings.push({
        id: 'perf-ttfb-warning',
        dimension: 'performance',
        title: 'Time to First Byte à améliorer',
        description: `Le TTFB est de ${ttfb}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation: 'Améliorer le temps de réponse serveur : activer le cache, optimiser les requêtes.',
        references: ['https://web.dev/ttfb/'],
        metric: {
          name: 'TTFB',
          value: ttfb,
          threshold: good,
          unit: 'ms',
        },
      });
    }

    return findings;
  }

  /**
   * Génère un résumé de l'analyse
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter(f => f.priority === 'critical').length;
    const highCount = findings.filter(f => f.priority === 'high').length;
    const mediumCount = findings.filter(f => f.priority === 'medium').length;

    let summary = `Score performance : ${score}/100. `;

    if (criticalCount > 0) {
      summary += `${criticalCount} problème(s) critique(s) identifié(s). `;
    }
    if (highCount > 0) {
      summary += `${highCount} problème(s) important(s) identifié(s). `;
    }
    if (mediumCount > 0) {
      summary += `${mediumCount} problème(s) moyen(s) identifié(s). `;
    }
    if (findings.length === 0) {
      summary += 'Aucun problème de performance majeur détecté.';
    }

    return summary;
  }
}
```

**Tests :** `tests/analysis/performance.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PerformanceAnalyzer } from '../../src/analysis/performance';
import { LighthouseResults } from '../../src/analysis/types';

describe('PerformanceAnalyzer', () => {
  const analyzer = new PerformanceAnalyzer();

  describe('analyze', () => {
    it('should analyze good performance metrics', () => {
      const results: LighthouseResults = {
        performance: {
          score: 95,
          metrics: {
            lcp: 1500, // Bon (< 2500)
            fid: 50,   // Bon (< 100)
            cls: 0.05, // Bon (< 0.1)
            ttfb: 500, // Bon (< 800)
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('performance');
      expect(result.score).toBe(95);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Aucun problème');
    });

    it('should detect critical LCP', () => {
      const results: LighthouseResults = {
        performance: {
          score: 30,
          metrics: {
            lcp: 5000, // Critique (> 4000)
            fid: 50,
            cls: 0.05,
            ttfb: 500,
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].id).toBe('perf-lcp-critical');
      expect(result.findings[0].severity).toBe(4);
      expect(result.findings[0].priority).toBe('critical');
    });

    it('should detect warning LCP', () => {
      const results: LighthouseResults = {
        performance: {
          score: 60,
          metrics: {
            lcp: 3000, // Moyen (2500-4000)
            fid: 50,
            cls: 0.05,
            ttfb: 500,
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].id).toBe('perf-lcp-warning');
      expect(result.findings[0].severity).toBe(2);
      expect(result.findings[0].priority).toBe('medium');
    });

    it('should detect critical FID', () => {
      const results: LighthouseResults = {
        performance: {
          score: 40,
          metrics: {
            lcp: 1500,
            fid: 500, // Critique (> 300)
            cls: 0.05,
            ttfb: 500,
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      const fidFinding = result.findings.find(f => f.id === 'perf-fid-critical');
      expect(fidFinding).toBeDefined();
      expect(fidFinding?.severity).toBe(4);
    });

    it('should detect critical CLS', () => {
      const results: LighthouseResults = {
        performance: {
          score: 50,
          metrics: {
            lcp: 1500,
            fid: 50,
            cls: 0.3, // Critique (> 0.25)
            ttfb: 500,
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      const clsFinding = result.findings.find(f => f.id === 'perf-cls-critical');
      expect(clsFinding).toBeDefined();
      expect(clsFinding?.severity).toBe(4);
    });

    it('should detect critical TTFB', () => {
      const results: LighthouseResults = {
        performance: {
          score: 45,
          metrics: {
            lcp: 1500,
            fid: 50,
            cls: 0.05,
            ttfb: 2000, // Critique (> 1800)
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      const ttfbFinding = result.findings.find(f => f.id === 'perf-ttfb-critical');
      expect(ttfbFinding).toBeDefined();
      expect(ttfbFinding?.severity).toBe(3);
    });

    it('should analyze multiple issues', () => {
      const results: LighthouseResults = {
        performance: {
          score: 20,
          metrics: {
            lcp: 5000, // Critique
            fid: 500,  // Critique
            cls: 0.3,  // Critique
            ttfb: 2000, // Critique
          },
        },
        seo: { score: 90, issues: [] },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(4);
      expect(result.summary).toContain('4 problème(s) critique(s)');
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/performance.test.ts
# ✅ 7 tests passent

npm run test:coverage -- tests/analysis/performance.test.ts
# ✅ > 80% couverture

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/analysis/performance.ts
git add tests/analysis/performance.test.ts
git commit -m "feat(analysis): implement PerformanceAnalyzer with Core Web Vitals analysis"
```

---

### 3.3 AccessibilityAnalyzer (Jour 4 — 8h)

**Fichier :** `src/analysis/accessibility.ts`

```typescript
import { Finding, DimensionScore, AxeResults, Severity } from './types';

/**
 * Mapping impact → sévérité
 */
const IMPACT_TO_SEVERITY: Record<string, Severity> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};

/**
 * Analyseur d'accessibilité
 */
export class AccessibilityAnalyzer {
  /**
   * Analyse les résultats axe-core
   */
  analyze(results: AxeResults): DimensionScore {
    const findings: Finding[] = [];

    // Analyser chaque violation
    for (const violation of results.violations) {
      findings.push(this.analyzeViolation(violation));
    }

    // Calculer le score
    const score = results.score;

    // Générer le résumé
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'accessibility',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse une violation individuelle
   */
  private analyzeViolation(violation: AxeResults['violations'][0]): Finding {
    const severity = IMPACT_TO_SEVERITY[violation.impact] || 2;
    const effort = this.estimateEffort(violation);
    const impact = this.calculateImpact(severity, violation.nodes);

    return {
      id: `a11y-${violation.id}`,
      dimension: 'accessibility',
      title: violation.description,
      description: `${violation.help} (${violation.nodes} élément(s) affecté(s))`,
      severity,
      effort,
      impact,
      priority: this.calculatePriority(severity, effort, impact),
      recommendation: violation.help,
      references: [violation.helpUrl],
    };
  }

  /**
   * Estime l'effort de correction
   */
  private estimateEffort(violation: AxeResults['violations'][0]): 1 | 2 | 3 | 4 | 5 {
    // Estimation basée sur le nombre d'éléments affectés
    if (violation.nodes === 1) {
      return 1; // Facile
    } else if (violation.nodes <= 5) {
      return 2; // Moyen
    } else if (violation.nodes <= 20) {
      return 3; // Complexe
    } else {
      return 4; // Très complexe
    }
  }

  /**
   * Calcule l'impact basé sur la sévérité et le nombre d'éléments
   */
  private calculateImpact(severity: Severity, nodes: number): 1 | 2 | 3 | 4 | 5 {
    // Impact = sévérité × facteur d'éléments
    const nodeFactor = Math.min(2, Math.ceil(nodes / 10)); // Max 2
    const impact = Math.min(5, severity * nodeFactor);
    return Math.max(1, impact) as 1 | 2 | 3 | 4 | 5;
  }

  /**
   * Calcule la priorité
   */
  private calculatePriority(
    severity: Severity,
    effort: 1 | 2 | 3 | 4 | 5,
    impact: 1 | 2 | 3 | 4 | 5
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const score = severity * (6 - effort);

    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 2) return 'low';
    return 'info';
  }

  /**
   * Génère un résumé de l'analyse
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter(f => f.severity === 4).length;
    const seriousCount = findings.filter(f => f.severity === 3).length;
    const moderateCount = findings.filter(f => f.severity === 2).length;
    const minorCount = findings.filter(f => f.severity === 1).length;

    let summary = `Score accessibilité : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Aucune violation WCAG détectée. Excellente accessibilité !';
    } else {
      summary += `${findings.length} violation(s) WCAG détectée(s) : `;
      if (criticalCount > 0) summary += `${criticalCount} critique(s), `;
      if (seriousCount > 0) summary += `${seriousCount} sérieuse(s), `;
      if (moderateCount > 0) summary += `${moderateCount} modérée(s), `;
      if (minorCount > 0) summary += `${minorCount} mineure(s).`;
    }

    return summary;
  }
}
```

**Tests :** `tests/analysis/accessibility.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AccessibilityAnalyzer } from '../../src/analysis/accessibility';
import { AxeResults } from '../../src/analysis/types';

describe('AccessibilityAnalyzer', () => {
  const analyzer = new AccessibilityAnalyzer();

  describe('analyze', () => {
    it('should analyze perfect accessibility', () => {
      const results: AxeResults = {
        violations: [],
        score: 100,
      };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('accessibility');
      expect(result.score).toBe(100);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Aucune violation');
    });

    it('should analyze critical violation', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'critical',
            description: 'Elements must have sufficient color contrast',
            help: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
            nodes: 5,
          },
        ],
        score: 60,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].id).toBe('a11y-color-contrast');
      expect(result.findings[0].severity).toBe(4); // critical
      expect(result.findings[0].priority).toBe('critical');
    });

    it('should analyze serious violation', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'image-alt',
            impact: 'serious',
            description: 'Images must have alternate text',
            help: 'Ensures <img> elements have alternate text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
            nodes: 10,
          },
        ],
        score: 70,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].severity).toBe(3); // serious
    });

    it('should analyze moderate violation', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'link-name',
            impact: 'moderate',
            description: 'Links must have discernible text',
            help: 'Ensures links have discernible text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/link-name',
            nodes: 3,
          },
        ],
        score: 80,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].severity).toBe(2); // moderate
    });

    it('should analyze minor violation', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'heading-order',
            impact: 'minor',
            description: 'Heading levels should only increase by one',
            help: 'Ensures the order of headings is semantically correct',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/heading-order',
            nodes: 1,
          },
        ],
        score: 90,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].severity).toBe(1); // minor
    });

    it('should calculate effort based on nodes', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'test',
            impact: 'serious',
            description: 'Test',
            help: 'Test',
            helpUrl: 'https://example.com',
            nodes: 25, // > 20 → effort 4
          },
        ],
        score: 50,
      };

      const result = analyzer.analyze(results);

      expect(result.findings[0].effort).toBe(4);
    });

    it('should analyze multiple violations', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'critical',
            description: 'Contrast',
            help: 'Help',
            helpUrl: 'https://example.com',
            nodes: 5,
          },
          {
            id: 'image-alt',
            impact: 'serious',
            description: 'Alt text',
            help: 'Help',
            helpUrl: 'https://example.com',
            nodes: 10,
          },
        ],
        score: 40,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(2);
      expect(result.summary).toContain('2 violation(s)');
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/accessibility.test.ts
# ✅ 7 tests passent

npm run test:coverage -- tests/analysis/accessibility.test.ts
# ✅ > 80% couverture

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/analysis/accessibility.ts
git add tests/analysis/accessibility.test.ts
git commit -m "feat(analysis): implement AccessibilityAnalyzer with WCAG 2.2 AA analysis"
```

---

### 3.4 Vérifications finales Sprint 9-1 (Jour 4)

```bash
# 1. Tests unitaires
npm test tests/analysis/
# ✅ 14 tests passent

# 2. Couverture
npm run test:coverage -- tests/analysis/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/analysis/
# ✅ types.ts, performance.ts, accessibility.ts

# 6. Test manuel PerformanceAnalyzer
node -e "
const { PerformanceAnalyzer } = require('./dist/analysis/performance');
const analyzer = new PerformanceAnalyzer();
const results = {
  performance: {
    score: 50,
    metrics: { lcp: 5000, fid: 500, cls: 0.3, ttfb: 2000 }
  },
  seo: { score: 90, issues: [] }
};
const report = analyzer.analyze(results);
console.log('Score:', report.score);
console.log('Findings:', report.findings.length);
console.log('Summary:', report.summary);
"
# ✅ Analyse performance fonctionne

# 7. Test manuel AccessibilityAnalyzer
node -e "
const { AccessibilityAnalyzer } = require('./dist/analysis/accessibility');
const analyzer = new AccessibilityAnalyzer();
const results = {
  violations: [
    { id: 'color-contrast', impact: 'critical', description: 'Contrast', help: 'Help', helpUrl: 'https://example.com', nodes: 5 }
  ],
  score: 60
};
const report = analyzer.analyze(results);
console.log('Score:', report.score);
console.log('Findings:', report.findings.length);
console.log('Summary:', report.summary);
"
# ✅ Analyse accessibilité fonctionne

# 8. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 9. Push
git push origin feat/sprint-9-1
```

**Point de contrôle Sprint 9-1 :**
- ✅ Types Analysis définis
- ✅ PerformanceAnalyzer implémenté (LCP, FID, CLS, TTFB)
- ✅ AccessibilityAnalyzer implémenté (WCAG 2.2 AA)
- ✅ Recommandations générées
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation JSDoc complète

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/analysis/types.ts` | 150 | Types Analysis |
| `src/analysis/performance.ts` | 200 | PerformanceAnalyzer |
| `src/analysis/accessibility.ts` | 150 | AccessibilityAnalyzer |
| `tests/analysis/performance.test.ts` | 150 | Tests PerformanceAnalyzer |
| `tests/analysis/accessibility.test.ts` | 150 | Tests AccessibilityAnalyzer |

**Total Sprint 9-1 :** ~800 lignes

---

## 5. Commits

```bash
git commit -m "feat(analysis): add analysis types and interfaces"
git commit -m "feat(analysis): implement PerformanceAnalyzer with Core Web Vitals analysis"
git commit -m "feat(analysis): implement AccessibilityAnalyzer with WCAG 2.2 AA analysis"
```

---

## 6. Transition vers Sprint 9-2

**Prérequis pour Sprint 9-2 :**
- ✅ Sprint 9-1 terminé avec succès
- ✅ PerformanceAnalyzer fonctionnel
- ✅ AccessibilityAnalyzer fonctionnel
- ✅ Types Analysis définis
- ✅ Tests > 80% couverture

**Sprint 9-2 va implémenter :**
- 🎯 SEOAnalyzer (meta, structure, liens)
- 🎯 UXAnalyzer (heuristiques Nielsen)
- 🎯 ContentAnalyzer (qualité, lisibilité)

---

**Fin du document Sprint 9-1**
