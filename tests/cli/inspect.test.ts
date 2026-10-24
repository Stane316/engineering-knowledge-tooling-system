import { rm } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runCli } from '../../src/cli/program.js';
import { createDataDir, createTestRuntime, removeDataDir, type TestRuntime } from './helpers.js';

/** Lance une commande en réinitialisant les sorties (un seul run observé à la fois). */
const run = async (runtime: TestRuntime, ...argv: string[]): Promise<number> => {
  runtime.output.stdout = '';
  runtime.output.stderr = '';
  return runCli(argv, runtime);
};
const allOutput = (runtime: TestRuntime): string => runtime.output.stdout + runtime.output.stderr;

describe('CLI inspect', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir);
  });

  afterEach(async () => {
    removeDataDir(dataDir);
    await rm(dataDir, { recursive: true, force: true });
  });

  it('enregistre la commande avec ses options', async () => {
    expect(await run(runtime, 'inspect', '--help')).toBe(0);
    const output = allOutput(runtime);
    expect(output).toContain('inspect [options] <url>');
    expect(output).toContain('--level');
    expect(output).toContain('--output');
    expect(output).toContain('--format');
    expect(output).toContain('L3');
  });

  it("refuse un niveau sans entrées d'analyse (L2 → L3 requis) sans aucun réseau", async () => {
    const started = Date.now();
    const code = await run(runtime, 'inspect', 'https://example.com', '--level', 'L2');
    const elapsed = Date.now() - started;

    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/L3/);
    expect(elapsed).toBeLessThan(500);
  });

  it('refuse un niveau inconnu', async () => {
    const code = await run(runtime, 'inspect', 'https://example.com', '--level', 'L4');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/niveau invalide/);
  });

  it('refuse un format inconnu', async () => {
    const code = await run(runtime, 'inspect', 'https://example.com', '--format', 'docx');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/format invalide/);
  });

  it("délègue l'URL manquante à Commander (usage affiché)", async () => {
    const code = await run(runtime, 'inspect');
    expect(code).not.toBe(0);
    expect(allOutput(runtime)).toMatch(/url/i);
  });
});
