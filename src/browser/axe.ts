/**
 * Analyse d'accessibilité par axe-core (WCAG 2.2 niveaux A et AA).
 *
 * **Ce qu'axe-core apporte que l'arbre ARIA ne voit pas.** `accessibility.ts`
 * lit la structure sémantique (un bouton a-t-il un nom ?) ; axe-core évalue des
 * propriétés calculées dans le moteur : contraste réel des couleurs, ordre de
 * tabulation, doublons d'identifiants, `aria-*` invalides. Les deux se
 * complètent : le premier est instantané et hors ligne, le second est la
 * référence du secteur.
 *
 * **Pourquoi un exécutant injectable.** `@axe-core/playwright` a besoin d'une
 * vraie page Playwright. Les tests unitaires fournissent un `AxeRunner`
 * factice ; le vrai n'est chargé qu'à l'usage.
 */

import { InspectionError } from './errors.js';
import type { AxeAnalysis, AxeViolation } from './inspection/types.js';
import type { PageLike } from './types.js';

/** Tags WCAG 2.2 niveaux A et AA, plus les règles de meilleure pratique. */
export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
  'best-practice',
] as const;

/** Poids d'une gravité dans le score. */
export const IMPACT_WEIGHTS: Readonly<Record<AxeViolation['impact'], number>> = {
  minor: 1,
  moderate: 3,
  serious: 5,
  critical: 10,
};

/** Ordre de tri des gravités, de la plus grave à la moins grave. */
const IMPACT_RANK: Readonly<Record<AxeViolation['impact'], number>> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

/** Violation brute, telle que la renvoie axe-core. */
export interface AxeRawViolation {
  readonly id?: string;
  readonly impact?: string | null;
  readonly description?: string;
  readonly help?: string;
  readonly helpUrl?: string;
  readonly tags?: readonly string[];
  readonly nodes?: readonly AxeRawNode[];
}

/**
 * Nœud brut d'une violation axe-core (réduit à la cible).
 *
 * `target` peut contenir des chaînes (sélecteur CSS) ou des tableaux (chaîne
 * de cadres) ; seules les chaînes sont retenues ici, telles quelles.
 */
export interface AxeRawNode {
  readonly target?: readonly (string | readonly string[])[];
}

/** Résultat brut d'axe-core, réduit à ce qui est lu. */
export interface AxeRawResults {
  readonly violations?: readonly AxeRawViolation[];
  readonly passes?: readonly unknown[];
  readonly inapplicable?: readonly unknown[];
  /** Moteur et version, tels que renvoyés par axe-core (`testEngine`). */
  readonly testEngine?: { readonly name?: string; readonly version?: string };
}

/** Résultat d'une exécution d'axe-core (même forme que le résultat brut). */
export type AxeRunResult = AxeRawResults;

/** Exécutant : réel ou factice en test. */
export interface AxeRunner {
  run(page: PageLike, options?: { tags?: readonly string[] }): Promise<AxeRunResult>;
}

/** Constructeur `AxeBuilder` réduit à l'usage du projet. */
export interface AxeBuilderLike {
  withTags(tags: string | string[]): AxeBuilderLike;
  options(options: Record<string, unknown>): AxeBuilderLike;
  analyze(): Promise<AxeRawResults>;
}

/** Module `@axe-core/playwright` réduit à son constructeur. */
export interface AxeModule {
  readonly default: new (params: { page: unknown }) => AxeBuilderLike;
}

/**
 * Charge axe-core à la demande.
 *
 * L'import est dynamique : une inspection L1 ou L2 ne paie pas l'injection du
 * script d'analyse dans la page.
 */
export async function loadAxe(): Promise<AxeModule> {
  const module = (await import('@axe-core/playwright')) as unknown as AxeModule;

  return module;
}

/**
 * Construit l'exécutant réel d'axe-core.
 *
 * @param module - Module déjà chargé (tests, démarrage anticipé).
 */
export function createAxeRunner(module?: AxeModule): AxeRunner {
  let cached: Promise<AxeModule> | undefined;

  const getModule = (): Promise<AxeModule> => {
    cached ??= module === undefined ? loadAxe() : Promise.resolve(module);

    return cached;
  };

  return {
    async run(page: PageLike, options: { tags?: readonly string[] } = {}): Promise<AxeRunResult> {
      const axe = await getModule();
      // Frontière assumée : `PageLike` décrit le sous-ensemble utilisé par le
      // projet ; `AxeBuilder` attend la classe `Page` complète de Playwright.
      // L'objet réel est bien une page Playwright, seule sa surface est réduite.
      const builder = new axe.default({ page: page as unknown });
      const configured = builder.withTags([...(options.tags ?? AXE_TAGS)]);

      return await configured.analyze();
    },
  };
}

/** Normalise une gravité brute, `minor` quand axe ne la qualifie pas. */
export function normaliseImpact(impact: string | null | undefined): AxeViolation['impact'] {
  return impact === 'moderate' || impact === 'serious' || impact === 'critical' ? impact : 'minor';
}

/** Convertit une violation brute en violation typée. */
function toViolation(raw: AxeRawViolation, index: number): AxeViolation {
  return {
    id: raw.id ?? `violation-${String(index)}`,
    impact: normaliseImpact(raw.impact),
    description: raw.description ?? '',
    help: raw.help ?? '',
    helpUrl: raw.helpUrl ?? '',
    ...(raw.nodes === undefined ? {} : { nodes: raw.nodes.length }),
    ...targetsOf(raw),
    tags: [...(raw.tags ?? [])],
  };
}

/**
 * Sélecteurs réellement fournis par axe-core.
 *
 * Les cibles de type tableau (chaîne de cadres) sont ignorées : les aplatir
 * produirait un sélecteur qui n'existe pas. Aucune cible ⇒ aucune propriété,
 * pour que l'absence reste visible jusqu'au rapport.
 */
function targetsOf(raw: AxeRawViolation): { targets?: readonly string[] } {
  const targets = (raw.nodes ?? [])
    .flatMap((node) => node.target ?? [])
    .filter((target): target is string => typeof target === 'string');

  return targets.length === 0 ? {} : { targets };
}

/**
 * Calcule le score d'accessibilité.
 *
 * Chaque nœud fautif coûte un poids dépendant de la gravité ; le score est
 * plafonné à zéro. Une page sans violation vaut 100.
 *
 * @param violations - Violations normalisées.
 */
export function scoreViolations(violations: readonly AxeViolation[]): number {
  const penalty = violations.reduce(
    (total, violation) =>
      total + IMPACT_WEIGHTS[violation.impact] * Math.max(1, violation.nodes ?? 0),
    0,
  );

  return Math.max(0, 100 - penalty);
}

/**
 * Analyseur axe-core.
 *
 * @example
 * ```ts
 * const analyzer = new AxeAnalyzer();
 * const report = await analyzer.analyze(navigator.getPage());
 * console.log(report.score, report.violations.length);
 * ```
 */
export class AxeAnalyzer {
  constructor(private readonly runner: AxeRunner = createAxeRunner()) {}

  /**
   * Analyse la page courante.
   *
   * @param page - Page Playwright (ou doublure).
   * @param options - Tags WCAG à exécuter (défaut : `AXE_TAGS`).
   * @throws {InspectionError} axe-core absent ou analyse en échec.
   */
  async analyze(page: PageLike, options: { tags?: readonly string[] } = {}): Promise<AxeAnalysis> {
    const started = Date.now();

    let results: AxeRunResult;

    try {
      results = await this.runner.run(page, options);
    } catch (error) {
      throw new InspectionError('axe', describe(error), { cause: error });
    }

    const violations = (results.violations ?? [])
      .map((raw, index) => toViolation(raw, index))
      .sort((left, right) => IMPACT_RANK[left.impact] - IMPACT_RANK[right.impact]);

    return {
      violations,
      score: scoreViolations(violations),
      passCount: results.passes?.length ?? 0,
      inapplicableCount: results.inapplicable?.length ?? 0,
      duration: Date.now() - started,
      ...(results.testEngine?.version === undefined
        ? {}
        : { engineVersion: results.testEngine.version }),
    };
  }
}

/** Première ligne d'une erreur, sans trace. */
function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const newline = message.indexOf('\n');

  return (newline === -1 ? message : message.slice(0, newline)).trim();
}
