import { describe, expect, it } from 'vitest';

import {
  alignToSchema,
  chatOpenAiCompatible,
  embedOpenAiCompatible,
  fetchSofya,
  searchSerper,
  searchSerpApi,
  searchSofya,
  searchTavily,
} from '../../src/business/providers/adapters.js';
import type { HttpClient } from '../../src/business/providers/http.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingsError, ProviderError } from '../../src/shared/errors.js';
import { getProvider } from '../../src/shared/providers/catalog.js';
import type { ResolvedRoute } from '../../src/shared/providers/types.js';

interface Captured {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  method: string;
}

/** Client HTTP factice : renvoie une réponse fixe et capture la requête. */
function fakeClient(response: unknown): { client: HttpClient; captured: Captured[] } {
  const captured: Captured[] = [];

  const client = {
    requestJson: async (request: {
      url: string;
      headers?: Record<string, string>;
      body?: unknown;
      method?: string;
    }) => {
      captured.push({
        url: request.url,
        headers: request.headers ?? {},
        body: request.body,
        method: request.method ?? 'POST',
      });

      return response;
    },
  } as unknown as HttpClient;

  return { client, captured };
}

const route = (providerId: Parameters<typeof getProvider>[0], model: string): ResolvedRoute => ({
  provider: getProvider(providerId),
  model,
  keys: ['k'],
});

describe('embedOpenAiCompatible', () => {
  it('poste sur /embeddings avec le modèle et les textes', async () => {
    const { client, captured } = fakeClient({
      data: [
        { index: 0, embedding: [0.1, 0.2] },
        { index: 1, embedding: [0.3, 0.4] },
      ],
    });

    const vectors = await embedOpenAiCompatible(
      client,
      route('openai', 'text-embedding-3-small'),
      'sk-1',
      ['a', 'b'],
    );

    expect(vectors).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(captured[0]?.url).toBe('https://api.openai.com/v1/embeddings');
    expect(captured[0]?.headers.authorization).toBe('Bearer sk-1');
    expect(captured[0]?.body).toEqual({ model: 'text-embedding-3-small', input: ['a', 'b'] });
  });

  it('n’envoie pas de dimension pour un modèle natif 1536', async () => {
    const { client, captured } = fakeClient({ data: [{ index: 0, embedding: [1] }] });

    await embedOpenAiCompatible(client, route('openai', 'text-embedding-3-small'), 'k', ['a']);

    expect(captured[0]?.body).not.toHaveProperty('dimensions');
  });

  it('demande 1536 dimensions pour un modèle plus large', async () => {
    const { client, captured } = fakeClient({ data: [{ index: 0, embedding: [1] }] });

    await embedOpenAiCompatible(
      client,
      { ...route('gemini', 'gemini-embedding-001'), nativeDimensions: 3072 },
      'k',
      ['a'],
    );

    expect(captured[0]?.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/embeddings',
    );
    expect(captured[0]?.body).toMatchObject({ dimensions: EMBEDDING_DIMENSIONS });
  });

  it('transmet les en-têtes du fournisseur (OpenRouter)', async () => {
    const { client, captured } = fakeClient({ data: [{ index: 0, embedding: [1] }] });

    await embedOpenAiCompatible(
      client,
      route('openrouter', 'openai/text-embedding-3-small'),
      'or-1',
      ['a'],
    );

    expect(captured[0]?.headers['HTTP-Referer']).toContain('github.com');
    expect(captured[0]?.headers['X-Title']).toBe('EKTS');
  });

  it('réordonne les vecteurs par index', async () => {
    const { client } = fakeClient({
      data: [
        { index: 1, embedding: [2] },
        { index: 0, embedding: [1] },
      ],
    });

    const vectors = await embedOpenAiCompatible(client, route('openai', 'm'), 'k', ['a', 'b']);

    expect(vectors).toEqual([[1], [2]]);
  });

  it('refuse un nombre de vecteurs incohérent', async () => {
    const { client } = fakeClient({ data: [{ index: 0, embedding: [1] }] });

    await expect(
      embedOpenAiCompatible(client, route('openai', 'm'), 'k', ['a', 'b']),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('refuse une réponse sans tableau de données', async () => {
    const { client } = fakeClient({});

    await expect(embedOpenAiCompatible(client, route('openai', 'm'), 'k', ['a'])).rejects.toThrow(
      /0 vecteur\(s\) reçu\(s\) pour 1/,
    );
  });

  it('refuse un vecteur malformé', async () => {
    const { client } = fakeClient({ data: [{ index: 0, embedding: ['x'] }] });

    await expect(embedOpenAiCompatible(client, route('openai', 'm'), 'k', ['a'])).rejects.toThrow(
      /vecteur 0 malformé/,
    );
  });
});

describe('chatOpenAiCompatible', () => {
  it('poste les messages et renvoie le contenu', async () => {
    const { client, captured } = fakeClient({ choices: [{ message: { content: 'Bonjour' } }] });

    const text = await chatOpenAiCompatible(
      client,
      route('deepseek', 'deepseek-chat'),
      'ds-1',
      [{ role: 'user', content: 'salut' }],
      { temperature: 0, maxTokens: 16 },
    );

    expect(text).toBe('Bonjour');
    expect(captured[0]?.url).toBe('https://api.deepseek.com/chat/completions');
    expect(captured[0]?.body).toEqual({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'salut' }],
      temperature: 0,
      max_tokens: 16,
    });
  });

  it('applique la température par défaut', async () => {
    const { client, captured } = fakeClient({ choices: [{ message: { content: 'ok' } }] });

    await chatOpenAiCompatible(client, route('zai', 'glm-4.6'), 'k', [
      { role: 'user', content: 'x' },
    ]);

    expect(captured[0]?.body).toMatchObject({ temperature: 0.2 });
    expect(captured[0]?.body).not.toHaveProperty('max_tokens');
  });

  it('refuse une réponse vide', async () => {
    const { client } = fakeClient({ choices: [{ message: { content: '   ' } }] });

    await expect(
      chatOpenAiCompatible(client, route('zai', 'glm-4.6'), 'k', [{ role: 'user', content: 'x' }]),
    ).rejects.toThrow(/complétion vide/);
  });

  it('refuse une réponse sans choix', async () => {
    const { client } = fakeClient({});

    await expect(
      chatOpenAiCompatible(client, route('zai', 'glm-4.6'), 'k', [{ role: 'user', content: 'x' }]),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});

describe('recherche web', () => {
  it('normalise les résultats Tavily', async () => {
    const { client, captured } = fakeClient({
      results: [{ title: 'T', url: 'https://a.test', content: 'extrait', score: 0.9 }],
    });

    const results = await searchTavily(client, route('tavily', ''), 'tvly-1', 'sqlite', 3);

    expect(results).toEqual([
      { title: 'T', url: 'https://a.test', snippet: 'extrait', score: 0.9 },
    ]);
    expect(captured[0]?.url).toBe('https://api.tavily.com/search');
    expect(captured[0]?.headers.authorization).toBe('Bearer tvly-1');
    expect(captured[0]?.body).toMatchObject({ query: 'sqlite', max_results: 3 });
  });

  it('tolère des champs Tavily absents', async () => {
    const { client } = fakeClient({ results: [{ score: 'haut' }] });

    await expect(searchTavily(client, route('tavily', ''), 'k', 'q', 1)).resolves.toEqual([
      { title: '', url: '', snippet: '' },
    ]);
  });

  it('normalise les résultats Serper', async () => {
    const { client, captured } = fakeClient({
      organic: [{ title: 'T', link: 'https://b.test', snippet: 's', position: 1 }],
    });

    const results = await searchSerper(client, route('serper', ''), 's-1', 'rrf', 2);

    expect(results).toEqual([{ title: 'T', url: 'https://b.test', snippet: 's' }]);
    expect(captured[0]?.headers['x-api-key']).toBe('s-1');
    expect(captured[0]?.body).toEqual({ q: 'rrf', num: 2 });
  });

  it('normalise les résultats SerpApi et place la clé en paramètre', async () => {
    const { client, captured } = fakeClient({
      organic_results: [{ title: 'T', link: 'https://c.test', snippet: 's' }],
    });

    const results = await searchSerpApi(client, route('serpapi', ''), 'serp-1', 'bm25', 4);

    const url = new URL(captured[0]?.url ?? '');
    expect(url.searchParams.get('api_key')).toBe('serp-1');
    expect(url.searchParams.get('q')).toBe('bm25');
    expect(url.searchParams.get('num')).toBe('4');
    expect(captured[0]?.method).toBe('GET');
    expect(results).toEqual([{ title: 'T', url: 'https://c.test', snippet: 's' }]);
  });

  it('renvoie un tableau vide sans résultat', async () => {
    const { client } = fakeClient({});

    await expect(searchTavily(client, route('tavily', ''), 'k', 'q', 1)).resolves.toEqual([]);
    await expect(searchSerper(client, route('serper', ''), 'k', 'q', 1)).resolves.toEqual([]);
    await expect(searchSerpApi(client, route('serpapi', ''), 'k', 'q', 1)).resolves.toEqual([]);
    await expect(searchSofya(client, route('sofya', ''), 'k', 'q', 1)).resolves.toEqual([]);
  });

  it('normalise les résultats Sofya (contenu extrait, pas seulement un extrait)', async () => {
    const { client, captured } = fakeClient({
      results: [
        {
          title: 'T',
          url: 'https://d.test',
          content: 'contenu complet de la page',
          description: 'résumé',
          published_date: '2026-10-01',
        },
        { title: 'Sans contenu', url: 'https://e.test', description: 'résumé seul' },
      ],
    });

    const results = await searchSofya(client, route('sofya', ''), 'ay_live_1', 'rag', 5);

    expect(results).toEqual([
      { title: 'T', url: 'https://d.test', snippet: 'contenu complet de la page' },
      { title: 'Sans contenu', url: 'https://e.test', snippet: 'résumé seul' },
    ]);
    expect(captured[0]?.url).toBe('https://sofya.co/v1/search');
    expect(captured[0]?.headers.authorization).toBe('Bearer ay_live_1');
    expect(captured[0]?.body).toEqual({
      query: 'rag',
      max_results: 5,
      search_depth: 'basic',
      include_answer: false,
    });
  });
});

describe('lecture d’URL (Sofya)', () => {
  it('convertit les pages en markdown et conserve les métadonnées', async () => {
    const { client, captured } = fakeClient({
      results: [
        {
          title: 'Doc',
          url: 'https://f.test',
          content: '# Titre\n\ntexte',
          success: true,
          published_time: '2026-09-30',
        },
      ],
    });

    const pages = await fetchSofya(client, route('sofya', ''), 'ay_live_2', ['https://f.test']);

    expect(pages).toEqual([
      {
        title: 'Doc',
        url: 'https://f.test',
        content: '# Titre\n\ntexte',
        success: true,
        publishedTime: '2026-09-30',
      },
    ]);
    expect(captured[0]?.url).toBe('https://sofya.co/v1/fetch');
    expect(captured[0]?.body).toEqual({ urls: ['https://f.test'] });
  });

  it('reporte un échec partiel au lieu de le masquer', async () => {
    const { client } = fakeClient({
      results: [
        { title: 'OK', url: 'https://g.test', content: 'texte', success: true },
        { url: 'https://h.test', success: false, error: 'HTTP 404' },
        // `error` seul suffit à marquer l'échec, même sans `success: false`.
        { url: 'https://i.test', content: '', error: 'page protégée' },
      ],
    });

    const pages = await fetchSofya(client, route('sofya', ''), 'k', [
      'https://g.test',
      'https://h.test',
      'https://i.test',
    ]);

    expect(pages.map((page) => page.success)).toEqual([true, false, false]);
    expect(pages[1]?.error).toBe('HTTP 404');
    expect(pages[2]?.error).toBe('page protégée');
  });

  it('échoue explicitement quand aucune page n’est renvoyée', async () => {
    const { client } = fakeClient({ results: [] });

    await expect(fetchSofya(client, route('sofya', ''), 'k', ['https://j.test'])).rejects.toThrow(
      ProviderError,
    );
    await expect(fetchSofya(client, route('sofya', ''), 'k', ['https://j.test'])).rejects.toThrow(
      /aucune page renvoyée/,
    );
  });
});

describe('alignToSchema', () => {
  it('laisse un vecteur 1536 intact', () => {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0.5);

    expect(alignToSchema(vector)).toEqual(vector);
  });

  it('complète un vecteur 1024 par des zéros (cosinus préservé)', () => {
    const vector = new Array<number>(1024).fill(0).map((_, index) => (index % 7) - 3);
    const aligned = alignToSchema(vector);

    expect(aligned).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(aligned.slice(0, 1024)).toEqual(vector);
    expect(aligned.slice(1024).every((value) => value === 0)).toBe(true);

    const dot = (a: number[], b: number[]): number =>
      a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
    const norm = (a: number[]): number => Math.sqrt(dot(a, a));

    const cosineRaw = dot(vector, vector) / (norm(vector) * norm(vector));
    const cosineAligned = dot(aligned, aligned) / (norm(aligned) * norm(aligned));

    expect(cosineAligned).toBeCloseTo(cosineRaw, 12);
  });

  it('refuse un vecteur plus long que le schéma plutôt que de le tronquer', () => {
    const vector = new Array<number>(3072).fill(0.1);

    expect(() => alignToSchema(vector)).toThrow(EmbeddingsError);
    expect(() => alignToSchema(vector)).toThrow(/plutôt que de tronquer/);
  });

  it('ne partage pas la référence du tableau source', () => {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0.5);
    const aligned = alignToSchema(vector);

    aligned[0] = 99;

    expect(vector[0]).toBe(0.5);
  });
});
