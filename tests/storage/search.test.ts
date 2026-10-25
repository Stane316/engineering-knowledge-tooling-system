import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisReport, Finding, Priority } from '../../src/analysis/types.js';
import { RRF_K } from '../../src/business/rrf.js';
import { SearchError, ValidationError } from '../../src/shared/errors.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditIndexer } from '../../src/storage/indexing.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AuditSearch } from '../../src/storage/search.js';
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
    score,
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
      overallScore: score,
    },
  };
}

/**
 * Magasin d'embeddings de test : 100 % local et déterministe (aucun réseau).
 *
 * `search()` retourne des correspondances forcées, pilotées par le test.
 */
class FakeEmbeddingStore implements AuditEmbeddingStore {
  readonly items = new Map<string, AuditEmbeddingInput>();
  forcedMatches: AuditEmbeddingMatch[] = [];

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

  async search(_query: string, limit: number): Promise<AuditEmbeddingMatch[]> {
    return this.forcedMatches.slice(0, limit);
  }
}

describe('AuditSearch', () => {
  let db: Database.Database;
  let repo: AuditRepository;
  let store: FakeEmbeddingStore;
  let indexer: AuditIndexer;
  let search: AuditSearch;

  beforeEach(() => {
    db = new Database(':memory:');
    // Table `projects` (migration 001) : requise par la FK `ON DELETE SET NULL` (Sprint 13).
    db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    new AuditSchema(db).createSchema();
    repo = new AuditRepository(db);
    store = new FakeEmbeddingStore();
    indexer = new AuditIndexer(db, store);
    search = new AuditSearch(db, repo, store);
  });

  afterEach(() => {
    db.close();
  });

  describe('search', () => {
    it('retrouve un audit indexé par sa requête plein texte', async () => {
      const audit = repo.store(
        makeReport('https://example.com', 70, [
          makeFinding({ title: 'TTFB de 2 s', description: 'Latence serveur' }),
        ]),
      );
      await indexer.indexAudit(audit);

      const results = await search.search({ query: 'TTFB' });

      expect(results).toHaveLength(1);
      expect(results[0]?.audit.metadata.url).toBe('https://example.com');
      expect(results[0]?.score).toBeGreaterThan(0);
    });

    it('énumère tous les audits sans requête (score 1)', async () => {
      repo.store(makeReport('https://a.com', 70));
      repo.store(makeReport('https://b.com', 80));

      const results = await search.search({});

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.score === 1)).toBe(true);
    });

    it('retourne un tableau vide si rien ne correspond', async () => {
      repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      const results = await search.search({ query: 'introuvableabsolument' });

      expect(results).toHaveLength(0);
    });

    it('fusionne FTS et embeddings par RRF : le score cumule les deux rangs', async () => {
      const audit = repo.store(
        makeReport('https://example.com', 70, [
          makeFinding({ title: 'LCP trop élevé', description: 'Visuel lent' }),
        ]),
      );
      await indexer.indexAudit(audit);
      store.forcedMatches = [{ auditId: audit.metadata.id!, score: 0.9 }];

      const results = await search.search({ query: 'LCP' });

      expect(results).toHaveLength(1);
      // Rang 1 dans les deux classements : 1/(60+1) + 1/(60+1) = 2/61.
      expect(results[0]?.score).toBeCloseTo(2 / (RRF_K + 1), 10);
    });

    it('complète le classement lexical par un voisin sémantique absent du FTS', async () => {
      const lexical = repo.store(
        makeReport('https://lexical.com', 70, [
          makeFinding({ id: 'f1', title: 'LCP lent', description: 'Premier plan' }),
        ]),
      );
      const semanticOnly = repo.store(
        makeReport('https://semantique.com', 90, [
          makeFinding({ id: 'f2', title: 'Zébulon', description: 'Voisin distant' }),
        ]),
      );
      await indexer.indexAudit(lexical);
      await indexer.indexAudit(semanticOnly);
      // Le magasin « sent » un voisin que le BM25 n'a pas remonté.
      store.forcedMatches = [{ auditId: semanticOnly.metadata.id!, score: 0.8 }];

      const results = await search.search({ query: 'LCP' });

      const urls = results.map((r) => r.audit.metadata.url);
      expect(urls).toContain('https://lexical.com');
      expect(urls).toContain('https://semantique.com');
      // Les deux sources : lexical 1/61, sémantique seul 1/61 → à égalité,
      // l'ordre total retient l'identifiant le plus bas en premier.
      expect(results).toHaveLength(2);
    });

    it('recherche en plein texte seul sans magasin injecté (score ≤ 1/(k+1))', async () => {
      const bare = new AuditSearch(db, repo);
      const audit = repo.store(
        makeReport('https://example.com', 70, [
          makeFinding({ title: 'CLS instable', description: 'Mise en page' }),
        ]),
      );
      await indexer.indexAudit(audit);

      const results = await bare.search({ query: 'CLS' });

      expect(results).toHaveLength(1);
      expect(results[0]?.score).toBeLessThanOrEqual(1 / (RRF_K + 1));
    });

    it('applique le filtre de score global', async () => {
      repo.store(makeReport('https://faible.com', 70));
      repo.store(makeReport('https://fort.com', 90));

      const results = await search.search({ scoreMin: 75 });

      expect(results).toHaveLength(1);
      expect(results[0]?.audit.metadata.url).toBe('https://fort.com');
    });

    it('applique le filtre de dimension', async () => {
      const perf = repo.store(
        makeReport('https://perf.com', 70, [makeFinding({ dimension: 'performance' })]),
      );
      repo.store(makeReport('https://seo.com', 70, [makeFinding({ dimension: 'seo', id: 'f2' })]));
      expect(perf.metadata.id).toBeDefined();

      const results = await search.search({ dimension: 'seo' });

      expect(results).toHaveLength(1);
      expect(results[0]?.audit.metadata.url).toBe('https://seo.com');
    });

    it('applique le filtre de priorité', async () => {
      repo.store(
        makeReport('https://critique.com', 70, [
          makeFinding({ priority: 'critical', severity: 4 }),
        ]),
      );
      repo.store(
        makeReport('https://mineur.com', 70, [
          makeFinding({ id: 'f2', priority: 'low', severity: 1 }),
        ]),
      );

      const results = await search.search({ priority: 'critical' });

      expect(results).toHaveLength(1);
      expect(results[0]?.audit.metadata.url).toBe('https://critique.com');
    });

    it('pagine les résultats (offset, limit)', async () => {
      for (let i = 0; i < 10; i++) {
        repo.store(makeReport(`https://site${String(i)}.com`, 70));
      }

      const first = await search.search({ offset: 0, limit: 5 });
      const second = await search.search({ offset: 5, limit: 5 });

      expect(first).toHaveLength(5);
      expect(second).toHaveLength(5);
      expect(first[0]?.audit.metadata.url).not.toBe(second[0]?.audit.metadata.url);
    });

    it('recherche avec des options vides (défauts offset/limit, sans requête)', async () => {
      repo.store(makeReport('https://example.com', 70));

      const results = await search.search();

      expect(results).toHaveLength(1);
      expect(results[0]?.score).toBe(1);
    });

    it('combine tous les filtres sur une recherche requêtée', async () => {
      const audit = repo.store(
        makeReport('https://garder.com', 80, [
          makeFinding({ id: 'f1', title: 'Contraste faible', priority: 'critical', severity: 4 }),
        ]),
      );
      const other = repo.store(
        makeReport('https://echouer.com', 40, [
          makeFinding({ id: 'f2', dimension: 'seo', priority: 'low', severity: 1 }),
        ]),
      );
      await indexer.indexAudit(audit);
      await indexer.indexAudit(other);

      const results = await search.search({
        query: 'Contraste',
        scoreMin: 60,
        scoreMax: 90,
        dimension: 'performance',
        priority: 'critical',
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.audit.metadata.url).toBe('https://garder.com');
    });

    it('déduplique les constats multiples d’un même audit (rang lexical)', async () => {
      const audit = repo.store(
        makeReport('https://example.com', 70, [
          makeFinding({ id: 'f1', title: 'Gradient visible partout', description: 'Gradient' }),
          makeFinding({ id: 'f2', title: 'Gradient flou', description: 'Autre gradient' }),
        ]),
      );
      await indexer.indexAudit(audit);
      store.forcedMatches = [];

      const results = await search.search({ query: 'Gradient' });

      expect(results).toHaveLength(1);
      expect(results[0]?.score).toBeGreaterThan(0);
    });

    it("échoue explicitement sur un voisin orphelin (id d'audit inconnu)", async () => {
      store.forcedMatches = [{ auditId: 999_999, score: 0.9 }];

      await expect(search.search({ query: 'quelconque' })).rejects.toThrow(SearchError);
    });

    it('refuse la fusion sémantique sans magasin (garde-fou interne)', async () => {
      // Invocation du garde-fou privé sur une instance sans magasin.
      const bareSearch = new AuditSearch(db, repo) as unknown as {
        hybridMerge(query: string, fts: never[], limit: number): Promise<unknown[]>;
      };
      await expect(bareSearch.hybridMerge('x', [], 1)).rejects.toThrow(SearchError);
    });

    it('rejette un offset négatif', async () => {
      await expect(search.search({ offset: -1 })).rejects.toThrow(ValidationError);
    });

    it('rejette une requête FTS malformée', async () => {
      repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      await expect(search.search({ query: '"' })).rejects.toThrow(SearchError);
    });
  });

  describe('findByScoreRange', () => {
    it("retourne les audits dont le score est dans l'intervalle", () => {
      repo.store(makeReport('https://a.com', 70));
      repo.store(makeReport('https://b.com', 85));
      repo.store(makeReport('https://c.com', 95));

      const audits = search.findByScoreRange(75, 90);

      expect(audits).toHaveLength(1);
      expect(audits[0]?.metadata.overallScore).toBe(85);
    });

    it('retourne un tableau vide sans correspondance', () => {
      repo.store(makeReport('https://a.com', 70));

      expect(search.findByScoreRange(90, 100)).toHaveLength(0);
    });
  });

  describe('findByDimension', () => {
    it('retourne les audits portant une dimension', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding({ dimension: 'ux' })]));

      expect(search.findByDimension('ux')).toHaveLength(1);
      expect(search.findByDimension('content')).toHaveLength(0);
    });
  });

  describe('findByPriority', () => {
    it('retourne les audits portant une priorité', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding({ priority: 'info', severity: 0 })]));

      expect(search.findByPriority('info')).toHaveLength(1);
      expect(search.findByPriority('critical')).toHaveLength(0);
    });
  });

  describe('findTopIssues', () => {
    it('regroupe les constats récurrents sur plusieurs audits', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding({ id: 'f1' })]));
      repo.store(makeReport('https://b.com', 70, [makeFinding({ id: 'f2' })]));
      repo.store(makeReport('https://c.com', 70, [makeFinding({ id: 'f3', title: 'Unique' })]));

      const top = search.findTopIssues(10);

      expect(top[0]?.title).toBe('LCP trop élevé');
      expect(top[0]?.count).toBe(2);
      expect(top[0]?.dimension).toBe('performance');
      expect(top).toHaveLength(2);
    });

    it('respecte la limite demandée', () => {
      repo.store(makeReport('https://a.com', 70, [makeFinding()]));

      expect(search.findTopIssues(1)).toHaveLength(1);
    });

    it('rejette une limite nulle', () => {
      expect(() => search.findTopIssues(0)).toThrow(ValidationError);
    });
  });
});
