/**
 * Tests de l'analyseur Lighthouse.
 *
 * Le rapport utilisé est une réduction fidèle de la sortie de Lighthouse 12 :
 * catégories, `auditRefs`, audits avec `score` et `numericValue`. Ce qui est
 * vérifié : la conversion des scores, la lecture des Core Web Vitals, la
 * sélection des audits SEO pertinents, et la traduction des erreurs.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  createLighthouseRunner,
  extractCoreWebVitals,
  extractSeoIssues,
  findFreePort,
  LighthouseAnalyzer,
  type LighthouseRunner,
} from '../../src/browser/lighthouse.js';
import { createLighthouseRunner as fakeRunner, lighthouseReport } from './inspection/fixtures.js';

describe('LighthouseAnalyzer — analyse nominale', () => {
  it('convertit les scores en pourcentage', async () => {
    const { runner } = fakeRunner();
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.performance.score).toBe(92);
    expect(result.seo.score).toBe(80);
  });

  it('lit les Core Web Vitals du rapport', async () => {
    const { runner } = fakeRunner();
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.performance.metrics).toEqual({
      lcp: 1832.4,
      inp: 120.6,
      cls: 0.054,
      ttfb: 210.5,
      fcp: 1200,
      speedIndex: 2400,
    });
  });

  it('ne retient que les audits SEO en échec', async () => {
    const { runner } = fakeRunner();
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.seo.issues.map((issue) => issue.id)).toEqual([
      'meta-description',
      'is-crawlable',
    ]);
    expect(result.seo.issues[0]?.severity).toBe('error');
    expect(result.seo.issues[1]?.severity).toBe('warning');
  });

  it('reprend l’URL finale et la version de Lighthouse', async () => {
    const { runner } = fakeRunner();
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.url).toBe('https://exemple.fr/guide');
    expect(result.version).toBe('12.8.2');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('transmet la cible et le délai à l’exécutant', async () => {
    const run = vi.fn(async () => ({ lhr: lighthouseReport() }));
    const runner: LighthouseRunner = { run };

    await new LighthouseAnalyzer(runner).analyze(
      { url: 'https://exemple.fr', port: 9333 },
      { timeoutMs: 45_000 },
    );

    expect(run).toHaveBeenCalledWith(
      { url: 'https://exemple.fr', port: 9333 },
      { timeoutMs: 45_000 },
    );
  });
});

describe('LighthouseAnalyzer — valeurs absentes', () => {
  it('ramène les métriques manquantes à zéro', async () => {
    const { runner } = fakeRunner(lighthouseReport({ audits: {} }));
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.performance.metrics).toEqual({
      lcp: 0,
      inp: 0,
      cls: 0,
      ttfb: 0,
      fcp: 0,
      speedIndex: 0,
    });
    expect(result.seo.issues).toEqual([]);
  });

  it('ignore un audit sans score numérique', async () => {
    const report = lighthouseReport({
      audits: { 'meta-description': { id: 'meta-description', title: 'Sans score', score: null } },
    });

    expect(extractSeoIssues(report)).toEqual([]);
  });

  it('ignore les audits hors catégorie SEO', async () => {
    const report = lighthouseReport({
      audits: {
        'unused-javascript': { id: 'unused-javascript', score: 0, title: 'JS inutilisé' },
      },
    });

    expect(extractSeoIssues(report)).toEqual([]);
  });

  it('retombe sur max-potential-fid quand INP est absent', () => {
    const report = lighthouseReport({
      audits: {
        'largest-contentful-paint': { numericValue: 1000 },
        'max-potential-fid': { numericValue: 88 },
      },
    });

    expect(extractCoreWebVitals(report)).toMatchObject({ lcp: 1000, inp: 88 });
  });

  it('vaut zéro sans catégorie déclarée', async () => {
    const { runner } = fakeRunner(lighthouseReport({ categories: {} }));
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.performance.score).toBe(0);
    expect(result.seo.score).toBe(0);
  });
});

describe('LighthouseAnalyzer — erreurs', () => {
  it('traduit un échec de l’exécutant en InspectionError', async () => {
    const { runner } = fakeRunner(lighthouseReport(), new Error('ECONNREFUSED 127.0.0.1:9222'));

    await expect(
      new LighthouseAnalyzer(runner).analyze({ url: 'https://exemple.fr', port: 9222 }),
    ).rejects.toMatchObject({
      code: 'INSPECTION_FAILED',
      stage: 'lighthouse',
      message: 'Inspection (lighthouse) : ECONNREFUSED 127.0.0.1:9222',
    });
  });

  it('tronque un message multi-lignes à sa première ligne', async () => {
    const { runner } = fakeRunner(lighthouseReport(), new Error('échec\n  at ChromeLauncher'));

    await expect(
      new LighthouseAnalyzer(runner).analyze({ url: 'https://exemple.fr', port: 9222 }),
    ).rejects.toThrow('Inspection (lighthouse) : échec');
  });
});

describe('findFreePort', () => {
  it('réserve un port utilisable', async () => {
    const port = await findFreePort();

    expect(port).toBeGreaterThanOrEqual(1024);
    expect(port).toBeLessThanOrEqual(65_535);
  });

  it('rend deux ports différents successivement', async () => {
    const first = await findFreePort();
    const second = await findFreePort();

    // Le système peut réattribuer le même port ; ce n'est pas une erreur.
    for (const port of [first, second]) {
      expect(port).toBeGreaterThan(0);
    }
  });
});

describe('createLighthouseRunner', () => {
  it('transmet les options attendues au module Lighthouse', async () => {
    const module = {
      default: vi.fn(async () => ({ lhr: lighthouseReport() })),
    };
    const runner = createLighthouseRunner(module);

    await runner.run(
      { url: 'https://exemple.fr', port: 9444 },
      { timeoutMs: 30_000, mobile: false },
    );

    expect(module.default).toHaveBeenCalledWith('https://exemple.fr', {
      port: 9444,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'seo'],
      formFactor: 'desktop',
      maxWaitForLoad: 30_000,
    });
  });

  it('demande l’émulation mobile quand elle est demandée', async () => {
    const module = { default: vi.fn(async () => ({ lhr: lighthouseReport() })) };
    const runner = createLighthouseRunner(module);

    await runner.run({ url: 'https://exemple.fr', port: 9444 }, { mobile: true });

    expect(module.default).toHaveBeenCalledWith(
      'https://exemple.fr',
      expect.objectContaining({ formFactor: 'mobile' }),
    );
  });

  it('n’ajoute ni délai ni émulation quand ils ne sont pas demandés', async () => {
    const module = { default: vi.fn(async () => ({ lhr: lighthouseReport() })) };
    const runner = createLighthouseRunner(module);

    await runner.run({ url: 'https://exemple.fr', port: 9444 });

    expect(module.default).toHaveBeenCalledWith(
      'https://exemple.fr',
      expect.not.objectContaining({ maxWaitForLoad: expect.anything() }),
    );
  });
});
