import { describe, expect, it } from 'vitest';

import { FindingPrioritizer } from '../../src/analysis/prioritizer.js';
import type {
  AnalysisDimension,
  Effort,
  Finding,
  Impact,
  Severity,
} from '../../src/analysis/types.js';

describe('FindingPrioritizer', () => {
  const prioritizer = new FindingPrioritizer();

  /**
   * Fabrique de constat pour un couple sévérité/effort donné.
   *
   * @param severity - Sévérité (0-4).
   * @param effort - Effort (1-5).
   * @param dimension - Dimension (défaut : performance).
   * @returns Constat avec priorité indicative.
   */
  const createFinding = (
    severity: Severity,
    effort: Effort,
    dimension: AnalysisDimension = 'performance',
  ): Finding => ({
    id: `test-${severity}-${effort}`,
    dimension,
    title: `Test ${severity}-${effort}`,
    description: 'Test description',
    severity,
    effort,
    impact: 3 as Impact,
    priority: 'medium', // recalculée par prioritize
    recommendation: 'Fix it',
    references: [],
  });

  describe('prioritize', () => {
    it('trie les constats par priorité', () => {
      const findings: Finding[] = [
        createFinding(1, 4), // low
        createFinding(4, 1), // critical
        createFinding(2, 3), // medium
        createFinding(3, 2), // high
      ];

      const prioritized = prioritizer.prioritize(findings);

      expect(prioritized[0]?.priority).toBe('critical');
      expect(prioritized[1]?.priority).toBe('high');
      expect(prioritized[2]?.priority).toBe('medium');
      expect(prioritized[3]?.priority).toBe('low');
    });

    it('ne modifie pas le tableau d’entrée', () => {
      const findings: Finding[] = [createFinding(1, 4), createFinding(4, 1)];
      const orderBefore = findings.map((f) => f.priority);

      prioritizer.prioritize(findings);

      expect(findings.map((f) => f.priority)).toEqual(orderBefore);
      expect(findings.map((f) => f.id)).toEqual(['test-1-4', 'test-4-1']);
    });

    it('gère une liste vide', () => {
      expect(prioritizer.prioritize([])).toEqual([]);
    });

    it('conserve tous les constats critiques', () => {
      const findings: Finding[] = [createFinding(4, 1), createFinding(4, 1)];

      const prioritized = prioritizer.prioritize(findings);

      expect(prioritized.every((f) => f.priority === 'critical')).toBe(true);
    });
  });

  describe('groupByPriority', () => {
    it('groupe les constats par priorité', () => {
      const findings: Finding[] = [
        { ...createFinding(4, 1), priority: 'critical' },
        { ...createFinding(3, 2), priority: 'high' },
        { ...createFinding(2, 3), priority: 'medium' },
        { ...createFinding(1, 4), priority: 'low' },
        { ...createFinding(0, 5), priority: 'info' },
      ];

      const grouped = prioritizer.groupByPriority(findings);

      expect(grouped.critical.length).toBe(1);
      expect(grouped.high.length).toBe(1);
      expect(grouped.medium.length).toBe(1);
      expect(grouped.low.length).toBe(1);
      expect(grouped.info.length).toBe(1);
    });
  });

  describe('groupByDimension', () => {
    it('groupe les constats par dimension', () => {
      const findings: Finding[] = [
        createFinding(2, 2, 'performance'),
        createFinding(2, 2, 'accessibility'),
        createFinding(2, 2, 'seo'),
      ];

      const grouped = prioritizer.groupByDimension(findings);

      expect(grouped.performance.length).toBe(1);
      expect(grouped.accessibility.length).toBe(1);
      expect(grouped.seo.length).toBe(1);
      expect(grouped.ux.length).toBe(0);
      expect(grouped.content.length).toBe(0);
    });
  });

  describe('generateExecutiveSummary', () => {
    it('résume des priorités mixtes', () => {
      const findings: Finding[] = [
        { ...createFinding(4, 1), priority: 'critical' },
        { ...createFinding(3, 2), priority: 'high' },
        { ...createFinding(2, 3), priority: 'medium' },
      ];

      const summary = prioritizer.generateExecutiveSummary(findings);

      expect(summary).toContain('1 problème(s) critique(s)');
      expect(summary).toContain('1 problème(s) important(s)');
      expect(summary).toContain('1 problème(s) moyen(s)');
      expect(summary.endsWith('.')).toBe(true);
    });

    it('résume une liste vide', () => {
      expect(prioritizer.generateExecutiveSummary([])).toContain('Aucun problème');
    });

    it('ne mentionne que les comptes non nuls', () => {
      const findings: Finding[] = [{ ...createFinding(4, 1), priority: 'critical' }];

      const summary = prioritizer.generateExecutiveSummary(findings);

      expect(summary).toContain('critique');
      expect(summary).not.toContain('important');
      expect(summary).not.toContain('moyen');
    });
  });

  describe('findQuickWins', () => {
    it('retient forte sévérité et faible effort', () => {
      const findings: Finding[] = [
        createFinding(3, 1), // quick win
        createFinding(4, 2), // quick win
        createFinding(2, 3), // pas un quick win (sévérité)
        createFinding(1, 1), // pas un quick win (sévérité)
      ];

      expect(prioritizer.findQuickWins(findings).length).toBe(2);
    });
  });

  describe('findBigBets', () => {
    it('retient forte sévérité et fort effort', () => {
      const findings: Finding[] = [
        createFinding(3, 4), // big bet
        createFinding(4, 5), // big bet
        createFinding(2, 3), // pas un big bet (sévérité)
        createFinding(4, 1), // pas un big bet (effort)
      ];

      expect(prioritizer.findBigBets(findings).length).toBe(2);
    });
  });
});
