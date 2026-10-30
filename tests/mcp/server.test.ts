import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEktsServer,
  installSignalHandlers,
  isEntryPoint,
  processSignalHooks,
  reportFatal,
  startStdioServer,
} from '../../src/mcp/server.js';
import { SERVER_NAME, SERVER_VERSION } from '../../src/mcp/handlers/initialize.js';
import { TOOL_NAMES } from '../../src/mcp/schemas/tool-schemas.js';
import { SILENT_LOGGER, type McpLogger } from '../../src/mcp/utils/logger.js';
import { VERSION } from '../../src/shared/version.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';
import { openTestServices, seedResources, type TestServices } from './helpers.js';

interface Harness {
  readonly client: Client;
  readonly server: McpServer;
  close(): Promise<void>;
}

/** Branche un client MCP sur le serveur via un transport mémoire. */
async function connect(fixture: TestServices): Promise<Harness> {
  const server = createEktsServer({ context: fixture.services, logger: SILENT_LOGGER });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'ekts-tests', version: '1.0.0' });

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    server,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

/** Texte du premier bloc d'un résultat d'outil. */
function firstText(result: CallToolResult): string {
  const block = result.content[0];

  return block?.type === 'text' ? block.text : '';
}

describe('serveur MCP — handshake et catalogue', () => {
  let fixture: TestServices;
  let harness: Harness;

  beforeEach(async () => {
    fixture = openTestServices();
    harness = await connect(fixture);
  });

  afterEach(async () => {
    await harness.close();
    fixture.cleanup();
  });

  it('déclare son identité et ses instructions au handshake', () => {
    expect(harness.client.getServerVersion()).toMatchObject({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });
    expect(harness.client.getServerVersion()?.version).toBe(VERSION);
    expect(harness.client.getServerCapabilities()?.tools).toBeDefined();
    expect(harness.client.getInstructions()).toContain('search_knowledge');
  });

  it('négocie une version de protocole antérieure sans erreur', async () => {
    const older = openTestServices();
    const server = createEktsServer({ context: older.services, logger: SILENT_LOGGER });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const messages: { result?: { protocolVersion?: string } }[] = [];

    clientTransport.onmessage = (message) => {
      messages.push(message as { result?: { protocolVersion?: string } });
    };

    try {
      await server.connect(serverTransport);
      await clientTransport.send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'ancien-client', version: '1.0.0' },
        },
      });

      await vi.waitFor(() => {
        expect(messages.length).toBeGreaterThan(0);
      });
      expect(messages[0]?.result?.protocolVersion).toBe('2025-06-18');
    } finally {
      clientTransport.onmessage = undefined;
      await server.close();
      older.cleanup();
    }
  });

  it('liste les dix-sept outils avec leur schéma JSON', async () => {
    const { tools } = await harness.client.listTools();

    expect(tools.map((tool) => tool.name)).toEqual([...TOOL_NAMES]);

    const search = tools[0];
    expect(search?.description).toContain('Recherche');
    expect(search?.inputSchema).toMatchObject({ type: 'object' });
    expect(search?.inputSchema.required).toContain('query');

    const WRITING_TOOLS = new Set([
      'inspect_site',
      'create_project',
      'delete_project',
      'add_best_practice',
      'apply_template',
    ]);
    for (const tool of tools) {
      // Cinq outils écrivent (inspection réseau, création/suppression de
      // projet, ajout de bonne pratique, application de template) ; les
      // douze autres sont en lecture.
      expect(tool.annotations?.readOnlyHint).toBe(!WRITING_TOOLS.has(tool.name));
    }
  });
});

describe('serveur MCP — appels d’outils', () => {
  let fixture: TestServices;
  let harness: Harness;

  beforeEach(async () => {
    fixture = openTestServices();
    await seedResources(fixture.services);
    harness = await connect(fixture);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await harness.close();
    fixture.cleanup();
  });

  it('exécute search_knowledge en mode fts', async () => {
    const result = await harness.client.callTool({
      name: 'search_knowledge',
      arguments: { query: 'SQLite', mode: 'fts' },
    });
    const payload = JSON.parse(firstText(result as CallToolResult));

    expect(result.isError).toBeFalsy();
    expect(payload).toMatchObject({ mode: 'fts' });
    expect(payload.count).toBeGreaterThanOrEqual(1);
  });

  it('exécute list_resources avec un filtre', async () => {
    const result = await harness.client.callTool({
      name: 'list_resources',
      arguments: { type: 'video' },
    });
    const payload = JSON.parse(firstText(result as CallToolResult));

    expect(payload.count).toBe(1);
    expect(payload.resources[0]).toMatchObject({
      type: 'video',
      title: 'Recherche hybride expliquée',
    });
  });

  it('exécute validate_resource sur une donnée invalide', async () => {
    const result = await harness.client.callTool({
      name: 'validate_resource',
      arguments: { data: { type: 'article' } },
    });
    const payload = JSON.parse(firstText(result as CallToolResult));

    expect(result.isError).toBeFalsy();
    expect(payload.valid).toBe(false);
    expect(payload.errors.join(' ')).toContain('title');
  });

  it('renvoie -32000 pour une ressource absente', async () => {
    const result = (await harness.client.callTool({
      name: 'get_resource',
      arguments: { id: '00000000-0000-4000-8000-000000000000' },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result));

    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe(-32000);
    expect(payload.error.data.resourceId).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('signale un outil inconnu avec -32602', async () => {
    const result = (await harness.client.callTool({
      name: 'outil_inconnu',
      arguments: {},
    })) as CallToolResult;

    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain('-32602');
  });

  it('signale des paramètres invalides avec -32602', async () => {
    const result = (await harness.client.callTool({
      name: 'search_knowledge',
      arguments: {},
    })) as CallToolResult;

    expect(result.isError).toBe(true);
    expect(firstText(result)).toContain('-32602');
  });

  it('exécute audit_history sur une base vide', async () => {
    const result = (await harness.client.callTool({
      name: 'audit_history',
      arguments: { limit: 5 },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result)) as { audits: unknown[] };

    expect(result.isError).toBeFalsy();
    expect(payload.audits).toEqual([]);
  });

  it('exécute audit_report qui renvoie une erreur de ressource absente', async () => {
    const result = (await harness.client.callTool({
      name: 'audit_report',
      arguments: { audit_id: 999 },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result)) as {
      error: { code: number; data?: { resource?: string } };
    };

    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe(-32000);
    expect(firstText(result)).toContain('audit #999');
  });

  it('exécute inspect_site sans navigation en déléguant au service d’inspection', async () => {
    vi.spyOn(fixture.services.audits, 'inspectAndAudit').mockResolvedValue({
      audit: {
        metadata: {
          id: 7,
          url: 'https://example.com',
          timestamp: '2026-10-25T00:00:00.000Z',
          overallScore: 78,
          totalFindings: 0,
          criticalFindings: 0,
          highFindings: 0,
          mediumFindings: 0,
          lowFindings: 0,
          infoFindings: 0,
        },
        dimensions: [],
        findings: [],
      },
      report: {
        url: 'https://example.com',
        timestamp: '2026-10-25T00:00:00.000Z',
        dimensions: {
          performance: {
            dimension: 'performance',
            score: 78,
            status: 'measured',
            findings: [],
            summary: 'Score performance : 78/100.',
          },
          accessibility: {
            dimension: 'accessibility',
            score: 78,
            status: 'measured',
            findings: [],
            summary: 'Score accessibility : 78/100.',
          },
          seo: {
            dimension: 'seo',
            score: 78,
            status: 'measured',
            findings: [],
            summary: 'Score seo : 78/100.',
          },
          ux: {
            dimension: 'ux',
            score: 78,
            status: 'measured',
            findings: [],
            summary: 'Score ux : 78/100.',
          },
          content: {
            dimension: 'content',
            score: 78,
            status: 'measured',
            findings: [],
            summary: 'Score content : 78/100.',
          },
        },
        findings: [],
        priorityFindings: [],
        summary: {
          totalFindings: 0,
          criticalFindings: 0,
          highFindings: 0,
          mediumFindings: 0,
          lowFindings: 0,
          infoFindings: 0,
          overallScore: { status: 'measured', value: 78 },
        },
      },
    });

    const result = (await harness.client.callTool({
      name: 'inspect_site',
      arguments: { url: 'https://example.com' },
    })) as CallToolResult;
    const payload = JSON.parse(firstText(result)) as {
      inspection_url: string;
      audit_id: number;
      score: number;
      dimensions: { performance: number };
    };

    expect(result.isError).toBeFalsy();
    expect(payload.inspection_url).toBe('https://example.com');
    expect(payload.audit_id).toBe(7);
    expect(payload.score).toBe(78);
    expect(payload.dimensions.performance).toBe(78);
  });
});

describe('startStdioServer', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = createDataDir();
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  it('démarre, journalise et se ferme deux fois sans erreur', async () => {
    const lines: string[] = [];
    const logger = captureLogger(lines);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const handle = await startStdioServer({
      dataDir,
      env: {},
      logger,
      transport: serverTransport,
      handleSignals: false,
    });
    const client = new Client({ name: 'ekts-tests', version: '1.0.0' });

    try {
      await client.connect(clientTransport);
      expect(Object.keys((await client.listTools()).tools)).toHaveLength(17);
      expect(lines.join('')).toContain('Serveur MCP EKTS démarré');
      expect(lines.join('')).toContain('"tools":17');
    } finally {
      await client.close();
      await handle.close();
      await handle.close();
    }
  });

  it('borne la fermeture quand le transport ne répond pas', async () => {
    const lines: string[] = [];
    const handle = await startStdioServer({
      dataDir,
      env: {},
      logger: captureLogger(lines),
      transport: stubTransport(() => new Promise<void>(() => undefined)),
      handleSignals: false,
      closeTimeoutMs: 10,
    });

    await handle.close();

    expect(lines.join('')).toContain('Fermeture du serveur MCP expirée');
  });

  it('journalise un échec de fermeture sans lever', async () => {
    const lines: string[] = [];
    const handle = await startStdioServer({
      dataDir,
      env: {},
      logger: captureLogger(lines),
      transport: stubTransport(() => Promise.reject(new Error('transport cassé'))),
      handleSignals: false,
    });

    await expect(handle.close()).resolves.toBeUndefined();
    expect(lines.join('')).toContain('Échec de la fermeture du serveur MCP');
  });
});

describe('valeurs par défaut du serveur', () => {
  it('démarre avec le transport stdio et la journalisation par défaut', async () => {
    const directory = createDataDir();
    vi.stubEnv('EKTS_DATA_DIR', directory);
    vi.stubEnv('EKTS_OFFLINE', '1');
    vi.stubEnv('MCP_LOG_LEVEL', 'silent');

    try {
      const handle = await startStdioServer({ handleSignals: false });

      expect(handle.context.dataDir).toBe(directory);
      await handle.close();
    } finally {
      vi.unstubAllEnvs();
      removeDataDir(directory);
    }
  });

  it('se construit sans journal injecté', async () => {
    const fixture = openTestServices();

    try {
      const server = createEktsServer({ context: fixture.services });

      await server.close();
    } finally {
      fixture.cleanup();
    }
  });
});

describe('erreurs de protocole et arrêt', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = createDataDir();
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  it('journalise une erreur de transport remontée par le SDK', async () => {
    const lines: string[] = [];
    const transport: Transport = {
      start: () => {
        setTimeout(() => {
          transport.onerror?.(new Error('transport cassé'));
        }, 0);

        return Promise.resolve();
      },
      send: () => Promise.resolve(),
      close: () => Promise.resolve(),
    };
    const handle = await startStdioServer({
      dataDir,
      env: {},
      logger: captureLogger(lines),
      transport,
      handleSignals: false,
    });

    try {
      await vi.waitFor(() => {
        expect(lines.join('')).toContain('Erreur de protocole MCP');
      });
    } finally {
      await handle.close();
    }
  });

  it('installe SIGINT et SIGTERM, puis ferme avant de quitter', async () => {
    const lines: string[] = [];
    const handlers = new Map<string, (signal: NodeJS.Signals) => void>();
    const removed: string[] = [];
    const exit = vi.fn();
    const close = vi.fn(() => Promise.resolve());

    const remove = installSignalHandlers(close, captureLogger(lines), {
      once: (signal, handler) => {
        handlers.set(signal, handler);
      },
      remove: (signal) => {
        removed.push(signal);
      },
      exit,
    });

    expect([...handlers.keys()]).toEqual(['SIGINT', 'SIGTERM']);

    handlers.get('SIGINT')?.('SIGINT');

    await vi.waitFor(() => {
      expect(close).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenCalledWith(0);
    });
    expect(lines.join('')).toContain('Arrêt demandé');

    remove();
    expect(removed).toEqual(['SIGINT', 'SIGTERM']);
  });

  it('branche des gestionnaires de signaux sur le processus réel, puis les retire', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const handle = await startStdioServer({
      dataDir,
      env: {},
      logger: captureLogger([]),
      transport: serverTransport,
      closeTimeoutMs: 100,
    });

    try {
      expect(process.listenerCount('SIGINT')).toBeGreaterThanOrEqual(1);
    } finally {
      await clientTransport.close();
      await handle.close();
    }
  });

  it('utilise des gestionnaires de signaux injectés au démarrage', async () => {
    const handlers = new Map<string, (signal: NodeJS.Signals) => void>();
    const removed: string[] = [];
    const exit = vi.fn();
    const transport = stubTransport(() => Promise.resolve());
    const handle = await startStdioServer({
      dataDir,
      env: {},
      logger: captureLogger([]),
      transport,
      signalHooks: {
        once: (signal, handler) => {
          handlers.set(signal, handler);
        },
        remove: (signal) => {
          removed.push(signal);
        },
        exit,
      },
    });

    expect([...handlers.keys()]).toEqual(['SIGINT', 'SIGTERM']);

    await handle.close();

    expect(removed).toEqual(['SIGINT', 'SIGTERM']);
  });

  it('expose l’ancrage réel sur le processus', () => {
    const hooks = processSignalHooks();
    const handler = (): void => undefined;
    const before = process.listenerCount('SIGTERM');

    hooks.once('SIGTERM', handler);
    expect(process.listenerCount('SIGTERM')).toBe(before + 1);

    hooks.remove('SIGTERM', handler);
    expect(process.listenerCount('SIGTERM')).toBe(before);

    const previous = process.exitCode;
    hooks.exit(0);
    expect(process.exitCode).toBe(0);
    process.exitCode = previous;
  });

  it('écrit un diagnostic JSON pour une erreur fatale', () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    try {
      reportFatal(new Error('base inaccessible'));
      reportFatal('panne brute');

      const first = JSON.parse(String(stderr.mock.calls[0]?.[0] ?? ''));
      const second = JSON.parse(String(stderr.mock.calls[1]?.[0] ?? ''));

      expect(first).toMatchObject({
        level: 'error',
        message: 'Le serveur MCP n’a pas pu démarrer',
        error: { name: 'Error', message: 'base inaccessible' },
      });
      expect(second.error).toBe('panne brute');
      expect(first.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/u);
    } finally {
      stderr.mockRestore();
    }
  });
});

describe('point d’entrée', () => {
  it('ne se déclenche pas quand le module est importé', () => {
    expect(isEntryPoint()).toBe(false);
  });
});

/** Journal qui conserve messages et données pour inspection. */
function captureLogger(lines: string[]): McpLogger {
  const push = (message: string, data?: Record<string, unknown>): void => {
    lines.push(`${message} ${data === undefined ? '' : JSON.stringify(data)}`);
  };

  return {
    level: 'debug',
    debug: push,
    info: push,
    error: (message, error) => push(message, { error: String(error) }),
  };
}

/** Transport minimal dont seule la fermeture est configurable. */
function stubTransport(close: () => Promise<void>): Transport {
  return {
    start: () => Promise.resolve(),
    send: () => Promise.resolve(),
    close,
  };
}
