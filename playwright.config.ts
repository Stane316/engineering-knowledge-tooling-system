import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration du **Playwright Test runner** (tests de bout en bout).
 *
 * Ce fichier ne pilote pas la suite Vitest du projet : `npm test` exécute
 * `tests/<dossier>/*.test.ts` (unitaires et d'intégration, dont `tests/browser/`),
 * tandis que `npm run test:e2e` exécute les fichiers `*.spec.ts` de
 * `tests/browser/e2e/` sur
 * les trois moteurs. Séparer les deux runners évite que Playwright tente de
 * charger des fichiers qui importent Vitest.
 *
 * Écarts assumés avec le dossier Sprint 7 (voir `docs/PLAYWRIGHT.md` §12) :
 * - `testMatch` cible `*.spec.ts` et non `*.test.ts` (sinon les deux runners se
 *   disputent les mêmes fichiers) ;
 * - `use.outputDir` n'existe pas : le dossier de sortie est une option racine ;
 * - `screenshot: 'only-on-failure'` remplace `'on'` : capturer les 3 moteurs à
 *   chaque test produit des centaines de fichiers sans valeur de diagnostic.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/browser/e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './test-results/browser',

  timeout: 30_000,

  expect: {
    timeout: 5_000,
  },

  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] === undefined ? 0 : 2,
  workers: process.env['CI'] === undefined ? undefined : 1,

  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],

  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
