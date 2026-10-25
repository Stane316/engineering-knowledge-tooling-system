import { describe, expect, it } from 'vitest';

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
} from '../../src/recommendations/recommendation-rules.js';
import type {
  RecommendationRule,
  StatisticalMatch,
} from '../../src/recommendations/recommendation.types.js';

/** Règle de test minimaliste. */
function makeRule(overrides: Partial<RecommendationRule> = {}): RecommendationRule {
  return {
    id: 'rule-1',
    name: 'Règle',
    description: 'D',
    dimension: 'performance',
    severityThreshold: 2,
    pattern: 'images non optimisées',
    recommendationTitle: 'Optimiser les images',
    recommendationDescription: 'Convertir en WebP',
    effort: 2,
    impact: 4,
    priority: 'high',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('recommendation-rules — matching et scores purs (Sprint 16-01)', () => {
  describe('normalizeFindingTitle', () => {
    it('minuscules, ponctuation retirée, accents conservés', () => {
      expect(normalizeFindingTitle('Images non optimisées !')).toBe('images non optimisées');
      expect(normalizeFindingTitle('  Méta   description? ')).toBe('méta description');
      expect(normalizeFindingTitle('CDN — cache')).toBe('cdn cache');
    });
  });

  describe('matchFindingPattern (exact, inclusion, mots-clés)', () => {
    it('match exact après normalisation', () => {
      expect(matchFindingPattern('images non optimisées', 'Images non optimisées !')).toBe(true);
    });

    it('match par inclusion (titre ⊇ pattern et inversement)', () => {
      expect(
        matchFindingPattern('images non optimisées sur la page', 'images non optimisées'),
      ).toBe(true);
      expect(matchFindingPattern('images', 'images non optimisées')).toBe(true);
    });

    it('match par mots-clés : tous les mots > 2 caractères présents', () => {
      expect(matchFindingPattern('alt manquant sur images html', 'images alt manquant')).toBe(true);
      expect(matchFindingPattern('images seules', 'images descriptions')).toBe(false);
    });

    it('pattern vide = jamais de match', () => {
      expect(matchFindingPattern('nimporte quoi', '   ')).toBe(false);
    });

    it('mot-clé ≤ 2 caractères : aucun match par mots-clés', () => {
      // 'de' : pas d'inclusion ('titre autre' ne contient pas 'de') et le seul
      // mot du pattern est filtré (longueur > 2) → aucun critère satisfait.
      expect(matchFindingPattern('titre autre', 'de')).toBe(false);
    });
  });

  describe('scoreToPriority / clampScore', () => {
    it('seuils de priorité (ADR-037)', () => {
      expect(scoreToPriority(0.85)).toBe('critical');
      expect(scoreToPriority(0.84)).toBe('high');
      expect(scoreToPriority(0.7)).toBe('high');
      expect(scoreToPriority(0.5)).toBe('medium');
      expect(scoreToPriority(0.49)).toBe('low');
    });

    it('bornage [0, 1]', () => {
      expect(clampScore(-0.5)).toBe(0);
      expect(clampScore(1.4)).toBe(1);
      expect(clampScore(0.42)).toBe(0.42);
    });
  });

  describe('ruleAppliesTo', () => {
    it('dimension identique ou general, sévérité ≥ seuil', () => {
      expect(ruleAppliesTo(makeRule(), { dimension: 'performance', severity: 2 })).toBe(true);
      expect(ruleAppliesTo(makeRule(), { dimension: 'performance', severity: 1 })).toBe(false);
      expect(ruleAppliesTo(makeRule(), { dimension: 'seo', severity: 3 })).toBe(false);
      expect(
        ruleAppliesTo(makeRule({ dimension: 'general', severityThreshold: 0 }), {
          dimension: 'seo',
          severity: 0,
        }),
      ).toBe(true);
    });
  });

  describe('scores statistiques', () => {
    it('statisticalBaseScore = 0.5 + (freq/max) × 0.3', () => {
      expect(statisticalBaseScore(3, 3)).toBeCloseTo(0.8, 5);
      expect(statisticalBaseScore(3, 6)).toBeCloseTo(0.65, 5);
      expect(statisticalBaseScore(1, 0)).toBeCloseTo(0.8, 5); // max 0 → 1 (safeMax)
    });

    it('severityBonus linéaire 0 → 0, 4 → 0.15', () => {
      expect(severityBonus(0)).toBe(0);
      expect(severityBonus(2)).toBeCloseTo(0.075, 5);
      expect(severityBonus(4)).toBeCloseTo(0.15, 5);
    });
  });

  describe('statisticalLabels (C16.12)', () => {
    it('avec bonne pratique associée', () => {
      const match: StatisticalMatch = {
        findingTitle: 'Images non optimisées',
        dimension: 'performance',
        frequency: 4,
        baseScore: 0.7,
        associatedBestPractice: 'Convertir en WebP',
      };
      const labels = statisticalLabels(match);
      expect(labels.title).toContain('Appliquer la bonne pratique : Convertir en WebP');
      expect(labels.description).toContain('4 fois');
      expect(labels.description).toContain('Convertir en WebP');
    });

    it('sans bonne pratique', () => {
      const labels = statisticalLabels({
        findingTitle: 'Images non optimisées',
        dimension: 'performance',
        frequency: 3,
        baseScore: 0.65,
      });
      expect(labels.title).toBe('Résoudre le constat récurrent : Images non optimisées');
      expect(labels.description).toContain('3 fois');
    });
  });

  describe('tri et configuration', () => {
    it('byRelevanceDesc trie par pertinence décroissante', () => {
      const items = [{ relevanceScore: 0.4 }, { relevanceScore: 0.9 }, { relevanceScore: 0.6 }];
      expect([...items].sort(byRelevanceDesc).map((item) => item.relevanceScore)).toEqual([
        0.9, 0.6, 0.4,
      ]);
    });

    it('DEFAULT_ENGINE_CONFIG correspond aux valeurs du spec', () => {
      expect(DEFAULT_ENGINE_CONFIG).toEqual({
        ruleBaseScore: 0.8,
        statisticalBaseScore: 0.5,
        decliningAdjustment: 0.1,
        improvingAdjustment: -0.1,
        resolvedAdjustment: -0.2,
        persistentAdjustment: 0.15,
        minFrequencyForStatistical: 3,
      });
    });
  });
});
