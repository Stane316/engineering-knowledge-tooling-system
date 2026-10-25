import { describe, expect, it } from 'vitest';

import { buildEmbeddingText } from '../../src/business/vector-indexer.js';
import {
  DEFAULT_SEARCH_LIMIT,
  FILTER_OVERSAMPLE,
  MAX_CANDIDATE_LIMIT,
  candidateLimit,
  matchesFilters,
  resolveLimit,
} from '../../src/business/search-engine.js';
import { MAX_QUERY_TOKENS, toFtsQuery } from '../../src/data/fts-repository.js';
import {
  cosineSimilarity,
  encodeEmbedding,
  decodeEmbedding,
} from '../../src/data/vector-repository.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import { EmbeddingsError, SearchError } from '../../src/shared/errors.js';
import type { Resource } from '../../src/shared/validators.js';

const resource = (overrides: Partial<Resource> = {}): Resource => ({
  id: 'r1',
  type: 'article',
  title: 'Titre',
  tags: ['SQLite', 'Recherche'],
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('toFtsQuery', () => {
  it('cite chaque terme et les joint par AND', () => {
    expect(toFtsQuery('sqlite bm25')).toBe('"sqlite" AND "bm25"');
  });

  it('neutralise les opérateurs et la ponctuation FTS5', () => {
    expect(toFtsQuery('C++ (pointeurs)')).toBe('"C" AND "pointeurs"');
    expect(toFtsQuery('NEAR/3 OR NOT')).toBe('"NEAR" AND "3" AND "OR" AND "NOT"');
    expect(toFtsQuery('"non fermé')).toBe('"non" AND "fermé"');
    expect(toFtsQuery('boost^2 -exclu')).toBe('"boost" AND "2" AND "exclu"');
  });

  it('conserve les accents et les chiffres', () => {
    expect(toFtsQuery('générateur 2026')).toBe('"générateur" AND "2026"');
  });

  it('renvoie null quand aucun terme exploitable ne reste', () => {
    expect(toFtsQuery('')).toBeNull();
    expect(toFtsQuery('   ')).toBeNull();
    expect(toFtsQuery('!!! ??? ***')).toBeNull();
  });

  it('borne le nombre de termes', () => {
    const many = Array.from({ length: MAX_QUERY_TOKENS + 10 }, (_, index) => `t${index}`).join(' ');
    const expression = toFtsQuery(many) ?? '';

    expect(expression.split(' AND ')).toHaveLength(MAX_QUERY_TOKENS);
  });
});

describe('resolveLimit', () => {
  it('applique la limite par défaut', () => {
    expect(DEFAULT_SEARCH_LIMIT).toBe(10);
    expect(resolveLimit(undefined)).toBe(10);
  });

  it('accepte un entier positif', () => {
    expect(resolveLimit(1)).toBe(1);
    expect(resolveLimit(25)).toBe(25);
  });

  it('refuse zéro, un négatif et un non-entier', () => {
    expect(() => resolveLimit(0)).toThrow(SearchError);
    expect(() => resolveLimit(-3)).toThrow(SearchError);
    expect(() => resolveLimit(2.5)).toThrow(SearchError);
  });
});

describe('candidateLimit', () => {
  it('suréchantillonne pour laisser de la marge aux filtres', () => {
    expect(FILTER_OVERSAMPLE).toBe(5);
    expect(candidateLimit(10)).toBe(50);
  });

  it('plafonne pour protéger la latence', () => {
    expect(candidateLimit(1000)).toBe(MAX_CANDIDATE_LIMIT);
  });
});

describe('matchesFilters', () => {
  it('accepte tout résultat sans filtre', () => {
    expect(matchesFilters(resource(), {})).toBe(true);
    expect(matchesFilters(resource(), { tags: [] })).toBe(true);
  });

  it('filtre sur le type', () => {
    expect(matchesFilters(resource({ type: 'article' }), { type: 'article' })).toBe(true);
    expect(matchesFilters(resource({ type: 'video' }), { type: 'article' })).toBe(false);
  });

  it('filtre par projet (Sprint 13) : correspondance stricte sur projectId', () => {
    const projectId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
    const assigned = resource({ projectId });

    expect(matchesFilters(assigned, { projectId })).toBe(true);
    expect(matchesFilters(assigned, { projectId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })).toBe(
      false,
    );
    // Une ressource sans projet ne correspond jamais à un filtre explicite.
    expect(matchesFilters(resource(), { projectId })).toBe(false);
    // Sans filtre projet, le statut de projet est indifférent.
    expect(matchesFilters(resource(), {})).toBe(true);
    expect(matchesFilters(assigned, {})).toBe(true);
  });

  it('exige tous les tags demandés (ET), sans tenir compte de la casse', () => {
    const target = resource({ tags: ['SQLite', 'Recherche'] });

    expect(matchesFilters(target, { tags: ['sqlite'] })).toBe(true);
    expect(matchesFilters(target, { tags: ['SQLITE', 'recherche'] })).toBe(true);
    expect(matchesFilters(target, { tags: ['sqlite', 'absent'] })).toBe(false);
  });

  it('tolère les espaces autour des tags demandés', () => {
    expect(matchesFilters(resource(), { tags: ['  sqlite  '] })).toBe(true);
  });
});

describe('buildEmbeddingText', () => {
  it('concatène titre, contenu et tags', () => {
    expect(buildEmbeddingText({ title: 'Titre', content: 'Contenu', tags: ['a', 'b'] })).toBe(
      'Titre\nContenu\na b',
    );
  });

  it('ignore les champs vides', () => {
    expect(buildEmbeddingText({ title: 'Titre', content: undefined, tags: [] })).toBe('Titre');
    expect(buildEmbeddingText({ title: '  ', content: '   ', tags: [] })).toBe('');
  });
});

describe('cosineSimilarity', () => {
  it('convertit une distance L2 entre vecteurs unitaires en cosinus', () => {
    expect(cosineSimilarity(0)).toBeCloseTo(1, 12);
    expect(cosineSimilarity(Math.SQRT2)).toBeCloseTo(0, 12);
    expect(cosineSimilarity(2)).toBeCloseTo(-1, 12);
  });

  it('borne le résultat à -1 malgré les erreurs d’arrondi float32', () => {
    expect(cosineSimilarity(1.5)).toBeCloseTo(-0.125, 12);
    expect(cosineSimilarity(2.5)).toBe(-1);
    expect(cosineSimilarity(3)).toBe(-1);
  });
});

describe('encodeEmbedding', () => {
  it('normalise le vecteur à la norme 1', () => {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    vector[0] = 3;
    vector[1] = 4;

    const decoded = decodeEmbedding(encodeEmbedding(vector));

    expect(decoded).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(decoded[0]).toBeCloseTo(0.6, 6);
    expect(decoded[1]).toBeCloseTo(0.8, 6);
    expect(Math.hypot(...decoded)).toBeCloseTo(1, 6);
  });

  it('refuse une dimension incorrecte', () => {
    expect(() => encodeEmbedding([0.1, 0.2])).toThrow(EmbeddingsError);
  });

  it('refuse une valeur non finie', () => {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    vector[0] = Number.NaN;

    expect(() => encodeEmbedding(vector)).toThrow(EmbeddingsError);
  });

  it('refuse un vecteur nul', () => {
    expect(() => encodeEmbedding(new Array<number>(EMBEDDING_DIMENSIONS).fill(0))).toThrow(
      EmbeddingsError,
    );
  });
});
