/**
 * Tests du niveau 3 : axe-core, heuristiques UX, contenu et lisibilité.
 *
 * Les analyses de lisibilité sont fixées par des valeurs connues : si la
 * formule change, ces tests doivent changer explicitement, pas dériver.
 */

import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AxeAnalyzer } from '../../../src/browser/axe.js';
import { LighthouseAnalyzer } from '../../../src/browser/lighthouse.js';
import {
  analyseContent,
  countSyllables,
  readabilityScore,
  splitSentences,
  WORDS_PER_MINUTE,
} from '../../../src/browser/inspection/content.js';
import { inspectLevelThree } from '../../../src/browser/inspection/level-3.js';
import { analyseUx, UX_HEURISTICS } from '../../../src/browser/inspection/ux.js';
import type { InspectionContext, PageSnapshot } from '../../../src/browser/inspection/types.js';
import {
  createAxeRunner,
  createLevelSession,
  createLighthouseRunner,
  SNAPSHOT,
  SPARSE_SNAPSHOT,
} from './fixtures.js';

/** Contexte d'inspection à l'horloge fixe. */
function makeContext(
  overrides: Partial<InspectionContext['options']> = {},
  sessionOptions: Parameters<typeof createLevelSession>[0] = {},
  elapsed = 12_000,
): InspectionContext {
  const { session } = createLevelSession(sessionOptions);
  const started = 1_700_000_000_000;

  return {
    session,
    options: {
      url: 'https://exemple.fr/guide',
      level: 'L3',
      viewport: { width: 1920, height: 1080 },
      userAgent: undefined,
      timeout: 30_000,
      browserKind: 'chromium',
      outputDir: join('artifacts', 'inspections', 'tests'),
      screenshot: true,
      trace: false,
      pdf: false,
      strict: false,
      allowPrivateHosts: false,
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
}

/** Dépendances complètes et factices. */
function makeDependencies() {
  const lighthouse = createLighthouseRunner();
  const axe = createAxeRunner();

  return {
    lighthouse: new LighthouseAnalyzer(lighthouse.runner),
    axe: new AxeAnalyzer(axe.runner),
    debugPort: 9222,
    axeCalls: axe.run,
  };
}

function snapshotWith(overrides: Partial<PageSnapshot>): PageSnapshot {
  return { ...SNAPSHOT, ...overrides };
}

describe('inspectLevelThree — analyse nominale', () => {
  it('cumule les trois niveaux', async () => {
    const context = makeContext();
    const { axeCalls } = makeDependencies();
    const dependencies = makeDependencies();

    const result = await inspectLevelThree(context, dependencies);

    expect(result.level).toBe('L3');
    expect(result.budget).toBe(60_000);
    expect(result.lighthouse?.performance.score).toBe(92);
    expect(result.axe?.score).toBe(84);
    expect(result.ux.score).toBe(100);
    expect(result.content.wordCount).toBeGreaterThan(0);
    expect(axeCalls).toBeDefined();
  });

  it('transmet la page courante à axe-core', async () => {
    const context = makeContext();
    const axeRunner = createAxeRunner();

    await inspectLevelThree(context, {
      lighthouse: new LighthouseAnalyzer(createLighthouseRunner().runner),
      axe: new AxeAnalyzer(axeRunner.runner),
      debugPort: 9222,
    });

    expect(axeRunner.run).toHaveBeenCalledWith(context.session.getPage(), {});
  });

  it('garde Lighthouse et axe-core indépendants', async () => {
    const context = makeContext();
    const axeRunner = createAxeRunner();

    const result = await inspectLevelThree(context, {
      lighthouse: new LighthouseAnalyzer(createLighthouseRunner().runner),
      axe: new AxeAnalyzer(axeRunner.runner),
      debugPort: 9222,
    });

    expect(result.lighthouse?.seo.score).toBe(80);
    expect(result.seo.score).toBe(100);
    expect(result.axe?.violations).toHaveLength(2);
  });
});

describe('inspectLevelThree — dégradations', () => {
  it('signale un axe-core indisponible sans perdre le reste', async () => {
    const context = makeContext();
    const axeRunner = createAxeRunner({ error: new Error('script bloqué par la CSP') });

    const result = await inspectLevelThree(context, {
      lighthouse: new LighthouseAnalyzer(createLighthouseRunner().runner),
      axe: new AxeAnalyzer(axeRunner.runner),
      debugPort: 9222,
    });

    expect(result.axe).toBeNull();
    expect(result.warnings.join(' ')).toContain('Analyse axe-core indisponible');
    expect(result.ux.score).toBe(100);
  });

  it('lève en mode strict quand axe-core échoue', async () => {
    const context = makeContext({ strict: true });
    const axeRunner = createAxeRunner({ error: new Error('injection refusée') });

    await expect(
      inspectLevelThree(context, {
        lighthouse: new LighthouseAnalyzer(createLighthouseRunner().runner),
        axe: new AxeAnalyzer(axeRunner.runner),
        debugPort: 9222,
      }),
    ).rejects.toMatchObject({ stage: 'axe' });
  });

  it('utilise un analyseur axe réel par défaut sans planter la construction', async () => {
    const context = makeContext();

    // Aucun navigateur n'est lancé : l'analyseur par défaut est construit mais
    // son exécutant échoue à l'injection, ce qui doit être dégradé.
    const result = await inspectLevelThree(context, {
      lighthouse: new LighthouseAnalyzer(createLighthouseRunner().runner),
      debugPort: 9222,
    });

    expect(result.axe).toBeNull();
    expect(result.warnings.join(' ')).toContain('axe');
  });
});

describe('inspectLevelThree — budget', () => {
  it('signale un dépassement de 60 s', async () => {
    const context = makeContext({}, {}, 61_500);
    const result = await inspectLevelThree(context, makeDependencies());

    expect(result.withinBudget).toBe(false);
    expect(result.duration).toBe(61_500);
  });
});

describe('analyseUx — page saine', () => {
  it('vaut 100 quand tous les signaux sont présents', () => {
    const result = analyseUx(SNAPSHOT);

    expect(result.score).toBe(100);
    expect(result.heuristics).toHaveLength(UX_HEURISTICS.length);
    expect(result.heuristics.every((entry) => entry.issues.length === 0)).toBe(true);
  });

  it('évalue cinq heuristiques nommées', () => {
    const result = analyseUx(SNAPSHOT);

    expect(result.heuristics.map((entry) => entry.id)).toEqual([
      'status',
      'match',
      'control',
      'consistency',
      'error-prevention',
    ]);
  });
});

describe('analyseUx — constats', () => {
  it('pénalise chaque signal absent', () => {
    const result = analyseUx(SPARSE_SNAPSHOT);

    // Quatre heuristiques sur cinq trouvent un constat ; la prévention des
    // erreurs reste à 100 car la page ne contient aucun formulaire à protéger.
    expect(result.heuristics.filter((entry) => entry.issues.length > 0)).toHaveLength(4);
    expect(result.heuristics.find((entry) => entry.id === 'error-prevention')?.score).toBe(100);
    expect(result.score).toBe(65);
  });

  it('signale les champs sans étiquette', () => {
    const result = analyseUx(snapshotWith({ inputs: 4, labelledInputs: 1, buttons: 0 }));
    const prevention = result.heuristics.find((entry) => entry.id === 'error-prevention');

    expect(prevention?.score).toBe(50);
    expect(prevention?.issues.join(' ')).toContain('3 champ(s) sans étiquette');
    expect(prevention?.issues.join(' ')).toContain('sans action visible');
  });

  it('signale un cadre intégré et un manque de texte', () => {
    const result = analyseUx(snapshotWith({ iframes: 2, text: 'court' }));
    const status = result.heuristics.find((entry) => entry.id === 'status');

    expect(status?.score).toBe(50);
    expect(status?.issues.join(' ')).toContain('2 cadre(s)');
  });

  it('signale une hiérarchie incohérente', () => {
    const result = analyseUx(
      snapshotWith({
        headings: [
          { level: 1, text: 'A' },
          { level: 1, text: 'B' },
          { level: 3, text: 'C' },
        ],
      }),
    );
    const consistency = result.heuristics.find((entry) => entry.id === 'consistency');

    expect(consistency?.score).toBe(50);
    expect(consistency?.issues.join(' ')).toContain('2 titres de niveau 1');
  });

  it('signale un cul-de-sac', () => {
    const result = analyseUx(
      snapshotWith({ links: [], landmarks: { ...SNAPSHOT.landmarks, nav: 0 } }),
    );
    const control = result.heuristics.find((entry) => entry.id === 'control');

    // Deux constats (pas de navigation, pas de lien) : 100 − 2 × 25.
    expect(control?.score).toBe(50);
  });
});

describe('readabilityScore', () => {
  it('vaut 0 pour un texte vide', () => {
    expect(readabilityScore('')).toBe(0);
  });

  it('donne un score élevé à des phrases courtes et simples', () => {
    const simple = 'Le chat dort. Il fait beau. La vie est belle.'.repeat(5);

    expect(readabilityScore(simple)).toBeGreaterThan(80);
  });

  it('donne un score plus faible à un texte long et imbriqué', () => {
    const complex =
      'La complexité inhérente aux systèmes d’information distribués nécessite une approche méthodologique rigoureuse et systématique. '.repeat(
        5,
      );

    expect(readabilityScore(complex)).toBeLessThan(readabilityScore('Le chat dort. Il fait beau.'));
  });

  it('reste dans les bornes 0-100', () => {
    const score = readabilityScore('a');

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('découpe les phrases et compte les syllabes', () => {
    expect(splitSentences('Un. Deux ! Trois ?')).toHaveLength(3);
    expect(countSyllables('chat')).toBe(1);
    expect(countSyllables('maison')).toBe(2);
    expect(countSyllables('ordinateur')).toBeGreaterThanOrEqual(3);
    expect(countSyllables('')).toBe(1);
  });
});

describe('analyseContent', () => {
  it('mesure le volume et le temps de lecture', () => {
    const result = analyseContent(SNAPSHOT);

    expect(result.wordCount).toBe(480);
    expect(result.readingTime).toBe(Math.ceil(480 / WORDS_PER_MINUTE));
    expect(result.structure).toEqual({ paragraphs: 8, lists: 3, tables: 1, headings: 3 });
  });

  it('vaut zéro sur une page vide', () => {
    const result = analyseContent(SPARSE_SNAPSHOT);

    expect(result.score).toBe(0);
    expect(result.wordCount).toBe(0);
    expect(result.readingTime).toBe(0);
    expect(result.readabilityScore).toBe(0);
  });

  it('pénalise une page trop courte et sans structure', () => {
    const result = analyseContent(
      snapshotWith({ text: 'Un texte court.', paragraphs: 0, headings: [] }),
    );

    expect(result.score).toBeLessThanOrEqual(70);
  });

  it('ne pénalise pas un texte dense mais bien structure', () => {
    const result = analyseContent(snapshotWith({ text: 'phrase simple et claire. '.repeat(200) }));

    expect(result.score).toBeGreaterThanOrEqual(85);
  });
});
