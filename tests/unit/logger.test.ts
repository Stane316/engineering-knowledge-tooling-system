import { describe, expect, it } from 'vitest';

import { createLogger } from '../../src/shared/logger.js';

describe('createLogger', () => {
  it('utilise le niveau demandé', () => {
    expect(createLogger('silent').level).toBe('silent');
    expect(createLogger('debug').level).toBe('debug');
  });
});
