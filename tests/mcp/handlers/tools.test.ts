import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { TOOL_NAMES } from '../../../src/mcp/schemas/tool-schemas.js';
import { dispatchTool, TOOL_DEFINITIONS } from '../../../src/mcp/handlers/tools.js';
import { ResourceNotFoundError } from '../../../src/shared/errors.js';
import { McpErrorCode } from '../../../src/mcp/utils/errors.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

describe('définitions d’outils', () => {
  it('expose les douze outils (MVP-2 + projets + timeline) dans un ordre stable', () => {
    expect(TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([...TOOL_NAMES]);
    expect(new Set(TOOL_DEFINITIONS.map((tool) => tool.description)).size).toBe(12);
  });
});

describe('dispatchTool', () => {
  let fixture: TestServices;

  beforeAll(async () => {
    fixture = openTestServices();
    await seedResources(fixture.services);
  });

  afterAll(() => {
    fixture.cleanup();
  });

  it('achemine vers search_knowledge', async () => {
    const result = (await dispatchTool(fixture.services, 'search_knowledge', {
      query: 'SQLite',
      mode: 'fts',
    })) as { count: number; mode: string };

    expect(result.mode).toBe('fts');
    expect(result.count).toBeGreaterThanOrEqual(1);
  });

  it('achemine vers list_resources', async () => {
    const result = (await dispatchTool(fixture.services, 'list_resources', {})) as {
      count: number;
    };

    expect(result.count).toBe(3);
  });

  it('achemine vers get_resource', async () => {
    const error = await dispatchTool(fixture.services, 'get_resource', {
      id: '00000000-0000-4000-8000-000000000000',
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ResourceNotFoundError);
  });

  it('achemine vers validate_resource sans écrire', async () => {
    await expect(
      dispatchTool(fixture.services, 'validate_resource', {
        data: { type: 'article', title: 'x' },
      }),
    ).resolves.toEqual({ valid: true });
  });

  it('refuse un outil inconnu avec -32602', async () => {
    const error = await dispatchTool(fixture.services, 'supprimer_tout', {}).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(McpError);
    expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    expect((error as McpError).message).toContain('Outil inconnu');
    expect((error as McpError).message).toContain('search_knowledge');
  });

  it('refuse des paramètres invalides avec un message en français', async () => {
    const error = await dispatchTool(fixture.services, 'search_knowledge', { query: '   ' }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(McpError);
    expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    expect((error as McpError).message).toContain('Paramètres invalides');
    expect((error as McpError).message).toContain('query');
  });

  it('traite une absence d’arguments comme un objet vide', async () => {
    const error = await dispatchTool(fixture.services, 'get_resource', undefined).catch(
      (caught: unknown) => caught,
    );

    expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
  });

  it('ignore une valeur d’arguments qui n’est pas un objet', async () => {
    const error = await dispatchTool(fixture.services, 'list_resources', 'texte').catch(
      (caught: unknown) => caught,
    );

    // `list_resources` n'a aucun champ obligatoire : une chaîne est un objet
    // invalide, pas une liste de filtres.
    expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
  });

  it('achemine vers audit_history (base vide)', async () => {
    const result = (await dispatchTool(fixture.services, 'audit_history', {
      limit: 5,
    })) as { audits: readonly unknown[] };

    expect(result.audits).toEqual([]);
  });

  it('achemine vers audit_report qui signale un audit absent', async () => {
    const error = await dispatchTool(fixture.services, 'audit_report', { audit_id: 999 }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect((error as ResourceNotFoundError).message).toContain('audit #999');
  });
});
