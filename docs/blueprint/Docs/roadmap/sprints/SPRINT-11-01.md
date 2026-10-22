# Sprint 11-1 — Rapports Markdown + PDF (Semaine 21, Jours 1-4)

**Durée :** 4 jours  
**Objectif :** Implémenter les générateurs de rapports Markdown et PDF  
**Dépendance :** Sprint 10 (Stockage + Indexation) ✅

---

## 1. Contexte

Le **Sprint 10** a implémenté :
- ✅ Tables SQLite (audit_metadata, audit_dimensions, audit_findings)
- ✅ AuditRepository (store, findById, findByUrl, list, delete)
- ✅ AuditIndexer (FTS5 + Vector)
- ✅ AuditSearch (recherche hybride)
- ✅ AuditStatisticsManager (stats, trend, top issues)

Le **Sprint 11-1** va :
- 🎯 Définir les types pour les rapports
- 🎯 Implémenter le template Markdown
- 🎯 Implémenter MarkdownReportGenerator
- 🎯 Implémenter le template HTML
- 🎯 Implémenter PDFReportGenerator (Puppeteer)
- 🎯 Tests unitaires

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── reports/
│   │   ├── types.ts                  (à créer)
│   │   ├── templates/
│   │   │   ├── markdown.ts           (à créer)
│   │   │   └── html.ts               (à créer)
│   │   ├── markdown-generator.ts     (à créer)
│   │   └── pdf-generator.ts          (à créer)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Types Reports (Jour 1 — 2h)

**Fichier :** `src/reports/types.ts`

```typescript
import { Audit, AuditDimension, AuditFinding } from '../storage/audit-types';

/**
 * Options de génération de rapport
 */
export interface ReportOptions {
  format: 'markdown' | 'pdf' | 'both';
  outputPath?: string;
  includeSections?: ReportSection[];
  title?: string;
}

/**
 * Sections disponibles dans un rapport
 */
export type ReportSection =
  | 'header'
  | 'summary'
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'ux'
  | 'content'
  | 'findings'
  | 'recommendations';

/**
 * Rapport généré
 */
export interface GeneratedReport {
  auditId: number;
  format: 'markdown' | 'pdf';
  content: string;
  filePath?: string;
  generatedAt: string;
}

/**
 * Rapport de comparaison
 */
export interface ComparisonReport {
  auditA: Audit;
  auditB: Audit;
  deltaScores: DimensionDelta[];
  deltaFindings: FindingsDelta;
  evolution: ScoreEvolution;
  recommendations: string[];
}

/**
 * Delta de score par dimension
 */
export interface DimensionDelta {
  dimension: string;
  scoreA: number;
  scoreB: number;
  delta: number;
  percentage: number;
}

/**
 * Delta de findings
 */
export interface FindingsDelta {
  newFindings: AuditFinding[];
  resolvedFindings: AuditFinding[];
  persistentFindings: AuditFinding[];
  improvedFindings: AuditFinding[];
}

/**
 * Évolution du score global
 */
export interface ScoreEvolution {
  scoreA: number;
  scoreB: number;
  delta: number;
  percentage: number;
  trend: 'improving' | 'degrading' | 'stable';
}
```

**Validation :**
```bash
tsc --noEmit
# ✅ Aucune erreur
```

**Commit :**
```bash
git add src/reports/types.ts
git commit -m "feat(reports): add report types (ReportOptions, ComparisonReport)"
```

---

### 3.2 Template Markdown (Jour 1 — 4h)

**Fichier :** `src/reports/templates/markdown.ts`

```typescript
import { Audit } from '../../storage/audit-types';
import { ComparisonReport } from '../types';

/**
 * Template Markdown pour les rapports d'audit
 */
export class MarkdownTemplate {
  /**
   * Génère le rapport complet en Markdown
   */
  generateReport(audit: Audit): string {
    const sections = [
      this.generateHeader(audit),
      this.generateSummary(audit),
      this.generateDimensions(audit),
      this.generateFindings(audit),
      this.generateRecommendations(audit),
    ];

    return sections.join('\n\n');
  }

  /**
   * Génère l'en-tête
   */
  generateHeader(audit: Audit): string {
    const date = new Date(audit.metadata.timestamp).toLocaleDateString('fr-FR');
    const scoreEmoji = this.getScoreEmoji(audit.metadata.overallScore);

    return `# Rapport d'audit — ${audit.metadata.url}

**Date :** ${date}  
**Score global :** ${audit.metadata.overallScore}/100 ${scoreEmoji}  
**Total findings :** ${audit.metadata.totalFindings}
`;
  }

  /**
   * Génère le résumé
   */
  generateSummary(audit: Audit): string {
    const { criticalFindings, highFindings, mediumFindings, lowFindings } = audit.metadata;

    return `## Résumé

| Priorité | Nombre |
|----------|--------|
| 🔴 Critical | ${criticalFindings} |
| 🟠 High | ${highFindings} |
| 🟡 Medium | ${mediumFindings} |
| 🟢 Low | ${lowFindings} |
`;
  }

  /**
   * Génère les scores par dimension
   */
  generateDimensions(audit: Audit): string {
    const dimensionLabels: Record<string, string> = {
      performance: 'Performance',
      accessibility: 'Accessibilité',
      seo: 'SEO',
      ux: 'UX',
      content: 'Contenu',
    };

    const lines = ['## Scores par dimension\n'];
    lines.push('| Dimension | Score | Findings |');
    lines.push('|-----------|-------|----------|');

    for (const dim of audit.dimensions) {
      const label = dimensionLabels[dim.dimension] || dim.dimension;
      const emoji = this.getScoreEmoji(dim.score);
      lines.push(`| ${label} | ${dim.score}/100 ${emoji} | ${dim.findingsCount} |`);
    }

    return lines.join('\n');
  }

  /**
   * Génère la liste des findings
   */
  generateFindings(audit: Audit): string {
    if (audit.findings.length === 0) {
      return '## Findings\n\n✅ Aucun problème identifié.';
    }

    const lines = ['## Findings\n'];

    // Grouper par priorité
    const priorities = ['critical', 'high', 'medium', 'low', 'info'] as const;
    const priorityLabels: Record<string, string> = {
      critical: '🔴 Critical',
      high: '🟠 High',
      medium: '🟡 Medium',
      low: '🟢 Low',
      info: '⚪ Info',
    };

    for (const priority of priorities) {
      const findings = audit.findings.filter(f => f.priority === priority);
      if (findings.length === 0) continue;

      lines.push(`### ${priorityLabels[priority]} (${findings.length})\n`);

      for (const finding of findings) {
        lines.push(`#### ${finding.title}`);
        lines.push(`- **Dimension :** ${finding.dimension}`);
        lines.push(`- **Sévérité :** ${finding.severity}/4`);
        lines.push(`- **Effort :** ${finding.effort}/5`);
        if (finding.description) {
          lines.push(`- **Description :** ${finding.description}`);
        }
        if (finding.recommendation) {
          lines.push(`- **Recommandation :** ${finding.recommendation}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Génère les recommandations
   */
  generateRecommendations(audit: Audit): string {
    // Trier par priorité
    const sorted = [...audit.findings].sort((a, b) => {
      const priorityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const top = sorted.slice(0, 5);

    const lines = ['## Top 5 recommandations\n'];

    top.forEach((finding, index) => {
      lines.push(`${index + 1}. **${finding.title}** (${finding.priority})`);
      if (finding.recommendation) {
        lines.push(`   ${finding.recommendation}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Génère un rapport de comparaison
   */
  generateComparisonReport(comparison: ComparisonReport): string {
    const lines = [
      `# Comparaison d'audits`,
      ``,
      `**Audit A :** ${comparison.auditA.metadata.url} (${new Date(comparison.auditA.metadata.timestamp).toLocaleDateString('fr-FR')})`,
      `**Audit B :** ${comparison.auditB.metadata.url} (${new Date(comparison.auditB.metadata.timestamp).toLocaleDateString('fr-FR')})`,
      ``,
      `## Évolution score global`,
      ``,
      `| Score A | Score B | Delta | Évolution |`,
      `|---------|---------|-------|-----------|`,
      `| ${comparison.evolution.scoreA}/100 | ${comparison.evolution.scoreB}/100 | ${comparison.evolution.delta > 0 ? '+' : ''}${comparison.evolution.delta} | ${this.getEvolutionEmoji(comparison.evolution.trend)} ${comparison.evolution.percentage > 0 ? '+' : ''}${comparison.evolution.percentage}% |`,
      ``,
      `## Delta par dimension`,
      ``,
      `| Dimension | Score A | Score B | Delta | Évolution |`,
      `|-----------|---------|---------|-------|-----------|`,
    ];

    for (const delta of comparison.deltaScores) {
      lines.push(`| ${delta.dimension} | ${delta.scoreA}/100 | ${delta.scoreB}/100 | ${delta.delta > 0 ? '+' : ''}${delta.delta} | ${delta.delta > 0 ? '📈' : delta.delta < 0 ? '📉' : '➡️'} ${delta.percentage > 0 ? '+' : ''}${delta.percentage}% |`);
    }

    lines.push(
      ``,
      `## Delta findings`,
      ``,
      `- 🆕 Nouveaux : ${comparison.deltaFindings.newFindings.length}`,
      `- ✅ Résolus : ${comparison.deltaFindings.resolvedFindings.length}`,
      `- ⚠️ Persistants : ${comparison.deltaFindings.persistentFindings.length}`,
      `- 📈 Améliorés : ${comparison.deltaFindings.improvedFindings.length}`,
      ``,
      `## Recommandations`,
      ``,
    );

    comparison.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });

    return lines.join('\n');
  }

  // Helpers

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  private getEvolutionEmoji(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'degrading': return '📉';
      default: return '➡️';
    }
  }
}
```

**Commit :**
```bash
git add src/reports/templates/markdown.ts
git commit -m "feat(reports): implement MarkdownTemplate for audit reports"
```

---

### 3.3 MarkdownReportGenerator (Jour 2 — 4h)

**Fichier :** `src/reports/markdown-generator.ts`

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { Audit } from '../storage/audit-types';
import { ReportOptions, GeneratedReport } from './types';
import { MarkdownTemplate } from './templates/markdown';
import { ComparisonReport } from './types';

/**
 * Générateur de rapports Markdown
 */
export class MarkdownReportGenerator {
  private template: MarkdownTemplate;

  constructor() {
    this.template = new MarkdownTemplate();
  }

  /**
   * Génère un rapport Markdown
   */
  async generate(audit: Audit, options: Partial<ReportOptions> = {}): Promise<GeneratedReport> {
    const startTime = Date.now();

    // Générer le contenu
    const content = this.template.generateReport(audit);

    // Écrire le fichier si outputPath spécifié
    let filePath: string | undefined;
    if (options.outputPath) {
      const filename = `audit-${audit.metadata.id}-${Date.now()}.md`;
      filePath = path.join(options.outputPath, filename);
      await fs.mkdir(options.outputPath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    }

    const duration = Date.now() - startTime;

    return {
      auditId: audit.metadata.id!,
      format: 'markdown',
      content,
      filePath,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Génère un rapport de comparaison
   */
  async generateComparison(comparison: ComparisonReport, options: Partial<ReportOptions> = {}): Promise<GeneratedReport> {
    const startTime = Date.now();

    // Générer le contenu
    const content = this.template.generateComparisonReport(comparison);

    // Écrire le fichier si outputPath spécifié
    let filePath: string | undefined;
    if (options.outputPath) {
      const filename = `comparison-${comparison.auditA.metadata.id}-${comparison.auditB.metadata.id}-${Date.now()}.md`;
      filePath = path.join(options.outputPath, filename);
      await fs.mkdir(options.outputPath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    }

    const duration = Date.now() - startTime;

    return {
      auditId: comparison.auditB.metadata.id!,
      format: 'markdown',
      content,
      filePath,
      generatedAt: new Date().toISOString(),
    };
  }
}
```

**Tests :** `tests/reports/markdown-generator.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownReportGenerator } from '../../src/reports/markdown-generator';
import { Audit } from '../../src/storage/audit-types';

describe('MarkdownReportGenerator', () => {
  let generator: MarkdownReportGenerator;

  beforeEach(() => {
    generator = new MarkdownReportGenerator();
  });

  const createMockAudit = (): Audit => ({
    metadata: {
      id: 1,
      url: 'https://example.com',
      timestamp: '2024-01-01T00:00:00Z',
      overallScore: 75,
      totalFindings: 5,
      criticalFindings: 1,
      highFindings: 2,
      mediumFindings: 1,
      lowFindings: 1,
    },
    dimensions: [
      { auditId: 1, dimension: 'performance', score: 80, findingsCount: 2 },
      { auditId: 1, dimension: 'accessibility', score: 70, findingsCount: 3 },
      { auditId: 1, dimension: 'seo', score: 85, findingsCount: 1 },
      { auditId: 1, dimension: 'ux', score: 65, findingsCount: 2 },
      { auditId: 1, dimension: 'content', score: 75, findingsCount: 1 },
    ],
    findings: [
      {
        auditId: 1,
        dimension: 'performance',
        title: 'LCP trop élevé',
        description: 'Le LCP est de 4.5s',
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation: 'Optimiser les images',
      },
      {
        auditId: 1,
        dimension: 'accessibility',
        title: 'Contraste insuffisant',
        description: '5 éléments ont un contraste < 4.5:1',
        severity: 4,
        effort: 1,
        impact: 5,
        priority: 'critical',
        recommendation: 'Augmenter le contraste',
      },
    ],
  });

  describe('generate', () => {
    it('should generate Markdown report', async () => {
      const audit = createMockAudit();
      const report = await generator.generate(audit);

      expect(report.format).toBe('markdown');
      expect(report.content).toContain('https://example.com');
      expect(report.content).toContain('75/100');
      expect(report.content).toContain('LCP trop élevé');
      expect(report.content).toContain('Contraste insuffisant');
    });

    it('should include all sections', async () => {
      const audit = createMockAudit();
      const report = await generator.generate(audit);

      expect(report.content).toContain('# Rapport');
      expect(report.content).toContain('## Résumé');
      expect(report.content).toContain('## Scores par dimension');
      expect(report.content).toContain('## Findings');
      expect(report.content).toContain('## Top 5 recommandations');
    });

    it('should handle empty findings', async () => {
      const audit = createMockAudit();
      audit.findings = [];
      audit.metadata.totalFindings = 0;

      const report = await generator.generate(audit);

      expect(report.content).toContain('Aucun problème identifié');
    });
  });
});
```

**Validation :**
```bash
npm test tests/reports/markdown-generator.test.ts
# ✅ 3 tests passent

npm run test:coverage -- tests/reports/markdown-generator.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/reports/markdown-generator.ts
git add tests/reports/markdown-generator.test.ts
git commit -m "feat(reports): implement MarkdownReportGenerator with generate and generateComparison"
```

---

### 3.4 Template HTML (Jour 3 — 4h)

**Fichier :** `src/reports/templates/html.ts`

```typescript
import { Audit } from '../../storage/audit-types';

/**
 * Template HTML pour les rapports PDF
 */
export class HtmlTemplate {
  /**
   * Génère le rapport HTML complet
   */
  generateReport(audit: Audit): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'audit — ${audit.metadata.url}</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${this.generateHeader(audit)}
    ${this.generateSummary(audit)}
    ${this.generateDimensions(audit)}
    ${this.generateFindings(audit)}
    ${this.generateRecommendations(audit)}
  </div>
</body>
</html>`;
  }

  /**
   * Génère les styles CSS
   */
  private getStyles(): string {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 40px auto;
        background: white;
        padding: 40px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1 { color: #2c3e50; margin-bottom: 20px; font-size: 28px; }
      h2 { color: #34495e; margin: 30px 0 15px; font-size: 22px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
      h3 { color: #7f8c8d; margin: 20px 0 10px; font-size: 18px; }
      h4 { color: #2c3e50; margin: 15px 0 8px; font-size: 16px; }
      p { margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
      tr:hover { background: #f8f9fa; }
      .score { font-weight: bold; }
      .score-good { color: #27ae60; }
      .score-medium { color: #f39c12; }
      .score-poor { color: #e74c3c; }
      .priority-critical { color: #e74c3c; font-weight: bold; }
      .priority-high { color: #e67e22; font-weight: bold; }
      .priority-medium { color: #f39c12; }
      .priority-low { color: #27ae60; }
      ul { margin: 10px 0 10px 20px; }
      li { margin: 5px 0; }
      .meta { color: #7f8c8d; font-size: 14px; }
      .finding { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #3498db; }
    `;
  }

  /**
   * Génère l'en-tête
   */
  private generateHeader(audit: Audit): string {
    const date = new Date(audit.metadata.timestamp).toLocaleDateString('fr-FR');
    const scoreClass = this.getScoreClass(audit.metadata.overallScore);

    return `
      <h1>Rapport d'audit — ${audit.metadata.url}</h1>
      <p class="meta"><strong>Date :</strong> ${date}</p>
      <p class="meta"><strong>Score global :</strong> <span class="score ${scoreClass}">${audit.metadata.overallScore}/100</span></p>
      <p class="meta"><strong>Total findings :</strong> ${audit.metadata.totalFindings}</p>
    `;
  }

  /**
   * Génère le résumé
   */
  private generateSummary(audit: Audit): string {
    const { criticalFindings, highFindings, mediumFindings, lowFindings } = audit.metadata;

    return `
      <h2>Résumé</h2>
      <table>
        <thead>
          <tr>
            <th>Priorité</th>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="priority-critical">🔴 Critical</td>
            <td>${criticalFindings}</td>
          </tr>
          <tr>
            <td class="priority-high">🟠 High</td>
            <td>${highFindings}</td>
          </tr>
          <tr>
            <td class="priority-medium">🟡 Medium</td>
            <td>${mediumFindings}</td>
          </tr>
          <tr>
            <td class="priority-low">🟢 Low</td>
            <td>${lowFindings}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  /**
   * Génère les scores par dimension
   */
  private generateDimensions(audit: Audit): string {
    const dimensionLabels: Record<string, string> = {
      performance: 'Performance',
      accessibility: 'Accessibilité',
      seo: 'SEO',
      ux: 'UX',
      content: 'Contenu',
    };

    let rows = '';
    for (const dim of audit.dimensions) {
      const label = dimensionLabels[dim.dimension] || dim.dimension;
      const scoreClass = this.getScoreClass(dim.score);
      rows += `
        <tr>
          <td>${label}</td>
          <td><span class="score ${scoreClass}">${dim.score}/100</span></td>
          <td>${dim.findingsCount}</td>
        </tr>
      `;
    }

    return `
      <h2>Scores par dimension</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Score</th>
            <th>Findings</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  /**
   * Génère la liste des findings
   */
  private generateFindings(audit: Audit): string {
    if (audit.findings.length === 0) {
      return `<h2>Findings</h2><p>✅ Aucun problème identifié.</p>`;
    }

    const priorities = ['critical', 'high', 'medium', 'low', 'info'] as const;
    const priorityLabels: Record<string, string> = {
      critical: '🔴 Critical',
      high: '🟠 High',
      medium: '🟡 Medium',
      low: '🟢 Low',
      info: '⚪ Info',
    };

    let content = '<h2>Findings</h2>';

    for (const priority of priorities) {
      const findings = audit.findings.filter(f => f.priority === priority);
      if (findings.length === 0) continue;

      content += `<h3>${priorityLabels[priority]} (${findings.length})</h3>`;

      for (const finding of findings) {
        content += `
          <div class="finding">
            <h4>${finding.title}</h4>
            <ul>
              <li><strong>Dimension :</strong> ${finding.dimension}</li>
              <li><strong>Sévérité :</strong> ${finding.severity}/4</li>
              <li><strong>Effort :</strong> ${finding.effort}/5</li>
              ${finding.description ? `<li><strong>Description :</strong> ${finding.description}</li>` : ''}
              ${finding.recommendation ? `<li><strong>Recommandation :</strong> ${finding.recommendation}</li>` : ''}
            </ul>
          </div>
        `;
      }
    }

    return content;
  }

  /**
   * Génère les recommandations
   */
  private generateRecommendations(audit: Audit): string {
    const sorted = [...audit.findings].sort((a, b) => {
      const priorityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const top = sorted.slice(0, 5);

    let content = '<h2>Top 5 recommandations</h2><ol>';

    for (const finding of top) {
      content += `<li><strong>${finding.title}</strong> (${finding.priority})`;
      if (finding.recommendation) {
        content += `<br><em>${finding.recommendation}</em>`;
      }
      content += `</li>`;
    }

    content += '</ol>';

    return content;
  }

  // Helpers

  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-good';
    if (score >= 70) return 'score-medium';
    return 'score-poor';
  }
}
```

**Commit :**
```bash
git add src/reports/templates/html.ts
git commit -m "feat(reports): implement HtmlTemplate for PDF reports"
```

---

### 3.5 PDFReportGenerator (Jour 4 — 4h)

**Fichier :** `src/reports/pdf-generator.ts`

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { Audit } from '../storage/audit-types';
import { ReportOptions, GeneratedReport } from './types';
import { HtmlTemplate } from './templates/html';

/**
 * Générateur de rapports PDF
 */
export class PDFReportGenerator {
  private template: HtmlTemplate;

  constructor() {
    this.template = new HtmlTemplate();
  }

  /**
   * Génère un rapport PDF
   */
  async generate(audit: Audit, options: Partial<ReportOptions> = {}): Promise<GeneratedReport> {
    const startTime = Date.now();

    // Générer le HTML
    const html = this.template.generateReport(audit);

    // Convertir en PDF via Puppeteer
    const pdfBuffer = await this.htmlToPdf(html);

    // Écrire le fichier si outputPath spécifié
    let filePath: string | undefined;
    if (options.outputPath) {
      const filename = `audit-${audit.metadata.id}-${Date.now()}.pdf`;
      filePath = path.join(options.outputPath, filename);
      await fs.mkdir(options.outputPath, { recursive: true });
      await fs.writeFile(filePath, pdfBuffer);
    }

    const duration = Date.now() - startTime;

    return {
      auditId: audit.metadata.id!,
      format: 'pdf',
      content: pdfBuffer.toString('base64'),
      filePath,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convertit du HTML en PDF via Puppeteer
   */
  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
```

**Tests :** `tests/reports/pdf-generator.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PDFReportGenerator } from '../../src/reports/pdf-generator';
import { Audit } from '../../src/storage/audit-types';

describe('PDFReportGenerator', () => {
  let generator: PDFReportGenerator;

  beforeEach(() => {
    generator = new PDFReportGenerator();
  });

  const createMockAudit = (): Audit => ({
    metadata: {
      id: 1,
      url: 'https://example.com',
      timestamp: '2024-01-01T00:00:00Z',
      overallScore: 75,
      totalFindings: 5,
      criticalFindings: 1,
      highFindings: 2,
      mediumFindings: 1,
      lowFindings: 1,
    },
    dimensions: [
      { auditId: 1, dimension: 'performance', score: 80, findingsCount: 2 },
      { auditId: 1, dimension: 'accessibility', score: 70, findingsCount: 3 },
      { auditId: 1, dimension: 'seo', score: 85, findingsCount: 1 },
      { auditId: 1, dimension: 'ux', score: 65, findingsCount: 2 },
      { auditId: 1, dimension: 'content', score: 75, findingsCount: 1 },
    ],
    findings: [
      {
        auditId: 1,
        dimension: 'performance',
        title: 'LCP trop élevé',
        description: 'Le LCP est de 4.5s',
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation: 'Optimiser les images',
      },
    ],
  });

  describe('generate', () => {
    it('should generate PDF report', async () => {
      const audit = createMockAudit();
      const report = await generator.generate(audit);

      expect(report.format).toBe('pdf');
      expect(report.content).toBeDefined();
      expect(report.content.length).toBeGreaterThan(0);
    }, 15000); // 15s timeout pour Puppeteer
  });
});
```

**Validation :**
```bash
npm test tests/reports/pdf-generator.test.ts
# ✅ 1 test passe

npm run test:coverage -- tests/reports/pdf-generator.test.ts
# ✅ > 80% couverture
```

**Commit :**
```bash
git add src/reports/pdf-generator.ts
git add tests/reports/pdf-generator.test.ts
git commit -m "feat(reports): implement PDFReportGenerator with Puppeteer"
```

---

### 3.6 Vérifications finales Sprint 11-1 (Jour 4)

```bash
# 1. Tous les tests
npm test tests/reports/
# ✅ 4 tests passent (3 markdown + 1 pdf)

# 2. Couverture
npm run test:coverage -- tests/reports/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/reports/
# ✅ types.ts, markdown-generator.ts, pdf-generator.ts

ls -la src/reports/templates/
# ✅ markdown.ts, html.ts

ls -la tests/reports/
# ✅ markdown-generator.test.ts, pdf-generator.test.ts

# 6. Test d'intégration basique
node -e "
const { MarkdownReportGenerator } = require('./dist/reports/markdown-generator');
const generator = new MarkdownReportGenerator();

const audit = {
  metadata: {
    id: 1,
    url: 'https://example.com',
    timestamp: '2024-01-01T00:00:00Z',
    overallScore: 75,
    totalFindings: 2,
    criticalFindings: 1,
    highFindings: 1,
    mediumFindings: 0,
    lowFindings: 0,
  },
  dimensions: [
    { auditId: 1, dimension: 'performance', score: 80, findingsCount: 1 },
    { auditId: 1, dimension: 'accessibility', score: 70, findingsCount: 1 },
    { auditId: 1, dimension: 'seo', score: 85, findingsCount: 0 },
    { auditId: 1, dimension: 'ux', score: 65, findingsCount: 0 },
    { auditId: 1, dimension: 'content', score: 75, findingsCount: 0 },
  ],
  findings: [
    {
      auditId: 1,
      dimension: 'performance',
      title: 'LCP trop élevé',
      description: 'Le LCP est de 4.5s',
      severity: 3,
      effort: 2,
      impact: 4,
      priority: 'high',
      recommendation: 'Optimiser les images',
    },
    {
      auditId: 1,
      dimension: 'accessibility',
      title: 'Contraste insuffisant',
      description: '5 éléments',
      severity: 4,
      effort: 1,
      impact: 5,
      priority: 'critical',
      recommendation: 'Augmenter le contraste',
    },
  ],
};

generator.generate(audit).then(report => {
  console.log('Format:', report.format);
  console.log('Content length:', report.content.length);
  console.log('Contains URL:', report.content.includes('https://example.com'));
  console.log('Contains findings:', report.content.includes('LCP trop élevé'));
});
"
# ✅ Rapport Markdown généré correctement

# 7. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques

# 8. Push
git push origin feat/sprint-11-1
```

**Point de contrôle Sprint 11-1 :**
- ✅ Types Reports définis (ReportOptions, ComparisonReport)
- ✅ MarkdownTemplate implémenté (header, summary, dimensions, findings, recommendations)
- ✅ MarkdownReportGenerator implémenté (generate, generateComparison)
- ✅ HtmlTemplate implémenté (CSS inline, responsive)
- ✅ PDFReportGenerator implémenté (Puppeteer, A4, marges)
- ✅ Tests unitaires > 80% couverture
- ✅ 4 tests passent

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/reports/types.ts` | 100 | Types rapports |
| `src/reports/templates/markdown.ts` | 200 | Template Markdown |
| `src/reports/templates/html.ts` | 250 | Template HTML |
| `src/reports/markdown-generator.ts` | 180 | Générateur Markdown |
| `src/reports/pdf-generator.ts` | 120 | Générateur PDF |
| `tests/reports/markdown-generator.test.ts` | 150 | Tests Markdown |
| `tests/reports/pdf-generator.test.ts` | 100 | Tests PDF |

**Total Sprint 11-1 :** ~1 100 lignes

---

## 5. Commits

```bash
git commit -m "feat(reports): add report types (ReportOptions, ComparisonReport)"
git commit -m "feat(reports): implement MarkdownTemplate for audit reports"
git commit -m "feat(reports): implement MarkdownReportGenerator with generate and generateComparison"
git commit -m "feat(reports): implement HtmlTemplate for PDF reports"
git commit -m "feat(reports): implement PDFReportGenerator with Puppeteer"
```

---

## 6. Transition vers Sprint 11-2

**Prérequis pour Sprint 11-2 :**
- ✅ Sprint 11-1 terminé avec succès
- ✅ MarkdownReportGenerator fonctionnel
- ✅ PDFReportGenerator fonctionnel
- ✅ Tests unitaires passent

**Sprint 11-2 — Comparaison d'audits (Semaine 21, Jours 5-7) :**
- 🎯 AuditComparator (delta scores, delta findings)
- 🎯 Template comparaison Markdown
- 🎯 Tests unitaires

---

**Fin du document Sprint 11-1**
