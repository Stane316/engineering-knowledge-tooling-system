import { randomUUID } from 'node:crypto';

import type Database from 'better-sqlite3';

import { FTS_SCHEMA, TABLES, VECTOR_SCHEMA } from '../../shared/constants.js';
import {
  CreateResourceSchema,
  ResourceFiltersSchema,
  UpdateResourceSchema,
  type CreateResourceInput,
  type Resource,
  type ResourceFilters,
  type UpdateResourceInput,
} from '../../shared/validators.js';

/** Ligne brute telle que stockée dans `resources`. */
interface ResourceRow {
  rowid: number;
  id: string;
  type: string;
  title: string;
  url: string | null;
  tags: string;
  metadata: string;
  content: string | null;
  embedding_model: string | null;
  created_at: string;
  updated_at: string;
}

interface RowIdRow {
  rowid: number;
}

const SELECT_COLUMNS =
  'rowid, id, type, title, url, tags, metadata, content, embedding_model, created_at, updated_at';

/**
 * Repository des ressources : CRUD sur `ekts.db`, indexation FTS5 dans
 * `ekts-fts.db` et purge de l'index vectoriel dans `ekts-vectors.db`.
 *
 * Toutes les écritures traversent **une seule transaction** couvrant les trois
 * schémas : une ressource n'est jamais visible sans son entrée FTS.
 */
export class ResourceRepository {
  private readonly selectById;
  private readonly selectRowId;
  private readonly mainInsert;
  private readonly mainUpdate;
  private readonly mainDelete;
  private readonly ftsInsert;
  private readonly ftsDelete;
  private readonly vectorDelete: Database.Statement | undefined;
  private readonly hasVectors: boolean;

  constructor(private readonly connection: Database.Database) {
    this.hasVectors = this.detectVectorTable();
    this.selectById = connection.prepare(
      `SELECT ${SELECT_COLUMNS} FROM ${TABLES.resources} WHERE id = ?`,
    );
    this.selectRowId = connection.prepare(`SELECT rowid FROM ${TABLES.resources} WHERE id = ?`);
    this.mainInsert = connection.prepare(`
      INSERT INTO ${TABLES.resources}
        (id, type, title, url, tags, metadata, content, embedding_model, created_at, updated_at)
      VALUES
        (@id, @type, @title, @url, @tags, @metadata, @content, @embeddingModel, @createdAt, @updatedAt)
    `);
    this.mainUpdate = connection.prepare(`
      UPDATE ${TABLES.resources}
         SET title = @title,
             url = @url,
             tags = @tags,
             metadata = @metadata,
             content = @content,
             embedding_model = @embeddingModel,
             updated_at = @updatedAt
       WHERE id = @id
    `);
    this.mainDelete = connection.prepare(`DELETE FROM ${TABLES.resources} WHERE id = ?`);
    this.ftsInsert = connection.prepare(`
      INSERT INTO ${FTS_SCHEMA}.${TABLES.resourcesFts} (rowid, resource_id, title, content, tags)
      VALUES (@rowid, @resourceId, @title, @content, @tags)
    `);
    this.ftsDelete = connection.prepare(
      `DELETE FROM ${FTS_SCHEMA}.${TABLES.resourcesFts} WHERE rowid = ?`,
    );
    this.vectorDelete = this.hasVectors
      ? connection.prepare(
          `DELETE FROM ${VECTOR_SCHEMA}.${TABLES.resourcesVectors} WHERE resource_id = ?`,
        )
      : undefined;
  }

  /** Crée une ressource, l'indexe en FTS5 et retourne l'objet persisté. */
  create(input: CreateResourceInput): Resource {
    const values = CreateResourceSchema.parse(input);
    const now = new Date().toISOString();

    const resource: Resource = {
      id: randomUUID(),
      type: values.type,
      title: values.title,
      tags: values.tags,
      metadata: values.metadata,
      createdAt: now,
      updatedAt: now,
      ...(values.url !== undefined ? { url: values.url } : {}),
      ...(values.content !== undefined ? { content: values.content } : {}),
    };

    const insert = this.connection.transaction(() => {
      const result = this.mainInsert.run(this.toRow(resource));
      this.indexFts(Number(result.lastInsertRowid), resource);
    });

    insert();

    return resource;
  }

  /** Retourne une ressource par identifiant, ou `null`. */
  getById(id: string): Resource | null {
    const row = this.selectById.get(id) as ResourceRow | undefined;

    return row ? toResource(row) : null;
  }

  /** Liste les ressources, filtrées et paginées. */
  list(filters: ResourceFilters = {}): Resource[] {
    const values = ResourceFiltersSchema.parse(filters);
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (values.type) {
      conditions.push('type = @type');
      params.type = values.type;
    }

    values.tags?.forEach((tag, index) => {
      conditions.push(
        `EXISTS (SELECT 1 FROM json_each(${TABLES.resources}.tags) WHERE json_each.value = @tag${index})`,
      );
      params[`tag${index}`] = tag;
    });

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (values.limit !== undefined) {
      params.limit = values.limit;
    }

    if (values.offset !== undefined) {
      params.offset = values.offset;
    }

    const query = `
      SELECT ${SELECT_COLUMNS}
        FROM ${TABLES.resources}
        ${where}
       ORDER BY created_at DESC, rowid DESC
       LIMIT @limit OFFSET @offset
    `;

    params.limit = values.limit ?? -1;
    params.offset = values.offset ?? 0;

    const rows = this.connection.prepare(query).all(params) as ResourceRow[];

    return rows.map(toResource);
  }

  /** Met à jour les champs fournis ; `null` efface `url`, `content` ou `embeddingModel`. */
  update(id: string, input: UpdateResourceInput): Resource | null {
    const values = UpdateResourceSchema.parse(input);
    const row = this.selectById.get(id) as ResourceRow | undefined;

    if (!row) {
      return null;
    }

    const existing = toResource(row);

    const updated: Resource = {
      id: existing.id,
      type: existing.type,
      title: values.title ?? existing.title,
      tags: values.tags ?? existing.tags,
      metadata: values.metadata ?? existing.metadata,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const url = 'url' in values ? (values.url ?? undefined) : existing.url;
    const content = 'content' in values ? (values.content ?? undefined) : existing.content;
    const embeddingModel =
      'embeddingModel' in values ? (values.embeddingModel ?? undefined) : existing.embeddingModel;

    if (url !== undefined) {
      updated.url = url;
    }

    if (content !== undefined) {
      updated.content = content;
    }

    if (embeddingModel !== undefined) {
      updated.embeddingModel = embeddingModel;
    }

    const apply = this.connection.transaction(() => {
      this.mainUpdate.run(this.toRow(updated));
      this.ftsDelete.run(row.rowid);
      this.indexFts(row.rowid, updated);
    });

    apply();

    return updated;
  }

  /** Supprime une ressource et ses entrées d'index. */
  delete(id: string): boolean {
    const row = this.selectRowId.get(id) as RowIdRow | undefined;

    if (!row) {
      return false;
    }

    const remove = this.connection.transaction(() => {
      this.ftsDelete.run(row.rowid);

      this.vectorDelete?.run(id);

      this.mainDelete.run(id);
    });

    remove();

    return true;
  }

  private detectVectorTable(): boolean {
    const row = this.connection
      .prepare(
        `SELECT 1 AS found FROM ${VECTOR_SCHEMA}.sqlite_master WHERE type = 'table' AND name = ?`,
      )
      .get(TABLES.resourcesVectors);

    return row !== undefined;
  }

  private indexFts(rowId: number, resource: Resource): void {
    this.ftsInsert.run({
      rowid: rowId,
      resourceId: resource.id,
      title: resource.title,
      content: resource.content ?? '',
      tags: resource.tags.join(' '),
    });
  }

  private toRow(resource: Resource): Record<string, string | null> {
    return {
      id: resource.id,
      type: resource.type,
      title: resource.title,
      url: resource.url ?? null,
      tags: JSON.stringify(resource.tags),
      metadata: JSON.stringify(resource.metadata),
      content: resource.content ?? null,
      embeddingModel: resource.embeddingModel ?? null,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }
}

function toResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    type: row.type as Resource['type'],
    title: row.title,
    tags: JSON.parse(row.tags) as string[],
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.url !== null ? { url: row.url } : {}),
    ...(row.content !== null ? { content: row.content } : {}),
    ...(row.embedding_model !== null ? { embeddingModel: row.embedding_model } : {}),
  };
}
