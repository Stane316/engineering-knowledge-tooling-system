import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '../../../src/shared/errors.js';
import type { Resource } from '../../../src/shared/validators.js';
import { GetResourceInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeGetResource } from '../../../src/mcp/tools/get-resource.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

describe('get_resource', () => {
  let fixture: TestServices;
  let resources: Resource[];

  beforeAll(async () => {
    fixture = openTestServices();
    resources = await seedResources(fixture.services);
  });

  afterAll(() => {
    fixture.cleanup();
  });

  it('renvoie la ressource demandée avec toutes ses propriétés', async () => {
    const first = resources[0];

    if (first === undefined) {
      throw new Error('fixture vide');
    }

    const result = await executeGetResource(
      fixture.services,
      GetResourceInput.parse({ id: first.id }),
    );

    expect(result.resource).toMatchObject({
      id: first.id,
      type: 'article',
      title: 'SQLite en pratique',
      tags: ['sqlite', 'base'],
    });
    expect(result.resource.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u);
  });

  it('signale une ressource inexistante', async () => {
    await expect(
      executeGetResource(
        fixture.services,
        GetResourceInput.parse({ id: '00000000-0000-4000-8000-000000000000' }),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('expose l’identifiant fautif dans l’erreur', async () => {
    const error = await executeGetResource(
      fixture.services,
      GetResourceInput.parse({ id: 'inconnu' }),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect((error as ResourceNotFoundError).resourceId).toBe('inconnu');
  });
});
