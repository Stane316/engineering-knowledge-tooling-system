import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CommandFailure,
  execute,
  resolveOutputFlags,
  withOutputFlags,
} from '../../src/cli/command.js';
import { createDataDir, createTestRuntime, removeDataDir } from './helpers.js';

/** Construit une commande `sub` dont les options sont déjà analysées. */
function parseCommand(argv: readonly string[]): Command {
  const program = new Command();
  program.exitOverride();
  withOutputFlags(program);
  const sub = withOutputFlags(program.command('sub'));

  program.parse([...argv], { from: 'user' });

  return sub;
}

describe('resolveOutputFlags', () => {
  it('applique les valeurs par défaut', () => {
    expect(resolveOutputFlags(parseCommand(['sub']))).toEqual({ json: false, colors: true });
  });

  it('lit les options de la sous-commande', () => {
    expect(resolveOutputFlags(parseCommand(['sub', '--json', '--no-colors']))).toEqual({
      json: true,
      colors: false,
    });
  });

  it('lit les options de la commande racine', () => {
    expect(resolveOutputFlags(parseCommand(['--json', 'sub']))).toEqual({
      json: true,
      colors: true,
    });
  });
});

describe('execute', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = createDataDir();
  });

  afterEach(() => {
    removeDataDir(dataDir);
  });

  it('écrit la forme JSON quand elle est demandée', async () => {
    const runtime = createTestRuntime(dataDir);

    await execute(parseCommand(['sub', '--json']), runtime, () =>
      Promise.resolve({ human: 'humain', json: { a: 1 } }),
    );

    expect(runtime.output.stdout).toBe('{\n  "a": 1\n}\n');
  });

  it('écrit la forme humaine par défaut', async () => {
    const runtime = createTestRuntime(dataDir);

    await execute(parseCommand(['sub']), runtime, () =>
      Promise.resolve({ human: 'humain', json: { a: 1 } }),
    );

    expect(runtime.output.stdout).toBe('humain\n');
  });

  it('enveloppe les erreurs avec les options de sortie', async () => {
    const runtime = createTestRuntime(dataDir);
    const boom = new Error('boum');
    const failure = await execute(parseCommand(['sub', '--json']), runtime, () =>
      Promise.reject(boom),
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(CommandFailure);
    expect((failure as CommandFailure).original).toBe(boom);
    expect((failure as CommandFailure).json).toBe(true);
    expect((failure as CommandFailure).colors).toBe(true);
    expect((failure as CommandFailure).message).toBe('boum');
  });

  it('accepte une erreur qui n’est pas un objet Error', () => {
    const failure = new CommandFailure('texte brut', false, false);

    expect(failure.message).toBe('texte brut');
  });
});
