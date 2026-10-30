import { describe, expect, it } from 'vitest';
import { labVitals } from '../../src/analysis/measurement.js';

import { SEOAnalyzer } from '../../src/analysis/seo.js';
import type { LighthouseResults } from '../../src/analysis/types.js';

/**
 * Fabrique de résultats Lighthouse orientés SEO.
 *
 * @param seoScore - Score SEO (0-100).
 * @param issues - Audits SEO en échec.
 * @returns Résultats complets, performance neutre.
 */
function seoResults(
  seoScore: number,
  issues: LighthouseResults['seo']['issues'],
): LighthouseResults {
  return {
    performance: {
      score: 90,
      metrics: labVitals({
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        ttfb: 500,
      }),
    },
    seo: { score: seoScore, issues },
  };
}

describe('SEOAnalyzer', () => {
  const analyzer = new SEOAnalyzer();

  describe('analyze', () => {
    it('analyse un SEO sans défaut', () => {
      const result = analyzer.analyze(seoResults(100, []));

      expect(result.dimension).toBe('seo');
      expect(result.score).toBe(100);
      expect(result.findings.length).toBe(0);
      expect(result.summary).toContain('Excellente');
    });

    it('analyse une meta description manquante', () => {
      const result = analyzer.analyze(
        seoResults(70, [
          {
            title: 'Meta description',
            description: 'Document does not have a meta description',
            severity: 'error',
          },
        ]),
      );

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.id).toBe('seo-meta-description');
      expect(result.findings[0]?.severity).toBe(3);
      expect(result.findings[0]?.recommendation).toContain('meta description');
      expect(result.findings[0]?.impact).toBe(4);
    });

    it('analyse un titre manquant', () => {
      const result = analyzer.analyze(
        seoResults(80, [
          {
            title: 'Document title',
            description: 'Document does not have a title element',
            severity: 'error',
          },
        ]),
      );

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.id).toBe('seo-document-title');
      expect(result.findings[0]?.severity).toBe(3);
    });

    it('analyse un ordre de headings incorrect', () => {
      const result = analyzer.analyze(
        seoResults(85, [
          {
            title: 'Heading order',
            description: 'Heading elements are not in a sequentially-descending order',
            severity: 'warning',
          },
        ]),
      );

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.severity).toBe(2);
      expect(result.findings[0]?.effort).toBe(2);
      expect(result.findings[0]?.recommendation).toContain('headings');
    });

    it('analyse un problème de liens avec un effort élevé', () => {
      const result = analyzer.analyze(
        seoResults(75, [
          {
            title: 'Link text',
            description: 'Links do not have descriptive text',
            severity: 'warning',
          },
        ]),
      );

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.effort).toBe(3);
      expect(result.findings[0]?.recommendation).toContain('liens');
    });

    it('recule sur une recommandation générique pour un audit inconnu', () => {
      const result = analyzer.analyze(
        seoResults(60, [
          {
            title: 'Hreflang',
            description: 'No valid hreflang',
            severity: 'info',
          },
        ]),
      );

      expect(result.findings.length).toBe(1);
      expect(result.findings[0]?.severity).toBe(1);
      // effort par défaut de la rampe « heading/structure » non touchée.
      expect(result.findings[0]?.effort).toBe(2);
      expect(result.findings[0]?.priority).toBe('low');
      expect(result.findings[0]?.recommendation).toContain('Corriger le problème');
    });

    it('analyse plusieurs audits', () => {
      const result = analyzer.analyze(
        seoResults(50, [
          {
            title: 'Meta description',
            description: 'Missing meta description',
            severity: 'error',
          },
          {
            title: 'Heading order',
            description: 'Invalid heading order',
            severity: 'warning',
          },
        ]),
      );

      expect(result.findings.length).toBe(2);
      expect(result.summary).toContain('2 problème(s)');
      expect(result.summary).toContain('1 erreur(s)');
      expect(result.summary).toContain('1 avertissement(s)');
    });
  });
});
