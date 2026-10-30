import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import type {
  AnalysisDimension,
  AxeResults,
  ContentResults,
  LighthouseResults,
  OverallScore,
  UXResults,
} from '../../src/analysis/types.js';
import { AuditComparator } from '../../src/reports/comparator.js';
import { HtmlReportGenerator } from '../../src/reports/html-generator.js';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator.js';
import { ComparisonMarkdownTemplate } from '../../src/reports/templates/comparison-markdown.js';
import { HtmlTemplate } from '../../src/reports/templates/html.js';
import { MarkdownTemplate } from '../../src/reports/templates/markdown.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import type { Audit } from '../../src/storage/types.js';

/**
 * Sprint 19-03 — C-W07 : le score global indisponible reste indisponible.
 *
 * Le défaut corrigé : quand une dimension manquait, le score global était
 * calculé sur les dimensions restantes (renormalisation silencieuse) ou
 * remplacé par `0`. Les deux pratiques produisent un nombre comparable à un
 * score mesuré, et donc une conclusion fausse.
 *
 * L'oracle attend :
 * 1. aucune renormalisation — une dimension manquante suffit à rendre le score
 *    global indisponible, avec sa raison et la liste des dimensions manquantes ;
 * 2. aucune comparaison chiffrée entre un audit mesuré et un audit indisponible ;
 * 3. une restitution explicite (« indisponible — raison ») dans les rapports ;
 * 4. un refus de persistance tant que le schéma n'accepte pas l'indisponibilité.
 */

/** Résultats Lighthouse entièrement mesurés. */
const lighthouse: LighthouseResults = {
  performance: {
    score: 80,
    metrics: {
      lcp: { status: 'measured', value: 1800 },
      fid: { status: 'measured', value: 80 },
      cls: { status: 'measured', value: 0.05 },
      ttfb: { status: 'measured', value: 400 },
    },
  },
  seo: { score: 90, issues: [] },
};

/** Résultats axe-core mesurés. */
const axe: AxeResults = { violations: [], score: 95 };

/** Heuristiques UX mesurées. */
const ux: UXResults = { score: 70, heuristics: [] };

/** Métriques de contenu mesurées. */
const content: ContentResults = {
  score: 85,
  metrics: { wordCount: 500, readingTime: 2, readabilityScore: 60 },
};

describe('C-W07 — score global du pipeline', () => {
  const pipeline = new AnalysisPipeline();

  it('calcule la moyenne pondérée quand les cinq dimensions sont mesurées', async () => {
    const report = await pipeline.analyze('https://example.com', lighthouse, axe, ux, content);

    // 80×0,25 + 95×0,25 + 90×0,20 + 70×0,15 + 85×0,15 = 85,0
    expect(report.summary.overallScore).toEqual({ status: 'measured', value: 85 });
  });

  it('ne renormalise pas quand une dimension manque de score', async () => {
    const report = await pipeline.analyze(
      'https://example.com',
      lighthouse,
      { violations: [], score: null },
      ux,
      content,
    );

    expect(report.summary.overallScore.status).toBe('unavailable');
    const overall = report.summary.overallScore;
    if (overall.status !== 'unavailable') throw new Error('score attendu indisponible');
    expect(overall.code).toBe('dimensions-indisponibles');
    expect(overall.missingDimensions).toEqual(['accessibility']);
    expect(overall.reason).toContain('accessibility');
    expect(overall.reason).toContain('renormalisé');
    // Aucune valeur numérique n'est exposée : `0` aurait été un score plausible.
    expect(overall).not.toHaveProperty('value');
  });

  it('distingue l’absence de toute dimension', () => {
    // Les analyseurs UX et contenu produisent toujours un score : le cas
    // « aucune dimension » est atteint par la calculatrice elle-même.
    const calculator = pipeline as unknown as {
      calculateOverallScore(scores: Record<AnalysisDimension, number | null>): OverallScore;
    };
    const overall = calculator.calculateOverallScore({
      performance: null,
      accessibility: null,
      seo: null,
      ux: null,
      content: null,
    });

    if (overall.status !== 'unavailable') throw new Error('score attendu indisponible');
    expect(overall.code).toBe('aucune-dimension');
    expect(overall.missingDimensions).toHaveLength(5);
  });
});

/** Audit minimal, score global éventuellement indisponible. */
function makeAudit(options: {
  readonly id: number;
  readonly score: number | null;
  readonly scoreReason?: string;
}): Audit {
  return {
    metadata: {
      id: options.id,
      url: 'https://example.com',
      timestamp: '2026-10-24T10:00:00.000Z',
      overallScore: options.score,
      ...(options.scoreReason === undefined ? {} : { scoreReason: options.scoreReason }),
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: [
      { auditId: options.id, dimension: 'performance', score: 80, findingsCount: 0 },
      { auditId: options.id, dimension: 'accessibility', score: 90, findingsCount: 0 },
      { auditId: options.id, dimension: 'seo', score: 85, findingsCount: 0 },
      { auditId: options.id, dimension: 'ux', score: 70, findingsCount: 0 },
      { auditId: options.id, dimension: 'content', score: 75, findingsCount: 0 },
    ],
    findings: [],
  };
}

describe('C-W07 — comparaison', () => {
  const comparator = new AuditComparator();

  it('n’invente aucun écart quand un score manque', () => {
    const evolution = comparator.calculateEvolution(
      makeAudit({ id: 1, score: 70 }),
      makeAudit({ id: 2, score: null, scoreReason: 'dimension SEO indisponible' }),
    );

    expect(evolution.status).toBe('unavailable');
    expect(evolution.scoreA).toBe(70);
    expect(evolution.scoreB).toBeNull();
    expect(evolution.delta).toBeNull();
    expect(evolution.percentage).toBeNull();
    expect(evolution.trend).toBe('unavailable');
  });

  it('recommande de relancer une analyse plutôt que de parler de stagnation', () => {
    const [recommendation] = comparator.generateRecommendations(
      {
        status: 'unavailable',
        scoreA: null,
        scoreB: 70,
        delta: null,
        percentage: null,
        trend: 'unavailable',
      },
      {
        newFindings: [],
        resolvedFindings: [],
        persistentFindings: [],
        improvedFindings: [],
      },
    );

    expect(recommendation).toContain('indisponible');
    expect(recommendation).not.toContain('stagnants');
  });
});

describe('C-W07 — restitution dans les rapports', () => {
  const audit = makeAudit({ id: 7, score: null, scoreReason: 'dimension SEO indisponible' });

  it('affiche le score indisponible et sa raison en Markdown', () => {
    const markdown = new MarkdownTemplate().generateHeader(audit);

    expect(markdown).toContain('indisponible');
    expect(markdown).toContain('dimension SEO indisponible');
    expect(markdown).not.toContain('0/100');
  });

  it('affiche le score indisponible et sa raison en HTML, échappé', () => {
    const html = new HtmlTemplate().generateReport(
      makeAudit({ id: 8, score: null, scoreReason: '<script>alert(1)</script>' }),
    );

    expect(html).toContain('score-unavailable');
    expect(html).toContain('indisponible');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('génère un rapport Markdown complet sans refuser l’indisponibilité', async () => {
    const report = await new MarkdownReportGenerator().generate(audit);

    expect(report.content).toContain('indisponible');
    expect(report.content).toContain('dimension SEO indisponible');
  });

  it('génère un rapport HTML complet sans refuser l’indisponibilité', () => {
    const html = new HtmlReportGenerator().generateSync(audit);

    expect(html).toContain('score-unavailable');
    expect(html).toContain('indisponible');
  });

  it('affiche un écart indisponible dans la comparaison Markdown', () => {
    const comparison = new AuditComparator().compare(
      makeAudit({ id: 1, score: 70 }),
      makeAudit({ id: 2, score: null }),
    );
    const markdown = new MarkdownTemplate().generateComparisonReport(comparison);

    expect(markdown).toContain('indisponible');
  });

  it('délègue le résumé de comparaison au même rendu', () => {
    const comparison = new AuditComparator().compare(
      makeAudit({ id: 1, score: 70 }),
      makeAudit({ id: 2, score: null }),
    );

    expect(new ComparisonMarkdownTemplate().generateSummaryReport(comparison)).toContain(
      'indisponible',
    );
  });
});

describe('C-W07 — persistance', () => {
  let db: Database.Database;
  let repository: AuditRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    new AuditSchema(db).createSchema();
    repository = new AuditRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('refuse un rapport dont le score global est indisponible (avant migration 010)', async () => {
    const report = await new AnalysisPipeline().analyze(
      'https://example.com',
      lighthouse,
      { violations: [], score: null },
      ux,
      content,
    );

    // Écrire 0 serait la valeur de remplacement interdite par C-W07.
    expect(() => repository.store(report)).toThrow(/score global indisponible/);
    expect(db.prepare('SELECT COUNT(*) AS n FROM audit_metadata').get()).toEqual({ n: 0 });
  });
});
