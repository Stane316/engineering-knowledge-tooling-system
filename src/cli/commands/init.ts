import { existsSync, rmSync } from 'node:fs';

import type { Command } from 'commander';

import { openDatabase, resolveDatabasePaths, type DatabasePaths } from '../../data/database.js';
import { execute, withOutputFlags } from '../command.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

/** Bilan sérialisable de `ekts init`. */
export interface InitReport {
  dataDir: string;
  files: { main: string; fts: string; vectors: string };
  /** Les bases existaient déjà avant l'ouverture. */
  existed: boolean;
  /** `--force` a supprimé des fichiers existants. */
  reinitialized: boolean;
  schemaVersion: number;
  resources: number;
}

interface InitCliOptions {
  force?: boolean;
}

/** Suffixes des fichiers annexes créés par SQLite en mode WAL. */
const SQLITE_SIDE_SUFFIXES = ['', '-wal', '-shm'] as const;

/**
 * Supprime les trois bases et leurs fichiers annexes (`-wal`, `-shm`).
 *
 * Les fichiers annexes sont retirés avec la base : les laisser produirait une
 * incohérence au prochain démarrage (WAL orphelin appliqué à une base neuve).
 *
 * @returns Chemins effectivement supprimés (pour le rapport).
 */
export function removeDatabases(paths: DatabasePaths): string[] {
  const removed: string[] = [];

  for (const file of [paths.main, paths.fts, paths.vectors]) {
    for (const suffix of SQLITE_SIDE_SUFFIXES) {
      const target = `${file}${suffix}`;

      if (existsSync(target)) {
        rmSync(target, { force: true });
        removed.push(target);
      }
    }
  }

  return removed;
}

/**
 * Initialise les bases (ou applique les migrations manquantes).
 *
 * `--force` supprime d'abord les fichiers : c'est la seule opération
 * destructrice de la CLI, et elle est explicite.
 */
export async function collectInit(
  runtime: CliRuntime,
  options: InitCliOptions,
): Promise<InitReport> {
  const paths = resolveDatabasePaths(runtime.dataDir);
  const existed = existsSync(paths.main);
  const reinitialized = options.force === true && existed;

  if (options.force === true) {
    removeDatabases(paths);
  }

  const database = openDatabase({ dataDir: runtime.dataDir });

  try {
    const schemaVersion = Number(database.connection.pragma('user_version', { simple: true }));
    const row = database.connection.prepare('SELECT COUNT(*) AS total FROM resources').get() as {
      total: number;
    };

    return {
      dataDir: runtime.dataDir,
      files: { main: paths.main, fts: paths.fts, vectors: paths.vectors },
      existed,
      reinitialized,
      schemaVersion,
      resources: row.total,
    };
  } finally {
    database.close();
  }
}

function renderInit(report: InitReport, palette: Palette): string {
  const state = report.reinitialized
    ? 'Bases réinitialisées (--force).'
    : report.existed
      ? 'Bases déjà présentes : migrations appliquées, données conservées.'
      : 'Bases créées.';

  return [
    palette.bold('EKTS — initialisation'),
    `  répertoire   ${report.dataDir}`,
    `  principale   ${report.files.main}`,
    `  plein texte  ${report.files.fts}`,
    `  vectorielle  ${report.files.vectors}`,
    `  schéma       v${String(report.schemaVersion)}`,
    `  ressources   ${String(report.resources)}`,
    '',
    palette.success(state),
  ].join('\n');
}

/** Enregistre `ekts init`. */
export function registerInit(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('init')
      .description('initialise les trois bases SQLite (ekts.db, ekts-fts.db, ekts-vectors.db)')
      .option('--force', 'supprime les bases existantes avant de les recréer'),
  ).action(async (options: InitCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectInit(runtime, { force: options.force === true });

      return { human: renderInit(report, palette), json: report };
    });
  });
}
