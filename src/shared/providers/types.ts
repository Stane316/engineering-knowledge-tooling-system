/**
 * Types du registre de fournisseurs (Sprint 4.5).
 *
 * Une clé API n'a de sens que par **ce qu'elle permet** : chaque fournisseur est
 * décrit par ses capacités (embeddings, chat, recherche web, bac à sable), ses
 * modèles et ses contraintes. Le routage s'appuie uniquement sur ce catalogue,
 * jamais sur un `if (provider === 'openai')` disséminé dans le code.
 */

/**
 * Ce qu'un fournisseur sait faire.
 *
 * `web-fetch` est distinct de `web-search` : chercher produit des résultats,
 * récupérer produit le contenu complet d'une URL déjà connue (page, PDF,
 * DOCX) en markdown. Les deux usages n'ont ni le même coût ni les mêmes
 * fournisseurs.
 */
export type Capability = 'embedding' | 'chat' | 'web-search' | 'web-fetch' | 'sandbox';

/**
 * Identifiants livrés avec le catalogue.
 *
 * La liste sert à l'autocomplétion et à la documentation ; le type reste ouvert
 * (`ProviderId = string`) pour qu'un fournisseur déclaré par
 * `providers.custom.json` soit de première classe, sans modification du code.
 */
export type BuiltinProviderId =
  | 'openai'
  | 'openrouter'
  | 'gemini'
  | 'deepseek'
  | 'zai'
  | 'nvidia'
  | 'novita'
  | 'stepfun'
  | 'minimax'
  | 'tavily'
  | 'serper'
  | 'serpapi'
  | 'e2b'
  | 'sofya';

/** Identifiant de fournisseur (livré ou déclaré par l'utilisateur). */
export type ProviderId = string;

/**
 * Protocole filaire.
 *
 * Une famille = un adaptateur. `unknown` n'est jamais routé : un fournisseur
 * dont on ignore la façon de parler est collecté (sa clé est visible) mais
 * aucun appel n'est tenté.
 */
export type Protocol =
  'openai-compatible' | 'tavily' | 'serper' | 'serpapi' | 'sofya' | 'e2b' | 'unknown';

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

/**
 * Contenu d'une URL récupérée auprès d'un service de lecture.
 *
 * `success` est explicite : un fournisseur peut échouer sur une URL (page
 * protégée, 404) sans faire échouer les autres. L'appelant décide quoi faire
 * d'un échec partiel — le masquer serait pire que le montrer.
 */
export interface FetchedPage {
  title: string;
  url: string;
  content: string;
  success: boolean;
  publishedTime?: string;
  error?: string;
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
