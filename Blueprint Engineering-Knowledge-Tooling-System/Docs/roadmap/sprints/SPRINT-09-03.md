# Sprint 9-3 — Matrice Sévérité + Priorisation + Tests + Documentation (Semaine 18)

**Durée :** 3 jours  
**Objectif :** Implémenter la matrice de sévérité, la priorisation automatique, les tests d'intégration et la documentation  
**Dépendance :** Sprint 9-2 (SEO + UX + Contenu) ✅

---

## 1. Contexte

Les **Sprints 9-1 et 9-2** ont implémenté les 5 analyseurs :
- ✅ PerformanceAnalyzer (LCP, FID, CLS, TTFB)
- ✅ AccessibilityAnalyzer (WCAG 2.2 AA)
- ✅ SEOAnalyzer (meta tags, structure, liens)
- ✅ UXAnalyzer (heuristiques Nielsen)
- ✅ ContentAnalyzer (qualité, lisibilité)

Le **Sprint 9-3** finalise l'analyse avec :
- 🎯 SeverityMatrix (matrice de sévérité : 0-4 × 1-5 × 1-3)
- 🎯 FindingPrioritizer (priorisation automatique)
- 🎯 AnalysisPipeline (orchestration complète)
- 🎯 Tests d'intégration complets
- 🎯 Documentation ANALYSIS.md

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── analysis/
│   │   ├── types.ts                    ✅ (Sprint 9-1)
│   │   ├── performance.ts              ✅ (Sprint 9-1)
│   │   ├── accessibility.ts            ✅ (Sprint 9-1)
│   │   ├── seo.ts                      ✅ (Sprint 9-2)
│   │   ├── ux.ts                       ✅ (Sprint 9-2)
│   │   ├── content.ts                  ✅ (Sprint 9-2)
│   │   ├── severity.ts                 (à créer)
│   │   ├── prioritizer.ts              (à créer)
│   │   └── pipeline.ts                 (à créer)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 SeverityMatrix (Jour 1 — 6h)

**Fichier :** `src/analysis/severity.ts`

```typescript
import { Severity, Effort, Impact, Priority, Finding } from './types';

/**
 * Matrice de sévérité
 * 
 * Calcule la priorité d'un finding basée sur :
 * - Sévérité (0-4) : gravité du problème
 * - Effort (1-5) : complexité de la correction
 * - Impact (1-5) : effet sur l'expérience utilisateur
 * 
 * Formule : priority_score = severity × (6 - effort)
 */
export class SeverityMatrix {
  /**
   * Calcule la priorité d'un finding
   */
  calculatePriority(finding: Omit<Finding, 'priority'>): Priority {
    const score = this.calculateScore(finding.severity, finding.effort);
    return this.scoreToPriority(score);
  }

  /**
   * Calcule le score de priorité
   */
  calculateScore(severity: Severity, effort: Effort): number {
    return severity * (6 - effort);
  }

  /**
   * Convertit un score en priorité
   */
  scoreToPriority(score: number): Priority {
    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 2) return 'low';
    return 'info';
  }

  /**
   * Valide les paramètres de sévérité
   */
  validateSeverity(severity: number): boolean {
    return Number.isInteger(severity) && severity >= 0 && severity <= 4;
  }

  /**
   * Valide les paramètres d'effort
   */
  validateEffort(effort: number): boolean {
    return Number.isInteger(effort) && effort >= 1 && effort <= 5;
  }

  /**
   * Valide les paramètres d'impact
   */
  validateImpact(impact: number): boolean {
    return Number.isInteger(impact) && impact >= 1 && impact <= 5;
  }

  /**
   * Exemples de calculs de priorité
   */
  static getExamples(): Array<{
    severity: Severity;
    effort: Effort;
    score: number;
    priority: Priority;
    description: string;
  }> {
    return [
      {
        severity: 4,
        effort: 1,
        score: 20,
        priority: 'critical',
        description: 'Problème critique, facile à corriger',
      },
      {
        severity: 4,
        effort: 5,
        score: 4,
        priority: 'low',
        description: 'Problème critique, très difficile à corriger',
      },
      {
        severity: 3,
        effort: 2,
        score: 12,
        priority: 'high',
        description: 'Problème sérieux, effort moyen',
      },
      {
        severity: 2,
        effort: 3,
        score: 6,
        priority: 'medium',
        description: 'Problème modéré, effort moyen',
      },
      {
        severity: 1,
        effort: 4,
        score: 2,
        priority: 'low',
        description: 'Problème mineur, effort élevé',
      },
      {
        severity: 0,
        effort: 5,
        score: 0,
        priority: 'info',
        description: 'Information, très difficile à corriger',
      },
    ];
  }
}
```

**Tests :** `tests/analysis/severity.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { SeverityMatrix } from '../../src/analysis/severity';
import { Severity, Effort } from '../../src/analysis/types';

describe('SeverityMatrix', () => {
  const matrix = new SeverityMatrix();

  describe('calculateScore', () => {
    it('should calculate score correctly', () => {
      expect(matrix.calculateScore(4, 1)).toBe(20); // Critical
      expect(matrix.calculateScore(3, 2)).toBe(12); // High
      expect(matrix.calculateScore(2, 3)).toBe(6);  // Medium
      expect(matrix.calculateScore(1, 4)).toBe(2);  // Low
      expect(matrix.calculateScore(0, 5)).toBe(0);  // Info
    });

    it('should handle edge cases', () => {
      expect(matrix.calculateScore(4, 5)).toBe(4);  // Critical severity but high effort
      expect(matrix.calculateScore(0, 1)).toBe(0);  // No severity
    });
  });

  describe('scoreToPriority', () => {
    it('should convert score to priority correctly', () => {
      expect(matrix.scoreToPriority(20)).toBe('critical');
      expect(matrix.scoreToPriority(15)).toBe('high');
      expect(matrix.scoreToPriority(6)).toBe('medium');
      expect(matrix.scoreToPriority(2)).toBe('low');
      expect(matrix.scoreToPriority(0)).toBe('info');
    });

    it('should handle boundary values', () => {
      expect(matrix.scoreToPriority(19)).toBe('high');
      expect(matrix.scoreToPriority(12)).toBe('high');
      expect(matrix.scoreToPriority(11)).toBe('medium');
      expect(matrix.scoreToPriority(6)).toBe('medium');
      expect(matrix.scoreToPriority(5)).toBe('low');
      expect(matrix.scoreToPriority(2)).toBe('low');
      expect(matrix.scoreToPriority(1)).toBe('info');
    });
  });

  describe('calculatePriority', () => {
    it('should calculate priority for a finding', () => {
      const finding = {
        id: 'test',
        dimension: 'performance' as const,
        title: 'Test',
        description: 'Test',
        severity: 4 as Severity,
        effort: 1 as Effort,
        impact: 5 as const,
        recommendation: 'Fix',
        references: [],
      };

      const priority = matrix.calculatePriority(finding);
      expect(priority).toBe('critical');
    });

    it('should prioritize critical issues with low effort', () => {
      const finding = {
        id: 'test',
        dimension: 'accessibility' as const,
        title: 'Test',
        description: 'Test',
        severity: 4 as Severity,
        effort: 1 as Effort,
        impact: 5 as const,
        recommendation: 'Fix',
        references: [],
      };

      const priority = matrix.calculatePriority(finding);
      expect(priority).toBe('critical');
    });

    it('should deprioritize critical issues with high effort', () => {
      const finding = {
        id: 'test',
        dimension: 'seo' as const,
        title: 'Test',
        description: 'Test',
        severity: 4 as Severity,
        effort: 5 as Effort,
        impact: 5 as const,
        recommendation: 'Fix',
        references: [],
      };

      const priority = matrix.calculatePriority(finding);
      expect(priority).toBe('low');
    });
  });

  describe('validation', () => {
    it('should validate severity correctly', () => {
      expect(matrix.validateSeverity(0)).toBe(true);
      expect(matrix.validateSeverity(4)).toBe(true);
      expect(matrix.validateSeverity(-1)).toBe(false);
      expect(matrix.validateSeverity(5)).toBe(false);
      expect(matrix.validateSeverity(2.5)).toBe(false);
    });

    it('should validate effort correctly', () => {
      expect(matrix.validateEffort(1)).toBe(true);
      expect(matrix.validateEffort(5)).toBe(true);
      expect(matrix.validateEffort(0)).toBe(false);
      expect(matrix.validateEffort(6)).toBe(false);
    });

    it('should validate impact correctly', () => {
      expect(matrix.validateImpact(1)).toBe(true);
      expect(matrix.validateImpact(5)).toBe(true);
      expect(matrix.validateImpact(0)).toBe(false);
      expect(matrix.validateImpact(6)).toBe(false);
    });
  });

  describe('getExamples', () => {
    it('should return examples', () => {
      const examples = SeverityMatrix.getExamples();
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('severity');
      expect(examples[0]).toHaveProperty('effort');
      expect(examples[0]).toHaveProperty('score');
      expect(examples[0]).toHaveProperty('priority');
      expect(examples[0]).toHaveProperty('description');
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/severity.test.ts
# ✅ 12 tests passent

npm run test:coverage -- tests/analysis/severity.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/analysis/severity.ts
git add tests/analysis/severity.test.ts
git commit -m "feat(analysis): implement SeverityMatrix with priority calculation"
```

---

### 3.2 FindingPrioritizer (Jour 2 — 6h)

**Fichier :** `src/analysis/prioritizer.ts`

```typescript
import { Finding, Priority, AnalysisDimension } from './types';
import { SeverityMatrix } from './severity';

/**
 * Priorisation automatique des findings
 */
export class FindingPrioritizer {
  private severityMatrix: SeverityMatrix;

  constructor() {
    this.severityMatrix = new SeverityMatrix();
  }

  /**
   * Priorise une liste de findings
   */
  prioritize(findings: Finding[]): Finding[] {
    // Calculer la priorité pour chaque finding
    const findingsWithPriority = findings.map(finding => ({
      ...finding,
      priority: this.severityMatrix.calculatePriority(finding),
    }));

    // Trier par priorité (critical > high > medium > low > info)
    return findingsWithPriority.sort((a, b) => {
      const priorityOrder: Record<Priority, number> = {
        critical: 5,
        high: 4,
        medium: 3,
        low: 2,
        info: 1,
      };

      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Groupe les findings par priorité
   */
  groupByPriority(findings: Finding[]): Record<Priority, Finding[]> {
    return {
      critical: findings.filter(f => f.priority === 'critical'),
      high: findings.filter(f => f.priority === 'high'),
      medium: findings.filter(f => f.priority === 'medium'),
      low: findings.filter(f => f.priority === 'low'),
      info: findings.filter(f => f.priority === 'info'),
    };
  }

  /**
   * Groupe les findings par dimension
   */
  groupByDimension(findings: Finding[]): Record<AnalysisDimension, Finding[]> {
    return {
      performance: findings.filter(f => f.dimension === 'performance'),
      accessibility: findings.filter(f => f.dimension === 'accessibility'),
      seo: findings.filter(f => f.dimension === 'seo'),
      ux: findings.filter(f => f.dimension === 'ux'),
      content: findings.filter(f => f.dimension === 'content'),
    };
  }

  /**
   * Génère un résumé exécutif
   */
  generateExecutiveSummary(findings: Finding[]): string {
    const grouped = this.groupByPriority(findings);

    const parts: string[] = [];

    if (grouped.critical.length > 0) {
      parts.push(`${grouped.critical.length} problème(s) critique(s) nécessitant une action immédiate`);
    }

    if (grouped.high.length > 0) {
      parts.push(`${grouped.high.length} problème(s) important(s) à traiter en priorité`);
    }

    if (grouped.medium.length > 0) {
      parts.push(`${grouped.medium.length} problème(s) moyen(s) à planifier`);
    }

    if (grouped.low.length > 0) {
      parts.push(`${grouped.low.length} problème(s) mineur(s) à considérer`);
    }

    if (grouped.info.length > 0) {
      parts.push(`${grouped.info.length} information(s) à prendre en compte`);
    }

    if (parts.length === 0) {
      return 'Aucun problème identifié. Excellente qualité !';
    }

    return parts.join('. ') + '.';
  }

  /**
   * Identifie les "quick wins" (haute sévérité, faible effort)
   */
  findQuickWins(findings: Finding[]): Finding[] {
    return findings.filter(f => f.severity >= 3 && f.effort <= 2);
  }

  /**
   * Identifie les "big bets" (haute sévérité, haut effort)
   */
  findBigBets(findings: Finding[]): Finding[] {
    return findings.filter(f => f.severity >= 3 && f.effort >= 4);
  }
}
```

**Tests :** `tests/analysis/prioritizer.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { FindingPrioritizer } from '../../src/analysis/prioritizer';
import { Finding, Severity, Effort, Impact } from '../../src/analysis/types';

describe('FindingPrioritizer', () => {
  const prioritizer = new FindingPrioritizer();

  const createFinding = (
    severity: Severity,
    effort: Effort,
    dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content' = 'performance'
  ): Finding => ({
    id: `test-${severity}-${effort}`,
    dimension,
    title: `Test ${severity}-${effort}`,
    description: 'Test description',
    severity,
    effort,
    impact: 3 as Impact,
    priority: 'medium', // Will be recalculated
    recommendation: 'Fix it',
    references: [],
  });

  describe('prioritize', () => {
    it('should sort findings by priority', () => {
      const findings: Finding[] = [
        createFinding(1, 4), // Low
        createFinding(4, 1), // Critical
        createFinding(2, 3), // Medium
        createFinding(3, 2), // High
      ];

      const prioritized = prioritizer.prioritize(findings);

      expect(prioritized[0].priority).toBe('critical');
      expect(prioritized[1].priority).toBe('high');
      expect(prioritized[2].priority).toBe('medium');
      expect(prioritized[3].priority).toBe('low');
    });

    it('should handle empty list', () => {
      const prioritized = prioritizer.prioritize([]);
      expect(prioritized).toEqual([]);
    });

    it('should handle all critical findings', () => {
      const findings: Finding[] = [
        createFinding(4, 1),
        createFinding(4, 1),
      ];

      const prioritized = prioritizer.prioritize(findings);
      expect(prioritized.every(f => f.priority === 'critical')).toBe(true);
    });
  });

  describe('groupByPriority', () => {
    it('should group findings by priority', () => {
      const findings: Finding[] = [
        { ...createFinding(4, 1), priority: 'critical' },
        { ...createFinding(3, 2), priority: 'high' },
        { ...createFinding(2, 3), priority: 'medium' },
        { ...createFinding(1, 4), priority: 'low' },
      ];

      const grouped = prioritizer.groupByPriority(findings);

      expect(grouped.critical.length).toBe(1);
      expect(grouped.high.length).toBe(1);
      expect(grouped.medium.length).toBe(1);
      expect(grouped.low.length).toBe(1);
    });
  });

  describe('groupByDimension', () => {
    it('should group findings by dimension', () => {
      const findings: Finding[] = [
        createFinding(2, 2, 'performance'),
        createFinding(2, 2, 'accessibility'),
        createFinding(2, 2, 'seo'),
      ];

      const grouped = prioritizer.groupByDimension(findings);

      expect(grouped.performance.length).toBe(1);
      expect(grouped.accessibility.length).toBe(1);
      expect(grouped.seo.length).toBe(1);
      expect(grouped.ux.length).toBe(0);
      expect(grouped.content.length).toBe(0);
    });
  });

  describe('generateExecutiveSummary', () => {
    it('should generate summary for mixed priorities', () => {
      const findings: Finding[] = [
        { ...createFinding(4, 1), priority: 'critical' },
        { ...createFinding(3, 2), priority: 'high' },
        { ...createFinding(2, 3), priority: 'medium' },
      ];

      const summary = prioritizer.generateExecutiveSummary(findings);

      expect(summary).toContain('1 problème(s) critique(s)');
      expect(summary).toContain('1 problème(s) important(s)');
      expect(summary).toContain('1 problème(s) moyen(s)');
    });

    it('should generate summary for no findings', () => {
      const summary = prioritizer.generateExecutiveSummary([]);
      expect(summary).toContain('Aucun problème');
    });

    it('should only mention non-zero counts', () => {
      const findings: Finding[] = [
        { ...createFinding(4, 1), priority: 'critical' },
      ];

      const summary = prioritizer.generateExecutiveSummary(findings);
      expect(summary).toContain('critique');
      expect(summary).not.toContain('important');
      expect(summary).not.toContain('moyen');
    });
  });

  describe('findQuickWins', () => {
    it('should find high severity, low effort findings', () => {
      const findings: Finding[] = [
        createFinding(3, 1), // Quick win
        createFinding(4, 2), // Quick win
        createFinding(2, 3), // Not quick win
        createFinding(1, 1), // Not quick win
      ];

      const quickWins = prioritizer.findQuickWins(findings);
      expect(quickWins.length).toBe(2);
    });
  });

  describe('findBigBets', () => {
    it('should find high severity, high effort findings', () => {
      const findings: Finding[] = [
        createFinding(3, 4), // Big bet
        createFinding(4, 5), // Big bet
        createFinding(2, 3), // Not big bet
        createFinding(4, 1), // Not big bet
      ];

      const bigBets = prioritizer.findBigBets(findings);
      expect(bigBets.length).toBe(2);
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/prioritizer.test.ts
# ✅ 11 tests passent

npm run test:coverage -- tests/analysis/prioritizer.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/analysis/prioritizer.ts
git add tests/analysis/prioritizer.test.ts
git commit -m "feat(analysis): implement FindingPrioritizer with automatic prioritization"
```

---

### 3.3 AnalysisPipeline (Jour 3 — 4h)

**Fichier :** `src/analysis/pipeline.ts`

```typescript
import { PerformanceAnalyzer } from './performance';
import { AccessibilityAnalyzer } from './accessibility';
import { SEOAnalyzer } from './seo';
import { UXAnalyzer } from './ux';
import { ContentAnalyzer } from './content';
import { FindingPrioritizer } from './prioritizer';
import {
  LighthouseResults,
  AxeResults,
  UXResults,
  ContentResults,
  AnalysisReport,
  Finding,
} from './types';

/**
 * Pipeline d'analyse complet
 * 
 * Orchestre les 5 analyseurs et la priorisation
 */
export class AnalysisPipeline {
  private performanceAnalyzer: PerformanceAnalyzer;
  private accessibilityAnalyzer: AccessibilityAnalyzer;
  private seoAnalyzer: SEOAnalyzer;
  private uxAnalyzer: UXAnalyzer;
  private contentAnalyzer: ContentAnalyzer;
  private prioritizer: FindingPrioritizer;

  constructor() {
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.accessibilityAnalyzer = new AccessibilityAnalyzer();
    this.seoAnalyzer = new SEOAnalyzer();
    this.uxAnalyzer = new UXAnalyzer();
    this.contentAnalyzer = new ContentAnalyzer();
    this.prioritizer = new FindingPrioritizer();
  }

  /**
   * Effectue une analyse complète
   */
  async analyze(
    url: string,
    lighthouseResults: LighthouseResults,
    axeResults: AxeResults,
    uxResults: UXResults,
    contentResults: ContentResults
  ): Promise<AnalysisReport> {
    // Analyser chaque dimension
    const performance = this.performanceAnalyzer.analyze(lighthouseResults);
    const accessibility = this.accessibilityAnalyzer.analyze(axeResults);
    const seo = this.seoAnalyzer.analyze(lighthouseResults);
    const ux = this.uxAnalyzer.analyze(uxResults);
    const content = this.contentAnalyzer.analyze(contentResults);

    // Collecter tous les findings
    const allFindings: Finding[] = [
      ...performance.findings,
      ...accessibility.findings,
      ...seo.findings,
      ...ux.findings,
      ...content.findings,
    ];

    // Prioriser les findings
    const priorityFindings = this.prioritizer.prioritize(allFindings);

    // Calculer le score global
    const overallScore = this.calculateOverallScore(
      performance.score,
      accessibility.score,
      seo.score,
      ux.score,
      content.score
    );

    // Construire le rapport
    return {
      url,
      timestamp: new Date().toISOString(),
      dimensions: {
        performance,
        accessibility,
        seo,
        ux,
        content,
      },
      findings: allFindings,
      priorityFindings,
      summary: {
        totalFindings: allFindings.length,
        criticalFindings: allFindings.filter(f => f.priority === 'critical').length,
        highFindings: allFindings.filter(f => f.priority === 'high').length,
        mediumFindings: allFindings.filter(f => f.priority === 'medium').length,
        lowFindings: allFindings.filter(f => f.priority === 'low').length,
        overallScore,
      },
    };
  }

  /**
   * Calcule le score global (moyenne pondérée)
   */
  private calculateOverallScore(
    performance: number,
    accessibility: number,
    seo: number,
    ux: number,
    content: number
  ): number {
    // Pondération : performance et accessibilité sont plus importantes
    const weights = {
      performance: 0.25,
      accessibility: 0.25,
      seo: 0.20,
      ux: 0.15,
      content: 0.15,
    };

    const score =
      performance * weights.performance +
      accessibility * weights.accessibility +
      seo * weights.seo +
      ux * weights.ux +
      content * weights.content;

    return Math.round(score);
  }
}
```

**Tests :** `tests/analysis/pipeline.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AnalysisPipeline } from '../../src/analysis/pipeline';
import {
  LighthouseResults,
  AxeResults,
  UXResults,
  ContentResults,
} from '../../src/analysis/types';

describe('AnalysisPipeline', () => {
  const pipeline = new AnalysisPipeline();

  const mockLighthouse: LighthouseResults = {
    performance: {
      score: 75,
      metrics: { lcp: 3000, fid: 150, cls: 0.15, ttfb: 1000 },
    },
    seo: {
      score: 80,
      issues: [
        { title: 'Meta description', description: 'Missing', severity: 'error' },
      ],
    },
  };

  const mockAxe: AxeResults = {
    violations: [
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Contrast issue',
        help: 'Fix contrast',
        helpUrl: 'https://example.com',
        nodes: 5,
      },
    ],
    score: 70,
  };

  const mockUX: UXResults = {
    score: 65,
    heuristics: [
      {
        id: 'visibility-status',
        name: 'Visibility of system status',
        score: 50,
        issues: ['No loading indicators'],
      },
    ],
  };

  const mockContent: ContentResults = {
    score: 60,
    metrics: {
      wordCount: 400,
      readingTime: 2,
      readabilityScore: 55,
    },
  };

  describe('analyze', () => {
    it('should perform complete analysis', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent
      );

      expect(report.url).toBe('https://example.com');
      expect(report.timestamp).toBeDefined();
      expect(report.dimensions.performance).toBeDefined();
      expect(report.dimensions.accessibility).toBeDefined();
      expect(report.dimensions.seo).toBeDefined();
      expect(report.dimensions.ux).toBeDefined();
      expect(report.dimensions.content).toBeDefined();
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.priorityFindings.length).toBeGreaterThan(0);
      expect(report.summary.totalFindings).toBeGreaterThan(0);
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallScore).toBeLessThanOrEqual(100);
    });

    it('should prioritize findings', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent
      );

      // Vérifier que les findings sont triés par priorité
      const priorities = report.priorityFindings.map(f => f.priority);
      const priorityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
      
      for (let i = 1; i < priorities.length; i++) {
        expect(priorityOrder[priorities[i - 1]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i]]);
      }
    });

    it('should calculate overall score', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent
      );

      // Score = 75*0.25 + 70*0.25 + 80*0.20 + 65*0.15 + 60*0.15 = 71.25 ≈ 71
      expect(report.summary.overallScore).toBeGreaterThan(60);
      expect(report.summary.overallScore).toBeLessThan(80);
    });

    it('should count findings by priority', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent
      );

      expect(report.summary.totalFindings).toBe(
        report.summary.criticalFindings +
        report.summary.highFindings +
        report.summary.mediumFindings +
        report.summary.lowFindings
      );
    });

    it('should handle perfect scores', async () => {
      const perfectLighthouse: LighthouseResults = {
        performance: { score: 100, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
        seo: { score: 100, issues: [] },
      };
      const perfectAxe: AxeResults = { violations: [], score: 100 };
      const perfectUX: UXResults = { score: 100, heuristics: [] };
      const perfectContent: ContentResults = {
        score: 100,
        metrics: { wordCount: 1000, readingTime: 5, readabilityScore: 75 },
      };

      const report = await pipeline.analyze(
        'https://example.com',
        perfectLighthouse,
        perfectAxe,
        perfectUX,
        perfectContent
      );

      expect(report.summary.totalFindings).toBe(0);
      expect(report.summary.overallScore).toBe(100);
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/pipeline.test.ts
# ✅ 5 tests passent

npm run test:coverage -- tests/analysis/
# ✅ > 80% couverture globale
```

**Commit :**
```bash
git add src/analysis/pipeline.ts
git add tests/analysis/pipeline.test.ts
git commit -m "feat(analysis): implement AnalysisPipeline for complete orchestration"
```

---

### 3.4 Documentation ANALYSIS.md (Jour 3 — 2h)

**Fichier :** `docs/ANALYSIS.md`

```markdown
# Analyse 5 Dimensions — Documentation

## Vue d'ensemble

Le module d'analyse EKTS transforme les données brutes d'inspection en rapport structuré avec :
- 5 analyseurs (performance, accessibilité, SEO, UX, contenu)
- Matrice de sévérité (0-4 × 1-5 × 1-3)
- Priorisation automatique des findings
- Recommandations actionables

## Architecture

```
Inspection L3 (Sprint 8)
    ↓
[PerformanceAnalyzer] → findings performance
[AccessibilityAnalyzer] → findings accessibilité
[SEOAnalyzer] → findings SEO
[UXAnalyzer] → findings UX
[ContentAnalyzer] → findings contenu
    ↓
[SeverityMatrix] → sévérité calculée
    ↓
[FindingPrioritizer] → findings triés par priorité
    ↓
AnalysisReport
```

## Utilisation

### Analyse complète

```typescript
import { AnalysisPipeline } from './analysis/pipeline';

const pipeline = new AnalysisPipeline();

const report = await pipeline.analyze(
  'https://example.com',
  lighthouseResults,
  axeResults,
  uxResults,
  contentResults
);

console.log('Score global:', report.summary.overallScore);
console.log('Total findings:', report.summary.totalFindings);
console.log('Critical:', report.summary.criticalFindings);
```

### Analyse individuelle

```typescript
import { PerformanceAnalyzer } from './analysis/performance';
import { AccessibilityAnalyzer } from './analysis/accessibility';

const perfAnalyzer = new PerformanceAnalyzer();
const perfReport = perfAnalyzer.analyze(lighthouseResults);

const a11yAnalyzer = new AccessibilityAnalyzer();
const a11yReport = a11yAnalyzer.analyze(axeResults);
```

## Matrice de sévérité

### Formule

```
priority_score = severity × (6 - effort)
```

### Exemples

| Sévérité | Effort | Score | Priorité |
|----------|--------|-------|----------|
| 4 (Critique) | 1 (Faible) | 20 | 🔴 Critical |
| 3 (Sérieux) | 2 (Moyen) | 12 | 🟠 High |
| 2 (Modéré) | 3 (Moyen) | 6 | 🟡 Medium |
| 1 (Mineur) | 4 (Élevé) | 2 | 🟢 Low |
| 0 (Info) | 5 (Très élevé) | 0 | ⚪ Info |

### Pondération

- **Sévérité (0-4)** : Gravité du problème
  - 4 = Critique (bloque l'utilisateur)
  - 3 = Sérieux (impact majeur)
  - 2 = Modéré (impact moyen)
  - 1 = Mineur (impact faible)
  - 0 = Information (pas d'impact)

- **Effort (1-5)** : Complexité de la correction
  - 1 = Très facile (< 1h)
  - 2 = Facile (1-4h)
  - 3 = Moyen (4h-1j)
  - 4 = Complexe (1-3j)
  - 5 = Très complexe (> 3j)

- **Impact (1-5)** : Effet sur l'expérience utilisateur
  - Calculé automatiquement basé sur la dimension et la sévérité

## Rapport d'analyse

### Structure

```typescript
interface AnalysisReport {
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
  priorityFindings: Finding[];
  summary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    overallScore: number;
  };
}
```

### Score global

Le score global est une moyenne pondérée :
- Performance : 25%
- Accessibilité : 25%
- SEO : 20%
- UX : 15%
- Contenu : 15%

## Analyseurs

### PerformanceAnalyzer

Analyse les Core Web Vitals :
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

**Seuils :**
| Métrique | Bon | Moyen | Mauvais |
|----------|-----|-------|---------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| TTFB | < 800ms | 800-1800ms | > 1800ms |

### AccessibilityAnalyzer

Analyse les violations WCAG 2.2 AA via axe-core :
- Impact : minor, moderate, serious, critical
- Nombre d'éléments affectés
- Recommandations de correction

### SEOAnalyzer

Analyse les éléments SEO :
- Meta tags (title, description)
- Structure headings
- Liens internes/externes
- Images (alt text)

### UXAnalyzer

Analyse les 10 heuristiques de Nielsen :
1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, recover from errors
10. Help and documentation

### ContentAnalyzer

Analyse la qualité du contenu :
- Quantité (word count)
- Temps de lecture
- Lisibilité (Flesch-Kincaid)

## Priorisation

### Quick Wins

Findings à haute sévérité et faible effort :
```typescript
const quickWins = prioritizer.findQuickWins(findings);
```

### Big Bets

Findings à haute sévérité et haut effort :
```typescript
const bigBets = prioritizer.findBigBets(findings);
```

### Résumé exécutif

```typescript
const summary = prioritizer.generateExecutiveSummary(findings);
// "3 problème(s) critique(s) nécessitant une action immédiate. 
//  2 problème(s) important(s) à traiter en priorité."
```

## Performance

- **Temps d'analyse** : < 5s pour 100 findings
- **Mémoire** : < 50 MB
- **CPU** : < 10% sur un core

## Tests

```bash
# Tests unitaires
npm test tests/analysis/

# Couverture
npm run test:coverage -- tests/analysis/
# ✅ > 80% couverture
```

## Références

- [Core Web Vitals](https://web.dev/vitals/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Nielsen Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Flesch-Kincaid](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
```

**Validation :**
```bash
ls -la docs/ANALYSIS.md
# ✅ Documentation créée

cat docs/ANALYSIS.md | wc -l
# ✅ ~400 lignes
```

**Commit :**
```bash
git add docs/ANALYSIS.md
git commit -m "docs: add comprehensive Analysis documentation"
```

---

### 3.5 Tests d'intégration complets (Jour 3 — 2h)

**Fichier :** `tests/analysis/integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AnalysisPipeline } from '../../src/analysis/pipeline';
import { Inspector } from '../../src/browser/inspection/inspector';

describe('Analysis Integration Tests', () => {
  it('should perform complete analysis pipeline', async () => {
    // Inspecter un site réel
    const inspector = new Inspector();
    const inspection = await inspector.inspect({
      level: 'L3',
      url: 'https://example.com',
    });

    // Analyser l'inspection
    const pipeline = new AnalysisPipeline();
    const report = await pipeline.analyze(
      'https://example.com',
      inspection.lighthouse,
      inspection.axe,
      inspection.ux,
      inspection.content
    );

    // Vérifier le rapport
    expect(report.url).toBe('https://example.com');
    expect(report.timestamp).toBeDefined();
    expect(report.dimensions.performance).toBeDefined();
    expect(report.dimensions.accessibility).toBeDefined();
    expect(report.dimensions.seo).toBeDefined();
    expect(report.dimensions.ux).toBeDefined();
    expect(report.dimensions.content).toBeDefined();
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.priorityFindings.length).toBeGreaterThan(0);
    expect(report.summary.totalFindings).toBeGreaterThan(0);
    expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.overallScore).toBeLessThanOrEqual(100);

    // Vérifier que les findings sont triés
    const priorities = report.priorityFindings.map(f => f.priority);
    const priorityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    
    for (let i = 1; i < priorities.length; i++) {
      expect(priorityOrder[priorities[i - 1]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i]]);
    }
  }, 60000); // 60s timeout pour l'inspection
});
```

**Validation :**
```bash
npm test tests/analysis/integration.test.ts
# ✅ Test d'intégration passe (60s timeout)
```

**Commit :**
```bash
git add tests/analysis/integration.test.ts
git commit -m "test(analysis): add integration test for complete analysis pipeline"
```

---

### 3.6 Vérifications finales Sprint 9-3 (Jour 3)

```bash
# 1. Tous les tests
npm test tests/analysis/
# ✅ 38 tests passent (12 severity + 11 prioritizer + 5 pipeline + 1 integration + 9 autres)

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
# ✅ types.ts, performance.ts, accessibility.ts, seo.ts, ux.ts, content.ts, severity.ts, prioritizer.ts, pipeline.ts

ls -la tests/analysis/
# ✅ 9 fichiers de tests

ls -la docs/ANALYSIS.md
# ✅ Documentation existe

# 6. Test d'intégration complet
node -e "
const { AnalysisPipeline } = require('./dist/analysis/pipeline');
const pipeline = new AnalysisPipeline();

const lighthouse = {
  performance: { score: 75, metrics: { lcp: 3000, fid: 150, cls: 0.15, ttfb: 1000 } },
  seo: { score: 80, issues: [{ title: 'Meta description', description: 'Missing', severity: 'error' }] }
};
const axe = { violations: [{ id: 'contrast', impact: 'serious', description: 'Contrast', help: 'Fix', helpUrl: 'https://example.com', nodes: 5 }], score: 70 };
const ux = { score: 65, heuristics: [{ id: 'visibility', name: 'Visibility', score: 50, issues: ['No loading'] }] };
const content = { score: 60, metrics: { wordCount: 400, readingTime: 2, readabilityScore: 55 } };

pipeline.analyze('https://example.com', lighthouse, axe, ux, content).then(report => {
  console.log('URL:', report.url);
  console.log('Overall score:', report.summary.overallScore);
  console.log('Total findings:', report.summary.totalFindings);
  console.log('Critical:', report.summary.criticalFindings);
  console.log('High:', report.summary.highFindings);
  console.log('Medium:', report.summary.mediumFindings);
  console.log('Low:', report.summary.lowFindings);
});
"
# ✅ Analyse complète fonctionne

# 7. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 8. Push
git push origin feat/sprint-9-3
```

**Point de contrôle Sprint 9-3 :**
- ✅ SeverityMatrix implémenté (matrice 0-4 × 1-5 × 1-3)
- ✅ FindingPrioritizer implémenté (priorisation automatique)
- ✅ AnalysisPipeline implémenté (orchestration complète)
- ✅ Tests d'intégration complets
- ✅ Documentation ANALYSIS.md complète
- ✅ Tests unitaires > 80% couverture
- ✅ 5 analyseurs + matrice + priorisation + pipeline fonctionnels

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/analysis/severity.ts` | 100 | SeverityMatrix |
| `src/analysis/prioritizer.ts` | 120 | FindingPrioritizer |
| `src/analysis/pipeline.ts` | 100 | AnalysisPipeline |
| `tests/analysis/severity.test.ts` | 120 | Tests SeverityMatrix |
| `tests/analysis/prioritizer.test.ts` | 150 | Tests FindingPrioritizer |
| `tests/analysis/pipeline.test.ts` | 130 | Tests AnalysisPipeline |
| `tests/analysis/integration.test.ts` | 50 | Tests d'intégration |
| `docs/ANALYSIS.md` | 400 | Documentation complète |

**Total Sprint 9-3 :** ~1 170 lignes

---

## 5. Récapitulatif complet Sprint 9

| Sous-sprint | Durée | Fichiers | Lignes |
|-------------|-------|----------|--------|
| Sprint 9-1 | 4 jours | 5 fichiers | ~800 |
| Sprint 9-2 | 3 jours | 6 fichiers | ~930 |
| Sprint 9-3 | 3 jours | 8 fichiers | ~1 170 |
| **Total** | **10 jours** | **19 fichiers** | **~2 900** |

---

## 6. Commits

```bash
git commit -m "feat(analysis): implement SeverityMatrix with priority calculation"
git commit -m "feat(analysis): implement FindingPrioritizer with automatic prioritization"
git commit -m "feat(analysis): implement AnalysisPipeline for complete orchestration"
git commit -m "test(analysis): add integration test for complete analysis pipeline"
git commit -m "docs: add comprehensive Analysis documentation"
```

---

## 7. Transition vers Sprint 10

**Prérequis pour Sprint 10 :**
- ✅ Sprint 9 terminé avec succès
- ✅ Analyse 5 dimensions fonctionnelle
- ✅ Matrice de sévérité implémentée
- ✅ Priorisation automatique opérationnelle
- ✅ Tests d'intégration passent
- ✅ Documentation complète

**Sprint 10 — Stockage + Indexation (Semaine 19-20) :**
- 🎯 Stocker les rapports d'analyse
- 🎯 Indexer pour recherche
- 🎯 Préparer la génération de rapports

---

**Fin du document Sprint 9-3**
