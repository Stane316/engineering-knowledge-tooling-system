# Sprint 10-3 — Statistiques + Tests + Documentation (Semaine 20, Jours 8-10)

**Durée :** 3 jours  
**Objectif :** Implémenter les statistiques, tests d'intégration et documentation  
**Dépendance :** Sprint 10-2 (Indexation + Recherche) ✅
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Contexte

Les **Sprints 10-1 et 10-2** ont implémenté :
- ✅ Types Audit (AuditMetadata, AuditDimension, AuditFinding)
- ✅ Schéma SQLite (3 tables + FTS5)
- ✅ AuditRepository (store, findById, findByUrl, list, delete)
- ✅ AuditConverter (AnalysisReport → Audit)
- ✅ AuditIndexer (FTS5 + Vector)
- ✅ AuditSearch (recherche hybride FTS5 + Vector + RRF)

Le **Sprint 10-3** finalise le stockage avec :
- 🎯 Statistiques (AVG, COUNT, TOP, Trend)
- 🎯 Tests d'intégration complets
- 🎯 Tests performance (10 000 audits)
- 🎯 Documentation STORAGE.md

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
│   │   ├── audit-indexing.ts           ✅ (Sprint 10-2)
│   │   ├── audit-search.ts             ✅ (Sprint 10-2)
│   │   └── audit-statistics.ts         (à créer)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 AuditStatistics (Jour 1 — 6h)

**Fichier :** `src/storage/audit-statistics.ts`

```typescript
import { Database } from 'better-sqlite3';

/**
 * Statistiques pour les audits
 */
export interface AuditStatistics {
  totalAudits: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
}

/**
 * Tendance des scores
 */
export interface ScoreTrend {
  date: string;
  averageScore: number;
  auditCount: number;
}

/**
 * Statistiques par dimension
 */
export interface DimensionStatistics {
  dimension: string;
  averageScore: number;
  minScore: number;
  maxScore: number;
  totalFindings: number;
}

/**
 * Finding le plus fréquent
 */
export interface TopIssue {
  title: string;
  dimension: string;
  severity: number;
  priority: string;
  count: number;
  percentage: number;
}

/**
 * Gestionnaire de statistiques d'audits
 */
export class AuditStatisticsManager {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Récupère les statistiques globales
   */
  getStatistics(): AuditStatistics {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalAudits,
        AVG(overall_score) as averageScore,
        MIN(overall_score) as minScore,
        MAX(overall_score) as maxScore,
        SUM(total_findings) as totalFindings,
        SUM(critical_findings) as criticalFindings,
        SUM(high_findings) as highFindings,
        SUM(medium_findings) as mediumFindings,
        SUM(low_findings) as lowFindings
      FROM audit_metadata
    `).get() as any;

    return {
      totalAudits: stats.totalAudits || 0,
      averageScore: Math.round(stats.averageScore || 0),
      minScore: stats.minScore || 0,
      maxScore: stats.maxScore || 0,
      totalFindings: stats.totalFindings || 0,
      criticalFindings: stats.criticalFindings || 0,
      highFindings: stats.highFindings || 0,
      mediumFindings: stats.mediumFindings || 0,
      lowFindings: stats.lowFindings || 0,
    };
  }

  /**
   * Récupère la tendance des scores (par jour/semaine/mois)
   */
  getTrend(period: 'day' | 'week' | 'month' = 'week', limit = 30): ScoreTrend[] {
    let groupBy: string;

    switch (period) {
      case 'day':
        groupBy = "DATE(timestamp)";
        break;
      case 'week':
        groupBy = "strftime('%Y-W%W', timestamp)";
        break;
      case 'month':
        groupBy = "strftime('%Y-%m', timestamp)";
        break;
    }

    const trends = this.db.prepare(`
      SELECT 
        ${groupBy} as date,
        AVG(overall_score) as averageScore,
        COUNT(*) as auditCount
      FROM audit_metadata
      GROUP BY ${groupBy}
      ORDER BY date DESC
      LIMIT ?
    `).all(limit) as any[];

    return trends.map(t => ({
      date: t.date,
      averageScore: Math.round(t.averageScore),
      auditCount: t.auditCount,
    }));
  }

  /**
   * Récupère les statistiques par dimension
   */
  getDimensionStatistics(): DimensionStatistics[] {
    const stats = this.db.prepare(`
      SELECT 
        dimension,
        AVG(score) as averageScore,
        MIN(score) as minScore,
        MAX(score) as maxScore,
        SUM(findings_count) as totalFindings
      FROM audit_dimensions
      GROUP BY dimension
    `).all() as any[];

    return stats.map(s => ({
      dimension: s.dimension,
      averageScore: Math.round(s.averageScore),
      minScore: s.minScore,
      maxScore: s.maxScore,
      totalFindings: s.totalFindings,
    }));
  }

  /**
   * Récupère les top N findings les plus fréquents
   */
  getTopIssues(limit = 10): TopIssue[] {
    const totalAudits = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_metadata
    `).get() as any;

    const issues = this.db.prepare(`
      SELECT 
        title,
        dimension,
        severity,
        priority,
        COUNT(DISTINCT audit_id) as count
      FROM audit_findings
      GROUP BY title, dimension, severity, priority
      ORDER BY count DESC, severity DESC
      LIMIT ?
    `).all(limit) as any[];

    return issues.map(i => ({
      title: i.title,
      dimension: i.dimension,
      severity: i.severity,
      priority: i.priority,
      count: i.count,
      percentage: totalAudits.count > 0 ? Math.round((i.count / totalAudits.count) * 100) : 0,
    }));
  }

  /**
   * Récupère les statistiques pour une URL spécifique
   */
  getStatisticsForUrl(url: string): AuditStatistics {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalAudits,
        AVG(overall_score) as averageScore,
        MIN(overall_score) as minScore,
        MAX(overall_score) as maxScore,
        SUM(total_findings) as totalFindings,
        SUM(critical_findings) as criticalFindings,
        SUM(high_findings) as highFindings,
        SUM(medium_findings) as mediumFindings,
        SUM(low_findings) as lowFindings
      FROM audit_metadata
      WHERE url = ?
    `).get(url) as any;

    return {
      totalAudits: stats.totalAudits || 0,
      averageScore: Math.round(stats.averageScore || 0),
      minScore: stats.minScore || 0,
      maxScore: stats.maxScore || 0,
      totalFindings: stats.totalFindings || 0,
      criticalFindings: stats.criticalFindings || 0,
      highFindings: stats.highFindings || 0,
      mediumFindings: stats.mediumFindings || 0,
      lowFindings: stats.lowFindings || 0,
    };
  }

  /**
   * Récupère la distribution des scores
   */
  getScoreDistribution(): Record<string, number> {
    const ranges = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ];

    const distribution: Record<string, number> = {};

    for (const range of ranges) {
      const count = this.db.prepare(`
        SELECT COUNT(*) as count FROM audit_metadata 
        WHERE overall_score BETWEEN ? AND ?
      `).get(range.min, range.max) as any;

      distribution[range.label] = count.count;
    }

    return distribution;
  }
}
```

**Tests :** `tests/storage/audit-statistics.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditSchema } from '../../src/storage/audit-schema';
import { AuditRepository } from '../../src/storage/audit-repository';
import { AuditStatisticsManager } from '../../src/storage/audit-statistics';
import { AnalysisReport } from '../../src/analysis/types';

describe('AuditStatisticsManager', () => {
  let db: Database.Database;
  let schema: AuditSchema;
  let repo: AuditRepository;
  let stats: AuditStatisticsManager;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
    schema.createSchema();
    repo = new AuditRepository(db);
    stats = new AuditStatisticsManager(db);
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

  describe('getStatistics', () => {
    it('should return global statistics', () => {
      repo.store(createMockReport('https://example.com', 70));
      repo.store(createMockReport('https://test.com', 80));
      repo.store(createMockReport('https://demo.com', 90));

      const statistics = stats.getStatistics();

      expect(statistics.totalAudits).toBe(3);
      expect(statistics.averageScore).toBe(80);
      expect(statistics.minScore).toBe(70);
      expect(statistics.maxScore).toBe(90);
      expect(statistics.totalFindings).toBe(3);
      expect(statistics.highFindings).toBe(3);
    });

    it('should return zeros if no audits', () => {
      const statistics = stats.getStatistics();

      expect(statistics.totalAudits).toBe(0);
      expect(statistics.averageScore).toBe(0);
    });
  });

  describe('getTrend', () => {
    it('should return score trend by week', () => {
      repo.store(createMockReport('https://example.com', 70));
      repo.store(createMockReport('https://test.com', 80));

      const trend = stats.getTrend('week', 10);

      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('averageScore');
      expect(trend[0]).toHaveProperty('auditCount');
    });

    it('should return score trend by day', () => {
      repo.store(createMockReport('https://example.com', 70));

      const trend = stats.getTrend('day', 10);

      expect(trend.length).toBeGreaterThan(0);
    });

    it('should return score trend by month', () => {
      repo.store(createMockReport('https://example.com', 70));

      const trend = stats.getTrend('month', 10);

      expect(trend.length).toBeGreaterThan(0);
    });
  });

  describe('getDimensionStatistics', () => {
    it('should return statistics by dimension', () => {
      repo.store(createMockReport('https://example.com', 70));

      const dimStats = stats.getDimensionStatistics();

      expect(dimStats.length).toBe(5);
      expect(dimStats[0]).toHaveProperty('dimension');
      expect(dimStats[0]).toHaveProperty('averageScore');
      expect(dimStats[0]).toHaveProperty('minScore');
      expect(dimStats[0]).toHaveProperty('maxScore');
      expect(dimStats[0]).toHaveProperty('totalFindings');
    });
  });

  describe('getTopIssues', () => {
    it('should return top issues', () => {
      repo.store(createMockReport('https://example.com', 70));
      repo.store(createMockReport('https://test.com', 80));

      const topIssues = stats.getTopIssues(10);

      expect(topIssues.length).toBeGreaterThan(0);
      expect(topIssues[0]).toHaveProperty('title');
      expect(topIssues[0]).toHaveProperty('count');
      expect(topIssues[0]).toHaveProperty('percentage');
    });

    it('should calculate percentage correctly', () => {
      repo.store(createMockReport('https://example.com', 70));
      repo.store(createMockReport('https://test.com', 80));

      const topIssues = stats.getTopIssues(10);

      expect(topIssues[0].percentage).toBe(100); // Les 2 audits ont le même finding
    });
  });

  describe('getStatisticsForUrl', () => {
    it('should return statistics for a specific URL', () => {
      repo.store(createMockReport('https://example.com', 70));
      repo.store(createMockReport('https://example.com', 80));
      repo.store(createMockReport('https://test.com', 90));

      const urlStats = stats.getStatisticsForUrl('https://example.com');

      expect(urlStats.totalAudits).toBe(2);
      expect(urlStats.averageScore).toBe(75);
      expect(urlStats.minScore).toBe(70);
      expect(urlStats.maxScore).toBe(80);
    });

    it('should return zeros for unknown URL', () => {
      const urlStats = stats.getStatisticsForUrl('https://unknown.com');

      expect(urlStats.totalAudits).toBe(0);
    });
  });

  describe('getScoreDistribution', () => {
    it('should return score distribution', () => {
      repo.store(createMockReport('https://example.com', 15));
      repo.store(createMockReport('https://test.com', 35));
      repo.store(createMockReport('https://demo.com', 55));
      repo.store(createMockReport('https://site.com', 75));
      repo.store(createMockReport('https://app.com', 95));

      const distribution = stats.getScoreDistribution();

      expect(distribution['0-20']).toBe(1);
      expect(distribution['21-40']).toBe(1);
      expect(distribution['41-60']).toBe(1);
      expect(distribution['61-80']).toBe(1);
      expect(distribution['81-100']).toBe(1);
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/audit-statistics.test.ts
# ✅ 11 tests passent

npm run test:coverage -- tests/storage/audit-statistics.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/storage/audit-statistics.ts
git add tests/storage/audit-statistics.test.ts
git commit -m "feat(storage): implement AuditStatisticsManager with statistics, trend, and top issues"
```

---

### 3.2 Tests d'intégration complets (Jour 2 — 4h)

**Fichier :** `tests/storage/integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditSchema } from '../../src/storage/audit-schema';
import { AuditRepository } from '../../src/storage/audit-repository';
import { AuditIndexer } from '../../src/storage/audit-indexing';
import { AuditSearch } from '../../src/storage/audit-search';
import { AuditStatisticsManager } from '../../src/storage/audit-statistics';
import { VectorStore } from '../../src/storage/vector-store';
import { AnalysisPipeline } from '../../src/analysis/pipeline';

describe('Storage Integration Tests', () => {
  let db: Database.Database;
  let schema: AuditSchema;
  let repo: AuditRepository;
  let vectorStore: VectorStore;
  let indexer: AuditIndexer;
  let search: AuditSearch;
  let statsManager: AuditStatisticsManager;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
    schema.createSchema();
    repo = new AuditRepository(db);
    vectorStore = new VectorStore(db);
    indexer = new AuditIndexer(db, vectorStore);
    search = new AuditSearch(db, repo, vectorStore);
    statsManager = new AuditStatisticsManager(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('Complete workflow', () => {
    it('should store, index, search, and get statistics', async () => {
      // 1. Créer un rapport d'analyse (Sprint 9)
      const pipeline = new AnalysisPipeline();
      
      const lighthouse = {
        performance: { score: 75, metrics: { lcp: 3000, fid: 150, cls: 0.15, ttfb: 1000 } },
        seo: { score: 80, issues: [{ title: 'Meta description', description: 'Missing', severity: 'error' }] },
      };
      const axe = {
        violations: [{ id: 'contrast', impact: 'serious', description: 'Contrast', help: 'Fix', helpUrl: 'https://example.com', nodes: 5 }],
        score: 70,
      };
      const ux = {
        score: 65,
        heuristics: [{ id: 'visibility', name: 'Visibility', score: 50, issues: ['No loading'] }],
      };
      const content = {
        score: 60,
        metrics: { wordCount: 400, readingTime: 2, readabilityScore: 55 },
      };

      const report = await pipeline.analyze('https://example.com', lighthouse, axe, ux, content);

      // 2. Stocker l'audit (Sprint 10-1)
      const audit = repo.store(report);
      expect(audit.metadata.id).toBeDefined();
      expect(audit.metadata.url).toBe('https://example.com');

      // 3. Indexer l'audit (Sprint 10-2)
      await indexer.indexAudit(audit);

      // 4. Rechercher l'audit (Sprint 10-2)
      const results = await search.search({ query: 'performance' });
      expect(results.length).toBeGreaterThan(0);

      // 5. Obtenir les statistiques (Sprint 10-3)
      const statistics = statsManager.getStatistics();
      expect(statistics.totalAudits).toBe(1);
      expect(statistics.averageScore).toBeGreaterThan(0);

      // 6. Obtenir la tendance
      const trend = statsManager.getTrend('week');
      expect(trend.length).toBeGreaterThan(0);

      // 7. Obtenir les top issues
      const topIssues = statsManager.getTopIssues(10);
      expect(topIssues.length).toBeGreaterThan(0);
    });

    it('should handle multiple audits for same URL', async () => {
      const pipeline = new AnalysisPipeline();
      
      const lighthouse1 = {
        performance: { score: 70, metrics: { lcp: 3000, fid: 150, cls: 0.15, ttfb: 1000 } },
        seo: { score: 75, issues: [] },
      };
      const axe1 = { violations: [], score: 65 };
      const ux1 = { score: 60, heuristics: [] };
      const content1 = { score: 55, metrics: { wordCount: 400, readingTime: 2, readabilityScore: 55 } };

      const report1 = await pipeline.analyze('https://example.com', lighthouse1, axe1, ux1, content1);
      const audit1 = repo.store(report1);
      await indexer.indexAudit(audit1);

      const lighthouse2 = {
        performance: { score: 80, metrics: { lcp: 2000, fid: 100, cls: 0.1, ttfb: 800 } },
        seo: { score: 85, issues: [] },
      };
      const axe2 = { violations: [], score: 75 };
      const ux2 = { score: 70, heuristics: [] };
      const content2 = { score: 65, metrics: { wordCount: 500, readingTime: 3, readabilityScore: 60 } };

      const report2 = await pipeline.analyze('https://example.com', lighthouse2, axe2, ux2, content2);
      const audit2 = repo.store(report2);
      await indexer.indexAudit(audit2);

      // Vérifier que les 2 audits sont stockés
      const audits = repo.findByUrl('https://example.com');
      expect(audits.length).toBe(2);

      // Vérifier les statistiques
      const urlStats = statsManager.getStatisticsForUrl('https://example.com');
      expect(urlStats.totalAudits).toBe(2);
      expect(urlStats.averageScore).toBeGreaterThan(70);
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/integration.test.ts
# ✅ 2 tests d'intégration passent
```

**Commit :**
```bash
git add tests/storage/integration.test.ts
git commit -m "test(storage): add integration tests for complete workflow"
```

---

### 3.3 Tests performance (Jour 2 — 2h)

**Fichier :** `scripts/test-storage-performance.ts`

```typescript
import Database from 'better-sqlite3';
import { AuditSchema } from '../src/storage/audit-schema';
import { AuditRepository } from '../src/storage/audit-repository';
import { AuditIndexer } from '../src/storage/audit-indexing';
import { AuditSearch } from '../src/storage/audit-search';
import { VectorStore } from '../src/storage/vector-store';
import { AuditStatisticsManager } from '../src/storage/audit-statistics';
import { AnalysisReport } from '../src/analysis/types';

const createMockReport = (index: number): AnalysisReport => ({
  url: `https://example${index}.com`,
  timestamp: new Date().toISOString(),
  dimensions: {
    performance: { score: 70 + (index % 30), findings: [], summary: { good: 2, needsImprovement: 1, poor: 1 } },
    accessibility: { score: 65 + (index % 30), findings: [], summary: { violations: 5, passes: 20, incomplete: 2 } },
    seo: { score: 75 + (index % 20), findings: [], summary: { passed: 10, failed: 2, warnings: 3 } },
    ux: { score: 60 + (index % 35), findings: [], summary: { passed: 5, failed: 5 } },
    content: { score: 55 + (index % 40), findings: [], summary: { good: 3, needsImprovement: 2, poor: 1 } },
  },
  findings: [
    {
      id: `f${index}`,
      dimension: 'performance',
      title: `Performance issue ${index}`,
      description: `Description ${index}`,
      severity: 3,
      effort: 2,
      impact: 4,
      priority: 'high',
      recommendation: 'Fix it',
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
    overallScore: 70 + (index % 30),
  },
});

async function testPerformance() {
  console.log('🚀 Test de performance : 10 000 audits\n');

  const db = new Database(':memory:');
  const schema = new AuditSchema(db);
  schema.createSchema();

  const repo = new AuditRepository(db);
  const vectorStore = new VectorStore(db);
  const indexer = new AuditIndexer(db, vectorStore);
  const search = new AuditSearch(db, repo, vectorStore);
  const statsManager = new AuditStatisticsManager(db);

  // 1. Test stockage
  console.log('📦 Test stockage...');
  const startStore = Date.now();
  
  for (let i = 0; i < 10000; i++) {
    const report = createMockReport(i);
    repo.store(report);
    
    if ((i + 1) % 1000 === 0) {
      const elapsed = Date.now() - startStore;
      const avgMs = elapsed / (i + 1);
      console.log(`  ${i + 1} audits stockés (${avgMs.toFixed(2)}ms/audit)`);
    }
  }

  const totalStoreTime = Date.now() - startStore;
  const avgStoreTime = totalStoreTime / 10000;
  console.log(`✅ Stockage : ${totalStoreTime}ms total, ${avgStoreTime.toFixed(2)}ms/audit\n`);

  if (avgStoreTime > 100) {
    console.warn(`⚠️  Alerte : Stockage > 100ms/audit (${avgStoreTime.toFixed(2)}ms)`);
  }

  // 2. Test indexation
  console.log('🔍 Test indexation...');
  const startIndex = Date.now();
  
  const audits = repo.list(0, 10000);
  for (let i = 0; i < audits.length; i++) {
    await indexer.indexAudit(audits[i]);
    
    if ((i + 1) % 1000 === 0) {
      const elapsed = Date.now() - startIndex;
      const avgMs = elapsed / (i + 1);
      console.log(`  ${i + 1} audits indexés (${avgMs.toFixed(2)}ms/audit)`);
    }
  }

  const totalIndexTime = Date.now() - startIndex;
  const avgIndexTime = totalIndexTime / 10000;
  console.log(`✅ Indexation : ${totalIndexTime}ms total, ${avgIndexTime.toFixed(2)}ms/audit\n`);

  if (avgIndexTime > 500) {
    console.warn(`⚠️  Alerte : Indexation > 500ms/audit (${avgIndexTime.toFixed(2)}ms)`);
  }

  // 3. Test recherche
  console.log('🔎 Test recherche...');
  const startSearch = Date.now();
  
  for (let i = 0; i < 100; i++) {
    await search.search({ query: 'performance' });
  }

  const totalSearchTime = Date.now() - startSearch;
  const avgSearchTime = totalSearchTime / 100;
  console.log(`✅ Recherche : ${totalSearchTime}ms total, ${avgSearchTime.toFixed(2)}ms/recherche\n`);

  if (avgSearchTime > 100) {
    console.warn(`⚠️  Alerte : Recherche > 100ms (${avgSearchTime.toFixed(2)}ms)`);
  }

  // 4. Test statistiques
  console.log('📊 Test statistiques...');
  const startStats = Date.now();
  
  const statistics = statsManager.getStatistics();
  const trend = statsManager.getTrend('week');
  const dimStats = statsManager.getDimensionStatistics();
  const topIssues = statsManager.getTopIssues(10);

  const totalStatsTime = Date.now() - startStats;
  console.log(`✅ Statistiques : ${totalStatsTime}ms`);
  console.log(`  - Total audits : ${statistics.totalAudits}`);
  console.log(`  - Score moyen : ${statistics.averageScore}`);
  console.log(`  - Top issues : ${topIssues.length}\n`);

  // 5. Résumé
  console.log('📋 Résumé :');
  console.log(`  - Stockage : ${avgStoreTime.toFixed(2)}ms/audit (objectif < 100ms)`);
  console.log(`  - Indexation : ${avgIndexTime.toFixed(2)}ms/audit (objectif < 500ms)`);
  console.log(`  - Recherche : ${avgSearchTime.toFixed(2)}ms (objectif < 100ms)`);
  console.log(`  - Statistiques : ${totalStatsTime}ms`);
  console.log(`\n✅ Test terminé avec succès !`);

  db.close();
}

testPerformance().catch(console.error);
```

**Exécution :**
```bash
npm run build
node dist/scripts/test-storage-performance.js

# ✅ Résultats attendus :
# - Stockage : < 100ms/audit
# - Indexation : < 500ms/audit
# - Recherche : < 100ms
# - Statistiques : < 1s
```

**Commit :**
```bash
git add scripts/test-storage-performance.ts
git commit -m "perf(storage): add performance test script for 10 000 audits"
```

---

### 3.4 Documentation STORAGE.md (Jour 3 — 4h)

**Fichier :** `docs/STORAGE.md`

```markdown
# Stockage et Indexation — Documentation

## Vue d'ensemble

Le module de stockage EKTS permet de :
- Stocker les rapports d'analyse (AnalysisReport)
- Indexer pour recherche (FTS5 + Vector)
- Rechercher de manière hybride (BM25 + cosine + RRF)
- Générer des statistiques (AVG, COUNT, TOP, Trend)

## Architecture

```
AnalysisReport (Sprint 9)
    ↓
[AuditRepository.store()]
    ↓
1. audit_metadata (INSERT)
2. audit_dimensions (INSERT x5)
3. audit_findings (INSERT xN)
    ↓
[AuditIndexer.indexAudit()]
    ↓
1. audit_fts (INSERT)
2. VectorStore (addEmbeddings)
    ↓
✅ Audit stocké + indexé
    ↓
[AuditSearch.search()]
    ↓
1. FTS5.search() → BM25 results
2. VectorStore.search() → cosine results
3. RRF.merge() → hybrid results
    ↓
✅ AuditSearchResults
    ↓
[AuditStatisticsManager.getStatistics()]
    ↓
1. AVG, COUNT, TOP
2. Trend (score par date)
    ↓
✅ Statistics
```

## Schéma SQLite

### Tables

```sql
-- Métadonnées audit
CREATE TABLE audit_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  total_findings INTEGER NOT NULL,
  critical_findings INTEGER NOT NULL,
  high_findings INTEGER NOT NULL,
  medium_findings INTEGER NOT NULL,
  low_findings INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Scores par dimension
CREATE TABLE audit_dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  dimension TEXT NOT NULL,
  score INTEGER NOT NULL,
  findings_count INTEGER NOT NULL,
  FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
);

-- Findings individuels
CREATE TABLE audit_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL,
  dimension TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity INTEGER NOT NULL,
  effort INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  priority TEXT NOT NULL,
  recommendation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
);

-- Index FTS5 pour recherche plein texte
CREATE VIRTUAL TABLE audit_fts USING fts5(
  url,
  title,
  description,
  content='audit_findings',
  content_rowid='id'
);
```

## Utilisation

### Stocker un audit

```typescript
import { AuditRepository } from './storage/audit-repository';
import { AuditIndexer } from './storage/audit-indexing';
import { VectorStore } from './storage/vector-store';

const repo = new AuditRepository(db);
const vectorStore = new VectorStore(db);
const indexer = new AuditIndexer(db, vectorStore);

// Stocker
const audit = repo.store(report);

// Indexer
await indexer.indexAudit(audit);
```

### Rechercher des audits

```typescript
import { AuditSearch } from './storage/audit-search';

const search = new AuditSearch(db, repo, vectorStore);

// Recherche hybride
const results = await search.search({
  query: 'performance issues',
  scoreMin: 70,
  dimension: 'performance',
  priority: 'high',
  offset: 0,
  limit: 100,
});
```

### Obtenir des statistiques

```typescript
import { AuditStatisticsManager } from './storage/audit-statistics';

const statsManager = new AuditStatisticsManager(db);

// Statistiques globales
const stats = statsManager.getStatistics();
console.log('Total audits:', stats.totalAudits);
console.log('Score moyen:', stats.averageScore);

// Tendance
const trend = statsManager.getTrend('week', 30);

// Top issues
const topIssues = statsManager.getTopIssues(10);

// Statistiques par dimension
const dimStats = statsManager.getDimensionStatistics();
```

## Recherche hybride

### Algorithme

1. **FTS5 (BM25)** : Recherche plein texte (URL, titre, description)
2. **Vector (cosine)** : Recherche sémantique (embeddings)
3. **RRF (Reciprocal Rank Fusion)** : Fusion des résultats avec k=60

### Formule RRF

```
score(audit) = Σ 1 / (k + rank_i)
```

Où :
- k = 60 (constante)
- rank_i = position dans la liste i (FTS5 ou Vector)

### Exemple

```typescript
const results = await search.search({
  query: 'LCP trop élevé',
  scoreMin: 60,
  scoreMax: 90,
  dimension: 'performance',
  priority: 'critical',
  offset: 0,
  limit: 20,
});
```

## Performance

### Objectifs

- **Stockage** : < 100ms par audit
- **Indexation** : < 500ms par audit
- **Recherche** : < 100ms
- **Statistiques** : < 1s

### Optimisations

- Transactions (BEGIN/COMMIT)
- Batch INSERT (findings)
- Index sur audit_id (JOIN rapide)
- Pagination (LIMIT/OFFSET)
- FTS5 (recherche plein texte optimisée)
- Vector (recherche sémantique rapide)

### Tests performance

```bash
npm run build
node dist/scripts/test-storage-performance.js

# Résultats attendus :
# - Stockage : < 100ms/audit
# - Indexation : < 500ms/audit
# - Recherche : < 100ms
# - Support : 10 000 audits
```

## Types

### AuditMetadata

```typescript
interface AuditMetadata {
  id?: number;
  url: string;
  timestamp: string;
  overallScore: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  createdAt?: string;
}
```

### AuditDimension

```typescript
interface AuditDimension {
  id?: number;
  auditId: number;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  score: number;
  findingsCount: number;
}
```

### AuditFinding

```typescript
interface AuditFinding {
  id?: number;
  auditId: number;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  title: string;
  description?: string;
  severity: number;
  effort: number;
  impact: number;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendation?: string;
  createdAt?: string;
}
```

## Références

- [SQLite FTS5](https://www.sqlite.org/fts5.html)
- [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [BM25](https://en.wikipedia.org/wiki/Okapi_BM25)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
```

**Validation :**
```bash
ls -la docs/STORAGE.md
# ✅ Documentation créée

cat docs/STORAGE.md | wc -l
# ✅ ~400 lignes
```

**Commit :**
```bash
git add docs/STORAGE.md
git commit -m "docs: add comprehensive Storage documentation"
```

---

### 3.5 Mise à jour DOCS.md (Jour 3 — 2h)

**Fichier :** `docs/DOCS.md` (ajout section)

```markdown
## Module Audit

### AuditRepository

Stocke et récupère les audits.

```typescript
const repo = new AuditRepository(db);
const audit = repo.store(report);
const found = repo.findById(id);
const audits = repo.findByUrl(url);
const list = repo.list(offset, limit);
repo.delete(id);
```

### AuditIndexer

Indexe les audits pour recherche.

```typescript
const indexer = new AuditIndexer(db, vectorStore);
await indexer.indexAudit(audit);
await indexer.deindexAudit(auditId);
```

### AuditSearch

Recherche hybride (FTS5 + Vector + RRF).

```typescript
const search = new AuditSearch(db, repo, vectorStore);
const results = await search.search({
  query: 'performance',
  scoreMin: 70,
  dimension: 'performance',
  priority: 'high',
});
```

### AuditStatisticsManager

Génère des statistiques.

```typescript
const statsManager = new AuditStatisticsManager(db);
const stats = statsManager.getStatistics();
const trend = statsManager.getTrend('week');
const topIssues = statsManager.getTopIssues(10);
```
```

**Commit :**
```bash
git add docs/DOCS.md
git commit -m "docs: update DOCS.md with Audit module documentation"
```

---

### 3.6 Vérifications finales Sprint 10-3 (Jour 3)

```bash
# 1. Tous les tests
npm test tests/storage/
# ✅ 54 tests passent (7 schema + 15 repo + 4 converter + 5 indexing + 11 search + 11 stats + 1 integration)

# 2. Couverture
npm run test:coverage -- tests/storage/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Tests performance
node dist/scripts/test-storage-performance.js
# ✅ 10 000 audits OK
# - Stockage : < 100ms/audit
# - Indexation : < 500ms/audit
# - Recherche : < 100ms

# 6. Vérification fichiers
ls -la src/storage/
# ✅ 11 fichiers (types, schema, repo, converter, indexing, search, stats, + 4 anciens)

ls -la tests/storage/
# ✅ 6 fichiers de tests

ls -la docs/STORAGE.md
# ✅ Documentation existe

# 7. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 8. Push
git push origin feat/sprint-10-3
```

**Point de contrôle Sprint 10-3 :**
- ✅ AuditStatisticsManager implémenté (stats, trend, top issues)
- ✅ Tests d'intégration complets
- ✅ Tests performance (10 000 audits)
- ✅ Documentation STORAGE.md complète
- ✅ DOCS.md mise à jour
- ✅ Tests unitaires > 80% couverture
- ✅ 54 tests passent

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/storage/audit-statistics.ts` | 200 | Statistiques |
| `tests/storage/audit-statistics.test.ts` | 130 | Tests statistiques |
| `tests/storage/integration.test.ts` | 100 | Tests d'intégration |
| `scripts/test-storage-performance.ts` | 150 | Tests performance |
| `docs/STORAGE.md` | 400 | Documentation complète |

**Total Sprint 10-3 :** ~980 lignes

---

## 5. Récapitulatif complet Sprint 10

| Sous-sprint | Durée | Fichiers | Lignes |
|-------------|-------|----------|--------|
| Sprint 10-1 | 4 jours | 7 | 930 |
| Sprint 10-2 | 3 jours | 4 | 800 |
| Sprint 10-3 | 3 jours | 5 | 980 |
| **Total** | **10 jours** | **16 fichiers** | **~2 710** |

---

## 6. Commits

```bash
git commit -m "feat(storage): implement AuditStatisticsManager with statistics, trend, and top issues"
git commit -m "test(storage): add integration tests for complete workflow"
git commit -m "perf(storage): add performance test script for 10 000 audits"
git commit -m "docs: add comprehensive Storage documentation"
git commit -m "docs: update DOCS.md with Audit module documentation"
```

---

## 7. Transition vers Sprint 11

**Prérequis pour Sprint 11 :**
- ✅ Sprint 10 terminé avec succès
- ✅ Audits stockés en base
- ✅ Recherche hybride fonctionnelle
- ✅ Statistiques disponibles

**Sprint 11 — Rapport Inspection (MVP-2) :**
- 🎯 Générer rapport PDF/Markdown
- 🎯 Comparer audits (avant/après)
- 🎯 CLI `ekts inspect` (lancer inspection)
- 🎯 CLI `ekts audit` (lister audits)
- 🎯 MCP `inspect_site` (inspection via MCP)
- 🎯 MCP `audit_history` (historique audits)

---

**Fin du document Sprint 10-3**
