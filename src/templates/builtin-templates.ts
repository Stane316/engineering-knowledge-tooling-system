import type { AnalysisDimension, Priority, Severity } from '../analysis/types.js';

import type { CreateTemplateInput } from './template.types.js';

/**
 * Templates prédéfinis EKTS (Sprint 17-02) — 10 templates pour les types
 * de projets courants (C17.2).
 *
 * Ces templates sont **immuables** (`is_builtin = 1`, ADR-040) et semés
 * au démarrage par `TemplateService.seedBuiltins()` (idempotent).
 *
 * **Écart P3 (spec vs code)** : la spec §1 annonçait l'insertion «
 * automatiquement lors de la migration 008 » — ici semis **au code** car
 * le prompt impose les ordres 17-01 (migration 007) → 17-02 (builtins),
 * et une migration déjà committée ne se modifie pas ; la migration
 * 007 se limite au schéma.
 *
 * Chaque définition embarque ses **règles de recommandation** (3-5) :
 * elles sont créées dans `recommendation_rules` au seed et liées au
 * template via `recommendation_rule_ids`.
 */

/**
 * Règle de recommandation d'un template builtin.
 *
 * Champs alignés sur `CreateRecommendationRuleInput` (Sprint 16) — le
 * seed les insert tel quel dans `recommendation_rules`.
 */
export interface BuiltinRuleDefinition {
  /** Nom lisible de la règle. */
  name: string;
  /** Description de la règle. */
  description: string;
  /** Dimension analysée. */
  dimension: AnalysisDimension;
  /** Sévérité minimum du finding (0-4). */
  severityThreshold: Severity;
  /** Pattern de finding déclencheur. */
  pattern: string;
  /** Titre de la recommandation générée. */
  recommendationTitle: string;
  /** Description de la recommandation générée. */
  recommendationDescription: string;
  /** Effort estimé (1-5). */
  effort: number;
  /** Impact estimé (1-5). */
  impact: number;
  /** Priorité de la recommandation. */
  priority: Priority;
}

/**
 * Définition complète d'un template builtin : entrée de création + règles.
 */
export interface BuiltinTemplateDefinition {
  /** Données du template (sans `id` ni builtin — imposés par le seed). */
  template: CreateTemplateInput;
  /** Règles de recommandation associées (3-5). */
  rules: BuiltinRuleDefinition[];
}

/**
 * Les 10 templates prédéfinis, couvrant toutes les catégories hors
 * `custom` (C17.2, critère « 10 templates disponibles au démarrage »).
 */
export const BUILTIN_TEMPLATES: BuiltinTemplateDefinition[] = [
  // 1. E-commerce
  {
    template: {
      name: 'E-commerce',
      description:
        "Template optimisé pour les sites e-commerce : performance des listings, SEO produit, expérience d'achat fluide.",
      category: 'e-commerce',
      config: {
        priorityDimensions: ['performance', 'seo', 'ux'],
        alertThresholds: { regressionPoints: 10, minScore: 60 },
        extractionCriteria: { minOccurrences: 2, minAudits: 2, minConfidence: 0.5 },
        recommendationOptions: { maxRecommendations: 10, minRelevanceScore: 0.3 },
        tags: ['commerce', 'vente', 'produits'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Optimiser images produits',
        description: 'Les images produits doivent être optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images non optimisées',
        recommendationTitle: 'Optimiser les images produits',
        recommendationDescription:
          'Convertir en WebP, lazy-loader, utiliser des tailles responsives',
        effort: 2,
        impact: 5,
        priority: 'high',
      },
      {
        name: 'Structured data produit',
        description: 'Les produits doivent avoir des données structurées',
        dimension: 'seo',
        severityThreshold: 2,
        pattern: 'structured data manquant',
        recommendationTitle: 'Ajouter les données structurées produit',
        recommendationDescription: 'Implémenter schema.org/Product avec prix, disponibilité, avis',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Performance du panier',
        description: 'Le panier doit être performant',
        dimension: 'performance',
        severityThreshold: 3,
        pattern: 'panier lent',
        recommendationTitle: 'Optimiser la performance du panier',
        recommendationDescription: 'Minimiser les requêtes, cache local, mise à jour optimiste',
        effort: 3,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'Checkout accessible',
        description: 'Le checkout doit être accessible',
        dimension: 'accessibility',
        severityThreshold: 2,
        pattern: 'checkout inaccessible',
        recommendationTitle: 'Rendre le checkout accessible',
        recommendationDescription: "Labels, navigation clavier, messages d'erreur clairs",
        effort: 4,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'Recherche produit UX',
        description: 'La recherche doit être intuitive',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'recherche peu intuitive',
        recommendationTitle: "Améliorer l'UX de recherche",
        recommendationDescription: 'Autocomplete, filtres visibles, suggestions',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
    ],
  },

  // 2. SaaS / Application web
  {
    template: {
      name: 'SaaS / Application web',
      description:
        'Template pour les applications SaaS : performance du bundle, accessibilité, SEO technique.',
      category: 'saas',
      config: {
        priorityDimensions: ['performance', 'accessibility', 'ux'],
        alertThresholds: { regressionPoints: 8, minScore: 70 },
        extractionCriteria: { minOccurrences: 2, minAudits: 3, minConfidence: 0.6 },
        recommendationOptions: { maxRecommendations: 8, minRelevanceScore: 0.4 },
        tags: ['saas', 'application', 'webapp'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Performance bundle',
        description: 'Le bundle JavaScript doit être optimisé',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'bundle volumineux',
        recommendationTitle: 'Optimiser le bundle JavaScript',
        recommendationDescription: 'Code splitting, tree shaking, lazy loading des routes',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Accessibilité ARIA',
        description: 'Les composants doivent être accessibles',
        dimension: 'accessibility',
        severityThreshold: 2,
        pattern: 'aria manquant',
        recommendationTitle: 'Implémenter les attributs ARIA',
        recommendationDescription: 'Roles, states, properties pour tous les composants interactifs',
        effort: 4,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'SEO technique SPA',
        description: 'Le SEO technique des SPA',
        dimension: 'seo',
        severityThreshold: 2,
        pattern: 'seo spa',
        recommendationTitle: 'Optimiser le SEO technique',
        recommendationDescription: 'SSR/SSG, meta tags dynamiques, sitemap',
        effort: 4,
        impact: 3,
        priority: 'medium',
      },
      {
        name: 'UX feedback utilisateurs',
        description: 'Les actions doivent avoir un feedback',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'pas de feedback',
        recommendationTitle: 'Ajouter le feedback utilisateur',
        recommendationDescription: 'Loading states, toasts, confirmations',
        effort: 2,
        impact: 4,
        priority: 'high',
      },
    ],
  },

  // 3. Blog / CMS
  {
    template: {
      name: 'Blog / CMS',
      description: 'Template pour les blogs et CMS : SEO contenu, performance médias, lisibilité.',
      category: 'blog',
      config: {
        priorityDimensions: ['seo', 'content', 'performance'],
        alertThresholds: { regressionPoints: 10, minScore: 50 },
        tags: ['blog', 'cms', 'contenu'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Meta descriptions articles',
        description: 'Chaque article doit avoir une meta description',
        dimension: 'seo',
        severityThreshold: 1,
        pattern: 'meta description manquante',
        recommendationTitle: 'Ajouter les meta descriptions',
        recommendationDescription:
          'Meta description unique et pertinente (150-160 caractères) pour chaque article',
        effort: 1,
        impact: 3,
        priority: 'medium',
      },
      {
        name: 'Contenu structuré',
        description: 'Le contenu doit être bien structuré',
        dimension: 'content',
        severityThreshold: 2,
        pattern: 'contenu non structuré',
        recommendationTitle: 'Structurer le contenu',
        recommendationDescription: 'Hiérarchie H1-H6, paragraphes courts, listes à puces',
        effort: 2,
        impact: 3,
        priority: 'medium',
      },
      {
        name: 'Images articles optimisées',
        description: 'Les images des articles doivent être optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images lourdes',
        recommendationTitle: 'Optimiser les images des articles',
        recommendationDescription: 'WebP, lazy loading, tailles responsives, alt descriptifs',
        effort: 2,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Temps de lecture',
        description: 'Indiquer le temps de lecture',
        dimension: 'ux',
        severityThreshold: 1,
        pattern: 'temps de lecture',
        recommendationTitle: 'Afficher le temps de lecture',
        recommendationDescription:
          "Estimation basée sur le nombre de mots, affichée en haut de l'article",
        effort: 1,
        impact: 2,
        priority: 'low',
      },
    ],
  },

  // 4. Portfolio
  {
    template: {
      name: 'Portfolio',
      description:
        'Template pour les portfolios : design responsive, performance images, contenu concis.',
      category: 'portfolio',
      config: {
        priorityDimensions: ['ux', 'performance', 'content'],
        tags: ['portfolio', 'design', 'visuel'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Design responsive',
        description: 'Le portfolio doit être responsive',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'non responsive',
        recommendationTitle: 'Améliorer le responsive design',
        recommendationDescription:
          'Test sur mobile/tablette, breakpoints adaptés, navigation mobile',
        effort: 3,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'Performance images portfolio',
        description: 'Les images du portfolio doivent être performantes',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'images portfolio lourdes',
        recommendationTitle: 'Optimiser les images du portfolio',
        recommendationDescription:
          'Galerie lazy-loaded, formats modernes, préchargement intelligent',
        effort: 2,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Contenu concis',
        description: 'Le contenu doit être concis et impactant',
        dimension: 'content',
        severityThreshold: 1,
        pattern: 'contenu trop long',
        recommendationTitle: 'Rendre le contenu plus concis',
        recommendationDescription:
          'Descriptions courtes, visuels impactants, call-to-action clairs',
        effort: 2,
        impact: 3,
        priority: 'medium',
      },
    ],
  },

  // 5. Site corporate
  {
    template: {
      name: 'Site corporate',
      description:
        "Template pour les sites d'entreprise : accessibilité WCAG, SEO on-page, navigation claire.",
      category: 'corporate',
      config: {
        priorityDimensions: ['accessibility', 'seo', 'ux'],
        alertThresholds: { regressionPoints: 5, minScore: 75 },
        tags: ['entreprise', 'corporate', 'institutionnel'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Accessibilité WCAG AA',
        description: 'Le site doit respecter WCAG 2.1 AA',
        dimension: 'accessibility',
        severityThreshold: 2,
        pattern: 'wcag non respecté',
        recommendationTitle: 'Atteindre la conformité WCAG AA',
        recommendationDescription:
          "Contrastes, navigation clavier, lecteurs d'écran, formulaires accessibles",
        effort: 5,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'SEO on-page corporate',
        description: 'Le SEO on-page doit être optimisé',
        dimension: 'seo',
        severityThreshold: 2,
        pattern: 'seo on-page',
        recommendationTitle: 'Optimiser le SEO on-page',
        recommendationDescription: 'Titres, meta descriptions, structure Hn, maillage interne',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Navigation claire',
        description: 'La navigation doit être intuitive',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'navigation confuse',
        recommendationTitle: 'Clarifier la navigation',
        recommendationDescription: "Menu hiérarchique, fil d'Ariane, recherche, plan du site",
        effort: 3,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Mentions légales accessibles',
        description: 'Les mentions légales doivent être accessibles',
        dimension: 'content',
        severityThreshold: 1,
        pattern: 'mentions légales',
        recommendationTitle: 'Rendre les mentions légales accessibles',
        recommendationDescription: 'Page dédiée, lien en footer, langage clair',
        effort: 1,
        impact: 2,
        priority: 'low',
      },
    ],
  },

  // 6. Landing page
  {
    template: {
      name: 'Landing page',
      description:
        'Template pour les landing pages : performance critique, UX conversion, SEO local.',
      category: 'landing',
      config: {
        priorityDimensions: ['performance', 'seo', 'ux'],
        alertThresholds: { regressionPoints: 15, minScore: 80 },
        tags: ['landing', 'conversion', 'marketing'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Performance above-the-fold',
        description: 'Le contenu visible doit charger instantanément',
        dimension: 'performance',
        severityThreshold: 3,
        pattern: 'above the fold lent',
        recommendationTitle: 'Optimiser le above-the-fold',
        recommendationDescription: 'Critical CSS inline, preconnect, images optimisées, minimal JS',
        effort: 3,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'CTA visibles',
        description: 'Les call-to-action doivent être visibles',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'cta invisibles',
        recommendationTitle: 'Améliorer la visibilité des CTA',
        recommendationDescription: 'Contraste élevé, taille adaptée, position stratégique',
        effort: 2,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'SEO local',
        description: 'Le SEO local doit être optimisé',
        dimension: 'seo',
        severityThreshold: 2,
        pattern: 'seo local',
        recommendationTitle: 'Optimiser le SEO local',
        recommendationDescription: 'Schema.org LocalBusiness, NAP cohérent, Google My Business',
        effort: 2,
        impact: 4,
        priority: 'high',
      },
    ],
  },

  // 7. Documentation
  {
    template: {
      name: 'Documentation',
      description:
        'Template pour les sites de documentation : accessibilité lecture, contenu structuré, recherche.',
      category: 'documentation',
      config: {
        priorityDimensions: ['accessibility', 'content', 'seo'],
        tags: ['documentation', 'docs', 'technique'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Accessibilité lecture',
        description: 'Le contenu doit être lisible',
        dimension: 'accessibility',
        severityThreshold: 2,
        pattern: 'lisibilité',
        recommendationTitle: 'Améliorer la lisibilité',
        recommendationDescription: 'Police lisible, contrastes, espacement, largeur de colonne',
        effort: 2,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Recherche documentation',
        description: 'La recherche doit être efficace',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'recherche docs',
        recommendationTitle: 'Améliorer la recherche',
        recommendationDescription: 'Recherche full-text, filtres, highlights, suggestions',
        effort: 4,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Navigation documentation',
        description: 'La navigation doit être claire',
        dimension: 'content',
        severityThreshold: 2,
        pattern: 'navigation docs',
        recommendationTitle: 'Structurer la navigation',
        recommendationDescription: 'Sidebar hiérarchique, table des matières, breadcrumbs',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
    ],
  },

  // 8. Marketplace
  {
    template: {
      name: 'Marketplace',
      description: 'Template pour les marketplaces : performance listings, sécurité, UX recherche.',
      category: 'marketplace',
      config: {
        priorityDimensions: ['performance', 'seo', 'ux'],
        alertThresholds: { regressionPoints: 8, minScore: 65 },
        tags: ['marketplace', 'multi-vendeur', 'catalogue'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Performance listings',
        description: 'Les listings doivent charger rapidement',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'listings lents',
        recommendationTitle: 'Optimiser les listings',
        recommendationDescription: 'Pagination, virtual scrolling, cache, images lazy-loaded',
        effort: 3,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'Sécurité inputs',
        description: 'Les formulaires doivent être sécurisés',
        dimension: 'ux',
        severityThreshold: 3,
        pattern: 'inputs non sécurisés',
        recommendationTitle: 'Sécuriser les formulaires',
        recommendationDescription: 'Validation côté client et serveur, CSRF, rate limiting',
        effort: 4,
        impact: 5,
        priority: 'critical',
      },
      {
        name: 'UX recherche marketplace',
        description: 'La recherche doit être intuitive',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'recherche marketplace',
        recommendationTitle: 'Améliorer la recherche',
        recommendationDescription: 'Filtres avancés, tri, suggestions, recherche vocale',
        effort: 4,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'SEO fiches produits',
        description: 'Les fiches produits doivent être optimisées',
        dimension: 'seo',
        severityThreshold: 2,
        pattern: 'fiches produits seo',
        recommendationTitle: 'Optimiser les fiches produits',
        recommendationDescription: 'Structured data, meta uniques, descriptions riches',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
    ],
  },

  // 9. Site d'actualités
  {
    template: {
      name: "Site d'actualités",
      description:
        "Template pour les sites d'actualités : performance médias, SEO news, contenu structuré.",
      category: 'news',
      config: {
        priorityDimensions: ['performance', 'seo', 'content'],
        tags: ['actualités', 'news', 'média'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Performance vidéos',
        description: 'Les vidéos doivent être optimisées',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'vidéos lourdes',
        recommendationTitle: 'Optimiser les vidéos',
        recommendationDescription: 'Lazy loading, formats adaptés, preload intelligent',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'SEO News',
        description: 'Le SEO doit être optimisé pour Google News',
        dimension: 'seo',
        severityThreshold: 2,
        pattern: 'seo news',
        recommendationTitle: 'Optimiser pour Google News',
        recommendationDescription: 'Schema.org NewsArticle, sitemap news, amp pages',
        effort: 4,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Contenu structuré news',
        description: 'Les articles doivent être bien structurés',
        dimension: 'content',
        severityThreshold: 1,
        pattern: 'articles non structurés',
        recommendationTitle: 'Structurer les articles',
        recommendationDescription: 'Chapeau, intertitres, citations, liens internes',
        effort: 2,
        impact: 3,
        priority: 'medium',
      },
    ],
  },

  // 10. Site d'agence
  {
    template: {
      name: "Site d'agence",
      description:
        "Template pour les sites d'agence : design impactant, performance portfolio, contenu engageant.",
      category: 'agency',
      config: {
        priorityDimensions: ['ux', 'performance', 'content'],
        tags: ['agence', 'créatif', 'design'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      {
        name: 'Design impactant',
        description: 'Le design doit marquer les esprits',
        dimension: 'ux',
        severityThreshold: 2,
        pattern: 'design banal',
        recommendationTitle: 'Créer un design impactant',
        recommendationDescription: 'Animations subtiles, typographie soignée, espaces blancs',
        effort: 4,
        impact: 5,
        priority: 'high',
      },
      {
        name: 'Performance portfolio agence',
        description: 'Le portfolio doit être performant',
        dimension: 'performance',
        severityThreshold: 2,
        pattern: 'portfolio lent',
        recommendationTitle: 'Optimiser le portfolio',
        recommendationDescription: 'Galerie optimisée, transitions fluides, chargement progressif',
        effort: 3,
        impact: 4,
        priority: 'high',
      },
      {
        name: 'Contenu engageant',
        description: 'Le contenu doit engager',
        dimension: 'content',
        severityThreshold: 1,
        pattern: 'contenu ennuyeux',
        recommendationTitle: 'Rendre le contenu engageant',
        recommendationDescription: "Storytelling, témoignages, cas d'étude, ton authentique",
        effort: 3,
        impact: 4,
        priority: 'medium',
      },
    ],
  },
];
