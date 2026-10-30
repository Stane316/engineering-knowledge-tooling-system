import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HtmlReportGenerator } from '../../src/reports/html-generator.js';
import type { Priority } from '../../src/analysis/types.js';
import type { Audit, AuditFinding } from '../../src/storage/types.js';

/**
 * Sprint 19-02 — C-W03, volet HTML.
 *
 * Le critère exige que **les trois formats** (Markdown, HTML, PDF) soient
 * réellement produits pour un même audit synthétique et que le décompte par
 * priorité y soit contrôlable. Le format HTML n'existait pas comme sortie de
 * rapport : `HtmlTemplate` ne servait qu'à alimenter le PDF.
 *
 * Oracle : un audit à cinq priorités non vides doit voir ses cinq compteurs
 * dans le HTML produit, et leur somme doit égaler le total affiché.
 */

const PRIORITIES: readonly Priority[] = ['critical', 'high', 'medium', 'low', 'info'];

/** Constat persisté minimal. */
function makeFinding(
  dimension: AuditFinding['dimension'],
  priority: Priority,
  title: string,
): AuditFinding {
  return {
    auditId: 7,
    dimension,
    title,
    description: `Description de ${title}`,
    severity: priority === 'critical' ? 4 : 2,
    effort: 2,
    impact: 3,
    priority,
    recommendation: `Corriger ${title}`,
  };
}

/** Audit à cinq priorités non vides (deux constats `medium`). */
function makeAudit(): Audit {
  const findings: AuditFinding[] = [
    makeFinding('performance', 'critical', 'LCP critique'),
    makeFinding('accessibility', 'high', 'Contraste insuffisant'),
    makeFinding('seo', 'medium', 'Balise de titre absente'),
    makeFinding('ux', 'medium', 'Retour visuel manquant'),
    makeFinding('content', 'low', 'Temps de lecture court'),
    makeFinding('ux', 'info', 'Information de contexte'),
  ];

  return {
    metadata: {
      id: 7,
      url: 'https://fixture.example/sprint-19-02',
      timestamp: '2026-10-30T12:00:00.000Z',
      overallScore: 64,
      totalFindings: findings.length,
      criticalFindings: 1,
      highFindings: 1,
      mediumFindings: 2,
      lowFindings: 1,
      infoFindings: 1,
    },
    dimensions: (['performance', 'accessibility', 'seo', 'ux', 'content'] as const).map(
      (dimension, index) => ({
        auditId: 7,
        dimension,
        score: 60 + index,
        findingsCount: findings.filter((finding) => finding.dimension === dimension).length,
      }),
    ),
    findings,
  };
}

describe('Sprint 19-02 — C-W03 rendu HTML', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await mkdtemp(path.join(tmpdir(), 'ekts-html-'));
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  it('produit un document HTML autonome et mesurable', async () => {
    const result = await new HtmlReportGenerator().generate(makeAudit(), {
      outputPath: outputDir,
    });

    expect(result.format).toBe('html');
    expect(result.auditId).toBe(7);
    expect(result.filePath).toBeDefined();
    expect(path.extname(result.filePath ?? '')).toBe('.html');

    const written = await readFile(result.filePath ?? '', 'utf8');
    expect(written).toBe(result.content);

    // Document autonome : doctype, encodage et fermeture.
    expect(written.toLowerCase().startsWith('<!doctype html>')).toBe(true);
    expect(written).toContain('<meta charset="utf-8"');
    expect(written.trimEnd().endsWith('</html>')).toBe(true);

    // Le fichier existe réellement sur disque et n'est pas vide.
    expect((await stat(result.filePath ?? '')).size).toBeGreaterThan(500);
  });

  it('expose les cinq compteurs et leur total dans le HTML', async () => {
    const result = await new HtmlReportGenerator().generate(makeAudit(), {
      outputPath: outputDir,
    });
    const html = result.content;
    const metadata = makeAudit().metadata;

    expect(html).toContain(String(metadata.criticalFindings));
    expect(html).toContain('Info');
    expect(html).toContain(String(metadata.infoFindings));
    expect(html).toContain(String(metadata.totalFindings));

    // Chaque compteur est lisible dans une cellule dédiée, et la somme des
    // cinq valeurs égale le total affiché — aucune valeur perdue.
    const counters = PRIORITIES.map(
      (priority) => metadata[`${priority}Findings` as keyof typeof metadata] as number,
    );
    expect(counters.reduce((sum, value) => sum + value, 0)).toBe(metadata.totalFindings);

    for (const priority of PRIORITIES) {
      const expected = metadata[`${priority}Findings` as keyof typeof metadata] as number;
      const pattern = new RegExp(`count-${priority}">${String(expected)}<`, 'u');
      expect(html, `cellule ${priority}`).toMatch(pattern);
    }
  });

  it('nomme l’ordre de recommandation et le distingue de la priorité canonique', () => {
    const html = new HtmlReportGenerator().generateSync(makeAudit());

    expect(html).toContain('Top 5 recommandations');
    expect(html).toContain('Ordre de recommandation');
    expect(html).toContain('priorité canonique');
  });

  it('échappe le HTML des champs libres', () => {
    const audit = makeAudit();
    audit.findings[0]!.title = '<script>alert("x")</script>';

    const html = new HtmlReportGenerator().generateSync(audit);

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('rejette un audit sans métadonnées', () => {
    const invalid = { metadata: undefined } as unknown as Audit;

    expect(() => new HtmlReportGenerator().generateSync(invalid)).toThrow(/Audit invalide/u);
  });
});
