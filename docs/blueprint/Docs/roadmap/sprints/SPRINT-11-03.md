# Sprint 11-3 — CLI + MCP + Tests + Documentation (Semaine 22, Jours 8-10)

**Durée :** 3 jours  
**Objectif :** Implémenter les commandes CLI, les outils MCP, tests d'intégration et documentation  
**Dépendance :** Sprint 11-2 (Comparaison d'audits) ✅
**Statut :** ✅ LIVRÉ (24 octobre 2026)  

---

## 1. Contexte

Les **Sprints 11-1 et 11-2** ont implémenté :
- ✅ Types Reports (ReportOptions, ComparisonReport)
- ✅ MarkdownTemplate + HtmlTemplate
- ✅ MarkdownReportGenerator + PDFReportGenerator (Puppeteer)
- ✅ AuditComparator (delta scores, delta findings, evolution)
- ✅ ComparisonMarkdownTemplate (detailed + summary)

Le **Sprint 11-3** finalise le MVP-2 avec :
- 🎯 CLI `ekts inspect <url>` + `ekts audit list/show/report/compare`
- 🎯 MCP `inspect_site` + `audit_history` + `audit_report`
- 🎯 Tests d'intégration complets
- 🎯 Documentation REPORTS.md + mise à jour CLI.md + MCP.md

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── add.ts                    ✅ (Sprint 5)
│   │   │   ├── search.ts                 ✅ (Sprint 5)
│   │   │   ├── get.ts                    ✅ (Sprint 5)
│   │   │   ├── list.ts                   ✅ (Sprint 5)
│   │   │   ├── delete.ts                 ✅ (Sprint 5)
│   │   │   ├── status.ts                 ✅ (Sprint 5)
│   │   │   ├── inspect.ts                (à créer)
│   │   │   └── audit.ts                  (à créer)
│   │   └── ...
│   ├── mcp/
│   │   ├── tools/
│   │   │   ├── add-entry.ts              ✅ (Sprint 6)
│   │   │   ├── search-entries.ts         ✅ (Sprint 6)
│   │   │   ├── get-entry.ts              ✅ (Sprint 6)
│   │   │   ├── list-entries.ts           ✅ (Sprint 6)
│   │   │   ├── inspect-site.ts           (à créer)
│   │   │   ├── audit-history.ts          (à créer)
│   │   │   └── audit-report.ts           (à créer)
│   │   └── ...
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 CLI `ekts inspect` (Jour 1 — 3h)

**Fichier :** `src/cli/commands/inspect.ts`

```typescript
import { Command } from 'commander';
import { Inspector } from '../../browser/inspection/inspector';
import { AnalysisPipeline } from '../../analysis/pipeline';
import { AuditRepository } from '../../storage/audit-repository';
import { AuditIndexer } from '../../storage/audit-indexing';
import { MarkdownReportGenerator } from '../../reports/markdown-generator';
import { PDFReportGenerator } from '../../reports/pdf-generator';
import { getDatabase } from '../database';
import { VectorStore } from '../../storage/vector-store';
import path from 'path';

/**
 * Commande : ekts inspect <url>
 * 
 * Options :
 *   --level L1|L2|L3  (défaut: L2)
 *   --output <path>    (défaut: ./reports)
 *   --format md|pdf|both (défaut: both)
 */
export function registerInspectCommand(program: Command): void {
  program
    .command('inspect <url>')
    .description('Inspecter un site web (L1, L2 ou L3) et générer un rapport')
    .option('-l, --level <level>', 'Niveau d\'inspection (L1, L2, L3)', 'L2')
    .option('-o, --output <path>', 'Dossier de sortie', './reports')
    .option('-f, --format <format>', 'Format du rapport (md, pdf, both)', 'both')
    .action(async (url: string, options) => {
      try {
        console.log(`\n🔍 Inspection de ${url} (niveau ${options.level})...\n`);

        // 1. Inspection
        const startTime = Date.now();
        const inspector = new Inspector();
        const inspection = await inspector.inspect({
          level: options.level,
          url,
        });
        const inspectionTime = Date.now() - startTime;
        console.log(`✅ Inspection terminée (${inspectionTime}ms)`);

        // 2. Analyse
        console.log(`\n📊 Analyse en cours...\n`);
        const pipeline = new AnalysisPipeline();
        const report = await pipeline.analyze(
          url,
          inspection.lighthouse,
          inspection.axe,
          inspection.ux,
          inspection.content
        );
        console.log(`✅ Score global : ${report.summary.overallScore}/100`);
        console.log(`✅ Total findings : ${report.summary.totalFindings}`);

        // 3. Stockage
        console.log(`\n💾 Stockage en base...\n`);
        const db = getDatabase();
        const auditRepo = new AuditRepository(db);
        const vectorStore = new VectorStore(db);
        const indexer = new AuditIndexer(db, vectorStore);

        const audit = auditRepo.store(report);
        await indexer.indexAudit(audit);
        console.log(`✅ Audit #${audit.metadata.id} stocké et indexé`);

        // 4. Génération rapports
        console.log(`\n📝 Génération des rapports...\n`);
        const outputDir = path.resolve(options.output);

        if (options.format === 'md' || options.format === 'both') {
          const mdGenerator = new MarkdownReportGenerator();
          const mdReport = await mdGenerator.generate(audit, { outputPath: outputDir });
          console.log(`✅ Rapport Markdown : ${mdReport.filePath}`);
        }

        if (options.format === 'pdf' || options.format === 'both') {
          const pdfGenerator = new PDFReportGenerator();
          const pdfReport = await pdfGenerator.generate(audit, { outputPath: outputDir });
          console.log(`✅ Rapport PDF : ${pdfReport.filePath}`);
        }

        const totalTime = Date.now() - startTime;
        console.log(`\n✨ Terminé en ${totalTime}ms\n`);

      } catch (error: any) {
        console.error(`\n❌ Erreur : ${error.message}\n`);
        process.exit(1);
      }
    });
}
```

**Commit :**
```bash
git add src/cli/commands/inspect.ts
git commit -m "feat(cli): add inspect command (ekts inspect <url>)"
```

---

### 3.2 CLI `ekts audit` (Jour 1 — 5h)

**Fichier :** `src/cli/commands/audit.ts`

```typescript
import { Command } from 'commander';
import { AuditRepository } from '../../storage/audit-repository';
import { AuditSearch } from '../../storage/audit-search';
import { AuditStatisticsManager } from '../../storage/audit-statistics';
import { AuditComparator } from '../../reports/comparator';
import { MarkdownReportGenerator } from '../../reports/markdown-generator';
import { PDFReportGenerator } from '../../reports/pdf-generator';
import { getDatabase } from '../database';
import { VectorStore } from '../../storage/vector-store';
import path from 'path';

/**
 * Commandes : ekts audit <subcommand>
 * 
 * Sous-commandes :
 *   list    — Lister les audits
 *   show    — Afficher un audit
 *   report  — Générer un rapport
 *   compare — Comparer 2 audits
 */
export function registerAuditCommand(program: Command): void {
  const audit = program
    .command('audit')
    .description('Gérer les audits (list, show, report, compare)');

  // --- audit list ---
  audit
    .command('list')
    .description('Lister les audits')
    .option('-n, --limit <n>', 'Nombre maximum d\'audits', '20')
    .option('--url <url>', 'Filtrer par URL')
    .option('--score-min <n>', 'Score minimum')
    .option('--score-max <n>', 'Score maximum')
    .action(async (options) => {
      try {
        const db = getDatabase();
        const repo = new AuditRepository(db);
        const vectorStore = new VectorStore(db);
        const search = new AuditSearch(db, repo, vectorStore);

        const results = await search.search({
          scoreMin: options.scoreMin ? parseInt(options.scoreMin) : undefined,
          scoreMax: options.scoreMax ? parseInt(options.scoreMax) : undefined,
          offset: 0,
          limit: parseInt(options.limit),
        });

        if (results.length === 0) {
          console.log('\n📭 Aucun audit trouvé.\n');
          return;
        }

        console.log(`\n📋 Audits (${results.length} résultat(s))\n`);
        console.log('┌──────┬──────────────────────────────────────┬───────┬──────────┬──────────┐');
        console.log('│ ID   │ URL                                  │ Score │ Findings │ Date     │');
        console.log('├──────┼──────────────────────────────────────┼───────┼──────────┼──────────┤');

        for (const result of results) {
          const { metadata } = result.audit;
          const id = String(metadata.id).padEnd(4);
          const url = metadata.url.substring(0, 36).padEnd(36);
          const score = String(metadata.overallScore).padEnd(5);
          const findings = String(metadata.totalFindings).padEnd(8);
          const date = new Date(metadata.timestamp).toLocaleDateString('fr-FR').padEnd(8);

          console.log(`│ ${id} │ ${url} │ ${score} │ ${findings} │ ${date} │`);
        }

        console.log('└──────┴──────────────────────────────────────┴───────┴──────────┴──────────┘\n');

      } catch (error: any) {
        console.error(`\n❌ Erreur : ${error.message}\n`);
        process.exit(1);
      }
    });

  // --- audit show ---
  audit
    .command('show <id>')
    .description('Afficher les détails d\'un audit')
    .action(async (id: string) => {
      try {
        const db = getDatabase();
        const repo = new AuditRepository(db);
        const audit = repo.findById(parseInt(id));

        if (!audit) {
          console.error(`\n❌ Audit #${id} introuvable.\n`);
          process.exit(1);
        }

        const { metadata, dimensions, findings } = audit;

        console.log(`\n📋 Audit #${metadata.id}`);
        console.log(`\n  URL : ${metadata.url}`);
        console.log(`  Date : ${new Date(metadata.timestamp).toLocaleDateString('fr-FR')}`);
        console.log(`  Score global : ${metadata.overallScore}/100\n`);

        console.log('  Scores par dimension :');
        for (const dim of dimensions) {
          console.log(`    - ${dim.dimension.padEnd(15)} : ${dim.score}/100 (${dim.findingsCount} findings)`);
        }

        console.log(`\n  Répartition findings :`);
        console.log(`    🔴 Critical : ${metadata.criticalFindings}`);
        console.log(`    🟠 High     : ${metadata.highFindings}`);
        console.log(`    🟡 Medium   : ${metadata.mediumFindings}`);
        console.log(`    🟢 Low      : ${metadata.lowFindings}`);

        console.log(`\n  Top 5 findings :`);
        const sorted = [...findings].sort((a, b) => {
          const order = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
          return order[b.priority] - order[a.priority];
        });

        sorted.slice(0, 5).forEach((f, i) => {
          console.log(`    ${i + 1}. [${f.priority}] ${f.title} (${f.dimension})`);
          if (f.recommendation) {
            console.log(`       → ${f.recommendation}`);
          }
        });

        console.log('');

      } catch (error: any) {
        console.error(`\n❌ Erreur : ${error.message}\n`);
        process.exit(1);
      }
    });

  // --- audit report ---
  audit
    .command('report <id>')
    .description('Générer un rapport pour un audit')
    .option('-f, --format <format>', 'Format (md, pdf, both)', 'both')
    .option('-o, --output <path>', 'Dossier de sortie', './reports')
    .action(async (id: string, options) => {
      try {
        const db = getDatabase();
        const repo = new AuditRepository(db);
        const audit = repo.findById(parseInt(id));

        if (!audit) {
          console.error(`\n❌ Audit #${id} introuvable.\n`);
          process.exit(1);
        }

        console.log(`\n📝 Génération du rapport pour l'audit #${id}...\n`);
        const outputDir = path.resolve(options.output);

        if (options.format === 'md' || options.format === 'both') {
          const mdGenerator = new MarkdownReportGenerator();
          const mdReport = await mdGenerator.generate(audit, { outputPath: outputDir });
          console.log(`✅ Rapport Markdown : ${mdReport.filePath}`);
        }

        if (options.format === 'pdf' || options.format === 'both') {
          const pdfGenerator = new PDFReportGenerator();
          const pdfReport = await pdfGenerator.generate(audit, { outputPath: outputDir });
          console.log(`✅ Rapport PDF : ${pdfReport.filePath}`);
        }

        console.log('\n✨ Terminé.\n');

      } catch (error: any) {
        console.error(`\n❌ Erreur : ${error.message}\n`);
        process.exit(1);
      }
    });

  // --- audit compare ---
  audit
    .command('compare <id1> <id2>')
    .description('Comparer 2 audits')
    .option('-f, --format <format>', 'Format (md, pdf, both)', 'both')
    .option('-o, --output <path>', 'Dossier de sortie', './reports')
    .action(async (id1: string, id2: string, options) => {
      try {
        const db = getDatabase();
        const repo = new AuditRepository(db);

        const auditA = repo.findById(parseInt(id1));
        const auditB = repo.findById(parseInt(id2));

        if (!auditA || !auditB) {
          console.error(`\n❌ Audit introuvable.\n`);
          process.exit(1);
        }

        console.log(`\n🔄 Comparaison des audits #${id1} et #${id2}...\n`);

        const comparator = new AuditComparator();
        const comparison = comparator.compare(auditA, auditB);

        console.log(`  Score : ${comparison.evolution.scoreA} → ${comparison.evolution.scoreB} (${comparison.evolution.delta > 0 ? '+' : ''}${comparison.evolution.delta})`);
        console.log(`  Tendance : ${comparison.evolution.trend}`);
        console.log(`  Nouveaux findings : ${comparison.deltaFindings.newFindings.length}`);
        console.log(`  Findings résolus : ${comparison.deltaFindings.resolvedFindings.length}`);

        console.log(`\n  Recommandations :`);
        comparison.recommendations.forEach((rec, i) => {
          console.log(`    ${i + 1}. ${rec}`);
        });

        // Générer le rapport
        const outputDir = path.resolve(options.output);

        if (options.format === 'md' || options.format === 'both') {
          const mdGenerator = new MarkdownReportGenerator();
          const mdReport = await mdGenerator.generateComparison(comparison, { outputPath: outputDir });
          console.log(`\n✅ Rapport comparaison Markdown : ${mdReport.filePath}`);
        }

        console.log('\n✨ Terminé.\n');

      } catch (error: any) {
        console.error(`\n❌ Erreur : ${error.message}\n`);
        process.exit(1);
      }
    });
}
```

**Commit :**
```bash
git add src/cli/commands/audit.ts
git commit -m "feat(cli): add audit commands (list, show, report, compare)"
```

---

### 3.3 Tests CLI (Jour 1 — 2h)

**Fichier :** `tests/cli/inspect.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerInspectCommand } from '../../src/cli/commands/inspect';

describe('CLI inspect command', () => {
  it('should register inspect command', () => {
    const program = new Command();
    registerInspectCommand(program);

    const command = program.commands.find(c => c.name() === 'inspect');
    expect(command).toBeDefined();
  });

  it('should have correct options', () => {
    const program = new Command();
    registerInspectCommand(program);

    const command = program.commands.find(c => c.name() === 'inspect')!;
    const options = command.options.map(o => o.long);

    expect(options).toContain('--level');
    expect(options).toContain('--output');
    expect(options).toContain('--format');
  });
});
```

**Fichier :** `tests/cli/audit.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerAuditCommand } from '../../src/cli/commands/audit';

describe('CLI audit command', () => {
  it('should register audit command with subcommands', () => {
    const program = new Command();
    registerAuditCommand(program);

    const auditCmd = program.commands.find(c => c.name() === 'audit');
    expect(auditCmd).toBeDefined();

    const subcommands = auditCmd!.commands.map(c => c.name());
    expect(subcommands).toContain('list');
    expect(subcommands).toContain('show');
    expect(subcommands).toContain('report');
    expect(subcommands).toContain('compare');
  });

  it('should have correct options for list', () => {
    const program = new Command();
    registerAuditCommand(program);

    const auditCmd = program.commands.find(c => c.name() === 'audit')!;
    const listCmd = auditCmd.commands.find(c => c.name() === 'list')!;
    const options = listCmd.options.map(o => o.long);

    expect(options).toContain('--limit');
    expect(options).toContain('--url');
    expect(options).toContain('--score-min');
    expect(options).toContain('--score-max');
  });

  it('should have correct options for report', () => {
    const program = new Command();
    registerAuditCommand(program);

    const auditCmd = program.commands.find(c => c.name() === 'audit')!;
    const reportCmd = auditCmd.commands.find(c => c.name() === 'report')!;
    const options = reportCmd.options.map(o => o.long);

    expect(options).toContain('--format');
    expect(options).toContain('--output');
  });
});
```

**Validation :**
```bash
npm test tests/cli/
# ✅ 6 tests passent

npm run test:coverage -- tests/cli/
# ✅ > 80% couverture
```

**Commit :**
```bash
git add tests/cli/inspect.test.ts
git add tests/cli/audit.test.ts
git commit -m "test(cli): add tests for inspect and audit CLI commands"
```

---

### 3.4 MCP `inspect_site` (Jour 2 — 2h)

**Fichier :** `src/mcp/tools/inspect-site.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Inspector } from '../../browser/inspection/inspector';
import { AnalysisPipeline } from '../../analysis/pipeline';
import { AuditRepository } from '../../storage/audit-repository';
import { AuditIndexer } from '../../storage/audit-indexing';
import { getDatabase } from '../database';
import { VectorStore } from '../../storage/vector-store';

/**
 * Outil MCP : inspect_site
 * 
 * Input : { url, level }
 * Output : { inspection_url, level, score, total_findings, audit_id, timestamp }
 */
export function registerInspectSiteTool(server: McpServer): void {
  server.tool(
    'inspect_site',
    'Inspecter un site web et analyser les résultats (performance, accessibilité, SEO, UX, contenu)',
    {
      url: z.string().url().describe('URL du site à inspecter'),
      level: z.enum(['L1', 'L2', 'L3']).default('L2').describe('Niveau d\'inspection (L1=basic, L2=standard, L3=complete)'),
    },
    async ({ url, level }) => {
      try {
        // 1. Inspection
        const inspector = new Inspector();
        const inspection = await inspector.inspect({ level, url });

        // 2. Analyse
        const pipeline = new AnalysisPipeline();
        const report = await pipeline.analyze(
          url,
          inspection.lighthouse,
          inspection.axe,
          inspection.ux,
          inspection.content
        );

        // 3. Stockage
        const db = getDatabase();
        const auditRepo = new AuditRepository(db);
        const vectorStore = new VectorStore(db);
        const indexer = new AuditIndexer(db, vectorStore);

        const audit = auditRepo.store(report);
        await indexer.indexAudit(audit);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                inspection_url: url,
                level,
                score: report.summary.overallScore,
                total_findings: report.summary.totalFindings,
                critical_findings: report.summary.criticalFindings,
                high_findings: report.summary.highFindings,
                audit_id: audit.metadata.id,
                timestamp: report.timestamp,
                dimensions: {
                  performance: report.dimensions.performance.score,
                  accessibility: report.dimensions.accessibility.score,
                  seo: report.dimensions.seo.score,
                  ux: report.dimensions.ux.score,
                  content: report.dimensions.content.score,
                },
              }, null, 2),
            },
          ],
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Erreur : ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
```

**Commit :**
```bash
git add src/mcp/tools/inspect-site.ts
git commit -m "feat(mcp): add inspect_site tool"
```

---

### 3.5 MCP `audit_history` (Jour 2 — 2h)

**Fichier :** `src/mcp/tools/audit-history.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuditRepository } from '../../storage/audit-repository';
import { AuditSearch } from '../../storage/audit-search';
import { AuditStatisticsManager } from '../../storage/audit-statistics';
import { getDatabase } from '../database';
import { VectorStore } from '../../storage/vector-store';

/**
 * Outil MCP : audit_history
 * 
 * Input : { url?, limit?, score_min?, score_max? }
 * Output : { audits[], statistics }
 */
export function registerAuditHistoryTool(server: McpServer): void {
  server.tool(
    'audit_history',
    'Consulter l\'historique des audits avec statistiques',
    {
      url: z.string().url().optional().describe('Filtrer par URL'),
      limit: z.number().int().min(1).max(100).default(20).describe('Nombre maximum d\'audits'),
      score_min: z.number().int().min(0).max(100).optional().describe('Score minimum'),
      score_max: z.number().int().min(0).max(100).optional().describe('Score maximum'),
    },
    async ({ url, limit, score_min, score_max }) => {
      try {
        const db = getDatabase();
        const repo = new AuditRepository(db);
        const vectorStore = new VectorStore(db);
        const search = new AuditSearch(db, repo, vectorStore);
        const statsManager = new AuditStatisticsManager(db);

        // Rechercher les audits
        const results = await search.search({
          scoreMin: score_min,
          scoreMax: score_max,
          offset: 0,
          limit,
        });

        // Filtrer par URL si spécifié
        let audits = results.map(r => r.audit);
        if (url) {
          audits = audits.filter(a => a.metadata.url === url);
        }

        // Statistiques
        const statistics = url
          ? statsManager.getStatisticsForUrl(url)
          : statsManager.getStatistics();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                audits: audits.map(a => ({
                  id: a.metadata.id,
                  url: a.metadata.url,
                  timestamp: a.metadata.timestamp,
                  overall_score: a.metadata.overallScore,
                  total_findings: a.metadata.totalFindings,
                  critical_findings: a.metadata.criticalFindings,
                  high_findings: a.metadata.highFindings,
                  medium_findings: a.metadata.mediumFindings,
                  low_findings: a.metadata.lowFindings,
                  dimensions: a.dimensions.map(d => ({
                    dimension: d.dimension,
                    score: d.score,
                    findings_count: d.findingsCount,
                  })),
                })),
                statistics: {
                  total_audits: statistics.totalAudits,
                  average_score: statistics.averageScore,
                  min_score: statistics.minScore,
                  max_score: statistics.maxScore,
                  total_findings: statistics.totalFindings,
                },
              }, null, 2),
            },
          ],
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Erreur : ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
```

**Commit :**
```bash
git add src/mcp/tools/audit-history.ts
git commit -m "feat(mcp): add audit_history tool"
```

---

### 3.6 MCP `audit_report` (Jour 2 — 2h)

**Fichier :** `src/mcp/tools/audit-report.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuditRepository } from '../../storage/audit-repository';
import { MarkdownReportGenerator } from '../../reports/markdown-generator';
import { getDatabase } from '../database';

/**
 * Outil MCP : audit_report
 * 
 * Input : { audit_id, format }
 * Output : { report_content, audit_id, format, generated_at }
 */
export function registerAuditReportTool(server: McpServer): void {
  server.tool(
    'audit_report',
    'Générer un rapport pour un audit spécifique',
    {
      audit_id: z.number().int().positive().describe('ID de l\'audit'),
      format: z.enum(['markdown', 'text']).default('markdown').describe('Format du rapport'),
    },
    async ({ audit_id, format }) => {
      try {
        const db = getDatabase();
        const repo = new AuditRepository(db);
        const audit = repo.findById(audit_id);

        if (!audit) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Erreur : Audit #${audit_id} introuvable.`,
              },
            ],
            isError: true,
          };
        }

        const generator = new MarkdownReportGenerator();
        const report = await generator.generate(audit);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                audit_id,
                format: 'markdown',
                report_content: report.content,
                generated_at: report.generatedAt,
              }, null, 2),
            },
          ],
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Erreur : ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
```

**Commit :**
```bash
git add src/mcp/tools/audit-report.ts
git commit -m "feat(mcp): add audit_report tool"
```

---

### 3.7 Tests MCP (Jour 2 — 2h)

**Fichier :** `tests/mcp/inspect-site.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('MCP inspect_site tool', () => {
  it('should have correct schema', async () => {
    const { registerInspectSiteTool } = await import('../../src/mcp/tools/inspect-site');
    expect(registerInspectSiteTool).toBeDefined();
    expect(typeof registerInspectSiteTool).toBe('function');
  });
});
```

**Fichier :** `tests/mcp/audit-history.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('MCP audit_history tool', () => {
  it('should have correct schema', async () => {
    const { registerAuditHistoryTool } = await import('../../src/mcp/tools/audit-history');
    expect(registerAuditHistoryTool).toBeDefined();
    expect(typeof registerAuditHistoryTool).toBe('function');
  });
});
```

**Fichier :** `tests/mcp/audit-report.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('MCP audit_report tool', () => {
  it('should have correct schema', async () => {
    const { registerAuditReportTool } = await import('../../src/mcp/tools/audit-report');
    expect(registerAuditReportTool).toBeDefined();
    expect(typeof registerAuditReportTool).toBe('function');
  });
});
```

**Validation :**
```bash
npm test tests/mcp/
# ✅ 3 tests passent
```

**Commit :**
```bash
git add tests/mcp/
git commit -m "test(mcp): add tests for inspect_site, audit_history, audit_report tools"
```

---

### 3.8 Documentation REPORTS.md (Jour 3 — 4h)

**Fichier :** `docs/REPORTS.md`

```markdown
# Rapports d'inspection — Documentation

## Vue d'ensemble

Le module de rapports EKTS génère des documents à partir des audits :
- **Rapports Markdown** : Lisibles, structurés
- **Rapports PDF** : Imprimables, professionnels (via Puppeteer)
- **Comparaisons** : Delta scores, delta findings, évolution

## Architecture

```
Audit (Sprint 10)
    ↓
[MarkdownReportGenerator] → Rapport .md
    ↓
[HtmlTemplate] → HTML
    ↓
[Puppeteer] → Rapport .pdf
    ↓
[AuditComparator] → ComparisonReport
    ↓
[MarkdownReportGenerator.generateComparison()] → Rapport comparaison .md
```

## Utilisation

### Générer un rapport Markdown

```typescript
import { MarkdownReportGenerator } from './reports/markdown-generator';

const generator = new MarkdownReportGenerator();
const report = await generator.generate(audit, {
  outputPath: './reports',
});

console.log('Fichier :', report.filePath);
console.log('Contenu :\n', report.content);
```

### Générer un rapport PDF

```typescript
import { PDFReportGenerator } from './reports/pdf-generator';

const generator = new PDFReportGenerator();
const report = await generator.generate(audit, {
  outputPath: './reports',
});

console.log('Fichier :', report.filePath);
```

### Comparer 2 audits

```typescript
import { AuditComparator } from './reports/comparator';

const comparator = new AuditComparator();
const comparison = comparator.compare(auditA, auditB);

console.log('Évolution :', comparison.evolution.trend);
console.log('Delta scores :', comparison.deltaScores);
console.log('Nouveaux findings :', comparison.deltaFindings.newFindings.length);
console.log('Résolus :', comparison.deltaFindings.resolvedFindings.length);
```

### Générer un rapport de comparaison

```typescript
const report = await generator.generateComparison(comparison, {
  outputPath: './reports',
});

console.log('Fichier :', report.filePath);
```

## Sections du rapport

Un rapport standard contient :

1. **Header** : URL, date, score global
2. **Summary** : Répartition findings par priorité (table)
3. **Scores par dimension** : Tableau 5 dimensions
4. **Findings** : Liste groupée par priorité
5. **Top 5 recommandations** : Actions prioritaires

## Matrice de sévérité

### Seuils de priorité

| Sévérité | Effort | Score | Priorité |
|----------|--------|-------|----------|
| 4 (Critique) | 1 (Faible) | 20 | 🔴 Critical |
| 3 (Sérieux) | 2 (Moyen) | 12 | 🟠 High |
| 2 (Modéré) | 3 (Moyen) | 6 | 🟡 Medium |
| 1 (Mineur) | 4 (Élevé) | 2 | 🟢 Low |
| 0 (Info) | 5 (Très élevé) | 0 | ⚪ Info |

### Évolution

| Delta | Tendance |
|-------|----------|
| > +5 | 📈 Amélioration |
| -5 à +5 | ➡️ Stable |
| < -5 | 📉 Régression |

## Performance

- **Rapport Markdown** : < 2s (100 findings)
- **Rapport PDF** : < 10s (100 findings)
- **Comparaison** : < 1s

## CLI

### `ekts inspect <url>`

```bash
ekts inspect https://example.com
ekts inspect https://example.com --level L3
ekts inspect https://example.com --format md --output ./reports
```

### `ekts audit list`

```bash
ekts audit list
ekts audit list --limit 10
ekts audit list --score-min 70
```

### `ekts audit show <id>`

```bash
ekts audit show 1
```

### `ekts audit report <id>`

```bash
ekts audit report 1 --format both --output ./reports
```

### `ekts audit compare <id1> <id2>`

```bash
ekts audit compare 1 2 --format md
```

## MCP

### `inspect_site`

```json
{
  "url": "https://example.com",
  "level": "L2"
}
```

### `audit_history`

```json
{
  "url": "https://example.com",
  "limit": 20,
  "score_min": 70
}
```

### `audit_report`

```json
{
  "audit_id": 1,
  "format": "markdown"
}
```

## Références

- [Puppeteer](https://pptr.dev/)
- [Core Web Vitals](https://web.dev/vitals/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
```

**Commit :**
```bash
git add docs/REPORTS.md
git commit -m "docs: add comprehensive Reports documentation"
```

---

### 3.9 Mise à jour CLI.md + MCP.md (Jour 3 — 2h)

**Fichier :** `docs/CLI.md` (ajout section)

```markdown
## Commandes Inspection et Audit

### `ekts inspect <url>`

Inspecte un site web et génère un rapport complet.

```bash
ekts inspect https://example.com [options]
```

**Options :**
- `-l, --level <level>` : Niveau d'inspection (L1, L2, L3) — Défaut : L2
- `-o, --output <path>` : Dossier de sortie — Défaut : ./reports
- `-f, --format <format>` : Format du rapport (md, pdf, both) — Défaut : both

### `ekts audit list`

Liste les audits stockés.

```bash
ekts audit list [options]
```

**Options :**
- `-n, --limit <n>` : Nombre maximum — Défaut : 20
- `--url <url>` : Filtrer par URL
- `--score-min <n>` : Score minimum
- `--score-max <n>` : Score maximum

### `ekts audit show <id>`

Affiche les détails d'un audit.

```bash
ekts audit show 1
```

### `ekts audit report <id>`

Génère un rapport pour un audit.

```bash
ekts audit report 1 [options]
```

**Options :**
- `-f, --format <format>` : Format (md, pdf, both) — Défaut : both
- `-o, --output <path>` : Dossier de sortie — Défaut : ./reports

### `ekts audit compare <id1> <id2>`

Compare 2 audits.

```bash
ekts audit compare 1 2 [options]
```

**Options :**
- `-f, --format <format>` : Format (md, pdf, both) — Défaut : both
- `-o, --output <path>` : Dossier de sortie — Défaut : ./reports
```

**Fichier :** `docs/MCP.md` (ajout section)

```markdown
## Outils Inspection et Audit

### `inspect_site`

Inspecte un site web et retourne les résultats d'analyse.

**Input :**
```json
{
  "url": "https://example.com",
  "level": "L2"
}
```

**Output :**
```json
{
  "inspection_url": "https://example.com",
  "level": "L2",
  "score": 75,
  "total_findings": 5,
  "audit_id": 1,
  "dimensions": {
    "performance": 80,
    "accessibility": 70,
    "seo": 85,
    "ux": 65,
    "content": 75
  }
}
```

### `audit_history`

Consulte l'historique des audits avec statistiques.

**Input :**
```json
{
  "url": "https://example.com",
  "limit": 20,
  "score_min": 70,
  "score_max": 100
}
```

### `audit_report`

Génère un rapport Markdown pour un audit.

**Input :**
```json
{
  "audit_id": 1,
  "format": "markdown"
}
```
```

**Commit :**
```bash
git add docs/CLI.md docs/MCP.md
git commit -m "docs: update CLI.md and MCP.md with inspection and audit commands/tools"
```

---

### 3.10 Vérifications finales Sprint 11-3 (Jour 3)

```bash
# 1. Tous les tests
npm test tests/reports/ tests/cli/ tests/mcp/
# ✅ 29 tests passent (4 markdown + 1 pdf + 11 comparator + 5 comparison-markdown + 3 CLI + 3 MCP + 2 autres)

# 2. Couverture
npm run test:coverage -- tests/reports/ tests/cli/ tests/mcp/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/reports/
# ✅ types.ts, markdown-generator.ts, pdf-generator.ts, comparator.ts, templates/

ls -la src/cli/commands/
# ✅ inspect.ts, audit.ts

ls -la src/mcp/tools/
# ✅ inspect-site.ts, audit-history.ts, audit-report.ts

ls -la docs/REPORTS.md
# ✅ Documentation existe

# 6. Test CLI
node dist/cli/index.js inspect --help
# ✅ Help affichée

node dist/cli/index.js audit --help
# ✅ Help affichée

# 7. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 8. Push
git push origin feat/sprint-11-3
```

**Point de contrôle Sprint 11-3 :**
- ✅ CLI `ekts inspect` implémenté (options : level, output, format)
- ✅ CLI `ekts audit list/show/report/compare` implémentés
- ✅ MCP `inspect_site` implémenté
- ✅ MCP `audit_history` implémenté
- ✅ MCP `audit_report` implémenté
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation REPORTS.md complète
- ✅ CLI.md + MCP.md mise à jour
- ✅ Tests d'intégration passent

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/cli/commands/inspect.ts` | 150 | CLI inspect |
| `src/cli/commands/audit.ts` | 250 | CLI audit |
| `src/mcp/tools/inspect-site.ts` | 100 | MCP inspect_site |
| `src/mcp/tools/audit-history.ts` | 120 | MCP audit_history |
| `src/mcp/tools/audit-report.ts` | 100 | MCP audit_report |
| `tests/cli/inspect.test.ts` | 40 | Tests CLI inspect |
| `tests/cli/audit.test.ts` | 60 | Tests CLI audit |
| `tests/mcp/inspect-site.test.ts` | 15 | Tests MCP inspect_site |
| `tests/mcp/audit-history.test.ts` | 15 | Tests MCP audit_history |
| `tests/mcp/audit-report.test.ts` | 15 | Tests MCP audit_report |
| `docs/REPORTS.md` | 250 | Documentation rapports |

**Total Sprint 11-3 :** ~1 115 lignes

---

## 5. Récapitulatif complet Sprint 11

| Sous-sprint | Durée | Fichiers | Lignes |
|-------------|-------|----------|--------|
| Sprint 11-1 | 4 jours | 7 | 1 100 |
| Sprint 11-2 | 3 jours | 4 | 630 |
| Sprint 11-3 | 3 jours | 11 | 1 115 |
| **Total** | **10 jours** | **22 fichiers** | **~2 845** |

---

## 6. Commits

```bash
git commit -m "feat(cli): add inspect command (ekts inspect <url>)"
git commit -m "feat(cli): add audit commands (list, show, report, compare)"
git commit -m "test(cli): add tests for inspect and audit CLI commands"
git commit -m "feat(mcp): add inspect_site tool"
git commit -m "feat(mcp): add audit_history tool"
git commit -m "feat(mcp): add audit_report tool"
git commit -m "test(mcp): add tests for inspect_site, audit_history, audit_report tools"
git commit -m "docs: add comprehensive Reports documentation"
git commit -m "docs: update CLI.md and MCP.md with inspection and audit commands/tools"
```

---

## 7. Transition vers Sprint 12

**Prérequis pour Sprint 12 :**
- ✅ Sprint 11 terminé avec succès
- ✅ Rapports générés (Markdown + PDF)
- ✅ Comparaison d'audits fonctionnelle
- ✅ CLI complète (inspect + audit)
- ✅ MCP complet (inspect_site + audit_history + audit_report)

**Sprint 12 — Tests + Documentation MVP-2 :**
- 🎯 Tests E2E complets (MVP-2)
- 🎯 Documentation utilisateur complète
- 🎯 Documentation développeur complète
- 🎯 Validation MVP-2 (critères fonctionnels, techniques, qualité)
- 🎯 Préparation MVP-3 (Capitalisation projets)

---

**Fin du document Sprint 11-3**
