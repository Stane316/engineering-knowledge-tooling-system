import type { AnalysisDimension } from '../analysis/types.js';
import type { Audit, AuditFinding } from '../storage/types.js';

/**
 * Types des rapports d'inspection (Sprint 11).
 *
 * Le module `src/reports/` consomme les {@link Audit} du Sprint 10 pour
 * produire des documents Markdown (humains) et PDF (imprimables, via
 * Puppeteer), ainsi que des comparaisons avant/après.
 */

/** Formats de sortie demandés par l'appelant. */
export type ReportFormat = 'markdown' | 'pdf' | 'both';

/** Sections reconnaissables d'un rapport d'audit. */
export type ReportSection =
  | 'header'
  | 'summary'
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'ux'
  | 'content'
  | 'findings'
  | 'recommendations'
  | 'context-recommendations';

/** Options de génération d'un rapport. */
export interface ReportOptions {
  /** Format demandé (`markdown`, `pdf`, `both`). */
  format: ReportFormat;
  /** Dossier de sortie ; absent = contenu en mémoire uniquement. */
  outputPath?: string;
  /** Sections à inclure (défaut : toutes). */
  includeSections?: ReportSection[];
  /** Titre du document (défaut : « Rapport d'audit »). */
  title?: string;
  /** Projet ciblé pour la section « context-recommendations » (Sprint 16).
   *  Défaut : `audit.metadata.projectId` quand la section est demandée. */
  projectId?: string;
}

/** Rapport généré (contenu toujours présent, fichier si demandé). */
export interface GeneratedReport {
  /** Identifiant de l'audit source. */
  auditId: number;
  /** Format produit. */
  format: 'markdown' | 'pdf';
  /** Contenu : texte Markdown, ou base64 pour le PDF. */
  content: string;
  /** Chemin du fichier écrit, si `outputPath` était fourni. */
  filePath?: string;
  /** Horodatage ISO de génération. */
  generatedAt: string;
}

/** Évolution du score global entre deux audits. */
export interface ScoreEvolution {
  /** Score de l'audit A (ancien). */
  scoreA: number;
  /** Score de l'audit B (récent). */
  scoreB: number;
  /** Écart en points (B − A). */
  delta: number;
  /** Écart relatif en pourcent (0 si A ≤ 0). */
  percentage: number;
  /** Tendance : `+5` franchi à la hausse/baisse, sinon stable. */
  trend: 'improving' | 'degrading' | 'stable';
}

/** Delta de score d'une dimension. */
export interface DimensionDelta {
  /** Dimension comparée. */
  dimension: AnalysisDimension;
  /** Score dans l'audit A. */
  scoreA: number;
  /** Score dans l'audit B. */
  scoreB: number;
  /** Écart en points (B − A). */
  delta: number;
  /** Écart relatif en pourcent (0 si A ≤ 0). */
  percentage: number;
}

/** Regroupement des constats entre deux audits. */
export interface FindingsDelta {
  /** Présents dans B, absents de A. */
  newFindings: AuditFinding[];
  /** Présents dans A, absents de B. */
  resolvedFindings: AuditFinding[];
  /** Présents dans les deux (même dimension, titre et sévérité). */
  persistentFindings: AuditFinding[];
  /** Persistants dont la sévérité a baissé. */
  improvedFindings: AuditFinding[];
}

/** Rapport de comparaison de deux audits. */
export interface ComparisonReport {
  /** Audit A (ancien). */
  auditA: Audit;
  /** Audit B (récent). */
  auditB: Audit;
  /** Deltas par dimension. */
  deltaScores: DimensionDelta[];
  /** Deltas de constats. */
  deltaFindings: FindingsDelta;
  /** Évolution du score global. */
  evolution: ScoreEvolution;
  /** Recommandations actionnables déduites de la comparaison. */
  recommendations: string[];
}
