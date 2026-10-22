import { describe, expect, it } from 'vitest';

import { ProviderHealth } from '../../src/business/providers/health.js';
import { availableSpaces, planRoutes } from '../../src/business/providers/routing.js';
import { loadKeyring, type Keyring } from '../../src/shared/providers/env.js';

const keyring = (env: NodeJS.ProcessEnv): Keyring => loadKeyring(env);

describe('planRoutes', () => {
  it('ne retient que les fournisseurs disposant d’une clé', () => {
    const routes = planRoutes({
      capability: 'chat',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1' }),
    });

    expect(routes.every((route) => route.provider.id === 'openai')).toBe(true);
    expect(routes).toHaveLength(2); // gpt-4o-mini puis gpt-4o
  });

  it('renvoie une chaîne vide sans clé', () => {
    expect(planRoutes({ capability: 'embedding', keyring: keyring({}) })).toEqual([]);
  });

  it('attache les clés disponibles à chaque route', () => {
    const routes = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1', OPENAI_API_KEY_2: 'sk-2' }),
    });

    expect(routes[0]?.keys).toEqual(['sk-1', 'sk-2']);
  });

  it('épingle un seul espace d’embedding', () => {
    const routes = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1', GEMINI_API_KEY: 'g-1' }),
    });

    const spaces = new Set(routes.map((route) => route.space));

    expect(spaces.size).toBe(1);
    expect(routes[0]?.space).toBe('openai/text-embedding-3-small');
  });

  it('respecte un espace imposé', () => {
    const routes = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1', GEMINI_API_KEY: 'g-1' }),
      space: 'google/gemini-embedding-001',
    });

    expect(routes).toHaveLength(1);
    expect(routes[0]?.provider.id).toBe('gemini');
    expect(routes[0]?.nativeDimensions).toBe(3072);
  });

  it('renvoie une chaîne vide si l’espace imposé n’a pas de clé', () => {
    const routes = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1' }),
      space: 'baai/bge-m3',
    });

    expect(routes).toEqual([]);
  });

  it('partage un espace entre plusieurs fournisseurs', () => {
    const routes = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1', OPENROUTER_API_KEY: 'or-1' }),
    });

    expect(routes.map((route) => route.provider.id)).toEqual(['openai', 'openrouter']);
    expect(new Set(routes.map((route) => route.space)).size).toBe(1);
  });

  it('élimine les modèles payants avec la politique « free »', () => {
    const routes = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1', GEMINI_API_KEY: 'g-1' }),
      policy: 'free',
      space: 'google/gemini-embedding-001',
    });

    expect(routes).toHaveLength(1);
    expect(routes[0]?.provider.id).toBe('gemini');

    const paidOnly = planRoutes({
      capability: 'embedding',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1' }),
      policy: 'free',
    });

    expect(paidOnly).toEqual([]);
  });

  it('place les modèles gratuits en tête avec la politique « cost »', () => {
    const routes = planRoutes({
      capability: 'chat',
      keyring: keyring({ NOVITA_API_KEY: 'n-1', GEMINI_API_KEY: 'g-1' }),
      policy: 'cost',
    });

    expect(routes[0]?.provider.id).toBe('gemini');
  });

  it('relègue les fournisseurs au circuit ouvert en fin de chaîne', () => {
    const health = new ProviderHealth();

    health.recordFailure('openai');
    health.recordFailure('openai');
    health.recordFailure('openai');

    const routes = planRoutes({
      capability: 'chat',
      keyring: keyring({ OPENAI_API_KEY: 'sk-1', GEMINI_API_KEY: 'g-1' }),
      health,
    });

    expect(routes[0]?.provider.id).toBe('gemini');
    expect(routes.at(-1)?.provider.id).toBe('openai');
  });

  it('décrit une route de recherche sans modèle', () => {
    const routes = planRoutes({
      capability: 'web-search',
      keyring: keyring({ TAVILY_API_KEY: 'tvly-1' }),
    });

    expect(routes[0]).toMatchObject({ provider: { id: 'tavily' }, model: '' });
    expect(routes[0]?.space).toBeUndefined();
    expect(routes[0]?.nativeDimensions).toBeUndefined();
  });

  it('décrit une route de bac à sable', () => {
    const routes = planRoutes({
      capability: 'sandbox',
      keyring: keyring({ E2B_API_KEY: 'e2b-1' }),
    });

    expect(routes[0]?.provider.id).toBe('e2b');
  });

  it('ignore une clé de fournisseur non vérifié', () => {
    expect(planRoutes({ capability: 'chat', keyring: keyring({ SOFYA_API_KEY: 's-1' }) })).toEqual(
      [],
    );
  });
});

describe('availableSpaces', () => {
  it('regroupe les fournisseurs par espace', () => {
    const spaces = availableSpaces(
      keyring({ OPENAI_API_KEY: 'sk-1', OPENROUTER_API_KEY: 'or-1', NOVITA_API_KEY: 'n-1' }),
    );

    const openaiSpace = spaces.find((space) => space.space === 'openai/text-embedding-3-small');
    const bge = spaces.find((space) => space.space === 'baai/bge-m3');

    expect(openaiSpace?.providers.map((provider) => provider.id)).toEqual(['openai', 'openrouter']);
    expect(openaiSpace?.dimensions).toBe(1536);
    expect(bge?.providers.map((provider) => provider.id)).toEqual(['openrouter', 'novita']);
    expect(bge?.free).toBe(true);
  });

  it('renvoie une liste vide sans clé d’embedding', () => {
    expect(availableSpaces(keyring({ TAVILY_API_KEY: 'tvly-1' }))).toEqual([]);
  });
});
