import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { z } from 'zod';

import { ValidationError } from '../errors.js';
import { mergeProviders, PROVIDERS } from './catalog.js';
import type { ProviderDescriptor } from './types.js';

/**
 * Fournisseurs déclarés par l'utilisateur, sans modification du code.
 *
 * **Pourquoi ce fichier existe-t-il ?** Une clé d'API n'a de valeur que par
 * l'endpoint qu'elle ouvre. Le catalogue livré couvre les fournisseurs connus
 * au moment de la rédaction ; il serait absurde d'attendre une version du
 * logiciel pour brancher le service qui vient d'ouvrir un palier gratuit.
 *
 * L'utilisateur décrit donc son fournisseur dans `providers.custom.json` :
 * identifiant, capacité, protocole filaire et variables d'environnement qui
 * portent les clés. **Le fichier ne contient jamais de secret** : uniquement le
 * *nom* de la variable (`MYPROVIDER_API_KEY`), dont les valeurs restent dans
 * `.env`, ignoré par Git.
 *
 * Trois garde-fous, justifiés un par un :
 *
 * 1. **HTTPS obligatoire** — une base URL en `http://` ferait voyager la clé en
 *    clair sur le réseau ;
 * 2. **protocole connu** — `unknown` n'est pas accepté : déclarer un
 *    fournisseur, c'est affirmer comment lui parler. Un protocole inconnu
 *    produirait un 400 systématique au premier appel ;
 * 3. **pas d'en-tête `authorization`** — une clé écrite en dur dans ce fichier
 *    serait versionnée puis oubliée. Les secrets passent par `.env`, point.
 *
 * Le format est un tableau JSON d'objets. Exemple minimal :
 *
 * ```json
 * [
 *   {
 *     "id": "mistral",
 *     "label": "Mistral",
 *     "envKeys": ["MISTRAL_API_KEY"],
 *     "baseUrl": "https://api.mistral.ai/v1",
 *     "protocol": "openai-compatible",
 *     "capabilities": ["chat"],
 *     "chat": [{ "model": "mistral-large-latest", "free": false }]
 *   }
 * ]
 * ```
 */

/** Variable d'environnement qui pointe vers un autre fichier. */
export const PROVIDERS_FILE_ENV = 'EKTS_PROVIDERS_FILE';

/** Nom du fichier cherché par défaut, dans le répertoire courant. */
export const DEFAULT_PROVIDERS_FILE = 'providers.custom.json';

const IdentifierSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,23}$/u,
    'identifiant attendu : minuscules, chiffres et tirets (2–24)',
  );

const EnvKeySchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]*$/u, 'nom de variable attendu : MAJUSCULES et soulignés');

const HttpsUrlSchema = z
  .url('URL invalide (https:// attendu)')
  .refine(
    (value) => value.startsWith('https://'),
    'HTTPS obligatoire : une clé ne voyage pas en clair',
  );

const SpaceSchema = z
  .string()
  .regex(/^[a-z0-9-]+\/[a-z0-9.-]+$/u, 'espace attendu : « éditeur/modèle »');

const EmbeddingModelSchema = z.object({
  model: z.string().trim().min(1),
  space: SpaceSchema,
  dimensions: z.number().int().positive(),
  free: z.boolean().default(false),
  asymmetric: z.boolean().optional(),
  note: z.string().optional(),
});

const ChatModelSchema = z.object({
  model: z.string().trim().min(1),
  free: z.boolean().default(false),
  strengths: z.array(z.string()).optional(),
});

const HeadersSchema = z
  .record(z.string(), z.string())
  .refine(
    (headers) => !Object.keys(headers).some((name) => name.toLowerCase() === 'authorization'),
    'en-tête « authorization » interdit ici : la clé doit venir de .env',
  );

/** Schéma d'un fournisseur déclaré par l'utilisateur. */
export const CustomProviderSchema = z
  .object({
    id: IdentifierSchema,
    label: z.string().trim().min(1).max(64),
    envKeys: z.array(EnvKeySchema).min(1, 'au moins une variable d’environnement'),
    baseUrl: HttpsUrlSchema,
    protocol: z.enum(['openai-compatible', 'tavily', 'serper', 'serpapi', 'sofya', 'e2b']),
    capabilities: z
      .array(z.enum(['embedding', 'chat', 'web-search', 'web-fetch', 'sandbox']))
      .min(1),
    embeddings: z.array(EmbeddingModelSchema).optional(),
    chat: z.array(ChatModelSchema).optional(),
    embeddingExtra: z.record(z.string(), z.string()).optional(),
    headers: HeadersSchema.optional(),
    docsUrl: HttpsUrlSchema.optional(),
    note: z.string().optional(),
  })
  .refine(
    (provider) =>
      !provider.capabilities.includes('embedding') || (provider.embeddings?.length ?? 0) > 0,
    {
      message: 'capacité « embedding » déclarée sans modèle',
      path: ['embeddings'],
    },
  )
  .refine(
    (provider) => !provider.capabilities.includes('chat') || (provider.chat?.length ?? 0) > 0,
    {
      message: 'capacité « chat » déclarée sans modèle',
      path: ['chat'],
    },
  );

type CustomProvider = z.output<typeof CustomProviderSchema>;

/** Traduit une déclaration validée en descripteur du registre. */
function toDescriptor(provider: CustomProvider): ProviderDescriptor {
  const baseUrl = provider.baseUrl.replace(/\/+$/u, '');

  return {
    id: provider.id,
    label: provider.label,
    envKeys: provider.envKeys,
    baseUrl,
    protocol: provider.protocol,
    capabilities: provider.capabilities,
    docsUrl: provider.docsUrl ?? baseUrl,
    status: 'verified',
    ...(provider.embeddings === undefined ? {} : { embeddings: provider.embeddings }),
    ...(provider.chat === undefined ? {} : { chat: provider.chat }),
    ...(provider.embeddingExtra === undefined ? {} : { embeddingExtra: provider.embeddingExtra }),
    ...(provider.headers === undefined ? {} : { headers: provider.headers }),
    ...(provider.note === undefined ? {} : { note: provider.note }),
  };
}

/** Chemin effectif du fichier de déclaration. */
export function resolveProvidersFile(options: {
  env?: NodeJS.ProcessEnv;
  file?: string;
  cwd?: string;
}): string {
  const configured = options.file ?? options.env?.[PROVIDERS_FILE_ENV]?.trim();

  return resolve(
    options.cwd ?? process.cwd(),
    configured !== undefined && configured.length > 0 ? configured : DEFAULT_PROVIDERS_FILE,
  );
}

/**
 * Charge les fournisseurs déclarés par l'utilisateur.
 *
 * Un fichier absent n'est pas une erreur : c'est la configuration par défaut.
 * Un fichier présent mais illisible ou invalide **est** une erreur — le
 * signaler vaut mieux que d'ignorer silencieusement une clé que l'utilisateur
 * croit active.
 *
 * @throws {ValidationError} Fichier illisible, JSON invalide ou schéma non respecté.
 */
export function loadCustomProviders(
  options: { env?: NodeJS.ProcessEnv; file?: string; cwd?: string } = {},
): ProviderDescriptor[] {
  const file = resolveProvidersFile(options);
  let raw: string;

  try {
    raw = readFileSync(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw new ValidationError([`${file} : lecture impossible`], { cause: error });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ValidationError([`${file} : JSON invalide (${(error as Error).message})`], {
      cause: error,
    });
  }

  const result = z.array(CustomProviderSchema).safeParse(parsed);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(racine)';
        return `${file} → ${path} : ${issue.message}`;
      }),
    );
  }

  return result.data.map(toDescriptor);
}

/**
 * Registre effectif : catalogue livré, complété (ou corrigé) par le fichier
 * de l'utilisateur.
 *
 * @throws {ValidationError} Déclaration invalide (voir `loadCustomProviders`).
 * @throws {Error} Identifiant déclaré deux fois.
 */
export function loadProviderRegistry(
  options: { env?: NodeJS.ProcessEnv; file?: string; cwd?: string } = {},
): readonly ProviderDescriptor[] {
  const custom = loadCustomProviders(options);

  return custom.length === 0 ? PROVIDERS : mergeProviders(custom, PROVIDERS);
}
