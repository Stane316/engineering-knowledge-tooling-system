/**
 * Contrats du module navigateur.
 *
 * Le module ne dépend pas des types complets de Playwright à l'exécution : il
 * décrit le **sous-ensemble** réellement utilisé (`PageLike`, `ContextLike`,
 * `BrowserLike`, `BrowserTypeLike`). Deux bénéfices :
 *
 * 1. les tests unitaires injectent des doublures sans lancer de navigateur ;
 * 2. une montée de version de Playwright ne peut casser que le point de contact
 *    (`createPlaywrightLauncher`), pas la logique de navigation.
 *
 * Les noms de champs de l'accessibility tree suivent ceux de
 * `ariaSnapshotJSON()` : `role`, `name`, `text`, `children`, `level`, `url`,
 * `checked`, `disabled`, `expanded`, `selected`, `pressed`.
 */

/** Moteurs pris en charge par Playwright. */
export type BrowserKind = 'chromium' | 'firefox' | 'webkit';

/** Moteurs disponibles, dans l'ordre de documentation. */
export const BROWSER_KINDS: readonly BrowserKind[] = ['chromium', 'firefox', 'webkit'];

/** Événement attendu avant de considérer la navigation terminée. */
export type WaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit';

/** Paramètres de lancement du navigateur. */
export interface LaunchOptions {
  /** Mode sans interface (défaut : `true`). */
  readonly headless?: boolean;
  /** Délai maximal de lancement en millisecondes (défaut : 30 000). */
  readonly timeoutMs?: number;
  /** Arguments supplémentaires passés au moteur. */
  readonly args?: readonly string[];
  /**
   * Préférences Firefox (`about:config`), ignorées par les autres moteurs.
   *
   * Sert aux environnements où le bac à sable du processus de contenu fait
   * planter le moteur (`Target crashed`) :
   * `{ 'security.sandbox.content.level': 0 }`.
   */
  readonly firefoxUserPrefs?: Readonly<Record<string, string | number | boolean>>;
}

/** Informations sur une session ouverte. */
export interface BrowserSessionInfo {
  readonly kind: BrowserKind;
  readonly version: string;
  readonly headless: boolean;
  readonly startedAt: string;
}

/** Options de navigation. */
export interface NavigationOptions {
  /** URL absolue à ouvrir. */
  readonly url: string;
  /** Délai maximal en millisecondes (défaut : 30 000). */
  readonly timeout?: number;
  /** Événement attendu (défaut : `load`). */
  readonly waitUntil?: WaitUntil;
}

/** Résultat d'une navigation. */
export interface NavigationResult {
  /** URL finale, après redirections. */
  readonly url: string;
  /** Titre du document. */
  readonly title: string;
  /** Code HTTP de la réponse principale (`0` si aucune réponse). */
  readonly status: number;
  /** Durée mesurée entre l'appel et la fin du chargement. */
  readonly loadTime: number;
  /** `true` si l'URL finale diffère de l'URL demandée. */
  readonly redirected: boolean;
}

/** Options de capture d'écran. */
export interface ScreenshotOptions {
  /** Chemin du fichier à écrire (le dossier parent est créé). */
  readonly path: string;
  /** Format (défaut : `png`). */
  readonly type?: 'png' | 'jpeg';
  /** Qualité JPEG (1-100) ; ignorée pour PNG, comme l'exige Playwright. */
  readonly quality?: number;
  /** Capture de la page entière (défaut : `false`). */
  readonly fullPage?: boolean;
}

/** Dimensions d'une image. */
export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/** Résultat d'une capture d'écran. */
export interface ScreenshotResult {
  readonly path: string;
  readonly size: number;
  readonly type: 'png' | 'jpeg' | 'unknown';
  readonly dimensions: ImageDimensions;
  /** Durée de la capture et de l'écriture disque. */
  readonly duration: number;
}

/** Options de démarrage d'une trace. */
export interface TraceStartOptions {
  /** Inclure les captures (défaut : `true`). */
  readonly screenshots?: boolean;
  /** Inclure les instantanés DOM (défaut : `true`). */
  readonly snapshots?: boolean;
  /** Inclure les sources (défaut : `false`). */
  readonly sources?: boolean;
  /** Titre lisible dans le lecteur de traces. */
  readonly title?: string;
}

/** Options d'arrêt d'une trace. */
export interface TraceOptions {
  /** Fichier ZIP à écrire. */
  readonly path: string;
}

/** Résultat d'une trace. */
export interface TraceResult {
  readonly path: string;
  readonly size: number;
  /** Durée d'enregistrement, du `startTrace()` au `stopTrace()`. */
  readonly duration: number;
}

/** Formats de page acceptés par Chromium. */
export type PdfFormat = 'A4' | 'A3' | 'Letter' | 'Legal';

/** Marges d'impression. */
export interface PdfMargin {
  readonly top?: string;
  readonly right?: string;
  readonly bottom?: string;
  readonly left?: string;
}

/** Options de génération PDF. */
export interface PdfOptions {
  /** Fichier PDF à écrire. */
  readonly path: string;
  /** Format de page (défaut : `A4`). */
  readonly format?: PdfFormat;
  /** Orientation paysage (défaut : `false`). */
  readonly landscape?: boolean;
  /** Marges (défaut : 10 mm de chaque côté). */
  readonly margin?: PdfMargin;
  /** Imprimer les arrière-plans (défaut : `true`). */
  readonly printBackground?: boolean;
}

/** Résultat d'une génération PDF. */
export interface PdfResult {
  readonly path: string;
  readonly size: number;
  /** Nombre de pages, lu dans la structure du PDF. */
  readonly pages: number;
  readonly duration: number;
}

/**
 * Nœud de l'accessibility tree, normalisé.
 *
 * Les champs facultatifs ne sont présents que lorsque Playwright les expose :
 * l'absence d'un champ doit être interprétée comme « non applicable », jamais
 * comme « faux ».
 */
export interface AccessibilityNode {
  /** Rôle ARIA (`heading`, `link`, `text`…). */
  readonly role: string;
  /** Nom accessible. */
  readonly name?: string;
  /** Description accessible. */
  readonly description?: string;
  /** Texte propre au nœud (fragment de texte ou contenu unique). */
  readonly text?: string;
  /** Valeur d'un champ de formulaire. */
  readonly value?: string | number;
  /** Niveau de titre (1-6). */
  readonly level?: number;
  /** URL d'un lien. */
  readonly url?: string;
  /** État coché. */
  readonly checked?: boolean | 'mixed';
  /** État désactivé. */
  readonly disabled?: boolean;
  /** État déplié. */
  readonly expanded?: boolean;
  /** État sélectionné. */
  readonly selected?: boolean;
  /** État pressé. */
  readonly pressed?: boolean | 'mixed';
  /** Enfants, dans l'ordre du document. */
  readonly children?: readonly AccessibilityNode[];
}

/** Résultat d'une extraction de l'accessibility tree. */
export interface AccessibilityResult {
  readonly root: AccessibilityNode;
  readonly nodeCount: number;
  /** Profondeur maximale effectivement parcourue. */
  readonly maxDepth: number;
  /** Durée de l'extraction et de la normalisation. */
  readonly extractionTime: number;
  readonly url: string;
  readonly title: string;
  /** `true` si un garde-fou (profondeur ou nombre de nœuds) a tronqué l'arbre. */
  readonly truncated: boolean;
}

/** Gravité d'une violation, vocabulaire axe-core (repris au Sprint 9). */
export type ViolationImpact = 'minor' | 'moderate' | 'serious' | 'critical';

/** Violation détectée à partir de l'accessibility tree. */
export interface AccessibilityViolation {
  /** Identifiant de règle (`image-alt`, `button-name`…). */
  readonly rule: string;
  readonly impact: ViolationImpact;
  /** Chemin de rôles depuis la racine (`document > main > h1`). */
  readonly path: string;
  /** Rôle du nœud fautif. */
  readonly role: string;
  /** Nom accessible, s'il existe. */
  readonly name?: string;
  /** Message en français, destiné au rapport d'inspection. */
  readonly message: string;
}

/** Rapport d'accessibilité calculé hors navigateur. */
export interface AccessibilityReport {
  readonly url: string;
  readonly title: string;
  readonly nodeCount: number;
  readonly violations: readonly AccessibilityViolation[];
  /** Nombre de violations par gravité. */
  readonly summary: Readonly<Record<ViolationImpact, number>>;
}

/** Options d'extraction. */
export interface AccessibilityExtractOptions {
  /** Profondeur maximale à conserver (défaut : 64). */
  readonly maxDepth?: number;
  /** Nombre maximal de nœuds (défaut : 20 000). */
  readonly maxNodes?: number;
}

/** Réponse HTTP minimale exposée par Playwright. */
export interface GotoResponseLike {
  status(): number;
  url(): string;
}

/**
 * Sous-ensemble de page suffisant pour l'accessibility tree.
 *
 * `Accessibility` ne dépend que de ces quatre méthodes : lui donner `PageLike`
 * entier obligerait la couche MCP à exposer une page complète alors qu'elle ne
 * lit que l'arbre.
 */
export interface AccessibilityPageLike {
  url(): string;
  title(): Promise<string>;
  ariaSnapshotJSON(options?: { depth?: number; boxes?: boolean }): Promise<unknown>;
  evaluate<T = unknown>(expression: string, arg?: unknown): Promise<T>;
}

/**
 * Page Playwright réduite à ce que le module utilise.
 *
 * `evaluate` reçoit une **expression** (chaîne) et non une fonction : c'est le
 * seul moyen de garder une signature compatible avec les doublures de test,
 * tout en exécutant du code dans le contexte de la page.
 */
export interface PageLike extends AccessibilityPageLike {
  goto(
    url: string,
    options?: { timeout?: number; waitUntil?: WaitUntil },
  ): Promise<GotoResponseLike | null>;
  screenshot(options?: {
    type?: 'png' | 'jpeg';
    quality?: number;
    fullPage?: boolean;
  }): Promise<Buffer>;
  pdf(options?: {
    format?: string;
    landscape?: boolean;
    margin?: PdfMargin;
    printBackground?: boolean;
  }): Promise<Buffer>;
  setContent(html: string, options?: { waitUntil?: WaitUntil; timeout?: number }): Promise<void>;
  close(): Promise<void>;
}

/** Tracing Playwright (API stable depuis 1.12). */
export interface TracingLike {
  start(options?: {
    screenshots?: boolean;
    snapshots?: boolean;
    sources?: boolean;
    title?: string;
  }): Promise<void>;
  stop(options?: { path?: string }): Promise<void>;
}

/** Contexte de navigation. */
export interface BrowserContextLike {
  newPage(): Promise<PageLike>;
  readonly tracing: TracingLike;
  setDefaultTimeout?(timeout: number): void;
  setDefaultNavigationTimeout?(timeout: number): void;
  close(): Promise<void>;
}

/** Navigateur lancé. */
export interface BrowserLike {
  newContext(options?: {
    viewport?: { width: number; height: number };
  }): Promise<BrowserContextLike>;
  version?(): string;
  close(): Promise<void>;
  /**
   * Processus natif du moteur, quand Playwright l'expose.
   *
   * Utilisé en dernier recours par `Navigator.stop()` : un moteur bloqué ne
   * répond plus à `close()`, et seul un arrêt forcé libère le processus.
   */
  process?(): { kill(signal?: string): boolean } | null;
}

/** Moteur Playwright (chromium, firefox, webkit). */
export interface BrowserTypeLike {
  executablePath(): string;
  launch(options?: {
    headless?: boolean;
    timeout?: number;
    args?: string[];
    firefoxUserPrefs?: Record<string, string | number | boolean>;
  }): Promise<BrowserLike>;
}

/** Module `playwright` réduit à ses trois moteurs. */
export interface PlaywrightModule {
  readonly chromium: BrowserTypeLike;
  readonly firefox: BrowserTypeLike;
  readonly webkit: BrowserTypeLike;
}

/**
 * Indirection de lancement.
 *
 * Séparer le lancement de la logique de navigation permet d'injecter une
 * doublure en test, et de remplacer Playwright par un autre moteur sans toucher
 * à `Navigator`.
 */
export interface BrowserLauncher {
  executablePath(kind: BrowserKind): Promise<string>;
  launch(kind: BrowserKind, options?: LaunchOptions): Promise<BrowserLike>;
}

/** Disponibilité d'un moteur sur le poste. */
export interface BrowserAvailability {
  readonly kind: BrowserKind;
  readonly executablePath: string;
  readonly installed: boolean;
}
