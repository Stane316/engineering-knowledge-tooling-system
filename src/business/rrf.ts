import { FusionError } from '../shared/errors.js';
import type { SearchResult } from '../shared/types.js';

/**
 * Constante de lissage de la Reciprocal Rank Fusion (RRF).
 *
 * Valeur retenue par l'article fondateur de Cormack, Clarke & Buettcher (2009)
 * et par la spécification C4.4 : `k = 60`.
 */
export const RRF_K = 60;

/**
 * Contribution d'un document classé à un rang donné.
 *
 * `score = 1 / (k + rang)` avec `rang` commençant à 1 : un document premier
 * apporte `1/61 ≈ 0.0164`, un document dixième `1/70 ≈ 0.0143`. L'écart entre
 * rangs consécutifs est faible — c'est voulu : deux classements qui se
 * corroborent l'emportent sur un seul classement très confiant, et un document
 * absent d'un classement reçoit simplement 0 pour celui-ci.
 *
 * @param rank - Rang du document (1 = premier).
 * @param k - Constante de lissage (entier > 0, défaut {@link RRF_K}).
 * @throws {FusionError} Rang < 1 ou constante invalide.
 */
export function reciprocalRank(rank: number, k: number = RRF_K): number {
  if (!Number.isInteger(k) || k <= 0) {
    throw new FusionError(`constante de lissage invalide (${String(k)}) : entier > 0 attendu`);
  }

  if (!Number.isInteger(rank) || rank < 1) {
    throw new FusionError(`rang invalide (${String(rank)}) : entier >= 1 attendu`);
  }

  return 1 / (k + rank);
}

/**
 * Fusionne deux classements par Reciprocal Rank Fusion.
 *
 * `score_rrf(d) = Σ_i 1 / (k + rang_i(d))`, la somme portant sur les
 * classements où `d` apparaît.
 *
 * Les scores d'origine (BM25 négatif, similarité cosinus dans `[-1, 1]`) sont
 * **volontairement ignorés** : leurs échelles ne sont pas comparables. Seuls
 * les rangs comptent, ce qui rend la fusion robuste aux distributions de
 * scores propres à chaque moteur.
 *
 * Le tri de sortie est **total** : à score égal, l'identifiant départage, ce
 * qui garantit un ordre reproductible d'une exécution à l'autre.
 *
 * @param ftsResults - Classement lexical (déjà trié).
 * @param vectorResults - Classement sémantique (déjà trié).
 * @param k - Constante de lissage (défaut {@link RRF_K}).
 * @returns Résultats fusionnés, `source: 'hybrid'`, triés par score décroissant.
 * @throws {FusionError} Constante invalide, ou ressource présente dans les deux
 *   classements avec des objets divergents.
 */
export function fuseResults(
  ftsResults: readonly SearchResult[],
  vectorResults: readonly SearchResult[],
  k: number = RRF_K,
): SearchResult[] {
  if (!Number.isInteger(k) || k <= 0) {
    throw new FusionError(`constante de lissage invalide (${String(k)}) : entier > 0 attendu`);
  }

  const merged = new Map<string, SearchResult>();

  const accumulate = (results: readonly SearchResult[], origin: 'fts' | 'vector'): void => {
    results.forEach((result, index) => {
      const contribution = reciprocalRank(index + 1, k);
      const existing = merged.get(result.resource.id);

      if (existing === undefined) {
        merged.set(result.resource.id, {
          resource: result.resource,
          score: contribution,
          source: 'hybrid',
        });
        return;
      }

      if (existing.resource.updatedAt !== result.resource.updatedAt) {
        throw new FusionError(
          `la ressource ${result.resource.id} diffère entre les classements ${origin} et l'autre moteur (updatedAt incohérent)`,
        );
      }

      existing.score += contribution;
    });
  };

  accumulate(ftsResults, 'fts');
  accumulate(vectorResults, 'vector');

  return [...merged.values()].sort(
    (left, right) => right.score - left.score || left.resource.id.localeCompare(right.resource.id),
  );
}
