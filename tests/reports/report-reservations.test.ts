import { describe, expect, it } from 'vitest';

import type { AuditDiagnostic } from '../../src/storage/audit-diagnostics.js';
import { HtmlReportGenerator } from '../../src/reports/html-generator.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import type { Audit } from '../../src/storage/types.js';

/**
 * Sprint 19-02 — C-W12 : l'incohérence est **signalée** dans les rendus.
 *
 * Le critère demande qu'une incohérence historique et qu'un zéro d'origine
 * inconnue soient signalés. Le diagnostic est calculé par `AuditDiagnostics`
 * (couvert séparément) ; ces tests vérifient qu'il **atteint réellement** les
 * rapports produits, sans qu'aucune donnée ne soit modifiée.
 */

/** Audit minimal valide. */
function makeAudit(): Audit {
  return {
    metadata: {
      id: 12,
      url: 'https://historique.example/reserves',
      timestamp: '2026-10-01T08:00:00.000Z',
      overallScore: 61,
      totalFindings: 1,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension, index) => ({ auditId: 12, dimension, score: 60 + index, findingsCount: 0 }),
    ),
    findings: [
      {
        auditId: 12,
        dimension: 'content',
        title: 'Contenu insuffisant',
        description: 'Historique',
        severity: 3,
        effort: 3,
        impact: 4,
        priority: 'high',
        recommendation: 'Enrichir',
      },
    ],
  };
}

const diagnostics: AuditDiagnostic[] = [
  {
    code: 'priority-mismatch',
    auditId: 12,
    message:
      '« Contenu insuffisant » (content) porte la priorité « high » alors que la matrice donne « medium ».',
    expected: 'medium',
    observed: 'high',
  },
  {
    code: 'unknown-origin-zero',
    auditId: 12,
    message: 'Le compteur « info » vaut 0 alors que cet audit est antérieur à la migration 009.',
    expected: 'inconnue',
    observed: '0',
  },
];

describe('Sprint 19-02 — C-W12 réserves dans les rendus', () => {
  it('affiche les réserves dans le Markdown sans modifier l’audit', async () => {
    const audit = makeAudit();
    const before = JSON.stringify(audit);

    const report = await new MarkdownReportGenerator().generate(audit, {
      diagnostics,
    });

    expect(report.content).toContain('Réserves sur les données');
    expect(report.content).toContain('priority-mismatch');
    expect(report.content).toContain('unknown-origin-zero');
    expect(report.content).toContain('ni corrigées ni réécrites');

    // L'audit source n'est pas altéré par la génération.
    expect(JSON.stringify(audit)).toBe(before);
  });

  it('affiche les réserves dans le HTML', () => {
    const html = new HtmlReportGenerator().generateSync(makeAudit(), { diagnostics });

    expect(html).toContain('Réserves sur les données');
    expect(html).toContain('priority-mismatch');
    expect(html).toContain('unknown-origin-zero');
  });

  it('n’ajoute aucune section quand il n’y a aucune réserve', async () => {
    const markdown = await new MarkdownReportGenerator().generate(makeAudit());
    const html = new HtmlReportGenerator().generateSync(makeAudit());

    expect(markdown.content).not.toContain('Réserves sur les données');
    expect(html).not.toContain('Réserves sur les données');
  });

  it('échappe le contenu des messages dans le HTML', () => {
    const hostile: AuditDiagnostic[] = [
      {
        code: 'priority-mismatch',
        auditId: 12,
        message: '<script>alert("x")</script>',
        expected: 'medium',
        observed: 'high',
      },
    ];

    const html = new HtmlReportGenerator().generateSync(makeAudit(), { diagnostics: hostile });

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
