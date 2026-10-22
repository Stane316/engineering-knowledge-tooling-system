# Data Layer — Documentation technique

| Champ | Valeur |
|-------|--------|
| **Objectif** | Décrire la persistance EKTS : trois bases SQLite, migrations, repository et validation |
| **Responsable** | Mainteneur du Data Layer |
| **Prérequis** | Node ≥ 22.12, `better-sqlite3` 13, `sqlite-vec` 0.1.x |
| **Emplacement** | `src/data/`, `src/shared/validators.ts` |
| **Dernière mise à jour** | 2026-10-22 (Sprint 2) |

---

## 1. Architecture

Trois fichiers SQLite, **une seule connexion** : `ekts.db` est ouverte, puis les deux autres sont
attachées sous les schémas `fts` et `vectors`.

```
┌──────────────────────────────────────────────────────────┐
│  Connexion better-sqlite3 (synchrone, WAL)               │
│                                                          │
│  main      → data/ekts.db          ressources, projets…  │
│  fts       → data/ekts-fts.db      ressources_fts (FTS5) │
│  vectors   → data/ekts-vectors.db  ressources_vectors    │
│                                    (sqlite-vec / vec0)   │
└──────────────────────────────────────────────────────────┘
```

Pourquoi une connexion unique ? Elle permet d'écrire dans les trois fichiers **dans la même
transaction applicative** (`db.transaction()`), donc de ne jamais exposer une ressource absente de
son index plein texte.

| Fichier | Schéma | Rôle |
|---------|--------|------|
| `data/ekts.db` | `main` | Données structurées (JSON validé par `CHECK json_valid`) |
| `data/ekts-fts.db` | `fts` | Index plein texte FTS5 (BM25) |
| `data/ekts-vectors.db` | `vectors` | Embeddings `float[1536]` via `sqlite-vec` |

Les trois fichiers sont créés au premier `openDatabase()` dans `EKTS_DATA_DIR` (défaut `./data`).
`data/` est **ignoré par Git**.

## 2. Configuration

### 2.1 PRAGMA appliqués

| PRAGMA | Base | Valeur | Raison |
|--------|------|--------|--------|
| `journal_mode` | les 3 | `WAL` | Lectures concurrentes pendant les écritures |
| `synchronous` | les 3 | `NORMAL` | Compromis durabilité/performance en WAL |
| `foreign_keys` | main | `ON` | Intégrité référentielle |
| `busy_timeout` | main | `5000` ms | Attente en cas de verrou |
| `cache_size` | main | `-64000` (64 Mo) | Cache de pages |
| `temp_store` | main | `MEMORY` | Tables temporaires en RAM |

### 2.2 Permissions

Les fichiers de base sont restreints à `600` (propriétaire uniquement) et le répertoire à `700`,
sur les systèmes POSIX. Sans effet sur Windows.

### 2.3 Ouverture

```ts
import { openDatabase } from './src/data/database.js';

const database = openDatabase(); // EKTS_DATA_DIR ou ./data
const repository = new ResourceRepository(database.connection);

// …

database.close();
```

Options :

| Option | Défaut | Effet |
|--------|--------|-------|
| `dataDir` | `config.dataDir` | Répertoire des bases |
| `migrate` | `true` | Applique les migrations manquantes à l'ouverture |
| `loadVectors` | `true` | Charge l'extension `sqlite-vec` |

## 3. Schémas

### 3.1 `ekts.db`

#### Table `resources`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | TEXT | PK (UUID v4) |
| `type` | TEXT | `CHECK IN ('article','video','tutorial','tool','other')` |
| `title` | TEXT | `CHECK length(trim(title)) > 0` |
| `url` | TEXT | nullable |
| `tags` | TEXT | JSON `[]` par défaut, `CHECK json_valid` |
| `metadata` | TEXT | JSON `{}` par défaut, `CHECK json_valid` |
| `content` | TEXT | nullable |
| `embedding_model` | TEXT | nullable |
| `created_at` / `updated_at` | TEXT | ISO 8601 UTC |

Index : `idx_resources_type`, `idx_resources_created_at`.

#### Tables `projects` et `audits`

Créées dès la migration 001 conformément au blueprint ; elles seront exploitées par les MVP-2 et
MVP-3.

| `projects` | | `audits` | |
|---|---|---|---|
| `id` TEXT PK | | `id` TEXT PK | |
| `name` TEXT NOT NULL | | `url` TEXT NOT NULL | |
| `description` TEXT | | `level` TEXT `L1..L4` | |
| `status` TEXT `active/completed/archived` | | `findings` JSON `[]` | |
| `started_at`, `completed_at` TEXT | | `metadata` JSON `{}` | |
| `metadata` JSON `{}`, `created_at`, `updated_at` | | `created_at` TEXT | |

### 3.2 `ekts-fts.db` — `resources_fts`

```sql
CREATE VIRTUAL TABLE fts.resources_fts USING fts5(
  resource_id UNINDEXED,
  title,
  content,
  tags,
  tokenize = 'porter unicode61 remove_diacritics 2'
);
```

- `rowid` = `rowid` de la ligne `resources` correspondante.
- `tags` est indexé sous forme de chaîne séparée par des espaces.
- Tokenizer `porter` (racinisation anglaise) + `unicode61` (accents neutralisés).

> **Écart assumé par rapport au blueprint.** Le document SPRINT-02-01 prévoyait
> `content='main.resources'` et des triggers `AFTER INSERT/UPDATE/DELETE`. Cette conception n'est
> pas réalisable : FTS5 ne peut pas lire une table de contenu située dans un autre fichier, et
> SQLite interdit qu'un trigger écrive dans une base attachée
> (`qualified table names are not allowed on INSERT, UPDATE, DELETE statements within triggers`).
> La table est donc **autonome** et synchronisée par `ResourceRepository`.

### 3.3 `ekts-vectors.db` — `resources_vectors`

```sql
CREATE VIRTUAL TABLE vectors.resources_vectors USING vec0(
  resource_id TEXT PRIMARY KEY,
  embedding float[1536]
);
```

`1536` correspond à `text-embedding-3-small` (`EMBEDDING_DIMENSIONS` dans `src/shared/constants.ts`).

## 4. Migrations

`src/data/migrations/index.ts` expose `runMigrations(connection, list?)` :

1. crée `schema_migrations (version, name, applied_at)` si nécessaire ;
2. applique chaque migration non enregistrée **dans sa propre transaction** ;
3. met `PRAGMA user_version` à la version la plus haute connue.

```ts
import { runMigrations } from './src/data/migrations/index.js';

const applied = runMigrations(database.connection); // [] si déjà à jour
```

Règles :

- Une migration publiée est **immuable** ; tout changement de schéma passe par une nouvelle entrée.
- Une migration ne doit pas ouvrir de transaction elle-même (le runner le fait).
- `migrate: false` permet d'inspecter une base sans la modifier.

## 5. Repository

`ResourceRepository` reçoit la connexion par constructeur (aucun singleton, donc testable) :

```ts
const repository = new ResourceRepository(database.connection);
```

| Méthode | Comportement |
|---------|--------------|
| `create(input)` | Valide (Zod), insère, indexe en FTS, retourne la ressource persistée |
| `getById(id)` | Retourne la ressource ou `null` |
| `list(filters)` | Filtres `type`, `tags` (tous requis), `limit`, `offset` ; tri `created_at DESC, rowid DESC` |
| `update(id, input)` | Mise à jour partielle ; `null` efface `url`, `content`, `embeddingModel` ; réindexe FTS |
| `delete(id)` | Supprime la ressource, son entrée FTS et son vecteur ; retourne `false` si absente |

- Toute méthode qui prend des données utilisateur valide via Zod et lève `ZodError` en cas d'échec.
- Une mise à jour inexistante retourne `null` (pas d'exception).
- Les écritures sont transactionnelles sur les trois schémas.

## 6. Validation Zod

`src/shared/validators.ts` est la **source unique de vérité** des types du domaine :

| Schéma | Usage |
|--------|-------|
| `CreateResourceSchema` | Entrée de `create()` — `tags` et `metadata` ont des valeurs par défaut |
| `UpdateResourceSchema` | Entrée de `update()` — objet vide rejeté, `null` efface un champ |
| `ResourceFiltersSchema` | Entrée de `list()` — `limit` ∈ [1, 1000], `offset` ≥ 0 |
| `ResourceSchema` | Forme persistée (id UUID, dates ISO) |

Les types exportés dérivent des schémas : `z.input` pour les entrées (champs optionnels),
`z.output`/`z.infer` pour les sorties. Aucun type de domaine n'est écrit à la main.

## 7. Fichiers

```
src/data/
├── database.ts                      # ouverture, PRAGMA, ATTACH, permissions
├── migrations/
│   ├── index.ts                     # runner + registre des migrations
│   └── 001_init.ts                  # schémas des 3 bases
└── repositories/
    └── resource-repository.ts       # CRUD + synchronisation FTS/vecteurs

src/shared/
├── constants.ts                     # dimensions, noms de schémas et de tables
└── validators.ts                    # schémas Zod + types inférés

tests/
├── unit/validators.test.ts
└── integration/
    ├── database.test.ts
    └── resource-repository.test.ts
```

## 8. Tests

```bash
npm test                      # 67 tests (unitaires + intégration)
npm run coverage              # 100 % (seuils 80 %)
```

Les tests d'intégration créent une base réelle dans un répertoire temporaire
(`mkdtempSync`), puis le suppriment : aucune écriture dans `data/` ni dans le dépôt.

## 9. Limites connues

1. **Atomicité multi-fichiers.** SQLite garantit la durabilité transactionnelle entre bases
   attachées uniquement lorsque la base principale n'est **pas** en WAL. En WAL, un arrêt brutal
   entre deux commits fichiers peut laisser l'index FTS en retard. Correctif prévu : commande
   `ekts reindex` (Sprint 3-3).
2. **Embeddings périmés.** `update()` ne purgera pas l'entrée vectorielle : le recalcul appartient
   au Sprint 4 (génération d'embeddings). En attendant, un vecteur obsolète est inoffensif pour la
   recherche FTS mais fausse la recherche hybride.
3. **Pas de recherche dans cette version.** Les index sont alimentés, pas encore interrogés :
   `SearchEngine` arrive au Sprint 4.
4. **`data/` non versionné.** Aucun `data/.gitkeep` : le répertoire est créé à la demande.

## 10. Évolution

| Sprint | Apport |
|--------|--------|
| 3 | CRUD complet (update/delete exposés en CLI), réindexation FTS |
| 4 | `SearchEngine` hybride (BM25 + vecteurs, fusion RRF), génération d'embeddings |
| 10 | Repository des audits d'inspection |

## 11. Références

- [Architecture](../blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)
- [Stack et décisions](../blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md)
- [Sécurité et secrets](../blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md)
- FTS5 : <https://sqlite.org/fts5.html>
- sqlite-vec : <https://github.com/asg017/sqlite-vec>
