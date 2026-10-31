/**
 * Sauvegarde et restauration des trois bases (Sprint 23-03, C-O04).
 *
 * **Méthode RED déclarée.** Aucune capacité de sauvegarde n'existe dans le
 * dépôt à la référence : le RED de ces cas est donc l'**absence de la
 * commande**, pas un comportement fautif. Ce n'est pas une preuve RED au sens
 * du dossier 23 ; c'est déclaré comme tel, et la preuve est le GREEN avec
 * oracles figés avant écriture du code.
 *
 * Le cas d'**interruption** fait exception : il n'exige aucune API nouvelle. Il
 * vérifie ce que SQLite garantit déjà — une transaction non validée n'est pas
 * réputée persistée — et doit donc être GREEN dès le départ. Une interruption
 * n'est jamais traitée comme une preuve de persistance : seul le point de commit
 * consigné fait foi.
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openDatabase } from '../../src/data/database.js';
import {
  createBackup,
  restoreBackup,
  verifyBackup,
  BACKUP_MANIFEST_FILE,
} from '../../src/data/backup.js';
import { openMcpServices } from '../../src/mcp/context.js';
import { seedResources } from '../mcp/helpers.js';

/** Répertoires temporaires à supprimer après chaque cas. */
const temporary: string[] = [];

/** Crée un répertoire temporaire suivi pour nettoyage. */
function temp(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporary.push(directory);

  return directory;
}

afterEach(() => {
  while (temporary.length > 0) {
    const directory = temporary.pop();

    if (directory !== undefined) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

/** Prépare une base peuplée (ressources indexées en FTS). */
async function seededDataDir(): Promise<string> {
  const dataDir = temp('ekts-backup-source-');
  const services = openMcpServices({ dataDir, env: {} });

  try {
    await seedResources(services);
  } finally {
    services.close();
  }

  return dataDir;
}

describe('C-O04 — sauvegarde et restauration normales', () => {
  it('restaure les ressources, l’index et les compteurs à l’identique', async () => {
    const source = await seededDataDir();
    const target = join(temp('ekts-backup-cible-'), 'sauvegarde');
    const restored = temp('ekts-backup-restauree-');

    const manifest = createBackup({ dataDir: source, targetDir: target });

    expect(manifest.format).toBe('ekts-backup/1');
    // La non-atomicité multi-fichiers est **déclarée**, jamais supposée.
    expect(manifest.nonAtomic).toBe(true);
    expect(manifest.databases.map((entry) => entry.logical)).toEqual(['main', 'fts', 'vectors']);
    expect(manifest.consistency).toMatchObject({ resources: 3, ftsRows: 3, coherent: true });
    expect(existsSync(join(target, BACKUP_MANIFEST_FILE))).toBe(true);

    const verdict = verifyBackup(target);

    expect(verdict.problems).toEqual([]);
    expect(verdict.ok).toBe(true);

    const report = restoreBackup({ backupDir: target, dataDir: restored });

    expect(report.counts).toMatchObject({ resources: 3, ftsRows: 3 });

    const reopened = openMcpServices({ dataDir: restored, env: {} });

    try {
      expect((await reopened.manager.listResources()).length).toBe(3);

      const found = await reopened.search.searchFTS('SQLite', 5);

      expect(found.length).toBeGreaterThan(0);
    } finally {
      reopened.close();
    }
  });

  it('refuse d’écraser des bases existantes sans autorisation explicite', async () => {
    const source = await seededDataDir();
    const target = join(temp('ekts-backup-cible-'), 'sauvegarde');

    createBackup({ dataDir: source, targetDir: target });

    // `source` contient déjà trois bases : la restauration doit refuser.
    expect(() => restoreBackup({ backupDir: target, dataDir: source })).toThrow(/existant/u);
  });

  it('refuse une destination de sauvegarde non vide', async () => {
    const source = await seededDataDir();
    const target = temp('ekts-backup-non-vide-');

    writeFileSync(join(target, 'occupant.txt'), 'x');

    expect(() => createBackup({ dataDir: source, targetDir: target })).toThrow(/non vide/u);
  });
});

describe('C-O04 — altération et incohérence signalées', () => {
  it('détecte un fichier de sauvegarde altéré par son empreinte', async () => {
    const source = await seededDataDir();
    const target = join(temp('ekts-backup-cible-'), 'sauvegarde');

    createBackup({ dataDir: source, targetDir: target });

    const main = join(target, 'ekts.db');
    const bytes = readFileSync(main);
    const digest = createHash('sha256').update(bytes).digest('hex');

    // Un octet retourné suffit : l'empreinte ne correspond plus.
    bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0xff;
    writeFileSync(main, bytes);

    expect(digest).not.toBe(createHash('sha256').update(bytes).digest('hex'));

    const verdict = verifyBackup(target);

    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(' ')).toMatch(/empreinte|sha256/u);
  });

  it('signale l’incohérence ressources/index et bloque la restauration', async () => {
    const source = await seededDataDir();

    // Index volontairement amputé : l'état est incohérent, pas « réparé ».
    const ftsFile = join(source, 'ekts-fts.db');
    const fts = openDatabase({ dataDir: source, migrate: false, loadVectors: false });

    try {
      fts.connection.exec('DELETE FROM fts.resources_fts');
    } finally {
      fts.close();
    }

    expect(existsSync(ftsFile)).toBe(true);

    const target = join(temp('ekts-backup-cible-'), 'sauvegarde');
    const manifest = createBackup({ dataDir: source, targetDir: target });

    expect(manifest.consistency.ftsRows).toBe(0);
    expect(manifest.consistency.coherent).toBe(false);

    const destination = temp('ekts-backup-restauree-');

    expect(() => restoreBackup({ backupDir: target, dataDir: destination })).toThrow(/incohéren/u);
    // La destination reste vierge : rien n'a été écrit à moitié.
    expect(existsSync(join(destination, 'ekts.db'))).toBe(false);
  });
});

describe('C-O04 — interruption à un point de commit consigné', () => {
  it('conserve le commit confirmé, écarte la transaction non validée, garde l’intégrité', async () => {
    const dataDir = temp('ekts-backup-crash-');
    const serverPath = join(process.cwd(), 'dist', 'data', 'database.js');
    const script = join(temp('ekts-crash-script-'), 'crash.mjs');

    // L'enfant écrit une ressource, **valide**, l'annonce, puis ouvre une
    // transaction qu'il n'annonce jamais comme validée. Le parent le tue.
    writeFileSync(
      script,
      `
import { openDatabase } from ${JSON.stringify(serverPath)};

const dataDir = process.argv[2];
const db = openDatabase({ dataDir });
const insert = db.connection.prepare(
  "INSERT INTO resources (id, type, title, tags, metadata, content, created_at, updated_at) VALUES (?, 'other', ?, '[]', '{}', ?, ?, ?)",
);
const now = new Date().toISOString();

insert.run('00000000-0000-4000-8000-000000000001', 'Ressource validée', null, now, now);
process.stdout.write('COMMITTED\\n');

db.connection.exec('BEGIN IMMEDIATE');
insert.run('00000000-0000-4000-8000-000000000002', 'Transaction ouverte', null, now, now);
process.stdout.write('PENDING\\n');

setInterval(() => {}, 1000);
`,
      'utf8',
    );

    const child = spawn(process.execPath, [script, dataDir], { stdio: ['ignore', 'pipe', 'pipe'] });
    const signals: string[] = [];

    let childErrors = '';

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      childErrors += chunk;
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`signaux non reçus : ${childErrors}`)),
        20_000,
      );

      child.on('exit', (code) => {
        if (!signals.includes('PENDING')) {
          clearTimeout(timer);
          reject(new Error(`processus fils terminé (code ${String(code)}) : ${childErrors}`));
        }
      });

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        for (const line of chunk.split('\n').filter((entry) => entry !== '')) {
          signals.push(line);

          if (signals.includes('PENDING')) {
            clearTimeout(timer);
            resolve();
          }
        }
      });
      child.on('error', reject);
    });

    // Arrêt brutal au point consigné : la transaction ouverte n'est pas validée.
    child.kill('SIGKILL');

    await new Promise<void>((resolve) => {
      child.on('exit', () => resolve());
      setTimeout(() => resolve(), 5_000);
    });

    expect(signals).toEqual(['COMMITTED', 'PENDING']);

    const checkpoint = openDatabase({ dataDir, migrate: false, loadVectors: false });

    try {
      const rows = checkpoint.connection.prepare('SELECT id FROM resources ORDER BY id').all() as {
        id: string;
      }[];

      // Lecture stricte : seul le commit confirmé subsiste.
      expect(rows.map((row) => row.id)).toEqual(['00000000-0000-4000-8000-000000000001']);
      expect(checkpoint.connection.pragma('integrity_check', { simple: true })).toBe('ok');
    } finally {
      checkpoint.close();
    }

    // Une sauvegarde prise après l'incident est soit cohérente et restaurable,
    // soit signalée incohérente et **bloquée** : les deux issues sont
    // acceptables, l'absence de verdict ne l'est pas.
    const target = join(temp('ekts-backup-cible-'), 'sauvegarde');
    const manifest = createBackup({ dataDir, targetDir: target });

    expect(manifest.databases.every((entry) => entry.integrity === 'ok')).toBe(true);

    const restored = temp('ekts-backup-restauree-');

    // Consigné à chaque exécution : la branche réellement observée après
    // l'interruption, pour que le rapport ne l'infère pas.
    console.info(
      `[C-O04] après SIGKILL : ${String(manifest.consistency.resources)} ressources, ` +
        `${String(manifest.consistency.ftsRows)} entrées FTS, cohérent=${String(manifest.consistency.coherent)}`,
    );

    if (manifest.consistency.coherent) {
      const report = restoreBackup({ backupDir: target, dataDir: restored });

      expect(report.counts).toMatchObject({ resources: 1, ftsRows: 1 });
    } else {
      expect(() => restoreBackup({ backupDir: target, dataDir: restored })).toThrow(/incohéren/u);
      expect(existsSync(join(restored, 'ekts.db'))).toBe(false);
    }
  });
});
