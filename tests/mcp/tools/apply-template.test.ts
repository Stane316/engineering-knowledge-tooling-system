import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { McpError } from '@modelcontextprotocol/sdk/types.js';

import { openDatabase } from '../../../src/data/database.js';
import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { McpErrorCode } from '../../../src/mcp/utils/errors.js';
import { exitCodeFor } from '../../../src/cli/program.js';
import { openTestServices, type TestServices } from '../helpers.js';

import type { ApplyTemplateToolResult } from '../../../src/mcp/tools/apply-template.js';

describe('MCP apply_template (Sprint 17-03, C17.3/C17.4)', () => {
  let fixture: TestServices;

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('crée un projet depuis un template custom (résumé + compteurs)', async () => {
    const template = fixture.services.templates.createTemplate({
      name: 'Base MCP',
      description: 'À appliquer',
      category: 'custom',
      config: { priorityDimensions: ['performance'] },
    });

    const started = Date.now();
    const result = (await dispatchTool(fixture.services, 'apply_template', {
      template_id: template.id,
      project_name: 'Projet MCP',
      project_url: 'https://mcp.example',
      project_description: 'Depuis le test',
    })) as ApplyTemplateToolResult;

    expect(result.projectName).toBe('Projet MCP');
    expect(result.templateId).toBe(template.id);
    expect(result.bestPracticesAssociated).toBe(0);
    expect(result.durationMs).toBeLessThan(10_000);
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(result.summary).toContain('✅ **Projet créé depuis le template**');
    expect(result.summary).toContain(result.projectId);

    // Config persistée (migration 008).
    const database = openDatabase({ dataDir: fixture.dataDir });
    try {
      const row = database.connection
        .prepare('SELECT config FROM project_config WHERE project_id = ?')
        .get(result.projectId) as { config: string } | undefined;
      expect(row).toBeDefined();
      expect(JSON.parse(row!.config).priorityDimensions).toEqual(['performance']);
    } finally {
      database.close();
    }
  });

  it('applique un builtin du seed avec ses règles actives (C17.2)', async () => {
    const builtins = fixture.services.templates.listTemplates({ isBuiltin: true });
    expect(builtins).toHaveLength(10);
    const builtin = builtins[0]!;

    const result = (await dispatchTool(fixture.services, 'apply_template', {
      template_id: builtin.id,
      project_name: 'Site builtin',
      project_url: 'https://builtin.example',
    })) as ApplyTemplateToolResult;

    expect(result.rulesCreated).toBe(builtin.recommendationRuleIds.length);
    expect(result.bestPracticesAssociated).toBe(0);
  });

  it('fusionne les overrides de config et les ajouts de bonnes pratiques (ADR-041)', async () => {
    const bp = fixture.services.bestPractices.create({
      title: 'Pratique MCP',
      description: 'Associée via override',
      category: 'seo',
    });
    const template = fixture.services.templates.createTemplate({
      name: 'Avec BP',
      description: 'Base',
      category: 'custom',
      config: { alertThresholds: { regressionPoints: 10, minScore: 60 } },
    });

    const result = (await dispatchTool(fixture.services, 'apply_template', {
      template_id: template.id,
      project_name: 'Projet override',
      project_url: 'https://ov.example',
      overrides: {
        config: { alertThresholds: { minScore: 90 } },
        additional_best_practice_ids: [bp.id],
      },
    })) as ApplyTemplateToolResult;

    expect(result.bestPracticesAssociated).toBe(1);

    const database = openDatabase({ dataDir: fixture.dataDir });
    try {
      const row = database.connection
        .prepare('SELECT config FROM project_config WHERE project_id = ?')
        .get(result.projectId) as { config: string };
      const config = JSON.parse(row.config) as { alertThresholds: Record<string, number> };
      expect(config.alertThresholds).toEqual({ regressionPoints: 10, minScore: 90 });
    } finally {
      database.close();
    }
  });

  it('échoue avec ValidationError (code 4) pour un template inexistant (C17.20)', async () => {
    const error = await dispatchTool(fixture.services, 'apply_template', {
      template_id: '00000000-0000-4000-8000-00000000dead',
      project_name: 'X',
      project_url: 'https://x.example',
    }).catch((caught: unknown) => caught);

    expect((error as Error).message).toMatch(/introuvable/);
    expect(exitCodeFor(error)).toBe(4);
  });

  it('refuse les entrées invalides en -32602 (C17.20)', async () => {
    for (const args of [
      {},
      { template_id: 'pas-uuid', project_name: 'X', project_url: 'https://x.example' },
      {
        template_id: '00000000-0000-4000-8000-00000000dead',
        project_name: '',
        project_url: 'https://x.example',
      },
      {
        template_id: '00000000-0000-4000-8000-00000000dead',
        project_name: 'X',
        project_url: 'pas-url',
      },
      {
        template_id: '00000000-0000-4000-8000-00000000dead',
        project_name: 'X',
        project_url: 'https://x.example',
        overrides: 'oui',
      },
    ]) {
      const error = await dispatchTool(fixture.services, 'apply_template', args).catch(
        (caught: unknown) => caught,
      );
      expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
      expect((error as McpError).message).toContain('apply_template');
    }
  });
});
