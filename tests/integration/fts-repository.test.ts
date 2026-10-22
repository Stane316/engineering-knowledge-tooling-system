import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FTSRepository } from '../../src/data/fts-repository.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';
import { SearchError } from '../../src/shared/errors.js';

describe('FTSRepository', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let resources: ResourceRepository;
  let fts: FTSRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-fts-'));
    database = openDatabase({ dataDir });
    resources = new ResourceRepository(database.connection);
    fts = new FTSRepository(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const seed = (): Record<'title' | 'content' | 'tag', string> => {
    const title = resources.create({
      type: 'article',
      title: 'Zebra dans le titre',
      content: 'rien',
    });
    const content = resources.create({
      type: 'article',
      title: 'Autre',
      content: 'zebra dans le contenu',
    });
    const tag = resources.create({ type: 'article', title: 'Troisieme', tags: ['zebra'] });

    return { title: title.id, content: content.id, tag: tag.id };
  };

  it('trouve une ressource par son titre, son contenu ou ses tags', async () => {
    const ids = seed();

    const results = await fts.search('zebra');

    expect(results.map((item) => item.resource.id)).toEqual(
      expect.arrayContaining([ids.title, ids.content, ids.tag]),
    );
    expect(results.every((item) => item.source === 'fts')).toBe(true);
  });

  it('pondère titre (10) > contenu (5) > tags (1)', async () => {
    const ids = seed();

    const results = await fts.search('zebra');

    expect(results[0]?.resource.id).toBe(ids.title);
    expect(results[1]?.resource.id).toBe(ids.content);
    expect(results[2]?.resource.id).toBe(ids.tag);
  });

  it('renvoie des scores BM25 négatifs triés par pertinence croissante', async () => {
    seed();

    const scores = (await fts.search('zebra')).map((item) => item.score);

    expect(scores.every((score) => score < 0)).toBe(true);
    expect([...scores].sort((left, right) => left - right)).toEqual(scores);
  });

  it('exige tous les termes (AND)', async () => {
    resources.create({ type: 'article', title: 'sqlite bm25', content: 'les deux' });
    resources.create({ type: 'article', title: 'sqlite seul', content: 'un seul' });

    const results = await fts.search('sqlite bm25');

    expect(results).toHaveLength(1);
    expect(results[0]?.resource.title).toBe('sqlite bm25');
  });

  it('ignore la ponctuation et les opérateurs FTS5 au lieu d’échouer', async () => {
    resources.create({ type: 'article', title: 'C++ et pointeurs', content: 'mémoire' });

    await expect(fts.search('C++ (pointeurs)')).resolves.toHaveLength(1);
    await expect(fts.search('NEAR/3 OR NOT')).resolves.toEqual([]);
    await expect(fts.search('!!! ???')).resolves.toEqual([]);
    await expect(fts.search('"non fermé')).resolves.toEqual([]);
  });

  it('respecte la limite demandée', async () => {
    seed();

    await expect(fts.search('zebra', 1)).resolves.toHaveLength(1);
    await expect(fts.search('zebra', 2)).resolves.toHaveLength(2);
    await expect(fts.search('zebra', 10)).resolves.toHaveLength(3);
  });

  it('renvoie un tableau vide pour une requête sans terme exploitable', async () => {
    seed();

    await expect(fts.search('')).resolves.toEqual([]);
    await expect(fts.search('   ')).resolves.toEqual([]);
  });

  it('refuse une limite invalide', async () => {
    await expect(fts.search('zebra', 0)).rejects.toBeInstanceOf(SearchError);
    await expect(fts.search('zebra', -1)).rejects.toBeInstanceOf(SearchError);
    await expect(fts.search('zebra', 1.5)).rejects.toBeInstanceOf(SearchError);
  });

  it('compte les entrées de l’index', async () => {
    expect(fts.count()).toBe(0);

    seed();

    expect(fts.count()).toBe(3);
  });

  it('retire de l’index les ressources supprimées', async () => {
    const ids = seed();
    resources.delete(ids.title);

    const results = await fts.search('zebra');

    expect(results.map((item) => item.resource.id)).not.toContain(ids.title);
    expect(fts.count()).toBe(2);
  });

  it('reconstruit une ressource complète (camelCase, champs optionnels)', async () => {
    resources.create({
      type: 'video',
      title: 'Vidéo sur zebra',
      url: 'https://example.test/zebra',
      content: 'description',
      tags: ['faune'],
      metadata: { source: 'test' },
    });

    const [result] = await fts.search('zebra');

    expect(result?.resource).toMatchObject({
      type: 'video',
      url: 'https://example.test/zebra',
      content: 'description',
      tags: ['faune'],
      metadata: { source: 'test' },
    });
    expect(result?.resource.embeddingModel).toBeUndefined();
  });

  it('remonte le modèle d’embedding renseigné', async () => {
    const created = resources.create({ type: 'article', title: 'Modèle renseigné', content: 'x' });
    resources.update(created.id, { embeddingModel: 'text-embedding-3-small' });

    const [result] = await fts.search('renseigné');

    expect(result?.resource.embeddingModel).toBe('text-embedding-3-small');
  });

  it('conserve les accents saisis et les retrouve sans accent', async () => {
    resources.create({ type: 'article', title: 'Générateur de code', content: 'outil' });

    await expect(fts.search('générateur')).resolves.toHaveLength(1);
    await expect(fts.search('generateur')).resolves.toHaveLength(1);
  });
});
