import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisReport, Finding } from '../../src/analysis/types.js';
import { runCli } from '../../src/cli/program.js';
import { openDatabase } from '../../src/data/database.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

/**
 * Les formats `pdf`/`both` sont exercés avec un double du générateur PDF :
 * le Markdown reste réel et aucune dépendance Chrome n'est nécessaire ici.
 */
const { generatePdfMock } = vi.hoisted(() => ({ generatePdfMock: vi.fn() }));

vi.mock('../../src/reports/pdf-generator.js', () => ({
  PDFReportGenerator: class {
    readonly generate = generatePdfMock;
    readonly generateComparison = generatePdfMock;
  },
}));

/** Lance une commande en réinitialisant les sorties (un seul run observé à la fois). */
const run = async (runtime: TestRuntime, ...argv: string[]): Promise<number> => {
  runtime.output.stdout = '';
  runtime.output.stderr = '';
  return runCli(argv, runtime);
};
const allOutput = (runtime: TestRuntime): string => runtime.output.stdout + runtime.output.stderr;
const json = <T>(runtime: TestRuntime): T => JSON.parse(runtime.output.stdout) as T;

/** Constat de test valide. */
function makeFinding(): Finding {
  return {
    id: 'f-cli',
    dimension: 'performance',
    title: 'LCP trop élevé',
    description: 'LCP à 4,5 s',
    severity: 3,
    effort: 2,
    impact: 4,
    priority: 'high',
    recommendation: "Précharger l'image héros",
    references: [],
  };
}

/** Second constat (priorité distincte) pour exercer le tri de `audit show`. */
function makeSecondFinding(): Finding {
  return {
    id: 'f-cli-2',
    dimension: 'accessibility',
    title: 'Contraste insuffisant',
    description: 'Contraste sous 4.5:1',
    severity: 4,
    effort: 1,
    impact: 5,
    priority: 'critical',
    recommendation: 'Assombrir les textes',
    references: [],
  };
}

/** Rapport d'analyse minimal conforme au contrat Sprint 9. */
function makeReport(score = 70, withSecondFinding = false): AnalysisReport {
  const findings = withSecondFinding ? [makeFinding(), makeSecondFinding()] : [makeFinding()];
  const dimensions = ['performance', 'accessibility', 'seo', 'ux', 'content'] as const;

  return {
    url: 'https://example.com',
    timestamp: '2026-10-24T10:00:00.000Z',
    dimensions: Object.fromEntries(
      dimensions.map((dimension) => [
        dimension,
        {
          dimension,
          score,
          findings: findings.filter((finding) => finding.dimension === dimension),
          summary: `Score ${dimension} : ${String(score)}/100.`,
        },
      ]),
    ) as AnalysisReport['dimensions'],
    findings,
    priorityFindings: [...findings],
    summary: {
      totalFindings: findings.length,
      criticalFindings: withSecondFinding ? 1 : 0,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: { status: 'measured', value: score },
    },
  };
}

/** Insère un audit de test dans le répertoire de données. */
function seedAudit(dataDir: string, score = 70, withSecondFinding = false): void {
  const database = openDatabase({ dataDir });
  try {
    new AuditSchema(database.connection).createSchema();
    new AuditRepository(database.connection).store(makeReport(score, withSecondFinding));
  } finally {
    database.close();
  }
}

describe('CLI audit', () => {
  let dataDir: string;
  let runtime: TestRuntime;
  const tempDirs: string[] = [];

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
  });

  afterEach(async () => {
    removeDataDir(dataDir);
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('enregistre audit avec ses quatre sous-commandes et options', async () => {
    expect(await run(runtime, 'audit', '--help')).toBe(0);
    expect(allOutput(runtime)).toContain('audit [options]');

    expect(await run(runtime, 'audit', 'list', '--help')).toBe(0);
    const list = allOutput(runtime);
    expect(list).toContain('--limit');
    expect(list).toContain('--url');
    expect(list).toContain('--score-min');
    expect(list).toContain('--score-max');

    expect(await run(runtime, 'audit', 'report', '--help')).toBe(0);
    expect(allOutput(runtime)).toContain('--format');

    expect(await run(runtime, 'audit', 'compare', '--help')).toBe(0);
    expect(allOutput(runtime)).toContain('<id1> <id2>');
  });

  it('list : base vide, sortie humaine et JSON standardisées (C11.5)', async () => {
    expect(await run(runtime, 'audit', 'list')).toBe(0);
    expect(allOutput(runtime)).toMatch(/Aucun audit/);

    expect(await run(runtime, '--json', 'audit', 'list')).toBe(0);
    const payload = json<{ count: number; statistics: { totalAudits: number } }>(runtime);
    expect(payload.count).toBe(0);
    expect(payload.statistics.totalAudits).toBe(0);
  });

  it('list : respecte les filtres et la limite (audits réels)', async () => {
    seedAudit(dataDir, 70);
    seedAudit(dataDir, 90);

    expect(await run(runtime, 'audit', 'list')).toBe(0);
    expect(allOutput(runtime)).toContain('https://example.com');

    expect(await run(runtime, '--json', 'audit', 'list', '--score-min', '80')).toBe(0);
    const highOnly = json<{ count: number; audits: { overallScore: number }[] }>(runtime);
    expect(highOnly.count).toBe(1);
    expect(highOnly.audits[0]?.overallScore).toBe(90);

    expect(await run(runtime, '--json', 'audit', 'list', '--limit', '1')).toBe(0);
    expect(json<{ count: number }>(runtime).count).toBe(1);

    expect(await run(runtime, '--json', 'audit', 'list', '--url', 'https://autre.fr')).toBe(0);
    expect(json<{ count: number }>(runtime).count).toBe(0);
  });

  it('show : affiche un audit existant, échoue proprement si absent', async () => {
    seedAudit(dataDir);

    expect(await run(runtime, 'audit', 'show', '1')).toBe(0);
    expect(allOutput(runtime)).toContain('Audit #1');
    expect(allOutput(runtime)).toContain('https://example.com');
    expect(allOutput(runtime)).toContain('performance');

    expect(await run(runtime, 'audit', 'show', '999')).toBe(3);
    expect(allOutput(runtime)).toMatch(/introuvable/);

    expect(await run(runtime, 'audit', 'show', 'abc')).toBe(4);
    expect(allOutput(runtime)).toMatch(/id invalide/);
  });

  it('report : génère le Markdown dans --output, échoue si audit absent', async () => {
    seedAudit(dataDir);
    const out = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-cli-report-')), 'reports');
    tempDirs.push(path.dirname(out));

    expect(await run(runtime, 'audit', 'report', '1', '--format', 'md', '--output', out)).toBe(0);
    expect(allOutput(runtime)).toMatch(/Rapports pour l'audit #1/);

    const jsonCode = await run(
      runtime,
      '--json',
      'audit',
      'report',
      '1',
      '--format',
      'md',
      '--output',
      out,
    );
    expect(jsonCode).toBe(0);
    const payload = json<{
      auditId: number;
      reports: { format: string; filePath: string | null }[];
    }>(runtime);
    expect(payload.auditId).toBe(1);
    expect(payload.reports[0]?.format).toBe('markdown');
    const content = await readFile(payload.reports[0]!.filePath!, 'utf8');
    expect(content).toContain("Rapport d'audit");

    expect(await run(runtime, 'audit', 'report', '42')).toBe(3);
    expect(allOutput(runtime)).toMatch(/introuvable/);
  });

  it('compare : compare 2 audits et écrit le rapport de comparaison', async () => {
    seedAudit(dataDir, 70);
    seedAudit(dataDir, 85);
    const out = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-cli-cmp-')), 'reports');
    tempDirs.push(path.dirname(out));

    expect(
      await run(runtime, '--json', 'audit', 'compare', '1', '2', '--format', 'md', '--output', out),
    ).toBe(0);

    const payload = json<{
      evolution: { scoreA: number; scoreB: number; delta: number; trend: string };
      reports: { filePath: string | null }[];
      recommendations: string[];
    }>(runtime);
    expect(payload.evolution.scoreA).toBe(70);
    expect(payload.evolution.scoreB).toBe(85);
    expect(payload.evolution.delta).toBe(15);
    expect(payload.evolution.trend).toBe('improving');
    expect(payload.recommendations.length).toBeGreaterThan(0);

    const reportPath = payload.reports[0]?.filePath ?? '';
    const content = await readFile(reportPath, 'utf8');
    expect(content).toContain("Comparaison d'audits");
    expect(content).toContain('| performance | 70 | 85 | +15 | +21.4% |');

    expect(await run(runtime, 'audit', 'compare', '1', '404')).toBe(3);
    expect(allOutput(runtime)).toMatch(/introuvable/);
  });

  it("list s'exécute en moins de 500 ms (budget C11.4)", async () => {
    seedAudit(dataDir);
    const started = Date.now();
    expect(await run(runtime, 'audit', 'list')).toBe(0);
    expect(Date.now() - started).toBeLessThan(500);
  });

  it('report : refuse un format hors de md|pdf|both', async () => {
    seedAudit(dataDir);
    const out = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-cli-fmt-')), 'reports');
    tempDirs.push(path.dirname(out));

    expect(
      await run(runtime, 'audit', 'report', '1', '--format', 'docx', '--output', out),
    ).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/format invalide/);
  });

  it('list : refuse un --limit non entier strictement positif', async () => {
    expect(await run(runtime, 'audit', 'list', '--limit', '0')).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/--limit invalide/);

    expect(await run(runtime, 'audit', 'list', '--limit', 'abc')).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/--limit invalide/);
  });

  it('show : trie les constats du plus critique au moins critique', async () => {
    seedAudit(dataDir, 70, true);

    expect(await run(runtime, 'audit', 'show', '1')).toBe(0);
    const output = allOutput(runtime);
    expect(output).toContain('Contraste insuffisant');
    expect(output).toContain('LCP trop élevé');
    expect(output.indexOf('Contraste insuffisant')).toBeLessThan(output.indexOf('LCP trop élevé'));
    expect(output).toContain('🔴 Critical : 1');
  });

  it('report et compare en --format both produisent Markdown et PDF (double PDF)', async () => {
    seedAudit(dataDir, 70);
    seedAudit(dataDir, 85);
    const out = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-cli-both-')), 'reports');
    tempDirs.push(path.dirname(out));
    generatePdfMock.mockReset();
    generatePdfMock.mockResolvedValue({
      format: 'pdf',
      filePath: path.join(out, 'audit-1.pdf'),
      content: '%PDF-1.4 fake',
      generatedAt: '2026-10-25T00:00:00.000Z',
    });

    expect(
      await run(runtime, '--json', 'audit', 'report', '1', '--format', 'both', '--output', out),
    ).toBe(0);
    const reportPayload = json<{ reports: { format: string }[] }>(runtime);
    expect(reportPayload.reports.map((entry) => entry.format)).toEqual(['markdown', 'pdf']);

    expect(
      await run(
        runtime,
        '--json',
        'audit',
        'compare',
        '1',
        '2',
        '--format',
        'both',
        '--output',
        out,
      ),
    ).toBe(0);
    const comparePayload = json<{ reports: { format: string }[] }>(runtime);
    expect(comparePayload.reports.map((entry) => entry.format)).toEqual(['markdown', 'pdf']);

    expect(
      await run(runtime, '--json', 'audit', 'report', '1', '--format', 'pdf', '--output', out),
    ).toBe(0);
    const reportPdf = json<{ reports: { format: string }[] }>(runtime);
    expect(reportPdf.reports.map((entry) => entry.format)).toEqual(['pdf']);

    expect(
      await run(
        runtime,
        '--json',
        'audit',
        'compare',
        '1',
        '2',
        '--format',
        'pdf',
        '--output',
        out,
      ),
    ).toBe(0);
    const comparePdf = json<{ reports: { format: string }[] }>(runtime);
    expect(comparePdf.reports.map((entry) => entry.format)).toEqual(['pdf']);
    expect(generatePdfMock).toHaveBeenCalledTimes(4);
  });
});
