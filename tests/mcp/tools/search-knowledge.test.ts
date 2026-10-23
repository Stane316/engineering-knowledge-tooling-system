import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EmbeddingsError } from '../../../src/shared/errors.js';
import { SearchKnowledgeInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeSearchKnowledge } from '../../../src/mcp/tools/search-knowledge.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

describe('search_knowledge — recherche plein texte', () => {
  let fixture: TestServices;

  beforeAll(async () => {
    fixture = openTestServices();
    await seedResources(fixture.services);
  });

  afterAll(() => {
    fixture.cleanup();
  });

  it('renvoie les ressources correspondantes avec leur score', async () => {
    const result = await executeSearchKnowledge(
      fixture.services,
      SearchKnowledgeInput.parse({ query: 'SQLite', mode: 'fts' }),
    );

    expect(result.query).toBe('SQLite');
    expect(result.mode).toBe('fts');
    expect(result.count).toBe(result.results.length);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.results[0]?.source).toBe('fts');
    expect(result.results[0]?.resource.title).toContain('SQLite');
  });

  it('filtre par type', async () => {
    const result = await executeSearchKnowledge(
      fixture.services,
      SearchKnowledgeInput.parse({ query: 'recherche', mode: 'fts', type: 'video' }),
    );

    expect(result.results.every((entry) => entry.resource.type === 'video')).toBe(true);
  });

  it('filtre par tags (tous requis)', async () => {
    const both = await executeSearchKnowledge(
      fixture.services,
      SearchKnowledgeInput.parse({ query: 'SQLite', mode: 'fts', tags: ['search', 'sqlite'] }),
    );
    const none = await executeSearchKnowledge(
      fixture.services,
      SearchKnowledgeInput.parse({ query: 'SQLite', mode: 'fts', tags: ['inexistant'] }),
    );

    expect(both.results.map((entry) => entry.resource.type)).toEqual(['video']);
    expect(none).toMatchObject({ count: 0, results: [] });
  });

  it('respecte la limite', async () => {
    const result = await executeSearchKnowledge(
      fixture.services,
      SearchKnowledgeInput.parse({ query: 'SQLite', mode: 'fts', limit: 1 }),
    );

    expect(result.results).toHaveLength(1);
  });

  it('renvoie un résultat vide sans erreur quand rien ne correspond', async () => {
    const result = await executeSearchKnowledge(
      fixture.services,
      SearchKnowledgeInput.parse({ query: 'kubernetes', mode: 'fts' }),
    );

    expect(result).toMatchObject({ count: 0, results: [] });
  });
});

describe('search_knowledge — modes vectoriels', () => {
  it('combine plein texte et vecteurs en mode hybride', async () => {
    const fixture = openTestServices({ embeddings: true });

    try {
      await seedResources(fixture.services);

      const result = await executeSearchKnowledge(
        fixture.services,
        SearchKnowledgeInput.parse({ query: 'SQLite', mode: 'hybrid' }),
      );

      expect(result.mode).toBe('hybrid');
      expect(result.count).toBeGreaterThanOrEqual(1);
      expect(result.results[0]?.source).toBe('hybrid');
    } finally {
      fixture.cleanup();
    }
  });

  it('échoue explicitement en hybride sans fournisseur d’embeddings', async () => {
    const fixture = openTestServices();

    try {
      await seedResources(fixture.services);

      await expect(
        executeSearchKnowledge(
          fixture.services,
          SearchKnowledgeInput.parse({ query: 'SQLite', mode: 'hybrid' }),
        ),
      ).rejects.toBeInstanceOf(EmbeddingsError);
    } finally {
      fixture.cleanup();
    }
  });
});
