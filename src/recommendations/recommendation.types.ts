import type { AnalysisDimension, Priority, Severity } from '../analysis/types.js';

/**
 * Types du moteur de recommandations contextuelles (Sprint 16).
 *
 * Le moteur combine deux approches (ADR-036) :
 * 1. Règles explicites : table `recommendation_rules`
 *    (dimension, sévérité, pattern) → recommandation ;
 * 2. Scoring statistique : fréquence des findings × impact × contexte projet.
 *
 * Les recommandations sont personnalisées selon le contexte du projet
 * (historique, tendances, bonnes practices) et triées par score de pertinence
 * décroissant (C16.4, C16.5).
 *
 * **Écart P3 (spec vs code)** : l'interface parent (`SPRINT-16.md` §2.2)
 * annonçait des méthodes `Promise` — comme au Sprint 15, les méthodes des
 * repositories, du contexte et du moteur sont **synchrones** (better-sqlite3) ;
 * la synchro est la convention du dépôt et un `await` sur une valeur
 * synchrone reste compatible pour les appelants.
 */

/**
 * Règle de recommandation explicite (table `recommendation_rules`).
 */
export interface RecommendationRule {
  /** Identifiant UUID. */
  id: string;
  /** Nom lisible de la règle. */
  name: string;
  /** Description de la règle. */
  description: string;
  /** Dimension concernée (ou `general` pour toutes). */
  dimension: AnalysisDimension | 'general';
  /** Sévérité minimum du finding pour activer la règle (0-4). */
  severityThreshold: Severity;
  /** Pattern de finding (titre normalisé, sous-chaîne ou mots-clés). */
  pattern: string;
  /** Titre de la recommandation générée. */
  recommendationTitle: string;
  /** Description de la recommandation générée. */
  recommendationDescription: string;
  /** Effort estimé (1-5). */
  effort: number;
  /** Impact estimé (1-5). */
  impact: number;
  /** Priorité de la recommandation. */
  priority: Priority;
  /** Règle activée ou non. */
  isActive: boolean;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de dernière mise à jour (ISO 8601). */
  updatedAt: string;
}

/**
 * Entrée pour créer une règle de recommandation
 * (`effort`/`impact`/`priority` : défauts 3 / 3 / `medium`).
 */
export interface CreateRecommendationRuleInput {
  name: string;
  description: string;
  dimension: AnalysisDimension | 'general';
  severityThreshold: Severity;
  pattern: string;
  recommendationTitle: string;
  recommendationDescription: string;
  effort?: number;
  impact?: number;
  priority?: Priority;
}

/**
 * Entrée pour mettre à jour une règle (champs optionnels partiels).
 */
export interface UpdateRecommendationRuleInput {
  name?: string;
  description?: string;
  dimension?: AnalysisDimension | 'general';
  severityThreshold?: Severity;
  pattern?: string;
  recommendationTitle?: string;
  recommendationDescription?: string;
  effort?: number;
  impact?: number;
  priority?: Priority;
  isActive?: boolean;
}

/**
 * Filtres pour lister les règles.
 */
export interface RecommendationRuleFilters {
  /** Filtre par dimension. */
  dimension?: AnalysisDimension | 'general';
  /** Filtre par statut actif. */
  isActive?: boolean;
  /** Filtre par priorité. */
  priority?: Priority;
  /** Nombre maximum de résultats (défaut repository : 100). */
  limit?: number;
  /** Décalage pour la pagination (défaut : 0). */
  offset?: number;
}

/**
 * Recommandation générée pour un projet
 * (table `generated_recommendations`).
 */
export interface Recommendation {
  /** Identifiant UUID. */
  id: string;
  /** ID du projet concerné. */
  projectId: string;
  /** ID de la règle déclencheuse (`null` si scoring statistique). */
  ruleId: string | null;
  /** Titre du finding déclencheur (si applicable). */
  findingTitle: string | null;
  /** Titre de la recommandation. */
  recommendationTitle: string;
  /** Description actionnable détaillée. */
  recommendationDescription: string;
  /** Dimension concernée. */
  dimension: AnalysisDimension | 'general';
  /** Score de pertinence (0-1, 1 = très pertinent). */
  relevanceScore: number;
  /** Effort estimé (1-5). */
  effort: number;
  /** Impact estimé (1-5). */
  impact: number;
  /** Priorité calculée. */
  priority: Priority;
  /** Date de génération (ISO 8601). */
  generatedAt: string;
}

/**
 * Rapport de recommandations pour un projet (C16.8).
 */
export interface RecommendationReport {
  /** ID du projet. */
  projectId: string;
  /** Nombre de recommandations générées. */
  totalRecommendations: number;
  /** Nombre de recommandations issues de règles explicites. */
  rulesApplied: number;
  /** Nombre de recommandations issues du scoring statistique. */
  statisticalRecommendations: number;
  /** Durée de génération (ms). */
  durationMs: number;
  /** Recommandations triées par pertinence décroissante. */
  recommendations: Recommendation[];
}

/**
 * Contexte d'un projet pour le scoring (collecté par
 * `RecommendationContext.buildContext`).
 */
export interface ProjectContext {
  /** ID du projet. */
  projectId: string;
  /** Nombre total d'audits. */
  totalAudits: number;
  /** Findings du dernier audit. */
  currentFindings: Array<{
    title: string;
    dimension: AnalysisDimension;
    severity: Severity;
    priority: Priority;
  }>;
  /** Fréquence des findings dans l'historique (titre normalisé → count). */
  findingFrequencies: Map<string, number>;
  /** Tendance par dimension (comparaison des 2 derniers audits, seuil ±5). */
  dimensionTrends: Map<AnalysisDimension, 'improving' | 'declining' | 'stable'>;
  /** Taux de résolution par finding (titre normalisé → 0-1). */
  resolutionRates: Map<string, number>;
  /** Bonnes pratiques associées aux findings courants (titre → titres BP). */
  associatedBestPractices: Map<string, string[]>;
}

/**
 * Options de génération des recommandations.
 */
export interface RecommendationOptions {
  /** Nombre maximum de recommandations (défaut : 10). */
  maxRecommendations?: number;
  /** Score minimum de pertinence (défaut : 0.3). */
  minRelevanceScore?: number;
  /** Inclure les recommandations des règles (défaut : true). */
  includeRules?: boolean;
  /** Inclure le scoring statistique (défaut : true). */
  includeStatistical?: boolean;
  /** Dimensions à inclure (défaut : toutes). */
  dimensions?: AnalysisDimension[];
}

/**
 * Résultat intermédiaire du matching de règles.
 */
export interface RuleMatch {
  /** Règle matched. */
  rule: RecommendationRule;
  /** Finding déclencheur. */
  findingTitle: string;
  /** Dimension du finding. */
  dimension: AnalysisDimension | 'general';
  /** Sévérité du finding. */
  findingSeverity: Severity;
}

/**
 * Résultat intermédiaire du scoring statistique.
 */
export interface StatisticalMatch {
  /** Titre du finding récurrent. */
  findingTitle: string;
  /** Dimension (ou `general` si le finding n'est plus courant). */
  dimension: AnalysisDimension | 'general';
  /** Fréquence dans l'historique. */
  frequency: number;
  /** Score calculé (avant ajustements contextuels). */
  baseScore: number;
  /** Bonne pratique associée (si existe). */
  associatedBestPractice?: string;
}
