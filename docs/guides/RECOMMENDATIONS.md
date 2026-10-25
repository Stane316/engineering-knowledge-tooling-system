# Recommandations Contextuelles — Guide utilisateur (Sprint 16)

## Vue d'ensemble

EKTS ne se contente plus d'analyser : il **conseille**. Le moteur de
recommandations contextuelles croise deux sources (ADR-036) :

1. **Règles explicites** — table `recommendation_rules` (dimension, sévérité,
   pattern → recommandation) que vous gérez vous-même ;
2. **Scoring statistique** — findings récurrents (≥ 3 occurrences) analysés
   avec fréquence, historique de résolutions et tendances.

Chaque recommandation reçoit un **score de pertinence (0-1)** ajusté par le
contexte du projet (ADR-037) : régression de dimension (+0.1), amélioration
(−0.1), finding déjà résolu (−0.2), finding persistant malgré les tentatives
(+0.15). Le tout est trié par pertinence décroissante, dédupliqué par titre et
persisté pour être consultable.

## Comment ça marche ?

```
Audits du projet ─┐
Tendances (S14) ──┼──► Contexte projet ──► Règles (0.8 + sévérité) ─┐
Bonnes pratiques ─┘              │                                  ├──► Fusion + tri ──► top N
                                 └──► Statistique (0.5+freq×0.3) ────┘
```

- **Règle applicable** : dimension `general` ou identique, sévérité du finding
  ≥ seuil, pattern présent (égalité, inclusion ou mots-clés après
  normalisation) ;
- **Statistique** : finding récurrent, score `0.5 + (fréquence / max) × 0.3`,
  bonus +0.05 si une bonne pratique du Sprint 15 est associée (titre proposé
  « Appliquer la bonne pratique : … ») ;
- **Persistance** : chaque `generate` purge les recommandations du projet puis
  les réécrit (régénération idempotente).

## Commandes CLI

```bash
# Générer (rapport + persistance) — code 0/3/4
npx ekts recommend generate <projectId> --json
npx ekts rec generate <projectId> -n 5 --min-score 0.5 \
  --dimensions performance,seo --no-statistical

# Lister les recommandations persistées — code 0/3/4
npx ekts recommend list <projectId> -n 20 --json

# Gérer les règles (C16.11) — code 0/1/4 + 2 usage
npx ekts rec rules list -d performance --active --json
npx ekts rec rules add -n "Images WebP" --dimension performance \
  --severity 2 --pattern "images non optimisées" \
  --rec-title "Optimiser les images" --rec-desc "Convertir en WebP" \
  --effort 2 --impact 4 --priority high
npx ekts rec rules toggle <ruleId>
npx ekts rec rules delete <ruleId> --yes
```

| Sous-commande | Codes retour |
| --- | --- |
| `generate <projectId>` | 0 (y compris rapport vide), 3 (projet absent), 4 (UUID, `--max` 1-500, `--min-score` 0-1, dimensions) |
| `list [projectId]` | 0 (vide), 3 (projet absent), 4 (projectId requis/UUID/`--limit`) |
| `rules list` | 0 (vide), 4 (dimension, limit) |
| `rules add` | 0, 2 (champs requis), 4 (dimension, priorité, sévérité 0-4, effort/impact 1-5) |
| `rules delete <id>` | 0, 1 (sans `--yes`), 4 (UUID, règle absente) |
| `rules toggle <id>` | 0, 4 (UUID, règle absente) |

Ordre des validateurs : options invalides = **4** avant tout contrôle de
ressource (une entrée invalide sort toujours en 4). Alias `rec` équivalent.

## Outil MCP

### `get_recommendations` (C16.10)

```json
{
  "project_id": "550e8400-…",
  "max_recommendations": 10,
  "min_relevance_score": 0.3,
  "dimensions": ["performance"],
  "include_rules": true,
  "include_statistical": true
}
```

- `project_id` obligatoire (UUID) ; autres champs optionnels avec défauts
  (10 / 0.3 / true / true) ;
- réponses : résumé Markdown `## Recommandations contextuelles` (source 📏
  règle / 📊 statistique) + JSON structuré `{ projectId, totalRecommendations,
  rulesApplied, statisticalRecommendations, durationMs, recommendations[] }` ;
- entrées invalides → erreur MCP `-32602` (UUID, bornes, enum dimensions) ;
- régénération idempotente : chaque appel purge et réécrit les
  recommandations du projet.

## Score de pertinence

| Élément | Valeur |
| --- | --- |
| Base règle explicite | 0.8 |
| Bonus sévérité du finding | +0.15 × (sévérité / 4) |
| Base statistique | 0.5 + (fréquence / fréquence max) × 0.3 |
| Bonus bonne pratique associée | +0.05 |
| Dimension en régression / amélioration | +0.1 / −0.1 |
| Finding résolu (taux ≥ 0.8) / persistant (taux ≤ 0.2) | −0.2 / +0.15 |
| Bornage final | clamp [0 ; 1] ; priorité : ≥0.85 critical, ≥0.7 high, ≥0.5 medium |

Seuils réglables dans le code via `EngineConfig`
(`DEFAULT_ENGINE_CONFIG`, `src/recommendations/recommendation-rules.ts`).

## Intégration dans les rapports

- **Markdown** : section « 🧭 Recommandations contextuelles » en fin de
  rapport si le générateur reçoit le moteur (`new MarkdownReportGenerator(engine)`)
  et que l'audit porte un `projectId` ;
- **PDF** : même section sur une nouvelle page, bordure colorée par priorité,
  HTML échappé ;
- section **optionnelle** : jamais de blocage si le moteur échoue ou si aucune
  recommandation n'atteint 0.5 ;
- filtre `includeSections: ['context-recommendations']` pour la contrôler.

## Exemples

### Exemple 1 — Générer puis inspecter

```powershell
$p = npx ekts recommend generate <uuid> --json | ConvertFrom-Json
$p.totalRecommendations
p.recommendations[0] | Select-Object recommendationTitle, relevanceScore, priority
$LASTEXITCODE
```

### Exemple 2 — Filtrer par dimension

```powershell
npx ekts rec generate <uuid> --dimensions seo,ux -n 5
npx ekts rec rules list -d seo --active
```

### Exemple 3 — Agent IA

`get_recommendations` avec `min_relevance_score: 0.5` pour ne remonter que
l'essentiel actionnable ; le résumé Markdown est directement consommable.

## Cas limites (C16.20)

- **0 audit** : rapport vide (code 0, résumé explicite) ;
- **1 audit** : règles applicables, pas de scoring statistique, tendances
  `stable` ;
- **projet sans historique** idem ; aucune commande ne plante.

## Performance

- Génération < 5 s pour 100 audits (C16.13, test d'intégration) ;
- 1 000 règles testées sans dégradation (index SQLite dimension/actif —
  C16.14 couvert par `idx_recommendation_rules_*`) ;
- recherche `listRules({isActive:true})` indexée, jamais de scan complet.

## Vérification

```bash
npx tsc --noEmit        # 0
npx eslint .            # 0
npx vitest run tests/recommendations/ tests/cli/recommend.test.ts tests/mcp/tools/get-recommendations.test.ts tests/integration/recommendations-integration.test.ts
```

## Dépannage

| Symptôme | Cause | Action |
| --- | --- | --- |
| `generate` = 0 reco | projet sans audit ou score < `--min-score` | audits présents ? `--min-score 0.3` |
| Règle jamais déclenchée | pattern non matché / sévérité < seuil / inactif | `rules list --active`, vérifier pattern/seuil |
| code 1 sur `delete` | pas de `--yes` | ajouter `--yes` |
| code 3 | projet/règle absent | `list --json`, UUID complet |
| code 4 | option invalide | bornes du tableau ci-dessus |
| Rapport sans section | générateur sans moteur ou audit sans projet | `new MarkdownReportGenerator(engine)`, `metadata.projectId` |

## Récupération et sécurité

- Données locales uniquement : `recommendation_rules`,
  `generated_recommendations` (migrations `006`, version schéma v6) ;
- suppression d'une règle : ses recommandations historiques sont conservées
  (`rule_id → NULL`) ;
- confirmation obligatoire pour `rules delete` (`--yes`, code 1 sans) ;
- aucune clé réseau requise ; entrées validées (Zod MCP, validateurs CLI)
  avant écriture.

## API TypeScript

```ts
import { RecommendationEngine } from './src/recommendations/recommendation-engine.js';
import { RecommendationContext } from './src/recommendations/recommendation-context.js';

const engine = new RecommendationEngine(connection, new RecommendationContext(connection, bp));
engine.addRule({ /* CreateRecommendationRuleInput */ });
const report = engine.generateRecommendations(projectId, { maxRecommendations: 5 });
```

Voir `docs/API_REFERENCE.md`, section « API recommendations ».
