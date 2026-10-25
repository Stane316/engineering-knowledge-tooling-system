# Rapport Sprint 14 — Suivi Temporel

**Date de clôture :** 25/10/2026  
**Statut :** ✅ TERMINÉ  
**Durée réelle :** 3 jours (prevu : 9 jours)  
**Branch :** `arena/079e2f26-engineering-knowledge-tooling` (règle permanente : jamais `agent/sprint-14`)

---

## 1. Synthèse

Le Sprint 14 a ajouté le suivi temporel des audits EKTS :

- **Analyse chronologique** des scores par dimension (5 dimensions + global), ordre
  croissant, fenêtres de dates inclusives (C14.1, C14.2).
- **Tendances** par régression linéaire : `improving` / `declining` / `stable`
  avec pente, confiance (r²) et recommandations (C14.3).
- **Alertes de régression** persistées (table `alerts`, migration `004`), création
  idempotente, résolution sans suppression ; alertes **non bloquantes** (C14.4,
  C14.14, C14.15).
- **Graphiques SVG/PNG** autonomes (codec maison, police bitmap embarquée) —
  export conforme C14.5, lisibilité C14.12.
- **CLI `ekts timeline`** (4 sous-commandes : `analyze`, `trends`, `alerts`,
  `chart`) — C14.6.
- **Outil MCP `get_timeline`** (12ᵉ outil, lecture seule, défauts Zod, résumé
  Markdown + JSON structuré) — C14.7.
- **Performances** : analyse 50 audits < 2 s, détection < 1 s (mesuré en
  intégration) — C14.8, C14.9.
- **Documentation** : guide `docs/guides/TIMELINE.md`, `CLI.md` §13, `MCP.md`
  §17, `API_REFERENCE.md` (section timeline) — C14.11.
- **Cas limites 0 / 1 / erroné** couverts (CLI, MCP, intégration) — C14.15.

**Validation** : `npm run verify` → **EXIT 0** — 1 342 tests passés / 34 skippés
(1 376), couverture **96,83 % statements / 92,51 % branches / 98,01 % fonctions /
97,07 % lignes** (> 96 % exigé, > 80 % C14.10).

---

## 2. Fichiers créés

### Sous-sprint 14-1 (`d903f9e`, CI `40225568160` ✓)

- `src/timeline/timeline.types.ts` — types (`TimelineAnalysis`, `DimensionTimeline`, `Trend`, `Regression`)
- `src/timeline/timeline-analyzer.ts` — séries chronologiques (+ filtres `start`/`end`/`limit` ajoutés en 14-3)
- `src/timeline/trend-detector.ts` — régression linéaire, tendances, régressions
- `src/storage/audit-repository.ts` — `listByProject` (ajout)
- `tests/timeline/timeline-analyzer.test.ts` — 10 tests
- `tests/timeline/trend-detector.test.ts` — 10 tests
- `SPRINT-14-01-RESULTAT.md`

### Sous-sprint 14-2 (`11370d4`, CI `40226898426` ✓)

- `src/data/migrations/004_alerts.ts` + `src/data/migrations/index.ts` (v4)
- `src/storage/{types,alert-repository}.ts`
- `src/timeline/{alert-manager,chart-generator}.ts`
- `tests/timeline/{alert-manager,chart-generator}.test.ts` — 16 tests (36 timeline cumulés)
- `SPRINT-14-02-RESULTAT.md`

### Sous-sprint 14-3 (ce rapport)

- `src/cli/commands/timeline.ts` — commande + 4 sous-commandes
- `src/mcp/tools/get-timeline.ts` — `executeGetTimeline`
- `tests/cli/timeline.test.ts` — 17 tests
- `tests/mcp/tools/get-timeline.test.ts` — 7 tests
- `tests/integration/timeline-integration.test.ts` — 3 tests (perf + cas limites + alertes)
- `docs/guides/TIMELINE.md` — guide utilisateur (spec §3.4 le place en `docs/user/` : inexistant, guide retenu)

## 3. Modifications

- `src/cli/program.ts` — `registerTimelineCommands`
- `src/mcp/context.ts` — `TimelineToolServices` + `context.timeline` (analyzer, detector, alertRepository, alertManager, chartGenerator)
- `src/mcp/schemas/tool-schemas.ts` — `GetTimelineInput` (Zod), `GetTimelineParams`, `TOOL_DESCRIPTIONS.get_timeline`, `TOOL_NAMES` → 12
- `src/mcp/handlers/tools.ts` — import, `TOOL_DEFINITIONS`, `case 'get_timeline'`, `registerTools` (readOnly)
- `src/timeline/timeline-analyzer.ts` — options `start`/`end` (fenêtres inclusives)
- Tests catalogue 11 → 12 : `tests/mcp/{server,handlers/tools,schemas/tool-schemas}.test.ts`, `tests/mcp/integration/stdio.test.ts`
- `docs/CLI.md` §13, `docs/MCP.md` §17 (+ « Vérification (12 outils) »), `docs/API_REFERENCE.md` (« 12 outils » + « API timeline »)
- Statuts : `SPRINT-14{,-01,-02,-03}.md` → ✅ ; `REGISTRE-AVANCEMENT.md` (S14 + rattrapage statuts S13)

## 4. Tests

| Bloc | Tests | Résultat |
| --- | --- | --- |
| `tests/timeline/` | 36 | ✅ 14-1 + 14-2 |
| `tests/cli/timeline.test.ts` | 17 | ✅ |
| `tests/mcp/tools/get-timeline.test.ts` | 7 | ✅ |
| `tests/integration/timeline-integration.test.ts` | 3 | ✅ |
| `tests/mcp/` global | 132 | ✅ (catalogue 12) |
| **`npm run verify`** | **1 342 passés / 34 skippés** | **EXIT 0** |
| Couverture globale | 96,83 / 92,51 / 98,01 / 97,07 | ✅ > 96 % |

### Critères C14.1 → C14.15

| # | Critère | État | Preuve |
| --- | --- | --- | --- |
| C14.1 | Timeline ordre chronologique | ✅ | analyzer + tests |
| C14.2 | 5 dimensions | ✅ | `dimensionScores` (5) |
| C14.3 | improving/declining/stable | ✅ | trend-detector (±2 pts, r²) |
| C14.4 | Alertes > 10 points | ✅ | `--threshold` défaut 10, idempotence |
| C14.5 | Export PNG/SVG | ✅ | `chart --format`, intégration |
| C14.6 | CLI `ekts timeline <project>` | ✅ | 4 sous-commandes |
| C14.7 | MCP `get_timeline` | ✅ | 12ᵉ outil, tests |
| C14.8 | < 2 s / 50 audits | ✅ | intégration (mesuré, marge CI) |
| C14.9 | détection < 1 s | ✅ | intégration (mesuré) |
| C14.10 | couverture > 80 % | ✅ | 96,83 % global |
| C14.11 | lint | ✅ | eslint 0 problème |
| C14.12 | graphiques lisibles | ✅ | légende, grille, couleurs, police embarquée |
| C14.13 | alertes non bloquantes | ✅ | analyse vide = code 0, lecture seule MCP |
| C14.14 | doc | ✅ | TIMELINE + CLI §13 + MCP §17 + API |
| C14.15 | cas limites 0/1/erroné | ✅ | intégration + tests CLI/MCP |

## 5. Décisions prises

1. **Branche** : travail sur `arena/079e2f26-engineering-knowledge-tooling` — le
   prompt specifiait `git push origin agent/sprint-14` (**contradiction P3,
   non suivie** : règle permanente de la session).
2. **`context.timeline`** : services construits dans `openMcpServices` (connexion
   déjà ouverte, pattern `openAuditServices` côté CLI) ; `McpToolContext` enrichi
   plutôt que fabriqué à la volée dans l'outil.
3. **CLI indépendante** : chaque commande timeline ouvre sa base locale
   (`openDatabase({dataDir})` + `AuditSchema`) — aucun ajout à `CliServices`.
4. **`chart` exige `<projectId>`** (Commander → code 2) au lieu d'un message
   custom ; **`--check` ajouté** à `alerts` (la spec MCP restait lecture seule :
   écart P3 assumé pour rester homogène avec la CLI qui doit pouvoir créer les
   alertes, C14.4).
5. **Bornes de dates** : `--start` / `start_date` = 00:00:00.000 ; `--end` /
   `end_date` = 23:59:59.999 (jour **inclusif**) ; `start > end` →
   `ValidationError` → code 4 / erreur MCP.
6. **Forme JSON CLI** : analyse/tendances sans `projectId` → enveloppe
   `{count, timelines}` (même pour un seul projet) ; avec `projectId` → objet
   direct (contrat stable, pas de branchement sur le nombre de résultats).
7. **Défauts Zod transmis tels quels** : `lookback_days`/`threshold`/booleans ont
   des défauts (`inputSchema.strict()`, rejet des clés à `undefined`) — le SDK
   MCP omet les champs absents ; documenté pour le chat-playground.
8. **Catalogue 11 → 12** : `TOOL_NAMES`, descriptions, titres de tests,
   `"tools":12` stdio ; `get_timeline` = `readOnlyHint: true` (nettoyage du
   commentaire « neuf autres en lecture »).
9. **Alertes sur toutes les séries** : `detectRegressions` produit des
   régressions pour les 5 dimensions **et** le global ; `checkAndCreateAlerts` en
   crée une par écart (6 créées sur un effondrement uniforme) — idempotence
   assurée par (dimension, date, écart).

## 6. Problèmes rencontrés

1. **Specs 14-3 = APIs inexistantes** (`getDatabase`, `analyzeProject`,
   `analyzeTrends(lookbackDays)`, `trendReport.regressions`, `console.log`) →
   réécriture alignée sur les modules 14-1/14-2 livrés (signalé, non appliqué
   littéralement).
2. **Emplacement guide** : spec = `docs/user/TIMELINE.md` (dossier absent) →
   `docs/guides/TIMELINE.md` (prompt utilisateur + structure réelle).
3. **`single` utilisé avant déclaration** après réorganisation du handler
   `analyze` → déplacé avant le rendu humain (typecheck 0 ensuite).
4. **Borne `end` à minuit** excluait le dernier jour (tests CLI/MCP → 1 au lieu
   de 2) → `23:59:59.999` côté CLI et MCP.
5. **Catalogue d'outils éclaté** : 4 fichiers de tests + commentaire
   « onze outils » (instructions serveur incluses) → migration en 12 systématique.
6. **Assertion `--resolve`** supposait une seule alerte (régression globale =
   6 alertes réelles) → comptes relatifs (`count-1` après résolution).
7. **Linter** : `insufficient` devenu mort après refonte + imports inutilisés →
   purgés avant verify (lint 0).

## 7. Recommandations Sprint 15 (Capitalisation — transverses et templates)

1. **Ordre de démarrage** : lire `SPRINT-15.md` + `SPRINT-15-01.md` en entier
   avant toute écriture (même discipline qu'ici : patterns d'abord).
2. **Branche** : continuer sur `arena/079e2f26-engineering-knowledge-tooling`
   (le prompt S15 mentionnera `agent/sprint-15` → contradiction à signaler, non
   suivre) ; 1 commit / sous-sprint ; verify 0 avant chaque push.
3. **Réutiliser les contrats S14** : fixtures `openDatabase({dataDir})` +
   `AuditSchema` + `ProjectRepository.create`, pattern `execute`/`withOutputFlags`,
   registre d'outils MCP en 5 points, tests catalogue à mettre à jour si le nombre
   d'outils change encore.
4. **Transverses** : les « best practices » (15-1) s'aligneront sur le dépôt de
   templates (15-2) : prévoir migration `005` + repository+search dans la même
   grammaire que `alert-repository` (types filtres + `list`/`find`), éviter les
   FK audits (leçon 14-2 : les FK ne se testent qu'à l'usage).
5. **Docs** : suivre le découpage S12 (`docs/guides/`) + références
   (`CLI.md`/`MCP.md`/`API_REFERENCE.md`) ; prévoir l'outil MCP 13 s'il existe
   (catalogue → 13 : mêmes 5 points d'enregistrement).
6. **Couverture** : viser ≥ 96 % (maintenu) ; écrire les tests de performance
   comme en intégration timeline (mesures bornées avec marge CI ×2).
7. **À contrôler en amont S15** : les lignes S13 du registre stageé affichaient
   « Non commencé » malgré le VALIDÉ (corrigé ici avec statuts) — vérifier après
   merge develop qu'aucune régression de statut n'est réintroduite.

---

**Rapport rédigé le 25 octobre 2026 — Sprint 14 terminé**  
**Prochaine étape : feu vert utilisateur requis pour Sprint 15**
