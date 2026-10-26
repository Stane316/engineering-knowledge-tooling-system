# Architecture MVP-3

> Documentation technique des cinq modules MVP-3 (Sprints 13 à 17)
> pour les développeurs. **ADR-043** : synthèse — les guides détaillés
> restent la référence (projets, timeline, bonnes pratiques,
> recommandations, templates ; voir liens en fin de document).

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────┐
│                          EKTS MVP-3                            │
├────────────────────────────────────────────────────────────────┤
│  CLI (15 commandes racine)          MCP (17 outils)            │
│  init add get search list delete    knowledge(4) audit(3)      │
│  status reindex inspect audit       projects(4) timeline(1)    │
│  project bestpractice|bp            best-practices(2)          │
│  recommend|rec template|tpl         recommendations(1)         │
│  timeline                           templates(2)               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────┐   ┌────────────┐   ┌─────────────┐             │
│  │  Projects  │→  │  Timeline  │→  │ Best        │→ Recs       │
│  │  (S13)     │   │  (S14)     │   │ Practices   │  (S16)      │
│  │ business/  │   │ timeline/  │   │ (S15)       │             │
│  └────────────┘   └────────────┘   └─────────────┘             │
│        ↑                                      ↓                │
│  ┌────────────┐                        ┌─────────────┐         │
│  │ Templates  │───────────────────────→│  Reports    │         │
│  │  (S17)     │                        │ Markdown/PDF│         │
│  └────────────┘                        └─────────────┘         │
│                                                                │
│  SQLite — 3 bases : ekts.db · ekts-fts.db · ekts-vectors.db    │
└────────────────────────────────────────────────────────────────┘
```

## Modules

### Multi-Projets (Sprint 13)

| Fichier | Rôle |
|---------|------|
| `src/business/project-manager.ts` + `.types.ts` | Orchestrateur et types (projet, filtres) |
| `src/data/repositories/project-repository.ts` | CRUD SQLite `projects` |
| `src/cli/commands/project.ts` | CLI `project create/list/show/delete` |
| `src/mcp/tools/{create,list,get,delete}-project.ts` | Outils MCP |

**Tables** : `projects` (id UUID, name, description, status, metadata
JSON), `audit_metadata.project_id` (FK, `ON DELETE SET NULL` — la
suppression d'un projet **conserve** les audits), migration 003
(`src/data/migrations/003_project_audits.ts`).

### Suivi Temporel (Sprint 14)

| Fichier | Rôle |
|---------|------|
| `src/timeline/timeline-analyzer.ts` | Analyse période (dates, scores, dimensions) |
| `src/timeline/trend-detector.ts` | Tendances (régression linéaire) + régressions inter-audits |
| `src/timeline/alert-manager.ts` | Alertes idempotentes (seuil `regressionPoints`) |
| `src/timeline/chart-generator.ts` | Graphique SVG (viewbox interne, width/height) |
| `src/timeline/timeline.types.ts` | Types partagés |

**Tables** : `alerts`. Fenêtre glissante `--lookback` (défaut 90 jours)
sur `trends`/`alerts` ; régression = chute **> 10 points** entre audits
consécutifs.

### Bonnes Practices (Sprint 15)

| Fichier | Rôle |
|---------|------|
| `src/best-practices/best-practice-extractor.ts` | Extraction (constats résolus ≥ 2 occurrences + hausse de score) |
| `src/best-practices/best-practice-repository.ts` | CRUD + filtres |
| `src/best-practices/best-practice-search.ts` | Recherche hybride FTS5/BM25 |
| `src/best-practices/best-practice-service.ts` | Orchestrateur |
| `src/best-practices/best-practice.types.ts` | Types et critères par défaut |

**Tables** : `best_practices`, `finding_best_practice` (M-N),
`best_practices_fts` (FTS5 **external content** synchronisé par
**triggers** — migration 005 ; un INSERT SQL brut alimente l'index).

### Recommandations (Sprint 16)

| Fichier | Rôle |
|---------|------|
| `src/recommendations/recommendation-engine.ts` | Moteur hybride (règles 0,8 + sévérité/4×0,15 ; statistique 0,5 + fréquence/max×0,3) |
| `src/recommendations/recommendation-rules.ts` | Règles maison (pattern, seuils) |
| `src/recommendations/recommendation-context.ts` | Contexte projet (historique) |
| `src/recommendations/recommendation-repository.ts` | Persistance |
| `src/recommendations/recommendation.types.ts` | Types |

**Tables** : `recommendation_rules`, `generated_recommendations`
(persistance **par projet**). Options : `-n/--max`, `--min-score`,
`--dimensions`, `--no-rules`, `--no-statistical`.

### Templates (Sprint 17)

| Fichier | Rôle |
|---------|------|
| `src/templates/builtin-templates.ts` | 10 modèles prédéfinis (seed idempotent `TemplateService.seedBuiltins()`) |
| `src/templates/template-applier.ts` | Application : projet (`metadata.url`) → `project_config` → BP dedup → règles actives |
| `src/templates/template-repository.ts` | CRUD + export/import JSON |
| `src/templates/template-service.ts` | Façade orchestrateur |
| `src/templates/template.types.ts` | Types (ADR-039/041) |

**Tables** : `project_templates` (migration 007), `project_config`
(migration 008). Builtins immuables (ADR-040) → tentative de suppression
= code 4.

## Schéma de données (migrations `src/data/migrations/` 001 → 008)

```
ekts.db
├── resources, projects, migrations            (001-003, schéma v8)
├── audit_metadata ── audit_dimensions          (003)
│                  └─ audit_findings            (scores 0-100, sévérités 0-4)
├── alerts                                      (004)
├── best_practices, finding_best_practice       (005)
├── recommendation_rules                        (006)
├── generated_recommendations
├── project_templates                           (007)
└── project_config                              (008)
ekts-fts.db
├── resources_fts, audit_fts                    (FTS5 autonome)
└── best_practices_fts                          (external content + triggers)
ekts-vectors.db
└── index sqlite-vec (embeddings, espaces d'embedding ADR-016)
```

> `user_version` de la base doit correspondre à la dernière migration
> (vérifié par les tests `database`/`program`/`cli` — **relancer
> `npm run build`** après toute migration).

## Flux de données

### Application d'un template (S17)

```
TemplateService.applyTemplate(templateId, {name, url})
  → TemplateApplier.apply
      1. ProjectRepository.create (metadata.url)
      2. upsert project_config (merge profond ADR-041 : priorityDimensions,
         alertThresholds, tags…)
      3. association des bonnes pratiques (dédupliées)
      4. création des règles actives (countActiveRules)
  → JSON {projectId, projectName, templateId, bestPracticesAssociated,
          rulesCreated, durationMs}
```

### Extraction (S15)

```
Audits triés (timestamp ASC) → groupFindings (titre normalisé + dimension)
  → constats résolus (présents en N, absents en N+1, score en hausse)
     ET occurrences ≥ minOccurrences (2)
  → création ou incrémentation (practicesMerged) + associations (linksCreated)
```

### Génération de recommandations (S16)

```
Context (audits du projet) ─┬→ Règles actives : score = 0,8 + sévérité/4 × 0,15
                            │   (pattern sur le titre, dimension, seuil)
                            └→ Statistiques : 0,5 + fréquence/max × 0,3
                               (min. 3 audits) + 0,05 si constat lié
  → ajustements (±0,1 effort/impact, −0,2 déjà recommandé, +0,15 priorité)
  → purge + persistance par projet → recommandations[≥ score minimum]
```

## Performance (budgets / mesures maison)

| Opération | Budget | Mesuré |
|-----------|--------|--------|
| Suite E2E MVP-3 (6 fichiers, 26 tests) | < 120 s | **29,8 s** (S18-01) |
| Extraction (`bestpractice extract`) | < 5 s | ~2 ms (3 audits, S18-01) |
| Recherche bonnes practices (FTS) | < 100 ms | < 2 s (borne testée, large marge) |
| Génération recommandations | < 5 s | 3-6 ms (S18-01) |
| Application template | < 5 s | ~1 ms (S17) |
| Job CI `e2e-mvp3` (ADR-042) | timeout 5 min | — |

## Extensions

- **Dimension d'analyse** : ajouter dans `AnalysisDimension`
  (`src/analysis/types.ts`), propager aux validateurs/tables (`CHECK`
  des colonnes `dimension`) et aux templates concernés.
- **Template prédéfini** : ajouter dans `BUILTIN_TEMPLATES`
  (`src/templates/builtin-templates.ts`), régénérer les tests de
  comptage (10 → N), vérifier `ekts template apply` sur le modèle.
- **Outil MCP** : fichier dans `src/mcp/tools/` (schéma Zod + handler),
  enregistrer dans `src/mcp/tools/index.ts` (`readOnly` ou écriture →
  liste `WRITING_TOOLS`), tests dans `tests/mcp/`, catalogue +9 dans
  [`MCP.md`](MCP.md) et [`API_REFERENCE.md`](API_REFERENCE.md).

Voir [`MVP3_EXTENSION.md`](MVP3_EXTENSION.md) pour le pas-à-pas complet.

## Pour aller plus loin

- Détails projets : [`guides/PROJECTS.md`](guides/PROJECTS.md) ·
  timeline : [`guides/TIMELINE.md`](guides/TIMELINE.md) ·
  bonnes pratiques : [`guides/BEST_PRACTICES.md`](guides/BEST_PRACTICES.md) ·
  recommandations : [`guides/RECOMMENDATIONS.md`](guides/RECOMMENDATIONS.md) ·
  templates : [`guides/TEMPLATES.md`](guides/TEMPLATES.md)
- Couches de données : [`guides/DATA_LAYER.md`](guides/DATA_LAYER.md),
  [`STORAGE.md`](STORAGE.md)
- Rapports (sections, `context-recommendations`) : [`REPORTS.md`](REPORTS.md)
- Utilisateur : [`MVP3_GUIDE.md`](MVP3_GUIDE.md)

---

**Sprint 18-02 (MVP-3, ADR-043)** · 26 octobre 2026
