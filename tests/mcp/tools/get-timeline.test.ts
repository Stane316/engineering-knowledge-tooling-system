import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { McpError } from '@modelcontextprotocol/sdk/types.js';

import type { AnalysisDimension, AnalysisReport } from '../../../src/analysis/types.js';
import { openDatabase } from '../../../src/data/database.js';
import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { McpErrorCode, toErrorPayload } from '../../../src/mcp/utils/errors.js';
import { ProjectNotFoundError } from '../../../src/shared/errors.js';
import type { Project } from '../../../src/shared/validators.js';
import { AuditRepository } from '../../../src/storage/audit-repository.js';
import { AuditSchema } from '../../../src/storage/schema.js';
import { openTestServices, type TestServices } from '../helpers.js';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';
const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Rapport homogène pour les fixtures d'audit. */
function makeReport(score: number, timestamp: string): AnalysisReport {
  return {
    url: 'https://example.com',
    timestamp,
    dimensions: Object.fromEntries(
      DIMENSIONS.map((name) => [
        name,
        { dimension: name, score, findings: [], summary: `${name} ${score}` },
      ]),
    ) as unknown as AnalysisReport['dimensions'],
    findings: [],
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      overallScore: score,
    },
  };
}

interface TimelineResult {
  projectId: string;
  projectName: string;
  period: { start: string; end: string };
  totalAudits: number;
  dimensions: Record<string, { averageScore: number; scores: unknown[] }>;
  trends: Record<string, { direction: string }>;
  overallTrend: { direction: string };
  recommendations: string[];
  regressions: Array<{ dimension: string; regressionPoints: number }>;
  alerts?: { active: number; list: Array<{ id: string }> };
  charts?: { svg: string };
  summary: string;
}

describe('MCP — get_timeline (Sprint 14-3)', () => {
  let fixture: TestServices;
  let projectId: string;

  /** Insère des audits quotidiens dans le projet du fixture. */
  function seedAudits(series: readonly number[]): void {
    const database = openDatabase({ dataDir: fixture.dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      const base = Date.parse('2026-10-01T12:00:00.000Z');
      series.forEach((score, index) => {
        repository.store(makeReport(score, new Date(base + index * 86_400_000).toISOString()), {
          projectId,
        });
      });
    } finally {
      database.close();
    }
  }

  beforeEach(async () => {
    fixture = openTestServices();
    const created = (await dispatchTool(fixture.services, 'create_project', {
      name: 'Site timeline',
    })) as { project: Project };
    projectId = created.project.id;
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('retourne période, dimensions, tendances, régressions et résumé (C14.7)', async () => {
    seedAudits([60, 65, 70, 75, 80]);

    const result = (await dispatchTool(fixture.services, 'get_timeline', {
      project_id: projectId,
    })) as TimelineResult;

    expect(result.projectId).toBe(projectId);
    expect(result.projectName).toBe('Site timeline');
    expect(result.totalAudits).toBe(5);
    expect(result.period.start < result.period.end).toBe(true);

    expect(Object.keys(result.dimensions)).toHaveLength(5);
    expect(result.dimensions.performance?.scores).toHaveLength(5);
    expect(result.dimensions.performance?.averageScore).toBe(70);

    expect(Object.keys(result.trends)).toHaveLength(5);
    expect(result.trends.performance?.direction).toBe('improving');
    expect(result.overallTrend.direction).toBe('improving');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.regressions).toHaveLength(0);

    expect(result.summary).toContain('## Timeline : Site timeline');
    expect(result.summary).toContain('**Audits :** 5');
  });

  it('applique les défauts (lookback 90 j, seuil 10, alertes incluses)', async () => {
    seedAudits([90, 50]);

    const result = (await dispatchTool(fixture.services, 'get_timeline', {
      project_id: projectId,
    })) as TimelineResult;

    expect(result.regressions.length).toBeGreaterThan(0);
    expect(result.alerts).toBeDefined();
    expect(result.alerts?.active).toBe(0); // aucune alerte persistée à la lecture
    expect(result.summary).toContain('Régressions (> 10 points)');
  });

  it('exclut les alertes avec include_alerts: false et joint le SVG avec include_charts', async () => {
    seedAudits([70, 72]);

    const withoutAlerts = (await dispatchTool(fixture.services, 'get_timeline', {
      project_id: projectId,
      include_alerts: false,
    })) as TimelineResult;
    expect(withoutAlerts.alerts).toBeUndefined();

    const withChart = (await dispatchTool(fixture.services, 'get_timeline', {
      project_id: projectId,
      include_charts: true,
    })) as TimelineResult;
    expect(withChart.charts?.svg).toContain('<svg');
    expect(withChart.charts?.svg).toContain('</svg>');
  });

  it('accepte la fenêtre start_date/end_date (bornes YYYY-MM-DD)', async () => {
    seedAudits([60, 70, 80, 90, 100]);

    const result = (await dispatchTool(fixture.services, 'get_timeline', {
      project_id: projectId,
      start_date: '2026-10-02',
      end_date: '2026-10-03',
    })) as TimelineResult;
    expect(result.totalAudits).toBe(2);
  });

  it('signale un projet absent en -32000 (ProjectNotFoundError)', async () => {
    const error = await dispatchTool(fixture.services, 'get_timeline', {
      project_id: MISSING_ID,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ProjectNotFoundError);
    expect(toErrorPayload(error).code).toBe(McpErrorCode.ResourceNotFound);
  });

  it('refuse les entrées invalides en -32602', async () => {
    for (const args of [
      { project_id: 'pas-uuid' },
      { project_id: projectId, start_date: '01/10/2026' },
      { project_id: projectId, lookback_days: 0 },
      { project_id: projectId, threshold: 0 },
      { project_id: projectId, include_alerts: 'oui' },
    ]) {
      const error = await dispatchTool(fixture.services, 'get_timeline', args).catch(
        (caught: unknown) => caught,
      );
      expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    }
  });

  it('filtre start_date > end_date en -32602 via la validation de fenêtre', async () => {
    const error = await dispatchTool(fixture.services, 'get_timeline', {
      project_id: projectId,
      start_date: '2026-10-10',
      end_date: '2026-10-01',
    }).catch((caught: unknown) => caught);

    // ValidationError métier : portée en erreur MCP (code interne) sans crash.
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('fenêtre');
  });
});
