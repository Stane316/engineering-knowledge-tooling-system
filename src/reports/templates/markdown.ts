import type { Audit } from '../../storage/types.js';
import type { ComparisonReport, ReportSection } from '../types.js';

/**
 * Génération des sections Markdown d'un rapport d'audit (Sprint 11-1).
 *
 * Toutes les méthodes sont **pures** (aucune écriture fichier, aucune I/O) :
 * elles renvoient des chaînes prêtes à être concaténées par
 * `MarkdownReportGenerator`. L'emoji d'état dépend du score global
 * (≥ 90 🟢, ≥ 70 🟡, ≥ 50 🟠, sinon 🔴).
 */
export class MarkdownTemplate {
  /**
   * Génère le rapport complet d'un audit (header + résumé + dimensions +
   * constats + recommandations).
   *
   * @param audit - Audit à représenter.
   * @param options - Sections à inclure (défaut : toutes).
   * @returns Document Markdown complet.
   */
  generateReport(
    audit: Audit,
    options?: { readonly includeSections?: readonly ReportSection[] },
  ): string {
    const sections = options?.includeSections;
    const wants = (section: ReportSection): boolean =>
      sections === undefined || sections.includes(section);

    const parts: string[] = [];
    if (wants('header')) parts.push(this.generateHeader(audit));
    if (wants('summary')) parts.push(this.generateSummary(audit));
    if (wants('performance')) parts.push(this.generateDimensions(audit));
    if (wants('performance')) parts.push(this.generateDimension(audit, 'performance'));
    if (wants('accessibility')) parts.push(this.generateDimension(audit, 'accessibility'));
    if (wants('seo')) parts.push(this.generateDimension(audit, 'seo'));
    if (wants('ux')) parts.push(this.generateDimension(audit, 'ux'));
    if (wants('content')) parts.push(this.generateDimension(audit, 'content'));
    if (wants('findings')) parts.push(this.generateFindings(audit));
    if (wants('recommendations')) parts.push(this.generateRecommendations(audit));

    return `${parts.filter((part) => part.length > 0).join('\n\n')}\n`;
  }

  /**
   * Titre, URL, date et score global (avec emoji d'état).
   *
   * @param audit - Audit à représenter.
   * @returns Section « header ».
   */
  generateHeader(audit: Audit): string {
    const { url, timestamp, overallScore } = audit.metadata;
    const date = new Date(timestamp).toISOString().replace('T', ' ').substring(0, 16);

    return [
      `# 📊 Rapport d'audit — ${url}`,
      '',
      `- **URL** : ${url}`,
      `- **Date** : ${date} UTC`,
      `- **Score global** : ${this.scoreEmoji(overallScore)} **${overallScore}/100**`,
      `- **Audit ID** : #${String(audit.metadata.id)}`,
    ].join('\n');
  }

  /**
   * Répartition des constats par priorité (tableau).
   *
   * @param audit - Audit à représenter.
   * @returns Section « summary ».
   */
  generateSummary(audit: Audit): string {
    const m = audit.metadata;
    const rows: string[] = [
      '| Priorité | Nombre |',
      '|----------|--------|',
      `| 🔴 Critical | ${String(m.criticalFindings)} |`,
      `| 🟠 High | ${String(m.highFindings)} |`,
      `| 🟡 Medium | ${String(m.mediumFindings)} |`,
      `| 🟢 Low | ${String(m.lowFindings)} |`,
      `| **Total** | **${String(m.totalFindings)}** |`,
    ];

    return ['## 📈 Résumé', '', ...rows].join('\n');
  }

  /**
   * Scores par dimension (tableau des 5 dimensions).
   *
   * @param audit - Audit à représenter.
   * @returns Section « scores par dimension ».
   */
  generateDimensions(audit: Audit): string {
    const rows: string[] = ['| Dimension | Score | Constats |', '|-----------|-------|----------|'];
    for (const dim of audit.dimensions) {
      rows.push(
        `| ${dim.dimension} | ${this.scoreEmoji(dim.score)} ${String(dim.score)}/100 | ${String(dim.findingsCount)} |`,
      );
    }
    return ['## 🎯 Scores par dimension', '', ...rows].join('\n');
  }

  /**
   * Détail d'une dimension (score + recommandations associées).
   *
   * @param audit - Audit à représenter.
   * @param dimension - Dimension isolée.
   * @returns Section dédiée (chaîne vide si la dimension n'existe pas).
   */
  generateDimension(audit: Audit, dimension: string): string {
    const dim = audit.dimensions.find((d) => d.dimension === dimension);
    if (!dim) return '';

    const related = audit.findings.filter((f) => f.dimension === dimension);
    const lines: string[] = [
      `## ${this.dimensionIcon(dimension)} ${this.dimensionLabel(dimension)}`,
      '',
      `**Score** : ${this.scoreEmoji(dim.score)} ${String(dim.score)}/100 — ${String(dim.findingsCount)} constat(s)`,
    ];

    if (related.length > 0) {
      lines.push('', '**Recommandations :**');
      for (const finding of related.slice(0, 5)) {
        if (finding.recommendation) {
          lines.push(`- ${finding.title} → ${finding.recommendation}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Constats regroupés par priorité (titres seuls, ordre décroissant).
   *
   * @param audit - Audit à représenter.
   * @returns Section « findings ».
   */
  generateFindings(audit: Audit): string {
    const lines: string[] = ['## 🔍 Constats', ''];
    const order = ['critical', 'high', 'medium', 'low', 'info'] as const;
    const icons: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      info: '⚪',
    };

    for (const priority of order) {
      const group = audit.findings.filter((f) => f.priority === priority);
      if (group.length === 0) continue;
      lines.push(
        `### ${icons[priority] ?? '⚪'} ${priority.toUpperCase()} (${String(group.length)})`,
      );
      for (const finding of group) {
        lines.push(`- **${finding.title}** (${finding.dimension})`);
      }
      lines.push('');
    }

    if (audit.findings.length === 0) {
      lines.push('_Aucun constat._');
    }

    return lines.join('\n').trimEnd();
  }

  /**
   * Top 5 des recommandations actionnables (constats les plus prioritaires).
   *
   * @param audit - Audit à représenter.
   * @returns Section « recommendations ».
   */
  generateRecommendations(audit: Audit): string {
    const withRecommendation = audit.findings
      .filter((f) => f.recommendation !== undefined && f.recommendation.trim().length > 0)
      .sort((a, b) => this.severityScore(b) - this.severityScore(a))
      .slice(0, 5);

    const lines: string[] = ['## 💡 Top 5 recommandations', ''];
    if (withRecommendation.length === 0) {
      lines.push('_Aucune recommandation._');
    } else {
      withRecommendation.forEach((finding, index) => {
        lines.push(`${String(index + 1)}. **${finding.title}** → ${finding.recommendation ?? ''}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Rapport de comparaison complet (évolution, deltas, recommandations).
   *
   * @param comparison - Comparaison produite par `AuditComparator`.
   * @returns Section « comparison ».
   */
  generateComparisonReport(comparison: ComparisonReport): string {
    const { auditA, auditB, evolution, deltaScores, deltaFindings, recommendations } = comparison;
    const trendEmoji =
      evolution.trend === 'improving' ? '📈' : evolution.trend === 'degrading' ? '📉' : '➡️';

    const lines: string[] = [
      "# 🔄 Comparaison d'audits",
      '',
      `- **A (ancien)** : ${auditA.metadata.url} — #${String(auditA.metadata.id)} — ${new Date(auditA.metadata.timestamp).toISOString().substring(0, 10)}`,
      `- **B (récent)** : ${auditB.metadata.url} — #${String(auditB.metadata.id)} — ${new Date(auditB.metadata.timestamp).toISOString().substring(0, 10)}`,
      '',
      '## 📈 Évolution du score',
      '',
      `| Score A | Score B | Δ | Relatif | Tendance |`,
      `|---------|---------|---|---------|----------|`,
      `| ${String(evolution.scoreA)} | ${String(evolution.scoreB)} | ${evolution.delta > 0 ? '+' : ''}${String(evolution.delta)} | ${evolution.percentage > 0 ? '+' : ''}${evolution.percentage.toFixed(1)}% | ${trendEmoji} ${evolution.trend} |`,
      '',
      '## 🎯 Deltas par dimension',
      '',
      '| Dimension | A | B | Δ | Relatif |',
      '|-----------|---|---|---|---------|',
    ];

    for (const delta of deltaScores) {
      lines.push(
        `| ${delta.dimension} | ${String(delta.scoreA)} | ${String(delta.scoreB)} | ${delta.delta > 0 ? '+' : ''}${String(delta.delta)} | ${delta.percentage > 0 ? '+' : ''}${delta.percentage.toFixed(1)}% |`,
      );
    }

    lines.push(
      '',
      '## 🔍 Deltas de constats',
      '',
      `- 🆕 Nouveaux : **${String(deltaFindings.newFindings.length)}**`,
      `- ✅ Résolus : **${String(deltaFindings.resolvedFindings.length)}**`,
      `- ⏳ Persistants : **${String(deltaFindings.persistentFindings.length)}**`,
      `- ↘️ Améliorés : **${String(deltaFindings.improvedFindings.length)}**`,
      '',
      '## 💡 Recommandations',
      '',
    );

    if (recommendations.length === 0) {
      lines.push('_Aucune recommandation._');
    } else {
      recommendations.forEach((recommendation, index) => {
        lines.push(`${String(index + 1)}. ${recommendation}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Emoji d'état associé à un score.
   *
   * @param score - Score 0-100.
   * @returns 🟢 (≥ 90), 🟡 (≥ 70), 🟠 (≥ 50) ou 🔴.
   */
  private scoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  /**
   * Poids de tri d'un constat (sévérité × impact, puis effort).
   *
   * @param finding - Constat à pondérer.
   * @returns Score de priorité (plus grand = plus urgent).
   */
  private severityScore(finding: {
    readonly severity: number;
    readonly impact: number;
    readonly effort: number;
  }): number {
    return finding.severity * finding.impact * 10 - finding.effort;
  }

  private dimensionIcon(dimension: string): string {
    switch (dimension) {
      case 'performance':
        return '⚡';
      case 'accessibility':
        return '♿';
      case 'seo':
        return '🔍';
      case 'ux':
        return '🧭';
      default:
        return '📝';
    }
  }

  private dimensionLabel(dimension: string): string {
    switch (dimension) {
      case 'performance':
        return 'Performance';
      case 'accessibility':
        return 'Accessibilité';
      case 'seo':
        return 'SEO';
      case 'ux':
        return 'UX';
      default:
        return 'Contenu';
    }
  }
}
