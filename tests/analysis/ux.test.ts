import { describe, expect, it } from 'vitest';

import { UXAnalyzer } from '../../src/analysis/ux.js';
import type { UXResults } from '../../src/analysis/types.js';

describe('UXAnalyzer', () => {
  const analyzer = new UXAnalyzer();

  describe('analyze', () => {
    it('analyse une UX parfaite', () => {
      const results: UXResults = {
        score: 100,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 100,
            issues: [],
          },
          {
            id: 'real-world',
            name: 'Match between system and real world',
            score: 100,
            issues: [],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('ux');
      expect(result.score).toBe(100);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Excellente');
    });

    it('analyse une heuristique avec des constats', () => {
      const results: UXResults = {
        score: 70,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 50,
            issues: ['No loading indicators', 'No progress feedback'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.id).toBe('ux-visibility-status');
      expect(result.findings[0]?.severity).toBeGreaterThanOrEqual(2);
      expect(result.findings[0]?.recommendation).toContain('indicateurs');
    });

    it('calcule la sévérité d’après le score', () => {
      const results: UXResults = {
        score: 30,
        heuristics: [
          {
            id: 'error-prevention',
            name: 'Error prevention',
            score: 20, // < 40 → critique
            issues: ['No validation', 'No confirmation'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings[0]?.severity).toBe(4);
    });

    it('estime l’effort d’après le nombre de constats', () => {
      const results: UXResults = {
        score: 60,
        heuristics: [
          {
            id: 'consistency',
            name: 'Consistency and standards',
            score: 60,
            issues: ['Issue 1', 'Issue 2', 'Issue 3', 'Issue 4', 'Issue 5', 'Issue 6'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings[0]?.effort).toBe(4); // > 5 constats
    });

    it('analyse plusieurs heuristiques', () => {
      const results: UXResults = {
        score: 50,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 50,
            issues: ['No loading indicators'],
          },
          {
            id: 'user-control',
            name: 'User control and freedom',
            score: 60,
            issues: ['No undo'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(2);
      expect(result.summary).toContain('2 problème(s)');
      expect(result.summary).toContain('1 sérieux');
      expect(result.summary).toContain('1 modéré(s)');
    });

    it('ignore les heuristiques au score parfait', () => {
      const results: UXResults = {
        score: 90,
        heuristics: [
          {
            id: 'visibility-status',
            name: 'Visibility of system status',
            score: 100,
            issues: [],
          },
          {
            id: 'error-prevention',
            name: 'Error prevention',
            score: 80,
            issues: ['Minor issue'],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.id).toBe('ux-error-prevention');
      expect(result.findings[0]?.severity).toBe(1);
      expect(result.summary).toContain('1 mineur(s)');
    });

    it('tombe sur une recommandation générique pour une heuristique inconnue', () => {
      const results: UXResults = {
        score: 95,
        heuristics: [
          {
            id: 'custom-heuristic',
            name: 'Heuristique personnalisée',
            score: 90, // mineur, aucun constat
            issues: [],
          },
        ],
      };

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.severity).toBe(1);
      expect(result.findings[0]?.effort).toBe(1);
      expect(result.findings[0]?.priority).toBe('low');
      expect(result.findings[0]?.recommendation).toContain("Améliorer l'heuristique");
    });
  });
});
