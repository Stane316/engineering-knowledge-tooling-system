/**
 * Unités du journal d'événements et du rapprochement des citations
 * (Sprint 23-01, C-T01 / C-T02).
 *
 * Ces cas portent sur des fonctions pures : ils vérifient les règles, pas le
 * câblage. L'intégration est couverte par `events-observable.test.ts` et le
 * binaire par `stdio-observability.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import type { McpToolContext } from '../../../src/mcp/context.js';

import {
  attachJournal,
  classifyToolOutcome,
  contentVersion,
  DEFAULT_EVENT_CAPACITY,
  describeServedSource,
  EventJournal,
  MAX_SHINGLES_PER_SOURCE,
  qualifyCitation,
  shingleWords,
  SHINGLE_WORDS,
  type McpEvent,
} from '../../../src/mcp/observability/event-journal.js';

/** Texte de référence : six mots, donc deux fenêtres de cinq. */
const SENTENCE = 'La recherche hybride fusionne le lexical et le vectoriel.';

describe('empreintes de fenêtres', () => {
  it('normalise casse et espaces : deux mises en forme du même texte se rejoignent', () => {
    expect(shingleWords('La  recherche\nhybride fusionne')).toEqual(
      shingleWords('la recherche hybride fusionne'),
    );
  });

  it('reste sensible au contenu : un mot changé change les empreintes', () => {
    expect(shingleWords(SENTENCE)).not.toEqual(shingleWords(`${SENTENCE} Vraiment.`));
  });

  it('accepte un texte plus court que la fenêtre comme une fenêtre unique', () => {
    expect(shingleWords('deux mots')).toHaveLength(1);
    expect(shingleWords('   ')).toEqual([]);
  });

  it('produit exactement mots − fenêtre + 1 empreintes', () => {
    const tokens = SENTENCE.split(' ').length;

    expect(shingleWords(SENTENCE)).toHaveLength(tokens - SHINGLE_WORDS + 1);
  });
});

describe('description d’une source servie', () => {
  it('signale la troncature au-delà de la capacité', () => {
    const long = Array.from({ length: MAX_SHINGLES_PER_SOURCE + 50 }, (_, index) => `mot${index}`);
    const served = describeServedSource('r1', 'v1', long.join(' '));

    expect(served.shingles).toHaveLength(MAX_SHINGLES_PER_SOURCE);
    expect(served.shinglesTruncated).toBe(true);
  });

  it('ne conserve aucune chaîne du contenu, seulement des empreintes', () => {
    const served = describeServedSource('r1', 'v1', SENTENCE);

    expect(served.chars).toBe(SENTENCE.length);
    expect(served.shingles.every((shingle) => /^[0-9a-f]{16}$/u.test(shingle))).toBe(true);
  });
});

describe('version d’une ressource', () => {
  it('privilégie la version de provenance déclarée', () => {
    expect(
      contentVersion({
        updatedAt: '2026-01-01T00:00:00.000Z',
        metadata: { provenance: { sourceVersion: 'v2.3.1' } },
      }),
    ).toBe('v2.3.1');
  });

  it('retombe sur la révision persistée', () => {
    expect(contentVersion({ updatedAt: '2026-01-01T00:00:00.000Z', metadata: {} })).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });

  it('déclare l’inconnu plutôt que d’inventer une version', () => {
    expect(contentVersion({ metadata: {} })).toBe('inconnue');
    expect(contentVersion(null)).toBe('inconnue');
  });
});

describe('classification d’un appel', () => {
  it('ignore un succès sans portée probante', () => {
    expect(classifyToolOutcome({ tool: 'list_projects', result: { projects: [] } })).toBeNull();
  });

  it('classe un zéro résultat avec le mode demandé', () => {
    expect(
      classifyToolOutcome({
        tool: 'search_knowledge',
        args: { query: 'rien', mode: 'fts' },
        result: { results: [] },
      }),
    ).toMatchObject({ kind: 'zero_result', status: 'empty', mode: 'fts', resultCount: 0 });
  });

  it('distingue une erreur d’un refus par le code', () => {
    const notFound = Object.assign(new Error('absente'), { code: 'E_RESOURCE_NOT_FOUND' });
    const refused = Object.assign(new Error('masquée'), { code: -32601 });

    expect(classifyToolOutcome({ tool: 'get_resource', error: notFound })).toMatchObject({
      kind: 'error',
      status: 'error',
      errorCode: 'E_RESOURCE_NOT_FOUND',
    });
    expect(classifyToolOutcome({ tool: 'create_project', error: refused })).toMatchObject({
      kind: 'refusal',
      status: 'refused',
      errorCode: '-32601',
    });
  });
});

describe('journal', () => {
  it('attribue séquence, session, date et couche sans intervention de l’appelant', () => {
    const journal = new EventJournal({
      sessionId: 'session-test',
      now: () => new Date('2026-10-31T10:00:00.000Z'),
    });

    const first = journal.record({ kind: 'fts', status: 'ok', tool: 'search_knowledge' });
    const second = journal.record({ kind: 'read', status: 'ok', tool: 'get_resource' });

    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);
    expect(first.sessionId).toBe('session-test');
    expect(first.at).toBe('2026-10-31T10:00:00.000Z');
    expect(first.layer).toBe('server->client');
  });

  it('signale la troncature au lieu de la masquer', () => {
    const journal = new EventJournal({ capacity: 1 });

    journal.record({ kind: 'fts', status: 'ok', tool: 'search_knowledge' });
    journal.record({ kind: 'error', status: 'error', tool: 'get_resource', errorCode: 'E_X' });

    expect(journal.events).toHaveLength(1);
    expect(journal.truncated).toBe(true);
    expect(journal.events[0]?.seq).toBe(2);
  });

  it('recopie chaque événement sur la destination fournie', () => {
    const seen: McpEvent[] = [];
    const journal = new EventJournal({ sink: (event) => seen.push(event) });

    journal.record({ kind: 'refusal', status: 'refused', tool: 'create_project' });

    expect(seen).toHaveLength(1);
    expect(seen[0]?.seq).toBe(1);
    expect(new EventJournal().events).toHaveLength(0);
    expect(DEFAULT_EVENT_CAPACITY).toBeGreaterThan(1);
  });

  it('attache le journal au contexte sans le muter', () => {
    const context = { manager: {} } as unknown as McpToolContext;
    const journal = new EventJournal();
    const decorated = attachJournal(context, journal);

    expect(decorated.observability.journal).toBe(journal);
    expect((context as { observability?: unknown }).observability).toBeUndefined();
  });
});

describe('qualification des citations', () => {
  /** Journal contenant une lecture de `r1` en version `v1`. */
  function serving(version = 'v1'): EventJournal {
    const journal = new EventJournal({ sessionId: 's' });

    journal.record({
      kind: 'read',
      status: 'ok',
      tool: 'get_resource',
      version,
      served: [describeServedSource('r1', version, SENTENCE)],
    });

    return journal;
  }

  it('vérifie une citation couverte mot pour mot', () => {
    expect(qualifyCitation({ resourceId: 'r1', quote: SENTENCE }, serving())).toEqual({
      qualification: 'verifiee',
      reason: 'couverture_exacte',
      evidenceSeq: 1,
    });
  });

  it('refuse de conclure sur une citation plus courte que la fenêtre', () => {
    expect(qualifyCitation({ resourceId: 'r1', quote: 'le vectoriel' }, serving()).reason).toBe(
      'citation_trop_courte',
    );
  });

  it('ne corrobore pas une source qui n’a jamais été servie', () => {
    expect(qualifyCitation({ resourceId: 'r2', quote: SENTENCE }, serving())).toMatchObject({
      qualification: 'non_corroboree',
      reason: 'aucun_evenement',
    });
  });

  it('déclare l’incompatibilité de version avant de conclure à l’absence', () => {
    expect(
      qualifyCitation({ resourceId: 'r1', quote: SENTENCE, version: 'v0' }, serving()),
    ).toMatchObject({ qualification: 'version_incompatible', reason: 'version_divergente' });
  });

  it('reste indéterminée quand la trace ne permet pas de conclure', () => {
    const journal = new EventJournal({ capacity: 1 });

    journal.record({ kind: 'error', status: 'error', tool: 'search_knowledge' });
    journal.record({ kind: 'error', status: 'error', tool: 'search_knowledge' });

    expect(qualifyCitation({ resourceId: 'r1', quote: SENTENCE }, journal)).toMatchObject({
      qualification: 'indeterminee',
      reason: 'trace_incomplete',
    });
  });

  it('reste indéterminée quand les empreintes de la source ont été tronquées', () => {
    const journal = new EventJournal();
    const long = Array.from({ length: MAX_SHINGLES_PER_SOURCE + 50 }, () => 'mot').join(' ');

    journal.record({
      kind: 'read',
      status: 'ok',
      tool: 'get_resource',
      served: [describeServedSource('r1', 'v1', `${long} phrase absente de la trace`)],
    });

    expect(
      qualifyCitation(
        { resourceId: 'r1', quote: 'phrase absente de la trace et du corpus' },
        journal,
      ).qualification,
    ).toBe('indeterminee');
  });
});
