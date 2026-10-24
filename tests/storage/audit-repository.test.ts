import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisReport, Finding, Priority } from '../../src/analysis/types.js';
import { ValidationError } from '../../src/shared/errors.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';

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

describe('AuditRepository', () => {
  let db: Database.Database;
  let repo: AuditRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    new AuditSchema(db).createSchema();
    repo = new AuditRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('store', () => {
    it('stocke un audit complet (métadonnées + 5 dimensions + constats)', () => {
      const findings = [
        makeFinding(),
        makeFinding({ id: 'f2', dimension: 'seo', priority: 'critical', severity: 4 }),
      ];
      const audit = repo.store(makeReport('https://example.com', 72, findings));

      expect(audit.metadata.id).toBeDefined();
      expect(audit.metadata.url).toBe('https://example.com');
      expect(audit.metadata.overallScore).toBe(72);
      expect(audit.dimensions).toHaveLength(5);
      expect(audit.findings).toHaveLength(2);
    });

    it('renseigne les identifiants générés des constats', () => {
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      expect(audit.findings[0]?.id).toBeGreaterThan(0);
    });

    it('aligne score et nombre de constats par dimension', () => {
      const perfOnly = makeFinding({ dimension: 'performance' });
      const audit = repo.store(makeReport('https://example.com', 80, [perfOnly]));

      const performance = audit.dimensions.find((d) => d.dimension === 'performance');
      expect(performance?.score).toBe(80);
      expect(performance?.findingsCount).toBe(1);

      const seo = audit.dimensions.find((d) => d.dimension === 'seo');
      expect(seo?.findingsCount).toBe(0);
    });

    it('persiste les champs du constat (titre, sévérité, priorité, recommandation)', () => {
      const audit = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      const stored = audit.findings[0];
      expect(stored?.title).toBe('LCP trop élevé');
      expect(stored?.severity).toBe(3);
      expect(stored?.priority).toBe('high');
      expect(stored?.recommendation).toBe('Optimiser les images');
    });

    it('rejette une sévérité hors bornes sans écrire de ligne', () => {
      // Hostilité assumée : on corrompt la valeur après construction pour
      // contourner l'union `Severity` du contrat et viser la validation.
      const hostile = makeFinding();
      (hostile as { severity: number }).severity = -1;
      const invalid = makeReport('https://example.com', 70, [hostile]);

      expect(() => repo.store(invalid)).toThrow(ValidationError);
      expect(repo.list()).toHaveLength(0);
      expect(
        (db.prepare('SELECT COUNT(*) AS n FROM audit_metadata').get() as { n: number }).n,
      ).toBe(0);
    });

    it('rejette une URL vide', () => {
      expect(() => repo.store(makeReport('   '))).toThrow(/url vide/);
      expect(repo.list()).toHaveLength(0);
    });

    it("rejette un effort hors de l'intervalle 1-5", () => {
      const hostile = makeFinding();
      (hostile as { effort: number }).effort = 9;
      const invalid = makeReport('https://example.com', 70, [hostile]);

      expect(() => repo.store(invalid)).toThrow(/effort hors 1-5/);
    });
  });

  describe('findById', () => {
    it('retourne un audit complet', () => {
      const stored = repo.store(
        makeReport('https://example.com', 70, [makeFinding(), makeFinding({ id: 'f2' })]),
      );

      const found = repo.findById(stored.metadata.id!);

      expect(found).not.toBeNull();
      expect(found?.metadata.url).toBe('https://example.com');
      expect(found?.dimensions).toHaveLength(5);
      expect(found?.findings).toHaveLength(2);
      expect(found?.dimensions[0]?.id).toBeGreaterThan(0);
    });

    it("retourne null si l'audit n'existe pas", () => {
      expect(repo.findById(999)).toBeNull();
    });
  });

  describe('findByUrl', () => {
    it('retourne les audits d’une URL, du plus récent au plus ancien', () => {
      repo.store(makeReport('https://example.com', 70, [], '2026-10-01T00:00:00.000Z'));
      repo.store(makeReport('https://example.com', 80, [], '2026-10-02T00:00:00.000Z'));
      repo.store(makeReport('https://other.com', 90, [], '2026-10-03T00:00:00.000Z'));

      const audits = repo.findByUrl('https://example.com');

      expect(audits).toHaveLength(2);
      expect(audits[0]?.metadata.overallScore).toBe(80);
      expect(audits[1]?.metadata.overallScore).toBe(70);
    });

    it('retourne un tableau vide pour une URL inconnue', () => {
      expect(repo.findByUrl('https://notfound.com')).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('pagine les audits (offset, limit)', () => {
      for (let i = 0; i < 10; i++) {
        repo.store(makeReport(`https://example${String(i)}.com`, 70));
      }

      expect(repo.list(0, 5)).toHaveLength(5);
      expect(repo.list(5, 5)).toHaveLength(5);
      expect(repo.list(0, 5)[0]?.metadata.url).not.toBe(repo.list(5, 5)[0]?.metadata.url);
    });

    it('retourne un tableau vide sans audit', () => {
      expect(repo.list()).toHaveLength(0);
    });

    it('rejette un offset négatif', () => {
      expect(() => repo.list(-1)).toThrow(ValidationError);
    });

    it('rejette une limite nulle', () => {
      expect(() => repo.list(0, 0)).toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('supprime un audit et cascade ses dimensions et constats', () => {
      const stored = repo.store(makeReport('https://example.com', 70, [makeFinding()]));

      expect(repo.delete(stored.metadata.id!)).toBe(true);

      expect(repo.findById(stored.metadata.id!)).toBeNull();
      const orphans = db
        .prepare('SELECT COUNT(*) AS n FROM audit_dimensions WHERE audit_id = ?')
        .get(stored.metadata.id!) as { n: number };
      const orphanFindings = db
        .prepare('SELECT COUNT(*) AS n FROM audit_findings WHERE audit_id = ?')
        .get(stored.metadata.id!) as { n: number };
      expect(orphans.n).toBe(0);
      expect(orphanFindings.n).toBe(0);
    });

    it("nettoie les lignes de l'audit dans l'index audit_fts", () => {
      const stored = repo.store(makeReport('https://example.com', 70, [makeFinding()]));
      db.prepare('INSERT INTO audit_fts (rowid, url, title, description) VALUES (?, ?, ?, ?)').run(
        stored.findings[0]?.id,
        stored.metadata.url,
        'LCP trop élevé',
        'desc',
      );

      repo.delete(stored.metadata.id!);

      const rows = db.prepare('SELECT COUNT(*) AS n FROM audit_fts').get() as { n: number };
      expect(rows.n).toBe(0);
    });

    it('retourne false pour un identifiant inconnu', () => {
      expect(repo.delete(999)).toBe(false);
    });
  });
});
