import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { labVitals } from '../../src/analysis/measurement.js';

import type {
  AnalysisReport,
  AxeResults,
  ContentResults,
  Finding,
  LighthouseResults,
  Priority,
  UXResults,
} from '../../src/analysis/types.js';
import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditIndexer } from '../../src/storage/indexing.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AuditSearch } from '../../src/storage/search.js';
import { AuditStatisticsManager } from '../../src/storage/statistics.js';
import type {
  AuditEmbeddingInput,
  AuditEmbeddingMatch,
  AuditEmbeddingStore,
} from '../../src/storage/types.js';

/** Constat de test avec des valeurs valides par défaut. */
function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-test',
    dimension: 'performance',
    title: 'LCP trop élevé',
    description: 'Le LCP est de 4,5 s',
    severity: 3,
    effort: 2,
    impact: 4,
    priority: 'high',
    recommendation: 'Optimiser les images',
    references: [],
    ...overrides,
  };
}

/** Rapport conforme au contrat Sprint 9 (résumés de dimension en texte). */
function makeReport(
  url = 'https://example.com',
  score = 70,
  findings: Finding[] = [],
  timestamp = new Date().toISOString(),
): AnalysisReport {
  const count = (priority: Priority): number =>
    findings.filter((f) => f.priority === priority).length;

  const dimensionOf = (name: AnalysisReport['dimensions']['performance']['dimension']) => ({
    dimension: name,
    // Sprint 19-03 : un score de dimension est désormais accompagné de son état.
    score,
    status: 'measured' as const,
    findings: findings.filter((f) => f.dimension === name),
    summary: `Score ${name} : ${String(score)}/100.`,
  });

  return {
    url,
    timestamp,
    dimensions: {
      performance: dimensionOf('performance'),
      accessibility: dimensionOf('accessibility'),
      seo: dimensionOf('seo'),
      ux: dimensionOf('ux'),
      content: dimensionOf('content'),
    },
    findings,
    priorityFindings: [...findings],
    summary: {
      totalFindings: findings.length,
      criticalFindings: count('critical'),
      highFindings: count('high'),
      mediumFindings: count('medium'),
      lowFindings: count('low'),
      infoFindings: count('info'),
      overallScore: { status: 'measured' as const, value: score },
    },
  };
}

/**
 * Magasin d'embeddings de test : 100 % local et déterministe (aucun réseau).
 *
 * La recherche retourne les audits indexés dont le texte contient un mot de
 * la requête — approximation déterministe d'un voisin sémantique.
 */
class FakeEmbeddingStore implements AuditEmbeddingStore {
  readonly items = new Map<string, AuditEmbeddingInput>();

  async addEmbeddings(items: readonly AuditEmbeddingInput[]): Promise<void> {
    for (const item of items) {
      this.items.set(item.id, item);
    }
  }

  async removeEmbeddings(ids: readonly string[]): Promise<number> {
    let removed = 0;
    for (const id of ids) {
      if (this.items.delete(id)) {
        removed++;
      }
    }
    return removed;
  }

  async search(query: string, limit: number): Promise<AuditEmbeddingMatch[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    const byAudit = new Map<number, number>();

    for (const item of this.items.values()) {
      const text = item.text.toLowerCase();
      const hits = terms.filter((term) => text.includes(term)).length;
      if (hits > 0 && item.metadata.auditId !== undefined) {
        const auditId = item.metadata.auditId;
        byAudit.set(auditId, Math.max(byAudit.get(auditId) ?? 0, hits / terms.length));
      }
    }

    return [...byAudit.entries()]
      .sort(([idA, scoreA], [idB, scoreB]) => (scoreB !== scoreA ? scoreB - scoreA : idA - idB))
      .slice(0, limit)
      .map(([auditId, score]) => ({ auditId, score }));
  }
}

/** Entrées d'analyse du Sprint 9 pour un parcours complet réaliste. */
function pipelineInputs(): {
  lighthouse: LighthouseResults;
  axe: AxeResults;
  ux: UXResults;
  content: ContentResults;
} {
  return {
    lighthouse: {
      performance: {
        score: 75,
        metrics: labVitals({ lcp: 3000, fid: 150, cls: 0.15, ttfb: 1000 }),
      },
      seo: {
        score: 80,
        issues: [
          {
            title: 'Meta description manquante',
            description: 'La page n’a pas de meta description.',
            severity: 'error',
          },
        ],
      },
    },
    axe: {
      score: 70,
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Contraste insuffisant',
          help: 'Augmenter le contraste',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
          nodes: 5,
        },
      ],
    },
    ux: {
      score: 65,
      heuristics: [
        {
          id: 'visibility',
          name: 'Visibilité de l’état du système',
          score: 50,
          issues: ['Aucun indicateur de chargement'],
        },
      ],
    },
    content: { score: 60, metrics: { wordCount: 400, readingTime: 2, readabilityScore: 55 } },
  };
}

describe('Intégration du stockage d’audits', () => {
  let db: Database.Database;
  let schema: AuditSchema;
  let repo: AuditRepository;
  let store: FakeEmbeddingStore;
  let indexer: AuditIndexer;
  let search: AuditSearch;
  let stats: AuditStatisticsManager;

  beforeEach(() => {
    db = new Database(':memory:');
    // Table `projects` (migration 001) : requise par la FK `ON DELETE SET NULL` (Sprint 13).
    db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    schema = new AuditSchema(db);
    schema.createSchema();
    repo = new AuditRepository(db);
    store = new FakeEmbeddingStore();
    indexer = new AuditIndexer(db, store);
    search = new AuditSearch(db, repo, store);
    stats = new AuditStatisticsManager(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('flux complet', () => {
    it('analyse, stocke, indexe, recherche et agrège (Sprint 9 → 10)', async () => {
      const inputs = pipelineInputs();
      const report = await new AnalysisPipeline().analyze(
        'https://example.com',
        inputs.lighthouse,
        inputs.axe,
        inputs.ux,
        inputs.content,
      );

      const audit = repo.store(report);
      expect(audit.metadata.id).toBeDefined();
      expect(audit.dimensions).toHaveLength(5);
      expect(audit.findings.length).toBe(report.findings.length);
      expect(audit.findings.length).toBeGreaterThan(0);

      const outcome = await indexer.indexAudit(audit);
      expect(outcome.ftsRows).toBe(audit.findings.length);
      expect(outcome.vectorized).toBe(true);

      // Terme repris des constats réellement produits par les analyseurs :
      // les intitulés sont en français, aucune garantie sur « performance ».
      const term =
        audit.findings
          .flatMap((f) => [f.title, f.description ?? ''])
          .join(' ')
          .split(/\s+/)
          .find((word) => word.length >= 4) ?? 'constat';
      const results = await search.search({ query: term });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.audit.metadata.url).toBe('https://example.com');

      const statistics = stats.getStatistics();
      expect(statistics.totalAudits).toBe(1);
      expect(statistics.averageScore).toBe(audit.metadata.overallScore);

      const trend = stats.getTrend('week');
      expect(trend.length).toBe(1);
      expect(trend[0]?.auditCount).toBe(1);

      const topIssues = stats.getTopIssues(10);
      expect(topIssues.length).toBeGreaterThan(0);
      expect(topIssues[0]?.count).toBe(1);
    });

    it('conserve deux audits distincts pour une même URL', async () => {
      const inputs = pipelineInputs();
      const pipeline = new AnalysisPipeline();

      const first = await pipeline.analyze(
        'https://example.com',
        inputs.lighthouse,
        inputs.axe,
        inputs.ux,
        inputs.content,
      );
      const second = await pipeline.analyze(
        'https://example.com',
        inputs.lighthouse,
        inputs.axe,
        inputs.ux,
        inputs.content,
      );

      const audit1 = repo.store(first);
      const audit2 = repo.store(second);
      await indexer.indexAudit(audit1);
      await indexer.indexAudit(audit2);

      expect(repo.findByUrl('https://example.com')).toHaveLength(2);

      const urlStats = stats.getStatisticsForUrl('https://example.com');
      expect(urlStats.totalAudits).toBe(2);

      // Suppression d'un seul des deux audits : l'autre survit.
      // Contrat documenté : désindexer avant de supprimer (les embeddings
      // vivent dans le magasin injecté, pas dans SQLite).
      await indexer.deindexAudit(audit1.metadata.id!);
      expect(repo.delete(audit1.metadata.id!)).toBe(true);
      expect(repo.findByUrl('https://example.com')).toHaveLength(1);
      const term =
        audit2.findings
          .flatMap((f) => [f.title, f.description ?? ''])
          .join(' ')
          .split(/\s+/)
          .find((word) => word.length >= 4) ?? 'constat';
      const leftover = await search.search({ query: term });
      expect(leftover).toHaveLength(1);
    });
  });

  describe('performance (10 000 audits)', () => {
    it(
      'respecte les budgets : stockage < 100 ms, indexation < 500 ms, recherche < 100 ms',
      { timeout: 120_000 },
      async () => {
        const total = 10_000;

        // 1. Stockage : une transaction de 7 lignes par audit, un constat par audit.
        const startStore = performance.now();
        for (let i = 0; i < total; i++) {
          repo.store(
            makeReport(
              `https://site${String(i)}.com`,
              50 + (i % 50),
              [
                makeFinding({
                  id: `f${String(i)}`,
                  title: `Constat ${String(i)}`,
                  description: `Description du constat numéro ${String(i)}`,
                }),
              ],
              new Date(1_700_000_000_000 + i * 60_000).toISOString(),
            ),
          );
        }
        const storeMs = (performance.now() - startStore) / total;
        expect(storeMs).toBeLessThan(100);

        // 2. Indexation : reconstruction FTS5 globale (budget par audit).
        const startIndex = performance.now();
        const indexed = indexer.rebuildFTSIndex();
        const indexMs = (performance.now() - startIndex) / total;
        expect(indexed).toBe(total);
        expect(indexMs).toBeLessThan(500);

        // 3. Recherche hybride : moyenne sur 50 requêtes.
        const startSearch = performance.now();
        const searches = 50;
        for (let i = 0; i < searches; i++) {
          await search.search({ query: `Constat ${String((i * 137) % total)}` });
        }
        const searchMs = (performance.now() - startSearch) / searches;
        expect(searchMs).toBeLessThan(100);

        // 4. Statistiques sur 10 000 audits (< 1 s).
        const startStats = performance.now();
        const statistics = stats.getStatistics();
        const statsMs = performance.now() - startStats;
        expect(statistics.totalAudits).toBe(total);
        expect(statsMs).toBeLessThan(1_000);

        // Journal de mesure (visible dans la sortie du test).
        console.log(
          `[perf] stockage ${storeMs.toFixed(3)} ms/audit · indexation ${indexMs.toFixed(3)} ms/audit · recherche ${searchMs.toFixed(3)} ms · stats ${statsMs.toFixed(1)} ms`,
        );
      },
    );
  });
});
