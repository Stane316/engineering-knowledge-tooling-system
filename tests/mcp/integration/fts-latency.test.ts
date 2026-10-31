/**
 * Latence FTS exploratoire de bout en bout (Sprint 22-03, C-O07).
 *
 * Protocole du critère : base locale R01–R06, **un client MCP stdio** et une
 * connexion, **20 appels d'échauffement**, puis **100 appels** répartis sur
 * Q01–Q08. Mesure **monotone** de l'envoi de `tools/call` à la réception
 * complète de la réponse, sans temps de modèle.
 *
 * Seuil : p95 ≤ 500 ms, où p95 est la **95e valeur des 100 durées triées**.
 *
 * Limite assumée : la « configuration de validation » n'a pas encore été
 * choisie par le propriétaire. La mesure ci-dessous est donc **exploratoire** :
 * elle prouve le comportement sur la machine où elle tourne et consigne cette
 * machine ; elle ne remplace pas la mesure sur l'hôte retenu.
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { cpus, loadavg, platform, release, arch, totalmem } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openCliServices } from '../../../src/cli/services.js';
import type { Provenance } from '../../../src/shared/provenance.js';
import { createDataDir, removeDataDir } from '../../cli/helpers.js';

const ROOT = process.cwd();
const SERVER = join(ROOT, 'dist', 'mcp', 'server.js');
const CORPUS_DIR = join(ROOT, 'docs', 'audit', 'produit', 'scenario-comparatif');
const MANIFEST = join(CORPUS_DIR, 'manifeste-corpus.json');

const WARMUP = 20;
const CALLS = 100;
const P95_LIMIT_MS = 500;
const RESPONSE_TIMEOUT_MS = 20_000;

interface ManifestEntry {
  readonly id: string;
  readonly path: string;
  readonly sha256: string;
}

interface Manifest {
  readonly base_ids: readonly string[];
  readonly resources: readonly ManifestEntry[];
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;
const BASE = manifest.resources.filter((entry) => manifest.base_ids.includes(entry.id));

/** Les huit requêtes figées du document 22 §3.1, dans l'ordre. */
const QUERIES = [
  'blog',
  '520',
  'modification interface',
  'exceptions',
  'affectés',
  'nom accessible',
  'INP',
  'licornequartz',
] as const;

function provenanceFor(entry: ManifestEntry): Provenance {
  return {
    source: `depot://corpus-synthetique/${entry.path}`,
    sourceVersion: 'manifeste-1.0',
    rights: { read: 'granted', redistribute: 'refused', execute: 'unknown' },
    sensitivity: 'synthetic',
    fingerprint: { sha256: entry.sha256 },
    review: {
      status: 'authorized',
      decidedAt: '2026-10-29T10:00:00.000Z',
      decidedBy: 'operateur-test',
    },
  };
}

interface JsonRpcResponse {
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

/** Client JSON-RPC minimal sur stdio. */
class StdioClient {
  private readonly child: ChildProcessWithoutNullStreams;
  private buffer = '';
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
    });

    // Les logs sont sur stderr : les consommer évite de bloquer le processus.
    this.child.stderr.resume();
  }

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

  async initialize(): Promise<void> {
    await this.request('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'ekts-latency', version: '1.0.0' },
    });
    this.child.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
    );
  }

  async search(query: string): Promise<Record<string, unknown>> {
    const response = await this.request('tools/call', {
      name: 'search_knowledge',
      arguments: { query, mode: 'fts', limit: 5 },
    });
    const result = response.result as {
      content: { type: string; text: string }[];
      isError?: boolean;
    };

    expect(result.isError ?? false, `appel en erreur pour « ${query} »`).toBe(false);

    return JSON.parse(result.content[0]?.text ?? '{}') as Record<string, unknown>;
  }

  async close(): Promise<void> {
    this.child.stdin.end();
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.child.kill('SIGKILL');
        resolve();
      }, 10_000);
      timer.unref();
      this.child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

/** 95e valeur des durées triées (index 94 sur 100). */
function p95(durations: readonly number[]): number {
  const sorted = [...durations].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(0.95 * sorted.length) - 1)] ?? 0;
}

describe('C-O07 — latence FTS de bout en bout (exploratoire)', () => {
  let dataDir: string;
  let client: StdioClient;

  beforeAll(async () => {
    dataDir = createDataDir();
    const services = openCliServices({ dataDir, env: {}, embeddingsMode: 'disabled' });

    try {
      for (const entry of BASE) {
        await services.manager.addResource({
          type: 'other',
          title: `Corpus ${entry.id}`,
          content: readFileSync(join(CORPUS_DIR, entry.path), 'utf8'),
          tags: ['corpus', entry.id.toLowerCase()],
          metadata: { provenance: provenanceFor(entry) },
        });
      }
    } finally {
      services.close();
    }

    client = new StdioClient({ EKTS_DATA_DIR: dataDir, EKTS_OFFLINE: '1' });
    await client.initialize();
  });

  afterAll(async () => {
    await client?.close();
    removeDataDir(dataDir);
  });

  it(`p95 ≤ ${String(P95_LIMIT_MS)} ms sur ${String(CALLS)} appels`, async () => {
    // 20 échauffements : le premier appel paie la préparation du processus et
    // de SQLite, il ne doit pas être compté dans la mesure.
    for (let index = 0; index < WARMUP; index += 1) {
      await client.search(QUERIES[index % QUERIES.length] as string);
    }

    const durations: number[] = [];
    const errors: string[] = [];

    for (let index = 0; index < CALLS; index += 1) {
      const query = QUERIES[index % QUERIES.length] as string;
      const started = performance.now();

      try {
        await client.search(query);
      } catch (error) {
        errors.push(`${query} : ${(error as Error).message}`);
      }

      // Mesure jusqu'à la réponse entièrement reçue et analysée.
      durations.push(performance.now() - started);
    }

    const sorted = [...durations].sort((left, right) => left - right);
    const measured = p95(durations);

    // Consignation exigée par le critère : machine, OS, charge, runtime, version.
    // eslint-disable-next-line no-console -- consignation de mesure, pas de débogage
    console.log(
      JSON.stringify({
        critere: 'C-O07',
        statut: 'exploratoire',
        machine: platform(),
        os: `${platform()} ${release()} ${arch()}`,
        cpu: `${cpus()[0]?.model ?? 'inconnu'} × ${String(cpus().length)}`,
        memoireGo: Math.round(totalmem() / 1024 ** 3),
        charge1min: Number(loadavg()[0]?.toFixed(2) ?? 0),
        node: process.version,
        appels: durations.length,
        echecs: errors.length,
        p50: Number((sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(2)),
        p95: Number(measured.toFixed(2)),
        max: Number((sorted.at(-1) ?? 0).toFixed(2)),
      }),
    );

    expect(errors, 'aucune erreur technique attendue').toEqual([]);
    expect(durations).toHaveLength(CALLS);
    expect(measured).toBeLessThanOrEqual(P95_LIMIT_MS);
  });
});
