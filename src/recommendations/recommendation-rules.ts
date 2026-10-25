import type { Priority } from '../analysis/types.js';

import type { RecommendationRule, StatisticalMatch } from './recommendation.types.js';

/**
 * Modèle de règles explicites (Sprint 16, ADR-036).
 *
 * Regroupe la logique pure utilisée par `RecommendationEngine` :
 * - normalisation et matching des titres de findings contre les patterns de
 *   règles (exact, inclusion, mots-clés) ;
 * - conversion score → priorité et bornage des scores ;
 * - configuration par défaut du moteur (`DEFAULT_ENGINE_CONFIG`).
 *
 * **Écart P3 (spec vs code)** : `SPRINT-16-01.md` listait le fichier
 * `recommendation-rules.ts` dans les livrables sans lui affecter de section —
 * implémenté ici comme module de matching pur (testable isolément) ; les
 * helpers étaient enlinés dans la classe engine du spec.
 *
 * Fonctions **pures** (aucune dépendance SQLite) : testées par
 * `tests/recommendations/recommendation-rules.test.ts`.
 */

/**
 * Configuration du moteur de recommandations (valeurs du spec §3.4).
 */
export interface EngineConfig {
  /** Score de base pour les règles explicites (défaut : 0.8). */
  ruleBaseScore: number;
  /** Score de base pour le scoring statistique (défaut : 0.5). */
  statisticalBaseScore: number;
  /** Ajustement si dimension en régression (défaut : +0.1). */
  decliningAdjustment: number;
  /** Ajustement si dimension en amélioration (défaut : -0.1). */
  improvingAdjustment: number;
  /** Ajustement si finding déjà résolu (défaut : -0.2). */
  resolvedAdjustment: number;
  /** Ajustement si finding persiste malgré les tentatives (défaut : +0.15). */
  persistentAdjustment: number;
  /** Occurrences minimales pour déclencher le scoring statistique (défaut : 3). */
  minFrequencyForStatistical: number;
}

/**
 * Configuration par défaut du moteur (ADR-037).
 */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  ruleBaseScore: 0.8,
  statisticalBaseScore: 0.5,
  decliningAdjustment: 0.1,
  improvingAdjustment: -0.1,
  resolvedAdjustment: -0.2,
  persistentAdjustment: 0.15,
  minFrequencyForStatistical: 3,
};

/**
 * Normaliser un titre de finding pour le matching.
 *
 * Minuscules, ponctuation retirée (accents conservés), espaces réduits.
 */
export function normalizeFindingTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Matcher un titre de finding (déjà normalisé) contre un pattern de règle.
 *
 * Trois stratégies dans l'ordre (spec §3.4) :
 * 1. égalité exacte après normalisation ;
 * 2. inclusion dans un sens ou dans l'autre ;
 * 3. mots-clés : tous les mots du pattern (longueur > 2) présents dans le
 *    titre.
 */
export function matchFindingPattern(normalizedTitle: string, pattern: string): boolean {
  const normalizedPattern = normalizeFindingTitle(pattern);

  if (normalizedPattern.length === 0) {
    return false;
  }

  // 1. Matching exact après normalisation.
  if (normalizedTitle === normalizedPattern) {
    return true;
  }

  // 2. Matching par inclusion.
  if (normalizedTitle.includes(normalizedPattern) || normalizedPattern.includes(normalizedTitle)) {
    return true;
  }

  // 3. Matching par mots-clés (tous les mots significatifs présents).
  const patternWords = normalizedPattern.split(/\s+/u).filter((word) => word.length > 2);
  return patternWords.length > 0 && patternWords.every((word) => normalizedTitle.includes(word));
}

/**
 * Convertir un score de pertinence en priorité (ADR-037).
 *
 * Seuils : ≥ 0.85 → `critical`, ≥ 0.7 → `high`, ≥ 0.5 → `medium`, sinon `low`.
 */
export function scoreToPriority(score: number): Priority {
  if (score >= 0.85) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/**
 * Borner un score de pertinence entre 0 et 1 (C16.4).
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

/**
 * Trier les recommandations par pertinence décroissante (C16.5) —
 * helper générique sur le score (utilisable sur `Recommendation` comme sur
 * les matches intermédiaires).
 */
export function byRelevanceDesc(
  a: { relevanceScore: number },
  b: { relevanceScore: number },
): number {
  return b.relevanceScore - a.relevanceScore;
}

/**
 * Vérifier qu'une règle est applicable à un finding courant
 * (dimension `general` ou identique, sévérité ≥ seuil).
 *
 * Le matching de pattern lui-même est délégué à `matchFindingPattern`.
 */
export function ruleAppliesTo(
  rule: RecommendationRule,
  finding: { dimension: string; severity: number },
): boolean {
  if (rule.dimension !== 'general' && rule.dimension !== finding.dimension) {
    return false;
  }
  return finding.severity >= rule.severityThreshold;
}

/**
 * Score statistique de base avant ajustements contextuels (spec §2.4
 * étape 3) : `0.5 + (fréquence / fréquence max) × 0.3`.
 */
export function statisticalBaseScore(
  frequency: number,
  maxFrequency: number,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): number {
  const safeMax = Math.max(maxFrequency, 1);
  return config.statisticalBaseScore + (frequency / safeMax) * 0.3;
}

/**
 * Bonus de sévérité pour les règles : `(sévérité / 4) × 0.15`
 * (0 pour sévérité 0, +0.15 pour critique 4).
 */
export function severityBonus(severity: number): number {
  return (severity / 4) * 0.15;
}

/**
 * Construire les libellés d'une recommandation statistique
 * (avec ou sans bonne pratique associée — C16.12).
 */
export function statisticalLabels(match: StatisticalMatch): {
  title: string;
  description: string;
} {
  if (match.associatedBestPractice !== undefined) {
    return {
      title: `Appliquer la bonne pratique : ${match.associatedBestPractice}`,
      description:
        `Ce constat apparaît ${String(match.frequency)} fois dans l'historique. ` +
        `La bonne pratique « ${match.associatedBestPractice} » a prouvé son efficacité.`,
    };
  }
  return {
    title: `Résoudre le constat récurrent : ${match.findingTitle}`,
    description:
      `Ce constat apparaît ${String(match.frequency)} fois dans l'historique du projet. ` +
      'Une résolution durable est recommandée.',
  };
}
