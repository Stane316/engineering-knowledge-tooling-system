#!/usr/bin/env node
/**
 * Inspecte le Data Layer et affiche un état lisible des trois bases SQLite.
 *
 * Remplace les commandes `node -e "…"` multi-lignes, qui ne fonctionnent pas
 * telles quelles dans PowerShell. Utilisable depuis n'importe quel shell.
 *
 * Prérequis : `npm run build` (le script consomme le code compilé de `dist/`).
 * Usage : `npm run db:inspect`
 */
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const compiledEntry = join(root, 'dist', 'data', 'database.js');

if (!existsSync(compiledEntry)) {
  console.error(
    'dist/data/database.js est absent — exécuter `npm run build` avant `npm run db:inspect`.',
  );
  process.exit(1);
}

const { openDatabase } = await import(pathToFileURL(compiledEntry).href);

const database = openDatabase();
const { connection, paths } = database;

const query = (sql) => connection.prepare(sql).all();
const single = (sql) => connection.prepare(sql).get();

/** Tables de service générées par FTS5, `vec0` et SQLite (`sqlite_sequence`). */
const isInternalTable = (name) =>
  name.startsWith('resources_fts_') ||
  name.startsWith('resources_vectors_') ||
  name.startsWith('sqlite_');

console.log('EKTS — état du Data Layer\n');

console.log('Fichiers');
for (const [label, file] of [
  ['principale', paths.main],
  ['plein texte', paths.fts],
  ['vectorielle', paths.vectors],
]) {
  const exists = existsSync(file);

  if (!exists) {
    console.log(`  ${label.padEnd(12)} ${file} (absent)`);
    continue;
  }

  const stats = statSync(file);
  const mode = process.platform === 'win32' ? '' : `  0o${(stats.mode & 0o777).toString(8)}`;

  console.log(`  ${label.padEnd(12)} ${file}  ${stats.size} octets${mode}`);
}

console.log('\nSchémas');
const schemaInfo = [
  ['main', connection.pragma('main.journal_mode', { simple: true })],
  ['fts', connection.pragma('fts.journal_mode', { simple: true })],
  ['vectors', connection.pragma('vectors.journal_mode', { simple: true })],
];

for (const [schema, mode] of schemaInfo) {
  console.log(`  ${schema.padEnd(8)} journal_mode=${mode}`);
}

console.log(`  user_version = ${connection.pragma('user_version', { simple: true })}`);

console.log('\nTables');
for (const schema of ['main', 'fts', 'vectors']) {
  const all = query(
    `SELECT name FROM ${schema}.sqlite_master WHERE type = 'table' ORDER BY name`,
  ).map((row) => row.name);
  const visible = all.filter((name) => !isInternalTable(name));
  const internalCount = all.length - visible.length;

  console.log(
    `  ${schema.padEnd(8)} ${visible.length > 0 ? visible.join(', ') : '(aucune)'}` +
      (internalCount > 0 ? `  (+${internalCount} tables internes)` : ''),
  );
}

console.log('\nMigrations appliquées');
for (const migration of query(
  'SELECT version, name, applied_at FROM schema_migrations ORDER BY version',
)) {
  console.log(`  v${migration.version}  ${migration.name.padEnd(10)} ${migration.applied_at}`);
}

console.log('\nExtensions et volumes');
console.log(`  sqlite        ${single('SELECT sqlite_version() AS version').version}`);
console.log(`  sqlite-vec    ${single('SELECT vec_version() AS version').version}`);
console.log(`  ressources    ${single('SELECT count(*) AS total FROM resources').total}`);
console.log(`  index FTS     ${single('SELECT count(*) AS total FROM fts.resources_fts').total}`);
console.log(
  `  vecteurs      ${single('SELECT count(*) AS total FROM vectors.resources_vectors').total}`,
);

database.close();
