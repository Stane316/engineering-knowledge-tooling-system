import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import { createKnowledgeManager } from '../../src/business/knowledge-manager.js';
import { VectorIndexer, withVectorIndexing } from '../../src/business/vector-indexer.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import type { Resource } from '../../src/shared/validators.js';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';

describe('VectorIndexer', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let vectors: VectorRepository;
  let indexer: VectorIndexer;
  let provider: FakeEmbeddingProvider;
  let resources: ReturnType<typeof createKnowledgeManager>;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-vindex-'));
    database = openDatabase({ dataDir });
    vectors = new VectorRepository(database.connection);
    provider = new FakeEmbeddingProvider();
    indexer = new VectorIndexer(new EmbeddingsService({ provider }), vectors);
    resources = createKnowledgeManager(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const manualResource = (overrides: Partial<Resource> = {}): Resource => ({
    id: 'manuel',
    type: 'article',
    title: 'Titre',
    tags: [],
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  it('stocke un vecteur pour une ressource', async () => {
    const created = await resources.manager.addResource({
      type: 'article',
      title: 'sqlite vectoriel',
      content: 'contenu',
    });

    await indexer.indexResource(created);

    expect(vectors.count()).toBe(1);
    expect(vectors.getEmbedding(created.id)).not.toBeNull();
  });

  it('supprime le vecteur d’une ressource sans texte exploitable', async () => {
    const created = await resources.manager.addResource({ type: 'article', title: 'Avec texte' });
    await indexer.indexResource(created);
    expect(vectors.count()).toBe(1);

    await indexer.indexResource(manualResource({ id: created.id, title: '   ' }));

    expect(vectors.count()).toBe(0);
  });

  it('supprime un vecteur explicitement', async () => {
    const created = await resources.manager.addResource({ type: 'article', title: 'À supprimer' });
    await indexer.indexResource(created);

    indexer.removeResource(created.id);

    expect(vectors.count()).toBe(0);
    expect(() => indexer.removeResource(created.id)).not.toThrow();
  });

  it('réindexe un lot en isolant les échecs', async () => {
    const first = await resources.manager.addResource({ type: 'article', title: 'première' });
    const second = await resources.manager.addResource({ type: 'article', title: 'seconde' });

    provider.failOn = 'première';

    const report = await indexer.reindexAll([
      first,
      second,
      manualResource({ id: 'sans-texte', title: ' ' }),
    ]);

    expect(report).toMatchObject({ indexed: 1, skipped: 1, failed: 1 });
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
    expect(vectors.count()).toBe(1);
  });
});

describe('VectorIndexedKnowledgeManager', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let provider: FakeEmbeddingProvider;
  let vectors: VectorRepository;
  let inner: ReturnType<typeof createKnowledgeManager>;
  let manager: ReturnType<typeof withVectorIndexing>;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-vmanager-'));
    database = openDatabase({ dataDir });
    provider = new FakeEmbeddingProvider();
    vectors = new VectorRepository(database.connection);
    inner = createKnowledgeManager(database.connection);
    manager = withVectorIndexing(
      inner.manager,
      new VectorIndexer(new EmbeddingsService({ provider }), vectors),
    );
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('indexe automatiquement à la création (C4.5)', async () => {
    const created = await manager.addResource({
      type: 'article',
      title: 'sqlite recherche',
      content: 'full text',
    });

    expect(vectors.count()).toBe(1);
    expect(vectors.getEmbedding(created.id)).not.toBeNull();
  });

  it('réindexe automatiquement à la mise à jour', async () => {
    const created = await manager.addResource({ type: 'article', title: 'sqlite' });

    await manager.updateResource(created.id, { title: 'postgres' });

    const stored = vectors.getEmbedding(created.id) ?? [];
    const [match] = await vectors.search(stored, 1);

    expect(match?.resource.id).toBe(created.id);
    expect(match?.resource.title).toBe('postgres');
  });

  it('supprime le vecteur à la suppression', async () => {
    const created = await manager.addResource({ type: 'article', title: 'éphémère' });

    await manager.deleteResource(created.id);

    expect(vectors.count()).toBe(0);
    expect(await manager.getResource(created.id)).toBeNull();
  });

  it('délègue les lectures au manager interne', async () => {
    const created = await manager.addResource({ type: 'article', title: 'délégué', tags: ['tag'] });

    expect(await manager.getResource(created.id)).toMatchObject({ title: 'délégué' });
    expect(await manager.getResourceOrThrow(created.id)).toMatchObject({ title: 'délégué' });
    expect(await manager.listResources()).toHaveLength(1);
    expect(await manager.listTags()).toEqual(['tag']);
    expect(await manager.stats()).toMatchObject({ total: 1 });
  });

  it('réindexe FTS et vecteurs via reindex()', async () => {
    await manager.addResource({ type: 'article', title: 'un' });
    await manager.addResource({ type: 'article', title: 'deux' });

    const report = await manager.reindex();

    expect(report.resources).toBe(2);
    expect(report.indexed).toBe(2);
    expect(report.vectors).toMatchObject({ indexed: 2, skipped: 0, failed: 0 });
  });

  it('propage une erreur d’embedding après la création (limite documentée)', async () => {
    provider.failOn = 'panne';

    await expect(
      manager.addResource({ type: 'article', title: 'panne', content: 'réseau' }),
    ).rejects.toThrow(/appel au fournisseur/);

    // La ressource a bien été créée : l'index vectoriel est réparable.
    expect(await manager.listResources()).toHaveLength(1);
    expect(vectors.count()).toBe(0);
  });

  it('supprime le vecteur même si la ressource n’en avait pas', async () => {
    const created = await inner.manager.addResource({ type: 'article', title: 'sans vecteur' });
    const withoutVector = withVectorIndexing(
      inner.manager,
      new VectorIndexer(new EmbeddingsService({ provider }), vectors),
    );

    await expect(withoutVector.deleteResource(created.id)).resolves.toBeUndefined();
    expect(await withoutVector.getResource(created.id)).toBeNull();
    expect(vectors.count()).toBe(0);
  });
});
