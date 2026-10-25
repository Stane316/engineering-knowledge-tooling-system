import type { AnalysisDimension } from '../analysis/types.js';
import type { Audit } from '../storage/types.js';

/**
 * Types du module de suivi temporel (Sprint 14).
 *
 * La timeline d'un projet est la série chronologique des audits rattachés,
 * ventilée par dimension d'analyse, enrichie des tendances détectées.
 */

/** Point d'une série temporelle : score d'une dimension pour un audit. */
export interface DimensionScorePoint {
  /** Identifiant de l'audit source. */
  auditId: number;
  /** Horodatage de l'audit (Date). */
  date: Date;
  /** Score de la dimension (0-100). */
  score: number;
  /** Nombre de constats de la dimension. */
  findingsCount: number;
}

/** Analyse de la timeline d'un projet. */
export interface TimelineAnalysis {
  /** Identifiant du projet analysé. */
  projectId: string;
  /** Nom du projet (snapshot au moment de l'analyse). */
  projectName: string;
  /** Audits du projet triés chronologiquement (croissant). */
  audits: Audit[];
  /** Date du premier audit (epoch 0 si aucun audit). */
  startDate: Date;
  /** Date du dernier audit (epoch 0 si aucun audit). */
  endDate: Date;
  /** Nombre total d'audits de la timeline. */
  totalAudits: number;
  /** Série chronologique par dimension (5 dimensions). */
  dimensionScores: DimensionTimeline[];
}

/** Timeline d'une dimension spécifique. */
export interface DimensionTimeline {
  /** Dimension analysée. */
  dimension: AnalysisDimension;
  /** Points chronologiques (auditId, date, score, constats). */
  scores: DimensionScorePoint[];
  /** Tendance pré-calculée (`TrendDetector` fournit la valeur finale). */
  trend: Trend;
  /** Moyenne arithmétique des scores (0 si aucune donnée). */
  averageScore: number;
  /** Score minimal (0 si aucune donnée). */
  minScore: number;
  /** Score maximal (0 si aucune donnée). */
  maxScore: number;
}

/** Tendance détectée sur une série. */
export interface Trend {
  /** Direction classée. */
  direction: 'improving' | 'declining' | 'stable';
  /** Pente de la régression linéaire (points par audit). */
  slope: number;
  /** Qualité de la régression, R² borné à [0, 1] (0 = non significatif). */
  confidence: number;
  /** Description lisible de la tendance. */
  description: string;
}

/** Rapport de tendances d'une timeline. */
export interface TrendReport {
  /** Projet analysé. */
  projectId: string;
  /** Taille de fenêtre utilisée pour le calcul. */
  windowSize: number;
  /** Tendance par dimension. */
  trends: Map<AnalysisDimension, Trend>;
  /** Tendance globale (pente moyenne des dimensions). */
  overallTrend: Trend;
  /** Recommandations générées (une par dimension en régression/amélioration). */
  recommendations: string[];
}

/** Configuration de la détection de tendances. */
export interface TrendConfig {
  /** Nombre de derniers audits utilisés pour la régression (≥ 2). */
  windowSize: number;
  /** Pente minimale pour classer « amélioration ». */
  improvementThreshold: number;
  /** Pente maximale (négative) pour classer « régression ». */
  regressionThreshold: number;
}

/** Régression entre deux audits consécutifs (entrée d'alerte). */
export interface Regression {
  /** Projet concerné. */
  projectId: string;
  /** Audit de référence (plus ancien). */
  auditIdFrom: number;
  /** Audit comparé (plus récent). */
  auditIdTo: number;
  /** Date de l'audit de référence. */
  dateFrom: Date;
  /** Date de l'audit comparé. */
  dateTo: Date;
  /** Dimension en régression, ou `overall` (score global). */
  dimension: AnalysisDimension | 'overall';
  /** Score précédent (0-100). */
  scoreBefore: number;
  /** Score suivant (0-100). */
  scoreAfter: number;
  /** Points perdus (positif = régression). */
  regressionPoints: number;
}
