import { existsSync, statSync } from 'node:fs';

import type { Command } from 'commander';

import { createKnowledgeManager } from '../../business/knowledge-manager.js';
import { openDatabase, resolveDatabasePaths } from '../../data/database.js';
import { VectorRepository } from '../../data/vector-repository.js';
import { VERSION } from '../../shared/version.js';
import { execute, withOutputFlags } from '../command.js';
import { formatBytes, renderTable, type Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

export interface DatabaseStatus {
  name: string;
  label: string;
  path: string;
  exists: boolean;
  sizeBytes: number;
}

export interface StatusReport {
  version: string;
  dataDir: string;
  databases: DatabaseStatus[];
  resources: {
    total: number;
    byType: Record<string, number>;
    indexed: number;
    consistent: boolean;
  } | null;
  vectors: { count: number; space: string | null } | null;
  system: { node: string; platform: string };
}

/**
 * Dresse l'état du système sans jamais créer de base.
 *
 * Les fichiers sont inspectés avant toute ouverture ; la connexion n'est
 * établie (`migrate: false`) que si les trois bases existent. Un `status` sur
 * une installation neuve ne doit rien modifier.
 */
export async function collectStatus(runtime: CliRuntime): Promise<StatusReport> {
  const paths = resolveDatabasePaths(runtime.dataDir);

  const databases = [
    { name: 'ekts.db', label: 'principale', path: paths.main },
    { name: 'ekts-fts.db', label: 'plein texte', path: paths.fts },
    { name: 'ekts-vectors.db', label: 'vectorielle', path: paths.vectors },
  ].map((file): DatabaseStatus => {
    const exists = existsSync(file.path);

    return { ...file, exists, sizeBytes: exists ? statSync(file.path).size : 0 };
  });

  let resources: StatusReport['resources'] = null;
  let vectors: StatusReport['vectors'] = null;

  if (databases.every((database) => database.exists)) {
    const database = openDatabase({ dataDir: runtime.dataDir, migrate: false });

    try {
      const { manager } = createKnowledgeManager(database.connection);
      const stats = await manager.stats();
      const repository = new VectorRepository(database.connection);
      const space = repository.activeSpace();

      resources = {
        total: stats.total,
        byType: stats.byType,
        indexed: stats.indexed,
        consistent: stats.consistent,
      };
      vectors = { count: repository.count(), space: space === null ? null : space.space };
    } finally {
      database.close();
    }
  }

  return {
    version: VERSION,
    dataDir: runtime.dataDir,
    databases,
    resources,
    vectors,
    system: { node: process.version, platform: process.platform },
  };
}

function renderStatus(report: StatusReport, palette: Palette): string {
  const lines = [
    palette.bold('EKTS — statut'),
    `  version      ${report.version}`,
    `  node         ${report.system.node}`,
    `  plateforme   ${report.system.platform}`,
    `  données      ${report.dataDir}`,
    '',
    palette.bold('Bases'),
    renderTable({
      columns: [
        { header: 'BASE' },
        { header: 'ÉTAT' },
        { header: 'TAILLE', align: 'right' },
        { header: 'CHEMIN' },
      ],
      rows: report.databases.map((database) => [
        database.label,
        database.exists ? 'présente' : 'absente',
        database.exists ? formatBytes(database.sizeBytes) : '-',
        database.path,
      ]),
    }),
    '',
    palette.bold('Ressources'),
  ];

  if (report.resources === null) {
    lines.push('  état         bases incomplètes : exécutez « ekts init ».');
  } else {
    const perType = Object.entries(report.resources.byType)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${type} ${String(count)}`);

    lines.push(
      `  total        ${String(report.resources.total)}`,
      `  indexées     ${String(report.resources.indexed)}`,
      `  cohérence    ${report.resources.consistent ? 'oui' : 'non (exécutez « npm run db:reindex »)'}`,
      `  par type     ${perType.length === 0 ? '(aucune)' : perType.join(', ')}`,
    );
  }

  lines.push('', palette.bold('Vecteurs'));

  if (report.vectors === null) {
    lines.push('  état         indisponible (bases incomplètes).');
  } else {
    lines.push(
      `  nombre       ${String(report.vectors.count)}`,
      `  espace       ${report.vectors.space ?? '(non lié)'}`,
    );
  }

  return lines.join('\n');
}

/** Enregistre `ekts status`. */
export function registerStatus(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('status')
      .description('affiche l’état des bases, des index et de la configuration'),
  ).action(async (_options: unknown, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectStatus(runtime);

      return { human: renderStatus(report, palette), json: report };
    });
  });
}
