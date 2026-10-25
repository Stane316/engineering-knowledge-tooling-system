import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectNotFoundError } from '../../src/shared/errors.js';
import type { Project } from '../../src/shared/validators.js';
import { dispatchTool } from '../../src/mcp/handlers/tools.js';
import { McpErrorCode } from '../../src/mcp/utils/errors.js';
import type { McpError } from '@modelcontextprotocol/sdk/types.js';
import { openTestServices, type TestServices } from './helpers.js';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('MCP — outils projets (Sprint 13)', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
    vi.restoreAllMocks();
  });

  // --- create_project ---
  it('create_project crée un projet actif par défaut', async () => {
    const result = (await dispatchTool(fixture.services, 'create_project', {
      name: 'Site vitrine',
      description: 'Refonte',
    })) as { project: Project };

    expect(result.project.name).toBe('Site vitrine');
    expect(result.project.status).toBe('active');
    expect(result.project.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu,
    );
    expect(result.project.description).toBe('Refonte');
  });

  it('create_project refuse un nom vide avec -32602', async () => {
    const error = await dispatchTool(fixture.services, 'create_project', { name: '   ' }).catch(
      (caught: unknown) => caught,
    );

    expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    expect((error as McpError).message).toContain('nom du projet');
  });

  // --- list_projects ---
  it('list_projects liste et filtre par statut', async () => {
    await dispatchTool(fixture.services, 'create_project', { name: 'Alpha' });
    await dispatchTool(fixture.services, 'create_project', { name: 'Beta' });
    await dispatchTool(fixture.services, 'create_project', { name: 'Gamma', status: 'archived' });

    const all = (await dispatchTool(fixture.services, 'list_projects', {})) as {
      count: number;
      projects: Project[];
    };
    expect(all.count).toBe(3);

    const archived = (await dispatchTool(fixture.services, 'list_projects', {
      status: 'archived',
    })) as { count: number; projects: Project[] };
    expect(archived.count).toBe(1);
    expect(archived.projects[0]?.name).toBe('Gamma');
  });

  it('list_projects borne limite et décalage', async () => {
    for (let index = 1; index <= 3; index += 1) {
      await dispatchTool(fixture.services, 'create_project', { name: `P${String(index)}` });
    }

    const page = (await dispatchTool(fixture.services, 'list_projects', {
      limit: 2,
      offset: 1,
    })) as {
      count: number;
    };
    expect(page.count).toBe(2);
  });

  // --- get_project ---
  it('get_project renvoie le projet créé', async () => {
    const created = (await dispatchTool(fixture.services, 'create_project', {
      name: 'Lu',
    })) as { project: Project };

    const result = (await dispatchTool(fixture.services, 'get_project', {
      project_id: created.project.id,
    })) as { project: Project };
    expect(result.project.id).toBe(created.project.id);
  });

  it('get_project sur un id inexistant échoue avec -32000', async () => {
    const error = await dispatchTool(fixture.services, 'get_project', {
      project_id: MISSING_ID,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ProjectNotFoundError);
  });

  // --- delete_project ---
  it('delete_project supprime et le projet devient introuvable', async () => {
    const created = (await dispatchTool(fixture.services, 'create_project', {
      name: 'À jeter',
    })) as { project: Project };

    const result = (await dispatchTool(fixture.services, 'delete_project', {
      project_id: created.project.id,
    })) as { deleted: boolean };
    expect(result.deleted).toBe(true);

    await expect(
      dispatchTool(fixture.services, 'get_project', { project_id: created.project.id }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it('delete_project sur un id inexistant échoue avec -32000', async () => {
    await expect(
      dispatchTool(fixture.services, 'delete_project', { project_id: MISSING_ID }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it('un identifiant non UUID est refusé par la validation Zod', async () => {
    const error = await dispatchTool(fixture.services, 'get_project', { project_id: 'nope' }).catch(
      (caught: unknown) => caught,
    );

    expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
  });
});
