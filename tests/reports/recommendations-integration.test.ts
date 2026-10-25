import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import { PDFReportGenerator } from '../../src/reports/pdf-generator.js';
import type { Audit } from '../../src/storage/types.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

describe('Recommandations dans les rapports (Sprint 16-02, C16.6, C16.7)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let engine: RecommendationEngine;
  let audit: Audit;

  /** Insère un audit + findings et reconstruit l'objet Audit en mémoire. */
  function seedAudit(timestamp: string, findings: Array<[string, string, number]>): Audit {
    const result = database.connection
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings, project_id)
         VALUES (?, ?, 70, 0, 0, 0, 0, 0, 'proj-1')`,
      )
      .run('https://example.com', timestamp);
    const auditId = Number(result.lastInsertRowid);

    database.connection
      .prepare(
        `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
         VALUES (?, 'performance', 70, ?)`,
      )
      .run(auditId, findings.length);

    for (const [dimension, title, severity] of findings) {
      database.connection
        .prepare(
          `INSERT INTO audit_findings
             (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
           VALUES (?, ?, ?, ?, 2, 2, 'medium', ?)`,
        )
        .run(auditId, dimension, title, severity, `Corriger : ${title}`);
    }

    return {
      metadata: {
        id: auditId,
        url: 'https://example.com',
        timestamp,
        overallScore: 70,
        totalFindings: findings.length,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: findings.length,
        lowFindings: 0,
        projectId: 'proj-1',
      },
      dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
        (name) => ({
          dimension: name,
          score: name === 'performance' ? 70 : 80,
          findingsCount: name === 'performance' ? findings.length : 0,
        }),
      ),
      findings: findings.map(([dimension, title, severity], index) => ({
        id: index + 1,
        auditId,
        dimension: dimension as Audit['findings'][number]['dimension'],
        title,
        severity,
        effort: 2,
        impact: 2,
        priority: 'medium' as const,
        recommendation: `Corriger : ${title}`,
      })),
    } as unknown as Audit;
  }

  beforeEach(() => {
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();

    new ProjectRepository(database.connection).create({ name: 'Projet Rapports' });
    database.connection
      .prepare('UPDATE projects SET id = ? WHERE name = ?')
      .run('proj-1', 'Projet Rapports');

    engine = new RecommendationEngine(
      database.connection,
      new RecommendationContext(database.connection),
    );
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  /** Règle + audit de test (titre attendu : « Optimiser les images »). */
  function seedRuleAndAudit(): void {
    engine.addRule({
      name: 'Images',
      description: 'Optimisation images',
      dimension: 'performance',
      severityThreshold: 2,
      pattern: 'images non optimisées',
      recommendationTitle: 'Optimiser les images',
      recommendationDescription: 'Convertir en WebP et lazy-loader',
      effort: 2,
      impact: 4,
      priority: 'high',
    });
    audit = seedAudit('2026-01-01T00:00:00.000Z', [['performance', 'Images non optimisées', 3]]);
  }

  describe('Markdown (C16.6)', () => {
    it('intègre la section « Recommandations contextuelles » en fin de rapport', async () => {
      seedRuleAndAudit();

      const generator = new MarkdownReportGenerator(engine);
      const report = await generator.generate(audit);

      expect(report.content).toContain('## 🧭 Recommandations contextuelles');
      expect(report.content).toContain('### 1. Optimiser les images');
      expect(report.content).toContain('**Pertinence :**');
      expect(report.content).toContain('Convertir en WebP et lazy-loader');
      expect(report.content).toContain('*Constat associé : Images non optimisées*');
      // La section historique S11 reste présente (pas de breaking change).
      expect(report.content).toContain('Top 5 recommandations');
      // Ordre : contextuelles en toute fin.
      expect(report.content.trimEnd().endsWith('---')).toBe(true);
    });

    it('section absente sans moteur injecté (comportement historique)', async () => {
      seedRuleAndAudit();
      const report = await new MarkdownReportGenerator().generate(audit);
      expect(report.content).not.toContain('Recommandations contextuelles');
      expect(report.content).toContain('Top 5 recommandations');
    });

    it('section absente sans projectId résolvable', async () => {
      seedRuleAndAudit();
      audit = { ...audit, metadata: { ...audit.metadata, projectId: null } };
      const report = await new MarkdownReportGenerator(engine).generate(audit);
      expect(report.content).not.toContain('Recommandations contextuelles');
    });

    it('section absente si aucune recommandation (projet sans audit, score < 0.5)', async () => {
      audit = seedAudit('2026-01-01T00:00:00.000Z', []);
      const report = await new MarkdownReportGenerator(engine).generate(audit);
      expect(report.content).not.toContain('Recommandations contextuelles');
    });

    it('respecte includeSections (section contextuelle non demandée = absente)', async () => {
      seedRuleAndAudit();
      const report = await new MarkdownReportGenerator(engine).generate(audit, {
        includeSections: ['header'],
      });
      expect(report.content).not.toContain('Recommandations contextuelles');
      expect(report.content).not.toContain('Top 5 recommandations');
    });

    it('accepte projectId explicite en option', async () => {
      seedRuleAndAudit();
      audit = { ...audit, metadata: { ...audit.metadata, projectId: null } };
      const section = new MarkdownReportGenerator(engine).buildContextRecommendationsSection(
        audit,
        { projectId: 'proj-1' },
      );
      expect(section).toContain('Recommandations contextuelles');
    });

    it('équipe la pertinence en pourcentages et les priorités en code', () => {
      seedRuleAndAudit();
      const section = new MarkdownReportGenerator(engine).buildContextRecommendationsSection(audit);
      expect(section).toMatch(/\*\*Pertinence :\*\* \d{2}%/u);
      expect(section).toContain('`high`');
      expect(section).toContain('⭐⭐'); // effort 2
      expect(section).toContain('💥💥💥💥'); // impact 4
    });
  });

  describe('HTML PDF (C16.7, construit sans Chrome)', () => {
    it('produit le bloc HTML de la section (nouvelle page, couleurs, échappement)', () => {
      seedRuleAndAudit();
      const html = new PDFReportGenerator(engine).buildContextRecommendationsHtml(audit);

      expect(html).toBeDefined();
      expect(html).toContain('page-break-before: always');
      expect(html).toContain('Recommandations contextuelles');
      expect(html).toContain('1. Optimiser les images');
      expect(html).toContain('Pertinence :');
      expect(html).toContain('Effort : 2/5');
      expect(html).toContain('border-left: 4px solid #c05621'); // priorité high
      expect(html).toContain('Constat : Images non optimisées');
    });

    it('échappe le HTML des titres/descriptions (pas d injection)', () => {
      engine.addRule({
        name: 'Injection',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'xss',
        recommendationTitle: '<script>alert(1)</script>',
        recommendationDescription: 'Description <b>gras</b> & co',
      });
      audit = seedAudit('2026-01-01T00:00:00.000Z', [['performance', 'XSS probe', 3]]);

      const html = new PDFReportGenerator(engine).buildContextRecommendationsHtml(audit);
      expect(html).toBeDefined();
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<b>gras</b>');
      expect(html).toContain('&lt;b&gt;gras&lt;/b&gt; &amp; co');
    });

    it('sans moteur ou sans projet : undefined (section optionnelle)', () => {
      seedRuleAndAudit();
      expect(new PDFReportGenerator().buildContextRecommendationsHtml(audit)).toBeUndefined();

      const withoutProject = {
        ...audit,
        metadata: { ...audit.metadata, projectId: null },
      } as Audit;
      expect(
        new PDFReportGenerator(engine).buildContextRecommendationsHtml(withoutProject),
      ).toBeUndefined();
    });

    it('moteur qui échoue = section silencieusement absente (jamais bloquant)', () => {
      // Engine sur une base fermée : buildContext lèvera.
      seedRuleAndAudit();
      const brokenEngine = {
        generateRecommendations: (): never => {
          throw new Error('base indisponible');
        },
      } as unknown as RecommendationEngine;

      expect(
        new PDFReportGenerator(brokenEngine).buildContextRecommendationsHtml(audit),
      ).toBeUndefined();
      expect(
        new MarkdownReportGenerator(brokenEngine).buildContextRecommendationsSection(audit),
      ).toBeUndefined();
    });
  });
});
