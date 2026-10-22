import type Database from 'better-sqlite3';

import { EMBEDDING_DIMENSIONS, FTS_SCHEMA, TABLES, VECTOR_SCHEMA } from '../../shared/constants.js';

/**
 * Schéma de la base principale (`ekts.db`) : ressources, projets, audits.
 */
export function createStructuredSchema(connection: Database.Database): void {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLES.resources} (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL CHECK (type IN ('article', 'video', 'tutorial', 'tool', 'other')),
      title           TEXT NOT NULL CHECK (length(trim(title)) > 0),
      url             TEXT,
      tags            TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
      metadata        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
      content         TEXT,
      embedding_model TEXT,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${TABLES.projects} (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description  TEXT,
      status       TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
      started_at   TEXT,
      completed_at TEXT,
      metadata     TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${TABLES.audits} (
      id         TEXT PRIMARY KEY,
      url        TEXT NOT NULL,
      level      TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'L4')),
      findings   TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(findings)),
      metadata   TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_resources_type       ON ${TABLES.resources}(type);
    CREATE INDEX IF NOT EXISTS idx_resources_created_at ON ${TABLES.resources}(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_status      ON ${TABLES.projects}(status);
    CREATE INDEX IF NOT EXISTS idx_audits_url           ON ${TABLES.audits}(url);
    CREATE INDEX IF NOT EXISTS idx_audits_created_at    ON ${TABLES.audits}(created_at DESC);
  `);
}

/**
 * Index plein texte (`ekts-fts.db`).
 *
 * Table FTS5 **autonome** (pas de `content=` externe) : une table de contenu
 * située dans un autre fichier SQLite ne peut pas être référencée par FTS5.
 * La synchronisation est assurée par `ResourceRepository`, dans la même
 * transaction que l'écriture principale.
 */
export function createFtsSchema(connection: Database.Database): void {
  connection.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ${FTS_SCHEMA}.${TABLES.resourcesFts} USING fts5(
      resource_id UNINDEXED,
      title,
      content,
      tags,
      tokenize = 'porter unicode61 remove_diacritics 2'
    );
  `);
}

/**
 * Index vectoriel (`ekts-vectors.db`).
 * Nécessite l'extension `sqlite-vec` chargée sur la connexion.
 */
export function createVectorSchema(connection: Database.Database): void {
  connection.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ${VECTOR_SCHEMA}.${TABLES.resourcesVectors} USING vec0(
      resource_id TEXT PRIMARY KEY,
      embedding float[${EMBEDDING_DIMENSIONS}]
    );
  `);
}

/** Migration 001 — création des trois schémas. */
export function migration001Init(connection: Database.Database): void {
  createStructuredSchema(connection);
  createFtsSchema(connection);
  createVectorSchema(connection);
}
