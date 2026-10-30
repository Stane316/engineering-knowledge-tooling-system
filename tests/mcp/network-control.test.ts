/**
 * Données et réseau au niveau applicatif (Sprint 21-03, C-O01).
 *
 * Portée : ce fichier prouve ce que l'**application** contrôle — aucune requête
 * sortante pendant les appels permis et refusés, et un contrôle qui sait
 * réellement bloquer une tentative (test positif, avec un vrai fournisseur
 * OpenAI dont le `fetch` est remplacé par un intercepteur).
 *
 * Il ne prouve **pas** l'isolation réseau du système d'exploitation : couper
 * une interface, filtrer par pare-feu ou observer les sockets ouvertes relève
 * de l'hôte, non du processus Node. Cette limite est déclarée au rapport et le
 * critère est compté « partiel », jamais « réussi » sur cette seule base.
 *
 * Un canari synthétique (chaîne non secrète et reconnaissable) sert de marqueur :
 * s'il apparaissait dans une charge utile interceptée, on saurait exactement
 * quelle donnée aurait tenté de sortir.
 */

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createEmbeddingsService } from '../../src/business/embeddings.js';
import { openMcpServices, type McpServices } from '../../src/mcp/context.js';
import { dispatchTool } from '../../src/mcp/handlers/tools.js';
import { MCP_PROFILES } from '../../src/mcp/profiles.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';
import { seedResources } from './helpers.js';

/** Chaîne canari : non secrète, unique, facile à retrouver dans une trace. */
const CANARY = 'canari-ekts-21-03-ne-doit-pas-sortir';

interface Attempt {
  readonly url: string;
  readonly body: string;
}

/** Intercepteur : enregistre la tentative puis refuse de l'émettre. */
function createBlockedFetch(attempts: Attempt[], error: string): typeof globalThis.fetch {
  return (async (input: unknown, init?: { body?: unknown }) => {
    attempts.push({
      url: String(input),
      body: typeof init?.body === 'string' ? init.body : '',
    });

    throw new Error(error);
  }) as unknown as typeof globalThis.fetch;
}

/** Les quatorze noms hors profil, pour vérifier qu'aucun n'émet de requête. */
const REFUSED_TOOLS: readonly string[] = [
  'validate_resource',
  'inspect_site',
  'audit_history',
  'audit_report',
  'create_project',
  'list_projects',
  'get_project',
  'delete_project',
  'get_timeline',
  'search_best_practices',
  'add_best_practice',
  'get_recommendations',
  'list_templates',
  'apply_template',
];

/** Arguments valides, réduits au strict nécessaire pour atteindre le schéma. */
function argsFor(tool: string): Record<string, unknown> {
  switch (tool) {
    case 'validate_resource':
      return { data: { type: 'article', title: 'Canari', content: 'Contenu synthétique.' } };
    case 'inspect_site':
      return { url: 'https://example.test/' };
    case 'audit_report':
      return { audit_id: 1 };
    case 'create_project':
      return { name: 'Canari réseau' };
    case 'get_project':
    case 'delete_project':
    case 'get_timeline':
    case 'get_recommendations':
      return { project_id: '00000000-0000-4000-8000-000000000000' };
    case 'add_best_practice':
      return { title: 'Canari', description: 'Description synthétique.', category: 'general' };
    case 'apply_template':
      return {
        template_id: '00000000-0000-4000-8000-000000000000',
        project_name: 'Canari',
        project_url: 'https://example.test/',
      };
    default:
      return {};
  }
}

describe('C-O01 — aucune requête sortante sous profil de lecture', () => {
  let dataDir: string;
  let services: McpServices;
  let fetchCalls = 0;

  beforeAll(async () => {
    dataDir = createDataDir();
    services = openMcpServices({ dataDir, env: {} });
    await seedResources(services);
  });

  afterAll(() => {
    services.close();
    removeDataDir(dataDir);
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    fetchCalls = 0;
  });

  it('les appels permis et les quinze refus n’émettent aucune requête', async () => {
    vi.stubGlobal('fetch', () => {
      fetchCalls += 1;

      return Promise.reject(new Error('réseau interdit'));
    });

    await dispatchTool(
      services,
      'search_knowledge',
      { query: 'SQLite', mode: 'fts' },
      MCP_PROFILES.read,
    );
    await dispatchTool(services, 'list_resources', {}, MCP_PROFILES.read);

    const [first] = await services.manager.listResources();
    if (first === undefined) {
      throw new Error('fixture vide : C-O01 non mesurable');
    }
    await dispatchTool(services, 'get_resource', { id: first.id }, MCP_PROFILES.read);

    expect(REFUSED_TOOLS).toHaveLength(14);
    for (const tool of REFUSED_TOOLS) {
      await expect(
        dispatchTool(services, tool, argsFor(tool), MCP_PROFILES.read),
        tool,
      ).rejects.toBeDefined();
    }

    await expect(
      dispatchTool(services, 'outil_fantome_2027', {}, MCP_PROFILES.read),
    ).rejects.toBeDefined();

    expect(fetchCalls).toBe(0);
  });
});

describe('C-O01 — le contrôle sait bloquer une tentative réelle (test positif)', () => {
  let dataDir: string;
  let services: McpServices;
  const attempts: Attempt[] = [];

  beforeAll(async () => {
    dataDir = createDataDir();

    // Vrai service d'embeddings (fournisseur OpenAI), sauf que son `fetch` est
    // remplacé : la tentative est réelle côté application, rien ne sort.
    const embeddings = createEmbeddingsService({
      env: { OPENAI_API_KEY: 'canari-test-cle-fictive-non-secrete' },
      fetch: createBlockedFetch(attempts, 'tentative bloquée par le test C-O01'),
    });

    services = openMcpServices({ dataDir, env: {}, embeddings });
    await seedResources(services);
  });

  afterAll(() => {
    services.close();
    removeDataDir(dataDir);
  });

  it('intercepte et bloque la requête d’un mode hybride contenant le canari', async () => {
    await expect(
      dispatchTool(services, 'search_knowledge', { query: CANARY, mode: 'hybrid' }),
    ).rejects.toBeDefined();

    expect(attempts.length).toBeGreaterThanOrEqual(1);

    // La tentative a bien été observée, et elle portait le canari : sans le
    // blocage, cette donnée aurait quitté le processus.
    expect(attempts.some((attempt) => attempt.body.includes(CANARY))).toBe(true);
    expect(attempts.every((attempt) => attempt.url.startsWith('http'))).toBe(true);
  });

  it('le même contenu reste consultable en FTS, sans nouvelle tentative', async () => {
    const before = attempts.length;

    const result = (await dispatchTool(services, 'search_knowledge', {
      query: CANARY,
      mode: 'fts',
    })) as {
      mode: string;
      count: number;
    };

    expect(result.mode).toBe('fts');
    expect(attempts.length).toBe(before);
  });

  it('sous profil lecture, le mode hybride est refusé avant toute tentative', async () => {
    const before = attempts.length;

    await expect(
      dispatchTool(
        services,
        'search_knowledge',
        { query: CANARY, mode: 'hybrid' },
        MCP_PROFILES.read,
      ),
    ).rejects.toMatchObject({ code: -32602 });

    expect(attempts.length).toBe(before);
  });
});
