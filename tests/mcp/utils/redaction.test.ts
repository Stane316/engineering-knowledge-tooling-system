/**
 * Unités du caviardage des traces (Sprint 23-02, C-T03).
 *
 * Ces cas fixent trois propriétés que la revue humaine doit pouvoir relire :
 * le marqueur est **fixe** (aucune empreinte), le caviardage ne dépend pas de
 * la casse ni de la forme exacte du message, et il ne **mute pas** les objets
 * journalisés — une trace ne doit jamais altérer l'état applicatif.
 */

import { describe, expect, it } from 'vitest';

import {
  createRedactor,
  REDACTION_MARKER,
  sensitiveEnvValues,
} from '../../../src/mcp/utils/redaction.js';

/** Clé factice assez longue pour déclencher la règle. */
const KEY = 'clef-factice-de-test-0123456789';

describe('valeurs sensibles de l’environnement', () => {
  it('retient les noms qui désignent un secret, écarte le reste', () => {
    const values = sensitiveEnvValues({
      EKTS_EMBEDDINGS_API_KEY: KEY,
      GITHUB_TOKEN: 'gh-token-factice-0001',
      DB_PASSWORD: 'motdepasse-factice',
      AUTH_HEADER: 'valeur-autorisation',
      PATH: '/usr/local/bin:/usr/bin',
      MCP_LOG_LEVEL: 'info',
    } as NodeJS.ProcessEnv);

    expect(values).toHaveLength(4);
    expect(values).toContain(KEY);
    expect(values).not.toContain('/usr/local/bin:/usr/bin');
    expect(values).not.toContain('info');
  });

  it('écarte une valeur trop courte pour être un secret réel', () => {
    expect(sensitiveEnvValues({ API_KEY: 'court' } as NodeJS.ProcessEnv)).toEqual([]);
  });

  it('trie du plus long au plus court, pour ne pas laisser de fragment', () => {
    const values = sensitiveEnvValues({
      LONG_KEY: 'abcdefghijklmnop',
      SHORT_KEY: 'abcdefgh',
    } as NodeJS.ProcessEnv);

    expect(values).toEqual(['abcdefghijklmnop', 'abcdefgh']);
  });
});

describe('caviardage d’un texte', () => {
  it('remplace la valeur connue par un marqueur fixe, jamais une empreinte', () => {
    const redactor = createRedactor({ env: {}, secrets: [KEY] });
    const result = redactor.redact(`clé reçue : ${KEY} (refusée)`);

    expect(result).toBe(`clé reçue : ${REDACTION_MARKER} (refusée)`);
    expect(result).not.toMatch(/[0-9a-f]{16,}/u);
  });

  it('reconnaît les formes de fournisseurs sans les connaître à l’avance', () => {
    const redactor = createRedactor({ env: {} });

    expect(redactor.redact('token sk-proj-abcdefghijklmnop42 refusé')).toContain(REDACTION_MARKER);
    expect(redactor.redact('ghp_abcdefghijklmnopqrst')).toBe(REDACTION_MARKER);
    expect(redactor.redact('Authorization: Bearer abcdefghijklmnop')).toBe(
      `Authorization: ${REDACTION_MARKER}`,
    );
    expect(redactor.redact('xoxb-123456789012-abcdef')).toBe(REDACTION_MARKER);
  });

  it('ne touche pas un texte sans secret', () => {
    const redactor = createRedactor({ env: {}, secrets: [KEY] });

    expect(redactor.redact('Recherche FTS terminée en 3 ms.')).toBe(
      'Recherche FTS terminée en 3 ms.',
    );
  });

  it('est idempotent : caviarder deux fois ne change rien de plus', () => {
    const redactor = createRedactor({ env: {}, secrets: [KEY] });
    const once = redactor.redact(`a ${KEY} b`);

    expect(redactor.redact(once)).toBe(once);
  });

  it('ne laisse aucun fragment de la clé la plus longue', () => {
    const redactor = createRedactor({ env: {}, secrets: [KEY, KEY.slice(0, 10)] });
    const result = redactor.redact(`valeur ${KEY}`);

    expect(result).not.toContain(KEY.slice(0, 10));
    expect(result).toBe(`valeur ${REDACTION_MARKER}`);
  });
});

describe('caviardage d’une structure', () => {
  it('descend dans les objets et les tableaux, sans muter l’entrée', () => {
    const redactor = createRedactor({ env: {}, secrets: [KEY] });
    const input = {
      tool: 'search_knowledge',
      detail: { note: `clé ${KEY}`, durations: [1, 2, 3] },
      nested: [{ message: new Error(`échec ${KEY}`) }],
    };

    const output = redactor.redactData(input) as Record<string, unknown>;

    expect(JSON.stringify(output)).not.toContain(KEY);
    expect(JSON.stringify(output)).toContain(REDACTION_MARKER);
    // L'entrée d'origine reste intacte : la trace ne modifie pas l'état.
    expect(JSON.stringify(input)).toContain(KEY);
  });

  it('laisse intacts les nombres, les booléens et les valeurs absentes', () => {
    const redactor = createRedactor({ env: {} });

    expect(redactor.redactData({ count: 3, ok: true, absent: null })).toEqual({
      count: 3,
      ok: true,
      absent: null,
    });
    expect(redactor.redactData(42)).toBe(42);
  });
});
