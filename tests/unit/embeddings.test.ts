import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_BATCH_SIZE,
  EmbeddingsService,
  OpenAIEmbeddingProvider,
  createEmbeddingsService,
  type EmbeddingProvider,
} from '../../src/business/embeddings.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingsError } from '../../src/shared/errors.js';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';

/** Fournisseur pilotable pour tester la validation du service. */
class StubProvider implements EmbeddingProvider {
  readonly model = 'stub';
  readonly dimensions: number;

  constructor(
    private readonly behaviour: (texts: readonly string[]) => number[][] | Promise<number[][]>,
    dimensions = EMBEDDING_DIMENSIONS,
  ) {
    this.dimensions = dimensions;
  }

  embed(texts: readonly string[]): Promise<number[][]> {
    return Promise.resolve(this.behaviour(texts));
  }
}

const vector = (value = 1): number[] => new Array<number>(EMBEDDING_DIMENSIONS).fill(value);

describe('EmbeddingsService', () => {
  it('calcule l’embedding d’un texte', async () => {
    const provider = new FakeEmbeddingProvider();
    const service = new EmbeddingsService({ provider });

    const embedding = await service.embed('sqlite recherche');

    expect(embedding).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(service.model).toBe('fake-hash-1536');
    expect(provider.calls).toEqual([['sqlite recherche']]);
  });

  it('renvoie [] sans appeler le fournisseur quand la liste est vide', async () => {
    const provider = new FakeEmbeddingProvider();
    const service = new EmbeddingsService({ provider });

    await expect(service.embedBatch([])).resolves.toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it('découpe en lots de la taille demandée, dans l’ordre', async () => {
    const provider = new FakeEmbeddingProvider();
    const service = new EmbeddingsService({ provider, batchSize: 2 });

    const vectors = await service.embedBatch(['un', 'deux', 'trois', 'quatre', 'cinq']);

    expect(vectors).toHaveLength(5);
    expect(provider.calls).toEqual([['un', 'deux'], ['trois', 'quatre'], ['cinq']]);
  });

  it('utilise la taille de lot par défaut', () => {
    expect(DEFAULT_BATCH_SIZE).toBe(64);
    expect(() => new EmbeddingsService({ provider: new FakeEmbeddingProvider() })).not.toThrow();
  });

  it('refuse une taille de lot invalide', () => {
    const provider = new FakeEmbeddingProvider();

    expect(() => new EmbeddingsService({ provider, batchSize: 0 })).toThrow(EmbeddingsError);
    expect(() => new EmbeddingsService({ provider, batchSize: -2 })).toThrow(EmbeddingsError);
    expect(() => new EmbeddingsService({ provider, batchSize: 1.5 })).toThrow(EmbeddingsError);
  });

  it('refuse un texte vide avant tout appel réseau', async () => {
    const provider = new FakeEmbeddingProvider();
    const service = new EmbeddingsService({ provider });

    await expect(service.embed('   ')).rejects.toBeInstanceOf(EmbeddingsError);
    await expect(service.embedBatch(['ok', ''])).rejects.toBeInstanceOf(EmbeddingsError);
    expect(provider.calls).toEqual([]);
  });

  it('convertit toute erreur du fournisseur en EmbeddingsError', async () => {
    const service = new EmbeddingsService({
      provider: new StubProvider(() => {
        throw new Error('réseau indisponible');
      }),
    });

    const error = await service.embed('texte').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmbeddingsError);
    expect((error as EmbeddingsError).message).toBeTruthy();
    expect((error as EmbeddingsError).cause).toBeInstanceOf(Error);
  });

  it('laisse passer une EmbeddingsError déjà typée', async () => {
    const original = new EmbeddingsError('quota dépassé');
    const service = new EmbeddingsService({
      provider: new StubProvider(() => {
        throw original;
      }),
    });

    await expect(service.embed('texte')).rejects.toBe(original);
  });

  it('refuse un nombre de vecteurs incohérent', async () => {
    const service = new EmbeddingsService({
      provider: new StubProvider(() => [vector()]),
    });

    await expect(service.embedBatch(['a', 'b'])).rejects.toThrow(/1 vecteur\(s\) reçu\(s\) pour 2/);
  });

  it('refuse une dimension incohérente', async () => {
    const service = new EmbeddingsService({
      provider: new StubProvider(() => [[1, 2, 3]]),
    });

    await expect(service.embed('texte')).rejects.toThrow(/dimension 3 au lieu de 1536/);
  });

  it('refuse une valeur non finie', async () => {
    const service = new EmbeddingsService({
      provider: new StubProvider(() => [[Number.POSITIVE_INFINITY, ...vector().slice(1)]]),
    });

    await expect(service.embed('texte')).rejects.toThrow(/valeur non finie/);
  });
});

describe('OpenAIEmbeddingProvider', () => {
  it('refuse une clé vide', () => {
    expect(() => new OpenAIEmbeddingProvider({ apiKey: '   ' })).toThrow(EmbeddingsError);
  });

  it('applique le modèle et la dimension par défaut', () => {
    const provider = new OpenAIEmbeddingProvider({ apiKey: 'sk-test' });

    expect(provider.model).toBe('text-embedding-3-small');
    expect(provider.dimensions).toBe(EMBEDDING_DIMENSIONS);
  });

  it('accepte un modèle personnalisé', () => {
    const provider = new OpenAIEmbeddingProvider({
      apiKey: 'sk-test',
      model: 'text-embedding-3-large',
      dimensions: EMBEDDING_DIMENSIONS,
    });

    expect(provider.model).toBe('text-embedding-3-large');
  });

  it('trie les vecteurs reçus par index', async () => {
    const create = vi.fn().mockResolvedValue({
      data: [
        { index: 1, embedding: vector(2) },
        { index: 0, embedding: vector(1) },
      ],
    });

    const provider = new OpenAIEmbeddingProvider({
      apiKey: 'sk-test',
      client: { embeddings: { create } } as never,
    });

    const vectors = await provider.embed(['a', 'b']);

    expect(vectors[0]?.[0]).toBe(1);
    expect(vectors[1]?.[0]).toBe(2);
    expect(create).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['a', 'b'],
      dimensions: EMBEDDING_DIMENSIONS,
    });
  });
});

describe('createEmbeddingsService', () => {
  const env = (overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
    OPENAI_API_KEY: 'sk-test',
    ...overrides,
  });

  it('échoue sans OPENAI_API_KEY', () => {
    expect(() => createEmbeddingsService({ env: {} })).toThrow(EmbeddingsError);
    expect(() => createEmbeddingsService({ env: { OPENAI_API_KEY: '  ' } })).toThrow(
      /OPENAI_API_KEY absente/,
    );
  });

  it('applique le modèle par défaut', () => {
    const service = createEmbeddingsService({ env: env() });

    expect(service.model).toBe('text-embedding-3-small');
  });

  it('lit OPENAI_EMBEDDING_MODEL', () => {
    const service = createEmbeddingsService({
      env: env({ OPENAI_EMBEDDING_MODEL: 'text-embedding-3-large' }),
    });

    expect(service.model).toBe('text-embedding-3-large');
  });

  it('ignore une variable de modèle vide', () => {
    const service = createEmbeddingsService({ env: env({ OPENAI_EMBEDDING_MODEL: '   ' }) });

    expect(service.model).toBe('text-embedding-3-small');
  });

  it('accepte EMBEDDING_DIMENSION = 1536', () => {
    expect(() =>
      createEmbeddingsService({ env: env({ EMBEDDING_DIMENSION: '1536' }) }),
    ).not.toThrow();
    expect(() =>
      createEmbeddingsService({ env: env({ EMBEDDING_DIMENSION: '  ' }) }),
    ).not.toThrow();
  });

  it('refuse une dimension invalide ou incompatible avec le schéma', () => {
    expect(() => createEmbeddingsService({ env: env({ EMBEDDING_DIMENSION: 'abc' }) })).toThrow(
      EmbeddingsError,
    );
    expect(() => createEmbeddingsService({ env: env({ EMBEDDING_DIMENSION: '0' }) })).toThrow(
      EmbeddingsError,
    );
    expect(() => createEmbeddingsService({ env: env({ EMBEDDING_DIMENSION: '768' }) })).toThrow(
      /incompatible avec le schéma/,
    );
  });
});
