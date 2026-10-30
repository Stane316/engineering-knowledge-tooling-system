/**
 * Module de provenance — logique pure (Sprint 22-01).
 *
 * Ces cas sont un **GREEN initial** : ils ont été écrits après la création du
 * module, comme ceux de 21-03. Ils ne remplacent aucun RED — le RED
 * comportemental du sous-sprint est celui de
 * `tests/integration/provenance-write.test.ts` (6 échecs
 * « promise resolved … instead of rejecting ») et de
 * `tests/cli/provenance.test.ts` (9 échecs sur le binaire). Ils couvrent des
 * branches que ces parcours n'atteignent pas, et leur sensibilité est prouvée
 * par mutation, consignée dans `SPRINT-22-01-RESULTAT.md`.
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/shared/errors.js';
import {
  assessAdmission,
  assertProvenancePreserved,
  extractProvenance,
  parseProvenance,
  PROVENANCE_METADATA_KEY,
  type Provenance,
} from '../../src/shared/provenance.js';

const SHA = 'a3f1c8d9e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0';

/** Provenance de base, paramétrable par axe. */
function provenance(
  overrides: Partial<
    Record<'read' | 'redistribute' | 'execute' | 'review' | 'sensitivity', string>
  > = {},
): Record<string, unknown> {
  return {
    source: 'depot://corpus-synthetique/r01.md',
    sourceVersion: 'commit-abc123',
    rights: {
      read: overrides.read ?? 'granted',
      redistribute: overrides.redistribute ?? 'refused',
      execute: overrides.execute ?? 'unknown',
    },
    sensitivity: overrides.sensitivity ?? 'synthetic',
    fingerprint: { sha256: SHA },
    review: {
      status: overrides.review ?? 'authorized',
      decidedAt: '2026-10-30T10:00:00.000Z',
      decidedBy: 'operateur-test',
    },
  };
}

describe('parseProvenance — contrat validé', () => {
  it('accepte un bloc complet et le rend tel quel', () => {
    const value = provenance();
    const parsed = parseProvenance(value);

    expect(parsed).toEqual(value);
  });

  it('accepte les valeurs explicitement inconnues (`null`) sans les remplacer', () => {
    const value = {
      ...provenance(),
      source: null,
      sourceVersion: null,
      fingerprint: null,
      review: { status: 'pending', decidedAt: null, decidedBy: null },
    };

    const parsed = parseProvenance(value);

    expect(parsed.source).toBeNull();
    expect(parsed.sourceVersion).toBeNull();
    expect(parsed.fingerprint).toBeNull();
    expect(parsed.review.decidedAt).toBeNull();
    expect(parsed.review.decidedBy).toBeNull();
  });

  it('refuse un champ obligatoire manquant plutôt que de le supposer inconnu', () => {
    const value = provenance();
    delete (value as Record<string, unknown>)['source'];

    expect(() => parseProvenance(value)).toThrow(ValidationError);
  });

  it('refuse une clé inconnue (pas de champ fantôme accepté)', () => {
    expect(() => parseProvenance({ ...provenance(), licence: 'CC-BY' })).toThrow(/provenance/i);
  });

  it('cite le chemin fautif dans le message', () => {
    const value = {
      ...provenance(),
      rights: { read: 'granted', redistribute: 'peut-être', execute: 'unknown' },
    };

    expect(() => parseProvenance(value)).toThrow(/provenance\.rights\.redistribute/);
  });
});

describe('extractProvenance — lecture depuis metadata', () => {
  it('rend `undefined` quand le bloc est absent (ressource historique)', () => {
    expect(extractProvenance({})).toBeUndefined();
    expect(extractProvenance({ auteur: 'canari' })).toBeUndefined();
  });

  it('valide un bloc présent', () => {
    const parsed = extractProvenance({ [PROVENANCE_METADATA_KEY]: provenance() });

    expect(parsed?.rights.read).toBe('granted');
  });

  it('refuse un bloc présent mais invalide', () => {
    expect(() => extractProvenance({ [PROVENANCE_METADATA_KEY]: { source: 'x' } })).toThrow(
      ValidationError,
    );
  });
});

describe('assessAdmission — règle du 30/10/2026', () => {
  it('admet une provenance autorisée avec lecture accordée', () => {
    const admission = assessAdmission(parseProvenance(provenance()));

    expect(admission.admitted).toBe(true);
    expect(admission.reason).toMatch(/accordé/i);
  });

  it('exclut une lecture refusée', () => {
    const admission = assessAdmission(parseProvenance(provenance({ read: 'refused' })));

    expect(admission.admitted).toBe(false);
    expect(admission.reason).toMatch(/refus/i);
  });

  it('exclut une lecture inconnue (aucune décision)', () => {
    const admission = assessAdmission(parseProvenance(provenance({ read: 'unknown' })));

    expect(admission.admitted).toBe(false);
    expect(admission.reason).toMatch(/inconnu/i);
  });

  it.each(['pending', 'refused', 'unknown'])('exclut une revue « %s »', (status) => {
    const admission = assessAdmission(parseProvenance(provenance({ review: status })));

    expect(admission.admitted).toBe(false);
    expect(admission.reason).toContain(status);
  });

  it('exclut une ressource sans provenance, en le disant', () => {
    const admission = assessAdmission(undefined);

    expect(admission.admitted).toBe(false);
    expect(admission.reason).toMatch(/absente|historique/i);
  });

  it('ne confond pas les trois axes : redistribution refusée n’empêche pas la lecture', () => {
    const admission = assessAdmission(
      parseProvenance(provenance({ read: 'granted', redistribute: 'refused', execute: 'unknown' })),
    );

    expect(admission.admitted).toBe(true);
  });

  it('exige les deux conditions ensemble : lecture accordée mais revue en attente', () => {
    const admission = assessAdmission(
      parseProvenance(provenance({ read: 'granted', review: 'pending' })),
    );

    expect(admission.admitted).toBe(false);
  });
});

describe('assertProvenancePreserved — pas de disparition silencieuse', () => {
  const existing: Provenance = parseProvenance(provenance());

  it('ne dit rien si aucune provenance n’existait', () => {
    expect(() => assertProvenancePreserved(undefined, {})).not.toThrow();
  });

  it('ne dit rien si les métadonnées ne changent pas', () => {
    expect(() => assertProvenancePreserved(existing, undefined)).not.toThrow();
  });

  it('refuse une mise à jour qui retire le bloc', () => {
    expect(() => assertProvenancePreserved(existing, { auteur: 'canari' })).toThrow(/provenance/i);
  });

  it('accepte une provenance révisée', () => {
    expect(() =>
      assertProvenancePreserved(existing, {
        [PROVENANCE_METADATA_KEY]: provenance({ read: 'refused' }),
      }),
    ).not.toThrow();
  });
});
