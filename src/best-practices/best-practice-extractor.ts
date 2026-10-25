import type Database from 'better-sqlite3';

import type { AnalysisDimension } from '../analysis/types.js';
import type { AuditFinding, AuditMetadata } from '../storage/types.js';

import type {
  BestPractice,
  BestPracticeCategory,
  ExtractionReport,
} from './best-practice.types.js';
import type { BestPracticeRepository } from './best-practice-repository.js';

/**
 * Critères minimum pour extraire une bonne pratique (configurables).
 */
export interface ExtractionCriteria {
  /** Nombre minimum d'occurrences du finding (défaut : 2). */
  minOccurrences: number;
  /** Nombre minimum d'audits du projet pour l'analyse (défaut : 2). */
  minAudits: number;
  /** Score minimum de confiance pour une association (défaut : 0.5). */
  minConfidence: number;
}

/** Valeurs par défaut des critères d'extraction. */
export const DEFAULT_EXTRACTION_CRITERIA: ExtractionCriteria = {
  minOccurrences: 2,
  minAudits: 2,
  minConfidence: 0.5,
};

/** Groupe de findings regroupés par (titre normalisé, dimension). */
interface FindingGroup {
  /** Titre normalisé (clé de regroupement). */
  normalizedTitle: string;
  /** Titre original (premier rencontré). */
  originalTitle: string;
  /** Dimension du constat. */
  dimension: AnalysisDimension;
  /** Nombre d'occurrences. */
  count: number;
  /** IDs des audits où le finding apparaît. */
  auditIds: number[];
  /** IDs des projets source. */
  projectIds: string[];
  /** Recommandation la plus détaillée rencontrée. */
  recommendation: string;
  /** Sévérité moyenne (0-4). */
  avgSeverity: number;
}

/** Ligne brute `audit_metadata` (colonnes SQL snake_case). */
interface AuditMetadataRow {
  id: number;
  url: string;
  timestamp: string;
  overall_score: number;
  project_id: string | null;
}

/** Ligne brute `audit_findings` (colonnes SQL snake_case). */
interface AuditFindingRow {
  id: number;
  audit_id: number;
  dimension: AnalysisDimension;
  title: string;
  severity: number;
  recommendation: string | null;
}

/**
 * Extracteur automatique de bonnes pratiques depuis les audits (Sprint 15,
 * ADR-034).
 *
 * Algorithme :
 * 1. Collecter les findings des audits d'un projet (triés par date) ;
 * 2. Les regrouper par (titre normalisé, dimension) ;
 * 3. Détecter les constats **résolus** : présent dans l'audit N, absent de
 *    l'audit N+1 **et** score de la dimension en amélioration ;
 * 4. Extraire chaque groupe résolu avec ≥ `minOccurrences` occurrences
 *    (fusion avec une pratique existante de même titre normalisé sinon) ;
 * 5. Lier les findings courants aux pratiques correspondantes (confiance ≥
 *    `minConfidence`).
 *
 * Déduplication : **égalité du titre normalisé** (minuscules, ponctuation
 * retirée, espaces réduits). La distance de levenshtein < 3 annoncée par le
 * document parent n'est pas implémentée (écart P3 soumis : égalité stricte,
 * sans faux rapprochements).
 *
 * API synchrone (better-sqlite3), conforme aux repositories du dépôt.
 */
export class BestPracticeExtractor {
  private readonly db: Database.Database;
  private readonly repo: BestPracticeRepository;
  private readonly criteria: ExtractionCriteria;

  /**
   * @param db - Connexion SQLite (schéma audits + migration 005).
   * @param repo - Repository de destination.
   * @param criteria - Critères partiels surchargeant les défauts.
   */
  constructor(
    db: Database.Database,
    repo: BestPracticeRepository,
    criteria?: Partial<ExtractionCriteria>,
  ) {
    this.db = db;
    this.repo = repo;
    this.criteria = { ...DEFAULT_EXTRACTION_CRITERIA, ...criteria };
  }

  /**
   * Extrait les bonnes pratiques depuis les audits d'un projet.
   *
   * @param projectId - Projet à analyser.
   * @returns Rapport d'extraction (non bloquant : 0 audit = rapport vide).
   */
  extractFromProject(projectId: string): ExtractionReport {
    const startTime = Date.now();

    const audits = this.getProjectAudits(projectId);
    if (audits.length < this.criteria.minAudits) {
      return {
        auditsAnalyzed: audits.length,
        practicesExtracted: 0,
        practicesMerged: 0,
        linksCreated: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const allFindings = this.getAllFindings(
      audits.flatMap((audit) => (audit.id === undefined ? [] : [audit.id])),
    );
    const groups = this.groupFindings(allFindings, audits);
    const resolvedFindings = this.detectResolvedFindings(audits, allFindings);

    const extractable = groups.filter(
      (group) =>
        group.count >= this.criteria.minOccurrences &&
        resolvedFindings.has(`${group.normalizedTitle}|${group.dimension}`),
    );

    let practicesExtracted = 0;
    let practicesMerged = 0;

    for (const group of extractable) {
      const existing = this.findExistingPractice(group.normalizedTitle, group.dimension);

      if (existing !== null) {
        this.repo.incrementOccurrence(existing.id, projectId);
        practicesMerged += 1;
      } else {
        this.repo.create({
          title: group.originalTitle,
          description:
            group.recommendation.length > 0
              ? group.recommendation
              : `Résoudre le constat : ${group.originalTitle}`,
          category: group.dimension as BestPracticeCategory,
          tags: this.extractTags(group),
          sourceProjectIds: group.projectIds,
          sourceAuditIds: group.auditIds,
          isManual: false,
        });
        practicesExtracted += 1;
      }
    }

    const linksCreated = this.linkCurrentFindingsToPractices(allFindings);

    return {
      auditsAnalyzed: audits.length,
      practicesExtracted,
      practicesMerged,
      linksCreated,
      durationMs: Date.now() - startTime,
    };
  }

  /** Audits d'un projet triés chronologiquement (rows SQL → {@link AuditMetadata}). */
  private getProjectAudits(projectId: string): AuditMetadata[] {
    const rows = this.db
      .prepare(
        `SELECT id, url, timestamp, overall_score, project_id
         FROM audit_metadata
         WHERE project_id = ?
         ORDER BY timestamp ASC`,
      )
      .all(projectId) as AuditMetadataRow[];

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      timestamp: row.timestamp,
      overallScore: row.overall_score,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      projectId: row.project_id,
    }));
  }

  /** Findings des audits donnés (rows SQL → {@link AuditFinding}). */
  private getAllFindings(auditIds: readonly number[]): AuditFinding[] {
    if (auditIds.length === 0) {
      return [];
    }

    const placeholders = auditIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, audit_id, dimension, title, severity, recommendation
         FROM audit_findings
         WHERE audit_id IN (${placeholders})`,
      )
      .all(...auditIds) as AuditFindingRow[];

    return rows.map((row) => ({
      id: row.id,
      auditId: row.audit_id,
      dimension: row.dimension,
      title: row.title,
      severity: row.severity,
      effort: 1,
      impact: 1,
      priority: 'low',
      recommendation: row.recommendation ?? undefined,
    }));
  }

  /** Regroupe les findings par (titre normalisé, dimension). */
  private groupFindings(
    findings: readonly AuditFinding[],
    audits: readonly AuditMetadata[],
  ): FindingGroup[] {
    const auditProjectMap = new Map<number, string>();
    for (const audit of audits) {
      if (audit.id !== undefined && audit.projectId !== undefined && audit.projectId !== null) {
        auditProjectMap.set(audit.id, audit.projectId);
      }
    }

    const groups = new Map<string, FindingGroup>();

    for (const finding of findings) {
      const normalized = this.normalizeTitle(finding.title);
      const key = `${normalized}|${finding.dimension}`;

      let group = groups.get(key);
      if (group === undefined) {
        group = {
          normalizedTitle: normalized,
          originalTitle: finding.title,
          dimension: finding.dimension,
          count: 0,
          auditIds: [],
          projectIds: [],
          recommendation: finding.recommendation ?? '',
          avgSeverity: 0,
        };
        groups.set(key, group);
      }

      group.count += 1;
      if (!group.auditIds.includes(finding.auditId)) {
        group.auditIds.push(finding.auditId);
      }

      const projectId = auditProjectMap.get(finding.auditId);
      if (projectId !== undefined && !group.projectIds.includes(projectId)) {
        group.projectIds.push(projectId);
      }

      group.avgSeverity = (group.avgSeverity * (group.count - 1) + finding.severity) / group.count;

      const recommendation = finding.recommendation ?? '';
      if (recommendation.length > group.recommendation.length) {
        group.recommendation = recommendation;
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Détecte les constats résolus : disparition entre deux audits consécutifs
   * **et** amélioration du score de la dimension concernée.
   *
   * @returns Clés `titreNormalisé|dimension` résolues.
   */
  private detectResolvedFindings(
    audits: readonly AuditMetadata[],
    findings: readonly AuditFinding[],
  ): Set<string> {
    const resolved = new Set<string>();

    const findingsByAudit = new Map<number, AuditFinding[]>();
    for (const finding of findings) {
      const bucket = findingsByAudit.get(finding.auditId);
      if (bucket === undefined) {
        findingsByAudit.set(finding.auditId, [finding]);
      } else {
        bucket.push(finding);
      }
    }

    for (let index = 0; index < audits.length - 1; index += 1) {
      const currentAudit = audits[index];
      const nextAudit = audits[index + 1];
      if (currentAudit === undefined || nextAudit === undefined) {
        continue;
      }

      const currentFindings =
        currentAudit.id === undefined ? [] : (findingsByAudit.get(currentAudit.id) ?? []);
      const nextFindings = nextFindingsList(findingsByAudit, nextAudit.id);

      const nextKeys = new Set(
        nextFindings.map((finding) => `${this.normalizeTitle(finding.title)}|${finding.dimension}`),
      );

      for (const finding of currentFindings) {
        const key = `${this.normalizeTitle(finding.title)}|${finding.dimension}`;
        if (nextKeys.has(key)) {
          continue;
        }
        if (
          this.checkScoreImprovement(currentAudit.id, nextAudit.id, finding.dimension) &&
          currentAudit.id !== undefined
        ) {
          resolved.add(key);
        }
      }
    }

    return resolved;
  }

  /** Le score de la dimension a-t-il augmenté entre les deux audits ? */
  private checkScoreImprovement(
    auditIdFrom: number | undefined,
    auditIdTo: number | undefined,
    dimension: AnalysisDimension,
  ): boolean {
    if (auditIdFrom === undefined || auditIdTo === undefined) {
      return false;
    }

    const stmt = this.db.prepare(
      'SELECT score FROM audit_dimensions WHERE audit_id = ? AND dimension = ?',
    );
    const from = stmt.get(auditIdFrom, dimension) as { score: number } | undefined;
    const to = stmt.get(auditIdTo, dimension) as { score: number } | undefined;

    if (from === undefined || to === undefined) {
      return false;
    }
    return to.score > from.score;
  }

  /** Pratique existante de même titre normalisé et dimension (fusion). */
  private findExistingPractice(
    normalizedTitle: string,
    dimension: AnalysisDimension,
  ): BestPractice | null {
    const candidates = this.repo.list({ category: dimension as BestPracticeCategory, limit: 1000 });

    for (const practice of candidates) {
      if (
        this.normalizeTitle(practice.title) === normalizedTitle &&
        practice.category === dimension
      ) {
        return practice;
      }
    }
    return null;
  }

  /** Lie les findings courants aux pratiques correspondantes (confiance ≥ min). */
  private linkCurrentFindingsToPractices(findings: readonly AuditFinding[]): number {
    let linksCreated = 0;

    const uniqueFindings = new Map<string, AuditFinding>();
    for (const finding of findings) {
      const key = `${this.normalizeTitle(finding.title)}|${finding.dimension}`;
      if (!uniqueFindings.has(key)) {
        uniqueFindings.set(key, finding);
      }
    }

    for (const finding of uniqueFindings.values()) {
      if (this.repo.findByFinding(finding.title, finding.dimension).length > 0) {
        // Déjà lié : idempotence d'une extraction sur la même base.
        continue;
      }

      for (const practice of this.findMatchingPractices(finding)) {
        const confidence = this.calculateConfidence(finding, practice);
        if (confidence >= this.criteria.minConfidence) {
          this.repo.linkToFinding(practice.id, finding.title, finding.dimension, confidence);
          linksCreated += 1;
        }
      }
    }

    return linksCreated;
  }

  /** Pratiques de la même catégorie au titre normalisé identique. */
  private findMatchingPractices(finding: AuditFinding): BestPractice[] {
    const normalized = this.normalizeTitle(finding.title);
    const candidates = this.repo.list({
      category: finding.dimension as BestPracticeCategory,
      limit: 1000,
    });
    return candidates.filter((practice) => this.normalizeTitle(practice.title) === normalized);
  }

  /**
   * Confiance de l'association : base 0.5, +0.05/occurrence (plafond 0.3),
   * +0.05/sevérité (0-4) — plafonné à 1.
   */
  private calculateConfidence(finding: AuditFinding, practice: BestPractice): number {
    let confidence = 0.5;
    confidence += Math.min(0.3, practice.occurrenceCount * 0.05);
    confidence += finding.severity * 0.05;
    return Math.min(1.0, confidence);
  }

  /** Normalise un titre pour le regroupement (minuscules, sans ponctuation). */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿç]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Tags : dimension + premier mot significatif du titre + sévérité élevée. */
  private extractTags(group: FindingGroup): string[] {
    const tags: string[] = [group.dimension];

    const words = group.originalTitle
      .toLowerCase()
      .split(/\s+/u)
      .filter((word) => word.length > 3);
    if (words.length > 0 && words[0] !== undefined) {
      tags.push(words[0]);
    }

    if (group.avgSeverity >= 3) {
      tags.push('high-severity');
    }

    return Array.from(new Set(tags));
  }
}

/** Findings d'un audit (lecture sûre de la Map). */
function nextFindingsList(
  findingsByAudit: ReadonlyMap<number, AuditFinding[]>,
  auditId: number | undefined,
): AuditFinding[] {
  if (auditId === undefined) {
    return [];
  }
  return findingsByAudit.get(auditId) ?? [];
}
