/**
 * Déclaration minimale de Lighthouse.
 *
 * Le paquet `lighthouse` ne publie pas de types racine : sans ce fichier,
 * `import('lighthouse')` échouerait en TS2307. On ne décrit que ce que le
 * projet utilise — la fonction d'analyse et son résultat — plutôt que
 * d'importer les types internes, instables d'une version à l'autre.
 */
declare module 'lighthouse' {
  /** Fonction d'analyse : `lighthouse(url, flags, config?)`. */
  const lighthouse: (
    url: string,
    flags: Record<string, unknown>,
    config?: unknown,
  ) => Promise<{ lhr: unknown; report?: unknown }>;

  export default lighthouse;
}
