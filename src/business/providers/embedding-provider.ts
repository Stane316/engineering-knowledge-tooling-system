import { EMBEDDING_DIMENSIONS } from '../../shared/constants.js';
import { usableProviders } from '../../shared/providers/catalog.js';
import { NoProviderAvailableError } from '../../shared/errors.js';
import type { RouteTrace } from '../../shared/providers/types.js';
import type { EmbeddingProvider } from '../embeddings.js';
import type { ProviderGateway } from './gateway.js';

/**
 * `EmbeddingProvider` adossé à la passerelle multi-fournisseurs.
 *
 * Il permet à `EmbeddingsService` (Sprint 4, inchangé) de bénéficier de la
 * rotation de clés, du repli ordonné et du disjoncteur **sans modifier une
 * ligne de son code** : la passerelle se glisse derrière l'interface existante.
 *
 * Invariant central : un provider ne sert **qu'un seul espace d'embedding**.
 * `space` est figé à la construction (ou résolu depuis le premier fournisseur
 * disponible) et la passerelle reçoit cet espace à chaque appel ; elle ne peut
 * donc pas basculer vers un modèle de dimension ou de repère différents.
 */
export class GatewayEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private lastTrace: RouteTrace | undefined;
  private readonly requestedSpace: string | undefined;

  constructor(
    private readonly gateway: ProviderGateway,
    options: { space?: string } = {},
  ) {
    this.requestedSpace = options.space;
  }

  /**
   * Modèle effectivement utilisé au dernier appel.
   *
   * Reste `'auto'` tant qu'aucun appel n'a eu lieu : le fournisseur est choisi
   * à l'exécution, c'est le principe même du routage.
   */
  get model(): string {
    return this.lastTrace?.model ?? 'auto';
  }

  /** Espace d'embedding servi (ou `undefined` si aucun fournisseur n'est prêt). */
  get space(): string | undefined {
    if (this.requestedSpace !== undefined) {
      return this.requestedSpace;
    }

    return this.gateway.plan('embedding')[0]?.space;
  }

  /** Trace du dernier appel réussi (fournisseur, modèle, latence). */
  get trace(): RouteTrace | undefined {
    return this.lastTrace;
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    const space = this.space;
    const outcome = await this.gateway.embed(texts, space === undefined ? {} : { space });

    this.lastTrace = outcome.trace;
    return outcome.vectors;
  }
}

/** Description de l'espace servi, telle qu'enregistrée dans l'index. */
export interface ActiveEmbeddingSpace {
  space: string;
  provider: string;
  model: string;
  dimensions: number;
}

/**
 * Résout l'espace d'embedding à lier à l'index, sans effectuer d'appel réseau.
 *
 * @param gateway - Passerelle configurée.
 * @param explicit - Espace imposé par la configuration (`EKTS_EMBEDDING_SPACE`).
 * @returns L'espace, son fournisseur et le modèle qui le sert.
 * @throws {NoProviderAvailableError} Aucun fournisseur d'embedding configuré.
 */
export function resolveEmbeddingSpace(
  gateway: ProviderGateway,
  explicit?: string,
): ActiveEmbeddingSpace {
  const routes = gateway.plan('embedding', explicit === undefined ? {} : { space: explicit });
  const route = routes[0];

  if (route === undefined || route.space === undefined) {
    throw new NoProviderAvailableError(
      'embedding',
      usableProviders('embedding').map(
        (provider) => `${provider.id}: clé absente (${provider.envKeys.join(' ou ')})`,
      ),
    );
  }

  return {
    space: route.space,
    provider: route.provider.id,
    model: route.model,
    dimensions: route.nativeDimensions ?? EMBEDDING_DIMENSIONS,
  };
}
