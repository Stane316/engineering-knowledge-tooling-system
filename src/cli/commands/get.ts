import type { Command } from 'commander';

import { ResourceNotFoundError } from '../../shared/errors.js';
import {
  assessAdmission,
  extractProvenance,
  type Admission,
  type Provenance,
} from '../../shared/provenance.js';
import type { Resource } from '../../shared/validators.js';
import { execute, withOutputFlags } from '../command.js';
import type { Palette } from '../output.js';
import type { CliRuntime } from '../runtime.js';

/**
 * Récupère une ressource par identifiant.
 *
 * @throws {ResourceNotFoundError} Identifiant inconnu (code de sortie 3).
 */
export async function collectGet(runtime: CliRuntime, id: string): Promise<Resource> {
  const services = runtime.openServices({ dataDir: runtime.dataDir, embeddingsMode: 'disabled' });

  try {
    const resource = await services.manager.getResource(id);

    if (resource === null) {
      throw new ResourceNotFoundError(id);
    }

    return resource;
  } finally {
    services.close();
  }
}

/** Rend le bloc de provenance et la décision d'admission au corpus gouverné. */
function renderProvenance(
  provenance: Provenance | undefined,
  admission: Admission,
  palette: Palette,
  lines: string[],
): void {
  if (provenance === undefined) {
    lines.push('  provenance  inconnue (ressource historique)');
  } else {
    lines.push(
      `  provenance  ${provenance.source ?? 'source inconnue'} (version ${provenance.sourceVersion ?? 'inconnue'})`,
      `              droits : lecture ${provenance.rights.read} · redistribution ${provenance.rights.redistribute} · exécution ${provenance.rights.execute}`,
      `              sensibilité ${provenance.sensitivity} · revue ${provenance.review.status}`,
      `              empreinte ${
        provenance.fingerprint === null
          ? 'non calculée'
          : `sha256:${provenance.fingerprint.sha256.slice(0, 12)}…`
      }`,
    );
  }

  lines.push(
    palette.bold(`  corpus      ${admission.admitted ? 'admise' : 'exclue'} — ${admission.reason}`),
  );
}

function renderResource(
  resource: Resource,
  provenance: Provenance | undefined,
  admission: Admission,
  palette: Palette,
): string {
  const lines = [
    palette.bold('Ressource'),
    `  id          ${resource.id}`,
    `  titre       ${resource.title}`,
    `  type        ${resource.type}`,
  ];

  if (resource.url !== undefined) {
    lines.push(`  url         ${resource.url}`);
  }

  lines.push(`  tags        ${resource.tags.length > 0 ? resource.tags.join(', ') : '(aucun)'}`);

  if (resource.content !== undefined) {
    lines.push(`  contenu     ${String(resource.content.length)} caractères`);
  }

  lines.push(`  créée       ${resource.createdAt}`, `  modifiée    ${resource.updatedAt}`);

  renderProvenance(provenance, admission, palette, lines);

  return lines.join('\n');
}

/** Enregistre `ekts get <id>`. */
export function registerGet(program: Command, runtime: CliRuntime): void {
  withOutputFlags(
    program.command('get <id>').description('affiche une ressource par son identifiant (UUID)'),
  ).action(async (id: string, _options: unknown, command: Command) => {
    await execute(command, runtime, async (palette) => {
      const resource = await collectGet(runtime, id);
      const provenance = extractProvenance(resource.metadata);
      const admission = assessAdmission(provenance);

      return {
        human: renderResource(resource, provenance, admission, palette),
        json: { ...resource, admission },
      };
    });
  });
}
