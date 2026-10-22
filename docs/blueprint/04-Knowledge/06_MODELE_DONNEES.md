# Phase 06 — Livrable 06.2 : Modèle de Données EKTS

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Élevé (conception détaillée)

---

## 1. Objectif

Définir le modèle de données complet pour EKTS, couvrant les inspections, scrapes, ressources, et leur intégrité avec les décisions de Phase 05 (compliance, anonymisation, rétention).

---

## 2. Résumé exécutif

### Entités principales

1. **Inspections** — analyses de sites (4 niveaux L1-L4)
2. **Scrapes** — collectes de données structurées
3. **Ressources** — bibliothèque de connaissances (tools, tutos, docs)
4. **Tags** — classification et catégorisation
5. **Audit Logs** — traçabilité complète

### Relations clés

- Inspection → peut être liée à un Scrape
- Scrape → peut produire des Ressources
- Ressource → peut provenir d'une Inspection ou d'un Scrape
- Toutes les entités → Tags (many-to-many)
- Toutes les opérations → Audit Logs

---

## 3. Diagramme entité-relation

```
┌─────────────────────────────────────────────────────────────┐
│                        INSPECTIONS                            │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ url                                                          │
│ domain                                                       │
│ timestamp                                                    │
│ duration_ms                                                  │
│ level (L1/L2/L3/L4)                                         │
│ status                                                       │
│ title                                                        │
│ description                                                  │
│ load_time_ms                                                 │
│ page_size_bytes                                              │
│ request_count                                                │
│ error_count                                                  │
│ robots_txt_respected                                         │
│ rate_limiting_applied                                        │
│ retention_until                                              │
│ scrape_id (FK) ──────────────────────┐                      │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          │ 1:0..1
                                          │
┌─────────────────────────────────────────────────────────────┐
│                         SCRAPES                               │
├─────────────────────────────────────────────────────────────┤
│ id (PK) ◄──────────────────────────────┘                    │
│ url                                                          │
│ domain                                                       │
│ timestamp                                                    │
│ method (http/playwright/patchright/api)                     │
│ robots_txt_respected                                         │
│ tos_reviewed                                                 │
│ legal_basis                                                  │
│ data_count                                                   │
│ personal_data_removed                                        │
│ user_agent                                                   │
│ duration_ms                                                  │
│ retention_until                                              │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                       RESOURCES                               │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ type (tool/tutorial/doc/library)                            │
│ title                                                        │
│ description                                                  │
│ url                                                          │
│ domain (A/B/C/D/E/F/G)                                      │
│ source (DRI/Students/HarnAI/manual)                         │
│ added_at                                                     │
│ updated_at                                                   │
│ verified                                                     │
│ confidence (high/medium/low)                                │
│ inspection_id (FK) ────────────────────┐                    │
│ scrape_id (FK) ────────────────────────┤                    │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          │
         ┌────────────────────────────────┘
         │
         │ N:M
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                          TAGS                                 │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ name (UNIQUE)                                                │
│ category                                                     │
└─────────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESOURCE_TAGS                              │
├─────────────────────────────────────────────────────────────┤
│ resource_id (FK)                                             │
│ tag_id (FK)                                                  │
│ PRIMARY KEY (resource_id, tag_id)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AUDIT_LOGS                               │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ timestamp                                                    │
│ operator                                                     │
│ action                                                       │
│ target_type                                                  │
│ target_id                                                    │
│ result                                                       │
│ details (JSON)                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Schéma SQL détaillé

### 4.1 Table inspections

```sql
CREATE TABLE inspections (
  -- Identification
  id TEXT PRIMARY KEY,                        -- UUID v4
  url TEXT NOT NULL,                          -- URL inspectée
  domain TEXT NOT NULL,                       -- Domaine extrait
  
  -- Temporel
  timestamp TEXT NOT NULL,                    -- ISO 8601
  duration_ms INTEGER,                        -- Durée de l'inspection
  
  -- Classification
  level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'L4')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error')),
  
  -- Métadonnées page
  title TEXT,                                 -- <title>
  description TEXT,                           -- meta description
  language TEXT,                              -- lang attribute
  canonical TEXT,                             -- canonical URL
  
  -- Métriques performance
  load_time_ms INTEGER,                       -- Temps de chargement
  page_size_bytes INTEGER,                    -- Taille totale
  request_count INTEGER,                      -- Nombre de requêtes
  error_count INTEGER,                        -- Erreurs détectées
  
  -- Qualité
  accessibility_score INTEGER,                -- 0-100 (si calculé)
  performance_score INTEGER,                  -- 0-100 (si calculé)
  
  -- Compliance (Phase 05)
  robots_txt_respected INTEGER CHECK (robots_txt_respected IN (0, 1)),
  rate_limiting_applied INTEGER CHECK (rate_limiting_applied IN (0, 1)),
  
  -- Rétention (Phase 05)
  retention_until TEXT,                       -- ISO 8601 (timestamp + 1 an)
  
  -- Relations
  scrape_id TEXT,                             -- Lien vers scrape parent
  
  -- Index
  FOREIGN KEY (scrape_id) REFERENCES scrapes(id) ON DELETE SET NULL
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_inspections_domain ON inspections(domain);
CREATE INDEX idx_inspections_timestamp ON inspections(timestamp);
CREATE INDEX idx_inspections_level ON inspections(level);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_retention ON inspections(retention_until);
```

### 4.2 Table scrapes

```sql
CREATE TABLE scrapes (
  -- Identification
  id TEXT PRIMARY KEY,                        -- UUID v4
  url TEXT NOT NULL,                          -- URL scrapée
  domain TEXT NOT NULL,                       -- Domaine extrait
  
  -- Temporel
  timestamp TEXT NOT NULL,                    -- ISO 8601
  duration_ms INTEGER,                        -- Durée du scrape
  
  -- Méthode
  method TEXT NOT NULL CHECK (method IN ('http', 'playwright', 'patchright', 'api', 'dataset')),
  
  -- Compliance (Phase 05)
  robots_txt_respected INTEGER CHECK (robots_txt_respected IN (0, 1)),
  tos_reviewed INTEGER CHECK (tos_reviewed IN (0, 1)),
  legal_basis TEXT CHECK (legal_basis IN ('public_data', 'legitimate_interest', 'consent')),
  
  -- Données collectées
  data_count INTEGER,                         -- Nombre d'éléments collectés
  personal_data_removed INTEGER CHECK (personal_data_removed IN (0, 1)),
  
  -- Technique
  user_agent TEXT,                            -- User-Agent utilisé
  stealth_mode INTEGER CHECK (stealth_mode IN (0, 1)),  -- Patchright utilisé
  
  -- Rétention (Phase 05)
  retention_until TEXT,                       -- ISO 8601
  
  -- Index
  INDEX idx_scrapes_domain ON scrapes(domain),
  INDEX idx_scrapes_timestamp ON scrapes(timestamp),
  INDEX idx_scrapes_method ON scrapes(method)
);
```

### 4.3 Table resources

```sql
CREATE TABLE resources (
  -- Identification
  id TEXT PRIMARY KEY,                        -- UUID v4
  type TEXT NOT NULL CHECK (type IN ('tool', 'tutorial', 'documentation', 'library', 'article', 'video')),
  
  -- Contenu
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,                                   -- URL source
  content_hash TEXT,                          -- Hash du contenu (déduplication)
  
  -- Classification
  domain TEXT NOT NULL CHECK (domain IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  -- A : Fondations ingénierie
  -- B : Outils et bibliothèques
  -- C : Design et UX
  -- D : Performance et optimisation
  -- E : Créatif (motion, 3D, etc.)
  -- F : Business et stratégie
  -- G : IA et automation
  
  -- Origine
  source TEXT NOT NULL CHECK (source IN ('DRI', 'Students', 'HarnAI', 'cartographie_creative', 'inspection', 'scrape', 'manual')),
  
  -- Temporel
  added_at TEXT NOT NULL,                     -- ISO 8601
  updated_at TEXT,                            -- ISO 8601
  last_verified TEXT,                         -- Dernière vérification
  
  -- Qualité
  verified INTEGER DEFAULT 0 CHECK (verified IN (0, 1)),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low', 'unverified')),
  
  -- Relations
  inspection_id TEXT,                         -- Source : inspection
  scrape_id TEXT,                             -- Source : scrape
  
  -- Index
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL,
  FOREIGN KEY (scrape_id) REFERENCES scrapes(id) ON DELETE SET NULL
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_domain ON resources(domain);
CREATE INDEX idx_resources_source ON resources(source);
CREATE INDEX idx_resources_added ON resources(added_at);
CREATE INDEX idx_resources_verified ON resources(verified);
```

### 4.4 Table tags

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,                        -- UUID v4
  name TEXT UNIQUE NOT NULL,                  -- Nom du tag
  category TEXT,                              -- Catégorie (optionnel)
  description TEXT,                           -- Description (optionnel)
  created_at TEXT NOT NULL                    -- ISO 8601
);

-- Index
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
```

### 4.5 Table resource_tags (relation N:M)

```sql
CREATE TABLE resource_tags (
  resource_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  assigned_at TEXT NOT NULL,                  -- ISO 8601
  assigned_by TEXT,                           -- Qui a assigné le tag
  
  PRIMARY KEY (resource_id, tag_id),
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Index pour requêtes
CREATE INDEX idx_resource_tags_resource ON resource_tags(resource_id);
CREATE INDEX idx_resource_tags_tag ON resource_tags(tag_id);
```

### 4.6 Table audit_logs

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,                        -- UUID v4
  timestamp TEXT NOT NULL,                    -- ISO 8601
  
  -- Opérateur
  operator TEXT NOT NULL,                     -- 'system', 'user:xxx', 'agent:xxx'
  
  -- Action
  action TEXT NOT NULL,                       -- 'inspect', 'scrape', 'search', 'export', 'delete'
  target_type TEXT,                           -- 'inspection', 'scrape', 'resource', 'tag'
  target_id TEXT,                             -- ID de la cible
  
  -- Résultat
  result TEXT NOT NULL CHECK (result IN ('success', 'error', 'blocked')),
  
  -- Détails
  details TEXT,                               -- JSON avec contexte
  
  -- Compliance
  compliance_check TEXT                       -- JSON avec résultats compliance
);

-- Index
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
```

---

## 5. Contraintes de compliance (Phase 05)

### 5.1 Anonymisation

**Règle :** Les données personnelles doivent être anonymisées avant stockage

**Implémentation au niveau application :**

```typescript
interface AnonymizableData {
  email?: string;
  phone?: string;
  name?: string;
  address?: string;
}

function anonymizeForStorage<T extends AnonymizableData>(data: T): T {
  const anonymized = { ...data };
  
  // Hash email si présent
  if (anonymized.email) {
    (anonymized as any).email_hash = crypto
      .createHash('sha256')
      .update(anonymized.email)
      .digest('hex');
    delete (anonymized as any).email;
  }
  
  // Supprimer autres données identifiantes
  delete (anonymized as any).phone;
  delete (anonymized as any).name;
  delete (anonymized as any).address;
  
  return anonymized;
}
```

### 5.2 Rétention automatique

**Règle :** Max 1 an, puis suppression automatique

**Implémentation SQL :**

```sql
-- Colonne retention_until calculée à l'insertion
-- retention_until = timestamp + 1 an

-- Job quotidien de nettoyage
DELETE FROM inspections WHERE retention_until < date('now');
DELETE FROM scrapes WHERE retention_until < date('now');

-- Log des suppressions
INSERT INTO audit_logs (id, timestamp, operator, action, target_type, target_id, result)
SELECT 
  uuid(), 
  datetime('now'), 
  'system', 
  'auto_delete', 
  'inspection', 
  id, 
  'success'
FROM inspections 
WHERE retention_until < date('now');
```

### 5.3 Traçabilité complète

**Règle :** Toutes les opérations doivent être loguées

**Implémentation :**

```typescript
async function logOperation(
  action: string,
  target: { type: string; id: string },
  result: 'success' | 'error' | 'blocked',
  details?: any
): Promise<void> {
  const log = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    operator: getCurrentOperator(),
    action,
    target_type: target.type,
    target_id: target.id,
    result,
    details: details ? JSON.stringify(details) : null,
    compliance_check: null
  };
  
  await db.prepare(`
    INSERT INTO audit_logs 
    (id, timestamp, operator, action, target_type, target_id, result, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id, log.timestamp, log.operator, log.action,
    log.target_type, log.target_id, log.result, log.details
  );
}
```

---

## 6. Requêtes fréquentes

### 6.1 Inspections

```sql
-- Dernières inspections d'un domaine
SELECT * FROM inspections
WHERE domain = ?
ORDER BY timestamp DESC
LIMIT 20;

-- Inspections par niveau
SELECT level, COUNT(*) as count
FROM inspections
GROUP BY level;

-- Inspections avec erreurs
SELECT * FROM inspections
WHERE error_count > 0
ORDER BY timestamp DESC;
```

### 6.2 Ressources

```sql
-- Ressources par domaine
SELECT domain, COUNT(*) as count
FROM resources
GROUP BY domain;

-- Ressources vérifiées
SELECT * FROM resources
WHERE verified = 1
ORDER BY added_at DESC;

-- Ressources avec tags spécifiques
SELECT r.*
FROM resources r
JOIN resource_tags rt ON r.id = rt.resource_id
JOIN tags t ON rt.tag_id = t.id
WHERE t.name IN (?, ?)
GROUP BY r.id
HAVING COUNT(DISTINCT t.name) = 2;
```

### 6.3 Audit

```sql
-- Logs d'audit par action
SELECT action, COUNT(*) as count
FROM audit_logs
WHERE timestamp > datetime('now', '-7 days')
GROUP BY action;

-- Logs pour une ressource spécifique
SELECT * FROM audit_logs
WHERE target_type = 'resource' AND target_id = ?
ORDER BY timestamp DESC;
```

---

## 7. Performance et optimisation

### 7.1 Index stratégiques

**Principes :**
- Indexer les colonnes utilisées dans WHERE, JOIN, ORDER BY
- Éviter les index sur colonnes à faible cardinalité
- Utiliser des index composites pour requêtes multi-colonnes

**Index recommandés :**

```sql
-- Composite pour requêtes fréquentes
CREATE INDEX idx_inspections_domain_timestamp 
ON inspections(domain, timestamp DESC);

-- Composite pour ressources par domaine
CREATE INDEX idx_resources_domain_type 
ON resources(domain, type);

-- Partial index pour ressources vérifiées
CREATE INDEX idx_resources_verified 
ON resources(added_at DESC)
WHERE verified = 1;
```

### 7.2 VACUUM et optimisation

```sql
-- Vacuum quotidien (job)
VACUUM;

-- Analyse des index
ANALYZE;
```

---

## 8. Migration et versioning

### 8.1 Schema versioning

```sql
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL,
  description TEXT
);

-- Version initiale
INSERT INTO schema_version (version, applied_at, description)
VALUES (1, datetime('now'), 'Initial schema');
```

### 8.2 Migrations

```typescript
const migrations = [
  {
    version: 1,
    up: `
      CREATE TABLE inspections (...);
      CREATE TABLE scrapes (...);
      -- etc.
    `,
    down: `
      DROP TABLE inspections;
      DROP TABLE scrapes;
      -- etc.
    `
  },
  {
    version: 2,
    up: `
      ALTER TABLE resources ADD COLUMN content_hash TEXT;
    `,
    down: `
      -- SQLite ne supporte pas DROP COLUMN avant 3.35.0
      -- Recréer la table sans la colonne
    `
  }
];
```

---

## 9. Limites et considérations

### 9.1 Limites SQLite

- **Pas de ALTER TABLE avancé** avant 3.35.0 (2021)
- **Single-writer** — pas de writes concurrents
- **Pas de réplication native**

### 9.2 Évolution

- **Ajout de colonnes** — OK avec ALTER TABLE ADD COLUMN
- **Suppression de colonnes** — nécessite recréation table (avant 3.35.0)
- **Modification de type** — nécessite recréation table

---

## 10. Décisions

### Décisions prises

1. **4 entités principales** — inspections, scrapes, resources, tags
2. **Relation N:M** — resources ↔ tags via resource_tags
3. **Audit logging** — table audit_logs pour traçabilité
4. **Compliance intégrée** — colonnes retention_until, robots_txt_respected, etc.
5. **Schema versioning** — table schema_version pour migrations

### Décisions reportées

- Ajout de tables spécifiques pour Phase 07 (RAG)
- Extension pour embeddings (sqlite-vec)
- Tables supplémentaires si besoins identifiés

---

## 11. Sources

### Documentation SQLite
- https://www.sqlite.org/lang.html
- https://www.sqlite.org/fts5.html

### Bonnes pratiques
- Schema versioning : https://www.sqlite.org/lang_altertable.html
- Index optimization : https://www.sqlite.org/queryplanner.html

---

**Livrable rédigé le 21 octobre 2026 — Phase 06 du projet EKTS**
