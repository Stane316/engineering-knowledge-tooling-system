import { describe, expect, it } from 'vitest';

import { SeverityMatrix } from '../../src/analysis/severity.js';
import type { Effort, Severity } from '../../src/analysis/types.js';

describe('SeverityMatrix', () => {
  const matrix = new SeverityMatrix();

  describe('calculateScore', () => {
    it('calcule le score correctement', () => {
      expect(matrix.calculateScore(4, 1)).toBe(20); // critical
      expect(matrix.calculateScore(3, 2)).toBe(12); // high
      expect(matrix.calculateScore(2, 3)).toBe(6); // medium
      expect(matrix.calculateScore(1, 4)).toBe(2); // low
      expect(matrix.calculateScore(0, 5)).toBe(0); // info
    });

    it('gère les cas limites', () => {
      expect(matrix.calculateScore(4, 5)).toBe(4); // sévérité critique, effort maximal
      expect(matrix.calculateScore(0, 1)).toBe(0); // aucune sévérité
    });
  });

  describe('scoreToPriority', () => {
    it('convertit le score en priorité', () => {
      expect(matrix.scoreToPriority(20)).toBe('critical');
      expect(matrix.scoreToPriority(15)).toBe('high');
      expect(matrix.scoreToPriority(6)).toBe('medium');
      expect(matrix.scoreToPriority(2)).toBe('low');
      expect(matrix.scoreToPriority(0)).toBe('info');
    });

    it('respecte les bornes des seuils', () => {
      expect(matrix.scoreToPriority(19)).toBe('high');
      expect(matrix.scoreToPriority(12)).toBe('high');
      expect(matrix.scoreToPriority(11)).toBe('medium');
      expect(matrix.scoreToPriority(6)).toBe('medium');
      expect(matrix.scoreToPriority(5)).toBe('low');
      expect(matrix.scoreToPriority(2)).toBe('low');
      expect(matrix.scoreToPriority(1)).toBe('info');
    });
  });

  describe('calculatePriority', () => {
    it('calcule la priorité d’un constat', () => {
      const priority = matrix.calculatePriority({
        id: 'test',
        dimension: 'performance',
        title: 'Test',
        description: 'Test',
        severity: 4 as Severity,
        effort: 1 as Effort,
        impact: 5,
        recommendation: 'Fix',
        references: [],
      });

      expect(priority).toBe('critical');
    });

    it('priorise les problèmes critiques peu coûteux', () => {
      const priority = matrix.calculatePriority({
        id: 'test',
        dimension: 'accessibility',
        title: 'Test',
        description: 'Test',
        severity: 4 as Severity,
        effort: 1 as Effort,
        impact: 5,
        recommendation: 'Fix',
        references: [],
      });

      expect(priority).toBe('critical');
    });

    it('dépriorise les problèmes critiques coûteux', () => {
      const priority = matrix.calculatePriority({
        id: 'test',
        dimension: 'seo',
        title: 'Test',
        description: 'Test',
        severity: 4 as Severity,
        effort: 5 as Effort,
        impact: 5,
        recommendation: 'Fix',
        references: [],
      });

      expect(priority).toBe('low');
    });
  });

  describe('validation', () => {
    it('valide la sévérité', () => {
      expect(matrix.validateSeverity(0)).toBe(true);
      expect(matrix.validateSeverity(4)).toBe(true);
      expect(matrix.validateSeverity(-1)).toBe(false);
      expect(matrix.validateSeverity(5)).toBe(false);
      expect(matrix.validateSeverity(2.5)).toBe(false);
    });

    it('valide l’effort', () => {
      expect(matrix.validateEffort(1)).toBe(true);
      expect(matrix.validateEffort(5)).toBe(true);
      expect(matrix.validateEffort(0)).toBe(false);
      expect(matrix.validateEffort(6)).toBe(false);
      expect(matrix.validateEffort(2.5)).toBe(false);
    });

    it('valide l’impact', () => {
      expect(matrix.validateImpact(1)).toBe(true);
      expect(matrix.validateImpact(5)).toBe(true);
      expect(matrix.validateImpact(0)).toBe(false);
      expect(matrix.validateImpact(6)).toBe(false);
      expect(matrix.validateImpact(3.5)).toBe(false);
    });
  });

  describe('getExamples', () => {
    it('retourne des exemples documentés', () => {
      const examples = SeverityMatrix.getExamples();

      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('severity');
      expect(examples[0]).toHaveProperty('effort');
      expect(examples[0]).toHaveProperty('score');
      expect(examples[0]).toHaveProperty('priority');
      expect(examples[0]).toHaveProperty('description');
      expect(examples.every((e) => e.score === e.severity * (6 - e.effort))).toBe(true);
    });
  });
});
