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
import type { Measurement, MetricOrigin, WebVitals } from './measurement.js';

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
  /**
   * Priorité du constat.
   *
   * Dans un `AnalysisReport` publié par `AnalysisPipeline`, cette valeur est
   * **toujours** la priorité canonique issue de la matrice
   * `severity × (6 − effort)` (Sprint 19-01, C-W01) : les analyseurs peuvent
   * déclarer une priorité indicative, elle est requalifiée avant publication.
   */
  priority: Priority;
  /** Recommandation actionnable. */
  recommendation: string;
  /** Liens de référence (documentation officielle). */
  references: string[];
  /** Sélecteurs CSS des éléments concernés. */
  elements?: string[];
  /**
   * Nombre d'éléments affectés, quand l'outil l'a réellement fourni
   * (Sprint 19-03, C-W06).
   *
   * Absent = non fourni : à ne jamais présenter comme un décompte observé.
   */
  nodesCount?: number;
  /**
   * Règle d'origine du constat (`color-contrast`, `perf-lcp`…), quand la
   * source en fournit une (Sprint 20-02, C-W09).
   */
  rule?: string;
  /**
   * Version du moteur ayant produit la preuve (axe-core, Lighthouse), quand
   * elle est connue (Sprint 20-02, C-W09).
   */
  engineVersion?: string;
  /** Métrique mesurée à l'origine du constat. */
  metric?: {
    /** Nom de la métrique (`LCP`, `Word count`…). */
    name: string;
    /** Valeur mesurée. */
    value: number;
    /** Seuil franchi. */
    threshold?: number;
    /**
     * Unité (`ms`, `unitless`, `mots`…).
     *
     * Obligatoire depuis le Sprint 20-01 (W04 / C-W08) : une valeur sans unité
     * ne peut pas être interprétée ni comparée à un seuil.
     */
    unit: string;
    /**
     * Origine de la mesure, pour les métriques web (`lab`, `field`,
     * `unknown`). Absente pour les mesures qui ne sont pas des métriques web
     * (comptage de mots, par exemple).
     */
    origin?: MetricOrigin;
  };
}

/**
 * Score d'une dimension.
 */
export interface DimensionScore {
  /** Dimension analysée. */
  dimension: AnalysisDimension;
  /**
   * Score de 0 à 100, ou `null` si la dimension n'a pas pu être mesurée
   * (Sprint 19-03, C-W07). Aucune valeur de remplacement.
   */
  score: number | null;
  /**
   * État de la dimension : `unavailable` signifie « aucune mesure
   * exploitable », jamais « score nul ».
   */
  status: 'measured' | 'unavailable';
  /**
   * Raison de l'indisponibilité, obligatoire quand `status` vaut
   * `unavailable` (code stable et court).
   */
  unavailableReason?: string;
  /** Constats de la dimension. */
  findings: Finding[];
  /** Résumé lisible. */
  summary: string;
  /**
   * Mesures brutes de la dimension, quand elle en produit (performance).
   * Une mesure absente y figure en `unavailable` plutôt que d'être omise.
   */
  measurements?: Record<string, Measurement>;
}

/**
 * Score global d'un audit (Sprint 19-03, C-W07).
 *
 * Deux états seulement : une valeur réellement calculée sur les cinq
 * dimensions, ou une indisponibilité motivée. Le type interdit par
 * construction le `0` de remplacement et la renormalisation implicite.
 */
export type OverallScore = MeasuredOverallScore | UnavailableOverallScore;

/** Score global calculé : les cinq dimensions étaient mesurées. */
export interface MeasuredOverallScore {
  readonly status: 'measured';
  /** Valeur pondérée arrondie (0-100). */
  readonly value: number;
}

/** Raison d'indisponibilité du score global. */
export type OverallScoreUnavailableCode = 'dimensions-indisponibles' | 'aucune-dimension';

/** Score global indisponible, avec sa raison et les dimensions manquantes. */
export interface UnavailableOverallScore {
  readonly status: 'unavailable';
  /** Code stable de la raison. */
  readonly code: OverallScoreUnavailableCode;
  /** Message lisible en français. */
  readonly reason: string;
  /** Dimensions requises qui n'ont pas fourni de score. */
  readonly missingDimensions: AnalysisDimension[];
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
    /**
     * Constats de priorité `info` (Sprint 19-01, C-W02).
     *
     * Cinquième compteur : sans lui, la somme des catégories ne pouvait pas
     * égaler `totalFindings` et les constats `info` disparaissaient du résumé.
     */
    infoFindings: number;
    /**
     * Score global : mesuré, ou indisponible **avec sa raison** (Sprint 19-03,
     * C-W07).
     *
     * Aucune renormalisation silencieuse et aucune valeur de remplacement : si
     * une dimension requise manque, le score n'est pas calculé.
     */
    overallScore: OverallScore;
  };
}

/**
 * Résultats Lighthouse (entrée de `PerformanceAnalyzer` et `SEOAnalyzer`).
 */
export interface LighthouseResults {
  /** Performance et Core Web Vitals. */
  performance: {
    /** Score performance (0-100), ou `null` si Lighthouse ne l'a pas fourni. */
    score: number | null;
    /**
     * Métriques web de laboratoire.
     *
     * Sprint 20-01 (W04 / C-W08) : chaque métrique porte son identité, son
     * unité et son origine ; INP, FID, max-potential-fid et TBT restent
     * distincts et une métrique absente est explicitement indisponible.
     */
    metrics: WebVitals;
  };
  /** SEO et audits en échec. */
  seo: {
    /** Score SEO (0-100), ou `null` s'il n'est pas fourni. */
    score: number | null;
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
  /**
   * Violations WCAG relevées.
   *
   * **Optionnel depuis le Sprint 19-03 (C-W06)** : une propriété absente
   * signifie « données non fournies » et ne doit jamais être lue comme
   * « aucune violation ». Seul un tableau vide explicite porte ce sens.
   */
  violations?: Array<{
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
    /**
     * Nombre d'éléments affectés.
     *
     * Optionnel : absent = non fourni par l'outil, à ne pas présenter comme
     * un décompte observé.
     */
    nodes?: number;
    /**
     * Sélecteurs fournis par axe-core (Sprint 20-02, C-W09).
     *
     * Absent = non fourni ; une liste vide n'est jamais fabriquée.
     */
    targets?: readonly string[];
  }>;
  /** Score d'accessibilité (0-100), ou `null` s'il n'est pas fourni. */
  score: number | null;
  /** Version du moteur axe-core, quand elle est fournie (C-W09). */
  engineVersion?: string;
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
