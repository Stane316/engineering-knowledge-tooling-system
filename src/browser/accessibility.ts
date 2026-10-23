/**
 * Accessibility tree : extraction, normalisation, recherche et violations.
 *
 * **Écart majeur avec le dossier Sprint 7 (E7-1).** Le dossier utilise
 * `page.accessibility.snapshot()`. Cette API a été **supprimée de Playwright** :
 * elle n'existe plus dans la version 1.64 installée ici (ni dans aucune version
 * depuis 1.50). Le remplacement officiel est `page.ariaSnapshot()` (YAML) ou
 * `page.ariaSnapshotJSON()` (arbre JSON), qui produit exactement la structure
 * attendue par la suite du projet : rôles ARIA, noms accessibles, niveaux de
 * titres, URL des liens, états.
 *
 * Le module normalise cet arbre en `AccessibilityNode` (contrat stable, propre
 * au projet) puis calcule les violations **hors navigateur**, à partir du seul
 * arbre. Aucun sélecteur CSS, aucun accès DOM : les règles restent pures,
 * testables hors ligne, et s'appliquent de la même façon aux trois moteurs.
 * L'analyse complète (axe-core, WCAG 2.2 AA) reste prévue aux Sprints 8-9 ; les
 * règles ci-dessous sont un premier niveau, volontairement conservateur.
 */

import type {
  AccessibilityExtractOptions,
  AccessibilityNode,
  AccessibilityReport,
  AccessibilityResult,
  AccessibilityPageLike,
  AccessibilityViolation,
  ViolationImpact,
} from './types.js';

/** Profondeur par défaut (au-delà, l'arbre est tronqué). */
export const DEFAULT_MAX_DEPTH = 64;

/** Nombre de nœuds par défaut (garde-fou mémoire sur les pages pathologiques). */
export const DEFAULT_MAX_NODES = 20_000;

/** Rôles de champ de formulaire soumis à l'exigence d'étiquette. */
const FORM_ROLES = new Set([
  'checkbox',
  'combobox',
  'listbox',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'textbox',
]);

/** Rôles de titre dans l'arbre ARIA. */
const HEADING_ROLE = 'heading';

/** Règles connues ; une règle absent de la table ne peut pas être produite. */
const RULE_IMPACT = {
  'image-alt': 'serious',
  'button-name': 'serious',
  'link-name': 'serious',
  'form-label': 'serious',
  'heading-order': 'moderate',
  'document-title': 'moderate',
} as const satisfies Record<string, ViolationImpact>;

/** Nom d'une règle connue. */
type ViolationRule = keyof typeof RULE_IMPACT;

/** Arbre normalisé et statistiques. */
export interface AccessibilityTree {
  readonly root: AccessibilityNode;
  readonly nodeCount: number;
  readonly maxDepth: number;
  /** `true` si un garde-fou a tronqué l'arbre. */
  readonly truncated: boolean;
}

interface NormalizeState {
  readonly maxDepth: number;
  readonly maxNodes: number;
  count: number;
  truncated: boolean;
}

/**
 * Convertit la sortie de `ariaSnapshotJSON()` en arbre normalisé.
 *
 * Accepte les trois formes réellement produites par Playwright :
 * une liste de racines (appel au niveau page), un nœud unique (appel au niveau
 * locator), et des enfants textuels (chaînes) mêlés aux enfants nœuds.
 *
 * @param raw - Valeur renvoyée par `ariaSnapshotJSON()`.
 * @param options - Bornes de profondeur et de nombre de nœuds.
 */
export function normalizeAriaSnapshot(
  raw: unknown,
  options: AccessibilityExtractOptions = {},
): AccessibilityTree {
  const state: NormalizeState = {
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    maxNodes: options.maxNodes ?? DEFAULT_MAX_NODES,
    count: 0,
    truncated: false,
  };

  const roots = toNodes(raw, state, 0);

  if (roots.length === 0) {
    return { root: { role: 'generic' }, nodeCount: 0, maxDepth: 0, truncated: state.truncated };
  }

  const root: AccessibilityNode =
    roots.length === 1 ? roots[0]! : { role: 'document', children: roots };

  return {
    root,
    nodeCount: state.count,
    maxDepth: treeDepth(root),
    truncated: state.truncated,
  };
}

/** Profondeur d'un arbre (une feuille vaut 1, un arbre vide vaut 0). */
export function treeDepth(node: AccessibilityNode): number {
  const children = node.children ?? [];

  if (children.length === 0) {
    return 1;
  }

  let deepest = 0;

  for (const child of children) {
    deepest = Math.max(deepest, treeDepth(child));
  }

  return deepest + 1;
}

/** Nombre total de nœuds, racine comprise. */
export function countNodes(node: AccessibilityNode): number {
  const children = node.children ?? [];

  return children.reduce((total, child) => total + countNodes(child), 1);
}

/**
 * Recherche les nœuds d'un rôle donné (comparaison insensible à la casse).
 *
 * @param node - Racine du parcours.
 * @param role - Rôle ARIA recherché.
 */
export function findNodesByRole(node: AccessibilityNode, role: string): AccessibilityNode[] {
  const expected = role.toLowerCase();
  const matches: AccessibilityNode[] = [];

  forEachNode(node, (current) => {
    if (current.role.toLowerCase() === expected) {
      matches.push(current);
    }
  });

  return matches;
}

/**
 * Recherche les nœuds dont le nom accessible contient un texte donné.
 *
 * @param node - Racine du parcours.
 * @param name - Fragment recherché (insensible à la casse).
 */
export function findNodesByName(node: AccessibilityNode, name: string): AccessibilityNode[] {
  const expected = name.toLowerCase();
  const matches: AccessibilityNode[] = [];

  forEachNode(node, (current) => {
    if (current.name !== undefined && current.name.toLowerCase().includes(expected)) {
      matches.push(current);
    }
  });

  return matches;
}

/**
 * Parcours préfixe (document order).
 *
 * @param node - Racine.
 * @param visit - Rappel appliqué à chaque nœud.
 */
export function forEachNode(
  node: AccessibilityNode,
  visit: (node: AccessibilityNode) => void,
): void {
  visit(node);

  for (const child of node.children ?? []) {
    forEachNode(child, visit);
  }
}

/**
 * Nom accessible effectif d'un nœud.
 *
 * `name` prime ; à défaut, le texte propre du nœud (bouton construit à partir
 * de son contenu, fragment de texte).
 *
 * @param node - Nœud évalué.
 */
export function accessibleName(node: AccessibilityNode): string {
  const name = node.name?.trim();

  if (name !== undefined && name.length > 0) {
    return name;
  }

  return node.text?.trim() ?? '';
}

/**
 * Texte descendant concaténé.
 *
 * Un bouton ou un lien construit à partir de son contenu porte son nom dans
 * des nœuds `text` enfants, pas dans `name`. Sans cette concaténation, tout
 * `<button>Fermer</button>` serait signalé à tort.
 *
 * @param node - Nœud évalué.
 */
export function descendantText(node: AccessibilityNode): string {
  const parts: string[] = [];

  const visit = (current: AccessibilityNode): void => {
    const text = current.text?.trim();

    if (text !== undefined && text.length > 0) {
      parts.push(text);
    }

    for (const child of current.children ?? []) {
      visit(child);
    }
  };

  for (const child of node.children ?? []) {
    visit(child);
  }

  return parts.join(' ').trim();
}

/**
 * Calcule les violations d'accessibilité détectables dans l'arbre.
 *
 * Règles implémentées (volontairement limitées) :
 * `image-alt`, `button-name`, `link-name`, `form-label`, `heading-order`,
 * `document-title`. Aucune ne remplace un audit axe-core.
 *
 * @param root - Racine normalisée.
 */
export function collectViolations(root: AccessibilityNode): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  let previousHeadingLevel: number | null = null;

  const visit = (node: AccessibilityNode, path: readonly string[]): void => {
    const currentPath = [...path, node.role];
    const name = accessibleName(node) || descendantText(node);

    switch (node.role) {
      case 'img':
        if (name.length === 0) {
          violations.push(
            violation('image-alt', currentPath, node, 'Image sans texte alternatif.'),
          );
        }
        break;
      case 'button':
        if (name.length === 0) {
          violations.push(
            violation(
              'button-name',
              currentPath,
              node,
              'Bouton sans nom accessible (texte ou aria-label).',
            ),
          );
        }
        break;
      case 'link':
        if (name.length === 0) {
          violations.push(violation('link-name', currentPath, node, 'Lien sans nom accessible.'));
        }
        break;
      case HEADING_ROLE: {
        const level = node.level ?? 0;

        if (previousHeadingLevel !== null && level > 0 && level > previousHeadingLevel + 1) {
          violations.push(
            violation(
              'heading-order',
              currentPath,
              node,
              `Titre de niveau ${String(level)} après un niveau ${String(previousHeadingLevel)} : la hiérarchie saute un niveau.`,
            ),
          );
        }

        if (level > 0) {
          previousHeadingLevel = level;
        }
        break;
      }
      default:
        if (FORM_ROLES.has(node.role) && name.length === 0) {
          violations.push(
            violation(
              'form-label',
              currentPath,
              node,
              `Champ « ${node.role} » sans étiquette accessible.`,
            ),
          );
        }
    }

    for (const child of node.children ?? []) {
      visit(child, currentPath);
    }
  };

  if ((root.role === 'document' || root.role === 'WebArea') && accessibleName(root).length === 0) {
    violations.push(
      violation('document-title', ['document'], root, 'Document sans titre accessible.'),
    );
  }

  visit(root, []);

  return violations;
}

/**
 * Agrège les violations par gravité.
 *
 * @param violations - Violations calculées.
 */
export function summariseViolations(
  violations: readonly AccessibilityViolation[],
): Record<ViolationImpact, number> {
  const summary: Record<ViolationImpact, number> = {
    minor: 0,
    moderate: 0,
    serious: 0,
    critical: 0,
  };

  for (const item of violations) {
    summary[item.impact] += 1;
  }

  return summary;
}

/**
 * Façade d'accessibilité adossée à une session de navigation.
 *
 * @example
 * ```ts
 * const accessibility = new Accessibility(navigator);
 * const tree = await accessibility.extract();
 * const headings = await accessibility.findByRole('heading');
 * const report = await accessibility.getViolations();
 * ```
 */
export class Accessibility {
  constructor(private readonly navigator: { getPage(): AccessibilityPageLike }) {}

  /**
   * Extrait l'arbre de la page courante.
   *
   * @param options - Bornes de profondeur et de nombre de nœuds.
   * @throws {BrowserNotStartedError} Aucune session ouverte.
   */
  async extract(options: AccessibilityExtractOptions = {}): Promise<AccessibilityResult> {
    const page = this.navigator.getPage();
    const started = Date.now();
    const raw = await page.ariaSnapshotJSON();
    const tree = normalizeAriaSnapshot(raw, options);

    return {
      root: tree.root,
      nodeCount: tree.nodeCount,
      maxDepth: tree.maxDepth,
      extractionTime: Date.now() - started,
      url: page.url(),
      title: await page.title().catch(() => ''),
      truncated: tree.truncated,
    };
  }

  /**
   * Nœuds d'un rôle donné dans la page courante.
   *
   * @param role - Rôle ARIA.
   */
  async findByRole(role: string): Promise<AccessibilityNode[]> {
    return findNodesByRole((await this.extract()).root, role);
  }

  /**
   * Nœuds dont le nom accessible contient le texte donné.
   *
   * @param name - Fragment recherché.
   */
  async findByName(name: string): Promise<AccessibilityNode[]> {
    return findNodesByName((await this.extract()).root, name);
  }

  /**
   * Rapport d'accessibilité de la page courante.
   */
  async getViolations(): Promise<AccessibilityReport> {
    const result = await this.extract();
    const violations = collectViolations(result.root);

    return {
      url: result.url,
      title: result.title,
      nodeCount: result.nodeCount,
      violations,
      summary: summariseViolations(violations),
    };
  }

  /**
   * Indique si un élément existe et porte un nom accessible.
   *
   * Le test s'exécute **dans la page** : il résout `aria-labelledby`, lit
   * `aria-label`, `alt` et `title`, et se rabat sur le texte visible. Un
   * `role` seul ne suffit pas : un `<div role="button">` vide reste invisible
   * pour un lecteur d'écran.
   *
   * @param selector - Sélecteur CSS.
   */
  async isAccessible(selector: string): Promise<boolean> {
    const page = this.navigator.getPage();
    const expression = buildAccessibilityExpression(selector);

    return (await page.evaluate<unknown>(expression)) === true;
  }
}

/** Construit le nœud de violation, avec un chemin borné. */
function violation(
  rule: ViolationRule,
  path: readonly string[],
  node: AccessibilityNode,
  message: string,
): AccessibilityViolation {
  const name = accessibleName(node);

  return {
    rule,
    impact: RULE_IMPACT[rule],
    path: formatPath(path),
    role: node.role,
    ...(name.length === 0 ? {} : { name }),
    message,
  };
}

/** Chemin lisible, tronqué au-delà de douze segments. */
function formatPath(segments: readonly string[]): string {
  if (segments.length <= 12) {
    return segments.join(' > ');
  }

  return `${segments.slice(0, 12).join(' > ')} > …`;
}

/** Convertit une valeur inconnue en liste de nœuds normalisés. */
function toNodes(value: unknown, state: NormalizeState, depth: number): AccessibilityNode[] {
  if (Array.isArray(value)) {
    const nodes: AccessibilityNode[] = [];

    for (const item of value) {
      nodes.push(...toNodes(item, state, depth));
    }

    return nodes;
  }

  const node = toNode(value, state, depth);

  return node === null ? [] : [node];
}

/** Convertit une valeur inconnue en nœud normalisé, ou `null`. */
function toNode(value: unknown, state: NormalizeState, depth: number): AccessibilityNode | null {
  if (typeof value === 'string') {
    const text = value.trim();

    if (text.length === 0) {
      return null;
    }

    if (!reserveNode(state)) {
      return null;
    }

    return { role: 'text', text };
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (!reserveNode(state)) {
    return null;
  }

  const childrenValue = record['children'];
  const hasChildren = Array.isArray(childrenValue) && childrenValue.length > 0;
  let children: AccessibilityNode[] | undefined;

  if (hasChildren) {
    if (depth + 1 >= state.maxDepth) {
      state.truncated = true;
    } else {
      children = toNodes(childrenValue, state, depth + 1);

      if (children.length === 0) {
        children = undefined;
      }
    }
  }

  return {
    role:
      typeof record['role'] === 'string' && record['role'].length > 0 ? record['role'] : 'generic',
    ...optionalString(record, 'name'),
    ...optionalString(record, 'description'),
    ...optionalString(record, 'text'),
    ...optionalPrimitive(record, 'value'),
    ...optionalNumber(record, 'level'),
    ...optionalString(record, 'url'),
    ...optionalState(record, 'checked'),
    ...optionalBoolean(record, 'disabled'),
    ...optionalBoolean(record, 'expanded'),
    ...optionalBoolean(record, 'selected'),
    ...optionalState(record, 'pressed'),
    ...(children === undefined ? {} : { children }),
  };
}

/** Réserve un emplacement de nœud, ou marque l'arbre comme tronqué. */
function reserveNode(state: NormalizeState): boolean {
  if (state.count >= state.maxNodes) {
    state.truncated = true;

    return false;
  }

  state.count += 1;

  return true;
}

function optionalString(record: Record<string, unknown>, key: string): Record<string, string> {
  const value = record[key];

  return typeof value === 'string' && value.length > 0 ? { [key]: value } : {};
}

function optionalNumber(record: Record<string, unknown>, key: string): Record<string, number> {
  const value = record[key];

  return typeof value === 'number' && Number.isFinite(value) ? { [key]: value } : {};
}

function optionalPrimitive(
  record: Record<string, unknown>,
  key: string,
): Record<string, string | number> {
  const value = record[key];

  if (typeof value === 'string') {
    return { [key]: value };
  }

  return typeof value === 'number' && Number.isFinite(value) ? { [key]: value } : {};
}

function optionalBoolean(record: Record<string, unknown>, key: string): Record<string, boolean> {
  const value = record[key];

  return typeof value === 'boolean' ? { [key]: value } : {};
}

function optionalState(
  record: Record<string, unknown>,
  key: string,
): Record<string, boolean | 'mixed'> {
  const value = record[key];

  if (typeof value === 'boolean' || value === 'mixed') {
    return { [key]: value };
  }

  return {};
}

/**
 * Construit l'expression exécutée dans la page.
 *
 * Le sélecteur est sérialisé en JSON : il ne peut pas s'échapper de la chaîne
 * et devenir du code. L'expression est une IIFE qui renvoie un booléen.
 */
function buildAccessibilityExpression(selector: string): string {
  return `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;

    const label = (element.getAttribute('aria-label') || '').trim();
    if (label) return true;

    const labelledBy = element.getAttribute('aria-labelledby') || '';
    const labelledByText = labelledBy
      .split(/\\s+/)
      .filter(Boolean)
      .some((id) => {
        const target = document.getElementById(id);
        return target !== null && (target.textContent || '').trim().length > 0;
      });
    if (labelledByText) return true;

    const alt = (element.getAttribute('alt') || '').trim();
    if (alt) return true;

    const title = (element.getAttribute('title') || '').trim();
    if (title) return true;

    return (element.textContent || '').trim().length > 0;
  })()`;
}
