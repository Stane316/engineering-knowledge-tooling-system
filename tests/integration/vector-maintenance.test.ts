import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import { createKnowledgeManager } from '../../src/business/knowledge-manager.js';
import { VectorIndexer } from '../../src/business/vector-indexer.js';
import { reindexVectors } from '../../src/business/vector-maintenance.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingSpaceMismatchError } from '../../src/shared/errors.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';

const SPACE_A = {
  space: 'openai/text-embedding-3-small',
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: EMBEDDING_DIMENSIONS,
};

const SPACE_B = {
  space: 'baai/bge-m3',
  provider: 'novita',
  model: 'baai/bge-m3',
  dimensions: EMBEDDING_DIMENSIONS,
};

/** Indexer configuré pour un espace donné (le service CLI fait de même). */
function indexerFor(storage: VectorRepository, space: typeof SPACE_A): VectorIndexer {
  return new VectorIndexer(
    new EmbeddingsService({ provider: new FakeEmbeddingProvider() }),
    storage,
    { space },
  );
}

describe('maintenance de l’index vectoriel', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let vectors: VectorRepository;
  let indexer: VectorIndexer;
  let manager: ReturnType<typeof createKnowledgeManager>['manager'];

  beforeEach(async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-vectors-'));
    database = openDatabase({ dataDir });
    vectors = new VectorRepository(database.connection);
    indexer = new VectorIndexer(
      new EmbeddingsService({ provider: new FakeEmbeddingProvider() }),
      vectors,
      {
        space: SPACE_A,
      },
    );
    manager = createKnowledgeManager(database.connection).manager;
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('réindexe les ressources dans l’espace courant', async () => {
    await indexer.indexResource(
      await manager.addResource({ type: 'article', title: 'Un', tags: [] }),
    );
    await indexer.indexResource(
      await manager.addResource({ type: 'article', title: 'Deux', tags: [] }),
    );

    const outcome = await reindexVectors({ manager, indexer, vectors });

    expect(outcome.resources).toBe(2);
    expect(outcome.switched).toBe(false);
    expect(outcome.removed).toBe(0);
    expect(outcome.space).toBe(SPACE_A.space);
    expect(outcome.report).toMatchObject({ indexed: 2, failed: 0 });
    expect(vectors.activeSpace()?.space).toBe(SPACE_A.space);
  });

  it('refuse de changer d’espace sans autorisation explicite', async () => {
    await indexer.indexResource(
      await manager.addResource({ type: 'article', title: 'Un', tags: [] }),
    );

    await expect(
      reindexVectors({ manager, indexer: indexerFor(vectors, SPACE_B), vectors }),
    ).rejects.toThrow(EmbeddingSpaceMismatchError);
    expect(vectors.activeSpace()?.space).toBe(SPACE_A.space);
  });

  it('bascule d’espace et recalcule tous les vecteurs quand c’est demandé', async () => {
    await indexer.indexResource(
      await manager.addResource({ type: 'article', title: 'Un', tags: [] }),
    );
    await indexer.indexResource(
      await manager.addResource({ type: 'article', title: 'Deux', tags: [] }),
    );

    const outcome = await reindexVectors({
      manager,
      indexer: indexerFor(vectors, SPACE_B),
      vectors,
      force: true,
    });

    expect(outcome.switched).toBe(true);
    expect(outcome.removed).toBe(2);
    expect(outcome.report.indexed).toBe(2);
    expect(vectors.activeSpace()?.space).toBe(SPACE_B.space);
    expect(vectors.count()).toBe(2);
  });

  it('lie l’index au premier passage quand aucun espace n’est encore actif', async () => {
    // La liaison est faite à la première écriture : il faut une ressource.
    await manager.addResource({ type: 'article', title: 'Un', tags: [] });

    const outcome = await reindexVectors({
      manager,
      indexer: indexerFor(vectors, SPACE_B),
      vectors,
    });

    expect(outcome.switched).toBe(false);
    expect(outcome.resources).toBe(1);
    expect(outcome.report.indexed).toBe(1);
    expect(vectors.activeSpace()?.space).toBe(SPACE_B.space);
  });

  it('reste sans espace lié quand il n’y a aucun vecteur à écrire', async () => {
    const outcome = await reindexVectors({
      manager,
      indexer: indexerFor(vectors, SPACE_B),
      vectors,
    });

    expect(outcome.switched).toBe(false);
    expect(outcome.report.indexed).toBe(0);
    expect(vectors.activeSpace()).toBeNull();
  });

  it('refuse un indexer sans espace d’embedding', async () => {
    const bare = new VectorIndexer(
      new EmbeddingsService({ provider: new FakeEmbeddingProvider() }),
      vectors,
    );

    await expect(reindexVectors({ manager, indexer: bare, vectors })).rejects.toThrow(
      /sans espace d’embedding/,
    );
  });
});
