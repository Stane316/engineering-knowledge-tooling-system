import type Database from 'better-sqlite3';

import type { AnalysisDimension, Priority, Severity } from '../analysis/types.js';
import type { BestPracticeService } from '../best-practices/best-practice-service.js';
import type { ProjectContext } from './recommendation.types.js';

/**
 * Constructeur du contexte projet pour le scoring (Sprint 16).
 *
 * Collecte et agrège (SPRINT-16-02.md §3.1) :
 * - les findings courants (dernier audit) ;
 * - les fréquences des findings sur tout l'historique ;
 * - les tendances par dimension (comparaison des 2 derniers audits,
 *   seuil ±5 points) ;
 * - les taux de résolution (disparition entre audits consécutifs) ;
 * - les bonnes pratiques associées (`BestPracticeService`, Sprint 15).
 *
 * **Écart P3 (ordre des tâches)** : ce fichier est une livraison du
 * sous-sprint 16-02, mais l'`RecommendationEngine` de 16-01 en dépend
 * déjà (import du spec) — implémenté ici dès 16-01 d'après la spécification
 * complète 16-02 §3.1 pour éviter un stub jetable ; 16-02 se charge de ses
 * tests dédiés et de l'intégration rapports.
 *
 * Méthode **synchrone** (better-sqlite3) malgré le `Promise` du spec.
 */
export class RecommendationContext {
  private readonly bestPractices?: BestPracticeService;

  constructor(
    private readonly db: Database.Database,
    bestPractices?: BestPracticeService,
  ) {
    this.bestPractices = bestPractices;
  }

  /**
   * Construire le contexte complet d'un projet.
   *
   * Cas limites (C16.20) : 0 audit → findings/fréquences/tendances vides ou
   * `stable` ; 1 audit → tendances `stable`, résolutions vides.
   */
  buildContext(projectId: string): ProjectContext {
    // 1. Audits du projet (ancien → récent).
    const audits = this.getProjectAudits(projectId);

    // 2. Findings courants (dernier audit).
    const currentFindings =
      audits.length > 0 ? this.getAuditFindings(audits[audits.length - 1]!.id) : [];

    // 3. Fréquences sur l'historique complet.
    const findingFrequencies = this.calculateFindingFrequencies(audits);

    // 4. Tendances par dimension (2 derniers audits).
    const dimensionTrends = this.calculateDimensionTrends(projectId);

    // 5. Taux de résolution.
    const resolutionRates = this.calculateResolutionRates(audits);

    // 6. Bonnes pratiques associées.
    const associatedBestPractices = this.findAssociatedBestPractices(currentFindings);

    return {
      projectId,
      totalAudits: audits.length,
      currentFindings: currentFindings.map((finding) => ({
        title: finding.title,
        dimension: finding.dimension,
        severity: finding.severity,
        priority: finding.priority,
      })),
      findingFrequencies,
      dimensionTrends,
      resolutionRates,
      associatedBestPractices,
    };
  }

  /** Audits du projet triés par date croissante (id + timestamp). */
  private getProjectAudits(projectId: string): Array<{ id: number; timestamp: string }> {
    return this.db
      .prepare(
        `SELECT id, timestamp FROM audit_metadata
         WHERE project_id = ?
         ORDER BY timestamp ASC`,
      )
      .all(projectId) as Array<{ id: number; timestamp: string }>;
  }

  /** Findings d'un audit (rows brutes typées). */
  private getAuditFindings(auditId: number): Array<{
    title: string;
    dimension: AnalysisDimension;
    severity: Severity;
    priority: Priority;
  }> {
    return this.db
      .prepare('SELECT title, dimension, severity, priority FROM audit_findings WHERE audit_id = ?')
      .all(auditId) as Array<{
      title: string;
      dimension: AnalysisDimension;
      severity: Severity;
      priority: Priority;
    }>;
  }

  /** Fréquences des findings normalisés sur tous les audits. */
  private calculateFindingFrequencies(
    audits: Array<{ id: number; timestamp: string }>,
  ): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const audit of audits) {
      for (const finding of this.getAuditFindings(audit.id)) {
        const normalized = normalizeTitle(finding.title);
        frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
      }
    }

    return frequencies;
  }

  /**
   * Tendance par dimension : comparaison des 2 derniers audits
   * (≥ +5 → `improving`, ≤ -5 → `declining`, sinon `stable` ;
   * < 2 audits → toutes `stable`).
   */
  private calculateDimensionTrends(
    projectId: string,
  ): Map<AnalysisDimension, 'improving' | 'declining' | 'stable'> {
    const trends = new Map<AnalysisDimension, 'improving' | 'declining' | 'stable'>();
    const dimensions: AnalysisDimension[] = [
      'performance',
      'accessibility',
      'seo',
      'ux',
      'content',
    ];

    const recentAudits = this.db
      .prepare(
        `SELECT id, timestamp FROM audit_metadata
         WHERE project_id = ?
         ORDER BY timestamp DESC
         LIMIT 2`,
      )
      .all(projectId) as Array<{ id: number; timestamp: string }>;

    if (recentAudits.length < 2) {
      for (const dimension of dimensions) {
        trends.set(dimension, 'stable');
      }
      return trends;
    }

    const [latest, previous] = recentAudits;
    if (latest === undefined || previous === undefined) {
      for (const dimension of dimensions) {
        trends.set(dimension, 'stable');
      }
      return trends;
    }

    for (const dimension of dimensions) {
      const latestScore = this.getDimensionScore(latest.id, dimension);
      const previousScore = this.getDimensionScore(previous.id, dimension);

      if (latestScore === null || previousScore === null) {
        trends.set(dimension, 'stable');
        continue;
      }

      const diff = latestScore - previousScore;
      if (diff >= 5) {
        trends.set(dimension, 'improving');
      } else if (diff <= -5) {
        trends.set(dimension, 'declining');
      } else {
        trends.set(dimension, 'stable');
      }
    }

    return trends;
  }

  /** Score d'une dimension pour un audit (`null` si absent). */
  private getDimensionScore(auditId: number, dimension: AnalysisDimension): number | null {
    const row = this.db
      .prepare('SELECT score FROM audit_dimensions WHERE audit_id = ? AND dimension = ?')
      .get(auditId, dimension) as { score: number } | undefined;
    return row === undefined ? null : row.score;
  }

  /**
   * Taux de résolution par finding normalisé :
   * `résolutions / apparitions`, un finding étant « résolu » s'il disparaît
   * entre 2 audits consécutifs (définition 15-01 reprise).
   */
  private calculateResolutionRates(
    audits: Array<{ id: number; timestamp: string }>,
  ): Map<string, number> {
    const rates = new Map<string, number>();
    if (audits.length < 2) {
      return rates;
    }

    const appearances = new Map<string, number>();
    const resolutions = new Map<string, number>();

    for (let index = 0; index < audits.length - 1; index += 1) {
      const currentFindings = this.getAuditFindings(audits[index]!.id);
      const nextFindings = this.getAuditFindings(audits[index + 1]!.id);
      const nextTitles = new Set(nextFindings.map((finding) => normalizeTitle(finding.title)));

      for (const finding of currentFindings) {
        const normalized = normalizeTitle(finding.title);
        appearances.set(normalized, (appearances.get(normalized) ?? 0) + 1);
        if (!nextTitles.has(normalized)) {
          resolutions.set(normalized, (resolutions.get(normalized) ?? 0) + 1);
        }
      }
    }

    for (const [title, count] of appearances) {
      rates.set(title, (resolutions.get(title) ?? 0) / count);
    }

    return rates;
  }

  /** Bonnes pratiques liées aux findings courants (si service injecté). */
  private findAssociatedBestPractices(
    currentFindings: Array<{ title: string; dimension: AnalysisDimension }>,
  ): Map<string, string[]> {
    const associations = new Map<string, string[]>();
    if (this.bestPractices === undefined) {
      return associations;
    }

    for (const finding of currentFindings) {
      const practices = this.bestPractices.findByFinding(finding.title, finding.dimension);
      if (practices.length > 0) {
        associations.set(
          finding.title,
          practices.map((practice) => practice.title),
        );
      }
    }

    return associations;
  }
}

/** Normalisation partagée titre → clé de fréquence/résolution. */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}
