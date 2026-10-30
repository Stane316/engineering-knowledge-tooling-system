import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisReport, Finding } from '../../../src/analysis/types.js';
import { ResourceNotFoundError } from '../../../src/shared/errors.js';
import { AuditReportInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeAuditReport } from '../../../src/mcp/tools/audit-report.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

/** Constat avec recommandation. */
function makeFinding(): Finding {
  return {
    id: 'f-rep',
    dimension: 'performance',
    title: 'LCP trop élevé',
    description: 'LCP à 4,8 s',
    severity: 4,
    effort: 2,
    impact: 5,
    priority: 'critical',
    recommendation: "Précharger l'image héros",
    references: [],
  };
}

/** Rapport d'analyse minimal. */
function makeReport(url = 'https://example.com'): AnalysisReport {
  const findings = [makeFinding()];
  const dimensions = ['performance', 'accessibility', 'seo', 'ux', 'content'] as const;

  return {
    url,
    timestamp: '2026-10-24T10:00:00.000Z',
    dimensions: Object.fromEntries(
      dimensions.map((dimension) => [
        dimension,
        {
          dimension,
          score: 72,
          findings: dimension === 'performance' ? findings : [],
          summary: `Score ${dimension} : 72/100.`,
        },
      ]),
    ) as AnalysisReport['dimensions'],
    findings,
    priorityFindings: [...findings],
    summary: {
      totalFindings: 1,
      criticalFindings: 1,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: { status: 'measured', value: 72 },
    },
  };
}

describe('audit_report', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
    seedResources(fixture.services);
    fixture.services.audits.repository.store(makeReport());
    fixture.services.audits.repository.store(makeReport('https://autre.fr'));
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('génère le rapport Markdown complet en mémoire', async () => {
    const result = await executeAuditReport(
      fixture.services,
      AuditReportInput.parse({ audit_id: 1 }),
    );

    expect(result.audit_id).toBe(1);
    expect(result.format).toBe('markdown');
    expect(result.url).toBe('https://example.com');
    expect(() => new Date(result.generated_at).toISOString()).not.toThrow();

    expect(result.report_content).toContain("# 📊 Rapport d'audit — https://example.com");
    expect(result.report_content).toContain('## 📈 Résumé');
    expect(result.report_content).toContain('## 🎯 Scores par dimension');
    expect(result.report_content).toContain('LCP trop élevé');
    expect(result.report_content).toContain("Précharger l'image héros");
  });

  it("retourne l'audit demandé (id 2)", async () => {
    const result = await executeAuditReport(
      fixture.services,
      AuditReportInput.parse({ audit_id: 2 }),
    );
    expect(result.url).toBe('https://autre.fr');
    expect(result.report_content).toContain('https://autre.fr');
  });

  it('demande le format texte par défaut égal à markdown, texte accepté', async () => {
    const explicit = await executeAuditReport(
      fixture.services,
      AuditReportInput.parse({ audit_id: 1, format: 'text' }),
    );
    expect(explicit.format).toBe('text');
    expect(explicit.report_content.length).toBeGreaterThan(100);
  });

  it('échoue avec RESOURCE_NOT_FOUND pour un identifiant inconnu', async () => {
    await expect(
      executeAuditReport(fixture.services, AuditReportInput.parse({ audit_id: 999 })),
    ).rejects.toThrow(ResourceNotFoundError);
    await expect(
      executeAuditReport(fixture.services, AuditReportInput.parse({ audit_id: 999 })),
    ).rejects.toThrow(/audit #999/);
  });

  it("valide l'identifiant et le format", () => {
    expect(AuditReportInput.safeParse({ audit_id: 0 }).success).toBe(false);
    expect(AuditReportInput.safeParse({ audit_id: 1.5 }).success).toBe(false);
    expect(AuditReportInput.safeParse({ audit_id: 1, format: 'pdf' }).success).toBe(false);
  });
});
