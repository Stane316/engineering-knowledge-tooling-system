#!/usr/bin/env node
/**
 * Diagnostic des moteurs Playwright installés sur le poste.
 *
 * `npm run check:env` vérifie l'environnement Node/SQLite ; ce script-ci répond
 * à une autre question : **pourquoi un moteur ne s'ouvre-t-il pas ?**
 *
 * Il distingue quatre causes que Playwright confond dans un seul message
 * (« Target crashed », « Executable doesn't exist ») :
 *
 * 1. binaire absent ou incomplet → `npx playwright install --force <moteur>` ;
 * 2. binaire cassé au chargement (runtime C++ manquant) → installation du
 *    redistribuable Microsoft Visual C++ ;
 * 3. processus de contenu tué par un antivirus ou par une stratégie Windows →
 *    exclusion à ajouter ;
 * 4. bac à sable incompatible avec le poste → préférence Firefox
 *    `security.sandbox.content.level = 0`, rejouée ici automatiquement.
 *
 * Usage : `npm run doctor:browsers` (code de sortie 1 si un moteur échoue).
 * Rapport JSON : `artifacts/browser-doctor.json` (ignoré par Git).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ENGINES = ['chromium', 'firefox', 'webkit'];
const LAUNCH_TIMEOUT_MS = 20_000;

const results = [];
const notes = [];

function line(ok, label, detail = '') {
  console.log(
    `${ok === null ? '··· ' : ok ? 'OK  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`,
  );
}

function firstLine(error) {
  const message = error instanceof Error ? error.message : String(error);

  return (message.split('\n')[0] ?? '').trim();
}

/** Ouvre réellement une page : c'est l'opération qui casse quand un moteur plante. */
async function openPage(type) {
  const started = Date.now();
  const browser = await type.launch({ headless: true, timeout: LAUNCH_TIMEOUT_MS });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.close();
    await context.close();

    return Date.now() - started;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

/** Rejoue le lancement avec des préférences Firefox qui désactivent le bac à sable. */
async function retryFirefoxWithoutSandbox(type) {
  const browser = await type.launch({
    headless: true,
    timeout: LAUNCH_TIMEOUT_MS,
    firefoxUserPrefs: { 'security.sandbox.content.level': 0 },
    env: { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: '1' },
  });

  try {
    const page = await browser.newPage();

    await page.close();
  } finally {
    await browser.close().catch(() => undefined);
  }
}

/** Exécute le binaire lui-même, hors Playwright, pour isoler la cause. */
function probeBinary(executable) {
  const version = spawnSync(executable, ['--version'], { encoding: 'utf8', timeout: 20_000 });
  const stdout = (version.stdout ?? '').trim().split('\n')[0] ?? '';
  const stderr = (version.stderr ?? '').trim().split('\n')[0] ?? '';

  return {
    executable,
    exists: existsSync(executable),
    versionExitCode: version.status,
    versionOutput: stdout || stderr,
    versionSignal: version.signal,
  };
}

/**
 * Relance le moteur dans un processus Node séparé avec `DEBUG=pw:browser`.
 *
 * Playwright ne transmet jamais la sortie du navigateur dans l'erreur
 * « Target crashed ». En activant le journal au démarrage du processus, on
 * récupère les dernières lignes du moteur — souvent la seule indication
 * exploitable (DLL manquante, refus de l'antivirus, argument inconnu).
 */
function captureBrowserLogs(engine) {
  const script = `
    const { ${engine} } = require('playwright');
    (async () => {
      const browser = await ${engine}.launch({ headless: true, timeout: 20000 });
      const page = await browser.newPage();
      await page.close();
      await browser.close();
    })().catch((error) => { console.error(String(error)); process.exitCode = 1; });
  `;

  const run = spawnSync(process.execPath, ['-e', script], {
    cwd: root,
    env: { ...process.env, DEBUG: 'pw:browser' },
    encoding: 'utf8',
    timeout: 60_000,
  });

  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();

  return {
    exitCode: run.status,
    output: output
      .split('\n')
      .filter((row) => row !== '')
      .slice(-10)
      .join('\n'),
  };
}

/** Rend une capture avec le binaire seul : teste le processus de contenu sans Playwright. */
/**
 * Rend une capture avec le binaire seul : teste le processus de contenu sans
 * Playwright. Windows uniquement (Firefox y est le seul moteur qui plante à
 * l'ouverture de page pour des raisons de bac à sable).
 */
function probeRendering(executable) {
  const target = join(tmpdir(), `ekts-browser-doctor-${process.pid}.png`);
  const run = spawnSync(executable, ['--headless', `--screenshot=${target}`, 'about:blank'], {
    encoding: 'utf8',
    timeout: 30_000,
  });

  return {
    exitCode: run.status,
    signal: run.signal,
    wroteScreenshot: existsSync(target),
    stderr: (run.stderr ?? '').trim().split('\n').slice(-3).join(' | '),
  };
}

function checkRuntime() {
  if (process.platform !== 'win32') {
    return null;
  }

  const system32 = join(process.env['SystemRoot'] ?? 'C:\\Windows', 'System32');
  const missing = ['vcruntime140.dll', 'msvcp140.dll'].filter(
    (dll) => !existsSync(join(system32, dll)),
  );

  return { missing, system32 };
}

function checkTempPath() {
  const temporary = tmpdir();
  const folded = temporary.toLowerCase();

  return {
    path: temporary,
    nonAscii: /[^\u0020-\u007E]/.test(temporary),
    oneDrive: folded.includes('onedrive'),
    network: temporary.startsWith('\\\\'),
  };
}

function reportTempPath(temporary) {
  const problems = [];

  if (temporary.nonAscii) problems.push('caractères non ASCII');
  if (temporary.oneDrive) problems.push('dossier OneDrive');
  if (temporary.network) problems.push('chemin réseau');

  if (problems.length > 0) {
    notes.push(
      `Dossier temporaire « ${temporary.path} » (${problems.join(', ')}) : certains moteurs y créent leur profil et échouent. Définissez TEMP sur un chemin local en ASCII.`,
    );
  }
}

function explainFailure(engine, executable, binary, rendering, sandboxRetry, runtime) {
  const hints = [];

  if (binary !== null && binary.versionExitCode !== 0) {
    hints.push(
      `le binaire ne répond même pas à « --version » (code ${binary.versionExitCode}). ` +
        'Réinstallez-le : « npx playwright install --force ' +
        engine +
        ' », puis installez le redistribuable Microsoft Visual C++ 2015-2022 x64.',
    );
  }

  if (rendering !== null && !rendering.wroteScreenshot) {
    hints.push(
      'le rendu hors Playwright échoue aussi : la cause est le moteur ou le poste, pas le code du projet',
    );
  }

  if (sandboxRetry === 'ok') {
    hints.push(
      "le moteur fonctionne sans bac à sable : ajoutez « firefoxUserPrefs: { 'security.sandbox.content.level': 0 } » au lancement",
    );
  }

  if (runtime !== null && runtime.missing.length > 0) {
    hints.push(`runtime C++ absent de Windows (${runtime.missing.join(', ')})`);
  }

  hints.push(
    'excluez « ' +
      (executable ? dirname(executable) : 'le dossier des navigateurs') +
      ' » de l’antivirus et de la Protection contre les exploits (Windows)',
  );

  return hints;
}

async function checkEngine(playwright, engine) {
  const type = playwright[engine];
  const executable = type.executablePath();
  const result = { engine, executable, ok: false, reason: null, duration: null, hints: [] };

  if (!existsSync(executable)) {
    result.reason = 'binaire absent';
    result.hints = [`npx playwright install ${engine}`];
    line(false, engine, `binaire absent (chemin attendu : ${executable})`);

    return result;
  }

  try {
    result.duration = await openPage(type);
    result.ok = true;
    line(true, engine, `page ouverte en ${result.duration} ms`);
  } catch (error) {
    result.reason = firstLine(error);
    line(false, engine, result.reason);

    const binary = process.platform === 'win32' ? probeBinary(executable) : null;
    const rendering = engine === 'firefox' ? probeRendering(executable) : null;
    let sandboxRetry = null;

    if (engine === 'firefox') {
      try {
        await retryFirefoxWithoutSandbox(type);
        sandboxRetry = 'ok';
      } catch (retryError) {
        sandboxRetry = firstLine(retryError);
      }
    }

    const logs = captureBrowserLogs(engine);
    result.browserLogs = logs;

    if (logs.output !== '') {
      console.log('     journal du moteur (DEBUG=pw:browser) :');

      for (const row of logs.output.split('\n')) {
        console.log(`       ${row}`);
      }
    }

    if (binary !== null) {
      line(
        binary.versionExitCode === 0,
        `${engine} — « --version »`,
        `${binary.versionOutput || 'aucune sortie'} (code ${binary.versionExitCode})`,
      );
    }

    if (rendering !== null) {
      line(
        rendering.wroteScreenshot,
        'firefox — rendu hors Playwright',
        `code ${rendering.exitCode}${rendering.stderr ? ` · ${rendering.stderr}` : ''}`,
      );
    }

    if (engine === 'firefox') {
      line(
        sandboxRetry === 'ok',
        'firefox — sans bac à sable',
        sandboxRetry === 'ok' ? 'page ouverte' : sandboxRetry,
      );
      result.sandboxRetry = sandboxRetry;
    }

    result.hints = explainFailure(
      engine,
      executable,
      binary,
      rendering,
      sandboxRetry,
      checkRuntime(),
    );
    result.diagnostics = { binary, rendering, sandboxRetry };
  }

  return result;
}

console.log(`EKTS — diagnostic des moteurs Playwright\n`);

if (!existsSync(join(root, 'node_modules'))) {
  console.log('FAIL node_modules absent — exécutez « npm ci » avant ce diagnostic.');
  process.exitCode = 1;
  process.exit();
}

let playwright;

try {
  playwright = require('playwright');
} catch (error) {
  console.log(`FAIL Playwright introuvable — ${firstLine(error)}`);
  process.exitCode = 1;
  process.exit();
}

const playwrightVersion = require('playwright/package.json').version;
console.log(
  `Playwright ${playwrightVersion} · Node ${process.versions.node} (${process.platform}/${process.arch})`,
);
console.log(`Binaires : ${dirname(playwright.chromium.executablePath())}\n`);

for (const engine of ENGINES) {
  results.push(await checkEngine(playwright, engine));
}

const temporary = checkTempPath();
reportTempPath(temporary);

const runtime = checkRuntime();

if (runtime !== null && runtime.missing.length > 0) {
  notes.push(
    `Runtime C++ manquant dans ${runtime.system32} (${runtime.missing.join(', ')}) : installez « Microsoft Visual C++ Redistributable 2015-2022 x64 ». Firefox en dépend.`,
  );
}

const failures = results.filter((result) => !result.ok);

console.log('');

if (failures.length === 0) {
  console.log('Les trois moteurs ouvrent une page. « npm run test:e2e » peut tourner.');
} else {
  for (const failure of failures) {
    console.log(`${failure.engine} : ${failure.reason}`);
    for (const hint of failure.hints) {
      console.log(`  → ${hint}`);
    }
    console.log('');
  }

  console.log('Ordre de réparation conseillé :');
  console.log(`  1. npx playwright install --force ${failures.map((f) => f.engine).join(' ')}`);
  console.log(
    '  2. exclure le dossier des navigateurs de l’antivirus et de la Protection contre les exploits',
  );
  console.log('  3. vérifier TEMP (chemin local, ASCII, hors OneDrive)');
  console.log('  4. relancer : npm run doctor:browsers');
}

if (notes.length > 0) {
  console.log('\nPoints de vigilance :');

  for (const note of notes) {
    console.log(`  · ${note}`);
  }
}

const reportDirectory = join(root, 'artifacts');
mkdirSync(reportDirectory, { recursive: true });
writeFileSync(
  join(reportDirectory, 'browser-doctor.json'),
  `${JSON.stringify({ date: new Date().toISOString(), platform: process.platform, engines: results, notes }, null, 2)}\n`,
);

console.log(`\nRapport : artifacts/browser-doctor.json`);

if (failures.length > 0) {
  process.exitCode = 1;
}
