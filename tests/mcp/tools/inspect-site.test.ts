import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../../../src/shared/errors.js';
import { InspectSiteInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { executeInspectSite } from '../../../src/mcp/tools/inspect-site.js';
import type { AnalysisReport } from '../../../src/analysis/types.js';
import type { Audit } from '../../../src/storage/types.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

/** Rapport d'analyse minimal. */
function makeReport(score = 78): AnalysisReport {
  const dim = (name: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content') => ({
    dimension: name,
    score,
    findings: [],
    summary: `Score ${name} : ${String(score)}/100.`,
  });
  return {
    url: 'https://example.com',
    timestamp: '2026-10-24T12:00:00.000Z',
    dimensions: {
      performance: dim('performance'),
      accessibility: dim('accessibility'),
      seo: dim('seo'),
      ux: dim('ux'),
      content: dim('content'),
    },
    findings: [],
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: score,
    },
  };
}

/** Audit minimal correspondant au rapport. */
function makeAudit(): Audit {
  const report = makeReport();
  return {
    metadata: {
      id: 11,
      url: report.url,
      timestamp: report.timestamp,
      overallScore: report.summary.overallScore,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: Object.values(report.dimensions).map((dim) => ({
      auditId: 11,
      dimension: dim.dimension,
      score: dim.score,
      findingsCount: 0,
    })),
    findings: [],
  };
}

describe('inspect_site', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
    seedResources(fixture.services);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("applique le niveau L3 par défaut et valide l'URL", () => {
    expect(InspectSiteInput.parse({ url: 'https://example.com' }).level).toBe('L3');
    expect(InspectSiteInput.safeParse({ url: 'pas-une-url' }).success).toBe(false);
    expect(InspectSiteInput.safeParse({}).success).toBe(false);
    expect(InspectSiteInput.parse({ url: 'https://a.fr', level: 'L1' }).level).toBe('L1');
  });

  it("résume l'audit créé par le service d'inspection", async () => {
    const report = makeReport(81);
    const audit = makeAudit();
    const inspectAndAudit = vi.fn().mockResolvedValue({ audit, report });
    const context = {
      ...fixture.services,
      audits: { ...fixture.services.audits, inspectAndAudit },
    };

    const result = await executeInspectSite(
      context,
      InspectSiteInput.parse({ url: 'https://example.com' }),
    );

    expect(inspectAndAudit).toHaveBeenCalledWith({ url: 'https://example.com', level: 'L3' });
    expect(result).toMatchObject({
      inspection_url: 'https://example.com',
      level: 'L3',
      score: 81,
      total_findings: 0,
      audit_id: 11,
      dimensions: { performance: 81, accessibility: 81, seo: 81, ux: 81, content: 81 },
    });
  });

  it("transmet le projet d'assignation (Sprint 13)", async () => {
    const report = makeReport(80);
    const audit = makeAudit();
    const inspectAndAudit = vi.fn().mockResolvedValue({ audit, report });
    const context = {
      ...fixture.services,
      audits: { ...fixture.services.audits, inspectAndAudit },
    };
    const projectId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

    await executeInspectSite(
      context,
      InspectSiteInput.parse({ url: 'https://example.com', project_id: projectId }),
    );

    expect(inspectAndAudit).toHaveBeenCalledWith({
      url: 'https://example.com',
      level: 'L3',
      projectId,
    });
  });

  it("refuse L1/L2 avant toute navigation (entrée d'analyse incomplète)", async () => {
    const params = InspectSiteInput.parse({ url: 'https://example.com', level: 'L2' });

    // Le garde L3 du service réel s'exécute avant `Inspector.inspect` :
    // aucun réseau n'est sollicité ici.
    await expect(executeInspectSite(fixture.services, params)).rejects.toThrow(ValidationError);
    await expect(executeInspectSite(fixture.services, params)).rejects.toThrow(/L3/);
  });

  it("propage l'échec du service d'inspection", async () => {
    const inspectAndAudit = vi.fn().mockRejectedValue(new Error('navigation impossible'));
    const context = {
      ...fixture.services,
      audits: { ...fixture.services.audits, inspectAndAudit },
    };

    await expect(
      executeInspectSite(context, InspectSiteInput.parse({ url: 'https://example.com' })),
    ).rejects.toThrow('navigation impossible');
  });

  it('achemine via dispatchTool avec des paramètres invalides (-32602)', async () => {
    await expect(dispatchTool(fixture.services, 'inspect_site', { url: 'x' })).rejects.toThrow(
      /invalide|URL/i,
    );
  });
});
