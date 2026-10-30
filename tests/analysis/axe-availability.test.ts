import { describe, expect, it } from 'vitest';

import { AccessibilityAnalyzer } from '../../src/analysis/accessibility.js';
import type { AxeResults } from '../../src/analysis/types.js';

/**
 * Sprint 19-03 — C-W06 : quatre états d'accessibilité distincts.
 *
 * Le défaut corrigé : `violations: undefined` (propriété absente) et
 * `violations: []` (liste vide explicite) produisaient le même résultat —
 * « aucune violation » — et un score absent devenait `0`. Une absence de
 * mesure se lisait donc comme une conformité parfaite.
 *
 * Les quatre états attendus :
 * 1. `null` → axe-core n'a pas tourné (`outil-indisponible`) ;
 * 2. `violations` absente → analyse incomplète (`violations-absentes`) ;
 * 3. score absent → constats conservés, score indisponible (`score-absent`) ;
 * 4. liste vide + score fourni → mesure réelle, zéro violation.
 */

/** Violation WCAG minimale. */
function violation(overrides: Partial<NonNullable<AxeResults['violations']>[number]> = {}) {
  return {
    id: 'color-contrast',
    impact: 'serious' as const,
    description: 'Éléments insuffisamment contrastés',
    help: 'Augmenter le contraste',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
    ...overrides,
  };
}

describe('C-W06 — AccessibilityAnalyzer, états d’indisponibilité', () => {
  const analyzer = new AccessibilityAnalyzer();

  it('état 1 — axe-core absent rend la dimension indisponible', () => {
    const dimension = analyzer.analyze(null);

    expect(dimension.status).toBe('unavailable');
    expect(dimension.score).toBeNull();
    expect(dimension.unavailableReason).toBe('outil-indisponible');
    expect(dimension.findings).toEqual([]);
    expect(dimension.summary).toContain('axe-core');
  });

  it('état 2 — une liste de violations absente n’est pas « aucune violation »', () => {
    const dimension = analyzer.analyze({ score: 100 });

    expect(dimension.status).toBe('unavailable');
    expect(dimension.score).toBeNull();
    expect(dimension.unavailableReason).toBe('violations-absentes');
    expect(dimension.summary).toContain('ne signifie pas « aucune violation »');
  });

  it('état 3 — un score absent conserve les constats et laisse le score indisponible', () => {
    const dimension = analyzer.analyze({
      violations: [violation({ nodes: 4 })],
      score: null,
    });

    expect(dimension.status).toBe('unavailable');
    expect(dimension.score).toBeNull();
    expect(dimension.unavailableReason).toBe('score-absent');
    expect(dimension.findings).toHaveLength(1);
  });

  it('état 4 — une liste vide explicite avec score est une mesure réelle', () => {
    const dimension = analyzer.analyze({ violations: [], score: 100 });

    expect(dimension.status).toBe('measured');
    expect(dimension.score).toBe(100);
    expect(dimension.findings).toEqual([]);
  });
});

describe('C-W06 — AccessibilityAnalyzer, décompte d’éléments absent', () => {
  const analyzer = new AccessibilityAnalyzer();

  it('signale que le décompte n’a pas été fourni au lieu de l’inventer', () => {
    const dimension = analyzer.analyze({ violations: [violation()], score: 80 });
    const [finding] = dimension.findings;

    expect(finding?.description).toContain("nombre d'éléments affectés non fourni par axe-core");
    expect(finding?.nodesCount).toBeUndefined();
  });

  it('applique un effort moyen et un impact fondé sur la seule sévérité', () => {
    const dimension = analyzer.analyze({ violations: [violation()], score: 80 });
    const [finding] = dimension.findings;

    // `serious` → sévérité 3 ; sans décompte, effort 3 et impact 3 × 1.
    expect(finding?.severity).toBe(3);
    expect(finding?.effort).toBe(3);
    expect(finding?.impact).toBe(3);
  });

  it('conserve le décompte et l’effort proportionnel quand il est fourni', () => {
    const dimension = analyzer.analyze({ violations: [violation({ nodes: 3 })], score: 80 });
    const [finding] = dimension.findings;

    expect(finding?.description).toContain('3 élément(s) affecté(s)');
    expect(finding?.nodesCount).toBe(3);
    expect(finding?.effort).toBe(2);
  });
});
