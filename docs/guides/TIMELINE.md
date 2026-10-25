# Suivi Temporel (Sprint 14)

## Objectif

Analyser l'évolution de la qualité d'un projet au fil des audits : séries de
scores par dimension, tendances (amélioration / régression / stable), alertes
de régression, graphiques SVG ou PNG. Le suivi temporel est **non bloquant**
(C14.15) : une analyse pauvre en données (0 ou 1 audit) renvoie des résultats
partiels, jamais une erreur.

**Livrable** : guide utilisateur du suivi temporel (CLI `ekts timeline`, outil
MCP `get_timeline`, API `TimelineAnalyzer` / `TrendDetector` / `AlertManager` /
`ChartGenerator`).

## Prérequis

- Projet existant : `npx ekts project create "Mon site"` → UUID (ou nom dans
  la CLI).
- Audits en base : `npx ekts project run <id|nom>`.
- Installation effectuée (`npx ekts init`).

## Concepts

| Notion | Définition |
| --- | --- |
| **Timeline** | Séries `(auditId, date, score, findingsCount)` par dimension et en global, ordre chronologique (C14.1). |
| **Tendance** | Régression linéaire sur les scores récents : `improving` si pente > +2 pts/pas, `declining` si < −2, sinon `stable` ; `confidence` = r². |
| **Régression** | Perte de score > `threshold` (défaut **10** points) entre deux audits consécutifs d'une dimension (C14.4). |
| **Alerte** | Persistance d'une régression dans la table `alerts` (migration `004_alerts`) ; création **idempotente** par écart/date. |
| **Fenêtre** | `--start` inclus au début de journée ; `--end` inclus en **fin de journée** ; sans bornes, fenêtre glissante `--lookback` jours (défaut 90). |

## Commandes CLI

### Analyser la timeline

```bash
# Un projet (C14.6)
npx ekts timeline analyze <projectId|nom> --json

# Avec fenêtre de dates (borne end inclusive)
npx ekts timeline analyze <id> --start 2026-10-01 --end 2026-10-15

# Tous les projets
npx ekts timeline analyze --json

# Minimum d'audits attendu (informatif, non bloquant)
npx ekts timeline analyze <id> --min-audits 3
```

**Sortie (humaine)** : période, nombre d'audits, note moyenne min/max par
dimension ; avec `--min-audits`, un avertissement jaune si le minimum n'est pas
atteint. **Sortie (`--json`)** : `{ projectId, projectName, totalAudits,
dimensionScores[], minAudits }` ; sans `projectId` : `{ count, minAudits,
timelines[] }`.

**Codes retour** : `0` succès (y compris analyse vide), `1` inattendu,
`2` usage (argument manquant), `3` projet introuvable,
`4` entrée invalide (date, entier borné, `start > end`).

### Détecter les tendances

```bash
# Fenêtre 90 jours et seuil 10 (défauts)
npx ekts timeline trends <id> --json

# 180 jours, seuil 15
npx ekts timeline trends <id> --lookback 180 --threshold 15
```

**Sortie** : `trends[]` (dimension, direction, slope, confidence,
description), `overallTrend`, `recommendations[]`, `regressions[]` (au-dessus
du `--threshold`), `threshold`, `lookbackDays`.

### Gérer les alertes (C14.4, non bloquantes)

```bash
# Détecter les régressions et créer les alertes manquantes (idempotent)
npx ekts timeline alerts <id> --check --json

# Alertes actives (défaut)
npx ekts timeline alerts <id> --json

# Toutes, y compris résolues
npx ekts timeline alerts <id> --all --json

# Résoudre (UUID, code 4 si déjà résolue ou format invalide)
npx ekts timeline alerts --resolve <alertId> --json
```

### Générer un graphique (C14.5, C14.12)

```bash
# SVG multi-dimensions (défaut) — argument obligatoire du projet (code 2 sinon)
npx ekts timeline chart <id> --output evolution.svg

# PNG avec options graphiques (dimensions validées : code 2 hors choix)
npx ekts timeline chart <id> --format png --dimension performance \
  --width 1200 --height 600 --output perf.png --json
```

**Dépannage graphique** : `width`/`height` bornées `80×80` à `4000×3000`
(code `4` sinon) ; sortie refusée si le répertoire n'existe pas (code `1`,
message du système de fichiers).

## Outil MCP `get_timeline` (C14.7)

```json
{
  "project_id": "uuid-du-projet",
  "start_date": "2026-10-01",
  "end_date": "2026-10-15",
  "lookback_days": 90,
  "threshold": 10,
  "include_alerts": true,
  "include_charts": false
}
```

**Paramètres** : `project_id` requis ; `start_date` / `end_date`
(`YYYY-MM-DD`) ; `lookback_days` défaut 90 ; `threshold` défaut 10 ;
`include_alerts` défaut `true` ; `include_charts` défaut `false` (ajoute le
SVG complet dans `charts.svg`). Les défauts sont appliqués par le schéma Zod
lorsque les champs sont absents — ne transmettez pas `undefined` (rejeté par
`strict`), préférez l'omission.

**Réponse (JSON)** : `period`, `dimensions[dim]{averageScore,min,max,scores}`,
`trends[dim]{direction,slope,confidence,description}`, `overallTrend`,
`regressions[]`, `summary` (Markdown : période, compteurs de tendances,
régressions > seuil), optionnellement `alerts{active,list}` et `charts.svg`.

**Erreurs** : `project_id` absent → `PROJECT_NOT_FOUND` (code MCP `-32000`) ;
champs invalides → `-32602` ; fenêtre `start_date > end_date` → erreur
métier `ValidationError` portée par le gestionnaire.

## API TypeScript

```ts
import { TimelineAnalyzer } from './src/timeline/timeline-analyzer.js';
import { TrendDetector } from './src/timeline/trend-detector.js';
import { AlertManager } from './src/timeline/alert-manager.js';
import { ChartGenerator } from './src/timeline/chart-generator.js';

const analyzer = new TimelineAnalyzer(connection);
const analysis = await analyzer.analyze(projectId, { start, end, limit });
// analysis.dimensionScores[i].scores : [{auditId, date, score, findingsCount}]

const detector = new TrendDetector();
const report = detector.detectTrends(analysis); // Map<dimension, Trend>
const regressions = detector.detectRegressions(analysis, 10);

const charts = new ChartGenerator();
const svg = charts.generateTimelineChart(analysis, 'svg');
const png = charts.generateDimensionChart(analysis, 'performance', 'png');
```

Voir `docs/API_REFERENCE.md` (section « API timeline ») pour les types.

## Interprétation

- **Tendances** : `slope` > +2 → 📈 amélioration ; < −2 → 📉 régression ;
  entre → ➡️ stable (fenêtre = derniers scores disponibles).
- **Alertes** : seuil réglable (`--threshold`), conservation aux archives ;
  la résolution ne supprime rien. Une alerte jamais créée (registre vide) ne
  bloque rien.
- **Graphiques** : une couleur par dimension, points = audits, légende, grille ;
  le PNG embarque une police bitmap 5×7 intégrée (aucune police système).

## Vérification

```bash
npx tsc --noEmit                          # 0 erreur
npx eslint .                              # 0 problème
npx vitest run tests/cli/timeline.test.ts tests/mcp/tools/get-timeline.test.ts tests/timeline/
```

Attendu : tous les tests verts (17 CLI + 7 MCP + 36 timeline au 14-2).

## Récupération et sécurité

- **Récupération** : les alertes ne sont que de la donnée SQLite
  (`data/ekts.db`) ; supprimer une ligne `alerts` est sans risque (recréable via
  `alerts --check`). Aucune écriture hors `dataDir`.
- **Sécurité** : aucune clé ni réseau requis ; entrées validées (UUID, dates,
  bornes entières) avant d'atteindre SQLite — en cas de saisie invalide la CLI
  renvoie le code `4` sans toucher à la base.
