import { NoProviderAvailableError, ProviderError, RateLimitError } from '../../shared/errors.js';

/** Sous-ensemble de `fetch` utilisé, injectable pour les tests. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface HttpOptions {
  fetch: FetchLike;
  /** Délai maximal par tentative (défaut : 30 s). */
  timeoutMs?: number;
  /** Nombre de tentatives supplémentaires (défaut : 2). */
  retries?: number;
  /** Attente de base de l'exponentielle (défaut : 250 ms). */
  baseDelayMs?: number;
  /** Plafond d'attente entre deux tentatives (défaut : 8 s). */
  maxDelayMs?: number;
  /** Attente injectable (tests : instantanée). */
  sleep?: (ms: number) => Promise<void>;
  /** Horloge injectable. */
  now?: () => number;
  /** Filtre de rédaction appliqué aux messages d'erreur. */
  redact?: (text: string) => string;
}

export interface JsonRequest {
  url: string;
  method?: 'GET' | 'POST' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  /** Identifiant du fournisseur, pour les erreurs. */
  provider: string;
}

/** Codes HTTP qui justifient une nouvelle tentative. */
const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 8_000;

/** Attente réelle, non bloquante pour la boucle d'événements. */
const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Client HTTP JSON : délai maximal, nouvelles tentatives et erreurs typées.
 *
 * **Pourquoi ne pas utiliser le SDK de chaque fournisseur ?** Sept d'entre eux
 * exposent la même surface OpenAI ; un client générique les couvre sans
 * installer sept dépendances (contrainte de mission : aucune dépendance
 * nouvelle). `fetch` est natif depuis Node 18.
 *
 * Politique de reprise — volontairement étroite :
 * - reprise sur 408, 409, 425, 429 et 5xx, jamais sur 400/401/403 (la requête
 *   ou la clé est en cause : réessayer ne changerait rien) ;
 * - en-tête `Retry-After` respecté (secondes ou date HTTP) ;
 * - attente exponentielle avec gigue, plafonnée, pour ne pas synchroniser
 *   plusieurs workers sur le même pic.
 */
export class HttpClient {
  private readonly fetch: FetchLike;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly redact: (text: string) => string;

  constructor(options: HttpOptions) {
    this.fetch = options.fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.sleep = options.sleep ?? realSleep;
    this.now = options.now ?? Date.now;
    this.redact = options.redact ?? ((text) => text);
  }

  /**
   * Exécute une requête JSON et renvoie le corps désérialisé.
   *
   * @throws {RateLimitError} 429 persistant après toutes les tentatives.
   * @throws {ProviderError} Erreur réseau, HTTP non réessayable ou JSON invalide.
   */
  async requestJson<T>(request: JsonRequest): Promise<T> {
    let lastError: ProviderError | RateLimitError | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      if (attempt > 0) {
        await this.sleep(this.delayFor(attempt, lastError));
      }

      const outcome = await this.attempt<T>(request);

      if (outcome.ok) {
        return outcome.value;
      }

      lastError = outcome.error;

      if (!outcome.retryable) {
        throw outcome.error;
      }
    }

    // Atteint uniquement si `retries` est négatif (impossible : la boucle
    // s'exécute au moins une fois). On renvoie la dernière erreur observée.
    throw lastError;
  }

  /** Une tentative : traduit le résultat en succès, erreur réessayable ou fatale. */
  private async attempt<T>(
    request: JsonRequest,
  ): Promise<
    | { ok: true; value: T }
    | { ok: false; error: ProviderError | RateLimitError; retryable: boolean }
  > {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await this.fetch(request.url, {
        method: request.method ?? 'POST',
        headers: {
          accept: 'application/json',
          ...(request.body === undefined ? {} : { 'content-type': 'application/json' }),
          ...request.headers,
        },
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
        signal: controller.signal,
      });

      const text = await response.text();

      if (!response.ok) {
        const retryable = RETRYABLE_STATUS.has(response.status);

        if (response.status === 429) {
          return {
            ok: false,
            error: new RateLimitError(
              request.provider,
              this.retryAfterMs(response.headers.get('retry-after')),
              {
                cause: new Error(this.describe(text)),
              },
            ),
            retryable,
          };
        }

        return {
          ok: false,
          error: new ProviderError(request.provider, this.describe(text), {
            status: response.status,
          }),
          retryable,
        };
      }

      try {
        return { ok: true, value: JSON.parse(text) as T };
      } catch (error) {
        return {
          ok: false,
          error: new ProviderError(request.provider, 'réponse JSON illisible', { cause: error }),
          retryable: false,
        };
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';

      return {
        ok: false,
        error: new ProviderError(
          request.provider,
          aborted ? `délai de ${String(this.timeoutMs)} ms dépassé` : 'échec réseau',
          { cause: error },
        ),
        retryable: true,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Attente avant la tentative `attempt`, en tenant compte de `Retry-After`. */
  private delayFor(attempt: number, error: ProviderError | RateLimitError | undefined): number {
    if (error instanceof RateLimitError && error.retryAfterMs > 0) {
      return Math.min(error.retryAfterMs, this.maxDelayMs);
    }

    const exponential = this.baseDelayMs * 2 ** (attempt - 1);
    const jitter = Math.random() * this.baseDelayMs;

    return Math.min(exponential + jitter, this.maxDelayMs);
  }

  /** `Retry-After` en millisecondes (0 si absent ou illisible). */
  private retryAfterMs(raw: string | null): number {
    if (raw === null || raw.trim().length === 0) {
      return 0;
    }

    const seconds = Number(raw);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1000;
    }

    const date = Date.parse(raw);
    return Number.isNaN(date) ? 0 : Math.max(0, date - this.now());
  }

  /** Extrait `error.message` du JSON si présent, puis rédige les secrets. */
  private describe(body: string): string {
    let message = body;

    try {
      const parsed = JSON.parse(body) as { error?: { message?: unknown }; message?: unknown };
      const candidate = parsed.error?.message ?? parsed.message;

      if (typeof candidate === 'string') {
        message = candidate;
      }
    } catch {
      // Corps non JSON : on garde le texte brut.
    }

    const compact = message.replace(/\s+/g, ' ').trim().slice(0, 300);
    return this.redact(compact.length > 0 ? compact : 'réponse vide');
  }
}

/**
 * Traduit un échec de bout en bout en erreur agrégée.
 *
 * Utilisé quand tous les fournisseurs d'une chaîne ont échoué : l'appelant
 * reçoit une cause exploitable, pas la dernière erreur arbitraire.
 */
export function aggregateFailure(
  capability: string,
  failures: readonly { provider: string; error: unknown }[],
): NoProviderAvailableError {
  const reasons = failures.map(
    (failure) =>
      `${failure.provider}: ${failure.error instanceof Error ? failure.error.message : 'inconnu'}`,
  );

  const last = failures[failures.length - 1]?.error;

  // `cause` n'accepte une valeur exploitable que si c'est une vraie erreur :
  // un rejet sous forme de chaîne n'apporte rien au diagnostic.
  return new NoProviderAvailableError(
    capability,
    reasons,
    last instanceof Error ? { cause: last } : {},
  );
}
