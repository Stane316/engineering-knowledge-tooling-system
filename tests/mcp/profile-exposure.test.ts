/**
 * Profil MCP de lecture — exposition et échec fermé (Sprint 21-01).
 *
 * Ces cas sont écrits **avant** le code : ils décrivent le comportement
 * attendu de C-P01 (trois outils exposés, aucun autre) et de C-P04 (les quatre
 * refus d'échec fermé), sans importer le module à créer. Ils passent par les
 * points d'entrée publics existants (`createEktsServer`, `startStdioServer`,
 * `dispatchTool`), ce qui garantit un RED **comportemental** et non une simple
 * erreur d'import.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createEktsServer,
  startStdioServer,
  type CreateEktsServerOptions,
} from '../../src/mcp/server.js';
import { dispatchTool } from '../../src/mcp/handlers/tools.js';
import type { McpProfilePolicy } from '../../src/mcp/profiles.js';
import { createLogger } from '../../src/mcp/utils/logger.js';
import { TOOL_NAMES } from '../../src/mcp/schemas/tool-schemas.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';
import { openTestServices, type TestServices } from './helpers.js';

/** Politique de lecture attendue : trois noms, FTS explicite exigé. */
const READ_POLICY: McpProfilePolicy = {
  name: 'read',
  tools: ['search_knowledge', 'get_resource', 'list_resources'],
  requireExplicitFtsMode: true,
};

const READ_TOOLS = ['search_knowledge', 'get_resource', 'list_resources'];

/** Serveur silencieux : aucun test ne doit écrire sur `stderr`. */
const LOGGER = createLogger({ level: 'silent' });

/** Branche un client MCP sur un serveur en transport mémoire. */
async function connect(
  options: Omit<CreateEktsServerOptions, 'context' | 'logger'> & {
    readonly context: TestServices['services'];
  },
): Promise<{ client: Client; server: McpServer; close: () => Promise<void> }> {
  const server = createEktsServer({ ...options, logger: LOGGER });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'ekts-profile-tests', version: '1.0.0' });

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

/** Noms d'outils réellement exposés par `tools/list`. */
async function exposedTools(client: Client): Promise<string[]> {
  const { tools } = await client.listTools();

  return tools.map((tool) => tool.name);
}

describe('C-P01 — exposition du profil de lecture', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('1/3 — le profil de lecture expose exactement les trois outils autorisés', async () => {
    const { client, close } = await connect({ context: fixture.services, profile: READ_POLICY });

    try {
      expect(await exposedTools(client)).toEqual(READ_TOOLS);
    } finally {
      await close();
    }
  });

  it('2/3 — le profil complet expose les dix-sept outils', async () => {
    const full: McpProfilePolicy = {
      name: 'full',
      tools: [...TOOL_NAMES],
      requireExplicitFtsMode: false,
    };
    const { client, close } = await connect({ context: fixture.services, profile: full });

    try {
      expect(await exposedTools(client)).toHaveLength(17);
    } finally {
      await close();
    }
  });

  it('3/3 — sans profil déclaré, le comportement historique est conservé', async () => {
    const { client, close } = await connect({ context: fixture.services });

    try {
      // Compatibilité O04 : l'absence de profil n'expose ni plus ni moins
      // qu'hier. Ce n'est pas une réussite du profil, c'est un garde.
      expect(await exposedTools(client)).toEqual([...TOOL_NAMES]);
    } finally {
      await close();
    }
  });
});

describe('C-P04 — échec fermé sur la politique', () => {
  let dataDir: string;
  let fixture: TestServices;

  beforeEach(() => {
    dataDir = createDataDir();
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
    removeDataDir(dataDir);
  });

  it('1/4 — un profil inconnu refuse le démarrage du serveur', async () => {
    await expect(
      startStdioServer({
        env: { EKTS_MCP_PROFILE: 'administrateur', EKTS_DATA_DIR: dataDir },
        handleSignals: false,
      }),
    ).rejects.toThrow(/profil/i);
  });

  it('2/4 — une politique vide est refusée plutôt que d’exposer zéro ou tout', () => {
    // « Politique absente si obligatoire » : une politique sans outil ne doit
    // jamais dégénérer en serveur muet ni en serveur complet.
    expect(() =>
      createEktsServer({
        context: fixture.services,
        logger: LOGGER,
        profile: { name: 'read', tools: [], requireExplicitFtsMode: true },
      }),
    ).toThrow(/politique/i);
  });

  it('3/4 — une valeur vide ou malformée n’active pas silencieusement le profil complet', async () => {
    await expect(
      startStdioServer({
        env: { EKTS_MCP_PROFILE: '   ', EKTS_DATA_DIR: dataDir },
        handleSignals: false,
      }),
    ).rejects.toThrow(/profil/i);
  });

  it('4/4 — un appel direct à un outil masqué est refusé par la politique', async () => {
    const refusal = await dispatchTool(fixture.services, 'list_projects', {}, READ_POLICY).catch(
      (error: unknown) => error as { code?: number; message: string },
    );

    expect(refusal).toMatchObject({ code: -32601 });
    expect((refusal as { message: string }).message).toMatch(/profil|autoris/i);
  });
});
