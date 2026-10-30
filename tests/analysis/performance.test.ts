import { describe, expect, it } from 'vitest';

import { toMeasurement } from '../../src/analysis/measurement.js';
import { PerformanceAnalyzer } from '../../src/analysis/performance.js';
import type { LighthouseResults } from '../../src/analysis/types.js';

/**
 * Fabrique de résultats Lighthouse pour un scénario donné.
 *
 * @param score - Score performance (0-100).
 * @param metrics - Métriques Core Web Vitals.
 * @returns Résultats complets, SEO vierge.
 */
function lighthouseResults(
  score: number,
  metrics: { lcp: number; fid: number; cls: number; ttfb: number },
): LighthouseResults {
  return {
    performance: {
      score,
      // Sprint 19-03 : une métrique est désormais une mesure typée.
      metrics: {
        lcp: toMeasurement(metrics.lcp),
        fid: toMeasurement(metrics.fid),
        cls: toMeasurement(metrics.cls),
        ttfb: toMeasurement(metrics.ttfb),
      },
    },
    seo: { score: 90, issues: [] },
  };
}

describe('PerformanceAnalyzer', () => {
  const analyzer = new PerformanceAnalyzer();

  describe('analyze', () => {
    it('analyse des métriques sans défaut', () => {
      const results = lighthouseResults(95, { lcp: 1500, fid: 50, cls: 0.05, ttfb: 500 });

      const result = analyzer.analyze(results);

      expect(result.dimension).toBe('performance');
      expect(result.score).toBe(95);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Aucun problème');
    });

    it('détecte un LCP critique', () => {
      const results = lighthouseResults(30, { lcp: 5000, fid: 50, cls: 0.05, ttfb: 500 });

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0]?.id).toBe('perf-lcp-critical');
      expect(result.findings[0]?.severity).toBe(4);
      expect(result.findings[0]?.priority).toBe('critical');
    });

    it('détecte un LCP à améliorer', () => {
      const results = lighthouseResults(60, { lcp: 3000, fid: 50, cls: 0.05, ttfb: 500 });

      const result = analyzer.analyze(results);

      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0]?.id).toBe('perf-lcp-warning');
      expect(result.findings[0]?.severity).toBe(2);
      expect(result.findings[0]?.priority).toBe('medium');
    });

    it('détecte un FID critique', () => {
      const results = lighthouseResults(40, { lcp: 1500, fid: 500, cls: 0.05, ttfb: 500 });

      const result = analyzer.analyze(results);

      const fidFinding = result.findings.find((f) => f.id === 'perf-fid-critical');
      expect(fidFinding).toBeDefined();
      expect(fidFinding?.severity).toBe(4);
    });

    it('détecte un CLS critique', () => {
      const results = lighthouseResults(50, { lcp: 1500, fid: 50, cls: 0.3, ttfb: 500 });

      const result = analyzer.analyze(results);

      const clsFinding = result.findings.find((f) => f.id === 'perf-cls-critical');
      expect(clsFinding).toBeDefined();
      expect(clsFinding?.severity).toBe(4);
    });

    it('détecte un TTFB critique', () => {
      const results = lighthouseResults(45, { lcp: 1500, fid: 50, cls: 0.05, ttfb: 2000 });

      const result = analyzer.analyze(results);

      const ttfbFinding = result.findings.find((f) => f.id === 'perf-ttfb-critical');
      expect(ttfbFinding).toBeDefined();
      expect(ttfbFinding?.severity).toBe(3);
    });

    it('analyse plusieurs défauts à la fois', () => {
      const results = lighthouseResults(20, { lcp: 5000, fid: 500, cls: 0.3, ttfb: 2000 });

      const result = analyzer.analyze(results);

      // LCP, FID et CLS atteignent la sévérité 4 ; le TTFB critique s'arrête à 3.
      expect(result.findings.length).toBe(4);
      expect(result.summary).toContain('3 problème(s) critique(s)');
      expect(result.summary).toContain('1 problème(s) important(s)');
    });
  });
});
