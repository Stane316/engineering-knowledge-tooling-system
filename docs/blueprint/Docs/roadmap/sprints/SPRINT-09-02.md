# Sprint 9-2 — Analyse SEO + UX + Contenu (Semaine 17-18)

**Durée :** 3 jours  
**Objectif :** Implémenter SEOAnalyzer, UXAnalyzer et ContentAnalyzer  
**Dépendance :** Sprint 9-1 (Performance + Accessibilité) ✅
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Contexte

Le **Sprint 9-1** a implémenté :
- ✅ PerformanceAnalyzer (LCP, FID, CLS, TTFB)
- ✅ AccessibilityAnalyzer (WCAG 2.2 AA)
- ✅ Types Analysis (Finding, DimensionScore, etc.)

Le **Sprint 9-2** complète l'analyse avec :
- 🎯 SEOAnalyzer : meta tags, structure headings, liens
- 🎯 UXAnalyzer : heuristiques Nielsen
- 🎯 ContentAnalyzer : qualité contenu, lisibilité

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── analysis/
│   │   ├── types.ts                    ✅ (Sprint 9-1)
│   │   ├── performance.ts              ✅ (Sprint 9-1)
│   │   ├── accessibility.ts            ✅ (Sprint 9-1)
│   │   ├── seo.ts                      (à créer)
│   │   ├── ux.ts                       (à créer)
│   │   └── content.ts                  (à créer)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 SEOAnalyzer (Jour 1 — 6h)

**Fichier :** `src/analysis/seo.ts`

```typescript
import { Finding, DimensionScore, LighthouseResults, Severity, Effort, Impact } from './types';

/**
 * Mapping sévérité Lighthouse → sévérité EKTS
 */
const SEVERITY_MAP: Record<string, Severity> = {
  error: 3,
  warning: 2,
  info: 1,
};

/**
 * Analyseur SEO
 */
export class SEOAnalyzer {
  /**
   * Analyse les résultats Lighthouse SEO
   */
  analyze(results: LighthouseResults): DimensionScore {
    const findings: Finding[] = [];

    // Analyser les issues SEO de Lighthouse
    for (const issue of results.seo.issues) {
      findings.push(this.analyzeIssue(issue));
    }

    // Calculer le score
    const score = results.seo.score;

    // Générer le résumé
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'seo',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse une issue SEO individuelle
   */
  private analyzeIssue(issue: LighthouseResults['seo']['issues'][0]): Finding {
    const severity = SEVERITY_MAP[issue.severity] || 2;
    const effort = this.estimateEffort(issue);
    const impact = this.calculateImpact(severity);
    const priority = this.calculatePriority(severity, effort, impact);

    return {
      id: `seo-${issue.title.toLowerCase().replace(/\s+/g, '-')}`,
      dimension: 'seo',
      title: issue.title,
      description: issue.description,
      severity,
      effort,
      impact,
      priority,
      recommendation: this.generateRecommendation(issue),
      references: ['https://developers.google.com/search/docs'],
    };
  }

  /**
   * Estime l'effort de correction
   */
  private estimateEffort(issue: LighthouseResults['seo']['issues'][0]): Effort {
    const title = issue.title.toLowerCase();

    // Effort basé sur le type d'issue
    if (title.includes('meta') || title.includes('title')) {
      return 1; // Facile : modifier un tag
    } else if (title.includes('heading') || title.includes('structure')) {
      return 2; // Moyen : restructurer le contenu
    } else if (title.includes('link') || title.includes('image')) {
      return 3; // Complexe : modifier plusieurs éléments
    } else {
      return 2; // Défaut
    }
  }

  /**
   * Calcule l'impact basé sur la sévérité
   */
  private calculateImpact(severity: Severity): Impact {
    // Impact = sévérité + 1 (SEO a un impact élevé sur le trafic)
    return Math.min(5, severity + 1) as Impact;
  }

  /**
   * Calcule la priorité
   */
  private calculatePriority(severity: Severity, effort: Effort, impact: Impact): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const score = severity * (6 - effort);

    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 2) return 'low';
    return 'info';
  }

  /**
   * Génère une recommandation
   */
  private generateRecommendation(issue: LighthouseResults['seo']['issues'][0]): string {
    const title = issue.title.toLowerCase();

    if (title.includes('meta description')) {
      return 'Ajouter ou améliorer la meta description (150-160 caractères, mots-clés pertinents).';
    } else if (title.includes('title')) {
      return 'Améliorer le titre de la page (50-60 caractères, mots-clés principaux au début).';
    } else if (title.includes('heading')) {
      return 'Structurer correctement les headings (un seul h1, hiérarchie logique h1-h6).';
    } else if (title.includes('link')) {
      return 'Améliorer les liens (texte descriptif, liens internes, éviter les liens cassés).';
    } else if (title.includes('image')) {
      return 'Optimiser les images (attribut alt descriptif, format approprié, compression).';
    } else {
      return `Corriger le problème : ${issue.description}`;
    }
  }

  /**
   * Génère un résumé de l'analyse
   */
  private generateSummary(findings: Finding[], score: number): string {
    const errorCount = findings.filter(f => f.severity === 3).length;
    const warningCount = findings.filter(f => f.severity === 2).length;
    const infoCount = findings.filter(f => f.severity === 1).length;

    let summary = `Score SEO : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Excellente optimisation SEO !';
    } else {
      summary += `${findings.length} problème(s) SEO identifié(s) : `;
      if (errorCount > 0) summary += `${errorCount} erreur(s), `;
      if (warningCount > 0) summary += `${warningCount} avertissement(s), `;
      if (infoCount > 0) summary += `${infoCount} information(s).`;
    }

    return summary;
  }
}
```

**Tests :** `tests/analysis/seo.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { SEOAnalyzer } from '../../src/analysis/seo';
import { LighthouseResults } from '../../src/analysis/types';

describe('SEOAnalyzer', () => {
  const analyzer = new SEOAnalyzer();

  describe('analyze', () => {
    it('should analyze perfect SEO', () => {
      const results: LighthouseResults = {
        performance: { score: 90, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
        seo: {
          score: 100,
          issues: [],
        },
      };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('seo');
      expect(result.score).toBe(100);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Excellente');
    });

    it('should analyze meta description issue', () => {
      const results: LighthouseResults = {
        performance: { score: 90, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
        seo: {
          score: 70,
          issues: [
            {
              title: 'Meta description',
              description: 'Document does not have a meta description',
              severity: 'error',
            },
          ],
        },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].id).toBe('seo-meta-description');
      expect(result.findings[0].severity).toBe(3);
      expect(result.findings[0].recommendation).toContain('meta description');
    });

    it('should analyze title issue', () => {
      const results: LighthouseResults = {
        performance: { score: 90, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
        seo: {
          score: 80,
          issues: [
            {
              title: 'Document title',
              description: 'Document does not have a title element',
              severity: 'error',
            },
          ],
        },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].id).toBe('seo-document-title');
      expect(result.findings[0].severity).toBe(3);
    });

    it('should analyze heading issue', () => {
      const results: LighthouseResults = {
        performance: { score: 90, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
        seo: {
          score: 85,
          issues: [
            {
              title: 'Heading order',
              description: 'Heading elements are not in a sequentially-descending order',
              severity: 'warning',
            },
          ],
        },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].severity).toBe(2);
      expect(result.findings[0].effort).toBe(2);
    });

    it('should analyze multiple issues', () => {
      const results: LighthouseResults = {
        performance: { score: 90, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
        seo: {
          score: 50,
          issues: [
            {
              title: 'Meta description',
              description: 'Missing meta description',
              severity: 'error',
            },
            {
              title: 'Heading order',
              description: 'Invalid heading order',
              severity: 'warning',
            },
          ],
        },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(2);
      expect(result.summary).toContain('2 problème(s)');
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/seo.test.ts
# ✅ 5 tests passent

npm run test:coverage -- tests/analysis/seo.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/analysis/seo.ts
git add tests/analysis/seo.test.ts
git commit -m "feat(analysis): implement SEOAnalyzer with meta tags and structure analysis"
```

---

### 3.2 UXAnalyzer (Jour 2 — 6h)

**Fichier :** `src/analysis/ux.ts`

```typescript
import { Finding, DimensionScore, UXResults, Severity, Effort, Impact } from './types';

/**
 * Analyseur UX (heuristiques de Nielsen)
 */
export class UXAnalyzer {
  /**
   * Analyse les résultats UX
   */
  analyze(results: UXResults): DimensionScore {
    const findings: Finding[] = [];

    // Analyser chaque heuristique
    for (const heuristic of results.heuristics) {
      if (heuristic.score < 100) {
        findings.push(this.analyzeHeuristic(heuristic));
      }
    }

    // Calculer le score
    const score = results.score;

    // Générer le résumé
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'ux',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse une heuristique individuelle
   */
  private analyzeHeuristic(heuristic: UXResults['heuristics'][0]): Finding {
    const severity = this.calculateSeverity(heuristic.score);
    const effort = this.estimateEffort(heuristic);
    const impact = this.calculateImpact(severity);
    const priority = this.calculatePriority(severity, effort, impact);

    return {
      id: `ux-${heuristic.id}`,
      dimension: 'ux',
      title: heuristic.name,
      description: heuristic.issues.join('. '),
      severity,
      effort,
      impact,
      priority,
      recommendation: this.generateRecommendation(heuristic),
      references: ['https://www.nngroup.com/articles/ten-usability-heuristics/'],
    };
  }

  /**
   * Calcule la sévérité basée sur le score
   */
  private calculateSeverity(score: number): Severity {
    if (score >= 80) return 1; // Mineur
    if (score >= 60) return 2; // Modéré
    if (score >= 40) return 3; // Sérieux
    return 4; // Critique
  }

  /**
   * Estime l'effort de correction
   */
  private estimateEffort(heuristic: UXResults['heuristics'][0]): Effort {
    const issueCount = heuristic.issues.length;

    if (issueCount === 0) return 1;
    if (issueCount <= 2) return 2;
    if (issueCount <= 5) return 3;
    return 4;
  }

  /**
   * Calcule l'impact basé sur la sévérité
   */
  private calculateImpact(severity: Severity): Impact {
    // UX a un impact élevé sur l'expérience utilisateur
    return Math.min(5, severity + 1) as Impact;
  }

  /**
   * Calcule la priorité
   */
  private calculatePriority(severity: Severity, effort: Effort, impact: Impact): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const score = severity * (6 - effort);

    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 2) return 'low';
    return 'info';
  }

  /**
   * Génère une recommandation basée sur l'heuristique
   */
  private generateRecommendation(heuristic: UXResults['heuristics'][0]): string {
    const recommendations: Record<string, string> = {
      'visibility-status': 'Ajouter des indicateurs de progression et des feedbacks visuels pour informer l\'utilisateur de l\'état du système.',
      'real-world': 'Utiliser un langage naturel et des concepts familiers aux utilisateurs. Éviter le jargon technique.',
      'user-control': 'Permettre aux utilisateurs d\'annuler et refaire les actions. Fournir des sorties d\'urgence claires.',
      'consistency': 'Maintenir la cohérence dans l\'interface et suivre les conventions de la plateforme.',
      'error-prevention': 'Concevoir pour prévenir les erreurs : validations, confirmations, suggestions.',
      'recognition': 'Rendre les objets et actions visibles. Éviter de demander à l\'utilisateur de mémoriser des informations.',
      'flexibility': 'Fournir des raccourcis pour les utilisateurs experts. Adapter l\'interface aux différents niveaux d\'expérience.',
      'aesthetic': 'Minimiser les éléments visuels non essentiels. Mettre en avant le contenu important.',
      'error-recovery': 'Fournir des messages d\'erreur clairs et des solutions pour récupérer des erreurs.',
      'help': 'Fournir une documentation et une aide contextuelle facile à trouver et à comprendre.',
    };

    return recommendations[heuristic.id] || `Améliorer l'heuristique : ${heuristic.name}`;
  }

  /**
   * Génère un résumé de l'analyse
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter(f => f.severity === 4).length;
    const seriousCount = findings.filter(f => f.severity === 3).length;
    const moderateCount = findings.filter(f => f.severity === 2).length;

    let summary = `Score UX : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Excellente expérience utilisateur !';
    } else {
      summary += `${findings.length} problème(s) UX identifié(s) : `;
      if (criticalCount > 0) summary += `${criticalCount} critique(s), `;
      if (seriousCount > 0) summary += `${seriousCount} sérieux, `;
      if (moderateCount > 0) summary += `${moderateCount} modéré(s).`;
    }

    return summary;
  }
}
```

**Tests :** `tests/analysis/ux.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { UXAnalyzer } from '../../src/analysis/ux';
import { UXResults } from '../../src/analysis/types';

describe('UXAnalyzer', () => {
  const analyzer = new UXAnalyzer();

  describe('analyze', () => {
    it('should analyze perfect UX', () => {
      const results: UXResults = {
        score: 100,
        heuristics: [
          { id: 'visibility-status', name: 'Visibility of system status', score: 100, issues: [] },
          { id: 'real-world', name: 'Match between system and real world', score: 100, issues: [] },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('ux');
      expect(result.score).toBe(100);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Excellente');
    });

    it('should analyze heuristic with issues', () => {
      const results: UXResults = {
        score: 70,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 50,
            issues: ['No loading indicators', 'No progress feedback'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].id).toBe('ux-visibility-status');
      expect(result.findings[0].severity).toBeGreaterThanOrEqual(2);
      expect(result.findings[0].recommendation).toContain('indicateurs');
    });

    it('should calculate severity based on score', () => {
      const results: UXResults = {
        score: 30,
        heuristics: [
          {
            id: 'error-prevention',
            name: 'Error prevention',
            score: 20, // Critique (< 40)
            issues: ['No validation', 'No confirmation'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings[0].severity).toBe(4); // Critique
    });

    it('should estimate effort based on issue count', () => {
      const results: UXResults = {
        score: 60,
        heuristics: [
          {
            id: 'consistency',
            name: 'Consistency and standards',
            score: 60,
            issues: ['Issue 1', 'Issue 2', 'Issue 3', 'Issue 4', 'Issue 5', 'Issue 6'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings[0].effort).toBe(4); // > 5 issues
    });

    it('should analyze multiple heuristics', () => {
      const results: UXResults = {
        score: 50,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 50,
            issues: ['No loading indicators'],
          },
          {
            id: 'user-control',
            name: 'User control and freedom',
            score: 60,
            issues: ['No undo'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(2);
      expect(result.summary).toContain('2 problème(s)');
    });

    it('should skip heuristics with perfect score', () => {
      const results: UXResults = {
        score: 90,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 100,
            issues: [],
          },
          {
            id: 'error-prevention',
            name: 'Error prevention',
            score: 80,
            issues: ['Minor issue'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0].id).toBe('ux-error-prevention');
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/ux.test.ts
# ✅ 6 tests passent

npm run test:coverage -- tests/analysis/ux.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/analysis/ux.ts
git add tests/analysis/ux.test.ts
git commit -m "feat(analysis): implement UXAnalyzer with Nielsen heuristics analysis"
```

---

### 3.3 ContentAnalyzer (Jour 3 — 6h)

**Fichier :** `src/analysis/content.ts`

```typescript
import { Finding, DimensionScore, ContentResults, Severity, Effort, Impact } from './types';

/**
 * Seuils de qualité de contenu
 */
const CONTENT_THRESHOLDS = {
  wordCount: {
    minimum: 300,
    good: 600,
    excellent: 1000,
  },
  readabilityScore: {
    poor: 30,
    average: 50,
    good: 60,
    excellent: 70,
  },
};

/**
 * Analyseur de contenu
 */
export class ContentAnalyzer {
  /**
   * Analyse les résultats de contenu
   */
  analyze(results: ContentResults): DimensionScore {
    const findings: Finding[] = [];

    // Analyser la quantité de contenu
    findings.push(...this.analyzeWordCount(results.metrics.wordCount));

    // Analyser la lisibilité
    findings.push(...this.analyzeReadability(results.metrics.readabilityScore));

    // Analyser le temps de lecture
    findings.push(...this.analyzeReadingTime(results.metrics.readingTime));

    // Calculer le score
    const score = results.score;

    // Générer le résumé
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'content',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse la quantité de contenu
   */
  private analyzeWordCount(wordCount: number): Finding[] {
    const findings: Finding[] = [];
    const { minimum, good } = CONTENT_THRESHOLDS.wordCount;

    if (wordCount < minimum) {
      findings.push({
        id: 'content-word-count-low',
        dimension: 'content',
        title: 'Contenu insuffisant',
        description: `Le contenu contient seulement ${wordCount} mots (minimum recommandé : ${minimum} mots).`,
        severity: 3,
        effort: 3,
        impact: 4,
        priority: 'high',
        recommendation: 'Enrichir le contenu avec des informations pertinentes, des exemples et des détails. Viser au moins 600 mots pour un article de blog.',
        references: ['https://backlinko.com/hubspot/blog-word-count'],
        metric: {
          name: 'Word count',
          value: wordCount,
          threshold: minimum,
          unit: 'mots',
        },
      });
    } else if (wordCount < good) {
      findings.push({
        id: 'content-word-count-medium',
        dimension: 'content',
        title: 'Contenu à enrichir',
        description: `Le contenu contient ${wordCount} mots. Pour une meilleure profondeur, viser ${good}+ mots.`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation: 'Ajouter plus de détails, d\'exemples et de contexte pour enrichir le contenu.',
        references: ['https://backlinko.com/hubspot/blog-word-count'],
        metric: {
          name: 'Word count',
          value: wordCount,
          threshold: good,
          unit: 'mots',
        },
      });
    }

    return findings;
  }

  /**
   * Analyse la lisibilité
   */
  private analyzeReadability(readabilityScore: number): Finding[] {
    const findings: Finding[] = [];
    const { poor, average, good } = CONTENT_THRESHOLDS.readabilityScore;

    if (readabilityScore < poor) {
      findings.push({
        id: 'content-readability-poor',
        dimension: 'content',
        title: 'Lisibilité très faible',
        description: `Le score de lisibilité est de ${readabilityScore.toFixed(1)} (très difficile à lire).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation: 'Réécrire le contenu pour le simplifier : phrases courtes, mots simples, structure claire. Utiliser des listes et des sous-titres.',
        references: ['https://readable.com/readability/flesch-reading-ease/'],
        metric: {
          name: 'Readability score',
          value: readabilityScore,
          threshold: poor,
        },
      });
    } else if (readabilityScore < average) {
      findings.push({
        id: 'content-readability-low',
        dimension: 'content',
        title: 'Lisibilité faible',
        description: `Le score de lisibilité est de ${readabilityScore.toFixed(1)} (difficile à lire).`,
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation: 'Simplifier le contenu : raccourcir les phrases, utiliser des mots plus simples, ajouter des transitions.',
        references: ['https://readable.com/readability/flesch-reading-ease/'],
        metric: {
          name: 'Readability score',
          value: readabilityScore,
          threshold: average,
        },
      });
    } else if (readabilityScore < good) {
      findings.push({
        id: 'content-readability-medium',
        dimension: 'content',
        title: 'Lisibilité moyenne',
        description: `Le score de lisibilité est de ${readabilityScore.toFixed(1)} (acceptable mais peut être amélioré).`,
        severity: 2,
        effort: 1,
        impact: 3,
        priority: 'medium',
        recommendation: 'Améliorer légèrement la lisibilité : varier la longueur des phrases, utiliser des mots plus familiers.',
        references: ['https://readable.com/readability/flesch-reading-ease/'],
        metric: {
          name: 'Readability score',
          value: readabilityScore,
          threshold: good,
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le temps de lecture
   */
  private analyzeReadingTime(readingTime: number): Finding[] {
    const findings: Finding[] = [];

    if (readingTime < 1) {
      findings.push({
        id: 'content-reading-time-short',
        dimension: 'content',
        title: 'Contenu trop court',
        description: `Le temps de lecture estimé est de ${readingTime.toFixed(1)} minute(s). Le contenu est trop superficiel.`,
        severity: 2,
        effort: 3,
        impact: 3,
        priority: 'medium',
        recommendation: 'Développer le contenu pour atteindre au moins 3-5 minutes de lecture. Ajouter de la profondeur et des exemples.',
        references: ['https://help.medium.com/hc/en-us/articles/360002424654-Read-time'],
        metric: {
          name: 'Reading time',
          value: readingTime,
          threshold: 3,
          unit: 'min',
        },
      });
    } else if (readingTime > 15) {
      findings.push({
        id: 'content-reading-time-long',
        dimension: 'content',
        title: 'Contenu très long',
        description: `Le temps de lecture estimé est de ${readingTime.toFixed(1)} minutes. Le contenu peut être décourageant.`,
        severity: 1,
        effort: 2,
        impact: 2,
        priority: 'low',
        recommendation: 'Envisager de diviser le contenu en plusieurs parties ou d\'ajouter une table des matières pour faciliter la navigation.',
        references: ['https://help.medium.com/hc/en-us/articles/360002424654-Read-time'],
        metric: {
          name: 'Reading time',
          value: readingTime,
          threshold: 15,
          unit: 'min',
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

    let summary = `Score contenu : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Excellente qualité de contenu !';
    } else {
      summary += `${findings.length} problème(s) de contenu identifié(s) : `;
      if (criticalCount > 0) summary += `${criticalCount} critique(s), `;
      if (highCount > 0) summary += `${highCount} important(s), `;
      if (mediumCount > 0) summary += `${mediumCount} moyen(s).`;
    }

    return summary;
  }
}
```

**Tests :** `tests/analysis/content.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ContentAnalyzer } from '../../src/analysis/content';
import { ContentResults } from '../../src/analysis/types';

describe('ContentAnalyzer', () => {
  const analyzer = new ContentAnalyzer();

  describe('analyze', () => {
    it('should analyze excellent content', () => {
      const results: ContentResults = {
        score: 95,
        metrics: {
          wordCount: 1200,
          readingTime: 6,
          readabilityScore: 75,
        },
      };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('content');
      expect(result.score).toBe(95);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Excellente');
    });

    it('should detect low word count', () => {
      const results: ContentResults = {
        score: 40,
        metrics: {
          wordCount: 150, // < 300 (minimum)
          readingTime: 1,
          readabilityScore: 65,
        },
      };

      const result = analyzer.analyze(results);

      const wordCountFinding = result.findings.find(f => f.id === 'content-word-count-low');
      expect(wordCountFinding).toBeDefined();
      expect(wordCountFinding?.severity).toBe(3);
    });

    it('should detect poor readability', () => {
      const results: ContentResults = {
        score: 30,
        metrics: {
          wordCount: 800,
          readingTime: 4,
          readabilityScore: 25, // < 30 (poor)
        },
      };

      const result = analyzer.analyze(results);

      const readabilityFinding = result.findings.find(f => f.id === 'content-readability-poor');
      expect(readabilityFinding).toBeDefined();
      expect(readabilityFinding?.severity).toBe(4);
    });

    it('should detect short reading time', () => {
      const results: ContentResults = {
        score: 50,
        metrics: {
          wordCount: 200,
          readingTime: 0.5, // < 1 min
          readabilityScore: 60,
        },
      };

      const result = analyzer.analyze(results);

      const readingTimeFinding = result.findings.find(f => f.id === 'content-reading-time-short');
      expect(readingTimeFinding).toBeDefined();
      expect(readingTimeFinding?.severity).toBe(2);
    });

    it('should detect long reading time', () => {
      const results: ContentResults = {
        score: 70,
        metrics: {
          wordCount: 3000,
          readingTime: 20, // > 15 min
          readabilityScore: 65,
        },
      };

      const result = analyzer.analyze(results);

      const readingTimeFinding = result.findings.find(f => f.id === 'content-reading-time-long');
      expect(readingTimeFinding).toBeDefined();
      expect(readingTimeFinding?.severity).toBe(1);
    });

    it('should analyze multiple issues', () => {
      const results: ContentResults = {
        score: 20,
        metrics: {
          wordCount: 100, // Low
          readingTime: 0.5, // Short
          readabilityScore: 20, // Poor
        },
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBeGreaterThanOrEqual(3);
      expect(result.summary).toContain('problème(s)');
    });
  });
});
```

**Validation :**
```bash
npm test tests/analysis/content.test.ts
# ✅ 6 tests passent

npm run test:coverage -- tests/analysis/content.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/analysis/content.ts
git add tests/analysis/content.test.ts
git commit -m "feat(analysis): implement ContentAnalyzer with quality and readability analysis"
```

---

### 3.4 Vérifications finales Sprint 9-2 (Jour 3)

```bash
# 1. Tests unitaires
npm test tests/analysis/
# ✅ 24 tests passent (7 perf + 7 a11y + 5 SEO + 6 UX + 6 content - 7 déjà comptés)

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
# ✅ types.ts, performance.ts, accessibility.ts, seo.ts, ux.ts, content.ts

# 6. Test manuel SEOAnalyzer
node -e "
const { SEOAnalyzer } = require('./dist/analysis/seo');
const analyzer = new SEOAnalyzer();
const results = {
  performance: { score: 90, metrics: { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 } },
  seo: { score: 70, issues: [{ title: 'Meta description', description: 'Missing', severity: 'error' }] }
};
const report = analyzer.analyze(results);
console.log('Score:', report.score);
console.log('Findings:', report.findings.length);
console.log('Summary:', report.summary);
"
# ✅ Analyse SEO fonctionne

# 7. Test manuel UXAnalyzer
node -e "
const { UXAnalyzer } = require('./dist/analysis/ux');
const analyzer = new UXAnalyzer();
const results = {
  score: 70,
  heuristics: [{ id: 'visibility-status', name: 'Visibility', score: 50, issues: ['No loading'] }]
};
const report = analyzer.analyze(results);
console.log('Score:', report.score);
console.log('Findings:', report.findings.length);
console.log('Summary:', report.summary);
"
# ✅ Analyse UX fonctionne

# 8. Test manuel ContentAnalyzer
node -e "
const { ContentAnalyzer } = require('./dist/analysis/content');
const analyzer = new ContentAnalyzer();
const results = {
  score: 40,
  metrics: { wordCount: 150, readingTime: 0.5, readabilityScore: 25 }
};
const report = analyzer.analyze(results);
console.log('Score:', report.score);
console.log('Findings:', report.findings.length);
console.log('Summary:', report.summary);
"
# ✅ Analyse contenu fonctionne

# 9. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 10. Push
git push origin feat/sprint-9-2
```

**Point de contrôle Sprint 9-2 :**
- ✅ SEOAnalyzer implémenté (meta tags, structure, liens)
- ✅ UXAnalyzer implémenté (heuristiques Nielsen)
- ✅ ContentAnalyzer implémenté (qualité, lisibilité)
- ✅ Recommandations générées pour chaque dimension
- ✅ Tests unitaires > 80% couverture
- ✅ 5 analyseurs fonctionnels (performance, accessibilité, SEO, UX, contenu)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/analysis/seo.ts` | 180 | SEOAnalyzer |
| `src/analysis/ux.ts` | 160 | UXAnalyzer |
| `src/analysis/content.ts` | 200 | ContentAnalyzer |
| `tests/analysis/seo.test.ts` | 120 | Tests SEOAnalyzer |
| `tests/analysis/ux.test.ts` | 130 | Tests UXAnalyzer |
| `tests/analysis/content.test.ts` | 140 | Tests ContentAnalyzer |

**Total Sprint 9-2 :** ~930 lignes

---

## 5. Commits

```bash
git commit -m "feat(analysis): implement SEOAnalyzer with meta tags and structure analysis"
git commit -m "feat(analysis): implement UXAnalyzer with Nielsen heuristics analysis"
git commit -m "feat(analysis): implement ContentAnalyzer with quality and readability analysis"
```

---

## 6. Transition vers Sprint 9-3

**Prérequis pour Sprint 9-3 :**
- ✅ Sprint 9-2 terminé avec succès
- ✅ 5 analyseurs fonctionnels
- ✅ Types Analysis définis
- ✅ Tests > 80% couverture

**Sprint 9-3 va implémenter :**
- 🎯 SeverityMatrix (matrice de sévérité)
- 🎯 FindingPrioritizer (priorisation automatique)
- 🎯 AnalysisPipeline (orchestration complète)
- 🎯 Tests d'intégration complets
- 🎯 Documentation ANALYSIS.md

---

**Fin du document Sprint 9-2**
