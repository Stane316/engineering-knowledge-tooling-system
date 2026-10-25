# Guide Développeur — Engineering Knowledge Tooling System

> MVP-2 — version 2.0.0 · Vue d'approfondissement de
> [`02-ARCHITECTURE-TECHNIQUE`](blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)

## Sommaire

1. [Architecture](#architecture)
2. [Arborescence](#arborescence)
3. [Démarrage rapide](#démarrage-rapide)
4. [Couches métier](#couches-métier)
5. [Flux de données](#flux-de-données)
6. [CLI](#cli)
7. [MCP](#mcp)
8. [Tests](#tests)
9. [Qualité et outillage](#qualité-et-outillage)
10. [Git et conventions](#git-et-conventions)
11. [Sécurité](#sécurité)
12. [Performance](#performance)
13. [Aide-mémoire de dépannage dev](#aide-mémoire-de-dépannage-dev)

**Sections complémentaires** : [Configuration](#configuration) ·
[Gestion des erreurs et journalisation](#gestion-des-erreurs-et-journalisation) ·
[Ajouter une commande CLI](#ajouter-une-commande-cli) ·
[Ajouter un outil MCP](#ajouter-un-outil-mcp) ·
[Ajouter un test](#ajouter-un-test-bonnes-pratiques) ·
[Cycle de vie, version et livraison](#cycle-de-vie-version-et-livraison)

---

## Architecture

Architecture modulaire TypeScript **stricte** (ESM, `type: module`), en cottes
indépendantes reliant un noyau métier à deux fronts :

```
        ┌──────────────────────────────────────────┐
        │        Fronts : CLI (commander)          │
        │        + MCP (SDK @modelcontextprotocol) │
        └────────────────┬─────────────────────────┘
                         ▼
┌───────────────────────────────────────────────────────────────┐
│ Business : AnalysisPipeline (5 dimensions, poids, sévérité)   │
│            AuditComparator (deltas, tendance, recommandations)│
│            providers / gateway / search-engine (RRF hybride)  │
├───────────────────────────────────────────────────────────────┤
│ Inspection : Inspector L1-L3 = Navigator (Playwright)         │
│              + Lighthouse + axe-core + UX + contenu           │
├───────────────────────────────────────────────────────────────┤
│ Rapports : MarkdownReportGenerator · PDFReportGenerator       │
│            templates (md, html, comparaison)                  │
├───────────────────────────────────────────────────────────────┤
│ Données : SQLite (better-sqlite3) — ressources, audits,       │
│           FTS5 + sqlite-vec, migrations, repositories         │
└───────────────────────────────────────────────────────────────┘
```

Points d'architecture détaillés (ADR inclus) :
`docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` et
`docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`.

Principes structurants (ancrages) :

- **Injection de dépendances en profondeur** : aucune dépendance externe
  appelée depuis `src/core/` — les limites mondiales (browser, providers,
  fs) arrivent en paramètres. C'est ce qui rend la suite zéro réseau et
  multi-plateforme.
- **Fronts minces** : CLI et MCP ne font que parser/valider/ordonner ; toute
  la logique vit dans les couches métier, réutilisable à l'identique par les
  deux fronts (et par les tests).
- **Dégradation assumée** : inspecteurs et indexation renvoient statuts +
  erreurs typées (jamais d'exception muette) ; l'appelant décide
  (retry, skip, message utilisateur).
- **Schéma unique de vérité** : la base SQLite est la source des audits ;
  rapports, comparaisons, statistiques, CLI et MCP ne font que la
  projeter.

## Arborescence

```
src/
├── browser/            # Navigation, inspecteurs L1-L3, lighthouse, axe
├── analysis/           # Pont inspection → 5 dimensions, pipeline, matrice sévérité
├── business/           # Knowledge manager, recherche hybride, providers (embeddings/chat)
├── storage/            # Repos audits/ressources, FTS, vecteurs, statistiques
├── data/               # Connexion, schéma, migrations SQLite
├── reports/            # Générateurs Markdown/PDF, comparateur, templates
├── cli/                # program, runtime, commands/ (10 commandes)
├── mcp/                # server, context, handlers, schemas (Zod), tools/
├── shared/             # config, env, errors, logger, validators, version
├── index.ts            # Point d'entrée programme
└── cli|server|mcp ...  # Entrées binaires
tests/
├── unit|browser|analysis|storage|integration|reports|cli|mcp|e2e/
docs/                   # Guides (voir docs/DOCS.md pour l'index)
```

## Démarrage rapide

```bash
npm ci                 # scripts de cycle de vie désactivés (voir .npmrc)
npm run build          # tsc -p tsconfig.build.json → dist/
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format         # prettier --write .
npm test               # vitest run (toute la suite)
npm run coverage       # vitest + seuils 80 % (v8)
npm run verify         # typecheck + lint + format:check + build + coverage
```

Scripts métier utiles :

```bash
npm run doctor         # diagnostic environnement
npm run check:env      # contrôle variables et fichiers
npm run providers      # état des fournisseurs/clés (sortie à ne jamais copier)
npm run db:inspect     # inspection de la couche données
npm run db:reindex     # réindexation
npm run browsers:install  # playwright install chromium firefox webkit
npm run cli -- status  # CLI sans installation globale
npm run mcp            # serveur MCP stdio (après build)
```

## Configuration

Configuration maison (`src/shared/config.ts` + `src/shared/env.ts`) :

| Variable | Rôle | Défaut / notes |
|----------|------|----------------|
| `EKTS_DATA_DIR` | Répertoire des bases SQLite | `data/` |
| `EKTS_OFFLINE` | Mode hors ligne (zéro réseau forcé) | tests, CI |
| `PUPPETEER_EXECUTABLE_PATH`, `EKTS_CHROME_PATH` | Chrome pour PDF/Lighthouse | ordre de résolution documenté dans `REPORTS.md` |
| Variables d'embeddings (`*_API_KEY`, modèles, `EKTS_EMBED_*`) | Recherche vectorielle | mode fts seul si absentes |
| Variables d'inspection (`*_TIMEOUT`, profondeur) | Budgets L1-L3 | valeurs par défaut alignées sur la spec |

Règles :

- Aucune variable secrète n'est requise pour démarrer le serveur MCP ni pour
  les tests unitaires/intégration (design « pas de clé pour démarrer »).
- `.env` n'est **jamais** lu pour les tests maison (fixture `env` bornée) ;
  le chargement réel est isolé et exclut la sortie des clés.
- Toute nouvelle variable : documentée ici, bornée, avec test de défaut.

## Gestion des erreurs et journalisation

### Erreurs typées

- `ValidationError(messages: string[])` — validation d'entrée, code CLI 4.
  Le constructeur attend un **tableau** ; message concaténé.
- Codes MCP : `-32602` (paramètres invalides via schéma), `-32000`
  (ressource absente), payloads `isError: true` structurés dans `content`
  (code + message), jamais d'exception brute exposée au client.
- CLI : conversion par `exitCodeFor()` (0/1/2/3/4) + `CliError` interne
  pour contrôler catégorie et code.

### Journalisation

- Logger maison (`src/shared/logger.ts`) : niveaux, sortie humaine par défaut,
  format JSON attendu côté machine, `--json` sur la CLI = sortie de données
  (pas de logs dans le stdout JSON).
- Les services MCP reçoivent le logger en injection (`McpContext.logger`) —
  pas de console directe dans les handlers.

## Ajouter une commande CLI

1. `src/cli/commands/` : classe étendant `BaseCommand` (ou fonction
   `execute()` du module `commande.ts`) avec `name`, `description`,
   `options()` en français, `action(runtime)`.
2. Entrées validées **avant** la logique métier ; retourner les codes 2/3/4
   via `CliError` (jamais de `process.exit` dispersé).
3. Enregistrer dans `program.ts` (`program.addCommand(…)`).
4. Support `--json` symétrique à la sortie humaine ; pas d'emoji si
   `--no-colors`.
5. Tests : `tests/cli/` — un test par chemin (succès, usage, validation,
   introuvable) avec `RuntimeFactory` injecté.
6. Mettre à jour `docs/CLI.md` + `docs/API_REFERENCE.md` dans le même commit.

## Ajouter un outil MCP

1. `src/mcp/schemas/tool-schemas.ts` : schéma Zod (bornes strictes,
   descriptions en français).
2. `src/mcp/handlers/` : handler async qui **ne lève jamais** — retourner le
   succès `{ content: [{ type:'text', text: JSON.stringify(payload) }] }` ou
   l'erreur structurée `McpError { code, message, data }`.
3. Enregistrer la déclaration + le nom dans `TOOL_NAMES` (`src/mcp/tools.ts`).
4. Brancher le dispatch dans `handlers/tools.ts`.
5. Tests : `tests/mcp/transport.test.ts` (contrat) + handler test —
   cas succès, cas `-32602`, cas `-32000`.
6. Documenter dans `docs/MCP.md` et `docs/API_REFERENCE.md` (même commit).

## Ajouter un test (bonnes pratiques)

```typescript
describe('storage : persistance des rapports', () => {
  it('retrouve l’audit persisté', async () => {
    const db = openDatabase({ dataDir: tmpdir() });       // fixture locale
    // arrange minimal, act réel (pas de mock de la mécanique testée)
    expect(result.id).toBeTypeOf('number');
    expect(new Set(result.x)).toEqual(new Set([...]));   // ordre non garanti
  });
});
```

- Placement : dossier thématique (`tests/storage/…`).
- `skipIf` seulement pour dépendances d'environnement (Chrome, moteurs),
  avec message affiché.
- Budget : < 5 s par test unitaire ; PDF isolés (cf. TROUBLESHOOTING §5).
- Pas d'appel réseau réel — sinon `EKTS_OFFLINE` non respecté et CI instable.

## Cycle de vie, version et livraison

- Version unique gérée (`src/shared/version.ts`) : `package.json`,
  `--version`, rapport statut — même source.
- Migrations : exécutées automatiquement à l'ouverture de la base
  (`src/data/migrations/`), idempotentes, versionnées par numéro.
- `npm run verify` = contrat de sortie de toute tâche ; relire les 5 sections
  de sortie (typecheck, lint, format, build, coverage) et non seulement le code.
- Benchmark : `npm run test:benchmark` avant/daprès toute modification
  d'indexation ou de recherche (attendu : < 100 ms/1000 audits en recherche).
- Livraison : tagging seulement sur `main` après fusion `develop` validée ;
  release note = rapport de sprint concerné.

---

---

## Couches métier

### Inspection (`src/browser/inspection/`)

- `Inspector.inspect(options)` : `{ url, level?, viewport? }` → `InspectionResult`
  (union discriminée L1/L2/L3, budgets 10 s / 30 s / 60 s).
- L3 produit les quatre blocs (`lighthouse`, `axe`, `ux`, `content`) + `seo`,
  nécessaires à l'analyse complète. Détails : `docs/INSPECTOR.md`.
- Dégradations volontaires : un bloc indisponible est `null` + `warnings[]`
  (les analyzers du pont lèvent une erreur claire si on tente de l'analyser).

### Analyse (`src/analysis/`)

- `fromInspection(l3)` convertit les blocs d'inspection en entrées d'analyse
  (types `LighthouseResults`, `AxeResults`, `UxResults`, `ContentResults`).
- `AnalysisPipeline.analyze(url, lighthouse, axe, ux, content)` →
  `AnalysisReport` : 5 dimensions, constats priorisés, résumé.
- Poids du score global : performance 25 %, accessibilité 25 %, SEO 20 %,
  UX 15 %, contenu 15 % ; matrice sévérité × effort × impact → priorité.
  Détails : `docs/ANALYSIS.md`.

### Données (`src/data/`, `src/storage/`)

- `openDatabase({ dataDir })` → connexion better-sqlite3 + migrations.
- Schéma audits : `AuditSchema` (audit_metadata, audit_dimensions,
  audit_findings) ; repositories `AuditRepository`, `AuditSearch`,
  `AuditStatisticsManager` ; `AuditIndexer` gère FTS + vecteurs
  (`IndexationOutcome { ftsRows, … }`).
- Recherche hybride : BM25 (FTS5) + cosine (sqlite-vec) fusionnés par RRF.
  Détails : `docs/STORAGE.md`.

### Providers (`src/business/providers/`, `gateway.ts`, `search-engine.ts`)

- **Gateway chat** : interface `ChatProvider` (messages + maxTokens + json ?),
  implémentations pour les fournisseurs du projet (OpenAI-compatible,
  Google, Mistral…), rate limits et cache ; résolution sans clé →
  `ProviderError` typé avec le nom du fournisseur.
- **Recherche hybride** (`search-engine.ts`) : RRF (k = 60) fusionnant BM25
  (FTS5) et cosine (sqlite-vec) ; modes `fts` pur (sans clé), `vector`,
  `hybrid` ; plafonds `MAX_SEARCH_LIMIT` (100 ressources) et
  `MAX_LIST_LIMIT` (1000) ; mode figé après la 1ʳᵉ recherche de session.
- **Statistiques** (`statistics.ts`) : agrégats (moyenne, tendance, top
  problèmes) injectables pour tests sans base.

### Business (`src/business/`)

- `KnowledgeManager` : façade ressources (add/update/delete/search/list),
  validation de nœud, espace d'embedding associé, reindexation.
- Toute persistance passe par les repositories (`AuditRepository`) :
  jamais d'SQL dispersé dans les fronts.

### Rapports (`src/reports/`)

- `MarkdownReportGenerator.generate(audit, { outputPath })` /
  `generateComparison(comparison, …)`.
- `PDFReportGenerator` résout Chrome dans cet ordre : chemin imposé →
  variables (`PUPPETEER_EXECUTABLE_PATH`, `EKTS_CHROME_PATH`) → Chrome
  embarqué Puppeteer → Chromium Playwright → chemins système ; sinon
  erreur « aucun Chrome résolvable ». Détails : `docs/REPORTS.md`.
- `AuditComparator.compare(auditA, auditB)` : evolution, deltaFindings,
  recommandations (seuil de tendance ±5 points).

## Flux de données

```
URL → Inspector (L3, réseau) → fromInspection → AnalysisPipeline
    → AuditRepository.store → AuditIndexer (FTS + vecteurs)
    → Markdown/PDF + AuditComparator → rapports
    → AuditSearch / AuditStatisticsManager / CLI / MCP
```

### Séquence type : `ekts inspect <url>`

1. `program.ts` → `InspectCommand.execute(runtime)` — validation URL/niveau
   (code 4 si L1/L2 pour l'audit), résolution du `dataDir` (runtime ou
   `EKTS_DATA_DIR`).
2. Ouverture base + migrations + `createSchema` (idempotent).
3. `Inspector.inspect({ url, level: 'L3' })` : navigation Playwright,
   Lighthouse, axe, UX, contenu → `L3InspectionResult` + `warnings[]`.
4. `fromInspection(...)` → entrées d'analyse ; `AnalysisPipeline.analyze(...)`
   → `AnalysisReport` (5 dimensions, constats, priorités).
5. `AuditRepository.store(report)` → `audit_id` ; `AuditIndexer.indexAudit`
   → FTS + vecteurs (vecteurs silencieusement omis sans configuration).
6. Générateurs Markdown/PDF selon `--format` ; `--json` final.
7. `database.close()` garanti (try/finally) — pas de verrou résiduel.

Même séquence appelée par `inspect_site` MCP (contexte ouvert partagé),
avec charge/fermeture gérées par `openMcpServices`/`closeMcpServices`.

### Séquence type : recherche hybride

1. Mode figé au premier appel (`fts` si aucun embedding configuré,
   sinon mode demandé).
2. `AuditSearch.search({ query, … })` : lexique → FTS5 ; requête vectorielle
   si mode vector/hybride et embeddings disponibles.
3. Fusion RRF (k = 60), bornes `MAX_SEARCH_LIMIT` / offset, pagination
   avec scores de correspondance.
4. Renvoi immuable (copie) : aucune mutation interne exposée au caller.

## CLI

- Entrée : `src/cli/index.ts` → `runCli(argv, runtime)` → `program.ts`.
- 10 commandes : `init`, `add`, `get`, `search`, `list`, `delete`, `status`,
  `reindex`, `inspect`, `audit` (sous-commandes `list`, `show`, `report`,
  `compare`).
- `execute()` (commande.ts) uniformise sorties humaines/JSON et erreurs ;
  `exitCodeFor()` : **0** succès · **1** erreur inattendue · **2** usage
  (Commander) · **3** ressource introuvable · **4** validation.
- Runtime injectable (sorties, horloge, dataDir) : testable sans process.
  Détails : `docs/CLI.md`.

| Fichier | Rôle |
|---------|------|
| `cli/index.ts` | Point d'entrée `runCli(argv, runtime?)` |
| `cli/program.ts` | Déclaration Commander + `execute()` |
| `cli/runtime.ts` | Sorties/horloge/dataDir injectés + `CliRuntimeFactory` |
| `cli/commande.ts` | `Command.execute()`, `exitCodeFor`, formats |
| `cli/commands/*.ts` | Une commande par fichier (10) |

## MCP

- `createEktsServer({ context, logger })` enregistre **7 outils**
  (`TOOL_NAMES`) ; validation Zod dans `schemas/tool-schemas.ts` ;
  `handlers/tools.ts` dispatche et normalise les erreurs (payloads
  `isError` avec code, jamais de texte brut du SDK).
- `openMcpServices({ dataDir, env, embeddings? })` ouvre la base UNIQUEMENT :
  connexion, schéma audits, recherches, statistiques — fermée par `close()`.
- Transport stdio (`npm run mcp`) ou en mémoire (tests).
  Détails : `docs/MCP.md`.

| Fichier | Rôle |
|---------|------|
| `mcp/index.ts` | `createEktsServer`, registre des outils |
| `mcp/context.ts` | `McpContext { database, services, logger }` |
| `mcp/handlers/tools.ts` | Dispatch + enveloppes de succès/erreur |
| `mcp/schemas/tool-schemas.ts` | Schémas Zod bornés (français) |
| `mcp/tools.ts` | Déclarations + `TOOL_NAMES` (7) |
| `mcp/resources.ts`, `mcp/prompts.ts` | Ressources/options de prompt SDK |
| `mcp/services.ts` | `openMcpServices` / `closeMcpServices` |
| `mcp/server.ts` | Binaire stdio (`npm run mcp`) |

## Tests

- Runner **Vitest 5** (`vitest.config.ts`) : timeout global 20 s,
  hook 30 s, include `tests/**/*.test.ts`.
- Répertoires et rôles :

| Dossier | Ce qu'il couvre |
|---------|-----------------|
| `unit/` | Logique pure : config, erreurs, analyse, validateurs, versions, catalogues |
| `browser/` | Inspecteurs, navigateur, budgets, auditable, catalogues d'URL |
| `analysis/` | Adaptateurs Lighthouse/SEO/UX, pipeline, inspecteurs vitals |
| `storage/` | Schéma, audit/ressources, vecteurs, statistiques, générateurs markdown |
| `integration/` | Parcours bout-en-bout maison (recherche + stats + business) |
| `reports/` | Modèles (placeholders), comparaison Markdown/PDF, générateur PDF |
| `cli/` | command.ts, program, runtime, modes json/humain |
| `mcp/` | context, transport stdio/mémoire, noms/limites/canaux d'outils |
| `e2e/` | 5 flux E2E MVP-2 (inspection, CLI, MCP, comparaison, workflow) |
- Règles maison :
  - **zéro réseau** : serveurs `127.0.0.1`, doubles de navigateur, `EKTS_OFFLINE=1` ;
  - fixtures locales plutôt que mocks quand la vraie mécanique est testable ;
  - `describe.skipIf` pour les capacités d'environnement (Chrome, moteurs) ;
  - assertions sur ensembles triés (ordre d'insertion non garanti).
- E2E (`tests/e2e/`) : 5 fichiers par flux (inspection, CLI, MCP, comparaison,
  workflow complet), page locale, binaire compilé réel pour la CLI.
- Seuils de couverture (v8) : **80 %** sur lignes/fonctions/branches/instructions.

## Qualité et outillage

```bash
npm run verify     # la barre avant tout push
npm run lint:fix   # auto-corrections ESLint
npm run format     # Prettier
npm run security:secrets  # Gitleaks pre-commit
```

- JSDoc **français** obligatoire sur l'API publique ; commentaires en français.
- TypeScript strict : pas de cast silencieux, unions discriminées,
  `ValidationError` attend un **tableau** de messages.
- Documentation des opérations : objectif, prérequis, commande exacte,
  résultat attendu, vérification, dépannage, récupération, sécurité.

## Git et conventions

- **Commits atomiques** : `type(scope): description courte`
  (types : `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`).
- Branches de travail puis intégration sur `develop` (un merge par cycle) ;
  la branche principale `main` reçoit les merges validés.
- Ne jamais committer : `.env`, clés, `node_modules`, sorties `providers`.
- Pré-commit : Gitleaks (`npm run security:secrets`).

## Sécurité

- Aucune clé en dépôt ; `.env` ignoré ; rotation obligatoire en cas d'exposition.
- `providers` / keyring : sorties à **ne jamais recopier** (tiers, chat, issue).
- Dépendances : `npm audit` en CI, seuil `--audit-level=high` côté release.
- Le serveur MCP ne dépend d'aucune variable secrète pour démarrer.

## Performance

- Budgets d'inspection : L1 10 s, L2 30 s, L3 60 s (cibles mesurées).
- Stockage < 100 ms/audit, indexation < 500 ms/audit, recherche < 100 ms
  (budgets vérifiés par tests d'intégration, ex. 10 000 audits).
- Recherche hybride : plafonds (`MAX_SEARCH_LIMIT` 100, `MAX_LIST_LIMIT` 1000),
  RRF sur deux classements.
- Benchmarks : `npm run test:benchmark`.

| Budget | Valeur | Vérifié par |
|--------|--------|-------------|
| Recherche < 100 ms / 1 000 audits | objectif | tests d'intégration chronométrés |
| Stockage < 100 ms / audit | objectif | tests stockage (ex. 10 000 audits) |
| Indexation < 500 ms / audit | objectif | tests vectoriels |
| Temps d'exécution totaux par commande | expectOk (CLI), 20 s (Vitest) | tests e2e/cli + config |
| Chargement applicatif | < 1 s (cible) | benchmark maison |

## Aide-mémoire de dépannage dev

| Symptôme | Action |
|----------|--------|
| `vitest: not found` / prompt npx | `npm ci` incomplet → vérifier code de sortie, relancer |
| `EPERM vec0.dll` au `npm ci` | processus Node résiduel → `Stop-Process node`, purge `node_modules`, `npm ci` |
| PDF timeout sous charge | rendus chronométrés à 30 s, warm-up `beforeAll` (voir `tests/reports/`) |
| Tests navigateur skippés | `npm run browsers:install` (CDN requis) |
| Schéma à jour ? | migrations auto à l'ouverture (`src/data/migrations/`) |
| Lint/format échouent | `npm run lint:fix` puis `npm run format` |

Cas élargis : `docs/TROUBLESHOOTING.md`.

---

**Version :** 2.0.0 (MVP-2) · **Dernière mise à jour :** 25 octobre 2026
