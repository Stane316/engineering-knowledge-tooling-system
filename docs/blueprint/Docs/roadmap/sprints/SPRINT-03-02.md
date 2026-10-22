# Sprint 3-2 — Knowledge Manager CRUD suite (update, delete) + tests complets

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 4 jours  
**Objectif :** Implémenter les 2 dernières méthodes + tests complets  
**Dépendance :** Sprint 3-1 ✅

---

## 1. Contexte

Le Sprint 3-1 a implémenté les 3 premières méthodes du Knowledge Manager (add, get, list).  
Le Sprint 3-2 va compléter le CRUD avec `updateResource` et `deleteResource`, puis ajouter les tests complets.

**Méthodes à implémenter :**
- ✅ `updateResource(id: string, data: Partial<Resource>): Promise<Resource>`
- ✅ `deleteResource(id: string): Promise<void>`
- ✅ Tests unitaires complets Knowledge Manager (> 80% couverture)

---

## 2. État initial (fin Sprint 3-1)

```
src/
├── business/
│   ├── knowledge-manager.types.ts  ✅ (interfaces)
│   └── knowledge-manager.ts        ✅ (3 méthodes : add, get, list)
├── data/
│   └── resource-repository.ts      ✅ (CRUD complet)
├── schemas/
│   └── resource.ts                 ✅ (UpdateResourceSchema)
└── utils/
    └── errors.ts                   ✅ (ResourceNotFoundError, ValidationError)

tests/
└── business/
    └── knowledge-manager.test.ts   ✅ (8 tests pour add, get, list)
```

---

## 3. Tâches atomiques

### 3.1 Implémenter updateResource (jour 1, matin — 4h)

**Fichier :** `src/business/knowledge-manager.ts`

**Implémentation :**

```typescript
async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
  // 1. Vérifier que la ressource existe
  const existing = await this.repository.getById(id);
  if (!existing) {
    throw new ResourceNotFoundError(id);
  }

  // 2. Validation Zod (partial update)
  const parseResult = UpdateResourceSchema.safeParse(data);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(e => e.message).join(', ');
    throw new ValidationError(`Invalid input: ${errors}`);
  }

  // 3. Construire la ressource mise à jour
  const updated: Resource = {
    ...existing,
    ...parseResult.data,
    id: existing.id,          // Ne pas permettre le changement d'ID
    created_at: existing.created_at,  // Ne pas permettre le changement de created_at
    updated_at: getTimestamp(),  // Toujours mettre à jour updated_at
  };

  // 4. Sauvegarder dans ekts.db
  const result = await this.repository.update(id, updated);

  // 5. TODO: Réindexation FTS (Sprint 3-3)
  // await this.indexer.indexFTS(result);

  return result;
}
```

**Imports à ajouter :**
```typescript
import { UpdateResourceSchema } from '../schemas/resource';
```

**Tests :**

```typescript
describe('updateResource', () => {
  it('should update a resource and return the updated version', async () => {
    const existing = {
      id: '123',
      title: 'Old Title',
      type: 'article' as const,
      tags: ['old'],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    
    const updateData = { title: 'New Title', tags: ['new'] };
    const updated = { ...existing, ...updateData, updated_at: expect.any(String) };

    (mockRepository.getById as any).mockResolvedValue(existing);
    (mockRepository.update as any).mockResolvedValue(updated);

    const result = await manager.updateResource('123', updateData);

    expect(mockRepository.getById).toHaveBeenCalledWith('123');
    expect(mockRepository.update).toHaveBeenCalledWith('123', expect.objectContaining({
      title: 'New Title',
      tags: ['new'],
    }));
    expect(result.title).toBe('New Title');
    expect(result.tags).toEqual(['new']);
  });

  it('should throw ResourceNotFoundError when resource does not exist', async () => {
    (mockRepository.getById as any).mockResolvedValue(null);

    await expect(
      manager.updateResource('999', { title: 'Test' })
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ValidationError with invalid update data', async () => {
    const existing = { id: '123', title: 'Test', type: 'article' };
    (mockRepository.getById as any).mockResolvedValue(existing);

    await expect(
      manager.updateResource('123', { type: 'invalid' as any })
    ).rejects.toThrow(ValidationError);
  });

  it('should not allow changing the resource ID', async () => {
    const existing = { id: '123', title: 'Test', type: 'article' };
    (mockRepository.getById as any).mockResolvedValue(existing);
    (mockRepository.update as any).mockImplementation((id, data) => Promise.resolve(data));

    const result = await manager.updateResource('123', { id: '456' } as any);

    expect(result.id).toBe('123');  // ID original conservé
  });

  it('should not allow changing created_at', async () => {
    const existing = { 
      id: '123', 
      title: 'Test', 
      type: 'article',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    (mockRepository.getById as any).mockResolvedValue(existing);
    (mockRepository.update as any).mockImplementation((id, data) => Promise.resolve(data));

    const result = await manager.updateResource('123', { 
      created_at: '2099-01-01T00:00:00Z' 
    } as any);

    expect(result.created_at).toBe('2026-01-01T00:00:00Z');  // created_at original conservé
  });

  it('should update updated_at timestamp', async () => {
    const existing = { 
      id: '123', 
      title: 'Test', 
      type: 'article',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    (mockRepository.getById as any).mockResolvedValue(existing);
    (mockRepository.update as any).mockImplementation((id, data) => Promise.resolve(data));

    const result = await manager.updateResource('123', { title: 'Updated' });

    expect(result.updated_at).not.toBe('2026-01-01T00:00:00Z');
    expect(new Date(result.updated_at).getTime()).toBeGreaterThan(
      new Date(existing.updated_at).getTime()
    );
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ 14 tests passent (8 précédents + 6 updateResource)

npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git add tests/business/knowledge-manager.test.ts
git commit -m "feat(business): implement Knowledge Manager updateResource"
```

### 3.2 Implémenter deleteResource (jour 1, après-midi — 4h)

**Fichier :** `src/business/knowledge-manager.ts`

**Implémentation :**

```typescript
async deleteResource(id: string): Promise<void> {
  // 1. Vérifier que la ressource existe
  const existing = await this.repository.getById(id);
  if (!existing) {
    throw new ResourceNotFoundError(id);
  }

  // 2. Supprimer de ekts.db
  await this.repository.delete(id);

  // 3. TODO: Suppression FTS (Sprint 3-3)
  // await this.indexer.removeFTS(id);
}
```

**Tests :**

```typescript
describe('deleteResource', () => {
  it('should delete an existing resource', async () => {
    const existing = { id: '123', title: 'Test', type: 'article' };
    (mockRepository.getById as any).mockResolvedValue(existing);
    (mockRepository.delete as any).mockResolvedValue(undefined);

    await manager.deleteResource('123');

    expect(mockRepository.getById).toHaveBeenCalledWith('123');
    expect(mockRepository.delete).toHaveBeenCalledWith('123');
  });

  it('should throw ResourceNotFoundError when resource does not exist', async () => {
    (mockRepository.getById as any).mockResolvedValue(null);

    await expect(manager.deleteResource('999')).rejects.toThrow(ResourceNotFoundError);
  });

  it('should call repository.delete with correct ID', async () => {
    const existing = { id: 'abc-123', title: 'Test', type: 'article' };
    (mockRepository.getById as any).mockResolvedValue(existing);
    (mockRepository.delete as any).mockResolvedValue(undefined);

    await manager.deleteResource('abc-123');

    expect(mockRepository.delete).toHaveBeenCalledWith('abc-123');
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ 17 tests passent (14 précédents + 3 deleteResource)
```

**Commit :**
```bash
git add src/business/knowledge-manager.ts
git add tests/business/knowledge-manager.test.ts
git commit -m "feat(business): implement Knowledge Manager deleteResource"
```

### 3.3 Tests complémentaires — Scénarios avancés (jour 2, matin — 4h)

**Tests d'intégration partielle (avec mocks avancés) :**

```typescript
describe('KnowledgeManager — Scénarios avancés', () => {
  describe('addResource integration', () => {
    it('should handle concurrent adds', async () => {
      (mockRepository.create as any).mockImplementation((r) => Promise.resolve(r));

      const promises = [
        manager.addResource({ type: 'article', title: 'Test 1' }),
        manager.addResource({ type: 'article', title: 'Test 2' }),
        manager.addResource({ type: 'article', title: 'Test 3' }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockRepository.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateResource edge cases', () => {
    it('should handle empty update (no changes)', async () => {
      const existing = { 
        id: '123', 
        title: 'Test', 
        type: 'article',
        tags: [],
        metadata: {},
        url: null,
        content: null,
        embedding_model: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      (mockRepository.getById as any).mockResolvedValue(existing);
      (mockRepository.update as any).mockImplementation((id, data) => Promise.resolve(data));

      const result = await manager.updateResource('123', {});

      expect(result.title).toBe('Test');  // Pas de changement
      expect(result.updated_at).not.toBe(existing.updated_at);  // Mais updated_at mis à jour
    });

    it('should handle partial update (only one field)', async () => {
      const existing = {
        id: '123',
        title: 'Old Title',
        type: 'article',
        tags: ['tag1'],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      (mockRepository.getById as any).mockResolvedValue(existing);
      (mockRepository.update as any).mockImplementation((id, data) => Promise.resolve(data));

      const result = await manager.updateResource('123', { title: 'New Title' });

      expect(result.title).toBe('New Title');
      expect(result.tags).toEqual(['tag1']);  // Tags inchangés
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      (mockRepository.create as any).mockRejectedValue(new Error('DB error'));

      await expect(
        manager.addResource({ type: 'article', title: 'Test' })
      ).rejects.toThrow('DB error');
    });

    it('should handle empty string ID', async () => {
      (mockRepository.getById as any).mockResolvedValue(null);

      await expect(manager.getResource('')).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
```

**Validation :**
```bash
npm test tests/business/knowledge-manager.test.ts
# ✅ ~22 tests passent
```

**Commit :**
```bash
git add tests/business/knowledge-manager.test.ts
git commit -m "test(business): add advanced test scenarios for Knowledge Manager"
```

### 3.4 Tests complets et couverture (jour 2-3 — 4h)

**Vérification de la couverture :**

```bash
npm run test:coverage -- tests/business/knowledge-manager.test.ts
```

**Objectif :**
- ✅ Statements > 80%
- ✅ Branches > 80%
- ✅ Functions > 80%
- ✅ Lines > 80%

**Si couverture insuffisante, ajouter des tests pour :**
- Cas limites (chaînes vides, tableaux vides, null)
- Branches conditionnelles (if/else)
- Gestion des erreurs

**Commit :**
```bash
git add tests/business/knowledge-manager.test.ts
git commit -m "test(business): add complete unit tests for Knowledge Manager"
```

### 3.5 Commit final et push Sprint 3-2 (jour 4)

**Vérifications finales :**

```bash
# 1. Tests
npm test tests/business/knowledge-manager.test.ts
# ✅ ~22 tests passent

# 2. Couverture
npm run test:coverage -- tests/business/knowledge-manager.test.ts
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Push
git push origin feat/sprint-3-2
```

**Point de contrôle Sprint 3-2 :**
- ✅ `updateResource` fonctionnel (vérification existence + validation + mise à jour)
- ✅ `deleteResource` fonctionnel (vérification existence + suppression)
- ✅ Tests unitaires complets (> 80% couverture)
- ✅ Tests scénarios avancés (concurrence, edge cases, erreurs)
- ✅ 5 méthodes CRUD complètes (add, get, list, update, delete)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/business/knowledge-manager.ts` | ~150 | 5 méthodes complètes |
| `tests/business/knowledge-manager.test.ts` | ~300 | ~22 tests complets |

**Total ajouté Sprint 3-2 :** ~350 lignes

---

## 5. Commits

```bash
git commit -m "feat(business): implement Knowledge Manager updateResource"
git commit -m "feat(business): implement Knowledge Manager deleteResource"
git commit -m "test(business): add advanced test scenarios for Knowledge Manager"
git commit -m "test(business): add complete unit tests for Knowledge Manager"
```

---

## 6. Transition vers Sprint 3-3

**Prérequis pour Sprint 3-3 :**
- ✅ Sprint 3-2 terminé avec succès
- ✅ 5 méthodes CRUD complètes
- ✅ Tests > 80% couverture
- ✅ Code pushé sur `feat/sprint-3-2`

**Sprint 3-3 va implémenter :**
- Indexer FTS (orchestration synchronisation)
- Intégration Indexer dans Knowledge Manager
- Documentation API complète

---

**Fin du document Sprint 3-2**
