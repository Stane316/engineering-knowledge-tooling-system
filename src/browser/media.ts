/**
 * Lecture des métadonnées d'artefacts binaires.
 *
 * Playwright sait produire des captures et des PDF, mais ne renvoie que le
 * tampon binaire. Les dimensions d'une capture et le nombre de pages d'un PDF
 * sont en revanche nécessaires au rapport d'inspection (Sprint 11) et aux
 * contrôles de performance. Plutôt que d'ajouter `sharp` ou `pdf-lib` — deux
 * dépendances lourdes pour trois champs — le module lit directement les
 * en-têtes des formats concernés :
 *
 * - **PNG** : en-tête IHDR (norme ISO/IEC 15948).
 * - **JPEG** : segment `SOFn` (norme ISO/IEC 10918-1).
 * - **PDF** : objets `/Type /Page` (norme ISO 32000-1).
 *
 * Toutes les fonctions sont pures et retournent une valeur neutre (`0`) quand
 * le format n'est pas reconnu : un artefact illisible ne doit jamais faire
 * échouer une inspection.
 */

import type { ImageDimensions } from './types.js';

/** Dimensions nulles, valeur de repli. */
export const UNKNOWN_DIMENSIONS: ImageDimensions = { width: 0, height: 0 };

/** Type d'image détecté à partir des octets de tête. */
export type ImageType = 'png' | 'jpeg' | 'unknown';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SOI = 0xffd8;

/**
 * Détermine le format d'une image à partir de sa signature.
 *
 * @param buffer - Contenu binaire.
 */
export function detectImageType(buffer: Buffer): ImageType {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return 'png';
  }

  if (buffer.length >= 2 && buffer.readUInt16BE(0) === JPEG_SOI) {
    return 'jpeg';
  }

  return 'unknown';
}

/**
 * Lit les dimensions d'une image PNG (chunk IHDR).
 *
 * @param buffer - Contenu PNG.
 * @returns Dimensions, ou zéro si le chunk IHDR est absent ou tronqué.
 */
export function readPngDimensions(buffer: Buffer): ImageDimensions {
  // 8 octets de signature + 4 de longueur + 4 de type = premier chunk à l'offset 16.
  if (buffer.length < 24 || detectImageType(buffer) !== 'png') {
    return UNKNOWN_DIMENSIONS;
  }

  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** Marqueurs `SOF` portant les dimensions (tous sauf DHT, JPG et DAC). */
const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/**
 * Lit les dimensions d'une image JPEG en parcourant ses segments.
 *
 * Le parcours s'arrête au premier `SOFn` : c'est lui qui contient la hauteur et
 * la largeur réelles, y compris pour une image progressive.
 *
 * @param buffer - Contenu JPEG.
 * @returns Dimensions, ou zéro si aucun `SOFn` exploitable n'est trouvé.
 */
export function readJpegDimensions(buffer: Buffer): ImageDimensions {
  if (detectImageType(buffer) !== 'jpeg') {
    return UNKNOWN_DIMENSIONS;
  }

  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer.readUInt8(offset + 1);

    // Les marqueurs de remplissage (0xFF) et les marqueurs sans longueur
    // (SOI, EOI, RSTn, TEM) n'ont pas de champ longueur.
    if (marker === 0xff) {
      offset += 1;
      continue;
    }

    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      (marker >= 0xd0 && marker <= 0xd7) ||
      marker === 0x01
    ) {
      offset += 2;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);

    if (SOF_MARKERS.has(marker)) {
      // [FF][SOFn][len 2][précision 1][hauteur 2][largeur 2]
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    if (length < 2) {
      break;
    }

    offset += 2 + length;
  }

  return UNKNOWN_DIMENSIONS;
}

/**
 * Lit les dimensions d'une image, quel que soit le format supporté.
 *
 * @param buffer - Contenu binaire.
 * @returns Dimensions, ou zéro si le format est inconnu.
 */
export function readImageDimensions(buffer: Buffer): ImageDimensions {
  switch (detectImageType(buffer)) {
    case 'png':
      return readPngDimensions(buffer);
    case 'jpeg':
      return readJpegDimensions(buffer);
    default:
      return UNKNOWN_DIMENSIONS;
  }
}

/** Motif d'un objet page PDF (`/Type /Page`, sans le `s` des `/Pages`). */
const PDF_PAGE_OBJECT = /\/Type\s*\/Page(?![s\w])/g;
/** Arbre de pages (`/Type /Pages` … `/Count N`), repli si les objets sont compressés. */
const PDF_COUNT = /\/Count\s+(\d+)/g;

/**
 * Compte les pages d'un PDF.
 *
 * Chromium écrit des objets non compressés : le décompte des `/Type /Page` est
 * exact. Si le document utilise des flux compressés (filtre `FlateDecode` sur
 * l'arbre de pages), le module se rabat sur le plus grand `/Count` déclaré, et
 * enfin sur `1` : mieux vaut annoncer une page de trop que zéro.
 *
 * @param buffer - Contenu PDF.
 * @returns Nombre de pages, au minimum 1 pour un contenu non vide.
 */
export function countPdfPages(buffer: Buffer): number {
  if (buffer.length === 0) {
    return 0;
  }

  const content = buffer.toString('latin1');
  const pages = content.match(PDF_PAGE_OBJECT)?.length ?? 0;

  if (pages > 0) {
    return pages;
  }

  let declared = 0;

  for (const match of content.matchAll(PDF_COUNT)) {
    // Le motif garantit un groupe numérique : aucun repli nécessaire.
    const value = Number.parseInt(match[1] as string, 10);

    if (value > declared) {
      declared = value;
    }
  }

  return Math.max(declared, 1);
}
