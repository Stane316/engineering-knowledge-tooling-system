import { describe, expect, it } from 'vitest';

import {
  CreateResourceSchema,
  ResourceFiltersSchema,
  ResourceSchema,
  UpdateResourceSchema,
} from '../../src/shared/validators.js';

const validResource = {
  id: '6f1a1c2e-0f4b-4c3a-9b2d-1f5e6a7b8c9d',
  type: 'article' as const,
  title: 'Article de test',
  tags: ['typescript'],
  metadata: { source: 'manual' },
  createdAt: '2026-10-22T10:00:00.000Z',
  updatedAt: '2026-10-22T10:00:00.000Z',
};

describe('CreateResourceSchema', () => {
  it('accepte une entrée complète', () => {
    const result = CreateResourceSchema.safeParse({
      type: 'article',
      title: 'Test',
      url: 'https://example.com/a',
      tags: ['test'],
      metadata: { author: 'John' },
      content: 'Contenu',
    });

    expect(result.success).toBe(true);
  });

  it('applique les valeurs par défaut', () => {
    const parsed = CreateResourceSchema.parse({ type: 'tool', title: 'Outil' });

    expect(parsed.tags).toEqual([]);
    expect(parsed.metadata).toEqual({});
  });

  it('rejette un type inconnu', () => {
    expect(CreateResourceSchema.safeParse({ type: 'podcast', title: 'Test' }).success).toBe(false);
  });

  it('rejette un titre vide ou blanc', () => {
    expect(CreateResourceSchema.safeParse({ type: 'article', title: '' }).success).toBe(false);
    expect(CreateResourceSchema.safeParse({ type: 'article', title: '   ' }).success).toBe(false);
  });

  it('rejette une URL invalide', () => {
    const result = CreateResourceSchema.safeParse({
      type: 'article',
      title: 'Test',
      url: 'pas-une-url',
    });

    expect(result.success).toBe(false);
  });

  it('rejette un tag vide', () => {
    expect(
      CreateResourceSchema.safeParse({ type: 'article', title: 'Test', tags: [''] }).success,
    ).toBe(false);
  });
});

describe('UpdateResourceSchema', () => {
  it('accepte une mise à jour partielle', () => {
    expect(UpdateResourceSchema.safeParse({ title: 'Nouveau' }).success).toBe(true);
  });

  it('accepte null pour effacer un champ', () => {
    const parsed = UpdateResourceSchema.parse({ url: null, content: null });

    expect(parsed.url).toBeNull();
    expect(parsed.content).toBeNull();
  });

  it('rejette un objet vide', () => {
    expect(UpdateResourceSchema.safeParse({}).success).toBe(false);
  });

  it('rejette un titre vide', () => {
    expect(UpdateResourceSchema.safeParse({ title: '' }).success).toBe(false);
  });
});

describe('ResourceFiltersSchema', () => {
  it('accepte des filtres valides', () => {
    expect(ResourceFiltersSchema.safeParse({ type: 'video', limit: 10, offset: 5 }).success).toBe(
      true,
    );
  });

  it('rejette une limite nulle ou négative', () => {
    expect(ResourceFiltersSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(ResourceFiltersSchema.safeParse({ limit: -3 }).success).toBe(false);
  });

  it('rejette un offset négatif', () => {
    expect(ResourceFiltersSchema.safeParse({ offset: -1 }).success).toBe(false);
  });

  it('rejette une limite non entière', () => {
    expect(ResourceFiltersSchema.safeParse({ limit: 1.5 }).success).toBe(false);
  });
});

describe('ResourceSchema', () => {
  it('accepte une ressource persistée', () => {
    expect(ResourceSchema.safeParse(validResource).success).toBe(true);
  });

  it('rejette un identifiant non UUID', () => {
    expect(ResourceSchema.safeParse({ ...validResource, id: 'abc' }).success).toBe(false);
  });

  it('rejette une date non ISO', () => {
    expect(ResourceSchema.safeParse({ ...validResource, createdAt: '22/10/2026' }).success).toBe(
      false,
    );
  });
});
