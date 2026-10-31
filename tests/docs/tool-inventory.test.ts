/**
 * Inventaire réel des outils et liens de documentation (Sprint 23-03, C-O06).
 *
 * **Pourquoi ce test existe.** La documentation a déjà dérivé : `AGENTS.md` et
 * `docs/MCP.md` annonçaient des nombres et des effets qui n'étaient plus ceux du
 * code. Un tableau recopié à la main ne peut pas rester vrai ; ce test le
 * confronte à ce que le serveur expose **réellement** (`tools/list`) et à ce que
 * le code déclare (`readOnlyHint`).
 *
 * Aucune valeur n'est codée en dur : si un outil est ajouté, renommé ou change
 * de statut, le test échoue jusqu'à ce que `docs/MCP.md` suive.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createEktsServer } from '../../src/mcp/server.js';
import { createLogger } from '../../src/mcp/utils/logger.js';
import { openTestServices, type TestServices } from '../mcp/helpers.js';

/** Ligne du tableau des outils : `| \`nom\` | rôle |`. */
const ROW = /^\|\s*`([a-z_]+)`\s*\|\s*(.+?)\s*\|\s*$/u;

describe('C-O06 — les 17 outils documentés correspondent au serveur', () => {
  let test: TestServices;
  let exposed: { name: string; readonly: boolean }[];

  beforeAll(async () => {
    test = openTestServices();

    const server = createEktsServer({ context: test.services, logger: createLogger({ level: 'silent' }) });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'ekts-doc-tests', version: '1.0.0' });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const { tools } = await client.listTools();

      exposed = tools.map((tool) => ({
        name: tool.name,
        readonly: tool.annotations?.readOnlyHint === true,
      }));
    } finally {
      await client.close();
      await server.close();
    }
  });

  afterAll(() => {
    test.cleanup();
  });

  it('documente chaque outil exposé, avec un rôle non vide et son statut', () => {
    const markdown = readFileSync(join(process.cwd(), 'docs', 'MCP.md'), 'utf8');
    const documented = new Map<string, string>();

    // Seul le tableau d'inventaire compte : les autres tableaux du document
    // citent aussi des noms d'outils (profils, exemples) et ne décrivent pas
    // leur rôle.
    const start = markdown.indexOf('| Outil | Rôle |');
    const end = markdown.indexOf('\n\n', start);

    expect(start).toBeGreaterThan(-1);

    const table = markdown.slice(start, end === -1 ? undefined : end);

    for (const line of table.split('\n')) {
      const match = ROW.exec(line);

      if (match !== null && match[1] !== undefined && match[2] !== undefined) {
        documented.set(match[1], match[2]);
      }
    }

    expect(exposed.length).toBe(17);
    expect([...documented.keys()].sort()).toEqual(exposed.map((tool) => tool.name).sort());

    for (const tool of exposed) {
      const role = documented.get(tool.name) ?? '';

      expect(role.length).toBeGreaterThan(10);
      // Le statut documenté doit refléter l'annotation réelle : une action
      // annotée en lecture reste une action si elle écrit (C-O06 exige les
      // effets réels, pas les intentions).
      expect(role.includes('**action**')).toBe(!tool.readonly);
    }
  });

  it('n’a aucun lien local mort dans les documents de référence', () => {
    const documents = ['docs/MCP.md', 'docs/CLI.md', 'docs/API_REFERENCE.md', 'README.md'];
    const missing: string[] = [];

    for (const document of documents) {
      const full = join(process.cwd(), document);

      if (!existsSync(full)) {
        missing.push(`${document} (absent)`);
        continue;
      }

      const markdown = readFileSync(full, 'utf8');
      const links = markdown.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/gu);

      for (const link of links) {
        const target = link[1];

        if (target === undefined || /^[a-z]+:/iu.test(target)) {
          continue;
        }

        const resolved = resolve(dirname(full), target);

        if (!existsSync(resolved)) {
          missing.push(`${document} → ${target}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
