import type { AnalysisDimension } from '../analysis/types.js';

/**
 * Types du module de templates de projets (Sprint 17).
 *
 * Les templates permettent d'initialiser rapidement des projets avec une
 * configuration prédéfinie (dimensions prioritaires, seuils, bonnes
 * pratiques, règles) — ADR-039 (config JSON), ADR-040 (builtins
 * immuables), ADR-041 (overrides partiels).
 *
 * **Écart P3 (spec vs code)** : l'interface parent (`SPRINT-17.md` §2.2)
 * annonçait des méthodes `Promise` — convention du dépôt : méthodes
 * **synchrones** (better-sqlite3), comme aux Sprints 15-16.
 */

/**
 * Catégories de templates : 10 prédéfinis + `custom` pour les créations
 * utilisateur (C17.1).
 */
export type TemplateCategory =
  | 'e-commerce'
  | 'saas'
  | 'blog'
  | 'portfolio'
  | 'corporate'
  | 'landing'
  | 'documentation'
  | 'marketplace'
  | 'news'
  | 'agency'
  | 'custom';

/** Liste blanche des catégories (validation CLI/MCP). */
export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = [
  'e-commerce',
  'saas',
  'blog',
  'portfolio',
  'corporate',
  'landing',
  'documentation',
  'marketplace',
  'news',
  'agency',
  'custom',
];

/**
 * Configuration d'un template (colonne JSON `config`, ADR-039).
 *
 * Tous les champs sont optionnels : filtrage/validation côté application,
 * jamais de requête SQL sur ces champs.
 */
export interface TemplateConfig {
  /** Dimensions prioritaires (ordre d'importance). */
  priorityDimensions?: AnalysisDimension[];
  /** Seuils d'alerte. */
  alertThresholds?: {
    /** Points de régression déclenchant une alerte (défaut : 10). */
    regressionPoints?: number;
    /** Score plancher (défaut : 50). */
    minScore?: number;
  };
  /** Critères d'extraction des bonnes pratiques (Sprint 15). */
  extractionCriteria?: {
    /** Occurrences minimales d'un constat (défaut : 2). */
    minOccurrences?: number;
    /** Audits minimum pour extraire (défaut : 2). */
    minAudits?: number;
    /** Confiance minimale d'association (défaut : 0.5). */
    minConfidence?: number;
  };
  /** Options du moteur de recommandations (Sprint 16). */
  recommendationOptions?: {
    /** Nombre maximum de recommandations (défaut : 10). */
    maxRecommendations?: number;
    /** Score de pertinence minimum (défaut : 0.3). */
    minRelevanceScore?: number;
  };
  /** Tags pour le filtrage. */
  tags?: string[];
  /** Auteur du template. */
  author?: string;
  /** Version du template (export, ADR R17.3). */
  version?: string;
}

/**
 * Template de projet (table `project_templates`).
 */
export interface ProjectTemplate {
  /** Identifiant UUID. */
  id: string;
  /** Nom lisible. */
  name: string;
  /** Description détaillée. */
  description: string;
  /** Catégorie du template. */
  category: TemplateCategory;
  /** Configuration du projet (JSON). */
  config: TemplateConfig;
  /** IDs des bonnes pratiques associées. */
  bestPracticeIds: string[];
  /** IDs des règles de recommandation associées. */
  recommendationRuleIds: string[];
  /** `true` si template prédéfini (immuable, ADR-040). */
  isBuiltin: boolean;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de dernière mise à jour (ISO 8601). */
  updatedAt: string;
}

/**
 * Entrée pour créer un template (C17.1).
 *
 * `isBuiltin` n'est pas exposé : seul le dépôt de prédéfinis (17-02)
 * crée des templates immuables.
 */
export interface CreateTemplateInput {
  /** Nom (non vide). */
  name: string;
  /** Description. */
  description: string;
  /** Catégorie (liste blanche). */
  category: TemplateCategory;
  /** Configuration JSON (défaut `{}`). */
  config?: TemplateConfig;
  /** IDs de bonnes pratiques (défaut `[]`). */
  bestPracticeIds?: string[];
  /** IDs de règles (défaut `[]`). */
  recommendationRuleIds?: string[];
}

/**
 * Entrée pour mettre à jour un template (patch partiel).
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  config?: TemplateConfig;
  bestPracticeIds?: string[];
  recommendationRuleIds?: string[];
}

/**
 * Filtres pour lister les templates.
 *
 * `tags` est filtré côté application (colonnes JSON — ADR-039), après le
 * résultat SQL paginé.
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  isBuiltin?: boolean;
  /** Tags requis (tous présents) — filtrage application. */
  tags?: string[];
  /** Nombre maximum de résultats (défaut : 100). */
  limit?: number;
  /** Décalage pour la pagination (défaut : 0). */
  offset?: number;
}

/**
 * Overrides pour personnaliser l'application d'un template (ADR-041) :
 * seuls les champs fournis sont remplacés (merge shallow de la config).
 */
export interface TemplateOverrides {
  /** Nom du projet (défaut : nom fourni dans l'entrée d'application). */
  projectName?: string;
  /** URL du projet. */
  projectUrl?: string;
  /** Description du projet. */
  projectDescription?: string;
  /** Configuration à merger (object spread, profondeur 1 par clé). */
  config?: Partial<TemplateConfig>;
  /** IDs de bonnes pratiques à ajouter à ceux du template. */
  additionalBestPracticeIds?: string[];
  /** IDs de règles à ajouter à ceux du template. */
  additionalRuleIds?: string[];
}

/**
 * Entrée pour créer un projet depuis un template (C17.3).
 */
export interface ApplyTemplateInput {
  /** ID du template à appliquer. */
  templateId: string;
  /** Nom du projet créé. */
  projectName: string;
  /** URL du projet créé. */
  projectUrl: string;
  /** Description du projet créé. */
  projectDescription?: string;
  /** Overrides optionnels (C17.4). */
  overrides?: TemplateOverrides;
}

/**
 * Résultat de l'application d'un template (C17.3).
 */
export interface ApplyTemplateResult {
  /** ID du projet créé. */
  projectId: string;
  /** Nom du projet créé. */
  projectName: string;
  /** ID du template appliqué. */
  templateId: string;
  /** Nombre de bonnes pratiques associées au projet. */
  bestPracticesAssociated: number;
  /** Nombre de règles de recommandation créées. */
  rulesCreated: number;
  /** Durée d'application (ms, C17.13). */
  durationMs: number;
}

/**
 * Format d'export JSON d'un template (C17.5) : identifiants et dates
 * exclus — l'import recrée un template vierge.
 */
export interface TemplateExport {
  /** Version du format d'export. */
  version: string;
  /** Date d'export (ISO 8601). */
  exportedAt: string;
  /** Contenu du template sans `id`/dates/`isBuiltin`. */
  template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>;
}

/**
 * Résultat de validation d'un template (C17.20).
 */
export interface ValidationResult {
  /** `true` si aucune erreur. */
  valid: boolean;
  /** Erreurs bloquantes. */
  errors: string[];
  /** Avertissements non bloquants. */
  warnings: string[];
}
