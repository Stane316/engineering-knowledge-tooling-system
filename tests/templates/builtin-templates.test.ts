import { describe, expect, it } from 'vitest';

import type { AnalysisDimension, Priority } from '../../src/analysis/types.js';
import { TEMPLATE_CATEGORIES } from '../../src/templates/template.types.js';
import { BUILTIN_TEMPLATES } from '../../src/templates/builtin-templates.js';

const DIMENSIONS: AnalysisDimension[] = ['performance', 'accessibility', 'seo', 'ux', 'content'];
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

describe('Builtin Templates (17-02, C17.2)', () => {
  it('devrait définir exactement 10 templates', () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(10);
  });

  it('chaque template doit avoir nom, description et catégorie', () => {
    for (const def of BUILTIN_TEMPLATES) {
      expect(def.template.name.trim().length).toBeGreaterThan(0);
      expect(def.template.description.trim().length).toBeGreaterThan(0);
      expect(TEMPLATE_CATEGORIES).toContain(def.template.category);
    }
  });

  it('chaque template doit avoir au moins 3 règles (critère : 3-5)', () => {
    for (const def of BUILTIN_TEMPLATES) {
      expect(def.rules.length).toBeGreaterThanOrEqual(3);
      expect(def.rules.length).toBeLessThanOrEqual(5);
    }
  });

  it('les catégories doivent couvrir les 10 types principaux (sans doublon)', () => {
    const categories = BUILTIN_TEMPLATES.map((t) => t.template.category);
    expect([...categories].sort()).toEqual(
      [...TEMPLATE_CATEGORIES.filter((c) => c !== 'custom')].sort(),
    );
    expect(new Set(categories).size).toBe(10);
  });

  it('chaque règle doit être conforme aux types maison (dimension, sévérité, priorité)', () => {
    for (const def of BUILTIN_TEMPLATES) {
      for (const rule of def.rules) {
        expect(DIMENSIONS).toContain(rule.dimension);
        expect(rule.severityThreshold).toBeGreaterThanOrEqual(0);
        expect(rule.severityThreshold).toBeLessThanOrEqual(4);
        expect(PRIORITIES).toContain(rule.priority);
        expect(rule.effort).toBeGreaterThanOrEqual(1);
        expect(rule.effort).toBeLessThanOrEqual(5);
        expect(rule.impact).toBeGreaterThanOrEqual(1);
        expect(rule.impact).toBeLessThanOrEqual(5);
        expect(rule.name.trim().length).toBeGreaterThan(0);
        expect(rule.pattern.trim().length).toBeGreaterThan(0);
        expect(rule.recommendationTitle.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('les configurations doivent être valides (thresholds bornés, tags présents)', () => {
    for (const def of BUILTIN_TEMPLATES) {
      const config = def.template.config ?? {};
      expect(Array.isArray(config.priorityDimensions)).toBe(true);
      expect(config.priorityDimensions!.length).toBeGreaterThan(0);
      for (const dim of config.priorityDimensions!) {
        expect(DIMENSIONS).toContain(dim);
      }
      expect(config.tags!.length).toBeGreaterThan(0);
      expect(config.author).toBe('EKTS Team');
      expect(config.version).toBe('1.0.0');
      if (config.alertThresholds) {
        const { regressionPoints, minScore } = config.alertThresholds;
        if (regressionPoints !== undefined) {
          expect(regressionPoints).toBeGreaterThanOrEqual(1);
          expect(regressionPoints).toBeLessThanOrEqual(50);
        }
        if (minScore !== undefined) {
          expect(minScore).toBeGreaterThanOrEqual(0);
          expect(minScore).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('les noms de règles doivent être uniques par template', () => {
    for (const def of BUILTIN_TEMPLATES) {
      const names = def.rules.map((r) => r.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
