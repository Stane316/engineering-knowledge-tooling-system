# Sprint 3 — Knowledge Manager (Semaine 5-6)

**Statut :** 🟡 Documenté — En attente approbation  
**Durée :** 2 semaines (10 jours ouvrables)  
**Objectif :** Implémenter la logique métier (Knowledge Manager) — CRUD ressources + orchestration indexation FTS automatique  
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

Le **Sprint 2 (Data Layer)** a mis en place :
- ✅ 3 bases SQLite (ekts.db, ekts-fts.db, ekts-vectors.db)
- ✅ WAL mode + FTS5 + sqlite-vec
- ✅ Repository Resource (CRUD complet)
- ✅ Validation Zod (CreateResourceSchema, UpdateResourceSchema, ResourceSchema)
- ✅ Tests > 80% couverture

Le **Sprint 3 (Knowledge Manager)** va :
- 🎯 Implémenter la logique métier au-dessus du Repository
- 🎯 Orchestrer l'indexation FTS automatique
- 🎯 Gérer les métadonnées et tags
- 🎯 Préparer le terrain pour le Search Engine (Sprint 4)

### 1.2 Objectifs du Sprint 3

**Objectif principal :** Implémenter un Knowledge Manager fonctionnel qui orchestre la création, la lecture, la mise à jour et la suppression des ressources, avec indexation FTS automatique.

**Objectifs secondaires :**
- 🎯 Couplage faible entre Business Layer et Data Layer (injection dépendances)
- 🎯 Tests unitaires Knowledge Manager > 80% couverture
- 🎯 Documentation API Knowledge Manager complète
- 🎯 Préparation des interfaces pour le Search Engine (Sprint 4)

### 1.3 Pourquoi ce sprint est critique

Le Knowledge Manager est le **cœur métier** de l'application. C'est lui qui :
- Orchestre toutes les opérations sur les ressources
- Garantit la cohérence des données entre les 3 bases
- Synchronise l'index FTS à chaque modification
- Valide les entrées utilisateur (via Zod)
- Prépare le terrain pour la recherche hybride (Sprint 4)

**Si le Knowledge Manager échoue, tout le MVP-1 échoue.**

---

## 2. Périmètre du sprint

### 2.1 Ce qui est inclus

| # | Composant | Description | Fichier |
|---|-----------|-------------|---------|
| 1 | Knowledge Manager CRUD | Implémenter 5 méthodes (add, get, list, update, delete) | `src/business/knowledge-manager.ts` |
| 2 | Orchestration FTS | Synchroniser index FTS à chaque add/update/delete | `src/business/indexer.ts` |
| 3 | Gestion métadonnées | Parser/formater JSON (tags, metadata) | Intégré au Knowledge Manager |
| 4 | Tests unitaires | Tests Knowledge Manager + Indexer | `tests/business/` |
| 5 | Documentation | API Knowledge Manager | `docs/KNOWLEDGE_MANAGER.md` |

### 2.2 Ce qui est exclu

| Exclu | Raison | Reporté à |
|-------|--------|-----------|
| ❌ Search Engine | Logique de recherche complexe (RRF, embeddings) | Sprint 4 |
| ❌ Embeddings | Génération embeddings (OpenAI) | Sprint 4 |
| ❌ Orchestration Vector | Indexation vectorielle | Sprint 4 |
| ❌ CLI | Commandes ligne de commande | Sprint 5 |
| ❌ MCP Server | Exposition aux agents IA | Sprint 6 |

### 2.3 Dépendances

**Ce que le Sprint 3 utilise depuis le Sprint 2 :**
- ✅ Repository Resource (`src/data/resource-repository.ts`)
- ✅ Validation Zod (`src/schemas/resource.ts`)
- ✅ Schémas SQLite (`src/data/database.ts`)
- ✅ Connexion FTS (`src/data/fts.ts`)
- ✅ Types Resource (`src/types/resource.ts`)

**Ce que le Sprint 3 prépare pour le Sprint 4 :**
- 🎯 Interface `IKnowledgeManager` (pour injection dans Search Engine)
- 🎯 Méthode `searchResources` (skeleton, implémentation Sprint 4)
- 🎯 Hooks d'indexation (pour indexer les embeddings)

---

## 3. État initial et prérequis

### 3.1 État initial (fin Sprint 2)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── business/
│   │   └── (vide — à créer Sprint 3)
│   ├── data/
│   │   ├── database.ts          ✅ (ekts.db connexion)
│   │   ├── fts.ts               ✅ (ekts-fts.db connexion)
│   │   ├── vectors.ts           ✅ (ekts-vectors.db connexion)
│   │   ├── resource-repository.ts  ✅ (CRUD complet)
│   │   └── schema.sql           ✅ (3 schémas)
│   ├── schemas/
│   │   └── resource.ts          ✅ (CreateResourceSchema, UpdateResourceSchema, ResourceSchema)
│   ├── types/
│   │   └── resource.ts          ✅ (Resource, ResourceFilters, etc.)
│   └── utils/
│       ├── id.ts                ✅ (generateId)
│       ├── timestamp.ts         ✅ (getTimestamp)
│       └── errors.ts            ✅ (ResourceNotFoundError, etc.)
├── tests/
│   └── data/
│       └── resource-repository.test.ts  ✅ (> 80% couverture)
└── docs/
    └── DATA_LAYER.md            ✅
```

### 3.2 Prérequis obligatoires

**Avant de commencer Sprint 3, vérifier :**

```bash
# 1. Sprint 2 terminé avec succès
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent

# 2. Repository Resource fonctionne
npm test tests/data/resource-repository.test.ts
# ✅ Tests passent (> 80% couverture)

# 3. Validation Zod fonctionne
cat src/schemas/resource.ts
# ✅ CreateResourceSchema, UpdateResourceSchema, ResourceSchema existent

# 4. Compilation TypeScript
npm run build
# ✅ Aucune erreur

# 5. Linting
npm run lint
# ✅ Aucune erreur
```

### 3.3 Prérequis compétences

**L'agent de développement doit maîtriser :**
- ✅ TypeScript intermédiaire (interfaces, classes, injection dépendances)
- ✅ Design patterns (Repository, Service)
- ✅ Tests unitaires (Vitest)
- ✅ Gestion erreurs (try/catch, custom errors)
- 🟡 SQLite FTS5 (bases — trigger, synchronisation)

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif | Tâches |
|-------------|-------|----------|--------|
| **Sprint 3-1** | 4 jours | Knowledge Manager CRUD (add, get, list) | 3.1, 3.2, 3.3 |
| **Sprint 3-2** | 4 jours | Knowledge Manager CRUD suite (update, delete) + tests | 3.4, 3.5, 3.7 |
| **Sprint 3-3** | 2 jours | Indexation FTS automatique + documentation | 3.6, 3.8 |

### 4.2 Sprint 3-1 — Knowledge Manager CRUD (add, get, list)

**Durée :** 4 jours  
**Objectif :** Implémenter les 3 premières méthodes du Knowledge Manager

**Tâches :**
- ✅ 3.1 `addResource(input: AddResourceInput): Promise<Resource>` — 8h
- ✅ 3.2 `getResource(id: string): Promise<Resource | null>` — 4h
- ✅ 3.3 `listResources(filters?: ResourceFilters): Promise<Resource[]>` — 4h

**Détail :** Voir document `SPRINT-03-01.md`

**Critères de validation :**
- ✅ `addResource` crée une ressource dans ekts.db
- ✅ `getResource` retourne une ressource par ID (ou null)
- ✅ `listResources` retourne une liste filtrée
- ✅ Validation Zod intégrée
- ✅ Gestion erreurs (ResourceNotFoundError)
- ✅ Tests unitaires > 80% couverture

### 4.3 Sprint 3-2 — Knowledge Manager CRUD suite (update, delete) + tests

**Durée :** 4 jours  
**Objectif :** Implémenter les 2 dernières méthodes + tests complets

**Tâches :**
- ✅ 3.4 `updateResource(id: string, data: Partial<Resource>): Promise<Resource>` — 4h
- ✅ 3.5 `deleteResource(id: string): Promise<void>` — 4h
- ✅ 3.7 Tests unitaires Knowledge Manager — 8h

**Détail :** Voir document `SPRINT-03-02.md`

**Critères de validation :**
- ✅ `updateResource` met à jour une ressource existante
- ✅ `deleteResource` supprime une ressource
- ✅ Validation Zod intégrée (Partial<Resource>)
- ✅ Tests unitaires complets (> 80% couverture)
- ✅ Tests cas d'erreur (resource introuvable, validation échoue)

### 4.4 Sprint 3-3 — Indexation FTS automatique + documentation

**Durée :** 2 jours  
**Objectif :** Orchestrer l'indexation FTS et documenter l'API

**Tâches :**
- ✅ 3.6 Indexation FTS automatique (à chaque add/update/delete) — 8h
- ✅ 3.8 Documentation Knowledge Manager — 4h

**Détail :** Voir document `SPRINT-03-03.md`

**Critères de validation :**
- ✅ Indexation FTS automatique à chaque `addResource`
- ✅ Indexation FTS automatique à chaque `updateResource`
- ✅ Suppression FTS à chaque `deleteResource`
- ✅ Trigger SQLite FTS synchronise avec ekts-fts.db
- ✅ Documentation API complète (JSDoc + README)
- ✅ Exemples d'utilisation

---

## 5. Choix techniques et références

### 5.1 Architecture Knowledge Manager

**Décision :** Implémenter le Knowledge Manager comme un service qui orchestre le Repository et l'Indexer.

**Référence :** Architecture C Hybride (ADR-005)

**Pattern :**
```typescript
class KnowledgeManager implements IKnowledgeManager {
  private repository: ResourceRepository;
  private indexer: Indexer;

  async addResource(input: AddResourceInput): Promise<Resource> {
    // 1. Validation Zod
    const validated = CreateResourceSchema.parse(input);
    
    // 2. Création resource (ekts.db)
    const resource = await this.repository.create(validated);
    
    // 3. Indexation FTS (ekts-fts.db)
    await this.indexer.indexFTS(resource);
    
    return resource;
  }
}
```

**Avantages :**
- ✅ Couplage faible (injection dépendances)
- ✅ Testabilité (mock Repository + Indexer)
- ✅ Responsabilité unique (orchestration)
- ✅ Extensibilité (ajouter Indexer Vector au Sprint 4)

### 5.2 Injection de dépendances

**Décision :** Utiliser l'injection de dépendances via constructeur (pas de framework DI).

**Référence :** ADR-005 (Architecture C Hybride)

**Implémentation :**
```typescript
class KnowledgeManager implements IKnowledgeManager {
  constructor(
    private repository: ResourceRepository,
    private indexer: Indexer
  ) {}
}

// Instanciation (dans main.ts ou CLI)
const repository = new ResourceRepository(db);
const indexer = new Indexer(ftsDb);
const knowledgeManager = new KnowledgeManager(repository, indexer);
```

**Avantages :**
- ✅ Pas de framework DI (simplicité)
- ✅ Testabilité (mock facile)
- ✅ Transparence (pas de magie)

### 5.3 Orchestration FTS

**Décision :** Utiliser un Indexer séparé qui synchronise l'index FTS.

**Référence :** ADR-001 (SQLite WAL + FTS5 + sqlite-vec)

**Implémentation :**
```typescript
class Indexer {
  async indexFTS(resource: Resource): Promise<void> {
    // Insérer dans ekts-fts.db (resources_fts)
    await this.ftsDb.run(
      `INSERT INTO resources_fts (rowid, title, content, tags)
       VALUES (?, ?, ?, ?)`,
      [resource.rowid, resource.title, resource.content, resource.tags]
    );
  }

  async removeFTS(resourceId: string): Promise<void> {
    // Supprimer de ekts-fts.db
    await this.ftsDb.run(
      `DELETE FROM resources_fts WHERE rowid = ?`,
      [resourceId]
    );
  }
}
```

**Alternatives considérées :**
- ❌ Trigger SQLite automatique : complexe à maintenir, difficile à tester
- ❌ Indexation batch (cron) : latence élevée, incohérences temporaires
- ✅ Indexation synchrone à chaque opération : cohérence immédiate, simple

### 5.4 Gestion des erreurs

**Décision :** Utiliser des erreurs personnalisées (extends Error).

**Référence :** Sprint 2 (utils/errors.ts)

**Erreurs à gérer :**
- `ResourceNotFoundError` — Ressource introuvable (getResource, updateResource, deleteResource)
- `ValidationError` — Validation Zod échoue
- `IndexingError` — Erreur indexation FTS

**Implémentation :**
```typescript
async getResource(id: string): Promise<Resource | null> {
  const resource = await this.repository.getById(id);
  if (!resource) {
    throw new ResourceNotFoundError(id);
  }
  return resource;
}
```

### 5.5 Tests unitaires

**Décision :** Tester le Knowledge Manager avec mock Repository + Indexer.

**Référence :** ADR-002 (Vitest + 80% couverture)

**Stratégie :**
- ✅ Mock `ResourceRepository` (vi.fn())
- ✅ Mock `Indexer` (vi.fn())
- ✅ Tester cas nominaux (add, get, list, update, delete)
- ✅ Tester cas d'erreur (resource introuvable, validation échoue, indexation échoue)
- ✅ Couverture > 80%

**Exemple :**
```typescript
describe('KnowledgeManager', () => {
  const mockRepository = {
    create: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const mockIndexer = {
    indexFTS: vi.fn(),
    removeFTS: vi.fn(),
  };
  const manager = new KnowledgeManager(mockRepository, mockIndexer);

  it('should create a resource and index FTS', async () => {
    const input = { title: 'Test', type: 'article', tags: [] };
    const resource = { id: '123', ...input };
    
    mockRepository.create.mockResolvedValue(resource);
    mockIndexer.indexFTS.mockResolvedValue(undefined);

    const result = await manager.addResource(input);

    expect(mockRepository.create).toHaveBeenCalledWith(input);
    expect(mockIndexer.indexFTS).toHaveBeenCalledWith(resource);
    expect(result).toEqual(resource);
  });
});
```

---

## 6. Organisation des fichiers

### 6.1 Structure après Sprint 3

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── business/
│   │   ├── knowledge-manager.ts     🆕 (Sprint 3 — CRUD + orchestration)
│   │   ├── knowledge-manager.types.ts  🆕 (Sprint 3 — interfaces)
│   │   └── indexer.ts               🆕 (Sprint 3 — orchestration FTS)
│   ├── data/
│   │   ├── database.ts              ✅ (Sprint 2)
│   │   ├── fts.ts                   ✅ (Sprint 2)
│   │   ├── vectors.ts               ✅ (Sprint 2)
│   │   ├── resource-repository.ts   ✅ (Sprint 2)
│   │   └── schema.sql               ✅ (Sprint 2)
│   ├── schemas/
│   │   └── resource.ts              ✅ (Sprint 2)
│   ├── types/
│   │   └── resource.ts              ✅ (Sprint 2)
│   └── utils/
│       ├── id.ts                    ✅ (Sprint 1)
│       ├── timestamp.ts             ✅ (Sprint 1)
│       └── errors.ts                ✅ (Sprint 2)
├── tests/
│   ├── business/
│   │   ├── knowledge-manager.test.ts  🆕 (Sprint 3)
│   │   └── indexer.test.ts          🆕 (Sprint 3)
│   └── data/
│       └── resource-repository.test.ts  ✅ (Sprint 2)
└── docs/
    ├── DATA_LAYER.md                ✅ (Sprint 2)
    └── KNOWLEDGE_MANAGER.md         🆕 (Sprint 3)
```

### 6.2 Fichiers à créer

| Fichier | Lignes estimées | Description |
|---------|-----------------|-------------|
| `src/business/knowledge-manager.ts` | ~150 | Knowledge Manager (5 méthodes) |
| `src/business/knowledge-manager.types.ts` | ~30 | Interfaces (IKnowledgeManager, AddResourceInput) |
| `src/business/indexer.ts` | ~80 | Indexer FTS (indexFTS, removeFTS) |
| `tests/business/knowledge-manager.test.ts` | ~200 | Tests unitaires Knowledge Manager |
| `tests/business/indexer.test.ts` | ~100 | Tests unitaires Indexer |
| `docs/KNOWLEDGE_MANAGER.md` | ~200 | Documentation API |

**Total :** ~760 lignes de code + documentation

---

## 7. Tests et validation

### 7.1 Stratégie de test

**Niveaux de test :**
- ✅ Tests unitaires Knowledge Manager (mock Repository + Indexer)
- ✅ Tests unitaires Indexer (mock FTS database)
- ✅ Tests d'intégration (optionnel — peut être fait au Sprint 4)

**Outils :**
- Vitest (test runner)
- Mocks Vitest (vi.fn(), vi.mock())

### 7.2 Couverture cible

**Objectif :** > 80% couverture sur `src/business/`

**Mesure :**
```bash
npm run test:coverage -- tests/business/
# ✅ Statements > 80%
# ✅ Branches > 80%
# ✅ Functions > 80%
# ✅ Lines > 80%
```

### 7.3 Scénarios à tester

**Tests unitaires Knowledge Manager :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Création ressource valide | `addResource` | Resource créée + FTS indexé |
| Validation échoue | `addResource` | ValidationError thrown |
| Ressource existe | `getResource` | Resource retournée |
| Ressource introuvable | `getResource` | ResourceNotFoundError thrown |
| Liste sans filtres | `listResources` | Toutes les resources |
| Liste avec filtres | `listResources` | Resources filtrées |
| Mise à jour valide | `updateResource` | Resource mise à jour + FTS réindexé |
| Mise à jour resource introuvable | `updateResource` | ResourceNotFoundError thrown |
| Suppression | `deleteResource` | Resource supprimée + FTS supprimé |
| Suppression resource introuvable | `deleteResource` | ResourceNotFoundError thrown |

**Tests unitaires Indexer :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Indexation FTS | `indexFTS` | FTS inséré dans ekts-fts.db |
| Suppression FTS | `removeFTS` | FTS supprimé de ekts-fts.db |
| Erreur indexation | `indexFTS` | IndexingError thrown |

### 7.4 Critères de validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

---

## 8. Critères d'acceptation du sprint

### 8.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C3.1 | Knowledge Manager `addResource` crée une resource et indexe FTS | Test unitaire passe |
| C3.2 | Knowledge Manager `getResource` retourne une resource par ID | Test unitaire passe |
| C3.3 | Knowledge Manager `listResources` retourne une liste filtrée | Test unitaire passe |
| C3.4 | Knowledge Manager `updateResource` met à jour et réindexe FTS | Test unitaire passe |
| C3.5 | Knowledge Manager `deleteResource` supprime et supprime FTS | Test unitaire passe |
| C3.6 | Indexation FTS automatique à chaque add/update/delete | Test intégration passe |
| C3.7 | Validation Zod intégrée (CreateResourceSchema, UpdateResourceSchema) | Test unitaire passe |
| C3.8 | Gestion erreurs (ResourceNotFoundError, ValidationError) | Test unitaire passe |

### 8.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C3.9 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C3.10 | Compilation TypeScript OK | `npm run build` |
| C3.11 | Linting OK | `npm run lint` |
| C3.12 | Documentation API complète | `docs/KNOWLEDGE_MANAGER.md` existe |

### 8.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C3.13 | Code lisible (JSDoc, commentaires) | Revue code |
| C3.14 | Couplage faible (injection dépendances) | Revue architecture |
| C3.15 | Responsabilité unique (orchestration) | Revue architecture |

---

## 9. Livrables attendus

### 9.1 Code

| Fichier | Description | Validation |
|---------|-------------|------------|
| `src/business/knowledge-manager.ts` | Knowledge Manager (5 méthodes) | Test unitaire passe |
| `src/business/knowledge-manager.types.ts` | Interfaces (IKnowledgeManager) | Compilation OK |
| `src/business/indexer.ts` | Indexer FTS (indexFTS, removeFTS) | Test unitaire passe |

### 9.2 Tests

| Fichier | Description | Validation |
|---------|-------------|------------|
| `tests/business/knowledge-manager.test.ts` | Tests unitaires Knowledge Manager | > 80% couverture |
| `tests/business/indexer.test.ts` | Tests unitaires Indexer | > 80% couverture |

### 9.3 Documentation

| Fichier | Description | Validation |
|---------|-------------|------------|
| `docs/KNOWLEDGE_MANAGER.md` | Documentation API | Complète + exemples |

### 9.4 Commits Git

```bash
# Sprint 3-1
git commit -m "feat(business): implement Knowledge Manager addResource"
git commit -m "feat(business): implement Knowledge Manager getResource"
git commit -m "feat(business): implement Knowledge Manager listResources"
git push origin feat/sprint-3-1

# Sprint 3-2
git commit -m "feat(business): implement Knowledge Manager updateResource"
git commit -m "feat(business): implement Knowledge Manager deleteResource"
git commit -m "test(business): add unit tests for Knowledge Manager"
git push origin feat/sprint-3-2

# Sprint 3-3
git commit -m "feat(business): implement FTS indexer"
git commit -m "docs: add Knowledge Manager API documentation"
git push origin feat/sprint-3-3
```

---

## 10. Procédure de fin de sprint

### 10.1 Vérifications finales

**Avant de clôturer le Sprint 3 :**

```bash
# 1. Tests unitaires
npm test
# ✅ Tous les tests passent

# 2. Couverture
npm run test:coverage
# ✅ > 80% couverture sur src/business/

# 3. Compilation
npm run build
# ✅ Aucune erreur TypeScript

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/business/
# ✅ knowledge-manager.ts, knowledge-manager.types.ts, indexer.ts

ls -la tests/business/
# ✅ knowledge-manager.test.ts, indexer.test.ts

ls -la docs/KNOWLEDGE_MANAGER.md
# ✅ Documentation existe

# 6. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques (1 tâche = 1 commit)
```

### 10.2 Point de contrôle

**Vérifier les 12 critères :**
- ✅ C3.1 à C3.8 (critères fonctionnels)
- ✅ C3.9 à C3.12 (critères techniques)
- ✅ C3.13 à C3.15 (critères qualité)

**Si tous les critères sont validés :**
```bash
# Merge dans main
git checkout main
git merge feat/sprint-3-3
git push origin main
```

**Si des critères ne sont pas validés :**
- Identifier les problèmes
- Corriger dans une nouvelle branche `fix/sprint-3-xxx`
- Re-tester

### 10.3 Transition vers Sprint 4

**Une fois Sprint 3 terminé avec succès :**
- ✅ Knowledge Manager fonctionnel (5 méthodes)
- ✅ Indexation FTS automatique
- ✅ Tests > 80% couverture
- ✅ Documentation complète

**Préparer Sprint 4 (Search Engine) :**
- 🎯 Lire `SPRINT-04.md` (quand disponible)
- 🎯 Vérifier prérequis Sprint 4
- 🎯 Créer branche `feat/sprint-4-1`

---

## 11. Prompt de lancement pour agent

**Copier ce prompt pour lancer un agent de développement :**

```markdown
## Mission

Implémenter le Sprint 3 — Knowledge Manager (Semaine 5-6) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-03.md` — Dossier complet Sprint 3
2. `Docs/roadmap/sprints/SPRINT-03-01.md` — Sprint 3-1 (add, get, list)
3. `Docs/roadmap/sprints/SPRINT-03-02.md` — Sprint 3-2 (update, delete + tests)
4. `Docs/roadmap/sprints/SPRINT-03-03.md` — Sprint 3-3 (Indexer FTS + documentation)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (section 4.2.1)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-001, ADR-005)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 2 terminé
ls -la data/ekts.db data/ekts-fts.db data/ekts-vectors.db
# ✅ Les 3 fichiers existent

# 2. Tests Sprint 2
npm test tests/data/resource-repository.test.ts
# ✅ Tests passent

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérifier fichiers existants
ls -la src/data/
# ✅ database.ts, fts.ts, resource-repository.ts

ls -la src/schemas/
# ✅ resource.ts

ls -la src/types/
# ✅ resource.ts
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 2 terminé avec succès
- ✅ Repository Resource fonctionnel (CRUD complet)
- ✅ Validation Zod fonctionnelle (CreateResourceSchema, UpdateResourceSchema)
- ✅ Schémas SQLite 3 bases créés
- ✅ Tests > 80% couverture sur src/data/

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer des fichiers dans `src/business/`
- ✅ Créer des fichiers dans `tests/business/`
- ✅ Créer `docs/KNOWLEDGE_MANAGER.md`
- ✅ Modifier `src/types/resource.ts` (ajouter des types si nécessaire)
- ✅ Modifier `src/utils/errors.ts` (ajouter des erreurs si nécessaire)

**Vous ne pouvez pas :**
- ❌ Modifier `src/data/` (sauf si bug critique)
- ❌ Modifier `src/schemas/` (sauf si bug critique)
- ❌ Créer de fichiers hors périmètre
- ❌ Installer de nouvelles dépendances (sauf approbation préalable)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Injection dépendances (pas de framework DI)
- ✅ Erreurs personnalisées (extends Error)
- ✅ Pas de `any` (utiliser `unknown` + type guards)

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Tâche 3.1 : addResource implémenté (src/business/knowledge-manager.ts)
- [x] Tâche 3.2 : getResource implémenté

### Tâches en cours
- [ ] Tâche 3.3 : listResources (50% terminé)

### Tâches à venir
- [ ] Tâche 3.4 : updateResource
- [ ] Tâche 3.5 : deleteResource

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 3 est terminé quand :**
- ✅ Les 12 critères d'acceptation sont validés (C3.1 à C3.12)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Documentation complète
- ✅ Commits pushés sur `feat/sprint-3-3`

## Livrables

**À la fin du Sprint 3, fournir :**
- ✅ `src/business/knowledge-manager.ts` — Knowledge Manager (5 méthodes)
- ✅ `src/business/knowledge-manager.types.ts` — Interfaces
- ✅ `src/business/indexer.ts` — Indexer FTS
- ✅ `tests/business/knowledge-manager.test.ts` — Tests unitaires
- ✅ `tests/business/indexer.test.ts` — Tests unitaires
- ✅ `docs/KNOWLEDGE_MANAGER.md` — Documentation API

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-001, ADR-005)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 3-1 : 4 jours
- Sprint 3-2 : 4 jours
- Sprint 3-3 : 2 jours
```

---

## 12. Résumé

### 12.1 Sprint 3 — Knowledge Manager (2 semaines)

**Objectif :** Implémenter la logique métier (Knowledge Manager) — CRUD ressources + orchestration indexation FTS automatique

**3 sous-sprints :**
- **Sprint 3-1** (4 jours) : Knowledge Manager CRUD (add, get, list)
- **Sprint 3-2** (4 jours) : Knowledge Manager CRUD suite (update, delete) + tests
- **Sprint 3-3** (2 jours) : Indexation FTS automatique + documentation

**Livrables principaux :**
- ✅ Knowledge Manager (5 méthodes : add, get, list, update, delete)
- ✅ Indexer FTS (indexFTS, removeFTS)
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation API

**12 critères de validation :**
- ✅ C3.1 à C3.8 (fonctionnels)
- ✅ C3.9 à C3.12 (techniques)
- ✅ C3.13 à C3.15 (qualité)

**Dépendances :**
- ✅ Sprint 2 (Data Layer) — Terminé
- 🎯 Sprint 4 (Search Engine) — Utilisera le Knowledge Manager

### 12.2 Transition

**Après Sprint 3 :**
- ✅ Knowledge Manager fonctionnel
- ✅ Indexation FTS automatique
- ✅ Prêt pour Sprint 4 (Search Engine)

**Sprint 4 — Search Engine (Semaine 7-8) :**
- 🎯 Recherche FTS5 (BM25)
- 🎯 Génération embeddings (OpenAI)
- 🎯 Recherche vectorielle (sqlite-vec)
- 🎯 Fusion RRF (k=60)
- 🎯 Benchmark Recall@5 ≥ 0.75

---

**Fin du dossier Sprint 3 — Knowledge Manager**
