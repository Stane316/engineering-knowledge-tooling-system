/**
 * E2E MVP-3 — Flux bonnes practices (Sprint 15, critères C15.1 → C15.20).
 *
 * Extraction automatique depuis des audits seedés (constats récurrents),
 * recherche FTS, création manuelle, associations et codes retour.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createSandbox, parseJson, runCli, seedAudit, type Sandbox } from './helpers.js';

/**
 * Constats présents sur les audits 1-2 puis **absents du 3e** (résolus),
 * avec score en hausse (60 → 65 → 75) : extraction maison = constats
 * résolus + répétés (≥ 2 occurrences, score qui s'améliore).
 */
const RESOLVABLE_FINDINGS = [
  {
    dimension: 'performance' as const,
    title: 'Images produits non optimisées',
    severity: 3 as const,
  },
  {
    dimension: 'seo' as const,
    title: 'Meta description manquante',
    severity: 2 as const,
  },
];

describe('E2E MVP-3 — Bonnes practices (Sprint 15, C15.x)', () => {
  let sandbox: Sandbox;
  /** Projet source de l'extraction. */
  let projectId: string;
  /** Identifiant de la pratique extraite (la plus fréquente). */
  let extractedId: string;

  beforeAll(async () => {
    sandbox = await createSandbox('ekts-e2e-bp-');
    const created = await runCli(sandbox.dataDir, [
      'project',
      'create',
      'BP Test',
      '-d',
      'Projet pour l’extraction',
      '--json',
    ]);
    projectId = parseJson<{ id: string }>(created).id;

    // Audits 1-2 : constats présents ; audit 3 : constats résolus.
    const timeline = [
      { month: '2026-06', score: 60, findings: RESOLVABLE_FINDINGS },
      { month: '2026-07', score: 65, findings: RESOLVABLE_FINDINGS },
      { month: '2026-08', score: 75, findings: [] },
    ];
    for (const audit of timeline) {
      seedAudit(sandbox.dataDir, {
        projectId,
        url: 'https://bp.example',
        timestamp: `${audit.month}-15T10:00:00.000Z`,
        score: audit.score,
        findings: [...audit.findings],
      });
    }
  });

  afterAll(async () => {
    await sandbox.cleanup();
  });

  it('C15.1-C15.6 : extrait les constats récurrents en bonnes pratiques', async () => {
    const started = Date.now();
    const extracted = await runCli(sandbox.dataDir, [
      'bestpractice',
      'extract',
      projectId,
      '--json',
    ]);
    const duration = Date.now() - started;

    expect(extracted.status).toBe(0);
    const report = parseJson<{
      practicesExtracted: number;
      linksCreated: number;
      auditsAnalyzed: number;
    }>(extracted);
    expect(report.auditsAnalyzed).toBe(3);
    expect(report.practicesExtracted).toBeGreaterThanOrEqual(2);
    expect(report.linksCreated).toBeGreaterThanOrEqual(2);
    // C15.13 : extraction < 5 s.
    expect(duration).toBeLessThan(5_000);

    const human = await runCli(sandbox.dataDir, ['bestpractice', 'extract', projectId]);
    expect(human.stdout).toContain('Bonnes pratiques extraites');
  });

  it('C15.7-C15.9 : liste et recherche les pratiques (FTS)', async () => {
    const listed = await runCli(sandbox.dataDir, ['bestpractice', 'list', '--json']);
    expect(listed.status).toBe(0);
    const all = parseJson<{ practices: { id: string; title: string }[]; count: number }>(
      listed,
    );
    expect(all.count).toBeGreaterThanOrEqual(2);
    extractedId = all.practices[0]!.id;
    expect(all.practices.some((bp) => /images/i.test(bp.title))).toBe(true);

    const started = Date.now();
    const searched = await runCli(sandbox.dataDir, ['bestpractice', 'search', 'images', '--json']);
    const duration = Date.now() - started;
    expect(searched.status).toBe(0);
    const results = parseJson<{ results: { title: string }[] }>(searched);
    expect(results.results.length).toBeGreaterThanOrEqual(1);
    // Recherche quasi instantanée.
    expect(duration).toBeLessThan(2_000);
  });

  it('C15.10-C15.12 : détail, filtre catégorie et création manuelle', async () => {
    const shown = await runCli(sandbox.dataDir, ['bestpractice', 'show', extractedId, '--json']);
    expect(shown.status).toBe(0);
    const shownPayload = parseJson<{ practice: { sourceAuditIds: string[] } }>(shown);
    expect(shownPayload.practice.sourceAuditIds.length).toBeGreaterThanOrEqual(2);

    const filtered = await runCli(sandbox.dataDir, [
      'bestpractice',
      'list',
      '-c',
      'performance',
      '--json',
    ]);
    expect(filtered.status).toBe(0);
    expect(
      parseJson<{ practices: { category: string }[] }>(filtered).practices.every(
        (bp) => bp.category === 'performance',
      ),
    ).toBe(true);

    const added = await runCli(sandbox.dataDir, [
      'bestpractice',
      'add',
      '-t',
      'Compresser les polices WOFF2',
      '-d',
      'Pratique manuelle créée par le test E2E MVP-3',
      '-c',
      'performance',
      '--tags',
      'fonts,perf',
      '--json',
    ]);
    expect(added.status).toBe(0);
    const manual = parseJson<{ id: string; isManual: boolean }>(added);
    expect(manual.isManual).toBe(true);
  });

  it('C15.14-C15.20 : codes retour et contrats de suppression', async () => {
    const listManual = await runCli(sandbox.dataDir, ['bestpractice', 'list', '--manual', '--json']);
    expect(listManual.status).toBe(0);
    const manualId = parseJson<{ practices: { id: string }[] }>(listManual).practices[0]!
      .id;

    // Suppression sans confirmation → 1.
    const refused = await runCli(sandbox.dataDir, ['bestpractice', 'delete', manualId]);
    expect(refused.status).toBe(1);

    // Suppression confirmée → 0, puis absence → 3.
    const deleted = await runCli(sandbox.dataDir, ['bestpractice', 'delete', manualId, '--yes']);
    expect(deleted.status).toBe(0);
    const gone = await runCli(sandbox.dataDir, ['bestpractice', 'show', manualId]);
    expect(gone.status).toBe(3);

    // Catégorie invalide → 4.
    const invalidCategory = await runCli(sandbox.dataDir, [
      'bestpractice',
      'list',
      '-c',
      'bogus',
    ]);
    expect(invalidCategory.status).toBe(4);
  });
});
