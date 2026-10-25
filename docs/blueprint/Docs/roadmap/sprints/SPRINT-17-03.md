# SPRINT-17-03 — CLI, MCP, Export/Import, Tests et Documentation

**Sprint :** 17-03 sur 17 (Sous-sprint 3/3)  
**Durée :** 3 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Exposer les templates aux utilisateurs et agents IA :
- **CLI** : Commande `ekts template` avec 7 sous-commandes
- **MCP** : Outils `list_templates` et `apply_template`
- **Tests d'intégration** : Flux complet de bout en bout
- **Documentation** : Guide utilisateur et références API
- **Rapport final** : SPRINT-17-RESULTAT.md

---

## 2. Prérequis

```bash
# Vérifier que Sprint 17-02 est terminé
npm run verify

# Vérifier les modules 17-01 et 17-02
ls src/templates/
# Doit afficher : template.types.ts, template-repository.ts,
# template-service.ts, template-applier.ts, builtin-templates.ts
```

---

## 3. Tâches détaillées

### 3.1 Implémenter la commande CLI `ekts template` (6h)

**Fichier :** `src/cli/commands/template.ts`

```typescript
import { Command } from 'commander';
import { writeFile, readFile } from 'node:fs/promises';
import { TemplateService } from '../../templates/template-service.js';
import { TemplateRepository } from '../../templates/template-repository.js';
import { ProjectRepository } from '../../storage/project-repository.js';
import { getDatabase } from '../../storage/database.js';
import { renderTable } from '../utils/table.js';

import type { TemplateCategory } from '../../templates/template.types.js';

const VALID_CATEGORIES = [
  'e-commerce', 'saas', 'blog', 'portfolio', 'corporate',
  'landing', 'documentation', 'marketplace', 'news', 'agency', 'custom',
];

export function registerTemplateCommand(program: Command): void {
  const tpl = program
    .command('template')
    .alias('tpl')
    .description('Gérer les templates de projets');

  // ekts template list
  tpl
    .command('list')
    .description('Lister les templates disponibles')
    .option('-c, --category <cat>', 'Filtrer par catégorie')
    .option('--builtin', 'Montrer uniquement les templates prédéfinis')
    .option('--custom', 'Montrer uniquement les templates personnalisés')
    .option('-n, --limit <n>', 'Nombre maximum', '50')
    .action(async (options) => {
      const db = getDatabase();
      const repo = new TemplateRepository(db);

      try {
        const templates = repo.list({
          category: options.category as TemplateCategory | undefined,
          isBuiltin: options.builtin ? true : options.custom ? false : undefined,
          limit: parseInt(options.limit),
        });

        if (templates.length === 0) {
          console.log('Aucun template trouvé.');
          return;
        }

        const rows = templates.map(t => [
          t.id.substring(0, 8),
          t.name.substring(0, 30),
          t.category,
          t.isBuiltin ? '📦' : '✏️',
          t.bestPracticeIds.length.toString(),
          t.recommendationRuleIds.length.toString(),
        ]);

        renderTable(['ID', 'Nom', 'Catégorie', 'Type', 'BP', 'Règles'], rows);
        console.log(`\n${templates.length} template(s)`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts template show <id>
  tpl
    .command('show <id>')
    .description('Afficher le détail d\'un template')
    .action(async (id) => {
      const db = getDatabase();
      const repo = new TemplateRepository(db);

      try {
        const template = repo.getById(id);
        if (!template) {
          console.error(`Template non trouvé : ${id}`);
          process.exit(1);
        }

        console.log(`\n=== ${template.name} ===\n`);
        console.log(`ID : ${template.id}`);
        console.log(`Catégorie : ${template.category}`);
        console.log(`Type : ${template.isBuiltin ? '📦 Prédéfini' : '✏️ Personnalisé'}`);
        console.log(`Description : ${template.description}`);

        if (template.config.priorityDimensions) {
          console.log(`Dimensions prioritaires : ${template.config.priorityDimensions.join(', ')}`);
        }

        console.log(`Bonnes practices : ${template.bestPracticeIds.length}`);
        console.log(`Règles : ${template.recommendationRuleIds.length}`);
        console.log(`Créé : ${new Date(template.createdAt).toLocaleString()}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts template apply <templateId>
  tpl
    .command('apply <templateId>')
    .description('Créer un projet depuis un template')
    .requiredOption('--name <name>', 'Nom du projet')
    .requiredOption('--url <url>', 'URL du projet')
    .option('--description <desc>', 'Description du projet')
    .option('--config <json>', 'Configuration JSON personnalisée')
    .action(async (templateId, options) => {
      const db = getDatabase();
      const projectRepo = new ProjectRepository(db);
      const service = new TemplateService(db, projectRepo);

      try {
        const overrides = options.config ? { config: JSON.parse(options.config) } : undefined;

        const result = service.applyTemplate({
          templateId,
          projectName: options.name,
          projectUrl: options.url,
          projectDescription: options.description,
          overrides,
        });

        console.log(`\n✅ Projet créé depuis le template`);
        console.log(`   ID : ${result.projectId}`);
        console.log(`   Nom : ${result.projectName}`);
        console.log(`   Bonnes practices associées : ${result.bestPracticesAssociated}`);
        console.log(`   Règles créées : ${result.rulesCreated}`);
        console.log(`   Durée : ${result.durationMs}ms`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts template create
  tpl
    .command('create')
    .description('Créer un template personnalisé')
    .requiredOption('-n, --name <name>', 'Nom du template')
    .requiredOption('-d, --description <desc>', 'Description')
    .requiredOption('-c, --category <cat>', `Catégorie (${VALID_CATEGORIES.join(', ')})`)
    .option('--config <json>', 'Configuration JSON')
    .option('--bp-ids <ids>', 'IDs de bonnes practices (séparés par virgules)')
    .action(async (options) => {
      if (!VALID_CATEGORIES.includes(options.category)) {
        console.error(`Catégorie invalide : ${options.category}`);
        process.exit(1);
      }

      const db = getDatabase();
      const repo = new TemplateRepository(db);

      try {
        const template = repo.create({
          name: options.name,
          description: options.description,
          category: options.category as TemplateCategory,
          config: options.config ? JSON.parse(options.config) : undefined,
          bestPracticeIds: options.bpIds ? options.bpIds.split(',') : undefined,
        });

        console.log(`✅ Template créé : ${template.id}`);
        console.log(`   Nom : ${template.name}`);
        console.log(`   Catégorie : ${template.category}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts template delete <id>
  tpl
    .command('delete <id>')
    .description('Supprimer un template personnalisé')
    .action(async (id) => {
      const db = getDatabase();
      const repo = new TemplateRepository(db);

      try {
        repo.delete(id);
        console.log(`✅ Template supprimé`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts template export <id> <file>
  tpl
    .command('export <id> <file>')
    .description('Exporter un template en JSON')
    .action(async (id, file) => {
      const db = getDatabase();
      const repo = new TemplateRepository(db);

      try {
        const json = repo.exportToJson(id);
        await writeFile(file, json, 'utf-8');
        console.log(`✅ Template exporté vers ${file}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ekts template import <file>
  tpl
    .command('import <file>')
    .description('Importer un template depuis un JSON')
    .action(async (file) => {
      const db = getDatabase();
      const repo = new TemplateRepository(db);

      try {
        const json = await readFile(file, 'utf-8');
        const template = repo.importFromJson(json);
        console.log(`✅ Template importé : ${template.id}`);
        console.log(`   Nom : ${template.name}`);
      } catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
```

**Mettre à jour `src/cli/index.ts`** :
```typescript
import { registerTemplateCommand } from './commands/template.js';
registerTemplateCommand(program);
```

**Critères d'acceptation :**
- 7 sous-commandes fonctionnelles (list, show, apply, create, delete, export, import)
- Alias `tpl` fonctionnel
- Validation des catégories
- Gestion d'erreurs claire

---

### 3.2 Implémenter l'outil MCP `list_templates` (3h)

**Fichier :** `src/mcp/tools/list-templates.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TemplateRepository } from '../../templates/template-repository.js';
import { getDatabase } from '../../storage/database.js';

const VALID_CATEGORIES = [
  'e-commerce', 'saas', 'blog', 'portfolio', 'corporate',
  'landing', 'documentation', 'marketplace', 'news', 'agency', 'custom',
] as const;

export function registerListTemplatesTool(server: McpServer): void {
  server.registerTool(
    'list_templates',
    {
      title: 'List Project Templates',
      description: 'Lister les templates de projets EKTS disponibles (prédéfinis et personnalisés)',
      inputSchema: {
        category: z.enum(VALID_CATEGORIES).optional().describe('Filtrer par catégorie'),
        builtinOnly: z.boolean().optional().default(false).describe('Uniquement les templates prédéfinis'),
        limit: z.number().optional().default(20).describe('Nombre maximum'),
      },
    },
    async (params) => {
      try {
        const db = getDatabase();
        const repo = new TemplateRepository(db);

        const templates = repo.list({
          category: params.category,
          isBuiltin: params.builtinOnly ? true : undefined,
          limit: params.limit,
        });

        if (templates.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'Aucun template trouvé.' }],
          };
        }

        const summaryText = generateTemplateListSummary(templates);
        const data = templates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          description: t.description,
          isBuiltin: t.isBuiltin,
          bestPracticeCount: t.bestPracticeIds.length,
          ruleCount: t.recommendationRuleIds.length,
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
          content: [{ type: 'text' as const, text: `Erreur : ${message}` }],
          isError: true,
        };
      }
    }
  );
}

function generateTemplateListSummary(templates: any[]): string {
  const lines = ['## Templates de projets disponibles\n'];
  lines.push(`${templates.length} template(s)\n`);

  for (const t of templates) {
    const type = t.isBuiltin ? '📦' : '✏️';
    lines.push(`${type} **${t.name}** (${t.category})`);
    lines.push(`   ${t.description.substring(0, 100)}...`);
    lines.push(`   BP : ${t.bestPracticeIds.length} | Règles : ${t.recommendationRuleIds.length}`);
    lines.push('');
  }

  return lines.join('\n');
}
```

---

### 3.3 Implémenter l'outil MCP `apply_template` (3h)

**Fichier :** `src/mcp/tools/apply-template.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TemplateService } from '../../templates/template-service.js';
import { ProjectRepository } from '../../storage/project-repository.js';
import { getDatabase } from '../../storage/database.js';

export function registerApplyTemplateTool(server: McpServer): void {
  server.registerTool(
    'apply_template',
    {
      title: 'Apply Project Template',
      description: 'Créer un nouveau projet EKTS en appliquant un template (configuration, bonnes practices, règles)',
      inputSchema: {
        templateId: z.string().describe('ID du template à appliquer'),
        projectName: z.string().min(1).describe('Nom du projet'),
        projectUrl: z.string().url().describe('URL du projet'),
        projectDescription: z.string().optional().describe('Description du projet'),
        overrides: z.object({
          config: z.record(z.any()).optional().describe('Configuration à merger'),
          additionalBestPracticeIds: z.array(z.string()).optional(),
          additionalRuleIds: z.array(z.string()).optional(),
        }).optional().describe('Overrides optionnels'),
      },
    },
    async (params) => {
      try {
        const db = getDatabase();
        const projectRepo = new ProjectRepository(db);
        const service = new TemplateService(db, projectRepo);

        const result = service.applyTemplate({
          templateId: params.templateId,
          projectName: params.projectName,
          projectUrl: params.projectUrl,
          projectDescription: params.projectDescription,
          overrides: params.overrides,
        });

        const summaryText = `✅ Projet créé avec succès depuis le template.\n\n**${result.projectName}** (ID: ${result.projectId})\nBonnes practices associées : ${result.bestPracticesAssociated}\nRègles créées : ${result.rulesCreated}\nDurée : ${result.durationMs}ms`;

        return {
          content: [
            { type: 'text' as const, text: summaryText },
            { type: 'text' as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Erreur : ${message}` }],
          isError: true,
        };
      }
    }
  );
}
```

**Mettre à jour `src/mcp/tools/index.ts`** :
```typescript
import { registerListTemplatesTool } from './list-templates.js';
import { registerApplyTemplateTool } from './apply-template.js';
registerListTemplatesTool(server);
registerApplyTemplateTool(server);
```

---

### 3.4 Tests CLI (3h)

**Fichier :** `tests/cli/template.test.ts`

Tests des 7 sous-commandes avec données de test.

---

### 3.5 Tests MCP (2h)

**Fichiers :** `tests/mcp/tools/list-templates.test.ts` et `apply-template.test.ts`

---

### 3.6 Tests d'intégration (3h)

**Fichier :** `tests/integration/templates-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { writeFile, readFile, unlink } from 'node:fs/promises';

import { TemplateService } from '../../src/templates/template-service.js';
import { TemplateRepository } from '../../src/templates/template-repository.js';
import { ProjectRepository } from '../../src/storage/project-repository.js';
import { BUILTIN_TEMPLATES } from '../../src/templates/builtin-templates.js';
import { migration008CreateTemplates } from '../../src/storage/migrations/008_create_templates.js';

describe('Templates Integration', () => {
  let db: Database.Database;
  let service: TemplateService;
  let repo: TemplateRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    db.exec(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, description TEXT, created_at TEXT NOT NULL)`);
    db.exec(`CREATE TABLE IF NOT EXISTS best_practices (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', source_project_ids TEXT NOT NULL DEFAULT '[]', source_audit_ids TEXT NOT NULL DEFAULT '[]', occurrence_count INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, is_manual INTEGER NOT NULL DEFAULT 0)`);
    migration008CreateTemplates(db);

    const projectRepo = new ProjectRepository(db);
    service = new TemplateService(db, projectRepo);
    repo = new TemplateRepository(db);
  });

  afterEach(() => { db.close(); });

  it('flux complet : créer template → lister → appliquer → exporter/importer', () => {
    // 1. Créer un template personnalisé
    const template = repo.create({
      name: 'Mon Template',
      description: 'Template de test',
      category: 'custom',
      config: {
        priorityDimensions: ['performance', 'seo'],
        tags: ['test'],
      },
    });

    expect(template.id).toBeDefined();
    expect(template.isBuiltin).toBe(false);

    // 2. Lister
    const list = repo.list({ category: 'custom' });
    expect(list).toHaveLength(1);

    // 3. Appliquer
    const result = service.applyTemplate({
      templateId: template.id,
      projectName: 'Mon Projet',
      projectUrl: 'https://example.com',
    });

    expect(result.projectId).toBeDefined();
    expect(result.projectName).toBe('Mon Projet');

    // 4. Exporter
    const json = repo.exportToJson(template.id);
    expect(json).toContain('Mon Template');

    // 5. Importer
    const imported = repo.importFromJson(json);
    expect(imported.name).toBe('Mon Template');
    expect(imported.id).not.toBe(template.id); // Nouvel ID
  });

  it('flux avec overrides partiels', () => {
    const template = repo.create({
      name: 'Base',
      description: 'Template de base',
      category: 'custom',
      config: {
        priorityDimensions: ['performance'],
        alertThresholds: { regressionPoints: 10, minScore: 50 },
      },
    });

    const result = service.applyTemplate({
      templateId: template.id,
      projectName: 'Projet Custom',
      projectUrl: 'https://custom.com',
      overrides: {
        projectName: 'Projet Renommé',
        config: {
          alertThresholds: { minScore: 75 }, // Override partiel
        },
      },
    });

    expect(result.projectName).toBe('Projet Renommé');
  });

  it('ne doit pas permettre de modifier un template builtin', () => {
    const builtin = repo.create({
      name: 'Builtin',
      description: 'Test',
      category: 'custom',
    }, true); // isBuiltin = true

    expect(() => repo.update(builtin.id, { name: 'Modified' })).toThrow('builtin');
    expect(() => repo.delete(builtin.id)).toThrow('builtin');
  });
});
```

---

### 3.7 Rédiger la documentation utilisateur (3h)

**Fichier :** `docs/user/TEMPLATES.md`

```markdown
# Templates de Projets — Guide utilisateur

## Vue d'ensemble

Les templates EKTS permettent d'initialiser rapidement des projets avec une configuration prédéfinie adaptée au type de site.

### Templates prédéfinis

10 templates sont disponibles :

| # | Catégorie | Description |
|---|-----------|-------------|
| 1 | E-commerce | Performance listings, SEO produit, UX achat |
| 2 | SaaS | Performance bundle, accessibilité ARIA, SEO technique |
| 3 | Blog | SEO contenu, performance médias, lisibilité |
| 4 | Portfolio | Design responsive, performance images, contenu concis |
| 5 | Corporate | Accessibilité WCAG, SEO on-page, navigation |
| 6 | Landing | Performance above-fold, UX conversion, SEO local |
| 7 | Documentation | Accessibilité lecture, recherche, contenu structuré |
| 8 | Marketplace | Performance listings, sécurité, UX recherche |
| 9 | News | Performance médias, SEO news, contenu structuré |
| 10 | Agency | Design impactant, performance portfolio, contenu engageant |

## Commandes CLI

### `ekts template list`

Lister les templates disponibles.

```bash
ekts template list
ekts template list --category e-commerce
ekts template list --builtin
ekts template list --custom
```

### `ekts template show <id>`

Afficher le détail d'un template.

```bash
ekts template show abc12345
```

### `ekts template apply <templateId>`

Créer un projet depuis un template.

```bash
ekts template apply <templateId> \
  --name "Mon site e-commerce" \
  --url "https://monsite.com" \
  --description "Boutique en ligne"
```

**Options :**
- `--name` : Nom du projet (requis)
- `--url` : URL du projet (requis)
- `--description` : Description
- `--config <json>` : Configuration JSON personnalisée

### `ekts template create`

Créer un template personnalisé.

```bash
ekts template create \
  --name "Mon Template" \
  --description "Template personnalisé" \
  --category custom \
  --config '{"priorityDimensions": ["performance", "seo"]}'
```

### `ekts template delete <id>`

Supprimer un template personnalisé (les templates prédéfinis ne peuvent pas être supprimés).

### `ekts template export <id> <file>`

Exporter un template en JSON.

```bash
ekts template export abc12345 my-template.json
```

### `ekts template import <file>`

Importer un template depuis un JSON.

```bash
ekts template import my-template.json
```

## Outils MCP

### `list_templates`

Lister les templates depuis un agent IA.

```json
{
  "tool": "list_templates",
  "arguments": {
    "category": "e-commerce",
    "builtinOnly": true
  }
}
```

### `apply_template`

Créer un projet depuis un template.

```json
{
  "tool": "apply_template",
  "arguments": {
    "templateId": "abc12345",
    "projectName": "Mon projet",
    "projectUrl": "https://example.com",
    "overrides": {
      "config": {
        "alertThresholds": { "minScore": 75 }
      }
    }
  }
}
```

## Configuration d'un template

La configuration d'un template inclut :

| Champ | Description | Défaut |
|-------|-------------|--------|
| `priorityDimensions` | Dimensions prioritaires | Toutes |
| `alertThresholds.regressionPoints` | Seuil de régression | 10 |
| `alertThresholds.minScore` | Score minimum | 50 |
| `extractionCriteria.minOccurrences` | Occurrences minimum BP | 2 |
| `extractionCriteria.minAudits` | Audits minimum | 2 |
| `recommendationOptions.maxRecommendations` | Max recommandations | 10 |
| `recommendationOptions.minRelevanceScore` | Score minimum | 0.3 |
| `tags` | Tags pour le filtrage | [] |

## Exemples

### Créer un projet e-commerce

```bash
# Lister les templates e-commerce
ekts template list --category e-commerce

# Appliquer le template e-commerce
ekts template apply <ecommerce-id> \
  --name "Ma boutique" \
  --url "https://maboutique.com" \
  --description "Boutique en ligne de vêtements"
```

### Créer un template personnalisé

```bash
# Créer un template
ekts template create \
  --name "Startup SaaS" \
  --description "Template optimisé pour les startups SaaS" \
  --category saas \
  --config '{
    "priorityDimensions": ["performance", "accessibility"],
    "alertThresholds": {"regressionPoints": 5, "minScore": 80},
    "tags": ["startup", "saas", "mvp"]
  }'

# L'appliquer
ekts template apply <custom-id> --name "MonSaaS" --url "https://monsaas.com"
```

### Partager un template

```bash
# Exporter
ekts template export <id> startup-saas.json

# Importer sur une autre instance
ekts template import startup-saas.json
```
```

---

### 3.8 Mettre à jour la documentation de référence (2h)

**Mettre à jour `docs/reference/CLI_REFERENCE.md`** : section `ekts template` (7 sous-commandes).

**Mettre à jour `docs/reference/MCP_REFERENCE.md`** : sections `list_templates`, `apply_template`.

---

### 3.9 Test de vérification complet (2h)

```bash
npm run typecheck
npm run lint
npm test
npm run coverage
npm run verify
```

---

### 3.10 Rédiger le rapport final (2h)

**Fichier :** `docs/blueprint/Docs/roadmap/sprints/SPRINT-17-RESULTAT.md`

Rapport standard : fichiers créés, modifications, tests, critères validés, prochaine étape (Sprint 18).

---

## 4. Vérifications finales

```bash
npm run typecheck
npm run lint
npm test
npm run coverage
npm run verify
```

---

## 5. Critères de validation du sous-sprint

- ✅ Commande CLI `ekts template` (7 sous-commandes) fonctionnelle
- ✅ Outil MCP `list_templates` fonctionnel
- ✅ Outil MCP `apply_template` fonctionnel
- ✅ Export/import JSON fonctionnel
- ✅ Tests CLI et MCP complets
- ✅ Tests d'intégration (flux complet, overrides, protection builtin)
- ✅ Documentation utilisateur (`TEMPLATES.md`)
- ✅ Documentation de référence mise à jour
- ✅ Rapport final rédigé
- ✅ `npm run verify` passe
- ✅ Couverture > 96%

---

**Document rédigé le 25 octobre 2026 — Sprint 17-03 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 17-03 prêt pour implémentation**
