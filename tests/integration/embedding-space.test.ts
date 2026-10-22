import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import { createKnowledgeManager } from '../../src/business/knowledge-manager.js';
import {
  GatewayEmbeddingProvider,
  resolveEmbeddingSpace,
} from '../../src/business/providers/embedding-provider.js';
import { ProviderGateway } from '../../src/business/providers/gateway.js';
import { VectorIndexer, withVectorIndexing } from '../../src/business/vector-indexer.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingSpaceMismatchError, IndexingError } from '../../src/shared/errors.js';
import { loadKeyring } from '../../src/shared/providers/env.js';

const OPENAI_SPACE = {
  space: 'openai/text-embedding-3-small',
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: EMBEDDING_DIMENSIONS,
};

const BGE_SPACE = {
  space: 'baai/bge-m3',
  provider: 'novita',
  model: 'baai/bge-m3',
  dimensions: 1024,
};

/** Réponse d'embedding OpenAI factice. */
const embeddingResponse = (count: number, dimension = EMBEDDING_DIMENSIONS): Response =>
  new Response(
    JSON.stringify({
      data: Array.from({ length: count }, (_, index) => ({
        index,
        embedding: new Array<number>(dimension)
          .fill(0)
          .map((_, position) => (position === index ? 1 : 0.01)),
      })),
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

describe('espace d’embedding de l’index', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let vectors: VectorRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-space-'));
    database = openDatabase({ dataDir });
    vectors = new VectorRepository(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('aucun espace lié au départ', () => {
    expect(vectors.activeSpace()).toBeNull();
    expect(() => vectors.assertSpace(OPENAI_SPACE.space)).not.toThrow();
  });

  it('lie l’index à un espace et le persiste', () => {
    vectors.bindSpace(OPENAI_SPACE);

    expect(vectors.activeSpace()).toMatchObject({
      space: 'openai/text-embedding-3-small',
      provider: 'openai',
      model: 'text-embedding-3-small',
      dimensions: 1536,
    });
  });

  it('remplace la liaison précédente quand l’index est vide', () => {
    vectors.bindSpace(OPENAI_SPACE);
    vectors.bindSpace(BGE_SPACE);

    expect(vectors.activeSpace()?.space).toBe('baai/bge-m3');
  });

  it('refuse un autre espace quand l’index contient des vecteurs', () => {
    vectors.bindSpace(OPENAI_SPACE);
    vectors.insertEmbedding('r1', new Array<number>(EMBEDDING_DIMENSIONS).fill(0.5));

    expect(() => vectors.assertSpace('baai/bge-m3')).toThrow(EmbeddingSpaceMismatchError);
    expect(() => vectors.assertSpace('baai/bge-m3')).toThrow(/l'index contient « openai/);
  });

  it('autorise le même espace', () => {
    vectors.bindSpace(OPENAI_SPACE);
    vectors.insertEmbedding('r1', new Array<number>(EMBEDDING_DIMENSIONS).fill(0.5));

    expect(() => vectors.assertSpace(OPENAI_SPACE.space)).not.toThrow();
  });

  it('purge l’index et oublie la liaison', () => {
    vectors.bindSpace(OPENAI_SPACE);
    vectors.insertEmbedding('r1', new Array<number>(EMBEDDING_DIMENSIONS).fill(0.5));

    expect(vectors.clearAll()).toBe(1);
    expect(vectors.count()).toBe(0);
    expect(vectors.activeSpace()).toBeNull();
    expect(() => vectors.assertSpace(BGE_SPACE.space)).not.toThrow();
  });

  it('échoue proprement si la table des espaces est inaccessible', () => {
    database.connection.exec('DROP TABLE embedding_spaces');

    expect(() => vectors.bindSpace(OPENAI_SPACE)).toThrow(IndexingError);
  });

  it('échoue proprement si la purge ne peut pas oublier la liaison', () => {
    vectors.bindSpace(OPENAI_SPACE);
    database.connection.exec('DROP TABLE embedding_spaces');

    expect(() => vectors.clearAll()).toThrow(IndexingError);
  });

  it('ignore la liaison quand l’index vectoriel est absent', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'ekts-nospc-'));
    const withoutTable = openDatabase({ dataDir: emptyDir, migrate: false });

    try {
      const repository = new VectorRepository(withoutTable.connection);

      expect(() => repository.bindSpace(OPENAI_SPACE)).not.toThrow();
      expect(repository.activeSpace()).toBeNull();
      expect(repository.clearAll()).toBe(0);
    } finally {
      withoutTable.close();
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});

describe('VectorIndexer — liaison d’espace', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let vectors: VectorRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-vspace-'));
    database = openDatabase({ dataDir });
    vectors = new VectorRepository(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const provider = (): GatewayEmbeddingProvider => {
    const gateway = new ProviderGateway({
      keyring: loadKeyring({ OPENAI_API_KEY: 'sk-1' }),
      env: { OPENAI_API_KEY: 'sk-1' },
      fetch: (async () => embeddingResponse(1)) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });

    return new GatewayEmbeddingProvider(gateway);
  };

  it('lie l’index au premier document indexé', async () => {
    const manager = createKnowledgeManager(database.connection);
    const indexer = new VectorIndexer(new EmbeddingsService({ provider: provider() }), vectors, {
      space: OPENAI_SPACE,
    });

    await indexer.indexResource(
      await manager.manager.addResource({ type: 'article', title: 'sqlite' }),
    );

    expect(vectors.activeSpace()?.space).toBe(OPENAI_SPACE.space);
  });

  it('ne lie rien sans espace déclaré', async () => {
    const manager = createKnowledgeManager(database.connection);
    const indexer = new VectorIndexer(new EmbeddingsService({ provider: provider() }), vectors);

    await indexer.indexResource(
      await manager.manager.addResource({ type: 'article', title: 'sqlite' }),
    );

    expect(vectors.activeSpace()).toBeNull();
    expect(vectors.count()).toBe(1);
  });

  it('échoue au lieu de mélanger deux espaces', async () => {
    vectors.bindSpace(BGE_SPACE);
    vectors.insertEmbedding('ancien', encodeUnit(0));

    const manager = createKnowledgeManager(database.connection);
    const indexer = new VectorIndexer(new EmbeddingsService({ provider: provider() }), vectors, {
      space: OPENAI_SPACE,
    });

    const resource = await manager.manager.addResource({ type: 'article', title: 'sqlite' });

    await expect(indexer.indexResource(resource)).rejects.toBeInstanceOf(
      EmbeddingSpaceMismatchError,
    );
    expect(vectors.activeSpace()?.space).toBe(BGE_SPACE.space);
  });

  it('change d’espace en purgeant l’ancien index', async () => {
    const indexer = new VectorIndexer(new EmbeddingsService({ provider: provider() }), vectors, {
      space: OPENAI_SPACE,
    });
    vectors.bindSpace(OPENAI_SPACE);
    vectors.insertEmbedding('ancien', encodeUnit(0));

    expect(indexer.switchSpace(BGE_SPACE)).toBe(1);
    expect(vectors.activeSpace()?.space).toBe(BGE_SPACE.space);
    expect(vectors.count()).toBe(0);
  });
});

describe('GatewayEmbeddingProvider', () => {
  const build = (env: NodeJS.ProcessEnv, dimension: number, response?: () => Response) => {
    const gateway = new ProviderGateway({
      keyring: loadKeyring(env),
      env,
      fetch: (async (_url: string, init: RequestInit) => {
        if (response !== undefined) {
          return response();
        }

        const body = JSON.parse(String(init.body ?? '{}')) as { input?: unknown };
        const count = Array.isArray(body.input) ? body.input.length : 1;

        return embeddingResponse(count, dimension);
      }) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });

    return new GatewayEmbeddingProvider(gateway);
  };

  it('expose la dimension du schéma et l’espace servi', async () => {
    const provider = build({ OPENAI_API_KEY: 'sk-1' }, EMBEDDING_DIMENSIONS);

    expect(provider.dimensions).toBe(EMBEDDING_DIMENSIONS);
    expect(provider.space).toBe('openai/text-embedding-3-small');
    expect(provider.model).toBe('auto');

    const vectors = await provider.embed(['a']);

    expect(vectors[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(provider.model).toBe('text-embedding-3-small');
    expect(provider.trace?.provider).toBe('openai');
  });

  it('respecte un espace explicitement demandé', () => {
    const provider = build({ NOVITA_API_KEY: 'n-1', OPENAI_API_KEY: 'sk-1' }, 1024);

    expect(new GatewayEmbeddingProvider(gatewayOf(provider), { space: 'baai/bge-m3' }).space).toBe(
      'baai/bge-m3',
    );
  });

  it('renvoie un espace indéfini sans clé configurée', () => {
    const provider = build({}, EMBEDDING_DIMENSIONS);

    expect(provider.space).toBeUndefined();
  });

  it('fonctionne dans EmbeddingsService sans modification', async () => {
    const service = new EmbeddingsService({ provider: build({ OPENAI_API_KEY: 'sk-1' }, 1536) });

    const vectors = await service.embedBatch(['a', 'b']);

    expect(vectors).toHaveLength(2);
    expect(service.model).toBe('text-embedding-3-small');
  });
});

describe('resolveEmbeddingSpace', () => {
  const gateway = (env: NodeJS.ProcessEnv): ProviderGateway =>
    new ProviderGateway({
      keyring: loadKeyring(env),
      env,
      fetch: (async () => embeddingResponse(1)) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });

  it('résout le premier espace disponible', () => {
    expect(resolveEmbeddingSpace(gateway({ OPENAI_API_KEY: 'sk-1' }))).toEqual(OPENAI_SPACE);
  });

  it('respecte un espace imposé', () => {
    const resolved = resolveEmbeddingSpace(
      gateway({ OPENAI_API_KEY: 'sk-1', NOVITA_API_KEY: 'n-1' }),
      'baai/bge-m3',
    );

    expect(resolved).toEqual(BGE_SPACE);
  });

  it('échoue explicitement sans fournisseur configuré', () => {
    expect(() => resolveEmbeddingSpace(gateway({}))).toThrow(/Aucun fournisseur disponible/);
  });

  it('échoue explicitement sur un espace non servi', () => {
    expect(() => resolveEmbeddingSpace(gateway({ OPENAI_API_KEY: 'sk-1' }), 'baai/bge-m3')).toThrow(
      /Aucun fournisseur disponible/,
    );
  });
});

/** Vecteur unitaire sur l'axe `index` (1536 dimensions). */
function encodeUnit(index: number): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  vector[index] = 1;
  return vector;
}

/** Récupère la passerelle interne d'un provider (test uniquement). */
function gatewayOf(provider: GatewayEmbeddingProvider): ProviderGateway {
  return (provider as unknown as { gateway: ProviderGateway }).gateway;
}

describe('withVectorIndexing — espace', () => {
  let dataDir: string;
  let database: EktsDatabase;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-wspace-'));
    database = openDatabase({ dataDir });
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('indexe via la passerelle et lie l’espace', async () => {
    const gateway = new ProviderGateway({
      keyring: loadKeyring({ OPENAI_API_KEY: 'sk-1' }),
      env: { OPENAI_API_KEY: 'sk-1' },
      fetch: (async () => embeddingResponse(1)) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });

    const vectors = new VectorRepository(database.connection);
    const inner = createKnowledgeManager(database.connection);
    const manager = withVectorIndexing(
      inner.manager,
      new VectorIndexer(
        new EmbeddingsService({ provider: new GatewayEmbeddingProvider(gateway) }),
        vectors,
        { space: OPENAI_SPACE },
      ),
    );

    const created = await manager.addResource({ type: 'article', title: 'sqlite recherche' });

    expect(vectors.activeSpace()?.space).toBe(OPENAI_SPACE.space);
    expect(vectors.getEmbedding(created.id)).not.toBeNull();
  });
});
