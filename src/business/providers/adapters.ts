import { EMBEDDING_DIMENSIONS } from '../../shared/constants.js';
import { EmbeddingsError, ProviderError } from '../../shared/errors.js';
import type { ChatMessage, ResolvedRoute, WebSearchResult } from '../../shared/providers/types.js';
import type { HttpClient } from './http.js';

/** Réponse d'embedding au format OpenAI. */
interface EmbeddingResponse {
  data?: { embedding?: unknown; index?: unknown }[];
}

interface ChatResponse {
  choices?: { message?: { content?: unknown } }[];
}

interface TavilyResponse {
  results?: { title?: unknown; url?: unknown; content?: unknown; score?: unknown }[];
}

interface SerperResponse {
  organic?: { title?: unknown; link?: unknown; snippet?: unknown; position?: unknown }[];
}

interface SerpApiResponse {
  organic_results?: { title?: unknown; link?: unknown; snippet?: unknown; position?: unknown }[];
}

/** En-tête d'authentification standard. */
const bearer = (key: string): Record<string, string> => ({ authorization: `Bearer ${key}` });

/** Ne garde que les chaînes non vides. */
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Embeddings via une surface compatible OpenAI (`POST /embeddings`).
 *
 * Couvre OpenAI, OpenRouter, Gemini (endpoint `openai/`), Novita et — si un jour
 * activé — tout autre fournisseur du même protocole. `dimensions` n'est envoyé
 * que si le modèle natif dépasse le schéma : inutile d'alourdir les requêtes
 * pour les modèles déjà en 1536.
 */
export async function embedOpenAiCompatible(
  http: HttpClient,
  route: ResolvedRoute,
  key: string,
  texts: readonly string[],
): Promise<number[][]> {
  const response = await http.requestJson<EmbeddingResponse>({
    url: `${route.provider.baseUrl}/embeddings`,
    headers: { ...bearer(key), ...route.provider.headers },
    provider: route.provider.id,
    body: {
      model: route.model,
      input: [...texts],
      ...(route.nativeDimensions !== undefined && route.nativeDimensions > EMBEDDING_DIMENSIONS
        ? { dimensions: EMBEDDING_DIMENSIONS }
        : {}),
      ...route.provider.embeddingExtra,
    },
  });

  const items = response.data;

  if (!Array.isArray(items) || items.length !== texts.length) {
    throw new ProviderError(
      route.provider.id,
      `${String(items?.length ?? 0)} vecteur(s) reçu(s) pour ${String(texts.length)} texte(s)`,
    );
  }

  return [...items]
    .sort((left, right) => Number(left.index ?? 0) - Number(right.index ?? 0))
    .map((item, position) => {
      if (
        !Array.isArray(item.embedding) ||
        !item.embedding.every((value) => typeof value === 'number')
      ) {
        throw new ProviderError(route.provider.id, `vecteur ${String(position)} malformé`);
      }

      return item.embedding as number[];
    });
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

/** Complétion via `POST /chat/completions` (surface OpenAI). */
export async function chatOpenAiCompatible(
  http: HttpClient,
  route: ResolvedRoute,
  key: string,
  messages: readonly ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const response = await http.requestJson<ChatResponse>({
    url: `${route.provider.baseUrl}/chat/completions`,
    headers: { ...bearer(key), ...route.provider.headers },
    provider: route.provider.id,
    body: {
      model: route.model,
      messages: [...messages],
      temperature: options.temperature ?? 0.2,
      ...(options.maxTokens === undefined ? {} : { max_tokens: options.maxTokens }),
    },
  });

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new ProviderError(route.provider.id, 'réponse de complétion vide');
  }

  return content;
}

/** Recherche web via Tavily (`POST /search`, Bearer). */
export async function searchTavily(
  http: HttpClient,
  route: ResolvedRoute,
  key: string,
  query: string,
  limit: number,
): Promise<WebSearchResult[]> {
  const response = await http.requestJson<TavilyResponse>({
    url: `${route.provider.baseUrl}/search`,
    headers: bearer(key),
    provider: route.provider.id,
    body: { query, max_results: limit, search_depth: 'basic', include_answer: false },
  });

  return (response.results ?? []).map((item) => ({
    title: asString(item.title),
    url: asString(item.url),
    snippet: asString(item.content),
    ...(typeof item.score === 'number' ? { score: item.score } : {}),
  }));
}

/** Recherche web via Serper (`POST /search`, en-tête `X-API-KEY`). */
export async function searchSerper(
  http: HttpClient,
  route: ResolvedRoute,
  key: string,
  query: string,
  limit: number,
): Promise<WebSearchResult[]> {
  const response = await http.requestJson<SerperResponse>({
    url: `${route.provider.baseUrl}/search`,
    headers: { 'x-api-key': key },
    provider: route.provider.id,
    body: { q: query, num: limit },
  });

  return (response.organic ?? []).map((item) => ({
    title: asString(item.title),
    url: asString(item.link),
    snippet: asString(item.snippet),
  }));
}

/** Recherche web via SerpApi (`GET /search.json`, clé en paramètre). */
export async function searchSerpApi(
  http: HttpClient,
  route: ResolvedRoute,
  key: string,
  query: string,
  limit: number,
): Promise<WebSearchResult[]> {
  const url = new URL(`${route.provider.baseUrl}/search.json`);
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(limit));
  url.searchParams.set('api_key', key);

  const response = await http.requestJson<SerpApiResponse>({
    url: url.toString(),
    method: 'GET',
    provider: route.provider.id,
  });

  return (response.organic_results ?? []).map((item) => ({
    title: asString(item.title),
    url: asString(item.link),
    snippet: asString(item.snippet),
  }));
}

/**
 * Aligne un vecteur sur la dimension du schéma (1536) par **complétion de zéros**.
 *
 * Pour deux vecteurs `a` et `b`, ajouter des zéros à l'un et à l'autre ne change
 * ni le produit scalaire ni les normes : la similarité cosinus est **exactement**
 * préservée. C'est donc une conversion sans perte pour `baai/bge-m3` (1024 → 1536).
 *
 * Le sens inverse est refusé : tronquer un vecteur n'a de sens que pour les
 * modèles entraînés en MRL (Matryoshka), et le faire silencieusement sur les
 * autres dégraderait le rappel sans que personne ne le remarque.
 *
 * @throws {EmbeddingsError} Vecteur plus long que le schéma, ou plus court sans marge.
 */
export function alignToSchema(vector: readonly number[]): number[] {
  if (vector.length === EMBEDDING_DIMENSIONS) {
    return [...vector];
  }

  if (vector.length > EMBEDDING_DIMENSIONS) {
    throw new EmbeddingsError(
      `vecteur de ${String(vector.length)} dimensions : le schéma en attend ${String(EMBEDDING_DIMENSIONS)}. Demandez la réduction côté fournisseur (paramètre « dimensions ») plutôt que de tronquer.`,
    );
  }

  return [...vector, ...new Array<number>(EMBEDDING_DIMENSIONS - vector.length).fill(0)];
}
