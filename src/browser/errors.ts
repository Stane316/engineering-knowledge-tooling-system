/**
 * Erreurs du module navigateur.
 *
 * Elles n'héritent volontairement pas de `EktsError` : `src/shared/errors.ts`
 * appartient au noyau MVP-1 et son union `EktsErrorCode` ne doit pas être
 * élargie pour un besoin du MVP-2. Les erreurs du navigateur portent donc leur
 * propre union de codes, stable, sur laquelle s'appuient la couche MCP
 * (`src/browser/playwright-mcp.ts`) et les tests.
 *
 * Toutes les erreurs contiennent un message **en français**, lisible tel quel
 * par un agent ou par un opérateur, et un `cause` optionnel pour conserver
 * l'erreur d'origine de Playwright.
 */

/** Codes stables des erreurs du module navigateur. */
export type BrowserErrorCode =
  | 'BROWSER_NOT_STARTED'
  | 'BROWSER_ALREADY_STARTED'
  | 'BROWSER_UNAVAILABLE'
  | 'BROWSER_LAUNCH_FAILED'
  | 'NAVIGATION_FAILED'
  | 'UNSUPPORTED_OPERATION'
  | 'TRACE_ALREADY_STARTED'
  | 'TRACE_NOT_STARTED'
  | 'ARTIFACT_FAILED'
  | 'ARTIFACT_PATH_ESCAPE'
  | 'URL_NOT_ALLOWED'
  | 'PRIVATE_NETWORK_BLOCKED';

/** Base commune : message français, code stable, cause préservée. */
export class BrowserError extends Error {
  constructor(
    message: string,
    readonly code: BrowserErrorCode,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }

  /** Représentation sérialisable (journal JSON, charge utile MCP). */
  toJSON(): { name: string; code: BrowserErrorCode; message: string } {
    return { name: this.name, code: this.code, message: this.message };
  }
}

/** Une opération a été demandée avant `start()` ou après `stop()`. */
export class BrowserNotStartedError extends BrowserError {
  constructor(operation: string) {
    super(
      `Navigateur non démarré : « ${operation} » exige un appel préalable à start().`,
      'BROWSER_NOT_STARTED',
    );
  }
}

/**
 * Le binaire du navigateur demandé n'est pas installé.
 *
 * Le message est celui qu'un opérateur doit lire : il contient la commande à
 * exécuter, sans quoi l'échec ressemble à un bug de code.
 */
export class BrowserUnavailableError extends BrowserError {
  constructor(
    readonly kind: string,
    readonly executablePath: string,
    options?: { cause?: unknown },
  ) {
    super(
      `Navigateur « ${kind} » introuvable (${executablePath}). Installez-le avec « npx playwright install ${kind} ».`,
      'BROWSER_UNAVAILABLE',
      options,
    );
  }
}

/** Échec du lancement (binaire présent mais contexte impossible à ouvrir). */
export class BrowserLaunchError extends BrowserError {
  constructor(
    readonly kind: string,
    detail: string,
    options?: { cause?: unknown },
  ) {
    super(`Lancement de « ${kind} » impossible : ${detail}`, 'BROWSER_LAUNCH_FAILED', options);
  }
}

/** Navigation échouée (URL invalide, DNS, certificat, délai dépassé). */
export class NavigationError extends BrowserError {
  constructor(
    readonly url: string,
    detail: string,
    options?: { cause?: unknown },
  ) {
    super(`Navigation vers « ${url} » échouée : ${detail}`, 'NAVIGATION_FAILED', options);
  }
}

/**
 * Opération non prise en charge par le moteur courant.
 *
 * Cas concret : `page.pdf()` n'existe que dans Chromium ; Firefox et WebKit
 * n'implémentent pas l'impression PDF.
 */
export class UnsupportedBrowserOperationError extends BrowserError {
  constructor(
    readonly operation: string,
    readonly kind: string,
    supported: readonly string[],
  ) {
    super(
      `« ${operation} » n'est pas disponible dans « ${kind} ». Utilisez ${supported.join(' ou ')}.`,
      'UNSUPPORTED_OPERATION',
    );
  }
}

/** Trace déjà en cours, ou arrêtée sans avoir été démarrée. */
export class TraceStateError extends BrowserError {
  constructor(state: 'already-started' | 'not-started') {
    super(
      state === 'already-started'
        ? 'Une trace est déjà en cours : arrêtez-la avant d’en démarrer une autre.'
        : 'Aucune trace en cours : appelez startTrace() avant stopTrace().',
      state === 'already-started' ? 'TRACE_ALREADY_STARTED' : 'TRACE_NOT_STARTED',
    );
  }
}

/** Écriture ou lecture d'un artefact (capture, trace, PDF) impossible. */
export class ArtifactError extends BrowserError {
  constructor(
    readonly path: string,
    detail: string,
    options?: { cause?: unknown; code?: 'ARTIFACT_FAILED' | 'ARTIFACT_PATH_ESCAPE' },
  ) {
    super(`Artefact « ${path} » : ${detail}`, options?.code ?? 'ARTIFACT_FAILED', options);
  }
}

/** URL refusée par la politique du module (schéma, hôte, réseau privé). */
export class UrlNotAllowedError extends BrowserError {
  constructor(
    readonly url: string,
    detail: string,
    code: 'URL_NOT_ALLOWED' | 'PRIVATE_NETWORK_BLOCKED' = 'URL_NOT_ALLOWED',
  ) {
    super(`URL refusée « ${url} » : ${detail}`, code);
  }
}
