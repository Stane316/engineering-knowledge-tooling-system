# MVP-3 — Capitalisation de Projets

> Guide utilisateur synthétique des fonctionnalités MVP-3 d'EKTS
> (Sprints 13 à 17). **ADR-043 : pas de duplication** — chaque section
> ne fait que référencer le guide détaillé correspondant.

**Prérequis** : build récent (`npm run build`) pour `ekts` via
`npm run cli -- …`, sinon installez le binaire selon
[`guides/SETUP.md`](guides/SETUP.md). Toutes les commandes acceptent
`--json` pour le scripting ; les erreurs maison répondent `VALIDATION_FAILED`
(code **4**), ressources absentes **3**, usage erroné **2**, refus de
confirmation **1** (détails : [`API_REFERENCE.md`](API_REFERENCE.md)).

## Vue d'ensemble — 5 fonctionnalités

| # | Fonctionnalité | Commande racine | Guide détaillé |
|---|---|---|---|
| 1 | Multi-Projets | `ekts project` | [`guides/PROJECTS.md`](guides/PROJECTS.md) |
| 2 | Suivi Temporel | `ekts timeline` | [`guides/TIMELINE.md`](guides/TIMELINE.md) |
| 3 | Bonnes Practices | `ekts bestpractice` (`bp`) | [`guides/BEST_PRACTICES.md`](guides/BEST_PRACTICES.md) |
| 4 | Recommandations | `ekts recommend` (`rec`) | [`guides/RECOMMENDATIONS.md`](guides/RECOMMENDATIONS.md) |
| 5 | Templates | `ekts template` (`tpl`) | [`guides/TEMPLATES.md`](guides/TEMPLATES.md) |

## 1. Multi-Projets

```bash
ekts project create "Ma Boutique" -d "Site e-commerce"   # → ✅ Projet créé (+ id UUID)
ekts project list [--json]                               # liste
ekts project show <uuid>                                 # détail (absent → 3)
ekts project delete <uuid> -f                            # suppression confirmée
ekts audit list -p <uuid>                                # audits filtrés par projet
```

> ⚠️ Les identifiants sont des **UUID** : récupérez-les avec
> `ekts project list --json`. La suppression d'un projet conserve ses
> audits (`project_id` → `NULL`).

## 2. Suivi Temporel

```bash
ekts timeline analyze <uuid>                             # période, scores, dimensions
ekts timeline trends <uuid> --lookback 365               # tendances (fenêtre glissante, défaut 90 j)
ekts timeline alerts <uuid> --check --threshold 5        # alertes idempotentes (--json)
ekts timeline chart <uuid> -o evolution.svg --width 640  # graphique SVG
```

Les **régressions** sont des chutes **strictement > 10 points** entre
audits consécutifs (réglage maison du moteur, cf.
[`guides/TIMELINE.md`](guides/TIMELINE.md)).

## 3. Bonnes Practices

```bash
ekts bestpractice extract <uuid>                         # → « Bonnes pratiques extraites : N »
ekts bestpractice list [-c <catégorie>] [--manual] [--json]
ekts bestpractice search images                          # recherche FTS5
ekts bestpractice add -t "Titre" -d "Description ≥ 10 caractères" -c performance --tags a,b
ekts bestpractice show <uuid>
ekts bestpractice delete <uuid> --yes                    # sans --yes → code 1
```

L'extraction automatique cible les constats **résolus** (présents à un
audit, absents du suivant avec score en hausse) rencontrés **≥ 2 fois**
— détail des critères dans
[`guides/BEST_PRACTICES.md`](guides/BEST_PRACTICES.md).

## 4. Recommandations

```bash
ekts recommend rules add -n "Règle SEO" --dimension performance \
  --severity 4 --pattern "meta" --rec-title "Ajouter les meta" \
  --rec-desc "…" --effort 3 --impact 5 --priority high   # --severity = entier 0-4
ekts recommend generate <uuid> [--json]                  # règles + scoring statistique
ekts recommend list <uuid>                               # recommandations persistées
```

Les règles matchent les titres de constats (`pattern`) sur la dimension
et la sévérité minimales ; sans règle active, le moteur conserve le
scoring statistique (minimum 3 audits). Arbitrages de score et priorités
: [`guides/RECOMMENDATIONS.md`](guides/RECOMMENDATIONS.md).

## 5. Templates

```bash
ekts template list [--builtin] [--json]                 # 10 modèles prédéfinis
ekts template show <uuid>                               # détail (config, tags, règles)
ekts template apply <uuid> --name "Projet X" --url https://site.example
ekts template create -n "Mon modèle" -d "…" -c custom
ekts template export <uuid> <fichier.json>
ekts template import <fichier.json>
ekts template delete <uuid>                             # personnels uniquement (builtins → 4)
```

L'application crée le projet (`metadata.url`), applique la configuration
(`project_config`), associe les bonnes pratiques et crée les règles de
recommandation. Builtins immuables (ADR-040) : voir
[`guides/TEMPLATES.md`](guides/TEMPLATES.md).

## Flux de travail recommandé

```bash
# 1. Projet type (10 modèles : e-commerce, blog, SaaS…)
ekts template apply <template-uuid> --name "Ma Boutique" --url https://shop.example

# 2. Audits réguliers (inspection navigateur complète)
ekts inspect https://shop.example --project <projet-uuid>

# 3. Capitalisation (après ≥ 2 audits)
ekts bestpractice extract <projet-uuid>

# 4. Recommandations
ekts recommend generate <projet-uuid>

# 5. Suivi dans le temps
ekts timeline trends <projet-uuid> --lookback 90
ekts timeline alerts <projet-uuid> --check

# 6. Rapport Markdown pour l'audit #1
ekts audit report 1 -f md -o ./reports
```

## Outils MCP (agents IA) — catalogue complet : **17 outils**

| Outil | Rôle |
|-------|------|
| `search_knowledge` · `get_resource` · `list_resources` · `validate_resource` | Base de connaissances (MVP-1) |
| `inspect_site` · `audit_history` · `audit_report` | Inspections & rapports (MVP-2) |
| `create_project` · `list_projects` · `get_project` · `delete_project` | Multi-projets (S13) |
| `get_timeline` | Suivi temporel (S14) |
| `search_best_practices` · `add_best_practice` | Bonnes practices (S15) |
| `get_recommendations` | Recommandations (S16) |
| `list_templates` · `apply_template` | Templates (S17) |

Schémas d'entrée/sortie : [`API_REFERENCE.md`](API_REFERENCE.md)
§ MCP ; droits `readOnly`/`readOnly:false` et politiques :
[`MCP.md`](MCP.md).

## Configuration

Il n'existe **pas** de fichier `.ekts/config.json` (écart au spec — la
configuration maison repose sur l'environnement et les options) :

| Variable | Défaut | Rôle |
|---|---|---|
| `EKTS_DATA_DIR` | `./data` | Répertoire des 3 bases (`ekts.db`, `ekts-fts.db`, `ekts-vectors.db`) |
| `EKTS_OFFLINE` | — | Interdit tout appel réseau d'embeddings (tests/E2E) |
| `EKTS_BROWSER_SANDBOX` | `auto` | Politique bac à sable Firefox |
| `EKTS_MCP_TIMEOUT_MS` | `20000` | Délai des tests stdio MCP |
| `NO_COLOR` / `FORCE_COLOR` | — | Couleurs de sortie |

Seuils et budgets sont portés par les **options des commandes**
(`--threshold`, `--lookback`, `--min-score`, `--max`…), leurs défauts
dans [`API_REFERENCE.md`](API_REFERENCE.md) § CLI. Variables
complètes : [`CLI.md`](CLI.md) § environnement,
[`USER_GUIDE.md`](USER_GUIDE.md).

## Pour aller plus loin

- Commandes complètes et codes de sortie : [`CLI.md`](CLI.md)
- Référence API/CLI/MCP : [`API_REFERENCE.md`](API_REFERENCE.md)
- Architecture technique : [`MVP3_ARCHITECTURE.md`](MVP3_ARCHITECTURE.md)
- Étendre EKTS : [`MVP3_EXTENSION.md`](MVP3_EXTENSION.md)
- Validation complète MVP-3 : [`MVP3_VALIDATION.md`](MVP3_VALIDATION.md)
  (livré au Sprint 18-03 — lien déjà en place)

---

**Sprint 18-02 (MVP-3, ADR-043)** · 26 octobre 2026
