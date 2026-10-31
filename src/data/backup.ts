/**
 * Sauvegarde et restauration des trois bases (Sprint 23-03, C-O04).
 *
 * ## Ce que ce module promet — et ce qu'il ne promet pas
 *
 * Trois fichiers SQLite (`ekts.db`, `ekts-fts.db`, `ekts-vectors.db`) sont
 * attachés à **une** connexion : une transaction applicative peut donc les
 * écrire ensemble. Mais une **copie de fichiers** n'est pas une transaction :
 * rien ne garantit que les trois instantanés correspondent au même instant
 * logique. Cette non-atomicité est **déclarée** (`nonAtomic: true`) et
 * compensée par une vérification de cohérence au niveau des compteurs.
 *
 * Conséquence pratique : une sauvegarde dont les compteurs ne concordent pas
 * est **signalée incohérente**, et la restauration est **refusée** par défaut.
 * Aucune réparation silencieuse, aucune réindexation automatique : réparer est
 * une décision, pas un effet de bord d'une restauration.
 *
 * ## Pourquoi `VACUUM INTO`
 *
 * Une copie de fichier pendant que `WAL` est actif peut ne pas contenir les
 * dernières transactions (elles vivent dans `-wal`). `VACUUM INTO` produit un
 * fichier **cohérent et compacté** à partir de la base ouverte, sans dépendre
 * de la position du `WAL`, et sans verrou exclusif long. Les fichiers `-wal` et
 * `-shm` ne sont donc jamais copiés : ils n'ont pas de sens hors de leur base.
 */

import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

import { TABLES } from '../shared/constants.js';
import { resolveDatabasePaths } from './database.js';

/** Format du manifeste : toute incompatibilité est refusée, jamais devinée. */
export const BACKUP_FORMAT = 'ekts-backup/1';

/** Nom du manifeste écrit à la racine d'une sauvegarde. */
export const BACKUP_MANIFEST_FILE = 'manifest.json';

/** Bases sauvegardées, dans un ordre stable. */
export const BACKUP_DATABASES = ['main', 'fts', 'vectors'] as const;

/** Base logique sauvegardée. */
export type BackupDatabase = (typeof BACKUP_DATABASES)[number];

/** Fichiers attendus, par base logique. */
const BACKUP_FILES: Readonly<Record<BackupDatabase, string>> = {
  main: 'ekts.db',
  fts: 'ekts-fts.db',
  vectors: 'ekts-vectors.db',
};

/** Description d'une base copiée. */
export interface BackupEntry {
  readonly logical: BackupDatabase;
  readonly file: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly userVersion: number;
  /** Résultat de `PRAGMA integrity_check` sur la **copie**. */
  readonly integrity: 'ok' | 'incoherent';
  readonly counts: Readonly<Record<string, number>>;
}

/** Cohérence observée entre données et index. */
export interface BackupConsistency {
  readonly resources: number;
  readonly ftsRows: number;
  readonly vectorRows: number;
  /** `resources === ftsRows` : l'index plein texte couvre exactement les données. */
  readonly coherent: boolean;
}

/** Manifeste d'une sauvegarde. */
export interface BackupManifest {
  readonly format: typeof BACKUP_FORMAT;
  readonly createdAt: string;
  /** Toujours `true` : la copie de trois fichiers n'est pas atomique. */
  readonly nonAtomic: true;
  readonly databases: readonly BackupEntry[];
  readonly consistency: BackupConsistency;
}

/** Options d'une sauvegarde. */
export interface CreateBackupOptions {
  readonly dataDir: string;
  readonly targetDir: string;
  /** Horloge injectable (tests déterministes). */
  readonly now?: () => Date;
}

/** Verdict de vérification d'une sauvegarde. */
export interface BackupVerdict {
  readonly ok: boolean;
  readonly problems: readonly string[];
  readonly manifest?: BackupManifest;
}

/** Options de restauration. */
export interface RestoreBackupOptions {
  readonly backupDir: string;
  readonly dataDir: string;
  /**
   * Écrase des bases existantes. Faux par défaut : une restauration ne doit
   * jamais détruire un jeu de données sans un geste explicite.
   */
  readonly overwrite?: boolean;
}

/** Rapport de restauration. */
export interface RestoreReport {
  readonly manifest: BackupManifest;
  readonly restored: readonly string[];
  readonly counts: { readonly resources: number; readonly ftsRows: number };
}

/** Empreinte SHA-256 d'un fichier. */
function sha256File(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

/** Vérifie qu'un répertoire est vide ou absent. */
function assertEmptyDirectory(directory: string, label: string): void {
  if (existsSync(directory) && readdirSync(directory).length > 0) {
    throw new Error(`${label} non vide : ${directory}`);
  }
}

/** Produit une copie cohérente d'une base par `VACUUM INTO`. */
function vacuumInto(source: string, destination: string): void {
  const connection = new Database(source);

  try {
    connection.exec(`VACUUM INTO '${destination.replaceAll("'", "''")}'`);
  } finally {
    connection.close();
  }
}

/** Lit `user_version` et l'intégrité d'une base fermée. */
function inspectFile(file: string): { userVersion: number; integrity: 'ok' | 'incoherent' } {
  let connection: Database.Database | undefined;

  try {
    connection = new Database(file, { readonly: true });

    const userVersion = connection.pragma('user_version', { simple: true }) as number;
    const integrity = connection.pragma('integrity_check', { simple: true }) as string;

    return { userVersion, integrity: integrity === 'ok' ? 'ok' : 'incoherent' };
  } catch {
    // Un fichier altéré peut faire **échouer** `integrity_check` au lieu de
    // renvoyer un diagnostic : l'échec est un constat d'incohérence, jamais
    // une exception qui remonterait à l'opérateur sans verdict.
    return { userVersion: 0, integrity: 'incoherent' };
  } finally {
    connection?.close();
  }
}

/** Compte les lignes utiles des trois bases d'un répertoire. */
export function countDatabases(dataDir: string): BackupConsistency {
  const paths = resolveDatabasePaths(dataDir);

  // Comptage **en lecture seule** : ouvrir une base en écriture pour la
  // compter changerait son empreinte après coup et rendrait toute vérification
  // ultérieure impossible. `sqlite-vec` doit être chargé pour interroger une
  // table `vec0`, même en lecture.
  const count = (file: string, sql: string, withVectors = false): number => {
    const connection = new Database(file, { readonly: true });

    try {
      if (withVectors) {
        sqliteVec.load(connection);
      }

      return (connection.prepare(sql).get() as { n: number }).n;
    } finally {
      connection.close();
    }
  };

  const resources = count(paths.main, `SELECT COUNT(*) AS n FROM ${TABLES.resources}`);
  const ftsRows = count(paths.fts, `SELECT COUNT(*) AS n FROM ${TABLES.resourcesFts}`);
  const vectorRows = count(
    paths.vectors,
    `SELECT COUNT(*) AS n FROM ${TABLES.resourcesVectors}`,
    true,
  );

  return { resources, ftsRows, vectorRows, coherent: resources === ftsRows };
}

/**
 * Sauvegarde les trois bases dans un répertoire dédié.
 *
 * @throws {Error} Destination non vide, ou base source illisible.
 */
export function createBackup(options: CreateBackupOptions): BackupManifest {
  const paths = resolveDatabasePaths(options.dataDir);

  assertEmptyDirectory(options.targetDir, 'Destination de sauvegarde');
  mkdirSync(options.targetDir, { recursive: true, mode: 0o700 });

  const databases: BackupEntry[] = BACKUP_DATABASES.map((logical) => {
    const source = paths[logical];
    const file = BACKUP_FILES[logical];
    const destination = join(options.targetDir, file);

    vacuumInto(source, destination);

    const { userVersion, integrity } = inspectFile(destination);

    return {
      logical,
      file,
      bytes: statSync(destination).size,
      sha256: sha256File(destination),
      userVersion,
      integrity,
      counts: {},
    };
  });

  const consistency = countDatabases(options.targetDir);
  const counts: Record<BackupDatabase, Record<string, number>> = {
    main: { resources: consistency.resources },
    fts: { resourcesFts: consistency.ftsRows },
    vectors: { resourcesVectors: consistency.vectorRows },
  };

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    createdAt: (options.now ?? ((): Date => new Date()))().toISOString(),
    nonAtomic: true,
    databases: databases.map((entry) => ({ ...entry, counts: counts[entry.logical] })),
    consistency,
  };

  writeFileSync(
    join(options.targetDir, BACKUP_MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  return manifest;
}

/**
 * Vérifie une sauvegarde sans rien écrire.
 *
 * Contrôle : format, présence des trois fichiers, taille, empreinte, intégrité,
 * `user_version`, compteurs et cohérence ressources/index.
 */
export function verifyBackup(backupDir: string): BackupVerdict {
  const manifestPath = join(backupDir, BACKUP_MANIFEST_FILE);

  if (!existsSync(manifestPath)) {
    return { ok: false, problems: [`manifeste absent : ${manifestPath}`] };
  }

  let manifest: BackupManifest;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BackupManifest;
  } catch {
    return { ok: false, problems: ['manifeste illisible (JSON invalide)'] };
  }

  if (manifest.format !== BACKUP_FORMAT) {
    return { ok: false, problems: [`format inconnu : ${String(manifest.format)}`] };
  }

  const problems: string[] = [];

  for (const logical of BACKUP_DATABASES) {
    const entry = manifest.databases.find((candidate) => candidate.logical === logical);

    if (entry === undefined) {
      problems.push(`base absente du manifeste : ${logical}`);
      continue;
    }

    const file = join(backupDir, entry.file);

    if (!existsSync(file)) {
      problems.push(`fichier absent : ${entry.file}`);
      continue;
    }

    if (statSync(file).size !== entry.bytes) {
      problems.push(`taille divergente pour ${entry.file}`);
    }

    if (sha256File(file) !== entry.sha256) {
      problems.push(`empreinte sha256 divergente pour ${entry.file}`);
    }

    const { userVersion, integrity } = inspectFile(file);

    if (integrity !== 'ok') {
      problems.push(`intégrité incohérente pour ${entry.file}`);
    }

    if (userVersion !== entry.userVersion) {
      problems.push(`user_version divergente pour ${entry.file}`);
    }
  }

  if (problems.length === 0) {
    const consistency = countDatabases(backupDir);

    if (consistency.resources !== manifest.consistency.resources) {
      problems.push('compteur de ressources divergent du manifeste');
    }

    if (consistency.ftsRows !== manifest.consistency.ftsRows) {
      problems.push('compteur d’index FTS divergent du manifeste');
    }

    if (!consistency.coherent) {
      problems.push(
        `incohérence ressources/index : ${String(consistency.resources)} ressources, ${String(consistency.ftsRows)} entrées FTS`,
      );
    }
  }

  return problems.length === 0
    ? { ok: true, problems, manifest }
    : { ok: false, problems, manifest };
}

/**
 * Restaure une sauvegarde vérifiée dans un répertoire de données.
 *
 * @throws {Error} Sauvegarde invalide ou incohérente, ou bases déjà présentes
 *   sans `overwrite`.
 */
export function restoreBackup(options: RestoreBackupOptions): RestoreReport {
  const verdict = verifyBackup(options.backupDir);

  if (!verdict.ok || verdict.manifest === undefined) {
    throw new Error(`Sauvegarde invalide : ${verdict.problems.join(' ; ')}`);
  }

  const manifest = verdict.manifest;

  if (!manifest.consistency.coherent) {
    throw new Error(
      `Sauvegarde incohérente (${String(manifest.consistency.resources)} ressources, ` +
        `${String(manifest.consistency.ftsRows)} entrées FTS) : restauration refusée`,
    );
  }

  const existing = BACKUP_DATABASES.map((logical) =>
    join(options.dataDir, BACKUP_FILES[logical]),
  ).filter((file) => existsSync(file));

  if (existing.length > 0 && options.overwrite !== true) {
    throw new Error(
      `Restauration refusée : fichiers existants (${existing.map((file) => file.split(/[\\/]/u).pop() ?? file).join(', ')})`,
    );
  }

  mkdirSync(options.dataDir, { recursive: true, mode: 0o700 });

  const restored: string[] = [];

  for (const logical of BACKUP_DATABASES) {
    const file = BACKUP_FILES[logical];
    const destination = join(options.dataDir, file);

    // Les journaux `-wal`/`-shm` d'une base précédente ne doivent jamais
    // survivre à sa restauration : ils décriraient une autre base.
    for (const suffix of ['-wal', '-shm']) {
      rmSync(`${destination}${suffix}`, { force: true });
    }

    copyFileSync(join(options.backupDir, file), destination);
    restored.push(destination);
  }

  const counts = countDatabases(options.dataDir);

  if (counts.resources !== manifest.consistency.resources || !counts.coherent) {
    throw new Error(
      `Restauration incohérente : ${String(counts.resources)} ressources, ` +
        `${String(counts.ftsRows)} entrées FTS après copie`,
    );
  }

  return {
    manifest,
    restored,
    counts: { resources: counts.resources, ftsRows: counts.ftsRows },
  };
}
