import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';

interface FtsRow {
  resource_id: string;
  title: string;
}

describe('ResourceRepository', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let repository: ResourceRepository;

  const searchFts = (term: string): FtsRow[] =>
    database.connection
      .prepare(
        'SELECT resource_id, title FROM fts.resources_fts WHERE resources_fts MATCH ? ORDER BY rank',
      )
      .all(term) as FtsRow[];

  const countVectors = (): number =>
    (
      database.connection
        .prepare('SELECT count(*) AS total FROM vectors.resources_vectors')
        .get() as { total: number }
    ).total;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-repo-'));
    database = openDatabase({ dataDir });
    repository = new ResourceRepository(database.connection);
  });

  afterEach(() => {
    vi.useRealTimers();
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('crée une ressource avec tous les champs', () => {
      const resource = repository.create({
        type: 'article',
        title: 'Article complet',
        url: 'https://example.com/article',
        tags: ['typescript', 'sqlite'],
        metadata: { author: 'Ada' },
        content: 'Un long contenu sur SQLite.',
      });

      expect(resource.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(resource.type).toBe('article');
      expect(resource.title).toBe('Article complet');
      expect(resource.url).toBe('https://example.com/article');
      expect(resource.tags).toEqual(['typescript', 'sqlite']);
      expect(resource.metadata).toEqual({ author: 'Ada' });
      expect(resource.content).toBe('Un long contenu sur SQLite.');
      expect(resource.createdAt).toBe(resource.updatedAt);
    });

    it('applique les valeurs par défaut', () => {
      const resource = repository.create({ type: 'tool', title: 'Outil minimal' });

      expect(resource.tags).toEqual([]);
      expect(resource.metadata).toEqual({});
      expect(resource.url).toBeUndefined();
      expect(resource.content).toBeUndefined();
    });

    it('génère des identifiants uniques', () => {
      const first = repository.create({ type: 'article', title: 'Premier' });
      const second = repository.create({ type: 'article', title: 'Second' });

      expect(first.id).not.toBe(second.id);
    });

    it('indexe la ressource dans FTS5', () => {
      const resource = repository.create({
        type: 'article',
        title: 'Recherche plein texte',
        tags: ['indexation'],
        content: 'Le moteur indexe automatiquement ce document.',
      });

      const byTitle = searchFts('document');
      expect(byTitle).toHaveLength(1);
      expect(byTitle[0]?.resource_id).toBe(resource.id);

      const byTag = searchFts('indexation');
      expect(byTag[0]?.resource_id).toBe(resource.id);
    });

    it('rejette une entrée invalide sans rien écrire', () => {
      expect(() => repository.create({ type: 'podcast' as never, title: 'Invalide' })).toThrow(
        ZodError,
      );
      expect(() => repository.create({ type: 'article', title: '' })).toThrow(ZodError);
      expect(repository.list()).toHaveLength(0);
      expect(searchFts('invalide')).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('retourne la ressource demandée', () => {
      const created = repository.create({ type: 'video', title: 'Vidéo' });
      const found = repository.getById(created.id);

      expect(found).toEqual(created);
    });

    it('retourne null pour un identifiant inconnu', () => {
      expect(repository.getById('00000000-0000-4000-8000-000000000000')).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(() => {
      repository.create({ type: 'article', title: 'Article 1', tags: ['a', 'commun'] });
      repository.create({ type: 'article', title: 'Article 2', tags: ['b', 'commun'] });
      repository.create({ type: 'tool', title: 'Outil 1', tags: ['b'] });
    });

    it('retourne toutes les ressources, de la plus récente à la plus ancienne', () => {
      const resources = repository.list();

      expect(resources).toHaveLength(3);
      expect(resources.map((resource) => resource.title)).toEqual([
        'Outil 1',
        'Article 2',
        'Article 1',
      ]);
    });

    it('filtre par type', () => {
      const articles = repository.list({ type: 'article' });

      expect(articles).toHaveLength(2);
      expect(articles.every((resource) => resource.type === 'article')).toBe(true);
    });

    it('filtre par tag', () => {
      const communs = repository.list({ tags: ['commun'] });

      expect(communs.map((resource) => resource.title)).toEqual(['Article 2', 'Article 1']);
    });

    it('exige la présence de tous les tags fournis', () => {
      expect(repository.list({ tags: ['b', 'commun'] })).toHaveLength(1);
      expect(repository.list({ tags: ['a', 'b'] })).toHaveLength(0);
    });

    it('ignore les tags inexistants', () => {
      expect(repository.list({ tags: ['inconnu'] })).toHaveLength(0);
    });

    it('pagine avec limit et offset', () => {
      const page = repository.list({ limit: 1, offset: 1 });

      expect(page).toHaveLength(1);
      expect(page[0]?.title).toBe('Article 2');
      expect(repository.list({ offset: 2 })).toHaveLength(1);
    });

    it('combine type et tags', () => {
      expect(repository.list({ type: 'article', tags: ['b'] })).toHaveLength(1);
    });

    it('rejette des filtres invalides', () => {
      expect(() => repository.list({ limit: 0 })).toThrow(ZodError);
      expect(() => repository.list({ offset: -1 })).toThrow(ZodError);
      expect(() => repository.list({ type: 'podcast' as never })).toThrow(ZodError);
    });
  });

  describe('update', () => {
    it('met à jour les champs fournis et horodate la modification', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

      const created = repository.create({ type: 'article', title: 'Titre initial' });

      vi.setSystemTime(new Date('2026-01-01T10:00:01.000Z'));

      const updated = repository.update(created.id, {
        title: 'Titre modifié',
        tags: ['nouveau'],
        metadata: { updated: true },
        content: 'Contenu ajouté',
      });

      expect(updated?.title).toBe('Titre modifié');
      expect(updated?.tags).toEqual(['nouveau']);
      expect(updated?.metadata).toEqual({ updated: true });
      expect(updated?.content).toBe('Contenu ajouté');
      expect(updated?.createdAt).toBe(created.createdAt);
      expect(updated?.updatedAt).toBe('2026-01-01T10:00:01.000Z');
      expect(repository.getById(created.id)).toEqual(updated);
    });

    it('efface url et content avec null', () => {
      const created = repository.create({
        type: 'article',
        title: 'Avec URL',
        url: 'https://example.com',
        content: 'Texte',
      });

      const updated = repository.update(created.id, { url: null, content: null });

      expect(updated?.url).toBeUndefined();
      expect(updated?.content).toBeUndefined();
      expect(repository.getById(created.id)?.url).toBeUndefined();
    });

    it('remplace l’URL existante', () => {
      const created = repository.create({
        type: 'article',
        title: 'URL modifiable',
        url: 'https://example.com/avant',
      });

      const updated = repository.update(created.id, { url: 'https://example.com/apres' });

      expect(updated?.url).toBe('https://example.com/apres');
      expect(repository.getById(created.id)?.url).toBe('https://example.com/apres');
    });

    it('enregistre le modèle d’embedding', () => {
      const created = repository.create({ type: 'article', title: 'Embedding' });
      const updated = repository.update(created.id, {
        embeddingModel: 'text-embedding-3-small',
      });

      expect(updated?.embeddingModel).toBe('text-embedding-3-small');
      expect(repository.getById(created.id)?.embeddingModel).toBe('text-embedding-3-small');

      const cleared = repository.update(created.id, { embeddingModel: null });

      expect(cleared?.embeddingModel).toBeUndefined();
      expect(repository.getById(created.id)?.embeddingModel).toBeUndefined();
    });

    it('réindexe FTS5 après modification', () => {
      const created = repository.create({
        type: 'article',
        title: 'Ancien titre',
        content: 'anciencontenu',
      });

      repository.update(created.id, { title: 'Nouveau titre', content: 'nouveaucontenu' });

      expect(searchFts('anciencontenu')).toHaveLength(0);
      expect(searchFts('nouveaucontenu')).toHaveLength(1);
      expect(searchFts('anciencontenu')).toHaveLength(0);
    });

    it('retourne null pour une ressource inconnue', () => {
      expect(repository.update('00000000-0000-4000-8000-000000000000', { title: 'X' })).toBeNull();
    });

    it('rejette une mise à jour vide ou invalide', () => {
      const created = repository.create({ type: 'article', title: 'Test' });

      expect(() => repository.update(created.id, {})).toThrow(ZodError);
      expect(() => repository.update(created.id, { title: '' })).toThrow(ZodError);
      expect(() => repository.update(created.id, { url: 'pas-une-url' })).toThrow(ZodError);
    });

    it('conserve un index vectoriel existant (recalcul prévu au Sprint 4)', () => {
      const created = repository.create({ type: 'article', title: 'Vecteur' });
      database.connection
        .prepare('INSERT INTO vectors.resources_vectors (resource_id, embedding) VALUES (?, ?)')
        .run(created.id, JSON.stringify(new Array(1536).fill(0.02)));

      repository.update(created.id, { title: 'Vecteur modifié' });

      expect(countVectors()).toBe(1);
    });
  });

  describe('delete', () => {
    it('supprime la ressource et son index FTS', () => {
      const created = repository.create({
        type: 'article',
        title: 'À supprimer',
        content: 'contenu éphémère',
      });

      expect(repository.delete(created.id)).toBe(true);
      expect(repository.getById(created.id)).toBeNull();
      expect(searchFts('contenu')).toHaveLength(0);
    });

    it('purge l’entrée vectorielle associée', () => {
      const created = repository.create({ type: 'article', title: 'Vecteur à purger' });
      database.connection
        .prepare('INSERT INTO vectors.resources_vectors (resource_id, embedding) VALUES (?, ?)')
        .run(created.id, JSON.stringify(new Array(1536).fill(0.03)));

      expect(countVectors()).toBe(1);
      expect(repository.delete(created.id)).toBe(true);
      expect(countVectors()).toBe(0);
    });

    it('retourne false pour un identifiant inconnu', () => {
      expect(repository.delete('00000000-0000-4000-8000-000000000000')).toBe(false);
    });

    it('fonctionne sans table vectorielle', () => {
      const created = repository.create({ type: 'article', title: 'Sans vecteurs' });
      database.connection.exec('DROP TABLE vectors.resources_vectors');

      const repositoryWithoutVectors = new ResourceRepository(database.connection);

      expect(repositoryWithoutVectors.delete(created.id)).toBe(true);
      expect(repositoryWithoutVectors.getById(created.id)).toBeNull();
    });
  });
});
