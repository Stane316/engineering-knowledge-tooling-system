/**
 * Analyse SEO dérivée du DOM.
 *
 * **Aucune requête réseau** : tout vient de la photographie prise au niveau L1.
 * Les règles sont volontairement peu nombreuses et explicites — un score qui
 * ne s'explique pas ne sert à rien dans un rapport. Chaque constat porte un
 * identifiant stable, une sévérité et une phrase en français.
 *
 * Le score part de 100 et retire une pénalité par constat. Il ne prétend pas
 * remplacer Lighthouse : il couvre les fondations qu'un audit SEO manuel
 * vérifie en premier (titre, description, structure de titres, images, indexation).
 */

import type { PageSnapshot, SeoAnalysis, SeoIssue } from './types.js';

/** Pénalité associée à chaque règle. */
export const SEO_PENALTIES = {
  title: 25,
  titleLength: 8,
  description: 20,
  descriptionLength: 5,
  h1: 15,
  h1Multiple: 8,
  headingOrder: 5,
  imageAlt: 10,
  canonical: 3,
  noindex: 12,
  language: 5,
  viewport: 5,
  openGraph: 3,
  structuredData: 3,
} as const;

/** Bornes de longueur conseillées pour un titre. */
export const TITLE_RANGE = { min: 15, max: 60 } as const;

/** Bornes de longueur conseillées pour une description. */
export const DESCRIPTION_RANGE = { min: 50, max: 160 } as const;

/** Ordre des sévérités, du plus grave au moins grave. */
const SEVERITY_RANK = { error: 0, warning: 1, info: 2 } as const;

/** Construit un constat. */
function issue(
  id: string,
  message: string,
  severity: SeoIssue['severity'],
  penalty: number,
): { issue: SeoIssue; penalty: number } {
  return { issue: { id, message, severity }, penalty };
}

/**
 * Relève les problèmes SEO de la page.
 *
 * @param snapshot - Photographie du DOM.
 * @param title - Titre du document (`document.title`, source la plus fiable).
 */
export function collectSeoIssues(
  snapshot: PageSnapshot,
  title: string,
): { issues: readonly SeoIssue[]; penalty: number } {
  const found: { issue: SeoIssue; penalty: number }[] = [];
  const titleLength = title.trim().length;
  const description = snapshot.description ?? '';
  const h1Count = snapshot.headings.filter((heading) => heading.level === 1).length;

  if (titleLength === 0) {
    found.push(
      issue(
        'title',
        'Aucun titre de document (balise <title> vide).',
        'error',
        SEO_PENALTIES.title,
      ),
    );
  } else if (titleLength < TITLE_RANGE.min) {
    found.push(
      issue(
        'title-length',
        `Titre trop court (${String(titleLength)} caractères, ${String(TITLE_RANGE.min)} conseillés).`,
        'warning',
        SEO_PENALTIES.titleLength,
      ),
    );
  } else if (titleLength > TITLE_RANGE.max) {
    found.push(
      issue(
        'title-length',
        `Titre tronqué dans les résultats (${String(titleLength)} caractères, ${String(TITLE_RANGE.max)} au plus).`,
        'warning',
        SEO_PENALTIES.titleLength,
      ),
    );
  }

  if (description.trim().length === 0) {
    found.push(
      issue(
        'meta-description',
        'Aucune description (meta[name="description"] absente).',
        'error',
        SEO_PENALTIES.description,
      ),
    );
  } else if (description.trim().length < DESCRIPTION_RANGE.min) {
    found.push(
      issue(
        'description-length',
        `Description courte (${String(description.trim().length)} caractères, ${String(DESCRIPTION_RANGE.min)} conseillés).`,
        'warning',
        SEO_PENALTIES.descriptionLength,
      ),
    );
  } else if (description.trim().length > DESCRIPTION_RANGE.max) {
    found.push(
      issue(
        'description-length',
        `Description tronquée (${String(description.trim().length)} caractères, ${String(DESCRIPTION_RANGE.max)} au plus).`,
        'warning',
        SEO_PENALTIES.descriptionLength,
      ),
    );
  }

  if (h1Count === 0) {
    found.push(issue('h1', 'Aucun titre de niveau 1.', 'error', SEO_PENALTIES.h1));
  } else if (h1Count > 1) {
    found.push(
      issue(
        'h1-multiple',
        `${String(h1Count)} titres de niveau 1 : un seul attendu.`,
        'warning',
        SEO_PENALTIES.h1Multiple,
      ),
    );
  }

  if (skipsHeadingLevel(snapshot)) {
    found.push(
      issue(
        'heading-order',
        'Niveaux de titres sautés (h2 sans h1, h4 après h2…).',
        'warning',
        SEO_PENALTIES.headingOrder,
      ),
    );
  }

  const withoutAlt = snapshot.images.filter(
    (image) => image.alt === null || image.alt.trim() === '',
  ).length;

  if (withoutAlt > 0) {
    found.push(
      issue(
        'image-alt',
        `${String(withoutAlt)} image(s) sans texte alternatif exploitable.`,
        'warning',
        SEO_PENALTIES.imageAlt,
      ),
    );
  }

  if (snapshot.canonical === null || snapshot.canonical.trim() === '') {
    found.push(
      issue(
        'canonical',
        'Aucune URL canonique déclarée (link[rel="canonical"]).',
        'info',
        SEO_PENALTIES.canonical,
      ),
    );
  }

  if (snapshot.robots !== null && /noindex/i.test(snapshot.robots)) {
    found.push(
      issue(
        'noindex',
        'La page demande à ne pas être indexée (meta robots noindex).',
        'warning',
        SEO_PENALTIES.noindex,
      ),
    );
  }

  if (snapshot.language === null || snapshot.language.trim() === '') {
    found.push(
      issue(
        'language',
        'Langue du document non déclarée (html[lang]).',
        'warning',
        SEO_PENALTIES.language,
      ),
    );
  }

  if (snapshot.viewportMeta === null) {
    found.push(
      issue(
        'viewport',
        'Aucune balise viewport : affichage mobile non maîtrisé.',
        'warning',
        SEO_PENALTIES.viewport,
      ),
    );
  }

  if (
    snapshot.openGraph['og:title'] === undefined ||
    snapshot.openGraph['og:description'] === undefined
  ) {
    found.push(
      issue(
        'open-graph',
        'Métadonnées Open Graph incomplètes (og:title ou og:description).',
        'info',
        SEO_PENALTIES.openGraph,
      ),
    );
  }

  if (snapshot.structuredDataBlocks === 0) {
    found.push(
      issue(
        'structured-data',
        'Aucune donnée structurée JSON-LD.',
        'info',
        SEO_PENALTIES.structuredData,
      ),
    );
  }

  found.sort(
    (left, right) => SEVERITY_RANK[left.issue.severity] - SEVERITY_RANK[right.issue.severity],
  );

  return {
    issues: found.map((entry) => entry.issue),
    penalty: found.reduce((total, entry) => total + entry.penalty, 0),
  };
}

/** Détecte un saut de niveau dans la hiérarchie des titres. */
function skipsHeadingLevel(snapshot: PageSnapshot): boolean {
  let previous = 0;

  for (const heading of snapshot.headings) {
    if (previous !== 0 && heading.level > previous + 1) {
      return true;
    }

    previous = heading.level;
  }

  return false;
}

/**
 * Analyse SEO complète d'une page.
 *
 * @param snapshot - Photographie du DOM.
 * @param title - Titre du document.
 */
export function analyseSeo(snapshot: PageSnapshot, title: string): SeoAnalysis {
  const { issues, penalty } = collectSeoIssues(snapshot, title);
  const withoutAlt = snapshot.images.filter(
    (image) => image.alt === null || image.alt.trim() === '',
  ).length;

  return {
    score: Math.max(0, 100 - penalty),
    issues,
    summary: {
      titleLength: title.trim().length,
      descriptionLength: (snapshot.description ?? '').trim().length,
      headingCount: snapshot.headings.length,
      headingLevels: [...new Set(snapshot.headings.map((heading) => heading.level))].sort(
        (a, b) => a - b,
      ),
      linkCount: snapshot.links.length,
      externalLinkCount: snapshot.links.filter((link) => link.external).length,
      imageCount: snapshot.images.length,
      imagesWithoutAlt: withoutAlt,
      structuredDataBlocks: snapshot.structuredDataBlocks,
    },
  };
}
