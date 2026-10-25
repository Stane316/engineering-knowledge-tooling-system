# SPRINT-14-03 — CLI, MCP, Tests d'intégration et Documentation

**Sprint :** 14-03 sur 14 (Sous-sprint 3/3)  
**Durée :** 3 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Exposer les fonctionnalités de suivi temporel aux utilisateurs :
- **CLI** : Commande `ekts timeline` avec sous-commandes
- **MCP** : Outil `get_timeline` pour les agents IA
- **Tests d'intégration** : Vérification du fonctionnement de bout en bout
- **Documentation** : Guide utilisateur et mise à jour des références API
- **Rapport final** : SPRINT-14-RESULTAT.md

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 14-02 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que tous les modules timeline existent
ls src/timeline/
# Doit afficher : timeline-analyzer.ts, trend-detector.ts, alert-manager.ts, chart-generator.ts, timeline.types.ts
```

### 2.2 Documents à lire

- `SPRINT-14.md` (document parent)
- `SPRINT-14-01-RESULTAT.md` (résultats du sous-sprint 1)
- `SPRINT-14-02-RESULTAT.md` (résultats du sous-sprint 2)
- `docs/blueprint/Docs/06-Security/06_MCP_SECURITY_GUARDRAILS.md` (sécurité MCP)
- `docs/blueprint/Docs/05-Creative-Engineering/13_CLI_GUIDE.md` (conventions CLI)

---

## 3. Tâches détaillées

### 3.1 Implémenter la commande CLI `ekts timeline` (6h)

**Fichier :** `src/cli/commands/timeline.ts`

```typescript
import { Command } from 'commander';
import { TimelineAnalyzer } from '../../timeline/timeline-analyzer.js';
import { TrendDetector } from '../../timeline/trend-detector.js';
import { AlertManager } from '../../timeline/alert-manager.js';
import { ChartGenerator } from '../../timeline/chart-generator.js';
import { AuditRepository } from '../../storage/audit-repository.js';
import { ProjectRepository } from '../../storage/project-repository.js';
import { AlertRepository } from '../../storage/alert-repository.js';
import { getDatabase } from '../../storage/database.js';
import { writeFile } from 'node:fs/promises';
import { renderTable } from '../utils/table.js';

export function registerTimelineCommand(program: Command): void {
  const timeline = program
    .command('timeline')
    .description('Analyser l\'évolution temporelle des audits');

  // ekts timeline analyze [projectId]
  timeline
    .command('analyze [projectId]')
    .description('Analyser la timeline d\'un projet (ou tous les projets)')
    .option('--start <date>', 'Date de début (YYYY-MM-DD)')
    .option('--end <date>', 'Date de fin (YYYY-MM-DD)')
    .option('--min-audits <n>', 'Minimum d\'audits requis', '2')
    .action(async (projectId, options) => {
      const db = getDatabase();
      const auditRepo = new AuditRepository(db);
      const projectRepo = new ProjectRepository(db);
      const analyzer = new TimelineAnalyzer(auditRepo);

      try {
        if (projectId) {
          // Analyser un projet spécifique
          const analysis = await analyzer.analyzeProject(projectId, {
            startDate: options.start ? new Date(options.start) : undefined,
            endDate: options.end ? new Date(options.end) : undefined,
            minAudits: parseInt(options.minAudits),
          });

          if (!analysis) {
            console.log(`Aucune analyse disponible pour le projet ${projectId}`);
            return;
          }

          displayAnalysis(analysis);
        } else {
          // Analyser tous les projets
          const projects = await projectRepo.list();
          
          for (const project of projects) {
            const analysis = await analyzer.analyzeProject(project.id, {
              startDate: options.start ? new Date(options.start) : undefined,
              endDate: options.end ? new Date(options.end) : undefined,
              minAudits: parseInt(options.minAudits),
            });

            if (analysis) {
              console.log(`\n=== ${project.name} ===`);
              displayAnalysis(analysis);
            }
          }
        }
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts timeline trends [projectId]
  timeline
    .command('trends [projectId]')
    .description('Détecter les tendances d\'évolution')
    .option('--lookback <days>', 'Période de référence (jours)', '90')
    .action(async (projectId, options) => {
      const db = getDatabase();
      const auditRepo = new AuditRepository(db);
      const projectRepo = new ProjectRepository(db);
      const trendDetector = new TrendDetector(auditRepo);

      try {
        if (projectId) {
          const report = await trendDetector.analyzeTrends(projectId, {
            lookbackDays: parseInt(options.lookback),
          });
          displayTrends(report);
        } else {
          const projects = await projectRepo.list();
          for (const project of projects) {
            const report = await trendDetector.analyzeTrends(project.id, {
              lookbackDays: parseInt(options.lookback),
            });
            console.log(`\n=== ${project.name} ===`);
            displayTrends(report);
          }
        }
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts timeline alerts [projectId]
  timeline
    .command('alerts [projectId]')
    .description('Gérer les alertes de régression')
    .option('--all', 'Afficher toutes les alertes (incluant résolues)')
    .option('--resolve <id>', 'Marquer une alerte comme résolue')
    .option('--threshold <n>', 'Seuil de régression (points)', '10')
    .action(async (projectId, options) => {
      const db = getDatabase();
      const alertRepo = new AlertRepository(db);
      const alertManager = new AlertManager(alertRepo, {
        regressionThreshold: parseInt(options.threshold),
      });

      try {
        if (options.resolve) {
          await alertManager.resolveAlert(options.resolve);
          console.log(`Alerte ${options.resolve} marquée comme résolue`);
          return;
        }

        const alerts = options.all
          ? await alertManager.getAllAlerts({ projectId })
          : await alertManager.getActiveAlerts(projectId);

        if (alerts.length === 0) {
          console.log('Aucune alerte');
          return;
        }

        displayAlerts(alerts);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts timeline chart [projectId]
  timeline
    .command('chart [projectId]')
    .description('Générer un graphique d\'évolution')
    .option('--format <type>', 'Format de sortie (svg|png)', 'svg')
    .option('--output <file>', 'Fichier de sortie', 'timeline.svg')
    .option('--dimension <name>', 'Dimension spécifique')
    .option('--width <n>', 'Largeur du graphique', '800')
    .option('--height <n>', 'Hauteur du graphique', '400')
    .action(async (projectId, options) => {
      if (!projectId) {
        console.error('Veuillez spécifier un projectId');
        process.exit(1);
      }

      const db = getDatabase();
      const auditRepo = new AuditRepository(db);
      const analyzer = new TimelineAnalyzer(auditRepo);
      const chartGenerator = new ChartGenerator();

      try {
        const analysis = await analyzer.analyzeProject(projectId);
        if (!analysis) {
          console.log('Aucune analyse disponible');
          return;
        }

        const svg = options.dimension
          ? chartGenerator.generateDimensionChart(analysis, options.dimension, options.format, {
              width: parseInt(options.width),
              height: parseInt(options.height),
            })
          : chartGenerator.generateTimelineChart(analysis, options.format, {
              width: parseInt(options.width),
              height: parseInt(options.height),
            });

        await writeFile(options.output, svg);
        console.log(`Graphique généré : ${options.output}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

function displayAnalysis(analysis: any): void {
  console.log(`Projet : ${analysis.projectName}`);
  console.log(`Période : ${analysis.startDate.toLocaleDateString()} → ${analysis.endDate.toLocaleDateString()}`);
  console.log(`Audits : ${analysis.totalAudits}`);
  console.log('');

  const rows = analysis.dimensionScores.map((d: any) => [
    d.dimension,
    d.averageScore.toFixed(1),
    d.trend.description,
    `${d.minScore} → ${d.maxScore}`,
  ]);

  renderTable(['Dimension', 'Moyenne', 'Tendance', 'Min → Max'], rows);
}

function displayTrends(report: any): void {
  console.log(`Période : ${report.startDate.toLocaleDateString()} → ${report.endDate.toLocaleDateString()}`);
  console.log(`Audits analysés : ${report.totalAudits}`);
  console.log('');

  const rows = Array.from(report.trends.entries()).map(([dim, trend]: [string, any]) => [
    dim,
    trend.direction === 'improving' ? '📈 Amélioration' :
    trend.direction === 'declining' ? '📉 Régression' : '➡️ Stable',
    trend.slope.toFixed(2),
    `${(trend.confidence * 100).toFixed(0)}%`,
  ]);

  renderTable(['Dimension', 'Direction', 'Pente', 'Confiance'], rows);

  if (report.regressions.length > 0) {
    console.log('\n⚠️  Régressions détectées :');
    for (const reg of report.regressions) {
      console.log(`  - ${reg.dimension} : ${reg.scoreBefore} → ${reg.scoreAfter} (-${reg.regressionPoints} points)`);
    }
  }
}

function displayAlerts(alerts: any[]): void {
  const rows = alerts.map((a: any) => [
    a.id.substring(0, 8),
    a.dimension,
    `${a.scoreBefore} → ${a.scoreAfter}`,
    `-${a.regressionPoints}`,
    new Date(a.createdAt).toLocaleDateString(),
    a.resolvedAt ? '✅ Résolue' : '⚠️ Active',
  ]);

  renderTable(['ID', 'Dimension', 'Score', 'Perte', 'Date', 'Statut'], rows);
}
```

**Mettre à jour `src/cli/index.ts` :**

Ajouter l'import et l'enregistrement de la commande :
```typescript
import { registerTimelineCommand } from './commands/timeline.js';

// Dans la fonction main()
registerTimelineCommand(program);
```

**Critères d'acceptation :**
- Commande `ekts timeline analyze` fonctionnelle
- Commande `ekts timeline trends` fonctionnelle
- Commande `ekts timeline alerts` fonctionnelle (avec --resolve)
- Commande `ekts timeline chart` fonctionnelle (génération SVG)
- Options respectées (dates, seuils, formats)
- Messages d'erreur clairs

---

### 3.2 Implémenter l'outil MCP `get_timeline` (5h)

**Fichier :** `src/mcp/tools/get-timeline.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TimelineAnalyzer } from '../../timeline/timeline-analyzer.js';
import { TrendDetector } from '../../timeline/trend-detector.js';
import { AlertManager } from '../../timeline/alert-manager.js';
import { AuditRepository } from '../../storage/audit-repository.js';
import { AlertRepository } from '../../storage/alert-repository.js';
import { getDatabase } from '../../storage/database.js';

/**
 * Enregistrer l'outil get_timeline pour MCP
 */
export function registerGetTimelineTool(server: McpServer): void {
  server.registerTool(
    'get_timeline',
    {
      title: 'Get Timeline Analysis',
      description: 'Analyser l\'évolution temporelle d\'un projet EKTS (tendances, alertes, scores)',
      inputSchema: {
        projectId: z.string().describe('ID du projet à analyser'),
        startDate: z.string().optional().describe('Date de début (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('Date de fin (YYYY-MM-DD)'),
        minAudits: z.number().optional().default(2).describe('Minimum d\'audits requis'),
        lookbackDays: z.number().optional().default(90).describe('Période d\'analyse des tendances (jours)'),
        includeAlerts: z.boolean().optional().default(true).describe('Inclure les alertes de régression'),
      },
    },
    async (params) => {
      try {
        const db = getDatabase();
        const auditRepo = new AuditRepository(db);
        const alertRepo = new AlertRepository(db);

        // Analyse de la timeline
        const analyzer = new TimelineAnalyzer(auditRepo);
        const analysis = await analyzer.analyzeProject(params.projectId, {
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined,
          minAudits: params.minAudits,
        });

        if (!analysis) {
          return {
            content: [
              {
                type: 'text',
                text: `Aucune analyse disponible pour le projet ${params.projectId}. Minimum ${params.minAudits} audits requis.`,
              },
            ],
          };
        }

        // Détection des tendances
        const trendDetector = new TrendDetector(auditRepo);
        const trendReport = await trendDetector.analyzeTrends(params.projectId, {
          lookbackDays: params.lookbackDays,
        });

        // Construction de la réponse
        const response: any = {
          projectId: analysis.projectId,
          projectName: analysis.projectName,
          period: {
            start: analysis.startDate.toISOString(),
            end: analysis.endDate.toISOString(),
          },
          totalAudits: analysis.totalAudits,
          dimensions: {},
          trends: {},
        };

        // Scores par dimension
        for (const dim of analysis.dimensionScores) {
          response.dimensions[dim.dimension] = {
            averageScore: dim.averageScore,
            minScore: dim.minScore,
            maxScore: dim.maxScore,
            scores: dim.scores.map(s => ({
              auditId: s.auditId,
              date: s.date.toISOString(),
              score: s.score,
              findingsCount: s.findingsCount,
            })),
          };
        }

        // Tendances
        for (const [dimension, trend] of trendReport.trends) {
          response.trends[dimension] = {
            direction: trend.direction,
            slope: trend.slope,
            confidence: trend.confidence,
            description: trend.description,
          };
        }

        // Alertes
        if (params.includeAlerts) {
          const alertManager = new AlertManager(alertRepo);
          const activeAlerts = await alertManager.getActiveAlerts(params.projectId);

          response.alerts = {
            active: activeAlerts.length,
            list: activeAlerts.map(a => ({
              id: a.id,
              dimension: a.dimension,
              scoreBefore: a.scoreBefore,
              scoreAfter: a.scoreAfter,
              regressionPoints: a.regressionPoints,
              createdAt: a.createdAt,
            })),
          };
        }

        // Régressions
        response.regressions = trendReport.regressions.map(r => ({
          dimension: r.dimension,
          scoreBefore: r.scoreBefore,
          scoreAfter: r.scoreAfter,
          regressionPoints: r.regressionPoints,
          dateFrom: r.dateFrom.toISOString(),
          dateTo: r.dateTo.toISOString(),
        }));

        const summaryText = generateTimelineSummary(analysis, trendReport, response.alerts?.active ?? 0);

        return {
          content: [
            {
              type: 'text',
              text: summaryText,
            },
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Erreur lors de l'analyse de la timeline : ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

function generateTimelineSummary(analysis: any, trendReport: any, alertCount: number): string {
  const lines: string[] = [];

  lines.push(`## Timeline : ${analysis.projectName}`);
  lines.push(`**Période :** ${analysis.startDate.toLocaleDateString()} → ${analysis.endDate.toLocaleDateString()}`);
  lines.push(`**Audits :** ${analysis.totalAudits}`);
  lines.push('');

  // Tendances
  const improving = Array.from(trendReport.trends.values()).filter((t: any) => t.direction === 'improving').length;
  const declining = Array.from(trendReport.trends.values()).filter((t: any) => t.direction === 'declining').length;
  const stable = Array.from(trendReport.trends.values()).filter((t: any) => t.direction === 'stable').length;

  lines.push(`**Tendances :** ${improving} en amélioration, ${declining} en régression, ${stable} stables`);

  if (alertCount > 0) {
    lines.push(`\n⚠️ **${alertCount} alerte(s) active(s)**`);
  }

  if (trendReport.regressions.length > 0) {
    lines.push('\n### Régressions détectées :');
    for (const reg of trendReport.regressions) {
      lines.push(`- ${reg.dimension} : ${reg.scoreBefore} → ${reg.scoreAfter} (-${reg.regressionPoints} points)`);
    }
  }

  return lines.join('\n');
}
```

**Mettre à jour `src/mcp/tools/index.ts` :**

Ajouter l'import et l'enregistrement :
```typescript
import { registerGetTimelineTool } from './get-timeline.js';

// Dans la fonction d'enregistrement
registerGetTimelineTool(server);
```

**Critères d'acceptation :**
- Outil `get_timeline` enregistré dans MCP
- Paramètres zod validés
- Réponse structurée avec dimensions, tendances, alertes
- Résumé textuel généré
- Gestion d'erreurs avec messages clairs
- Conforme aux guardrails MCP (`06_MCP_SECURITY_GUARDRAILS.md`)

---

### 3.3 Tests d'intégration (4h)

**Fichier :** `tests/integration/timeline-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { TimelineAnalyzer } from '../../src/timeline/timeline-analyzer.js';
import { TrendDetector } from '../../src/timeline/trend-detector.js';
import { AlertManager } from '../../src/timeline/alert-manager.js';
import { ChartGenerator } from '../../src/timeline/chart-generator.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AlertRepository } from '../../src/storage/alert-repository.js';

describe('Timeline Integration', () => {
  let db: Database.Database;
  let auditRepo: AuditRepository;
  let alertRepo: AlertRepository;
  let analyzer: TimelineAnalyzer;
  let trendDetector: TrendDetector;
  let alertManager: AlertManager;
  let chartGenerator: ChartGenerator;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    // Créer les tables
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT,
        description TEXT,
        created_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        configuration TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    db.exec(`
      CREATE TABLE audit_dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL,
        score INTEGER NOT NULL,
        findings_count INTEGER NOT NULL,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id)
      )
    `);

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

    // Insérer un projet
    db.prepare(`INSERT INTO projects (id, name, url, created_at) VALUES (?, ?, ?, ?)`)
      .run('test-project', 'Test Project', 'https://example.com', new Date().toISOString());

    auditRepo = new AuditRepository(db);
    alertRepo = new AlertRepository(db);
    analyzer = new TimelineAnalyzer(auditRepo);
    trendDetector = new TrendDetector(auditRepo);
    alertManager = new AlertManager(alertRepo);
    chartGenerator = new ChartGenerator();
  });

  it('devrait analyser une timeline complète avec tendances et alertes', async () => {
    // Insérer 5 audits avec scores en amélioration puis régression
    const audits = [
      { perf: 70, a11y: 75, seo: 80, date: '2024-01-01' },
      { perf: 75, a11y: 78, seo: 82, date: '2024-01-15' },
      { perf: 80, a11y: 80, seo: 85, date: '2024-02-01' },
      { perf: 85, a11y: 82, seo: 87, date: '2024-02-15' },
      { perf: 70, a11y: 85, seo: 88, date: '2024-03-01' }, // Régression performance
    ];

    for (const audit of audits) {
      const metadataId = insertAuditMetadata(db, 'test-project', audit.date);
      insertAuditDimension(db, metadataId, 'performance', audit.perf);
      insertAuditDimension(db, metadataId, 'accessibility', audit.a11y);
      insertAuditDimension(db, metadataId, 'seo', audit.seo);
    }

    // Analyser la timeline
    const analysis = await analyzer.analyzeProject('test-project');
    expect(analysis).not.toBeNull();
    expect(analysis!.totalAudits).toBe(5);

    // Détecter les tendances
    const trendReport = await trendDetector.analyzeTrends('test-project', {
      lookbackDays: 90,
    });
    expect(trendReport.totalAudits).toBe(5);
    expect(trendReport.trends.size).toBeGreaterThan(0);

    // Vérifier que la régression performance est détectée
    expect(trendReport.regressions.length).toBeGreaterThan(0);

    // Générer un graphique
    const svg = chartGenerator.generateTimelineChart(analysis!, 'svg');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Test Project');
  });

  it('devrait créer et gérer des alertes', async () => {
    // Créer une alerte manuellement
    const alert = await alertRepo.create({
      projectId: 'test-project',
      auditIdFrom: 1,
      auditIdTo: 2,
      dimension: 'performance',
      scoreBefore: 90,
      scoreAfter: 75,
      regressionPoints: 15,
    });

    // Vérifier qu'elle est active
    const activeAlerts = await alertManager.getActiveAlerts('test-project');
    expect(activeAlerts).toHaveLength(1);

    // La résoudre
    await alertManager.resolveAlert(alert.id);

    // Vérifier qu'elle n'est plus active
    const afterResolve = await alertManager.getActiveAlerts('test-project');
    expect(afterResolve).toHaveLength(0);
  });
});

// Helpers
function insertAuditMetadata(db: Database.Database, projectId: string, timestamp: string): number {
  const result = db.prepare(`
    INSERT INTO audit_metadata (project_id, timestamp, configuration)
    VALUES (?, ?, '{}')
  `).run(projectId, timestamp);
  return Number(result.lastInsertRowid);
}

function insertAuditDimension(db: Database.Database, auditId: number, dimension: string, score: number): void {
  db.prepare(`
    INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
    VALUES (?, ?, ?, 0)
  `).run(auditId, dimension, score);
}
```

**Critères d'acceptation :**
- Tests de bout en bout (timeline + tendances + alertes + graphique)
- Tests de gestion des alertes (création, résolution)
- Tous les tests passent
- Couverture > 80%

---

### 3.4 Rédiger la documentation utilisateur (3h)

**Fichier :** `docs/user/TIMELINE.md`

```markdown
# Suivi Temporel — Guide utilisateur

## Vue d'ensemble

Le suivi temporel permet d'analyser l'évolution de la qualité d'un projet au fil des audits :
- **Timeline** : Scores par dimension et par date
- **Tendances** : Détection automatique (amélioration, régression, stable)
- **Alertes** : Notification des régressions significatives
- **Graphiques** : Visualisation SVG de l'évolution

## Commandes CLI

### Analyser la timeline

```bash
# Analyser un projet spécifique
ekts timeline analyze <projectId>

# Analyser avec filtres de dates
ekts timeline analyze <projectId> --start 2024-01-01 --end 2024-12-31

# Analyser tous les projets
ekts timeline analyze
```

### Détecter les tendances

```bash
# Tendances sur 90 jours (défaut)
ekts timeline trends <projectId>

# Tendances sur 180 jours
ekts timeline trends <projectId> --lookback 180
```

### Gérer les alertes

```bash
# Voir les alertes actives
ekts timeline alerts <projectId>

# Voir toutes les alertes (y compris résolues)
ekts timeline alerts <projectId> --all

# Résoudre une alerte
ekts timeline alerts --resolve <alertId>

# Changer le seuil de régression
ekts timeline alerts --threshold 15
```

### Générer des graphiques

```bash
# Graphique SVG toutes dimensions
ekts timeline chart <projectId> --output evolution.svg

# Graphique pour une dimension spécifique
ekts timeline chart <projectId> --dimension performance --output perf.svg

# Personnaliser la taille
ekts timeline chart <projectId> --width 1200 --height 600
```

## Outil MCP

L'outil `get_timeline` permet aux agents IA d'analyser l'évolution d'un projet :

```json
{
  "tool": "get_timeline",
  "arguments": {
    "projectId": "mon-projet",
    "lookbackDays": 90,
    "includeAlerts": true
  }
}
```

**Paramètres :**
- `projectId` (requis) : ID du projet
- `startDate` / `endDate` : Période d'analyse
- `minAudits` : Minimum d'audits (défaut: 2)
- `lookbackDays` : Période de tendances (défaut: 90)
- `includeAlerts` : Inclure les alertes (défaut: true)

**Réponse :**
- Scores par dimension avec historique
- Tendances détectées (direction, pente, confiance)
- Alertes actives
- Régressions détectées

## Interprétation des résultats

### Tendances

- **📈 Amélioration** : La pente est positive (> 0.1)
- **📉 Régression** : La pente est négative (< -0.1)
- **➡️ Stable** : La pente est proche de 0

### Alertes

Une alerte est créée quand une dimension perd ≥ seuil (défaut: 10 points) entre 2 audits consécutifs.

### Graphiques

- Lignes colorées par dimension
- Points = scores individuels
- Légende avec noms de dimensions
- Grille pour faciliter la lecture

## Exemples

### Exemple 1 : Suivi mensuel

```bash
# Chaque mois, analyser l'évolution
ekts timeline trends mon-site --lookback 30

# Si régression détectée, voir les détails
ekts timeline alerts mon-site
```

### Exemple 2 : Rapport visuel

```bash
# Générer un graphique pour une présentation
ekts timeline chart mon-site --output rapport.svg --width 1200

# Ouvrir dans un navigateur
open rapport.svg
```

### Exemple 3 : Via MCP

```
Agent : Analyser l'évolution du projet mon-site sur les 90 derniers jours
→ L'outil get_timeline est appelé automatiquement
→ Retour : résumé + données structurées
```

## Configuration

Le seuil de régression est configurable :

```bash
# Dans .ekts/config.json
{
  "timeline": {
    "regressionThreshold": 10,
    "lookbackDays": 90,
    "minAudits": 2
  }
}
```
```

---

### 3.5 Mettre à jour la documentation de référence (2h)

**Mettre à jour `docs/reference/CLI_REFERENCE.md` :**

Ajouter la section :

```markdown
## Commande `ekts timeline`

### `ekts timeline analyze [projectId]`

Analyser l'évolution temporelle d'un projet.

**Options :**
- `--start <date>` : Date de début (YYYY-MM-DD)
- `--end <date>` : Date de fin (YYYY-MM-DD)
- `--min-audits <n>` : Minimum d'audits requis (défaut: 2)

**Exemples :**
```bash
ekts timeline analyze my-project
ekts timeline analyze my-project --start 2024-01-01 --end 2024-12-31
ekts timeline analyze  # Tous les projets
```

### `ekts timeline trends [projectId]`

Détecter les tendances d'évolution.

**Options :**
- `--lookback <days>` : Période de référence en jours (défaut: 90)

### `ekts timeline alerts [projectId]`

Gérer les alertes de régression.

**Options :**
- `--all` : Afficher toutes les alertes (y compris résolues)
- `--resolve <id>` : Marquer une alerte comme résolue
- `--threshold <n>` : Seuil de régression (défaut: 10)

### `ekts timeline chart [projectId]`

Générer un graphique d'évolution.

**Options :**
- `--format <type>` : Format de sortie (svg|png, défaut: svg)
- `--output <file>` : Fichier de sortie (défaut: timeline.svg)
- `--dimension <name>` : Dimension spécifique
- `--width <n>` : Largeur (défaut: 800)
- `--height <n>` : Hauteur (défaut: 400)
```

**Mettre à jour `docs/reference/MCP_REFERENCE.md` :**

Ajouter la section :

```markdown
## Outil `get_timeline`

Analyser l'évolution temporelle d'un projet EKTS.

**Paramètres :**
- `projectId` (string, requis) : ID du projet
- `startDate` (string, optionnel) : Date de début (YYYY-MM-DD)
- `endDate` (string, optionnel) : Date de fin (YYYY-MM-DD)
- `minAudits` (number, optionnel, défaut: 2) : Minimum d'audits
- `lookbackDays` (number, optionnel, défaut: 90) : Période de tendances
- `includeAlerts` (boolean, optionnel, défaut: true) : Inclure les alertes

**Retour :**
- `projectId` : ID du projet
- `projectName` : Nom du projet
- `period` : { start, end }
- `totalAudits` : Nombre d'audits
- `dimensions` : Scores par dimension avec historique
- `trends` : Tendances détectées par dimension
- `alerts` : Alertes actives
- `regressions` : Régressions détectées

**Exemple :**
```json
{
  "tool": "get_timeline",
  "arguments": {
    "projectId": "mon-projet",
    "lookbackDays": 90
  }
}
```
```

---

### 3.6 Test de vérification complet (2h)

```bash
# Compilation
npm run typecheck

# Lint
npm run lint

# Tous les tests
npm test

# Couverture
npm run coverage

# Vérification complète
npm run verify
```

**Critères d'acceptation :**
- `npm run verify` passe sans erreur
- Couverture globale > 96%
- Aucune régression dans les tests existants

---

### 3.7 Rédiger le rapport final SPRINT-14-RESULTAT.md (2h)

**Fichier :** `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-RESULTAT.md`

```markdown
# Rapport Sprint 14 — Suivi Temporel ✅

**Date de clôture :** [DATE]
**Statut :** ✅ TERMINÉ
**Durée réelle :** X jours (prévu : 9 jours)

---

## 1. Synthèse

Le Sprint 14 a ajouté le suivi temporel des audits EKTS :
- Analyse de l'évolution des scores dans le temps
- Détection automatique des tendances (amélioration, régression, stable)
- Gestion des alertes de régression
- Génération de graphiques SVG
- CLI complète (4 sous-commandes)
- Outil MCP pour agents IA

---

## 2. Fichiers créés

### Modules core
- `src/timeline/timeline.types.ts` — Types partagés
- `src/timeline/timeline-analyzer.ts` — Analyse de la timeline
- `src/timeline/trend-detector.ts` — Détection des tendances
- `src/timeline/alert-manager.ts` — Gestion des alertes
- `src/timeline/chart-generator.ts` — Génération de graphiques

### Stockage
- `src/storage/migrations/005_create_alerts_table.ts` — Migration table alerts
- `src/storage/alert-repository.ts` — Repository alertes

### CLI
- `src/cli/commands/timeline.ts` — Commande timeline (4 sous-commandes)

### MCP
- `src/mcp/tools/get-timeline.ts` — Outil get_timeline

### Tests
- `tests/timeline/timeline-analyzer.test.ts`
- `tests/timeline/trend-detector.test.ts`
- `tests/timeline/alert-manager.test.ts`
- `tests/timeline/chart-generator.test.ts`
- `tests/integration/timeline-integration.test.ts`

### Documentation
- `docs/user/TIMELINE.md` — Guide utilisateur

---

## 3. Modifications

- `src/storage/migrations/migration-registry.ts` — Ajout migration 005
- `src/storage/types.ts` — Ajout types Alert, CreateAlertInput, AlertFilters
- `src/cli/index.ts` — Enregistrement commande timeline
- `src/mcp/tools/index.ts` — Enregistrement outil get_timeline
- `docs/reference/CLI_REFERENCE.md` — Section timeline
- `docs/reference/MCP_REFERENCE.md` — Section get_timeline

---

## 4. Tests

### Unitaires
- TimelineAnalyzer : X tests ✅
- TrendDetector : Y tests ✅
- AlertManager : Z tests ✅
- ChartGenerator : W tests ✅

### Intégration
- Timeline complète : N tests ✅

### Couverture
- Modules timeline : > 80%
- Couverture globale : > 96%

---

## 5. Décisions prises

1. [Décision 1]
2. [Décision 2]
3. [Décision 3]

---

## 6. Problèmes rencontrés

1. [Problème 1] → [Solution]
2. [Problème 2] → [Solution]

---

## 7. Prochaine étape

Sprint 15 : Capitalisation (transverses et templates)

---

**Rapport rédigé le [DATE]**
**Sprint 14 terminé et validé**
```

---

## 4. Vérifications finales

### 4.1 Compilation et lint

```bash
npm run typecheck
npm run lint
```

### 4.2 Tests complets

```bash
npm test
npm run coverage
```

### 4.3 Vérification globale

```bash
npm run verify
```

---

## 5. Critères de validation du sous-sprint

- ✅ Commande CLI `ekts timeline` implémentée (4 sous-commandes)
- ✅ Outil MCP `get_timeline` implémenté
- ✅ Tests d'intégration complets
- ✅ Documentation utilisateur rédigée (`TIMELINE.md`)
- ✅ Documentation de référence mise à jour (CLI + MCP)
- ✅ Rapport final `SPRINT-14-RESULTAT.md` rédigé
- ✅ `npm run verify` passe
- ✅ Couverture > 96%

---

**Document rédigé le 25 octobre 2026 — Sprint 14-03 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 14-03 prêt pour implémentation**
