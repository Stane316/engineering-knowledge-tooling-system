import type { ComparisonReport } from '../types.js';
import { MarkdownTemplate } from './markdown.js';

/**
 * Vues Markdown d'une comparaison d'audits (Sprint 11-2).
 *
 * - {@link ComparisonMarkdownTemplate.generateDetailedReport} : rapport complet
 *   (délégué à {@link MarkdownTemplate.generateComparisonReport}, source unique
 *   partagée avec `MarkdownReportGenerator.generateComparison`) ;
 * - {@link ComparisonMarkdownTemplate.generateSummaryReport} : résumé court
 *   (score, constats clés, recommandations) pour chat/CLI.
 *
 * Tendance : 📈 `improving`, 📉 `degrading`, ➡️ `stable`.
 */
export class ComparisonMarkdownTemplate {
  private readonly markdown = new MarkdownTemplate();

  /**
   * Rapport de comparaison complet : évolution, deltas par dimension,
   * deltas de constats, recommandations numérotées.
   *
   * @param comparison - Comparaison produite par `AuditComparator.compare`.
   * @returns Document Markdown complet.
   */
  generateDetailedReport(comparison: ComparisonReport): string {
    return this.markdown.generateComparisonReport(comparison);
  }

  /**
   * Résumé court : une ligne de score, les 4 compteurs de constats et les
   * recommandations (ou l'indicateur d'absence).
   *
   * @param comparison - Comparaison produite par `AuditComparator.compare`.
   * @returns Document Markdown condensé.
   */
  generateSummaryReport(comparison: ComparisonReport): string {
    const { auditA, auditB, evolution, deltaFindings, recommendations } = comparison;

    const lines: string[] = [
      `# 📋 Résumé de comparaison — ${auditA.metadata.url} (#${String(auditA.metadata.id)}) → ${auditB.metadata.url} (#${String(auditB.metadata.id)})`,
      '',
      `- **Score** : ${this.trendEmoji(evolution.trend)} ${String(evolution.scoreA)} → ${String(evolution.scoreB)} (${evolution.delta > 0 ? '+' : ''}${String(evolution.delta)} pts, ${evolution.percentage > 0 ? '+' : ''}${evolution.percentage.toFixed(1)}%)`,
      `- **Tendance** : ${this.trendEmoji(evolution.trend)} ${evolution.trend}`,
      '',
      '## 🔍 Constats clés',
      '',
      `- 🆕 Nouveaux : **${String(deltaFindings.newFindings.length)}**`,
      `- ✅ Résolus : **${String(deltaFindings.resolvedFindings.length)}**`,
      `- ⏳ Persistants : **${String(deltaFindings.persistentFindings.length)}**`,
      `- ↘️ Améliorés : **${String(deltaFindings.improvedFindings.length)}**`,
      '',
      '## 📝 Recommandations',
      '',
    ];

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
   * Emoji de tendance.
   *
   * @param trend - Tendance de l'évolution.
   * @returns 📈, 📉 ou ➡️.
   */
  private trendEmoji(trend: ComparisonReport['evolution']['trend']): string {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'degrading':
        return '📉';
      default:
        return '➡️';
    }
  }
}
