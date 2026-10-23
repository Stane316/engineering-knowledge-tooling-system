/**
 * Tests d'intégration : Playwright réel, réseau local uniquement.
 *
 * **Pourquoi ils sont conditionnels.** Playwright ne télécharge ses binaires
 * que depuis `cdn.playwright.dev` ; un environnement sans accès à ce CDN (CI
 * restreinte, conteneur) ne peut pas les installer. Ces tests s'exécutent donc
 * seulement sur un poste où `npx playwright install chromium firefox webkit` a
 * été lancé ; sinon ils sont marqués « skipped » et la suite reste verte.
 *
 * **Pourquoi un serveur local.** Les tests ne dépendent d'aucun site public :
 * une page de référence est servie sur `127.0.0.1`, avec des défauts
 * d'accessibilité connus. Résultat : déterministe, hors ligne, et les trois
 * moteurs sont comparés sur exactement le même document. Un test facultatif
 * (`EKTS_BROWSER_ONLINE=1`) couvre `https://example.com` pour vérifier le
 * réseau réel.
 */

import { createServer, type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Accessibility } from '../../src/browser/accessibility.js';
import { Navigator } from '../../src/browser/navigator.js';
import type { BrowserKind } from '../../src/browser/types.js';
import { browserExecutable, tempDir } from './helpers.js';

/** Page de référence : structure correcte + cinq défauts d'accessibilité. */
const FIXTURE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Page de référence EKTS</title>
  </head>
  <body>
    <h1>Inspection navigateur</h1>
    <h3>Titre qui saute un niveau</h3>
    <p>Texte de référence pour les tests d'intégration.</p>
    <a href="/valide">Lien correct</a>
    <a href="/sans-nom"></a>
    <img src="/pixel.png" />
    <img src="/logo.png" alt="Logo EKTS" />
    <button>Valider</button>
    <button></button>
    <label for="recherche">Rechercher</label>
    <input id="recherche" />
    <input />
  </body>
</html>`;

const AVAILABLE: Record<BrowserKind, boolean> = {
  chromium: browserExecutable('chromium') !== null,
  firefox: browserExecutable('firefox') !== null,
  webkit: browserExecutable('webkit') !== null,
};

const INSTALL_HINT =
  'Aucun binaire Playwright : lancez « npx playwright install chromium firefox webkit » pour activer ces tests.';

let server: Server;
let baseUrl = '';

beforeAll(async () => {
  server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(FIXTURE_HTML);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('Serveur de test sans port');
  }

  baseUrl = `http://127.0.0.1:${String(address.port)}/`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
});

describe('tests d’intégration Playwright', () => {
  it('documente l’absence de binaires', () => {
    // Ce test ne sert qu'à rendre le message visible dans le rapport.
    expect(typeof INSTALL_HINT).toBe('string');
  });
});

for (const kind of ['chromium', 'firefox', 'webkit'] as const) {
  describe.skipIf(!AVAILABLE[kind])(`moteur ${kind}`, () => {
    let navigator: Navigator;

    beforeAll(async () => {
      navigator = new Navigator();
      await navigator.start(kind);
    });

    afterAll(async () => {
      await navigator.stop();
    });

    it('navigue vers la page locale en moins de 3 s', async () => {
      const result = await navigator.goto({ url: baseUrl });

      expect(result.status).toBe(200);
      expect(result.title).toBe('Page de référence EKTS');
      expect(result.url).toBe(baseUrl);
      expect(result.loadTime).toBeLessThan(3_000);
    });

    it('capture une image en moins d’une seconde', async () => {
      await navigator.goto({ url: baseUrl });

      const result = await navigator.screenshot({
        path: `${tempDir('ekts-browser-shot-')}/capture.png`,
        fullPage: true,
      });

      expect(result.type).toBe('png');
      expect(result.size).toBeGreaterThan(0);
      expect(result.dimensions.width).toBeGreaterThan(0);
      expect(result.dimensions.height).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(1_000);
    });

    it('extrait l’accessibility tree et détecte les défauts', async () => {
      await navigator.goto({ url: baseUrl });
      const accessibility = new Accessibility(navigator);
      const result = await accessibility.extract();

      expect(result.title).toBe('Page de référence EKTS');
      expect(result.nodeCount).toBeGreaterThan(5);
      expect(result.extractionTime).toBeLessThan(1_000);

      const headings = await accessibility.findByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(2);

      const report = await accessibility.getViolations();
      const rules = new Set(report.violations.map((violation) => violation.rule));

      expect(rules).toContain('image-alt');
      expect(rules).toContain('button-name');
      expect(rules).toContain('link-name');
      expect(rules).toContain('heading-order');
    });

    it('vérifie qu’un titre est accessible', async () => {
      await navigator.goto({ url: baseUrl });

      await expect(new Accessibility(navigator).isAccessible('h1')).resolves.toBe(true);
      await expect(new Accessibility(navigator).isAccessible('article')).resolves.toBe(false);
    });
  });
}

describe.skipIf(!AVAILABLE.chromium)('chromium — impressions', () => {
  let navigator: Navigator;

  beforeAll(async () => {
    navigator = new Navigator();
    await navigator.start('chromium');
  });

  afterAll(async () => {
    await navigator.stop();
  });

  it('génère un PDF', async () => {
    await navigator.goto({ url: baseUrl });

    const result = await navigator.pdf({ path: `${tempDir('ekts-browser-pdf-')}/page.pdf` });

    expect(result.pages).toBeGreaterThan(0);
    expect(result.size).toBeGreaterThan(1_000);
  });

  it('enregistre une trace', async () => {
    await navigator.startTrace({ title: 'inspection' });
    await navigator.goto({ url: baseUrl });
    const result = await navigator.stopTrace({
      path: `${tempDir('ekts-browser-trace-')}/trace.zip`,
    });

    expect(result.size).toBeGreaterThan(1_000);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

describe.skipIf(process.env['EKTS_BROWSER_ONLINE'] !== '1' || !AVAILABLE.chromium)(
  'réseau public (EKTS_BROWSER_ONLINE=1)',
  () => {
    it('ouvre example.com', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        const result = await navigator.goto({ url: 'https://example.com' });

        expect(result.status).toBe(200);
        expect(result.title).toContain('Example');
      } finally {
        await navigator.stop();
      }
    });
  },
);
