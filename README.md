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

| Commande                          | Rôle                                           |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Exécution en développement (`tsx watch`)       |
| `npm run build`                   | Compilation dans `dist/`                       |
| `npm start`                       | Exécution du build                             |
| `npm run typecheck`               | Vérification TypeScript sans émission          |
| `npm run lint` / `lint:fix`       | ESLint (flat config)                           |
| `npm run format` / `format:check` | Prettier                                       |
| `npm test` / `test:watch`         | Tests Vitest                                   |
| `npm run coverage`                | Couverture (atteint 100 %)                     |
| `npm run test:benchmark`          | Benchmark recherche (Recall@5, p95, 100K docs) |
| `npm run verify`                  | typecheck + lint + format + build + couverture |
| `npm run setup`                   | Hooks Git + vérification de l'environnement    |
| `npm run check:env`               | Diagnostics (Node, SQLite, sqlite-vec, outils) |
| `npm run db:inspect`              | État des 3 bases + cohérence de l'index        |
| `npm run db:reindex`              | Reconstruit l'index plein texte                |
| `npm run security:secrets`        | Scan Gitleaks des fichiers indexés             |
| `npm run clean`                   | Supprime `dist/`                               |

## 6. Configuration

| Variable                 | Défaut                   | Rôle                                           |
| ------------------------ | ------------------------ | ---------------------------------------------- |
| `NODE_ENV`               | `development`            | `development`, `test` ou `production`          |
| `EKTS_DATA_DIR`          | `./data`                 | Répertoire des bases SQLite (résolu en absolu) |
| `LOG_LEVEL`              | `info`                   | Niveau Pino (`trace`…`silent`)                 |
| `OPENAI_API_KEY`         | —                        | Embeddings OpenAI (Sprint 4, via `.env`)       |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Modèle d'embedding (1536 dims)                 |
| `EMBEDDING_DIMENSION`    | `1536`                   | Doit correspondre au schéma `float[1536]`      |

Aucun secret n'est nécessaire pour installer, compiler ou lancer les tests (le benchmark utilise un
fournisseur d'embeddings local). La clé OpenAI n'est requise que pour indexer et rechercher en mode
vectoriel réel ; elle passe exclusivement par `.env` (ignoré par Git et Gitleaks) ou les GitHub
Secrets. Voir `docs/guides/SEARCH_ENGINE.md`.

## 7. Structure du dépôt

```
engineering-knowledge-tooling-system/
├── src/                     # code source (données : src/data)
├── tests/                   # unit / integration / benchmark
├── migrations/              # migrations SQLite (Sprint 2)
├── docs/
│   ├── blueprint/           # documentation de conception (15 phases, 48 sprints)
│   ├── guides/              # guides projet (SETUP, DATA_LAYER, KNOWLEDGE_MANAGER, SEARCH_ENGINE)
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

| Document                                                                                                                     | Contenu                            |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`docs/blueprint/INDEX.md`](docs/blueprint/INDEX.md)                                                                         | Index de la conception (15 phases) |
| [`docs/blueprint/Docs/00-REFERENCE-GLOBALE-PROJET.md`](docs/blueprint/Docs/00-REFERENCE-GLOBALE-PROJET.md)                   | Référence globale                  |
| [`docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md`](docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)                       | Architecture cible                 |
| [`docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`](docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md) | Stack et ADR                       |
| [`docs/blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md`](docs/blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md)     | Sécurité                           |
| [`docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md`](docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md)                                   | Workflow Git                       |
| [`docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`](docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md)         | ADR et risques                     |
| [`docs/audit/ETAT-DES-LIEUX-2026-10-21.md`](docs/audit/ETAT-DES-LIEUX-2026-10-21.md)                                         | Audit de démarrage                 |
| [`docs/guides/SEARCH_ENGINE.md`](docs/guides/SEARCH_ENGINE.md)                                                               | Moteur de recherche (Sprint 4)     |
| [`AGENTS.md`](AGENTS.md)                                                                                                     | Règles de travail des agents       |

## 10. Licence

MIT — voir [`LICENSE`](LICENSE).
