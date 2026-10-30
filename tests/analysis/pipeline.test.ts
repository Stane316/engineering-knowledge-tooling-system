import { describe, expect, it } from 'vitest';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import type {
  AxeResults,
  ContentResults,
  LighthouseResults,
  Priority,
  UXResults,
} from '../../src/analysis/types.js';

describe('AnalysisPipeline', () => {
  const pipeline = new AnalysisPipeline();

  const mockLighthouse: LighthouseResults = {
    performance: {
      score: 75,
      metrics: {
        lcp: { status: 'measured', value: 3000 },
        fid: { status: 'measured', value: 150 },
        cls: { status: 'measured', value: 0.15 },
        ttfb: { status: 'measured', value: 1000 },
      },
    },
    seo: {
      score: 80,
      issues: [{ title: 'Meta description', description: 'Missing', severity: 'error' }],
    },
  };

  const mockAxe: AxeResults = {
    violations: [
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Contrast issue',
        help: 'Fix contrast',
        helpUrl: 'https://example.com',
        nodes: 5,
      },
    ],
    score: 70,
  };

  const mockUX: UXResults = {
    score: 65,
    heuristics: [
      {
        id: 'visibility-status',
        name: 'Visibility of system status',
        score: 50,
        issues: ['No loading indicators'],
      },
    ],
  };

  const mockContent: ContentResults = {
    score: 60,
    metrics: { wordCount: 400, readingTime: 2, readabilityScore: 55 },
  };

  describe('analyze', () => {
    it('réalise l’analyse complète', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent,
      );

      expect(report.url).toBe('https://example.com');
      expect(report.timestamp).toBeDefined();
      expect(report.dimensions.performance).toBeDefined();
      expect(report.dimensions.accessibility).toBeDefined();
      expect(report.dimensions.seo).toBeDefined();
      expect(report.dimensions.ux).toBeDefined();
      expect(report.dimensions.content).toBeDefined();
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.priorityFindings.length).toBeGreaterThan(0);
      expect(report.summary.totalFindings).toBeGreaterThan(0);
      expect(report.summary.overallScore.status).toBe('measured');
      const overall = report.summary.overallScore as { status: 'measured'; value: number };
      expect(overall.value).toBeGreaterThanOrEqual(0);
      expect(overall.value).toBeLessThanOrEqual(100);
    });

    it('trie les constats par priorité recalculée', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent,
      );

      const priorities = report.priorityFindings.map((f) => f.priority);
      const priorityOrder: Record<Priority, number> = {
        critical: 5,
        high: 4,
        medium: 3,
        low: 2,
        info: 1,
      };

      for (let i = 1; i < priorities.length; i++) {
        const previous = priorityOrder[priorities[i - 1]!];
        const current = priorityOrder[priorities[i]!];

        expect(previous).toBeGreaterThanOrEqual(current);
      }
    });

    it('calcule le score global pondéré', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent,
      );

      // 75×0.25 + 70×0.25 + 80×0.20 + 65×0.15 + 60×0.15 = 71.25 → 71
      expect(report.summary.overallScore).toEqual({ status: 'measured', value: 71 });
    });

    it('compte les constats par priorité finale', async () => {
      const report = await pipeline.analyze(
        'https://example.com',
        mockLighthouse,
        mockAxe,
        mockUX,
        mockContent,
      );

      expect(report.summary.totalFindings).toBe(
        report.summary.criticalFindings +
          report.summary.highFindings +
          report.summary.mediumFindings +
          report.summary.lowFindings,
      );
      // Les priorités du résumé proviennent du tableau trié.
      const counted = report.priorityFindings.filter((f) => f.priority === 'critical').length;
      expect(report.summary.criticalFindings).toBe(counted);
    });

    it('gère des scores parfaits', async () => {
      const perfectLighthouse: LighthouseResults = {
        performance: {
          score: 100,
          metrics: {
            lcp: { status: 'measured', value: 1500 },
            fid: { status: 'measured', value: 50 },
            cls: { status: 'measured', value: 0.05 },
            ttfb: { status: 'measured', value: 500 },
          },
        },
        seo: { score: 100, issues: [] },
      };
      const perfectAxe: AxeResults = { violations: [], score: 100 };
      const perfectUX: UXResults = { score: 100, heuristics: [] };
      const perfectContent: ContentResults = {
        score: 100,
        metrics: { wordCount: 1000, readingTime: 5, readabilityScore: 75 },
      };

      const report = await pipeline.analyze(
        'https://example.com',
        perfectLighthouse,
        perfectAxe,
        perfectUX,
        perfectContent,
      );

      expect(report.summary.totalFindings).toBe(0);
      expect(report.summary.overallScore).toEqual({ status: 'measured', value: 100 });
      expect(report.priorityFindings).toEqual([]);
    });

    it('analyse 100 constats en moins de 5 secondes (C9.14)', async () => {
      const wideUX: UXResults = {
        score: 50,
        heuristics: Array.from({ length: 40 }, (_, i) => ({
          id: `heuristic-${i}`,
          name: `Heuristique ${i}`,
          score: 30 + (i % 60),
          issues: ['Constat A', 'Constat B', 'Constat C'],
        })),
      };
      const wideAxe: AxeResults = {
        score: 40,
        violations: Array.from({ length: 40 }, (_, i) => ({
          id: `rule-${i}`,
          impact: (['minor', 'moderate', 'serious', 'critical'] as const)[i % 4]!,
          description: `Règle ${i}`,
          help: 'Aide',
          helpUrl: 'https://example.com',
          nodes: i + 1,
        })),
      };
      const wideSeo: LighthouseResults = {
        performance: mockLighthouse.performance,
        seo: {
          score: 50,
          issues: Array.from({ length: 30 }, (_, i) => ({
            title: `Audit SEO ${i}`,
            description: 'Constat',
            severity: (['error', 'warning', 'info'] as const)[i % 3]!,
          })),
        },
      };

      const started = Date.now();
      const report = await pipeline.analyze(
        'https://example.com',
        wideSeo,
        wideAxe,
        wideUX,
        mockContent,
      );
      const elapsed = Date.now() - started;

      expect(report.findings.length).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
