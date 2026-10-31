/**
 * Caviardage des traces (Sprint 23-02, C-T03).
 *
 * Une trace est écrite pour être **relue**, souvent redirigée dans un fichier
 * puis transmise à un tiers. Elle ne doit donc jamais contenir un secret, même
 * lorsque le composant qui produit l'erreur le recopie : un fournisseur qui
 * renvoie « HTTP 401 pour la clé sk-… » dans son corps de réponse ne doit pas
 * transformer le journal en copie de la clé.
 *
 * ## Deux sources de vérité, pas une
 *
 * 1. **Les valeurs sensibles de l'environnement** : toute variable dont le nom
 *    désigne un secret (`…_KEY`, `…_TOKEN`, `…_SECRET`, `…_PASSWORD`, `AUTH…`)
 *    et dont la valeur est assez longue pour être un secret réel.
 * 2. **Les formes reconnaissables** : préfixes publics de fournisseurs
 *    (`sk-`, `ghp_`, `xoxb-`, `AIza…`) et en-têtes `Bearer`, qu'aucun nom de
 *    variable n'annonce.
 *
 * ## Le marqueur est fixe, jamais une empreinte
 *
 * Remplacer un secret par son hash n'anonymise rien : un hash de mot de passe
 * ou de clé se casse hors ligne, et un hash tronqué reste corrélable d'une
 * trace à l'autre. Le caviardage emploie donc une **chaîne constante**, qui ne
 * permet ni de retrouver le secret ni de suivre ses occurrences.
 *
 * Le caviardage est un **filet de sécurité**, pas une autorisation d'écrire des
 * secrets dans les traces : un secret découpé, encodé en base64 ou reformaté
 * peut échapper aux règles. La discipline reste de ne pas journaliser de
 * contenu utilisateur ni d'identifiant d'authentification.
 */

/** Marqueur substitué à toute valeur caviardée. */
export const REDACTION_MARKER = '[caviardé]';

/** Longueur minimale d'une valeur d'environnement pour être caviardée. */
const MIN_SECRET_LENGTH = 8;

/** Nom de variable désignant un secret. */
const SENSITIVE_NAME = /(KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|AUTH)/iu;

/** Formes de secrets reconnaissables sans connaître la valeur. */
const SECRET_PATTERNS: readonly RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/gu,
  /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{16,}\b/gu,
  /\bgithub_pat_[A-Za-z0-9_]{16,}\b/gu,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/gu,
  /\bAIza[0-9A-Za-z_-]{30,}\b/gu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/giu,
];

/** Interface du caviardeur. */
export interface Redactor {
  /** Valeurs sensibles retenues (jamais exposées telles quelles). */
  readonly secretCount: number;
  /** Caviarde un texte. */
  redact(text: string): string;
  /** Caviarde récursivement les chaînes d'une structure de données. */
  redactData(value: unknown): unknown;
}

/** Options du caviardeur. */
export interface RedactorOptions {
  /** Environnement à inspecter (défaut : `process.env`). */
  readonly env?: NodeJS.ProcessEnv;
  /** Valeurs supplémentaires à caviarder (tests, secrets hors environnement). */
  readonly secrets?: readonly string[];
}

/**
 * Valeurs d'environnement désignant un secret.
 *
 * Le tri par longueur décroissante évite qu'un secret contenu dans un autre ne
 * laisse un fragment du plus long visible.
 *
 * @param env - Environnement à inspecter.
 */
export function sensitiveEnvValues(env: NodeJS.ProcessEnv): string[] {
  const values: string[] = [];

  for (const [name, value] of Object.entries(env)) {
    if (value !== undefined && SENSITIVE_NAME.test(name) && value.length >= MIN_SECRET_LENGTH) {
      values.push(value);
    }
  }

  return values.sort((left, right) => right.length - left.length);
}

/** Remplace un texte par le marqueur, même vide. */
function mask(): string {
  return REDACTION_MARKER;
}

/**
 * Construit un caviardeur.
 *
 * @param options - Environnement et valeurs supplémentaires.
 */
export function createRedactor(options: RedactorOptions = {}): Redactor {
  const env = options.env ?? process.env;
  const secrets = [...new Set([...sensitiveEnvValues(env), ...(options.secrets ?? [])])]
    .filter((secret) => secret.length >= MIN_SECRET_LENGTH)
    .sort((left, right) => right.length - left.length);

  const redact = (text: string): string => {
    let result = text;

    for (const secret of secrets) {
      if (result.includes(secret)) {
        result = result.split(secret).join(mask());
      }
    }

    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, mask());
    }

    return result;
  };

  const redactData = (value: unknown, depth = 0): unknown => {
    if (typeof value === 'string') {
      return redact(value);
    }

    if (value === null || typeof value !== 'object' || depth >= 4) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => redactData(entry, depth + 1));
    }

    if (value instanceof Error) {
      return redact(value.message);
    }

    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, entry]) => [key, redactData(entry, depth + 1)] as const,
    );

    return Object.fromEntries(entries);
  };

  return {
    secretCount: secrets.length,
    redact,
    redactData,
  };
}
