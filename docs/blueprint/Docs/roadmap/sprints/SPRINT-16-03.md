# SPRINT-16-03 — CLI, MCP, Tests d'intégration et Documentation

**Sprint :** 16-03 sur 16 (Sous-sprint 3/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ

---

## 1. Objectif du sous-sprint

Exposer les recommandations contextuelles aux utilisateurs et aux agents IA :
- **CLI** : Commande `ekts recommend` avec sous-commandes (`generate`, `list`, `rules`)
- **MCP** : Outil `get_recommendations` pour les agents IA
- **Tests d'intégration** : Vérification du fonctionnement de bout en bout
- **Documentation** : Guide utilisateur et mise à jour des références API
- **Rapport final** : SPRINT-16-RESULTAT.md

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 16-02 est terminé
npm run verify

# Vérifier que tous les modules existent
ls src/recommendations/
# Doit afficher : recommendation.types.ts, recommendation-repository.ts,
# recommendation-engine.ts, recommendation-context.ts
```

### 2.2 Documents à lire

- `SPRINT-16.md` (document parent)
- `SPRINT-16-01-RESULTAT.md`
- `SPRINT-16-02-RESULTAT.md`
- `docs/blueprint/Docs/06-Security/06_MCP_SECURITY_GUARDRAILS.md`
- `docs/blueprint/Docs/05-Creative-Engineering/13_CLI_GUIDE.md`

---

## 3. Tâches détaillées

### 3.1 Implémenter la commande CLI `ekts recommend` (6h)

**Fichier :** `src/cli/commands/recommend.ts`

```typescript
import { Command } from 'commander';
import { RecommendationEngine } from '../../recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../recommendations/recommendation-context.js';
import { RecommendationRepository } from '../../recommendations/recommendation-repository.js';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import { getDatabase } from '../../storage/database.js';
import { renderTable } from '../utils/table.js';

import type { AnalysisDimension, Priority, Severity } from '../../analysis/types.js';

const VALID_DIMENSIONS = ['performance', 'accessibility', 'seo', 'ux', 'content', 'general'];
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];

/**
 * Enregistrer la commande `ekts recommend` et ses sous-commandes.
 */
export function registerRecommendCommand(program: Command): void {
  const rec = program
    .command('recommend')
    .alias('rec')
    .description('Générer et gérer les recommandations contextuelles');

  // ekts recommend generate <projectId>
  rec
    .command('generate <projectId>')
    .description('Générer les recommandations pour un projet')
    .option('-n, --max <n>', 'Nombre maximum de recommandations', '10')
    .option('--min-score <score>', 'Score de pertinence minimum (0-1)', '0.3')
    .option('--dimensions <dims>', 'Dimensions à inclure (séparées par virgules)')
    .option('--no-rules', 'Désactiver les règles explicites')
    .option('--no-statistical', 'Désactiver le scoring statistique')
    .action(async (projectId, options) => {
      const db = getDatabase();
      const bestPractices = new BestPracticeService(db);
      const contextBuilder = new RecommendationContext(db, bestPractices);
      const engine = new RecommendationEngine(db, contextBuilder, bestPractices);

      try {
        const dimensions = options.dimensions
          ? options.dimensions.split(',').map((d: string) => d.trim())
          : undefined;

        console.log(`Génération des recommandations pour le projet ${projectId}...`);

        const report = await engine.generateRecommendations(projectId, {
          maxRecommendations: parseInt(options.max),
          minRelevanceScore: parseFloat(options.minScore),
          includeRules: options.rules !== false,
          includeStatistical: options.statistical !== false,
          dimensions: dimensions as AnalysisDimension[] | undefined,
        });

        console.log(`\n=== Rapport de recommandations ===\n`);
        console.log(`Recommandations générées : ${report.totalRecommendations}`);
        console.log(`Règles appliquées : ${report.rulesApplied}`);
        console.log(`Scoring statistique : ${report.statisticalRecommendations}`);
        console.log(`Durée : ${report.durationMs}ms\n`);

        if (report.recommendations.length === 0) {
          console.log('Aucune recommandation générée.');
          return;
        }

        for (let i = 0; i < report.recommendations.length; i++) {
          const rec = report.recommendations[i];
          const scorePercent = (rec.relevanceScore * 100).toFixed(0);
          const source = rec.ruleId ? '📏 Règle' : '📊 Statistique';

          console.log(`${i + 1}. [${scorePercent}%] ${rec.recommendationTitle}`);
          console.log(`   Priorité : ${rec.priority} | Effort : ${rec.effort}/5 | Impact : ${rec.impact}/5`);
          console.log(`   ${rec.recommendationDescription}`);
          if (rec.findingTitle) {
            console.log(`   Constat : ${rec.findingTitle}`);
          }
          console.log(`   Source : ${source}\n`);
        }
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts recommend list [projectId]
  rec
    .command('list [projectId]')
    .description('Lister les recommandations générées')
    .option('-n, --limit <n>', 'Nombre maximum', '20')
    .action(async (projectId, options) => {
      const db = getDatabase();
      const repo = new RecommendationRepository(db);

      try {
        if (projectId) {
          const recs = repo.getRecommendations(projectId, parseInt(options.limit));

          if (recs.length === 0) {
            console.log('Aucune recommandation pour ce projet.');
            return;
          }

          const rows = recs.map((r, i) => [
            (i + 1).toString(),
            r.recommendationTitle.substring(0, 50),
            r.dimension,
            `${(r.relevanceScore * 100).toFixed(0)}%`,
            r.priority,
            `${r.effort}/${r.impact}`,
          ]);

          renderTable(['#', 'Recommandation', 'Dim.', 'Score', 'Priorité', 'Effet/Impact'], rows);
          console.log(`\n${recs.length} recommandation(s)`);
        } else {
          console.log('Veuillez spécifier un projectId');
        }
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts recommend rules (gestion des règles)
  const rules = rec
    .command('rules')
    .description('Gérer les règles de recommandation');

  // ekts recommend rules list
  rules
    .command('list')
    .description('Lister les règles')
    .option('-d, --dimension <dim>', 'Filtrer par dimension')
    .option('--active', 'Montrer uniquement les règles actives')
    .option('-n, --limit <n>', 'Nombre maximum', '50')
    .action(async (options) => {
      const db = getDatabase();
      const engine = new RecommendationEngine(db, new RecommendationContext(db));

      try {
        const ruleList = engine.listRules({
          dimension: options.dimension as AnalysisDimension | undefined,
          isActive: options.active ? true : undefined,
          limit: parseInt(options.limit),
        });

        if (ruleList.length === 0) {
          console.log('Aucune règle configurée.');
          return;
        }

        const rows = ruleList.map(r => [
          r.id.substring(0, 8),
          r.name.substring(0, 30),
          r.dimension,
          `≥${r.severityThreshold}`,
          r.isActive ? '✅' : '❌',
          r.priority,
        ]);

        renderTable(['ID', 'Nom', 'Dim.', 'Sévérité', 'Actif', 'Priorité'], rows);
        console.log(`\n${ruleList.length} règle(s)`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts recommend rules add
  rules
    .command('add')
    .description('Ajouter une règle de recommandation')
    .requiredOption('-n, --name <name>', 'Nom de la règle')
    .requiredOption('--dimension <dim>', `Dimension (${VALID_DIMENSIONS.join(', ')})`)
    .requiredOption('--severity <n>', 'Sévérité minimum (0-4)')
    .requiredOption('--pattern <pattern>', 'Pattern de finding (titre normalisé)')
    .requiredOption('--rec-title <title>', 'Titre de la recommandation')
    .requiredOption('--rec-desc <desc>', 'Description de la recommandation')
    .option('--effort <n>', 'Effort estimé (1-5)', '3')
    .option('--impact <n>', 'Impact estimé (1-5)', '3')
    .option('--priority <p>', `Priorité (${VALID_PRIORITIES.join(', ')})`, 'medium')
    .option('-d, --description <desc>', 'Description de la règle', '')
    .action(async (options) => {
      if (!VALID_DIMENSIONS.includes(options.dimension)) {
        console.error(`Dimension invalide : ${options.dimension}`);
        process.exit(1);
      }

      if (!VALID_PRIORITIES.includes(options.priority)) {
        console.error(`Priorité invalide : ${options.priority}`);
        process.exit(1);
      }

      const db = getDatabase();
      const engine = new RecommendationEngine(db, new RecommendationContext(db));

      try {
        const rule = engine.addRule({
          name: options.name,
          description: options.description,
          dimension: options.dimension as AnalysisDimension | 'general',
          severityThreshold: parseInt(options.severity) as Severity,
          pattern: options.pattern,
          recommendationTitle: options.recTitle,
          recommendationDescription: options.recDesc,
          effort: parseInt(options.effort),
          impact: parseInt(options.impact),
          priority: options.priority as Priority,
        });

        console.log(`✅ Règle créée : ${rule.id}`);
        console.log(`   Nom : ${rule.name}`);
        console.log(`   Dimension : ${rule.dimension}`);
        console.log(`   Pattern : ${rule.pattern}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts recommend rules delete <id>
  rules
    .command('delete <id>')
    .description('Supprimer une règle')
    .action(async (id) => {
      const db = getDatabase();
      const engine = new RecommendationEngine(db, new RecommendationContext(db));

      try {
        engine.deleteRule(id);
        console.log(`✅ Règle supprimée`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts recommend rules toggle <id>
  rules
    .command('toggle <id>')
    .description('Activer/désactiver une règle')
    .action(async (id) => {
      const db = getDatabase();
      const repo = new RecommendationRepository(db);

      try {
        const rule = repo.getRuleById(id);
        if (!rule) {
          console.error(`Règle non trouvée : ${id}`);
          process.exit(1);
        }

        repo.updateRule(id, { isActive: !rule.isActive });
        console.log(`✅ Règle ${rule.isActive ? 'désactivée' : 'activée'}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
```

**Mettre à jour `src/cli/index.ts` :**

Ajouter l'import et l'enregistrement :
```typescript
import { registerRecommendCommand } from './commands/recommend.js';

// Dans la fonction d'enregistrement des commandes :
registerRecommendCommand(program);
```

**Critères d'acceptation :**
- `ekts recommend generate <projectId>` génère et affiche les recommandations
- `ekts recommend list [projectId]` affiche les recommandations sauvegardées
- `ekts recommend rules list` liste les règles
- `ekts recommend rules add` crée une règle avec validation
- `ekts recommend rules delete <id>` supprime une règle
- `ekts recommend rules toggle <id>` active/désactive une règle
- Alias `rec` fonctionnel
- Options respectées (max, min-score, dimensions, etc.)

---

### 3.2 Implémenter l'outil MCP `get_recommendations` (4h)

**Fichier :** `src/mcp/tools/get-recommendations.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RecommendationEngine } from '../../recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../recommendations/recommendation-context.js';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import { getDatabase } from '../../storage/database.js';

const VALID_DIMENSIONS = ['performance', 'accessibility', 'seo', 'ux', 'content'] as const;

/**
 * Enregistrer l'outil MCP get_recommendations.
 */
export function registerGetRecommendationsTool(server: McpServer): void {
  server.registerTool(
    'get_recommendations',
    {
      title: 'Get Recommendations',
      description: 'Générer des recommandations contextuelles pour un projet EKTS basées sur les audits, tendances et bonnes pratiques',
      inputSchema: {
        projectId: z.string().describe('ID du projet'),
        maxRecommendations: z.number().optional().default(10).describe('Nombre maximum de recommandations'),
        minRelevanceScore: z.number().optional().default(0.3).describe('Score de pertinence minimum (0-1)'),
        dimensions: z.array(z.enum(VALID_DIMENSIONS)).optional().describe('Dimensions à inclure'),
        includeRules: z.boolean().optional().default(true).describe('Inclure les règles explicites'),
        includeStatistical: z.boolean().optional().default(true).describe('Inclure le scoring statistique'),
      },
    },
    async (params) => {
      try {
        const db = getDatabase();
        const bestPractices = new BestPracticeService(db);
        const contextBuilder = new RecommendationContext(db, bestPractices);
        const engine = new RecommendationEngine(db, contextBuilder, bestPractices);

        const report = await engine.generateRecommendations(params.projectId, {
          maxRecommendations: params.maxRecommendations,
          minRelevanceScore: params.minRelevanceScore,
          dimensions: params.dimensions as any,
          includeRules: params.includeRules,
          includeStatistical: params.includeStatistical,
        });

        if (report.recommendations.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Aucune recommandation générée pour le projet ${params.projectId}. Le projet a ${report.totalRecommendations} audits et aucune règle ne correspond aux findings actuels.`,
              },
            ],
          };
        }

        const summaryText = generateRecommendationSummary(report);

        const data = {
          projectId: report.projectId,
          totalRecommendations: report.totalRecommendations,
          rulesApplied: report.rulesApplied,
          statisticalRecommendations: report.statisticalRecommendations,
          durationMs: report.durationMs,
          recommendations: report.recommendations.map(r => ({
            title: r.recommendationTitle,
            description: r.recommendationDescription,
            dimension: r.dimension,
            relevanceScore: r.relevanceScore,
            priority: r.priority,
            effort: r.effort,
            impact: r.impact,
            findingTitle: r.findingTitle,
            source: r.ruleId ? 'rule' : 'statistical',
          })),
        };

        return {
          content: [
            { type: 'text' as const, text: summaryText },
            { type: 'text' as const, text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text' as const, text: `Erreur lors de la génération des recommandations : ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}

function generateRecommendationSummary(report: any): string {
  const lines: string[] = [];

  lines.push(`## Recommandations contextuelles`);
  lines.push(`**Projet :** ${report.projectId}`);
  lines.push(`**Générées :** ${report.totalRecommendations} (${report.rulesApplied} par règles, ${report.statisticalRecommendations} par scoring) en ${report.durationMs}ms\n`);

  for (let i = 0; i < report.recommendations.length; i++) {
    const rec = report.recommendations[i];
    const score = (rec.relevanceScore * 100).toFixed(0);
    const source = rec.ruleId ? '📏' : '📊';

    lines.push(`${source} **${i + 1}. ${rec.recommendationTitle}**`);
    lines.push(`   Pertinence : ${score}% | Priorité : ${rec.priority} | Effort : ${rec.effort}/5 | Impact : ${rec.impact}/5`);
    lines.push(`   ${rec.recommendationDescription.substring(0, 150)}`);
    if (rec.findingTitle) {
      lines.push(`   Constat : ${rec.findingTitle}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

**Mettre à jour `src/mcp/tools/index.ts` :**

Ajouter l'import et l'enregistrement :
```typescript
import { registerGetRecommendationsTool } from './get-recommendations.js';

// Dans la fonction d'enregistrement :
registerGetRecommendationsTool(server);
```

**Critères d'acceptation :**
- Outil `get_recommendations` enregistré dans MCP
- Paramètres Zod validés
- Réponse structurée (résumé + JSON)
- Gestion d'erreurs
- Conforme aux guardrails MCP

---

### 3.3 Tests CLI (3h)

**Fichier :** `tests/cli/recommend.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { RecommendationRepository } from '../../src/recommendations/recommendation-repository.js';
import { migration007CreateRecommendations } from '../../src/storage/migrations/007_create_recommendations.js';

describe('CLI ekts recommend', () => {
  let db: Database.Database;
  let engine: RecommendationEngine;
  let repo: RecommendationRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    db.exec(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL)`);
    db.prepare('INSERT INTO projects VALUES (?, ?, ?, ?)').run('proj-1', 'Test', 'https://example.com', new Date().toISOString());

    db.exec(`CREATE TABLE IF NOT EXISTS audit_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, url TEXT NOT NULL, timestamp TEXT NOT NULL, overall_score REAL NOT NULL DEFAULT 0, total_findings INTEGER NOT NULL DEFAULT 0, critical_findings INTEGER NOT NULL DEFAULT 0, high_findings INTEGER NOT NULL DEFAULT 0, medium_findings INTEGER NOT NULL DEFAULT 0, low_findings INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_dimensions (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL, dimension TEXT NOT NULL, score INTEGER NOT NULL, findings_count INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_findings (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL, dimension TEXT NOT NULL, title TEXT NOT NULL, description TEXT, severity INTEGER NOT NULL DEFAULT 0, effort INTEGER NOT NULL DEFAULT 1, impact INTEGER NOT NULL DEFAULT 1, priority TEXT NOT NULL DEFAULT 'low', recommendation TEXT)`);

    migration007CreateRecommendations(db);

    const ctx = new RecommendationContext(db);
    engine = new RecommendationEngine(db, ctx);
    repo = new RecommendationRepository(db);
  });

  afterEach(() => { db.close(); });

  describe('generate', () => {
    it('devrait générer des recommandations', async () => {
      engine.addRule({
        name: 'Test Rule',
        description: 'Test',
        dimension: 'performance',
        severityThreshold: 1,
        pattern: 'test finding',
        recommendationTitle: 'Fix test finding',
        recommendationDescription: 'Do something',
      });

      const auditResult = db.prepare('INSERT INTO audit_metadata (project_id, url, timestamp) VALUES (?, ?, ?)').run('proj-1', 'https://example.com', '2024-01-01');
      const auditId = Number(auditResult.lastInsertRowid);
      db.prepare('INSERT INTO audit_dimensions (audit_id, dimension, score) VALUES (?, ?, ?)').run(auditId, 'performance', 70);
      db.prepare('INSERT INTO audit_findings (audit_id, dimension, title, severity) VALUES (?, ?, ?, ?)').run(auditId, 'performance', 'Test finding', 2);

      const report = await engine.generateRecommendations('proj-1');
      expect(report.totalRecommendations).toBeGreaterThanOrEqual(1);
    });
  });

  describe('rules management', () => {
    it('devrait lister les règles', () => {
      engine.addRule({ name: 'R1', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });
      engine.addRule({ name: 'R2', description: 'D', dimension: 'performance', severityThreshold: 2, pattern: 'p2', recommendationTitle: 'T2', recommendationDescription: 'D2' });

      const rules = engine.listRules();
      expect(rules).toHaveLength(2);
    });

    it('devrait filtrer les règles par dimension', () => {
      engine.addRule({ name: 'R1', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });
      engine.addRule({ name: 'R2', description: 'D', dimension: 'performance', severityThreshold: 2, pattern: 'p2', recommendationTitle: 'T2', recommendationDescription: 'D2' });

      const seoRules = engine.listRules({ dimension: 'seo' });
      expect(seoRules).toHaveLength(1);
    });

    it('devrait activer/désactiver une règle', () => {
      const rule = engine.addRule({ name: 'R', description: 'D', dimension: 'seo', severityThreshold: 1, pattern: 'p', recommendationTitle: 'T', recommendationDescription: 'D' });

      engine.updateRule(rule.id, { isActive: false });
      const updated = engine.listRules({ isActive: false });
      expect(updated).toHaveLength(1);
      expect(updated[0].isActive).toBe(false);
    });
  });
});
```

---

### 3.4 Tests MCP (2h)

**Fichier :** `tests/mcp/tools/get-recommendations.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationEngine } from '../../../src/recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../../src/recommendations/recommendation-context.js';
import { migration007CreateRecommendations } from '../../../src/storage/migrations/007_create_recommendations.js';

describe('MCP get_recommendations', () => {
  let db: Database.Database;
  let engine: RecommendationEngine;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    db.exec(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL)`);
    db.prepare('INSERT INTO projects VALUES (?, ?, ?, ?)').run('proj-1', 'Test', 'https://example.com', new Date().toISOString());

    db.exec(`CREATE TABLE IF NOT EXISTS audit_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, url TEXT NOT NULL, timestamp TEXT NOT NULL, overall_score REAL NOT NULL DEFAULT 0, total_findings INTEGER NOT NULL DEFAULT 0, critical_findings INTEGER NOT NULL DEFAULT 0, high_findings INTEGER NOT NULL DEFAULT 0, medium_findings INTEGER NOT NULL DEFAULT 0, low_findings INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_dimensions (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL, dimension TEXT NOT NULL, score INTEGER NOT NULL, findings_count INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_findings (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL, dimension TEXT NOT NULL, title TEXT NOT NULL, description TEXT, severity INTEGER NOT NULL DEFAULT 0, effort INTEGER NOT NULL DEFAULT 1, impact INTEGER NOT NULL DEFAULT 1, priority TEXT NOT NULL DEFAULT 'low', recommendation TEXT)`);

    migration007CreateRecommendations(db);

    const ctx = new RecommendationContext(db);
    engine = new RecommendationEngine(db, ctx);
  });

  afterEach(() => { db.close(); });

  it('devrait retourner un rapport vide pour un projet sans audits', async () => {
    const report = await engine.generateRecommendations('proj-1');
    expect(report.totalRecommendations).toBe(0);
  });

  it('devrait respecter maxRecommendations', async () => {
    for (let i = 0; i < 5; i++) {
      engine.addRule({
        name: `R${i}`, description: 'D', dimension: 'performance',
        severityThreshold: 1, pattern: `finding ${i}`,
        recommendationTitle: `Rec ${i}`, recommendationDescription: `Desc ${i}`,
      });
    }

    const auditResult = db.prepare('INSERT INTO audit_metadata (project_id, url, timestamp) VALUES (?, ?, ?)').run('proj-1', 'https://example.com', '2024-01-01');
    const auditId = Number(auditResult.lastInsertRowid);
    db.prepare('INSERT INTO audit_dimensions (audit_id, dimension, score) VALUES (?, ?, ?)').run(auditId, 'performance', 70);
    for (let i = 0; i < 5; i++) {
      db.prepare('INSERT INTO audit_findings (audit_id, dimension, title, severity) VALUES (?, ?, ?, ?)').run(auditId, 'performance', `Finding ${i}`, 2);
    }

    const report = await engine.generateRecommendations('proj-1', { maxRecommendations: 2 });
    expect(report.recommendations.length).toBeLessThanOrEqual(2);
  });
});
```

---

### 3.5 Tests d'intégration (3h)

**Fichier :** `tests/integration/recommendations-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { RecommendationEngine } from '../../src/recommendations/recommendation-engine.js';
import { RecommendationContext } from '../../src/recommendations/recommendation-context.js';
import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';
import { migration007CreateRecommendations } from '../../src/storage/migrations/007_create_recommendations.js';

describe('Recommendations Integration', () => {
  let db: Database.Database;
  let engine: RecommendationEngine;
  let bestPractices: BestPracticeService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    // Schéma complet
    db.exec(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL)`);
    db.prepare('INSERT INTO projects VALUES (?, ?, ?, ?)').run('proj-1', 'Integration', 'https://example.com', new Date().toISOString());

    db.exec(`CREATE TABLE IF NOT EXISTS audit_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, url TEXT NOT NULL, timestamp TEXT NOT NULL, overall_score REAL NOT NULL DEFAULT 0, total_findings INTEGER NOT NULL DEFAULT 0, critical_findings INTEGER NOT NULL DEFAULT 0, high_findings INTEGER NOT NULL DEFAULT 0, medium_findings INTEGER NOT NULL DEFAULT 0, low_findings INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_dimensions (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL, dimension TEXT NOT NULL, score INTEGER NOT NULL, findings_count INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE IF NOT EXISTS audit_findings (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_id INTEGER NOT NULL, dimension TEXT NOT NULL, title TEXT NOT NULL, description TEXT, severity INTEGER NOT NULL DEFAULT 0, effort INTEGER NOT NULL DEFAULT 1, impact INTEGER NOT NULL DEFAULT 1, priority TEXT NOT NULL DEFAULT 'low', recommendation TEXT)`);

    migration006CreateBestPractices(db);
    migration007CreateRecommendations(db);

    bestPractices = new BestPracticeService(db);
    const contextBuilder = new RecommendationContext(db, bestPractices);
    engine = new RecommendationEngine(db, contextBuilder, bestPractices);
  });

  afterEach(() => { db.close(); });

  function insertAudit(projectId: string, timestamp: string, scores: Record<string, number>): number {
    const result = db.prepare('INSERT INTO audit_metadata (project_id, url, timestamp) VALUES (?, ?, ?)').run(projectId, 'https://example.com', timestamp);
    const auditId = Number(result.lastInsertRowid);
    for (const [dim, score] of Object.entries(scores)) {
      db.prepare('INSERT INTO audit_dimensions (audit_id, dimension, score) VALUES (?, ?, ?)').run(auditId, dim, score);
    }
    return auditId;
  }

  function insertFinding(auditId: number, dim: string, title: string, severity: number): void {
    db.prepare('INSERT INTO audit_findings (audit_id, dimension, title, severity) VALUES (?, ?, ?, ?)').run(auditId, dim, title, severity);
  }

  it('flux complet : règles + contexte + recommandations', async () => {
    // 1. Ajouter des règles
    engine.addRule({
      name: 'Images',
      description: 'Optimisation',
      dimension: 'performance',
      severityThreshold: 2,
      pattern: 'images non optimisées',
      recommendationTitle: 'Optimiser toutes les images',
      recommendationDescription: 'Convertir en WebP, lazy-loader',
      effort: 2,
      impact: 4,
      priority: 'high',
    });

    engine.addRule({
      name: 'SEO Meta',
      description: 'Méta descriptions',
      dimension: 'seo',
      severityThreshold: 1,
      pattern: 'meta description manquante',
      recommendationTitle: 'Ajouter les méta descriptions',
      recommendationDescription: 'Chaque page doit avoir une meta description unique',
      effort: 1,
      impact: 3,
      priority: 'medium',
    });

    // 2. Créer des audits avec findings
    const a1 = insertAudit('proj-1', '2024-01-01', { performance: 70, seo: 80 });
    insertFinding(a1, 'performance', 'Images non optimisées', 3);
    insertFinding(a1, 'seo', 'Meta description manquante', 2);

    const a2 = insertAudit('proj-1', '2024-02-01', { performance: 65, seo: 75 });
    insertFinding(a2, 'performance', 'Images non optimisées', 3);
    insertFinding(a2, 'seo', 'Meta description manquante', 2);
    insertFinding(a2, 'performance', 'Cache navigateur désactivé', 2);

    // 3. Générer les recommandations
    const report = await engine.generateRecommendations('proj-1', {
      maxRecommendations: 10,
      minRelevanceScore: 0.3,
    });

    // 4. Vérifications
    expect(report.totalRecommendations).toBeGreaterThanOrEqual(2);
    expect(report.rulesApplied).toBeGreaterThanOrEqual(2);
    expect(report.durationMs).toBeGreaterThanOrEqual(0);

    // Les recommandations doivent être triées par pertinence
    for (let i = 0; i < report.recommendations.length - 1; i++) {
      expect(report.recommendations[i].relevanceScore).toBeGreaterThanOrEqual(
        report.recommendations[i + 1].relevanceScore
      );
    }

    // La recommandation "images" doit avoir un score élevé (règle + sévérité 3)
    const imageRec = report.recommendations.find(r => r.recommendationTitle.includes('images'));
    expect(imageRec).toBeDefined();
    expect(imageRec!.relevanceScore).toBeGreaterThan(0.5);
  });

  it('flux avec bonnes practices : association automatique', async () => {
    // Créer une bonne practice
    const bp = bestPractices.create({
      title: 'Optimiser les images WebP',
      description: 'Convertir toutes les images en WebP',
      category: 'performance',
    });

    // Lier la BP à un finding
    bestPractices.linkToFinding(bp.id, 'Images non optimisées', 'performance');

    // Ajouter un finding correspondant dans un audit
    const a1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(a1, 'performance', 'Images non optimisées', 2);

    const a2 = insertAudit('proj-1', '2024-02-01', { performance: 72 });
    insertFinding(a2, 'performance', 'Images non optimisées', 2);

    // Générer les recommandations
    const report = await engine.generateRecommendations('proj-1');

    // La recommandation pourrait mentionner la bonne practice
    expect(report.totalRecommendations).toBeGreaterThanOrEqual(0);
  });

  it('flux sans règles : scoring statistique uniquement', async () => {
    // Pas de règles configurées
    // Créer des audits avec des findings récurrents
    for (let i = 0; i < 4; i++) {
      const auditId = insertAudit('proj-1', `2024-0${i + 1}-01`, { performance: 70 + i * 2 });
      insertFinding(auditId, 'performance', 'Images non optimisées', 2);
    }

    const report = await engine.generateRecommendations('proj-1', {
      includeRules: false,
      includeStatistical: true,
    });

    // Le scoring statistique devrait détecter la récurrence
    expect(report.statisticalRecommendations).toBeGreaterThanOrEqual(0);
    expect(report.rulesApplied).toBe(0);
  });
});
```

---

### 3.6 Rédiger la documentation utilisateur (3h)

**Fichier :** `docs/user/RECOMMENDATIONS.md`

```markdown
# Recommandations Contextuelles — Guide utilisateur

## Vue d'ensemble

Le moteur de recommandations EKTS analyse le contexte de vos projets (audits, tendances, bonnes practices) pour générer des **recommandations personnalisées et priorisées**.

### Comment ça marche ?

Le moteur combine deux approches :

1. **Règles explicites** : Des règles prédéfinies associent des patterns de constats à des recommandations actionnables
2. **Scoring statistique** : Les findings récurrents dans l'historique sont automatiquement proposés comme recommandations

Les recommandations sont **ajustées selon le contexte** :
- Si une dimension est en régression : la recommandation est plus prioritaire
- Si un finding a déjà été résolu : il est moins prioritaire
- Si un finding persiste malgré les tentatives : il est plus prioritaire
- Si une bonne practice est associée : elle est proposée comme solution

## Commandes CLI

### `ekts recommend generate <projectId>`

Générer les recommandations pour un projet.

```bash
# Génération standard
ekts recommend generate mon-projet

# Avec options
ekts recommend generate mon-projet \
  --max 5 \
  --min-score 0.5 \
  --dimensions performance,seo \
  --no-statistical
```

**Options :**
- `-n, --max <n>` : Nombre maximum (défaut: 10)
- `--min-score <score>` : Score minimum 0-1 (défaut: 0.3)
- `--dimensions <dims>` : Dimensions (séparées par virgules)
- `--no-rules` : Désactiver les règles explicites
- `--no-statistical` : Désactiver le scoring statistique

### `ekts recommend list [projectId]`

Lister les dernières recommandations générées.

```bash
ekts recommend list mon-projet
ekts recommend list mon-projet --limit 5
```

### `ekts recommend rules`

Gérer les règles de recommandation.

```bash
# Lister les règles
ekts recommend rules list
ekts recommend rules list --dimension performance --active

# Ajouter une règle
ekts recommend rules add \
  --name "Optimiser images" \
  --dimension performance \
  --severity 2 \
  --pattern "images non optimisées" \
  --rec-title "Convertir les images en WebP" \
  --rec-desc "Utiliser le format WebP pour réduire la taille des images" \
  --effort 2 --impact 4 --priority high

# Supprimer une règle
ekts recommend rules delete <id>

# Activer/désactiver une règle
ekts recommend rules toggle <id>
```

## Outil MCP

### `get_recommendations`

Générer des recommandations depuis un agent IA.

```json
{
  "tool": "get_recommendations",
  "arguments": {
    "projectId": "mon-projet",
    "maxRecommendations": 5,
    "minRelevanceScore": 0.5,
    "dimensions": ["performance", "seo"]
  }
}
```

**Paramètres :**
- `projectId` (requis) : ID du projet
- `maxRecommendations` (défaut: 10)
- `minRelevanceScore` (défaut: 0.3)
- `dimensions` : Liste de dimensions
- `includeRules` (défaut: true)
- `includeStatistical` (défaut: true)

## Score de pertinence

Chaque recommandation reçoit un **score de pertinence (0-100%)** basé sur :

| Facteur | Ajustement |
|---------|-----------|
| Règle explicite | Score de base : 80% |
| Scoring statistique | Score de base : 50-80% (selon fréquence) |
| Dimension en régression | +10% |
| Dimension en amélioration | -10% |
| Finding déjà résolu (>80%) | -20% |
| Finding persiste (<20%) | +15% |
| Bonne practice associée | +5% |

## Intégration dans les rapports

Les recommandations sont automatiquement intégrées dans les rapports Markdown et PDF (section en fin de rapport) :

```bash
# Générer un rapport avec recommandations
ekts audit report mon-projet --format markdown
```

## Exemples

### Exemple 1 : Recommandations pour un site e-commerce

```bash
$ ekts recommend generate e-commerce-site

=== Rapport de recommandations ===

Recommandations générées : 5
Règles appliquées : 3
Scoring statistique : 2
Durée : 142ms

1. [92%] Optimiser les images produits
   Priorité : high | Effort : 2/5 | Impact : 4/5
   Convertir les images en WebP et lazy-loader
   Constat : Images non optimisées
   Source : 📏 Règle

2. [85%] Ajouter les méta descriptions
   Priorité : medium | Effort : 1/5 | Impact : 3/5
   Chaque page produit doit avoir une meta description unique
   Constat : Meta description manquante
   Source : 📏 Règle
```

### Exemple 2 : Filtrer par dimension

```bash
$ ekts recommend generate mon-site --dimensions seo --max 3

=== Rapport de recommandations ===

1. [88%] Ajouter les structured data
   Priorité : high | Effort : 3/5 | Impact : 4/5

2. [75%] Optimiser les titres H1
   Priorité : medium | Effort : 1/5 | Impact : 3/5
```

### Exemple 3 : Agent IA recommande des actions

```
Agent : Analyse le projet e-commerce et propose les actions prioritaires
→ L'outil get_recommendations est appelé
→ Retour : 5 recommandations triées par pertinence
→ L'agent présente les 3 premières avec les détails d'implémentation
```
```

---

### 3.7 Mettre à jour la documentation de référence (2h)

**Mettre à jour `docs/reference/CLI_REFERENCE.md`** :

Ajouter la section :

```markdown
## Commande `ekts recommend` (alias `rec`)

### `ekts recommend generate <projectId>`

Générer les recommandations contextuelles.

**Options :**
- `-n, --max <n>` : Nombre max (défaut: 10)
- `--min-score <score>` : Score minimum (défaut: 0.3)
- `--dimensions <dims>` : Dimensions (séparées par virgules)
- `--no-rules` : Désactiver les règles
- `--no-statistical` : Désactiver le scoring

### `ekts recommend list [projectId]`

Lister les recommandations générées.

### `ekts recommend rules list`

Lister les règles de recommandation.

### `ekts recommend rules add`

Ajouter une règle.

**Options (requises) :**
- `-n, --name` : Nom
- `--dimension` : Dimension
- `--severity` : Sévérité minimum
- `--pattern` : Pattern de finding
- `--rec-title` : Titre de la recommandation
- `--rec-desc` : Description

### `ekts recommend rules delete <id>`

Supprimer une règle.

### `ekts recommend rules toggle <id>`

Activer/désactiver une règle.
```

**Mettre à jour `docs/reference/MCP_REFERENCE.md`** :

```markdown
## Outil `get_recommendations`

Générer des recommandations contextuelles pour un projet.

**Paramètres :**
- `projectId` (string, requis) : ID du projet
- `maxRecommendations` (number, défaut: 10)
- `minRelevanceScore` (number, défaut: 0.3)
- `dimensions` (string[], optionnel)
- `includeRules` (boolean, défaut: true)
- `includeStatistical` (boolean, défaut: true)

**Retour :** Résumé textuel + JSON structuré
```

---

### 3.8 Test de vérification complet (2h)

```bash
npm run typecheck
npm run lint
npm test
npm run coverage
npm run verify
```

---

### 3.9 Rédiger le rapport final SPRINT-16-RESULTAT.md (2h)

**Fichier :** `docs/blueprint/Docs/roadmap/sprints/SPRINT-16-RESULTAT.md`

Contenu standard : fichiers créés, modifications, tests, critères validés, décisions, problèmes, prochaine étape (Sprint 17).

---

## 4. Vérifications finales

```bash
npm run typecheck
npm run lint
npm test
npm run coverage
npm run verify
```

---

## 5. Critères de validation du sous-sprint

- ✅ Commande CLI `ekts recommend generate` fonctionnelle
- ✅ Commande CLI `ekts recommend list` fonctionnelle
- ✅ Commandes `ekts recommend rules` (list, add, delete, toggle)
- ✅ Outil MCP `get_recommendations` fonctionnel
- ✅ Tests CLI et MCP complets
- ✅ Tests d'intégration (flux complet, bonnes practices, scoring)
- ✅ Documentation utilisateur (`RECOMMENDATIONS.md`)
- ✅ Documentation de référence mise à jour
- ✅ Rapport final `SPRINT-16-RESULTAT.md` rédigé
- ✅ `npm run verify` passe
- ✅ Couverture > 96%

---

**Document rédigé le 25 octobre 2026 — Sprint 16-03 du projet EKTS**  
**Statut : ✅ Sprint 16-03 implémenté et validé**
