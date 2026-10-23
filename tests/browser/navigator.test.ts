import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ArtifactError,
  BrowserError,
  BrowserLaunchError,
  BrowserNotStartedError,
  BrowserUnavailableError,
  NavigationError,
  TraceStateError,
  UnsupportedBrowserOperationError,
} from '../../src/browser/errors.js';
import {
  checkBrowserAvailability,
  createPlaywrightLauncher,
  FIREFOX_UNSANDBOXED_PREFS,
  loadPlaywright,
  Navigator,
  SANDBOX_ENV,
} from '../../src/browser/navigator.js';
import type { BrowserContextLike, BrowserKind, BrowserLauncher } from '../../src/browser/types.js';
import {
  createFakeBrowser,
  createFakeContext,
  createFakeLauncher,
  createFakeModule,
  createFakePage,
  existingExecutablePath,
  jpegBuffer,
  pdfBuffer,
  pngBuffer,
  tempDir,
} from './helpers.js';

vi.mock('playwright', () => {
  const page = {
    url: () => 'https://example.com/',
    title: async () => 'Example Domain',
    goto: async () => null,
    screenshot: async () => Buffer.alloc(0),
    pdf: async () => Buffer.alloc(0),
    ariaSnapshotJSON: async () => null,
    setContent: async () => undefined,
    evaluate: async () => true,
    close: async () => undefined,
  };
  const context = {
    newPage: async () => page,
    tracing: { start: async () => undefined, stop: async () => undefined },
    close: async () => undefined,
  };
  const browser = {
    newContext: async () => context,
    close: async () => undefined,
    version: () => '1.64.1-mock',
  };
  const type = { executablePath: () => '/chemin/moque/chrome', launch: async () => browser };

  return { chromium: type, firefox: type, webkit: type };
});

/** Horloge déterministe : renvoie les valeurs fournies, puis la dernière. */
function clock(...values: number[]): () => number {
  let index = 0;

  return () => values[Math.min(index++, values.length - 1)] ?? 0;
}

describe('Navigator — cycle de vie', () => {
  it('démarre une session et expose ses informations', async () => {
    const launcher = createFakeLauncher({ browser: createFakeBrowser({ version: '140.0.0' }) });
    const navigator = new Navigator({
      launcher,
      now: () => Date.parse('2026-10-23T10:00:00.000Z'),
    });

    const info = await navigator.start('firefox');

    expect(info).toEqual({
      kind: 'firefox',
      version: '140.0.0',
      headless: true,
      startedAt: '2026-10-23T10:00:00.000Z',
      sandboxDisabled: false,
    });
    expect(navigator.isStarted()).toBe(true);
    expect(navigator.getKind()).toBe('firefox');
  });

  it('transmet les options de lancement au lanceur', async () => {
    const launcher = createFakeLauncher();
    const navigator = new Navigator({ launcher });

    await navigator.start('webkit', { headless: false });

    expect(launcher.calls.launch).toHaveBeenCalledWith('webkit', { headless: false });
  });

  it('utilise Chromium quand aucun moteur n’est demandé', async () => {
    const launcher = createFakeLauncher();
    const navigator = new Navigator({ launcher });

    await navigator.start();

    expect(launcher.calls.launch).toHaveBeenCalledWith('chromium', {});
    expect(navigator.getKind()).toBe('chromium');
  });

  it('annonce une version inconnue quand le navigateur n’en expose pas', async () => {
    const launcher = createFakeLauncher({ browser: createFakeBrowser({ version: null }) });
    const navigator = new Navigator({ launcher });

    await expect(navigator.start()).resolves.toMatchObject({ version: 'inconnue' });
  });

  it('configure les délais par défaut du contexte', async () => {
    const setDefaultTimeout = vi.fn();
    const setDefaultNavigationTimeout = vi.fn();
    const context: BrowserContextLike = {
      ...createFakeContext(),
      setDefaultTimeout,
      setDefaultNavigationTimeout,
    };
    const navigator = new Navigator({
      launcher: createFakeLauncher({ browser: createFakeBrowser({ context }) }),
    });

    await navigator.start();

    expect(setDefaultTimeout).toHaveBeenCalledWith(30_000);
    expect(setDefaultNavigationTimeout).toHaveBeenCalledWith(30_000);
  });

  it('refuse une seconde ouverture', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();

    await expect(navigator.start()).rejects.toMatchObject({ code: 'BROWSER_ALREADY_STARTED' });
  });

  it('ferme le navigateur et redevient inactif', async () => {
    const browser = createFakeBrowser();
    const navigator = new Navigator({ launcher: createFakeLauncher({ browser }) });
    await navigator.start();

    await navigator.stop();

    expect(browser.calls.close).toHaveBeenCalledOnce();
    expect(navigator.isStarted()).toBe(false);
    expect(navigator.getPageOrNull()).toBeNull();
    expect(navigator.getKind()).toBeNull();
  });

  it('ne transforme pas une fermeture en échec quand le moteur est déjà mort', async () => {
    const browser = createFakeBrowser();
    Object.defineProperty(browser, 'close', {
      value: async () => {
        throw new Error('processus déjà terminé');
      },
    });
    const navigator = new Navigator({ launcher: createFakeLauncher({ browser }) });
    await navigator.start();

    // Un arrêt de moteur est un cas nominal du nettoyage : `stop()` ne doit
    // jamais faire échouer un `afterAll` dont les tests sont verts.
    await expect(navigator.stop()).resolves.toBeUndefined();
    expect(browser.calls.kill).toHaveBeenCalled();
  });

  it('ferme la page puis le contexte puis le navigateur', async () => {
    const page = createFakePage();
    const context = createFakeContext({ page });
    const browser = createFakeBrowser({ context });
    const navigator = new Navigator({ launcher: createFakeLauncher({ browser }) });
    await navigator.start();

    await navigator.stop();

    expect(page.calls.close).toHaveBeenCalledTimes(1);
    expect(context.calls.close).toHaveBeenCalledTimes(1);
    expect(browser.calls.close).toHaveBeenCalledTimes(1);
    expect(page.calls.close.mock.invocationCallOrder[0]).toBeLessThan(
      context.calls.close.mock.invocationCallOrder[0]!,
    );
    expect(context.calls.close.mock.invocationCallOrder[0]).toBeLessThan(
      browser.calls.close.mock.invocationCallOrder[0]!,
    );
  });

  it('ignore une page déjà fermée', async () => {
    const page = createFakePage();
    page.calls.close.mockRejectedValueOnce(
      new Error('Target page, context or browser has been closed'),
    );
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.stop()).resolves.toBeUndefined();
    expect(page.calls.close).toHaveBeenCalled();
  });

  it('tolère une page déjà détachée du navigateur', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();
    // État inatteignable par l'API publique, mais possible si un futur appel
    // libère la page sans fermer le navigateur : `stop()` doit rester total.
    (navigator as unknown as { page: unknown }).page = null;

    await expect(navigator.stop()).resolves.toBeUndefined();
  });

  it('stop est idempotent', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });

    await expect(navigator.stop()).resolves.toBeUndefined();
  });

  it('borne la fermeture d’un navigateur bloqué et tue le processus', async () => {
    const browser = createFakeBrowser();
    Object.defineProperty(browser, 'close', { value: () => new Promise(() => undefined) });
    const navigator = new Navigator({
      launcher: createFakeLauncher({ browser }),
      closeTimeoutMs: 5,
    });
    await navigator.start();

    await expect(navigator.stop()).resolves.toBeUndefined();
    expect(browser.calls.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('se ferme sans processus natif exposé', async () => {
    const browser = createFakeBrowser();
    delete (browser as { process?: unknown }).process;
    Object.defineProperty(browser, 'close', { value: () => new Promise(() => undefined) });
    const navigator = new Navigator({
      launcher: createFakeLauncher({ browser }),
      closeTimeoutMs: 5,
    });
    await navigator.start();

    await expect(navigator.stop()).resolves.toBeUndefined();
  });

  it('signale une session absente', () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });

    expect(() => navigator.getPage()).toThrow(BrowserNotStartedError);
  });

  it('traduit un contexte impossible à ouvrir', async () => {
    const browser = createFakeBrowser();
    Object.defineProperty(browser, 'newContext', {
      value: async () => {
        throw new Error('cible fermée');
      },
    });
    browser.calls.close.mockRejectedValueOnce(new Error('déjà fermé'));
    const navigator = new Navigator({ launcher: createFakeLauncher({ browser }) });

    await expect(navigator.start()).rejects.toThrow(BrowserLaunchError);
    expect(browser.calls.close).toHaveBeenCalledOnce();
  });

  it('oriente vers le diagnostic quand le moteur plante à la création de page', async () => {
    const browser = createFakeBrowser();
    Object.defineProperty(browser, 'newContext', {
      value: async () => {
        throw new Error('browserContext.newPage: Target crashed');
      },
    });
    // Moteur planté : `close()` ne répond plus, seul le délai puis `kill()` libère.
    Object.defineProperty(browser, 'close', { value: () => new Promise(() => undefined) });
    const navigator = new Navigator({
      launcher: createFakeLauncher({ browser }),
      closeTimeoutMs: 5,
    });

    const error = await navigator.start('firefox').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(BrowserLaunchError);
    expect((error as Error).message).toContain('Target crashed');
    expect((error as Error).message).toContain('npm run doctor:browsers');
    expect(browser.calls.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('nomme la commande d’installation quand le binaire manque', async () => {
    const launcher = createFakeLauncher({
      error: new Error("browserType.launch: Executable doesn't exist at /cache/chrome"),
    });
    const navigator = new Navigator({ launcher });

    const error = await navigator.start('chromium').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(BrowserUnavailableError);
    expect((error as BrowserUnavailableError).message).toContain('npx playwright install chromium');
  });

  it('tolère un chemin d’exécutable indisponible', async () => {
    const launcher = {
      launch: async () => {
        throw new Error('Host system is missing dependencies to run browsers');
      },
      executablePath: async () => {
        throw new Error('registre illisible');
      },
    };
    const navigator = new Navigator({ launcher });

    await expect(navigator.start()).rejects.toThrow(/chemin inconnu/);
  });

  it('distingue un échec de lancement générique', async () => {
    const navigator = new Navigator({
      launcher: createFakeLauncher({ error: new Error('option inconnue') }),
    });

    await expect(navigator.start()).rejects.toThrow(/option inconnue/);
  });
});

describe('Navigator — bac à sable Firefox', () => {
  /** Navigateur dont la création de page échoue comme un processus mort. */
  function crashingBrowser(): ReturnType<typeof createFakeBrowser> {
    const browser = createFakeBrowser();
    Object.defineProperty(browser, 'newContext', {
      value: async () => {
        throw new Error('browserContext.newPage: Target crashed');
      },
    });

    return browser;
  }

  /** Lanceur qui renvoie ses navigateurs dans l'ordre, puis le dernier. */
  function sequenceLauncher(
    browsers: ReturnType<typeof createFakeBrowser>[],
  ): BrowserLauncher & { launch: ReturnType<typeof vi.fn> } {
    const queue = [...browsers];
    const launch = vi.fn(async (_kind: BrowserKind, _options?: unknown) => {
      return queue.length > 1 ? queue.shift()! : queue[0]!;
    });
    const executablePath = vi.fn(async () => '/chemin/fake/firefox');

    return { launch, executablePath };
  }

  it('rejoue le lancement sans bac à sable quand Firefox plante', async () => {
    const launcher = sequenceLauncher([crashingBrowser(), createFakeBrowser()]);
    const navigator = new Navigator({ launcher, env: {} });

    const info = await navigator.start('firefox');

    expect(info.sandboxDisabled).toBe(true);
    expect(launcher.launch).toHaveBeenCalledTimes(2);
    expect(launcher.launch.mock.calls[0]?.[1]).not.toHaveProperty('firefoxUserPrefs');
    expect(launcher.launch.mock.calls[1]?.[1]).toMatchObject({
      firefoxUserPrefs: FIREFOX_UNSANDBOXED_PREFS,
      env: { MOZ_DISABLE_CONTENT_SANDBOX: '1' },
    });
  });

  it('ne rejoue pas un moteur qui n’a pas de bac à sable', async () => {
    const launcher = sequenceLauncher([crashingBrowser(), createFakeBrowser()]);
    const navigator = new Navigator({ launcher, env: {} });

    await expect(navigator.start('chromium')).rejects.toThrow(BrowserLaunchError);
    expect(launcher.launch).toHaveBeenCalledTimes(1);
  });

  it('respecte le mode « on » : un plantage reste un échec', async () => {
    const launcher = sequenceLauncher([crashingBrowser(), createFakeBrowser()]);
    const navigator = new Navigator({ launcher, sandbox: 'on' });

    await expect(navigator.start('firefox')).rejects.toThrow(/Target crashed/);
    expect(launcher.launch).toHaveBeenCalledTimes(1);
  });

  it('démarre directement sans bac à sable en mode « off »', async () => {
    const launcher = sequenceLauncher([createFakeBrowser()]);
    const navigator = new Navigator({ launcher, sandbox: 'off' });

    const info = await navigator.start('firefox');

    expect(info.sandboxDisabled).toBe(true);
    expect(launcher.launch).toHaveBeenCalledTimes(1);
    expect(launcher.launch.mock.calls[0]?.[1]).toMatchObject({
      firefoxUserPrefs: FIREFOX_UNSANDBOXED_PREFS,
    });
  });

  it('accepte la demande explicite de l’appelant', async () => {
    const launcher = sequenceLauncher([createFakeBrowser()]);
    const navigator = new Navigator({ launcher, sandbox: 'on' });

    const info = await navigator.start('firefox', { sandbox: false });

    expect(info.sandboxDisabled).toBe(true);
    expect(launcher.launch).toHaveBeenCalledTimes(1);
  });

  it('accepte une demande explicite de bac à sable', async () => {
    const launcher = sequenceLauncher([crashingBrowser(), createFakeBrowser()]);
    const navigator = new Navigator({ launcher, env: { [SANDBOX_ENV]: 'off' } });

    await expect(navigator.start('firefox', { sandbox: true })).rejects.toThrow(/Target crashed/);
    expect(launcher.launch).toHaveBeenCalledTimes(1);
  });

  it('ne rejoue pas un échec qui n’est pas un plantage', async () => {
    const launcher = {
      launch: vi.fn(async () => {
        throw new Error('option de lancement inconnue');
      }),
      executablePath: vi.fn(async () => '/chemin/fake/firefox'),
    };
    const navigator = new Navigator({ launcher });

    await expect(navigator.start('firefox')).rejects.toThrow(/option de lancement inconnue/);
    expect(launcher.launch).toHaveBeenCalledTimes(1);
  });

  it('n’applique pas les préférences Firefox aux autres moteurs', async () => {
    const launcher = sequenceLauncher([createFakeBrowser()]);
    const navigator = new Navigator({ launcher, sandbox: 'off' });

    const info = await navigator.start('webkit');

    expect(info.sandboxDisabled).toBe(false);
    expect(launcher.launch.mock.calls[0]?.[1]).not.toHaveProperty('firefoxUserPrefs');
  });

  it('échoue quand le repli échoue aussi', async () => {
    const launcher = sequenceLauncher([crashingBrowser(), crashingBrowser()]);
    const navigator = new Navigator({ launcher, env: {} });

    await expect(navigator.start('firefox')).rejects.toThrow(/doctor:browsers/);
    expect(launcher.launch).toHaveBeenCalledTimes(2);
  });

  it('conserve les préférences et l’environnement de l’appelant', async () => {
    const launcher = sequenceLauncher([createFakeBrowser()]);
    const navigator = new Navigator({ launcher, sandbox: 'off' });

    await navigator.start('firefox', {
      firefoxUserPrefs: { 'browser.startup.homepage': 'about:blank' },
      env: { EKTS_TEST: '1' },
    });

    expect(launcher.launch.mock.calls[0]?.[1]).toMatchObject({
      firefoxUserPrefs: { ...FIREFOX_UNSANDBOXED_PREFS, 'browser.startup.homepage': 'about:blank' },
      env: { EKTS_TEST: '1', MOZ_DISABLE_CONTENT_SANDBOX: '1' },
    });
  });

  it.each([
    ['off', 'off'],
    ['0', 'off'],
    ['false', 'off'],
    ['OFF', 'off'],
    ['on', 'on'],
    ['1', 'on'],
    ['true', 'on'],
    ['auto', 'auto'],
    ['n’importe quoi', 'auto'],
    [undefined, 'auto'],
  ])('lit « %s » comme « %s »', async (value, expected) => {
    const launcher = sequenceLauncher([createFakeBrowser(), createFakeBrowser()]);
    const navigator = new Navigator({
      launcher,
      env: value === undefined ? {} : { [SANDBOX_ENV]: value },
    });

    await navigator.start('firefox');

    const first = launcher.launch.mock.calls[0]?.[1] as { firefoxUserPrefs?: unknown };
    expect(first.firefoxUserPrefs === undefined).toBe(expected !== 'off');
    expect(launcher.launch).toHaveBeenCalledTimes(1);
  });

  it('lit la variable d’environnement du processus par défaut', async () => {
    const launcher = sequenceLauncher([createFakeBrowser()]);
    const previous = process.env[SANDBOX_ENV];
    process.env[SANDBOX_ENV] = 'off';

    try {
      const info = await new Navigator({ launcher }).start('firefox');

      expect(info.sandboxDisabled).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env[SANDBOX_ENV];
      } else {
        process.env[SANDBOX_ENV] = previous;
      }
    }
  });

  it('nettoie les variables d’environnement indéfinies', async () => {
    const launcher = sequenceLauncher([createFakeBrowser()]);
    const navigator = new Navigator({
      launcher,
      sandbox: 'off',
      env: { EKTS_DEFINIE: 'oui', EKTS_ABSENTE: undefined },
    });

    await navigator.start('firefox');

    expect(launcher.launch.mock.calls[0]?.[1]).toMatchObject({
      env: { EKTS_DEFINIE: 'oui', MOZ_DISABLE_CONTENT_SANDBOX: '1' },
    });
    expect(
      (launcher.launch.mock.calls[0]?.[1] as { env: Record<string, string> }).env,
    ).not.toHaveProperty('EKTS_ABSENTE');
  });
});

describe('Navigator — navigation', () => {
  it('renvoie l’URL, le titre, le statut et la durée', async () => {
    const page = createFakePage({
      status: 200,
      finalUrl: 'https://example.com/',
      title: 'Example Domain',
    });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    const result = await navigator.goto({ url: 'https://example.com/' });

    // La durée dépend de l'horloge réelle : elle est vérifiée séparément avec
    // une horloge injectée, sinon le test devient instable sous Windows.
    expect(result).toEqual({
      url: 'https://example.com/',
      title: 'Example Domain',
      status: 200,
      loadTime: expect.any(Number),
      redirected: false,
    });
    expect(result.loadTime).toBeGreaterThanOrEqual(0);
  });

  it('mesure le temps de chargement avec l’horloge injectée', async () => {
    const navigator = new Navigator({
      launcher: createFakeLauncher(),
      now: clock(0, 100, 350),
    });
    await navigator.start();

    const result = await navigator.goto({ url: 'https://example.com' });

    expect(result.loadTime).toBe(250);
  });

  it('transmet le délai et l’événement d’attente', async () => {
    const page = createFakePage({ status: 204 });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await navigator.goto({ url: 'https://example.com', timeout: 1234, waitUntil: 'networkidle' });

    expect(page.calls.goto).toHaveBeenCalledWith('https://example.com', {
      timeout: 1234,
      waitUntil: 'networkidle',
    });
  });

  it('détecte une redirection', async () => {
    const page = createFakePage({ status: 200, finalUrl: 'https://www.example.com/' });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'https://example.com' })).resolves.toMatchObject({
      redirected: true,
      url: 'https://www.example.com/',
    });
  });

  it('ignore la barre oblique finale pour la redirection', async () => {
    const page = createFakePage({ status: 200, finalUrl: 'https://example.com/' });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'https://example.com' })).resolves.toMatchObject({
      redirected: false,
    });
  });

  it('renvoie le statut 0 quand aucune réponse n’est disponible', async () => {
    const page = createFakePage({ finalUrl: 'about:blank' });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'about:blank' })).resolves.toMatchObject({ status: 0 });
  });

  it('tolère un titre illisible', async () => {
    const page = createFakePage({ status: 200, titleError: new Error('document détruit') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'https://example.com' })).resolves.toMatchObject({
      title: '',
    });
  });

  it('traduit une erreur de navigation', async () => {
    const page = createFakePage({ gotoError: new Error('net::ERR_NAME_NOT_RESOLVED') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    const error = await navigator
      .goto({ url: 'https://inconnu.test' })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(NavigationError);
    expect((error as NavigationError).message).toContain('ERR_NAME_NOT_RESOLVED');
    expect((error as NavigationError).url).toBe('https://inconnu.test');
  });

  it('ne conserve que la première ligne d’un message multiligne', async () => {
    const page = createFakePage({ gotoError: new Error('première ligne\ndeuxième ligne') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'https://example.com' })).rejects.toThrow(/première ligne/);
  });

  it('se replie sur le nom de l’erreur quand le message est vide', async () => {
    const page = createFakePage({ gotoError: new Error('') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'https://example.com' })).rejects.toThrow(/Error/);
  });

  it('reconnaît l’invite d’installation de Playwright', async () => {
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        error: new Error('Please run the following command to download new browsers'),
      }),
    });

    await expect(navigator.start()).rejects.toBeInstanceOf(BrowserUnavailableError);
  });

  it('accepte une valeur non-Error comme cause', async () => {
    const page = createFakePage({ gotoError: 'coupure réseau' });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.goto({ url: 'https://example.com' })).rejects.toThrow(/coupure réseau/);
  });

  it('expose l’URL et le titre courants', async () => {
    const page = createFakePage({ finalUrl: 'https://example.com/page', title: 'Titre' });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    expect(navigator.getUrl()).toBe('https://example.com/page');
    await expect(navigator.getTitle()).resolves.toBe('Titre');
  });

  it('charge du HTML local', async () => {
    const page = createFakePage();
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await navigator.setContent('<h1>Bonjour</h1>', 'domcontentloaded');

    expect(page.calls.setContent).toHaveBeenCalledWith('<h1>Bonjour</h1>', {
      waitUntil: 'domcontentloaded',
    });
  });

  it('exécute une expression dans la page', async () => {
    const page = createFakePage({ evaluate: 42 });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.evaluate<number>('6 * 7')).resolves.toBe(42);
  });
});

describe('Navigator — captures', () => {
  let directory: string;

  beforeEach(() => {
    directory = tempDir();
  });

  it('écrit le fichier et lit ses dimensions', async () => {
    const page = createFakePage({ screenshot: pngBuffer(1280, 720) });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();
    const path = join(directory, 'capture.png');

    const result = await navigator.screenshot({ path });

    expect(result).toMatchObject({
      path,
      size: pngBuffer(1280, 720).length,
      type: 'png',
      dimensions: { width: 1280, height: 720 },
    });
    expect(existsSync(path)).toBe(true);
  });

  it('transmet la qualité uniquement pour un JPEG', async () => {
    const page = createFakePage({ screenshot: jpegBuffer(640, 480) });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    const jpeg = await navigator.screenshot({
      path: join(directory, 'a.jpg'),
      type: 'jpeg',
      quality: 80,
    });
    await navigator.screenshot({ path: join(directory, 'b.png'), type: 'png', quality: 80 });

    expect(page.calls.screenshot).toHaveBeenNthCalledWith(1, {
      type: 'jpeg',
      fullPage: false,
      quality: 80,
    });
    expect(page.calls.screenshot).toHaveBeenNthCalledWith(2, { type: 'png', fullPage: false });
    expect(jpeg.type).toBe('jpeg');
  });

  it('capture la page entière', async () => {
    const page = createFakePage();
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await navigator.screenshot({ path: join(directory, 'full.png'), fullPage: true });

    expect(page.calls.screenshot).toHaveBeenCalledWith({ type: 'png', fullPage: true });
  });

  it('crée le dossier de destination', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();
    const path = join(directory, 'a', 'b', 'capture.png');

    await navigator.screenshot({ path });

    expect(existsSync(path)).toBe(true);
  });

  it('signale une image de format inconnu', async () => {
    const page = createFakePage({ screenshot: Buffer.from('binaire inconnu') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.screenshot({ path: join(directory, 'x.png') })).resolves.toMatchObject({
      type: 'unknown',
      dimensions: { width: 0, height: 0 },
    });
  });

  it('traduit un échec de capture', async () => {
    const page = createFakePage({ screenshotError: new Error('cible détruite') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.screenshot({ path: join(directory, 'x.png') })).rejects.toThrow(
      ArtifactError,
    );
  });

  it('signale un dossier de destination impossible à créer', async () => {
    const blocker = join(directory, 'blocker');
    writeFileSync(blocker, 'fichier');
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();

    await expect(navigator.screenshot({ path: join(blocker, 'x.png') })).rejects.toThrow(
      /non créable/,
    );
  });

  it('signale une capture demandée sans session', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });

    await expect(navigator.screenshot({ path: join(directory, 'x.png') })).rejects.toThrow(
      BrowserNotStartedError,
    );
  });
});

describe('Navigator — traces', () => {
  it('enregistre une trace et renvoie sa taille et sa durée', async () => {
    const navigator = new Navigator({
      launcher: createFakeLauncher(),
      now: clock(0, 1_000, 4_500),
    });
    await navigator.start();
    const path = join(tempDir(), 'trace.zip');

    await navigator.startTrace({ title: 'inspection' });
    const result = await navigator.stopTrace({ path });

    expect(result).toMatchObject({ path, duration: 3_500 });
    expect(result.size).toBeGreaterThan(0);
  });

  it('renvoie une taille nulle si le ZIP n’est pas écrit', async () => {
    const context = createFakeContext({ writeTrace: false });
    const navigator = new Navigator({
      launcher: createFakeLauncher({ browser: createFakeBrowser({ context }) }),
    });
    await navigator.start();

    await navigator.startTrace();
    const result = await navigator.stopTrace({ path: join(tempDir(), 'absente.zip') });

    expect(result.size).toBe(0);
  });

  it('refuse deux traces simultanées', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();
    await navigator.startTrace();

    await expect(navigator.startTrace()).rejects.toThrow(TraceStateError);
  });

  it('refuse un arrêt sans démarrage', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();

    await expect(navigator.stopTrace({ path: join(tempDir(), 'x.zip') })).rejects.toThrow(
      /Aucune trace en cours/,
    );
  });

  it('signale une trace demandée sans session', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });

    await expect(navigator.startTrace()).rejects.toThrow(BrowserNotStartedError);
    await expect(navigator.stopTrace({ path: 'x.zip' })).rejects.toThrow(BrowserNotStartedError);
  });

  it('traduit un échec d’écriture de trace', async () => {
    const context = createFakeContext();
    Object.defineProperty(context, 'tracing', {
      value: {
        start: async () => undefined,
        stop: async () => {
          throw new Error('disque plein');
        },
      },
    });
    const navigator = new Navigator({
      launcher: createFakeLauncher({ browser: createFakeBrowser({ context }) }),
    });
    await navigator.start();
    await navigator.startTrace();

    await expect(navigator.stopTrace({ path: join(tempDir(), 'x.zip') })).rejects.toThrow(
      /disque plein/,
    );
  });
});

describe('Navigator — PDF', () => {
  it('imprime la page et compte les pages', async () => {
    const page = createFakePage({ pdf: pdfBuffer(3) });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start('chromium');
    const path = join(tempDir(), 'page.pdf');

    const result = await navigator.pdf({ path, format: 'A3', landscape: true });

    expect(result).toMatchObject({ path, pages: 3 });
    expect(result.size).toBeGreaterThan(0);
    expect(page.calls.pdf).toHaveBeenCalledWith({
      format: 'A3',
      landscape: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      printBackground: true,
    });
  });

  it('refuse le PDF hors Chromium', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start('firefox');

    await expect(navigator.pdf({ path: join(tempDir(), 'x.pdf') })).rejects.toThrow(
      UnsupportedBrowserOperationError,
    );
  });

  it('traduit un échec d’impression', async () => {
    const page = createFakePage({ pdfError: new Error('impression refusée') });
    const navigator = new Navigator({
      launcher: createFakeLauncher({
        browser: createFakeBrowser({ context: createFakeContext({ page }) }),
      }),
    });
    await navigator.start();

    await expect(navigator.pdf({ path: join(tempDir(), 'x.pdf') })).rejects.toThrow(
      /impression refusée/,
    );
  });
});

describe('createPlaywrightLauncher', () => {
  it('transmet les options au moteur injecté', async () => {
    const browser = createFakeBrowser();
    const module = createFakeModule(browser);
    const launcher = createPlaywrightLauncher(module);

    const launched = await launcher.launch('chromium', {
      headless: false,
      timeoutMs: 500,
      args: ['--no-sandbox'],
    });

    expect(launched).toBe(browser);
    await expect(launcher.executablePath('chromium')).resolves.toBe('/chemin/factice/chrome');
  });

  it('applique les valeurs par défaut', async () => {
    const browser = createFakeBrowser();
    const launch = vi.fn(async () => browser);
    const launcher = createPlaywrightLauncher({
      chromium: { executablePath: () => '/x', launch },
      firefox: { executablePath: () => '/x', launch },
      webkit: { executablePath: () => '/x', launch },
    });

    await launcher.launch('webkit');

    expect(launch).toHaveBeenCalledWith({ headless: true, timeout: 30_000 });
  });

  it('transmet les préférences Firefox sans toucher aux autres moteurs', async () => {
    const browser = createFakeBrowser();
    const launch = vi.fn(async () => browser);
    const launcher = createPlaywrightLauncher({
      chromium: { executablePath: () => '/x', launch },
      firefox: { executablePath: () => '/x', launch },
      webkit: { executablePath: () => '/x', launch },
    });

    await launcher.launch('firefox', { firefoxUserPrefs: { 'security.sandbox.content.level': 0 } });

    expect(launch).toHaveBeenCalledWith({
      headless: true,
      timeout: 30_000,
      firefoxUserPrefs: { 'security.sandbox.content.level': 0 },
    });
  });

  it('transmet l’environnement au moteur', async () => {
    const browser = createFakeBrowser();
    const launch = vi.fn(async () => browser);
    const launcher = createPlaywrightLauncher({
      chromium: { executablePath: () => '/x', launch },
      firefox: { executablePath: () => '/x', launch },
      webkit: { executablePath: () => '/x', launch },
    });

    await launcher.launch('firefox', {
      env: { MOZ_DISABLE_CONTENT_SANDBOX: '1', ABSENTE: undefined },
    });

    expect(launch).toHaveBeenCalledWith({
      headless: true,
      timeout: 30_000,
      env: { MOZ_DISABLE_CONTENT_SANDBOX: '1' },
    });
  });

  it('charge Playwright à la demande (moteur réellement mocké)', async () => {
    const module = await loadPlaywright();
    expect(module.chromium).toBeDefined();

    const navigator = new Navigator();
    const info = await navigator.start('chromium');

    expect(info.version).toBe('1.64.1-mock');
    await navigator.stop();
  });
});

describe('checkBrowserAvailability', () => {
  it('détecte un binaire présent', async () => {
    const path = existingExecutablePath();

    await expect(
      checkBrowserAvailability('chromium', createFakeLauncher({ executablePath: path })),
    ).resolves.toEqual({
      kind: 'chromium',
      executablePath: path,
      installed: true,
    });
  });

  it('détecte un binaire absent', async () => {
    await expect(
      checkBrowserAvailability('webkit', createFakeLauncher({ executablePath: '/chemin/absent' })),
    ).resolves.toMatchObject({ installed: false });
  });
});

describe('Navigator — dossier de travail', () => {
  it('n’écrit rien quand le dossier existe déjà', async () => {
    const directory = tempDir();
    mkdirSync(join(directory, 'deja'), { recursive: true });
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();

    await expect(
      navigator.screenshot({ path: join(directory, 'deja', 'x.png') }),
    ).resolves.toMatchObject({
      path: join(directory, 'deja', 'x.png'),
    });
  });

  it('accepte un chemin sans dossier', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();
    const previous = process.cwd();
    process.chdir(tempDir());

    try {
      await expect(navigator.screenshot({ path: 'capture.png' })).resolves.toMatchObject({
        path: 'capture.png',
      });
    } finally {
      process.chdir(previous);
    }
  });

  it('refuse une opération sur une session arrêtée', async () => {
    const navigator = new Navigator({ launcher: createFakeLauncher() });
    await navigator.start();
    await navigator.stop();

    await expect(navigator.goto({ url: 'https://example.com' })).rejects.toThrow(
      BrowserNotStartedError,
    );
    expect(() => navigator.getPage()).toThrow(BrowserError);
  });
});
