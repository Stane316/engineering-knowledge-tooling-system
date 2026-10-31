/**
 * Événements observables et rapprochement des citations (Sprint 23-01).
 *
 * Ce module répond à deux exigences distinctes, souvent confondues :
 *
 * 1. **C-T01 — cinq événements observables** (FTS, lecture, zéro résultat,
 *    erreur, refus) portant session, outil, mode, statut et version.
 * 2. **C-T02 — qualification des citations** : une citation est *vérifiée*,
 *    *non corroborée*, *incompatible de version* ou *indéterminée*, en
 *    s'appuyant sur ce que le serveur a **réellement servi**.
 *
 * ## La couche est déclarée, jamais extrapolée
 *
 * Un événement est produit au moment où le serveur écrit sa réponse vers le
 * client. Cette couche est nommée `server->client` et **aucun état « transmis
 * au modèle » n'est affirmé** : entre la réponse du serveur et ce que voit le
 * modèle, il y a un client, un hôte, une fenêtre de contexte et une troncature
 * dont ce processus n'observe rien.
 *
 * ## Pourquoi des empreintes et non du texte
 *
 * Le rapprochement d'une citation exige de savoir si le texte cité figurait
 * dans ce qui a été servi. Recopier le contenu dans les traces créerait une
 * seconde copie du corpus, exportable et indexable par erreur — exactement ce
 * que C-T03 interdit. Le module ne conserve donc que des **empreintes de
 * fenêtres de cinq mots** (shingles) : assez pour prouver une couverture au mot
 * près, trop peu pour reconstituer une phrase.
 *
 * Une empreinte atteste d'octets comparés, pas d'une authenticité : un texte
 * différent peut produire la même fenêtre sur cinq mots. Le verdict porte donc
 * sur la **couverture**, et ne prétend jamais à une preuve d'auteur.
 */

import { createHash, randomUUID } from 'node:crypto';

import type { McpToolContext } from '../context.js';

/** Nombre maximal d'événements conservés en mémoire. */
export const DEFAULT_EVENT_CAPACITY = 500;

/** Taille de la fenêtre de mots utilisée pour le rapprochement. */
export const SHINGLE_WORDS = 5;

/** Nombre maximal de fenêtres conservées par source servie. */
export const MAX_SHINGLES_PER_SOURCE = 400;

/** Longueur (hexadécimale) d'une empreinte de fenêtre. */
const SHINGLE_HEX = 16;

/** Couche de visibilité déclarée pour tous les événements. */
export const OBSERVABILITY_LAYER = 'server->client' as const;

/** Les cinq événements exigés par C-T01. */
export const EVENT_KINDS = ['fts', 'read', 'zero_result', 'error', 'refusal'] as const;

/** Nature d'un événement. */
export type EventKind = (typeof EVENT_KINDS)[number];

/** Statut associé à un événement. */
export type EventStatus = 'ok' | 'empty' | 'error' | 'refused';

/** Source effectivement servie, décrite par des empreintes seulement. */
export interface ServedSource {
  /** Identifiant de la ressource servie. */
  readonly resourceId: string;
  /** Version observée au moment du service (jamais inventée). */
  readonly version: string;
  /** Nombre de caractères servis (diagnostic, non reconstructible). */
  readonly chars: number;
  /** Empreintes des fenêtres de mots. */
  readonly shingles: readonly string[];
  /** Toutes les fenêtres n'ont pas été conservées (source longue). */
  readonly shinglesTruncated: boolean;
}

/** Événement tel qu'émis. */
export interface McpEvent {
  /** Rang strictement croissant dans la session. */
  readonly seq: number;
  /** Session (une par processus serveur). */
  readonly sessionId: string;
  /** Horodatage ISO 8601. */
  readonly at: string;
  readonly kind: EventKind;
  readonly status: EventStatus;
  readonly tool: string;
  /** Mode de recherche, pour `search_knowledge`. */
  readonly mode?: string;
  /** Version de la source, quand l'événement n'en concerne qu'une. */
  readonly version?: string;
  /** Nombre de résultats servis. */
  readonly resultCount?: number;
  /** Code d'erreur normalisé (`-32601`, `E_RESOURCE_NOT_FOUND`, …). */
  readonly errorCode?: string;
  /** Sources servies (empreintes uniquement). */
  readonly served?: readonly ServedSource[];
  /** Couche de visibilité : toujours `server->client`. */
  readonly layer: typeof OBSERVABILITY_LAYER;
}

/** Événement sans les champs attribués par le journal. */
export type EventDraft = Omit<McpEvent, 'seq' | 'sessionId' | 'at' | 'layer'>;

/** Options du journal. */
export interface EventJournalOptions {
  /** Identifiant de session (défaut : UUID aléatoire). */
  readonly sessionId?: string;
  /** Destination d'un événement (production : `stderr` via le journal). */
  readonly sink?: (event: McpEvent) => void;
  /** Horloge injectable (tests déterministes). */
  readonly now?: () => Date;
  /** Capacité mémoire (défaut : {@link DEFAULT_EVENT_CAPACITY}). */
  readonly capacity?: number;
}

/** Entrée observée d'un appel d'outil. */
export interface ToolOutcome {
  readonly tool: string;
  /** Arguments **bruts** ; seuls `mode` et quelques champs sont lus. */
  readonly args?: unknown;
  /** Charge utile en cas de succès. */
  readonly result?: unknown;
  /** Erreur levée, le cas échéant. */
  readonly error?: unknown;
}

/**
 * Journal d'événements d'une session serveur.
 *
 * Il conserve les `capacity` derniers événements et signale explicitement la
 * troncature : une trace incomplète ne permet pas de conclure à l'absence de
 * preuve, et le rapprochement des citations doit alors dire `indéterminée`
 * plutôt que `non corroborée`.
 */
export class EventJournal {
  readonly #sessionId: string;
  readonly #sink: ((event: McpEvent) => void) | undefined;
  readonly #now: () => Date;
  readonly #capacity: number;
  readonly #events: McpEvent[] = [];
  #seq = 0;
  #truncated = false;

  constructor(options: EventJournalOptions = {}) {
    this.#sessionId = options.sessionId ?? randomUUID();
    this.#sink = options.sink;
    this.#now = options.now ?? ((): Date => new Date());
    this.#capacity = options.capacity ?? DEFAULT_EVENT_CAPACITY;
  }

  /** Identifiant de session partagé par tous les événements. */
  get sessionId(): string {
    return this.#sessionId;
  }

  /** Événements conservés, dans l'ordre d'émission. */
  get events(): readonly McpEvent[] {
    return this.#events;
  }

  /** Des événements ont-ils été évincés faute de capacité ? */
  get truncated(): boolean {
    return this.#truncated;
  }

  /**
   * Enregistre un événement.
   *
   * @param draft - Champs observés ; la séquence, la session, la date et la
   *   couche sont attribuées ici.
   */
  record(draft: EventDraft): McpEvent {
    const event: McpEvent = {
      seq: this.#seq + 1,
      sessionId: this.#sessionId,
      at: this.#now().toISOString(),
      layer: OBSERVABILITY_LAYER,
      ...draft,
    };

    this.#seq = event.seq;
    this.#events.push(event);

    if (this.#events.length > this.#capacity) {
      this.#events.splice(0, this.#events.length - this.#capacity);
      this.#truncated = true;
    }

    this.#sink?.(event);

    return event;
  }

  /**
   * Classe un appel d'outil et l'enregistre s'il est observable.
   *
   * @returns L'événement créé, ou `null` pour un appel sans intérêt probant.
   */
  recordOutcome(outcome: ToolOutcome): McpEvent | null {
    const draft = classifyToolOutcome(outcome);

    return draft === null ? null : this.record(draft);
  }
}

/** Contexte enrichi d'un journal. */
export interface McpObservability {
  readonly journal: EventJournal;
}

/** Contexte porteur d'un journal. */
export type ContextWithJournal<T extends McpToolContext> = T & {
  readonly observability: McpObservability;
};

/**
 * Attache un journal à un contexte.
 *
 * Le journal voyage dans le contexte parce que le chemin d'exécution
 * (`dispatchTool`) le reçoit déjà : un refus de politique peut donc être
 * observé même quand l'outil n'est pas exposé au client.
 *
 * @param context - Contextes de services existants.
 * @param journal - Journal de la session.
 */
export function attachJournal<T extends McpToolContext>(
  context: T,
  journal: EventJournal,
): ContextWithJournal<T> {
  return { ...context, observability: { journal } };
}

/** Empreinte SHA-256 tronquée d'une chaîne. */
function shortHash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, SHINGLE_HEX);
}

/** Normalise un texte : NFC, espaces uniques, minuscules. */
export function normalizeText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim();
}

/** Découpe un texte normalisé en mots. */
function words(value: string): string[] {
  const normalized = normalizeText(value).toLowerCase();

  return normalized === '' ? [] : normalized.split(' ');
}

/** Empreintes des fenêtres glissantes de {@link SHINGLE_WORDS} mots. */
export function shingleWords(value: string): string[] {
  const tokens = words(value);

  if (tokens.length < SHINGLE_WORDS) {
    // Un texte plus court que la fenêtre forme une fenêtre unique : sans cela,
    // une ressource d'une phrase ne pourrait jamais corroborer une citation.
    return tokens.length === 0 ? [] : [shortHash(tokens.join(' '))];
  }

  const shingles: string[] = [];

  for (let index = 0; index + SHINGLE_WORDS <= tokens.length; index += 1) {
    shingles.push(shortHash(tokens.slice(index, index + SHINGLE_WORDS).join(' ')));
  }

  return shingles;
}

/** Construit la description d'une source servie. */
export function describeServedSource(
  resourceId: string,
  version: string,
  text: string,
): ServedSource {
  const all = shingleWords(text);
  const kept = all.slice(0, MAX_SHINGLES_PER_SOURCE);

  return {
    resourceId,
    version,
    chars: normalizeText(text).length,
    shingles: kept,
    shinglesTruncated: kept.length < all.length,
  };
}

/**
 * Version d'une ressource, telle qu'elle peut être constatée.
 *
 * La provenance explicite (`metadata.provenance.sourceVersion`) prime : c'est
 * la version de la **source d'origine**. À défaut, `updatedAt` est la révision
 * réellement persistée. Aucune des deux n'existe ? La version est `inconnue` —
 * jamais une valeur inventée, et jamais une date du jour.
 */
export function contentVersion(resource: unknown): string {
  if (typeof resource !== 'object' || resource === null) {
    return 'inconnue';
  }

  const record = resource as Record<string, unknown>;
  const metadata = record['metadata'];

  if (typeof metadata === 'object' && metadata !== null) {
    const provenance = (metadata as Record<string, unknown>)['provenance'];

    if (typeof provenance === 'object' && provenance !== null) {
      const sourceVersion = (provenance as Record<string, unknown>)['sourceVersion'];

      if (typeof sourceVersion === 'string' && sourceVersion.trim() !== '') {
        return sourceVersion.trim();
      }
    }
  }

  const updatedAt = record['updatedAt'];

  return typeof updatedAt === 'string' && updatedAt !== '' ? updatedAt : 'inconnue';
}

/** Code normalisé d'une erreur (`-32601`, `E_…`). */
export function errorCodeOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const record = error as Record<string, unknown>;
  const code = record['code'];

  if (typeof code === 'number' || typeof code === 'string') {
    return String(code);
  }

  return undefined;
}

/** Refus de politique : le seul code émis par la garde de profil. */
const REFUSAL_CODE = '-32601';

/** L'erreur est-elle un refus de politique, déjà enregistré plus bas ? */
export function isRefusalError(error: unknown): boolean {
  return errorCodeOf(error) === REFUSAL_CODE;
}

/** Lit un champ d'un objet non typé. */
function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

/** Mode de recherche demandé, lu dans les arguments bruts. */
function requestedMode(args: unknown): string {
  const mode = field(args, 'mode');

  return typeof mode === 'string' && mode !== '' ? mode : 'hybrid';
}

/** Décrit les sources d'un résultat de recherche. */
function searchServed(results: readonly unknown[]): ServedSource[] {
  const served: ServedSource[] = [];

  for (const entry of results) {
    const resource = field(entry, 'resource');
    const id = field(resource, 'id');

    if (typeof id !== 'string') {
      continue;
    }

    const content = field(resource, 'content');
    const highlight = field(entry, 'highlight');
    const text = [
      typeof content === 'string' ? content : '',
      typeof highlight === 'string' ? highlight : '',
    ]
      .filter((part) => part !== '')
      .join('\n');

    served.push(describeServedSource(id, contentVersion(resource), text));
  }

  return served;
}

/**
 * Classe un appel d'outil en événement observable.
 *
 * Seuls les appels qui portent une preuve sont retenus : une recherche, une
 * lecture, une erreur ou un refus. Un succès de `list_projects` n'est pas un
 * événement — le journaliser ne servirait aucune exigence et diluerait la trace.
 *
 * @param outcome - Outil, arguments, résultat ou erreur.
 */
export function classifyToolOutcome(outcome: ToolOutcome): EventDraft | null {
  const { tool, args, result, error } = outcome;

  if (error !== undefined) {
    const code = errorCodeOf(error);

    return {
      kind: isRefusalError(error) ? 'refusal' : 'error',
      status: isRefusalError(error) ? 'refused' : 'error',
      tool,
      ...(code === undefined ? {} : { errorCode: code }),
    };
  }

  if (result === undefined || result === null) {
    return null;
  }

  if (tool === 'search_knowledge') {
    const results = field(result, 'results');
    const list = Array.isArray(results) ? results : [];
    const mode = requestedMode(args);

    if (list.length === 0) {
      return { kind: 'zero_result', status: 'empty', tool, mode, resultCount: 0 };
    }

    const served = searchServed(list);

    return {
      kind: 'fts',
      status: 'ok',
      tool,
      mode,
      resultCount: list.length,
      ...(served.length === 1 && served[0] !== undefined ? { version: served[0].version } : {}),
      served,
    };
  }

  if (tool === 'get_resource') {
    const resource = field(result, 'resource');
    const id = field(resource, 'id');
    const content = field(resource, 'content');

    if (typeof id !== 'string') {
      return null;
    }

    const version = contentVersion(resource);
    const text = typeof content === 'string' ? content : '';

    return {
      kind: 'read',
      status: 'ok',
      tool,
      version,
      served: [describeServedSource(id, version, text)],
    };
  }

  return null;
}

/** Qualifications possibles d'une citation (C-T02). */
export const CITATION_QUALIFICATIONS = [
  'verifiee',
  'non_corroboree',
  'version_incompatible',
  'indeterminee',
] as const;

/** Qualification d'une citation. */
export type CitationQualification = (typeof CITATION_QUALIFICATIONS)[number];

/** Motif du verdict, pour l'audit du rapprochement lui-même. */
export type CitationReason =
  | 'couverture_exacte'
  | 'aucun_evenement'
  | 'version_divergente'
  | 'citation_non_couverte'
  | 'citation_trop_courte'
  | 'trace_incomplete';

/** Citation soumise au rapprochement. */
export interface CitationClaim {
  /** Ressource citée. */
  readonly resourceId: string;
  /** Texte cité (au moins cinq mots). */
  readonly quote: string;
  /** Version affirmée par l'auteur de la citation, si elle est connue. */
  readonly version?: string;
}

/** Verdict de rapprochement. */
export interface CitationVerdict {
  readonly qualification: CitationQualification;
  readonly reason: CitationReason;
  /** Événement qui porte la preuve, quand elle existe. */
  readonly evidenceSeq?: number;
}

/** Longueur minimale d'une citation en mots pour être vérifiable. */
const MIN_QUOTE_WORDS = SHINGLE_WORDS;

/**
 * Rapproche une citation de ce qui a été servi.
 *
 * Ordre de décision, volontairement explicite :
 *
 * 1. Une citation plus courte que la fenêtre n'est pas vérifiable : sans cela,
 *    citer « le » suffirait à obtenir « vérifiée ».
 * 2. Aucune source servie pour cette ressource : `non corroborée`, sauf si la
 *    trace est incomplète — l'absence de preuve n'est alors pas une preuve
 *    d'absence.
 * 3. Une version affirmée ne correspond à aucune version servie :
 *    `version incompatible`.
 * 4. Toutes les fenêtres du texte cité figurent dans une source servie :
 *    `vérifiée`, avec l'événement de preuve.
 * 5. Sinon : `non corroborée` (la source a été servie, mais pas ce texte).
 *
 * @param claim - Ressource, texte et version affirmée.
 * @param source - Journal (pour connaître la troncature) ou ses événements.
 */
export function qualifyCitation(
  claim: CitationClaim,
  source: EventJournal | readonly McpEvent[],
): CitationVerdict {
  const isJournal = source instanceof EventJournal;
  const events = isJournal ? source.events : source;
  const truncated = isJournal ? source.truncated : false;

  const quoteShingles = shingleWords(claim.quote);

  if (quoteShingles.length === 0 || words(claim.quote).length < MIN_QUOTE_WORDS) {
    return { qualification: 'indeterminee', reason: 'citation_trop_courte' };
  }

  const related = events.filter((event) =>
    (event.served ?? []).some((served) => served.resourceId === claim.resourceId),
  );

  if (related.length === 0) {
    return truncated
      ? { qualification: 'indeterminee', reason: 'trace_incomplete' }
      : { qualification: 'non_corroboree', reason: 'aucun_evenement' };
  }

  const candidates =
    claim.version === undefined
      ? related
      : related.filter((event) =>
          (event.served ?? []).some(
            (served) => served.resourceId === claim.resourceId && served.version === claim.version,
          ),
        );

  if (candidates.length === 0) {
    return { qualification: 'version_incompatible', reason: 'version_divergente' };
  }

  const wanted = new Set(quoteShingles);
  let incomplete = false;

  for (const event of candidates) {
    for (const served of event.served ?? []) {
      if (served.resourceId !== claim.resourceId) {
        continue;
      }

      if (claim.version !== undefined && served.version !== claim.version) {
        continue;
      }

      const known = new Set(served.shingles);

      if ([...wanted].every((shingle) => known.has(shingle))) {
        return { qualification: 'verifiee', reason: 'couverture_exacte', evidenceSeq: event.seq };
      }

      if (served.shinglesTruncated) {
        incomplete = true;
      }
    }
  }

  return truncated || incomplete
    ? { qualification: 'indeterminee', reason: 'trace_incomplete' }
    : { qualification: 'non_corroboree', reason: 'citation_non_couverte' };
}
