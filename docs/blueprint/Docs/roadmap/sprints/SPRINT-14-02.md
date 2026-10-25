# SPRINT-14-02 — Alert Manager et Chart Generator

**Sprint :** 14-02 sur 14 (Sous-sprint 2/3)  
**Durée :** 3 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Implémenter les modules de gestion des alertes et de génération de graphiques :
- **AlertManager** : Détection des régressions significatives (> 10 points) et création d'alertes
- **ChartGenerator** : Génération de graphiques d'évolution (export PNG/SVG)
- **Migration** : Création de la table `alerts` pour persister les alertes

Ces modules permettront de notifier les utilisateurs des problèmes détectés et de visualiser l'évolution des projets.

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 14-01 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que les modules timeline existent
ls src/timeline/
# Doit afficher : timeline-analyzer.ts, trend-detector.ts, timeline.types.ts
```

### 2.2 Documents à lire

- `SPRINT-14.md` (document parent)
- `SPRINT-14-01-RESULTAT.md` (résultats du sous-sprint 1)
- `docs/blueprint/Docs/04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` (schémas SQLite)
- `docs/blueprint/Docs/06-Security/11_POLITIQUE_PERMISSIONS_ET_SECURITE.md` (sécurité)

---

## 3. Tâches détaillées

### 3.1 Créer la migration pour la table alerts (3h)

**Fichier :** `src/storage/migrations/005_create_alerts_table.ts`

```typescript
import type { Database } from 'better-sqlite3';

export function migration005CreateAlertsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      audit_id_from INTEGER NOT NULL,
      audit_id_to INTEGER NOT NULL,
      dimension TEXT NOT NULL,
      score_before INTEGER NOT NULL,
      score_after INTEGER NOT NULL,
      regression_points INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (audit_id_from) REFERENCES audit_metadata(id),
      FOREIGN KEY (audit_id_to) REFERENCES audit_metadata(id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alerts_project_id
    ON alerts(project_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at
    ON alerts(created_at DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved
    ON alerts(resolved_at)
  `);
}
```

**Mettre à jour le registre des migrations :**

**Fichier :** `src/storage/migrations/migration-registry.ts`

Ajouter la nouvelle migration :
```typescript
import { migration005CreateAlertsTable } from './005_create_alerts_table.js';

export const migrations = [
  // ... migrations existantes
  {
    version: 5,
    name: 'create_alerts_table',
    up: migration005CreateAlertsTable,
  },
];
```

**Critères d'acceptation :**
- Migration exécutable sans erreur
- Table `alerts` créée avec tous les champs
- Index créés pour les performances
- Migration idempotente (IF NOT EXISTS)

---

### 3.2 Implémenter AlertRepository (4h)

**Fichier :** `src/storage/alert-repository.ts`

```typescript
import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Alert, CreateAlertInput, AlertFilters } from './types.js';

/**
 * Repository pour la gestion des alertes
 */
export class AlertRepository {
  constructor(private db: Database.Database) {}

  /**
   * Créer une nouvelle alerte
   */
  async create(input: CreateAlertInput): Promise<Alert> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO alerts (
        id, project_id, audit_id_from, audit_id_to, dimension,
        score_before, score_after, regression_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.projectId,
      input.auditIdFrom,
      input.auditIdTo,
      input.dimension,
      input.scoreBefore,
      input.scoreAfter,
      input.regressionPoints,
      now
    );

    return this.getById(id);
  }

  /**
   * Récupérer une alerte par ID
   */
  async getById(id: string): Promise<Alert | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM alerts WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Lister les alertes avec filtres
   */
  async list(filters: AlertFilters = {}): Promise<Alert[]> {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];

    if (filters.projectId) {
      query += ' AND project_id = ?';
      params.push(filters.projectId);
    }

    if (filters.resolved !== undefined) {
      if (filters.resolved) {
        query += ' AND resolved_at IS NOT NULL';
      } else {
        query += ' AND resolved_at IS NULL';
      }
    }

    if (filters.dimension) {
      query += ' AND dimension = ?';
      params.push(filters.dimension);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => this.mapRow(row));
  }

  /**
   * Marquer une alerte comme résolue
   */
  async markAsResolved(id: string): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE alerts SET resolved_at = ? WHERE id = ?
    `);

    stmt.run(now, id);
  }

  /**
   * Supprimer une alerte
   */
  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM alerts WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Mapper une ligne de base de données vers un objet Alert
   */
  private mapRow(row: any): Alert {
    return {
      id: row.id,
      projectId: row.project_id,
      auditIdFrom: row.audit_id_from,
      auditIdTo: row.audit_id_to,
      dimension: row.dimension,
      scoreBefore: row.score_before,
      scoreAfter: row.score_after,
      regressionPoints: row.regression_points,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    };
  }
}
```

**Ajouter les types dans `src/storage/types.ts` :**

```typescript
export interface Alert {
  id: string;
  projectId: string;
  auditIdFrom: number;
  auditIdTo: number;
  dimension: string;
  scoreBefore: number;
  scoreAfter: number;
  regressionPoints: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateAlertInput {
  projectId: string;
  auditIdFrom: number;
  auditIdTo: number;
  dimension: string;
  scoreBefore: number;
  scoreAfter: number;
  regressionPoints: number;
}

export interface AlertFilters {
  projectId?: string;
  resolved?: boolean;
  dimension?: string;
  limit?: number;
}
```

**Critères d'acceptation :**
- CRUD complet (create, getById, list, markAsResolved, delete)
- Filtres fonctionnels (projectId, resolved, dimension, limit)
- Mapping correct des types
- Gestion des cas limites (alerte inexistante)

---

### 3.3 Implémenter AlertManager (5h)

**Fichier :** `src/timeline/alert-manager.ts`

```typescript
import { AlertRepository } from '../storage/alert-repository.js';
import type { Alert, CreateAlertInput, AlertFilters } from '../storage/types.js';
import type { TrendReport, Regression } from './timeline.types.js';

export interface AlertManagerConfig {
  regressionThreshold: number; // Seuil de régression (défaut: 10)
}

/**
 * Gestionnaire des alertes de régression
 */
export class AlertManager {
  private alertRepo: AlertRepository;
  private config: AlertManagerConfig;

  constructor(alertRepo: AlertRepository, config?: Partial<AlertManagerConfig>) {
    this.alertRepo = alertRepo;
    this.config = {
      regressionThreshold: config?.regressionThreshold ?? 10,
    };
  }

  /**
   * Vérifier les régressions et créer des alertes si nécessaire
   */
  async checkAndCreateAlerts(report: TrendReport, projectId: string): Promise<Alert[]> {
    const createdAlerts: Alert[] = [];

    for (const [dimension, trend] of report.trends) {
      if (trend.direction === 'declining') {
        // Vérifier s'il y a une régression significative entre les 2 derniers audits
        const regression = await this.detectRegression(
          projectId,
          dimension,
          this.config.regressionThreshold
        );

        if (regression) {
          const alert = await this.createAlert(regression);
          createdAlerts.push(alert);
        }
      }
    }

    return createdAlerts;
  }

  /**
   * Récupérer les alertes actives (non résolues)
   */
  async getActiveAlerts(projectId?: string): Promise<Alert[]> {
    const filters: AlertFilters = {
      resolved: false,
    };

    if (projectId) {
      filters.projectId = projectId;
    }

    return this.alertRepo.list(filters);
  }

  /**
   * Récupérer toutes les alertes
   */
  async getAllAlerts(filters?: AlertFilters): Promise<Alert[]> {
    return this.alertRepo.list(filters);
  }

  /**
   * Marquer une alerte comme résolue
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.alertRepo.markAsResolved(alertId);
  }

  /**
   * Supprimer une alerte
   */
  async deleteAlert(alertId: string): Promise<void> {
    await this.alertRepo.delete(alertId);
  }

  /**
   * Détecter une régression significative entre les 2 derniers audits
   */
  private async detectRegression(
    projectId: string,
    dimension: string,
    threshold: number
  ): Promise<Regression | null> {
    // Récupérer les 2 derniers audits du projet
    const query = `
      SELECT am.id, am.timestamp, ad.dimension, ad.score
      FROM audit_metadata am
      JOIN audit_dimensions ad ON am.id = ad.audit_id
      WHERE am.project_id = ? AND ad.dimension = ?
      ORDER BY am.timestamp DESC
      LIMIT 2
    `;

    const stmt = this.alertRepo['db'].prepare(query);
    const rows = stmt.all(projectId, dimension) as any[];

    if (rows.length < 2) {
      return null;
    }

    const [latest, previous] = rows;
    const regressionPoints = previous.score - latest.score;

    if (regressionPoints >= threshold) {
      return {
        projectId,
        auditIdFrom: previous.id,
        auditIdTo: latest.id,
        dateFrom: new Date(previous.timestamp),
        dateTo: new Date(latest.timestamp),
        dimension: dimension as any,
        scoreBefore: previous.score,
        scoreAfter: latest.score,
        regressionPoints,
      };
    }

    return null;
  }

  /**
   * Créer une alerte à partir d'une régression
   */
  private async createAlert(regression: Regression): Promise<Alert> {
    const input: CreateAlertInput = {
      projectId: regression.projectId,
      auditIdFrom: regression.auditIdFrom,
      auditIdTo: regression.auditIdTo,
      dimension: regression.dimension,
      scoreBefore: regression.scoreBefore,
      scoreAfter: regression.scoreAfter,
      regressionPoints: regression.regressionPoints,
    };

    return this.alertRepo.create(input);
  }
}
```

**Critères d'acceptation :**
- Détection des régressions > seuil configurable
- Création d'alertes automatique
- Gestion des alertes (actives, résolues, toutes)
- Configuration flexible (seuil de régression)
- Intégration avec TrendReport

---

### 3.4 Implémenter ChartGenerator (6h)

**Fichier :** `src/timeline/chart-generator.ts`

```typescript
import type { TimelineAnalysis, DimensionTimeline } from './timeline.types.js';

export type ChartFormat = 'svg' | 'png';

export interface ChartOptions {
  width: number;
  height: number;
  title?: string;
  showLegend: boolean;
  showGrid: boolean;
}

/**
 * Générateur de graphiques pour la timeline
 */
export class ChartGenerator {
  private defaultOptions: ChartOptions = {
    width: 800,
    height: 400,
    showLegend: true,
    showGrid: true,
  };

  /**
   * Générer un graphique d'évolution pour toutes les dimensions
   */
  generateTimelineChart(
    analysis: TimelineAnalysis,
    format: ChartFormat = 'svg',
    options?: Partial<ChartOptions>
  ): string | Buffer {
    const opts = { ...this.defaultOptions, ...options };

    if (format === 'svg') {
      return this.generateSVG(analysis, opts);
    } else {
      throw new Error('PNG generation requires additional dependencies (sharp/canvas)');
    }
  }

  /**
   * Générer un graphique pour une dimension spécifique
   */
  generateDimensionChart(
    analysis: TimelineAnalysis,
    dimension: string,
    format: ChartFormat = 'svg',
    options?: Partial<ChartOptions>
  ): string | Buffer {
    const opts = { ...this.defaultOptions, ...options };
    const dimTimeline = analysis.dimensionScores.find(d => d.dimension === dimension);

    if (!dimTimeline) {
      throw new Error(`Dimension ${dimension} not found in analysis`);
    }

    if (format === 'svg') {
      return this.generateDimensionSVG(dimTimeline, opts);
    } else {
      throw new Error('PNG generation requires additional dependencies');
    }
  }

  /**
   * Générer un SVG complet avec toutes les dimensions
   */
  private generateSVG(analysis: TimelineAnalysis, opts: ChartOptions): string {
    const { width, height, showLegend, showGrid } = opts;
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const colors = {
      performance: '#3b82f6',
      accessibility: '#10b981',
      seo: '#f59e0b',
      ux: '#8b5cf6',
      content: '#ec4899',
    };

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .axis { stroke: #000; stroke-width: 1; }
    .grid { stroke: #e5e7eb; stroke-width: 0.5; }
    .line { fill: none; stroke-width: 2; }
    .point { stroke-width: 2; }
    .text { font-family: Arial, sans-serif; font-size: 12px; }
    .title { font-size: 16px; font-weight: bold; }
  </style>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="20" text-anchor="middle" class="text title">
    ${opts.title || `Timeline - ${analysis.projectName}`}
  </text>
`;

    // Grid
    if (showGrid) {
      for (let i = 0; i <= 10; i++) {
        const y = padding.top + (chartHeight / 10) * i;
        svg += `  <line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" class="grid"/>\n`;
      }
    }

    // Axes
    svg += `  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" class="axis"/>
  <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" class="axis"/>
  
  <!-- Y-axis labels -->
`;

    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (chartHeight / 10) * i;
      const value = 100 - i * 10;
      svg += `  <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" class="text">${value}</text>\n`;
    }

    // Lines for each dimension
    for (const dimTimeline of analysis.dimensionScores) {
      const color = colors[dimTimeline.dimension as keyof typeof colors] || '#000';
      const points = dimTimeline.scores;

      if (points.length === 0) continue;

      // Calculate points
      const pathPoints = points.map((point, index) => {
        const x = padding.left + (chartWidth / Math.max(points.length - 1, 1)) * index;
        const y = padding.top + chartHeight - (point.score / 100) * chartHeight;
        return { x, y };
      });

      // Draw line
      const pathData = pathPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

      svg += `  <path d="${pathData}" class="line" stroke="${color}"/>\n`;

      // Draw points
      for (const p of pathPoints) {
        svg += `  <circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" class="point" stroke="${color}"/>\n`;
      }
    }

    // Legend
    if (showLegend) {
      const legendX = padding.left + 10;
      let legendY = padding.top + 10;

      for (const dimTimeline of analysis.dimensionScores) {
        const color = colors[dimTimeline.dimension as keyof typeof colors] || '#000';
        svg += `  <rect x="${legendX}" y="${legendY - 8}" width="16" height="16" fill="${color}"/>
  <text x="${legendX + 24}" y="${legendY + 4}" class="text">${dimTimeline.dimension}</text>\n`;
        legendY += 24;
      }
    }

    svg += `</svg>`;

    return svg;
  }

  /**
   * Générer un SVG pour une dimension spécifique
   */
  private generateDimensionSVG(dimTimeline: DimensionTimeline, opts: ChartOptions): string {
    const { width, height, showGrid } = opts;
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const colors: Record<string, string> = {
      performance: '#3b82f6',
      accessibility: '#10b981',
      seo: '#f59e0b',
      ux: '#8b5cf6',
      content: '#ec4899',
    };

    const color = colors[dimTimeline.dimension] || '#000';
    const points = dimTimeline.scores;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .axis { stroke: #000; stroke-width: 1; }
    .grid { stroke: #e5e7eb; stroke-width: 0.5; }
    .line { fill: none; stroke-width: 2; }
    .point { stroke-width: 2; }
    .text { font-family: Arial, sans-serif; font-size: 12px; }
    .title { font-size: 16px; font-weight: bold; }
  </style>
  
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <text x="${width / 2}" y="20" text-anchor="middle" class="text title">
    ${dimTimeline.dimension} - ${dimTimeline.trend.description}
  </text>
`;

    // Grid
    if (showGrid) {
      for (let i = 0; i <= 10; i++) {
        const y = padding.top + (chartHeight / 10) * i;
        svg += `  <line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" class="grid"/>\n`;
      }
    }

    // Axes
    svg += `  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" class="axis"/>
  <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" class="axis"/>
`;

    // Y-axis labels
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (chartHeight / 10) * i;
      const value = 100 - i * 10;
      svg += `  <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" class="text">${value}</text>\n`;
    }

    // Line
    if (points.length > 0) {
      const pathPoints = points.map((point, index) => {
        const x = padding.left + (chartWidth / Math.max(points.length - 1, 1)) * index;
        const y = padding.top + chartHeight - (point.score / 100) * chartHeight;
        return { x, y };
      });

      const pathData = pathPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

      svg += `  <path d="${pathData}" class="line" stroke="${color}"/>\n`;

      // Points
      for (const p of pathPoints) {
        svg += `  <circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" class="point" stroke="${color}"/>\n`;
      }
    }

    svg += `</svg>`;

    return svg;
  }
}
```

**Critères d'acceptation :**
- Génération de SVG pour timeline complète
- Génération de SVG pour dimension spécifique
- Couleurs distinctes par dimension
- Légende et grille configurables
- Gestion des cas limites (pas de données)
- Format SVG valide et lisible

---

### 3.5 Tests unitaires AlertManager (4h)

**Fichier :** `tests/timeline/alert-manager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { AlertManager } from '../../src/timeline/alert-manager.js';
import { AlertRepository } from '../../src/storage/alert-repository.js';

describe('AlertManager', () => {
  let db: Database.Database;
  let alertRepo: AlertRepository;
  let alertManager: AlertManager;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    
    // Créer la table alerts
    db.exec(`
      CREATE TABLE alerts (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        audit_id_from INTEGER NOT NULL,
        audit_id_to INTEGER NOT NULL,
        dimension TEXT NOT NULL,
        score_before INTEGER NOT NULL,
        score_after INTEGER NOT NULL,
        regression_points INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    alertRepo = new AlertRepository(db);
    alertManager = new AlertManager(alertRepo);
  });

  it('devrait créer une alerte', async () => {
    const alert = await alertRepo.create({
      projectId: 'test-project',
      auditIdFrom: 1,
      auditIdTo: 2,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    expect(alert.id).toBeDefined();
    expect(alert.projectId).toBe('test-project');
    expect(alert.dimension).toBe('performance');
    expect(alert.regressionPoints).toBe(15);
    expect(alert.resolvedAt).toBeNull();
  });

  it('devrait récupérer les alertes actives', async () => {
    // Créer 2 alertes
    await alertRepo.create({
      projectId: 'project-1',
      auditIdFrom: 1,
      auditIdTo: 2,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    await alertRepo.create({
      projectId: 'project-1',
      auditIdFrom: 2,
      auditIdTo: 3,
      dimension: 'seo',
      scoreBefore: 85,
      scoreAfter: 70,
      regressionPoints: 15,
    });

    const activeAlerts = await alertManager.getActiveAlerts();
    expect(activeAlerts).toHaveLength(2);
  });

  it('devrait marquer une alerte comme résolue', async () => {
    const alert = await alertRepo.create({
      projectId: 'test-project',
      auditIdFrom: 1,
      auditIdTo: 2,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    await alertManager.resolveAlert(alert.id);

    const resolved = await alertRepo.getById(alert.id);
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it('devrait filtrer les alertes par projet', async () => {
    await alertRepo.create({
      projectId: 'project-1',
      auditIdFrom: 1,
      auditIdTo: 2,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    await alertRepo.create({
      projectId: 'project-2',
      auditIdFrom: 1,
      auditIdTo: 2,
      dimension: 'seo',
      scoreBefore: 85,
      scoreAfter: 70,
      regressionPoints: 15,
    });

    const project1Alerts = await alertManager.getActiveAlerts('project-1');
    expect(project1Alerts).toHaveLength(1);
    expect(project1Alerts[0].projectId).toBe('project-1');
  });
});
```

**Critères d'acceptance :**
- Tests CRUD alertes
- Tests filtrage par projet
- Tests résolution d'alertes
- Couverture > 80%

---

### 3.6 Tests unitaires ChartGenerator (4h)

**Fichier :** `tests/timeline/chart-generator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ChartGenerator } from '../../src/timeline/chart-generator.js';
import type { TimelineAnalysis } from '../../src/timeline/timeline.types.js';

describe('ChartGenerator', () => {
  let chartGenerator: ChartGenerator;

  beforeEach(() => {
    chartGenerator = new ChartGenerator();
  });

  const mockAnalysis: TimelineAnalysis = {
    projectId: 'test',
    projectName: 'Test Project',
    audits: [],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalAudits: 3,
    dimensionScores: [
      {
        dimension: 'performance',
        scores: [
          { auditId: 1, date: new Date('2024-01-01'), score: 80, findingsCount: 5 },
          { auditId: 2, date: new Date('2024-01-15'), score: 85, findingsCount: 4 },
          { auditId: 3, date: new Date('2024-01-31'), score: 90, findingsCount: 3 },
        ],
        trend: {
          direction: 'improving',
          slope: 2.5,
          confidence: 0.95,
          description: 'Amélioration continue',
        },
        averageScore: 85,
        minScore: 80,
        maxScore: 90,
      },
    ],
  };

  it('devrait générer un SVG valide', () => {
    const svg = chartGenerator.generateTimelineChart(mockAnalysis, 'svg');
    
    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Test Project');
  });

  it('devrait générer un graphique pour une dimension spécifique', () => {
    const svg = chartGenerator.generateDimensionChart(
      mockAnalysis,
      'performance',
      'svg'
    );
    
    expect(svg).toContain('performance');
    expect(svg).toContain('Amélioration continue');
  });

  it('devrait lancer une erreur pour une dimension inexistante', () => {
    expect(() => {
      chartGenerator.generateDimensionChart(mockAnalysis, 'nonexistent', 'svg');
    }).toThrow('Dimension nonexistent not found');
  });

  it('devrait respecter les options de personnalisation', () => {
    const svg = chartGenerator.generateTimelineChart(mockAnalysis, 'svg', {
      width: 1000,
      height: 600,
      title: 'Custom Title',
    });
    
    expect(svg).toContain('width="1000"');
    expect(svg).toContain('height="600"');
    expect(svg).toContain('Custom Title');
  });
});
```

**Critères d'acceptation :**
- Tests génération SVG
- Tests options de personnalisation
- Tests gestion d'erreurs
- Couverture > 80%

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

Créer `SPRINT-14-02-RESULTAT.md` avec :

```markdown
# Rapport Sprint 14-02 — Alert Manager et Chart Generator

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés

- `src/storage/migrations/005_create_alerts_table.ts`
- `src/storage/alert-repository.ts`
- `src/timeline/alert-manager.ts`
- `src/timeline/chart-generator.ts`
- `tests/timeline/alert-manager.test.ts`
- `tests/timeline/chart-generator.test.ts`

## Modifications

- `src/storage/migrations/migration-registry.ts` (ajout migration 005)
- `src/storage/types.ts` (ajout types Alert, CreateAlertInput, AlertFilters)

## Tests exécutés

- AlertManager : X tests, tous passent
- ChartGenerator : Y tests, tous passent
- Couverture : Z%

## Décisions prises

1. [Décision 1]
2. [Décision 2]

## Problèmes rencontrés

1. [Problème 1] → [Solution]
2. [Problème 2] → [Solution]

## Prochaine étape

Sprint 14-03 : CLI + MCP + Tests + Documentation
```

---

## 6. Critères de validation du sous-sprint

- ✅ Migration 005 créée et fonctionnelle
- ✅ Table `alerts` créée avec tous les champs
- ✅ `AlertRepository` implémenté (CRUD complet)
- ✅ `AlertManager` implémenté (détection régressions, gestion alertes)
- ✅ `ChartGenerator` implémenté (SVG pour timeline et dimensions)
- ✅ Types ajoutés dans `types.ts`
- ✅ Tests unitaires complets
- ✅ Couverture de tests > 80%
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 14-02 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 14-02 prêt pour implémentation**
