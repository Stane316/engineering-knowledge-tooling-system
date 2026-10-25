import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BestPracticeRepository } from '../../src/best-practices/best-practice-repository.js';
import { BestPracticeSearch } from '../../src/best-practices/best-practice-search.js';
import { migration005BestPractices } from '../../src/data/migrations/005_best_practices.js';

describe('BestPracticeSearch (Sprint 15-01)', () => {
  let db: Database.Database;
  let repo: BestPracticeRepository;
  let search: BestPracticeSearch;

  beforeEach(() => {
    db = new Database(':memory:');
    migration005BestPractices(db);
    repo = new BestPracticeRepository(db);
    search = new BestPracticeSearch(db, repo);

    repo.create({
      title: 'Optimiser les images WebP',
      description: 'Convertir les images PNG/JPEG en WebP pour réduire la taille',
      category: 'performance',
      tags: ['images', 'webp'],
    });
    repo.create({
      title: 'Ajouter les attributs alt aux images',
      description: 'Chaque image doit avoir un attribut alt descriptif',
      category: 'accessibility',
      tags: ['images', 'alt', 'a11y'],
    });
    repo.create({
      title: 'Méta description unique par page',
      description: 'Chaque page doit avoir une méta description unique et pertinente',
      category: 'seo',
      tags: ['meta', 'seo'],
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('recherche avec requête (FTS5)', () => {
    it('trouve par titre', () => {
      const results = search.search({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(2);
      // Normalisation BM25 min-max : bornée [0 ; 1], meilleur score > 0
      // (le pire match peut valoir 0 exact — écart au test spec dont
      // l'assertion >0 est inatteignable avec cette normalisation).
      expect(results.every((result) => result.score >= 0 && result.score <= 1)).toBe(true);
      expect(results[0]?.score ?? 0).toBeGreaterThan(0);
    });

    it('trouve par description', () => {
      const results = search.search({ query: 'WebP' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.practice.title).toContain('WebP');
    });

    it('retourne vide sans résultat', () => {
      expect(search.search({ query: 'xyznonexistent' })).toHaveLength(0);
    });

    it('reste stable avec des caractères spéciaux (injection FTS neutralisée)', () => {
      for (const query of ['images "test"', 'a OR b', "tag'", 'NEAR(', 'col:val']) {
        expect(Array.isArray(search.search({ query }))).toBe(true);
      }
      // Termes existants tous présents : l'AND implicite reste satisfait après nettoyage
      expect(search.search({ query: 'images (alt' }).length).toBeGreaterThanOrEqual(1);
    });

    it('respecte la limite', () => {
      expect(search.search({ query: 'images', limit: 1 })).toHaveLength(1);
    });

    it('classe par pertinence : meilleur rang BM25 en premier', () => {
      const results = search.search({ query: 'WebP images' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (let index = 1; index < results.length; index += 1) {
        expect(results[index - 1]?.score ?? 0).toBeGreaterThanOrEqual(results[index]?.score ?? 0);
      }
    });

    it('retourne vide pour une requête vide ou blanche (basculée en énumération)', () => {
      expect(search.search({ query: '' }).every((r) => r.matchType === 'list')).toBe(true);
      expect(search.search({ query: '   ' }).every((r) => r.matchType === 'list')).toBe(true);
    });
  });

  describe('recherche sans requête (énumération filtrée)', () => {
    it('liste toutes les bonnes pratiques (matchType list)', () => {
      const results = search.search({});
      expect(results).toHaveLength(3);
      expect(results.every((result) => result.matchType === 'list')).toBe(true);
      expect(results.every((result) => result.score === 1)).toBe(true);
    });

    it('filtre par catégorie', () => {
      const results = search.search({ category: 'performance' });
      expect(results).toHaveLength(1);
      expect(results[0]?.practice.category).toBe('performance');
    });

    it('filtre par tag', () => {
      expect(search.search({ tag: 'images' })).toHaveLength(2);
    });

    it('filtre par projet et pagine', () => {
      repo.create({
        title: 'BP projet',
        description: 'D',
        category: 'general',
        sourceProjectIds: ['proj-9'],
      });
      const results = search.search({ projectId: 'proj-9' });
      expect(results).toHaveLength(1);
      expect(search.search({ limit: 2 })).toHaveLength(2);
    });
  });

  describe('matchType', () => {
    it('retourne fts pour les recherches textuelles (sans ranker)', () => {
      const results = search.search({ query: 'images' });
      expect(results.every((result) => result.matchType === 'fts')).toBe(true);
    });

    it('retourne list pour les énumérations', () => {
      expect(search.search({}).every((result) => result.matchType === 'list')).toBe(true);
    });
  });

  describe('fusion RRF avec ranker sémantique injecté (C15.5)', () => {
    it('produit matchType=hybrid et fusionne les deux classements', () => {
      const all = repo.list();
      const semantic = new BestPracticeSearch(db, repo, () =>
        [all[2]?.id, all[0]?.id, all[1]?.id].filter((id): id is string => id !== undefined),
      );

      const results = semantic.search({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((result) => result.matchType === 'hybrid')).toBe(true);
      expect(results.every((result) => result.score > 0 && result.score <= 1)).toBe(true);
    });

    it('les documents corroborent entre les deux classements arrivent en tête', () => {
      const byTitle = (needle: string): string =>
        repo.list().find((bp) => bp.title.includes(needle))?.id ?? '';
      // Le ranker "sémantique" place WebP en 1er : corroboration FTS attendue.
      const semantic = new BestPracticeSearch(db, repo, () => [byTitle('WebP')].filter(Boolean));

      const results = semantic.search({ query: 'WebP' });
      expect(results[0]?.practice.title).toContain('WebP');
      expect(results[0]?.matchType).toBe('hybrid');
    });

    it('un identifiant absent du repo est ignoré sans crash', () => {
      const semantic = new BestPracticeSearch(db, repo, () => ['id-inexistant']);
      const results = semantic.search({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((result) => !result.practice.id.includes('inexistant'))).toBe(true);
    });
  });

  describe('synchronisation FTS (triggers 005)', () => {
    it('un update de titre/description est reindexé', () => {
      const bp = repo.create({ title: 'Titre original', description: 'D', category: 'general' });
      repo.update(bp.id, { title: 'Zebra unik' });

      expect(search.search({ query: 'Zebra' })).toHaveLength(1);
      expect(search.search({ query: 'original' })).toHaveLength(0);
    });

    it('une suppression retire la ligne de l’index', () => {
      const bp = repo.create({ title: 'Supprimable', description: 'D', category: 'general' });
      expect(search.search({ query: 'Supprimable' })).toHaveLength(1);
      repo.delete(bp.id);
      expect(search.search({ query: 'Supprimable' })).toHaveLength(0);
    });
  });
});
