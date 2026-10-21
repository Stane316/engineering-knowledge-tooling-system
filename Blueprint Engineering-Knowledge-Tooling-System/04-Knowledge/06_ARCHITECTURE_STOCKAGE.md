# Phase 06 — Livrable 06.1 : Architecture de Stockage EKTS

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Élevé (analyse comparative approfondie)

---

## 1. Objectif

Définir l'architecture de stockage optimale pour EKTS en comparant SQLite, PostgreSQL et les fichiers JSON, avec une recommandation claire pour le système.

---

## 2. Résumé exécutif

**Recommandation : SQLite en mode WAL**

Pour EKTS (système personnel d'ingénierie), SQLite est le choix optimal pour 5 raisons :

1. **Performance exceptionnelle** — 80x plus rapide que PostgreSQL pour les lectures simples
2. **Zéro overhead opérationnel** — pas de serveur, pas de configuration, backup = copie de fichier
3. **FTS5 intégré** — full-text search compétitif avec PostgreSQL tsvector
4. **sqlite-vec** — support vectoriel pour RAG (Phase 07)
5. **Cohérence avec EKTS** — système personnel, read-heavy, <1M rows

**Architecture hybride recommandée :**
- **SQLite** — données structurées (inspections, scrapes, ressources)
- **FTS5** — recherche full-text
- **sqlite-vec** — recherche vectorielle (embeddings)
- **JSON** — configurations, métadonnées, logs

---

## 3. Analyse comparative

### 3.1 SQLite vs PostgreSQL vs JSON

#### Critères de décision

| Critère | Poids | Justification EKTS |
|---------|-------|-------------------|
| **Performance lecture** | 25% | EKTS est read-heavy (consultation fréquente) |
| **Simplicité opérationnelle** | 25% | Système personnel, pas d'équipe ops |
| **Full-text search** | 20% | Recherche de contenu essentiel |
| **Vector search** | 15% | RAG Phase 07 |
| **Coût** | 10% | Budget limité |
| **Scalabilité** | 5% | Usage personnel, pas de scaling massif |

#### Résultats comparatifs

| Dimension | SQLite | PostgreSQL | JSON fichiers |
|-----------|--------|------------|---------------|
| **Architecture** | Embarqué (fichier) | Client-serveur | Fichiers plats |
| **Setup** | Zéro config | Installation + config | Aucun |
| **Lecture simple** | 0.005ms | 0.4ms | 1-10ms (parse) |
| **Full-text search (10K docs)** | 2ms | 1.5ms | N/A |
| **Vector search** | sqlite-vec (5-15ms) | pgvector (3-5ms) | N/A |
| **Écriture concurrente** | 1 writer | Milliers | N/A |
| **Taille pratique max** | ~1 TB | Pétaoctets | Dépend du format |
| **Backup** | Copie fichier | pg_dump, WAL | Copie répertoire |
| **Coût** | $0 | $0-25/mo (managed) | $0 |
| **Overhead ops** | Quasi nul | Modéré | Nul |

#### Benchmarks réels (2026)

**Lectures simples (1M rows) :**
- SQLite : 128,400 queries/sec
- PostgreSQL : 48,200 queries/sec
- **SQLite 2.7x plus rapide**

**Full-text search (10K docs) :**
- SQLite FTS5 : p50 1.8ms, p99 4.2ms
- PostgreSQL tsvector : p50 2.4ms, p99 8ms
- **SQLite légèrement plus rapide**

**Écriture concurrente (8 writers) :**
- SQLite : 11,400 writes/sec (sérialisé)
- PostgreSQL : 52,600 writes/sec (parallèle)
- **PostgreSQL 4.6x plus rapide**

### 3.2 Quand choisir SQLite

**✅ SQLite est optimal pour EKTS car :**

1. **Usage personnel** — un seul utilisateur, pas de concurrence
2. **Read-heavy** — 95%+ lectures, 5% écritures
3. **Dataset <1M rows** — inspections, scrapes, ressources
4. **Pas de scaling horizontal** — système local
5. **Simplicité prioritaire** — pas d'équipe ops

**❌ PostgreSQL serait nécessaire si :**
- Multi-utilisateurs concurrents
- Dataset >10M rows
- Écritures intensives (>5K/sec)
- Réplication multi-nœuds requise

### 3.3 Quand utiliser JSON

**✅ JSON pour :**
- Configurations (settings, préférences)
- Métadonnées légères
- Logs structurés
- Export/import de données

**❌ JSON insuffisant pour :**
- Requêtes complexes
- Indexation
- Relations entre données
- Recherche full-text

---

## 4. Architecture recommandée

### 4.1 Structure de stockage

```
ekts-data/
├── db/
│   ├── ekts.db              # SQLite principal (données structurées)
│   ├── ekts-fts.db          # SQLite FTS5 (index full-text)
│   └── ekts-vectors.db      # SQLite sqlite-vec (embeddings)
├── configs/
│   ├── settings.json        # Configuration globale
│   └── sources.json         # Registres des sources
├── logs/
│   ├── audits/              # Logs d'audit (JSON)
│   └── operations/          # Logs opérationnels (JSON)
├── exports/
│   ├── inspections/         # Exports JSON
│   └── scrapes/             # Exports JSON
└── backups/
    ├── daily/               # Backups quotidiens
    └── weekly/              # Backups hebdomadaires
```

### 4.2 Répartition des données

| Type de données | Stockage | Justification |
|-----------------|----------|---------------|
| **Inspections** | SQLite (ekts.db) | Données structurées, relations, requêtes |
| **Scrapes** | SQLite (ekts.db) | Données structurées, recherche |
| **Ressources** | SQLite (ekts.db) | Métadonnées, liens, tags |
| **Contenu texte** | SQLite FTS5 (ekts-fts.db) | Recherche full-text |
| **Embeddings** | SQLite sqlite-vec (ekts-vectors.db) | Recherche vectorielle RAG |
| **Configurations** | JSON | Simple, lisible, versionnable |
| **Logs d'audit** | JSON | Structuré, exportable |
| **Screenshots** | Fichiers PNG | Binaire, pas en DB |

### 4.3 SQLite en mode WAL

**Configuration recommandée :**

```typescript
import Database from 'better-sqlite3';

const db = new Database('ekts-data/db/ekts.db');

// Activer WAL mode
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB
db.pragma('foreign_keys = ON');
db.pragma('temp_store = MEMORY');
```

**Avantages WAL :**
- Lectures concurrentes non bloquées par écritures
- Meilleure performance en écriture
- Recovery automatique après crash

---

## 5. Schéma de données

### 5.1 Tables principales (ekts.db)

```sql
-- Inspections de sites
CREATE TABLE inspections (
  id TEXT PRIMARY KEY,                    -- UUID
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  timestamp TEXT NOT NULL,                -- ISO 8601
  duration_ms INTEGER,
  level TEXT NOT NULL,                    -- L1, L2, L3, L4
  status TEXT NOT NULL,                   -- success, partial, error
  
  -- Métadonnées page
  title TEXT,
  description TEXT,
  language TEXT,
  
  -- Métriques
  load_time_ms INTEGER,
  page_size_bytes INTEGER,
  request_count INTEGER,
  error_count INTEGER,
  
  -- Compliance
  robots_txt_respected INTEGER,           -- 0/1
  rate_limiting_applied INTEGER,          -- 0/1
  
  -- Relations
  scrape_id TEXT,                         -- Lien vers scrape parent
  
  FOREIGN KEY (scrape_id) REFERENCES scrapes(id)
);

-- Scrapes de données
CREATE TABLE scrapes (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  method TEXT NOT NULL,                   -- http, playwright, patchright, api
  
  -- Compliance
  robots_txt_respected INTEGER,
  tos_reviewed INTEGER,
  legal_basis TEXT,                       -- public_data, legitimate_interest
  
  -- Données
  data_count INTEGER,
  personal_data_removed INTEGER,
  
  -- Metadata
  user_agent TEXT,
  duration_ms INTEGER
);

-- Ressources (bibliothèque)
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                     -- tool, tutorial, doc, library
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  
  -- Classification
  domain TEXT,                            -- A, B, C, D, E, F, G
  tags TEXT,                              -- JSON array
  
  -- Métadonnées
  source TEXT,                            -- DRI, Students, HarnAI, manual
  added_at TEXT NOT NULL,
  updated_at TEXT,
  
  -- Qualité
  verified INTEGER,                       -- 0/1
  confidence TEXT,                        -- high, medium, low
  
  -- Relations
  inspection_id TEXT,
  scrape_id TEXT,
  
  FOREIGN KEY (inspection_id) REFERENCES inspections(id),
  FOREIGN KEY (scrape_id) REFERENCES scrapes(id)
);

-- Tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT
);

-- Resource-Tags (many-to-many)
CREATE TABLE resource_tags (
  resource_id TEXT,
  tag_id TEXT,
  PRIMARY KEY (resource_id, tag_id),
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- Logs d'audit
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  operator TEXT,
  action TEXT NOT NULL,                   -- inspect, scrape, search, export
  target_type TEXT,                       -- inspection, scrape, resource
  target_id TEXT,
  result TEXT,                            -- success, error
  details TEXT                            -- JSON
);
```

### 5.2 Index FTS5 (ekts-fts.db)

```sql
-- Table FTS5 pour contenu texte
CREATE VIRTUAL TABLE inspections_fts USING fts5(
  inspection_id,
  title,
  description,
  content,
  tokenize='porter unicode61'
);

CREATE VIRTUAL TABLE resources_fts USING fts5(
  resource_id,
  title,
  description,
  content,
  tokenize='porter unicode61'
);

-- Triggers pour synchroniser FTS avec tables principales
-- (implémentés dans le code application)
```

### 5.3 Tables vectorielles (ekts-vectors.db)

```sql
-- Extension sqlite-vec
-- Note: sqlite-vec utilise des tables virtuelles vec0

-- Table pour embeddings d'inspections
CREATE VIRTUAL TABLE inspection_embeddings USING vec0(
  inspection_id TEXT PRIMARY KEY,
  embedding FLOAT[1536]                   -- OpenAI embeddings
);

-- Table pour embeddings de ressources
CREATE VIRTUAL TABLE resource_embeddings USING vec0(
  resource_id TEXT PRIMARY KEY,
  embedding FLOAT[1536]
);
```

---

## 6. Impact des décisions Phase 05

### 6.1 Anonymisation

**Contrainte :** Les données personnelles doivent être anonymisées avant stockage

**Implémentation :**

```typescript
interface AnonymizationConfig {
  fields: string[];                       // Champs à anonymiser
  method: 'hash' | 'delete' | 'mask';
}

function anonymizeBeforeStorage(data: any): any {
  const anonymized = { ...data };
  
  // Hash emails
  if (anonymized.email) {
    anonymized.email_hash = crypto
      .createHash('sha256')
      .update(anonymized.email)
      .digest('hex');
    delete anonymized.email;
  }
  
  // Supprimer données identifiantes
  delete anonymized.name;
  delete anonymized.phone;
  delete anonymized.address;
  
  return anonymized;
}
```

### 6.2 Rétention

**Contrainte :** Max 1 an avec auto-delete

**Implémentation :**

```sql
-- Colonne retention_until
ALTER TABLE inspections ADD COLUMN retention_until TEXT;
ALTER TABLE scrapes ADD COLUMN retention_until TEXT;

-- Job de nettoyage quotidien
-- (implémenté dans le code application)
DELETE FROM inspections WHERE retention_until < date('now');
DELETE FROM scrapes WHERE retention_until < date('now');
```

### 6.3 Audit

**Contrainte :** Logging complet de toutes les opérations

**Implémentation :**

```typescript
async function logAudit(action: string, target: any, result: string): Promise<void> {
  const log = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    operator: 'system',
    action,
    target_type: target.type,
    target_id: target.id,
    result,
    details: JSON.stringify(target)
  };
  
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, operator, action, target_type, target_id, result, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id, log.timestamp, log.operator, log.action,
    log.target_type, log.target_id, log.result, log.details
  );
}
```

---

## 7. Performance attendue

### 7.1 Benchmarks estimés

**Dataset de référence :**
- 10,000 inspections
- 50,000 ressources
- 100,000 chunks texte (FTS5)
- 50,000 embeddings (sqlite-vec)

**Performance estimée :**

| Opération | Latence | Justification |
|-----------|---------|---------------|
| **Lecture simple (PK)** | <1ms | SQLite in-process |
| **Requête complexe (JOIN)** | <10ms | Index optimisés |
| **Full-text search** | <5ms | FTS5 optimisé |
| **Vector search (100K)** | 5-15ms | sqlite-vec brute-force |
| **Insertion** | <1ms | WAL mode |
| **Backup complet** | <1s | Copie fichier |

### 7.2 Capacité

**Limites pratiques :**
- **SQLite** : ~1 TB max (théorique 281 TB)
- **FTS5** : 1M+ documents sans problème
- **sqlite-vec** : 100K vectors confortablement, 1M possible

**Pour EKTS :**
- Estimation : <100K inspections, <500K ressources
- **Très largement dans les limites**

---

## 8. Migration et evolution

### 8.1 Quand migrer vers PostgreSQL

**Signaux d'alerte :**
- Dataset >10M rows
- Besoin de multi-utilisateurs concurrents
- Écritures >5K/sec
- Réplication multi-nœuds requise

**Stratégie de migration :**
1. Export SQLite → JSON/CSV
2. Import PostgreSQL
3. Mise à jour code (drivers SQL)
4. Tests de validation

### 8.2 Extension vers vector DB dédié

**Si >1M vectors :**
- Migrer sqlite-vec → Qdrant ou pgvector
- Garder SQLite pour données relationnelles
- Synchronisation via job

---

## 9. Backup et récupération

### 9.1 Stratégie de backup

**Quotidien :**
```bash
# Backup SQLite (copie fichier avec WAL)
cp ekts-data/db/ekts.db backups/daily/ekts-$(date +%Y%m%d).db
cp ekts-data/db/ekts.db-wal backups/daily/ekts-$(date +%Y%m%d).db-wal
```

**Hebdomadaire :**
```bash
# Backup complet avec compression
tar -czf backups/weekly/ekts-$(date +%Y%m%d).tar.gz ekts-data/
```

### 9.2 Récupération

**Scénarios :**
- **Corruption DB** : restaurer depuis backup
- **Perte de données** : restaurer backup + replay audit logs
- **Migration** : export/import JSON

---

## 10. Limites et incertitudes

### 10.1 Limites SQLite

- **Single-writer** : pas de writes concurrents
- **Pas de réplication native** : nécessite Litestream/LiteFS
- **Extensions limitées** : pas d'écosystème PostgreSQL

### 10.2 Non vérifié

- Performance sqlite-vec sur >100K vectors
- FTS5 sur >1M documents
- Backup/restore sur dataset >10GB

---

## 11. Décisions

### Décisions prises

1. **SQLite en mode WAL** — stockage principal
2. **FTS5** — recherche full-text
3. **sqlite-vec** — recherche vectorielle (RAG)
4. **JSON** — configurations, logs, exports
5. **Architecture 3 DB** — ekts.db, ekts-fts.db, ekts-vectors.db

### Décisions reportées

- Migration vers PostgreSQL si >10M rows
- Vector DB dédié si >1M vectors
- Réplication si multi-utilisateurs

---

## 12. Sources

### Benchmarks
- **intuitem.com** — "PostgreSQL vs SQLite, 2026 edition" (mai 2026)
- **leaper.dev** — "PostgreSQL vs MySQL vs SQLite in 2026: Benchmarks from 1K to 10M Rows"
- **kunalganglani.com** — "SQLite vs PostgreSQL 2026: Which DB Wins for App Backends?"

### Vector databases
- **firecrawl.dev** — "Best Vector Databases in 2026"
- **encore.dev** — "Best Vector Databases in 2026: Complete Comparison Guide"
- **sqlite.ai** — "Building a RAG on SQLite"

### Full-text search
- **getoyma.com** — "SQLite FTS5 Full-Text Search in Notes" (oct. 2026)
- **github.com/processwire** — PR #372 SQLite FTS5 benchmarks

---

**Livrable rédigé le 21 octobre 2026 — Phase 06 du projet EKTS**
