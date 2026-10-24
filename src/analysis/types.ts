/**
 * Types de l'analyse 5 dimensions (Sprint 9).
 *
 * Ces types décrivent le **contrat du module d'analyse** : les cinq analyseurs
 * consomment des résultats normalisés (`LighthouseResults`, `AxeResults`,
 * `UXResults`, `ContentResults`) et produisent des `Finding` gradués, que la
 * matrice de sévérité et le priorisateur orchestrent ensuite en `AnalysisReport`.
 *
 * Les entrées sont volontairement **indépendantes des types du navigateur**
 * (`src/browser/inspection/types.ts`) : l'analyse reste testable sans navigateur
 * et une évolution de Lighthouse ou d'axe-core ne touche pas ce module — seul le
 * pont entre les deux (Sprint 9-3 et au-delà) reflète les deux côtés.
 */

/**
 * Dimensions d'analyse.
 */
export type AnalysisDimension = 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';

/**
 * Niveau de sévérité (0-4).
 */
export type Severity = 0 | 1 | 2 | 3 | 4;

/**
 * Niveau d'effort de correction (1-5).
 */
export type Effort = 1 | 2 | 3 | 4 | 5;

/**
 * Niveau d'impact utilisateur (1-5).
 */
export type Impact = 1 | 2 | 3 | 4 | 5;

/**
 * Priorité calculée.
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Finding individuel.
 */
export interface Finding {
  /** Identifiant stable (`perf-lcp-critical`, `a11y-color-contrast`…). */
  id: string;
  /** Dimension d'analyse. */
  dimension: AnalysisDimension;
  /** Titre lisible. */
  title: string;
  /** Explication du constat. */
  description: string;
  /** Gravité du problème (0-4). */
  severity: Severity;
  /** Effort de correction estimé (1-5). */
  effort: Effort;
  /** Impact utilisateur estimé (1-5). */
  impact: Impact;
  /** Priorité calculée (recalculée par `SeverityMatrix`). */
  priority: Priority;
  /** Recommandation actionnable. */
  recommendation: string;
  /** Liens de référence (documentation officielle). */
  references: string[];
  /** Sélecteurs CSS des éléments concernés. */
  elements?: string[];
  /** Métrique mesurée à l'origine du constat. */
  metric?: {
    /** Nom de la métrique (`LCP`, `Word count`…). */
    name: string;
    /** Valeur mesurée. */
    value: number;
    /** Seuil franchi. */
    threshold?: number;
    /** Unité (`ms`, `mots`…). */
    unit?: string;
  };
}

/**
 * Score d'une dimension.
 */
export interface DimensionScore {
  /** Dimension analysée. */
  dimension: AnalysisDimension;
  /** Score de 0 à 100. */
  score: number;
  /** Constats de la dimension. */
  findings: Finding[];
  /** Résumé lisible. */
  summary: string;
}

/**
 * Rapport d'analyse complet.
 */
export interface AnalysisReport {
  /** URL analysée. */
  url: string;
  /** Horodatage ISO 8601. */
  timestamp: string;
  /** Scores et constats par dimension. */
  dimensions: {
    performance: DimensionScore;
    accessibility: DimensionScore;
    seo: DimensionScore;
    ux: DimensionScore;
    content: DimensionScore;
  };
  /** Tous les constats, dans l'ordre de collecte. */
  findings: Finding[];
  /** Constats triés par priorité. */
  priorityFindings: Finding[];
  /** Agrégats du rapport. */
  summary: {
    /** Nombre total de constats. */
    totalFindings: number;
    /** Constats de priorité `critical`. */
    criticalFindings: number;
    /** Constats de priorité `high`. */
    highFindings: number;
    /** Constats de priorité `medium`. */
    mediumFindings: number;
    /** Constats de priorité `low`. */
    lowFindings: number;
    /** Score global pondéré (0-100). */
    overallScore: number;
  };
}

/**
 * Résultats Lighthouse (entrée de `PerformanceAnalyzer` et `SEOAnalyzer`).
 */
export interface LighthouseResults {
  /** Performance et Core Web Vitals. */
  performance: {
    /** Score performance (0-100). */
    score: number;
    /** Métriques de laboratoire. */
    metrics: {
      /** Largest Contentful Paint (ms). */
      lcp: number;
      /**
       * First Input Delay (ms).
       *
       * Depuis le Sprint 8, la valeur provient d'INP — successeur du FID —
       * avec repli sur `max-potential-fid` (voir `extractCoreWebVitals`).
       * Le nom `fid` est conservé pour le contrat du Sprint 9 (critère C9.1).
       */
      fid: number;
      /** Cumulative Layout Shift (sans unité). */
      cls: number;
      /** Time to First Byte (ms). */
      ttfb: number;
    };
  };
  /** SEO et audits en échec. */
  seo: {
    /** Score SEO (0-100). */
    score: number;
    /** Audits SEO en échec. */
    issues: Array<{
      /** Titre de l'audit. */
      title: string;
      /** Explication. */
      description: string;
      /** Gravité déduite du score. */
      severity: 'error' | 'warning' | 'info';
    }>;
  };
}

/**
 * Résultats axe-core (entrée de `AccessibilityAnalyzer`).
 */
export interface AxeResults {
  /** Violations WCAG relevées. */
  violations: Array<{
    /** Identifiant de la règle (`color-contrast`…). */
    id: string;
    /** Gravité déclarée par axe-core. */
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    /** Description de la règle. */
    description: string;
    /** Message d'aide. */
    help: string;
    /** Documentation de la règle. */
    helpUrl: string;
    /** Nombre d'éléments affectés. */
    nodes: number;
  }>;
  /** Score d'accessibilité (0-100). */
  score: number;
}

/**
 * Résultats UX (entrée de `UXAnalyzer`).
 */
export interface UXResults {
  /** Score UX global (0-100). */
  score: number;
  /** Heuristiques de Nielsen évaluées. */
  heuristics: Array<{
    /** Identifiant stable de l'heuristique. */
    id: string;
    /** Nom de l'heuristique. */
    name: string;
    /** Score de 0 à 100. */
    score: number;
    /** Constats rattachés. */
    issues: string[];
  }>;
}

/**
 * Résultats contenu (entrée de `ContentAnalyzer`).
 */
export interface ContentResults {
  /** Score contenu global (0-100). */
  score: number;
  /** Métriques de contenu. */
  metrics: {
    /** Nombre de mots. */
    wordCount: number;
    /** Temps de lecture estimé (minutes). */
    readingTime: number;
    /** Indice de lisibilité (0-100, plus haut = plus simple). */
    readabilityScore: number;
  };
}
