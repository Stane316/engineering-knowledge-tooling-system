/**
 * Erreurs métier EKTS.
 *
 * Toutes dérivent de `EktsError` et exposent un `code` stable : les couches
 * appelantes (CLI au Sprint 5, serveur MCP au Sprint 6) peuvent décider du
 * message et du code de sortie sans analyser une chaîne de caractères.
 */

export type EktsErrorCode =
  | 'RESOURCE_NOT_FOUND'
  | 'PROJECT_NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INDEXING_FAILED'
  | 'SEARCH_FAILED'
  | 'EMBEDDINGS_FAILED'
  | 'FUSION_FAILED'
  | 'PROVIDER_FAILED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_RATE_LIMITED'
  | 'EMBEDDING_SPACE_MISMATCH';

export class EktsError extends Error {
  constructor(
    message: string,
    readonly code: EktsErrorCode,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }

  /** Représentation sérialisable (logs JSON, sorties CLI `--json`). */
  toJSON(): { name: string; code: EktsErrorCode; message: string } {
    return { name: this.name, code: this.code, message: this.message };
  }
}

/** Ressource inexistante pour l'identifiant demandé. */
export class ResourceNotFoundError extends EktsError {
  constructor(readonly resourceId: string) {
    super(`Ressource introuvable : ${resourceId}`, 'RESOURCE_NOT_FOUND');
  }
}

/** Projet inexistant pour l'identifiant demandé (Sprint 13). */
export class ProjectNotFoundError extends EktsError {
  constructor(readonly projectId: string) {
    super(`Projet introuvable : ${projectId}`, 'PROJECT_NOT_FOUND');
  }
}

/** Entrée refusée par la validation Zod. */
export class ValidationError extends EktsError {
  constructor(
    readonly issues: readonly string[],
    options?: { cause?: unknown },
  ) {
    const detail = issues.length > 0 ? issues.join(' ; ') : 'entrée invalide';
    super(`Validation échouée : ${detail}`, 'VALIDATION_FAILED', options);
  }
}

/** Échec d'une opération sur l'index de recherche. */
export class IndexingError extends EktsError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`Indexation échouée : ${message}`, 'INDEXING_FAILED', options);
  }
}

/**
 * Échec d'une recherche (requête FTS5 invalide, index vectoriel indisponible,
 * vecteur de requête invalide…).
 */
export class SearchError extends EktsError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`Recherche échouée : ${message}`, 'SEARCH_FAILED', options);
  }
}

/**
 * Échec de la génération d'embeddings (clé absente, appel réseau en échec,
 * réponse malformée, dimensions incohérentes…).
 */
export class EmbeddingsError extends EktsError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`Embeddings échoués : ${message}`, 'EMBEDDINGS_FAILED', options);
  }
}

/** Échec de la fusion RRF (constante de lissage invalide, entrées incohérentes). */
export class FusionError extends EktsError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`Fusion échouée : ${message}`, 'FUSION_FAILED', options);
  }
}

/**
 * Échec d'un appel à un fournisseur d'API (réseau, HTTP, réponse illisible).
 *
 * Le message ne contient **jamais** de clé : les corps de réponse sont filtrés
 * par `redactKeys()` avant d'être concaténés.
 */
export class ProviderError extends EktsError {
  constructor(
    readonly provider: string,
    message: string,
    options?: { cause?: unknown; status?: number },
  ) {
    const status = options?.status === undefined ? '' : ` [HTTP ${String(options.status)}]`;
    super(`Fournisseur ${provider}${status} : ${message}`, 'PROVIDER_FAILED', options);
    this.status = options?.status;
  }

  /** Code HTTP, absent pour une erreur réseau. */
  readonly status: number | undefined;
}

/** Quota ou débit dépassé après épuisement des tentatives et des clés. */
export class RateLimitError extends EktsError {
  constructor(
    readonly provider: string,
    readonly retryAfterMs: number,
    options?: { cause?: unknown },
  ) {
    super(
      `Fournisseur ${provider} : quota ou débit dépassé (nouvelle tentative possible dans ${String(Math.ceil(retryAfterMs / 1000))} s)`,
      'PROVIDER_RATE_LIMITED',
      options,
    );
  }
}

/** Aucun fournisseur configuré et sain ne peut servir la demande. */
export class NoProviderAvailableError extends EktsError {
  constructor(
    readonly capability: string,
    readonly reasons: readonly string[],
    options?: { cause?: unknown },
  ) {
    const detail = reasons.length > 0 ? ` (${reasons.join(' ; ')})` : '';
    super(
      `Aucun fournisseur disponible pour « ${capability} »${detail}. Vérifiez .env et « npm run providers ».`,
      'PROVIDER_UNAVAILABLE',
      options,
    );
  }
}

/**
 * L'index vectoriel contient déjà des vecteurs d'un autre espace d'embedding.
 *
 * Des vecteurs issus de deux modèles différents ne sont pas comparables : les
 * mélanger détruirait silencieusement le rappel. Le changement d'espace exige
 * donc une réindexation explicite.
 */
export class EmbeddingSpaceMismatchError extends EktsError {
  constructor(
    readonly expected: string,
    readonly actual: string,
  ) {
    super(
      `Espace d'embedding incompatible : l'index contient « ${expected} », la configuration demande « ${actual} ». Réindexez avec la commande dédiée ou rétablissez l'ancien fournisseur.`,
      'EMBEDDING_SPACE_MISMATCH',
    );
  }
}
