import { expect, test as base } from '@playwright/test';
import type { Browser, BrowserType } from '@playwright/test';

import { FIREFOX_UNSANDBOXED_PREFS } from '../../../src/browser/navigator.js';
import type { BrowserKind } from '../../../src/browser/types.js';
import { engineHealth } from '../engine-health.js';

/**
 * Vérification de bout en bout du socle Playwright (C7.1, C7.2).
 *
 * Ce fichier est exécuté par **Playwright Test** (`npm run test:e2e`), une fois
 * sur chacun des trois projets `chromium`, `firefox` et `webkit`. Il ne dépend
 * d'aucun site public : la page est injectée avec `setContent`, ce qui rend le
 * résultat identique hors ligne et sur un poste connecté.
 *
 * **Moteur qui plante à l'ouverture d'une page.** Sous Windows, Firefox démarre
 * puis son processus de contenu meurt (`browserContext.newPage: Target
 * crashed`) tant que le bac à sable est actif. La fixture `browser` ci-dessous
 * sonde le moteur, puis lance exactement comme `Navigator` : sans bac à sable
 * quand la sonde l'exige, et pas du tout quand le moteur est inutilisable (le
 * test est alors **sauté** avec sa raison). `EKTS_BROWSER_STRICT=1` rétablit
 * l'échec pour une CI qui doit refuser tout saut.
 */

const STRICT = process.env['EKTS_BROWSER_STRICT'] === '1';

const test = base.extend({
  browser: async ({ playwright, browserName }, use) => {
    const kind = browserName as BrowserKind;
    const health = await engineHealth(kind);

    if (!health.ok) {
      if (STRICT) {
        throw new Error(
          `moteur ${browserName} inutilisable : ${health.reason ?? 'raison inconnue'}`,
        );
      }

      base.skip(
        true,
        `moteur ${browserName} inutilisable : ${health.reason ?? 'raison inconnue'}. ` +
          'Diagnostic : « npm run doctor:browsers ».',
      );
    }

    const type = (playwright as unknown as Record<BrowserKind, BrowserType>)[kind];
    const browser: Browser = await type.launch(
      health.sandboxDisabled
        ? {
            firefoxUserPrefs: { ...FIREFOX_UNSANDBOXED_PREFS },
            env: { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: '1' } as Record<string, string>,
          }
        : {},
    );

    await use(browser);

    await browser.close();
  },
});

const PAGE = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Page E2E</title>
  </head>
  <body>
    <main>
      <h1>Inspection navigateur</h1>
      <p>Contenu de vérification.</p>
      <a href="https://example.com">Lien de référence</a>
      <button type="button">Valider</button>
    </main>
  </body>
</html>`;

test.describe('socle Playwright', () => {
  test('charge une page locale et lit son titre', async ({ page }) => {
    await page.setContent(PAGE);

    await expect(page).toHaveTitle('Page E2E');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inspection navigateur');
  });

  test('capture une image non vide', async ({ page }) => {
    await page.setContent(PAGE);

    const buffer = await page.screenshot({ fullPage: true });

    expect(buffer.length).toBeGreaterThan(0);
  });

  test('extrait l’accessibility tree', async ({ page }) => {
    await page.setContent(PAGE);

    const snapshot = await page.ariaSnapshot();

    expect(snapshot).toContain('heading "Inspection navigateur"');
    expect(snapshot).toContain('button "Valider"');
    expect(snapshot).toContain('link "Lien de référence"');
  });

  test('expose le moteur du projet courant', async ({ browserName }) => {
    expect(['chromium', 'firefox', 'webkit']).toContain(browserName);
  });
});
