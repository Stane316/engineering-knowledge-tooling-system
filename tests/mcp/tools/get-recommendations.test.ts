import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { McpError } from '@modelcontextprotocol/sdk/types.js';

import { openDatabase } from '../../../src/data/database.js';
import { ProjectRepository } from '../../../src/data/repositories/project-repository.js';
import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { McpErrorCode } from '../../../src/mcp/utils/errors.js';
import { AuditSchema } from '../../../src/storage/schema.js';
import { openTestServices, type TestServices } from '../helpers.js';

const PROJECT_ID = '00000000-0000-4000-8000-000000000001';

interface RecommendationsResult {
  projectId: string;
  totalRecommendations: number;
  rulesApplied: number;
  statisticalRecommendations: number;
  durationMs: number;
  recommendations: Array<{
    recommendationTitle: string;
    relevanceScore: number;
    ruleId: string | null;
    priority: string;
  }>;
  summary: string;
}

describe('MCP get_recommendations (Sprint 16-03, C16.10)', () => {
  let fixture: TestServices;

  /** Projets + audits seedés dans la base réelle des services. */
  function seedAudits(): void {
    const database = openDatabase({ dataDir: fixture.dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      new ProjectRepository(database.connection).create({ name: 'Site MCP recos' });
      database.connection
        .prepare('UPDATE projects SET id = ? WHERE name = ?')
        .run(PROJECT_ID, 'Site MCP recos');

      const insert = database.connection.prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings, project_id)
         VALUES (?, ?, 70, 1, 0, 0, 1, 0, ?)`,
      );
      const finding = database.connection.prepare(
        `INSERT INTO audit_findings
           (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
         VALUES (?, 'performance', 'Images non optimisées', 3, 2, 2, 'medium', 'WebP')`,
      );
      const dimension = database.connection.prepare(
        `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
         VALUES (?, 'performance', 70, 1)`,
      );
      for (const timestamp of ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']) {
        const result = insert.run('https://example.com', timestamp, PROJECT_ID);
        const auditId = Number(result.lastInsertRowid);
        dimension.run(auditId);
        finding.run(auditId);
      }
    } finally {
      database.close();
    }
  }

  beforeEach(() => {
    fixture = openTestServices();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('rapport vide pour un projet sans audits (résumé explicite, code 0)', async () => {
    seedAudits();

    const result = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
    })) as RecommendationsResult;

    expect(result.totalRecommendations).toBe(0);
    expect(result.recommendations).toEqual([]);
    expect(result.summary).toContain('Aucune recommandation générée');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('génère depuis une règle + audit (résumé Markdown + JSON)', async () => {
    seedAudits();
    await dispatchTool(fixture.services, 'add_best_practice', {
      title: 'Optimiser les images',
      description: 'Création test pour peupler le catalogue',
      category: 'performance',
    });
    // Règle via le repository interne du moteur du contexte.
    fixture.services.recommendations.addRule({
      name: 'Images',
      description: 'Optimisation',
      dimension: 'performance',
      severityThreshold: 2,
      pattern: 'images non optimisées',
      recommendationTitle: 'Optimiser les images WebP',
      recommendationDescription: 'Convertir en WebP et lazy-loader',
      effort: 2,
      impact: 4,
      priority: 'high',
    });

    const result = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
    })) as RecommendationsResult;

    expect(result.totalRecommendations).toBeGreaterThanOrEqual(1);
    expect(result.rulesApplied).toBeGreaterThanOrEqual(1);
    expect(result.recommendations[0]?.relevanceScore).toBeGreaterThan(0.5);
    expect(result.summary).toContain('## Recommandations contextuelles');
    expect(result.summary).toContain('📏');
    expect(result.projectId).toBe(PROJECT_ID);
  });

  it('respecte max_recommendations et min_relevance_score', async () => {
    seedAudits();
    for (let index = 0; index < 5; index += 1) {
      fixture.services.recommendations.addRule({
        name: `R${index}`,
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: `finding ${index}`,
        recommendationTitle: `Reco ${index}`,
        recommendationDescription: 'Description',
      });
    }
    const database = openDatabase({ dataDir: fixture.dataDir });
    const auditId = Number(
      database.connection
        .prepare(
          `INSERT INTO audit_metadata
             (url, timestamp, overall_score, total_findings,
              critical_findings, high_findings, medium_findings, low_findings, project_id)
           VALUES ('https://example.com', '2026-03-01T00:00:00.000Z', 70, 5, 0, 0, 5, 0, ?)`,
        )
        .run(PROJECT_ID).lastInsertRowid,
    );
    for (let index = 0; index < 5; index += 1) {
      database.connection
        .prepare(
          `INSERT INTO audit_findings
             (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
           VALUES (?, 'performance', ?, 2, 2, 2, 'medium', 'R')`,
        )
        .run(auditId, `Finding ${index}`);
    }
    database.close();

    const limited = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
      max_recommendations: 2,
    })) as RecommendationsResult;
    expect(limited.recommendations.length).toBeLessThanOrEqual(2);

    const filtered = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
      min_relevance_score: 0.999,
    })) as RecommendationsResult;
    expect(filtered.totalRecommendations).toBe(0);
  });

  it('include_rules / include_statistical / dimensions', async () => {
    seedAudits();
    fixture.services.recommendations.addRule({
      name: 'Images',
      description: 'D',
      dimension: 'performance',
      severityThreshold: 1,
      pattern: 'images',
      recommendationTitle: 'Reco images',
      recommendationDescription: 'D',
    });

    const rulesOnly = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
      include_statistical: false,
    })) as RecommendationsResult;
    expect(rulesOnly.rulesApplied).toBeGreaterThanOrEqual(1);

    const none = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
      include_rules: false,
      include_statistical: false,
    })) as RecommendationsResult;
    expect(none.totalRecommendations).toBe(0);

    const wrongDimension = (await dispatchTool(fixture.services, 'get_recommendations', {
      project_id: PROJECT_ID,
      dimensions: ['seo'],
    })) as RecommendationsResult;
    expect(wrongDimension.totalRecommendations).toBe(0);
  });

  it('refuse les entrées invalides en -32602', async () => {
    for (const args of [
      {},
      { project_id: 'pas-uuid' },
      { project_id: PROJECT_ID, max_recommendations: 0 },
      { project_id: PROJECT_ID, max_recommendations: 1.5 },
      { project_id: PROJECT_ID, min_relevance_score: -0.1 },
      { project_id: PROJECT_ID, min_relevance_score: 1.5 },
      { project_id: PROJECT_ID, dimensions: ['bogus'] },
      { project_id: PROJECT_ID, include_rules: 'oui' },
    ]) {
      const error = await dispatchTool(fixture.services, 'get_recommendations', args).catch(
        (caught: unknown) => caught,
      );
      expect((error as McpError).code).toBe(McpErrorCode.InvalidParams);
    }
  });
});
