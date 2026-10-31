/**
 * Confidentialité des traces (Sprint 23-02, C-T03) et permissions
 * (contribution à C-O03).
 *
 * **Méthode RED déclarée.** Le premier cas n'importe que `createLogger`, qui
 * existe déjà : il échoue aujourd'hui parce que le canari d'environnement est
 * recopié **tel quel** dans la trace. C'est un comportement manquant, pas une
 * erreur d'import. Les cas 2 à 4 verrouillent des propriétés déjà acquises ou
 * déclarent un environnement indisponible — ils ne sont pas présentés comme des
 * preuves RED.
 *
 * **Ce qui compte comme « trace exportable »** : toute ligne JSON Lines écrite
 * par le serveur, parce que c'est ce qu'un exploitant redirige vers un fichier
 * et transmet. L'export lui-même n'existe pas dans ce dépôt (voir cas 3).
 *
 * **Un hash n'est pas une anonymisation.** Le marqueur de caviardage est une
 * chaîne fixe : le test vérifie explicitement qu'aucune empreinte du canari
 * n'apparaît à sa place.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { createEktsServer } from '../../../src/mcp/server.js';
import { createLogger } from '../../../src/mcp/utils/logger.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

/** Canari à ne jamais retrouver dans une trace. */
const CANARY = `canari-trace-${randomUUID()}`;

/** Variable dont le nom désigne un secret : sa valeur doit être caviardée. */
const SECRET_ENV_VAR = 'EKTS_EMBEDDINGS_API_KEY';

/** Marqueur attendu dans la trace. */
const MARKER = '[caviardé]';

/** Sauvegarde de l'environnement modifié par les cas. */
let previousSecret: string | undefined;

beforeAll(() => {
  previousSecret = process.env[SECRET_ENV_VAR];
  process.env[SECRET_ENV_VAR] = CANARY;
});

afterAll(() => {
  if (previousSecret === undefined) {
    delete process.env[SECRET_ENV_VAR];
  } else {
    process.env[SECRET_ENV_VAR] = previousSecret;
  }
});

describe('C-T03 — canari en variable d’environnement', () => {
  it('caviarde un message d’erreur qui recopie la clé', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'info', sink: (line) => lines.push(line) });

    // Un fournisseur renvoie parfois la clé dans son corps de réponse : c'est
    // exactement le vecteur que la trace doit absorber.
    logger.error('Appel fournisseur refusé', new Error(`HTTP 401 pour la clé ${CANARY}`), {
      provider: 'openai',
    });

    const trace = lines.join('\n');

    expect(trace).not.toContain(CANARY);
    expect(trace).toContain(MARKER);
    // Ni empreinte, ni clé tronquée : rien de dérivable du secret.
    expect(trace).not.toContain(CANARY.slice(-6));
  });

  it('caviarde aussi une clé de forme reconnaissable, sans la connaître à l’avance', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'info', sink: (line) => lines.push(line) });

    logger.error(
      'Réponse inattendue',
      new Error('Authorization: Bearer sk-proj-abcdefghijklmnop42'),
    );

    const trace = lines.join('\n');

    expect(trace).not.toContain('sk-proj-abcdefghijklmnop42');
    expect(trace).toContain(MARKER);
  });
});

describe('C-T03 — canari dans les données servies', () => {
  let test: TestServices;

  afterEach(() => {
    test.cleanup();
  });

  it('ne laisse aucun canari de données dans les traces du serveur', async () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'info', sink: (line) => lines.push(line.trim()) });

    test = openTestServices({ embeddings: true });

    await seedResources(test.services);
    const canary = await test.services.manager.addResource({
      type: 'other',
      title: `Titre porteur ${CANARY}`,
      tags: ['canari'],
      content: `Contenu porteur ${CANARY}, à ne jamais recopier.`,
      metadata: { note: CANARY },
    });

    const server = createEktsServer({ context: test.services, logger });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'ekts-trace-tests', version: '1.0.0' });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      await client.callTool({
        name: 'search_knowledge',
        arguments: { query: 'canari', mode: 'fts' },
      });
      await client.callTool({ name: 'get_resource', arguments: { id: canary.id } });
      // Erreur dont le message reprend l'identifiant fourni.
      await client.callTool({ name: 'get_resource', arguments: { id: `${CANARY}-absent` } });
    } finally {
      await client.close();
      await server.close();
    }

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join('\n')).not.toContain(CANARY);
  });
});

describe('C-T03 — contrôles d’export', () => {
  it('aucun fichier de trace n’est écrit par la couche MCP', () => {
    // Garde statique : si un jour un `writeFile` apparaît dans `src/mcp`, la
    // trace cesse d'être un flux `stderr` pour devenir un fichier exportable
    // sans contrôle de droits. Le test doit alors échouer et forcer une revue.
    const forbidden = /\b(writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream)\b/u;
    const files: string[] = [];

    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.ts')) {
          files.push(full);
        }
      }
    };

    walk(join(process.cwd(), 'src', 'mcp'));

    expect(files.length).toBeGreaterThan(10);

    const offenders = files.filter((file) => forbidden.test(readFileSync(file, 'utf8')));

    expect(offenders).toEqual([]);
  });
});

describe('C-O03 — permissions du répertoire de données (POSIX seulement)', () => {
  let test: TestServices;

  beforeAll(() => {
    test = openTestServices();
  });

  afterAll(() => {
    test.cleanup();
  });

  it('répertoire 0700 et bases 0600 sur POSIX ; ACL Windows hors de portée ici', () => {
    if (process.platform === 'win32') {
      // Une garantie POSIX `chmod` n'est pas transposable : C-O03 reste
      // `bloqué` sur Windows jusqu'à la mesure sur la machine du propriétaire.
      expect(process.platform).toBe('win32');

      return;
    }

    expect(statSync(test.dataDir).mode & 0o777).toBe(0o700);

    const databases = readdirSync(test.dataDir).filter((name) => name.endsWith('.db'));

    expect(databases.length).toBeGreaterThanOrEqual(3);

    for (const name of databases) {
      expect(statSync(join(test.dataDir, name)).mode & 0o777).toBe(0o600);
    }
  });
});
