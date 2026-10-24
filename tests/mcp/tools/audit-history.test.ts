import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisReport, Finding } from '../../../src/analysis/types.js';
import { AuditHistoryInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeAuditHistory } from '../../../src/mcp/tools/audit-history.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

/** Constat minimal. */
function makeFinding(): Finding {
  return {
    id: 'f-hist',
    dimension: 'accessibility',
    title: 'Contraste faible',
    description: 'Texte secondaire sous 4,5:1',
    severity: 2,
    effort: 1,
    impact: 3,
    priority: 'medium',
    recommendation: 'Renforcer le contraste du texte secondaire',
    references: [],
  };
}

/** Rapport d'analyse minimal conforme au contrat Sprint 9. */
function makeReport(url: string, score: number): AnalysisReport {
  const findings = score < 80 ? [makeFinding()] : [];
  const dimensions = ['performance', 'accessibility', 'seo', 'ux', 'content'] as const;

  return {
    url,
    timestamp: '2026-10-24T10:00:00.000Z',
    dimensions: Object.fromEntries(
      dimensions.map((dimension) => [
        dimension,
        {
          dimension,
          score,
          findings: dimension === 'accessibility' ? findings : [],
          summary: `Score ${dimension} : ${String(score)}/100.`,
        },
      ]),
    ) as AnalysisReport['dimensions'],
    findings,
    priorityFindings: [...findings],
    summary: {
      totalFindings: findings.length,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: findings.length,
      lowFindings: 0,
      overallScore: score,
    },
  };
}

describe('audit_history', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
    seedResources(fixture.services);
    fixture.services.audits.repository.store(makeReport('https://example.com', 70));
    fixture.services.audits.repository.store(makeReport('https://example.com', 92));
    fixture.services.audits.repository.store(makeReport('https://autre.fr', 55));
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('liste les audits avec leurs scores et dimensions', async () => {
    const result = await executeAuditHistory(fixture.services, AuditHistoryInput.parse({}));

    expect(result.count).toBe(3);
    expect(result.audits).toHaveLength(3);
    expect(result.audits.map((audit) => audit.url).sort()).toEqual([
      'https://autre.fr',
      'https://example.com',
      'https://example.com',
    ]);
    expect(result.audits[0]?.dimensions).toHaveLength(5);
    expect(result.statistics.total_audits).toBe(3);
    expect(result.statistics.min_score).toBe(55);
    expect(result.statistics.max_score).toBe(92);
  });

  it('filtre par URL et adapte les statistiques', async () => {
    const result = await executeAuditHistory(
      fixture.services,
      AuditHistoryInput.parse({ url: 'https://autre.fr' }),
    );

    expect(result.count).toBe(1);
    expect(result.audits.every((audit) => audit.url === 'https://autre.fr')).toBe(true);
    expect(result.statistics.total_audits).toBe(1);
    expect(result.statistics.average_score).toBe(55);
  });

  it('applique score_min, score_max et limit', async () => {
    const high = await executeAuditHistory(
      fixture.services,
      AuditHistoryInput.parse({ score_min: 90 }),
    );
    expect(high.count).toBe(1);
    expect(high.audits[0]?.overall_score).toBe(92);

    const capped = await executeAuditHistory(
      fixture.services,
      AuditHistoryInput.parse({ limit: 2 }),
    );
    expect(capped.count).toBe(2);
    expect(capped.statistics.total_audits).toBe(3);

    const window = await executeAuditHistory(
      fixture.services,
      AuditHistoryInput.parse({ score_min: 60, score_max: 80 }),
    );
    expect(window.count).toBe(1);
    expect(window.audits[0]?.overall_score).toBe(70);
  });

  it('refuse des bornes hors plage', () => {
    expect(AuditHistoryInput.safeParse({ score_min: 120 }).success).toBe(false);
    expect(AuditHistoryInput.safeParse({ limit: 0 }).success).toBe(false);
    expect(AuditHistoryInput.safeParse({ url: 'nope' }).success).toBe(false);
  });

  it('répond en moins de 2 secondes (budget C11.6)', async () => {
    const started = performance.now();
    const result = await executeAuditHistory(fixture.services, AuditHistoryInput.parse({}));
    const elapsed = performance.now() - started;

    expect(result.count).toBe(3);
    expect(elapsed).toBeLessThan(2_000);
  }, 5_000);
});
