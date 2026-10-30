import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { HostResolver } from '../../src/browser/url-policy.js';
import { EmbeddingsService } from '../../src/business/embeddings.js';
import type { EmbeddingSpace } from '../../src/business/vector-indexer.js';
import type { IEmbeddingsService } from '../../src/business/embeddings.js';
import {
  openCliServices,
  type CliServices,
  type OpenServicesOptions,
} from '../../src/cli/services.js';
import { createRuntime, type CliRuntime } from '../../src/cli/runtime.js';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';

/** Sorties capturées d'une exécution en mémoire. */
export interface CapturedOutput {
  stdout: string;
  stderr: string;
}

export interface TestRuntime extends CliRuntime {
  readonly output: CapturedOutput;
}

export interface TestRuntimeOptions {
  embeddings?: IEmbeddingsService;
  embeddingSpace?: EmbeddingSpace;
  /**
   * Environnement vu par les commandes. Défaut : `{}` — **hermétique**.
   *
   * Un test ne doit jamais dépendre du `.env` du poste : sans clé, `auto`
   * retombe sur le plein texte et `required` échoue, quel que soit le contenu
   * du répertoire courant. Passer un objet explicite pour simuler des clés.
   */
  env?: NodeJS.ProcessEnv;
  color?: boolean;
  confirm?: (question: string) => Promise<boolean>;
  now?: () => number;
  /**
   * Résolveur DNS des cibles (Sprint 20-03). Défaut : une adresse publique
   * fixe — aucune commande de test n'atteint le DNS système.
   */
  resolveHost?: HostResolver;
  openServices?: (options: OpenServicesOptions) => CliServices;
}

/** Crée un service d'embeddings déterministe (aucun réseau). */
export function fakeEmbeddings(): EmbeddingsService {
  return new EmbeddingsService({ provider: new FakeEmbeddingProvider() });
}

/** Crée un répertoire de données jetable. */
export function createDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'ekts-cli-'));
}

/**
 * Supprime un répertoire de données (idempotent).
 *
 * Sous Windows, SQLite peut conserver brièvement un verrou sur un fichier :
 * `EBUSY` au `unlink`. Quelques tentatives suffisent ; au-delà, l'échec est
 * volontairement ignoré — un répertoire temporaire résiduel ne fait pas
 * échouer un test, contrairement à une connexion oubliée.
 */
export function removeDataDir(dataDir: string): void {
  const attempts = 5;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      rmSync(dataDir, { recursive: true, force: true });
      return;
    } catch {
      if (attempt === attempts) {
        return;
      }
    }
  }
}

/**
 * Runtime de test : sorties capturées, couleurs désactivées par défaut et
 * service d'embeddings injectable.
 */
export function createTestRuntime(dataDir: string, options: TestRuntimeOptions = {}): TestRuntime {
  const output: CapturedOutput = { stdout: '', stderr: '' };
  const env = options.env ?? {};

  const runtime = createRuntime(
    {
      io: {
        write: (text) => {
          output.stdout += text;
        },
        writeError: (text) => {
          output.stderr += text;
        },
      },
      dataDir,
      color: options.color ?? false,
      ...(options.confirm === undefined ? {} : { confirm: options.confirm }),
      ...(options.now === undefined ? {} : { now: options.now }),
      resolveHost: options.resolveHost ?? (async () => [{ address: '93.184.216.34', family: 4 }]),
      openServices:
        options.openServices ??
        ((servicesOptions) =>
          openCliServices({
            ...servicesOptions,
            env,
            ...(options.embeddings === undefined ? {} : { embeddings: options.embeddings }),
            ...(options.embeddingSpace === undefined
              ? {}
              : { embeddingSpace: options.embeddingSpace }),
          })),
    },
    env,
  );

  return Object.assign(runtime, { output });
}

/** Extrait la première ressource d'une sortie JSON `list`. */
export function firstResourceId(runtime: TestRuntime): string {
  const parsed = JSON.parse(runtime.output.stdout) as { resources: { id: string }[] };
  const first = parsed.resources[0];

  if (first === undefined) {
    throw new Error('aucune ressource dans la sortie');
  }

  return first.id;
}
