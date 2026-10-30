import type { Audit } from '../../storage/types.js';
import type { ComparisonReport } from '../types.js';

/**
 * Modèle HTML des rapports d'audit (Sprint 11-1).
 *
 * Produit un document autonome (CSS inline, aucune ressource externe) adapté
 * à l'impression PDF par Puppeteer : `page.setContent(html)` + `page.pdf()`.
 * Les classes `score-good` / `score-medium` / `score-poor` colorent les
 * scores selon les seuils 90 / 70 / 50.
 */
export class HtmlTemplate {
  /**
   * Génère le document HTML complet d'un audit.
   *
   * @param audit - Audit à représenter.
   * @returns Document HTML complet.
   */
  generateReport(audit: Audit): string {
    const { url, timestamp, overallScore } = audit.metadata;
    const date = new Date(timestamp).toISOString().replace('T', ' ').substring(0, 16);

    return this.layout(
      `Rapport d'audit — ${this.escape(url)}`,
      `
        <header>
          <h1>📊 Rapport d'audit</h1>
          <p class="meta"><strong>URL :</strong> ${this.escape(url)}<br>
          <strong>Date :</strong> ${date} UTC<br>
          <strong>Audit ID :</strong> #${String(audit.metadata.id)}</p>
          <p class="score ${this.scoreClass(overallScore)}">Score global : ${String(overallScore)}/100</p>
        </header>
        ${this.summarySection(audit)}
        ${this.dimensionsSection(audit)}
        ${this.findingsSection(audit)}
        ${this.recommendationsSection(audit)}
      `,
    );
  }

  /**
   * Génère le document HTML d'une comparaison d'audits.
   *
   * @param comparison - Comparaison issue de `AuditComparator.compare`.
   * @returns Document HTML complet.
   */
  generateComparison(comparison: ComparisonReport): string {
    const { auditA, auditB, evolution, deltaScores, deltaFindings, recommendations } = comparison;
    const deltaRows = deltaScores
      .map(
        (delta) => `
          <tr>
            <td>${this.escape(delta.dimension)}</td>
            <td>${String(delta.scoreA)}</td>
            <td>${String(delta.scoreB)}</td>
            <td class="${delta.delta > 0 ? 'score-good' : delta.delta < 0 ? 'score-poor' : ''}">${delta.delta > 0 ? '+' : ''}${String(delta.delta)}</td>
            <td>${delta.percentage > 0 ? '+' : ''}${delta.percentage.toFixed(1)}%</td>
          </tr>`,
      )
      .join('');

    const recommendationItems =
      recommendations.map((recommendation) => `<li>${this.escape(recommendation)}</li>`).join('') ||
      '<li>Aucune recommandation.</li>';

    return this.layout(
      `Comparaison — #${String(auditA.metadata.id)} → #${String(auditB.metadata.id)}`,
      `
        <header>
          <h1>🔄 Comparaison d'audits</h1>
          <p class="meta"><strong>A (ancien) :</strong> ${this.escape(auditA.metadata.url)} — #${String(auditA.metadata.id)}<br>
          <strong>B (récent) :</strong> ${this.escape(auditB.metadata.url)} — #${String(auditB.metadata.id)}</p>
          <p class="score ${this.scoreClass(evolution.scoreB)}">
            ${String(evolution.scoreA)} → ${String(evolution.scoreB)}
            (${evolution.delta > 0 ? '+' : ''}${String(evolution.delta)},
            ${evolution.percentage > 0 ? '+' : ''}${evolution.percentage.toFixed(1)}%)
          </p>
        </header>
        <section>
          <h2>🎯 Deltas par dimension</h2>
          <table>
            <thead><tr><th>Dimension</th><th>A</th><th>B</th><th>Δ</th><th>Relatif</th></tr></thead>
            <tbody>${deltaRows}</tbody>
          </table>
        </section>
        <section>
          <h2>🔍 Deltas de constats</h2>
          <ul>
            <li>🆕 Nouveaux : <strong>${String(deltaFindings.newFindings.length)}</strong></li>
            <li>✅ Résolus : <strong>${String(deltaFindings.resolvedFindings.length)}</strong></li>
            <li>⏳ Persistants : <strong>${String(deltaFindings.persistentFindings.length)}</strong></li>
            <li>↘️ Améliorés : <strong>${String(deltaFindings.improvedFindings.length)}</strong></li>
          </ul>
        </section>
        <section>
          <h2>💡 Recommandations</h2>
          <ol>${recommendationItems}</ol>
        </section>
      `,
    );
  }

  /**
   * Enveloppe HTML + CSS inline (aucune dépendance externe).
   *
   * @param title - Titre de l'onglet.
   * @param body - Corps du document (sections déjà produites).
   * @returns Document HTML complet.
   */
  private layout(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #1a1a2e; line-height: 1.5; }
  h1 { font-size: 22px; border-bottom: 3px solid #2b6cb0; padding-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; color: #2b6cb0; }
  .meta { font-size: 13px; color: #4a5568; }
  .score { display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 15px; }
  .score-good { background: #c6f6d5; color: #22543d; }
  .score-medium { background: #fefcbf; color: #744210; }
  .score-poor { background: #fed7d7; color: #742a2a; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 13px; }
  th, td { border: 1px solid #cbd5e0; padding: 6px 10px; text-align: left; }
  th { background: #edf2f7; }
  .count { display: inline-block; min-width: 42px; text-align: center; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .count-critical { background: #fed7d7; color: #742a2a; }
  .count-high { background: #feebc8; color: #7b341e; }
  .count-medium { background: #fefcbf; color: #744210; }
  .count-low { background: #c6f6d5; color: #22543d; }
  .count-info { background: #e2e8f0; color: #2d3748; }
  .finding { margin: 4px 0; padding: 6px 10px; border-left: 4px solid #cbd5e0; background: #f7fafc; font-size: 13px; }
  .finding strong { display: block; }
  ol li, ul li { margin: 4px 0; font-size: 13px; }
  footer { margin-top: 32px; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style>
</head>
<body>
${body}
<footer>Engineering-Knowledge-Tooling-System — Rapport généré automatiquement.</footer>
</body>
</html>`;
  }

  /**
   * Bloc « résumé » (répartition des constats par priorité).
   *
   * @param audit - Audit source.
   * @returns Section HTML.
   */
  private summarySection(audit: Audit): string {
    const m = audit.metadata;
    return `
      <section>
        <h2>📈 Résumé</h2>
        <table>
          <thead><tr><th>Priorité</th><th>Nombre</th></tr></thead>
          <tbody>
            <tr><td>🔴 Critical</td><td class="count count-critical">${String(m.criticalFindings)}</td></tr>
            <tr><td>🟠 High</td><td class="count count-high">${String(m.highFindings)}</td></tr>
            <tr><td>🟡 Medium</td><td class="count count-medium">${String(m.mediumFindings)}</td></tr>
            <tr><td>🟢 Low</td><td class="count count-low">${String(m.lowFindings)}</td></tr>
            <tr><td>⚪ Info</td><td class="count count-info">${String(m.infoFindings)}</td></tr>
            <tr><th>Total</th><th>${String(m.totalFindings)}</th></tr>
          </tbody>
        </table>
      </section>`;
  }

  /**
   * Bloc « scores par dimension ».
   *
   * @param audit - Audit source.
   * @returns Section HTML.
   */
  private dimensionsSection(audit: Audit): string {
    const rows = audit.dimensions
      .map(
        (dim) => `
          <tr>
            <td>${this.escape(dim.dimension)}</td>
            <td><span class="score ${this.scoreClass(dim.score)}">${String(dim.score)}/100</span></td>
            <td>${String(dim.findingsCount)}</td>
          </tr>`,
      )
      .join('');

    return `
      <section>
        <h2>🎯 Scores par dimension</h2>
        <table>
          <thead><tr><th>Dimension</th><th>Score</th><th>Constats</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
  }

  /**
   * Bloc « constats » (limité à 50 pour garder un PDF lisible).
   *
   * @param audit - Audit source.
   * @returns Section HTML.
   */
  private findingsSection(audit: Audit): string {
    const order = ['critical', 'high', 'medium', 'low', 'info'] as const;
    const icons: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      info: '⚪',
    };

    const blocks = order
      .map((priority) => {
        const group = audit.findings.filter((finding) => finding.priority === priority);
        if (group.length === 0) return '';
        const items = group
          .slice(0, 50)
          .map(
            (finding) =>
              `<div class="finding"><strong>${icons[priority] ?? '⚪'} ${this.escape(finding.title)}</strong>${this.escape(finding.dimension)}</div>`,
          )
          .join('');
        return `<h3>${icons[priority] ?? '⚪'} ${priority.toUpperCase()} (${String(group.length)})</h3>${items}`;
      })
      .join('');

    return `
      <section>
        <h2>🔍 Constats</h2>
        ${blocks === '' ? '<p>Aucun constat.</p>' : blocks}
      </section>`;
  }

  /**
   * Bloc « top 5 recommandations ».
   *
   * @param audit - Audit source.
   * @returns Section HTML.
   */
  private recommendationsSection(audit: Audit): string {
    const top = audit.findings
      .filter(
        (finding) =>
          finding.recommendation !== undefined && finding.recommendation.trim().length > 0,
      )
      .sort((a, b) => b.severity * b.impact - a.severity * a.impact)
      .slice(0, 5);

    const items =
      top.length === 0
        ? '<li>Aucune recommandation.</li>'
        : top
            .map(
              (finding) =>
                `<li><strong>${this.escape(finding.title)}</strong> → ${this.escape(finding.recommendation ?? '')}</li>`,
            )
            .join('');

    return `
      <section>
        <h2>💡 Top 5 recommandations</h2>
        <p class="note">Ordre de recommandation : sévérité × impact × 10 − effort. Ce
          classement est distinct de la priorité canonique (sévérité × (6 − effort))
          affichée dans le détail : un constat medium peut y précéder un constat
          critical sans que les priorités ni les compteurs soient incohérents.</p>
        <ol>${items}</ol>
      </section>`;
  }

  /**
   * Classe CSS d'un score (seuils 90 / 70 / 50).
   *
   * @param score - Score 0-100.
   * @returns `score-good`, `score-medium` ou `score-poor`.
   */
  private scoreClass(score: number): string {
    if (score >= 90) return 'score-good';
    if (score >= 70) return 'score-medium';
    return 'score-poor';
  }

  /**
   * Échappement HTML des caractères dangereux.
   *
   * @param value - Texte brut.
   * @returns Texte échappé.
   */
  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
