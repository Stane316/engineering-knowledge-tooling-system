/**
 * Politique de cible à la frontière MCP (Sprint 20-03, O06 / C-W13).
 *
 * `inspect_site` est la deuxième entrée réelle d'inspection : la règle qui vaut
 * pour la CLI doit y valoir aussi, avec sa propre exception explicite
 * (`allow_private_hosts`). La résolution DNS est injectée : aucun test ne
 * dépend du réseau.
 *
 * Le service d'inspection est doublé par un échec marqué : le voir remonter
 * prouve que la politique a laissé passer la cible, sans avoir à fabriquer un
 * rapport complet.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InspectSiteInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeInspectSite } from '../../../src/mcp/tools/inspect-site.js';
import type { McpToolContext } from '../../../src/mcp/context.js';
import { openTestServices, type TestServices } from '../helpers.js';

/** Résolveur qui répond des adresses fixes. */
const resolving =
  (addresses: readonly { address: string; family: number }[]) =>
  async (_hostname: string): Promise<readonly { address: string; family: number }[]> =>
    addresses;

const PUBLIC = resolving([{ address: '93.184.216.34', family: 4 }]);

describe('C-W13 — politique de cible à l’entrée MCP', () => {
  let fixture: TestServices;
  let inspectAndAudit: ReturnType<typeof vi.fn<McpToolContext['audits']['inspectAndAudit']>>;

  beforeEach(() => {
    fixture = openTestServices();
    inspectAndAudit = vi
      .fn<McpToolContext['audits']['inspectAndAudit']>()
      .mockRejectedValue(new Error('STOP_TEST — la politique a laissé passer'));
  });

  afterEach(() => {
    fixture.cleanup();
  });

  /** Contexte dont l'inspection est doublée. */
  const context = (): McpToolContext => ({
    ...fixture.services,
    audits: { ...fixture.services.audits, inspectAndAudit },
  });

  it('1/4 — une cible publique est inspectée', async () => {
    await expect(
      executeInspectSite(context(), InspectSiteInput.parse({ url: 'https://example.com' }), {
        resolveHost: PUBLIC,
      }),
    ).rejects.toThrow('STOP_TEST');

    expect(inspectAndAudit).toHaveBeenCalledTimes(1);
  });

  it('2/4 — une cible privée est refusée par défaut', async () => {
    await expect(
      executeInspectSite(context(), InspectSiteInput.parse({ url: 'http://192.168.0.10' })),
    ).rejects.toThrow(/privé/i);

    expect(inspectAndAudit).not.toHaveBeenCalled();
  });

  it('3/4 — l’exception explicite `allow_private_hosts` autorise la cible', async () => {
    await expect(
      executeInspectSite(
        context(),
        InspectSiteInput.parse({ url: 'http://127.0.0.1:3000', allow_private_hosts: true }),
        { resolveHost: resolving([{ address: '127.0.0.1', family: 4 }]) },
      ),
    ).rejects.toThrow('STOP_TEST');

    expect(inspectAndAudit).toHaveBeenCalledTimes(1);
  });

  it('4/4 — un échec DNS est explicite', async () => {
    await expect(
      executeInspectSite(context(), InspectSiteInput.parse({ url: 'https://inexistant.example' }), {
        resolveHost: async () => {
          throw Object.assign(new Error('getaddrinfo ENOTFOUND inexistant.example'), {
            code: 'ENOTFOUND',
          });
        },
      }),
    ).rejects.toThrow(/DNS/i);

    expect(inspectAndAudit).not.toHaveBeenCalled();
  });
});
