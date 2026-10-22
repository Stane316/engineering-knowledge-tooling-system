import { describe, expect, it } from 'vitest';

import { ProviderGateway, createProviderGateway } from '../../src/business/providers/gateway.js';
import { ProviderHealth } from '../../src/business/providers/health.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { NoProviderAvailableError, ProviderError } from '../../src/shared/errors.js';
import { loadKeyring } from '../../src/shared/providers/env.js';

interface ScriptedCall {
  url: string;
  authorization: string;
  body: Record<string, unknown>;
}

type Responder = (call: ScriptedCall) => Response;

/** `fetch` scripté : enregistre les appels et délègue la réponse. */
function scriptedFetch(responder: Responder): {
  fetch: typeof globalThis.fetch;
  calls: ScriptedCall[];
} {
  const calls: ScriptedCall[] = [];

  const fakeFetch = async (input: string, init: RequestInit): Promise<Response> => {
    const headers = new Headers(init.headers);
    const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>;

    const call: ScriptedCall = {
      url: input,
      authorization: headers.get('authorization') ?? '',
      body,
    };

    calls.push(call);
    return responder(call);
  };

  return { fetch: fakeFetch as unknown as typeof globalThis.fetch, calls };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const embeddingBody = (count: number, dimension = EMBEDDING_DIMENSIONS): unknown => ({
  data: Array.from({ length: count }, (_, index) => ({
    index,
    embedding: new Array<number>(dimension).fill(0.01),
  })),
});

const gateway = (
  env: NodeJS.ProcessEnv,
  responder: Responder,
  options: Partial<ConstructorParameters<typeof ProviderGateway>[0]> = {},
): { gateway: ProviderGateway; calls: ScriptedCall[] } => {
  const { fetch, calls } = scriptedFetch(responder);

  return {
    gateway: new ProviderGateway({
      keyring: loadKeyring(env),
      env,
      fetch,
      sleep: async () => undefined,
      ...options,
    }),
    calls,
  };
};

describe('ProviderGateway — embeddings', () => {
  it('interroge le premier fournisseur disponible', async () => {
    const { gateway: gw, calls } = gateway({ OPENAI_API_KEY: 'sk-1' }, () =>
      json(embeddingBody(2)),
    );

    const outcome = await gw.embed(['a', 'b']);

    expect(outcome.vectors).toHaveLength(2);
    expect(outcome.trace.provider).toBe('openai');
    expect(outcome.trace.model).toBe('text-embedding-3-small');
    expect(outcome.trace.space).toBe('openai/text-embedding-3-small');
    expect(calls[0]?.url).toBe('https://api.openai.com/v1/embeddings');
  });

  it('ne fait aucun appel pour une liste vide', async () => {
    const { gateway: gw, calls } = gateway({ OPENAI_API_KEY: 'sk-1' }, () =>
      json(embeddingBody(1)),
    );

    await expect(gw.embed([])).resolves.toMatchObject({ vectors: [] });
    expect(calls).toEqual([]);
  });

  it('ne bascule jamais vers un autre espace d’embedding', async () => {
    const { gateway: gw, calls } = gateway({ OPENAI_API_KEY: 'sk-1', GEMINI_API_KEY: 'g-1' }, () =>
      json({ error: { message: 'clé révoquée' } }, 401),
    );

    const error = await gw.embed(['a']).catch((caught: unknown) => caught);

    // Gemini est configuré, mais sert un autre espace : il n'est pas candidat.
    expect(error).toBeInstanceOf(NoProviderAvailableError);
    expect((error as Error).message).not.toContain('gemini');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://api.openai.com/v1/embeddings');
  });

  it('bascule vers un fournisseur du même espace', async () => {
    const { gateway: gw, calls } = gateway(
      { OPENAI_API_KEY: 'sk-1', OPENROUTER_API_KEY: 'or-1' },
      (call) =>
        call.url.includes('openai.com')
          ? json({ error: { message: 'clé révoquée' } }, 401)
          : json(embeddingBody(1)),
    );

    const outcome = await gw.embed(['a']);

    expect(outcome.trace.provider).toBe('openrouter');
    expect(outcome.trace.attempts).toBe(1);
    expect(outcome.trace.space).toBe('openai/text-embedding-3-small');
    expect(calls).toHaveLength(2);
  });

  it('n’utilise un autre espace que si le premier est absent', async () => {
    const { gateway: gw } = gateway({ GEMINI_API_KEY: 'g-1' }, () => json(embeddingBody(1, 1536)));

    const outcome = await gw.embed(['a']);

    expect(outcome.trace.space).toBe('google/gemini-embedding-001');
  });

  it('respecte un espace imposé', async () => {
    const { gateway: gw, calls } = gateway(
      { OPENAI_API_KEY: 'sk-1', NOVITA_API_KEY: 'n-1' },
      () => json(embeddingBody(1, 1024)),
      { space: 'baai/bge-m3' },
    );

    const outcome = await gw.embed(['a']);

    expect(outcome.trace.space).toBe('baai/bge-m3');
    expect(calls[0]?.url).toBe('https://api.novita.ai/openai/embeddings');
  });

  it('complète un vecteur plus court à 1536 dimensions', async () => {
    const { gateway: gw } = gateway({ NOVITA_API_KEY: 'n-1' }, () => json(embeddingBody(1, 1024)), {
      space: 'baai/bge-m3',
    });

    const outcome = await gw.embed(['a']);

    expect(outcome.vectors[0]).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it('fait tourner les clés d’un même fournisseur', async () => {
    const { gateway: gw, calls } = gateway(
      { OPENAI_API_KEY: 'sk-1', OPENAI_API_KEY_2: 'sk-2' },
      () => json(embeddingBody(1)),
    );

    await gw.embed(['a']);
    await gw.embed(['b']);
    await gw.embed(['c']);

    expect(calls.map((call) => call.authorization)).toEqual([
      'Bearer sk-1',
      'Bearer sk-2',
      'Bearer sk-1',
    ]);
  });

  it('réessaie avec la clé suivante quand la première est refusée', async () => {
    const { gateway: gw, calls } = gateway(
      { OPENAI_API_KEY: 'sk-mauvaise', OPENAI_API_KEY_2: 'sk-bonne' },
      (call) =>
        call.authorization === 'Bearer sk-mauvaise'
          ? json({ error: { message: 'invalid api key' } }, 401)
          : json(embeddingBody(1)),
      { retries: 0 },
    );

    const outcome = await gw.embed(['a']);

    expect(outcome.trace.provider).toBe('openai');
    expect(calls).toHaveLength(2);
  });

  it('échoue explicitement quand aucune clé n’est configurée', async () => {
    const { gateway: gw } = gateway({}, () => json(embeddingBody(1)));

    const error = await gw.embed(['a']).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NoProviderAvailableError);
    expect((error as Error).message).toContain('OPENAI_API_KEY');
    expect((error as Error).message).toContain('npm run providers');
  });

  it('ouvre le disjoncteur après trois échecs et relègue le fournisseur', async () => {
    const health = new ProviderHealth();
    const { gateway: gw } = gateway(
      { OPENAI_API_KEY: 'sk-1', NOVITA_API_KEY: 'n-1' },
      () => json({ error: { message: 'indisponible' } }, 500),
      { health, retries: 0 },
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(gw.embed(['a'])).rejects.toBeInstanceOf(NoProviderAvailableError);
    }

    expect(health.isOpen('openai')).toBe(true);
  });

  it('refuse une réponse hors schéma non alignable', async () => {
    const { gateway: gw } = gateway({ OPENAI_API_KEY: 'sk-1' }, () =>
      json({ data: [{ index: 0, embedding: new Array<number>(4096).fill(0.1) }] }),
    );

    await expect(gw.embed(['a'])).rejects.toBeInstanceOf(NoProviderAvailableError);
  });
});

describe('ProviderGateway — chat et recherche', () => {
  it('renvoie le texte de complétion et sa trace', async () => {
    const { gateway: gw, calls } = gateway({ DEEPSEEK_API_KEY: 'ds-1' }, () =>
      json({ choices: [{ message: { content: 'réponse' } }] }),
    );

    const outcome = await gw.chat([{ role: 'user', content: 'salut' }]);

    expect(outcome.text).toBe('réponse');
    expect(outcome.trace.provider).toBe('deepseek');
    expect(calls[0]?.url).toBe('https://api.deepseek.com/chat/completions');
  });

  it('normalise une recherche Tavily', async () => {
    const { gateway: gw } = gateway({ TAVILY_API_KEY: 'tvly-1' }, () =>
      json({ results: [{ title: 'T', url: 'https://a.test', content: 'extrait' }] }),
    );

    const outcome = await gw.search('sqlite', 3);

    expect(outcome.results).toEqual([{ title: 'T', url: 'https://a.test', snippet: 'extrait' }]);
    expect(outcome.trace.provider).toBe('tavily');
  });

  it('bascule de Tavily vers Serper', async () => {
    const { gateway: gw } = gateway({ TAVILY_API_KEY: 'tvly-1', SERPER_API_KEY: 's-1' }, (call) =>
      call.url.includes('tavily')
        ? json({ error: { message: 'quota' } }, 403)
        : json({ organic: [{ title: 'T', link: 'https://b.test', snippet: 's' }] }),
    );

    const outcome = await gw.search('rrf', 2);

    expect(outcome.trace.provider).toBe('serper');
    expect(outcome.trace.attempts).toBe(1);
  });

  it('accepte SerpApi comme dernier recours', async () => {
    const { gateway: gw } = gateway({ SERPAPI_API_KEY: 'serp-1' }, () =>
      json({ organic_results: [{ title: 'T', link: 'https://c.test', snippet: 's' }] }),
    );

    const outcome = await gw.search('bm25');

    expect(outcome.trace.provider).toBe('serpapi');
  });

  it('refuse un protocole de recherche inconnu sans planter', async () => {
    const { gateway: gw } = gateway({ TAVILY_API_KEY: 'k' }, () => json({}));
    const route = {
      provider: { ...gw.plan('web-search')[0]?.provider, protocol: 'e2b' as const },
      model: '',
      keys: ['k'],
    };

    await expect(
      (gw as unknown as { searchWith: (...args: unknown[]) => Promise<unknown> }).searchWith(
        route,
        'k',
        'q',
        1,
      ),
    ).rejects.toThrow(/protocole de recherche non géré/);
  });
});

describe('ProviderGateway — configuration', () => {
  it('charge .env quand aucun env n’est injecté', () => {
    // Aucune assertion sur le contenu : on vérifie seulement que la fabrique ne
    // lève pas et qu'elle construit une passerelle.
    expect(createProviderGateway({ fetch: globalThis.fetch })).toBeInstanceOf(ProviderGateway);
  });

  it('refuse une politique de routage inconnue', () => {
    expect(() => createProviderGateway({ env: { EKTS_PROVIDER_POLICY: 'magique' } })).toThrow(
      /EKTS_PROVIDER_POLICY invalide/,
    );
  });

  it('accepte une politique valide et un espace imposé', () => {
    const gateway = createProviderGateway({
      env: { EKTS_PROVIDER_POLICY: 'free', EKTS_EMBEDDING_SPACE: 'baai/bge-m3' },
    });

    expect(gateway.plan('embedding')).toEqual([]);
  });

  it('ignore une politique vide', () => {
    expect(() =>
      createProviderGateway({ env: { EKTS_PROVIDER_POLICY: '  ', EKTS_EMBEDDING_SPACE: ' ' } }),
    ).not.toThrow();
  });

  it('compte les fournisseurs disponibles par capacité', () => {
    const { gateway: gw } = gateway({ OPENAI_API_KEY: 'sk-1', TAVILY_API_KEY: 't-1' }, () =>
      json({}),
    );

    expect(gw.available('embedding')).toBeGreaterThan(0);
    expect(gw.available('sandbox')).toBe(0);
  });

  it('expose la chaîne planifiée', () => {
    const { gateway: gw } = gateway({ OPENAI_API_KEY: 'sk-1', GEMINI_API_KEY: 'g-1' }, () =>
      json({}),
    );

    const chain = gw.plan('chat');

    expect(chain.length).toBeGreaterThan(0);
    expect(chain[0]?.provider.id).toBe('openai');
  });

  it('agrège les échecs avec le nom de la clé utilisée', async () => {
    const { gateway: gw } = gateway(
      { OPENAI_API_KEY: 'sk-1' },
      () => json({ error: { message: 'boom' } }, 500),
      { retries: 0 },
    );

    const error = await gw.embed(['a']).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NoProviderAvailableError);
    expect((error as Error).message).toContain('openai#1');
    expect((error as ProviderError).code).toBe('PROVIDER_UNAVAILABLE');
  });
});
