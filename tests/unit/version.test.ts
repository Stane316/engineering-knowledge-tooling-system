import { describe, expect, it } from 'vitest';

import { readVersion } from '../../src/shared/version.js';

describe('readVersion', () => {
  it('lit la version du package.json du projet', () => {
    expect(readVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('échoue si la version est absente', () => {
    const url = new URL('../fixtures/package-without-version.json', import.meta.url);
    expect(() => readVersion(url)).toThrow(/Version absente ou invalide/);
  });

  it('échoue si la version est vide', () => {
    const url = new URL('../fixtures/package-invalid-version.json', import.meta.url);
    expect(() => readVersion(url)).toThrow(/Version absente ou invalide/);
  });
});
