import type { ProviderId } from '../../shared/providers/types.js';

/** Seuil d'échecs consécutifs avant ouverture du disjoncteur. */
export const FAILURE_THRESHOLD = 3;

/** Durée d'ouverture initiale (défaut : 60 s). */
export const BASE_COOLDOWN_MS = 60_000;

/** Plafond de la durée d'ouverture (défaut : 10 min). */
export const MAX_COOLDOWN_MS = 600_000;

interface ProviderState {
  consecutiveFailures: number;
  /** Nombre d'ouvertures successives, pour l'exponentielle. */
  trips: number;
  openUntil: number;
}

/**
 * Disjoncteur par fournisseur.
 *
 * Sans lui, un fournisseur en panne est retenté à chaque requête : on paie
 * trois délais d'attente avant de basculer, à chaque appel. Le disjoncteur
 * écarte un fournisseur **après trois échecs consécutifs**, pour une durée qui
 * double à chaque récidive (60 s, 120 s, 240 s… jusqu'à 10 min), et le remet
 * en service dès le premier succès.
 *
 * Ce n'est pas une mise en cache des erreurs : un fournisseur écarté est
 * simplement placé en fin de chaîne, pas supprimé — si tous les autres échouent,
 * il est retenté en dernier recours.
 */
export class ProviderHealth {
  private readonly states = new Map<ProviderId, ProviderState>();
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /** Le fournisseur est-il hors service (disjoncteur ouvert) ? */
  isOpen(provider: ProviderId): boolean {
    const state = this.states.get(provider);
    return state !== undefined && state.openUntil > this.now();
  }

  /** Millisecondes restantes avant réessai (`0` si disponible). */
  cooldownRemaining(provider: ProviderId): number {
    const state = this.states.get(provider);

    if (state === undefined) {
      return 0;
    }

    return Math.max(0, state.openUntil - this.now());
  }

  /** Nombre d'échecs consécutifs observés. */
  failures(provider: ProviderId): number {
    return this.states.get(provider)?.consecutiveFailures ?? 0;
  }

  /**
   * Enregistre un succès : remise à zéro complète.
   *
   * Le compteur d'ouvertures est également remis à zéro : un fournisseur qui
   * répond de nouveau ne doit pas hériter d'une pénalité de cooldown longue.
   */
  recordSuccess(provider: ProviderId): void {
    this.states.set(provider, { consecutiveFailures: 0, trips: 0, openUntil: 0 });
  }

  /**
   * Enregistre un échec et ouvre le disjoncteur au seuil.
   *
   * @returns Durée de cooldown appliquée (`0` si le circuit reste fermé).
   */
  recordFailure(provider: ProviderId): number {
    const previous = this.states.get(provider) ?? {
      consecutiveFailures: 0,
      trips: 0,
      openUntil: 0,
    };

    const consecutiveFailures = previous.consecutiveFailures + 1;

    if (consecutiveFailures < FAILURE_THRESHOLD) {
      this.states.set(provider, { ...previous, consecutiveFailures });
      return 0;
    }

    const trips = previous.trips + 1;
    const cooldown = Math.min(BASE_COOLDOWN_MS * 2 ** (trips - 1), MAX_COOLDOWN_MS);

    this.states.set(provider, {
      consecutiveFailures,
      trips,
      openUntil: this.now() + cooldown,
    });

    return cooldown;
  }

  /** Remet tous les compteurs à zéro (tests, reconfiguration). */
  reset(): void {
    this.states.clear();
  }
}
