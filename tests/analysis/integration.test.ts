import { describe, expect, it } from 'vitest';
import { labVitals } from '../../src/analysis/measurement.js';

import { fromInspection } from '../../src/analysis/adapter.js';
import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import type { L3InspectionResult } from '../../src/browser/inspection/types.js';
import type { Priority } from '../../src/analysis/types.js';

/**
 * Ordre de priorité pour vérifier le tri (identique au priorisateur).
 */
const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

/**
 * Vérifie que chaque constat du rapport trié précède (ou égale) le suivant.
 *
 * @param priorities - Priorités dans l'ordre du tableau trié.
 */
function expectSortedByPriority(priorities: readonly Priority[]): void {
  for (let i = 1; i < priorities.length; i++) {
    const previous = PRIORITY_ORDER[priorities[i - 1]!];
    const current = PRIORITY_ORDER[priorities[i]!];

    expect(previous).toBeGreaterThanOrEqual(current);
  }
}

/** Champs d'inspection L3, valeurs réelles relevées sur example.com (Sprint 8). */
const inspectionFixture: Pick<L3InspectionResult, 'lighthouse' | 'axe' | 'ux' | 'content'> = {
  lighthouse: {
    performance: {
      score: 100,
      // INP 39 réel sur example.com, volontairement porté à 150 ms ici :
      // sous le seuil, aucun constat FID ne serait produit et la chaîne
      // inp → fid → `perf-fid-warning` ne serait pas exercée de bout en bout.
      metrics: labVitals({
        lcp: 227,
        inp: 150,
        cls: 0.004,
        ttfb: 83,
        fcp: 180,
        'speed-index': 260,
      }),
    },
    seo: {
      score: 80,
      issues: [
        {
          id: 'meta-description',
          title: 'Meta description',
          description: 'Document does not have a meta description',
          severity: 'error',
        },
        {
          id: 'canonical',
          title: 'Canonical',
          description: 'Document does not have a valid rel=canonical',
          severity: 'warning',
        },
      ],
    },
    url: 'https://example.com/',
    version: '13.5.0',
    duration: 3840,
  },
  axe: {
    violations: [
      {
        id: 'region',
        impact: 'moderate',
        description: 'All page content should be contained by landmarks',
        help: 'Ensure all content is contained within landmarks',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/region',
        nodes: 2,
        tags: ['best-practice'],
      },
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
        nodes: 1,
        tags: ['wcag2aa'],
      },
    ],
    score: 73,
    passCount: 11,
    inapplicableCount: 40,
    duration: 300,
  },
  ux: {
    score: 85,
    heuristics: [
      {
        id: 'status',
        name: 'Visibility of system status',
        score: 100,
        issues: [],
      },
      {
        id: 'help',
        name: 'Help and documentation',
        score: 60,
        issues: ["Pas d'aide contextuelle"],
      },
    ],
  },
  content: {
    score: 55,
    wordCount: 133,
    readingTime: 1,
    readabilityScore: 77,
    structure: { paragraphs: 4, lists: 0, tables: 0, headings: 2 },
  },
};

describe('intégration de l’analyse (fixtures d’inspection réelles)', () => {
  it('passe d’un résultat d’inspection à un rapport complet', async () => {
    const inputs = fromInspection(inspectionFixture);
    const report = await new AnalysisPipeline().analyze(
      'https://example.com',
      inputs.lighthouse,
      inputs.axe,
      inputs.ux,
      inputs.content,
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

    // Sprint 20-01 (W04) : plus aucun constat « FID » ne dérive d'une valeur
    // d'INP. L'INP mesuré (150 ms) reste sous son seuil « bon » (200 ms) et ne
    // produit donc aucun constat ; le FID, non mesuré, est indisponible.
    const perfDimension = report.dimensions.performance;
    expect(perfDimension.findings.find((f) => f.id === 'perf-fid-warning')).toBeUndefined();
    expect(perfDimension.measurements?.['inp']).toEqual({ status: 'measured', value: 150 });
    expect(perfDimension.measurements?.['fid']).toEqual({
      status: 'unavailable',
      reason: 'absent',
    });

    expectSortedByPriority(report.priorityFindings.map((f) => f.priority));
  });

  it('produit un résumé exécutif cohérent avec les comptes', async () => {
    const inputs = fromInspection(inspectionFixture);
    const report = await new AnalysisPipeline().analyze(
      'https://example.com',
      inputs.lighthouse,
      inputs.axe,
      inputs.ux,
      inputs.content,
    );

    const { FindingPrioritizer } = await import('../../src/analysis/prioritizer.js');
    const summary = new FindingPrioritizer().generateExecutiveSummary(report.priorityFindings);

    expect(summary.length).toBeGreaterThan(0);
    expect(summary).toContain('problème(s)');
  });
});

// Volet réseau : inspection réelle d'exemple.com, réservé aux postes qui
// l'autorisent explicitement (pattern EKTS_BROWSER_ONLINE du Sprint 7).
describe.skipIf(process.env.EKTS_BROWSER_ONLINE !== '1')(
  'intégration en ligne (EKTS_BROWSER_ONLINE=1)',
  () => {
    it('inspecte example.com en L3 puis analyse le résultat', { timeout: 60_000 }, async () => {
      const { Inspector } = await import('../../src/browser/inspection/inspector.js');
      const inspector = new Inspector();
      const inspection = await inspector.inspect({
        url: 'https://example.com',
        level: 'L3',
      });

      expect(inspection.level).toBe('L3');

      if (inspection.level !== 'L3') {
        throw new Error('le type de retour doit rester discriminant sur le niveau');
      }

      expect(inspection.lighthouse).not.toBeNull();
      expect(inspection.axe).not.toBeNull();

      const inputs = fromInspection(inspection);
      const report = await new AnalysisPipeline().analyze(
        inspection.url,
        inputs.lighthouse,
        inputs.axe,
        inputs.ux,
        inputs.content,
      );

      expect(report.summary.totalFindings).toBeGreaterThan(0);
      expect(report.summary.overallScore.status).toBe('measured');
      expectSortedByPriority(report.priorityFindings.map((f) => f.priority));
    });
  },
);
