import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisDimension, AnalysisReport } from '../../src/analysis/types.js';
import { runCli } from '../../src/cli/program.js';
import { openDatabase } from '../../src/data/database.js';
import type { Project } from '../../src/shared/validators.js';
import { AlertRepository } from '../../src/storage/alert-repository.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Exécute la CLI après avoir vidé les sorties du runtime. */
const run = async (runtime: TestRuntime, ...argv: string[]): Promise<number> => {
  runtime.output.stdout = '';
  runtime.output.stderr = '';
  return runCli(argv, runtime);
};

/** Analyse la sortie standard comme JSON. */
function json<T = Record<string, unknown>>(runtime: TestRuntime): T {
  return JSON.parse(runtime.output.stdout) as T;
}

/** Rapport homogène (score identique sur les dimensions). */
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
      infoFindings: 0,
      overallScore: { status: 'measured', value: score },
    },
  };
}

describe('CLI — timeline (Sprint 14-3)', () => {
  let dataDir: string;
  let runtime: TestRuntime;
  let projectId: string;

  /** Insère `series` audits quotidiens (base du 01/10/2026) dans le projet. */
  function seedAudits(series: readonly number[]): void {
    const database = openDatabase({ dataDir });
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

  /** Compte les alertes de la base. */
  function alertCount(): number {
    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      return new AlertRepository(database.connection).list().length;
    } finally {
      database.close();
    }
  }

  beforeEach(async () => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
    const code = await run(runtime, 'project', 'create', 'Site timeline', '--json');
    expect(code).toBe(0);
    projectId = json<Project>(runtime).id;
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  describe('timeline analyze', () => {
    it('analyse un projet et expose les séries par dimension (C14.1, C14.2)', async () => {
      seedAudits([60, 70, 80, 90]);

      const code = await run(runtime, 'timeline', 'analyze', projectId, '--json');
      expect(code).toBe(0);

      const payload = json<{
        projectId: string;
        projectName: string;
        totalAudits: number;
        dimensionScores: Array<{ dimension: string; averageScore: number; scores: unknown[] }>;
      }>(runtime);
      expect(payload.projectId).toBe(projectId);
      expect(payload.projectName).toBe('Site timeline');
      expect(payload.totalAudits).toBe(4);
      expect(payload.dimensionScores).toHaveLength(5);
      expect(payload.dimensionScores[0]?.scores).toHaveLength(4);
      expect(payload.dimensionScores[0]?.averageScore).toBe(75);
    });

    it('affiche un tableau humain (période, audits, dimensions)', async () => {
      seedAudits([70, 80]);

      const code = await run(runtime, 'timeline', 'analyze', projectId);
      expect(code).toBe(0);
      expect(runtime.output.stdout).toContain('Site timeline');
      expect(runtime.output.stdout).toContain('Audits');
      expect(runtime.output.stdout).toContain('performance');
    });

    it('gère un projet sans audit sans erreur (C14.15)', async () => {
      const code = await run(runtime, 'timeline', 'analyze', projectId, '--json');
      expect(code).toBe(0);
      expect(json<{ totalAudits: number }>(runtime).totalAudits).toBe(0);
    });

    it("l'analyse de tous les projets liste chaque projet", async () => {
      seedAudits([60]);

      const code = await run(runtime, 'timeline', 'analyze', '--json');
      expect(code).toBe(0);
      const payload = json<{ count: number; timelines: unknown[] }>(runtime);
      expect(payload.count).toBeGreaterThanOrEqual(1);
      expect(payload.timelines.length).toBe(payload.count);
    });

    it('filtre avec --start/--end et refuse les fenêtres invalides (code 4)', async () => {
      seedAudits([60, 70, 80, 90, 100]);

      const code = await run(
        runtime,
        'timeline',
        'analyze',
        projectId,
        '--start',
        '2026-10-02',
        '--end',
        '2026-10-03',
        '--json',
      );
      expect(code).toBe(0);
      expect(json<{ totalAudits: number }>(runtime).totalAudits).toBe(2);

      expect(await run(runtime, 'timeline', 'analyze', projectId, '--start', '03/10/2026')).toBe(4);
      expect(
        await run(
          runtime,
          'timeline',
          'analyze',
          projectId,
          '--start',
          '2026-10-05',
          '--end',
          '2026-10-01',
        ),
      ).toBe(4);
      expect(await run(runtime, 'timeline', 'analyze', projectId, '--min-audits', 'abc')).toBe(4);
    });

    it('projette le minimum --min-audits sans bloquer (C14.15)', async () => {
      seedAudits([60]);

      const code = await run(
        runtime,
        'timeline',
        'analyze',
        projectId,
        '--min-audits',
        '5',
        '--json',
      );
      expect(code).toBe(0);
      expect(json<{ totalAudits: number; minAudits: number }>(runtime)).toMatchObject({
        totalAudits: 1,
        minAudits: 5,
      });
    });

    it('projette un projet inexistant (code 3)', async () => {
      const code = await run(
        runtime,
        'timeline',
        'analyze',
        '00000000-0000-4000-8000-000000000000',
      );
      expect(code).toBe(3);
    });
  });

  describe('timeline trends', () => {
    it('détecte amélioration, régressions et recommandations (C14.3)', async () => {
      seedAudits([60, 65, 70, 75, 80]);

      const code = await run(runtime, 'timeline', 'trends', projectId, '--json');
      expect(code).toBe(0);

      const payload = json<{
        trends: Array<{ dimension: string; direction: string }>;
        overallTrend: { direction: string };
        recommendations: string[];
        regressions: unknown[];
        threshold: number;
        lookbackDays: number;
      }>(runtime);
      expect(payload.trends).toHaveLength(5);
      expect(payload.trends[0]?.direction).toBe('improving');
      expect(payload.overallTrend.direction).toBe('improving');
      expect(payload.recommendations.length).toBeGreaterThan(0);
      expect(payload.regressions).toBeDefined();
      expect(payload.threshold).toBe(10);
      expect(payload.lookbackDays).toBe(90);
    });

    it('affiche les régressions de score (baisse > seuil)', async () => {
      seedAudits([90, 50]);

      const code = await run(runtime, 'timeline', 'trends', projectId, '--json');
      expect(code).toBe(0);
      const payload = json<{ regressions: Array<{ regressionPoints: number }> }>(runtime);
      expect(payload.regressions.length).toBeGreaterThan(0);
      expect(payload.regressions[0]?.regressionPoints).toBe(40);
    });

    it('valide --lookback et --threshold (code 4)', async () => {
      expect(await run(runtime, 'timeline', 'trends', projectId, '--lookback', '0')).toBe(4);
      expect(await run(runtime, 'timeline', 'trends', projectId, '--threshold', 'x')).toBe(4);
      expect(await run(runtime, 'timeline', 'trends', projectId, '--threshold', '0')).toBe(4);
    });
  });

  describe('timeline alerts', () => {
    it('--check crée les alertes puis reste idempotent (C14.4)', async () => {
      seedAudits([90, 50]);

      const first = await run(runtime, 'timeline', 'alerts', projectId, '--check', '--json');
      expect(first).toBe(0);
      const firstPayload = json<{ created: number; count: number }>(runtime);
      expect(firstPayload.created).toBeGreaterThan(0);
      expect(firstPayload.count).toBe(firstPayload.created);
      expect(alertCount()).toBe(firstPayload.created);

      const second = await run(runtime, 'timeline', 'alerts', projectId, '--check', '--json');
      expect(second).toBe(0);
      expect(json<{ created: number }>(runtime).created).toBe(0);
    });

    it('répertorie les alertes actives et les filtre par --all', async () => {
      seedAudits([90, 50]);
      expect(await run(runtime, 'timeline', 'alerts', projectId, '--check')).toBe(0);

      const active = await run(runtime, 'timeline', 'alerts', projectId, '--json');
      expect(active).toBe(0);
      const activePayload = json<{ count: number; alerts: Array<{ id: string }> }>(runtime);
      expect(activePayload.count).toBeGreaterThan(0);

      const alertId = activePayload.alerts[0]?.id ?? '';
      expect(await run(runtime, 'timeline', 'alerts', '--resolve', alertId, '--json')).toBe(0);
      expect(json<{ resolved: boolean }>(runtime).resolved).toBe(true);

      // Une alerte résolue parmi plusieurs : actives = count précédent − 1.
      const afterResolve = await run(runtime, 'timeline', 'alerts', projectId, '--json');
      expect(afterResolve).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(activePayload.count - 1);

      const all = await run(runtime, 'timeline', 'alerts', projectId, '--all', '--json');
      expect(all).toBe(0);
      expect(json<{ count: number }>(runtime).count).toBe(activePayload.count);
    });

    it('valide --resolve (code 4 : UUID puis déjà résolue)', async () => {
      expect(await run(runtime, 'timeline', 'alerts', '--resolve', 'pas-uuid')).toBe(4);
      seedAudits([90, 50]);
      expect(await run(runtime, 'timeline', 'alerts', projectId, '--check', '--json')).toBe(0);
      expect(json<{ created: number }>(runtime).created).toBeGreaterThan(0);
      const alerts = await run(runtime, 'timeline', 'alerts', projectId, '--json');
      expect(alerts).toBe(0);
      const id = json<{ alerts: Array<{ id: string }> }>(runtime).alerts[0]?.id ?? '';
      expect(await run(runtime, 'timeline', 'alerts', '--resolve', id)).toBe(0);
      expect(await run(runtime, 'timeline', 'alerts', '--resolve', id)).toBe(4);
    });

    it('valide --threshold (code 4)', async () => {
      expect(await run(runtime, 'timeline', 'alerts', projectId, '--threshold', '101')).toBe(4);
    });
  });

  describe('timeline chart', () => {
    it('génère un SVG et un PNG valides (C14.5, C14.6)', async () => {
      seedAudits([60, 70, 80]);

      const svgPath = join(tmpdir(), `ekts-chart-${String(Date.now())}.svg`);
      const codeSvg = await run(
        runtime,
        'timeline',
        'chart',
        projectId,
        '--output',
        svgPath,
        '--json',
      );
      expect(codeSvg).toBe(0);
      expect(existsSync(svgPath)).toBe(true);
      const svg = readFileSync(svgPath, 'utf8');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(json<{ format: string; totalAudits: number }>(runtime)).toMatchObject({
        format: 'svg',
        totalAudits: 3,
      });
      unlinkSync(svgPath);

      const pngPath = join(tmpdir(), `ekts-chart-${String(Date.now())}.png`);
      const codePng = await run(
        runtime,
        'timeline',
        'chart',
        projectId,
        '--format',
        'png',
        '--output',
        pngPath,
        '--dimension',
        'performance',
        '--width',
        '320',
        '--height',
        '200',
        '--json',
      );
      expect(codePng).toBe(0);
      const png = readFileSync(pngPath);
      expect(png.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      expect(png.readUInt32BE(16)).toBe(320);
      expect(png.readUInt32BE(20)).toBe(200);
      unlinkSync(pngPath);
    });

    it('refuse format et dimension hors choix (code 2), tailles hors plage (code 4)', async () => {
      seedAudits([60]);
      expect(
        await run(runtime, 'timeline', 'chart', projectId, '--format', 'gif', '--output', '/tmp/x'),
      ).toBe(2);
      expect(
        await run(
          runtime,
          'timeline',
          'chart',
          projectId,
          '--dimension',
          'bogus',
          '--output',
          '/tmp/x',
        ),
      ).toBe(2);
      expect(
        await run(runtime, 'timeline', 'chart', projectId, '--width', '10', '--output', '/tmp/x'),
      ).toBe(4);
    });

    it('exige un projet (code 2) et signale un projet absent (code 3)', async () => {
      const missing = await run(runtime, 'timeline', 'chart');
      expect(missing).toBe(2);

      const absent = await run(
        runtime,
        'timeline',
        'chart',
        '00000000-0000-4000-8000-000000000000',
        '--output',
        join(tmpdir(), 'never.svg'),
      );
      expect(absent).toBe(3);
    });
  });
});
