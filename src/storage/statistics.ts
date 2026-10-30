import type { Database } from 'better-sqlite3';

import type { AnalysisDimension, Priority } from '../analysis/types.js';
import { ValidationError } from '../shared/errors.js';

import type { AuditStatistics, DimensionStatistics, ScoreTrend, TopIssue } from './types.js';

/** Agrégats SQL bruts de `audit_metadata`. */
interface GlobalRow {
  totalAudits: number;
  averageScore: number | null;
  minScore: number | null;
  maxScore: number | null;
  totalFindings: number | null;
  criticalFindings: number | null;
  highFindings: number | null;
  mediumFindings: number | null;
  lowFindings: number | null;
  infoFindings: number | null;
}

/** Agrégats SQL bruts d'une dimension. */
interface DimensionRow {
  dimension: AnalysisDimension;
  averageScore: number;
  minScore: number;
  maxScore: number;
  totalFindings: number;
}

/** Regroupement SQL des constats fréquents. */
interface TopIssueRow {
  title: string;
  dimension: AnalysisDimension;
  severity: number;
  priority: Priority;
  count: number;
}

/** Expressions SQLite de regroupement temporel (colonnes fermées, jamais utilisateur). */
const PERIOD_EXPRESSIONS = {
  day: 'DATE(timestamp)',
  week: "strftime('%Y-W%W', timestamp)",
  month: "strftime('%Y-%m', timestamp)",
} as const;

/** Tranches de la distribution des scores. */
const SCORE_RANGES: ReadonlyArray<{ label: string; min: number; max: number }> = [
  { label: '0-20', min: 0, max: 20 },
  { label: '21-40', min: 21, max: 40 },
  { label: '41-60', min: 41, max: 60 },
  { label: '61-80', min: 61, max: 80 },
  { label: '81-100', min: 81, max: 100 },
];

/** Agrégat SQL → statistiques typées (NULL = table vide). */
function toStatistics(row: GlobalRow): AuditStatistics {
  return {
    totalAudits: row.totalAudits,
    averageScore: Math.round(row.averageScore ?? 0),
    minScore: row.minScore ?? 0,
    maxScore: row.maxScore ?? 0,
    totalFindings: row.totalFindings ?? 0,
    criticalFindings: row.criticalFindings ?? 0,
    highFindings: row.highFindings ?? 0,
    mediumFindings: row.mediumFindings ?? 0,
    lowFindings: row.lowFindings ?? 0,
    infoFindings: row.infoFindings ?? 0,
  };
}

/**
 * Statistiques d'audits (Sprint 10-3).
 *
 * Agrégations SQL pures sur les trois tables du module : scores globaux,
 * tendances par période, statistiques par dimension, constats récurrents et
 * distribution. Aucune écriture, aucune navigation — appelées par le Sprint 11
 * (rapports et historique).
 */
export class AuditStatisticsManager {
  /**
   * @param db - Connexion ouverte sur le schéma d'audits.
   */
  constructor(private readonly db: Database) {}

  /**
   * Statistiques globales (scores et comptes de constats).
   *
   * @returns Agrégats sur **tous** les audits ; zéros si la table est vide.
   */
  getStatistics(): AuditStatistics {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS totalAudits,
                AVG(overall_score) AS averageScore,
                MIN(overall_score) AS minScore,
                MAX(overall_score) AS maxScore,
                SUM(total_findings) AS totalFindings,
                SUM(critical_findings) AS criticalFindings,
                SUM(high_findings) AS highFindings,
                SUM(medium_findings) AS mediumFindings,
                SUM(low_findings) AS lowFindings,
                SUM(info_findings) AS infoFindings
           FROM audit_metadata`,
      )
      .get() as GlobalRow;

    return toStatistics(row);
  }

  /**
   * Tendance des scores moyens par période.
   *
   * @param period - Granularité : `day`, `week` (défaut) ou `month`.
   * @param limit - Nombre maximal de périodes retenues, de la plus récente à
   *   la plus ancienne (défaut : 30).
   * @returns Agrégats par période, triés du plus récent au plus ancien.
   */
  getTrend(period: 'day' | 'week' | 'month' = 'week', limit = 30): ScoreTrend[] {
    const expression = PERIOD_EXPRESSIONS[period];

    const rows = this.db
      .prepare(
        `SELECT ${expression} AS date,
                AVG(overall_score) AS averageScore,
                COUNT(*) AS auditCount
           FROM audit_metadata
          GROUP BY ${expression}
          ORDER BY date DESC
          LIMIT ?`,
      )
      .all(limit) as Array<{ date: string; averageScore: number; auditCount: number }>;

    return rows.map((row) => ({
      date: row.date,
      averageScore: Math.round(row.averageScore),
      auditCount: row.auditCount,
    }));
  }

  /**
   * Statistiques agrégées par dimension (5 lignes dès qu'un audit existe).
   *
   * @returns Scores min/max/moyen et constats pour chaque dimension.
   */
  getDimensionStatistics(): DimensionStatistics[] {
    const rows = this.db
      .prepare(
        `SELECT dimension,
                AVG(score) AS averageScore,
                MIN(score) AS minScore,
                MAX(score) AS maxScore,
                SUM(findings_count) AS totalFindings
           FROM audit_dimensions
          GROUP BY dimension
          ORDER BY dimension ASC`,
      )
      .all() as DimensionRow[];

    return rows.map((row) => ({
      dimension: row.dimension,
      averageScore: Math.round(row.averageScore),
      minScore: row.minScore,
      maxScore: row.maxScore,
      totalFindings: row.totalFindings,
    }));
  }

  /**
   * Constats les plus répandus, avec part des audits touchés.
   *
   * @param limit - Nombre maximal de regroupements (défaut : 10).
   * @returns Regroupements triés par nombre d'audits touchés décroissant.
   * @throws {ValidationError} Limite invalide (entier > 0 attendu).
   */
  getTopIssues(limit = 10): TopIssue[] {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationError([`limit invalide (${String(limit)})`]);
    }

    const totalRow = this.db.prepare('SELECT COUNT(*) AS n FROM audit_metadata').get() as {
      n: number;
    };
    const totalAudits = totalRow.n;

    const rows = this.db
      .prepare(
        `SELECT title, dimension, severity, priority,
                COUNT(DISTINCT audit_id) AS count
           FROM audit_findings
          GROUP BY title, dimension, severity, priority
          ORDER BY count DESC, severity DESC, title ASC
          LIMIT ?`,
      )
      .all(limit) as TopIssueRow[];

    return rows.map((row) => ({
      title: row.title,
      dimension: row.dimension,
      severity: row.severity,
      priority: row.priority,
      count: row.count,
      percentage: totalAudits > 0 ? Math.round((row.count / totalAudits) * 100) : 0,
    }));
  }

  /**
   * Statistiques globales restreintes à une URL.
   *
   * @param url - URL analysée.
   * @returns Agrégats des audits de cette URL ; zéros si aucune occurrence.
   */
  getStatisticsForUrl(url: string): AuditStatistics {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS totalAudits,
                AVG(overall_score) AS averageScore,
                MIN(overall_score) AS minScore,
                MAX(overall_score) AS maxScore,
                SUM(total_findings) AS totalFindings,
                SUM(critical_findings) AS criticalFindings,
                SUM(high_findings) AS highFindings,
                SUM(medium_findings) AS mediumFindings,
                SUM(low_findings) AS lowFindings,
                SUM(info_findings) AS infoFindings
           FROM audit_metadata
          WHERE url = ?`,
      )
      .get(url) as GlobalRow;

    return toStatistics(row);
  }

  /**
   * Distribution des scores globaux par tranche.
   *
   * @returns Nombre d'audits par tranche (`0-20` … `81-100`).
   */
  getScoreDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    const statement = this.db.prepare(
      'SELECT COUNT(*) AS n FROM audit_metadata WHERE overall_score BETWEEN ? AND ?',
    );

    for (const range of SCORE_RANGES) {
      const row = statement.get(range.min, range.max) as { n: number };
      distribution[range.label] = row.n;
    }

    return distribution;
  }
}
