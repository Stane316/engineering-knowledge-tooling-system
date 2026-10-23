/**
 * Inspecteur multi-niveaux : point d'entrée unique de l'analyse de page.
 *
 * **Un seul objet à appeler.** `Inspector.inspect(options)` choisit le niveau,
 * ouvre la session, navigue, exécute les analyses dans l'ordre et referme tout,
 * y compris en cas d'erreur. Les niveaux eux-mêmes ne connaissent ni Playwright
 * ni Lighthouse : ils reçoivent une session et des analyseurs injectables, ce
 * qui les rend testables sans navigateur.
 *
 * **Le niveau choisi est une promesse de contenu.** L1 ne fait que du local
 * (capture, arbre ARIA, DOM). L2 ajoute Lighthouse, qui exige Chromium et un
 * port CDP. L3 ajoute axe-core et les analyses qualitatives. Un niveau
 * supérieur contient intégralement le précédent : `L3 ⊃ L2 ⊃ L1`.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { findFreePort, LighthouseAnalyzer, type LighthouseRunner } from '../lighthouse.js';
import { AxeAnalyzer, type AxeRunner } from '../axe.js';
import { InspectionError } from '../errors.js';
import { Navigator } from '../navigator.js';
import type { BrowserKind, BrowserSessionInfo, LaunchOptions } from '../types.js';
import { inspectLevelOne } from './level-1.js';
import { inspectLevelTwo } from './level-2.js';
import { inspectLevelThree } from './level-3.js';
import {
  INSPECTION_BUDGETS,
  INSPECTION_LEVELS,
  type InspectionContext,
  type InspectionLevel,
  type InspectionOptions,
  type InspectionResult,
  type InspectionSession,
  type ResolvedInspectionOptions,
} from './types.js';

/** Dossier par défaut des artefacts. */
export const DEFAULT_OUTPUT_DIR = join('artifacts', 'inspections');

/** Nom du rapport JSON écrit à côté des artefacts. */
export const REPORT_FILENAME = 'report.json';

/** Viewport par défaut : desktop 1920 × 1080, gabarit le plus courant. */
export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 } as const;

/** Délai de navigation par défaut (30 s), comme `Navigator`. */
export const DEFAULT_NAVIGATION_TIMEOUT = 30_000;

/**
 * Surface de session utilisée par l'inspecteur : la session d'inspection plus
 * le cycle de vie. `Navigator` la satisfait sans adaptation.
 */
export interface InspectorSession extends InspectionSession {
  start(kind: BrowserKind, options?: LaunchOptions): Promise<BrowserSessionInfo>;
  stop(): Promise<void>;
}

/** Dépendances injectables (tests, variantes). */
export interface InspectorDependencies {
  /** Session ; défaut : un `Navigator` neuf. */
  readonly navigator?: InspectorSession;
  /** Analyseur Lighthouse ; défaut : exécutant réel. */
  readonly lighthouse?: LighthouseAnalyzer;
  /** Exécutant Lighthouse, si l'analyseur n'est pas fourni. */
  readonly lighthouseRunner?: LighthouseRunner;
  /** Analyseur axe-core ; défaut : exécutant réel. */
  readonly axe?: AxeAnalyzer;
  /** Exécutant axe-core, si l'analyseur n'est pas fourni. */
  readonly axeRunner?: AxeRunner;
  /** Horloge injectable (tests déterministes). */
  readonly now?: () => number;
  /** Réservation de port CDP (tests : port fixe). */
  readonly reservePort?: () => Promise<number>;
}

/**
 * Applique les valeurs par défaut aux options.
 *
 * @param options - Options fournies.
 * @throws {InspectionError} Niveau inconnu ou URL absente.
 */
export function resolveOptions(options: InspectionOptions): ResolvedInspectionOptions {
  const level = options.level ?? 'L1';

  if (!INSPECTION_LEVELS.includes(level)) {
    throw new InspectionError(
      'navigate',
      `niveau inconnu « ${String(level)} » (attendu : ${INSPECTION_LEVELS.join(', ')}).`,
    );
  }

  const url = options.url.trim();

  if (url === '') {
    throw new InspectionError('navigate', 'URL vide.');
  }

  return {
    url,
    level,
    viewport: options.viewport ?? DEFAULT_VIEWPORT,
    userAgent: options.userAgent,
    timeout: options.timeout ?? DEFAULT_NAVIGATION_TIMEOUT,
    browserKind: options.browserKind ?? 'chromium',
    outputDir: options.outputDir ?? DEFAULT_OUTPUT_DIR,
    screenshot: options.screenshot ?? true,
    trace: options.trace ?? false,
    pdf: options.pdf ?? false,
    strict: options.strict ?? false,
  };
}

/**
 * Construit les arguments du moteur pour Lighthouse.
 *
 * Lighthouse se connecte à Chromium par le protocole de débogage : sans port
 * ouvert, il échoue avec `ECONNREFUSED`. Le port est réservé avant le lancement
 * pour ne pas en découvrir un déjà pris une fois le moteur démarré.
 */
export function debuggingArgs(port: number): readonly string[] {
  return [`--remote-debugging-port=${String(port)}`];
}

/**
 * Inspecteur multi-niveaux.
 *
 * @example
 * ```ts
 * const inspector = new Inspector();
 * const report = await inspector.inspect({ url: 'https://exemple.fr', level: 'L2' });
 * console.log(report.metadata.title, report.level);
 * ```
 */
export class Inspector {
  private readonly navigator: InspectorSession;
  private readonly lighthouse: LighthouseAnalyzer;
  private readonly axe: AxeAnalyzer;
  private readonly now: () => number;
  private readonly reservePort: () => Promise<number>;

  constructor(private readonly dependencies: InspectorDependencies = {}) {
    this.navigator = dependencies.navigator ?? new Navigator();
    this.lighthouse =
      dependencies.lighthouse ?? new LighthouseAnalyzer(dependencies.lighthouseRunner ?? undefined);
    this.axe = dependencies.axe ?? new AxeAnalyzer(dependencies.axeRunner ?? undefined);
    this.now = dependencies.now ?? Date.now;
    this.reservePort = dependencies.reservePort ?? findFreePort;
  }

  /**
   * Inspecte une URL au niveau demandé.
   *
   * La session est toujours refermée, y compris si une étape échoue : sans
   * cela, un processus de navigateur survivrait à l'erreur et retiendrait ses
   * fichiers sous Windows.
   *
   * @param options - URL, niveau, artefacts.
   * @throws {InspectionError} Niveau invalide ou étape en échec en mode strict.
   * @throws {BrowserError} Le navigateur n'a pas pu être lancé.
   */
  async inspect(options: InspectionOptions): Promise<InspectionResult> {
    const result = await this.run(options);

    return result.result;
  }

  /**
   * Inspecte et écrit le rapport JSON dans `outputDir`.
   *
   * @param options - URL, niveau, artefacts.
   * @returns Le rapport et le chemin du fichier écrit.
   */
  async inspectAndSave(
    options: InspectionOptions,
  ): Promise<{ result: InspectionResult; reportPath: string }> {
    const { result, options: resolved } = await this.run(options);

    await mkdir(resolved.outputDir, { recursive: true });
    const reportPath = join(resolved.outputDir, REPORT_FILENAME);

    await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

    return {
      result,
      reportPath,
    };
  }

  /** Exécution commune : session, navigation, niveau, artefacts. */
  private async run(
    options: InspectionOptions,
  ): Promise<{ result: InspectionResult; options: ResolvedInspectionOptions }> {
    const resolved = resolveOptions(options);
    const startedAt = this.now();
    const needsCdp = resolved.level !== 'L1' && resolved.browserKind === 'chromium';
    const debugPort = needsCdp ? await this.reservePort() : undefined;

    await mkdir(resolved.outputDir, { recursive: true });

    const launch: LaunchOptions = {
      headless: true,
      timeoutMs: resolved.timeout,
      context: {
        viewport: resolved.viewport,
        ...(resolved.userAgent === undefined ? {} : { userAgent: resolved.userAgent }),
      },
      ...(debugPort === undefined ? {} : { args: [...debuggingArgs(debugPort)] }),
    };

    let session: BrowserSessionInfo | undefined;

    try {
      session = await this.navigator.start(resolved.browserKind, launch);
      const artifacts: { screenshot?: string; trace?: string; pdf?: string } = {};

      if (resolved.trace) {
        await this.navigator.startTrace({ screenshots: true, snapshots: true });
      }

      const navigation = await this.navigator.goto({
        url: resolved.url,
        timeout: resolved.timeout,
        waitUntil: 'load',
      });

      if (resolved.trace) {
        const tracePath = join(resolved.outputDir, 'trace.zip');

        await this.navigator.stopTrace({ path: tracePath });
        artifacts.trace = tracePath;
      }

      if (resolved.pdf) {
        const pdfPath = join(resolved.outputDir, 'page.pdf');

        if (resolved.browserKind === 'chromium') {
          await this.navigator.pdf({ path: pdfPath });
          artifacts.pdf = pdfPath;
        }
      }

      const context: InspectionContext = {
        session: this.navigator,
        options: resolved,
        navigation,
        startedAt,
        now: this.now,
      };

      const result = await this.dispatch(resolved.level, context, debugPort);

      // La capture est produite par le niveau 1 : il faut la reporter dans le
      // résultat final, que le niveau ait réussi ou non.
      return {
        result: {
          ...result,
          artifacts: { ...result.artifacts, ...artifacts },
          warnings: mergeWarnings(result.warnings, session.sandboxDisabled),
        },
        options: resolved,
      };
    } finally {
      await this.navigator.stop().catch(() => undefined);
    }
  }

  /** Exécute le niveau demandé. */
  private async dispatch(
    level: InspectionLevel,
    context: InspectionContext,
    debugPort: number | undefined,
  ): Promise<InspectionResult> {
    switch (level) {
      case 'L1': {
        const { result } = await inspectLevelOne(context);

        return result;
      }

      case 'L2': {
        const { result } = await inspectLevelTwo(context, {
          lighthouse: this.lighthouse,
          debugPort,
        });

        return result;
      }

      case 'L3':
        return await inspectLevelThree(context, {
          lighthouse: this.lighthouse,
          debugPort,
          axe: this.axe,
        });
    }
  }

  /**
   * Budget théorique d'un niveau.
   *
   * @param level - Niveau demandé.
   */
  budgetFor(level: InspectionLevel): number {
    return INSPECTION_BUDGETS[level];
  }
}

/** Ajoute l'avertissement de bac à sable désactivé, s'il y a lieu. */
function mergeWarnings(warnings: readonly string[], sandboxDisabled: boolean): readonly string[] {
  return sandboxDisabled
    ? [
        ...warnings,
        'Firefox a démarré sans bac à sable de contenu (mode compatibilité, voir docs/PLAYWRIGHT.md §14.1).',
      ]
    : warnings;
}
