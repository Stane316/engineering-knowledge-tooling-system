/**
 * Types du registre de fournisseurs (Sprint 4.5).
 *
 * Une clé API n'a de sens que par **ce qu'elle permet** : chaque fournisseur est
 * décrit par ses capacités (embeddings, chat, recherche web, bac à sable), ses
 * modèles et ses contraintes. Le routage s'appuie uniquement sur ce catalogue,
 * jamais sur un `if (provider === 'openai')` disséminé dans le code.
 */

/** Ce qu'un fournisseur sait faire. */
export type Capability = 'embedding' | 'chat' | 'web-search' | 'sandbox';

/** Identifiants stables (sérialisés dans les logs et la configuration). */
export type ProviderId =
  | 'openai'
  | 'openrouter'
  | 'gemini'
  | 'deepseek'
  | 'zai'
  | 'nvidia'
  | 'novita'
  | 'stepfun'
  | 'tavily'
  | 'serper'
  | 'serpapi'
  | 'e2b'
  | 'sofya';

/** Protocole filaire : trois familles suffisent à couvrir treize fournisseurs. */
export type Protocol = 'openai-compatible' | 'tavily' | 'serper' | 'serpapi' | 'e2b' | 'unknown';

/**
 * Espace d'embedding : identité **sémantique** d'un modèle.
 *
 * Deux fournisseurs qui servent le même espace (`openai/text-embedding-3-small`
 * chez OpenAI et chez OpenRouter, par exemple) produisent des vecteurs
 * comparables : c'est la seule forme de bascule autorisée pour un index déjà
 * construit.
 */
export interface EmbeddingModelSpec {
  /** Identifiant envoyé à l'API. */
  model: string;
  /** Espace canonique (`fournisseur-éditeur/modele`). */
  space: string;
  /** Dimensions natives du vecteur. */
  dimensions: number;
  /** Palier gratuit disponible (au moment de la rédaction). */
  free: boolean;
  /** Le modèle distingue requête et document (asymétrique). */
  asymmetric?: boolean;
  /** Remarque affichée par `npm run providers`. */
  note?: string;
}

/** Modèle de complétion (Sprint 6 : synthèse RAG, juge de fidélité). */
export interface ChatModelSpec {
  model: string;
  free: boolean;
  /** Forces reconnues, utilisées par la politique `quality`. */
  strengths?: readonly string[];
}

export interface ProviderDescriptor {
  id: ProviderId;
  label: string;
  /** Variables d'environnement reconnues (alias inclus). */
  envKeys: readonly string[];
  /** Racine des requêtes HTTP (sans slash final). */
  baseUrl: string;
  protocol: Protocol;
  capabilities: readonly Capability[];
  embeddings?: readonly EmbeddingModelSpec[];
  chat?: readonly ChatModelSpec[];
  /** Champs ajoutés au corps des requêtes d'embedding (ex. `input_type`). */
  embeddingExtra?: Readonly<Record<string, string>>;
  /** En-têtes supplémentaires (ex. `HTTP-Referer` pour OpenRouter). */
  headers?: Readonly<Record<string, string>>;
  docsUrl: string;
  /** `unverified` : clé collectée mais protocole non confirmé. */
  status: 'verified' | 'unverified';
  note?: string;
}

/** Politique de sélection d'un fournisseur. */
export type RoutingPolicy = 'quality' | 'free' | 'cost';

/** Destination d'appel résolue : fournisseur + modèle + clés disponibles. */
export interface ResolvedRoute {
  provider: ProviderDescriptor;
  /** Modèle retenu pour la capacité demandée. */
  model: string;
  /** Espace d'embedding (embeddings uniquement). */
  space?: string;
  /** Dimensions natives du modèle. */
  nativeDimensions?: number;
  /** Clés disponibles, dans l'ordre de rotation. */
  keys: readonly string[];
}

/** Message de chat, au format OpenAI (le plus répandu). */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Résultat de recherche web normalisé. */
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

/** Origine d'un appel réussi (journalisation, diagnostic). */
export interface RouteTrace {
  provider: ProviderId;
  model: string;
  /** Durée de l'appel en millisecondes. */
  durationMs: number;
  /** Nombre de fournisseurs écartés avant celui-ci. */
  attempts: number;
  /** Espace d'embedding effectivement utilisé. */
  space?: string;
}
