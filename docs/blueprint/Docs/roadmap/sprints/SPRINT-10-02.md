# Sprint 10-2 — Indexation + Recherche (Semaine 19, Jours 5-7)

**Durée :** 3 jours  
**Objectif :** Implémenter l'indexation FTS5/Vector et la recherche hybride  
**Dépendance :** Sprint 10-1 (Schema + Repository) ✅

---

## 1. Contexte

Le **Sprint 10-1** a implémenté :
- ✅ Types Audit (AuditMetadata, AuditDimension, AuditFinding)
- ✅ Schéma SQLite (3 tables + FTS5)
- ✅ AuditRepository (store, findById, findByUrl, list, delete)
- ✅ AuditConverter (AnalysisReport → Audit)

Le **Sprint 10-2** va :
- 🎯 Indexer les findings dans FTS5
- 🎯 Ajouter les embeddings Vector
- 🎯 Implémenter la recherche hybride (FTS5 + Vector + RRF)
- 🎯 Implémenter les filtres (score, dimension, priorité)
- 🎯 Tests unitaires

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── storage/
│   │   ├── types.ts                    ✅ (Sprint 2)
│   │   ├── schema.ts                   ✅ (Sprint 2)
│   │   ├── knowledge-repository.ts     ✅ (Sprint 3)
│   │   ├── search-engine.ts            ✅ (Sprint 4)
│   │   ├── vector-store.ts             ✅ (Sprint 4)
│   │   ├── audit-types.ts              ✅ (Sprint 10-1)
│   │   ├── audit-schema.ts             ✅ (Sprint 10-1)
│   │   ├── audit-repository.ts         ✅ (Sprint 10-1)
│   │   ├── audit-converter.ts          ✅ (Sprint 10-1)
│   │   ├── indexing.ts                 (à créer)
│   │   └── search.ts                   (à créer)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 AuditIndexer — FTS5 (Jour 1 — 4h)

**Fichier :** `src/storage/audit-indexing.ts`

```typescript
import { Database } from 'better-sqlite3';
import { Audit } from './audit-types';
import { VectorStore } from './vector-store';

/**
 * Indexeur pour les audits
 * 
 * Gère l'indexation FTS5 et Vector
 */
export class AuditIndexer {
  private db: Database;
  private vectorStore: VectorStore;

  constructor(db: Database, vectorStore: VectorStore) {
    this.db = db;
    this.vectorStore = vectorStore;
  }

  /**
   * Reconstruit l'index FTS5
   */
  rebuildFTSIndex(): void {
    // Vider l'index existant
    this.db.exec(`DELETE FROM audit_fts`);

    // Réinsérer tous les findings
    this.db.exec(`
      INSERT INTO audit_fts (rowid, url, title, description)
      SELECT 
        f.id,
        m.url,
        f.title,
        f.description
      FROM audit_findings f
      JOIN audit_metadata m ON f.audit_id = m.id
    `);
  }

  /**
   * Indexe un audit spécifique dans FTS5
   */
  indexAuditFTS(auditId: number): void {
    // Supprimer les anciennes entrées
    const findingIds = this.db.prepare(`
      SELECT id FROM audit_findings WHERE audit_id = ?
    `).all(auditId) as any[];

    for (const { id } of findingIds) {
      this.db.prepare(`
        DELETE FROM audit_fts WHERE rowid = ?
      `).run(id);
    }

    // Insérer les nouvelles entrées
    this.db.prepare(`
      INSERT INTO audit_fts (rowid, url, title, description)
      SELECT 
        f.id,
        m.url,
        f.title,
        f.description
      FROM audit_findings f
      JOIN audit_metadata m ON f.audit_id = m.id
      WHERE f.audit_id = ?
    `).run(auditId);
  }

  /**
   * Ajoute les embeddings Vector pour un audit
   */
  async addEmbeddings(audit: Audit): Promise<void> {
    const embeddings = audit.findings.map(finding => ({
      id: `audit-${audit.metadata.id}-finding-${finding.id}`,
      text: `${finding.title} ${finding.description || ''}`.trim(),
      metadata: {
        auditId: audit.metadata.id,
        findingId: finding.id,
        dimension: finding.dimension,
        priority: finding.priority,
        severity: finding.severity,
      },
    }));

    await this.vectorStore.addEmbeddings(embeddings);
  }

  /**
   * Supprime les embeddings Vector pour un audit
   */
  async removeEmbeddings(auditId: number): Promise<void> {
    const findingIds = this.db.prepare(`
      SELECT id FROM audit_findings WHERE audit_id = ?
    `).all(auditId) as any[];

    for (const { id } of findingIds) {
      await this.vectorStore.removeEmbedding(`audit-${auditId}-finding-${id}`);
    }
  }

  /**
   * Indexe complètement un audit (FTS5 + Vector)
   */
  async indexAudit(audit: Audit): Promise<void> {
    // Indexer dans FTS5
    this.indexAuditFTS(audit.metadata.id!);

    // Indexer dans Vector
    await this.addEmbeddings(audit);
  }

  /**
   * Désindexe complètement un audit
   */
  async deindexAudit(auditId: number): Promise<void> {
    // Supprimer de FTS5
    const findingIds = this.db.prepare(`
      SELECT id FROM audit_findings WHERE audit_id = ?
    `).all(auditId) as any[];

    for (const { id } of findingIds) {
      this.db.prepare(`
        DELETE FROM audit_fts WHERE rowid = ?
      `).run(id);
    }

    // Supprimer de Vector
    await this.removeEmbeddings(auditId);
  }
}
```

**Tests :** `tests/storage/audit-indexing.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditSchema } from '../../src/storage/audit-schema';
import { AuditRepository } from '../../src/storage/audit-repository';
import { AuditIndexer } from '../../src/storage/audit-indexing';
import { VectorStore } from '../../src/storage/vector-store';
import { AnalysisReport } from '../../src/analysis/types';

describe('AuditIndexer', () => {
  let db: Database.Database;
  let schema: AuditSchema;
  let repo: AuditRepository;
  let vectorStore: VectorStore;
  let indexer: AuditIndexer;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
    schema.createSchema();
    repo = new AuditRepository(db);
    vectorStore = new VectorStore(db);
    indexer = new AuditIndexer(db, vectorStore);
  });

  afterEach(() => {
    db.close();
  });

  const createMockReport = (): AnalysisReport => ({
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    dimensions: {
      performance: { score: 75, findings: [], summary: { good: 2, needsImprovement: 1, poor: 1 } },
      accessibility: { score: 70, findings: [], summary: { violations: 5, passes: 20, incomplete: 2 } },
      seo: { score: 80, findings: [], summary: { passed: 10, failed: 2, warnings: 3 } },
      ux: { score: 65, findings: [], summary: { passed: 5, failed: 5 } },
      content: { score: 60, findings: [], summary: { good: 3, needsImprovement: 2, poor: 1 } },
    },
    findings: [
      {
        id: 'f1',
        dimension: 'performance',
        title: 'LCP trop élevé',
        description: 'Le LCP est de 4.5s',
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation: 'Optimiser les images',
        references: [],
      },
    ],
    priorityFindings: [],
    summary: {
      totalFindings: 1,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      overallScore: 70,
    },
  });

  describe('rebuildFTSIndex', () => {
    it('should rebuild FTS5 index', () => {
      const report = createMockReport();
      const audit = repo.store(report);

      indexer.rebuildFTSIndex();

      // Vérifier que l'index contient les données
      const results = db.prepare(`
        SELECT * FROM audit_fts WHERE audit_fts MATCH 'LCP'
      `).all();

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('indexAuditFTS', () => {
    it('should index a specific audit in FTS5', () => {
      const report = createMockReport();
      const audit = repo.store(report);

      indexer.indexAuditFTS(audit.metadata.id!);

      const results = db.prepare(`
        SELECT * FROM audit_fts WHERE audit_fts MATCH 'LCP'
      `).all();

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('addEmbeddings', () => {
    it('should add embeddings for an audit', async () => {
      const report = createMockReport();
      const audit = repo.store(report);

      await indexer.addEmbeddings(audit);

      // Vérifier que les embeddings ont été ajoutés
      const embeddings = await vectorStore.getEmbeddings();
      expect(embeddings.length).toBeGreaterThan(0);
    });
  });

  describe('indexAudit', () => {
    it('should index an audit completely (FTS5 + Vector)', async () => {
      const report = createMockReport();
      const audit = repo.store(report);

      await indexer.indexAudit(audit);

      // Vérifier FTS5
      const ftsResults = db.prepare(`
        SELECT * FROM audit_fts WHERE audit_fts MATCH 'LCP'
      `).all();
      expect(ftsResults.length).toBeGreaterThan(0);

      // Vérifier Vector
      const embeddings = await vectorStore.getEmbeddings();
      expect(embeddings.length).toBeGreaterThan(0);
    });
  });

  describe('deindexAudit', () => {
    it('should remove an audit from indexes', async () => {
      const report = createMockReport();
      const audit = repo.store(report);

      await indexer.indexAudit(audit);
      await indexer.deindexAudit(audit.metadata.id!);

      // Vérifier FTS5
      const ftsResults = db.prepare(`
        SELECT * FROM audit_fts WHERE audit_fts MATCH 'LCP'
      `).all();
      expect(ftsResults.length).toBe(0);

      // Vérifier Vector
      const embeddings = await vectorStore.getEmbeddings();
      expect(embeddings.length).toBe(0);
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/audit-indexing.test.ts
# ✅ 5 tests passent

npm run test:coverage -- tests/storage/audit-indexing.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/storage/audit-indexing.ts
git add tests/storage/audit-indexing.test.ts
git commit -m "feat(storage): implement AuditIndexer with FTS5 + Vector indexing"
```

---

### 3.2 AuditSearch — Recherche Hybride (Jour 2 — 6h)

**Fichier :** `src/storage/audit-search.ts`

```typescript
import { Database } from 'better-sqlite3';
import { Audit, AuditSearchOptions, AuditSearchResult } from './audit-types';
import { AuditRepository } from './audit-repository';
import { VectorStore } from './vector-store';

/**
 * Recherche d'audits
 * 
 * Combine FTS5 (BM25) + Vector (cosine) + RRF
 */
export class AuditSearch {
  private db: Database;
  private repo: AuditRepository;
  private vectorStore: VectorStore;

  constructor(db: Database, repo: AuditRepository, vectorStore: VectorStore) {
    this.db = db;
    this.repo = repo;
    this.vectorStore = vectorStore;
  }

  /**
   * Recherche hybride (FTS5 + Vector + RRF)
   */
  async search(options: AuditSearchOptions): Promise<AuditSearchResult[]> {
    const { query, scoreMin, scoreMax, dimension, priority, offset = 0, limit = 100 } = options;

    let results: AuditSearchResult[] = [];

    if (query) {
      // 1. Recherche FTS5 (BM25)
      const ftsResults = this.searchFTS(query, limit * 2);

      // 2. Recherche Vector (cosine)
      const vectorResults = await this.searchVector(query, limit * 2);

      // 3. Fusion RRF (Reciprocal Rank Fusion, k=60)
      results = this.reciprocalRankFusion(ftsResults, vectorResults, 60);
    } else {
      // Pas de query, retourner tous les audits
      const audits = this.repo.list(offset, limit);
      results = audits.map(audit => ({
        audit,
        score: 1.0,
      }));
    }

    // Appliquer les filtres
    results = this.applyFilters(results, { scoreMin, scoreMax, dimension, priority });

    // Pagination
    return results.slice(offset, offset + limit);
  }

  /**
   * Recherche FTS5 (BM25)
   */
  private searchFTS(query: string, limit: number): AuditSearchResult[] {
    const rows = this.db.prepare(`
      SELECT 
        m.*,
        f.*,
        bm25(audit_fts) as rank
      FROM audit_fts
      JOIN audit_findings f ON audit_fts.rowid = f.id
      JOIN audit_metadata m ON f.audit_id = m.id
      WHERE audit_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(query, limit) as any[];

    // Grouper par audit_id
    const auditMap = new Map<number, AuditSearchResult>();

    for (const row of rows) {
      if (!auditMap.has(row.id)) {
        const audit = this.repo.findById(row.audit_id);
        if (audit) {
          auditMap.set(row.audit_id, {
            audit,
            score: -row.rank, // BM25 est négatif, on l'inverse
          });
        }
      }
    }

    return Array.from(auditMap.values());
  }

  /**
   * Recherche Vector (cosine)
   */
  private async searchVector(query: string, limit: number): Promise<AuditSearchResult[]> {
    const embeddings = await this.vectorStore.search(query, limit);

    // Grouper par audit_id
    const auditMap = new Map<number, AuditSearchResult>();

    for (const embedding of embeddings) {
      const auditId = embedding.metadata.auditId;
      if (!auditMap.has(auditId)) {
        const audit = this.repo.findById(auditId);
        if (audit) {
          auditMap.set(auditId, {
            audit,
            score: embedding.score,
          });
        }
      }
    }

    return Array.from(auditMap.values());
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   */
  private reciprocalRankFusion(
    ftsResults: AuditSearchResult[],
    vectorResults: AuditSearchResult[],
    k: number
  ): AuditSearchResult[] {
    const scores = new Map<number, number>();

    // FTS5
    ftsResults.forEach((result, index) => {
      const auditId = result.audit.metadata.id!;
      const rank = index + 1;
      const score = 1 / (k + rank);
      scores.set(auditId, (scores.get(auditId) || 0) + score);
    });

    // Vector
    vectorResults.forEach((result, index) => {
      const auditId = result.audit.metadata.id!;
      const rank = index + 1;
      const score = 1 / (k + rank);
      scores.set(auditId, (scores.get(auditId) || 0) + score);
    });

    // Trier par score RRF
    const sortedAuditIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // Reconstruire les résultats
    return sortedAuditIds.map(auditId => {
      const audit = this.repo.findById(auditId);
      return {
        audit: audit!,
        score: scores.get(auditId)!,
      };
    });
  }

  /**
   * Applique les filtres
   */
  private applyFilters(
    results: AuditSearchResult[],
    filters: {
      scoreMin?: number;
      scoreMax?: number;
      dimension?: string;
      priority?: string;
    }
  ): AuditSearchResult[] {
    return results.filter(result => {
      const { audit } = result;

      // Filtre score
      if (filters.scoreMin !== undefined && audit.metadata.overallScore < filters.scoreMin) {
        return false;
      }
      if (filters.scoreMax !== undefined && audit.metadata.overallScore > filters.scoreMax) {
        return false;
      }

      // Filtre dimension
      if (filters.dimension) {
        const hasDimension = audit.dimensions.some(d => d.dimension === filters.dimension);
        if (!hasDimension) return false;
      }

      // Filtre priorité
      if (filters.priority) {
        const hasPriority = audit.findings.some(f => f.priority === filters.priority);
        if (!hasPriority) return false;
      }

      return true;
    });
  }

  /**
   * Recherche par score
   */
  findByScoreRange(min: number, max: number): Audit[] {
    const metadataList = this.db.prepare(`
      SELECT * FROM audit_metadata 
      WHERE overall_score BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `).all(min, max) as any[];

    return metadataList.map(m => this.repo.findById(m.id)!);
  }

  /**
   * Recherche par dimension
   */
  findByDimension(dimension: string): Audit[] {
    const auditIds = this.db.prepare(`
      SELECT DISTINCT audit_id FROM audit_dimensions 
      WHERE dimension = ?
    `).all(dimension) as any[];

    return auditIds.map(({ audit_id }) => this.repo.findById(audit_id)!);
  }

  /**
   * Recherche par priorité
   */
  findByPriority(priority: string): Audit[] {
    const auditIds = this.db.prepare(`
      SELECT DISTINCT audit_id FROM audit_findings 
      WHERE priority = ?
    `).all(priority) as any[];

    return auditIds.map(({ audit_id }) => this.repo.findById(audit_id)!);
  }

  /**
   * Trouve les top N findings
   */
  findTopIssues(limit = 10): Array<{ finding: any; count: number }> {
    const findings = this.db.prepare(`
      SELECT 
        title,
        dimension,
        severity,
        priority,
        COUNT(*) as count
      FROM audit_findings
      GROUP BY title, dimension, severity, priority
      ORDER BY count DESC, severity DESC
      LIMIT ?
    `).all(limit) as any[];

    return findings;
  }
}
```

**Tests :** `tests/storage/audit-search.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditSchema } from '../../src/storage/audit-schema';
import { AuditRepository } from '../../src/storage/audit-repository';
import { AuditIndexer } from '../../src/storage/audit-indexing';
import { AuditSearch } from '../../src/storage/audit-search';
import { VectorStore } from '../../src/storage/vector-store';
import { AnalysisReport } from '../../src/analysis/types';

describe('AuditSearch', () => {
  let db: Database.Database;
  let schema: AuditSchema;
  let repo: AuditRepository;
  let vectorStore: VectorStore;
  let indexer: AuditIndexer;
  let search: AuditSearch;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
    schema.createSchema();
    repo = new AuditRepository(db);
    vectorStore = new VectorStore(db);
    indexer = new AuditIndexer(db, vectorStore);
    search = new AuditSearch(db, repo, vectorStore);
  });

  afterEach(() => {
    db.close();
  });

  const createMockReport = (url: string, score: number): AnalysisReport => ({
    url,
    timestamp: new Date().toISOString(),
    dimensions: {
      performance: { score: score, findings: [], summary: { good: 2, needsImprovement: 1, poor: 1 } },
      accessibility: { score: score, findings: [], summary: { violations: 5, passes: 20, incomplete: 2 } },
      seo: { score: score, findings: [], summary: { passed: 10, failed: 2, warnings: 3 } },
      ux: { score: score, findings: [], summary: { passed: 5, failed: 5 } },
      content: { score: score, findings: [], summary: { good: 3, needsImprovement: 2, poor: 1 } },
    },
    findings: [
      {
        id: 'f1',
        dimension: 'performance',
        title: 'LCP trop élevé',
        description: 'Le LCP est de 4.5s',
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation: 'Optimiser les images',
        references: [],
      },
    ],
    priorityFindings: [],
    summary: {
      totalFindings: 1,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      overallScore: score,
    },
  });

  describe('search', () => {
    it('should search audits with query', async () => {
      const report = createMockReport('https://example.com', 70);
      const audit = repo.store(report);
      await indexer.indexAudit(audit);

      const results = await search.search({ query: 'LCP' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].audit.metadata.url).toBe('https://example.com');
    });

    it('should search without query (list all)', async () => {
      const report1 = createMockReport('https://example.com', 70);
      const report2 = createMockReport('https://test.com', 80);
      repo.store(report1);
      repo.store(report2);

      const results = await search.search({});

      expect(results.length).toBe(2);
    });

    it('should apply score filter', async () => {
      const report1 = createMockReport('https://example.com', 70);
      const report2 = createMockReport('https://test.com', 80);
      repo.store(report1);
      repo.store(report2);

      const results = await search.search({ scoreMin: 75 });

      expect(results.length).toBe(1);
      expect(results[0].audit.metadata.overallScore).toBe(80);
    });

    it('should apply dimension filter', async () => {
      const report = createMockReport('https://example.com', 70);
      const audit = repo.store(report);

      const results = await search.search({ dimension: 'performance' });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should apply priority filter', async () => {
      const report = createMockReport('https://example.com', 70);
      const audit = repo.store(report);

      const results = await search.search({ priority: 'high' });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 10; i++) {
        const report = createMockReport(`https://example${i}.com`, 70);
        repo.store(report);
      }

      const results1 = await search.search({ offset: 0, limit: 5 });
      const results2 = await search.search({ offset: 5, limit: 5 });

      expect(results1.length).toBe(5);
      expect(results2.length).toBe(5);
    });
  });

  describe('findByScoreRange', () => {
    it('should find audits by score range', () => {
      const report1 = createMockReport('https://example.com', 70);
      const report2 = createMockReport('https://test.com', 80);
      repo.store(report1);
      repo.store(report2);

      const results = search.findByScoreRange(75, 85);

      expect(results.length).toBe(1);
      expect(results[0].metadata.overallScore).toBe(80);
    });
  });

  describe('findByDimension', () => {
    it('should find audits by dimension', () => {
      const report = createMockReport('https://example.com', 70);
      repo.store(report);

      const results = search.findByDimension('performance');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findByPriority', () => {
    it('should find audits by priority', () => {
      const report = createMockReport('https://example.com', 70);
      repo.store(report);

      const results = search.findByPriority('high');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findTopIssues', () => {
    it('should find top issues', () => {
      const report1 = createMockReport('https://example.com', 70);
      const report2 = createMockReport('https://test.com', 80);
      repo.store(report1);
      repo.store(report2);

      const topIssues = search.findTopIssues(10);

      expect(topIssues.length).toBeGreaterThan(0);
      expect(topIssues[0]).toHaveProperty('title');
      expect(topIssues[0]).toHaveProperty('count');
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/audit-search.test.ts
# ✅ 11 tests passent

npm run test:coverage -- tests/storage/audit-search.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/storage/audit-search.ts
git add tests/storage/audit-search.test.ts
git commit -m "feat(storage): implement AuditSearch with hybrid search (FTS5 + Vector + RRF)"
```

---

### 3.3 Vérifications finales Sprint 10-2 (Jour 3)

```bash
# 1. Tous les tests
npm test tests/storage/
# ✅ 42 tests passent (7 schema + 15 repo + 4 converter + 5 indexing + 11 search)

# 2. Couverture
npm run test:coverage -- tests/storage/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/storage/
# ✅ audit-types.ts, audit-schema.ts, audit-repository.ts, audit-converter.ts, audit-indexing.ts, audit-search.ts

ls -la tests/storage/
# ✅ 5 fichiers de tests

# 6. Test d'intégration basique
node -e "
const Database = require('better-sqlite3');
const { AuditSchema } = require('./dist/storage/audit-schema');
const { AuditRepository } = require('./dist/storage/audit-repository');
const { AuditIndexer } = require('./dist/storage/audit-indexing');
const { AuditSearch } = require('./dist/storage/audit-search');
const { VectorStore } = require('./dist/storage/vector-store');

const db = new Database(':memory:');
const schema = new AuditSchema(db);
schema.createSchema();

const repo = new AuditRepository(db);
const vectorStore = new VectorStore(db);
const indexer = new AuditIndexer(db, vectorStore);
const search = new AuditSearch(db, repo, vectorStore);

const report = {
  url: 'https://example.com',
  timestamp: new Date().toISOString(),
  dimensions: {
    performance: { score: 75, findings: [], summary: { good: 2, needsImprovement: 1, poor: 1 } },
    accessibility: { score: 70, findings: [], summary: { violations: 5, passes: 20, incomplete: 2 } },
    seo: { score: 80, findings: [], summary: { passed: 10, failed: 2, warnings: 3 } },
    ux: { score: 65, findings: [], summary: { passed: 5, failed: 5 } },
    content: { score: 60, findings: [], summary: { good: 3, needsImprovement: 2, poor: 1 } },
  },
  findings: [
    {
      id: 'f1',
      dimension: 'performance',
      title: 'LCP trop élevé',
      description: 'Le LCP est de 4.5s',
      severity: 3,
      effort: 2,
      impact: 4,
      priority: 'high',
      recommendation: 'Optimiser les images',
      references: [],
    },
  ],
  priorityFindings: [],
  summary: {
    totalFindings: 1,
    criticalFindings: 0,
    highFindings: 1,
    mediumFindings: 0,
    lowFindings: 0,
    overallScore: 70,
  },
};

(async () => {
  const audit = repo.store(report);
  console.log('Audit stored:', audit.metadata.id);

  await indexer.indexAudit(audit);
  console.log('Audit indexed');

  const results = await search.search({ query: 'LCP' });
  console.log('Search results:', results.length);

  const topIssues = search.findTopIssues(10);
  console.log('Top issues:', topIssues.length);
})();
"
# ✅ Flux complet fonctionne

# 7. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 8. Push
git push origin feat/sprint-10-2
```

**Point de contrôle Sprint 10-2 :**
- ✅ AuditIndexer implémenté (FTS5 + Vector)
- ✅ AuditSearch implémenté (recherche hybride)
- ✅ RRF (Reciprocal Rank Fusion) k=60
- ✅ Filtres (score, dimension, priorité)
- ✅ Tests unitaires > 80% couverture
- ✅ 16 tests passent (5 indexing + 11 search)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/storage/audit-indexing.ts` | 150 | Indexation FTS5 + Vector |
| `src/storage/audit-search.ts` | 280 | Recherche hybride |
| `tests/storage/audit-indexing.test.ts` | 120 | Tests indexation |
| `tests/storage/audit-search.test.ts` | 250 | Tests recherche |

**Total Sprint 10-2 :** ~800 lignes

---

## 5. Récapitulatif complet Sprint 10-2

| Tâche | Durée | Fichiers | Lignes |
|-------|-------|----------|--------|
| Indexation FTS5 + Vector | 4h | 2 | 270 |
| Recherche hybride | 6h | 2 | 530 |
| **Total** | **10h** | **4** | **800** |

---

## 6. Commits

```bash
git commit -m "feat(storage): implement AuditIndexer with FTS5 + Vector indexing"
git commit -m "feat(storage): implement AuditSearch with hybrid search (FTS5 + Vector + RRF)"
```

---

## 7. Transition vers Sprint 10-3

**Prérequis pour Sprint 10-3 :**
- ✅ Sprint 10-2 terminé avec succès
- ✅ Indexation FTS5 + Vector fonctionnelle
- ✅ Recherche hybride opérationnelle
- ✅ Filtres implémentés

**Sprint 10-3 — Statistiques + Tests + Docs (Semaine 20, Jours 8-10) :**
- 🎯 Statistiques (AVG, COUNT, TOP, Trend)
- 🎯 Tests d'intégration complets
- 🎯 Tests performance (10 000 audits)
- 🎯 Documentation STORAGE.md

---

**Fin du document Sprint 10-2**
