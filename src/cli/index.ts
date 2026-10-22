#!/usr/bin/env node
/**
 * Point d'entrée de la CLI `ekts`.
 *
 * Toute la logique vit dans `program.ts` (testable en mémoire) ; ce fichier ne
 * fait que transmettre les arguments du processus et publier le code de sortie.
 */
import { runCli } from './program.js';

process.exitCode = await runCli(process.argv.slice(2));
