import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import type { AnalysisReport } from '../../src/analysis/types.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { migration010ScoreAvailability } from '../../src/data/migrations/010_score_availability.js';
import { migrations, runMigrations } from '../../src/data/migrations/index.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { AuditStatisticsManager } from '../../src/storage/statistics.js';

/**
 * Migration 010 — score global indisponible (Sprint 19-03, C-W07).
 *
 * Décision du propriétaire (30 octobre 2026) : la colonne `overall_score`
 * accepte `NULL` **par `ALTER`** (pas de reconstruction de table), accompagnée
 * de `score_status` et `score_reason`. La migration est idempotente et ne
 * réécrit aucun score existant : les lignes historiques portaient un score réel
 * et restent `measured`.
 *
 * Une sonde sur la version embarquée (SQLite 3.53.4) a établi que
 * `ALTER COLUMN … DROP NOT NULL` est accepté et conserve le `CHECK` de bornes ;
 * ces tests le vérifient sur le schéma réel du projet.
 */

/** Description d'une colonne. */
interface ColumnInfo {
  name: string;
  notnull: number;
}

/** Colonnes déclarées sur une table. */
function columns(connection: Database.Database, table: string): ColumnInfo[] {
  return connection.pragma(`table_info(${table})`) as ColumnInfo[];
}

/** État « avant Sprint 19-03 » : `overall_score NOT NULL`, pas de statut. */
function createLegacySchema(connection: Database.Database): void {
  connection.exec(`
    CREATE TABLE audit_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
      total_findings INTEGER NOT NULL,
      critical_findings INTEGER NOT NULL,
      high_findings INTEGER NOT NULL,
      medium_findings INTEGER NOT NULL,
      low_findings INTEGER NOT NULL,
      info_findings INTEGER NOT NULL DEFAULT 0,
      project_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  connection.exec(`
    CREATE TABLE audit_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id INTEGER NOT NULL,
      dimension TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
      findings_count INTEGER NOT NULL
    )
  `);
  connection
    .prepare(
      `INSERT INTO audit_metadata
         (url, timestamp, overall_score, total_findings,
          critical_findings, high_findings, medium_findings, low_findings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run('https://historique.example', '2026-10-01T08:00:00.000Z', 71, 3, 0, 1, 1, 1);
  connection
    .prepare(
      `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
       VALUES (1, 'performance', 64, 2)`,
    )
    .run();
}

/** Applique uniquement la migration 010. */
function migrate010(connection: Database.Database): number[] {
  return runMigrations(
    connection,
    migrations.filter((migration) => migration.version === 10),
  );
}

describe('Migration 010 — disponibilité du score global (C-W07)', () => {
  let dataDir: string;
  let database: EktsDatabase;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'ekts-mig010-'));
    database = openDatabase({ dataDir, migrate: false });
  });

  afterEach(() => {
    database.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('retire NOT NULL et ajoute les colonnes d’état sur une base héritée', () => {
    createLegacySchema(database.connection);

    const executed = migrate010(database.connection);

    expect(executed).toEqual([10]);

    const metadata = new Map(
      columns(database.connection, 'audit_metadata').map((column) => [column.name, column]),
    );
    expect(metadata.get('overall_score')?.notnull).toBe(0);
    expect(metadata.get('score_status')?.notnull).toBe(1);
    expect(metadata.has('score_reason')).toBe(true);

    const dimensions = new Map(
      columns(database.connection, 'audit_dimensions').map((column) => [column.name, column]),
    );
    expect(dimensions.get('score')?.notnull).toBe(0);
    expect(dimensions.get('score_status')?.notnull).toBe(1);
    expect(dimensions.has('score_reason')).toBe(true);
  });

  it('conserve les scores historiques et les marque mesurés', () => {
    createLegacySchema(database.connection);
    migrate010(database.connection);

    const row = database.connection
      .prepare('SELECT overall_score, score_status, score_reason FROM audit_metadata')
      .get() as { overall_score: number; score_status: string; score_reason: string | null };

    expect(row.overall_score).toBe(71);
    expect(row.score_status).toBe('measured');
    expect(row.score_reason).toBeNull();

    const dimension = database.connection
      .prepare('SELECT score, score_status, score_reason FROM audit_dimensions')
      .get() as { score: number; score_status: string; score_reason: string | null };

    expect(dimension).toEqual({ score: 64, score_status: 'measured', score_reason: null });
  });

  it('accepte NULL mais conserve le CHECK de bornes', () => {
    createLegacySchema(database.connection);
    migrate010(database.connection);

    const insert = database.connection.prepare(
      `INSERT INTO audit_metadata
         (url, timestamp, overall_score, score_status, score_reason, total_findings,
          critical_findings, high_findings, medium_findings, low_findings, info_findings)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)`,
    );

    expect(() =>
      insert.run(
        'https://indisponible.example',
        '2026-10-03T08:00:00.000Z',
        null,
        'unavailable',
        'dimension SEO indisponible',
        0,
      ),
    ).not.toThrow();

    // Le `CHECK (overall_score BETWEEN 0 AND 100)` survit à l'`ALTER`.
    expect(() =>
      insert.run(
        'https://hors-bornes.example',
        '2026-10-03T09:00:00.000Z',
        150,
        'measured',
        null,
        0,
      ),
    ).toThrow(/CHECK constraint failed/u);
  });

  it('est idempotente : une seconde application ne change rien', () => {
    createLegacySchema(database.connection);
    migrate010(database.connection);
    const before = {
      metadata: columns(database.connection, 'audit_metadata'),
      dimensions: columns(database.connection, 'audit_dimensions'),
    };

    const executed = migrate010(database.connection);

    expect(executed).toEqual([]);
    expect({
      metadata: columns(database.connection, 'audit_metadata'),
      dimensions: columns(database.connection, 'audit_dimensions'),
    }).toEqual(before);
  });

  it('ne fait rien sur une base neuve, déjà conforme par le schéma', () => {
    new AuditSchema(database.connection).createSchema();
    const before = columns(database.connection, 'audit_metadata');

    // Base neuve : les trois propriétés viennent du `CREATE TABLE`. La
    // migration est appelée deux fois pour prouver qu'elle ne touche à rien.
    migration010ScoreAvailability(database.connection);
    migration010ScoreAvailability(database.connection);

    expect(columns(database.connection, 'audit_metadata')).toEqual(before);
    const declared = new Map(before.map((column) => [column.name, column]));
    expect(declared.get('overall_score')?.notnull).toBe(0);
    expect(declared.has('score_status')).toBe(true);

    const dimensions = new Map(
      columns(database.connection, 'audit_dimensions').map((column) => [column.name, column]),
    );
    expect(dimensions.get('score')?.notnull).toBe(0);
    expect(dimensions.has('score_status')).toBe(true);
  });
});

describe('Persistance du score indisponible (C-W07)', () => {
  let db: Database.Database;
  let repository: AuditRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    new AuditSchema(db).createSchema();
    repository = new AuditRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  /** Rapport dont l'accessibilité est indisponible (score global absent). */
  async function unavailableReport(): Promise<AnalysisReport> {
    return new AnalysisPipeline().analyze(
      'https://example.com',
      {
        performance: {
          score: 80,
          metrics: {
            lcp: { status: 'measured', value: 1800 },
            fid: { status: 'measured', value: 80 },
            cls: { status: 'measured', value: 0.05 },
            ttfb: { status: 'measured', value: 400 },
          },
        },
        seo: { score: 90, issues: [] },
      },
      { violations: [], score: null },
      { score: 70, heuristics: [] },
      { score: 85, metrics: { wordCount: 500, readingTime: 2, readabilityScore: 60 } },
    );
  }

  it('écrit NULL et la raison, jamais 0', async () => {
    const audit = repository.store(await unavailableReport());

    expect(audit.metadata.overallScore).toBeNull();
    expect(audit.metadata.scoreStatus).toBe('unavailable');
    expect(audit.metadata.scoreReason).toContain('accessibility');

    const row = db
      .prepare('SELECT overall_score, score_status, score_reason FROM audit_metadata')
      .get() as { overall_score: number | null; score_status: string; score_reason: string };

    expect(row.overall_score).toBeNull();
    expect(row.score_status).toBe('unavailable');
    expect(row.score_reason).toContain('accessibility');
  });

  it('relit l’audit avec son indisponibilité et ses constats', async () => {
    const stored = repository.store(await unavailableReport());
    const read = repository.findById(stored.metadata.id ?? 0);

    expect(read?.metadata.overallScore).toBeNull();
    expect(read?.metadata.scoreStatus).toBe('unavailable');
    expect(read?.dimensions).toHaveLength(5);
  });

  it('écrit NULL pour la dimension indisponible et conserve les autres scores', async () => {
    const stored = repository.store(await unavailableReport());
    const accessibility = stored.dimensions.find((dim) => dim.dimension === 'accessibility');
    const performance = stored.dimensions.find((dim) => dim.dimension === 'performance');

    expect(accessibility?.score).toBeNull();
    expect(accessibility?.scoreStatus).toBe('unavailable');
    expect(accessibility?.scoreReason).toBe('score-absent');
    expect(performance?.score).toBe(80);
    expect(performance?.scoreStatus).toBe('measured');

    const rows = db
      .prepare('SELECT dimension, score, score_status FROM audit_dimensions ORDER BY dimension')
      .all() as Array<{ dimension: string; score: number | null; score_status: string }>;

    expect(rows.find((row) => row.dimension === 'accessibility')).toEqual({
      dimension: 'accessibility',
      score: null,
      score_status: 'unavailable',
    });
    expect(rows.filter((row) => row.score === 0)).toEqual([]);
  });

  it('n’agrège aucune moyenne à partir d’un score indisponible', async () => {
    repository.store(await unavailableReport());

    const statistics = new AuditStatisticsManager(db);

    expect(statistics.getStatistics().totalAudits).toBe(1);
    // Aucun score mesuré : la période n'a pas de moyenne, elle est omise.
    expect(statistics.getTrend()).toEqual([]);
  });
});
