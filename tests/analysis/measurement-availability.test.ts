import { describe, expect, it } from 'vitest';

import { toLighthouseResults } from '../../src/analysis/adapter.js';
import { measuredValueOf, toMeasurement } from '../../src/analysis/measurement.js';
import { PerformanceAnalyzer } from '../../src/analysis/performance.js';
import type { LighthouseResults } from '../../src/analysis/types.js';
import type { LighthouseAnalysis } from '../../src/browser/inspection/types.js';

/**
 * Sprint 19-03 — C-W05 : une mesure absente n'est jamais un `0`.
 *
 * Le défaut corrigé : `numericValue()` de `src/browser/lighthouse.ts` et les
 * analyseurs remplaçaient une métrique manquante par `0`. Un LCP de `0 ms` se
 * lit comme excellent et devient indistinguable d'une mesure réellement nulle.
 *
 * L'oracle attend quatre comportements observables :
 * 1. une valeur réellement mesurée — y compris `0` — reste mesurée ;
 * 2. une valeur absente, `null`, `NaN` ou infinie est explicitement indisponible ;
 * 3. aucun constat n'est dérivé d'une mesure indisponible ;
 * 4. la métrique indisponible traverse l'adaptateur sans redevenir un nombre.
 */

describe('C-W05 — toMeasurement', () => {
  it('conserve un zéro réellement mesuré', () => {
    expect(toMeasurement(0)).toEqual({ status: 'measured', value: 0 });
  });

  it('conserve une valeur négative telle quelle (le jugement relève des seuils)', () => {
    expect(toMeasurement(-3)).toEqual({ status: 'measured', value: -3 });
  });

  it('marque une propriété absente comme indisponible', () => {
    expect(toMeasurement(undefined)).toEqual({ status: 'unavailable', reason: 'absent' });
  });

  it('distingue `null` de l’absence de propriété', () => {
    expect(toMeasurement(null)).toEqual({ status: 'unavailable', reason: 'null' });
  });

  it('marque `NaN` comme indisponible sans le confondre avec 0', () => {
    expect(toMeasurement(Number.NaN)).toEqual({ status: 'unavailable', reason: 'nan' });
  });

  it('marque les infinis comme indisponibles', () => {
    expect(toMeasurement(Number.POSITIVE_INFINITY)).toEqual({
      status: 'unavailable',
      reason: 'infinite-positive',
    });
    expect(toMeasurement(Number.NEGATIVE_INFINITY)).toEqual({
      status: 'unavailable',
      reason: 'infinite-negative',
    });
  });

  it('ne restitue une valeur que si elle est mesurée', () => {
    expect(measuredValueOf({ status: 'measured', value: 0 })).toBe(0);
    expect(measuredValueOf({ status: 'unavailable', reason: 'absent' })).toBeUndefined();
    expect(measuredValueOf(undefined)).toBeUndefined();
  });
});

describe('C-W05 — PerformanceAnalyzer', () => {
  const analyzer = new PerformanceAnalyzer();

  /** Résultats dont toutes les métriques sont indisponibles. */
  const unavailableMetrics: LighthouseResults = {
    performance: {
      score: 90,
      metrics: {
        lcp: { status: 'unavailable', reason: 'absent' },
        fid: { status: 'unavailable', reason: 'absent' },
        cls: { status: 'unavailable', reason: 'absent' },
        ttfb: { status: 'unavailable', reason: 'absent' },
      },
    },
    seo: { score: 90, issues: [] },
  };

  it('ne dérive aucun constat d’une mesure indisponible', () => {
    const dimension = analyzer.analyze(unavailableMetrics);

    expect(dimension.findings).toEqual([]);
    // Le score fourni par Lighthouse reste publié : seule la mesure manquait.
    expect(dimension.score).toBe(90);
    expect(dimension.status).toBe('measured');
  });

  it('expose les métriques indisponibles telles quelles', () => {
    const dimension = analyzer.analyze(unavailableMetrics);

    expect(dimension.measurements).toEqual({
      lcp: { status: 'unavailable', reason: 'absent' },
      fid: { status: 'unavailable', reason: 'absent' },
      cls: { status: 'unavailable', reason: 'absent' },
      ttfb: { status: 'unavailable', reason: 'absent' },
    });
  });

  it('dérive un constat du LCP seulement si la mesure existe', () => {
    const absent = analyzer.analyze({
      ...unavailableMetrics,
      performance: {
        score: 90,
        metrics: { ...unavailableMetrics.performance.metrics },
      },
    });
    const measured = analyzer.analyze({
      ...unavailableMetrics,
      performance: {
        score: 90,
        metrics: {
          ...unavailableMetrics.performance.metrics,
          lcp: { status: 'measured', value: 5000 },
        },
      },
    });

    expect(absent.findings.map((finding) => finding.id)).not.toContain('perf-lcp-critical');
    expect(measured.findings.map((finding) => finding.id)).toContain('perf-lcp-critical');
  });

  it('rend la dimension indisponible quand le score manque, sans perdre les constats', () => {
    const dimension = analyzer.analyze({
      performance: {
        score: null,
        metrics: {
          lcp: { status: 'measured', value: 5000 },
          fid: { status: 'measured', value: 50 },
          cls: { status: 'measured', value: 0.05 },
          ttfb: { status: 'measured', value: 400 },
        },
      },
      seo: { score: 80, issues: [] },
    });

    expect(dimension.status).toBe('unavailable');
    expect(dimension.score).toBeNull();
    expect(dimension.unavailableReason).toBe('score-absent');
    expect(dimension.findings.length).toBeGreaterThan(0);
  });
});

describe('C-W05 — adaptateur Lighthouse', () => {
  /** Analyse de navigateur minimale, métriques absentes. */
  const analysis: LighthouseAnalysis = {
    performance: {
      score: null,
      metrics: { lcp: null, inp: null, cls: null, ttfb: null, fcp: null, speedIndex: null },
    },
    seo: { score: null, issues: [] },
    url: 'https://example.com',
    version: '12.0.0',
    duration: 1200,
  };

  it('convertit une métrique absente en mesure indisponible', () => {
    const results = toLighthouseResults(analysis);

    expect(results.performance.metrics.lcp).toEqual({ status: 'unavailable', reason: 'null' });
    expect(results.performance.metrics.fid).toEqual({ status: 'unavailable', reason: 'null' });
  });

  it('ne fabrique pas de score quand Lighthouse n’en fournit aucun', () => {
    const results = toLighthouseResults(analysis);

    expect(results.performance.score).toBeNull();
    expect(results.seo.score).toBeNull();
  });

  it('conserve un zéro mesuré par Lighthouse', () => {
    const results = toLighthouseResults({
      ...analysis,
      performance: {
        score: 100,
        metrics: { lcp: 0, inp: null, cls: null, ttfb: null, fcp: null, speedIndex: null },
      },
    });

    expect(results.performance.metrics.lcp).toEqual({ status: 'measured', value: 0 });
    expect(results.performance.metrics.fid).toEqual({ status: 'unavailable', reason: 'null' });
  });
});
