/**
 * Sprint 12-1 — E2E : chaîne CLI `ekts inspect` → `ekts audit`.
 *
 * La CLI compilée (`dist/cli/index.js`) est exécution réelle, avec un
 * répertoire de données isolé et `EKTS_OFFLINE=1` (aucun appel réseau
 * d'embeddings). L'inspection porte sur une page servie en local : le flux
 * navigateur est authentique, hors ligne, et déterministe.
 *
 * Sans Chromium Playwright installé, la suite est « skipped » (cf. CI).
 */
import { execFileSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { probeEngines } from '../browser/helpers.js';

const ROOT = process.cwd();
const CLI = path.join(ROOT, 'dist', 'cli', 'index.js');
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/** Page locale avec défauts d'accessibilité connus. */
const FIXTURE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Page E2E CLI</title>
    <meta name="description" content="Page locale pour le flux CLI E2E." />
  </head>
  <body>
    <h1>Flux CLI E2E</h1>
    <p>Page inspectée par <code>ekts inspect</code> depuis les tests du Sprint 12.</p>
    <img src="/pixel.png" />
    <button></button>
  </body>
</html>`;

const engines = await probeEngines();
const CHROMIUM_OK = engines.chromium.ok;

/** Sortie enrichie d'une exécution CLI. */
interface CliResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Exécute la CLI compilée dans le bac à sable de données du test. */
function cli(dataDir: string, ...args: string[]): CliResult {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
      env: { ...process.env, EKTS_DATA_DIR: dataDir, EKTS_OFFLINE: '1' },
      // 120 s : premier lancement de Chrome + Lighthouse sur poste Windows
      // sous charge (antivirus) dépassait 60 s, masquant la vraie cause.
      timeout: 120_000,
    });

    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };

    return {
      status: failure.status ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    };
  }
}

/** Échec parlant : la sortie d'erreur complète (sinon « status 1 » muet). */
function expectOk(result: CliResult): void {
  expect(
    result.status,
    `CLI en échec (${String(result.status)}) — stderr:\n${result.stderr}\nstdout:\n${result.stdout}`,
  ).toBe(0);
}

describe.skipIf(!CHROMIUM_OK)('E2E — cli-flow', () => {
  let fixture: { url: string; close(): Promise<void> };
  let dataDir: string;
  let outputDir: string;

  beforeAll(async () => {
    if (!existsSync(CLI)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    const server: Server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(FIXTURE_HTML);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    fixture = {
      url: `http://127.0.0.1:${port}/`,
      close: () =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error !== undefined ? reject(error) : resolve()));
        }),
    };

    dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-cli-data-'));
    outputDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-cli-out-'));
  });

  afterAll(async () => {
    await fixture.close();
    await Promise.all([dataDir, outputDir].map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('inspect une page locale et affiche le bilan', () => {
    const result = cli(dataDir, 'inspect', fixture.url, '--format', 'md', '--output', outputDir);

    expectOk(result);
    expect(result.stdout).toContain('Inspection');
    expect(result.stdout).toContain(fixture.url);
    expect(result.stdout).toContain('Score global');
    expect(result.stdout).toContain('Audit #');
    expect(result.stdout).toContain('MARKDOWN');
  }, 120_000);

  it('liste les audits et expose le JSON standardisé', () => {
    const human = cli(dataDir, 'audit', 'list');
    expectOk(human);
    expect(human.stdout).toContain(fixture.url);
    expect(human.stdout).toContain('Score');

    const jsonRun = cli(dataDir, '--json', 'audit', 'list', '--limit', '1');
    expect(jsonRun.status).toBe(0);
    const payload = JSON.parse(jsonRun.stdout) as { count: number; audits: { id: number }[] };
    expect(payload.count).toBe(1);
    expect(payload.audits[0]?.id).toBeGreaterThan(0);
  });

  it("affiche le détail d'un audit existant", () => {
    const jsonRun = cli(dataDir, '--json', 'audit', 'list', '--limit', '1');
    const id = (JSON.parse(jsonRun.stdout) as { audits: { id: number }[] }).audits[0]?.id;
    expect(id).toBeGreaterThan(0);

    const result = cli(dataDir, 'audit', 'show', String(id));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Audit #${String(id)}`);
    expect(result.stdout).toContain(fixture.url);
    expect(result.stdout).toContain('Scores par dimension');
    expect(result.stdout).toContain('Top 5 des constats');
  });

  it('génère le rapport Markdown de l’audit', () => {
    const jsonRun = cli(dataDir, '--json', 'audit', 'list', '--limit', '1');
    const id = (JSON.parse(jsonRun.stdout) as { audits: { id: number }[] }).audits[0]?.id;
    expect(id).toBeGreaterThan(0);

    const result = cli(
      dataDir,
      'audit',
      'report',
      String(id),
      '--format',
      'md',
      '--output',
      outputDir,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Rapports pour l'audit #${String(id)}`);
    expect(result.stdout).toContain('MARKDOWN');
  });

  it('compare deux audits inspectés', () => {
    const first = JSON.parse(cli(dataDir, '--json', 'audit', 'list', '--limit', '1').stdout) as {
      audits: { id: number }[];
    };
    const idA = first.audits[0]?.id;
    expect(idA).toBeGreaterThan(0);

    // Seconde inspection (la comparaison exige deux audits distincts).
    const secondInspect = cli(
      dataDir,
      'inspect',
      fixture.url,
      '--format',
      'md',
      '--output',
      outputDir,
    );
    expect(secondInspect.status).toBe(0);

    const after = JSON.parse(cli(dataDir, '--json', 'audit', 'list').stdout) as {
      audits: { id: number }[];
    };
    expect(after.audits.length).toBeGreaterThanOrEqual(2);
    const idB = after.audits.find((audit) => audit.id !== idA)?.id;
    expect(idB).toBeGreaterThan(0);

    const result = cli(
      dataDir,
      'audit',
      'compare',
      String(idA),
      String(idB),
      '--format',
      'md',
      '--output',
      outputDir,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Comparaison #${String(idA)} → #${String(idB)}`);
    expect(result.stdout).toContain('Tendance');
  }, 90_000);
});
