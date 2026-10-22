import { logger } from './shared/logger.js';
import { VERSION } from './shared/version.js';

export const BANNER = `EKTS v${VERSION}`;

logger.info({ version: VERSION }, `${BANNER} — squelette initialisé (Sprint 1)`);
