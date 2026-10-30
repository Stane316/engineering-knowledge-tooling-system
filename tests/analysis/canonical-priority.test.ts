import { describe, expect, it } from 'vitest';

import { ContentAnalyzer } from '../../src/analysis/content.js';
import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import { SeverityMatrix } from '../../src/analysis/severity.js';
import type {
  AxeResults,
  ContentResults,
  Finding,
  LighthouseResults,
  Priority,
  UXResults,
} from '../../src/analysis/types.js';
import { MarkdownTemplate } from '../../src/reports/templates/markdown.js';
import type { Audit, AuditFinding } from '../../src/storage/types.js';

/**
 * Sprint 19-01 — priorité canonique, comptage et ordre de recommandation.
 *
 * Chaque test nomme le critère qu'il couvre (C-W01, C-W02, C-W04) et
 * l'oracle de `docs/audit/produit/22_CRITERES_ET_TESTS_MVP4.md`.
 *
 * Oracle commun : la priorité canonique est celle de la matrice
 * `severity × (6 − effort)` (seuils 20/12/6/2). Toute priorité déclarée par un
 * analyseur qui diverge de ce calcul doit être requalifiée avant publication.
 */
const matrix = new SeverityMatrix();

/** Priorité canonique attendue pour un constat. */
function canonical(finding: Finding): Priority {
  return matrix.calculatePriority(finding);
}

/** Cinq priorités, dans l'ordre de la matrice. */
const PRIORITIES: readonly Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

const lighthouse: LighthouseResults = {
  performance: {
    score: 75,
    metrics: { lcp: 3000, fid: 150, cls: 0.15, ttfb: 1000 },
  },
  seo: {
    score: 80,
    issues: [{ title: 'Meta description', description: 'Missing', severity: 'error' }],
  },
};

/**
 * Deux violations de titres identiques (`description`), d'identifiants
 * différents : elles doivent rester deux constats distincts (C-W01).
 */
const axe: AxeResults = {
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Contraste insuffisant',
      help: 'Augmenter le contraste',
      helpUrl: 'https://example.com/contrast',
      nodes: 5,
    },
    {
      id: 'label',
      impact: 'serious',
      description: 'Contraste insuffisant',
      help: 'Ajouter un libellé',
      helpUrl: 'https://example.com/label',
      nodes: 5,
    },
  ],
  score: 70,
};

const ux: UXResults = {
  score: 65,
  heuristics: [
    {
      id: 'visibility-status',
      name: 'Visibility of system status',
      score: 50,
      issues: ['Aucun indicateur de chargement'],
    },
  ],
};

/**
 * 250 mots : sous le minimum de 300, le constat `content-word-count-low` est
 * déclaré `high` par l'analyseur avec `severity: 3`, `effort: 3`, soit
 * `3 × (6 − 3) = 9` → `medium` selon la matrice. C'est le cas discriminant de
 * C-W01 : la priorité publiée doit être `medium`, pas `high`.
 */
const content: ContentResults = {
  score: 60,
  metrics: { wordCount: 250, readingTime: 2, readabilityScore: 55 },
};

/** Lance le pipeline complet sur la fixture commune. */
function analyzeFixture(): ReturnType<AnalysisPipeline['analyze']> {
  return new AnalysisPipeline().analyze('https://example.com', lighthouse, axe, ux, content);
}

describe('Sprint 19-01 — C-W01 priorité canonique', () => {
  it('requalifie avec la matrice une priorité indicative divergente', async () => {
    const declared = new ContentAnalyzer()
      .analyze(content)
      .findings.find((finding) => finding.id === 'content-word-count-low');

    // La fixture est discriminante : l'analyseur annonce `high`, la matrice dit `medium`.
    expect(declared?.priority).toBe('high');
    expect(declared === undefined ? undefined : canonical(declared)).toBe('medium');

    const report = await analyzeFixture();
    const published = report.findings.find((finding) => finding.id === 'content-word-count-low');

    expect(published?.priority).toBe('medium');
  });

  it('applique la priorité canonique à la liste générale, aux dimensions et au classement', async () => {
    const report = await analyzeFixture();

    // Liste générale.
    for (const finding of report.findings) {
      expect(finding.priority).toBe(canonical(finding));
    }

    // Classement prioritaire.
    for (const finding of report.priorityFindings) {
      expect(finding.priority).toBe(canonical(finding));
    }

    // Détail par dimension : même constat, même priorité que dans la liste générale.
    for (const dimension of Object.values(report.dimensions)) {
      for (const finding of dimension.findings) {
        expect(finding.priority).toBe(canonical(finding));

        const same = report.findings.find(
          (candidate) => candidate.id === finding.id && candidate.dimension === finding.dimension,
        );
        expect(same?.priority).toBe(finding.priority);
      }
    }
  });

  it('conserve deux constats distincts de même titre', async () => {
    const report = await analyzeFixture();

    const sameTitle = report.findings.filter(
      (finding) => finding.title === 'Contraste insuffisant',
    );

    expect(sameTitle).toHaveLength(2);
    expect(new Set(sameTitle.map((finding) => finding.id)).size).toBe(2);
    expect(
      report.priorityFindings.filter((finding) => finding.title === 'Contraste insuffisant'),
    ).toHaveLength(2);
  });
});

describe('Sprint 19-01 — C-W02 compteurs', () => {
  it('expose les cinq compteurs et les fait correspondre au détail', async () => {
    const report = await analyzeFixture();
    const summary = report.summary as unknown as Record<string, number>;

    const counters = PRIORITIES.map((priority) => summary[`${priority}Findings`]);

    // Aucun compteur ne doit manquer, `info` compris.
    for (const [index, value] of counters.entries()) {
      expect(Number.isInteger(value as number), `compteur ${String(PRIORITIES[index])}`).toBe(true);
    }

    // Somme des cinq = total = nombre de constats représentés.
    expect(counters.reduce<number>((sum, value) => sum + (value as number), 0)).toBe(
      report.summary.totalFindings,
    );
    expect(report.summary.totalFindings).toBe(report.findings.length);

    // Chaque compteur correspond au nombre réel dans la liste générale.
    for (const priority of PRIORITIES) {
      expect(summary[`${priority}Findings`]).toBe(
        report.findings.filter((finding) => finding.priority === priority).length,
      );
    }
  });

  it('compte zéro constat quand aucun constat n’est produit', async () => {
    const clean: LighthouseResults = {
      performance: { score: 100, metrics: { lcp: 1000, fid: 20, cls: 0.01, ttfb: 200 } },
      seo: { score: 100, issues: [] },
    };
    const report = await new AnalysisPipeline().analyze(
      'https://example.com',
      clean,
      { violations: [], score: 100 },
      { score: 100, heuristics: [] },
      { score: 100, metrics: { wordCount: 1200, readingTime: 6, readabilityScore: 70 } },
    );
    const summary = report.summary as unknown as Record<string, number>;

    expect(report.findings).toHaveLength(report.summary.totalFindings);
    expect(summary.infoFindings).toBe(0);
    expect(
      PRIORITIES.map((priority) => summary[`${priority}Findings`]).reduce<number>(
        (sum, value) => sum + (value as number),
        0,
      ),
    ).toBe(report.summary.totalFindings);
  });
});

/** Constat persisté (forme `AuditFinding`) construit depuis un constat d'analyse. */
function toAuditFinding(finding: Finding, auditId: number): AuditFinding {
  return {
    auditId,
    dimension: finding.dimension,
    title: finding.title,
    description: finding.description,
    severity: finding.severity,
    effort: finding.effort,
    impact: finding.impact,
    priority: finding.priority,
    recommendation: finding.recommendation,
  };
}

/**
 * Audit dont l'ordre de recommandation (`severity × impact × 10 − effort`)
 * contredit la priorité canonique :
 * - A : severity 4, effort 5, impact 5 → matrice 4 → `low`, recommandation 195 ;
 * - B : severity 2, effort 1, impact 1 → matrice 10 → `medium`, recommandation 19.
 * Le classement « recommandation » place A en tête, la priorité canonique
 * place B devant. Aucun des deux n'est un défaut (C-W04).
 */
function buildAudit(): Audit {
  const id = 42;
  const findings: AuditFinding[] = [
    {
      auditId: id,
      dimension: 'performance',
      title: 'Refonte du rendu critique',
      description: 'Chantier lourd, fort impact visuel.',
      severity: 4,
      effort: 5,
      impact: 5,
      priority: 'low',
      recommendation: 'Repenser le rendu par étapes.',
    },
    {
      auditId: id,
      dimension: 'seo',
      title: 'Balise de titre absente',
      description: 'Correction immédiate et peu coûteuse.',
      severity: 2,
      effort: 1,
      impact: 1,
      priority: 'medium',
      recommendation: 'Ajouter une balise de titre unique.',
    },
  ];

  return {
    metadata: {
      id,
      url: 'https://example.com',
      timestamp: '2026-10-30T10:00:00.000Z',
      overallScore: 74,
      totalFindings: 2,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 1,
      lowFindings: 1,
      infoFindings: 0,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension) => ({ auditId: id, dimension, score: 74, findingsCount: 0 }),
    ),
    findings,
  };
}

describe('Sprint 19-01 — C-W04 ordre de recommandation', () => {
  it('identifie explicitement le classement comme un ordre de recommandation distinct', () => {
    const template = new MarkdownTemplate();
    const audit = buildAudit();
    const section = template.generateRecommendations(audit);

    // Le classement affiché est nommé et distingué de la priorité canonique.
    expect(section).toContain('Top 5 recommandations');
    expect(section.toLowerCase()).toContain('ordre de recommandation');
    expect(section.toLowerCase()).toContain('priorité canonique');

    // Le constat le plus haut dans le classement est bien celui dont la
    // priorité canonique est la plus faible : les deux ordres diffèrent.
    const firstMentioned = section.indexOf('Refonte du rendu critique');
    const secondMentioned = section.indexOf('Balise de titre absente');
    expect(firstMentioned).toBeGreaterThan(-1);
    expect(secondMentioned).toBeGreaterThan(-1);
    expect(firstMentioned).toBeLessThan(secondMentioned);
  });

  it('ne modifie ni les priorités du détail ni les compteurs', () => {
    const template = new MarkdownTemplate();
    const audit = buildAudit();
    const before = JSON.stringify(audit);

    const section = template.generateRecommendations(audit);

    // Priorités du détail inchangées (les en-têtes du détail sont en capitales).
    expect(audit.findings.map((finding) => finding.priority)).toEqual(['low', 'medium']);
    expect(template.generateFindings(audit)).toContain('LOW');
    expect(template.generateFindings(audit)).toContain('MEDIUM');

    // Compteurs inchangés et cohérents.
    const metadata = audit.metadata;
    expect(metadata.criticalFindings + metadata.highFindings + metadata.mediumFindings).toBe(1);
    expect(metadata.lowFindings + metadata.infoFindings).toBe(1);
    expect(metadata.totalFindings).toBe(2);

    // La génération reste pure : l'audit n'est pas modifié.
    expect(JSON.stringify(audit)).toBe(before);
    expect(section).not.toContain('undefined');
  });
});

/** Le type `AuditFinding` sert à vérifier la forme persistée (C-W01 stockage). */
describe('Sprint 19-01 — C-W01 cohérence de la forme persistée', () => {
  it('conserve la priorité canonique à la conversion vers la forme persistée', async () => {
    const report = await analyzeFixture();

    for (const finding of report.priorityFindings) {
      const persisted = toAuditFinding(finding, 1);
      expect(persisted.priority).toBe(canonical(finding));
    }
  });
});
