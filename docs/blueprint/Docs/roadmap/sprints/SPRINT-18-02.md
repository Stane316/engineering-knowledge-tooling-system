# SPRINT-18-02 — Documentation MVP-3

**Sprint :** 18-02 sur 18 (Sous-sprint 2/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ (26/10/2026)

---

## 1. Objectif du sous-sprint

Rédiger la documentation complète du MVP-3 :
- **Guide utilisateur MVP-3** — Synthèse des guides S13-S17
- **Guide développeur MVP-3** — Architecture, extensions, bonnes pratiques
- **Mise à jour API Reference** — Documentation complète des nouvelles API

---

## 2. Prérequis

```bash
# Vérifier que Sprint 18-01 est terminé
npm run test:e2e:mvp3
# Tous les tests doivent passer
```

---

## 3. Tâches détaillées

### 3.1 Guide utilisateur MVP-3 (1.5 jour)

**Fichier :** `docs/user/MVP3_GUIDE.md`

```markdown
# MVP-3 — Capitalisation de Projets

> Guide utilisateur complet pour les fonctionnalités MVP-3 d'EKTS.

## Vue d'ensemble

Le MVP-3 ajoute 5 fonctionnalités majeures à EKTS :

1. **Multi-Projets** — Gérer plusieurs projets dans une même instance
2. **Suivi Temporel** — Analyser l'évolution des audits dans le temps
3. **Bonnes Practices** — Capitaliser les connaissances extraites des audits
4. **Recommandations** — Moteur de recommandations contextuelles
5. **Templates** — Initialiser rapidement des projets typés

## Installation

```bash
npm install -g @ekts/cli
ekts init
```

## 1. Multi-Projets

### Créer un projet

```bash
ekts project create --name "Mon Projet" --url "https://monsite.com"
```

### Lister les projets

```bash
ekts project list
```

### Filtrer les audits par projet

```bash
ekts audit list --project "Mon Projet"
```

→ Voir [`docs/user/PROJECTS.md`](./PROJECTS.md) pour le guide détaillé.

## 2. Suivi Temporel

### Analyser la timeline

```bash
ekts timeline analyze "Mon Projet"
```

### Détecter les tendances

```bash
ekts timeline trends "Mon Projet" --lookback 90
```

### Gérer les alertes

```bash
ekts timeline alerts "Mon Projet"
```

### Générer un graphique

```bash
ekts timeline chart "Mon Projet" --output evolution.svg
```

→ Voir [`docs/user/TIMELINE.md`](./TIMELINE.md) pour le guide détaillé.

## 3. Bonnes Practices

### Extraire automatiquement

```bash
ekts bestpractice extract "Mon Projet"
```

### Rechercher

```bash
ekts bestpractice search "images"
```

### Créer manuellement

```bash
ekts bestpractice add --title "Optimiser les images" --description "..." --category performance
```

→ Voir [`docs/user/BEST_PRACTICES.md`](./BEST_PRACTICES.md) pour le guide détaillé.

## 4. Recommandations

### Générer des recommandations

```bash
ekts recommend generate "Mon Projet"
```

### Gérer les règles

```bash
ekts recommend rules list
ekts recommend rules add --name "Règle SEO" --pattern "meta" --recommendation "Ajouter les meta"
```

→ Voir [`docs/user/RECOMMENDATIONS.md`](./RECOMMENDATIONS.md) pour le guide détaillé.

## 5. Templates

### Lister les templates

```bash
ekts template list
```

### Appliquer un template

```bash
ekts template apply e-commerce --name "Ma Boutique" --url "https://shop.com"
```

### Créer un template personnalisé

```bash
ekts template create --name "Mon Template" --category custom --config '{...}'
```

→ Voir [`docs/user/TEMPLATES.md`](./TEMPLATES.md) pour le guide détaillé.

## Flux de travail recommandé

1. **Créer un projet depuis un template** :
   ```bash
   ekts template apply e-commerce --name "Ma Boutique" --url "https://shop.com"
   ```

2. **Effectuer des audits réguliers** :
   ```bash
   ekts audit https://shop.com --project "Ma Boutique"
   ```

3. **Extraire les bonnes practices** (après 2+ audits) :
   ```bash
   ekts bestpractice extract "Ma Boutique"
   ```

4. **Générer des recommandations** :
   ```bash
   ekts recommend generate "Ma Boutique"
   ```

5. **Suivre l'évolution** :
   ```bash
   ekts timeline trends "Ma Boutique"
   ```

## Outils MCP (pour agents IA)

| Outil | Description |
|-------|-------------|
| `list_projects` | Lister les projets |
| `get_timeline` | Analyser la timeline |
| `search_best_practices` | Rechercher des bonnes practices |
| `add_best_practice` | Créer une bonne practice |
| `get_recommendations` | Générer des recommandations |
| `list_templates` | Lister les templates |
| `apply_template` | Appliquer un template |

## Configuration

Configuration globale dans `.ekts/config.json` :

```json
{
  "projects": { "defaultLimit": 50 },
  "timeline": { "regressionThreshold": 10, "lookbackDays": 90 },
  "bestPractices": { "minOccurrences": 2, "minConfidence": 0.5 },
  "recommendations": { "maxRecommendations": 10, "minRelevanceScore": 0.3 },
  "templates": { "defaultCategory": "custom" }
}
```
```

**Critères d'acceptation :**
- Vue d'overview des 5 fonctionnalités
- Exemples de commandes pour chaque fonctionnalité
- Liens vers les guides détaillés existants
- Flux de travail recommandé
- Section MCP complète

---

### 3.2 Guide développeur MVP-3 — Architecture (1 jour)

**Fichier :** `docs/dev/MVP3_ARCHITECTURE.md`

```markdown
# Architecture MVP-3

> Documentation technique de l'architecture MVP-3 pour les développeurs.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        EKTS MVP-3                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Projects │  │ Timeline │  │   Best   │  │   Rec.   │   │
│  │  (S13)   │→ │  (S14)   │→ │Practices │→ │  Engine  │   │
│  │          │  │          │  │  (S15)   │  │  (S16)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       ↑                                          ↓          │
│  ┌──────────┐                              ┌──────────┐    │
│  │ Templates│──────────────────────────────│  Reports │    │
│  │  (S17)   │                              │(Markdown)│    │
│  └──────────┘                              └──────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SQLite Storage (3 bases)                 │   │
│  │  audits.db · knowledge.db · vectors.db               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MCP Server (9 outils)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CLI (30+ commandes)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Modules

### `src/projects/` — Multi-Projets (Sprint 13)

| Fichier | Rôle |
|---------|------|
| `project.types.ts` | Types (Project, ProjectFilters) |
| `project-repository.ts` | CRUD SQLite |
| `project-manager.ts` | Orchestrateur |

**Tables SQLite :** `projects`, `audit_metadata.project_id` (FK)

### `src/timeline/` — Suivi Temporel (Sprint 14)

| Fichier | Rôle |
|---------|------|
| `timeline.types.ts` | Types (TimelineAnalysis, Trend) |
| `timeline-analyzer.ts` | Analyse de la timeline |
| `trend-detector.ts` | Détection tendances (régression linéaire) |
| `alert-manager.ts` | Gestion des alertes |
| `chart-generator.ts` | Génération SVG |

**Tables SQLite :** `alerts`

### `src/best-practices/` — Bonnes Practices (Sprint 15)

| Fichier | Rôle |
|---------|------|
| `best-practice.types.ts` | Types (BestPractice, ExtractionReport) |
| `best-practice-repository.ts` | CRUD SQLite |
| `best-practice-search.ts` | Recherche hybride FTS5 |
| `best-practice-extractor.ts` | Extraction automatique |
| `best-practice-service.ts` | Orchestrateur |

**Tables SQLite :** `best_practices`, `best_practices_fts`, `finding_best_practice`

### `src/recommendations/` — Recommandations (Sprint 16)

| Fichier | Rôle |
|---------|------|
| `recommendation.types.ts` | Types (Rule, Recommendation, Context) |
| `recommendation-repository.ts` | CRUD SQLite |
| `recommendation-engine.ts` | Moteur hybride (règles + scoring) |
| `recommendation-context.ts` | Contexte projet |

**Tables SQLite :** `recommendation_rules`, `generated_recommendations`

### `src/templates/` — Templates (Sprint 17)

| Fichier | Rôle |
|---------|------|
| `template.types.ts` | Types (Template, Config, Overrides) |
| `template-repository.ts` | CRUD SQLite |
| `template-applier.ts` | Application + validation |
| `template-service.ts` | Orchestrateur |
| `builtin-templates.ts` | 10 templates prédéfinis |

**Tables SQLite :** `project_templates`

## Schéma de données

```
projects
├── id, name, url, description, created_at
│
├── audit_metadata (1-N)
│   ├── id, project_id (FK), url, timestamp, scores...
│   │
│   ├── audit_dimensions (1-N)
│   │   └── id, audit_id (FK), dimension, score
│   │
│   └── audit_findings (1-N)
│       └── id, audit_id (FK), dimension, title, severity...
│
├── alerts (1-N)
│   └── id, project_id (FK), dimension, score_before, score_after...
│
├── best_practices (M-N via finding_best_practice)
│   └── id, title, description, category, source_project_ids...
│
├── recommendation_rules (1-N)
│   └── id, project_id (FK), pattern, recommendation...
│
└── generated_recommendations (1-N)
    └── id, project_id (FK), rule_id (FK), relevance_score...

project_templates
└── id, name, category, config (JSON), is_builtin...
```

## Flux de données

### Application d'un template

```
Template → Project → Config → BestPractices → Rules
```

1. `TemplateService.applyTemplate()` → crée le projet
2. Applique la configuration (dimensions, seuils)
3. Associe les bonnes practices
4. Crée les règles de recommandation

### Génération de recommandations

```
Project → Context → Rules + Statistics → Merge → Recommendations
```

1. `RecommendationContext.buildContext()` → collecte historique
2. `RecommendationEngine.generateFromRules()` → matching pattern
3. `RecommendationEngine.generateFromStatistics()` → fréquence × impact
4. Merge + déduplication → tri par score

## Performance

| Opération | Budget | Mesuré |
|-----------|--------|--------|
| Création projet | < 50ms | ✅ |
| Timeline (50 audits) | < 2s | ✅ |
| Recherche bonnes practices | < 100ms | ✅ |
| Extraction (100 audits) | < 5s | ✅ |
| Génération recommandations | < 5s | ✅ |
| Application template | < 10s | ✅ |
| Tests E2E complets | < 120s | ✅ |

## Extensions

### Ajouter une dimension d'analyse

1. Ajouter dans `AnalysisDimension` (src/analysis/types.ts)
2. Créer l'analyseur dans `src/analysis/`
3. Mettre à jour les templates concernés

### Ajouter un template prédéfini

1. Ajouter dans `BUILTIN_TEMPLATES` (src/templates/builtin-templates.ts)
2. Définir config, dimensions prioritaires, règles
3. Tester avec `ekts template apply`

### Ajouter un outil MCP

1. Créer le fichier dans `src/mcp/tools/`
2. Définir le schéma Zod (input)
3. Enregistrer dans `src/mcp/tools/index.ts`
```

---

### 3.3 Guide développeur MVP-3 — Extension (0.5 jour)

**Fichier :** `docs/dev/MVP3_EXTENSION.md`

```markdown
# Extension MVP-3

> Guide pour étendre les fonctionnalités MVP-3.

## Ajouter un module MVP-3

### 1. Structure

```
src/mon-module/
├── mon-module.types.ts       # Types
├── mon-module-repository.ts  # Stockage
├── mon-module-service.ts     # Logique métier
└── mon-module.ts             # API publique
```

### 2. Types

```typescript
// mon-module.types.ts
export interface MonEntite {
  id: string;
  // ...
}

export interface CreateMonEntiteInput {
  // ...
}
```

### 3. Repository

```typescript
// mon-module-repository.ts
export class MonModuleRepository {
  constructor(private db: Database) {}

  create(input: CreateMonEntiteInput): MonEntite {
    // ...
  }
}
```

### 4. Migration

```typescript
// src/storage/migrations/009_create_mon_module.ts
export function migration009CreateMonModule(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS mon_module (...)`);
}
```

### 5. CLI

```typescript
// src/cli/commands/mon-module.ts
export function registerMonModuleCommand(program: Command): void {
  program.command('mon-module').description('...');
}
```

### 6. MCP

```typescript
// src/mcp/tools/mon-outil.ts
export function registerMonOutil(server: McpServer): void {
  server.registerTool('mon_outil', { ... });
}
```

### 7. Tests

- Tests unitaires dans `tests/mon-module/`
- Tests E2E dans `tests/e2e/mvp3/mon-module.test.ts`

## Bonnes pratiques

1. **Typage strict** — TypeScript strict, pas de `any`
2. **Injection de dépendances** — Constructor injection
3. **Validation Zod** — Toujours valider les entrées
4. **Tests** — Couverture > 80%
5. **Documentation** — JSDoc sur les types et méthodes publiques
6. **ADR** — Documenter les décisions dans le registre

## Patterns récurrents

### Repository pattern

```typescript
class MonRepository {
  constructor(private db: Database) {}
  create(input): Entity { ... }
  getById(id): Entity | null { ... }
  list(filters): Entity[] { ... }
  update(id, input): Entity { ... }
  delete(id): void { ... }
}
```

### Service pattern

```typescript
class MonService {
  private repo: MonRepository;
  constructor(db: Database) {
    this.repo = new MonRepository(db);
  }
  // Orchestration
}
```

### Command pattern (CLI)

```typescript
function registerCommand(program: Command): void {
  const cmd = program.command('mon-module');
  cmd.command('list').action(async () => { ... });
  cmd.command('create').action(async () => { ... });
}
```
```

---

## 4. Vérifications finales

```bash
# Vérifier que tous les liens dans la documentation sont valides
npm run docs:check-links

# Vérifier la cohérence de la documentation
npm run docs:lint
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-18-02-RESULTAT.md` :

```markdown
# Rapport Sprint 18-02 — Documentation MVP-3

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés

- `docs/user/MVP3_GUIDE.md` — Guide utilisateur MVP-3 (synthèse)
- `docs/dev/MVP3_ARCHITECTURE.md` — Architecture MVP-3
- `docs/dev/MVP3_EXTENSION.md` — Guide d'extension

## Contenu

### MVP3_GUIDE.md
- Vue d'overview des 5 fonctionnalités
- Exemples de commandes pour chaque fonctionnalité
- Flux de travail recommandé
- Section MCP (9 outils)
- Configuration globale

### MVP3_ARCHITECTURE.md
- Diagramme d'architecture
- Modules (5 modules, fichiers, tables SQLite)
- Schéma de données complet
- Flux de données (template → recommandations)
- Performance (budgets et mesures)
- Extensions (dimension, template, outil MCP)

### MVP3_EXTENSION.md
- Structure d'un nouveau module
- Patterns récurrents (Repository, Service, Command)
- Bonnes pratiques (typage, DI, validation, tests)
- Guide pas-à-pas

## Prochaine étape

Sprint 18-03 : Validation finale + README/CHANGELOG + MVP-4
```

---

## 6. Critères de validation du sous-sprint

- ✅ Guide utilisateur MVP-3 complet (synthèse)
- ✅ Guide architecture MVP-3 (diagrammes, modules, flux)
- ✅ Guide extension MVP-3 (patterns, pas-à-pas)
- ✅ Liens vers les guides détaillés existants
- ✅ Documentation API cohérente
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 18-02 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 18-02 prêt pour implémentation**
