/**
 * Identité du corpus gouverné (Sprint 22-02, C-R03).
 *
 * Le critère demande de comparer le **manifeste source**, le contenu relu de la
 * base (B) et une copie directe (C), avec « 6/6 correspondances exactes et
 * mapping complet » : octets UTF-8 sans BOM, fins de ligne LF, SHA-256 sur les
 * octets exacts, et conservation ID ↔ UUID ↔ empreinte.
 *
 * Les six fichiers sont **synthétiques** (le manifeste le déclare : aucune
 * donnée réelle, aucun essai). Ils sont lus tels quels, sans normalisation :
 * toute normalisation ferait justement échouer le critère.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openCliServices, type CliServices } from '../../src/cli/services.js';
import type { Provenance } from '../../src/shared/provenance.js';
import type { CreateResourceInput, Resource } from '../../src/shared/validators.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

const CORPUS_DIR = join(process.cwd(), 'docs', 'audit', 'produit', 'scenario-comparatif');
const MANIFEST = join(CORPUS_DIR, 'manifeste-corpus.json');

interface ManifestEntry {
  readonly id: string;
  readonly path: string;
  readonly sha256: string;
  readonly bytes_utf8: number;
}

interface Manifest {
  readonly normalization: string;
  readonly base_ids: readonly string[];
  readonly resources: readonly ManifestEntry[];
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;

/** Les six ressources de base, dans l'ordre du manifeste. */
const BASE = manifest.resources.filter((entry) => manifest.base_ids.includes(entry.id));

/** Lit un fichier du corpus **sans normalisation** (octets exacts). */
function readCorpusBytes(entry: ManifestEntry): Buffer {
  return readFileSync(join(CORPUS_DIR, entry.path));
}

/** SHA-256 calculé sur les octets, comme l'exige le manifeste. */
function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Provenance minimale admise, empreinte portée sur le contenu fourni. */
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

describe('C-R03 — le manifeste décrit exactement les fichiers', () => {
  it('couvre les six ressources de base', () => {
    expect(BASE.map((entry) => entry.id)).toEqual(['R01', 'R02', 'R03', 'R04', 'R05', 'R06']);
  });

  it('6/6 : octets UTF-8 sans BOM, fins LF, empreinte et taille conformes', () => {
    const mismatches: string[] = [];

    for (const entry of BASE) {
      const bytes = readCorpusBytes(entry);
      const problems: string[] = [];

      if (bytes.length !== entry.bytes_utf8) {
        problems.push(`taille ${bytes.length} ≠ ${entry.bytes_utf8}`);
      }
      if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
        problems.push('BOM UTF-8 présent');
      }
      if (bytes.includes(Buffer.from('\r\n'))) {
        problems.push('fins CRLF');
      }
      if (!bytes.equals(Buffer.from(bytes.toString('utf8'), 'utf8'))) {
        problems.push('octets non UTF-8');
      }
      if (sha256(bytes) !== entry.sha256) {
        problems.push(`empreinte ${sha256(bytes)} ≠ ${entry.sha256}`);
      }

      if (problems.length > 0) {
        mismatches.push(`${entry.id}: ${problems.join(', ')}`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe('C-R03 — ingestion et relecture (B) contre les octets source (C)', () => {
  let dataDir: string;
  let services: CliServices;

  beforeEach(() => {
    dataDir = createDataDir();
    services = openCliServices({ dataDir, env: {}, embeddingsMode: 'disabled' });
  });

  afterEach(() => {
    services.close();
    removeDataDir(dataDir);
  });

  it('conserve le mapping ID ↔ UUID ↔ SHA-256 pour les six ressources', async () => {
    const mapping: { id: string; uuid: string; sha256: string }[] = [];

    for (const entry of BASE) {
      const bytes = readCorpusBytes(entry);
      const content = bytes.toString('utf8');

      const created = await services.manager.addResource({
        type: 'other',
        title: `Corpus ${entry.id}`,
        content,
        tags: ['corpus', entry.id.toLowerCase()],
        metadata: { provenance: provenanceFor(entry) },
      });

      mapping.push({ id: entry.id, uuid: created.id, sha256: entry.sha256 });
    }

    expect(mapping).toHaveLength(6);
    expect(new Set(mapping.map((row) => row.uuid)).size).toBe(6);

    for (const row of mapping) {
      const entry = BASE.find((item) => item.id === row.id);
      if (entry === undefined) {
        throw new Error(`entrée ${row.id} absente du manifeste`);
      }

      const reloaded = await services.manager.getResource(row.uuid);
      if (reloaded === null) {
        throw new Error(`ressource ${row.uuid} introuvable après écriture`);
      }

      // (B) contenu relu, comparé aux octets exacts de (C).
      expect(Buffer.from(reloaded.content ?? '', 'utf8').equals(readCorpusBytes(entry))).toBe(true);

      // La provenance porte bien l'empreinte du manifeste, pas une autre.
      const provenance = reloaded.metadata['provenance'] as { fingerprint: { sha256: string } };
      expect(provenance.fingerprint.sha256).toBe(entry.sha256);

      // L'UUID est stable et lisible par la voie autorisée.
      expect(reloaded.id).toBe(row.uuid);
    }
  });

  it('préserve les accents et caractères non ASCII sans normalisation', async () => {
    const accented = 'Évaluation — accents, apostrophes ’ et guillemets « » conservés.';
    const digest = sha256(Buffer.from(accented, 'utf8'));

    const created = await services.manager.addResource({
      type: 'other',
      title: 'Accents',
      content: accented,
      metadata: {
        provenance: {
          source: 'test://accents',
          sourceVersion: null,
          rights: { read: 'granted', redistribute: 'unknown', execute: 'unknown' },
          sensitivity: 'synthetic',
          fingerprint: { sha256: digest },
          review: { status: 'authorized', decidedAt: null, decidedBy: null },
        },
      },
    });

    const reloaded = await services.manager.getResource(created.id);

    expect(reloaded?.content).toBe(accented);
    expect(Buffer.from(reloaded?.content ?? '', 'utf8')).toEqual(Buffer.from(accented, 'utf8'));
  });

  it('refuse une empreinte qui ne correspond pas au contenu fourni', async () => {
    const bytes = readCorpusBytes(BASE[0] as ManifestEntry);
    const content = bytes.toString('utf8');
    // Empreinte du manifeste, mais contenu différent d'un seul caractère.
    const altered = `${content} `;

    const input: CreateResourceInput = {
      type: 'other',
      title: 'R01 altéré',
      content: altered,
      metadata: { provenance: provenanceFor(BASE[0] as ManifestEntry) },
    };

    await expect(services.manager.addResource(input)).rejects.toThrow(/empreinte/i);

    await expect(services.manager.listResources()).resolves.toEqual([]);
  });

  it('refuse un contenu dont les fins de ligne ont été converties en CRLF', async () => {
    const bytes = readCorpusBytes(BASE[0] as ManifestEntry);
    const crlf = bytes.toString('utf8').replace(/\n/gu, '\r\n');

    const input: CreateResourceInput = {
      type: 'other',
      title: 'R01 CRLF',
      content: crlf,
      metadata: { provenance: provenanceFor(BASE[0] as ManifestEntry) },
    };

    await expect(services.manager.addResource(input)).rejects.toThrow(/empreinte/i);
  });

  it('accepte une ressource sans empreinte (pas de vérification possible, rien d’inventé)', async () => {
    const created = await services.manager.addResource({
      type: 'other',
      title: 'Sans empreinte',
      content: 'Contenu libre.',
      metadata: {
        provenance: {
          source: null,
          sourceVersion: null,
          rights: { read: 'granted', redistribute: 'unknown', execute: 'unknown' },
          sensitivity: 'internal',
          fingerprint: null,
          review: { status: 'authorized', decidedAt: null, decidedBy: null },
        },
      },
    });

    const reloaded: Resource = (await services.manager.getResource(created.id)) as Resource;

    expect(reloaded.metadata['provenance']).toBeDefined();
    expect((reloaded.metadata['provenance'] as { fingerprint: unknown }).fingerprint).toBeNull();
  });
});
