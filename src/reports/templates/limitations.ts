/**
 * Limites d'interprétation des scores (Sprint 20-01, W05 / C-W10).
 *
 * Le défaut visé : un score axe saturé, un score UX à 100 obtenu sur un jeu
 * de règles restreint, ou une analyse d'accessibilité indisponible pouvaient
 * se lire comme une certification. Ces notes sont **factuelles et générées**
 * à partir des scores réellement présents dans l'audit ; elles ne certifient
 * rien et n'ajoutent aucune affirmation sur ce qui n'a pas été mesuré.
 */

import type { Audit } from '../../storage/types.js';

/** Note d'interprétation attachée à une dimension. */
export interface ScoreLimitation {
  /** Dimension concernée. */
  readonly dimension: string;
  /** Texte de la limite, en français. */
  readonly message: string;
}

/**
 * Notes d'interprétation déduites des scores de l'audit.
 *
 * @param audit - Audit dont on lit les scores par dimension.
 * @returns Les notes applicables (liste vide si aucune ne l'est).
 */
export function scoreLimitations(audit: Audit): ScoreLimitation[] {
  const notes: ScoreLimitation[] = [];
  const accessibility = audit.dimensions.find((dim) => dim.dimension === 'accessibility');
  const ux = audit.dimensions.find((dim) => dim.dimension === 'ux');

  if (accessibility !== undefined) {
    if (accessibility.score === null) {
      notes.push({
        dimension: 'accessibility',
        message:
          "Analyse axe-core indisponible : l'accessibilité n'a pas été évaluée. Ce rapport ne permet donc de conclure ni à la présence ni à l'absence de défauts d'accessibilité.",
      });
    } else if (accessibility.score === 0) {
      notes.push({
        dimension: 'accessibility',
        message:
          'Score axe saturé à 0 : la saturation signale un grand nombre de violations détectées, elle ne mesure pas un degré de conformité. Un score axe — même élevé — ne certifie aucune conformité WCAG.',
      });
    } else {
      notes.push({
        dimension: 'accessibility',
        message:
          'Le score axe est un indicateur issu de règles automatisées ; il ne couvre pas l’ensemble des critères WCAG et ne constitue pas une certification.',
      });
    }
  }

  if (ux !== undefined) {
    if (ux.score === null) {
      notes.push({
        dimension: 'ux',
        message:
          "Évaluation UX indisponible : aucune conclusion sur l'expérience utilisateur ne peut être tirée de ce rapport.",
      });
    } else if (ux.score === 100) {
      notes.push({
        dimension: 'ux',
        message:
          'UX à 100 : cette dimension est évaluée par un jeu limité de règles heuristiques. Un score parfait ne garantit ni une expérience parfaite ni l’absence de défauts.',
      });
    } else {
      notes.push({
        dimension: 'ux',
        message:
          'La dimension UX repose sur des heuristiques limitées : elle indique des pistes, pas une mesure d’expérience utilisateur réelle.',
      });
    }
  }

  return notes;
}
