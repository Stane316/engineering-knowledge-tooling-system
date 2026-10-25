# SPRINT-16-02 — RecommendationContext, Scoring et Intégration Rapports

**Sprint :** 16-02 sur 16 (Sous-sprint 2/3)  
**Durée :** 3 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Implémenter le constructeur de contexte et l'intégration dans les rapports :
- **RecommendationContext** : Construction du contexte projet (historique, tendances, bonnes practices, fréquences)
- **Scoring contextuel complet** : Ajustements basés sur les tendances et l'historique de résolution
- **Intégration Markdown** : Section recommandations dans `MarkdownReportGenerator`
- **Intégration PDF** : Section recommandations dans `PdfReportGenerator`

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 16-01 est terminé
npm run verify

# Vérifier les modules 16-01
ls src/recommendations/
# Doit afficher : recommendation.types.ts, recommendation-repository.ts, recommendation-engine.ts
```

### 2.2 Documents à lire

- `SPRINT-16.md` (document parent)
- `SPRINT-16-01-RESULTAT.md` (résultats du sous-sprint 1)
- `src/reports/markdown-generator.ts` (générateur Markdown existant)
- `src/reports/pdf-generator.ts` (générateur PDF existant)
- `src/reports/types.ts` (types des rapports)

---

## 3. Tâches détaillées

### 3.1 Implémenter RecommendationContext (7h)

**Fichier :** `src/recommendations/recommendation-context.ts`

```typescript
import type { Database } from 'better-sqlite3';

import type { AnalysisDimension, Severity } from '../analysis/types.js';
import type { BestPracticeService } from '../best-practices/best-practice-service.js';
import type { ProjectContext } from './recommendation.types.js';

/**
 * Constructeur du contexte projet pour le scoring (Sprint 16).
 *
 * Collecte et agrège :
 * - Les findings courants (dernier audit)
 * - Les fréquences des findings dans l'historique
 * - Les tendances par dimension (via TimelineAnalyzer / TrendDetector du Sprint 14)
 * - Les taux de résolution des findings
 * - Les bonnes practices associées (via BestPracticeService du Sprint 15)
 */
export class RecommendationContext {
  private bestPractices?: BestPracticeService;

  constructor(
    private readonly db: Database.Database,
    bestPractices?: BestPracticeService,
  ) {
    this.bestPractices = bestPractices;
  }

  /**
   * Construire le contexte complet d'un projet.
   */
  async buildContext(projectId: string): Promise<ProjectContext> {
    // 1. Récupérer les audits du projet
    const audits = this.getProjectAudits(projectId);

    // 2. Extraire les findings courants (dernier audit)
    const currentFindings = audits.length > 0
      ? this.getAuditFindings(audits[audits.length - 1].id)
      : [];

    // 3. Calculer les fréquences des findings
    const findingFrequencies = this.calculateFindingFrequencies(audits);

    // 4. Calculer les tendances par dimension
    const dimensionTrends = this.calculateDimensionTrends(projectId);

    // 5. Calculer les taux de résolution
    const resolutionRates = this.calculateResolutionRates(audits);

    // 6. Récupérer les bonnes practices associées
    const associatedBestPractices = this.findAssociatedBestPractices(currentFindings);

    return {
      projectId,
      totalAudits: audits.length,
      currentFindings: currentFindings.map(f => ({
        title: f.title,
        dimension: f.dimension as AnalysisDimension,
        severity: f.severity as Severity,
        priority: f.priority as any,
      })),
      findingFrequencies,
      dimensionTrends,
      resolutionRates,
      associatedBestPractices,
    };
  }

  /**
   * Récupérer les audits d'un projet (triés par date, le plus récent en dernier).
   */
  private getProjectAudits(projectId: string): Array<{ id: number; timestamp: string }> {
    const stmt = this.db.prepare(`
      SELECT id, timestamp FROM audit_metadata
      WHERE project_id = ?
      ORDER BY timestamp ASC
    `);

    return stmt.all(projectId) as Array<{ id: number; timestamp: string }>;
  }

  /**
   * Récupérer les findings d'un audit.
   */
  private getAuditFindings(auditId: number): Array<{
    title: string;
    dimension: string;
    severity: number;
    priority: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT title, dimension, severity, priority
      FROM audit_findings WHERE audit_id = ?
    `);

    return stmt.all(auditId) as Array<{
      title: string;
      dimension: string;
      severity: number;
      priority: string;
    }>;
  }

  /**
   * Calculer les fréquences des findings dans l'historique.
   * Retourne une Map<titre normalisé, count>.
   */
  private calculateFindingFrequencies(
    audits: Array<{ id: number; timestamp: string }>,
  ): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const audit of audits) {
      const findings = this.getAuditFindings(audit.id);

      for (const finding of findings) {
        const normalized = this.normalizeTitle(finding.title);
        frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
      }
    }

    return frequencies;
  }

  /**
   * Calculer les tendances par dimension.
   * Compare le score de la dimension entre le premier et le dernier audit.
   *
   * Simplification : on compare les deux derniers audits pour chaque dimension.
   * Si seulement 1 audit ou pas de scores : 'stable'.
   */
  private calculateDimensionTrends(
    projectId: string,
  ): Map<AnalysisDimension, 'improving' | 'declining' | 'stable'> {
    const trends = new Map<AnalysisDimension, 'improving' | 'declining' | 'stable'>();
    const dimensions: AnalysisDimension[] = ['performance', 'accessibility', 'seo', 'ux', 'content'];

    // Récupérer les 2 derniers audits avec leurs scores par dimension
    const recentAudits = this.db.prepare(`
      SELECT am.id, am.timestamp
      FROM audit_metadata am
      WHERE am.project_id = ?
      ORDER BY am.timestamp DESC
      LIMIT 2
    `).all(projectId) as Array<{ id: number; timestamp: string }>;

    if (recentAudits.length < 2) {
      // Pas assez d'audits pour détecter une tendance
      for (const dim of dimensions) {
        trends.set(dim, 'stable');
      }
      return trends;
    }

    const [latest, previous] = recentAudits;

    for (const dim of dimensions) {
      const latestScore = this.getDimensionScore(latest.id, dim);
      const previousScore = this.getDimensionScore(previous.id, dim);

      if (latestScore === null || previousScore === null) {
        trends.set(dim, 'stable');
        continue;
      }

      const diff = latestScore - previousScore;
      if (diff >= 5) {
        trends.set(dim, 'improving');
      } else if (diff <= -5) {
        trends.set(dim, 'declining');
      } else {
        trends.set(dim, 'stable');
      }
    }

    return trends;
  }

  /**
   * Récupérer le score d'une dimension pour un audit.
   */
  private getDimensionScore(auditId: number, dimension: AnalysisDimension): number | null {
    const row = this.db.prepare(`
      SELECT score FROM audit_dimensions
      WHERE audit_id = ? AND dimension = ?
    `).get(auditId, dimension) as { score: number } | undefined;

    return row ? row.score : null;
  }

  /**
   * Calculer les taux de résolution des findings.
   * Un finding est "résolu" s'il disparaît entre 2 audits consécutifs.
   * Le taux = nombre de résolutions / nombre d'apparitions.
   */
  private calculateResolutionRates(
    audits: Array<{ id: number; timestamp: string }>,
  ): Map<string, number> {
    const rates = new Map<string, number>();

    if (audits.length < 2) return rates;

    // Pour chaque finding normalisé : compter apparitions et résolutions
    const appearances = new Map<string, number>();
    const resolutions = new Map<string, number>();

    for (let i = 0; i < audits.length - 1; i++) {
      const currentFindings = this.getAuditFindings(audits[i].id);
      const nextFindings = this.getAuditFindings(audits[i + 1].id);

      const nextTitles = new Set(
        nextFindings.map(f => this.normalizeTitle(f.title))
      );

      for (const finding of currentFindings) {
        const normalized = this.normalizeTitle(finding.title);
        appearances.set(normalized, (appearances.get(normalized) ?? 0) + 1);

        if (!nextTitles.has(normalized)) {
          resolutions.set(normalized, (resolutions.get(normalized) ?? 0) + 1);
        }
      }
    }

    // Calculer les taux
    for (const [title, count] of appearances) {
      const resolved = resolutions.get(title) ?? 0;
      rates.set(title, resolved / count);
    }

    return rates;
  }

  /**
   * Trouver les bonnes practices associées aux findings courants.
   */
  private findAssociatedBestPractices(
    currentFindings: Array<{ title: string; dimension: string }>,
  ): Map<string, string[]> {
    const associations = new Map<string, string[]>();

    if (!this.bestPractices) return associations;

    for (const finding of currentFindings) {
      try {
        const bps = this.bestPractices.findByFinding(
          finding.title,
          finding.dimension as AnalysisDimension,
        );

        if (bps.length > 0) {
          associations.set(
            finding.title,
            bps.map(bp => bp.title),
          );
        }
      } catch {
        // Silencieux : si le module BP n'est pas disponible
      }
    }

    return associations;
  }

  /**
   * Normaliser un titre de finding.
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

**Critères d'acceptation :**
- `buildContext()` retourne un `ProjectContext` complet
- Findings courants extraits du dernier audit
- Fréquences calculées sur tout l'historique
- Tendances détectées par comparaison des 2 derniers audits (seuil ±5 points)
- Taux de résolution calculés (résolutions / apparitions)
- Bonnes practices associées récupérées via `BestPracticeService`
- Gestion des cas limites (0 audit, 1 audit, pas de findings)

---

### 3.2 Tests unitaires RecommendationContext (4h)

**Fichier :** `tests/recommendations/recommendation-context.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';

describe('RecommendationContext', () => {
  let db: Database.Database;
  let contextBuilder: RecommendationContext;

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

    contextBuilder = new RecommendationContext(db);
  });

  afterEach(() => { db.close(); });

  function insertAudit(projectId: string, timestamp: string, scores: Record<string, number>): number {
    const result = db.prepare(`
      INSERT INTO audit_metadata (project_id, url, timestamp) VALUES (?, ?, ?)
    `).run(projectId, 'https://example.com', timestamp);
    const auditId = Number(result.lastInsertRowid);

    for (const [dim, score] of Object.entries(scores)) {
      db.prepare('INSERT INTO audit_dimensions (audit_id, dimension, score) VALUES (?, ?, ?)')
        .run(auditId, dim, score);
    }
    return auditId;
  }

  function insertFinding(auditId: number, dim: string, title: string, severity: number): void {
    db.prepare('INSERT INTO audit_findings (audit_id, dimension, title, severity) VALUES (?, ?, ?, ?)')
      .run(auditId, dim, title, severity);
  }

  it('devrait retourner un contexte vide pour 0 audit', async () => {
    const ctx = await contextBuilder.buildContext('proj-1');
    expect(ctx.totalAudits).toBe(0);
    expect(ctx.currentFindings).toHaveLength(0);
    expect(ctx.findingFrequencies.size).toBe(0);
  });

  it('devrait extraire les findings du dernier audit', async () => {
    const a1 = insertAudit('proj-1', '2024-01-01', { performance: 80 });
    insertFinding(a1, 'performance', 'Images lourdes', 2);

    const a2 = insertAudit('proj-1', '2024-02-01', { performance: 75 });
    insertFinding(a2, 'performance', 'Cache non configuré', 3);
    insertFinding(a2, 'seo', 'Meta manquante', 1);

    const ctx = await contextBuilder.buildContext('proj-1');
    expect(ctx.currentFindings).toHaveLength(2);
    expect(ctx.currentFindings[0].title).toBe('Cache non configuré');
  });

  it('devrait calculer les fréquences des findings', async () => {
    const a1 = insertAudit('proj-1', '2024-01-01', { performance: 80 });
    insertFinding(a1, 'performance', 'Images non optimisées', 2);
    insertFinding(a1, 'seo', 'Meta manquante', 1);

    const a2 = insertAudit('proj-1', '2024-02-01', { performance: 75 });
    insertFinding(a2, 'performance', 'Images non optimisées', 2);
    insertFinding(a2, 'seo', 'Meta manquante', 1);
    insertFinding(a2, 'performance', 'Cache non configuré', 3);

    const ctx = await contextBuilder.buildContext('proj-1');
    expect(ctx.findingFrequencies.get('images non optimisees')).toBe(2);
    expect(ctx.findingFrequencies.get('meta manquante')).toBe(2);
    expect(ctx.findingFrequencies.get('cache non configure')).toBe(1);
  });

  it('devrait détecter une tendance en régression', async () => {
    insertAudit('proj-1', '2024-01-01', { performance: 80, seo: 90 });
    insertAudit('proj-1', '2024-02-01', { performance: 70, seo: 85 });

    const ctx = await contextBuilder.buildContext('proj-1');
    expect(ctx.dimensionTrends.get('performance')).toBe('declining');
    expect(ctx.dimensionTrends.get('seo')).toBe('declining');
  });

  it('devrait détecter une tendance en amélioration', async () => {
    insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertAudit('proj-1', '2024-02-01', { performance: 80 });

    const ctx = await contextBuilder.buildContext('proj-1');
    expect(ctx.dimensionTrends.get('performance')).toBe('improving');
  });

  it('devrait calculer les taux de résolution', async () => {
    // Audit 1 : finding présent
    const a1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(a1, 'performance', 'Images non optimisées', 2);

    // Audit 2 : finding résolu (disparu)
    insertAudit('proj-1', '2024-02-01', { performance: 85 });

    // Audit 3 : finding revenu
    const a3 = insertAudit('proj-1', '2024-03-01', { performance: 75 });
    insertFinding(a3, 'performance', 'Images non optimisées', 2);

    // Audit 4 : finding résolu à nouveau
    insertAudit('proj-1', '2024-04-01', { performance: 88 });

    const ctx = await contextBuilder.buildContext('proj-1');
    // Le finding apparaît dans audit 1, disparaît dans 2 → résolu
    // Apparaît dans audit 3, disparaît dans 4 → résolu
    // 2 résolutions / 2 apparitions = taux 1.0
    const rate = ctx.resolutionRates.get('images non optimisees');
    expect(rate).toBeDefined();
    expect(rate!).toBeGreaterThan(0);
  });

  it('devrait retourner stable si un seul audit', async () => {
    insertAudit('proj-1', '2024-01-01', { performance: 80 });

    const ctx = await contextBuilder.buildContext('proj-1');
    expect(ctx.dimensionTrends.get('performance')).toBe('stable');
  });
});
```

**Critères d'acceptance :**
- Tests contexte vide (0 audit)
- Tests findings courants (dernier audit)
- Tests fréquences
- Tests tendances (régression, amélioration, stable)
- Tests taux de résolution
- Couverture > 85%

---

### 3.3 Intégrer les recommandations dans les rapports Markdown (4h)

**Modifier `src/reports/markdown-generator.ts` :**

Ajouter une méthode `generateRecommendationsSection` et l'appeler dans la génération du rapport :

```typescript
// Ajouter dans la classe MarkdownReportGenerator :

/**
 * Générer la section recommandations du rapport.
 */
private async generateRecommendationsSection(
  report: AnalysisReport,
  projectId?: string,
): Promise<string> {
  if (!projectId || !this.recommendationEngine) {
    return '';
  }

  try {
    const recReport = await this.recommendationEngine.generateRecommendations(projectId, {
      maxRecommendations: 5,
      minRelevanceScore: 0.5,
    });

    if (recReport.recommendations.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('## Recommandations contextuelles\n');
    lines.push(`> ${recReport.recommendations.length} recommandation(s) générée(s) en ${recReport.durationMs}ms\n`);

    for (let i = 0; i < recReport.recommendations.length; i++) {
      const rec = recReport.recommendations[i];
      const scorePercent = (rec.relevanceScore * 100).toFixed(0);
      const effortStars = '⭐'.repeat(rec.effort);
      const impactStars = '💥'.repeat(rec.impact);

      lines.push(`### ${i + 1}. ${rec.recommendationTitle}\n`);
      lines.push(`**Pertinence :** ${scorePercent}% | **Priorité :** ${rec.priority} | **Effort :** ${effortStars} | **Impact :** ${impactStars}\n`);
      lines.push(`${rec.recommendationDescription}\n`);

      if (rec.findingTitle) {
        lines.push(`*Constat associé : ${rec.findingTitle}*\n`);
      }

      lines.push('---\n');
    }

    return lines.join('\n');
  } catch {
    // Silencieux : les recommandations sont optionnelles
    return '';
  }
}
```

**Modifier la méthode `generate` pour inclure la section recommandations :**

```typescript
// Dans la méthode generate() existante, ajouter à la fin :
const recommendationsSection = await this.generateRecommendationsSection(report, projectId);
if (recommendationsSection) {
  markdown += '\n' + recommendationsSection;
}
```

**Critères d'acceptation :**
- Section recommandations générée en fin de rapport
- Format Markdown lisible (titre, score, priorité, effort, impact)
- Section optionnelle (vide si pas de recommandations ou pas de projectId)
- Gestion d'erreurs silencieuse (recommandations = bonus, pas bloquant)

---

### 3.4 Intégrer les recommandations dans les rapports PDF (3h)

**Modifier `src/reports/pdf-generator.ts` :**

Même approche que pour Markdown : ajouter une section optionnelle.

```typescript
// Ajouter dans la classe PdfReportGenerator :

/**
 * Générer la section recommandations du PDF.
 */
private async generateRecommendationsHtml(
  report: AnalysisReport,
  projectId?: string,
): Promise<string> {
  if (!projectId || !this.recommendationEngine) {
    return '';
  }

  try {
    const recReport = await this.recommendationEngine.generateRecommendations(projectId, {
      maxRecommendations: 5,
      minRelevanceScore: 0.5,
    });

    if (recReport.recommendations.length === 0) {
      return '';
    }

    const items = recReport.recommendations.map((rec, i) => {
      const scorePercent = (rec.relevanceScore * 100).toFixed(0);
      const priorityColor = this.getPriorityColor(rec.priority);

      return `
        <div style="margin-bottom: 16px; padding: 12px; border-left: 4px solid ${priorityColor}; background: #f9fafb;">
          <h3 style="margin: 0 0 8px 0; color: #111827;">${i + 1}. ${this.escapeHtml(rec.recommendationTitle)}</h3>
          <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">${this.escapeHtml(rec.recommendationDescription)}</p>
          <div style="font-size: 12px; color: #6b7280;">
            <span style="color: ${priorityColor}; font-weight: bold;">${rec.priority.toUpperCase()}</span> ·
            Pertinence : ${scorePercent}% ·
            Effort : ${rec.effort}/5 ·
            Impact : ${rec.impact}/5
          </div>
          ${rec.findingTitle ? `<div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Constat : ${this.escapeHtml(rec.findingTitle)}</div>` : ''}
        </div>
      `;
    }).join('\n');

    return `
      <div style="page-break-before: always; margin-top: 32px;">
        <h2 style="color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
          Recommandations contextuelles
        </h2>
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 16px;">
          ${recReport.recommendations.length} recommandation(s) générée(s) en ${recReport.durationMs}ms
        </p>
        ${items}
      </div>
    `;
  } catch {
    return '';
  }
}

private getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    case 'low': return '#059669';
    default: return '#6b7280';
  }
}
```

**Critères d'acceptation :**
- Section recommandations générée en PDF (nouvelle page)
- Style HTML lisible (couleurs par priorité, espacement)
- HTML échappé (pas d'injection)
- Section optionnelle (vide si pas de recommandations)
- Gestion d'erreurs silencieuse

---

### 3.5 Tests d'intégration rapports (2h)

**Fichier :** `tests/reports/recommendations-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { migration007CreateRecommendations } from '../../src/storage/migrations/007_create_recommendations.js';

describe('Recommandations dans les rapports', () => {
  let db: Database.Database;
  let engine: RecommendationEngine;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL)
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
  });

  afterEach(() => { db.close(); });

  it('devrait générer des recommandations pour un rapport Markdown', async () => {
    // Ajouter une règle
    engine.addRule({
      name: 'Images',
      description: 'Optimisation images',
      dimension: 'performance',
      severityThreshold: 2,
      pattern: 'images non optimisées',
      recommendationTitle: 'Optimiser les images',
      recommendationDescription: 'Convertir en WebP et lazy-loader',
      effort: 2,
      impact: 4,
      priority: 'high',
    });

    // Insérer un audit avec finding
    const auditResult = db.prepare(`
      INSERT INTO audit_metadata (project_id, url, timestamp) VALUES (?, ?, ?)
    `).run('proj-1', 'https://example.com', '2024-01-01');
    const auditId = Number(auditResult.lastInsertRowid);

    db.prepare('INSERT INTO audit_dimensions (audit_id, dimension, score) VALUES (?, ?, ?)')
      .run(auditId, 'performance', 70);

    db.prepare('INSERT INTO audit_findings (audit_id, dimension, title, severity) VALUES (?, ?, ?, ?)')
      .run(auditId, 'performance', 'Images non optimisées', 3);

    // Générer les recommandations
    const report = await engine.generateRecommendations('proj-1', {
      maxRecommendations: 5,
    });

    expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
    expect(report.recommendations[0].recommendationTitle).toContain('images');
  });
});
```

---

## 4. Vérifications finales

```bash
npm run typecheck
npm run lint
npm test -- tests/recommendations/ tests/reports/
npm run coverage -- tests/recommendations/
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-16-02-RESULTAT.md` avec :

```markdown
# Rapport Sprint 16-02 — Context + Scoring + Rapports

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés
- `src/recommendations/recommendation-context.ts`
- `tests/recommendations/recommendation-context.test.ts`
- `tests/reports/recommendations-integration.test.ts`

## Modifications
- `src/reports/markdown-generator.ts` (section recommandations)
- `src/reports/pdf-generator.ts` (section recommandations)

## Tests : X tests, tous passent
## Couverture : Z%

## Prochaine étape
Sprint 16-03 : CLI + MCP + Tests intégration + Documentation
```

---

## 6. Critères de validation du sous-sprint

- ✅ `RecommendationContext` implémenté (findings, fréquences, tendances, résolutions, BP)
- ✅ Tendances détectées (seuil ±5 points entre 2 derniers audits)
- ✅ Taux de résolution calculés
- ✅ Bonnes practices associées récupérées
- ✅ Section recommandations dans les rapports Markdown
- ✅ Section recommandations dans les rapports PDF
- ✅ Gestion d'erreurs silencieuse
- ✅ Tests unitaires complets
- ✅ Couverture > 80%
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 16-02 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 16-02 prêt pour implémentation**
