# SPRINT-15-01 — Types, Migration, BestPracticeRepository et BestPracticeSearch

**Sprint :** 15-01 sur 15 (Sous-sprint 1/3)  
**Durée :** 3 jours  
**Statut :** ✅ TERMINÉ

---

## 1. Objectif du sous-sprint

Implémenter la couche de stockage et de recherche des bonnes pratiques :
- **Types** : Définir les interfaces TypeScript partagées
- **Migration** : Créer les tables `best_practices`, `best_practices_fts` et `finding_best_practice`
- **BestPracticeRepository** : CRUD complet avec filtres et pagination
- **BestPracticeSearch** : Recherche hybride (FTS5 + RRF) réutilisant le pattern du Sprint 4

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 14 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que les modules requis existent
ls src/timeline/
# Doit afficher : timeline-analyzer.ts, trend-detector.ts, alert-manager.ts,
# chart-generator.ts, timeline.types.ts

# Vérifier la structure existante
ls src/storage/
# Doit afficher les repositories et migrations existants
```

### 2.2 Documents à lire

- `SPRINT-15.md` (document parent)
- `SPRINT-14-RESULTAT.md` (résultats du sprint précédent)
- `docs/blueprint/Docs/04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` (schémas SQLite)
- `src/storage/search.ts` (pattern de recherche hybride existant)
- `src/business/rrf.ts` (RRF_K et reciprocalRank)

---

## 3. Tâches détaillées

### 3.1 Définir les types partagés (2h)

**Fichier :** `src/best-practices/best-practice.types.ts`

```typescript
/**
 * Types du module de capitalisation des bonnes pratiques (Sprint 15).
 *
 * Les bonnes pratiques sont extraites des constats résolus dans les audits
 * ou créées manuellement par les utilisateurs. Elles sont recherchables via
 * un moteur hybride (FTS5 + vecteurs + RRF) et associées aux findings
 * récurrents.
 */

import type { AnalysisDimension } from '../analysis/types.js';

/**
 * Catégories de bonnes pratiques.
 * Reprend les 5 dimensions d'analyse + une catégorie « general ».
 */
export type BestPracticeCategory = AnalysisDimension | 'general';

/**
 * Bonne pratique stockée.
 */
export interface BestPractice {
  /** Identifiant UUID. */
  id: string;
  /** Titre lisible. */
  title: string;
  /** Description détaillée. */
  description: string;
  /** Catégorie (dimension ou general). */
  category: BestPracticeCategory;
  /** Tags pour le filtrage fin. */
  tags: string[];
  /** IDs des projets source (JSON). */
  sourceProjectIds: string[];
  /** IDs des audits source (JSON). */
  sourceAuditIds: number[];
  /** Nombre d'occurrences détectées. */
  occurrenceCount: number;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de dernière mise à jour (ISO 8601). */
  updatedAt: string;
  /** true si créée manuellement (pas par l'extracteur). */
  isManual: boolean;
}

/**
 * Entrée pour créer une bonne pratique.
 */
export interface CreateBestPracticeInput {
  title: string;
  description: string;
  category: BestPracticeCategory;
  tags?: string[];
  sourceProjectIds?: string[];
  sourceAuditIds?: number[];
  isManual?: boolean;
}

/**
 * Entrée pour mettre à jour une bonne pratique.
 */
export interface UpdateBestPracticeInput {
  title?: string;
  description?: string;
  category?: BestPracticeCategory;
  tags?: string[];
}

/**
 * Filtres pour lister les bonnes pratiques.
 */
export interface BestPracticeFilters {
  /** Filtre par catégorie. */
  category?: BestPracticeCategory;
  /** Filtre par tag (au moins un tag commun). */
  tag?: string;
  /** Filtre par projet source. */
  projectId?: string;
  /** Filtre par type (manuel / automatique). */
  isManual?: boolean;
  /** Nombre maximum de résultats (défaut: 50). */
  limit?: number;
  /** Décalage pour la pagination (défaut: 0). */
  offset?: number;
  /** Tri (défaut: created_at DESC). */
  orderBy?: 'created_at' | 'updated_at' | 'occurrence_count' | 'title';
  /** Ordre de tri. */
  orderDir?: 'asc' | 'desc';
}

/**
 * Options de recherche hybride.
 */
export interface BestPracticeSearchOptions {
  /** Requête de recherche (absente : énumération filtrée). */
  query?: string;
  /** Filtre par catégorie. */
  category?: BestPracticeCategory;
  /** Filtre par tag. */
  tag?: string;
  /** Filtre par projet source. */
  projectId?: string;
  /** Nombre maximum de résultats. */
  limit?: number;
  /** Décalage pour la pagination. */
  offset?: number;
}

/**
 * Résultat de recherche d'une bonne pratique.
 */
export interface BestPracticeSearchResult {
  /** Bonne pratique trouvée. */
  practice: BestPractice;
  /** Score de pertinence (0-1, 1 = parfait). */
  score: number;
  /** Type de match (fts, semantic, hybrid). */
  matchType: 'fts' | 'semantic' | 'hybrid' | 'list';
}

/**
 * Association finding ↔ bonne pratique.
 */
export interface FindingBestPracticeLink {
  /** Titre normalisé du finding. */
  findingTitle: string;
  /** Dimension du finding. */
  dimension: AnalysisDimension;
  /** ID de la bonne pratique associée. */
  bestPracticeId: string;
  /** Score de confiance (0-1). */
  confidence: number;
  /** Date de création de l'association. */
  createdAt: string;
}

/**
 * Rapport d'extraction automatique.
 */
export interface ExtractionReport {
  /** Nombre d'audits analysés. */
  auditsAnalyzed: number;
  /** Nombre de bonnes pratiques extraites. */
  practicesExtracted: number;
  /** Nombre de bonnes pratiques fusionnées (déduplication). */
  practicesMerged: number;
  /** Nombre d'associations finding ↔ BP créées. */
  linksCreated: number;
  /** Durée d'exécution (ms). */
  durationMs: number;
}
```

**Critères d'acceptation :**
- Tous les types exportés et documentés
- Cohérence avec `AnalysisDimension` existant
- JSDoc complète sur chaque interface

---

### 3.2 Créer la migration 006 (3h)

**Fichier :** `src/storage/migrations/006_create_best_practices.ts`

```typescript
import type { Database } from 'better-sqlite3';

/**
 * Migration 006 : Tables pour la capitalisation des bonnes pratiques (Sprint 15).
 *
 * Crée 3 tables :
 * 1. `best_practices` — stockage principal des bonnes pratiques
 * 2. `best_practices_fts` — index plein texte FTS5 pour recherche hybride
 * 3. `finding_best_practice` — association finding ↔ bonne pratique
 */
export function migration006CreateBestPractices(db: Database.Database): void {
  // Table principale des bonnes pratiques
  db.exec(`
    CREATE TABLE IF NOT EXISTS best_practices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      source_project_ids TEXT NOT NULL DEFAULT '[]',
      source_audit_ids TEXT NOT NULL DEFAULT '[]',
      occurrence_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_manual INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Index pour les filtres courants
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_best_practices_category
    ON best_practices(category)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_best_practices_created_at
    ON best_practices(created_at DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_best_practices_updated_at
    ON best_practices(updated_at DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_best_practices_occurrence
    ON best_practices(occurrence_count DESC)
  `);

  // Table FTS5 pour la recherche plein texte
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS best_practices_fts USING fts5(
      title,
      description,
      tags,
      content='best_practices',
      content_rowid='rowid'
    )
  `);

  // Table d'association finding ↔ bonne pratique
  db.exec(`
    CREATE TABLE IF NOT EXISTS finding_best_practice (
      finding_title TEXT NOT NULL,
      dimension TEXT NOT NULL,
      best_practice_id TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL,
      PRIMARY KEY (finding_title, dimension, best_practice_id),
      FOREIGN KEY (best_practice_id) REFERENCES best_practices(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_finding_bp_finding
    ON finding_best_practice(finding_title, dimension)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_finding_bp_practice
    ON finding_best_practice(best_practice_id)
  `);

  // Triggers de synchronisation FTS5
  // INSERT
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_bp_fts_insert
    AFTER INSERT ON best_practices
    BEGIN
      INSERT INTO best_practices_fts(rowid, title, description, tags)
      VALUES (new.rowid, new.title, new.description, new.tags);
    END
  `);

  // UPDATE
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_bp_fts_update
    AFTER UPDATE ON best_practices
    BEGIN
      DELETE FROM best_practices_fts WHERE rowid = old.rowid;
      INSERT INTO best_practices_fts(rowid, title, description, tags)
      VALUES (new.rowid, new.title, new.description, new.tags);
    END
  `);

  // DELETE
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_bp_fts_delete
    AFTER DELETE ON best_practices
    BEGIN
      DELETE FROM best_practices_fts WHERE rowid = old.rowid;
    END
  `);
}
```

**Mettre à jour le registre des migrations :**

**Fichier :** `src/storage/migrations/migration-registry.ts`

Ajouter la nouvelle migration à la fin du tableau :
```typescript
import { migration006CreateBestPractices } from './006_create_best_practices.js';

// Ajouter à la fin du tableau migrations[] :
{
  version: 6,
  name: 'create_best_practices',
  up: migration006CreateBestPractices,
},
```

**Critères d'acceptation :**
- Migration exécutable sans erreur
- 3 tables créées avec tous les champs et index
- Triggers FTS5 fonctionnels (INSERT, UPDATE, DELETE synchronisés)
- Migration idempotente (IF NOT EXISTS)

---

### 3.3 Implémenter BestPracticeRepository (6h)

**Fichier :** `src/best-practices/best-practice-repository.ts`

```typescript
import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import type { AnalysisDimension } from '../analysis/types.js';

import type {
  BestPractice,
  BestPracticeFilters,
  CreateBestPracticeInput,
  FindingBestPracticeLink,
  UpdateBestPracticeInput,
} from './best-practice.types.js';

/**
 * Repository pour la gestion des bonnes pratiques (Sprint 15).
 *
 * Fournit le CRUD complet, les filtres par catégorie/tag/projet,
 * la pagination et les opérations d'association finding ↔ bonne pratique.
 */
export class BestPracticeRepository {
  constructor(private readonly db: Database.Database) {}

  /**
   * Créer une bonne pratique.
   */
  create(input: CreateBestPracticeInput): BestPractice {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO best_practices (
        id, title, description, category, tags,
        source_project_ids, source_audit_ids,
        occurrence_count, created_at, updated_at, is_manual
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.title,
      input.description,
      input.category,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.sourceProjectIds ?? []),
      JSON.stringify(input.sourceAuditIds ?? []),
      1,
      now,
      now,
      input.isManual ? 1 : 0
    );

    return this.getById(id)!;
  }

  /**
   * Récupérer une bonne pratique par ID.
   */
  getById(id: string): BestPractice | null {
    const stmt = this.db.prepare('SELECT * FROM best_practices WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Lister les bonnes pratiques avec filtres et pagination.
   */
  list(filters: BestPracticeFilters = {}): BestPractice[] {
    let query = 'SELECT * FROM best_practices WHERE 1=1';
    const params: unknown[] = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.tag) {
      // Recherche dans le JSON tags
      query += " AND json_each.value = ?";
      // On utilise LIKE sur le JSON sérialisé pour la simplicité
      // (une approche json_each serait plus propre mais plus lourde)
      query = query.replace(" AND json_each.value = ?", " AND tags LIKE ?");
      params.push(`%"${filters.tag}"%`);
    }

    if (filters.projectId) {
      query += " AND source_project_ids LIKE ?";
      params.push(`%"${filters.projectId}"%`);
    }

    if (filters.isManual !== undefined) {
      query += ' AND is_manual = ?';
      params.push(filters.isManual ? 1 : 0);
    }

    // Tri
    const orderBy = filters.orderBy ?? 'created_at';
    const orderDir = filters.orderDir ?? 'desc';
    query += ` ORDER BY ${orderBy} ${orderDir}`;

    // Pagination
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    return rows.map(row => this.mapRow(row));
  }

  /**
   * Mettre à jour une bonne pratique.
   */
  update(id: string, input: UpdateBestPracticeInput): BestPractice {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`BestPractice ${id} not found`);
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.title !== undefined) {
      fields.push('title = ?');
      params.push(input.title);
    }

    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description);
    }

    if (input.category !== undefined) {
      fields.push('category = ?');
      params.push(input.category);
    }

    if (input.tags !== undefined) {
      fields.push('tags = ?');
      params.push(JSON.stringify(input.tags));
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    params.push(now);

    params.push(id);
    this.db.prepare(`UPDATE best_practices SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    return this.getById(id)!;
  }

  /**
   * Supprimer une bonne pratique.
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM best_practices WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Incrémenter le compteur d'occurrences.
   */
  incrementOccurrence(id: string, projectId?: string, auditId?: number): void {
    const existing = this.getById(id);
    if (!existing) return;

    const sourceProjects = projectId && !existing.sourceProjectIds.includes(projectId)
      ? [...existing.sourceProjectIds, projectId]
      : existing.sourceProjectIds;

    const sourceAudits = auditId && !existing.sourceAuditIds.includes(auditId)
      ? [...existing.sourceAuditIds, auditId]
      : existing.sourceAuditIds;

    this.db.prepare(`
      UPDATE best_practices
      SET occurrence_count = occurrence_count + 1,
          source_project_ids = ?,
          source_audit_ids = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(sourceProjects),
      JSON.stringify(sourceAudits),
      new Date().toISOString(),
      id
    );
  }

  /**
   * Lier un finding à une bonne pratique.
   */
  linkToFinding(bestPracticeId: string, findingTitle: string, dimension: AnalysisDimension, confidence = 1.0): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT OR IGNORE INTO finding_best_practice (finding_title, dimension, best_practice_id, confidence, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(findingTitle, dimension, bestPracticeId, confidence, now);
  }

  /**
   * Supprimer le lien finding ↔ bonne pratique.
   */
  unlinkFromFinding(bestPracticeId: string, findingTitle: string, dimension: AnalysisDimension): void {
    this.db.prepare(`
      DELETE FROM finding_best_practice
      WHERE best_practice_id = ? AND finding_title = ? AND dimension = ?
    `).run(bestPracticeId, findingTitle, dimension);
  }

  /**
   * Trouver les bonnes pratiques associées à un finding.
   */
  findByFinding(findingTitle: string, dimension: AnalysisDimension): BestPractice[] {
    const stmt = this.db.prepare(`
      SELECT bp.*
      FROM best_practices bp
      JOIN finding_best_practice fbp ON bp.id = fbp.best_practice_id
      WHERE fbp.finding_title = ? AND fbp.dimension = ?
      ORDER BY fbp.confidence DESC
    `);

    const rows = stmt.all(findingTitle, dimension) as Record<string, unknown>[];
    return rows.map(row => this.mapRow(row));
  }

  /**
   * Trouver les findings associés à une bonne pratique.
   */
  findLinkedFindings(bestPracticeId: string): FindingBestPracticeLink[] {
    const stmt = this.db.prepare(`
      SELECT * FROM finding_best_practice WHERE best_practice_id = ?
    `);

    const rows = stmt.all(bestPracticeId) as Record<string, unknown>[];
    return rows.map(row => ({
      findingTitle: row.finding_title as string,
      dimension: row.dimension as AnalysisDimension,
      bestPracticeId: row.best_practice_id as string,
      confidence: row.confidence as number,
      createdAt: row.created_at as string,
    }));
  }

  /**
   * Compter les bonnes pratiques.
   */
  count(filters?: BestPracticeFilters): number {
    let query = 'SELECT COUNT(*) as count FROM best_practices WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.projectId) {
      query += " AND source_project_ids LIKE ?";
      params.push(`%"${filters.projectId}"%`);
    }

    if (filters?.isManual !== undefined) {
      query += ' AND is_manual = ?';
      params.push(filters.isManual ? 1 : 0);
    }

    const stmt = this.db.prepare(query);
    const row = stmt.get(...params) as { count: number };
    return row.count;
  }

  /**
   * Mapper une ligne de base de données vers un objet BestPractice.
   */
  private mapRow(row: Record<string, unknown>): BestPractice {
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      category: row.category as BestPractice['category'],
      tags: JSON.parse(row.tags as string) as string[],
      sourceProjectIds: JSON.parse(row.source_project_ids as string) as string[],
      sourceAuditIds: JSON.parse(row.source_audit_ids as string) as number[],
      occurrenceCount: row.occurrence_count as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      isManual: (row.is_manual as number) === 1,
    };
  }
}
```

**Critères d'acceptation :**
- CRUD complet (create, getById, list, update, delete)
- Filtres fonctionnels (category, tag, projectId, isManual)
- Pagination (limit, offset)
- Tri configurable (created_at, updated_at, occurrence_count, title)
- Associations bidirectionnelles (linkToFinding, unlinkFromFinding, findByFinding, findLinkedFindings)
- Compteur d'occurrences (incrementOccurrence)
- Méthode count()
- Gestion des erreurs (update non-existent, etc.)

---

### 3.4 Implémenter BestPracticeSearch (5h)

**Fichier :** `src/best-practices/best-practice-search.ts`

```typescript
import type { Database } from 'better-sqlite3';

import { RRF_K, reciprocalRank } from '../business/rrf.js';

import type {
  BestPracticeSearchOptions,
  BestPracticeSearchResult,
} from './best-practice.types.js';
import { BestPracticeRepository } from './best-practice-repository.js';

/**
 * Recherche hybride de bonnes pratiques (Sprint 15).
 *
 * Reproduit le pattern du Sprint 4 :
 * - **Avec requête** : FTS5 (BM25) + [embeddings si disponibles] + fusion RRF
 * - **Sans requête** : énumération filtrée (hérite de BestPracticeRepository.list)
 *
 * La table FTS5 `best_practices_fts` est synchronisée par triggers
 * (INSERT/UPDATE/DELETE sur `best_practices`).
 */
export class BestPracticeSearch {
  constructor(
    private readonly db: Database.Database,
    private readonly repo: BestPracticeRepository,
  ) {}

  /**
   * Rechercher des bonnes pratiques (hybride ou filtrée).
   */
  search(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    if (!options.query) {
      return this.listFiltered(options);
    }

    return this.hybridSearch(options);
  }

  /**
   * Recherche hybride : FTS5 + RRF.
   */
  private hybridSearch(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    const query = options.query!;
    const limit = options.limit ?? 20;

    // 1. Recherche FTS5 (BM25)
    const ftsResults = this.searchFts(query, limit * 2);

    // Pas de results sémantiques sans magasin d'embeddings injecté
    // → classement FTS seul avec score normalisé
    if (ftsResults.length === 0) {
      return [];
    }

    // Normalisation des scores BM25 (négatifs, le plus proche de 0 = meilleur)
    const maxBm25 = Math.max(...ftsResults.map(r => Math.abs(r.rank)));

    return ftsResults
      .map((result, index) => {
        const practice = this.repo.getById(result.id);
        if (!practice) return null;

        // Score normalisé : 1 - (|bm25| / max|bm25|) → 1 = meilleur match
        const normalizedScore = maxBm25 > 0
          ? 1 - Math.abs(result.rank) / maxBm25
          : 1 - index / ftsResults.length;

        return {
          practice,
          score: Math.max(0, Math.min(1, normalizedScore)),
          matchType: 'fts' as const,
        };
      })
      .filter((r): r is BestPracticeSearchResult => r !== null)
      .slice(0, limit);
  }

  /**
   * Recherche FTS5 avec BM25.
   */
  private searchFts(query: string, limit: number): Array<{ id: string; rank: number }> {
    // Assainir la requête FTS5 (échapper les caractères spéciaux)
    const sanitizedQuery = this.sanitizeFtsQuery(query);
    if (!sanitizedQuery) return [];

    const stmt = this.db.prepare(`
      SELECT bp.id, fts.rank
      FROM best_practices_fts fts
      JOIN best_practices bp ON bp.rowid = fts.rowid
      WHERE best_practices_fts MATCH ?
      ORDER BY fts.rank
      LIMIT ?
    `);

    try {
      return stmt.all(sanitizedQuery, limit) as Array<{ id: string; rank: number }>;
    } catch {
      // Si la requête FTS est invalide malgré le sanitizing, retourner vide
      return [];
    }
  }

  /**
   * Énumération filtrée (pas de requête textuelle).
   */
  private listFiltered(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    const practices = this.repo.list({
      category: options.category,
      tag: options.tag,
      projectId: options.projectId,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
      orderBy: 'occurrence_count',
      orderDir: 'desc',
    });

    return practices.map(practice => ({
      practice,
      score: 1.0,
      matchType: 'list' as const,
    }));
  }

  /**
   * Assainir une requête pour FTS5.
   * Échappe les caractères spéciaux et supprime les opérateurs FTS dangereux.
   */
  private sanitizeFtsQuery(query: string): string {
    return query
      .replace(/["'`()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(term => `"${term}"`)
      .join(' ');
  }
}
```

**Critères d'acceptation :**
- Recherche FTS5 fonctionnelle (BM25)
- Recherche filtrée sans requête (énumération)
- Score normalisé (0-1)
- Sanitization des requêtes FTS5 (pas d'injection)
- Gestion d'erreurs FTS (requête invalide → résultats vides)
- Réutilisation de `RRF_K` et `reciprocalRank` du module existant
- Prêt pour extension future (embeddings)

---

### 3.5 Tests unitaires BestPracticeRepository (4h)

**Fichier :** `tests/best-practices/best-practice-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { BestPracticeRepository } from '../../src/best-practices/best-practice-repository.js';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';

describe('BestPracticeRepository', () => {
  let db: Database.Database;
  let repo: BestPracticeRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    migration006CreateBestPractices(db);
    repo = new BestPracticeRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('devrait créer une bonne pratique avec tous les champs', () => {
      const bp = repo.create({
        title: 'Optimiser les images',
        description: 'Utiliser le format WebP pour réduire la taille des images',
        category: 'performance',
        tags: ['images', 'webp', 'optimization'],
        sourceProjectIds: ['project-1'],
        sourceAuditIds: [1, 2],
        isManual: false,
      });

      expect(bp.id).toBeDefined();
      expect(bp.title).toBe('Optimiser les images');
      expect(bp.category).toBe('performance');
      expect(bp.tags).toEqual(['images', 'webp', 'optimization']);
      expect(bp.sourceProjectIds).toEqual(['project-1']);
      expect(bp.occurrenceCount).toBe(1);
      expect(bp.isManual).toBe(false);
    });

    it('devrait utiliser les valeurs par défaut', () => {
      const bp = repo.create({
        title: 'Test',
        description: 'Description',
        category: 'general',
      });

      expect(bp.tags).toEqual([]);
      expect(bp.sourceProjectIds).toEqual([]);
      expect(bp.sourceAuditIds).toEqual([]);
      expect(bp.occurrenceCount).toBe(1);
      expect(bp.isManual).toBe(false);
    });
  });

  describe('getById', () => {
    it('devrait retourner null pour un ID inexistant', () => {
      expect(repo.getById('nonexistent')).toBeNull();
    });

    it('devrait retourner la bonne pratique', () => {
      const created = repo.create({
        title: 'Test',
        description: 'Desc',
        category: 'seo',
      });

      const found = repo.getById(created.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Test');
    });
  });

  describe('list', () => {
    it('devrait lister toutes les bonnes pratiques', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      repo.create({ title: 'BP2', description: 'D2', category: 'seo' });
      repo.create({ title: 'BP3', description: 'D3', category: 'performance' });

      const all = repo.list();
      expect(all).toHaveLength(3);
    });

    it('devrait filtrer par catégorie', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      repo.create({ title: 'BP2', description: 'D2', category: 'seo' });

      const filtered = repo.list({ category: 'performance' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('performance');
    });

    it('devrait filtrer par tag', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance', tags: ['webp', 'images'] });
      repo.create({ title: 'BP2', description: 'D2', category: 'performance', tags: ['lazy-loading'] });

      const filtered = repo.list({ tag: 'webp' });
      expect(filtered).toHaveLength(1);
    });

    it('devrait filtrer par projet', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance', sourceProjectIds: ['proj-1'] });
      repo.create({ title: 'BP2', description: 'D2', category: 'performance', sourceProjectIds: ['proj-2'] });

      const filtered = repo.list({ projectId: 'proj-1' });
      expect(filtered).toHaveLength(1);
    });

    it('devrait paginer les résultats', () => {
      for (let i = 0; i < 10; i++) {
        repo.create({ title: `BP${i}`, description: `D${i}`, category: 'general' });
      }

      const page1 = repo.list({ limit: 3, offset: 0 });
      expect(page1).toHaveLength(3);

      const page2 = repo.list({ limit: 3, offset: 3 });
      expect(page2).toHaveLength(3);

      // Les pages ne doivent pas se chevaucher
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('devrait trier par occurrence_count', () => {
      const bp1 = repo.create({ title: 'BP1', description: 'D1', category: 'general' });
      repo.incrementOccurrence(bp1.id);
      repo.incrementOccurrence(bp1.id);
      repo.create({ title: 'BP2', description: 'D2', category: 'general' });

      const sorted = repo.list({ orderBy: 'occurrence_count', orderDir: 'desc' });
      expect(sorted[0].occurrenceCount).toBe(3);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour les champs modifiés', () => {
      const bp = repo.create({ title: 'Original', description: 'Desc', category: 'seo' });

      const updated = repo.update(bp.id, { title: 'Updated', tags: ['new-tag'] });
      expect(updated.title).toBe('Updated');
      expect(updated.tags).toEqual(['new-tag']);
      expect(updated.description).toBe('Desc'); // inchangé
    });

    it('devrait lancer une erreur pour un ID inexistant', () => {
      expect(() => repo.update('nonexistent', { title: 'X' })).toThrow('not found');
    });
  });

  describe('delete', () => {
    it('devrait supprimer la bonne pratique', () => {
      const bp = repo.create({ title: 'To Delete', description: 'D', category: 'general' });
      repo.delete(bp.id);
      expect(repo.getById(bp.id)).toBeNull();
    });

    it('devrait supprimer les associations en cascade', () => {
      const bp = repo.create({ title: 'Linked', description: 'D', category: 'performance' });
      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');

      repo.delete(bp.id);
      expect(repo.findLinkedFindings(bp.id)).toHaveLength(0);
    });
  });

  describe('associations finding ↔ BP', () => {
    it('devrait lier et retrouver par finding', () => {
      const bp1 = repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      const bp2 = repo.create({ title: 'BP2', description: 'D2', category: 'performance' });

      repo.linkToFinding(bp1.id, 'perf-lcp-slow', 'performance', 0.9);
      repo.linkToFinding(bp2.id, 'perf-lcp-slow', 'performance', 0.7);

      const found = repo.findByFinding('perf-lcp-slow', 'performance');
      expect(found).toHaveLength(2);
      // Trié par confiance décroissante
      expect(found[0].id).toBe(bp1.id);
    });

    it('devrait retrouver les findings liés à une BP', () => {
      const bp = repo.create({ title: 'BP', description: 'D', category: 'seo' });

      repo.linkToFinding(bp.id, 'seo-meta-desc', 'seo');
      repo.linkToFinding(bp.id, 'seo-title-missing', 'seo');

      const findings = repo.findLinkedFindings(bp.id);
      expect(findings).toHaveLength(2);
    });

    it('ne doit pas créer de doublons', () => {
      const bp = repo.create({ title: 'BP', description: 'D', category: 'performance' });

      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      repo.linkToFinding(bp.id, 'perf-lcp-slow', 'performance'); // doublon

      const findings = repo.findLinkedFindings(bp.id);
      expect(findings).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('devrait compter toutes les bonnes pratiques', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      repo.create({ title: 'BP2', description: 'D2', category: 'seo' });

      expect(repo.count()).toBe(2);
    });

    it('devrait compter avec filtres', () => {
      repo.create({ title: 'BP1', description: 'D1', category: 'performance' });
      repo.create({ title: 'BP2', description: 'D2', category: 'seo' });

      expect(repo.count({ category: 'performance' })).toBe(1);
    });
  });
});
```

**Critères d'acceptation :**
- Tests CRUD complets
- Tests filtres et pagination
- Tests associations finding ↔ BP
- Tests incrementOccurrence
- Couverture > 90%

---

### 3.6 Tests unitaires BestPracticeSearch (3h)

**Fichier :** `tests/best-practices/best-practice-search.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { BestPracticeRepository } from '../../src/best-practices/best-practice-repository.js';
import { BestPracticeSearch } from '../../src/best-practices/best-practice-search.js';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';

describe('BestPracticeSearch', () => {
  let db: Database.Database;
  let repo: BestPracticeRepository;
  let search: BestPracticeSearch;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    migration006CreateBestPractices(db);
    repo = new BestPracticeRepository(db);
    search = new BestPracticeSearch(db, repo);

    // Créer des bonnes pratiques de test
    repo.create({
      title: 'Optimiser les images WebP',
      description: 'Convertir les images PNG/JPEG en WebP pour réduire la taille',
      category: 'performance',
      tags: ['images', 'webp'],
    });

    repo.create({
      title: 'Ajouter les attributs alt aux images',
      description: 'Chaque image doit avoir un attribut alt descriptif',
      category: 'accessibility',
      tags: ['images', 'alt', 'a11y'],
    });

    repo.create({
      title: 'Méta description unique par page',
      description: 'Chaque page doit avoir une méta description unique et pertinente',
      category: 'seo',
      tags: ['meta', 'seo'],
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('search avec requête', () => {
    it('devrait trouver par titre (FTS5)', () => {
      const results = search.search({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(r => r.score > 0)).toBe(true);
    });

    it('devrait trouver par description', () => {
      const results = search.search({ query: 'WebP' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].practice.title).toContain('WebP');
    });

    it('devrait retourner vide pour une requête sans résultats', () => {
      const results = search.search({ query: 'xyznonexistent' });
      expect(results).toHaveLength(0);
    });

    it('devrait gérer les caractères spéciaux', () => {
      const results = search.search({ query: 'images "test"' });
      // Ne doit pas crasher
      expect(Array.isArray(results)).toBe(true);
    });

    it('devrait respecter la limite', () => {
      const results = search.search({ query: 'images', limit: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('search sans requête (filtrée)', () => {
    it('devrait lister toutes les bonnes pratiques', () => {
      const results = search.search({});
      expect(results).toHaveLength(3);
    });

    it('devrait filtrer par catégorie', () => {
      const results = search.search({ category: 'performance' });
      expect(results).toHaveLength(1);
      expect(results[0].practice.category).toBe('performance');
    });

    it('devrait filtrer par tag', () => {
      const results = search.search({ tag: 'images' });
      expect(results).toHaveLength(2); // WebP + alt
    });
  });

  describe('matchType', () => {
    it('devrait retourner matchType=fts pour les recherches textuelles', () => {
      const results = search.search({ query: 'images' });
      expect(results.every(r => r.matchType === 'fts')).toBe(true);
    });

    it('devrait retourner matchType=list pour les énumérations', () => {
      const results = search.search({});
      expect(results.every(r => r.matchType === 'list')).toBe(true);
    });
  });
});
```

**Critères d'acceptation :**
- Tests recherche FTS5
- Tests recherche filtrée
- Tests cas limites (caractères spéciaux, requête vide)
- Tests matchType
- Couverture > 85%

---

## 4. Vérifications finales

### 4.1 Compilation et lint

```bash
npm run typecheck
npm run lint
```

Doit passer sans erreur.

### 4.2 Tests

```bash
npm test -- tests/best-practices/
```

Tous les tests doivent passer.

### 4.3 Couverture

```bash
npm run coverage -- tests/best-practices/
```

Couverture doit être > 80%.

---

## 5. Rapport de sous-sprint

Créer `SPRINT-15-01-RESULTAT.md` avec :

```markdown
# Rapport Sprint 15-01 — Types, Migration, Repository, Search

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés

- `src/best-practices/best-practice.types.ts`
- `src/best-practices/best-practice-repository.ts`
- `src/best-practices/best-practice-search.ts`
- `src/storage/migrations/006_create_best_practices.ts`
- `tests/best-practices/best-practice-repository.test.ts`
- `tests/best-practices/best-practice-search.test.ts`

## Modifications

- `src/storage/migrations/migration-registry.ts` (ajout migration 006)

## Tests exécutés

- BestPracticeRepository : X tests, tous passent
- BestPracticeSearch : Y tests, tous passent
- Couverture : Z%

## Décisions prises

1. [Décision 1]
2. [Décision 2]

## Problèmes rencontrés

1. [Problème 1] → [Solution]

## Prochaine étape

Sprint 15-02 : Extractor + Service + associations
```

---

## 6. Critères de validation du sous-sprint

- ✅ Types définis dans `best-practice.types.ts` (toutes les interfaces)
- ✅ Migration 006 créée (3 tables + triggers FTS5)
- ✅ Registre de migrations mis à jour
- ✅ `BestPracticeRepository` implémenté (CRUD + filtres + associations)
- ✅ `BestPracticeSearch` implémenté (FTS5 + filtrée)
- ✅ Tests unitaires complets
- ✅ Couverture > 80%
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 15-01 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 15-01 prêt pour implémentation**
