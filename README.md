# EKTS — Engineering Knowledge & Tooling System

**Système personnel d'ingénierie augmenté par l'IA** qui centralise connaissances, ressources, capacités exécutables, observations et mémoire de projet — pour ne plus repartir de zéro.

> « Ne pas repartir de zéro : retrouver, comprendre, exécuter, vérifier et capitaliser sur ce qui a déjà été appris ou construit. »

**Statut :** 🚧 Implémentation en cours — Sprint 4 terminé, en attente de validation
**Version :** 0.1.0
**Licence :** MIT

---

## 1. Vision

EKTS réunit dans un seul système :

- **Connaissances** — méthodes, normes, tutoriels, décisions, notes
- **Ressources** — bibliothèques, composants, modèles, exemples, outils
- **Capacités exécutables** — scripts, CLI, API, outils MCP
- **Observations** — inspections de sites, captures, parcours utilisateur
- **Mémoire de projet** — contexte, décisions, résultats, leçons
- **Accès agentique** — interface standardisée MCP pour les agents IA

## 2. Architecture cible

**Architecture C Hybride** — monolithe modulaire TypeScript/Node.js, extensible par services optionnels.

```
src/
├── cli/          # CLI Commander.js
├── mcp/          # Serveur MCP (stdio)
├── business/     # Logique métier (knowledge, recherche, inspection…)
├── data/         # Couche données SQLite (3 bases)
└── shared/       # Types, configuration, logger
```

| Composant  | Technologie                                         |
| ---------- | --------------------------------------------------- |
| Runtime    | Node.js ≥ 22.12 LTS                                 |
| Langage    | TypeScript 5.9 (strict, ESM)                        |
| Données    | SQLite WAL + FTS5 + sqlite-vec (3 bases)            |
| Recherche  | FTS5 (BM25) + vectoriel + RRF k=60                  |
| Validation | Zod 4                                               |
| CLI        | Commander.js 15                                     |
| MCP        | `@modelcontextprotocol/sdk` 1.32.x, transport stdio |
| Logging    | Pino 10                                             |
| Tests      | Vitest 5 + `@vitest/coverage-v8` (seuils 80 %)      |
| Qualité    | ESLint 10 (flat config) + Prettier 3                |
| Sécurité   | Gitleaks 8.30.1 (pre-commit + CI)                   |

Décisions détaillées : [`docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`](docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md) et [ADR-011](docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md).

## 3. Périmètre par MVP

| MVP       | Contenu                                                 | Sprints |
| --------- | ------------------------------------------------------- | ------- |
| **MVP-1** | Bibliothèque, recherche hybride, CLI, serveur MCP       | 1 → 6   |
| **MVP-2** | Inspection navigateur, analyse 5 dimensions, rapports   | 7 → 12  |
| **MVP-3** | Capitalisation projets, post-mortems, workflow 8 étapes | 13 → 18 |

État d'avancement : [`docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`](docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md).

## 4. Installation

### Prérequis

- **Node.js ≥ 22.12** (LTS) — `node --version`
- **npm ≥ 10** — `npm --version`
- **Git** — `git --version`

Aucune chaîne de compilation n'est requise : les dépendances natives sont livrées avec
leurs binaires précompilés.

### Mise en route

```powershell
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system

npm ci          # installation reproductible, sans compilation native
npm run setup   # hooks Git + vérification de l'environnement
npm run build   # compilation TypeScript
npm start       # exécute dist/index.js
```

Les mêmes commandes valent sous bash/zsh (macOS, Linux, WSL) : seules les commandes utilitaires
`ls`/`Remove-Item` diffèrent, pas les scripts npm.

**Aucun compilateur C++, Python ou Visual Studio n'est nécessaire.** `.npmrc` désactive les scripts
de cycle de vie npm, qui déclenchaient une compilation inutile de `better-sqlite3` (voir
[`SETUP.md` §6.1](docs/guides/SETUP.md)).

Le guide complet (dépannage Windows, hooks, variables d'environnement) est dans [`docs/guides/SETUP.md`](docs/guides/SETUP.md).

## 5. Commandes

| Commande                          | Rôle                                                     |
| --------------------------------- | -------------------------------------------------------- |
| `npm run dev`                     | Exécution en développement (`tsx watch`)                 |
| `npm run build`                   | Compilation dans `dist/`                                 |
| `npm start`                       | Exécution du build                                       |
| `npm run typecheck`               | Vérification TypeScript sans émission                    |
| `npm run lint` / `lint:fix`       | ESLint (flat config)                                     |
| `npm run format` / `format:check` | Prettier                                                 |
| `npm test` / `test:watch`         | Tests Vitest                                             |
| `npm run coverage`                | Couverture (atteint 100 %)                               |
| `npm run test:benchmark`          | Benchmark recherche (Recall@5, p95, 100K docs)           |
| `npm run verify`                  | typecheck + lint + format + build + couverture           |
| `npm run setup`                   | Hooks Git + vérification de l'environnement              |
| `npm run check:env`               | Diagnostics (Node, SQLite, sqlite-vec, outils)           |
| `npm run doctor`                  | Contrôle dépôt, build, dépendances et fins de ligne      |
| `npm run db:inspect`              | État des 3 bases + cohérence de l'index                  |
| `npm run db:reindex`              | Reconstruit l'index plein texte                          |
| `npm run providers`               | État des 14 fournisseurs d'API et chaîne d'appel         |
| `npm run cli -- <args>`           | Interface CLI `ekts` (voir [`docs/CLI.md`](docs/CLI.md)) |
| `npm run mcp`                     | Serveur MCP stdio (voir [`docs/MCP.md`](docs/MCP.md))    |
| `npm run test:browser`            | Tests du module navigateur, sans binaire Playwright      |
| `npm run test:e2e`                | Tests Playwright sur les 3 moteurs (après installation)  |
| `npm run browsers:install`        | Télécharge Chromium, Firefox et WebKit (~760 Mo)         |
| `npm run security:secrets`        | Scan Gitleaks des fichiers indexés                       |
| `npm run clean`                   | Supprime `dist/`                                         |

### CLI `ekts`

```powershell
npm run build
npx --no-install ekts init
npx --no-install ekts add --type article --title "Introduction à SQLite" --tags "sqlite,base" --content "SQLite est une base légère."
npx --no-install ekts search "sqlite" --mode fts
npx --no-install ekts list --json
npx --no-install ekts reindex --vectors
```

> `npx --no-install ekts` utilise le champ `bin` du paquet et produit une sortie
> pure (aucun préambule npm), contrairement à `npm run cli -- …` qui imprime sa
> bannière. En script, préférer `node dist\cli\index.js …` ou
> `npm run --silent cli -- …`.

Sept commandes (`init`, `add`, `get`, `search`, `list`, `delete`, `status`),
deux formats de sortie (`--json` ou humain), cinq codes de sortie documentés.
`npm link` expose la commande `ekts` globalement. Guide complet :
[`docs/CLI.md`](docs/CLI.md).

### Serveur MCP

```powershell
npm run build
npm run mcp                        # transport stdio, JSON-RPC 2.0
```

Quatre outils en lecture seule : `search_knowledge`, `get_resource`,
`list_resources`, `validate_resource`. Claude Code détecte le serveur via le
`.mcp.json` du dépôt ; Cursor et GitHub Copilot se configurent dans
[`docs/MCP.md`](docs/MCP.md) §4. Les journaux sont écrits en JSON sur `stderr`
(`MCP_LOG_LEVEL`), `stdout` restant réservé au protocole. Compatibilité et
limites : [`MCP-COMPATIBILITY.md`](MCP-COMPATIBILITY.md).

### Inspection navigateur

```powershell
npm run browsers:install           # une seule fois : ~760 Mo
npm run test:e2e                   # 12 tests sur Chromium, Firefox et WebKit
```

`src/browser/` ouvre une page, la capture, enregistre une trace, l'imprime en
PDF et extrait son accessibility tree. Un serveur MCP dédié expose ces
opérations à un agent (`browser_navigate`, `browser_screenshot`,
`browser_accessibility`, `browser_pdf`, `browser_close`), avec deux garde-fous :
http/https uniquement et écritures confinées dans le dossier d'artefacts. Guide
complet, y compris les écarts avec le dossier de sprint :
[`docs/PLAYWRIGHT.md`](docs/PLAYWRIGHT.md).

## 6. Configuration

| Variable                                                                                      | Défaut                   | Rôle                                             |
| --------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------ |
| `NODE_ENV`                                                                                    | `development`            | `development`, `test` ou `production`            |
| `EKTS_DATA_DIR`                                                                               | `./data`                 | Répertoire des bases SQLite (résolu en absolu)   |
| `LOG_LEVEL`                                                                                   | `info`                   | Niveau Pino (`trace`…`silent`)                   |
| `OPENAI_API_KEY`                                                                              | —                        | Embeddings OpenAI (une clé parmi d'autres)       |
| `GEMINI_API_KEY`                                                                              | —                        | Embeddings Gemini (palier gratuit)               |
| `OPENROUTER_API_KEY`                                                                          | —                        | Embeddings/chat (même espace qu'OpenAI)          |
| `NOVITA_API_KEY`                                                                              | —                        | Embeddings `baai/bge-m3` (gratuit)               |
| `TAVILY_API_KEY` / `SERPER_API_KEY` / `SERPAPI_API_KEY`                                       | —                        | Recherche web                                    |
| `SOFYA_API_KEY`                                                                               | —                        | Recherche + lecture d'URL en markdown            |
| `DEEPSEEK_API_KEY` / `ZAI_API_KEY` / `NVIDIA_API_KEY` / `STEPFUN_API_KEY` / `MINIMAX_API_KEY` | —                        | Chat (Sprint 6)                                  |
| `EKTS_PROVIDERS_FILE`                                                                         | `providers.custom.json`  | Fournisseurs déclarés sans code                  |
| `E2B_API_KEY`                                                                                 | —                        | Bac à sable d'exécution (Sprint 8)               |
| `EKTS_PROVIDER_POLICY`                                                                        | `quality`                | `quality`, `free` ou `cost`                      |
| `OPENAI_EMBEDDING_MODEL`                                                                      | `text-embedding-3-small` | Modèle d'embedding (1536 dims)                   |
| `MCP_LOG_LEVEL`                                                                               | `info`                   | Journal MCP (`debug`, `info`, `error`, `silent`) |
| `EMBEDDING_DIMENSION`                                                                         | `1536`                   | Doit correspondre au schéma `float[1536]`        |

Aucun secret n'est nécessaire pour installer, compiler ou lancer les tests (le benchmark utilise un
fournisseur d'embeddings local). Une clé reste nécessaire pour indexer et rechercher en mode
vectoriel réel : OpenAI, OpenRouter, Gemini ou Novita, au choix. Les clés passent exclusivement par
`.env` (ignoré par Git et Gitleaks). Chaque fournisseur accepte jusqu'à huit clés suffixées `_2`
à `_8`, et le repli entre fournisseurs est automatique à l'intérieur d'un même espace d'embedding.
Un fournisseur absent du catalogue se déclare dans `providers.custom.json`
(`providers.custom.example.json` fournit un modèle), sans modifier le code.
Voir `docs/guides/PROVIDERS.md` et `docs/guides/SEARCH_ENGINE.md`.

## 7. Structure du dépôt

```
engineering-knowledge-tooling-system/
├── src/                     # code source (src/data, src/business, src/cli, src/mcp, src/browser)
├── tests/                   # unit / integration / benchmark
├── migrations/              # migrations SQLite (Sprint 2)
├── docs/
│   ├── blueprint/           # documentation de conception (15 phases, 48 sprints)
│   ├── guides/              # guides projet (SETUP, DATA_LAYER, KNOWLEDGE_MANAGER, SEARCH_ENGINE, PROVIDERS)
│   └── audit/               # audits (état des lieux de démarrage)
├── .github/workflows/       # CI (qualité + secrets)
├── AGENTS.md                # règles pour les agents IA
└── package.json
```

> Les chemins `Docs/…` cités dans la documentation de conception sont relatifs à `docs/blueprint/`.

## 8. Qualité et sécurité

- **CI** sur chaque push : lint, typecheck, build, tests, couverture (Node 22.x et 24.x), benchmark de recherche + scan Gitleaks de l'historique.
- **Hook pre-commit** versionné (`.husky/pre-commit`) : scan Gitleaks des fichiers indexés.
- **Aucun secret** dans le dépôt ; `.env`, `*.db`, `data/`, `dist/`, `coverage/` ignorés.
- **Couverture** : seuils 80 % configurés dans `vitest.config.ts`.
- **Pull requests interdites** : le travail est poussé sur une branche dédiée et fusionné localement après validation (voir [`docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md`](docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md)).

## 9. Documentation

| Document                                                                                                                     | Contenu                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`docs/blueprint/INDEX.md`](docs/blueprint/INDEX.md)                                                                         | Index de la conception (15 phases)                   |
| [`docs/blueprint/Docs/00-REFERENCE-GLOBALE-PROJET.md`](docs/blueprint/Docs/00-REFERENCE-GLOBALE-PROJET.md)                   | Référence globale                                    |
| [`docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md`](docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)                       | Architecture cible                                   |
| [`docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`](docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md) | Stack et ADR                                         |
| [`docs/blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md`](docs/blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md)     | Sécurité                                             |
| [`docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md`](docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md)                                   | Workflow Git                                         |
| [`docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`](docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md)         | ADR et risques                                       |
| [`docs/audit/ETAT-DES-LIEUX-2026-10-21.md`](docs/audit/ETAT-DES-LIEUX-2026-10-21.md)                                         | Audit de démarrage                                   |
| [`docs/guides/SEARCH_ENGINE.md`](docs/guides/SEARCH_ENGINE.md)                                                               | Moteur de recherche (Sprint 4)                       |
| [`docs/guides/PROVIDERS.md`](docs/guides/PROVIDERS.md)                                                                       | Fournisseurs, routage, rotation de clés (Sprint 4.5) |
| [`docs/CLI.md`](docs/CLI.md)                                                                                                 | Interface en ligne de commande (Sprint 5)            |
| [`AGENTS.md`](AGENTS.md)                                                                                                     | Règles de travail des agents                         |

## 10. Licence

MIT — voir [`LICENSE`](LICENSE).
