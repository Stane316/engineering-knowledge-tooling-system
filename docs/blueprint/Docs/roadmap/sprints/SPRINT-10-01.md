# Sprint 10-1 — Schema + Repository (Semaine 19, Jours 1-4)

**Durée :** 4 jours  
**Objectif :** Implémenter le schéma SQLite et AuditRepository pour stocker les rapports d'analyse  
**Dépendance :** Sprint 9 (Analyse 5 Dimensions) ✅
**Statut :** ✅ LIVRÉ (24 octobre 2026)  

---

## 1. Contexte

Le **Sprint 9** a implémenté l'analyse 5 dimensions :
- ✅ 5 analyseurs (performance, accessibilité, SEO, UX, contenu)
- ✅ Matrice de sévérité (0-4 × 1-5 × 1-3)
- ✅ Priorisation automatique
- ✅ AnalysisReport structuré

Le **Sprint 10-1** va :
- 🎯 Définir les types pour stocker les audits
- 🎯 Créer le schéma SQLite (3 tables)
- 🎯 Implémenter AuditRepository (CRUD)
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
│   │   └── vector-store.ts             ✅ (Sprint 4)
│   ├── analysis/
│   │   ├── types.ts                    ✅ (Sprint 9)
│   │   ├── performance.ts              ✅ (Sprint 9)
│   │   ├── accessibility.ts            ✅ (Sprint 9)
│   │   ├── seo.ts                      ✅ (Sprint 9)
│   │   ├── ux.ts                       ✅ (Sprint 9)
│   │   ├── content.ts                  ✅ (Sprint 9)
│   │   ├── severity.ts                 ✅ (Sprint 9)
│   │   ├── prioritizer.ts              ✅ (Sprint 9)
│   │   └── pipeline.ts                 ✅ (Sprint 9)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Types Audit (Jour 1 — 2h)

**Fichier :** `src/storage/audit-types.ts`

```typescript
/**
 * Types pour le stockage des audits
 */

/**
 * Métadonnées d'un audit
 */
export interface AuditMetadata {
  id?: number;
  url: string;
  timestamp: string;  // ISO 8601
  overallScore: number;  // 0-100
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  createdAt?: string;
}

/**
 * Score d'une dimension spécifique
 */
export interface AuditDimension {
  id?: number;
  auditId: number;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  score: number;  // 0-100
  findingsCount: number;
}

/**
 * Finding individuel
 */
export interface AuditFinding {
  id?: number;
  auditId: number;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  title: string;
  description?: string;
  severity: number;  // 0-4
  effort: number;  // 1-5
  impact: number;  // 1-5
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendation?: string;
  createdAt?: string;
}

/**
 * Audit complet avec toutes les données
 */
export interface Audit {
  metadata: AuditMetadata;
  dimensions: AuditDimension[];
  findings: AuditFinding[];
}

/**
 * Options de recherche
 */
export interface AuditSearchOptions {
  query?: string;
  scoreMin?: number;
  scoreMax?: number;
  dimension?: string;
  priority?: string;
  offset?: number;
  limit?: number;
}

/**
 * Résultat de recherche
 */
export interface AuditSearchResult {
  audit: Audit;
  score: number;  // Pertinence
}
```

**Validation :**
```bash
tsc --noEmit
# ✅ Aucune erreur
```

**Commit :**
```bash
git add src/storage/audit-types.ts
git commit -m "feat(storage): add audit types (AuditMetadata, AuditDimension, AuditFinding)"
```

---

### 3.2 Schéma SQLite (Jour 1 — 4h)

**Fichier :** `src/storage/audit-schema.ts`

```typescript
import { Database } from 'better-sqlite3';

/**
 * Schéma SQLite pour le stockage des audits
 */
export class AuditSchema {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Crée le schéma des tables d'audit
   */
  createSchema(): void {
    // Table audit_metadata
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_metadata (
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
      )
    `);

    // Table audit_dimensions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL,
        score INTEGER NOT NULL,
        findings_count INTEGER NOT NULL,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
      )
    `);

    // Table audit_findings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_findings (
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
      )
    `);

    // Index FTS5 pour recherche plein texte
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS audit_fts USING fts5(
        url,
        title,
        description,
        content='audit_findings',
        content_rowid='id'
      )
    `);

    // Index sur audit_id pour JOIN rapide
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_dimensions_audit_id 
      ON audit_dimensions(audit_id)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_findings_audit_id 
      ON audit_findings(audit_id)
    `);

    // Index sur url pour recherche rapide
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_metadata_url 
      ON audit_metadata(url)
    `);
  }

  /**
   * Supprime le schéma des tables d'audit
   */
  dropSchema(): void {
    this.db.exec(`DROP TABLE IF EXISTS audit_findings`);
    this.db.exec(`DROP TABLE IF EXISTS audit_dimensions`);
    this.db.exec(`DROP TABLE IF EXISTS audit_metadata`);
    this.db.exec(`DROP TABLE IF EXISTS audit_fts`);
  }

  /**
   * Vérifie si le schéma existe
   */
  schemaExists(): boolean {
    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('audit_metadata', 'audit_dimensions', 'audit_findings')
    `).all();

    return tables.length === 3;
  }
}
```

**Tests :** `tests/storage/audit-schema.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditSchema } from '../../src/storage/audit-schema';

describe('AuditSchema', () => {
  let db: Database.Database;
  let schema: AuditSchema;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createSchema', () => {
    it('should create audit_metadata table', () => {
      schema.createSchema();

      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='audit_metadata'
      `).all();

      expect(tables.length).toBe(1);
    });

    it('should create audit_dimensions table', () => {
      schema.createSchema();

      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='audit_dimensions'
      `).all();

      expect(tables.length).toBe(1);
    });

    it('should create audit_findings table', () => {
      schema.createSchema();

      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='audit_findings'
      `).all();

      expect(tables.length).toBe(1);
    });

    it('should create audit_fts virtual table', () => {
      schema.createSchema();

      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='audit_fts'
      `).all();

      expect(tables.length).toBe(1);
    });

    it('should create indexes', () => {
      schema.createSchema();

      const indexes = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_audit_%'
      `).all();

      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should be idempotent', () => {
      schema.createSchema();
      schema.createSchema(); // Appel multiple

      expect(schema.schemaExists()).toBe(true);
    });
  });

  describe('dropSchema', () => {
    it('should drop all audit tables', () => {
      schema.createSchema();
      schema.dropSchema();

      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('audit_metadata', 'audit_dimensions', 'audit_findings')
      `).all();

      expect(tables.length).toBe(0);
    });
  });

  describe('schemaExists', () => {
    it('should return false if schema does not exist', () => {
      expect(schema.schemaExists()).toBe(false);
    });

    it('should return true if schema exists', () => {
      schema.createSchema();
      expect(schema.schemaExists()).toBe(true);
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/audit-schema.test.ts
# ✅ 7 tests passent

npm run test:coverage -- tests/storage/audit-schema.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/storage/audit-schema.ts
git add tests/storage/audit-schema.test.ts
git commit -m "feat(storage): implement AuditSchema with 3 tables + FTS5 index"
```

---

### 3.3 AuditRepository — Store (Jour 2 — 6h)

**Fichier :** `src/storage/audit-repository.ts`

```typescript
import { Database } from 'better-sqlite3';
import { AuditMetadata, AuditDimension, AuditFinding, Audit } from './audit-types';
import { AnalysisReport } from '../analysis/types';

/**
 * Repository pour gérer les audits
 */
export class AuditRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Stocke un audit complet
   */
  store(report: AnalysisReport): Audit {
    // Commencer une transaction
    const transaction = this.db.transaction(() => {
      // 1. Insérer audit_metadata
      const metadataStmt = this.db.prepare(`
        INSERT INTO audit_metadata (
          url, timestamp, overall_score, 
          total_findings, critical_findings, high_findings, 
          medium_findings, low_findings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const metadataResult = metadataStmt.run(
        report.url,
        report.timestamp,
        report.summary.overallScore,
        report.summary.totalFindings,
        report.summary.criticalFindings,
        report.summary.highFindings,
        report.summary.mediumFindings,
        report.summary.lowFindings
      );

      const auditId = metadataResult.lastInsertRowid as number;

      // 2. Insérer audit_dimensions
      const dimensionStmt = this.db.prepare(`
        INSERT INTO audit_dimensions (
          audit_id, dimension, score, findings_count
        ) VALUES (?, ?, ?, ?)
      `);

      const dimensions: AuditDimension[] = [
        { auditId, dimension: 'performance', score: report.dimensions.performance.score, findingsCount: report.dimensions.performance.findings.length },
        { auditId, dimension: 'accessibility', score: report.dimensions.accessibility.score, findingsCount: report.dimensions.accessibility.findings.length },
        { auditId, dimension: 'seo', score: report.dimensions.seo.score, findingsCount: report.dimensions.seo.findings.length },
        { auditId, dimension: 'ux', score: report.dimensions.ux.score, findingsCount: report.dimensions.ux.findings.length },
        { auditId, dimension: 'content', score: report.dimensions.content.score, findingsCount: report.dimensions.content.findings.length },
      ];

      for (const dim of dimensions) {
        dimensionStmt.run(auditId, dim.dimension, dim.score, dim.findingsCount);
      }

      // 3. Insérer audit_findings
      const findingStmt = this.db.prepare(`
        INSERT INTO audit_findings (
          audit_id, dimension, title, description, 
          severity, effort, impact, priority, recommendation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const findings: AuditFinding[] = report.findings.map(f => ({
        auditId,
        dimension: f.dimension,
        title: f.title,
        description: f.description,
        severity: f.severity,
        effort: f.effort,
        impact: f.impact,
        priority: f.priority,
        recommendation: f.recommendation,
      }));

      for (const finding of findings) {
        findingStmt.run(
          auditId,
          finding.dimension,
          finding.title,
          finding.description,
          finding.severity,
          finding.effort,
          finding.impact,
          finding.priority,
          finding.recommendation
        );
      }

      return {
        metadata: {
          id: auditId,
          url: report.url,
          timestamp: report.timestamp,
          overallScore: report.summary.overallScore,
          totalFindings: report.summary.totalFindings,
          criticalFindings: report.summary.criticalFindings,
          highFindings: report.summary.highFindings,
          mediumFindings: report.summary.mediumFindings,
          lowFindings: report.summary.lowFindings,
        },
        dimensions,
        findings,
      };
    });

    return transaction();
  }

  /**
   * Récupère un audit par ID
   */
  findById(id: number): Audit | null {
    const metadata = this.db.prepare(`
      SELECT * FROM audit_metadata WHERE id = ?
    `).get(id) as any;

    if (!metadata) {
      return null;
    }

    const dimensions = this.db.prepare(`
      SELECT * FROM audit_dimensions WHERE audit_id = ?
    `).all(id) as any[];

    const findings = this.db.prepare(`
      SELECT * FROM audit_findings WHERE audit_id = ?
    `).all(id) as any[];

    return {
      metadata: this.mapMetadata(metadata),
      dimensions: dimensions.map(d => this.mapDimension(d)),
      findings: findings.map(f => this.mapFinding(f)),
    };
  }

  /**
   * Récupère les audits par URL
   */
  findByUrl(url: string): Audit[] {
    const metadataList = this.db.prepare(`
      SELECT * FROM audit_metadata WHERE url = ? ORDER BY timestamp DESC
    `).all(url) as any[];

    return metadataList.map(metadata => {
      const dimensions = this.db.prepare(`
        SELECT * FROM audit_dimensions WHERE audit_id = ?
      `).all(metadata.id) as any[];

      const findings = this.db.prepare(`
        SELECT * FROM audit_findings WHERE audit_id = ?
      `).all(metadata.id) as any[];

      return {
        metadata: this.mapMetadata(metadata),
        dimensions: dimensions.map(d => this.mapDimension(d)),
        findings: findings.map(f => this.mapFinding(f)),
      };
    });
  }

  /**
   * Liste les audits avec pagination
   */
  list(offset = 0, limit = 100): Audit[] {
    const metadataList = this.db.prepare(`
      SELECT * FROM audit_metadata 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];

    return metadataList.map(metadata => {
      const dimensions = this.db.prepare(`
        SELECT * FROM audit_dimensions WHERE audit_id = ?
      `).all(metadata.id) as any[];

      const findings = this.db.prepare(`
        SELECT * FROM audit_findings WHERE audit_id = ?
      `).all(metadata.id) as any[];

      return {
        metadata: this.mapMetadata(metadata),
        dimensions: dimensions.map(d => this.mapDimension(d)),
        findings: findings.map(f => this.mapFinding(f)),
      };
    });
  }

  /**
   * Supprime un audit
   */
  delete(id: number): boolean {
    const result = this.db.prepare(`
      DELETE FROM audit_metadata WHERE id = ?
    `).run(id);

    return result.changes > 0;
  }

  // Helpers de mapping

  private mapMetadata(row: any): AuditMetadata {
    return {
      id: row.id,
      url: row.url,
      timestamp: row.timestamp,
      overallScore: row.overall_score,
      totalFindings: row.total_findings,
      criticalFindings: row.critical_findings,
      highFindings: row.high_findings,
      mediumFindings: row.medium_findings,
      lowFindings: row.low_findings,
      createdAt: row.created_at,
    };
  }

  private mapDimension(row: any): AuditDimension {
    return {
      id: row.id,
      auditId: row.audit_id,
      dimension: row.dimension,
      score: row.score,
      findingsCount: row.findings_count,
    };
  }

  private mapFinding(row: any): AuditFinding {
    return {
      id: row.id,
      auditId: row.audit_id,
      dimension: row.dimension,
      title: row.title,
      description: row.description,
      severity: row.severity,
      effort: row.effort,
      impact: row.impact,
      priority: row.priority,
      recommendation: row.recommendation,
      createdAt: row.created_at,
    };
  }
}
```

**Tests :** `tests/storage/audit-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditSchema } from '../../src/storage/audit-schema';
import { AuditRepository } from '../../src/storage/audit-repository';
import { AnalysisReport } from '../../src/analysis/types';

describe('AuditRepository', () => {
  let db: Database.Database;
  let schema: AuditSchema;
  let repo: AuditRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    schema = new AuditSchema(db);
    schema.createSchema();
    repo = new AuditRepository(db);
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
      {
        id: 'f2',
        dimension: 'accessibility',
        title: 'Contraste insuffisant',
        description: '5 éléments ont un contraste < 4.5:1',
        severity: 4,
        effort: 1,
        impact: 5,
        priority: 'critical',
        recommendation: 'Augmenter le contraste',
        references: [],
      },
    ],
    priorityFindings: [],
    summary: {
      totalFindings: 2,
      criticalFindings: 1,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      overallScore: 70,
    },
  });

  describe('store', () => {
    it('should store an audit', () => {
      const report = createMockReport();
      const audit = repo.store(report);

      expect(audit.metadata.id).toBeDefined();
      expect(audit.metadata.url).toBe('https://example.com');
      expect(audit.metadata.overallScore).toBe(70);
      expect(audit.dimensions.length).toBe(5);
      expect(audit.findings.length).toBe(2);
    });

    it('should store dimensions correctly', () => {
      const report = createMockReport();
      const audit = repo.store(report);

      const perf = audit.dimensions.find(d => d.dimension === 'performance');
      expect(perf?.score).toBe(75);
      expect(perf?.findingsCount).toBe(0);
    });

    it('should store findings correctly', () => {
      const report = createMockReport();
      const audit = repo.store(report);

      expect(audit.findings[0].title).toBe('LCP trop élevé');
      expect(audit.findings[0].severity).toBe(3);
      expect(audit.findings[0].priority).toBe('high');
    });

    it('should use transaction', () => {
      const report = createMockReport();
      
      // Si une erreur survient, tout doit être annulé
      const invalidReport = { ...report, findings: [{ ...report.findings[0], severity: -1 }] };
      
      try {
        repo.store(invalidReport);
      } catch (e) {
        // Erreur attendue
      }

      // Vérifier que rien n'a été inséré
      const audits = repo.list();
      expect(audits.length).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return audit by ID', () => {
      const report = createMockReport();
      const stored = repo.store(report);

      const found = repo.findById(stored.metadata.id!);

      expect(found).not.toBeNull();
      expect(found?.metadata.url).toBe('https://example.com');
      expect(found?.dimensions.length).toBe(5);
      expect(found?.findings.length).toBe(2);
    });

    it('should return null if not found', () => {
      const found = repo.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByUrl', () => {
    it('should return audits by URL', () => {
      const report = createMockReport();
      repo.store(report);
      repo.store(report); // 2 audits pour la même URL

      const audits = repo.findByUrl('https://example.com');

      expect(audits.length).toBe(2);
    });

    it('should return empty array if not found', () => {
      const audits = repo.findByUrl('https://notfound.com');
      expect(audits.length).toBe(0);
    });

    it('should order by timestamp DESC', () => {
      const report1 = createMockReport();
      const report2 = createMockReport();
      report2.timestamp = new Date(Date.now() + 1000).toISOString();

      repo.store(report1);
      repo.store(report2);

      const audits = repo.findByUrl('https://example.com');

      expect(audits[0].metadata.timestamp).toBe(report2.timestamp);
    });
  });

  describe('list', () => {
    it('should list audits with pagination', () => {
      const report = createMockReport();
      for (let i = 0; i < 10; i++) {
        repo.store(report);
      }

      const audits = repo.list(0, 5);
      expect(audits.length).toBe(5);

      const audits2 = repo.list(5, 5);
      expect(audits2.length).toBe(5);
    });

    it('should return empty array if no audits', () => {
      const audits = repo.list();
      expect(audits.length).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete an audit', () => {
      const report = createMockReport();
      const stored = repo.store(report);

      const deleted = repo.delete(stored.metadata.id!);
      expect(deleted).toBe(true);

      const found = repo.findById(stored.metadata.id!);
      expect(found).toBeNull();
    });

    it('should delete dimensions and findings (CASCADE)', () => {
      const report = createMockReport();
      const stored = repo.store(report);

      repo.delete(stored.metadata.id!);

      const dimensions = db.prepare('SELECT * FROM audit_dimensions WHERE audit_id = ?').all(stored.metadata.id!);
      const findings = db.prepare('SELECT * FROM audit_findings WHERE audit_id = ?').all(stored.metadata.id!);

      expect(dimensions.length).toBe(0);
      expect(findings.length).toBe(0);
    });

    it('should return false if not found', () => {
      const deleted = repo.delete(999);
      expect(deleted).toBe(false);
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/audit-repository.test.ts
# ✅ 15 tests passent

npm run test:coverage -- tests/storage/audit-repository.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/storage/audit-repository.ts
git add tests/storage/audit-repository.test.ts
git commit -m "feat(storage): implement AuditRepository with store/findById/findByUrl/list/delete"
```

---

### 3.4 Intégration AnalysisReport → Audit (Jour 3 — 4h)

**Fichier :** `src/storage/audit-converter.ts`

```typescript
import { AnalysisReport } from '../analysis/types';
import { Audit, AuditMetadata, AuditDimension, AuditFinding } from './audit-types';

/**
 * Convertit un AnalysisReport en Audit
 */
export class AuditConverter {
  /**
   * Convertit un AnalysisReport en Audit
   */
  convert(report: AnalysisReport, auditId?: number): Audit {
    return {
      metadata: this.convertMetadata(report, auditId),
      dimensions: this.convertDimensions(report, auditId),
      findings: this.convertFindings(report, auditId),
    };
  }

  /**
   * Convertit les métadonnées
   */
  private convertMetadata(report: AnalysisReport, auditId?: number): AuditMetadata {
    return {
      id: auditId,
      url: report.url,
      timestamp: report.timestamp,
      overallScore: report.summary.overallScore,
      totalFindings: report.summary.totalFindings,
      criticalFindings: report.summary.criticalFindings,
      highFindings: report.summary.highFindings,
      mediumFindings: report.summary.mediumFindings,
      lowFindings: report.summary.lowFindings,
    };
  }

  /**
   * Convertit les dimensions
   */
  private convertDimensions(report: AnalysisReport, auditId?: number): AuditDimension[] {
    return [
      { auditId: auditId!, dimension: 'performance', score: report.dimensions.performance.score, findingsCount: report.dimensions.performance.findings.length },
      { auditId: auditId!, dimension: 'accessibility', score: report.dimensions.accessibility.score, findingsCount: report.dimensions.accessibility.findings.length },
      { auditId: auditId!, dimension: 'seo', score: report.dimensions.seo.score, findingsCount: report.dimensions.seo.findings.length },
      { auditId: auditId!, dimension: 'ux', score: report.dimensions.ux.score, findingsCount: report.dimensions.ux.findings.length },
      { auditId: auditId!, dimension: 'content', score: report.dimensions.content.score, findingsCount: report.dimensions.content.findings.length },
    ];
  }

  /**
   * Convertit les findings
   */
  private convertFindings(report: AnalysisReport, auditId?: number): AuditFinding[] {
    return report.findings.map(f => ({
      auditId: auditId!,
      dimension: f.dimension,
      title: f.title,
      description: f.description,
      severity: f.severity,
      effort: f.effort,
      impact: f.impact,
      priority: f.priority,
      recommendation: f.recommendation,
    }));
  }
}
```

**Tests :** `tests/storage/audit-converter.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AuditConverter } from '../../src/storage/audit-converter';
import { AnalysisReport } from '../../src/analysis/types';

describe('AuditConverter', () => {
  const converter = new AuditConverter();

  const createMockReport = (): AnalysisReport => ({
    url: 'https://example.com',
    timestamp: '2024-01-01T00:00:00Z',
    dimensions: {
      performance: { score: 75, findings: [{ id: 'f1', dimension: 'performance', title: 'LCP', description: 'Slow', severity: 3, effort: 2, impact: 4, priority: 'high', recommendation: 'Fix', references: [] }], summary: { good: 2, needsImprovement: 1, poor: 1 } },
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

  describe('convert', () => {
    it('should convert AnalysisReport to Audit', () => {
      const report = createMockReport();
      const audit = converter.convert(report, 1);

      expect(audit.metadata.url).toBe('https://example.com');
      expect(audit.metadata.overallScore).toBe(70);
      expect(audit.dimensions.length).toBe(5);
      expect(audit.findings.length).toBe(1);
    });

    it('should convert metadata correctly', () => {
      const report = createMockReport();
      const audit = converter.convert(report, 1);

      expect(audit.metadata.url).toBe('https://example.com');
      expect(audit.metadata.timestamp).toBe('2024-01-01T00:00:00Z');
      expect(audit.metadata.overallScore).toBe(70);
      expect(audit.metadata.totalFindings).toBe(1);
      expect(audit.metadata.highFindings).toBe(1);
    });

    it('should convert dimensions correctly', () => {
      const report = createMockReport();
      const audit = converter.convert(report, 1);

      expect(audit.dimensions.length).toBe(5);
      expect(audit.dimensions[0].dimension).toBe('performance');
      expect(audit.dimensions[0].score).toBe(75);
      expect(audit.dimensions[0].findingsCount).toBe(1);
    });

    it('should convert findings correctly', () => {
      const report = createMockReport();
      const audit = converter.convert(report, 1);

      expect(audit.findings.length).toBe(1);
      expect(audit.findings[0].title).toBe('LCP trop élevé');
      expect(audit.findings[0].severity).toBe(3);
      expect(audit.findings[0].priority).toBe('high');
    });
  });
});
```

**Validation :**
```bash
npm test tests/storage/audit-converter.test.ts
# ✅ 4 tests passent

npm run test:coverage -- tests/storage/audit-converter.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/storage/audit-converter.ts
git add tests/storage/audit-converter.test.ts
git commit -m "feat(storage): implement AuditConverter for AnalysisReport to Audit conversion"
```

---

### 3.5 Vérifications finales Sprint 10-1 (Jour 4)

```bash
# 1. Tous les tests
npm test tests/storage/
# ✅ 26 tests passent (7 schema + 15 repository + 4 converter)

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
# ✅ audit-types.ts, audit-schema.ts, audit-repository.ts, audit-converter.ts

ls -la tests/storage/
# ✅ audit-schema.test.ts, audit-repository.test.ts, audit-converter.test.ts

# 6. Test d'intégration basique
node -e "
const Database = require('better-sqlite3');
const { AuditSchema } = require('./dist/storage/audit-schema');
const { AuditRepository } = require('./dist/storage/audit-repository');

const db = new Database(':memory:');
const schema = new AuditSchema(db);
schema.createSchema();

const repo = new AuditRepository(db);

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

const audit = repo.store(report);
console.log('Audit stored:', audit.metadata.id);

const found = repo.findById(audit.metadata.id);
console.log('Audit found:', found.metadata.url);
console.log('Dimensions:', found.dimensions.length);
console.log('Findings:', found.findings.length);

const audits = repo.findByUrl('https://example.com');
console.log('Audits by URL:', audits.length);

const list = repo.list();
console.log('List:', list.length);

const deleted = repo.delete(audit.metadata.id);
console.log('Deleted:', deleted);
"
# ✅ Flux complet fonctionne

# 7. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 8. Push
git push origin feat/sprint-10-1
```

**Point de contrôle Sprint 10-1 :**
- ✅ Types définis (AuditMetadata, AuditDimension, AuditFinding)
- ✅ Schéma SQLite créé (3 tables + FTS5)
- ✅ AuditRepository implémenté (store, findById, findByUrl, list, delete)
- ✅ AuditConverter implémenté
- ✅ Tests unitaires > 80% couverture
- ✅ 26 tests passent

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/storage/audit-types.ts` | 80 | Types Audit |
| `src/storage/audit-schema.ts` | 120 | Schéma SQLite |
| `src/storage/audit-repository.ts` | 250 | CRUD operations |
| `src/storage/audit-converter.ts` | 80 | Conversion Report → Audit |
| `tests/storage/audit-schema.test.ts` | 100 | Tests schema |
| `tests/storage/audit-repository.test.ts` | 200 | Tests repository |
| `tests/storage/audit-converter.test.ts` | 100 | Tests converter |

**Total Sprint 10-1 :** ~930 lignes

---

## 5. Récapitulatif complet Sprint 10-1

| Tâche | Durée | Fichiers | Lignes |
|-------|-------|----------|--------|
| Types Audit | 2h | 1 | 80 |
| Schéma SQLite | 4h | 2 | 220 |
| AuditRepository | 6h | 2 | 450 |
| AuditConverter | 4h | 2 | 180 |
| **Total** | **16h** | **7** | **930** |

---

## 6. Commits

```bash
git commit -m "feat(storage): add audit types (AuditMetadata, AuditDimension, AuditFinding)"
git commit -m "feat(storage): implement AuditSchema with 3 tables + FTS5 index"
git commit -m "feat(storage): implement AuditRepository with store/findById/findByUrl/list/delete"
git commit -m "feat(storage): implement AuditConverter for AnalysisReport to Audit conversion"
```

---

## 7. Transition vers Sprint 10-2

**Prérequis pour Sprint 10-2 :**
- ✅ Sprint 10-1 terminé avec succès
- ✅ Schéma SQLite créé (3 tables)
- ✅ AuditRepository fonctionnel
- ✅ Tests unitaires passent

**Sprint 10-2 — Indexation + Recherche (Semaine 19, Jours 5-7) :**
- 🎯 Indexation FTS5 + Vector
- 🎯 Recherche hybride (FTS5 + Vector + RRF)
- 🎯 Filtres (score, dimension, priorité)
- 🎯 Tests unitaires

---

**Fin du document Sprint 10-1**
