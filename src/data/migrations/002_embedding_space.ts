import type Database from 'better-sqlite3';

import { TABLES } from '../../shared/constants.js';

/**
 * Migration 002 — traçabilité de l'espace d'embedding.
 *
 * **Problème résolu.** Depuis le Sprint 4, l'index vectoriel peut être alimenté
 * par plusieurs fournisseurs (OpenAI, OpenRouter, Gemini, Novita…). Or deux
 * modèles différents produisent des vecteurs **incomparables** : après une
 * bascule, les anciens vecteurs ne sont plus dans le même repère que les
 * nouveaux, et la recherche renvoie des résultats faux *sans aucune erreur*.
 *
 * La table `embedding_spaces` enregistre, pour chaque espace canonique
 * (`openai/text-embedding-3-small`, `baai/bge-m3`…), le fournisseur et le
 * modèle qui l'ont produit. L'index devient auto-descriptif :
 * `VectorRepository.assertSpace()` refuse d'écrire dans un index construit avec
 * un autre modèle, et `npm run db:inspect` l'affiche.
 *
 * Choix de conception :
 * - **une seule ligne active** : un index vectoriel ne peut être comparé qu'à
 *   lui-même. `bindSpace()` remplace donc la liaison précédente au lieu
 *   d'accumuler un historique ambigu ;
 * - le nombre de vecteurs n'est **pas** stocké : il serait faux dès la première
 *   écriture concurrente, et `SELECT count(*)` sur `vec0` reste bon marché à
 *   l'échelle visée (100 000 lignes) ;
 * - aucune migration destructive : la table est strictement additive.
 */
export function migration002EmbeddingSpace(connection: Database.Database): void {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLES.embeddingSpaces} (
      space         TEXT PRIMARY KEY,
      provider      TEXT NOT NULL,
      model         TEXT NOT NULL,
      dimensions    INTEGER NOT NULL CHECK (dimensions > 0),
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );
  `);
}
