# Sprint 5 — CLI (Semaine 9-10)

**Statut :** ✅ LIVRÉ (22 octobre 2026)  
**Durée :** 2 semaines (10 jours ouvrables)  
**Objectif :** Implémenter l'interface CLI (Commander.js) avec 7 commandes  
**MVP :** MVP-1 (Knowledge Management Tool)

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Périmètre du sprint](#2-périmètre-du-sprint)
3. [État initial et prérequis](#3-état-initial-et-prérequis)
4. [Décomposition en sous-sprints](#4-décomposition-en-sous-sprints)
5. [Choix techniques et références](#5-choix-techniques-et-références)
6. [Organisation des fichiers](#6-organisation-des-fichiers)
7. [Tests et validation](#7-tests-et-validation)
8. [Critères d'acceptation du sprint](#8-critères-dacceptation-du-sprint)
9. [Livrables attendus](#9-livrables-attendus)
10. [Procédure de fin de sprint](#10-procédure-de-fin-de-sprint)
11. [Prompt de lancement pour agent](#11-prompt-de-lancement-pour-agent)
12. [Résumé](#12-résumé)

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le **Sprint 4 (Search Engine)** a mis en place :
- ✅ Recherche hybride (FTS + Vector + RRF)
- ✅ Benchmarks validés (Recall@5 ≥ 0.75, Faithfulness ≥ 0.80)
- ✅ Tests > 80% couverture
- ✅ Documentation API

Le **Sprint 5 (CLI)** va :
- 🎯 Implémenter l'interface en ligne de commande avec Commander.js
- 🎯 Créer 7 commandes utilisateur (init, add, search, get, list, delete, status)
- 🎯 Formater les sorties (JSON + humain)
- 🎯 Tester l'intégration complète
- 🎯 Documenter l'usage CLI

### 1.2 Objectifs du Sprint 5

**Objectif principal :** Fournir une interface CLI complète et intuitive qui expose toutes les capacités du système aux utilisateurs et aux scripts.

**Objectifs secondaires :**
- 🎯 Interface utilisateur intuitive et bien documentée
- 🎯 Sorties formatées (JSON pour scripts, humain pour terminal)
- 🎯 Gestion robuste des erreurs (codes de sortie appropriés)
- 🎯 Tests d'intégration complets
- 🎯 Documentation CLI détaillée

### 1.3 Pourquoi ce sprint est critique

La CLI est le **point d'entrée principal** pour les utilisateurs. C'est elle qui :
- Rend le système utilisable par les développeurs
- Permet l'automatisation via scripts
- Teste l'intégration complète du système
- Prépare le terrain pour le MCP Server (Sprint 6)

**Si la CLI échoue, les utilisateurs ne peuvent pas utiliser le système.**

---

## 2. Périmètre du sprint

### 2.1 Ce qui est inclus

| # | Composant | Description | Commande |
|---|-----------|-------------|----------|
| 1 | Initialisation | Créer les 3 bases SQLite | `ekts init` |
| 2 | Ajout ressource | Ajouter une ressource avec indexation | `ekts add` |
| 3 | Recherche hybride | Recherche FTS + Vector + RRF | `ekts search` |
| 4 | Obtention ressource | Obtenir une ressource par ID | `ekts get` |
| 5 | Liste ressources | Lister avec filtres | `ekts list` |
| 6 | Suppression ressource | Supprimer une ressource | `ekts delete` |
| 7 | Statut système | Afficher état du système | `ekts status` |
| 8 | Tests d'intégration | Tester toutes les commandes | `tests/cli/` |
| 9 | Documentation CLI | Manuel d'utilisation | `docs/CLI.md` |

### 2.2 Ce qui est exclu

| Exclu | Raison | Reporté à |
|-------|--------|-----------|
| ❌ MCP Server | Exposition aux agents IA | Sprint 6 |
| ❌ Inspection navigateur | Playwright | MVP-2 (Sprint 7+) |
| ❌ Capitalisation projet | Workflow complet | MVP-3 (Sprint 13+) |
| ❌ Interface graphique | Web UI | Pas prévu |
| ❌ Configuration avancée | Fichiers config | Optionnel |

### 2.3 Dépendances

**Ce que le Sprint 5 utilise depuis les Sprints précédents :**
- ✅ Data Layer (3 bases SQLite) — Sprint 2
- ✅ Knowledge Manager (CRUD + FTS + Vector) — Sprint 3
- ✅ Search Engine (recherche hybride) — Sprint 4
- ✅ Tous les services métier

**Ce que le Sprint 5 prépare pour le Sprint 6 :**
- 🎯 Interface utilisateur validée
- 🎯 Intégration complète testée
- 🎯 Documentation utilisateur

---

## 3. État initial et prérequis

### 3.1 État initial (fin Sprint 4)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── business/
│   │   ├── knowledge-manager.ts        ✅ (5 méthodes CRUD + 3 indexers)
│   │   ├── search-engine.ts            ✅ (recherche hybride)
│   │   ├── embeddings.ts               ✅ (OpenAI)
│   │   ├── vector-indexer.ts           ✅ (indexation vectorielle)
│   │   ├── indexer.ts                  ✅ (indexation FTS)
│   │   └── rrf.ts                      ✅ (fusion RRF)
│   ├── data/
│   │   ├── database.ts                 ✅ (ekts.db)
│   │   ├── fts.ts                      ✅ (ekts-fts.db)
│   │   ├── vectors.ts                  ✅ (ekts-vectors.db)
│   │   ├── resource-repository.ts      ✅ (CRUD)
│   │   ├── fts-repository.ts           ✅ (search BM25)
│   │   └── vector-repository.ts        ✅ (search cosine)
│   ├── schemas/
│   │   └── resource.ts                 ✅ (Zod)
│   ├── types/
│   │   └── resource.ts                 ✅ (Resource, SearchOptions)
│   └── utils/
│       └── errors.ts                   ✅ (erreurs personnalisées)
├── tests/
│   ├── business/
│   │   ├── knowledge-manager.test.ts   ✅ (> 80%)
│   │   ├── search-engine.test.ts       ✅ (> 80%)
│   │   └── ...
│   └── benchmark/
│       └── search-benchmark.ts         ✅ (Recall@5 ≥ 0.75)
├── docs/
│   ├── DATA_LAYER.md                   ✅
│   ├── KNOWLEDGE_MANAGER.md            ✅
│   └── SEARCH_ENGINE.md                ✅
└── package.json                        ✅ (commandes npm)
```

### 3.2 Prérequis obligatoires

**Avant de commencer Sprint 5, vérifier :**

```bash
# 1. Sprint 4 terminé avec succès
ls -la src/business/search-engine.ts
ls -la src/business/knowledge-manager.ts
# ✅ Fichiers existent

# 2. Tests Sprint 4
npm test
# ✅ Tests passent

# 3. Benchmarks validés
npm test tests/benchmark/search-benchmark.ts
# ✅ Recall@5 ≥ 0.75

# 4. 3 bases SQLite créées
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent

# 5. Compilation TypeScript
npm run build
# ✅ Aucune erreur
```

### 3.3 Prérequis compétences

**L'agent de développement doit maîtriser :**
- ✅ TypeScript intermédiaire
- 🟡 Commander.js (bases) — peut apprendre
- ✅ CLI design (bonnes pratiques)
- ✅ Tests d'intégration
- 🟡 Formatage sorties (JSON, tableaux, couleurs)

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif | Commandes |
|-------------|-------|----------|-----------|
| **Sprint 5-1** | 3 jours | Commandes de base | init, add, get |
| **Sprint 5-2** | 4 jours | Commandes de recherche et gestion | search, list, delete |
| **Sprint 5-3** | 3 jours | Statut + tests intégration + documentation | status + tests + docs |

### 4.2 Sprint 5-1 — Commandes de base (init, add, get)

**Durée :** 3 jours  
**Objectif :** Implémenter les 3 premières commandes CLI

**Commandes :**
- ✅ `ekts init` — Initialiser les 3 bases SQLite
- ✅ `ekts add` — Ajouter une ressource (avec indexation)
- ✅ `ekts get` — Obtenir une ressource par ID

**Détail :** Voir document `SPRINT-05-01.md`

**Critères de validation :**
- ✅ Les 3 commandes fonctionnent
- ✅ Sorties formatées (JSON + humain)
- ✅ Gestion erreurs (codes de sortie)
- ✅ Tests unitaires > 80%

### 4.3 Sprint 5-2 — Commandes de recherche et gestion (search, list, delete)

**Durée :** 4 jours  
**Objectif :** Implémenter les 3 commandes principales

**Commandes :**
- ✅ `ekts search` — Recherche hybride (FTS + Vector + RRF)
- ✅ `ekts list` — Lister ressources avec filtres
- ✅ `ekts delete` — Supprimer une ressource

**Détail :** Voir document `SPRINT-05-02.md`

**Critères de validation :**
- ✅ Les 3 commandes fonctionnent
- ✅ Recherche hybride avec options (mode, limit, type, tags)
- ✅ Liste avec filtres (type, tags, limit)
- ✅ Suppression avec confirmation
- ✅ Tests unitaires > 80%

### 4.4 Sprint 5-3 — Statut + tests intégration + documentation

**Durée :** 3 jours  
**Objectif :** Commande status, tests d'intégration complets et documentation

**Tâches :**
- ✅ `ekts status` — Afficher statut système
- ✅ Tests d'intégration complets (toutes les commandes)
- ✅ Documentation CLI complète

**Détail :** Voir document `SPRINT-05-03.md`

**Critères de validation :**
- ✅ Commande status fonctionne
- ✅ Tests d'intégration passent
- ✅ Documentation complète avec exemples
- ✅ Commande `ekts --help` fonctionne
- ✅ Code de sortie approprié (0 = succès, 1 = erreur)

---

## 5. Choix techniques et références

### 5.1 Framework CLI

**Décision :** Utiliser Commander.js v12+ pour l'interface CLI.

**Référence :** ADR-003 (Commander.js)

**Pourquoi Commander.js ?**
- ✅ Mature et stable (10+ ans)
- ✅ API intuitive et bien documentée
- ✅ Support TypeScript natif
- ✅ Large adoption (npm weekly: ~15M)
- ✅ Génération automatique de --help

**Alternatives considérées :**
- ❌ Yargs : plus complexe, API moins intuitive
- ❌ Oclif (Salesforce) : overkill pour ce projet
- ✅ Commander.js : simple, efficace, bien documenté

### 5.2 Structure CLI

**Décision :** Organiser la CLI en modules séparés par commande.

**Pattern :**
```typescript
// src/cli/index.ts
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
// ... autres commandes

const program = new Command();

program
  .name('ekts')
  .description('Engineering Knowledge Tooling System')
  .version('1.0.0');

// Ajouter les commandes
initCommand(program);
addCommand(program);
// ... autres commandes

program.parse();
```

**Avantages :**
- ✅ Modularité (1 fichier par commande)
- ✅ Testabilité (chaque commande testable séparément)
- ✅ Maintainabilité (facile d'ajouter des commandes)

### 5.3 Formatage des sorties

**Décision :** Supporter 2 modes de sortie (JSON + humain).

**Implémentation :**
```typescript
// Option globale --json
program.option('--json', 'Output in JSON format');

// Dans chaque commande
if (program.opts().json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  // Formatage humain (tableaux, couleurs)
  console.log(formatHuman(result));
}
```

**Avantages :**
- ✅ Scripts peuvent parser JSON facilement
- ✅ Utilisateurs voient un format lisible
- ✅ Compatible avec jq, grep, etc.

### 5.4 Gestion des erreurs

**Décision :** Utiliser des codes de sortie appropriés.

**Codes de sortie :**
- `0` — Succès
- `1` — Erreur générale
- `2` — Erreur d'arguments invalides
- `3` — Ressource non trouvée
- `4` — Erreur de validation

**Implémentation :**
```typescript
try {
  // Commande
  process.exit(0);
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    console.error(`Error: ${error.message}`);
    process.exit(3);
  }
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
```

### 5.5 Couleurs et formatage

**Décision :** Utiliser `chalk` pour les couleurs terminal.

**Implémentation :**
```typescript
import chalk from 'chalk';

console.log(chalk.green('✓ Resource created successfully'));
console.log(chalk.red('✗ Error: Resource not found'));
console.log(chalk.yellow('⚠ Warning: Deprecated option'));
```

**Alternatives considérées :**
- ❌ Pas de couleurs : moins lisible
- ❌ Colors.js : moins maintenu
- ✅ Chalk : populaire, bien maintenu

### 5.6 Tableaux et formatage humain

**Décision :** Utiliser `cli-table3` pour les tableaux.

**Implémentation :**
```typescript
import Table from 'cli-table3';

const table = new Table({
  head: ['ID', 'Type', 'Title', 'Tags'],
});

resources.forEach(r => {
  table.push([r.id, r.type, r.title, r.tags.join(', ')]);
});

console.log(table.toString());
```

### 5.7 Configuration

**Décision :** Utiliser les variables d'environnement + fichier `.env`.

**Configuration CLI :**
```bash
# Variables d'environnement
EKTS_DB_PATH=./data          # Chemin des bases SQLite
EKTS_JSON=false              # Mode JSON par défaut
EKTS_COLORS=true             # Couleurs activées
```

### 5.8 Tests d'intégration

**Décision :** Tester chaque commande avec des scenarios réels.

**Stratégie :**
- ✅ Tester chaque commande séparément
- ✅ Tester les cas nominaux et d'erreur
- ✅ Tester les options (flags, arguments)
- ✅ Tester les formats de sortie (JSON + humain)
- ✅ Utiliser `child_process.execSync` pour exécuter les commandes

**Exemple :**
```typescript
import { execSync } from 'child_process';

describe('CLI integration', () => {
  it('should init database', () => {
    const output = execSync('node dist/cli/index.js init').toString();
    expect(output).toContain('Database initialized');
  });

  it('should add a resource', () => {
    const output = execSync(
      'node dist/cli/index.js add --type article --title "Test"'
    ).toString();
    expect(output).toContain('Resource created');
  });
});
```

---

## 6. Organisation des fichiers

### 6.1 Structure après Sprint 5

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── cli/
│   │   ├── index.ts                    🆕 (point d'entrée CLI)
│   │   ├── commands/
│   │   │   ├── init.ts                 🆕 (ekts init)
│   │   │   ├── add.ts                  🆕 (ekts add)
│   │   │   ├── search.ts               🆕 (ekts search)
│   │   │   ├── get.ts                  🆕 (ekts get)
│   │   │   ├── list.ts                 🆕 (ekts list)
│   │   │   ├── delete.ts               🆕 (ekts delete)
│   │   │   └── status.ts               🆕 (ekts status)
│   │   └── formatters/
│   │       ├── resource-formatter.ts   🆕 (formatage ressources)
│   │       └── search-formatter.ts     🆕 (formatage résultats)
│   ├── business/
│   │   └── ...                         ✅ (Sprint 3-4)
│   ├── data/
│   │   └── ...                         ✅ (Sprint 2)
│   └── ...
├── tests/
│   ├── cli/
│   │   └── cli.test.ts                 🆕 (tests intégration)
│   └── ...
├── docs/
│   ├── SEARCH_ENGINE.md                ✅ (Sprint 4)
│   └── CLI.md                          🆕 (documentation CLI)
├── package.json                        ✅ (ajouter bin)
└── bin/
    └── ekts                            🆕 (script d'exécution)
```

### 6.2 Fichiers à créer

| Fichier | Lignes estimées | Description |
|---------|-----------------|-------------|
| `src/cli/index.ts` | ~50 | Point d'entrée CLI |
| `src/cli/commands/init.ts` | ~40 | Commande init |
| `src/cli/commands/add.ts` | ~80 | Commande add |
| `src/cli/commands/search.ts` | ~100 | Commande search |
| `src/cli/commands/get.ts` | ~50 | Commande get |
| `src/cli/commands/list.ts` | ~80 | Commande list |
| `src/cli/commands/delete.ts` | ~60 | Commande delete |
| `src/cli/commands/status.ts` | ~70 | Commande status |
| `src/cli/formatters/resource-formatter.ts` | ~80 | Formatage ressources |
| `src/cli/formatters/search-formatter.ts` | ~60 | Formatage résultats |
| `tests/cli/cli.test.ts` | ~300 | Tests intégration |
| `docs/CLI.md` | ~300 | Documentation CLI |
| `bin/ekts` | ~10 | Script d'exécution |

**Total :** ~1 280 lignes de code + documentation

---

## 7. Tests et validation

### 7.1 Stratégie de test

**Niveaux de test :**
- ✅ Tests unitaires (chaque commande séparément)
- ✅ Tests d'intégration (exécution réelle des commandes)
- ✅ Tests de formatage (JSON + humain)

**Outils :**
- Vitest (test runner)
- `child_process.execSync` (exécution commandes)
- Mocks pour les services (Knowledge Manager, Search Engine)

### 7.2 Couverture cible

**Objectif :** > 80% couverture sur `src/cli/`

**Mesure :**
```bash
npm run test:coverage -- tests/cli/
# ✅ Statements > 80%
# ✅ Branches > 80%
# ✅ Functions > 80%
# ✅ Lines > 80%
```

### 7.3 Scénarios à tester

**Tests d'intégration CLI :**

| Commande | Scénario | Résultat attendu |
|----------|----------|------------------|
| `ekts init` | Initialisation | 3 bases créées, message succès |
| `ekts init` | Déjà initialisé | Message erreur ou warning |
| `ekts add` | Ajout valide | Ressource créée + indexée |
| `ekts add` | Données invalides | Erreur validation |
| `ekts search` | Recherche hybride | Résultats affichés |
| `ekts search` | Aucun résultat | Message "no results" |
| `ekts search` | Avec filtres | Résultats filtrés |
| `ekts get` | Ressource existe | Ressource affichée |
| `ekts get` | Ressource inexistante | Erreur 404 |
| `ekts list` | Sans filtres | Toutes les ressources |
| `ekts list` | Avec filtres | Ressources filtrées |
| `ekts delete` | Suppression | Ressource supprimée |
| `ekts delete` | Ressource inexistante | Erreur 404 |
| `ekts status` | Statut | Informations système |
| `--json` | Mode JSON | Sortie JSON valide |
| `--help` | Aide | Documentation affichée |

### 7.4 Tests manuels

**En plus des tests automatisés, tester manuellement :**
- ✅ Installation globale (`npm install -g`)
- ✅ Commande `ekts` disponible globalement
- ✅ Couleurs affichées correctement
- ✅ Tableaux formatés correctement
- ✅ Code de sortie correct (echo $?)

---

## 8. Critères d'acceptation du sprint

### 8.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C5.1 | Commande `ekts init` fonctionne | Test intégration passe |
| C5.2 | Commande `ekts add` fonctionne | Test intégration passe |
| C5.3 | Commande `ekts search` fonctionne | Test intégration passe |
| C5.4 | Commande `ekts get` fonctionne | Test intégration passe |
| C5.5 | Commande `ekts list` fonctionne | Test intégration passe |
| C5.6 | Commande `ekts delete` fonctionne | Test intégration passe |
| C5.7 | Commande `ekts status` fonctionne | Test intégration passe |
| C5.8 | Mode JSON fonctionnel (`--json`) | Sortie JSON valide |
| C5.9 | Mode humain fonctionnel (défaut) | Formatage lisible |
| C5.10 | Gestion erreurs (codes de sortie) | Codes appropriés |

### 8.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C5.11 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C5.12 | Tests d'intégration passent | `npm test tests/cli/` |
| C5.13 | Compilation TypeScript OK | `npm run build` |
| C5.14 | Linting OK | `npm run lint` |
| C5.15 | Documentation API complète | `docs/CLI.md` existe |

### 8.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C5.16 | Code lisible (JSDoc, commentaires) | Revue code |
| C5.17 | Interface intuitive (noms clairs) | Revue UX |
| C5.18 | Messages d'erreur clairs | Revue erreurs |
| C5.19 | Commande `--help` complète | Test manuel |

---

## 9. Livrables attendus

### 9.1 Code

| Fichier | Description | Validation |
|---------|-------------|------------|
| `src/cli/index.ts` | Point d'entrée CLI | Compilation OK |
| `src/cli/commands/init.ts` | Commande init | Test passe |
| `src/cli/commands/add.ts` | Commande add | Test passe |
| `src/cli/commands/search.ts` | Commande search | Test passe |
| `src/cli/commands/get.ts` | Commande get | Test passe |
| `src/cli/commands/list.ts` | Commande list | Test passe |
| `src/cli/commands/delete.ts` | Commande delete | Test passe |
| `src/cli/commands/status.ts` | Commande status | Test passe |
| `src/cli/formatters/resource-formatter.ts` | Formatage ressources | Test passe |
| `src/cli/formatters/search-formatter.ts` | Formatage résultats | Test passe |
| `bin/ekts` | Script d'exécution | Exécutable |

### 9.2 Tests

| Fichier | Description | Validation |
|---------|-------------|------------|
| `tests/cli/cli.test.ts` | Tests intégration | > 80% couverture |

### 9.3 Documentation

| Fichier | Description | Validation |
|---------|-------------|------------|
| `docs/CLI.md` | Documentation CLI | Complète + exemples |

### 9.4 Configuration

| Fichier | Description | Validation |
|---------|-------------|------------|
| `package.json` | Ajouter `bin` | `ekts` exécutable |

### 9.5 Commits Git

```bash
# Sprint 5-1
git commit -m "feat(cli): implement init command"
git commit -m "feat(cli): implement add command"
git commit -m "feat(cli): implement get command"
git push origin feat/sprint-5-1

# Sprint 5-2
git commit -m "feat(cli): implement search command"
git commit -m "feat(cli): implement list command"
git commit -m "feat(cli): implement delete command"
git push origin feat/sprint-5-2

# Sprint 5-3
git commit -m "feat(cli): implement status command"
git commit -m "test(cli): add integration tests"
git commit -m "docs: add CLI documentation"
git push origin feat/sprint-5-3
```

---

## 10. Procédure de fin de sprint

### 10.1 Vérifications finales

**Avant de clôturer le Sprint 5 :**

```bash
# 1. Tests unitaires
npm test
# ✅ Tous les tests passent

# 2. Couverture
npm run test:coverage -- tests/cli/
# ✅ > 80% couverture sur src/cli/

# 3. Tests d'intégration
npm test tests/cli/
# ✅ Tous les tests d'intégration passent

# 4. Compilation
npm run build
# ✅ Aucune erreur TypeScript

# 5. Linting
npm run lint
# ✅ Aucune erreur

# 6. Vérification fichiers
ls -la src/cli/
# ✅ index.ts, commands/, formatters/

ls -la src/cli/commands/
# ✅ init.ts, add.ts, search.ts, get.ts, list.ts, delete.ts, status.ts

ls -la tests/cli/
# ✅ cli.test.ts

ls -la docs/CLI.md
# ✅ Documentation existe

# 7. Test manuel
node dist/cli/index.js --help
# ✅ Aide affichée

node dist/cli/index.js init
# ✅ Bases créées

node dist/cli/index.js add --type article --title "Test"
# ✅ Ressource créée

node dist/cli/index.js search "test"
# ✅ Résultats affichés

# 8. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques (1 tâche = 1 commit)
```

### 10.2 Point de contrôle

**Vérifier les 19 critères :**
- ✅ C5.1 à C5.10 (critères fonctionnels)
- ✅ C5.11 à C5.15 (critères techniques)
- ✅ C5.16 à C5.19 (critères qualité)

**Si tous les critères sont validés :**
```bash
# Merge dans main
git checkout main
git merge feat/sprint-5-3
git push origin main
```

**Si des critères ne sont pas validés :**
- Identifier les problèmes
- Corriger dans une nouvelle branche `fix/sprint-5-xxx`
- Re-tester

### 10.3 Transition vers Sprint 6

**Une fois Sprint 5 terminé avec succès :**
- ✅ CLI fonctionnelle (7 commandes)
- ✅ Tests d'intégration passent
- ✅ Documentation complète
- ✅ Installation globale testée

**Préparer Sprint 6 (MCP Server) :**
- 🎯 Lire `SPRINT-06.md` (quand disponible)
- 🎯 Vérifier prérequis Sprint 6
- 🎯 Créer branche `feat/sprint-6-1`

---

## 11. Prompt de lancement pour agent

**Copier ce prompt pour lancer un agent de développement :**

```markdown
## Mission

Implémenter le Sprint 5 — CLI (Semaine 9-10) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-05.md` — Dossier complet Sprint 5
2. `Docs/roadmap/sprints/SPRINT-05-01.md` — Sprint 5-1 (init, add, get)
3. `Docs/roadmap/sprints/SPRINT-05-02.md` — Sprint 5-2 (search, list, delete)
4. `Docs/roadmap/sprints/SPRINT-05-03.md` — Sprint 5-3 (status + tests + docs)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (section 4.1.1)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-003 Commander.js)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 4 terminé
ls -la src/business/search-engine.ts
ls -la src/business/knowledge-manager.ts
# ✅ Fichiers existent

# 2. Tests Sprint 4
npm test
# ✅ Tests passent

# 3. Benchmarks validés
npm test tests/benchmark/search-benchmark.ts
# ✅ Recall@5 ≥ 0.75

# 4. 3 bases SQLite
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 4 terminé avec succès
- ✅ Knowledge Manager fonctionnel (5 méthodes)
- ✅ Search Engine fonctionnel (recherche hybride)
- ✅ 3 bases SQLite créées
- ✅ Tests > 80% couverture

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer des fichiers dans `src/cli/`
- ✅ Créer des fichiers dans `tests/cli/`
- ✅ Créer `docs/CLI.md`
- ✅ Créer `bin/ekts` (script d'exécution)
- ✅ Modifier `package.json` (ajouter bin, commander, chalk, cli-table3)

**Vous ne pouvez pas :**
- ❌ Modifier `src/business/` (sauf si bug critique)
- ❌ Modifier `src/data/` (sauf si bug critique)
- ❌ Modifier `src/schemas/` (sauf si bug critique)
- ❌ Créer de fichiers hors périmètre
- ❌ Installer d'autres dépendances (sauf approbation préalable)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Commander.js v12+ pour CLI
- ✅ Support mode JSON (`--json`)
- ✅ Support mode humain (défaut)
- ✅ Codes de sortie appropriés (0 = succès, 1-4 = erreurs)
- ✅ Couleurs terminal (chalk)
- ✅ Tableaux formatés (cli-table3)

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

**Tests d'intégration :**
- ✅ Chaque commande testée (7 commandes)
- ✅ Cas nominaux et d'erreur testés
- ✅ Options testées (flags, arguments)
- ✅ Formats de sortie testés (JSON + humain)

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Commande init implémentée
- [x] Commande add implémentée

### Tâches en cours
- [ ] Commande search (50% terminé)

### Tâches à venir
- [ ] Commande get
- [ ] Commande list
- [ ] Commande delete
- [ ] Commande status

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 5 est terminé quand :**
- ✅ Les 19 critères d'acceptation sont validés (C5.1 à C5.19)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Tests d'intégration passent
- ✅ Documentation complète
- ✅ Commits pushés sur `feat/sprint-5-3`

## Livrables

**À la fin du Sprint 5, fournir :**
- ✅ `src/cli/index.ts` — Point d'entrée CLI
- ✅ `src/cli/commands/init.ts` — Commande init
- ✅ `src/cli/commands/add.ts` — Commande add
- ✅ `src/cli/commands/search.ts` — Commande search
- ✅ `src/cli/commands/get.ts` — Commande get
- ✅ `src/cli/commands/list.ts` — Commande list
- ✅ `src/cli/commands/delete.ts` — Commande delete
- ✅ `src/cli/commands/status.ts` — Commande status
- ✅ `src/cli/formatters/resource-formatter.ts` — Formatage ressources
- ✅ `src/cli/formatters/search-formatter.ts` — Formatage résultats
- ✅ `tests/cli/cli.test.ts` — Tests intégration
- ✅ `docs/CLI.md` — Documentation CLI
- ✅ `bin/ekts` — Script d'exécution

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-003 Commander.js)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 5-1 : 3 jours (init, add, get)
- Sprint 5-2 : 4 jours (search, list, delete)
- Sprint 5-3 : 3 jours (status + tests + docs)
```

---

## 12. Résumé

### 12.1 Sprint 5 — CLI (2 semaines)

**Objectif :** Implémenter l'interface CLI avec 7 commandes

**3 sous-sprints :**
- **Sprint 5-1** (3 jours) : Commandes de base (init, add, get)
- **Sprint 5-2** (4 jours) : Commandes de recherche et gestion (search, list, delete)
- **Sprint 5-3** (3 jours) : Commande status + tests intégration + documentation

**Livrables principaux :**
- ✅ 7 commandes CLI (init, add, search, get, list, delete, status)
- ✅ Formatage sorties (JSON + humain)
- ✅ Gestion erreurs (codes de sortie)
- ✅ Tests d'intégration complets
- ✅ Documentation CLI détaillée

**19 critères de validation :**
- ✅ C5.1 à C5.10 (fonctionnels)
- ✅ C5.11 à C5.15 (techniques)
- ✅ C5.16 à C5.19 (qualité)

**Dépendances :**
- ✅ Sprint 2 (Data Layer) — Terminé
- ✅ Sprint 3 (Knowledge Manager) — Terminé
- ✅ Sprint 4 (Search Engine) — Terminé
- 🎯 Sprint 6 (MCP Server) — Utilisera les mêmes services

### 12.2 Transition

**Après Sprint 5 :**
- ✅ CLI fonctionnelle (7 commandes)
- ✅ Tests d'intégration passent
- ✅ Prêt pour Sprint 6 (MCP Server)

**Sprint 6 — MCP Server (Semaine 11-12) :**
- 🎯 Serveur MCP (Model Context Protocol)
- 🎯 4 outils (search_knowledge, get_resource, list_resources, validate_resource)
- 🎯 Compatible Claude Code, Cursor, Copilot
- 🎯 Tests d'intégration avec agents IA

---

## 13. Livraison — 22 octobre 2026

### 13.1 Fichiers livrés

| Fichier | Rôle |
|---|---|
| `src/cli/index.ts` | Point d'entrée `bin` (3 lignes, hors couverture) |
| `src/cli/program.ts` | Assemblage Commander, `runCli`, codes de sortie |
| `src/cli/runtime.ts` | Sorties, TTY, horloge, confirmation, ouverture des services |
| `src/cli/services.ts` | Une connexion, trois schémas ; manager (FTS + vecteurs) ; moteur |
| `src/cli/command.ts` | `--json`/`--no-colors`, `execute`, `CommandFailure` |
| `src/cli/output.ts` | Palette `chalk`, tableaux ASCII, troncature, tailles |
| `src/cli/options.ts` | `--tags`, `--limit`, `--offset` |
| `src/cli/commands/*.ts` | `init`, `add`, `get`, `search`, `list`, `delete`, `status` |
| `tests/cli/*.test.ts` | 6 fichiers unitaires + intégration binaire |
| `docs/CLI.md` | Guide complet (commandes, JSON, codes, dépannage) |

### 13.2 Résultats mesurés

- **522 tests** (425 avant le sprint + 97 CLI), **couverture 100 %** sur
  `src/**` (lignes, branches, fonctions), dont `src/cli/**` intégralement.
- `npm run build` puis exécution réelle du binaire : parcours
  `init → add → get → list → search → status → delete` validé, codes
  `0/1/2/3/4` vérifiés.
- Aucune nouvelle dépendance de rendu : `chalk` pour les couleurs,
  `commander` pour l'analyse ; tableaux rendus en interne.
- Commits : `78232db` (socle et commandes), `45db1ea` (tests), puis le commit
  de documentation du sprint.

### 13.3 Écarts assumés

Les écarts E5-1 à E5-10 sont détaillés dans [`docs/CLI.md` §8](../../../../CLI.md) :
`EKTS_DATA_DIR` au lieu de `EKTS_DB_PATH`, connexion unique au lieu de trois,
API réelles du Sprint 4, tableaux internes au lieu de `cli-table3`, Commander 15,
codes retournés au lieu de `process.exit`, repli FTS de `add`, `--json` accepté
avant et après la commande, `status` non destructif, `delete` refusé sans
terminal.

### 13.4 Décisions et risques

- **ADR-019** — CLI Commander.js, deux formats de sortie, cinq codes.
  (Le renvoi du blueprint à « ADR-003 » est erroné : l'ADR-003 traite de
  Playwright.)
- **R-5.1 à R-5.6** — dérive du JSON, suppression en script, repli silencieux,
  point d'entrée hors couverture, divergence CLI/MCP, création de bases par
  `status`.

### 13.5 Point d'arrêt

Le sprint est terminé. **Aucune ligne du Sprint 6 (serveur MCP) n'est écrite** :
la suite attend le feu vert explicite de l'utilisateur.


---

**Fin du dossier Sprint 5 — CLI**
