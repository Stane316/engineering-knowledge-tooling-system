import { describe, expect, it } from 'vitest';

import {
  BASE_COOLDOWN_MS,
  FAILURE_THRESHOLD,
  MAX_COOLDOWN_MS,
  ProviderHealth,
} from '../../src/business/providers/health.js';

/** Horloge contrôlée, pour ne pas dépendre du temps réel. */
function createClock(start = 1_000_000): { now: () => number; advance: (ms: number) => void } {
  let current = start;

  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('ProviderHealth', () => {
  it('reste fermé sous le seuil d’échecs', () => {
    const health = new ProviderHealth();

    for (let attempt = 1; attempt < FAILURE_THRESHOLD; attempt += 1) {
      expect(health.recordFailure('openai')).toBe(0);
      expect(health.isOpen('openai')).toBe(false);
    }

    expect(health.failures('openai')).toBe(FAILURE_THRESHOLD - 1);
  });

  it('ouvre le circuit au troisième échec consécutif', () => {
    const clock = createClock();
    const health = new ProviderHealth(clock.now);

    health.recordFailure('openai');
    health.recordFailure('openai');
    const cooldown = health.recordFailure('openai');

    expect(cooldown).toBe(BASE_COOLDOWN_MS);
    expect(health.isOpen('openai')).toBe(true);
    expect(health.cooldownRemaining('openai')).toBe(BASE_COOLDOWN_MS);
  });

  it('referme le circuit à l’expiration du délai', () => {
    const clock = createClock();
    const health = new ProviderHealth(clock.now);

    health.recordFailure('openai');
    health.recordFailure('openai');
    health.recordFailure('openai');
    clock.advance(BASE_COOLDOWN_MS + 1);

    expect(health.isOpen('openai')).toBe(false);
    expect(health.cooldownRemaining('openai')).toBe(0);
  });

  it('double la durée à chaque réouverture, sans dépasser le plafond', () => {
    const clock = createClock();
    const health = new ProviderHealth(clock.now);

    // Première ouverture : trois échecs consécutifs.
    health.recordFailure('gemini');
    health.recordFailure('gemini');
    expect(health.recordFailure('gemini')).toBe(BASE_COOLDOWN_MS);

    // Une fois le délai écoulé, le compteur reste au-dessus du seuil : un seul
    // échec supplémentaire rouvre le circuit (comportement « half-open »).
    clock.advance(BASE_COOLDOWN_MS + 1);
    expect(health.recordFailure('gemini')).toBe(BASE_COOLDOWN_MS * 2);

    clock.advance(BASE_COOLDOWN_MS * 2 + 1);
    expect(health.recordFailure('gemini')).toBe(BASE_COOLDOWN_MS * 4);

    // Montée jusqu'au plafond.
    for (let round = 0; round < 10; round += 1) {
      clock.advance(health.cooldownRemaining('gemini') + 1);
      health.recordFailure('gemini');
    }

    clock.advance(health.cooldownRemaining('gemini') + 1);
    expect(health.recordFailure('gemini')).toBe(MAX_COOLDOWN_MS);
  });

  it('remet tout à zéro après un succès', () => {
    const clock = createClock();
    const health = new ProviderHealth(clock.now);

    health.recordFailure('openai');
    health.recordFailure('openai');
    health.recordFailure('openai');
    health.recordSuccess('openai');

    expect(health.isOpen('openai')).toBe(false);
    expect(health.failures('openai')).toBe(0);
    // Le compteur d'ouvertures repart aussi de zéro.
    health.recordFailure('openai');
    health.recordFailure('openai');
    expect(health.recordFailure('openai')).toBe(BASE_COOLDOWN_MS);
  });

  it('ignore un fournisseur jamais observé', () => {
    const health = new ProviderHealth();

    expect(health.isOpen('deepseek')).toBe(false);
    expect(health.cooldownRemaining('deepseek')).toBe(0);
    expect(health.failures('deepseek')).toBe(0);
  });

  it('isole les fournisseurs les uns des autres', () => {
    const health = new ProviderHealth();

    health.recordFailure('openai');
    health.recordFailure('openai');
    health.recordFailure('openai');

    expect(health.isOpen('openai')).toBe(true);
    expect(health.isOpen('gemini')).toBe(false);
  });

  it('se réinitialise entièrement', () => {
    const health = new ProviderHealth();

    health.recordFailure('openai');
    health.reset();

    expect(health.failures('openai')).toBe(0);
  });
});
