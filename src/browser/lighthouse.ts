/**
 * Analyse de performance par Lighthouse.
 *
 * **Comment Lighthouse atteint la page.** L'outil pilote un Chrome par le
 * protocole de débogage (CDP). Il faut donc un port ouvert : `findFreePort()`
 * en réserve un, l'appelant lance Chromium avec
 * `--remote-debugging-port=<port>` (Playwright le fait via `LaunchOptions.args`),
 * puis l'analyse pointe sur ce port. Aucun Chrome système n'est requis :
 * celui du projet suffit.
 *
 * **Pourquoi un exécutant injectable.** Les tests unitaires ne peuvent pas
 * lancer de navigateur partout ; ils fournissent un `LighthouseRunner` factice
 * et vérifient la lecture du rapport. Le vrai exécutant n'est chargé
 * dynamiquement qu'à l'usage, comme Playwright dans `navigator.ts`.
 */

import { createServer } from 'node:net';

import { InspectionError } from './errors.js';
import { labVitals } from '../analysis/measurement.js';
import type { CoreWebVitals, LighthouseAnalysis, LighthouseIssue } from './inspection/types.js';

/** Catégories analysées : la performance et le SEO, comme le prévoit le sprint. */
export const LIGHTHOUSE_CATEGORIES = ['performance', 'seo'] as const;

/** Ports au-dessus de 1024 pour éviter les privilèges administrateur. */
const MIN_PORT = 1024;

/**
 * Émulation desktop de repli, identique aux valeurs de Lighthouse 13.
 *
 * Utilisée seulement si le module ne fournit pas `desktopConfig` (doublure de
 * test, version future) : elle doit **toujours** être cohérente avec
 * `formFactor`, sinon Lighthouse lève avant même la navigation.
 */
export const DESKTOP_EMULATION = {
  mobile: false,
  width: 1350,
  height: 940,
  deviceScaleFactor: 1,
  disabled: false,
} as const;

/** Audit Lighthouse réduit à ce qui est lu. */
export interface LighthouseAudit {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly score?: number | null;
  readonly numericValue?: number;
  readonly scoreDisplayMode?: string;
}

/** Rapport Lighthouse réduit à ce qui est lu. */
export interface LighthouseReport {
  readonly finalUrl?: string;
  readonly finalDisplayedUrl?: string;
  readonly lighthouseVersion?: string;
  readonly categories?: Readonly<
    Record<
      string,
      {
        readonly score?: number | null;
        readonly auditRefs?: readonly { readonly id?: string; readonly weight?: number }[];
      }
    >
  >;
  readonly audits?: Readonly<Record<string, LighthouseAudit>>;
}

/** Cible d'analyse : une URL et le port CDP d'un Chromium déjà lancé. */
export interface LighthouseTarget {
  readonly url: string;
  readonly port: number;
}

/** Options transmises à Lighthouse. */
export interface LighthouseRunOptions {
  /** Délai maximal de chargement (ms). */
  readonly timeoutMs?: number;
  /** Émulation mobile (`false` = desktop, plus rapide et plus stable). */
  readonly mobile?: boolean;
}

/** Rapport renvoyé par Lighthouse. */
export interface LighthouseRunResult {
  readonly lhr: LighthouseReport;
}

/** Exécutant : réel ou factice en test. */
export interface LighthouseRunner {
  run(target: LighthouseTarget, options?: LighthouseRunOptions): Promise<LighthouseRunResult>;
}

/**
 * Module `lighthouse` réduit à ce qui est utilisé.
 *
 * `desktopConfig` est le préréglage officiel : il aligne `formFactor`,
 * `screenEmulation`, le user-agent émulé et la limitation réseau. Le composer
 * soi-même est possible mais fragile — Lighthouse **refuse** un `formFactor`
 * desktop avec une émulation mobile restée par défaut (preuve relevée sur le
 * poste : « Screen emulation mobile setting (true) does not match formFactor
 * setting (desktop) »).
 */
export interface LighthouseModule {
  readonly default: (
    url: string,
    flags: Record<string, unknown>,
    config?: unknown,
  ) => Promise<LighthouseRunResult>;
  /** Préréglage desktop, fourni par le paquet. */
  readonly desktopConfig?: unknown;
}

/**
 * Réserve un port TCP libre sur la boucle locale.
 *
 * @throws {InspectionError} Aucun port n'a pu être réservé.
 */
export async function findFreePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.on('error', (error) => {
      reject(
        new InspectionError('lighthouse', `aucun port libre : ${error.message}`, { cause: error }),
      );
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (address === null || typeof address === 'string' || address.port < MIN_PORT) {
        server.close();
        reject(new InspectionError('lighthouse', 'port réservé invalide.'));

        return;
      }

      const { port } = address;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

/**
 * Construit l'exécutant réel de Lighthouse.
 *
 * @param module - Module déjà chargé (tests, démarrage anticipé).
 */
export function createLighthouseRunner(module?: LighthouseModule): LighthouseRunner {
  let cached: Promise<LighthouseModule> | undefined;

  const getModule = (): Promise<LighthouseModule> => {
    cached ??= module === undefined ? loadLighthouse() : Promise.resolve(module);

    return cached;
  };

  return {
    async run(
      target: LighthouseTarget,
      options: LighthouseRunOptions = {},
    ): Promise<LighthouseRunResult> {
      const lighthouse = await getModule();
      const desktop = options.mobile !== true;
      const flags: Record<string, unknown> = {
        port: target.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: [...LIGHTHOUSE_CATEGORIES],
        ...(options.timeoutMs === undefined ? {} : { maxWaitForLoad: options.timeoutMs }),
      };

      // Desktop : le préréglage officiel porte aussi la limitation réseau et le
      // user-agent. À défaut, les drapeaux doivent rester cohérents entre eux.
      const config = desktop ? lighthouse.desktopConfig : undefined;

      if (desktop && config === undefined) {
        flags.formFactor = 'desktop';
        flags.screenEmulation = { ...DESKTOP_EMULATION };
      } else if (!desktop) {
        flags.formFactor = 'mobile';
      }

      const result =
        config === undefined
          ? await lighthouse.default(target.url, flags)
          : await lighthouse.default(target.url, flags, config);

      return { lhr: result.lhr as unknown as LighthouseReport };
    },
  };
}

/**
 * Charge Lighthouse à la demande.
 *
 * L'import est dynamique : une inspection L1 ne paie pas le chargement d'un
 * paquet de 24 Mo.
 */
export async function loadLighthouse(): Promise<LighthouseModule> {
  const module = (await import('lighthouse')) as unknown as LighthouseModule;

  return module;
}

/** Nombre d'audits retenus par catégorie (les rapports peuvent en compter 200). */
const MAX_ISSUES = 25;

/**
 * Lit la valeur brute d'un audit sans aplatir les cas d'absence.
 *
 * `undefined` : l'audit ou son champ `numericValue` n'existe pas ; `null` : il
 * existe et vaut explicitement `null`. La distinction est conservée jusqu'à
 * `toMeasurement`, qui en tire une raison d'indisponibilité précise.
 */
function rawValue(report: LighthouseReport, id: string): number | null | undefined {
  const value = report.audits?.[id]?.numericValue;

  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? value : null;
}

/**
 * Extrait les métriques web du rapport, avec identité, unité et origine.
 *
 * Sprint 20-01 (W04 / C-W08) : deux défauts corrigés à la source.
 *
 * 1. **Aucun repli** de `interaction-to-next-paint` vers `max-potential-fid` :
 *    une métrique absente reste absente, elle n'est pas remplacée par une
 *    autre dont les seuils et la signification diffèrent ;
 * 2. **Aucun renommage** : INP, FID, max-potential-fid et TBT sortent sous
 *    leur propre identité, avec leur unité (`ms`, sauf CLS) et leur origine
 *    (`lab` ici, par construction).
 *
 * @param report - Rapport Lighthouse brut.
 * @returns Neuf lectures, aucune omise.
 */
export function extractCoreWebVitals(report: LighthouseReport): CoreWebVitals {
  return labVitals({
    lcp: rawValue(report, 'largest-contentful-paint'),
    inp: rawValue(report, 'interaction-to-next-paint'),
    fid: rawValue(report, 'first-input-delay'),
    'max-potential-fid': rawValue(report, 'max-potential-fid'),
    tbt: rawValue(report, 'total-blocking-time'),
    cls: rawValue(report, 'cumulative-layout-shift'),
    ttfb: rawValue(report, 'server-response-time'),
    fcp: rawValue(report, 'first-contentful-paint'),
    'speed-index': rawValue(report, 'speed-index'),
  });
}

/** Convertit un score d'audit en sévérité. */
function severityOf(score: number): LighthouseIssue['severity'] {
  if (score < 0.5) {
    return 'error';
  }

  return score < 0.9 ? 'warning' : 'info';
}

/**
 * Relève les audits SEO en échec.
 *
 * Seuls les audits **rattachés à la catégorie SEO** sont examinés : parcourir
 * tous les audits signalerait des problèmes de performance comme des problèmes
 * de référencement.
 */
export function extractSeoIssues(report: LighthouseReport): readonly LighthouseIssue[] {
  const refs = report.categories?.['seo']?.auditRefs ?? [];
  const issues: LighthouseIssue[] = [];

  for (const ref of refs) {
    if (issues.length >= MAX_ISSUES || ref.id === undefined) {
      continue;
    }

    const audit = report.audits?.[ref.id];

    if (audit === undefined || typeof audit.score !== 'number' || audit.score >= 1) {
      continue;
    }

    issues.push({
      id: ref.id,
      title: audit.title ?? ref.id,
      description: audit.description ?? '',
      severity: severityOf(audit.score),
    });
  }

  return issues;
}

/**
 * Score d'une catégorie, ramené sur 0-100, `null` si absent.
 *
 * Sprint 19-03 (C-W05) : un score de catégorie manquant ne vaut plus `0` ; il
 * reste indisponible jusqu'au rapport (aucune estimation de remplacement).
 */
function categoryScore(report: LighthouseReport, category: string): number | null {
  const score = report.categories?.[category]?.score;

  return typeof score === 'number' ? Math.round(Math.max(0, Math.min(1, score)) * 100) : null;
}

/**
 * Analyseur Lighthouse.
 *
 * @example
 * ```ts
 * const analyzer = new LighthouseAnalyzer();
 * const result = await analyzer.analyze({ url, port });
 * console.log(result.performance.score, result.performance.metrics.lcp);
 * ```
 */
export class LighthouseAnalyzer {
  constructor(private readonly runner: LighthouseRunner = createLighthouseRunner()) {}

  /**
   * Analyse une page déjà ouverte dans un Chromium accessible en CDP.
   *
   * @param target - URL et port de débogage.
   * @param options - Délai et émulation.
   * @throws {InspectionError} Lighthouse absent ou analyse en échec.
   */
  async analyze(
    target: LighthouseTarget,
    options: LighthouseRunOptions = {},
  ): Promise<LighthouseAnalysis> {
    const started = Date.now();

    let result: LighthouseRunResult;

    try {
      result = await this.runner.run(target, options);
    } catch (error) {
      throw new InspectionError('lighthouse', describe(error), { cause: error });
    }

    const report = result.lhr;

    return {
      performance: {
        score: categoryScore(report, 'performance'),
        metrics: extractCoreWebVitals(report),
      },
      seo: {
        score: categoryScore(report, 'seo'),
        issues: extractSeoIssues(report),
      },
      url: report.finalDisplayedUrl ?? report.finalUrl ?? target.url,
      version: report.lighthouseVersion ?? 'inconnue',
      duration: Date.now() - started,
    };
  }
}

/** Première ligne d'une erreur, sans trace. */
function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const newline = message.indexOf('\n');

  return (newline === -1 ? message : message.slice(0, newline)).trim();
}
