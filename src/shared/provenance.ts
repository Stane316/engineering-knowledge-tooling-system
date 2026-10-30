/**
 * Provenance des ressources (Sprint 22-01).
 *
 * Une ressource peut porter un **contrat de provenance** dans
 * `metadata.provenance` : origine, version, trois décisions de droits
 * distinctes, sensibilité, empreinte et état de revue. Aucune migration n'est
 * nécessaire — `resources.metadata` est déjà du JSON validé — donc les
 * ressources historiques ne sont ni réécrites ni supprimées : elles n'ont
 * simplement pas ce bloc, et restent affichées comme provenance inconnue.
 *
 * Deux principes non négociables :
 *
 * 1. **Rien n'est déduit.** Les droits de lecture, de redistribution et
 *    d'exécution sont trois axes séparés : accorder la lecture ne dit rien de
 *    la redistribution. Un axe absent est un refus de saisie, pas une
 *    permission implicite.
 * 2. **L'inconnu se déclare.** Les champs `source`, `sourceVersion`,
 *    `fingerprint` et les dates de revue sont obligatoires mais peuvent valoir
 *    `null` : `null` signifie « explicitement inconnu », jamais « absent », et
 *    n'est jamais remplacé par une valeur inventée.
 *
 * Une empreinte atteste des octets comparés, pas leur authenticité ni le droit
 * de les utiliser.
 */

import { z } from 'zod';

import { ValidationError } from './errors.js';

/** Clé de `metadata` portant le contrat de provenance. */
export const PROVENANCE_METADATA_KEY = 'provenance';

/** Décisions possibles pour un axe de droit. */
export const RIGHTS_DECISIONS = ['granted', 'refused', 'unknown'] as const;

/** États de revue d'une ressource. */
export const REVIEW_STATUSES = ['pending', 'authorized', 'refused', 'unknown'] as const;

/** Niveaux de sensibilité déclarés. */
export const SENSITIVITY_LEVELS = ['synthetic', 'internal', 'sensitive'] as const;

const RightsDecisionSchema = z.enum(RIGHTS_DECISIONS, {
  error: `décision attendue : ${RIGHTS_DECISIONS.join(', ')}`,
});

/** Empreinte SHA-256 hexadécimale (32 octets, 64 caractères). */
const Sha256Schema = z
  .string()
  .regex(/^[0-9a-f]{64}$/iu, 'empreinte SHA-256 attendue (64 caractères hexadécimaux)');

/** Chaîne connue, ou `null` pour « explicitement inconnu ». */
const KnownOrUnknownText = z
  .string()
  .trim()
  .min(1, 'valeur vide : utilisez null si inconnue')
  .nullable();

/**
 * Contrat de provenance d'une ressource.
 *
 * Tous les champs sont obligatoires : le rédacteur doit dire ce qu'il ignore.
 */
export const ProvenanceSchema = z
  .object({
    /** Origine ou localisateur (dépôt, chemin, document). `null` : inconnue. */
    source: KnownOrUnknownText,
    /** Commit, version documentaire ou date de la source. `null` : inconnue. */
    sourceVersion: KnownOrUnknownText,
    /** Trois décisions indépendantes. */
    rights: z.object({
      read: RightsDecisionSchema,
      redistribute: RightsDecisionSchema,
      execute: RightsDecisionSchema,
    }),
    /** Classification de sensibilité (gouvernance, pas contrôle d'accès). */
    sensitivity: z.enum(SENSITIVITY_LEVELS, {
      error: `sensibilité attendue : ${SENSITIVITY_LEVELS.join(', ')}`,
    }),
    /** Empreinte des octets de référence. `null` : non calculée. */
    fingerprint: z.object({ sha256: Sha256Schema }).nullable(),
    /** Décision humaine de revue. */
    review: z.object({
      status: z.enum(REVIEW_STATUSES, {
        error: `statut de revue attendu : ${REVIEW_STATUSES.join(', ')}`,
      }),
      decidedAt: z.iso.datetime({ message: 'date ISO 8601 attendue' }).nullable(),
      decidedBy: KnownOrUnknownText,
    }),
  })
  .strict();

/** Provenance validée. */
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** Résultat d'évaluation d'admission au corpus gouverné. */
export interface Admission {
  /** La ressource entre-t-elle dans le corpus gouverné ? */
  readonly admitted: boolean;
  /** Motif lisible, toujours renseigné (admission comprise). */
  readonly reason: string;
}

/**
 * Valide une valeur de provenance.
 *
 * @param value - Valeur brute (issue d'un fichier ou de `metadata`).
 * @returns La provenance validée.
 * @throws {ValidationError} Bloc invalide ; chaque problème est préfixé.
 */
export function parseProvenance(value: unknown): Provenance {
  const result = ProvenanceSchema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length === 0 ? '' : `.${issue.path.map(String).join('.')}`;

      return `provenance${path} : ${issue.message}`;
    });

    throw new ValidationError(issues);
  }

  return result.data;
}

/**
 * Lit la provenance d'un bloc `metadata`.
 *
 * @param metadata - Métadonnées de la ressource.
 * @returns La provenance, ou `undefined` si le bloc est absent (ressource
 *          historique). Un bloc présent mais invalide lève.
 * @throws {ValidationError} Bloc présent et invalide.
 */
export function extractProvenance(
  metadata: Readonly<Record<string, unknown>>,
): Provenance | undefined {
  const raw = metadata[PROVENANCE_METADATA_KEY];

  return raw === undefined ? undefined : parseProvenance(raw);
}

/**
 * Évalue l'admission au corpus gouverné.
 *
 * Règle arrêtée le 30/10/2026 : `review.status === 'authorized'` **et**
 * `rights.read === 'granted'`. Les droits de redistribution et d'exécution sont
 * enregistrés mais n'entrent pas dans cette décision : les confondre
 * reviendrait à refuser une lecture autorisée au motif qu'une diffusion ne
 * l'est pas.
 *
 * @param provenance - Provenance lue, ou `undefined` pour une ressource
 *                     historique.
 */
export function assessAdmission(provenance: Provenance | undefined): Admission {
  if (provenance === undefined) {
    return {
      admitted: false,
      reason: 'provenance absente (ressource historique), non admise au corpus gouverné',
    };
  }

  if (provenance.review.status !== 'authorized') {
    return {
      admitted: false,
      reason: `revue non autorisée (statut : ${provenance.review.status})`,
    };
  }

  if (provenance.rights.read === 'refused') {
    return { admitted: false, reason: 'droit de lecture refusé' };
  }

  if (provenance.rights.read === 'unknown') {
    return { admitted: false, reason: 'droit de lecture inconnu (aucune décision)' };
  }

  return {
    admitted: true,
    reason: 'droit de lecture accordé et revue autorisée',
  };
}

/**
 * Vérifie qu'une mise à jour ne supprime pas une provenance existante.
 *
 * @param existing - Provenance déjà enregistrée (ou `undefined`).
 * @param incoming - Métadonnées proposées, ou `undefined` si inchangées.
 * @throws {ValidationError} La mise à jour effacerait la provenance.
 */
export function assertProvenancePreserved(
  existing: Provenance | undefined,
  incoming: Readonly<Record<string, unknown>> | undefined,
): void {
  if (existing === undefined || incoming === undefined) {
    return;
  }

  if (incoming[PROVENANCE_METADATA_KEY] === undefined) {
    throw new ValidationError([
      'provenance : la provenance enregistrée ne peut pas être supprimée par une mise à jour (elle peut être révisée)',
    ]);
  }
}
