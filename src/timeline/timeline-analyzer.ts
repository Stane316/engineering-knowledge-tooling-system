import type Database from 'better-sqlite3';

import type { AnalysisDimension } from '../analysis/types.js';
import { ProjectNotFoundError, ValidationError } from '../shared/errors.js';
import { AuditRepository } from '../storage/audit-repository.js';
import type { Audit } from '../storage/types.js';
import { ProjectRepository } from '../data/repositories/project-repository.js';
import type { DimensionTimeline, DimensionScorePoint, TimelineAnalysis } from './timeline.types.js';

/** Les 5 dimensions d'analyse, dans l'ordre canonique de restitution. */
const DIMENSIONS: readonly AnalysisDimension[] = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
] as const;

/** Date de repli des analyses vides (aucun audit rattaché). */
const EPOCH = new Date(0);

/**
 * Analyse la timeline d'un projet (Sprint 14).
 *
 * Construit la série chronologique des audits d'un projet et les séries
 * par dimension (scores + constats). La classification des tendances est
 * déléguée à {@link TrendDetector}.
 *
 * Cas limites (C14.15) :
 * - projet absent → `ProjectNotFoundError` (code CLI 3) ;
 * - projet sans audit → analyse vide (`totalAudits: 0`), sans erreur.
 */
export class TimelineAnalyzer {
  private readonly auditRepo: AuditRepository;
  private readonly projectRepo: ProjectRepository;

  /**
   * @param db - Connexion better-sqlite3 ouverte (schémas initialisés).
   */
  constructor(db: Database.Database) {
    this.auditRepo = new AuditRepository(db);
    this.projectRepo = new ProjectRepository(db);
  }

  /**
   * Analyse complète de la timeline d'un projet.
   *
   * @param projectId - Identifiant UUID du projet.
   * @param options - `limit` : nombre maximal d'audits (défaut 500) ;
   *   `start`/`end` : fenêtre de dates (bornes inclusives, filtrée avant le
   *   calcul des séries — options `--start`/`--end`, Sprint 14-3).
   * @returns Analyse triée chronologiquement (croissant).
   * @throws {ProjectNotFoundError} Projet absent de la base.
   * @throws {ValidationError} Fenêtre incohérente (`start` > `end`).
   */
  async analyze(
    projectId: string,
    options: { readonly limit?: number; readonly start?: Date; readonly end?: Date } = {},
  ): Promise<TimelineAnalysis> {
    const project = this.projectRepo.getById(projectId);
    if (project === null) {
      throw new ProjectNotFoundError(projectId);
    }

    if (options.start !== undefined && options.end !== undefined && options.start > options.end) {
      throw new ValidationError(['fenêtre de dates invalide : --start est postérieur à --end']);
    }

    let audits = this.auditRepo.listByProject(projectId, options.limit ?? 500);
    if (options.start !== undefined || options.end !== undefined) {
      audits = audits.filter((audit) => {
        const timestamp = new Date(audit.metadata.timestamp);
        if (options.start !== undefined && timestamp < options.start) return false;
        if (options.end !== undefined && timestamp > options.end) return false;
        return true;
      });
    }
    const dimensionScores = DIMENSIONS.map((dimension) =>
      this.buildDimensionTimeline(dimension, audits),
    );

    const first = audits[0];
    const last = audits[audits.length - 1];
    return {
      projectId,
      projectName: project.name,
      audits,
      startDate: first ? new Date(first.metadata.timestamp) : EPOCH,
      endDate: last ? new Date(last.metadata.timestamp) : EPOCH,
      totalAudits: audits.length,
      dimensionScores,
    };
  }

  /**
   * Audits du projet situés dans une plage de dates (bornes inclusives).
   *
   * @param projectId - Identifiant UUID du projet.
   * @param start - Début de la plage (inclusive).
   * @param end - Fin de la plage (inclusive).
   * @returns Audits filtrés, ordre chronologique conservé.
   * @throws {ProjectNotFoundError} Projet absent de la base.
   */
  async getAuditsByDateRange(projectId: string, start: Date, end: Date): Promise<Audit[]> {
    const project = this.projectRepo.getById(projectId);
    if (project === null) {
      throw new ProjectNotFoundError(projectId);
    }

    return this.auditRepo.listByProject(projectId).filter((audit) => {
      const auditDate = new Date(audit.metadata.timestamp);
      return auditDate >= start && auditDate <= end;
    });
  }

  /**
   * Construit la série d'une dimension à partir des audits hydratés.
   *
   * @param dimension - Dimension à extraire.
   * @param audits - Audits triés chronologiquement.
   * @returns Timeline avec statistiques (moyenne, min, max) et tendance
   *   provisoire (`stable`) — la valeur finale vient de `TrendDetector`.
   */
  private buildDimensionTimeline(dimension: AnalysisDimension, audits: Audit[]): DimensionTimeline {
    const scores: DimensionScorePoint[] = audits.map((audit) => {
      const row = audit.dimensions.find((d) => d.dimension === dimension);
      return {
        auditId: audit.metadata.id ?? 0,
        date: new Date(audit.metadata.timestamp),
        // Aucun `0` de remplacement : un score absent ou indisponible reste `null`.
        score: row?.score ?? null,
        findingsCount: row?.findingsCount ?? 0,
      };
    });

    if (scores.length === 0) {
      return {
        dimension,
        scores,
        trend: { direction: 'stable', slope: 0, confidence: 0, description: 'Aucune donnée' },
        averageScore: 0,
        minScore: 0,
        maxScore: 0,
      };
    }

    // Seuls les points réellement mesurés participent aux statistiques.
    const measured = scores
      .map((point) => point.score)
      .filter((score): score is number => score !== null);

    if (measured.length === 0) {
      return {
        dimension,
        scores,
        trend: {
          direction: 'stable',
          slope: 0,
          confidence: 0,
          description: 'Aucun score mesuré',
        },
        averageScore: 0,
        minScore: 0,
        maxScore: 0,
      };
    }

    const total = measured.reduce((sum, score) => sum + score, 0);
    return {
      dimension,
      scores,
      trend: {
        direction: 'stable',
        slope: 0,
        confidence: 0,
        description: 'À calculer par TrendDetector',
      },
      averageScore: total / measured.length,
      minScore: Math.min(...measured),
      maxScore: Math.max(...measured),
    };
  }
}
