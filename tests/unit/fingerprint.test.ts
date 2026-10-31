/**
 * Empreinte de contenu — logique pure (Sprint 22-02).
 *
 * GREEN initial, comme les autres tests de module : le RED comportemental du
 * sous-sprint est porté par `corpus-identity.test.ts` et `version-identity.test.ts`
 * (4 échecs « promise resolved … instead of rejecting » avant la garde). La
 * sensibilité de ce fichier est prouvée par mutation au rapport.
 */

import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/shared/errors.js';
import {
  assertFingerprintMatches,
  assertVersionIdentity,
  parseProvenance,
  sha256OfUtf8,
  verifyFingerprint,
  type Provenance,
} from '../../src/shared/provenance.js';

function provenanceFor(sha: string | null): Provenance {
  return parseProvenance({
    source: 'test://fingerprint',
    sourceVersion: null,
    rights: { read: 'granted', redistribute: 'unknown', execute: 'unknown' },
    sensitivity: 'synthetic',
    fingerprint: sha === null ? null : { sha256: sha },
    review: { status: 'authorized', decidedAt: null, decidedBy: null },
  });
}

describe('sha256OfUtf8 — octets exacts', () => {
  it('calcule les vecteurs connus', () => {
    expect(sha256OfUtf8('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256OfUtf8('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('correspond à un calcul indépendant sur les octets UTF-8', () => {
    const text = 'Évaluation — accents et symboles « » ’';

    expect(sha256OfUtf8(text)).toBe(
      createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex'),
    );
  });

  it('distingue LF de CRLF : aucune normalisation implicite', () => {
    expect(sha256OfUtf8('a\nb')).not.toBe(sha256OfUtf8('a\r\nb'));
  });

  it('distingue un espace final', () => {
    expect(sha256OfUtf8('texte')).not.toBe(sha256OfUtf8('texte '));
  });
});

describe('verifyFingerprint — quatre états', () => {
  const content = 'Contenu de référence.';
  const sha = sha256OfUtf8(content);

  it('« absent » quand aucune empreinte n’est déclarée', () => {
    expect(verifyFingerprint(undefined, content)).toBe('absent');
    expect(verifyFingerprint(provenanceFor(null), content)).toBe('absent');
  });

  it('« unverifiable » quand l’empreinte n’a pas de copie à vérifier', () => {
    expect(verifyFingerprint(provenanceFor(sha), undefined)).toBe('unverifiable');
  });

  it('« verified » quand l’empreinte décrit le contenu conservé', () => {
    expect(verifyFingerprint(provenanceFor(sha), content)).toBe('verified');
  });

  it('« mismatch » quand le contenu a changé sous la même empreinte', () => {
    expect(verifyFingerprint(provenanceFor(sha), `${content} `)).toBe('mismatch');
  });
});

describe('assertFingerprintMatches — écriture', () => {
  const content = 'Contenu de référence.';
  const sha = sha256OfUtf8(content);

  it('accepte l’empreinte exacte', () => {
    expect(() => assertFingerprintMatches(provenanceFor(sha), content)).not.toThrow();
  });

  it('refuse une empreinte qui ne décrit pas les octets', () => {
    expect(() => assertFingerprintMatches(provenanceFor(sha), `${content}\n`)).toThrow(
      ValidationError,
    );
  });

  it('ne vérifie rien sans empreinte ni contenu', () => {
    expect(() => assertFingerprintMatches(undefined, content)).not.toThrow();
    expect(() => assertFingerprintMatches(provenanceFor(null), content)).not.toThrow();
    expect(() => assertFingerprintMatches(provenanceFor(sha), undefined)).not.toThrow();
  });
});

describe('assertVersionIdentity — pas de preuve rétroactive', () => {
  const v1 = 'Version 1.';
  const v2 = 'Version 2.';
  const h1 = sha256OfUtf8(v1);
  const h2 = sha256OfUtf8(v2);

  it('laisse passer si aucune empreinte n’était enregistrée', () => {
    expect(() => assertVersionIdentity(undefined, undefined, v2)).not.toThrow();
    expect(() => assertVersionIdentity(provenanceFor(null), undefined, v2)).not.toThrow();
  });

  it('refuse un contenu modifié sans nouvelle empreinte', () => {
    expect(() => assertVersionIdentity(provenanceFor(h1), undefined, v2)).toThrow(/empreinte/i);
  });

  it('refuse l’ancienne empreinte réutilisée sur le nouveau texte', () => {
    expect(() => assertVersionIdentity(provenanceFor(h1), provenanceFor(h1), v2)).toThrow(
      /empreinte/i,
    );
  });

  it('accepte la nouvelle empreinte qui décrit le nouveau texte', () => {
    expect(() => assertVersionIdentity(provenanceFor(h1), provenanceFor(h2), v2)).not.toThrow();
  });

  it('refuse l’effacement du contenu sous une empreinte', () => {
    expect(() => assertVersionIdentity(provenanceFor(h1), provenanceFor(h1), null)).toThrow(
      /effacé/i,
    );
  });
});
