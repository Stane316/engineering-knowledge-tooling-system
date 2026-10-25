import type Database from 'better-sqlite3';

import type { AnalysisDimension } from '../analysis/types.js';
import type { BestPracticeService } from '../best-practices/best-practice-service.js';

import type { RecommendationContext } from './recommendation-context.js';
import { RecommendationRepository } from './recommendation-repository.js';
import {
  byRelevanceDesc,
  clampScore,
  DEFAULT_ENGINE_CONFIG,
  matchFindingPattern,
  normalizeFindingTitle,
  ruleAppliesTo,
  scoreToPriority,
  severityBonus,
  statisticalBaseScore,
  statisticalLabels,
  type EngineConfig,
} from './recommendation-rules.js';
import type {
  CreateRecommendationRuleInput,
  Recommendation,
  RecommendationOptions,
  RecommendationReport,
  RecommendationRule,
  RecommendationRuleFilters,
  RuleMatch,
  StatisticalMatch,
  UpdateRecommendationRuleInput,
} from './recommendation.types.js';

export type { EngineConfig } from './recommendation-rules.js';

/**
 * Moteur de recommandations hybride (Sprint 16, ADR-036/ADR-037).
 *
 * Combine :
 * 1. **Règles explicites** — matching pattern + sévérité ≥ seuil → score de
 *    base 0.8 (+ bonus sévérité ≤ 0.15) ;
 * 2. **Scoring statistique** — findings récurrents (≥ `minFrequencyForStatistical`)
 *    avec score `0.5 + (fréquence / max) × 0.3`, enrichi d'une bonne pratique
 *    associée quand elle existe (C16.12).
 *
 * Puis personnalisation contextuelle (C16.3) :
 * - dimension en régression → +0.1 ; en amélioration → -0.1 ;
 * - finding déjà résolu (taux ≥ 0.8) → -0.2 ; persistant (taux ≤ 0.2) → +0.15 ;
 *
 * et fusion : déduplication par titre normalisé (score le plus élevé gagne),
 * tri par pertinence décroissante, filtre `minRelevanceScore`, coupe
 * `maxRecommendations` (C16.4, C16.5), purge + persistance du rapport
 * (régénération idempotente).
 *
 * Méthode `generateRecommendations` **synchrone** malgré le `Promise` du
 * spec (écart P3 noté dans les types) ; le chronomètre `durationMs` mesure
 * la génération réelle (C16.13).
 *
 * @example
 * ```ts
 * const engine = new RecommendationEngine(db, new RecommendationContext(db));
 * const report = engine.generateRecommendations(projectId);
 * ```
 */
export class RecommendationEngine {
  private readonly repository: RecommendationRepository;
  private readonly config: EngineConfig;

  constructor(
    db: Database.Database,
    private readonly contextBuilder: RecommendationContext,
    private readonly bestPractices?: BestPracticeService,
    config: Partial<EngineConfig> = {},
  ) {
    this.repository = new RecommendationRepository(db);
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
  }

  // --- Gestion des règles (C16.11 côté CLI en 16-03) ---

  /** Ajouter une règle explicite. */
  addRule(input: CreateRecommendationRuleInput): RecommendationRule {
    return this.repository.createRule(input);
  }

  /** Mettre à jour une règle existante. */
  updateRule(ruleId: string, input: UpdateRecommendationRuleInput): RecommendationRule {
    return this.repository.updateRule(ruleId, input);
  }

  /** Supprimer une règle (les recommandations produites sont conservées). */
  deleteRule(ruleId: string): void {
    this.repository.deleteRule(ruleId);
  }

  /** Lister les règles (filtres dimension/actif/priorité, pagination). */
  listRules(filters?: RecommendationRuleFilters): RecommendationRule[] {
    return this.repository.listRules(filters);
  }

  /** Compter les règles (filtres dimension/actif). */
  countRules(filters?: RecommendationRuleFilters): number {
    return this.repository.countRules(filters);
  }

  /** Repository interne (lecture des recommandations persistées). */
  get repositoryAccess(): RecommendationRepository {
    return this.repository;
  }

  // --- Génération ---

  /**
   * Générer les recommandations d'un projet (C16.1→C16.5).
   *
   * Étapes (spec §2.4) : contexte → règles → statistique → ajustements →
   * fusion/dédup → tri → purge + persistance.
   */
  generateRecommendations(
    projectId: string,
    options: RecommendationOptions = {},
  ): RecommendationReport {
    const startTime = Date.now();
    const maxRecommendations = options.maxRecommendations ?? 10;
    const minRelevanceScore = options.minRelevanceScore ?? 0.3;
    const includeRules = options.includeRules ?? true;
    const includeStatistical = options.includeStatistical ?? true;

    // 1. Contexte projet (audits, tendances, résolutions, bonnes pratiques).
    const context = this.contextBuilder.buildContext(projectId);

    // 2. Règles explicites.
    const ruleMatches = includeRules ? this.generateFromRules(context, options) : [];

    // 3. Scoring statistique.
    const statisticalMatches = includeStatistical
      ? this.generateFromStatistics(context, options)
      : [];

    // 4. Fusion, déduplication, filtre et coupe.
    const merged = mergeAndDeduplicate([...ruleMatches, ...statisticalMatches], {
      minRelevanceScore,
      maxRecommendations,
    });

    // 5. Persistance (purge puis écriture — régénération idempotente).
    this.repository.clearRecommendations(projectId);
    const saved = merged.map((recommendation) =>
      this.repository.saveRecommendation(recommendation),
    );

    const rulesApplied = saved.filter((recommendation) => recommendation.ruleId !== null).length;

    return {
      projectId,
      totalRecommendations: saved.length,
      rulesApplied,
      statisticalRecommendations: saved.length - rulesApplied,
      durationMs: Date.now() - startTime,
      recommendations: saved,
    };
  }

  /** Recommandations issues des règles explicites actives. */
  private generateFromRules(
    context: ReturnType<RecommendationContext['buildContext']>,
    options: RecommendationOptions,
  ): Omit<Recommendation, 'id'>[] {
    const activeRules = this.repository.listRules({ isActive: true, limit: 10_000 });
    const matches: RuleMatch[] = [];

    for (const finding of context.currentFindings) {
      if (options.dimensions !== undefined && !options.dimensions.includes(finding.dimension)) {
        continue;
      }

      const normalizedTitle = normalizeFindingTitle(finding.title);
      for (const rule of activeRules) {
        if (!ruleAppliesTo(rule, finding)) {
          continue;
        }
        if (!matchFindingPattern(normalizedTitle, rule.pattern)) {
          continue;
        }
        matches.push({
          rule,
          findingTitle: finding.title,
          dimension: finding.dimension,
          findingSeverity: finding.severity,
        });
      }
    }

    return matches.map((match) => {
      const baseScore = this.config.ruleBaseScore + severityBonus(match.findingSeverity);
      const relevanceScore = clampScore(
        this.applyContextualAdjustments(baseScore, match.dimension, match.findingTitle, context),
      );

      return {
        projectId: context.projectId,
        ruleId: match.rule.id,
        findingTitle: match.findingTitle,
        recommendationTitle: match.rule.recommendationTitle,
        recommendationDescription: match.rule.recommendationDescription,
        dimension: match.rule.dimension,
        relevanceScore,
        effort: match.rule.effort,
        impact: match.rule.impact,
        priority: match.rule.priority,
        generatedAt: new Date().toISOString(),
      };
    });
  }

  /** Recommandations du scoring statistique (findings récurrents). */
  private generateFromStatistics(
    context: ReturnType<RecommendationContext['buildContext']>,
    options: RecommendationOptions,
  ): Omit<Recommendation, 'id'>[] {
    const matches: StatisticalMatch[] = [];
    const maxFrequency = Math.max(...context.findingFrequencies.values(), 1);

    for (const [normalizedTitle, frequency] of context.findingFrequencies) {
      if (frequency < this.config.minFrequencyForStatistical) {
        continue;
      }

      const currentFinding = context.currentFindings.find(
        (finding) => normalizeFindingTitle(finding.title) === normalizedTitle,
      );
      const dimension: AnalysisDimension | 'general' = currentFinding?.dimension ?? 'general';

      if (
        options.dimensions !== undefined &&
        (dimension === 'general' || !options.dimensions.includes(dimension))
      ) {
        continue;
      }

      let associatedBestPractice: string | undefined;
      if (this.bestPractices !== undefined && currentFinding !== undefined) {
        associatedBestPractice = this.bestPractices.findByFinding(
          currentFinding.title,
          currentFinding.dimension,
        )[0]?.title;
      }

      matches.push({
        findingTitle: currentFinding?.title ?? normalizedTitle,
        dimension,
        frequency,
        baseScore: statisticalBaseScore(frequency, maxFrequency, this.config),
        ...(associatedBestPractice === undefined ? {} : { associatedBestPractice }),
      });
    }

    return matches.map((match) => {
      const contextualScore = this.applyContextualAdjustments(
        match.baseScore,
        match.dimension,
        match.findingTitle,
        context,
      );
      const relevanceScore = clampScore(
        contextualScore + (match.associatedBestPractice === undefined ? 0 : 0.05),
      );
      const labels = statisticalLabels(match);

      return {
        projectId: context.projectId,
        ruleId: null,
        findingTitle: match.findingTitle,
        recommendationTitle: labels.title,
        recommendationDescription: labels.description,
        dimension: match.dimension,
        relevanceScore,
        effort: 3,
        impact: 3,
        priority: scoreToPriority(relevanceScore),
        generatedAt: new Date().toISOString(),
      };
    });
  }

  /** Ajustements contextuels : tendance de la dimension + historique (ADR-037). */
  private applyContextualAdjustments(
    baseScore: number,
    dimension: AnalysisDimension | 'general',
    findingTitle: string,
    context: ReturnType<RecommendationContext['buildContext']>,
  ): number {
    let score = baseScore;

    if (dimension !== 'general') {
      const trend = context.dimensionTrends.get(dimension);
      if (trend === 'declining') {
        score += this.config.decliningAdjustment;
      } else if (trend === 'improving') {
        score += this.config.improvingAdjustment;
      }
    }

    const resolutionRate = context.resolutionRates.get(normalizeFindingTitle(findingTitle));
    if (resolutionRate !== undefined) {
      if (resolutionRate >= 0.8) {
        score += this.config.resolvedAdjustment;
      } else if (resolutionRate <= 0.2) {
        score += this.config.persistentAdjustment;
      }
    }

    return score;
  }
}

/**
 * Fusionner, dédupliquer (titre normalisé, score le plus élevé gagne),
 * filtrer (`minRelevanceScore`) et trier (pertinence décroissante) avant
 * coupe `maxRecommendations`.
 */
function mergeAndDeduplicate(
  recommendations: Omit<Recommendation, 'id'>[],
  options: { minRelevanceScore: number; maxRecommendations: number },
): Omit<Recommendation, 'id'>[] {
  const seen = new Map<string, Omit<Recommendation, 'id'>>();

  for (const recommendation of recommendations) {
    const key = normalizeFindingTitle(recommendation.recommendationTitle);
    const existing = seen.get(key);
    if (existing === undefined || recommendation.relevanceScore > existing.relevanceScore) {
      seen.set(key, recommendation);
    }
  }

  return [...seen.values()]
    .filter((recommendation) => recommendation.relevanceScore >= options.minRelevanceScore)
    .sort(byRelevanceDesc)
    .slice(0, options.maxRecommendations);
}
