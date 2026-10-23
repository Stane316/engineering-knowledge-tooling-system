import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Les runners Windows partagés sont lents et sous charge : le délai par
    // défaut de 5 s produit des échecs sans rapport avec le code (mesuré sur
    // `vector-repository` et sur les tests qui lancent un processus Node).
    // Un vrai blocage reste détecté, simplement plus tard.
    testTimeout: 20_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/cli/index.ts',
        'src/**/*.d.ts',
        'src/shared/types.ts',
        'src/browser/types.ts',
        'src/business/knowledge-manager.types.ts',
        'src/business/search-engine.types.ts',
        'src/shared/providers/types.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
