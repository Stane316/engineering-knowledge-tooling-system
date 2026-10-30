import type { Command } from 'commander';

import { createPalette, type Palette } from './output.js';
import type { CliRuntime } from './runtime.js';

/** Résultat d'une commande : une forme machine et une forme humaine. */
export interface CommandResult {
  /** Texte affiché par défaut (jamais vide). */
  readonly human: string;
  /** Objet sérialisé par `--json`. */
  readonly json: unknown;
  /**
   * Code de sortie à appliquer **après** écriture du résultat (défaut `0`).
   *
   * Sert aux issues partielles : la commande a produit des artefacts réels
   * mais tous les formats demandés n'ont pas abouti (Sprint 20-02, C-W11).
   * Un résultat partiel ne doit ni se taire, ni prétendre que rien n'a été
   * créé, ni prétendre que tout a réussi.
   */
  readonly exitCode?: number;
}

/**
 * Sortie silencieuse : le code de sortie est décidé sans réécrire de message.
 *
 * Levée par `execute` quand un résultat déjà écrit porte un code non nul.
 */
export class SilentExit extends Error {
  constructor(readonly code: number) {
    super(`sortie ${String(code)}`);
    this.name = 'SilentExit';
  }
}

/** Options de sortie résolues pour la commande courante. */
export interface OutputFlags {
  readonly json: boolean;
  readonly colors: boolean;
}

/**
 * Erreur levée par une action déjà formatée par le runtime.
 *
 * Elle conserve l'erreur d'origine et les options de sortie, ce qui permet à
 * `runCli` de choisir entre un message humain et une enveloppe JSON *et* de
 * calculer le code de sortie sans perdre la cause.
 */
export class CommandFailure extends Error {
  constructor(
    readonly original: unknown,
    readonly json: boolean,
    readonly colors: boolean,
  ) {
    super(original instanceof Error ? original.message : String(original));
    this.name = 'CommandFailure';
  }
}

/**
 * Ajoute les options de sortie à une sous-commande.
 *
 * Elles sont déclarées sur la commande racine **et** sur chaque sous-commande :
 * `ekts --json list` et `ekts list --json` sont équivalents.
 */
export function withOutputFlags(command: Command): Command {
  return command
    .option('--json', 'sortie JSON (scripts, jq)')
    .option('--no-colors', 'désactive les couleurs');
}

/**
 * Résout `json` et `colors` au plus près de la commande, puis chez les parents.
 *
 * Une valeur explicitement passée en ligne de commande sur la sous-commande
 * l'emporte sur celle de la racine ; à défaut, les valeurs par défaut sont
 * `false` (JSON) et `true` (couleurs).
 */
export function resolveOutputFlags(command: Command): OutputFlags {
  const chain: Command[] = [];

  for (let current: Command | null = command; current !== null; current = current.parent) {
    chain.push(current);
  }

  return {
    json: resolveBoolean(chain, 'json') ?? false,
    colors: resolveBoolean(chain, 'colors') ?? true,
  };
}

function resolveBoolean(chain: readonly Command[], key: string): boolean | undefined {
  for (const command of chain) {
    if (command.getOptionValueSource(key) !== 'cli') {
      continue;
    }

    return command.opts()[key] as boolean | undefined;
  }

  return undefined;
}

/**
 * Exécute une action de commande et écrit son résultat.
 *
 * Toute erreur est enveloppée dans {@link CommandFailure} : `runCli` reste le
 * seul endroit qui décide du format d'erreur et du code de sortie.
 *
 * @param command - Commande courante (options héritées incluses).
 * @param runtime - Sorties et environnement.
 * @param handler - Calcul du résultat, recevant la palette applicable.
 */
export async function execute(
  command: Command,
  runtime: CliRuntime,
  handler: (palette: Palette) => Promise<CommandResult>,
): Promise<void> {
  const flags = resolveOutputFlags(command);
  const palette = createPalette(flags.colors && runtime.color);

  try {
    const result = await handler(palette);

    if (flags.json) {
      runtime.io.write(`${JSON.stringify(result.json, null, 2)}\n`);
    } else {
      runtime.io.write(`${result.human}\n`);
    }

    if (result.exitCode !== undefined && result.exitCode !== 0) {
      throw new SilentExit(result.exitCode);
    }
  } catch (error) {
    if (error instanceof SilentExit) {
      throw error;
    }

    throw new CommandFailure(error, flags.json, flags.colors);
  }
}
