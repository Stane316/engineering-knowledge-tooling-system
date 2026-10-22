# Template de Contrat Standard d'Outil EKTS

**Version :** 1.0  
**Date :** 2026-10-21  
**Statut :** ✅ Terminé

---

## 1. Objectif

Ce document fournit un template de contrat standard pour tous les outils EKTS. Il sert de référence pour développer de nouveaux outils de manière cohérente et documentée.

**Usage :** Copier ce template, le remplir pour chaque nouvel outil, et le placer dans `docs/CONTRACT.md` du package de l'outil.

---

## 2. Structure du contrat

```markdown
# Contrat d'Outil : [NOM_DE_L_OUTIL]

## 1. Informations générales

- **Nom :** [nom]
- **Version :** [semver]
- **Statut :** [draft|stable|deprecated]
- **Responsable :** [nom/email]
- **Date de création :** [YYYY-MM-DD]
- **Dernière mise à jour :** [YYYY-MM-DD]

## 2. Description

### 2.1 Résumé
[1-2 phrases décrivant ce que fait l'outil]

### 2.2 Cas d'usage
- [Cas d'usage principal]
- [Cas d'usage secondaire]

### 2.3 Non-objectifs
- [Ce que l'outil ne fait PAS]

## 3. Interfaces

### 3.1 Interface programmatique

#### Types TypeScript
```typescript
// Input
interface [ToolName]Input {
  // ...
}

// Output
interface [ToolName]Output {
  // ...
}
```

#### Signature
```typescript
async function [toolName](
  input: [ToolName]Input,
  context?: Context
): Promise<[ToolName]Output>
```

#### Exemple
```typescript
const result = await [toolName]({
  // ...
});
```

### 3.2 Interface CLI

#### Commande
```bash
ekts [command] [subcommand] [options]
```

#### Options
| Option | Type | Requis | Défaut | Description |
|--------|------|--------|--------|-------------|
| `--param` | string | Non | - | Description |

#### Exemples
```bash
# Exemple 1
ekts [command] --param value

# Exemple 2
ekts [command] --param value --other other-value
```

#### Code de sortie
| Code | Signification |
|------|---------------|
| 0 | Succès |
| 1 | Erreur générale |
| 2 | Erreur de validation |
| 3 | Timeout |

### 3.3 Interface API REST

#### Endpoint
```
[METHOD] /v1/[resource]
```

#### Headers
| Header | Requis | Description |
|--------|--------|-------------|
| `Authorization` | Oui | Bearer token |
| `Content-Type` | Oui | application/json |

#### Request Body
```json
{
  // ...
}
```

#### Response (200 OK)
```json
{
  // ...
}
```

#### Response (4xx/5xx)
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "context": {}
  }
}
```

#### Exemple (curl)
```bash
curl -X [METHOD] https://api.ekts.dev/v1/[resource] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    // ...
  }'
```

### 3.4 Interface MCP

#### Tool
```json
{
  "name": "[tool_name]",
  "description": "[description]",
  "inputSchema": {
    "type": "object",
    "properties": {
      // ...
    },
    "required": []
  }
}
```

#### Exemple
```json
{
  "name": "[tool_name]",
  "arguments": {
    // ...
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "..."
    }
  ]
}
```

## 4. Validation

### 4.1 Schéma d'entrée (Zod)
```typescript
const [ToolName]InputSchema = z.object({
  // ...
});
```

### 4.2 Règles de validation
| Champ | Règle | Erreur si non respectée |
|-------|-------|-------------------------|
| `field1` | Non-empty string | `VALIDATION_ERROR: field1 is required` |
| `field2` | Integer > 0 | `VALIDATION_ERROR: field2 must be positive` |

## 5. Erreurs

### 5.1 Erreurs possibles
| Erreur | Code | HTTP | MCP | Contexte |
|--------|------|------|-----|----------|
| ValidationError | VALIDATION_ERROR | 400 | -32602 | `{ details: [...] }` |
| NotFoundError | NOT_FOUND | 404 | -32001 | `{ resource, id }` |
| PermissionError | PERMISSION_DENIED | 403 | -32002 | `{ action }` |
| TimeoutError | TIMEOUT | 504 | -32003 | `{ operation, timeoutMs }` |

### 5.2 Exemples d'erreurs
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "context": {
      "details": [
        {
          "path": ["query"],
          "message": "Query cannot be empty"
        }
      ]
    }
  }
}
```

## 6. Performance

### 6.1 Métriques
| Métrique | Cible | Mesure |
|----------|-------|--------|
| Latence p50 | < 100ms | [méthode de mesure] |
| Latence p95 | < 500ms | [méthode de mesure] |
| Latence p99 | < 1000ms | [méthode de mesure] |
| Throughput | > 100 req/s | [méthode de mesure] |

### 6.2 Optimisations
- [Optimisation 1]
- [Optimisation 2]

### 6.3 Limites
| Limite | Valeur | Justification |
|--------|--------|---------------|
| Taille max input | 10 KB | Éviter abus |
| Timeout | 30s | Éviter blocage |
| Rate limit | 100 req/min | Protection service |

## 7. Sécurité

### 7.1 Permissions requises
- [Permission 1]
- [Permission 2]

### 7.2 Données sensibles
- [Donnée sensible 1] : [traitement]
- [Donnée sensible 2] : [traitement]

### 7.3 Bonnes pratiques
- [Bonne pratique 1]
- [Bonne pratique 2]

## 8. Dépendances

### 8.1 Dépendances internes
| Package | Version | Usage |
|---------|---------|-------|
| `@ekts/core` | ^1.0.0 | [usage] |
| `@ekts/logger` | ^1.0.0 | Logging |

### 8.2 Dépendances externes
| Package | Version | Usage |
|---------|---------|-------|
| `zod` | ^3.22.0 | Validation |
| `pino` | ^8.16.0 | Logging |

### 8.3 Services externes
| Service | SLA | Fallback |
|---------|-----|----------|
| Database | 99.9% | Retry 3x |
| External API | 99.5% | Cache 5min |

## 9. Tests

### 9.1 Couverture minimale
- Lignes : 80%
- Branches : 80%
- Fonctions : 80%

### 9.2 Tests requis
- [ ] Tests unitaires (handler)
- [ ] Tests d'intégration (avec DB)
- [ ] Tests E2E (workflow complet)
- [ ] Tests de performance (si pertinent)

### 9.3 Jeux de données
- [Jeu de données 1] : [description]
- [Jeu de données 2] : [description]

## 10. Logs

### 10.1 Logs émis
| Niveau | Événement | Contexte |
|--------|-----------|----------|
| INFO | `[tool]_executed` | `{ input, output, durationMs }` |
| ERROR | `[tool]_failed` | `{ input, error, durationMs }` |
| DEBUG | `[tool]_query` | `{ query, durationMs }` |

### 10.2 Exemples
```json
{
  "level": "info",
  "event": "[tool]_executed",
  "input": { "query": "react" },
  "output": { "count": 42 },
  "durationMs": 123
}
```

## 11. Déploiement

### 11.1 Prérequis
- [Prérequis 1]
- [Prérequis 2]

### 11.2 Variables d'environnement
| Variable | Requis | Défaut | Description |
|----------|--------|--------|-------------|
| `DB_URL` | Oui | - | Database connection string |
| `LOG_LEVEL` | Non | `info` | Log level |

### 11.3 Commandes
```bash
# Installation
npm install

# Build
npm run build

# Test
npm test

# Start
npm start
```

## 12. Changelog

### [1.0.0] - 2026-10-21
- Initial release
- [Feature 1]
- [Feature 2]

### [0.1.0] - 2026-10-01
- Draft version
```

---

## 3. Exemple complet : outil `search_resources`

Voici un exemple complet du contrat pour l'outil `search_resources` :

```markdown
# Contrat d'Outil : search_resources

## 1. Informations générales

- **Nom :** search_resources
- **Version :** 1.0.0
- **Statut :** stable
- **Responsable :** EKTS Team
- **Date de création :** 2026-10-21
- **Dernière mise à jour :** 2026-10-21

## 2. Description

### 2.1 Résumé
Recherche des ressources dans la bibliothèque EKTS par mots-clés, domaine, tags et autres critères. Retourne une liste paginée de ressources correspondantes.

### 2.2 Cas d'usage
- Rechercher des composants React par mots-clés
- Filtrer les ressources par domaine (web, motion, 3D)
- Trouver des ressources par tags spécifiques
- Explorer la bibliothèque EKTS

### 2.3 Non-objectifs
- Ne crée pas de nouvelles ressources (voir `add_resource`)
- Ne valide pas les ressources (voir `validate_resource`)
- Ne télécharge pas les ressources (voir `get_resource`)

## 3. Interfaces

### 3.1 Interface programmatique

#### Types TypeScript
```typescript
interface SearchResourcesInput {
  query: string;
  filters?: {
    domain?: 'web' | 'motion' | '3d' | 'all';
    tags?: string[];
    dateRange?: {
      from?: string; // ISO 8601
      to?: string;   // ISO 8601
    };
  };
  pagination?: {
    limit?: number;  // 1-100, default: 20
    offset?: number; // >= 0, default: 0
  };
}

interface SearchResourcesOutput {
  items: Resource[];
  total: number;
  hasMore: boolean;
  metadata: {
    queryTime: number;
    cacheHit: boolean;
  };
}

interface Resource {
  id: string;
  title: string;
  description: string;
  domain: 'web' | 'motion' | '3d';
  tags: string[];
  url: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Signature
```typescript
async function searchResources(
  input: SearchResourcesInput,
  context?: Context
): Promise<SearchResourcesOutput>
```

#### Exemple
```typescript
const result = await searchResources({
  query: 'react animation',
  filters: {
    domain: 'web',
    tags: ['animation', 'component']
  },
  pagination: {
    limit: 10,
    offset: 0
  }
});

console.log(result.items); // Resource[]
console.log(result.total); // 42
console.log(result.hasMore); // true
```

### 3.2 Interface CLI

#### Commande
```bash
ekts resource search [options]
```

#### Options
| Option | Type | Requis | Défaut | Description |
|--------|------|--------|--------|-------------|
| `--query, -q` | string | Oui | - | Search query |
| `--domain, -d` | string | Non | all | Filter by domain (web, motion, 3d) |
| `--tags, -t` | string[] | Non | - | Filter by tags (comma-separated) |
| `--limit, -l` | number | Non | 20 | Results per page (1-100) |
| `--offset, -o` | number | Non | 0 | Pagination offset |
| `--format, -f` | string | Non | table | Output format (table, json) |

#### Exemples
```bash
# Recherche simple
ekts resource search --query "react animation"

# Avec filtres
ekts resource search -q "react" -d web -t animation,component

# Pagination
ekts resource search -q "react" -l 10 -o 20

# Sortie JSON
ekts resource search -q "react" -f json
```

#### Code de sortie
| Code | Signification |
|------|---------------|
| 0 | Succès |
| 1 | Erreur générale |
| 2 | Erreur de validation |
| 3 | Timeout |

### 3.3 Interface API REST

#### Endpoint
```
POST /v1/resources/search
```

#### Headers
| Header | Requis | Description |
|--------|--------|-------------|
| `Authorization` | Oui | Bearer token |
| `Content-Type` | Oui | application/json |

#### Request Body
```json
{
  "query": "react animation",
  "filters": {
    "domain": "web",
    "tags": ["animation", "component"]
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "res_123",
      "title": "React Animation Component",
      "description": "A reusable React component for animations",
      "domain": "web",
      "tags": ["react", "animation", "component"],
      "url": "https://example.com/react-animation",
      "createdAt": "2026-10-01T10:00:00Z",
      "updatedAt": "2026-10-15T14:30:00Z"
    }
  ],
  "total": 42,
  "hasMore": true,
  "metadata": {
    "queryTime": 123,
    "cacheHit": false
  }
}
```

#### Response (4xx/5xx)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "context": {
      "details": [
        {
          "path": ["query"],
          "message": "Query cannot be empty"
        }
      ]
    }
  }
}
```

#### Exemple (curl)
```bash
curl -X POST https://api.ekts.dev/v1/resources/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "react animation",
    "filters": {
      "domain": "web"
    },
    "pagination": {
      "limit": 10
    }
  }'
```

### 3.4 Interface MCP

#### Tool
```json
{
  "name": "search_resources",
  "description": "Search resources in the EKTS library by keywords, domain, tags, and other criteria",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query (required, min 1 character)"
      },
      "filters": {
        "type": "object",
        "properties": {
          "domain": {
            "type": "string",
            "enum": ["web", "motion", "3d", "all"],
            "description": "Filter by domain"
          },
          "tags": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Filter by tags"
          }
        }
      },
      "pagination": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "minimum": 1,
            "maximum": 100,
            "default": 20,
            "description": "Results per page"
          },
          "offset": {
            "type": "number",
            "minimum": 0,
            "default": 0,
            "description": "Pagination offset"
          }
        }
      }
    },
    "required": ["query"]
  }
}
```

#### Exemple
```json
{
  "name": "search_resources",
  "arguments": {
    "query": "react animation",
    "filters": {
      "domain": "web"
    },
    "pagination": {
      "limit": 10
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"items\":[...],\"total\":42,\"hasMore\":true}"
    }
  ]
}
```

## 4. Validation

### 4.1 Schéma d'entrée (Zod)
```typescript
const SearchResourcesInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  filters: z.object({
    domain: z.enum(['web', 'motion', '3d', 'all']).optional(),
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
```

### 4.2 Règles de validation
| Champ | Règle | Erreur si non respectée |
|-------|-------|-------------------------|
| `query` | Non-empty string, min 1 char | `VALIDATION_ERROR: Query cannot be empty` |
| `filters.domain` | Enum: web, motion, 3d, all | `VALIDATION_ERROR: Invalid domain` |
| `filters.tags` | Array of strings | `VALIDATION_ERROR: Tags must be strings` |
| `pagination.limit` | Integer 1-100 | `VALIDATION_ERROR: Limit must be between 1 and 100` |
| `pagination.offset` | Integer >= 0 | `VALIDATION_ERROR: Offset must be non-negative` |

## 5. Erreurs

### 5.1 Erreurs possibles
| Erreur | Code | HTTP | MCP | Contexte |
|--------|------|------|-----|----------|
| ValidationError | VALIDATION_ERROR | 400 | -32602 | `{ details: [...] }` |
| TimeoutError | TIMEOUT | 504 | -32003 | `{ operation: 'search', timeoutMs: 30000 }` |
| ExternalServiceError | EXTERNAL_SERVICE_ERROR | 502 | -32004 | `{ service: 'database', reason: '...' }` |

### 5.2 Exemples d'erreurs
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "context": {
      "details": [
        {
          "path": ["query"],
          "message": "Query cannot be empty"
        }
      ]
    }
  }
}
```

## 6. Performance

### 6.1 Métriques
| Métrique | Cible | Mesure |
|----------|-------|--------|
| Latence p50 | < 100ms | Pino logs |
| Latence p95 | < 500ms | Pino logs |
| Latence p99 | < 1000ms | Pino logs |
| Throughput | > 100 req/s | Load testing |

### 6.2 Optimisations
- Cache des résultats fréquents (TTL 5min)
- Index full-text sur la base de données
- Pagination efficace (offset-based)

### 6.3 Limites
| Limite | Valeur | Justification |
|--------|--------|---------------|
| Taille max query | 1000 chars | Éviter abus |
| Timeout | 30s | Éviter blocage |
| Rate limit | 100 req/min | Protection service |
| Max results | 100 | Pagination obligatoire |

## 7. Sécurité

### 7.1 Permissions requises
- Lecture seule sur la base de données
- Pas d'accès en écriture
- Pas d'accès admin

### 7.2 Données sensibles
- Query : logguée mais pas stockée
- Results : pas de données sensibles
- User ID : loggué pour audit

### 7.3 Bonnes pratiques
- Valider tous les inputs
- Échapper les caractères spéciaux dans les requêtes SQL
- Limiter la taille des résultats
- Logger toutes les recherches pour audit

## 8. Dépendances

### 8.1 Dépendances internes
| Package | Version | Usage |
|---------|---------|-------|
| `@ekts/core` | ^1.0.0 | Types et utilitaires |
| `@ekts/logger` | ^1.0.0 | Logging structuré |
| `@ekts/database` | ^1.0.0 | Accès base de données |

### 8.2 Dépendances externes
| Package | Version | Usage |
|---------|---------|-------|
| `zod` | ^3.22.0 | Validation des inputs |
| `pino` | ^8.16.0 | Logging structuré |
| `better-sqlite3` | ^9.4.0 | Base de données SQLite |

### 8.3 Services externes
| Service | SLA | Fallback |
|---------|-----|----------|
| Database (SQLite) | Local | N/A |

## 9. Tests

### 9.1 Couverture minimale
- Lignes : 80%
- Branches : 80%
- Fonctions : 80%

### 9.2 Tests requis
- [x] Tests unitaires (handler)
- [x] Tests d'intégration (avec DB)
- [ ] Tests E2E (workflow complet)
- [x] Tests de performance

### 9.3 Jeux de données
- `test-data/basic.json` : 100 ressources basiques
- `test-data/large.json` : 10000 ressources pour tests de performance

## 10. Logs

### 10.1 Logs émis
| Niveau | Événement | Contexte |
|--------|-----------|----------|
| INFO | `search_resources_executed` | `{ query, filters, resultCount, durationMs }` |
| ERROR | `search_resources_failed` | `{ query, error, durationMs }` |
| DEBUG | `search_resources_query` | `{ sql, params, durationMs }` |

### 10.2 Exemples
```json
{
  "level": "info",
  "event": "search_resources_executed",
  "query": "react animation",
  "filters": { "domain": "web" },
  "resultCount": 42,
  "durationMs": 123
}
```

## 11. Déploiement

### 11.1 Prérequis
- Node.js 18+
- Base de données SQLite initialisée

### 11.2 Variables d'environnement
| Variable | Requis | Défaut | Description |
|----------|--------|--------|-------------|
| `DB_PATH` | Non | `./data/ekts.db` | Path to SQLite database |
| `LOG_LEVEL` | Non | `info` | Log level |

### 11.3 Commandes
```bash
# Installation
npm install

# Build
npm run build

# Test
npm test

# Start
npm start
```

## 12. Changelog

### [1.0.0] - 2026-10-21
- Initial stable release
- Search by query, domain, tags
- Pagination support
- CLI, API, MCP interfaces

### [0.2.0] - 2026-10-15
- Added MCP interface
- Added cache for frequent queries

### [0.1.0] - 2026-10-01
- Initial draft
- Basic search functionality
```

---

## 4. Checklist de validation du contrat

Avant de considérer un contrat comme complet, vérifier :

- [ ] **Informations générales** complètes (nom, version, statut, responsable)
- [ ] **Description** claire (résumé, cas d'usage, non-objectifs)
- [ ] **Interface programmatique** définie (types, signature, exemple)
- [ ] **Interface CLI** définie (commande, options, exemples, codes de sortie)
- [ ] **Interface API** définie (endpoint, headers, request/response, exemple curl)
- [ ] **Interface MCP** définie (tool schema, exemple, response)
- [ ] **Validation** documentée (schéma Zod, règles, erreurs)
- [ ] **Erreurs** listées (codes, contextes, exemples)
- [ ] **Performance** mesurée (métriques, optimisations, limites)
- [ ] **Sécurité** évaluée (permissions, données sensibles, bonnes pratiques)
- [ ] **Dépendances** listées (internes, externes, services)
- [ ] **Tests** définis (couverture, types requis, jeux de données)
- [ ] **Logs** documentés (niveaux, événements, exemples)
- [ ] **Déploiement** documenté (prérequis, variables, commandes)
- [ ] **Changelog** à jour

---

## 5. Utilisation du template

### 5.1 Quand utiliser ce template

- **Nouvel outil EKTS** : copier le template et le remplir
- **Refactoring d'outil existant** : documenter l'existant avec ce template
- **Review d'outil** : vérifier que le contrat est complet

### 5.2 Où placer le contrat

```
packages/
└── search-resources/
    ├── src/
    │   └── ...
    ├── docs/
    │   ├── README.md          # Documentation utilisateur
    │   ├── API.md             # Documentation technique
    │   ├── CONTRACT.md        # ← Contrat standard (ce template)
    │   └── examples/
    └── package.json
```

### 5.3 Mise à jour du contrat

- **Breaking change** : incrémenter MAJOR, mettre à jour le contrat
- **Nouvelle feature** : incrémenter MINOR, mettre à jour le contrat
- **Bug fix** : incrémenter PATCH, pas besoin de mettre à jour le contrat (sauf si le comportement change)

---

## 6. Conclusion

Ce template de contrat standard garantit que tous les outils EKTS sont :
- ✅ Bien documentés
- ✅ Cohérents entre eux
- ✅ Faciles à utiliser
- ✅ Faciles à maintenir
- ✅ Faciles à tester

**Règle d'or :** Pas d'outil sans contrat complet.

---

**Document terminé le 2026-10-21 — Phase 03 du projet EKTS**
