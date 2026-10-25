/**
 * Sprint 12-1 — E2E : scénario utilisateur complet (Sprint 12, §7.1).
 *
 * Inspection → analyse → stockage → indexation → rapports → seconde
 * inspection → comparaison → statistiques → recherche historique, exactement
 * le chemin de bout en bout décrit dans la spécification. Navigation sur une
 * page locale uniquement (aucun réseau externe), base de données isolée.
 *
 * Sans Chromium Playwright installé, la suite est « skipped » (cf. CI).
 */
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import { fromInspection } from '../../src/analysis/adapter.js';
import type { AnalysisReport } from '../../src/analysis/types.js';
import { Inspector } from '../../src/browser/inspection/inspector.js';
import type { L3InspectionResult } from '../../src/browser/inspection/types.js';
import { openDatabase } from '../../src/data/database.js';
import { AuditComparator } from '../../src/reports/comparator.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import { PDFReportGenerator } from '../../src/reports/pdf-generator.js';
import { AuditIndexer } from '../../src/storage/indexing.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AuditSearch } from '../../src/storage/search.js';
import { AuditStatisticsManager } from '../../src/storage/statistics.js';
import { browserExecutable, probeEngines } from '../browser/helpers.js';

/** Page locale : défauts d'accessibilité connus pour un contenu stable. */
const FIXTURE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Page E2E — workflow complet</title>
    <meta name="description" content="Page de référence du scénario utilisateur complet Sprint 12." />
  </head>
  <body>
    <h1>Workflow utilisateur complet</h1>
    <p>Texte de référence pour l'analyse de contenu, la performance et le SEO du scénario E2E complet.</p>
    <img src="/pixel.png" />
    <a href="/suivant">Lien suivant</a>
    <button></button>
  </body>
</html>`;

const engines = await probeEngines();
const CHROMIUM_OK = engines.chromium.ok;
const PDF_OK = browserExecutable('chromium') !== null;

/** Inspecte puis analyse : la chaîne navigateur → rapport exécutée deux fois. */
async function inspectAndAnalyze(url: string): Promise<AnalysisReport> {
  const inspection = (await new Inspector().inspect({ url, level: 'L3' })) as L3InspectionResult;
  const inputs = fromInspection(inspection);

  return new AnalysisPipeline().analyze(
    url,
    inputs.lighthouse,
    inputs.axe,
    inputs.ux,
    inputs.content,
  );
}

describe.skipIf(!CHROMIUM_OK)('E2E — full-workflow', () => {
  let page: { url: string; close(): Promise<void> };
  let dataDir: string;
  let outputDir: string;

  beforeAll(async () => {
    const server: Server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(FIXTURE_HTML);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    page = {
      url: `http://127.0.0.1:${port}/`,
      close: () =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error !== undefined ? reject(error) : resolve()));
        }),
    };

    dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-full-'));
    outputDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-full-out-'));
  });

  afterAll(async () => {
    await page.close();
    await Promise.all([dataDir, outputDir].map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('parcourt les dix étapes du scénario utilisateur de bout en bout', async () => {
    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const repository = new AuditRepository(database.connection);
      const indexer = new AuditIndexer(database.connection);
      const markdown = new MarkdownReportGenerator();

      // 1-2. Inspection + analyse du premier passage.
      const report1 = await inspectAndAnalyze(page.url);
      expect(report1.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report1.summary.overallScore).toBeLessThanOrEqual(100);

      // 3. Stockage + indexation.
      const audit1 = repository.store(report1);
      const outcome1 = await indexer.indexAudit(audit1);
      expect(audit1.metadata.id).toBeGreaterThan(0);
      expect(outcome1.ftsRows).toBeGreaterThanOrEqual(0);

      // 4. Rapport Markdown.
      const md1 = await markdown.generate(audit1, { outputPath: outputDir });
      expect(md1.filePath).toBeDefined();

      // 5. Seconde inspection (« après corrections »).
      const report2 = await inspectAndAnalyze(page.url);
      const audit2 = repository.store(report2);
      await indexer.indexAudit(audit2);

      // 6. Comparaison.
      const comparison = new AuditComparator().compare(audit1, audit2);
      expect(comparison.evolution.scoreA).toBe(audit1.metadata.overallScore);
      expect(comparison.evolution.scoreB).toBe(audit2.metadata.overallScore);
      expect(comparison.recommendations.length).toBeGreaterThan(0);

      // 7. Rapport de comparaison.
      const mdComparison = await markdown.generateComparison(comparison, {
        outputPath: outputDir,
      });
      expect(mdComparison.filePath).toBeDefined();

      // 8. Recherche dans l'historique.
      const search = new AuditSearch(database.connection, repository);
      const results = await search.search({ query: 'audit', limit: 10 });
      expect(Array.isArray(results)).toBe(true);

      // 9. Statistiques agrégées.
      const statistics = new AuditStatisticsManager(database.connection);
      const totals = statistics.getStatistics();
      expect(totals.totalAudits).toBeGreaterThanOrEqual(2);
      expect(totals.averageScore).toBeGreaterThanOrEqual(0);
      expect(statistics.getTrend('week')).toBeDefined();
      expect(statistics.getTopIssues(10)).toBeDefined();

      // 10. Vérification finale : deux audits pour la page inspectée.
      expect(repository.findByUrl(page.url).length).toBeGreaterThanOrEqual(2);
    } finally {
      database.close();
    }
  }, 120_000);

  it.skipIf(!PDF_OK)(
    'clôt le scénario par les deux rapports de fichiers (Markdown + PDF)',
    async () => {
      const database = openDatabase({ dataDir });
      try {
        const repository = new AuditRepository(database.connection);
        const audits = repository.findByUrl(page.url);
        expect(audits.length).toBeGreaterThanOrEqual(1);

        const audit = audits[0]!;
        const pdf = await new PDFReportGenerator().generate(audit, { outputPath: outputDir });

        expect(pdf.format).toBe('pdf');
        expect(Buffer.from(pdf.content, 'base64').subarray(0, 4).toString('latin1')).toBe('%PDF');
        expect(pdf.filePath).toBeDefined();
      } finally {
        database.close();
      }
    },
    60_000,
  );
});
