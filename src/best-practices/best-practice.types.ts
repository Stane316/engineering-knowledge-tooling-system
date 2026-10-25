import type { AnalysisDimension } from '../analysis/types.js';

/**
 * Types du module de capitalisation des bonnes pratiques (Sprint 15).
 *
 * Les bonnes pratiques sont extraites des constats résolus dans les audits
 * ou créées manuellement par les utilisateurs. Elles sont recherchables via
 * un moteur hybride (FTS5 + fusion RRF) et associées aux findings
 * récurrents via la table `finding_best_practice`.
 *
 * Les méthodes des repositories sont **synchrones** (better-sqlite3) :
 * l'interface parent (`SPRINT-15.md` §2.2) annonçait des `Promise` — écart P3
 * soumis, la synchro est la convention du dépôt (cf. `ProjectRepository`).
 */

/**
 * Catégories de bonnes pratiques.
 * Reprend les 5 dimensions d'analyse + une catégorie `general`.
 */
export type BestPracticeCategory = AnalysisDimension | 'general';

/**
 * Bonne pratique stockée (table `best_practices`).
 */
export interface BestPractice {
  /** Identifiant UUID. */
  id: string;
  /** Titre lisible. */
  title: string;
  /** Description détaillée (recommandation de la pratique). */
  description: string;
  /** Catégorie (dimension d'analyse ou `general`). */
  category: BestPracticeCategory;
  /** Tags pour le filtrage fin. */
  tags: string[];
  /** IDs des projets source (traçabilité, colonne JSON). */
  sourceProjectIds: string[];
  /** IDs des audits source (traçabilité, colonne JSON). */
  sourceAuditIds: number[];
  /** Nombre d'occurrences détectées. */
  occurrenceCount: number;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de dernière mise à jour (ISO 8601). */
  updatedAt: string;
  /** `true` si créée manuellement (pas par l'extracteur). */
  isManual: boolean;
}

/**
 * Entrée pour créer une bonne pratique.
 */
export interface CreateBestPracticeInput {
  /** Titre lisible (non vide). */
  title: string;
  /** Description détaillée (non vide). */
  description: string;
  /** Catégorie (dimension ou `general`). */
  category: BestPracticeCategory;
  /** Tags optionnels (défaut : vide). */
  tags?: string[];
  /** Projets source optionnels (défaut : vide). */
  sourceProjectIds?: string[];
  /** Audits source optionnels (défaut : vide). */
  sourceAuditIds?: number[];
  /** `true` si créée manuellement (défaut : `false`). */
  isManual?: boolean;
}

/**
 * Entrée pour mettre à jour une bonne pratique (champs partiels).
 */
export interface UpdateBestPracticeInput {
  /** Nouveau titre. */
  title?: string;
  /** Nouvelle description. */
  description?: string;
  /** Nouvelle catégorie. */
  category?: BestPracticeCategory;
  /** Nouveaux tags (remplacement complet). */
  tags?: string[];
}

/**
 * Filtres pour lister les bonnes pratiques.
 */
export interface BestPracticeFilters {
  /** Filtre par catégorie. */
  category?: BestPracticeCategory;
  /** Filtre par tag (au moins un tag commun). */
  tag?: string;
  /** Filtre par projet source. */
  projectId?: string;
  /** Filtre par type (manuel / automatique). */
  isManual?: boolean;
  /** Nombre maximum de résultats (défaut : 50). */
  limit?: number;
  /** Décalage pour la pagination (défaut : 0). */
  offset?: number;
  /** Tri (défaut : `created_at`). */
  orderBy?: 'created_at' | 'updated_at' | 'occurrence_count' | 'title';
  /** Ordre de tri (défaut : `desc`). */
  orderDir?: 'asc' | 'desc';
}

/**
 * Options de recherche hybride.
 */
export interface BestPracticeSearchOptions {
  /** Requête de recherche (absente : énumération filtrée). */
  query?: string;
  /** Filtre par catégorie. */
  category?: BestPracticeCategory;
  /** Filtre par tag. */
  tag?: string;
  /** Filtre par projet source. */
  projectId?: string;
  /** Nombre maximum de résultats (défaut : 20 avec requête, 50 sinon). */
  limit?: number;
  /** Décalage pour la pagination (énumération filtrée uniquement). */
  offset?: number;
}

/**
 * Fournisseur optionnel d'un classement sémantique pour la fusion RRF.
 *
 * @param query - Requête textuelle.
 * @param limit - Nombre maximal d'identifiants attendus.
 * @returns Identifiants `BestPractice` triés du plus pertinent au moins
 *   pertinent (rangs à partir de 1 pour `reciprocalRank`).
 */
export type BestPracticeSemanticRanker = (query: string, limit: number) => string[];

/**
 * Résultat de recherche d'une bonne pratique.
 */
export interface BestPracticeSearchResult {
  /** Bonne pratique trouvée. */
  practice: BestPractice;
  /** Score de pertinence (0-1, 1 = meilleur match). */
  score: number;
  /** Type de match (`fts` = plein texte, `list` = énumération, `hybrid` = fusion RRF). */
  matchType: 'fts' | 'semantic' | 'hybrid' | 'list';
}

/**
 * Association finding ↔ bonne pratique (table `finding_best_practice`).
 *
 * La clé métier est `(finding_title, dimension)` : les findings n'ont pas
 * d'UUID stable d'un audit à l'autre, seul leur titre normalisé + dimension
 * permet de retrouver le pattern récurrent (ADR-035).
 */
export interface FindingBestPracticeLink {
  /** Titre normalisé du finding. */
  findingTitle: string;
  /** Dimension du finding. */
  dimension: AnalysisDimension;
  /** ID de la bonne pratique associée. */
  bestPracticeId: string;
  /** Score de confiance (0-1). */
  confidence: number;
  /** Date de création de l'association (ISO 8601). */
  createdAt: string;
}

/**
 * Rapport d'extraction automatique (Sprint 15-02).
 */
export interface ExtractionReport {
  /** Nombre d'audits analysés. */
  auditsAnalyzed: number;
  /** Nombre de bonnes pratiques extraites (créées + mises à jour). */
  practicesExtracted: number;
  /** Nombre de bonnes pratiques fusionnées (déduplication). */
  practicesMerged: number;
  /** Nombre d'associations finding ↔ BP créées. */
  linksCreated: number;
  /** Durée d'exécution (ms). */
  durationMs: number;
}
