import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisDimension, AnalysisReport } from '../../src/analysis/types.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Rapport avec un finding injecté sur la dimension demandée. */
function makeReport(score: number, timestamp: string, findingTitle?: string): AnalysisReport {
  const findings =
    findingTitle === undefined
      ? []
      : [
          {
            dimension: 'performance' as AnalysisDimension,
            title: findingTitle,
            description: 'Constat de test',
            severity: 2,
            effort: 2,
            impact: 3,
            priority: 'medium' as const,
            recommendation: 'Corriger selon la bonne pratique',
          },
        ];
  return {
    url: 'https://example.com',
    timestamp,
    dimensions: Object.fromEntries(
      DIMENSIONS.map((name) => [
        name,
        {
          dimension: name,
          score,
          status: 'measured' as const,
          findings: [],
          summary: `${name} ${score}`,
        },
      ]),
    ) as unknown as AnalysisReport['dimensions'],
    findings,
    priorityFindings: findings.map((finding) => ({
      ...finding,
      auditId: 0,
      recommendation: finding.recommendation,
    })),
    summary: {
      totalFindings: findings.length,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: findings.length,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: { status: 'measured', value: score },
    },
  } as unknown as AnalysisReport;
}

describe('Intégration — capitalisation des bonnes pratiques (Sprint 15, C15.1→C15.20)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let service: BestPracticeService;
  let projectId: string;

  /** Insère un audit à la date donnée (score uniforme + finding optionnel). */
  function seedAudit(score: number, iso: string, findingTitle?: string): void {
    new AuditRepository(database.connection).store(makeReport(score, iso, findingTitle), {
      projectId,
    });
  }

  beforeEach(() => {
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();
    service = new BestPracticeService(database.connection);
    projectId = new ProjectRepository(database.connection).create({
      name: 'Site capitalisation',
    }).id;
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  it('flux complet : extraire → rechercher → associer → compter (C15.2, C15.6)', () => {
    seedAudit(70, '2026-01-01T12:00:00.000Z', 'Images non optimisées');
    seedAudit(75, '2026-02-01T12:00:00.000Z', 'Images non optimisées');
    seedAudit(85, '2026-03-01T12:00:00.000Z'); // finding disparu + score amélioré

    const report = service.extractFromProject(projectId);
    expect(report.auditsAnalyzed).toBe(3);
    expect(report.practicesExtracted).toBe(1);
    expect(report.linksCreated).toBeGreaterThanOrEqual(1);

    const results = service.searchPractices({ query: 'images' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.practice.category).toBe('performance');

    const links = service.findLinkedFindings(results[0]?.practice.id ?? '');
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]?.dimension).toBe('performance');

    expect(service.count()).toBeGreaterThanOrEqual(1);
    expect(service.count({ category: 'performance' })).toBeGreaterThanOrEqual(1);
  });

  it('flux manuel : créer → lier → retrouver → délier (C15.1, C15.6)', () => {
    const practice = service.create({
      title: 'Toujours ajouter les alt text',
      description: 'Chaque image doit avoir un attribut alt descriptif',
      category: 'accessibility',
      tags: ['a11y', 'images'],
    });
    expect(practice.isManual).toBe(true);

    service.linkToFinding(practice.id, 'Missing alt attribute', 'accessibility', 0.9);
    expect(service.findByFinding('Missing alt attribute', 'accessibility')).toHaveLength(1);

    service.unlinkFromFinding(practice.id, 'Missing alt attribute', 'accessibility');
    expect(service.findByFinding('Missing alt attribute', 'accessibility')).toHaveLength(0);
    expect(service.findLinkedFindings(practice.id)).toHaveLength(0);
  });

  it('cas limites : 0 audit, 1 audit, audits sans findings résolus (C15.20)', () => {
    // 0 audit : extraction non bloquante
    const empty = service.extractFromProject(projectId);
    expect(empty).toMatchObject({ auditsAnalyzed: 0, practicesExtracted: 0, linksCreated: 0 });

    // 1 audit : insuffisant pour une résolution
    seedAudit(70, '2026-01-01T12:00:00.000Z', 'Constat unique');
    const single = service.extractFromProject(projectId);
    expect(single.practicesExtracted).toBe(0);
    expect(single.auditsAnalyzed).toBe(1);

    // 2 audits sans amélioration de score : rien d'extrait
    seedAudit(70, '2026-02-01T12:00:00.000Z', 'Constat unique');
    const noImprovement = service.extractFromProject(projectId);
    expect(noImprovement.practicesExtracted).toBe(0);
    expect(service.count()).toBe(0);
  });

  it("l'extraction de 100 audits tient en moins de 5 s (C15.13)", () => {
    const base = Date.parse('2026-01-01T12:00:00.000Z');
    for (let index = 0; index < 100; index += 1) {
      const score = index < 98 ? 60 + Math.floor(index / 10) : 90;
      seedAudit(
        score,
        new Date(base + index * 86_400_000).toISOString(),
        index < 99 ? `Constat récurrent ${String(index % 3)}` : undefined,
      );
    }

    const started = Date.now();
    const report = service.extractFromProject(projectId);
    const elapsed = Date.now() - started;

    expect(report.auditsAnalyzed).toBe(100);
    expect(elapsed).toBeLessThan(5_000);
    expect(report.durationMs).toBeLessThan(5_000);
  });

  it('la recherche hybride reste sous 100 ms avec 1 000 pratiques (C15.14)', () => {
    for (let index = 0; index < 1000; index += 1) {
      service.create({
        title: `Pratique n°${String(index)} optimisation ${String(index % 7)}`,
        description: `Description détaillée de la pratique ${String(index)} pour la recherche`,
        category: index % 2 === 0 ? 'performance' : 'seo',
        tags: [`tag-${String(index % 50)}`],
      });
    }
    expect(service.count()).toBe(1000);

    const started = Date.now();
    const results = service.searchPractices({ query: 'optimisation', limit: 20 });
    const elapsed = Date.now() - started;

    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });

  it('extraction idempotente sur le même projet (C15.19)', () => {
    seedAudit(70, '2026-01-01T12:00:00.000Z', 'Pattern stable');
    seedAudit(72, '2026-02-01T12:00:00.000Z', 'Pattern stable');
    seedAudit(88, '2026-03-01T12:00:00.000Z');

    const first = service.extractFromProject(projectId);
    const second = service.extractFromProject(projectId);

    expect(first.practicesExtracted).toBe(1);
    expect(second.practicesExtracted).toBe(0);
    expect(second.practicesMerged).toBe(1);
    expect(service.count()).toBe(1);
    expect(service.list()[0]?.occurrenceCount).toBe(2);
  });
});
