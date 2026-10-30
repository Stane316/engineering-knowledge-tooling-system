import { createInterface } from 'node:readline/promises';

import { loadConfig } from '../shared/config.js';
import type { HostResolver } from '../browser/url-policy.js';
import { openCliServices, type CliServices, type OpenServicesOptions } from './services.js';

/**
 * Dépendances d'exécution de la CLI.
 *
 * Tout ce qui touche au processus (sorties standard, terminal, horloge,
 * confirmation interactive, ouverture des bases) passe par ce contrat : les
 * tests exécutent les commandes en mémoire, sans enfant ni base réelle, et les
 * codes de sortie sont observables.
 */

/** Sorties texte (une écriture brute, sans newline ajouté). */
export interface CliIo {
  write(text: string): void;
  writeError(text: string): void;
}

export interface CliRuntime {
  readonly io: CliIo;
  /** Répertoire des bases (`EKTS_DATA_DIR` ou `./data`). */
  readonly dataDir: string;
  /** Couleurs autorisées (TTY + `NO_COLOR`/`TERM=dumb` absents). */
  readonly color: boolean;
  /** Horloge en millisecondes (durées mesurées). */
  now(): number;
  /** Confirmation interactive ; `false` si le terminal est absent. */
  confirm(question: string): Promise<boolean>;
  /**
   * Résolveur DNS des cibles inspectées (Sprint 20-03, C-W13).
   *
   * `undefined` = DNS système, comportement de production. Les tests injectent
   * une réponse fixe : aucune inspection n'atteint le réseau.
   */
  readonly resolveHost?: HostResolver;
  openServices(options: OpenServicesOptions): CliServices;
}

export interface RuntimeOverrides {
  io?: CliIo;
  dataDir?: string;
  color?: boolean;
  now?: () => number;
  confirm?: (question: string) => Promise<boolean>;
  resolveHost?: HostResolver;
  openServices?: (options: OpenServicesOptions) => CliServices;
}

/** Flux acceptés par `confirmWithReadline` (fakes de test autorisés). */
export interface ConfirmStreams {
  input: NodeJS.ReadableStream & { isTTY?: boolean };
  output: NodeJS.WritableStream;
}

/**
 * Décide si les couleurs sont pertinentes.
 *
 * @param isTTY - La sortie standard est-elle un terminal ?
 * @param env - Environnement (variables `NO_COLOR`, `TERM`).
 */
export function isColorSupported(isTTY: boolean, env: NodeJS.ProcessEnv = process.env): boolean {
  return isTTY && env.NO_COLOR === undefined && env.TERM !== 'dumb';
}

/**
 * Demande une confirmation `y/N`.
 *
 * Sans terminal interactif, la réponse est `false` : une suppression ne doit
 * jamais être validée par l'absence de saisie (stdin fermé, script, CI).
 */
export async function confirmWithReadline(
  question: string,
  streams: ConfirmStreams = { input: process.stdin, output: process.stdout },
): Promise<boolean> {
  if (streams.input.isTTY !== true) {
    return false;
  }

  const readline = createInterface({ input: streams.input, output: streams.output });

  try {
    const answer = await readline.question(`${question} [y/N] `);

    return /^y(es)?$/i.test(answer.trim());
  } finally {
    readline.close();
  }
}

/**
 * Construit le runtime par défaut.
 *
 * @param overrides - Remplacements utilisés par les tests.
 * @param env - Environnement injecté. Omis, le runtime lit `process.env` et
 *   laisse `openCliServices` charger `.env` (production). Fourni — même vide —
 *   il est transmis aux services : plus aucun fichier du disque n'est lu, ce
 *   qui rend un test indépendant du `.env` du poste.
 */
export function createRuntime(
  overrides: RuntimeOverrides = {},
  env?: NodeJS.ProcessEnv,
): CliRuntime {
  const source = env ?? process.env;

  return {
    io: overrides.io ?? {
      write: (text) => {
        process.stdout.write(text);
      },
      writeError: (text) => {
        process.stderr.write(text);
      },
    },
    dataDir: overrides.dataDir ?? loadConfig(source).dataDir,
    color: overrides.color ?? isColorSupported(process.stdout.isTTY === true, source),
    now: overrides.now ?? Date.now,
    confirm: overrides.confirm ?? ((question) => confirmWithReadline(question)),
    ...(overrides.resolveHost === undefined ? {} : { resolveHost: overrides.resolveHost }),
    openServices:
      overrides.openServices ??
      ((options) => openCliServices(env === undefined ? options : { ...options, env })),
  };
}
