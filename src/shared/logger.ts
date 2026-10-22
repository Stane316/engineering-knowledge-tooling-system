import pino, { type Logger } from 'pino';

import { config } from './config.js';

/**
 * Crée un logger Pino structuré.
 * `base` est désactivé pour ne pas exposer le PID et le hostname.
 */
export function createLogger(level: string = config.logLevel): Logger {
  return pino({ level, base: undefined });
}

export const logger: Logger = createLogger();
