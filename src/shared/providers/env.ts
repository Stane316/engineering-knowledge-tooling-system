import { PROVIDERS } from './catalog.js';
import type { ProviderDescriptor, ProviderId } from './types.js';

/**
 * Trousseau de clés : plusieurs clés par fournisseur.
 *
 * L'intérêt n'est pas cosmétique : un palier gratuit s'épuise vite (quotas
 * journaliers), et deux comptes suffisent à doubler le débit. Le routage fait
 * tourner les clés d'un même fournisseur avant de basculer vers un autre.
 *
 * Convention de nommage, dans l'ordre de priorité :
 * `OPENAI_API_KEY`, `OPENAI_API_KEY_2`, `OPENAI_API_KEY_3`…
 * Les alias déclarés dans le catalogue (`GEMINI_API_KEY` / `GOOGLE_API_KEY`)
 * sont également lus.
 */
export type Keyring = ReadonlyMap<ProviderId, readonly string[]>;

/** Suffixes testés au-delà de la variable de base. */
const KEY_SUFFIXES = ['', '_2', '_3', '_4', '_5', '_6', '_7', '_8'] as const;

/**
 * Extrait et déduplique les clés d'un fournisseur.
 *
 * @param provider - Descripteur du fournisseur.
 * @param env - Variables d'environnement (injectables pour les tests).
 * @returns Clés non vides, sans doublon, dans l'ordre de déclaration.
 */
export function readProviderKeys(
  provider: ProviderDescriptor,
  env: NodeJS.ProcessEnv,
): readonly string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const base of provider.envKeys) {
    for (const suffix of KEY_SUFFIXES) {
      const value = env[`${base}${suffix}`]?.trim();

      if (value !== undefined && value.length > 0 && !seen.has(value)) {
        seen.add(value);
        keys.push(value);
      }
    }
  }

  return keys;
}

/**
 * Construit le trousseau à partir de l'environnement.
 *
 * @param env - Variables d'environnement (défaut : `process.env`).
 */
export function loadKeyring(env: NodeJS.ProcessEnv = process.env): Keyring {
  const keyring = new Map<ProviderId, readonly string[]>();

  for (const provider of PROVIDERS) {
    const keys = readProviderKeys(provider, env);

    if (keys.length > 0) {
      keyring.set(provider.id, keys);
    }
  }

  return keyring;
}

/**
 * Masque une clé pour l'affichage.
 *
 * Ne révèle que les quatre derniers caractères, **jamais plus d'un tiers de la
 * clé**, et **aucun** caractère d'une clé de moins de 12 caractères : une clé de
 * test courte serait sinon reconnaissable d'un coup d'œil dans une capture
 * d'écran de `npm run providers`.
 *
 * @param key - Clé en clair.
 */
export function maskKey(key: string): string {
  if (key.length < 12) {
    return '*'.repeat(key.length);
  }

  const visible = Math.min(4, Math.floor(key.length / 3));

  return `${'*'.repeat(key.length - visible)}${key.slice(-visible)}`;
}

/**
 * Remplace toute clé connue par sa forme masquée dans un texte.
 *
 * Filet de sécurité appliqué aux messages d'erreur : même si un fournisseur
 * renvoie la clé dans son corps de réponse, elle ne finit pas dans les logs.
 *
 * @param text - Message susceptible de contenir un secret.
 * @param keyring - Clés à masquer.
 */
export function redactKeys(text: string, keyring: Keyring): string {
  let result = text;

  for (const keys of keyring.values()) {
    for (const key of keys) {
      if (key.length >= 8) {
        result = result.split(key).join(maskKey(key));
      }
    }
  }

  return result;
}
