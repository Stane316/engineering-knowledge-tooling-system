import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ListResourcesInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeListResources } from '../../../src/mcp/tools/list-resources.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

describe('list_resources', () => {
  let fixture: TestServices;

  beforeAll(async () => {
    fixture = openTestServices();
    await seedResources(fixture.services);
  });

  afterAll(() => {
    fixture.cleanup();
  });

  it('liste toutes les ressources avec leur compte', async () => {
    const result = await executeListResources(fixture.services, ListResourcesInput.parse({}));

    expect(result.count).toBe(3);
    expect(result.resources).toHaveLength(3);
    expect(result.resources.map((resource) => resource.type).sort()).toEqual([
      'article',
      'tutorial',
      'video',
    ]);
  });

  it('filtre par type', async () => {
    const result = await executeListResources(
      fixture.services,
      ListResourcesInput.parse({ type: 'tutorial' }),
    );

    expect(result.count).toBe(1);
    expect(result.resources[0]?.title).toBe('Indexer avec FTS5');
  });

  it('filtre par tags, tous requis', async () => {
    const one = await executeListResources(
      fixture.services,
      ListResourcesInput.parse({ tags: ['sqlite'] }),
    );
    const both = await executeListResources(
      fixture.services,
      ListResourcesInput.parse({ tags: ['sqlite', 'search'] }),
    );

    expect(one.count).toBe(2);
    expect(both.count).toBe(1);
    expect(both.resources[0]?.type).toBe('video');
  });

  it('respecte la limite', async () => {
    const result = await executeListResources(
      fixture.services,
      ListResourcesInput.parse({ limit: 1 }),
    );

    expect(result.count).toBe(1);
  });

  it('renvoie une liste vide sans erreur', async () => {
    const result = await executeListResources(
      fixture.services,
      ListResourcesInput.parse({ type: 'tool' }),
    );

    expect(result).toEqual({ count: 0, resources: [] });
  });
});
