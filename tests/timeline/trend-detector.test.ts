import { describe, expect, it } from 'vitest';

import type { AnalysisDimension } from '../../src/analysis/types.js';
import type { Audit, AuditDimension, AuditMetadata } from '../../src/storage/types.js';
import { TrendDetector } from '../../src/timeline/trend-detector.js';
import type { DimensionTimeline, TimelineAnalysis } from '../../src/timeline/timeline.types.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Timeline minimale : une série par dimension, audits synthétiques. */
function makeTimeline(
  seriesByDimension: Partial<Record<AnalysisDimension, number[]>>,
): TimelineAnalysis {
  const count = Object.values(seriesByDimension)[0]?.length ?? 0;
  const base = Date.parse('2026-10-01T12:00:00.000Z');

  const audits: Audit[] = Array.from({ length: count }, (_, index) => {
    const dimensions: AuditDimension[] = DIMENSIONS.map((dimension) => ({
      auditId: index + 1,
      dimension,
      score: seriesByDimension[dimension]?.[index] ?? 50,
      findingsCount: 0,
    }));
    const metadata: AuditMetadata = {
      id: index + 1,
      url: 'https://example.com',
      timestamp: new Date(base + index * 86_400_000).toISOString(),
      overallScore: Math.round(
        dimensions.reduce((sum, d) => sum + (d.score ?? 0), 0) / dimensions.length,
      ),
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      projectId: 'test-project',
    };
    return { metadata, dimensions, findings: [] };
  });

  const dimensionScores: DimensionTimeline[] = DIMENSIONS.map((dimension) => {
    const scores = seriesByDimension[dimension] ?? [];
    return {
      dimension,
      scores: audits.map((audit, index) => ({
        auditId: audit.metadata.id ?? 0,
        date: new Date(audit.metadata.timestamp),
        score: scores[index] ?? 50,
        findingsCount: 0,
      })),
      trend: { direction: 'stable', slope: 0, confidence: 0, description: 'placeholder' },
      averageScore: scores.length === 0 ? 0 : scores.reduce((sum, s) => sum + s, 0) / scores.length,
      minScore: scores.length === 0 ? 0 : Math.min(...scores),
      maxScore: scores.length === 0 ? 0 : Math.max(...scores),
    };
  });

  const first = audits[0];
  const last = audits[audits.length - 1];
  return {
    projectId: 'test-project',
    projectName: 'Projet test',
    audits,
    startDate: first ? new Date(first.metadata.timestamp) : new Date(0),
    endDate: last ? new Date(last.metadata.timestamp) : new Date(0),
    totalAudits: count,
    dimensionScores,
  };
}

describe('TrendDetector', () => {
  it("détecte une tendance d'amélioration (pente > +2)", () => {
    const detector = new TrendDetector();
    const report = detector.detectTrends(makeTimeline({ performance: [60, 65, 70, 75, 80] }));

    const trend = report.trends.get('performance');
    expect(trend?.direction).toBe('improving');
    expect(trend?.slope).toBeCloseTo(5, 5);
    expect(trend?.confidence).toBeGreaterThan(0.9);
    expect(trend?.description).toContain('Amélioration');

    expect(report.projectId).toBe('test-project');
    expect(report.windowSize).toBe(5);
    expect(report.trends.size).toBe(5);
    expect(report.recommendations.join('\n')).toContain('performance');
  });

  it('détecte une tendance de régression (pente < −2)', () => {
    const detector = new TrendDetector();
    const report = detector.detectTrends(makeTimeline({ accessibility: [90, 85, 80, 75, 70] }));

    const trend = report.trends.get('accessibility');
    expect(trend?.direction).toBe('declining');
    expect(trend?.slope).toBeCloseTo(-5, 5);
    expect(report.recommendations.some((r) => r.startsWith('⚠️'))).toBe(true);
  });

  it('détecte une tendance stable (−2 ≤ pente ≤ +2)', () => {
    const detector = new TrendDetector();
    const report = detector.detectTrends(makeTimeline({ seo: [70, 71, 70, 71, 70] }));

    const trend = report.trends.get('seo');
    expect(trend?.direction).toBe('stable');
    expect(Math.abs(trend?.slope ?? 99)).toBeLessThanOrEqual(2);
    expect(report.overallTrend.direction).toBe('stable');
  });

  it('gère les séries courtes (< 2 points) sans erreur (C14.15)', () => {
    const detector = new TrendDetector();
    const report = detector.detectTrends(makeTimeline({ ux: [72] }));

    const trend = report.trends.get('ux');
    expect(trend?.direction).toBe('stable');
    expect(trend?.slope).toBe(0);
    expect(trend?.confidence).toBe(0);
    expect(trend?.description).toContain('Pas assez de données');
    expect(report.recommendations).toEqual(['📊 Toutes les dimensions sont stables.']);
  });

  it('respecte une configuration personnalisée (fenêtre et seuils)', () => {
    const detector = new TrendDetector({
      windowSize: 3,
      improvementThreshold: 10,
      regressionThreshold: -10,
    });

    // Pente +5 : au-dessus de +2 par défaut, mais en dessous de +10 demandé.
    const lenient = new TrendDetector().detectTrends(
      makeTimeline({ content: [60, 65, 70, 75, 80] }),
    );
    const strict = detector.detectTrends(makeTimeline({ content: [60, 65, 70, 75, 80] }));

    expect(lenient.trends.get('content')?.direction).toBe('improving');
    expect(strict.windowSize).toBe(3);
    expect(strict.trends.get('content')?.direction).toBe('stable');

    // Fenêtre de 3 : les 3 derniers points (70, 75, 80) → pente +5 réel.
    expect(strict.trends.get('content')?.slope).toBeCloseTo(5, 5);
  });

  it('génère des recommandations par dimension en régression et amélioration', () => {
    const detector = new TrendDetector();
    const report = detector.detectTrends(
      makeTimeline({
        performance: [60, 65, 70, 75, 80],
        accessibility: [90, 85, 80, 75, 70],
        seo: [70, 70, 70, 70, 70],
        ux: [70, 70, 70, 70, 70],
        content: [70, 70, 70, 70, 70],
      }),
    );

    expect(report.recommendations.some((r) => r.includes('performance'))).toBe(true);
    expect(report.recommendations.some((r) => r.includes('accessibility'))).toBe(true);
    expect(report.recommendations).toHaveLength(2);
    // +5 et −5 sur cinq dimensions : la pente moyenne globale est nulle.
    expect(report.overallTrend.direction).toBe('stable');
  });

  it('refuse une fenêtre < 2 à la construction', () => {
    expect(() => new TrendDetector({ windowSize: 1 })).toThrow(RangeError);
    expect(() => new TrendDetector({ windowSize: 2.5 })).toThrow(RangeError);
  });

  it('détecte les régressions entre audits consécutifs (seuil 10 points)', () => {
    const detector = new TrendDetector();
    // −15 points partout : score global ET 5 dimensions chutent au-delà du seuil.
    const timeline = makeTimeline({
      performance: [80, 65],
      accessibility: [80, 65],
      seo: [80, 65],
      ux: [80, 65],
      content: [80, 65],
    });

    const regressions = detector.detectRegressions(timeline);

    // Overall + 5 dimensions : exactement 6 régressions.
    expect(regressions).toHaveLength(6);
    expect(regressions.map((r) => r.dimension).sort()).toEqual([
      'accessibility',
      'content',
      'overall',
      'performance',
      'seo',
      'ux',
    ]);
    expect(regressions[0]?.regressionPoints).toBe(15);
    expect(regressions[0]?.auditIdFrom).toBe(1);
    expect(regressions[0]?.auditIdTo).toBe(2);
    expect(regressions[0]?.projectId).toBe('test-project');
    expect(regressions[0]?.dateFrom.getTime()).toBeLessThan(
      regressions[0]?.dateTo.getTime() ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it('ignore les variations sous le seuil (alertes non-bloquantes, C14.14)', () => {
    const detector = new TrendDetector();
    const regressions = detector.detectRegressions(
      makeTimeline({
        performance: [80, 75], // -5 points : sous le seuil de 10.
        accessibility: [70, 70],
        seo: [70, 70],
        ux: [70, 70],
        content: [70, 70],
      }),
    );

    expect(regressions).toHaveLength(0);
  });

  it('accepte un seuil personnalisé et refuse un seuil invalide', () => {
    const detector = new TrendDetector();
    const timeline = makeTimeline({
      performance: [80, 75],
      accessibility: [70, 70],
      seo: [70, 70],
      ux: [70, 70],
      content: [70, 70],
    });

    // Performance seule : −5 (au-dessus du seuil 4), global −3 (en dessous).
    expect(detector.detectRegressions(timeline, 4)).toHaveLength(1);
    expect(() => detector.detectRegressions(timeline, 0)).toThrow(RangeError);
    expect(() => detector.detectRegressions(timeline, Number.NaN)).toThrow(RangeError);
  });

  it('retourne un rapport vide cohérent pour une timeline sans audit', () => {
    const detector = new TrendDetector();
    const report = detector.detectTrends(makeTimeline({}));

    expect(report.trends.size).toBe(5);
    expect(report.overallTrend.direction).toBe('stable');
    expect(report.recommendations).toEqual(['📊 Toutes les dimensions sont stables.']);
  });
});
