import { PROVIDERS, usableProviders } from '../../shared/providers/catalog.js';
import type { Keyring } from '../../shared/providers/env.js';
import type {
  Capability,
  ProviderDescriptor,
  ResolvedRoute,
  RoutingPolicy,
} from '../../shared/providers/types.js';
import type { ProviderHealth } from './health.js';

export interface PlanOptions {
  capability: Capability;
  keyring: Keyring;
  /** Politique de sélection (défaut : `quality`). */
  policy?: RoutingPolicy;
  /**
   * Espace d'embedding exigé.
   *
   * Si fourni, seuls les fournisseurs servant **cet espace** sont retenus : des
   * vecteurs de modèles différents ne sont pas comparables.
   */
  space?: string;
  /** Disjoncteur : les fournisseurs ouverts passent en fin de chaîne. */
  health?: ProviderHealth;
  /** Registre à interroger (défaut : catalogue livré + fournisseurs déclarés chargés par l'appelant). */
  providers?: readonly ProviderDescriptor[];
}

interface Candidate {
  provider: ProviderDescriptor;
  model: string;
  space?: string;
  nativeDimensions?: number;
  free: boolean;
  keys: readonly string[];
}

/**
 * Construit la chaîne d'appel d'une capacité.
 *
 * Règles, dans l'ordre :
 * 1. **capacité** : seuls les fournisseurs qui la déclarent (et dont le
 *    protocole est connu) sont candidats ;
 * 2. **clé présente** : un fournisseur sans clé n'est jamais contacté ;
 * 3. **espace** : pour les embeddings, un seul espace est retenu — celui
 *    demandé, sinon celui du premier candidat (ordre du catalogue = ordre de
 *    qualité). Aucune bascule vers un autre espace n'est planifiée : elle
 *    produirait des vecteurs incomparables au reste de l'index ;
 * 4. **politique** : `free` élimine les modèles payants, `cost` les place en
 *    fin de chaîne, `quality` conserve l'ordre du catalogue ;
 * 5. **santé** : les fournisseurs dont le disjoncteur est ouvert sont
 *    repoussés en fin de liste, jamais supprimés (dernier recours).
 */
export function planRoutes(options: PlanOptions): ResolvedRoute[] {
  const policy = options.policy ?? 'quality';
  let candidates = collectCandidates(
    options.capability,
    options.keyring,
    options.providers ?? PROVIDERS,
  );

  if (options.capability === 'embedding') {
    const space = options.space ?? candidates.find((item) => item.space !== undefined)?.space;

    if (space !== undefined) {
      candidates = candidates.filter((item) => item.space === space);
    }
  }

  if (policy === 'free') {
    candidates = candidates.filter((item) => item.free);
  }

  if (policy === 'cost') {
    candidates.sort((left, right) => Number(right.free) - Number(left.free));
  }

  const ordered =
    options.health === undefined ? candidates : sortByHealth(candidates, options.health);

  return ordered.map((candidate) => ({
    provider: candidate.provider,
    model: candidate.model,
    ...(candidate.space === undefined ? {} : { space: candidate.space }),
    ...(candidate.nativeDimensions === undefined
      ? {}
      : { nativeDimensions: candidate.nativeDimensions }),
    keys: candidate.keys,
  }));
}

/** Tous les candidats d'une capacité, avant filtrage. */
function collectCandidates(
  capability: Capability,
  keyring: Keyring,
  providers: readonly ProviderDescriptor[],
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const provider of usableProviders(capability, providers)) {
    const keys = keyring.get(provider.id) ?? [];

    if (keys.length === 0) {
      continue;
    }

    if (capability === 'embedding') {
      // Le catalogue garantit des modèles dès que la capacité est déclarée
      // (vérifié par `tests/unit/providers-catalog.test.ts`) : pas de repli mort.
      for (const model of provider.embeddings as NonNullable<ProviderDescriptor['embeddings']>) {
        candidates.push({
          provider,
          model: model.model,
          space: model.space,
          nativeDimensions: model.dimensions,
          free: model.free,
          keys,
        });
      }
    }

    if (capability === 'chat') {
      for (const model of provider.chat as NonNullable<ProviderDescriptor['chat']>) {
        candidates.push({ provider, model: model.model, free: model.free, keys });
      }
    }

    if (capability === 'web-search' || capability === 'web-fetch' || capability === 'sandbox') {
      candidates.push({ provider, model: '', free: true, keys });
    }
  }

  return candidates;
}

/** Place les fournisseurs au disjoncteur ouvert en fin de chaîne, sans les retirer. */
function sortByHealth(candidates: Candidate[], health: ProviderHealth): Candidate[] {
  return [...candidates].sort((left, right) => {
    const leftOpen = health.isOpen(left.provider.id) ? 1 : 0;
    const rightOpen = health.isOpen(right.provider.id) ? 1 : 0;
    return leftOpen - rightOpen;
  });
}

/**
 * Espaces d'embedding réellement configurables, avec leurs fournisseurs.
 *
 * Sert à `npm run providers` : l'utilisateur voit immédiatement que choisir
 * `baai/bge-m3` ouvre deux fournisseurs (Novita, OpenRouter), tandis que
 * `openai/text-embedding-3-small` en ouvre deux autres.
 */
export function availableSpaces(
  keyring: Keyring,
  providers: readonly ProviderDescriptor[] = PROVIDERS,
): {
  space: string;
  dimensions: number;
  free: boolean;
  providers: ProviderDescriptor[];
}[] {
  const spaces = new Map<
    string,
    { space: string; dimensions: number; free: boolean; providers: ProviderDescriptor[] }
  >();

  for (const provider of usableProviders('embedding', providers)) {
    if ((keyring.get(provider.id)?.length ?? 0) === 0) {
      continue;
    }

    for (const model of provider.embeddings as NonNullable<ProviderDescriptor['embeddings']>) {
      const existing = spaces.get(model.space);

      if (existing === undefined) {
        spaces.set(model.space, {
          space: model.space,
          dimensions: model.dimensions,
          free: model.free,
          providers: [provider],
        });
      } else {
        existing.providers.push(provider);
        existing.free ||= model.free;
      }
    }
  }

  return [...spaces.values()];
}
