/**
 * Sonde d'état des moteurs Playwright.
 *
 * Ce module n'importe **pas** Vitest : la même sonde sert aux tests
 * d'intégration Vitest (`npm test`) et aux tests Playwright (`npm run
 * test:e2e`). Il ne fait qu'une chose — vérifier qu'un moteur ouvre réellement
 * une page — et n'échoue jamais : chaque cas renvoie une raison lisible.
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { FIREFOX_UNSANDBOXED_PREFS } from '../../src/browser/navigator.js';
import type { BrowserKind, BrowserLike } from '../../src/browser/types.js';

/** Résultat d'une sonde de moteur : utilisable, ou raison de l'indisponibilité. */
export interface EngineHealth {
  /** `true` si un navigateur a réellement ouvert une page (avec ou sans bac à sable). */
  readonly ok: boolean;
  /**
   * Première ligne de l'erreur d'origine, ou `null` si le moteur a fonctionné
   * du premier coup. Renseigné aussi quand le repli réussit : la cause reste
   * utile à afficher.
   */
  readonly reason: string | null;
  /** `true` quand seul le lancement sans bac à sable fonctionne. */
  readonly sandboxDisabled: boolean;
}

/** Options de lancement passées au moteur pendant la sonde. */
interface ProbeLaunchOptions {
  headless: boolean;
  timeout: number;
  firefoxUserPrefs?: Record<string, string | number | boolean>;
  env?: Record<string, string>;
}

/** Délai au-delà duquel une sonde est déclarée en échec (30 s). */
const PROBE_TIMEOUT_MS = 30_000;

/** Copie les variables d'environnement définies (Playwright n'accepte pas `undefined`). */
function definedEnv(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const newline = message.indexOf('\n');

  return (newline === -1 ? message : message.slice(0, newline)).trim();
}

/**
 * Vérifie qu'un moteur ouvre réellement une page.
 *
 * `browserExecutable` ne voit que la présence du binaire. Or un moteur peut
 * être installé et planter au démarrage du processus de contenu :
 * `browserContext.newPage: Target crashed`. Sans cette sonde, le `beforeAll`
 * du fichier d'intégration échoue et Vitest marque **toute la suite** en
 * échec — les autres moteurs disparaissent du rapport.
 */
async function probeEngine(kind: BrowserKind): Promise<EngineHealth> {
  if (browserExecutable(kind) === null) {
    return { ok: false, reason: 'binaire Playwright absent', sandboxDisabled: false };
  }

  // Objet conteneur : TypeScript ne suit pas les affectations faites dans une
  // fonction imbriquée (`open`), et conclurait que `browser` reste `null`.
  const state: { browser: BrowserLike | null } = { browser: null };

  const require = createRequire(join(process.cwd(), 'package.json'));
  const module = require('playwright') as Record<
    BrowserKind,
    { launch(options: ProbeLaunchOptions): Promise<BrowserLike> }
  >;

  const attempt = async (options: ProbeLaunchOptions): Promise<void> => {
    let timer: NodeJS.Timeout | undefined;

    const open = async (): Promise<void> => {
      const launched = await module[kind].launch(options);
      state.browser = launched;
      const context = await launched.newContext();
      const page = await context.newPage();
      await page.close();
      await context.close();
    };

    try {
      await Promise.race([
        open(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`sonde expirée après ${String(PROBE_TIMEOUT_MS)} ms`));
          }, PROBE_TIMEOUT_MS);
          timer.unref();
        }),
      ]);
    } finally {
      clearTimeout(timer);
      await state.browser?.close().catch(() => undefined);
      state.browser = null;
    }
  };

  const base: ProbeLaunchOptions = { headless: true, timeout: 20_000 };

  try {
    await attempt(base);

    return { ok: true, reason: null, sandboxDisabled: false };
  } catch (error) {
    const reason = firstLine(error);

    // Même repli que `Navigator` : le bac à sable du processus de contenu est
    // la cause la plus fréquente d'un « Target crashed » sous Windows.
    if (kind !== 'firefox') {
      return { ok: false, reason, sandboxDisabled: false };
    }

    try {
      await attempt({
        ...base,
        firefoxUserPrefs: { ...FIREFOX_UNSANDBOXED_PREFS },
        env: { ...definedEnv(), MOZ_DISABLE_CONTENT_SANDBOX: '1' },
      });

      return { ok: true, reason, sandboxDisabled: true };
    } catch {
      return { ok: false, reason, sandboxDisabled: false };
    }
  }
}

const ENGINE_HEALTH = new Map<BrowserKind, Promise<EngineHealth>>();

/** État d'un moteur, sondé une seule fois par processus de test. */
export function engineHealth(kind: BrowserKind): Promise<EngineHealth> {
  let pending = ENGINE_HEALTH.get(kind);

  if (pending === undefined) {
    pending = probeEngine(kind);
    ENGINE_HEALTH.set(kind, pending);
  }

  return pending;
}

/** Sonde les trois moteurs en parallèle. */
export async function probeEngines(): Promise<Record<BrowserKind, EngineHealth>> {
  const [chromium, firefox, webkit] = await Promise.all([
    engineHealth('chromium'),
    engineHealth('firefox'),
    engineHealth('webkit'),
  ]);

  return { chromium, firefox, webkit };
}

/** Indique si un binaire Playwright est présent sans lever d'exception. */
export function browserExecutable(kind: BrowserKind): string | null {
  try {
    // `playwright` est la bibliothèque utilisée par `src/browser` ; elle est
    // installée avec `@playwright/test` (même version).
    //
    // La résolution part du répertoire de travail, pas de `import.meta.url` :
    // Playwright Test transforme ses spécifications en CommonJS, où
    // `import.meta` n'existe pas. Les deux runners lancent `npm` depuis la
    // racine du dépôt.
    const require = createRequire(join(process.cwd(), 'package.json'));
    const module = require('playwright') as Record<BrowserKind, { executablePath(): string }>;
    const path = module[kind].executablePath();

    return existsSync(path) ? path : null;
  } catch {
    return null;
  }
}
