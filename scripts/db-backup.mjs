#!/usr/bin/env node
/**
 * Sauvegarde, vérification et restauration des trois bases (Sprint 23-03, C-O04).
 *
 * Usage :
 *   npm run db:backup -- --target <dossier>
 *   npm run db:verify -- --backup <dossier>
 *   npm run db:restore -- --backup <dossier> [--force]
 *
 * Aucune commande ne détruit de données sans `--force` explicite. En cas
 * d'incohérence ressources/index, la restauration est refusée.
 */
import { createBackup, restoreBackup, verifyBackup } from '../dist/data/backup.js';

const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);

  return index === -1 ? undefined : args[index + 1];
};

const dataDir = process.env.EKTS_DATA_DIR ?? './data';
const command = args[0] ?? 'help';

try {
  if (command === 'backup') {
    const targetDir = value('--target');

    if (targetDir === undefined) {
      throw new Error('--target <dossier> est obligatoire');
    }

    const manifest = createBackup({ dataDir, targetDir });

    console.log(
      `Sauvegarde écrite : ${manifest.databases.length} bases, ` +
        `${manifest.consistency.resources} ressources, cohérente=${manifest.consistency.coherent}`,
    );
  } else if (command === 'verify') {
    const backupDir = value('--backup');

    if (backupDir === undefined) {
      throw new Error('--backup <dossier> est obligatoire');
    }

    const verdict = verifyBackup(backupDir);

    console.log(
      verdict.ok ? 'Sauvegarde valide' : `Sauvegarde invalide : ${verdict.problems.join(' ; ')}`,
    );
    process.exitCode = verdict.ok ? 0 : 1;
  } else if (command === 'restore') {
    const backupDir = value('--backup');

    if (backupDir === undefined) {
      throw new Error('--backup <dossier> est obligatoire');
    }

    const report = restoreBackup({ backupDir, dataDir, overwrite: args.includes('--force') });

    console.log(
      `Restauration terminée : ${report.counts.resources} ressources, ${report.counts.ftsRows} entrées FTS`,
    );
  } else {
    console.log(
      'Commandes : backup --target <dossier> | verify --backup <dossier> | restore --backup <dossier> [--force]',
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
