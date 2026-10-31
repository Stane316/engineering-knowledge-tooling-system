#!/usr/bin/env node
/**
 * Mesure de latence MCP — protocole C-O07 (sprint 22-03).
 *
 * Ce script rend la mesure **reproductible hors de la suite de tests** :
 *
 * - 20 appels d'échauffement, puis 100 appels répartis sur les huit requêtes
 *   figées du document 22 §3.1 ;
 * - mesure **monotone** de l'envoi de `tools/call` à la réception complète de
 *   la réponse, sans temps de modèle ;
 * - p95 = 95ᵉ valeur des 100 durées triées ; seuil 500 ms ;
 * - configuration consignée : OS, version du noyau, processeur, mémoire,
 *   charge, version de Node, version du paquet.
 *
 * Pourquoi un script séparé : le critère exige une mesure sur la
 * **configuration de validation**. La suite de tests tourne là où la CI
 * tourne ; ce script permet de mesurer sur un poste donné, y compris Windows,
 * sans installer Playwright ni aucun navigateur.
 *
 * Usage :
 *   node scripts/latency-report.mjs
 *   node scripts/latency-report.mjs --calls 200 --warmup 20
 *   node scripts/latency-report.mjs --json > mesure.json
 *
 * Prérequis : `npm run build` (le serveur compilé est utilisé), et une base
 * contenant le corpus. Sans base fournie, le script en crée une temporaire et
 * y indexe les six ressources synthétiques du manifeste.
 */

import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir, cpus, loadavg, platform, release, arch, totalmem, hostname } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout, clearTimeout } from 'node:timers';

const ROOT = process.cwd();
const SERVER = join(ROOT, 'dist', 'mcp', 'server.js');
const CLI = join(ROOT, 'dist', 'cli', 'index.js');
const CORPUS_DIR = join(ROOT, 'docs', 'audit', 'produit', 'scenario-comparatif');
const MANIFEST = join(CORPUS_DIR, 'manifeste-corpus.json');

/** Huit requêtes figées — recopiées du document 22 §3.1, sans révision. */
const QUERIES = [
  'blog',
  '520',
  'modification interface',
  'exceptions',
  'affectés',
  'nom accessible',
  'INP',
  'licornequartz',
];

function parseArgs(argv) {
  const options = { calls: 100, warmup: 20, json: false, keep: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--json') options.json = true;
    else if (argument === '--keep') options.keep = true;
    else if (argument === '--calls') options.calls = Number(argv[++index]);
    else if (argument === '--warmup') options.warmup = Number(argv[++index]);
  }

  return options;
}

/** Échoue clairement plutôt que de mesurer le mauvais binaire. */
function requireBuild() {
  if (!existsSync(SERVER) || !existsSync(CLI)) {
    console.error('Build absent : exécutez « npm run build » avant la mesure.');
    process.exit(2);
  }
}

/** Passe le manifeste en revue et prépare une base jetable si nécessaire. */
function seedCorpus(dataDir) {
  const run = (args) =>
    spawnSync(process.execPath, [CLI, ...args], {
      cwd: ROOT,
      env: { ...process.env, EKTS_DATA_DIR: dataDir, EKTS_OFFLINE: '1' },
      encoding: 'utf8',
    });

  const init = run(['init']);
  if (init.status !== 0) {
    throw new Error(`init a échoué : ${init.stderr || init.stdout}`);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

  for (const entry of manifest.resources) {
    if (!manifest.base_ids.includes(entry.id)) continue;

    const content = readFileSync(join(CORPUS_DIR, entry.path), 'utf8');
    const first = content.split('\n').find((line) => line.startsWith('# '));
    const title = (first ?? '# Corpus').replace(/^# /, '').trim();

    const provenance = {
      source: `depot://corpus-synthetique/${entry.path}`,
      sourceVersion: 'manifeste-1.0',
      rights: { read: 'granted', redistribute: 'refused', execute: 'unknown' },
      sensitivity: 'synthetic',
      fingerprint: { sha256: entry.sha256 },
      review: { status: 'authorized', decidedAt: '2026-10-29T10:00:00.000Z', decidedBy: 'mesure' },
    };

    const provenanceFile = join(dataDir, `prov-${entry.id}.json`);
    // Le fichier de provenance est écrit à côté de la base, pas dans le dépôt.
    spawnSync(
      process.execPath,
      [
        '-e',
        `require('fs').writeFileSync(process.argv[1], process.argv[2])`,
        provenanceFile,
        JSON.stringify(provenance),
      ],
      { cwd: ROOT },
    );

    const added = run([
      'add',
      '--type',
      'other',
      '--title',
      title,
      '--content',
      content,
      '--tags',
      `corpus,${entry.id.toLowerCase()}`,
      '--provenance',
      provenanceFile,
    ]);

    if (added.status !== 0) {
      throw new Error(`ajout de ${entry.id} refusé : ${added.stderr || added.stdout}`);
    }
  }
}

/** Client JSON-RPC minimal, sans dépendance. */
function createClient(env) {
  const child = spawn(process.execPath, [SERVER], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';
  let nextId = 1;
  const pending = new Map();

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      if (message.id !== undefined) {
        pending.get(message.id)?.(message);
        pending.delete(message.id);
      }
    }
  });

  // Les traces sont consommées pour ne pas bloquer le processus.
  child.stderr.resume();

  const request = (method, params) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => reject(new Error(`pas de réponse à ${method}`)), 20_000);
      timer.unref();
      pending.set(id, (message) => {
        clearTimeout(timer);
        resolve(message);
      });
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });

  return { child, request };
}

/** 95ᵉ valeur des durées triées (index 94 sur 100). */
function p95(sorted) {
  return sorted[Math.max(0, Math.ceil(0.95 * sorted.length) - 1)] ?? 0;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  requireBuild();

  const ownedDataDir = !process.env.EKTS_DATA_DIR;
  const dataDir = process.env.EKTS_DATA_DIR ?? mkdtempSync(join(tmpdir(), 'ekts-latency-'));
  const notes = [];

  try {
    if (ownedDataDir) {
      seedCorpus(dataDir);
      notes.push('corpus synthétique indexé dans une base temporaire jetable');
    } else {
      notes.push(`base fournie par EKTS_DATA_DIR (${dataDir})`);
    }

    const { child, request } = createClient({ EKTS_DATA_DIR: dataDir, EKTS_OFFLINE: '1' });

    try {
      await request('initialize', {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'ekts-latency-report', version: '1.0.0' },
      });
      child.stdin.write(
        `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
      );

      const call = async (query) => {
        const response = await request('tools/call', {
          name: 'search_knowledge',
          arguments: { query, mode: 'fts', limit: 5 },
        });
        const result = response.result;
        if (result?.isError === true) {
          throw new Error(`appel en erreur pour « ${query} »`);
        }
        return result;
      };

      for (let index = 0; index < options.warmup; index += 1) {
        await call(QUERIES[index % QUERIES.length]);
      }

      const durations = [];
      const errors = [];

      for (let index = 0; index < options.calls; index += 1) {
        const query = QUERIES[index % QUERIES.length];
        const started = performance.now();
        try {
          await call(query);
        } catch (error) {
          errors.push(`${query} : ${error.message}`);
        }
        durations.push(performance.now() - started);
      }

      const sorted = [...durations].sort((left, right) => left - right);
      const measured = p95(sorted);

      const report = {
        critere: 'C-O07',
        execId: randomUUID(),
        horodatage: new Date().toISOString(),
        configuration: {
          hote: hostname(),
          os: `${platform()} ${release()} ${arch()}`,
          cpu: `${cpus()[0]?.model ?? 'inconnu'} × ${String(cpus().length)}`,
          memoireGo: Math.round(totalmem() / 1024 ** 3),
          charge1min: Number((loadavg()[0] ?? 0).toFixed(2)),
          node: process.version,
          package: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version,
          sha: spawnSync('git', ['rev-parse', 'HEAD'], {
            cwd: ROOT,
            encoding: 'utf8',
          }).stdout.trim(),
        },
        protocole: {
          echauffements: options.warmup,
          appels: options.calls,
          requetes: QUERIES,
          mode: 'fts',
          limite: 5,
        },
        resultats: {
          p50: Number(sorted[Math.floor(sorted.length / 2)].toFixed(2)),
          p95: Number(measured.toFixed(2)),
          max: Number(sorted.at(-1).toFixed(2)),
          min: Number(sorted[0].toFixed(2)),
          echecs: errors.length,
          detailEchecs: errors,
        },
        seuilMs: 500,
        conforme: errors.length === 0 && measured <= 500,
        notes,
      };

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`C-O07 — latence MCP (${report.configuration.os})`);
        console.log(
          `  machine   ${report.configuration.cpu}, ${report.configuration.memoireGo} Go`,
        );
        console.log(
          `  node      ${report.configuration.node} · commit ${report.configuration.sha}`,
        );
        console.log(`  protocole ${options.warmup} échauffements + ${options.calls} appels`);
        console.log(
          `  durées    min ${report.resultats.min} · p50 ${report.resultats.p50} · p95 ${report.resultats.p95} · max ${report.resultats.max} ms`,
        );
        console.log(`  échecs    ${report.resultats.echecs}`);
        console.log(
          `  verdict   ${report.conforme ? 'CONFORME' : 'NON CONFORME'} (seuil 500 ms sur p95)`,
        );
      }

      process.exitCode = report.conforme ? 0 : 1;
    } finally {
      child.stdin.end();
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          resolve();
        }, 10_000);
        timer.unref();
        child.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  } finally {
    if (ownedDataDir && !options.keep) {
      rmSync(dataDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(`Mesure interrompue : ${error.message}`);
  process.exitCode = 1;
});
