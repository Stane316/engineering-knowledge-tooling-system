# Sprint 13-3 — MCP projets + tests + documentation

**Identifiant :** SPRINT-13-03  
**Parent :** SPRINT-13 (Gestion Multi-Projets)  
**Durée prévue :** 4 jours  
**Date de documentation :** 25 octobre 2026  
**Statut :** ✅ TERMINÉ (25/10/2026 — voir `SPRINT-13-RESULTAT.md`)

---

## 1. Objectif précis

**Implémenter les outils MCP pour les projets et finaliser la documentation du sprint.**

- MCP tool `create_project` — Créer un projet
- MCP tool `list_projects` — Lister les projets
- MCP tool `get_project` — Obtenir un projet par ID
- MCP tool `delete_project` — Supprimer un projet
- Tests MCP > 80% couverture
- Documentation mise à jour (CLI.md, MCP.md, API_REFERENCE.md)
- Guide `docs/guides/PROJECTS.md`

**Résultat concret attendu :**
- 4 outils MCP fonctionnels (total 11 outils)
- Tests MCP complets
- Documentation complète
- `npm run verify` code 0
- CI verte (7/7 jobs)

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Sprint 13-1 terminé | ProjectManager existe | Exécuter 13-1 d'abord |
| Sprint 13-2 terminé | CLI fonctionne | Exécuter 13-2 d'abord |
| Node.js 22+ | `node --version` | Installer Node.js 22 LTS |
| npm 10+ | `npm --version` | Installer npm 10+ |
| Git | `git --version` | Installer Git |
| `npm run verify` code 0 | `npm run verify` | Corriger erreurs avant de commencer |

---

## 3. Tâches atomiques

### Tâche 3.1 — Schémas Zod pour les outils MCP

**Objectif :** Définir les entrées/sorties des 4 outils  
**Durée :** 1h  
**Fichiers :** `src/mcp/schemas/tool-schemas.ts` (modification)

**Actions :**

```typescript
// Ajouter dans src/mcp/schemas/tool-schemas.ts

// Tool: create_project
export const CreateProjectToolSchema = {
  name: 'create_project',
  description: 'Créer un nouveau projet EKTS',
  inputSchema: z.object({
    name: z.string().min(1).max(200).describe('Nom du projet'),
    description: z.string().max(2000).optional().describe('Description du projet'),
    status: z.enum(['active', 'completed', 'archived']).default('active').describe('Statut initial'),
  }),
};

// Tool: list_projects
export const ListProjectsToolSchema = {
  name: 'list_projects',
  description: 'Lister les projets EKTS',
  inputSchema: z.object({
    status: z.enum(['active', 'completed', 'archived']).optional().describe('Filtrer par statut'),
    limit: z.number().int().positive().max(100).optional().describe('Nombre maximum de résultats'),
    offset: z.number().int().nonnegative().optional().describe('Décalage pour pagination'),
  }),
};

// Tool: get_project
export const GetProjectToolSchema = {
  name: 'get_project',
  description: 'Obtenir les détails d\'un projet par ID',
  inputSchema: z.object({
    id: z.string().uuid().describe('UUID du projet'),
  }),
};

// Tool: delete_project
export const DeleteProjectToolSchema = {
  name: 'delete_project',
  description: 'Supprimer un projet (les audits associés sont conservés avec project_id = NULL)',
  inputSchema: z.object({
    id: z.string().uuid().describe('UUID du projet à supprimer'),
  }),
};

// Ajouter au tableau TOOL_NAMES
export const TOOL_NAMES = [
  'search_knowledge',
  'get_resource',
  'list_resources',
  'validate_resource',
  'inspect_site',
  'audit_history',
  'audit_report',
  'create_project',    // NOUVEAU
  'list_projects',     // NOUVEAU
  'get_project',       // NOUVEAU
  'delete_project',    // NOUVEAU
] as const;
```

**Vérification :**
```bash
npm run typecheck
```

---

### Tâche 3.2 — Implémentation des 4 outils MCP

**Objectif :** Implémenter la logique des outils  
**Durée :** 4h  
**Fichiers :** `src/mcp/tools/create-project.ts`, `list-projects.ts`, `get-project.ts`, `delete-project.ts`

**Actions :**

```typescript
// src/mcp/tools/create-project.ts
import { CreateProjectToolSchema } from '../schemas/tool-schemas.js';
import type { McpToolContext } from '../context.js';
import { ProjectManager } from '../../business/project-manager.js';
import { ProjectRepository } from '../../data/repositories/project-repository.js';

export async function createProjectTool(
  input: z.infer<typeof CreateProjectToolSchema.inputSchema>,
  context: McpToolContext
) {
  const repo = new ProjectRepository(context.db.connection);
  const manager = new ProjectManager(repo);

  try {
    const project = await manager.createProject(input);
    return {
      content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Erreur: ${error instanceof Error ? error.message : error}` }],
    };
  }
}
```

```typescript
// src/mcp/tools/list-projects.ts
export async function listProjectsTool(
  input: z.infer<typeof ListProjectsToolSchema.inputSchema>,
  context: McpToolContext
) {
  const repo = new ProjectRepository(context.db.connection);
  const manager = new ProjectManager(repo);

  try {
    const projects = await manager.listProjects(input);
    return {
      content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Erreur: ${error instanceof Error ? error.message : error}` }],
    };
  }
}
```

```typescript
// src/mcp/tools/get-project.ts
export async function getProjectTool(
  input: z.infer<typeof GetProjectToolSchema.inputSchema>,
  context: McpToolContext
) {
  const repo = new ProjectRepository(context.db.connection);
  const manager = new ProjectManager(repo);

  try {
    const project = await manager.getProject(input.id);
    if (!project) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Projet ${input.id} introuvable` }],
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Erreur: ${error instanceof Error ? error.message : error}` }],
    };
  }
}
```

```typescript
// src/mcp/tools/delete-project.ts
export async function deleteProjectTool(
  input: z.infer<typeof DeleteProjectToolSchema.inputSchema>,
  context: McpToolContext
) {
  const repo = new ProjectRepository(context.db.connection);
  const manager = new ProjectManager(repo);

  try {
    const deleted = await manager.deleteProject(input.id);
    if (!deleted) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Projet ${input.id} introuvable` }],
      };
    }
    return {
      content: [{ type: 'text', text: `Projet ${input.id} supprimé (audits associés conservés)` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Erreur: ${error instanceof Error ? error.message : error}` }],
    };
  }
}
```

**Enregistrer dans `src/mcp/handlers/tools.ts` :**

```typescript
// Ajouter dans src/mcp/handlers/tools.ts
import { createProjectTool } from '../tools/create-project.js';
import { listProjectsTool } from '../tools/list-projects.js';
import { getProjectTool } from '../tools/get-project.js';
import { deleteProjectTool } from '../tools/delete-project.js';

// Dans registerTools()
server.tool(
  CreateProjectToolSchema.name,
  CreateProjectToolSchema.description,
  CreateProjectToolSchema.inputSchema.shape,
  async (input) => createProjectTool(input, context)
);

server.tool(
  ListProjectsToolSchema.name,
  ListProjectsToolSchema.description,
  ListProjectsToolSchema.inputSchema.shape,
  async (input) => listProjectsTool(input, context)
);

server.tool(
  GetProjectToolSchema.name,
  GetProjectToolSchema.description,
  GetProjectToolSchema.inputSchema.shape,
  async (input) => getProjectTool(input, context)
);

server.tool(
  DeleteProjectToolSchema.name,
  DeleteProjectToolSchema.description,
  DeleteProjectToolSchema.inputSchema.shape,
  async (input) => deleteProjectTool(input, context)
);
```

**Vérification :**
```bash
npm run build
# Tester avec un client MCP (Claude Code, Cursor)
```

---

### Tâche 3.3 — Tests MCP

**Objectif :** Couverture > 80%  
**Durée :** 3h  
**Fichiers :** `tests/mcp/tools/create-project.test.ts`, `list-projects.test.ts`, `get-project.test.ts`, `delete-project.test.ts`

**Cas de test :**

1. **create_project :**
   - Création valide → retourne le projet créé
   - Nom vide → erreur Zod
   - Nom trop long (> 200) → erreur Zod
   - Statut invalide → erreur Zod

2. **list_projects :**
   - Sans filtre → retourne tous les projets
   - Avec filtre status → retourne uniquement les projets du statut demandé
   - Avec limit → respecte la limite
   - Avec offset → respecte le décalage

3. **get_project :**
   - ID valide existant → retourne le projet
   - ID inexistant → isError: true
   - ID invalide (pas UUID) → erreur Zod

4. **delete_project :**
   - ID valide existant → supprime et retourne message succès
   - ID inexistant → isError: true
   - Suppression → les audits associés ont project_id = NULL

**Vérification :**
```bash
npm test -- tests/mcp/tools/
npm run coverage
```

---

### Tâche 3.4 — Documentation CLI.md

**Objectif :** Documenter les nouvelles commandes  
**Durée :** 2h  
**Fichiers :** `docs/CLI.md` (modification)

**Sections à ajouter :**

```markdown
## ekts project

Gérer les projets EKTS.

### ekts project create <name>

Créer un nouveau projet.

**Options :**
- `-d, --description <text>` : Description du projet
- `-s, --status <status>` : Statut initial (active|completed|archived, défaut : active)
- `--json` : Sortie au format JSON

**Exemple :**
```bash
ekts project create "Mon Site Web" --description "Audit du site example.com"
```

### ekts project list

Lister les projets.

**Options :**
- `-s, --status <status>` : Filtrer par statut
- `--limit <n>` : Nombre maximum de résultats (défaut : 50)
- `--json` : Sortie au format JSON

**Exemple :**
```bash
ekts project list --status active
```

### ekts project show <id>

Afficher les détails d'un projet.

**Options :**
- `--json` : Sortie au format JSON

**Exemple :**
```bash
ekts project show 550e8400-e29b-41d4-a716-446655440000
```

**Codes de sortie :**
- 0 : Projet trouvé
- 2 : Projet non trouvé

### ekts project delete <id>

Supprimer un projet. Les audits associés ne sont pas supprimés (leur `project_id` devient NULL).

**Options :**
- `-f, --force` : Supprimer sans confirmation

**Exemple :**
```bash
ekts project delete 550e8400-e29b-41d4-a716-446655440000 --force
```

### Filtre --project

Toutes les commandes suivantes supportent l'option `--project <id>` pour filtrer par projet :

- `ekts audit list --project <id>`
- `ekts audit show --project <id>`
- `ekts search <query> --project <id>`
- `ekts list --project <id>`

**Exemple :**
```bash
ekts audit list --project 550e8400-e29b-41d4-a716-446655440000
```
```

---

### Tâche 3.5 — Documentation MCP.md

**Objectif :** Documenter les nouveaux outils  
**Durée :** 2h  
**Fichiers :** `docs/MCP.md` (modification)

**Sections à ajouter :**

```markdown
## Outils MCP

EKTS expose 11 outils via le protocole MCP (Model Context Protocol).

### Outils de connaissance (4)

- `search_knowledge` : Recherche hybride (FTS + Vector + RRF)
- `get_resource` : Obtenir une ressource par ID
- `list_resources` : Lister les ressources
- `validate_resource` : Valider le schéma d'une ressource

### Outils d'inspection (3)

- `inspect_site` : Inspecter un site web (L1-L3)
- `audit_history` : Historique des audits
- `audit_report` : Générer un rapport d'audit

### Outils de projet (4) — NOUVEAU Sprint 13

- `create_project` : Créer un nouveau projet
- `list_projects` : Lister les projets
- `get_project` : Obtenir un projet par ID
- `delete_project` : Supprimer un projet

### Exemples d'utilisation

#### create_project

```json
{
  "name": "create_project",
  "arguments": {
    "name": "Mon Site Web",
    "description": "Audit du site example.com",
    "status": "active"
  }
}
```

#### list_projects

```json
{
  "name": "list_projects",
  "arguments": {
    "status": "active",
    "limit": 50
  }
}
```

#### get_project

```json
{
  "name": "get_project",
  "arguments": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### delete_project

```json
{
  "name": "delete_project",
  "arguments": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```
```

---

### Tâche 3.6 — Documentation API_REFERENCE.md

**Objectif :** Mettre à jour la référence API  
**Durée :** 1h  
**Fichiers :** `docs/API_REFERENCE.md` (modification)

**Sections à ajouter :**

```markdown
## Projets

### Modèle Project

```typescript
interface Project {
  id: string;              // UUID
  name: string;            // Nom du projet (1-200 caractères)
  description?: string;    // Description (max 2000 caractères)
  status: 'active' | 'completed' | 'archived';
  startedAt?: string;      // ISO 8601
  completedAt?: string;    // ISO 8601
  metadata: Record<string, unknown>;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Endpoints CLI

| Commande | Description |
|----------|-------------|
| `ekts project create <name>` | Créer un projet |
| `ekts project list` | Lister les projets |
| `ekts project show <id>` | Afficher un projet |
| `ekts project delete <id>` | Supprimer un projet |

### Outils MCP

| Outil | Description |
|-------|-------------|
| `create_project` | Créer un projet |
| `list_projects` | Lister les projets |
| `get_project` | Obtenir un projet |
| `delete_project` | Supprimer un projet |
```

---

### Tâche 3.7 — Guide PROJECTS.md

**Objectif :** Guide utilisateur pour le multi-projets  
**Durée :** 2h  
**Fichiers :** `docs/guides/PROJECTS.md` (nouveau)

**Contenu :**

```markdown
# Guide Multi-Projets — EKTS

Ce guide explique comment utiliser la fonctionnalité multi-projets d'EKTS.

## Qu'est-ce qu'un projet ?

Un projet est une unité d'organisation qui regroupe des audits, des ressources et des bonnes pratiques. Il permet de :

- Séparer les audits de différents sites web
- Suivre l'évolution d'un projet dans le temps
- Capitaliser sur les bonnes pratiques d'un projet spécifique

## Créer un projet

### Via CLI

```bash
ekts project create "Mon Site Web" \
  --description "Audit du site example.com" \
  --status active
```

### Via MCP

```json
{
  "name": "create_project",
  "arguments": {
    "name": "Mon Site Web",
    "description": "Audit du site example.com",
    "status": "active"
  }
}
```

## Lister les projets

```bash
# Tous les projets
ekts project list

# Uniquement les projets actifs
ekts project list --status active

# Au format JSON
ekts project list --json
```

## Inspecter un site dans un projet

```bash
# Créer d'abord le projet
ekts project create "example.com"

# Inspecter le site (l'audit sera automatiquement associé au projet)
ekts inspect https://example.com --project <project-id>

# Lister les audits du projet
ekts audit list --project <project-id>
```

## Supprimer un projet

```bash
ekts project delete <project-id> --force
```

**Note :** Les audits associés au projet ne sont pas supprimés. Leur `project_id` devient NULL.

## Statuts des projets

- `active` : Projet en cours (défaut)
- `completed` : Projet terminé
- `archived` : Projet archivé

## Bonnes pratiques

1. **Créer un projet par site web** : Chaque site web inspecté devrait avoir son propre projet
2. **Utiliser des descriptions claires** : La description aide à identifier le projet
3. **Archiver les projets terminés** : Changez le statut en `archived` pour les projets qui ne sont plus actifs
4. **Utiliser le filtre --project** : Pour isoler les résultats d'un projet spécifique
```

---

### Tâche 3.8 — Vérifications finales

**Objectif :** S'assurer que tout fonctionne  
**Durée :** 2h

**Actions :**

```bash
# Vérification complète
npm run verify

# Doit retourner code 0 avec :
# - typecheck OK
# - lint OK
# - format:check OK
# - build OK
# - coverage > 80%

# Vérifier la CI
# Pousser la branche et vérifier que les 7 jobs sont verts

# Vérifier manuellement
ekts project create "Test"
ekts project list
ekts project show <id>
ekts audit list --project <id>
```

---

## 4. Résultats attendus

- ✅ 4 outils MCP fonctionnels
- ✅ Tests MCP > 80% couverture
- ✅ Documentation CLI.md mise à jour
- ✅ Documentation MCP.md mise à jour
- ✅ Documentation API_REFERENCE.md mise à jour
- ✅ Guide PROJECTS.md créé
- ✅ `npm run verify` code 0
- ✅ CI verte (7/7 jobs)

---

## 5. Critères d'acceptation

- C13.3.1 : 4 outils MCP fonctionnent via stdio
- C13.3.2 : Schémas Zod validés (entrées/sorties)
- C13.3.3 : Tests MCP > 80% couverture
- C13.3.4 : Documentation CLI.md mise à jour
- C13.3.5 : Documentation MCP.md mise à jour (11 outils total)
- C13.3.6 : `npm run verify` code 0
- C13.3.7 : CI verte (7/7 jobs)
- C13.3.8 : Couverture globale > 80%

---

## 6. Procédure de compte rendu

À la fin du sous-sprint, documenter :
1. Fichiers créés/modifiés
2. Tests exécutés et résultats
3. Couverture mesurée
4. Documentation mise à jour
5. Écarts constatés
6. Commandes pour vérifier le travail

---

## 7. Clôture du Sprint 13

Après ce sous-sprint, le Sprint 13 est terminé. Produire le rapport final :

**Fichier :** `SPRINT-13-RESULTAT.md`

**Contenu :**
- Liste des fichiers créés/modifiés
- Résultats des tests
- Couverture finale
- Documentation mise à jour
- Écarts constatés
- Commandes pour vérifier
- Statut final (VALIDÉ ou BLOQUÉ)

**Ensuite :**
- Pousser la branche
- Attendre le feu vert pour le Sprint 14

---

**Document rédigé le 25 octobre 2026 — Sprint 13-3**  
**Statut : ⏳ Prêt pour implémentation**
