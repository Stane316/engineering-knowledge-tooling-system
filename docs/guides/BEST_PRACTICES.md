# Capitalisation des Bonnes pratiques — Guide utilisateur (Sprint 15)

## Objectif

EKTS transforme vos audits en **capital réutilisable** : les constats résolus
avec succès sont extraits automatiquement en **bonnes pratiques**,
recherchables (FTS5 + RRF), associables aux constats courants et exposées aux
agents IA (MCP).

**Livrable** : guide + commandes CLI `ekts bestpractice|bp` + outils MCP
`search_best_practices` / `add_best_practice`.

## Prérequis

- Installation : `npx ekts init`
- Au moins **2 audits** dans un projet pour l'extraction automatique
  (`npx ekts project run <id|nom>`) ;
- Pour l'association de projets : `--project` / `project_id` en UUID.

## Fonctionnement

1. **Extraction** — un finding est « résolu » s'il disparaît entre deux audits
   consécutifs **et** que le score de sa dimension s'améliore ;
2. **Récurrence** — le finding doit apparaître ≥ 2 fois (critère
   `minOccurrences`, configurable) ;
3. **Pratique** — titre + recommandation du finding + catégorie (dimension) +
   tags ; fusion si même titre normalisé (déduplication) ;
4. **Associations** — les findings courants sont liés automatiquement avec un
   score de confiance (base 0.5, +0.05/occurrence, +0.05/sévérité, plafonné 1).

## Commandes CLI

```bash
# Liste avec filtres (catégorie, tag, projet, type, tri, limite) — code 0/4
npx ekts bestpractice list --json
npx ekts bp list -c performance -t images --manual --sort occurrence_count -l 50

# Recherche hybride FTS5 (scores 0-1, matchType fts/list/hybrid) — C15.8
npx ekts bestpractice search "optimiser images" --limit 5 --json

# Création manuelle (titre ≥ 3, description ≥ 10, catégorie obligatoire) — C15.9
npx ekts bestpractice add \
  --title "Toujours lazy-loader les images" \
  --description "Utiliser loading=lazy pour les images hors viewport" \
  --category performance \
  --tags "images,lazy-loading"

# Détail complet + findings associés (3 si absent, 4 si UUID invalide) — C15.10
npx ekts bestpractice show <uuid> --json

# Suppression (1 sans --yes, 3 absent, 4 UUID invalide)
npx ekts bestpractice delete <uuid> --yes

# Extraition automatique (3 projet absent, 0 rapport vide, 4 critères) — C15.2
npx ekts bestpractice extract <projectId> --min-occurrences 2 --min-audits 2 --json
```

| Sous-commande | Codes retour |
| --- | --- |
| `list` | 0 (y compris vide), 1, 2, 4 (catégorie/tri/limit/projet/`--manual`+`--auto`) |
| `search` | 0 (y compris aucun résultat), 1, 2, 4 (limite/catégorie) |
| `add` | 0, 2, 4 (titre/description/catégorie) |
| `show` | 0, 3 (absent), 4 (UUID) |
| `delete` | 0, 1 (sans `--yes`), 3, 4 |
| `extract` | 0 (y compris 0 audit), 1, 3, 4 (critères) |

Sortie humaine par défaut, structurée avec `--json` (contrat `human`/`json`
maison). L'alias `bp` est équivalent à `bestpractice`.

## Outil MCP

### `search_best_practices` (lecture seule)

```json
{
  "query": "optimiser images",
  "category": "performance",
  "tag": "images",
  "project_id": "550e8400-…",
  "limit": 10
}
```

- Tous les champs optionnels ; défauts : `limit: 10` (0 autorisé = vide).
- `query` absent → énumération filtrée `matchType: "list"` ; présent →
  `matchType: "fts"` (ou `"hybrid"` si un ranker sémantique est injecté,
  fusion RRF k = 60).
- Réponse : `{ query?, count, total, results[], summary }` — `summary` est le
  résumé Markdown destiné à l'agent, `results` le JSON structuré.

### `add_best_practice` (écriture)

```json
{
  "title": "Utiliser le lazy loading",
  "description": "Ajouter loading=lazy aux images et iframes hors viewport",
  "category": "performance",
  "tags": ["lazy-loading"]
}
```

- `title` ≥ 3 caractères, `description` ≥ 10, `category` ∈ 6 valeurs,
  `tags` 0-30 éléments non vides.
- Réponse : `{ practice, summary }` ; `practice.isManual = true` toujours.
- Violations → erreur MCP `-32602` avec le détail des champs.

## Interprétation des scores

- **`score` FTS** : normalisation `|rank| / max|rank|` (BM25 négatif, plus
  négatif = meilleur → meilleur match = 1).
- **`score` RRF** : `Σ 1/(60 + rang)`, borné 0-1 via `2/(61)`.
- **Confiance d'association** : ≥ 0.5 pour être créée ; visible via
  `show` → « Findings associés ».

## Performance

- Extraction < 5 s pour 100 audits (C15.13, testé en intégration) ;
- Recherche < 100 ms pour 1 000 pratiques (C15.14, testé) ;
- L'extraction est **idempotente** : une 2e passe fusionne (occurrence +1) sans
  recréer.

## Vérification

```bash
npx tsc --noEmit        # 0 erreur
npx eslint .            # 0 problème
npx vitest run tests/best-practices/ tests/cli/best-practice.test.ts tests/mcp/tools/ tests/integration/best-practices-integration.test.ts
```

## Dépannage

| Symptôme | Cause | Action |
| --- | --- | --- |
| `extract` = 0 audit | projet sans audits | `npx ekts project run <id>` |
| Extraction = 0 partout | aucun finding résolu (score non amélioré, < 2 occurrences) | vérifier l'historique, relâcher `--min-occurrences` |
| `search` = 0 | index FTS vide (créations avant migration ?) | relancer un `extract`/`add` (triggers 005) |
| code 1 sur `delete` | pas de `--yes` | ajouter `--yes` |
| code 3 | UUID inconnu | `list --json` pour récupérer l'ID |

## Récupération et sécurité

- Données uniquement dans `dataDir` (`best_practices`, `finding_best_practice`)
  ; supprimer une pratique retire ses liens en cascade (FK 005).
- Aucun réseau ni clé requis ; entrées validées (Zod côté MCP, validateurs
  maison côté CLI) avant toute écriture SQLite.
- `add_best_practice` est le **seul** outil d'écriture du module
  (`readOnlyHint: false`).

## API TypeScript

```ts
import { BestPracticeService } from './src/best-practices/best-practice-service.js';

const service = new BestPracticeService(connection);
const practice = service.create({ title, description, category, tags });
const report = service.extractFromProject(projectId);
const hits = service.searchPractices({ query: 'images', limit: 10 });
```

Voir `docs/API_REFERENCE.md`, section « API best-practices ».
