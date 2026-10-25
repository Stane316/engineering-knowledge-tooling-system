import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { McpError } from '@modelcontextprotocol/sdk/types.js';

import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { McpErrorCode } from '../../../src/mcp/utils/errors.js';
import { openTestServices, type TestServices } from '../helpers.js';

interface AddResult {
  practice: {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    isManual: boolean;
    occurrenceCount: number;
  };
  summary: string;
}

describe('MCP add_best_practice (Sprint 15-03, C15.12)', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('crée une bonne pratique manuelle (isManual true)', async () => {
    const result = (await dispatchTool(fixture.services, 'add_best_practice', {
      title: 'Utiliser le lazy loading',
      description: 'Ajouter loading=lazy aux images et iframes hors viewport',
      category: 'performance',
      tags: ['lazy-loading', 'images'],
    })) as AddResult;

    expect(result.practice.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu,
    );
    expect(result.practice.isManual).toBe(true);
    expect(result.practice.occurrenceCount).toBe(1);
    expect(result.practice.tags).toEqual(['lazy-loading', 'images']);
    expect(result.summary).toContain('✅');
    expect(result.summary).toContain(result.practice.id);
  });

  it('crée sans tags (défaut tableau vide)', async () => {
    const result = (await dispatchTool(fixture.services, 'add_best_practice', {
      title: 'Pratique sans tag',
      description: 'Description suffisamment détaillée pour la validation',
      category: 'general',
    })) as AddResult;
    expect(result.practice.tags).toEqual([]);
  });

  it('la pratique créée devient visible par la recherche (persistance)', async () => {
    await dispatchTool(fixture.services, 'add_best_practice', {
      title: 'Tester les contrastes WCAG',
      description: 'Vérifier un ratio de contraste minimal de 4.5 pour le texte',
      category: 'accessibility',
    });

    const results = (await dispatchTool(fixture.services, 'search_best_practices', {
      query: 'contrastes',
    })) as { count: number; results: Array<{ title: string }> };
    expect(results.count).toBe(1);
    expect(results.results[0]?.title).toBe('Tester les contrastes WCAG');
  });

  it('refuse les entrées invalides en -32602', async () => {
    const valid = {
      title: 'Titre suffisant',
      description: 'Description suffisamment longue',
      category: 'seo',
    };
    for (const args of [
      { ...valid, title: 'ab' },
      { ...valid, title: '' },
      { ...valid, description: 'court' },
      { ...valid, category: 'bogus' },
      { ...valid, tags: Array.from({ length: 31 }, (_, i) => `t${i}`) },
      { ...valid, tags: [''] },
      { ...valid, tags: ['ok', 42] },
      { description: 'sans titre valide ici', category: 'seo' },
    ]) {
      const error = await dispatchTool(fixture.services, 'add_best_practice', args).catch(
        (caught: unknown) => caught,
      );
      expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    }
  });

  it('add_best_practice est un outil d écriture du catalogue', async () => {
    const { TOOL_DEFINITIONS } = await import('../../../src/mcp/handlers/tools.js');
    expect(TOOL_DEFINITIONS.map((tool) => tool.name)).toContain('add_best_practice');
    expect(TOOL_DEFINITIONS).toHaveLength(17);
  });
});
