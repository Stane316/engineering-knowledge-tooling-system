import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { EmbeddingsService } from '../../src/business/embeddings.js';
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
  color?: boolean;
  confirm?: (question: string) => Promise<boolean>;
  now?: () => number;
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

/** Supprime un répertoire de données (idempotent). */
export function removeDataDir(dataDir: string): void {
  rmSync(dataDir, { recursive: true, force: true });
}

/**
 * Runtime de test : sorties capturées, couleurs désactivées par défaut et
 * service d'embeddings injectable.
 */
export function createTestRuntime(dataDir: string, options: TestRuntimeOptions = {}): TestRuntime {
  const output: CapturedOutput = { stdout: '', stderr: '' };

  const runtime = createRuntime({
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
    openServices:
      options.openServices ??
      ((servicesOptions) =>
        openCliServices({
          ...servicesOptions,
          ...(options.embeddings === undefined ? {} : { embeddings: options.embeddings }),
        })),
  });

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
