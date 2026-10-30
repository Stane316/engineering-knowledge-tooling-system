import { describe, expect, it } from 'vitest';

import { AuditComparator } from '../../src/reports/comparator.js';
import { ComparisonMarkdownTemplate } from '../../src/reports/templates/comparison-markdown.js';
import type { Audit, AuditFinding } from '../../src/storage/types.js';

/** Options de fixture d'audit. */
interface AuditFixture {
  readonly id?: number;
  readonly score?: number;
  readonly performanceScore?: number;
  readonly findings?: readonly Partial<AuditFinding>[];
}

/** Audit de test : 5 dimensions, scores/calculs déterministes. */
function makeAudit(options: AuditFixture = {}): Audit {
  const id = options.id ?? 1;
  const score = options.score ?? 70;
  const findings: AuditFinding[] = (options.findings ?? []).map((finding, index) => ({
    auditId: id,
    dimension: 'performance',
    title: `Constat ${String(index)}`,
    severity: 3,
    effort: 2,
    impact: 4,
    priority: 'high',
    ...finding,
  }));

  return {
    metadata: {
      id,
      url: 'https://example.com',
      timestamp: '2026-10-24T10:00:00.000Z',
      overallScore: score,
      totalFindings: findings.length,
      criticalFindings: findings.filter((f) => f.priority === 'critical').length,
      highFindings: findings.filter((f) => f.priority === 'high').length,
      mediumFindings: findings.filter((f) => f.priority === 'medium').length,
      lowFindings: findings.filter((f) => f.priority === 'low').length,
      infoFindings: findings.filter((f) => f.priority === 'info').length,
    },
    dimensions: [
      {
        auditId: id,
        dimension: 'performance',
        score: options.performanceScore ?? score,
        findingsCount: findings.filter((f) => f.dimension === 'performance').length,
      },
      { auditId: id, dimension: 'accessibility', score: score + 5, findingsCount: 0 },
      { auditId: id, dimension: 'seo', score: score + 10, findingsCount: 0 },
      { auditId: id, dimension: 'ux', score: score - 5, findingsCount: 0 },
      { auditId: id, dimension: 'content', score: score - 10, findingsCount: 0 },
    ],
    findings,
  };
}

describe('AuditComparator', () => {
  const comparator = new AuditComparator();

  it('calcule une évolution positive (improving)', () => {
    const result = comparator.calculateEvolution(
      makeAudit({ score: 70 }),
      makeAudit({ score: 80 }),
    );
    expect(result.delta).toBe(10);
    expect(result.percentage).toBeCloseTo(14.3, 1);
    expect(result.trend).toBe('improving');
  });

  it('calcule une évolution négative (degrading)', () => {
    const result = comparator.calculateEvolution(
      makeAudit({ score: 70 }),
      makeAudit({ score: 60 }),
    );
    expect(result.delta).toBe(-10);
    expect(result.percentage).toBeCloseTo(-14.3, 1);
    expect(result.trend).toBe('degrading');
  });

  it('traite un écart faible comme stable (±5 points)', () => {
    expect(
      comparator.calculateEvolution(makeAudit({ score: 70 }), makeAudit({ score: 74 })).trend,
    ).toBe('stable');
    expect(
      comparator.calculateEvolution(makeAudit({ score: 70 }), makeAudit({ score: 75 })).trend,
    ).toBe('stable');
    expect(
      comparator.calculateEvolution(makeAudit({ score: 70 }), makeAudit({ score: 76 })).trend,
    ).toBe('improving');
    expect(
      comparator.calculateEvolution(makeAudit({ score: 70 }), makeAudit({ score: 64 })).trend,
    ).toBe('degrading');
  });

  it('produit des deltas de scores symétriques (A→B et B→A)', () => {
    const a = makeAudit({ performanceScore: 70 });
    const b = makeAudit({ performanceScore: 77 });
    const forward = comparator
      .calculateDeltaScores(a, b)
      .find((d) => d.dimension === 'performance')!;
    const backward = comparator
      .calculateDeltaScores(b, a)
      .find((d) => d.dimension === 'performance')!;

    expect(forward.delta).toBe(7);
    expect(forward.percentage).toBe(10);
    expect(backward.delta).toBe(-7);
    // Pourcentages relatifs à la base de calcul propre à chaque sens :
    // +7/70 = +10 %, −7/77 ≈ −9,1 % (aucune hypothèse de symétrie).
    expect(backward.percentage).toBe(-9.1);
  });

  it('identifie les constats nouveaux (absents de A)', () => {
    const a = makeAudit({ findings: [{ title: 'Ancien' }] });
    const b = makeAudit({
      findings: [{ title: 'Ancien' }, { title: 'Nouveau 1' }, { title: 'Nouveau 2' }],
    });

    const deltas = comparator.calculateDeltaFindings(a, b);
    expect(deltas.newFindings).toHaveLength(2);
    expect(deltas.newFindings.map((f) => f.title).sort()).toEqual(['Nouveau 1', 'Nouveau 2']);
    expect(deltas.resolvedFindings).toHaveLength(0);
  });

  it('identifie les constats résolus (absents de B)', () => {
    const a = makeAudit({
      findings: [{ title: 'Ancien' }, { title: 'Partant 1' }, { title: 'Partant 2' }],
    });
    const b = makeAudit({ findings: [{ title: 'Ancien' }] });

    const deltas = comparator.calculateDeltaFindings(a, b);
    expect(deltas.resolvedFindings).toHaveLength(2);
    expect(deltas.newFindings).toHaveLength(0);
  });

  it('classifie sans changement : 0 nouveau, 0 résolu, 2 persistants', () => {
    const a = makeAudit({ findings: [{ title: 'X' }, { title: 'Y' }] });
    const b = makeAudit({ findings: [{ title: 'X' }, { title: 'Y' }] });

    const deltas = comparator.calculateDeltaFindings(a, b);
    expect(deltas.newFindings).toHaveLength(0);
    expect(deltas.resolvedFindings).toHaveLength(0);
    expect(deltas.persistentFindings).toHaveLength(2);
    expect(deltas.improvedFindings).toHaveLength(0);
  });

  it('signale un constat amélioré (sévérité 3 → 1)', () => {
    const a = makeAudit({ findings: [{ title: 'LCP', severity: 3 }] });
    const b = makeAudit({ findings: [{ title: 'LCP', severity: 1 }] });

    const deltas = comparator.calculateDeltaFindings(a, b);
    expect(deltas.improvedFindings).toHaveLength(1);
    expect(deltas.improvedFindings[0]?.title).toBe('LCP');
    // La clé inclut la sévérité : la version corrigée est aussi « nouvelle »
    // et l'ancienne « résolue » — deux entrées, aucune mutation.
    expect(deltas.newFindings).toHaveLength(1);
    expect(deltas.resolvedFindings).toHaveLength(1);
  });

  it('applique les seuils de tendance à compare (+5, −5, +4)', () => {
    const base = makeAudit({ score: 70 });

    expect(comparator.compare(base, makeAudit({ score: 75 })).evolution.trend).toBe('stable');
    expect(comparator.compare(base, makeAudit({ score: 65 })).evolution.trend).toBe('stable');
    expect(comparator.compare(base, makeAudit({ score: 74 })).evolution.trend).toBe('stable');
    expect(comparator.compare(base, makeAudit({ score: 75.1 })).evolution.trend).toBe('improving');
  });

  it('produit la chaîne de recommandations par escalier', () => {
    const criticalResolved = {
      title: 'Critique corrigé',
      severity: 4,
      priority: 'critical' as const,
    };
    const criticalPersistent = {
      title: 'Critique ouvert',
      severity: 4,
      priority: 'critical' as const,
    };

    // Régression + nouveaux constats → 2 recommandations.
    const regressing = comparator.compare(
      makeAudit({ score: 80, findings: [{ title: 'Ancien' }] }),
      makeAudit({ score: 60, findings: [{ title: 'Ancien' }, { title: 'Nouveau' }] }),
    );
    expect(regressing.recommendations).toHaveLength(2);
    expect(regressing.recommendations[0]).toMatch(/nouveaux constats critiques/);

    // Critique résolus → capitalisation.
    const fixed = comparator.compare(
      makeAudit({ score: 80, findings: [criticalResolved] }),
      makeAudit({ score: 80, findings: [] }),
    );
    expect(fixed.recommendations.join(' ')).toMatch(/capitaliser/i);

    // Stable + critique persistant → plan d'action.
    const stuck = comparator.compare(
      makeAudit({ score: 80, findings: [criticalPersistent] }),
      makeAudit({ score: 80, findings: [criticalPersistent] }),
    );
    expect(stuck.recommendations.join(' ')).toMatch(/plan d'action/i);

    // Amélioration simple → consolidation.
    const better = comparator.compare(makeAudit({ score: 70 }), makeAudit({ score: 90 }));
    expect(better.recommendations.join(' ')).toMatch(/maintenir les correctifs/i);

    // Aucun déclencheur → audit approfondi.
    const flat = comparator.compare(
      makeAudit({ score: 80, findings: [] }),
      makeAudit({ score: 80, findings: [] }),
    );
    expect(flat.recommendations).toHaveLength(1);
    expect(flat.recommendations[0]).toMatch(/audit approfondi/);
  });

  it("compare 100 constats en moins d'une seconde (budget C11.3)", () => {
    const findingsA = Array.from({ length: 100 }, (_, index) => ({
      title: `Constat ${String(index)}`,
      severity: index % 5,
      priority: 'medium' as const,
    }));
    const findingsB = Array.from({ length: 100 }, (_, index) => ({
      title: `Constat ${String(index + 50)}`,
      severity: index % 5,
      priority: 'medium' as const,
    }));

    const started = performance.now();
    const report = comparator.compare(
      makeAudit({ findings: findingsA }),
      makeAudit({ id: 2, findings: findingsB }),
    );
    const elapsed = performance.now() - started;

    expect(report.deltaFindings.newFindings).toHaveLength(50);
    expect(report.deltaFindings.resolvedFindings).toHaveLength(50);
    expect(elapsed).toBeLessThan(1_000);
  }, 5_000);

  it('rejette un audit sans score global', () => {
    expect(() => comparator.compare({} as Audit, makeAudit())).toThrow(/Audit A invalide/);
    expect(() => comparator.compare(makeAudit(), {} as Audit)).toThrow(/Audit B invalide/);
  });
});

describe('ComparisonMarkdownTemplate', () => {
  const template = new ComparisonMarkdownTemplate();
  const comparator = new AuditComparator();

  const comparison = () =>
    comparator.compare(
      makeAudit({
        id: 1,
        score: 70,
        findings: [{ title: 'Résolu', severity: 4, priority: 'critical' }],
      }),
      makeAudit({ id: 2, score: 80, findings: [{ title: 'Nouveau problème', severity: 3 }] }),
    );

  it('résumé : en-tête nommé, ligne de score, compteurs et clôture', () => {
    const report = template.generateSummaryReport(comparison());

    expect(
      report.startsWith(
        '# 📋 Résumé de comparaison — https://example.com (#1) → https://example.com (#2)',
      ),
    ).toBe(true);
    expect(report).toContain('**Score** : 📈 70 → 80 (+10 pts, +14.3%)');
    expect(report).toContain('## 🔍 Constats clés');
    expect(report).toContain('🆕 Nouveaux : **1**');
    expect(report).toContain('✅ Résolus : **1**');
    expect(report).toContain('## 📝 Recommandations');
    expect(report).toContain('1. ');
    expect(report.trimEnd().endsWith('Dimension UX : scores encore en retrait.')).toBe(false);
  });

  it("résumé : sans recommandation, l'indicateur explicite apparaît", () => {
    const flat = comparator.compare(makeAudit({ id: 1 }), makeAudit({ id: 2 }));
    flat.recommendations.length = 0;
    expect(template.generateSummaryReport(flat)).toContain('_Aucune recommandation._');
  });

  it('résumé : emojis de tendance corrects (improving, degrading, stable)', () => {
    const improving = template.generateSummaryReport(
      comparator.compare(makeAudit({ id: 1, score: 60 }), makeAudit({ id: 2, score: 80 })),
    );
    const degrading = template.generateSummaryReport(
      comparator.compare(makeAudit({ id: 1, score: 80 }), makeAudit({ id: 2, score: 60 })),
    );
    const stable = template.generateSummaryReport(
      comparator.compare(makeAudit({ id: 1, score: 70 }), makeAudit({ id: 2, score: 71 })),
    );

    expect(improving).toContain('📈 60 → 80');
    expect(degrading).toContain('📉 80 → 60');
    expect(stable).toContain('➡️ 70 → 71');
  });

  it('détaillé : évolution, deltas par dimension, constats, recommandations', () => {
    const report = template.generateDetailedReport(comparison());

    expect(report.startsWith("# 🔄 Comparaison d'audits")).toBe(true);
    expect(report).toContain('## 📈 Évolution du score');
    expect(report).toContain('| 70 | 80 | +10 | +14.3% |');
    expect(report).toContain('## 🎯 Deltas par dimension');
    expect(report).toContain('| performance | 70 | 80 | +10 | +14.3% |');
    expect(report).toContain('## 🔍 Deltas de constats');
    expect(report).toContain('🆕 Nouveaux : **1**');
    expect(report).toContain('✅ Résolus : **1**');
    expect(report).toContain('## 💡 Recommandations');
  });

  it('est déterministe (deux appels, contenu identique)', () => {
    const current = comparison();
    expect(template.generateDetailedReport(current)).toBe(template.generateDetailedReport(current));
    expect(template.generateSummaryReport(current)).toBe(template.generateSummaryReport(current));
  });
});
