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

/**
 * Identité d'une métrique web suivie (Sprint 20-01, W04 / C-W08).
 *
 * Une métrique ne change jamais de nom entre sa source et sa sortie : INP,
 * FID, max-potential-fid et TBT sont quatre mesures distinctes, jamais
 * interchangeables.
 */
export type WebVitalId =
  'lcp' | 'inp' | 'fid' | 'max-potential-fid' | 'tbt' | 'cls' | 'ttfb' | 'fcp' | 'speed-index';

/** Unité d'une métrique. `unitless` pour CLS, qui est un score sans dimension. */
export type MetricUnit = 'ms' | 'unitless';

/**
 * Origine d'une mesure (W04).
 *
 * `field` désigne une donnée de terrain (RUM). Aucune source de terrain n'est
 * branchée à ce jour : le type réserve la valeur, il ne la produit pas.
 */
export type MetricOrigin = 'lab' | 'field' | 'unknown';

/** Lecture complète d'une métrique : identité, unité, origine et mesure. */
export interface MetricReading {
  /** Identité stable de la métrique. */
  readonly id: WebVitalId;
  /** Unité explicite de la valeur. */
  readonly unit: MetricUnit;
  /** Origine de la mesure. */
  readonly origin: MetricOrigin;
  /** Mesure disponible ou indisponible (contrat 19-03, inchangé). */
  readonly measurement: Measurement;
}

/**
 * Lectures des métriques web d'une inspection.
 *
 * Chaque clé est **toujours** présente : une métrique absente porte
 * `measurement.status === 'unavailable'`. Omettre la clé rendrait un oubli
 * d'implémentation indiscernable d'une absence réelle.
 */
export interface WebVitals {
  readonly lcp: MetricReading;
  readonly inp: MetricReading;
  readonly fid: MetricReading;
  readonly maxPotentialFid: MetricReading;
  readonly tbt: MetricReading;
  readonly cls: MetricReading;
  readonly ttfb: MetricReading;
  readonly fcp: MetricReading;
  readonly speedIndex: MetricReading;
}

/** Unité associée à chaque métrique suivie. */
export const METRIC_UNITS: Readonly<Record<WebVitalId, MetricUnit>> = {
  lcp: 'ms',
  inp: 'ms',
  fid: 'ms',
  'max-potential-fid': 'ms',
  tbt: 'ms',
  cls: 'unitless',
  ttfb: 'ms',
  fcp: 'ms',
  'speed-index': 'ms',
};

/**
 * Construit une lecture à partir d'une valeur brute.
 *
 * @param id - Identité de la métrique.
 * @param value - Valeur brute, ou `null`/`undefined` si elle n'a pas été fournie.
 * @param origin - Origine de la mesure (laboratoire par défaut).
 * @returns Lecture portant identité, unité, origine et mesure.
 */
export function metricReading(
  id: WebVitalId,
  value: number | null | undefined,
  origin: MetricOrigin = 'lab',
): MetricReading {
  return { id, unit: METRIC_UNITS[id], origin, measurement: toMeasurement(value) };
}

/**
 * Construit les lectures de laboratoire d'une inspection.
 *
 * Les métriques non fournies restent présentes, explicitement indisponibles.
 *
 * @param values - Valeurs brutes par identité de métrique.
 * @param origin - Origine commune (laboratoire par défaut).
 * @returns Les neuf lectures, aucune omise.
 */
export function labVitals(
  values: Partial<Record<WebVitalId, number | null | undefined>>,
  origin: MetricOrigin = 'lab',
): WebVitals {
  return {
    lcp: metricReading('lcp', values.lcp, origin),
    inp: metricReading('inp', values.inp, origin),
    fid: metricReading('fid', values.fid, origin),
    maxPotentialFid: metricReading('max-potential-fid', values['max-potential-fid'], origin),
    tbt: metricReading('tbt', values.tbt, origin),
    cls: metricReading('cls', values.cls, origin),
    ttfb: metricReading('ttfb', values.ttfb, origin),
    fcp: metricReading('fcp', values.fcp, origin),
    speedIndex: metricReading('speed-index', values['speed-index'], origin),
  };
}

/**
 * Mesures nues des lectures, indexées par nom de propriété.
 *
 * @param vitals - Lectures d'une inspection.
 * @returns Dictionnaire `nom → Measurement`, y compris pour les absentes.
 */
export function vitalsMeasurements(vitals: WebVitals): Record<keyof WebVitals, Measurement> {
  return {
    lcp: vitals.lcp.measurement,
    inp: vitals.inp.measurement,
    fid: vitals.fid.measurement,
    maxPotentialFid: vitals.maxPotentialFid.measurement,
    tbt: vitals.tbt.measurement,
    cls: vitals.cls.measurement,
    ttfb: vitals.ttfb.measurement,
    fcp: vitals.fcp.measurement,
    speedIndex: vitals.speedIndex.measurement,
  };
}
