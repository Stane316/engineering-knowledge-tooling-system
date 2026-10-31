/**
 * Identité d'une version et preuve rétroactive (Sprint 22-02, C-R04).
 *
 * Le critère demande deux états distingués sur une ressource synthétique :
 * (1) une version autorisée conservée avec son empreinte H1, (2) le même
 * emplacement contenant un texte modifié, d'empreinte H2 ≠ H1. **Aucune preuve
 * rétroactive** : il doit être impossible de laisser H1 associée au texte H2.
 *
 * `UUID` seul ne suffit pas — `update` remplace le contenu d'un même UUID — donc
 * l'empreinte doit suivre le contenu, et une modification sans nouvelle
 * empreinte est refusée plutôt que silencieusement acceptée.
 */

import { createHash } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openCliServices, type CliServices } from '../../src/cli/services.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

const V1 = 'Version autorisée : ce texte est la référence conservée.\n';
const V2 = 'Version modifiée : le texte a changé après la capture.\n';

function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

/** Provenance autorisée portant l'empreinte du contenu fourni. */
function provenance(sha: string, status: 'authorized' | 'pending' = 'authorized') {
  return {
    source: 'test://version-identity',
    sourceVersion: 'v1',
    rights: { read: 'granted', redistribute: 'unknown', execute: 'unknown' },
    sensitivity: 'synthetic',
    fingerprint: { sha256: sha },
    review: { status, decidedAt: '2026-10-29T10:00:00.000Z', decidedBy: 'operateur-test' },
  };
}

describe('C-R04 — deux états distingués, aucune preuve rétroactive', () => {
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

  it('conserve la version autorisée avec son empreinte H1', async () => {
    const h1 = sha256(V1);
    const created = await services.manager.addResource({
      type: 'other',
      title: 'Version de référence',
      content: V1,
      metadata: { provenance: provenance(h1) },
    });

    const reloaded = await services.manager.getResource(created.id);

    expect(reloaded?.content).toBe(V1);
    expect(sha256(reloaded?.content ?? '')).toBe(h1);
    expect(
      (reloaded?.metadata['provenance'] as { fingerprint: { sha256: string } }).fingerprint.sha256,
    ).toBe(h1);
  });

  it('refuse de laisser l’ancienne empreinte associée au nouveau texte (2/2 états)', async () => {
    const h1 = sha256(V1);
    const h2 = sha256(V2);

    expect(h2).not.toBe(h1);

    const created = await services.manager.addResource({
      type: 'other',
      title: 'Version de référence',
      content: V1,
      metadata: { provenance: provenance(h1) },
    });

    // Modification du texte **sans** nouvelle provenance : l'ancienne empreinte
    // décrirait désormais d'autres octets — c'est précisément la preuve
    // rétroactive interdite.
    await expect(services.manager.updateResource(created.id, { content: V2 })).rejects.toThrow(
      /empreinte/i,
    );

    // L'état conservé est toujours celui de la version autorisée.
    const reloaded = await services.manager.getResource(created.id);
    expect(reloaded?.content).toBe(V1);
    expect(sha256(reloaded?.content ?? '')).toBe(h1);
  });

  it('refuse une nouvelle empreinte qui ne correspond pas au nouveau texte', async () => {
    const h1 = sha256(V1);

    const created = await services.manager.addResource({
      type: 'other',
      title: 'Version de référence',
      content: V1,
      metadata: { provenance: provenance(h1) },
    });

    await expect(
      services.manager.updateResource(created.id, {
        content: V2,
        // Empreinte de V1 réutilisée pour V2 : l'association doit être refusée.
        metadata: { provenance: provenance(h1) },
      }),
    ).rejects.toThrow(/empreinte/i);

    const reloaded = await services.manager.getResource(created.id);
    expect(reloaded?.content).toBe(V1);
  });

  it('accepte la nouvelle version quand elle porte sa propre empreinte H2', async () => {
    const h1 = sha256(V1);
    const h2 = sha256(V2);

    const created = await services.manager.addResource({
      type: 'other',
      title: 'Version de référence',
      content: V1,
      metadata: { provenance: provenance(h1) },
    });

    const updated = await services.manager.updateResource(created.id, {
      content: V2,
      metadata: { provenance: provenance(h2) },
    });

    expect(updated.content).toBe(V2);
    expect(
      (updated.metadata['provenance'] as { fingerprint: { sha256: string } }).fingerprint.sha256,
    ).toBe(h2);
    expect(sha256(updated.content ?? '')).toBe(h2);
    // L'UUID est le même : c'est l'empreinte qui distingue les versions.
    expect(updated.id).toBe(created.id);
  });

  it('autorise la modification d’un contenu sans empreinte enregistrée', async () => {
    const created = await services.manager.addResource({
      type: 'other',
      title: 'Sans empreinte',
      content: V1,
      metadata: { provenance: { ...provenance(sha256(V1)), fingerprint: null } },
    });

    const updated = await services.manager.updateResource(created.id, { content: V2 });

    expect(updated.content).toBe(V2);
  });

  it('ne modifie pas le contenu quand seule la métadonnée change', async () => {
    const h1 = sha256(V1);

    const created = await services.manager.addResource({
      type: 'other',
      title: 'Version de référence',
      content: V1,
      metadata: { provenance: provenance(h1, 'pending') },
    });

    const updated = await services.manager.updateResource(created.id, {
      metadata: { provenance: provenance(h1, 'authorized') },
    });

    expect(updated.content).toBe(V1);
    expect((updated.metadata['provenance'] as { review: { status: string } }).review.status).toBe(
      'authorized',
    );
  });
});
