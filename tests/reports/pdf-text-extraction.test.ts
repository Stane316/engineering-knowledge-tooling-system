import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PDFReportGenerator } from '../../src/reports/pdf-generator.js';
import type { Priority } from '../../src/analysis/types.js';
import type { Audit, AuditFinding } from '../../src/storage/types.js';
import { resolveTestChromium } from '../helpers/chromium.js';

/**
 * Sprint 19-02 — C-W03, volet PDF **texte extrait**.
 *
 * Le critère ne se satisfait pas de l'existence d'un fichier : le décompte par
 * priorité doit être lisible **dans le texte extrait du PDF**. Un PDF produit
 * mais illisible ne compte pas (`22` l. 109 : « Si extracteur PDF ou navigateur
 * indisponible : bloqué, pas réussi »).
 *
 * Sans Chromium, la suite est **sautée explicitement** (jamais simulée).
 */
const CHROMIUM = await resolveTestChromium();
const SKIP = CHROMIUM === undefined;

const PRIORITIES: readonly Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

/** Constat persisté minimal. */
function makeFinding(
  dimension: AuditFinding['dimension'],
  priority: Priority,
  title: string,
): AuditFinding {
  return {
    auditId: 9,
    dimension,
    title,
    description: `Description de ${title}`,
    severity: 2,
    effort: 2,
    impact: 3,
    priority,
    recommendation: `Corriger ${title}`,
  };
}

/** Audit à cinq priorités non vides. */
function makeAudit(): Audit {
  const findings: AuditFinding[] = [
    makeFinding('performance', 'critical', 'LCP critique'),
    makeFinding('accessibility', 'high', 'Contraste insuffisant'),
    makeFinding('seo', 'medium', 'Balise de titre absente'),
    makeFinding('ux', 'low', 'Retour visuel manquant'),
    makeFinding('content', 'info', 'Information de contexte'),
  ];

  return {
    metadata: {
      id: 9,
      url: 'https://fixture.example/pdf-19-02',
      timestamp: '2026-10-30T12:00:00.000Z',
      overallScore: 58,
      totalFindings: findings.length,
      criticalFindings: 1,
      highFindings: 1,
      mediumFindings: 1,
      lowFindings: 1,
      infoFindings: 1,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension, index) => ({ auditId: 9, dimension, score: 55 + index, findingsCount: 1 }),
    ),
    findings,
  };
}

/** Extrait le texte lisible d'un PDF (pdfjs-dist, moteur réel). */
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

describe.skipIf(SKIP)('Sprint 19-02 — C-W03 texte extrait du PDF', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await mkdtemp(path.join(tmpdir(), 'ekts-pdf-'));
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  it('produit un PDF dont le texte contient les cinq compteurs', async () => {
    const audit = makeAudit();
    const result = await new PDFReportGenerator().generate(audit, {
      outputPath: outputDir,
      executablePath: CHROMIUM,
    });

    expect(result.filePath).toBeDefined();
    expect(existsSync(result.filePath ?? '')).toBe(true);

    // Signature réelle du format, indépendante de l'extension.
    const bytes = await readFile(result.filePath ?? '');
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const text = await extractPdfText(result.filePath ?? '');
    const metadata = audit.metadata;

    // Chaque priorité est nommée dans le texte extrait.
    expect(text).toContain('Critical');
    expect(text).toContain('High');
    expect(text).toContain('Medium');
    expect(text).toContain('Low');
    expect(text).toContain('Info');

    // Le total est lisible et cohérent avec les cinq compteurs.
    expect(text).toContain(String(metadata.totalFindings));
    expect(
      PRIORITIES.map(
        (priority) => metadata[`${priority}Findings` as keyof typeof metadata] as number,
      ).reduce((sum, value) => sum + value, 0),
    ).toBe(metadata.totalFindings);

    // Le score global et l'identifiant d'audit sont extractibles.
    expect(text).toContain(`${String(metadata.overallScore)}/100`);
    expect(text).toContain(`#${String(metadata.id)}`);

    // Aucune trace d'un rendu non résolu.
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('NaN');
  }, 60_000);
});
