import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { McpError } from '@modelcontextprotocol/sdk/types.js';

import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { McpErrorCode } from '../../../src/mcp/utils/errors.js';
import { openTestServices, type TestServices } from '../helpers.js';

import type { ListTemplatesResult } from '../../../src/mcp/tools/list-templates.js';

describe('MCP list_templates (Sprint 17-03, C17.7)', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('liste les 10 prédéfinis semés au démarrage (C17.2)', async () => {
    const result = (await dispatchTool(
      fixture.services,
      'list_templates',
      {},
    )) as ListTemplatesResult;

    expect(result.count).toBe(10);
    expect(result.templates.every((template) => template.isBuiltin)).toBe(true);
    expect(result.summary).toContain('## Templates de projets disponibles');
    expect(result.summary).toContain('📦');
    expect(result.summary).toContain('10 template(s)');
  });

  it('filtre par catégorie, builtin_only et limit', async () => {
    fixture.services.templates.createTemplate({
      name: 'Perso MCP',
      description: 'Custom pour le test',
      category: 'custom',
    });

    const customs = (await dispatchTool(fixture.services, 'list_templates', {
      builtin_only: false,
      category: 'custom',
    })) as ListTemplatesResult;
    expect(customs.count).toBe(1);
    expect(customs.templates[0]?.name).toBe('Perso MCP');
    expect(customs.summary).toContain('✏️');

    const saas = (await dispatchTool(fixture.services, 'list_templates', {
      category: 'saas',
    })) as ListTemplatesResult;
    expect(saas.count).toBe(1);
    expect(saas.templates[0]?.name).toBe('SaaS / Application web');

    const limited = (await dispatchTool(fixture.services, 'list_templates', {
      limit: 3,
    })) as ListTemplatesResult;
    expect(limited.count).toBe(3);
  });

  it("retourne un résumé explicite si l'ensemble est vide", async () => {
    const result = (await dispatchTool(fixture.services, 'list_templates', {
      category: 'custom',
    })) as ListTemplatesResult;
    expect(result.count).toBe(0);
    expect(result.summary).toContain('Aucun template trouvé');
  });

  it('refuse les entrées invalides en -32602 (C17.20)', async () => {
    for (const args of [
      { category: 'bogus' },
      { limit: 0 },
      { limit: 1.5 },
      { limit: 1000 },
      { builtin_only: 'oui' },
    ]) {
      const error = await dispatchTool(fixture.services, 'list_templates', args).catch(
        (caught: unknown) => caught,
      );
      expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
      expect((error as McpError).message).toContain('list_templates');
    }
  });
});
