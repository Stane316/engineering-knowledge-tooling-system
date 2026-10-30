/**
 * Rendu sûr des textes non fiables (Sprint 20-03, W05 + O06 / C-W14).
 *
 * Des constats synthétiques portent du HTML hostile. Les rapports doivent
 * présenter ce texte **comme des données** : jamais de balise active issue du
 * contenu, ni dans le Markdown étendu ni dans le HTML.
 *
 * L'invariant testé est volontairement strict et vérifiable : aucune balise du
 * contenu hostile ne subsiste à l'état brut ; elle n'existe plus que sous forme
 * échappée. Une occurrence de `javascript:` en **texte** n'est pas une balise :
 * c'est au lecteur (navigateur, rendu Markdown) d'appliquer sa propre politique
 * de liens, ce qui sort du périmètre de C-W14.
 */

import { describe, expect, it } from 'vitest';

import { HtmlTemplate } from '../../src/reports/templates/html.js';
import { MarkdownTemplate } from '../../src/reports/templates/markdown.js';
import type { Audit } from '../../src/storage/types.js';

const hostile = '<script>alert(1)</script><img src=x onerror=alert(2)>';
const escaped = '&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;';

/** Audit dont tous les textes libres sont hostiles. */
function hostileAudit(): Audit {
  return {
    metadata: {
      id: 1,
      url: 'https://example.invalid',
      timestamp: '2026-10-30T10:00:00.000Z',
      overallScore: 50,
      totalFindings: 1,
      criticalFindings: 1,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension) => ({
        auditId: 1,
        dimension,
        score: 50,
        findingsCount: dimension === 'performance' ? 1 : 0,
      }),
    ),
    findings: [
      {
        id: 1,
        auditId: 1,
        dimension: 'performance',
        title: `Titre ${hostile}`,
        description: `Description ${hostile}`,
        severity: 4,
        effort: 2,
        impact: 5,
        priority: 'critical',
        recommendation: `Action ${hostile}`,
      },
    ],
  };
}

describe('C-W14 — sorties non exécutables', () => {
  it('neutralise le HTML hostile dans le rendu Markdown', () => {
    const report = new MarkdownTemplate().generateReport(hostileAudit());

    expect(report).not.toContain('<script');
    expect(report).not.toContain('<img');
    expect(report).toContain(escaped);
  });

  it('neutralise le HTML hostile dans le rendu HTML', () => {
    const report = new HtmlTemplate().generateReport(hostileAudit());

    expect(report).not.toContain('<script');
    expect(report).not.toContain('<img');
    expect(report).toContain(escaped);
    // Aucun lien actif ne doit être fabriqué à partir du contenu.
    expect(report).not.toMatch(/<a[^>]+javascript:/i);
  });
});
