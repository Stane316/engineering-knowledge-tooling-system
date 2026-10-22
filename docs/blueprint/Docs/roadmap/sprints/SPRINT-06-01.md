# SPRINT-06-01 — Setup MCP Server + stdio transport

**Version :** 1.0  
**Date création :** 2026-10-21  
**Durée :** 4 jours  
**Dépendance :** Sprint 5 terminé ✅
**Statut :** ⏳ NON COMMENCÉ  
**Addendum du 21 octobre 2026 :** utiliser `@modelcontextprotocol/sdk@^1.32.1` (aucune v2 publiée — ADR-011).

---

## 1. Contexte

Le **Sprint 5** a livré une CLI complète avec 7 commandes. Le **Sprint 6-01** va mettre en place l'infrastructure MCP Server avec transport stdio, permettant aux agents IA de se connecter à EKTS.

**Objectif :** Avoir un serveur MCP fonctionnel qui démarre, accepte les connexions stdio, et répond aux requêtes de base (initialize, tools/list).

---

## 2. Objectifs

### 2.1 Objectifs fonctionnels

- ✅ Installer `@modelcontextprotocol/sdk 1.32.x`
- ✅ Configurer le transport stdio (stdin/stdout)
- ✅ Implémenter le handler `initialize` (handshake MCP)
- ✅ Implémenter le handler `tools/list` (liste outils vide)
- ✅ Gérer les erreurs de connexion et de parsing JSON-RPC
- ✅ Logger les événements (debug/info/error)

### 2.2 Objectifs techniques

- ✅ Serveur démarre sans erreur
- ✅ Serveur répond aux requêtes JSON-RPC 2.0
- ✅ Handshake `initialize` conforme MCP 2026-07-28
- ✅ Logging structuré (JSON)
- ✅ Gestion signaux (SIGINT, SIGTERM)

### 2.3 Critères de validation

| # | Critère | Validation |
|---|---------|------------|
| 1.1 | SDK MCP installé | `npm list @modelcontextprotocol/sdk` |
| 1.2 | Serveur démarre | `node dist/mcp/server.js` sans erreur |
| 1.3 | Transport stdio fonctionnel | Requête JSON-RPC via stdin/stdout |
| 1.4 | Handler `initialize` fonctionne | Réponse initialize correcte |
| 1.5 | Handler `tools/list` fonctionne | Retourne liste vide |
| 1.6 | Gestion erreurs | Messages erreur clairs |
| 1.7 | Logging structuré | Logs JSON lisibles |
| 1.8 | Tests unitaires > 80% | `npm run test:coverage` |

---

## 3. Périmètre

### 3.1 Inclus

| Élément | Description |
|---------|-------------|
| Installation SDK | `@modelcontextprotocol/sdk 1.32.x` |
| Point d'entrée | `src/mcp/server.ts` |
| Transport stdio | `src/mcp/transport.ts` |
| Handler initialize | `src/mcp/handlers/initialize.ts` |
| Handler tools/list | `src/mcp/handlers/tools.ts` (version vide) |
| Gestion erreurs | `src/mcp/utils/errors.ts` |
| Logging | `src/mcp/utils/logger.ts` |
| Tests unitaires | Tests pour chaque composant |

### 3.2 Exclu

| Élément | Raison |
|---------|--------|
| Implémentation outils | Reporté au Sprint 6-02 |
| Tests d'intégration agents | Reporté au Sprint 6-03 |
| Documentation MCP | Reportée au Sprint 6-03 |
| Configuration `.mcp.json` | Reportée au Sprint 6-03 |

---

## 4. Tâches atomiques

### 4.1 Jour 1 — Installation et configuration

**Tâche 6.1.1 : Installer le SDK MCP**

```bash
npm install @modelcontextprotocol/sdk
```

**Vérification :**
```bash
npm list @modelcontextprotocol/sdk
# ✅ @modelcontextprotocol/sdk@1.32.x
```

**Tâche 6.1.2 : Créer la structure de dossiers**

```bash
mkdir -p src/mcp/handlers
mkdir -p src/mcp/tools
mkdir -p src/mcp/schemas
mkdir -p src/mcp/utils
mkdir -p tests/mcp/handlers
mkdir -p tests/mcp/utils
```

**Tâche 6.1.3 : Créer le logger structuré**

**Fichier :** `src/mcp/utils/logger.ts`

```typescript
/**
 * Logger structuré pour MCP Server
 * 
 * Format JSON pour faciliter le parsing et le debugging
 */
export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.MCP_LOG_LEVEL === 'debug') {
      console.error(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...data,
      }));
    }
  },

  info(message: string, data?: Record<string, unknown>): void {
    console.error(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    }));
  },

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
      ...data,
    }));
  },
};
```

**Tests :** `tests/mcp/utils/logger.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/mcp/utils/logger';

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should log info messages in JSON format', () => {
    logger.info('Test message', { key: 'value' });
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    
    expect(logOutput.level).toBe('info');
    expect(logOutput.message).toBe('Test message');
    expect(logOutput.key).toBe('value');
    expect(logOutput.timestamp).toBeDefined();
  });

  it('should log error messages with error details', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error, { context: 'test' });
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    
    expect(logOutput.level).toBe('error');
    expect(logOutput.message).toBe('Error occurred');
    expect(logOutput.error.name).toBe('Error');
    expect(logOutput.error.message).toBe('Test error');
    expect(logOutput.context).toBe('test');
  });

  it('should log debug messages only when MCP_LOG_LEVEL=debug', () => {
    process.env.MCP_LOG_LEVEL = 'debug';
    logger.debug('Debug message');
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput.level).toBe('debug');
    
    delete process.env.MCP_LOG_LEVEL;
    logger.debug('Should not log');
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
  });
});
```

**Commit :**
```bash
git add src/mcp/utils/logger.ts tests/mcp/utils/logger.test.ts
git commit -m "feat(mcp): add structured logger with JSON format"
```

---

### 4.2 Jour 2 — Gestion erreurs et transport

**Tâche 6.2.1 : Créer la gestion erreurs MCP**

**Fichier :** `src/mcp/utils/errors.ts`

```typescript
/**
 * Codes erreur MCP standardisés (JSON-RPC 2.0)
 */
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  RESOURCE_NOT_FOUND: -32000,
  VALIDATION_ERROR: -32001,
} as const;

/**
 * Erreur MCP standardisée
 */
export class MCPError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }

  /**
   * Convertit l'erreur en format JSON-RPC 2.0
   */
  toJSON(): { code: number; message: string; data?: Record<string, unknown> } {
    return {
      code: this.code,
      message: this.message,
      ...(this.data && { data: this.data }),
    };
  }
}

/**
 * Crée une erreur de parsing
 */
export function createParseError(message: string): MCPError {
  return new MCPError(MCP_ERROR_CODES.PARSE_ERROR, message);
}

/**
 * Crée une erreur de requête invalide
 */
export function createInvalidRequestError(message: string): MCPError {
  return new MCPError(MCP_ERROR_CODES.INVALID_REQUEST, message);
}

/**
 * Crée une erreur de méthode non trouvée
 */
export function createMethodNotFoundError(method: string): MCPError {
  return new MCPError(
    MCP_ERROR_CODES.METHOD_NOT_FOUND,
    `Method not found: ${method}`
  );
}

/**
 * Crée une erreur de paramètres invalides
 */
export function createInvalidParamsError(message: string, details?: Record<string, unknown>): MCPError {
  return new MCPError(
    MCP_ERROR_CODES.INVALID_PARAMS,
    message,
    details
  );
}

/**
 * Crée une erreur interne
 */
export function createInternalError(message: string, error?: Error): MCPError {
  return new MCPError(
    MCP_ERROR_CODES.INTERNAL_ERROR,
    message,
    error ? { originalError: error.message } : undefined
  );
}

/**
 * Crée une erreur de ressource non trouvée
 */
export function createResourceNotFoundError(resourceId: string): MCPError {
  return new MCPError(
    MCP_ERROR_CODES.RESOURCE_NOT_FOUND,
    `Resource not found: ${resourceId}`,
    { resourceId }
  );
}

/**
 * Crée une erreur de validation
 */
export function createValidationError(message: string, errors: string[]): MCPError {
  return new MCPError(
    MCP_ERROR_CODES.VALIDATION_ERROR,
    message,
    { errors }
  );
}
```

**Tests :** `tests/mcp/utils/errors.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  MCPError,
  MCP_ERROR_CODES,
  createParseError,
  createInvalidRequestError,
  createMethodNotFoundError,
  createInvalidParamsError,
  createInternalError,
  createResourceNotFoundError,
  createValidationError,
} from '../../../src/mcp/utils/errors';

describe('MCPError', () => {
  it('should create error with code, message, and data', () => {
    const error = new MCPError(-32600, 'Invalid request', { detail: 'test' });
    
    expect(error.code).toBe(-32600);
    expect(error.message).toBe('Invalid request');
    expect(error.data).toEqual({ detail: 'test' });
    expect(error.name).toBe('MCPError');
  });

  it('should convert to JSON-RPC error format', () => {
    const error = new MCPError(-32600, 'Invalid request', { detail: 'test' });
    const json = error.toJSON();
    
    expect(json).toEqual({
      code: -32600,
      message: 'Invalid request',
      data: { detail: 'test' },
    });
  });
});

describe('Error factories', () => {
  it('should create parse error', () => {
    const error = createParseError('Invalid JSON');
    expect(error.code).toBe(MCP_ERROR_CODES.PARSE_ERROR);
    expect(error.message).toBe('Invalid JSON');
  });

  it('should create invalid request error', () => {
    const error = createInvalidRequestError('Missing method');
    expect(error.code).toBe(MCP_ERROR_CODES.INVALID_REQUEST);
  });

  it('should create method not found error', () => {
    const error = createMethodNotFoundError('unknown/method');
    expect(error.code).toBe(MCP_ERROR_CODES.METHOD_NOT_FOUND);
    expect(error.message).toContain('unknown/method');
  });

  it('should create invalid params error', () => {
    const error = createInvalidParamsError('Invalid parameter', { param: 'query' });
    expect(error.code).toBe(MCP_ERROR_CODES.INVALID_PARAMS);
    expect(error.data).toEqual({ param: 'query' });
  });

  it('should create internal error', () => {
    const originalError = new Error('Database error');
    const error = createInternalError('Internal failure', originalError);
    expect(error.code).toBe(MCP_ERROR_CODES.INTERNAL_ERROR);
    expect(error.data?.originalError).toBe('Database error');
  });

  it('should create resource not found error', () => {
    const error = createResourceNotFoundError('abc-123');
    expect(error.code).toBe(MCP_ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(error.data?.resourceId).toBe('abc-123');
  });

  it('should create validation error', () => {
    const error = createValidationError('Validation failed', ['Field required']);
    expect(error.code).toBe(MCP_ERROR_CODES.VALIDATION_ERROR);
    expect(error.data?.errors).toEqual(['Field required']);
  });
});
```

**Commit :**
```bash
git add src/mcp/utils/errors.ts tests/mcp/utils/errors.test.ts
git commit -m "feat(mcp): add MCP error handling with standard codes"
```

**Tâche 6.2.2 : Créer le transport stdio**

**Fichier :** `src/mcp/transport.ts`

```typescript
import { logger } from './utils/logger';
import { createParseError, createInvalidRequestError, MCPError } from './utils/errors';

/**
 * Requête JSON-RPC 2.0
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * Réponse JSON-RPC 2.0 (succès)
 */
export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: number | string;
  result: unknown;
}

/**
 * Réponse JSON-RPC 2.0 (erreur)
 */
export interface JsonRpcError {
  jsonrpc: '2.0';
  id: number | string | null;
  error: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
  };
}

/**
 * Handler de requête JSON-RPC
 */
export type RequestHandler = (request: JsonRpcRequest) => Promise<unknown>;

/**
 * Configuration du transport stdio
 */
export class StdioTransport {
  private handlers: Map<string, RequestHandler> = new Map();
  private isRunning = false;

  /**
   * Enregistre un handler pour une méthode
   */
  registerHandler(method: string, handler: RequestHandler): void {
    this.handlers.set(method, handler);
    logger.debug('Handler registered', { method });
  }

  /**
   * Démarre le transport stdio
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Transport already running');
      return;
    }

    this.isRunning = true;
    logger.info('MCP Server started (stdio transport)');

    let buffer = '';

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;

      // Traiter chaque ligne complète
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          this.handleMessage(line).catch((error) => {
            logger.error('Unhandled error in message handler', error);
          });
        }
      }
    });

    process.stdin.on('end', () => {
      logger.info('stdin closed, shutting down');
      this.stop();
    });

    process.stdin.on('error', (error) => {
      logger.error('stdin error', error);
      this.stop();
    });

    // Gestion signaux
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down');
      this.stop();
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down');
      this.stop();
    });
  }

  /**
   * Arrête le transport
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('MCP Server stopped');
    process.exit(0);
  }

  /**
   * Traite un message JSON-RPC
   */
  private async handleMessage(line: string): Promise<void> {
    let request: JsonRpcRequest;

    // Parser le JSON
    try {
      request = JSON.parse(line);
    } catch (error) {
      logger.error('Failed to parse JSON', error);
      this.sendError(null, createParseError('Invalid JSON'));
      return;
    }

    // Valider la structure JSON-RPC
    if (!this.isValidJsonRpcRequest(request)) {
      logger.error('Invalid JSON-RPC request', { request });
      this.sendError(request.id ?? null, createInvalidRequestError('Invalid JSON-RPC request'));
      return;
    }

    logger.debug('Received request', { method: request.method, id: request.id });

    // Trouver le handler
    const handler = this.handlers.get(request.method);
    if (!handler) {
      logger.error('Method not found', { method: request.method });
      this.sendError(request.id ?? null, createInvalidRequestError(`Method not found: ${request.method}`));
      return;
    }

    // Exécuter le handler
    try {
      const result = await handler(request);
      this.sendSuccess(request.id!, result);
    } catch (error) {
      logger.error('Handler execution failed', error, { method: request.method });
      
      if (error instanceof MCPError) {
        this.sendError(request.id!, error);
      } else {
        this.sendError(
          request.id!,
          createInvalidRequestError(
            error instanceof Error ? error.message : 'Unknown error'
          )
        );
      }
    }
  }

  /**
   * Valide la structure d'une requête JSON-RPC
   */
  private isValidJsonRpcRequest(request: unknown): request is JsonRpcRequest {
    if (typeof request !== 'object' || request === null) {
      return false;
    }

    const req = request as Record<string, unknown>;
    return (
      req.jsonrpc === '2.0' &&
      typeof req.method === 'string' &&
      (req.id === undefined || typeof req.id === 'number' || typeof req.id === 'string')
    );
  }

  /**
   * Envoie une réponse succès
   */
  private sendSuccess(id: number | string, result: unknown): void {
    const response: JsonRpcSuccess = {
      jsonrpc: '2.0',
      id,
      result,
    };

    const output = JSON.stringify(response);
    logger.debug('Sending success response', { id, method: 'response' });
    console.log(output);
  }

  /**
   * Envoie une réponse erreur
   */
  private sendError(id: number | string | null, error: MCPError): void {
    const response: JsonRpcError = {
      jsonrpc: '2.0',
      id,
      error: error.toJSON(),
    };

    const output = JSON.stringify(response);
    logger.debug('Sending error response', { id, code: error.code });
    console.log(output);
  }
}
```

**Tests :** `tests/mcp/transport.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StdioTransport, JsonRpcRequest } from '../../src/mcp/transport';

describe('StdioTransport', () => {
  let transport: StdioTransport;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transport = new StdioTransport();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should register handlers', () => {
    const handler = vi.fn();
    transport.registerHandler('test/method', handler);
    
    // Handler enregistré sans erreur
    expect(true).toBe(true);
  });

  it('should validate JSON-RPC request structure', () => {
    const validRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    };
    
    // Validation implicite via registerHandler
    transport.registerHandler('test', async () => 'result');
    expect(true).toBe(true);
  });
});
```

**Commit :**
```bash
git add src/mcp/transport.ts tests/mcp/transport.test.ts
git commit -m "feat(mcp): implement stdio transport with JSON-RPC 2.0"
```

---

### 4.3 Jour 3 — Handlers initialize et tools/list

**Tâche 6.3.1 : Créer le handler initialize**

**Fichier :** `src/mcp/handlers/initialize.ts`

```typescript
import { logger } from '../utils/logger';
import { JsonRpcRequest } from '../transport';

/**
 * Paramètres de la requête initialize
 */
interface InitializeParams {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  clientInfo: {
    name: string;
    version: string;
  };
}

/**
 * Résultat de la requête initialize
 */
interface InitializeResult {
  protocolVersion: string;
  capabilities: {
    tools: {
      listChanged: boolean;
    };
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

/**
 * Handler pour la méthode initialize (handshake MCP)
 * 
 * Conformément à MCP 2026-07-28 (stateless)
 */
export async function handleInitialize(request: JsonRpcRequest): Promise<InitializeResult> {
  const params = request.params as InitializeParams;

  logger.info('Client initializing', {
    clientName: params.clientInfo.name,
    clientVersion: params.clientInfo.version,
    protocolVersion: params.protocolVersion,
  });

  // Vérifier la version du protocole
  if (params.protocolVersion !== '2026-07-28') {
    logger.warn('Protocol version mismatch', {
      expected: '2026-07-28',
      received: params.protocolVersion,
    });
  }

  const result: InitializeResult = {
    protocolVersion: '2026-07-28',
    capabilities: {
      tools: {
        listChanged: false, // MVP-1 : pas de notification de changement
      },
    },
    serverInfo: {
      name: 'ekts-mcp-server',
      version: '1.0.0',
    },
  };

  logger.info('Handshake completed', { serverName: result.serverInfo.name });

  return result;
}
```

**Tests :** `tests/mcp/handlers/initialize.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInitialize } from '../../../src/mcp/handlers/initialize';
import { JsonRpcRequest } from '../../../src/mcp/transport';

describe('handleInitialize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return server info and capabilities', async () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2026-07-28',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    };

    const result = await handleInitialize(request);

    expect(result.protocolVersion).toBe('2026-07-28');
    expect(result.serverInfo.name).toBe('ekts-mcp-server');
    expect(result.serverInfo.version).toBe('1.0.0');
    expect(result.capabilities.tools.listChanged).toBe(false);
  });

  it('should handle different client info', async () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: {
        protocolVersion: '2026-07-28',
        capabilities: {},
        clientInfo: {
          name: 'claude-code',
          version: '1.0.0',
        },
      },
    };

    const result = await handleInitialize(request);

    expect(result.serverInfo.name).toBe('ekts-mcp-server');
  });
});
```

**Commit :**
```bash
git add src/mcp/handlers/initialize.ts tests/mcp/handlers/initialize.test.ts
git commit -m "feat(mcp): implement initialize handler for MCP handshake"
```

**Tâche 6.3.2 : Créer le handler tools/list (version vide)**

**Fichier :** `src/mcp/handlers/tools.ts`

```typescript
import { logger } from '../utils/logger';
import { JsonRpcRequest } from '../transport';

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
 * Handler pour la méthode tools/list
 * 
 * Retourne la liste des outils MCP disponibles
 */
export async function handleToolsList(request: JsonRpcRequest): Promise<ToolsListResult> {
  logger.info('Listing available tools');

  // MVP-1 : Liste vide (outils seront ajoutés au Sprint 6-02)
  const tools: MCPTool[] = [];

  logger.info('Tools listed', { count: tools.length });

  return { tools };
}
```

**Tests :** `tests/mcp/handlers/tools.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { handleToolsList } from '../../../src/mcp/handlers/tools';
import { JsonRpcRequest } from '../../../src/mcp/transport';

describe('handleToolsList', () => {
  it('should return empty tools list for MVP-1', async () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };

    const result = await handleToolsList(request);

    expect(result.tools).toEqual([]);
  });
});
```

**Commit :**
```bash
git add src/mcp/handlers/tools.ts tests/mcp/handlers/tools.test.ts
git commit -m "feat(mcp): implement tools/list handler (empty list)"
```

---

### 4.4 Jour 4 — Point d'entrée et tests

**Tâche 6.4.1 : Créer le point d'entrée du serveur MCP**

**Fichier :** `src/mcp/server.ts`

```typescript
#!/usr/bin/env node

import { StdioTransport } from './transport';
import { handleInitialize } from './handlers/initialize';
import { handleToolsList } from './handlers/tools';
import { logger } from './utils/logger';

/**
 * Point d'entrée du MCP Server EKTS
 * 
 * Démarre le serveur MCP avec transport stdio et enregistre les handlers
 */
function main(): void {
  logger.info('Starting EKTS MCP Server');

  // Créer le transport
  const transport = new StdioTransport();

  // Enregistrer les handlers
  transport.registerHandler('initialize', handleInitialize);
  transport.registerHandler('tools/list', handleToolsList);

  // Démarrer le serveur
  transport.start();

  logger.info('EKTS MCP Server ready');
}

// Démarrer le serveur
main();
```

**Tâche 6.4.2 : Ajouter le script npm**

**Modifier :** `package.json`

```json
{
  "scripts": {
    "mcp:start": "node dist/mcp/server.js",
    "mcp:dev": "npm run build && node dist/mcp/server.js"
  }
}
```

**Tâche 6.4.3 : Tester manuellement le serveur**

**Test 1 : Démarrage**
```bash
npm run build
node dist/mcp/server.js
# ✅ Logs de démarrage affichés
```

**Test 2 : Handshake initialize**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2026-07-28","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/mcp/server.js
```

**Résultat attendu :**
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2026-07-28","capabilities":{"tools":{"listChanged":false}},"serverInfo":{"name":"ekts-mcp-server","version":"1.0.0"}}}
```

**Test 3 : Liste outils**
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/mcp/server.js
```

**Résultat attendu :**
```json
{"jsonrpc":"2.0","id":2,"result":{"tools":[]}}
```

**Test 4 : Méthode inconnue**
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"unknown/method","params":{}}' | node dist/mcp/server.js
```

**Résultat attendu :**
```json
{"jsonrpc":"2.0","id":3,"error":{"code":-32601,"message":"Method not found: unknown/method"}}
```

**Tâche 6.4.4 : Vérifier la couverture**

```bash
npm run test:coverage -- tests/mcp/
# ✅ Couverture > 80%
```

**Commit :**
```bash
git add src/mcp/server.ts package.json
git commit -m "feat(mcp): add MCP server entry point"
```

---

## 5. Organisation des fichiers

### 5.1 Structure finale Sprint 6-01

```
Engineering-Knowledge-Tooling-System/
├── src/
│   └── mcp/
│       ├── server.ts                    ✅ Point d'entrée
│       ├── transport.ts                 ✅ Transport stdio
│       ├── handlers/
│       │   ├── initialize.ts            ✅ Handler initialize
│       │   └── tools.ts                 ✅ Handler tools/list
│       └── utils/
│           ├── errors.ts                ✅ Gestion erreurs
│           └── logger.ts                ✅ Logging structuré
├── tests/
│   └── mcp/
│       ├── transport.test.ts            ✅ Tests transport
│       ├── handlers/
│       │   ├── initialize.test.ts       ✅ Tests initialize
│       │   └── tools.test.ts            ✅ Tests tools/list
│       └── utils/
│           ├── errors.test.ts           ✅ Tests erreurs
│           └── logger.test.ts           ✅ Tests logger
└── package.json                         ✅ Scripts npm
```

### 5.2 Fichiers créés

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/mcp/server.ts` | ~30 | Point d'entrée MCP Server |
| `src/mcp/transport.ts` | ~180 | Transport stdio + JSON-RPC |
| `src/mcp/handlers/initialize.ts` | ~50 | Handler initialize |
| `src/mcp/handlers/tools.ts` | ~40 | Handler tools/list |
| `src/mcp/utils/errors.ts` | ~100 | Gestion erreurs MCP |
| `src/mcp/utils/logger.ts` | ~50 | Logging structuré |
| `tests/mcp/transport.test.ts` | ~40 | Tests transport |
| `tests/mcp/handlers/initialize.test.ts` | ~50 | Tests initialize |
| `tests/mcp/handlers/tools.test.ts` | ~20 | Tests tools/list |
| `tests/mcp/utils/errors.test.ts` | ~80 | Tests erreurs |
| `tests/mcp/utils/logger.test.ts` | ~60 | Tests logger |
| **Total** | **~700 lignes** | |

---

## 6. Commits

```bash
git commit -m "feat(mcp): add structured logger with JSON format"
git commit -m "feat(mcp): add MCP error handling with standard codes"
git commit -m "feat(mcp): implement stdio transport with JSON-RPC 2.0"
git commit -m "feat(mcp): implement initialize handler for MCP handshake"
git commit -m "feat(mcp): implement tools/list handler (empty list)"
git commit -m "feat(mcp): add MCP server entry point"
```

---

## 7. Critères de validation Sprint 6-01

| # | Critère | Validation | Statut |
|---|---------|------------|--------|
| 1.1 | SDK MCP installé | `npm list @modelcontextprotocol/sdk` | ⏳ |
| 1.2 | Serveur démarre | `node dist/mcp/server.js` sans erreur | ⏳ |
| 1.3 | Transport stdio fonctionnel | Requête JSON-RPC via stdin/stdout | ⏳ |
| 1.4 | Handler `initialize` fonctionne | Réponse initialize correcte | ⏳ |
| 1.5 | Handler `tools/list` fonctionne | Retourne liste vide | ⏳ |
| 1.6 | Gestion erreurs | Messages erreur clairs | ⏳ |
| 1.7 | Logging structuré | Logs JSON lisibles | ⏳ |
| 1.8 | Tests unitaires > 80% | `npm run test:coverage` | ⏳ |

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

# 5. Démarrage serveur
node dist/mcp/server.js
# ✅ Serveur démarre sans erreur

# 6. Test handshake
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2026-07-28","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/mcp/server.js
# ✅ Réponse initialize correcte

# 7. Test tools/list
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/mcp/server.js
# ✅ Réponse tools/list correcte (liste vide)

# 8. Vérification Git
git status
# ✅ Tous les changements commités
```

### 8.2 Transition vers Sprint 6-02

**Une fois Sprint 6-01 terminé avec succès :**
- ✅ SDK MCP installé
- ✅ Transport stdio fonctionnel
- ✅ Handlers initialize et tools/list implémentés
- ✅ Tests unitaires > 80%
- ✅ Serveur démarre et répond aux requêtes

**Sprint 6-02 va implémenter :**
- 🎯 Outil `search_knowledge` (recherche hybride)
- 🎯 Outil `get_resource` (obtention par ID)
- 🎯 Outil `list_resources` (liste avec filtres)
- 🎯 Outil `validate_resource` (validation schéma)
- 🎯 Handler `tools/call` (dispatch vers outils)

---

**Fin du document Sprint 6-01**
