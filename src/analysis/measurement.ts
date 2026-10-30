/**
 * Mesure disponible ou indisponible (Sprint 19-03, C-W05).
 *
 * Le défaut corrigé : `numericValue()` de `src/browser/lighthouse.ts`
 * retournait `0` quand l'audit Lighthouse ne fournissait aucune valeur. Un zéro
 * de remplacement se lisait ensuite comme « excellent » et devenait
 * indistinguable d'une mesure réellement nulle.
 *
 * Le type ci-dessous rend l'ambiguïté impossible : une valeur absente, `null`,
 * `NaN` ou infinie n'est **jamais** un nombre. Seul un `0` effectivement
 * mesuré porte `status: 'measured'` avec `value: 0`.
 *
 * @example
 * ```ts
 * toMeasurement(0);                    // { status: 'measured', value: 0 }
 * toMeasurement(undefined);            // { status: 'unavailable', reason: 'absent' }
 * toMeasurement(Number.NaN);           // { status: 'unavailable', reason: 'nan' }
 * ```
 */

import type { OverallScore } from './types.js';

/** Raison d'indisponibilité d'une mesure. */
export type MeasurementUnavailableReason =
  'absent' | 'null' | 'nan' | 'infinite-positive' | 'infinite-negative';

/** Mesure disponible (valeur réellement observée). */
export interface MeasuredValue {
  readonly status: 'measured';
  readonly value: number;
}

/** Mesure indisponible (aucune valeur de remplacement n'est exposée). */
export interface UnavailableMeasurement {
  readonly status: 'unavailable';
  readonly reason: MeasurementUnavailableReason;
}

/** Mesure d'une métrique : disponible ou explicitement indisponible. */
export type Measurement = MeasuredValue | UnavailableMeasurement;

/**
 * Convertit une valeur brute en {@link Measurement}.
 *
 * Les cinq cas d'indisponibilité de C-W05 sont distingués : propriété absente,
 * `null`, `NaN`, `+Infinity`, `-Infinity`. Une valeur finie — y compris `0` et
 * les négatifs — est conservée telle quelle : la juger relève des seuils, pas
 * de cette fonction.
 *
 * @param input - Valeur brute issue d'une source de mesure.
 * @returns Mesure disponible ou indisponible.
 */
export function toMeasurement(input: number | null | undefined): Measurement {
  if (input === undefined) {
    return { status: 'unavailable', reason: 'absent' };
  }

  if (input === null) {
    return { status: 'unavailable', reason: 'null' };
  }

  if (Number.isNaN(input)) {
    return { status: 'unavailable', reason: 'nan' };
  }

  if (input === Number.POSITIVE_INFINITY) {
    return { status: 'unavailable', reason: 'infinite-positive' };
  }

  if (input === Number.NEGATIVE_INFINITY) {
    return { status: 'unavailable', reason: 'infinite-negative' };
  }

  return { status: 'measured', value: input };
}

/**
 * Valeur numérique d'une mesure, ou `undefined` si elle est indisponible.
 *
 * À utiliser quand l'appelant doit distinguer l'absence ; ne jamais remplacer
 * par `0` « pour simplifier » (c'est exactement le défaut corrigé).
 *
 * @param measurement - Mesure à lire.
 * @returns La valeur mesurée, ou `undefined`.
 */
export function measuredValueOf(measurement: Measurement | undefined): number | undefined {
  return measurement?.status === 'measured' ? measurement.value : undefined;
}

/**
 * Valeur numérique d'un score global, ou `null` s'il est indisponible.
 *
 * @param score - Score global (union mesuré/indisponible).
 * @returns La valeur mesurée, ou `null` — jamais `0` en remplacement.
 */
export function overallScoreValue(score: OverallScore): number | null {
  return score.status === 'measured' ? score.value : null;
}

/**
 * Raison d'indisponibilité d'un score global, ou `null` s'il est mesuré.
 *
 * @param score - Score global (union mesuré/indisponible).
 * @returns Le message lisible, ou `null`.
 */
export function overallScoreReason(score: OverallScore): string | null {
  return score.status === 'unavailable' ? score.reason : null;
}
