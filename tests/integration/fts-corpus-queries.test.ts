/**
 * Huit requêtes FTS figées sur le corpus gouverné (Sprint 22-03, C-R06).
 *
 * Le jeu de requêtes est **déjà figé** dans le document 22 (§3.1) et n'a pas
 * été observé sur le moteur avant ce test. Il est recopié ici sans retouche :
 * aucune annotation n'est ajustée après coup pour faire réussir une requête.
 *
 * Méthode : les six fichiers R01–R06 du manifeste sont indexés tels quels
 * (contenu exact, provenance admissible de 22-02), puis chaque requête est
 * exécutée en FTS avec `limit: 5`.
 *
 * - **Rappel@5** = IDs pertinents présents dans les cinq premiers / attendus.
 *   Seuil C-R06 : 1 pour chacune des 7 requêtes positives.
 * - **Précision@5** = pertinents renvoyés / résultats renvoyés. Les résultats
 *   supplémentaires sont comptés et rapportés, jamais retirés du décompte.
 * - **Q08** doit réussir avec zéro résultat (succès vide, pas une erreur).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSearchEngine, openCliServices, type CliServices } from '../../src/cli/services.js';
import type { ISearchEngine } from '../../src/business/search-engine.types.js';
import type { Provenance } from '../../src/shared/provenance.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

const CORPUS_DIR = join(process.cwd(), 'docs', 'audit', 'produit', 'scenario-comparatif');
const MANIFEST = join(CORPUS_DIR, 'manifeste-corpus.json');

interface ManifestEntry {
  readonly id: string;
  readonly path: string;
  readonly sha256: string;
}

interface Manifest {
  readonly base_ids: readonly string[];
  readonly resources: readonly ManifestEntry[];
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;
const BASE = manifest.resources.filter((entry) => manifest.base_ids.includes(entry.id));

/** Jeu figé du document 22 §3.1 — recopié à l'identique, sans révision. */
interface FixedQuery {
  readonly id: string;
  readonly query: string;
  readonly expected: readonly string[];
}

const QUERIES: readonly FixedQuery[] = [
  { id: 'Q01', query: 'blog', expected: ['R01'] },
  { id: 'Q02', query: '520', expected: ['R03'] },
  { id: 'Q03', query: 'modification interface', expected: ['R04'] },
  { id: 'Q04', query: 'exceptions', expected: ['R05'] },
  { id: 'Q05', query: 'affectés', expected: ['R06'] },
  { id: 'Q06', query: 'nom accessible', expected: ['R02', 'R05'] },
  { id: 'Q07', query: 'INP', expected: ['R03', 'R05'] },
  { id: 'Q08', query: 'licornequartz', expected: [] },
];

const LIMIT = 5;

/**
 * Résultats supplémentaires observés et **documentés** (aucun retiré du
 * décompte). Mesuré le 30/10/2026 sur ce corpus : seule Q06 ramène un ID non
 * attendu (R04), en tête, avant les deux IDs pertinents qu'elle contient.
 */
const EXTRAS_OBSERVES: Readonly<Record<string, readonly string[]>> = {
  Q01: [],
  Q02: [],
  Q03: [],
  Q04: [],
  Q05: [],
  Q06: ['R04'],
  Q07: [],
};

/** Provenance minimale admise (même contrat qu'en 22-02), empreinte du manifeste. */
function provenanceFor(entry: ManifestEntry): Provenance {
  return {
    source: `depot://corpus-synthetique/${entry.path}`,
    sourceVersion: 'manifeste-1.0',
    rights: { read: 'granted', redistribute: 'refused', execute: 'unknown' },
    sensitivity: 'synthetic',
    fingerprint: { sha256: entry.sha256 },
    review: {
      status: 'authorized',
      decidedAt: '2026-10-29T10:00:00.000Z',
      decidedBy: 'operateur-test',
    },
  };
}

/** Titre du document : premier titre Markdown du fichier, sans préfixe technique. */
function titleOf(content: string): string {
  const first = content.split('\n').find((line) => line.startsWith('# '));
  return (first ?? '# Corpus').replace(/^# /, '').trim();
}

describe('C-R06 — huit requêtes figées sur le corpus, FTS, limite 5', () => {
  let dataDir: string;
  let services: CliServices;
  let engine: ISearchEngine;

  /** UUID par identifiant du manifeste (R01…R06). */
  const uuids = new Map<string, string>();

  beforeEach(async () => {
    dataDir = createDataDir();
    services = openCliServices({ dataDir, env: {}, embeddingsMode: 'disabled' });
    engine = createSearchEngine(services.database.connection);

    for (const entry of BASE) {
      const content = readFileSync(join(CORPUS_DIR, entry.path), 'utf8');
      const created = await services.manager.addResource({
        type: 'other',
        title: titleOf(content),
        content,
        tags: ['corpus', entry.id.toLowerCase()],
        metadata: { provenance: provenanceFor(entry) },
      });

      uuids.set(entry.id, created.id);
    }
  });

  afterEach(() => {
    services.close();
    removeDataDir(dataDir);
  });

  it('indexe les six ressources du corpus', () => {
    expect(uuids.size).toBe(6);
    expect(new Set(uuids.values()).size).toBe(6);
  });

  it('7/7 requêtes positives : rappel@5 = 1', async () => {
    const positives = QUERIES.filter((item) => item.expected.length > 0);
    expect(positives).toHaveLength(7);

    const failures: string[] = [];

    for (const item of positives) {
      const results = await engine.searchFTS(item.query, LIMIT);
      const returnedIds = results.map((result) => {
        const id = [...uuids.entries()].find(([, uuid]) => uuid === result.resource.id)?.[0];
        return id ?? '?';
      });

      expect(results.length, `${item.id} dépasse la limite`).toBeLessThanOrEqual(LIMIT);

      const missing = item.expected.filter((id) => !returnedIds.includes(id));

      if (missing.length > 0) {
        failures.push(`${item.id} « ${item.query} » : manquants ${missing.join(', ')}`);
      }

      // Aucun identifiant hors corpus ne doit apparaître.
      expect(returnedIds, `${item.id} : identifiant hors corpus`).not.toContain('?');

      // Précision@5 : les extras sont comptés, documentés et non masqués.
      const extras = returnedIds.filter((id) => !item.expected.includes(id));

      expect(extras, `${item.id} : résultats supplémentaires inattendus (précision@5)`).toEqual(
        EXTRAS_OBSERVES[item.id] ?? [],
      );
      expect(returnedIds.length, `${item.id} : aucun résultat`).toBeGreaterThan(0);
    }

    expect(failures, 'rappel@5 incomplet').toEqual([]);
  });

  it('1/1 requête négative : succès vide, pas une erreur', async () => {
    const negative = QUERIES.find((item) => item.id === 'Q08');
    if (negative === undefined) {
      throw new Error('Q08 absente du jeu figé');
    }

    const results = await engine.searchFTS(negative.query, LIMIT);

    expect(results).toEqual([]);
  });

  it('préserve la provenance lisible dans les résultats', async () => {
    const results = await engine.searchFTS('INP', LIMIT);

    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      const provenance = result.resource.metadata['provenance'] as
        { sensitivity?: string; review?: { status?: string } } | undefined;

      expect(provenance?.sensitivity).toBe('synthetic');
      expect(provenance?.review?.status).toBe('authorized');
    }
  });
});
