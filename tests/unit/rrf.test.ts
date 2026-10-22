import { describe, expect, it } from 'vitest';

import { FusionError } from '../../src/shared/errors.js';
import { RRF_K, fuseResults, reciprocalRank } from '../../src/business/rrf.js';
import type { Resource } from '../../src/shared/validators.js';
import type { SearchResult } from '../../src/shared/types.js';

const resource = (id: string, updatedAt = '2026-01-01T00:00:00.000Z'): Resource => ({
  id,
  type: 'article',
  title: `Titre ${id}`,
  tags: [],
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt,
});

const result = (id: string, score = 0, updatedAt?: string): SearchResult => ({
  resource: resource(id, updatedAt),
  score,
  source: 'fts',
});

describe('reciprocalRank', () => {
  it('applique 1/(k+rang) avec k = 60 par défaut', () => {
    expect(RRF_K).toBe(60);
    expect(reciprocalRank(1)).toBeCloseTo(1 / 61, 12);
    expect(reciprocalRank(2)).toBeCloseTo(1 / 62, 12);
    expect(reciprocalRank(60)).toBeCloseTo(1 / 120, 12);
  });

  it('décroît strictement avec le rang', () => {
    for (let rank = 1; rank < 20; rank += 1) {
      expect(reciprocalRank(rank)).toBeGreaterThan(reciprocalRank(rank + 1));
    }
  });

  it('accepte une constante de lissage personnalisée', () => {
    expect(reciprocalRank(1, 10)).toBeCloseTo(1 / 11, 12);
  });

  it('refuse une constante non entière ou ≤ 0', () => {
    expect(() => reciprocalRank(1, 0)).toThrow(FusionError);
    expect(() => reciprocalRank(1, -5)).toThrow(FusionError);
    expect(() => reciprocalRank(1, 1.5)).toThrow(FusionError);
  });

  it('refuse un rang invalide', () => {
    expect(() => reciprocalRank(0)).toThrow(FusionError);
    expect(() => reciprocalRank(-1)).toThrow(FusionError);
    expect(() => reciprocalRank(1.5)).toThrow(FusionError);
  });
});

describe('fuseResults', () => {
  it('somme les contributions des deux classements', () => {
    const fused = fuseResults([result('a'), result('b')], [result('b'), result('c')]);

    const scores = new Map(fused.map((item) => [item.resource.id, item.score]));

    expect(scores.get('a')).toBeCloseTo(1 / 61, 12);
    expect(scores.get('b')).toBeCloseTo(1 / 62 + 1 / 61, 12);
    expect(scores.get('c')).toBeCloseTo(1 / 62, 12);
  });

  it('place en tête le document corroboré par les deux moteurs', () => {
    const fused = fuseResults(
      [result('fts-only'), result('both')],
      [result('vector-only'), result('both')],
    );

    expect(fused.map((item) => item.resource.id)).toEqual(['both', 'fts-only', 'vector-only']);
  });

  it('marque tous les résultats comme hybrides', () => {
    const fused = fuseResults([result('a')], [result('b')]);

    expect(fused.every((item) => item.source === 'hybrid')).toBe(true);
  });

  it('ignore les scores d’origine, seuls les rangs comptent', () => {
    const withHugeScore = fuseResults([result('a', 1e9), result('b', -1)], []);
    const withTinyScore = fuseResults([result('a', 0), result('b', 0)], []);

    expect(withHugeScore.map((item) => item.score)).toEqual(
      withTinyScore.map((item) => item.score),
    );
  });

  it('départage les égalités par identifiant (tri total et reproductible)', () => {
    const fused = fuseResults([result('z')], [result('a')]);

    expect(fused.map((item) => item.resource.id)).toEqual(['a', 'z']);
  });

  it('renvoie un tableau vide quand les deux classements sont vides', () => {
    expect(fuseResults([], [])).toEqual([]);
  });

  it('conserve la ressource complète du premier classement', () => {
    const [fused] = fuseResults([result('a')], [result('a')]);

    expect(fused?.resource.title).toBe('Titre a');
    expect(fused?.resource.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('échoue si la même ressource diverge entre les deux moteurs', () => {
    expect(() => fuseResults([result('a')], [result('a', 0, '2026-02-02T00:00:00.000Z')])).toThrow(
      FusionError,
    );
  });

  it('refuse une constante de lissage invalide', () => {
    expect(() => fuseResults([], [], 0)).toThrow(FusionError);
    expect(() => fuseResults([], [], 2.5)).toThrow(FusionError);
  });

  it('respecte une constante personnalisée', () => {
    const [fused] = fuseResults([result('a')], [], 1);

    expect(fused?.score).toBeCloseTo(1 / 2, 12);
  });
});
