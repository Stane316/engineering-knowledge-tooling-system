import { describe, expect, it } from 'vitest';

import { createPalette, formatBytes, plural, renderTable, truncate } from '../../src/cli/output.js';

describe('palette', () => {
  it('ne produit aucune séquence ANSI quand elle est désactivée', () => {
    const palette = createPalette(false);

    expect(palette.enabled).toBe(false);
    expect(palette.bold('x')).toBe('x');
    expect(palette.dim('x')).toBe('x');
    expect(palette.success('x')).toBe('x');
    expect(palette.error('x')).toBe('x');
    expect(palette.warning('x')).toBe('x');
    expect(palette.accent('x')).toBe('x');
  });

  it('applique les styles quand elle est activée', () => {
    const palette = createPalette(true);

    expect(palette.enabled).toBe(true);
    expect(palette.bold('x')).toBe('\u001b[1mx\u001b[22m');
    expect(palette.success('x')).toBe('\u001b[32mx\u001b[39m');
    expect(palette.error('x')).toBe('\u001b[31mx\u001b[39m');
    expect(palette.warning('x')).toBe('\u001b[33mx\u001b[39m');
    expect(palette.accent('x')).toBe('\u001b[36mx\u001b[39m');
    expect(palette.dim('x')).toBe('\u001b[90mx\u001b[39m');
  });
});

describe('renderTable', () => {
  it('renvoie une chaîne vide sans ligne', () => {
    expect(renderTable({ columns: [{ header: 'A' }], rows: [] })).toBe('');
  });

  it('aligne les colonnes et encadre le tableau', () => {
    const table = renderTable({
      columns: [{ header: 'NOM' }, { header: 'TOTAL', align: 'right' }],
      rows: [
        ['a', '1'],
        ['bbb', '22'],
      ],
    });

    expect(table.split('\n')).toEqual([
      '+-----+-------+',
      '| NOM | TOTAL |',
      '+-----+-------+',
      '| a   |     1 |',
      '| bbb |    22 |',
      '+-----+-------+',
    ]);
  });

  it('tolère une ligne plus courte ou plus longue que les colonnes', () => {
    const shorter = renderTable({
      columns: [{ header: 'A' }, { header: 'B' }],
      rows: [['x']],
    });
    const longer = renderTable({
      columns: [{ header: 'A' }],
      rows: [['x', 'débordement']],
    });

    expect(shorter).toContain('| x |   |');
    expect(longer).not.toContain('débordement');
  });
});

describe('truncate', () => {
  it('laisse intact un texte assez court', () => {
    expect(truncate('abc', 3)).toBe('abc');
  });

  it('ajoute une ellipse quand le texte dépasse', () => {
    expect(truncate('abcdefgh', 6)).toBe('abc...');
  });

  it('ne dépasse jamais la largeur demandée, même très petite', () => {
    expect(truncate('abcdefgh', 3)).toBe('...');
    expect(truncate('abcdefgh', 1)).toBe('.');
    expect(truncate('abcdefgh', 0)).toBe('');
  });
});

describe('formatBytes', () => {
  it('choisit l’unité adaptée', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('plural', () => {
  it('accorde au singulier jusqu’à un élément', () => {
    expect(plural(0, 'ressource')).toBe('0 ressource');
    expect(plural(1, 'ressource')).toBe('1 ressource');
    expect(plural(2, 'ressource')).toBe('2 ressources');
  });

  it('accepte un pluriel irrégulier', () => {
    expect(plural(2, 'tag', 'tags')).toBe('2 tags');
  });
});
