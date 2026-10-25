/**
 * Sprint 12-1 — E2E : chaîne MCP `inspect_site` → `audit_history` → `audit_report`.
 *
 * Serveur MCP complet en mémoire (handshake réel du SDK), services ouverts
 * sur une base SQLite temporaire, navigation authentique sur une page servie
 * en local. Aucun réseau externe.
 *
 * Sans Chromium Playwright installé, la suite est « skipped » (cf. CI).
 */
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createEktsServer } from '../../src/mcp/server.js';
import { SILENT_LOGGER } from '../../src/mcp/utils/logger.js';
import { browserExecutable, probeEngines } from '../browser/helpers.js';
import { openTestServices, type TestServices } from '../mcp/helpers.js';

/** Page locale inspectée par le flux MCP. */
const FIXTURE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Page E2E MCP</title>
    <meta name="description" content="Page locale pour le flux MCP E2E du Sprint 12." />
  </head>
  <body>
    <h1>Flux MCP E2E</h1>
    <p>Page inspectée par l'outil <code>inspect_site</code> via le serveur MCP complet.</p>
    <img src="/pixel.png" alt="" />
    <button></button>
  </body>
</html>`;

const engines = await probeEngines();
const CHROMIUM_OK = engines.chromium.ok;
const PDF_OK = browserExecutable('chromium') !== null;

/** Premier texte d'un résultat d'outil MCP. */
function firstText(result: CallToolResult): string {
  const block = result.content[0];
  return block !== undefined && block.type === 'text' ? block.text : '';
}

describe.skipIf(!CHROMIUM_OK)('E2E — mcp-flow', () => {
  let fixture: TestServices;
  let serveur: {
    client: Client;
    close(): Promise<void>;
  };
  let page: { url: string; close(): Promise<void> };
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

    outputDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-mcp-'));
    fixture = openTestServices();

    const mcpServer = createEktsServer({ context: fixture.services, logger: SILENT_LOGGER });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'ekts-e2e', version: '1.0.0' });
    await Promise.all([mcpServer.connect(serverTransport), client.connect(clientTransport)]);

    serveur = {
      client,
      close: async () => {
        await client.close();
        await mcpServer.close();
      },
    };
  });

  afterAll(async () => {
    await serveur.close();
    await page.close();
    fixture.cleanup();
    await rm(outputDir, { recursive: true, force: true });
  });

  it('inspect_site réalise la navigation et crée l’audit', async () => {
    const result = (await serveur.client.callTool({
      name: 'inspect_site',
      arguments: { url: page.url },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result)) as {
      inspection_url: string;
      level: string;
      score: number;
      audit_id: number;
      dimensions: Record<string, number>;
    };

    expect(result.isError).toBeFalsy();
    expect(payload.inspection_url).toBe(page.url);
    expect(payload.level).toBe('L3');
    expect(payload.score).toBeGreaterThanOrEqual(0);
    expect(payload.score).toBeLessThanOrEqual(100);
    expect(payload.audit_id).toBeGreaterThan(0);
    expect(Object.keys(payload.dimensions)).toHaveLength(5);
  }, 60_000);

  it('audit_history restitue l’audit créé avec ses filtres', async () => {
    const result = (await serveur.client.callTool({
      name: 'audit_history',
      arguments: { limit: 10 },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result)) as {
      audits: { id: number; url: string; overall_score: number }[];
    };

    expect(result.isError).toBeFalsy();
    expect(payload.audits.length).toBeGreaterThanOrEqual(1);
    expect(payload.audits[0]?.url).toBe(page.url);
    expect(payload.audits[0]?.overall_score).toBeGreaterThanOrEqual(0);

    const filtered = (await serveur.client.callTool({
      name: 'audit_history',
      arguments: { url: 'https://jamais-auditée.example/', limit: 5 },
    })) as CallToolResult;
    const filteredPayload = JSON.parse(firstText(filtered)) as { audits: unknown[] };
    expect(filteredPayload.audits).toEqual([]);
  });

  it('audit_report génère le Markdown complet de l’audit', async () => {
    const history = (await serveur.client.callTool({
      name: 'audit_history',
      arguments: { limit: 1 },
    })) as CallToolResult;
    const auditId = (JSON.parse(firstText(history)) as { audits: { id: number }[] }).audits[0]?.id;
    expect(auditId).toBeGreaterThan(0);

    const result = (await serveur.client.callTool({
      name: 'audit_report',
      arguments: { audit_id: auditId },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result)) as {
      audit_id: number;
      url: string;
      report_content: string;
      generated_at: string;
    };

    expect(result.isError).toBeFalsy();
    expect(payload.audit_id).toBe(auditId);
    expect(payload.url).toBe(page.url);
    expect(payload.report_content).toContain('Rapport');
    expect(payload.report_content).toContain(page.url);
    expect(payload.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it.skipIf(!PDF_OK)(
    'génère le PDF associé à l’audit via le générateur réel',
    async () => {
      const history = (await serveur.client.callTool({
        name: 'audit_history',
        arguments: { limit: 1 },
      })) as CallToolResult;
      const auditId = (JSON.parse(firstText(history)) as { audits: { id: number }[] }).audits[0]
        ?.id;

      const { PDFReportGenerator } = await import('../../src/reports/pdf-generator.js');

      const audit = fixture.services.audits.repository.findById(auditId!);
      expect(audit).not.toBeNull();

      const pdf = await new PDFReportGenerator().generate(audit!, { outputPath: outputDir });
      expect(pdf.format).toBe('pdf');
      expect(Buffer.from(pdf.content, 'base64').subarray(0, 4).toString('latin1')).toBe('%PDF');
    },
    60_000,
  );
});
