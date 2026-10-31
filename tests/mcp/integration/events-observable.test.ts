/**
 * Événements observables et rapprochement des citations — Sprint 23-01
 * (C-T01, C-T02, et volet confidentiel de C-T03).
 *
 * **Méthode RED déclarée.** Les cas 1 et 2 n'importent pas le module à créer :
 * ils passent par les points d'entrée publics existants (`createEktsServer`,
 * `dispatchTool`) et lisent les événements là où un exploitant les lirait : les
 * lignes JSON de `stderr`. Avant implémentation, ils échouent parce que **zéro
 * événement** est émis alors que les appels réussissent — un comportement
 * manquant, pas une erreur d'import. Les cas 3 à 6 portent sur une API qui
 * n'existe pas encore : leur RED est l'absence de l'API, déclarée comme telle,
 * et la preuve est le GREEN avec oracles figés avant écriture du code.
 *
 * **Couche de visibilité déclarée : `server->client`.** Un événement est émis
 * au moment où le serveur **sert** une réponse au client. Cette couche ne prouve
 * rien de ce que le modèle voit ensuite : aucun état « transmis au modèle »
 * n'est affirmé nulle part.
 */

import { randomUUID } from 'node:crypto';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { dispatchTool } from '../../../src/mcp/handlers/tools.js';
import { type McpProfilePolicy } from '../../../src/mcp/profiles.js';
import { createEktsServer } from '../../../src/mcp/server.js';
import { createLogger } from '../../../src/mcp/utils/logger.js';
import { openTestServices, seedResources, type TestServices } from '../helpers.js';

/** Politique de lecture : trois outils, mode FTS explicite. */
const READ_POLICY: McpProfilePolicy = {
  name: 'read',
  tools: ['search_knowledge', 'get_resource', 'list_resources'],
  requireExplicitFtsMode: true,
};

/** Canari : ne doit jamais apparaître dans une ligne de trace. */
const CANARY = `canari-${randomUUID()}`;

interface EventLine {
  readonly seq?: number;
  readonly sessionId?: string;
  readonly at?: string;
  readonly kind?: string;
  readonly status?: string;
  readonly tool?: string;
  readonly mode?: string;
  readonly version?: string;
  readonly resultCount?: number;
  readonly errorCode?: string;
  readonly layer?: string;
  readonly served?: readonly {
    readonly resourceId?: string;
    readonly version?: string;
    readonly shingles?: readonly string[];
  }[];
}

/**
 * Extrait les événements d'un flux de lignes JSON Lines.
 *
 * Ne lève pas sur une ligne non JSON : `stderr` peut porter autre chose, et le
 * test doit distinguer « aucun événement » de « sortie illisible ».
 */
function readEvents(lines: readonly string[]): EventLine[] {
  const events: EventLine[] = [];

  for (const line of lines) {
    let record: Record<string, unknown>;

    try {
      record = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }

    const data = record['data'];

    if (record['message'] !== 'mcp.event' || typeof data !== 'object' || data === null) {
      continue;
    }

    events.push(data as EventLine);
  }

  return events;
}

/** Branche un client MCP sur un serveur en transport mémoire. */
async function connect(
  context: TestServices['services'],
  lines: string[],
): Promise<{ client: Client; close: () => Promise<void> }> {
  const logger = createLogger({ level: 'info', sink: (line) => lines.push(line.trim()) });
  const server = createEktsServer({ context, logger });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'ekts-events-tests', version: '1.0.0' });

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

describe('C-T01 — événements observables', () => {
  let test: TestServices;
  let lines: string[];
  let ids: string[];

  beforeEach(async () => {
    lines = [];
    test = openTestServices({ embeddings: true });

    const seeded = await seedResources(test.services);
    ids = seeded.map((resource) => resource.id);

    await test.services.manager.addResource({
      type: 'other',
      title: 'Note piégée',
      tags: ['canari'],
      content: `Contenu porteur du canari ${CANARY}, jamais recopié dans une trace.`,
    });
  });

  afterEach(() => {
    test.cleanup();
  });

  it('enregistre FTS, lecture, zéro résultat et erreur avec session, outil, statut et version', async () => {
    const linked = await connect(test.services, lines);

    try {
      await linked.client.callTool({
        name: 'search_knowledge',
        arguments: { query: 'SQLite', mode: 'hybrid' },
      });
      await linked.client.callTool({ name: 'get_resource', arguments: { id: ids[0] } });
      await linked.client.callTool({
        name: 'search_knowledge',
        arguments: { query: 'zzzztermeabscentduCorpus', mode: 'fts' },
      });
      await linked.client.callTool({ name: 'get_resource', arguments: { id: randomUUID() } });
    } finally {
      await linked.close();
    }

    const events = readEvents(lines);

    expect(events.map((event) => event.kind)).toEqual(['fts', 'read', 'zero_result', 'error']);

    const sessions = new Set(events.map((event) => event.sessionId));

    expect(sessions.size).toBe(1);
    expect([...sessions][0]).toMatch(/^[\w-]{8,}$/u);
    expect(events.map((event) => event.seq)).toEqual([1, 2, 3, 4]);
    expect(events.every((event) => event.layer === 'server->client')).toBe(true);
    expect(events.every((event) => typeof event.at === 'string')).toBe(true);

    const [fts, read, zero, error] = events;

    expect(fts).toMatchObject({ tool: 'search_knowledge', status: 'ok', mode: 'hybrid' });
    expect(fts?.resultCount).toBeGreaterThan(0);
    expect(fts?.served?.length).toBe(fts?.resultCount ?? -1);
    expect(read).toMatchObject({ tool: 'get_resource', status: 'ok' });
    expect(read?.version).toBeTruthy();
    expect(zero).toMatchObject({ tool: 'search_knowledge', status: 'empty', resultCount: 0 });
    expect(error).toMatchObject({ tool: 'get_resource', status: 'error' });
    expect(error?.errorCode).toBeTruthy();
  });

  it('enregistre le refus de politique dans la même session que les autres événements', async () => {
    const { attachJournal, EventJournal } =
      await import('../../../src/mcp/observability/event-journal.js');
    const logger = createLogger({ level: 'info', sink: (line) => lines.push(line.trim()) });
    const journal = new EventJournal({ sink: (event) => logger.info('mcp.event', { ...event }) });
    const context = attachJournal(test.services, journal);

    const server = createEktsServer({ context, logger });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'ekts-events-tests', version: '1.0.0' });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      await client.callTool({
        name: 'search_knowledge',
        arguments: { query: 'SQLite', mode: 'hybrid' },
      });

      // Le refus intervient avant toute validation d'arguments et tout effet.
      await expect(
        dispatchTool(context, 'create_project', { name: 'interdit' }, READ_POLICY),
      ).rejects.toThrow(/non autorisé/u);
    } finally {
      await client.close();
      await server.close();
    }

    const events = readEvents(lines);

    expect(events.map((event) => event.kind)).toEqual(['fts', 'refusal']);
    expect(new Set(events.map((event) => event.sessionId)).size).toBe(1);
    expect(events[1]).toMatchObject({ tool: 'create_project', status: 'refused' });
    expect(events[1]?.errorCode).toMatch(/-32601|NOT_ALLOWED|METHOD/u);
  });

  it('ne recopie aucun contenu servi dans les traces (canari absent)', async () => {
    const { attachJournal, EventJournal } =
      await import('../../../src/mcp/observability/event-journal.js');
    const logger = createLogger({ level: 'info', sink: (line) => lines.push(line.trim()) });
    const journal = new EventJournal({ sink: (event) => logger.info('mcp.event', { ...event }) });
    const context = attachJournal(test.services, journal);

    const found = await test.services.search.searchFTS('canari', 5);
    const canaryId = found[0]?.resource.id;

    expect(canaryId).toBeTruthy();

    await dispatchTool(context, 'search_knowledge', { query: 'canari', mode: 'fts' }, READ_POLICY);
    await dispatchTool(context, 'get_resource', { id: canaryId }, READ_POLICY);

    const events = readEvents(lines);

    expect(events.map((event) => event.kind)).toEqual(['fts', 'read']);
    expect(events[1]?.served?.[0]?.shingles?.length).toBeGreaterThan(0);
    expect(lines.join('\n')).not.toContain(CANARY);
  });

  it('qualifie une citation depuis un résultat FTS, sans exiger get_resource', async () => {
    const { attachJournal, EventJournal, qualifyCitation } =
      await import('../../../src/mcp/observability/event-journal.js');
    const journal = new EventJournal();
    const context = attachJournal(test.services, journal);

    const payload = (await dispatchTool(
      context,
      'search_knowledge',
      { query: 'SQLite', mode: 'fts' },
      READ_POLICY,
    )) as { results: { resource: { id: string; content?: string }; highlight?: string }[] };

    const first = payload.results[0];

    expect(first).toBeDefined();

    const quote = first?.highlight ?? first?.resource.content ?? '';
    const verdict = qualifyCitation(
      { resourceId: first?.resource.id ?? '', quote },
      journal.events,
    );

    expect(verdict.qualification).toBe('verifiee');
    expect(verdict.evidenceSeq).toBe(1);
  });

  it('distingue non corroborée, version incompatible et indéterminée', async () => {
    const { attachJournal, EventJournal, qualifyCitation } =
      await import('../../../src/mcp/observability/event-journal.js');
    const journal = new EventJournal();
    const context = attachJournal(test.services, journal);

    const payload = (await dispatchTool(context, 'get_resource', { id: ids[0] }, READ_POLICY)) as {
      resource: { id: string; content?: string; updatedAt: string };
    };

    const quote = payload.resource.content ?? '';
    const servedVersion = journal.events[0]?.version ?? '';

    // 1. Source jamais servie : rien ne peut corroborer la citation.
    const never = qualifyCitation({ resourceId: ids[1] ?? randomUUID(), quote }, journal.events);
    expect(never.qualification).toBe('non_corroboree');
    expect(never.reason).toBe('aucun_evenement');

    // 2. Version divergente : la source a été servie, mais pas dans cette version.
    const wrongVersion = qualifyCitation(
      { resourceId: payload.resource.id, quote, version: '1999-01-01T00:00:00.000Z' },
      journal.events,
    );
    expect(wrongVersion.qualification).toBe('version_incompatible');
    expect(servedVersion).not.toBe('1999-01-01T00:00:00.000Z');

    // 3. Trace manquante : journal tronqué, aucune preuve exploitable.
    const truncated = new EventJournal({ capacity: 1 });
    truncated.record({
      kind: 'error',
      status: 'error',
      tool: 'search_knowledge',
      errorCode: 'E_INTERNAL',
    });
    truncated.record({
      kind: 'error',
      status: 'error',
      tool: 'search_knowledge',
      errorCode: 'E_INTERNAL',
    });
    const missing = qualifyCitation({ resourceId: payload.resource.id, quote }, truncated);
    expect(missing.qualification).toBe('indeterminee');
    expect(missing.reason).toBe('trace_incomplete');

    // 4. Source servie mais texte cité absent : la citation embellit.
    const embellished = qualifyCitation(
      {
        resourceId: payload.resource.id,
        quote: 'Une phrase qui ne figure nulle part dans la ressource servie.',
      },
      journal.events,
    );
    expect(embellished.qualification).toBe('non_corroboree');
    expect(embellished.reason).toBe('citation_non_couverte');
  });
});
