/**
 * Tests du niveau 1 : métadonnées, capture, accessibilité, photographie du DOM.
 *
 * Ce qui est vérifié ici, ce sont les **décisions** : quelles valeurs sortent
 * quand tout fonctionne, ce qui est dégradé (et signalé) quand un outil
 * échoue, et ce qui lève en mode strict. Aucun navigateur n'est lancé.
 */

import { describe, expect, it } from 'vitest';

import {
  countViolations,
  inspectLevelOne,
  summariseAccessibility,
} from '../../../src/browser/inspection/level-1.js';
import { EMPTY_SNAPSHOT, normaliseSnapshot } from '../../../src/browser/inspection/snapshot.js';
import type { InspectionContext } from '../../../src/browser/inspection/types.js';
import { createLevelSession, SNAPSHOT } from './fixtures.js';

/** Construit un contexte d'inspection à l'horloge fixe. */
function makeContext(
  overrides: Partial<InspectionContext['options']> = {},
  sessionOptions: Parameters<typeof createLevelSession>[0] = {},
  elapsed = 1500,
): { context: InspectionContext; calls: ReturnType<typeof createLevelSession>['calls'] } {
  const { session, calls } = createLevelSession(sessionOptions);
  const started = 1_700_000_000_000;

  const context: InspectionContext = {
    session,
    options: {
      url: 'https://exemple.fr/guide',
      level: 'L1',
      viewport: { width: 1920, height: 1080 },
      userAgent: undefined,
      timeout: 30_000,
      browserKind: 'chromium',
      outputDir: '/tmp/ekts-inspection',
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
  };

  return { context, calls };
}

describe('inspectLevelOne — résultat nominal', () => {
  it('produit un rapport L1 complet dans le budget', async () => {
    const { context, calls } = makeContext();
    const { result } = await inspectLevelOne(context);

    expect(result.level).toBe('L1');
    expect(result.url).toBe('https://exemple.fr/guide');
    expect(result.duration).toBe(1500);
    expect(result.budget).toBe(10_000);
    expect(result.withinBudget).toBe(true);
    expect(result.timestamp).toBe(new Date(1_700_000_000_000).toISOString());
    expect(result.warnings).toEqual([]);
    expect(calls.screenshot).toHaveBeenCalledOnce();
  });

  it('reprend les métadonnées de la navigation quand la photographie les ignore', async () => {
    const { context } = makeContext();
    const { result } = await inspectLevelOne(context);

    expect(result.metadata).toMatchObject({
      url: 'https://exemple.fr/guide',
      requestedUrl: 'https://exemple.fr/guide',
      title: 'Guide des outils de connaissance',
      description: SNAPSHOT.description,
      language: 'fr',
      httpStatus: 200,
      redirected: false,
      viewport: { width: 1920, height: 1080 },
      userAgent: SNAPSHOT.userAgent,
    });
  });

  it('compte les violations de l’arbre ARIA', async () => {
    const { context } = makeContext();
    const { result } = await inspectLevelOne(context);

    expect(result.accessibility.violations.map((violation) => violation.rule)).toEqual([
      'image-alt',
      'button-name',
    ]);
    expect(result.accessibility.counts).toEqual({ minor: 0, moderate: 0, serious: 2, critical: 0 });
    expect(result.accessibility.nodeCount).toBeGreaterThan(0);
  });

  it('écrit la capture dans le dossier de sortie', async () => {
    const { context, calls } = makeContext({ outputDir: '/tmp/ekts-capture' });
    const { result } = await inspectLevelOne(context);

    expect(result.artifacts.screenshot).toBe('/tmp/ekts-capture/screenshot.png');
    expect(calls.screenshot).toHaveBeenCalledWith({
      path: '/tmp/ekts-capture/screenshot.png',
      fullPage: true,
    });
  });

  it('n’expose pas la photographie dans le rapport sérialisé', async () => {
    const { context } = makeContext();
    const { result, snapshot } = await inspectLevelOne(context);

    expect(snapshot.headings).toHaveLength(3);
    expect(result).not.toHaveProperty('snapshot');
  });
});

describe('inspectLevelOne — dégradations', () => {
  it('signale une capture impossible sans faire échouer le rapport', async () => {
    const { context } = makeContext({}, { screenshotError: new Error('cible détruite') });
    const { result } = await inspectLevelOne(context);

    expect(result.artifacts.screenshot).toBeUndefined();
    expect(result.warnings).toEqual(["Capture d'écran indisponible : cible détruite"]);
    expect(result.accessibility.nodeCount).toBeGreaterThan(0);
  });

  it('signale un arbre ARIA illisible et poursuit', async () => {
    const { context } = makeContext({}, { ariaSnapshotError: new Error('page fermée') });
    const { result } = await inspectLevelOne(context);

    expect(result.accessibility).toEqual({
      nodeCount: 0,
      maxDepth: 0,
      violations: [],
      counts: { minor: 0, moderate: 0, serious: 0, critical: 0 },
    });
    expect(result.warnings[0]).toContain("Arbre d'accessibilité indisponible");
  });

  it('signale une photographie illisible et poursuit', async () => {
    const { context } = makeContext({}, { evaluateError: new Error('exécution interrompue') });

    const { result, snapshot } = await inspectLevelOne(context);

    expect(snapshot).toEqual(EMPTY_SNAPSHOT);
    expect(result.metadata.title).toBe('Guide des outils de connaissance');
    expect(result.warnings[0]).toContain('Photographie du DOM indisponible');
  });

  it('ne capture rien quand l’option est désactivée', async () => {
    const { context, calls } = makeContext({ screenshot: false });
    const { result } = await inspectLevelOne(context);

    expect(result.artifacts.screenshot).toBeUndefined();
    expect(calls.screenshot).not.toHaveBeenCalled();
  });
});

describe('inspectLevelOne — mode strict', () => {
  it('lève une InspectionError à l’étape de capture', async () => {
    const { context } = makeContext(
      { strict: true },
      { screenshotError: new Error('disque plein') },
    );

    await expect(inspectLevelOne(context)).rejects.toMatchObject({
      code: 'INSPECTION_FAILED',
      stage: 'screenshot',
    });
  });

  it('lève une InspectionError à l’étape d’accessibilité', async () => {
    const { context } = makeContext(
      { strict: true },
      { ariaSnapshotError: new Error('arbre absent') },
    );

    await expect(inspectLevelOne(context)).rejects.toMatchObject({ stage: 'accessibility' });
  });
});

describe('inspectLevelOne — budget', () => {
  it('marque un dépassement sans masquer le résultat', async () => {
    const { context } = makeContext({}, {}, 12_500);
    const { result } = await inspectLevelOne(context);

    expect(result.duration).toBe(12_500);
    expect(result.withinBudget).toBe(false);
    expect(result.level).toBe('L1');
  });
});

describe('summariseAccessibility', () => {
  it('ne conserve que la règle, la gravité et le message', () => {
    const summary = summariseAccessibility(12, 4, [
      {
        rule: 'image-alt',
        impact: 'serious',
        path: 'document > img',
        role: 'img',
        message: 'Image sans texte alternatif.',
      },
    ]);

    expect(summary.violations).toEqual([
      { rule: 'image-alt', impact: 'serious', message: 'Image sans texte alternatif.' },
    ]);
    expect(summary.nodeCount).toBe(12);
    expect(summary.maxDepth).toBe(4);
  });

  it('compte zéro pour une liste vide', () => {
    expect(countViolations([])).toEqual({ minor: 0, moderate: 0, serious: 0, critical: 0 });
  });
});

describe('normaliseSnapshot', () => {
  it('renvoie le snapshot vide pour une valeur qui n’est pas un objet', () => {
    expect(normaliseSnapshot(null)).toEqual(EMPTY_SNAPSHOT);
    expect(normaliseSnapshot('texte')).toEqual(EMPTY_SNAPSHOT);
  });

  it('filtre les titres hors bornes et les liens sans URL', () => {
    const snapshot = normaliseSnapshot({
      headings: [
        { level: 1, text: 'Titre' },
        { level: 9, text: 'Hors bornes' },
        { level: 'deux', text: 'Type invalide' },
      ],
      links: [
        { href: 'https://exemple.fr', text: 'ok' },
        { href: '', text: 'vide' },
        { text: 'sans href' },
      ],
    });

    expect(snapshot.headings).toEqual([{ level: 1, text: 'Titre' }]);
    expect(snapshot.links).toHaveLength(1);
  });

  it('distingue un alt absent d’un alt vide', () => {
    const snapshot = normaliseSnapshot({
      images: [
        { src: 'a.png', alt: '', width: 10, height: 10 },
        { src: 'b.png', alt: null, width: 0, height: 0 },
      ],
    });

    expect(snapshot.images[0]?.alt).toBe('');
    expect(snapshot.images[1]?.alt).toBeNull();
  });

  it('ramène les compteurs négatifs ou non finis à zéro', () => {
    const snapshot = normaliseSnapshot({
      landmarks: { main: -2, nav: Number.NaN, header: 2.7, footer: '3' },
    });

    expect(snapshot.landmarks).toEqual({ main: 0, nav: 0, header: 2, footer: 0 });
  });

  it('tronque le texte à la longueur maximale', () => {
    const snapshot = normaliseSnapshot({ text: 'a'.repeat(25_000) });

    expect(snapshot.text).toHaveLength(20_000);
  });
});
