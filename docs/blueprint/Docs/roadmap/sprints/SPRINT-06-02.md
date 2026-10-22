# SPRINT-06-02 — Implémentation des 4 outils MCP

**Version :** 1.0  
**Date création :** 2026-10-21  
**Durée :** 3 jours  
**Dépendance :** Sprint 6-01 terminé ✅
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Contexte

Le **Sprint 6-01** a mis en place l'infrastructure MCP Server avec transport stdio, handlers `initialize` et `tools/list`. Le **Sprint 6-02** va implémenter les 4 outils MCP qui exposent les capacités d'EKTS aux agents IA.

**Objectif :** Avoir 4 outils MCP fonctionnels (search_knowledge, get_resource, list_resources, validate_resource) avec gestion erreurs robuste.

---

## 2. Objectifs

### 2.1 Objectifs fonctionnels

- ✅ Implémenter l'outil `search_knowledge` (recherche hybride FTS + Vector + RRF)
- ✅ Implémenter l'outil `get_resource` (obtention par ID)
- ✅ Implémenter l'outil `list_resources` (liste avec filtres)
- ✅ Implémenter l'outil `validate_resource` (validation schéma Zod)
- ✅ Implémenter le handler `tools/call` (dispatch vers outils)
- ✅ Mettre à jour `tools/list` pour retourner les 4 outils
- ✅ Gestion erreurs pour chaque outil

### 2.2 Objectifs techniques

- ✅ Schémas JSON pour chaque outil (inputSchema)
- ✅ Intégration avec services existants (Knowledge Manager, Search Engine)
- ✅ Validation paramètres avant appel service
- ✅ Conversion erreurs service en erreurs MCP
- ✅ Tests unitaires pour chaque outil
- ✅ Couverture tests > 80%

### 2.3 Critères de validation

| # | Critère | Validation |
|---|---------|------------|
| 2.1 | Outil `search_knowledge` fonctionne | Test unitaire + manuel |
| 2.2 | Outil `get_resource` fonctionne | Test unitaire + manuel |
| 2.3 | Outil `list_resources` fonctionne | Test unitaire + manuel |
| 2.4 | Outil `validate_resource` fonctionne | Test unitaire + manuel |
| 2.5 | Handler `tools/call` dispatch correctement | Test unitaire |
| 2.6 | `tools/list` retourne 4 outils | Test unitaire + manuel |
| 2.7 | Gestion erreurs (codes MCP) | Tests erreurs passent |
| 2.8 | Tests unitaires > 80% | `npm run test:coverage` |

---

## 3. Périmètre

### 3.1 Inclus

| Élément | Description |
|---------|-------------|
| Outil search_knowledge | Recherche hybride via Search Engine |
| Outil get_resource | Obtention ressource via Knowledge Manager |
| Outil list_resources | Liste ressources via Knowledge Manager |
| Outil validate_resource | Validation schéma via Zod |
| Handler tools/call | Dispatch vers outils |
| Schémas JSON | inputSchema pour chaque outil |
| Tests unitaires | Tests pour chaque outil + handler |

### 3.2 Exclu

| Élément | Raison |
|---------|--------|
| Tests d'intégration agents | Reporté au Sprint 6-03 |
| Documentation MCP | Reportée au Sprint 6-03 |
| Configuration `.mcp.json` | Reportée au Sprint 6-03 |
| Outils MVP-2/MVP-3 | Reportés aux sprints suivants |

---

## 4. Tâches atomiques

### 4.1 Jour 1 — Schémas JSON et outil search_knowledge

**Tâche 6.2.1 : Créer les schémas JSON pour les outils**

**Fichier :** `src/mcp/schemas/tool-schemas.ts`

```typescript
/**
 * Schémas JSON pour les outils MCP
 * 
 * Définit les paramètres d'entrée pour chaque outil
 */

/**
 * Schéma pour l'outil search_knowledge
 */
export const searchKnowledgeSchema = {
  type: 'object' as const,
  properties: {
    query: {
      type: 'string',
      description: 'Requête de recherche',
    },
    limit: {
      type: 'number',
      description: 'Nombre maximum de résultats (défaut: 10)',
      default: 10,
    },
    mode: {
      type: 'string',
      enum: ['hybrid', 'fts', 'vector'],
      description: 'Mode de recherche (défaut: hybrid)',
      default: 'hybrid',
    },
    type: {
      type: 'string',
      enum: ['article', 'video', 'tutorial', 'tool', 'other'],
      description: 'Filtrer par type de ressource',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filtrer par tags',
    },
  },
  required: ['query'],
};

/**
 * Schéma pour l'outil get_resource
 */
export const getResourceSchema = {
  type: 'object' as const,
  properties: {
    id: {
      type: 'string',
      description: 'ID de la ressource',
    },
  },
  required: ['id'],
};

/**
 * Schéma pour l'outil list_resources
 */
export const listResourcesSchema = {
  type: 'object' as const,
  properties: {
    type: {
      type: 'string',
      enum: ['article', 'video', 'tutorial', 'tool', 'other'],
      description: 'Filtrer par type de ressource',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filtrer par tags',
    },
    limit: {
      type: 'number',
      description: 'Nombre maximum de résultats',
    },
  },
};

/**
 * Schéma pour l'outil validate_resource
 */
export const validateResourceSchema = {
  type: 'object' as const,
  properties: {
    data: {
      type: 'object',
      description: 'Données de la ressource à valider',
    },
  },
  required: ['data'],
};
```

**Tests :** `tests/mcp/schemas/tool-schemas.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  searchKnowledgeSchema,
  getResourceSchema,
  listResourcesSchema,
  validateResourceSchema,
} from '../../../src/mcp/schemas/tool-schemas';

describe('Tool schemas', () => {
  it('should define search_knowledge schema', () => {
    expect(searchKnowledgeSchema.type).toBe('object');
    expect(searchKnowledgeSchema.properties.query).toBeDefined();
    expect(searchKnowledgeSchema.required).toContain('query');
  });

  it('should define get_resource schema', () => {
    expect(getResourceSchema.type).toBe('object');
    expect(getResourceSchema.properties.id).toBeDefined();
    expect(getResourceSchema.required).toContain('id');
  });

  it('should define list_resources schema', () => {
    expect(listResourcesSchema.type).toBe('object');
    expect(listResourcesSchema.properties.type).toBeDefined();
  });

  it('should define validate_resource schema', () => {
    expect(validateResourceSchema.type).toBe('object');
    expect(validateResourceSchema.properties.data).toBeDefined();
    expect(validateResourceSchema.required).toContain('data');
  });
});
```

**Commit :**
```bash
git add src/mcp/schemas/tool-schemas.ts tests/mcp/schemas/tool-schemas.test.ts
git commit -m "feat(mcp): add JSON schemas for MCP tools"
```

**Tâche 6.2.2 : Implémenter l'outil search_knowledge**

**Fichier :** `src/mcp/tools/search-knowledge.ts`

```typescript
import { SearchEngine } from '../../business/search-engine';
import { createSearchEngine } from '../../cli/services';
import { logger } from '../utils/logger';
import { createInvalidParamsError, createInternalError } from '../utils/errors';

/**
 * Paramètres de l'outil search_knowledge
 */
interface SearchKnowledgeParams {
  query: string;
  limit?: number;
  mode?: 'hybrid' | 'fts' | 'vector';
  type?: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  tags?: string[];
}

/**
 * Résultat de l'outil search_knowledge
 */
interface SearchKnowledgeResult {
  results: Array<{
    resource: {
      id: string;
      type: string;
      title: string;
      url: string | null;
      tags: string[];
      content: string | null;
      created_at: string;
      updated_at: string;
    };
    score: number;
    source: 'fts' | 'vector' | 'hybrid';
  }>;
  count: number;
}

/**
 * Outil search_knowledge — Recherche hybride (FTS + Vector + RRF)
 */
export async function executeSearchKnowledge(
  params: SearchKnowledgeParams
): Promise<SearchKnowledgeResult> {
  logger.info('Executing search_knowledge', { query: params.query });

  // Valider les paramètres
  if (!params.query || params.query.trim() === '') {
    throw createInvalidParamsError('Query is required and cannot be empty');
  }

  if (params.limit !== undefined && (params.limit < 1 || params.limit > 100)) {
    throw createInvalidParamsError('Limit must be between 1 and 100');
  }

  try {
    // Créer le Search Engine
    const searchEngine = createSearchEngine();

    // Effectuer la recherche
    const results = await searchEngine.search(params.query, {
      limit: params.limit ?? 10,
      mode: params.mode ?? 'hybrid',
      type: params.type,
      tags: params.tags,
    });

    logger.info('Search completed', { count: results.length });

    return {
      results: results.map(r => ({
        resource: {
          id: r.resource.id,
          type: r.resource.type,
          title: r.resource.title,
          url: r.resource.url,
          tags: r.resource.tags,
          content: r.resource.content,
          created_at: r.resource.created_at,
          updated_at: r.resource.updated_at,
        },
        score: r.score,
        source: r.source,
      })),
      count: results.length,
    };
  } catch (error) {
    logger.error('Search failed', error, { query: params.query });
    throw createInternalError(
      error instanceof Error ? error.message : 'Search failed',
      error instanceof Error ? error : undefined
    );
  }
}
```

**Tests :** `tests/mcp/tools/search-knowledge.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSearchKnowledge } from '../../../src/mcp/tools/search-knowledge';
import { SearchEngine } from '../../../src/business/search-engine';

// Mock du Search Engine
vi.mock('../../../src/cli/services', () => ({
  createSearchEngine: vi.fn(() => ({
    search: vi.fn(),
  })),
}));

describe('executeSearchKnowledge', () => {
  let mockSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const { createSearchEngine } = require('../../../src/cli/services');
    mockSearch = createSearchEngine().search;
  });

  it('should return search results', async () => {
    mockSearch.mockResolvedValue([
      {
        resource: {
          id: '1',
          type: 'article',
          title: 'Test Article',
          url: null,
          tags: [],
          content: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        score: 0.5,
        source: 'hybrid',
      },
    ]);

    const result = await executeSearchKnowledge({ query: 'test' });

    expect(result.results).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(mockSearch).toHaveBeenCalledWith('test', {
      limit: 10,
      mode: 'hybrid',
      type: undefined,
      tags: undefined,
    });
  });

  it('should throw error for empty query', async () => {
    await expect(executeSearchKnowledge({ query: '' })).rejects.toThrow();
    await expect(executeSearchKnowledge({ query: '   ' })).rejects.toThrow();
  });

  it('should throw error for invalid limit', async () => {
    await expect(
      executeSearchKnowledge({ query: 'test', limit: 0 })
    ).rejects.toThrow();
    await expect(
      executeSearchKnowledge({ query: 'test', limit: 101 })
    ).rejects.toThrow();
  });

  it('should pass filters to search engine', async () => {
    mockSearch.mockResolvedValue([]);

    await executeSearchKnowledge({
      query: 'test',
      limit: 5,
      mode: 'fts',
      type: 'article',
      tags: ['sqlite', 'tutorial'],
    });

    expect(mockSearch).toHaveBeenCalledWith('test', {
      limit: 5,
      mode: 'fts',
      type: 'article',
      tags: ['sqlite', 'tutorial'],
    });
  });
});
```

**Commit :**
```bash
git add src/mcp/tools/search-knowledge.ts tests/mcp/tools/search-knowledge.test.ts
git commit -m "feat(mcp): implement search_knowledge tool"
```

---

### 4.2 Jour 2 — Outils get_resource, list_resources, validate_resource

**Tâche 6.2.3 : Implémenter l'outil get_resource**

**Fichier :** `src/mcp/tools/get-resource.ts`

```typescript
import { createKnowledgeManager } from '../../cli/services';
import { logger } from '../utils/logger';
import { createInvalidParamsError, createResourceNotFoundError, createInternalError } from '../utils/errors';

/**
 * Paramètres de l'outil get_resource
 */
interface GetResourceParams {
  id: string;
}

/**
 * Résultat de l'outil get_resource
 */
interface GetResourceResult {
  resource: {
    id: string;
    type: string;
    title: string;
    url: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
    content: string | null;
    embedding_model: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

/**
 * Outil get_resource — Obtient une ressource par ID
 */
export async function executeGetResource(
  params: GetResourceParams
): Promise<GetResourceResult> {
  logger.info('Executing get_resource', { id: params.id });

  // Valider les paramètres
  if (!params.id || params.id.trim() === '') {
    throw createInvalidParamsError('ID is required and cannot be empty');
  }

  try {
    // Créer le Knowledge Manager
    const knowledgeManager = createKnowledgeManager();

    // Obtenir la ressource
    const resource = await knowledgeManager.getResource(params.id);

    if (!resource) {
      throw createResourceNotFoundError(params.id);
    }

    logger.info('Resource retrieved', { id: params.id });

    return { resource };
  } catch (error) {
    if (error.name === 'MCPError') {
      throw error; // Re-throw MCP errors
    }
    logger.error('Get resource failed', error, { id: params.id });
    throw createInternalError(
      error instanceof Error ? error.message : 'Get resource failed',
      error instanceof Error ? error : undefined
    );
  }
}
```

**Tests :** `tests/mcp/tools/get-resource.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetResource } from '../../../src/mcp/tools/get-resource';

// Mock du Knowledge Manager
vi.mock('../../../src/cli/services', () => ({
  createKnowledgeManager: vi.fn(() => ({
    getResource: vi.fn(),
  })),
}));

describe('executeGetResource', () => {
  let mockGetResource: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const { createKnowledgeManager } = require('../../../src/cli/services');
    mockGetResource = createKnowledgeManager().getResource;
  });

  it('should return resource when found', async () => {
    const resource = {
      id: '1',
      type: 'article',
      title: 'Test Article',
      url: null,
      tags: [],
      metadata: {},
      content: null,
      embedding_model: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    mockGetResource.mockResolvedValue(resource);

    const result = await executeGetResource({ id: '1' });

    expect(result.resource).toEqual(resource);
    expect(mockGetResource).toHaveBeenCalledWith('1');
  });

  it('should throw error for empty ID', async () => {
    await expect(executeGetResource({ id: '' })).rejects.toThrow();
    await expect(executeGetResource({ id: '   ' })).rejects.toThrow();
  });

  it('should throw resource not found error', async () => {
    mockGetResource.mockResolvedValue(null);

    await expect(executeGetResource({ id: 'nonexistent' })).rejects.toThrow();
  });
});
```

**Commit :**
```bash
git add src/mcp/tools/get-resource.ts tests/mcp/tools/get-resource.test.ts
git commit -m "feat(mcp): implement get_resource tool"
```

**Tâche 6.2.4 : Implémenter l'outil list_resources**

**Fichier :** `src/mcp/tools/list-resources.ts`

```typescript
import { createKnowledgeManager } from '../../cli/services';
import { logger } from '../utils/logger';
import { createInvalidParamsError, createInternalError } from '../utils/errors';

/**
 * Paramètres de l'outil list_resources
 */
interface ListResourcesParams {
  type?: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  tags?: string[];
  limit?: number;
}

/**
 * Résultat de l'outil list_resources
 */
interface ListResourcesResult {
  resources: Array<{
    id: string;
    type: string;
    title: string;
    url: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
  }>;
  count: number;
}

/**
 * Outil list_resources — Liste les ressources avec filtres
 */
export async function executeListResources(
  params: ListResourcesParams
): Promise<ListResourcesResult> {
  logger.info('Executing list_resources', { filters: params });

  // Valider les paramètres
  if (params.limit !== undefined && (params.limit < 1 || params.limit > 1000)) {
    throw createInvalidParamsError('Limit must be between 1 and 1000');
  }

  try {
    // Créer le Knowledge Manager
    const knowledgeManager = createKnowledgeManager();

    // Lister les ressources
    const resources = await knowledgeManager.listResources({
      type: params.type,
      tags: params.tags,
      limit: params.limit,
    });

    logger.info('Resources listed', { count: resources.length });

    return {
      resources: resources.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
        tags: r.tags,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      count: resources.length,
    };
  } catch (error) {
    logger.error('List resources failed', error);
    throw createInternalError(
      error instanceof Error ? error.message : 'List resources failed',
      error instanceof Error ? error : undefined
    );
  }
}
```

**Tests :** `tests/mcp/tools/list-resources.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeListResources } from '../../../src/mcp/tools/list-resources';

// Mock du Knowledge Manager
vi.mock('../../../src/cli/services', () => ({
  createKnowledgeManager: vi.fn(() => ({
    listResources: vi.fn(),
  })),
}));

describe('executeListResources', () => {
  let mockListResources: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const { createKnowledgeManager } = require('../../../src/cli/services');
    mockListResources = createKnowledgeManager().listResources;
  });

  it('should return list of resources', async () => {
    const resources = [
      {
        id: '1',
        type: 'article',
        title: 'Test 1',
        url: null,
        tags: [],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];
    mockListResources.mockResolvedValue(resources);

    const result = await executeListResources({});

    expect(result.resources).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(mockListResources).toHaveBeenCalledWith({
      type: undefined,
      tags: undefined,
      limit: undefined,
    });
  });

  it('should throw error for invalid limit', async () => {
    await expect(
      executeListResources({ limit: 0 })
    ).rejects.toThrow();
    await expect(
      executeListResources({ limit: 1001 })
    ).rejects.toThrow();
  });

  it('should pass filters to knowledge manager', async () => {
    mockListResources.mockResolvedValue([]);

    await executeListResources({
      type: 'article',
      tags: ['sqlite'],
      limit: 10,
    });

    expect(mockListResources).toHaveBeenCalledWith({
      type: 'article',
      tags: ['sqlite'],
      limit: 10,
    });
  });
});
```

**Commit :**
```bash
git add src/mcp/tools/list-resources.ts tests/mcp/tools/list-resources.test.ts
git commit -m "feat(mcp): implement list_resources tool"
```

**Tâche 6.2.5 : Implémenter l'outil validate_resource**

**Fichier :** `src/mcp/tools/validate-resource.ts`

```typescript
import { CreateResourceSchema } from '../../schemas/resource';
import { logger } from '../utils/logger';
import { createInvalidParamsError, createValidationError } from '../utils/errors';

/**
 * Paramètres de l'outil validate_resource
 */
interface ValidateResourceParams {
  data: unknown;
}

/**
 * Résultat de l'outil validate_resource
 */
interface ValidateResourceResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Outil validate_resource — Valide un schéma de ressource
 */
export async function executeValidateResource(
  params: ValidateResourceParams
): Promise<ValidateResourceResult> {
  logger.info('Executing validate_resource');

  // Valider les paramètres
  if (params.data === undefined || params.data === null) {
    throw createInvalidParamsError('Data is required');
  }

  try {
    // Valider avec Zod
    const result = CreateResourceSchema.safeParse(params.data);

    if (result.success) {
      logger.info('Validation successful');
      return { valid: true };
    } else {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      logger.info('Validation failed', { errors });
      return { valid: false, errors };
    }
  } catch (error) {
    logger.error('Validation error', error);
    throw createValidationError(
      error instanceof Error ? error.message : 'Validation failed',
      []
    );
  }
}
```

**Tests :** `tests/mcp/tools/validate-resource.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeValidateResource } from '../../../src/mcp/tools/validate-resource';

describe('executeValidateResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return valid for correct data', async () => {
    const data = {
      type: 'article',
      title: 'Test Article',
      tags: ['test'],
    };

    const result = await executeValidateResource({ data });

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid data', async () => {
    const data = {
      type: 'invalid',
      title: '',
    };

    const result = await executeValidateResource({ data });

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('should throw error for null data', async () => {
    await expect(
      executeValidateResource({ data: null })
    ).rejects.toThrow();
  });

  it('should throw error for undefined data', async () => {
    await expect(
      executeValidateResource({ data: undefined })
    ).rejects.toThrow();
  });
});
```

**Commit :**
```bash
git add src/mcp/tools/validate-resource.ts tests/mcp/tools/validate-resource.test.ts
git commit -m "feat(mcp): implement validate_resource tool"
```

---

### 4.3 Jour 3 — Handler tools/call et mise à jour tools/list

**Tâche 6.3.1 : Implémenter le handler tools/call**

**Modifier :** `src/mcp/handlers/tools.ts`

```typescript
import { logger } from '../utils/logger';
import { JsonRpcRequest } from '../transport';
import { createMethodNotFoundError, createInvalidParamsError } from '../utils/errors';
import { executeSearchKnowledge } from '../tools/search-knowledge';
import { executeGetResource } from '../tools/get-resource';
import { executeListResources } from '../tools/list-resources';
import { executeValidateResource } from '../tools/validate-resource';
import {
  searchKnowledgeSchema,
  getResourceSchema,
  listResourcesSchema,
  validateResourceSchema,
} from '../schemas/tool-schemas';

/**
 * Outil MCP
 */
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Résultat de la requête tools/list
 */
interface ToolsListResult {
  tools: MCPTool[];
}

/**
 * Résultat de la requête tools/call
 */
interface ToolsCallResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Handler pour la méthode tools/list
 * 
 * Retourne la liste des outils MCP disponibles
 */
export async function handleToolsList(request: JsonRpcRequest): Promise<ToolsListResult> {
  logger.info('Listing available tools');

  const tools: MCPTool[] = [
    {
      name: 'search_knowledge',
      description: 'Recherche hybride (FTS + Vector + RRF) dans les ressources de connaissance',
      inputSchema: searchKnowledgeSchema,
    },
    {
      name: 'get_resource',
      description: 'Obtient une ressource par son ID',
      inputSchema: getResourceSchema,
    },
    {
      name: 'list_resources',
      description: 'Liste les ressources avec filtres optionnels',
      inputSchema: listResourcesSchema,
    },
    {
      name: 'validate_resource',
      description: 'Valide un schéma de ressource',
      inputSchema: validateResourceSchema,
    },
  ];

  logger.info('Tools listed', { count: tools.length });

  return { tools };
}

/**
 * Handler pour la méthode tools/call
 * 
 * Dispatch vers l'outil approprié
 */
export async function handleToolsCall(request: JsonRpcRequest): Promise<ToolsCallResult> {
  const params = request.params as { name: string; arguments?: Record<string, unknown> };

  if (!params.name) {
    throw createInvalidParamsError('Tool name is required');
  }

  logger.info('Calling tool', { name: params.name });

  const toolName = params.name;
  const args = params.arguments ?? {};

  try {
    let result: unknown;

    switch (toolName) {
      case 'search_knowledge':
        result = await executeSearchKnowledge(args as any);
        break;
      case 'get_resource':
        result = await executeGetResource(args as any);
        break;
      case 'list_resources':
        result = await executeListResources(args as any);
        break;
      case 'validate_resource':
        result = await executeValidateResource(args as any);
        break;
      default:
        throw createMethodNotFoundError(toolName);
    }

    logger.info('Tool executed successfully', { name: toolName });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Tool execution failed', error, { name: toolName });

    return {
      content: [
        {
          type: 'text',
          text: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      isError: true,
    };
  }
}
```

**Tests :** `tests/mcp/handlers/tools.test.ts` (mise à jour)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleToolsList, handleToolsCall } from '../../../src/mcp/handlers/tools';
import { JsonRpcRequest } from '../../../src/mcp/transport';

// Mock des outils
vi.mock('../../../src/mcp/tools/search-knowledge', () => ({
  executeSearchKnowledge: vi.fn(),
}));

vi.mock('../../../src/mcp/tools/get-resource', () => ({
  executeGetResource: vi.fn(),
}));

vi.mock('../../../src/mcp/tools/list-resources', () => ({
  executeListResources: vi.fn(),
}));

vi.mock('../../../src/mcp/tools/validate-resource', () => ({
  executeValidateResource: vi.fn(),
}));

describe('handleToolsList', () => {
  it('should return 4 tools', async () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };

    const result = await handleToolsList(request);

    expect(result.tools).toHaveLength(4);
    expect(result.tools.map(t => t.name)).toEqual([
      'search_knowledge',
      'get_resource',
      'list_resources',
      'validate_resource',
    ]);
  });
});

describe('handleToolsCall', () => {
  it('should dispatch to search_knowledge', async () => {
    const { executeSearchKnowledge } = require('../../../src/mcp/tools/search-knowledge');
    executeSearchKnowledge.mockResolvedValue({ results: [], count: 0 });

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_knowledge',
        arguments: { query: 'test' },
      },
    };

    const result = await handleToolsCall(request);

    expect(executeSearchKnowledge).toHaveBeenCalledWith({ query: 'test' });
    expect(result.content[0].type).toBe('text');
  });

  it('should throw error for unknown tool', async () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {},
      },
    };

    await expect(handleToolsCall(request)).rejects.toThrow();
  });

  it('should return error content on tool failure', async () => {
    const { executeSearchKnowledge } = require('../../../src/mcp/tools/search-knowledge');
    executeSearchKnowledge.mockRejectedValue(new Error('Search failed'));

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_knowledge',
        arguments: { query: 'test' },
      },
    };

    const result = await handleToolsCall(request);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Search failed');
  });
});
```

**Commit :**
```bash
git add src/mcp/handlers/tools.ts tests/mcp/handlers/tools.test.ts
git commit -m "feat(mcp): implement tools/call handler with 4 tools"
```

**Tâche 6.3.2 : Mettre à jour le point d'entrée**

**Modifier :** `src/mcp/server.ts`

```typescript
#!/usr/bin/env node

import { StdioTransport } from './transport';
import { handleInitialize } from './handlers/initialize';
import { handleToolsList, handleToolsCall } from './handlers/tools';
import { logger } from './utils/logger';

/**
 * Point d'entrée du MCP Server EKTS
 */
function main(): void {
  logger.info('Starting EKTS MCP Server');

  const transport = new StdioTransport();

  // Enregistrer les handlers
  transport.registerHandler('initialize', handleInitialize);
  transport.registerHandler('tools/list', handleToolsList);
  transport.registerHandler('tools/call', handleToolsCall);

  transport.start();

  logger.info('EKTS MCP Server ready', { tools: 4 });
}

main();
```

**Commit :**
```bash
git add src/mcp/server.ts
git commit -m "feat(mcp): register tools/call handler"
```

**Tâche 6.3.3 : Tester manuellement les outils**

**Test 1 : Lister les outils**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/mcp/server.js
```

**Résultat attendu :**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "search_knowledge",
        "description": "Recherche hybride (FTS + Vector + RRF)...",
        "inputSchema": { ... }
      },
      ...
    ]
  }
}
```

**Test 2 : Appeler search_knowledge**
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_knowledge","arguments":{"query":"SQLite"}}}' | node dist/mcp/server.js
```

**Résultat attendu :**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"results\":[...],\"count\":5}"
      }
    ]
  }
}
```

**Test 3 : Appeler get_resource**
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_resource","arguments":{"id":"<id>"}}}' | node dist/mcp/server.js
```

**Test 4 : Appeler list_resources**
```bash
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_resources","arguments":{"type":"article"}}}' | node dist/mcp/server.js
```

**Test 5 : Appeler validate_resource**
```bash
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"validate_resource","arguments":{"data":{"type":"article","title":"Test"}}}}' | node dist/mcp/server.js
```

**Tâche 6.3.4 : Vérifier la couverture**

```bash
npm run test:coverage -- tests/mcp/
# ✅ Couverture > 80%
```

**Commit :**
```bash
git push origin feat/sprint-6-02
```

---

## 5. Organisation des fichiers

### 5.1 Structure finale Sprint 6-02

```
Engineering-Knowledge-Tooling-System/
├── src/
│   └── mcp/
│       ├── server.ts                    ✅ Point d'entrée (mis à jour)
│       ├── transport.ts                 ✅ Transport stdio
│       ├── handlers/
│       │   ├── initialize.ts            ✅ Handler initialize
│       │   └── tools.ts                 ✅ Handler tools/list + tools/call
│       ├── tools/
│       │   ├── search-knowledge.ts      ✅ Outil search_knowledge
│       │   ├── get-resource.ts          ✅ Outil get_resource
│       │   ├── list-resources.ts        ✅ Outil list_resources
│       │   └── validate-resource.ts     ✅ Outil validate_resource
│       ├── schemas/
│       │   └── tool-schemas.ts          ✅ Schémas JSON
│       └── utils/
│           ├── errors.ts                ✅ Gestion erreurs
│           └── logger.ts                ✅ Logging
├── tests/
│   └── mcp/
│       ├── transport.test.ts            ✅
│       ├── handlers/
│       │   ├── initialize.test.ts       ✅
│       │   └── tools.test.ts            ✅ (mis à jour)
│       ├── tools/
│       │   ├── search-knowledge.test.ts ✅
│       │   ├── get-resource.test.ts     ✅
│       │   ├── list-resources.test.ts   ✅
│       │   └── validate-resource.test.ts ✅
│       ├── schemas/
│       │   └── tool-schemas.test.ts     ✅
│       └── utils/
│           ├── errors.test.ts           ✅
│           └── logger.test.ts           ✅
└── package.json
```

### 5.2 Fichiers créés Sprint 6-02

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/mcp/schemas/tool-schemas.ts` | ~100 | Schémas JSON |
| `src/mcp/tools/search-knowledge.ts` | ~70 | Outil search_knowledge |
| `src/mcp/tools/get-resource.ts` | ~60 | Outil get_resource |
| `src/mcp/tools/list-resources.ts` | ~60 | Outil list_resources |
| `src/mcp/tools/validate-resource.ts` | ~50 | Outil validate_resource |
| `tests/mcp/schemas/tool-schemas.test.ts` | ~30 | Tests schémas |
| `tests/mcp/tools/search-knowledge.test.ts` | ~60 | Tests search_knowledge |
| `tests/mcp/tools/get-resource.test.ts` | ~50 | Tests get_resource |
| `tests/mcp/tools/list-resources.test.ts` | ~50 | Tests list_resources |
| `tests/mcp/tools/validate-resource.test.ts` | ~40 | Tests validate_resource |
| **Total Sprint 6-02** | **~570 lignes** | |

---

## 6. Commits

```bash
git commit -m "feat(mcp): add JSON schemas for MCP tools"
git commit -m "feat(mcp): implement search_knowledge tool"
git commit -m "feat(mcp): implement get_resource tool"
git commit -m "feat(mcp): implement list_resources tool"
git commit -m "feat(mcp): implement validate_resource tool"
git commit -m "feat(mcp): implement tools/call handler with 4 tools"
git commit -m "feat(mcp): register tools/call handler"
```

---

## 7. Critères de validation Sprint 6-02

| # | Critère | Validation | Statut |
|---|---------|------------|--------|
| 2.1 | Outil `search_knowledge` fonctionne | Test unitaire + manuel | ⏳ |
| 2.2 | Outil `get_resource` fonctionne | Test unitaire + manuel | ⏳ |
| 2.3 | Outil `list_resources` fonctionne | Test unitaire + manuel | ⏳ |
| 2.4 | Outil `validate_resource` fonctionne | Test unitaire + manuel | ⏳ |
| 2.5 | Handler `tools/call` dispatch correctement | Test unitaire | ⏳ |
| 2.6 | `tools/list` retourne 4 outils | Test unitaire + manuel | ⏳ |
| 2.7 | Gestion erreurs (codes MCP) | Tests erreurs passent | ⏳ |
| 2.8 | Tests unitaires > 80% | `npm run test:coverage` | ⏳ |

---

## 8. Procédure de fin de sous-sprint

### 8.1 Vérifications finales

```bash
# 1. Compilation
npm run build
# ✅ Aucune erreur

# 2. Linting
npm run lint
# ✅ Aucune erreur

# 3. Tests unitaires
npm test tests/mcp/
# ✅ Tous les tests passent

# 4. Couverture
npm run test:coverage -- tests/mcp/
# ✅ > 80% couverture

# 5. Test tools/list
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/mcp/server.js
# ✅ 4 outils retournés

# 6. Test search_knowledge
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_knowledge","arguments":{"query":"test"}}}' | node dist/mcp/server.js
# ✅ Résultats retournés

# 7. Test get_resource
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_resource","arguments":{"id":"<id>"}}}' | node dist/mcp/server.js
# ✅ Ressource retournée

# 8. Test list_resources
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_resources","arguments":{}}}' | node dist/mcp/server.js
# ✅ Liste retournée

# 9. Test validate_resource
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"validate_resource","arguments":{"data":{"type":"article","title":"Test"}}}}' | node dist/mcp/server.js
# ✅ Validation retournée

# 10. Vérification Git
git status
# ✅ Tous les changements commités
```

### 8.2 Transition vers Sprint 6-03

**Une fois Sprint 6-02 terminé avec succès :**
- ✅ 4 outils MCP implémentés
- ✅ Handler tools/call fonctionnel
- ✅ tools/list retourne 4 outils
- ✅ Tests unitaires > 80%
- ✅ Tests manuels passent

**Sprint 6-03 va implémenter :**
- 🎯 Tests d'intégration avec Claude Code
- 🎯 Tests d'intégration avec Cursor (ou GitHub Copilot)
- 🎯 Documentation MCP complète
- 🎯 Configuration `.mcp.json`
- 🎯 Rapport de compatibilité

---

**Fin du document Sprint 6-02**
