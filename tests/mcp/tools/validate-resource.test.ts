import { describe, expect, it } from 'vitest';

import { ValidateResourceInput } from '../../../src/mcp/schemas/tool-schemas.js';
import { executeValidateResource } from '../../../src/mcp/tools/validate-resource.js';

/** Valide une donnée en passant par le schéma d'entrée, comme le fait MCP. */
function validate(data: unknown): ReturnType<typeof executeValidateResource> {
  return executeValidateResource(ValidateResourceInput.parse({ data }));
}

describe('validate_resource', () => {
  it('accepte une ressource minimale', () => {
    expect(validate({ type: 'article', title: 'Mon article' })).toEqual({ valid: true });
  });

  it('accepte une ressource complète', () => {
    expect(
      validate({
        type: 'tool',
        title: 'sqlite-vec',
        url: 'https://example.com/sqlite-vec',
        tags: ['sqlite', 'vecteurs'],
        metadata: { licence: 'MIT' },
        content: 'Extension de recherche vectorielle.',
      }),
    ).toEqual({ valid: true });
  });

  it('refuse un type inconnu', () => {
    const result = validate({ type: 'podcast', title: 'x' });

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain('type');
  });

  it('refuse un titre vide et une URL invalide', () => {
    const result = validate({ type: 'article', title: '   ', url: 'ftp://exemple' });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors?.join(' ')).toContain('titre');
  });

  it('refuse une donnée qui n’est pas un objet', () => {
    const result = validate('texte brut');

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0]).toContain('object');
  });

  it('refuse un tag vide', () => {
    const result = validate({ type: 'article', title: 'x', tags: ['ok', '  '] });

    expect(result.valid).toBe(false);
    expect(result.errors?.join(' ')).toContain('tags.1');
  });
});
