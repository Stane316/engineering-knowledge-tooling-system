/**
 * Photographie du DOM en une seule évaluation.
 *
 * **Pourquoi une expression sérialisée.** `PageLike.evaluate` reçoit une
 * chaîne : l'extrait est donc du texte JavaScript exécuté dans la page. Il est
 * écrit comme une IIFE autonome, sans dépendance, pour rester valable sur les
 * trois moteurs.
 *
 * **Pourquoi une normalisation en TypeScript.** Le résultat traverse la
 * frontière du navigateur : rien ne garantit sa forme. `normaliseSnapshot`
 * reconstruit un objet sûr, champ par champ, avec des valeurs par défaut
 * explicites. Une page vide, un DOM exotique ou un moteur qui renvoie `null`
 * ne peuvent donc pas faire planter les analyses en aval.
 */

import type { PageLike } from '../types.js';
import type { HeadingInfo, ImageInfo, LinkInfo, PageSnapshot } from './types.js';

/** Longueur maximale du texte visible conservé (20 000 caractères). */
export const MAX_TEXT_LENGTH = 20_000;

/** Nombre maximal d'éléments conservés par catégorie. */
export const MAX_ITEMS = 500;

/**
 * Expression exécutée dans la page.
 *
 * Elle collecte ce dont les analyses SEO, UX et contenu ont besoin, sans
 * requête réseau : tout est déjà dans le DOM chargé.
 */
export const PAGE_SNAPSHOT_EXPRESSION = `(() => {
  const limit = ${String(MAX_ITEMS)};
  const textLimit = ${String(MAX_TEXT_LENGTH)};
  const take = (list) => Array.from(list).slice(0, limit);
  const textOf = (node) => (node.textContent || '').replace(/\\s+/g, ' ').trim();
  const metaContent = (selector) => {
    const node = document.querySelector(selector);
    return node === null ? null : node.getAttribute('content');
  };
  const collectMeta = (prefix) => {
    const result = {};
    for (const node of document.querySelectorAll('meta[property^="' + prefix + '"], meta[name^="' + prefix + '"]')) {
      const key = node.getAttribute('property') || node.getAttribute('name');
      const value = node.getAttribute('content');
      if (key && value !== null && result[key] === undefined) result[key] = value;
    }
    return result;
  };
  const origin = window.location.origin;
  const isExternal = (href) => {
    try {
      return new URL(href, window.location.href).origin !== origin;
    } catch {
      return false;
    }
  };

  return {
    language: document.documentElement.getAttribute('lang'),
    userAgent: navigator.userAgent || '',
    title: document.title || '',
    description: metaContent('meta[name="description"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    robots: metaContent('meta[name="robots"]'),
    viewportMeta: metaContent('meta[name="viewport"]'),
    openGraph: collectMeta('og:'),
    twitter: collectMeta('twitter:'),
    headings: take(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((node) => ({
      level: Number(node.tagName.slice(1)),
      text: textOf(node).slice(0, 300),
    })),
    links: take(document.querySelectorAll('a[href]')).map((node) => ({
      href: node.href,
      text: textOf(node).slice(0, 300),
      external: isExternal(node.getAttribute('href') || ''),
    })),
    images: take(document.querySelectorAll('img')).map((node) => ({
      src: node.currentSrc || node.getAttribute('src') || '',
      alt: node.hasAttribute('alt') ? node.getAttribute('alt') : null,
      width: Number(node.getAttribute('width')) || node.naturalWidth || 0,
      height: Number(node.getAttribute('height')) || node.naturalHeight || 0,
      lazy: node.getAttribute('loading') === 'lazy',
    })),
    landmarks: {
      main: document.querySelectorAll('main, [role="main"]').length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      header: document.querySelectorAll('header, [role="banner"]').length,
      footer: document.querySelectorAll('footer, [role="contentinfo"]').length,
    },
    structuredDataBlocks: document.querySelectorAll('script[type="application/ld+json"]').length,
    paragraphs: document.querySelectorAll('p').length,
    lists: document.querySelectorAll('ul, ol').length,
    tables: document.querySelectorAll('table').length,
    buttons: document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').length,
    inputs: document.querySelectorAll('input:not([type="hidden"]), select, textarea').length,
    labelledInputs: Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea')).filter((node) => {
      const id = node.getAttribute('id');
      const wrapped = node.closest('label') !== null;
      const explicit = id !== null && document.querySelector('label[for="' + id + '"]') !== null;
      return wrapped || explicit || node.hasAttribute('aria-label') || node.hasAttribute('aria-labelledby');
    }).length,
    iframes: document.querySelectorAll('iframe').length,
    text: (document.body === null ? '' : document.body.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, textLimit),
  };
})()`;

/** Snapshot vide, utilisé quand la page n'a pas produit de JSON exploitable. */
export const EMPTY_SNAPSHOT: PageSnapshot = {
  language: null,
  userAgent: '',
  title: '',
  description: null,
  canonical: null,
  robots: null,
  viewportMeta: null,
  openGraph: {},
  twitter: {},
  headings: [],
  links: [],
  images: [],
  landmarks: { main: 0, nav: 0, header: 0, footer: 0 },
  structuredDataBlocks: 0,
  paragraphs: 0,
  lists: 0,
  tables: 0,
  buttons: 0,
  inputs: 0,
  labelledInputs: 0,
  iframes: 0,
  text: '',
};

/** Valeur textuelle ou `null`. */
function asText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Valeur textuelle, chaîne vide par défaut. */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Entier positif ou `0`. */
function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

/** Objet de chaînes, filtré. */
function asMap(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }

  return result;
}

/** Tableau d'objets, tronqué. */
function asList(value: unknown): readonly Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
  );
}

/** Normalise les titres. */
function asHeadings(value: unknown): readonly HeadingInfo[] {
  return asList(value)
    .map((entry) => ({ level: asCount(entry['level']), text: asString(entry['text']) }))
    .filter((heading) => heading.level >= 1 && heading.level <= 6);
}

/** Normalise les liens. */
function asLinks(value: unknown): readonly LinkInfo[] {
  return asList(value)
    .map((entry) => ({
      href: asString(entry['href']),
      text: asString(entry['text']),
      external: entry['external'] === true,
    }))
    .filter((link) => link.href !== '');
}

/** Normalise les images. */
function asImages(value: unknown): readonly ImageInfo[] {
  return asList(value).map((entry) => ({
    src: asString(entry['src']),
    alt: typeof entry['alt'] === 'string' ? entry['alt'] : null,
    width: asCount(entry['width']),
    height: asCount(entry['height']),
    lazy: entry['lazy'] === true,
  }));
}

/**
 * Reconstruit une photographie sûre depuis la valeur brute du navigateur.
 *
 * @param raw - Résultat de `page.evaluate`, de forme inconnue.
 */
export function normaliseSnapshot(raw: unknown): PageSnapshot {
  if (typeof raw !== 'object' || raw === null) {
    return EMPTY_SNAPSHOT;
  }

  const source = raw as Record<string, unknown>;
  const landmarks =
    typeof source['landmarks'] === 'object' && source['landmarks'] !== null
      ? (source['landmarks'] as Record<string, unknown>)
      : {};

  return {
    language: asText(source['language']),
    userAgent: asString(source['userAgent']),
    title: asString(source['title']),
    description: asText(source['description']),
    canonical: asText(source['canonical']),
    robots: asText(source['robots']),
    viewportMeta: asText(source['viewportMeta']),
    openGraph: asMap(source['openGraph']),
    twitter: asMap(source['twitter']),
    headings: asHeadings(source['headings']),
    links: asLinks(source['links']),
    images: asImages(source['images']),
    landmarks: {
      main: asCount(landmarks['main']),
      nav: asCount(landmarks['nav']),
      header: asCount(landmarks['header']),
      footer: asCount(landmarks['footer']),
    },
    structuredDataBlocks: asCount(source['structuredDataBlocks']),
    paragraphs: asCount(source['paragraphs']),
    lists: asCount(source['lists']),
    tables: asCount(source['tables']),
    buttons: asCount(source['buttons']),
    inputs: asCount(source['inputs']),
    labelledInputs: asCount(source['labelledInputs']),
    iframes: asCount(source['iframes']),
    text: asString(source['text']).slice(0, MAX_TEXT_LENGTH),
  };
}

/**
 * Extrait la photographie du DOM de la page courante.
 *
 * @param page - Page Playwright (ou doublure de test).
 */
export async function extractPageSnapshot(page: PageLike): Promise<PageSnapshot> {
  const raw = await page.evaluate<unknown>(PAGE_SNAPSHOT_EXPRESSION);

  return normaliseSnapshot(raw);
}
