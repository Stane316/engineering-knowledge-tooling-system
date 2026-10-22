import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { normalizeTags, parseInput } from '../../src/business/knowledge-manager.js';
import { ValidationError } from '../../src/shared/errors.js';

describe('normalizeTags', () => {
  it('supprime les doublons en conservant la première graphie', () => {
    expect(normalizeTags(['TypeScript', 'typescript', 'TYPESCRIPT'])).toEqual(['TypeScript']);
  });

  it('supprime les espaces superflus', () => {
    expect(normalizeTags(['  sqlite  ', 'fts5'])).toEqual(['sqlite', 'fts5']);
  });

  it('écarte les chaînes vides après trim', () => {
    expect(normalizeTags(['a', '   ', '', 'b'])).toEqual(['a', 'b']);
  });

  it('conserve l’ordre d’apparition', () => {
    expect(normalizeTags(['z', 'a', 'm'])).toEqual(['z', 'a', 'm']);
  });

  it('retourne un tableau vide pour une entrée vide', () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it('déduplique aussi les variantes accentuées distinctes', () => {
    expect(normalizeTags(['données', 'Données', 'donnees'])).toEqual(['données', 'donnees']);
  });
});

describe('parseInput', () => {
  const schema = z.object({
    title: z.string().min(1, 'Le titre est obligatoire'),
    count: z.number().int(),
  });

  it('retourne la valeur validée et transformée', () => {
    expect(parseInput(schema, { title: 'Test', count: 2 })).toEqual({ title: 'Test', count: 2 });
  });

  it('convertit un ZodError en ValidationError, avec le chemin du champ', () => {
    expect(() => parseInput(schema, { title: '', count: 1 })).toThrow(ValidationError);

    try {
      parseInput(schema, { title: '', count: 1 });
    } catch (error) {
      expect((error as ValidationError).issues).toEqual(['title : Le titre est obligatoire']);
    }
  });

  it('préfixe le chemin imbriqué', () => {
    const nested = z.object({ metadata: z.object({ author: z.string().min(1, 'Requis') }) });

    try {
      parseInput(nested, { metadata: { author: '' } });
    } catch (error) {
      expect((error as ValidationError).issues).toEqual(['metadata.author : Requis']);
    }
  });

  it('laisse remonter une erreur non liée à Zod', () => {
    const faulty = {
      parse: () => {
        throw new Error('schéma cassé');
      },
    } as unknown as z.ZodType<unknown>;

    expect(() => parseInput(faulty, {})).toThrow('schéma cassé');
  });
});
