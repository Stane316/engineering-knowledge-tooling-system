#!/usr/bin/env node
/**
 * Diagnostic de l'installation locale.
 *
 * Répond à une question simple : « mon dépôt est-il vraiment à jour, compilé
 * et installé ? ». Les erreurs « Cannot find module dist/cli/index.js » ou
 * « Everything up-to-date » viennent presque toujours d'un dépôt qui n'a pas
 * récupéré la branche, ou d'un `npm run build` oublié.
 *
 * Sortie volontairement en ASCII : les consoles Windows en CP437/CP850
 * n'affichent pas correctement les accents des journaux techniques.
 *
 * Usage : `npm run doctor`
 * Code de sortie : 0 si aucune anomalie bloquante, 1 sinon.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_NODE = [22, 12, 0];
const MIN_NPM = [10, 9, 0];

const results = [];
const advice = [];

/** Ajoute une ligne de diagnostic. */
function add(level, label, detail = '') {
  results.push({ level, label, detail });
}

/** Ajoute un conseil (une seule fois par identifiant). */
function advise(message) {
  if (!advice.includes(message)) {
    advice.push(message);
  }
}

/** Parse « v22.22.3 » ou « 10.9.8 » en triplet comparable. */
function parseVersion(raw) {
  const numbers = String(raw)
    .replace(/^v/i, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10));

  return [numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0];
}

/** `a` est-il au moins égal à `b` ? */
function atLeast(a, b) {
  for (let index = 0; index < b.length; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) {
      return (a[index] ?? 0) > (b[index] ?? 0);
    }
  }

  return true;
}

/** Exécute une commande et renvoie sa sortie, ou `null` en cas d'échec. */
function capture(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function checkNode() {
  const current = parseVersion(process.version);

  if (atLeast(current, MIN_NODE)) {
    add('ok', `Node.js ${process.version}`);
  } else {
    add('fail', `Node.js ${process.version}`, `minimum ${MIN_NODE.join('.')}`);
    advise('Installer Node.js 22.12 ou superieur (voir .nvmrc et SETUP.md section 1).');
  }
}

function checkNpm() {
  const agent = process.env.npm_config_user_agent ?? '';
  const match = /npm\/(\d+\.\d+\.\d+)/.exec(agent);

  if (match === null) {
    add('skip', 'npm', 'version non exposee par npm run');
    return;
  }

  const current = parseVersion(match[1]);

  if (atLeast(current, MIN_NPM)) {
    add('ok', `npm ${match[1]}`);
  } else {
    add('fail', `npm ${match[1]}`, `minimum ${MIN_NPM.join('.')}`);
    advise('Mettre npm a jour : npm install -g npm@latest.');
  }
}

function checkGit() {
  const inside = capture('git', ['rev-parse', '--is-inside-work-tree']);

  if (inside !== 'true') {
    add('warn', 'depot Git', 'introuvable ou archive sans .git');
    return null;
  }

  const branch = capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']) ?? 'inconnue';
  const head = capture('git', ['rev-parse', '--short', 'HEAD']) ?? 'inconnu';
  const dirty = capture('git', ['status', '--porcelain']) ?? '';
  const changes = dirty === '' ? 0 : dirty.split('\n').length;

  add(
    changes === 0 ? 'ok' : 'warn',
    `depot Git : ${branch} @ ${head}`,
    changes === 0 ? 'arbre propre' : `${changes} fichier(s) modifie(s)`,
  );

  if (changes > 0) {
    advise(
      'Verifier `git status` : des modifications non validees peuvent venir d un merge incomplet.',
    );
  }

  return { branch, head };
}

function checkSprint5() {
  const required = ['src/cli/program.ts', 'src/cli/commands/search.ts', 'tests/cli/cli.test.ts'];

  const missing = required.filter((file) => !existsSync(join(root, file)));

  if (missing.length === 0) {
    add('ok', 'code Sprint 5 present', 'src/cli + tests/cli');
  } else {
    add('fail', 'code Sprint 5 absent', missing.join(', '));
    advise(
      'Le merge n a pas ete applique : git fetch origin puis fusionner le commit de la branche (voir CLI.md section 2.1).',
    );
  }
}

function checkBuild() {
  const entry = join(root, 'dist', 'cli', 'index.js');

  if (!existsSync(entry)) {
    add('warn', 'compilation absente', 'dist/cli/index.js');
    advise('Compiler : npm run build.');
    return;
  }

  const source = join(root, 'src', 'cli', 'program.ts');

  if (existsSync(source) && statSync(source).mtimeMs > statSync(entry).mtimeMs) {
    add('warn', 'compilation obsolete', 'sources plus recentes que dist');
    advise('Recompiler : npm run build.');
    return;
  }

  add('ok', 'compilation a jour', 'dist/cli/index.js');
}

function checkDependencies() {
  const modules = join(root, 'node_modules');

  if (!existsSync(modules)) {
    add('warn', 'dependances absentes', 'node_modules');
    advise('Installer : npm ci puis npm run setup.');
    return;
  }

  const sqlite = join(modules, 'better-sqlite3');
  add(
    existsSync(sqlite) ? 'ok' : 'warn',
    'dependances installees',
    existsSync(sqlite) ? 'better-sqlite3 present' : 'better-sqlite3 absent',
  );

  if (!existsSync(sqlite)) {
    advise('Reinstaller : npm ci (ne jamais compiler better-sqlite3, voir SETUP.md 6.1).');
  }
}

function checkLineEndings() {
  const targets = ['package.json', 'tsconfig.json', 'src/cli/program.ts', 'src/index.ts'];
  const crlf = targets.filter((file) => {
    const path = join(root, file);

    return existsSync(path) && readFileSync(path, 'utf8').includes('\r\n');
  });

  if (crlf.length === 0) {
    add('ok', 'fins de ligne LF');
    return;
  }

  add('warn', 'fins de ligne CRLF', `${crlf.length} fichier(s) echantillon`);
  advise(
    'Renormaliser une fois : git config core.autocrlf false, puis git rm --cached -r . --quiet et git reset --hard (arbre propre exige). Voir SETUP.md 6.11.',
  );
}

function checkEnvFile() {
  if (existsSync(join(root, '.env'))) {
    add('ok', 'fichier .env present');
    return;
  }

  add('skip', 'fichier .env absent', 'commandes hors ligne uniquement');
  advise(
    'Pour les embeddings : copier .env.example vers .env et renseigner OPENAI_API_KEY (jamais versionne).',
  );
}

const LEVEL_LABELS = {
  ok: '[OK]  ',
  warn: '[!!]  ',
  fail: '[ERR] ',
  skip: '[--]  ',
};

checkNode();
checkNpm();
checkGit();
checkSprint5();
checkBuild();
checkDependencies();
checkLineEndings();
checkEnvFile();

console.log('EKTS - diagnostic de l installation');
console.log(`racine : ${root}`);
console.log('');

for (const result of results) {
  const suffix = result.detail === '' ? '' : ` - ${result.detail}`;
  console.log(`  ${LEVEL_LABELS[result.level] ?? '[??]  '} ${result.label}${suffix}`);
}

if (advice.length > 0) {
  console.log('');
  console.log('Conseils');
  for (const line of advice) {
    console.log(`  - ${line}`);
  }
}

const failures = results.filter((result) => result.level === 'fail').length;
console.log('');
console.log(
  failures === 0
    ? 'Etat : aucune anomalie bloquante.'
    : `Etat : ${failures} anomalie(s) bloquante(s).`,
);

process.exitCode = failures === 0 ? 0 : 1;
