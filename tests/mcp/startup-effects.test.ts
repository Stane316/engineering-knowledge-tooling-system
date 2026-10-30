/**
 * Effets au démarrage et mutations métier (Sprint 21-03, C-P05).
 *
 * Le critère demande de « mesurer l'état métier **après préparation**, puis
 * exécuter les appels permis et interdits », en examinant séparément
 * migrations, templates, WAL/SHM et accès disque techniques.
 *
 * Ce fichier suit exactement cet ordre : la préparation (ouverture, migrations,
 * templates) est mesurée et **identifiée** ; elle sert ensuite de référence.
 * Les appels ne doivent rien y changer. Un `-wal` qui grossit n'est pas une
 * mutation métier : seules les tables comptent.
 *
 * Les états sont lus par une connexion SQLite **en lecture seule** ouverte en
 * parallèle des services. Aucune écriture manuelle n'est faite dans la base :
 * ce serait précisément le geste que le critère cherche à éviter.
 */

import Database from 'better-sqlite3';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openMcpServices, type McpServices } from '../../src/mcp/context.js';
import { dispatchTool } from '../../src/mcp/handlers/tools.js';
import { MCP_PROFILES } from '../../src/mcp/profiles.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';
import { seedResources } from './helpers.js';

/** Les trois bases ouvertes par le serveur et leurs compagnons techniques. */
const APPROVED_FILES: readonly string[] = [
  'ekts.db',
  'ekts.db-shm',
  'ekts.db-wal',
  'ekts-fts.db',
  'ekts-fts.db-shm',
  'ekts-fts.db-wal',
  'ekts-vectors.db',
  'ekts-vectors.db-shm',
  'ekts-vectors.db-wal',
];

/** Tables métier dont le contenu logique doit rester stable. */
const BUSINESS_TABLES: readonly string[] = [
  'resources',
  'projects',
  'audits',
  'audit_metadata',
  'audit_dimensions',
  'audit_findings',
  'best_practices',
  'generated_recommendations',
  'recommendation_rules',
  'project_templates',
  'project_config',
  'alerts',
  'finding_best_practice',
  'embedding_spaces',
];

interface LogicalState {
  readonly rows: Record<string, number>;
  readonly userVersion: number;
  readonly migrations: number;
  readonly templates: number;
}

/** Lit l'état logique par une connexion en lecture seule. */
function readState(dataDir: string): LogicalState {
  const db = new Database(join(dataDir, 'ekts.db'), { readonly: true, fileMustExist: true });

  try {
    const rows: Record<string, number> = {};

    for (const table of BUSINESS_TABLES) {
      const result = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number };
      rows[table] = result.n;
    }

    return {
      rows,
      userVersion: db.pragma('user_version', { simple: true }) as number,
      migrations: (db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get() as { n: number })
        .n,
      templates: rows['project_templates'] ?? 0,
    };
  } finally {
    db.close();
  }
}

/** Liste les fichiers du répertoire de données, avec leur taille. */
function listFiles(dataDir: string): Map<string, number> {
  const sizes = new Map<string, number>();

  for (const name of readdirSync(dataDir)) {
    sizes.set(name, statSync(join(dataDir, name)).size);
  }

  return sizes;
}

/** Appels refusés : un nom hors profil, arguments minimaux valides. */
const REFUSED_CALLS: readonly { tool: string; args: Record<string, unknown> }[] = [
  { tool: 'validate_resource', args: { data: { type: 'article', title: 'x', content: 'y' } } },
  { tool: 'inspect_site', args: { url: 'https://example.test/' } },
  { tool: 'audit_history', args: {} },
  { tool: 'audit_report', args: { audit_id: 1 } },
  { tool: 'create_project', args: { name: 'Interdit' } },
  { tool: 'list_projects', args: {} },
  { tool: 'get_project', args: { project_id: '00000000-0000-4000-8000-000000000000' } },
  { tool: 'delete_project', args: { project_id: '00000000-0000-4000-8000-000000000000' } },
  { tool: 'get_timeline', args: { project_id: '00000000-0000-4000-8000-000000000000' } },
  { tool: 'search_best_practices', args: {} },
  {
    tool: 'add_best_practice',
    args: { title: 'Canari', description: 'Description assez longue.', category: 'general' },
  },
  { tool: 'get_recommendations', args: { project_id: '00000000-0000-4000-8000-000000000000' } },
  { tool: 'list_templates', args: {} },
  {
    tool: 'apply_template',
    args: {
      template_id: '00000000-0000-4000-8000-000000000000',
      project_name: 'Canari',
      project_url: 'https://example.test/',
    },
  },
  { tool: 'outil_fantome_2027', args: {} },
];

describe('C-P05 — effets au démarrage et mutations métier', () => {
  let dataDir: string;
  let services: McpServices;
  let prepared: LogicalState;
  let preparedFiles: Map<string, number>;

  beforeAll(async () => {
    dataDir = createDataDir();
    services = openMcpServices({ dataDir, env: {} });

    // Préparation terminée : c'est **ici** que commence la mesure.
    await seedResources(services);
    prepared = readState(dataDir);
    preparedFiles = listFiles(dataDir);
  });

  afterAll(() => {
    services.close();
    removeDataDir(dataDir);
  });

  it('identifie la préparation : 11 migrations, 10 templates, zéro donnée métier', () => {
    expect(prepared.userVersion).toBe(11);
    expect(prepared.migrations).toBe(11);
    expect(prepared.templates).toBe(10);

    // La préparation n'invente aucune donnée métier : ce sont les fixtures du
    // test qui en ajoutent, et elles sont comptées séparément.
    expect(prepared.rows['resources']).toBe(3);
    expect(prepared.rows['projects']).toBe(0);
    expect(prepared.rows['audits']).toBe(0);
    expect(prepared.rows['best_practices']).toBe(0);
    expect(prepared.rows['generated_recommendations']).toBe(0);
    expect(prepared.rows['alerts']).toBe(0);
  });

  it('confine les fichiers au périmètre approuvé (trois bases + WAL/SHM)', () => {
    const unexpected = [...preparedFiles.keys()].filter((name) => !APPROVED_FILES.includes(name));

    expect(unexpected).toEqual([]);
    for (const name of ['ekts.db', 'ekts-fts.db', 'ekts-vectors.db']) {
      expect(preparedFiles.has(name), name).toBe(true);
    }
  });

  it('n’enregistre aucune mutation métier lors des appels permis et refusés', async () => {
    // Appels permis (profil lecture).
    await dispatchTool(
      services,
      'search_knowledge',
      { query: 'SQLite', mode: 'fts' },
      MCP_PROFILES.read,
    );
    await dispatchTool(services, 'list_resources', {}, MCP_PROFILES.read);

    const [first] = await services.manager.listResources();
    if (first === undefined) {
      throw new Error('fixture vide : C-P05 non mesurable');
    }
    await dispatchTool(services, 'get_resource', { id: first.id }, MCP_PROFILES.read);

    // Appels refusés.
    for (const call of REFUSED_CALLS) {
      await expect(
        dispatchTool(services, call.tool, call.args, MCP_PROFILES.read),
        call.tool,
      ).rejects.toBeDefined();
    }

    const after = readState(dataDir);

    expect(after.rows).toEqual(prepared.rows);
    expect(after.userVersion).toBe(prepared.userVersion);
    expect(after.migrations).toBe(prepared.migrations);
    expect(after.templates).toBe(prepared.templates);
  });

  it('ne crée aucun fichier hors périmètre après les appels', () => {
    const after = listFiles(dataDir);
    const created = [...after.keys()].filter((name) => !preparedFiles.has(name));

    expect(created).toEqual([]);
    expect([...after.keys()].filter((name) => !APPROVED_FILES.includes(name))).toEqual([]);
  });

  it('traite WAL/SHM comme des écritures techniques, pas comme un état métier', () => {
    // Le `-wal` peut avoir changé de taille : c'est admis et documenté par le
    // critère. Ce qui compte est que la fermeture le replie sans rien perdre.
    const wal = preparedFiles.get('ekts.db-wal');
    expect(wal).toBeDefined();
    expect(existsSync(join(dataDir, 'ekts.db-wal'))).toBe(true);
  });
});

describe('C-P05 — après fermeture et réouverture', () => {
  let dataDir: string;

  beforeAll(() => {
    dataDir = createDataDir();
  });

  afterAll(() => {
    removeDataDir(dataDir);
  });

  it('conserve l’état logique après un cycle complet fermeture/réouverture', async () => {
    const first = openMcpServices({ dataDir, env: {} });

    try {
      await seedResources(first);
    } finally {
      first.close();
    }

    // Après fermeture, SQLite a replié le WAL : plus de `-wal` ni `-shm`.
    const afterClose = listFiles(dataDir);
    expect(afterClose.has('ekts.db-wal')).toBe(false);
    expect(afterClose.has('ekts.db-shm')).toBe(false);
    expect([...afterClose.keys()].filter((name) => !APPROVED_FILES.includes(name))).toEqual([]);

    const stateAfterClose = readState(dataDir);

    const second = openMcpServices({ dataDir, env: {} });

    try {
      // La réouverture ne rejoue pas les migrations et ne recrée pas les
      // templates : ce sont des effets de préparation, pas de session.
      await expect(second.manager.listResources()).resolves.toHaveLength(3);
      await expect(second.projects.listProjects()).resolves.toEqual([]);
      expect(second.templates.listTemplates()).toHaveLength(10);
    } finally {
      second.close();
    }

    expect(readState(dataDir)).toEqual(stateAfterClose);
  });
});
