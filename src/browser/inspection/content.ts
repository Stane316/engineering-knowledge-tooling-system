/**
 * Analyse de contenu : volume, lisibilité et structure.
 *
 * **Lisibilité.** L'indice de Flesch adapté au français (Kandel-Moles) vaut
 * `207 − 1,015 × (mots / phrases) − 73,6 × (syllabes / mots)`. Les syllabes
 * sont estimées par groupes de voyelles : c'est une approximation, suffisante
 * pour classer un texte (« difficile » / « accessible ») et **stable** d'un
 * moteur à l'autre, contrairement à un comptage par dictionnaire.
 *
 * Le score ne mesure pas la véracité ni la pertinence du propos : il signale
 * une page trop courte, illisible ou sans structure, ce qu'un rapport peut
 * vérifier sans jugement automatique.
 */

import type { ContentAnalysis, PageSnapshot } from './types.js';

/** Mots lus par minute, référence usuelle pour un adulte. */
export const WORDS_PER_MINUTE = 200;

/** Nombre de mots en dessous duquel une page est jugée pauvre. */
export const MIN_WORDS = 300;

/** Voyelles comptées pour l'estimation syllabique (français). */
const VOWELS = /[aeiouyàâäéèêëîïôöùûüœ]+/gi;

/** Score maximal de l'indice de Flesch. */
const FLESCH_MAX = 207;

/** Nombre de mots par phrase à partir duquel le texte est dense. */
const WORDS_PER_SENTENCE_LIMIT = 25;

/** Découpe un texte en phrases non vides. */
export function splitSentences(text: string): readonly string[] {
  return text
    .split(/[.!?…]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== '');
}

/** Découpe un texte en mots non vides. */
export function splitWords(text: string): readonly string[] {
  return text.split(/\s+/).filter((word) => word !== '');
}

/**
 * Estime le nombre de syllabes d'un mot.
 *
 * Les groupes de voyelles comptent pour une syllabe ; un `e` final muet est
 * retiré sauf s'il est la seule voyelle du mot (« de », « le »).
 */
export function countSyllables(word: string): number {
  const normalised = word.toLowerCase();
  const groups = normalised.match(VOWELS);

  if (groups === null) {
    return 1;
  }

  const silentTrailingE = groups.length > 1 && /e$/.test(normalised) && !/[éèêë]/.test(normalised);

  return Math.max(1, groups.length - (silentTrailingE ? 1 : 0));
}

/**
 * Calcule l'indice de lisibilité de Flesch (Kandel-Moles).
 *
 * @param text - Texte visible.
 * @returns Un score de 0 à 100 (plus haut = plus simple). `0` quand le texte
 *   est vide, faute de mesure possible.
 */
export function readabilityScore(text: string): number {
  const words = splitWords(text);
  const sentences = splitSentences(text);

  if (words.length === 0 || sentences.length === 0) {
    return 0;
  }

  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  const score =
    FLESCH_MAX - 1.015 * (words.length / sentences.length) - 73.6 * (syllables / words.length);

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Analyse le contenu d'une page.
 *
 * @param snapshot - Photographie du DOM.
 */
export function analyseContent(snapshot: PageSnapshot): ContentAnalysis {
  const words = splitWords(snapshot.text);
  const wordCount = words.length;
  const readability = readabilityScore(snapshot.text);
  const sentences = splitSentences(snapshot.text);
  const wordsPerSentence = sentences.length === 0 ? 0 : wordCount / sentences.length;

  let score = 100;

  if (wordCount === 0) {
    score = 0;
  } else {
    if (wordCount < MIN_WORDS) {
      score -= 30;
    }

    if (readability > 0 && readability < 30) {
      score -= 25;
    }

    if (wordsPerSentence > WORDS_PER_SENTENCE_LIMIT) {
      score -= 15;
    }

    if (snapshot.paragraphs === 0) {
      score -= 15;
    }

    if (snapshot.headings.length === 0) {
      score -= 15;
    }
  }

  return {
    score: Math.max(0, score),
    wordCount,
    readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
    readabilityScore: readability,
    structure: {
      paragraphs: snapshot.paragraphs,
      lists: snapshot.lists,
      tables: snapshot.tables,
      headings: snapshot.headings.length,
    },
  };
}
