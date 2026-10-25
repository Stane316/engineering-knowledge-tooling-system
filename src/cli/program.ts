import { Command, CommanderError } from 'commander';

import {
  EktsError,
  ProjectNotFoundError,
  ResourceNotFoundError,
  ValidationError,
} from '../shared/errors.js';
import { VERSION } from '../shared/version.js';
import { CommandFailure } from './command.js';
import { registerAdd } from './commands/add.js';
import { registerDelete } from './commands/delete.js';
import { registerGet } from './commands/get.js';
import { registerAudit } from './commands/audit.js';
import { registerInit } from './commands/init.js';
import { registerList } from './commands/list.js';
import { registerProjectCommands } from './commands/project.js';
import { registerReindex } from './commands/reindex.js';
import { registerSearch } from './commands/search.js';
import { registerInspect } from './commands/inspect.js';
import { registerStatus } from './commands/status.js';
import { registerBestPracticeCommands } from './commands/best-practice.js';
import { registerTimelineCommands } from './commands/timeline.js';
import { createPalette } from './output.js';
import { createRuntime, type CliRuntime } from './runtime.js';

/**
 * Assemble la CLI. Les commandes sont enregistrées dans l'ordre du plan
 * (Sprint 5-1 : `init`, `add`, `get` ; 5-2 : `search`, `list`, `delete` ;
 * 5-3 : `status`).
 *
 * `exitOverride()` est appelé **avant** l'enregistrement des sous-commandes :
 * Commander propage le rappel à leur création, ce qui évite tout `process.exit`
 * et rend les codes de sortie observables depuis les tests.
 */
export function createProgram(runtime: CliRuntime): Command {
  const program = new Command();

  program
    .name('ekts')
    .description('Engineering Knowledge Tooling System — gestion des ressources de connaissance')
    .version(VERSION, '-v, --version', 'affiche la version')
    .option('--json', 'sortie JSON (scripts, jq)')
    .option('--no-colors', 'désactive les couleurs')
    .showHelpAfterError('(ajoutez --help pour plus d’informations)')
    .showSuggestionAfterError()
    .exitOverride();

  program.configureOutput({
    writeOut: (text) => {
      runtime.io.write(text);
    },
    writeErr: (text) => {
      runtime.io.writeError(text);
    },
  });

  program.action(() => {
    program.help();
  });

  registerInit(program, runtime);
  registerAdd(program, runtime);
  registerGet(program, runtime);
  registerSearch(program, runtime);
  registerList(program, runtime);
  registerDelete(program, runtime);
  registerStatus(program, runtime);
  registerReindex(program, runtime);
  registerInspect(program, runtime);
  registerAudit(program, runtime);
  registerProjectCommands(program, runtime);
  registerBestPracticeCommands(program, runtime);
  registerTimelineCommands(program, runtime);

  return program;
}

/**
 * Code de sortie associé à une erreur.
 *
 * | Code | Cause                                   |
 * |------|-----------------------------------------|
 * | 0    | succès, `--help`, `--version`           |
 * | 1    | erreur d'exécution (base, réseau, I/O)  |
 * | 2    | arguments ou options invalides          |
 * | 3    | ressource introuvable                   |
 * | 4    | données refusées par la validation      |
 */
export function exitCodeFor(error: unknown): number {
  if (error instanceof ResourceNotFoundError || error instanceof ProjectNotFoundError) {
    return 3;
  }

  if (error instanceof ValidationError) {
    return 4;
  }

  if (error instanceof CommanderError) {
    return error.exitCode === 0 ? 0 : 2;
  }

  return 1;
}

/** Représentation JSON stable d'une erreur (stderr en mode `--json`). */
function errorPayload(error: unknown): { error: { code: string; message: string } } {
  if (error instanceof EktsError) {
    return { error: { code: error.code, message: error.message } };
  }

  return { error: { code: 'CLI_ERROR', message: messageOf(error) } };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Exécute une ligne de commande complète.
 *
 * @param argv - Arguments **sans** `node` ni le nom du script.
 * @returns Code de sortie (jamais de `process.exit`).
 */
export async function runCli(
  argv: readonly string[],
  runtime: CliRuntime = createRuntime(),
): Promise<number> {
  const program = createProgram(runtime);

  try {
    await program.parseAsync([...argv], { from: 'user' });

    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      // Commander a déjà écrit l'aide, la version ou le message d'usage.
      return exitCodeFor(error);
    }

    const failure = error instanceof CommandFailure ? error : undefined;
    const original = failure?.original ?? error;
    const palette = createPalette(runtime.color && (failure?.colors ?? true));

    if (failure?.json === true) {
      runtime.io.writeError(`${JSON.stringify(errorPayload(original), null, 2)}\n`);
    } else {
      runtime.io.writeError(`${palette.error('Erreur')} : ${messageOf(original)}\n`);
    }

    return exitCodeFor(original);
  }
}
