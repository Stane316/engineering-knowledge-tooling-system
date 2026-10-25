import type { AnalysisDimension, Priority } from '../analysis/types.js';

/**
 * Types du stockage d'audits (Sprint 10).
 *
 * Le module `src/storage/` stocke les rapports `AnalysisReport` du Sprint 9
 * dans trois tables SQLite relationnelles (`audit_metadata`, `audit_dimensions`,
 * `audit_findings`), indexées en plein texte (FTS5) et, sous injection, en
 * vecteurs d'embedding.
 *
 * Les dimensions et priorités réutilisent les unions du contrat d'analyse :
 * une dimension inventée ici divergerait silencieusement du rapport.
 */

/** Métadonnées d'un audit stocké. */
export interface AuditMetadata {
  /** Identifiant auto-incrémenté (absent avant insertion). */
  id?: number;
  /** URL analysée. */
  url: string;
  /** Horodatage ISO 8601 de l'analyse. */
  timestamp: string;
  /** Score global pondéré (0-100). */
  overallScore: number;
  /** Nombre total de constats. */
  totalFindings: number;
  /** Constats de priorité `critical`. */
  criticalFindings: number;
  /** Constats de priorité `high`. */
  highFindings: number;
  /** Constats de priorité `medium`. */
  mediumFindings: number;
  /** Constats de priorité `low`. */
  lowFindings: number;
  /**
   * Projet associé (Sprint 13), `null` si aucun.
   *
   * Absent avant insertion des bases antérieures au schéma 003.
   */
  projectId?: string | null;
  /** Horodatage d'insertion (renseigné par SQLite). */
  createdAt?: string;
}

/** Score d'une dimension spécifique (0-100). */
export interface AuditDimension {
  /** Identifiant de ligne (absent avant insertion). */
  id?: number;
  /** Audit parent. */
  auditId: number;
  /** Dimension analysée. */
  dimension: AnalysisDimension;
  /** Score de la dimension (0-100). */
  score: number;
  /** Nombre de constats de la dimension. */
  findingsCount: number;
}

/** Constat individuel persisté. */
export interface AuditFinding {
  /** Identifiant de ligne (absent avant insertion). */
  id?: number;
  /** Audit parent. */
  auditId: number;
  /** Dimension du constat. */
  dimension: AnalysisDimension;
  /** Titre du constat. */
  title: string;
  /** Description détaillée. */
  description?: string;
  /** Sévérité (0-4). */
  severity: number;
  /** Effort de correction (1-5). */
  effort: number;
  /** Impact utilisateur (1-5). */
  impact: number;
  /** Priorité recalculée. */
  priority: Priority;
  /** Recommandation actionnable. */
  recommendation?: string;
  /** Horodatage d'insertion (renseigné par SQLite). */
  createdAt?: string;
}

/** Audit complet : métadonnées + 5 dimensions + constats. */
export interface Audit {
  /** Métadonnées de l'audit. */
  metadata: AuditMetadata;
  /** Scores par dimension. */
  dimensions: AuditDimension[];
  /** Constats de l'audit. */
  findings: AuditFinding[];
}

/** Options de recherche et de filtrage des audits. */
export interface AuditSearchOptions {
  /** Requête plein texte (absente : énumération filtrée). */
  query?: string;
  /** Score global minimum (0-100). */
  scoreMin?: number;
  /** Score global maximum (0-100). */
  scoreMax?: number;
  /** Filtre sur une dimension. */
  dimension?: AnalysisDimension;
  /** Filtre sur une priorité présente. */
  priority?: Priority;
  /** Décalage de pagination (défaut : 0). */
  offset?: number;
  /** Taille de page (défaut : 100). */
  limit?: number;
}

/** Résultat de recherche avec score de pertinence. */
export interface AuditSearchResult {
  /** Audit trouvé. */
  audit: Audit;
  /** Score de pertinence (RRF, BM25 normalisé ou 1 pour une énumération). */
  score: number;
}

/** Entrée d'embedding à produire pour un constat. */
export interface AuditEmbeddingInput {
  /** Clé stable du constat (`audit-{auditId}-finding-{findingId}`). */
  id: string;
  /** Texte à vectoriser (titre + description). */
  text: string;
  /** Métadonnées d'origine. */
  metadata: {
    /** Audit parent. */
    auditId?: number;
    /** Dimension du constat. */
    dimension: AnalysisDimension;
    /** Priorité du constat. */
    priority: Priority;
    /** Sévérité du constat. */
    severity: number;
  };
}

/** Voisin sémantique retourné par le magasin d'embeddings. */
export interface AuditEmbeddingMatch {
  /** Audit correspondant. */
  auditId: number;
  /** Similarité cosinus (0-1). */
  score: number;
}

/**
 * Contrat d'indexation vectorielle pour les audits.
 *
 * Les vecteurs d'audit ne sont **pas** stockés dans la table `resources_vectors`
 * (elle est liée aux ressources) et la production s'appuie sur un fournisseur
 * d'embeddings réseau — jamais de test unitaire au réseau : le magasin est
 * **injecté**. Sans magasin, la recherche reste en plein texte (dégradation
 * explicite documentée, jamais un score sémantique inventé).
 */
export interface AuditEmbeddingStore {
  /**
   * Indexe les embeddings des constats d'un audit.
   *
   * @param items - Textes et métadonnées à vectoriser.
   */
  addEmbeddings(items: readonly AuditEmbeddingInput[]): Promise<void>;
  /**
   * Retire les embeddings d'un audit.
   *
   * @param ids - Clés des embeddings à supprimer.
   * @returns Nombre de vecteurs retirés.
   */
  removeEmbeddings(ids: readonly string[]): Promise<number>;
  /**
   * Recherche sémantique des audits les plus proches d'une requête.
   *
   * @param query - Texte de requête.
   * @param limit - Nombre maximal de voisins.
   * @returns Voisins triés du plus similaire au moins similaire.
   */
  search(query: string, limit: number): Promise<AuditEmbeddingMatch[]>;
}

/** Statistiques globales d'audits. */
export interface AuditStatistics {
  /** Nombre d'audits. */
  totalAudits: number;
  /** Score global moyen (arrondi). */
  averageScore: number;
  /** Score global minimal. */
  minScore: number;
  /** Score global maximal. */
  maxScore: number;
  /** Somme des constats. */
  totalFindings: number;
  /** Somme des constats critiques. */
  criticalFindings: number;
  /** Somme des constats importants. */
  highFindings: number;
  /** Somme des constats moyens. */
  mediumFindings: number;
  /** Somme des constats mineurs. */
  lowFindings: number;
}

/** Tendance des scores agrégés par période. */
export interface ScoreTrend {
  /** Période (jour, semaine ISO ou mois, selon l'option choisie). */
  date: string;
  /** Score moyen sur la période (arrondi). */
  averageScore: number;
  /** Nombre d'audits sur la période. */
  auditCount: number;
}

/** Statistiques d'une dimension sur tous les audits. */
export interface DimensionStatistics {
  /** Dimension analysée. */
  dimension: AnalysisDimension;
  /** Score moyen (arrondi). */
  averageScore: number;
  /** Score minimal. */
  minScore: number;
  /** Score maximal. */
  maxScore: number;
  /** Somme des constats de la dimension. */
  totalFindings: number;
}

/** Constat le plus fréquent (regroupé par titre et dimension). */
export interface TopIssue {
  /** Titre regroupé. */
  title: string;
  /** Dimension du constat. */
  dimension: AnalysisDimension;
  /** Sévérité du constat. */
  severity: number;
  /** Priorité du constat. */
  priority: Priority;
  /** Nombre d'audits touchés. */
  count: number;
  /** Part des audits touchés (0-100). */
  percentage: number;
}
