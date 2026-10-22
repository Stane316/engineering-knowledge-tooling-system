import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import {
  UNAVAILABLE_EMBEDDINGS,
  createSearchEngine,
  embeddingSpace,
  openCliServices,
} from '../../src/cli/services.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { EmbeddingsError } from '../../src/shared/errors.js';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';
import { createDataDir, fakeEmbeddings, removeDataDir } from './helpers.js';

describe('services CLI', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = createDataDir();
  });

  afterEach(() => {
    removeDataDir(dataDir);
    vi.unstubAllEnvs();
  });

  it('expose un repli d’embeddings qui échoue explicitement', async () => {
    await expect(UNAVAILABLE_EMBEDDINGS.embed('x')).rejects.toThrow(EmbeddingsError);
    await expect(UNAVAILABLE_EMBEDDINGS.embedBatch(['x'])).rejects.toThrow(/non configurés/);
  });

  it('construit un moteur lexical sans service d’embeddings', async () => {
    const services = openCliServices({ dataDir, embeddingsMode: 'disabled' });

    try {
      const engine = createSearchEngine(services.database.connection);

      await expect(engine.search('sqlite', { mode: 'fts' })).resolves.toEqual([]);
      await expect(engine.searchVector('sqlite')).rejects.toThrow(/non configurés/);
    } finally {
      services.close();
    }
  });

  it('indexe les vecteurs quand un service est fourni', async () => {
    const services = openCliServices({
      dataDir,
      embeddings: fakeEmbeddings(),
    });

    try {
      expect(services.embeddings).toBeDefined();
      await services.manager.addResource({ type: 'article', title: 'SQLite', tags: [] });

      expect(new VectorRepository(services.database.connection).count()).toBe(1);
    } finally {
      services.close();
    }
  });

  it('ne calcule aucun vecteur quand les embeddings sont désactivés', async () => {
    const services = openCliServices({ dataDir, embeddingsMode: 'disabled' });

    try {
      expect(services.embeddings).toBeUndefined();
      await services.manager.addResource({ type: 'article', title: 'SQLite', tags: [] });

      expect(new VectorRepository(services.database.connection).count()).toBe(0);
    } finally {
      services.close();
    }
  });

  it('tolère une configuration d’embeddings absente en mode auto', () => {
    vi.stubEnv('OPENAI_API_KEY', '');

    const services = openCliServices({ dataDir, embeddingsMode: 'auto' });

    try {
      expect(services.embeddings).toBeUndefined();
    } finally {
      services.close();
    }
  });

  it('crée le service OpenAI en mode auto quand la clé est présente', () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-cli-test');

    const services = openCliServices({ dataDir, embeddingsMode: 'auto' });

    try {
      expect(services.embeddings).toBeInstanceOf(EmbeddingsService);
    } finally {
      services.close();
    }
  });

  it('propage l’erreur en mode required sans clé', () => {
    vi.stubEnv('OPENAI_API_KEY', '');

    expect(() => openCliServices({ dataDir, embeddingsMode: 'required' })).toThrow(EmbeddingsError);
  });

  it('transmet l’option migrate au Data Layer', () => {
    openCliServices({ dataDir, embeddingsMode: 'disabled' }).close();

    const services = openCliServices({ dataDir, embeddingsMode: 'disabled', migrate: false });

    services.close();
  });

  it('ferme la connexion une seule fois', () => {
    const services = openCliServices({ dataDir, embeddingsMode: 'disabled' });

    services.close();
    expect(() => {
      services.close();
    }).not.toThrow();
  });

  it('nomme l’espace d’embedding d’après le modèle du service', () => {
    expect(embeddingSpace(fakeEmbeddings())).toEqual({
      space: 'openai/fake-hash-1536',
      provider: 'openai',
      model: 'fake-hash-1536',
      dimensions: 1536,
    });
  });

  it('retombe sur le modèle configuré quand le service n’en expose pas', () => {
    const provider = new FakeEmbeddingProvider();
    const service = {
      embed: async (text: string) => provider.embed([text]).then(([vector]) => vector as number[]),
      embedBatch: (texts: readonly string[]) => provider.embed(texts),
    };

    vi.stubEnv('OPENAI_EMBEDDING_MODEL', 'modele-maison');
    expect(embeddingSpace(service).model).toBe('modele-maison');

    vi.stubEnv('OPENAI_EMBEDDING_MODEL', '');
    expect(embeddingSpace(service).model).toBe('text-embedding-3-small');
  });
});
