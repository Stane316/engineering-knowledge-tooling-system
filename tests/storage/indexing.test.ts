import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisReport, Finding, Priority } from '../../src/analysis/types.js';
import { IndexingError } from '../../src/shared/errors.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditIndexer } from '../../src/storage/indexing.js';
import { AuditSchema } from '../../src/storage/schema.js';
import type {
  Audit,
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
      infoFindings: count('info'),
      overallScore: score,
    },
  };
}

/**
 * Magasin d'embeddings de test : 100 % local et déterministe (aucun réseau).
 *
 * Enregistre les entrées et, sur `search()`, retourne des correspondances
 * forcées (pour simuler un voisin sémantique absent du classement lexical).
 */
class FakeEmbeddingStore implements AuditEmbeddingStore {
  /** Entrées indexées par identifiant stable. */
  readonly items = new Map<string, AuditEmbeddingInput>();
  /** Correspondances à retourner à chaque recherche. */
  forcedMatches: AuditEmbeddingMatch[] = [];
  /** Appels de suppression observés. */
  removed: string[][] = [];

  async addEmbeddings(items: readonly AuditEmbeddingInput[]): Promise<void> {
    for (const item of items) {
      this.items.set(item.id, item);
    }
  }

  async removeEmbeddings(ids: readonly string[]): Promise<number> {
    this.removed.push([...ids]);
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

/** Audit minimal non persisté (sans identifiant) pour les tests d'erreur. */
function unpersistedAudit(): Audit {
  return {
    metadata: {
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      overallScore: 70,
      totalFindings: 1,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
    },
    dimensions: [],
    findings: [
      {
        auditId: 0,
        dimension: 'performance',
        title: 'Orphelin',
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
      },
    ],
  };
}

describe('AuditIndexer', () => {
  let db: Database.Database;
  let repo: AuditRepository;
  let store: FakeEmbeddingStore;
  let indexer: AuditIndexer;

  beforeEach(() => {
    db = new Database(':memory:');
    // Table `projects` (migration 001) : requise par la FK `ON DELETE SET NULL` (Sprint 13).
    db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    new AuditSchema(db).createSchema();
    repo = new AuditRepository(db);
    store = new FakeEmbeddingStore();
    indexer = new AuditIndexer(db, store);
  });

  afterEach(() => {
    db.close();
  });

  /** Nombre de lignes dans l'index plein texte. */
  function ftsCount(): number {
    return (db.prepare('SELECT COUNT(*) AS n FROM audit_fts').get() as { n: number }).n;
  }

  describe('rebuildFTSIndex', () => {
    it('indexe tous les constats de la base', () => {
      repo.store(
        makeReport('https://example.com', 70, [
          makeFinding({ id: 'f1', title: 'LCP trop élevé', description: 'Premier constat' }),
          makeFinding({ id: 'f2', title: 'CLS instable', description: 'Deuxième constat' }),
        ]),
      );
      repo.store(
        makeReport('https://other.com', 80, [
          makeFinding({ id: 'f3', title: 'TTFB lent', description: 'Troisième constat' }),
        ]),
      );

      const indexed = indexer.rebuildFTSIndex();

      expect(indexed).toBe(3);
      const hits = db
        .prepare('SELECT COUNT(*) AS n FROM audit_fts WHERE audit_fts MATCH ?')
        .get('LCP') as { n: number };
      expect(hits.n).toBe(1);
    });

    it("reconstruit sans dupliquer l'index existant", () => {
      repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      indexer.rebuildFTSIndex();
      indexer.rebuildFTSIndex();

      expect(ftsCount()).toBe(1);
    });

    it('retourne 0 sur une base vide', () => {
      expect(indexer.rebuildFTSIndex()).toBe(0);
    });
  });

  describe('indexAuditFTS', () => {
    it("indexe uniquement l'audit demandé", () => {
      const first = repo.store(
        makeReport('https://first.com', 70, [makeFinding({ id: 'f1', title: 'Alpha critère' })]),
      );
      repo.store(
        makeReport('https://second.com', 80, [makeFinding({ id: 'f2', title: 'Bêta critère' })]),
      );

      const indexed = indexer.indexAuditFTS(first.metadata.id!);

      expect(indexed).toBe(1);
      expect(ftsCount()).toBe(1);
      const hits = db
        .prepare('SELECT COUNT(*) AS n FROM audit_fts WHERE audit_fts MATCH ?')
        .get('Bêta') as { n: number };
      expect(hits.n).toBe(0);
    });

    it('remplace les lignes existantes (idempotent)', () => {
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      indexer.indexAuditFTS(audit.metadata.id!);
      indexer.indexAuditFTS(audit.metadata.id!);

      expect(ftsCount()).toBe(1);
    });
  });

  describe('addEmbeddings', () => {
    it('indexe les constats dans le magasin injecté avec des clés stables', async () => {
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding({ id: 'f1' })]));

      const vectorized = await indexer.addEmbeddings(audit);

      expect(vectorized).toBe(true);
      const keys = [...store.items.keys()];
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe(`audit-${String(audit.metadata.id)}-finding-1`);
      const only = [...store.items.values()][0];
      expect(only?.text).toContain('LCP trop élevé');
      expect(only?.metadata.dimension).toBe('performance');
    });

    it('retourne false sans magasin injecté (indexation plein texte seule)', async () => {
      const bare = new AuditIndexer(db);
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      expect(await bare.addEmbeddings(audit)).toBe(false);
      expect(store.items.size).toBe(0);
    });

    it("refuse un audit non persisté (id d'audit absent)", async () => {
      await expect(indexer.addEmbeddings(unpersistedAudit())).rejects.toThrow(IndexingError);
    });

    it('refuse un constat non persisté (id de constat absent)', async () => {
      const audit = unpersistedAudit();
      audit.metadata.id = 1;

      await expect(indexer.addEmbeddings(audit)).rejects.toThrow(/non persisté/);
    });

    it('indexe un audit sans constat (rien à vectoriser)', async () => {
      const empty = repo.store(makeReport('https://vide.com', 100));

      expect(await indexer.addEmbeddings(empty)).toBe(true);
      expect(store.items.size).toBe(0);
      expect(await indexer.removeEmbeddings(empty.metadata.id!)).toBe(0);
    });

    it('tolère un constat sans description (texte vectorisé vide)', async () => {
      // Hostilité assumée : le contrat Sprint 9 exige `description`, on la
      // retire après construction pour viser le repli du vectoriseur.
      const finding = makeFinding();
      (finding as { description?: string }).description = undefined;
      const audit = repo.store(makeReport('https://example.com', 70, [finding]));

      await indexer.addEmbeddings(audit);

      const only = [...store.items.values()][0];
      expect(only?.text).toBe('LCP trop élevé');
    });

    it('retourne 0 vecteur retiré sans magasin injecté', async () => {
      const bare = new AuditIndexer(db);

      expect(await bare.removeEmbeddings(1)).toBe(0);
    });
  });

  describe('indexAudit', () => {
    it("indexe FTS et embeddings d'un audit complet", async () => {
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      const outcome = await indexer.indexAudit(audit);

      expect(outcome.ftsRows).toBe(1);
      expect(outcome.vectorized).toBe(true);
      expect(store.items.size).toBe(1);
      expect(ftsCount()).toBe(1);
    });

    it("signale l'absence de magasin sans échouer", async () => {
      const bare = new AuditIndexer(db);
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      const outcome = await bare.indexAudit(audit);

      expect(outcome.vectorized).toBe(false);
      expect(outcome.ftsRows).toBe(1);
    });

    it('refuse un audit non persisté', async () => {
      await expect(indexer.indexAudit(unpersistedAudit())).rejects.toThrow(IndexingError);
    });
  });

  describe('deindexAudit', () => {
    it('retire les lignes FTS et les embeddings', async () => {
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));
      await indexer.indexAudit(audit);

      const outcome = await indexer.deindexAudit(audit.metadata.id!);

      expect(outcome.ftsRows).toBe(1);
      expect(outcome.vectorized).toBe(true);
      expect(ftsCount()).toBe(0);
      expect(store.items.size).toBe(0);
      expect(store.removed[0]?.[0]).toContain('audit-');
    });
  });
});
