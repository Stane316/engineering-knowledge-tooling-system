# Sprint 13-2 — CLI `ekts project` + filtre `--project`

**Identifiant :** SPRINT-13-02  
**Parent :** SPRINT-13 (Gestion Multi-Projets)  
**Durée prévue :** 3 jours  
**Date de documentation :** 25 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif précis

**Implémenter l'interface CLI pour la gestion des projets et le filtrage par projet.**

- Commande `ekts project create <name> [--description] [--status]`
- Commande `ekts project list [--status <status>] [--json]`
- Commande `ekts project show <id> [--json]`
- Commande `ekts project delete <id> [--force]`
- Option `--project <id>` sur `ekts audit list|show`, `ekts search`, `ekts list`

**Résultat concret attendu :**
- 4 sous-commandes fonctionnelles
- Filtre `--project` opérationnel
- Codes de sortie 0/1/2 cohérents
- Sortie `--json` valide
- Couverture tests > 80%

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Sprint 13-1 terminé | ProjectRepository + ProjectManager existent | Exécuter 13-1 d'abord |
| Node.js 22+ | `node --version` | Installer Node.js 22 LTS |
| npm 10+ | `npm --version` | Installer npm 10+ |
| Git | `git --version` | Installer Git |
| `npm run verify` code 0 | `npm run verify` | Corriger erreurs avant de commencer |

---

## 3. Tâches atomiques

### Tâche 2.1 — Commande `ekts project create`

**Objectif :** Créer un nouveau projet via CLI  
**Durée :** 2h  
**Fichiers :** `src/cli/commands/project.ts` (nouveau)

**Actions :**

```typescript
// src/cli/commands/project.ts
import { Command } from 'commander';
import { ProjectManager } from '../../business/project-manager.js';
import { ProjectRepository } from '../../data/repositories/project-repository.js';
import { openDatabase } from '../../data/database.js';
import { outputResult } from '../output.js';
import { exitCodeFor } from '../runtime.js';

export function registerProjectCommands(program: Command): void {
  const project = program
    .command('project')
    .description('Gérer les projets EKTS');

  project
    .command('create <name>')
    .description('Créer un nouveau projet')
    .option('-d, --description <text>', 'Description du projet')
    .option('-s, --status <status>', 'Statut (active|completed|archived)', 'active')
    .option('--json', 'Sortie JSON')
    .action(async (name: string, options: any) => {
      try {
        const db = openDatabase();
        const repo = new ProjectRepository(db.connection);
        const manager = new ProjectManager(repo);

        const project = await manager.createProject({
          name,
          description: options.description,
          status: options.status,
        });

        outputResult(project, options.json);
        process.exitCode = 0;
      } catch (error) {
        console.error('Erreur :', error instanceof Error ? error.message : error);
        process.exitCode = exitCodeFor(error);
      }
    });
  // ... autres sous-commandes
}
```

**Vérification :**
```bash
npm run build
node dist/cli/index.js project create "Mon Projet" --description "Test"
```

**Critère d'acceptation :**
- C13.2.1 : `ekts project create` crée un projet et affiche l'ID

---

### Tâche 2.2 — Commande `ekts project list`

**Objectif :** Lister les projets  
**Durée :** 1h  
**Fichiers :** `src/cli/commands/project.ts` (ajout)

**Actions :**

```typescript
project
  .command('list')
  .description('Lister les projets')
  .option('-s, --status <status>', 'Filtrer par statut')
  .option('--limit <n>', 'Nombre maximum', '50')
  .option('--json', 'Sortie JSON')
  .action(async (options: any) => {
    try {
      const db = openDatabase();
      const repo = new ProjectRepository(db.connection);
      const manager = new ProjectManager(repo);

      const projects = await manager.listProjects({
        status: options.status,
        limit: parseInt(options.limit),
      });

      outputResult(projects, options.json);
      process.exitCode = 0;
    } catch (error) {
      console.error('Erreur :', error instanceof Error ? error.message : error);
      process.exitCode = exitCodeFor(error);
    }
  });
```

**Vérification :**
```bash
node dist/cli/index.js project list
node dist/cli/index.js project list --status active
node dist/cli/index.js project list --json
```

**Critère d'acceptation :**
- C13.2.2 : `ekts project list` liste tous les projets (filtrable par statut)

---

### Tâche 2.3 — Commande `ekts project show`

**Objectif :** Afficher les détails d'un projet  
**Durée :** 1h  
**Fichiers :** `src/cli/commands/project.ts` (ajout)

**Actions :**

```typescript
project
  .command('show <id>')
  .description('Afficher les détails d\'un projet')
  .option('--json', 'Sortie JSON')
  .action(async (id: string, options: any) => {
    try {
      const db = openDatabase();
      const repo = new ProjectRepository(db.connection);
      const manager = new ProjectManager(repo);

      const proj = await manager.getProject(id);
      if (!proj) {
        console.error(`Projet ${id} introuvable`);
        process.exitCode = 2; // Non trouvé
        return;
      }

      outputResult(proj, options.json);
      process.exitCode = 0;
    } catch (error) {
      console.error('Erreur :', error instanceof Error ? error.message : error);
      process.exitCode = exitCodeFor(error);
    }
  });
```

**Vérification :**
```bash
node dist/cli/index.js project show <uuid>
node dist/cli/index.js project show nonexistent  # Doit retourner code 2
```

**Critère d'acceptation :**
- C13.2.3 : `ekts project show <id>` affiche les détails d'un projet
- Code 0 si trouvé, code 2 si non trouvé

---

### Tâche 2.4 — Commande `ekts project delete`

**Objectif :** Supprimer un projet  
**Durée :** 1h  
**Fichiers :** `src/cli/commands/project.ts` (ajout)

**Actions :**

```typescript
project
  .command('delete <id>')
  .description('Supprimer un projet (les audits associés ne sont pas supprimés)')
  .option('-f, --force', 'Supprimer sans confirmation')
  .action(async (id: string, options: any) => {
    try {
      if (!options.force) {
        console.log(`Êtes-vous sûr de vouloir supprimer le projet ${id} ? (utilisez --force pour confirmer)`);
        process.exitCode = 1;
        return;
      }

      const db = openDatabase();
      const repo = new ProjectRepository(db.connection);
      const manager = new ProjectManager(repo);

      const deleted = await manager.deleteProject(id);
      if (!deleted) {
        console.error(`Projet ${id} introuvable`);
        process.exitCode = 2;
        return;
      }

      console.log(`Projet ${id} supprimé (audits associés conservés avec project_id = NULL)`);
      process.exitCode = 0;
    } catch (error) {
      console.error('Erreur :', error instanceof Error ? error.message : error);
      process.exitCode = exitCodeFor(error);
    }
  });
```

**Vérification :**
```bash
node dist/cli/index.js project delete <uuid>  # Demande confirmation
node dist/cli/index.js project delete <uuid> --force  # Supprime
```

**Critère d'acceptation :**
- C13.2.4 : `ekts project delete <id>` supprime un projet (confirmation requise)
- Les audits associés sont conservés (project_id = NULL)

---

### Tâche 2.5 — Filtre `--project` sur commandes existantes

**Objectif :** Permettre le filtrage par projet  
**Durée :** 3h  
**Fichiers :** `src/cli/commands/audit.ts`, `src/cli/commands/search.ts`, `src/cli/commands/list.ts`

**Modifications :**

**audit.ts :**
```typescript
// Ajouter option --project à audit list et audit show
auditListCommand.option('-p, --project <id>', 'Filtrer par projet');
auditShowCommand.option('-p, --project <id>', 'Filtrer par projet');

// Dans l'action, passer le filtre au repository
const audits = await repo.list({
  projectId: options.project,
  // ... autres filtres
});
```

**search.ts :**
```typescript
searchCommand.option('-p, --project <id>', 'Filtrer par projet');

// Dans l'action, passer le filtre au moteur de recherche
const results = await searchEngine.search(query, {
  projectId: options.project,
  // ... autres options
});
```

**list.ts :**
```typescript
listCommand.option('-p, --project <id>', 'Filtrer par projet');

// Dans l'action, passer le filtre
const resources = await manager.listResources({
  projectId: options.project,
  // ... autres filtres
});
```

**Modifications du stockage :**
- `src/storage/audit-repository.ts` : ajouter filtre `projectId` dans `list()`
- `src/business/search-engine.ts` : ajouter filtre `projectId` dans `search()`

**Vérification :**
```bash
node dist/cli/index.js audit list --project <uuid>
node dist/cli/index.js search "test" --project <uuid>
node dist/cli/index.js list --project <uuid>
```

**Critère d'acceptation :**
- C13.2.5 : `--project <id>` filtre les audits listés
- C13.2.6 : `--project <id>` filtre les résultats de recherche

---

### Tâche 2.6 — Tests intégration CLI

**Objectif :** Couverture > 80%  
**Durée :** 2h  
**Fichiers :** `tests/cli/project.test.ts`

**Cas de test :**
1. `ekts project create "Test"` → code 0, affiche ID
2. `ekts project list` → code 0, liste projets
3. `ekts project list --status active` → filtre correct
4. `ekts project show <id>` → code 0, affiche détails
5. `ekts project show nonexistent` → code 2
6. `ekts project delete <id>` → demande confirmation
7. `ekts project delete <id> --force` → supprime
8. `ekts audit list --project <id>` → filtre correct
9. `ekts search "test" --project <id>` → filtre correct

**Vérification :**
```bash
npm test -- tests/cli/project.test.ts
npm run coverage
```

---

### Tâche 2.7 — Enregistrement dans program.ts

**Objectif :** Brancher les commandes au programme CLI  
**Durée :** 30min  
**Fichiers :** `src/cli/program.ts` (modification)

**Actions :**

```typescript
// Ajouter dans src/cli/program.ts
import { registerProjectCommands } from './commands/project.js';

// Dans la fonction d'initialisation
registerProjectCommands(program);
```

---

## 4. Résultats attendus

- ✅ 4 sous-commandes `ekts project` fonctionnelles
- ✅ Filtre `--project` sur 5 commandes existantes
- ✅ Codes de sortie 0/1/2 cohérents
- ✅ Sortie `--json` valide
- ✅ Tests > 80% couverture
- ✅ `npm run verify` passe

---

## 5. Critères d'acceptation

- C13.2.1 : `ekts project create` crée un projet et affiche l'ID
- C13.2.2 : `ekts project list` liste tous les projets (filtrable par statut)
- C13.2.3 : `ekts project show <id>` affiche les détails d'un projet
- C13.2.4 : `ekts project delete <id>` supprime un projet (confirmation requise)
- C13.2.5 : `--project <id>` filtre les audits listés
- C13.2.6 : `--project <id>` filtre les résultats de recherche
- C13.2.7 : Codes de sortie cohérents (0 succès, 1 erreur, 2 non trouvé)
- C13.2.8 : Sortie `--json` valide pour toutes les commandes

---

## 6. Procédure de compte rendu

À la fin du sous-sprint, documenter :
1. Fichiers créés/modifiés
2. Tests exécutés et résultats
3. Couverture mesurée
4. Écarts constatés
5. Commandes pour vérifier le travail

---

**Document rédigé le 25 octobre 2026 — Sprint 13-2**  
**Statut : ⏳ Prêt pour implémentation**
