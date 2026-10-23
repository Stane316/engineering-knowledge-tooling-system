/**
 * Tests de l'analyseur axe-core.
 *
 * Le score est une décision produit : il doit être reproductible et
 * explicable. Ces tests fixent la formule (poids par gravité × nœuds), le tri
 * des violations, la normalisation d'une gravité manquante et la traduction
 * des erreurs.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  AxeAnalyzer,
  AXE_TAGS,
  createAxeRunner,
  IMPACT_WEIGHTS,
  loadAxe,
  normaliseImpact,
  scoreViolations,
} from '../../src/browser/axe.js';
import type { AxeViolation } from '../../src/browser/inspection/types.js';
import { createFakePage } from './helpers.js';
import { createAxeRunner as fakeRunner } from './inspection/fixtures.js';

/** Violation minimale pour les tests de score. */
function violation(impact: AxeViolation['impact'], nodes = 1): AxeViolation {
  return {
    id: `${impact}-rule`,
    impact,
    description: '',
    help: '',
    helpUrl: '',
    nodes,
    tags: [],
  };
}

describe('scoreViolations', () => {
  it('vaut 100 sans violation', () => {
    expect(scoreViolations([])).toBe(100);
  });

  it('applique le poids de chaque gravité', () => {
    expect(scoreViolations([violation('minor')])).toBe(99);
    expect(scoreViolations([violation('moderate')])).toBe(97);
    expect(scoreViolations([violation('serious')])).toBe(95);
    expect(scoreViolations([violation('critical')])).toBe(90);
  });

  it('multiplie le poids par le nombre de nœuds', () => {
    expect(scoreViolations([violation('serious', 3)])).toBe(85);
  });

  it('plafonne à zéro sans devenir négatif', () => {
    expect(scoreViolations([violation('critical', 50)])).toBe(0);
  });

  it('compte au moins un nœud par violation', () => {
    expect(scoreViolations([violation('critical', 0)])).toBe(90);
  });

  it('expose des poids cohérents', () => {
    expect(IMPACT_WEIGHTS).toEqual({ minor: 1, moderate: 3, serious: 5, critical: 10 });
  });
});

describe('normaliseImpact', () => {
  it('conserve les gravités connues', () => {
    expect(normaliseImpact('critical')).toBe('critical');
    expect(normaliseImpact('serious')).toBe('serious');
    expect(normaliseImpact('moderate')).toBe('moderate');
    expect(normaliseImpact('minor')).toBe('minor');
  });

  it('ramène une gravité absente ou inconnue à minor', () => {
    expect(normaliseImpact(null)).toBe('minor');
    expect(normaliseImpact(undefined)).toBe('minor');
    expect(normaliseImpact('catastrophic')).toBe('minor');
  });
});

describe('AxeAnalyzer — analyse nominale', () => {
  it('trie les violations de la plus grave à la moins grave', async () => {
    const { runner } = fakeRunner();
    const result = await new AxeAnalyzer(runner).analyze(createFakePage());

    expect(result.violations.map((entry) => entry.id)).toEqual(['color-contrast', 'label']);
    expect(result.violations.map((entry) => entry.impact)).toEqual(['serious', 'minor']);
  });

  it('calcule le score à partir des nœuds fautifs', async () => {
    const { runner } = fakeRunner();
    const result = await new AxeAnalyzer(runner).analyze(createFakePage());

    // color-contrast : serious × 3 nœuds = 15 ; label : minor × 1 = 1.
    expect(result.score).toBe(84);
  });

  it('rapporte les compteurs de règles', async () => {
    const { runner } = fakeRunner();
    const result = await new AxeAnalyzer(runner).analyze(createFakePage());

    expect(result.passCount).toBe(4);
    expect(result.inapplicableCount).toBe(1);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('transmet la page et les tags à l’exécutant', async () => {
    const { runner, run } = fakeRunner();
    const page = createFakePage();

    await new AxeAnalyzer(runner).analyze(page, { tags: ['wcag22aa'] });

    expect(run).toHaveBeenCalledWith(page, { tags: ['wcag22aa'] });
  });
});

describe('AxeAnalyzer — entrées dégradées', () => {
  it('accepte une violation sans identifiant ni gravité', async () => {
    const { runner } = fakeRunner({ violations: [{ nodes: [{}, {}] }] });
    const result = await new AxeAnalyzer(runner).analyze(createFakePage());

    expect(result.violations[0]).toMatchObject({
      id: 'violation-0',
      impact: 'minor',
      nodes: 2,
      tags: [],
    });
    expect(result.score).toBe(98);
  });

  it('accepte un résultat vide', async () => {
    const { runner } = fakeRunner({ violations: [], passes: [], inapplicable: [] });
    const result = await new AxeAnalyzer(runner).analyze(createFakePage());

    expect(result).toMatchObject({
      violations: [],
      score: 100,
      passCount: 0,
      inapplicableCount: 0,
    });
  });

  it('traduit un échec en InspectionError', async () => {
    const { runner } = fakeRunner({ error: new Error('injection refusée') });

    await expect(new AxeAnalyzer(runner).analyze(createFakePage())).rejects.toMatchObject({
      code: 'INSPECTION_FAILED',
      stage: 'axe',
      message: 'Inspection (axe) : injection refusée',
    });
  });
});

describe('AXE_TAGS', () => {
  it('couvre WCAG 2.2 niveaux A et AA', () => {
    expect([...AXE_TAGS]).toEqual([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22a',
      'wcag22aa',
      'best-practice',
    ]);
  });
});

describe('createAxeRunner', () => {
  it('configure l’AxeBuilder avec les tags fournis', async () => {
    const analyze = vi.fn(async () => ({ violations: [] }));
    const builder = { withTags: vi.fn(() => builder), options: vi.fn(), analyze };
    const module = {
      default: vi.fn(function (this: unknown) {
        return builder;
      }),
    };

    const runner = createAxeRunner(module);
    const page = createFakePage();

    await runner.run(page, { tags: ['wcag2a'] });

    expect(builder.withTags).toHaveBeenCalledWith(['wcag2a']);
    expect(analyze).toHaveBeenCalledOnce();
  });

  it('applique les tags par défaut', async () => {
    const analyze = vi.fn(async () => ({ violations: [] }));
    const builder = { withTags: vi.fn(() => builder), options: vi.fn(), analyze };
    const module = {
      default: vi.fn(function (this: unknown) {
        return builder;
      }),
    };

    await createAxeRunner(module).run(createFakePage());

    expect(builder.withTags).toHaveBeenCalledWith([...AXE_TAGS]);
  });
});

describe('loadAxe', () => {
  it('charge réellement @axe-core/playwright', async () => {
    const module = await loadAxe();

    expect(typeof module.default).toBe('function');
  });
});
