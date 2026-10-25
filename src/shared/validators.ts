import { z } from 'zod';

/**
 * Schémas de validation Zod du domaine « ressources ».
 *
 * Source unique de vérité : les types TypeScript sont inférés de ces schémas
 * (`z.infer` / `z.input`), jamais écrits à la main.
 */

/** Types de ressources acceptés (aligné sur la contrainte SQL `CHECK`). */
export const ResourceTypeSchema = z.enum(['article', 'video', 'tutorial', 'tool', 'other']);

const TitleSchema = z
  .string()
  .trim()
  .min(1, 'Le titre est obligatoire')
  .max(500, 'Le titre ne peut pas dépasser 500 caractères');

// `z.url()` accepte n'importe quel schéma (`ftp://`, `mailto:`) : le message
// promet http/https, la validation doit donc l'imposer (ADR-022).
const UrlSchema = z.url({
  protocol: /^https?$/,
  error: 'URL invalide (http:// ou https:// attendu)',
});

const TagsSchema = z
  .array(z.string().trim().min(1, 'Un tag ne peut pas être vide').max(64))
  .max(50, 'Un maximum de 50 tags est accepté');

const MetadataSchema = z.record(z.string(), z.unknown());

/** Identifiant de projet (UUID), utilisé par le Sprint 13 (multi-projets). */
export const ProjectIdSchema = z.uuid({
  error: 'L’identifiant de projet doit être un UUID',
});

/** Schéma de création d'une ressource. */
export const CreateResourceSchema = z.object({
  type: ResourceTypeSchema,
  title: TitleSchema,
  url: UrlSchema.optional(),
  tags: TagsSchema.default([]),
  metadata: MetadataSchema.default({}),
  content: z.string().optional(),
  projectId: ProjectIdSchema.optional(),
});

/** Schéma de mise à jour partielle (`null` efface un champ nullable). */
export const UpdateResourceSchema = z
  .object({
    title: TitleSchema.optional(),
    url: UrlSchema.nullable().optional(),
    tags: TagsSchema.optional(),
    metadata: MetadataSchema.optional(),
    content: z.string().nullable().optional(),
    embeddingModel: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Aucun champ à mettre à jour',
  });

/** Schéma de filtrage de `list()`. */
export const ResourceFiltersSchema = z.object({
  type: ResourceTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
  projectId: ProjectIdSchema.optional(),
});

/** Schéma d'une ressource persistée. */
export const ResourceSchema = z.object({
  id: z.uuid(),
  type: ResourceTypeSchema,
  title: z.string().min(1),
  url: z.url().optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
  content: z.string().optional(),
  embeddingModel: z.string().optional(),
  projectId: ProjectIdSchema.nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/** Statuts de projet (aligné sur la contrainte SQL `CHECK` de `projects`). */
export const ProjectStatusSchema = z.enum(['active', 'completed', 'archived']);

/** Schéma d'un projet persisté (table `projects`, Sprint 13). */
export const ProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable(),
  status: ProjectStatusSchema,
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  metadata: MetadataSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/**
 * Schéma de création d'un projet.
 *
 * `status` vaut `active` par défaut ; `metadata` porte notamment l'URL du
 * projet (la table `projects` n'a pas de colonne `url` — écart connu du
 * livrable documentaire Sprint 13).
 */
export const CreateProjectSchema = z.object({
  name: TitleSchema.max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z.string().max(2000).nullish(),
  status: ProjectStatusSchema.default('active'),
  startedAt: z.iso.datetime().nullish(),
  completedAt: z.iso.datetime().nullish(),
  metadata: MetadataSchema.default({}),
});

/** Schéma de mise à jour partielle d'un projet (`null` efface un champ). */
export const UpdateProjectSchema = CreateProjectSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Aucun champ à mettre à jour' },
);

/** Schéma de filtrage de la liste des projets. */
export const ProjectFiltersSchema = z.object({
  status: ProjectStatusSchema.optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Entrées d'API : `z.input` conserve les champs optionnels (valeurs par défaut
 * appliquées par Zod), ce qui permet `repository.create({ type, title })`.
 */
export type CreateResourceInput = z.input<typeof CreateResourceSchema>;
export type UpdateResourceInput = z.input<typeof UpdateResourceSchema>;
export type ResourceFilters = z.input<typeof ResourceFiltersSchema>;

/** Sorties validées : `z.output` reflète l'état réellement persisté. */
export type ResourceType = z.infer<typeof ResourceTypeSchema>;
export type Resource = z.infer<typeof ResourceSchema>;

/** Projet (Sprint 13) : mêmes conventions que les ressources. */
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.input<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.input<typeof UpdateProjectSchema>;
export type ProjectFilters = z.input<typeof ProjectFiltersSchema>;
