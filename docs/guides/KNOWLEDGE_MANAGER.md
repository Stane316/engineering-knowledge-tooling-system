# Knowledge Manager — Documentation de l'API

| Champ | Valeur |
|-------|--------|
| **Objectif** | Exposer la logique métier des ressources : CRUD validé, tags, statistiques, maintenance de l'index |
| **Responsable** | Mainteneur de la couche métier (`src/business/`) |
| **Prérequis** | Sprint 2 livré (`docs/guides/DATA_LAYER.md`) |
| **Emplacement** | `src/business/` |
| **Dernière mise à jour** | 2026-10-22 (Sprint 3) |

---

## 1. Vue d'ensemble

```
CLI (Sprint 5)      MCP (Sprint 6)
       │                  │
       └────────┬─────────┘
                ▼
        KnowledgeManager        src/business/knowledge-manager.ts
        │            │
        │            └── Indexer          src/business/indexer.ts
        │                (maintenance, réindexation)
        ▼
     ResourceRepository      src/data/repositories/resource-repository.ts
        (écrit ressources + index FTS dans une transaction)
                │
                ▼
      SQLite : main · fts · vectors
```

Le manager **n'écrit pas** dans l'index : le repository le fait déjà, dans la même
transaction que l'écriture principale. Le manager apporte la validation, les erreurs métier, les
règles de domaine (tags, immutabilité du type) et la maintenance.

## 2. Installation

```ts
import { openDatabase } from './src/data/database.js';
import { createKnowledgeManager } from './src/business/knowledge-manager.js';

const database = openDatabase(); // EKTS_DATA_DIR ou ./data
const { manager, repository, indexer } = createKnowledgeManager(database.connection);

// …

database.close();
```

`createKnowledgeManager` est le câblage par défaut (CLI, MCP, tests). Pour un câblage manuel :

```ts
const manager = new KnowledgeManager(new ResourceRepository(connection), new Indexer(connection));
```

## 3. API

Toutes les méthodes sont **asynchrones**. better-sqlite3 est synchrone ; le contrat l'est malgré
tout pour accueillir la génération d'embeddings (appel réseau) au Sprint 4 sans rupture d'interface.

### `addResource(input)`

```ts
const resource = await manager.addResource({
  type: 'article',
  title: 'Recherche hybride avec SQLite',
  url: 'https://example.com/article',
  tags: ['SQLite', 'FTS5'],
  metadata: { source: 'manual' },
  content: 'Combinaison de BM25 et de similarité vectorielle.',
});
```

| Comportement | Détail |
|--------------|--------|
| Validation | `CreateResourceSchema` (Zod), avant toute écriture |
| Tags | Normalisés : espaces retirés, doublons écartés (insensible à la casse) |
| Valeurs par défaut | `tags: []`, `metadata: {}`, `url`/`content` absents |
| Indexation | Automatique, dans la transaction du repository |
| Erreur | `ValidationError` |

### `getResource(id)` / `getResourceOrThrow(id)`

```ts
const resource = await manager.getResource(id); // Resource | null

const resource = await manager.getResourceOrThrow(id); // lève ResourceNotFoundError
```

Deux variantes parce que les appelants ont deux besoins distincts : la CLI affiche « introuvable »
(`null`), tandis qu'une mise à jour exige la présence (`throw`).

### `listResources(filters?)`

```ts
await manager.listResources({ type: 'article', tags: ['SQLite'], limit: 20, offset: 0 });
```

| Filtre | Type | Effet |
|--------|------|-------|
| `type` | `article` \| `video` \| `tutorial` \| `tool` \| `other` | Restreint au type |
| `tags` | `string[]` | **Tous** les tags doivent être présents |
| `limit` | entier > 0, ≤ 1000 | Pagination |
| `offset` | entier ≥ 0 | Pagination |

Tri : `created_at` décroissant, départage par `rowid` décroissant. Erreur : `ValidationError`.

### `updateResource(id, data)`

```ts
await manager.updateResource(id, { title: 'Nouveau titre', tags: ['SQLite'] });
await manager.updateResource(id, { url: null }); // efface l'URL
```

| Comportement | Détail |
|--------------|--------|
| Validation | Avant lecture disque (`UpdateResourceSchema`) — un objet vide est refusé |
| Champs modifiables | `title`, `url`, `tags`, `metadata`, `content`, `embeddingModel` |
| Effacement | `null` sur `url`, `content`, `embeddingModel` (distinct de « champ absent ») |
| **Immuables** | `id`, `type`, `createdAt` — ignorés s'ils sont fournis |
| `updatedAt` | Toujours réécrit |
| Indexation | Réindexation FTS dans la même transaction |
| Erreurs | `ValidationError`, `ResourceNotFoundError` |

### `deleteResource(id)`

```ts
await manager.deleteResource(id);
```

Supprime la ressource, son entrée FTS et son vecteur associé (même transaction).
Erreur : `ResourceNotFoundError` si absente.

### `listTags()`

```ts
await manager.listTags(); // ['FTS5', 'SQLite', 'typescript']
```

Tags distincts, tri total et insensible à la casse. À casse égale, la graphie minuscule est retenue.

### `stats()`

```ts
await manager.stats();
// { total: 12, byType: { article: 7, video: 1, tutorial: 0, tool: 3, other: 1 },
//   indexed: 12, consistent: true }
```

`consistent` compare la base principale et l'index FTS : `false` signale une désynchronisation.

### `reindex()`

```ts
const report = await manager.reindex();
// { resources: 12, indexed: 12, durationMs: 4 }
```

Reconstruit l'index plein texte depuis `ekts.db`, dans une transaction unique. Sert à réparer une
désynchronisation (arrêt brutal en WAL, base restaurée).

## 4. Erreurs

Toutes dérivent de `EktsError` (`src/shared/errors.ts`) et exposent un `code` stable.

| Classe | `code` | Déclencheur |
|--------|--------|-------------|
| `ResourceNotFoundError` | `RESOURCE_NOT_FOUND` | `getResourceOrThrow`, `updateResource`, `deleteResource` |
| `ValidationError` | `VALIDATION_FAILED` | Entrée refusée par Zod |
| `IndexingError` | `INDEXING_FAILED` | Échec de réindexation |

```ts
import { EktsError } from './src/shared/errors.js';

try {
  await manager.updateResource(id, { title: '' });
} catch (error) {
  if (error instanceof EktsError) {
    console.error(error.code, error.message); // VALIDATION_FAILED title : Le titre est obligatoire
    console.log(JSON.stringify(error.toJSON())); // exploitable par la CLI --json
  }
}
```

`ValidationError.issues` contient un message par champ fautif, préfixé de son chemin
(`metadata.author : Requis`).

## 5. Règles métier

1. **Type immuable.** Une ressource ne change pas de nature après création : un article reste un
   article. Reclasser impose de supprimer et recréer.
2. **Tags normalisés.** Espaces retirés, doublons casse-insensibles écartés, 50 tags au maximum,
   64 caractères par tag.
3. **Validation avant I/O.** Une entrée invalide échoue sans accès disque.
4. **Écriture atomique.** Ressource, index FTS et purge vectorielle partagent une transaction : pas
   d'index orphelin ni de ressource non indexée.
5. **Pas de suppression implicite.** Toute opération sur un identifiant inconnu lève
   `ResourceNotFoundError`, sauf `getResource` qui retourne `null`.

## 6. Tests

```bash
npm test                    # 119 tests
npm run coverage            # 100 %
```

| Fichier | Portée |
|---------|--------|
| `tests/unit/errors.test.ts` | Codes, sérialisation, cause |
| `tests/unit/normalize-tags.test.ts` | Normalisation, `parseInput` |
| `tests/integration/knowledge-manager.test.ts` | CRUD, validation, immuabilité, tags, stats, réindexation |
| `tests/integration/indexer.test.ts` | Intégrité, réindexation, cas limites, erreur encapsulée |
| `tests/unit/indexer-contract.test.ts` | Respect du contrat `IIndexer` et injection dans le manager |

## 7. Diagnostic en ligne de commande

```powershell
npm run build
npm run db:inspect     # état des bases + cohérence de l'index
npm run db:reindex     # reconstruit l'index si nécessaire
```

## 8. Ce que le Sprint 4 branchera

- `IIndexer` (déjà défini dans `src/business/indexer.ts`) étendu à l'indexation vectorielle :
  un indexeur composite (plein texte + vecteurs) pourra être injecté dans `KnowledgeManager`
  sans changer sa signature ;
- `searchResources()` sur `KnowledgeManager` (recherche hybride BM25 + vecteurs, fusion RRF) ;
- le vecteur est déjà purgé à la suppression : aucune reprise à prévoir côté `deleteResource`.

## 9. Références

- [Data Layer](DATA_LAYER.md)
- [SETUP](SETUP.md)
- [Architecture](../blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)
- [ADR-005 — Architecture C hybride](../blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md)
