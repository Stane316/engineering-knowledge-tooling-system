#!/usr/bin/env node
/**
 * Vérifie que l'environnement local est prêt à exécuter EKTS.
 *
 * Contrôle : version de Node, chargement de `better-sqlite3` depuis ses
 * binaires précompilés, chargement de l'extension `sqlite-vec`, présence des
 * outils de développement et des hooks Git.
 *
 * Usage : `npm run check:env` (ou via `npm run setup`).
 */
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const MINIMUM_NODE = [22, 19, 0];

const failures = [];

function report(ok, label, detail = '') {
  const status = ok ? 'OK  ' : 'FAIL';
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`${status} ${label}${suffix}`);

  if (!ok) {
    failures.push(label);
  }
}

function checkNode() {
  const current = process.versions.node.split('.').map(Number);

  if (!existsSync(join(root, 'node_modules'))) {
    report(false, 'Dépendances installées', 'node_modules absent — exécuter `npm ci`');
    return;
  }

  report(true, 'Dépendances installées');

  const tooOld =
    current[0] < MINIMUM_NODE[0] ||
    (current[0] === MINIMUM_NODE[0] && current[1] < MINIMUM_NODE[1]);

  report(!tooOld, 'Version de Node', `${process.versions.node} (minimum 22.19)`);
}

function checkSqlite() {
  try {
    const Database = require('better-sqlite3');
    const database = new Database(':memory:');
    const { version } = database.prepare('SELECT sqlite_version() AS version').get();
    database.close();

    report(true, 'better-sqlite3', `SQLite ${version} (binaire précompilé)`);
  } catch (error) {
    report(
      false,
      'better-sqlite3',
      `${error.message} — exécuter \`npm ci\` (\`node_modules\` incomplet ?)`,
    );
  }
}

function checkVectors() {
  try {
    const Database = require('better-sqlite3');
    const sqliteVec = require('sqlite-vec');
    const database = new Database(':memory:');
    sqliteVec.load(database);
    const { version } = database.prepare('SELECT vec_version() AS version').get();
    database.close();

    report(true, 'sqlite-vec', version);
  } catch (error) {
    report(false, 'sqlite-vec', `${error.message} — paquet plateforme manquant ?`);
  }
}

function checkDevTools() {
  const binDir = join(root, 'node_modules', '.bin');
  const exists = (name) =>
    ['', '.cmd', '.ps1'].some((extension) => existsSync(join(binDir, `${name}${extension}`)));

  const missing = ['tsc', 'vitest', 'eslint', 'prettier'].filter((tool) => !exists(tool));

  report(
    missing.length === 0,
    'Outils de développement',
    missing.length === 0
      ? 'tsc, vitest, eslint et prettier disponibles'
      : `manquant : ${missing.join(', ')}`,
  );
}

function checkHooks() {
  if (process.env.CI) {
    console.log('SKIP Hooks Git — environnement CI (aucun commit)');
    return;
  }

  const hooksPath = join(root, '.husky', '_');

  report(
    existsSync(hooksPath),
    'Hooks Git',
    existsSync(hooksPath) ? 'installés' : 'absents — exécuter `npm run setup`',
  );
}

console.log(`EKTS — vérification de l'environnement (${process.platform}/${process.arch})\n`);

checkNode();
checkSqlite();
checkVectors();
checkDevTools();
checkHooks();

if (failures.length > 0) {
  console.log(`\n${failures.length} contrôle(s) en échec. Voir docs/guides/SETUP.md §6.`);
  process.exitCode = 1;
} else {
  console.log('\nEnvironnement prêt. Prochaines étapes : `npm run verify`.');
}
