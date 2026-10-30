import type { Database } from 'better-sqlite3';

import type { AnalysisDimension, AnalysisReport, Priority } from '../analysis/types.js';
import { ValidationError } from '../shared/errors.js';

import type { Audit, AuditDimension, AuditFinding, AuditMetadata } from './types.js';

/** Les cinq dimensions du rapport d'analyse, dans l'ordre du contrat. */
const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
];

/** Priorités possibles d'un constat. */
const PRIORITIES: readonly Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

/** Ligne brute de `audit_metadata`. */
interface MetadataRow {
  id: number;
  url: string;
  timestamp: string;
  overall_score: number;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  /**
   * Cinquième compteur (migration 009). Optionnel au type car une base
   * antérieure à la migration peut être lue avant application : le mapping
   * ramène l'absence à `0`, jamais à `undefined`.
   */
  info_findings?: number;
  project_id: string | null;
  created_at: string;
}

/** Ligne brute de `audit_dimensions`. */
interface DimensionRow {
  id: number;
  audit_id: number;
  dimension: AnalysisDimension;
  score: number;
  findings_count: number;
}

/** Ligne brute de `audit_findings`. */
interface FindingRow {
  id: number;
  audit_id: number;
  dimension: AnalysisDimension;
  title: string;
  description: string | null;
  severity: number;
  effort: number;
  impact: number;
  priority: Priority;
  recommendation: string | null;
  created_at: string;
}

/**
 * Valide un rapport avant insertion.
 *
 * @param report - Rapport d'analyse à contrôler.
 * @throws {ValidationError} Liste des anomalies détectées (la transaction de
 *   stockage n'est alors jamais ouverte).
 */
function validateAnalysisReport(report: AnalysisReport): void {
  const issues: string[] = [];

  if (report.url.trim().length === 0) {
    issues.push('url vide');
  }
  if (report.timestamp.trim().length === 0) {
    issues.push('timestamp vide');
  }
  if (
    !Number.isInteger(report.summary.overallScore) ||
    report.summary.overallScore < 0 ||
    report.summary.overallScore > 100
  ) {
    issues.push(`score global hors 0-100 (${String(report.summary.overallScore)})`);
  }

  const summary = report.summary;
  const counters = [
    ['totalFindings', summary.totalFindings],
    ['criticalFindings', summary.criticalFindings],
    ['highFindings', summary.highFindings],
    ['mediumFindings', summary.mediumFindings],
    ['lowFindings', summary.lowFindings],
    ['infoFindings', summary.infoFindings],
  ] as const;
  for (const [name, value] of counters) {
    if (!Number.isInteger(value) || value < 0) {
      issues.push(`${name} invalide (${String(value)})`);
    }
  }

  for (const dimension of DIMENSIONS) {
    const score = report.dimensions[dimension];
    if (score === undefined) {
      issues.push(`dimension absente : ${dimension}`);
      continue;
    }
    if (!Number.isInteger(score.score) || score.score < 0 || score.score > 100) {
      issues.push(`${dimension}: score hors 0-100 (${String(score.score)})`);
    }
  }

  report.findings.forEach((finding, index) => {
    const prefix = `constat[${String(index)}]`;
    if (!DIMENSIONS.includes(finding.dimension)) {
      issues.push(`${prefix}: dimension inconnue (${finding.dimension})`);
    }
    if (finding.title.trim().length === 0) {
      issues.push(`${prefix}: titre vide`);
    }
    if (!Number.isInteger(finding.severity) || finding.severity < 0 || finding.severity > 4) {
      issues.push(`${prefix}: sévérité hors 0-4 (${String(finding.severity)})`);
    }
    if (!Number.isInteger(finding.effort) || finding.effort < 1 || finding.effort > 5) {
      issues.push(`${prefix}: effort hors 1-5 (${String(finding.effort)})`);
    }
    if (!Number.isInteger(finding.impact) || finding.impact < 1 || finding.impact > 5) {
      issues.push(`${prefix}: impact hors 1-5 (${String(finding.impact)})`);
    }
    if (!PRIORITIES.includes(finding.priority)) {
      issues.push(`${prefix}: priorité inconnue (${finding.priority})`);
    }
  });

  if (issues.length > 0) {
    throw new ValidationError(issues);
  }
}

/**
 * Repository CRUD des audits (Sprint 10-1).
 *
 * Une seule transaction atomique par `store()` : métadonnées, puis cinq
 * dimensions, puis les constats — toute anomalie de validation survient
 * **avant** l'ouverture de la transaction, toute anomalie SQLite l'annule
 * intégralement (jamais d'audit partiel).
 *
 * La conversion `AnalysisReport` → lignes SQL est intégrée ici (pas de
 * fichier `audit-converter.ts` séparé) : le périmètre du Sprint 10 limite le
 * module à six fichiers et la conversion n'a qu'un seul consommateur.
 */
export class AuditRepository {
  /**
   * @param db - Connexion ouverte sur un schéma créé par `AuditSchema`.
   */
  constructor(private readonly db: Database) {}

  /**
   * Stocke un rapport d'analyse complet.
   *
   * @param report - Rapport produit par `AnalysisPipeline` (Sprint 9).
   * @param options - `projectId` associe l'audit à un projet (Sprint 13).
   * @returns Audit persisté, avec identifiants renseignés.
   * @throws {ValidationError} Rapport invalide (aucune ligne écrite).
   */
  store(report: AnalysisReport, options: { readonly projectId?: string | null } = {}): Audit {
    validateAnalysisReport(report);
    const projectId = options.projectId ?? null;

    const transaction = this.db.transaction((): Audit => {
      const metadataResult = this.db
        .prepare(
          `INSERT INTO audit_metadata (
             url, timestamp, overall_score, total_findings,
             critical_findings, high_findings, medium_findings, low_findings,
             info_findings, project_id
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          report.url,
          report.timestamp,
          report.summary.overallScore,
          report.summary.totalFindings,
          report.summary.criticalFindings,
          report.summary.highFindings,
          report.summary.mediumFindings,
          report.summary.lowFindings,
          report.summary.infoFindings,
          projectId,
        );

      const auditId = Number(metadataResult.lastInsertRowid);

      const dimensionStatement = this.db.prepare(
        `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
         VALUES (?, ?, ?, ?)`,
      );
      const dimensions: AuditDimension[] = DIMENSIONS.map((dimension) => {
        const score = report.dimensions[dimension];
        const findingsCount = score?.findings.length ?? 0;
        const effectiveScore = score?.score ?? 0;
        dimensionStatement.run(auditId, dimension, effectiveScore, findingsCount);

        return { auditId, dimension, score: effectiveScore, findingsCount };
      });

      const findingStatement = this.db.prepare(
        `INSERT INTO audit_findings (
           audit_id, dimension, title, description,
           severity, effort, impact, priority, recommendation
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const findings: AuditFinding[] = report.findings.map((finding) => {
        const result = findingStatement.run(
          auditId,
          finding.dimension,
          finding.title,
          finding.description ?? null,
          finding.severity,
          finding.effort,
          finding.impact,
          finding.priority,
          finding.recommendation ?? null,
        );

        return {
          id: Number(result.lastInsertRowid),
          auditId,
          dimension: finding.dimension,
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          effort: finding.effort,
          impact: finding.impact,
          priority: finding.priority,
          recommendation: finding.recommendation,
        };
      });

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
          infoFindings: report.summary.infoFindings,
          projectId,
        },
        dimensions,
        findings,
      };
    });

    return transaction();
  }

  /**
   * Récupère un audit complet par identifiant.
   *
   * @param id - Identifiant de `audit_metadata`.
   * @returns L'audit (métadonnées + dimensions + constats) ou `null`.
   */
  findById(id: number): Audit | null {
    const row = this.db.prepare('SELECT * FROM audit_metadata WHERE id = ?').get(id) as
      MetadataRow | undefined;

    if (row === undefined) {
      return null;
    }

    return this.hydrate(row);
  }

  /**
   * Récupère tous les audits d'une URL, du plus récent au plus ancien.
   *
   * @param url - URL analysée.
   * @returns Audits correspondants (tableau vide si aucun).
   */
  findByUrl(url: string): Audit[] {
    const rows = this.db
      .prepare('SELECT * FROM audit_metadata WHERE url = ? ORDER BY timestamp DESC, id DESC')
      .all(url) as MetadataRow[];

    return rows.map((row) => this.hydrate(row));
  }

  /**
   * Liste les audits avec pagination (du plus récent au plus ancien).
   *
   * @param offset - Décalage (défaut : 0).
   * @param limit - Taille de page (défaut : 100).
   * @returns Audits de la page demandée.
   * @throws {ValidationError} Paramètres de pagination invalides.
   */
  list(offset = 0, limit = 100): Audit[] {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError([`offset invalide (${String(offset)})`]);
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationError([`limit invalide (${String(limit)})`]);
    }

    const rows = this.db
      .prepare('SELECT * FROM audit_metadata ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as MetadataRow[];

    return rows.map((row) => this.hydrate(row));
  }

  /**
   * Liste les audits d'un projet dans l'ordre chronologique
   * (Sprint 14 — entrée de la timeline par projet).
   *
   * S'appuie sur l'index `idx_audit_metadata_project_id` (migration 003).
   * Les audits sans projet ne sont jamais retournés.
   *
   * @param projectId - Identifiant UUID du projet.
   * @param limit - Nombre maximal d'audits (défaut : 500, ≥ 1).
   * @returns Audits du projet du plus ancien au plus récent
   *   (tableau vide si le projet n'existe pas ou n'a aucun audit).
   * @throws {ValidationError} `limit` invalide.
   */
  listByProject(projectId: string, limit = 500): Audit[] {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationError([`limit invalide (${String(limit)})`]);
    }

    const rows = this.db
      .prepare(
        `SELECT * FROM audit_metadata
          WHERE project_id = ?
          ORDER BY timestamp ASC, id ASC
          LIMIT ?`,
      )
      .all(projectId, limit) as MetadataRow[];

    return rows.map((row) => this.hydrate(row));
  }

  /**
   * Supprime un audit (dimensions et constats via `ON DELETE CASCADE`),
   * ainsi que ses lignes dans l'index plein texte `audit_fts`.
   *
   * Les embeddings vectoriels, eux, vivent dans le magasin injecté :
   * appelez `AuditIndexer.removeEmbeddings()` (ou `deindexAudit()`) avant.
   *
   * @param id - Identifiant de l'audit.
   * @returns `true` si une ligne a été supprimée, `false` sinon.
   */
  delete(id: number): boolean {
    const transaction = this.db.transaction((): boolean => {
      const ftsTable = this.db
        .prepare(
          `SELECT name FROM sqlite_master
            WHERE type = 'table' AND name = 'audit_fts'`,
        )
        .get() as { name: string } | undefined;

      // Les rowid de `audit_fts` sont les identifiants des constats :
      // ils doivent être relevés AVANT la suppression en cascade.
      const ftsRowIds =
        ftsTable === undefined
          ? []
          : (this.db.prepare('SELECT id FROM audit_findings WHERE audit_id = ?').all(id) as Array<{
              id: number;
            }>);

      const removed = this.db.prepare('DELETE FROM audit_metadata WHERE id = ?').run(id);

      if (removed.changes === 0) {
        return false;
      }

      if (ftsRowIds.length > 0) {
        const deleteFts = this.db.prepare('DELETE FROM audit_fts WHERE rowid = ?');
        for (const { id: rowId } of ftsRowIds) {
          deleteFts.run(rowId);
        }
      }

      return true;
    });

    return transaction();
  }

  /** Charge dimensions et constats d'une ligne de métadonnées. */
  private hydrate(row: MetadataRow): Audit {
    const dimensionRows = this.db
      .prepare('SELECT * FROM audit_dimensions WHERE audit_id = ?')
      .all(row.id) as DimensionRow[];
    const findingRows = this.db
      .prepare('SELECT * FROM audit_findings WHERE audit_id = ?')
      .all(row.id) as FindingRow[];

    return {
      metadata: this.mapMetadata(row),
      dimensions: dimensionRows.map((d) => this.mapDimension(d)),
      findings: findingRows.map((f) => this.mapFinding(f)),
    };
  }

  /** Convertit une ligne SQL en {@link AuditMetadata}. */
  private mapMetadata(row: MetadataRow): AuditMetadata {
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
      infoFindings: row.info_findings ?? 0,
      projectId: row.project_id,
      createdAt: row.created_at,
    };
  }

  /** Convertit une ligne SQL en {@link AuditDimension}. */
  private mapDimension(row: DimensionRow): AuditDimension {
    return {
      id: row.id,
      auditId: row.audit_id,
      dimension: row.dimension,
      score: row.score,
      findingsCount: row.findings_count,
    };
  }

  /** Convertit une ligne SQL en {@link AuditFinding}. */
  private mapFinding(row: FindingRow): AuditFinding {
    return {
      id: row.id,
      auditId: row.audit_id,
      dimension: row.dimension,
      title: row.title,
      description: row.description ?? undefined,
      severity: row.severity,
      effort: row.effort,
      impact: row.impact,
      priority: row.priority,
      recommendation: row.recommendation ?? undefined,
      createdAt: row.created_at,
    };
  }
}
