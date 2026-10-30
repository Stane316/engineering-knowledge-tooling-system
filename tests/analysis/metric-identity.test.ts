/**
 * Identité des métriques Core Web Vitals (Sprint 20-01, W04 / C-W08).
 *
 * Ces cas sont écrits **avant** la correction et décrivent le contrat validé :
 * INP, FID, max-potential-fid et TBT restent quatre métriques distinctes, avec
 * unité et origine (`lab` / `field` / `unknown`), et l'absence reste
 * explicitement indisponible — jamais zéro, jamais renommée.
 *
 * Les lectures passent par une vue typée minimale (`readings()`) pour que le
 * fichier **compile avant la correction**. Le rouge obtenu est donc
 * comportemental — une valeur observée différente de la valeur attendue — et
 * non une erreur d'import ou de type.
 */

import { describe, expect, it } from 'vitest';

import { labVitals } from '../../src/analysis/measurement.js';
import type { WebVitals } from '../../src/analysis/measurement.js';
import { PerformanceAnalyzer } from '../../src/analysis/performance.js';
import type { LighthouseResults } from '../../src/analysis/types.js';
import { extractCoreWebVitals } from '../../src/browser/lighthouse.js';

/** Vue de test d'une lecture : identité, unité, origine et mesure. */
interface ReadingView {
  readonly id?: string;
  readonly unit?: string;
  readonly origin?: string;
  readonly measurement?: unknown;
}

/** Rapport Lighthouse minimal : seuls les audits fournis existent. */
function report(audits: Record<string, number | null>): Parameters<typeof extractCoreWebVitals>[0] {
  const built: Record<string, { numericValue: number | null }> = {};

  for (const [id, value] of Object.entries(audits)) {
    built[id] = { numericValue: value };
  }

  return { audits: built } as unknown as Parameters<typeof extractCoreWebVitals>[0];
}

/** Vue des lectures d'un résultat d'extraction. */
function readings(vitals: unknown): Record<string, ReadingView> {
  return vitals as Record<string, ReadingView>;
}

/** Résultats Lighthouse construits depuis des lectures déjà formées. */
function results(metrics: WebVitals): LighthouseResults {
  return {
    performance: { score: 90, metrics },
    seo: { score: 90, issues: [] },
  };
}

/** Noms de métriques portés par les constats produits. */
function metricNames(findings: readonly { metric?: { name?: string } }[]): string[] {
  return findings
    .map((finding) => finding.metric?.name)
    .filter((name): name is string => typeof name === 'string');
}

describe('C-W08 — identité des métriques', () => {
  describe('extraction Lighthouse (U)', () => {
    it('U1 — INP seul : identité, unité, origine conservées ; les trois autres absentes', () => {
      const vitals = readings(extractCoreWebVitals(report({ 'interaction-to-next-paint': 120 })));

      expect(vitals['inp']).toMatchObject({
        id: 'inp',
        unit: 'ms',
        origin: 'lab',
        measurement: { status: 'measured', value: 120 },
      });
      expect(vitals['fid']?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
      expect(vitals['maxPotentialFid']?.measurement).toEqual({
        status: 'unavailable',
        reason: 'absent',
      });
      expect(vitals['tbt']?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
    });

    it('U2 — FID absent et max-potential-fid fourni : aucune substitution', () => {
      const vitals = readings(extractCoreWebVitals(report({ 'max-potential-fid': 320 })));

      expect(vitals['fid']?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
      expect(vitals['maxPotentialFid']).toMatchObject({
        id: 'max-potential-fid',
        unit: 'ms',
        origin: 'lab',
        measurement: { status: 'measured', value: 320 },
      });
      expect(vitals['inp']?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
    });

    it('U3 — max-potential-fid seul ne devient jamais INP', () => {
      const vitals = readings(extractCoreWebVitals(report({ 'max-potential-fid': 800 })));

      expect(vitals['inp']?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
      expect(vitals['maxPotentialFid']?.measurement).toEqual({
        status: 'measured',
        value: 800,
      });
    });

    it('U4 — TBT seul : métrique distincte, unité ms, origine laboratoire', () => {
      const vitals = readings(extractCoreWebVitals(report({ 'total-blocking-time': 640 })));

      expect(vitals['tbt']).toMatchObject({
        id: 'tbt',
        unit: 'ms',
        origin: 'lab',
        measurement: { status: 'measured', value: 640 },
      });
      expect(vitals['inp']?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
    });

    it('U5 — les quatre absentes : aucune valeur nulle de remplacement', () => {
      const vitals = readings(extractCoreWebVitals(report({})));

      for (const id of ['inp', 'fid', 'maxPotentialFid', 'tbt']) {
        expect(vitals[id]?.measurement).toEqual({ status: 'unavailable', reason: 'absent' });
      }
    });
  });

  describe('interprétation (I)', () => {
    it('I1 — un constat INP porte le nom INP, jamais celui de FID', () => {
      const analyzed = new PerformanceAnalyzer().analyze(results(labVitals({ inp: 250 })));

      expect(analyzed.findings.map((finding) => finding.id)).toContain('perf-inp-warning');
      expect(analyzed.findings.map((finding) => finding.id)).not.toContain('perf-fid-warning');
      expect(metricNames(analyzed.findings)).not.toContain('FID');
    });

    it('I2 — un TBT lent produit un constat TBT et les mesures conservent les sept lectures', () => {
      const analyzed = new PerformanceAnalyzer().analyze(results(labVitals({ tbt: 900 })));

      expect(analyzed.findings.map((finding) => finding.id)).toContain('perf-tbt-critical');
      expect(metricNames(analyzed.findings)).toContain('TBT');
      expect(Object.keys(analyzed.measurements ?? {})).toEqual(
        expect.arrayContaining(['lcp', 'inp', 'fid', 'maxPotentialFid', 'tbt', 'cls', 'ttfb']),
      );
    });
  });
});
