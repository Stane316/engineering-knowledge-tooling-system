import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createKnowledgeManager,
  type KnowledgeManager,
} from '../../src/business/knowledge-manager.js';
import { Indexer } from '../../src/business/indexer.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ResourceNotFoundError, ValidationError } from '../../src/shared/errors.js';

describe('KnowledgeManager', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let manager: KnowledgeManager;
  let indexer: Indexer;

  const searchFts = (term: string): { resource_id: string }[] =>
    database.connection
      .prepare('SELECT resource_id FROM fts.resources_fts WHERE resources_fts MATCH ?')
      .all(term) as { resource_id: string }[];

  const countFtsRows = (): number =>
    (
      database.connection.prepare('SELECT count(*) AS total FROM fts.resources_fts').get() as {
        total: number;
      }
    ).total;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-km-'));
    database = openDatabase({ dataDir });
    ({ manager, indexer } = createKnowledgeManager(database.connection));
  });

  afterEach(() => {
    vi.useRealTimers();
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  describe('addResource', () => {
    it('crée une ressource complète et l’indexe', async () => {
      const resource = await manager.addResource({
        type: 'article',
        title: 'Recherche hybride',
        url: 'https://example.com/a',
        tags: ['sqlite', 'FTS5'],
        metadata: { source: 'manual' },
        content: 'Combinaison de BM25 et de vecteurs.',
      });

      expect(resource.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(resource.title).toBe('Recherche hybride');
      expect(resource.tags).toEqual(['sqlite', 'FTS5']);
      expect(searchFts('vecteurs')).toHaveLength(1);
      expect(await manager.getResource(resource.id)).toEqual(resource);
    });

    it('applique les valeurs par défaut', async () => {
      const resource = await manager.addResource({ type: 'tool', title: 'Outil' });

      expect(resource.tags).toEqual([]);
      expect(resource.metadata).toEqual({});
      expect(resource.url).toBeUndefined();
      expect(resource.content).toBeUndefined();
    });

    it('normalise les tags (doublons et espaces)', async () => {
      const resource = await manager.addResource({
        type: 'article',
        title: 'Tags',
        tags: ['  SQLite ', 'sqlite', 'FTS5 '],
      });

      expect(resource.tags).toEqual(['SQLite', 'FTS5']);
    });

    it('lève ValidationError sur une entrée invalide, sans rien écrire', async () => {
      await expect(
        manager.addResource({ type: 'podcast' as never, title: 'Invalide' }),
      ).rejects.toThrow(ValidationError);

      await expect(manager.addResource({ type: 'article', title: '   ' })).rejects.toThrow(
        ValidationError,
      );

      expect(await manager.listResources()).toHaveLength(0);
      expect(countFtsRows()).toBe(0);
    });

    it('précise le champ fautif dans le message', async () => {
      await expect(
        manager.addResource({ type: 'article', title: 'Test', url: 'pas-une-url' }),
      ).rejects.toThrow(/url :/);
    });
  });

  describe('getResource', () => {
    it('retourne null pour un identifiant inconnu', async () => {
      expect(await manager.getResource('00000000-0000-4000-8000-000000000000')).toBeNull();
    });

    it('getResourceOrThrow lève ResourceNotFoundError', async () => {
      await expect(
        manager.getResourceOrThrow('00000000-0000-4000-8000-000000000000'),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it('getResourceOrThrow retourne la ressource existante', async () => {
      const created = await manager.addResource({ type: 'video', title: 'Vidéo' });

      expect(await manager.getResourceOrThrow(created.id)).toEqual(created);
    });
  });

  describe('listResources', () => {
    beforeEach(async () => {
      await manager.addResource({ type: 'article', title: 'Article 1', tags: ['a', 'commun'] });
      await manager.addResource({ type: 'article', title: 'Article 2', tags: ['b', 'commun'] });
      await manager.addResource({ type: 'tool', title: 'Outil', tags: ['b'] });
    });

    it('liste tout par défaut', async () => {
      expect(await manager.listResources()).toHaveLength(3);
    });

    it('applique les filtres', async () => {
      expect(await manager.listResources({ type: 'article' })).toHaveLength(2);
      expect(await manager.listResources({ tags: ['commun'] })).toHaveLength(2);
      expect(await manager.listResources({ limit: 1 })).toHaveLength(1);
    });

    it('lève ValidationError sur des filtres invalides', async () => {
      await expect(manager.listResources({ limit: 0 })).rejects.toThrow(ValidationError);
      await expect(manager.listResources({ type: 'podcast' as never })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('updateResource', () => {
    it('met à jour les champs fournis et réindexe', async () => {
      const created = await manager.addResource({
        type: 'article',
        title: 'Ancien',
        content: 'anciencontenu',
      });

      const updated = await manager.updateResource(created.id, {
        title: 'Nouveau',
        content: 'nouveaucontenu',
        tags: ['neuf', 'Neuf'],
      });

      expect(updated.title).toBe('Nouveau');
      expect(updated.tags).toEqual(['neuf']);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).not.toBe(created.updatedAt);
      expect(searchFts('anciencontenu')).toHaveLength(0);
      expect(searchFts('nouveaucontenu')).toHaveLength(1);
    });

    it('lève ResourceNotFoundError pour une ressource absente', async () => {
      await expect(
        manager.updateResource('00000000-0000-4000-8000-000000000000', { title: 'X' }),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it('lève ValidationError sur une mise à jour vide ou invalide', async () => {
      const created = await manager.addResource({ type: 'article', title: 'Test' });

      await expect(manager.updateResource(created.id, {})).rejects.toThrow(ValidationError);
      await expect(manager.updateResource(created.id, { title: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('ignore une tentative de changement de type', async () => {
      const created = await manager.addResource({ type: 'article', title: 'Typé' });

      const updated = await manager.updateResource(created.id, {
        title: 'Typé 2',
        type: 'video',
      } as never);

      expect(updated.type).toBe('article');
    });

    it('efface url et contenu avec null', async () => {
      const created = await manager.addResource({
        type: 'article',
        title: 'Effaçable',
        url: 'https://example.com',
        content: 'texte',
      });

      const updated = await manager.updateResource(created.id, { url: null, content: null });

      expect(updated.url).toBeUndefined();
      expect(updated.content).toBeUndefined();
      expect(await manager.getResource(created.id)).toEqual(updated);
    });
  });

  describe('deleteResource', () => {
    it('supprime la ressource et son index', async () => {
      const created = await manager.addResource({
        type: 'article',
        title: 'À supprimer',
        content: 'contenu unique',
      });

      await manager.deleteResource(created.id);

      expect(await manager.getResource(created.id)).toBeNull();
      expect(searchFts('unique')).toHaveLength(0);
      expect(countFtsRows()).toBe(0);
    });

    it('lève ResourceNotFoundError pour une ressource absente', async () => {
      await expect(
        manager.deleteResource('00000000-0000-4000-8000-000000000000'),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('listTags', () => {
    it('retourne les tags distincts, triés, sans tenir compte de la casse', async () => {
      await manager.addResource({ type: 'article', title: 'A', tags: ['zebra', 'Alpha'] });
      await manager.addResource({ type: 'article', title: 'B', tags: ['alpha', 'beta'] });

      // À casse égale, la graphie minuscule est retenue (tri total, insensible à l'ordre d'insertion).
      expect(await manager.listTags()).toEqual(['alpha', 'beta', 'zebra']);
    });

    it('retourne un tableau vide sans ressources', async () => {
      expect(await manager.listTags()).toEqual([]);
    });
  });

  describe('stats', () => {
    it('agrège la volumétrie par type et l’état de l’index', async () => {
      await manager.addResource({ type: 'article', title: 'A' });
      await manager.addResource({ type: 'article', title: 'B' });
      await manager.addResource({ type: 'tool', title: 'C' });

      expect(await manager.stats()).toEqual({
        total: 3,
        byType: { article: 2, video: 0, tutorial: 0, tool: 1, other: 0 },
        indexed: 3,
        consistent: true,
      });
    });
  });

  describe('reindex', () => {
    it('reconstruit l’index après une désynchronisation', async () => {
      await manager.addResource({ type: 'article', title: 'Un', content: 'premier' });
      await manager.addResource({ type: 'article', title: 'Deux', content: 'second' });

      database.connection.exec('DELETE FROM fts.resources_fts');
      expect((await manager.stats()).consistent).toBe(false);

      const report = await manager.reindex();

      expect(report).toMatchObject({ resources: 2, indexed: 2 });
      expect(report.durationMs).toBeGreaterThanOrEqual(0);
      expect(searchFts('premier')).toHaveLength(1);
      expect((await manager.stats()).consistent).toBe(true);
    });

    it('purge les entrées orphelines', async () => {
      const resource = await manager.addResource({ type: 'article', title: 'Orpheline' });

      database.connection.prepare('DELETE FROM resources WHERE id = ?').run(resource.id);

      expect(indexer.checkIntegrity()).toMatchObject({ resources: 0, indexed: 1, orphans: 1 });

      await manager.reindex();

      expect(indexer.checkIntegrity()).toMatchObject({ resources: 0, indexed: 0, orphans: 0 });
    });
  });
});
