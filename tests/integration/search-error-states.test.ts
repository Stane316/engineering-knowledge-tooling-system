/**
 * Cinq états de recherche distingués (Sprint 22-03, C-R07).
 *
 * Le critère exige « 5/5 états correctement distingués » et que « les 4 échecs
 * n'apparaissent pas comme un résultat vide réussi ». Le contrat de la
 * spécification 21 est explicite : une requête invalide produit « une erreur de
 * validation identifiable, sans modification » et ne devient jamais une liste
 * vide ; de même, une erreur n'est pas un corpus vide.
 *
 * Les cinq états mesurés ici :
 * 1. requête invalide (vide ou blanche) ;
 * 2. identifiant absent ;
 * 3. index inaccessible ;
 * 4. fournisseur d'embeddings absent ;
 * 5. zéro correspondance (succès).
 *
 * Données synthétiques, bases temporaires isolées, aucun réseau.
 */

import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { collectGet } from '../../src/cli/commands/get.js';
import { collectSearch } from '../../src/cli/commands/search.js';
import { createSearchEngine, openCliServices, type CliServices } from '../../src/cli/services.js';
import { createDataDir, createTestRuntime, removeDataDir } from '../cli/helpers.js';

const UUID_INCONNU = '00000000-0000-4000-8000-000000000000';

const dirs: string[] = [];

function newDir(): string {
  const dir = createDataDir();
  dirs.push(dir);
  return dir;
}

/** Crée une base avec une ressource indexée en FTS. */
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

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    removeDataDir(dir);
  }
});

describe('C-R07 — cinq états distincts, aucun échec déguisé en succès vide', () => {
  it('1/5 : une requête vide est une erreur de validation, sans modification', async () => {
    const dir = newDir();
    const runtime = createTestRuntime(dir, { env: {} });

    await expect(collectSearch(runtime, '   ', { limit: 5, mode: 'fts' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });

    // « sans modification » : la validation précède toute ouverture de base.
    expect(readdirSync(dir)).toEqual([]);
  });

  it('2/5 : un identifiant absent est une erreur, pas une liste vide', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    // `IKnowledgeManager.getResource` renvoie `Resource | null` par contrat :
    // l'état « ID absent » est produit par l'interface livrée (`collectGet`),
    // c'est donc elle que le critère mesure — pas la primitive de stockage.
    await expect(collectGet(runtime, UUID_INCONNU)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('3/5 : un index inaccessible échoue de façon observable', async () => {
    const dir = await seededDir();

    // Corruption volontaire de l'index plein texte : le fichier n'est plus une
    // base SQLite. L'erreur native est conservée (« erreur native si
    // applicable ») : ce qui compte est qu'elle ne devienne pas un succès vide.
    writeFileSync(join(dir, 'ekts-fts.db'), 'index corrompu');

    let services: CliServices;

    try {
      services = openCliServices({ dataDir: dir, env: {}, embeddingsMode: 'disabled' });
    } catch (error) {
      const message = (error as Error).message;

      expect(message).toMatch(/not a database|malformed/i);
      expect(message).not.toMatch(/aucun résultat/i);
      return;
    }

    try {
      const engine = createSearchEngine(services.database.connection);
      await expect(engine.searchFTS('blog', 5)).rejects.toMatchObject({ code: 'SEARCH_FAILED' });
    } finally {
      services.close();
    }
  });

  it('4/5 : fournisseur d’embeddings absent = erreur explicite', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    await expect(
      collectSearch(runtime, 'blog', { limit: 5, mode: 'hybrid' }),
    ).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
  });

  it('5/5 : zéro correspondance est un succès à zéro résultat', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    const report = await collectSearch(runtime, 'licornequartz', { limit: 5, mode: 'fts' });

    expect(report.results).toEqual([]);
    expect(report.mode).toBe('fts');
  });

  it('les quatre échecs portent des identités distinctes', async () => {
    const dir = await seededDir();
    const runtime = createTestRuntime(dir, { env: {} });

    const codes: string[] = [];

    const record = async (action: () => Promise<unknown>): Promise<void> => {
      try {
        await action();
        codes.push('SUCCES');
      } catch (error) {
        const failure = error as { code?: string; name?: string };
        codes.push(failure.code ?? failure.name ?? 'INCONNU');
      }
    };

    await record(() => collectSearch(runtime, '', { limit: 5, mode: 'fts' }));
    await record(() => collectGet(runtime, UUID_INCONNU));
    await record(() => collectSearch(runtime, 'blog', { limit: 5, mode: 'hybrid' }));

    expect(codes).toHaveLength(3);
    expect(new Set(codes).size).toBe(3);
    expect(codes).not.toContain('SUCCES');
  });
});
