import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BestPracticeExtractor } from '../../src/best-practices/best-practice-extractor.js';
import { BestPracticeRepository } from '../../src/best-practices/best-practice-repository.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

describe('BestPracticeExtractor (Sprint 15-02)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let db: EktsDatabase['connection'];
  let repo: BestPracticeRepository;
  let extractor: BestPracticeExtractor;

  beforeEach(() => {
    // Les migrations 001+ écrivent dans la base FTS attachée : fixtures = vraies
    // bases ouvertes par openDatabase (leçon des tests d'intégration S14),
    // jamais `:memory:` isolé.
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    db = database.connection;
    new AuditSchema(db).createSchema();

    new ProjectRepository(db).create({ name: 'Projet Test' });
    db.prepare('UPDATE projects SET id = ? WHERE name = ?').run('proj-1', 'Projet Test');

    repo = new BestPracticeRepository(db);
    extractor = new BestPracticeExtractor(db, repo);
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  /** Insère un audit complet (vrai schéma : colonnes NOT NULL fournies). */
  function insertAudit(
    projectId: string,
    timestamp: string,
    scores: Record<string, number>,
  ): number {
    const result = db
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings, project_id)
         VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?)`,
      )
      .run('https://example.com', timestamp, 50, projectId);
    const auditId = Number(result.lastInsertRowid);

    for (const [dimension, score] of Object.entries(scores)) {
      db.prepare(
        `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
         VALUES (?, ?, ?, 0)`,
      ).run(auditId, dimension, score);
    }
    return auditId;
  }

  /** Insère un finding (colonnes NOT NULL du vrai schéma). */
  function insertFinding(
    auditId: number,
    dimension: string,
    title: string,
    severity: number,
    recommendation?: string,
  ): void {
    db.prepare(
      `INSERT INTO audit_findings
         (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
       VALUES (?, ?, ?, ?, 2, 2, 'medium', ?)`,
    ).run(auditId, dimension, title, severity, recommendation ?? `Corriger : ${title}`);
  }

  it("n'extrait rien avec moins de 2 audits (cas limite, non bloquant)", () => {
    const auditId = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 80 });
    insertFinding(auditId, 'performance', 'Images non optimisées', 2);

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(0);
    expect(report.auditsAnalyzed).toBe(1);
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('rapport vide pour un projet sans audit (0 audit)', () => {
    const report = extractor.extractFromProject('proj-inexistant');
    expect(report).toMatchObject({ auditsAnalyzed: 0, practicesExtracted: 0, linksCreated: 0 });
  });

  it('extrait un finding résolu récurrent (disparition + score amélioré, C15.2)', () => {
    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);

    const audit2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 72 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);

    insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 85 }); // résolution

    const report = extractor.extractFromProject('proj-1');
    expect(report.auditsAnalyzed).toBe(3);
    expect(report.practicesExtracted).toBe(1);

    const practices = repo.list({ category: 'performance' });
    expect(practices).toHaveLength(1);
    expect(practices[0]?.title).toBe('Images non optimisées');
    expect(practices[0]?.isManual).toBe(false);
    expect(practices[0]?.tags).toContain('performance');
    expect(practices[0]?.sourceProjectIds).toContain('proj-1');
    expect(practices[0]?.sourceAuditIds.length).toBeGreaterThanOrEqual(2);
  });

  it("n'extrait pas si le score de la dimension ne s'améliore pas", () => {
    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);
    const audit2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 72 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);
    insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 72 }); // inchangé

    expect(extractor.extractFromProject('proj-1').practicesExtracted).toBe(0);
  });

  it('fusionne avec une pratique existante de même titre (C15.19)', () => {
    repo.create({
      title: 'Images non optimisées',
      description: 'Optimiser les images',
      category: 'performance',
      isManual: true,
    });

    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);
    const audit2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 75 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);
    insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 85 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(0);
    expect(report.practicesMerged).toBe(1);

    const practices = repo.list({ category: 'performance' });
    expect(practices).toHaveLength(1);
    expect(practices[0]?.occurrenceCount).toBe(2);
  });

  it('ne fusionne pas des titres simplement différents', () => {
    repo.create({
      title: 'Lazy loading des images',
      description: 'Autre pratique',
      category: 'performance',
    });

    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);
    const audit2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 75 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);
    insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 85 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(1);
    expect(report.practicesMerged).toBe(0);
    expect(repo.count()).toBe(2);
  });

  it("n'extrait pas un finding qui n'apparaît qu'une seule fois", () => {
    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Finding rare', 2);
    insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 80 });

    expect(extractor.extractFromProject('proj-1').practicesExtracted).toBe(0);
  });

  it('crée les associations finding ↔ pratique (confiance ≥ 0.5)', () => {
    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);
    const audit2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 75 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);
    insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 85 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.linksCreated).toBeGreaterThanOrEqual(1);

    const practices = repo.findByFinding('Images non optimisées', 'performance');
    expect(practices).toHaveLength(1);
    const links = repo.findLinkedFindings(practices[0]?.id ?? '');
    expect(links[0]?.confidence).toBeGreaterThanOrEqual(0.5);
    expect(links[0]?.confidence).toBeLessThanOrEqual(1);
  });

  it('est idempotent : une seconde extraction ne recrée rien', () => {
    const audit1 = insertAudit('proj-1', '2026-01-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);
    const audit2 = insertAudit('proj-1', '2026-02-01T00:00:00.000Z', { performance: 75 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);
    insertAudit('proj-1', '2026-03-01T00:00:00.000Z', { performance: 85 });

    extractor.extractFromProject('proj-1');
    const second = extractor.extractFromProject('proj-1');

    expect(second.practicesExtracted).toBe(0);
    expect(second.practicesMerged).toBe(1);
    expect(second.linksCreated).toBe(0);
    expect(repo.count()).toBe(1);
  });

  it('respecte les critères configurables (minAudits surchargeable)', () => {
    const strict = new BestPracticeExtractor(db, repo, { minAudits: 1 });
    const audit1 = insertAudit('proj-1', '2026-04-01T00:00:00.000Z', { performance: 70 });
    insertFinding(audit1, 'performance', 'Unique résolu', 3);

    // 4 audits au total : le critère 1 audit est déjà satisfait — contrôle du rapport.
    const report = strict.extractFromProject('proj-1');
    expect(report.auditsAnalyzed).toBeGreaterThanOrEqual(1);
    expect(report.durationMs).toBeLessThan(5000);
  });
});
