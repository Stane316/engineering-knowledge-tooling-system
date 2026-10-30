/**
 * Limites d'interprétation des scores (Sprint 20-01, W05 / C-W10).
 *
 * Trois rapports synthétiques, sans navigateur ni base de données :
 *
 * 1. score axe **saturé à 0** ;
 * 2. **UX à 100** obtenu sur un jeu de règles limité ;
 * 3. analyse d'accessibilité **indisponible**.
 *
 * Les assertions vérifient que le rapport signale la limite et n'affirme ni
 * certification WCAG, ni expérience parfaite, ni absence de défauts. La revue
 * humaine de ces trois rendus reste requise par C-W10 : ce test la prépare, il
 * ne la remplace pas.
 */

import { describe, expect, it } from 'vitest';

import { HtmlTemplate } from '../../src/reports/templates/html.js';
import { MarkdownTemplate } from '../../src/reports/templates/markdown.js';
import type { Audit } from '../../src/storage/types.js';

/** Audit synthétique à cinq dimensions. */
function makeAudit(
  scores: Readonly<
    Record<'performance' | 'accessibility' | 'seo' | 'ux' | 'content', number | null>
  >,
  scoreReason?: string,
): Audit {
  return {
    metadata: {
      id: 1,
      url: 'https://example.invalid',
      timestamp: '2026-10-30T10:00:00.000Z',
      overallScore: 80,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension) => ({
        auditId: 1,
        dimension,
        score: scores[dimension],
        ...(scores[dimension] === null ? { scoreReason: scoreReason ?? 'mesure absente' } : {}),
        findingsCount: 0,
      }),
    ),
    findings: [],
  };
}

describe('C-W10 — limite explicite des scores', () => {
  const markdown = new MarkdownTemplate();
  const html = new HtmlTemplate();

  it('1/3 — un score axe saturé à 0 est expliqué comme une saturation', () => {
    const audit = makeAudit({
      performance: 70,
      accessibility: 0,
      seo: 90,
      ux: 85,
      content: 80,
    });

    const report = markdown.generateReport(audit);

    expect(report).toContain('Limites d’interprétation');
    expect(report).toContain('saturé à 0');
    expect(report).toContain('ne certifie aucune conformité WCAG');
    expect(report).not.toContain('conforme WCAG');
    expect(html.generateReport(audit)).toContain('Limites d’interprétation');
  });

  it('2/3 — un score UX de 100 est expliqué comme un jeu de règles limité', () => {
    const audit = makeAudit({
      performance: 70,
      accessibility: 85,
      seo: 90,
      ux: 100,
      content: 80,
    });

    const report = markdown.generateReport(audit);

    expect(report).toContain('jeu limité de règles heuristiques');
    expect(report).toContain('ne garantit ni une expérience parfaite ni l’absence de défauts');
    expect(report).not.toContain('expérience parfaite garantie');
  });

  it('3/3 — une accessibilité indisponible n’est pas présentée comme une absence de défauts', () => {
    const audit = makeAudit(
      { performance: 70, accessibility: null, seo: 90, ux: 85, content: 80 },
      'axe-core indisponible',
    );

    const report = markdown.generateReport(audit);

    expect(report).toContain('Analyse axe-core indisponible');
    expect(report).toContain("n'a pas été évaluée");
    expect(report).not.toContain('accessibility | 🟢');
  });
});
