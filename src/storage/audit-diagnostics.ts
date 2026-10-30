import type Database from 'better-sqlite3';

import { SeverityMatrix } from '../analysis/severity.js';
import type { Effort, Priority, Severity } from '../analysis/types.js';

import type { Audit } from './types.js';

/** Code d'anomalie détectée sur des données d'audit (Sprint 19-02, C-W12). */
export type AuditDiagnosticCode = 'priority-mismatch' | 'counter-mismatch' | 'unknown-origin-zero';

/**
 * Anomalie signalée sur des données existantes.
 *
 * Une anomalie est **constatée**, jamais corrigée : aucune migration, aucun
 * rapport et aucun diagnostic n'écrit dans les tables d'audit (C-W12 : « 0
 * réécriture silencieuse des données historiques ni attribution rétroactive
 * de mesure »).
 */
export interface AuditDiagnostic {
  /** Nature de l'anomalie. */
  code: AuditDiagnosticCode;
  /** Audit concerné. */
  auditId: number;
  /** Message lisible en français. */
  message: string;
  /** Valeur attendue, quand elle est dérivable (priorité canonique). */
  expected?: string;
  /** Valeur réellement persistée. */
  observed?: string;
}

/** Priorités contrôlées, dans l'ordre de la matrice. */
const PRIORITIES: readonly Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

/** Version de la migration qui a introduit `info_findings` (Sprint 19-01). */
const INFO_MIGRATION_VERSION = 9;

/**
 * Diagnostic en **lecture seule** des audits persistés (Sprint 19-02, C-W12).
 *
 * Trois contrôles, tous non intrusifs :
 *
 * 1. **`priority-mismatch`** — un constat persisté dont la priorité diffère de
 *    la priorité canonique `severity × (6 − effort)` de sa propre sévérité et
 *    de son effort. Cas typique des données produites avant le Sprint 19-01,
 *    qui publiait les priorités indicatives des analyseurs.
 * 2. **`counter-mismatch`** — les compteurs persistés ne correspondent pas
 *    aux constats réellement enregistrés pour cet audit.
 * 3. **`unknown-origin-zero`** — `info_findings` vaut `0` sur une ligne
 *    antérieure à la migration 009 : la valeur vient du `DEFAULT` de la
 *    migration, pas d'un décompte. Le zéro est conservé (décision du
 *    propriétaire du 30/10/2026) mais son _origine_ est déclarée inconnue.
 *
 * @example
 * ```ts
 * const diagnostics = new AuditDiagnostics(connection);
 * const anomalies = diagnostics.inspect(audit);
 * const toutes = diagnostics.inspectAll();
 * ```
 */
export class AuditDiagnostics {
  private readonly matrix = new SeverityMatrix();
  private infoColumnAvailable: boolean | undefined;

  /**
   * @param db - Connexion ouverte aux bases EKTS.
   */
  constructor(private readonly db: Database.Database) {}

  /**
   * Inspecte un audit déjà chargé.
   *
   * @param audit - Audit lu depuis la base (jamais modifié).
   * @returns Anomalies constatées, éventuellement vide.
   */
  inspect(audit: Audit): AuditDiagnostic[] {
    const auditId = audit.metadata.id ?? 0;
    const diagnostics: AuditDiagnostic[] = [];

    diagnostics.push(...this.checkPriorities(auditId, audit));
    diagnostics.push(...this.checkCounters(auditId, audit));
    diagnostics.push(...this.checkInfoOrigin(auditId, audit));

    return diagnostics;
  }

  /**
   * Inspecte tous les audits persistés.
   *
   * @param limit - Nombre maximal d'audits examinés (défaut : tous).
   * @returns Anomalies de l'ensemble des audits examinés.
   */
  inspectAll(limit?: number): AuditDiagnostic[] {
    if (!this.tableExists('audit_metadata')) {
      return [];
    }

    const rows = this.db
      .prepare(
        `SELECT id FROM audit_metadata
          ORDER BY id DESC
          ${limit === undefined ? '' : 'LIMIT ?'}`,
      )
      .all(...(limit === undefined ? [] : [limit])) as Array<{ id: number }>;

    const diagnostics: AuditDiagnostic[] = [];
    for (const row of rows) {
      const audit = this.loadAudit(row.id);
      if (audit !== undefined) {
        diagnostics.push(...this.inspect(audit));
      }
    }

    return diagnostics;
  }

  /**
   * Contrôle 1 — priorité persistée contre priorité canonique.
   *
   * @param auditId - Audit concerné.
   * @param audit - Audit chargé.
   * @returns Anomalies de priorité.
   */
  private checkPriorities(auditId: number, audit: Audit): AuditDiagnostic[] {
    const diagnostics: AuditDiagnostic[] = [];

    for (const finding of audit.findings) {
      const expected = this.matrix.scoreToPriority(
        this.matrix.calculateScore(finding.severity as Severity, finding.effort as Effort),
      );

      if (expected !== finding.priority) {
        diagnostics.push({
          code: 'priority-mismatch',
          auditId,
          message:
            `« ${finding.title} » (${finding.dimension}) porte la priorité ` +
            `« ${finding.priority} » alors que la matrice donne « ${expected} » ` +
            `pour sévérité ${String(finding.severity)} et effort ${String(finding.effort)}. ` +
            `La valeur persistée est conservée telle quelle.`,
          expected,
          observed: finding.priority,
        });
      }
    }

    return diagnostics;
  }

  /**
   * Contrôle 2 — compteurs persistés contre constats réellement enregistrés.
   *
   * @param auditId - Audit concerné.
   * @param audit - Audit chargé.
   * @returns Anomalies de comptage.
   */
  private checkCounters(auditId: number, audit: Audit): AuditDiagnostic[] {
    const metadata = audit.metadata;
    const observed: Record<Priority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const finding of audit.findings) {
      observed[finding.priority] += 1;
    }

    const expected: Record<Priority, number> = {
      critical: metadata.criticalFindings,
      high: metadata.highFindings,
      medium: metadata.mediumFindings,
      low: metadata.lowFindings,
      info: metadata.infoFindings,
    };

    const diagnostics: AuditDiagnostic[] = [];

    for (const priority of PRIORITIES) {
      if (expected[priority] !== observed[priority]) {
        diagnostics.push({
          code: 'counter-mismatch',
          auditId,
          message:
            `Le compteur « ${priority} » annonce ${String(expected[priority])} constat(s) ` +
            `alors que ${String(observed[priority])} constat(s) de cette priorité ` +
            `sont enregistrés. Aucune valeur n'est corrigée.`,
          expected: String(expected[priority]),
          observed: String(observed[priority]),
        });
      }
    }

    const totalExpected = PRIORITIES.reduce((sum, priority) => sum + expected[priority], 0);
    if (metadata.totalFindings !== totalExpected) {
      diagnostics.push({
        code: 'counter-mismatch',
        auditId,
        message:
          `Le total annoncé (${String(metadata.totalFindings)}) diffère de la somme des ` +
          `cinq compteurs (${String(totalExpected)}). Aucune valeur n'est corrigée.`,
        expected: String(totalExpected),
        observed: String(metadata.totalFindings),
      });
    }

    return diagnostics;
  }

  /**
   * Contrôle 3 — origine du compteur `info` sur une ligne antérieure à la 009.
   *
   * @param auditId - Audit concerné.
   * @param audit - Audit chargé.
   * @returns Anomalie d'origine, s'il y a lieu.
   */
  private checkInfoOrigin(auditId: number, audit: Audit): AuditDiagnostic[] {
    if (audit.metadata.infoFindings !== 0) {
      return [];
    }

    const appliedAt = this.infoMigrationAppliedAt();
    if (appliedAt === null) {
      return [];
    }

    const createdAt = audit.metadata.createdAt;
    if (createdAt === undefined) {
      return [];
    }

    const createdTime = Date.parse(createdAt);
    const migrationTime = Date.parse(appliedAt);
    if (Number.isNaN(createdTime) || Number.isNaN(migrationTime) || createdTime >= migrationTime) {
      return [];
    }

    return [
      {
        code: 'unknown-origin-zero',
        auditId,
        message:
          `Le compteur « info » vaut 0 alors que cet audit est antérieur à la migration 009 ` +
          `(${appliedAt}). Le zéro provient de la valeur par défaut de la migration : ` +
          `son origine est inconnue (mesure réelle ou absence de mesure). ` +
          `Aucune attribution rétroactive n'est faite.`,
        expected: 'inconnue',
        observed: '0',
      },
    ];
  }

  /**
   * Date d'application de la migration 009, si elle est connue.
   *
   * @returns Horodatage ISO, ou `null` si la migration n'est pas tracée.
   */
  private infoMigrationAppliedAt(): string | null {
    if (!this.tableExists('schema_migrations')) {
      return null;
    }

    const row = this.db
      .prepare('SELECT applied_at FROM schema_migrations WHERE version = ?')
      .get(INFO_MIGRATION_VERSION) as { applied_at: string } | undefined;

    return row?.applied_at ?? null;
  }

  /**
   * Charge un audit complet, ou `undefined` si `info_findings` n'existe pas
   * encore (base antérieure à la migration 009 non appliquée).
   *
   * @param id - Identifiant de l'audit.
   * @returns Audit chargé ou `undefined`.
   */
  private loadAudit(id: number): Audit | undefined {
    if (this.infoColumnAvailable === undefined) {
      this.infoColumnAvailable = this.columnExists('audit_metadata', 'info_findings');
    }

    const infoExpression = this.infoColumnAvailable ? 'info_findings' : '0 AS info_findings';

    const metadata = this.db
      .prepare(
        `SELECT id, url, timestamp, overall_score, total_findings, critical_findings,
                high_findings, medium_findings, low_findings, ${infoExpression},
                project_id, created_at
           FROM audit_metadata WHERE id = ?`,
      )
      .get(id) as
      | {
          id: number;
          url: string;
          timestamp: string;
          overall_score: number | null;
          total_findings: number;
          critical_findings: number;
          high_findings: number;
          medium_findings: number;
          low_findings: number;
          info_findings: number;
          project_id: string | null;
          created_at: string | null;
        }
      | undefined;

    if (metadata === undefined) {
      return undefined;
    }

    const findings = this.db
      .prepare(
        `SELECT id, audit_id, dimension, title, description, severity, effort, impact,
                priority, recommendation
           FROM audit_findings WHERE audit_id = ? ORDER BY id`,
      )
      .all(id) as Array<{
      id: number;
      audit_id: number;
      dimension: Audit['findings'][number]['dimension'];
      title: string;
      description: string | null;
      severity: Audit['findings'][number]['severity'];
      effort: Audit['findings'][number]['effort'];
      impact: Audit['findings'][number]['impact'];
      priority: Priority;
      recommendation: string | null;
    }>;

    const dimensions = this.db
      .prepare(
        `SELECT audit_id, dimension, score, findings_count
           FROM audit_dimensions WHERE audit_id = ? ORDER BY id`,
      )
      .all(id) as Array<{
      audit_id: number;
      dimension: Audit['dimensions'][number]['dimension'];
      score: number | null;
      findings_count: number;
    }>;

    const createdAt = metadata.created_at ?? undefined;

    return {
      metadata: {
        id: metadata.id,
        url: metadata.url,
        timestamp: metadata.timestamp,
        overallScore: metadata.overall_score,
        totalFindings: metadata.total_findings,
        criticalFindings: metadata.critical_findings,
        highFindings: metadata.high_findings,
        mediumFindings: metadata.medium_findings,
        lowFindings: metadata.low_findings,
        infoFindings: metadata.info_findings,
        projectId: metadata.project_id,
        ...(createdAt === undefined ? {} : { createdAt }),
      },
      dimensions: dimensions.map((row) => ({
        auditId: row.audit_id,
        dimension: row.dimension,
        score: row.score,
        findingsCount: row.findings_count,
      })),
      findings: findings.map((row) => ({
        id: row.id,
        auditId: row.audit_id,
        dimension: row.dimension,
        title: row.title,
        ...(row.description === null ? {} : { description: row.description }),
        severity: row.severity,
        effort: row.effort,
        impact: row.impact,
        priority: row.priority,
        ...(row.recommendation === null ? {} : { recommendation: row.recommendation }),
      })),
    };
  }

  /** La table existe-t-elle dans le schéma principal ? */
  private tableExists(table: string): boolean {
    const row = this.db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
      .get(table) as { name: string } | undefined;

    return row !== undefined;
  }

  /** La colonne existe-t-elle sur la table ? */
  private columnExists(table: string, column: string): boolean {
    const rows = this.db.pragma(`table_info(${table})`) as Array<{ name: string }>;
    return rows.some((row) => row.name === column);
  }
}
