import type { Capability, ProviderDescriptor, ProviderId } from './types.js';

/**
 * Catalogue des fournisseurs supportés.
 *
 * Chaque entrée a été vérifiée contre la documentation officielle (URL dans
 * `docsUrl`) — voir `docs/guides/PROVIDERS.md` §2 pour la date de vérification.
 * Aucune clé n'est stockée ici : uniquement des métadonnées.
 *
 * **Pourquoi sept fournisseurs « chat » ne font-ils qu'un seul protocole ?**
 * OpenAI, OpenRouter, Gemini, DeepSeek, Z.ai, NVIDIA, Novita et StepFun exposent
 * tous une surface `/chat/completions` compatible OpenAI. Un adaptateur unique
 * les couvre ; seules les *déviations* (en-tête, modèle, champ additionnel) sont
 * déclarées dans le catalogue. Ajouter un fournisseur = ajouter une entrée.
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
    baseUrl: '',
    protocol: 'unknown',
    capabilities: [],
    docsUrl: '',
    status: 'unverified',
    note: 'Protocole non confirmé : clé collectée et affichée, jamais utilisée tant que non déclarée',
  },
];

/** Index par identifiant, construit une fois au chargement. */
const BY_ID = new Map<ProviderId, ProviderDescriptor>(PROVIDERS.map((item) => [item.id, item]));

/**
 * Fournisseur par identifiant.
 *
 * @throws {Error} Identifiant inconnu du catalogue (erreur de programmation).
 */
export function getProvider(id: ProviderId): ProviderDescriptor {
  const provider = BY_ID.get(id);

  if (provider === undefined) {
    throw new Error(`fournisseur inconnu : ${id}`);
  }

  return provider;
}

/** Fournisseurs déclarant une capacité donnée, dans l'ordre du catalogue. */
export function providersWith(capability: Capability): ProviderDescriptor[] {
  return PROVIDERS.filter((provider) => provider.capabilities.includes(capability));
}

/** Fournisseurs exploitables (protocole connu) pour une capacité donnée. */
export function usableProviders(capability: Capability): ProviderDescriptor[] {
  return providersWith(capability).filter((provider) => provider.protocol !== 'unknown');
}

/** Capacités couvertes par le catalogue, sans doublon. */
export function allCapabilities(): Capability[] {
  const seen = new Set<Capability>();

  for (const provider of PROVIDERS) {
    for (const capability of provider.capabilities) {
      seen.add(capability);
    }
  }

  return [...seen];
}
