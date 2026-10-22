import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import {
  BestEffortVectorIndexer,
  UNAVAILABLE_EMBEDDINGS,
  createSearchEngine,
  embeddingSpace,
  isOffline,
  openCliServices,
} from '../../src/cli/services.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { EmbeddingsError, NoProviderAvailableError } from '../../src/shared/errors.js';
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
    // `env: {}` coupe toute lecture du disque : le `.env` du poste, qui
    // contient de vraies clés, ne peut plus fournir un fournisseur.
    const services = openCliServices({ dataDir, embeddingsMode: 'auto', env: {} });

    try {
      expect(services.embeddings).toBeUndefined();
    } finally {
      services.close();
    }
  });

  it('crée le service OpenAI en mode auto quand la clé est présente', () => {
    const services = openCliServices({
      dataDir,
      embeddingsMode: 'auto',
      env: { OPENAI_API_KEY: 'sk-cli-test' },
    });

    try {
      expect(services.embeddings).toBeInstanceOf(EmbeddingsService);
    } finally {
      services.close();
    }
  });

  it('propage l’erreur en mode required sans clé', () => {
    expect(() => openCliServices({ dataDir, embeddingsMode: 'required', env: {} })).toThrow(
      NoProviderAvailableError,
    );
  });

  it('ignore une configuration de fournisseurs invalide en mode auto', () => {
    const services = openCliServices({
      dataDir,
      embeddingsMode: 'auto',
      env: { EKTS_PROVIDER_POLICY: 'tarif-maison' },
    });

    try {
      expect(services.embeddings).toBeUndefined();
    } finally {
      services.close();
    }
  });

  it('signale une configuration de fournisseurs invalide en mode required', () => {
    expect(() =>
      openCliServices({
        dataDir,
        embeddingsMode: 'required',
        env: { EKTS_PROVIDER_POLICY: 'tarif-maison' },
      }),
    ).toThrow(/EKTS_PROVIDER_POLICY invalide/);
  });

  it('liste les fournisseurs d’embedding disponibles dans le message d’erreur', () => {
    expect(() => openCliServices({ dataDir, embeddingsMode: 'required', env: {} })).toThrow(
      /openai: clé absente \(OPENAI_API_KEY\).*gemini.*novita/,
    );
  });

  it('respecte le mode hors ligne', () => {
    const env = { EKTS_OFFLINE: '1', OPENAI_API_KEY: 'sk-cli-test' };
    const auto = openCliServices({ dataDir, embeddingsMode: 'auto', env });
    const disabled = openCliServices({ dataDir, embeddingsMode: 'disabled', env });

    try {
      expect(auto.embeddings).toBeUndefined();
      expect(disabled.embeddings).toBeUndefined();
    } finally {
      auto.close();
      disabled.close();
    }
  });

  it('refuse les embeddings en mode required quand le mode hors ligne est actif', () => {
    expect(() =>
      openCliServices({ dataDir, embeddingsMode: 'required', env: { EKTS_OFFLINE: 'yes' } }),
    ).toThrow(/EKTS_OFFLINE/);
  });

  it('ne considère pas une valeur vide comme hors ligne', () => {
    vi.stubEnv('EKTS_OFFLINE', '');

    expect(isOffline()).toBe(false);
    expect(isOffline({ EKTS_OFFLINE: 'TRUE' })).toBe(true);
    expect(isOffline({ EKTS_OFFLINE: '0' })).toBe(false);
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

  it('indexe sans échouer quand le fournisseur d’embeddings tombe', async () => {
    const provider = new FakeEmbeddingProvider();
    provider.failOn = 'SQLite';

    const services = openCliServices({
      dataDir,
      embeddings: new EmbeddingsService({ provider }),
    });

    try {
      const indexer = services.vectorIndexer;
      expect(indexer).toBeInstanceOf(BestEffortVectorIndexer);

      const added = await services.manager.addResource({
        type: 'article',
        title: 'SQLite',
        tags: [],
      });

      expect(added.title).toBe('SQLite');
      expect(indexer?.outcome(added.id)).toMatchObject({ indexed: false });
      expect(indexer?.outcome(added.id).message).toContain('panne simulée');
      expect(indexer?.outcome('autre-id')).toEqual({ indexed: false });
    } finally {
      services.close();
    }
  });

  it('consigne une erreur qui n’est pas un objet Error', async () => {
    const indexer = new BestEffortVectorIndexer({
      indexResource: () => Promise.reject('quota dépassé'),
      removeResource: () => undefined,
      reindexAll: () => Promise.resolve({ indexed: 0, skipped: 0, failed: 0, durationMs: 0 }),
    });

    await indexer.indexResource({ id: 'r1' } as never);

    expect(indexer.outcome('r1')).toEqual({ indexed: false, message: 'quota dépassé' });
  });

  it('applique le mode auto par défaut', () => {
    const services = openCliServices({ dataDir, env: {} });

    try {
      expect(services.embeddings).toBeUndefined();
    } finally {
      services.close();
    }
  });

  it('suit la configuration du disque quand aucun environnement n’est injecté', () => {
    // Chemin de production : sans `env`, la passerelle relit `.env` et
    // `providers.custom.json`. Le test ne présuppose aucune clé — le poste peut
    // en avoir, la CI non — et vérifie seulement l'invariant exposé.
    const services = openCliServices({ dataDir, embeddingsMode: 'auto' });

    try {
      expect(services.embeddings === undefined).toBe(services.embeddingSpace === undefined);
    } finally {
      services.close();
    }
  });

  it('délègue la suppression et la réindexation sans les intercepter', async () => {
    const services = openCliServices({ dataDir, embeddings: fakeEmbeddings() });

    try {
      const created = await services.manager.addResource({
        type: 'article',
        title: 'SQLite',
        tags: [],
      });

      expect(services.vectorIndexer?.outcome(created.id)).toEqual({ indexed: true });

      services.vectorIndexer?.removeResource(created.id);
      expect(new VectorRepository(services.database.connection).count()).toBe(0);

      const report = await services.vectorIndexer?.reindexAll([]);
      expect(report).toMatchObject({ indexed: 0, failed: 0 });
    } finally {
      services.close();
    }
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

    expect(embeddingSpace(service, { OPENAI_EMBEDDING_MODEL: 'modele-maison' }).model).toBe(
      'modele-maison',
    );
    expect(embeddingSpace(service, { OPENAI_EMBEDDING_MODEL: '' }).model).toBe(
      'text-embedding-3-small',
    );
    expect(embeddingSpace(service, {}).model).toBe('text-embedding-3-small');
  });
});
