# Sprint 2-1 — Schémas SQLite (3 bases)

**Identifiant :** SPRINT-02-01  
**Parent :** SPRINT-02 (Data Layer)  
**Durée prévue :** 4 jours  
**Date de documentation :** 21 octobre 2026  
**Statut :** ✅ TERMINÉ (22/10/2026)  
**Dépend de :** SPRINT-01 (Setup projet) ✅

---

## 1. Objectif précis

**Créer les 3 bases SQLite avec schémas appropriés :**
- `ekts.db` — Données structurées (resources, projects, audits)
- `ekts-fts.db` — Index full-text (FTS5)
- `ekts-vectors.db` — Index vectoriel (sqlite-vec)

**Résultat concret attendu :**
- 3 fichiers SQLite créés dans `data/`
- WAL mode activé sur les 3 bases
- Schémas SQL exécutés (tables, index, vues)
- FTS5 virtual tables créées
- sqlite-vec extension chargée
- Tests de connexion passent

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Sprint 1 terminé | `npm run build` fonctionne | Retourner Sprint 1 |
| better-sqlite3 installé | `npm ls better-sqlite3` | `npm install better-sqlite3` |
| SQLite 3.45+ | `sqlite3 --version` | Installer SQLite récent |
| sqlite-vec disponible | Test chargement extension | Installer via npm ou système |

**Si prérequis manquant :** Documenter et demander intervention utilisateur.

---

## 3. Tâches atomiques

### Tâche 2.1 — Schéma ekts.db (ressources, projets, audits)

**Objectif :** Créer base structurée avec tables principales  
**Durée :** 4h  
**Fichiers concernés :** `src/data/database.ts`, `src/data/migrations/001_init.ts`

**Actions :**

```typescript
// src/data/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Créer dossier data si inexistant
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connexion aux 3 bases
export const db = new Database(path.join(dataDir, 'ekts.db'));
export const dbFts = new Database(path.join(dataDir, 'ekts-fts.db'));
export const dbVectors = new Database(path.join(dataDir, 'ekts-vectors.db'));

// Configuration WAL mode
function configureDatabase(database: Database.Database) {
  database.pragma('journal_mode = WAL');
  database.pragma('synchronous = NORMAL');
  database.pragma('foreign_keys = ON');
  database.pragma('cache_size = -64000'); // 64 MB
  database.pragma('temp_store = MEMORY');
}

configureDatabase(db);
configureDatabase(dbFts);
configureDatabase(dbVectors);

// Permissions fichiers (chmod 600)
fs.chmodSync(path.join(dataDir, 'ekts.db'), 0o600);
fs.chmodSync(path.join(dataDir, 'ekts-fts.db'), 0o600);
fs.chmodSync(path.join(dataDir, 'ekts-vectors.db'), 0o600);
```

```typescript
// src/data/migrations/001_init.ts
import { db } from '../database';

export function migrate001Init() {
  // Table resources
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('article', 'video', 'tutorial', 'tool', 'other')),
      title TEXT NOT NULL,
      url TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      content TEXT,
      embedding_model TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'archived')),
      started_at TEXT,
      completed_at TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Table audits
  db.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('L1', 'L2', 'L3', 'L4')),
      findings TEXT NOT NULL DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    )
  `);

  // Index pour recherches fréquentes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at)`);
}

// Exécuter migration
migrate001Init();
```

**Résultat attendu :**
- `data/ekts.db` créé avec tables resources, projects, audits
- Index créés pour performances
- WAL mode activé
- Permissions 600

**Vérification :**
```bash
ls -la data/
sqlite3 data/ekts.db ".tables"
sqlite3 data/ekts.db "PRAGMA journal_mode;"
```

**Critères d'acceptation :**
- ✅ `data/ekts.db` existe
- ✅ Tables resources, projects, audits créées
- ✅ Index créés
- ✅ WAL mode activé
- ✅ Permissions 600

---

### Tâche 2.2 — Schéma ekts-fts.db (FTS5)

**Objectif :** Créer base FTS5 avec virtual tables  
**Durée :** 4h  
**Fichiers concernés :** `src/data/migrations/001_init.ts`

**Actions :**

```typescript
// Ajouter à src/data/migrations/001_init.ts
import { dbFts } from '../database';

export function migrate001InitFts() {
  // Virtual table FTS5 pour resources
  dbFts.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS resources_fts USING fts5(
      title,
      content,
      tags,
      content='main.resources',
      content_rowid='rowid',
      tokenize='porter unicode61'
    )
  `);

  // Trigger pour synchronisation automatique
  dbFts.exec(`
    CREATE TRIGGER IF NOT EXISTS resources_ai AFTER INSERT ON resources BEGIN
      INSERT INTO resources_fts(rowid, title, content, tags)
      VALUES (new.rowid, new.title, new.content, new.tags);
    END
  `);

  dbFts.exec(`
    CREATE TRIGGER IF NOT EXISTS resources_ad AFTER DELETE ON resources BEGIN
      INSERT INTO resources_fts(resources_fts, rowid, title, content, tags)
      VALUES ('delete', old.rowid, old.title, old.content, old.tags);
    END
  `);

  dbFts.exec(`
    CREATE TRIGGER IF NOT EXISTS resources_au AFTER UPDATE ON resources BEGIN
      INSERT INTO resources_fts(resources_fts, rowid, title, content, tags)
      VALUES ('delete', old.rowid, old.title, old.content, old.tags);
      INSERT INTO resources_fts(rowid, title, content, tags)
      VALUES (new.rowid, new.title, new.content, new.tags);
    END
  `);
}

// Exécuter migration FTS
migrate001InitFts();
```

**Résultat attendu :**
- `data/ekts-fts.db` créé avec virtual table FTS5
- Triggers de synchronisation créés
- Tokenizer porter unicode61 configuré

**Vérification :**
```bash
sqlite3 data/ekts-fts.db ".tables"
sqlite3 data/ekts-fts.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='resources_fts';"
```

**Critères d'acceptation :**
- ✅ `data/ekts-fts.db` existe
- ✅ Virtual table resources_fts créée
- ✅ Triggers synchronisation créés
- ✅ Tokenizer configuré

---

### Tâche 2.3 — Schéma ekts-vectors.db (sqlite-vec)

**Objectif :** Créer base vectorielle avec extension sqlite-vec  
**Durée :** 4h  
**Fichiers concernés :** `src/data/migrations/001_init.ts`

**Actions :**

```typescript
// Ajouter à src/data/migrations/001_init.ts
import { dbVectors } from '../database';

export function migrate001InitVectors() {
  // Charger extension sqlite-vec
  dbVectors.loadExtension('vec0');

  // Virtual table pour embeddings
  dbVectors.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS resources_vectors USING vec0(
      resource_id TEXT PRIMARY KEY,
      embedding float[1536]
    )
  `);
}

// Exécuter migration vectors
migrate001InitVectors();
```

**Note :** sqlite-vec doit être installé. Options :
1. **npm** : `npm install sqlite-vec` (recommandé)
2. **Système** : Installer extension SQLite vec

**Installation npm :**
```bash
npm install sqlite-vec
```

**Résultat attendu :**
- `data/ekts-vectors.db` créé avec virtual table vec0
- Extension sqlite-vec chargée
- Table resources_vectors créée (1536 dimensions pour OpenAI)

**Vérification :**
```bash
sqlite3 data/ekts-vectors.db ".tables"
sqlite3 data/ekts-vectors.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='resources_vectors';"
```

**Critères d'acceptation :**
- ✅ `data/ekts-vectors.db` existe
- ✅ Extension sqlite-vec chargée
- ✅ Virtual table resources_vectors créée
- ✅ 1536 dimensions (OpenAI text-embedding-3-small)

---

### Tâche 2.4 — Tests connexion et schémas

**Objectif :** Tester connexions et vérification schémas  
**Durée :** 4h  
**Fichiers concernés :** `tests/data/database.test.ts`

**Actions :**

```typescript
// tests/data/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

describe('Database Connection', () => {
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'ekts.db');
  const dbFtsPath = path.join(dataDir, 'ekts-fts.db');
  const dbVectorsPath = path.join(dataDir, 'ekts-vectors.db');

  beforeAll(() => {
    // Exécuter migrations
    import('../src/data/migrations/001_init');
  });

  afterAll(() => {
    // Nettoyage (optionnel)
    // fs.unlinkSync(dbPath);
    // fs.unlinkSync(dbFtsPath);
    // fs.unlinkSync(dbVectorsPath);
  });

  it('should create 3 database files', () => {
    expect(fs.existsSync(dbPath)).toBe(true);
    expect(fs.existsSync(dbFtsPath)).toBe(true);
    expect(fs.existsSync(dbVectorsPath)).toBe(true);
  });

  it('should have WAL mode enabled', () => {
    const db = new Database(dbPath);
    const mode = db.pragma('journal_mode', { simple: true });
    expect(mode).toBe('wal');
    db.close();
  });

  it('should have foreign keys enabled', () => {
    const db = new Database(dbPath);
    const fk = db.pragma('foreign_keys', { simple: true });
    expect(fk).toBe(1);
    db.close();
  });

  it('should have correct permissions (chmod 600)', () => {
    const stats = fs.statSync(dbPath);
    const mode = (stats.mode & 0o777).toString(8);
    expect(mode).toBe('600');
  });

  it('should have resources table', () => {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='resources';").all();
    expect(tables.length).toBeGreaterThan(0);
    db.close();
  });

  it('should have projects table', () => {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects';").all();
    expect(tables.length).toBeGreaterThan(0);
    db.close();
  });

  it('should have audits table', () => {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audits';").all();
    expect(tables.length).toBeGreaterThan(0);
    db.close();
  });

  it('should have FTS5 virtual table', () => {
    const db = new Database(dbFtsPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='resources_fts';").all();
    expect(tables.length).toBeGreaterThan(0);
    db.close();
  });

  it('should have sqlite-vec virtual table', () => {
    const db = new Database(dbVectorsPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='resources_vectors';").all();
    expect(tables.length).toBeGreaterThan(0);
    db.close();
  });
});
```

**Résultat attendu :**
- 9 tests passent
- 3 bases créées
- WAL mode activé
- Foreign keys activées
- Permissions 600
- Tables créées

**Vérification :**
```bash
npm test -- tests/data/database.test.ts
```

**Critères d'acceptation :**
- ✅ Tous tests passent
- ✅ 3 bases créées
- ✅ WAL mode vérifié
- ✅ Permissions vérifiées
- ✅ Tables vérifiées

---

## 4. Fichiers concernés

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/data/database.ts` | Connexion SQLite + configuration |
| `src/data/migrations/001_init.ts` | Migration initiale (schémas) |
| `data/.gitkeep` | Placeholder dossier data |
| `tests/data/database.test.ts` | Tests connexion |

### 4.2 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `.gitignore` | Ajouter `data/` si absent |
| `src/shared/types.ts` | Ajouter interfaces Resource, Project, Audit |

---

## 5. Configurations externes nécessaires

### 5.1 sqlite-vec

**Installation :**
```bash
npm install sqlite-vec
```

**Vérification :**
```bash
node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.loadExtension('vec0'); console.log('sqlite-vec OK');"
```

**Si échec :**
- Vérifier version SQLite (3.45+ requis)
- Vérifier installation sqlite-vec
- Consulter documentation : https://github.com/asg017/sqlite-vec

---

## 6. Responsabilités

### 6.1 Agent IA

- ✅ Créer `src/data/database.ts`
- ✅ Créer `src/data/migrations/001_init.ts`
- ✅ Exécuter migrations
- ✅ Créer tests
- ✅ Vérifier schémas

### 6.2 Utilisateur

- ✅ Valider sous-sprint terminé
- ✅ Intervenir si sqlite-vec installation échoue

---

## 7. Tests

### 7.1 Tests à exécuter

```bash
npm test -- tests/data/database.test.ts
```

### 7.2 Résultats attendus

- ✅ 9 tests passent
- ✅ 3 bases créées
- ✅ WAL mode activé
- ✅ Tables créées

---

## 8. Critères d'acceptation

| ID | Critère | Méthode |
|----|---------|---------|
| C2.1.1 | `data/ekts.db` créé | `ls data/` |
| C2.1.2 | `data/ekts-fts.db` créé | `ls data/` |
| C2.1.3 | `data/ekts-vectors.db` créé | `ls data/` |
| C2.1.4 | WAL mode activé | `sqlite3 data/ekts.db "PRAGMA journal_mode;"` |
| C2.1.5 | Tables resources, projects, audits créées | `sqlite3 data/ekts.db ".tables"` |
| C2.2.1 | Virtual table FTS5 créée | `sqlite3 data/ekts-fts.db ".tables"` |
| C2.2.2 | Triggers synchronisation créés | `sqlite3 data/ekts-fts.db "SELECT * FROM sqlite_master WHERE type='trigger';"` |
| C2.3.1 | Extension sqlite-vec chargée | Test Node.js |
| C2.3.2 | Virtual table vec0 créée | `sqlite3 data/ekts-vectors.db ".tables"` |
| C2.4.1 | Tests connexion passent | `npm test -- tests/data/database.test.ts` |

**Tous critères obligatoires.**

---

## 9. Preuves de réussite

**Logs à conserver :**
```bash
npm test -- tests/data/database.test.ts > test-database.log 2>&1
```

**Captures à conserver :**
- Liste fichiers `data/`
- Schémas SQL (fichiers migration)
- Résultat tests

---

## 10. Conditions d'échec

**Échec si :**
- ❌ Bases SQLite non créées
- ❌ WAL mode non activé
- ❌ FTS5 non configuré
- ❌ sqlite-vec non chargé
- ❌ Tests échouent

**Action si échec :**
1. Documenter erreur
2. Identifier cause (SQLite version, extension manquante)
3. Proposer solution
4. Si blocage → demander intervention utilisateur

---

## 11. Dépendances

**Dépend de :**
- ✅ Sprint 1 terminé
- ✅ better-sqlite3 installé
- ✅ sqlite-vec disponible

---

## 12. Conditions de passage au sous-sprint suivant

**Pour passer à Sprint 2-2 :**
- ✅ Tous critères C2.1.x, C2.2.x, C2.3.x, C2.4.x satisfaits
- ✅ 3 bases créées
- ✅ Tests passent
- ✅ Approbation utilisateur

---

## 13. Éléments à reporter

**Aucun** — Tout doit être terminé dans ce sous-sprint.

---

## 14. Décisions à faire valider

**Aucune** — ADR-001 déjà validé.

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Sous-sprint 2-1 prêt pour exécution**

---

## Addendum d'implémentation — 22 octobre 2026

**Statut : ✅ TERMINÉ** (commit `Sprint 2-1`).

### Écarts assumés par rapport au plan

| Point du plan | Réalisation | Raison |
|---------------|-------------|--------|
| `content='main.resources'` + triggers de synchronisation FTS | Table FTS5 **autonome**, synchronisée par `ResourceRepository` | Une table de contenu FTS5 ne peut pas résider dans un autre fichier (échec `rebuild` : `near ".": syntax error`) et SQLite interdit qu'un trigger écrive dans une base attachée (`qualified table names are not allowed on INSERT, UPDATE, DELETE statements within triggers`). Vérifié expérimentalement. |
| 3 connexions séparées | **Une** connexion, `fts` et `vectors` attachées | Permet une transaction unique sur les trois fichiers ; les écritures restent cohérentes. |
| `db.loadExtension('vec0')` | `sqliteVec.load(connection)` (`sqlite-vec` 0.1.9) | `loadExtension` attend un chemin de bibliothèque, pas un nom de module. |
| `data/.gitkeep` | Aucun fichier (répertoire créé à la demande) | `data/` est entièrement ignoré par Git ; un `.gitkeep` imposerait de forcer l'ajout. |
| Permissions `600` | Appliquées, **sans effet sur Windows** | Modèle POSIX indisponible ; le code sort tôt sur `win32`. |

### Fichiers produits

| Fichier | Rôle |
|---------|------|
| `src/data/database.ts` | `openDatabase`, `resolveDatabasePaths`, `applyPragmas`, `secureDatabaseFiles` |
| `src/data/migrations/001_init.ts` | `createStructuredSchema`, `createFtsSchema`, `createVectorSchema` |
| `src/data/migrations/index.ts` | Runner `runMigrations` + table `schema_migrations` |
| `src/shared/constants.ts` | `EMBEDDING_DIMENSIONS`, noms de schémas et de tables |
| `tests/integration/database.test.ts` | 15 tests (bases, WAL, schémas, permissions, migrations) |

### Vérifications exécutées

```bash
npm test -- tests/integration/database.test.ts   # 15 tests OK
npm run coverage                                  # 100 %
```

Contrôles manuels sur un répertoire temporaire : trois fichiers créés en `600`, `vec_version()`
= `v0.1.9`, table `resources_fts` interrogeable, `PRAGMA user_version` = 1.
