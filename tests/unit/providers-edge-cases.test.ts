import { afterEach, describe, expect, it, vi } from 'vitest';

import { embedOpenAiCompatible } from '../../src/business/providers/adapters.js';
import {
  GatewayEmbeddingProvider,
  resolveEmbeddingSpace,
} from '../../src/business/providers/embedding-provider.js';
import { ProviderGateway } from '../../src/business/providers/gateway.js';
import { HttpClient } from '../../src/business/providers/http.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { NoProviderAvailableError } from '../../src/shared/errors.js';
import { loadKeyring } from '../../src/shared/providers/env.js';
import { getProvider } from '../../src/shared/providers/catalog.js';
import type { ResolvedRoute } from '../../src/shared/providers/types.js';

/**
 * Cas limites volontairement défensifs : code atteignable seulement par une
 * entrée construite à la main (route incomplète, `fetch` bloqué, horloge réelle).
 * Les couvrir évite que la couverture ne repose sur des branches mortes.
 */

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const embeddingBody = (count: number, dimensions = EMBEDDING_DIMENSIONS): unknown => ({
  data: Array.from({ length: count }, (_, index) => ({
    index,
    embedding: new Array<number>(dimensions).fill(0.01),
  })),
});

afterEach(() => {
  vi.useRealTimers();
});

describe('HttpClient — horloge et temporisation réelles', () => {
  it('attend réellement entre deux tentatives quand aucun sleep n’est injecté', async () => {
    let attempt = 0;
    const fetch = (async () => {
      attempt += 1;
      return attempt === 1 ? json({ error: { message: 'boom' } }, 500) : json({ ok: true });
    }) as unknown as typeof globalThis.fetch;

    const client = new HttpClient({ fetch, baseDelayMs: 1, maxDelayMs: 2 });

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).resolves.toEqual({ ok: true });
    expect(attempt).toBe(2);
  });

  it('interrompt une requête qui dépasse le délai', async () => {
    const fetch = ((_: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      })) as unknown as typeof globalThis.fetch;

    const client = new HttpClient({ fetch, timeoutMs: 5, retries: 0 });

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).rejects.toThrow(/délai de 5 ms dépassé/);
  });

  it('traite un 429 sans en-tête Retry-After', async () => {
    let attempt = 0;
    const fetch = (async () => {
      attempt += 1;
      return attempt === 1 ? json({ error: { message: 'trop vite' } }, 429) : json({ ok: true });
    }) as unknown as typeof globalThis.fetch;

    const client = new HttpClient({ fetch, baseDelayMs: 1 });

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).resolves.toEqual({ ok: true });
  });
});

describe('adapters — réponses partielles', () => {
  const route: ResolvedRoute = {
    provider: getProvider('openai'),
    model: 'text-embedding-3-small',
    keys: ['k'],
  };

  it('accepte des vecteurs sans index explicite', async () => {
    const client = {
      requestJson: async () => ({ data: [{ embedding: [1, 2] }, { embedding: [3, 4] }] }),
    } as unknown as HttpClient;

    await expect(embedOpenAiCompatible(client, route, 'k', ['a', 'b'])).resolves.toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});

describe('GatewayEmbeddingProvider — cas limites', () => {
  it('propage l’erreur quand aucun fournisseur n’est configuré', async () => {
    const gateway = new ProviderGateway({
      keyring: loadKeyring({}),
      env: {},
      fetch: (async () => json(embeddingBody(1))) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });
    const provider = new GatewayEmbeddingProvider(gateway);

    expect(provider.space).toBeUndefined();
    await expect(provider.embed(['a'])).rejects.toBeInstanceOf(NoProviderAvailableError);
  });

  it('utilise la dimension du schéma quand la route n’en déclare pas', () => {
    const fakeGateway = {
      plan: (): ResolvedRoute[] => [
        {
          provider: getProvider('openai'),
          model: 'text-embedding-3-small',
          space: 'openai/text-embedding-3-small',
          keys: ['k'],
        },
      ],
    } as unknown as ProviderGateway;

    expect(resolveEmbeddingSpace(fakeGateway).dimensions).toBe(EMBEDDING_DIMENSIONS);
  });
});

describe('ProviderGateway — espace imposé', () => {
  it('compte les fournisseurs d’un espace imposé', () => {
    const gateway = new ProviderGateway({
      keyring: loadKeyring({ OPENAI_API_KEY: 'sk-1', NOVITA_API_KEY: 'n-1' }),
      env: { OPENAI_API_KEY: 'sk-1', NOVITA_API_KEY: 'n-1' },
      space: 'baai/bge-m3',
      fetch: (async () => json(embeddingBody(1, 1024))) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });

    expect(gateway.available('embedding')).toBe(1);
    expect(gateway.plan('embedding')[0]?.space).toBe('baai/bge-m3');
  });
});

describe('ProviderGateway — route sans clé', () => {
  it('ignore une route que la planification aurait laissée sans clé', async () => {
    const gateway = new ProviderGateway({
      keyring: loadKeyring({ OPENAI_API_KEY: 'sk-1' }),
      env: { OPENAI_API_KEY: 'sk-1' },
      fetch: (async () => json(embeddingBody(1))) as typeof globalThis.fetch,
      sleep: async () => undefined,
    });

    vi.spyOn(gateway, 'plan').mockReturnValue([
      {
        provider: getProvider('openai'),
        model: 'text-embedding-3-small',
        space: 'openai/text-embedding-3-small',
        keys: [],
      },
    ]);

    await expect(gateway.embed(['a'])).rejects.toBeInstanceOf(NoProviderAvailableError);
  });
});
