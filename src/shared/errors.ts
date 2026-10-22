/**
 * Erreurs métier EKTS.
 *
 * Toutes dérivent de `EktsError` et exposent un `code` stable : les couches
 * appelantes (CLI au Sprint 5, serveur MCP au Sprint 6) peuvent décider du
 * message et du code de sortie sans analyser une chaîne de caractères.
 */

export type EktsErrorCode = 'RESOURCE_NOT_FOUND' | 'VALIDATION_FAILED' | 'INDEXING_FAILED';

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
