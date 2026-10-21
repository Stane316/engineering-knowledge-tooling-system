# Guide de Conception d'Outils et Services EKTS

**Version :** 1.0  
**Date :** 2026-10-21  
**Statut :** ✅ Terminé

---

## 1. Objectif et périmètre

### 1.1 Objectif

Ce document établit les principes, patterns et standards de conception pour tous les outils EKTS, qu'ils soient exposés via CLI, API REST ou MCP. Il fournit un cadre cohérent pour développer des outils fiables, maintenables et interopérables.

### 1.2 Périmètre

Ce guide couvre :
- Principes de conception fondamentaux
- Architecture d'un outil EKTS
- Patterns de conception réutilisables
- Gestion des entrées/sorties
- Validation des données
- Gestion des erreurs
- Logging et observabilité
- Versionnement et documentation
- Tests et qualité
- Décision : module local vs service séparé

### 1.3 Hors périmètre

- Implémentation spécifique d'un outil (voir livrables des phases suivantes)
- Configuration de l'environnement de développement
- Déploiement et infrastructure

---

## 2. Principes de conception fondamentaux

### 2.1 Principe #1 : Single Responsibility

**Définition :** Un outil fait une chose et la fait bien.

**Application EKTS :**
- ❌ `process_resource` : ne pas faire à la fois la recherche, la validation et la transformation
- ✅ `search_resources` + `validate_resource` + `transform_resource` : trois outils distincts

**Bénéfices :**
- Plus facile à tester
- Plus facile à réutiliser
- Plus facile à maintenir
- Composition possible

### 2.2 Principe #2 : Explicit Over Implicit

**Définition :** Tout ce qui n'est pas évident doit être explicitement déclaré.

**Application EKTS :**
- Schémas d'entrée explicites (JSON Schema pour MCP, types TypeScript pour API)
- Codes de retour explicites (pas de retour `null` ambigu)
- Erreurs typées et documentées
- Logs structurés avec contexte

**Exemple :**
```typescript
// ❌ Implicit
function process(data: any): any {
  // ???
}

// ✅ Explicit
interface SearchInput {
  query: string;
  filters?: {
    domain?: 'web' | 'motion' | '3d';
    tags?: string[];
  };
  pagination?: {
    limit: number;
    offset: number;
  };
}

interface SearchResult {
  items: Resource[];
  total: number;
  hasMore: boolean;
}

function searchResources(input: SearchInput): SearchResult {
  // ...
}
```

### 2.3 Principe #3 : Fail Fast

**Définition :** Détecter et signaler les erreurs le plus tôt possible.

**Application EKTS :**
- Validation des entrées avant traitement
- Vérification des préconditions
- Timeouts sur les opérations externes
- Circuit breaker pour les services dépendants

**Exemple :**
```typescript
// ❌ Fail late
async function getResource(id: string): Promise<Resource> {
  const data = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
  if (!data) {
    throw new Error('Resource not found'); // Erreur détectée tardivement
  }
  return data;
}

// ✅ Fail fast
async function getResource(id: string): Promise<Resource> {
  // Validation immédiate
  if (!id || typeof id !== 'string') {
    throw new ValidationError('id must be a non-empty string');
  }
  
  // Précondition
  if (!await resourceExists(id)) {
    throw new NotFoundError(`Resource ${id} not found`);
  }
  
  const data = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
  return data;
}
```

### 2.4 Principe #4 : Idempotence

**Définition :** Appeler un outil plusieurs fois avec les mêmes paramètres produit le même résultat.

**Application EKTS :**
- Opérations de lecture : toujours idempotentes
- Opérations d'écriture : rendre idempotentes quand possible (ex: upsert au lieu d'insert)
- Opérations non-idempotentes : documenter clairement et exiger confirmation

**Exemple :**
```typescript
// ❌ Non-idempotent
async function addResource(resource: Resource): Promise<void> {
  await db.insert('resources', resource);
  // Appeler 2 fois crée 2 ressources
}

// ✅ Idempotent
async function upsertResource(resource: Resource): Promise<void> {
  await db.upsert('resources', resource.id, resource);
  // Appeler 2 fois = même résultat
}
```

### 2.5 Principe #5 : Least Privilege

**Définition :** Un outil ne reçoit que les permissions strictement nécessaires.

**Application EKTS :**
- Outils de lecture : pas d'accès en écriture
- Outils d'écriture : pas d'accès administrateur
- Outils dangereux : isolation dans des modules séparés
- Secrets : jamais dans les logs, jamais dans les erreurs

**Application MCP :**
- Exposer uniquement les outils nécessaires via MCP
- Auto-approve uniquement les outils sûrs
- Demander confirmation pour les outils dangereux

---

## 3. Architecture d'un outil EKTS

### 3.1 Structure standard

Tout outil EKTS suit cette structure :

```
tool-name/
├── src/
│   ├── index.ts          # Point d'entrée (export public API)
│   ├── types.ts          # Types et interfaces
│   ├── schema.ts         # Schémas de validation (Zod)
│   ├── handler.ts        # Logique métier
│   ├── errors.ts         # Types d'erreurs
│   ├── utils.ts          # Utilitaires internes
│   └── __tests__/        # Tests unitaires
│       ├── handler.test.ts
│       └── integration.test.ts
├── cli/                  # Interface CLI (optionnel)
│   └── index.ts
├── api/                  # Interface API (optionnel)
│   └── routes.ts
├── mcp/                  # Interface MCP (optionnel)
│   └── tools.ts
├── docs/
│   ├── README.md         # Documentation utilisateur
│   ├── API.md            # Documentation technique
│   └── examples/         # Exemples d'utilisation
├── package.json
├── tsconfig.json
├── .eslintrc.js
└── README.md
```

### 3.2 Couches de responsabilité

```
┌─────────────────────────────────────────┐
│         Interface Layer                 │
│  (CLI / API / MCP / Programmatique)     │
├─────────────────────────────────────────┤
│         Validation Layer                │
│  (Input validation, schema checking)    │
├─────────────────────────────────────────┤
│         Business Logic Layer            │
│  (Core functionality, handler)          │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (DB, filesystem, external services)    │
└─────────────────────────────────────────┘
```

**Règle :** Chaque couche ne dépend que des couches inférieures. La couche business logic est indépendante des interfaces.

### 3.3 Dépendances et injection

```typescript
// ❌ Dépendance directe (difficile à tester)
import { database } from './database';

async function getResource(id: string) {
  return database.query('SELECT * FROM resources WHERE id = ?', [id]);
}

// ✅ Injection de dépendances (facile à tester)
interface Dependencies {
  db: Database;
  logger: Logger;
}

async function getResource(id: string, deps: Dependencies) {
  deps.logger.info('Fetching resource', { id });
  return deps.db.query('SELECT * FROM resources WHERE id = ?', [id]);
}
```

---

## 4. Patterns de conception réutilisables

### 4.1 Pattern : Command Pattern

**Usage :** Outils avec plusieurs actions (ex: `ekts resource search`, `ekts resource validate`)

**Structure :**
```typescript
// Command pattern pour CLI
interface Command {
  name: string;
  description: string;
  args: Argument[];
  execute: (args: any, context: Context) => Promise<Result>;
}

const commands: Command[] = [
  {
    name: 'search',
    description: 'Search resources',
    args: [
      { name: 'query', type: 'string', required: true },
      { name: 'domain', type: 'string', required: false }
    ],
    execute: async (args, context) => {
      // ...
    }
  },
  // ...
];
```

### 4.2 Pattern : Pipeline Pattern

**Usage :** Traitement en plusieurs étapes (ex: validation → transformation → sauvegarde)

**Structure :**
```typescript
type Middleware<T> = (input: T, next: (input: T) => Promise<T>) => Promise<T>;

function createPipeline<T>(middlewares: Middleware<T>[]) {
  return async (input: T): Promise<T> => {
    let index = 0;
    
    const next = async (current: T): Promise<T> => {
      if (index >= middlewares.length) {
        return current;
      }
      const middleware = middlewares[index++];
      return middleware(current, next);
    };
    
    return next(input);
  };
}

// Usage
const processResource = createPipeline([
  validateInput,
  checkPermissions,
  transformData,
  saveToDatabase,
  logResult
]);
```

### 4.3 Pattern : Result Pattern

**Usage :** Gestion d'erreurs explicite (pas d'exceptions pour le contrôle de flux)

**Structure :**
```typescript
type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage
async function getResource(id: string): Promise<Result<Resource, ResourceError>> {
  if (!await exists(id)) {
    return err(new NotFoundError(`Resource ${id} not found`));
  }
  
  const resource = await db.query(/* ... */);
  return ok(resource);
}

// Handling
const result = await getResource('123');
if (result.success) {
  console.log('Found:', result.value);
} else {
  console.error('Error:', result.error);
}
```

### 4.4 Pattern : Retry with Backoff

**Usage :** Opérations externes sujettes à des échecs temporaires (réseau, API externes)

**Structure :**
```typescript
interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }
): Promise<T> {
  let lastError: Error;
  let delay = options.initialDelay;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < options.maxRetries) {
        logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: error.message
        });
        await sleep(delay);
        delay = Math.min(delay * options.backoffFactor, options.maxDelay);
      }
    }
  }
  
  throw lastError!;
}
```

### 4.5 Pattern : Circuit Breaker

**Usage :** Protection contre les cascades d'erreurs quand un service externe est down

**Structure :**
```typescript
enum CircuitState {
  CLOSED,    // Normal operation
  OPEN,      // Failing, reject calls
  HALF_OPEN  // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

---

## 5. Gestion des entrées/sorties

### 5.1 Validation des entrées

**Standard :** Utiliser Zod pour la validation (type-safe, runtime validation)

```typescript
import { z } from 'zod';

// Schéma d'entrée
const SearchInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  filters: z.object({
    domain: z.enum(['web', 'motion', '3d']).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional()
  }).optional(),
  pagination: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0)
  }).optional()
});

type SearchInput = z.infer<typeof SearchInputSchema>;

// Validation
function validateInput(input: unknown): SearchInput {
  try {
    return SearchInputSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input', error.errors);
    }
    throw error;
  }
}
```

### 5.2 Format des sorties

**Standard :** Sorties structurées, sérialisables en JSON

```typescript
// ✅ Structuré et prévisible
interface SearchResult {
  items: Resource[];
  total: number;
  hasMore: boolean;
  metadata: {
    queryTime: number;
    cacheHit: boolean;
  };
}

// ❌ Ambigu
type SearchResult = Resource[] | { results: Resource[] } | null;
```

**Règles :**
- Toujours retourner un objet (jamais `null` ou `undefined` pour un résultat vide)
- Inclure des métadonnées utiles (timing, cache, etc.)
- Sérialisable en JSON (pas de fonctions, pas de circular references)
- Types TypeScript explicites

### 5.3 Pagination

**Standard :** Cursor-based pagination pour les grandes collections

```typescript
interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// Usage
interface ListResourcesInput {
  limit?: number;  // default: 20, max: 100
  offset?: number; // default: 0
  cursor?: string; // Pour cursor-based pagination
}
```

---

## 6. Gestion des erreurs

### 6.1 Hiérarchie d'erreurs

```typescript
// Base error class
abstract class EKTSError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
  
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        context: this.context
      }
    };
  }
}

// Specific errors
class ValidationError extends EKTSError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(message: string, public readonly details?: z.ZodIssue[]) {
    super(message, { details });
  }
}

class NotFoundError extends EKTSError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  
  constructor(resource: string, id: string) {
    super(`${resource} not found`, { resource, id });
  }
}

class PermissionError extends EKTSError {
  readonly code = 'PERMISSION_DENIED';
  readonly statusCode = 403;
  
  constructor(action: string) {
    super(`Permission denied for action: ${action}`, { action });
  }
}

class TimeoutError extends EKTSError {
  readonly code = 'TIMEOUT';
  readonly statusCode = 504;
  
  constructor(operation: string, timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`, { operation, timeoutMs });
  }
}

class ExternalServiceError extends EKTSError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
  
  constructor(service: string, reason: string) {
    super(`External service error: ${service}`, { service, reason });
  }
}
```

### 6.2 Mapping des erreurs

| Type d'erreur | Code HTTP | Code MCP | Action |
|---------------|-----------|----------|--------|
| `ValidationError` | 400 | -32602 | Retourner les détails de validation |
| `NotFoundError` | 404 | -32001 | Message clair, suggestion |
| `PermissionError` | 403 | -32002 | Message clair, action requise |
| `TimeoutError` | 504 | -32003 | Retry ou fallback |
| `ExternalServiceError` | 502 | -32004 | Retry avec backoff |
| `UnknownError` | 500 | -32603 | Log complet, message générique |

### 6.3 Gestion des erreurs par interface

**CLI :**
```typescript
try {
  await command.execute(args);
} catch (error) {
  if (error instanceof EKTSError) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.context) {
      console.error(chalk.gray(JSON.stringify(error.context, null, 2)));
    }
    process.exit(error.statusCode);
  } else {
    console.error(chalk.red('Unexpected error'));
    logger.error('Unexpected error', { error });
    process.exit(1);
  }
}
```

**API :**
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof EKTSError) {
    res.status(error.statusCode).json(error.toJSON());
  } else {
    logger.error('Unexpected error', { error });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});
```

**MCP :**
```typescript
server.tool('search_resources', async (input) => {
  try {
    const result = await searchResources(input);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }]
    };
  } catch (error) {
    if (error instanceof EKTSError) {
      return {
        isError: true,
        content: [{ type: 'text', text: error.toJSON() }]
      };
    }
    throw error; // Let MCP SDK handle unexpected errors
  }
});
```

---

## 7. Logging et observabilité

### 7.1 Standard de logging

**Bibliothèque :** Pino (rapide, structuré, JSON)

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' }
    : undefined,
  base: {
    service: 'ekts',
    version: process.env.npm_package_version
  }
});
```

### 7.2 Niveaux de log

| Niveau | Usage | Exemple |
|--------|-------|---------|
| `fatal` | Erreur critique, service down | Database connection lost |
| `error` | Erreur opérationnelle | Failed to fetch resource |
| `warn` | Situation anormale mais gérable | Rate limit approaching |
| `info` | Événements importants | Resource created, search executed |
| `debug` | Informations de debug | Query executed in 45ms |
| `trace` | Traces très détaillées | HTTP request headers |

### 7.3 Structure des logs

```typescript
// ✅ Structuré et riche en contexte
logger.info({
  event: 'resource_search',
  query: 'react animation',
  domain: 'web',
  resultCount: 42,
  durationMs: 123,
  cacheHit: false,
  userId: 'user_123'
}, 'Search executed');

// ❌ Non structuré
logger.info('Search executed: react animation, 42 results, 123ms');
```

### 7.4 Corrélation des logs

```typescript
import { v4 as uuidv4 } from 'uuid';

// Générer un correlation ID pour chaque requête
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Logger avec le correlation ID
logger.info({
  correlationId: req.correlationId,
  event: 'resource_search',
  // ...
});
```

---

## 8. Versionnement et documentation

### 8.1 Versionnement sémantique

**Standard :** SemVer (MAJOR.MINOR.PATCH)

| Changement | Version | Exemple |
|------------|---------|---------|
| Breaking change | MAJOR | 2.0.0 |
| Nouvelle fonctionnalité (backward compatible) | MINOR | 1.1.0 |
| Bug fix (backward compatible) | PATCH | 1.0.1 |

**Règles EKTS :**
- CLI : versionner l'outil complet
- API : versionner dans l'URL (`/v1/resources`)
- MCP : versionner le serveur complet
- Bibliothèques : suivre SemVer strictement

### 8.2 Documentation obligatoire

**Chaque outil doit avoir :**

1. **README.md**
   - Description courte (1 phrase)
   - Installation
   - Usage rapide (3-5 exemples)
   - API Reference (lien vers API.md)
   - FAQ / Troubleshooting

2. **API.md**
   - Types TypeScript complets
   - Paramètres (nom, type, description, défaut, requis)
   - Valeurs de retour
   - Erreurs possibles
   - Exemples complets
   - Changelog

3. **Exemples**
   - Cas d'usage courants
   - Cas limites
   - Intégration avec autres outils

### 8.3 Documentation inline (JSDoc)

```typescript
/**
 * Search resources in the EKTS library
 * 
 * @param input - Search parameters
 * @param input.query - Search query (required, min 1 char)
 * @param input.filters - Optional filters
 * @param input.pagination - Optional pagination
 * 
 * @returns Paginated list of matching resources
 * 
 * @throws {ValidationError} If input is invalid
 * @throws {TimeoutError} If search takes too long
 * 
 * @example
 * ```typescript
 * const result = await searchResources({
 *   query: 'react animation',
 *   filters: { domain: 'web' }
 * });
 * console.log(result.items); // Resource[]
 * ```
 */
async function searchResources(input: SearchInput): Promise<SearchResult> {
  // ...
}
```

---

## 9. Tests et qualité

### 9.1 Pyramid de tests

```
        ╱╲
       ╱  ╲      E2E Tests (10%)
      ╱────╲     Integration with real DB, external services
     ╱      ╲
    ╱────────╲   Integration Tests (20%)
   ╱          ╲   Multiple units working together
  ╱────────────╲
 ╱              ╲ Unit Tests (70%)
╱────────────────╲ Pure functions, business logic
```

### 9.2 Standards de tests

**Couverture minimale :** 80% (lignes, branches, fonctions)

**Types de tests :**

1. **Tests unitaires** (Jest/Vitest)
   - Tester la logique métier isolée
   - Mock les dépendances externes
   - Rapides (< 1s par test)

2. **Tests d'intégration**
   - Tester l'interaction entre composants
   - Utiliser une DB de test (SQLite en mémoire)
   - Modérés (1-5s par test)

3. **Tests E2E**
   - Tester le workflow complet
   - Utiliser des services réels (ou containers)
   - Lents (5-30s par test)

### 9.3 Exemple de test unitaire

```typescript
import { describe, it, expect, vi } from 'vitest';
import { searchResources } from './handler';

describe('searchResources', () => {
  it('should return matching resources', async () => {
    // Arrange
    const mockDb = {
      query: vi.fn().mockResolvedValue([
        { id: '1', title: 'React Animation', domain: 'web' }
      ])
    };
    
    const input = { query: 'react' };
    
    // Act
    const result = await searchResources(input, { db: mockDb, logger });
    
    // Assert
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('React Animation');
  });
  
  it('should throw ValidationError for empty query', async () => {
    // Arrange
    const input = { query: '' };
    
    // Act & Assert
    await expect(searchResources(input, { db, logger }))
      .rejects.toThrow(ValidationError);
  });
});
```

---

## 10. Décision : module local vs service séparé

### 10.1 Critères de décision

**Garder en module local si :**
- ✅ Utilisé uniquement dans un contexte
- ✅ Pas de besoin d'isolation
- ✅ Performance critique (pas d'overhead IPC)
- ✅ Déploiement simplifié (un seul package)

**Créer un service séparé si :**
- ✅ Utilisé par plusieurs applications
- ✅ Besoin d'isolation (crash, sécurité)
- ✅ Scaling indépendant nécessaire
- ✅ Stack technologique différente
- ✅ Équipe différente responsable

### 10.2 Matrice de décision EKTS

| Outil | Module local | Service séparé | Justification |
|-------|--------------|----------------|---------------|
| `search_resources` | ✅ | | Utilisé uniquement par EKTS |
| `inspect_website` | | ✅ | Long, isolé, scaling indépendant |
| `capture_screenshot` | | ✅ | Peut crash, isolation nécessaire |
| `validate_resource` | ✅ | | Simple, utilisé dans plusieurs contextes |
| `external_api_client` | | ✅ | Service externe, retry/circuit breaker |

### 10.3 Architecture recommandée

```
EKTS Core (monorepo)
├── packages/
│   ├── core/              # Logique métier (modules locaux)
│   │   ├── search/
│   │   ├── validation/
│   │   └── storage/
│   ├── cli/               # Interface CLI
│   ├── api/               # Interface API
│   └── mcp/               # Interface MCP
│
├── services/              # Services séparés
│   ├── inspector/         # Service d'inspection (Playwright)
│   ├── screenshot/        # Service de capture
│   └── external-api/      # Client APIs externes
│
└── apps/
    └── web/               # Interface web (optionnel)
```

---

## 11. Checklist de qualité

**Avant de merger un nouvel outil :**

- [ ] Code review effectué
- [ ] Tests unitaires écrits (couverture > 80%)
- [ ] Tests d'intégration écrits
- [ ] Documentation complète (README, API.md)
- [ ] Exemples d'utilisation fournis
- [ ] Logs structurés ajoutés
- [ ] Gestion des erreurs implémentée
- [ ] Validation des entrées en place
- [ ] Types TypeScript stricts (no `any`)
- [ ] Linting passing (ESLint)
- [ ] Formatage cohérent (Prettier)
- [ ] Changelog mis à jour
- [ ] Performance testée (si pertinent)

---

## 12. Ressources et références

### 12.1 Documentation officielle

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Zod Documentation](https://zod.dev/)
- [Pino Documentation](https://getpino.io/)
- [Vitest Documentation](https://vitest.dev/)
- [MCP Specification](https://modelcontextprotocol.io/specification)

### 12.2 Patterns et architectures

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Command Pattern](https://refactoring.guru/design-patterns/command)
- [Result Pattern](https://medium.com/@darthburns/the-result-pattern-in-typescript-46b331b3d97f)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

### 12.3 Outils EKTS

- [ESLint](https://eslint.org/) — Linting
- [Prettier](https://prettier.io/) — Formatage
- [Vitest](https://vitest.dev/) — Testing
- [Zod](https://zod.dev/) — Validation
- [Pino](https://getpino.io/) — Logging

---

## 13. Conclusion

Ce guide établit les fondations pour développer des outils EKTS cohérents, fiables et maintenables. Les principes et patterns présentés doivent être appliqués systématiquement pour garantir la qualité du codebase.

**Points clés à retenir :**
1. Single Responsibility : un outil, une responsabilité
2. Explicit Over Implicit : tout doit être déclaré explicitement
3. Fail Fast : détecter les erreurs le plus tôt possible
4. Idempotence : même résultat pour mêmes entrées
5. Least Privilege : permissions minimales nécessaires

**Prochaine étape :** Appliquer ces principes dans la Phase 04 (automatisation navigateur) et les phases suivantes.

---

**Document terminé le 2026-10-21 — Phase 03 du projet EKTS**
