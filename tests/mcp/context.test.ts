import { describe, expect, it } from 'vitest';

import { openMcpServices } from '../../src/mcp/context.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';
import { openTestServices } from './helpers.js';

describe('openMcpServices', () => {
  it('ouvre une base vide sans fournisseur et la ferme', async () => {
    const dataDir = createDataDir();
    const services = openMcpServices({ dataDir, env: {} });

    try {
      expect(services.dataDir).toBe(dataDir);
      expect(services.embeddingsAvailable).toBe(false);
      await expect(services.manager.listResources()).resolves.toEqual([]);
    } finally {
      services.close();
      // Fermeture idempotente : un second appel ne lève pas.
      services.close();
      removeDataDir(dataDir);
    }
  });

  it('déduit le répertoire de données de l’environnement', () => {
    const dataDir = createDataDir();
    const services = openMcpServices({ env: { EKTS_DATA_DIR: dataDir } });

    try {
      expect(services.dataDir).toBe(dataDir);
    } finally {
      services.close();
      removeDataDir(dataDir);
    }
  });

  it('expose les embeddings quand un fournisseur est injecté', async () => {
    const fixture = openTestServices({ embeddings: true });

    try {
      expect(fixture.services.embeddingsAvailable).toBe(true);

      await fixture.services.manager.addResource({ type: 'article', title: 'Avec vecteurs' });

      const results = await fixture.services.search.search('vecteurs', { mode: 'vector' });

      expect(results).toHaveLength(1);
    } finally {
      fixture.cleanup();
    }
  });
});
