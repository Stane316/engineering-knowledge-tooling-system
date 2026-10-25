import { readFile, writeFile } from 'node:fs/promises';

import type { Command } from 'commander';

import { openDatabase } from '../../data/database.js';
import { TemplateService } from '../../templates/template-service.js';
import { ValidationError } from '../../shared/errors.js';
import { execute, withOutputFlags, type CommandResult } from '../command.js';
import type { CliRuntime } from '../runtime.js';
import { renderTable } from '../output.js';

import type { TemplateCategory } from '../../templates/template.types.js';
import { TEMPLATE_CATEGORIES } from '../../templates/template.types.js';

interface TemplateServices {
  readonly service: TemplateService;
  close(): void;
}

/**
 * Ouvre les services templates sur les bases locales du runtime.
 *
 * Le constructeur de {@link TemplateService} sème les 10 prédéfinis
 * (idempotent, C17.2) : `ekts template list` les montre dès la première
 * invocation.
 *
 * @param runtime - Runtime CLI (`dataDir`).
 * @returns Services prêts à l'emploi (fermeture obligatoire en `finally`).
 */
function openTemplateServices(runtime: CliRuntime): TemplateServices {
  const database = openDatabase({ dataDir: runtime.dataDir });
  return {
    service: new TemplateService(database.connection),
    close: () => database.close(),
  };
}

/** Valide une catégorie (code 4 si hors liste). */
function parseCategory(raw: string): TemplateCategory {
  if (!TEMPLATE_CATEGORIES.includes(raw as TemplateCategory)) {
    throw new ValidationError([
      `catégorie invalide « ${raw} » (valeurs acceptées : ${TEMPLATE_CATEGORIES.join(', ')})`,
    ]);
  }
  return raw as TemplateCategory;
}

/** Parse un entier borné (code 4 sinon). */
function parseIntOption(raw: string, label: string, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError([
      `${label} invalide « ${raw} » (entier entre ${String(min)} et ${String(max)} attendu)`,
    ]);
  }
  return value;
}

/** Valide un identifiant UUID (code 4 sinon). */
function requireUuid(raw: string, label: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(raw)) {
    throw new ValidationError([`${label} invalide « ${raw} » (UUID attendu)`]);
  }
  return raw;
}

/** Parse une option JSON (code 4 sinon, C17.20). */
function parseJsonOption(raw: string | undefined, label: string): unknown | undefined {
  if (raw === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError([`${label} : JSON invalide`]);
  }
}

/** Parse une liste CSV non vide (code 4 sinon). */
function parseCsvOption(raw: string | undefined, label: string): string[] | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    throw new ValidationError([`${label} vide (liste attendue)`]);
  }
  return parts;
}

/**
 * Commandes `ekts template|tpl list|show|apply|create|delete|export|import`
 * (Sprint 17-3, C17.6 → C17.7, export/import C17.5).
 *
 * Codes retour (contrat maison S13-S16) :
 * - `0` succès ;
 * - `1` erreur d'exécution (lecture/écriture de fichier…) ;
 * - `2` usage (Commander) ;
 * - `3` ressource introuvable (jamais ici : le module templates utilise
 *   `ValidationError` → 4, cf. §Écarts) ;
 * - `4` entrée invalide (UUID, catégorie, entier borné, JSON, template
 *   absent ou builtin immuable via `ValidationError`).
 *
 * Écart P3 : le spec utilise `getDatabase()`/`ProjectRepository(db)`/
 * `process.exit(1)` unifié — patterns maison `execute`/`CommandResult`/
 * `openTemplateServices` appliqués ; `TemplateService` construit déjà son
 * `ProjectRepository`.
 *
 * @param program - Programme Commander racine.
 * @param runtime - Sorties, `dataDir`, horloge du runtime CLI.
 */
export function registerTemplateCommands(program: Command, runtime: CliRuntime): void {
  const tpl = program
    .command('template')
    .alias('tpl')
    .description('gérer les templates de projets');

  // --- template list ---
  withOutputFlags(
    tpl
      .command('list')
      .description('lister les templates disponibles')
      .option('-c, --category <cat>', `catégorie (${TEMPLATE_CATEGORIES.join(', ')})`)
      .option('--builtin', 'uniquement les templates prédéfinis')
      .option('--custom', 'uniquement les templates personnalisés')
      .option('-n, --limit <n>', 'nombre maximum de templates', '50'),
  ).action(async (options: Record<string, string | boolean>) => {
    await execute(
      commandOf(program, 'template', 'list'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openTemplateServices(runtime);
        try {
          if (options.builtin === true && options.custom === true) {
            throw new ValidationError(['--builtin et --custom sont exclusifs']);
          }
          const category =
            options.category === undefined ? undefined : parseCategory(String(options.category));
          const limit = parseIntOption(String(options.limit ?? '50'), '--limit', 1, 500);
          const templates = services.service.listTemplates({
            ...(category === undefined ? {} : { category }),
            ...(options.builtin === true
              ? { isBuiltin: true }
              : options.custom === true
                ? { isBuiltin: false }
                : {}),
            limit,
          });

          const human =
            templates.length === 0
              ? palette.warning('Aucun template trouvé.')
              : [
                  renderTable({
                    columns: [
                      { header: 'ID' },
                      { header: 'Nom' },
                      { header: 'Catégorie' },
                      { header: 'Type' },
                      { header: 'BP' },
                      { header: 'Règles' },
                    ],
                    rows: templates.map((template) => [
                      template.id.slice(0, 8),
                      template.name.slice(0, 30),
                      template.category,
                      template.isBuiltin ? '📦' : '✏️',
                      String(template.bestPracticeIds.length),
                      String(template.recommendationRuleIds.length),
                    ]),
                  }),
                  '',
                  `${String(templates.length)} template(s)`,
                ].join('\n');

          return {
            human,
            json: {
              count: templates.length,
              templates: templates.map((template) => ({
                id: template.id,
                name: template.name,
                category: template.category,
                description: template.description,
                isBuiltin: template.isBuiltin,
                bestPracticeCount: template.bestPracticeIds.length,
                ruleCount: template.recommendationRuleIds.length,
              })),
            },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- template show <id> ---
  withOutputFlags(tpl.command('show <id>').description("afficher le détail d'un template")).action(
    async (id: string) => {
      await execute(
        commandOf(program, 'template', 'show'),
        runtime,
        async (): Promise<CommandResult> => {
          const services = openTemplateServices(runtime);
          try {
            requireUuid(id, 'templateId');
            const template = services.service.getTemplate(id);
            if (template === null) {
              throw new ValidationError([`template ${id} introuvable`]);
            }

            const human = [
              `=== ${template.name} ===`,
              '',
              `ID : ${template.id}`,
              `Catégorie : ${template.category}`,
              `Type : ${template.isBuiltin ? '📦 Prédéfini' : '✏️ Personnalisé'}`,
              `Description : ${template.description}`,
              ...(template.config.priorityDimensions === undefined
                ? []
                : [`Dimensions prioritaires : ${template.config.priorityDimensions.join(', ')}`]),
              ...(template.config.tags === undefined
                ? []
                : [`Tags : ${template.config.tags.join(', ')}`]),
              `Bonnes pratiques : ${String(template.bestPracticeIds.length)}`,
              `Règles : ${String(template.recommendationRuleIds.length)}`,
              `Créé : ${template.createdAt}`,
              `Modifié : ${template.updatedAt}`,
            ].join('\n');

            return { human, json: { template } };
          } finally {
            services.close();
          }
        },
      );
    },
  );

  // --- template apply <templateId> ---
  withOutputFlags(
    tpl
      .command('apply <templateId>')
      .description('créer un projet depuis un template')
      .requiredOption('--name <name>', 'nom du projet')
      .requiredOption('--url <url>', 'URL du projet')
      .option('--description <desc>', 'description du projet')
      .option('--config <json>', 'configuration JSON personnalisée (overrides)'),
  ).action(async (templateId: string, options: Record<string, string>) => {
    await execute(
      commandOf(program, 'template', 'apply'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openTemplateServices(runtime);
        try {
          requireUuid(templateId, 'templateId');
          // Entrées validées AVANT la ressource (ordre maison des validateurs).
          const configOverride = parseJsonOption(options.config, '--config');
          if (
            configOverride !== undefined &&
            (typeof configOverride !== 'object' ||
              configOverride === null ||
              Array.isArray(configOverride))
          ) {
            throw new ValidationError(['--config doit être un objet JSON']);
          }
          const projectName = String(options.name ?? '');
          if (projectName.trim() === '') {
            throw new ValidationError(['--name ne peut pas être vide']);
          }

          const result = services.service.applyTemplate({
            templateId,
            projectName,
            projectUrl: String(options.url ?? ''),
            ...(options.description === undefined
              ? {}
              : { projectDescription: options.description }),
            ...(configOverride === undefined
              ? {}
              : { overrides: { config: configOverride as Record<string, never> } }),
          });

          const human = [
            palette.success('✅ Projet créé depuis le template'),
            `   ID : ${result.projectId}`,
            `   Nom : ${result.projectName}`,
            `   Bonnes pratiques associées : ${String(result.bestPracticesAssociated)}`,
            `   Règles créées : ${String(result.rulesCreated)}`,
            `   Durée : ${String(result.durationMs)} ms`,
          ].join('\n');

          return { human, json: { ...result } };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- template create ---
  withOutputFlags(
    tpl
      .command('create')
      .description('créer un template personnalisé')
      .requiredOption('-n, --name <name>', 'nom du template')
      .requiredOption('-d, --description <desc>', 'description du template')
      .requiredOption('-c, --category <cat>', `catégorie (${TEMPLATE_CATEGORIES.join(', ')})`)
      .option('--config <json>', 'configuration JSON du template')
      .option('--bp-ids <ids>', 'IDs de bonnes pratiques (séparés par virgules)')
      .option('--rule-ids <ids>', 'IDs de règles de recommandation (séparés par virgules)'),
  ).action(async (options: Record<string, string>) => {
    await execute(
      commandOf(program, 'template', 'create'),
      runtime,
      async (): Promise<CommandResult> => {
        const services = openTemplateServices(runtime);
        try {
          const category = parseCategory(String(options.category));
          const config = parseJsonOption(options.config, '--config');
          if (
            config !== undefined &&
            (typeof config !== 'object' || config === null || Array.isArray(config))
          ) {
            throw new ValidationError(['--config doit être un objet JSON']);
          }
          const bestPracticeIds = parseCsvOption(options.bpIds, '--bp-ids');
          const recommendationRuleIds = parseCsvOption(options.ruleIds, '--rule-ids');

          const template = services.service.createTemplate({
            name: String(options.name ?? ''),
            description: String(options.description ?? ''),
            category,
            ...(config === undefined ? {} : { config: config as Record<string, never> }),
            ...(bestPracticeIds === undefined ? {} : { bestPracticeIds }),
            ...(recommendationRuleIds === undefined ? {} : { recommendationRuleIds }),
          });

          return {
            human: [
              '✅ Template créé',
              `   ID : ${template.id}`,
              `   Nom : ${template.name}`,
              `   Catégorie : ${template.category}`,
            ].join('\n'),
            json: { template },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- template delete <id> ---
  withOutputFlags(
    tpl.command('delete <id>').description('supprimer un template personnalisé'),
  ).action(async (id: string) => {
    await execute(
      commandOf(program, 'template', 'delete'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openTemplateServices(runtime);
        try {
          requireUuid(id, 'templateId');
          services.service.deleteTemplate(id);
          return {
            human: palette.success(`✅ Template supprimé : ${id}`),
            json: { deleted: true, id },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- template export <id> <file> ---
  withOutputFlags(
    tpl.command('export <id> <file>').description('exporter un template en JSON'),
  ).action(async (id: string, file: string) => {
    await execute(
      commandOf(program, 'template', 'export'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openTemplateServices(runtime);
        try {
          requireUuid(id, 'templateId');
          const json = services.service.exportTemplate(id);
          await writeFile(file, json, 'utf-8');
          return {
            human: palette.success(`✅ Template exporté vers ${file}`),
            json: { exported: true, id, file },
          };
        } finally {
          services.close();
        }
      },
    );
  });

  // --- template import <file> ---
  withOutputFlags(
    tpl.command('import <file>').description('importer un template depuis un JSON'),
  ).action(async (file: string) => {
    await execute(
      commandOf(program, 'template', 'import'),
      runtime,
      async (palette): Promise<CommandResult> => {
        const services = openTemplateServices(runtime);
        try {
          const raw = await readFile(file, 'utf-8');
          const template = services.service.importTemplate(raw);
          return {
            human: [
              palette.success('✅ Template importé'),
              `   ID : ${template.id}`,
              `   Nom : ${template.name}`,
              `   Catégorie : ${template.category}`,
            ].join('\n'),
            json: { template },
          };
        } finally {
          services.close();
        }
      },
    );
  });
}

/**
 * Récupère la sous-commande courante par chemin (pour `resolveOutputFlags` :
 * les options `--json`/`--colors` sont héritées du programme racine).
 *
 * @param program - Programme racine.
 * @param path - Chemin de noms de sous-commandes.
 * @returns La commande trouvée.
 * @throws {Error} Chemin invalide (erreur de programmation interne).
 */
function commandOf(program: Command, ...path: string[]): Command {
  let current: Command = program;
  for (const name of path) {
    const next = current.commands.find((candidate) => candidate.name() === name);
    if (next === undefined) {
      throw new Error(`commande introuvable : ${path.join(' ')}`);
    }
    current = next;
  }
  return current;
}
