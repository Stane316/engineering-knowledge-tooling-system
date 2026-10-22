import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Charge `.env` dans `process.env`, sans dépendance.
 *
 * Depuis Node 20.12, `process.loadEnvFile()` fait exactement ce que faisait
 * `dotenv`, avec la même syntaxe (`CLE=valeur`, commentaires `#`). La mission du
 * Sprint 4 interdit d'installer de nouvelles dépendances : cette fonction la
 * remplace intégralement.
 *
 * **Pourquoi un chargement explicite ?** Une bibliothèque ne doit pas modifier
 * l'environnement global par effet de bord : les tests injectent leur propre
 * `env`. Le chargement est donc déclenché au point d'entrée (script, CLI), ou
 * par les fabriques **uniquement lorsqu'aucun `env` n'est fourni**.
 *
 * Les variables déjà définies dans l'environnement **ne sont jamais écrasées** :
 * `OPENAI_API_KEY=xxx npm start` reste prioritaire sur `.env`, ce qui permet de
 * surcharger ponctuellement sans éditer le fichier.
 *
 * @param file - Chemin du fichier (défaut : `.env` du répertoire courant).
 * @returns `true` si un fichier a été chargé.
 */
export function loadEnvFile(file: string = join(process.cwd(), '.env')): boolean {
  if (!existsSync(file)) {
    return false;
  }

  if (typeof process.loadEnvFile !== 'function') {
    return false;
  }

  try {
    process.loadEnvFile(file);
    return true;
  } catch {
    // Fichier illisible ou syntaxe invalide : on continue avec l'environnement
    // existant. Une clé manquante produira une erreur explicite au premier appel.
    return false;
  }
}
