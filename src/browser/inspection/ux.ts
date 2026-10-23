/**
 * Analyse UX fondée sur les heuristiques de Nielsen.
 *
 * **Ce que ce module peut et ne peut pas faire.** Une heuristique comme
 * « prévention des erreurs » demande de manipuler l'interface ; on ne peut pas
 * la juger sur un DOM statique. Ce module n'évalue donc que les signaux
 * **observables** qui rendent une page utilisable : repères de navigation,
 * langue, hiérarchie, étiquetage des champs, densité d'information.
 *
 * Chaque heuristique produit un score de 0 à 100 et une liste de constats en
 * français. Le score global est leur moyenne : aucun signal isolé ne peut
 * écraser les autres.
 */

import type { PageSnapshot, UxAnalysis, UxHeuristic } from './types.js';

/** Pénalité appliquée par constat, dans une heuristique. */
const ISSUE_PENALTY = 25;

/** Seuil sous lequel la page est jugée trop pauvre en texte pour être utile. */
const SPARSE_TEXT_WORDS = 50;

/** Heuristiques évaluées, dans l'ordre de Nielsen. */
export const UX_HEURISTICS = [
  { id: 'status', name: 'Visibilité de l’état du système' },
  { id: 'match', name: 'Correspondance avec le monde réel' },
  { id: 'control', name: 'Contrôle et liberté de l’utilisateur' },
  { id: 'consistency', name: 'Cohérence et standards' },
  { id: 'error-prevention', name: 'Prévention des erreurs' },
] as const;

/** Construit une heuristique à partir de ses constats. */
function heuristic(id: UxHeuristic['id'], name: string, issues: readonly string[]): UxHeuristic {
  return {
    id,
    name,
    score: Math.max(0, 100 - issues.length * ISSUE_PENALTY),
    issues,
  };
}

/**
 * Évalue les heuristiques de Nielsen observables sur la photographie du DOM.
 *
 * @param snapshot - Photographie du DOM.
 */
export function analyseUx(snapshot: PageSnapshot): UxAnalysis {
  const wordCount = snapshot.text.split(/\s+/).filter((word) => word !== '').length;
  const [status, match, control, consistency, prevention] = UX_HEURISTICS;

  const statusIssues: string[] = [];

  if (snapshot.landmarks.main === 0) {
    statusIssues.push(
      'Aucune zone principale (main) : la page ne signale pas où se trouve le contenu.',
    );
  }

  if (snapshot.iframes > 0) {
    statusIssues.push(
      `${String(snapshot.iframes)} cadre(s) intégré(s) : leur contenu échappe aux repères de la page.`,
    );
  }

  if (wordCount < SPARSE_TEXT_WORDS) {
    statusIssues.push('Très peu de texte visible : la page n’explique pas ce qu’elle propose.');
  }

  const matchIssues: string[] = [];

  if (snapshot.language === null || snapshot.language.trim() === '') {
    matchIssues.push(
      'Langue non déclarée : les lecteurs d’écran et les traducteurs ne peuvent pas s’adapter.',
    );
  }

  if (snapshot.title.trim() === '') {
    matchIssues.push(
      'Titre absent : rien n’identifie la page dans un onglet ou un résultat de recherche.',
    );
  }

  const controlIssues: string[] = [];

  if (snapshot.landmarks.nav === 0) {
    controlIssues.push(
      'Aucune zone de navigation : l’utilisateur ne peut pas se déplacer dans le site.',
    );
  }

  if (snapshot.links.length === 0) {
    controlIssues.push('Aucun lien : la page est un cul-de-sac.');
  }

  const consistencyIssues: string[] = [];
  const h1Count = snapshot.headings.filter((heading) => heading.level === 1).length;

  if (h1Count > 1) {
    consistencyIssues.push(
      `${String(h1Count)} titres de niveau 1 : la hiérarchie n’est pas cohérente.`,
    );
  }

  if (skipsLevel(snapshot)) {
    consistencyIssues.push('Niveaux de titres sautés : la structure de lecture est irrégulière.');
  }

  if (snapshot.headings.length === 0) {
    consistencyIssues.push('Aucun titre : la page n’a pas de structure de lecture.');
  }

  const preventionIssues: string[] = [];
  const unlabelled = snapshot.inputs - snapshot.labelledInputs;

  if (unlabelled > 0) {
    preventionIssues.push(
      `${String(unlabelled)} champ(s) sans étiquette : l’utilisateur ne sait pas quoi saisir.`,
    );
  }

  if (snapshot.inputs > 0 && snapshot.buttons === 0) {
    preventionIssues.push(
      'Des champs existent sans action visible : l’utilisateur ne peut pas valider.',
    );
  }

  const heuristics = [
    heuristic(status.id, status.name, statusIssues),
    heuristic(match.id, match.name, matchIssues),
    heuristic(control.id, control.name, controlIssues),
    heuristic(consistency.id, consistency.name, consistencyIssues),
    heuristic(prevention.id, prevention.name, preventionIssues),
  ];

  return {
    score: Math.round(
      heuristics.reduce((total, entry) => total + entry.score, 0) / heuristics.length,
    ),
    heuristics,
  };
}

/** Détecte un saut de niveau dans la hiérarchie des titres. */
function skipsLevel(snapshot: PageSnapshot): boolean {
  let previous = 0;

  for (const heading of snapshot.headings) {
    if (previous !== 0 && heading.level > previous + 1) {
      return true;
    }

    previous = heading.level;
  }

  return false;
}
