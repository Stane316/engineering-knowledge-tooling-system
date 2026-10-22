import { describe, expect, it, vi } from 'vitest';

import { HttpClient, aggregateFailure } from '../../src/business/providers/http.js';
import { ProviderError, RateLimitError } from '../../src/shared/errors.js';

interface Call {
  url: string;
  init: RequestInit;
}

/** Fabrique un `fetch` scripté : chaque appel consomme la réponse suivante. */
function scriptedFetch(responses: (() => Response | Promise<Response>)[]): {
  fetch: typeof globalThis.fetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  let index = 0;

  const fakeFetch = async (input: string, init: RequestInit): Promise<Response> => {
    calls.push({ url: input, init });
    const responder = responses[Math.min(index, responses.length - 1)];
    index += 1;

    if (responder === undefined) {
      throw new Error('aucune réponse scriptée');
    }

    return responder();
  };

  return { fetch: fakeFetch as unknown as typeof globalThis.fetch, calls };
}

const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const build = (
  responses: (() => Response | Promise<Response>)[],
  overrides: Partial<ConstructorParameters<typeof HttpClient>[0]> = {},
): { client: HttpClient; calls: Call[]; slept: number[] } => {
  const { fetch, calls } = scriptedFetch(responses);
  const slept: number[] = [];

  const client = new HttpClient({
    fetch,
    sleep: async (ms) => {
      slept.push(ms);
    },
    baseDelayMs: 1,
    ...overrides,
  });

  return { client, calls, slept };
};

describe('HttpClient', () => {
  it('renvoie le corps JSON désérialisé', async () => {
    const { client, calls } = build([() => jsonResponse({ ok: true })]);

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).resolves.toEqual({ ok: true });
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.init.body).toBeUndefined();
  });

  it('sérialise le corps et les en-têtes', async () => {
    const { client, calls } = build([() => jsonResponse({})]);

    await client.requestJson({
      url: 'https://api.test/x',
      method: 'GET',
      headers: { authorization: 'Bearer k' },
      body: { a: 1 },
      provider: 'test',
    });

    const init = calls[0]?.init;
    expect(init?.body).toBe(JSON.stringify({ a: 1 }));
    expect((init?.headers as Record<string, string>).authorization).toBe('Bearer k');
    expect((init?.headers as Record<string, string>)['content-type']).toBe('application/json');
  });

  it('réessaie une erreur 500 puis réussit', async () => {
    const { client, calls, slept } = build([
      () => jsonResponse({ error: { message: 'boom' } }, 500),
      () => jsonResponse({ ok: true }),
    ]);

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(slept).toHaveLength(1);
  });

  it('ne réessaie jamais une erreur 401', async () => {
    const { client, calls } = build([
      () => jsonResponse({ error: { message: 'clé invalide' } }, 401),
    ]);

    const error = await client
      .requestJson({ url: 'https://api.test/x', provider: 'test' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).status).toBe(401);
    expect((error as ProviderError).message).toContain('clé invalide');
    expect(calls).toHaveLength(1);
  });

  it('épuise les tentatives et renvoie la dernière erreur', async () => {
    const { client, calls } = build([() => jsonResponse({ error: { message: 'panne' } }, 503)], {
      retries: 2,
    });

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).rejects.toThrow(/panne/);
    expect(calls).toHaveLength(3);
  });

  it('traduit un 429 en RateLimitError après épuisement', async () => {
    const { client } = build(
      [() => jsonResponse({ error: { message: 'rate limit' } }, 429, { 'retry-after': '2' })],
      { retries: 1 },
    );

    const error = await client
      .requestJson({ url: 'https://api.test/x', provider: 'test' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfterMs).toBe(2000);
  });

  it('respecte Retry-After exprimé en secondes', async () => {
    const { client, slept } = build([
      () => jsonResponse({}, 429, { 'retry-after': '1' }),
      () => jsonResponse({ ok: true }),
    ]);

    await client.requestJson({ url: 'https://api.test/x', provider: 'test' });

    expect(slept[0]).toBe(1000);
  });

  it('respecte Retry-After exprimé en date HTTP', async () => {
    const now = Date.parse('2026-10-22T10:00:00.000Z');
    const retryAt = new Date(now + 3000).toUTCString();
    const { client, slept } = build(
      [() => jsonResponse({}, 429, { 'retry-after': retryAt }), () => jsonResponse({ ok: true })],
      { now: () => now },
    );

    await client.requestJson({ url: 'https://api.test/x', provider: 'test' });

    expect(slept[0]).toBe(3000);
  });

  it('ignore un Retry-After illisible', async () => {
    const { client, slept } = build([
      () => jsonResponse({}, 429, { 'retry-after': 'bientôt' }),
      () => jsonResponse({ ok: true }),
    ]);

    await client.requestJson({ url: 'https://api.test/x', provider: 'test' });

    expect(slept[0]).toBeGreaterThanOrEqual(1);
  });

  it('plafonne l’attente entre deux tentatives', async () => {
    const { client, slept } = build(
      [() => jsonResponse({}, 429, { 'retry-after': '600' }), () => jsonResponse({ ok: true })],
      { maxDelayMs: 5000 },
    );

    await client.requestJson({ url: 'https://api.test/x', provider: 'test' });

    expect(slept[0]).toBe(5000);
  });

  it('réessaie après une erreur réseau', async () => {
    const { client, calls } = build([
      () => {
        throw new Error('ECONNRESET');
      },
      () => jsonResponse({ ok: true }),
    ]);

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(2);
  });

  it('traduit un abandon (délai dépassé) en erreur explicite', async () => {
    const { client } = build(
      [
        () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          throw error;
        },
      ],
      { retries: 0 },
    );

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test', body: {} }),
    ).rejects.toThrow(/délai de 30000 ms dépassé/);
  });

  it('refuse une réponse non JSON sans réessayer', async () => {
    const { client, calls } = build([() => new Response('<html>erreur</html>', { status: 200 })]);

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).rejects.toThrow(/JSON illisible/);
    expect(calls).toHaveLength(1);
  });

  it('extrait le message d’erreur et rédige les secrets', async () => {
    // Valeur assemblée à l'exécution : écrite d'un seul tenant, elle déclencherait
    // la règle « generic-api-key » de Gitleaks dans la CI.
    const fakeKey = ['sk', 'secret', '1234567890'].join('-');
    const { client } = build(
      [() => jsonResponse({ error: { message: `clé ${fakeKey} refusée` } }, 400)],
      { redact: (text) => text.replace(fakeKey, '***') },
    );

    const error = await client
      .requestJson({ url: 'https://api.test/x', provider: 'test' })
      .catch((caught: unknown) => caught);

    expect((error as Error).message).toContain('*** refusée');
    expect((error as Error).message).not.toContain(fakeKey);
  });

  it('compacte un corps non JSON volumineux', async () => {
    const { client } = build([() => new Response('ligne1\n\nligne2   ', { status: 400 })]);

    const error = await client
      .requestJson({ url: 'https://api.test/x', provider: 'test' })
      .catch((caught: unknown) => caught);

    expect((error as Error).message).toContain('ligne1 ligne2');
  });

  it('gère un corps d’erreur vide', async () => {
    const { client } = build([() => new Response('', { status: 400 })]);

    const error = await client
      .requestJson({ url: 'https://api.test/x', provider: 'test' })
      .catch((caught: unknown) => caught);

    expect((error as Error).message).toContain('réponse vide');
  });
});

describe('aggregateFailure', () => {
  it('agrège les causes de chaque fournisseur', () => {
    const error = aggregateFailure('chat', [
      { provider: 'openai', error: new Error('401') },
      { provider: 'gemini', error: 'texte brut' },
    ]);

    expect(error.code).toBe('PROVIDER_UNAVAILABLE');
    expect(error.message).toContain('openai: 401');
    expect(error.message).toContain('gemini: inconnu');
    // La dernière cause n'est pas une `Error` : elle n'est pas conservée.
    expect(error.cause).toBeUndefined();
  });

  it('conserve la dernière cause quand c’est une erreur', () => {
    const last = new Error('délai dépassé');
    const error = aggregateFailure('embedding', [{ provider: 'novita', error: last }]);

    expect(error.cause).toBe(last);
  });

  it('fonctionne sans cause', () => {
    const error = aggregateFailure('sandbox', []);

    expect(error.message).toContain('Aucun fournisseur disponible pour « sandbox »');
    expect(error.cause).toBeUndefined();
  });
});

describe('HttpClient — paramètres par défaut', () => {
  it('utilise les valeurs par défaut sans option', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: 1 }));
    const client = new HttpClient({ fetch });

    await expect(
      client.requestJson({ url: 'https://api.test/x', provider: 'test' }),
    ).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
