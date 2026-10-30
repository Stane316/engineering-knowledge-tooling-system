import type { AnalysisDimension } from '../analysis/types.js';
import type { Audit, AuditFinding } from '../storage/types.js';

/**
 * Types des rapports d'inspection (Sprint 11).
 *
 * Le module `src/reports/` consomme les {@link Audit} du Sprint 10 pour
 * produire des documents Markdown (humains) et PDF (imprimables, via
 * Puppeteer), ainsi que des comparaisons avant/après.
 */

/**
 * Formats de sortie demandés par l'appelant.
 *
 * `html` a été ajouté au Sprint 19-02 (C-W03, trois formats réellement
 * produits) ; `both` reste `markdown + pdf` pour ne pas modifier le contrat
 * historique, `all` produit les trois.
 */
export type ReportFormat = 'markdown' | 'html' | 'pdf' | 'both' | 'all';

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
  /** Format demandé (`markdown`, `html`, `pdf`, `both`, `all`). */
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
  /**
   * Anomalies de données historiques à signaler dans le rapport (C-W12).
   *
   * Toujours **affichées**, jamais corrigées : le rapport ne réécrit aucune
   * donnée et n'attribue aucune mesure rétroactive.
   */
  diagnostics?: readonly import('../storage/audit-diagnostics.js').AuditDiagnostic[];
}

/** Rapport généré (contenu toujours présent, fichier si demandé). */
export interface GeneratedReport {
  /** Identifiant de l'audit source. */
  auditId: number;
  /** Format produit. */
  format: 'markdown' | 'html' | 'pdf';
  /** Contenu : texte Markdown, ou base64 pour le PDF. */
  content: string;
  /** Chemin du fichier écrit, si `outputPath` était fourni. */
  filePath?: string;
  /** Horodatage ISO de génération. */
  generatedAt: string;
}

/** Évolution du score global entre deux audits. */
export interface ScoreEvolution {
  /**
   * État de la comparaison (Sprint 19-03, C-W07).
   *
   * `unavailable` signifie qu'au moins un des deux audits n'a pas de score :
   * aucun écart n'est alors calculé, ni présenté comme une progression.
   */
  status: 'measured' | 'unavailable';
  /** Score de l'audit A (ancien), `null` si indisponible. */
  scoreA: number | null;
  /** Score de l'audit B (récent), `null` si indisponible. */
  scoreB: number | null;
  /** Écart en points (B − A), `null` si non calculable. */
  delta: number | null;
  /** Écart relatif en pourcent (0 si A ≤ 0), `null` si non calculable. */
  percentage: number | null;
  /**
   * Tendance : `+5` franchi à la hausse/baisse, sinon stable ;
   * `unavailable` quand un score manque.
   */
  trend: 'improving' | 'degrading' | 'stable' | 'unavailable';
}

/** Delta de score d'une dimension. */
export interface DimensionDelta {
  /** Dimension comparée. */
  dimension: AnalysisDimension;
  /** Score dans l'audit A, `null` si la dimension est indisponible. */
  scoreA: number | null;
  /** Score dans l'audit B, `null` si la dimension est indisponible. */
  scoreB: number | null;
  /** Écart en points (B − A), `null` si non calculable. */
  delta: number | null;
  /** Écart relatif en pourcent, `null` si non calculable. */
  percentage: number | null;
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
