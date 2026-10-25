# Templates de projets — Guide utilisateur

## Vue d'ensemble

Les templates EKTS permettent d'initialiser rapidement des projets avec une
configuration prédéfinie adaptée au type de site (Sprint 17) :

- **10 templates prédéfinis** disponibles dès le démarrage (immuables,
  ADR-040) ;
- des **templates personnalisés** créés, exportés et importés en JSON
  (C17.1, C17.5) ;
- des **overrides partiels** à l'application : seuls les champs fournis
  remplacent la configuration du template (ADR-041).

### Templates prédéfinis

| # | Catégorie | Description |
|---|-----------|-------------|
| 1 | `e-commerce` | Performance listings, SEO produit, UX achat |
| 2 | `saas` | Performance bundle, accessibilité ARIA, SEO technique |
| 3 | `blog` | SEO contenu, performance médias, lisibilité |
| 4 | `portfolio` | Design responsive, performance images, contenu concis |
| 5 | `corporate` | Accessibilité WCAG, SEO on-page, navigation |
| 6 | `landing` | Performance above-fold, UX conversion, SEO local |
| 7 | `documentation` | Accessibilité lecture, recherche, contenu structuré |
| 8 | `marketplace` | Performance listings, sécurité, UX recherche |
| 9 | `news` | Performance médias, SEO news, contenu structuré |
| 10 | `agency` | Design impactant, performance portfolio, contenu engageant |

Chaque prédéfini embarque **3 à 5 règles de recommandation** qui sont créées
avec lui au démarrage et comptées à chaque application.

## Commandes CLI

Toutes les commandes acceptent `--json` (sortie machine) ; alias `tpl`.

### `ekts template list`

```bash
ekts template list
ekts template list -c e-commerce
ekts template list --builtin
ekts template list --custom
ekts template list -n 50
```

**Options :** `-c/--category` (11 catégories), `--builtin`, `--custom`
(exclusifs), `-n/--limit` (1-500, défaut 50).

### `ekts template show <id>`

Affiche le détail d'un template (UUID complet attendu).

```bash
ekts template show 123e4567-e89b-12d3-a456-426614174000
```

### `ekts template apply <templateId>`

Crée un projet depuis un template (C17.3) avec overrides optionnels
(C17.4).

```bash
ekts template apply <templateId> \
  --name "Mon site e-commerce" \
  --url "https://monsite.com" \
  --description "Boutique en ligne" \
  --config '{"alertThresholds": {"minScore": 75}}'
```

**Options :** `--name` (requis), `--url` (requis), `--description`,
`--config <json>` (objets fusionnés clé par clé, tableaux remplacés,
`tags` concaténés).

### `ekts template create`

Crée un template personnalisé (C17.1).

```bash
ekts template create \
  -n "Mon Template" \
  -d "Template personnalisé" \
  -c custom \
  --config '{"priorityDimensions": ["performance", "seo"]}' \
  --bp-ids "id-bp-1,id-bp-2" \
  --rule-ids "id-regle-1"
```

**Options :** `-n/--name`, `-d/--description`, `-c/--category` (requis),
`--config <json>`, `--bp-ids <ids>` (CSV), `--rule-ids <ids>` (CSV).

### `ekts template delete <id>`

Supprime un template personnalisé — les prédéfinis sont **immuables**
(erreur code 4).

```bash
ekts template delete 123e4567-e89b-12d3-a456-426614174000
```

### `ekts template export <id> <file>`

Exporte un template en JSON (sans identifiant ni dates — l'import recrée
un template vierge, C17.5).

```bash
ekts template export 123e4567-e89b-12d3-a456-426614174000 mon-template.json
```

### `ekts template import <file>`

Importe un template depuis un export JSON (C17.5).

```bash
ekts template import mon-template.json
```

### Codes retour

| Code | Signification |
|------|---------------|
| 0 | Succès |
| 1 | Erreur d'exécution (fichier absent/inaccessible…) |
| 2 | Usage invalide (options manquantes, syntaxe) |
| 4 | Entrée invalide : UUID, catégorie, entier borné, JSON, template absent ou builtin immuable |

## Outils MCP

Catalogue : **17 outils** (Sprints 2 → 17).

### `list_templates`

```json
{
  "tool": "list_templates",
  "arguments": {
    "category": "e-commerce",
    "builtin_only": true,
    "limit": 20
  }
}
```

Résumé Markdown + JSON structuré (`id`, `name`, `category`, `description`,
`isBuiltin`, `bestPracticeCount`, `ruleCount`).

### `apply_template`

```json
{
  "tool": "apply_template",
  "arguments": {
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "project_name": "Mon projet",
    "project_url": "https://example.com",
    "project_description": "Description",
    "overrides": {
      "config": { "alertThresholds": { "minScore": 75 } },
      "additional_best_practice_ids": [],
      "additional_rule_ids": []
    }
  }
}
```

Entrée invalide → erreur `-32602` ; template introuvable → erreur métier
(`VALIDATION_FAILED`, code 4 en CLI).

## Configuration d'un template

| Champ | Description | Défaut |
|-------|-------------|--------|
| `priorityDimensions` | Dimensions prioritaires (ordre) | toutes |
| `alertThresholds.regressionPoints` | Seuil de régression (1-50) | 10 |
| `alertThresholds.minScore` | Score plancher (0-100) | 50 |
| `extractionCriteria.minOccurrences` | Occurrences minimum d'un constat | 2 |
| `extractionCriteria.minAudits` | Audits minimum pour extraire | 2 |
| `extractionCriteria.minConfidence` | Confiance minimale d'association | 0.5 |
| `recommendationOptions.maxRecommendations` | Maximum de recommandations | 10 |
| `recommendationOptions.minRelevanceScore` | Score de pertinence minimum | 0.3 |
| `tags` | Tags de filtrage (post-filtre, ADR-039) | `[]` |
| `author` / `version` | Métadonnées d'export | — |

## Exemples

### Créer un projet e-commerce

```bash
# Lister les templates e-commerce
ekts template list -c e-commerce

# Appliquer le template e-commerce
ekts template apply <uuid-template> \
  --name "Ma boutique" \
  --url "https://maboutique.com" \
  --description "Boutique en ligne de vêtements"
```

### Créer un template personnalisé

```bash
ekts template create \
  -n "Startup SaaS" \
  -d "Template optimisé pour les startups SaaS" \
  -c saas \
  --config '{"priorityDimensions": ["performance", "accessibility"], "alertThresholds": {"regressionPoints": 5, "minScore": 80}, "tags": ["startup", "saas", "mvp"]}'

# L'appliquer
ekts template apply <uuid-du-template> --name "MonSaaS" --url "https://monsaas.com"
```

### Partager un template

```bash
# Exporter
ekts template export <uuid> startup-saas.json

# Importer sur une autre instance
ekts template import startup-saas.json
```

## Bonnes pratiques

1. **Préférez les prédéfinis** comme base : ils sont maintenus avec le
   produit et non modifiables, dupliquez-les en `custom` pour les adapter.
2. **Validez avant d'appliquer** : `ekts template show <id>` vérifie la
   configuration et les associations.
3. **Les overrides sont partiels** : `--config '{"alertThresholds":
   {"minScore": 75}}'` conserve les autres clés du template (merge profond
   des sous-objets).
4. **Export/import** = format d'échange (version `1.0.0`) : l'import crée
   toujours un nouveau template, jamais de remplacement silencieux.
5. Les templates sont stockés en JSON (`project_templates`) et la
   configuration appliquée dans `project_config` — aucune migration n'est
   nécessaire pour enrichir une config.

---

*Guide Sprint 17 — voir aussi : [CLI](../CLI.md), [MCP](../MCP.md),
[Recommandations](./RECOMMENDATIONS.md).*
