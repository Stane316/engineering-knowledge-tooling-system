import { describe, expect, it } from 'vitest';

import {
  EktsError,
  IndexingError,
  ResourceNotFoundError,
  ValidationError,
} from '../../src/shared/errors.js';

describe('Erreurs métier', () => {
  describe('ResourceNotFoundError', () => {
    it('expose un code stable et l’identifiant recherché', () => {
      const error = new ResourceNotFoundError('abc-123');

      expect(error).toBeInstanceOf(EktsError);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.name).toBe('ResourceNotFoundError');
      expect(error.resourceId).toBe('abc-123');
      expect(error.message).toContain('abc-123');
    });

    it('se sérialise en JSON exploitable par la CLI', () => {
      expect(new ResourceNotFoundError('abc-123').toJSON()).toEqual({
        name: 'ResourceNotFoundError',
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ressource introuvable : abc-123',
      });
    });
  });

  describe('ValidationError', () => {
    it('résume les problèmes rencontrés', () => {
      const error = new ValidationError(['title : Le titre est obligatoire', 'type : invalide']);

      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.issues).toHaveLength(2);
      expect(error.message).toContain('title : Le titre est obligatoire');
    });

    it('accepte une liste vide', () => {
      expect(new ValidationError([]).message).toBe('Validation échouée : entrée invalide');
    });

    it('conserve la cause technique', () => {
      const cause = new Error('ZodError');

      expect(new ValidationError(['x'], { cause }).cause).toBe(cause);
    });
  });

  describe('IndexingError', () => {
    it('préfixe le message et conserve la cause', () => {
      const cause = new Error('disk I/O error');
      const error = new IndexingError('réindexation interrompue', { cause });

      expect(error.code).toBe('INDEXING_FAILED');
      expect(error.message).toBe('Indexation échouée : réindexation interrompue');
      expect(error.cause).toBe(cause);
    });
  });
});
