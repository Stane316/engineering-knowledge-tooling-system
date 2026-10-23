/**
 * Fixtures de l'inspecteur multi-niveaux.
 *
 * Les tests unitaires n'ouvrent aucun navigateur : ils fournissent une session
 * factice, une photographie de DOM écrite à la main et des exécutants
 * Lighthouse / axe-core déterministes. Le but est de vérifier les décisions
 * (seuils, scores, dégradations), pas le rendu de Playwright.
 */

import { vi } from 'vitest';

import type { AxeRunner } from '../../../src/browser/axe.js';
import type { InspectorSession } from '../../../src/browser/inspection/inspector.js';
import type { InspectionSession, PageSnapshot } from '../../../src/browser/inspection/types.js';
import type {
  BrowserSessionInfo,
  LaunchOptions,
  NavigationResult,
} from '../../../src/browser/types.js';
import { createFakePage } from '../helpers.js';
import type { LighthouseReport, LighthouseRunner } from '../../../src/browser/lighthouse.js';

/** Photographie de DOM complète et valide, servant de référence. */
export const SNAPSHOT: PageSnapshot = {
  language: 'fr',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Ekts/1.0',
  title: 'Guide des outils de connaissance',
  description:
    'Un guide pratique pour choisir, installer et exploiter les outils de gestion des connaissances techniques.',
  canonical: 'https://exemple.fr/guide',
  robots: 'index,follow',
  viewportMeta: 'width=device-width, initial-scale=1',
  openGraph: { 'og:title': 'Guide', 'og:description': 'Description Open Graph' },
  twitter: { 'twitter:card': 'summary' },
  headings: [
    { level: 1, text: 'Guide des outils' },
    { level: 2, text: 'Choisir un outil' },
    { level: 2, text: 'Installer' },
  ],
  links: [
    { href: 'https://exemple.fr/a', text: 'Interne', external: false },
    { href: 'https://autre.fr/b', text: 'Externe', external: true },
  ],
  images: [
    { src: 'https://exemple.fr/logo.png', alt: 'Logo', width: 120, height: 40, lazy: false },
    {
      src: 'https://exemple.fr/illu.png',
      alt: 'Illustration',
      width: 800,
      height: 600,
      lazy: true,
    },
  ],
  landmarks: { main: 1, nav: 1, header: 1, footer: 1 },
  structuredDataBlocks: 1,
  paragraphs: 8,
  lists: 3,
  tables: 1,
  buttons: 4,
  inputs: 3,
  labelledInputs: 3,
  iframes: 0,
  text: `${'Les outils de gestion des connaissances techniques permettent de retrouver une décision. '.repeat(40)}`,
};

/** Photographie minimale : page presque vide, pour les seuils bas. */
export const SPARSE_SNAPSHOT: PageSnapshot = {
  language: null,
  userAgent: '',
  title: '',
  description: null,
  canonical: null,
  robots: null,
  viewportMeta: null,
  openGraph: {},
  twitter: {},
  headings: [],
  links: [],
  images: [],
  landmarks: { main: 0, nav: 0, header: 0, footer: 0 },
  structuredDataBlocks: 0,
  paragraphs: 0,
  lists: 0,
  tables: 0,
  buttons: 0,
  inputs: 0,
  labelledInputs: 0,
  iframes: 0,
  text: '',
};

/** Résultat de navigation factice. */
export const NAVIGATION: NavigationResult = {
  url: 'https://exemple.fr/guide',
  title: 'Guide des outils de connaissance',
  status: 200,
  loadTime: 120,
  redirected: false,
};

/** Arbre ARIA minimal produisant deux violations (image et bouton sans nom). */
export const ARIA_SNAPSHOT = {
  role: 'WebArea',
  name: 'Guide des outils',
  children: [
    { role: 'heading', name: 'Guide des outils', level: 1 },
    { role: 'img' },
    { role: 'button' },
  ],
};

/** Options de session factice. */
export interface FakeSessionOptions {
  readonly navigation?: Partial<NavigationResult>;
  readonly ariaSnapshot?: unknown;
  readonly ariaSnapshotError?: unknown;
  readonly snapshot?: unknown;
  readonly evaluateError?: unknown;
  readonly screenshotError?: unknown;
  readonly traceError?: unknown;
  readonly pdfError?: unknown;
  readonly sandboxDisabled?: boolean;
  readonly startError?: unknown;
}

/**
 * Session d'inspection factice.
 *
 * Elle enregistre les appels utiles (`start`, `goto`, `screenshot`, `stop`) et
 * renvoie les valeurs demandées ; `vi.fn` permet de vérifier l'ordre et les
 * arguments sans espionner Playwright.
 */
export function createInspectionSession(options: FakeSessionOptions = {}) {
  const page = createFakePage({
    snapshot: options.ariaSnapshot ?? ARIA_SNAPSHOT,
    evaluate: options.snapshot ?? SNAPSHOT,
    ...(options.ariaSnapshotError === undefined
      ? {}
      : { ariaSnapshotError: options.ariaSnapshotError }),
    ...(options.evaluateError === undefined ? {} : { evaluateError: options.evaluateError }),
  });
  const calls = {
    start: vi.fn(async (_kind: string, _options?: LaunchOptions) => undefined),
    stop: vi.fn(async () => undefined),
    goto: vi.fn(async (_params: { url: string }) => undefined),
    screenshot: vi.fn(async (_options: { path: string }) => undefined),
    startTrace: vi.fn(async (_options?: unknown) => undefined),
    stopTrace: vi.fn(async (_options: { path: string }) => undefined),
    pdf: vi.fn(async (_options: { path: string }) => undefined),
    state: { stopped: false },
  };

  const session: InspectorSession = {
    start: async (kind, launchOptions) => {
      calls.start(kind, launchOptions);

      if (options.startError !== undefined) {
        throw options.startError;
      }

      const info: BrowserSessionInfo = {
        kind,
        version: '1.0.0-fake',
        headless: true,
        startedAt: '2026-10-23T00:00:00.000Z',
        sandboxDisabled: options.sandboxDisabled ?? false,
      };

      return info;
    },
    stop: async () => {
      calls.state.stopped = true;
      await calls.stop();
    },
    goto: async (navigationOptions) => {
      await calls.goto(navigationOptions);

      return { ...NAVIGATION, ...options.navigation };
    },
    screenshot: async (screenshotOptions) => {
      await calls.screenshot(screenshotOptions);

      if (options.screenshotError !== undefined) {
        throw options.screenshotError;
      }

      return {
        path: screenshotOptions.path,
        size: 1024,
        type: 'png' as const,
        dimensions: { width: 1920, height: 1080 },
        duration: 12,
      };
    },
    startTrace: async (traceOptions) => {
      await calls.startTrace(traceOptions);
    },
    stopTrace: async (traceOptions) => {
      await calls.stopTrace(traceOptions);

      if (options.traceError !== undefined) {
        throw options.traceError;
      }

      return { path: traceOptions.path, size: 2048, duration: 40 };
    },
    pdf: async (pdfOptions) => {
      await calls.pdf(pdfOptions);

      if (options.pdfError !== undefined) {
        throw options.pdfError;
      }

      return { path: pdfOptions.path, size: 4096, pages: 2, duration: 30 };
    },
    getPage: () => page,
  };

  return { session, calls };
}

/** Session réduite à `InspectionSession`, pour tester les niveaux isolément. */
export function createLevelSession(options: FakeSessionOptions = {}): {
  readonly session: InspectionSession;
  readonly calls: ReturnType<typeof createInspectionSession>['calls'];
} {
  const created = createInspectionSession(options);

  return { session: created.session, calls: created.calls };
}

/** Rapport Lighthouse minimal mais complet. */
export function lighthouseReport(overrides: Partial<LighthouseReport> = {}): LighthouseReport {
  return {
    finalDisplayedUrl: 'https://exemple.fr/guide',
    lighthouseVersion: '12.8.2',
    categories: {
      performance: { score: 0.92 },
      seo: {
        score: 0.8,
        auditRefs: [{ id: 'meta-description' }, { id: 'is-crawlable' }, { id: 'link-text' }],
      },
    },
    audits: {
      'largest-contentful-paint': { id: 'largest-contentful-paint', numericValue: 1832.4 },
      'interaction-to-next-paint': { id: 'interaction-to-next-paint', numericValue: 120.6 },
      'cumulative-layout-shift': { id: 'cumulative-layout-shift', numericValue: 0.054 },
      'server-response-time': { id: 'server-response-time', numericValue: 210.5 },
      'first-contentful-paint': { id: 'first-contentful-paint', numericValue: 1200 },
      'speed-index': { id: 'speed-index', numericValue: 2400 },
      'meta-description': {
        id: 'meta-description',
        title: 'La page a une description',
        description: 'Ajoutez une description.',
        score: 0,
      },
      'is-crawlable': {
        id: 'is-crawlable',
        title: 'La page est indexable',
        description: 'Les moteurs peuvent indexer la page.',
        score: 0.5,
      },
      'link-text': {
        id: 'link-text',
        title: 'Les liens ont un texte',
        description: 'Un texte de lien explicite aide le référencement.',
        score: 1,
      },
    },
    ...overrides,
  };
}

/** Exécutant Lighthouse factice : renvoie le rapport, ou l'erreur demandée. */
export function createLighthouseRunner(
  report: LighthouseReport = lighthouseReport(),
  error?: unknown,
): { runner: LighthouseRunner; run: ReturnType<typeof vi.fn> } {
  const run = vi.fn(async (_target: unknown, _options?: unknown) => {
    if (error !== undefined) {
      throw error;
    }

    return { lhr: report };
  });

  return { runner: { run } as LighthouseRunner, run };
}

/** Exécutant axe-core factice. */
export function createAxeRunner(results?: {
  violations?: readonly Record<string, unknown>[];
  passes?: readonly unknown[];
  inapplicable?: readonly unknown[];
  error?: unknown;
}): { runner: AxeRunner; run: ReturnType<typeof vi.fn> } {
  const run = vi.fn(async () => {
    if (results?.error !== undefined) {
      throw results.error;
    }

    return {
      violations: results?.violations ?? [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Contraste insuffisant',
          help: 'Augmenter le contraste',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [{}, {}, {}],
        },
        {
          id: 'label',
          impact: null,
          description: 'Champ sans étiquette',
          help: 'Ajouter une étiquette',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/label',
          tags: ['wcag2a', 'wcag412'],
          nodes: [{}],
        },
      ],
      passes: results?.passes ?? [{}, {}, {}, {}],
      inapplicable: results?.inapplicable ?? [{}],
    };
  });

  return { runner: { run } as AxeRunner, run };
}
