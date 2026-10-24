import {
  spawn,
  spawnSync,
  execFileSync,
  type ChildProcessWithoutNullStreams,
} from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openMcpServices } from '../../../src/mcp/context.js';
import { createDataDir, removeDataDir } from '../../cli/helpers.js';
import { seedResources } from '../helpers.js';

/**
 * Test d'intégration du **binaire** MCP compilé.
 *
 * Les tests unitaires branchent un transport mémoire ; celui-ci vérifie ce que
 * seul un vrai processus peut révéler : que `stdout` ne contient **que** du
 * JSON-RPC, que `stderr` ne contient **que** des logs JSON, et que le serveur
 * se termine proprement quand le client ferme `stdin`.
 */

const ROOT = process.cwd();
const SERVER = join(ROOT, 'dist', 'mcp', 'server.js');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/**
 * Délai accordé au binaire pour répondre.
 *
 * 5 s suffisaient sur Linux, pas sur un poste Windows où l'antivirus analyse
 * chaque démarrage de processus : le binaire restait silencieux plus longtemps
 * que le délai alors qu'il fonctionnait. La valeur est donc large par défaut et
 * réglable par `EKTS_MCP_TIMEOUT_MS` pour les machines très lentes.
 */
const RESPONSE_TIMEOUT_MS = readTimeout();

/** Lit le délai dans l'environnement, avec un plancher d'une seconde. */
function readTimeout(): number {
  const parsed = Number(process.env['EKTS_MCP_TIMEOUT_MS']);

  return Number.isFinite(parsed) && parsed >= 1_000 ? parsed : 20_000;
}

/** Délai de fermeture avant arrêt forcé du processus. */
const CLOSE_TIMEOUT_MS = 10_000;

interface JsonRpcResponse {
  jsonrpc: string;
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

/** Client JSON-RPC minimal piloté par lignes. */
class StdioClient {
  readonly responses: JsonRpcResponse[] = [];
  readonly stdoutLines: string[] = [];
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

      this.stdoutLines.push(line);
      const message = JSON.parse(line) as JsonRpcResponse;

      if (message.id !== undefined) {
        this.responses.push(message);
        this.pending.get(message.id)?.(message);
        this.pending.delete(message.id);
      }
    }
  }

  /** Envoie une requête et attend la réponse de même identifiant. */
  async request(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse> {
    const id = this.nextId;
    this.nextId += 1;

    const response = new Promise<JsonRpcResponse>((resolve, reject) => {
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

    return response;
  }

  /** Envoie une notification (sans identifiant, sans réponse). */
  notify(method: string, params?: Record<string, unknown>): void {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
  }

  /** Effectue le handshake complet. */
  async initialize(): Promise<JsonRpcResponse> {
    const response = await this.request('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'ekts-integration', version: '1.0.0' },
    });

    this.notify('notifications/initialized');

    return response;
  }

  /** Appelle un outil et renvoie la charge utile texte analysée. */
  async callTool(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.request('tools/call', { name, arguments: args });
    const result = response.result as {
      content: { type: string; text: string }[];
      isError?: boolean;
    };

    return JSON.parse(result.content[0]?.text ?? '{}') as Record<string, unknown>;
  }

  /** Ferme stdin et attend la sortie du processus (idempotent, borné). */
  async close(): Promise<number | null> {
    if (this.child.exitCode !== null) {
      return this.child.exitCode;
    }

    this.child.stdin.end();

    return new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        // Un serveur qui ne se termine pas est un défaut, pas une attente
        // légitime : on libère le processus et on laisse le code nul parler.
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

  /** Erreur lisible quand le serveur ne répond pas : sortie, code, journal. */
  diagnostics(): string {
    const stderr = this.stderrLines.slice(-5).join(' | ');

    return [
      `code=${String(this.child.exitCode)}`,
      stderr === '' ? 'stderr vide' : `stderr=${stderr}`,
    ].join(', ');
  }
}

describe('binaire MCP (intégration stdio)', () => {
  let dataDir: string;
  let client: StdioClient;
  let firstResourceId: string;

  beforeAll(async () => {
    // Le binaire est construit ici si besoin : sans lui, rien de ce fichier
    // n'a de sens et un échec explicite vaut mieux qu'un saut silencieux.
    if (!existsSync(SERVER)) {
      execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
    }

    expect(existsSync(SERVER)).toBe(true);

    dataDir = createDataDir();

    // La base doit être celle du processus enfant : on la prépare ici, puis on
    // transmet `EKTS_DATA_DIR` au serveur. `env` vide ⇒ aucune clé réelle, aucun
    // appel réseau.
    const seeding = openMcpServices({ dataDir, env: {} });

    try {
      const seeded = await seedResources(seeding);
      firstResourceId = seeded[0]?.id ?? '';
    } finally {
      seeding.close();
    }

    client = new StdioClient({
      EKTS_DATA_DIR: dataDir,
      EKTS_OFFLINE: '1',
      MCP_LOG_LEVEL: 'debug',
    });

    try {
      await client.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      throw new Error(
        `Le serveur MCP n'a pas répondu (${client.diagnostics()}). ` +
          `Augmentez EKTS_MCP_TIMEOUT_MS si la machine est lente. Cause : ${message}`,
        { cause: error },
      );
    }
  });

  afterAll(async () => {
    await client?.close();
    removeDataDir(dataDir);
  });

  it('répond à initialize avec son identité', () => {
    const init = client.responses[0];

    expect(init?.result?.protocolVersion).toBe('2025-11-25');
    expect(init?.result?.serverInfo).toMatchObject({ name: 'ekts' });
    expect(init?.result?.instructions).toContain('search_knowledge');
  });

  it('liste les sept outils', async () => {
    const response = await client.request('tools/list', {});
    const tools = response.result?.tools as { name: string; inputSchema: unknown }[];

    expect(tools.map((tool) => tool.name)).toEqual([
      'search_knowledge',
      'get_resource',
      'list_resources',
      'validate_resource',
      'inspect_site',
      'audit_history',
      'audit_report',
    ]);
    expect(tools[0]?.inputSchema).toMatchObject({ type: 'object' });
  });

  it('appelle list_resources et search_knowledge', async () => {
    const listed = await client.callTool('list_resources', {});

    expect(listed.count).toBe(3);

    const found = await client.callTool('search_knowledge', { query: 'SQLite', mode: 'fts' });

    expect(found.mode).toBe('fts');
    expect(found.count).toBeGreaterThanOrEqual(1);
  });

  it('appelle get_resource et validate_resource', async () => {
    const resource = await client.callTool('get_resource', { id: firstResourceId });

    expect((resource.resource as { title: string }).title).toBe('SQLite en pratique');

    const valid = await client.callTool('validate_resource', {
      data: { type: 'article', title: 'Nouveau' },
    });
    const invalid = await client.callTool('validate_resource', {
      data: { type: 'article' },
    });

    expect(valid).toEqual({ valid: true });
    expect(invalid.valid).toBe(false);
  });

  it('renvoie une erreur d’outil codée pour une ressource absente', async () => {
    const payload = await client.callTool('get_resource', {
      id: '00000000-0000-4000-8000-000000000000',
    });
    const error = payload.error as { code: number };

    expect(error.code).toBe(-32000);
  });

  it('n’écrit que du JSON-RPC sur stdout et que des logs JSON sur stderr', () => {
    expect(client.stdoutLines.length).toBeGreaterThanOrEqual(6);

    for (const line of client.stdoutLines) {
      expect(() => JSON.parse(line)).not.toThrow();
      expect(JSON.parse(line).jsonrpc).toBe('2.0');
    }

    const logs = client.stderrLines
      .map((line) => line.trim())
      .filter((line) => line.startsWith('{'));

    expect(logs.length).toBeGreaterThanOrEqual(2);

    for (const line of logs) {
      expect(JSON.parse(line)).toMatchObject({
        level: expect.any(String),
        message: expect.any(String),
      });
    }
  });

  it('se termine proprement à la fermeture de stdin', async () => {
    await expect(client.close()).resolves.toBe(0);
  });
});

describe('binaire MCP — démarrage impossible', () => {
  it('sort en erreur avec un diagnostic JSON si le répertoire de données est invalide', () => {
    const directory = createDataDir();
    const file = join(directory, 'pas-un-repertoire');
    execFileSync(process.execPath, [
      '-e',
      `require('node:fs').writeFileSync(${JSON.stringify(file)}, 'x')`,
    ]);

    try {
      const result = spawnSync(process.execPath, [SERVER], {
        env: { ...process.env, EKTS_DATA_DIR: file, MCP_LOG_LEVEL: 'info' },
        input: '',
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Le serveur MCP n’a pas pu démarrer');
      expect(JSON.parse(result.stderr.trim().split('\n').at(-1) ?? '{}')).toMatchObject({
        level: 'error',
      });
    } finally {
      removeDataDir(directory);
    }
  });
});
