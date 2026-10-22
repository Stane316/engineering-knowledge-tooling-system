import { EMBEDDING_DIMENSIONS } from '../../src/shared/constants.js';
import type { EmbeddingProvider } from '../../src/business/embeddings.js';

/**
 * Fournisseur d'embeddings déterministe, **sans réseau ni coût**.
 *
 * Principe : sac de mots haché (« hashing trick »). Chaque terme active une
 * dimension stable du vecteur ; deux textes qui partagent des mots ont donc des
 * vecteurs proches, ce qui suffit à vérifier de bout en bout le classement
 * cosinus, la fusion RRF et les filtres.
 *
 * Ce fournisseur n'est **pas** un modèle sémantique : il ne capture ni synonymes
 * ni paraphrase. Il ne sert qu'aux tests et au benchmark (voir
 * `tests/benchmark/search-benchmark.ts`).
 */
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly model = 'fake-hash-1536';
  readonly dimensions = EMBEDDING_DIMENSIONS;

  /** Lots reçus, dans l'ordre : permet d'assertir le découpage. */
  readonly calls: string[][] = [];

  /** Fragment de texte déclenchant une erreur (simulation de panne API). */
  failOn: string | undefined;

  async embed(texts: readonly string[]): Promise<number[][]> {
    this.calls.push([...texts]);

    if (this.failOn !== undefined && texts.some((text) => text.includes(this.failOn as string))) {
      throw new Error('panne simulée du fournisseur');
    }

    return texts.map((text) => embedText(text));
  }
}

/** Vecteur 1536 dimensions déterministe pour un texte. */
export function embedText(text: string): number[] {
  const vector: number[] = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);

  for (const token of tokenize(text)) {
    const index = hash(token) % EMBEDDING_DIMENSIONS;
    vector[index] = (vector[index] ?? 0) + 1;
  }

  // Garantit un vecteur non nul même pour un texte sans terme exploitable.
  // (Le booléen intermédiaire évite l'inférence de type predicate de TS 5.5,
  // qui réduirait `vector` à `0[]` dans la branche.)
  const hasSignal = vector.some((value) => value !== 0);
  if (!hasSignal) {
    vector[0] = 1;
  }

  return vector;
}

/** Découpe en termes minuscules (même logique que la recherche FTS). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}_]+/u)
    .filter((token) => token.length > 0);
}

/** FNV-1a 32 bits : stable, rapide, sans dépendance. */
function hash(value: string): number {
  let result = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193) >>> 0;
  }

  return result;
}
