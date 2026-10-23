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

/** Schéma de création d'une ressource. */
export const CreateResourceSchema = z.object({
  type: ResourceTypeSchema,
  title: TitleSchema,
  url: UrlSchema.optional(),
  tags: TagsSchema.default([]),
  metadata: MetadataSchema.default({}),
  content: z.string().optional(),
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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
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
