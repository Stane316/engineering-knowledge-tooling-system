import { describe, expect, it } from 'vitest';

import {
  countPdfPages,
  detectImageType,
  readImageDimensions,
  readJpegDimensions,
  readPngDimensions,
  UNKNOWN_DIMENSIONS,
} from '../../src/browser/media.js';
import { jpegBuffer, pdfBuffer, pngBuffer } from './helpers.js';

describe('detectImageType', () => {
  it('reconnaît un PNG à sa signature', () => {
    expect(detectImageType(pngBuffer())).toBe('png');
  });

  it('reconnaît un JPEG à son marqueur SOI', () => {
    expect(detectImageType(jpegBuffer())).toBe('jpeg');
  });

  it('retourne « unknown » pour un contenu quelconque', () => {
    expect(detectImageType(Buffer.from('pas une image'))).toBe('unknown');
  });

  it('retourne « unknown » pour un tampon vide', () => {
    expect(detectImageType(Buffer.alloc(0))).toBe('unknown');
  });
});

describe('readPngDimensions', () => {
  it('lit la largeur et la hauteur du chunk IHDR', () => {
    expect(readPngDimensions(pngBuffer(1280, 720))).toEqual({ width: 1280, height: 720 });
  });

  it('retourne zéro pour un PNG tronqué', () => {
    expect(readPngDimensions(pngBuffer().subarray(0, 12))).toEqual(UNKNOWN_DIMENSIONS);
  });

  it('retourne zéro pour un contenu qui n’est pas un PNG', () => {
    expect(readPngDimensions(Buffer.from('GIF89a................'))).toEqual(UNKNOWN_DIMENSIONS);
  });
});

describe('readJpegDimensions', () => {
  it('lit les dimensions dans le segment SOF0', () => {
    expect(readJpegDimensions(jpegBuffer(1024, 768))).toEqual({ width: 1024, height: 768 });
  });

  it('ignore un octet parasite entre deux segments', () => {
    const source = jpegBuffer(300, 200);
    const noisy = Buffer.concat([
      source.subarray(0, 2),
      Buffer.from([0x00, 0x42]),
      source.subarray(2),
    ]);

    expect(readJpegDimensions(noisy)).toEqual({ width: 300, height: 200 });
  });

  it('ignore les octets de remplissage et les marqueurs sans longueur', () => {
    const source = jpegBuffer(300, 200);
    const noisy = Buffer.concat([
      source.subarray(0, 2),
      Buffer.from([0xff, 0xff, 0xff]), // octets de remplissage avant le marqueur
      Buffer.from([0xff, 0x01]), // TEM, sans longueur
      Buffer.from([0xff, 0xd0]), // RST0, sans longueur
      source.subarray(2),
    ]);

    expect(readJpegDimensions(noisy)).toEqual({ width: 300, height: 200 });
  });

  it('retourne zéro si aucun SOF n’est présent', () => {
    const noSof = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from([0xff, 0xda, 0x00, 0x02])]);

    expect(readJpegDimensions(noSof)).toEqual(UNKNOWN_DIMENSIONS);
  });

  it('retourne zéro pour un segment de longueur invalide', () => {
    const invalid = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe0, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]),
    ]);

    expect(readJpegDimensions(invalid)).toEqual(UNKNOWN_DIMENSIONS);
  });

  it('retourne zéro si le contenu n’est pas un JPEG', () => {
    expect(readJpegDimensions(pngBuffer())).toEqual(UNKNOWN_DIMENSIONS);
  });
});

describe('readImageDimensions', () => {
  it('délègue selon le format détecté', () => {
    expect(readImageDimensions(pngBuffer(10, 20))).toEqual({ width: 10, height: 20 });
    expect(readImageDimensions(jpegBuffer(30, 40))).toEqual({ width: 30, height: 40 });
    expect(readImageDimensions(Buffer.from('texte'))).toEqual(UNKNOWN_DIMENSIONS);
  });
});

describe('countPdfPages', () => {
  it('compte les objets page', () => {
    expect(countPdfPages(pdfBuffer(1))).toBe(1);
    expect(countPdfPages(pdfBuffer(7))).toBe(7);
  });

  it('n’est pas trompé par l’objet /Pages du catalogue', () => {
    expect(countPdfPages(pdfBuffer(3))).toBe(3);
  });

  it('se rabat sur /Count quand les objets sont compressés', () => {
    const compressed = Buffer.from(
      '%PDF-1.7\n1 0 obj\n<< /Type /Pages /Kids [] /Count 12 >>\nendobj\nstream\n…\nendstream\n%%EOF',
      'latin1',
    );

    expect(countPdfPages(compressed)).toBe(12);
  });

  it('retient la valeur /Count la plus grande', () => {
    const content = Buffer.from('%PDF-1.7\n<< /Count 5 >>\n<< /Count 2 >>\n%%EOF', 'latin1');

    expect(countPdfPages(content)).toBe(5);
  });

  it('retourne 1 pour un PDF non reconnu mais non vide', () => {
    expect(countPdfPages(Buffer.from('%PDF-1.4\n%%EOF'))).toBe(1);
  });

  it('retourne 0 pour un tampon vide', () => {
    expect(countPdfPages(Buffer.alloc(0))).toBe(0);
  });
});
