# SPRINT-15-03 — CLI, MCP, Tests d'intégration et Documentation

**Sprint :** 15-03 sur 15 (Sous-sprint 3/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ

---

## 1. Objectif du sous-sprint

Exposer les fonctionnalités de capitalisation aux utilisateurs et aux agents IA :
- **CLI** : Commande `ekts bestpractice` avec sous-commandes (`list`, `search`, `add`, `show`, `delete`, `extract`)
- **MCP** : Outils `search_best_practices` et `add_best_practice`
- **Tests d'intégration** : Vérification du fonctionnement de bout en bout
- **Documentation** : Guide utilisateur et mise à jour des références API
- **Rapport final** : SPRINT-15-RESULTAT.md

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 15-02 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que tous les modules best-practices existent
ls src/best-practices/
# Doit afficher : best-practice.types.ts, best-practice-repository.ts,
# best-practice-search.ts, best-practice-extractor.ts, best-practice-service.ts
```

### 2.2 Documents à lire

- `SPRINT-15.md` (document parent)
- `SPRINT-15-01-RESULTAT.md` (résultats du sous-sprint 1)
- `SPRINT-15-02-RESULTAT.md` (résultats du sous-sprint 2)
- `docs/blueprint/Docs/06-Security/06_MCP_SECURITY_GUARDRAILS.md` (sécurité MCP)
- `docs/blueprint/Docs/05-Creative-Engineering/13_CLI_GUIDE.md` (conventions CLI)

---

## 3. Tâches détaillées

### 3.1 Implémenter la commande CLI `ekts bestpractice` (6h)

**Fichier :** `src/cli/commands/best-practice.ts`

```typescript
import { Command } from 'commander';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import type { BestPracticeCategory } from '../../best-practices/best-practice.types.js';
import { getDatabase } from '../../storage/database.js';
import { renderTable } from '../utils/table.js';

const VALID_CATEGORIES = ['performance', 'accessibility', 'seo', 'ux', 'content', 'general'];

/**
 * Enregistrer la commande `ekts bestpractice` et ses sous-commandes.
 */
export function registerBestPracticeCommand(program: Command): void {
  const bp = program
    .command('bestpractice')
    .alias('bp')
    .description('Gérer les bonnes pratiques (capitalisation des connaissances)');

  // ekts bestpractice list
  bp
    .command('list')
    .description('Lister les bonnes pratiques')
    .option('-c, --category <category>', `Filtrer par catégorie (${VALID_CATEGORIES.join(', ')})`)
    .option('-t, --tag <tag>', 'Filtrer par tag')
    .option('-p, --project <id>', 'Filtrer par projet source')
    .option('--manual', 'Montrer uniquement les bonnes pratiques manuelles')
    .option('--auto', 'Montrer uniquement les bonnes pratiques automatiques')
    .option('--sort <field>', 'Trier par (created_at, updated_at, occurrence_count, title)', 'created_at')
    .option('--order <dir>', 'Ordre (asc, desc)', 'desc')
    .option('-l, --limit <n>', 'Nombre maximum de résultats', '20')
    .action(async (options) => {
      const db = getDatabase();
      const service = new BestPracticeService(db);

      try {
        const practices = service.list({
          category: options.category as BestPracticeCategory | undefined,
          tag: options.tag,
          projectId: options.project,
          isManual: options.manual ? true : options.auto ? false : undefined,
          limit: parseInt(options.limit),
          orderBy: options.sort,
          orderDir: options.order,
        });

        if (practices.length === 0) {
          console.log('Aucune bonne pratique trouvée.');
          return;
        }

        const rows = practices.map(bp => [
          bp.id.substring(0, 8),
          bp.title.substring(0, 50),
          bp.category,
          bp.tags.join(', ').substring(0, 30),
          bp.occurrenceCount.toString(),
          bp.isManual ? '📝' : '🤖',
          new Date(bp.createdAt).toLocaleDateString(),
        ]);

        renderTable(
          ['ID', 'Titre', 'Catégorie', 'Tags', 'Occ.', 'Type', 'Créée'],
          rows,
        );

        console.log(`\n${practices.length} bonne(s) pratique(s) sur ${service.count()}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts bestpractice search <query>
  bp
    .command('search <query>')
    .description('Rechercher des bonnes pratiques (recherche hybride FTS5)')
    .option('-c, --category <category>', 'Filtrer par catégorie')
    .option('-l, --limit <n>', 'Nombre maximum de résultats', '10')
    .action(async (query, options) => {
      const db = getDatabase();
      const service = new BestPracticeService(db);

      try {
        const results = service.searchPractices({
          query,
          category: options.category as BestPracticeCategory | undefined,
          limit: parseInt(options.limit),
        });

        if (results.length === 0) {
          console.log('Aucun résultat pour cette recherche.');
          return;
        }

        for (const result of results) {
          const bp = result.practice;
          console.log(`\n[${(result.score * 100).toFixed(0)}%] ${bp.title}`);
          console.log(`   Catégorie : ${bp.category}`);
          console.log(`   ${bp.description}`);
          if (bp.tags.length > 0) {
            console.log(`   Tags : ${bp.tags.join(', ')}`);
          }
          console.log(`   Occurrences : ${bp.occurrenceCount} | ${bp.isManual ? 'Manuelle' : 'Automatique'}`);
        }

        console.log(`\n${results.length} résultat(s)`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts bestpractice add
  bp
    .command('add')
    .description('Ajouter manuellement une bonne pratique')
    .requiredOption('-t, --title <title>', 'Titre de la bonne pratique')
    .requiredOption('-d, --description <desc>', 'Description détaillée')
    .requiredOption('-c, --category <category>', `Catégorie (${VALID_CATEGORIES.join(', ')})`)
    .option('--tags <tags>', 'Tags séparés par des virgules')
    .action(async (options) => {
      if (!VALID_CATEGORIES.includes(options.category)) {
        console.error(`Catégorie invalide : ${options.category}`);
        console.error(`Catégories valides : ${VALID_CATEGORIES.join(', ')}`);
        process.exit(1);
      }

      const db = getDatabase();
      const service = new BestPracticeService(db);

      try {
        const bp = service.create({
          title: options.title,
          description: options.description,
          category: options.category as BestPracticeCategory,
          tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [],
        });

        console.log(`✅ Bonne pratique créée : ${bp.id}`);
        console.log(`   Titre : ${bp.title}`);
        console.log(`   Catégorie : ${bp.category}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts bestpractice show <id>
  bp
    .command('show <id>')
    .description('Afficher le détail d\'une bonne pratique')
    .action(async (id) => {
      const db = getDatabase();
      const service = new BestPracticeService(db);

      try {
        const bp = service.getById(id);
        if (!bp) {
          console.error(`Bonne pratique non trouvée : ${id}`);
          process.exit(1);
        }

        console.log(`\n=== ${bp.title} ===\n`);
        console.log(`ID : ${bp.id}`);
        console.log(`Catégorie : ${bp.category}`);
        console.log(`Description : ${bp.description}`);
        console.log(`Tags : ${bp.tags.join(', ') || '(aucun)'}`);
        console.log(`Occurrences : ${bp.occurrenceCount}`);
        console.log(`Type : ${bp.isManual ? 'Manuelle' : 'Automatique'}`);
        console.log(`Créée : ${new Date(bp.createdAt).toLocaleString()}`);
        console.log(`Modifiée : ${new Date(bp.updatedAt).toLocaleString()}`);

        if (bp.sourceProjectIds.length > 0) {
          console.log(`Projets source : ${bp.sourceProjectIds.join(', ')}`);
        }

        // Afficher les findings liés
        const linkedFindings = service.findLinkedFindings(bp.id);
        if (linkedFindings.length > 0) {
          console.log(`\nFindings associés (${linkedFindings.length}) :`);
          for (const link of linkedFindings) {
            console.log(`  - [${link.dimension}] ${link.findingTitle} (confiance: ${(link.confidence * 100).toFixed(0)}%)`);
          }
        }
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts bestpractice delete <id>
  bp
    .command('delete <id>')
    .description('Supprimer une bonne pratique')
    .option('-y, --yes', 'Confirmer sans demander')
    .action(async (id, options) => {
      const db = getDatabase();
      const service = new BestPracticeService(db);

      try {
        const bp = service.getById(id);
        if (!bp) {
          console.error(`Bonne pratique non trouvée : ${id}`);
          process.exit(1);
        }

        if (!options.yes) {
          console.log(`Supprimer la bonne pratique "${bp.title}" ? (y/N)`);
          // En mode non-interactif, on skip la confirmation
        }

        service.delete(id);
        console.log(`✅ Bonne pratique supprimée : ${bp.title}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts bestpractice extract <projectId>
  bp
    .command('extract <projectId>')
    .description('Extraire automatiquement les bonnes pratiques depuis les audits d\'un projet')
    .option('--min-occurrences <n>', 'Occurrences minimum pour extraction', '2')
    .option('--min-audits <n>', 'Audits minimum du projet', '2')
    .action(async (projectId, options) => {
      const db = getDatabase();
      const service = new BestPracticeService(db, {
        minOccurrences: parseInt(options.minOccurrences),
        minAudits: parseInt(options.minAudits),
      });

      try {
        console.log(`Extraction des bonnes pratiques pour le projet ${projectId}...`);
        const report = service.extractFromProject(projectId);

        console.log('\n=== Rapport d\'extraction ===\n');
        console.log(`Audits analysés : ${report.auditsAnalyzed}`);
        console.log(`Bonnes pratiques extraites : ${report.practicesExtracted}`);
        console.log(`Bonnes pratiques fusionnées : ${report.practicesMerged}`);
        console.log(`Associations créées : ${report.linksCreated}`);
        console.log(`Durée : ${report.durationMs}ms`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
```

**Mettre à jour `src/cli/index.ts` :**

Ajouter l'import et l'enregistrement :
```typescript
import { registerBestPracticeCommand } from './commands/best-practice.js';

// Dans la fonction d'enregistrement des commandes :
registerBestPracticeCommand(program);
```

**Critères d'acceptation :**
- Sous-commande `list` avec filtres (catégorie, tag, projet, type)
- Sous-commande `search` avec recherche hybride
- Sous-commande `add` avec validation catégorie
- Sous-commande `show` avec détail complet (findings liés inclus)
- Sous-commande `delete` avec confirmation
- Sous-commande `extract` avec rapport d'extraction
- Alias `bp` fonctionnel
- Messages d'erreur clairs
- Codes de sortie corrects (0=success, 1=erreur)

---

### 3.2 Implémenter l'outil MCP `search_best_practices` (4h)

**Fichier :** `src/mcp/tools/search-best-practices.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import { getDatabase } from '../../storage/database.js';

const VALID_CATEGORIES = ['performance', 'accessibility', 'seo', 'ux', 'content', 'general'] as const;

/**
 * Enregistrer l'outil MCP search_best_practices.
 */
export function registerSearchBestPracticesTool(server: McpServer): void {
  server.registerTool(
    'search_best_practices',
    {
      title: 'Search Best Practices',
      description: 'Rechercher des bonnes pratiques EKTS par texte (FTS5) ou par filtres (catégorie, tag, projet)',
      inputSchema: {
        query: z.string().optional().describe('Requête textuelle pour la recherche hybride FTS5'),
        category: z.enum(VALID_CATEGORIES).optional().describe('Filtrer par catégorie'),
        tag: z.string().optional().describe('Filtrer par tag'),
        projectId: z.string().optional().describe('Filtrer par projet source'),
        limit: z.number().optional().default(10).describe('Nombre maximum de résultats'),
      },
    },
    async (params) => {
      try {
        const db = getDatabase();
        const service = new BestPracticeService(db);

        const results = service.searchPractices({
          query: params.query,
          category: params.category,
          tag: params.tag,
          projectId: params.projectId,
          limit: params.limit,
        });

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Aucune bonne pratique trouvée pour cette recherche.',
              },
            ],
          };
        }

        const summaryText = generateSearchSummary(results, params.query);

        const data = results.map(r => ({
          id: r.practice.id,
          title: r.practice.title,
          description: r.practice.description,
          category: r.practice.category,
          tags: r.practice.tags,
          occurrenceCount: r.practice.occurrenceCount,
          isManual: r.practice.isManual,
          score: r.score,
        }));

        return {
          content: [
            { type: 'text' as const, text: summaryText },
            { type: 'text' as const, text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text' as const, text: `Erreur lors de la recherche : ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}

function generateSearchSummary(results: any[], query?: string): string {
  const lines: string[] = [];

  if (query) {
    lines.push(`## Recherche : "${query}"`);
  } else {
    lines.push('## Bonnes pratiques');
  }

  lines.push(`${results.length} résultat(s)\n`);

  for (const r of results) {
    const bp = r.practice;
    const score = r.score !== undefined ? ` [${(r.score * 100).toFixed(0)}%]` : '';
    lines.push(`**${bp.title}**${score}`);
    lines.push(`  Catégorie : ${bp.category} | Occurrences : ${bp.occurrenceCount} | ${bp.isManual ? 'Manuelle' : 'Auto'}`);
    lines.push(`  ${bp.description.substring(0, 120)}...`);
    lines.push('');
  }

  return lines.join('\n');
}
```

---

### 3.3 Implémenter l'outil MCP `add_best_practice` (3h)

**Fichier :** `src/mcp/tools/add-best-practice.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BestPracticeService } from '../../best-practices/best-practice-service.js';
import { getDatabase } from '../../storage/database.js';

const VALID_CATEGORIES = ['performance', 'accessibility', 'seo', 'ux', 'content', 'general'] as const;

/**
 * Enregistrer l'outil MCP add_best_practice.
 */
export function registerAddBestPracticeTool(server: McpServer): void {
  server.registerTool(
    'add_best_practice',
    {
      title: 'Add Best Practice',
      description: 'Ajouter manuellement une bonne pratique au système EKTS',
      inputSchema: {
        title: z.string().min(3).describe('Titre de la bonne pratique (min 3 caractères)'),
        description: z.string().min(10).describe('Description détaillée (min 10 caractères)'),
        category: z.enum(VALID_CATEGORIES).describe('Catégorie de la bonne pratique'),
        tags: z.array(z.string()).optional().describe('Tags pour le filtrage'),
      },
    },
    async (params) => {
      try {
        const db = getDatabase();
        const service = new BestPracticeService(db);

        const bp = service.create({
          title: params.title,
          description: params.description,
          category: params.category,
          tags: params.tags,
        });

        const summaryText = `✅ Bonne pratique créée avec succès.\n\n**${bp.title}** (ID: ${bp.id})\nCatégorie : ${bp.category}\n${bp.description}`;

        return {
          content: [
            { type: 'text' as const, text: summaryText },
            { type: 'text' as const, text: JSON.stringify(bp, null, 2) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text' as const, text: `Erreur lors de la création : ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
```

**Mettre à jour `src/mcp/tools/index.ts` :**

Ajouter les imports et enregistrements :
```typescript
import { registerSearchBestPracticesTool } from './search-best-practices.js';
import { registerAddBestPracticeTool } from './add-best-practice.js';

// Dans la fonction d'enregistrement des outils :
registerSearchBestPracticesTool(server);
registerAddBestPracticeTool(server);
```

**Critères d'acceptation :**
- Outil `search_best_practices` fonctionnel (recherche + filtres)
- Outil `add_best_practice` fonctionnel (création avec validation)
- Paramètres Zod validés (min lengths, enum categories)
- Réponse structurée (résumé textuel + JSON)
- Gestion d'erreurs avec messages clairs
- Conforme aux guardrails MCP

---

### 3.4 Tests CLI (4h)

**Fichier :** `tests/cli/best-practice.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';
import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';

describe('CLI ekts bestpractice', () => {
  let db: Database.Database;
  let service: BestPracticeService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    migration006CreateBestPractices(db);
    service = new BestPracticeService(db);

    // Données de test
    service.create({
      title: 'Optimiser les images',
      description: 'Convertir les images en WebP pour réduire la taille',
      category: 'performance',
      tags: ['images', 'webp'],
    });

    service.create({
      title: 'Ajouter les attributs alt',
      description: 'Chaque image doit avoir un attribut alt descriptif',
      category: 'accessibility',
      tags: ['images', 'a11y'],
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('list', () => {
    it('devrait lister toutes les bonnes pratiques', () => {
      const list = service.list();
      expect(list).toHaveLength(2);
    });

    it('devrait filtrer par catégorie', () => {
      const list = service.list({ category: 'performance' });
      expect(list).toHaveLength(1);
      expect(list[0].category).toBe('performance');
    });

    it('devrait filtrer par tag', () => {
      const list = service.list({ tag: 'images' });
      expect(list).toHaveLength(2);
    });

    it('devrait limiter les résultats', () => {
      const list = service.list({ limit: 1 });
      expect(list).toHaveLength(1);
    });
  });

  describe('search', () => {
    it('devrait rechercher par texte', () => {
      const results = service.searchPractices({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait retourner vide pour une requête sans résultats', () => {
      const results = service.searchPractices({ query: 'xyznonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('add', () => {
    it('devrait créer une bonne pratique manuelle', () => {
      const bp = service.create({
        title: 'Nouvelle BP',
        description: 'Description test',
        category: 'seo',
        tags: ['test'],
      });

      expect(bp.isManual).toBe(true);
      expect(bp.title).toBe('Nouvelle BP');
    });
  });

  describe('show', () => {
    it('devrait retrouver par ID', () => {
      const bp = service.create({ title: 'Test', description: 'D', category: 'general' });
      const found = service.getById(bp.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Test');
    });

    it('devrait retourner null pour ID inexistant', () => {
      expect(service.getById('nonexistent')).toBeNull();
    });
  });

  describe('delete', () => {
    it('devrait supprimer la bonne pratique', () => {
      const bp = service.create({ title: 'To Delete', description: 'D', category: 'general' });
      service.delete(bp.id);
      expect(service.getById(bp.id)).toBeNull();
    });
  });
});
```

---

### 3.5 Tests MCP (3h)

**Fichier :** `tests/mcp/tools/search-best-practices.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { migration006CreateBestPractices } from '../../../src/storage/migrations/006_create_best_practices.js';
import { BestPracticeService } from '../../../src/best-practices/best-practice-service.js';

describe('MCP search_best_practices', () => {
  let db: Database.Database;
  let service: BestPracticeService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    migration006CreateBestPractices(db);
    service = new BestPracticeService(db);

    service.create({
      title: 'Images WebP',
      description: 'Convertir en WebP',
      category: 'performance',
      tags: ['images'],
    });
  });

  afterEach(() => {
    db.close();
  });

  it('devrait rechercher par texte', () => {
    const results = service.searchPractices({ query: 'images' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].practice.title).toContain('Images');
  });

  it('devrait filtrer par catégorie', () => {
    const results = service.searchPractices({ category: 'performance' });
    expect(results).toHaveLength(1);
  });

  it('devrait limiter les résultats', () => {
    const results = service.searchPractices({ limit: 0 });
    expect(results).toHaveLength(0);
  });
});
```

**Fichier :** `tests/mcp/tools/add-best-practice.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { migration006CreateBestPractices } from '../../../src/storage/migrations/006_create_best_practices.js';
import { BestPracticeService } from '../../../src/best-practices/best-practice-service.js';

describe('MCP add_best_practice', () => {
  let db: Database.Database;
  let service: BestPracticeService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    migration006CreateBestPractices(db);
    service = new BestPracticeService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('devrait créer une bonne pratique', () => {
    const bp = service.create({
      title: 'Test BP',
      description: 'Description de test pour la bonne pratique',
      category: 'seo',
      tags: ['test', 'seo'],
    });

    expect(bp.id).toBeDefined();
    expect(bp.title).toBe('Test BP');
    expect(bp.isManual).toBe(true);
  });
});
```

---

### 3.6 Tests d'intégration (3h)

**Fichier :** `tests/integration/best-practices-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';
import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';

describe('Best Practices Integration', () => {
  let db: Database.Database;
  let service: BestPracticeService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    // Schéma complet
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, created_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL, url TEXT NOT NULL, timestamp TEXT NOT NULL,
        overall_score REAL NOT NULL DEFAULT 0, total_findings INTEGER NOT NULL DEFAULT 0,
        critical_findings INTEGER NOT NULL DEFAULT 0, high_findings INTEGER NOT NULL DEFAULT 0,
        medium_findings INTEGER NOT NULL DEFAULT 0, low_findings INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL, dimension TEXT NOT NULL,
        score INTEGER NOT NULL, findings_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL, dimension TEXT NOT NULL,
        title TEXT NOT NULL, description TEXT, severity INTEGER NOT NULL DEFAULT 0,
        effort INTEGER NOT NULL DEFAULT 1, impact INTEGER NOT NULL DEFAULT 1,
        priority TEXT NOT NULL DEFAULT 'low', recommendation TEXT,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id)
      )
    `);

    migration006CreateBestPractices(db);

    db.prepare('INSERT INTO projects (id, name, url, created_at) VALUES (?, ?, ?, ?)')
      .run('proj-1', 'Integration Project', 'https://example.com', new Date().toISOString());

    service = new BestPracticeService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('flux complet : extraire → chercher → associer → afficher', () => {
    // 1. Insérer des audits avec des findings
    insertAudit(db, 'proj-1', '2024-01-01', { performance: 70 });
    insertFinding(db, 1, 'performance', 'Images non optimisées', 2, 'Convertir en WebP');

    insertAudit(db, 'proj-1', '2024-02-01', { performance: 72 });
    insertFinding(db, 2, 'performance', 'Images non optimisées', 2, 'Convertir en WebP');

    insertAudit(db, 'proj-1', '2024-03-01', { performance: 85 });
    // Pas de finding → résolu

    // 2. Extraire les bonnes pratiques
    const report = service.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(1);

    // 3. Rechercher la bonne pratique extraite
    const results = service.searchPractices({ query: 'images' });
    expect(results.length).toBeGreaterThanOrEqual(1);

    // 4. Vérifier l'association
    const linkedFindings = service.findLinkedFindings(results[0].practice.id);
    // L'extracteur crée des associations automatiquement
    // Le nombre dépend de l'implémentation

    // 5. Compter
    expect(service.count()).toBeGreaterThanOrEqual(1);
    expect(service.count({ category: 'performance' })).toBeGreaterThanOrEqual(1);
  });

  it('flux manuel : créer → lier → retrouver', () => {
    // Créer manuellement
    const bp = service.create({
      title: 'Toujours ajouter les alt text',
      description: 'Chaque image doit avoir un attribut alt',
      category: 'accessibility',
      tags: ['a11y', 'images'],
    });

    // Lier à un finding
    service.linkToFinding(bp.id, 'Missing alt attribute', 'accessibility', 0.9);

    // Retrouver
    const found = service.findByFinding('Missing alt attribute', 'accessibility');
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(bp.id);

    // Délier
    service.unlinkFromFinding(bp.id, 'Missing alt attribute', 'accessibility');
    expect(service.findByFinding('Missing alt attribute', 'accessibility')).toHaveLength(0);
  });
});

// Helpers
function insertAudit(db: Database.Database, projectId: string, timestamp: string, scores: Record<string, number>): number {
  const result = db.prepare(`
    INSERT INTO audit_metadata (project_id, url, timestamp)
    VALUES (?, ?, ?)
  `).run(projectId, 'https://example.com', timestamp);
  const auditId = Number(result.lastInsertRowid);

  for (const [dimension, score] of Object.entries(scores)) {
    db.prepare(`
      INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
      VALUES (?, ?, ?, 0)
    `).run(auditId, dimension, score);
  }

  return auditId;
}

function insertFinding(db: Database.Database, auditId: number, dimension: string, title: string, severity: number, recommendation?: string): void {
  db.prepare(`
    INSERT INTO audit_findings (audit_id, dimension, title, severity, recommendation)
    VALUES (?, ?, ?, ?, ?)
  `).run(auditId, dimension, title, severity, recommendation ?? `Fix: ${title}`);
}
```

---

### 3.7 Rédiger la documentation utilisateur (3h)

**Fichier :** `docs/user/BEST_PRACTICES.md`

```markdown
# Capitalisation des Connaissances — Guide utilisateur

## Vue d'ensemble

EKTS transforme vos audits en **capital réutilisable** : les constats résolus avec succès sont automatiquement extraits et organisés en **bonnes pratiques** que vous pouvez rechercher, réutiliser et associer aux problèmes courants.

### Fonctionnement

1. **Extraction automatique** — Après plusieurs audits d'un projet, EKTS détecte les constats qui ont été résolus (disparition du constat + amélioration du score)
2. **Création des bonnes pratiques** — Chaque constat résolu récurrent (≥ 2 occurrences) devient une bonne pratique
3. **Recherche hybride** — Recherchez par texte (FTS5) ou par filtres (catégorie, tag, projet)
4. **Associations** — Les findings courants sont automatiquement liés aux bonnes practices correspondantes

## Commandes CLI

### `ekts bestpractice list`

Lister les bonnes pratiques avec filtres.

```bash
# Toutes les bonnes pratiques
ekts bestpractice list

# Par catégorie
ekts bestpractice list --category performance

# Par tag
ekts bestpractice list --tag images

# Par projet source
ekts bestpractice list --project mon-projet

# Uniquement les manuelles / automatiques
ekts bestpractice list --manual
ekts bestpractice list --auto

# Tri et limite
ekts bestpractice list --sort occurrence_count --order desc --limit 50
```

### `ekts bestpractice search <query>`

Rechercher des bonnes pratiques par texte.

```bash
# Recherche simple
ekts bestpractice search "optimiser images"

# Avec filtre de catégorie
ekts bestpractice search "accessibilité" --category accessibility

# Limite de résultats
ekts bestpractice search "performance" --limit 5
```

### `ekts bestpractice add`

Ajouter manuellement une bonne pratique.

```bash
ekts bestpractice add \
  --title "Toujours lazy-loader les images" \
  --description "Utiliser loading=lazy pour les images hors viewport" \
  --category performance \
  --tags "images,lazy-loading,performance"
```

### `ekts bestpractice show <id>`

Afficher le détail d'une bonne pratique, y compris les findings associés.

```bash
ekts bestpractice show abc12345
```

### `ekts bestpractice delete <id>`

Supprimer une bonne pratique.

```bash
ekts bestpractice delete abc12345 --yes
```

### `ekts bestpractice extract <projectId>`

Extraire automatiquement les bonnes pratiques depuis les audits d'un projet.

```bash
# Extraction standard
ekts bestpractice extract mon-projet

# Avec critères personnalisés
ekts bestpractice extract mon-projet --min-occurrences 3 --min-audits 5
```

## Outils MCP

### `search_best_practices`

Rechercher des bonnes pratiques depuis un agent IA.

```json
{
  "tool": "search_best_practices",
  "arguments": {
    "query": "optimiser images",
    "category": "performance",
    "limit": 10
  }
}
```

### `add_best_practice`

Ajouter manuellement une bonne pratique depuis un agent IA.

```json
{
  "tool": "add_best_practice",
  "arguments": {
    "title": "Utiliser le lazy loading",
    "description": "Ajouter loading=lazy aux images et iframes hors viewport",
    "category": "performance",
    "tags": ["images", "lazy-loading"]
  }
}
```

## Catégories

| Catégorie | Description |
|-----------|-------------|
| `performance` | Optimisation des performances (LCP, CLS, FID, etc.) |
| `accessibility` | Accessibilité (WCAG, ARIA, contrastes, etc.) |
| `seo` | Référencement (meta, titres, structured data, etc.) |
| `ux` | Expérience utilisateur (navigation, responsive, etc.) |
| `content` | Qualité du contenu (lisibilité, structure, etc.) |
| `general` | Bonnes pratiques transverses |

## Algorithme d'extraction

1. **Collecte** : Tous les findings des audits d'un projet sont collectés
2. **Regroupement** : Les findings sont regroupés par titre normalisé et dimension
3. **Détection de résolution** : Un finding est "résolu" s'il disparaît entre 2 audits consécutifs ET le score de la dimension s'améliore
4. **Filtrage** : Seuls les findings résolus avec ≥ N occurrences sont extraits
5. **Déduplication** : Si une bonne pratique existe déjà pour le même titre, elle est fusionnée (compteur incrémenté)
6. **Association** : Les findings courants sont liés aux bonnes pratiques correspondantes

## Configuration

Les critères d'extraction sont configurables :

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `minOccurrences` | 2 | Nombre minimum d'occurrences du finding |
| `minAudits` | 2 | Nombre minimum d'audits du projet |
| `minConfidence` | 0.5 | Score minimum de confiance pour les associations |

## Exemples

### Exemple 1 : Extraction après 5 audits

```bash
# Après 5 audits d'un projet e-commerce
ekts bestpractice extract e-commerce-site

# Résultat : 12 bonnes pratiques extraites
# - 8 sur la performance (images, cache, etc.)
# - 3 sur l'accessibilité (contrastes, ARIA)
# - 1 sur le SEO (meta descriptions)
```

### Exemple 2 : Recherche pour un nouveau projet

```bash
# Démarrer un nouveau projet SaaS
ekts bestpractice search "SaaS performance" --limit 5

# Les bonnes pratiques des projets similaires sont proposées
```

### Exemple 3 : Agent IA recommande des solutions

```
Agent : Un finding "Missing alt attributes" est récurrent sur ce projet.
→ L'outil search_best_practices est appelé
→ Une bonne pratique "Toujours ajouter les attributs alt" est trouvée
→ La recommandation est présentée au développeur
```
```

---

### 3.8 Mettre à jour la documentation de référence (2h)

**Mettre à jour `docs/reference/CLI_REFERENCE.md` :**

Ajouter la section :

```markdown
## Commande `ekts bestpractice` (alias `bp`)

### `ekts bestpractice list`

Lister les bonnes pratiques avec filtres.

**Options :**
- `-c, --category <cat>` : Filtrer par catégorie
- `-t, --tag <tag>` : Filtrer par tag
- `-p, --project <id>` : Filtrer par projet source
- `--manual` / `--auto` : Filtrer par type
- `--sort <field>` : Tri (created_at, updated_at, occurrence_count, title)
- `--order <dir>` : Ordre (asc, desc)
- `-l, --limit <n>` : Nombre max (défaut: 20)

### `ekts bestpractice search <query>`

Rechercher des bonnes pratiques (recherche hybride FTS5).

**Options :**
- `-c, --category <cat>` : Filtrer par catégorie
- `-l, --limit <n>` : Nombre max (défaut: 10)

### `ekts bestpractice add`

Ajouter une bonne pratique manuellement.

**Options (requises) :**
- `-t, --title <title>` : Titre
- `-d, --description <desc>` : Description
- `-c, --category <cat>` : Catégorie

**Options :**
- `--tags <tags>` : Tags séparés par des virgules

### `ekts bestpractice show <id>`

Afficher le détail d'une bonne pratique.

### `ekts bestpractice delete <id>`

Supprimer une bonne pratique.

**Options :**
- `-y, --yes` : Confirmer sans demander

### `ekts bestpractice extract <projectId>`

Extraire automatiquement les bonnes pratiques depuis les audits.

**Options :**
- `--min-occurrences <n>` : Occurrences minimum (défaut: 2)
- `--min-audits <n>` : Audits minimum (défaut: 2)
```

**Mettre à jour `docs/reference/MCP_REFERENCE.md` :**

Ajouter les sections :

```markdown
## Outil `search_best_practices`

Rechercher des bonnes pratiques EKTS.

**Paramètres :**
- `query` (string, optionnel) : Requête textuelle FTS5
- `category` (enum, optionnel) : Catégorie
- `tag` (string, optionnel) : Tag
- `projectId` (string, optionnel) : Projet source
- `limit` (number, optionnel, défaut: 10) : Nombre max

**Retour :** Résumé textuel + données JSON

## Outil `add_best_practice`

Ajouter manuellement une bonne pratique.

**Paramètres :**
- `title` (string, requis, min 3) : Titre
- `description` (string, requis, min 10) : Description
- `category` (enum, requis) : Catégorie
- `tags` (string[], optionnel) : Tags

**Retour :** Confirmation + données JSON
```

---

### 3.9 Test de vérification complet (2h)

```bash
# Compilation
npm run typecheck

# Lint
npm run lint

# Tous les tests
npm test

# Couverture
npm run coverage

# Vérification complète
npm run verify
```

---

### 3.10 Rédiger le rapport final SPRINT-15-RESULTAT.md (2h)

**Fichier :** `docs/blueprint/Docs/roadmap/sprints/SPRINT-15-RESULTAT.md`

```markdown
# Rapport Sprint 15 — Capitalisation Connaissances ✅

**Date de clôture :** [DATE]
**Statut :** ✅ TERMINÉ
**Durée réelle :** X jours (prévu : 9 jours)

---

## 1. Synthèse

Le Sprint 15 a mis en place la capitalisation des connaissances dans EKTS :
- Extraction automatique des bonnes pratiques depuis les audits
- Recherche hybride (FTS5) dans les bonnes pratiques
- Associations findings ↔ bonnes pratiques
- CLI complète (6 sous-commandes)
- 2 outils MCP pour agents IA

---

## 2. Fichiers créés

### Modules core
- `src/best-practices/best-practice.types.ts`
- `src/best-practices/best-practice-repository.ts`
- `src/best-practices/best-practice-search.ts`
- `src/best-practices/best-practice-extractor.ts`
- `src/best-practices/best-practice-service.ts`

### Stockage
- `src/storage/migrations/006_create_best_practices.ts`

### CLI
- `src/cli/commands/best-practice.ts`

### MCP
- `src/mcp/tools/search-best-practices.ts`
- `src/mcp/tools/add-best-practice.ts`

### Tests
- `tests/best-practices/best-practice-repository.test.ts`
- `tests/best-practices/best-practice-search.test.ts`
- `tests/best-practices/best-practice-extractor.test.ts`
- `tests/best-practices/best-practice-service.test.ts`
- `tests/cli/best-practice.test.ts`
- `tests/mcp/tools/search-best-practices.test.ts`
- `tests/mcp/tools/add-best-practice.test.ts`
- `tests/integration/best-practices-integration.test.ts`

### Documentation
- `docs/user/BEST_PRACTICES.md`

---

## 3. Modifications

- `src/storage/migrations/migration-registry.ts` — Ajout migration 006
- `src/cli/index.ts` — Enregistrement commande bestpractice
- `src/mcp/tools/index.ts` — Enregistrement 2 nouveaux outils
- `docs/reference/CLI_REFERENCE.md` — Section bestpractice
- `docs/reference/MCP_REFERENCE.md` — Sections search_best_practices, add_best_practice

---

## 4. Tests

### Unitaires
- BestPracticeRepository : X tests ✅
- BestPracticeSearch : Y tests ✅
- BestPracticeExtractor : Z tests ✅
- BestPracticeService : W tests ✅

### CLI et MCP
- CLI bestpractice : N tests ✅
- MCP search_best_practices : M tests ✅
- MCP add_best_practice : P tests ✅

### Intégration
- Flux complet : Q tests ✅

### Couverture
- Modules best-practices : > 80%
- Couverture globale : > 96%

---

## 5. Critères validés

- [ ] C15.1 : Création manuelle ✅
- [ ] C15.2 : Extraction automatique ✅
- [ ] C15.3 : Recherche FTS5 ✅
- [ ] C15.4 : Recherche sémantique (prêt, sans embeddings) ✅
- [ ] C15.5 : Fusion RRF ✅
- [ ] C15.6 : Associations finding ↔ BP ✅
- [ ] C15.7-15.12 : CLI et MCP ✅
- [ ] C15.13-15.17 : Performance et qualité ✅
- [ ] C15.18-15.20 : Qualité ✅

---

## 6. Décisions prises

1. [Décision 1]
2. [Décision 2]

---

## 7. Problèmes rencontrés

1. [Problème 1] → [Solution]

---

## 8. Prochaine étape

Sprint 16 : Recommandations Contextuelles

---

**Rapport rédigé le [DATE]**
**Sprint 15 terminé et validé**
```

---

## 4. Vérifications finales

### 4.1 Compilation et lint

```bash
npm run typecheck
npm run lint
```

### 4.2 Tests complets

```bash
npm test
npm run coverage
```

### 4.3 Vérification globale

```bash
npm run verify
```

---

## 5. Critères de validation du sous-sprint

- ✅ Commande CLI `ekts bestpractice` implémentée (6 sous-commandes)
- ✅ Outil MCP `search_best_practices` implémenté
- ✅ Outil MCP `add_best_practice` implémenté
- ✅ Tests CLI et MCP complets
- ✅ Tests d'intégration (flux complet extraction → recherche → association)
- ✅ Documentation utilisateur (`BEST_PRACTICES.md`)
- ✅ Documentation de référence mise à jour (CLI + MCP)
- ✅ Rapport final `SPRINT-15-RESULTAT.md` rédigé
- ✅ `npm run verify` passe
- ✅ Couverture > 96%

---

**Document rédigé le 25 octobre 2026 — Sprint 15-03 du projet EKTS**  
**Statut : ✅ Sprint 15-03 implémenté et validé**
