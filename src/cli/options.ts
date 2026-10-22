import { InvalidArgumentError } from 'commander';

/**
 * Convertit une option texte en liste de tags.
 *
 * Les espaces autour de chaque valeur sont retirés et les entrées vides
 * ignorées : `--tags " sqlite, ,fts "` donne `['sqlite', 'fts']`.
 */
export function parseTags(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }

  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Convertit `--limit` en entier.
 *
 * @throws {InvalidArgumentError} Valeur non entière ou hors de `[1, 1000]`.
 *   Commander la transforme en erreur d'usage (code de sortie 2).
 */
export function parseLimit(raw: string): number {
  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1 || value > 1000) {
    throw new InvalidArgumentError('entier entre 1 et 1000 attendu');
  }

  return value;
}

/**
 * Convertit `--offset` en entier positif ou nul.
 *
 * @throws {InvalidArgumentError} Valeur non entière ou négative.
 */
export function parseOffset(raw: string): number {
  const value = Number(raw);

  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidArgumentError('entier positif ou nul attendu');
  }

  return value;
}
