import { CreateResourceSchema } from '../../shared/validators.js';
import type { ValidateResourceParams } from '../schemas/tool-schemas.js';
import { formatIssues } from '../utils/errors.js';

/** Résultat de `validate_resource`. */
export interface ValidateResourceResult {
  readonly valid: boolean;
  /** Messages lisibles, présents seulement si `valid` est faux. */
  readonly errors?: readonly string[];
}

/**
 * Outil `validate_resource` — valide une ressource **sans l'écrire**.
 *
 * Réutilise `CreateResourceSchema`, le schéma appliqué par `ekts add` : une
 * donnée déclarée valide par MCP le sera aussi en CLI. Les valeurs par défaut
 * (tags vides, métadonnées vides) ne sont pas renvoyées : l'outil répond à la
 * question « cette donnée est-elle acceptable ? », il ne crée rien.
 *
 * @param params - Données brutes (forme libre, validées ici).
 */
export function executeValidateResource(params: ValidateResourceParams): ValidateResourceResult {
  const parsed = CreateResourceSchema.safeParse(params.data);

  if (parsed.success) {
    return { valid: true };
  }

  return { valid: false, errors: parsed.error.issues.map((issue) => formatIssues([issue])) };
}
