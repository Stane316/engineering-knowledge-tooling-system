import { resolve } from 'node:path';
import { PassThrough } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  confirmWithReadline,
  createRuntime,
  isColorSupported,
  type ConfirmStreams,
} from '../../src/cli/runtime.js';
import { createDataDir, removeDataDir } from './helpers.js';

/** Flux d'entrée factice marqué comme terminal. */
function ttyInput(): PassThrough & { isTTY: boolean } {
  const stream = new PassThrough() as PassThrough & { isTTY: boolean };
  stream.isTTY = true;

  return stream;
}

/** Force l'absence de terminal sur stdin/stdout (état des tests et de la CI). */
function withoutTty(): () => void {
  const originals = [process.stdin, process.stdout].map((stream) =>
    Object.getOwnPropertyDescriptor(stream, 'isTTY'),
  );

  for (const stream of [process.stdin, process.stdout]) {
    Object.defineProperty(stream, 'isTTY', { value: false, configurable: true });
  }

  return () => {
    [process.stdin, process.stdout].forEach((stream, index) => {
      const descriptor = originals[index];

      if (descriptor === undefined) {
        Reflect.deleteProperty(stream, 'isTTY');
      } else {
        Object.defineProperty(stream, 'isTTY', descriptor);
      }
    });
  };
}

describe('isColorSupported', () => {
  it('exige un terminal', () => {
    expect(isColorSupported(true, {})).toBe(true);
    expect(isColorSupported(false, {})).toBe(false);
  });

  it('respecte NO_COLOR et TERM=dumb', () => {
    expect(isColorSupported(true, { NO_COLOR: '1' })).toBe(false);
    expect(isColorSupported(true, { TERM: 'dumb' })).toBe(false);
  });
});

describe('confirmWithReadline', () => {
  it('refuse sans terminal interactif', async () => {
    const streams = {
      input: { isTTY: false } as unknown as ConfirmStreams['input'],
      output: new PassThrough(),
    };

    await expect(confirmWithReadline('Supprimer ?', streams)).resolves.toBe(false);
  });

  it.each([
    ['y', true],
    ['Y', true],
    ['yes', true],
    [' YES ', true],
    ['n', false],
    ['', false],
  ])('interprète la réponse %j comme %s', async (answer, expected) => {
    const input = ttyInput();
    const output = new PassThrough();
    const pending = confirmWithReadline('Supprimer ?', { input, output });

    input.write(`${answer}\n`);

    await expect(pending).resolves.toBe(expected);
  });
});

describe('createRuntime', () => {
  let dataDir: string;
  let restoreTty: () => void;

  beforeEach(() => {
    dataDir = createDataDir();
    restoreTty = withoutTty();
  });

  afterEach(() => {
    restoreTty();
    removeDataDir(dataDir);
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('fournit des valeurs par défaut exploitables', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const runtime = createRuntime({ dataDir }, { EKTS_DATA_DIR: '/tmp/ignore' });

    runtime.io.write('sortie');
    runtime.io.writeError('erreur');

    expect(stdout).toHaveBeenCalledWith('sortie');
    expect(stderr).toHaveBeenCalledWith('erreur');
    expect(runtime.dataDir).toBe(dataDir);
    expect(runtime.color).toBe(false);
    expect(typeof runtime.now()).toBe('number');
    await expect(runtime.confirm('Continuer ?')).resolves.toBe(false);

    const services = runtime.openServices({ dataDir, embeddingsMode: 'disabled' });

    services.close();
  });

  it('applique les remplacements fournis', async () => {
    const writes: string[] = [];
    const runtime = createRuntime({
      io: {
        write: (text) => writes.push(text),
        writeError: (text) => writes.push(`err:${text}`),
      },
      dataDir,
      color: true,
      now: () => 42,
      confirm: () => Promise.resolve(true),
      openServices: () => {
        throw new Error('non utilisé dans ce test');
      },
    });

    runtime.io.write('a');
    runtime.io.writeError('b');

    expect(writes).toEqual(['a', 'err:b']);
    expect(runtime.color).toBe(true);
    expect(runtime.now()).toBe(42);
    await expect(runtime.confirm('?')).resolves.toBe(true);
  });

  it('déduit le répertoire de données de l’environnement', () => {
    const runtime = createRuntime({}, { EKTS_DATA_DIR: dataDir });

    expect(runtime.dataDir).toBe(resolve(dataDir));
  });
});
