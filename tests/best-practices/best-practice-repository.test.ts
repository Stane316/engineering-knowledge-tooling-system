import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BestPracticeRepository } from '../../src/best-practices/best-practice-repository.js';
import { migration005BestPractices } from '../../src/data/migrations/005_best_practices.js';

describe('BestPracticeRepository (Sprint 15-01)', () => {
  let db: Database.Database;
  let repo: BestPracticeRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    migration005BestPractices(db);
    repo = new BestPracticeRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('crée une bonne pratique avec tous les champs', () => {
      const bp = repo.create({
        title: 'Optimiser les images',
        description: 'Utiliser le format WebP pour réduire la taille des images',
        category: 'performance',
        tags: ['images', 'webp', 'optimization'],
        sourceProjectIds: ['project-1'],
        sourceAuditIds: [1, 2],
        isManual: false,
      });

      expect(bp.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu);
      expect(bp.title).toBe('Optimiser les images');
      expect(bp.category).toBe('performance');
      expect(bp.tags).toEqual(['images', 'webp', 'optimization']);
      expect(bp.sourceProjectIds).toEqual(['project-1']);
      expect(bp.sourceAuditIds).toEqual([1, 2]);
      expect(bp.occurrenceCount).toBe(1);
      expect(bp.isManual).toBe(false);
      expect(bp.createdAt).toBe(bp.updatedAt);
    });

    it('applique les valeurs par défaut', () => {
      const bp = repo.create({ title: 'Test', description: 'Description', category: 'general' });

      expect(bp.tags).toEqual([]);
      expect(bp.sourceProjectIds).toEqual([]);
      expect(bp.sourceAuditIds).toEqual([]);
      expect(bp.occurrenceCount).toBe(1);
      expect(bp.isManual).toBe(false);
    });

    it('marque les pratiques manuelles (is_manual = 1)', () => {
      const bp = repo.create({
        title: 'Manuelle',
        description: 'D',
        category: 'general',
        isManual: true,
      });
      expect(bp.isManual).toBe(true);
    });
  });

  describe('getById', () => {
    it('retourne null pour un ID inexistant', () => {
      expect(repo.getById('nonexistent')).toBeNull();
    });

    it('retourne la bonne pratique créée', () => {
      const created = repo.create({ title: 'Test', description: 'Desc', category: 'seo' });
      const found = repo.getById(created.id);
      expect(found?.title).toBe('Test');
      expect(found?.category).toBe('seo');
    });
  });

  describe('list — filtres, pagination, tri', () => {
    beforeEach(() => {
      repo.create({
        title: 'BP1',
        description: 'D1',
        category: 'performance',
        tags: ['webp', 'images'],
        sourceProjectIds: ['proj-1'],
      });
      repo.create({
        title: 'BP2',
        description: 'D2',
        category: 'seo',
        tags: ['lazy-loading'],
        sourceProjectIds: ['proj-2'],
      });
      repo.create({ title: 'BP3', description: 'D3', category: 'performance', tags: ['images'] });
    });

    it('liste toutes les bonnes pratiques', () => {
      expect(repo.list()).toHaveLength(3);
    });

    it('filtre par catégorie', () => {
      const filtered = repo.list({ category: 'performance' });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((bp) => bp.category === 'performance')).toBe(true);
    });

    it('filtre par tag exact (substring entier du JSON)', () => {
      expect(repo.list({ tag: 'webp' })).toHaveLength(1);
      expect(repo.list({ tag: 'images' })).toHaveLength(2);
      expect(repo.list({ tag: 'imag' })).toHaveLength(0);
    });

    it('filtre par projet source', () => {
      const filtered = repo.list({ projectId: 'proj-1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.sourceProjectIds).toContain('proj-1');
    });

    it('filtre par origine manuelle', () => {
      repo.create({ title: 'Manuelle', description: 'D', category: 'general', isManual: true });
      expect(repo.list({ isManual: true })).toHaveLength(1);
      expect(repo.list({ isManual: false })).toHaveLength(3);
    });

    it('pagine sans chevauchement', () => {
      const page1 = repo.list({ limit: 2, offset: 0 });
      const page2 = repo.list({ limit: 2, offset: 2 });
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      expect(page1[0]?.id).not.toBe(page2[0]?.id);
    });

    it('trie par occurrence_count décroissant', () => {
      const first = repo.list({ orderBy: 'occurrence_count', orderDir: 'desc' })[0];
      expect(first).toBeDefined();
      if (first !== undefined) {
        repo.incrementOccurrence(first.id);
        repo.incrementOccurrence(first.id);
      }
      const sorted = repo.list({ orderBy: 'occurrence_count', orderDir: 'desc' });
      expect(sorted[0]?.occurrenceCount).toBe(3);
      expect(sorted[0]?.id).toBe(first?.id);
    });

    it('trie par titre ascendant', () => {
      const sorted = repo.list({ orderBy: 'title', orderDir: 'asc' });
      expect(sorted.map((bp) => bp.title)).toEqual(['BP1', 'BP2', 'BP3']);
    });
  });

  describe('update', () => {
    it('met à jour les champs fournis et laisse les autres intacts', () => {
      const bp = repo.create({ title: 'Original', description: 'Desc', category: 'seo' });
      const updated = repo.update(bp.id, { title: 'Updated', tags: ['new-tag'] });

      expect(updated.title).toBe('Updated');
      expect(updated.tags).toEqual(['new-tag']);
      expect(updated.description).toBe('Desc');
      expect(updated.category).toBe('seo');
    });

    it("retourne la pratique inchangée si aucun champ n'est fourni", () => {
      const bp = repo.create({ title: 'Stable', description: 'D', category: 'general' });
      expect(repo.update(bp.id, {})).toEqual(bp);
    });

    it('signale une pratique introuvable (ValidationError)', () => {
      expect(() => repo.update('nonexistent', { title: 'X' })).toThrow(/introuvable/iu);
    });
  });

  describe('delete', () => {
    it('supprime la bonne pratique', () => {
      const bp = repo.create({ title: 'To Delete', description: 'D', category: 'general' });
      repo.delete(bp.id);
      expect(repo.getById(bp.id)).toBeNull();
    });

    it('supprime les associations en cascade (FK 005)', () => {
      const bp = repo.create({ title: 'Linked', description: 'D', category: 'performance' });
      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      expect(repo.findLinkedFindings(bp.id)).toHaveLength(1);

      repo.delete(bp.id);
      expect(repo.findLinkedFindings(bp.id)).toHaveLength(0);
      expect(db.prepare('SELECT COUNT(*) AS count FROM finding_best_practice').get()).toEqual({
        count: 0,
      });
    });

    it('supprimer une pratique absente est un no-op (idempotent)', () => {
      expect(() => repo.delete('nonexistent')).not.toThrow();
    });
  });

  describe('incrementOccurrence', () => {
    it('incrémente le compteur et enrichit la traçabilité', () => {
      const bp = repo.create({
        title: 'BP',
        description: 'D',
        category: 'general',
        sourceProjectIds: ['proj-1'],
        sourceAuditIds: [10],
      });

      repo.incrementOccurrence(bp.id, 'proj-2', 11);
      repo.incrementOccurrence(bp.id, 'proj-2', 11); // doublon ignoré

      const found = repo.getById(bp.id);
      expect(found?.occurrenceCount).toBe(3);
      expect(found?.sourceProjectIds).toEqual(['proj-1', 'proj-2']);
      expect(found?.sourceAuditIds).toEqual([10, 11]);
    });

    it("n'incrémente rien pour une pratique absente", () => {
      expect(() => repo.incrementOccurrence('nonexistent')).not.toThrow();
    });
  });

  describe('associations finding ↔ BP', () => {
    it('lie et retrouve par finding, trié par confiance', () => {
      const bp1 = repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      const bp2 = repo.create({ title: 'BP2', description: 'D2', category: 'performance' });

      repo.linkToFinding(bp1.id, 'perf-lcp-slow', 'performance', 0.9);
      repo.linkToFinding(bp2.id, 'perf-lcp-slow', 'performance', 0.7);

      const found = repo.findByFinding('perf-lcp-slow', 'performance');
      expect(found.map((bp) => bp.id)).toEqual([bp1.id, bp2.id]);
    });

    it('retrouve les findings liés (sens inverse)', () => {
      const bp = repo.create({ title: 'BP', description: 'D', category: 'seo' });
      repo.linkToFinding(bp.id, 'seo-meta-desc', 'seo');
      repo.linkToFinding(bp.id, 'seo-title-missing', 'seo');

      const findings = repo.findLinkedFindings(bp.id);
      expect(findings).toHaveLength(2);
      expect(findings.map((link) => link.findingTitle).sort()).toEqual([
        'seo-meta-desc',
        'seo-title-missing',
      ]);
    });

    it('ne crée aucun doublon (clé composite, INSERT OR IGNORE)', () => {
      const bp = repo.create({ title: 'BP', description: 'D', category: 'performance' });
      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      expect(repo.findLinkedFindings(bp.id)).toHaveLength(1);
    });

    it("l'association sur une dimension différente est un lien distinct", () => {
      const bp = repo.create({ title: 'BP', description: 'D', category: 'general' });
      repo.linkToFinding(bp.id, 'dup-finding', 'performance');
      repo.linkToFinding(bp.id, 'dup-finding', 'seo');
      expect(repo.findLinkedFindings(bp.id)).toHaveLength(2);
    });

    it('dissocie un lien finding ↔ pratique', () => {
      const bp = repo.create({ title: 'BP', description: 'D', category: 'performance' });
      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      repo.unlinkFromFinding(bp.id, 'perf-lcp-slow', 'performance');
      expect(repo.findLinkedFindings(bp.id)).toHaveLength(0);
      expect(repo.findByFinding('perf-lcp-slow', 'performance')).toHaveLength(0);
    });
  });

  describe('count', () => {
    it('compte sans filtre puis avec filtres', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      repo.create({ title: 'BP2', description: 'D2', category: 'seo' });
      expect(repo.count()).toBe(2);
      expect(repo.count({ category: 'performance' })).toBe(1);
      expect(repo.count({ tag: 'zzz' })).toBe(0);
      expect(repo.count({ projectId: 'absent' })).toBe(0);
    });
  });
});
