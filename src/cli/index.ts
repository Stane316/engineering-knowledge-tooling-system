#!/usr/bin/env node
/**
 * Point d'entrée de la CLI `ekts`.
 *
 * Toute la logique vit dans `program.ts` (testable en mémoire) ; ce fichier ne
 * fait que transmettre les arguments du processus et publier le code de sortie.
 */
import { loadEnvFile } from '../shared/env-file.js';
import { runCli } from './program.js';

// `.env` est chargé au point d'entrée (jamais dans une bibliothèque) :
// EKTS_DATA_DIR, OPENAI_API_KEY et EKTS_PROVIDERS_FILE sont ainsi visibles
// avant la construction du runtime.
loadEnvFile();

process.exitCode = await runCli(process.argv.slice(2));
