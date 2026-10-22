import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Indexer } from '../../src/business/indexer.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';
import { IndexingError } from '../../src/shared/errors.js';

describe('Indexer', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let indexer: Indexer;
  let repository: ResourceRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-idx-'));
    database = openDatabase({ dataDir });
    indexer = new Indexer(database.connection);
    repository = new ResourceRepository(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  describe('checkIntegrity', () => {
    it('signale une base vide comme cohérente', () => {
      expect(indexer.checkIntegrity()).toEqual({
        resources: 0,
        indexed: 0,
        missing: 0,
        orphans: 0,
        consistent: true,
      });
    });

    it('détecte une ressource absente de l’index', () => {
      repository.create({ type: 'article', title: 'Indexée' });
      database.connection.exec('DELETE FROM fts.resources_fts');

      expect(indexer.checkIntegrity()).toMatchObject({
        resources: 1,
        indexed: 0,
        missing: 1,
        orphans: 0,
        consistent: false,
      });
    });

    it('détecte une entrée FTS orpheline', () => {
      const resource = repository.create({ type: 'article', title: 'Orpheline' });
      database.connection.prepare('DELETE FROM resources WHERE id = ?').run(resource.id);

      expect(indexer.checkIntegrity()).toMatchObject({
        resources: 0,
        indexed: 1,
        missing: 0,
        orphans: 1,
        consistent: false,
      });
    });

    it('détecte un décalage de rowid', () => {
      repository.create({ type: 'article', title: 'Décalée' });
      database.connection.exec('UPDATE fts.resources_fts SET rowid = 999');

      const report = indexer.checkIntegrity();

      expect(report.missing).toBe(1);
      expect(report.orphans).toBe(1);
      expect(report.consistent).toBe(false);
    });
  });

  describe('reindexAll', () => {
    it('ne fait rien sur une base vide', () => {
      expect(indexer.reindexAll()).toMatchObject({ resources: 0, indexed: 0 });
      expect(indexer.countIndexed()).toBe(0);
    });

    it('réindexe toutes les ressources, y compris sans contenu', () => {
      repository.create({ type: 'article', title: 'Avec contenu', content: 'texte' });
      repository.create({ type: 'tool', title: 'Sans contenu' });

      const report = indexer.reindexAll();

      expect(report).toMatchObject({ resources: 2, indexed: 2 });
      expect(indexer.countIndexed()).toBe(2);
      expect(indexer.countResources()).toBe(2);
    });

    it('remplace l’index existant au lieu de le dupliquer', () => {
      repository.create({ type: 'article', title: 'Doublon potentiel' });

      indexer.reindexAll();
      indexer.reindexAll();

      expect(indexer.countIndexed()).toBe(1);
    });

    it('indexe les tags séparés par des espaces', () => {
      repository.create({ type: 'article', title: 'Tags', tags: ['alpha', 'beta'] });
      indexer.reindexAll();

      const hits = database.connection
        .prepare('SELECT resource_id FROM fts.resources_fts WHERE resources_fts MATCH ?')
        .all('beta') as unknown[];

      expect(hits).toHaveLength(1);
    });

    it('tolère des tags JSON valides mais non tableaux', () => {
      // `json_valid` interdit le JSON corrompu (contrainte CHECK en base) :
      // le seul cas atteignable est un JSON valide de forme inattendue.
      const resource = repository.create({ type: 'article', title: 'Inattendue' });
      database.connection
        .prepare('UPDATE resources SET tags = ? WHERE id = ?')
        .run('{"forme":"objet"}', resource.id);

      expect(() => indexer.reindexAll()).not.toThrow();
      expect(indexer.countIndexed()).toBe(1);
    });

    it('encapsule un échec SQL dans une IndexingError', () => {
      repository.create({ type: 'article', title: 'Échouera' });
      database.connection.exec('DROP TABLE fts.resources_fts');

      expect(() => indexer.reindexAll()).toThrow(IndexingError);
    });
  });
});
