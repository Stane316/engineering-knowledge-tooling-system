import { expect, test } from '@playwright/test';

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
 * **Moteur qui plante.** Un moteur peut être installé et mourir au premier
 * `newPage` (« Target crashed ») : Playwright échoue alors dans la fixture
 * `page`, avant tout test. Le `beforeEach` sonde donc le moteur avant la
 * création de la page. Si la sonde échoue, les tests sont **sautés** avec la
 * raison affichée ; `EKTS_BROWSER_STRICT=1` rétablit l'échec pour une CI qui
 * doit refuser tout saut.
 */

const STRICT = process.env['EKTS_BROWSER_STRICT'] === '1';

test.beforeEach(async ({ browserName }) => {
  const health = await engineHealth(browserName as BrowserKind);

  if (!health.ok && !STRICT) {
    test.skip(
      true,
      `moteur ${browserName} inutilisable : ${health.reason ?? 'raison inconnue'}. ` +
        'Diagnostic : « npm run doctor:browsers ».',
    );
  }
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
