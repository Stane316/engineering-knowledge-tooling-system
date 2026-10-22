import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmbeddingsService,
  createEmbeddingsService,
  type EmbeddingProvider,
} from '../../src/business/embeddings.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { FTSRepository } from '../../src/data/fts-repository.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingsError, IndexingError, SearchError } from '../../src/shared/errors.js';

/**
 * Vérifie que les erreurs natives (SQLite, réseau, valeurs non-`Error`) sont
 * **toujours** converties en erreurs métier typées : les appelants (CLI, MCP)
 * n'ont jamais à interpréter un message de `SqliteError`.
 */
describe('Encapsulation des erreurs', () => {
  let dataDir: string;
  let database: EktsDatabase;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-errors-'));
    database = openDatabase({ dataDir });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('convertit une erreur SQLite de recherche FTS en SearchError', async () => {
    const repository = new FTSRepository(database.connection);
    database.connection.exec('DROP TABLE fts.resources_fts');

    const error = await repository.search('sqlite').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SearchError);
    expect((error as SearchError).code).toBe('SEARCH_FAILED');
    expect((error as SearchError).cause).toBeInstanceOf(Error);
  });

  it('convertit une erreur SQLite de lecture vectorielle en SearchError', async () => {
    const repository = new VectorRepository(database.connection);
    database.connection.exec('DROP TABLE vectors.resources_vectors');

    const query = new Array<number>(EMBEDDING_DIMENSIONS).fill(0.1);

    await expect(repository.search(query)).rejects.toBeInstanceOf(SearchError);
  });

  it('convertit une erreur SQLite d’écriture vectorielle en IndexingError', () => {
    const repository = new VectorRepository(database.connection);
    database.connection.exec('DROP TABLE vectors.resources_vectors');
    const query = new Array<number>(EMBEDDING_DIMENSIONS).fill(0.1);

    expect(() => repository.insertEmbedding('id', query)).toThrow(IndexingError);
  });

  it('convertit une erreur SQLite de suppression vectorielle en IndexingError', () => {
    const repository = new VectorRepository(database.connection);
    database.connection.exec('DROP TABLE vectors.resources_vectors');

    expect(() => repository.deleteEmbedding('id')).toThrow(IndexingError);
  });

  it('convertit un rejet non-Error du fournisseur en EmbeddingsError', async () => {
    const provider: EmbeddingProvider = {
      model: 'rejet-brut',
      dimensions: EMBEDDING_DIMENSIONS,
      embed: () => Promise.reject('panne textuelle'),
    };

    const service = new EmbeddingsService({ provider });
    const error = await service.embed('sqlite').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmbeddingsError);
    expect((error as Error).message).toContain('panne textuelle');
  });

  it('lit process.env quand aucune variable n’est injectée', () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-depuis-process-env');

    expect(createEmbeddingsService().model).toBe('text-embedding-3-small');
  });

  it('accepte un client OpenAI pré-construit', () => {
    const create = vi.fn().mockResolvedValue({ data: [] });
    const service = createEmbeddingsService({
      env: { OPENAI_API_KEY: 'sk-test' },
      client: { embeddings: { create } } as never,
    });

    expect(service.model).toBe('text-embedding-3-small');
  });
});
