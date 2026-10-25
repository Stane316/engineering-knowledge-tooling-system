import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import type { CreateProjectInput } from '../../src/shared/validators.js';

const SAMPLE: CreateProjectInput = {
  name: 'Audit site example',
  description: 'Refonte du site example.com',
  status: 'active',
  metadata: { url: 'https://example.com' },
};

describe('ProjectRepository', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let repository: ProjectRepository;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-project-repo-'));
    database = openDatabase({ dataDir });
    repository = new ProjectRepository(database.connection);
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('crée un projet avec UUID, statut par défaut et horodatages', () => {
      const project = repository.create({ name: 'Nouveau projet' });

      expect(project.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(project.status).toBe('active');
      expect(project.description).toBeNull();
      expect(project.metadata).toEqual({});
      expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(project.updatedAt).toBe(project.createdAt);
    });

    it('conserve les champs fournis (dont metadata JSON)', () => {
      const project = repository.create(SAMPLE);

      expect(project.name).toBe('Audit site example');
      expect(project.description).toBe('Refonte du site example.com');
      expect(project.metadata).toEqual({ url: 'https://example.com' });

      const persisted = repository.getById(project.id);
      expect(persisted).not.toBeNull();
      expect(persisted?.metadata).toEqual({ url: 'https://example.com' });
    });
  });

  describe('getById', () => {
    it('retrouve le projet créé', () => {
      const project = repository.create(SAMPLE);
      expect(repository.getById(project.id)?.name).toBe(SAMPLE.name);
    });

    it('retourne null pour un identifiant inconnu', () => {
      expect(repository.getById('00000000-0000-4000-8000-000000000000')).toBeNull();
    });
  });

  describe('list', () => {
    it('liste tous les projets du plus récent au plus ancien', () => {
      repository.create({ name: 'Premier' });
      repository.create({ name: 'Second' });

      const projects = repository.list();
      expect(projects).toHaveLength(2);
      expect(projects.map((project) => project.name)).toEqual(['Second', 'Premier']);
    });

    it('filtre par statut', () => {
      repository.create({ name: 'Actif' });
      const done = repository.create({ name: 'Terminé' });
      repository.update(done.id, { status: 'completed' });

      const active = repository.list({ status: 'active' });
      expect(active).toHaveLength(1);
      expect(active[0]?.name).toBe('Actif');

      const completed = repository.list({ status: 'completed' });
      expect(completed).toHaveLength(1);
      expect(completed[0]?.id).toBe(done.id);
    });

    it('pagine avec limit et offset', () => {
      for (let index = 1; index <= 5; index += 1) {
        repository.create({ name: `Projet ${String(index)}` });
      }

      const page = repository.list({ limit: 2, offset: 2 });
      expect(page).toHaveLength(2);
      expect(repository.list({ limit: 10 })).toHaveLength(5);
    });
  });

  describe('update', () => {
    it('met à jour les champs fournis et rafraîchit updatedAt', async () => {
      const project = repository.create(SAMPLE);
      await new Promise((resolve) => setTimeout(resolve, 5));

      const updated = repository.update(project.id, {
        name: 'Renommé',
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      expect(updated?.name).toBe('Renommé');
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).not.toBeNull();
      expect((updated?.updatedAt ?? '') > project.updatedAt).toBe(true);
      expect(updated?.description).toBe(SAMPLE.description);
    });

    it('retourne null si le projet nexiste pas', () => {
      expect(repository.update('00000000-0000-4000-8000-000000000000', { name: 'X' })).toBeNull();
    });
  });

  describe('delete', () => {
    it('supprime le projet', () => {
      const project = repository.create(SAMPLE);
      expect(repository.delete(project.id)).toBe(true);
      expect(repository.getById(project.id)).toBeNull();
    });

    it('retourne false si le projet nexiste pas', () => {
      expect(repository.delete('00000000-0000-4000-8000-000000000000')).toBe(false);
    });
  });

  describe('count', () => {
    it('compte tous les projets ou le filtre de statut', () => {
      repository.create({ name: 'A' });
      const b = repository.create({ name: 'B' });
      repository.update(b.id, { status: 'archived' });

      expect(repository.count()).toBe(2);
      expect(repository.count({ status: 'active' })).toBe(1);
      expect(repository.count({ status: 'archived' })).toBe(1);
      expect(repository.count({ status: 'completed' })).toBe(0);
    });
  });
});
