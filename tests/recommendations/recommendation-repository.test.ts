import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { migration006Recommendations } from '../../src/data/migrations/006_recommendations.js';
import { RecommendationRepository } from '../../src/recommendations/recommendation-repository.js';
import { ValidationError } from '../../src/shared/errors.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

describe('RecommendationRepository (Sprint 16-01)', () => {
  let db: Database.Database;
  let repo: RecommendationRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    // FK : la table projects doit exister avant generated_recommendations
    // (contrainte réelle, activée par foreign_keys dans les bases ouvertes).
    db.exec(
      `CREATE TABLE projects (
         id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL
       )`,
    );
    db.prepare('INSERT INTO projects (id, name, url, created_at) VALUES (?, ?, ?, ?)').run(
      'proj-1',
      'Test',
      'https://example.com',
      '2026-01-01T00:00:00.000Z',
    );
    migration006Recommendations(db);
    repo = new RecommendationRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  /** Entrée de règle minimale réutilisable. */
  function ruleInput(
    overrides: Partial<Parameters<RecommendationRepository['createRule']>[0]> = {},
  ) {
    return {
      name: 'R1',
      description: 'Description',
      dimension: 'performance' as const,
      severityThreshold: 2 as const,
      pattern: 'images',
      recommendationTitle: 'Optimiser les images',
      recommendationDescription: 'Convertir en WebP',
      ...overrides,
    };
  }

  describe('CRUD des règles', () => {
    it('crée une règle avec défauts (actif, effort 3, impact 3, medium)', () => {
      const rule = repo.createRule(ruleInput());

      expect(rule.id).toMatch(UUID);
      expect(rule.isActive).toBe(true);
      expect(rule.effort).toBe(3);
      expect(rule.impact).toBe(3);
      expect(rule.priority).toBe('medium');
      expect(rule.createdAt).toBe(rule.updatedAt);
      expect(rule.severityThreshold).toBe(2);
    });

    it('crée avec effort/impact/priority explicites', () => {
      const rule = repo.createRule(ruleInput({ effort: 2, impact: 5, priority: 'critical' }));
      expect(rule).toMatchObject({ effort: 2, impact: 5, priority: 'critical' });
    });

    it('lit une règle par id (null si absente)', () => {
      const rule = repo.createRule(ruleInput());
      expect(repo.getRuleById(rule.id)?.name).toBe('R1');
      expect(repo.getRuleById('inconnu')).toBeNull();
    });

    it('filtre par dimension, statut et priorité + pagination', () => {
      repo.createRule(ruleInput({ name: 'A', dimension: 'performance' }));
      repo.createRule(ruleInput({ name: 'B', dimension: 'seo' }));
      const third = repo.createRule(ruleInput({ name: 'C', dimension: 'performance' }));
      repo.updateRule(third.id, { isActive: false });

      expect(repo.listRules({ dimension: 'performance' })).toHaveLength(2);
      expect(repo.listRules({ isActive: true })).toHaveLength(2);
      expect(repo.listRules({ priority: 'medium' })).toHaveLength(3);
      expect(repo.listRules({ dimension: 'performance', isActive: true })).toHaveLength(1);
      expect(repo.listRules({ limit: 1 })).toHaveLength(1);
      expect(repo.listRules({ limit: 1, offset: 1 })).toHaveLength(1);
      expect(repo.listRules({ limit: 1, offset: 5 })).toHaveLength(0);
    });

    it('mettre à jour une règle (patch partiel + updated_at)', () => {
      const rule = repo.createRule(ruleInput({ name: 'Original' }));
      const updated = repo.updateRule(rule.id, { name: 'Updated', isActive: false });

      expect(updated.name).toBe('Updated');
      expect(updated.isActive).toBe(false);
      expect(updated.description).toBe('Description'); // inchangé
      expect(updated.updatedAt >= rule.updatedAt).toBe(true);
    });

    it('updateRule sans champ = retour inchangé', () => {
      const rule = repo.createRule(ruleInput());
      expect(repo.updateRule(rule.id, {})).toEqual(rule);
    });

    it('updateRule sur règle absente = ValidationError', () => {
      expect(() => repo.updateRule('absente', { name: 'X' })).toThrow(ValidationError);
    });

    it('supprime une règle (changes = 0 → ValidationError)', () => {
      const rule = repo.createRule(ruleInput());
      repo.deleteRule(rule.id);
      expect(repo.getRuleById(rule.id)).toBeNull();
      expect(() => repo.deleteRule(rule.id)).toThrow(ValidationError);
    });

    it('compte les règles avec filtres', () => {
      repo.createRule(ruleInput({ dimension: 'performance' }));
      repo.createRule(ruleInput({ dimension: 'seo' }));
      expect(repo.countRules()).toBe(2);
      expect(repo.countRules({ dimension: 'performance' })).toBe(1);
      expect(repo.countRules({ isActive: true })).toBe(2);
    });
  });

  describe('Recommandations générées', () => {
    /** Recommandation minimale. */
    function recInput(overrides: Record<string, unknown> = {}) {
      return {
        projectId: 'proj-1',
        ruleId: null,
        findingTitle: 'Finding',
        recommendationTitle: 'Recommandation',
        recommendationDescription: 'Description',
        dimension: 'performance' as const,
        relevanceScore: 0.8,
        effort: 2,
        impact: 4,
        priority: 'high' as const,
        generatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
      };
    }

    it('sauvegarde et récupère une recommandation (id généré)', () => {
      const saved = repo.saveRecommendation(recInput());
      expect(saved.id).toMatch(UUID);

      const list = repo.getRecommendations('proj-1');
      expect(list).toHaveLength(1);
      expect(list[0]).toEqual(saved);
      expect(list[0]?.relevanceScore).toBe(0.8);
      expect(list[0]?.ruleId).toBeNull();
    });

    it('trie par relevance_score décroissant', () => {
      repo.saveRecommendation(recInput({ recommendationTitle: 'B', relevanceScore: 0.5 }));
      repo.saveRecommendation(recInput({ recommendationTitle: 'A', relevanceScore: 0.9 }));

      const list = repo.getRecommendations('proj-1');
      expect(list.map((item) => item.relevanceScore)).toEqual([0.9, 0.5]);
    });

    it('respecte le limit (défaut 20)', () => {
      for (let index = 0; index < 25; index += 1) {
        repo.saveRecommendation(
          recInput({ recommendationTitle: `R${index}`, relevanceScore: index / 25 }),
        );
      }
      expect(repo.getRecommendations('proj-1')).toHaveLength(20);
      expect(repo.getRecommendations('proj-1', 5)).toHaveLength(5);
    });

    it("purge les recommandations d'un projet (régénération)", () => {
      repo.saveRecommendation(recInput());
      repo.saveRecommendation(recInput({ recommendationTitle: 'Autre' }));
      repo.clearRecommendations('proj-1');
      expect(repo.getRecommendations('proj-1')).toHaveLength(0);
      expect(repo.countRecommendations('proj-1')).toBe(0);
    });

    it('compte les recommandations par projet', () => {
      repo.saveRecommendation(recInput());
      expect(repo.countRecommendations('proj-1')).toBe(1);
      expect(repo.countRecommendations('proj-autre')).toBe(0);
    });

    it('FK rule_id : suppression de règle → NULL (ON DELETE SET NULL)', () => {
      const rule = repo.createRule(ruleInput());
      repo.saveRecommendation(recInput({ ruleId: rule.id }));
      repo.deleteRule(rule.id);

      const [stored] = repo.getRecommendations('proj-1');
      expect(stored?.ruleId).toBeNull();
    });
  });
});
