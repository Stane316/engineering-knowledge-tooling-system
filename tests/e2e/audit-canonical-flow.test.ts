import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { labVitals } from '../../src/analysis/measurement.js';

import { AnalysisPipeline } from '../../src/analysis/pipeline.js';
import { SeverityMatrix } from '../../src/analysis/severity.js';
import type {
  AxeResults,
  ContentResults,
  LighthouseResults,
  UXResults,
} from '../../src/analysis/types.js';
import { openDatabase } from '../../src/data/database.js';
import { AuditRepository } from '../../src/storage/audit-repository.js';
import { AuditSchema } from '../../src/storage/schema.js';
import type { Audit } from '../../src/storage/types.js';

/**
 * Sprint 19-01 — niveau **E2E** exigé par `SPRINT-19-01.md` §4 :
 * « observer liste/compteurs par le parcours d'audit local synthétique ».
 *
 * Parcours réel, sans navigateur, sans site externe, sans réseau :
 * fixtures synthétiques → `AnalysisPipeline` (analyse réelle) →
 * `AuditRepository.store` (base isolée) → **CLI compilée**
 * (`dist/cli/index.js`) en mode `--json`.
 *
 * Ce que ce niveau ajoute aux tests U et I : il vérifie que la priorité
 * canonique et les cinq compteurs **traversent réellement la CLI** (tri,
 * affichage, sérialisation JSON), et non seulement les objets internes.
 *
 * **GREEN initial justifié** : la correction a été livrée au niveau U/I dans
 * le même sous-sprint ; un RED ici aurait exigé de réintroduire le défaut.
 * La discrimination du test est prouvée par ses assertions : avant la
 * correction, `audit show` publiait `high` (priorité indicative de
 * l'analyseur) là où la matrice donne `medium`, et `infoFindings` n'existait
 * pas dans la sortie JSON.
 */
const ROOT = process.cwd();
const CLI = path.join(ROOT, 'dist', 'cli', 'index.js');

/** Résultat d'une exécution CLI. */
interface CliResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Exécute la CLI compilée dans un répertoire de données isolé. */
function runCli(dataDir: string, args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      {
        env: {
          ...process.env,
          EKTS_DATA_DIR: dataDir,
          EKTS_OFFLINE: '1',
          NO_COLOR: '1',
          FORCE_COLOR: '0',
        },
        timeout: 60_000,
        maxBuffer: 8 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const status =
          error === null
            ? 0
            : typeof (error as { code?: unknown }).code === 'number'
              ? (error as { code: number }).code
              : 1;
        resolve({ status, stdout, stderr });
      },
    );
  });
}

const lighthouse: LighthouseResults = {
  performance: {
    score: 75,
    metrics: labVitals({
      lcp: 3000,
      fid: 150,
      cls: 0.15,
      ttfb: 1000,
    }),
  },
  seo: {
    score: 80,
    issues: [{ title: 'Meta description', description: 'Manquante', severity: 'error' }],
  },
};

/** Deux violations de même titre : elles doivent rester deux constats. */
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
    { id: 'visibility-status', name: 'Statut du système', score: 50, issues: ['Aucun retour'] },
  ],
};

/** 250 mots : sous le minimum, `severity 3 × effort 3` → `medium` canonique. */
const content: ContentResults = {
  score: 60,
  metrics: { wordCount: 250, readingTime: 2, readabilityScore: 55 },
};

/** Métadonnées telles que renvoyées par `audit show --json`. */
interface CliAuditMetadata {
  id: number;
  url: string;
  overallScore: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;
}

/** Audit complet tel que renvoyé par `audit show --json`. */
interface CliAudit extends Omit<Audit, 'metadata'> {
  metadata: CliAuditMetadata;
}

/** Priorité canonique d'un constat, calculée par la matrice réelle. */
function canonicalPriority(finding: { severity: number; effort: number }): string {
  return new SeverityMatrix().scoreToPriority(
    new SeverityMatrix().calculateScore(
      finding.severity as Parameters<SeverityMatrix['calculateScore']>[0],
      finding.effort as Parameters<SeverityMatrix['calculateScore']>[1],
    ),
  );
}

describe('Sprint 19-01 — E2E parcours d’audit local synthétique', () => {
  let dataDir: string;
  let auditId: number;

  beforeAll(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), 'ekts-e2e-1901-'));

    // 1. Analyse réelle (aucune doublure sur le pipeline).
    const report = await new AnalysisPipeline().analyze(
      'https://fixture.example/audit-19-01',
      lighthouse,
      axe,
      ux,
      content,
    );

    // 2. Stockage réel dans la base isolée du bac à sable.
    const database = openDatabase({ dataDir });
    try {
      new AuditSchema(database.connection).createSchema();
      const stored = new AuditRepository(database.connection).store(report);
      auditId = stored.metadata.id ?? 0;
    } finally {
      database.close();
    }
  }, 60_000);

  afterAll(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('publie par la CLI la priorité canonique observée dans les dimensions', async () => {
    const result = await runCli(dataDir, ['audit', 'show', String(auditId), '--json']);
    expect(result.status).toBe(0);

    const audit = JSON.parse(result.stdout) as CliAudit;
    expect(audit.metadata.id).toBe(auditId);

    // Le constat discriminant : l'analyseur annonce `high`, la matrice `medium`.
    const wordCount = audit.findings.find((finding) => finding.title === 'Contenu insuffisant');
    expect(wordCount?.severity).toBe(3);
    expect(wordCount?.effort).toBe(3);
    expect(wordCount?.priority).toBe('medium');
    expect(wordCount?.priority).toBe(canonicalPriority({ severity: 3, effort: 3 }));

    // 100 % des constats publiés par la CLI portent la priorité canonique.
    for (const finding of audit.findings) {
      expect(finding.priority).toBe(canonicalPriority(finding));
    }
  });

  it('expose les cinq compteurs et les fait correspondre au détail lu par la CLI', async () => {
    const show = await runCli(dataDir, ['audit', 'show', String(auditId), '--json']);
    const audit = JSON.parse(show.stdout) as CliAudit;
    const metadata = audit.metadata;

    const counters = [
      metadata.criticalFindings,
      metadata.highFindings,
      metadata.mediumFindings,
      metadata.lowFindings,
      metadata.infoFindings,
    ];

    expect(counters.every((value) => Number.isInteger(value) && value >= 0)).toBe(true);
    expect(counters.reduce((sum, value) => sum + value, 0)).toBe(metadata.totalFindings);
    expect(metadata.totalFindings).toBe(audit.findings.length);

    for (const priority of ['critical', 'high', 'medium', 'low', 'info'] as const) {
      expect(
        audit.findings.filter((finding) => finding.priority === priority).length,
        `compteur ${priority}`,
      ).toBe(metadata[`${priority}Findings` as keyof CliAuditMetadata]);
    }
  });

  it('affiche les cinq lignes de compteurs dans la sortie humaine', async () => {
    const result = await runCli(dataDir, ['audit', 'show', String(auditId), '--json']);

    // La sortie JSON ne doit pas contaminer stderr (aucun avertissement).
    expect(result.stderr).toBe('');

    const audit = JSON.parse(result.stdout) as CliAudit;
    const infoLine = `⚪ Info     : ${String(audit.metadata.infoFindings)}`;
    const human = await runCli(dataDir, ['audit', 'show', String(auditId)]);

    expect(human.status).toBe(0);
    expect(human.stdout).toContain('Répartition des constats');
    expect(human.stdout).toContain(infoLine);
    expect(human.stdout).toContain(`🔴 Critical : ${String(audit.metadata.criticalFindings)}`);
    expect(human.stdout).toContain(`🟠 High     : ${String(audit.metadata.highFindings)}`);
    expect(human.stdout).toContain(`🟡 Medium   : ${String(audit.metadata.mediumFindings)}`);
    expect(human.stdout).toContain(`🟢 Low      : ${String(audit.metadata.lowFindings)}`);
  });

  it('conserve deux constats distincts de même titre au travers de la CLI', async () => {
    const result = await runCli(dataDir, ['audit', 'show', String(auditId), '--json']);
    const audit = JSON.parse(result.stdout) as CliAudit;

    const sameTitle = audit.findings.filter((finding) => finding.title === 'Contraste insuffisant');

    expect(sameTitle).toHaveLength(2);
    expect(new Set(sameTitle.map((finding) => finding.id)).size).toBe(2);
  });

  it('liste l’audit avec des compteurs cohérents', async () => {
    const result = await runCli(dataDir, ['audit', 'list', '--json']);
    expect(result.status).toBe(0);

    const payload = JSON.parse(result.stdout) as { audits: CliAuditMetadata[] };
    const listed = payload.audits.find((audit) => audit.id === auditId);

    expect(listed).toBeDefined();
    expect(listed?.totalFindings).toBe(
      (listed?.criticalFindings ?? 0) +
        (listed?.highFindings ?? 0) +
        (listed?.mediumFindings ?? 0) +
        (listed?.lowFindings ?? 0) +
        (listed?.infoFindings ?? 0),
    );
  });
});
