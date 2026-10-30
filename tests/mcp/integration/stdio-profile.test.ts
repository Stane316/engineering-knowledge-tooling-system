/**
 * Profil de lecture sur le **binaire** MCP (Sprint 21-01, C-P01 / C-P04).
 *
 * Les tests mémoire prouvent la politique ; celui-ci prouve ce que seul un
 * processus réel révèle : qu'un lancement avec `EKTS_MCP_PROFILE=read` expose
 * trois outils sur `stdout`, et qu'un profil invalide empêche le démarrage
 * avec un code de sortie non nul et une trace JSON sur `stderr`.
 */

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDataDir, removeDataDir } from '../../cli/helpers.js';

const ROOT = process.cwd();
const SERVER = join(ROOT, 'dist', 'mcp', 'server.js');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/** Délai accordé au binaire (même convention que `stdio.test.ts`). */
function readTimeout(): number {
  const parsed = Number(process.env['EKTS_MCP_TIMEOUT_MS']);

  return Number.isFinite(parsed) && parsed >= 1_000 ? parsed : 20_000;
}

const RESPONSE_TIMEOUT_MS = readTimeout();
const CLOSE_TIMEOUT_MS = 10_000;

interface JsonRpcResponse {
  jsonrpc: string;
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

/** Client JSON-RPC minimal, réduit à ce que ces cas mesurent. */
class StdioProbe {
  readonly stderrLines: string[] = [];
  private readonly child: ChildProcessWithoutNullStreams;
  private buffer = '';
  private errors = '';
  private nextId = 1;
  private readonly pending = new Map<number, (message: JsonRpcResponse) => void>();

  constructor(env: NodeJS.ProcessEnv) {
    this.child = spawn(process.execPath, [SERVER], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk: string) => {
      this.buffer += chunk;
      this.drain();
    });

    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk: string) => {
      this.errors += chunk;
      const lines = this.errors.split('\n');
      this.errors = lines.pop() ?? '';
      this.stderrLines.push(...lines.filter((line) => line.length > 0));
    });
  }

  private drain(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.trim().length === 0) {
        continue;
      }

      const message = JSON.parse(line) as JsonRpcResponse;

      if (message.id !== undefined) {
        this.pending.get(message.id)?.(message);
        this.pending.delete(message.id);
      }
    }
  }

  /** Envoie une requête et attend sa réponse. */
  async request(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse> {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Pas de réponse à ${method} après ${String(RESPONSE_TIMEOUT_MS)} ms`));
      }, RESPONSE_TIMEOUT_MS);
      timer.unref();

      this.pending.set(id, (message) => {
        clearTimeout(timer);
        resolve(message);
      });

      this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }

  /** Handshake complet. */
  async initialize(): Promise<JsonRpcResponse> {
    const response = await this.request('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'ekts-profile-e2e', version: '1.0.0' },
    });

    this.child.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
    );

    return response;
  }

  /** Ferme `stdin` et rend le code de sortie (borné). */
  async close(): Promise<number | null> {
    if (this.child.exitCode !== null) {
      return this.child.exitCode;
    }

    this.child.stdin.end();

    return new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        this.child.kill('SIGKILL');
        resolve(null);
      }, CLOSE_TIMEOUT_MS);
      timer.unref();

      this.child.once('exit', (code) => {
        clearTimeout(timer);
        resolve(code);
      });
    });
  }
}

/** Attend la fin du processus (démarrage refusé). */
function waitForExit(probe: StdioProbe): Promise<number | null> {
  return probe.close();
}

describe('binaire MCP — profil de lecture (C-P01, C-P04)', () => {
  let dataDir: string;

  beforeAll(() => {
    // Même règle que `stdio.test.ts` : sans binaire, un échec explicite vaut
    // mieux qu'un saut silencieux.
    if (!existsSync(SERVER)) {
      spawnSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(SERVER)).toBe(true);
    dataDir = createDataDir();
  });

  afterAll(() => {
    removeDataDir(dataDir);
  });

  it('expose trois outils quand le profil de lecture est demandé', async () => {
    const probe = new StdioProbe({
      EKTS_DATA_DIR: dataDir,
      EKTS_MCP_PROFILE: 'read',
      EKTS_OFFLINE: '1',
      MCP_LOG_LEVEL: 'debug',
    });

    try {
      await probe.initialize();
      const response = await probe.request('tools/list', {});
      const tools = response.result?.['tools'] as { name: string }[] | undefined;

      expect(tools?.map((tool) => tool.name)).toEqual([
        'search_knowledge',
        'get_resource',
        'list_resources',
      ]);
    } finally {
      await probe.close();
    }
  });

  it('refuse de démarrer sur un profil inconnu', async () => {
    const probe = new StdioProbe({
      EKTS_DATA_DIR: dataDir,
      EKTS_MCP_PROFILE: 'administrateur',
      EKTS_OFFLINE: '1',
    });

    const code = await waitForExit(probe);

    expect(code).not.toBe(0);
    expect(probe.stderrLines.join('\n')).toMatch(/profil/i);
  });

  it('conserve les dix-sept outils sans profil déclaré', async () => {
    const probe = new StdioProbe({
      EKTS_DATA_DIR: dataDir,
      EKTS_OFFLINE: '1',
      MCP_LOG_LEVEL: 'debug',
    });

    try {
      await probe.initialize();
      const response = await probe.request('tools/list', {});
      const tools = response.result?.['tools'] as { name: string }[] | undefined;

      expect(tools).toHaveLength(17);
    } finally {
      await probe.close();
    }
  });
});
