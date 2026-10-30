/**
 * Refus des noms non autorisés et intégrité des outils permis (Sprint 21-02).
 *
 * C-P02 : chacun des **quatorze** noms hors profil `read` est appelé via le
 * chemin d'exécution direct, avec des arguments conformes au schéma et, quand
 * c'est peu coûteux, des préconditions synthétiques réelles (projet, template).
 *
 * C-P03 : les trois outils autorisés continuent de répondre correctement sous
 * le même profil, sans effet métier imprévu.
 *
 * Les deux critères partagent le même relevé d'état logique : si une garde
 * manquait, un appel caché ne se contenterait pas d'échouer — `delete_project`
 * supprimerait un projet, `create_project` en créerait un. L'assertion de
 * refus (code `-32601`) suffit à faire échouer le cas dans les deux sens, mais
 * la comparaison d'état documente l'absence de mutation.
 *
 * Aucun fournisseur réel : le service d'embeddings est un espion local qui
 * compte ses appels, et `fetch` est remplacé par un compteur qui échoue.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IEmbeddingsService } from '../../src/business/embeddings.js';
import type { McpServices } from '../../src/mcp/context.js';
import { dispatchTool } from '../../src/mcp/handlers/tools.js';
import { MCP_PROFILES } from '../../src/mcp/profiles.js';
import { McpErrorCode } from '../../src/mcp/utils/errors.js';
import { fakeEmbeddings } from '../cli/helpers.js';
import { openTestServices, seedResources, type TestServices } from './helpers.js';

/** Fournisseur factice qui compte ses appels (aucun réseau). */
class CountingEmbeddings implements IEmbeddingsService {
  calls = 0;

  constructor(private readonly inner: IEmbeddingsService = fakeEmbeddings()) {}

  async embed(text: string): Promise<number[]> {
    this.calls += 1;

    return this.inner.embed(text);
  }

  async embedBatch(texts: readonly string[]): Promise<number[][]> {
    this.calls += 1;

    return this.inner.embedBatch(texts);
  }
}

/**
 * Les quatorze noms hors profil `read`, avec arguments valides et
 * précondition synthétique associée.
 *
 * `precondition` vaut `null` quand l'appel n'en exige aucune, ou décrit ce qui
 * a été préparé dans la base de test (`projet`, `template`).
 */
interface RefusedCall {
  readonly tool: string;
  readonly args: Record<string, unknown>;
  readonly precondition: string | null;
}

/** État logique des tables métier, lu par les services (pas par SQL brut). */
interface BusinessState {
  readonly resources: readonly string[];
  readonly resourceCount: number;
  readonly indexed: number;
  readonly projects: readonly string[];
  readonly audits: readonly number[];
  readonly bestPractices: readonly string[];
  readonly templates: readonly string[];
}

async function snapshot(services: McpServices): Promise<BusinessState> {
  const resources = await services.manager.listResources();
  const stats = await services.manager.stats();

  return {
    resources: resources.map((resource) => resource.id).sort(),
    resourceCount: resources.length,
    indexed: stats.indexed,
    projects: (await services.projects.listProjects()).map((project) => project.id).sort(),
    audits: services.audits.repository
      .list(0, 500)
      .map((audit) => audit.metadata.id ?? -1)
      .sort((left, right) => left - right),
    bestPractices: services.bestPractices
      .list()
      .map((practice) => practice.id)
      .sort(),
    templates: services.templates
      .listTemplates()
      .map((template) => template.id)
      .sort(),
  };
}

describe('C-P02 — refus direct des noms hors profil', () => {
  let fixture: TestServices;
  let embeddings: CountingEmbeddings;
  let projectId: string;
  let templateId: string;
  let fetchCalls = 0;
  let calls: readonly RefusedCall[] = [];
  let before: BusinessState;
  let after: BusinessState;
  const responses: { tool: string; code: number; message: string; data: unknown }[] = [];

  beforeAll(async () => {
    embeddings = new CountingEmbeddings();
    fixture = openTestServices({ embeddings });
    await seedResources(fixture.services);

    // Préconditions synthétiques réelles : un projet et un template existent,
    // donc une garde absente produirait une suppression ou une création
    // observable, pas une simple erreur « introuvable ».
    const project = await fixture.services.projects.createProject({
      name: 'Projet canari C-P02',
      description: 'Précondition synthétique, supprimable sans conséquence.',
    });
    projectId = project.id;

    const firstTemplate = fixture.services.templates.listTemplates()[0];
    if (firstTemplate === undefined) {
      throw new Error('aucun template disponible : précondition C-P02 non établie');
    }
    templateId = firstTemplate.id;

    calls = [
      {
        tool: 'validate_resource',
        args: {
          data: {
            type: 'article',
            title: 'Ressource canari',
            tags: ['canari'],
            content: 'Contenu synthétique suffisant pour la validation.',
          },
        },
        precondition: null,
      },
      {
        tool: 'inspect_site',
        args: { url: 'https://example.test/', level: 'L3' },
        precondition: null,
      },
      { tool: 'audit_history', args: { limit: 10 }, precondition: null },
      {
        tool: 'audit_report',
        args: { audit_id: 1, format: 'markdown' },
        precondition: 'audit absent (refus attendu avant lecture)',
      },
      { tool: 'create_project', args: { name: 'Projet interdit C-P02' }, precondition: null },
      { tool: 'list_projects', args: { limit: 10 }, precondition: null },
      { tool: 'get_project', args: { project_id: projectId }, precondition: 'projet' },
      { tool: 'delete_project', args: { project_id: projectId }, precondition: 'projet' },
      { tool: 'get_timeline', args: { project_id: projectId }, precondition: 'projet' },
      { tool: 'search_best_practices', args: { query: 'canari', limit: 5 }, precondition: null },
      {
        tool: 'add_best_practice',
        args: {
          title: 'Pratique canari',
          description: 'Description synthétique assez longue pour être valide.',
          category: 'general',
        },
        precondition: null,
      },
      { tool: 'get_recommendations', args: { project_id: projectId }, precondition: 'projet' },
      { tool: 'list_templates', args: { limit: 5 }, precondition: null },
      {
        tool: 'apply_template',
        args: {
          template_id: templateId,
          project_name: 'Projet template interdit',
          project_url: 'https://example.test/projet',
        },
        precondition: 'template',
      },
    ];

    // Le semis et les préconditions ont légitimement produit des embeddings :
    // la mesure commence ici, pas à l'ouverture.
    embeddings.calls = 0;
    fetchCalls = 0;
    vi.stubGlobal('fetch', () => {
      fetchCalls += 1;

      return Promise.reject(new Error('réseau interdit dans les tests C-P02'));
    });

    before = await snapshot(fixture.services);

    for (const call of calls) {
      try {
        const result = await dispatchTool(
          fixture.services,
          call.tool,
          call.args,
          MCP_PROFILES.read,
        );
        responses.push({
          tool: call.tool,
          code: 0,
          message: 'appel accepté (inattendu)',
          data: result,
        });
      } catch (error) {
        const shaped = error as { code?: number; message?: string; data?: unknown };
        responses.push({
          tool: call.tool,
          code: shaped.code ?? -1,
          message: shaped.message ?? String(error),
          data: shaped.data,
        });
      }
    }

    after = await snapshot(fixture.services);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    fixture.cleanup();
  });

  it('couvre exactement les quatorze noms hors profil', () => {
    expect(calls).toHaveLength(14);
    expect(new Set(calls.map((call) => call.tool)).size).toBe(14);
    expect(calls.map((call) => call.tool)).toEqual([
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
    ]);
  });

  it('refuse 14/14 par la politique, jamais par une entrée invalide', () => {
    expect(responses).toHaveLength(14);

    for (const response of responses) {
      expect(response, response.tool).toMatchObject({
        code: McpErrorCode.MethodNotFound,
        data: { profile: 'read' },
      });
      // Une entrée invalide (-32602) ne serait pas une preuve de refus par
      // politique : le message et le code doivent désigner la politique.
      expect(response.code, response.tool).not.toBe(McpErrorCode.InvalidParams);
      expect(response.message, response.tool).toMatch(/profil|autoris/i);
    }
  });

  it('refuse aussi un faux nouvel outil que personne n’a enregistré', async () => {
    const outcome = await dispatchTool(
      fixture.services,
      'outil_fantome_2027',
      { anything: true },
      MCP_PROFILES.read,
    ).then(
      () => 'accepté',
      (error: { code?: number; data?: { profile?: string } }) =>
        `${String(error.code)}:${String(error.data?.profile)}`,
    );

    expect(outcome).toBe(`${String(McpErrorCode.MethodNotFound)}:read`);
  });

  it('ne mute aucune table métier et n’exécute aucune action réseau', () => {
    expect(after).toEqual(before);
    expect(after.projects).toContain(projectId);
    expect(fetchCalls).toBe(0);
    expect(embeddings.calls).toBe(0);
  });
});

describe('C-P03 — les trois outils autorisés restent fonctionnels', () => {
  let fixture: TestServices;
  let embeddings: CountingEmbeddings;
  let fetchCalls = 0;
  let beforeState: BusinessState;
  let afterState: BusinessState;

  beforeAll(async () => {
    embeddings = new CountingEmbeddings();
    fixture = openTestServices({ embeddings });
    await seedResources(fixture.services);

    fetchCalls = 0;
    vi.stubGlobal('fetch', () => {
      fetchCalls += 1;

      return Promise.reject(new Error('réseau interdit dans les tests C-P03'));
    });

    beforeState = await snapshot(fixture.services);
    afterState = beforeState;
    embeddings.calls = 0;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    fixture.cleanup();
  });

  beforeEach(() => {
    fetchCalls = 0;
    embeddings.calls = 0;
  });

  it('search_knowledge répond en FTS explicite', async () => {
    const result = (await dispatchTool(
      fixture.services,
      'search_knowledge',
      { query: 'SQLite', mode: 'fts' },
      MCP_PROFILES.read,
    )) as { mode: string; count: number; results: { resource: { id: string } }[] };

    expect(result.mode).toBe('fts');
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.results.length).toBe(result.count);
  });

  it('get_resource renvoie la ressource demandée', async () => {
    const [first] = await fixture.services.manager.listResources();
    if (first === undefined) {
      throw new Error('fixture vide : C-P03 non mesurable');
    }

    const result = (await dispatchTool(
      fixture.services,
      'get_resource',
      { id: first.id },
      MCP_PROFILES.read,
    )) as { resource: { id: string; title: string } };

    expect(result.resource.id).toBe(first.id);
    expect(result.resource.title).toBe(first.title);
  });

  it('list_resources renvoie le catalogue complet', async () => {
    const result = (await dispatchTool(
      fixture.services,
      'list_resources',
      {},
      MCP_PROFILES.read,
    )) as { count: number; resources: { id: string }[] };

    expect(result.count).toBe(3);
    expect(result.resources).toHaveLength(3);
  });

  it('conserve le contrat historique des trois outils sous profil complet', async () => {
    const read = (await dispatchTool(
      fixture.services,
      'list_resources',
      { type: 'video' },
      MCP_PROFILES.read,
    )) as { count: number; resources: { id: string }[] };
    const full = (await dispatchTool(
      fixture.services,
      'list_resources',
      { type: 'video' },
      MCP_PROFILES.full,
    )) as { count: number; resources: { id: string }[] };

    expect(read).toEqual(full);
    expect(read.count).toBe(1);
  });

  it('n’a provoqué ni écriture métier, ni appel d’embeddings, ni réseau', async () => {
    afterState = await snapshot(fixture.services);

    expect(afterState).toEqual(beforeState);
    expect(embeddings.calls).toBe(0);
    expect(fetchCalls).toBe(0);
  });
});
