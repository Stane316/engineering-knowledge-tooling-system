import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { openDatabase } from '../../../src/data/database.js';
import { AuditSchema } from '../../../src/storage/schema.js';

/**
 * Helpers des tests E2E MVP-3 (Sprint 18-01).
 *
 * **Écart P3 (spec vs maison)** : le spec SPRINT-18-01 lançait
 * `npm init` + `npm install file:../..` puis `npx ekts …` dans chaque
 * `beforeAll` (plusieurs minutes au total, réseau npm requis, > budget
 * 120 s) et appelait des commandes inexistantes (`audit <url> --findings`,
 * `report generate`, `template apply e-commerce`, `project delete --id`).
 * Ici : **CLI compilée `dist/cli/index.js`** (pattern maison Sprint 12,
 * `tests/e2e/cli-flow.test.ts`), bac à sable `EKTS_DATA_DIR`, et
 * **audits seedés en SQL** (tables `audit_*` réelles) au lieu de l'inspection
 * navigateur — authentique, déterministe, hors ligne, largement < 120 s.
 * L'inspection navigateur reste couverte par `tests/e2e/cli-flow.test.ts`
 * (Sprint 12).
 */

const ROOT = process.cwd();
/** CLI compilée (exécution réelle — `npm run build` avant les E2E). */
const CLI = path.join(ROOT, 'dist', 'cli', 'index.js');

/** Résultat d'une exécution CLI. */
export interface CliResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Bac à sable E2E (bases + rapports isolés). */
export interface Sandbox {
  /** Répertoire racine du test. */
  readonly dir: string;
  /** Répertoire des bases (`EKTS_DATA_DIR`). */
  readonly dataDir: string;
  /** Libère le bac à sable. */
  cleanup(): Promise<void>;
}

/** Crée un bac à sable isolé (bases SQLite + fichiers de sortie). */
export async function createSandbox(prefix = 'ekts-e2e-mvp3-'): Promise<Sandbox> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  const dataDir = path.join(dir, 'data');
  return {
    dir,
    dataDir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

/**
 * Exécute la CLI compilée dans le bac à sable.
 *
 * `execFile` async (jamais `execFileSync`) pour ne pas bloquer l'event
 * loop du worker ; `EKTS_OFFLINE=1` interdit tout appel réseau d'embeddings.
 *
 * @param dataDir - Répertoire de données du test.
 * @param args - Arguments CLI (ex. `['project', 'list', '--json']`).
 * @returns Code de sortie + sorties brute.
 */
export function runCli(dataDir: string, args: string[]): Promise<CliResult> {
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
              ? ((error as { code: number }).code)
              : 1;
        resolve({ status, stdout, stderr });
      },
    );
  });
}

/** Analyse la sortie standard d'une commande `--json`. */
export function parseJson<T>(result: CliResult): T {
  return JSON.parse(result.stdout) as T;
}

/** Un finding seedé. */
export interface SeedFinding {
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  title: string;
  severity?: 0 | 1 | 2 | 3 | 4;
  effort?: 1 | 2 | 3 | 4 | 5;
  impact?: 1 | 2 | 3 | 4 | 5;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

/** Options d'un audit seedé. */
export interface SeedAuditOptions {
  projectId?: string | null;
  url?: string;
  /** Horodatage ISO 8601 (défaut : date du test stable). */
  timestamp: string;
  /** Score global 0-100 (défaut : 70). */
  score?: number;
  findings?: SeedFinding[];
}

/**
 * Insère un audit réel (metadata + dimensions + findings) dans le
 * bac à sable — même structure que `AuditRepository.store`, sans
 * navigateur ni réseau.
 *
 * @param dataDir - Répertoire de données du test.
 * @param options - Audit à insérer.
 * @returns Identifiant numérique de l'audit.
 */
export function seedAudit(dataDir: string, options: SeedAuditOptions): number {
  const database = openDatabase({ dataDir });
  try {
    new AuditSchema(database.connection).createSchema();

    const findings = options.findings ?? [];
    const byDimension = new Map<string, number>();
    for (const finding of findings) {
      byDimension.set(finding.dimension, (byDimension.get(finding.dimension) ?? 0) + 1);
    }

    const meta = database.connection
      .prepare(
        `INSERT INTO audit_metadata
           (url, timestamp, overall_score, total_findings,
            critical_findings, high_findings, medium_findings, low_findings,
            project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        options.url ?? 'https://fixture.example',
        options.timestamp,
        options.score ?? 70,
        findings.length,
        findings.filter((f) => f.severity === 4).length,
        findings.filter((f) => f.severity === 3).length,
        findings.filter((f) => f.severity === 2).length,
        findings.filter((f) => (f.severity ?? 0) <= 1).length,
        options.projectId ?? null,
      );
    const auditId = Number(meta.lastInsertRowid);

    const dimensionStatement = database.connection.prepare(
      `INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
       VALUES (?, ?, ?, ?)`,
    );
    for (const dimension of ['performance', 'accessibility', 'seo', 'ux', 'content'] as const) {
      dimensionStatement.run(
        auditId,
        dimension,
        dimension === (findings[0]?.dimension ?? 'performance')
          ? (options.score ?? 70)
          : Math.min(100, (options.score ?? 70) + 10),
        byDimension.get(dimension) ?? 0,
      );
    }

    const findingStatement = database.connection.prepare(
      `INSERT INTO audit_findings
         (audit_id, dimension, title, severity, effort, impact, priority, recommendation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const finding of findings) {
      findingStatement.run(
        auditId,
        finding.dimension,
        finding.title,
        finding.severity ?? 2,
        finding.effort ?? 2,
        finding.impact ?? 3,
        finding.priority ?? 'medium',
        'Recommandation générée depuis la fixture E2E',
      );
    }

    return auditId;
  } finally {
    database.close();
  }
}

/** Liste les identifiants des projets du bac à sable (ordre d'insertion). */
export async function listProjectIds(dataDir: string): Promise<string[]> {
  const result = await runCli(dataDir, ['project', 'list', '--json']);
  const payload = parseJson<{ projects: { id: string }[] }>(result);
  return payload.projects.map((project) => project.id);
}
