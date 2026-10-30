import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createProjectManager } from '../../src/business/project-manager.js';
import type { ProjectManager } from '../../src/business/project-manager.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectNotFoundError, ValidationError } from '../../src/shared/errors.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';

describe('ProjectManager', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let manager: ProjectManager;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-project-mgr-'));
    database = openDatabase({ dataDir });
    manager = createProjectManager(database.connection).manager;
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  describe('validation Zod (C13.1.4)', () => {
    it('refuse un nom vide', async () => {
      await expect(manager.createProject({ name: '   ' })).rejects.toBeInstanceOf(ValidationError);
    });

    it('refuse un statut hors enum', async () => {
      await expect(
        manager.createProject({
          name: 'Projet',
          status: 'paused' as unknown as 'active',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('refuse un nom de plus de 200 caractères', async () => {
      await expect(manager.createProject({ name: 'x'.repeat(201) })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('applique les défauts (active, métadonnées vides)', async () => {
      const project = await manager.createProject({ name: 'Défauts' });
      expect(project.status).toBe('active');
      expect(project.metadata).toEqual({});
    });
  });

  describe('CRUD orchestré (C13.1.5)', () => {
    it('crée, lit, liste, compte puis supprime', async () => {
      const created = await manager.createProject({ name: 'Cycle complet' });
      expect((await manager.getProject(created.id))?.name).toBe('Cycle complet');
      expect(await manager.listProjects()).toHaveLength(1);
      expect(await manager.countProjects()).toBe(1);

      const updated = await manager.updateProject(created.id, { status: 'archived' });
      expect(updated.status).toBe('archived');
      expect(await manager.countProjects({ status: 'archived' })).toBe(1);

      await manager.deleteProject(created.id);
      expect(await manager.getProject(created.id)).toBeNull();
      expect(await manager.countProjects()).toBe(0);
    });

    it('getProjectOrThrow lève ProjectNotFoundError', async () => {
      const missing = '00000000-0000-4000-8000-000000000000';
      await expect(manager.getProjectOrThrow(missing)).rejects.toBeInstanceOf(ProjectNotFoundError);
      await expect(manager.updateProject(missing, { name: 'X' })).rejects.toBeInstanceOf(
        ProjectNotFoundError,
      );
      await expect(manager.deleteProject(missing)).rejects.toBeInstanceOf(ProjectNotFoundError);
    });
  });

  describe('ON DELETE SET NULL — audits et ressources conservés', () => {
    it('les audits dun projet supprimé restent en base avec project_id NULL', async () => {
      const project = await manager.createProject({ name: 'À dissoudre' });

      const schema = new AuditSchema(database.connection);
      schema.createSchema();
      const audits = new AuditRepository(database.connection);

      const report = {
        url: 'https://example.com/projet',
        timestamp: new Date().toISOString(),
        dimensions: Object.fromEntries(
          (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map((dimension) => [
            dimension,
            {
              dimension,
              score: 80,
              status: 'measured' as const,
              findings: [],
              summary: `Score ${dimension} : 80/100.`,
            },
          ]),
        ),
        findings: [],
        priorityFindings: [],
        summary: {
          totalFindings: 0,
          criticalFindings: 0,
          highFindings: 0,
          mediumFindings: 0,
          lowFindings: 0,
          infoFindings: 0,
          overallScore: { status: 'measured', value: 80 },
        },
      } as unknown as Parameters<AuditRepository['store']>[0];

      const stored = audits.store(report, { projectId: project.id });
      expect(stored.metadata.projectId).toBe(project.id);

      await manager.deleteProject(project.id);

      const after = audits.findById(stored.metadata.id!);
      expect(after).not.toBeNull();
      expect(after?.metadata.projectId).toBeNull();
      expect(after?.metadata.url).toBe('https://example.com/projet');
    });
  });
});
