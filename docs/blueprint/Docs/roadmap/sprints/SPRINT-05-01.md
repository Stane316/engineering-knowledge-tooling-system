# Sprint 5-1 — Commandes de base (init, add, get)

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 3 jours  
**Objectif :** Implémenter les 3 premières commandes CLI  
**Dépendance :** Sprint 4 (Search Engine) ✅

---

## 1. Contexte

Le Sprint 4 a mis en place le Search Engine avec recherche hybride.  
Le Sprint 5-1 va implémenter les 3 premières commandes CLI :
- `ekts init` — Initialiser les bases SQLite
- `ekts add` — Ajouter une ressource
- `ekts get` — Obtenir une ressource par ID

---

## 2. État initial

```
src/
├── business/
│   ├── knowledge-manager.ts        ✅ (5 méthodes)
│   ├── search-engine.ts            ✅ (recherche hybride)
│   └── ...
├── data/
│   ├── database.ts                 ✅ (ekts.db)
│   ├── fts.ts                      ✅ (ekts-fts.db)
│   ├── vectors.ts                  ✅ (ekts-vectors.db)
│   └── ...
├── schemas/
│   └── resource.ts                 ✅ (Zod)
└── types/
    └── resource.ts                 ✅ (Resource)

data/
├── ekts.db                         ✅ (peut être vide)
├── ekts-fts.db                     ✅ (peut être vide)
└── ekts-vectors.db                 ✅ (peut être vide)
```

---

## 3. Tâches atomiques

### 3.1 Installer Commander.js et dépendances (jour 1, matin — 1h)

**Commandes :**
```bash
npm install commander chalk cli-table3
npm install --save-dev @types/node
```

**Vérifier package.json :**
```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "cli-table3": "^0.6.3"
  }
}
```

**Commit :**
```bash
git add package.json package-lock.json
git commit -m "chore: install Commander.js and CLI dependencies"
```

### 3.2 Créer le point d'entrée CLI (jour 1, matin — 2h)

**Fichier :** `src/cli/index.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { getCommand } from './commands/get';

const program = new Command();

program
  .name('ekts')
  .description('Engineering Knowledge Tooling System - CLI for managing knowledge resources')
  .version('1.0.0')
  .option('--json', 'Output in JSON format')
  .option('--no-colors', 'Disable colors');

// Ajouter les commandes
initCommand(program);
addCommand(program);
getCommand(program);

// Gérer les erreurs
program.showHelpAfterError('(add --help for additional information)');

// Parser les arguments
program.parse();
```

**Validation :**
```bash
npm run build
node dist/cli/index.js --help
# ✅ Aide affichée
```

**Commit :**
```bash
git add src/cli/index.ts
git commit -m "feat(cli): add CLI entry point with Commander.js"
```

### 3.3 Implémenter la commande init (jour 1, après-midi — 4h)

**Fichier :** `src/cli/commands/init.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { initializeDatabases } from '../../data/database';

/**
 * Commande : ekts init
 * Initialise les 3 bases SQLite (ekts.db, ekts-fts.db, ekts-vectors.db)
 */
export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize the 3 SQLite databases')
    .option('--force', 'Force reinitialization (delete existing databases)')
    .action(async (options) => {
      try {
        console.log(chalk.blue('🔧 Initializing databases...'));

        const result = await initializeDatabases({
          force: options.force ?? false,
        });

        if (program.opts().json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.green('✓ Databases initialized successfully'));
          console.log(`  - ekts.db: ${result.ektsDb}`);
          console.log(`  - ekts-fts.db: ${result.ftsDb}`);
          console.log(`  - ekts-vectors.db: ${result.vectorsDb}`);
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Test :**
```bash
node dist/cli/index.js init
# ✅ Message "Databases initialized successfully"

ls -la data/
# ✅ ekts.db, ekts-fts.db, ekts-vectors.db créés

node dist/cli/index.js init --json
# ✅ Sortie JSON
```

**Commit :**
```bash
git add src/cli/commands/init.ts
git commit -m "feat(cli): implement init command"
```

### 3.4 Implémenter la commande add (jour 2 — 8h)

**Fichier :** `src/cli/commands/add.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { KnowledgeManager } from '../../business/knowledge-manager';
import { ResourceRepository } from '../../data/resource-repository';
import { FTSIndexer } from '../../business/indexer';
import { VectorIndexer } from '../../business/vector-indexer';
import { OpenAIEmbeddingsService } from '../../business/embeddings';
import { VectorRepository } from '../../data/vector-repository';
import Database from 'better-sqlite3';

/**
 * Commande : ekts add
 * Ajoute une nouvelle ressource avec indexation FTS + Vector
 */
export function addCommand(program: Command): void {
  program
    .command('add')
    .description('Add a new knowledge resource')
    .requiredOption('--type <type>', 'Resource type (article|video|tutorial|tool|other)')
    .requiredOption('--title <title>', 'Resource title')
    .option('--url <url>', 'Resource URL')
    .option('--tags <tags>', 'Comma-separated tags', '')
    .option('--content <content>', 'Resource content (for indexing)')
    .action(async (options) => {
      try {
        console.log(chalk.blue('📝 Adding resource...'));

        // Initialiser les services
        const db = new Database('data/ekts.db');
        const ftsDb = new Database('data/ekts-fts.db');
        const vectorsDb = new Database('data/ekts-vectors.db');

        const repository = new ResourceRepository(db);
        const ftsIndexer = new FTSIndexer(ftsDb);
        const vectorIndexer = new VectorIndexer(
          new OpenAIEmbeddingsService(),
          new VectorRepository(vectorsDb)
        );
        const knowledgeManager = new KnowledgeManager(repository, ftsIndexer, vectorIndexer);

        // Parser les tags
        const tags = options.tags
          ? options.tags.split(',').map((t: string) => t.trim())
          : [];

        // Ajouter la ressource
        const resource = await knowledgeManager.addResource({
          type: options.type,
          title: options.title,
          url: options.url,
          tags,
          content: options.content,
        });

        if (program.opts().json) {
          console.log(JSON.stringify(resource, null, 2));
        } else {
          console.log(chalk.green('✓ Resource created successfully'));
          console.log(`  ID: ${resource.id}`);
          console.log(`  Title: ${resource.title}`);
          console.log(`  Type: ${resource.type}`);
          if (resource.tags.length > 0) {
            console.log(`  Tags: ${resource.tags.join(', ')}`);
          }
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Test :**
```bash
node dist/cli/index.js add \
  --type article \
  --title "Introduction to SQLite" \
  --url "https://example.com/sqlite" \
  --tags "sqlite,database,tutorial" \
  --content "SQLite is a lightweight RDBMS..."
# ✅ Message "Resource created successfully"

node dist/cli/index.js add --type article --title "Test" --json
# ✅ Sortie JSON avec ID, title, type, etc.
```

**Commit :**
```bash
git add src/cli/commands/add.ts
git commit -m "feat(cli): implement add command"
```

### 3.5 Implémenter la commande get (jour 3, matin — 4h)

**Fichier :** `src/cli/commands/get.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { KnowledgeManager } from '../../business/knowledge-manager';
import { ResourceRepository } from '../../data/resource-repository';
import { FTSIndexer } from '../../business/indexer';
import { VectorIndexer } from '../../business/vector-indexer';
import { OpenAIEmbeddingsService } from '../../business/embeddings';
import { VectorRepository } from '../../data/vector-repository';
import Database from 'better-sqlite3';

/**
 * Commande : ekts get
 * Obtient une ressource par son ID
 */
export function getCommand(program: Command): void {
  program
    .command('get <id>')
    .description('Get a resource by ID')
    .action(async (id) => {
      try {
        // Initialiser les services
        const db = new Database('data/ekts.db');
        const ftsDb = new Database('data/ekts-fts.db');
        const vectorsDb = new Database('data/ekts-vectors.db');

        const repository = new ResourceRepository(db);
        const ftsIndexer = new FTSIndexer(ftsDb);
        const vectorIndexer = new VectorIndexer(
          new OpenAIEmbeddingsService(),
          new VectorRepository(vectorsDb)
        );
        const knowledgeManager = new KnowledgeManager(repository, ftsIndexer, vectorIndexer);

        // Obtenir la ressource
        const resource = await knowledgeManager.getResource(id);

        if (!resource) {
          console.error(chalk.red(`✗ Resource not found: ${id}`));
          process.exit(3);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(resource, null, 2));
        } else {
          console.log(chalk.blue('📄 Resource Details'));
          console.log(`  ID: ${resource.id}`);
          console.log(`  Title: ${resource.title}`);
          console.log(`  Type: ${resource.type}`);
          if (resource.url) {
            console.log(`  URL: ${resource.url}`);
          }
          if (resource.tags.length > 0) {
            console.log(`  Tags: ${resource.tags.join(', ')}`);
          }
          if (resource.content) {
            console.log(`  Content: ${resource.content.substring(0, 100)}...`);
          }
          console.log(`  Created: ${resource.created_at}`);
          console.log(`  Updated: ${resource.updated_at}`);
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Test :**
```bash
# Obtenir une ressource existante
node dist/cli/index.js get <id>
# ✅ Détails de la ressource affichés

# Ressource inexistante
node dist/cli/index.js get nonexistent
# ✅ Erreur "Resource not found" (code 3)

node dist/cli/index.js get <id> --json
# ✅ Sortie JSON
```

**Commit :**
```bash
git add src/cli/commands/get.ts
git commit -m "feat(cli): implement get command"
```

### 3.6 Créer le script d'exécution (jour 3, matin — 1h)

**Fichier :** `bin/ekts`

```bash
#!/usr/bin/env node
require('../dist/cli/index.js');
```

**Rendre exécutable :**
```bash
chmod +x bin/ekts
```

**Modifier package.json :**
```json
{
  "bin": {
    "ekts": "./bin/ekts"
  }
}
```

**Test :**
```bash
# Installation locale
npm link

# Tester la commande
ekts --help
# ✅ Aide affichée

ekts init
# ✅ Bases créées
```

**Commit :**
```bash
git add bin/ekts package.json
git commit -m "feat(cli): add executable script and bin configuration"
```

### 3.7 Créer les formatters (jour 3, après-midi — 4h)

**Fichier :** `src/cli/formatters/resource-formatter.ts`

```typescript
import chalk from 'chalk';
import { Resource } from '../../types/resource';

/**
 * Formate une ressource pour affichage humain
 */
export function formatResource(resource: Resource): string {
  const lines = [
    chalk.blue('📄 Resource Details'),
    `  ${chalk.bold('ID:')} ${resource.id}`,
    `  ${chalk.bold('Title:')} ${resource.title}`,
    `  ${chalk.bold('Type:')} ${resource.type}`,
  ];

  if (resource.url) {
    lines.push(`  ${chalk.bold('URL:')} ${resource.url}`);
  }

  if (resource.tags && resource.tags.length > 0) {
    lines.push(`  ${chalk.bold('Tags:')} ${resource.tags.join(', ')}`);
  }

  if (resource.content) {
    const preview = resource.content.substring(0, 100);
    lines.push(`  ${chalk.bold('Content:')} ${preview}...`);
  }

  lines.push(`  ${chalk.bold('Created:')} ${resource.created_at}`);
  lines.push(`  ${chalk.bold('Updated:')} ${resource.updated_at}`);

  return lines.join('\n');
}

/**
 * Formate une ressource en JSON
 */
export function formatResourceJSON(resource: Resource): string {
  return JSON.stringify(resource, null, 2);
}
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/cli/formatters/
git commit -m "feat(cli): add resource formatters (human + JSON)"
```

### 3.8 Vérification finale Sprint 5-1 (jour 3, fin)

**Vérifications :**

```bash
# 1. Compilation
npm run build
# ✅ Aucune erreur

# 2. Linting
npm run lint
# ✅ Aucune erreur

# 3. Test manuel init
ekts init
# ✅ Bases créées

# 4. Test manuel add
ekts add --type article --title "Test"
# ✅ Ressource créée

# 5. Test manuel get
ekts get <id>
# ✅ Ressource affichée

# 6. Test mode JSON
ekts get <id> --json
# ✅ Sortie JSON valide

# 7. Test aide
ekts --help
# ✅ Aide affichée

ekts add --help
# ✅ Aide spécifique à add

# 8. Push
git push origin feat/sprint-5-1
```

**Point de contrôle Sprint 5-1 :**
- ✅ Commander.js installé et configuré
- ✅ Point d'entrée CLI créé (src/cli/index.ts)
- ✅ Commande `init` fonctionnelle
- ✅ Commande `add` fonctionnelle
- ✅ Commande `get` fonctionnelle
- ✅ Script d'exécution créé (bin/ekts)
- ✅ Formatters créés (JSON + humain)
- ✅ Mode `--json` fonctionne
- ✅ Mode humain fonctionne
- ✅ Gestion erreurs (codes de sortie)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/cli/index.ts` | ~50 | Point d'entrée CLI |
| `src/cli/commands/init.ts` | ~40 | Commande init |
| `src/cli/commands/add.ts` | ~80 | Commande add |
| `src/cli/commands/get.ts` | ~50 | Commande get |
| `src/cli/formatters/resource-formatter.ts` | ~60 | Formatage ressources |
| `bin/ekts` | ~10 | Script d'exécution |

**Total Sprint 5-1 :** ~290 lignes

---

## 5. Commits

```bash
git commit -m "chore: install Commander.js and CLI dependencies"
git commit -m "feat(cli): add CLI entry point with Commander.js"
git commit -m "feat(cli): implement init command"
git commit -m "feat(cli): implement add command"
git commit -m "feat(cli): implement get command"
git commit -m "feat(cli): add executable script and bin configuration"
git commit -m "feat(cli): add resource formatters (human + JSON)"
```

---

## 6. Transition vers Sprint 5-2

**Prérequis pour Sprint 5-2 :**
- ✅ Sprint 5-1 terminé avec succès
- ✅ Commandes init, add, get fonctionnelles
- ✅ Commander.js configuré
- ✅ Formatters créés

**Sprint 5-2 va implémenter :**
- Commande `search` (recherche hybride)
- Commande `list` (liste avec filtres)
- Commande `delete` (suppression)

---

**Fin du document Sprint 5-1**
