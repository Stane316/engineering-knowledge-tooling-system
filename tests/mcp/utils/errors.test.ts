import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import {
  EmbeddingSpaceMismatchError,
  EmbeddingsError,
  FusionError,
  IndexingError,
  NoProviderAvailableError,
  ResourceNotFoundError,
  SearchError,
  ValidationError,
} from '../../../src/shared/errors.js';
import {
  formatIssues,
  invalidParams,
  McpErrorCode,
  toErrorPayload,
  toMcpError,
  toToolErrorResult,
} from '../../../src/mcp/utils/errors.js';

describe('toErrorPayload', () => {
  it('associe une ressource absente au code -32000', () => {
    expect(toErrorPayload(new ResourceNotFoundError('abc'))).toEqual({
      code: -32000,
      message: 'Ressource introuvable : abc',
      data: { resourceId: 'abc' },
    });
  });

  it('associe une validation refusée au code -32001', () => {
    expect(toErrorPayload(new ValidationError(['titre vide', 'type inconnu']))).toEqual({
      code: -32001,
      message: 'Validation échouée : titre vide ; type inconnu',
      data: { issues: ['titre vide', 'type inconnu'] },
    });
  });

  it('associe une requête refusée par le moteur à -32602', () => {
    expect(toErrorPayload(new SearchError('guillemet non fermé'))).toMatchObject({
      code: -32602,
      message: 'Recherche échouée : guillemet non fermé',
      data: { reason: 'SEARCH_FAILED' },
    });
  });

  it('signale les indisponibilités de fournisseur en -32603, avec la sortie fts', () => {
    const payload = toErrorPayload(new EmbeddingsError('aucune clé'));

    expect(payload.code).toBe(-32603);
    expect(payload.message).toContain('mode « fts »');
    expect(payload.data).toEqual({ reason: 'EMBEDDINGS_FAILED' });

    expect(toErrorPayload(new NoProviderAvailableError('embedding', ['openai'])).code).toBe(-32603);
    expect(toErrorPayload(new EmbeddingSpaceMismatchError('a', 'b')).code).toBe(-32603);
  });

  it('garde le code métier des autres erreurs Ekts', () => {
    expect(toErrorPayload(new IndexingError('disque plein'))).toEqual({
      code: -32603,
      message: 'Indexation échouée : disque plein',
      data: { reason: 'INDEXING_FAILED' },
    });
    expect(toErrorPayload(new FusionError('k négatif')).data).toEqual({ reason: 'FUSION_FAILED' });
  });

  it('convertit une erreur standard ou une valeur brute', () => {
    expect(toErrorPayload(new TypeError('boum'))).toEqual({ code: -32603, message: 'boum' });
    expect(toErrorPayload('panne')).toEqual({ code: -32603, message: 'panne' });
  });

  it('préserve une McpError et sa charge utile', () => {
    // `McpError` préfixe lui-même le message par « MCP error <code>: ».
    expect(toErrorPayload(new McpError(-32602, 'paramètres', { champ: 'query' }))).toEqual({
      code: -32602,
      message: 'MCP error -32602: paramètres',
      data: { champ: 'query' },
    });
    expect(toErrorPayload(new McpError(-32602, 'sans données'))).toEqual({
      code: -32602,
      message: 'MCP error -32602: sans données',
    });
  });

  it('ignore une charge utile de McpError qui n’est pas un objet', () => {
    expect(toErrorPayload(new McpError(-32603, 'liste', [1, 2]))).toEqual({
      code: -32603,
      message: 'MCP error -32603: liste',
    });
  });
});

describe('toMcpError', () => {
  it('conserve une McpError existante', () => {
    const original = new McpError(-32602, 'déjà');

    expect(toMcpError(original)).toBe(original);
  });

  it('convertit une erreur métier', () => {
    const converted = toMcpError(new ResourceNotFoundError('x'));

    expect(converted).toBeInstanceOf(McpError);
    expect(converted.code).toBe(McpErrorCode.ResourceNotFound);
    expect(converted.data).toEqual({ resourceId: 'x' });
  });
});

describe('toToolErrorResult', () => {
  it('produit un résultat isError avec le code standardisé', () => {
    const result = toToolErrorResult(new ResourceNotFoundError('abc'));
    const text = result.content[0];

    expect(result.isError).toBe(true);
    expect(text?.type).toBe('text');
    expect(JSON.parse(text?.type === 'text' ? text.text : '')).toEqual({
      error: {
        code: -32000,
        message: 'Ressource introuvable : abc',
        data: { resourceId: 'abc' },
      },
    });
  });
});

describe('invalidParams', () => {
  it('construit une erreur -32602', () => {
    const error = invalidParams('argument manquant', { champ: 'query' });

    expect(error.code).toBe(McpErrorCode.InvalidParams);
    expect(error.data).toEqual({ champ: 'query' });
  });
});

describe('formatIssues', () => {
  it('préfixe chaque message par son chemin', () => {
    expect(
      formatIssues([
        { path: ['query'], message: 'obligatoire' },
        { path: ['tags', 0], message: 'vide' },
        { path: [], message: 'forme invalide' },
      ]),
    ).toBe('query : obligatoire ; tags.0 : vide ; forme invalide');
  });
});
