/**
 * Tests du niveau 2 : héritage du niveau 1, Lighthouse et analyse SEO.
 *
 * Les deux analyses sont volontairement séparées dans les assertions : un
 * score Lighthouse ne doit jamais masquer un problème de structure DOM, et
 * inversement.
 */

import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LighthouseAnalyzer } from '../../../src/browser/lighthouse.js';
import { inspectLevelTwo } from '../../../src/browser/inspection/level-2.js';
import {
  analyseSeo,
  collectSeoIssues,
  SEO_PENALTIES,
} from '../../../src/browser/inspection/seo.js';
import type { InspectionContext, PageSnapshot } from '../../../src/browser/inspection/types.js';
import {
  createLevelSession,
  createLighthouseRunner,
  lighthouseReport,
  SNAPSHOT,
  SPARSE_SNAPSHOT,
} from './fixtures.js';

/** Contexte d'inspection à l'horloge fixe. */
function makeContext(
  overrides: Partial<InspectionContext['options']> = {},
  sessionOptions: Parameters<typeof createLevelSession>[0] = {},
  elapsed = 4_000,
): { context: InspectionContext; calls: ReturnType<typeof createLevelSession>['calls'] } {
  const { session, calls } = createLevelSession(sessionOptions);
  const started = 1_700_000_000_000;

  return {
    context: {
      session,
      options: {
        url: 'https://exemple.fr/guide',
        level: 'L2',
        viewport: { width: 1920, height: 1080 },
        userAgent: undefined,
        timeout: 30_000,
        browserKind: 'chromium',
        outputDir: join('artifacts', 'inspections', 'tests'),
        screenshot: true,
        trace: false,
        pdf: false,
        strict: false,
        ...overrides,
      },
      navigation: {
        url: 'https://exemple.fr/guide',
        title: 'Guide des outils de connaissance',
        status: 200,
        loadTime: 120,
        redirected: false,
      },
      startedAt: started,
      now: () => started + elapsed,
    },
    calls,
  };
}

/** Photographie personnalisée. */
function snapshotWith(overrides: Partial<PageSnapshot>): PageSnapshot {
  return { ...SNAPSHOT, ...overrides };
}

describe('inspectLevelTwo — analyse nominale', () => {
  it('hérite du niveau 1 et ajoute Lighthouse et SEO', async () => {
    const { context } = makeContext();
    const { runner } = createLighthouseRunner();
    const { result } = await inspectLevelTwo(context, {
      lighthouse: new LighthouseAnalyzer(runner),
      debugPort: 9222,
    });

    expect(result.level).toBe('L2');
    expect(result.budget).toBe(30_000);
    expect(result.accessibility.violations).toHaveLength(2);
    expect(result.lighthouse?.performance.score).toBe(92);
    expect(result.seo.score).toBe(100);
    expect(result.warnings).toEqual([]);
  });

  it('analyse la page telle qu’elle a été chargée', async () => {
    const { context } = makeContext(
      { url: 'https://exemple.fr/redirige' },
      { navigation: { url: 'https://exemple.fr/guide' } },
    );
    const { runner } = createLighthouseRunner();
    const { result } = await inspectLevelTwo(context, {
      lighthouse: new LighthouseAnalyzer(runner),
      debugPort: 9222,
    });

    expect(result.metadata.requestedUrl).toBe('https://exemple.fr/redirige');
    expect(result.metadata.url).toBe('https://exemple.fr/guide');
  });
});

describe('inspectLevelTwo — dépendances absentes', () => {
  it('ignore Lighthouse quand le port CDP est inconnu', async () => {
    const { context } = makeContext();
    const { result } = await inspectLevelTwo(context, {});

    expect(result.lighthouse).toBeNull();
    expect(result.warnings.join(' ')).toContain('Lighthouse non configuré');
  });

  it('ignore Lighthouse hors Chromium, même en mode strict', async () => {
    const { context } = makeContext({ browserKind: 'firefox' });
    const { result } = await inspectLevelTwo(context, {});

    expect(result.lighthouse).toBeNull();
    expect(result.warnings.join(' ')).toContain('Lighthouse exige Chromium');
  });

  it('lève hors Chromium en mode strict', async () => {
    const { context } = makeContext({ browserKind: 'webkit', strict: true });

    await expect(inspectLevelTwo(context, {})).rejects.toMatchObject({
      code: 'INSPECTION_FAILED',
      stage: 'lighthouse',
    });
  });

  it('dégrade Lighthouse en cas d’échec, sans perdre le reste', async () => {
    const { context } = makeContext();
    const { runner } = createLighthouseRunner(lighthouseReport(), new Error('Chrome introuvable'));
    const { result } = await inspectLevelTwo(context, {
      lighthouse: new LighthouseAnalyzer(runner),
      debugPort: 9222,
    });

    expect(result.lighthouse).toBeNull();
    expect(result.warnings.join(' ')).toContain('Analyse Lighthouse indisponible');
    expect(result.seo.score).toBe(100);
    expect(result.accessibility.nodeCount).toBeGreaterThan(0);
  });

  it('lève en mode strict quand Lighthouse échoue', async () => {
    const { context } = makeContext({ strict: true });
    const { runner } = createLighthouseRunner(lighthouseReport(), new Error('échec CDP'));

    await expect(
      inspectLevelTwo(context, { lighthouse: new LighthouseAnalyzer(runner), debugPort: 9222 }),
    ).rejects.toMatchObject({ stage: 'lighthouse' });
  });
});

describe('inspectLevelTwo — budget cumulé', () => {
  it('mesure la durée totale, pas celle du dernier niveau', async () => {
    const { context } = makeContext({}, {}, 28_000);
    const { result } = await inspectLevelTwo(context, {});

    expect(result.duration).toBe(28_000);
    expect(result.withinBudget).toBe(true);
  });

  it('signale un dépassement du budget de 30 s', async () => {
    const { context } = makeContext({}, {}, 31_000);
    const { result } = await inspectLevelTwo(context, {});

    expect(result.withinBudget).toBe(false);
    expect(result.level).toBe('L2');
  });
});

describe('analyseSeo — page saine', () => {
  it('vaut 100 sans aucun constat', () => {
    const result = analyseSeo(SNAPSHOT, SNAPSHOT.title);

    expect(result.issues).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('résume la structure de la page', () => {
    const result = analyseSeo(SNAPSHOT, SNAPSHOT.title);

    expect(result.summary).toEqual({
      titleLength: 32,
      descriptionLength: 106,
      headingCount: 3,
      headingLevels: [1, 2],
      linkCount: 2,
      externalLinkCount: 1,
      imageCount: 2,
      imagesWithoutAlt: 0,
      structuredDataBlocks: 1,
    });
  });
});

describe('analyseSeo — constats', () => {
  it('classe un titre absent comme erreur', () => {
    const { issues, penalty } = collectSeoIssues(
      snapshotWith({ description: SNAPSHOT.description }),
      '',
    );

    expect(issues[0]).toMatchObject({ id: 'title', severity: 'error' });
    expect(penalty).toBeGreaterThanOrEqual(SEO_PENALTIES.title);
  });

  it('signale un titre trop court puis trop long', () => {
    const short = collectSeoIssues(SNAPSHOT, 'Court').issues.map((issue) => issue.id);
    const long = collectSeoIssues(SNAPSHOT, 'x'.repeat(80)).issues.map((issue) => issue.id);

    expect(short).toContain('title-length');
    expect(long).toContain('title-length');
  });

  it('signale une description absente', () => {
    const ids = collectSeoIssues(snapshotWith({ description: null }), SNAPSHOT.title).issues.map(
      (issue) => issue.id,
    );

    expect(ids).toContain('meta-description');
  });

  it('signale deux titres de niveau 1', () => {
    const ids = collectSeoIssues(
      snapshotWith({
        headings: [
          { level: 1, text: 'A' },
          { level: 1, text: 'B' },
        ],
      }),
      SNAPSHOT.title,
    ).issues.map((issue) => issue.id);

    expect(ids).toContain('h1-multiple');
  });

  it('signale un saut de niveau et une image sans alt', () => {
    const ids = collectSeoIssues(
      snapshotWith({
        headings: [
          { level: 1, text: 'A' },
          { level: 3, text: 'C' },
        ],
        images: [{ src: 'a.png', alt: '', width: 10, height: 10, lazy: false }],
      }),
      SNAPSHOT.title,
    ).issues.map((issue) => issue.id);

    expect(ids).toEqual(expect.arrayContaining(['heading-order', 'image-alt']));
  });

  it('signale l’absence de canonique, de langue et de viewport', () => {
    const ids = collectSeoIssues(
      snapshotWith({ canonical: null, language: null, viewportMeta: null }),
      SNAPSHOT.title,
    ).issues.map((issue) => issue.id);

    expect(ids).toEqual(expect.arrayContaining(['canonical', 'language', 'viewport']));
  });

  it('signale un noindex et un Open Graph incomplet', () => {
    const ids = collectSeoIssues(
      snapshotWith({ robots: 'noindex,nofollow', openGraph: {} }),
      SNAPSHOT.title,
    ).issues.map((issue) => issue.id);

    expect(ids).toEqual(expect.arrayContaining(['noindex', 'open-graph']));
  });

  it('trie les constats du plus grave au moins grave', () => {
    const { issues } = collectSeoIssues(SPARSE_SNAPSHOT, '');
    const severities = issues.map((issue) => issue.severity);

    expect(severities.indexOf('info')).toBeGreaterThan(severities.lastIndexOf('error'));
  });

  it('additionne les pénalités d’une page vide', () => {
    const result = analyseSeo(SPARSE_SNAPSHOT, '');

    // 25 (titre) + 20 (description) + 15 (h1) + 3 (canonique) + 5 (langue)
    // + 5 (viewport) + 3 (Open Graph) + 3 (données structurées) = 79.
    expect(result.score).toBe(21);
    expect(result.summary.headingLevels).toEqual([]);
    expect(
      result.issues.every((issue) => issue.severity !== 'info' || issue.id !== 'image-alt'),
    ).toBe(true);
  });

  it('ne descend jamais sous zéro', () => {
    const penalised = snapshotWith({
      description: null,
      canonical: null,
      language: null,
      viewportMeta: null,
      robots: 'noindex',
      openGraph: {},
      twitter: {},
      structuredDataBlocks: 0,
      headings: [
        { level: 2, text: 'Sans h1' },
        { level: 4, text: 'Saut' },
      ],
      images: [{ src: 'a.png', alt: null, width: 1, height: 1, lazy: false }],
    });

    // 25 + 20 + 15 + 5 + 10 + 3 + 12 + 5 + 5 + 3 + 3 = 106 de pénalités.
    expect(analyseSeo(penalised, '').score).toBe(0);
  });
});
