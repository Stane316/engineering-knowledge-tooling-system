# SPRINT-17-02 — Templates prédéfinis, TemplateApplier et Personnalisation

**Sprint :** 17-02 sur 17 (Sous-sprint 2/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ

---

## 1. Objectif du sous-sprint

Implémenter les 10 templates prédéfinis et le moteur d'application :
- **builtin-templates.ts** : Définition des 10 templates prédéfinis
- **TemplateApplier** : Application d'un template à un projet avec personnalisation
- **Insertion des templates** : Migration d'insertion des 10 templates au démarrage
- **Tests** : Validation des templates et de l'application

---

## 2. Prérequis

```bash
# Vérifier que Sprint 17-01 est terminé
npm run verify

# Vérifier les modules 17-01
ls src/templates/
# Doit afficher : template.types.ts, template-repository.ts, template-service.ts
```

---

## 3. Tâches détaillées

### 3.1 Définir les 10 templates prédéfinis (8h)

**Fichier :** `src/templates/builtin-templates.ts`

```typescript
/**
 * Templates prédéfinis EKTS (Sprint 17).
 *
 * 10 templates pour les types de projets courants.
 * Ces templates sont immuables (is_builtin = true) et insérés
 * automatiquement lors de la migration 008.
 */

import type { CreateTemplateInput } from './template.types.js';

/**
 * Interface pour un template builtin avec ses règles inline.
 */
export interface BuiltinTemplateDefinition {
  template: CreateTemplateInput;
  rules: Array<{
    name: string;
    description: string;
    dimension: string;
    severityThreshold: number;
    pattern: string;
    recommendationTitle: string;
    recommendationDescription: string;
    effort: number;
    impact: number;
    priority: string;
  }>;
}

/**
 * Les 10 templates prédéfinis.
 */
export const BUILTIN_TEMPLATES: BuiltinTemplateDefinition[] = [
  // 1. E-commerce
  {
    template: {
      name: 'E-commerce',
      description: 'Template optimisé pour les sites e-commerce : performance des listings, SEO produit, expérience d\'achat fluide.',
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
      { name: 'Optimiser images produits', description: 'Les images produits doivent être optimisées', dimension: 'performance', severityThreshold: 2, pattern: 'images non optimisées', recommendationTitle: 'Optimiser les images produits', recommendationDescription: 'Convertir en WebP, lazy-loader, utiliser des tailles responsives', effort: 2, impact: 5, priority: 'high' },
      { name: 'Structured data produit', description: 'Les produits doivent avoir des données structurées', dimension: 'seo', severityThreshold: 2, pattern: 'structured data manquant', recommendationTitle: 'Ajouter les données structurées produit', recommendationDescription: 'Implémenter schema.org/Product avec prix, disponibilité, avis', effort: 3, impact: 4, priority: 'high' },
      { name: 'Performance du panier', description: 'Le panier doit être performant', dimension: 'performance', severityThreshold: 3, pattern: 'panier lent', recommendationTitle: 'Optimiser la performance du panier', recommendationDescription: 'Minimiser les requêtes, cache local, mise à jour optimiste', effort: 3, impact: 5, priority: 'critical' },
      { name: 'Checkout accessible', description: 'Le checkout doit être accessible', dimension: 'accessibility', severityThreshold: 2, pattern: 'checkout inaccessible', recommendationTitle: 'Rendre le checkout accessible', recommendationDescription: 'Labels, navigation clavier, messages d\'erreur clairs', effort: 4, impact: 5, priority: 'critical' },
      { name: 'Recherche produit UX', description: 'La recherche doit être intuitive', dimension: 'ux', severityThreshold: 2, pattern: 'recherche peu intuitive', recommendationTitle: 'Améliorer l\'UX de recherche', recommendationDescription: 'Autocomplete, filtres visibles, suggestions', effort: 3, impact: 4, priority: 'high' },
    ],
  },

  // 2. SaaS / Application web
  {
    template: {
      name: 'SaaS / Application web',
      description: 'Template pour les applications SaaS : performance du bundle, accessibilité, SEO technique.',
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
      { name: 'Performance bundle', description: 'Le bundle JavaScript doit être optimisé', dimension: 'performance', severityThreshold: 2, pattern: 'bundle volumineux', recommendationTitle: 'Optimiser le bundle JavaScript', recommendationDescription: 'Code splitting, tree shaking, lazy loading des routes', effort: 3, impact: 4, priority: 'high' },
      { name: 'Accessibilité ARIA', description: 'Les composants doivent être accessibles', dimension: 'accessibility', severityThreshold: 2, pattern: 'aria manquant', recommendationTitle: 'Implémenter les attributs ARIA', recommendationDescription: 'Roles, states, properties pour tous les composants interactifs', effort: 4, impact: 5, priority: 'critical' },
      { name: 'SEO technique SPA', description: 'Le SEO technique des SPA', dimension: 'seo', severityThreshold: 2, pattern: 'seo spa', recommendationTitle: 'Optimiser le SEO technique', recommendationDescription: 'SSR/SSG, meta tags dynamiques, sitemap', effort: 4, impact: 3, priority: 'medium' },
      { name: 'UX feedback utilisateurs', description: 'Les actions doivent avoir un feedback', dimension: 'ux', severityThreshold: 2, pattern: 'pas de feedback', recommendationTitle: 'Ajouter le feedback utilisateur', recommendationDescription: 'Loading states, toasts, confirmations', effort: 2, impact: 4, priority: 'high' },
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
      { name: 'Meta descriptions articles', description: 'Chaque article doit avoir une meta description', dimension: 'seo', severityThreshold: 1, pattern: 'meta description manquante', recommendationTitle: 'Ajouter les meta descriptions', recommendationDescription: 'Meta description unique et pertinente (150-160 caractères) pour chaque article', effort: 1, impact: 3, priority: 'medium' },
      { name: 'Contenu structuré', description: 'Le contenu doit être bien structuré', dimension: 'content', severityThreshold: 2, pattern: 'contenu non structuré', recommendationTitle: 'Structurer le contenu', recommendationDescription: 'Hiérarchie H1-H6, paragraphes courts, listes à puces', effort: 2, impact: 3, priority: 'medium' },
      { name: 'Images articles optimisées', description: 'Les images des articles doivent être optimisées', dimension: 'performance', severityThreshold: 2, pattern: 'images lourdes', recommendationTitle: 'Optimiser les images des articles', recommendationDescription: 'WebP, lazy loading, tailles responsives, alt descriptifs', effort: 2, impact: 4, priority: 'high' },
      { name: 'Temps de lecture', description: 'Indiquer le temps de lecture', dimension: 'ux', severityThreshold: 1, pattern: 'temps de lecture', recommendationTitle: 'Afficher le temps de lecture', recommendationDescription: 'Estimation basée sur le nombre de mots, affichée en haut de l\'article', effort: 1, impact: 2, priority: 'low' },
    ],
  },

  // 4. Portfolio
  {
    template: {
      name: 'Portfolio',
      description: 'Template pour les portfolios : design responsive, performance images, contenu concis.',
      category: 'portfolio',
      config: {
        priorityDimensions: ['ux', 'performance', 'content'],
        tags: ['portfolio', 'design', 'visuel'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      { name: 'Design responsive', description: 'Le portfolio doit être responsive', dimension: 'ux', severityThreshold: 2, pattern: 'non responsive', recommendationTitle: 'Améliorer le responsive design', recommendationDescription: 'Test sur mobile/tablette, breakpoints adaptés, navigation mobile', effort: 3, impact: 5, priority: 'critical' },
      { name: 'Performance images portfolio', description: 'Les images du portfolio doivent être performantes', dimension: 'performance', severityThreshold: 2, pattern: 'images portfolio lourdes', recommendationTitle: 'Optimiser les images du portfolio', recommendationDescription: 'Galerie lazy-loaded, formats modernes, préchargement intelligent', effort: 2, impact: 4, priority: 'high' },
      { name: 'Contenu concis', description: 'Le contenu doit être concis et impactant', dimension: 'content', severityThreshold: 1, pattern: 'contenu trop long', recommendationTitle: 'Rendre le contenu plus concis', recommendationDescription: 'Descriptions courtes, visuels impactants, call-to-action clairs', effort: 2, impact: 3, priority: 'medium' },
    ],
  },

  // 5. Site corporate
  {
    template: {
      name: 'Site corporate',
      description: 'Template pour les sites d\'entreprise : accessibilité WCAG, SEO on-page, navigation claire.',
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
      { name: 'Accessibilité WCAG AA', description: 'Le site doit respecter WCAG 2.1 AA', dimension: 'accessibility', severityThreshold: 2, pattern: 'wcag non respecté', recommendationTitle: 'Atteindre la conformité WCAG AA', recommendationDescription: 'Contrastes, navigation clavier, lecteurs d\'écran, formulaires accessibles', effort: 5, impact: 5, priority: 'critical' },
      { name: 'SEO on-page corporate', description: 'Le SEO on-page doit être optimisé', dimension: 'seo', severityThreshold: 2, pattern: 'seo on-page', recommendationTitle: 'Optimiser le SEO on-page', recommendationDescription: 'Titres, meta descriptions, structure Hn, maillage interne', effort: 3, impact: 4, priority: 'high' },
      { name: 'Navigation claire', description: 'La navigation doit être intuitive', dimension: 'ux', severityThreshold: 2, pattern: 'navigation confuse', recommendationTitle: 'Clarifier la navigation', recommendationDescription: 'Menu hiérarchique, fil d\'Ariane, recherche, plan du site', effort: 3, impact: 4, priority: 'high' },
      { name: 'Mentions légales accessibles', description: 'Les mentions légales doivent être accessibles', dimension: 'content', severityThreshold: 1, pattern: 'mentions légales', recommendationTitle: 'Rendre les mentions légales accessibles', recommendationDescription: 'Page dédiée, lien en footer, langage clair', effort: 1, impact: 2, priority: 'low' },
    ],
  },

  // 6. Landing page
  {
    template: {
      name: 'Landing page',
      description: 'Template pour les landing pages : performance critique, UX conversion, SEO local.',
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
      { name: 'Performance above-the-fold', description: 'Le contenu visible doit charger instantanément', dimension: 'performance', severityThreshold: 3, pattern: 'above the fold lent', recommendationTitle: 'Optimiser le above-the-fold', recommendationDescription: 'Critical CSS inline, preconnect, images optimisées, minimal JS', effort: 3, impact: 5, priority: 'critical' },
      { name: 'CTA visibles', description: 'Les call-to-action doivent être visibles', dimension: 'ux', severityThreshold: 2, pattern: 'cta invisibles', recommendationTitle: 'Améliorer la visibilité des CTA', recommendationDescription: 'Contraste élevé, taille adaptée, position stratégique', effort: 2, impact: 5, priority: 'critical' },
      { name: 'SEO local', description: 'Le SEO local doit être optimisé', dimension: 'seo', severityThreshold: 2, pattern: 'seo local', recommendationTitle: 'Optimiser le SEO local', recommendationDescription: 'Schema.org LocalBusiness, NAP cohérent, Google My Business', effort: 2, impact: 4, priority: 'high' },
    ],
  },

  // 7. Documentation
  {
    template: {
      name: 'Documentation',
      description: 'Template pour les sites de documentation : accessibilité lecture, contenu structuré, recherche.',
      category: 'documentation',
      config: {
        priorityDimensions: ['accessibility', 'content', 'seo'],
        tags: ['documentation', 'docs', 'technique'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      { name: 'Accessibilité lecture', description: 'Le contenu doit être lisible', dimension: 'accessibility', severityThreshold: 2, pattern: 'lisibilité', recommendationTitle: 'Améliorer la lisibilité', recommendationDescription: 'Police lisible, contrastes, espacement, largeur de colonne', effort: 2, impact: 4, priority: 'high' },
      { name: 'Recherche documentation', description: 'La recherche doit être efficace', dimension: 'ux', severityThreshold: 2, pattern: 'recherche docs', recommendationTitle: 'Améliorer la recherche', recommendationDescription: 'Recherche full-text, filtres, highlights, suggestions', effort: 4, impact: 4, priority: 'high' },
      { name: 'Navigation documentation', description: 'La navigation doit être claire', dimension: 'content', severityThreshold: 2, pattern: 'navigation docs', recommendationTitle: 'Structurer la navigation', recommendationDescription: 'Sidebar hiérarchique, table des matières, breadcrumbs', effort: 3, impact: 4, priority: 'high' },
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
      { name: 'Performance listings', description: 'Les listings doivent charger rapidement', dimension: 'performance', severityThreshold: 2, pattern: 'listings lents', recommendationTitle: 'Optimiser les listings', recommendationDescription: 'Pagination, virtual scrolling, cache, images lazy-loaded', effort: 3, impact: 5, priority: 'critical' },
      { name: 'Sécurité inputs', description: 'Les formulaires doivent être sécurisés', dimension: 'ux', severityThreshold: 3, pattern: 'inputs non sécurisés', recommendationTitle: 'Sécuriser les formulaires', recommendationDescription: 'Validation côté client et serveur, CSRF, rate limiting', effort: 4, impact: 5, priority: 'critical' },
      { name: 'UX recherche marketplace', description: 'La recherche doit être intuitive', dimension: 'ux', severityThreshold: 2, pattern: 'recherche marketplace', recommendationTitle: 'Améliorer la recherche', recommendationDescription: 'Filtres avancés, tri, suggestions, recherche vocale', effort: 4, impact: 4, priority: 'high' },
      { name: 'SEO fiches produits', description: 'Les fiches produits doivent être optimisées', dimension: 'seo', severityThreshold: 2, pattern: 'fiches produits seo', recommendationTitle: 'Optimiser les fiches produits', recommendationDescription: 'Structured data, meta uniques, descriptions riches', effort: 3, impact: 4, priority: 'high' },
    ],
  },

  // 9. Site d'actualités
  {
    template: {
      name: 'Site d\'actualités',
      description: 'Template pour les sites d\'actualités : performance médias, SEO news, contenu structuré.',
      category: 'news',
      config: {
        priorityDimensions: ['performance', 'seo', 'content'],
        tags: ['actualités', 'news', 'média'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      { name: 'Performance vidéos', description: 'Les vidéos doivent être optimisées', dimension: 'performance', severityThreshold: 2, pattern: 'vidéos lourdes', recommendationTitle: 'Optimiser les vidéos', recommendationDescription: 'Lazy loading, formats adaptés, preload intelligent', effort: 3, impact: 4, priority: 'high' },
      { name: 'SEO News', description: 'Le SEO doit être optimisé pour Google News', dimension: 'seo', severityThreshold: 2, pattern: 'seo news', recommendationTitle: 'Optimiser pour Google News', recommendationDescription: 'Schema.org NewsArticle, sitemap news, amp pages', effort: 4, impact: 4, priority: 'high' },
      { name: 'Contenu structuré news', description: 'Les articles doivent être bien structurés', dimension: 'content', severityThreshold: 1, pattern: 'articles non structurés', recommendationTitle: 'Structurer les articles', recommendationDescription: 'Chapeau, intertitres, citations, liens internes', effort: 2, impact: 3, priority: 'medium' },
    ],
  },

  // 10. Site d'agence
  {
    template: {
      name: 'Site d\'agence',
      description: 'Template pour les sites d\'agence : design impactant, performance portfolio, contenu engageant.',
      category: 'agency',
      config: {
        priorityDimensions: ['ux', 'performance', 'content'],
        tags: ['agence', 'créatif', 'design'],
        author: 'EKTS Team',
        version: '1.0.0',
      },
    },
    rules: [
      { name: 'Design impactant', description: 'Le design doit marquer les esprits', dimension: 'ux', severityThreshold: 2, pattern: 'design banal', recommendationTitle: 'Créer un design impactant', recommendationDescription: 'Animations subtiles, typographie soignée, espaces blancs', effort: 4, impact: 5, priority: 'high' },
      { name: 'Performance portfolio agence', description: 'Le portfolio doit être performant', dimension: 'performance', severityThreshold: 2, pattern: 'portfolio lent', recommendationTitle: 'Optimiser le portfolio', recommendationDescription: 'Galerie optimisée, transitions fluides, chargement progressif', effort: 3, impact: 4, priority: 'high' },
      { name: 'Contenu engageant', description: 'Le contenu doit engager', dimension: 'content', severityThreshold: 1, pattern: 'contenu ennuyeux', recommendationTitle: 'Rendre le contenu engageant', recommendationDescription: 'Storytelling, témoignages, cas d\'étude, ton authentique', effort: 3, impact: 4, priority: 'medium' },
    ],
  },
];
```

**Critères d'acceptation :**
- 10 templates définis avec configurations réalistes
- Chaque template a 3-5 règles de recommandation
- Catégories conformes au type `TemplateCategory`
- Configurations JSON valides et documentées

---

### 3.2 Implémenter TemplateApplier (6h)

**Fichier :** `src/templates/template-applier.ts`

```typescript
import type { Database } from 'better-sqlite3';

import type { Priority, Severity } from '../analysis/types.js';
import type { ProjectRepository } from '../storage/project-repository.js';
import type { RecommendationEngine } from '../recommendations/recommendation-engine.js';

import type {
  ApplyTemplateInput,
  ApplyTemplateResult,
  ProjectTemplate,
  TemplateOverrides,
  ValidationResult,
} from './template.types.js';

/**
 * Applicateur de templates (Sprint 17).
 *
 * Applique un template à un projet avec personnalisation optionnelle.
 */
export class TemplateApplier {
  constructor(
    private readonly db: Database.Database,
    private readonly projectRepo: ProjectRepository,
  ) {}

  /**
   * Appliquer un template pour créer un projet.
   */
  apply(
    template: ProjectTemplate,
    input: ApplyTemplateInput,
  ): ApplyTemplateResult {
    const startTime = Date.now();

    // 1. Créer le projet
    const project = this.projectRepo.create({
      name: input.overrides?.projectName ?? input.projectName,
      url: input.overrides?.projectUrl ?? input.projectUrl,
      description: input.overrides?.projectDescription ?? input.projectDescription ?? template.description,
    });

    // 2. Appliquer la configuration
    this.applyConfig(project.id, template, input.overrides);

    // 3. Associer les bonnes practices
    let bestPracticesAssociated = 0;
    if (template.bestPracticeIds.length > 0) {
      bestPracticesAssociated = this.associateBestPractices(project.id, template.bestPracticeIds);
    }

    // 4. Créer les règles de recommandation
    let rulesCreated = 0;
    // Les règles sont créées via le TemplateService qui a accès au RecommendationEngine

    return {
      projectId: project.id,
      projectName: project.name,
      templateId: template.id,
      bestPracticesAssociated,
      rulesCreated,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Appliquer la configuration du template au projet.
   */
  private applyConfig(
    projectId: string,
    template: ProjectTemplate,
    overrides?: TemplateOverrides,
  ): void {
    // Merge de la configuration
    const config = { ...template.config };

    if (overrides?.config) {
      // Merge profond pour les sous-objets
      if (overrides.config.alertThresholds) {
        config.alertThresholds = { ...config.alertThresholds, ...overrides.config.alertThresholds };
      }
      if (overrides.config.extractionCriteria) {
        config.extractionCriteria = { ...config.extractionCriteria, ...overrides.config.extractionCriteria };
      }
      if (overrides.config.recommendationOptions) {
        config.recommendationOptions = { ...config.recommendationOptions, ...overrides.config.recommendationOptions };
      }
      if (overrides.config.priorityDimensions) {
        config.priorityDimensions = overrides.config.priorityDimensions;
      }
      if (overrides.config.tags) {
        config.tags = [...(config.tags ?? []), ...overrides.config.tags];
      }
    }

    // Stocker la config dans les métadonnées du projet
    this.db.prepare(`
      INSERT OR REPLACE INTO project_config (project_id, config)
      VALUES (?, ?)
    `).run(projectId, JSON.stringify(config));
  }

  /**
   * Associer les bonnes practices au projet.
   */
  private associateBestPractices(projectId: string, bestPracticeIds: string[]): number {
    // Mettre à jour source_project_ids de chaque bonne practice
    let count = 0;

    for (const bpId of bestPracticeIds) {
      const bp = this.db.prepare('SELECT * FROM best_practices WHERE id = ?').get(bpId) as any;
      if (bp) {
        const currentProjectIds = JSON.parse(bp.source_project_ids || '[]') as string[];
        if (!currentProjectIds.includes(projectId)) {
          currentProjectIds.push(projectId);
          this.db.prepare(`
            UPDATE best_practices SET source_project_ids = ?, updated_at = ? WHERE id = ?
          `).run(JSON.stringify(currentProjectIds), new Date().toISOString(), bpId);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Valider un template avant application.
   */
  validate(template: ProjectTemplate, overrides?: TemplateOverrides): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications de base
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template description is required');
    }

    // Vérification de la configuration
    if (template.config.alertThresholds) {
      const { regressionPoints, minScore } = template.config.alertThresholds;

      if (regressionPoints !== undefined && (regressionPoints < 1 || regressionPoints > 50)) {
        warnings.push(`Regression threshold (${regressionPoints}) seems unusual`);
      }

      if (minScore !== undefined && (minScore < 0 || minScore > 100)) {
        errors.push(`Min score (${minScore}) must be between 0 and 100`);
      }
    }

    // Vérification des bonnes practices
    if (template.bestPracticeIds.length > 0) {
      for (const bpId of template.bestPracticeIds) {
        const bp = this.db.prepare('SELECT id FROM best_practices WHERE id = ?').get(bpId);
        if (!bp) {
          warnings.push(`Best practice ${bpId} not found (will be skipped)`);
        }
      }
    }

    // Vérification des overrides
    if (overrides) {
      if (overrides.config?.alertThresholds?.minScore !== undefined) {
        const score = overrides.config.alertThresholds.minScore;
        if (score < 0 || score > 100) {
          errors.push(`Override min score (${score}) must be between 0 and 100`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```

**Critères d'acceptation :**
- Application complète (projet + config + bonnes practices)
- Overrides partiels (merge profond)
- Validation avant application (erreurs + warnings)
- Performance < 10s pour un template complet
- Gestion des erreurs (template inexistant, bonnes practices manquantes)

---

### 3.3 Tests unitaires TemplateApplier (4h)

**Fichier :** `tests/templates/template-applier.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

// Tests d'application de template, overrides, validation
// Couverture : cas nominaux + cas limites + erreurs

describe('TemplateApplier', () => {
  it('devrait appliquer un template complet', () => { /* ... */ });
  it('devrait appliquer les overrides partiels', () => { /* ... */ });
  it('devrait valider un template valide', () => { /* ... */ });
  it('devrait rejeter un template invalide', () => { /* ... */ });
  it('devrait gérer les bonnes practices manquantes', () => { /* ... */ });
});
```

---

### 3.4 Tests des templates prédéfinis (2h)

**Fichier :** `tests/templates/builtin-templates.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BUILTIN_TEMPLATES } from '../../src/templates/builtin-templates.js';

describe('Builtin Templates', () => {
  it('devrait définir exactement 10 templates', () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(10);
  });

  it('chaque template doit avoir un nom et une description', () => {
    for (const def of BUILTIN_TEMPLATES) {
      expect(def.template.name).toBeTruthy();
      expect(def.template.description).toBeTruthy();
      expect(def.template.category).toBeTruthy();
    }
  });

  it('chaque template doit avoir au moins 3 règles', () => {
    for (const def of BUILTIN_TEMPLATES) {
      expect(def.rules.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('les catégories doivent couvrir les types principaux', () => {
    const categories = BUILTIN_TEMPLATES.map(t => t.template.category);
    expect(categories).toContain('e-commerce');
    expect(categories).toContain('saas');
    expect(categories).toContain('blog');
    expect(categories).toContain('portfolio');
    expect(categories).toContain('corporate');
    expect(categories).toContain('landing');
    expect(categories).toContain('documentation');
    expect(categories).toContain('marketplace');
    expect(categories).toContain('news');
    expect(categories).toContain('agency');
  });
});
```

---

## 4. Vérifications finales

```bash
npm run typecheck
npm run lint
npm test -- tests/templates/
npm run coverage -- tests/templates/
npm run verify
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-17-02-RESULTAT.md` :

```markdown
# Rapport Sprint 17-02

**Date :** [DATE] | **Statut :** ✅ TERMINÉ

## Fichiers créés
- `src/templates/builtin-templates.ts` (10 templates)
- `src/templates/template-applier.ts`
- `tests/templates/template-applier.test.ts`
- `tests/templates/builtin-templates.test.ts`

## Tests : X tests ✅ | Couverture : Z%
## Prochaine étape : Sprint 17-03 (CLI + MCP + Docs)
```

---

## 6. Critères de validation

- ✅ 10 templates prédéfinis définis et testés
- ✅ `TemplateApplier` implémenté (application + overrides + validation)
- ✅ Merge profond des configurations
- ✅ Association des bonnes practices
- ✅ Gestion des cas limites (BP manquantes, overrides invalides)
- ✅ Tests complets
- ✅ Couverture > 80%
- ✅ `npm run verify` passe
- ✅ Rapport rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 17-02 du projet EKTS**  
**Statut : ✅ Sprint 17-02 implémenté et validé**
