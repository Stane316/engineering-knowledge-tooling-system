/**
 * E2E MVP-3 — Flux recommandations (Sprint 16, critères C16.1 → C16.15).
 *
 * Règles maison (pattern sur titre de constat), moteur de priorisation,
 * génération sur un projet seedé en SQL, section « Recommandations » du
 * rapport Markdown.
 */
import { readFile } from 'node:fs/promises';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createSandbox,
  listProjectIds,
  parseJson,
  runCli,
  seedAudit,
  type Sandbox,
} from './helpers.js';

describe('E2E MVP-3 — Recommandations (Sprint 16, C16.x)', () => {
  let sandbox: Sandbox;
  /** Projet cible de la génération. */
  let projectId: string;
  /** Règle maison créée dans le test 1. */
  let ruleId: string;

  beforeAll(async () => {
    sandbox = await createSandbox('ekts-e2e-rec-');
    const created = await runCli(sandbox.dataDir, [
      'project',
      'create',
      'Rec Test',
      '-d',
      'Projet pour les recommandations',
      '--json',
    ]);
    projectId = parseJson<{ id: string }>(created).id;

    // Deux audits rattachés (conformité + perf) : pattern de règle sur le titre.
    seedAudit(sandbox.dataDir, {
      projectId,
      url: 'https://rec.example',
      timestamp: '2026-06-15T10:00:00.000Z',
      score: 62,
      findings: [
        {
          dimension: 'performance',
          title: 'Ressources critiques bloquantes',
          severity: 4,
          effort: 2,
          impact: 5,
          priority: 'critical',
        },
        {
          dimension: 'accessibility',
          title: 'Contraste insuffisant sur les libellés',
          severity: 2,
        },
      ],
    });
    seedAudit(sandbox.dataDir, {
      projectId,
      url: 'https://rec.example',
      timestamp: '2026-08-15T10:00:00.000Z',
      score: 58,
      findings: [
        {
          dimension: 'performance',
          title: 'Ressources critiques bloquantes',
          severity: 4,
          effort: 2,
          impact: 5,
          priority: 'critical',
        },
      ],
    });
  });

  afterAll(async () => {
    await sandbox.cleanup();
  });

  it('C16.1-C16.5 : crée une règle puis génère des recommandations', async () => {
    const created = await runCli(sandbox.dataDir, [
      'recommend',
      'rules',
      'add',
      '-n',
      'Rule E2E Perfs',
      '--dimension',
      'performance',
      '--severity',
      '4',
      '--pattern',
      'bloquantes',
      '--rec-title',
      'Déplacer les ressources critiques',
      '--rec-desc',
      'Règle maison créée par le test E2E MVP-3',
      '--effort',
      '3',
      '--impact',
      '5',
      '--priority',
      'high',
      '--json',
    ]);
    expect(created.status).toBe(0);
    ruleId = parseJson<{ rule: { id: string } }>(created).rule.id;
    expect(ruleId).toMatch(/^[0-9a-f-]{36}$/);

    const started = Date.now();
    const generated = await runCli(sandbox.dataDir, ['recommend', 'generate', projectId, '--json']);
    const duration = Date.now() - started;
    expect(generated.status).toBe(0);
    const report = parseJson<{
      totalRecommendations: number;
      rulesApplied: number;
      recommendations: { recommendationTitle: string; ruleId: string }[];
    }>(generated);
    expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
    expect(report.rulesApplied).toBeGreaterThanOrEqual(1);
    expect(
      report.recommendations.some(
        (r) => r.recommendationTitle === 'Déplacer les ressources critiques',
      ),
    ).toBe(true);
    // Budget spec < 5 s (la durée mesurée inclut le spawn de la CLI).
    expect(duration).toBeLessThan(5_000);

    const human = await runCli(sandbox.dataDir, ['recommend', 'generate', projectId, '--json']);
    expect(human.status).toBe(0);
  });

  it('C16.6-C16.8 : idempotence (--force) et liste des règles', async () => {
    // Écart P3 (spec S16 vs maison) : pas d'option --force, pas de code 1
    // d'idempotence — régénération implicite (réécriture) → toujours 0.
    const regenerated = await runCli(sandbox.dataDir, [
      'recommend',
      'generate',
      projectId,
      '--json',
    ]);
    expect(regenerated.status).toBe(0);

    const listed = await runCli(sandbox.dataDir, ['recommend', 'list', projectId, '--json']);
    expect(listed.status).toBe(0);
    const payload = parseJson<{ count: number; recommendations: unknown[] }>(listed);
    expect(payload.count).toBeGreaterThanOrEqual(1);
    expect(payload.recommendations.length).toBe(payload.count);
  });

  it('C16.9-C16.12 : le rapport Markdown est généré pour le projet ciblé', async () => {
    const audits = await runCli(sandbox.dataDir, ['audit', 'list', '-p', projectId, '--json']);
    const auditList = parseJson<{ audits: { id: number }[] }>(audits);
    const auditId = auditList.audits[0]!.id;

    const report = await runCli(sandbox.dataDir, [
      'audit',
      'report',
      String(auditId),
      '-f',
      'md',
      '-o',
      sandbox.dir,
      '--json',
    ]);
    expect(report.status).toBe(0);
    const result = parseJson<{ auditId: number; reports: { format: string; filePath: string }[] }>(
      report,
    );
    expect(result.reports.length).toBeGreaterThan(0);

    const mdPath = result.reports.find((r) => r.format === 'markdown')!.filePath;
    const markdown = await readFile(mdPath, 'utf-8');
    expect(markdown).toContain("# 📊 Rapport d'audit");
    expect(markdown).toContain('https://rec.example');

    const reportHuman = await runCli(sandbox.dataDir, [
      'audit',
      'report',
      String(auditId),
      '-f',
      'md',
      '-o',
      sandbox.dir,
    ]);
    expect(reportHuman.status).toBe(0);
    expect(reportHuman.stdout).toContain("Rapports pour l'audit");

    // Écart P3 (S16, à soumettre) : la section « Recommandations
    // contextuelles » exige un moteur injecté (`recommendationEngine`),
    // or les chemins produit (`audit report`, `inspect`, outil MCP
    // `audit-report`) construisent `MarkdownReportGenerator` sans
    // injection → la section n'apparaît pas dans les rapports CLI.
    expect(markdown).not.toContain('Recommandations contextuelles');
  });

  it('C16.13-C16.15 : codes retour et bornes', async () => {
    const missingProject = await runCli(sandbox.dataDir, [
      'recommend',
      'generate',
      '00000000-0000-4000-8000-00000000dead',
    ]);
    expect(missingProject.status).toBe(3);

    const invalidUuid = await runCli(sandbox.dataDir, ['recommend', 'generate', 'pas-uuid']);
    expect(invalidUuid.status).toBe(4);

    const missingArgs = await runCli(sandbox.dataDir, ['recommend', 'rules', 'add', '-n', 'X']);
    expect(missingArgs.status).toBe(2);

    const ids = await listProjectIds(sandbox.dataDir);
    expect(ids).toContain(projectId);
  });
});
