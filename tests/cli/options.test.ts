import { InvalidArgumentError } from 'commander';
import { describe, expect, it } from 'vitest';

import { parseLimit, parseOffset, parseTags } from '../../src/cli/options.js';

describe('parseTags', () => {
  it('renvoie une liste vide sans option', () => {
    expect(parseTags(undefined)).toEqual([]);
    expect(parseTags('')).toEqual([]);
    expect(parseTags(' , ')).toEqual([]);
  });

  it('découpe, nettoie et ignore les entrées vides', () => {
    expect(parseTags(' sqlite, ,FTS ')).toEqual(['sqlite', 'FTS']);
  });
});

describe('parseLimit', () => {
  it('accepte un entier dans les bornes', () => {
    expect(parseLimit('1')).toBe(1);
    expect(parseLimit('1000')).toBe(1000);
  });

  it('refuse une valeur hors bornes ou non entière', () => {
    for (const raw of ['0', '1001', '1.5', 'abc']) {
      expect(() => parseLimit(raw)).toThrow(InvalidArgumentError);
    }
  });
});

describe('parseOffset', () => {
  it('accepte zéro et les entiers positifs', () => {
    expect(parseOffset('0')).toBe(0);
    expect(parseOffset('42')).toBe(42);
  });

  it('refuse une valeur négative ou non entière', () => {
    for (const raw of ['-1', '2.5', 'abc']) {
      expect(() => parseOffset(raw)).toThrow(InvalidArgumentError);
    }
  });
});
