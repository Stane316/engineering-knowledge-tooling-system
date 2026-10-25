# SPRINT-17 — Templates Projets

**Sprint :** 17 sur 18  
**MVP :** MVP-3 (Capitalisation de Projets)  
**Durée estimée :** 2 semaines (9 jours ouvrables)  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Contexte et objectifs

### 1.1 Contexte

Les Sprints 13 à 16 ont mis en place la gestion multi-projets, le suivi temporel, la capitalisation des connaissances et les recommandations contextuelles. EKTS dispose maintenant d'un écosystème complet pour gérer et améliorer la qualité web.

Le problème : créer un nouveau projet dans EKTS requiert de configurer manuellement tous les paramètres (dimensions prioritaires, seuils d'alerte, bonnes practices à suivre, règles de recommandation). Pour les équipes gérant plusieurs projets similaires (ex: plusieurs sites e-commerce), cette configuration est répétitive et source d'erreurs.

Le Sprint 17 résout ce problème avec des **templates de projets** : des configurations prédéfinies et personnalisables qui permettent d'initialiser rapidement un projet avec les bonnes practices, règles et paramètres adaptés à son type (e-commerce, SaaS, blog, portfolio, etc.).

### 1.2 Objectifs du Sprint 17

Le Sprint 17 doit fournir :

1. **Modèle ProjectTemplate** — Structure de données pour les templates (name, description, config, bestPractices, rules)
2. **Templates prédéfinis** — 10 templates pour les types de projets courants
3. **Application de template** — Création d'un projet depuis un template avec personnalisation
4. **Gestion des templates** — CRUD, import/export, personnalisation
5. **CLI `ekts template`** — Commandes `list`, `create`, `apply`, `show`, `delete`, `export`, `import`
6. **MCP `list_templates`, `apply_template`** — Outils MCP pour les agents IA
7. **Tests complets** — Couverture > 80%
8. **Documentation** — Guide utilisateur et référence API

### 1.3 Périmètre

**Inclus :**
- Modèle de données `ProjectTemplate` avec table dédiée SQLite
- Module `TemplateRepository` (CRUD, filtres)
- Module `TemplateService` (orchestrateur : apply, customize)
- 10 templates prédéfinis (e-commerce, SaaS, blog, portfolio, corporate, landing, documentation, marketplace, application web, agence)
- Application de template avec personnalisation (override partiel)
- Export/import de templates (JSON)
- Commande CLI `ekts template` (7 sous-commandes)
- 2 outils MCP (`list_templates`, `apply_template`)
- Tests unitaires et d'intégration
- Documentation utilisateur et technique

**Exclu :**
- Templates dynamiques (générés par IA) — post-MVP
- Marketplace de templates partagés (MVP-4)
- Versioning des templates (post-MVP)
- Templates multi-langues (post-MVP)

### 1.4 Critères d'acceptation

**Fonctionnels :**
- C17.1 : Un template peut être créé manuellement (nom, description, config, bonnes practices, règles)
- C17.2 : 10 templates prédéfinis sont disponibles au démarrage
- C17.3 : Un projet peut être créé depuis un template (application complète)
- C17.4 : L'application d'un template accepte des overrides (personnalisation partielle)
- C17.5 : Les templates peuvent être exportés en JSON
- C17.6 : Les templates peuvent être importés depuis un JSON
- C17.7 : Commande CLI `ekts template list` affiche les templates disponibles
- C17.8 : Commande CLI `ekts template apply <templateId>` crée un projet depuis un template
- C17.9 : Commande CLI `ekts template create` crée un template personnalisé
- C17.10 : Commande CLI `ekts template export/import` gère les fichiers JSON
- C17.11 : Outil MCP `list_templates` retourne la liste des templates
- C17.12 : Outil MCP `apply_template` crée un projet depuis un template

**Techniques :**
- C17.13 : Application d'un template < 10s
- C17.14 : Support de 100 templates sans dégradation
- C17.15 : Couverture de tests > 80%
- C17.16 : Code linté sans erreur (`npm run lint`)
- C17.17 : Documentation complète (guide utilisateur + référence API)

**Qualité :**
- C17.18 : Templates prédéfinis réalistes et utiles (validés sur cas réels)
- C17.19 : Personnalisation flexible (tous les champs optionnels)
- C17.20 : Gestion des erreurs (template inexistant, projet dupliqué, JSON invalide)

### 1.5 Dépendances

**Prérequis :**
- Sprint 13 : Gestion multi-projets (table `projects`, `ProjectRepository`)
- Sprint 15 : Capitalisation connaissances (table `best_practices`, associations)
- Sprint 16 : Recommandations (table `recommendation_rules`)

**Dépendances futures :**
- Sprint 18 : Tests E2E MVP-3 intégreront le flux de templates
- Aucun autre sprint MVP-3 ne dépend des templates

---

## 2. Architecture et conception

### 2.1 Composants à créer

```
src/templates/
├── template.types.ts           # Types partagés
├── template-repository.ts      # CRUD templates
├── template-service.ts         # Orchestrateur (apply, customize)
├── template-applier.ts         # Application + personnalisation
└── builtin-templates.ts        # 10 templates prédéfinis

src/cli/commands/
└── template.ts                 # Commande ekts template

src/mcp/tools/
├── list-templates.ts           # Outil MCP list_templates
└── apply-template.ts           # Outil MCP apply_template
```

### 2.2 Interfaces principales

**TemplateRepository :**
```typescript
interface TemplateRepository {
  create(input: CreateTemplateInput): Promise<ProjectTemplate>;
  getById(id: string): Promise<ProjectTemplate | null>;
  list(filters?: TemplateFilters): Promise<ProjectTemplate[]>;
  update(id: string, input: UpdateTemplateInput): Promise<ProjectTemplate>;
  delete(id: string): Promise<void>;
  exportToJson(id: string): Promise<string>;
  importFromJson(json: string): Promise<ProjectTemplate>;
}
```

**TemplateService :**
```typescript
interface TemplateService {
  createTemplate(input: CreateTemplateInput): Promise<ProjectTemplate>;
  applyTemplate(templateId: string, projectInput: CreateProjectInput, overrides?: TemplateOverrides): Promise<Project>;
  listTemplates(filters?: TemplateFilters): Promise<ProjectTemplate[]>;
  getBuiltinTemplates(): ProjectTemplate[];
}
```

**TemplateApplier :**
```typescript
interface TemplateApplier {
  apply(template: ProjectTemplate, projectInput: CreateProjectInput, overrides?: TemplateOverrides): Promise<Project>;
  validate(template: ProjectTemplate, overrides?: TemplateOverrides): ValidationResult;
}
```

### 2.3 Modèle de données

**Table `project_templates` :**
```sql
CREATE TABLE project_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,           -- 'e-commerce' | 'saas' | 'blog' | etc.
  config TEXT NOT NULL DEFAULT '{}', -- JSON : configuration du projet (dimensions, seuils, etc.)
  best_practice_ids TEXT NOT NULL DEFAULT '[]', -- JSON array des IDs de bonnes practices
  recommendation_rule_ids TEXT NOT NULL DEFAULT '[]', -- JSON array des IDs de règles
  is_builtin INTEGER NOT NULL DEFAULT 0, -- 1 si template prédéfini
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_project_templates_category ON project_templates(category);
CREATE INDEX idx_project_templates_builtin ON project_templates(is_builtin);
```

**Structure de `config` (JSON) :**
```typescript
interface TemplateConfig {
  // Dimensions prioritaires (ordre d'importance)
  priorityDimensions?: AnalysisDimension[];
  
  // Seuils d'alerte
  alertThresholds?: {
    regressionPoints?: number; // Défaut: 10
    minScore?: number;         // Défaut: 50
  };
  
  // Configuration de l'extracteur de bonnes practices
  extractionCriteria?: {
    minOccurrences?: number;   // Défaut: 2
    minAudits?: number;        // Défaut: 2
    minConfidence?: number;    // Défaut: 0.5
  };
  
  // Configuration du moteur de recommandations
  recommendationOptions?: {
    maxRecommendations?: number; // Défaut: 10
    minRelevanceScore?: number;  // Défaut: 0.3
  };
  
  // Métadonnées
  tags?: string[];
  author?: string;
  version?: string;
}
```

### 2.4 Les 10 templates prédéfinis

| # | Catégorie | Nom | Dimensions prioritaires | Bonnes practices | Règles |
|---|-----------|-----|------------------------|------------------|--------|
| 1 | `e-commerce` | E-commerce | performance, seo, ux | Optimiser images, Lazy loading, Structured data | 5 règles |
| 2 | `saas` | SaaS / Application web | performance, accessibility, ux | Accessibilité ARIA, Performance bundle, SEO technique | 4 règles |
| 3 | `blog` | Blog / CMS | seo, content, performance | Meta descriptions, Contenu structuré, Images optimisées | 4 règles |
| 4 | `portfolio` | Portfolio | ux, performance, content | Design responsive, Performance images, Contenu concis | 3 règles |
| 5 | `corporate` | Site corporate | accessibility, seo, ux | Accessibilité WCAG, SEO on-page, Navigation claire | 4 règles |
| 6 | `landing` | Landing page | performance, seo, ux | Performance critique, Conversion UX, SEO local | 3 règles |
| 7 | `documentation` | Documentation | accessibility, content, seo | Accessibilité lecture, Contenu structuré, SEO technique | 3 règles |
| 8 | `marketplace` | Marketplace | performance, security, ux | Performance listings, Sécurité inputs, UX recherche | 4 règles |
| 9 | `news` | Site d'actualités | performance, seo, content | Performance médias, SEO news, Contenu structuré | 3 règles |
| 10 | `agency` | Site d'agence | ux, performance, content | Design impactant, Performance portfolio, Contenu engageant | 3 règles |

### 2.5 Algorithme d'application d'un template

**Étapes :**

1. **Validation** — Vérifier que le template existe et que les overrides sont valides
2. **Création du projet** — Créer le projet avec les métadonnées de base (nom, URL, description)
3. **Application de la config** — Appliquer la configuration du template (dimensions prioritaires, seuils)
4. **Association des bonnes practices** — Lier les bonnes practices du template au projet
5. **Création des règles de recommandation** — Créer les règles spécifiques au template
6. **Application des overrides** — Appliquer les personnalisations partielles (remplacement de valeurs)
7. **Retour** — Retourner le projet créé avec son ID

### 2.6 Réutilisation du capital MVP-3

| Capital existant | Réutilisation Sprint 17 |
|-----------------|------------------------|
| `ProjectRepository` (Sprint 13) | Création de projets depuis templates |
| `BestPracticeService` (Sprint 15) | Association des bonnes practices aux projets |
| `RecommendationEngine` (Sprint 16) | Création des règles de recommandation |
| CLI Commander | Extension naturelle pour `ekts template` |
| Schémas Zod + handlers MCP | Nouveaux outils `list_templates`, `apply_template` |

---

## 3. Décomposition en sous-sprints

### 3.1 Vue d'ensemble

**3 sous-sprints :**

| Sous-sprint | Durée | Objectif |
|-------------|-------|----------|
| **Sprint 17-01** | 3 jours | Types + Migration + TemplateRepository + TemplateService |
| **Sprint 17-02** | 3 jours | 10 templates prédéfinis + TemplateApplier + Application + Personnalisation |
| **Sprint 17-03** | 3 jours | CLI + MCP + Export/Import + Tests + Documentation |

### 3.2 Dépendances entre sous-sprints

```
Sprint 17-01 (Repository + Service)
    ↓
Sprint 17-02 (Templates prédéfinis + Applier)
    ↓
Sprint 17-03 (CLI + MCP + Export/Import + Docs)
```

**Dépendances critiques :**
- 17-02 dépend de 17-01 (besoin de `TemplateRepository` pour créer les templates)
- 17-03 dépend de 17-01 et 17-02 (besoin du service complet + templates pour CLI/MCP)

---

## 4. Livrables

### 4.1 Code source

**Sprint 17-01 :**
- `src/templates/template.types.ts`
- `src/templates/template-repository.ts`
- `src/templates/template-service.ts`
- `src/storage/migrations/008_create_templates.ts`

**Sprint 17-02 :**
- `src/templates/builtin-templates.ts` (10 templates)
- `src/templates/template-applier.ts`

**Sprint 17-03 :**
- `src/cli/commands/template.ts`
- `src/mcp/tools/list-templates.ts`
- `src/mcp/tools/apply-template.ts`

### 4.2 Tests

- `tests/templates/template-repository.test.ts`
- `tests/templates/template-service.test.ts`
- `tests/templates/template-applier.test.ts`
- `tests/templates/builtin-templates.test.ts`
- `tests/cli/template.test.ts`
- `tests/mcp/tools/list-templates.test.ts`
- `tests/mcp/tools/apply-template.test.ts`
- `tests/integration/templates-integration.test.ts`

### 4.3 Documentation

- `docs/user/TEMPLATES.md` — Guide utilisateur
- Mise à jour de `docs/reference/CLI_REFERENCE.md`
- Mise à jour de `docs/reference/MCP_REFERENCE.md`

### 4.4 Modifications de fichiers existants

- `src/storage/migrations/migration-registry.ts` — Ajout migration 008
- `src/cli/index.ts` — Enregistrement commande template
- `src/mcp/tools/index.ts` — Enregistrement 2 nouveaux outils

### 4.5 Rapport de sprint

- `SPRINT-17-RESULTAT.md` — Rapport final du sprint

---

## 5. Décisions techniques

### ADR-039 : Configuration stockée en JSON

**Décision :** Stocker la configuration du template dans un champ JSON (`config`) plutôt que dans des colonnes dédiées.

**Justification :**
- Flexibilité : la configuration peut évoluer sans migration
- Simplicité : pas de schéma rigide
- Export/import facile (JSON natif)
- Cohérent avec les autres champs JSON (tags, best_practice_ids)

**Conséquences :**
- Validation Zod à l'insertion/lecture
- Pas de requêtes SQL sur les champs de config (filtrage côté application)
- Documentation claire de la structure JSON

### ADR-040 : Templates prédéfinis immuables

**Décision :** Les 10 templates prédéfinis sont marqués `is_builtin = 1` et ne peuvent pas être modifiés ou supprimés.

**Justification :**
- Garantie de disponibilité (toujours accessibles)
- Référence stable pour les utilisateurs
- Possibilité de créer des templates personnalisés (is_builtin = 0) modifiables

**Conséquences :**
- Insertion des 10 templates lors de la migration 008
- Protection en écriture (throw error si modification d'un builtin)
- Les utilisateurs peuvent créer des copies personnalisées

### ADR-041 : Application avec overrides partiels

**Décision :** Permettre l'application d'un template avec des overrides partiels (seuls les champs spécifiés sont remplacés).

**Justification :**
- Flexibilité : personnalisation sans réécrire tout le template
- Simplicité : API claire (merge shallow)
- Cohérent avec les patterns de configuration modernes

**Conséquences :**
- Type `TemplateOverrides` avec tous les champs optionnels
- Merge profond pour la config (object spread)
- Validation après merge

---

## 6. Risques et mitigations

| ID | Risque | Prob. | Impact | Mitigation |
|----|--------|-------|--------|------------|
| R17.1 | Templates prédéfinis trop génériques | Moyenne | Moyen | Validation sur cas réels, itération basée sur feedback |
| R17.2 | Application de template trop rigide | Faible | Moyen | Overrides partiels, personnalisation post-création |
| R17.3 | Export/import incompatible entre versions | Faible | Faible | Versioning dans le JSON, validation à l'import |
| R17.4 | Conflits de noms de projets | Faible | Faible | Vérification d'unicité avant création, suffixe auto si dupliqué |

---

## 7. Prompt d'exécution pour l'agent de développement

**CONTEXTE :**
- Projet : EKTS (Engineering Knowledge Tooling System)
- Sprint : 17 — Templates Projets
- Branche : `develop`
- Prérequis : Sprints 13-16 terminés

**INSTRUCTIONS :**

1. Lire `SPRINT-17.md` (ce document) pour comprendre les objectifs
2. Lire `SPRINT-17-01.md` pour le sous-sprint 1
3. Implémenter les tâches du sous-sprint 17-01 dans l'ordre :
   - Types → Migration → Repository → Service
4. Rédiger `SPRINT-17-01-RESULTAT.md`
5. Exécuter `npm run verify`
6. Lire `SPRINT-17-02.md` pour le sous-sprint 2
7. Implémenter les 10 templates prédéfinis + Applier
8. Rédiger `SPRINT-17-02-RESULTAT.md`
9. Exécuter `npm run verify`
10. Lire `SPRINT-17-03.md` pour le sous-sprint 3
11. Implémenter CLI + MCP + Export/Import + Tests + Documentation
12. Rédiger `SPRINT-17-RESULTAT.md`
13. Exécuter `npm run verify`

**CONTRAINTES :**
- Respecter les conventions du projet
- Tests unitaires pour chaque module
- Couverture > 80%
- Documentation utilisateur (TEMPLATES.md)
- Pas de breaking changes
- Fournir les emplacements exacts des fichiers

**LIVRABLES ATTENDUS :**
- Code source fonctionnel (`src/templates/`, `src/cli/`, `src/mcp/`)
- 10 templates prédéfinis
- Tests unitaires et d'intégration
- Documentation utilisateur et référence
- Rapport de sprint
- `npm run verify` passe

---

**Document rédigé le 25 octobre 2026 — Sprint 17 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 17 prêt pour implémentation**
