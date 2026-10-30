/**
 * Mode de recherche sous profil de lecture (Sprint 21-02, C-P08).
 *
 * Le piège visé : `SearchKnowledgeInput.mode` porte `.default('hybrid')` au
 * niveau Zod. Un contrôle placé **après** `parse` verrait toujours un mode, et
 * l'omission passerait pour un `hybrid` demandé. Ces cas mesurent donc l'ordre
 * réel : le mode est lu dans les **arguments bruts**, avant injection du défaut
 * et avant tout appel de fournisseur.
 *
 * Quatre variantes : `fts` explicite (seule autorisée), mode omis, `hybrid`,
 * `vector`. Un fournisseur factice compte ses appels et `fetch` est un compteur
 * qui échoue : « 0 appel d'embeddings et 0 accès réseau » est une mesure, pas
 * une intention.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { IEmbeddingsService } from '../../src/business/embeddings.js';
import { dispatchTool } from '../../src/mcp/handlers/tools.js';
import { MCP_PROFILES } from '../../src/mcp/profiles.js';
import { McpErrorCode } from '../../src/mcp/utils/errors.js';
import { fakeEmbeddings } from '../cli/helpers.js';
import { openTestServices, seedResources, type TestServices } from './helpers.js';

/** Fournisseur factice qui compte ses appels (aucun réseau). */
class CountingEmbeddings implements IEmbeddingsService {
  calls = 0;

  constructor(private readonly inner: IEmbeddingsService = fakeEmbeddings()) {}

  async embed(text: string): Promise<number[]> {
    this.calls += 1;

    return this.inner.embed(text);
  }

  async embedBatch(texts: readonly string[]): Promise<number[][]> {
    this.calls += 1;

    return this.inner.embedBatch(texts);
  }
}

interface ShapedError {
  readonly code: number;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

async function capture(
  services: TestServices['services'],
  args: Record<string, unknown>,
): Promise<{ ok: true; value: unknown } | { ok: false; error: ShapedError }> {
  try {
    const value = await dispatchTool(services, 'search_knowledge', args, MCP_PROFILES.read);

    return { ok: true, value };
  } catch (error) {
    const shaped = error as ShapedError;

    return {
      ok: false,
      error: { code: shaped.code, message: shaped.message, data: shaped.data },
    };
  }
}

describe('C-P08 — mode explicite sous profil de lecture', () => {
  let fixture: TestServices;
  let embeddings: CountingEmbeddings;
  let fetchCalls = 0;
  /** Delta (embeddings, réseau) mesuré pour chaque variante de mode. */
  const deltas: { case: string; embeddings: number; network: number }[] = [];

  beforeAll(async () => {
    embeddings = new CountingEmbeddings();
    fixture = openTestServices({ embeddings });
    await seedResources(fixture.services);

    vi.stubGlobal('fetch', () => {
      fetchCalls += 1;

      return Promise.reject(new Error('réseau interdit dans les tests C-P08'));
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    fixture.cleanup();
  });

  /** Exécute un cas et relève ce qu'il a consommé (aucune remise à zéro). */
  async function measure(
    label: string,
    args: Record<string, unknown>,
  ): Promise<Awaited<ReturnType<typeof capture>>> {
    const embeddingsBefore = embeddings.calls;
    const networkBefore = fetchCalls;
    const outcome = await capture(fixture.services, args);

    deltas.push({
      case: label,
      embeddings: embeddings.calls - embeddingsBefore,
      network: fetchCalls - networkBefore,
    });

    return outcome;
  }

  it('1/4 — « fts » explicite est permis', async () => {
    const outcome = await measure('fts explicite', { query: 'SQLite', mode: 'fts' });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    const result = outcome.value as { mode: string; count: number };

    expect(result.mode).toBe('fts');
    expect(result.count).toBeGreaterThanOrEqual(1);
  });

  it('2/4 — mode omis : refusé, jamais comblé par le défaut « hybrid »', async () => {
    const outcome = await measure('mode omis', { query: 'SQLite' });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }

    expect(outcome.error.code).toBe(McpErrorCode.InvalidParams);
    expect(outcome.error.data).toMatchObject({ profile: 'read', requiredMode: 'fts' });
    expect(outcome.error.message).toMatch(/mode/i);
  });

  it('3/4 — « hybrid » : refusé avant le fournisseur', async () => {
    const outcome = await measure('hybrid', { query: 'SQLite', mode: 'hybrid' });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }

    expect(outcome.error.code).toBe(McpErrorCode.InvalidParams);
    expect(outcome.error.data).toMatchObject({ profile: 'read', requiredMode: 'fts' });
  });

  it('4/4 — « vector » : refusé avant le fournisseur', async () => {
    const outcome = await measure('vector', { query: 'SQLite', mode: 'vector' });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }

    expect(outcome.error.code).toBe(McpErrorCode.InvalidParams);
    expect(outcome.error.data).toMatchObject({ profile: 'read', requiredMode: 'fts' });
  });

  it('les quatre variantes ont consommé 0 appel d’embeddings et 0 accès réseau', () => {
    expect(deltas.map((delta) => delta.case)).toEqual([
      'fts explicite',
      'mode omis',
      'hybrid',
      'vector',
    ]);
    expect(deltas.filter((delta) => delta.embeddings !== 0)).toEqual([]);
    expect(deltas.filter((delta) => delta.network !== 0)).toEqual([]);
  });

  it('le contrôle du mode ne masque pas la validation ordinaire', async () => {
    const outcome = await capture(fixture.services, { query: '', mode: 'fts' });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }

    // La requête vide est refusée pour elle-même : c'est le schéma qui parle,
    // pas la politique de mode.
    expect(outcome.error.code).toBe(McpErrorCode.InvalidParams);
    expect(outcome.error.data?.['requiredMode']).toBeUndefined();
    expect(outcome.error.message).toMatch(/requête/i);
  });

  it('un mode qui n’est pas exactement « fts » est refusé (aucune normalisation)', async () => {
    const outcome = await capture(fixture.services, { query: 'SQLite', mode: 'FTS' });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }

    expect(outcome.error.code).toBe(McpErrorCode.InvalidParams);
  });
});

describe('C-P08 — non-régression du profil complet', () => {
  let fixture: TestServices;
  let embeddings: CountingEmbeddings;

  beforeAll(async () => {
    embeddings = new CountingEmbeddings();
    fixture = openTestServices({ embeddings });
    await seedResources(fixture.services);
  });

  afterAll(() => {
    fixture.cleanup();
  });

  it('sous profil complet, le mode omis reste « hybrid » (contrat historique)', async () => {
    const result = (await dispatchTool(fixture.services, 'search_knowledge', {
      query: 'SQLite',
    })) as { mode: string };

    expect(result.mode).toBe('hybrid');
    expect(embeddings.calls).toBeGreaterThan(0);
  });

  it('sous profil complet, « fts » explicite ne sollicite pas le fournisseur', async () => {
    embeddings.calls = 0;

    const result = (await dispatchTool(fixture.services, 'search_knowledge', {
      query: 'SQLite',
      mode: 'fts',
    })) as { mode: string };

    expect(result.mode).toBe('fts');
    expect(embeddings.calls).toBe(0);
  });
});
