import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingsError, IndexingError, SearchError } from '../../src/shared/errors.js';

/** Vecteur unitaire porté par l'axe `index` (1536 dimensions). */
const axis = (index: number, weight = 1): number[] => {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  vector[index] = weight;
  return vector;
};

describe('VectorRepository', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let resources: ResourceRepository;
  let vectors: VectorRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-vec-'));
    database = openDatabase({ dataDir });
    resources = new ResourceRepository(database.connection);
    vectors = new VectorRepository(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const createResource = (title: string): string =>
    resources.create({ type: 'article', title, content: 'contenu' }).id;

  it('détecte la disponibilité de l’index', () => {
    expect(vectors.isAvailable()).toBe(true);

    // Base ouverte sans migration : le schéma `vectors` est attaché mais vide.
    const emptyDir = mkdtempSync(join(tmpdir(), 'ekts-novec-'));
    const withoutTable = openDatabase({ dataDir: emptyDir, migrate: false });

    try {
      expect(new VectorRepository(withoutTable.connection).isAvailable()).toBe(false);
    } finally {
      withoutTable.close();
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('retrouve le voisin exact avec une similarité de 1', async () => {
    const id = createResource('sqlite vectoriel');
    vectors.insertEmbedding(id, axis(0));

    const [result] = await vectors.search(axis(0));

    expect(result?.resource.id).toBe(id);
    expect(result?.score).toBeCloseTo(1, 6);
    expect(result?.source).toBe('vector');
  });

  it('classe par similarité décroissante', async () => {
    const close = createResource('proche');
    const far = createResource('lointain');
    const orthogonal = createResource('orthogonal');

    vectors.insertEmbedding(close, axis(0));
    vectors.insertEmbedding(far, [
      0.6,
      0.8,
      ...new Array<number>(EMBEDDING_DIMENSIONS - 2).fill(0),
    ]);
    vectors.insertEmbedding(orthogonal, axis(1));

    const results = await vectors.search(axis(0));

    expect(results.map((item) => item.resource.id)).toEqual([close, far, orthogonal]);
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it('remplace un vecteur existant (DELETE + INSERT, pas d’INSERT OR REPLACE)', async () => {
    const id = createResource('remplacé');
    vectors.insertEmbedding(id, axis(0));
    vectors.insertEmbedding(id, axis(1));

    expect(vectors.count()).toBe(1);

    const [result] = await vectors.search(axis(1));

    expect(result?.resource.id).toBe(id);
    expect(result?.score).toBeCloseTo(1, 6);
  });

  it('supprime un vecteur et reste idempotent', () => {
    const id = createResource('supprimé');
    vectors.insertEmbedding(id, axis(0));

    expect(vectors.deleteEmbedding(id)).toBe(true);
    expect(vectors.deleteEmbedding(id)).toBe(false);
    expect(vectors.count()).toBe(0);
  });

  it('stocke des vecteurs normalisés', () => {
    const id = createResource('norme');
    vectors.insertEmbedding(id, axis(5, 3));

    const stored = vectors.getEmbedding(id) ?? [];

    expect(stored).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(Math.hypot(...stored)).toBeCloseTo(1, 6);
    expect(stored[5]).toBeCloseTo(1, 6);
  });

  it('renvoie null pour une ressource sans vecteur', () => {
    expect(vectors.getEmbedding('inconnue')).toBeNull();
  });

  it('refuse un vecteur de dimension incorrecte', () => {
    const id = createResource('dimension');

    expect(() => vectors.insertEmbedding(id, [0.1, 0.2])).toThrow(EmbeddingsError);
    expect(() =>
      vectors.insertEmbedding(id, new Array<number>(EMBEDDING_DIMENSIONS).fill(0)),
    ).toThrow(EmbeddingsError);
  });

  it('refuse une limite invalide', async () => {
    await expect(vectors.search(axis(0), 0)).rejects.toBeInstanceOf(SearchError);
  });

  it('échoue explicitement quand l’index vectoriel est absent', async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'ekts-novec2-'));
    const withoutTable = openDatabase({ dataDir: emptyDir, migrate: false });

    try {
      const repository = new VectorRepository(withoutTable.connection);

      await expect(repository.search(axis(0))).rejects.toBeInstanceOf(SearchError);
      expect(() => repository.insertEmbedding('x', axis(0))).toThrow(IndexingError);
      expect(repository.deleteEmbedding('x')).toBe(false);
      expect(repository.getEmbedding('x')).toBeNull();
      expect(repository.count()).toBe(0);
    } finally {
      withoutTable.close();
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('ignore les vecteurs orphelins (ressource supprimée de la base principale)', async () => {
    const id = createResource('orphelin');
    vectors.insertEmbedding(id, axis(0));
    database.connection.prepare('DELETE FROM resources WHERE id = ?').run(id);

    await expect(vectors.search(axis(0))).resolves.toEqual([]);
    expect(vectors.count()).toBe(1);
  });
});
