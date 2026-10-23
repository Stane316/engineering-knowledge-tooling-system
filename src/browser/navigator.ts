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
 * Préférences Firefox qui neutralisent le bac à sable du processus de contenu.
 *
 * Constaté sur Windows 11 : le processus de contenu meurt à la création de la
 * page (`browserContext.newPage: Target crashed`) alors que le binaire Firefox
 * fonctionne. Le moteur démarre normalement dès que ce réglage est désactivé
 * (`docs/PLAYWRIGHT.md` §14.1).
 */
export const FIREFOX_UNSANDBOXED_PREFS = {
  'security.sandbox.content.level': 0,
} as const;

/** Variable lue par Firefox pour désactiver le bac à sable du contenu. */
const CONTENT_SANDBOX_ENV = 'MOZ_DISABLE_CONTENT_SANDBOX';

/** Variable d'environnement qui pilote le mode (`auto`, `on`, `off`). */
export const SANDBOX_ENV = 'EKTS_BROWSER_SANDBOX';

/**
 * Politique du bac à sable.
 *
 * - `auto` (défaut) : démarrage normal, puis repli documenté si Firefox plante ;
 * - `on` : jamais de repli — un plantage échoue, comme avant ;
 * - `off` : démarrer Firefox directement sans bac à sable.
 */
export type SandboxMode = 'auto' | 'on' | 'off';

/** Motifs par lesquels Playwright signale un processus de moteur mort. */
const CRASH_PATTERN =
  /target crashed|target closed|browser has been closed|browser has disconnected/i;

/** Session ouverte par `openSession`, avant affectation à l'instance. */
interface OpenedSession {
  browser: BrowserLike;
  context: BrowserContextLike;
  page: PageLike;
  sandboxDisabled: boolean;
}

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
        ...(options.firefoxUserPrefs === undefined
          ? {}
          : { firefoxUserPrefs: { ...options.firefoxUserPrefs } }),
        ...(options.env === undefined ? {} : { env: definedEntries(options.env) }),
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
  /** Politique du bac à sable (défaut : `EKTS_BROWSER_SANDBOX` ou `auto`). */
  readonly sandbox?: SandboxMode;
  /** Environnement injectable (tests hermétiques). */
  readonly env?: Readonly<Record<string, string | undefined>>;
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
    const mode = this.sandboxMode(options.sandbox);
    let session: OpenedSession;

    try {
      session = await this.openSession(kind, launcher, options, mode === 'off');
    } catch (error) {
      // Repli documenté : sur Windows, Firefox démarre puis son processus de
      // contenu meurt à la création de la page, alors que le même binaire
      // fonctionne sans bac à sable. Un seul nouvel essai, jamais silencieux :
      // `sandboxDisabled` et le message le disent.
      if (kind !== 'firefox' || mode !== 'auto' || !isCrash(error)) {
        throw error;
      }

      session = await this.openSession(kind, launcher, options, true);
    }

    this.browser = session.browser;
    this.context = session.context;
    this.page = session.page;
    this.kind = kind;
    this.headless = options.headless ?? true;
    this.startedAt = this.now();

    return {
      kind,
      version: session.browser.version?.() ?? 'inconnue',
      headless: this.headless,
      startedAt: new Date(this.startedAt).toISOString(),
      sandboxDisabled: session.sandboxDisabled,
    };
  }

  /**
   * Ouvre navigateur, contexte et page, en traduisant les erreurs.
   *
   * @param unsandboxed - Applique les préférences Firefox qui désactivent le
   *   bac à sable du contenu (sans effet sur les autres moteurs).
   */
  private async openSession(
    kind: BrowserKind,
    launcher: BrowserLauncher,
    options: LaunchOptions,
    unsandboxed: boolean,
  ): Promise<OpenedSession> {
    const compatible = unsandboxed && kind === 'firefox';
    const launchOptions = compatible
      ? {
          ...options,
          firefoxUserPrefs: { ...options.firefoxUserPrefs, ...FIREFOX_UNSANDBOXED_PREFS },
          env: { ...(options.env ?? this.environment()), [CONTENT_SANDBOX_ENV]: '1' },
        }
      : options;

    let browser: BrowserLike;

    try {
      browser = await launcher.launch(kind, launchOptions);
    } catch (error) {
      throw await this.launchError(kind, launcher, error);
    }

    try {
      const context = await browser.newContext(options.context);
      context.setDefaultTimeout?.(DEFAULT_TIMEOUT_MS);
      context.setDefaultNavigationTimeout?.(DEFAULT_TIMEOUT_MS);
      const page = await context.newPage();

      return { browser, context, page, sandboxDisabled: compatible };
    } catch (error) {
      // Le moteur a démarré mais la page n'a pas pu être créée : il faut
      // libérer le processus. La fermeture est bornée, car un moteur qui vient
      // de planter ne répond plus et retiendrait `start()` indéfiniment.
      const closeTimeoutMs = this.dependencies.closeTimeoutMs ?? CLOSE_TIMEOUT_MS;

      await withTimeout(browser.close(), closeTimeoutMs, 'Fermeture du navigateur').catch(() => {
        browser.process?.()?.kill('SIGKILL');
      });
      throw new BrowserLaunchError(kind, `${describeError(error)}${crashHint(error)}`, {
        cause: error,
      });
    }
  }

  /** Environnement effectif (injectable pour les tests). */
  private environment(): Record<string, string> {
    return definedEntries(this.dependencies.env ?? process.env);
  }

  /**
   * Résout la politique du bac à sable.
   *
   * Priorité : option explicite (`options.sandbox`), puis dépendance injectée,
   * puis variable d'environnement, puis `auto`.
   */
  private sandboxMode(requested: boolean | undefined): SandboxMode {
    if (requested === false) {
      return 'off';
    }

    if (requested === true) {
      return 'on';
    }

    const configured =
      this.dependencies.sandbox ?? this.dependencies.env?.[SANDBOX_ENV] ?? process.env[SANDBOX_ENV];

    return parseSandboxMode(configured);
  }

  /**
   * Ferme la session. Sans effet si le navigateur n'est pas démarré.
   *
   * **La fermeture ne lève jamais.** Trois raisons :
   *
   * 1. `stop()` est un nettoyage : une erreur ici masquerait celle qui a
   *    provoqué l'arrêt, et ferait échouer un `afterAll` dont les tests sont
   *    déjà verts ;
   * 2. l'ordre compte : page, puis contexte, puis navigateur. Fermer le
   *    navigateur d'abord laisse Playwright attendre des pages encore
   *    ouvertes, ce qui dépasse le délai sur une machine chargée ;
   * 3. un moteur planté ne répond plus du tout : après le délai, le processus
   *    est tué (`browser.process().kill()`), sinon il resterait en vie et
   *    retiendrait ses fichiers sous Windows.
   */
  async stop(): Promise<void> {
    const page = this.page;
    const context = this.context;
    const browser = this.browser;

    this.browser = null;
    this.context = null;
    this.page = null;
    this.kind = null;
    this.traceStartedAt = null;

    if (browser === null) {
      return;
    }

    const timeoutMs = this.dependencies.closeTimeoutMs ?? CLOSE_TIMEOUT_MS;

    await closeQuietly(page, timeoutMs);
    await closeQuietly(context, timeoutMs);

    try {
      await withTimeout(browser.close(), timeoutMs, 'Fermeture du navigateur');
    } catch {
      browser.process?.()?.kill('SIGKILL');
    }
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

    return new BrowserLaunchError(kind, `${detail}${crashHint(error)}`, { cause: error });
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
 * Conseil ajouté aux messages de plantage du moteur.
 *
 * Playwright signale un processus mort par « Target crashed » ou « Target
 * closed », sans jamais dire pourquoi : binaire incomplet, antivirus qui tue le
 * processus de contenu, bac à sable incompatible. Le message renvoie donc vers
 * la commande qui tranche entre ces causes.
 */
function crashHint(error: unknown): string {
  const detail = describeError(error);

  if (
    !/target crashed|target closed|browser has been closed|browser has disconnected/i.test(detail)
  ) {
    return '';
  }

  return (
    ' — le processus du moteur a planté. Lancez « npm run doctor:browsers » :' +
    ' il distingue un binaire incomplet (« npx playwright install --force <moteur> »),' +
    ' un antivirus trop zélé et un bac à sable incompatible' +
    " (« firefoxUserPrefs: { 'security.sandbox.content.level': 0 } »)."
  );
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

/**
 * Copie les variables d'environnement définies.
 *
 * `process.env` autorise `undefined` ; Playwright, non. Filtrer évite de
 * transmettre des clés absentes, que le moteur interpréterait comme vides.
 */
function definedEntries(
  source: Readonly<Record<string, string | undefined>>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/** Normalise la valeur de `EKTS_BROWSER_SANDBOX`. */
function parseSandboxMode(value: string | undefined): SandboxMode {
  const normalised = (value ?? '').trim().toLowerCase();

  if (normalised === 'off' || normalised === '0' || normalised === 'false') {
    return 'off';
  }

  if (normalised === 'on' || normalised === '1' || normalised === 'true') {
    return 'on';
  }

  return 'auto';
}

/**
 * Indique si l'erreur traduite vient d'un processus de moteur mort.
 *
 * Seul `BrowserLaunchError` peut porter ce message : les erreurs de lancement
 * sont traduites par `openSession` avant d'arriver ici.
 */
function isCrash(error: unknown): boolean {
  return error instanceof BrowserLaunchError && CRASH_PATTERN.test(error.message);
}

/**
 * Ferme une page ou un contexte sans jamais échouer.
 *
 * Un moteur planté lève « Target page, context or browser has been closed » sur
 * chaque fermeture : c'est attendu pendant un nettoyage et ne doit pas
 * interrompre la fermeture du navigateur.
 */
async function closeQuietly(
  target: { close(): Promise<void> } | null,
  timeoutMs: number,
): Promise<void> {
  if (target === null) {
    return;
  }

  try {
    await withTimeout(target.close(), timeoutMs, 'Fermeture de la page');
  } catch {
    // Déjà fermée ou moteur mort : rien à récupérer.
  }
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
