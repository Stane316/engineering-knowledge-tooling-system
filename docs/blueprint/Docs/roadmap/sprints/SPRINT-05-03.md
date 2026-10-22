# Sprint 5-3 — Commande status + tests intégration + documentation

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 3 jours  
**Objectif :** Dernière commande (status), tests d'intégration complets, documentation CLI  
**Dépendance :** Sprint 5-2 ✅

---

## 1. Contexte

Les Sprints 5-1 et 5-2 ont implémenté 6 commandes CLI (init, add, get, search, list, delete).  
Le Sprint 5-3 va :
- 🎯 Implémenter la 7e commande : `status` (statut système)
- 🎯 Créer les tests d'intégration complets
- 🎯 Documenter l'API CLI

---

## 2. État initial (fin Sprint 5-2)

```
src/
├── cli/
│   ├── index.ts                    ✅ (point d'entrée)
│   ├── services.ts                 ✅ (helper initialisation)
│   ├── commands/
│   │   ├── init.ts                 ✅
│   │   ├── add.ts                  ✅
│   │   ├── search.ts               ✅
│   │   ├── get.ts                  ✅
│   │   ├── list.ts                 ✅
│   │   └── delete.ts               ✅
│   └── formatters/
│       ├── resource-formatter.ts   ✅
│       └── search-formatter.ts     ✅
├── business/
│   └── ...                         ✅
└── ...

tests/
└── (pas encore de tests CLI)
```

---

## 3. Tâches atomiques

### 3.1 Implémenter la commande status (jour 1, matin — 4h)

**Fichier :** `src/cli/commands/status.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createKnowledgeManager, createSearchEngine, createConnections } from '../services';

interface StatusInfo {
  version: string;
  databases: {
    ekts: { exists: boolean; size: number; path: string };
    fts: { exists: boolean; size: number; path: string };
    vectors: { exists: boolean; size: number; path: string };
  };
  resources: {
    total: number;
    byType: Record<string, number>;
  };
  system: {
    nodeVersion: string;
    platform: string;
    dbPath: string;
  };
}

/**
 * Récupère les informations de statut
 */
async function getStatusInfo(): Promise<StatusInfo> {
  const dbPath = process.env.EKTS_DB_PATH ?? './data';
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
  );

  // Informations bases de données
  const getDbInfo = (name: string) => {
    const dbFile = path.join(dbPath, name);
    const exists = fs.existsSync(dbFile);
    const size = exists ? fs.statSync(dbFile).size : 0;
    return { exists, size, path: dbFile };
  };

  const databases = {
    ekts: getDbInfo('ekts.db'),
    fts: getDbInfo('ekts-fts.db'),
    vectors: getDbInfo('ekts-vectors.db'),
  };

  // Compter les ressources
  let totalResources = 0;
  const byType: Record<string, number> = {};

  if (databases.ekts.exists) {
    try {
      const knowledgeManager = createKnowledgeManager();
      const resources = await knowledgeManager.listResources();
      totalResources = resources.length;
      resources.forEach(r => {
        byType[r.type] = (byType[r.type] ?? 0) + 1;
      });
    } catch {
      // Ignore if DB is not initialized
    }
  }

  return {
    version: packageJson.version,
    databases,
    resources: { total: totalResources, byType },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      dbPath,
    },
  };
}

/**
 * Formate le statut pour affichage humain
 */
function formatStatusHuman(status: StatusInfo): string {
  const lines: string[] = [];

  // En-tête
  lines.push(chalk.blue.bold('📊 EKTS System Status\n'));

  // Version
  lines.push(`  ${chalk.bold('Version:')} ${status.version}`);

  // Bases de données
  lines.push('');
  lines.push(chalk.bold('  Databases:'));

  const dbTable = new Table({
    head: [
      chalk.white.bold('Database'),
      chalk.white.bold('Status'),
      chalk.white.bold('Size'),
      chalk.white.bold('Path'),
    ],
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return chalk.red('N/A');
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDbName = (name: string, exists: boolean) => {
    return exists ? chalk.green(name) : chalk.red(name);
  };

  dbTable.push([
    formatDbName('ekts.db', status.databases.ekts.exists),
    status.databases.ekts.exists ? chalk.green('✓ OK') : chalk.red('✗ Missing'),
    formatSize(status.databases.ekts.size),
    chalk.gray(status.databases.ekts.path),
  ]);

  dbTable.push([
    formatDbName('ekts-fts.db', status.databases.fts.exists),
    status.databases.fts.exists ? chalk.green('✓ OK') : chalk.red('✗ Missing'),
    formatSize(status.databases.fts.size),
    chalk.gray(status.databases.fts.path),
  ]);

  dbTable.push([
    formatDbName('ekts-vectors.db', status.databases.vectors.exists),
    status.databases.vectors.exists ? chalk.green('✓ OK') : chalk.red('✗ Missing'),
    formatSize(status.databases.vectors.size),
    chalk.gray(status.databases.vectors.path),
  ]);

  lines.push(dbTable.toString());

  // Ressources
  lines.push('');
  lines.push(chalk.bold('  Resources:'));
  lines.push(`    Total: ${status.resources.total}`);

  if (Object.keys(status.resources.byType).length > 0) {
    Object.entries(status.resources.byType).forEach(([type, count]) => {
      lines.push(`    - ${type}: ${count}`);
    });
  }

  // Système
  lines.push('');
  lines.push(chalk.bold('  System:'));
  lines.push(`    Node.js: ${status.system.nodeVersion}`);
  lines.push(`    Platform: ${status.system.platform}`);
  lines.push(`    DB Path: ${status.system.dbPath}`);

  return lines.join('\n');
}

/**
 * Commande : ekts status
 * Affiche le statut du système
 */
export function statusCommand(program: Command): void {
  program
    .command('status')
    .description('Display system status (databases, resources, configuration)')
    .action(async () => {
      try {
        const status = await getStatusInfo();

        if (program.opts().json) {
          console.log(JSON.stringify(status, null, 2));
        } else {
          console.log(formatStatusHuman(status));
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Modifier :** `src/cli/index.ts` — ajouter `statusCommand`

```typescript
import { statusCommand } from './commands/status';
// ...
statusCommand(program);
```

**Tests :**
```bash
ekts status
# ✅ Affichage du statut complet avec tableaux

ekts status --json
# ✅ Sortie JSON
```

**Commit :**
```bash
git add src/cli/commands/status.ts
git add src/cli/index.ts
git commit -m "feat(cli): implement status command"
```

### 3.2 Tests d'intégration — Setup (jour 1, après-midi — 4h)

**Fichier :** `tests/cli/helpers.ts`

```typescript
import { execSync, ExecSyncOptions } from 'child_process';
import fs from 'fs';
import path from 'path';

const CLI_PATH = path.join(__dirname, '../../dist/cli/index.js');
const TEST_DB_PATH = path.join(__dirname, '../test-data');

/**
 * Exécute une commande CLI et retourne le résultat
 */
export function runCLI(args: string, options?: ExecSyncOptions): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf-8',
      env: {
        ...process.env,
        EKTS_DB_PATH: TEST_DB_PATH,
      },
      ...options,
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      exitCode: error.status ?? 1,
    };
  }
}

/**
 * Prépare l'environnement de test
 */
export function setupTestEnvironment(): void {
  // Créer le répertoire de test
  if (!fs.existsSync(TEST_DB_PATH)) {
    fs.mkdirSync(TEST_DB_PATH, { recursive: true });
  }

  // Initialiser les bases
  runCLI('init');
}

/**
 * Nettoie l'environnement de test
 */
export function cleanupTestEnvironment(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
  }
}

/**
 * Ajoute une ressource de test
 */
export function addTestResource(title: string, type = 'article', tags = ''): string {
  const result = runCLI(
    `add --type ${type} --title "${title}" --tags "${tags}" --json`
  );
  const parsed = JSON.parse(result.stdout);
  return parsed.id;
}
```

**Fichier :** `tests/cli/setup.ts`

```typescript
import { setupTestEnvironment, cleanupTestEnvironment } from './helpers';

// Setup avant tous les tests
beforeAll(() => {
  setupTestEnvironment();
});

// Cleanup après tous les tests
afterAll(() => {
  cleanupTestEnvironment();
});
```

**Commit :**
```bash
git add tests/cli/
git commit -m "test(cli): add test helpers and setup"
```

### 3.3 Tests d'intégration — Commandes (jour 2 — 8h)

**Fichier :** `tests/cli/cli.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { runCLI, setupTestEnvironment, cleanupTestEnvironment, addTestResource } from './helpers';

describe('CLI Integration Tests', () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('ekts --help', () => {
    it('should display help information', () => {
      const { stdout, exitCode } = runCLI('--help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Engineering Knowledge Tooling System');
      expect(stdout).toContain('init');
      expect(stdout).toContain('add');
      expect(stdout).toContain('search');
      expect(stdout).toContain('get');
      expect(stdout).toContain('list');
      expect(stdout).toContain('delete');
      expect(stdout).toContain('status');
    });
  });

  describe('ekts --version', () => {
    it('should display version', () => {
      const { stdout, exitCode } = runCLI('--version');
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('ekts init', () => {
    it('should initialize databases', () => {
      cleanupTestEnvironment();
      const { stdout, exitCode } = runCLI('init');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('initialized');
    });

    it('should support --json flag', () => {
      cleanupTestEnvironment();
      const { stdout, exitCode } = runCLI('init --json');
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('ektsDb');
      expect(parsed).toHaveProperty('ftsDb');
      expect(parsed).toHaveProperty('vectorsDb');
    });
  });

  describe('ekts add', () => {
    it('should add a resource', () => {
      const { stdout, exitCode } = runCLI(
        'add --type article --title "Test Article" --tags "test,demo"'
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('created');
    });

    it('should add a resource with JSON output', () => {
      const { stdout, exitCode } = runCLI(
        'add --type article --title "JSON Test" --json'
      );
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('id');
      expect(parsed.type).toBe('article');
      expect(parsed.title).toBe('JSON Test');
    });

    it('should fail with missing required options', () => {
      const { exitCode, stderr } = runCLI('add --type article');
      expect(exitCode).not.toBe(0);
    });

    it('should fail with invalid type', () => {
      const { exitCode } = runCLI('add --type invalid --title "Test"');
      expect(exitCode).not.toBe(0);
    });
  });

  describe('ekts get', () => {
    it('should get a resource by ID', () => {
      const id = addTestResource('Get Test');
      const { stdout, exitCode } = runCLI(`get ${id}`);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Get Test');
    });

    it('should return JSON output', () => {
      const id = addTestResource('JSON Get Test');
      const { stdout, exitCode } = runCLI(`get ${id} --json`);
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.id).toBe(id);
      expect(parsed.title).toBe('JSON Get Test');
    });

    it('should fail with non-existent ID', () => {
      const { exitCode } = runCLI('get nonexistent-id');
      expect(exitCode).toBe(3);
    });
  });

  describe('ekts list', () => {
    it('should list all resources', () => {
      addTestResource('List Test 1');
      addTestResource('List Test 2');
      const { stdout, exitCode } = runCLI('list');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('List Test');
    });

    it('should filter by type', () => {
      addTestResource('Article', 'article');
      addTestResource('Video', 'video');
      const { stdout, exitCode } = runCLI('list --type article');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Article');
    });

    it('should limit results', () => {
      for (let i = 0; i < 5; i++) {
        addTestResource(`Limit Test ${i}`);
      }
      const { stdout, exitCode } = runCLI('list --limit 2 --json');
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.resources.length).toBeLessThanOrEqual(2);
    });

    it('should return JSON output', () => {
      const { stdout, exitCode } = runCLI('list --json');
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('count');
      expect(parsed).toHaveProperty('resources');
    });
  });

  describe('ekts search', () => {
    it('should search resources', () => {
      addTestResource('SQLite Tutorial', 'article', 'sqlite,database');
      const { stdout, exitCode } = runCLI('search "SQLite"');
      expect(exitCode).toBe(0);
    });

    it('should support mode option', () => {
      addTestResource('FTS Test', 'article', 'test');
      const { stdout, exitCode } = runCLI('search "test" --mode fts');
      expect(exitCode).toBe(0);
    });

    it('should support limit option', () => {
      const { stdout, exitCode } = runCLI('search "test" --limit 3 --json');
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.results.length).toBeLessThanOrEqual(3);
    });

    it('should return JSON output', () => {
      const { stdout, exitCode } = runCLI('search "test" --json');
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('count');
      expect(parsed).toHaveProperty('results');
    });

    it('should return empty results for no match', () => {
      const { stdout, exitCode } = runCLI('search "zzzznonexistent"');
      expect(exitCode).toBe(0);
    });
  });

  describe('ekts delete', () => {
    it('should delete a resource with --yes flag', () => {
      const id = addTestResource('Delete Test');
      const { stdout, exitCode } = runCLI(`delete ${id} --yes`);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('deleted');
    });

    it('should return JSON output', () => {
      const id = addTestResource('JSON Delete Test');
      const { stdout, exitCode } = runCLI(`delete ${id} --yes --json`);
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.deleted).toBe(true);
      expect(parsed.id).toBe(id);
    });

    it('should fail with non-existent ID', () => {
      const { exitCode } = runCLI('delete nonexistent-id --yes');
      expect(exitCode).toBe(3);
    });
  });

  describe('ekts status', () => {
    it('should display system status', () => {
      const { stdout, exitCode } = runCLI('status');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('EKTS System Status');
      expect(stdout).toContain('Databases');
      expect(stdout).toContain('Resources');
      expect(stdout).toContain('System');
    });

    it('should return JSON output', () => {
      const { stdout, exitCode } = runCLI('status --json');
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('databases');
      expect(parsed).toHaveProperty('resources');
      expect(parsed).toHaveProperty('system');
    });
  });

  describe('Error handling', () => {
    it('should return proper exit codes for errors', () => {
      const { exitCode: notFoundCode } = runCLI('get nonexistent');
      expect(notFoundCode).toBe(3);
    });

    it('should return 1 for general errors', () => {
      // DB not initialized
      cleanupTestEnvironment();
      const { exitCode } = runCLI('list');
      expect(exitCode).toBe(1);
      setupTestEnvironment();
    });
  });
});
```

**Validation :**
```bash
npm test tests/cli/cli.test.ts
# ✅ Tous les tests d'intégration passent

npm run test:coverage -- tests/cli/
# ✅ > 80% couverture
```

**Commit :**
```bash
git add tests/cli/
git commit -m "test(cli): add integration tests for all commands"
```

### 3.4 Documentation CLI (jour 3, matin — 4h)

**Fichier :** `docs/CLI.md`

```markdown
# CLI — Command Line Interface

## Overview

EKTS fournit une interface en ligne de commande complète pour gérer les ressources de connaissance.

## Installation

```bash
# Installation globale
npm install -g ekts

# Installation locale (développement)
npm link
```

## Commandes

### ekts init

Initialise les 3 bases de données SQLite.

```bash
ekts init [--force] [--json]
```

**Options :**
- `--force` — Force la réinitialisation (supprime les bases existantes)
- `--json` — Sortie au format JSON

**Exemple :**
```bash
$ ekts init
🔧 Initializing databases...
✓ Databases initialized successfully
  - ekts.db: ./data/ekts.db
  - ekts-fts.db: ./data/ekts-fts.db
  - ekts-vectors.db: ./data/ekts-vectors.db
```

---

### ekts add

Ajoute une nouvelle ressource avec indexation automatique (FTS + Vector).

```bash
ekts add --type <type> --title <title> [options]
```

**Options obligatoires :**
- `--type <type>` — Type : article | video | tutorial | tool | other
- `--title <title>` — Titre de la ressource

**Options optionnelles :**
- `--url <url>` — URL de la ressource
- `--tags <tags>` — Tags séparés par des virgules
- `--content <content>` — Contenu texte pour l'indexation

**Exemple :**
```bash
$ ekts add \
    --type article \
    --title "Introduction to SQLite" \
    --url "https://example.com/sqlite" \
    --tags "sqlite,database,tutorial" \
    --content "SQLite is a lightweight RDBMS..."

📝 Adding resource...
✓ Resource created successfully
  ID: abc-123-def
  Title: Introduction to SQLite
  Type: article
  Tags: sqlite, database, tutorial
```

---

### ekts search

Recherche hybride (FTS + Vector + RRF).

```bash
ekts search <query> [options]
```

**Options :**
- `-l, --limit <number>` — Nombre max de résultats (défaut: 10)
- `-m, --mode <mode>` — Mode : hybrid | fts | vector (défaut: hybrid)
- `-t, --type <type>` — Filtrer par type
- `--tags <tags>` — Filtrer par tags (séparés par virgules)

**Exemples :**
```bash
# Recherche hybride (défaut)
$ ekts search "SQLite tutorial"
🔍 Found 3 result(s)
┌────┬──────────┬────────────┬──────────────────────────────────────────┬───────────────────────────┐
│ #  │ Score    │ Type       │ Title                                    │ Tags                      │
├────┼──────────┼────────────┼──────────────────────────────────────────┼───────────────────────────┤
│ 1  │ 0.0328   │ article    │ Introduction to SQLite                   │ sqlite, database          │
│ 2  │ 0.0164   │ tutorial   │ SQLite for Beginners                     │ sqlite, tutorial          │
│ 3  │ 0.0082   │ video      │ Advanced SQLite Techniques               │ sqlite, advanced          │
└────┴──────────┴────────────┴──────────────────────────────────────────┴───────────────────────────┘
⏱ Search completed in 125ms

# Recherche FTS uniquement
$ ekts search "SQLite" --mode fts

# Recherche vectorielle
$ ekts search "database basics" --mode vector

# Avec filtres
$ ekts search "tutorial" --type article --tags "beginner" --limit 5
```

---

### ekts get

Obtient une ressource par son ID.

```bash
ekts get <id>
```

**Exemple :**
```bash
$ ekts get abc-123-def
📄 Resource Details
  ID: abc-123-def
  Title: Introduction to SQLite
  Type: article
  URL: https://example.com/sqlite
  Tags: sqlite, database, tutorial
  Content: SQLite is a lightweight RDBMS...
  Created: 2026-01-15T10:30:00Z
  Updated: 2026-01-15T10:30:00Z
```

---

### ekts list

Liste les ressources avec filtres optionnels.

```bash
ekts list [options]
```

**Options :**
- `-l, --limit <number>` — Nombre max de résultats
- `-t, --type <type>` — Filtrer par type
- `--tags <tags>` — Filtrer par tags

**Exemples :**
```bash
# Liste toutes les ressources
$ ekts list
📋 15 resource(s)
┌────┬────────────┬────────────┬────────────────────────────────────┬────────────────────┬────────────┐
│ #  │ ID         │ Type       │ Title                              │ Tags               │ Updated    │
├────┼────────────┼────────────┼────────────────────────────────────┼────────────────────┼────────────┤
│ 1  │ abc-123... │ article    │ Introduction to SQLite             │ sqlite, database   │ 2026-01-15 │
│ 2  │ def-456... │ video      │ Advanced Techniques                │ sqlite, advanced   │ 2026-01-14 │
└────┴────────────┴────────────┴────────────────────────────────────┴────────────────────┴────────────┘

# Filtrer par type
$ ekts list --type article

# Filtrer par tags
$ ekts list --tags "tutorial,beginner"

# Limiter
$ ekts list --limit 5
```

---

### ekts delete

Supprime une ressource par son ID.

```bash
ekts delete <id> [-y|--yes]
```

**Options :**
- `-y, --yes` — Supprime sans confirmation

**Exemple :**
```bash
$ ekts delete abc-123-def
📄 Resource to delete:
  ID: abc-123-def
  Title: Introduction to SQLite
  Type: article
⚠ Are you sure you want to delete this resource? (y/N) y
✓ Resource deleted: abc-123-def

# Sans confirmation
$ ekts delete abc-123-def --yes
✓ Resource deleted: abc-123-def
```

---

### ekts status

Affiche le statut du système.

```bash
ekts status
```

**Exemple :**
```bash
$ ekts status
📊 EKTS System Status

  Version: 1.0.0

  Databases:
┌────────────────┬────────┬────────┬────────────────────────────┐
│ Database       │ Status │ Size   │ Path                       │
├────────────────┼────────┼────────┼────────────────────────────┤
│ ekts.db        │ ✓ OK   │ 2.1 MB │ ./data/ekts.db             │
│ ekts-fts.db    │ ✓ OK   │ 1.5 MB │ ./data/ekts-fts.db         │
│ ekts-vectors.db│ ✓ OK   │ 8.3 MB │ ./data/ekts-vectors.db     │
└────────────────┴────────┴────────┴────────────────────────────┘

  Resources:
    Total: 42
    - article: 25
    - video: 10
    - tutorial: 7

  System:
    Node.js: v20.11.0
    Platform: linux
    DB Path: ./data
```

---

## Options globales

Toutes les commandes supportent les options globales :

| Option | Description |
|--------|-------------|
| `--json` | Sortie au format JSON (pour scripts) |
| `--no-colors` | Désactive les couleurs |
| `--help` | Affiche l'aide |
| `--version` | Affiche la version |

## Codes de sortie

| Code | Signification |
|------|---------------|
| `0` | Succès |
| `1` | Erreur générale |
| `2` | Arguments invalides |
| `3` | Ressource non trouvée |
| `4` | Erreur de validation |

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `EKTS_DB_PATH` | Chemin des bases SQLite | `./data` |
| `OPENAI_API_KEY` | Clé API OpenAI (embeddings) | — |

## Intégration avec scripts

### Avec jq

```bash
# Extraire les IDs des résultats de recherche
ekts search "SQLite" --json | jq '.results[].resource.id'

# Compter les ressources par type
ekts list --json | jq '.resources | group_by(.type) | map({type: .[0].type, count: length})'
```

### Avec grep

```bash
# Filtrer les résultats
ekts search "tutorial" | grep "article"
```

### Dans des scripts bash

```bash
#!/bin/bash
# Ajouter plusieurs ressources
for file in docs/*.md; do
  title=$(basename "$file" .md)
  content=$(cat "$file")
  ekts add --type article --title "$title" --content "$content"
done
```

## Tests

```bash
# Tests d'intégration
npm test tests/cli/

# Avec couverture
npm run test:coverage -- tests/cli/
```

## Références

- [Architecture technique](../Docs/02-ARCHITECTURE-TECHNIQUE.md#411-cli-commanderjs) — Section 4.1.1
- [ADR-003](../Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md#adr-003) — Commander.js
```

**Commit :**
```bash
git add docs/CLI.md
git commit -m "docs: add CLI documentation with examples"
```

### 3.5 Vérification finale Sprint 5-3 (jour 3, après-midi)

**Vérifications finales :**

```bash
# 1. Compilation
npm run build
# ✅ Aucune erreur

# 2. Linting
npm run lint
# ✅ Aucune erreur

# 3. Tous les tests
npm test
# ✅ Tous les tests passent

# 4. Couverture
npm run test:coverage
# ✅ > 80% couverture globale

# 5. Couverture CLI
npm run test:coverage -- tests/cli/
# ✅ > 80% couverture sur src/cli/

# 6. Tests d'intégration
npm test tests/cli/
# ✅ Tous les tests d'intégration passent

# 7. Vérification fichiers
ls -la src/cli/commands/
# ✅ 7 fichiers (init, add, get, search, list, delete, status)

ls -la src/cli/formatters/
# ✅ 2 fichiers (resource, search)

ls -la tests/cli/
# ✅ helpers.ts, setup.ts, cli.test.ts

ls -la docs/CLI.md
# ✅ Documentation existe

# 8. Test complet manuel
ekts init
ekts add --type article --title "Final Test" --tags "test"
ekts list
ekts search "test"
ID=$(ekts add --type article --title "To Delete" --json | jq -r '.id')
ekts get $ID
ekts delete $ID --yes
ekts status
# ✅ Toutes les commandes fonctionnent

# 9. Push
git push origin feat/sprint-5-3
```

**Point de contrôle Sprint 5-3 :**
- ✅ Commande `status` fonctionnelle (databases, resources, system)
- ✅ Tests d'intégration complets (toutes les commandes)
- ✅ Documentation CLI complète (exemples, options, codes de sortie)
- ✅ Couverture > 80% sur src/cli/
- ✅ Tous les tests passent

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/cli/commands/status.ts` | ~120 | Commande status |
| `tests/cli/helpers.ts` | ~60 | Helpers tests |
| `tests/cli/setup.ts` | ~15 | Setup tests |
| `tests/cli/cli.test.ts` | ~250 | Tests intégration |
| `docs/CLI.md` | ~300 | Documentation CLI |

**Total ajouté Sprint 5-3 :** ~745 lignes

---

## 5. Récapitulatif complet Sprint 5

| Sous-sprint | Durée | Fichiers | Lignes |
|-------------|-------|----------|--------|
| Sprint 5-1 | 3 jours | 6 fichiers | ~290 |
| Sprint 5-2 | 4 jours | 5 fichiers | ~380 |
| Sprint 5-3 | 3 jours | 5 fichiers | ~745 |
| **Total** | **10 jours** | **16 fichiers** | **~1 415** |

---

## 6. Commits

```bash
git commit -m "feat(cli): implement status command"
git commit -m "test(cli): add test helpers and setup"
git commit -m "test(cli): add integration tests for all commands"
git commit -m "docs: add CLI documentation with examples"
```

---

## 7. Transition vers Sprint 6

**Prérequis pour Sprint 6 :**
- ✅ Sprint 5 terminé avec succès
- ✅ CLI fonctionnelle (7 commandes)
- ✅ Tests d'intégration passent
- ✅ Documentation complète
- ✅ Couverture > 80%

**Sprint 6 — MCP Server (Semaine 11-12) :**
- 🎯 Serveur MCP (Model Context Protocol)
- 🎯 4 outils (search_knowledge, get_resource, list_resources, validate_resource)
- 🎯 Compatible Claude Code, Cursor, Copilot
- 🎯 Transport stdio
- 🎯 Tests d'intégration avec agents IA

---

**Fin du document Sprint 5-3**
