import type Database from 'better-sqlite3';

import { FTS_SCHEMA, TABLES } from '../shared/constants.js';
import { IndexingError } from '../shared/errors.js';

interface ResourceIndexRow {
  rowid: number;
  id: string;
  title: string;
  content: string | null;
  tags: string;
}

/** Résultat d'une réindexation complète. */
export interface ReindexReport {
  /** Ressources présentes dans `ekts.db`. */
  resources: number;
  /** Lignes effectivement écrites dans l'index FTS5. */
  indexed: number;
  /** Durée de l'opération, en millisecondes. */
  durationMs: number;
}

/** État de cohérence entre la base principale et l'index plein texte. */
export interface IndexIntegrityReport {
  resources: number;
  indexed: number;
  /** Ressources sans entrée FTS (index en retard). */
  missing: number;
  /** Entrées FTS dont la ressource n'existe plus (résidus). */
  orphans: number;
  consistent: boolean;
}

/**
 * Contrat de maintenance des index.
 *
 * C'est le point d'extension du Sprint 4 : `VectorIndexer` implémentera la même
 * interface pour l'index vectoriel, et `KnowledgeManager` pourra recevoir un
 * `IIndexer` composite sans changer de signature (injection de dépendances,
 * ADR-005).
 */
export interface IIndexer {
  /** Reconstruit l'index depuis la base principale. */
  reindexAll(): ReindexReport;
  /** Compare la base principale et l'index, sans rien modifier. */
  checkIntegrity(): IndexIntegrityReport;
  /** Nombre de ressources enregistrées dans la base principale. */
  countResources(): number;
  /** Nombre d'entrées présentes dans l'index. */
  countIndexed(): number;
}

/**
 * Maintenance de l'index plein texte (`ekts-fts.db`).
 *
 * **L'indexation courante n'est pas ici** : `ResourceRepository` écrit la
 * ressource et son entrée FTS dans une seule transaction (Sprint 2), ce qui
 * interdit tout état intermédiaire. Un indexeur séparé appelé après coup
 * pourrait échouer sans annuler l'écriture, ou insérer une seconde ligne pour
 * le même `rowid`.
 *
 * `Indexer` couvre le complément : la **réparation**. SQLite ne garantissant
 * pas la durabilité transactionnelle entre fichiers attachés en mode WAL, un
 * arrêt brutal peut laisser l'index en retard (voir `docs/guides/DATA_LAYER.md`
 * §9.1). `reindexAll()` reconstruit l'index depuis la source de vérité.
 */
export class Indexer implements IIndexer {
  private readonly selectResources;
  private readonly selectIndexed;
  private readonly countResourcesStatement;

  constructor(private readonly connection: Database.Database) {
    this.selectResources = connection.prepare(`
      SELECT rowid, id, title, content, tags
        FROM ${TABLES.resources}
       ORDER BY rowid
    `);
    this.selectIndexed = connection.prepare(`
      SELECT rowid, resource_id
        FROM ${FTS_SCHEMA}.${TABLES.resourcesFts}
    `);
    this.countResourcesStatement = connection.prepare(
      `SELECT count(*) AS total FROM ${TABLES.resources}`,
    );
  }

  /**
   * Reconstruit intégralement l'index FTS5 depuis `ekts.db`.
   *
   * Opération atomique : en cas d'échec, l'index précédent est restauré.
   */
  reindexAll(): ReindexReport {
    const startedAt = Date.now();
    const resources = this.selectResources.all() as ResourceIndexRow[];

    const rebuild = this.connection.transaction(() => {
      this.connection.prepare(`DELETE FROM ${FTS_SCHEMA}.${TABLES.resourcesFts}`).run();

      const insert = this.connection.prepare(`
        INSERT INTO ${FTS_SCHEMA}.${TABLES.resourcesFts} (rowid, resource_id, title, content, tags)
        VALUES (@rowid, @resourceId, @title, @content, @tags)
      `);

      for (const resource of resources) {
        insert.run({
          rowid: resource.rowid,
          resourceId: resource.id,
          title: resource.title,
          content: resource.content ?? '',
          tags: parseTags(resource.tags).join(' '),
        });
      }
    });

    try {
      rebuild();
    } catch (error) {
      throw new IndexingError(
        `réindexation interrompue, index précédent conservé (${resources.length} ressources)`,
        { cause: error },
      );
    }

    return {
      resources: resources.length,
      indexed: resources.length,
      durationMs: Date.now() - startedAt,
    };
  }

  /** Nombre de ressources enregistrées dans la base principale. */
  countResources(): number {
    return (this.countResourcesStatement.get() as { total: number }).total;
  }

  /** Nombre d'entrées présentes dans l'index plein texte. */
  countIndexed(): number {
    return (this.selectIndexed.all() as unknown[]).length;
  }

  /**
   * Compare la base principale et l'index sans rien modifier.
   * `consistent` est vrai lorsque les deux ensembles coïncident exactement.
   */
  checkIntegrity(): IndexIntegrityReport {
    const resources = this.selectResources.all() as ResourceIndexRow[];
    const indexed = this.selectIndexed.all() as { rowid: number; resource_id: string }[];

    const resourceIds = new Set(resources.map((resource) => resource.id));
    const resourceRowIds = new Set(resources.map((resource) => resource.rowid));
    const indexedIds = new Set(indexed.map((entry) => entry.resource_id));
    const indexedRowIds = new Set(indexed.map((entry) => entry.rowid));

    const missing = resources.filter(
      (resource) => !indexedIds.has(resource.id) || !indexedRowIds.has(resource.rowid),
    ).length;

    const orphans = indexed.filter(
      (entry) => !resourceIds.has(entry.resource_id) || !resourceRowIds.has(entry.rowid),
    ).length;

    return {
      resources: resources.length,
      indexed: indexed.length,
      missing,
      orphans,
      consistent: missing === 0 && orphans === 0 && resources.length === indexed.length,
    };
  }
}

/**
 * Lit la colonne `tags` (JSON texte).
 * Le `CHECK json_valid(tags)` de la table garantit que `JSON.parse` ne peut pas
 * échouer ; seule la forme est vérifiée ici.
 */
function parseTags(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw);

  return Array.isArray(parsed)
    ? parsed.filter((tag): tag is string => typeof tag === 'string')
    : [];
}
