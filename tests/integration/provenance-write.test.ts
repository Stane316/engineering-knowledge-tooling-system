/**
 * Provenance des ressources — écriture et relecture (Sprint 22-01).
 *
 * Le contrat retenu par le propriétaire le 30/10/2026 : la provenance vit dans
 * `metadata.provenance` (JSON validé, **aucune migration**), avec trois axes de
 * droits distincts — `read`, `redistribute`, `execute` — chacun valant
 * `granted`, `refused` ou `unknown`.
 *
 * Ces cas passent **uniquement par des points d'entrée existants**
 * (`openCliServices`, `manager.addResource`, `manager.updateResource`) : les
 * échecs mesurés avant implémentation sont donc comportementaux, pas des
 * erreurs d'import. Les cas portant sur la logique pure d'admission relèvent du
 * test unitaire du module, ajouté après création et déclaré GREEN initial.
 *
 * Une provenance n'est **pas** une autorisation par défaut : un champ absent
 * n'autorise rien, et une valeur inconnue (`null`) est conservée telle quelle,
 * jamais remplacée par une valeur inventée.
 */

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openCliServices, type CliServices } from '../../src/cli/services.js';
import type { CreateResourceInput } from '../../src/shared/validators.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

/**
 * Contenu de test unique.
 *
 * Depuis le Sprint 22-02, l'empreinte déclarée est **vérifiée** contre les
 * octets écrits : la fixture la calcule donc sur ce contenu exact au lieu
 * d'utiliser une constante arbitraire.
 */
const CONTENT = 'Contenu synthétique, non issue de données réelles.';

/** Empreinte réelle des octets UTF-8 du contenu de test. */
const SHA256 = createHash('sha256').update(Buffer.from(CONTENT, 'utf8')).digest('hex');

/** Provenance complète et valide (contenu synthétique). */
function validProvenance(): Record<string, unknown> {
  return {
    source: 'depot://corpus-synthetique/r01.md',
    sourceVersion: 'commit-abc123',
    rights: { read: 'granted', redistribute: 'refused', execute: 'unknown' },
    sensitivity: 'synthetic',
    fingerprint: { sha256: SHA256 },
    review: {
      status: 'authorized',
      decidedAt: '2026-10-30T10:00:00.000Z',
      decidedBy: 'operateur-test',
    },
  };
}

/** Entrée minimale de ressource. */
function resourceInput(metadata: Record<string, unknown>): CreateResourceInput {
  return {
    type: 'article',
    title: 'Ressource gouvernée',
    content: CONTENT,
    tags: ['canari'],
    metadata,
  };
}

describe('provenance — validation à l’écriture', () => {
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

  it('conserve une provenance valide à la relecture, sans en inventer', async () => {
    const provenance = validProvenance();
    const created = await services.manager.addResource(resourceInput({ provenance }));

    const reloaded = await services.manager.getResource(created.id);

    expect(reloaded?.metadata['provenance']).toEqual(provenance);
    // Les valeurs explicitement inconnues restent `null`, pas absentes.
    expect(
      (reloaded?.metadata['provenance'] as { rights: { execute: string } }).rights.execute,
    ).toBe('unknown');
  });

  it('refuse une décision de droit hors vocabulaire', async () => {
    const provenance = {
      ...validProvenance(),
      rights: { read: 'peut-être', redistribute: 'refused', execute: 'unknown' },
    };

    await expect(services.manager.addResource(resourceInput({ provenance }))).rejects.toThrow(
      /provenance/i,
    );

    await expect(services.manager.listResources()).resolves.toEqual([]);
  });

  it('refuse une provenance à laquelle il manque un axe de droit', async () => {
    const provenance = {
      ...validProvenance(),
      rights: { read: 'granted', redistribute: 'refused' },
    };

    await expect(services.manager.addResource(resourceInput({ provenance }))).rejects.toThrow(
      /provenance/i,
    );
  });

  it('refuse une empreinte qui n’est pas un SHA-256 hexadécimal', async () => {
    const provenance = { ...validProvenance(), fingerprint: { sha256: 'pas-un-hash' } };

    await expect(services.manager.addResource(resourceInput({ provenance }))).rejects.toThrow(
      /provenance/i,
    );
  });

  it('refuse une sensibilité hors vocabulaire', async () => {
    const provenance = { ...validProvenance(), sensitivity: 'secret-défense' };

    await expect(services.manager.addResource(resourceInput({ provenance }))).rejects.toThrow(
      /provenance/i,
    );
  });

  it('conserve les autres clés de metadata à côté de la provenance', async () => {
    const provenance = validProvenance();
    const created = await services.manager.addResource(
      resourceInput({ auteur: 'canari', provenance }),
    );

    const reloaded = await services.manager.getResource(created.id);

    expect(reloaded?.metadata).toMatchObject({ auteur: 'canari' });
    expect(reloaded?.metadata['provenance']).toEqual(provenance);
  });
});

describe('provenance — protection à la mise à jour', () => {
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

  it('refuse une mise à jour qui effacerait la provenance enregistrée', async () => {
    const created = await services.manager.addResource(
      resourceInput({ provenance: validProvenance() }),
    );

    await expect(services.manager.updateResource(created.id, { metadata: {} })).rejects.toThrow(
      /provenance/i,
    );

    const reloaded = await services.manager.getResource(created.id);
    expect(reloaded?.metadata['provenance']).toEqual(validProvenance());
  });

  it('refuse une mise à jour qui remplacerait la provenance par un bloc invalide', async () => {
    const created = await services.manager.addResource(
      resourceInput({ provenance: validProvenance() }),
    );

    await expect(
      services.manager.updateResource(created.id, {
        metadata: { provenance: { rights: { read: 'granted' } } },
      }),
    ).rejects.toThrow(/provenance/i);
  });

  it('accepte une mise à jour de provenance valide (décision révisée)', async () => {
    const created = await services.manager.addResource(
      resourceInput({ provenance: validProvenance() }),
    );

    const revised = {
      ...validProvenance(),
      rights: { read: 'granted', redistribute: 'granted', execute: 'unknown' },
    };

    const updated = await services.manager.updateResource(created.id, {
      metadata: { provenance: revised },
    });

    expect(updated.metadata['provenance']).toEqual(revised);
  });
});

describe('provenance — ressources historiques (C-R05)', () => {
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

  it('laisse lisibles et inchangées les ressources antérieures sans provenance', async () => {
    // Une ressource « historique » est une ressource sans bloc de provenance :
    // aucune migration n'a été nécessaire, donc rien n'a été réécrit.
    const legacy = await services.manager.addResource({
      type: 'article',
      title: 'Ressource historique',
      content: 'Créée avant l’introduction de la provenance.',
    });

    const reloaded = await services.manager.getResource(legacy.id);

    expect(reloaded?.title).toBe('Ressource historique');
    expect(reloaded?.content).toBe('Créée avant l’introduction de la provenance.');
    expect(reloaded?.metadata).toEqual({});
    // Aucune provenance n'est fabriquée : le bloc reste absent.
    expect(reloaded?.metadata['provenance']).toBeUndefined();
  });

  it('survit à une sauvegarde/restauration des fichiers de base (C-R05)', async () => {
    const legacy = await services.manager.addResource({
      type: 'article',
      title: 'Ressource historique sauvegardée',
      content: 'Contenu synthétique conservé par la sauvegarde.',
      metadata: {},
    });

    const before = await services.manager.getResource(legacy.id);

    // Fermeture propre : SQLite replie le WAL, les trois fichiers sont
    // cohérents sur disque et copiables.
    services.close();

    const backupDir = join(dataDir, 'sauvegarde');
    mkdirSync(backupDir);

    const files = ['ekts.db', 'ekts-fts.db', 'ekts-vectors.db'];
    for (const file of files) {
      copyFileSync(join(dataDir, file), join(backupDir, file));
    }

    // Perte simulée des bases, puis restauration depuis la copie.
    for (const file of files) {
      rmSync(join(dataDir, file));
    }
    for (const file of files) {
      copyFileSync(join(backupDir, file), join(dataDir, file));
    }

    services = openCliServices({ dataDir, env: {}, embeddingsMode: 'disabled' });

    const after = await services.manager.getResource(legacy.id);

    expect(after).toEqual(before);
    expect(after?.metadata['provenance']).toBeUndefined();
  });

  it('n’attribue aucune provenance lors d’une mise à jour qui n’en fournit pas', async () => {
    const legacy = await services.manager.addResource({
      type: 'article',
      title: 'Ressource historique',
    });

    const updated = await services.manager.updateResource(legacy.id, { title: 'Titre révisé' });

    expect(updated.title).toBe('Titre révisé');
    expect(updated.metadata['provenance']).toBeUndefined();
  });
});
