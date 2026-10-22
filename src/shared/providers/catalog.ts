import type { Capability, ProviderDescriptor, ProviderId } from './types.js';

/**
 * Catalogue des fournisseurs supportés.
 *
 * Chaque entrée a été vérifiée contre la documentation officielle (URL dans
 * `docsUrl`) — voir `docs/guides/PROVIDERS.md` §2 pour la date de vérification.
 * Aucune clé n'est stockée ici : uniquement des métadonnées.
 *
 * **Pourquoi neuf fournisseurs « chat » ne font-ils qu'un seul protocole ?**
 * OpenAI, OpenRouter, Gemini, DeepSeek, Z.ai, NVIDIA, Novita, StepFun et MiniMax
 * exposent tous une surface `/chat/completions` compatible OpenAI. Un adaptateur
 * unique les couvre ; seules les *déviations* (en-tête, modèle, champ
 * additionnel) sont déclarées dans le catalogue. Ajouter un fournisseur =
 * ajouter une entrée — ou, sans toucher au code, un bloc dans
 * `providers.custom.json` (voir `custom-providers.ts`).
 */
export const PROVIDERS: readonly ProviderDescriptor[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    envKeys: ['OPENAI_API_KEY'],
    baseUrl: 'https://api.openai.com/v1',
    protocol: 'openai-compatible',
    capabilities: ['embedding', 'chat'],
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    status: 'verified',
    embeddings: [
      {
        model: 'text-embedding-3-small',
        space: 'openai/text-embedding-3-small',
        dimensions: 1536,
        free: false,
        note: 'Référence : dimension native 1536, aucune conversion nécessaire',
      },
      {
        model: 'text-embedding-3-large',
        space: 'openai/text-embedding-3-large',
        dimensions: 3072,
        free: false,
        note: 'Demander dimensions=1536 si utilisé comme espace actif',
      },
    ],
    chat: [
      { model: 'gpt-4o-mini', free: false, strengths: ['généraliste', 'json'] },
      { model: 'gpt-4o', free: false, strengths: ['raisonnement'] },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    envKeys: ['OPENROUTER_API_KEY'],
    baseUrl: 'https://openrouter.ai/api/v1',
    protocol: 'openai-compatible',
    capabilities: ['embedding', 'chat'],
    docsUrl: 'https://openrouter.ai/docs/api-reference/embeddings',
    status: 'verified',
    headers: {
      'HTTP-Referer': 'https://github.com/Stane316/engineering-knowledge-tooling-system',
      'X-Title': 'EKTS',
    },
    embeddings: [
      {
        model: 'openai/text-embedding-3-small',
        space: 'openai/text-embedding-3-small',
        dimensions: 1536,
        free: false,
        note: 'Même espace que OpenAI : bascule possible sans réindexation',
      },
      {
        model: 'baai/bge-m3',
        space: 'baai/bge-m3',
        dimensions: 1024,
        free: false,
        note: 'Multilingue (français inclus), mais espace distinct',
      },
    ],
    chat: [
      { model: 'openai/gpt-4o-mini', free: false, strengths: ['généraliste'] },
      { model: 'deepseek/deepseek-chat', free: false, strengths: ['coût', 'code'] },
    ],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    envKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    protocol: 'openai-compatible',
    capabilities: ['embedding', 'chat'],
    docsUrl: 'https://ai.google.dev/gemini-api/docs/embeddings',
    status: 'verified',
    embeddings: [
      {
        model: 'gemini-embedding-001',
        space: 'google/gemini-embedding-001',
        dimensions: 3072,
        free: true,
        asymmetric: true,
        note: 'MRL : dimensions=1536 accepté ; taskType RETRIEVAL_DOCUMENT/QUERY',
      },
    ],
    chat: [{ model: 'gemini-2.5-flash', free: true, strengths: ['gratuit', 'contexte long'] }],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    envKeys: ['DEEPSEEK_API_KEY'],
    baseUrl: 'https://api.deepseek.com',
    protocol: 'openai-compatible',
    capabilities: ['chat'],
    docsUrl: 'https://api-docs.deepseek.com',
    status: 'verified',
    note: 'Aucune API d’embedding : la clé ne peut pas alimenter l’index vectoriel',
    chat: [
      { model: 'deepseek-chat', free: false, strengths: ['coût', 'code'] },
      { model: 'deepseek-reasoner', free: false, strengths: ['raisonnement'] },
    ],
  },
  {
    id: 'zai',
    label: 'Z.ai (GLM)',
    envKeys: ['ZAI_API_KEY', 'Z_AI_API_KEY'],
    baseUrl: 'https://api.z.ai/api/paas/v4',
    protocol: 'openai-compatible',
    capabilities: ['chat'],
    docsUrl: 'https://docs.z.ai/api-reference/introduction',
    status: 'verified',
    note: 'Chat uniquement ; le plan « coding » utilise une autre base URL',
    chat: [
      { model: 'glm-4.6', free: false, strengths: ['code', 'agentique'] },
      { model: 'glm-4.5-air', free: true, strengths: ['gratuit', 'rapide'] },
    ],
  },
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    envKeys: ['NVIDIA_API_KEY', 'NVIDIA_NIM_API_KEY'],
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    protocol: 'openai-compatible',
    capabilities: ['chat'],
    docsUrl: 'https://docs.api.nvidia.com/nim/reference/retrieval-apis',
    status: 'verified',
    note: 'Embeddings écartés : les modèles NIM exposés sont asymétriques (input_type) ou en 1024/4096 dimensions — hors schéma 1536 sans perte',
    chat: [
      { model: 'meta/llama-3.3-70b-instruct', free: true, strengths: ['gratuit', 'généraliste'] },
      { model: 'nvidia/llama-3.1-nemotron-70b-instruct', free: true, strengths: ['gratuit'] },
    ],
  },
  {
    id: 'novita',
    label: 'Novita AI',
    envKeys: ['NOVITA_API_KEY'],
    baseUrl: 'https://api.novita.ai/openai',
    protocol: 'openai-compatible',
    capabilities: ['embedding', 'chat'],
    docsUrl: 'https://novita.ai/docs/api-reference/api-reference-overview',
    status: 'verified',
    embeddings: [
      {
        model: 'baai/bge-m3',
        space: 'baai/bge-m3',
        dimensions: 1024,
        free: true,
        note: 'Multilingue, 8192 tokens ; complété à 1536 par zéros (cosinus préservé)',
      },
    ],
    chat: [{ model: 'deepseek/deepseek-v3.2', free: false, strengths: ['coût'] }],
  },
  {
    id: 'stepfun',
    label: 'StepFun',
    envKeys: ['STEPFUN_API_KEY', 'STEP_API_KEY'],
    baseUrl: 'https://api.stepfun.ai/v1',
    protocol: 'openai-compatible',
    capabilities: ['chat'],
    docsUrl: 'https://platform.stepfun.ai/docs/en/api-reference/chat/chat-completion-create',
    status: 'verified',
    note: 'Point d’entrée international ; api.stepfun.com/v1 pour la Chine',
    chat: [{ model: 'step-3.5-flash', free: false, strengths: ['rapide', 'multimodal'] }],
  },
  {
    id: 'minimax',
    label: 'MiniMax',
    envKeys: ['MINIMAX_API_KEY'],
    baseUrl: 'https://api.minimax.io/v1',
    protocol: 'openai-compatible',
    capabilities: ['chat'],
    docsUrl: 'https://platform.minimax.io/docs/api-reference/text-chat-openai',
    status: 'verified',
    note: 'Région internationale (api.minimaxi.com en Chine) ; embo-01 (1024 dims, ancienne API) n’est pas exposé en surface OpenAI — chat uniquement',
    chat: [
      { model: 'MiniMax-M3', free: false, strengths: ['raisonnement', 'agentique'] },
      { model: 'MiniMax-M3.1-Flash', free: false, strengths: ['rapide', 'multimodal'] },
    ],
  },
  {
    id: 'tavily',
    label: 'Tavily',
    envKeys: ['TAVILY_API_KEY'],
    baseUrl: 'https://api.tavily.com',
    protocol: 'tavily',
    capabilities: ['web-search'],
    docsUrl: 'https://docs.tavily.com/documentation/api-reference/endpoint/search',
    status: 'verified',
    note: 'Recherche pensée pour les agents (extraits prêts à l’emploi)',
  },
  {
    id: 'serper',
    label: 'Serper (Google SERP)',
    envKeys: ['SERPER_API_KEY'],
    baseUrl: 'https://google.serper.dev',
    protocol: 'serper',
    capabilities: ['web-search'],
    docsUrl: 'https://serper.dev',
    status: 'verified',
    note: 'Résultats Google bruts : excellent rappel, bruit à filtrer',
  },
  {
    id: 'serpapi',
    label: 'SerpApi',
    envKeys: ['SERPAPI_API_KEY', 'SERPLY_API_KEY'],
    baseUrl: 'https://serpapi.com',
    protocol: 'serpapi',
    capabilities: ['web-search'],
    docsUrl: 'https://serpapi.com/search-api',
    status: 'verified',
    note: 'Alias SERPLY_API_KEY accepté (clé « serply » à confirmer)',
  },
  {
    id: 'e2b',
    label: 'E2B (bac à sable)',
    envKeys: ['E2B_API_KEY'],
    baseUrl: 'https://api.e2b.dev',
    protocol: 'e2b',
    capabilities: ['sandbox'],
    docsUrl: 'https://e2b.dev/docs',
    status: 'verified',
    note: 'Collectée dès maintenant ; exécution de code branchée au Sprint 8',
  },
  {
    id: 'sofya',
    label: 'Sofya',
    envKeys: ['SOFYA_API_KEY'],
    baseUrl: 'https://sofya.co',
    protocol: 'sofya',
    capabilities: ['web-search', 'web-fetch'],
    docsUrl: 'https://sofya.co/docs',
    status: 'verified',
    note: 'Recherche avec contenu extrait (pas seulement des extraits) et lecture d’URL en markdown (PDF/DOCX inclus). Extract et research, facturés 10 et 50 crédits et synthétisés par un LLM, ne sont pas exposés',
  },
];

/**
 * Fusionne les fournisseurs déclarés par l'utilisateur avec ceux livrés.
 *
 * Un identifiant déjà connu **remplace** l'entrée livrée sans changer sa
 * position : c'est le moyen prévu pour adapter un fournisseur existant (autre
 * région, autre base URL, plan « coding ») sans dupliquer son entrée. Les
 * nouveaux identifiants sont ajoutés à la suite, donc en fin de chaîne
 * d'appel — un fournisseur maison ne prend jamais la priorité sur un
 * fournisseur éprouvé.
 *
 * @throws {Error} Identifiant déclaré deux fois dans `custom`.
 */
export function mergeProviders(
  custom: readonly ProviderDescriptor[],
  base: readonly ProviderDescriptor[] = PROVIDERS,
): ProviderDescriptor[] {
  const merged = [...base];
  const positions = new Map(merged.map((provider, index) => [provider.id, index]));
  const declared = new Set<string>();

  for (const provider of custom) {
    if (declared.has(provider.id)) {
      throw new Error(`fournisseur « ${provider.id} » déclaré deux fois`);
    }

    declared.add(provider.id);

    const position = positions.get(provider.id);

    if (position === undefined) {
      positions.set(provider.id, merged.length);
      merged.push(provider);
    } else {
      merged[position] = provider;
    }
  }

  return merged;
}

/**
 * Fournisseur par identifiant.
 *
 * @param id - Identifiant (livré ou déclaré par l'utilisateur).
 * @param providers - Registre à consulter (défaut : catalogue livré).
 * @throws {Error} Identifiant inconnu du registre (erreur de programmation).
 */
export function getProvider(
  id: ProviderId,
  providers: readonly ProviderDescriptor[] = PROVIDERS,
): ProviderDescriptor {
  const provider = providers.find((item) => item.id === id);

  if (provider === undefined) {
    throw new Error(`fournisseur inconnu : ${id}`);
  }

  return provider;
}

/** Fournisseurs déclarant une capacité donnée, dans l'ordre du registre. */
export function providersWith(
  capability: Capability,
  providers: readonly ProviderDescriptor[] = PROVIDERS,
): ProviderDescriptor[] {
  return providers.filter((provider) => provider.capabilities.includes(capability));
}

/** Fournisseurs exploitables (protocole connu) pour une capacité donnée. */
export function usableProviders(
  capability: Capability,
  providers: readonly ProviderDescriptor[] = PROVIDERS,
): ProviderDescriptor[] {
  return providersWith(capability, providers).filter((provider) => provider.protocol !== 'unknown');
}

/** Ordre d'affichage des capacités (du plus structurant au plus accessoire). */
const CAPABILITY_ORDER: readonly Capability[] = [
  'embedding',
  'chat',
  'web-search',
  'web-fetch',
  'sandbox',
];

/**
 * Capacités couvertes par le registre, sans doublon.
 *
 * L'ordre est canonique et non celui de déclaration : la sortie de
 * `npm run providers` doit être stable d'une exécution à l'autre.
 */
export function allCapabilities(
  providers: readonly ProviderDescriptor[] = PROVIDERS,
): Capability[] {
  const seen = new Set<Capability>();

  for (const provider of providers) {
    for (const capability of provider.capabilities) {
      seen.add(capability);
    }
  }

  return CAPABILITY_ORDER.filter((capability) => seen.has(capability));
}
