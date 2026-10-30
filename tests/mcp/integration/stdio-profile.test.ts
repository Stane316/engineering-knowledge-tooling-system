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

/**
 * Extrait l'échec d'un `tools/call`.
 *
 * Deux formes coexistent et cette différence est mesurée, pas contournée :
 *
 * - notre `dispatchTool` renvoie une **charge utile JSON** dans le texte
 *   (`{ "error": { "code", "message", "data" } }`) ;
 * - un nom **non enregistré** est refusé par le SDK avant d'atteindre notre
 *   code, sous la forme brute `MCP error -32602: Tool X not found`.
 *
 * Le second cas est l'écart E21-1 : le code du protocole est celui du SDK,
 * alors que le chemin d'exécution direct rend `-32601` (décision du
 * propriétaire). C-P02 accepte un refus « à cause du profil **ou de l'absence
 * de l'outil** » ; les deux formes sont donc conformes, et les distinguer
 * importe plus que de les confondre.
 */
interface ToolFailure {
  readonly code: number | undefined;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

function toolFailure(response: JsonRpcResponse): ToolFailure | undefined {
  const result = response.result as
    { isError?: boolean; content?: { type?: string; text?: string }[] } | undefined;

  if (result?.isError !== true) {
    return undefined;
  }

  const text =
    result.content
      ?.map((part) => part.text ?? '')
      .filter((part) => part.length > 0)
      .join('\n') ?? '';

  try {
    const parsed = JSON.parse(text) as {
      error?: { code?: number; message?: string; data?: Record<string, unknown> };
    };

    if (parsed.error !== undefined) {
      return {
        code: parsed.error.code,
        message: parsed.error.message ?? text,
        ...(parsed.error.data === undefined ? {} : { data: parsed.error.data }),
      };
    }
  } catch {
    // Texte brut du SDK : traité ci-dessous.
  }

  const match = /MCP error (-?\d+): ([\s\S]*)/.exec(text);

  return {
    code: match?.[1] === undefined ? undefined : Number(match[1]),
    message: match?.[2] ?? text,
  };
}

describe('binaire MCP — appels directs sous profil de lecture (C-P02, C-P08)', () => {
  let dataDir: string;

  beforeAll(() => {
    if (!existsSync(SERVER)) {
      spawnSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(SERVER)).toBe(true);
    dataDir = createDataDir();
  });

  afterAll(() => {
    removeDataDir(dataDir);
  });

  /**
   * Ouvre une session `read` et la ferme systématiquement.
   *
   * Les paramètres sont écrits **bruts** : aucun client SDK ne peut réparer un
   * mode omis ni pré-remplir un défaut avant l'envoi.
   */
  async function withReadProfile(body: (probe: StdioProbe) => Promise<void>): Promise<void> {
    const probe = new StdioProbe({
      EKTS_DATA_DIR: dataDir,
      EKTS_MCP_PROFILE: 'read',
      EKTS_OFFLINE: '1',
      MCP_LOG_LEVEL: 'debug',
    });

    try {
      await probe.initialize();
      await body(probe);
    } finally {
      await probe.close();
    }
  }

  it('refuse un outil masqué avec des arguments valides', async () => {
    await withReadProfile(async (probe) => {
      const response = await probe.request('tools/call', {
        name: 'list_projects',
        arguments: { limit: 5 },
      });
      const failure = toolFailure(response);

      expect(failure).toBeDefined();
      // E21-1 : le nom n'est pas enregistré, donc le SDK répond « not found ».
      // C-P02 compte ce refus comme « absence de l'outil ».
      expect(failure?.message).toMatch(/list_projects/);
      expect(failure?.message).toMatch(/not found/i);
    });
  });

  it('refuse « inspect_site » sans tenter le réseau', async () => {
    await withReadProfile(async (probe) => {
      const response = await probe.request('tools/call', {
        name: 'inspect_site',
        arguments: { url: 'https://example.test/', level: 'L3' },
      });
      const failure = toolFailure(response);

      expect(failure).toBeDefined();
      expect(failure?.message).toMatch(/inspect_site/);
      expect(failure?.message).toMatch(/not found/i);
    });
  });

  it('refuse un mode omis avant que le défaut « hybrid » ne s’applique', async () => {
    await withReadProfile(async (probe) => {
      const response = await probe.request('tools/call', {
        name: 'search_knowledge',
        arguments: { query: 'SQLite' },
      });
      const failure = toolFailure(response);

      expect(response.result?.['isError']).toBe(true);
      // Sans fournisseur configuré, un défaut `hybrid` aurait produit -32603
      // (erreur d'embeddings) : -32602 avec `requiredMode` identifie le refus
      // de politique.
      expect(failure?.code).toBe(-32602);
      expect(failure?.data).toMatchObject({ profile: 'read', requiredMode: 'fts' });
      expect(failure?.message).toMatch(/mode/i);
    });
  });

  it('refuse « hybrid » et « vector » explicitement demandés', async () => {
    await withReadProfile(async (probe) => {
      for (const mode of ['hybrid', 'vector']) {
        const response = await probe.request('tools/call', {
          name: 'search_knowledge',
          arguments: { query: 'SQLite', mode },
        });
        const failure = toolFailure(response);

        expect(failure?.code, mode).toBe(-32602);
        expect(failure?.data, mode).toMatchObject({ profile: 'read', requiredMode: 'fts' });
      }
    });
  });

  it('accepte « fts » explicite sur la base vide (0 résultat, pas une erreur)', async () => {
    await withReadProfile(async (probe) => {
      const response = await probe.request('tools/call', {
        name: 'search_knowledge',
        arguments: { query: 'SQLite', mode: 'fts' },
      });

      expect(response.error).toBeUndefined();
      expect(response.result?.['isError']).toBeFalsy();

      const text = (response.result?.['content'] as { text?: string }[] | undefined)?.[0]?.text;
      const payload = JSON.parse(text ?? '{}') as { mode?: string; count?: number };

      expect(payload.mode).toBe('fts');
      expect(payload.count).toBe(0);
    });
  });

  it('un nom qui n’existe dans aucune politique reste refusé (-32602 du SDK)', async () => {
    await withReadProfile(async (probe) => {
      const response = await probe.request('tools/call', {
        name: 'outil_fantome_2027',
        arguments: {},
      });
      const failure = toolFailure(response);

      expect(failure?.message).toMatch(/outil_fantome_2027/);
      expect(failure?.message).toMatch(/not found/i);
    });
  });
});
