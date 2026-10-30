/**
 * Chaîne de preuve — W05 / C-W09 (Sprint 20-02).
 *
 * Chaque élément réellement fourni par axe-core (règle, impact, nœuds,
 * sélecteurs, version du moteur) doit rester relié à sa source jusqu'au constat
 * persisté ; ce qui n'est pas fourni doit être explicitement absent, jamais
 * inventé. Les assertions décrivent ce contrat avant la correction.
 */

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { AccessibilityAnalyzer } from '../../src/analysis/accessibility.js';
import { toAxeResults } from '../../src/analysis/adapter.js';
import type { AnalysisReport, Finding } from '../../src/analysis/types.js';
import { AxeAnalyzer } from '../../src/browser/axe.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';

/** Rapport brut avec sélecteurs, comptes de nœuds et version de moteur. */
const rawResults = {
  testEngine: { name: 'axe-core', version: '4.10.2' },
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must meet minimum color contrast ratio thresholds',
      help: 'Assure contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      nodes: [{ target: ['#main .btn'] }, { target: ['nav a'] }],
    },
    {
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternate text',
      help: 'Add alt',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
    },
  ],
};

/** Exécute l'analyseur axe sur ces résultats, sans navigateur. */
async function analyseAxe(): Promise<Awaited<ReturnType<AxeAnalyzer['analyze']>>> {
  const runner = { run: async () => rawResults };
  return new AxeAnalyzer(runner as never).analyze({} as never);
}

/** Constat minimal valide. */
function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'a11y-color-contrast',
    dimension: 'accessibility',
    title: 'Contraste insuffisant',
    description: 'Éléments sous le seuil',
    severity: 3,
    effort: 2,
    impact: 4,
    priority: 'high',
    recommendation: 'Augmenter le contraste',
    references: ['https://dequeuniversity.com/rules/axe/4.10/color-contrast'],
    ...overrides,
  };
}

/** Rapport d'analyse minimal porteur d'un constat. */
function makeReport(finding: Finding): AnalysisReport {
  const dimensionOf = (name: AnalysisReport['dimensions']['performance']['dimension']) => ({
    dimension: name,
    score: 70,
    status: 'measured' as const,
    findings: name === 'accessibility' ? [finding] : [],
    summary: `Score ${name}.`,
  });

  return {
    url: 'https://example.invalid',
    timestamp: '2026-10-30T10:00:00.000Z',
    dimensions: {
      performance: dimensionOf('performance'),
      accessibility: dimensionOf('accessibility'),
      seo: dimensionOf('seo'),
      ux: dimensionOf('ux'),
      content: dimensionOf('content'),
    },
    findings: [finding],
    priorityFindings: [finding],
    summary: {
      totalFindings: 1,
      criticalFindings: 0,
      highFindings: 1,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: { status: 'measured', value: 70 },
    },
  };
}

describe('C-W09 — preuve minimale reliée à sa source', () => {
  it('capture la version du moteur et les sélecteurs réellement fournis', async () => {
    const analysis = await analyseAxe();
    // axe trie par gravité : `image-alt` (critical) précède `color-contrast`.
    const contrast = analysis.violations.find((violation) => violation.id === 'color-contrast');
    const imageAlt = analysis.violations.find((violation) => violation.id === 'image-alt');

    expect((analysis as unknown as { engineVersion?: string }).engineVersion).toBe('4.10.2');
    expect((contrast as unknown as { targets?: readonly string[] }).targets).toEqual([
      '#main .btn',
      'nav a',
    ]);
    // Absence : `image-alt` ne fournit aucun nœud.
    expect((imageAlt as unknown as { targets?: readonly string[] }).targets).toBeUndefined();
  });

  it('conserve les sélecteurs au passage du pont d’analyse', async () => {
    const results = toAxeResults(await analyseAxe());
    const contrast = (results.violations ?? []).find(
      (violation) => violation.id === 'color-contrast',
    );

    expect((contrast as unknown as { targets?: readonly string[] }).targets).toEqual([
      '#main .btn',
      'nav a',
    ]);
    expect((results as unknown as { engineVersion?: string }).engineVersion).toBe('4.10.2');
  });

  it('relie le constat à ses éléments, à son compte de nœuds et à sa règle', async () => {
    const dimension = new AccessibilityAnalyzer().analyze(toAxeResults(await analyseAxe()));
    const contrast = dimension.findings.find((f) => f.id === 'a11y-color-contrast');
    const imageAlt = dimension.findings.find((f) => f.id === 'a11y-image-alt');

    expect(contrast?.elements).toEqual(['#main .btn', 'nav a']);
    expect(contrast?.nodesCount).toBe(2);
    expect(contrast?.rule).toBe('color-contrast');

    // Absence explicite : aucun nœud fourni, donc aucune liste ni compteur.
    expect(imageAlt?.elements).toBeUndefined();
    expect(imageAlt?.nodesCount).toBeUndefined();
  });

  it('persiste puis restitue la preuve depuis la base (migration 011)', () => {
    const database = new Database(':memory:');
    try {
      // `audit_metadata` référence `projects` : la table doit exister avant.
      database.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
      new AuditSchema(database).createSchema();
      const repository = new AuditRepository(database);

      const stored = repository.store(
        makeReport(
          makeFinding({
            elements: ['#main .btn', 'nav a'],
            nodesCount: 2,
            rule: 'color-contrast',
            engineVersion: '4.10.2',
          } as Partial<Finding>),
        ),
      );

      const reloaded = repository.findById(stored.metadata.id ?? 0);
      const finding = reloaded?.findings[0] as unknown as
        | { elements?: string[]; nodesCount?: number; rule?: string; engineVersion?: string }
        | undefined;

      expect(finding?.elements).toEqual(['#main .btn', 'nav a']);
      expect(finding?.nodesCount).toBe(2);
      expect(finding?.rule).toBe('color-contrast');
      expect(finding?.engineVersion).toBe('4.10.2');
    } finally {
      database.close();
    }
  });
});
