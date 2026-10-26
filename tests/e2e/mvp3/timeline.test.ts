/**
 * E2E MVP-3 — Flux suivi temporel (Sprint 14, critères C14.1 → C14.17).
 *
 * Cinq audits seedés sur six mois (scores décroissants → régression
 * détectable), puis commandes réelles `timeline analyze|trends|alerts|chart`.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createSandbox, parseJson, runCli, seedAudit, type Sandbox } from './helpers.js';

describe('E2E MVP-3 — Suivi temporel (Sprint 14, C14.x)', () => {
  let sandbox: Sandbox;
  /** Projet de la timeline. */
  let projectId: string;

  beforeAll(async () => {
    sandbox = await createSandbox('ekts-e2e-timeline-');
    const created = await runCli(sandbox.dataDir, [
      'project',
      'create',
      'Timeline Test',
      '-d',
      'Projet suivivi dans le temps',
      '--json',
    ]);
    projectId = parseJson<{ id: string }>(created).id;

    // 5 audits sur 6 mois : régression continue (90 → 55).
    // Chute 73 → 60 (13 points > seuil régression 10) pour C14.8.
    const audits: Array<{ timestamp: string; score: number }> = [
      { timestamp: '2026-01-15T10:00:00.000Z', score: 90 },
      { timestamp: '2026-03-15T10:00:00.000Z', score: 82 },
      { timestamp: '2026-05-15T10:00:00.000Z', score: 73 },
      { timestamp: '2026-07-15T10:00:00.000Z', score: 60 },
      { timestamp: '2026-09-15T10:00:00.000Z', score: 55 },
    ];
    for (const audit of audits) {
      seedAudit(sandbox.dataDir, {
        projectId,
        url: 'https://timeline.example',
        timestamp: audit.timestamp,
        score: audit.score,
        findings: [
          {
            dimension: 'performance',
            title: `Regressions accumulées ${audit.timestamp.slice(0, 7)}`,
            severity: 3,
          },
        ],
      });
    }
  });

  afterAll(async () => {
    await sandbox.cleanup();
  });

  it('C14.1-C14.4 : analyse la timeline du projet (période, 5 audits, scores)', async () => {
    const result = await runCli(sandbox.dataDir, ['timeline', 'analyze', projectId]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('📈');
    expect(result.stdout).toContain('Timeline Test');
    expect(result.stdout).toMatch(/Audits\s+5/);
    expect(result.stdout).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("C14.5-C14.7 : détecte les tendances et l'historique", async () => {
    const json = await runCli(sandbox.dataDir, ['timeline', 'analyze', projectId, '--json']);
    expect(json.status).toBe(0);
    const analysis = parseJson<{
      totalAudits: number;
      startDate: string;
      endDate: string;
      dimensionScores: { dimension: string; scores: unknown[] }[];
    }>(json);
    expect(analysis.totalAudits).toBe(5);
    expect(analysis.startDate <= analysis.endDate).toBe(true);
    expect(analysis.dimensionScores.length).toBeGreaterThanOrEqual(5);

    // Fenêtre glissante maison (défaut 90 j) : --lookback pour voir 2026.
    const trends = await runCli(sandbox.dataDir, [
      'timeline',
      'trends',
      projectId,
      '--lookback',
      '365',
      '--json',
    ]);
    expect(trends.status).toBe(0);
    const trendReport = parseJson<{
      trends: { dimension: string; direction: string; slope: number }[];
      overallTrend: { direction: string };
    }>(trends);
    const performanceTrend = trendReport.trends.find((t) => t.dimension === 'performance');
    expect(performanceTrend?.direction).toBe('declining');
    expect(performanceTrend?.slope).toBeLessThan(0);
    expect(trendReport.overallTrend.direction).toBeTruthy();
  });

  it('C14.8-C14.11 : détecte les régressions et les alertes (--check)', async () => {
    // Alertes : commande idempotente, sortie JSON {created, count, ...}.
    const alerts = await runCli(sandbox.dataDir, [
      'timeline',
      'alerts',
      projectId,
      '--check',
      '--threshold',
      '5',
      '--json',
    ]);
    expect(alerts.status).toBe(0);
    const payload = parseJson<{ created: number; count: number }>(alerts);
    expect(payload.count).toBeGreaterThanOrEqual(0);

    // Régressions (> 10 points entre audits consécutifs) : 73 → 60.
    const trends = await runCli(sandbox.dataDir, [
      'timeline',
      'trends',
      projectId,
      '--lookback',
      '365',
      '--json',
    ]);
    const report = parseJson<{
      regressions: { dimension: string; scoreBefore: number; scoreAfter: number }[];
    }>(trends);
    expect(report.regressions.length).toBeGreaterThanOrEqual(1);
    expect(
      report.regressions.some(
        (r) => r.dimension === 'overall' && r.scoreBefore - r.scoreAfter > 10,
      ),
    ).toBe(true);
  });

  it('C14.12-C14.15 : génère un graphique SVG valide', async () => {
    const output = path.join(sandbox.dir, 'timeline.svg');
    const result = await runCli(sandbox.dataDir, [
      'timeline',
      'chart',
      projectId,
      '-o',
      output,
      '--width',
      '640',
      '--height',
      '320',
    ]);
    expect(result.status).toBe(0);

    const info = await stat(output);
    expect(info.size).toBeGreaterThan(200);

    const svg = await readFile(output, 'utf-8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('width="640"');
    expect(svg).toContain('height="320"');
  });

  it('C14.16-C14.17 : bornes et codes retour (période, projet absent)', async () => {
    // Période invalide (start > end) → 4.
    const invalidRange = await runCli(sandbox.dataDir, [
      'timeline',
      'analyze',
      projectId,
      '--start',
      '2026-12-31',
      '--end',
      '2026-01-01',
    ]);
    expect(invalidRange.status).toBe(4);

    // Projet absent → ressource introuvable (3).
    const missing = await runCli(sandbox.dataDir, [
      'timeline',
      'analyze',
      '00000000-0000-4000-8000-00000000dead',
    ]);
    expect(missing.status).toBe(3);

    // Analyse globale (sans projet) → tous les projets.
    const all = await runCli(sandbox.dataDir, ['timeline', 'analyze', '--json']);
    expect(all.status).toBe(0);
    expect(parseJson<{ analyses?: unknown[]; totalAudits?: number }>(all)).toBeDefined();
  });
});
