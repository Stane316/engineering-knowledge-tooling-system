import { Chalk } from 'chalk';

/**
 * Rendu de la sortie humaine de la CLI.
 *
 * Deux règles :
 * - **Aucune couleur** n'est produite si la sortie n'est pas un terminal (ou si
 *   `--no-colors` est passé) : les tests et les scripts obtiennent donc un
 *   texte stable, sans séquences ANSI.
 * - **Aucun caractère de dessin Unicode** pour les tableaux : les consoles
 *   Windows en page de codes CP437/CP850 les affichent en mojibake. Les bordures
 *   restent en ASCII (`+`, `-`, `|`).
 */

/** Palette de styles, désactivable sans changer le code appelant. */
export interface Palette {
  readonly enabled: boolean;
  bold(text: string): string;
  dim(text: string): string;
  success(text: string): string;
  error(text: string): string;
  warning(text: string): string;
  accent(text: string): string;
}

/**
 * Construit une palette.
 *
 * @param enabled - `false` renvoie l'identité pour chaque style.
 */
export function createPalette(enabled: boolean): Palette {
  const chalk = new Chalk({ level: enabled ? 1 : 0 });

  return {
    enabled,
    bold: (text) => chalk.bold(text),
    dim: (text) => chalk.gray(text),
    success: (text) => chalk.green(text),
    error: (text) => chalk.red(text),
    warning: (text) => chalk.yellow(text),
    accent: (text) => chalk.cyan(text),
  };
}

/** Alignement horizontal d'une colonne. */
export type ColumnAlignment = 'left' | 'right';

export interface TableColumn {
  readonly header: string;
  readonly align?: ColumnAlignment;
}

export interface TableData {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly (readonly string[])[];
}

function pad(cell: string, width: number, align: ColumnAlignment): string {
  const padding = Math.max(0, width - cell.length);
  return align === 'right' ? ' '.repeat(padding) + cell : cell + ' '.repeat(padding);
}

function separator(widths: readonly number[]): string {
  return `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`;
}

/**
 * Rend un tableau ASCII à largeur fixe.
 *
 * @returns Chaîne vide si `rows` est vide : l'appelant décide du message
 * « aucun résultat » (le tableau n'aurait aucune ligne de données).
 */
export function renderTable(data: TableData): string {
  if (data.rows.length === 0) {
    return '';
  }

  const widths = data.columns.map((column, index) =>
    Math.max(column.header.length, ...data.rows.map((row) => (row[index] ?? '').length)),
  );

  const alignments = data.columns.map((column) => column.align ?? 'left');

  // Le rendu suit toujours le nombre de colonnes : une ligne trop courte est
  // complétée par des cellules vides, une ligne trop longue est tronquée.
  const line = (cells: readonly string[]): string =>
    `| ${data.columns
      .map((_, index) =>
        pad(cells[index] ?? '', widths[index] as number, alignments[index] as ColumnAlignment),
      )
      .join(' | ')} |`;

  return [
    separator(widths),
    line(data.columns.map((column) => column.header)),
    separator(widths),
    ...data.rows.map((row) => line(row)),
    separator(widths),
  ].join('\n');
}

/**
 * Tronque un texte à `max` caractères, suffixé par `...`.
 *
 * Le résultat ne dépasse jamais `max` : `truncate('abcdef', 4)` renvoie
 * `a...`. Sous 3 caractères, seule l'ellipse (partielle) est renvoyée.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  if (max <= 3) {
    return '.'.repeat(Math.max(0, max));
  }

  return `${text.slice(0, max - 3)}...`;
}

/** Formate une taille en octets de façon lisible (unités ASCII). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Accord simple d'un nom commun au pluriel (0 et 1 au singulier). */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${String(count)} ${count > 1 ? pluralForm : singular}`;
}
