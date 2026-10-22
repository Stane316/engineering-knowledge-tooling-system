import { describe, expect, it } from 'vitest';

import { createEmbeddingsService } from '../../src/business/embeddings.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingsError } from '../../src/shared/errors.js';

/**
 * Vérifie l'intégration au SDK `openai` **sans réseau ni clé réelle**.
 *
 * Le `fetch` est injecté dans le client : la requête HTTP est construite par le
 * vrai SDK (URL, en-têtes, sérialisation) puis interceptée, ce qui valide le
 * contrat d'appel — ce qu'un simple mock de `client.embeddings.create` ne
 * ferait pas.
 */
describe('OpenAIEmbeddingProvider (HTTP intercepté)', () => {
  interface CapturedRequest {
    url: string;
    method: string;
    authorization: string | null;
    body: { model?: string; input?: string[]; dimensions?: number };
  }

  const installFakeFetch = (
    responder: (body: CapturedRequest['body']) => Response,
  ): { requests: CapturedRequest[]; fetch: typeof globalThis.fetch } => {
    const requests: CapturedRequest[] = [];

    const fakeFetch = async (
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      const url = input instanceof Request ? input.url : String(input);
      const headers = new Headers(init?.headers);
      const body = JSON.parse(String(init?.body ?? '{}')) as CapturedRequest['body'];

      requests.push({
        url,
        method: init?.method ?? 'GET',
        authorization: headers.get('authorization'),
        body,
      });

      return responder(body);
    };

    return { requests, fetch: fakeFetch as typeof globalThis.fetch };
  };

  const embeddingResponse = (count: number): Response =>
    new Response(
      JSON.stringify({
        object: 'list',
        data: Array.from({ length: count }, (_, index) => ({
          object: 'embedding',
          index,
          embedding: new Array<number>(EMBEDDING_DIMENSIONS).fill(0.01 * (index + 1)),
        })),
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 3, total_tokens: 3 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );

  it('appelle POST /v1/embeddings avec le modèle, les textes et la dimension', async () => {
    const { requests, fetch } = installFakeFetch(() => embeddingResponse(2));
    const service = createEmbeddingsService({
      env: { OPENAI_API_KEY: 'sk-test-contrat' },
      fetch,
    });

    const vectors = await service.embedBatch(['sqlite', 'bm25']);

    expect(vectors).toHaveLength(2);
    expect(vectors[0]?.[0]).toBeCloseTo(0.01, 6);
    expect(vectors[1]?.[0]).toBeCloseTo(0.02, 6);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe('https://api.openai.com/v1/embeddings');
    expect(requests[0]?.method).toBe('POST');
    expect(requests[0]?.authorization).toBe('Bearer sk-test-contrat');
    expect(requests[0]?.body).toMatchObject({
      model: 'text-embedding-3-small',
      input: ['sqlite', 'bm25'],
      dimensions: EMBEDDING_DIMENSIONS,
    });
  });

  it('respecte OPENAI_EMBEDDING_MODEL', async () => {
    const { requests, fetch } = installFakeFetch(() => embeddingResponse(1));
    const service = createEmbeddingsService({
      env: { OPENAI_API_KEY: 'sk-test-contrat', OPENAI_EMBEDDING_MODEL: 'text-embedding-3-large' },
      fetch,
    });

    await service.embed('sqlite');

    expect(requests[0]?.body.model).toBe('text-embedding-3-large');
  });

  it('convertit une erreur HTTP en EmbeddingsError', async () => {
    const { fetch } = installFakeFetch(
      () =>
        new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const service = createEmbeddingsService({ env: { OPENAI_API_KEY: 'sk-invalide' }, fetch });

    const error = await service.embed('sqlite').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmbeddingsError);
    expect((error as EmbeddingsError).code).toBe('EMBEDDINGS_FAILED');
    expect((error as Error).message).toContain('401');
  });

  it('refuse une réponse au format inattendu', async () => {
    const { fetch } = installFakeFetch(
      () =>
        new Response(JSON.stringify({ object: 'list', data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const service = createEmbeddingsService({ env: { OPENAI_API_KEY: 'sk-test' }, fetch });

    await expect(service.embed('sqlite')).rejects.toBeInstanceOf(EmbeddingsError);
  });
});
