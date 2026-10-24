import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import type { ComparisonReport } from '../../src/reports/types.js';
import type { Audit } from '../../src/storage/types.js';

/** Audit de test : 5 dimensions, constats variés, une recommandation absente. */
function makeAudit(overrides?: { readonly id?: number; readonly findingsCount?: number }): Audit {
  const findingsCount = overrides?.findingsCount ?? 3;
  const findings = Array.from({ length: findingsCount }, (_, index) => ({
    auditId: overrides?.id ?? 5,
    dimension: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const)[index % 5]!,
    title: `Constat ${String(index + 1)}`,
    description: `Description ${String(index + 1)}`,
    severity: 4 - (index % 5),
    effort: 1 + (index % 5),
    impact: 5 - (index % 4),
    priority: (['critical', 'high', 'medium', 'low', 'info'] as const)[index % 5]!,
    ...(index % 3 === 0 ? { recommendation: `Action ${String(index + 1)}` } : {}),
  }));

  return {
    metadata: {
      id: overrides?.id ?? 5,
      url: 'https://example.com',
      timestamp: '2026-10-24T10:00:00.000Z',
      overallScore: 74,
      totalFindings: findingsCount,
      criticalFindings: 1,
      highFindings: 1,
      mediumFindings: 1,
      lowFindings: 0,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension, index) => ({
        auditId: overrides?.id ?? 5,
        dimension,
        score: 60 + index * 5,
        findingsCount: index,
      }),
    ),
    findings,
  };
}

/** Comparaison minimale valide. */
function makeComparison(): ComparisonReport {
  const auditA = makeAudit({ id: 1 });
  const auditB = makeAudit({ id: 2, findingsCount: 5 });
  return {
    auditA,
    auditB,
    deltaScores: [
      { dimension: 'performance', scoreA: 70, scoreB: 80, delta: 10, percentage: 14.3 },
    ],
    deltaFindings: {
      newFindings: [auditB.findings[0]!],
      resolvedFindings: [auditA.findings[1]!],
      persistentFindings: [],
      improvedFindings: [],
    },
    evolution: { scoreA: 74, scoreB: 78, delta: 4, percentage: 5.4, trend: 'stable' },
    recommendations: ['Corriger les messages de contraste'],
  };
}

describe('MarkdownReportGenerator', () => {
  const cleanups: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanups.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('génère un rapport complet en mémoire sans fichier', async () => {
    const generator = new MarkdownReportGenerator();
    const report = await generator.generate(makeAudit());

    expect(report.format).toBe('markdown');
    expect(report.auditId).toBe(5);
    expect(report.filePath).toBeUndefined();
    expect(() => new Date(report.generatedAt).toISOString()).not.toThrow();

    expect(report.content).toContain("# 📊 Rapport d'audit — https://example.com");
    expect(report.content).toContain('## 📈 Résumé');
    expect(report.content).toContain('## 🎯 Scores par dimension');
    expect(report.content).toContain('## 🔍 Constats');
    expect(report.content).toContain('## 💡 Top 5 recommandations');
    // emoji de score : 74 ≥ 70 → 🟡
    expect(report.content).toContain('🟡 **74/100**');
    expect(report.content.trimEnd().endsWith('1. **Constat 1** → Action 1')).toBe(true);
  });

  it('respecte le filtre de sections', async () => {
    const generator = new MarkdownReportGenerator();
    const report = await generator.generate(makeAudit(), { includeSections: ['header'] });

    expect(report.content).toContain('# 📊 Rapport');
    expect(report.content).not.toContain('## 📈 Résumé');
    expect(report.content).not.toContain('## 🔍 Constats');
  });

  it('écrit le fichier dans outputPath (dossier créé si absent)', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-md-')), 'nested', 'reports');
    cleanups.push(path.dirname(path.dirname(dir)));

    const generator = new MarkdownReportGenerator();
    const report = await generator.generate(makeAudit(), { outputPath: dir });

    expect(report.filePath).toBeDefined();
    expect(report.filePath).toMatch(/audit-5-.*\.md$/);
    const written = await readFile(report.filePath!, 'utf8');
    expect(written).toBe(report.content);
    const info = await stat(report.filePath!);
    expect(info.isFile()).toBe(true);
  });

  it('refuse un outputPath vide', async () => {
    const generator = new MarkdownReportGenerator();
    await expect(generator.generate(makeAudit(), { outputPath: '   ' })).rejects.toThrow(
      /outputPath/,
    );
  });

  it('refuse un audit sans dimensions', async () => {
    const generator = new MarkdownReportGenerator();
    const broken = { ...makeAudit(), dimensions: [] } as Audit;
    await expect(generator.generate(broken)).rejects.toThrow(/dimension/);
  });

  it('refuse un score global hors bornes', async () => {
    const generator = new MarkdownReportGenerator();
    const broken = makeAudit();
    broken.metadata.overallScore = 140;
    await expect(generator.generate(broken)).rejects.toThrow(/\[0, 100\]/);
  });

  it('génère le rapport de comparaison (mémoire + fichier)', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-md-cmp-')), 'reports');
    cleanups.push(path.dirname(dir));

    const generator = new MarkdownReportGenerator();
    const report = await generator.generateComparison(makeComparison(), { outputPath: dir });

    expect(report.format).toBe('markdown');
    expect(report.auditId).toBe(2);
    expect(report.filePath).toMatch(/comparison-2-.*\.md$/);
    expect(report.content).toContain("# 🔄 Comparaison d'audits");
    expect(report.content).toContain('| performance | 70 | 80 | +10 | +14.3% |');
    expect(report.content).toContain('stable');
    expect(report.content).toContain('1. Corriger les messages de contraste');
  });

  it('refuse une comparaison incomplète', async () => {
    const generator = new MarkdownReportGenerator();
    await expect(generator.generateComparison({} as unknown as ComparisonReport)).rejects.toThrow(
      /Comparaison invalide/,
    );
  });

  it("échoue proprement quand le dossier de sortie n'est pas un répertoire", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ekts-md-file-'));
    cleanups.push(dir);
    const fileAsDir = path.join(dir, 'not-a-dir');
    await writeFile(fileAsDir, 'x');

    const generator = new MarkdownReportGenerator();
    await expect(generator.generate(makeAudit(), { outputPath: fileAsDir })).rejects.toThrow(
      /Écriture du rapport Markdown impossible/,
    );
  });

  it('génère 100 constats en moins de 2 secondes (budget C11.1)', async () => {
    const generator = new MarkdownReportGenerator();
    const started = performance.now();
    const report = await generator.generate(makeAudit({ findingsCount: 100 }));
    const elapsed = performance.now() - started;

    expect(report.content).toContain('Constat 100');
    expect(elapsed).toBeLessThan(2_000);
  }, 15_000);
});
