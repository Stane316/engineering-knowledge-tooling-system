import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import { createKnowledgeManager } from '../../src/business/knowledge-manager.js';
import { SearchEngine } from '../../src/business/search-engine.js';
import { VectorIndexer, withVectorIndexing } from '../../src/business/vector-indexer.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { FTSRepository } from '../../src/data/fts-repository.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import { SearchError } from '../../src/shared/errors.js';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';
import type { IKnowledgeManager } from '../../src/business/knowledge-manager.types.js';

describe('SearchEngine', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let provider: FakeEmbeddingProvider;
  let fts: FTSRepository;
  let vectors: VectorRepository;
  let engine: SearchEngine;
  let manager: IKnowledgeManager;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-search-'));
    database = openDatabase({ dataDir });
    provider = new FakeEmbeddingProvider();
    fts = new FTSRepository(database.connection);
    vectors = new VectorRepository(database.connection);

    const embeddings = new EmbeddingsService({ provider });
    const inner = createKnowledgeManager(database.connection);
    manager = withVectorIndexing(inner.manager, new VectorIndexer(embeddings, vectors));

    engine = new SearchEngine({ fts, vectors, embeddings });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const seed = async (): Promise<void> => {
    await manager.addResource({
      type: 'article',
      title: 'SQLite full text search',
      content: 'indexation bm25',
      tags: ['sqlite', 'recherche'],
    });
    await manager.addResource({
      type: 'video',
      title: 'Postgres vacuum',
      content: 'maintenance du stockage',
      tags: ['postgres'],
    });
    await manager.addResource({
      type: 'tutorial',
      title: 'Docker compose',
      content: 'orchestration de conteneurs',
      tags: ['docker'],
    });

    // Le seed indexe 3 vecteurs : on repart d'un compteur vierge pour observer
    // uniquement les appels déclenchés par la recherche.
    provider.calls.length = 0;
  };

  it('searchFTS retourne les résultats lexicaux', async () => {
    await seed();

    const results = await engine.searchFTS('sqlite');

    expect(results).toHaveLength(1);
    expect(results[0]?.source).toBe('fts');
  });

  it('searchVector retrouve un document par recouvrement de termes', async () => {
    await seed();

    const results = await engine.searchVector('sqlite search');

    expect(results[0]?.resource.title).toBe('SQLite full text search');
    expect(results[0]?.source).toBe('vector');
  });

  it('searchVector court-circuite l’appel réseau pour une requête vide', async () => {
    await seed();

    await expect(engine.searchVector('   ')).resolves.toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it('search(mode: fts) n’appelle pas le fournisseur d’embeddings', async () => {
    await seed();

    const results = await engine.search('sqlite', { mode: 'fts' });

    expect(results.every((item) => item.source === 'fts')).toBe(true);
    expect(provider.calls).toEqual([]);
  });

  it('search(mode: vector) interroge le fournisseur', async () => {
    await seed();

    const results = await engine.search('sqlite', { mode: 'vector' });

    expect(provider.calls.length).toBeGreaterThan(0);
    expect(results.every((item) => item.source === 'vector')).toBe(true);
  });

  it('search(mode: hybrid) fusionne les deux classements en RRF', async () => {
    await seed();

    const results = await engine.search('sqlite search', { mode: 'hybrid' });

    expect(results.every((item) => item.source === 'hybrid')).toBe(true);
    expect(results[0]?.resource.title).toBe('SQLite full text search');
  });

  it('hybride par défaut', async () => {
    await seed();

    const results = await engine.search('sqlite');

    expect(results[0]?.source).toBe('hybrid');
  });

  it('respecte la limite demandée', async () => {
    await seed();

    const results = await engine.search('sqlite postgres docker', { limit: 2 });

    expect(results).toHaveLength(2);
  });

  it('renvoie [] pour une requête vide, sans appel réseau', async () => {
    await seed();

    await expect(engine.search('', {})).resolves.toEqual([]);
    await expect(engine.search('    ')).resolves.toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it('filtre sur le type après fusion', async () => {
    await seed();

    const results = await engine.search('sqlite postgres docker', { type: 'video' });

    expect(results).toHaveLength(1);
    expect(results[0]?.resource.type).toBe('video');
  });

  it('filtre sur les tags (ET, insensible à la casse)', async () => {
    await seed();

    const results = await engine.search('sqlite', { tags: ['SQLite', 'Recherche'] });

    expect(results).toHaveLength(1);
    expect(results[0]?.resource.title).toBe('SQLite full text search');
  });

  it('suréchantillonne les candidats quand des filtres sont demandés', async () => {
    await seed();
    const spy = vi.spyOn(fts, 'search');

    await engine.search('sqlite', { limit: 3, tags: ['sqlite'] });
    expect(spy).toHaveBeenCalledWith('sqlite', 15);

    await engine.search('sqlite', { limit: 3 });
    expect(spy).toHaveBeenLastCalledWith('sqlite', 3);
  });

  it('refuse une limite invalide', async () => {
    await expect(engine.search('sqlite', { limit: 0 })).rejects.toBeInstanceOf(SearchError);
    await expect(engine.searchFTS('sqlite', -1)).rejects.toBeInstanceOf(SearchError);
    await expect(engine.searchVector('sqlite', 1.5)).rejects.toBeInstanceOf(SearchError);
  });

  it('refuse un mode inconnu', async () => {
    await expect(
      engine.search('sqlite', { mode: 'magique' as unknown as 'hybrid' }),
    ).rejects.toBeInstanceOf(SearchError);
  });

  it('accepte une constante RRF personnalisée', async () => {
    const custom = new SearchEngine(
      { fts, vectors, embeddings: new EmbeddingsService({ provider }) },
      { rrfK: 1 },
    );
    await seed();

    const [first] = await custom.search('sqlite search');

    // Avec k = 1, le premier d'un seul classement vaut 1/2 ; la fusion plafonne à 1.
    expect(first?.score).toBeGreaterThan(0.5);
  });

  it('propage une erreur d’embedding en mode hybride', async () => {
    await seed();
    provider.failOn = 'sqlite';

    await expect(engine.search('sqlite')).rejects.toThrow(/appel au fournisseur/);
  });

  it('ignore les ressources sans vecteur en mode vectoriel', async () => {
    const repository = new ResourceRepository(database.connection);
    repository.create({ type: 'article', title: 'sans vecteur', content: 'sqlite' });
    await seed();

    const results = await engine.searchVector('sqlite');

    expect(results.map((item) => item.resource.title)).not.toContain('sans vecteur');
  });
});
