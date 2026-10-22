# Sprint 5-2 — Commandes de recherche et gestion (search, list, delete)

**Statut :** 🟡 Documenté — En attente approbation  
**Durée :** 4 jours  
**Objectif :** Implémenter les 3 commandes principales (search, list, delete)  
**Dépendance :** Sprint 5-1 ✅

---

## 1. Contexte

Le Sprint 5-1 a mis en place les commandes de base (init, add, get).  
Le Sprint 5-2 va implémenter les 3 commandes les plus utilisées :
- `ekts search` — Recherche hybride (FTS + Vector + RRF)
- `ekts list` — Lister ressources avec filtres
- `ekts delete` — Supprimer une ressource

---

## 2. État initial (fin Sprint 5-1)

```
src/
├── cli/
│   ├── index.ts                    ✅ (point d'entrée)
│   ├── commands/
│   │   ├── init.ts                 ✅
│   │   ├── add.ts                  ✅
│   │   └── get.ts                  ✅
│   └── formatters/
│       └── resource-formatter.ts   ✅
├── business/
│   ├── search-engine.ts            ✅ (recherche hybride)
│   ├── knowledge-manager.ts        ✅ (5 méthodes)
│   └── ...
└── ...

bin/
└── ekts                            ✅ (script d'exécution)
```

---

## 3. Tâches atomiques

### 3.1 Créer le formatter de recherche (jour 1, matin — 2h)

**Fichier :** `src/cli/formatters/search-formatter.ts`

```typescript
import chalk from 'chalk';
import Table from 'cli-table3';
import { SearchResult } from '../../business/search-engine.types';

/**
 * Formate les résultats de recherche en tableau
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return chalk.yellow('⚠ No results found');
  }

  const table = new Table({
    head: [
      chalk.white.bold('#'),
      chalk.white.bold('Score'),
      chalk.white.bold('Type'),
      chalk.white.bold('Title'),
      chalk.white.bold('Tags'),
    ],
    colWidths: [4, 10, 12, 40, 25],
  });

  results.forEach((result, index) => {
    const score = result.score.toFixed(4);
    const scoreColor = result.score > 0.02 ? chalk.green : chalk.yellow;
    const typeColors: Record<string, (text: string) => string> = {
      article: chalk.blue,
      video: chalk.magenta,
      tutorial: chalk.cyan,
      tool: chalk.green,
      other: chalk.white,
    };

    const typeColor = typeColors[result.resource.type] ?? chalk.white;
    const tags = result.resource.tags.slice(0, 3).join(', ');

    table.push([
      `${index + 1}`,
      scoreColor(score),
      typeColor(result.resource.type),
      result.resource.title.substring(0, 38),
      chalk.gray(tags.substring(0, 23)),
    ]);
  });

  const header = chalk.blue(`🔍 Found ${results.length} result(s)\n`);
  return header + table.toString();
}

/**
 * Formate les résultats de recherche en JSON
 */
export function formatSearchResultsJSON(results: SearchResult[]): string {
  return JSON.stringify(
    {
      count: results.length,
      results: results.map((r, i) => ({
        rank: i + 1,
        score: r.score,
        source: r.source,
        resource: r.resource,
      })),
    },
    null,
    2
  );
}
```

**Commit :**
```bash
git add src/cli/formatters/search-formatter.ts
git commit -m "feat(cli): add search results formatter"
```

### 3.2 Implémenter la commande search (jour 1-2 — 8h)

**Fichier :** `src/cli/commands/search.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { SearchEngine } from '../../business/search-engine';
import { FTSRepository } from '../../data/fts-repository';
import { VectorRepository } from '../../data/vector-repository';
import { OpenAIEmbeddingsService } from '../../business/embeddings';
import { formatSearchResults, formatSearchResultsJSON } from '../formatters/search-formatter';
import Database from 'better-sqlite3';

/**
 * Commande : ekts search
 * Recherche hybride (FTS + Vector + RRF)
 */
export function searchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search knowledge resources using hybrid search (FTS + Vector + RRF)')
    .option('-l, --limit <number>', 'Maximum number of results', '10')
    .option('-m, --mode <mode>', 'Search mode (hybrid|fts|vector)', 'hybrid')
    .option('-t, --type <type>', 'Filter by resource type')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .action(async (query, options) => {
      try {
        const startTime = Date.now();

        // Initialiser le Search Engine
        const ftsDb = new Database('data/ekts-fts.db');
        const vectorsDb = new Database('data/ekts-vectors.db');

        const ftsRepository = new FTSRepository(ftsDb);
        const vectorRepository = new VectorRepository(vectorsDb);
        const embeddingsService = new OpenAIEmbeddingsService();

        const searchEngine = new SearchEngine(
          ftsRepository,
          vectorRepository,
          embeddingsService
        );

        // Parser les options
        const limit = parseInt(options.limit, 10);
        const tags = options.tags
          ? options.tags.split(',').map((t: string) => t.trim())
          : undefined;

        console.log(chalk.blue(`🔍 Searching for "${query}"...`));

        // Effectuer la recherche
        const results = await searchEngine.search(query, {
          limit,
          mode: options.mode,
          type: options.type,
          tags,
        });

        const elapsed = Date.now() - startTime;

        // Afficher les résultats
        if (program.opts().json) {
          console.log(formatSearchResultsJSON(results));
        } else {
          console.log(formatSearchResults(results));
          console.log(chalk.gray(`\n⏱ Search completed in ${elapsed}ms`));
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Modifier :** `src/cli/index.ts` — ajouter `searchCommand`

```typescript
import { searchCommand } from './commands/search';
// ...
searchCommand(program);
```

**Tests :**
```bash
# Recherche hybride
ekts search "SQLite tutorial"
# ✅ Tableau de résultats avec scores

# Recherche FTS uniquement
ekts search "SQLite" --mode fts
# ✅ Résultats FTS

# Recherche vectorielle
ekts search "database basics" --mode vector
# ✅ Résultats vectoriels

# Avec limite
ekts search "SQLite" --limit 5
# ✅ Max 5 résultats

# Avec filtre type
ekts search "tutorial" --type article
# ✅ Résultats filtrés par type

# Avec filtre tags
ekts search "SQLite" --tags "tutorial,database"
# ✅ Résultats filtrés par tags

# Mode JSON
ekts search "SQLite" --json
# ✅ Sortie JSON complète
```

**Commit :**
```bash
git add src/cli/commands/search.ts
git add src/cli/index.ts
git commit -m "feat(cli): implement search command with hybrid search"
```

### 3.3 Implémenter la commande list (jour 3, matin — 4h)

**Fichier :** `src/cli/commands/list.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { KnowledgeManager } from '../../business/knowledge-manager';
import { ResourceRepository } from '../../data/resource-repository';
import { FTSIndexer } from '../../business/indexer';
import { VectorIndexer } from '../../business/vector-indexer';
import { OpenAIEmbeddingsService } from '../../business/embeddings';
import { VectorRepository } from '../../data/vector-repository';
import { Resource } from '../../types/resource';
import Database from 'better-sqlite3';

/**
 * Formate une liste de ressources en tableau
 */
function formatResourceList(resources: Resource[]): string {
  if (resources.length === 0) {
    return chalk.yellow('⚠ No resources found');
  }

  const table = new Table({
    head: [
      chalk.white.bold('#'),
      chalk.white.bold('ID'),
      chalk.white.bold('Type'),
      chalk.white.bold('Title'),
      chalk.white.bold('Tags'),
      chalk.white.bold('Updated'),
    ],
    colWidths: [4, 12, 12, 35, 20, 12],
  });

  resources.forEach((r, index) => {
    const shortId = r.id.substring(0, 8) + '...';
    const tags = r.tags.slice(0, 2).join(', ');
    const updated = new Date(r.updated_at).toLocaleDateString();

    table.push([
      `${index + 1}`,
      chalk.gray(shortId),
      r.type,
      r.title.substring(0, 33),
      chalk.gray(tags.substring(0, 18)),
      chalk.gray(updated),
    ]);
  });

  const header = chalk.blue(`📋 ${resources.length} resource(s)\n`);
  return header + table.toString();
}

/**
 * Commande : ekts list
 * Liste les ressources avec filtres optionnels
 */
export function listCommand(program: Command): void {
  program
    .command('list')
    .description('List knowledge resources with optional filters')
    .option('-l, --limit <number>', 'Maximum number of results')
    .option('-t, --type <type>', 'Filter by resource type')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .action(async (options) => {
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

        // Construire les filtres
        const filters: any = {};
        if (options.type) filters.type = options.type;
        if (options.tags) {
          filters.tags = options.tags.split(',').map((t: string) => t.trim());
        }
        if (options.limit) {
          filters.limit = parseInt(options.limit, 10);
        }

        // Lister les ressources
        const resources = await knowledgeManager.listResources(filters);

        // Afficher
        if (program.opts().json) {
          console.log(JSON.stringify({ count: resources.length, resources }, null, 2));
        } else {
          console.log(formatResourceList(resources));
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Modifier :** `src/cli/index.ts` — ajouter `listCommand`

**Tests :**
```bash
# Liste toutes les ressources
ekts list
# ✅ Tableau avec toutes les ressources

# Filtrer par type
ekts list --type article
# ✅ Uniquement les articles

# Filtrer par tags
ekts list --tags "tutorial"
# ✅ Ressources avec tag "tutorial"

# Limiter
ekts list --limit 5
# ✅ Max 5 ressources

# Mode JSON
ekts list --json
# ✅ Sortie JSON

# Combinaison filtres
ekts list --type article --tags "sqlite" --limit 10
# ✅ Filtres combinés
```

**Commit :**
```bash
git add src/cli/commands/list.ts
git add src/cli/index.ts
git commit -m "feat(cli): implement list command with filters"
```

### 3.4 Implémenter la commande delete (jour 3, après-midi — 4h)

**Fichier :** `src/cli/commands/delete.ts`

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
import * as readline from 'readline';

/**
 * Demande une confirmation à l'utilisateur
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Commande : ekts delete
 * Supprime une ressource par son ID
 */
export function deleteCommand(program: Command): void {
  program
    .command('delete <id>')
    .description('Delete a knowledge resource by ID')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (id, options) => {
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

        // Vérifier que la ressource existe
        const resource = await knowledgeManager.getResource(id);
        if (!resource) {
          console.error(chalk.red(`✗ Resource not found: ${id}`));
          process.exit(3);
        }

        // Afficher la ressource
        if (!program.opts().json) {
          console.log(chalk.blue('📄 Resource to delete:'));
          console.log(`  ID: ${resource.id}`);
          console.log(`  Title: ${resource.title}`);
          console.log(`  Type: ${resource.type}`);
        }

        // Demander confirmation (sauf si --yes)
        if (!options.yes) {
          const confirmed = await confirm(chalk.yellow('⚠ Are you sure you want to delete this resource?'));
          if (!confirmed) {
            console.log(chalk.gray('Deletion cancelled'));
            process.exit(0);
          }
        }

        // Supprimer
        await knowledgeManager.deleteResource(id);

        if (program.opts().json) {
          console.log(JSON.stringify({ deleted: true, id }, null, 2));
        } else {
          console.log(chalk.green(`✓ Resource deleted: ${id}`));
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
```

**Modifier :** `src/cli/index.ts` — ajouter `deleteCommand`

**Tests :**
```bash
# Supprimer avec confirmation
ekts delete <id>
# ✅ Affiche ressource, demande confirmation, supprime

# Supprimer sans confirmation
ekts delete <id> --yes
# ✅ Supprime directement

# Supprimer ressource inexistante
ekts delete nonexistent
# ✅ Erreur "Resource not found" (code 3)

# Mode JSON
ekts delete <id> --yes --json
# ✅ Sortie JSON

# Annuler suppression
ekts delete <id>
# (répondre "N")
# ✅ "Deletion cancelled"
```

**Commit :**
```bash
git add src/cli/commands/delete.ts
git add src/cli/index.ts
git commit -m "feat(cli): implement delete command with confirmation"
```

### 3.5 Factoriser l'initialisation des services (jour 4, matin — 4h)

**Problème :** Chaque commande répète le code d'initialisation des services.

**Solution :** Créer une fonction helper.

**Fichier :** `src/cli/services.ts`

```typescript
import Database from 'better-sqlite3';
import { ResourceRepository } from '../data/resource-repository';
import { FTSIndexer } from '../business/indexer';
import { VectorIndexer } from '../business/vector-indexer';
import { OpenAIEmbeddingsService } from '../business/embeddings';
import { VectorRepository } from '../data/vector-repository';
import { KnowledgeManager } from '../business/knowledge-manager';
import { FTSRepository } from '../data/fts-repository';
import { SearchEngine } from '../business/search-engine';

const DB_PATH = process.env.EKTS_DB_PATH ?? './data';

/**
 * Crée les connexions aux bases de données
 */
export function createConnections() {
  return {
    db: new Database(`${DB_PATH}/ekts.db`),
    ftsDb: new Database(`${DB_PATH}/ekts-fts.db`),
    vectorsDb: new Database(`${DB_PATH}/ekts-vectors.db`),
  };
}

/**
 * Crée un Knowledge Manager avec ses dépendances
 */
export function createKnowledgeManager(): KnowledgeManager {
  const { db, ftsDb, vectorsDb } = createConnections();
  const repository = new ResourceRepository(db);
  const ftsIndexer = new FTSIndexer(ftsDb);
  const vectorIndexer = new VectorIndexer(
    new OpenAIEmbeddingsService(),
    new VectorRepository(vectorsDb)
  );
  return new KnowledgeManager(repository, ftsIndexer, vectorIndexer);
}

/**
 * Crée un Search Engine avec ses dépendances
 */
export function createSearchEngine(): SearchEngine {
  const { ftsDb, vectorsDb } = createConnections();
  const ftsRepository = new FTSRepository(ftsDb);
  const vectorRepository = new VectorRepository(vectorsDb);
  const embeddingsService = new OpenAIEmbeddingsService();
  return new SearchEngine(ftsRepository, vectorRepository, embeddingsService);
}
```

**Mettre à jour les commandes existantes :**

Remplacer le code d'initialisation dans `add.ts`, `get.ts`, `list.ts`, `delete.ts` par :
```typescript
const knowledgeManager = createKnowledgeManager();
```

Et dans `search.ts` :
```typescript
const searchEngine = createSearchEngine();
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK

# Tester toutes les commandes existantes
ekts add --type article --title "Test"
ekts get <id>
ekts list
ekts search "test"
ekts delete <id> --yes
# ✅ Toutes fonctionnent
```

**Commit :**
```bash
git add src/cli/services.ts
git add src/cli/commands/
git commit -m "refactor(cli): extract service initialization into helper"
```

### 3.6 Vérification finale Sprint 5-2 (jour 4, après-midi)

**Vérifications :**

```bash
# 1. Compilation
npm run build
# ✅ Aucune erreur

# 2. Linting
npm run lint
# ✅ Aucune erreur

# 3. Test recherche hybride
ekts search "SQLite tutorial"
# ✅ Résultats avec scores

# 4. Test recherche FTS
ekts search "SQLite" --mode fts
# ✅ Résultats FTS

# 5. Test recherche vectorielle
ekts search "database basics" --mode vector
# ✅ Résultats vectoriels

# 6. Test liste
ekts list
# ✅ Tableau formaté

# 7. Test liste avec filtres
ekts list --type article --limit 5
# ✅ Liste filtrée

# 8. Test suppression
ekts delete <id> --yes
# ✅ Suppression OK

# 9. Test mode JSON
ekts search "test" --json | jq .
# ✅ JSON valide

ekts list --json | jq .
# ✅ JSON valide

# 10. Test codes de sortie
ekts get nonexistent; echo $?
# ✅ Code 3

ekts delete nonexistent --yes; echo $?
# ✅ Code 3

# 11. Push
git push origin feat/sprint-5-2
```

**Point de contrôle Sprint 5-2 :**
- ✅ Commande `search` fonctionnelle (3 modes : hybrid, fts, vector)
- ✅ Commande `list` fonctionnelle (filtres : type, tags, limit)
- ✅ Commande `delete` fonctionnelle (confirmation + --yes)
- ✅ Formatage tableaux (cli-table3)
- ✅ Mode JSON complet
- ✅ Codes de sortie appropriés
- ✅ Factorisation services (services.ts)
- ✅ Gestion erreurs robuste

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/cli/commands/search.ts` | ~100 | Commande search (3 modes) |
| `src/cli/commands/list.ts` | ~80 | Commande list (filtres) |
| `src/cli/commands/delete.ts` | ~80 | Commande delete (confirmation) |
| `src/cli/formatters/search-formatter.ts` | ~60 | Formatage résultats |
| `src/cli/services.ts` | ~60 | Helper initialisation |

**Total ajouté Sprint 5-2 :** ~380 lignes

---

## 5. Commits

```bash
git commit -m "feat(cli): add search results formatter"
git commit -m "feat(cli): implement search command with hybrid search"
git commit -m "feat(cli): implement list command with filters"
git commit -m "feat(cli): implement delete command with confirmation"
git commit -m "refactor(cli): extract service initialization into helper"
```

---

## 6. Transition vers Sprint 5-3

**Prérequis pour Sprint 5-3 :**
- ✅ Sprint 5-2 terminé avec succès
- ✅ 6 commandes fonctionnelles (init, add, get, search, list, delete)
- ✅ Formatage humain et JSON
- ✅ Factorisation services

**Sprint 5-3 va implémenter :**
- Commande `status` (statut système)
- Tests d'intégration complets
- Documentation CLI

---

**Fin du document Sprint 5-2**
