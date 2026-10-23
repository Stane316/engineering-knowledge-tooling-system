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
import type { CoreWebVitals, LighthouseAnalysis, LighthouseIssue } from './inspection/types.js';

/** Catégories analysées : la performance et le SEO, comme le prévoit le sprint. */
export const LIGHTHOUSE_CATEGORIES = ['performance', 'seo'] as const;

/** Ports au-dessus de 1024 pour éviter les privilèges administrateur. */
const MIN_PORT = 1024;

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

/** Module `lighthouse` réduit à sa fonction d'analyse. */
export interface LighthouseModule {
  readonly default: (
    url: string,
    flags: Record<string, unknown>,
    config?: unknown,
  ) => Promise<LighthouseRunResult>;
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
      const flags: Record<string, unknown> = {
        port: target.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: [...LIGHTHOUSE_CATEGORIES],
        formFactor: options.mobile === true ? 'mobile' : 'desktop',
        ...(options.timeoutMs === undefined ? {} : { maxWaitForLoad: options.timeoutMs }),
      };

      const result = await lighthouse.default(target.url, flags);

      return { lhr: result.lhr as unknown as LighthouseReport };
    },
  };
}

/**
 * Charge Lighthouse à la demande.
 *
 * L'import est dynamique : une inspection L1 ne paie pas le chargement d'un
 * paquet de 19 Mo.
 */
export async function loadLighthouse(): Promise<LighthouseModule> {
  const module = (await import('lighthouse')) as unknown as LighthouseModule;

  return module;
}

/** Nombre d'audits retenus par catégorie (les rapports peuvent en compter 200). */
const MAX_ISSUES = 25;

/** Lit une valeur numérique d'audit, `0` si absente. */
function numericValue(report: LighthouseReport, id: string): number {
  const value = report.audits?.[id]?.numericValue;

  // Pas d'arrondi : le rapport doit rester fidèle à la mesure (CLS = 0,054
  // et non 0,05), l'arrondi d'affichage appartient au rapport.
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Extrait les Core Web Vitals du rapport.
 *
 * `INP` remplace `FID` depuis Lighthouse 11 : le premier audit disponible est
 * utilisé, sinon la valeur est nulle plutôt que fausse.
 */
export function extractCoreWebVitals(report: LighthouseReport): CoreWebVitals {
  const inp = report.audits?.['interaction-to-next-paint']?.numericValue;

  return {
    lcp: numericValue(report, 'largest-contentful-paint'),
    inp:
      typeof inp === 'number' && Number.isFinite(inp)
        ? inp
        : numericValue(report, 'max-potential-fid'),
    cls: numericValue(report, 'cumulative-layout-shift'),
    ttfb: numericValue(report, 'server-response-time'),
    fcp: numericValue(report, 'first-contentful-paint'),
    speedIndex: numericValue(report, 'speed-index'),
  };
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

/** Score d'une catégorie, ramené sur 0-100. */
function categoryScore(report: LighthouseReport, category: string): number {
  const score = report.categories?.[category]?.score;

  return typeof score === 'number' ? Math.round(Math.max(0, Math.min(1, score)) * 100) : 0;
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
