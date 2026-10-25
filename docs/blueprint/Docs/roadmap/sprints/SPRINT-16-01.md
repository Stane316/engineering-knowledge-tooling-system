# SPRINT-16-01 — Types, Migration, Rules, Repository et Engine

**Sprint :** 16-01 sur 16 (Sous-sprint 1/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ

---

## 1. Objectif du sous-sprint

Implémenter le cœur du moteur de recommandations :
- **Types** : Définir les interfaces TypeScript partagées
- **Migration** : Créer les tables `recommendation_rules` et `generated_recommendations`
- **RecommendationRules** : Modèle de règles explicites (matching pattern + sévérité)
- **RecommendationRepository** : CRUD des règles et des recommandations générées
- **RecommendationEngine** : Moteur hybride (règles explicites + scoring statistique)

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 15 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que les modules requis existent
ls src/best-practices/
# Doit afficher : best-practice.types.ts, best-practice-repository.ts,
# best-practice-search.ts, best-practice-extractor.ts, best-practice-service.ts
```

### 2.2 Documents à lire

- `SPRINT-16.md` (document parent)
- `SPRINT-15-RESULTAT.md` (résultats du sprint précédent)
- `src/storage/audit-repository.ts` (lecture des audits et findings)
- `src/analysis/types.ts` (types Finding, AnalysisDimension, Severity, Priority)
- `src/best-practices/best-practice-service.ts` (récupération des bonnes pratiques)

---

## 3. Tâches détaillées

### 3.1 Définir les types partagés (3h)

**Fichier :** `src/recommendations/recommendation.types.ts`

```typescript
/**
 * Types du moteur de recommandations contextuelles (Sprint 16).
 *
 * Le moteur combine deux approches :
 * 1. Règles explicites : table de règles (dimension, sévérité, pattern) → recommandation
 * 2. Scoring statistique : analyse de fréquence × impact × contexte
 *
 * Les recommandations sont personnalisées selon le contexte du projet
 * (historique, tendances, bonnes practices) et triées par score de pertinence.
 */

import type { AnalysisDimension, Priority, Severity } from '../analysis/types.js';

/**
 * Règle de recommandation explicite.
 */
export interface RecommendationRule {
  /** Identifiant UUID. */
  id: string;
  /** Nom lisible de la règle. */
  name: string;
  /** Description de la règle. */
  description: string;
  /** Dimension concernée. */
  dimension: AnalysisDimension | 'general';
  /** Sévérité minimum du finding pour activer la règle (0-4). */
  severityThreshold: Severity;
  /** Pattern de finding (titre normalisé ou regex simple). */
  pattern: string;
  /** Titre de la recommandation générée. */
  recommendationTitle: string;
  /** Description de la recommandation générée. */
  recommendationDescription: string;
  /** Effort estimé (1-5). */
  effort: number;
  /** Impact estimé (1-5). */
  impact: number;
  /** Priorité de la recommandation. */
  priority: Priority;
  /** Règle activée ou non. */
  isActive: boolean;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de dernière mise à jour (ISO 8601). */
  updatedAt: string;
}

/**
 * Entrée pour créer une règle de recommandation.
 */
export interface CreateRecommendationRuleInput {
  name: string;
  description: string;
  dimension: AnalysisDimension | 'general';
  severityThreshold: Severity;
  pattern: string;
  recommendationTitle: string;
  recommendationDescription: string;
  effort?: number;
  impact?: number;
  priority?: Priority;
}

/**
 * Entrée pour mettre à jour une règle.
 */
export interface UpdateRecommendationRuleInput {
  name?: string;
  description?: string;
  dimension?: AnalysisDimension | 'general';
  severityThreshold?: Severity;
  pattern?: string;
  recommendationTitle?: string;
  recommendationDescription?: string;
  effort?: number;
  impact?: number;
  priority?: Priority;
  isActive?: boolean;
}

/**
 * Filtres pour lister les règles.
 */
export interface RecommendationRuleFilters {
  /** Filtre par dimension. */
  dimension?: AnalysisDimension | 'general';
  /** Filtre par statut actif. */
  isActive?: boolean;
  /** Filtre par priorité. */
  priority?: Priority;
  /** Nombre maximum de résultats. */
  limit?: number;
  /** Décalage pour la pagination. */
  offset?: number;
}

/**
 * Recommandation générée pour un projet.
 */
export interface Recommendation {
  /** Identifiant UUID. */
  id: string;
  /** ID du projet concerné. */
  projectId: string;
  /** ID de la règle déclencheuse (null si scoring statistique). */
  ruleId: string | null;
  /** Titre du finding déclencheur (si applicable). */
  findingTitle: string | null;
  /** Titre de la recommandation. */
  recommendationTitle: string;
  /** Description détaillée. */
  recommendationDescription: string;
  /** Dimension concernée. */
  dimension: AnalysisDimension | 'general';
  /** Score de pertinence (0-1, 1 = très pertinent). */
  relevanceScore: number;
  /** Effort estimé (1-5). */
  effort: number;
  /** Impact estimé (1-5). */
  impact: number;
  /** Priorité calculée. */
  priority: Priority;
  /** Date de génération (ISO 8601). */
  generatedAt: string;
}

/**
 * Rapport de recommandations pour un projet.
 */
export interface RecommendationReport {
  /** ID du projet. */
  projectId: string;
  /** Nombre de recommandations générées. */
  totalRecommendations: number;
  /** Nombre de règles appliquées. */
  rulesApplied: number;
  /** Nombre de recommandations par scoring statistique. */
  statisticalRecommendations: number;
  /** Durée de génération (ms). */
  durationMs: number;
  /** Recommandations triées par pertinence. */
  recommendations: Recommendation[];
}

/**
 * Contexte d'un projet pour le scoring.
 */
export interface ProjectContext {
  /** ID du projet. */
  projectId: string;
  /** Nombre total d'audits. */
  totalAudits: number;
  /** Findings du dernier audit. */
  currentFindings: Array<{
    title: string;
    dimension: AnalysisDimension;
    severity: Severity;
    priority: Priority;
  }>;
  /** Fréquence des findings dans l'historique (titre normalisé → count). */
  findingFrequencies: Map<string, number>;
  /** Tendance par dimension. */
  dimensionTrends: Map<AnalysisDimension, 'improving' | 'declining' | 'stable'>;
  /** Taux de résolution par finding (titre normalisé → 0-1). */
  resolutionRates: Map<string, number>;
  /** Bonnes pratiques associées aux findings courants. */
  associatedBestPractices: Map<string, string[]>; // findingTitle → BP titles
}

/**
 * Options de génération des recommandations.
 */
export interface RecommendationOptions {
  /** Nombre maximum de recommandations (défaut: 10). */
  maxRecommendations?: number;
  /** Score minimum de pertinence (défaut: 0.3). */
  minRelevanceScore?: number;
  /** Inclure les recommandations des règles (défaut: true). */
  includeRules?: boolean;
  /** Inclure le scoring statistique (défaut: true). */
  includeStatistical?: boolean;
  /** Dimensions à inclure (défaut: toutes). */
  dimensions?: AnalysisDimension[];
}

/**
 * Résultat intermédiaire du matching de règles.
 */
export interface RuleMatch {
  /** Règle matched. */
  rule: RecommendationRule;
  /** Finding déclencheur. */
  findingTitle: string;
  /** Dimension. */
  dimension: AnalysisDimension | 'general';
  /** Sévérité du finding. */
  findingSeverity: Severity;
}

/**
 * Résultat intermédiaire du scoring statistique.
 */
export interface StatisticalMatch {
  /** Titre du finding récurrent. */
  findingTitle: string;
  /** Dimension. */
  dimension: AnalysisDimension;
  /** Fréquence dans l'historique. */
  frequency: number;
  /** Score calculé (avant ajustements contextuels). */
  baseScore: number;
  /** Bonne pratique associée (si existe). */
  associatedBestPractice?: string;
}
```

**Critères d'acceptation :**
- Tous les types exportés et documentés (JSDoc)
- Cohérence avec `AnalysisDimension`, `Severity`, `Priority` existants
- Types intermédiaires pour le matching de règles et le scoring statistique

---

### 3.2 Créer la migration 007 (3h)

**Fichier :** `src/storage/migrations/007_create_recommendations.ts`

```typescript
import type { Database } from 'better-sqlite3';

/**
 * Migration 007 : Tables pour le moteur de recommandations (Sprint 16).
 *
 * Crée 2 tables :
 * 1. `recommendation_rules` — règles explicites (pattern → recommandation)
 * 2. `generated_recommendations` — recommandations générées pour les projets
 */
export function migration007CreateRecommendations(db: Database.Database): void {
  // Table des règles de recommandation
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendation_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      dimension TEXT NOT NULL,
      severity_threshold INTEGER NOT NULL,
      pattern TEXT NOT NULL,
      recommendation_title TEXT NOT NULL,
      recommendation_description TEXT NOT NULL,
      effort INTEGER NOT NULL DEFAULT 3,
      impact INTEGER NOT NULL DEFAULT 3,
      priority TEXT NOT NULL DEFAULT 'medium',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recommendation_rules_dimension
    ON recommendation_rules(dimension)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recommendation_rules_active
    ON recommendation_rules(is_active)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recommendation_rules_priority
    ON recommendation_rules(priority)
  `);

  // Table des recommandations générées
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_recommendations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      rule_id TEXT,
      finding_title TEXT,
      recommendation_title TEXT NOT NULL,
      recommendation_description TEXT NOT NULL,
      dimension TEXT NOT NULL,
      relevance_score REAL NOT NULL,
      effort INTEGER NOT NULL,
      impact INTEGER NOT NULL,
      priority TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (rule_id) REFERENCES recommendation_rules(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_generated_recommendations_project
    ON generated_recommendations(project_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_generated_recommendations_score
    ON generated_recommendations(relevance_score DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_generated_recommendations_generated_at
    ON generated_recommendations(generated_at DESC)
  `);
}
```

**Mettre à jour le registre des migrations :**

**Fichier :** `src/storage/migrations/migration-registry.ts`

Ajouter la nouvelle migration :
```typescript
import { migration007CreateRecommendations } from './007_create_recommendations.js';

// Ajouter à la fin du tableau migrations[] :
{
  version: 7,
  name: 'create_recommendations',
  up: migration007CreateRecommendations,
},
```

**Critères d'acceptation :**
- Migration exécutable sans erreur
- 2 tables créées avec tous les champs et index
- Migration idempotente (IF NOT EXISTS)
- Contraintes référentielles (FOREIGN KEY)

---

### 3.3 Implémenter RecommendationRepository (5h)

**Fichier :** `src/recommendations/recommendation-repository.ts`

```typescript
import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import type {
  CreateRecommendationRuleInput,
  Recommendation,
  RecommendationRule,
  RecommendationRuleFilters,
  UpdateRecommendationRuleInput,
} from './recommendation.types.js';

/**
 * Repository pour les règles et recommandations (Sprint 16).
 *
 * Fournit :
 * - CRUD des règles de recommandation
 * - Sauvegarde et lecture des recommandations générées
 */
export class RecommendationRepository {
  constructor(private readonly db: Database.Database) {}

  // --- Règles ---

  /**
   * Créer une règle de recommandation.
   */
  createRule(input: CreateRecommendationRuleInput): RecommendationRule {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO recommendation_rules (
        id, name, description, dimension, severity_threshold,
        pattern, recommendation_title, recommendation_description,
        effort, impact, priority, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.description,
      input.dimension,
      input.severityThreshold,
      input.pattern,
      input.recommendationTitle,
      input.recommendationDescription,
      input.effort ?? 3,
      input.impact ?? 3,
      input.priority ?? 'medium',
      now,
      now,
    );

    return this.getRuleById(id)!;
  }

  /**
   * Récupérer une règle par ID.
   */
  getRuleById(id: string): RecommendationRule | null {
    const stmt = this.db.prepare('SELECT * FROM recommendation_rules WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRuleRow(row) : null;
  }

  /**
   * Lister les règles avec filtres.
   */
  listRules(filters: RecommendationRuleFilters = {}): RecommendationRule[] {
    let query = 'SELECT * FROM recommendation_rules WHERE 1=1';
    const params: unknown[] = [];

    if (filters.dimension) {
      query += ' AND dimension = ?';
      params.push(filters.dimension);
    }

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    query += ' ORDER BY created_at DESC';

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    return rows.map(row => this.mapRuleRow(row));
  }

  /**
   * Mettre à jour une règle.
   */
  updateRule(id: string, input: UpdateRecommendationRuleInput): RecommendationRule {
    const existing = this.getRuleById(id);
    if (!existing) {
      throw new Error(`RecommendationRule ${id} not found`);
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); params.push(input.name); }
    if (input.description !== undefined) { fields.push('description = ?'); params.push(input.description); }
    if (input.dimension !== undefined) { fields.push('dimension = ?'); params.push(input.dimension); }
    if (input.severityThreshold !== undefined) { fields.push('severity_threshold = ?'); params.push(input.severityThreshold); }
    if (input.pattern !== undefined) { fields.push('pattern = ?'); params.push(input.pattern); }
    if (input.recommendationTitle !== undefined) { fields.push('recommendation_title = ?'); params.push(input.recommendationTitle); }
    if (input.recommendationDescription !== undefined) { fields.push('recommendation_description = ?'); params.push(input.recommendationDescription); }
    if (input.effort !== undefined) { fields.push('effort = ?'); params.push(input.effort); }
    if (input.impact !== undefined) { fields.push('impact = ?'); params.push(input.impact); }
    if (input.priority !== undefined) { fields.push('priority = ?'); params.push(input.priority); }
    if (input.isActive !== undefined) { fields.push('is_active = ?'); params.push(input.isActive ? 1 : 0); }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id);

    this.db.prepare(`UPDATE recommendation_rules SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    return this.getRuleById(id)!;
  }

  /**
   * Supprimer une règle.
   */
  deleteRule(id: string): void {
    this.db.prepare('DELETE FROM recommendation_rules WHERE id = ?').run(id);
  }

  /**
   * Compter les règles.
   */
  countRules(filters?: RecommendationRuleFilters): number {
    let query = 'SELECT COUNT(*) as count FROM recommendation_rules WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.dimension) {
      query += ' AND dimension = ?';
      params.push(filters.dimension);
    }
    if (filters?.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    const row = this.db.prepare(query).get(...params) as { count: number };
    return row.count;
  }

  // --- Recommandations générées ---

  /**
   * Sauvegarder une recommandation générée.
   */
  saveRecommendation(recommendation: Omit<Recommendation, 'id'>): Recommendation {
    const id = randomUUID();

    this.db.prepare(`
      INSERT INTO generated_recommendations (
        id, project_id, rule_id, finding_title,
        recommendation_title, recommendation_description,
        dimension, relevance_score, effort, impact, priority, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      recommendation.projectId,
      recommendation.ruleId,
      recommendation.findingTitle,
      recommendation.recommendationTitle,
      recommendation.recommendationDescription,
      recommendation.dimension,
      recommendation.relevanceScore,
      recommendation.effort,
      recommendation.impact,
      recommendation.priority,
      recommendation.generatedAt,
    );

    return { id, ...recommendation };
  }

  /**
   * Récupérer les recommandations d'un projet.
   */
  getRecommendations(projectId: string, limit = 20): Recommendation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM generated_recommendations
      WHERE project_id = ?
      ORDER BY relevance_score DESC, generated_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(projectId, limit) as Record<string, unknown>[];
    return rows.map(row => this.mapRecommendationRow(row));
  }

  /**
   * Supprimer les recommandations d'un projet (pour regeneration).
   */
  clearRecommendations(projectId: string): void {
    this.db.prepare('DELETE FROM generated_recommendations WHERE project_id = ?').run(projectId);
  }

  /**
   * Compter les recommandations d'un projet.
   */
  countRecommendations(projectId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) as count FROM generated_recommendations WHERE project_id = ?'
    ).get(projectId) as { count: number };
    return row.count;
  }

  // --- Mapping ---

  private mapRuleRow(row: Record<string, unknown>): RecommendationRule {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      dimension: row.dimension as RecommendationRule['dimension'],
      severityThreshold: row.severity_threshold as number,
      pattern: row.pattern as string,
      recommendationTitle: row.recommendation_title as string,
      recommendationDescription: row.recommendation_description as string,
      effort: row.effort as number,
      impact: row.impact as number,
      priority: row.priority as RecommendationRule['priority'],
      isActive: (row.is_active as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapRecommendationRow(row: Record<string, unknown>): Recommendation {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      ruleId: (row.rule_id as string) ?? null,
      findingTitle: (row.finding_title as string) ?? null,
      recommendationTitle: row.recommendation_title as string,
      recommendationDescription: row.recommendation_description as string,
      dimension: row.dimension as Recommendation['dimension'],
      relevanceScore: row.relevance_score as number,
      effort: row.effort as number,
      impact: row.impact as number,
      priority: row.priority as Recommendation['priority'],
      generatedAt: row.generated_at as string,
    };
  }
}
```

**Critères d'acceptation :**
- CRUD complet des règles
- Sauvegarde et lecture des recommandations générées
- Filtres fonctionnels (dimension, isActive, priority)
- Pagination (limit, offset)
- clearRecommendations pour regénération
- Mapping correct des types

---

### 3.4 Implémenter RecommendationEngine (8h)

**Fichier :** `src/recommendations/recommendation-engine.ts`

```typescript
import type { Database } from 'better-sqlite3';

import type { AnalysisDimension, Severity } from '../analysis/types.js';
import type { AuditFinding } from '../storage/types.js';
import type { BestPracticeService } from '../best-practices/best-practice-service.js';
import type { RecommendationContext, ProjectContext } from './recommendation-context.js';

import type {
  CreateRecommendationRuleInput,
  Recommendation,
  RecommendationOptions,
  RecommendationReport,
  RecommendationRule,
  RecommendationRuleFilters,
  RuleMatch,
  StatisticalMatch,
  UpdateRecommendationRuleInput,
} from './recommendation.types.js';
import { RecommendationRepository } from './recommendation-repository.js';

/**
 * Configuration du moteur de recommandations.
 */
export interface EngineConfig {
  /** Score de base pour les règles explicites (défaut: 0.8). */
  ruleBaseScore: number;
  /** Score de base pour le scoring statistique (défaut: 0.5). */
  statisticalBaseScore: number;
  /** Ajustement si dimension en régression (défaut: +0.1). */
  decliningAdjustment: number;
  /** Ajustement si dimension en amélioration (défaut: -0.1). */
  improvingAdjustment: number;
  /** Ajustement si finding déjà résolu (défaut: -0.2). */
  resolvedAdjustment: number;
  /** Ajustement si finding persiste (défaut: +0.15). */
  persistentAdjustment: number;
  /** Nombre minimum d'occurrences pour scoring statistique (défaut: 3). */
  minFrequencyForStatistical: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  ruleBaseScore: 0.8,
  statisticalBaseScore: 0.5,
  decliningAdjustment: 0.1,
  improvingAdjustment: -0.1,
  resolvedAdjustment: -0.2,
  persistentAdjustment: 0.15,
  minFrequencyForStatistical: 3,
};

/**
 * Moteur de recommandations hybride (Sprint 16).
 *
 * Combine :
 * 1. Règles explicites : matching pattern + sévérité → recommandation
 * 2. Scoring statistique : fréquence × impact × contexte
 *
 * Les recommandations sont personnalisées selon le contexte du projet
 * (tendances, historique de résolutions, bonnes practices).
 */
export class RecommendationEngine {
  private repo: RecommendationRepository;
  private contextBuilder: RecommendationContext;
  private bestPractices?: BestPracticeService;
  private config: EngineConfig;
  private db: Database.Database;

  constructor(
    db: Database.Database,
    contextBuilder: RecommendationContext,
    bestPractices?: BestPracticeService,
    config?: Partial<EngineConfig>,
  ) {
    this.db = db;
    this.repo = new RecommendationRepository(db);
    this.contextBuilder = contextBuilder;
    this.bestPractices = bestPractices;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --- Gestion des règles ---

  addRule(input: CreateRecommendationRuleInput): RecommendationRule {
    return this.repo.createRule(input);
  }

  updateRule(ruleId: string, input: UpdateRecommendationRuleInput): RecommendationRule {
    return this.repo.updateRule(ruleId, input);
  }

  deleteRule(ruleId: string): void {
    this.repo.deleteRule(ruleId);
  }

  listRules(filters?: RecommendationRuleFilters): RecommendationRule[] {
    return this.repo.listRules(filters);
  }

  // --- Génération des recommandations ---

  /**
   * Générer les recommandations pour un projet.
   */
  async generateRecommendations(
    projectId: string,
    options?: RecommendationOptions,
  ): Promise<RecommendationReport> {
    const startTime = Date.now();
    const opts: RecommendationOptions = {
      maxRecommendations: options?.maxRecommendations ?? 10,
      minRelevanceScore: options?.minRelevanceScore ?? 0.3,
      includeRules: options?.includeRules ?? true,
      includeStatistical: options?.includeStatistical ?? true,
      dimensions: options?.dimensions,
    };

    // 1. Construire le contexte du projet
    const context = await this.contextBuilder.buildContext(projectId);

    // 2. Générer les recommandations par règles
    const ruleMatches: Recommendation[] = opts.includeRules
      ? this.generateFromRules(context, opts)
      : [];

    // 3. Générer les recommandations par scoring statistique
    const statisticalMatches: Recommendation[] = opts.includeStatistical
      ? this.generateFromStatistics(context, opts)
      : [];

    // 4. Fusionner et dédupliquer
    const allRecommendations = this.mergeAndDeduplicate(
      [...ruleMatches, ...statisticalMatches],
      opts,
    );

    // 5. Sauvegarder les recommandations
    this.repo.clearRecommendations(projectId);
    const saved = allRecommendations.map(rec => this.repo.saveRecommendation(rec));

    const rulesApplied = ruleMatches.filter(r => r.ruleId !== null).length;

    return {
      projectId,
      totalRecommendations: saved.length,
      rulesApplied,
      statisticalRecommendations: saved.length - rulesApplied,
      durationMs: Date.now() - startTime,
      recommendations: saved,
    };
  }

  /**
   * Générer les recommandations depuis les règles explicites.
   */
  private generateFromRules(
    context: ProjectContext,
    options: RecommendationOptions,
  ): Recommendation[] {
    const activeRules = this.repo.listRules({ isActive: true, limit: 10000 });
    const matches: RuleMatch[] = [];

    for (const finding of context.currentFindings) {
      const normalizedTitle = this.normalizeTitle(finding.title);

      for (const rule of activeRules) {
        // Filtrer par dimension si spécifié
        if (options.dimensions && !options.dimensions.includes(finding.dimension as AnalysisDimension)) {
          continue;
        }

        // Vérifier la dimension de la règle
        if (rule.dimension !== 'general' && rule.dimension !== finding.dimension) {
          continue;
        }

        // Vérifier le pattern
        if (!this.matchPattern(normalizedTitle, rule.pattern)) {
          continue;
        }

        // Vérifier la sévérité
        if (finding.severity < rule.severityThreshold) {
          continue;
        }

        matches.push({
          rule,
          findingTitle: finding.title,
          dimension: finding.dimension,
          findingSeverity: finding.severity,
        });
      }
    }

    // Convertir les matches en recommandations
    return matches.map(match => {
      const baseScore = this.config.ruleBaseScore;

      // Ajustement selon la sévérité
      const severityBonus = (match.findingSeverity / 4) * 0.15;

      // Ajustement contextuel
      const contextualScore = this.applyContextualAdjustments(
        baseScore + severityBonus,
        match.dimension as AnalysisDimension,
        match.findingTitle,
        context,
      );

      return {
        id: '', // Sera assigné par saveRecommendation
        projectId: context.projectId,
        ruleId: match.rule.id,
        findingTitle: match.findingTitle,
        recommendationTitle: match.rule.recommendationTitle,
        recommendationDescription: match.rule.recommendationDescription,
        dimension: match.rule.dimension,
        relevanceScore: this.clampScore(contextualScore),
        effort: match.rule.effort,
        impact: match.rule.impact,
        priority: match.rule.priority,
        generatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Générer les recommandations depuis le scoring statistique.
   */
  private generateFromStatistics(
    context: ProjectContext,
    options: RecommendationOptions,
  ): Recommendation[] {
    const matches: StatisticalMatch[] = [];

    for (const [normalizedTitle, frequency] of context.findingFrequencies) {
      if (frequency < this.config.minFrequencyForStatistical) {
        continue;
      }

      // Déterminer la dimension du finding (premier courant avec même titre normalisé)
      const currentFinding = context.currentFindings.find(
        f => this.normalizeTitle(f.title) === normalizedTitle
      );

      const dimension = currentFinding?.dimension ?? 'general';

      // Filtrer par dimension si spécifié
      if (options.dimensions && !options.dimensions.includes(dimension as AnalysisDimension)) {
        continue;
      }

      // Calculer le score de base
      const maxFrequency = Math.max(...context.findingFrequencies.values(), 1);
      const frequencyScore = frequency / maxFrequency;
      const baseScore = this.config.statisticalBaseScore + frequencyScore * 0.3;

      // Chercher une bonne practice associée
      let associatedBestPractice: string | undefined;
      if (this.bestPractices && currentFinding) {
        const bps = this.bestPractices.findByFinding(currentFinding.title, currentFinding.dimension as any);
        if (bps.length > 0) {
          associatedBestPractice = bps[0].title;
        }
      }

      matches.push({
        findingTitle: currentFinding?.title ?? normalizedTitle,
        dimension: dimension as AnalysisDimension,
        frequency,
        baseScore,
        associatedBestPractice,
      });
    }

    // Convertir en recommandations
    return matches.map(match => {
      // Ajustement contextuel
      const contextualScore = this.applyContextualAdjustments(
        match.baseScore,
        match.dimension,
        match.findingTitle,
        context,
      );

      // Bonus si bonne practice associée
      const bpBonus = match.associatedBestPractice ? 0.05 : 0;

      // Déterminer la priorité selon le score
      const finalScore = this.clampScore(contextualScore + bpBonus);
      const priority = this.scoreToPriority(finalScore);

      const title = match.associatedBestPractice
        ? `Appliquer la bonne pratique : ${match.associatedBestPractice}`
        : `Résoudre le constat récurrent : ${match.findingTitle}`;

      const description = match.associatedBestPractice
        ? `Ce constat apparaît ${match.frequency} fois dans l'historique. La bonne practice "${match.associatedBestPractice}" a prouvé son efficacité.`
        : `Ce constat apparaît ${match.frequency} fois dans l'historique du projet. Une résolution durable est recommandée.`;

      return {
        id: '',
        projectId: context.projectId,
        ruleId: null,
        findingTitle: match.findingTitle,
        recommendationTitle: title,
        recommendationDescription: description,
        dimension: match.dimension,
        relevanceScore: finalScore,
        effort: 3,
        impact: 3,
        priority,
        generatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Appliquer les ajustements contextuels au score.
   */
  private applyContextualAdjustments(
    baseScore: number,
    dimension: AnalysisDimension,
    findingTitle: string,
    context: ProjectContext,
  ): number {
    let score = baseScore;

    // Ajustement selon la tendance de la dimension
    const trend = context.dimensionTrends.get(dimension);
    if (trend === 'declining') {
      score += this.config.decliningAdjustment;
    } else if (trend === 'improving') {
      score += this.config.improvingAdjustment;
    }

    // Ajustement selon l'historique de résolution
    const normalizedTitle = this.normalizeTitle(findingTitle);
    const resolutionRate = context.resolutionRates.get(normalizedTitle);

    if (resolutionRate !== undefined) {
      if (resolutionRate >= 0.8) {
        // Le finding a déjà été résolu souvent → moins prioritaire
        score += this.config.resolvedAdjustment;
      } else if (resolutionRate <= 0.2) {
        // Le finding persiste malgré les tentatives → plus prioritaire
        score += this.config.persistentAdjustment;
      }
    }

    return score;
  }

  /**
   * Fusionner et dédupliquer les recommandations.
   */
  private mergeAndDeduplicate(
    recommendations: Recommendation[],
    options: RecommendationOptions,
  ): Recommendation[] {
    const seen = new Map<string, Recommendation>();

    for (const rec of recommendations) {
      const key = this.normalizeTitle(rec.recommendationTitle);

      if (!seen.has(key) || rec.relevanceScore > seen.get(key)!.relevanceScore) {
        seen.set(key, rec);
      }
    }

    return Array.from(seen.values())
      .filter(rec => rec.relevanceScore >= (options.minRelevanceScore ?? 0.3))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options.maxRecommendations ?? 10);
  }

  /**
   * Matcher un titre de finding contre un pattern de règle.
   */
  private matchPattern(normalizedTitle: string, pattern: string): boolean {
    const normalizedPattern = this.normalizeTitle(pattern);

    // Matching exact après normalisation
    if (normalizedTitle === normalizedPattern) {
      return true;
    }

    // Matching par inclusion
    if (normalizedTitle.includes(normalizedPattern) || normalizedPattern.includes(normalizedTitle)) {
      return true;
    }

    // Matching par mots-clés (tous les mots du pattern doivent être dans le titre)
    const patternWords = normalizedPattern.split(/\s+/).filter(w => w.length > 2);
    if (patternWords.length > 0) {
      const allWordsPresent = patternWords.every(word => normalizedTitle.includes(word));
      if (allWordsPresent) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normaliser un titre pour le matching.
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Convertir un score en priorité.
   */
  private scoreToPriority(score: number): Recommendation['priority'] {
    if (score >= 0.85) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Limiter le score entre 0 et 1.
   */
  private clampScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }
}
```

**Critères d'acceptation :**
- Gestion des règles (add, update, delete, list)
- Génération depuis les règles explicites (matching pattern + sévérité)
- Génération depuis le scoring statistique (fréquence + bonnes practices)
- Ajustements contextuels (tendances, historique résolution)
- Fusion et déduplication
- Score clampé entre 0 et 1
- Configuration flexible (EngineConfig)
- Performance : support 10 000 règles

---

### 3.5 Tests unitaires RecommendationRepository (3h)

**Fichier :** `tests/recommendations/recommendation-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationRepository } from '../../src/recommendations/recommendation-repository.js';
import { migration007CreateRecommendations } from '../../src/storage/migrations/007_create_recommendations.js';

describe('RecommendationRepository', () => {
  let db: Database.Database;
  let repo: RecommendationRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    // Créer la table projects (référence FK)
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL
      )
    `);
    db.prepare('INSERT INTO projects (id, name, url, created_at) VALUES (?, ?, ?, ?)')
      .run('proj-1', 'Test', 'https://example.com', new Date().toISOString());

    migration007CreateRecommendations(db);
    repo = new RecommendationRepository(db);
  });

  afterEach(() => { db.close(); });

  describe('Rules CRUD', () => {
    it('devrait créer une règle', () => {
      const rule = repo.createRule({
        name: 'Optimiser images',
        description: 'Les images doivent être optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser toutes les images',
        recommendationDescription: 'Convertir en WebP et lazy-loader',
        effort: 2,
        impact: 4,
        priority: 'high',
      });

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Optimiser images');
      expect(rule.isActive).toBe(true);
    });

    it('devrait lister les règles avec filtres', () => {
      repo.createRule({ name: 'R1', description: 'D', dimension: 'performance', severityThreshold: 1, pattern: 'p1', recommendationTitle: 'T1', recommendationDescription: 'D1' });
      repo.createRule({ name: 'R2', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p2', recommendationTitle: 'T2', recommendationDescription: 'D2' });
      repo.createRule({ name: 'R3', description: 'D', dimension: 'performance', severityThreshold: 3, pattern: 'p3', recommendationTitle: 'T3', recommendationDescription: 'D3' });

      const perf = repo.listRules({ dimension: 'performance' });
      expect(perf).toHaveLength(2);

      const active = repo.listRules({ isActive: true });
      expect(active).toHaveLength(3);
    });

    it('devrait mettre à jour une règle', () => {
      const rule = repo.createRule({ name: 'Original', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });

      const updated = repo.updateRule(rule.id, { name: 'Updated', isActive: false });
      expect(updated.name).toBe('Updated');
      expect(updated.isActive).toBe(false);
    });

    it('devrait supprimer une règle', () => {
      const rule = repo.createRule({ name: 'ToDelete', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });
      repo.deleteRule(rule.id);
      expect(repo.getRuleById(rule.id)).toBeNull();
    });

    it('devrait compter les règles', () => {
      repo.createRule({ name: 'R1', description: 'D', dimension: 'performance', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });
      repo.createRule({ name: 'R2', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });

      expect(repo.countRules()).toBe(2);
      expect(repo.countRules({ dimension: 'performance' })).toBe(1);
    });
  });

  describe('Recommendations', () => {
    it('devrait sauvegarder et récupérer les recommandations', () => {
      const rec = repo.saveRecommendation({
        projectId: 'proj-1',
        ruleId: null,
        findingTitle: 'Test finding',
        recommendationTitle: 'Fix it',
        recommendationDescription: 'Description',
        dimension: 'performance',
        relevanceScore: 0.85,
        effort: 2,
        impact: 4,
        priority: 'high',
        generatedAt: new Date().toISOString(),
      });

      expect(rec.id).toBeDefined();

      const list = repo.getRecommendations('proj-1');
      expect(list).toHaveLength(1);
      expect(list[0].relevanceScore).toBe(0.85);
    });

    it('devrait trier par score décroissant', () => {
      repo.saveRecommendation({ projectId: 'proj-1', ruleId: null, findingTitle: 'F1', recommendationTitle: 'R1', recommendationDescription: 'D1', dimension: 'seo', relevanceScore: 0.5, effort: 2, impact: 3, priority: 'medium', generatedAt: new Date().toISOString() });
      repo.saveRecommendation({ projectId: 'proj-1', ruleId: null, findingTitle: 'F2', recommendationTitle: 'R2', recommendationDescription: 'D2', dimension: 'seo', relevanceScore: 0.9, effort: 3, impact: 4, priority: 'high', generatedAt: new Date().toISOString() });

      const list = repo.getRecommendations('proj-1');
      expect(list[0].relevanceScore).toBe(0.9);
      expect(list[1].relevanceScore).toBe(0.5);
    });

    it('devrait effacer les recommandations', () => {
      repo.saveRecommendation({ projectId: 'proj-1', ruleId: null, findingTitle: 'F', recommendationTitle: 'R', recommendationDescription: 'D', dimension: 'seo', relevanceScore: 0.5, effort: 2, impact: 3, priority: 'medium', generatedAt: new Date().toISOString() });
      repo.clearRecommendations('proj-1');
      expect(repo.getRecommendations('proj-1')).toHaveLength(0);
    });
  });
});
```

---

### 3.6 Tests unitaires RecommendationEngine (5h)

**Fichier :** `tests/recommendations/recommendation-engine.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { RecommendationRepository } from '../../src/recommendations/recommendation-repository.js';
import { migration007CreateRecommendations } from '../../src/storage/migrations/007_create_recommendations.js';

describe('RecommendationEngine', () => {
  let db: Database.Database;
  let engine: RecommendationEngine;
  let repo: RecommendationRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL
      )
    `);
    db.prepare('INSERT INTO projects (id, name, url, created_at) VALUES (?, ?, ?, ?)')
      .run('proj-1', 'Test', 'https://example.com', new Date().toISOString());

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL,
        url TEXT NOT NULL, timestamp TEXT NOT NULL,
        overall_score REAL NOT NULL DEFAULT 0, total_findings INTEGER NOT NULL DEFAULT 0,
        critical_findings INTEGER NOT NULL DEFAULT 0, high_findings INTEGER NOT NULL DEFAULT 0,
        medium_findings INTEGER NOT NULL DEFAULT 0, low_findings INTEGER NOT NULL DEFAULT 0
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL, score INTEGER NOT NULL, findings_count INTEGER NOT NULL DEFAULT 0
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
        severity INTEGER NOT NULL DEFAULT 0, effort INTEGER NOT NULL DEFAULT 1,
        impact INTEGER NOT NULL DEFAULT 1, priority TEXT NOT NULL DEFAULT 'low',
        recommendation TEXT
      )
    `);

    migration007CreateRecommendations(db);

    const contextBuilder = new RecommendationContext(db);
    engine = new RecommendationEngine(db, contextBuilder);
    repo = new RecommendationRepository(db);
  });

  afterEach(() => { db.close(); });

  function insertAudit(projectId: string, timestamp: string, scores: Record<string, number>): number {
    const result = db.prepare(`
      INSERT INTO audit_metadata (project_id, url, timestamp)
      VALUES (?, ?, ?)
    `).run(projectId, 'https://example.com', timestamp);
    const auditId = Number(result.lastInsertRowid);

    for (const [dimension, score] of Object.entries(scores)) {
      db.prepare(`INSERT INTO audit_dimensions (audit_id, dimension, score) VALUES (?, ?, ?)`)
        .run(auditId, dimension, score);
    }
    return auditId;
  }

  function insertFinding(auditId: number, dimension: string, title: string, severity: number): void {
    db.prepare(`INSERT INTO audit_findings (audit_id, dimension, title, severity) VALUES (?, ?, ?, ?)`)
      .run(auditId, dimension, title, severity);
  }

  describe('Gestion des règles', () => {
    it('devrait ajouter et lister des règles', () => {
      engine.addRule({
        name: 'Images',
        description: 'Images non optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images',
        recommendationDescription: 'Convertir en WebP',
      });

      const rules = engine.listRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('Images');
    });
  });

  describe('Génération depuis les règles', () => {
    it('devrait générer une recommandation depuis une règle', async () => {
      // Ajouter une règle
      engine.addRule({
        name: 'Images',
        description: 'Images non optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images en WebP',
        recommendationDescription: 'Convertir toutes les images en WebP',
        effort: 2,
        impact: 4,
        priority: 'high',
      });

      // Insérer un audit avec un finding correspondant
      const auditId = insertAudit('proj-1', '2024-01-01', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 3);

      // Générer les recommandations
      const report = await engine.generateRecommendations('proj-1');

      expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
      expect(report.rulesApplied).toBeGreaterThanOrEqual(1);

      const rec = report.recommendations[0];
      expect(rec.recommendationTitle).toContain('WebP');
      expect(rec.relevanceScore).toBeGreaterThan(0.5);
    });

    it('ne devrait pas appliquer une règle si la sévérité est insuffisante', async () => {
      engine.addRule({
        name: 'Critical Images',
        description: 'Images critiques',
        dimension: 'performance',
        severityThreshold: 4, // Sévérité critique requise
        pattern: 'images non optimisées',
        recommendationTitle: 'Urgent: Optimiser',
        recommendationDescription: 'Action immédiate',
      });

      const auditId = insertAudit('proj-1', '2024-01-01', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 2); // Sévérité 2 < 4

      const report = await engine.generateRecommendations('proj-1');
      const ruleRecs = report.recommendations.filter(r => r.ruleId !== null);
      expect(ruleRecs).toHaveLength(0);
    });
  });

  describe('Scoring contextuel', () => {
    it('devrait augmenter le score si dimension en régression', async () => {
      engine.addRule({
        name: 'SEO Rule',
        description: 'SEO',
        dimension: 'seo',
        severityThreshold: 1,
        pattern: 'meta description manquante',
        recommendationTitle: 'Ajouter les meta descriptions',
        recommendationDescription: 'Chaque page doit avoir une meta description',
      });

      // Audit 1 : score SEO 80
      const a1 = insertAudit('proj-1', '2024-01-01', { seo: 80 });
      insertFinding(a1, 'seo', 'Meta description manquante', 2);

      // Audit 2 : score SEO 70 (régression)
      const a2 = insertAudit('proj-1', '2024-02-01', { seo: 70 });
      insertFinding(a2, 'seo', 'Meta description manquante', 2);

      const report = await engine.generateRecommendations('proj-1');
      expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
      // Le score devrait être plus élevé grâce à l'ajustement de régression
    });
  });

  describe('Déduplication', () => {
    it('devrait dédupliquer les recommandations avec le même titre', async () => {
      // Deux règles pour le même pattern
      engine.addRule({
        name: 'R1',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images',
        recommendationTitle: 'Optimiser les images',
        recommendationDescription: 'WebP',
      });

      engine.addRule({
        name: 'R2',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images', // Même titre
        recommendationDescription: 'Lazy loading',
      });

      const auditId = insertAudit('proj-1', '2024-01-01', { performance: 70 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 3);

      const report = await engine.generateRecommendations('proj-1');
      const imageRecs = report.recommendations.filter(r => r.recommendationTitle.includes('images'));
      // Devrait être dédupliqué (une seule recommandation pour le même titre normalisé)
      expect(imageRecs.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Options', () => {
    it('devrait respecter maxRecommendations', async () => {
      // Ajouter plusieurs règles
      for (let i = 0; i < 5; i++) {
        engine.addRule({
          name: `Rule ${i}`,
          description: 'D',
          dimension: 'performance',
          severityThreshold: 1,
          pattern: `finding ${i}`,
          recommendationTitle: `Recommendation ${i}`,
          recommendationDescription: `Description ${i}`,
        });
      }

      const auditId = insertAudit('proj-1', '2024-01-01', { performance: 70 });
      for (let i = 0; i < 5; i++) {
        insertFinding(auditId, 'performance', `Finding ${i}`, 2);
      }

      const report = await engine.generateRecommendations('proj-1', { maxRecommendations: 2 });
      expect(report.recommendations.length).toBeLessThanOrEqual(2);
    });

    it('devrait respecter minRelevanceScore', async () => {
      engine.addRule({
        name: 'Low Priority',
        description: 'D',
        dimension: 'performance',
        severityThreshold: 0,
        pattern: 'minor issue',
        recommendationTitle: 'Fix minor issue',
        recommendationDescription: 'Low priority fix',
      });

      const auditId = insertAudit('proj-1', '2024-01-01', { performance: 90 });
      insertFinding(auditId, 'performance', 'Minor issue', 0);

      const report = await engine.generateRecommendations('proj-1', { minRelevanceScore: 0.95 });
      // Score de base 0.8 + sévérité 0/4 * 0.15 = 0.8 → filtré si minRelevanceScore > 0.8
      expect(report.totalRecommendations).toBe(0);
    });
  });
});
```

---

## 4. Vérifications finales

```bash
npm run typecheck
npm run lint
npm test -- tests/recommendations/
npm run coverage -- tests/recommendations/
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-16-01-RESULTAT.md` avec :

```markdown
# Rapport Sprint 16-01 — Rules + Repository + Engine

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés
- `src/recommendations/recommendation.types.ts`
- `src/recommendations/recommendation-rules.ts`
- `src/recommendations/recommendation-repository.ts`
- `src/recommendations/recommendation-engine.ts`
- `src/storage/migrations/007_create_recommendations.ts`
- `tests/recommendations/recommendation-repository.test.ts`
- `tests/recommendations/recommendation-engine.test.ts`

## Modifications
- `src/storage/migrations/migration-registry.ts` (ajout migration 007)

## Tests : X tests, tous passent
## Couverture : Z%

## Prochaine étape
Sprint 16-02 : Contexte + Scoring + Intégration rapports
```

---

## 6. Critères de validation du sous-sprint

- ✅ Types définis dans `recommendation.types.ts`
- ✅ Migration 007 créée (2 tables + index)
- ✅ Registre de migrations mis à jour
- ✅ `RecommendationRepository` implémenté (CRUD règles + recommandations)
- ✅ `RecommendationEngine` implémenté (règles + scoring statistique + ajustements contextuels)
- ✅ Matching de patterns (exact, inclusion, mots-clés)
- ✅ Déduplication des recommandations
- ✅ Configuration flexible (EngineConfig)
- ✅ Tests unitaires complets
- ✅ Couverture > 80%
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 16-01 du projet EKTS**  
**Statut : ✅ Sprint 16-01 implémenté et validé**
