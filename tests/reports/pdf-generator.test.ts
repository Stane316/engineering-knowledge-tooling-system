import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PDFReportGenerator } from '../../src/reports/pdf-generator.js';
import type { ComparisonReport } from '../../src/reports/types.js';
import type { Audit } from '../../src/storage/types.js';

/** Audit de test compact. */
function makeAudit(id = 5): Audit {
  return {
    metadata: {
      id,
      url: 'https://example.com',
      timestamp: '2026-10-24T10:00:00.000Z',
      overallScore: 82,
      totalFindings: 2,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 1,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension, index) => ({
        auditId: id,
        dimension,
        score: 70 + index,
        findingsCount: index,
      }),
    ),
    findings: [
      {
        auditId: id,
        dimension: 'performance',
        title: 'LCP lent',
        severity: 3,
        effort: 2,
        impact: 5,
        priority: 'high',
        recommendation: "Précharger l'image héros",
      },
      {
        auditId: id,
        dimension: 'accessibility',
        title: 'Contraste faible',
        severity: 2,
        effort: 1,
        impact: 3,
        priority: 'medium',
        recommendation: 'Assombrir le texte secondaire',
      },
    ],
  };
}

/** Comparaison valide minimale. */
function makeComparison(): ComparisonReport {
  const auditA = makeAudit(1);
  const auditB = makeAudit(2);
  return {
    auditA,
    auditB,
    deltaScores: [{ dimension: 'seo', scoreA: 70, scoreB: 75, delta: 5, percentage: 7.1 }],
    deltaFindings: {
      newFindings: [],
      resolvedFindings: [auditA.findings[1]!],
      persistentFindings: [auditA.findings[0]!],
      improvedFindings: [],
    },
    evolution: { scoreA: 82, scoreB: 85, delta: 3, percentage: 3.7, trend: 'stable' },
    recommendations: ['Poursuivre les correctifs SEO'],
  };
}

/**
 * Reproduit la résolution Chrome du générateur pour deciding `skipIf`
 * (poste sans Chromium : les tests de rendu sont sautés, les contrôles restent).
 *
 * `puppeteer.executablePath()` renvoie une `Promise<string>` (contrat de
 * puppeteer-core ≥ 23, vérifié sur 25.16) : une lecture synchrone passait
 * un `Promise` à `existsSync` (faux, avec un DeprecationWarning Node) et
 * forçait le skip **même avec Chrome installé** — d'où `await`.
 */
async function resolveTestChromium(): Promise<string | undefined> {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.EKTS_CHROME_PATH;
  if (envPath !== undefined && envPath.length > 0 && existsSync(envPath)) return envPath;
  try {
    const require = createRequire(import.meta.url);
    const bundled = await (
      require('puppeteer') as { executablePath(): Promise<string> }
    ).executablePath();
    if (existsSync(bundled)) return bundled;
  } catch {
    // puppeteer absent ou Chrome non téléchargé.
  }
  const roots = [path.join(homedir(), '.cache', 'ms-playwright')];
  const binaries = [
    path.join('chrome-linux64', 'chrome'),
    path.join('chrome-linux', 'chrome'),
    path.join('chrome-win', 'chrome.exe'),
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root)
      .filter((name) => name.startsWith('chromium'))
      .sort()
      .reverse()) {
      for (const binary of binaries) {
        const candidate = path.join(root, entry, binary);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  // Chrome système (images CI ubuntu) :
  for (const candidate of [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/opt/google/chrome/chrome',
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const chromium = await resolveTestChromium();

describe("PDFReportGenerator — contrôles d'erreur", () => {
  it('refuse un audit sans métadonnées', async () => {
    const generator = new PDFReportGenerator();
    await expect(generator.generate({} as unknown as Audit)).rejects.toThrow(/Audit invalide/);
  });

  it('refuse une comparaison incomplète', async () => {
    const generator = new PDFReportGenerator();
    await expect(generator.generateComparison({} as unknown as ComparisonReport)).rejects.toThrow(
      /Comparaison invalide/,
    );
  });

  it('signale explicitement un Chrome imposé introuvable', async () => {
    const generator = new PDFReportGenerator();
    await expect(
      generator.generate(makeAudit(), { executablePath: '/chrome/inexistant/binaire' }),
    ).rejects.toThrow(/Chrome introuvable/);
  });
});

describe.skipIf(chromium === undefined)('PDFReportGenerator — rendu Puppeteer', () => {
  const cleanups: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanups.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  // Premier lancement de Chrome à froid : sur Windows, l'antivirus analyse le
  // binaire fraîchement téléchargé et l'init process dépasse 15 s (constaté :
  // les deux premiers rendus timeoutaient, les suivants passaient à chaud).
  // Ce warm-up absorbe le cold start hors des tests chronométrés — le contrat
  // C11.2 mesure la performance du rendu, pas l'analyse d'antivirus.
  beforeAll(async () => {
    const warmDir = await mkdtemp(path.join(tmpdir(), 'ekts-pdf-warm-'));
    try {
      await new PDFReportGenerator().generate(makeAudit(99), {
        outputPath: path.join(warmDir, 'reports'),
      });
    } finally {
      await rm(warmDir, { recursive: true, force: true });
    }
  }, 60_000);

  it('produit un PDF A4 valide dans outputPath en moins de 10 secondes (C11.2)', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-pdf-')), 'reports');
    cleanups.push(path.dirname(dir));

    const generator = new PDFReportGenerator();
    const started = performance.now();
    const report = await generator.generate(makeAudit(), { outputPath: dir });
    const elapsed = performance.now() - started;

    expect(report.format).toBe('pdf');
    expect(report.filePath).toMatch(/audit-5-.*\.pdf$/);
    expect(elapsed).toBeLessThan(10_000);

    const base64 = Buffer.from(report.content, 'base64');
    expect(base64.subarray(0, 4).toString('latin1')).toBe('%PDF');
    const written = await readFile(report.filePath!);
    expect(written.subarray(0, 4).toString('latin1')).toBe('%PDF');
    const info = await stat(report.filePath!);
    expect(info.size).toBeGreaterThan(1_000);
  }, 30_000);

  it('génère un PDF en mémoire sans outputPath', async () => {
    const generator = new PDFReportGenerator();
    const report = await generator.generate(makeAudit(9));

    expect(report.filePath).toBeUndefined();
    expect(Buffer.from(report.content, 'base64').subarray(0, 4).toString('latin1')).toBe('%PDF');
  }, 30_000);

  it("produit le PDF d'une comparaison", async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'ekts-pdf-cmp-')), 'reports');
    cleanups.push(path.dirname(dir));

    const generator = new PDFReportGenerator();
    const report = await generator.generateComparison(makeComparison(), { outputPath: dir });

    expect(report.filePath).toMatch(/comparison-2-.*\.pdf$/);
    expect(Buffer.from(report.content, 'base64').subarray(0, 4).toString('latin1')).toBe('%PDF');
  }, 30_000);

  it('refuse un outputPath vide après rendu', async () => {
    const generator = new PDFReportGenerator();
    await expect(generator.generate(makeAudit(), { outputPath: '' })).rejects.toThrow(/outputPath/);
  }, 30_000);
});
