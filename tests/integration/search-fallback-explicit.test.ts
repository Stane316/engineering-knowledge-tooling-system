/**
 * Repli explicite, jamais silencieux (Sprint 22-03, C-R08).
 *
 * Le critère exige « 2 événements observables : erreur hybride puis résultat FTS
 * correctement étiqueté ; 0 succès hybride fabriqué, 0 repli caché ».
 *
 * Le point sensible : un mode `hybrid` sans fournisseur ne doit **jamais** être
 * servi par un classement lexical présenté comme hybride. Le repli n'existe que
 * si l'appelant redemande explicitement `fts`, et le résultat porte alors son
 * mode réel.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { collectSearch } from '../../src/cli/commands/search.js';
import { openCliServices } from '../../src/cli/services.js';
import { createDataDir, createTestRuntime, removeDataDir } from '../cli/helpers.js';

const dirs: string[] = [];

function newDir(): string {
  const dir = createDataDir();
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    removeDataDir(dir);
  }
});

/** Base isolée avec une ressource réellement indexée. */
async function seededDir(): Promise<string> {
  const dir = newDir();
  const services = openCliServices({ dataDir: dir, env: {}, embeddingsMode: 'disabled' });

  try {
    await services.manager.addResource({
      type: 'other',
      title: 'Note de cadrage',
      content: 'Le blog du projet décrit le cadrage synthétique.',
      tags: ['corpus'],
    });
  } finally {
    services.close();
  }

  return dir;
}

describe('C-R08 — erreur hybride puis FTS explicitement demandé', () => {
  it('n’invente aucun succès hybride quand le fournisseur manque', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    // Événement 1 : l'erreur est rendue à l'appelant, avec sa cause.
    const failure = await collectSearch(runtime, 'blog', { limit: 5, mode: 'hybrid' }).then(
      (report) => ({ report }),
      (error: unknown) => ({ error }),
    );

    expect('error' in failure).toBe(true);
    expect((failure as { error: { code?: string } }).error.code).toBe('PROVIDER_UNAVAILABLE');
    // Aucun résultat n'est renvoyé sous une étiquette hybride.
    expect(failure).not.toHaveProperty('report.results');
  });

  it('sert ensuite un FTS correctement étiqueté, sur appel distinct', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    // Événement 2 : le repli est un appel séparé, explicitement `fts`.
    const report = await collectSearch(runtime, 'blog', { limit: 5, mode: 'fts' });

    expect(report.mode).toBe('fts');
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.results.every((result) => result.source === 'fts')).toBe(true);
    expect(report.results[0]?.resource.title).toBe('Note de cadrage');
  });

  it('ne retombe pas sur FTS quand le mode hybride est demandé sans fournisseur', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    // Deux appels hybride successifs échouent tous les deux : l'échec n'est pas
    // « absorbé » par un repli interne au premier appel.
    await expect(
      collectSearch(runtime, 'blog', { limit: 5, mode: 'hybrid' }),
    ).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    await expect(
      collectSearch(runtime, 'blog', { limit: 5, mode: 'hybrid' }),
    ).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
  });
});
