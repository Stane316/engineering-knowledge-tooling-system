/**
 * Doublures et fixtures du module navigateur.
 *
 * Aucun test unitaire ne lance de navigateur : Playwright n'est pas installable
 * partout (l'environnement d'intégration continue n'a pas de binaires), et un
 * test qui dépend du réseau n'est pas un test. Les doublures ci-dessous
 * reproduisent uniquement les méthodes réellement appelées par le code.
 */

import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { vi } from 'vitest';

import type { BrowserSession } from '../../src/browser/playwright-mcp.js';
import type {
  BrowserContextLike,
  BrowserKind,
  BrowserLauncher,
  BrowserLike,
  PageLike,
  PlaywrightModule,
  TracingLike,
} from '../../src/browser/types.js';

/** Crée un dossier temporaire propre à un test. */
export function tempDir(prefix = 'ekts-browser-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Construit un PNG minimal mais valide quant à son en-tête IHDR.
 *
 * Seuls les octets lus par `readPngDimensions` sont significatifs : signature,
 * longueur du chunk IHDR, type, largeur et hauteur.
 */
export function pngBuffer(width = 800, height = 600): Buffer {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);

  return buffer;
}

/**
 * Construit un JPEG minimal : SOI, APP0 puis SOF0 portant les dimensions.
 */
export function jpegBuffer(width = 640, height = 480): Buffer {
  const app0 = Buffer.from([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01,
    0x00, 0x00,
  ]);
  const sof = Buffer.from([
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x00, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01,
    0x03, 0x11, 0x01,
  ]);
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);

  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof, Buffer.from([0xff, 0xd9])]);
}

/** Construit un PDF synthétique contenant `pages` objets `/Type /Page`. */
export function pdfBuffer(pages = 1): Buffer {
  const objects = Array.from(
    { length: pages },
    (_, index) => `${String(index + 3)} 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj\n`,
  ).join('');
  const content = `%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count ${String(pages)} >>\nendobj\n${objects}trailer\n<< /Root 1 0 R >>\n%%EOF\n`;

  return Buffer.from(content, 'latin1');
}

export interface FakePage extends PageLike {
  readonly calls: {
    goto: ReturnType<typeof vi.fn>;
    screenshot: ReturnType<typeof vi.fn>;
    pdf: ReturnType<typeof vi.fn>;
    ariaSnapshotJSON: ReturnType<typeof vi.fn>;
    setContent: ReturnType<typeof vi.fn>;
    evaluate: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
}

export interface FakePageOptions {
  readonly status?: number;
  readonly finalUrl?: string;
  readonly title?: string;
  readonly screenshot?: Buffer;
  readonly pdf?: Buffer;
  readonly snapshot?: unknown;
  readonly evaluate?: unknown;
  readonly gotoError?: unknown;
  readonly titleError?: unknown;
  readonly screenshotError?: unknown;
  readonly pdfError?: unknown;
  readonly ariaSnapshotError?: unknown;
}

/** Page Playwright factice, pilotée par options. */
export function createFakePage(options: FakePageOptions = {}): FakePage {
  let currentUrl = options.finalUrl ?? 'https://example.com/';

  const calls = {
    goto: vi.fn(),
    screenshot: vi.fn(),
    pdf: vi.fn(),
    ariaSnapshotJSON: vi.fn(),
    setContent: vi.fn(),
    evaluate: vi.fn(),
    close: vi.fn(),
  };

  const page: FakePage = {
    calls,
    url: () => currentUrl,
    title: async () => {
      if (options.titleError !== undefined) {
        throw options.titleError;
      }

      return options.title ?? 'Example Domain';
    },
    goto: async (url, params) => {
      calls.goto(url, params);

      if (options.gotoError !== undefined) {
        throw options.gotoError;
      }

      currentUrl = options.finalUrl ?? url;

      if (options.status === undefined) {
        return null;
      }

      return { status: () => options.status ?? 200, url: () => currentUrl };
    },
    screenshot: async (params) => {
      calls.screenshot(params);

      if (options.screenshotError !== undefined) {
        throw options.screenshotError;
      }

      return options.screenshot ?? pngBuffer();
    },
    pdf: async (params) => {
      calls.pdf(params);

      if (options.pdfError !== undefined) {
        throw options.pdfError;
      }

      return options.pdf ?? pdfBuffer(2);
    },
    ariaSnapshotJSON: async (params) => {
      calls.ariaSnapshotJSON(params);

      if (options.ariaSnapshotError !== undefined) {
        throw options.ariaSnapshotError;
      }

      return 'snapshot' in options ? options.snapshot : { role: 'WebArea', name: 'Example Domain' };
    },
    setContent: async (html, params) => {
      calls.setContent(html, params);
      currentUrl = 'about:blank';
    },
    evaluate: async <T = unknown>(expression: string): Promise<T> => {
      calls.evaluate(expression);

      return (options.evaluate ?? true) as T;
    },
    close: async () => {
      calls.close();
    },
  };

  return page;
}

/** Contexte factice ; `tracing.stop` écrit un vrai fichier quand un chemin est fourni. */
export function createFakeContext(
  options: { page?: FakePage; writeTrace?: boolean } = {},
): BrowserContextLike & {
  readonly tracing: TracingLike;
} {
  const page = options.page ?? createFakePage();
  const writeTrace = options.writeTrace ?? true;

  return {
    newPage: async () => page,
    close: async () => undefined,
    tracing: {
      start: vi.fn(async () => undefined),
      stop: vi.fn(async (params?: { path?: string }) => {
        if (writeTrace && params?.path !== undefined) {
          writeFileSync(params.path, Buffer.from('PK\u0003\u0004trace'));
        }
      }),
    },
  };
}

export interface FakeBrowser extends BrowserLike {
  readonly calls: { close: ReturnType<typeof vi.fn>; newContext: ReturnType<typeof vi.fn> };
}

/** Navigateur factice. */
export function createFakeBrowser(
  options: { context?: BrowserContextLike; version?: string | null } = {},
): FakeBrowser {
  const context = options.context ?? createFakeContext();
  const calls = { close: vi.fn(async () => undefined), newContext: vi.fn(async () => context) };

  const browser: FakeBrowser = {
    calls,
    newContext: calls.newContext,
    close: calls.close,
    version: options.version === null ? undefined : () => options.version ?? '1.0.0-fake',
  } as FakeBrowser;

  return browser;
}

export interface FakeLauncher extends BrowserLauncher {
  readonly calls: {
    launch: ReturnType<typeof vi.fn>;
    executablePath: ReturnType<typeof vi.fn>;
  };
}

/** Lanceur factice : renvoie un navigateur ou l'erreur demandée. */
export function createFakeLauncher(
  options: { browser?: BrowserLike; error?: unknown; executablePath?: string } = {},
): FakeLauncher {
  const calls = {
    launch: vi.fn(async (_kind: BrowserKind, _options?: unknown) => {
      if (options.error !== undefined) {
        throw options.error;
      }

      return options.browser ?? createFakeBrowser();
    }),
    executablePath: vi.fn(async () => options.executablePath ?? '/chemin/absent/chrome'),
  };

  return { calls, launch: calls.launch, executablePath: calls.executablePath } as FakeLauncher;
}

/** Module Playwright factice, pour couvrir le lanceur par défaut. */
export function createFakeModule(browser: BrowserLike): PlaywrightModule {
  const type = {
    executablePath: () => '/chemin/factice/chrome',
    launch: async () => browser,
  };

  return { chromium: type, firefox: type, webkit: type };
}

export interface FakeSession extends BrowserSession {
  readonly state: {
    started: boolean;
    kind: BrowserKind | null;
    navigations: unknown[];
    screenshots: unknown[];
    pdfs: unknown[];
    stops: number;
  };
}

/**
 * Session de navigation factice pour les tests MCP.
 *
 * Elle n'ouvre rien : elle enregistre les appels et renvoie des résultats
 * déterministes, ce qui permet de tester le contrat des outils (schémas,
 * confinement des chemins, politique d'URL) sans navigateur.
 */
export function createFakeSession(
  options: { failGoto?: unknown; failScreenshot?: unknown; snapshot?: unknown } = {},
): FakeSession {
  const state: FakeSession['state'] = {
    started: false,
    kind: null,
    navigations: [],
    screenshots: [],
    pdfs: [],
    stops: 0,
  };
  const page = createFakePage(options.snapshot === undefined ? {} : { snapshot: options.snapshot });

  const session: FakeSession = {
    state,
    isStarted: () => state.started,
    getKind: () => state.kind,
    start: async (kind = 'chromium') => {
      state.started = true;
      state.kind = kind;

      return { kind, version: '1.0.0-fake', headless: true, startedAt: '2026-10-23T00:00:00.000Z' };
    },
    stop: async () => {
      state.started = false;
      state.stops += 1;
    },
    goto: async (params) => {
      state.navigations.push(params);

      if (options.failGoto !== undefined) {
        throw options.failGoto;
      }

      return {
        url: params.url,
        title: 'Example Domain',
        status: 200,
        loadTime: 42,
        redirected: false,
      };
    },
    screenshot: async (params) => {
      state.screenshots.push(params);

      if (options.failScreenshot !== undefined) {
        throw options.failScreenshot;
      }

      return {
        path: params.path,
        size: 1024,
        type: 'png' as const,
        dimensions: { width: 800, height: 600 },
        duration: 12,
      };
    },
    pdf: async (params) => {
      state.pdfs.push(params);

      return {
        path: params.path,
        size: 2048,
        pages: 2,
        duration: 25,
      };
    },
    getPage: () => page,
  };

  return session;
}

/** Chemin d'un exécutable existant, pour couvrir la détection « installé ». */
export function existingExecutablePath(): string {
  const path = join(tempDir('ekts-browser-exec-'), 'chrome');
  writeFileSync(path, '#!/bin/sh\n');

  return path;
}

/** Indique si un binaire Playwright est présent sans lever d'exception. */
export function browserExecutable(kind: BrowserKind): string | null {
  try {
    // `playwright` est la bibliothèque utilisée par `src/browser` ; elle est
    // installée avec `@playwright/test` (même version).
    const require = createRequire(import.meta.url);
    const module = require('playwright') as Record<BrowserKind, { executablePath(): string }>;
    const path = module[kind].executablePath();

    return existsSync(path) ? path : null;
  } catch {
    return null;
  }
}
