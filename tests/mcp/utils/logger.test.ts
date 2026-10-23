import { describe, expect, it, vi } from 'vitest';

import { EmbeddingsError } from '../../../src/shared/errors.js';
import {
  createLogger,
  DEFAULT_LOG_LEVEL,
  resolveLogLevel,
  SILENT_LOGGER,
} from '../../../src/mcp/utils/logger.js';

const FIXED_DATE = new Date('2026-10-23T10:00:00.000Z');

describe('resolveLogLevel', () => {
  it('reconnaît les niveaux et les synonymes', () => {
    expect(resolveLogLevel('debug')).toBe('debug');
    expect(resolveLogLevel(' INFO ')).toBe('info');
    expect(resolveLogLevel('error')).toBe('error');
    expect(resolveLogLevel('silent')).toBe('silent');
    expect(resolveLogLevel('off')).toBe('silent');
    expect(resolveLogLevel('none')).toBe('silent');
  });

  it('retombe sur info pour une valeur absente ou inconnue', () => {
    expect(resolveLogLevel(undefined)).toBe(DEFAULT_LOG_LEVEL);
    expect(resolveLogLevel('')).toBe(DEFAULT_LOG_LEVEL);
    expect(resolveLogLevel('verbeux')).toBe(DEFAULT_LOG_LEVEL);
  });
});

describe('createLogger', () => {
  it('émet une ligne JSON avec horodatage et données', () => {
    const lines: string[] = [];
    const logger = createLogger({
      level: 'debug',
      sink: (line) => lines.push(line),
      now: () => FIXED_DATE,
    });

    logger.debug('réception', { method: 'tools/call', id: 7 });

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      level: 'debug',
      message: 'réception',
      timestamp: '2026-10-23T10:00:00.000Z',
      data: { method: 'tools/call', id: 7 },
    });
  });

  it('filtre les niveaux inférieurs au seuil', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'info', sink: (line) => lines.push(line) });

    logger.debug('invisible');
    logger.info('visible');

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '').level).toBe('info');
  });

  it('sérialise une erreur métier sans trace ni secret', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'error', sink: (line) => lines.push(line) });

    logger.error('échec', new EmbeddingsError('clé refusée'), { tool: 'search_knowledge' });

    const record = JSON.parse(lines[0] ?? '');
    expect(record.error).toEqual({
      name: 'EmbeddingsError',
      message: 'Embeddings échoués : clé refusée',
      code: 'EMBEDDINGS_FAILED',
    });
    expect(record.data).toEqual({ tool: 'search_knowledge' });
    expect(JSON.stringify(record)).not.toContain('at ');
  });

  it('accepte une erreur quelconque, un texte brut ou l’absence d’erreur', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'error', sink: (line) => lines.push(line) });

    logger.error('type', new TypeError('boum'));
    logger.error('texte', 'panne');
    logger.error('rien');

    expect(JSON.parse(lines[0] ?? '').error).toEqual({ name: 'TypeError', message: 'boum' });
    expect(JSON.parse(lines[1] ?? '').error).toEqual({ message: 'panne' });
    expect(JSON.parse(lines[2] ?? '').error).toBeUndefined();
  });

  it('n’écrit rien en mode silencieux', () => {
    const sink = vi.fn();
    const logger = createLogger({ level: 'silent', sink });

    logger.debug('a');
    logger.info('b');
    logger.error('c', new Error('d'));

    expect(sink).not.toHaveBeenCalled();
    expect(logger.level).toBe('silent');
  });

  it('applique le niveau info par défaut', () => {
    const lines: string[] = [];
    const logger = createLogger({ sink: (line) => lines.push(line) });

    logger.debug('masqué');
    logger.info('visible');

    expect(logger.level).toBe('info');
    expect(lines).toHaveLength(1);
  });

  it('écrit sur stderr par défaut, jamais sur stdout', () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    try {
      createLogger({ level: 'info' }).info('message');

      expect(stderr).toHaveBeenCalledTimes(1);
      expect(stdout).not.toHaveBeenCalled();
    } finally {
      stderr.mockRestore();
      stdout.mockRestore();
    }
  });

  it('expose un journal silencieux partageable', () => {
    expect(SILENT_LOGGER.level).toBe('silent');
    expect(SILENT_LOGGER.info('x')).toBeUndefined();
    expect(SILENT_LOGGER.error('x', new Error('y'))).toBeUndefined();
  });
});
