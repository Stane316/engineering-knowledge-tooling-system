/**
 * E2E MVP-3 — Flux intégral MVP-3 (Sprint 18-01).
 *
 * Chaîne complète sans intervention humaine :
 * template apply → audits seedés (SQL réel) → bestpractice extract →
 * recommend generate → timeline analyze → audit report (Markdown).
 * Codes de sortie transverses 0/1/2/3/4 sur la CLI compilée.
 */
import { readFile } from 'node:fs/promises';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createSandbox, listProjectIds, parseJson, runCli, seedAudit, type Sandbox } from './helpers.js';

describe('E2E MVP-3 — Flux intégral', () => {
  let sandbox: Sandbox;
  /** Template builtin appliqué. */
  let builtinTemplateId: string;
  /** Projet créé par apply. */
  let projectId: string;
  /** Premier audit du flux. */
  let firstAuditId: number;

  beforeAll(async () => {
    sandbox = await createSandbox('ekts-e2e-mvp3-');
    const listed = await runCli(sandbox.dataDir, ['template', 'list', '--json']);
    builtinTemplateId = parseJson<{ templates: { id: string; isBuiltin: boolean }[] }>(
      listed,
    ).templates.find((t) => t.isBuiltin === true)!.id;
  });

  afterAll(async () => {
    await sandbox.cleanup();
  });

  it('flux complet : apply → audits → extract → generate → timeline → report', async () => {
    // 1. Application du template (projet + règles).
    const applied = await runCli(sandbox.dataDir, [
      'template',
      'apply',
      builtinTemplateId,
      '--name',
      'Projet MVP-3 Intégration',
      '--url',
      'https://mvp3.example',
      '--json',
    ]);
    expect(applied.status).toBe(0);
    const applyReport = parseJson<{ projectId: string; rulesCreated: number }>(applied);
    projectId = applyReport.projectId;
    expect(projectId).toMatch(/^[0-9a-f-]{36}$/);
    expect(applyReport.rulesCreated).toBeGreaterThanOrEqual(1);

    // 2. Audits seedés (4) : constats présents (1-2), résolus avec hausse (3)
    //    pour l'extraction, puis présents de nouveau (4) pour que l'engine
    //    de recommandations voie le constat actuel ; scores progressifs.
    const fixtures = [
      { month: '2026-05', score: 58, findings: true },
      { month: '2026-06', score: 62, findings: true },
      { month: '2026-07', score: 70, findings: false },
      { month: '2026-08', score: 76, findings: true },
    ];
    for (const fixture of fixtures) {
      seedAudit(sandbox.dataDir, {
        projectId,
        url: 'https://mvp3.example',
        timestamp: `${fixture.month}-10T09:00:00.000Z`,
        score: fixture.score,
        findings: fixture.findings
          ? [
              {
                dimension: 'performance',
                title: 'Ressources critiques bloquantes',
                severity: 4,
                effort: 2,
                impact: 5,
                priority: 'critical',
              },
              {
                dimension: 'seo',
                title: 'Meta description manquante',
                severity: 2,
              },
            ]
          : [],
      });
    }

    // 3. Extraction des constats résolus en bonnes pratiques.
    const extracted = await runCli(sandbox.dataDir, [
      'bestpractice',
      'extract',
      projectId,
      '--json',
    ]);
    expect(extracted.status).toBe(0);
    const extractReport = parseJson<{ practicesExtracted: number; auditsAnalyzed: number }>(
      extracted,
    );
    expect(extractReport.auditsAnalyzed).toBe(4);
    expect(extractReport.practicesExtracted).toBeGreaterThanOrEqual(2);

    // 4. Règle maison complémentaire (configuration utilisateur) puis
    //    génération des recommandations avec l'engine.
    const ruleAdded = await runCli(sandbox.dataDir, [
      'recommend',
      'rules',
      'add',
      '-n',
      'Rule Intégration',
      '--dimension',
      'performance',
      '--severity',
      '4',
      '--pattern',
      'bloquantes',
      '--rec-title',
      'Différer les ressources critiques',
      '--rec-desc',
      'Règle du test d intégration MVP-3',
      '--effort',
      '3',
      '--impact',
      '5',
      '--priority',
      'high',
      '--json',
    ]);
    expect(ruleAdded.status).toBe(0);

    // 4. Génération des recommandations (règles du template + engine).
    const generated = await runCli(sandbox.dataDir, [
      'recommend',
      'generate',
      projectId,
      '--json',
    ]);
    expect(generated.status).toBe(0);
    const recReport = parseJson<{
      totalRecommendations: number;
      recommendations: { recommendationTitle: string }[];
    }>(generated);
    expect(recReport.totalRecommendations).toBeGreaterThanOrEqual(1);
    expect(
      recReport.recommendations.some(
        (r) => r.recommendationTitle === 'Différer les ressources critiques',
      ),
    ).toBe(true);

    // 5. Suivi temporel du projet.
    const analyzed = await runCli(sandbox.dataDir, [
      'timeline',
      'analyze',
      projectId,
      '--json',
    ]);
    expect(analyzed.status).toBe(0);
    const analysis = parseJson<{ totalAudits: number; startDate: string; endDate: string }>(
      analyzed,
    );
    expect(analysis.totalAudits).toBe(4);
    expect(analysis.startDate <= analysis.endDate).toBe(true);

    // 6. Rapport Markdown du premier audit.
    const audits = await runCli(sandbox.dataDir, ['audit', 'list', '-p', projectId, '--json']);
    firstAuditId = parseJson<{ audits: { id: number }[] }>(audits).audits[0]!.id;
    const report = await runCli(sandbox.dataDir, [
      'audit',
      'report',
      String(firstAuditId),
      '-f',
      'md',
      '-o',
      sandbox.dir,
      '--json',
    ]);
    expect(report.status).toBe(0);
    const reports = parseJson<{ reports: { filePath: string }[] }>(report);
    const markdown = await readFile(reports.reports[0]!.filePath, 'utf-8');
    expect(markdown).toContain('https://mvp3.example');
    expect(markdown.length).toBeGreaterThan(500);
  });

  it('transverse : les codes de sortie restent stables (0 / 3 / 4 / 2)', async () => {
    // Succès.
    const ok = await runCli(sandbox.dataDir, ['project', 'list']);
    expect(ok.status).toBe(0);

    // Ressource introuvable.
    const missing = await runCli(sandbox.dataDir, [
      'recommend',
      'generate',
      '00000000-0000-4000-8000-00000000dead',
    ]);
    expect(missing.status).toBe(3);

    // Entrée invalide : écart P3 maison — timeline résout par UUID brut
    // (3, projet introuvable) là où recommend valide le format (4).
    const invalid = await runCli(sandbox.dataDir, ['timeline', 'analyze', 'uuid-invalide']);
    expect(invalid.status).toBe(3);
    const invalidRecommend = await runCli(sandbox.dataDir, [
      'recommend',
      'generate',
      'uuid-invalide',
    ]);
    expect(invalidRecommend.status).toBe(4);

    // Usage erroné.
    const usage = await runCli(sandbox.dataDir, ['template', 'apply']);
    expect(usage.status).toBe(2);
  });

  it('transverse : isolation des bacs à sable (données non partagées)', async () => {
    const other = await createSandbox('ekts-e2e-isolated-');
    try {
      const created = await runCli(other.dataDir, ['project', 'create', 'Isolé', '--json']);
      expect(created.status).toBe(0);
      const otherIds = await listProjectIds(other.dataDir);
      expect(otherIds).toHaveLength(1);

      // Le bac du flux intégral ne voit pas ce projet.
      const mainIds = await listProjectIds(sandbox.dataDir);
      expect(mainIds).not.toContain(otherIds[0]);
      expect(mainIds).toContain(projectId);
    } finally {
      await other.cleanup();
    }
  });
});
