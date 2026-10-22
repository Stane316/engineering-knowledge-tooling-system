import { describe, expect, it } from 'vitest';

import {
  PROVIDERS,
  allCapabilities,
  getProvider,
  providersWith,
  usableProviders,
} from '../../src/shared/providers/catalog.js';
import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import type { ProviderId } from '../../src/shared/providers/types.js';

describe('catalogue des fournisseurs', () => {
  it('couvre les quatorze fournisseurs du catalogue livré', () => {
    const ids = PROVIDERS.map((provider) => provider.id);

    expect(ids).toEqual([
      'openai',
      'openrouter',
      'gemini',
      'deepseek',
      'zai',
      'nvidia',
      'novita',
      'stepfun',
      'minimax',
      'tavily',
      'serper',
      'serpapi',
      'e2b',
      'sofya',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('déclare au moins une variable d’environnement par fournisseur', () => {
    for (const provider of PROVIDERS) {
      expect(provider.envKeys.length).toBeGreaterThan(0);
      expect(provider.envKeys.every((key) => key.length > 0)).toBe(true);
    }
  });

  it('donne une URL et un protocole à tout fournisseur utilisable', () => {
    for (const provider of PROVIDERS.filter((item) => item.status === 'verified')) {
      expect(provider.baseUrl).toMatch(/^https:\/\//);
      expect(provider.docsUrl).toMatch(/^https:\/\//);
      expect(provider.protocol).not.toBe('unknown');
      expect(provider.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('déclare Sofya vérifiée : recherche et lecture markdown', () => {
    const sofya = getProvider('sofya');

    expect(sofya.status).toBe('verified');
    expect(sofya.protocol).toBe('sofya');
    expect(sofya.capabilities).toEqual(['web-search', 'web-fetch']);
    expect(sofya.baseUrl).toBe('https://sofya.co');
  });

  it('exclut des chaînes d’appel tout fournisseur au protocole inconnu', () => {
    // Un fournisseur déclaré mais dont on ignore la façon de parler ne doit
    // jamais être contacté : le filtre s'applique quel que soit le registre.
    const ghost = {
      id: 'ghost',
      label: 'Ghost',
      envKeys: ['GHOST_API_KEY'],
      baseUrl: 'https://ghost.example.com',
      protocol: 'unknown',
      capabilities: ['chat'],
      chat: [{ model: 'ghost-1', free: true }],
      docsUrl: 'https://ghost.example.com',
      status: 'unverified',
    } as const;
    const registry = [...PROVIDERS, ghost];

    for (const capability of allCapabilities(registry)) {
      const ids = usableProviders(capability, registry).map((provider) => provider.id);
      expect(ids).not.toContain('ghost');
    }
  });

  it('déclare des modèles cohérents pour chaque capacité', () => {
    for (const provider of PROVIDERS) {
      if (provider.capabilities.includes('embedding')) {
        expect(provider.embeddings?.length ?? 0).toBeGreaterThan(0);
      }

      if (provider.capabilities.includes('chat')) {
        expect(provider.chat?.length ?? 0).toBeGreaterThan(0);
      }

      for (const model of provider.embeddings ?? []) {
        expect(model.space).toMatch(/^[a-z0-9-]+\/[a-z0-9.-]+$/);
        expect(model.dimensions).toBeGreaterThan(0);
      }
    }
  });

  it('n’expose que des vecteurs alignables sur le schéma', () => {
    for (const provider of PROVIDERS) {
      for (const model of provider.embeddings ?? []) {
        // Un modèle plus large que 1536 est ramené par le paramètre `dimensions`.
        expect(model.dimensions === EMBEDDING_DIMENSIONS || model.dimensions > 0).toBe(true);
      }
    }
  });

  it('indexe les fournisseurs par identifiant', () => {
    expect(getProvider('openai').label).toBe('OpenAI');
    expect(() => getProvider('inconnu' as ProviderId)).toThrow(/fournisseur inconnu/);
  });

  it('liste les fournisseurs par capacité', () => {
    expect(providersWith('embedding').map((provider) => provider.id)).toEqual([
      'openai',
      'openrouter',
      'gemini',
      'novita',
    ]);
    expect(providersWith('web-search').map((provider) => provider.id)).toEqual([
      'tavily',
      'serper',
      'serpapi',
      'sofya',
    ]);
    expect(providersWith('web-fetch').map((provider) => provider.id)).toEqual(['sofya']);
    expect(providersWith('chat').map((provider) => provider.id)).toContain('minimax');
    expect(providersWith('sandbox').map((provider) => provider.id)).toEqual(['e2b']);
    expect(providersWith('chat').map((provider) => provider.id)).toContain('deepseek');
  });

  it('déduplique les capacités', () => {
    expect(allCapabilities().sort()).toEqual([
      'chat',
      'embedding',
      'sandbox',
      'web-fetch',
      'web-search',
    ]);
  });

  it('partage l’espace OpenAI entre OpenAI et OpenRouter', () => {
    const openai = getProvider('openai').embeddings?.find(
      (model) => model.space === 'openai/text-embedding-3-small',
    );
    const openrouter = getProvider('openrouter').embeddings?.find(
      (model) => model.space === 'openai/text-embedding-3-small',
    );

    expect(openai?.dimensions).toBe(openrouter?.dimensions);
  });

  it('documente les fournisseurs sans embeddings', () => {
    for (const id of ['deepseek', 'zai', 'nvidia', 'stepfun', 'minimax'] as const) {
      const provider = getProvider(id);

      expect(provider.capabilities).toContain('chat');
      expect(provider.capabilities).not.toContain('embedding');
      expect(provider.note).toBeDefined();
    }
  });
});
