import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { openDatabase, type EktsDatabase } from '../../src/data/database.js';
import { AuditSchema } from '../../src/storage/schema.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';

describe('BestPracticeService (Sprint 15-02)', () => {
  let dataDir: string;
  let database: EktsDatabase;
  let service: BestPracticeService;

  beforeEach(() => {
    // Vraies bases (migrations multi-fichiers) — voir leçon fixtures S14.
    dataDir = createDataDir();
    database = openDatabase({ dataDir });
    new AuditSchema(database.connection).createSchema();
    service = new BestPracticeService(database.connection);
  });

  afterEach(() => {
    database.close();
    removeDataDir(dataDir);
  });

  describe('CRUD', () => {
    it('crée une bonne pratique manuelle (isManual forcé)', () => {
      const bp = service.create({
        title: 'Test BP',
        description: 'Description',
        category: 'performance',
        tags: ['test'],
        isManual: false, // volontairement faux : le service force `true`
      });

      expect(bp.isManual).toBe(true);
      expect(bp.title).toBe('Test BP');
      expect(bp.tags).toEqual(['test']);
    });

    it('liste, récupère, met à jour et supprime', () => {
      const bp = service.create({ title: 'BP1', description: 'D', category: 'seo' });

      expect(service.list()).toHaveLength(1);
      expect(service.getById(bp.id)?.title).toBe('BP1');

      service.update(bp.id, { title: 'Updated' });
      expect(service.getById(bp.id)?.title).toBe('Updated');

      service.delete(bp.id);
      expect(service.getById(bp.id)).toBeNull();
      expect(service.count()).toBe(0);
    });

    it('délègue les filtres au repository', () => {
      service.create({ title: 'BP1', description: 'D', category: 'seo' });
      service.create({ title: 'BP2', description: 'D', category: 'performance' });

      expect(service.count({ category: 'seo' })).toBe(1);
      expect(service.list({ category: 'performance' })).toHaveLength(1);
    });

    it('update d’une pratique absente lève ValidationError', () => {
      expect(() => service.update('inexistant', { title: 'X' })).toThrow(/introuvable/iu);
    });
  });

  describe('Recherche', () => {
    it('recherche par texte (FTS5)', () => {
      service.create({
        title: 'Optimiser les images',
        description: 'Convertir en WebP',
        category: 'performance',
      });

      const results = service.searchPractices({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.practice.title).toContain('images');
    });

    it('liste sans requête (matchType list)', () => {
      service.create({ title: 'BP1', description: 'D', category: 'seo' });
      service.create({ title: 'BP2', description: 'D', category: 'performance' });

      const results = service.searchPractices({});
      expect(results).toHaveLength(2);
      expect(results.every((result) => result.matchType === 'list')).toBe(true);
    });
  });

  describe('Extraction déléguée', () => {
    it('délègue à l’extractor (projet sans audit = rapport vide)', () => {
      const report = service.extractFromProject('proj-vide');
      expect(report).toMatchObject({ auditsAnalyzed: 0, practicesExtracted: 0 });
    });
  });

  describe('Associations', () => {
    it('lie et retrouve par finding', () => {
      const bp = service.create({ title: 'BP', description: 'D', category: 'performance' });

      service.linkToFinding(bp.id, 'perf-lcp-slow', 'performance', 0.9);

      const found = service.findByFinding('perf-lcp-slow', 'performance');
      expect(found).toHaveLength(1);
      expect(found[0]?.id).toBe(bp.id);
      expect(service.findLinkedFindings(bp.id)[0]?.confidence).toBe(0.9);
    });

    it('détaille les liens (sens inverse) puis délie', () => {
      const bp = service.create({ title: 'BP', description: 'D', category: 'performance' });

      service.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      expect(service.findLinkedFindings(bp.id)).toHaveLength(1);

      service.unlinkFromFinding(bp.id, 'perf-lcp-slow', 'performance');
      expect(service.findByFinding('perf-lcp-slow', 'performance')).toHaveLength(0);
      expect(service.findLinkedFindings(bp.id)).toHaveLength(0);
    });

    it('confiance par défaut = 1 (repository)', () => {
      const bp = service.create({ title: 'BP', description: 'D', category: 'seo' });
      service.linkToFinding(bp.id, 'seo-meta', 'seo');
      expect(service.findLinkedFindings(bp.id)[0]?.confidence).toBe(1);
    });
  });

  describe('Comptage', () => {
    it('compte toutes les bonnes pratiques puis filtrées', () => {
      service.create({ title: 'BP1', description: 'D', category: 'seo' });
      service.create({ title: 'BP2', description: 'D', category: 'performance' });

      expect(service.count()).toBe(2);
      expect(service.count({ category: 'seo' })).toBe(1);
    });
  });
});
