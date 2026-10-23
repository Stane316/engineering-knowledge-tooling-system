import { describe, expect, it } from 'vitest';

import {
  accessibleName,
  Accessibility,
  collectViolations,
  countNodes,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_NODES,
  findNodesByName,
  findNodesByRole,
  forEachNode,
  normalizeAriaSnapshot,
  summariseViolations,
  treeDepth,
} from '../../src/browser/accessibility.js';
import { BrowserNotStartedError } from '../../src/browser/errors.js';
import type { AccessibilityNode } from '../../src/browser/types.js';
import { createFakePage } from './helpers.js';

/** Arbre représentatif de la sortie `ariaSnapshotJSON()` d'une page. */
const PAGE_SNAPSHOT = [
  {
    role: 'WebArea',
    name: 'Boutique en ligne',
    children: [
      { role: 'heading', name: 'Bienvenue', level: 1 },
      { role: 'heading', name: 'Produits', level: 3 },
      { role: 'link', name: 'Accueil', url: 'https://exemple.fr/' },
      { role: 'link' },
      { role: 'button', name: 'Acheter' },
      { role: 'button' },
      { role: 'img' },
      { role: 'img', name: 'Logo EKTS' },
      { role: 'textbox' },
      { role: 'textbox', name: 'Rechercher' },
      'texte libre',
      '',
    ],
  },
];

/** Doublure minimale de session pour `Accessibility`. */
function navigatorWith(page: ReturnType<typeof createFakePage>): { getPage(): typeof page } {
  return { getPage: () => page };
}

describe('normalizeAriaSnapshot', () => {
  it('reconnaît une racine unique renvoyée sous forme de tableau', () => {
    const tree = normalizeAriaSnapshot(PAGE_SNAPSHOT);

    expect(tree.root.role).toBe('WebArea');
    expect(tree.root.name).toBe('Boutique en ligne');
    expect(tree.truncated).toBe(false);
  });

  it('reconnaît un nœud unique', () => {
    const tree = normalizeAriaSnapshot({ role: 'body', name: 'Page' });

    expect(tree.root).toEqual({ role: 'body', name: 'Page' });
  });

  it('regroupe plusieurs racines sous un document synthétique', () => {
    const tree = normalizeAriaSnapshot([{ role: 'main' }, { role: 'contentinfo' }]);

    expect(tree.root.role).toBe('document');
    expect(tree.root.children?.map((child) => child.role)).toEqual(['main', 'contentinfo']);
  });

  it('convertit les fragments de texte en nœuds', () => {
    const tree = normalizeAriaSnapshot([
      { role: 'paragraph', children: ['Bonjour', 'le', 'monde'] },
    ]);

    expect(tree.root.children?.map((child) => child.role)).toEqual(['text', 'text', 'text']);
    expect(tree.root.children?.[0]?.text).toBe('Bonjour');
  });

  it('ignore un fragment d’espaces', () => {
    const tree = normalizeAriaSnapshot([{ role: 'paragraph', children: ['   '] }]);

    expect(tree.root).toEqual({ role: 'paragraph' });
  });

  it('ignore les fragments vides et les valeurs non exploitables', () => {
    const tree = normalizeAriaSnapshot([{ role: 'list', children: ['', null, 42, false] }]);

    expect(tree.root).toEqual({ role: 'list' });
  });

  it('retombe sur « generic » quand le rôle manque', () => {
    expect(normalizeAriaSnapshot([{ name: 'anonyme' }]).root.role).toBe('generic');
  });

  it('retourne un arbre neutre pour une valeur vide ou inconnue', () => {
    expect(normalizeAriaSnapshot(null)).toEqual({
      root: { role: 'generic' },
      nodeCount: 0,
      maxDepth: 0,
      truncated: false,
    });
    expect(normalizeAriaSnapshot([])).toEqual({
      root: { role: 'generic' },
      nodeCount: 0,
      maxDepth: 0,
      truncated: false,
    });
    expect(normalizeAriaSnapshot('texte')).toMatchObject({ root: { role: 'text', text: 'texte' } });
  });

  it('conserve les états et propriétés ARIA', () => {
    const tree = normalizeAriaSnapshot([
      {
        role: 'checkbox',
        name: 'Abonnement',
        checked: 'mixed',
        disabled: true,
        expanded: false,
        selected: true,
        pressed: false,
        value: 'mensuel',
        description: 'Facturé chaque mois',
        text: 'Abonnement mensuel',
      },
    ]);

    expect(tree.root).toEqual({
      role: 'checkbox',
      name: 'Abonnement',
      description: 'Facturé chaque mois',
      text: 'Abonnement mensuel',
      value: 'mensuel',
      checked: 'mixed',
      disabled: true,
      expanded: false,
      selected: true,
      pressed: false,
    });
  });

  it('ignore une valeur non finie', () => {
    const tree = normalizeAriaSnapshot([{ role: 'slider', value: Number.POSITIVE_INFINITY }]);

    expect(tree.root).toEqual({ role: 'slider' });
  });

  it('conserve une valeur numérique finie', () => {
    expect(normalizeAriaSnapshot([{ role: 'slider', value: 3 }]).root).toEqual({
      role: 'slider',
      value: 3,
    });
  });

  it('ignore les propriétés de mauvais type', () => {
    const tree = normalizeAriaSnapshot([
      {
        role: 'list',
        children: [{ role: 'listitem', level: '2', checked: 'oui', disabled: 'non' }],
      },
    ]);

    expect(tree.root.children?.[0]).toEqual({ role: 'listitem' });
  });

  it('tronque à la profondeur maximale', () => {
    const deep = { role: 'a', children: [{ role: 'b', children: [{ role: 'c' }] }] };
    const tree = normalizeAriaSnapshot(deep, { maxDepth: 2 });

    expect(tree.truncated).toBe(true);
    expect(tree.root.children?.[0]?.children).toBeUndefined();
  });

  it('tronque un fragment de texte quand la limite de nœuds est atteinte', () => {
    const tree = normalizeAriaSnapshot(
      { role: 'paragraph', children: ['Bonjour'] },
      { maxNodes: 1 },
    );

    expect(tree.truncated).toBe(true);
    expect(tree.root).toEqual({ role: 'paragraph' });
  });

  it('tronque au nombre maximal de nœuds', () => {
    const wide = {
      role: 'list',
      children: Array.from({ length: 10 }, (_, index) => ({
        role: 'item',
        name: `n${String(index)}`,
      })),
    };
    const tree = normalizeAriaSnapshot(wide, { maxNodes: 4 });

    expect(tree.truncated).toBe(true);
    expect(tree.nodeCount).toBe(4);
    expect(tree.root.children).toHaveLength(3);
  });

  it('applique les bornes par défaut', () => {
    const tree = normalizeAriaSnapshot([] as unknown);

    expect(DEFAULT_MAX_DEPTH).toBe(64);
    expect(DEFAULT_MAX_NODES).toBe(20_000);
    expect(tree.nodeCount).toBe(0);
  });

  it('ne signale aucune troncature quand la profondeur est exactement atteinte', () => {
    const tree = normalizeAriaSnapshot({ role: 'a', children: [{ role: 'b' }] }, { maxDepth: 2 });

    expect(tree.truncated).toBe(false);
    expect(tree.maxDepth).toBe(2);
  });
});

describe('parcours et mesures', () => {
  const tree = normalizeAriaSnapshot(PAGE_SNAPSHOT).root;

  it('compte les nœuds, racine comprise', () => {
    expect(
      countNodes({
        role: 'a',
        children: [{ role: 'b' }, { role: 'c', children: [{ role: 'd' }] }],
      }),
    ).toBe(4);
    expect(countNodes({ role: 'seul' })).toBe(1);
  });

  it('mesure la profondeur', () => {
    expect(treeDepth({ role: 'a', children: [{ role: 'b', children: [{ role: 'c' }] }] })).toBe(3);
    expect(treeDepth({ role: 'a' })).toBe(1);
  });

  it('parcourt dans l’ordre du document', () => {
    const roles: string[] = [];
    forEachNode(tree, (node) => roles.push(node.role));

    expect(roles[0]).toBe('WebArea');
    expect(roles[1]).toBe('heading');
    expect(roles.at(-1)).toBe('text');
  });

  it('trouve les nœuds par rôle, sans tenir compte de la casse', () => {
    expect(findNodesByRole(tree, 'HEADING')).toHaveLength(2);
    expect(findNodesByRole(tree, 'link')).toHaveLength(2);
    expect(findNodesByRole(tree, 'inexistant')).toEqual([]);
  });

  it('trouve les nœuds par nom, en sous-chaîne', () => {
    expect(findNodesByName(tree, 'logo')).toHaveLength(1);
    expect(findNodesByName(tree, 'BOUTIQUE')).toHaveLength(1);
    expect(findNodesByName(tree, 'Introuvable')).toEqual([]);
  });

  it('privilégie le nom accessible sur le texte', () => {
    expect(accessibleName({ role: 'button', name: '  Fermer  ', text: 'X' })).toBe('Fermer');
    expect(accessibleName({ role: 'button', text: ' X ' })).toBe('X');
    expect(accessibleName({ role: 'button' })).toBe('');
  });
});

describe('collectViolations', () => {
  const tree = normalizeAriaSnapshot(PAGE_SNAPSHOT).root;
  const violations = collectViolations(tree);

  it('détecte les images sans texte alternatif', () => {
    expect(violations.filter((item) => item.rule === 'image-alt')).toHaveLength(1);
  });

  it('détecte les boutons et liens sans nom accessible', () => {
    expect(violations.filter((item) => item.rule === 'button-name')).toHaveLength(1);
    expect(violations.filter((item) => item.rule === 'link-name')).toHaveLength(1);
  });

  it('détecte les champs de formulaire sans étiquette', () => {
    const found = violations.filter((item) => item.rule === 'form-label');

    expect(found).toHaveLength(1);
    expect(found[0]?.role).toBe('textbox');
  });

  it('ignore un titre sans niveau', () => {
    const found = collectViolations({ role: 'heading', name: 'Sans niveau' });

    expect(found).toEqual([]);
  });

  it('détecte les sauts de niveau de titre', () => {
    const found = violations.filter((item) => item.rule === 'heading-order');

    expect(found).toHaveLength(1);
    expect(found[0]?.impact).toBe('moderate');
    expect(found[0]?.message).toContain('niveau 3');
  });

  it('nomme le chemin depuis la racine', () => {
    const link = violations.find((item) => item.rule === 'link-name');

    expect(link?.path).toBe('WebArea > link');
  });

  it('signale un document sans titre', () => {
    const found = collectViolations({ role: 'WebArea', children: [] });

    expect(found.some((item) => item.rule === 'document-title')).toBe(true);
  });

  it('n’invente aucune violation sur une page correcte', () => {
    const clean: AccessibilityNode = {
      role: 'WebArea',
      name: 'Page correcte',
      children: [
        { role: 'heading', name: 'Titre', level: 1 },
        { role: 'heading', name: 'Sous-titre', level: 2 },
        { role: 'img', name: 'Illustration' },
        { role: 'link', name: 'Contact', url: 'https://exemple.fr/contact' },
        { role: 'button', name: 'Envoyer' },
        { role: 'textbox', name: 'Courriel' },
        { role: 'text', text: 'Bonjour' },
      ],
    };

    expect(collectViolations(clean)).toEqual([]);
  });

  it('accepte un bouton dont le nom vient du texte', () => {
    const found = collectViolations({
      role: 'button',
      children: [{ role: 'text', text: 'Fermer' }],
    });

    expect(found).toEqual([]);
  });

  it('borne la longueur du chemin', () => {
    let node: AccessibilityNode = { role: 'img' };

    for (let index = 0; index < 14; index += 1) {
      node = { role: `n${String(index)}`, children: [node] };
    }

    const [first] = collectViolations({
      role: 'document',
      name: 'Titre',
      children: [{ role: 'main', children: [node] }],
    });

    expect(first?.path).toBe(
      'document > main > n13 > n12 > n11 > n10 > n9 > n8 > n7 > n6 > n5 > n4 > …',
    );
  });

  it('agrège les violations par gravité', () => {
    expect(summariseViolations(violations)).toEqual({
      minor: 0,
      moderate: 1,
      serious: 4,
      critical: 0,
    });
  });
});

describe('Accessibility', () => {
  it('extrait l’arbre de la page avec ses métadonnées', async () => {
    const page = createFakePage({
      snapshot: PAGE_SNAPSHOT,
      finalUrl: 'https://exemple.fr/',
      title: 'Boutique',
    });
    const result = await new Accessibility(navigatorWith(page)).extract();

    expect(result).toMatchObject({
      url: 'https://exemple.fr/',
      title: 'Boutique',
      nodeCount: 12,
      truncated: false,
    });
    expect(result.extractionTime).toBeGreaterThanOrEqual(0);
  });

  it('applique les bornes demandées', async () => {
    const deep = [
      {
        role: 'WebArea',
        name: 'Page',
        children: [{ role: 'main', children: [{ role: 'section', children: [{ role: 'img' }] }] }],
      },
    ];
    const page = createFakePage({ snapshot: deep });
    const result = await new Accessibility(navigatorWith(page)).extract({ maxDepth: 2 });

    expect(result.truncated).toBe(true);
    expect(result.maxDepth).toBe(2);
  });

  it('tolère un arbre vide', async () => {
    const page = createFakePage({ snapshot: null });
    const result = await new Accessibility(navigatorWith(page)).extract();

    expect(result.root).toEqual({ role: 'generic' });
    expect(result.nodeCount).toBe(0);
  });

  it('tolère un titre illisible', async () => {
    const page = createFakePage({ snapshot: PAGE_SNAPSHOT, titleError: new Error('page fermée') });

    await expect(new Accessibility(navigatorWith(page)).extract()).resolves.toMatchObject({
      title: '',
    });
  });

  it('filtre par rôle et par nom', async () => {
    const page = createFakePage({ snapshot: PAGE_SNAPSHOT });
    const accessibility = new Accessibility(navigatorWith(page));

    await expect(accessibility.findByRole('heading')).resolves.toHaveLength(2);
    await expect(accessibility.findByName('logo')).resolves.toHaveLength(1);
  });

  it('produit un rapport de violations', async () => {
    const page = createFakePage({ snapshot: PAGE_SNAPSHOT });

    const report = await new Accessibility(navigatorWith(page)).getViolations();

    expect(report.violations).toHaveLength(5);
    expect(report.summary.serious).toBe(4);
    expect(report.url).toBe('https://example.com/');
  });

  it('vérifie qu’un élément porte un nom accessible', async () => {
    const page = createFakePage({ evaluate: true });

    await expect(new Accessibility(navigatorWith(page)).isAccessible('h1')).resolves.toBe(true);
    expect(page.calls.evaluate).toHaveBeenCalledOnce();
  });

  it('retourne faux pour un élément absent', async () => {
    const page = createFakePage({ evaluate: false });

    await expect(new Accessibility(navigatorWith(page)).isAccessible('#absent')).resolves.toBe(
      false,
    );
  });

  it('n’accepte qu’un vrai booléen', async () => {
    const page = createFakePage({ evaluate: 'oui' });

    await expect(new Accessibility(navigatorWith(page)).isAccessible('h1')).resolves.toBe(false);
  });

  it('sérialise le sélecteur pour empêcher toute injection', async () => {
    const page = createFakePage();
    const selector = 'h1[data-title="a\\"b"]';

    await new Accessibility(navigatorWith(page)).isAccessible(selector);

    const expression = page.calls.evaluate.mock.calls[0]?.[0] as string;
    expect(expression).toContain(JSON.stringify(selector));
    expect(expression).toContain('document.querySelector');
  });

  it('refuse une extraction sans session', async () => {
    const accessibility = new Accessibility({
      getPage: () => {
        throw new BrowserNotStartedError('extract');
      },
    });

    await expect(accessibility.extract()).rejects.toThrow(BrowserNotStartedError);
  });
});
