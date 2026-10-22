/**
 * Benchmark du moteur de recherche (Sprint 4).
 *
 * Mesure, sur une base générée de façon déterministe :
 * - la latence de recherche (FTS, vectorielle, hybride) ;
 * - le Recall@5 (le document cible est-il dans les 5 premiers ?) ;
 * - la « faithfulness » lexicale (part des résultats qui contiennent au moins
 *   un terme de la requête) — proxy déterministe hors ligne, voir
 *   `docs/guides/SEARCH_ENGINE.md`, écart E4-9.
 *
 * Aucun appel réseau : le fournisseur d'embeddings est le `bag of words` de
 * `tests/helpers/fake-embeddings.ts`.
 *
 * Exécution :
 * ```bash
 * npm run test:benchmark                       # 100 000 documents, 10 000 vecteurs
 * npm run test:benchmark -- --vectors=100000   # index vectoriel complet
 * npm run test:benchmark -- --documents=5000   # smoke test
 * ```
 *
 * Sortie ASCII uniquement (compatibilité console Windows).
 */

import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import { Indexer } from '../../src/business/indexer.js';
import { SearchEngine } from '../../src/business/search-engine.js';
import type { SearchMode } from '../../src/business/search-engine.types.js';
import { RRF_K } from '../../src/business/rrf.js';
import type Database from 'better-sqlite3';

import { openDatabase } from '../../src/data/database.js';
import { FTSRepository } from '../../src/data/fts-repository.js';
import { ResourceRepository } from '../../src/data/repositories/resource-repository.js';
import { VectorRepository } from '../../src/data/vector-repository.js';
import type { SearchResult } from '../../src/shared/types.js';
import { FakeEmbeddingProvider, tokenize } from '../helpers/fake-embeddings.js';

// ---------------------------------------------------------------------------
// Seuils d'acceptation (critères C4.6, C4.7, C4.8)
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  recallAt5: 0.75,
  faithfulness: 0.8,
  p95LatencyMs: 500,
} as const;

// ---------------------------------------------------------------------------
// Paramètres de ligne de commande
// ---------------------------------------------------------------------------

interface Options {
  documents: number;
  vectors: number;
  queries: number;
  limit: number;
  keep: boolean;
}

function parseOptions(argv: readonly string[]): Options {
  const read = (name: string, fallback: number): number => {
    const prefix = `--${name}=`;
    const found = argv.find((argument) => argument.startsWith(prefix));

    if (found === undefined) {
      return fallback;
    }

    const value = Number(found.slice(prefix.length));

    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`--${name} doit etre un entier > 0 (recu: ${found.slice(prefix.length)})`);
    }

    return value;
  };

  return {
    documents: read('documents', 100_000),
    vectors: read('vectors', 10_000),
    queries: read('queries', 200),
    limit: read('limit', 5),
    keep: argv.includes('--keep'),
  };
}

// ---------------------------------------------------------------------------
// Génération déterministe du corpus
// ---------------------------------------------------------------------------

const TOPICS = [
  'sqlite',
  'postgres',
  'docker',
  'kubernetes',
  'typescript',
  'rust',
  'python',
  'react',
  'graphql',
  'redis',
  'kafka',
  'terraform',
  'ansible',
  'nginx',
  'linux',
  'git',
  'webpack',
  'vite',
  'vitest',
  'playwright',
  'openai',
  'embedding',
  'bm25',
  'rrf',
  'fts',
  'vector',
  'cache',
  'latency',
  'index',
  'migration',
] as const;

const QUALIFIERS = [
  'guide',
  'tutorial',
  'benchmark',
  'migration',
  'performance',
  'security',
  'deployment',
  'testing',
  'architecture',
  'debugging',
  'patterns',
  'internals',
  'configuration',
  'monitoring',
  'scaling',
  'reliability',
] as const;

/** PRNG déterministe (mulberry32) : corpus identique d'une exécution à l'autre. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

interface Document {
  type: 'article' | 'tutorial' | 'video';
  title: string;
  content: string;
  tags: string[];
}

interface Corpus {
  documents: Document[];
  /** Identifiants reels (UUID) attribues par la base, dans l'ordre du corpus. */
  ids: string[];
  queries: { text: string; targetIndex: number; terms: string[] }[];
}

function buildCorpus(
  count: number,
  queryCount: number,
  searchableCount: number,
  random: () => number,
): Corpus {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;

  const documents: Document[] = [];

  for (let index = 0; index < count; index += 1) {
    const topic = pick(TOPICS);
    const qualifier = pick(QUALIFIERS);
    // Terme numérique peu fréquent : rend chaque document identifiable sans
    // rendre la requête triviale pour autant.
    const serial = String(index).padStart(6, '0');

    // Contenu court et thematique : un vocabulaire partage modere (comme un
    // vrai corpus) plus un identifiant unique. Un contenu sature de mots
    // communs noierait le signal et rendrait le Recall@5 mesure par le
    // vocabulaire, pas par le classement.
    const content = [topic, pick(QUALIFIERS), pick(TOPICS), pick(QUALIFIERS), `note${serial}`];

    documents.push({
      type: index % 7 === 0 ? 'video' : index % 5 === 0 ? 'tutorial' : 'article',
      title: `${topic} ${qualifier} ${serial}`,
      content: content.join(' '),
      tags: [topic],
    });
  }

  // Les cibles sont tirees parmi les documents indexes vectoriellement : sans
  // cela, le mode vectoriel ne pourrait pas les retrouver et le Recall@5
  // mesurerait la couverture de l'index, pas la qualite du classement.
  const queries: Corpus['queries'] = [];
  for (let index = 0; index < queryCount; index += 1) {
    const targetIndex = Math.floor(random() * Math.min(searchableCount, documents.length));
    const target = documents[targetIndex] as Document;
    const terms = tokenize(target.title).slice(0, 3);

    queries.push({ text: terms.join(' '), targetIndex, terms });
  }

  return { documents, ids: [], queries };
}

// ---------------------------------------------------------------------------
// Chargement du corpus
// ---------------------------------------------------------------------------

interface LoadReport {
  documents: number;
  vectors: number;
  durationMs: number;
  fileSizeMb: number;
}

async function loadCorpus(
  repository: ResourceRepository,
  vectors: VectorRepository,
  embeddings: EmbeddingsService,
  corpus: Corpus,
  vectorCount: number,
  dataDir: string,
  connection: Database.Database,
): Promise<LoadReport> {
  const startedAt = performance.now();

  for (const document of corpus.documents) {
    const created = repository.create({
      type: document.type,
      title: document.title,
      content: document.content,
      tags: document.tags,
    });

    corpus.ids.push(created.id);
  }

  // Indexation vectorielle d'un préfixe : le critère C4.8 porte sur la
  // latence de recherche, pas sur le coût d'indexation (mesuré à part).
  for (let index = 0; index < Math.min(vectorCount, corpus.documents.length); index += 1) {
    const document = corpus.documents[index] as Document;
    const id = corpus.ids[index];

    if (id === undefined) {
      continue;
    }

    const text = `${document.title}\n${document.content}\n${document.tags.join(' ')}`;
    const [embedding] = await embeddings.embedBatch([text]);

    if (embedding !== undefined) {
      vectors.insertEmbedding(id, embedding);
    }
  }

  const durationMs = performance.now() - startedAt;
  const fileSizeMb =
    ['ekts.db', 'ekts-fts.db', 'ekts-vectors.db'].reduce((total, file) => {
      try {
        return total + statSync(join(dataDir, file)).size;
      } catch {
        return total;
      }
    }, 0) /
    (1024 * 1024);

  return {
    documents: new Indexer(connection).countResources(),
    vectors: vectors.count(),
    durationMs,
    fileSizeMb,
  };
}

// ---------------------------------------------------------------------------
// Mesure d'un mode de recherche
// ---------------------------------------------------------------------------

interface Metrics {
  mode: SearchMode;
  p50: number;
  p95: number;
  max: number;
  recallAt5: number;
  faithfulness: number;
  empty: number;
}

function percentile(sorted: readonly number[], ratio: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  const position = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1));
  return sorted[position] as number;
}

/** Un résultat est « fidele » s'il contient au moins un terme de la requete. */
function isFaithful(result: SearchResult, terms: readonly string[]): boolean {
  const haystack = new Set(
    tokenize(
      `${result.resource.title} ${result.resource.content ?? ''} ${result.resource.tags.join(' ')}`,
    ),
  );

  return terms.some((term) => haystack.has(term));
}

async function measure(
  engine: SearchEngine,
  corpus: Corpus,
  mode: SearchMode,
  limit: number,
): Promise<Metrics> {
  const durations: number[] = [];
  let hits = 0;
  let faithful = 0;
  let returned = 0;
  let empty = 0;

  for (const query of corpus.queries) {
    const startedAt = performance.now();
    const results = await engine.search(query.text, { mode, limit });
    durations.push(performance.now() - startedAt);

    if (results.length === 0) {
      empty += 1;
    }

    const targetId = corpus.ids[query.targetIndex];

    if (results.some((result) => result.resource.id === targetId)) {
      hits += 1;
    }

    for (const result of results) {
      returned += 1;
      if (isFaithful(result, query.terms)) {
        faithful += 1;
      }
    }
  }

  const sorted = [...durations].sort((left, right) => left - right);

  return {
    mode,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted[sorted.length - 1] ?? 0,
    recallAt5: corpus.queries.length === 0 ? 0 : hits / corpus.queries.length,
    faithfulness: returned === 0 ? 0 : faithful / returned,
    empty,
  };
}

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

function formatRow(metrics: Metrics): string {
  return [
    metrics.mode.padEnd(8),
    `${metrics.p50.toFixed(1)} ms`.padStart(10),
    `${metrics.p95.toFixed(1)} ms`.padStart(10),
    `${metrics.max.toFixed(1)} ms`.padStart(10),
    metrics.recallAt5.toFixed(3).padStart(9),
    metrics.faithfulness.toFixed(3).padStart(13),
    String(metrics.empty).padStart(6),
  ].join(' | ');
}

function report(load: LoadReport, metrics: readonly Metrics[], options: Options): boolean {
  const line = '='.repeat(84);

  console.log(line);
  console.log('EKTS - Search Engine benchmark (Sprint 4)');
  console.log(line);
  console.log(`Documents indexes      : ${load.documents}`);
  console.log(`Vecteurs indexes       : ${load.vectors}`);
  console.log(`Requetes mesurees      : ${options.queries} (limite ${options.limit})`);
  console.log(`Constante RRF          : ${RRF_K}`);
  console.log(`Chargement             : ${(load.durationMs / 1000).toFixed(1)} s`);
  console.log(`Taille des 3 bases     : ${load.fileSizeMb.toFixed(1)} MB`);
  console.log(line);
  console.log(
    ['Mode', 'p50', 'p95', 'max', 'Recall@5', 'Faithfulness', 'Vides']
      .map((header, index) => header.padEnd([8, 10, 10, 10, 9, 13, 6][index] ?? 8))
      .join(' | '),
  );
  console.log('-'.repeat(84));
  for (const item of metrics) {
    console.log(formatRow(item));
  }
  console.log(line);

  const hybrid = metrics.find((item) => item.mode === 'hybrid');
  const failures: string[] = [];

  for (const item of metrics) {
    if (item.p95 > THRESHOLDS.p95LatencyMs) {
      failures.push(`${item.mode}: p95 ${item.p95.toFixed(1)} ms > ${THRESHOLDS.p95LatencyMs} ms`);
    }
    if (item.recallAt5 < THRESHOLDS.recallAt5) {
      failures.push(
        `${item.mode}: Recall@5 ${item.recallAt5.toFixed(3)} < ${THRESHOLDS.recallAt5}`,
      );
    }
    if (item.faithfulness < THRESHOLDS.faithfulness) {
      failures.push(
        `${item.mode}: Faithfulness ${item.faithfulness.toFixed(3)} < ${THRESHOLDS.faithfulness}`,
      );
    }
  }

  if (hybrid === undefined) {
    failures.push('mode hybride non mesure');
  }

  if (failures.length === 0) {
    console.log(
      `OK - seuils respectes (p95 < ${THRESHOLDS.p95LatencyMs} ms, Recall@5 >= ${THRESHOLDS.recallAt5}, Faithfulness >= ${THRESHOLDS.faithfulness})`,
    );
    return true;
  }

  console.log('ECHEC - seuils non respectes :');
  for (const failure of failures) {
    console.log(`  - ${failure}`);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const dataDir = mkdtempSync(join(tmpdir(), 'ekts-benchmark-'));
  const random = createRandom(20_260_422);
  const corpus = buildCorpus(
    options.documents,
    options.queries,
    Math.min(options.vectors, options.documents),
    random,
  );

  const database = openDatabase({ dataDir });

  try {
    const repository = new ResourceRepository(database.connection);
    const vectors = new VectorRepository(database.connection);
    const provider = new FakeEmbeddingProvider();
    const embeddings = new EmbeddingsService({ provider });
    const engine = new SearchEngine({
      fts: new FTSRepository(database.connection),
      vectors,
      embeddings,
    });

    console.log(
      `Generation de ${options.documents} documents et ${options.vectors} vecteurs (aucun appel reseau)...`,
    );

    const load = await loadCorpus(
      repository,
      vectors,
      embeddings,
      corpus,
      options.vectors,
      dataDir,
      database.connection,
    );

    // Echauffement : sortir les pages du cache disque et stabiliser le JIT.
    for (const query of corpus.queries.slice(0, Math.min(20, corpus.queries.length))) {
      await engine.search(query.text, { mode: 'hybrid', limit: options.limit });
    }

    const metrics = [
      await measure(engine, corpus, 'fts', options.limit),
      await measure(engine, corpus, 'vector', options.limit),
      await measure(engine, corpus, 'hybrid', options.limit),
    ];

    const success = report(load, metrics, options);

    if (!success && process.argv.includes('--assert')) {
      process.exitCode = 1;
    }
  } finally {
    database.close();

    if (!options.keep) {
      rmSync(dataDir, { recursive: true, force: true });
    } else {
      console.log(`Base conservee : ${dataDir}`);
    }
  }
}

await main();
