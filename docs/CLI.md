# Interface en ligne de commande — Sprint 5

> Sept commandes pour piloter la base de connaissances sans écrire de code :
> `init`, `add`, `get`, `search`, `list`, `delete`, `status`. Chaque commande
> possède une sortie humaine lisible et une sortie `--json` stable, destinée
> aux scripts.
>
> **Sprint 11** complète l'interface avec `inspect` et les sous-commandes
> `audit list|show|report|compare` (voir § 11).

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
npx --no-install ekts --help
npm run cli -- --help

# 3. (Optionnel) Rendre la commande disponible partout
npm link
ekts --help
```

> **Trois formes équivalentes, un piège.**
>
> - `node dist\cli\index.js <args>` : la plus directe, sortie pure.
> - `npx --no-install ekts <args>` : utilise le champ `bin` du paquet, sortie
>   pure, aucune installation globale.
> - `npm run cli -- <args>` : pratique, mais npm imprime sa bannière
>   (`> ekts@0.1.0 cli`) **avant** la sortie du programme. Un `--json` piped
>   vers `ConvertFrom-Json` ou `jq` échoue alors. Dans un script, utiliser
>   `npm run --silent cli -- <args>`, `npx --no-install ekts` ou `node dist\…`.

Prérequis : Node.js ≥ 22.19 et un `npm run build` à jour. Aucune clé n'est
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

Ajoute une ressource et l'indexe.

- **Plein texte** : toujours, sans réseau. Si cette étape échoue, l'ajout échoue.
- **Vecteurs** : tenté avec le premier fournisseur d'embeddings disponible
  (OpenAI, Gemini, OpenRouter, Novita — rotation de clés et repli automatiques).
  Un quota épuisé (`429`), une panne réseau ou l'absence totale de fournisseur
  **ne font pas échouer l'ajout** : la ressource est créée, cherchable en plein
  texte, et le rapport l'expose.

```json
{ "id": "…", "title": "…", "vectorIndexed": false, "vectorWarning": "… 429 …" }
```

En mode humain, l'avertissement s'affiche sous l'indexation. Pour obtenir les
vecteurs ensuite : `ekts reindex --vectors`.

| Option | Rôle |
| --- | --- |
| `--type <type>` | **Obligatoire.** `article`, `video`, `tutorial`, `tool` ou `other` |
| `--title <title>` | **Obligatoire.** 1 à 500 caractères |
| `--url <url>` | URL `http(s)` valide |
| `--tags <tags>` | Tags séparés par des virgules |
| `--content <content>` | Texte indexé (fortement recommandé) |
| `--provenance <fichier>` | Bloc de provenance JSON validé (Sprint 22-01, voir § 3.2.1) |

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

#### 3.2.1 Provenance et corpus gouverné (Sprint 22-01)

`--provenance` prend un **fichier JSON** validé avant toute écriture. Un
fichier illisible, un JSON invalide ou un bloc hors contrat sortent en **code
4** et ne créent aucune ressource.

```json
{
  "source": "depot://corpus/r01.md",
  "sourceVersion": "commit-abc123",
  "rights": { "read": "granted", "redistribute": "refused", "execute": "unknown" },
  "sensitivity": "synthetic",
  "fingerprint": { "sha256": "<64 caractères hexadécimaux>" },
  "review": {
    "status": "authorized",
    "decidedAt": "2026-10-30T10:00:00.000Z",
    "decidedBy": "operateur"
  }
}
```

| Champ | Valeurs | Sens |
| --- | --- | --- |
| `rights.read`, `rights.redistribute`, `rights.execute` | `granted`, `refused`, `unknown` | Trois décisions **indépendantes** : accorder la lecture ne dit rien de la redistribution |
| `sensitivity` | `synthetic`, `internal`, `sensitive` | Étiquette de gouvernance, **pas** un contrôle d'accès |
| `review.status` | `pending`, `authorized`, `refused`, `unknown` | Décision humaine de revue |
| `source`, `sourceVersion`, `fingerprint`, `review.decidedAt`, `review.decidedBy` | texte, objet `{sha256}`, date ISO, ou **`null`** | `null` = **explicitement inconnu**, jamais remplacé par une valeur inventée |

Tous les champs sont obligatoires : le rédacteur doit dire ce qu'il ignore.
**Admission au corpus gouverné** : `review.status = "authorized"` **et**
`rights.read = "granted"`. Les autres issues excluent la ressource du corpus
sans la supprimer, et le motif est affiché.

```json
{"admission": {"admitted": false, "reason": "droit de lecture refusé"}}
```

Une provenance enregistrée **ne peut pas disparaître** par une mise à jour :
`ekts` refuse une modification de `metadata` qui retirerait le bloc (elle peut
être révisée). Les ressources créées avant ce contrat restent lisibles, sans
provenance inventée, et sont affichées comme non admises.

### 3.3 `ekts get <id>`

Affiche une ressource par son UUID. Code de sortie **3** si elle n'existe pas.

Depuis le Sprint 22-01, la sortie humaine présente le bloc de provenance et la
décision d'admission (`admise` / `exclue` + motif) ; `--json` ajoute un champ
`admission`. Une ressource sans provenance est dite **historique**.

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

### 3.8 `ekts reindex`

Recalcule l'index vectoriel avec le fournisseur d'embeddings **actuellement
configuré**. Utile après un changement de fournisseur (OpenAI → Gemini) ou une
interruption réseau.

| Option | Rôle |
| --- | --- |
| `--vectors` | Réindexe tous les vecteurs (appels réseau, coût réel) |
| `--force` | Purge l'index d'un autre espace d'embedding avant de réindexer |

```powershell
npx --no-install ekts reindex --vectors
npx --no-install ekts reindex --vectors --force
```

**Pourquoi `--force` est-il exigé pour changer de fournisseur ?** Deux modèles
d'embedding produisent des vecteurs incomparables : mélanger les espaces
détruirait silencieusement le rappel. La commande refuse donc la bascule, puis
ne la fait qu'une fois la purge explicitement autorisée. Les ressources et
l'index plein texte ne sont **jamais** touchés : seuls les vecteurs, qui en
dérivent, sont recalculés.

Réponse JSON :

```json
{
  "vectors": {
    "resources": 42,
    "space": "google/gemini-embedding-001",
    "switched": true,
    "removed": 42,
    "report": { "indexed": 42, "skipped": 0, "failed": 0, "durationMs": 1834 }
  }
}
```

> L'index **plein texte** se reconstruit sans réseau avec `npm run db:reindex`.

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
| `EKTS_EMBEDDING_SPACE` | premier disponible | Espace imposé (`openai/…`, `baai/bge-m3`, …) |
| `EKTS_PROVIDER_POLICY` | `quality` | `quality`, `free` ou `cost` |
| `EKTS_OFFLINE` | — | `1` : aucun appel réseau, embeddings désactivés |
| `NO_COLOR` | — | Désactive les couleurs |
| `TERM` | — | `dumb` désactive les couleurs |

`EKTS_DATA_DIR` doit être un chemin **hors OneDrive** (voir `docs/guides/SETUP.md`).

---

## 7. Intégration avec des scripts

**Règle d'or : en mode `--json`, aucun préambule ne doit polluer la sortie.**
`npm run cli -- …` affiche la bannière npm ; utiliser `npx --no-install ekts`,
`npm run --silent cli --` ou `node dist\cli\index.js`.

```powershell
# PowerShell : récupérer les identifiants de toutes les ressources
$liste = node dist\cli\index.js list --json | ConvertFrom-Json
$liste.resources | ForEach-Object { $_.id }

# Variante sans chemin (bin du paquet, sans installation globale)
(npx --no-install ekts search "sqlite" --mode fts --json | ConvertFrom-Json).count

# Vérifier l'état avant une sauvegarde
node dist\cli\index.js status --json | ConvertFrom-Json | Select-Object -ExpandProperty resources

# Contrôler le code de sortie
node dist\cli\index.js get $id --json
if ($LASTEXITCODE -ne 0) { Write-Error "echec: $LASTEXITCODE" }
```

```bash
# bash / jq
node dist/cli/index.js list --json | jq -r '.resources[].id'
node dist/cli/index.js search "sqlite" --mode fts --json | jq '.count'
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
| `Erreur : Aucun fournisseur disponible pour « embedding »` | Aucune clé d'embeddings (OpenAI, Gemini, OpenRouter, Novita) | Renseigner une clé dans `.env`, ou `--mode fts` |
| `429 You have no credits remaining` | Compte OpenAI sans crédit | `add` **réussit quand même** (plein texte) avec `vectorWarning` ; pour les vecteurs, utiliser Gemini (palier gratuit) puis `ekts reindex --vectors --force` |
| `Espace d'embedding incompatible` | L'index contient les vecteurs d'un autre modèle | `ekts reindex --vectors --force` |
| `Erreur : EmbeddingSpaceMismatchError` | L'index contient des vecteurs d'un autre modèle | Rétablir l'ancien modèle ou réindexer (`npm run db:reindex`, puis réindexation vectorielle) |
| `spawn ekts ENOENT` | `npm link` non exécuté | Utiliser `node dist\cli\index.js` ou `npm run cli -- …` |
| Caractères illisibles | Console non UTF-8 | `chcp 65001`, ou `--no-colors` (les tableaux sont ASCII) |
| `no such table: resources` | Bases absentes ou `migrate: false` | `npm run cli -- init` |
| `npm run verify` échoue sur les tests d'embeddings alors que la CI est verte | Le `.env` du poste fournissait des clés aux tests (corrigé, ADR-021) | Récupérer la dernière version de la branche, puis `npm ci` et `npm run verify` ; voir `SETUP.md` §6.13 |
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

---

## 11. Commandes d'inspection et d'audits (Sprint 11-3)

> Ces commandes pilotent le module de rapports (`docs/REPORTS.md`). Elles
> nécessitent un navigateur Chrome/Chromium pour l'inspection et la génération
> PDF (`npm run browsers:install`), et échouent proprement sans lui.

### `ekts inspect <url>`

Inspection complète (L3), analyse des 5 dimensions, stockage de l'audit,
indexation FTS puis génération des rapports.

```bash
ekts inspect https://example.com
ekts inspect https://example.com --format md --output ./reports
```

| Option | Valeur | Défaut |
| --- | --- | --- |
| `-l, --level <level>` | `L1`, `L2`, `L3` | `L3` |
| `-o, --output <path>` | dossier de sortie | `./reports` |
| `-f, --format <format>` | `md`, `pdf`, `both` | `both` |
| `--allow-private-hosts` | drapeau | absent (hôtes privés refusés) |

**Politique de cible (Sprint 20-03, C-W13) :** avant d'ouvrir le navigateur,
`inspect` valide la cible — schéma `http`/`https` uniquement (refus de `file:`,
`ftp:`, `javascript:`), identifiants embarqués refusés, d'où l'URL **résolue**
par DNS : un nom qui pointe vers une adresse privée (`10/8`, `172.16/12`,
`192.168/16`, `127/8`, `::1`, lien-local) est refusé, et un échec de résolution
produit une erreur explicite (`DNS`). `--allow-private-hosts` est l'exception
explicite, réservée à l'inspection d'un poste de développement ; les mêmes
règles valent pour l'outil MCP `inspect_site` (`allow_private_hosts`).

Limite déclarée : la résolution précède l'ouverture du navigateur ; un
changement de DNS entre les deux instants (rebinding) n'est pas couvert.

**Niveau :** seules les inspections **L3** fournissent les entrées
(`lighthouse`, `axe`, `ux`, `content`) exigées par l'analyse complète.
`--level L1` / `--level L2` sont refusés avec le code **4** et un message
invitant à rejouer en `L3`.

**Sortie `--json` :**

```json
{
  "url": "https://example.com",
  "level": "L3",
  "auditId": 1,
  "score": 78,
  "totalFindings": 6,
  "reports": [{ "format": "markdown", "filePath": ".../audit-1-....md" }],
  "durationMs": 12345
}
```

### `ekts audit list`

Liste les audits stockés (énumération paginée FTS, sans réseau).

```bash
ekts audit list
ekts audit list --limit 10 --score-min 70
ekts audit list --url https://example.com
```

| Option | Défaut |
| --- | --- |
| `-n, --limit <n>` | `20` |
| `--url <url>` | — |
| `--score-min <n>` | — |
| `--score-max <n>` | — |

Sortie humaine : tableau `ID | URL | Score | Constats | Date` + total et score
moyen. Sortie `--json` : `{ count, statistics, audits[] }`.

### `ekts audit show <id>`

Détails d'un audit : scores par dimension, répartition des constats, top 5
des constats avec recommandations.

```bash
ekts audit show 1
```

Code **3** si l'identifiant est inconnu, **4** s'il n'est pas un entier
positif.

### `ekts audit report <id>`

Génère les rapports Markdown et/ou PDF d'un audit existant.

```bash
ekts audit report 1
ekts audit report 1 --format md --output ./reports
```

| Option | Défaut |
| --- | --- |
| `-f, --format <format>` | `both` |
| `-o, --output <path>` | `./reports` |

### `ekts audit compare <id1> <id2>`

Compare deux audits (delta scores, delta constats, évolution,
recommandations) et génère les rapports de comparaison.

```bash
ekts audit compare 1 2
ekts audit compare 1 2 --format md --output ./reports
```

Sortie `--json` : `{ evolution, deltaScores, deltaCounts, recommendations,
reports }`.

### Codes de sortie (rappel)

| Code | Signification |
| --- | --- |
| 0 | succès |
| 1 | erreur inattendue |
| 2 | erreur d'utilisation (Commander) |
| 3 | ressource introuvable (`audit #n`) |
| 4 | validation (`--level`, `--format`, `--limit`, identifiants) |

---

## 12. Commandes projets et filtre `--project` (Sprint 13)

> Nouveauté Sprint 13 (multi-projets, ADR-031). Chaque audit, ressource ou
> inspection peut être rattaché à un **projet** ; le filtre `--project` isole
> ensuite le contexte d'un projet donné. Guide complet :
> `docs/guides/PROJECTS.md`.

### `ekts project create <name>`

Crée un nouveau projet (UUIDv4 généré, statut `active` par défaut).

```bash
ekts project create "Mon Site Web" --description "Audit example.com"
ekts project create "Migration v2" --status completed --json
```

| Option | Défaut |
| --- | --- |
| `-d, --description <text>` | — |
| `-s, --status <status>` (`active` \| `completed` \| `archived`) | `active` |
| `--json` | — |

Sortie `--json` : l'objet projet complet (`id`, `name`, `description`,
`status`, `startedAt`, `completedAt`, `metadata`, `createdAt`, `updatedAt`).

### `ekts project list`

Liste les projets du plus récent au plus ancien.

```bash
ekts project list
ekts project list --status active --limit 10
ekts project list --json
```

| Option | Défaut |
| --- | --- |
| `-s, --status <status>` | — |
| `-n, --limit <n>` (1-1000) | `50` |

Sortie `--json` : `{ count, projects[] }`.

### `ekts project show <id>`

Affiche les détails d'un projet (UUID attendu).

```bash
ekts project show 550e8400-e29b-41d4-a716-446655440000 --json
```

Codes : **0** si trouvé, **3** si le projet n'existe pas, **4** si l'argument
n'est pas un UUIDv4.

### `ekts project delete <id>`

Supprime un projet. **Confirmation obligatoire** : sans `--force`, la
suppression est refusée avec le message `confirmation requise…` et le code
**1**. Les audits et ressources associés sont **conservés** — leur
`project_id` passe à `NULL` (`ON DELETE SET NULL`), jamais de purge en
cascade.

```bash
ekts project delete 550e8400-e29b-41d4-a716-446655440000 --force
```

| Option | Effet |
| --- | --- |
| `-f, --force` | Supprime sans confirmation |

Codes : **0** supprimé, **1** sans `--force`, **3** introuvable.

### Filtre et assignation `--project`

**Filtrage** (`-p, --project <uuid>`, format contrôlé → code **2** si non
UUID) :

| Commande | Effet |
| --- | --- |
| `ekts audit list --project <id>` | Seuls les audits du projet |
| `ekts audit show <id> --project <id>` | Refuse un audit d'un autre projet (code **3**) |
| `ekts search <query> --project <id>` | Seules les ressources du projet |
| `ekts list --project <id>` | Seules les ressources du projet |

**Assignation** :

| Commande | Effet |
| --- | --- |
| `ekts add --project <id>` | La ressource créée est rattachée au projet (projet inconnu → code **3**) |
| `ekts inspect <url> --project <id>` | L'audit stocké est rattaché au projet (projet inconnu → code **3**, vérifié avant la navigation) |

```bash
$p = ekts project create "example.com" --json | ConvertFrom-Json   # PowerShell
ekts inspect https://example.com --project $p.id
ekts audit list --project $p.id
ekts search "bonnes pratiques" --mode fts --project $p.id
```

### Codes de sortie projet (rappel)

| Code | Cas projet |
| --- | --- |
| 0 | succès |
| 1 | suppression sans `--force` (`CONFIRMATION_REQUIRED`) |
| 2 | `--project` ou `show <id>` non UUID, `--status` hors enum |
| 3 | projet introuvable (`PROJECT_NOT_FOUND`), audit hors projet |
| 4 | validation Zod (nom vide, nom > 200 caractères, `--status` atteint via API) |

## 13. Commande timeline (Sprint 14-3)

> Guide complet : [`guides/TIMELINE.md`](guides/TIMELINE.md).

`ekts timeline` regroupe les sous-commandes `analyze`, `trends`, `alerts` et
`chart` (Sprint 14, C14.6).

```bash
# Analyse chronologique par dimension (période, audits, notes min/max/moyenne)
npx ekts timeline analyze <projectId|nom> --json
npx ekts timeline analyze <id> --start 2026-10-01 --end 2026-10-15
npx ekts timeline analyze                # tous les projets

# Tendances (régression linéaire) et régressions > seuil
npx ekts timeline trends <id> --lookback 90 --threshold 10 --json

# Alertes : --check crée celles qui manquent (idempotent), --all inclut les
# résolues, --resolve <alertId> en résout une (code 4 si déjà résolue)
npx ekts timeline alerts <id> --check --json
npx ekts timeline alerts <id> --all
npx ekts timeline alerts --resolve <alertId> --json

# Graphique SVG (défaut) ou PNG ; --dimension limité aux 5 dimensions + overall
npx ekts timeline chart <id> --output evolution.svg
npx ekts timeline chart <id> --format png --dimension performance \
  --width 1200 --height 600 --output perf.png --json
```

| Sous-commande | Codes retour | Notes |
| --- | --- | --- |
| `analyze` | 0, 1, 2 (usage), 3 (projet), 4 (date/entier, `start > end`) | Analyse vide = `0` ; `--min-audits` informatif. |
| `trends` | 0, 1, 3, 4 (`--lookback`/`--threshold` bornés) | Séries fenêtrées, `regressions[]` affichées. |
| `alerts` | 0, 1, 3, 4 (`--threshold` borné, `--resolve` UUID/déjà résolu) | `--check` ajoute la détection manquante (spec : lecture seule — écart assumé, voir §8). |
| `chart` | 0, 1 (I/O), 2 (projet absent d'arg, choix `--format`/`--dimension`), 3, 4 (tailles) | Écriture fichier ; sortie par défaut `timeline-chart.svg` dans le répertoire courant. |

Sortie : humaine par défaut, structurée avec `--json` (mêmes contrats que
`tools/MCP`). Les entrées invalides sont rejetées avant toute écriture base.

## 14. Commande bestpractice (Sprint 15-03)

> Guide complet : [`guides/BEST_PRACTICES.md`](guides/BEST_PRACTICES.md).

`ekts bestpractice` (alias `bp`) — 6 sous-commandes de capitalisation (C15.7 →
C15.10) :

```bash
npx ekts bestpractice list -c performance -t images --manual --json
npx ekts bestpractice search "optimiser images" --limit 5
npx ekts bestpractice add --title "Titre ≥ 3" --description "Desc ≥ 10" \
  --category performance --tags "images,webp" --json
npx ekts bestpractice show <uuid> --json
npx ekts bestpractice delete <uuid> --yes
npx ekts bestpractice extract <projectId> --min-occurrences 2 --min-audits 2
```

| Sous-commande | Codes retour | Notes |
| --- | --- | --- |
| `list` | 0, 1, 2, 4 | Filtres `--category/--tag/--project/--manual/--auto`, tri `--sort/--order`, `--limit` borné 1-500 ; `--manual`+`--auto` = 4. |
| `search` | 0, 1, 2, 4 | Recherche FTS5, `--limit` 1-500, `--category` validé ; 0 résultat = code 0. |
| `add` | 0, 2, 4 | `isManual` forcé ; titre ≥ 3, description ≥ 10, catégorie dans la liste blanche. |
| `show` | 0, 3, 4 | Détail + findings liés (confiance %) ; UUID requis. |
| `delete` | 0, 1, 3, 4 | Sans `--yes` → 1 (aligné `project delete --force`). |
| `extract` | 0, 1, 3, 4 | Rapport d'extraction ; projet absent = 3 ; 0 audit = 0 (non bloquant). |

Entrées invalides rejetées avant écriture ; sortie `human`/`--json` via
`execute`.

## 15. Commande recommend (Sprint 16-03)

> Guide complet : [`guides/RECOMMENDATIONS.md`](guides/RECOMMENDATIONS.md).

`ekts recommend` (alias `rec`) — 6 sous-commandes (C16.8 → C16.11) :

```bash
npx ekts recommend generate <projectId> -n 10 --min-score 0.3 --json
npx ekts rec generate <projectId> --dimensions performance,seo --no-rules
npx ekts recommend list <projectId> -n 20
npx ekts rec rules list -d performance --active --json
npx ekts rec rules add -n "Images WebP" --dimension performance --severity 2 \
  --pattern "images non optimisées" --rec-title "Optimiser les images" \
  --rec-desc "Convertir en WebP" --effort 2 --impact 4 --priority high
npx ekts rec rules toggle <ruleId>
npx ekts rec rules delete <ruleId> --yes
```

| Sous-commande | Codes retour | Notes |
| --- | --- | --- |
| `generate <projectId>` | 0, 3, 4 | Options validées avant la ressource ; rapport vide = 0 non bloquant (C16.20). |
| `list [projectId]` | 0, 3, 4 | `projectId` requis (4 si absent) ; lecture des reco persistées. |
| `rules list` | 0, 4 | Filtres `--dimension`, `--active`, `--limit` 1-500. |
| `rules add` | 0, 2, 4 | Champs requis ; dimension/priorité/sevérité 0-4/effort-impact 1-5 validés. |
| `rules delete <id>` | 0, 1, 4 | `--yes` obligatoire (aligné `bestpractice delete`); règle absente = 4. |
| `rules toggle <id>` | 0, 4 | Active/désactive via `updateRule(isActive)`. |

Sortie `human`/`--json` via `execute` ; moteur injecté avec
`BestPracticeService` (bonnes pratiques proposées en bonus C16.12).

---

## 16. Commande template (Sprint 17-03)

`ekts template` (alias `tpl`) — 7 sous-commandes (C17.6/C17.7) :

```bash
npx ekts template list -c e-commerce --builtin -n 50 --json
npx ekts tpl list --custom
npx ekts template show <templateId> --json
npx ekts template apply <templateId> --name "Ma boutique" --url "https://x.co" \
  --description "Boutique" --config '{"alertThresholds":{"minScore":75}}'
npx ekts template create -n "Perso" -d "Description" -c custom \
  --config '{"priorityDimensions":["seo"]}' --bp-ids "id1,id2" --rule-ids "id3"
npx ekts template delete <templateId>
npx ekts template export <templateId> template.json
npx ekts template import template.json
```

| Sous-commande | Codes retour | Notes |
| --- | --- | --- |
| `list` | 0, 4 | `-c/--category` (11 valeurs), `--builtin`/`--custom` exclusifs, `-n` 1-500. |
| `show <id>` | 0, 4 | UUID requis ; template absent = `ValidationError` (4). |
| `apply <id>` | 0, 2, 4 | `--name`/`--url` requis (2) ; JSON `--config` invalide = 4 ; template absent = 4. |
| `create` | 0, 2, 4 | Catégorie, entier/JSON validés ; CSV `--bp-ids`/`--rule-ids`. |
| `delete <id>` | 0, 4 | Builtin immuable (ADR-040) = 4 ; absent = 4. |
| `export <id> <file>` | 0, 1, 4 | Écriture fichier (1) ; absent = 4. |
| `import <file>` | 0, 1, 4 | Fichier absent = 1 ; JSON/format invalide = 4 (C17.11). |

Constructeur du service : **seed idempotent des 10 prédéfinis** (C17.2) ;
`openTemplateServices(runtime)` ouvre les bases locales (`openDatabase`).
Guide détaillé : [`guides/TEMPLATES.md`](guides/TEMPLATES.md).

