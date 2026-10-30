/**
 * Politique de cible aux frontières CLI (Sprint 20-03, O06 / C-W13).
 *
 * Six décisions sont vérifiées au point d'entrée réel : URL admise, schéma
 * interdit, cible privée refusée par défaut, exception locale explicite,
 * résolution vers une adresse privée refusée, échec DNS explicite.
 *
 * La navigation est doublée (aucun navigateur) et la résolution DNS passe par
 * le *seam* de `CliRuntime` : aucun test ne dépend du réseau du poste, et la
 * décision testée est bien celle du code de production.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HostResolver } from '../../src/browser/url-policy.js';
import { runCli } from '../../src/cli/program.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

const { inspectMock } = vi.hoisted(() => ({ inspectMock: vi.fn() }));

vi.mock('../../src/browser/inspection/inspector.js', () => ({
  Inspector: class {
    readonly inspect = inspectMock;
  },
}));

/** Résolveur fixe : aucune requête réseau. */
const resolving =
  (addresses: readonly { address: string; family: number }[]): HostResolver =>
  async () =>
    addresses;

const PUBLIC = resolving([{ address: '93.184.216.34', family: 4 }]);

describe('C-W13 — politique de cible à l’entrée CLI', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir, { resolveHost: PUBLIC });
    inspectMock.mockReset();
    // Toute navigation réelle est refusée : seules les décisions sont testées.
    inspectMock.mockRejectedValue(new Error('STOP_TEST — la politique a laissé passer'));
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  /** Lance la commande et rend son code, sorties réinitialisées. */
  const run = async (...args: string[]): Promise<number> => {
    runtime.output.stdout = '';
    runtime.output.stderr = '';
    return runCli(['inspect', ...args, '--format', 'md'], runtime);
  };

  const allOutput = (): string => runtime.output.stdout + runtime.output.stderr;

  /** Remplace le résolveur du runtime courant. */
  const withResolver = (resolveHost: HostResolver): void => {
    runtime = createTestRuntime(dataDir, { resolveHost });
  };

  it('1/6 — une URL publique est admise et atteint l’inspecteur', async () => {
    const code = await run('https://example.com');

    expect(inspectMock).toHaveBeenCalledTimes(1);
    // L'échec observé est celui de l'inspecteur doublé, pas un refus de politique.
    expect(code).not.toBe(0);
    expect(allOutput()).toContain('STOP_TEST');
  });

  it('2/6 — un schéma interdit est refusé avant toute navigation', async () => {
    await run('file:///etc/passwd');

    expect(inspectMock).not.toHaveBeenCalled();
    expect(allOutput()).toMatch(/schéma/i);
  });

  it('3/6 — une cible privée est refusée par défaut', async () => {
    await run('http://127.0.0.1:8080');

    expect(inspectMock).not.toHaveBeenCalled();
    expect(allOutput()).toMatch(/privé/i);
  });

  it('4/6 — l’exception locale explicite autorise un hôte privé', async () => {
    const code = await run('http://127.0.0.1:8080', '--allow-private-hosts');

    expect(inspectMock).toHaveBeenCalledTimes(1);
    expect(code).not.toBe(0);
    expect(allOutput()).toContain('STOP_TEST');
  });

  it('5/6 — un nom résolu vers une adresse privée est refusé', async () => {
    withResolver(resolving([{ address: '10.0.0.5', family: 4 }]));

    await run('https://interne.example');

    expect(inspectMock).not.toHaveBeenCalled();
    expect(allOutput()).toMatch(/privée/i);
  });

  it('6/6 — un échec DNS est explicite et bloque la navigation', async () => {
    withResolver(async () => {
      throw Object.assign(new Error('getaddrinfo ENOTFOUND inexistant.example'), {
        code: 'ENOTFOUND',
      });
    });

    await run('https://inexistant.example');

    expect(inspectMock).not.toHaveBeenCalled();
    expect(allOutput()).toMatch(/DNS/i);
  });
});
