/**
 * Événements observables sur le **binaire** MCP (Sprint 23-01, C-T01).
 *
 * Les cas mémoire prouvent que l'événement est produit ; celui-ci prouve ce que
 * seul un processus réel révèle : que les événements sortent bien par `stderr`,
 * en JSON Lines, **sans polluer `stdout`** — le canal JSON-RPC resterait sinon
 * corrompu et le serveur rejeté par l'agent.
 *
 * C'est aussi la preuve de la couche déclarée `server->client` : la trace est
 * lisible par l'exploitant du processus, pas par le modèle.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openMcpServices } from '../../../src/mcp/context.js';
import { createDataDir, removeDataDir } from '../../cli/helpers.js';
import { seedResources } from '../helpers.js';

const ROOT = process.cwd();
const SERVER = join(ROOT, 'dist', 'mcp', 'server.js');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/** Client JSON-RPC minimal : trois messages écrits d'un bloc. */
function session(dataDir: string): { stdout: string; stderr: string; status: number | null } {
  const messages = [
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'ekts-observability-probe', version: '1.0.0' },
      },
    },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'search_knowledge', arguments: { query: 'SQLite', mode: 'fts' } },
    },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_knowledge',
        arguments: { query: 'zzzztermeabscentduCorpus', mode: 'fts' },
      },
    },
  ];

  const result = spawnSync(process.execPath, [SERVER], {
    input: `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`,
    encoding: 'utf8',
    timeout: 30_000,
    env: {
      ...process.env,
      EKTS_DATA_DIR: dataDir,
      EKTS_OFFLINE: '1',
      MCP_LOG_LEVEL: 'info',
    },
  });

  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', status: result.status };
}

describe('C-T01 — les événements sortent par stderr, jamais par stdout', () => {
  let dataDir: string;

  beforeAll(async () => {
    if (!existsSync(SERVER)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(SERVER)).toBe(true);

    dataDir = createDataDir();

    const seeding = openMcpServices({ dataDir, env: {} });

    try {
      await seedResources(seeding);
    } finally {
      seeding.close();
    }
  });

  afterAll(() => {
    removeDataDir(dataDir);
  });

  it('produit fts et zero_result sur stderr et laisse stdout en JSON-RPC pur', () => {
    const { stdout, stderr, status } = session(dataDir);

    expect(status).toBe(0);

    // 1. `stdout` ne porte que des réponses JSON-RPC valides.
    const stdoutLines = stdout.split('\n').filter((line) => line.trim() !== '');

    expect(stdoutLines.length).toBeGreaterThanOrEqual(2);

    for (const line of stdoutLines) {
      const parsed = JSON.parse(line) as Record<string, unknown>;

      expect(parsed['jsonrpc']).toBe('2.0');
      expect(parsed['message']).toBeUndefined();
    }

    // 2. Les événements sont sur `stderr`, identifiables et ordonnés.
    const events = stderr
      .split('\n')
      .filter((line) => line.includes('"message":"mcp.event"'))
      .map(
        (line) =>
          (JSON.parse(line) as { data: { kind: string; status: string; layer: string } }).data,
      );

    expect(events.map((event) => event.kind)).toEqual(['fts', 'zero_result']);
    expect(events.map((event) => event.status)).toEqual(['ok', 'empty']);
    expect(events.every((event) => event.layer === 'server->client')).toBe(true);
  });
});
