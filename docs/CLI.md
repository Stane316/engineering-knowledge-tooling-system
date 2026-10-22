# Interface en ligne de commande — Sprint 5

> Sept commandes pour piloter la base de connaissances sans écrire de code :
> `init`, `add`, `get`, `search`, `list`, `delete`, `status`. Chaque commande
> possède une sortie humaine lisible et une sortie `--json` stable, destinée
> aux scripts.

| Élément | Valeur |
| --- | --- |
| Sprint | 5 — semaines 9-10 |
| Critères | C5.1 à C5.19 (voir `docs/blueprint/Docs/roadmap/sprints/SPRINT-05.md`) |
| Framework | Commander.js 15 (ADR-019) |
| Couverture | `src/cli/**` à **100 %** (lignes / branches / fonctions) |
| Tests | unités + intégration sur le binaire compilé (`tests/cli/`) |

---

## 1. Objectif et périmètre

La CLI est la **première interface utilisateur** du système : elle expose la
couche métier (Knowledge Manager, Search Engine, index FTS et vectoriel) sans
dupliquer sa logique. Elle sert aussi de socle au serveur MCP du Sprint 6, qui
réutilise les mêmes services.

Sont **inclus** : les sept commandes, les sorties JSON et humaines, les codes de
sortie, les tests et cette documentation. Sont **exclus** : l'inspection
navigateur (MVP-2), la capitalisation de projet (MVP-3) et le serveur MCP
(Sprint 6).

---

## 2. Installation

La CLI est publiée par le champ `bin` de `package.json` (`ekts` →
`dist/cli/index.js`).

```powershell
# 1. Compiler
npm run build

# 2. Exécuter sans installation globale
node dist\cli\index.js --help
npm run cli -- --help

# 3. (Optionnel) Rendre la commande disponible partout
npm link
ekts --help
```

> Sous PowerShell, `npm run cli -- <args>` est la forme la plus sûre : npm
> transmet les arguments sans les réinterpréter.

Prérequis : Node.js ≥ 22.12 et un `npm run build` à jour. Aucune clé n'est
nécessaire pour `init`, `add` (indexation plein texte), `get`, `list`, `delete`,
`status` et `search --mode fts`. Le fichier `.env` du répertoire courant est
chargé au démarrage (sans écraser les variables déjà définies).

### 2.1 Vérifier que le code est réellement présent

Un `git merge` peut répondre « Already up to date » sans rien apporter : c'est
le cas quand le pointeur local de la branche est antérieur au dernier push
(voir [`SETUP.md` §6.12](guides/SETUP.md)). Deux commandes suffisent à lever le
doute :

```powershell
npm run doctor
Test-Path src\cli\program.ts
```

`npm run doctor` contrôle Node, npm, l'état Git, la présence du code du Sprint 5,
la fraîcheur de `dist/`, les dépendances et les fins de ligne. Il affiche
`[ERR] code Sprint 5 absent` si le merge n'a pas été appliqué.

Pour fusionner la bonne version, viser le **commit** plutôt que le nom de branche :

```powershell
git fetch origin
git rev-parse origin/arena/079e2f26-engineering-knowledge-tooling
git switch develop
git merge --no-ff 2863e44 -m "merge: Sprint 5 CLI"
```

---

## 3. Commandes

### 3.1 `ekts init`

Crée les trois bases SQLite (`ekts.db`, `ekts-fts.db`, `ekts-vectors.db`) ou
applique les migrations manquantes. **Idempotent** : relancer la commande ne
détruit rien.

| Option | Rôle |
| --- | --- |
| `--force` | Supprime les bases existantes (et leurs fichiers `-wal`/`-shm`) avant de les recréer |
| `--json` | Sortie machine |
| `--no-colors` | Désactive les couleurs |

```powershell
npm run cli -- init
npm run cli -- init --json
npm run cli -- init --force      # destructif : repart de zéro
```

Réponse JSON :

```json
{
  "dataDir": "C:\\dev\\engineering-knowledge-tooling-system\\data",
  "files": {
    "main": "…\\data\\ekts.db",
    "fts": "…\\data\\ekts-fts.db",
    "vectors": "…\\data\\ekts-vectors.db"
  },
  "existed": false,
  "reinitialized": false,
  "schemaVersion": 2,
  "resources": 0
}
```

### 3.2 `ekts add`

Ajoute une ressource et l'indexe. L'indexation **plein texte est
systématique** ; l'indexation vectorielle est tentée si `OPENAI_API_KEY` est
configurée. Sans clé, la ressource est créée et le rapport l'indique
(`vectorIndexed: false`) : aucune donnée n'est perdue, une réindexation
ultérieure complétera les vecteurs.

| Option | Rôle |
| --- | --- |
| `--type <type>` | **Obligatoire.** `article`, `video`, `tutorial`, `tool` ou `other` |
| `--title <title>` | **Obligatoire.** 1 à 500 caractères |
| `--url <url>` | URL `http(s)` valide |
| `--tags <tags>` | Tags séparés par des virgules |
| `--content <content>` | Texte indexé (fortement recommandé) |

```powershell
npm run cli -- add --type article --title "Introduction à SQLite" --url "https://example.com/sqlite" --tags "sqlite,base" --content "SQLite est une base légère."
```

Réponse JSON : la ressource persistée, plus `vectorIndexed`.

```json
{
  "id": "0d34bf32-b8fe-4415-b9e4-2ceb69b55062",
  "type": "article",
  "title": "Introduction à SQLite",
  "tags": ["sqlite", "base"],
  "metadata": {},
  "content": "SQLite est une base légère.",
  "createdAt": "2026-10-22T11:14:16.174Z",
  "updatedAt": "2026-10-22T11:14:16.174Z",
  "vectorIndexed": false
}
```

### 3.3 `ekts get <id>`

Affiche une ressource par son UUID. Code de sortie **3** si elle n'existe pas.

```powershell
npm run cli -- get 0d34bf32-b8fe-4415-b9e4-2ceb69b55062
npm run cli -- get 0d34bf32-b8fe-4415-b9e4-2ceb69b55062 --json
```

### 3.4 `ekts search <query>`

Recherche hybride BM25 + vecteurs + RRF (k = 60), ou stratégie unitaire.

| Option | Défaut | Rôle |
| --- | --- | --- |
| `-m, --mode <mode>` | `hybrid` | `hybrid`, `fts` ou `vector` |
| `-l, --limit <n>` | `10` | Entier de 1 à 1000 |
| `-t, --type <type>` | — | Filtre sur le type |
| `--tags <tags>` | — | La ressource doit porter **tous** les tags (CSV) |

```powershell
npm run cli -- search "sqlite"                  # hybride (clé OpenAI requise)
npm run cli -- search "sqlite" --mode fts       # lexical seul, hors ligne
npm run cli -- search "base" --mode vector --limit 5
npm run cli -- search "sqlite" --type article --tags "sqlite,base" --json
```

Réponse JSON :

```json
{
  "query": "sqlite",
  "mode": "hybrid",
  "limit": 10,
  "count": 1,
  "elapsedMs": 12,
  "results": [
    {
      "resource": { "id": "…", "title": "Introduction à SQLite" },
      "score": 0.0328,
      "source": "hybrid"
    }
  ]
}
```

> Sans configuration d'embeddings, `hybrid` et `vector` échouent avec le code
> **1** et un message explicite. `--mode fts` reste disponible : un classement
> purement lexical ne doit jamais être présenté comme sémantique.

### 3.5 `ekts list`

Liste les ressources, filtres appliqués **en base**.

| Option | Rôle |
| --- | --- |
| `-l, --limit <n>` | Nombre maximum (1 à 1000) |
| `--offset <n>` | Décalage de pagination (≥ 0) |
| `-t, --type <type>` | Filtre sur le type |
| `--tags <tags>` | La ressource doit porter tous les tags (CSV) |

```powershell
npm run cli -- list
npm run cli -- list --type article --tags sqlite --limit 5 --offset 0
npm run cli -- list --json
```

Réponse JSON : `{ "count": 1, "resources": [ … ] }`.

### 3.6 `ekts delete <id>`

Supprime une ressource après confirmation interactive (`y`/`yes`).

| Option | Rôle |
| --- | --- |
| `-y, --yes` | Supprime sans demander de confirmation (obligatoire en script) |

```powershell
npm run cli -- delete 0d34bf32-…
npm run cli -- delete 0d34bf32-… --yes
```

Sans terminal interactif (CI, redirection), la confirmation vaut **refus** :
la commande se termine avec le code 0 et `"cancelled": true`. Un script doit
passer `--yes` explicitement — jamais de suppression accidentelle parce que
l'entrée standard était fermée.

Réponse JSON : `{ "deleted": true, "cancelled": false, "id": "…" }`.

### 3.7 `ekts status`

Décrit l'état du système **sans jamais créer de base** : présence et taille des
trois fichiers, nombre de ressources, cohérence de l'index FTS, nombre de
vecteurs et espace d'embedding lié.

```powershell
npm run cli -- status
npm run cli -- status --json
```

Réponse JSON :

```json
{
  "version": "0.1.0",
  "dataDir": "…\\data",
  "databases": [
    { "name": "ekts.db", "path": "…", "exists": true, "sizeBytes": 61440 }
  ],
  "resources": { "total": 3, "byType": { "article": 2, "tool": 1 }, "indexed": 3, "consistent": true },
  "vectors": { "count": 3, "space": "openai/text-embedding-3-small" },
  "system": { "node": "v22.22.3", "platform": "win32" }
}
```

---

## 4. Options globales

| Option | Effet |
| --- | --- |
| `--json` | Sortie machine (JSON indenté sur deux espaces) |
| `--no-colors` | Désactive les séquences ANSI |
| `-v, --version` | Affiche la version du paquet |
| `-h, --help` | Aide de la commande ou de la CLI |

`--json` et `--no-colors` sont acceptés **avant ou après** la sous-commande :
`ekts --json list` et `ekts list --json` sont équivalents. La valeur la plus
proche de la commande l'emporte.

Les couleurs sont aussi désactivées automatiquement si la sortie n'est pas un
terminal, si `NO_COLOR` est défini ou si `TERM=dumb`. Les tableaux n'utilisent
que des caractères ASCII (`+`, `-`, `|`) : les consoles Windows en CP437/CP850
les affichent correctement.

---

## 5. Codes de sortie

| Code | Signification | Exemple |
| --- | --- | --- |
| `0` | Succès (y compris annulation d'une suppression) | `ekts list` |
| `1` | Erreur d'exécution : base illisible, embeddings indisponibles, I/O | `search` sans clé en mode hybride |
| `2` | Argument ou option invalide | `--limit 0`, `--type inconnu`, option inconnue |
| `3` | Ressource introuvable | `get`/`delete` sur un UUID absent |
| `4` | Données refusées par la validation métier | `add --type bogus` |

Les scripts testent `$LASTEXITCODE` (PowerShell) ou `$?` (bash) ; le message
d'erreur part sur **stderr**, jamais sur stdout.

---

## 6. Variables d'environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `EKTS_DATA_DIR` | `./data` | Répertoire des trois bases |
| `OPENAI_API_KEY` | — | Embeddings : active `add` vectoriel et `search` hybride/vectoriel |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Modèle (1536 dimensions) |
| `EKTS_PROVIDERS_FILE` | `providers.custom.json` | Fournisseurs déclarés sans code (Sprint 4.5) |
| `NO_COLOR` | — | Désactive les couleurs |
| `TERM` | — | `dumb` désactive les couleurs |

`EKTS_DATA_DIR` doit être un chemin **hors OneDrive** (voir `docs/guides/SETUP.md`).

---

## 7. Intégration avec des scripts

```powershell
# PowerShell : récupérer les identifiants de toutes les ressources
$liste = npm run cli -- list --json | ConvertFrom-Json
$liste.resources | ForEach-Object { $_.id }

# Compter les ressources d'un type
(npm run cli -- search "sqlite" --mode fts --json | ConvertFrom-Json).count

# Vérifier l'état avant une sauvegarde
npm run cli -- status --json | ConvertFrom-Json | Select-Object -ExpandProperty resources
```

```bash
# bash / jq
ekts list --json | jq -r '.resources[].id'
ekts search "sqlite" --mode fts --json | jq '.count'
```

---

## 8. Écarts entre le blueprint et le code livré

| # | Blueprint | Livré | Justification |
| --- | --- | --- | --- |
| E5-1 | `EKTS_DB_PATH` | `EKTS_DATA_DIR` | Convention déjà utilisée par `loadConfig()` et les scripts (Sprint 1) |
| E5-2 | Trois connexions `new Database('data/…')` | Une connexion, trois schémas attachés | Le Data Layer attache `fts` et `vectors` ; trois connexions casseraient les transactions |
| E5-3 | `ResourceRepository(db)`, `FTSIndexer`, `OpenAIEmbeddingsService` | `createKnowledgeManager`, `Indexer`, `createEmbeddingsService`, `VectorIndexer`, `SearchEngine` | API réelle du Sprint 4 ; le manager décoré gère l'indexation vectorielle |
| E5-4 | `cli-table3` | `renderTable` interne (ASCII) | Zéro dépendance, sortie stable et testable ; `cli-table3` n'a pas de types et impose 7 dépendances transitives |
| E5-5 | Commander.js « v12+ » | Commander.js **15** | Version courante au moment du sprint, API compatible |
| E5-6 | `process.exit()` dans chaque action | Codes retournés puis `process.exitCode` | Les tests exécutent la CLI en mémoire, sans tuer le processus |
| E5-7 | `add` indexe toujours les vecteurs | Repli plein texte si les embeddings sont absents | Ne bloque pas la création hors ligne ; `vectorIndexed` le rend explicite |
| E5-8 | `--json` seulement après la sous-commande | Accepté avant **et** après | Commodité de script, sans ambiguïté (la valeur la plus proche gagne) |
| E5-9 | `status` crée un manager | `status` n'ouvre les bases que si les trois existent, `migrate: false` | Une commande d'observation ne doit rien modifier |
| E5-10 | `delete` demande toujours confirmation | Refus automatique sans terminal | Sécurité : l'absence de saisie ne vaut pas acceptation |

> Le blueprint référence « ADR-003 (Commander.js) », mais l'ADR-003 du registre
> traite de **Playwright** (inspection navigateur). La décision CLI est
> enregistrée séparément en **ADR-019**.

---

## 9. Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `Erreur : OPENAI_API_KEY absente` | Recherche hybride ou vectorielle sans clé | Renseigner `.env`, ou utiliser `--mode fts` |
| `Erreur : EmbeddingSpaceMismatchError` | L'index contient des vecteurs d'un autre modèle | Rétablir l'ancien modèle ou réindexer (`npm run db:reindex`, puis réindexation vectorielle) |
| `spawn ekts ENOENT` | `npm link` non exécuté | Utiliser `node dist\cli\index.js` ou `npm run cli -- …` |
| Caractères illisibles | Console non UTF-8 | `chcp 65001`, ou `--no-colors` (les tableaux sont ASCII) |
| `no such table: resources` | Bases absentes ou `migrate: false` | `npm run cli -- init` |
| Index incohérent dans `status` | Écriture interrompue entre fichiers attachés | `npm run db:reindex` |

---

## 10. Vérifications

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run build
npx vitest run tests/cli
npx vitest run --coverage tests/cli   # src/cli/** à 100 %
```

Le test d'intégration (`tests/cli/cli.test.ts`) exécute le binaire compilé et
rejoue le parcours complet : `init` → `add` → `get` → `list` → `search` →
`status` → `delete`, codes de sortie inclus.
