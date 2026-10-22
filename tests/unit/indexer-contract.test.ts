import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Indexer, type IIndexer } from '../../src/business/indexer.js';
import { KnowledgeManager } from '../../src/business/knowledge-manager.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';

/**
 * Vérifie le point d'injection `IIndexer` (critère C3.14 : couplage faible).
 * Le manager ne doit dépendre que du contrat, jamais de l'implémentation SQLite.
 */
describe('Contrat IIndexer', () => {
  let dataDir: string;
  let database: EktsDatabase;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-contract-'));
    database = openDatabase({ dataDir });
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('Indexer implémente IIndexer', () => {
    const indexer: IIndexer = new Indexer(database.connection);

    expect(indexer.countResources()).toBe(0);
    expect(indexer.countIndexed()).toBe(0);
    expect(indexer.checkIntegrity().consistent).toBe(true);
    expect(indexer.reindexAll()).toMatchObject({ resources: 0, indexed: 0 });
  });

  it('KnowledgeManager accepte une implémentation factice de IIndexer', async () => {
    const calls: string[] = [];
    const fake: IIndexer = {
      reindexAll: () => {
        calls.push('reindexAll');
        return { resources: 7, indexed: 7, durationMs: 1 };
      },
      checkIntegrity: () => {
        calls.push('checkIntegrity');
        return { resources: 7, indexed: 7, missing: 0, orphans: 0, consistent: true };
      },
      countResources: () => 7,
      countIndexed: () => 7,
    };

    const manager = new KnowledgeManager(new ResourceRepository(database.connection), fake);

    expect(await manager.stats()).toMatchObject({ total: 0, indexed: 7, consistent: true });
    expect(await manager.reindex()).toMatchObject({ resources: 7, indexed: 7 });
    expect(calls).toEqual(['checkIntegrity', 'reindexAll']);
  });
});
