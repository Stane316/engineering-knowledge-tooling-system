import { describe, expect, it } from 'vitest';

import {
  fromInspection,
  toAxeResults,
  toContentResults,
  toLighthouseResults,
  toUxResults,
} from '../../src/analysis/adapter.js';
import type {
  AxeAnalysis,
  ContentAnalysis,
  LighthouseAnalysis,
  UxAnalysis,
} from '../../src/browser/inspection/types.js';

/** Analyse Lighthouse de référence (formes exactes du Sprint 8). */
const lighthouseFixture: LighthouseAnalysis = {
  performance: {
    score: 100,
    metrics: { lcp: 220, inp: 36, cls: 0.004, ttfb: 92, fcp: 180, speedIndex: 260 },
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
    ],
  },
  url: 'https://example.com/',
  version: '13.5.0',
  duration: 4200,
};

/** Analyse axe-core de référence. */
const axeFixture: AxeAnalysis = {
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must have sufficient color contrast',
      help: 'Ensure contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
      nodes: 3,
      tags: ['wcag2aa'],
    },
  ],
  score: 73,
  passCount: 11,
  inapplicableCount: 40,
  duration: 300,
};

/** Analyse UX de référence. */
const uxFixture: UxAnalysis = {
  score: 85,
  heuristics: [
    {
      id: 'status',
      name: 'Visibility of system status',
      score: 60,
      issues: ['Pas de progression'],
    },
  ],
};

/** Analyse de contenu de référence (forme plate du Sprint 8). */
const contentFixture: ContentAnalysis = {
  score: 55,
  wordCount: 133,
  readingTime: 1,
  readabilityScore: 77,
  structure: { paragraphs: 4, lists: 0, tables: 0, headings: 2 },
};

describe('pont inspection → analyse', () => {
  describe('toLighthouseResults', () => {
    it('reporte INP dans fid et recopie les audits SEO', () => {
      const result = toLighthouseResults(lighthouseFixture);

      expect(result.performance.score).toBe(100);
      expect(result.performance.metrics.lcp).toBe(220);
      expect(result.performance.metrics.fid).toBe(36); // ← inp du Sprint 8
      expect(result.performance.metrics.cls).toBe(0.004);
      expect(result.performance.metrics.ttfb).toBe(92);
      expect(result.seo.score).toBe(80);
      expect(result.seo.issues).toEqual([
        {
          title: 'Meta description',
          description: 'Document does not have a meta description',
          severity: 'error',
        },
      ]);
      // Le champ `id` du Sprint 8 n'appartient pas au contrat d'analyse.
      expect('id' in result.seo.issues[0]!).toBe(false);
    });

    it('produit un tableau indépendant de l’inspection', () => {
      const result = toLighthouseResults(lighthouseFixture);
      result.seo.issues.push({
        title: 'Ajout',
        description: 'Mutation de test',
        severity: 'info',
      });

      expect(lighthouseFixture.seo.issues.length).toBe(1);
    });
  });

  describe('toAxeResults', () => {
    it('conserve les six champs du contrat et ignore le reste', () => {
      const result = toAxeResults(axeFixture);

      expect(result.score).toBe(73);
      expect(result.violations).toEqual([
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Ensure contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
          nodes: 3,
        },
      ]);
      expect('tags' in result.violations[0]!).toBe(false);
    });
  });

  describe('toUxResults', () => {
    it('recopie les heuristiques', () => {
      const result = toUxResults(uxFixture);

      expect(result.score).toBe(85);
      expect(result.heuristics[0]?.id).toBe('status');
      expect(result.heuristics[0]?.issues).toEqual(['Pas de progression']);

      result.heuristics[0]?.issues.push('Mutation');

      expect(uxFixture.heuristics[0]?.issues.length).toBe(1);
    });
  });

  describe('toContentResults', () => {
    it('regroupe les métriques plates sous metrics', () => {
      const result = toContentResults(contentFixture);

      expect(result.score).toBe(55);
      expect(result.metrics.wordCount).toBe(133);
      expect(result.metrics.readingTime).toBe(1);
      expect(result.metrics.readabilityScore).toBe(77);
      expect('structure' in result).toBe(false);
    });
  });

  describe('fromInspection', () => {
    it('convertit un L3 complet en quatre entrées', () => {
      const inputs = fromInspection({
        lighthouse: lighthouseFixture,
        axe: axeFixture,
        ux: uxFixture,
        content: contentFixture,
      });

      expect(inputs.lighthouse.performance.metrics.fid).toBe(36);
      expect(inputs.axe.score).toBe(73);
      expect(inputs.ux.score).toBe(85);
      expect(inputs.content.metrics.wordCount).toBe(133);
    });

    it('refuse une inspection sans Lighthouse', () => {
      expect(() =>
        fromInspection({
          lighthouse: null,
          axe: axeFixture,
          ux: uxFixture,
          content: contentFixture,
        }),
      ).toThrow(/Lighthouse est indisponible/);
    });

    it('refuse une inspection sans axe-core', () => {
      expect(() =>
        fromInspection({
          lighthouse: lighthouseFixture,
          axe: null,
          ux: uxFixture,
          content: contentFixture,
        }),
      ).toThrow(/axe-core est indisponible/);
    });
  });
});
