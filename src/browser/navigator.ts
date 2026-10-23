/**
 * Navigation basique pilotée par Playwright.
 *
 * Le module couvre les quatre opérations dont l'inspection a besoin : ouvrir une
 * page, la capturer, enregistrer une trace et l'imprimer en PDF. Il ne fait
 * **aucune** analyse (performance, SEO, accessibilité) : celles-ci arrivent aux
 * Sprints 8 et 9, sur les artefacts produits ici.
 *
 * Trois principes :
 *
 * 1. **Une seule session par instance.** `start()` ouvre un navigateur, un
 *    contexte et une page ; `stop()` les ferme. Rouvrir un contexte par page
 *    coûte ~300 ms et fausse les mesures de performance.
 * 2. **Aucune dépendance à l'exécution vers Playwright dans la logique.** Le
 *    lancement passe par `BrowserLauncher` ; les tests injectent une doublure et
 *    s'exécutent sans binaire de navigateur.
 * 3. **Erreurs en français, avec un code stable.** Un agent qui reçoit
 *    « Navigateur « chromium » introuvable … npx playwright install chromium »
 *    peut agir ; une erreur Playwright brute ne le peut pas.
 */

import { existsSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import {
  ArtifactError,
  BrowserError,
  BrowserLaunchError,
  BrowserNotStartedError,
  BrowserUnavailableError,
  NavigationError,
  TraceStateError,
  UnsupportedBrowserOperationError,
} from './errors.js';
import { countPdfPages, detectImageType, readImageDimensions } from './media.js';
import type {
  BrowserAvailability,
  BrowserContextLike,
  BrowserKind,
  BrowserLauncher,
  BrowserLike,
  BrowserSessionInfo,
  LaunchOptions,
  NavigationOptions,
  NavigationResult,
  PageLike,
  PdfOptions,
  PdfResult,
  PlaywrightModule,
  ScreenshotOptions,
  ScreenshotResult,
  TraceOptions,
  TraceResult,
  TraceStartOptions,
  WaitUntil,
} from './types.js';

/** Délai par défaut de toute opération réseau (30 s). */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Événement attendu par défaut. */
export const DEFAULT_WAIT_UNTIL: WaitUntil = 'load';

/** Marges PDF par défaut. */
export const DEFAULT_PDF_MARGIN = {
  top: '10mm',
  bottom: '10mm',
  left: '10mm',
  right: '10mm',
} as const;

/** Délai maximal de fermeture propre d'un navigateur (10 s). */
const CLOSE_TIMEOUT_MS = 10_000;

/**
 * Charge Playwright à la demande.
 *
 * L'import est dynamique : un processus qui n'inspecte aucune page (CLI,
 * serveur MCP de connaissances) ne paie ni le chargement du module ni la
 * résolution du registre de navigateurs.
 */
export async function loadPlaywright(): Promise<PlaywrightModule> {
  const module = (await import('playwright')) as unknown as PlaywrightModule;

  return module;
}

/**
 * Construit le lanceur réel.
 *
 * @param module - Module Playwright déjà chargé (tests, démarrage anticipé).
 */
export function createPlaywrightLauncher(module?: PlaywrightModule): BrowserLauncher {
  let cached: Promise<PlaywrightModule> | undefined;

  const getModule = (): Promise<PlaywrightModule> => {
    cached ??= module === undefined ? loadPlaywright() : Promise.resolve(module);

    return cached;
  };

  return {
    async executablePath(kind: BrowserKind): Promise<string> {
      const playwright = await getModule();

      return playwright[kind].executablePath();
    },

    async launch(kind: BrowserKind, options: LaunchOptions = {}): Promise<BrowserLike> {
      const playwright = await getModule();
      const browser = await playwright[kind].launch({
        headless: options.headless ?? true,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        ...(options.args === undefined ? {} : { args: [...options.args] }),
      });

      // Frontière assumée : les types complets de Playwright (`Browser`,
      // `BrowserContext`, `Page`) sont structurellement compatibles avec le
      // sous-ensemble utilisé, mais leur surface est trop large pour être
      // décrite ici champ par champ.
      return browser;
    },
  };
}

/**
 * Vérifie qu'un moteur est installé sur le poste.
 *
 * Playwright connaît le chemin attendu même quand le binaire est absent :
 * `existsSync` suffit donc à distinguer « pas encore téléchargé » de
 * « cassé », sans lancer de processus.
 *
 * @param kind - Moteur demandé.
 * @param launcher - Lanceur à interroger (défaut : Playwright réel).
 */
export async function checkBrowserAvailability(
  kind: BrowserKind,
  launcher: BrowserLauncher = createPlaywrightLauncher(),
): Promise<BrowserAvailability> {
  const executablePath = await launcher.executablePath(kind);

  return { kind, executablePath, installed: existsSync(executablePath) };
}

export interface NavigatorDependencies {
  /** Lanceur injecté ; défaut : Playwright réel. */
  readonly launcher?: BrowserLauncher;
  /** Horloge injectable (tests déterministes). */
  readonly now?: () => number;
  /** Délai maximal de fermeture du navigateur (défaut : 10 s). */
  readonly closeTimeoutMs?: number;
}

/**
 * Session de navigation unique.
 *
 * @example
 * ```ts
 * const navigator = new Navigator();
 * await navigator.start('chromium');
 * const page = await navigator.goto({ url: 'https://example.com' });
 * await navigator.screenshot({ path: 'artifacts/example.png', fullPage: true });
 * await navigator.stop();
 * ```
 */
export class Navigator {
  private browser: BrowserLike | null = null;
  private context: BrowserContextLike | null = null;
  private page: PageLike | null = null;
  private kind: BrowserKind | null = null;
  private headless = true;
  private startedAt = 0;
  private traceStartedAt: number | null = null;

  constructor(private readonly dependencies: NavigatorDependencies = {}) {}

  private now(): number {
    return this.dependencies.now?.() ?? Date.now();
  }

  private launcher(): BrowserLauncher {
    return this.dependencies.launcher ?? createPlaywrightLauncher();
  }

  /** Indique si une session est ouverte. */
  isStarted(): boolean {
    return this.browser !== null && this.page !== null;
  }

  /** Moteur courant, ou `null` avant `start()`. */
  getKind(): BrowserKind | null {
    return this.kind;
  }

  /**
   * Démarre un navigateur, un contexte et une page.
   *
   * @param kind - Moteur (défaut : `chromium`).
   * @param options - Options de lancement.
   * @throws {BrowserError} Session déjà ouverte.
   * @throws {BrowserUnavailableError} Binaire absent.
   * @throws {BrowserLaunchError} Lancement refusé pour une autre raison.
   */
  async start(
    kind: BrowserKind = 'chromium',
    options: LaunchOptions = {},
  ): Promise<BrowserSessionInfo> {
    if (this.isStarted()) {
      throw new BrowserError(
        `Un navigateur « ${this.kind!} » est déjà démarré : appelez stop() avant d'en ouvrir un autre.`,
        'BROWSER_ALREADY_STARTED',
      );
    }

    const launcher = this.launcher();
    let browser: BrowserLike;

    try {
      browser = await launcher.launch(kind, options);
    } catch (error) {
      throw await this.launchError(kind, launcher, error);
    }

    try {
      const context = await browser.newContext();
      context.setDefaultTimeout?.(DEFAULT_TIMEOUT_MS);
      context.setDefaultNavigationTimeout?.(DEFAULT_TIMEOUT_MS);
      const page = await context.newPage();

      this.browser = browser;
      this.context = context;
      this.page = page;
      this.kind = kind;
      this.headless = options.headless ?? true;
      this.startedAt = this.now();
    } catch (error) {
      await browser.close().catch(() => undefined);
      throw new BrowserLaunchError(kind, describeError(error), { cause: error });
    }

    return {
      kind,
      version: browser.version?.() ?? 'inconnue',
      headless: this.headless,
      startedAt: new Date(this.startedAt).toISOString(),
    };
  }

  /**
   * Ferme la session. Sans effet si le navigateur n'est pas démarré.
   *
   * La fermeture est bornée dans le temps : un navigateur bloqué ne doit pas
   * retenir le processus appelant indéfiniment.
   */
  async stop(): Promise<void> {
    const browser = this.browser;

    this.browser = null;
    this.context = null;
    this.page = null;
    this.kind = null;
    this.traceStartedAt = null;

    if (browser === null) {
      return;
    }

    await withTimeout(
      browser.close(),
      this.dependencies.closeTimeoutMs ?? CLOSE_TIMEOUT_MS,
      'Fermeture du navigateur',
    );
  }

  /**
   * Page courante.
   *
   * @throws {BrowserNotStartedError} Aucune session ouverte.
   */
  getPage(): PageLike {
    if (this.page === null) {
      throw new BrowserNotStartedError('getPage');
    }

    return this.page;
  }

  /** Page courante, ou `null` (utile pour les vérifications d'état). */
  getPageOrNull(): PageLike | null {
    return this.page;
  }

  /** URL courante. */
  getUrl(): string {
    return this.getPage().url();
  }

  /** Titre courant. */
  async getTitle(): Promise<string> {
    return await this.getPage().title();
  }

  /**
   * Ouvre une URL et attend l'événement demandé.
   *
   * @param options - URL, délai et événement d'attente.
   * @throws {BrowserNotStartedError} Aucune session ouverte.
   * @throws {NavigationError} Échec réseau, certificat, DNS ou délai dépassé.
   */
  async goto(options: NavigationOptions): Promise<NavigationResult> {
    const page = this.getPage();
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const waitUntil = options.waitUntil ?? DEFAULT_WAIT_UNTIL;
    const started = this.now();

    let response;

    try {
      response = await page.goto(options.url, { timeout, waitUntil });
    } catch (error) {
      throw new NavigationError(options.url, describeError(error), { cause: error });
    }

    const loadTime = this.now() - started;
    const title = await page.title().catch(() => '');
    const finalUrl = page.url();

    return {
      url: finalUrl,
      title,
      status: response?.status() ?? 0,
      loadTime,
      redirected: normaliseUrl(finalUrl) !== normaliseUrl(options.url),
    };
  }

  /**
   * Charge du HTML directement dans la page, sans requête réseau.
   *
   * Utile pour inspecter un fragment local (tests, page en cours de rédaction)
   * et pour les tests d'intégration hors ligne.
   *
   * @param html - Document complet.
   */
  async setContent(html: string, waitUntil: WaitUntil = 'load'): Promise<void> {
    await this.getPage().setContent(html, { waitUntil });
  }

  /**
   * Exécute une expression dans le contexte de la page.
   *
   * @param expression - Expression JavaScript (évaluée par le navigateur).
   */
  async evaluate<T = unknown>(expression: string): Promise<T> {
    return await this.getPage().evaluate<T>(expression);
  }

  /**
   * Capture l'écran et écrit le fichier.
   *
   * Les dimensions sont lues dans l'en-tête de l'image produite : c'est la
   * seule mesure exacte, y compris en capture pleine page où la hauteur dépasse
   * la fenêtre.
   *
   * @param options - Chemin, format, qualité et portée.
   */
  async screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    const page = this.getPage();
    const started = this.now();
    const type = options.type ?? 'png';

    await ensureParentDirectory(options.path);

    let buffer: Buffer;

    try {
      buffer = await page.screenshot({
        type,
        fullPage: options.fullPage ?? false,
        ...(type === 'jpeg' && options.quality !== undefined ? { quality: options.quality } : {}),
      });
      await writeFile(options.path, buffer);
    } catch (error) {
      throw new ArtifactError(options.path, describeError(error), { cause: error });
    }

    return {
      path: options.path,
      size: buffer.length,
      type: detectImageType(buffer),
      dimensions: readImageDimensions(buffer),
      duration: this.now() - started,
    };
  }

  /**
   * Démarre l'enregistrement d'une trace.
   *
   * Le fichier n'est pas connu à ce stade : Playwright n'écrit le ZIP qu'à
   * l'arrêt, dans `stopTrace()`. C'est la raison pour laquelle la configuration
   * du dossier de sortie appartient à `stopTrace`.
   *
   * @param options - Contenu à enregistrer.
   * @throws {TraceStateError} Une trace est déjà en cours.
   */
  async startTrace(options: TraceStartOptions = {}): Promise<void> {
    const context = this.context;

    if (context === null) {
      throw new BrowserNotStartedError('startTrace');
    }

    if (this.traceStartedAt !== null) {
      throw new TraceStateError('already-started');
    }

    await context.tracing.start({
      screenshots: options.screenshots ?? true,
      snapshots: options.snapshots ?? true,
      sources: options.sources ?? false,
      ...(options.title === undefined ? {} : { title: options.title }),
    });

    this.traceStartedAt = this.now();
  }

  /**
   * Arrête la trace et écrit le ZIP.
   *
   * @param options - Chemin du fichier.
   * @throws {TraceStateError} Aucune trace en cours.
   */
  async stopTrace(options: TraceOptions): Promise<TraceResult> {
    const context = this.context;

    if (context === null) {
      throw new BrowserNotStartedError('stopTrace');
    }

    if (this.traceStartedAt === null) {
      throw new TraceStateError('not-started');
    }

    const started = this.traceStartedAt;
    this.traceStartedAt = null;

    await ensureParentDirectory(options.path);

    try {
      await context.tracing.stop({ path: options.path });
    } catch (error) {
      throw new ArtifactError(options.path, describeError(error), { cause: error });
    }

    return {
      path: options.path,
      size: await fileSize(options.path),
      duration: this.now() - started,
    };
  }

  /**
   * Imprime la page en PDF.
   *
   * @param options - Chemin, format, orientation et marges.
   * @throws {UnsupportedBrowserOperationError} Moteur autre que Chromium.
   */
  async pdf(options: PdfOptions): Promise<PdfResult> {
    const page = this.getPage();

    if (this.kind !== 'chromium') {
      throw new UnsupportedBrowserOperationError('pdf', String(this.kind), ['chromium']);
    }

    const started = this.now();

    await ensureParentDirectory(options.path);

    let buffer: Buffer;

    try {
      buffer = await page.pdf({
        format: options.format ?? 'A4',
        landscape: options.landscape ?? false,
        margin: options.margin ?? DEFAULT_PDF_MARGIN,
        printBackground: options.printBackground ?? true,
      });
      await writeFile(options.path, buffer);
    } catch (error) {
      throw new ArtifactError(options.path, describeError(error), { cause: error });
    }

    return {
      path: options.path,
      size: buffer.length,
      pages: countPdfPages(buffer),
      duration: this.now() - started,
    };
  }

  /** Traduit un échec de lancement en erreur actionnable. */
  private async launchError(
    kind: BrowserKind,
    launcher: BrowserLauncher,
    error: unknown,
  ): Promise<BrowserError> {
    const detail = describeError(error);

    if (isMissingExecutable(detail)) {
      const executablePath = await launcher.executablePath(kind).catch(() => 'chemin inconnu');

      return new BrowserUnavailableError(kind, executablePath, { cause: error });
    }

    return new BrowserLaunchError(kind, detail, { cause: error });
  }
}

/** Taille d'un fichier, `0` s'il est absent (trace non écrite). */
async function fileSize(path: string): Promise<number> {
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
}

/** Crée le dossier parent d'un artefact, sans échouer s'il existe. */
async function ensureParentDirectory(path: string): Promise<void> {
  const directory = dirname(path);

  if (directory === '.' || directory === '') {
    return;
  }

  try {
    await mkdir(directory, { recursive: true });
  } catch (error) {
    throw new ArtifactError(path, `dossier « ${directory} » non créable`, { cause: error });
  }
}

/** Compare deux URL en ignorant la barre oblique finale. */
function normaliseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/** Message court d'une erreur inconnue, sans trace ni secret. */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    // Playwright préfixe souvent ses messages d'un bloc d'aide : seule la
    // première ligne est conservée pour rester lisible dans un journal JSON.
    const newline = error.message.indexOf('\n');
    const firstLine = (newline === -1 ? error.message : error.message.slice(0, newline)).trim();

    return firstLine.length > 0 ? firstLine : error.name;
  }

  return String(error);
}

/**
 * Reconnaît l'erreur « binaire absent » de Playwright.
 *
 * Le message dépend de la plateforme (« Executable doesn't exist at … »,
 * « Host system is missing dependencies »), d'où plusieurs motifs.
 */
function isMissingExecutable(detail: string): boolean {
  return /executable doesn'?t exist|missing dependencies|please run the following command/i.test(
    detail,
  );
}

/** Borne une promesse : au-delà du délai, l'erreur remonte mais n'est pas fatale. */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new BrowserError(`${label} expirée après ${String(timeoutMs)} ms`, 'BROWSER_LAUNCH_FAILED'),
      );
    }, timeoutMs);
    timer.unref();
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);

    // Si le délai a gagné, la promesse d'origine peut encore échouer : sans
    // ce gestionnaire, Node signalerait un rejet non capturé à l'arrêt.
    void promise.catch(() => undefined);
  }
}
