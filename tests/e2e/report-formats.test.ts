import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import type {
  AxeResults,
  ContentResults,
  LighthouseResults,
  UXResults,
} from '../../src/analysis/types.js';
import { openDatabase } from '../../src/data/database.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { resolveTestChromium } from '../helpers/chromium.js';

/**
 * Sprint 19-02 — C-W03, niveau **E2E** exigé par `SPRINT-19-02.md` §5 :
 * « produire les trois formats et extraire le texte du PDF ».
 *
 * Parcours réel : fixtures synthétiques → `AnalysisPipeline` →
 * `AuditRepository.store` → **CLI compilée** `audit report --format all` →
 * trois fichiers sur disque → extraction du texte du PDF.
 *
 * `C-W03` ne tolère pas une étape simulée : sans navigateur, le cas PDF est
 * rapporté `bloqué`, jamais « réussi ». Ici le binaire est résolu une fois et
 * la suite est sautée explicitement s'il est absent.
 */
const ROOT = process.cwd();
const CLI = path.join(ROOT, 'dist', 'cli', 'index.js');
const CHROMIUM = await resolveTestChromium();
const SKIP = CHROMIUM === undefined;

/** Résultat d'une exécution CLI. */
interface CliResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Exécute la CLI compilée dans un bac à sable isolé. */
function runCli(dataDir: string, args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      {
        env: {
          ...process.env,
          EKTS_DATA_DIR: dataDir,
          EKTS_OFFLINE: '1',
          NO_COLOR: '1',
          FORCE_COLOR: '0',
          ...(CHROMIUM === undefined ? {} : { EKTS_CHROME_PATH: CHROMIUM }),
        },
        timeout: 120_000,
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const status =
          error === null
            ? 0
            : typeof (error as { code?: unknown }).code === 'number'
              ? (error as { code: number }).code
              : 1;
        resolve({ status, stdout, stderr });
      },
    );
  });
}

const lighthouse: LighthouseResults = {
  performance: { score: 72, metrics: { lcp: 3200, fid: 180, cls: 0.2, ttfb: 1100 } },
  seo: { score: 78, issues: [] },
};

const axe: AxeResults = {
  violations: [
    {
      id: 'color-contrast',
      impact: 'critical',
      description: 'Contraste insuffisant',
      help: 'Augmenter le contraste',
      helpUrl: 'https://example.com/contrast',
      nodes: 3,
    },
  ],
  score: 68,
};

const ux: UXResults = {
  score: 62,
  heuristics: [
    { id: 'visibility', name: 'Statut du système', score: 40, issues: ['Aucun retour visuel'] },
  ],
};

/** 250 mots : constat `medium` (severity 3, effort 3). */
const content: ContentResults = {
  score: 58,
  metrics: { wordCount: 250, readingTime: 2, readabilityScore: 50 },
};

/** Texte lisible d'un PDF (moteur pdfjs-dist réel). */
async function extractPdfText(filePath: string): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await readFile(filePath));
  const document = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  let text = '';
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    text += `${content.items.map((item) => ('str' in item ? item.str : '')).join(' ')}\n`;
  }
  await document.cleanup();

  return text.replace(/\s+/gu, ' ');
}

describe.skipIf(SKIP)('Sprint 19-02 — E2E trois formats et texte du PDF (C-W03)', () => {
  let sandbox: string;
  let dataDir: string;
  let outputDir: string;
  let auditId: number;

  beforeAll(async () => {
    sandbox = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-1902-'));
    dataDir = path.join(sandbox, 'data');
    outputDir = path.join(sandbox, 'reports');

    const report = await new AnalysisPipeline().analyze(
      'https://fixture.example/audit-19-02',
      lighthouse,
      axe,
      ux,
      content,
    );

    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      auditId = new AuditRepository(database.connection).store(report).metadata.id ?? 0;
    } finally {
      database.close();
    }
  }, 120_000);

  afterAll(async () => {
    await rm(sandbox, { recursive: true, force: true });
  });

  it('produit réellement les trois formats en une commande', async () => {
    const result = await runCli(dataDir, [
      'audit',
      'report',
      String(auditId),
      '--format',
      'all',
      '--output',
      outputDir,
      '--json',
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');

    const payload = JSON.parse(result.stdout) as {
      auditId: number;
      reports: Array<{ format: string; filePath: string | null }>;
    };

    expect(payload.auditId).toBe(auditId);
    expect(payload.reports.map((entry) => entry.format).sort()).toEqual([
      'html',
      'markdown',
      'pdf',
    ]);

    for (const entry of payload.reports) {
      expect(entry.filePath, `chemin ${entry.format}`).not.toBeNull();
      expect(existsSync(entry.filePath ?? '')).toBe(true);
    }

    const files = await readdir(outputDir);
    expect(files.filter((name) => name.endsWith('.md'))).toHaveLength(1);
    expect(files.filter((name) => name.endsWith('.html'))).toHaveLength(1);
    expect(files.filter((name) => name.endsWith('.pdf'))).toHaveLength(1);
  }, 120_000);

  it('retrouve le décompte par priorité dans les trois rendus', async () => {
    const files = await readdir(outputDir);
    const markdownFile = files.find((name) => name.endsWith('.md'));
    const htmlFile = files.find((name) => name.endsWith('.html'));
    const pdfFile = files.find((name) => name.endsWith('.pdf'));

    expect(markdownFile).toBeDefined();
    expect(htmlFile).toBeDefined();
    expect(pdfFile).toBeDefined();

    const markdown = await readFile(path.join(outputDir, markdownFile ?? ''), 'utf8');
    const html = await readFile(path.join(outputDir, htmlFile ?? ''), 'utf8');
    const pdfText = await extractPdfText(path.join(outputDir, pdfFile ?? ''));

    for (const [label, text] of [
      ['Markdown', markdown],
      ['HTML', html],
      ['PDF', pdfText],
    ] as const) {
      for (const priority of ['Critical', 'High', 'Medium', 'Low', 'Info'] as const) {
        expect(text, `${label} — ${priority}`).toContain(priority);
      }
    }

    // La signature du PDF est réelle, pas un fichier vide renommé.
    const pdfBytes = await readFile(path.join(outputDir, pdfFile ?? ''));
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    // Les deux rendus texte portent la mention d'ordre de recommandation.
    expect(markdown).toContain('Ordre de recommandation');
    expect(html).toContain('Ordre de recommandation');
  }, 120_000);

  it('refuse un format inconnu sans rien produire', async () => {
    const result = await runCli(dataDir, [
      'audit',
      'report',
      String(auditId),
      '--format',
      'docx',
      '--output',
      path.join(sandbox, 'refus'),
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('format invalide');
    expect(existsSync(path.join(sandbox, 'refus'))).toBe(false);
  }, 120_000);
});
