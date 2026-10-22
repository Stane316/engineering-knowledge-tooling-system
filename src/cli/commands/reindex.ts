import type { Command } from 'commander';

import type { IEmbeddingsService } from '../../business/embeddings.js';
import { VectorIndexer, type EmbeddingSpace } from '../../business/vector-indexer.js';
import { reindexVectors, type VectorReindexOutcome } from '../../business/vector-maintenance.js';
import { VectorRepository } from '../../data/vector-repository.js';
import { execute, withOutputFlags } from '../command.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

interface ReindexCliOptions {
  vectors?: boolean;
  force?: boolean;
}

export interface ReindexReport {
  vectors: VectorReindexOutcome | null;
}

/**
 * Recalcule les index dérivés.
 *
 * Avec `--vectors`, réindexe tous les vecteurs avec le fournisseur
 * actuellement configuré. Changer de fournisseur (OpenAI → Gemini par exemple)
 * change l'espace d'embedding : la bascule exige `--force`, car les anciens
 * vecteurs deviennent incomparables et doivent être purgés.
 *
 * L'index plein texte n'est pas reconstruit ici : `npm run db:reindex` le fait
 * hors ligne, sans fournisseur.
 *
 * @throws {EmbeddingsError} Aucun fournisseur d'embeddings configuré.
 * @throws {EmbeddingSpaceMismatchError} Autre espace actif et `--force` absent.
 */
export async function collectReindex(
  runtime: CliRuntime,
  options: ReindexCliOptions,
): Promise<ReindexReport> {
  if (options.vectors !== true) {
    return { vectors: null };
  }

  const services = runtime.openServices({ dataDir: runtime.dataDir, embeddingsMode: 'required' });

  try {
    const storage = new VectorRepository(services.database.connection);
    const indexer = new VectorIndexer(services.embeddings as IEmbeddingsService, storage, {
      space: services.embeddingSpace as EmbeddingSpace,
    });

    const outcome = await reindexVectors({
      manager: services.manager,
      indexer,
      vectors: storage,
      ...(options.force === true ? { force: true } : {}),
    });

    return { vectors: outcome };
  } finally {
    services.close();
  }
}

function renderReindex(report: ReindexReport, palette: Palette): string {
  if (report.vectors === null) {
    return palette.warning(
      'Rien à faire : précisez --vectors (l’index plein texte se reconstruit avec « npm run db:reindex »).',
    );
  }

  const outcome = report.vectors;
  const lines = [
    palette.bold('Réindexation vectorielle'),
    `  espace       ${outcome.space}`,
    `  ressources   ${String(outcome.resources)}`,
    `  vecteurs     ${String(outcome.report.indexed)} réindexés, ${String(outcome.report.failed)} en échec, ${String(outcome.report.skipped)} sans texte`,
    `  durée        ${String(outcome.report.durationMs)} ms`,
  ];

  if (outcome.switched) {
    lines.push(
      '',
      palette.warning(
        `Espace changé : ${String(outcome.removed)} vecteur(s) de l’ancien espace supprimé(s).`,
      ),
    );
  }

  if (outcome.report.failed > 0) {
    lines.push(
      palette.warning(
        `${String(outcome.report.failed)} ressource(s) sans vecteur : relancez la commande une fois le fournisseur rétabli.`,
      ),
    );
  } else {
    lines.push('', palette.success('Index vectoriel à jour.'));
  }

  return lines.join('\n');
}

/** Enregistre `ekts reindex`. */
export function registerReindex(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program
      .command('reindex')
      .description('recalcule les index (vecteurs) avec le fournisseur d’embeddings courant')
      .option('--vectors', 'réindexe tous les vecteurs (appels réseau, coût réel)')
      .option('--force', 'purge l’index d’un autre espace d’embedding avant de réindexer'),
  ).action(async (options: ReindexCliOptions, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const report = await collectReindex(runtime, options);

      return { human: renderReindex(report, palette), json: report };
    });
  });
}
