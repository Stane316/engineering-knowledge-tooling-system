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
  DESKTOP_EMULATION,
  extractCoreWebVitals,
  extractSeoIssues,
  findFreePort,
  LighthouseAnalyzer,
  loadLighthouse,
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

    // Sprint 20-01 (C-W08) : chaque métrique sort sous son identité, avec son
    // unité et son origine ; aucune n'est renommée ni remplacée.
    expect(result.performance.metrics).toMatchObject({
      lcp: {
        id: 'lcp',
        unit: 'ms',
        origin: 'lab',
        measurement: { status: 'measured', value: 1832.4 },
      },
      inp: {
        id: 'inp',
        unit: 'ms',
        origin: 'lab',
        measurement: { status: 'measured', value: 120.6 },
      },
      cls: {
        id: 'cls',
        unit: 'unitless',
        origin: 'lab',
        measurement: { status: 'measured', value: 0.054 },
      },
      ttfb: {
        id: 'ttfb',
        unit: 'ms',
        origin: 'lab',
        measurement: { status: 'measured', value: 210.5 },
      },
      fcp: { id: 'fcp', measurement: { status: 'measured', value: 1200 } },
      speedIndex: { id: 'speed-index', measurement: { status: 'measured', value: 2400 } },
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
  it('laisse les métriques manquantes indisponibles (null, jamais 0)', async () => {
    const { runner } = fakeRunner(lighthouseReport({ audits: {} }));
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    // C-W05 : un `0` de remplacement se lirait comme une excellente mesure.
    // L'absence est explicite et traversera l'analyse sans devenir un constat.
    expect(result.performance.metrics).toMatchObject({
      lcp: { measurement: { status: 'unavailable', reason: 'absent' } },
      inp: { measurement: { status: 'unavailable', reason: 'absent' } },
      fid: { measurement: { status: 'unavailable', reason: 'absent' } },
      maxPotentialFid: { measurement: { status: 'unavailable', reason: 'absent' } },
      tbt: { measurement: { status: 'unavailable', reason: 'absent' } },
      cls: { measurement: { status: 'unavailable', reason: 'absent' } },
      ttfb: { measurement: { status: 'unavailable', reason: 'absent' } },
    });
    expect(result.seo.issues).toEqual([]);
  });

  it('distingue une mesure réellement nulle d’une mesure absente', async () => {
    const report = lighthouseReport({
      audits: { 'cumulative-layout-shift': { numericValue: 0 } },
    });

    expect(extractCoreWebVitals(report)).toMatchObject({
      cls: { measurement: { status: 'measured', value: 0 } },
      lcp: { measurement: { status: 'unavailable', reason: 'absent' } },
    });
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

  it('ne remplace pas INP par max-potential-fid (Sprint 20-01, D2)', () => {
    const report = lighthouseReport({
      audits: {
        'largest-contentful-paint': { numericValue: 1000 },
        'max-potential-fid': { numericValue: 88 },
      },
    });

    // W04 : INP et max-potential-fid ne sont pas interchangeables ; le repli
    // historique fabriquait une mesure d'INP qui n'avait jamais été observée.
    expect(extractCoreWebVitals(report)).toMatchObject({
      lcp: { measurement: { status: 'measured', value: 1000 } },
      inp: { measurement: { status: 'unavailable', reason: 'absent' } },
      maxPotentialFid: { measurement: { status: 'measured', value: 88 } },
    });
  });

  it('laisse le score indisponible sans catégorie déclarée', async () => {
    const { runner } = fakeRunner(lighthouseReport({ categories: {} }));
    const result = await new LighthouseAnalyzer(runner).analyze({
      url: 'https://exemple.fr',
      port: 9222,
    });

    expect(result.performance.score).toBeNull();
    expect(result.seo.score).toBeNull();
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

describe('createLighthouseRunner — cohérence d’émulation', () => {
  it('utilise le préréglage desktop du paquet quand il existe', async () => {
    const desktopConfig = { extends: 'lighthouse:default', settings: { formFactor: 'desktop' } };
    const module = {
      default: vi.fn(async () => ({ lhr: lighthouseReport() })),
      desktopConfig,
    };
    const runner = createLighthouseRunner(module);

    await runner.run({ url: 'https://exemple.fr', port: 9444 }, { timeoutMs: 30_000 });

    expect(module.default).toHaveBeenCalledWith(
      'https://exemple.fr',
      {
        port: 9444,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'seo'],
        maxWaitForLoad: 30_000,
      },
      desktopConfig,
    );
  });

  it('aligne formFactor et screenEmulation quand le préréglage manque', async () => {
    const module = { default: vi.fn(async () => ({ lhr: lighthouseReport() })) };
    const runner = createLighthouseRunner(module);

    await runner.run({ url: 'https://exemple.fr', port: 9444 });

    const [, flags] = module.default.mock.calls[0] as unknown as [
      string,
      { formFactor: string; screenEmulation: { mobile: boolean } },
    ];

    expect(flags.formFactor).toBe('desktop');
    expect(flags.screenEmulation).toEqual(DESKTOP_EMULATION);
    expect(flags.screenEmulation.mobile).toBe(flags.formFactor === 'mobile');
  });

  it('demande l’émulation mobile quand elle est demandée', async () => {
    const module = { default: vi.fn(async () => ({ lhr: lighthouseReport() })) };
    const runner = createLighthouseRunner(module);

    await runner.run({ url: 'https://exemple.fr', port: 9444 }, { mobile: true });

    const call = module.default.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
      unknown,
    ];

    expect(call[0]).toBe('https://exemple.fr');
    expect(call[1]['formFactor']).toBe('mobile');
    expect(call[1]).not.toHaveProperty('screenEmulation');
    expect(call[2]).toBeUndefined();
  });

  it('n’ajoute pas de délai quand il n’est pas demandé', async () => {
    const module = { default: vi.fn(async () => ({ lhr: lighthouseReport() })) };
    const runner = createLighthouseRunner(module);

    await runner.run({ url: 'https://exemple.fr', port: 9444 });

    const call = module.default.mock.calls[0] as unknown as [string, Record<string, unknown>];

    expect(call[0]).toBe('https://exemple.fr');
    expect(call[1]).not.toHaveProperty('maxWaitForLoad');
    expect(module.default.mock.calls[0]).toHaveLength(2);
  });
});

describe('createLighthouseRunner — module réel', () => {
  // Aucun appel réseau ici, volontairement. Un premier essai interrogeait un
  // port CDP fermé en attendant un refus rapide : il mesurait la latence
  // d'échec du système (1,5 s sous Linux, plus de 28 s sous Windows avec
  // antivirus) et non notre code. Les invariants se vérifient sans I/O.

  // Le chargement à froid de Lighthouse (24 Mo) prend ~1,5 s sous Linux mais
  // ~8 s sous Windows avec antivirus : le délai par défaut de Vitest (20 s)
  // laissait trop peu de marge. Ces deux cas fixent leur propre délai.
  it(
    'expose un préréglage desktop cohérent (formFactor et émulation accordés)',
    { timeout: 60_000 },
    async () => {
      const module = await loadLighthouse();
      const settings = desktopSettings(module);

      expect(settings.formFactor).toBe('desktop');
      expect(settings.screenEmulation.mobile).toBe(false);
    },
  );

  it(
    'notre émulation de repli reproduit exactement celle du paquet',
    { timeout: 60_000 },
    async () => {
      const module = await loadLighthouse();
      const settings = desktopSettings(module);

      // Si Lighthouse change ses métriques desktop, ce test casse : le repli
      // `DESKTOP_EMULATION` doit être mis à jour dans le même commit.
      expect(DESKTOP_EMULATION).toEqual(settings.screenEmulation);
    },
  );
});

/** Réglages du préréglage desktop du module chargé, typés pour le test. */
function desktopSettings(module: Awaited<ReturnType<typeof loadLighthouse>>): {
  formFactor: string;
  screenEmulation: { mobile: boolean } & Record<string, unknown>;
} {
  const config = module.desktopConfig as
    | {
        settings?: {
          formFactor?: string;
          screenEmulation?: { mobile?: boolean } & Record<string, unknown>;
        };
      }
    | undefined;

  const settings = config?.settings;

  if (settings?.formFactor === undefined || settings.screenEmulation?.mobile === undefined) {
    throw new Error('le préréglage desktop de Lighthouse est absent ou incomplet');
  }

  return {
    formFactor: settings.formFactor,
    screenEmulation: settings.screenEmulation as { mobile: boolean } & Record<string, unknown>,
  };
}
