import { describe, expect, it } from 'vitest';

import { ContentAnalyzer } from '../../src/analysis/content.js';
import type { ContentResults } from '../../src/analysis/types.js';

/**
 * Fabrique de résultats de contenu.
 *
 * @param metrics - Métriques à analyser.
 * @param score - Score contenu (0-100).
 * @returns Résultats complets.
 */
function contentResults(
  metrics: { wordCount: number; readingTime: number; readabilityScore: number },
  score: number,
): ContentResults {
  return { score, metrics };
}

describe('ContentAnalyzer', () => {
  const analyzer = new ContentAnalyzer();

  describe('analyze', () => {
    it('analyse un contenu excellent', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 1200, readingTime: 6, readabilityScore: 75 }, 95),
      );

      expect(result.dimension).toBe('content');
      expect(result.score).toBe(95);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Excellente');
    });

    it('détecte un nombre de mots insuffisant', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 150, readingTime: 1, readabilityScore: 65 }, 40),
      );

      const wordCountFinding = result.findings.find((f) => f.id === 'content-word-count-low');
      expect(wordCountFinding).toBeDefined();
      expect(wordCountFinding?.severity).toBe(3);
      expect(wordCountFinding?.metric?.unit).toBe('mots');
    });

    it('détecte un contenu à enrichir', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 400, readingTime: 2, readabilityScore: 65 }, 60),
      );

      const wordCountFinding = result.findings.find((f) => f.id === 'content-word-count-medium');
      expect(wordCountFinding).toBeDefined();
      expect(wordCountFinding?.severity).toBe(2);
      expect(result.summary).toContain('1 moyen(s)');
    });

    it('détecte une lisibilité très faible', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 800, readingTime: 4, readabilityScore: 25 }, 30),
      );

      const readabilityFinding = result.findings.find((f) => f.id === 'content-readability-poor');
      expect(readabilityFinding).toBeDefined();
      expect(readabilityFinding?.severity).toBe(4);
      expect(readabilityFinding?.priority).toBe('critical');
    });

    it('détecte une lisibilité faible', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 800, readingTime: 4, readabilityScore: 45 }, 45),
      );

      const readabilityFinding = result.findings.find((f) => f.id === 'content-readability-low');
      expect(readabilityFinding).toBeDefined();
      expect(readabilityFinding?.severity).toBe(3);
    });

    it('détecte une lisibilité moyenne', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 800, readingTime: 4, readabilityScore: 55 }, 55),
      );

      const readabilityFinding = result.findings.find((f) => f.id === 'content-readability-medium');
      expect(readabilityFinding).toBeDefined();
      expect(readabilityFinding?.severity).toBe(2);
      expect(readabilityFinding?.effort).toBe(1);
    });

    it('détecte un temps de lecture trop court', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 200, readingTime: 0.5, readabilityScore: 60 }, 50),
      );

      const readingTimeFinding = result.findings.find((f) => f.id === 'content-reading-time-short');
      expect(readingTimeFinding).toBeDefined();
      expect(readingTimeFinding?.severity).toBe(2);
    });

    it('détecte un temps de lecture excessif', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 3000, readingTime: 20, readabilityScore: 65 }, 70),
      );

      const readingTimeFinding = result.findings.find((f) => f.id === 'content-reading-time-long');
      expect(readingTimeFinding).toBeDefined();
      expect(readingTimeFinding?.severity).toBe(1);
      expect(result.summary).toContain('1 mineur(s)');
    });

    it('analyse plusieurs défauts à la fois', () => {
      const result = analyzer.analyze(
        contentResults({ wordCount: 100, readingTime: 0.5, readabilityScore: 20 }, 20),
      );

      expect(result.findings.length).toBeGreaterThanOrEqual(3);
      expect(result.summary).toContain('problème(s)');
      expect(result.summary).toContain('1 critique(s)');
    });
  });
});
