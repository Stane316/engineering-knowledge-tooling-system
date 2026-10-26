import os from 'node:os';

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
    // Concurrence bornée (Sprint 18-03) : la parallélisation par défaut
    // (≈ un worker par cœur) sature le CPU dès que les fichiers E2E
    // navigateur (Playwright + Lighthouse, inspections L3) croisent les
    // tests qui spawn la CLI (100+ processus `node dist/cli`). Symptômes
    // mesurés sur le poste : inspections L3 > 60 s et Lighthouse renvoyé
    // `null` (echecs inspection-flow / mcp-flow). 4 workers au maximum
    // préservent les budgets navigateur sans pénaliser le reste.
    maxWorkers: Math.min(4, Math.max(2, os.availableParallelism())),
    coverage: {
      provider: 'v8',
      // json-summary : permet de relire l'agrégat (seuils) sans rouvrir le
      // rapport HTML — voir docs/CONTRIBUTING.md (lecture de la couverture).
      reporter: ['text', 'lcov', 'json-summary'],
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
