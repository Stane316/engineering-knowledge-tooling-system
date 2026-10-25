import { describe, expect, it } from 'vitest';

import {
  GetResourceInput,
  getResourceSchema,
  listResourcesSchema,
  ListResourcesInput,
  MAX_LIST_LIMIT,
  MAX_SEARCH_LIMIT,
  SearchKnowledgeInput,
  searchKnowledgeSchema,
  TOOL_DESCRIPTIONS,
  TOOL_NAMES,
  ValidateResourceInput,
  validateResourceSchema,
} from '../../../src/mcp/schemas/tool-schemas.js';

describe('JSON Schemas exposés par tools/list', () => {
  it('décrit search_knowledge avec sa requête obligatoire', () => {
    const properties = searchKnowledgeSchema.properties as Record<string, unknown>;

    expect(searchKnowledgeSchema.type).toBe('object');
    expect(properties.query).toBeDefined();
    expect(searchKnowledgeSchema.required).toContain('query');
    expect(JSON.stringify(searchKnowledgeSchema)).toContain('hybrid');
  });

  it('décrit get_resource avec son identifiant obligatoire', () => {
    expect(getResourceSchema.type).toBe('object');
    expect(getResourceSchema.required).toEqual(['id']);
  });

  it('décrit list_resources avec ses filtres facultatifs', () => {
    const properties = listResourcesSchema.properties as Record<string, unknown>;

    expect(listResourcesSchema.type).toBe('object');
    expect(Object.keys(properties)).toEqual(['type', 'tags', 'limit']);
    expect(listResourcesSchema.required).toBeUndefined();
    expect(JSON.stringify(listResourcesSchema)).toContain('tutorial');
  });

  it('décrit validate_resource avec ses données obligatoires', () => {
    expect(validateResourceSchema.type).toBe('object');
    expect(validateResourceSchema.required).toEqual(['data']);
  });

  it('expose dix-sept descriptions et dix-sept noms stables', () => {
    expect(TOOL_NAMES).toEqual([
      'search_knowledge',
      'get_resource',
      'list_resources',
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

    for (const name of TOOL_NAMES) {
      expect(TOOL_DESCRIPTIONS[name].length).toBeGreaterThan(20);
    }
  });
});

describe('SearchKnowledgeInput', () => {
  it('applique les valeurs par défaut', () => {
    expect(SearchKnowledgeInput.parse({ query: '  sqlite  ' })).toEqual({
      query: 'sqlite',
      limit: 10,
      mode: 'hybrid',
    });
  });

  it('refuse une requête vide', () => {
    expect(SearchKnowledgeInput.safeParse({ query: '   ' }).success).toBe(false);
    expect(SearchKnowledgeInput.safeParse({}).success).toBe(false);
  });

  it('borne la limite et le mode', () => {
    expect(SearchKnowledgeInput.safeParse({ query: 'x', limit: 0 }).success).toBe(false);
    expect(
      SearchKnowledgeInput.safeParse({ query: 'x', limit: MAX_SEARCH_LIMIT + 1 }).success,
    ).toBe(false);
    expect(SearchKnowledgeInput.safeParse({ query: 'x', limit: 2.5 }).success).toBe(false);
    expect(SearchKnowledgeInput.safeParse({ query: 'x', mode: 'magique' }).success).toBe(false);
  });

  it('accepte les filtres de type et de tags', () => {
    expect(
      SearchKnowledgeInput.parse({ query: 'x', type: 'article', tags: ['sqlite'] }),
    ).toMatchObject({ type: 'article', tags: ['sqlite'] });
    expect(SearchKnowledgeInput.safeParse({ query: 'x', type: 'podcast' }).success).toBe(false);
  });
});

describe('GetResourceInput', () => {
  it('normalise et refuse les identifiants vides', () => {
    expect(GetResourceInput.parse({ id: '  abc  ' })).toEqual({ id: 'abc' });
    expect(GetResourceInput.safeParse({ id: '   ' }).success).toBe(false);
  });
});

describe('ListResourcesInput', () => {
  it('accepte l’absence de filtre', () => {
    expect(ListResourcesInput.parse({})).toEqual({});
  });

  it('borne la limite', () => {
    expect(ListResourcesInput.safeParse({ limit: 0 }).success).toBe(false);
    expect(ListResourcesInput.safeParse({ limit: MAX_LIST_LIMIT + 1 }).success).toBe(false);
    expect(ListResourcesInput.parse({ limit: MAX_LIST_LIMIT })).toEqual({ limit: MAX_LIST_LIMIT });
  });
});

describe('ValidateResourceInput', () => {
  it('exige la clé data, même quand sa valeur est nulle', () => {
    expect(ValidateResourceInput.safeParse({}).success).toBe(false);
    expect(ValidateResourceInput.safeParse({ data: null }).success).toBe(true);
    expect(ValidateResourceInput.safeParse({ data: { title: 'x' } }).success).toBe(true);
  });
});
