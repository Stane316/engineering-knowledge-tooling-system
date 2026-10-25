# SPRINT-14-01 — Timeline et Détection de Tendances

**Sprint :** 14-01 sur 14 (Sous-sprint 1/3)  
**Durée :** 3 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Implémenter les modules fondamentaux pour le suivi temporel :
- **TimelineAnalyzer** : Agrégation et analyse des audits d'un projet dans le temps
- **TrendDetector** : Détection automatique des tendances (amélioration, régression, stable)

Ces modules formeront la base sur laquelle les sous-sprints suivants construiront les alertes, graphiques et interfaces.

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que tu es sur la bonne branche
git checkout agent/sprint-14

# Vérifier que le Sprint 13 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que les tables existent
npm run db:inspect
# Doit afficher : projects, audit_metadata, audit_dimensions
```

### 2.2 Documents à lire

- `SPRINT-14.md` (document parent)
- `docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` (architecture globale)
- `docs/blueprint/Docs/04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` (schémas SQLite)
- `src/storage/audit-repository.ts` (pour comprendre la structure des audits)

---

## 3. Tâches détaillées

### 3.1 Créer les types TypeScript (2h)

**Fichier :** `src/timeline/timeline.types.ts`

```typescript
import type { AuditMetadata } from '../storage/types.js';
import type { Dimension } from '../analysis/types.js';

/**
 * Analyse de la timeline d'un projet
 */
export interface TimelineAnalysis {
  projectId: string;
  projectName: string;
  audits: AuditMetadata[];
  startDate: Date;
  endDate: Date;
  totalAudits: number;
  dimensionScores: DimensionTimeline[];
}

/**
 * Timeline d'une dimension spécifique
 */
export interface DimensionTimeline {
  dimension: Dimension;
  scores: Array<{
    auditId: number;
    date: Date;
    score: number;
    findingsCount: number;
  }>;
  trend: Trend;
  averageScore: number;
  minScore: number;
  maxScore: number;
}

/**
 * Tendance détectée
 */
export interface Trend {
  direction: 'improving' | 'declining' | 'stable';
  slope: number; // Pente de régression linéaire
  confidence: number; // 0-1, qualité de la régression
  description: string;
}

/**
 * Rapport de tendances
 */
export interface TrendReport {
  projectId: string;
  windowSize: number;
  trends: Map<Dimension, Trend>;
  overallTrend: Trend;
  recommendations: string[];
}

/**
 * Configuration de détection de tendances
 */
export interface TrendConfig {
  windowSize: number; // Nombre d'audits pour calculer la tendance
  improvementThreshold: number; // Pente minimale pour "amélioration"
  regressionThreshold: number; // Pente maximale pour "régression"
}

/**
 * Régression détectée
 */
export interface Regression {
  projectId: string;
  auditIdFrom: number;
  auditIdTo: number;
  dateFrom: Date;
  dateTo: Date;
  dimension: Dimension;
  scoreBefore: number;
  scoreAfter: number;
  regressionPoints: number;
}
```

**Critères d'acceptation :**
- Tous les types nécessaires sont définis
- Les imports sont corrects
- TypeScript compile sans erreur

---

### 3.2 Implémenter TimelineAnalyzer (6h)

**Fichier :** `src/timeline/timeline-analyzer.ts`

```typescript
import type { Database } from 'better-sqlite3';
import type { AuditMetadata } from '../storage/types.js';
import type { Dimension } from '../analysis/types.js';
import type { TimelineAnalysis, DimensionTimeline } from './timeline.types.js';
import { AuditRepository } from '../storage/audit-repository.js';
import { ProjectRepository } from '../data/repositories/project-repository.js';

/**
 * Analyse la timeline d'un projet
 */
export class TimelineAnalyzer {
  private auditRepo: AuditRepository;
  private projectRepo: ProjectRepository;

  constructor(db: Database.Database) {
    this.auditRepo = new AuditRepository(db);
    this.projectRepo = new ProjectRepository(db);
  }

  /**
   * Analyse complète de la timeline d'un projet
   */
  async analyze(projectId: string): Promise<TimelineAnalysis> {
    // 1. Récupérer le projet
    const project = await this.projectRepo.getById(projectId);
    if (!project) {
      throw new Error(`Projet ${projectId} introuvable`);
    }

    // 2. Récupérer tous les audits du projet
    const audits = await this.auditRepo.list({ projectId });
    if (audits.length === 0) {
      throw new Error(`Aucun audit trouvé pour le projet ${projectId}`);
    }

    // 3. Trier par date croissante
    const sortedAudits = audits.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 4. Construire la timeline par dimension
    const dimensionScores = await this.buildDimensionTimelines(sortedAudits);

    // 5. Construire l'analyse complète
    return {
      projectId,
      projectName: project.name,
      audits: sortedAudits,
      startDate: new Date(sortedAudits[0].timestamp),
      endDate: new Date(sortedAudits[sortedAudits.length - 1].timestamp),
      totalAudits: sortedAudits.length,
      dimensionScores,
    };
  }

  /**
   * Récupérer les audits dans une plage de dates
   */
  async getAuditsByDateRange(
    projectId: string,
    start: Date,
    end: Date
  ): Promise<AuditMetadata[]> {
    const audits = await this.auditRepo.list({ projectId });
    return audits.filter(audit => {
      const auditDate = new Date(audit.timestamp);
      return auditDate >= start && auditDate <= end;
    });
  }

  /**
   * Construire les timelines pour chaque dimension
   */
  private async buildDimensionTimelines(
    audits: AuditMetadata[]
  ): Promise<DimensionTimeline[]> {
    const dimensions: Dimension[] = [
      'performance',
      'accessibility',
      'seo',
      'ux',
      'content',
    ];

    const timelines: DimensionTimeline[] = [];

    for (const dimension of dimensions) {
      const scores = audits.map(audit => ({
        auditId: audit.id,
        date: new Date(audit.timestamp),
        score: audit.scores[dimension],
        findingsCount: audit.findingsCounts[dimension],
      }));

      const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      const minScore = Math.min(...scores.map(s => s.score));
      const maxScore = Math.max(...scores.map(s => s.score));

      timelines.push({
        dimension,
        scores,
        trend: {
          direction: 'stable',
          slope: 0,
          confidence: 0,
          description: 'À calculer par TrendDetector',
        },
        averageScore: avgScore,
        minScore,
        maxScore,
      });
    }

    return timelines;
  }
}
```

**Critères d'acceptation :**
- La classe `TimelineAnalyzer` est exportée
- La méthode `analyze()` retourne une `TimelineAnalysis` complète
- La méthode `getAuditsByDateRange()` filtre correctement
- Les audits sont triés par date
- Les statistiques (min, max, moyenne) sont calculées
- Gestion des erreurs (projet introuvable, aucun audit)

---

### 3.3 Implémenter TrendDetector (6h)

**Fichier :** `src/timeline/trend-detector.ts`

```typescript
import type { Dimension } from '../analysis/types.js';
import type {
  TimelineAnalysis,
  DimensionTimeline,
  Trend,
  TrendReport,
  TrendConfig,
} from './timeline.types.js';

/**
 * Détecte les tendances dans les timelines
 */
export class TrendDetector {
  private config: TrendConfig;

  constructor(config?: Partial<TrendConfig>) {
    this.config = {
      windowSize: config?.windowSize ?? 5,
      improvementThreshold: config?.improvementThreshold ?? 2,
      regressionThreshold: config?.regressionThreshold ?? -2,
    };
  }

  /**
   * Détecter les tendances pour toutes les dimensions
   */
  detectTrends(timeline: TimelineAnalysis): TrendReport {
    const trends = new Map<Dimension, Trend>();

    for (const dimTimeline of timeline.dimensionScores) {
      const trend = this.calculateTrend(dimTimeline);
      trends.set(dimTimeline.dimension, trend);
    }

    // Calculer la tendance globale (moyenne des pentes)
    const slopes = Array.from(trends.values()).map(t => t.slope);
    const avgSlope = slopes.reduce((sum, s) => sum + s, 0) / slopes.length;
    const overallTrend = this.classifyTrend(avgSlope, 0.5);

    // Générer des recommandations
    const recommendations = this.generateRecommendations(trends);

    return {
      projectId: timeline.projectId,
      windowSize: this.config.windowSize,
      trends,
      overallTrend,
      recommendations,
    };
  }

  /**
   * Calculer la tendance pour une dimension
   */
  private calculateTrend(dimTimeline: DimensionTimeline): Trend {
    const scores = dimTimeline.scores;
    if (scores.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        confidence: 0,
        description: 'Pas assez de données pour détecter une tendance',
      };
    }

    // Utiliser les N derniers audits (fenêtre glissante)
    const recentScores = scores.slice(-this.config.windowSize);
    if (recentScores.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        confidence: 0,
        description: 'Pas assez de données récentes',
      };
    }

    // Calculer la régression linéaire
    const { slope, rSquared } = this.linearRegression(recentScores);

    return this.classifyTrend(slope, rSquared);
  }

  /**
   * Régression linéaire simple
   * Retourne la pente et le R²
   */
  private linearRegression(
    points: Array<{ score: number }>
  ): { slope: number; rSquared: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, rSquared: 0 };

    const xValues = points.map((_, i) => i);
    const yValues = points.map(p => p.score);

    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += (xValues[i] - xMean) ** 2;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Calcul du R² (coefficient de détermination)
    const yPredicted = xValues.map(x => yMean + slope * (x - xMean));
    const ssRes = yValues.reduce(
      (sum, y, i) => sum + (y - yPredicted[i]) ** 2,
      0
    );
    const ssTot = yValues.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, rSquared };
  }

  /**
   * Classifier la tendance selon la pente
   */
  private classifyTrend(slope: number, confidence: number): Trend {
    let direction: 'improving' | 'declining' | 'stable';
    let description: string;

    if (slope > this.config.improvementThreshold) {
      direction = 'improving';
      description = `Amélioration détectée (pente: ${slope.toFixed(2)})`;
    } else if (slope < this.config.regressionThreshold) {
      direction = 'declining';
      description = `Régression détectée (pente: ${slope.toFixed(2)})`;
    } else {
      direction = 'stable';
      description = `Stable (pente: ${slope.toFixed(2)})`;
    }

    return {
      direction,
      slope,
      confidence,
      description,
    };
  }

  /**
   * Générer des recommandations basées sur les tendances
   */
  private generateRecommendations(trends: Map<Dimension, Trend>): string[] {
    const recommendations: string[] = [];

    for (const [dimension, trend] of trends) {
      if (trend.direction === 'declining') {
        recommendations.push(
          `⚠️ ${dimension}: Régression détectée. Investiguer les changements récents.`
        );
      } else if (trend.direction === 'improving') {
        recommendations.push(
          `✅ ${dimension}: Amélioration continue. Maintenir les bonnes pratiques.`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('📊 Toutes les dimensions sont stables.');
    }

    return recommendations;
  }
}
```

**Critères d'acceptation :**
- La classe `TrendDetector` est exportée
- La méthode `detectTrends()` retourne un `TrendReport` complet
- La régression linéaire est correctement implémentée
- Les tendances sont classifiées selon les seuils configurables
- Les recommandations sont générées
- Gestion des cas limites (< 2 audits, < 2 audits récents)
- Configuration flexible (windowSize, thresholds)

---

### 3.4 Tests unitaires TimelineAnalyzer (4h)

**Fichier :** `tests/timeline/timeline-analyzer.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { TimelineAnalyzer } from '../../src/timeline/timeline-analyzer.js';
import { ProjectRepository } from '../../src/data/repositories/project-repository.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';

describe('TimelineAnalyzer', () => {
  let db: Database.Database;
  let analyzer: TimelineAnalyzer;
  let projectRepo: ProjectRepository;
  let auditRepo: AuditRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    
    // Initialiser les schémas
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    db.exec(`
      CREATE TABLE audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        scores TEXT NOT NULL,
        findings_counts TEXT NOT NULL,
        metadata TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    analyzer = new TimelineAnalyzer(db);
    projectRepo = new ProjectRepository(db);
    auditRepo = new AuditRepository(db);
  });

  it('devrait analyser une timeline avec plusieurs audits', async () => {
    // Créer un projet
    const project = await projectRepo.create({
      name: 'Test Project',
      description: 'Test',
      url: 'https://example.com',
    });

    // Créer 5 audits avec des scores variés
    const audits = [
      { performance: 70, accessibility: 80, seo: 75, ux: 85, content: 90 },
      { performance: 75, accessibility: 82, seo: 78, ux: 87, content: 92 },
      { performance: 80, accessibility: 85, seo: 80, ux: 90, content: 95 },
      { performance: 85, accessibility: 88, seo: 82, ux: 92, content: 97 },
      { performance: 90, accessibility: 90, seo: 85, ux: 95, content: 98 },
    ];

    for (let i = 0; i < audits.length; i++) {
      await auditRepo.create({
        projectId: project.id,
        url: 'https://example.com',
        timestamp: new Date(Date.now() - (audits.length - i) * 86400000).toISOString(),
        scores: audits[i],
        findingsCounts: {
          performance: 5,
          accessibility: 3,
          seo: 4,
          ux: 2,
          content: 1,
        },
        metadata: {},
      });
    }

    // Analyser
    const analysis = await analyzer.analyze(project.id);

    // Vérifications
    expect(analysis.projectId).toBe(project.id);
    expect(analysis.projectName).toBe('Test Project');
    expect(analysis.totalAudits).toBe(5);
    expect(analysis.dimensionScores).toHaveLength(5);

    // Vérifier la timeline performance
    const perfTimeline = analysis.dimensionScores.find(
      d => d.dimension === 'performance'
    );
    expect(perfTimeline).toBeDefined();
    expect(perfTimeline!.scores).toHaveLength(5);
    expect(perfTimeline!.averageScore).toBe(80);
    expect(perfTimeline!.minScore).toBe(70);
    expect(perfTimeline!.maxScore).toBe(90);
  });

  it('devrait lancer une erreur si le projet n\'existe pas', async () => {
    await expect(analyzer.analyze('non-existent')).rejects.toThrow(
      'Projet non-existent introuvable'
    );
  });

  it('devrait lancer une erreur si aucun audit n\'existe', async () => {
    const project = await projectRepo.create({
      name: 'Empty Project',
      description: 'Test',
      url: 'https://example.com',
    });

    await expect(analyzer.analyze(project.id)).rejects.toThrow(
      `Aucun audit trouvé pour le projet ${project.id}`
    );
  });

  it('devrait filtrer les audits par plage de dates', async () => {
    const project = await projectRepo.create({
      name: 'Test Project',
      description: 'Test',
      url: 'https://example.com',
    });

    // Créer 3 audits à différentes dates
    const dates = [
      new Date('2026-01-01'),
      new Date('2026-01-15'),
      new Date('2026-02-01'),
    ];

    for (const date of dates) {
      await auditRepo.create({
        projectId: project.id,
        url: 'https://example.com',
        timestamp: date.toISOString(),
        scores: { performance: 80, accessibility: 80, seo: 80, ux: 80, content: 80 },
        findingsCounts: { performance: 5, accessibility: 5, seo: 5, ux: 5, content: 5 },
        metadata: {},
      });
    }

    // Filtrer janvier 2026
    const filtered = await analyzer.getAuditsByDateRange(
      project.id,
      new Date('2026-01-01'),
      new Date('2026-01-31')
    );

    expect(filtered).toHaveLength(2);
  });
});
```

**Critères d'acceptation :**
- Tous les tests passent
- Couverture > 80%
- Tests des cas limites (projet inexistant, aucun audit)
- Tests du filtrage par dates

---

### 3.5 Tests unitaires TrendDetector (4h)

**Fichier :** `tests/timeline/trend-detector.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { TrendDetector } from '../../src/timeline/trend-detector.js';
import type { TimelineAnalysis } from '../../src/timeline/timeline.types.js';

describe('TrendDetector', () => {
  it('devrait détecter une tendance d\'amélioration', () => {
    const detector = new TrendDetector();

    const timeline: TimelineAnalysis = {
      projectId: 'test',
      projectName: 'Test',
      audits: [],
      startDate: new Date(),
      endDate: new Date(),
      totalAudits: 5,
      dimensionScores: [
        {
          dimension: 'performance',
          scores: [
            { auditId: 1, date: new Date(), score: 60, findingsCount: 10 },
            { auditId: 2, date: new Date(), score: 65, findingsCount: 9 },
            { auditId: 3, date: new Date(), score: 70, findingsCount: 8 },
            { auditId: 4, date: new Date(), score: 75, findingsCount: 7 },
            { auditId: 5, date: new Date(), score: 80, findingsCount: 6 },
          ],
          trend: { direction: 'stable', slope: 0, confidence: 0, description: '' },
          averageScore: 70,
          minScore: 60,
          maxScore: 80,
        },
      ],
    };

    const report = detector.detectTrends(timeline);
    const perfTrend = report.trends.get('performance');

    expect(perfTrend).toBeDefined();
    expect(perfTrend!.direction).toBe('improving');
    expect(perfTrend!.slope).toBeGreaterThan(2);
  });

  it('devrait détecter une tendance de régression', () => {
    const detector = new TrendDetector();

    const timeline: TimelineAnalysis = {
      projectId: 'test',
      projectName: 'Test',
      audits: [],
      startDate: new Date(),
      endDate: new Date(),
      totalAudits: 5,
      dimensionScores: [
        {
          dimension: 'accessibility',
          scores: [
            { auditId: 1, date: new Date(), score: 90, findingsCount: 2 },
            { auditId: 2, date: new Date(), score: 85, findingsCount: 3 },
            { auditId: 3, date: new Date(), score: 80, findingsCount: 4 },
            { auditId: 4, date: new Date(), score: 75, findingsCount: 5 },
            { auditId: 5, date: new Date(), score: 70, findingsCount: 6 },
          ],
          trend: { direction: 'stable', slope: 0, confidence: 0, description: '' },
          averageScore: 80,
          minScore: 70,
          maxScore: 90,
        },
      ],
    };

    const report = detector.detectTrends(timeline);
    const a11yTrend = report.trends.get('accessibility');

    expect(a11yTrend).toBeDefined();
    expect(a11yTrend!.direction).toBe('declining');
    expect(a11yTrend!.slope).toBeLessThan(-2);
  });

  it('devrait détecter une tendance stable', () => {
    const detector = new TrendDetector();

    const timeline: TimelineAnalysis = {
      projectId: 'test',
      projectName: 'Test',
      audits: [],
      startDate: new Date(),
      endDate: new Date(),
      totalAudits: 5,
      dimensionScores: [
        {
          dimension: 'seo',
          scores: [
            { auditId: 1, date: new Date(), score: 80, findingsCount: 5 },
            { auditId: 2, date: new Date(), score: 81, findingsCount: 5 },
            { auditId: 3, date: new Date(), score: 79, findingsCount: 5 },
            { auditId: 4, date: new Date(), score: 80, findingsCount: 5 },
            { auditId: 5, date: new Date(), score: 81, findingsCount: 5 },
          ],
          trend: { direction: 'stable', slope: 0, confidence: 0, description: '' },
          averageScore: 80.2,
          minScore: 79,
          maxScore: 81,
        },
      ],
    };

    const report = detector.detectTrends(timeline);
    const seoTrend = report.trends.get('seo');

    expect(seoTrend).toBeDefined();
    expect(seoTrend!.direction).toBe('stable');
    expect(Math.abs(seoTrend!.slope)).toBeLessThanOrEqual(2);
  });

  it('devrait gérer le cas avec moins de 2 audits', () => {
    const detector = new TrendDetector();

    const timeline: TimelineAnalysis = {
      projectId: 'test',
      projectName: 'Test',
      audits: [],
      startDate: new Date(),
      endDate: new Date(),
      totalAudits: 1,
      dimensionScores: [
        {
          dimension: 'ux',
          scores: [
            { auditId: 1, date: new Date(), score: 85, findingsCount: 3 },
          ],
          trend: { direction: 'stable', slope: 0, confidence: 0, description: '' },
          averageScore: 85,
          minScore: 85,
          maxScore: 85,
        },
      ],
    };

    const report = detector.detectTrends(timeline);
    const uxTrend = report.trends.get('ux');

    expect(uxTrend).toBeDefined();
    expect(uxTrend!.direction).toBe('stable');
    expect(uxTrend!.confidence).toBe(0);
  });

  it('devrait permettre une configuration personnalisée', () => {
    const detector = new TrendDetector({
      windowSize: 3,
      improvementThreshold: 5,
      regressionThreshold: -5,
    });

    const timeline: TimelineAnalysis = {
      projectId: 'test',
      projectName: 'Test',
      audits: [],
      startDate: new Date(),
      endDate: new Date(),
      totalAudits: 3,
      dimensionScores: [
        {
          dimension: 'content',
          scores: [
            { auditId: 1, date: new Date(), score: 70, findingsCount: 8 },
            { auditId: 2, date: new Date(), score: 73, findingsCount: 7 },
            { auditId: 3, date: new Date(), score: 76, findingsCount: 6 },
          ],
          trend: { direction: 'stable', slope: 0, confidence: 0, description: '' },
          averageScore: 73,
          minScore: 70,
          maxScore: 76,
        },
      ],
    };

    const report = detector.detectTrends(timeline);
    
    expect(report.windowSize).toBe(3);
  });

  it('devrait générer des recommandations', () => {
    const detector = new TrendDetector();

    const timeline: TimelineAnalysis = {
      projectId: 'test',
      projectName: 'Test',
      audits: [],
      startDate: new Date(),
      endDate: new Date(),
      totalAudits: 5,
      dimensionScores: [
        {
          dimension: 'performance',
          scores: [
            { auditId: 1, date: new Date(), score: 90, findingsCount: 2 },
            { auditId: 2, date: new Date(), score: 85, findingsCount: 3 },
            { auditId: 3, date: new Date(), score: 80, findingsCount: 4 },
            { auditId: 4, date: new Date(), score: 75, findingsCount: 5 },
            { auditId: 5, date: new Date(), score: 70, findingsCount: 6 },
          ],
          trend: { direction: 'stable', slope: 0, confidence: 0, description: '' },
          averageScore: 80,
          minScore: 70,
          maxScore: 90,
        },
      ],
    };

    const report = detector.detectTrends(timeline);

    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations[0]).toContain('performance');
    expect(report.recommendations[0]).toContain('Régression');
  });
});
```

**Critères d'acceptation :**
- Tous les tests passent
- Couverture > 80%
- Tests des 3 directions (amélioration, régression, stable)
- Test du cas limite (< 2 audits)
- Test de la configuration personnalisée
- Test des recommandations

---

## 4. Vérifications finales

### 4.1 Compilation et lint

```bash
npm run typecheck
npm run lint
```

Doit passer sans erreur.

### 4.2 Tests

```bash
npm test -- tests/timeline/
```

Tous les tests doivent passer.

### 4.3 Couverture

```bash
npm run coverage -- tests/timeline/
```

Couverture doit être > 80%.

---

## 5. Rapport de sous-sprint

Créer `SPRINT-14-01-RESULTAT.md` avec :

```markdown
# Rapport Sprint 14-01 — Timeline et Détection de Tendances

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés

- `src/timeline/timeline.types.ts`
- `src/timeline/timeline-analyzer.ts`
- `src/timeline/trend-detector.ts`
- `tests/timeline/timeline-analyzer.test.ts`
- `tests/timeline/trend-detector.test.ts`

## Tests exécutés

- TimelineAnalyzer : X tests, tous passent
- TrendDetector : Y tests, tous passent
- Couverture : Z%

## Décisions prises

1. [Décision 1]
2. [Décision 2]

## Problèmes rencontrés

1. [Problème 1] → [Solution]
2. [Problème 2] → [Solution]

## Prochaine étape

Sprint 14-02 : Alert Manager + Chart Generator
```

---

## 6. Critères de validation du sous-sprint

- ✅ Types TypeScript définis
- ✅ `TimelineAnalyzer` implémenté et testé
- ✅ `TrendDetector` implémenté et testé
- ✅ Régression linéaire correctement calculée
- ✅ Tendances classifiées (amélioration, régression, stable)
- ✅ Recommandations générées
- ✅ Gestion des cas limites
- ✅ Couverture de tests > 80%
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 14-01 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 14-01 prêt pour implémentation**
