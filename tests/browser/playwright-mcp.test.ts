import { join, resolve, sep } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';

import {
  ArtifactError,
  BrowserError,
  BrowserNotStartedError,
  UnsupportedBrowserOperationError,
  UrlNotAllowedError,
} from '../../src/browser/errors.js';
import {
  assertNavigableUrl,
  BROWSER_TOOL_NAMES,
  createBrowserMcpServer,
  isPrivateHost,
  resolveArtifactPath,
  toToolErrorResult,
  type BrowserMcpOptions,
} from '../../src/browser/playwright-mcp.js';
import { SILENT_LOGGER } from '../../src/mcp/utils/logger.js';
import { createFakeSession, tempDir, type FakeSession } from './helpers.js';

interface Harness {
  readonly client: Client;
  readonly server: McpServer;
  readonly session: FakeSession;
  close(): Promise<void>;
}

/** Branche un client MCP sur le serveur navigateur via un transport mémoire. */
async function connect(overrides: Partial<BrowserMcpOptions> = {}): Promise<Harness> {
  const session = overrides.session ?? createFakeSession();
  const server = createBrowserMcpServer({
    session,
    logger: SILENT_LOGGER,
    artifactsDir: tempDir('ekts-browser-mcp-'),
    ...overrides,
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'ekts-browser-tests', version: '1.0.0' });

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    server,
    session: session as FakeSession,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

/**
 * Charge utile JSON d'un résultat d'outil.
 *
 * Le SDK type `callTool` comme une union (`content` ou `toolResult`) : les
 * assistants restent volontairement souples, les assertions portent sur le
 * contenu.
 */
function payload(result: unknown): Record<string, unknown> {
  return JSON.parse(text(result)) as Record<string, unknown>;
}

/** Texte du premier bloc d'un résultat d'outil. */
function text(result: unknown): string {
  const blocks = (result as CallToolResult | undefined)?.content ?? [];
  const block = blocks[0];

  return block?.type === 'text' ? block.text : '{}';
}

describe('serveur MCP navigateur — catalogue', () => {
  it('expose les cinq outils dans l’ordre attendu', async () => {
    const harness = await connect();

    try {
      const tools = await harness.client.listTools();

      expect(tools.tools.map((tool) => tool.name)).toEqual([...BROWSER_TOOL_NAMES]);
    } finally {
      await harness.close();
    }
  });

  it('décrit les paramètres d’URL et de chemin', async () => {
    const harness = await connect();

    try {
      const tools = await harness.client.listTools();
      const navigate = tools.tools.find((tool) => tool.name === 'browser_navigate');
      const screenshot = tools.tools.find((tool) => tool.name === 'browser_screenshot');

      expect(navigate?.inputSchema.properties).toHaveProperty('url');
      expect(screenshot?.inputSchema.properties).toHaveProperty('fullPage');
      expect(navigate?.annotations?.openWorldHint).toBe(true);
    } finally {
      await harness.close();
    }
  });
});

describe('serveur MCP navigateur — outils', () => {
  it('ouvre une page en démarrant le navigateur au besoin', async () => {
    const harness = await connect();

    try {
      const result = await harness.client.callTool({
        name: 'browser_navigate',
        arguments: { url: 'https://example.com' },
      });

      expect(result.isError).toBeFalsy();
      expect(payload(result)).toMatchObject({
        url: 'https://example.com/',
        title: 'Example Domain',
        status: 200,
        kind: 'chromium',
      });
      expect(harness.session.state.started).toBe(true);
      expect(harness.session.state.navigations).toHaveLength(1);
    } finally {
      await harness.close();
    }
  });

  it('conserve une session déjà ouverte', async () => {
    const session = createFakeSession();
    await session.start('firefox');
    const harness = await connect({ session });

    try {
      await harness.client.callTool({
        name: 'browser_navigate',
        arguments: { url: 'https://example.com' },
      });

      expect(harness.session.state.kind).toBe('firefox');
      expect(harness.session.state.navigations).toHaveLength(1);
    } finally {
      await harness.close();
    }
  });

  it('refuse un hôte privé', async () => {
    const harness = await connect();

    try {
      const result = await harness.client.callTool({
        name: 'browser_navigate',
        arguments: { url: 'http://localhost:3000/' },
      });

      expect(result.isError).toBe(true);
      expect(payload(result).error).toMatchObject({ code: -32001 });
      expect(harness.session.state.navigations).toHaveLength(0);
    } finally {
      await harness.close();
    }
  });

  it('autorise un hôte privé quand le serveur le permet', async () => {
    const harness = await connect({ allowPrivateHosts: true });

    try {
      const result = await harness.client.callTool({
        name: 'browser_navigate',
        arguments: { url: 'http://127.0.0.1:4321/' },
      });

      expect(result.isError).toBeFalsy();
    } finally {
      await harness.close();
    }
  });

  it('capture la page dans le dossier d’artefacts', async () => {
    const directory = tempDir('ekts-browser-shot-');
    const harness = await connect({
      artifactsDir: directory,
      now: () => new Date('2026-10-23T12:34:56.789Z'),
    });

    try {
      const result = await harness.client.callTool({ name: 'browser_screenshot', arguments: {} });
      const body = payload(result);

      expect(body).toMatchObject({
        size: 1024,
        relativePath: 'screenshot-2026-10-23T12-34-56-789Z.png',
      });
      expect(harness.session.state.screenshots[0]).toMatchObject({
        path: join(directory, 'screenshot-2026-10-23T12-34-56-789Z.png'),
        fullPage: true,
        type: 'png',
      });

      await harness.client.callTool({
        name: 'browser_screenshot',
        arguments: { path: 'mini.jpg', type: 'jpeg', quality: 70, fullPage: false },
      });

      expect(harness.session.state.screenshots[1]).toMatchObject({
        path: join(directory, 'mini.jpg'),
        quality: 70,
        fullPage: false,
      });
    } finally {
      await harness.close();
    }
  });

  it('refuse un chemin qui sort du dossier d’artefacts', async () => {
    const harness = await connect();

    try {
      const result = await harness.client.callTool({
        name: 'browser_screenshot',
        arguments: { path: `..${sep}..${sep}secret.png` },
      });

      expect(result.isError).toBe(true);
      expect(payload(result).error).toMatchObject({ code: -32001 });
      expect(harness.session.state.screenshots).toHaveLength(0);
    } finally {
      await harness.close();
    }
  });

  it('extrait l’accessibility tree avec filtre et violations', async () => {
    const harness = await connect();

    try {
      const result = await harness.client.callTool({
        name: 'browser_accessibility',
        arguments: { role: 'heading' },
      });
      const body = payload(result);

      expect(body).toMatchObject({ nodeCount: 1, truncated: false });
      expect(body).toHaveProperty('matches');
      expect(body).toHaveProperty('violations');
      expect(body.summary).toEqual({ minor: 0, moderate: 0, serious: 0, critical: 0 });
    } finally {
      await harness.close();
    }
  });

  it('filtre par nom et inclut l’arbre sur demande', async () => {
    const harness = await connect({
      session: createFakeSession({
        snapshot: [
          {
            role: 'WebArea',
            name: 'Example Domain',
            children: [
              { role: 'heading', name: 'Example Domain', level: 1 },
              {
                role: 'link',
                name: 'More information',
                url: 'https://www.iana.org/domains/example',
              },
              { role: 'img' },
            ],
          },
        ],
      }),
    });

    try {
      const result = await harness.client.callTool({
        name: 'browser_accessibility',
        arguments: { name: 'example', includeTree: true, includeViolations: false },
      });
      const body = payload(result);

      expect(body).toHaveProperty('tree');
      expect(body).not.toHaveProperty('violations');
      expect(body.matches).toHaveLength(2);

      const all = await harness.client.callTool({ name: 'browser_accessibility', arguments: {} });
      expect(payload(all)).not.toHaveProperty('matches');
    } finally {
      await harness.close();
    }
  });

  it('imprime la page en PDF', async () => {
    const harness = await connect({ now: () => new Date('2026-10-23T00:00:00.000Z') });

    try {
      const result = await harness.client.callTool({
        name: 'browser_pdf',
        arguments: { format: 'A3', landscape: true },
      });

      expect(payload(result)).toMatchObject({
        pages: 2,
        relativePath: 'page-2026-10-23T00-00-00-000Z.pdf',
      });
      expect(harness.session.state.pdfs[0]).toMatchObject({ format: 'A3', landscape: true });
    } finally {
      await harness.close();
    }
  });

  it('ferme le navigateur', async () => {
    const harness = await connect();

    try {
      const result = await harness.client.callTool({ name: 'browser_close', arguments: {} });

      expect(payload(result)).toEqual({ closed: true });
      expect(harness.session.state.stops).toBe(1);
    } finally {
      await harness.close();
    }
  });

  it('traduit une erreur de navigation en résultat d’erreur', async () => {
    const harness = await connect({
      session: createFakeSession({
        failGoto: new BrowserError('DNS introuvable', 'NAVIGATION_FAILED'),
      }),
    });

    try {
      const result = await harness.client.callTool({
        name: 'browser_navigate',
        arguments: { url: 'https://inconnu.test' },
      });

      expect(result.isError).toBe(true);
      expect(payload(result).error).toMatchObject({ code: -32603, message: 'DNS introuvable' });
    } finally {
      await harness.close();
    }
  });

  it('renvoie le chemin brut hors du dossier d’artefacts', async () => {
    const session = createFakeSession();
    const outside = '/tmp/hors-dossier.png';
    session.screenshot = async (params) => ({
      path: outside,
      size: params.path.length,
      type: 'png' as const,
      dimensions: { width: 1, height: 1 },
      duration: 1,
    });
    const harness = await connect({ session });

    try {
      const result = await harness.client.callTool({ name: 'browser_screenshot', arguments: {} });

      expect(payload(result)).toMatchObject({ path: outside, relativePath: outside });
    } finally {
      await harness.close();
    }
  });

  it('propage une erreur d’artefact', async () => {
    const harness = await connect({
      session: createFakeSession({
        failScreenshot: new ArtifactError('capture.png', 'disque plein'),
      }),
    });

    try {
      const result = await harness.client.callTool({ name: 'browser_screenshot', arguments: {} });

      expect(payload(result).error).toMatchObject({ code: -32001, data: { path: 'capture.png' } });
    } finally {
      await harness.close();
    }
  });
});

describe('politique d’URL', () => {
  it('accepte une URL publique', () => {
    expect(assertNavigableUrl('https://example.com')).toBe('https://example.com/');
  });

  it('refuse un schéma autre que http/https', () => {
    expect(() => assertNavigableUrl('file:///etc/passwd')).toThrow(/schéma/);
    expect(() => assertNavigableUrl('ftp://example.com')).toThrow(/schéma/);
    expect(() => assertNavigableUrl('javascript:alert(1)')).toThrow();
  });

  it('refuse les identifiants embarqués', () => {
    expect(() => assertNavigableUrl('https://user:secret@example.com')).toThrow(/identifiants/);
  });

  it('refuse une URL invalide', () => {
    expect(() => assertNavigableUrl('pas une url')).toThrow(/invalide/);
  });

  it('refuse les hôtes privés par défaut', () => {
    expect(() => assertNavigableUrl('http://192.168.1.10')).toThrow(/hôte privé/);
    expect(() => assertNavigableUrl('http://localhost')).toThrow(/hôte privé/);
  });

  it('accepte les hôtes privés sur autorisation explicite', () => {
    expect(assertNavigableUrl('http://localhost:3000', { allowPrivateHosts: true })).toBe(
      'http://localhost:3000/',
    );
  });

  it.each([
    ['localhost', true],
    ['app.localhost', true],
    ['machine.local', true],
    ['127.0.0.1', true],
    ['10.1.2.3', true],
    ['172.16.0.1', true],
    ['172.31.255.254', true],
    ['192.168.0.1', true],
    ['169.254.1.1', true],
    ['0.0.0.0', true],
    ['::1', true],
    ['::ffff:127.0.0.1', true],
    ['fd00::1', true],
    ['fe80::1', true],
    ['example.com', false],
    ['172.32.0.1', false],
    ['8.8.8.8', false],
    ['2001:4860:4860::8888', false],
    ['1.2.3', false],
  ])('classe %s comme privé : %s', (host, expected) => {
    expect(isPrivateHost(host)).toBe(expected);
  });
});

describe('confinement des artefacts', () => {
  // `resolve` fige aussi la racine de lecteur sous Windows : le chemin rendu
  // par `resolveArtifactPath` est toujours absolu, pas seulement enraciné.
  const directory = resolve('/tmp/artefacts');

  it('nomme le fichier quand aucun chemin n’est fourni', () => {
    expect(resolveArtifactPath(directory, undefined, 'capture.png')).toBe(
      join(directory, 'capture.png'),
    );
  });

  it('accepte un sous-dossier', () => {
    expect(resolveArtifactPath(directory, 'a/b.png', 'x.png')).toBe(join(directory, 'a', 'b.png'));
  });

  it('refuse une sortie par « .. »', () => {
    expect(() => resolveArtifactPath(directory, '../secret.png', 'x.png')).toThrow(ArtifactError);
  });

  it('refuse un chemin absolu hors du dossier', () => {
    expect(() => resolveArtifactPath(directory, '/etc/passwd', 'x.png')).toThrow(/rester dans/);
  });

  it('refuse un caractère nul', () => {
    expect(() => resolveArtifactPath(directory, 'a\0b.png', 'x.png')).toThrow(/nul/);
  });
});

describe('erreurs du module', () => {
  it('sérialise une erreur métier', () => {
    const error = new UrlNotAllowedError('file:///x', 'schéma refusé');

    expect(error.toJSON()).toEqual({
      name: 'UrlNotAllowedError',
      code: 'URL_NOT_ALLOWED',
      message: error.message,
    });
  });

  it('expose un code pour chaque famille', () => {
    expect(new BrowserNotStartedError('goto').code).toBe('BROWSER_NOT_STARTED');
    expect(new ArtifactError('x', 'illisible').code).toBe('ARTIFACT_FAILED');
    expect(new ArtifactError('x', 'illisible', { code: 'ARTIFACT_PATH_ESCAPE' }).code).toBe(
      'ARTIFACT_PATH_ESCAPE',
    );
  });

  it('journalise une erreur de protocole', () => {
    const logger = { debug: vi.fn(), info: vi.fn(), error: vi.fn(), level: 'debug' as const };
    const server = createBrowserMcpServer({
      session: createFakeSession(),
      logger,
      artifactsDir: tempDir(),
    });

    (server.server as unknown as { onerror?: (error: Error) => void }).onerror?.(
      new Error('protocole'),
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Erreur de protocole MCP (navigateur)',
      expect.any(Error),
    );
  });
});

describe('toToolErrorResult', () => {
  it('transmet le code des erreurs métier', () => {
    const result = toToolErrorResult(
      new UnsupportedBrowserOperationError('pdf', 'firefox', ['chromium']),
    );

    expect(result.isError).toBe(true);
    expect(JSON.parse(text(result))).toMatchObject({
      error: { code: -32603, data: { kind: 'UNSUPPORTED_OPERATION' } },
    });
  });

  it('accepte une valeur non-Error', () => {
    const result = toToolErrorResult('panne');

    expect(JSON.parse(text(result))).toMatchObject({ error: { code: -32603, message: 'panne' } });
  });

  it('accepte une Error standard', () => {
    const result = toToolErrorResult(new Error('boum'));

    expect(JSON.parse(text(result))).toMatchObject({ error: { code: -32603, message: 'boum' } });
  });
});

describe('createBrowserMcpServer', () => {
  it('fonctionne sans journal explicite', async () => {
    const server = createBrowserMcpServer({ session: createFakeSession() });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'ekts-browser-nolog', version: '1.0.0' });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      await expect(client.listTools()).resolves.toMatchObject({ tools: expect.any(Array) });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('journalise les appels quand un journal est fourni', async () => {
    const logger = { debug: vi.fn(), info: vi.fn(), error: vi.fn(), level: 'debug' as const };
    const harness = await connect({ logger });

    try {
      await harness.client.callTool({
        name: 'browser_navigate',
        arguments: { url: 'https://example.com' },
      });

      expect(logger.info).toHaveBeenCalledWith('Démarrage du navigateur', { kind: 'chromium' });
      expect(logger.debug).toHaveBeenCalledWith(
        'Outil navigateur exécuté',
        expect.objectContaining({ tool: 'browser_navigate' }),
      );
    } finally {
      await harness.close();
    }
  });
});
