/**
 * Profil d'exposition du serveur MCP (Sprint 21-01, exigences P01 et P02).
 *
 * Le serveur exposait dix-sept outils sans distinction : un agent branché sur
 * EKTS pouvait inspecter un site, créer un projet ou appliquer un template.
 * Le profil de **lecture** restreint l'exposition à trois noms, et le contrôle
 * s'applique aux deux bouts : `tools/list` (découverte) et l'exécution
 * (dispatch), pour qu'appeler un nom connu mais masqué échoue quand même.
 *
 * **La politique est déclarative et vit ici**, pas dans une annotation d'outil :
 * `readOnlyHint` n'a aucune valeur d'autorisation (`get_recommendations` est
 * annoté en lecture et écrit pourtant des recommandations).
 *
 * Choix de migration (décision du propriétaire, 30/10/2026) : la variable
 * `EKTS_MCP_PROFILE` est **facultative** ; son absence conserve le
 * comportement historique (profil `full`, dix-sept outils), documenté comme
 * tel. Une valeur vide, malformée ou inconnue **refuse le démarrage** : il n'y
 * a aucune bascule silencieuse vers le profil complet.
 */

import { TOOL_NAMES } from './schemas/tool-schemas.js';

/** Noms de profil reconnus. */
export const MCP_PROFILE_NAMES = ['read', 'full'] as const;

/** Profil reconnu. */
export type McpProfileName = (typeof MCP_PROFILE_NAMES)[number];

/** Variable d'environnement qui sélectionne le profil. */
export const PROFILE_ENV_VAR = 'EKTS_MCP_PROFILE';

/**
 * Politique d'exposition d'une session MCP.
 *
 * `tools` est la liste **exhaustive** des noms autorisés : tout ce qui n'y
 * figure pas est refusé, y compris un outil ajouté plus tard.
 */
export interface McpProfilePolicy {
  /** Nom du profil (`read`, `full`, ou un nom explicite de test). */
  readonly name: string;
  /** Noms d'outils autorisés, dans l'ordre d'exposition. */
  readonly tools: readonly string[];
  /**
   * Exige `mode: "fts"` **explicitement fourni** pour `search_knowledge`.
   *
   * Le schéma Zod applique `mode = "hybrid"` par défaut : un contrôle qui
   * valide d'abord ne verrait jamais l'omission. La vérification porte donc sur
   * les arguments bruts, avant toute validation et avant tout appel
   * d'embeddings (Sprint 21-02, C-P08).
   */
  readonly requireExplicitFtsMode: boolean;
}

/** Erreur de configuration du profil : le serveur ne doit pas démarrer. */
export class McpProfileError extends Error {
  constructor(
    message: string,
    readonly profile?: string,
  ) {
    super(message);
    this.name = 'McpProfileError';
  }
}

/** Les trois outils du profil de lecture, dans l'ordre exposé. */
export const READ_TOOL_NAMES = ['search_knowledge', 'get_resource', 'list_resources'] as const;

/**
 * Politiques livrées.
 *
 * `read` est la cible du scénario agent ; `full` reproduit exactement
 * l'exposition historique et n'est pas un profil de sécurité.
 */
export const MCP_PROFILES: Readonly<Record<McpProfileName, McpProfilePolicy>> = {
  read: {
    name: 'read',
    tools: [...READ_TOOL_NAMES],
    requireExplicitFtsMode: true,
  },
  full: {
    name: 'full',
    tools: [...TOOL_NAMES],
    requireExplicitFtsMode: false,
  },
};

/**
 * Vérifie qu'une politique est utilisable.
 *
 * Une politique vide n'est jamais interprétée : ni « zéro outil » (serveur
 * muet présenté comme sûr) ni « tous les outils » (bascule silencieuse). Un nom
 * inconnu révèle une faute de frappe, donc un profil qui n'expose pas ce que
 * son auteur croyait.
 *
 * @param policy - Politique candidate.
 * @throws {McpProfileError} Liste vide ou nom d'outil inexistant.
 */
export function assertValidPolicy(policy: McpProfilePolicy): void {
  if (policy.tools.length === 0) {
    throw new McpProfileError(
      `Politique du profil « ${policy.name} » vide : refus d'exposer un serveur sans outil autorisé.`,
      policy.name,
    );
  }

  const known = new Set<string>(TOOL_NAMES);

  for (const tool of policy.tools) {
    if (!known.has(tool)) {
      throw new McpProfileError(
        `Politique du profil « ${policy.name} » : outil inconnu « ${tool} ».`,
        policy.name,
      );
    }
  }
}

/**
 * Résout le profil demandé par l'environnement.
 *
 * @param raw - Valeur brute de `EKTS_MCP_PROFILE`.
 * @returns La politique à appliquer.
 * @throws {McpProfileError} Valeur vide, malformée ou inconnue.
 */
export function resolveProfile(raw: string | undefined): McpProfilePolicy {
  if (raw === undefined) {
    // Absence assumée : compatibilité historique (décision du 30/10/2026).
    return MCP_PROFILES.full;
  }

  const value = raw.trim();

  if (value === '') {
    throw new McpProfileError(
      `Profil MCP vide ou malformé dans ${PROFILE_ENV_VAR} : valeurs acceptées ${MCP_PROFILE_NAMES.join(', ')}.`,
    );
  }

  if (!isProfileName(value)) {
    throw new McpProfileError(
      `Profil MCP inconnu « ${value} » dans ${PROFILE_ENV_VAR} : valeurs acceptées ${MCP_PROFILE_NAMES.join(', ')}.`,
      value,
    );
  }

  const policy = MCP_PROFILES[value];
  assertValidPolicy(policy);

  return policy;
}

/** Reconnaît un nom de profil. */
function isProfileName(value: string): value is McpProfileName {
  return (MCP_PROFILE_NAMES as readonly string[]).includes(value);
}

/**
 * Indique si un outil est autorisé par la politique.
 *
 * @param policy - Politique appliquée.
 * @param name - Nom d'outil demandé.
 */
export function isToolAllowed(policy: McpProfilePolicy, name: string): boolean {
  return policy.tools.includes(name);
}

/**
 * Filtre une liste de définitions d'outils selon la politique.
 *
 * L'ordre de la politique est conservé : `tools/list` est stable d'une session
 * à l'autre, ce qui rend les comparaisons de tests et de journaux lisibles.
 *
 * @param policy - Politique appliquée.
 * @param definitions - Définitions disponibles, dans leur ordre historique.
 */
export function allowedTools<T extends { readonly name: string }>(
  policy: McpProfilePolicy,
  definitions: readonly T[],
): readonly T[] {
  const byName = new Map(definitions.map((definition) => [definition.name, definition]));

  return policy.tools
    .map((name) => byName.get(name))
    .filter((definition): definition is T => definition !== undefined);
}
