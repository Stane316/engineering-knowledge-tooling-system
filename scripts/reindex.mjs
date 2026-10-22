#!/usr/bin/env node
/**
 * Reconstruit l'index plein texte depuis la base principale.
 *
 * Utile lorsque `npm run db:inspect` signale un index désynchronisé : SQLite ne
 * garantit pas la durabilité transactionnelle entre fichiers attachés en mode
 * WAL, un arrêt brutal pouvant laisser l'index en retard.
 *
 * Prérequis : `npm run build`.
 * Usage : `npm run db:reindex`
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const databaseEntry = join(root, 'dist', 'data', 'database.js');
const indexerEntry = join(root, 'dist', 'business', 'indexer.js');

if (!existsSync(databaseEntry) || !existsSync(indexerEntry)) {
  console.error('Code compilé absent — exécuter `npm run build` avant `npm run db:reindex`.');
  process.exit(1);
}

const { openDatabase } = await import(pathToFileURL(databaseEntry).href);
const { Indexer } = await import(pathToFileURL(indexerEntry).href);

const database = openDatabase();
const indexer = new Indexer(database.connection);

const before = indexer.checkIntegrity();
console.log('EKTS — réindexation plein texte\n');
console.log(
  `  avant   ressources ${before.resources}, indexées ${before.indexed}, ` +
    `manquantes ${before.missing}, orphelines ${before.orphans}`,
);

const report = indexer.reindexAll();
const after = indexer.checkIntegrity();

console.log(
  `  après   ressources ${after.resources}, indexées ${after.indexed}, ` +
    `manquantes ${after.missing}, orphelines ${after.orphans}`,
);
console.log(`  durée   ${report.durationMs} ms`);
console.log(`  état    ${after.consistent ? 'cohérent' : 'INCOHÉRENT'}`);

database.close();
process.exitCode = after.consistent ? 0 : 1;
