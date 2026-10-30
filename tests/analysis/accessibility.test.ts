import { describe, expect, it } from 'vitest';

import { AccessibilityAnalyzer } from '../../src/analysis/accessibility.js';
import type { AxeResults } from '../../src/analysis/types.js';

/**
 * Fabrique de violation axe-core.
 *
 * @param partial - Champs variables de la violation.
 * @returns Violation complète.
 */
function violation(partial: {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help?: string;
  helpUrl?: string;
  nodes?: number;
}): NonNullable<AxeResults['violations']>[number] {
  return {
    help: 'Help',
    helpUrl: 'https://example.com',
    nodes: 1,
    ...partial,
  };
}

describe('AccessibilityAnalyzer', () => {
  const analyzer = new AccessibilityAnalyzer();

  describe('analyze', () => {
    it('analyse une accessibilité parfaite', () => {
      const results: AxeResults = { violations: [], score: 100 };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('accessibility');
      expect(result.score).toBe(100);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Aucune violation');
    });

    it('analyse une violation critique', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'critical',
            description: 'Elements must have sufficient color contrast',
            help: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
            nodes: 5,
          },
        ],
        score: 60,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.id).toBe('a11y-color-contrast');
      expect(result.findings[0]?.severity).toBe(4);
      // Formule canonique : 4 × (6 − 2) = 16 → high (≥ 12, < 20).
      expect(result.findings[0]?.priority).toBe('high');
      expect(result.findings[0]?.impact).toBe(4);
      expect(result.findings[0]?.recommendation).toContain('contrast');
    });

    it('priorise une violation critique isolée comme immédiate', () => {
      const results: AxeResults = {
        violations: [
          violation({
            id: 'label',
            impact: 'critical',
            description: 'Form elements must have labels',
            nodes: 1,
          }),
        ],
        score: 55,
      };

      const result = analyzer.analyze(results);

      // 4 × (6 − 1) = 20 → critical, et effort 1 = quick win.
      expect(result.findings[0]?.severity).toBe(4);
      expect(result.findings[0]?.effort).toBe(1);
      expect(result.findings[0]?.priority).toBe('critical');
    });

    it('analyse une violation sérieuse', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'image-alt',
            impact: 'serious',
            description: 'Images must have alternate text',
            help: 'Ensures <img> elements have alternate text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
            nodes: 10,
          },
        ],
        score: 70,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.severity).toBe(3);
    });

    it('analyse une violation modérée', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'link-name',
            impact: 'moderate',
            description: 'Links must have discernible text',
            help: 'Ensures links have discernible text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/link-name',
            nodes: 3,
          },
        ],
        score: 80,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.severity).toBe(2);
    });

    it('analyse une violation mineure', () => {
      const results: AxeResults = {
        violations: [
          {
            id: 'heading-order',
            impact: 'minor',
            description: 'Heading levels should only increase by one',
            help: 'Ensures the order of headings is semantically correct',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/heading-order',
            nodes: 1,
          },
        ],
        score: 90,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.severity).toBe(1);
    });

    it('estime l’effort selon le nombre d’éléments', () => {
      const results: AxeResults = {
        violations: [
          violation({
            id: 'test',
            impact: 'serious',
            description: 'Test',
            help: 'Test',
            nodes: 25, // > 20 → effort 4
          }),
        ],
        score: 50,
      };

      const result = analyzer.analyze(results);

      expect(result.findings[0]?.effort).toBe(4);
    });

    it('analyse plusieurs violations', () => {
      const results: AxeResults = {
        violations: [
          violation({
            id: 'color-contrast',
            impact: 'critical',
            description: 'Contrast',
            nodes: 5,
          }),
          violation({ id: 'image-alt', impact: 'serious', description: 'Alt text', nodes: 10 }),
        ],
        score: 40,
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(2);
      expect(result.summary).toContain('2 violation(s)');
      expect(result.summary).toContain('1 critique(s)');
      expect(result.summary).toContain('1 sérieuse(s)');
    });
  });
});
