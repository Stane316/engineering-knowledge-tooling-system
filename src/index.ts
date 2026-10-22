import { logger } from './shared/logger.js';
import { VERSION } from './shared/version.js';

export const BANNER = `EKTS v${VERSION}`;

/**
 * Message de démarrage volontairement en ASCII : les journaux techniques sont
 * affichés dans des consoles dont la page de codes n'est pas toujours UTF-8
 * (Windows : CP437/CP850 par défaut), ce qui transforme les accents et tirets
 * cadratins en caractères illisibles. La documentation, elle, reste en UTF-8.
 */
export const STARTUP_MESSAGE = `${BANNER} - squelette initialise (Sprint 1)`;

logger.info({ version: VERSION }, STARTUP_MESSAGE);
