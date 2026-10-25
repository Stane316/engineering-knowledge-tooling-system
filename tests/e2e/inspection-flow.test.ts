/**
 * Sprint 12-1 — E2E : flux inspection → analyse → stockage → rapports.
 *
 * **Réseau zéro.** Une page de référence (structure + défauts d'accessibilité
 * connus) est servie sur `127.0.0.1` : le flux exécute Playwright et
 * Lighthouse réellement, sans dépendre d'aucun site public.
 *
 * **Conditionnel.** Les moteurs Playwright ne sont présents que si
 * `npx playwright install chromium firefox webkit` a été lancé (postes
 * développeur). Sans binaire Chromium, toute la suite est « skipped » et la
 * commande `npm test tests/e2e/` reste verte ailleurs (comme en CI).
 */
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import { fromInspection } from '../../src/analysis/adapter.js';
import type { L3InspectionResult } from '../../src/browser/inspection/types.js';
import { Inspector } from '../../src/browser/inspection/inspector.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import { PDFReportGenerator } from '../../src/reports/pdf-generator.js';
import { openDatabase } from '../../src/data/database.js';
import type { AnalysisReport } from '../../src/analysis/types.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditIndexer } from '../../src/storage/indexing.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { browserExecutable, probeEngines } from '../browser/helpers.js';

/** Page de référence : mêmes défauts connus que l'intégration navigateur. */
const FIXTURE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Page de référence E2E — inspection complète</title>
    <meta name="description" content="Page de référence servie en local pour les tests E2E du Sprint 12." />
  </head>
  <body>
    <h1>Inspection navigateur E2E</h1>
    <h3>Titre qui saute un niveau</h3>
    <p>Texte de référence suffisamment long pour l'analyse de contenu du pipeline d'audit.</p>
    <a href="/valide">Lien correct</a>
    <a href="/sans-nom"></a>
    <img src="/pixel.png" />
    <img src="/logo.png" alt="Logo EKTS" />
    <button>Valider</button>
    <button></button>
    <label for="recherche">Rechercher</label>
    <input id="recherche" />
    <input />
  </body>
</html>`;

const engines = await probeEngines();

/** Chromium présent et fonctionnel (navigation + Lighthouse + rendu PDF). */
const CHROMIUM_OK = engines.chromium.ok;
/** Résolution PDF : le générateur trouve aussi le Chromium Playwright. */
const PDF_OK = browserExecutable('chromium') !== null;

/** Sert la page de référence sur 127.0.0.1 (port libre). */
async function startFixtureServer(): Promise<{ url: string; close(): Promise<void> }> {
  const server: Server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(FIXTURE_HTML);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}/`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error !== undefined ? reject(error) : resolve()));
      }),
  };
}

describe.skipIf(!CHROMIUM_OK)('E2E — inspection-flow', () => {
  let fixture: { url: string; close(): Promise<void> };
  let outputDir: string;

  beforeAll(async () => {
    fixture = await startFixtureServer();
    outputDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-inspection-'));
  });

  afterAll(async () => {
    await fixture.close();
    await rm(outputDir, { recursive: true, force: true });
  });

  it('exécute la chaîne complète : inspecter → analyser → stocker → indexer → rapports', async () => {
    // 1. Inspection L3 réelle (Playwright + Lighthouse + axe-core).
    const inspection = await new Inspector().inspect({ url: fixture.url, level: 'L3' });

    expect(inspection.level).toBe('L3');
    expect(inspection.url).toBe(fixture.url);

    const l3 = inspection as L3InspectionResult;
    expect(l3.lighthouse).not.toBeNull();
    expect(l3.axe).not.toBeNull();
    expect(l3.ux.score).toBeGreaterThanOrEqual(0);
    expect(l3.content.wordCount).toBeGreaterThan(0);

    // 2. Analyse 5 dimensions (pont d'adaptation Sprint 9, comme la CLI).
    const inputs = fromInspection(l3);
    const report: AnalysisReport = await new AnalysisPipeline().analyze(
      fixture.url,
      inputs.lighthouse,
      inputs.axe,
      inputs.ux,
      inputs.content,
    );

    expect(report.url).toBe(fixture.url);
    for (const dimension of ['performance', 'accessibility', 'seo', 'ux', 'content'] as const) {
      const score = report.dimensions[dimension].score;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.overallScore).toBeLessThanOrEqual(100);

    // 3. Stockage + indexation FTS dans une base isolée.
    const database = openDatabase({ dataDir: outputDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      const audit = repository.store(report);
      expect(audit.metadata.id).toBeGreaterThan(0);

      const outcome = await new AuditIndexer(database.connection).indexAudit(audit);
      expect(outcome.ftsRows).toBeGreaterThanOrEqual(0);

      // 4. Relecture.
      const retrieved = repository.findById(audit.metadata.id!);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.metadata.url).toBe(fixture.url);
      expect(retrieved!.metadata.overallScore).toBe(report.summary.overallScore);

      // 5. Rapport Markdown écrit sur disque.
      const markdown = await new MarkdownReportGenerator().generate(retrieved!, {
        outputPath: outputDir,
      });
      expect(markdown.format).toBe('markdown');
      expect(markdown.filePath).toBeDefined();
      const content = await import('node:fs/promises').then((fs) =>
        fs.readFile(markdown.filePath!, 'utf8'),
      );
      expect(content).toContain(fixture.url);
    } finally {
      database.close();
    }
  }, 60_000);

  it.skipIf(!PDF_OK)(
    "génère le PDF de l'audit du flux (C11.2 actif en E2E)",
    async () => {
      // Réutilise l'audit du test précédent : aucune seconde navigation (budget).
      const database = openDatabase({ dataDir: outputDir });
      try {
        const audit = new AuditRepository(database.connection).findByUrl(fixture.url)[0];
        expect(audit).toBeDefined();

        const pdf = await new PDFReportGenerator().generate(audit!, { outputPath: outputDir });

        expect(pdf.format).toBe('pdf');
        expect(Buffer.from(pdf.content, 'base64').subarray(0, 4).toString('latin1')).toBe('%PDF');
        expect(pdf.filePath).toBeDefined();
      } finally {
        database.close();
      }
    },
    60_000,
  );

  it('conserve deux audits successifs pour la même URL', async () => {
    // Base dédiée : indépendante des audits des autres tests du fichier
    // (sinon le total pour l'URL inclut ceux de la chaîne complète).
    const isolatedDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-two-audits-'));
    const database = openDatabase({ dataDir: isolatedDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      const pipeline = new AnalysisPipeline();

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const inspection = (await new Inspector().inspect({
          url: fixture.url,
          level: 'L3',
        })) as L3InspectionResult;
        const inputs = fromInspection(inspection);
        const report = await pipeline.analyze(
          fixture.url,
          inputs.lighthouse,
          inputs.axe,
          inputs.ux,
          inputs.content,
        );
        repository.store(report);
      }

      expect(repository.findByUrl(fixture.url)).toHaveLength(2);
    } finally {
      database.close();
      await rm(isolatedDir, { recursive: true, force: true });
    }
  }, 90_000);
});
