import { loadEnvFile } from '../../shared/env-file.js';
import { PROVIDERS, usableProviders } from '../../shared/providers/catalog.js';
import { loadProviderRegistry } from '../../shared/providers/custom-providers.js';
import { loadKeyring, redactKeys, type Keyring } from '../../shared/providers/env.js';
import type {
  Capability,
  ChatMessage,
  FetchedPage,
  ProviderDescriptor,
  ProviderId,
  ResolvedRoute,
  RouteTrace,
  RoutingPolicy,
  WebSearchResult,
} from '../../shared/providers/types.js';
import { aggregateFailure, HttpClient, type FetchLike, type HttpOptions } from './http.js';
import { ProviderHealth } from './health.js';
import { planRoutes } from './routing.js';
import {
  alignToSchema,
  chatOpenAiCompatible,
  embedOpenAiCompatible,
  fetchSofya,
  searchSerpApi,
  searchSerper,
  searchSofya,
  searchTavily,
  SOFYA_MAX_URLS,
  type ChatOptions,
} from './adapters.js';

export interface GatewayOptions extends Omit<HttpOptions, 'fetch' | 'redact'> {
  /** `fetch` de substitution (tests) ; défaut : `globalThis.fetch`. */
  fetch?: FetchLike;
  env?: NodeJS.ProcessEnv;
  keyring?: Keyring;
  policy?: RoutingPolicy;
  /** Espace d'embedding exigé (protège l'index existant). */
  space?: string;
  health?: ProviderHealth;
  /** Registre complet (catalogue livré + fournisseurs déclarés). */
  providers?: readonly ProviderDescriptor[];
}

export interface CallOptions {
  policy?: RoutingPolicy;
  space?: string;
}

export interface EmbeddingsOutcome {
  vectors: number[][];
  trace: RouteTrace;
}

export interface ChatOutcome {
  text: string;
  trace: RouteTrace;
}

export interface SearchOutcome {
  results: WebSearchResult[];
  trace: RouteTrace;
}

export interface FetchOutcome {
  pages: FetchedPage[];
  trace: RouteTrace;
}

/**
 * Passerelle multi-fournisseurs.
 *
 * Elle traduit un besoin métier (« calcule un embedding », « cherche sur le
 * web ») en **une chaîne d'appels ordonnée**, puis l'exécute avec trois
 * mécanismes complémentaires :
 *
 * 1. **rotation de clés** — plusieurs clés d'un même fournisseur sont
 *    utilisées en tourniquet, ce qui double le débit d'un palier gratuit ;
 * 2. **repli ordonné** — si un fournisseur échoue durablement, le suivant
 *    prend le relais (l'ordre est défini par le catalogue et la politique) ;
 * 3. **disjoncteur** — un fournisseur qui a échoué trois fois de suite est
 *    relégué en fin de chaîne pendant un temps croissant, sans être supprimé.
 *
 * Rien de tout cela n'est visible de l'appelant : il reçoit un résultat et une
 * trace (`provider`, `model`, `durationMs`, `attempts`) qu'il peut journaliser.
 */
export class ProviderGateway {
  readonly keyring: Keyring;
  readonly health: ProviderHealth;
  private readonly http: HttpClient;
  private readonly policy: RoutingPolicy;
  private readonly space: string | undefined;
  private readonly providers: readonly ProviderDescriptor[];
  private readonly cursors = new Map<ProviderId, number>();

  constructor(options: GatewayOptions) {
    this.providers = options.providers ?? PROVIDERS;
    this.keyring = options.keyring ?? loadKeyring(options.env ?? process.env, this.providers);
    this.health = options.health ?? new ProviderHealth(options.now ?? Date.now);
    this.policy = options.policy ?? 'quality';
    this.space = options.space;

    const httpOptions: HttpOptions = {
      ...options,
      fetch: options.fetch ?? globalThis.fetch,
      redact: (text) => redactKeys(text, this.keyring),
    };

    this.http = new HttpClient(httpOptions);
  }

  /** Nombre de fournisseurs configurés pour une capacité. */
  available(capability: Capability): number {
    return planRoutes({
      capability,
      keyring: this.keyring,
      policy: this.policy,
      providers: this.providers,
      ...(this.space === undefined ? {} : { space: this.space }),
    }).length;
  }

  /** Chaîne d'appel actuelle, dans l'ordre (diagnostic et affichage). */
  plan(capability: Capability, overrides: CallOptions = {}): ResolvedRoute[] {
    return planRoutes({
      capability,
      keyring: this.keyring,
      policy: overrides.policy ?? this.policy,
      health: this.health,
      providers: this.providers,
      ...((overrides.space ?? this.space) === undefined
        ? {}
        : { space: overrides.space ?? this.space }),
    });
  }

  /**
   * Calcule les embeddings d'un lot de textes.
   *
   * Le vecteur renvoyé est **toujours** de 1536 dimensions : les modèles natifs
   * plus courts sont complétés par des zéros (cosinus préservé), les plus longs
   * sont ramenés à 1536 par le paramètre `dimensions` du fournisseur.
   *
   * @throws {NoProviderAvailableError} Aucun fournisseur configuré ou tous épuisés.
   * @throws {EmbeddingsError} Vecteur reçu hors schéma et non alignable.
   */
  async embed(texts: readonly string[], options: CallOptions = {}): Promise<EmbeddingsOutcome> {
    if (texts.length === 0) {
      return {
        vectors: [],
        trace: { provider: 'openai', model: '', durationMs: 0, attempts: 0 },
      };
    }

    const outcome = await this.callWithFailover('embedding', options, async (route, key) => {
      const vectors = await embedOpenAiCompatible(this.http, route, key, texts);
      return { values: vectors.map((vector) => alignToSchema(vector)), model: route.model };
    });

    return { vectors: outcome.values, trace: outcome.trace };
  }

  /**
   * Complétion de chat.
   *
   * @throws {NoProviderAvailableError} Aucun fournisseur de chat disponible.
   */
  async chat(
    messages: readonly ChatMessage[],
    chatOptions: ChatOptions = {},
    options: CallOptions = {},
  ): Promise<ChatOutcome> {
    const outcome = await this.callWithFailover('chat', options, async (route, key) => ({
      values: await chatOpenAiCompatible(this.http, route, key, messages, chatOptions),
      model: route.model,
    }));

    return { text: outcome.values, trace: outcome.trace };
  }

  /**
   * Recherche web, normalisée quel que soit le fournisseur.
   *
   * @throws {NoProviderAvailableError} Aucun fournisseur de recherche disponible.
   */
  async search(query: string, limit = 5, options: CallOptions = {}): Promise<SearchOutcome> {
    const outcome = await this.callWithFailover('web-search', options, async (route, key) => ({
      values: await this.searchWith(route, key, query, limit),
      model: route.provider.label,
    }));

    return { results: outcome.values, trace: outcome.trace };
  }

  /**
   * Récupère le contenu de une à dix URL (markdown propre).
   *
   * Capacité distincte de la recherche : elle sert à importer une page déjà
   * connue (documentation, article, PDF) dans la base de connaissances.
   *
   * @param urls - Une à dix URL ; au-delà, la limite du fournisseur serait
   *   atteinte et la requête serait rejetée côté serveur.
   * @throws {Error} Liste vide ou plus de dix URL.
   * @throws {NoProviderAvailableError} Aucun fournisseur de lecture disponible.
   */
  async fetchPages(urls: readonly string[], options: CallOptions = {}): Promise<FetchOutcome> {
    if (urls.length === 0) {
      throw new Error('aucune URL à récupérer');
    }

    if (urls.length > SOFYA_MAX_URLS) {
      throw new Error(
        `au plus ${String(SOFYA_MAX_URLS)} URL par appel (${String(urls.length)} demandées)`,
      );
    }

    const outcome = await this.callWithFailover('web-fetch', options, async (route, key) => ({
      values: await this.fetchWith(route, key, urls),
      model: route.provider.label,
    }));

    return { pages: outcome.values, trace: outcome.trace };
  }

  private fetchWith(
    route: ResolvedRoute,
    key: string,
    urls: readonly string[],
  ): Promise<FetchedPage[]> {
    switch (route.provider.protocol) {
      case 'sofya':
        return fetchSofya(this.http, route, key, urls);
      default:
        return Promise.reject(
          new Error(`protocole de lecture non géré : ${route.provider.protocol}`),
        );
    }
  }

  private searchWith(
    route: ResolvedRoute,
    key: string,
    query: string,
    limit: number,
  ): Promise<WebSearchResult[]> {
    switch (route.provider.protocol) {
      case 'tavily':
        return searchTavily(this.http, route, key, query, limit);
      case 'serper':
        return searchSerper(this.http, route, key, query, limit);
      case 'serpapi':
        return searchSerpApi(this.http, route, key, query, limit);
      case 'sofya':
        return searchSofya(this.http, route, key, query, limit);
      default:
        return Promise.reject(
          new Error(`protocole de recherche non géré : ${route.provider.protocol}`),
        );
    }
  }

  /**
   * Exécute une opération sur la chaîne de fournisseurs, avec rotation des clés.
   *
   * Un échec sur toutes les clés d'un fournisseur incrémente son disjoncteur et
   * fait passer au suivant. L'erreur finale agrège toutes les causes : elle
   * indique *pourquoi* chaque fournisseur a été écarté.
   */
  private async callWithFailover<T>(
    capability: Capability,
    options: CallOptions,
    invoke: (route: ResolvedRoute, key: string) => Promise<{ values: T; model: string }>,
  ): Promise<{ values: T; trace: RouteTrace }> {
    const routes = this.plan(capability, options);

    if (routes.length === 0) {
      throw aggregateFailure(
        capability,
        usableProviders(capability, this.providers).map((provider) => ({
          provider: provider.id,
          error: new Error(`clé absente (${provider.envKeys.join(' ou ')})`),
        })),
      );
    }

    const failures: { provider: string; error: unknown }[] = [];

    for (const [index, route] of routes.entries()) {
      const keys = route.keys;

      if (keys.length === 0) {
        continue;
      }

      const startedAt = Date.now();

      for (let attempt = 0; attempt < keys.length; attempt += 1) {
        const key = keys[(this.cursorFor(route.provider.id) + attempt) % keys.length] as string;

        try {
          const outcome = await invoke(route, key);

          this.health.recordSuccess(route.provider.id);
          this.advanceCursor(route.provider.id, keys.length);

          return {
            values: outcome.values,
            trace: {
              provider: route.provider.id,
              model: outcome.model,
              durationMs: Date.now() - startedAt,
              attempts: index,
              ...(route.space === undefined ? {} : { space: route.space }),
            },
          };
        } catch (error) {
          failures.push({ provider: `${route.provider.id}#${String(attempt + 1)}`, error });
        }
      }

      this.health.recordFailure(route.provider.id);
    }

    throw aggregateFailure(capability, failures);
  }

  private cursorFor(provider: ProviderId): number {
    return this.cursors.get(provider) ?? 0;
  }

  private advanceCursor(provider: ProviderId, keyCount: number): void {
    this.cursors.set(provider, (this.cursorFor(provider) + 1) % keyCount);
  }
}

/**
 * Construit une passerelle depuis l'environnement.
 *
 * Variables de routage (facultatives) :
 * - `EKTS_PROVIDER_POLICY` = `quality` | `free` | `cost` ;
 * - `EKTS_EMBEDDING_SPACE` = espace canonique imposé (ex. `baai/bge-m3`).
 *
 * @throws {Error} Politique inconnue.
 */
export function createProviderGateway(
  options: GatewayOptions & { env?: NodeJS.ProcessEnv } = {},
): ProviderGateway {
  // Aucun `env` injecté : on est en production, `.env` doit être pris en compte.
  if (options.env === undefined) {
    loadEnvFile();
  }

  const env = options.env ?? process.env;

  // Fournisseurs déclarés par l'utilisateur : lus depuis le disque en
  // production uniquement. Un `env` injecté (tests) garantit un registre figé,
  // indépendant du répertoire courant.
  const providers =
    options.providers ?? (options.env === undefined ? loadProviderRegistry({ env }) : PROVIDERS);

  const rawPolicy = env.EKTS_PROVIDER_POLICY?.trim();
  let policy: RoutingPolicy | undefined;

  if (rawPolicy !== undefined && rawPolicy.length > 0) {
    if (!isPolicy(rawPolicy)) {
      throw new Error(
        `EKTS_PROVIDER_POLICY invalide (${rawPolicy}) : « quality », « free » ou « cost » attendu`,
      );
    }

    policy = rawPolicy;
  }

  const space = env.EKTS_EMBEDDING_SPACE?.trim();

  return new ProviderGateway({
    ...options,
    providers,
    ...(policy === undefined ? {} : { policy }),
    ...(space === undefined || space.length === 0 ? {} : { space }),
  });
}

function isPolicy(value: string): value is RoutingPolicy {
  return value === 'quality' || value === 'free' || value === 'cost';
}

/** Ré-export pour les tests et les appelants avancés. */
export type { FetchLike };
