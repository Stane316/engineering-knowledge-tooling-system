import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase } from '../../src/data/database.js';
import { migrations, runMigrations } from '../../src/data/migrations/index.js';
import { AuditDiagnostics } from '../../src/storage/audit-diagnostics.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import type { Audit } from '../../src/storage/types.js';

/**
 * Sprint 19-02 — C-W12, données historiques.
 *
 * Oracle de `22` l. 128 : deux fixtures historiques (une priorité
 * contradictoire, un zéro d'origine inconnue) doivent **2/2 rester lisibles**,
 * l'incohérence et l'origine doivent êtres **signalées**, et **aucune** donnée
 * ne doit être réécrite ni recevoir d'attribution rétroactive de mesure.
 *
 * Aucun de ces tests ne modifie la base : ils comparent un instantané complet
 * avant/après diagnostic.
 */

/** Instantané intègre de toutes les lignes d'audit (preuve de non-réécriture). */
function snapshot(connection: Database.Database): string {
  const rows = connection
    .prepare(
      `SELECT id, url, timestamp, overall_score, total_findings,
              critical_findings, high_findings, medium_findings, low_findings, info_findings
         FROM audit_metadata ORDER BY id`,
    )
    .all();
  const dimensions = connection
    .prepare('SELECT audit_id, dimension, score, findings_count FROM audit_dimensions ORDER BY id')
    .all();
  const findings = connection
    .prepare('SELECT audit_id, title, priority, severity, effort FROM audit_findings ORDER BY id')
    .all();

  return JSON.stringify({ rows, dimensions, findings });
}

describe('Sprint 19-02 — C-W12 diagnostic des données historiques', () => {
  let db: Database.Database;
  let repository: AuditRepository;
  let diagnostics: AuditDiagnostics;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    new AuditSchema(db).createSchema();
    repository = new AuditRepository(db);
    diagnostics = new AuditDiagnostics(db);
  });

  afterEach(() => {
    db.close();
  });

  /**
   * Fixture 1 — priorité contradictoire.
   *
   * Constat `severity 3`, `effort 3` : la matrice donne `9` → `medium`, mais la
   * ligne historique porte `high`. Aucune réécriture ne doit avoir lieu.
   */
  function seedContradictoryPriority(): number {
    const audit = repository.store(makeReport('https://historique.example/priorite', 60));
    db.prepare(
      `INSERT INTO audit_findings
         (audit_id, dimension, title, description, severity, effort, impact, priority, recommendation)
       VALUES (?, 'content', 'Contenu insuffisant', 'Historique', 3, 3, 4, 'high', 'Enrichir')`,
    ).run(audit.metadata.id);
    db.prepare('UPDATE audit_metadata SET total_findings = 1, high_findings = 1 WHERE id = ?').run(
      audit.metadata.id,
    );
    return audit.metadata.id ?? 0;
  }

  /** Rapport minimal valide (aucun constat). */
  function makeReport(url: string, score: number) {
    const dimension = (name: string) => ({
      dimension: name as 'performance',
      score,
      status: 'measured' as const,
      findings: [],
      summary: 'Aucun constat.',
    });

    return {
      url,
      timestamp: '2026-10-01T08:00:00.000Z',
      dimensions: {
        performance: dimension('performance'),
        accessibility: dimension('accessibility'),
        seo: dimension('seo'),
        ux: dimension('ux'),
        content: dimension('content'),
      },
      findings: [],
      priorityFindings: [],
      summary: {
        totalFindings: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        infoFindings: 0,
        overallScore: { status: 'measured' as const, value: score },
      },
    } as unknown as Parameters<AuditRepository['store']>[0];
  }

  it('signale une priorité contradictoire sans réécrire la ligne', () => {
    const auditId = seedContradictoryPriority();
    const before = snapshot(db);

    const audit = repository.findById(auditId) as Audit;
    const report = diagnostics.inspect(audit);

    // 1/2 — la ligne reste lisible et intacte.
    expect(audit.findings).toHaveLength(1);
    expect(audit.findings[0]?.priority).toBe('high');
    expect(snapshot(db)).toBe(before);

    // L'incohérence est signalée avec sa nature et sa valeur attendue.
    const mismatch = report.find((diagnostic) => diagnostic.code === 'priority-mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch?.auditId).toBe(auditId);
    expect(mismatch?.expected).toBe('medium');
    expect(mismatch?.observed).toBe('high');
    expect(mismatch?.message).toContain('Contenu insuffisant');

    // Aucune correction silencieuse : la priorité n'est pas réécrite.
    const after = snapshot(db);
    expect(after).toBe(before);
    expect(after).toContain('"priority":"high"');
    expect(after).not.toContain('"priority":"medium"');
  });

  it('signale l’origine inconnue d’un zéro antérieur à la migration 009', () => {
    // Base « avant 009 » : même ouverture que la production (bases attachées
    // `fts`/`vectors`), migrations arrêtées à la version 8.
    const dataDir = mkdtempSync(join(tmpdir(), 'ekts-diag-009-'));
    const legacy = openDatabase({ dataDir, migrate: false });
    try {
      runMigrations(
        legacy.connection,
        migrations.filter((migration) => migration.version <= 8),
      );
      legacy.connection.exec(`
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
          project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Une base historique réelle porte les trois tables d'audit.
      legacy.connection.exec(`
        CREATE TABLE audit_dimensions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          audit_id INTEGER NOT NULL,
          dimension TEXT NOT NULL,
          score INTEGER NOT NULL,
          findings_count INTEGER NOT NULL,
          FOREIGN KEY (audit_id) REFERENCES audit_metadata(id) ON DELETE CASCADE
        );
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
      `);
      legacy.connection
        .prepare(
          `INSERT INTO audit_metadata
             (url, timestamp, overall_score, total_findings,
              critical_findings, high_findings, medium_findings, low_findings, created_at)
           VALUES ('https://historique.example/zero', '2026-09-01T08:00:00.000Z', 70, 0, 0, 0, 0, 0,
                   '2026-09-01T08:00:00.000Z')`,
        )
        .run();

      // Application de la migration 009 : la colonne arrive à 0 par défaut.
      runMigrations(
        legacy.connection,
        migrations.filter((migration) => migration.version === 9),
      );

      const before = snapshot(legacy.connection);
      const audit = new AuditRepository(legacy.connection).findById(1) as Audit;

      // 2/2 — la ligne reste lisible, le compteur vaut 0 (jamais NULL).
      expect(audit.metadata.infoFindings).toBe(0);

      const report = new AuditDiagnostics(legacy.connection).inspect(audit);
      const unknown = report.find((diagnostic) => diagnostic.code === 'unknown-origin-zero');

      expect(unknown).toBeDefined();
      expect(unknown?.auditId).toBe(1);
      // Le critère exige que l'origine soit signalée comme inconnue ; le
      // message lie « origine » et « inconnue » sans imposer une chaîne figée.
      expect(unknown?.message).toMatch(/origine\s+(?:est\s+)?inconnue/u);

      // Aucune attribution rétroactive, aucune réécriture.
      expect(snapshot(legacy.connection)).toBe(before);
    } finally {
      legacy.close();
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  it('ne signale rien sur un audit courant cohérent', () => {
    const audit = repository.store(makeReport('https://courant.example/ok', 80));

    expect(diagnostics.inspect(audit)).toEqual([]);
    expect(typeof diagnostics.inspectAll).toBe('function');
  });

  it('retourne un rapport vide sur une base sans audit', () => {
    expect(diagnostics.inspectAll()).toEqual([]);
  });
});
