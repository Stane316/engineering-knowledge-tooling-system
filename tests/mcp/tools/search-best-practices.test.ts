import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { McpError } from '@modelcontextprotocol/sdk/types.js';

import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { McpErrorCode } from '../../../src/mcp/utils/errors.js';
import { openTestServices, type TestServices } from '../helpers.js';

interface SearchResult {
  count: number;
  total: number;
  summary: string;
  query?: string;
  results: Array<{ id: string; title: string; category: string; score: number; matchType: string }>;
}

describe('MCP search_best_practices (Sprint 15-03, C15.11)', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  async function add(title: string, category: string, tags?: string[]): Promise<string> {
    const created = (await dispatchTool(fixture.services, 'add_best_practice', {
      title,
      description: 'Description détaillée de la pratique de test',
      category,
      ...(tags === undefined ? {} : { tags }),
    })) as { practice: { id: string } };
    return created.practice.id;
  }

  beforeEach(async () => {
    await add('Optimiser les images WebP', 'performance', ['images', 'webp']);
    await add('Ajouter les attributs alt', 'accessibility', ['images']);
    await add('Méta description unique', 'seo');
  });

  it('recherche par texte avec résumé et scores (défaut limit 10)', async () => {
    const result = (await dispatchTool(fixture.services, 'search_best_practices', {
      query: 'images',
    })) as SearchResult;

    expect(result.count).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(result.count);
    expect(result.query).toBe('images');
    expect(result.summary).toContain('## Recherche');
    expect(result.results.every((entry) => entry.score > 0 && entry.score <= 1)).toBe(true);
    expect(result.results.every((entry) => entry.matchType === 'fts')).toBe(true);
  });

  it('énumère sans requête (matchType list) avec filtres catégorie/tag/projet', async () => {
    const all = (await dispatchTool(fixture.services, 'search_best_practices', {})) as SearchResult;
    expect(all.count).toBe(3);
    expect(all.summary).toContain('## Bonnes pratiques');
    expect(all.results.every((entry) => entry.matchType === 'list')).toBe(true);

    const byCategory = (await dispatchTool(fixture.services, 'search_best_practices', {
      category: 'seo',
    })) as SearchResult;
    expect(byCategory.count).toBe(1);

    const byTag = (await dispatchTool(fixture.services, 'search_best_practices', {
      tag: 'images',
    })) as SearchResult;
    expect(byTag.count).toBe(2);

    const byProject = (await dispatchTool(fixture.services, 'search_best_practices', {
      project_id: '00000000-0000-4000-8000-000000000000',
    })) as SearchResult;
    expect(byProject.count).toBe(0);
  });

  it('respecte la limite (0 autorisé = liste vide)', async () => {
    const zero = (await dispatchTool(fixture.services, 'search_best_practices', {
      query: 'images',
      limit: 0,
    })) as SearchResult;
    expect(zero.count).toBe(0);
    expect(zero.summary).toContain('Aucune bonne pratique');

    const one = (await dispatchTool(fixture.services, 'search_best_practices', {
      query: 'images',
      limit: 1,
    })) as SearchResult;
    expect(one.count).toBe(1);
  });

  it("sans résultat : count 0, résumé vide, pas d'erreur", async () => {
    const result = (await dispatchTool(fixture.services, 'search_best_practices', {
      query: 'xyznonexistent',
    })) as SearchResult;
    expect(result.count).toBe(0);
    expect(result.results).toEqual([]);
  });

  it('refuse les entrées invalides en -32602', async () => {
    for (const args of [
      { query: '' },
      { category: 'bogus' },
      { tag: '' },
      { project_id: 'pas-uuid' },
      { limit: -1 },
      { limit: 1.5 },
      { limit: 1000 },
    ]) {
      const error = await dispatchTool(fixture.services, 'search_best_practices', args).catch(
        (caught: unknown) => caught,
      );
      expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    }
  });
});
