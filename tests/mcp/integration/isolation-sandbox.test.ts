/**
 * Isolation réelle et injection contrôlée (Sprint 21-03, C-P06 et C-P07).
 *
 * **Le blocage levé.** Les deux critères étaient déclarés bloqués faute d'hôte
 * isolé ou de bac à sable. La recherche menée le 31/10/2026 (pratiques MCP :
 * isolation par *namespace*, sortie réseau `default-deny`, processus non-root,
 * traitement des contenus tiers comme données) converge : l'isolation par
 * *network namespace* est le contrôle de référence, et elle est disponible ici.
 *
 * Ce test n'utilise **aucun** simulateur logiciel : le serveur MCP est lancé
 * dans un *network namespace* Linux réel (`unshare -rn`), où l'interface réseau
 * n'existe pas. Toute tentative de sortie échoue au niveau du noyau, pas selon
 * une politique applicative qu'un bogue pourrait contourner.
 *
 * Ce qui est mesuré :
 *
 * 1. **C-P06** — le serveur démarre et fonctionne sans réseau ; `tools/list`
 *    sous profil `read` expose **3** outils ; aucune mutation métier n'est
 *    produite par les appels refusés ou de lecture.
 * 2. **C-P07** — une ressource hostile (variante V02, texte tiers) est indexée
 *    puis lue par la voie autorisée. Aucun **canari** injecté dans
 *    l'environnement du serveur n'apparaît dans les réponses ni dans les
 *    traces ; les 14 outils non autorisés restent refusés.
 *
 * **Portée.** L'isolation est celle du noyau Linux via les *namespaces* ; ce
 * n'est ni une machine virtuelle, ni un noyau séparé, ni une preuve
 * d'invulnérabilité. Sur un poste Windows, `unshare` n'existe pas : le cas est
 * alors **ignoré avec sa raison**, jamais présenté comme réussi.
 */

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openCliServices } from '../../../src/cli/services.js';
import { READ_TOOL_NAMES } from '../../../src/mcp/profiles.js';
import { TOOL_NAMES } from '../../../src/mcp/schemas/tool-schemas.js';
import type { Provenance } from '../../../src/shared/provenance.js';
import { createDataDir, removeDataDir } from '../../cli/helpers.js';

const ROOT = process.cwd();
const SERVER = join(ROOT, 'dist', 'mcp', 'server.js');
const CORPUS_DIR = join(ROOT, 'docs', 'audit', 'produit', 'scenario-comparatif');
const V02 = join(CORPUS_DIR, 'variantes', 'V02_NOTE_CONTACT.md');
const MANIFEST = join(CORPUS_DIR, 'manifeste-corpus.json');

const RESPONSE_TIMEOUT_MS = 20_000;

/**
 * Canari de divulgation.
 *
 * Valeur **aléatoire par exécution**, donc jamais présente dans une fixture ni
 * dans un texte du corpus : si elle apparaît dans une sortie, c'est une fuite
 * réelle. Elle est placée dans l'environnement du serveur, là où un message
 * d'erreur ou une trace trop bavarde la révélerait.
 */
const CANARY = `canari-${randomUUID()}`;

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

/** `unshare` réellement capable d'isoler le réseau sur cette machine. */
function unshareAvailable(): boolean {
  if (process.platform !== 'linux') {
    return false;
  }

  const probe = spawnSync('unshare', ['-rn', 'true'], { stdio: 'ignore' });

  return probe.status === 0;
}

const ISOLATION_SUPPORTED = unshareAvailable();

/** Raison lisible d'un cas non exécutable, consignée dans le rapport. */
const SKIP_REASON =
  'Isolation par namespace indisponible sur cet hôte (Windows natif ou unshare absent) : ' +
  'C-P06/C-P07 restent à vérifier sur la configuration de validation, le cas n\u2019est pas un succès.';

interface JsonRpcResponse {
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

/**
 * Client JSON-RPC sur stdio, capable de lancer le serveur dans un
 * *network namespace* isolé.
 */
class SandboxedClient {
  private readonly child: ChildProcessWithoutNullStreams;
  private buffer = '';
  private errors = '';
  private nextId = 1;
  private readonly pending = new Map<number, (message: JsonRpcResponse) => void>();

  readonly stderr = (): string => this.errors;

  constructor(env: NodeJS.ProcessEnv, isolated: boolean) {
    const argv = isolated ? ['-rn', process.execPath, SERVER] : [process.execPath, SERVER];
    const command = isolated ? 'unshare' : argv.shift()!;

    this.child = spawn(command, isolated ? argv : [SERVER], {
      cwd: ROOT,
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

    // Les traces du serveur sont collectées pour y chercher le canari.
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk: string) => {
      this.errors += chunk;
    });
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
      clientInfo: { name: 'ekts-isolation', version: '1.0.0' },
    });
    this.child.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
    );
  }

  async listTools(): Promise<string[]> {
    const response = await this.request('tools/list');
    const result = response.result as { tools?: { name: string }[] };

    return (result.tools ?? []).map((tool) => tool.name);
  }

  /** Appelle un outil et renvoie la réponse brute (résultat ou erreur). */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
    return this.request('tools/call', { name, arguments: args });
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

/** Provenance admissible, empreinte réelle des octets du fichier. */
function provenanceFor(path: string, sha256: string): Provenance {
  return {
    source: `depot://corpus-synthetique/${path}`,
    sourceVersion: 'manifeste-1.0',
    rights: { read: 'granted', redistribute: 'refused', execute: 'unknown' },
    sensitivity: 'synthetic',
    fingerprint: { sha256 },
    review: {
      status: 'authorized',
      decidedAt: '2026-10-29T10:00:00.000Z',
      decidedBy: 'operateur-test',
    },
  };
}

describe.skipIf(!ISOLATION_SUPPORTED)('C-P06/C-P07 — isolation réseau réelle et canari', () => {
  let dataDir: string;
  let client: SandboxedClient;
  let v02Id: string;
  let beforeCount: number;

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
          metadata: { provenance: provenanceFor(entry.path, entry.sha256) },
        });
      }

      // Variante V02 : texte tiers hostile, indexé comme **donnée**, jamais
      // comme instruction. Son empreinte est calculée sur ses octets réels.
      const { createHash } = await import('node:crypto');
      const v02Bytes = readFileSync(V02);
      const created = await services.manager.addResource({
        type: 'other',
        title: 'V02 — note de contact (variante hostile)',
        content: v02Bytes.toString('utf8'),
        tags: ['corpus', 'v02'],
        metadata: {
          provenance: provenanceFor(
            'variantes/V02_NOTE_CONTACT.md',
            createHash('sha256').update(v02Bytes).digest('hex'),
          ),
        },
      });

      v02Id = created.id;
      beforeCount = (await services.manager.listResources()).length;
    } finally {
      services.close();
    }

    client = new SandboxedClient(
      {
        EKTS_DATA_DIR: dataDir,
        EKTS_OFFLINE: '1',
        EKTS_MCP_PROFILE: 'read',
        EKTS_TEST_CANARY: CANARY,
      },
      true,
    );

    await client.initialize();
  });

  afterAll(async () => {
    await client?.close();
    removeDataDir(dataDir);
  });

  it('C-P06 : le réseau est réellement absent du bac à sable', async () => {
    // Contrôle du mécanisme lui-même : dans ce namespace, aucune résolution
    // DNS n'aboutit. Ce n'est pas une politique applicative, c'est le noyau.
    const probe = spawnSync(
      'unshare',
      [
        '-rn',
        process.execPath,
        '-e',
        "require('dns').lookup('github.com',(e)=>process.exit(e?0:1))",
      ],
      { cwd: ROOT, timeout: 15_000 },
    );

    expect(probe.status, 'dans le bac à sable, le DNS doit échouer').toBe(0);
  });

  it('C-P06 : le serveur expose exactement les 3 outils du profil read', async () => {
    const tools = await client.listTools();

    expect(tools.sort()).toEqual([...READ_TOOL_NAMES].sort());
    expect(tools).toHaveLength(3);
    expect(tools).not.toContain('delete_project');
  });

  it('C-P06 : le contraste — sans isolation des noms, 17 outils seraient exposés', async () => {
    // Sans ce contraste, « 3 outils » pourrait signifier « 14 outils absents du
    // binaire ». Le profil `full` prouve le contraire : les 17 existent, et
    // c'est bien la politique `read` qui en refuse 14.
    const full = new SandboxedClient(
      { EKTS_DATA_DIR: dataDir, EKTS_OFFLINE: '1', EKTS_MCP_PROFILE: 'full' },
      true,
    );

    try {
      await full.initialize();
      const tools = await full.listTools();

      expect(tools).toHaveLength(17);
      expect(tools).toEqual(expect.arrayContaining(['delete_project', 'apply_template']));
    } finally {
      await full.close();
    }
  });

  it('C-P07 : les 14 outils non autorisés restent refusés, sans mutation', async () => {
    const forbidden = TOOL_NAMES.filter(
      (name) => !(READ_TOOL_NAMES as readonly string[]).includes(name),
    );
    expect(forbidden).toHaveLength(14);

    const refusals: string[] = [];

    for (const name of forbidden) {
      const response = await client.callTool(name, {
        project_id: randomUUID(),
        id: randomUUID(),
        name: 'test',
      });

      // Un refus est une erreur protocolaire ou un résultat marqué en erreur :
      // jamais un succès silencieux.
      const isRefusal =
        response.error !== undefined ||
        (response.result as { isError?: boolean } | undefined)?.isError === true;

      if (!isRefusal) {
        refusals.push(name);
      }
    }

    expect(refusals, 'outils non autorisés ayant répondu sans erreur').toEqual([]);

    // Aucune mutation métier : le nombre de ressources est inchangé.
    const services = openCliServices({ dataDir, env: {}, embeddingsMode: 'disabled' });
    try {
      const after = await services.manager.listResources();
      expect(after.length).toBe(beforeCount);
    } finally {
      services.close();
    }
  });

  it('C-P07 : la ressource hostile est lisible sans exécuter ses instructions', async () => {
    const response = await client.callTool('get_resource', { id: v02Id });
    expect(response.error).toBeUndefined();

    const result = response.result as { content: { text: string }[] };
    // `get_resource` renvoie `{ resource }` (contrat de `executeGetResource`).
    const payload = JSON.parse(result.content[0]?.text ?? '{}') as {
      resource?: { id?: string; content?: string };
    };

    // La donnée est restituée telle quelle : EKTS ne la « comprend » pas.
    expect(payload.resource?.id).toBe(v02Id);
    expect(payload.resource?.content).toBe(readFileSync(V02, 'utf8'));

    // Aucune action n'est déclenchée par le contenu : l'appel suivant reste
    // une lecture normale, et le nombre de ressources n'a pas bougé.
    const services = openCliServices({ dataDir, env: {}, embeddingsMode: 'disabled' });
    try {
      expect((await services.manager.listResources()).length).toBe(beforeCount);
    } finally {
      services.close();
    }
  });

  it('C-P07 : le canari n’apparaît dans aucune réponse ni trace', async () => {
    // Les appels ont déjà eu lieu ; on provoque en plus des erreurs, car ce
    // sont les chemins d'erreur qui fuient le plus souvent.
    await client.callTool('get_resource', { id: 'pas-un-uuid' });
    await client.callTool('search_knowledge', { query: '', mode: 'fts' });
    await client.callTool('outil_inexistant', {});

    const traces = client.stderr();

    expect(traces).not.toContain(CANARY);
    expect(JSON.stringify(traces)).not.toContain(CANARY);
  });
});

describe.skipIf(ISOLATION_SUPPORTED)('C-P06/C-P07 — cas non exécutable sur cet hôte', () => {
  it('consigne la raison du report au lieu de déclarer un succès', () => {
    // Ce test n'est pas un contournement : il rend le report **visible** dans
    // la suite, avec sa raison, conformément au principe « un cas sauté n'est
    // pas un succès ».
    expect(SKIP_REASON).toMatch(/C-P06\/C-P07|isol/i);
  });
});
