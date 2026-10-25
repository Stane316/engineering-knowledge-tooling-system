import { z } from 'zod';

import { ProjectStatusSchema, ResourceTypeSchema } from '../../shared/validators.js';

/**
 * Schémas d'entrée des quatre outils MCP.
 *
 * **Source unique de vérité : Zod.** Le SDK MCP convertit directement ces
 * objets en JSON Schema pour `tools/list`, ce qui évite de maintenir deux
 * définitions qui divergeraient. Les constantes `*Schema` ci-dessous exposent
 * la conversion officielle (`z.toJSONSchema`) pour la documentation et les
 * tests de contrat.
 */

/** Nombre maximal de résultats renvoyés par `search_knowledge`. */
export const MAX_SEARCH_LIMIT = 100;

/** Nombre maximal de ressources renvoyées par `list_resources`. */
export const MAX_LIST_LIMIT = 1000;

/** Mode de recherche exposé aux agents. */
export const SearchModeSchema = z.enum(['hybrid', 'fts', 'vector']);

/** Entrée de `search_knowledge`. */
export const SearchKnowledgeInput = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'la requête est obligatoire')
    .max(2000, 'la requête ne peut pas dépasser 2000 caractères'),
  limit: z
    .number()
    .int('la limite doit être un entier')
    .min(1, 'la limite doit être supérieure ou égale à 1')
    .max(MAX_SEARCH_LIMIT, `la limite ne peut pas dépasser ${String(MAX_SEARCH_LIMIT)}`)
    .default(10),
  mode: SearchModeSchema.default('hybrid'),
  type: ResourceTypeSchema.optional(),
  tags: z.array(z.string().trim().min(1)).max(50).optional(),
});

/** Entrée de `get_resource`. */
export const GetResourceInput = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'l’identifiant est obligatoire')
    .max(100, 'l’identifiant ne peut pas dépasser 100 caractères'),
});

/** Entrée de `list_resources`. */
export const ListResourcesInput = z.object({
  type: ResourceTypeSchema.optional(),
  tags: z.array(z.string().trim().min(1)).max(50).optional(),
  limit: z
    .number()
    .int('la limite doit être un entier')
    .min(1, 'la limite doit être supérieure ou égale à 1')
    .max(MAX_LIST_LIMIT, `la limite ne peut pas dépasser ${String(MAX_LIST_LIMIT)}`)
    .optional(),
});

/**
 * Entrée de `validate_resource`.
 *
 * `data` est volontairement `unknown` : l'outil doit pouvoir dire *pourquoi*
 * une donnée est invalide, donc accepter n'importe quelle forme. En Zod 4,
 * `z.unknown()` rend la clé obligatoire, ce qui est le comportement voulu.
 */
export const ValidateResourceInput = z.object({
  data: z.unknown(),
});

/** Entrée de `inspect_site`. */
export const InspectSiteInput = z.object({
  url: z
    .string()
    .url({ message: 'l\u2019URL doit être une URL valide (http/https)' })
    .describe('URL du site à inspecter'),
  level: z
    .enum(['L1', 'L2', 'L3'])
    .default('L3')
    .describe(
      'Niveau d\u2019inspection : L3 requis pour l\u2019analyse complète (L1/L2 ne fournissent pas toutes les entrées)',
    ),
  project_id: z
    .uuid({ message: 'l’identifiant de projet doit être un UUID' })
    .optional()
    .describe('Projet auquel l’audit est assigné (Sprint 13) ; omis : audit sans projet'),
});

/** Entrée de `audit_history`. */
export const AuditHistoryInput = z.object({
  url: z.string().url({ message: 'l\u2019URL doit être une URL valide (http/https)' }).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  score_min: z.number().int().min(0).max(100).optional(),
  score_max: z.number().int().min(0).max(100).optional(),
});

/** Entrée de `audit_report`. */
export const AuditReportInput = z.object({
  audit_id: z.number().int().positive(),
  format: z.enum(['markdown', 'text']).default('markdown'),
});

/** Identifiant de projet (UUIDv4) exposé aux agents (Sprint 13). */
const ProjectIdInput = z.uuid({ message: 'l’identifiant de projet doit être un UUID' });

/** Entrée de `create_project`. */
export const CreateProjectInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'le nom du projet est obligatoire')
    .max(200, 'le nom ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .trim()
    .max(2000, 'la description ne peut pas dépasser 2000 caractères')
    .optional(),
  status: ProjectStatusSchema.default('active'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Entrée de `list_projects`. */
export const ListProjectsInput = z.object({
  status: ProjectStatusSchema.optional(),
  limit: z
    .number()
    .int('la limite doit être un entier')
    .min(1, 'la limite doit être supérieure ou égale à 1')
    .max(MAX_LIST_LIMIT, `la limite ne peut pas dépasser ${String(MAX_LIST_LIMIT)}`)
    .default(50),
  offset: z
    .number()
    .int('le décalage doit être un entier')
    .min(0, 'le décalage doit être positif ou nul')
    .default(0),
});

/** Entrée de `get_project`. */
export const GetProjectInput = z.object({
  project_id: ProjectIdInput,
});

/** Entrée de `delete_project` (aucune confirmation interactive côté MCP). */
export const DeleteProjectInput = z.object({
  project_id: ProjectIdInput,
});

/** Date calendrier `YYYY-MM-DD` (Sprint 14, timeline). */
const TimelineDateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'format YYYY-MM-DD attendu');

/** Entrée de `get_timeline` (Sprint 14). */
export const GetTimelineInput = z.object({
  project_id: ProjectIdInput,
  start_date: TimelineDateInput.optional(),
  end_date: TimelineDateInput.optional(),
  lookback_days: z
    .number()
    .int('la période doit être un entier en jours')
    .min(1, 'la période doit être supérieure ou égale à 1 jour')
    .default(90),
  threshold: z
    .number()
    .int('le seuil doit être un entier en points')
    .min(1, 'le seuil doit être supérieur ou égal à 1')
    .max(100, 'le seuil ne peut pas dépasser 100')
    .default(10),
  include_alerts: z.boolean().default(true),
  include_charts: z.boolean().default(false),
});

/** Sortie de `search_knowledge`. */
export const SearchKnowledgeOutput = z.object({
  query: z.string(),
  mode: SearchModeSchema,
  count: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      resource: z.record(z.string(), z.unknown()),
      score: z.number(),
      source: z.enum(['fts', 'vector', 'hybrid']),
      highlight: z.string().optional(),
    }),
  ),
});

/** Sortie de `get_resource`. */
export const GetResourceOutput = z.object({
  resource: z.record(z.string(), z.unknown()),
});

/** Sortie de `list_resources`. */
export const ListResourcesOutput = z.object({
  count: z.number().int().nonnegative(),
  resources: z.array(z.record(z.string(), z.unknown())),
});

/** Sortie de `validate_resource`. */
export const ValidateResourceOutput = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

/** Type JSON Schema exposé par `tools/list`. */
export type ToolJsonSchema = Record<string, unknown>;

/** Convertit un schéma Zod en JSON Schema d'entrée. */
function toJsonSchema(schema: z.ZodType): ToolJsonSchema {
  return z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as ToolJsonSchema;
}

/** JSON Schema de `search_knowledge`. */
export const searchKnowledgeSchema: ToolJsonSchema = toJsonSchema(SearchKnowledgeInput);

/** JSON Schema de `get_resource`. */
export const getResourceSchema: ToolJsonSchema = toJsonSchema(GetResourceInput);

/** JSON Schema de `list_resources`. */
export const listResourcesSchema: ToolJsonSchema = toJsonSchema(ListResourcesInput);

/** JSON Schema de `validate_resource`. */
export const validateResourceSchema: ToolJsonSchema = toJsonSchema(ValidateResourceInput);

/** JSON Schema de `inspect_site`. */
export const inspectSiteSchema: ToolJsonSchema = toJsonSchema(InspectSiteInput);

/** JSON Schema de `audit_history`. */
export const auditHistorySchema: ToolJsonSchema = toJsonSchema(AuditHistoryInput);

/** JSON Schema de `audit_report`. */
export const auditReportSchema: ToolJsonSchema = toJsonSchema(AuditReportInput);

/** Descriptions affichées aux agents dans `tools/list`. */
export const TOOL_DESCRIPTIONS = {
  search_knowledge:
    'Recherche des ressources de la base de connaissances EKTS. Modes : « hybrid » (BM25 + vecteurs, fusion RRF), « fts » (plein texte seul, sans réseau), « vector » (sémantique seul). Renvoie les ressources avec leur score et leur origine.',
  get_resource:
    'Renvoie une ressource complète (métadonnées, contenu, dates) à partir de son identifiant UUID. Échoue avec le code -32000 si la ressource n’existe pas.',
  list_resources:
    'Liste les ressources, éventuellement filtrées par type et par tags (tous les tags demandés doivent être présents), avec une limite optionnelle.',
  validate_resource:
    'Valide la forme d’une ressource avant création, sans rien écrire : type, titre, URL, tags, métadonnées et contenu. Renvoie { valid, errors? }.',
  inspect_site:
    'Inspecte un site web (navigation réelle, niveau L3 par défaut), analyse performance/accessibilité/SEO/UX/contenu, stocke un audit et renvoie son résumé (score, constats, identifiant d\u2019audit).',
  audit_history:
    'Liste les audits stockés avec filtres (URL, score min/max, limite) et statistiques globales (total, moyenne, min/max).',
  audit_report:
    'Génère le rapport Markdown complet d\u2019un audit à partir de son identifiant : en-tête, résumé, scores par dimension, constats et recommandations.',
  create_project:
    'Crée un projet (nom obligatoire, description/statut/métadonnées optionnels) et renvoie le projet créé avec son UUID.',
  list_projects:
    'Liste les projets avec filtres facultatifs (statut active|completed|archived, limite, décalage), du plus récent au plus ancien.',
  get_project:
    'Renvoie un projet par son identifiant UUID ; erreur -32000 si le projet n\u2019existe pas.',
  delete_project:
    'Supprime un projet par son UUID. Les audits et ressources associés sont conservés avec project_id à NULL (aucune suppression en cascade).',
  get_timeline:
    "Analyse la timeline d'un projet (période, scores par dimension, tendances par régression linéaire, régressions au-dessus du seuil et alertes actives) ; résumé Markdown + JSON structuré.",
  search_best_practices:
    'Recherche les bonnes pratiques capitalisées (FTS5 + filtres catégorie/tag/projet, tri par pertinence) ; résumé Markdown + résultats JSON.',
  add_best_practice:
    'Crée manuellement une bonne pratique (titre ≥ 3 caractères, description ≥ 10, catégorie, tags optionnels) ; retourne la pratique créée.',
  get_recommendations:
    'Génère les recommandations contextuelles d’un projet (règles explicites + scoring statistique + tendances/historique) ; résumé Markdown + rapport JSON, régénération idempotente.',
} as const;

/** Noms des outils, dans l'ordre de `tools/list`. */
export const TOOL_NAMES = [
  'search_knowledge',
  'get_resource',
  'list_resources',
  'validate_resource',
  'inspect_site',
  'audit_history',
  'audit_report',
  'create_project',
  'list_projects',
  'get_project',
  'delete_project',
  'get_timeline',
  'search_best_practices',
  'add_best_practice',
  'get_recommendations',
] as const;

/** Nom d'un outil MCP. */
export type ToolName = (typeof TOOL_NAMES)[number];

/** Entrées typées après validation Zod. */
export type SearchKnowledgeParams = z.output<typeof SearchKnowledgeInput>;
export type GetResourceParams = z.output<typeof GetResourceInput>;
export type ListResourcesParams = z.output<typeof ListResourcesInput>;
export type ValidateResourceParams = z.output<typeof ValidateResourceInput>;
export type InspectSiteParams = z.output<typeof InspectSiteInput>;
export type AuditHistoryParams = z.output<typeof AuditHistoryInput>;
export type AuditReportParams = z.output<typeof AuditReportInput>;
export type CreateProjectParams = z.output<typeof CreateProjectInput>;
export type ListProjectsParams = z.output<typeof ListProjectsInput>;
export type GetProjectParams = z.output<typeof GetProjectInput>;
export type GetTimelineParams = z.output<typeof GetTimelineInput>;

/** Catégories de bonnes pratiques (5 dimensions + général), Sprint 15. */
export const BEST_PRACTICE_CATEGORIES = [
  'performance',
  'accessibility',
  'seo',
  'ux',
  'content',
  'general',
] as const;

/** Entrée de `search_best_practices` (lecture seule). */
export const SearchBestPracticesInput = z.object({
  query: z.string().min(1, 'requête vide').optional(),
  category: z.enum(BEST_PRACTICE_CATEGORIES).optional(),
  tag: z.string().min(1).optional(),
  project_id: ProjectIdInput.optional(),
  limit: z
    .number()
    .int('la limite doit être un entier')
    .min(0, 'la limite ne peut pas être négative')
    .max(500, 'la limite ne peut pas dépasser 500')
    .default(10),
});

/** Entrée de `add_best_practice` (écriture). */
export const AddBestPracticeInput = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'titre trop court (3 caractères minimum)')
    .max(200, 'titre trop long (200 caractères maximum)'),
  description: z
    .string()
    .trim()
    .min(10, 'description trop courte (10 caractères minimum)')
    .max(4000, 'description trop longue (4000 caractères maximum)'),
  category: z.enum(BEST_PRACTICE_CATEGORIES),
  tags: z.array(z.string().trim().min(1)).max(30).optional(),
});

/** Entrée de `get_recommendations` (Sprint 16, lecture). */
export const GetRecommendationsInput = z.object({
  project_id: ProjectIdInput,
  max_recommendations: z
    .number()
    .int('le maximum doit être un entier')
    .min(1, 'le maximum doit être ≥ 1')
    .max(500, 'le maximum ne peut pas dépasser 500')
    .default(10),
  min_relevance_score: z
    .number()
    .min(0, 'le score minimum ne peut pas être négatif')
    .max(1, 'le score maximum ne peut pas dépasser 1')
    .default(0.3),
  dimensions: z
    .array(z.enum(['performance', 'accessibility', 'seo', 'ux', 'content'] as const))
    .optional(),
  include_rules: z.boolean().default(true),
  include_statistical: z.boolean().default(true),
});

export type SearchBestPracticesParams = z.output<typeof SearchBestPracticesInput>;
export type AddBestPracticeParams = z.output<typeof AddBestPracticeInput>;
export type GetRecommendationsParams = z.output<typeof GetRecommendationsInput>;
export type DeleteProjectParams = z.output<typeof DeleteProjectInput>;
