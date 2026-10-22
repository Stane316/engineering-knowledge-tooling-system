import { describe, expect, it } from 'vitest';

import { getProvider } from '../../src/shared/providers/catalog.js';
import {
  loadKeyring,
  maskKey,
  readProviderKeys,
  redactKeys,
} from '../../src/shared/providers/env.js';

describe('readProviderKeys', () => {
  const openai = getProvider('openai');
  const gemini = getProvider('gemini');

  it('lit la variable de base', () => {
    expect(readProviderKeys(openai, { OPENAI_API_KEY: 'sk-1' })).toEqual(['sk-1']);
  });

  it('lit les suffixes jusqu’à _8, dans l’ordre', () => {
    const keys = readProviderKeys(openai, {
      OPENAI_API_KEY: 'sk-1',
      OPENAI_API_KEY_2: 'sk-2',
      OPENAI_API_KEY_3: 'sk-3',
      OPENAI_API_KEY_9: 'sk-ignoree',
    });

    expect(keys).toEqual(['sk-1', 'sk-2', 'sk-3']);
  });

  it('dédoublonne les clés répétées', () => {
    expect(readProviderKeys(openai, { OPENAI_API_KEY: 'sk-1', OPENAI_API_KEY_2: 'sk-1' })).toEqual([
      'sk-1',
    ]);
  });

  it('ignore les valeurs vides ou blanches', () => {
    expect(readProviderKeys(openai, { OPENAI_API_KEY: '   ', OPENAI_API_KEY_2: '' })).toEqual([]);
    expect(readProviderKeys(openai, {})).toEqual([]);
  });

  it('taille les valeurs', () => {
    expect(readProviderKeys(openai, { OPENAI_API_KEY: '  sk-espaces  ' })).toEqual(['sk-espaces']);
  });

  it('lit les alias déclarés (GEMINI / GOOGLE)', () => {
    expect(readProviderKeys(gemini, { GOOGLE_API_KEY: 'g-1' })).toEqual(['g-1']);
    expect(readProviderKeys(gemini, { GEMINI_API_KEY: 'g-1', GOOGLE_API_KEY: 'g-2' })).toEqual([
      'g-1',
      'g-2',
    ]);
    expect(readProviderKeys(gemini, { GOOGLE_API_KEY_2: 'g-3' })).toEqual(['g-3']);
  });
});

describe('loadKeyring', () => {
  it('ne retient que les fournisseurs effectivement configurés', () => {
    const keyring = loadKeyring({
      OPENAI_API_KEY: 'sk-1',
      OPENAI_API_KEY_2: 'sk-2',
      TAVILY_API_KEY: 'tvly-1',
      SERPAPI_API_KEY: 'serp-1',
    });

    expect([...keyring.keys()]).toEqual(['openai', 'tavily', 'serpapi']);
    expect(keyring.get('openai')).toEqual(['sk-1', 'sk-2']);
  });

  it('accepte trois clés Z.ai (ZAI_API_KEY, _2 puis _3)', () => {
    // Le suffixe n'est pas propre à OpenAI : tout fournisseur livré ou déclaré
    // en bénéficie, sans configuration supplémentaire.
    const keyring = loadKeyring({
      ZAI_API_KEY: 'z-1',
      ZAI_API_KEY_2: 'z-2',
      ZAI_API_KEY_3: 'z-3',
    });

    expect(keyring.get('zai')).toEqual(['z-1', 'z-2', 'z-3']);
  });

  it('ignore les suffixes au-delà de _8', () => {
    const keyring = loadKeyring({ ZAI_API_KEY: 'z-1', ZAI_API_KEY_9: 'z-9' });

    expect(keyring.get('zai')).toEqual(['z-1']);
  });

  it('accepte l’alias SERPLY pour SerpApi', () => {
    const keyring = loadKeyring({ SERPLY_API_KEY: 'serply-1' });

    expect(keyring.get('serpapi')).toEqual(['serply-1']);
  });

  it('renvoie un trousseau vide sans variable', () => {
    expect(loadKeyring({}).size).toBe(0);
  });
});

describe('maskKey', () => {
  it('ne révèle jamais plus du tiers de la clé', () => {
    const key = 'sk-abcdefghijklmnopqrstuvwxyz';
    const masked = maskKey(key);

    expect(masked.endsWith('wxyz')).toBe(true);
    expect(masked.replace(/\*/gu, '')).toHaveLength(4);
    expect(masked).toHaveLength(key.length);
  });

  it('masque entièrement une clé trop courte pour être masquée partiellement', () => {
    expect(maskKey('abc')).toBe('***');
    expect(maskKey('')).toBe('');
  });

  it('révèle au plus quatre caractères', () => {
    const masked = maskKey('a'.repeat(60));

    expect(masked.replace(/\*/gu, '')).toBe('aaaa');
  });
});

describe('redactKeys', () => {
  // Valeur assemblée à l'exécution : écrite d'un seul tenant, elle déclencherait
  // la règle « generic-api-key » de Gitleaks dans la CI.
  const FAKE_KEY = ['sk', 'secret', '1234567890'].join('-');

  it('remplace toute clé présente dans un message', () => {
    const keyring = loadKeyring({ OPENAI_API_KEY: FAKE_KEY });
    const message = `erreur : clé ${FAKE_KEY} refusée`;

    expect(redactKeys(message, keyring)).not.toContain(FAKE_KEY);
    expect(redactKeys(message, keyring)).toContain(FAKE_KEY.slice(-4));
  });

  it('laisse intact un message sans clé', () => {
    const keyring = loadKeyring({ OPENAI_API_KEY: FAKE_KEY });

    expect(redactKeys('quota dépassé', keyring)).toBe('quota dépassé');
  });

  it('ignore les clés trop courtes pour être distinguées d’un mot', () => {
    const keyring = loadKeyring({ OPENAI_API_KEY: 'court' });

    expect(redactKeys('le mot court est courant', keyring)).toBe('le mot court est courant');
  });
});
